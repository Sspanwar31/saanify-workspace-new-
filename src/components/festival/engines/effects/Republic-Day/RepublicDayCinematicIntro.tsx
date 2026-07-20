'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & INTERFACES (Physically Based Particles & Entities)
   ═══════════════════════════════════════════════════════════════ */
interface Particle {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  life: number; ml: number; sz: number;
  color: string; tp: number;
  rot: number; rs: number; on: boolean;
  r: number; g: number; b: number; a: number;
}

interface Jet {
  x: number; y: number; z: number; vx: number; vy: number;
  scale: number; smokeColor: string; active: boolean;
}

interface Dove {
  x: number; y: number; vx: number; vy: number; wing: number;
}

const POOL_SIZE = 4200;
const DUR = 15.0; // Hollywood Opener: 15.0 Seconds

const DEFAULT_IMG_URL = 'https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/india%20flag/india%20flag.png';

/* ═══════════════════════════════════════════════════════════════
   EASING HELPERS & CINEMATIC MATH
   ═══════════════════════════════════════════════════════════════ */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // Expo Out

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: NationalCinematicIntro
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void; imageUrl?: string }

export default function NationalCinematicIntro({ onComplete, imageUrl }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nationalImgRef = useRef<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = useState(false);
  
  const raf = useRef<number>(0);
  const t0 = useRef<number>(0);
  const done = useRef<boolean>(false);
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
    const a: Particle[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      a.push({
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
        life: 0, ml: 1, sz: 0, color: '',
        rot: 0, rs: 0, on: false, tp: 0,
        r: 255, g: 153, b: 51, a: 0
      });
    }
    return a;
  }, []);

  const grab = useCallback((p: Particle[]) => {
    for (let i = 0; i < p.length; i++) if (!p[i].on) return p[i];
    return null;
  }, []);

  /* ─── PROCEDURAL MILITARY PERCUSSION + STRINGS SYNTH ─── */
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
    const jets: Jet[] = [
      { x: -W * 0.3, y: H * 0.15, scale: 1, smokeColor: '#FF9933', vx: 12, vy: 4, active: true },
      { x: -W * 0.35, y: H * 0.20, scale: 0.9, smokeColor: '#FFFFFF', vx: 12, vy: 4, active: true },
      { x: -W * 0.4, y: H * 0.25, scale: 0.8, smokeColor: '#138808', vx: 12, vy: 4, active: true }
    ];
    const doves: Dove[] = Array.from({ length: 8 }, (_, i) => ({
      x: W * (0.1 + i * 0.12),
      y: H * (0.7 + Math.random() * 0.2),
      vx: 1.5 + Math.random(),
      vy: -0.8 - Math.random() * 0.4,
      wing: Math.random() * Math.PI * 2
    }));

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

    /* 🌌 ATMOSPHERE & SKY (Night -> Dawn -> Saffron Sunrise) */
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

      // Stars (Slowly fades as sunrise approaches)
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

    /* ⭐ STAR RENDERING (dStars implementation) */
    function dStars(t: number) {
      if (t > 7) return;
      const alpha = clamp(1 - t / 7, 0, 1);
      c.save();
      c.globalAlpha = alpha;
      for (let i = 0; i < starI.length; i++) {
        const idx = starI[i];
        const p = pl[idx];
        if (p && p.on) {
          const twinkle = Math.sin(t * 3.5 + i) * 0.4 + 0.6;
          c.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a * twinkle})`;
          c.beginPath();
          c.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
    }

    /* ☀️ SUN & VOLUMETRIC GOD RAYS */
    function drawSunAndRays(t: number, elapsed: number) {
      if (t < 4) return;
      const sunY = lerp(H * 1.1, H * 0.38, eOE((t - 4) / 5));
      const sunX = W * 0.5;
      const intensity = clamp((t - 4) * 0.5, 0, 1);

      c.save();
      c.globalCompositeOperation = 'screen';
      
      // Volumetric Sun Glow
      const bloomGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.7);
      bloomGrad.addColorStop(0, `rgba(255, 240, 200, ${0.8 * intensity})`);
      bloomGrad.addColorStop(0.2, `rgba(255, 180, 80, ${0.5 * intensity})`);
      bloomGrad.addColorStop(0.5, `rgba(255, 100, 30, ${0.15 * intensity})`);
      bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = bloomGrad;
      c.fillRect(0, 0, W, H);

      // Sun Core
      const coreGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, 90);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
      coreGrad.addColorStop(0.4, `rgba(255, 245, 200, ${0.8 * intensity})`);
      coreGrad.addColorStop(1, 'rgba(255, 180, 80, 0)');
      c.fillStyle = coreGrad;
      c.fillRect(sunX - 90, sunY - 90, 180, 180);

      // God Rays
      const rayIntensity = clamp((t - 5) * 0.4, 0, 0.75);
      if (rayIntensity > 0) {
        c.translate(sunX, sunY);
        c.rotate(Math.sin(elapsed * 0.05) * 0.02);
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2 + elapsed * 0.01;
          const length = H * 1.2;
          const width = 60 + Math.sin(elapsed * 2 + i) * 30;
          c.save();
          c.rotate(angle);
          const rayGrad = c.createLinearGradient(0, 0, 0, length);
          rayGrad.addColorStop(0, `rgba(255, 235, 180, ${0.15 * rayIntensity})`);
          rayGrad.addColorStop(0.5, `rgba(255, 200, 130, ${0.08 * rayIntensity})`);
          rayGrad.addColorStop(1, 'rgba(255, 200, 130, 0)');
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

    /* 💨 VOLUMETRIC FOG & ATMOSPHERIC SCATTERING */
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

    /* 🔥 AMAR JAWAN JYOTI (Flickering Flame Base) */
    function drawTorch(t: number, elapsed: number) {
      const tx = W * 0.5;
      const ty = H * 0.795; // Base level of the central arch
      
      if (t > 1.5) {
        const fireAlpha = clamp((t - 1.5) * 2, 0, 1);
        c.save();
        c.globalAlpha = fireAlpha;
        c.globalCompositeOperation = 'lighter';
        
        // Soft ambient warm glow behind torch
        const glowGrad = c.createRadialGradient(tx, ty, 0, tx, ty, 120);
        glowGrad.addColorStop(0, 'rgba(255, 130, 40, 0.85)');
        glowGrad.addColorStop(0.4, 'rgba(255, 70, 10, 0.35)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        c.fillStyle = glowGrad;
        c.fillRect(tx - 120, ty - 120, 240, 240);

        // Realistic flickering smaller flame core
        const flicker = Math.sin(elapsed * 28) * 3;
        const flameH = 40 + flicker;
        const flameW = 10;

        const fireGrad = c.createLinearGradient(tx, ty, tx, ty - flameH);
        fireGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        fireGrad.addColorStop(0.2, 'rgba(255, 200, 60, 0.95)');
        fireGrad.addColorStop(0.6, 'rgba(255, 80, 0, 0.6)');
        fireGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        c.fillStyle = fireGrad;

        c.beginPath();
        c.moveTo(tx - flameW, ty);
        c.quadraticCurveTo(tx - flameW * 0.4, ty - flameH * 0.5, tx, ty - flameH);
        c.quadraticCurveTo(tx + flameW * 0.4, ty - flameH * 0.5, tx + flameW, ty);
        c.closePath();
        c.fill();

        // Delicate rising sparks
        if (Math.random() < 0.25) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = tx + (Math.random() - 0.5) * 8;
            p.y = ty - 5; p.vx = (Math.random() - 0.5) * 0.6;
            p.vy = -1.2 - Math.random() * 1.8; p.life = 2.0; p.ml = 2.0;
            p.sz = 0.8 + Math.random() * 1.2;
            p.r = 255; p.g = 150 + Math.random() * 80; p.b = 40; p.a = 0.95;
            p.tp = 3; // ember
          }
        }
        c.restore();
      }
    }

    /* 🏛️ INDIA GATE (Aspect-Ratio Locked & Warm Sandstone Styled) */
    function drawIndiaGate(t: number) {
      const sc = Math.min(W, H);
      const gateH = sc * 0.68;
      const gateW = gateH * 0.86;
      const baseY = H * 0.82;
      const cx = W * 0.5;

      c.save();
      const reveal = clamp((t - 1) * 0.5, 0, 1);
      c.globalAlpha = reveal * 0.9;

      // Real Sandstone Color Palette
      const stoneBase = '#ca865a';
      const stoneDark = '#79472e';
      const stoneHighlight = '#eed0b7';
      
      const drawBlock = (x: number, y: number, width: number, height: number, depthLayer = true) => {
        const grad = c.createLinearGradient(x, y, x, y + height);
        grad.addColorStop(0, stoneHighlight);
        grad.addColorStop(0.3, stoneBase);
        grad.addColorStop(1, stoneDark);
        c.fillStyle = grad;
        c.fillRect(x, y, width, height);

        if (depthLayer) {
          c.fillStyle = 'rgba(255,255,255,0.12)';
          c.fillRect(x, y, width, 1.5); // Rim highlight
          c.fillStyle = 'rgba(0,0,0,0.25)';
          c.fillRect(x, y + height - 2, width, 2); // Shadow base
        }
      };

      // 1. Base steps of the structure
      drawBlock(cx - gateW * 0.54, baseY - 16, gateW * 1.08, 16);
      drawBlock(cx - gateW * 0.5, baseY - 32, gateW, 16);

      // 2. Main pillars (Left & Right flanking pillars)
      const pillarW = gateW * 0.28;
      const pillarH = gateH * 0.73;
      const pillarY = baseY - 32 - pillarH;
      
      // Left side structural base
      drawBlock(cx - gateW * 0.48, pillarY, pillarW, pillarH);
      // Right side structural base
      drawBlock(cx + gateW * 0.48 - pillarW, pillarY, pillarW, pillarH);

      // Visual Fluting & Columns (Adding beautiful shadow offsets to remove flat looks)
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.fillRect(cx - gateW * 0.48 + pillarW - 8, pillarY, 8, pillarH);
      c.fillRect(cx + gateW * 0.48 - pillarW, pillarY, 8, pillarH);

      // 3. Central Archway Framework (Soft translucent edges instead of solid pitch black blocks)
      const cArchW = gateW * 0.42;
      const cArchH = gateH * 0.56;
      const cArchY = baseY - 32 - cArchH;

      c.save();
      c.beginPath();
      c.moveTo(cx - cArchW/2, baseY - 32);
      c.lineTo(cx - cArchW/2, cArchY + cArchW/2);
      c.arc(cx, cArchY + cArchW/2, cArchW/2, Math.PI, 0, false);
      c.lineTo(cx + cArchW/2, baseY - 32);
      c.closePath();
      
      // Paint an atmospheric deep radial shadow outlining the arch beautifully
      const archShadow = c.createRadialGradient(cx, cArchY + cArchW/2, cArchW * 0.2, cx, cArchY + cArchW/2, cArchW * 0.52);
      archShadow.addColorStop(0, 'rgba(0,0,0,0)');
      archShadow.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = archShadow;
      c.fill();
      c.restore();

      // 4. Lintel & Arch Crown (Architectural Beams)
      const lintelH = gateH * 0.12;
      drawBlock(cx - gateW * 0.52, pillarY - lintelH, gateW * 1.04, lintelH);

      // 5. High attic/top structure layers (Elegantly textured blocks)
      drawBlock(cx - gateW * 0.45, pillarY - lintelH - 24, gateW * 0.9, 24);
      drawBlock(cx - gateW * 0.36, pillarY - lintelH - 46, gateW * 0.72, 22);
      
      // Dome Canopy atop the Gate
      c.beginPath();
      c.moveTo(cx - gateW * 0.18, pillarY - lintelH - 46);
      c.quadraticCurveTo(cx, pillarY - lintelH - 72, cx + gateW * 0.18, pillarY - lintelH - 46);
      c.closePath();
      c.fillStyle = stoneDark;
      c.fill();

      // 6. Smaller side architectural arches
      [-1, 1].forEach(side => {
        const archX = cx + side * (gateW * 0.34);
        const archW = gateW * 0.085;
        const archH = gateH * 0.26;
        const archY = baseY - 32 - archH;

        c.beginPath();
        c.moveTo(archX - archW/2, archY + archH);
        c.lineTo(archX - archW/2, archY + archW/2);
        c.arc(archX, archY + archW/2, archW/2, Math.PI, 0, false);
        c.lineTo(archX + archW/2, archY + archH);
        c.closePath();
        c.fillStyle = 'rgba(0,0,0,0.45)';
        c.fill();
      });

      c.restore();
    }

    /* 🏆 GOLDEN ARCH & SUPABASE IMAGE (Beautifully scaled behind India Gate) */
    function drawArchAndImage(t: number) {
      if (t < 3.5) return;
      let fa = 0;
      if (t >= 3.5 && t < 5.0) fa = eIO((t - 3.5) / 1.5);
      else if (t >= 5.0 && t < 10.5) fa = 1;
      else if (t >= 10.5 && t < 11.5) fa = 1 - eOC((t - 10.5) / 1.0);
      if (fa <= 0) return;
      
      const cx = W / 2, cy = H / 2 - H * 0.03, sc = Math.min(W, H), dw = sc * 0.35, dh = dw * 1.25, br = dw * 0.055;
      
      const img = nationalImgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        c.save();
        c.globalAlpha = fa;
        drawArchPath(c, cx - dw / 2, cy - dh / 2, dw, dh, br);
        c.clip();
        
        // Object cover calculations
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

    /* ✈️ JETS & VOLUMETRIC SMOKE */
    function drawJets(t: number) {
      if (t < 2.0 || t > 7.5) return;
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

        // Silhouette
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
      if (t > 5.0 && Math.random() < 0.4) {
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

    /* 🔆 ASHOKA SPOKE GLOW BEAMS */
    function dChakraSpokes(t: number) {
      if (t < 7.0 || t > 11.5) return;
      let alpha = t < 8.0 ? eOC((t - 7.0) / 1.0) : t < 10.0 ? 1 : 1 - eOC((t - 10.0) / 1.5);
      if (alpha <= 0) return;
      const cx = W / 2, cy = H / 2, sc = Math.min(W, H), or = Math.max(W, H) * 0.9, spokes = 24;
      c.save(); c.globalAlpha = alpha * 0.12; c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < spokes; i++) {
        const ang = (i / spokes) * Math.PI * 2 + t * 0.08;
        c.beginPath(); c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(ang) * or, cy + Math.sin(ang) * or);
        c.strokeStyle = 'rgba(30,70,160,0.55)'; c.stroke();
      }
      c.restore();
    }

    /* 📜 TYPOGRAPHY */
    function drawTypography(t: number, elapsed: number) {
      if (t < 11.5) return;
      const textAlpha = clamp((t - 11.5) * 1.5, 0, 1);
      const titleY = lerp(H * 0.65, H * 0.4, eOE((t - 11.5) * 0.5));
      
      c.save();
      c.globalAlpha = textAlpha;
      c.textAlign = 'center';
      const fontSize = Math.min(W * 0.09, 90);
      c.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;
      
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.8)';
      c.fillText("HAPPY REPUBLIC DAY", W/2 + 2, titleY + 2);
      
      // Gold Foil Gradient
      const grad = c.createLinearGradient(0, titleY - fontSize/2, 0, titleY + fontSize/2);
      grad.addColorStop(0, '#FFFACD'); grad.addColorStop(0.4, '#FFD700');
      grad.addColorStop(0.6, '#DAA520'); grad.addColorStop(1, '#8B6914');
      c.fillStyle = grad;
      c.fillText("HAPPY REPUBLIC DAY", W/2, titleY);

      // Slogans under main title
      if (t > 12.4) {
        const ss = Math.min(W * 0.022, H * 0.026, 18);
        c.font = `400 ${ss}px 'Georgia', serif`;
        c.fillStyle = 'rgba(0,0,0,0.7)';
        c.fillText('सत्यमेव जयते  •  वन्दे मातरम्', W / 2 + 1.5, titleY + fontSize * 0.85 + 1.5);
        c.fillStyle = '#ffd700';
        c.fillText('सत्यमेव जयते  •  वन्दे मातरम्', W / 2, titleY + fontSize * 0.85);
      }
      c.restore();
    }

    /* 🕊️🕊️ FLYING DOVES */
    function drawDoves(t: number, elapsed: number) {
      if (t < 12.5) return;
      const phaseAlpha = clamp((t - 12.5) / 1.5, 0, 1);

      c.save();
      c.globalAlpha = phaseAlpha;
      c.fillStyle = '#FFFFFF';
      c.shadowColor = 'rgba(0,0,0,0.2)';
      c.shadowBlur = 8;

      doves.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        d.wing += 0.22;

        c.save();
        c.translate(d.x, d.y);
        const wingY = Math.sin(d.wing) * 12;

        // Left wing
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(-15, -wingY, -30, 0);
        c.quadraticCurveTo(-15, wingY * 0.5, 0, 0);
        c.fill();

        // Right wing
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(15, -wingY, 30, 0);
        c.quadraticCurveTo(15, wingY * 0.5, 0, 0);
        c.fill();

        // Body
        c.beginPath();
        c.ellipse(0, 2, 4, 10, 0, 0, Math.PI * 2);
        c.fill();

        c.restore();
      });

      c.restore();
    }

    /* 🎞️ POST PROCESSING (Color Grade & Vignette) */
    function drawPostFX() {
      c.save();
      c.globalCompositeOperation = 'soft-light';
      const gradeGrad = c.createLinearGradient(0, 0, W, H);
      gradeGrad.addColorStop(0, 'rgba(255, 140, 50, 0.25)'); 
      gradeGrad.addColorStop(1, 'rgba(0, 50, 100, 0.35)');   
      c.fillStyle = gradeGrad;
      c.fillRect(0, 0, W, H);
      c.restore();

      // Vignette
      const vignette = c.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
      c.fillStyle = vignette;
      c.fillRect(0, 0, W, H);

      // High Quality Film Grain
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

      // Handheld camera movement
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

      // Dynamic Layering Sequence (Depth Order)
      drawAtmosphere(t, now / 1000);
      drawSunAndRays(t, now / 1000); // ☀️ Sun rays in depth back
      dStars(t); 
      drawArchAndImage(t);           // Waving Indian flag inside the window
      drawIndiaGate(t);              // Elegant Sandstone Gate naturally frames the image
      drawTorch(t, now / 1000);      // Realistically proportioned flickering flame
      drawFog(t, now / 1000);        // Volumetric mist blending layers
      drawJets(t);                
      drawParticles();
      dChakraSpokes(t);
      drawTypography(t, now / 1000);
      drawDoves(t, now / 1000);   

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
