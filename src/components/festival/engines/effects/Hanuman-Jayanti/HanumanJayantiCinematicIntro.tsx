'use client';

import { useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   FESTIVAL CONFIG — Import this for syncing
   ═══════════════════════════════════════════════════════════════ */
export const HANUMAN_TIMELINE = {
  fluidStart: 0.0, fluidPeak: 1.0, fluidFade: 1.8,
  revealStart: 2.0, raysStart: 4.0, revealComplete: 5.0,
  impactTime: 5.0, windStart: 5.0, residualEnd: 7.0,
  omStart: 7.0, textStart: 7.3, textComplete: 9.0,
  portalStart: 9.5, portalComplete: 10.5, totalDuration: 10.5,
};

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
interface P {
  x: number; y: number; vx: number; vy: number;
  sz: number; life: number; ml: number;
  r: number; g: number; b: number; a: number;
  rot: number; rs: number; on: boolean; tp: number;
}
const POOL = 1800;
const DUR = 10.5;
const EP = 1e-4;
const IMG_URL = 'https://z-cdn-media.chatglm.cn/files/2cb4964b-0ebd-40b9-a453-8aec85e6b0b3.png?auth_key=1884048330-1fa70d71514b4f9eb8479a787ca744b4-0-79ecab9f582737711881c28dbeaa8cf0';

/* ═══════════════════════════════════════════════════════════════
   EASING
   ═══════════════════════════════════════════════════════════════ */
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOQ = (t: number) => 1 - Math.pow(1 - t, 4);
const eIQ = (t: number) => t * t;
const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void; imageUrl?: string }

