'use client';

import { useEffect, useRef, useCallback } from 'react';

/* ─────────────────── TYPES ─────────────────── */

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number; g: number; b: number;
  type: 'trail' | 'spark' | 'burst' | 'flash' | 'crackle' | 'afterglow';
  burstR?: number; burstG?: number; burstB?: number;
  gravity: number;
  friction: number;
}

interface RocketCfg {
  id: number;
  startX: number;
  targetY: number;
  delay: number;
  duration: number;
  drift: number;
  burstType: 'peony' | 'chrysanthemum' | 'willow' | 'ring' | 'crackle';
  burstR: number; burstG: number; burstB: number;
  burstSize: number;
  burstCount: number;
}

interface RocketState {
  launched: boolean;
  phase: number;
  exploded: boolean;
  cx: number;
  cy: number;
}

/* ─────────────────── SOUND ENGINE (Realistic) ─────────────────── */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor() {
    if (typeof window === 'undefined') return;

    // 🔓 UNLOCK: Koi bhi user interaction pe AudioContext khul jaye
    const unlock = () => { this.ensure(); };
    const opts = { passive: true, capture: true } as AddEventListenerOptions;
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
      document.addEventListener(evt, unlock, opts);
    });
  }

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();

        // Master gain
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;

        // Compressor: multiple booms overlap karne pe clipping na ho
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 12;
        comp.ratio.value = 8;
        comp.attack.value = 0.002;
        comp.release.value = 0.2;

        this.master.connect(comp);
        comp.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  }

  /* ── SHUIII — Real rocket whoosh ── */
  whoosh(variant: number = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const dur = 0.7 + variant * 0.05;

    // White noise buffer
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Bandpass: LOW se HIGH sweep = "shuiii" sound
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 8 + variant * 1.2;
    const fStart = 140 + variant * 25;
    const fPeak = 3200 + variant * 400;
    bp.frequency.setValueAtTime(fStart, now);
    bp.frequency.exponentialRampToValueAtTime(fPeak, now + dur * 0.6);
    bp.frequency.exponentialRampToValueAtTime(fPeak * 0.4, now + dur);

    // Envelope: sharp rise → sustain → fade
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
    g.gain.setValueAtTime(0.2, now + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(now);
    src.stop(now + dur + 0.01);
  }

  /* ── BHOOOM — Real explosion (4 layers) ── */
  boom(variant: number = 0, delay: number = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const pitch = 0.85 + variant * 0.08;

    // Layer 1: Sharp CRACK (15ms — initial impact)
    const cLen = Math.floor(ctx.sampleRate * 0.015);
    const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
    const cd = cBuf.getChannelData(0);
    for (let i = 0; i < cLen; i++) cd[i] = Math.random() * 2 - 1;
    const cSrc = ctx.createBufferSource();
    cSrc.buffer = cBuf;
    const cG = ctx.createGain();
    cG.gain.setValueAtTime(0.4, t);
    cG.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    cSrc.connect(cG);
    cG.connect(this.master);
    cSrc.start(t);
    cSrc.stop(t + 0.02);

    // Layer 2: Sub-bass BHOOOM (0.8s — 75Hz → 18Hz)
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(75 * pitch, t);
    sub.frequency.exponentialRampToValueAtTime(18, t + 0.8);
    const sG = ctx.createGain();
    sG.gain.setValueAtTime(0.5, t);
    sG.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    sub.connect(sG);
    sG.connect(this.master);
    sub.start(t);
    sub.stop(t + 0.85);

    // Layer 3: Mid thump (0.3s — 140Hz → 35Hz)
    const mid = ctx.createOscillator();
    mid.type = 'sine';
    mid.frequency.setValueAtTime(140 * pitch, t);
    mid.frequency.exponentialRampToValueAtTime(35, t + 0.3);
    const mG = ctx.createGain();
    mG.gain.setValueAtTime(0.22, t);
    mG.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    mid.connect(mG);
    mG.connect(this.master);
    mid.start(t);
    mid.stop(t + 0.35);

    // Layer 4: Sparse CRACKLE tail (0.7s — real "phata phata" but delayed)
    const tkLen = Math.floor(ctx.sampleRate * 0.7);
    const tkBuf = ctx.createBuffer(1, tkLen, ctx.sampleRate);
    const tk = tkBuf.getChannelData(0);
    for (let i = 0; i < tkLen; i++) {
      // 65% silence, 35% random pop — this creates the "tak... tak... tak" feel
      tk[i] = Math.random() > 0.65 ? (Math.random() * 2 - 1) * 0.6 : 0;
    }
    const tkSrc = ctx.createBufferSource();
    tkSrc.buffer = tkBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const tG = ctx.createGain();
    tG.gain.setValueAtTime(0.001, t);
    tG.gain.exponentialRampToValueAtTime(0.1, t + 0.05);
    tG.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    tkSrc.connect(hp);
    hp.connect(tG);
    tG.connect(this.master);
    tkSrc.start(t);
    tkSrc.stop(t + 0.75);
  }
}

