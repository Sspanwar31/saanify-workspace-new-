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
const DUR = 5.5; // 🚀 TIMELINE SYNCHRONIZATION: Updated to 5.5 seconds (1.5s + 3.0s + 1.0s)
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
   MAIN COMPONENT: NationalCinematicIntro
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void; imageUrl?: string }

export default function NationalCinematicIntro({ onComplete, imageUrl }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nationalImgRef = useRef<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = useState(false);

  const raf = useRef(0);
  const t0 = useRef(0);
  const done = useRef(false);
  const cbR = useRef(onComplete);
  cbR.current = onComplete;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { nationalImgRef.current = img; setImgReady(true); };
    img.onerror = () => { setImgReady(true); };
    img.src = imageUrl || DEFAULT_IMG_URL;
    return () => { img.onload = null; img.onerror = null; };
  }, [imageUrl]);

  const mkPool = useCallback(() => {
    const a: P[] = [];
    for (let i = 0; i < POOL; i++)
      a.push({ x: 0, y: 0, vx: 0, vy: 0, sz: 0, life: 0, ml: 1, r: 255, g: 153, b: 51, a: 0, rot: 0, rs: 0, on: false, tp: 0 });
    return a;
  }, []);

  const grab = useCallback((p: P[]) => {
    for (let i = 0; i < p.length; i++) if (!p[i].on) return p[i];
    return null;
  }, []);

  const triggerBrassSound = useCallback((frequency: number) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const duration = 3.5;
      const mainGain = ctx.createGain();
      mainGain.connect(ctx.destination);
      mainGain.gain.setValueAtTime(0, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.01);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      [1.0, 1.33, 1.5, 2.0].forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const gNode = ctx.createGain();
        osc.frequency.value = frequency * ratio;
        osc.type = 'sawtooth'; 
        gNode.gain.setValueAtTime(0.35 / (i + 1), ctx.currentTime);
        gNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / (i + 1.2));
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        osc.connect(filter); filter.connect(gNode); gNode.connect(mainGain);
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

    /* ─── Film Grain Texture ─── */
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
      p.r = 255; p.g = 153; p.b = 51; 
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
      const img = nationalImgRef.current;
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
      c.fillStyle = '#03030c'; c.fillRect(0, 0, W, H);

      const aa = t < 1.5 ? eOC(Math.min(t / 1.2, 1)) * .7 : .7;
      let g = c.createRadialGradient(W * .5, H * .18, 0, W * .5, H * .18, H * .85);
      g.addColorStop(0, `rgba(255,153,51,${aa * .22})`); 
      g.addColorStop(.4, `rgba(255,255,255,${aa * .08})`); 
      g.addColorStop(.7, `rgba(18,136,7,${aa * .1})`); 
      g.addColorStop(1, 'rgba(3,3,12,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);

      g = c.createRadialGradient(W * .5, H * .92, 0, W * .5, H * .92, H * .45);
      g.addColorStop(0, `rgba(18,136,7,${aa * .22})`);
      g.addColorStop(1, 'rgba(3,3,12,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);

      let ca = 0;
      if (t > 1.5) ca = Math.min((t - 1.5) / 3.0, 1) * .15; 
      if (t > 4.5) ca = .15 * (1 - Math.min((t - 4.5) / 1.0, 1)); 

      g = c.createRadialGradient(W * .5, H * .42, 0, W * .5, H * .42, H * .5);
      g.addColorStop(0, `rgba(255,153,51,${ca * 0.95})`);
      g.addColorStop(.3, `rgba(255,255,255,${ca * .3})`);
      g.addColorStop(.6, `rgba(18,136,7,${ca * .4})`);
      g.addColorStop(1, 'rgba(3,3,12,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       VIGNETTE
       ═══════════════════════════════════════════════════════════ */
    function dVignette(t: number) {
      const breathe = 0.58 + Math.sin(t * 1.2) * 0.04;
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.24, W / 2, H / 2, Math.max(EP, Math.max(W, H) * 0.82));
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(3,3,12,${breathe})`);
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       ✈️ FIGHTER JETS
       ═══════════════════════════════════════════════════════════ */
    function dFighterJetsAndTrails(t: number) {
      if (t < 1.5 || t > 4.5) return; // 🚀 Sync with 3.0s reveal duration

      const prog = Math.min((t - 1.5) / 3.0, 1); 
      const cx = W / 2, cy = H / 2;

      c.save();
      c.globalCompositeOperation = 'lighter';

      const startX = -150, startY = H * 0.65;
      const endX = W + 150, endY = H * 0.15;

      const colors = ['#ff9933', '#ffffff', '#128807'];

      for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * Math.min(W, H) * 0.1; 
        const jProg = eOC(prog); 
        const jx = startX + (endX - startX) * jProg;
        const jy = startY + (endY - startY) * jProg + offset;

        const smokeW = 10 + jProg * 45;
        const sg = c.createLinearGradient(startX, startY + offset, jx, jy);
        sg.addColorStop(0, 'rgba(0,0,0,0)');
        sg.addColorStop(0.3, `${colors[i]}15`);
        sg.addColorStop(0.8, `${colors[i]}50`);
        sg.addColorStop(1, colors[i]);

        c.strokeStyle = sg;
        c.lineWidth = smokeW;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(startX, startY + offset);
        c.lineTo(jx, jy);
        c.stroke();

        if (prog < 1.0) {
          c.save();
          c.translate(jx, jy);
          c.rotate(Math.atan2(endY - startY, endX - startX));
          c.fillStyle = '#ffffff';
          c.shadowColor = colors[i];
          c.shadowBlur = 15;
          c.beginPath();
          c.moveTo(12, 0);
          c.lineTo(-12, -7);
          c.lineTo(-6, 0);
          c.lineTo(-12, 7);
          c.closePath();
          c.fill();
          c.restore();
        }
      }

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       MONUMENTS
       ═══════════════════════════════════════════════════════════ */
    function dMonuments(t: number) {
      if (t > 4.5) { if (Math.max(0, 1 - (t - 4.5) / 1.0) <= 0) return; }
      const fa = t < 1.5 ? eOC(Math.min(t / 1.2, 1)) * .18 : .18;
      const al = t > 4.5 ? Math.max(0, .18 - (t - 4.5) * .18) : fa;

      const cx = W / 2, cy = H * 0.86;
      const iw = Math.min(W, H) * 0.22;

      c.save();
      c.globalAlpha = al;
      c.fillStyle = '#060613';
      c.strokeStyle = 'rgba(255,255,255,0.06)';
      c.lineWidth = 1;

      c.beginPath();
      c.moveTo(cx - iw * 0.6, cy);
      c.lineTo(cx - iw * 0.6, cy - iw * 0.75);
      c.lineTo(cx - iw * 0.5, cy - iw * 0.75);
      c.lineTo(cx - iw * 0.5, cy - iw * 0.8);
      c.lineTo(cx - iw * 0.28, cy - iw * 0.8);
      c.lineTo(cx - iw * 0.28, cy - iw * 0.94);
      c.lineTo(cx + iw * 0.28, cy - iw * 0.94);
      c.lineTo(cx + iw * 0.28, cy - iw * 0.8);
      c.lineTo(cx + iw * 0.5, cy - iw * 0.8);
      c.lineTo(cx + iw * 0.5, cy - iw * 0.75);
      c.lineTo(cx + iw * 0.6, cy);
      c.closePath();
      c.fill(); c.stroke();

      c.beginPath();
      c.moveTo(cx - iw * 0.2, cy);
      c.lineTo(cx - iw * 0.2, cy - iw * 0.45);
      c.arcTo(cx, cy - iw * 0.62, cx + iw * 0.2, cy - iw * 0.45, iw * 0.2);
      c.lineTo(cx + iw * 0.2, cy);
      c.closePath();
      c.fillStyle = '#03030c'; c.fill(); c.stroke();

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       DUST
       ═══════════════════════════════════════════════════════════ */
    function dDustLayer(t: number) {
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
       🚀 sSmoke particle spawner function (Fixed)
       ═══════════════════════════════════════════════════════════ */
    function sSmoke(t: number) {
      if (Math.random() > (t < 1.5 ? 0.45 : 0.12)) return;
      const p = grab(pl); if (!p) return;
      p.x = W * .45 + (Math.random() - 0.5) * 120;
      p.y = H * 0.85;
      p.sz = Math.random() * 45 + 15;
      p.a = .04 + Math.random() * .03;
      p.ml = 4 + Math.random() * 2;
      p.vx = (Math.random() - .5) * .3; p.vy = -Math.random() * .7 - .4;
      p.life = p.ml;
      p.r = 239; p.g = 68; p.b = 68; 
      p.rot = 0; p.rs = 0; p.on = true; p.tp = 6;
    }

    /* ═══════════════════════════════════════════════════════════
       🚀 sOrbit particle spawner function (Fixed)
       ═══════════════════════════════════════════════════════════ */
    function sOrbit(t: number) {
      if (t < 1.5 || t > 4.5 || Math.random() > .2) return; 
      const p = grab(pl); if (!p) return;
      const sc = Math.min(W, H) * .56; const cx = W / 2, cy = H / 2 - H * .015;
      const ang = Math.random() * Math.PI * 2; const rad = sc * .38 + Math.random() * sc * .1;
      p.x = cx + Math.cos(ang) * rad; p.y = cy + Math.sin(ang) * rad;
      p.vx = Math.cos(ang + Math.PI / 2) * .7; p.vy = Math.sin(ang + Math.PI / 2) * .7;
      p.sz = Math.random() * 1.6 + .4; p.ml = 2.5 + Math.random() * 2; p.life = p.ml;
      p.r = 255; p.g = 153; p.b = 51;
      p.a = .4 + Math.random() * .3; p.rot = 0; p.rs = 0; p.on = true; p.tp = 5;
    }

    /* ═══════════════════════════════════════════════════════════
       AMAR JAWAN JYOTI
       ═══════════════════════════════════════════════════════════ */
    function dAmarJawanJyoti(t: number) {
      if (t >= 1.5) return; // Active only during loading 1.5s FLASH phase

      const cx = W / 2, cy = H * 0.84;
      const s = Math.min(W, H) * 0.05;

      c.save();
      c.fillStyle = '#11121d';
      c.strokeStyle = '#27293a';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(cx - s * 0.8, cy + 10);
      c.lineTo(cx + s * 0.8, cy + 10);
      c.lineTo(cx + s * 0.55, cy + 30);
      c.lineTo(cx - s * 0.55, cy + 30);
      c.closePath();
      c.fill(); c.stroke();

      c.beginPath();
      c.rect(-s * 0.02, -s * 0.04, s * 0.04, s * 0.08);
      c.fillStyle = '#fde68a';
      c.fill();

      const flicker = Math.sin(t * 14) * 0.12;
      const baseH = s * 1.1 * (1 + flicker);
      c.globalCompositeOperation = 'lighter';

      const glowR = s * 1.8;
      const glow = c.createRadialGradient(0, -baseH * 0.3, 0, 0, -baseH * 0.3, Math.max(EP, glowR));
      glow.addColorStop(0, 'rgba(255,153,51,0.22)');
      glow.addColorStop(1, 'rgba(255,80,20,0)');
      c.fillStyle = glow;
      c.fillRect(-glowR, -baseH * 0.3 - glowR, glowR * 2, glowR * 2);

      c.beginPath();
      c.moveTo(-s * 0.12, 0);
      c.bezierCurveTo(-s * 0.1, -baseH * 0.4, -s * 0.03 + Math.sin(t * 8) * s * 0.05, -baseH * 0.85, 0, -baseH);
      c.bezierCurveTo(s * 0.03 + Math.sin(t * 8) * s * 0.05, -baseH * 0.85, s * 0.1, -baseH * 0.4, s * 0.12, 0);
      c.closePath();
      c.fillStyle = 'rgba(255,153,51,0.85)';
      c.fill();

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       MAI PICTURE - TALL TEMPLE ARCH REVEAL
       ═══════════════════════════════════════════════════════════ */
    function dNationalImage(t: number) {
      if (t < 1.5) return; // 🌟 FIXED: Absolute safety. Prevents premature flashing before 1.5s
      const img = nationalImgRef.current;
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

      // 🌟 DYNAMIC SYNCHRONIZED TIMING (For 5.5s total timeline)
      if (t >= 1.5 && t < 4.5) {
        const raw = Math.min((t - 1.5) / 3.0, 1); // 3.0 seconds REVEAL
        frameAlpha = Math.min(raw * 5, 1);
        revealProg = eIO(raw);
        flashI = Math.max(0, 1 - raw * 2.5) * 1.0;
      } else if (t >= 4.5 && t < 4.9) {
        frameAlpha = 1;
        revealProg = 1;
        flashI = 0;
        breathScale = Math.sin(t * 2.5) * 0.004;
      } else if (t >= 4.9) {
        const d = Math.min((t - 4.9) / 0.6, 1); // smooth fade out
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
        fg.addColorStop(0, `rgba(255,255,255,${flashI * 0.7})`);
        fg.addColorStop(0.2, `rgba(255,200,80,${flashI * 0.45})`);
        fg.addColorStop(0.5, `rgba(255,100,50,${flashI * 0.18})`);
        fg.addColorStop(1, 'rgba(3,3,12,0)');
        c.fillStyle = fg;
        c.fillRect(fx - displayW * 0.3, fy - displayH * 0.2, displayW * 1.6, displayH * 1.4);
      }

      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      c.shadowColor = 'rgba(255,153,51,0.45)'; 
      c.shadowBlur = 40;
      c.shadowOffsetY = 4;
      drawArchPath(c, fx, fy, displayW, displayH, br);
      c.fillStyle = '#060613';
      c.fill();
      c.restore();

      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      drawArchPath(c, fx, fy, displayW, displayH, br);
      c.clip();

      const ig = c.createRadialGradient(cx, cy - displayH * 0.08, 0, cx, cy, Math.max(EP, displayW * 0.72));
      ig.addColorStop(0, 'rgba(255,180,100,0.12)');
      ig.addColorStop(0.5, 'rgba(255,255,255,0.03)');
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
        eg.addColorStop(0, 'rgba(255,255,255,0)');
        eg.addColorStop(0.3, `rgba(255,180,80,${flashI * 0.35})`);
        eg.addColorStop(0.48, `rgba(255,240,150,${flashI * 0.80})`);
        eg.addColorStop(0.52, `rgba(255,255,240,${flashI * 1.0})`);
        eg.addColorStop(0.7, `rgba(255,180,80,${flashI * 0.35})`);
        eg.addColorStop(1, 'rgba(18,136,7,0)');
        c.fillStyle = eg;
        c.fillRect(fx, fy, displayW, displayH);
      }

      const tf = c.createLinearGradient(0, fy, 0, fy + displayH * 0.1);
      tf.addColorStop(0, 'rgba(6,6,19,0.55)');
      tf.addColorStop(1, 'rgba(6,6,19,0)');
      c.fillStyle = tf;
      c.fillRect(fx, fy, displayW, displayH * 0.1);

      const bf = c.createLinearGradient(0, fy + displayH, 0, fy + displayH * 0.9);
      bf.addColorStop(0, 'rgba(6,6,19,0.48)');
      bf.addColorStop(1, 'rgba(6,6,19,0)');
      c.fillStyle = bf;
      c.fillRect(fx, fy + displayH * 0.9, displayW, displayH * 0.1);

      const iv = c.createRadialGradient(cx, cy, Math.max(EP, displayW * 0.22), cx, cy, Math.max(EP, displayW * 0.54));
      iv.addColorStop(0, 'rgba(0,0,0,0)');
      iv.addColorStop(1, 'rgba(0,0,0,0.18)');
      c.fillStyle = iv;
      c.fillRect(fx, fy, displayW, displayH);
      c.restore();

      c.save();
      c.globalAlpha = frameAlpha * fadeAlpha;
      const og = c.createLinearGradient(fx, fy - displayW * 0.05, fx, fy + displayH);
      og.addColorStop(0, '#f5e6a3');
      og.addColorStop(0.2, '#ffd700');
      og.addColorStop(0.5, '#d4a030');
      og.addColorStop(0.8, '#b8860b');
      og.addColorStop(1, '#6b4500');
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
      c.fillStyle = '#0f2c59'; 
      c.shadowColor = 'rgba(15,44,89,0.7)';
      c.shadowBlur = 10;
      
      c.translate(cx, fy - fss * 1.5);
      c.rotate(t * 1.2);
      c.beginPath();
      c.arc(0, 0, Math.max(EP, fss), 0, Math.PI * 2);
      c.lineWidth = 2;
      c.strokeStyle = '#0f2c59';
      c.stroke();
      c.beginPath();
      c.arc(0, 0, Math.max(EP, fss * 0.2), 0, Math.PI * 2);
      c.fill();
      for (let j = 0; j < 24; j++) {
        const ang = (j / 24) * Math.PI * 2;
        const jx = Math.cos(ang) * fss;
        const jy = Math.sin(ang) * fss;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(jx, jy);
        c.lineWidth = 0.8;
        c.stroke();
      }
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
          shim.addColorStop(0.38, 'rgba(255,255,220,0.07)');
          shim.addColorStop(0.5, 'rgba(255,255,255,0.14)');
          shim.addColorStop(0.62, 'rgba(255,255,220,0.07)');
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
      if (t < 2.0 || t > 7.0) return;
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
        p.r = 255; p.g = 215 + Math.random() * 40 | 0; p.b = 50 + Math.random() * 50 | 0;
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
      if (t < 2.0 || t > 8.0) return; 
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
      c.strokeStyle = `rgba(255,153,51,${ra})`; c.lineWidth = 3.5 * (1 - bt); c.stroke(); c.restore();
      const ba = (1 - bt * .65) * .14;
      const bg = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, r));
      bg.addColorStop(0, `rgba(255,153,51,${ba})`);
      bg.addColorStop(.5, `rgba(255,255,255,${ba * .4})`);
      bg.addColorStop(1, 'rgba(18,136,7,0)');
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
       TRICOLOR PATRIOTIC CONFETTI
       ═══════════════════════════════════════════════════════════ */
    function sConfetti(t: number) {
      if (t < 5.0 || Math.random() > .55) return; 
      const p = grab(pl); if (!p) return;
      p.x = Math.random() * W; p.y = -24 - Math.random() * 60;
      p.vx = (Math.random() - .5) * 2.8;
      p.vy = 1.2 + Math.random() * 2.2;
      p.sz = 5 + Math.random() * 7; p.ml = 7 + Math.random() * 3; p.life = p.ml;
      const ct = Math.random();
      if (ct < .35) { p.r = 255; p.g = 153; p.b = 51; } 
      else if (ct < .7) { p.r = 255; p.g = 255; p.b = 255; } 
      else { p.r = 18; p.g = 136; p.b = 7; } 
      p.a = .55 + Math.random() * .35;
      p.rot = Math.random() * Math.PI * 2;
      p.rs = (Math.random() - .5) * .12; p.on = true; p.tp = 7; 
    }
    function dConfetti() {
      for (const p of pl) {
        if (!p.on || p.tp !== 7) continue;
        const lr = p.life / p.ml; const a = p.a * Math.min(lr * 2, 1) * (lr > .82 ? (1 - lr) / .18 : 1);
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        c.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz * 0.5);
        c.restore();
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
        rg.addColorStop(0, 'rgba(255,255,255,0.4)');
        rg.addColorStop(.5, 'rgba(255,153,51,0.15)');
        rg.addColorStop(1, 'rgba(18,136,7,0)');
        c.fillStyle = rg; c.fill();
      }
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       DISSOLVE
       ═══════════════════════════════════════════════════════════ */
    function dDissolve(t: number) {
      const ps = 10.0; 
      const dt = Math.min((t - ps) / 1.5, 1); if (dt <= 0) return;
      const la = eOC(dt) * .12;
      const lg = c.createRadialGradient(W / 2, H / 2 - H * .015, 0, W / 2, H / 2 - H * .015, Math.max(EP, Math.min(W, H) * .56 * .3));
      lg.addColorStop(0, `rgba(255,153,51,${la})`);
      lg.addColorStop(.5, `rgba(255,255,255,${la * .4})`);
      lg.addColorStop(1, 'rgba(18,136,7,0)');
      c.fillStyle = lg; c.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       TEXT
       ═══════════════════════════════════════════════════════════ */
    function dText(t: number) {
      const ps = 11.5; 
      if (t < ps) return;
      c.save();
      c.textAlign = 'center'; c.textBaseline = 'middle';

      const tProg = Math.min((t - ps) / 0.8, 1);
      const tFi = Math.min(1, eSpring(tProg));
      const tSlide = (1 - eOC(tProg)) * 14;

      if (tFi > 0.01) {
        const ts = Math.min(W * .06, H * .065, 52);
        const scale = 0.95 + tFi * 0.05;
        const title = 'Happy Republic Day';
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
        mg.addColorStop(0, '#ff9933'); 
        mg.addColorStop(0.48, '#ffffff'); 
        mg.addColorStop(0.52, '#0f2c59'); 
        mg.addColorStop(1, '#128807'); 
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
          sg.addColorStop(0.5, `rgba(255,255,255,${0.18 * (1 - shProg)})`);
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
        const subtitle = 'सत्यमेव जयते  •  वन्दे मातरम्';
        const my = H * .35 + tSlide + Math.min(W * .06, H * .065, 52) * 0.85 + mSlide;

        c.globalAlpha = mFi;
        c.font = `400 ${ss}px 'Georgia','Times New Roman',serif`;

        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillText(subtitle, W / 2 + 1, my + 2);

        const smg = c.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0);
        smg.addColorStop(0, '#ff9933');
        smg.addColorStop(0.5, '#ffffff');
        smg.addColorStop(1, '#128807');
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

        // Confetti Fluttering physics
        if (p.tp === 7) {
          p.vx += Math.sin(p.y * .015 + p.rot) * .025; 
          p.vy *= .998; 
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
      sConfetti(t);
      sRevealSparkles(t);

      // Update
      updateParticles(dt, t);

      // Draw
      dBg(t);
      dTemples(t);
      dEnergy(t);
      dSmoke();
      dDustLayer(t);
      dOrbit();
      dNationalImage(t);
      dRevealSparkles();
      dFlare(t);
      dFighterJetsAndTrails(t);
      dAarti(t);
      dBells(t);
      dBloom(t);
      dBloomP();
      dConfetti();
      dRays(t);
      dDissolve(t);
      dText(t);
      dVignette(t);
      dAmarJawanJyoti(t);
      dMonuments(t);
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
  }, [imgReady, mkPool, grab, triggerBrassSound]);

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
