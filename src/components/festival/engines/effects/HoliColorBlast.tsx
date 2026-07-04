'use client';

import { useEffect, useRef, useCallback } from 'react';

/* ─────────────────── TYPES ─────────────────── */

interface Particle {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  r: number; g: number; b: number;
  type: 'rocket_trail' | 'color_burst' | 'gulal' | 'flash' | 'splash' | 'ambient';
  gravity: number;
  friction: number;
  opacity?: number;
  wobble?: number;
  wobbleSpeed?: number;
}

interface Rocket {
  id: number;
  startX: number;
  targetY: number;
  cx: number; cy: number;
  phase: number;
  duration: number;
  drift: number;
  color: [number, number, number];
  launched: boolean;
  exploded: boolean;
}

/* ─────────────────── HOLI NEON PALETTE ─────────────────── */

const HOLI_COLORS: [number, number, number][] = [
  [255, 0, 110],    // Hot Pink #ff006e
  [255, 190, 11],   // Yellow #ffbe0b
  [0, 245, 212],    // Cyan #00f5d4
  [131, 56, 236],   // Purple #8338ec
  [255, 84, 0],     // Orange #ff5400
  [6, 214, 160],    // Green #06d6a0
  [255, 107, 129],  // Coral #ff6b81
  [72, 219, 251],   // Sky #48dbfb
];

/* ─────────────────── SOUND ENGINE (Holi Puffs) ─────────────────── */

class HoliSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    const unlock = () => this.ensure();
    const opts = { passive: true, capture: true } as AddEventListenerOptions;
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(e => {
      document.addEventListener(e, unlock, opts);
    });
  }

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35;
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -20; comp.knee.value = 12;
        comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.25;
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  }

  /* SHUIII — Rocket whoosh */
  whoosh(variant = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const dur = 0.55 + variant * 0.03;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 6 + variant;
    bp.frequency.setValueAtTime(200 + variant * 30, now);
    bp.frequency.exponentialRampToValueAtTime(2800 + variant * 200, now + dur * 0.5);
    bp.frequency.exponentialRampToValueAtTime(600, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.13, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + dur + 0.01);
  }

  /* PUFF — Color dhamaka (softer than Diwali boom) */
  puff(variant = 0, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const pitch = 0.9 + variant * 0.05;

    // Sub thud
    const sub = ctx.createOscillator(); sub.type = 'sine';
    sub.frequency.setValueAtTime(55 * pitch, t);
    sub.frequency.exponentialRampToValueAtTime(22, t + 0.45);
    const sG = ctx.createGain();
    sG.gain.setValueAtTime(0.3, t);
    sG.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    sub.connect(sG); sG.connect(this.master);
    sub.start(t); sub.stop(t + 0.5);

    // Color whoosh
    const bLen = Math.floor(ctx.sampleRate * 0.35);
    const bBuf = ctx.createBuffer(1, bLen, ctx.sampleRate);
    const bd = bBuf.getChannelData(0);
    for (let i = 0; i < bLen; i++) bd[i] = Math.random() * 2 - 1;
    const bSrc = ctx.createBufferSource(); bSrc.buffer = bBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(150, t + 0.25);
    const bG = ctx.createGain();
    bG.gain.setValueAtTime(0.001, t);
    bG.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
    bG.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    bSrc.connect(bp); bp.connect(bG); bG.connect(this.master);
    bSrc.start(t); bSrc.stop(t + 0.4);
  }

  /* Sprinkle — Gulal rain tickle */
  sprinkle() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.1);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() > 0.75 ? (Math.random() * 2 - 1) * 0.2 : 0;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const g = ctx.createGain(); g.gain.value = 0.04;
    src.connect(hp); hp.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + 0.11);
  }
}

const holiSound = typeof window !== 'undefined' ? new HoliSound() : null;

/* ─────────────────── CONSTANTS ─────────────────── */

