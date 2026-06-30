'use client';

import { useEffect, useRef, useCallback } from 'react';

/* ─────────────────── TYPES ─────────────────── */

interface Particle {
  id: number;
  x: number;           // % of screen width
  y: number;           // % of screen height
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
  startX: number;      // % from left
  targetY: number;     // % from top (where it explodes)
  delay: number;       // ms before launch
  duration: number;    // frames to reach target
  drift: number;       // horizontal drift amount
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

/* ─────────────────── HELPERS ─────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
}

const BURST_HEX = ['#ff3344','#ffcc00','#00ff88','#ff44aa','#44aaff','#ff6600','#ffaa00'];
const TRAIL_RGB: [number,number,number][] = [
  [255,170,0],[255,119,0],[255,68,0],[255,221,68],[255,255,255],[255,136,0]
];

/* ─────────────────── COMPONENT ─────────────────── */

export default function Shooting() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rockets   = useRef<RocketCfg[]>([]);
  const rState    = useRef<Record<number, RocketState>>({});
  const frameId   = useRef(0);
  const uid       = useRef(0);
  const t0        = useRef(0);
  const alive     = useRef(true);
  const sizeCache = useRef({ w: 0, h: 0, dpr: 1 });

  const nid = () => ++uid.current;

  /* ── INIT ROCKETS ── */
  useEffect(() => {
    const types: RocketCfg['burstType'][] = ['peony','chrysanthemum','willow','ring','crackle'];

    rockets.current = Array.from({ length: 7 }, (_, i) => {
      const [r, g, b] = hexToRgb(BURST_HEX[i % BURST_HEX.length]);
      return {
        id: i + 1,
        startX: 10 + Math.random() * 80,
        targetY: 7 + Math.random() * 20,
        delay: i === 0 ? 0 : (i * 300 + Math.random() * 250),
        duration: 50 + Math.random() * 25,
        drift: (Math.random() - 0.5) * 5,
        burstType: types[Math.floor(Math.random() * types.length)],
        burstR: r, burstG: g, burstB: b,
        burstSize: 2 + Math.random() * 2,
        burstCount: 90 + Math.floor(Math.random() * 50),
      };
    });

    rockets.current.forEach(r => {
      rState.current[r.id] = { launched: false, phase: 0, exploded: false, cx: r.startX, cy: 100 };
    });

    t0.current = performance.now();
    alive.current = true;

    return () => { alive.current = false; cancelAnimationFrame(frameId.current); };
  }, []);

  /* ── BURST SPAWNER ── */
  const spawnBurst = useCallback((rk: RocketCfg, x: number, y: number) => {
    const out: Particle[] = [];
    const { burstR, burstG, burstB, burstSize, burstCount, burstType } = rk;

    // Phase 1: White flash
    out.push({
      id: nid(), x, y, vx: 0, vy: 0,
      life: 0, maxLife: 10, size: 55 + burstSize * 8,
      r: 255, g: 255, b: 255,
      type: 'flash', gravity: 0, friction: 1,
    });

    // Phase 2: Afterglow (lingering dim glow at center)
    out.push({
      id: nid(), x, y, vx: 0, vy: 0,
      life: 0, maxLife: 90, size: 40 + burstSize * 5,
      r: burstR, g: burstG, b: burstB,
      type: 'afterglow', gravity: 0, friction: 1,
    });

    // Phase 3: Burst particles
    const count = burstType === 'willow' ? Math.floor(burstCount * 0.65)
                : burstType === 'crackle' ? Math.floor(burstCount * 0.55)
                : burstCount;

    for (let i = 0; i < count; i++) {
      const angle = burstType === 'ring'
        ? (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.1
        : Math.random() * Math.PI * 2;

      const sBase = burstType === 'ring' ? 3.5
                  : burstType === 'willow' ? 1.5
                  : burstType === 'chrysanthemum' ? 1.8 : 2;
      const sRange = burstType === 'ring' ? 0.6
                   : burstType === 'willow' ? 2.5
                   : burstType === 'chrysanthemum' ? 3.2 : 2.8;
      const speed = sBase + Math.random() * sRange;

      const ml = burstType === 'willow' ? 130 + Math.random() * 50
               : burstType === 'chrysanthemum' ? 100 + Math.random() * 40
               : 50 + Math.random() * 25;

      const grav = burstType === 'willow' ? 0.05
                 : burstType === 'chrysanthemum' ? 0.018
                 : burstType === 'ring' ? 0.032 : 0.038;

      const fric = burstType === 'willow' ? 0.993
                 : burstType === 'chrysanthemum' ? 0.989 : 0.976;

      out.push({
        id: nid(), x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0, maxLife: ml,
        size: burstSize * (burstType === 'willow' ? 0.55 : burstType === 'chrysanthemum' ? 0.65 : 1),
        r: 255, g: 255, b: 255,
        burstR, burstG, burstB,
        type: 'burst', gravity: grav, friction: fric,
      });
    }

    // Phase 4: Crackle sub-bursts (delayed mini flashes)
    if (burstType === 'crackle') {
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 2 + Math.random() * 3;
        out.push({
          id: nid(),
          x: x + Math.cos(a) * d,
          y: y + Math.sin(a) * d,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          life: -18 - Math.random() * 22,
          maxLife: 10 + Math.random() * 6,
          size: 5 + Math.random() * 5,
          r: 255, g: 245, b: 210,
          type: 'crackle', gravity: 0, friction: 1,
        });
      }
    }

    particles.current.push(...out);
  }, []);

