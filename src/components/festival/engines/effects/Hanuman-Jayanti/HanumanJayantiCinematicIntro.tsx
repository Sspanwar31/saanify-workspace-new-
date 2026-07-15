'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
interface P {
  x: number; y: number; vx: number; vy: number;
  sz: number; life: number; ml: number;
  r: number; g: number; b: number; a: number;
  rot: number; rs: number; on: boolean; tp: number;
}
interface Bell {
  x: number; length: number; angle: number; lastBellTime: number;
}
const POOL = 3400;
const DUR = 10.5;
const EP = 1e-4;
const IMG_URL = 'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Hanuman%20JI/Screenshot%202026-07-14%20221205.png';

/* ═══════════════════════════════════════════════════════════════
   EASING HELPERS — 2027: Spring physics added
   ═══════════════════════════════════════════════════════════════ */
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOQ = (t: number) => 1 - Math.pow(1 - t, 4);
const eIQ = (t: number) => t * t;
const eSpring = (t: number) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 :
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void; imageUrl?: string }

export default function HanumanJayantiCinematicIntro({ onComplete, imageUrl }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const hanumanImgRef = useRef<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = useState(false);

  const raf = useRef(0);
  const t0 = useRef(0);
  const done = useRef(false);
  const cbR = useRef(onComplete);
  cbR.current = onComplete;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { hanumanImgRef.current = img; setImgReady(true); };
    img.onerror = () => { setImgReady(true); };
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
    for (let i = 0; i < p.length; i++) if (!p[i].on) return p[i];
    return null;
  }, []);

  const triggerBellSound = useCallback((frequency: number) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
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
     🎬 10.5s TIMELINE
     0.0s - 1.5s  → धुएं + ऊर्जा सस्पेंस
     1.5s - 4.5s  → ★ स्पॉटलाइट रिवील (NO crop — full image)
     4.5s - 8.0s  → आरती, घंटियाँ, फूल वर्षा
     8.7s - 9.5s  → Text staggered reveal + shimmer
     9.8s - 10.5s → स्वाभाविक फेड-आउट
   ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!imgReady) return;

    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
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

    /* ─── 🎞️ 2027: Film Grain Texture (generated once) ─── */
    const grainCv = document.createElement('canvas');
    grainCv.width = 256; grainCv.height = 256;
    const gc = grainCv.getContext('2d')!;
    const gd = gc.createImageData(256, 256);
    for (let i = 0; i < gd.data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      gd.data[i] = v; gd.data[i + 1] = v; gd.data[i + 2] = v; gd.data[i + 3] = 255;
    }
    gc.putImageData(gd, 0, 0);

    const pl = mkPool();
    const dI: number[] = [];
    for (let i = 0; i < 80; i++) {
      const p = pl[i]; p.on = true; p.tp = 0;
      p.x = Math.random() * W; p.y = Math.random() * H;
      p.vx = (Math.random() - .5) * .22; p.vy = -Math.random() * .35 - .06;
      p.sz = Math.random() * 1.6 + .4; p.ml = 999; p.life = 999;
      p.r = 255; p.g = 185 + Math.random() * 60 | 0; p.b = 35 + Math.random() * 60 | 0;
      p.a = Math.random() * .22 + .06; p.rot = 0; p.rs = 0;
      dI.push(i);
    }

    const bells: Bell[] = [
      { x: 0.24, length: 80, angle: 0.22, lastBellTime: 0 },
      { x: 0.50, length: 110, angle: -0.15, lastBellTime: 0 },
      { x: 0.76, length: 80, angle: 0.18, lastBellTime: 0 },
    ];

    const getImgDims = () => {
      const img = hanumanImgRef.current;
      if (!img || !img.complete || img.naturalWidth === 0) return null;
      const cx = W / 2, cy = H / 2 - H * 0.015;
      const sc = Math.min(W, H);
      const displayH = sc * 0.5;
      const displayW = displayH * (img.naturalWidth / img.naturalHeight);
      const maxR = Math.max(displayW, displayH) / 2 + 20;
      return { img, cx, cy, displayW, displayH, maxR };
    };

    /* ═══════════════════════════════════════════════════════════
       BACKGROUND
       ═══════════════════════════════════════════════════════════ */
    function dBg(t: number) {
      c!.fillStyle = '#07030a'; c!.fillRect(0, 0, W, H);
      const aa = t < 1.5 ? eOC(Math.min(t / 1.2, 1)) * .6 : .6;
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
      if (t > 1.0) ca = Math.min((t - 1.0) / 3, 1) * .2;
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

    /* ═══════════════════════════════════════════════════════════
       2027: DYNAMIC VIGNETTE — breathing dark edges
       ═══════════════════════════════════════════════════════════ */
    function dVignette(t: number) {
      const breathe = 0.55 + Math.sin(t * 1.2) * 0.06;
      const vg = c!.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, Math.max(EP, Math.max(W, H) * 0.78));
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(0,0,0,${breathe})`);
      c!.fillStyle = vg;
      c!.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       TEMPLES
       ═══════════════════════════════════════════════════════════ */
    function dTemples(t: number) {
      const fa = t < 1.5 ? eOC(Math.min(t / 1.2, 1)) * .28 : .28;
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

    /* ═══════════════════════════════════════════════════════════
       SMOKE — 2027: Organic turbulence
       ═══════════════════════════════════════════════════════════ */
    function sSmoke(t: number) {
      if (Math.random() > (t < 1.5 ? 0.5 : 0.18)) return;
      const p = grab(pl); if (!p) return;
      if (t < 1.5) {
        p.x = W * .25 + Math.random() * W * .5;
        p.y = H * .35 + Math.random() * H * .35;
        p.sz = Math.random() * 65 + 30;
        p.a = .04 + Math.random() * .03;
        p.ml = 4 + Math.random() * 2;
      } else {
        p.x = W * .2 + Math.random() * W * .6;
        p.y = H * .5 + Math.random() * H * .3;
        p.sz = Math.random() * 50 + 20;
        p.a = .03 + Math.random() * .02;
        p.ml = 5 + Math.random() * 3;
      }
      p.vx = (Math.random() - .5) * .4; p.vy = -Math.random() * .6 - .2;
      p.life = p.ml;
      p.r = 150; p.g = 95; p.b = 65;
      p.rot = 0; p.rs = 0; p.on = true; p.tp = 6;
    }
    function dSmoke() {
      for (const p of pl) {
        if (!p.on || p.tp !== 6) continue;
        const lr = p.life / p.ml;
        const a = p.a * (lr < .3 ? lr / .3 : lr > .7 ? (1 - lr) / .3 : 1);
        const g = c!.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, p.sz));
        g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a})`);
        g.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
        c!.fillStyle = g; c!.fillRect(p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
      }
    }

    /* ═══════════════════════════════════════════════════════════
       DUST
       ═══════════════════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════════════════
       ORBIT — 2027: with soft glow halos
       ═══════════════════════════════════════════════════════════ */
    function sOrbit(t: number) {
      if (t < 1.5 || t > 9.8 || Math.random() > .2) return;
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
        const lr = p.life / p.ml;
        const a = p.a * Math.min(lr * 2, 1) * Math.min((1 - lr) * 2, 1);
        // Soft glow halo
        const haloR = p.sz * 4;
        const hg = c!.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, haloR));
        hg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a * 0.15})`);
        hg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
        c!.fillStyle = hg;
        c!.fillRect(p.x - haloR, p.y - haloR, haloR * 2, haloR * 2);
        // Core
        c!.beginPath(); c!.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c!.fill();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       ENERGY
       ═══════════════════════════════════════════════════════════ */
    function dEnergy(t: number) {
      if (t >= 0 && t < 1.5) {
        const ep = eOC(Math.min(t / 1.2, 1));
        const ea = ep * .09;
        const eg = c!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(EP, H * .45));
        eg.addColorStop(0, `rgba(255,160,40,${ea})`);
        eg.addColorStop(.5, `rgba(200,80,20,${ea * .4})`);
        eg.addColorStop(1, 'rgba(150,40,10,0)');
        c!.fillStyle = eg; c!.fillRect(0, 0, W, H);
        return;
      }
      if (t < 4.5 || t > 8.5) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015;
      let ea = 0;
      if (t < 6.5) ea = Math.min((t - 4.5) / 2, 1) * .14;
      else ea = .14 * (1 - Math.min((t - 6.5) / 2, 1) * .5);
      const eg = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, sc * .42));
      eg.addColorStop(0, `rgba(255,195,55,${ea})`); eg.addColorStop(.5, `rgba(255,140,35,${ea * .4})`); eg.addColorStop(1, 'rgba(255,100,20,0)');
      c!.fillStyle = eg; c!.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       BELLS
       ═══════════════════════════════════════════════════════════ */
    function dBells(t: number) {
      const bs = 4.5; if (t < bs) return;
      let ba = Math.min((t - bs) / .6, 1);
      if (t > 8.0) ba = Math.max(0, 1 - (t - 8.0) / .6);
      if (ba <= 0) return;
      const bsz = Math.min(W, H) * .11;
      drawBell(W * .28, H * .04, bsz, .28 * Math.sin(t * 2.6) * ba, ba);
      drawBell(W * .72, H * .04, bsz, .24 * Math.sin(t * 2.9 + 1.6) * ba, ba);
      bells.forEach((bell, idx) => {
        const angle = Math.sin(t * (1.8 + idx * 0.35)) * 0.18;
        if (Math.abs(angle) < 0.02 && t - bell.lastBellTime > 0.8) {
          bell.lastBellTime = t;
          triggerBellSound([220, 165, 294][idx]);
        }
      });
    }
    function drawBell(ax: number, ay: number, s: number, ang: number, al: number) {
      c!.save(); c!.globalAlpha = al; c!.translate(ax, ay); c!.rotate(ang);
      c!.strokeStyle = '#7a6535'; c!.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { c!.beginPath(); c!.ellipse(0, s * .08 * (i + 1), Math.max(EP, s * .028), Math.max(EP, s * .045), 0, 0, Math.PI * 2); c!.stroke(); }
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
      c!.bezierCurveTo(-bw * .1, ty + s * .4, -tw * .1, ty + s * .2, -tw * .1, ty + s * .05);
      c!.closePath(); c!.fillStyle = 'rgba(255,228,165,.12)'; c!.fill();
      c!.beginPath(); c!.moveTo(-bw * .5, bb); c!.lineTo(bw * .5, bb);
      c!.strokeStyle = '#dab540'; c!.lineWidth = 1.8; c!.stroke();
      const rg = c!.createRadialGradient(0, bb, 0, 0, bb, Math.max(EP, s * .3));
      rg.addColorStop(0, 'rgba(255,195,65,.15)'); rg.addColorStop(1, 'rgba(255,195,65,0)');
      c!.fillStyle = rg; c!.fillRect(-s * .3, bb - s * .3, s * .6, s * .6);
      c!.beginPath(); c!.arc(0, bb - s * .06, Math.max(EP, s * .035), 0, Math.PI * 2); c!.fillStyle = '#3e2e0c'; c!.fill();
      c!.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       AARTI
       ═══════════════════════════════════════════════════════════ */
    function dAarti(t: number) {
      const as = 4.5; if (t < as) return;
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
      c!.beginPath(); c!.ellipse(0, 0, Math.max(EP, 11), Math.max(EP, 4.5), 0, 0, Math.PI * 2);
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
       🖼️ HANUMAN IMAGE — 2027: SPOTLIGHT REVEAL (ZERO CROP)
       
       ❌ PURANA: arc() clip → image circular CUT hoti thi
       ✅ NAYA: Full image draw + radial gradient dark mask
          → Soft spotlight hole expands → image REVEAL hoti hai
          → Image kabhi CUT nahi hoti, sirf DARK overlay hataata hai
       ═══════════════════════════════════════════════════════════════ */
    function dHanuman(t: number) {
      const d = getImgDims(); if (!d) return;
      const { img, cx, cy, displayW: dw, displayH: dh, maxR } = d;
      const left = cx - dw / 2, top = cy - dh / 2;

      /* ── Phase 1: 1.5s - 4.5s — SPOTLIGHT REVEAL (no clip!) ── */
      if (t >= 1.5 && t < 4.5) {
        const prog = eIO(Math.min((t - 1.5) / 3, 1));

        // Warm glow behind image
        const glowR = Math.max(dw, dh) * 0.9;
        const glowA = prog * 0.18;
        const glow = c!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, glowR));
        glow.addColorStop(0, `rgba(255,190,60,${glowA})`);
        glow.addColorStop(0.5, `rgba(255,140,35,${glowA * 0.4})`);
        glow.addColorStop(1, 'rgba(255,100,20,0)');
        c!.fillStyle = glow;
        c!.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

        // ★ FULL IMAGE — no clipping, no cropping
        c!.save();
        c!.globalAlpha = prog;
        c!.shadowColor = 'rgba(255,185,50,0.5)';
        c!.shadowBlur = 35 * prog;
        c!.drawImage(img, left, top, dw, dh);
        c!.restore();

        // ★ SPOTLIGHT MASK — dark overlay with expanding transparent hole
        if (prog < 0.98) {
          // Hole size: starts small, grows to cover full image
          const holeR = Math.max(dw, dh) * 0.5 * prog + Math.min(dw, dh) * 0.18;
          const softEdge = Math.max(dw, dh) * 0.35;
          const innerR = Math.max(EP, holeR);
          const outerR = Math.max(EP + 1, holeR + softEdge);

          // Dark mask with soft transparent center
          const mask = c!.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
          mask.addColorStop(0, 'rgba(7,3,10,0)');
          mask.addColorStop(1, `rgba(7,3,10,${0.97 * (1 - prog * prog)})`);
          c!.fillStyle = mask;
          c!.fillRect(0, 0, W, H);

          // Soft golden glow ring at reveal edge
          const ringA = 0.4 * (1 - prog * 0.7);
          const ringG = c!.createRadialGradient(cx, cy, Math.max(EP, innerR * 0.8), cx, cy, outerR);
          ringG.addColorStop(0, 'rgba(255,210,100,0)');
          ringG.addColorStop(0.4, `rgba(255,210,100,${ringA * 0.25})`);
          ringG.addColorStop(1, 'rgba(255,210,100,0)');
          c!.fillStyle = ringG;
          c!.fillRect(0, 0, W, H);
        }
        return;
      }

      /* ── Phase 2: 4.5s - 7.5s — Full display with breath + shimmer ── */
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

      /* ── Phase 3: 7.5s+ — Clean fade out ── */
      if (t >= 7.5) {
        const dt = Math.min((t - 7.5) / 1.2, 1);
        const oa = Math.max(0, 1 - dt);
        if (oa > 0) {
          c!.save(); c!.globalAlpha = oa;
          c!.shadowColor = `rgba(255,190,65,${oa * 0.5})`; c!.shadowBlur = 20;
          c!.drawImage(img, left, top, dw, dh);
          c!.restore();
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════
       2027: 4-POINT STAR SPARKLES (not boring circles)
       ═══════════════════════════════════════════════════════════ */
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
        p.a = 0.7 + Math.random() * 0.3; p.rot = Math.random() * Math.PI * 2; p.rs = (Math.random() - .5) * 3;
        p.on = true; p.tp = 9;
      }
    }
    function dRevealSparkles() {
      for (const p of pl) {
        if (!p.on || p.tp !== 9) continue;
        const lr = p.life / p.ml; const a = p.a * lr;
        const sz = p.sz * (0.5 + lr * 0.5);

        // Soft glow
        if (sz > 0.8) {
          const gr = sz * 5;
          const gg = c!.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, gr));
          gg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a * 0.2})`);
          gg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          c!.fillStyle = gg;
          c!.fillRect(p.x - gr, p.y - gr, gr * 2, gr * 2);
        }

        // ★ 4-point star shape
        c!.save();
        c!.translate(p.x, p.y);
        c!.rotate(p.rot);
        c!.globalAlpha = a;
        c!.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        c!.beginPath();
        c!.moveTo(0, -sz * 2.2);
        c!.lineTo(sz * 0.25, -sz * 0.25);
        c!.lineTo(sz * 2.2, 0);
        c!.lineTo(sz * 0.25, sz * 0.25);
        c!.lineTo(0, sz * 2.2);
        c!.lineTo(-sz * 0.25, sz * 0.25);
        c!.lineTo(-sz * 2.2, 0);
        c!.lineTo(-sz * 0.25, -sz * 0.25);
        c!.closePath();
        c!.fill();
        c!.restore();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       2027: ANAMORPHIC LENS FLARE — horizontal light streak
       ═══════════════════════════════════════════════════════════ */
    function dFlare(t: number) {
      if (t < 2.0 || t > 5.5) return;
      let fi: number;
      if (t < 2.8) fi = (t - 2.0) / 0.8;
      else if (t > 4.8) fi = 1 - (t - 4.8) / 0.7;
      else fi = 1;
      fi = Math.max(0, Math.min(1, fi));
      if (fi <= 0) return;

      const cx = W / 2, cy = H / 2 - H * 0.015;
      const flareW = W * 0.85;
      const flareH = 2.5 + Math.sin(t * 4.5) * 1.2;

      c!.save();
      c!.globalAlpha = fi * 0.08;
      c!.globalCompositeOperation = 'lighter';

      // Main horizontal streak
      const fg = c!.createLinearGradient(cx - flareW / 2, 0, cx + flareW / 2, 0);
      fg.addColorStop(0, 'rgba(255,200,80,0)');
      fg.addColorStop(0.2, 'rgba(255,200,80,0.12)');
      fg.addColorStop(0.45, 'rgba(255,230,150,0.4)');
      fg.addColorStop(0.5, 'rgba(255,245,200,0.6)');
      fg.addColorStop(0.55, 'rgba(255,230,150,0.4)');
      fg.addColorStop(0.8, 'rgba(255,200,80,0.12)');
      fg.addColorStop(1, 'rgba(255,200,80,0)');
      c!.fillStyle = fg;
      c!.fillRect(cx - flareW / 2, cy - flareH, flareW, flareH * 2);

      // Bright center core
      const coreW = flareW * 0.2;
      const cg = c!.createLinearGradient(cx - coreW / 2, 0, cx + coreW / 2, 0);
      cg.addColorStop(0, 'rgba(255,240,200,0)');
      cg.addColorStop(0.5, 'rgba(255,250,230,0.35)');
      cg.addColorStop(1, 'rgba(255,240,200,0)');
      c!.fillStyle = cg;
      c!.fillRect(cx - coreW / 2, cy - flareH * 0.4, coreW, flareH * 0.8);

      c!.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       BLOOM
       ═══════════════════════════════════════════════════════════ */
    function dBloom(t: number) {
      const bs = 6.5; const bt = Math.min((t - bs) / 1.4, 1); if (bt <= 0) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015; const maxR = sc * .88;
      const r = maxR * eOQ(bt); const ra = (1 - bt) * .4;
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
        c!.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c!.fill();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       PETALS
       ═══════════════════════════════════════════════════════════ */
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
        c!.beginPath(); c!.ellipse(-p.sz * .05, -p.sz * .2, Math.max(EP, p.sz * .1), Math.max(EP, p.sz * .35), 0, 0, Math.PI * 2);
        c!.fillStyle = 'rgba(255,255,255,0.25)'; c!.fill();
        c!.restore();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       KUMKUM
       ═══════════════════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════════════════
       RAYS
       ═══════════════════════════════════════════════════════════ */
    function dRays(t: number) {
      if (t < 6.0) return;
      const rt = Math.min((t - 6.0) / 2, 1); const al = eOC(rt) * .09;
      const cx = W / 2, cy = H / 2 - H * .015; const rl = Math.max(W, H) * .85;
      c!.save(); c!.globalAlpha = al;
      for (let i = 0; i < 16; i++) {
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

    /* ═══════════════════════════════════════════════════════════
       DISSOLVE
       ═══════════════════════════════════════════════════════════ */
    function dDissolve(t: number) {
      const ps = 7.5;
      const dt = Math.min((t - ps) / 1.2, 1); if (dt <= 0) return;
      const la = eOC(dt) * .12;
      const lg = c!.createRadialGradient(W / 2, H / 2 - H * .015, 0, W / 2, H / 2 - H * .015, Math.max(EP, Math.min(W, H) * .56 * .3));
      lg.addColorStop(0, `rgba(255,220,135,${la})`); lg.addColorStop(.5, `rgba(255,170,42,${la * .4})`); lg.addColorStop(1, 'rgba(255,140,22,0)');
      c!.fillStyle = lg; c!.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════════
       📝 2027: TEXT — Staggered reveal + Spring bounce + Shimmer
       ── Title: 8.7s → slide up + scale spring
       ── Mantra: 9.0s → staggered slide up
       ── Shimmer: 9.3s → gold sweep
       ═══════════════════════════════════════════════════════════════ */
    function dText(t: number) {
      const ps = 8.7;
      if (t < ps) return;
      c!.save();
      c!.textAlign = 'center'; c!.textBaseline = 'middle';

      // ── TITLE: 8.7s - 9.3s ──
      const tProg = Math.min((t - ps) / 0.6, 1);
      const tFi = Math.min(1, eSpring(tProg));
      const tSlide = (1 - eOC(tProg)) * 14;

      if (tFi > 0.01) {
        const ts = Math.min(W * .058, H * .065, 50);
        const scale = 0.95 + tFi * 0.05;
        const title = 'Happy Hanuman Jayanti';
        const ty = H * .35 + tSlide;

        c!.globalAlpha = tFi;
        c!.save();
        c!.translate(W / 2, ty);
        c!.scale(scale, scale);
        c!.translate(-W / 2, -ty);

        c!.font = `700 ${ts}px 'Georgia','Times New Roman',serif`;
        const tw = c!.measureText(title).width;

        // Crisp drop shadow
        c!.fillStyle = 'rgba(0,0,0,0.72)';
        c!.fillText(title, W / 2 + 2, ty + 3);

        // Metallic gold
        const mg = c!.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
        mg.addColorStop(0, '#5a4210'); mg.addColorStop(.15, '#b08018');
        mg.addColorStop(.32, '#d4a020'); mg.addColorStop(.48, '#ffd700');
        mg.addColorStop(.52, '#fffacd'); mg.addColorStop(.68, '#ffd700');
        mg.addColorStop(.84, '#d4a020'); mg.addColorStop(1, '#5a4210');
        c!.fillStyle = mg;
        c!.fillText(title, W / 2, ty);

        c!.restore();

        // Gold shimmer sweep (9.3s - 10.0s)
        if (t > 9.3) {
          const shProg = Math.min((t - 9.3) / 0.7, 1);
          const shX = (W / 2 - tw / 2) + shProg * tw * 1.4 - tw * 0.2;
          c!.save();
          c!.beginPath(); c!.rect(W / 2 - tw / 2, ty - ts, tw, ts * 2); c!.clip();
          const shW = tw * 0.1;
          const sg = c!.createLinearGradient(shX - shW, 0, shX + shW, 0);
          sg.addColorStop(0, 'rgba(255,255,230,0)');
          sg.addColorStop(0.5, `rgba(255,255,230,${0.22 * (1 - shProg)})`);
          sg.addColorStop(1, 'rgba(255,255,230,0)');
          c!.fillStyle = sg;
          c!.fillRect(shX - shW, ty - ts, shW * 2, ts * 2);
          c!.restore();
        }
      }

      // ── MANTRA: 9.0s - 9.5s (staggered) ──
      const mStart = 9.0;
      if (t > mStart) {
        const mProg = Math.min((t - mStart) / 0.5, 1);
        const mFi = Math.min(1, eOC(mProg));
        const mSlide = (1 - eOC(mProg)) * 10;

        const ss = Math.min(W * .024, H * .028, 19);
        c!.font = `400 ${ss}px 'Nirmala UI','Devanagari Sangam MN','Mangal','Segoe UI',sans-serif`;

        const baseY = H * .35 + Math.min(W * .058, H * .065, 50) * 1.3;
        const l1y = baseY + mSlide;
        const l2y = l1y + ss * 2.1;

        c!.globalAlpha = mFi;

        c!.fillStyle = 'rgba(0,0,0,0.8)';
        c!.fillText('जय हनुमान ज्ञान गुण सागर।', W / 2 + 1, l1y + 1.2);
        c!.fillText('जय कपीस तिहुँ लोक उजागर॥', W / 2 + 1, l2y + 1.2);

        const shg = c!.createLinearGradient(W / 2 - ss * 10, 0, W / 2 + ss * 10, 0);
        shg.addColorStop(0, '#856314'); shg.addColorStop(.25, '#d4a020');
        shg.addColorStop(.5, '#ffd700'); shg.addColorStop(.75, '#d4a020');
        shg.addColorStop(1, '#856314');
        c!.fillStyle = shg;
        c!.fillText('जय हनुमान ज्ञान गुण सागर।', W / 2, l1y);
        c!.fillText('जय कपीस तिहुँ लोक उजागर॥', W / 2, l2y);
      }

      c!.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       2027: FILM GRAIN — subtle analog texture
       ═══════════════════════════════════════════════════════════ */
    function dGrain(t: number) {
      const pattern = c!.createPattern(grainCv, 'repeat');
      if (!pattern) return;
      c!.save();
      c!.globalAlpha = 0.028 + Math.sin(t * 2.7) * 0.008;
      c!.translate(((t * 137) | 0) % 256, ((t * 89) | 0) % 256);
      c!.fillStyle = pattern;
      c!.fillRect(-256, -256, W + 512, H + 512);
      c!.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       FINAL FADE-OUT
       ═══════════════════════════════════════════════════════════ */
    function dFade(t: number) {
      const fs = 9.8; const ft = Math.min((t - fs) / .7, 1); if (ft <= 0) return;
      const fa = eIQ(ft);
      c!.fillStyle = `rgba(15,8,3,${fa})`; c!.fillRect(0, 0, W, H);
      if (ft < .6) {
        const ga = (1 - ft / .6) * .18;
        const gg = c!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(EP, H * .35));
        gg.addColorStop(0, `rgba(255,190,65,${ga})`); gg.addColorStop(1, 'rgba(255,140,22,0)');
        c!.fillStyle = gg; c!.fillRect(0, 0, W, H);
      }
    }

    /* ═══════════════════════════════════════════════════════════
       PARTICLE UPDATE — 2027: Organic smoke turbulence
       ═══════════════════════════════════════════════════════════ */
    function upd(dt: number) {
      for (const p of pl) {
        if (!p.on || p.tp === 0) continue;
        p.x += p.vx; p.y += p.vy; p.life -= dt; p.rot += p.rs;
        switch (p.tp) {
          case 3: p.vx *= .97; p.vy *= .97; break;
          case 4: p.vx += Math.sin(p.y * .018 + p.rot) * .016; p.vy *= .999; break;
          case 5: p.vx *= .98; p.vy *= .98; break;
          case 6:
            // ★ 2027: Sine-based turbulence for organic smoke
            p.vx += Math.sin(p.y * 0.008 + p.x * 0.004) * 0.025;
            p.vx *= .995; p.vy *= .998; p.sz += .3; break;
          case 8: p.vx += (Math.random() - .5) * .016; break;
          case 9: p.vx *= .94; p.vy *= .94; break;
        }
        if (p.life <= 0 || p.y > H + 60 || p.x < -120 || p.x > W + 120) p.on = false;
      }
    }

    /* ═══════════════════════════════════════════════════════════
       RENDER LOOP — 2027 updated draw order
       ═══════════════════════════════════════════════════════════ */
    let lt = 0;
    const loop = (ts: number) => {
      if (!t0.current) { t0.current = ts; lt = ts; }
      const t = (ts - t0.current) / 1000; const dt = Math.min((ts - lt) / 1000, .05); lt = ts;

      // Background & atmosphere
      dBg(t);
      dVignette(t);        // ★ 2027: breathing vignette
      dTemples(t);
      dSmoke();
      dFlare(t);           // ★ 2027: anamorphic flare
      dRays(t);
      dDust(t);

      // Aarti phase
      dEnergy(t); dAarti(t); dBells(t);

      // Image — SPOTLIGHT reveal, ZERO crop
      dHanuman(t);

      // Particles
      dRevealSparkles();   // ★ 2027: 4-point stars
      dBloom(t); dBloomP();
      dPetals(); dKum(); dOrbit(); // ★ 2027: orbit with glow halos

      // Text & dissolve
      dDissolve(t);
      dText(t);            // ★ 2027: staggered + spring + shimmer

      // Final
      dGrain(t);           // ★ 2027: film grain on content
      dFade(t);

      // Spawn
      sSmoke(t); sOrbit(t); sRevealSparkles(t);
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
     LOADING SCREEN
     ═══════════════════════════════════════════════════════════════ */
  if (!imgReady) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden" style={{ background: '#07030a' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(160,60,10,0.18) 0%, rgba(80,15,15,0.08) 40%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: 'min(60vw, 320px)', height: 'min(60vw, 320px)', border: '1px dashed rgba(255,190,60,0.12)', animation: 'ringRotate 12s linear infinite' }} />
        <div className="absolute rounded-full" style={{ width: 'min(48vw, 260px)', height: 'min(48vw, 260px)', border: '1px dashed rgba(255,190,60,0.08)', animation: 'ringRotate 18s linear infinite reverse' }} />
        <div className="absolute rounded-full" style={{ width: 'min(40vw, 220px)', height: 'min(40vw, 220px)', background: 'radial-gradient(circle, rgba(255,180,40,0.08) 0%, transparent 70%)', animation: 'auraPulse 3s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 'min(28vw, 160px)', height: 'min(28vw, 160px)', background: 'radial-gradient(circle, rgba(255,160,30,0.1) 0%, transparent 65%)', animation: 'auraPulse 3s ease-in-out infinite 1.5s' }} />
        <div className="absolute flex gap-16" style={{ bottom: '22%' }}>
          {[0, 1.2, 2.4].map((d, i) => (
            <div key={i} className="flex flex-col items-center" style={{ animation: `floatY ${2.2 + i * 0.3}s ease-in-out infinite ${d}s` }}>
              <div style={{ width: 8, height: 18, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: 'linear-gradient(to top, rgba(255,100,20,0.9), rgba(255,200,50,0.6) 40%, rgba(255,255,180,0.3))', filter: 'blur(1.5px)', animation: `flameFlicker ${0.3 + i * 0.1}s ease-in-out infinite alternate` }} />
              <div style={{ width: 18, height: 8, borderRadius: 4, background: 'linear-gradient(to right, rgba(255,180,50,0.6), rgba(255,220,100,0.3), rgba(255,180,50,0.6))', filter: 'blur(3px)' }} />
            </div>
          ))}
        </div>
        <div className="relative flex flex-col items-center">
          <div className="absolute rounded-full" style={{ width: 'min(35vw, 200px)', height: 'min(35vw, 200px)', background: 'radial-gradient(circle, rgba(255,200,50,0.06) 0%, transparent 70%)', animation: 'omBreath 2.4s ease-in-out infinite' }} />
          <div className="absolute rounded-full" style={{ width: 'min(22vw, 130px)', height: 'min(22vw, 130px)', background: 'radial-gradient(circle, rgba(255,210,80,0.1) 0%, transparent 60%)', animation: 'omBreath 2.4s ease-in-out infinite 0.3s' }} />
          <div className="relative select-none" style={{ fontSize: 'clamp(4rem, 12vw, 7rem)', lineHeight: 1, color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 50px rgba(255,190,50,0.5), 0 0 100px rgba(255,170,30,0.25), 0 0 160px rgba(255,150,20,0.1)', animation: 'omBreath 2.4s ease-in-out infinite', fontFamily: "'Noto Sans Devanagari', 'Devanagari Sangam MN', 'Mangal', serif" }}>ॐ</div>
        </div>
        <div className="absolute flex flex-col items-center gap-3" style={{ bottom: '10%' }}>
          <p className="select-none tracking-[0.3em]" style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)', color: 'rgba(255,200,80,0.5)', animation: 'textPulse 2.4s ease-in-out infinite' }}>हनुमान जयंती आरती प्रारंभ हो रही है</p>
          <div className="flex items-center gap-2">
            <div className="h-px" style={{ width: 'clamp(40px, 10vw, 80px)', background: 'linear-gradient(to right, transparent, rgba(255,190,60,0.3), transparent)' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffd700', boxShadow: '0 0 8px rgba(255,215,0,0.6), 0 0 20px rgba(255,200,50,0.3)', animation: 'dotPulse 1.8s ease-in-out infinite' }} />
            <div className="h-px" style={{ width: 'clamp(40px, 10vw, 80px)', background: 'linear-gradient(to left, transparent, rgba(255,190,60,0.3), transparent)' }} />
          </div>
        </div>
        <div className="absolute top-4 left-4 w-8 h-8 border border-yellow-700/10 rounded-full" style={{ animation: 'cornerSpin 20s linear infinite' }} />
        <div className="absolute top-4 right-4 w-8 h-8 border border-yellow-700/10 rounded-full" style={{ animation: 'cornerSpin 20s linear infinite reverse' }} />
        <div className="absolute bottom-4 left-4 w-8 h-8 border border-yellow-700/10 rounded-full" style={{ animation: 'cornerSpin 20s linear infinite 5s' }} />
        <div className="absolute bottom-4 right-4 w-8 h-8 border border-yellow-700/10 rounded-full" style={{ animation: 'cornerSpin 20s linear infinite 15s' }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes omBreath { 0%,100%{opacity:.75;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
          @keyframes textPulse { 0%,100%{opacity:.35} 50%{opacity:.7} }
          @keyframes auraPulse { 0%,100%{transform:scale(.9);opacity:.4} 50%{transform:scale(1.1);opacity:1} }
          @keyframes ringRotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes flameFlicker { 0%{transform:scaleY(1) scaleX(1);opacity:.8} 100%{transform:scaleY(1.15) scaleX(.85);opacity:1} }
          @keyframes dotPulse { 0%,100%{opacity:.4;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
          @keyframes cornerSpin { 0%{transform:rotate(0deg);border-color:rgba(255,190,60,.08)} 25%{border-color:rgba(255,190,60,.15)} 50%{border-color:rgba(255,190,60,.05)} 75%{border-color:rgba(255,190,60,.12)} 100%{transform:rotate(360deg);border-color:rgba(255,190,60,.08)} }
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
