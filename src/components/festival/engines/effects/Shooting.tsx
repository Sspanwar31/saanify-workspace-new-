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

/* ─────────────────── SOUND ENGINE ─────────────────── */

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  }

  whoosh() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const len = Math.floor(ctx.sampleRate * 0.35);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.25;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(400, now);
    bp.frequency.exponentialRampToValueAtTime(2500, now + 0.28);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(now); src.stop(now + 0.35);
  }

  boom() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sub bass
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.55);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.35, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(og); og.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.6);

    // Crackle noise
    const len = Math.floor(ctx.sampleRate * 0.45);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4000, now);
    lp.frequency.exponentialRampToValueAtTime(150, now + 0.42);

    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.2, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    src.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
    src.start(now); src.stop(now + 0.45);
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

/* ─────────────────── CONSTANTS ─────────────────── */

const STEP = 1000 / 60;          // Fixed 60Hz physics
const ROCKET_COUNT = 5;
const ROCKET_DELAYS = [0, 500, 1100, 1800, 2600]; // Natural stagger (ms in physics time)

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

  // Delta time refs
  const lastTime = useRef(0);
  const acc = useRef(0);
  const physicsTime = useRef(0);

  // Shake
  const shakeAmt = useRef(0);

  // Sound tracking (play once per event)
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
        duration: 95 + Math.random() * 40,       // 🐢 SLOW: was 50+25, now 95-135 frames (1.6-2.25s)
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

    // Flash
    out.push({
      id: nid(), x, y, vx: 0, vy: 0,
      life: 0, maxLife: 12, size: 60 + burstSize * 8,
      r: 255, g: 255, b: 255,
      type: 'flash', gravity: 0, friction: 1,
    });

    // Afterglow
    out.push({
      id: nid(), x, y, vx: 0, vy: 0,
      life: 0, maxLife: 110, size: 45 + burstSize * 5,
      r: burstR, g: burstG, b: burstB,
      type: 'afterglow', gravity: 0, friction: 1,
    });

    // Burst particles
    const count = burstType === 'willow' ? Math.floor(burstCount * 0.6)
      : burstType === 'crackle' ? Math.floor(burstCount * 0.5)
      : burstCount;

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

      // 🐢 SLOW: increased maxLife for all types
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

    // Crackle sub-bursts
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

  /* ── PHYSICS STEP (runs at fixed 60Hz) ── */
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
          sound?.whoosh();
        }
      }
      if (!st.launched) continue;

      st.phase++;
      const p = Math.min(st.phase / rk.duration, 1);

      // Ease-in: slow start, fast end
      const e = p < 0.2
        ? (p / 0.2) * (p / 0.2) * 0.15
        : 0.15 + ((p - 0.2) / 0.8) * 0.85;

      st.cx = rk.startX + rk.drift * e;
      st.cy = 100 + (rk.targetY - 100) * e;

      // Trail sparks
      if (st.phase % 2 === 0 && p < 1) {
        for (let i = 0; i < 3; i++) {
          const [tr, tg, tb] = TRAIL_RGB[Math.floor(Math.random() * TRAIL_RGB.length)];
          spawned.push({
            id: nid(),
            x: st.cx + (Math.random() - 0.5) * 1.2,
            y: st.cy + 2 + Math.random() * 1.5,
            vx: (Math.random() - 0.5) * 0.45,
            vy: 0.35 + Math.random() * 0.9,
            life: 0, maxLife: 22 + Math.random() * 14, // 🐢 SLOW: was 16+10
            size: 1.2 + Math.random() * 2.5,
            r: tr, g: tg, b: tb,
            type: 'trail', gravity: 0.055, friction: 0.94,
          });
        }
      }

      // White sparks
      if (st.phase % 4 === 0 && p < 0.85) {
        const a = Math.random() * Math.PI * 2;
        const s = 0.3 + Math.random() * 1.0;
        spawned.push({
          id: nid(), x: st.cx, y: st.cy + 0.5,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s + 0.15,
          life: 0, maxLife: 10 + Math.random() * 8, // 🐢 SLOW: was 7+6
          size: 0.6 + Math.random() * 0.8,
          r: 255, g: 255, b: 255,
          type: 'spark', gravity: 0.08, friction: 0.9,
        });
      }

      // EXPLODE
      if (p >= 1 && !st.exploded) {
        st.exploded = true;
        spawnBurst(rk, st.cx, st.cy);
        shakeAmt.current = 4; // screen shake trigger
        if (!boomPlayed.current.has(rk.id)) {
          boomPlayed.current.add(rk.id);
          sound?.boom();
        }
      }
    }

    // Particle physics
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

    // Decay shake
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

    // Screen shake offset
    const sx = shakeAmt.current ? (Math.random() - 0.5) * shakeAmt.current * 2 : 0;
    const sy = shakeAmt.current ? (Math.random() - 0.5) * shakeAmt.current * 2 : 0;
    ctx.save();
    ctx.translate(sx, sy);

    // Rockets
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

    // Particles
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

  /* ── MAIN LOOP (delta time + fixed timestep) ── */
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
