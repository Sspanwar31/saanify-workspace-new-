'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
interface P {
  x: number; y: number; vx: number; vy: number;
  sz: number; life: number; ml: number;
  r: number; g: number; b: number; a: number;
  rot: number; rs: number; on: boolean; tp: number;
  tx: number; ty: number; md: number;
}
const POOL = 2500;
const DUR = 10.5;
const EP = 1e-4;

/* ═══════════════════════════════════════════════════════════════
   EASING
   ═══════════════════════════════════════════════════════════════ */
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const eOQ = (t: number) => 1 - Math.pow(1 - t, 4);
const eIQ = (t: number) => t * t;
const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/* ═══════════════════════════════════════════════════════════════
   SILHOUETTE GENERATOR — Offscreen Canvas → Point Sampling
   ═══════════════════════════════════════════════════════════════ */
function genSilhouette(): { x: number; y: number }[] {
  const sw = 240, sh = 320;
  const off = document.createElement('canvas');
  off.width = sw; off.height = sh;
  const o = off.getContext('2d')!;
  o.fillStyle = '#fff';
  const cx = sw * 0.45, s = sw * 0.38;

  const fc = (x: number, y: number, r: number) => { o.beginPath(); o.arc(x, y, r, 0, Math.PI * 2); o.fill(); };
  const ts = (x1: number, y1: number, x2: number, y2: number, w: number) => {
    o.lineWidth = w; o.lineCap = 'round'; o.strokeStyle = '#fff';
    o.beginPath(); o.moveTo(x1, y1); o.lineTo(x2, y2); o.stroke();
  };

  fc(cx - s * 0.05, sh * 0.18, s * 0.13);
  o.beginPath();
  o.moveTo(cx - s * .18, sh * .14); o.lineTo(cx - s * .12, sh * .04);
  o.lineTo(cx - s * .03, sh * .11); o.lineTo(cx + s * .04, sh * .02);
  o.lineTo(cx + s * .10, sh * .10); o.lineTo(cx + s * .16, sh * .06);
  o.lineTo(cx + s * .14, sh * .14); o.closePath(); o.fill();
  ts(cx - s * .02, sh * .24, cx - s * .02, sh * .28, s * .06);
  o.beginPath();
  o.moveTo(cx - s * .32, sh * .28); o.lineTo(cx + s * .28, sh * .28);
  o.quadraticCurveTo(cx + s * .24, sh * .42, cx + s * .16, sh * .48);
  o.lineTo(cx - s * .16, sh * .48);
  o.quadraticCurveTo(cx - s * .28, sh * .42, cx - s * .32, sh * .28);
  o.fill();
  fc(cx - s * .12, sh * .32, s * .08); fc(cx + s * .12, sh * .32, s * .08);
  o.lineWidth = s * .08; o.lineCap = 'round'; o.strokeStyle = '#fff';
  o.beginPath(); o.moveTo(cx - s * .32, sh * .30);
  o.quadraticCurveTo(cx - s * .70, sh * .22, cx - s * .85, sh * .25);
  o.stroke(); fc(cx - s * .87, sh * .25, s * .05);
  o.beginPath(); o.moveTo(cx + s * .28, sh * .30);
  o.quadraticCurveTo(cx + s * .42, sh * .15, cx + s * .45, sh * .05);
  o.stroke();
  ts(cx + s * .44, sh * .08, cx + s * .47, sh * .25, s * .035);
  fc(cx + s * .45, sh * .04, s * .08); fc(cx + s * .46, sh * .14, s * .06); fc(cx + s * .46, sh * .24, s * .055);
  o.beginPath();
  o.moveTo(cx - s * .16, sh * .48); o.lineTo(cx + s * .16, sh * .48);
  o.lineTo(cx + s * .22, sh * .65);
  o.quadraticCurveTo(cx, sh * .70, cx - s * .22, sh * .65);
  o.closePath(); o.fill();
  o.lineWidth = s * .09;
  o.beginPath(); o.moveTo(cx - s * .14, sh * .62);
  o.quadraticCurveTo(cx - s * .40, sh * .72, cx - s * .58, sh * .65);
  o.stroke(); fc(cx - s * .60, sh * .65, s * .05);
  o.beginPath(); o.moveTo(cx + s * .14, sh * .62);
  o.quadraticCurveTo(cx + s * .38, sh * .75, cx + s * .55, sh * .70);
  o.stroke(); fc(cx + s * .57, sh * .70, s * .05);
  o.lineWidth = s * .06;
  o.beginPath(); o.moveTo(cx - s * .16, sh * .45);
  o.bezierCurveTo(cx - s * .45, sh * .52, cx - s * .62, sh * .32, cx - s * .55, sh * .15);
  o.stroke();
  o.lineWidth = s * .08;
  o.beginPath(); o.moveTo(cx - s * .57, sh * .18);
  o.quadraticCurveTo(cx - s * .50, sh * .08, cx - s * .45, sh * .12);
  o.stroke();

  const data = o.getImageData(0, 0, sw, sh).data;
  const pts: { x: number; y: number }[] = [];
  for (let y = 0; y < sh; y += 2)
    for (let x = 0; x < sw; x += 2)
      if (data[(y * sw + x) * 4] > 128) pts.push({ x: x / sw, y: y / sh });
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void }