const sound = typeof window !== 'undefined' ? new SoundEngine() : null;

/* ─────────────────── HELPERS ─────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
}

const BURST_HEX = ['#ff3344', '#ffcc00', '#00ff88', '#ff44aa', '#44aaff'];
const TRAIL_RGB: [number, number, number][] = [
  [255, 170, 0], [255, 119, 0], [255, 68, 0], [255, 221, 68], [255, 255, 255], [255, 136, 0],
];

const STEP = 1000 / 60;
const ROCKET_COUNT = 5;
const ROCKET_DELAYS = [0, 500, 1100, 1800, 2600];

/* ─────────────────── COMPONENT ─────────────────── */

export default function Shooting() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rockets = useRef<RocketCfg[]>([]);
  const rState = useRef<Record<number, RocketState>>({});
  const frameId = useRef(0);
  const uid = useRef(0);
  const alive = useRef(true);
  const sizeCache = useRef({ w: 0, h: 0, dpr: 1 });
  const lastTime = useRef(0);
  const acc = useRef(0);
  const physicsTime = useRef(0);
  const shakeAmt = useRef(0);
  const whooshPlayed = useRef<Set<number>>(new Set());
  const boomPlayed = useRef<Set<number>>(new Set());

  const nid = () => ++uid.current;

  /* ── INIT ── */
  useEffect(() => {
    const types: RocketCfg['burstType'][] = ['peony', 'chrysanthemum', 'willow', 'ring', 'crackle'];

    rockets.current = Array.from({ length: ROCKET_COUNT }, (_, i) => {
      const [r, g, b] = hexToRgb(BURST_HEX[i % BURST_HEX.length]);
      return {
        id: i + 1,
        startX: 12 + Math.random() * 76,
        targetY: 8 + Math.random() * 16,
        delay: ROCKET_DELAYS[i] + Math.random() * 200,
        duration: 95 + Math.random() * 40,
        drift: (Math.random() - 0.5) * 4,
        burstType: types[i % types.length],
        burstR: r, burstG: g, burstB: b,
        burstSize: 2.2 + Math.random() * 1.8,
        burstCount: 95 + Math.floor(Math.random() * 45),
      };
    });

    rockets.current.forEach(r => {
      rState.current[r.id] = { launched: false, phase: 0, exploded: false, cx: r.startX, cy: 100 };
    });

    alive.current = true;
    lastTime.current = 0;
    acc.current = 0;
    physicsTime.current = 0;
    shakeAmt.current = 0;
    whooshPlayed.current.clear();
    boomPlayed.current.clear();
    particles.current = [];

    return () => { alive.current = false; cancelAnimationFrame(frameId.current); };
  }, []);

  /* ── BURST SPAWNER ── */
  const spawnBurst = useCallback((rk: RocketCfg, x: number, y: number) => {
    const out: Particle[] = [];
    const { burstR, burstG, burstB, burstSize, burstCount, burstType } = rk;

    out.push({
      id: nid(), x, y, vx: 0, vy: 0,
      life: 0, maxLife: 12, size: 60 + burstSize * 8,
      r: 255, g: 255, b: 255,
      type: 'flash', gravity: 0, friction: 1,
    });

    out.push({
      id: nid(), x, y, vx: 0, vy: 0,
      life: 0, maxLife: 110, size: 45 + burstSize * 5,
      r: burstR, g: burstG, b: burstB,
      type: 'afterglow', gravity: 0, friction: 1,
    });

    const count = burstType === 'willow' ? Math.floor(burstCount * 0.6)
      : burstType === 'crackle' ? Math.floor(burstCount * 0.5) : burstCount;

    for (let i = 0; i < count; i++) {
      const angle = burstType === 'ring'
        ? (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.08
        : Math.random() * Math.PI * 2;

      const sBase = burstType === 'ring' ? 3.2
        : burstType === 'willow' ? 1.3
        : burstType === 'chrysanthemum' ? 1.6 : 1.8;
      const sRange = burstType === 'ring' ? 0.5
        : burstType === 'willow' ? 2.2
        : burstType === 'chrysanthemum' ? 2.8 : 2.5;
      const speed = sBase + Math.random() * sRange;

      const ml = burstType === 'willow' ? 170 + Math.random() * 50
        : burstType === 'chrysanthemum' ? 140 + Math.random() * 40
        : burstType === 'ring' ? 80 + Math.random() * 25
        : 90 + Math.random() * 30;

      const grav = burstType === 'willow' ? 0.04
        : burstType === 'chrysanthemum' ? 0.015
        : burstType === 'ring' ? 0.028 : 0.033;

      const fric = burstType === 'willow' ? 0.994
        : burstType === 'chrysanthemum' ? 0.991 : 0.978;

      out.push({
        id: nid(), x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0, maxLife: ml,
        size: burstSize * (burstType === 'willow' ? 0.5 : burstType === 'chrysanthemum' ? 0.6 : 1),
        r: 255, g: 255, b: 255,
        burstR, burstG, burstB,
        type: 'burst', gravity: grav, friction: fric,
      });
    }

    if (burstType === 'crackle') {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 2 + Math.random() * 3;
        out.push({
          id: nid(),
          x: x + Math.cos(a) * d,
          y: y + Math.sin(a) * d,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          life: -20 - Math.random() * 25,
          maxLife: 10 + Math.random() * 6,
          size: 5 + Math.random() * 4,
          r: 255, g: 245, b: 210,
          type: 'crackle', gravity: 0, friction: 1,
        });
      }
    }

    particles.current.push(...out);
  }, []);

  /* ── PHYSICS STEP ── */
  const physicsStep = useCallback(() => {
    physicsTime.current += STEP;
    const elapsed = physicsTime.current;
    const spawned: Particle[] = [];

    for (const rk of rockets.current) {
      const st = rState.current[rk.id];
      if (!st || st.exploded) continue;

      if (!st.launched && elapsed >= rk.delay) {
        st.launched = true;
        if (!whooshPlayed.current.has(rk.id)) {
          whooshPlayed.current.add(rk.id);
          sound?.whoosh(rk.id - 1); // variant 0-4
        }
      }
      if (!st.launched) continue;

      st.phase++;
      const p = Math.min(st.phase / rk.duration, 1);

      const e = p < 0.2
        ? (p / 0.2) * (p / 0.2) * 0.15
        : 0.15 + ((p - 0.2) / 0.8) * 0.85;

      st.cx = rk.startX + rk.drift * e;
      st.cy = 100 + (rk.targetY - 100) * e;

      if (st.phase % 2 === 0 && p < 1) {
        for (let i = 0; i < 3; i++) {
          const [tr, tg, tb] = TRAIL_RGB[Math.floor(Math.random() * TRAIL_RGB.length)];
          spawned.push({
            id: nid(),
            x: st.cx + (Math.random() - 0.5) * 1.2,
            y: st.cy + 2 + Math.random() * 1.5,
            vx: (Math.random() - 0.5) * 0.45,
            vy: 0.35 + Math.random() * 0.9,
            life: 0, maxLife: 22 + Math.random() * 14,
            size: 1.2 + Math.random() * 2.5,
            r: tr, g: tg, b: tb,
            type: 'trail', gravity: 0.055, friction: 0.94,
          });
        }
      }

      if (st.phase % 4 === 0 && p < 0.85) {
        const a = Math.random() * Math.PI * 2;
        const s = 0.3 + Math.random() * 1.0;
        spawned.push({
          id: nid(), x: st.cx, y: st.cy + 0.5,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s + 0.15,
          life: 0, maxLife: 10 + Math.random() * 8,
          size: 0.6 + Math.random() * 0.8,
          r: 255, g: 255, b: 255,
          type: 'spark', gravity: 0.08, friction: 0.9,
        });
      }

      if (p >= 1 && !st.exploded) {
        st.exploded = true;
        spawnBurst(rk, st.cx, st.cy);
        shakeAmt.current = 4;
        if (!boomPlayed.current.has(rk.id)) {
          boomPlayed.current.add(rk.id);
          // 80ms delay: light is faster than sound — feels more real
          sound?.boom(rk.id - 1, 0.08);
        }
      }
    }

    particles.current = particles.current
      .map(pt => {
        if (pt.life < 0) return { ...pt, life: pt.life + 1 };
        return {
          ...pt,
          x: pt.x + pt.vx * 0.32,
          y: pt.y + pt.vy * 0.32,
          vy: pt.vy + pt.gravity,
          vx: pt.vx * pt.friction,
          life: pt.life + 1,
        };
      })
      .filter(pt => pt.life < pt.maxLife);

    particles.current.push(...spawned);
    shakeAmt.current *= 0.88;
    if (shakeAmt.current < 0.1) shakeAmt.current = 0;
  }, [spawnBurst]);

  /* ── CANVAS DRAW ── */
  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = cvs.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const pw = Math.floor(cw * dpr);
    const ph = Math.floor(ch * dpr);

    if (sizeCache.current.w !== pw || sizeCache.current.h !== ph) {
      cvs.width = pw; cvs.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeCache.current = { w: pw, h: ph, dpr };
    }

    ctx.clearRect(0, 0, cw, ch);

    const sx = shakeAmt.current ? (Math.random() - 0.5) * shakeAmt.current * 2 : 0;
    const sy = shakeAmt.current ? (Math.random() - 0.5) * shakeAmt.current * 2 : 0;
    ctx.save();
    ctx.translate(sx, sy);

    for (const rk of rockets.current) {
      const st = rState.current[rk.id];
      if (!st || !st.launched || st.exploded) continue;
      const px = (st.cx / 100) * cw;
      const py = (st.cy / 100) * ch;

      const g1 = ctx.createRadialGradient(px, py, 0, px, py, 22);
      g1.addColorStop(0, 'rgba(255,200,80,0.7)');
      g1.addColorStop(0.35, 'rgba(255,130,30,0.25)');
      g1.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = g1;
      ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#fffaf0';
      ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2); ctx.fill();
    }

    for (const pt of particles.current) {
      if (pt.life < 0) continue;
      const px = (pt.x / 100) * cw;
      const py = (pt.y / 100) * ch;
      const lr = pt.life / pt.maxLife;

      if (pt.type === 'flash') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (0.2 + lr * 0.8);
        const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
        g.addColorStop(0, `rgba(255,255,255,${(op * 0.85).toFixed(3)})`);
        g.addColorStop(0.35, `rgba(255,240,200,${(op * 0.35).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
        continue;
      }

      if (pt.type === 'afterglow') {
        const op = Math.max(0, (1 - lr) * 0.15);
        const sz = pt.size * (1 + lr * 0.5);
        const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
        g.addColorStop(0, `rgba(${pt.r},${pt.g},${pt.b},${op.toFixed(3)})`);
        g.addColorStop(1, `rgba(${pt.r},${pt.g},${pt.b},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
        continue;
      }

      if (pt.type === 'crackle') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (1 + lr * 0.3);
        const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
        g.addColorStop(0, `rgba(${pt.r},${pt.g},${pt.b},${op.toFixed(3)})`);
        g.addColorStop(0.4, `rgba(255,180,80,${(op * 0.5).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
        continue;
      }

      if (pt.type === 'burst') {
        let cr: number, cg: number, cb: number, op: number;
        const sz = pt.size * (1 - lr * 0.25);

        if (lr < 0.1) {
          cr = 255; cg = 255; cb = 255; op = 1;
        } else if (lr < 0.2) {
          const t = (lr - 0.1) / 0.1;
          cr = Math.round(255 + (pt.burstR! - 255) * t);
          cg = Math.round(255 + (pt.burstG! - 255) * t);
          cb = Math.round(255 + (pt.burstB! - 255) * t);
          op = 1;
        } else {
          cr = pt.burstR!; cg = pt.burstG!; cb = pt.burstB!;
          op = Math.max(0, 1 - (lr - 0.2) / 0.8);
        }

        const gSz = sz * 4;
        if (gSz > 0.5 && op > 0.02) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, gSz);
          g.addColorStop(0, `rgba(${cr},${cg},${cb},${(op * 0.3).toFixed(3)})`);
          g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, gSz, 0, Math.PI * 2); ctx.fill();
        }

        if (op > 0.01 && sz > 0.2) {
          ctx.globalAlpha = op;
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.beginPath(); ctx.arc(px, py, Math.max(0.5, sz), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        continue;
      }

      if (pt.type === 'trail') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (1 - lr * 0.4);
        const gSz = sz * 3;

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

      if (pt.type === 'spark') {
        const op = Math.max(0, 1 - lr);
        if (op > 0.01) {
          ctx.globalAlpha = op;
          ctx.fillStyle = `rgb(${pt.r},${pt.g},${pt.b})`;
          ctx.beginPath(); ctx.arc(px, py, Math.max(0.4, pt.size), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.restore();
  }, []);

  /* ── MAIN LOOP ── */
  useEffect(() => {
    const tick = (now: number) => {
      if (!alive.current) return;

      if (lastTime.current === 0) lastTime.current = now;
      const dt = Math.min(now - lastTime.current, 100);
      lastTime.current = now;
      acc.current += dt;

      while (acc.current >= STEP) {
        physicsStep();
        acc.current -= STEP;
      }

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
