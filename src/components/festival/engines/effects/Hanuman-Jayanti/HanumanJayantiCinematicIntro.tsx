'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
interface P {
  x: number; y: number; vx: number; vy: number;
  sz: number; life: number; ml: number;
  r: number; g: number; b: number; a: number;
  rot: number; rs: number; on: boolean; tp: number;
}
const POOL = 3400;
const DUR = 10.5; // 🚀 Snappy 10.5s Timeline
const EP = 1e-4;
const IMG_URL = 'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Hanuman%20JI/Screenshot%202026-07-14%20221205.png';

/* ═══════════════════════════════════════════════════════════════
   EASING HELPERS
   ═══════════════════════════════════════════════════════════════ */
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOQ = (t: number) => 1 - Math.pow(1 - t, 4);
const eIQ = (t: number) => t * t;
const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/* ═══════════════════════════════════════════════════════════════
   🌸 FLOWER COLORS — पुष्प वर्षा Devotional Palette
   ═══════════════════════════════════════════════════════════════ */
const FLOWER_COLORS = [
  { r: 255, g: 100, b: 60 },   // गेंदा लाल
  { r: 255, g: 180, b: 20 },   // गेंदा नारंगी
  { r: 255, g: 220, b: 80 },   // पीला
  { r: 255, g: 140, b: 170 },  // गुलाबी
  { r: 255, g: 245, b: 235 },  // सफेद क्रीम
  { r: 255, g: 70, b: 50 },    // गहरा लाल
  { r: 255, g: 200, b: 60 },   // सोना
  { r: 255, g: 120, b: 140 },  // गुलाब
];

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
    img.onload = () => { imgRef.current = img; setReady(true); };
    img.onerror = () => { setReady(true); };
    img.src = imageUrl || IMG_URL;
    return () => { img.onload = null; img.onerror = null; };
  }, [imageUrl]);

  const mkPool = useCallback(() => {
    const a: P[] = [];
    for (let i = 0; i < POOL; i++)
      a.push({ x: 0, y: 0, vx: 0, vy: 0, sz: 0, life: 0, ml: 1, r: 255, g: 200, b: 50, a: 0, rot: 0, rs: 0, on: false, tp: 0 });
    return a;
  }, []);

  const grab = useCallback((p: P[]) => {
    for (let i = 60; i < POOL; i++) if (!p[i].on) return p[i];
    return null;
  }, []);

  const triggerBellSound = useCallback((frequency: number) => {
    try {
      if (!audioRef.current) return;
      const ctx = audioRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const duration = 4.2;
      const mainGain = ctx.createGain();
      mainGain.connect(ctx.destination);
      mainGain.gain.setValueAtTime(0, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.01);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      [1.0, 1.5, 2.0, 2.6, 3.12].forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const gNode = ctx.createGain();
        osc.frequency.value = frequency * ratio;
        osc.type = i === 0 ? 'sine' : 'triangle';
        gNode.gain.setValueAtTime(0.4 / (i + 1), ctx.currentTime);
        gNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / (i + 0.9));
        osc.connect(gNode); gNode.connect(mainGain);
        osc.start(); osc.stop(ctx.currentTime + duration);
      });
    } catch (err) { console.warn("Bell sound failed:", err); }
  }, []);

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

    const pl = mkPool();
    const dustI: number[] = [];
    for (let i = 0; i < 60; i++) {
      const p = pl[i]; p.on = true; p.tp = 0;
      p.x = Math.random() * W; p.y = Math.random() * H;
      p.vx = (Math.random() - .5) * .12; p.vy = -Math.random() * .2 - .03;
      p.sz = Math.random() * .9 + .3; p.ml = 999; p.life = 999;
      p.r = 255; p.g = 160 + Math.random() * 50 | 0; p.b = 30 + Math.random() * 35 | 0;
      p.a = Math.random() * .1 + .03; dustI.push(i);
    }

    const getImg = () => {
      const img = imgRef.current;
      if (!img || !img.complete || img.naturalWidth === 0) return null;
      const aspect = img.naturalWidth / img.naturalHeight;
      const diam = Math.min(W, H) * 0.46;
      const clipR = diam / 2;
      let dW: number, dH: number;
      if (aspect >= 1) {
        dH = diam; dW = diam * aspect;
      } else {
        dW = diam; dH = diam / aspect;
      }
      const yShift = aspect < 1 ? -(dH - diam) * 0.12 : 0;
      return { img, cx: W / 2, cy: H / 2 + yShift, dW, dH, maxR: clipR };
    };

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

    const handleScreenClick = () => {
      try {
        if (audioRef.current && audioRef.current.state === 'suspended') {
          audioRef.current.resume();
        }
      } catch (_) {}
    };
    window.addEventListener('click', handleScreenClick);
    window.addEventListener('touchstart', handleScreenClick);

    /* ───────── DRAW HELPERS ───────── */

    function dBg(t: number) {
      c!.fillStyle = '#07030a'; c!.fillRect(0, 0, W, H);
      const aa = t < 1.5 ? eOC(Math.min(t / 1.5, 1)) * .6 : .6;
      let g = c!.createRadialGradient(W * .5, H * .22, 0, W * .5, H * .22, H * .9);
      g.addColorStop(0, `rgba(185,85,12,${aa * .3})`);
      g.addColorStop(.55, `rgba(105,22,22,${aa * .16})`);
      g.addColorStop(1, 'rgba(7,3,10,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
      g = c!.createRadialGradient(W * .5, H * .88, 0, W * .5, H * .88, H * .5);
      g.addColorStop(0, `rgba(70,10,18,${aa * .4})`);
      g.addColorStop(1, 'rgba(7,3,10,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
      let ca = 0;
      if (t > 1.5) ca = Math.min((t - 1.5) / 3, 1) * .2;
      if (t > 4.5) ca = .2 + Math.min((t - 4.5) / 1.5, 1) * .18;
      if (t > 7.0) ca = .38 + Math.min((t - 7.0) / 1.0, 1) * .15;
      if (t > 8.5) ca = .53 + Math.min((t - 8.5) / 1.0, 1) * .12;
      g = c!.createRadialGradient(W * .5, H * .43, 0, W * .5, H * .43, H * .5);
      g.addColorStop(0, `rgba(255,170,40,${ca})`);
      g.addColorStop(.4, `rgba(190,65,22,${ca * .4})`);
      g.addColorStop(1, 'rgba(7,3,10,0)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
      g = c!.createRadialGradient(W * .5, H * .5, H * .26, W * .5, H * .5, H * .96);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)');
      c!.fillStyle = g; c!.fillRect(0, 0, W, H);
    }

    // 🚀 NEW: 0.0s - 2.5s Saffron Watermark (ॐ) behind fluid fire
    function dBackWatermark(t: number) {
      if (t > 2.5) return;
      const fade = t < 1.5 ? Math.min(t / 0.8, 1) : Math.max(0, 1 - (t - 1.5) / 0.8);
      c!.save();
      c!.globalAlpha = fade * 0.038; // Subtle transparent watermark
      c!.textAlign = 'center';
      c!.textBaseline = 'middle';
      const size = Math.min(W, H) * 0.38;
      c!.font = `400 ${size}px 'Noto Sans Devanagari','Mangal','Devanagari Sangam MN',serif`;
      c!.fillStyle = '#ff9933';
      c!.fillText('ॐ', W / 2, H / 2 - H * 0.02);
      c!.restore();
    }

    function dTemples(t: number) {
      const fa = t < 1.5 ? eOC(Math.min(t / 1.5, 1)) * .28 : .28;
      if (t > 8.5) { if (Math.max(0, 1 - (t - 8.5) / 1.3) <= 0) return; }
      const al = t > 8.5 ? Math.max(0, .28 - (t - 8.5) * .215) : fa;
      c!.save(); c!.globalAlpha = al; c!.fillStyle = '#0e0718';
      const gops = [
        { cx: W * .1, bw: W * .1, bh: H * .28, ti: 5 }, { cx: W * .18, bw: W * .065, bh: H * .2, ti: 4 },
        { cx: W * .83, bw: W * .09, bh: H * .25, ti: 5 }, { cx: W * .92, bw: W * .055, bh: H * .18, ti: 3 },
        { cx: W * .5, bw: W * .045, bh: H * .12, ti: 3 }, { cx: W * .38, bw: W * .04, bh: H * .1, ti: 3 },
        { cx: W * .62, bw: W * .04, bh: H * .1, ti: 3 },
      ];
      for (const g of gops) {
        const by = H * .86; const th = g.bh / (g.ti + 1);
        for (let i = 0; i < g.ti; i++) {
          const sh = 1 - (i / g.ti) * .55; const w = g.bw * sh;
          c!.fillRect(g.cx - w / 2, by - (i + 1) * th, w, th + 1);
        }
        const tw = g.bw * .28; const ty = by - g.ti * th;
        c!.beginPath(); c!.moveTo(g.cx, ty - th * .7); c!.lineTo(g.cx - tw / 2, ty); c!.lineTo(g.cx + tw / 2, ty); c!.closePath(); c!.fill();
      }
      c!.fillRect(0, H * .86, W, H * .14);
      const gg = c!.createLinearGradient(0, H * .84, 0, H * .9);
      gg.addColorStop(0, 'rgba(120,40,20,0)'); gg.addColorStop(1, `rgba(120,40,20,${al * .3})`);
      c!.fillStyle = gg; c!.fillRect(0, H * .84, W, H * .06);
      c!.restore();
    }

    function sSmoke() {
      if (Math.random() > .2) return;
      const p = grab(pl); if (!p) return;
      p.x = W * .2 + Math.random() * W * .6; p.y = H * .5 + Math.random() * H * .3;
      p.vx = (Math.random() - .5) * .4; p.vy = -Math.random() * .6 - .2;
      p.sz = Math.random() * 50 + 20; p.ml = 5 + Math.random() * 3; p.life = p.ml;
      p.r = 150; p.g = 95; p.b = 65; p.a = .03 + Math.random() * .02;
      p.rot = 0; p.rs = 0; p.on = true; p.tp = 6;
    }

    function dSmoke() {
      for (const p of pl) {
        if (!p.on || p.tp !== 6) continue;
        const lr = p.life / p.ml; const a = p.a * (lr < .3 ? lr / .3 : lr > .7 ? (1 - lr) / .3 : 1);
        const g = c!.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, p.sz));
        g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a})`); g.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
        c!.fillStyle = g; c!.fillRect(p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
      }
    }

    function sStreams(t: number) {
      if (t > 1.8) return;
      const prog = Math.min(t / 1.5, 1);
      for (let s = 0; s < 2; s++) {
        const side = s === 0 ? -1 : 1;
        const sx = s === 0 ? -30 : W + 30; const ex = W * .5, ey = H * .43;
        for (let i = 0; i < 5; i++) {
          const p = grab(pl); if (!p) break;
          const tt = Math.random() * prog;
          const cpx = side === -1 ? W * .16 : W * .84;
          const cpy = H * .16 + Math.sin(tt * Math.PI) * H * .14;
          const m = 1 - tt;
          p.x = m * m * sx + 2 * m * tt * cpx + tt * tt * ex + (Math.random() - .5) * 40;
          p.y = m * m * (H * .52) + 2 * m * tt * cpy + tt * tt * ey + (Math.random() - .5) * 40;
          p.vx = side * (Math.random() * 2.5 + .8); p.vy = (Math.random() - .5) * .5;
          p.sz = Math.random() * 3.2 + .7; p.ml = 1.5 + Math.random(); p.life = p.ml;
          p.r = 255; p.g = 170 + Math.random() * 70 | 0; p.b = 20 + Math.random() * 50 | 0;
          p.a = .5 + Math.random() * .45; p.rot = 0; p.rs = 0; p.on = true; p.tp = 1;
        }
      }
    }

    function dStreams() {
      for (const p of pl) {
        if (!p.on || p.tp !== 1) continue;
        const lr = p.life / p.ml; const a = p.a * Math.min(lr * 3, 1) * Math.min((1 - lr) * 3, 1);
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c!.fill();
        if (p.sz > 1.6) {
          const g = c!.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, p.sz * 3.5));
          g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a * .22})`); g.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          c!.fillStyle = g; c!.fillRect(p.x - p.sz * 3.5, p.y - p.sz * 3.5, p.sz * 7, p.sz * 7);
        }
      }
    }

    function dDust(t: number) {
      for (let i = 0; i < dI.length; i++) {
        const p = pl[dI[i]];
        p.x += p.vx + Math.sin(t * .35 + i) * .07; p.y += p.vy;
        if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
        if (p.x < -12) p.x = W + 12; if (p.x > W + 12) p.x = -12;
        const fl = .6 + Math.sin(t * 1.6 + i * .55) * .4;
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * fl})`; c!.fill();
      }
    }

    function dOutline(t: number) {
      const ps = 2.5, dur = 3;
      const prog = eIO(Math.min((t - ps) / dur, 1));
      const show = Math.floor(prog * gn); if (show < 2) return;
      const sc = Math.min(W, H) * .56; const ox = (W - sc) / 2, oy = (H - sc) / 2 - H * .015;
      c!.save(); c!.lineCap = 'round'; c!.lineJoin = 'round';
      
      c!.shadowColor = 'rgba(255,170,40,.6)'; c!.shadowBlur = 22;
      c!.strokeStyle = `rgba(255,190,65,.35)`; c!.lineWidth = 5.2;
      c!.beginPath(); c!.moveTo(gp[0][0] * sc + ox, gp[0][1] * sc + oy);
      for (let i = 1; i < show; i++) c!.lineTo(gp[i][0] * sc + ox, gp[i][1] * sc + oy); c!.stroke();
      
      c!.shadowColor = 'rgba(255,210,85,.8)'; c!.shadowBlur = 10;
      c!.strokeStyle = 'rgba(255,225,130,.95)'; c!.lineWidth = 2.4;
      c!.beginPath(); c!.moveTo(gp[0][0] * sc + ox, gp[0][1] * sc + oy);
      for (let i = 1; i < show; i++) c!.lineTo(gp[i][0] * sc + ox, gp[i][1] * sc + oy); c!.stroke();
      
      if (t - ps < dur && show > 0) {
        const lp = gp[show - 1]; const lx = lp[0] * sc + ox, ly = lp[1] * sc + oy;
        const eg = c!.createRadialGradient(lx, ly, 0, lx, ly, Math.max(EP, 20));
        eg.addColorStop(0, 'rgba(255,255,190,.9)'); eg.addColorStop(.35, 'rgba(255,190,65,.4)'); eg.addColorStop(1, 'rgba(255,165,35,0)');
        c!.fillStyle = eg; c!.fillRect(lx - 20, ly - 20, 40, 40);
      }
      
      c!.shadowBlur = 0;
      for (let i = 0; i < show; i += 4) {
        const pt = gp[i]; const sp = .22 + Math.sin(t * 3.2 + i * .4) * .22;
        c!.beginPath(); c!.arc(pt[0] * sc + ox, pt[1] * sc + oy, Math.max(EP, 1.1), 0, Math.PI * 2);
        c!.fillStyle = `rgba(255,232,165,${sp})`; c!.fill();
      }
      c!.restore();
    }

    function sOrbit(t: number) {
      if (t < 3.5 || t > 10.0 || Math.random() > .2) return;
      const p = grab(pl); if (!p) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015;
      const ang = Math.random() * Math.PI * 2; const rad = sc * .38 + Math.random() * sc * .08;
      p.x = cx + Math.cos(ang) * rad; p.y = cy + Math.sin(ang) * rad;
      p.vx = Math.cos(ang + Math.PI / 2) * .65; p.vy = Math.sin(ang + Math.PI / 2) * .65;
      p.sz = Math.random() * 1.6 + .4; p.ml = 2 + Math.random() * 2; p.life = p.ml;
      p.r = 255; p.g = 200 + Math.random() * 50 | 0; p.b = 65 + Math.random() * 55 | 0;
      p.a = .4 + Math.random() * .35; p.rot = 0; p.rs = 0; p.on = true; p.tp = 5;
    }

    function dOrbit() {
      for (const p of pl) {
        if (!p.on || p.tp !== 5) continue;
        const lr = p.life / p.ml; const a = p.a * Math.min(lr * 2, 1) * Math.min((1 - lr) * 2, 1);
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c!.fill();
      }
    }

    function dEnergy(t: number) {
      if (t < 4.5 || t > 8.0) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015;
      let ea = 0;
      if (t < 6.5) ea = Math.min((t - 4.5) / 2, 1) * .14;
      else ea = .14 * (1 - Math.min((t - 6.5) / 1.5, 1) * .5);
      const eg = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, sc * .42));
      eg.addColorStop(0, `rgba(255,195,55,${ea})`); eg.addColorStop(.5, `rgba(255,140,35,${ea * .4})`); eg.addColorStop(1, 'rgba(255,100,20,0)');
      c!.fillStyle = eg; c!.fillRect(0, 0, W, H);
    }

    function dBells(t: number) {
      const bs = 4.5; if (t < bs) return;
      let ba = Math.min((t - bs) / .6, 1);
      if (t > 7.5) ba = Math.max(0, 1 - (t - 7.5) / .6);
      if (ba <= 0) return;
      const bsz = Math.min(W, H) * .11;
      drawBell(W * .28, H * .04, bsz, .28 * Math.sin(t * 2.6) * ba, ba);
      drawBell(W * .72, H * .04, bsz, .24 * Math.sin(t * 2.9 + 1.6) * ba, ba);
      bells.forEach((bell, idx) => {
        const swingFreq = 1.8 + idx * 0.35;
        const angle = Math.sin(t * swingFreq) * 0.18;
        if (Math.abs(angle) < 0.02 && t - bell.lastBellTime > 0.8) {
          bell.lastBellTime = t;
          const freqs = [220, 165, 294];
          triggerBellSound(freqs[idx]);
        }
      });
    }

    function drawBell(ax: number, ay: number, s: number, ang: number, al: number) {
      c!.save(); c!.globalAlpha = al; c!.translate(ax, ay); c!.rotate(ang);
      c!.strokeStyle = '#7a6535'; c!.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        c!.beginPath(); c!.ellipse(0, s * .08 * (i + 1), s * .028, s * .045, 0, 0, Math.PI * 2); c!.stroke();
      }
      const ty = s * .32, bb = s, tw = s * .11, bw = s * .34;
      c!.beginPath(); c!.moveTo(-tw, ty);
      c!.bezierCurveTo(-tw, ty + s * .2, -bw * .82, ty + s * .4, -bw * .5, bb);
      c!.lineTo(bw * .5, bb);
      c!.bezierCurveTo(bw * .82, ty + s * .4, tw, ty + s * .2, tw, ty);
      c!.closePath();
      const bg = c!.createLinearGradient(-bw, 0, bw, 0);
      bg.addColorStop(0, '#523e10'); bg.addColorStop(.25, '#9a7520'); bg.addColorStop(.45, '#c9a030');
      bg.addColorStop(.55, '#dab540'); bg.addColorStop(.75, '#9a7520'); bg.addColorStop(1, '#523e10');
      c!.fillStyle = bg; c!.fill();
      
      c!.beginPath(); c!.moveTo(-tw * .25, ty + s * .05);
      c!.bezierCurveTo(-tw * .25, ty + s * .2, -bw * .22, ty + s * .4, -bw * .22, bb - s * .04);
      c!.lineTo(-bw * .1, bb - s * .04);
      c!.bezierCurveTo(-bw * .1, ty + s * .4, -tw * .1, ty + s * .2, -tw * .1, ty * .05);
      c!.closePath(); c!.fillStyle = 'rgba(255,228,165,.12)'; c!.fill();
      
      c!.beginPath(); c!.moveTo(-bw * .5, bb); c!.lineTo(bw * .5, bb);
      c!.strokeStyle = '#dab540'; c!.lineWidth = 1.8; c!.stroke();
      
      const rg = c!.createRadialGradient(0, bb, 0, 0, bb, Math.max(EP, s * .3));
      rg.addColorStop(0, 'rgba(255,195,65,.15)'); rg.addColorStop(1, 'rgba(255,195,65,0)');
      c!.fillStyle = rg; c!.fillRect(-s * .3, bb - s * .3, s * .6, s * .6);
      
      c!.beginPath(); c!.arc(0, bb - s * .06, s * .035, 0, Math.PI * 2); c!.fillStyle = '#3e2e0c'; c!.fill();
      c!.restore();
    }

    function dAarti(t: number) {
      const as = 5.5; if (t < as) return;
      let aa = Math.min((t - as) / .6, 1);
      if (t > 7.8) aa = Math.max(0, 1 - (t - 7.8) / .4);
      if (aa <= 0) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015;
      const orad = sc * .44; const ang = (t - as) * Math.PI * 1.3;
      const ax = cx + Math.cos(ang) * orad; const ay = cy + Math.sin(ang) * orad * .52;
      for (let i = 1; i < 18; i++) {
        const ta = ang - i * .045; const tx = cx + Math.cos(ta) * orad; const ty = cy + Math.sin(ta) * orad * .52;
        const tg = c!.createRadialGradient(tx, ty, 0, tx, ty, Math.max(EP, 10));
        tg.addColorStop(0, `rgba(255,175,45,${(1 - i / 18) * .12 * aa})`); tg.addColorStop(1, 'rgba(255,140,30,0)');
        c!.fillStyle = tg; c!.fillRect(tx - 10, ty - 10, 20, 20);
      }
      c!.save(); c!.globalAlpha = aa; c!.translate(ax, ay);
      c!.beginPath(); c!.ellipse(0, 0, 11, 4.5, 0, 0, Math.PI * 2);
      c!.fillStyle = '#b8942e'; c!.fill(); c!.strokeStyle = '#7a6520'; c!.lineWidth = .8; c!.stroke();
      const fk = 1 + Math.sin(t * 13) * .14 + Math.sin(t * 19) * .09; const fh = 17 * fk;
      c!.beginPath(); c!.moveTo(0, -2);
      c!.bezierCurveTo(-5.5, -fh * .4, -4.5, -fh * .8, 0, -fh);
      c!.bezierCurveTo(4.5, -fh * .8, 5.5, -fh * .4, 0, -2);
      c!.fillStyle = 'rgba(255,135,18,.68)'; c!.fill();
      c!.beginPath(); c!.moveTo(0, -2);
      c!.bezierCurveTo(-2.8, -fh * .32, -2.2, -fh * .58, 0, -fh * .68);
      c!.bezierCurveTo(2.2, -fh * .58, 2.8, -fh * .32, 0, -2);
      c!.fillStyle = 'rgba(255,218,95,.88)'; c!.fill();
      c!.beginPath(); c!.moveTo(0, -2);
      c!.bezierCurveTo(-1.2, -fh * .18, -.8, -fh * .32, 0, -fh * .38);
      c!.bezierCurveTo(.8, -fh * .32, 1.2, -fh * .18, 0, -2);
      c!.fillStyle = 'rgba(255,252,218,.92)'; c!.fill();
      const fg = c!.createRadialGradient(0, -fh * .28, 0, 0, -fh * .28, Math.max(EP, 32));
      fg.addColorStop(0, 'rgba(255,175,48,.22)'); fg.addColorStop(.5, 'rgba(255,135,28,.06)'); fg.addColorStop(1, 'rgba(255,95,18,0)');
      c!.fillStyle = fg; c!.fillRect(-32, -fh - 14, 64, fh + 42);
      c!.restore();
    }

    /* ═══════════════════════════════════════════════════════════════
       🖼️ UNIFIED GANESHA IMAGE — 3 phases
       Phase 1: 1.5s-4.5s → Golden ring reveal (3s)
       Phase 2: 4.5s-7.5s → Breath + shimmer (aarti phase)
       Phase 3: 7.5s+     → Clean Fade out (completely gone by 8.7s)
       ═══════════════════════════════════════════════════════════════ */
    function dGanesha(t: number) {
      const d = getImgDims(); if (!d) return;
      const { img, cx, cy, displayW: dw, displayH: dh, maxR } = d;

      if (t >= 1.5 && t < 4.5) {
        const prog = eIO(Math.min((t - 1.5) / 3, 1));
        const revealR = maxR * prog;
        c!.save();
        c!.beginPath(); c!.arc(cx, cy, Math.max(EP, revealR), 0, Math.PI * 2); c!.clip();
        c!.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
        c!.restore();
        if (prog < 1) {
          const ringA = 0.7 * (1 - prog * 0.6);
          c!.save();
          c!.shadowColor = `rgba(255,190,60,${ringA})`; c!.shadowBlur = 35;
          c!.strokeStyle = `rgba(255,210,100,${ringA})`; c!.lineWidth = 2.5;
          c!.beginPath(); c!.arc(cx, cy, Math.max(EP, revealR), 0, Math.PI * 2); c!.stroke();
          c!.shadowBlur = 0;
          c!.strokeStyle = `rgba(255,240,180,${ringA * 0.6})`; c!.lineWidth = 1;
          c!.beginPath(); c!.arc(cx, cy, Math.max(EP, revealR - 2), 0, Math.PI * 2); c!.stroke();
          c!.restore();
        }
        return;
      }

      if (t >= 4.5 && t < 7.5) {
        const breath = 1 + Math.sin(t * 2.5) * 0.008;
        const w = dw * breath, h = dh * breath;
        const aR = Math.max(EP, h * 0.6);
        const aura = c!.createRadialGradient(cx, cy, 0, cx, cy, aR);
        aura.addColorStop(0, 'rgba(255,190,60,0.2)');
        aura.addColorStop(0.5, 'rgba(255,140,35,0.08)');
        aura.addColorStop(1, 'rgba(255,100,20,0)');
        c!.fillStyle = aura; c!.fillRect(cx - aR, cy - aR, aR * 2, aR * 2);
        c!.save();
        c!.shadowColor = 'rgba(255,185,50,0.5)'; c!.shadowBlur = 40;
        c!.drawImage(img, cx - w / 2, cy - h / 2, w, h);
        c!.restore();
        const st = (t - 5.0) / 1.0;
        if (st >= 0 && st <= 1) {
          const sx = cx - w / 2 + st * w * 1.4 - w * 0.2;
          const bw2 = w * 0.12;
          c!.save();
          c!.beginPath(); c!.rect(cx - w / 2, cy - h / 2, w, h); c!.clip();
          const shim = c!.createLinearGradient(sx - bw2, 0, sx + bw2, 0);
          shim.addColorStop(0, 'rgba(255,255,255,0)');
          shim.addColorStop(0.4, 'rgba(255,255,220,0.1)');
          shim.addColorStop(0.5, 'rgba(255,255,255,0.18)');
          shim.addColorStop(0.6, 'rgba(255,255,220,0.1)');
          shim.addColorStop(1, 'rgba(255,255,255,0)');
          c!.fillStyle = shim; c!.fillRect(sx - bw2, cy - h / 2, bw2 * 2, h);
          c!.restore();
        }
        return;
      }

      // ★ Ganesha Clean Fade out (completely gone by 8.7s)
      if (t >= 7.5) {
        const dt = Math.min((t - 7.5) / 1.2, 1);
        const oa = Math.max(0, 1 - dt);
        if (oa > 0) {
          c!.save(); c!.globalAlpha = oa;
          c!.shadowColor = `rgba(255,190,65,${oa * 0.5})`; c!.shadowBlur = 20;
          c!.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
          c!.restore();
        }
      }
    }

    function sRevealSparkles(t: number) {
      if (t < 1.5 || t > 4.5) return;
      const d = getImgDims(); if (!d) return;
      const prog = eIO(Math.min((t - 1.5) / 3, 1));
      const revealR = d.maxR * prog;
      for (let i = 0; i < 3; i++) {
        const p = grab(pl); if (!p) break;
        const ang = Math.random() * Math.PI * 2;
        p.x = d.cx + Math.cos(ang) * revealR;
        p.y = d.cy + Math.sin(ang) * revealR;
        p.vx = Math.cos(ang) * (1 + Math.random() * 2.5);
        p.vy = Math.sin(ang) * (1 + Math.random() * 2.5);
        p.sz = Math.random() * 2 + 0.5; p.ml = 0.5 + Math.random() * 0.4; p.life = p.ml;
        p.r = 255; p.g = 200 + Math.random() * 55 | 0; p.b = 50 + Math.random() * 50 | 0;
        p.a = 0.7 + Math.random() * 0.3; p.rot = 0; p.rs = 0;
        p.on = true; p.tp = 9;
      }
    }
    function dRevealSparkles() {
      for (const p of pl) {
        if (!p.on || p.tp !== 9) continue;
        const lr = p.life / p.ml; const a = p.a * lr;
        const sz = p.sz * (0.5 + lr * 0.5);
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, sz), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c!.fill();
        if (sz > 1) {
          const g = c!.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, sz * 3));
          g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a * 0.3})`);
          g.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          c!.fillStyle = g; c!.fillRect(p.x - sz * 3, p.y - sz * 3, sz * 6, sz * 6);
        }
      }
    }

    function dBloom(t: number) {
      const bs = 6.5; const bt = Math.min((t - bs) / 1.4, 1); if (bt <= 0) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015; const maxR = sc * .88;
      const r = maxR * eOQ(bt);
      const ra = (1 - bt) * .4;
      c!.save(); c!.beginPath(); c!.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2);
      c!.strokeStyle = `rgba(255,190,65,${ra})`; c!.lineWidth = 3.5 * (1 - bt); c!.stroke(); c!.restore();
      const ba = (1 - bt * .65) * .16;
      const bg = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, r));
      bg.addColorStop(0, `rgba(255,190,65,${ba})`); bg.addColorStop(.5, `rgba(255,140,42,${ba * .4})`); bg.addColorStop(1, 'rgba(255,95,22,0)');
      c!.fillStyle = bg; c!.fillRect(0, 0, W, H);
      if (bt < .45 && Math.random() < .6) {
        const p = grab(pl); if (p) {
          const ang = Math.random() * Math.PI * 2; const spd = 2.2 + Math.random() * 4.8;
          p.x = cx; p.y = cy; p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd;
          p.sz = Math.random() * 3 + .8; p.ml = 1.3 + Math.random(); p.life = p.ml;
          p.r = 255; p.g = 180 + Math.random() * 60 | 0; p.b = 40 + Math.random() * 55 | 0;
          p.a = .6; p.rot = 0; p.rs = 0; p.on = true; p.tp = 3;
        }
      }
    }

    function dBloomP() {
      for (const p of pl) {
        if (!p.on || p.tp !== 3) continue;
        const lr = p.life / p.ml; const a = p.a * lr;
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz * (1 + (1 - lr) * .4)), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c!.fill();}
    }

    function sPetals(t: number) {
      if (t < 4.5 || Math.random() > .45) return;
      const p = grab(pl); if (!p) return;
      p.x = Math.random() * W; p.y = -24 - Math.random() * 60;
      p.vx = (Math.random() - .5) * 1.5; p.vy = 1.5 + Math.random() * 2.2;
      p.sz = 4.5 + Math.random() * 6.5; p.ml = 7 + Math.random() * 3; p.life = p.ml;
      const ct = Math.random();
      if (ct < .35) { p.r = 255; p.g = 128; p.b = 0; }
      else if (ct < .65) { p.r = 255; p.g = 182; p.b = 22; }
      else { p.r = 255; p.g = 215; p.b = 42; }
      p.a = .5 + Math.random() * .3; p.rot = Math.random() * Math.PI * 2;
      p.rs = (Math.random() - .5) * .04; p.on = true; p.tp = 4;
    }

    function dPetals() {
      for (const p of pl) {
        if (!p.on || p.tp !== 4) continue;
        const lr = p.life / p.ml; const a = p.a * Math.min(lr * 2, 1) * (lr > .82 ? (1 - lr) / .18 : 1);
        c!.save(); c!.translate(p.x, p.y); c!.rotate(p.rot);
        const grad = c!.createLinearGradient(0, -p.sz, 0, p.sz);
        grad.addColorStop(0, `rgb(${p.r},${p.g},${p.b})`);
        grad.addColorStop(1, `rgb(${Math.max(0, p.r - 40)},${Math.max(0, p.g - 35)},${Math.max(0, p.b - 20)})`);
        c!.fillStyle = grad;
        c!.beginPath(); c!.ellipse(0, 0, Math.max(EP, p.sz * .42), Math.max(EP, p.sz), 0, 0, Math.PI * 2); c!.fill();
        c!.beginPath(); c!.ellipse(-p.sz * 0.05, -p.sz * 0.2, Math.max(EP, p.sz * 0.1), Math.max(EP, p.sz * 0.35), 0, 0, Math.PI * 2);
        c!.fillStyle = 'rgba(255,255,210,1)'; c!.fill(); // Solidified highlight
        c!.restore();
      }
    }

    function sKum(t: number) {
      if (t < 4.5 || Math.random() > .45) return;
      const p = grab(pl); if (!p) return;
      p.x = Math.random() * W; p.y = -12 - Math.random() * 35;
      p.vx = (Math.random() - .5) * .6; p.vy = .45 + Math.random() * 1.3;
      p.sz = .8 + Math.random() * 2; p.ml = 5.5 + Math.random() * 3; p.life = p.ml;
      if (Math.random() < .45) { p.r = 190 + Math.random() * 60 | 0; p.g = 15 + Math.random() * 28 | 0; p.b = 15 + Math.random() * 28 | 0; }
      else { p.r = 255; p.g = 222 + Math.random() * 30 | 0; p.b = 140 + Math.random() * 55 | 0; }
      p.a = .4 + Math.random() * .38; p.rot = Math.random() * Math.PI * 2;
      p.rs = (Math.random() - .5) * .06; p.on = true; p.tp = 8;
    }

    function dKum() {
      for (const p of pl) {
        if (!p.on || p.tp !== 8) continue;
        const lr = p.life / p.ml; const a = p.a * Math.min(lr * 2, 1) * (lr > .84 ? (1 - lr) / .16 : 1);
        c!.save(); c!.translate(p.x, p.y); c!.rotate(p.rot);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        c!.fillRect(-p.sz * .5, -p.sz * .2, p.sz, p.sz * .4); c!.restore();
      }
    }

    function dRays(t: number) {
      if (t < 6.5) return;
      const rt = Math.min((t - 6.5) / 2, 1); const al = eOC(rt) * .09;
      const cx = W / 2, cy = H / 2 - H * .015; const rl = Math.max(W, H) * .85;
      c!.save(); c!.globalAlpha = al; const nr = 16;
      for (let i = 0; i < nr; i++) {
        const ang = (i / 16) * Math.PI * 2 + t * .035; const hw = (Math.PI / 16) * .36;
        c!.beginPath(); c!.moveTo(cx, cy);
        c!.lineTo(cx + Math.cos(ang - hw) * rl, cy + Math.sin(ang - hw) * rl);
        c!.lineTo(cx + Math.cos(ang + hw) * rl, cy + Math.sin(ang + hw) * rl);
        c!.closePath();
        const rg = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, rl));
        rg.addColorStop(0, 'rgba(255,190,65,.7)'); rg.addColorStop(.5, 'rgba(255,150,42,.2)'); rg.addColorStop(1, 'rgba(255,110,22,0)');
        c!.fillStyle = rg; c!.fill();
      }
      c!.restore();
    }

    function dDissolve(t: number) {
      const ps = 7.5; const dt = Math.min((t - ps) / 1.2, 1); if (dt <= 0) return;
      const la = eOC(dt) * .12;
      const lg = c!.createRadialGradient(W / 2, H / 2 - H * .015, 0, W / 2, H / 2 - H * .015, Math.max(EP, Math.min(W, H) * .56 * .3));
      lg.addColorStop(0, `rgba(255,220,135,${la})`); lg.addColorStop(.5, `rgba(255,170,42,${la * .4})`); lg.addColorStop(1, 'rgba(255,140,22,0)');
      c!.fillStyle = lg; c!.fillRect(0, 0, W, H);
    }

    function dText(t: number) {
      const ps = 8.7; const ft = Math.min((t - ps) / 1.1, 1); if (ft <= 0) return;
      const fi = eOC(ft); const ty = H * .35;
      c!.save(); c!.globalAlpha = fi; c!.textAlign = 'center'; c!.textBaseline = 'middle';
      const ts = Math.min(W * .058, H * .065, 50);
      c!.font = `700 ${ts}px 'Georgia','Times New Roman',serif`;
      const tw = c!.measureText('Happy Ganesh Chaturthi').width;
      c!.strokeStyle = 'rgba(60,35,6,.38)'; c!.lineWidth = 3.5;
      c!.shadowColor = 'rgba(255,190,42,.45)'; c!.shadowBlur = 20;
      c!.strokeText('Happy Ganesh Chaturthi', W / 2, ty);
      const mg = c!.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
      mg.addColorStop(0, '#5a4210'); mg.addColorStop(.15, '#b08018'); mg.addColorStop(.32, '#d4a020');
      mg.addColorStop(.48, '#ffd700'); mg.addColorStop(.52, '#fffacd'); mg.addColorStop(.68, '#ffd700');
      mg.addColorStop(.84, '#d4a020'); mg.addColorStop(1, '#5a4210');
      c!.fillStyle = mg; c!.shadowBlur = 16; c!.fillText('Happy Ganesh Chaturthi', W / 2, ty);
      const sp = (Math.sin(t * 2.2) + 1) / 2;
      const sg = c!.createLinearGradient(W / 2 - tw * .6, 0, W / 2 + tw * .6, 0);
      const s0 = Math.max(0, sp - .12), s1 = Math.max(0, sp - .04), s2 = Math.min(1, sp + .04), s3 = Math.min(1, sp + .12);
      sg.addColorStop(s0, 'rgba(255,255,232,0)'); sg.addColorStop(s1, 'rgba(255,255,232,.1)');
      sg.addColorStop(sp, 'rgba(255,255,232,.18)'); sg.addColorStop(s2, 'rgba(255,255,232,.1)');
      sg.addColorStop(s3, 'rgba(255,255,232,0)');
      c!.shadowBlur = 0; c!.fillStyle = sg; c!.fillText('Happy Ganesh Chaturthi', W / 2, ty);
      const ss = Math.min(W * .024, H * .028, 19);
      c!.font = `400 ${ss}px 'Nirmala UI','Devanagari Sangam MN','Mangal','Segoe UI',sans-serif`;
      c!.shadowColor = 'rgba(255,170,42,.22)'; c!.shadowBlur = 10;
      const shg = c!.createLinearGradient(W / 2 - ss * 10, 0, W / 2 + ss * 10, 0);
      shg.addColorStop(0, '#856314'); shg.addColorStop(.25, '#d4a020'); shg.addColorStop(.5, '#ffd700');
      shg.addColorStop(.75, '#d4a020'); shg.addColorStop(1, '#856314');
      c!.fillStyle = shg;
      const l1y = ty + ts * 1.3; const l2y = l1y + ss * 2.1;
      c!.fillText('वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।', W / 2, l1y);
      c!.fillText('निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥', W/2, l2y);
      c!.fillStyle = sg; c!.shadowBlur = 0;
      c!.fillText('वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।', W / 2, l1y);
      c!.fillText('निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥', W / 2, l2y);
      c!.restore();
    }

    function dWave(t: number) {
      const ws = 9.8; const wt = Math.min((t - ws) / .7, 1); if (wt <= 0) return;
      const cx = W / 2, cy = H / 2; const maxR = Math.max(W, H) * .95;
      const r = maxR * eOE(wt); const al = (1 - wt) * .35;
      c!.save(); c!.beginPath(); c!.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2);
      c!.strokeStyle = `rgba(255,195,65,${al})`; c!.lineWidth = 4 * (1 - wt); c!.stroke(); c!.restore();
      const inner = Math.max(EP, r - 18); const outer = Math.max(inner + EP, r + 18);
      const wg = c!.createRadialGradient(cx, cy, inner, cx, cy, outer);
      wg.addColorStop(0, 'rgba(255,195,65,0)'); wg.addColorStop(.4, `rgba(255,195,65,${al * .4})`);
      wg.addColorStop(.6, `rgba(255,195,65,${al * .4})`); wg.addColorStop(1, 'rgba(255,195,65,0)');
      c!.fillStyle = wg; c!.fillRect(0, 0, W, H);
      if (wt < .7) {
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + t * .5;
          const sx = cx + Math.cos(ang) * r; const sy = cy + Math.sin(ang) * r;
          c!.beginPath(); c!.arc(sx, sy, Math.max(EP, 2 * (1 - wt)), 0, Math.PI * 2);
          c!.fillStyle = `rgba(255,235,170,${(1 - wt / .7) * .5})`; c!.fill();
        }
      }
    }

    function dFade(t: number) {
      const fs = 9.8; const ft = Math.min((t - fs) / .7, 1); if (ft <= 0) return;
      const fa = eIQ(ft);
      c!.fillStyle = `rgba(15,8,3,${fa})`; c!.fillRect(0, 0, W, H);
      if (ft < .6) {
        const ga = (1 - ft / .6) * .22;
        const gg = c!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(EP, H * .4));
        gg.addColorStop(0, `rgba(255,190,65,${ga})`); gg.addColorStop(1, 'rgba(255,140,22,0)');
        c!.fillStyle = gg; c!.fillRect(0, 0, W, H);
      }
    }

    /* ───────── UPDATE ───────── */
    function upd(dt: number) {
      for (const p of pl) {
        if (!p.on || p.tp === 0) continue;
        p.x += p.vx; p.y += p.vy; p.life -= dt; p.rot += p.rs;
        switch (p.tp) {
          case 1: p.vx *= .99; p.vy *= .99; break;
          case 3: p.vx *= .97; p.vy *= .97; break;
          case 4: p.vx += Math.sin(p.y * .018 + p.rot) * .016; p.vy *= .999; break;
          case 5: p.vx *= .98; p.vy *= .98; break;
          case 6: p.vx *= .995; p.vy *= .998; p.sz += .3; break;
          case 8: p.vx += (Math.random() - .5) * .016; break;
        }
        if (p.life <= 0 || p.y > H + 60 || p.x < -120 || p.x > W + 120) p.on = false;
      }
    }

    /* ───────── MAIN LOOP ───────── */
    let lt = 0;
    const loop = (ts: number) => {
      if (!t0.current) { t0.current = ts; lt = ts; }
      const t = (ts - t0.current) / 1000; const dt = Math.min((ts - lt) / 1000, .05); lt = ts;

      dBg(t); dTemples(t); dSmoke(); dRays(t); dDust(t);
      dEnergy(t); dAarti(t); dBells(t);
      dGanesha(t);
      dRevealSparkles();
      dBloom(t); dBloomP(); dPetals(); dKum(); dOrbit();
      dDissolve(t); dText(t); dWave(t); dFade(t);

      if (t < 2.8) sStreams(t);
      sSmoke(); sOrbit(t); sRevealSparkles(t);
      if (t > 4.5) { sPetals(t); sKum(t); }

      upd(dt);

      if (t < DUR + .15) { raf.current = requestAnimationFrame(loop); }
      else if (!done.current) { done.current = true; cbR.current?.(); }
    };
    raf.current = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', rsz); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgReady, mkPool, grab, triggerBellSound]);

  /* ═══════════════════════════════════════════════════════════════
     🪔 LOADING SCREEN — Regional Devotional Aura
     ═══════════════════════════════════════════════════════════════ */
  if (!imgReady) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden" style={{ background: '#07030a' }}>
        
        {/* ── Layer 1: Deep warm radial background ── */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 45%, rgba(160,60,10,0.18) 0%, rgba(80,15,15,0.08) 40%, transparent 70%)',
          }}
        />

        {/* ── Layer 2: Rotating dashed diya ring ── */}
        <div
          className="absolute rounded-full"
          style={{
            width: 'min(60vw, 320px)',
            height: 'min(60vw, 320px)',
            border: '1px dashed rgba(255,190,60,0.12)',
            animation: 'ringRotate 12s linear infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 'min(48vw, 260px)',
            height: 'min(48vw, 260px)',
            border: '1px dashed rgba(255,190,60,0.08)',
            animation: 'ringRotate 18s linear infinite reverse',
          }}
        />

        {/* ── Layer 3: Pulsing aura rings ── */}
        <div
          className="absolute rounded-full"
          style={{
            width: 'min(40vw, 220px)',
            height: 'min(40vw, 220px)',
            background: 'radial-gradient(circle, rgba(255,180,40,0.08) 0%, transparent 70%)',
            animation: 'auraPulse 3s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 'min(28vw, 160px)',
            height: 'min(28vw, 160px)',
            background: 'radial-gradient(circle, rgba(255,160,30,0.1) 0%, transparent 65%)',
            animation: 'auraPulse 3s ease-in-out infinite 1.5s',
          }}
        />

        {/* ── Layer 4: Floating diya flames (CSS only) ── */}
        <div className="absolute flex gap-16" style={{ bottom: '22%' }}>
          {[0, 1.2, 2.4].map((d, i) => (
            <div key={i} className="flex flex-col items-center" style={{ animation: `floatY ${2.2 + i * 0.3}s ease-in-out infinite ${d}s` }}>
              <div
                style={{
                  width: 8, height: 18,
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  background: 'linear-gradient(to top, rgba(255,100,20,0.9), rgba(255,200,50,0.6) 40%, rgba(255,255,180,0.3))',
                  filter: 'blur(1.5px)',
                  animation: `flameFlicker ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
                }}
              />
              <div
                style={{
                  width: 18, height: 8, borderRadius: 4,
                  background: 'linear-gradient(to right, rgba(255,180,50,0.6), rgba(255,220,100,0.3), rgba(255,180,50,0.6))',
                  filter: 'blur(3px)',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Layer 5: Main ॐ with triple glow ── */}
        <div className="relative flex flex-col items-center">
          <div
            className="absolute rounded-full"
            style={{
              width: 'min(35vw, 200px)',
              height: 'min(35vw, 200px)',
              background: 'radial-gradient(circle, rgba(255,200,50,0.06) 0%, transparent 70%)',
              animation: 'omBreath 2.4s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 'min(22vw, 130px)',
              height: 'min(22vw, 130px)',
              background: 'radial-gradient(circle, rgba(255,210,80,0.1) 0%, transparent 60%)',
              animation: 'omBreath 2.4s ease-in-out infinite 0.3s',
            }}
          />
          {/* The ॐ */}
          <div
            className="relative select-none"
            style={{
              fontSize: 'clamp(4rem, 12vw, 7rem)',
              lineHeight: 1,
              color: '#ffd700',
              textShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 50px rgba(255,190,50,0.5), 0 0 100px rgba(255,170,30,0.25), 0 0 160px rgba(255,150,20,0.1)',
              animation: 'omBreath 2.4s ease-in-out infinite',
              fontFamily: "'Noto Sans Devanagari', 'Devanagari Sangam MN', 'Mangal', serif",
            }}
          >
            ॐ
          </div>
        </div>

        {/* ── Layer 6: Mantra text ── */}
        <div className="absolute flex flex-col items-center gap-3" style={{ bottom: '10%' }}>
          <p
            className="select-none tracking-[0.3em] uppercase"
            style={{
              fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
              color: 'rgba(255,200,80,0.5)',
              animation: 'textPulse 2.4s ease-in-out infinite',
            }}
          >
            गणपति आरती प्रारंभ हो रही है
          </p>
          <div className="flex items-center gap-2">
            <div
              className="h-px"
              style={{
                width: 'clamp(40px, 10vw, 80px)',
                background: 'linear-gradient(to right, transparent, rgba(255,190,60,0.3), transparent)',
              }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#ffd700',
                boxShadow: '0 0 8px rgba(255,215,0,0.6), 0 0 20px rgba(255,200,50,0.3)',
                animation: 'dotPulse 1.8s ease-in-out infinite',
              }}
            />
            <div
              className="h-px"
              style={{
                width: 'clamp(40px, 10vw, 80px)',
                background: 'linear-gradient(to left, transparent, rgba(255,190,60,0.3), transparent)',
              }}
            />
          </div>
        </div>

        {/* ── Layer 7: Corner mandala hints ── */}
        <div className="absolute top-4 left-4 w-8 h-8 border border-yellow-700/10 rounded-full" style={{ animation: 'cornerSpin 20s linear infinite' }} />
        <div className="absolute top-4 right-4 w-8 h-8 border border-yellow-700/10 rounded-full" style={{ animation: 'cornerSpin 20s linear infinite reverse' }} />
        <div className="absolute bottom-4 left-4 w-8 h-8 border border-yellow-700/10 rounded-full" style={{ animation: 'cornerSpin 20s linear infinite 5s' }} />
        <div className="absolute bottom-4 right-4 w-8 h-8 border border-yellow-700/10 rounded-full" style={{ animation: 'cornerSpin 20s linear infinite 15s' }} />

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes omBreath {
            0%, 100% { opacity: 0.75; transform: scale(1); filter: blur(0px); }
            50% { opacity: 1; transform: scale(1.05); filter: blur(0.3px); }
          }
          @keyframes textPulse {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.7; }
          }
          @keyframes auraPulse {
            0%, 100% { transform: scale(0.9); opacity: 0.4; }
            50% { transform: scale(1.1); opacity: 1; }
          }
          @keyframes ringRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes floatY {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes flameFlicker {
            0% { transform: scaleY(1) scaleX(1); opacity: 0.8; }
            100% { transform: scaleY(1.15) scaleX(0.85); opacity: 1; }
          }
          @keyframes dotPulse {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes cornerSpin {
            0% { transform: rotate(0deg); border-color: rgba(255,190,60,0.08); }
            25% { border-color: rgba(255,190,60,0.15); }
            50% { border-color: rgba(255,190,60,0.05); }
            75% { border-color: rgba(255,190,60,0.12); }
            100% { transform: rotate(360deg); border-color: rgba(255,190,60,0.08); }
          }
        ` }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999]" style={{ background: '#07030a' }}>
      <canvas ref={cvRef} className="block w-full h-full" />
    </div>
  );
}