export default function HanumanJayantiIntro({ onComplete, imageUrl }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const raf = useRef(0); const t0 = useRef(0);
  const done = useRef(false);
  const audioPlayed = useRef<Set<number>>(new Set());
  const cbR = useRef(onComplete); cbR.current = onComplete;

  /* ─── 🖼️ IMAGE PRELOAD ─── */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setReady(true); };
    img.onerror = () => { setReady(true); };
    img.src = imageUrl || IMG_URL;
    return () => { img.onload = null; img.onerror = null; };
  }, [imageUrl]);

  /* ═══════════════════════════════════════════════════════════════
     MAIN ANIMATION
     ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!ready) return;
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

    /* ── Particle Pool ── */
    const pl: P[] = [];
    for (let i = 0; i < POOL; i++)
      pl.push({ x: 0, y: 0, vx: 0, vy: 0, sz: 0, life: 0, ml: 1, r: 255, g: 150, b: 30, a: 0, rot: 0, rs: 0, on: false, tp: 0 });

    const dustI: number[] = [];
    for (let i = 0; i < 60; i++) {
      const p = pl[i]; p.on = true; p.tp = 0;
      p.x = Math.random() * W; p.y = Math.random() * H;
      p.vx = (Math.random() - .5) * .12; p.vy = -Math.random() * .2 - .03;
      p.sz = Math.random() * .9 + .3; p.ml = 999; p.life = 999;
      p.r = 255; p.g = 160 + Math.random() * 50 | 0; p.b = 30 + Math.random() * 35 | 0;
      p.a = Math.random() * .1 + .03; dustI.push(i);
    }

    const grab = () => { for (let i = 60; i < POOL; i++) if (!pl[i].on) return pl[i]; return null; };

    /* ── Image Dimensions ── */
    const getImg = () => {
      const img = imgRef.current;
      if (!img || !img.complete || img.naturalWidth === 0) return null;
      const dH = H * 0.62; const dW = dH * (img.naturalWidth / img.naturalHeight);
      const cx = W / 2, cy = H / 2 - H * 0.02;
      const maxR = Math.sqrt(dW * dW / 4 + dH * dH / 4) + 30;
      return { img, cx, cy, dW, dH, maxR };
    };

    /* ═══════════════════════════════════════════════════════════
       AUDIO
       ═══════════════════════════════════════════════════════════ */
    const playAt = (id: number, fn: () => void, t: number) => {
      if (!audioPlayed.current.has(id) && t >= id) { audioPlayed.current.add(id); fn(); }
    };
    const aDrone = () => {
      try {
        const ctx = audioRef.current; if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const g = ctx.createGain(); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 0.5);
        g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 4.5);
        g.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 6);
        const o = ctx.createOscillator(); o.frequency.value = 48; o.type = 'sine';
        o.connect(g); o.start(); o.stop(ctx.currentTime + 6);
        const o2 = ctx.createOscillator(); o2.frequency.value = 52; o2.type = 'triangle';
        const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.05, ctx.currentTime);
        g2.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 6);
        o2.connect(g2); g2.connect(ctx.destination); o2.start(); o2.stop(ctx.currentTime + 6);
      } catch (_) {}
    };
    const aSweep = () => {
      try {
        const ctx = audioRef.current; if (!ctx) return;
        const g = ctx.createGain(); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
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
        const dur = 0.5; const buf = ctx.createBuffer(1, ctx.sampleRate * dur | 0, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.06));
        const src = ctx.createBufferSource(); src.buffer = buf;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.4, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 100;
        src.connect(f); f.connect(g); g.connect(ctx.destination); src.start();
        const o = ctx.createOscillator(); o.frequency.value = 50; o.type = 'sine';
        const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.35, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        o.connect(g2); g2.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.6);
      } catch (_) {}
    };
    const aBell = () => {
      try {
        const ctx = audioRef.current; if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const dur = 3.5; const mg = ctx.createGain(); mg.connect(ctx.destination);
        mg.gain.setValueAtTime(0, ctx.currentTime);
        mg.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.01);
        mg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
        [1.0, 1.5, 2.0, 2.5, 3.0].forEach((r, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.frequency.value = 180 * r; o.type = i === 0 ? 'sine' : 'triangle';
          g.gain.setValueAtTime(0.3 / (i + 1), ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur / (i + 0.9));
          o.connect(g); g.connect(mg); o.start(); o.stop(ctx.currentTime + dur);
        });
      } catch (_) {}
    };

    /* ═══════════════════════════════════════════════════════════
       DRAW FUNCTIONS
       ═══════════════════════════════════════════════════════════ */

    /* ── 0.0s: Deep Space Background ── */
    function dBg() {
      c!.fillStyle = '#050108'; c!.fillRect(0, 0, W, H);
      let g = c!.createRadialGradient(W * .3, H * .2, 0, W * .3, H * .2, H * .65);
      g.addColorStop(0, 'rgba(22,5,40,0.22)'); g.addColorStop(1, 'rgba(5,1,8,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
      g = c!.createRadialGradient(W * .75, H * .8, 0, W * .75, H * .8, H * .5);
      g.addColorStop(0, 'rgba(15,3,28,0.16)'); g.addColorStop(1, 'rgba(5,1,8,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
      g = c!.createRadialGradient(W * .5, H * .5, H * .26, W * .5, H * .5, H * .96);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
    }

    /* ── 0.0-2.0s: Lava Energy (3x bigger, darker) ── */
    function dFluid(t: number) {
      if (t > 2.5) return;
      const fade = t < 1.8 ? Math.min(t / 0.8, 1) : Math.max(0, 1 - (t - 1.8) / 0.7);
      const cx = W / 2, cy = H / 2;
      const bR = Math.min(W, H) * 0.28;
      for (let i = 0; i < 8; i++) {
        const a = t * (0.5 + i * 0.18) + i * 0.9;
        const d = bR * 0.5 * Math.sin(t * 1.0 + i * 1.8);
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d;
        const r = bR * (0.65 + Math.sin(t * 1.5 + i * 1.1) * 0.3);
        const g = c!.createRadialGradient(x, y, 0, x, y, Math.max(EP, r));
        const al = fade * (0.18 + i * 0.02);
        g.addColorStop(0, `rgba(255,${90 + i * 12},${8 + i * 6},${al})`);
        g.addColorStop(0.35, `rgba(220,${45 + i * 8},0,${al * 0.5})`);
        g.addColorStop(0.7, `rgba(140,${15 + i * 5},0,${al * 0.15})`);
        g.addColorStop(1, 'rgba(80,5,0,0)');
        c!.fillStyle = g; c!.fillRect(x - r, y - r, r * 2, r * 2);
      }
      const cr = bR * 0.15 * fade;
      const cg = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, cr));
      cg.addColorStop(0, `rgba(255,240,200,${fade * 0.95})`);
      cg.addColorStop(0.4, `rgba(255,180,60,${fade * 0.4})`);
      cg.addColorStop(1, 'rgba(255,100,20,0)');
      c!.fillStyle = cg; c!.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
    }

    /* ── 0.5-2.0s: Floating "राम" Text ── */
    function dRamText(t: number) {
      if (t < 0.5 || t > 2.0) return;
      const fade = t < 1.5 ? Math.min((t - 0.5) / 0.8, 1) : Math.max(0, 1 - (t - 1.5) / 0.5);
      c!.save(); c!.globalAlpha = fade * 0.18;
      c!.textAlign = 'center'; c!.textBaseline = 'middle';
      c!.font = `300 ${Math.min(W * .025, 22)}px 'Noto Sans Devanagari','Mangal',serif`;
      c!.fillStyle = '#ff9933';
      const positions = [
        { x: W * .25, y: H * .35 }, { x: W * .72, y: H * .28 },
        { x: W * .18, y: H * .62 }, { x: W * .78, y: .58 },
        { x: W * .4, y: H * .75 }, { x: W * .6, y: H * .22 },
        { x: W * .35, y: H * .48 }, { x: W * .65, y: H * .7 },
      ];
      positions.forEach((p, i) => {
        const yOff = Math.sin(t * 0.8 + i * 1.5) * 8;
        c!.fillText('राम', p.x, p.y + yOff);
      });
      c!.restore();
    }

    /* ── 4.0-7.0s: Sun Rays Behind Image ── */
    function dRays(t: number) {
      if (t < 4.0 || t > 7.0) return;
      const d = getImg(); if (!d) return;
      let al = 0;
      if (t < 5.0) al = Math.min((t - 4.0) / 1.0, 1) * 0.06;
      else if (t < 5.5) al = 0.06 + Math.min((t - 5.0) / 0.5, 1) * 0.06;
      else al = 0.12 * Math.max(0, 1 - (t - 5.5) / 1.5);
      const rl = Math.max(W, H) * 0.9;
      c!.save(); c!.globalAlpha = al;
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + t * 0.04;
        const hw = (Math.PI / 16) * 0.32;
        c!.beginPath(); c!.moveTo(d.cx, d.cy);
        c!.lineTo(d.cx + Math.cos(ang - hw) * rl, d.cy + Math.sin(ang - hw) * rl);
        c!.lineTo(d.cx + Math.cos(ang + hw) * rl, d.cy + Math.sin(ang + hw) * rl);
        c!.closePath();
        const rg = c!.createRadialGradient(d.cx, d.cy, 0, d.cx, d.cy, Math.max(EP, rl));
        rg.addColorStop(0, 'rgba(255,200,80,0.8)');
        rg.addColorStop(0.4, 'rgba(255,150,40,0.2)');
        rg.addColorStop(1, 'rgba(255,100,20,0)');
        c!.fillStyle = rg; c!.fill();
      }
      c!.restore();
    }

    /* ── 2.0-5.0s: 3 Golden Rings Reveal ── */
    function dRings(t: number) {
      if (t < 2.0 || t > 5.5) return;
      const d = getImg(); if (!d) return;
      const rings = [
        { delay: 0, color: '255,210,80', width: 2.5, speed: 1.0 },
        { delay: 0.08, color: '255,140,30', width: 2.0, speed: 0.95 },
        { delay: 0.16, color: '255,245,200', width: 1.5, speed: 0.9 },
      ];
      for (const ring of rings) {
        const rt = Math.max(0, Math.min(1, (t - 2.0 - ring.delay) / 3.0 * ring.speed));
        if (rt <= 0) continue;
        const r = d.maxR * eIO(rt);
        const fade = rt < 0.9 ? 1 : Math.max(0, 1 - (rt - 0.9) / 0.1);
        c!.save();
        c!.beginPath(); c!.arc(d.cx, d.cy, Math.max(EP, r), 0, Math.PI * 2);
        c!.strokeStyle = `rgba(${ring.color},${fade * 0.7})`;
        c!.lineWidth = ring.width * (1 - rt * 0.5);
        c!.shadowColor = `rgba(${ring.color},${fade * 0.5})`;
        c!.shadowBlur = 20 * fade;
        c!.stroke();
        c!.restore();
      }
    }

    /* ── 2.0-5.0s: Image with Ring Clip ── */
    function dImage(t: number) {
      const d = getImg(); if (!d) return;
      if (t < 2.0) return;
      const rt = Math.max(0, Math.min(1, (t - 2.08) / 3.0 * 0.95));
      const revealR = d.maxR * eIO(rt);
      c!.save();
      c!.beginPath(); c!.arc(d.cx, d.cy, Math.max(EP, revealR), 0, Math.PI * 2); c!.clip();
      // Slight zoom breath after fully revealed
      let scale = 1;
      if (t > 5.0 && t < 7.0) scale = 1 + Math.sin((t - 5.0) * 2.5) * 0.005;
      let alpha = 1;
      if (t > 7.0) alpha = Math.max(0, 1 - (t - 7.0) / 2.0);
      const w = d.dW * scale, h = d.dH * scale;
      c!.globalAlpha = alpha;
      c!.drawImage(d.img, d.cx - w / 2, d.cy - h / 2, w, h);
      c!.restore();
    }

    /* ── 2.0-5.0s: Ring Edge Sparks ── */
    function sRingSparks(t: number) {
      if (t < 2.0 || t > 5.2 || Math.random() > 0.4) return;
      const d = getImg(); if (!d) return;
      const p = grab(); if (!p) return;
      const rt = Math.max(0, Math.min(1, (t - 2.0) / 3.0));
      const r = d.maxR * eIO(rt);
      const ang = Math.random() * Math.PI * 2;
      p.x = d.cx + Math.cos(ang) * r;
      p.y = d.cy + Math.sin(ang) * r;
      const outAng = ang + (Math.random() - 0.5) * 0.5;
      const spd = 2 + Math.random() * 4;
      p.vx = Math.cos(outAng) * spd; p.vy = Math.sin(outAng) * spd;
      p.sz = 1 + Math.random() * 2; p.ml = 0.5 + Math.random() * 0.5; p.life = p.ml;
      p.r = 255; p.g = 180 + Math.random() * 70 | 0; p.b = 30 + Math.random() * 50 | 0;
      p.a = 0.8; p.on = true; p.tp = 1;
    }

    /* ── 5.0-5.5s: Impact Flash ── */
    function dFlash(t: number) {
      if (t < 5.0 || t > 5.5) return;
      const ft = (t - 5.0) / 0.5;
      const intensity = (1 - ft) * (1 - ft);
      c!.fillStyle = `rgba(255,220,160,${intensity * 0.6})`;
      c!.fillRect(0, 0, W, H);
    }

    /* ── 5.0-7.0s: Shockwave Ring ── */
    function dShockwave(t: number) {
      const bt = Math.min((t - 5.0) / 2.0, 1); if (bt <= 0) return;
      const d = getImg(); if (!d) return;
      const maxR = Math.max(W, H) * 0.9;
      const r = maxR * eOQ(bt);
      const fade = (1 - bt) * (1 - bt);
      c!.save();
      c!.beginPath(); c!.arc(d.cx, d.cy, Math.max(EP, r), 0, Math.PI * 2);
      c!.strokeStyle = `rgba(255,210,100,${fade * 0.7})`; c!.lineWidth = 3 * (1 - bt); c!.stroke();
      c!.beginPath(); c!.arc(d.cx, d.cy, Math.max(EP, r), 0, Math.PI * 2);
      c!.strokeStyle = `rgba(255,130,30,${fade * 0.2})`; c!.lineWidth = 22 * (1 - bt); c!.stroke();
      c!.restore();
    }

    /* ── 5.0-5.8s: Wind Streaks (पवन सेना) ── */
    function dWind(t: number) {
      if (t < 5.0 || t > 5.8) return;
      const d = getImg(); if (!d) return;
      const ft = (t - 5.0) / 0.8;
      const fade = ft < 0.3 ? ft / 0.3 : Math.max(0, 1 - (ft - 0.3) / 0.7);
      c!.save(); c!.globalAlpha = fade * 0.6;
      c!.lineCap = 'round';
      const streaks = 24;
      for (let i = 0; i < streaks; i++) {
        const edgeAng = (i / streaks) * Math.PI * 2;
        const startDist = Math.max(W, H) * 0.7;
        const progress = Math.min(ft * 1.5, 1);
        const sx = d.cx + Math.cos(edgeAng) * startDist * (1 - progress);
        const sy = d.cy + Math.sin(edgeAng) * startDist * (1 - progress);
        const ex = d.cx + Math.cos(edgeAng) * startDist * (1 - Math.min(ft * 1.2, 1));
        const ey = d.cy + Math.sin(edgeAng) * startDist * (1 - Math.min(ft * 1.2, 1));
        c!.beginPath(); c!.moveTo(sx, sy); c!.lineTo(ex, ey);
        c!.strokeStyle = `rgba(255,${160 + i * 3},40,${fade * 0.5})`;
        c!.lineWidth = 1.5 + Math.random(); c!.stroke();
      }
      c!.restore();
    }

    /* ── 5.0-7.0s: Residual Glow ── */
    function dResidual(t: number) {
      if (t < 5.0 || t > 7.0) return;
      const d = getImg(); if (!d) return;
      const fade = t < 5.5 ? Math.min((t - 5.0) / 0.5, 1) : Math.max(0, 1 - (t - 5.5) / 1.5);
      const r = Math.min(W, H) * 0.35;
      const g = c!.createRadialGradient(d.cx, d.cy, 0, d.cx, d.cy, Math.max(EP, r));
      g.addColorStop(0, `rgba(255,160,40,${fade * 0.15})`);
      g.addColorStop(0.5, `rgba(255,100,20,${fade * 0.05})`);
      g.addColorStop(1, 'rgba(255,60,0,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
    }

    /* ── 7.0-9.5s: "ॐ" Symbol ── */
    function dOm(t: number) {
      const ps = 7.0, ft = Math.min((t - ps) / 1.0, 1); if (ft <= 0) return;
      const fi = eOC(ft);
      const mainY = H * 0.55;
      const omY = mainY - Math.min(W * .07, H * .08, 52) * 1.5;
      c!.save(); c!.globalAlpha = fi * 0.85;
      c!.textAlign = 'center'; c!.textBaseline = 'middle';
      const os = Math.min(W * .045, H * .055, 38);
      c!.font = `400 ${os}px 'Noto Sans Devanagari','Mangal','Devanagari Sangam MN',serif`;
      c!.fillStyle = 'rgba(0,0,0,0.6)';
      c!.fillText('ॐ', W / 2 + 1, omY + 1.5);
      const ow = c!.measureText('ॐ').width;
      const og = c!.createLinearGradient(W / 2 - ow / 2, 0, W / 2 + ow / 2, 0);
      og.addColorStop(0, '#b8860b'); og.addColorStop(0.3, '#ffd700');
      og.addColorStop(0.5, '#fffacd'); og.addColorStop(0.7, '#ffd700');
      og.addColorStop(1, '#b8860b');
      c!.fillStyle = og; c!.fillText('ॐ', W / 2, omY);
      c!.restore();
    }

    /* ── 7.3-9.5s: Kinetic Text — "जय हनुमान" + श्लोक ── */
    function dText(t: number) {
      const ps = 7.3, ft = Math.min((t - ps) / 1.5, 1); if (ft <= 0) return;
      const fi = eOC(ft);
      const mainY = H * 0.55;
      c!.save(); c!.globalAlpha = fi;
      c!.textAlign = 'center'; c!.textBaseline = 'middle';

      const ts = Math.min(W * .075, H * .09, 64);
      c!.font = `800 ${ts}px 'Noto Sans Devanagari','Mangal','Devanagari Sangam MN',sans-serif`;

      // Crisp offset shadow
      c!.fillStyle = 'rgba(0,0,0,0.75)';
      c!.fillText('जय हनुमान', W / 2 + 2, mainY + 3);

      // Iridescent gold gradient
      const tw = c!.measureText('जय हनुमान').width;
      const hue = Math.sin(t * 2.5) * 0.15;
      const tg = c!.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
      tg.addColorStop(0, `hsl(${32 + hue * 25},85%,22%)`);
      tg.addColorStop(0.12, `hsl(${35 + hue * 18},90%,35%)`);
      tg.addColorStop(0.30, `hsl(${40 + hue * 12},95%,50%)`);
      tg.addColorStop(0.48, `hsl(43,100%,68%)`);
      tg.addColorStop(0.52, `hsl(45,100%,75%)`);
      tg.addColorStop(0.70, `hsl(43,100%,68%)`);
      tg.addColorStop(0.88, `hsl(${40 - hue * 12},95%,50%)`);
      tg.addColorStop(1, `hsl(${32 - hue * 25},85%,22%)`);
      c!.fillStyle = tg; c!.fillText('जय हनुमान', W / 2, mainY);

      // Shlok
      const ss = Math.min(W * .022, H * .026, 17);
      c!.font = `400 ${ss}px 'Nirmala UI','Devanagari Sangam MN','Mangal',sans-serif`;
      const shY = mainY + ts * 1.2;
      c!.fillStyle = 'rgba(0,0,0,0.8)';
      c!.fillText('अतुलित बलधाम ह्येषं हनुमान शरीरापि।', W / 2 + 1, shY + 1.2);
      c!.fillText('बुद्धिहीन तनु जानिके सुमिराव पवन सखारा॥', W / 2 + 1, shY + ss * 2.2);
      const sg = c!.createLinearGradient(W / 2 - ss * 13, 0, W / 2 + ss * 13, 0);
      sg.addColorStop(0, '#856314'); sg.addColorStop(0.25, '#d4a020');
      sg.addColorStop(0.5, '#ffd700'); sg.addColorStop(0.75, '#d4a020');
      sg.addColorStop(1, '#856314');
      c!.fillStyle = sg;
      c!.fillText('अतुलित बलधाम ह्येषं हनुमान शरीरापि।', W / 2, shY);
      c!.fillText('बुद्धिहीन तनु जानिके सुमिराव पवन सखारा॥', W / 2, shY + ss * 2.2);
      c!.restore();
    }

    /* ── 9.5-10.5s: Golden-Rimmed Portal Fade ── */
    function dPortal(t: number) {
      const ft = Math.min((t - 9.5) / 1.0, 1); if (ft <= 0) return;
      const cx = W / 2, cy = H / 2;
      const maxR = Math.max(W, H) * 1.05;
      const r = maxR * eOE(ft);
      const wa = eOC(ft) * 0.92;

      // White-gold fill
      c!.save(); c!.beginPath();
      c!.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2); c!.clip();
      const pg = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, r));
      pg.addColorStop(0, `rgba(255,250,240,${wa})`);
      pg.addColorStop(0.4, `rgba(255,240,210,${wa * 0.85})`);
      pg.addColorStop(0.7, `rgba(255,220,170,${wa * 0.4})`);
      pg.addColorStop(1, `rgba(255,200,130,${wa * 0.15})`);
      c!.fillStyle = pg; c!.fillRect(0, 0, W, H);
      c!.restore();

      // Golden rim
      if (ft < 0.8) {
        const rimFade = (1 - ft / 0.8);
        c!.beginPath(); c!.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2);
        c!.strokeStyle = `rgba(255,210,80,${rimFade * 0.5})`;
        c!.lineWidth = 5 * rimFade;
        c!.shadowColor = `rgba(255,200,60,${rimFade * 0.4})`;
        c!.shadowBlur = 15 * rimFade;
        c!.stroke();
        c!.shadowBlur = 0;
      }
    }

    /* ── Always: Dust Particles ── */
    function dDust(t: number) {
      for (const i of dustI) {
        const p = pl[i];
        p.x += p.vx + Math.sin(t * .3 + i) * .04; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        const fl = .5 + Math.sin(t * 1.4 + i * .6) * .5;
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * fl})`; c!.fill();
      }
    }

    /* ── Draw Spark Particles ── */
    function dSparks() {
      for (const p of pl) {
        if (!p.on || p.tp !== 1) continue;
        const lr = p.life / p.ml; const a = p.a * lr;
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz * lr), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c!.fill();
      }
    }

    /* ── Spawn: Fluid Fire Particles (0-2s) ── */
    function sFluid(t: number) {
      if (t > 2.2 || Math.random() > 0.35) return;
      const p = grab(); if (!p) return;
      const ang = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 80;
      p.x = W / 2 + Math.cos(ang) * dist;
      p.y = H / 2 + Math.sin(ang) * dist;
      p.vx = Math.cos(ang) * (0.3 + Math.random() * 0.8);
      p.vy = -1.2 - Math.random() * 1.8;
      p.sz = 2 + Math.random() * 3.5; p.ml = 0.6 + Math.random() * 0.6; p.life = p.ml;
      p.r = 255; p.g = 80 + Math.random() * 120 | 0; p.b = 5 + Math.random() * 25 | 0;
      p.a = 0.5 + Math.random() * 0.35; p.on = true; p.tp = 1;
    }

    /* ── Spawn: Impact Sparks (5-5.5s) ── */
    function sImpactSparks(t: number) {
      if (t < 5.0 || t > 5.5 || Math.random() > 0.5) return;
      const d = getImg(); if (!d) return;
      const p = grab(); if (!p) return;
      const ang = Math.random() * Math.PI * 2;
      const spd = 6 + Math.random() * 16;
      p.x = d.cx; p.y = d.cy;
      p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd;
      p.sz = 1 + Math.random() * 2.5; p.ml = 0.8 + Math.random() * 1.2; p.life = p.ml;
      p.r = 255; p.g = 140 + Math.random() * 110 | 0; p.b = 15 + Math.random() * 55 | 0;
      p.a = 0.9; p.on = true; p.tp = 1;
    }

    /* ── Particle Update ── */
    function upd(dt: number) {
      for (const p of pl) {
        if (!p.on || p.tp === 0) continue;
        p.x += p.vx; p.y += p.vy; p.life -= dt; p.rot += p.rs;
        if (p.tp === 1) { p.vx *= 0.97; p.vy *= 0.97; p.vy += 0.02; }
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

      c!.save();
      // Screen shake at impact
      if (t >= 5.0 && t < 5.7) {
        const si = Math.max(0, 1 - (t - 5.0) / 0.7);
        const mag = si * si * 16;
        c!.translate((Math.random() - .5) * mag, (Math.random() - .5) * mag);
      }

      // Audio triggers
      playAt(0, aDrone, t);
      playAt(2, aSweep, t);
      playAt(5, aImpact, t);
      playAt(5, aBell, t);

      // Draw order (back to front)
      dBg();
      dFluid(t);
      dRamText(t);
      dRays(t);
      dRings(t);
      dImage(t);
      dRingSparks(t);
      dFlash(t);
      dShockwave(t);
      dWind(t);
      dResidual(t);
      dSparks();
      dOm(t);
      dText(t);
      dPortal(t);
      dDust(t);

      // Spawn
      sFluid(t);
      sRingSparks(t);
      sImpactSparks(t);

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
  }, [ready]);

  /* ═══════════════════════════════════════════════════════════════
     🪔 LOADING SCREEN — Saffron Devotional Aura
     ═══════════════════════════════════════════════════════════════ */
  if (!ready) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden" style={{ background: '#050108' }}>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(120,30,5,0.2) 0%, rgba(40,8,15,0.08) 40%, transparent 70%)',
        }} />
        <div className="absolute rounded-full" style={{
          width: 'min(55vw, 300px)', height: 'min(55vw, 300px)',
          border: '1px dashed rgba(255,140,40,0.12)',
          animation: 'hRing 12s linear infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 'min(40vw, 220px)', height: 'min(40vw, 220px)',
          background: 'radial-gradient(circle, rgba(255,130,30,0.08) 0%, transparent 65%)',
          animation: 'hPulse 3s ease-in-out infinite',
        }} />
        <div className="relative select-none" style={{
          fontSize: 'clamp(3.5rem, 11vw, 6.5rem)', lineHeight: 1,
          color: '#ff8c00',
          textShadow: '0 0 20px rgba(255,140,0,0.7), 0 0 50px rgba(255,100,0,0.4), 0 0 100px rgba(255,80,0,0.2)',
          animation: 'hPulse 3s ease-in-out infinite',
          fontFamily: "'Noto Sans Devanagari','Mangal','Devanagari Sangam MN',serif",
        }}>ॐ</div>
        <p className="absolute select-none tracking-[0.3em]" style={{
          bottom: '12%', fontSize: 'clamp(0.55rem, 1.3vw, 0.75rem)',
          color: 'rgba(255,160,60,0.45)', animation: 'hPulse 3s ease-in-out infinite',
          fontFamily: "'Noto Sans Devanagari','Mangal',sans-serif",
        }}>हनुमान जयंती आरती प्रारंभ हो रही है</p>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes hPulse { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
          @keyframes hRing { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        ` }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999]" style={{ background: '#050108' }}>
      <canvas ref={cvRef} className="block w-full h-full" />
    </div>
  );
}