const STEP = 1000 / 60;
const ROCKET_COUNT = 5;
const ROCKET_DELAYS = [0, 120, 250, 400, 580];

/* ─────────────────── COMPONENT ─────────────────── */

export default function HoliColorBlast({ phase }: { phase: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rockets = useRef<Rocket[]>([]);
  const frameId = useRef(0);
  const uid = useRef(0);
  const alive = useRef(true);
  const sizeCache = useRef({ w: 0, h: 0, dpr: 1 });
  const lastTime = useRef(0);
  const acc = useRef(0);
  const physicsTime = useRef(0);
  const shakeAmt = useRef(0);
  const whooshPlayed = useRef<Set<number>>(new Set());
  const puffPlayed = useRef<Set<number>>(new Set());
  const rainStarted = useRef(false);
  const prevPhase = useRef('');
  const sprinkleTimer = useRef(0);
  const rainFade = useRef(1);

  const nid = () => ++uid.current;

  /* ── INIT ROCKETS ── */
  const initRockets = useCallback(() => {
    rockets.current = Array.from({ length: ROCKET_COUNT }, (_, i) => ({
      id: i + 1,
      startX: 10 + Math.random() * 80,
      targetY: 8 + Math.random() * 18,
      cx: 0, cy: 100,
      phase: 0,
      duration: 55 + Math.random() * 25,
      drift: (Math.random() - 0.5) * 4,
      color: HOLI_COLORS[i % HOLI_COLORS.length],
      launched: false,
      exploded: false,
    }));
    whooshPlayed.current.clear();
    puffPlayed.current.clear();
    rainStarted.current = false;
    sprinkleTimer.current = 0;
    rainFade.current = 1;
  }, []);

  /* ── SPAWN COLOR BURST (Holi style - wider, more colorful) ── */
  const spawnBurst = useCallback((x: number, y: number, color: [number, number, number], variant = 0) => {
    const out: Particle[] = [];
    const [r, g, b] = color;

    // White flash
    out.push({
      id: nid(), x, y, vx: 0, vy: 0,
      life: 0, maxLife: 14, size: 55,
      r: 255, g: 255, b: 255,
      type: 'flash', gravity: 0, friction: 1,
    });

    // Color burst particles — WIDER spread than Diwali
    const count = 130 + variant * 15;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4;
      const ml = 90 + Math.random() * 70;
      const mixColor = Math.random() > 0.4 ? color : HOLI_COLORS[Math.floor(Math.random() * HOLI_COLORS.length)];

      out.push({
        id: nid(), x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0, maxLife: ml,
        size: 1.8 + Math.random() * 3.2,
        r: mixColor[0], g: mixColor[1], b: mixColor[2],
        type: 'color_burst',
        gravity: 0.022,
        friction: 0.984,
      });
    }

    // Splash droplets — Holi special (irregular, wobbly)
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.8;
      out.push({
        id: nid(), x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0, maxLife: 70 + Math.random() * 50,
        size: 3.5 + Math.random() * 5,
        r, g, b,
        type: 'splash',
        gravity: 0.055,
        friction: 0.965,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.06 + Math.random() * 0.1,
      });
    }

    particles.current.push(...out);
  }, []);

  /* ── SPAWN GULAL RAIN ── */
  const spawnGulal = useCallback((count: number) => {
    const out: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const color = HOLI_COLORS[Math.floor(Math.random() * HOLI_COLORS.length)];
      out.push({
        id: nid(),
        x: Math.random() * 100,
        y: -3 - Math.random() * 15,
        vx: (Math.random() - 0.5) * 0.7,
        vy: 0.25 + Math.random() * 0.7,
        life: 0,
        maxLife: 220 + Math.random() * 80,
        size: 2.5 + Math.random() * 5.5,
        r: color[0], g: color[1], b: color[2],
        type: 'gulal',
        gravity: 0.006,
        friction: 0.998,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.015 + Math.random() * 0.035,
        opacity: 0.5 + Math.random() * 0.5,
      });
    }
    particles.current.push(...out);
  }, []);

  /* ── PHASE CHANGE HANDLER ── */
  useEffect(() => {
    if (phase === prevPhase.current) return;
    const oldPhase = prevPhase.current;
    prevPhase.current = phase;

    if (phase === 'ROCKET_LAUNCH') {
      initRockets();
      particles.current = [];
      physicsTime.current = 0;
      lastTime.current = 0;
      acc.current = 0;
    }

    if (phase === 'COLOR_DHAMAKA') {
      // Force-explode all rockets
      for (const rk of rockets.current) {
        if (!rk.exploded) {
          rk.exploded = true;
          const tx = rk.launched ? rk.cx : rk.startX;
          const ty = rk.launched ? rk.cy : rk.targetY;
          spawnBurst(tx, ty, rk.color, rk.id - 1);
          if (!puffPlayed.current.has(rk.id)) {
            puffPlayed.current.add(rk.id);
            holiSound?.puff(rk.id - 1, 0.04);
          }
        }
      }
      shakeAmt.current = 4;
    }

    if (phase === 'GULAL_RAIN' && !rainStarted.current) {
      rainStarted.current = true;
      spawnGulal(100);
    }

    if (phase === 'TEXT_REVEAL') {
      // Soft ambient particles around center
      for (let i = 0; i < 50; i++) {
        const color = HOLI_COLORS[Math.floor(Math.random() * HOLI_COLORS.length)];
        particles.current.push({
          id: nid(),
          x: 25 + Math.random() * 50,
          y: 25 + Math.random() * 50,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -0.1 - Math.random() * 0.3,
          life: 0, maxLife: 120 + Math.random() * 60,
          size: 2 + Math.random() * 3,
          r: color[0], g: color[1], b: color[2],
          type: 'ambient',
          gravity: -0.003,
          friction: 0.996,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.025 + Math.random() * 0.03,
          opacity: 0.3 + Math.random() * 0.3,
        });
      }
    }

    // Fade out on HANDOVER
    if (phase === 'HANDOVER') {
      rainFade.current = 1;
    }
  }, [phase, initRockets, spawnBurst, spawnGulal]);

  /* ── INIT ── */
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; cancelAnimationFrame(frameId.current); };
  }, []);

  /* ── PHYSICS STEP ── */
  const physicsStep = useCallback(() => {
    physicsTime.current += STEP;
    const elapsed = physicsTime.current;
    const spawned: Particle[] = [];

    // Rocket physics
    if (phase === 'ROCKET_LAUNCH') {
      for (const rk of rockets.current) {
        if (rk.exploded) continue;

        if (!rk.launched && elapsed >= ROCKET_DELAYS[rk.id - 1]) {
          rk.launched = true;
          if (!whooshPlayed.current.has(rk.id)) {
            whooshPlayed.current.add(rk.id);
            holiSound?.whoosh(rk.id - 1);
          }
        }
        if (!rk.launched) continue;

        rk.phase++;
        const p = Math.min(rk.phase / rk.duration, 1);
        const e = p < 0.12 ? (p / 0.12) ** 2 * 0.08 : 0.08 + ((p - 0.12) / 0.88) * 0.92;
        rk.cx = rk.startX + rk.drift * e;
        rk.cy = 100 + (rk.targetY - 100) * e;

        // Colorful trail particles
        if (rk.phase % 2 === 0 && p < 1) {
          const [tr, tg, tb] = rk.color;
          for (let i = 0; i < 3; i++) {
            spawned.push({
              id: nid(),
              x: rk.cx + (Math.random() - 0.5) * 1.2,
              y: rk.cy + 1.5 + Math.random() * 1.2,
              vx: (Math.random() - 0.5) * 0.35,
              vy: 0.25 + Math.random() * 0.6,
              life: 0, maxLife: 16 + Math.random() * 12,
              size: 1.2 + Math.random() * 2.5,
              r: tr, g: tg, b: tb,
              type: 'rocket_trail', gravity: 0.04, friction: 0.94,
            });
          }
        }

        // Sparks
        if (rk.phase % 5 === 0 && p < 0.9) {
          const a = Math.random() * Math.PI * 2;
          spawned.push({
            id: nid(), x: rk.cx, y: rk.cy,
            vx: Math.cos(a) * 0.6, vy: Math.sin(a) * 0.6 + 0.1,
            life: 0, maxLife: 8 + Math.random() * 6,
            size: 0.8 + Math.random() * 0.7,
            r: 255, g: 255, b: 255,
            type: 'rocket_trail', gravity: 0.06, friction: 0.9,
          });
        }
      }
    }

    // Continuous gulal rain
    if (phase === 'GULAL_RAIN' || phase === 'TEXT_REVEAL') {
      sprinkleTimer.current++;
      if (sprinkleTimer.current % 6 === 0) spawnGulal(2);
      if (sprinkleTimer.current % 25 === 0) holiSound?.sprinkle();
    }

    // Fade out on HANDOVER
    if (phase === 'HANDOVER') {
      rainFade.current = Math.max(0, rainFade.current - 0.03);
    }

    // Update particles
    particles.current = particles.current
      .map(pt => {
        if (pt.life < 0) return { ...pt, life: pt.life + 1 };
        let nvx = pt.vx * pt.friction;
        let nvy = pt.vy + pt.gravity;
        if (pt.wobble !== undefined && pt.wobbleSpeed) {
          pt.wobble += pt.wobbleSpeed;
          nvx += Math.sin(pt.wobble) * 0.04;
        }
        return {
          ...pt,
          x: pt.x + nvx * 0.32,
          y: pt.y + nvy * 0.32,
          vx: nvx, vy: nvy,
          life: pt.life + 1,
        };
      })
      .filter(pt => pt.life < pt.maxLife);

    particles.current.push(...spawned);
    shakeAmt.current *= 0.88;
    if (shakeAmt.current < 0.05) shakeAmt.current = 0;
  }, [phase, spawnGulal]);

  /* ── CANVAS DRAW ── */
  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = cvs.getBoundingClientRect();
    const cw = rect.width; const ch = rect.height;
    const pw = Math.floor(cw * dpr); const ph = Math.floor(ch * dpr);

    if (sizeCache.current.w !== pw || sizeCache.current.h !== ph) {
      cvs.width = pw; cvs.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeCache.current = { w: pw, h: ph, dpr };
    }

    ctx.clearRect(0, 0, cw, ch);

    // Global fade for HANDOVER
    if (phase === 'HANDOVER' && rainFade.current < 1) {
      ctx.globalAlpha = rainFade.current;
    }

    const sx = shakeAmt.current ? (Math.random() - 0.5) * shakeAmt.current * 2 : 0;
    const sy = shakeAmt.current ? (Math.random() - 0.5) * shakeAmt.current * 2 : 0;
    ctx.save();
    ctx.translate(sx, sy);

    // Draw rockets
    for (const rk of rockets.current) {
      if (!rk.launched || rk.exploded) continue;
      const px = (rk.cx / 100) * cw;
      const py = (rk.cy / 100) * ch;
      const [r, g, b] = rk.color;

      const g1 = ctx.createRadialGradient(px, py, 0, px, py, 20);
      g1.addColorStop(0, `rgba(${r},${g},${b},0.75)`);
      g1.addColorStop(0.35, `rgba(${r},${g},${b},0.2)`);
      g1.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = g1;
      ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#fffaf0';
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // Draw particles
    for (const pt of particles.current) {
      if (pt.life < 0) continue;
      const px = (pt.x / 100) * cw;
      const py = (pt.y / 100) * ch;
      const lr = pt.life / pt.maxLife;

      if (pt.type === 'flash') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (0.3 + lr * 0.7);
        const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
        g.addColorStop(0, `rgba(255,255,255,${(op * 0.85).toFixed(3)})`);
        g.addColorStop(0.3, `rgba(255,240,210,${(op * 0.3).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,200,150,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
        continue;
      }

      if (pt.type === 'color_burst') {
        const op = Math.max(0, 1 - lr * 0.85);
        const sz = pt.size * (1 - lr * 0.25);
        const gSz = sz * 3.5;
        if (gSz > 0.5 && op > 0.02) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, gSz);
          g.addColorStop(0, `rgba(${pt.r},${pt.g},${pt.b},${(op * 0.28).toFixed(3)})`);
          g.addColorStop(1, `rgba(${pt.r},${pt.g},${pt.b},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, gSz, 0, Math.PI * 2); ctx.fill();
        }
        if (op > 0.01 && sz > 0.2) {
          ctx.globalAlpha = op;
          ctx.fillStyle = `rgb(${pt.r},${pt.g},${pt.b})`;
          ctx.beginPath(); ctx.arc(px, py, Math.max(0.5, sz), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        continue;
      }

      if (pt.type === 'splash') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (0.7 + Math.sin(lr * Math.PI) * 0.5);
        ctx.globalAlpha = op * 0.65;
        ctx.fillStyle = `rgb(${pt.r},${pt.g},${pt.b})`;
        ctx.beginPath();
        ctx.ellipse(px, py, sz, sz * 0.65, pt.wobble || 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }

      if (pt.type === 'gulal') {
        const op = (pt.opacity || 0.6) * Math.max(0, 1 - lr * 0.4);
        const sz = pt.size * (0.85 + Math.sin(lr * Math.PI * 1.5) * 0.2);
        ctx.globalAlpha = op;
        ctx.fillStyle = `rgb(${pt.r},${pt.g},${pt.b})`;
        ctx.beginPath();
        ctx.ellipse(px, py, sz, sz * 0.75, pt.wobble || 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }

      if (pt.type === 'rocket_trail') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (1 - lr * 0.45);
        const gSz = sz * 2.8;
        if (gSz > 0.5 && op > 0.02) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, gSz);
          g.addColorStop(0, `rgba(${pt.r},${pt.g},${pt.b},${(op * 0.5).toFixed(3)})`);
          g.addColorStop(1, `rgba(${pt.r},${pt.g},${pt.b},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, gSz, 0, Math.PI * 2); ctx.fill();
        }
        if (op > 0.01 && sz > 0.2) {
          ctx.globalAlpha = op;
          ctx.fillStyle = `rgb(${pt.r},${pt.g},${pt.b})`;
          ctx.beginPath(); ctx.arc(px, py, Math.max(0.5, sz), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        continue;
      }

      if (pt.type === 'ambient') {
        const op = (pt.opacity || 0.3) * Math.sin(lr * Math.PI);
        const sz = pt.size * (0.8 + Math.sin(lr * Math.PI) * 0.4);
        if (op > 0.01) {
          ctx.globalAlpha = op;
          const g = ctx.createRadialGradient(px, py, 0, px, py, sz * 2.5);
          g.addColorStop(0, `rgba(${pt.r},${pt.g},${pt.b},0.5)`);
          g.addColorStop(1, `rgba(${pt.r},${pt.g},${pt.b},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, sz * 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }, [phase]);

  /* ── MAIN LOOP ── */
  useEffect(() => {
    const tick = (now: number) => {
      if (!alive.current) return;
      if (lastTime.current === 0) lastTime.current = now;
      const dt = Math.min(now - lastTime.current, 100);
      lastTime.current = now;
      acc.current += dt;
      while (acc.current >= STEP) { physicsStep(); acc.current -= STEP; }
      draw();
      frameId.current = requestAnimationFrame(tick);
    };
    frameId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId.current);
  }, [physicsStep, draw]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}