export default function HanumanJayantiIntro({ onComplete }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const raf = useRef(0); const t0 = useRef(0);
  const done = useRef(false); const scattered = useRef(false);
  const audioPlayed = useRef<Set<number>>(new Set());
  const cbR = useRef(onComplete); cbR.current = onComplete;

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) audioRef.current = new AC();
    } catch (_) {}

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const rsz = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    rsz(); window.addEventListener('resize', rsz);

    /* ── Silhouette + Particle Pool ── */
    const silPts = genSilhouette();
    const pl: P[] = [];
    for (let i = 0; i < POOL; i++)
      pl.push({ x: 0, y: 0, vx: 0, vy: 0, sz: 0, life: 0, ml: 1, r: 255, g: 150, b: 30, a: 0, rot: 0, rs: 0, on: false, tp: 0, tx: 0, ty: 0, md: 0 });

    const morphI: number[] = [];
    for (let i = 0; i < silPts.length && i < 700; i++) {
      const p = pl[i]; p.on = true; p.tp = 2;
      p.tx = silPts[i].x; p.ty = silPts[i].y;
      p.md = Math.random() * 0.6;
      p.sz = 1.2 + Math.random() * 1.4;
      p.ml = 999; p.life = 999;
      p.r = 255; p.g = 130 + Math.random() * 90 | 0; p.b = 15 + Math.random() * 45 | 0;
      morphI.push(i);
    }
    const dustI: number[] = [];
    for (let i = 0; i < 50; i++) {
      const idx = 700 + i; const p = pl[idx];
      p.on = true; p.tp = 0;
      p.x = Math.random() * W; p.y = Math.random() * H;
      p.vx = (Math.random() - .5) * .15; p.vy = -Math.random() * .25 - .04;
      p.sz = Math.random() * 1 + .3; p.ml = 999; p.life = 999;
      p.r = 255; p.g = 170 + Math.random() * 50 | 0; p.b = 35 + Math.random() * 40 | 0;
      p.a = Math.random() * .12 + .04; dustI.push(idx);
    }

    const grab = () => { for (let i = 750; i < POOL; i++) if (!pl[i].on) return pl[i]; return null; };

    /* ── Audio Helpers ── */
    const playAt = (id: number, fn: () => void, t: number) => {
      if (!audioPlayed.current.has(id) && t >= id) { audioPlayed.current.add(id); fn(); }
    };
    const aDrone = () => {
      try {
        const ctx = audioRef.current; if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const g = ctx.createGain(); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
        g.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 4.5);
        g.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 6);
        const o = ctx.createOscillator(); o.frequency.value = 48; o.type = 'sine';
        o.connect(g); o.start(); o.stop(ctx.currentTime + 6);
        const o2 = ctx.createOscillator(); o2.frequency.value = 52; o2.type = 'triangle';
        const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.06, ctx.currentTime);
        g2.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 6);
        o2.connect(g2); g2.connect(ctx.destination); o2.start(); o2.stop(ctx.currentTime + 6);
      } catch (_) {}
    };
    const aSweep = () => {
      try {
        const ctx = audioRef.current; if (!ctx) return;
        const g = ctx.createGain(); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(80, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 2.5);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
        o.connect(f); f.connect(g); o.start(); o.stop(ctx.currentTime + 3.5);
      } catch (_) {}
    };
    const aImpact = () => {
      try {
        const ctx = audioRef.current; if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const dur = 0.4; const buf = ctx.createBuffer(1, ctx.sampleRate * dur | 0, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.08));
        const src = ctx.createBufferSource(); src.buffer = buf;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.35, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 120;
        src.connect(f); f.connect(g); g.connect(ctx.destination); src.start();
        const o = ctx.createOscillator(); o.frequency.value = 55; o.type = 'sine';
        const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.3, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        o.connect(g2); g2.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.5);
      } catch (_) {}
    };
    const aBell = () => {
      try {
        const ctx = audioRef.current; if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const dur = 3.5; const mg = ctx.createGain(); mg.connect(ctx.destination);
        mg.gain.setValueAtTime(0, ctx.currentTime);
        mg.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.01);
        mg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
        [1.0, 1.5, 2.0, 2.5, 3.0].forEach((r, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.frequency.value = 180 * r; o.type = i === 0 ? 'sine' : 'triangle';
          g.gain.setValueAtTime(0.35 / (i + 1), ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur / (i + 0.9));
          o.connect(g); g.connect(mg); o.start(); o.stop(ctx.currentTime + dur);
        });
      } catch (_) {}
    };

    /* ═══════════════════════════════════════════════════════════
       DRAW FUNCTIONS
       ═══════════════════════════════════════════════════════════ */

    /* ── Background: Deep Space ── */
    function dBg() {
      c!.fillStyle = '#030108'; c!.fillRect(0, 0, W, H);
      let g = c!.createRadialGradient(W * .3, H * .25, 0, W * .3, H * .25, H * .6);
      g.addColorStop(0, 'rgba(18,4,35,0.25)'); g.addColorStop(1, 'rgba(3,1,8,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
      g = c!.createRadialGradient(W * .75, H * .75, 0, W * .75, H * .75, H * .5);
      g.addColorStop(0, 'rgba(12,2,25,0.18)'); g.addColorStop(1, 'rgba(3,1,8,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
      g = c!.createRadialGradient(W * .5, H * .5, H * .28, W * .5, H * .5, H * .95);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
    }

    /* ── Phase 1: Fluid Energy (0-2.5s) ── */
    function dFluid(t: number) {
      if (t > 2.5) return;
      const fade = t < 2.0 ? Math.min(t / 1.0, 1) : Math.max(0, 1 - (t - 2.0) / 0.5);
      const cx = W / 2, cy = H / 2;
      const bR = Math.min(W, H) * 0.18;
      for (let i = 0; i < 6; i++) {
        const a = t * (0.7 + i * 0.25) + i * 1.1;
        const d = bR * 0.4 * Math.sin(t * 1.2 + i * 2);
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d;
        const r = bR * (0.7 + Math.sin(t * 1.8 + i * 1.3) * 0.25);
        const g = c!.createRadialGradient(x, y, 0, x, y, Math.max(EP, r));
        const al = fade * (0.22 + i * 0.025);
        g.addColorStop(0, `rgba(255,${125 + i * 14},${12 + i * 8},${al})`);
        g.addColorStop(0.4, `rgba(255,${65 + i * 10},0,${al * 0.45})`);
        g.addColorStop(1, 'rgba(180,20,0,0)');
        c!.fillStyle = g; c!.fillRect(x - r, y - r, r * 2, r * 2);
      }
      const cr = bR * 0.22 * fade;
      const cg = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, cr));
      cg.addColorStop(0, `rgba(255,235,190,${fade * 0.9})`);
      cg.addColorStop(0.5, `rgba(255,170,50,${fade * 0.35})`);
      cg.addColorStop(1, 'rgba(255,80,0,0)');
      c!.fillStyle = cg; c!.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
    }

    /* ── Phase 2: Silhouette Glow (1.5-6.5s) ── */
    function dSilGlow(t: number) {
      if (t < 1.5 || t > 6.5) return;
      const fi = Math.min((t - 1.5) / 1.5, 1);
      const fo = t > 5.0 ? Math.max(0, 1 - (t - 5.0) / 1.5) : 1;
      const fade = eOC(fi) * fo;
      const silW = W * 0.5, silH = H * 0.55;
      const silX = (W - silW) / 2, silY = H * 0.05;
      const cx = silX + silW * 0.45, cy = silY + silH * 0.35;
      const r = Math.max(silW, silH) * 0.5;
      const g = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, r));
      g.addColorStop(0, `rgba(255,160,40,${fade * 0.18})`);
      g.addColorStop(0.5, `rgba(255,100,20,${fade * 0.06})`);
      g.addColorStop(1, 'rgba(255,60,0,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
    }

    /* ── Phase 2: Morph Particles (2-6s) ── */
    function dMorph(t: number, dt: number) {
      const silW = W * 0.5, silH = H * 0.55;
      const silX = (W - silW) / 2, silY = H * 0.05;
      const cxs = W / 2, cys = H / 2;

      for (const idx of morphI) {
        const p = pl[idx]; if (!p.on) continue;
        if (p.tp !== 2) continue;

        if (t < 2.0) {
          p.x = cxs + Math.sin(t * 2 + idx * 0.3) * 4;
          p.y = cys + Math.cos(t * 1.5 + idx * 0.4) * 4;
          p.a = 0.25 + Math.sin(t * 3 + idx * 0.5) * 0.15;
        } else if (t < 5.0) {
          const mt = Math.max(0, Math.min(1, (t - 2.0 - p.md) / 2.5));
          const e = eIO(mt);
          const stx = cxs, sty = cys;
          const etx = silX + p.tx * silW, ety = silY + p.ty * silH;
          p.x = stx + (etx - stx) * e;
          p.y = sty + (ety - sty) * e;
          p.a = Math.min(mt * 3, 1) * 0.88;
        }
        if (p.a > 0.01) {
          c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
          c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a})`; c!.fill();
        }
      }
    }

    /* ── Scatter at t=5s ── */
    function doScatter() {
      if (scattered.current) return;
      scattered.current = true;
      for (const idx of morphI) {
        const p = pl[idx]; if (!p.on || p.tp !== 2) continue;
        const ang = Math.atan2(p.y - H / 2, p.x - W / 2) + (Math.random() - .5) * .8;
        const spd = 3 + Math.random() * 10;
        p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd;
        p.tp = 3; p.ml = 0.8 + Math.random() * 1.2; p.life = p.ml;
      }
    }

    /* ── Flash (5-5.4s) ── */
    function dFlash(t: number) {
      if (t < 5.0 || t > 5.4) return;
      const ft = (t - 5.0) / 0.4;
      c!.fillStyle = `rgba(255,230,180,${(1 - ft) * (1 - ft) * 0.65})`;
      c!.fillRect(0, 0, W, H);
    }

    /* ── Shockwave Ring (5-7s) ── */
    function dShockwave(t: number) {
      const bt = Math.min((t - 5.0) / 2.0, 1); if (bt <= 0) return;
      const silW = W * 0.5, silH = H * 0.55;
      const cx = (W - silW) / 2 + silW * 0.45;
      const cy = H * 0.05 + silH * 0.35;
      const maxR = Math.max(W, H) * 0.85;
      const r = maxR * eOQ(bt);
      const fade = (1 - bt) * (1 - bt);
      c!.save();
      c!.beginPath(); c!.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2);
      c!.strokeStyle = `rgba(255,220,120,${fade * 0.75})`;
      c!.lineWidth = 3 * (1 - bt); c!.stroke();
      c!.beginPath(); c!.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2);
      c!.strokeStyle = `rgba(255,150,40,${fade * 0.25})`;
      c!.lineWidth = 18 * (1 - bt); c!.stroke();
      c!.restore();
      if (bt < 0.5) {
        const ia = (1 - bt / 0.5) * 0.2;
        const ig = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, r * 0.7));
        ig.addColorStop(0, `rgba(255,190,70,${ia})`); ig.addColorStop(1, 'rgba(255,140,30,0)');
        c!.fillStyle = ig; c!.fillRect(0, 0, W, H);
      }
    }

    /* ── Residual Glow (6-7.5s) ── */
    function dResidual(t: number) {
      if (t < 6.0 || t > 7.5) return;
      const fade = Math.max(0, 1 - (t - 6.0) / 1.5);
      const silW = W * 0.5, silH = H * 0.55;
      const cx = (W - silW) / 2 + silW * 0.45;
      const cy = H * 0.05 + silH * 0.35;
      const r = Math.min(W, H) * 0.3;
      const g = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, r));
      g.addColorStop(0, `rgba(255,150,35,${fade * 0.12})`);
      g.addColorStop(0.5, `rgba(255,90,15,${fade * 0.04})`);
      g.addColorStop(1, 'rgba(255,50,0,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
    }

    /* ── Phase 4: Kinetic Text (7.5-9.5s) — Crisp, Iridescent ── */
    function dText(t: number) {
      const ps = 7.5, ft = Math.min((t - ps) / 1.5, 1); if (ft <= 0) return;
      const fi = eOC(ft); const mainY = H * 0.68;
      c!.save(); c!.globalAlpha = fi;
      c!.textAlign = 'center'; c!.textBaseline = 'middle';

      const ts = Math.min(W * .072, H * .085, 60);
      c!.font = `800 ${ts}px 'Noto Sans Devanagari','Mangal','Devanagari Sangam MN',sans-serif`;

      c!.fillStyle = 'rgba(0,0,0,0.75)';
      c!.fillText('जय हनुमान', W / 2 + 2, mainY + 3);

      const tw = c!.measureText('जय हनुमान').width;
      const hue = Math.sin(t * 2.5) * 0.15;
      const tg = c!.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
      tg.addColorStop(0, `hsl(${35 + hue * 30},85%,25%)`);
      tg.addColorStop(0.15, `hsl(${38 + hue * 20},90%,40%)`);
      tg.addColorStop(0.35, `hsl(${42 + hue * 15},95%,55%)`);
      tg.addColorStop(0.50, `hsl(45,100%,70%)`);
      tg.addColorStop(0.65, `hsl(${42 - hue * 15},95%,55%)`);
      tg.addColorStop(0.85, `hsl(${38 - hue * 20},90%,40%)`);
      tg.addColorStop(1, `hsl(${35 - hue * 30},85%,25%)`);
      c!.fillStyle = tg; c!.fillText('जय हनुमान', W / 2, mainY);

      const ss = Math.min(W * .023, H * .027, 18);
      c!.font = `400 ${ss}px 'Nirmala UI','Devanagari Sangam MN','Mangal',sans-serif`;
      const shY = mainY + ts * 1.25;
      c!.fillStyle = 'rgba(0,0,0,0.8)';
      c!.fillText('अतुलित बलधाम ह्येषं हनुमान शरीरापि।', W / 2 + 1, shY + 1.2);
      const sg = c!.createLinearGradient(W / 2 - ss * 12, 0, W / 2 + ss * 12, 0);
      sg.addColorStop(0, '#856314'); sg.addColorStop(0.3, '#d4a020');
      sg.addColorStop(0.5, '#ffd700'); sg.addColorStop(0.7, '#d4a020');
      sg.addColorStop(1, '#856314');
      c!.fillStyle = sg;
      c!.fillText('अतुलित बलधाम ह्येषं हनुमान शरीरापि।', W / 2, shY);
      c!.restore();
    }

    /* ── Phase 5: Portal Fade (9.5-10.5s) ── */
    function dPortal(t: number) {
      const ft = Math.min((t - 9.5) / 1.0, 1); if (ft <= 0) return;
      const cx = W / 2, cy = H / 2;
      const maxR = Math.max(W, H) * 1.05;
      const r = maxR * eOE(ft);
      const wa = eOC(ft) * 0.95;
      c!.save(); c!.beginPath();
      c!.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2); c!.clip();
      const pg = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, r));
      pg.addColorStop(0, `rgba(255,248,240,${wa})`);
      pg.addColorStop(0.6, `rgba(255,235,210,${wa * 0.8})`);
      pg.addColorStop(1, `rgba(255,215,180,${wa * 0.3})`);
      c!.fillStyle = pg; c!.fillRect(0, 0, W, H);
      c!.restore();
      if (ft < 0.75) {
        const ra = (1 - ft / 0.75) * 0.45;
        c!.beginPath(); c!.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2);
        c!.strokeStyle = `rgba(255,240,200,${ra})`;
        c!.lineWidth = 4 * (1 - ft); c!.stroke();
      }
    }

    /* ── Dust (always) ── */
    function dDust(t: number) {
      for (const i of dustI) {
        const p = pl[i];
        p.x += p.vx + Math.sin(t * .3 + i) * .05; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        const fl = .5 + Math.sin(t * 1.4 + i * .6) * .5;
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * fl})`; c!.fill();
      }
    }

    /* ── Draw Sparks & Shards (tp 3 & 4) ── */
    function dEffects() {
      for (const p of pl) {
        if (!p.on) continue;
        if (p.tp === 3) {
          const lr = p.life / p.ml; const a = p.a * lr;
          c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
          c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c!.fill();
        }
        if (p.tp === 4) {
          const lr = p.life / p.ml; const a = p.a * lr;
          c!.save(); c!.translate(p.x, p.y); c!.rotate(p.rot);
          c!.fillStyle = `rgba(190,210,255,${a * 0.55})`;
          c!.fillRect(-p.sz * .12, -p.sz * .5, p.sz * .24, p.sz);
          c!.fillStyle = `rgba(255,255,255,${a * 0.35})`;
          c!.fillRect(-p.sz * .12, -p.sz * .5, p.sz * .07, p.sz);
          c!.restore();
        }
      }
    }

    /* ── Spawn: Fluid Fire (0-2s) ── */
    function sFluid(t: number) {
      if (t > 2.2 || Math.random() > 0.4) return;
      const p = grab(); if (!p) return;
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 60;
      p.x = W / 2 + Math.cos(ang) * dist;
      p.y = H / 2 + Math.sin(ang) * dist;
      p.vx = Math.cos(ang) * (0.5 + Math.random()); p.vy = -1 - Math.random() * 1.5;
      p.sz = 2 + Math.random() * 3; p.ml = 0.8 + Math.random() * 0.8; p.life = p.ml;
      p.r = 255; p.g = 100 + Math.random() * 100 | 0; p.b = 10 + Math.random() * 30 | 0;
      p.a = 0.6 + Math.random() * 0.3; p.on = true; p.tp = 1;
    }

    /* ── Spawn: Sparks (5-5.5s) ── */
    function sSparks(t: number) {
      if (t < 5.0 || t > 5.5 || Math.random() > 0.5) return;
      const p = grab(); if (!p) return;
      const silW = W * 0.5, silH = H * 0.55;
      const cx = (W - silW) / 2 + silW * 0.45;
      const cy = H * 0.05 + silH * 0.35;
      const ang = Math.random() * Math.PI * 2;
      const spd = 5 + Math.random() * 14;
      p.x = cx; p.y = cy;
      p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd;
      p.sz = 1 + Math.random() * 2.5; p.ml = 1 + Math.random() * 1.5; p.life = p.ml;
      p.r = 255; p.g = 150 + Math.random() * 100 | 0; p.b = 20 + Math.random() * 60 | 0;
      p.a = 0.8 + Math.random() * 0.2; p.on = true; p.tp = 3;
    }

    /* ── Spawn: Glass Shards (5-5.3s) ── */
    function sShards(t: number) {
      if (t < 5.0 || t > 5.3 || Math.random() > 0.35) return;
      const p = grab(); if (!p) return;
      const silW = W * 0.5, silH = H * 0.55;
      const cx = (W - silW) / 2 + silW * 0.45;
      const cy = H * 0.05 + silH * 0.35;
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 8;
      p.x = cx; p.y = cy;
      p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd;
      p.sz = 6 + Math.random() * 12; p.ml = 1.2 + Math.random(); p.life = p.ml;
      p.r = 200; p.g = 220; p.b = 255;
      p.a = 0.7; p.rot = Math.random() * Math.PI * 2;
      p.rs = (Math.random() - 0.5) * 0.15; p.on = true; p.tp = 4;
    }

    /* ── Particle Update ── */
    function upd(dt: number) {
      for (const p of pl) {
        if (!p.on || p.tp === 0 || p.tp === 2) continue;
        p.x += p.vx; p.y += p.vy; p.life -= dt; p.rot += p.rs;
        switch (p.tp) {
          case 1: p.vy -= 0.02; p.sz *= 0.995; break;
          case 3: p.vx *= 0.97; p.vy *= 0.97; break;
          case 4: p.vx *= 0.98; p.vy *= 0.98; p.vy += 0.08; break;
        }
        if (p.life <= 0 || p.y > H + 60 || p.x < -100 || p.x > W + 100) p.on = false;
      }
    }

    /* ═══════════════════════════════════════════════════════════
       RENDER LOOP
       ═══════════════════════════════════════════════════════════ */
    let lt = 0;
    const loop = (ts: number) => {
      if (!t0.current) { t0.current = ts; lt = ts; }
      const t = (ts - t0.current) / 1000;
      const dt = Math.min((ts - lt) / 1000, .05); lt = ts;

      /* Screen Shake */
      c!.save();
      if (t >= 5.0 && t < 5.6) {
        const si = Math.max(0, 1 - (t - 5.0) / 0.6);
        const mag = si * si * 14;
        c!.translate((Math.random() - .5) * mag, (Math.random() - .5) * mag);
      }

      /* Audio Triggers */
      playAt(0, aDrone, t);
      playAt(2, aSweep, t);
      playAt(5, aImpact, t);
      playAt(5, aBell, t);
      if (t >= 5.0 && !scattered.current) doScatter();

      /* Draw Order */
      dBg();
      dFluid(t);
      dSilGlow(t);
      dMorph(t, dt);
      dFlash(t);
      dShockwave(t);
      dEffects();
      dResidual(t);
      dText(t);
      dPortal(t);
      dDust(t);

      /* Spawn */
      sFluid(t);
      sSparks(t);
      sShards(t);

      upd(dt);
      c!.restore();

      if (t < DUR + 0.15) { raf.current = requestAnimationFrame(loop); }
      else if (!done.current) { done.current = true; cbR.current?.(); }
    };
    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioRef.current) { try { audioRef.current.close(); } catch (_) {} }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[9999]" style={{ background: '#030108' }}>
      <canvas ref={cvRef} className="block w-full h-full" />
    </div>
  );
}
