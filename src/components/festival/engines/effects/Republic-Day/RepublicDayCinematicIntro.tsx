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
const DUR = 15.0; // 🚀 Timeline synchronized: 15.0 seconds
const EP = 1e-4;

// 🇮🇳 YOUR CUSTOM HIGH-DEFINITION SUPABASE TIRANGA IMAGE
const DEFAULT_IMG_URL = 'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/india%20flag/india%20flag.png';

/* ═══════════════════════════════════════════════════════════════
   EASING HELPERS & CINEMATIC MATH
   ═══════════════════════════════════════════════════════════════ */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOQ = (t: number) => 1 - Math.pow(1 - t, 4);
const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // Expo Out
const eOB = (t: number) => { // Back Out
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ACES Filmic Tone Mapping Approximation for Photorealistic Look
const ACESFilmic = (x: number) => {
  const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1);
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

  /* ─── 🥁 PROCEDURAL MILITARY PERCUSSION + STRINGS SYNTH ─── */
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

  /* ═══════════════════════════════════════════════════════════
     CANVAS LIFE CYCLE & CINEMATIC DRAWERS
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!imgReady) return;
    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    // Initialize Audio Context
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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

    /* Film Grain setup */
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
    
    // Initialize Jets & Doves
    const jets = [
      { x: -W * 0.3, y: H * 0.3, vx: 12, vy: 4, scale: 1, smokeColor: '#FF9933' },
      { x: -W * 0.35, y: H * 0.35, vx: 12, vy: 4, scale: 0.9, smokeColor: '#FFFFFF' },
      { x: -W * 0.4, y: H * 0.4, vx: 12, vy: 4, scale: 0.8, smokeColor: '#138808' }
    ];
    const doves = Array.from({ length: 8 }, (_, i) => ({
      x: W * (0.1 + i * 0.12),
      y: H * (0.7 + Math.random() * 0.2),
      vx: 1.5 + Math.random(),
      vy: -0.8 - Math.random() * 0.4,
      wing: Math.random() * Math.PI * 2
    }));

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

    /* 🌌 ATMOSPHERE & SKY (Night -> Dawn -> Golden Morning) */
    function drawAtmosphere(t: number, elapsed: number) {
      const phase1 = clamp(t / 6, 0, 1); 
      const phase2 = clamp((t - 4) / 6, 0, 1);
      const phase3 = clamp((t - 8) / 7, 0, 1);

      const r = lerp(lerp(5, 20, phase1), lerp(255, 255, phase3), phase2);
      const g = lerp(lerp(10, 40, phase1), lerp(140, 200, phase3), phase2);
      const b = lerp(lerp(30, 70, phase1), lerp(50, 150, phase3), phase2);

      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgb(${r*0.5},${g*0.5},${b*0.8})`);
      grad.addColorStop(0.6, `rgb(${r*0.8},${g*0.7},${b*0.6})`);
      grad.addColorStop(1, `rgb(${r},${g*0.9},${b*0.4})`);
      c.fillStyle = grad;
      c.fillRect(-W, -H, W * 3, H * 3);

      // Stars
      if (t < 7) {
        const alpha = 1 - phase2;
        c.save();
        c.globalAlpha = alpha;
        for (let i = 0; i < 300; i++) {
          const x = (Math.sin(i * 92.3) * 0.5 + 0.5) * W;
          const y = (Math.cos(i * 45.1) * 0.5 + 0.5) * H * 0.7;
          const twinkle = Math.sin(elapsed * 4 + i) * 0.5 + 0.5;
          const size = (Math.sin(i * 12.4) * 0.5 + 0.5) * 1.2 + 0.3;
          c.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.9})`;
          c.beginPath();
          c.arc(x, y, size, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    /* ☀️ SUN & VOLUMETRIC GOD RAYS */
    function drawSunAndRays(t: number, elapsed: number) {
      if (t < 4) return;
      const sunY = lerp(H * 1.1, H * 0.35, eOE((t - 4) / 5));
      const sunX = W * 0.5;
      const intensity = clamp((t - 4) * 0.5, 0, 1);

      c.save();
      c.globalCompositeOperation = 'screen';
      
      // HDR Bloom
      const bloomGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.8);
      bloomGrad.addColorStop(0, `rgba(255, 240, 200, ${0.9 * intensity})`);
      bloomGrad.addColorStop(0.15, `rgba(255, 180, 80, ${0.6 * intensity})`);
      bloomGrad.addColorStop(0.4, `rgba(255, 100, 30, ${0.2 * intensity})`);
      bloomGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
      c.fillStyle = bloomGrad;
      c.fillRect(0, 0, W, H);

      // Sun Core
      const coreGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
      coreGrad.addColorStop(0.3, `rgba(255, 250, 220, ${0.9 * intensity})`);
      coreGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
      c.fillStyle = coreGrad;
      c.fillRect(sunX - 120, sunY - 120, 240, 240);

      // God Rays
      const rayIntensity = clamp((t - 5) * 0.5, 0, 1);
      if (rayIntensity > 0) {
        c.translate(sunX, sunY);
        c.rotate(Math.sin(elapsed * 0.05) * 0.02);
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2 + elapsed * 0.01;
          const length = H * 1.2;
          const width = 80 + Math.sin(elapsed * 2 + i) * 40;
          c.save();
          c.rotate(angle);
          const rayGrad = c.createLinearGradient(0, 0, 0, length);
          rayGrad.addColorStop(0, `rgba(255, 230, 180, ${0.2 * rayIntensity})`);
          rayGrad.addColorStop(0.5, `rgba(255, 200, 150, ${0.1 * rayIntensity})`);
          rayGrad.addColorStop(1, 'rgba(255, 200, 150, 0)');
          c.fillStyle = rayGrad;
          c.beginPath();
          c.moveTo(-width/4, 0);
          c.lineTo(width/4, 0);
          c.lineTo(width, length);
          c.lineTo(-width, length);
          c.closePath();
          c.fill();
          c.restore();
        }
      }
      c.restore();
    }

    /* 💨 VOLUMETRIC FOG */
    function drawFog(t: number, elapsed: number) {
      c.save();
      c.globalCompositeOperation = 'screen';
      const offset = elapsed * 8;
      const hazeGrad = c.createLinearGradient(0, H * 0.5, 0, H);
      hazeGrad.addColorStop(0, 'rgba(40, 50, 70, 0)');
      hazeGrad.addColorStop(0.7, `rgba(100, 110, 130, ${0.2 + (t/15) * 0.1})`);
      hazeGrad.addColorStop(1, `rgba(180, 190, 210, ${0.4 + (t/15) * 0.2})`);
      c.fillStyle = hazeGrad;
      c.fillRect(0, H * 0.5, W, H * 0.5);

      for(let i=0; i<6; i++) {
        const x = (i * W * 0.3 + offset) % (W * 1.5) - W * 0.2;
        const y = H * (0.7 + i * 0.03);
        const grad = c.createRadialGradient(x, y, 0, x, y, 400);
        grad.addColorStop(0, `rgba(220, 230, 240, ${0.08 + (t/15) * 0.04})`);
        grad.addColorStop(1, 'rgba(220, 230, 240, 0)');
        c.fillStyle = grad;
        c.fillRect(x - 400, y - 400, 800, 800);
      }
      c.restore();
    }

    /* 🔥 AMAR JAWAN JYOTI (TORCH) */
    function drawTorch(t: number, elapsed: number) {
      const tx = W * 0.5;
      const ty = H * 0.78;
      
      // Pre-ignition smoke
      if (t < 2) {
        c.save();
        c.globalCompositeOperation = 'screen';
        for(let i=0; i<5; i++) {
          const sy = ty - (elapsed * 25 + i * 40) % 200;
          const sx = tx + Math.sin(sy * 0.05 + elapsed) * 10;
          const grad = c.createRadialGradient(sx, sy, 0, sx, sy, 50);
          grad.addColorStop(0, 'rgba(60, 60, 60, 0.4)');
          grad.addColorStop(1, 'rgba(60, 60, 60, 0)');
          c.fillStyle = grad;
          c.fillRect(sx - 50, sy - 50, 100, 100);
        }
        c.restore();
      }

      // Ignition & Volumetric Fire
      if (t > 1.5) {
        const fireAlpha = clamp((t - 1.5) * 2, 0, 1);
        c.save();
        c.globalAlpha = fireAlpha;
        c.globalCompositeOperation = 'lighter';
        
        const glowGrad = c.createRadialGradient(tx, ty, 0, tx, ty, 400);
        glowGrad.addColorStop(0, 'rgba(255, 180, 80, 0.9)');
        glowGrad.addColorStop(0.2, 'rgba(255, 120, 30, 0.5)');
        glowGrad.addColorStop(0.5, 'rgba(200, 50, 0, 0.2)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        c.fillStyle = glowGrad;
        c.fillRect(tx - 400, ty - 400, 800, 800);

        const flicker = Math.sin(elapsed * 25) * 8 + Math.sin(elapsed * 9) * 4;
        const fireGrad = c.createRadialGradient(tx, ty + flicker, 0, tx, ty + flicker, 80);
        fireGrad.addColorStop(0, 'rgba(255, 255, 240, 1)');
        fireGrad.addColorStop(0.3, 'rgba(255, 220, 100, 0.9)');
        fireGrad.addColorStop(0.7, 'rgba(255, 100, 0, 0.5)');
        fireGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        c.fillStyle = fireGrad;
        
        c.beginPath();
        c.moveTo(tx - 50, ty);
        c.quadraticCurveTo(tx - 30, ty - 100 + flicker, tx, ty - 150 + flicker);
        c.quadraticCurveTo(tx + 30, ty - 100 - flicker, tx + 50, ty);
        c.closePath();
        c.fill();

        // Spawn embers
        if (Math.random() < 0.6) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = tx + (Math.random() - 0.5) * 30;
            p.y = ty - 100; p.vx = (Math.random() - 0.5) * 1;
            p.vy = -2 - Math.random() * 3; p.life = 3; p.ml = 3;
            p.sz = 1 + Math.random() * 2;
            p.r = 255; p.g = 150 + Math.random() * 100; p.b = 50; p.a = 1;
            p.tp = 3; // ember
          }
        }
        c.restore();
      }
    }

    /* 🏛️ INDIA GATE (Procedural Architecture) */
    function drawIndiaGate(t: number) {
      const gateW = W * 0.7;
      const gateH = H * 0.6;
      const baseY = H * 0.85;
      const cx = W * 0.5;

      c.save();
      const reveal = clamp((t - 1) * 0.5, 0, 1);
      c.globalAlpha = reveal;

      // Stone Material Gradients
      const stoneBase = `rgb(${lerp(30, 190, t/15)}, ${lerp(30, 170, t/15)}, ${lerp(30, 130, t/15)})`;
      const stoneDark = `rgb(${lerp(10, 80, t/15)}, ${lerp(10, 70, t/15)}, ${lerp(10, 50, t/15)})`;
      const stoneHighlight = `rgb(${lerp(50, 220, t/15)}, ${lerp(50, 200, t/15)}, ${lerp(50, 160, t/15)})`;
      
      const drawArchitecturalBlock = (x: number, y: number, width: number, height: number, depth: number) => {
        const grad = c.createLinearGradient(x, y, x, y + height);
        grad.addColorStop(0, stoneHighlight);
        grad.addColorStop(0.5, stoneBase);
        grad.addColorStop(1, stoneDark);
        c.fillStyle = grad;
        c.fillRect(x, y, width, height);
        c.fillStyle = stoneDark;
        c.fillRect(x, y - depth, width, depth);
        c.fillStyle = 'rgba(0,0,0,0.4)'; // Ambient Occlusion
        c.fillRect(x, y, width, 4);
        c.fillRect(x, y + height - 4, width, 4);
      };

      drawArchitecturalBlock(cx - gateW/2 - 50, baseY - 40, gateW + 100, 40, 20);
      drawArchitecturalBlock(cx - gateW/2, baseY - gateH, gateW, gateH, 30);
      
      // Central Arch Void
      const archW = gateW * 0.3, archH = gateH * 0.7;
      c.beginPath();
      c.moveTo(cx - archW/2, baseY);
      c.lineTo(cx - archW/2, baseY - archH * 0.7);
      c.quadraticCurveTo(cx, baseY - archH, cx + archW/2, baseY - archH * 0.7);
      c.lineTo(cx + archW/2, baseY);
      c.closePath();
      const archGrad = c.createLinearGradient(cx, baseY - archH, cx, baseY);
      archGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
      archGrad.addColorStop(1, 'rgba(20,10,5,0.8)');
      c.fillStyle = archGrad;
      c.fill();

      // Side Arches
      [-1, 1].forEach(side => {
        const sArchW = gateW * 0.15, sArchH = gateH * 0.45;
        const sX = cx + side * gateW * 0.32;
        c.beginPath();
        c.moveTo(sX - sArchW/2, baseY);
        c.lineTo(sX - sArchW/2, baseY - sArchH * 0.7);
        c.quadraticCurveTo(sX, baseY - sArchH, sX + sArchW/2, baseY - sArchH * 0.7);
        c.lineTo(sX + sArchW/2, baseY);
        c.closePath();
        c.fillStyle = 'rgba(0,0,0,0.9)';
        c.fill();
      });

      // Fluted Columns
      for(let i=0; i<8; i++) {
        const colX = cx - gateW/2 + (gateW / 8) * i + 15;
        const colGrad = c.createLinearGradient(colX, 0, colX + 20, 0);
        colGrad.addColorStop(0, stoneDark);
        colGrad.addColorStop(0.5, stoneHighlight);
        colGrad.addColorStop(1, stoneDark);
        c.fillStyle = colGrad;
        c.fillRect(colX, baseY - gateH * 0.85, 20, gateH * 0.85);
      }

      // Top Canopy
      const canopyY = baseY - gateH - 50;
      drawArchitecturalBlock(cx - gateW * 0.15, canopyY, gateW * 0.3, 50, 40);
      c.beginPath();
      c.moveTo(cx - gateW * 0.2, canopyY);
      c.lineTo(cx, canopyY - 60);
      c.lineTo(cx + gateW * 0.2, canopyY);
      c.closePath();
      c.fillStyle = stoneDark;
      c.fill();

      // Torch Bounce Light
      if (t > 2) {
        c.save();
        c.globalCompositeOperation = 'overlay';
        const torchLight = c.createRadialGradient(W/2, H*0.78, 0, W/2, H*0.78, gateH);
        torchLight.addColorStop(0, 'rgba(255, 120, 30, 0.8)');
        torchLight.addColorStop(1, 'rgba(255, 100, 0, 0)');
        c.fillStyle = torchLight;
        c.fillRect(cx - gateW/2, baseY - gateH, gateW, gateH);
        c.restore();
      }
      c.restore();
    }

    /* 🏆 GOLDEN ARCH & SUPABASE IMAGE */
    function drawArchAndImage(t: number) {
      if (t < 3.5) return; // Safe check prevents premature flashing
      let fa = 0;
      if (t >= 3.5 && t < 5.0) fa = eIO((t - 3.5) / 1.5);
      else if (t >= 5.0 && t < 10.5) fa = 1;
      else if (t >= 10.5 && t < 11.5) fa = 1 - eOC((t - 10.5) / 1.0);
      if (fa <= 0) return;
      
      const cx = W / 2, cy = H / 2 - H * 0.02, sc = Math.min(W, H), dw = sc * 0.33, dh = dw * 1.28, br = dw * 0.055;
      
      const img = nationalImgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        c.save();
        c.globalAlpha = fa;
        drawArchPath(c, cx - dw / 2, cy - dh / 2, dw, dh, br);
        c.clip();
        
        // Object cover math
        const imgR = img.naturalWidth / img.naturalHeight;
        const frmR = dw / dh;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgR > frmR) { sw = img.naturalHeight * frmR; sx = (img.naturalWidth - sw) / 2; }
        else { sh = img.naturalWidth / frmR; sy = (img.naturalHeight - sh) / 2; }
        c.drawImage(img, sx, sy, sw, sh, cx - dw / 2, cy - dh / 2, dw, dh);
        
        // Premium Gold Glowing Border
        c.strokeStyle = `rgba(255, 215, 0, ${fa * 0.8})`;
        c.lineWidth = 4;
        c.shadowColor = `rgba(255, 215, 0, ${fa})`;
        c.shadowBlur = 20;
        drawArchPath(c, cx - dw / 2, cy - dh / 2, dw, dh, br);
        c.stroke();
        c.restore();
      }
    }

    /* 🇮🇳 PROCEDURAL FLAG MESH (Cloth Simulation) */
    function drawFlagMesh(t: number, elapsed: number) {
      if (t < 6) return;
      const flagAlpha = clamp((t - 6) * 1.5, 0, 1);
      const riseY = lerp(H * 1.5, H * 0.15, eOB((t - 6) / 3));

      const flagW = W * 0.5;
      const flagH = flagW * (2/3);
      const cx = W * 0.5;

      c.save();
      c.globalAlpha = flagAlpha;

      const cols = 40, rows = 20;
      const cellW = flagW / cols, cellH = flagH / rows;
      const points: {x: number, y: number, z: number, shade: number}[][] = [];
      
      // Cloth Wind Solver
      for (let y = 0; y <= rows; y++) {
        points[y] = [];
        for (let x = 0; x <= cols; x++) {
          const wind1 = Math.sin(x * 0.15 + elapsed * 3) * 25;
          const wind2 = Math.sin(y * 0.2 - elapsed * 2 + x * 0.05) * 15;
          const flutter = Math.sin(x * 0.8 + elapsed * 10) * 5;
          const z = (wind1 + wind2 + flutter) / 45;
          const shade = clamp(0.4 + z * 0.6, 0, 1);
          const px = cx - flagW/2 + x * cellW + (z * 15);
          const py = riseY + y * cellH;
          points[y][x] = { x: px, y: py, z, shade };
        }
      }

      // Render Mesh Quads
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const p1 = points[y][x], p2 = points[y][x+1], p3 = points[y+1][x], p4 = points[y+1][x+1];
          const avgShade = (p1.shade + p2.shade + p3.shade + p4.shade) / 4;
          
          let baseColor = [0, 0, 0];
          if (y < rows / 3) baseColor = [255, 153, 51];
          else if (y < rows * 2 / 3) baseColor = [255, 255, 255];
          else baseColor = [18, 136, 8];

          const r = ACESFilmic(baseColor[0] * avgShade / 255) * 255;
          const g = ACESFilmic(baseColor[1] * avgShade / 255) * 255;
          const b = ACESFilmic(baseColor[2] * avgShade / 255) * 255;

          c.fillStyle = `rgb(${r}, ${g}, ${b})`;
          c.beginPath();
          c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.lineTo(p4.x, p4.y); c.lineTo(p3.x, p3.y);
          c.closePath();
          c.fill();
        }
      }

      // Ashoka Chakra
      const chakraX = cx + points[Math.floor(rows/2)][Math.floor(cols/2)].x - cx;
      const chakraY = riseY + flagH / 2;
      c.save();
      c.translate(chakraX, chakraY);
      c.rotate(elapsed * 0.08);
      const radius = flagH * 0.16;
      const metalGrad = c.createRadialGradient(0, 0, 0, 0, 0, radius);
      metalGrad.addColorStop(0, '#1a1a8a'); metalGrad.addColorStop(0.7, '#000050'); metalGrad.addColorStop(1, '#000030');
      c.strokeStyle = metalGrad; c.lineWidth = radius * 0.1;
      c.beginPath(); c.arc(0, 0, radius, 0, Math.PI * 2); c.stroke();
      c.lineWidth = radius * 0.05;
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        c.beginPath();
        c.moveTo(Math.cos(angle) * radius * 0.1, Math.sin(angle) * radius * 0.1);
        c.lineTo(Math.cos(angle) * radius * 0.95, Math.sin(angle) * radius * 0.95);
        c.strokeStyle = metalGrad; c.stroke();
      }
      c.fillStyle = metalGrad;
      c.beginPath(); c.arc(0, 0, radius * 0.18, 0, Math.PI * 2); c.fill();
      c.strokeStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(elapsed*2)*0.2})`;
      c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, radius * 1.08, 0, Math.PI * 2); c.stroke();
      c.restore();

      // Flag Pole
      const poleGrad = c.createLinearGradient(cx - flagW/2 - 10, 0, cx - flagW/2 + 10, 0);
      poleGrad.addColorStop(0, '#3a2a1a'); poleGrad.addColorStop(0.5, '#8B4513'); poleGrad.addColorStop(1, '#3a2a1a');
      c.fillStyle = poleGrad;
      c.fillRect(cx - flagW/2 - 10, riseY - 50, 20, H);
      c.fillStyle = '#FFD700';
      c.beginPath(); c.arc(cx - flagW/2, riseY - 50, 12, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    /* ✈️ JETS & VOLUMETRIC SMOKE */
    function drawJets(t: number) {
      if (t < 8 || t > 11) return;
      const activeJets = jets.filter(j => j.x < W + 500);
      activeJets.forEach(jet => {
        jet.x += jet.vx; jet.y += jet.vy;

        // Spawn Smoke
        if (Math.random() < 0.8) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = jet.x - 30 * jet.scale; p.y = jet.y + 5 * jet.scale;
            p.vx = -2 + Math.random(); p.vy = (Math.random() - 0.5) * 1;
            p.life = 3; p.ml = 3; p.sz = 20 * jet.scale + Math.random() * 20;
            const hex = jet.smokeColor.replace('#', '');
            p.r = parseInt(hex.substring(0, 2), 16);
            p.g = parseInt(hex.substring(2, 4), 16);
            p.b = parseInt(hex.substring(4, 6), 16);
            p.a = 0.6; p.tp = 4; // smoke
          }
        }

        // Sukhoi Silhouette
        c.save();
        c.translate(jet.x, jet.y);
        c.scale(jet.scale, jet.scale);
        const burnerGrad = c.createRadialGradient(-30, 0, 0, -30, 0, 40);
        burnerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        burnerGrad.addColorStop(0.2, 'rgba(100, 200, 255, 0.8)');
        burnerGrad.addColorStop(0.6, 'rgba(255, 150, 50, 0.6)');
        burnerGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
        c.fillStyle = burnerGrad;
        c.fillRect(-70, -20, 50, 40);

        c.fillStyle = '#0a0a0a';
        c.beginPath();
        c.moveTo(40, 0); c.quadraticCurveTo(20, -5, -10, -6); c.lineTo(-30, -4);
        c.lineTo(-30, 4); c.lineTo(-10, 6); c.quadraticCurveTo(20, 5, 40, 0); c.fill();

        c.fillStyle = 'rgba(20, 40, 80, 0.8)';
        c.beginPath(); c.ellipse(15, -1, 12, 4, 0, 0, Math.PI * 2); c.fill();

        c.fillStyle = '#111';
        c.beginPath(); c.moveTo(5, 0); c.lineTo(-25, -35); c.lineTo(-35, -35); c.lineTo(-15, 0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(5, 0); c.lineTo(-25, 35); c.lineTo(-35, 35); c.lineTo(-15, 0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-20, -2); c.lineTo(-35, -20); c.lineTo(-40, -20); c.lineTo(-25, -2); c.closePath(); c.fill();
        c.restore();
      });
    }

    /* 🎊 PARTICLES LOGIC */
    function spawnDust(t: number, elapsed: number) {
      if (t > 1 && Math.random() < 0.3) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = Math.random() * H;
          p.vx = Math.sin(elapsed + Math.random()*10) * 0.3; p.vy = -0.2 - Math.random() * 0.3;
          p.life = 5; p.ml = 5; p.sz = 1 + Math.random() * 2;
          p.r = 255; p.g = 200 + Math.random() * 55; p.b = 150; p.a = 0.4; p.tp = 1; // dust
        }
      }
      if (t > 9 && Math.random() < 0.4) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = -10;
          p.vx = (Math.random() - 0.5) * 3; p.vy = 1 + Math.random() * 3;
          p.life = 6; p.ml = 6; p.sz = 6 + Math.random() * 8;
          const ct = Math.random();
          if (ct < 0.33) { p.r = 255; p.g = 153; p.b = 51; }
          else if (ct < 0.66) { p.r = 255; p.g = 255; p.b = 255; }
          else { p.r = 18; p.g = 136; p.b = 7; }
          p.a = 1; p.rot = Math.random() * Math.PI * 2; p.rs = (Math.random() - 0.5) * 0.2; p.tp = 2; // confetti
        }
      }
    }

    function updateParticles(dt: number, elapsed: number) {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue;
        p.life -= dt; p.x += p.vx; p.y += p.vy;
        
        if (p.tp === 4) { p.sz += 0.5; p.vx *= 0.98; p.vy *= 0.98; p.life -= 0.015; } 
        else if (p.tp === 2) { p.rot += p.rs; p.vy += 0.05; p.vx += Math.sin(elapsed + p.y * 0.01) * 0.1; p.life -= 0.012; } 
        else if (p.tp === 3) { p.vy -= 0.02; p.vx += (Math.random() - 0.5) * 0.2; p.life -= 0.02; } 
        else { p.life -= 0.005; }

        if (p.life <= 0 || p.x < -100 || p.x > W + 100 || p.y > H + 100) p.on = false;
      }
    }

    function drawParticles() {
      for (const p of pl) {
        if (!p.on) continue;
        const alpha = clamp(p.life / p.ml, 0, 1) * p.a;
        if (p.tp === 4) { // smoke
          c.save();
          c.globalCompositeOperation = 'screen';
          const grad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
          grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = grad;
          c.fillRect(p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
          c.restore();
        } else if (p.tp === 1 || p.tp === 3) { // dust & ember
          c.save();
          c.globalCompositeOperation = 'screen';
          c.globalAlpha = alpha;
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},1)`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
          c.restore();
        } else if (p.tp === 2) { // confetti
          c.save();
          c.globalAlpha = alpha;
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.fillRect(-p.sz/2, -p.sz/4, p.sz, p.sz/2);
          c.restore();
        }
      }
    }

    /* 📜 TYPOGRAPHY */
    function drawTypography(t: number, elapsed: number) {
      if (t < 10) return;
      const textAlpha = clamp((t - 10) * 1.5, 0, 1);
      const titleY = lerp(H * 0.65, H * 0.4, eOE((t - 10) * 0.5));
      
      c.save();
      c.globalAlpha = textAlpha;
      c.textAlign = 'center';
      const fontSize = Math.min(W * 0.09, 90);
      c.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;
      
      c.shadowColor = 'rgba(255, 180, 50, 0.8)';
      c.shadowBlur = 40;
      c.fillStyle = 'rgba(255, 150, 0, 0.2)';
      c.fillText("HAPPY REPUBLIC DAY", W/2, titleY);
      
      c.shadowBlur = 0;
      const grad = c.createLinearGradient(0, titleY - fontSize/2, 0, titleY + fontSize/2);
      grad.addColorStop(0, '#FFFACD'); grad.addColorStop(0.4, '#FFD700');
      grad.addColorStop(0.6, '#DAA520'); grad.addColorStop(1, '#8B6914');
      c.fillStyle = grad;
      c.fillText("HAPPY REPUBLIC DAY", W/2, titleY);

      // Light Sweep
      c.save();
      c.beginPath();
      c.rect(W/2 - 500, titleY - fontSize, 1000, fontSize * 1.2);
      c.clip();
      const sweepX = W/2 - 500 + ((elapsed * 400) % 1200);
      const sweepGrad = c.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
      sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sweepGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      c.fillStyle = sweepGrad;
      c.fillRect(sweepX - 80, titleY - fontSize, 160, fontSize * 1.2);
      c.restore();

      c.font = `400 ${fontSize * 0.4}px 'Cinzel', Georgia, serif`;
      c.fillStyle = 'rgba(255, 255, 255, 0.9)';
      c.shadowColor = 'rgba(0, 0, 0, 0.8)';
      c.shadowBlur = 15;
      c.fillText("जय हिन्द", W/2, titleY + fontSize * 0.8);
      c.restore();
    }

    /* 🕊️ FINAL SCENE (13s - 15s) */
    function drawFinalScene(t: number, elapsed: number) {
      if (t < 13) return;
      const phase = clamp((t - 13) / 2, 0, 1);
      
      doves.forEach(d => { d.x += d.vx; d.y += d.vy; d.wing += 0.25; });

      // Full Screen Procedural Flag Wave
      c.save();
      c.globalAlpha = phase * 0.85;
      const flagH = H, flagW = H * 1.5;
      const fCols = 50, fRows = 30, fCellW = flagW / fCols, fCellH = flagH / fRows;

      for (let y = 0; y < fRows; y++) {
        for (let x = 0; x < fCols; x++) {
          const px = W/2 - flagW/2 + x * fCellW;
          const py = y * fCellH;
          const wave = Math.sin(x * 0.25 + elapsed * 3) * 30 + Math.sin(y * 0.4 + elapsed * 2) * 10;
          const shade = clamp(0.5 + (wave / 40) * 0.5, 0, 1);
          let color = [0,0,0];
          if (y < fRows / 3) color = [255, 153, 51];
          else if (y < fRows * 2 / 3) color = [255, 255, 255];
          else color = [18, 136, 8];
          const r = ACESFilmic(color[0] * shade / 255) * 255;
          const g = ACESFilmic(color[1] * shade / 255) * 255;
          const b = ACESFilmic(color[2] * shade / 255) * 255;
          c.fillStyle = `rgb(${r}, ${g}, ${b})`;
          c.fillRect(px + wave, py, fCellW + 1, fCellH + 1);
        }
      }
      c.restore();

      // Doves
      c.save();
      c.globalAlpha = phase;
      c.fillStyle = '#FFFFFF';
      c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 10;
      doves.forEach(d => {
        c.save();
        c.translate(d.x, d.y);
        const wingY = Math.sin(d.wing) * 12;
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-15, -wingY, -30, 0); c.quadraticCurveTo(-15, wingY * 0.5, 0, 0); c.fill();
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(15, -wingY, 30, 0); c.quadraticCurveTo(15, wingY * 0.5, 0, 0); c.fill();
        c.restore();
      });
      c.restore();

      // Final Text Reveal
      c.save();
      c.globalAlpha = phase;
      c.textAlign = 'center';
      c.font = `700 ${Math.min(W * 0.14, 140)}px 'Cinzel', Georgia, serif`;
      c.shadowColor = 'rgba(0, 0, 0, 0.9)'; c.shadowBlur = 50;
      const grad = c.createLinearGradient(0, H/2 - 70, 0, H/2 + 70);
      grad.addColorStop(0, '#FFFACD'); grad.addColorStop(0.5, '#FFD700'); grad.addColorStop(1, '#8B6914');
      c.fillStyle = grad;
      c.fillText("वंदे मातरम्", W/2, H/2);
      c.restore();
    }

    /* 🎞️ POST PROCESSING (Color Grade & Film FX) */
    function drawPostFX() {
      // 1. ACES Color Grade (Orange & Teal approximation)
      c.save();
      c.globalCompositeOperation = 'soft-light';
      const gradeGrad = c.createLinearGradient(0, 0, W, H);
      gradeGrad.addColorStop(0, 'rgba(255, 140, 50, 0.3)'); // Warm highlights
      gradeGrad.addColorStop(1, 'rgba(0, 50, 100, 0.4)');   // Cool shadows
      c.fillStyle = gradeGrad;
      c.fillRect(0, 0, W, H);
      c.restore();

      // 2. Cinematic Vignette
      const vignette = c.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
      c.fillStyle = vignette;
      c.fillRect(0, 0, W, H);

      // 3. Letterbox Bars (2.35:1 Aspect Ratio)
      const barH = H * 0.1;
      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, barH);
      c.fillRect(0, H - barH, W, barH);
      
      // 4. High Quality Film Grain
      c.save();
      c.globalCompositeOperation = 'overlay';
      c.globalAlpha = 0.04;
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0, 0, W, H); }
      c.restore();
    }

    /* 🎬 ANIMATION LOOP */
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

      spawnDust(t, now / 1000);
      updateParticles(dt, now / 1000);

      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, H);

      // Cinematic Camera System (Crane, Dolly, Handheld Breathing)
      const camDollyZ = lerp(1.0, 1.25, eOE(t / DUR));
      const camCraneY = lerp(0, -H * 0.1, eIO(t / DUR));
      const breatheX = Math.sin(t * 0.6) * 3 * (1 - t / DUR);
      const breatheY = Math.cos(t * 0.5) * 3 * (1 - t / DUR);
      const camRot = Math.sin(t * 0.2) * 0.005;
      const finalZoom = camDollyZ + Math.sin(t * 0.8) * 0.005;

      c.save();
      c.translate(W / 2 + breatheX, H / 2 + breatheY + camCraneY);
      c.rotate(camRot);
      c.scale(finalZoom, finalZoom);
      c.translate(-W / 2, -H / 2);

      drawAtmosphere(t, now / 1000);
      drawSunAndRays(t, now / 1000);
      drawFog(t, now / 1000);
      drawIndiaGate(t);
      drawTorch(t, now / 1000);
      drawArchAndImage(t);  // Your Supabase Image inside the arch
      drawFlagMesh(t, now / 1000); // Procedural cloth flag rising
      drawJets(t);
      drawParticles();
      drawTypography(t, now / 1000);
      drawFinalScene(t, now / 1000);

      c.restore();

      drawPostFX();

      raf.current = requestAnimationFrame(loop);
    }

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
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
