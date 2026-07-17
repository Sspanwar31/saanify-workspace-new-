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
const DUR = 15.0; // 🚀 TIMELINE SYNCHRONIZATION: Updated to full 15.0 seconds
const EP = 1e-4;

const DEFAULT_IMG_URL = 'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Maa%20Durga/Screenshot%202026-07-17%20201625.png';

/* ═══════════════════════════════════════════════════════════════
   EASING HELPERS
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

export default function NavratriCinematicIntro({ onComplete, imageUrl }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const durgaImgRef = useRef<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = useState(false);

  const raf = useRef(0);
  const t0 = useRef(0);
  const done = useRef(false);
  const cbR = useRef(onComplete);
  cbR.current = onComplete;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { durgaImgRef.current = img; setImgReady(true); };
    img.onerror = () => { setImgReady(true); };
    img.src = imageUrl || DEFAULT_IMG_URL;
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
      const duration = 4.5;
      const mainGain = ctx.createGain();
      mainGain.connect(ctx.destination);
      mainGain.gain.setValueAtTime(0, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.01);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      [1.0, 1.5, 2.0, 2.5, 3.0].forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const gNode = ctx.createGain();
        osc.frequency.value = frequency * ratio;
        osc.type = i === 0 ? 'sine' : 'triangle';
        gNode.gain.setValueAtTime(0.35 / (i + 1), ctx.currentTime);
        gNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / (i + 0.9));
        osc.connect(gNode); gNode.connect(mainGain);
        osc.start(); osc.stop(ctx.currentTime + duration);
      });
    } catch (err) { /* silent */ }
  }, []);

  useEffect(() => {
    if (!imgReady) return;

    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    } catch (_) { /* no audio */ }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const rsz = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    rsz(); window.addEventListener('resize', rsz);

    /* ─── Film Grain ─── */
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
      p.vx = (Math.random() - .5) * .18; p.vy = -Math.random() * .3 - .04;
      p.sz = Math.random() * 1.4 + .3; p.ml = 999; p.life = 999;
      p.r = 244; p.g = 63; p.b = 94;
      p.a = Math.random() * .18 + .04; p.rot = 0; p.rs = 0;
      dI.push(i);
    }

    const bells: Bell[] = [
      { x: 0.24, length: 80, angle: 0.22, lastBellTime: 0 },
      { x: 0.50, length: 110, angle: -0.15, lastBellTime: 0 },
      { x: 0.76, length: 80, angle: 0.18, lastBellTime: 0 },
    ];

    /* ─── Temple Arch Path ─── */
    const drawArchPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rBottom: number) => {
      const rTop = w / 2;
      ctx.beginPath();
      ctx.moveTo(x + rBottom, y + h);
      ctx.lineTo(x + w - rBottom, y + h);
      ctx.arcTo(x + w, y + h, x + w, y + h - rBottom, rBottom);
      ctx.lineTo(x + w, y + rTop);
      ctx.arc(x + rTop, y + rTop, rTop, 0, Math.PI, true);
      ctx.lineTo(x, y + h - rBottom);
      ctx.arcTo(x, y + h, x + rBottom, y + h, rBottom);
      ctx.closePath();
    };

    const getImgDims = () => {
      const img = durgaImgRef.current;
      if (!img || !img.complete || img.naturalWidth === 0) return null;
      const cx = W / 2, cy = H / 2 - H * 0.01;
      const sc = Math.min(W, H);
      const displayW = sc * 0.30;
      const displayH = displayW * 1.35;
      const maxR = Math.max(displayW, displayH) / 2 + 10;
      return { img, cx, cy, displayW, displayH, maxR };
    };

    /* ═══════════════════════════════════════════════════════════
       BACKGROUND
       ═══════════════════════════════════════════════════════════ */
    function dBg(t: number) {
      c.fillStyle = '#050108'; c.fillRect(0, 0, W, H);

      const aa = t < 1.5 ? eOC(Math.min(t / 1.2, 1)) * .7 : .7;
      let g = c.createRadialGradient(W * .5, H * .18, 0, W * .5, H * .18, H * .85);
      g.addColorStop(0, `rgba(180,20,40,${aa * .22})`);
      g.addColorStop(.4, `rgba(120,20,60,${aa * .12})`);
      g.addColorStop(.7, `rgba(50,10,50,${aa * .06})`);
      g.addColorStop(1, 'rgba(5,1,8,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);

      g = c.createRadialGradient(W * .5, H * .92, 0, W * .5, H * .92, H * .45);
      g.addColorStop(0, `rgba(200,80,20,${aa * .18})`);
      g.addColorStop(.5, `rgba(140,30,30,${aa * .08})`);
      g.addColorStop(1, 'rgba(5,1,8,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);

      let ca = 0;
      if (t > 2.0) ca = Math.min((t - 2.0) / 5.0, 1) * .15; // Adjusted to start after 2.0s FLASH
      if (t > 7.0) ca = .15 + Math.min((t - 7.0) / 1.5, 1) * .2;  // DISPLAY start
      if (t > 11.5) ca = .35 * (1 - Math.min((t - 11.5) / 2.0, 1)); // Fade during HANDOVER

      g = c.createRadialGradient(W * .5, H * .42, 0, W * .5, H * .42, H * .5);
      g.addColorStop(0, `rgba(255,140,60,${ca})`);
      g.addColorStop(.3, `rgba(220,50,50,${ca * .35})`);
      g.addColorStop(.6, `rgba(120,30,80,${ca * .15})`);
      g.addColorStop(1, 'rgba(5,1,8,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       VIGNETTE
       ═══════════════════════════════════════════════════════════ */
    function dVignette(t: number) {
      const breathe = 0.6 + Math.sin(t * 1.2) * 0.04;
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.24, W / 2, H / 2, Math.max(EP, Math.max(W, H) * 0.82));
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(5,1,8,${breathe})`);
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       TEMPLES
       ═══════════════════════════════════════════════════════════ */
    function dTemples(t: number) {
      const fa = t < 2.0 ? eOC(Math.min(t / 1.5, 1)) * .22 : .22;
      if (t > 11.5) { if (Math.max(0, 1 - (t - 11.5) / 2.0) <= 0) return; }
      const al = t > 11.5 ? Math.max(0, .22 - (t - 11.5) * .11) : fa;
      c.save(); c.globalAlpha = al; c.fillStyle = '#0a0312';
      const gops = [
        { cx: W * .1, bw: W * .1, bh: H * .28, ti: 5 }, { cx: W * .18, bw: W * .065, bh: H * .2, ti: 4 },
        { cx: W * .83, bw: W * .09, bh: H * .25, ti: 5 }, { cx: W * .92, bw: W * .055, bh: H * .18, ti: 3 },
        { cx: W * .5, bw: W * .045, bh: H * .12, ti: 3 }, { cx: W * .38, bw: W * .04, bh: H * .1, ti: 3 },
        { cx: W * .62, bw: W * .04, bh: H * .1, ti: 3 },
      ];
      for (const gop of gops) {
        const by = H * .86; const th = gop.bh / (gop.ti + 1);
        for (let i = 0; i < gop.ti; i++) {
          const sh = 1 - (i / gop.ti) * .55; const w = gop.bw * sh;
          c.fillRect(gop.cx - w / 2, by - (i + 1) * th, w, th + 1);
        }
        const tw = gop.bw * .28; const ty = by - gop.ti * th;
        c.beginPath(); c.moveTo(gop.cx, ty - th * .7); c.lineTo(gop.cx - tw / 2, ty); c.lineTo(gop.cx + tw / 2, ty); c.closePath(); c.fill();
      }
      c.fillRect(0, H * .86, W, H * .14);
      const gg = c.createLinearGradient(0, H * .84, 0, H * .9);
      gg.addColorStop(0, 'rgba(180,30,30,0)'); gg.addColorStop(1, `rgba(180,30,30,${al * .2})`);
      c.fillStyle = gg; c.fillRect(0, H * .84, W, H * .06);
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       SMOKE
       ═══════════════════════════════════════════════════════════ */
    function sSmoke(t: number) {
      if (Math.random() > (t < 2.0 ? 0.4 : 0.12)) return;
      const p = grab(pl); if (!p) return;
      p.x = W * .35 + Math.random() * W * .3;
      p.y = H * .75 + Math.random() * H * .15;
      p.sz = Math.random() * 40 + 12;
      p.a = .025 + Math.random() * .02;
      p.ml = 5 + Math.random() * 3;
      p.vx = (Math.random() - .5) * .25; p.vy = -Math.random() * .5 - .15;
      p.life = p.ml;
      p.r = 180; p.g = 140; p.b = 120;
      p.rot = 0; p.rs = 0; p.on = true; p.tp = 6;
    }
    function dSmoke() {
      for (const p of pl) {
        if (!p.on || p.tp !== 6) continue;
        const lr = p.life / p.ml;
        const a = p.a * (lr < .3 ? lr / .3 : lr > .7 ? (1 - lr) / .3 : 1);
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, p.sz));
        g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a})`);
        g.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
        c.fillStyle = g; c.fillRect(p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
      }
    }

    /* ═══════════════════════════════════════════════════════════
       DUST
       ═══════════════════════════════════════════════════════════ */
    function dDust(t: number) {
      for (let i = 0; i < dI.length; i++) {
        const p = pl[dI[i]];
        p.x += p.vx + Math.sin(t * .35 + i) * .06; p.y += p.vy;
        if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
        if (p.x < -12) p.x = W + 12; if (p.x > W + 12) p.x = -12;
        const fl = .6 + Math.sin(t * 1.6 + i * .55) * .4;
        c.beginPath(); c.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * fl})`; c.fill();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       GARBA SWIRL ORBITS
       ═══════════════════════════════════════════════════════════ */
    function sOrbit(t: number) {
      if (t < 2.0 || t > 11.5 || Math.random() > .2) return; // Sync with reveal to display
      const p = grab(pl); if (!p) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015;
      const ang = Math.random() * Math.PI * 2; const rad = sc * .38 + Math.random() * sc * .1;
      p.x = cx + Math.cos(ang) * rad; p.y = cy + Math.sin(ang) * rad;
      p.vx = Math.cos(ang + Math.PI / 2) * .7; p.vy = Math.sin(ang + Math.PI / 2) * .7;
      p.sz = Math.random() * 1.6 + .4; p.ml = 2.5 + Math.random() * 2; p.life = p.ml;
      p.r = 244; p.g = 63; p.b = 94;
      p.a = .4 + Math.random() * .3; p.rot = 0; p.rs = 0; p.on = true; p.tp = 5;
    }
    function dOrbit() {
      for (const p of pl) {
        if (!p.on || p.tp !== 5) continue;
        const lr = p.life / p.ml;
        const a = p.a * Math.min(lr * 2, 1) * Math.min((1 - lr) * 2, 1);
        const haloR = p.sz * 4;
        const hg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, haloR));
        hg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a * 0.2})`);
        hg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
        c.fillStyle = hg;
        c.fillRect(p.x - haloR, p.y - haloR, haloR * 2, haloR * 2);
        c.beginPath(); c.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c.fill();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       ENERGY
       ═══════════════════════════════════════════════════════════ */
    function dEnergy(t: number) {
      if (t >= 0 && t < 2.0) {
        const ep = eOC(Math.min(t / 1.5, 1));
        const ea = ep * .08;
        const eg = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(EP, H * .45));
        eg.addColorStop(0, `rgba(200,30,60,${ea})`);
        eg.addColorStop(.5, `rgba(100,20,80,${ea * .4})`);
        eg.addColorStop(1, 'rgba(5,1,8,0)');
        c.fillStyle = eg; c.fillRect(0, 0, W, H);
        return;
      }
      if (t < 7.0 || t > 11.5) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015;
      let ea = 0;
      if (t < 9.5) ea = Math.min((t - 7.0) / 2.5, 1) * .12;
      else ea = .12 * (1 - Math.min((t - 9.5) / 2.0, 1) * .5);
      const eg = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, sc * .42));
      eg.addColorStop(0, `rgba(255,140,60,${ea})`);
      eg.addColorStop(.5, `rgba(200,40,60,${ea * .4})`);
      eg.addColorStop(1, 'rgba(5,1,8,0)');
      c.fillStyle = eg; c.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       BELLS
       ═══════════════════════════════════════════════════════════ */
    function dBells(t: number) {
      const bs = 7.0; if (t < bs) return; // Display start
      let ba = Math.min((t - bs) / .8, 1);
      if (t > 11.5) ba = Math.max(0, 1 - (t - 11.5) / 1.0);
      if (ba <= 0) return;
      const bsz = Math.min(W, H) * .11;
      drawBell(W * .28, H * .04, bsz, .28 * Math.sin(t * 2.6) * ba, ba);
      drawBell(W * .72, H * .04, bsz, .24 * Math.sin(t * 2.9 + 1.6) * ba, ba);
      bells.forEach((bell, idx) => {
        const angle = Math.sin(t * (1.8 + idx * 0.35)) * 0.18;
        if (Math.abs(angle) < 0.02 && t - bell.lastBellTime > 0.8) {
          bell.lastBellTime = t;
          triggerBellSound([294, 220, 330][idx]);
        }
      });
    }
    function drawBell(ax: number, ay: number, s: number, ang: number, al: number) {
      c.save(); c.globalAlpha = al; c.translate(ax, ay); c.rotate(ang);
      c.strokeStyle = '#7a6535'; c.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, s * .08 * (i + 1), Math.max(EP, s * .028), Math.max(EP, s * .045), 0, 0, Math.PI * 2); c.stroke(); }
      const ty = s * .32, bb = s, tw = s * .11, bw = s * .34;
      c.beginPath(); c.moveTo(-tw, ty);
      c.bezierCurveTo(-tw, ty + s * .2, -bw * .82, ty + s * .4, -bw * .5, bb);
      c.lineTo(bw * .5, bb);
      c.bezierCurveTo(bw * .82, ty + s * .4, tw, ty + s * .2, tw, ty);
      c.closePath();
      const bg = c.createLinearGradient(-bw, 0, bw, 0);
      bg.addColorStop(0, '#523e10'); bg.addColorStop(.25, '#9a7520'); bg.addColorStop(.45, '#c9a030');
      bg.addColorStop(.55, '#dab540'); bg.addColorStop(.75, '#9a7520'); bg.addColorStop(1, '#523e10');
      c.fillStyle = bg; c.fill();
      c.beginPath(); c.moveTo(-tw * .25, ty + s * .05);
      c.bezierCurveTo(-tw * .25, ty + s * .2, -bw * .22, ty + s * .4, -bw * .22, bb - s * .04);
      c.lineTo(-bw * .1, bb - s * .04);
      c.bezierCurveTo(-bw * .1, ty + s * .4, -tw * .1, ty + s * .2, -tw * .1, ty + s * .05);
      c.closePath(); c.fillStyle = 'rgba(255,228,165,.12)'; c.fill();
      c.beginPath(); c.moveTo(-bw * .5, bb); c.lineTo(bw * .5, bb);
      c.strokeStyle = '#dab540'; c.lineWidth = 1.8; c.stroke();
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       AARTI
       ═══════════════════════════════════════════════════════════ */
    function dAarti(t: number) {
      const as = 7.0; if (t < as) return; // Display start
      let aa = Math.min((t - as) / .8, 1);
      if (t > 11.5) aa = Math.max(0, 1 - (t - 11.5) / 1.0);
      if (aa <= 0) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015;
      const orad = sc * .44; const ang = (t - as) * Math.PI * 1.3;
      const ax = cx + Math.cos(ang) * orad; const ay = cy + Math.sin(ang) * orad * .52;
      for (let i = 1; i < 18; i++) {
        const ta = ang - i * .045; const tx = cx + Math.cos(ta) * orad; const ty = cy + Math.sin(ta) * orad * .52;
        const tg = c.createRadialGradient(tx, ty, 0, tx, ty, Math.max(EP, 10));
        tg.addColorStop(0, `rgba(255,175,45,${(1 - i / 18) * .1 * aa})`); tg.addColorStop(1, 'rgba(255,140,30,0)');
        c.fillStyle = tg; c.fillRect(tx - 10, ty - 10, 20, 20);
      }
      c.save(); c.globalAlpha = aa; c.translate(ax, ay);
      c.beginPath(); c.ellipse(0, 0, Math.max(EP, 11), Math.max(EP, 4.5), 0, 0, Math.PI * 2);
      c.fillStyle = '#b8942e'; c.fill(); c.strokeStyle = '#7a6520'; c.lineWidth = .8; c.stroke();
      const fk = 1 + Math.sin(t * 13) * .14 + Math.sin(t * 19) * .09; const fh = 17 * fk;
      c.beginPath(); c.moveTo(0, -2);
      c.bezierCurveTo(-5.5, -fh * .4, -4.5, -fh * .8, 0, -fh);
      c.bezierCurveTo(4.5, -fh * .8, 5.5, -fh * .4, 0, -2);
      c.fillStyle = 'rgba(255,135,18,.68)'; c.fill();
      c.beginPath(); c.moveTo(0, -2);
      c.bezierCurveTo(-2.8, -fh * .32, -2.2, -fh * .58, 0, -fh * .68);
      c.bezierCurveTo(2.2, -fh * .58, 2.8, -fh * .32, 0, -2);
      c.fillStyle = 'rgba(255,218,95,.88)'; c.fill();
      c.beginPath(); c.moveTo(0, -2);
      c.bezierCurveTo(-1.2, -fh * .18, -.8, -fh * .32, 0, -fh * .38);
      c.bezierCurveTo(.8, -fh * .32, 1.2, -fh * .18, 0, -2);
      c.fillStyle = 'rgba(255,252,218,.92)'; c.fill();
      const fg = c.createRadialGradient(0, -fh * .28, 0, 0, -fh * .28, Math.max(EP, 32));
      fg.addColorStop(0, 'rgba(255,175,48,.22)'); fg.addColorStop(.5, 'rgba(255,135,28,.06)'); fg.addColorStop(1, 'rgba(255,95,18,0)');
      c.fillStyle = fg; c.fillRect(-32, -fh - 14, 64, fh + 42);
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       FLATING DIYAS
       ═══════════════════════════════════════════════════════════ */
    function dDiyas(t: number) {
      const ds = 7.0; if (t < ds) return; // Display start
      let da = Math.min((t - ds) / .8, 1);
      if (t > 11.5) da = Math.max(0, 1 - (t - 11.5) / 1.5);
      if (da <= 0) return;

      const sc = Math.min(W, H);
      const diyaSize = sc * 0.035;
      const positions = [
        { x: W * 0.15, y: H * 0.72, scl: 0.9 },
        { x: W * 0.85, y: H * 0.72, scl: 0.9 },
        { x: W * 0.12, y: H * 0.82, scl: 0.65 },
        { x: W * 0.88, y: H * 0.82, scl: 0.65 },
      ];

      c.save();
      c.globalAlpha = da;

      for (const pos of positions) {
        const s = diyaSize * pos.scl;
        c.save();
        c.translate(pos.x, pos.y);

        c.beginPath();
        c.ellipse(0, 0, Math.max(EP, s * 0.6), Math.max(0.01, s * 0.2), 0, 0, Math.PI * 2);
        const oilGrad = c.createRadialGradient(0, 0, 0, 0, 0, Math.max(EP, s * 0.6));
        oilGrad.addColorStop(0, '#fbbf24');
        oilGrad.addColorStop(0.6, '#f59e0b');
        oilGrad.addColorStop(1, '#92400e');
        c.fillStyle = oilGrad;
        c.fill();

        c.beginPath();
        c.ellipse(0, s * 0.12, Math.max(EP, s * 0.68), Math.max(0.01, s * 0.18), 0, 0, Math.PI * 2);
        const clayGrad = c.createLinearGradient(-s * 0.7, 0, s * 0.7, 0);
        clayGrad.addColorStop(0, '#78350f');
        clayGrad.addColorStop(0.3, '#a16207');
        clayGrad.addColorStop(0.7, '#92400e');
        clayGrad.addColorStop(1, '#78350f');
        c.fillStyle = clayGrad;
        c.fill();

        c.beginPath();
        c.rect(-s * 0.02, -s * 0.04, s * 0.04, s * 0.08);
        c.fillStyle = '#fde68a';
        c.fill();

        const flicker1 = Math.sin(t * 12 + pos.x) * 0.15;
        const flicker2 = Math.sin(t * 17 + pos.y) * 0.12;
        const flicker3 = Math.cos(t * 23) * 0.08;
        const baseH = s * 1.2;

        c.globalCompositeOperation = 'lighter';

        const glowR = s * 1.8;
        const glow = c.createRadialGradient(0, -baseH * 0.3, 0, 0, -baseH * 0.3, Math.max(EP, glowR));
        glow.addColorStop(0, 'rgba(255,200,50,0.12)');
        glow.addColorStop(0.5, 'rgba(255,120,30,0.04)');
        glow.addColorStop(1, 'rgba(255,80,20,0)');
        c.fillStyle = glow;
        c.fillRect(-glowR, -baseH * 0.3 - glowR, glowR * 2, glowR * 2);

        const h1 = baseH * (1 + flicker1);
        c.beginPath();
        c.moveTo(-s * 0.15, 0);
        c.bezierCurveTo(-s * 0.12, -h1 * 0.4, -s * 0.03 + Math.sin(t * 8) * s * 0.06, -h1 * 0.85, 0, -h1);
        c.bezierCurveTo(s * 0.03 + Math.sin(t * 8) * s * 0.06, -h1 * 0.85, s * 0.12, -h1 * 0.4, s * 0.15, 0);
        c.closePath();
        const fg1 = c.createLinearGradient(0, 0, 0, -h1);
        fg1.addColorStop(0, 'rgba(255,80,20,0.7)');
        fg1.addColorStop(0.4, 'rgba(255,160,40,0.4)');
        fg1.addColorStop(1, 'rgba(255,200,60,0)');
        c.fillStyle = fg1;
        c.fill();

        const h2 = h1 * 0.7 * (1 + flicker2);
        c.beginPath();
        c.moveTo(-s * 0.08, 0);
        c.bezierCurveTo(-s * 0.06, -h2 * 0.4, -s * 0.02 + Math.sin(t * 10) * s * 0.04, -h2 * 0.8, 0, -h2);
        c.bezierCurveTo(s * 0.02 + Math.sin(t * 10) * s * 0.04, -h2 * 0.8, s * 0.06, -h2 * 0.4, s * 0.08, 0);
        c.closePath();
        const fg2 = c.createLinearGradient(0, 0, 0, -h2);
        fg2.addColorStop(0, 'rgba(255,220,80,0.9)');
        fg2.addColorStop(0.5, 'rgba(255,180,50,0.5)');
        fg2.addColorStop(1, 'rgba(255,255,200,0)');
        c.fillStyle = fg2;
        c.fill();

        const h3 = h2 * 0.5 * (1 + flicker3);
        c.beginPath();
        c.moveTo(-s * 0.03, 0);
        c.quadraticCurveTo(0, -h3 * 0.5, 0, -h3);
        c.quadraticCurveTo(s * 0.03, -h3 * 0.5, s * 0.03, 0);
        c.closePath();
        c.fillStyle = 'rgba(255,255,240,0.85)';
        c.fill();

        c.globalCompositeOperation = 'source-over';
        c.restore();
      }
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       MAA DURGA
       ═══════════════════════════════════════════════════════════ */
    function dDurga(t: number) {
      if (t < 2.0) return; // 🌟 SYNCHRONIZED: Safe check matches the 2.0s FLASH duration
      const img = durgaImgRef.current;
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cx = W / 2, cy = H / 2 - H * 0.01;
      const sc = Math.min(W, H);
      const displayW = sc * 0.30;
      const displayH = displayW * 1.35;
      const br = displayW * 0.07;
      const fx = cx - displayW / 2;
      const fy = cy - displayH / 2;

      let frameAlpha = 0;
      let revealProg = 0;
      let flashI = 0;
      let fadeAlpha = 1;
      let breathScale = 0;

      // 🌟 DYNAMIC SYNCHRONIZED TIMING 🌟
      if (t >= 2.0 && t < 7.0) {
        const raw = Math.min((t - 2.0) / 5.0, 1); // 5.0 seconds REVEAL phase
        frameAlpha = Math.min(raw * 5, 1);
        revealProg = eIO(raw);
        flashI = Math.max(0, 1 - raw * 2.5) * 1.0;
      } else if (t >= 7.0 && t < 11.5) {
        frameAlpha = 1;
        revealProg = 1;
        flashI = 0;
        breathScale = Math.sin(t * 2.5) * 0.004;
      } else if (t >= 11.5) {
        const d = Math.min((t - 11.5) / 3.5, 1); // 3.5 seconds HANDOVER fadeout
        frameAlpha = Math.max(0, 1 - d);
        revealProg = 1;
        fadeAlpha = Math.max(0, 1 - d);
      }

      if (frameAlpha <= 0) return;

      c.save();
      c.globalAlpha = fadeAlpha;

      if (breathScale !== 0) {
        c.translate(cx, cy);
        c.scale(1 + breathScale, 1 + breathScale);
        c.translate(-cx, -cy);
      }

      if (flashI > 0.1) {
        const flashR = displayW * 0.65 * (1 + (1 - flashI) * 0.5);
        const fg = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, flashR));
        fg.addColorStop(0, `rgba(255,240,220,${flashI * 0.65})`);
        fg.addColorStop(0.15, `rgba(255,180,100,${flashI * 0.45})`);
        fg.addColorStop(0.35, `rgba(220,50,50,${flashI * 0.25})`);
        fg.addColorStop(0.6, `rgba(180,30,60,${flashI * 0.1})`);
        fg.addColorStop(1, 'rgba(100,10,40,0)');
        c.fillStyle = fg;
        c.fillRect(fx - displayW * 0.3, fy - displayH * 0.2, displayW * 1.6, displayH * 1.4);
      }

      const ah = c.createRadialGradient(cx, cy, Math.max(EP, displayW * 0.42), cx, cy, Math.max(EP, displayW * 0.78));
      ah.addColorStop(0, 'rgba(220,60,80,0.04)');
      ah.addColorStop(1, 'rgba(180,30,60,0)');
      c.fillStyle = ah;
      c.fillRect(fx - displayW * 0.35, fy - displayH * 0.18, displayW * 1.7, displayH * 1.36);

      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      c.shadowColor = 'rgba(220,38,38,0.5)';
      c.shadowBlur = 44;
      c.shadowOffsetY = 4;
      drawArchPath(c, fx, fy, displayW, displayH, br);
      c.fillStyle = '#0a0312';
      c.fill();
      c.restore();

      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      drawArchPath(c, fx, fy, displayW, displayH, br);
      c.clip();

      const ig = c.createRadialGradient(cx, cy - displayH * 0.08, 0, cx, cy, Math.max(EP, displayW * 0.72));
      ig.addColorStop(0, 'rgba(255,120,80,0.12)');
      ig.addColorStop(0.5, 'rgba(255,60,60,0.04)');
      ig.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = ig;
      c.fillRect(fx, fy, displayW, displayH);

      const maxRevealR = Math.max(displayW, displayH) * 0.85;
      const currentR = Math.max(EP, maxRevealR * revealProg);
      c.save();
      c.beginPath();
      c.arc(cx, cy, currentR, 0, Math.PI * 2);
      c.clip();

      const imgR = img.naturalWidth / img.naturalHeight;
      const frmR = displayW / displayH;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (imgR > frmR) { sw = img.naturalHeight * frmR; sx = (img.naturalWidth - sw) / 2; }
      else { sh = img.naturalWidth / frmR; sy = (img.naturalHeight - sh) / 2; }
      c.drawImage(img, sx, sy, sw, sh, fx, fy, displayW, displayH);
      c.restore();

      if (flashI > 0.01 && currentR > 5) {
        const edgeW = 22 + flashI * 30;
        const innerR = Math.max(EP, currentR - edgeW);
        const outerR = Math.max(EP, currentR + edgeW);
        const eg = c.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
        eg.addColorStop(0, 'rgba(255,200,150,0)');
        eg.addColorStop(0.3, `rgba(255,150,100,${flashI * 0.35})`);
        eg.addColorStop(0.48, `rgba(255,240,200,${flashI * 0.8})`);
        eg.addColorStop(0.52, `rgba(255,255,240,${flashI * 1.0})`);
        eg.addColorStop(0.7, `rgba(255,150,100,${flashI * 0.35})`);
        eg.addColorStop(1, 'rgba(255,100,60,0)');
        c.fillStyle = eg;
        c.fillRect(fx, fy, displayW, displayH);
      }

      const tf = c.createLinearGradient(0, fy, 0, fy + displayH * 0.1);
      tf.addColorStop(0, 'rgba(10,3,18,0.55)');
      tf.addColorStop(1, 'rgba(10,3,18,0)');
      c.fillStyle = tf;
      c.fillRect(fx, fy, displayW, displayH * 0.1);

      const bf = c.createLinearGradient(0, fy + displayH, 0, fy + displayH * 0.9);
      bf.addColorStop(0, 'rgba(8,9,16,0.48)');
      bf.addColorStop(1, 'rgba(8,9,16,0)');
      c.fillStyle = bf;
      c.fillRect(fx, fy + displayH * 0.9, displayW, displayH * 0.1);

      const iv = c.createRadialGradient(cx, cy, Math.max(EP, displayW * 0.22), cx, cy, Math.max(EP, displayW * 0.54));
      iv.addColorStop(0, 'rgba(0,0,0,0)');
      iv.addColorStop(1, 'rgba(0,0,0,0.2)');
      c.fillStyle = iv;
      c.fillRect(fx, fy, displayW, displayH);
      c.restore();

      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      const og = c.createLinearGradient(fx, fy - displayW * 0.05, fx, fy + displayH);
      og.addColorStop(0, '#f0c8d8');
      og.addColorStop(0.1, '#e8a8b0');
      og.addColorStop(0.28, '#d4a030');
      og.addColorStop(0.52, '#c44020');
      og.addColorStop(0.78, '#8b2010');
      og.addColorStop(1, '#5a1508');
      c.strokeStyle = og;
      c.lineWidth = 4;
      c.shadowColor = `rgba(255,215,0,${0.35 + flashI * 0.4})`;
      c.shadowBlur = 16 + flashI * 20;
      drawArchPath(c, fx, fy, displayW, displayH, br);
      c.stroke();
      c.restore();

      const ins = 8;
      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      const ig2 = c.createLinearGradient(fx, fy, fx, fy + displayH);
      ig2.addColorStop(0, 'rgba(240,200,210,0.45)');
      ig2.addColorStop(0.5, 'rgba(200,140,100,0.3)');
      ig2.addColorStop(1, 'rgba(160,80,60,0.18)');
      c.strokeStyle = ig2;
      c.lineWidth = 1.2;
      drawArchPath(c, fx + ins, fy + ins, displayW - ins * 2, displayH - ins * 2, Math.max(EP, br - ins * 0.35));
      c.stroke();
      c.restore();

      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      const sg = c.createLinearGradient(fx + displayW * 0.06, 0, fx + displayW * 0.94, 0);
      sg.addColorStop(0, 'rgba(255,240,220,0)');
      sg.addColorStop(0.32, 'rgba(255,240,220,0)');
      sg.addColorStop(0.5, 'rgba(255,240,220,0.38)');
      sg.addColorStop(0.68, 'rgba(255,240,220,0)');
      sg.addColorStop(1, 'rgba(255,240,220,0)');
      c.strokeStyle = sg;
      c.lineWidth = 0.9;
      drawArchPath(c, fx, fy, displayW, displayH, br);
      c.stroke();
      c.restore();

      const fss = displayW * 0.034;
      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      c.fillStyle = '#ffd700';
      c.shadowColor = 'rgba(255,215,0,0.7)';
      c.shadowBlur = 10;
      c.beginPath();
      c.moveTo(cx, fy - fss * 2.5);
      c.lineTo(cx + fss * 0.85, fy - fss * 0.3);
      c.lineTo(cx, fy + fss * 0.7);
      c.lineTo(cx - fss * 0.85, fy - fss * 0.3);
      c.closePath();
      c.fill();
      c.beginPath();
      c.arc(cx, fy + fss * 0.25, Math.max(EP, fss * 0.48), 0, Math.PI * 2);
      c.fill();
      c.restore();

      const dr = displayW * 0.01;
      const jy = fy + displayW / 2;
      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      c.fillStyle = '#ffd700';
      c.shadowColor = 'rgba(255,215,0,0.5)';
      c.shadowBlur = 5;
      c.beginPath(); c.arc(fx + 1.5, jy, Math.max(EP, dr), 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(fx + displayW - 1.5, jy, Math.max(EP, dr), 0, Math.PI * 2); c.fill();
      c.restore();

      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha * 0.6;
      c.fillStyle = 'rgba(255,215,0,0.6)';
      c.shadowColor = 'rgba(255,215,0,0.35)';
      c.shadowBlur = 4;
      const cdr = dr * 0.8;
      c.beginPath(); c.arc(fx + br * 0.6, fy + displayH - br * 0.6, Math.max(EP, cdr), 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(fx + displayW - br * 0.6, fy + displayH - br * 0.6, Math.max(EP, cdr), 0, Math.PI * 2); c.fill();
      c.restore();

      if (t >= 7.0 && t < 11.5) {
        const st = (t - 7.5) / 1.5;
        if (st >= 0 && st <= 1) {
          const sx2 = fx + st * displayW * 1.4 - displayW * 0.2;
          const sw2 = displayW * 0.13;
          c.save();
          c.globalAlpha = fadeAlpha;
          drawArchPath(c, fx, fy, displayW, displayH, br);
          c.clip();
          const shim = c.createLinearGradient(sx2 - sw2, 0, sx2 + sw2, 0);
          shim.addColorStop(0, 'rgba(255,255,255,0)');
          shim.addColorStop(0.38, 'rgba(255,230,220,0.07)');
          shim.addColorStop(0.5, 'rgba(255,255,255,0.14)');
          shim.addColorStop(0.62, 'rgba(255,230,220,0.07)');
          shim.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = shim;
          c.fillRect(sx2 - sw2, fy, sw2 * 2, displayH);
          c.restore();
        }
      }
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       SPARKLES
       ═══════════════════════════════════════════════════════════ */
    function sRevealSparkles(t: number) {
      if (t < 2.0 || t > 7.0) return; // Sync with 5-second reveal duration
      const d = getImgDims(); if (!d) return;
      const raw = Math.min((t - 2.0) / 5.0, 1);
      const revealProg = eIO(raw);
      const sc = Math.min(W, H);
      const fw = sc * 0.30;
      const fh = fw * 1.35;
      const maxRevealR = Math.max(fw, fh) * 0.85;
      const currentR = maxRevealR * revealProg;

      const spawnRate = Math.max(0, 1 - raw * 2) * 5 + 1;
      for (let i = 0; i < spawnRate; i++) {
        const p = grab(pl); if (!p) break;
        const ang = Math.random() * Math.PI * 2;
        p.x = d.cx + Math.cos(ang) * currentR;
        p.y = d.cy + Math.sin(ang) * currentR;
        const spd = 1.5 + Math.random() * 3;
        p.vx = Math.cos(ang) * spd;
        p.vy = Math.sin(ang) * spd;
        p.sz = Math.random() * 2.5 + 0.5;
        p.ml = 0.4 + Math.random() * 0.5;
        p.life = p.ml;
        p.r = 255; p.g = 180 + Math.random() * 75 | 0; p.b = 80 + Math.random() * 60 | 0;
        p.a = 0.7 + Math.random() * 0.3;
        p.rot = Math.random() * Math.PI * 2; p.rs = (Math.random() - .5) * 4;
        p.on = true; p.tp = 9;
      }
    }
    function dRevealSparkles() {
      for (const p of pl) {
        if (!p.on || p.tp !== 9) continue;
        const lr = p.life / p.ml; const a = p.a * lr;
        const sz = p.sz * (0.5 + lr * 0.5);
        if (sz > 0.8) {
          const gr = sz * 5;
          const gg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, gr));
          gg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a * 0.25})`);
          gg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          c.fillStyle = gg;
          c.fillRect(p.x - gr, p.y - gr, gr * 2, gr * 2);
        }
        c.save();
        c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = a;
        c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        c.beginPath();
        c.moveTo(0, -sz * 2.2); c.lineTo(sz * 0.25, -sz * 0.25);
        c.lineTo(sz * 2.2, 0); c.lineTo(sz * 0.25, sz * 0.25);
        c.lineTo(0, sz * 2.2); c.lineTo(-sz * 0.25, sz * 0.25);
        c.lineTo(-sz * 2.2, 0); c.lineTo(-sz * 0.25, -sz * 0.25);
        c.closePath(); c.fill();
        c.restore();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       FLARE
       ═══════════════════════════════════════════════════════════ */
    function dFlare(t: number) {
      if (t < 2.0 || t > 8.0) return; // Active during reveal
      let fi: number;
      if (t < 3.2) fi = (t - 2.0) / 1.2;
      else if (t > 7.0) fi = 1 - (t - 7.0) / 1.0;
      else fi = 1;
      fi = Math.max(0, Math.min(1, fi));
      if (fi <= 0) return;
      const cx = W / 2, cy = H / 2 - H * 0.01;
      const flareW = W * 0.85;
      const flareH = 2.5 + Math.sin(t * 4.5) * 1.2;
      c.save(); c.globalAlpha = fi * 0.07;
      c.globalCompositeOperation = 'lighter';
      const fg = c.createLinearGradient(cx - flareW / 2, 0, cx + flareW / 2, 0);
      fg.addColorStop(0, 'rgba(255,180,80,0)');
      fg.addColorStop(0.2, 'rgba(255,180,80,0.1)');
      fg.addColorStop(0.45, 'rgba(255,220,150,0.35)');
      fg.addColorStop(0.5, 'rgba(255,240,200,0.55)');
      fg.addColorStop(0.55, 'rgba(255,220,150,0.35)');
      fg.addColorStop(0.8, 'rgba(255,180,80,0.1)');
      fg.addColorStop(1, 'rgba(255,180,80,0)');
      c.fillStyle = fg; c.fillRect(cx - flareW / 2, cy - flareH, flareW, flareH * 2);
      const coreW = flareW * 0.2;
      const cg = c.createLinearGradient(cx - coreW / 2, 0, cx + coreW / 2, 0);
      cg.addColorStop(0, 'rgba(255,240,200,0)');
      cg.addColorStop(0.5, 'rgba(255,250,230,0.3)');
      cg.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = cg; c.fillRect(cx - coreW / 2, cy - flareH * 0.4, coreW, flareH * 0.8);
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       BLOOM
       ═══════════════════════════════════════════════════════════ */
    function dBloom(t: number) {
      const bs = 8.0; const bt = Math.min((t - bs) / 2.0, 1); if (bt <= 0) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015; const maxR = sc * .88;
      const r = maxR * eOQ(bt); const ra = (1 - bt) * .4;
      c.save(); c.beginPath(); c.arc(cx, cy, Math.max(EP, r), 0, Math.PI * 2);
      c.strokeStyle = `rgba(220,60,60,${ra})`; c.lineWidth = 3.5 * (1 - bt); c.stroke(); c.restore();
      const ba = (1 - bt * .65) * .14;
      const bg = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, r));
      bg.addColorStop(0, `rgba(255,140,60,${ba})`);
      bg.addColorStop(.5, `rgba(220,40,60,${ba * .4})`);
      bg.addColorStop(1, 'rgba(100,20,40,0)');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      if (bt < .45 && Math.random() < .6) {
        const p = grab(pl); if (p) {
          const ang = Math.random() * Math.PI * 2; const spd = 2.2 + Math.random() * 4.8;
          p.x = cx; p.y = cy; p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd;
          p.sz = Math.random() * 3 + .8; p.ml = 1.3 + Math.random(); p.life = p.ml;
          p.r = 255; p.g = 180 + Math.random() * 60 | 0; p.b = 60 + Math.random() * 60 | 0;
          p.a = .6; p.rot = 0; p.rs = 0; p.on = true; p.tp = 3;
        }
      }
    }
    function dBloomP() {
      for (const p of pl) {
        if (!p.on || p.tp !== 3) continue;
        const lr = p.life / p.ml; const a = p.a * lr;
        c.beginPath(); c.arc(p.x, p.y, Math.max(EP, p.sz * (1 + (1 - lr) * .4)), 0, Math.PI * 2);
        c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`; c.fill();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       GENDA & ROSE PETALS
       ═══════════════════════════════════════════════════════════ */
    function sPetals(t: number) {
      if (t < 5.0 || Math.random() > .5) return; // Active during reveal
      const p = grab(pl); if (!p) return;
      p.x = Math.random() * W; p.y = -24 - Math.random() * 60;
      p.vx = (Math.random() - .5) * 3.0;
      p.vy = 1.0 + Math.random() * 1.8;
      p.sz = 4 + Math.random() * 7; p.ml = 7 + Math.random() * 3; p.life = p.ml;
      const ct = Math.random();
      if (ct < .4) { p.r = 255; p.g = 180; p.b = 0; }
      else if (ct < .75) { p.r = 244; p.g = 63; p.b = 94; }
      else if (ct < .9) { p.r = 220; p.g = 38; p.b = 38; }
      else { p.r = 251; p.g = 191; p.b = 36; }
      p.a = .45 + Math.random() * .3;
      p.rot = Math.random() * Math.PI * 2;
      p.rs = (Math.random() - .5) * .08; p.on = true; p.tp = 4;
    }
    function dPetals() {
      for (const p of pl) {
        if (!p.on || p.tp !== 4) continue;
        const lr = p.life / p.ml; const a = p.a * Math.min(lr * 2, 1) * (lr > .82 ? (1 - lr) / .18 : 1);
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        const grad = c.createLinearGradient(0, -p.sz, 0, p.sz);
        grad.addColorStop(0, `rgb(${p.r},${p.g},${p.b})`);
        grad.addColorStop(1, `rgb(${Math.max(0, p.r - 45)},${Math.max(0, p.g - 35)},${Math.max(0, p.b - 20)})`);
        c.fillStyle = grad;
        c.beginPath(); c.ellipse(0, 0, Math.max(EP, p.sz * .45), Math.max(EP, p.sz), 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(-p.sz * .05, -p.sz * .2, Math.max(EP, p.sz * .1), Math.max(EP, p.sz * .35), 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,255,0.2)'; c.fill();
        c.restore();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       KUMKUM
       ═══════════════════════════════════════════════════════════ */
    function sKum(t: number) {
      if (t < 5.0 || Math.random() > .45) return;
      const p = grab(pl); if (!p) return;
      p.x = Math.random() * W; p.y = -12 - Math.random() * 35;
      p.vx = (Math.random() - .5) * .8; p.vy = .5 + Math.random() * 1.5;
      p.sz = .8 + Math.random() * 2; p.ml = 5.5 + Math.random() * 3; p.life = p.ml;
      if (Math.random() < .6) {
        p.r = 180 + Math.random() * 55 | 0;
        p.g = 10 + Math.random() * 20 | 0;
        p.b = 10 + Math.random() * 20 | 0;
      } else { p.r = 251; p.g = 191; p.b = 36; }
      p.a = .4 + Math.random() * .38;
      p.rot = Math.random() * Math.PI * 2;
      p.rs = (Math.random() - .5) * .07; p.on = true; p.tp = 8;
    }
    function dKum() {
      for (const p of pl) {
        if (!p.on || p.tp !== 8) continue;
        const lr = p.life / p.ml; const a = p.a * Math.min(lr * 2, 1) * (lr > .84 ? (1 - lr) / .16 : 1);
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        c.fillRect(-p.sz * .5, -p.sz * .2, p.sz, p.sz * .4); c.restore();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       RAYS
       ═══════════════════════════════════════════════════════════ */
    function dRays(t: number) {
      if (t < 7.0) return;
      const rt = Math.min((t - 7.0) / 2, 1); const al = eOC(rt) * .08;
      const cx = W / 2, cy = H / 2 - H * .015; const rl = Math.max(W, H) * .85;
      c.save(); c.globalAlpha = al;
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + t * .035; const hw = (Math.PI / 16) * .36;
        c.beginPath(); c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(ang - hw) * rl, cy + Math.sin(ang - hw) * rl);
        c.lineTo(cx + Math.cos(ang + hw) * rl, cy + Math.sin(ang + hw) * rl);
        c.closePath();
        const rg = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, rl));
        rg.addColorStop(0, 'rgba(255,180,60,0.6)');
        rg.addColorStop(.5, 'rgba(220,50,50,0.15)');
        rg.addColorStop(1, 'rgba(80,10,30,0)');
        c.fillStyle = rg; c.fill();
      }
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       RANGOLI GLOW
       ═══════════════════════════════════════════════════════════ */
    function dRangoli(t: number) {
      if (t < 5.0 || t > 11.5) return;
      let ra = Math.min((t - 5.0) / 1.0, 1);
      if (t > 10.0) ra = 1 - Math.min((t - 10.0) / 1.5, 1);
      if (ra <= 0) return;

      const cx = W / 2, cy = H * 0.9;
      const maxR = Math.min(W, H) * 0.18;

      c.save();
      c.globalAlpha = ra * 0.2;
      c.globalCompositeOperation = 'lighter';

      for (let i = 0; i < 3; i++) {
        const ringR = maxR * (0.4 + i * 0.3);
        const rotAng = t * (0.3 - i * 0.12);
        c.save();
        c.translate(cx, cy);
        c.rotate(rotAng);
        c.beginPath();
        c.arc(0, 0, Math.max(EP, ringR), 0, Math.PI * 2);
        c.strokeStyle = `rgba(255,180,60,${ra * 0.3})`;
        c.lineWidth = 1.5;
        c.stroke();

        const count = 6 + i * 2;
        for (let j = 0; j < count; j++) {
          const a = (j / count) * Math.PI * 2 + rotAng;
          const px = Math.cos(a) * ringR;
          const py = Math.sin(a) * ringR;
          c.beginPath();
          c.arc(px, py, Math.max(EP, 3), 0, Math.PI * 2);
          c.fillStyle = `rgba(255,140,50,${ra * 0.5})`;
          c.fill();
        }
        c.restore();
      }

      const bindiR = maxR * 0.08;
      const bindiGlow = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, bindiR * 3));
      bindiGlow.addColorStop(0, `rgba(255,200,50,${ra * 0.6})`);
      bindiGlow.addColorStop(0.5, `rgba(255,140,30,${ra * 0.2})`);
      bindiGlow.addColorStop(1, 'rgba(255,100,20,0)');
      c.fillStyle = bindiGlow;
      c.fillRect(cx - bindiR * 3, cy - bindiR * 3, bindiR * 6, bindiR * 6);

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       DISSOLVE
       ═══════════════════════════════════════════════════════════ */
    function dDissolve(t: number) {
      const ps = 10.0; // Dissolve near handover phase
      const dt = Math.min((t - ps) / 1.5, 1); if (dt <= 0) return;
      const la = eOC(dt) * .12;
      const lg = c.createRadialGradient(W / 2, H / 2 - H * .015, 0, W / 2, H / 2 - H * .015, Math.max(EP, Math.min(W, H) * .56 * .3));
      lg.addColorStop(0, `rgba(255,180,100,${la})`);
      lg.addColorStop(.5, `rgba(220,50,50,${la * .4})`);
      lg.addColorStop(1, 'rgba(5,1,8,0)');
      c.fillStyle = lg; c.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       TEXT
       ═══════════════════════════════════════════════════════════ */
    function dText(t: number) {
      const ps = 11.5; // Synced with HANDOVER phase
      if (t < ps) return;
      c.save();
      c.textAlign = 'center'; c.textBaseline = 'middle';

      const tProg = Math.min((t - ps) / 0.8, 1);
      const tFi = Math.min(1, eSpring(tProg));
      const tSlide = (1 - eOC(tProg)) * 14;

      if (tFi > 0.01) {
        const ts = Math.min(W * .06, H * .065, 52);
        const scale = 0.95 + tFi * 0.05;
        const title = 'Happy Navratri';
        const ty = H * .35 + tSlide;

        c.globalAlpha = tFi;
        c.save();
        c.translate(W / 2, ty);
        c.scale(scale, scale);
        c.translate(-W / 2, -ty);

        c.font = `700 ${ts}px 'Georgia','Times New Roman',serif`;
        const tw = c.measureText(title).width;

        c.fillStyle = 'rgba(0,0,0,0.72)';
        c.fillText(title, W / 2 + 2, ty + 3);

        const mg = c.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
        mg.addColorStop(0, '#6b1530');
        mg.addColorStop(0.15, '#c44020');
        mg.addColorStop(0.32, '#dc2626');
        mg.addColorStop(0.48, '#f43f5e');
        mg.addColorStop(0.52, '#fda4af');
        mg.addColorStop(0.68, '#f43f5e');
        mg.addColorStop(0.84, '#dc2626');
        mg.addColorStop(1, '#6b1530');
        c.fillStyle = mg;
        c.fillText(title, W / 2, ty);

        c.restore();

        if (t > 12.5) {
          const shProg = Math.min((t - 12.5) / 1.0, 1);
          const shX = (W / 2 - tw / 2) + shProg * tw * 1.4 - tw * 0.2;
          c.save();
          c.beginPath(); c.rect(W / 2 - tw / 2, ty - ts, tw, ts * 2); c.clip();
          const shW = tw * 0.1;
          const sg = c.createLinearGradient(shX - shW, 0, shX + shW, 0);
          sg.addColorStop(0, 'rgba(255,255,230,0)');
          sg.addColorStop(0.5, `rgba(255,220,220,${0.18 * (1 - shProg)})`);
          sg.addColorStop(1, 'rgba(255,255,230,0)');
          c.fillStyle = sg;
          c.fillRect(shX - shW, ty - ts, shW * 2, ts * 2);
          c.restore();
        }
      }

      // Subtitle
      const mStart = 12.2;
      if (t > mStart) {
        const mProg = Math.min((t - mStart) / 0.6, 1);
        const mFi = Math.min(1, eOC(mProg));
        const mSlide = (1 - eOC(mProg)) * 10;

        const ss = Math.min(W * .022, H * .026, 18);
        const subtitle = 'जय माँ दुर्गा  •  शुभ नवरात्रि';
        const my = H * .35 + tSlide + Math.min(W * .06, H * .065, 52) * 0.85 + mSlide;

        c.globalAlpha = mFi;
        c.font = `400 ${ss}px 'Georgia','Times New Roman',serif`;

        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillText(subtitle, W / 2 + 1, my + 2);

        const smg = c.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0);
        smg.addColorStop(0, 'rgba(180,120,80,0.6)');
        smg.addColorStop(0.5, 'rgba(255,200,150,0.85)');
        smg.addColorStop(1, 'rgba(180,120,80,0.6)');
        c.fillStyle = smg;
        c.fillText(subtitle, W / 2, my);
      }

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       GRAIN OVERLAY
       ═══════════════════════════════════════════════════════════ */
    function dGrain() {
      c.save();
      c.globalAlpha = 0.035;
      c.globalCompositeOperation = 'overlay';
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) {
        c.fillStyle = pat;
        c.fillRect(0, 0, W, H);
      }
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       PARTICLE UPDATE
       ═══════════════════════════════════════════════════════════ */
    function updateParticles(dt: number, t: number) {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i];
        if (!p.on || p.tp === 0) continue;
        p.life -= dt;
        if (p.life <= 0) { p.on = false; continue; }

        if (p.tp === 4 || p.tp === 8) {
          const cx = W / 2;
          const dx = p.x - cx;
          p.vx += dx * 0.0003 * Math.sin(t * 0.8);
          p.vy += 0.02;
          p.vx *= 0.995;
          p.vy *= 0.998;
        }

        if (p.tp === 5) {
          const cx = W / 2, cy = H / 2 - H * .015;
          const dx = p.x - cx, dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const sc = Math.min(W, H) * .56;
          const target = sc * .4;
          const force = (dist - target) * 0.003;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
          p.vx *= 0.99;
          p.vy *= 0.99;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rs;

        if (p.tp === 6) {
          p.vx += (Math.random() - .5) * .02;
          p.vy -= 0.005;
          p.sz += 0.15;
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════
       ANIMATION LOOP
       ═══════════════════════════════════════════════════════════ */
    let prevTime = 0;
    function loop(now: number) {
      if (!t0.current) { t0.current = now; prevTime = now; }
      const t = (now - t0.current) / 1000;
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      if (t >= DUR) {
        if (!done.current) { done.current = true; cbR.current?.(); }
        return;
      }

      // Spawn
      sSmoke(t);
      sOrbit(t);
      sPetals(t);
      sKum(t);
      sRevealSparkles(t);

      // Update
      updateParticles(dt, t);

      // Draw
      dBg(t);
      dTemples(t);
      dEnergy(t);
      dRangoli(t);
      dSmoke();
      dDust(t);
      dOrbit();
      dDurga(t);
      dRevealSparkles();
      dFlare(t);
      dDiyas(t);
      dAarti(t);
      dBells(t);
      dBloom(t);
      dBloomP();
      dPetals();
      dKum();
      dRays(t);
      dDissolve(t);
      dText(t);
      dVignette(t);
      dGrain();

      raf.current = requestAnimationFrame(loop);
    }

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) { /* ignore */ }
        audioCtxRef.current = null;
      }
    };
  }, [imgReady, mkPool, grab, triggerBellSound]);

  return (
    <canvas
      ref={cvRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        zIndex: 50,
      }}
    />
  );
}
