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
const POOL = 5000;
const DUR = 15.0;
const EP = 1e-4;

// 🇮🇳 NEW DEFAULT IMAGE: Your custom high-definition Indian National Flag from Supabase Storage
const DEFAULT_IMG_URL = 'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/india%20flag/india%20flag.png';

/* ═══════════════════════════════════════════════════════════════
   EASING HELPERS
   ═══════════════════════════════════════════════════════════════ */
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOQ = (t: number) => 1 - Math.pow(1 - t, 4);
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

  /* ═══════════════════════════════════════════════════════════════
     🥁 MILITARY DRUMS + ORCHESTRAL STRINGS AUDIO
     ═══════════════════════════════════════════════════════════════ */
  const triggerMilitaryAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      for (let beat = 0; beat < 8; beat++) {
        const bt = ctx.currentTime + beat * 0.4;
        const kick = ctx.createOscillator();
        const kg = ctx.createGain();
        kick.frequency.setValueAtTime(120, bt);
        kick.frequency.exponentialRampToValueAtTime(25, bt + 0.12);
        kg.gain.setValueAtTime(0.3, bt);
        kg.gain.exponentialRampToValueAtTime(0.001, bt + 0.15);
        kick.connect(kg); kg.connect(ctx.destination);
        kick.start(bt); kick.stop(bt + 0.15);

        if (beat % 2 === 1) {
          const bufSz = ctx.sampleRate * 0.08;
          const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < bufSz; i++) d[i] = Math.random() * 2 - 1;
          const ns = ctx.createBufferSource(); ns.buffer = buf;
          const ng = ctx.createGain();
          ng.gain.setValueAtTime(0.1, bt);
          ng.gain.exponentialRampToValueAtTime(0.001, bt + 0.08);
          const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
          ns.connect(hp); hp.connect(ng); ng.connect(ctx.destination);
          ns.start(bt); ns.stop(bt + 0.08);
        }
      }

      [130.81, 164.81, 196.00, 261.63, 329.63].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.value = freq;
        const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 600;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.02 / (i * 0.4 + 1), ctx.currentTime + 1.0);
        g.gain.linearRampToValueAtTime(0.035 / (i * 0.4 + 1), ctx.currentTime + 2.5);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5.0);
        osc.connect(flt); flt.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 5.0);
      });
    } catch (e) { /* silent */ }
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     MAIN EFFECT
     ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!imgReady) return;
    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    } catch (_) { /* no audio */ }

    triggerMilitaryAudio();

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
    const starI: number[] = [];
    for (let i = 0; i < 120; i++) {
      const p = pl[i]; p.on = true; p.tp = 0;
      p.x = Math.random() * W; p.y = Math.random() * H * 0.75;
      p.vx = 0; p.vy = 0;
      p.sz = Math.random() * 1.2 + 0.2; p.ml = 999; p.life = 999;
      p.r = 180; p.g = 200; p.b = 255;
      p.a = Math.random() * 0.45 + 0.08; p.rot = 0; p.rs = 0;
      starI.push(i);
    }

    /* ─── Arch Path Helper ─── */
    const drawArchPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      const rT = w / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y + h);
      ctx.lineTo(x + w - r, y + h);
      ctx.arcTo(x + w, y + h, x + w, y + h - r, r);
      ctx.lineTo(x + w, y + rT);
      ctx.arc(x + rT, y + rT, rT, 0, Math.PI, true);
      ctx.lineTo(x, y + h - r);
      ctx.arcTo(x, y + h, x + r, y + h, r);
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
       🌌 BACKGROUND
       ═══════════════════════════════════════════════════════════ */
    function dBg(t: number) {
      const ni = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 4);
      const si = t < 8 ? 0 : Math.min(1, (t - 8) / 4);

      c.fillStyle = `rgb(${3 + si * 18},${3 + si * 10},${12 + si * 6})`;
      c.fillRect(0, 0, W, H);

      if (ni > 0) {
        const ng = c.createRadialGradient(W * .5, H * .25, 0, W * .5, H * .25, H * .9);
        ng.addColorStop(0, `rgba(10,15,55,${ni * 0.5})`);
        ng.addColorStop(0.5, `rgba(5,5,28,${ni * 0.3})`);
        ng.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = ng; c.fillRect(0, 0, W, H);
      }

      if (si > 0) {
        const sg = c.createRadialGradient(W * .5, H * 1.15, 0, W * .5, H * 1.15, H * 1.25);
        sg.addColorStop(0, `rgba(255,140,40,${si * 0.38})`);
        sg.addColorStop(0.25, `rgba(255,100,30,${si * 0.22})`);
        sg.addColorStop(0.5, `rgba(18,136,7,${si * 0.1})`);
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = sg; c.fillRect(0, 0, W, H);

        const tg = c.createRadialGradient(W * .5, H * .12, 0, W * .5, H * .12, H * .55);
        tg.addColorStop(0, `rgba(255,180,90,${si * 0.14})`);
        tg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = tg; c.fillRect(0, 0, W, H);
      }

      if (t > 2 && t < 8) {
        const ta = Math.min((t - 2) / 2, 1) * 0.05;
        const tg2 = c.createRadialGradient(W * .5, H * .4, 0, W * .5, H * .4, H * .5);
        tg2.addColorStop(0, `rgba(255,153,51,${ta})`);
        tg2.addColorStop(0.5, `rgba(255,255,255,${ta * 0.25})`);
        tg2.addColorStop(1, `rgba(18,136,7,${ta * 0.4})`);
        c.fillStyle = tg2; c.fillRect(0, 0, W, H);
      }
    }

    /* ═══════════════════════════════════════════════════════════
       ✨ STARS
       ═══════════════════════════════════════════════════════════ */
    function dStars(t: number) {
      const fo = t < 6 ? 1 : Math.max(0, 1 - (t - 6) / 3);
      if (fo <= 0) return;
      for (let i = 0; i < starI.length; i++) {
        const p = pl[starI[i]];
        const tw = 0.5 + Math.sin(t * 2 + i * 1.7) * 0.5;
        c.beginPath();
        c.arc(p.x, p.y, Math.max(EP, p.sz), 0, Math.PI * 2);
        c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * tw * fo})`;
        c.fill();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       ☸️ ASHOKA CHAKRA (Loading: 0-2.5s)
       ═══════════════════════════════════════════════════════════ */
    function dAshokaChakra(t: number) {
      if (t >= 2.8) return;
      const fi = Math.min(t / 0.8, 1);
      const fo = t > 2.0 ? Math.max(0, 1 - (t - 2.0) / 0.8) : 1;
      const alpha = fi * fo;
      if (alpha <= 0) return;

      const cx = W / 2, cy = H / 2 - H * 0.06;
      const radius = Math.min(W, H) * 0.11;
      const rot = t * 0.9;
      const spokes = 24;

      c.save();
      c.translate(cx, cy);
      c.globalAlpha = alpha;

      c.save();
      c.globalCompositeOperation = 'lighter';
      const glR = radius * 2.2;
      const gl = c.createRadialGradient(0, 0, radius * 0.4, 0, 0, Math.max(EP, glR));
      gl.addColorStop(0, 'rgba(15,44,89,0.18)');
      gl.addColorStop(0.4, 'rgba(15,44,89,0.06)');
      gl.addColorStop(1, 'rgba(15,44,89,0)');
      c.fillStyle = gl;
      c.fillRect(-glR, -glR, glR * 2, glR * 2);
      c.restore();

      const pulseA = 0.08 + Math.sin(t * 4) * 0.04;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.beginPath();
      c.arc(0, 0, Math.max(EP, radius * 1.08), 0, Math.PI * 2);
      c.strokeStyle = `rgba(30,80,160,${pulseA})`;
      c.lineWidth = 8;
      c.stroke();
      c.restore();

      c.rotate(rot);

      c.beginPath();
      c.arc(0, 0, Math.max(EP, radius), 0, Math.PI * 2);
      c.strokeStyle = `rgba(15,44,89,${0.85 * alpha})`;
      c.lineWidth = 3.5;
      c.stroke();

      c.beginPath();
      c.arc(0, 0, Math.max(EP, radius * 0.84), 0, Math.PI * 2);
      c.strokeStyle = `rgba(15,44,89,${0.4 * alpha})`;
      c.lineWidth = 1.5;
      c.stroke();

      for (let i = 0; i < spokes; i++) {
        const ang = (i / spokes) * Math.PI * 2;
        const ir = radius * 0.14;
        const or = radius * 0.91;
        c.beginPath();
        c.moveTo(Math.cos(ang) * ir, Math.sin(ang) * ir);
        c.lineTo(Math.cos(ang) * or, Math.sin(ang) * or);
        c.strokeStyle = `rgba(15,44,89,${0.65 * alpha})`;
        c.lineWidth = 1.8;
        c.stroke();
      }

      c.beginPath();
      c.arc(0, 0, Math.max(EP, radius * 0.14), 0, Math.PI * 2);
      c.fillStyle = `rgba(15,44,89,${0.9 * alpha})`;
      c.fill();

      c.beginPath();
      c.arc(0, 0, Math.max(EP, radius * 0.05), 0, Math.PI * 2);
      c.fillStyle = `rgba(200,220,255,${0.6 * alpha})`;
      c.fill();

      for (let i = 0; i < spokes; i++) {
        const ang = (i / spokes) * Math.PI * 2 + Math.PI / spokes;
        const px = Math.cos(ang) * radius * 0.7;
        const py = Math.sin(ang) * radius * 0.7;
        c.beginPath();
        c.arc(px, py, Math.max(EP, radius * 0.03), 0, Math.PI * 2);
        c.fillStyle = `rgba(15,44,89,${0.5 * alpha})`;
        c.fill();
      }

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       🔥 AMAR JAWAN JYOTI TORCH (Loading: 0-2.5s)
       ═══════════════════════════════════════════════════════════ */
    function dAmarJawanTorch(t: number) {
      if (t >= 2.8) return;
      const fi = Math.min(t / 0.8, 1);
      const fo = t > 2.0 ? Math.max(0, 1 - (t - 2.0) / 0.8) : 1;
      const alpha = fi * fo;
      if (alpha <= 0) return;

      const cx = W / 2, cy = H * 0.78;
      const s = Math.min(W, H) * 0.04;

      c.save();
      c.translate(cx, cy);
      c.globalAlpha = alpha;

      c.fillStyle = '#12132a';
      c.strokeStyle = 'rgba(255,215,0,0.25)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-s * 0.45, s * 1.0);
      c.lineTo(-s * 0.3, -s * 0.25);
      c.lineTo(s * 0.3, -s * 0.25);
      c.lineTo(s * 0.45, s * 1.0);
      c.closePath();
      c.fill(); c.stroke();

      c.beginPath();
      c.ellipse(0, -s * 0.25, s * 0.32, s * 0.09, 0, 0, Math.PI * 2);
      c.fillStyle = '#1e1f3a';
      c.fill();
      c.strokeStyle = 'rgba(255,215,0,0.35)';
      c.stroke();

      const fk = Math.sin(t * 18) * 0.12 + Math.sin(t * 27) * 0.06;
      const fh = s * 2.2 * (1 + fk);

      c.globalCompositeOperation = 'lighter';

      const glR = s * 4;
      const gl = c.createRadialGradient(0, -fh * 0.3, 0, 0, -fh * 0.3, Math.max(EP, glR));
      gl.addColorStop(0, 'rgba(255,153,51,0.22)');
      gl.addColorStop(1, 'rgba(255,80,20,0)');
      c.fillStyle = gl;
      c.fillRect(-glR, -fh * 0.3 - glR, glR * 2, glR * 2);

      c.beginPath();
      c.moveTo(-s * 0.22, -s * 0.2);
      c.bezierCurveTo(
        -s * 0.12 + Math.sin(t * 12) * s * 0.05, -fh * 0.35,
        -s * 0.06 + Math.sin(t * 16) * s * 0.06, -fh * 0.82,
        0, -fh
      );
      c.bezierCurveTo(
        s * 0.06 + Math.sin(t * 16) * s * 0.06, -fh * 0.82,
        s * 0.12 + Math.sin(t * 12) * s * 0.05, -fh * 0.35,
        s * 0.22, -s * 0.2
      );
      c.closePath();
      const fg = c.createLinearGradient(0, -s * 0.2, 0, -fh);
      fg.addColorStop(0, 'rgba(255,220,80,0.95)');
      fg.addColorStop(0.3, 'rgba(255,153,51,0.85)');
      fg.addColorStop(0.7, 'rgba(255,80,20,0.45)');
      fg.addColorStop(1, 'rgba(255,40,10,0.08)');
      c.fillStyle = fg;
      c.fill();

      c.beginPath();
      c.ellipse(0, -fh * 0.22, s * 0.055, fh * 0.16, 0, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,255,230,0.8)';
      c.fill();

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       📝 LOADING TEXT (0-2.5s)
       ═══════════════════════════════════════════════════════════ */
    function dLoadingText(t: number) {
      if (t >= 2.8) return;
      const fi = Math.min(t / 1.0, 1);
      const fo = t > 2.0 ? Math.max(0, 1 - (t - 2.0) / 0.8) : 1;
      const alpha = fi * fo;
      if (alpha <= 0) return;

      const ty = H * 0.9;
      const fs = Math.min(W * 0.019, H * 0.023, 15);
      const dots = '.'.repeat(Math.floor(t * 2.5) % 4);
      const text = `गणतंत्र ऊदय परेड प्रारंभ हो रही है${dots}`;

      c.save();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.globalAlpha = alpha;
      c.font = `400 ${fs}px 'Georgia',serif`;
      c.fillStyle = 'rgba(255,215,0,0.55)';
      c.fillText(text, W / 2, ty);

      const tw = c.measureText(text).width;
      const lw = tw * (0.4 + Math.sin(t * 3) * 0.6);
      c.strokeStyle = 'rgba(255,215,0,0.18)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(W / 2 - lw / 2, ty + fs * 0.75);
      c.lineTo(W / 2 + lw / 2, ty + fs * 0.75);
      c.stroke();
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       🏛️ INDIA GATE SILHOUETTE + TRICOLOR FLAG (0-5s)
       ═══════════════════════════════════════════════════════════ */
    function dIndiaGateSilhouette(t: number) {
      const fi = Math.min(t / 1.5, 1);
      const fo = t > 3.5 ? Math.max(0, 1 - (t - 3.5) / 1.5) : 1;
      const alpha = fi * fo * 0.14;
      if (alpha <= 0) return;

      const cx = W / 2, cy = H * 0.88;
      const s = Math.min(W, H) * 0.28;

      c.save();
      c.globalAlpha = alpha;
      c.fillStyle = '#080818';
      c.strokeStyle = 'rgba(255,255,255,0.035)';
      c.lineWidth = 1;

      c.beginPath();
      c.rect(cx - s * 0.65, cy - s * 0.03, s * 1.3, s * 0.03);
      c.fill(); c.stroke();

      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.rect(cx - s * (0.6 - i * 0.03), cy - s * (0.03 + i * 0.015), s * (1.2 - i * 0.06), s * 0.015);
        c.fill();
      }

      c.beginPath();
      c.rect(cx - s * 0.55, cy - s * 0.68, s * 0.1, s * 0.62);
      c.fill(); c.stroke();

      c.beginPath();
      c.rect(cx + s * 0.45, cy - s * 0.68, s * 0.1, s * 0.62);
      c.fill(); c.stroke();

      c.beginPath();
      c.rect(cx - s * 0.58, cy - s * 0.75, s * 1.16, s * 0.07);
      c.fill(); c.stroke();

      c.beginPath();
      c.moveTo(cx - s * 0.45, cy - s * 0.68);
      c.quadraticCurveTo(cx, cy - s * 0.38, cx + s * 0.45, cy - s * 0.68);
      c.lineTo(cx + s * 0.45, cy - s * 0.03);
      c.lineTo(cx - s * 0.45, cy - s * 0.03);
      c.closePath();
      c.fillStyle = '#03030c';
      c.fill();

      for (const dx of [-s * 0.52, -s * 0.48, s * 0.48, s * 0.52]) {
        c.beginPath();
        c.arc(cx + dx, cy - s * 0.78, Math.max(EP, s * 0.025), 0, Math.PI * 2);
        c.fillStyle = '#080818';
        c.fill();
      }

      const fX = cx, fY = cy - s * 0.82;
      const fW = s * 0.07, fH = s * 0.1;
      c.beginPath();
      c.moveTo(fX, fY);
      c.lineTo(fX, fY - fH * 0.4);
      c.strokeStyle = 'rgba(255,255,255,0.06)';
      c.lineWidth = 1;
      c.stroke();

      const th = fH / 3;
      c.fillStyle = 'rgba(255,153,51,0.12)';
      c.fillRect(fX, fY - fH, fW, th);
      c.fillStyle = 'rgba(255,255,255,0.08)';
      c.fillRect(fX, fY - fH + th, fW, th);
      c.fillStyle = 'rgba(18,136,7,0.12)';
      c.fillRect(fX, fY - fH + th * 2, fW, th);

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       ✈️ SUKHOI JETS + TRICOLOR SMOKE TRAILS (2-7.5s)
       ═══════════════════════════════════════════════════════════ */
    function dFighterJets(t: number) {
      if (t < 2.0 || t > 7.5) return;

      const jetColors = [
        { r: 255, g: 153, b: 51 },
        { r: 255, g: 255, b: 255 },
        { r: 18, g: 136, b: 7 },
      ];
      const delays = [0, 0.35, 0.7];
      const dur = 4.5;

      c.save();
      c.globalCompositeOperation = 'lighter';

      for (let j = 0; j < 3; j++) {
        const jt = t - 2.0 - delays[j];
        if (jt < 0 || jt > dur) continue;
        const prog = Math.min(jt / dur, 1);
        const ep = eOC(prog);

        const sX = -W * 0.18, sY = H * 0.88;
        const eX = W * 1.18, eY = H * 0.02;
        const yOff = (j - 1) * Math.min(W, H) * 0.065;

        const jx = sX + (eX - sX) * ep;
        const jy = sY + (eY - sY) * ep + yOff;

        const col = jetColors[j];
        const trailLen = Math.min(ep, 0.65);
        const tsX = sX + (eX - sX) * Math.max(0, ep - trailLen);
        const tsY = sY + (eY - sY) * Math.max(0, ep - trailLen) + yOff;

        const sw = 18 + ep * 55;
        for (let layer = 0; layer < 4; layer++) {
          const lw = sw * (1 - layer * 0.2);
          const la = 0.18 - layer * 0.035;
          const sg = c.createLinearGradient(tsX, tsY, jx, jy);
          sg.addColorStop(0, `rgba(${col.r},${col.g},${col.b},0)`);
          sg.addColorStop(0.15, `rgba(${col.r},${col.g},${col.b},${la * 0.15})`);
          sg.addColorStop(0.4, `rgba(${col.r},${col.g},${col.b},${la * 0.5})`);
          sg.addColorStop(0.8, `rgba(${col.r},${col.g},${col.b},${la * 0.85})`);
          sg.addColorStop(1, `rgba(${col.r},${col.g},${col.b},${la})`);
          c.strokeStyle = sg;
          c.lineWidth = lw;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(tsX, tsY);
          c.lineTo(jx, jy);
          c.stroke();
        }

        if (prog < 0.95) {
          const angle = Math.atan2(eY - sY, eX - sX);
          c.save();
          c.translate(jx, jy);
          c.rotate(angle);

          const jgR = 25;
          const jg = c.createRadialGradient(0, 0, 0, 0, 0, Math.max(EP, jgR));
          jg.addColorStop(0, 'rgba(255,255,255,0.9)');
          jg.addColorStop(0.25, `rgba(${col.r},${col.g},${col.b},0.5)`);
          jg.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
          c.fillStyle = jg;
          c.fillRect(-jgR, -jgR, jgR * 2, jgR * 2);

          c.fillStyle = '#ffffff';
          c.shadowColor = `rgb(${col.r},${col.g},${col.b})`;
          c.shadowBlur = 14;
          c.beginPath();
          c.moveTo(16, 0);
          c.lineTo(-6, -5);
          c.lineTo(-14, -10);
          c.lineTo(-10, -2);
          c.lineTo(-14, 0);
          c.lineTo(-10, 2);
          c.lineTo(-14, 10);
          c.lineTo(-6, 5);
          c.closePath();
          c.fill();
          c.shadowBlur = 0;

          c.restore();
        }
      }

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       💨 JET SMOKE PARTICLES
       ═══════════════════════════════════════════════════════════ */
    function sJetSmoke(t: number) {
      if (t < 2.5 || t > 7.0 || Math.random() > 0.35) return;
      const p = grab(pl); if (!p) return;

      const prog = Math.min((t - 2.0) / 4.5, 1);
      const ep = eOC(prog);
      const tp = Math.max(0, ep - Math.random() * 0.5);
      const ji = Math.floor(Math.random() * 3);
      const colors = [{ r: 255, g: 153, b: 51 }, { r: 255, g: 255, b: 255 }, { r: 18, g: 136, b: 7 }];
      const col = colors[ji];
      const yOff = (ji - 1) * Math.min(W, H) * 0.065;

      p.x = -W * 0.18 + (W * 1.36) * tp + (Math.random() - 0.5) * 35;
      p.y = H * 0.88 + (H * -0.86) * tp + yOff + (Math.random() - 0.5) * 35;
      p.vx = (Math.random() - 0.5) * 0.4;
      p.vy = (Math.random() - 0.5) * 0.4 - 0.15;
      p.sz = 22 + Math.random() * 35;
      p.ml = 2.5 + Math.random() * 2;
      p.life = p.ml;
      p.r = col.r; p.g = col.g; p.b = col.b;
      p.a = 0.025 + Math.random() * 0.015;
      p.rot = 0; p.rs = 0;
      p.on = true; p.tp = 6;
    }

    function dJetSmoke() {
      for (const p of pl) {
        if (!p.on || p.tp !== 6) continue;
        const lr = p.life / p.ml;
        const a = p.a * lr;
        const sz = Math.max(EP, p.sz * (1 + (1 - lr) * 0.6));
        const gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz);
        gr.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a})`);
        gr.addColorStop(0.5, `rgba(${p.r},${p.g},${p.b},${a * 0.35})`);
        gr.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
        c.fillStyle = gr;
        c.fillRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
      }
    }

    /* ═══════════════════════════════════════════════════════════
       🏆 GOLDEN ARCH FRAME (3.5-11.5s)
       ═══════════════════════════════════════════════════════════ */
    function dGoldenArch(t: number) {
      if (t < 3.5) return;
      let fa = 0;
      if (t >= 3.5 && t < 5.0) fa = eIO((t - 3.5) / 1.5);
      else if (t >= 5.0 && t < 10.5) fa = 1;
      else if (t >= 10.5 && t < 11.5) fa = 1 - eOC((t - 10.5) / 1.0);
      if (fa <= 0) return;

      const cx = W / 2, cy = H / 2 - H * 0.02;
      const sc = Math.min(W, H);
      const dw = sc * 0.33, dh = dw * 1.28;
      const br = dw * 0.055;
      const fx = cx - dw / 2, fy = cy - dh / 2;

      c.save();
      c.globalAlpha = fa;

      c.shadowColor = 'rgba(255,215,0,0.5)';
      c.shadowBlur = 35;
      drawArchPath(c, fx, fy, dw, dh, br);
      c.fillStyle = 'rgba(4,4,14,0.92)';
      c.fill();
      c.shadowBlur = 0;

      const og = c.createLinearGradient(fx, fy - dw * 0.05, fx, fy + dh);
      og.addColorStop(0, '#f5e6a3');
      og.addColorStop(0.15, '#ffd700');
      og.addColorStop(0.5, '#d4a030');
      og.addColorStop(0.85, '#b8860b');
      og.addColorStop(1, '#6b4500');
      c.strokeStyle = og;
      c.lineWidth = 4.5;
      c.shadowColor = 'rgba(255,215,0,0.4)';
      c.shadowBlur = 18;
      drawArchPath(c, fx, fy, dw, dh, br);
      c.stroke();
      c.shadowBlur = 0;

      const ins = 7;
      c.strokeStyle = 'rgba(255,215,0,0.18)';
      c.lineWidth = 1.2;
      drawArchPath(c, fx + ins, fy + ins, dw - ins * 2, dh - ins * 2, Math.max(EP, br - ins * 0.3));
      c.stroke();

      const sg = c.createLinearGradient(fx + dw * 0.08, 0, fx + dw * 0.92, 0);
      sg.addColorStop(0, 'rgba(255,240,200,0)');
      sg.addColorStop(0.38, 'rgba(255,240,200,0)');
      sg.addColorStop(0.5, 'rgba(255,240,200,0.22)');
      sg.addColorStop(0.62, 'rgba(255,240,200,0)');
      sg.addColorStop(1, 'rgba(255,240,200,0)');
      c.strokeStyle = sg;
      c.lineWidth = 0.9;
      drawArchPath(c, fx, fy, dw, dh, br);
      c.stroke();

      const ornR = 4;
      const corners = [
        { x: fx + br * 0.5, y: fy + dh - br * 0.5 },
        { x: fx + dw - br * 0.5, y: fy + dh - br * 0.5 },
      ];
      for (const co of corners) {
        c.beginPath();
        c.arc(co.x, co.y, Math.max(EP, ornR), 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,215,0,0.3)';
        c.fill();
      }

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       🖼️ NATIONAL IMAGE (inside arch, 4-11.5s)
       ═══════════════════════════════════════════════════════════ */
    function dNationalImage(t: number) {
      if (t < 4.0) return;
      const img = nationalImgRef.current;
      if (!img || !img.complete || img.naturalWidth === 0) return;

      let ia = 0;
      if (t >= 4.0 && t < 5.5) ia = eIO((t - 4.0) / 1.5);
      else if (t >= 5.5 && t < 10.5) ia = 1;
      else if (t >= 10.5 && t < 11.5) ia = 1 - eOC((t - 10.5) / 1.0);
      if (ia <= 0) return;

      const cx = W / 2, cy = H / 2 - H * 0.02;
      const sc = Math.min(W, H);
      const dw = sc * 0.33, dh = dw * 1.28;
      const br = dw * 0.055;
      const fx = cx - dw / 2, fy = cy - dh / 2;

      c.save();
      c.globalAlpha = ia;
      drawArchPath(c, fx, fy, dw, dh, br);
      c.clip();

      // Warm inner glow
      const ig = c.createRadialGradient(cx, cy - dh * 0.06, 0, cx, cy, Math.max(EP, dw * 0.7));
      ig.addColorStop(0, 'rgba(255,180,90,0.08)');
      ig.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = ig;
      c.fillRect(fx, fy, dw, dh);

      // Image
      const imgR = img.naturalWidth / img.naturalHeight;
      const frmR = dw / dh;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (imgR > frmR) { sw = img.naturalHeight * frmR; sx = (img.naturalWidth - sw) / 2; }
      else { sh = img.naturalWidth / frmR; sy = (img.naturalHeight - sh) / 2; }
      c.drawImage(img, sx, sy, sw, sh, fx, fy, dw, dh);

      // Inner vignette
      const iv = c.createRadialGradient(cx, cy, Math.max(EP, dw * 0.2), cx, cy, Math.max(EP, dw * 0.58));
      iv.addColorStop(0, 'rgba(0,0,0,0)');
      iv.addColorStop(1, 'rgba(0,0,0,0.2)');
      c.fillStyle = iv;
      c.fillRect(fx, fy, dw, dh);

      // Top/bottom fade
      const tf = c.createLinearGradient(0, fy, 0, fy + dh * 0.08);
      tf.addColorStop(0, 'rgba(4,4,14,0.45)');
      tf.addColorStop(1, 'rgba(4,4,14,0)');
      c.fillStyle = tf;
      c.fillRect(fx, fy, dw, dh * 0.08);

      const bf = c.createLinearGradient(0, fy + dh, 0, fy + dh * 0.92);
      bf.addColorStop(0, 'rgba(4,4,14,0.4)');
      bf.addColorStop(1, 'rgba(4,4,14,0)');
      c.fillStyle = bf;
      c.fillRect(fx, fy + dh * 0.92, dw, dh * 0.08);

      // Flash on initial reveal
      if (t < 5.2) {
        const fl = Math.max(0, 1 - (t - 4.0) / 0.9);
        if (fl > 0.01) {
          const fg = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, dw * 0.55));
          fg.addColorStop(0, `rgba(255,255,255,${fl * 0.55})`);
          fg.addColorStop(0.25, `rgba(255,200,80,${fl * 0.3})`);
          fg.addColorStop(0.6, `rgba(255,153,51,${fl * 0.1})`);
          fg.addColorStop(1, 'rgba(255,153,51,0)');
          c.fillStyle = fg;
          c.fillRect(fx, fy, dw, dh);
        }
      }

      // Shimmer sweep (7-10s)
      if (t > 7.0 && t < 10.0) {
        const sp = (t - 7.0) / 3.0;
        const sx2 = fx + sp * dw * 1.4 - dw * 0.2;
        const sw2 = dw * 0.12;
        const sh = c.createLinearGradient(sx2 - sw2, 0, sx2 + sw2, 0);
        sh.addColorStop(0, 'rgba(255,255,255,0)');
        sh.addColorStop(0.4, 'rgba(255,255,220,0.06)');
        sh.addColorStop(0.5, 'rgba(255,255,255,0.12)');
        sh.addColorStop(0.6, 'rgba(255,255,220,0.06)');
        sh.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = sh;
        c.fillRect(sx2 - sw2, fy, sw2 * 2, dh);
      }

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       ☸️ ASHOKA SPOKE GLOW BEAMS (7-11s)
       ═══════════════════════════════════════════════════════════ */
    function dChakraSpokes(t: number) {
      if (t < 7.0 || t > 11.5) return;
      let alpha = 0;
      if (t < 8.0) alpha = eOC((t - 7.0) / 1.0);
      else if (t < 10.0) alpha = 1;
      else alpha = 1 - eOC((t - 10.0) / 1.5);
      if (alpha <= 0) return;

      const cx = W / 2, cy = H / 2 - H * 0.02;
      const sc = Math.min(W, H);
      const ir = sc * 0.2;
      const or = Math.max(W, H) * 0.85;
      const spokes = 24;

      c.save();
      c.globalAlpha = alpha * 0.1;
      c.globalCompositeOperation = 'lighter';

      for (let i = 0; i < spokes; i++) {
        const ang = (i / spokes) * Math.PI * 2 + t * 0.08;
        const hw = (Math.PI / spokes) * 0.35;
        c.beginPath();
        c.moveTo(cx + Math.cos(ang) * ir, cy + Math.sin(ang) * ir);
        c.lineTo(cx + Math.cos(ang - hw) * or, cy + Math.sin(ang - hw) * or);
        c.lineTo(cx + Math.cos(ang + hw) * or, cy + Math.sin(ang + hw) * or);
        c.closePath();
        const rg = c.createRadialGradient(cx, cy, ir, cx, cy, Math.max(EP, or));
        rg.addColorStop(0, 'rgba(20,60,130,0.55)');
        rg.addColorStop(0.25, 'rgba(15,44,89,0.25)');
        rg.addColorStop(0.6, 'rgba(15,44,89,0.06)');
        rg.addColorStop(1, 'rgba(15,44,89,0)');
        c.fillStyle = rg;
        c.fill();
      }

      const cpA = alpha * 0.15;
      const cpR = sc * 0.08;
      const cp = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(EP, cpR));
      cp.addColorStop(0, `rgba(100,150,255,${cpA})`);
      cp.addColorStop(1, 'rgba(15,44,89,0)');
      c.fillStyle = cp;
      c.fillRect(cx - cpR, cy - cpR, cpR * 2, cpR * 2);

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       🎊 TRICOLOR CONFETTI (5-12.5s)
       ═══════════════════════════════════════════════════════════ */
    function sConfetti(t: number) {
      if (t < 5.0 || t > 12.5 || Math.random() > 0.5) return;
      const p = grab(pl); if (!p) return;
      p.x = Math.random() * W;
      p.y = -22 - Math.random() * 55;
      p.vx = (Math.random() - 0.5) * 2.8;
      p.vy = 1.0 + Math.random() * 2.2;
      p.sz = 4 + Math.random() * 7;
      p.ml = 6 + Math.random() * 3;
      p.life = p.ml;
      const ct = Math.random();
      if (ct < 0.35) { p.r = 255; p.g = 153; p.b = 51; }
      else if (ct < 0.7) { p.r = 255; p.g = 255; p.b = 255; }
      else { p.r = 18; p.g = 136; p.b = 7; }
      p.a = 0.5 + Math.random() * 0.35;
      p.rot = Math.random() * Math.PI * 2;
      p.rs = (Math.random() - 0.5) * 0.15;
      p.on = true; p.tp = 7;
    }

    function dConfetti() {
      for (const p of pl) {
        if (!p.on || p.tp !== 7) continue;
        const lr = p.life / p.ml;
        const a = p.a * Math.min(lr * 2, 1) * (lr > 0.8 ? (1 - lr) / 0.2 : 1);
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        c.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz * 0.5);
        c.restore();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       ✦ REVEAL SPARKLES (around arch)
       ═══════════════════════════════════════════════════════════ */
    function sSparkles(t: number) {
      if (t < 3.5 || t > 7.0 || Math.random() > 0.3) return;
      const p = grab(pl); if (!p) return;
      const cx = W / 2, cy = H / 2 - H * 0.02;
      const sc = Math.min(W, H);
      const ang = Math.random() * Math.PI * 2;
      const rad = sc * 0.19 + Math.random() * sc * 0.04;
      p.x = cx + Math.cos(ang) * rad;
      p.y = cy + Math.sin(ang) * rad;
      const spd = 0.5 + Math.random() * 1.5;
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd;
      p.sz = 1 + Math.random() * 2;
      p.ml = 0.5 + Math.random() * 0.5;
      p.life = p.ml;
      p.r = 255; p.g = 215; p.b = 0;
      p.a = 0.6 + Math.random() * 0.4;
      p.rot = Math.random() * Math.PI * 2;
      p.rs = (Math.random() - 0.5) * 3;
      p.on = true; p.tp = 9;
    }

    function dSparkles() {
      for (const p of pl) {
        if (!p.on || p.tp !== 9) continue;
        const lr = p.life / p.ml;
        const a = p.a * lr;
        const sz = p.sz * (0.5 + lr * 0.5);
        if (sz > 0.8) {
          const gr = sz * 4;
          const gg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(EP, gr));
          gg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a * 0.2})`);
          gg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          c.fillStyle = gg;
          c.fillRect(p.x - gr, p.y - gr, gr * 2, gr * 2);
        }
        c.save();
        c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = a;
        c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        c.beginPath();
        c.moveTo(0, -sz * 2.2); c.lineTo(sz * 0.22, -sz * 0.22);
        c.lineTo(sz * 2.2, 0); c.lineTo(sz * 0.22, sz * 0.22);
        c.lineTo(0, sz * 2.2); c.lineTo(-sz * 0.22, sz * 0.22);
        c.lineTo(-sz * 2.2, 0); c.lineTo(-sz * 0.22, -sz * 0.22);
        c.closePath(); c.fill();
        c.restore();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       🔆 HORIZONTAL LENS FLARE (2-8s)
       ═══════════════════════════════════════════════════════════ */
    function dFlare(t: number) {
      if (t < 2.5 || t > 8.5) return;
      let fi: number;
      if (t < 3.5) fi = (t - 2.5) / 1.0;
      else if (t > 7.5) fi = 1 - (t - 7.5) / 1.0;
      else fi = 1;
      fi = Math.max(0, Math.min(1, fi));
      if (fi <= 0) return;

      const cx = W / 2, cy = H / 2 - H * 0.02;
      const fw = W * 0.9;
      const fh = 2 + Math.sin(t * 5) * 1;

      c.save();
      c.globalAlpha = fi * 0.06;
      c.globalCompositeOperation = 'lighter';
      const fg = c.createLinearGradient(cx - fw / 2, 0, cx + fw / 2, 0);
      fg.addColorStop(0, 'rgba(255,180,80,0)');
      fg.addColorStop(0.2, 'rgba(255,180,80,0.08)');
      fg.addColorStop(0.45, 'rgba(255,220,150,0.3)');
      fg.addColorStop(0.5, 'rgba(255,240,200,0.5)');
      fg.addColorStop(0.55, 'rgba(255,220,150,0.3)');
      fg.addColorStop(0.8, 'rgba(255,180,80,0.08)');
      fg.addColorStop(1, 'rgba(255,180,80,0)');
      c.fillStyle = fg;
      c.fillRect(cx - fw / 2, cy - fh, fw, fh * 2);

      const cw = fw * 0.15;
      const cg = c.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
      cg.addColorStop(0, 'rgba(255,240,200,0)');
      cg.addColorStop(0.5, 'rgba(255,250,230,0.25)');
      cg.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = cg;
      c.fillRect(cx - cw / 2, cy - fh * 0.5, cw, fh);
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       📜 TEXT REVEAL (11.5-15s)
       ═══════════════════════════════════════════════════════════ */
    function dText(t: number) {
      if (t < 11.5) return;
      c.save();
      c.textAlign = 'center'; c.textBaseline = 'middle';

      const tProg = Math.min((t - 11.5) / 0.9, 1);
      const tFi = Math.min(1, eSpring(tProg));
      const tSlide = (1 - eOC(tProg)) * 22;

      if (tFi > 0.01) {
        const ts = Math.min(W * 0.055, H * 0.062, 50);
        const scale = 0.9 + tFi * 0.1;
        const title = 'Happy Republic Day';
        const ty = H * 0.32 + tSlide;

        c.globalAlpha = tFi;
        c.save();
        c.translate(W / 2, ty);
        c.scale(scale, scale);
        c.translate(-W / 2, -ty);

        c.font = `700 ${ts}px 'Georgia','Times New Roman',serif`;
        const tw = c.measureText(title).width;

        // Drop shadow
        c.fillStyle = 'rgba(0,0,0,0.75)';
        c.fillText(title, W / 2 + 2, ty + 3);

        // Metallic gold
        const mg = c.createLinearGradient(W / 2 - tw / 2, ty - ts / 2, W / 2 + tw / 2, ty + ts / 2);
        mg.addColorStop(0, '#8b6914');
        mg.addColorStop(0.15, '#d4a030');
        mg.addColorStop(0.3, '#ffd700');
        mg.addColorStop(0.42, '#fff8dc');
        mg.addColorStop(0.5, '#ffd700');
        mg.addColorStop(0.58, '#fff8dc');
        mg.addColorStop(0.7, '#ffd700');
        mg.addColorStop(0.85, '#d4a030');
        mg.addColorStop(1, '#8b6914');
        c.fillStyle = mg;
        c.fillText(title, W / 2, ty);

        c.restore();

        // Shimmer sweep
        if (t > 12.5) {
          const sp = Math.min((t - 12.5) / 1.5, 1);
          const sx = (W / 2 - tw / 2) + sp * tw * 1.5 - tw * 0.25;
          c.save();
          c.beginPath();
          c.rect(W / 2 - tw / 2, ty - ts, tw, ts * 2);
          c.clip();
          const sw = tw * 0.08;
          const sg = c.createLinearGradient(sx - sw, 0, sx + sw, 0);
          sg.addColorStop(0, 'rgba(255,255,230,0)');
          sg.addColorStop(0.5, `rgba(255,255,255,${0.3 * (1 - sp)})`);
          sg.addColorStop(1, 'rgba(255,255,230,0)');
          c.fillStyle = sg;
          c.fillRect(sx - sw, ty - ts, sw * 2, ts * 2);
          c.restore();
        }
      }

      // Slogans
      const sStart = 12.4;
      if (t > sStart) {
        const sp1 = Math.min((t - sStart) / 0.6, 1);
        const sf1 = Math.min(1, eOC(sp1));
        const sl1 = (1 - eOC(sp1)) * 14;

        const ss = Math.min(W * 0.02, H * 0.024, 17);
        const s1 = 'सत्यमेव जयते।';
        const baseY = H * 0.32 + tSlide + Math.min(W * 0.055, H * 0.062, 50) * 0.95 + sl1;

        c.globalAlpha = sf1;
        c.font = `400 ${ss}px 'Georgia','Times New Roman',serif`;

        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillText(s1, W / 2 + 1, baseY + 2);
        const smg1 = c.createLinearGradient(W / 2 - 90, 0, W / 2 + 90, 0);
        smg1.addColorStop(0, '#ff9933');
        smg1.addColorStop(0.5, '#ffd700');
        smg1.addColorStop(1, '#ff9933');
        c.fillStyle = smg1;
        c.fillText(s1, W / 2, baseY);

        if (t > sStart + 0.35) {
          const sp2 = Math.min((t - sStart - 0.35) / 0.5, 1);
          const sf2 = Math.min(1, eOC(sp2));
          c.globalAlpha = sf2;
          const s2 = 'वन्दे मातरम्॥';
          c.fillStyle = 'rgba(0,0,0,0.5)';
          c.fillText(s2, W / 2 + 1, baseY + ss * 1.7 + 2);
          const smg2 = c.createLinearGradient(W / 2 - 90, 0, W / 2 + 90, 0);
          smg2.addColorStop(0, '#128807');
          smg2.addColorStop(0.5, '#ffd700');
          smg2.addColorStop(1, '#128807');
          c.fillStyle = smg2;
          c.fillText(s2, W / 2, baseY + ss * 1.7);
        }
      }

      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       🌑 VIGNETTE
       ═══════════════════════════════════════════════════════════ */
    function dVignette(t: number) {
      const b = 0.52 + Math.sin(t * 0.9) * 0.03;
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, Math.max(EP, Math.max(W, H) * 0.88));
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(3,3,12,${b})`);
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }

    /* ═══════════════════════════════════════════════════════════
       🎞️ GRAIN
       ═══════════════════════════════════════════════════════════ */
    function dGrain() {
      c.save();
      c.globalAlpha = 0.028;
      c.globalCompositeOperation = 'overlay';
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0, 0, W, H); }
      c.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       PARTICLE UPDATE
       ═══════════════════════════════════════════════════════════ */
    function updateParticles(dt: number) {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i];
        if (!p.on || p.tp === 0) continue;
        p.life -= dt;
        if (p.life <= 0) { p.on = false; continue; }
        if (p.tp === 7) {
          p.vx += Math.sin(p.y * 0.012 + p.rot) * 0.03;
          p.vy *= 0.999;
        }
        if (p.tp === 6) {
          p.vx += (Math.random() - 0.5) * 0.015;
          p.vy -= 0.003;
          p.sz += 0.12;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rs;
      }
    }

    /* ═══════════════════════════════════════════════════════════
       🎬 ANIMATION LOOP
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
      sJetSmoke(t);
      sConfetti(t);
      sSparkles(t);

      // Update
      updateParticles(dt);

      // === DRAW ORDER ===
      dBg(t);
      dStars(t);
      dIndiaGateSilhouette(t);
      dAshokaChakra(t);
      dAmarJawanTorch(t);
      dLoadingText(t);
      dJetSmoke();
      dFighterJets(t);
      dFlare(t);
      dGoldenArch(t);
      dNationalImage(t);
      dSparkles();
      dChakraSpokes(t);
      dConfetti();
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
  }, [imgReady, mkPool, grab, triggerMilitaryAudio]);

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