  /* ── ANIMATION LOOP ── */
  useEffect(() => {
    const tick = () => {
      if (!alive.current) return;

      const elapsed = performance.now() - t0.current;
      const spawned: Particle[] = [];

      // Update each rocket
      for (const rk of rockets.current) {
        const st = rState.current[rk.id];
        if (!st || st.exploded) continue;

        if (!st.launched && elapsed >= rk.delay) st.launched = true;
        if (!st.launched) continue;

        st.phase++;
        const p = Math.min(st.phase / rk.duration, 1);

        // Ease-in: slow start → fast end (real rocket acceleration)
        const e = p < 0.2 ? (p / 0.2) * (p / 0.2) * 0.15 : 0.15 + ((p - 0.2) / 0.8) * 0.85;

        st.cx = rk.startX + rk.drift * e;
        st.cy = 100 + (rk.targetY - 100) * e;

        // Trail sparks (orange/yellow, falling with gravity)
        if (st.phase % 2 === 0 && p < 1) {
          for (let i = 0; i < 3; i++) {
            const [tr, tg, tb] = TRAIL_RGB[Math.floor(Math.random() * TRAIL_RGB.length)];
            spawned.push({
              id: nid(),
              x: st.cx + (Math.random() - 0.5) * 1.2,
              y: st.cy + 2 + Math.random() * 1.5,
              vx: (Math.random() - 0.5) * 0.5,
              vy: 0.4 + Math.random() * 1.0,
              life: 0, maxLife: 16 + Math.random() * 10,
              size: 1.2 + Math.random() * 2.5,
              r: tr, g: tg, b: tb,
              type: 'trail', gravity: 0.065, friction: 0.94,
            });
          }
        }

        // White sparks (scatter around rocket head)
        if (st.phase % 4 === 0 && p < 0.85) {
          const a = Math.random() * Math.PI * 2;
          const s = 0.4 + Math.random() * 1.2;
          spawned.push({
            id: nid(), x: st.cx, y: st.cy + 0.5,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s + 0.2,
            life: 0, maxLife: 7 + Math.random() * 6,
            size: 0.6 + Math.random() * 0.8,
            r: 255, g: 255, b: 255,
            type: 'spark', gravity: 0.1, friction: 0.9,
          });
        }

        // ── EXPLODE at target ──
        if (p >= 1 && !st.exploded) {
          st.exploded = true;
          spawnBurst(rk, st.cx, st.cy);
        }
      }

      // Update particles physics
      particles.current = particles.current
        .map(pt => {
          if (pt.life < 0) return { ...pt, life: pt.life + 1 };
          return {
            ...pt,
            x: pt.x + pt.vx * 0.35,
            y: pt.y + pt.vy * 0.35,
            vy: pt.vy + pt.gravity,
            vx: pt.vx * pt.friction,
            life: pt.life + 1,
          };
        })
        .filter(pt => pt.life < pt.maxLife);

      particles.current.push(...spawned);
      draw();

      frameId.current = requestAnimationFrame(tick);
    };

    frameId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId.current);
  }, [spawnBurst]);

  /* ── CANVAS RENDERER ── */
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

    // Resize only when needed
    if (sizeCache.current.w !== pw || sizeCache.current.h !== ph) {
      cvs.width = pw;
      cvs.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeCache.current = { w: pw, h: ph, dpr };
    }

    ctx.clearRect(0, 0, cw, ch);

    // ── Draw active rockets ──
    for (const rk of rockets.current) {
      const st = rState.current[rk.id];
      if (!st || !st.launched || st.exploded) continue;

      const px = (st.cx / 100) * cw;
      const py = (st.cy / 100) * ch;

      // Outer warm glow
      const g1 = ctx.createRadialGradient(px, py, 0, px, py, 20);
      g1.addColorStop(0, 'rgba(255,200,80,0.7)');
      g1.addColorStop(0.35, 'rgba(255,130,30,0.25)');
      g1.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.fill();

      // Bright core
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Draw particles ──
    for (const pt of particles.current) {
      if (pt.life < 0) continue;

      const px = (pt.x / 100) * cw;
      const py = (pt.y / 100) * ch;
      const lr = pt.life / pt.maxLife;

      // ─ FLASH ─
      if (pt.type === 'flash') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (0.2 + lr * 0.8);
        const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
        g.addColorStop(0, `rgba(255,255,255,${(op * 0.85).toFixed(3)})`);
        g.addColorStop(0.35, `rgba(255,240,200,${(op * 0.35).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      // ─ AFTERGLOW ─
      if (pt.type === 'afterglow') {
        const op = Math.max(0, (1 - lr) * 0.15);
        const sz = pt.size * (1 + lr * 0.5);
        const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
        g.addColorStop(0, `rgba(${pt.r},${pt.g},${pt.b},${op.toFixed(3)})`);
        g.addColorStop(1, `rgba(${pt.r},${pt.g},${pt.b},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      // ─ CRACKLE ─
      if (pt.type === 'crackle') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (1 + lr * 0.3);
        const g = ctx.createRadialGradient(px, py, 0, px, py, sz);
        g.addColorStop(0, `rgba(${pt.r},${pt.g},${pt.b},${op.toFixed(3)})`);
        g.addColorStop(0.4, `rgba(255,180,80,${(op * 0.5).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      // ─ BURST ─
      if (pt.type === 'burst') {
        let cr: number, cg: number, cb: number, op: number;
        const sz = pt.size * (1 - lr * 0.25);

        if (lr < 0.1) {
          cr = 255; cg = 255; cb = 255; op = 1;
        } else if (lr < 0.22) {
          const t = (lr - 0.1) / 0.12;
          cr = Math.round(255 + (pt.burstR! - 255) * t);
          cg = Math.round(255 + (pt.burstG! - 255) * t);
          cb = Math.round(255 + (pt.burstB! - 255) * t);
          op = 1;
        } else {
          cr = pt.burstR!; cg = pt.burstG!; cb = pt.burstB!;
          op = Math.max(0, 1 - (lr - 0.22) / 0.78);
        }

        // Glow halo
        const gSz = sz * 4;
        if (gSz > 0.5 && op > 0.02) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, gSz);
          g.addColorStop(0, `rgba(${cr},${cg},${cb},${(op * 0.3).toFixed(3)})`);
          g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, gSz, 0, Math.PI * 2);
          ctx.fill();
        }

        if (op > 0.01 && sz > 0.2) {
          ctx.globalAlpha = op;
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.5, sz), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        continue;
      }

      // ─ TRAIL ─
      if (pt.type === 'trail') {
        const op = Math.max(0, 1 - lr);
        const sz = pt.size * (1 - lr * 0.45);
        const gSz = sz * 3;

        if (gSz > 0.5 && op > 0.02) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, gSz);
          g.addColorStop(0, `rgba(${pt.r},${pt.g},${pt.b},${(op * 0.5).toFixed(3)})`);
          g.addColorStop(1, `rgba(${pt.r},${pt.g},${pt.b},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, gSz, 0, Math.PI * 2);
          ctx.fill();
        }

        if (op > 0.01 && sz > 0.2) {
          ctx.globalAlpha = op;
          ctx.fillStyle = `rgb(${pt.r},${pt.g},${pt.b})`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.5, sz), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        continue;
      }

      // ─ SPARK ─
      if (pt.type === 'spark') {
        const op = Math.max(0, 1 - lr);
        if (op > 0.01) {
          ctx.globalAlpha = op;
          ctx.fillStyle = `rgb(${pt.r},${pt.g},${pt.b})`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.4, pt.size), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
  }, []);

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
