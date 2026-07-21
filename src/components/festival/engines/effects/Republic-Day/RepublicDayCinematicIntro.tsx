'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & INTERFACES (Physically Based Particles & Entities)
   ═══════════════════════════════════════════════════════════════ */
interface Particle {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  life: number; ml: number; sz: number;
  color: string; tp: number; // 1: dust, 2: color sand, 3: ember, 4: smoke
  rot: number; rs: number; on: boolean;
  r: number; g: number; b: number; a: number;
}

interface Jet {
  x: number; y: number; scale: number; smokeColor: string; vx: number; vy: number; active: boolean;
}

interface Cloud {
  x: number; y: number; sz: number; speed: number; opacity: number;
}

interface SittingDove {
  x: number; y: number; vx: number; vy: number; wing: number;
  state: 'sitting' | 'flying';
  side: 'left' | 'right';
  bobOffset: number;
}

const POOL_SIZE = 4000;
const DUR = 15.0; // Total Cinematic Duration

/* ═══════════════════════════════════════════════════════════════
   EASING HELPERS & CINEMATIC MATH
   ═══════════════════════════════════════════════════════════════ */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // Expo Out

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: RepublicDayCinematicIntro
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void }

export default function RepublicDayCinematicIntro({ onComplete }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const raf = useRef<number>(0);
  const t0 = useRef<number>(0);
  const done = useRef<boolean>(false);
  const cbR = useRef(onComplete);
  cbR.current = onComplete;

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
    
    // Initialize procedural Clouds
    const clouds: Cloud[] = Array.from({ length: 6 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.4,
      sz: 180 + Math.random() * 140,
      speed: 0.15 + Math.random() * 0.2,
      opacity: 0.15 + Math.random() * 0.2
    }));

    // Crossing Jets Setup
    const jets: Jet[] = [
      { x: -W * 0.3, y: H * 0.16, scale: 0.95, smokeColor: '#FF9933', vx: 5.5, vy: 0.8, active: true },
      { x: W + W * 0.3, y: H * 0.20, scale: 0.90, smokeColor: '#FFFFFF', vx: -5.5, vy: 0.6, active: true },
      { x: -W * 0.45, y: H * 0.24, scale: 0.85, smokeColor: '#138808', vx: 5.5, vy: 0.4, active: true }
    ];

    const starI: number[] = [];
    for (let i = 0; i < 120; i++) {
      const p = pl[i]; p.on = true; p.tp = 0;
      p.x = Math.random() * W; p.y = Math.random() * H * 0.75;
      p.vx = 0; p.vy = 0;
      p.sz = Math.random() * 1.2 + 0.2; p.ml = 999; p.life = 999;
      p.r = 180; p.g = 200; p.b = 255;
      p.a = Math.random() * 0.4 + 0.05; p.rot = 0; p.rs = 0;
      starI.push(i);
    }

    // Dynamic Sizing Metrics for India Gate (Needed for Sitting Doves positioning)
    const sc = Math.min(window.innerWidth, window.innerHeight);
    const gateH = sc * 0.66;
    const gateW = gateH * 0.84;
    const baseY = window.innerHeight * 0.82;
    const cx = window.innerWidth * 0.5;
    const pillarH = gateH * 0.72;
    const pillarY = baseY - 32 - pillarH; // Sitting ledge height

    // Initialize 14 pigeons sitting on the India Gate molding ledges
    const dovesList: SittingDove[] = [];
    // Left side ledge pigeons
    for (let i = 0; i < 7; i++) {
      dovesList.push({
        x: cx - gateW * 0.42 + (gateW * 0.16) * (i / 6),
        y: pillarY - 2, // Sitting flush on top of the left ledge
        vx: 0,
        vy: 0,
        wing: Math.random() * Math.PI * 2,
        state: 'sitting',
        side: 'left',
        bobOffset: Math.random() * 10
      });
    }
    // Right side ledge pigeons
    for (let i = 0; i < 7; i++) {
      dovesList.push({
        x: cx + gateW * 0.26 + (gateW * 0.16) * (i / 6),
        y: pillarY - 2, // Sitting flush on top of the right ledge
        vx: 0,
        vy: 0,
        wing: Math.random() * Math.PI * 2,
        state: 'sitting',
        side: 'right',
        bobOffset: Math.random() * 10
      });
    }

    /* ═══════════════════════════════════════════════════════════
       LEXICALLY SCOPED DRAWING FUNCTIONS (Prevents Scoping Bugs)
       ═══════════════════════════════════════════════════════════ */
    
    // LAYER 1: SKY (Smooth Dawn Transition)
    const drawSky = (t: number, elapsed: number, sceneAlpha: number) => {
      c.save();
      c.globalAlpha = sceneAlpha;
      const phase1 = clamp(t / 6, 0, 1); 
      const phase2 = clamp((t - 4) / 6, 0, 1);
      const phase3 = clamp((t - 8) / 7, 0, 1);

      const r = lerp(lerp(8, 35, phase1), lerp(255, 255, phase3), phase2);
      const g = lerp(lerp(12, 55, phase1), lerp(130, 195, phase3), phase2);
      const b = lerp(lerp(30, 85, phase1), lerp(50, 120, phase3), phase2);

      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgb(${r * 0.45},${g * 0.45},${b * 0.75})`);
      grad.addColorStop(0.5, `rgb(${r * 0.75},${g * 0.65},${b * 0.55})`);
      grad.addColorStop(1, `rgb(${r},${g * 0.85},${b * 0.35})`);
      c.fillStyle = grad;
      c.fillRect(0, 0, W, H);
      c.restore();
    };

    // LAYER 2: CLOUDS (Procedural Drifting)
    const drawClouds = (t: number, sceneAlpha: number) => {
      c.save();
      c.globalAlpha = sceneAlpha;
      clouds.forEach(cl => {
        cl.x += cl.speed;
        if (cl.x - cl.sz > W) cl.x = -cl.sz;

        const grad = c.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, cl.sz);
        grad.addColorStop(0, `rgba(255, 235, 220, ${cl.opacity})`);
        grad.addColorStop(0.5, `rgba(255, 200, 170, ${cl.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(255, 200, 170, 0)');
        c.fillStyle = grad;
        c.beginPath();
        c.arc(cl.x, cl.y, cl.sz, 0, Math.PI * 2);
        c.fill();
      });
      c.restore();
    };

    // LAYER 3: VOLUMETRIC FOG (Dissipates progressively)
    const drawFog = (t: number, elapsed: number, sceneAlpha: number) => {
      const fogIntensity = clamp(2.5 - (t / 4), 0, 1) * sceneAlpha;
      if (fogIntensity <= 0) return;

      c.save();
      c.globalAlpha = fogIntensity;
      c.globalCompositeOperation = 'screen';
      
      const offset = elapsed * 10;
      const hazeGrad = c.createLinearGradient(0, H * 0.4, 0, H);
      hazeGrad.addColorStop(0, 'rgba(50, 60, 80, 0)');
      hazeGrad.addColorStop(0.7, 'rgba(180, 190, 210, 0.25)');
      hazeGrad.addColorStop(1, 'rgba(235, 240, 250, 0.45)');
      c.fillStyle = hazeGrad;
      c.fillRect(0, H * 0.4, W, H * 0.6);

      for(let i = 0; i < 4; i++) {
        const x = (i * W * 0.4 + offset) % (W * 1.5) - W * 0.2;
        const y = H * (0.65 + i * 0.05);
        const grad = c.createRadialGradient(x, y, 0, x, y, 500);
        grad.addColorStop(0, 'rgba(240, 245, 255, 0.12)');
        grad.addColorStop(1, 'rgba(240, 245, 255, 0)');
        c.fillStyle = grad;
        c.fillRect(x - 500, y - 500, 1000, 1000);
      }
      c.restore();
    };

    // LAYER 4: INDIA GATE (Majestic 3D Perspective Sandstone)
    const drawIndiaGate = (t: number, sceneAlpha: number) => {
      const reveal = clamp((t - 1.0) * 0.4, 0, 1);
      c.save();
      c.globalAlpha = reveal * sceneAlpha;

      const baseColor = '#c1805b';
      const shadowColor = '#6d3c26';
      const highlightColor = '#eed2bc';
      
      const draw3DBlock = (x: number, y: number, width: number, height: number, depth: number) => {
        const frontGrad = c.createLinearGradient(x, y, x, y + height);
        frontGrad.addColorStop(0, highlightColor);
        frontGrad.addColorStop(0.3, baseColor);
        frontGrad.addColorStop(1, shadowColor);
        c.fillStyle = frontGrad;
        c.fillRect(x, y, width, height);

        const sideGrad = c.createLinearGradient(x + width, y, x + width + depth, y + height);
        sideGrad.addColorStop(0, shadowColor);
        sideGrad.addColorStop(1, '#3b1c10');
        c.fillStyle = sideGrad;
        c.beginPath();
        c.moveTo(x + width, y);
        c.lineTo(x + width + depth, y + depth);
        c.lineTo(x + width + depth, y + height + depth);
        c.lineTo(x + width, y + height);
        c.closePath();
        c.fill();

        c.fillStyle = highlightColor;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + depth, y - depth);
        c.lineTo(x + width + depth, y - depth);
        c.lineTo(x + width, y);
        c.closePath();
        c.fill();
      };

      draw3DBlock(cx - gateW * 0.52, baseY - 16, gateW * 1.04, 16, 5);
      draw3DBlock(cx - gateW * 0.48, baseY - 32, gateW * 0.96, 16, 4);

      draw3DBlock(cx - gateW * 0.46, pillarY, pW, pillarH, 6);
      draw3DBlock(cx + gateW * 0.46 - pW, pillarY, pW, pillarH, 6);

      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.fillRect(cx - gateW * 0.48 + pW - 8, pillarY, 8, pillarH);
      c.fillRect(cx + gateW * 0.48 - pW, pillarY, 8, pillarH);

      const cArchW = gateW * 0.44;
      const cArchH = gateH * 0.54;
      const cArchY = baseY - 32 - cArchH;

      c.save();
      c.beginPath();
      c.moveTo(cx - cArchW/2, baseY - 32);
      c.lineTo(cx - cArchW/2, cArchY + cArchW/2);
      c.arc(cx, cArchY + cArchW/2, cArchW/2, Math.PI, 0, false);
      c.lineTo(cx + cArchW/2, baseY - 32);
      c.closePath();
      const archShadow = c.createRadialGradient(cx, cArchY + cArchW/2, cArchW * 0.1, cx, cArchY + cArchW/2, cArchW * 0.5);
      archShadow.addColorStop(0, 'rgba(0,0,0,0)');
      archShadow.addColorStop(1, 'rgba(0,0,0,0.65)');
      c.fillStyle = archShadow;
      c.fill();
      c.restore();

      draw3DBlock(cx - gateW * 0.5, pillarY - gateH * 0.1, gateW * 1.0, gateH * 0.1, 8);
      draw3DBlock(cx - gateW * 0.42, pillarY - gateH * 0.22, gateW * 0.84, gateH * 0.12, 10);
      
      c.beginPath();
      c.moveTo(cx - gateW * 0.2, pillarY - gateH * 0.22);
      c.quadraticCurveTo(cx, pY - gateH * 0.35, cx + gateW * 0.2, pillarY - gateH * 0.22);
      c.closePath();
      c.fillStyle = shadowColor;
      c.fill();

      c.restore();
    };

    // LAYER 5: AMAR JAWAN JYOTI (Flame)
    const drawTorch = (t: number, elapsed: number, sceneAlpha: number) => {
      if (t < 2.0) return;
      const tx = W * 0.5;
      const ty = H * 0.795;
      
      const fireAlpha = clamp((t - 2.0) * 1.5, 0, 1) * sceneAlpha;
      c.save();
      c.globalAlpha = fireAlpha;
      c.globalCompositeOperation = 'lighter';
      
      const glowGrad = c.createRadialGradient(tx, ty, 0, tx, ty, 140);
      glowGrad.addColorStop(0, 'rgba(255, 120, 20, 0.9)');
      glowGrad.addColorStop(0.4, 'rgba(255, 60, 5, 0.35)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = glowGrad;
      c.fillRect(tx - 140, ty - 140, 280, 280);

      const flicker = Math.sin(elapsed * 32) * 4;
      const flameH = 42 + flicker;
      const flameW = 11;

      const fireGrad = c.createLinearGradient(tx, ty, tx, ty - flameH);
      fireGrad.addColorStop(0, '#ffffff');
      fireGrad.addColorStop(0.2, 'rgba(255, 210, 80, 0.95)');
      fireGrad.addColorStop(0.6, 'rgba(255, 90, 0, 0.6)');
      fireGrad.addColorStop(1, 'rgba(230, 0, 0, 0)');
      c.fillStyle = fireGrad;

      c.beginPath();
      c.moveTo(tx - flameW, ty);
      c.quadraticCurveTo(tx - flameW * 0.4, ty - flameH * 0.5, tx, ty - flameH);
      c.quadraticCurveTo(tx + flameW * 0.4, ty - flameH * 0.5, tx + flameW, ty);
      c.closePath();
      c.fill();
      c.restore();
    };

    // LAYER 6 & 7: WAVING FLAG & ASHOKA CHAKRA
    const drawWavingFlagAndChakra = (t: number, elapsed: number, sceneAlpha: number) => {
      if (t < 3.0) return;
      const revealAlpha = clamp((t - 3.0) * 1.2, 0, 1) * sceneAlpha;

      const scVal = Math.min(W, H);
      const fw = scVal * 0.38;
      const fh = fw * 0.66;
      const fx = W * 0.5 - fw / 2;
      const fy = H * 0.44 - fh / 2;

      c.save();
      c.globalAlpha = revealAlpha;

      const cols = 45;
      const colW = fw / cols;

      for (let i = 0; i < cols; i++) {
        const xOffset = i * colW;
        const targetX = fx + xOffset;
        const wave = Math.sin(i * 0.22 - elapsed * 3.8) * 8.5;
        const targetY = fy + wave;

        c.fillStyle = '#FF9933';
        c.fillRect(targetX, targetY, colW + 0.5, fh / 3);

        c.fillStyle = '#FFFFFF';
        c.fillRect(targetX, targetY + fh / 3, colW + 0.5, fh / 3);

        c.fillStyle = '#138808';
        c.fillRect(targetX, targetY + (fh * 2) / 3, colW + 0.5, fh / 3);
      }

      const cxVal = fx + fw / 2;
      const cyVal = fy + fh / 2 + Math.sin((cols / 2) * 0.22 - elapsed * 3.8) * 8.5;
      const cr = fh * 0.12;

      c.save();
      c.translate(cxVal, cyVal);
      c.rotate(elapsed * 0.6);

      c.strokeStyle = '#000080';
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(0, 0, cr, 0, Math.PI * 2);
      c.stroke();

      c.fillStyle = '#000080';
      c.beginPath();
      c.arc(0, 0, cr * 0.15, 0, Math.PI * 2);
      c.fill();

      c.lineWidth = 1.2;
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(angle) * cr, Math.sin(angle) * cr);
        c.stroke();
      }
      c.restore();
      c.restore();
    };

    // LAYER 8 & 9: SUKHOI JETS & TRAILS (Spawns Tricolor Sand Trails)
    const drawJetsAndTrails = (t: number, sceneAlpha: number) => {
      if (t < 2.5 || t > 9.0) return;
      c.save();
      c.globalAlpha = sceneAlpha;

      jets.forEach(jet => {
        jet.x += jet.vx; jet.y += jet.vy;

        // Emitters positioned at rear nozzle
        const nozzleX = jet.x - (jet.vx > 0 ? 32 : -32) * jet.scale;
        const nozzleY = jet.y + 2 * jet.scale;

        // Volumetric Smoke puffs
        if (Math.random() < 0.68) {
          const p = grab(pl); if (p) {
            p.on = true;
            p.x = nozzleX;
            p.y = nozzleY;
            p.vx = -jet.vx * 0.12 + (Math.random() - 0.5) * 0.35;
            p.vy = (Math.random() - 0.5) * 0.35;
            p.life = 4.0; p.ml = 4.0;
            p.sz = 14 * jet.scale + Math.random() * 14;

            const hex = jet.smokeColor.replace('#', '');
            p.r = parseInt(hex.substring(0, 2), 16);
            p.g = parseInt(hex.substring(2, 4), 16);
            p.b = parseInt(hex.substring(4, 6), 16);
            p.a = 0.58; p.tp = 4;
          }
        }

        // NOVELTY: High Density Tricolor fine Sand/Color drop emissions (Strictly Behind Jet Flight)
        if (Math.random() < 0.90) {
          const p = grab(pl); if (p) {
            p.on = true;
            p.x = nozzleX;
            p.y = nozzleY + (Math.random() - 0.5) * 6;
            p.vx = -jet.vx * 0.15 + (Math.random() - 0.5) * 0.4;
            p.vy = 0.6 + Math.random() * 1.2;
            p.life = 5.0; p.ml = 5.0;
            p.sz = 1.3 + Math.random() * 1.8; // Beautiful fine sand granules

            const hex = jet.smokeColor.replace('#', '');
            p.r = parseInt(hex.substring(0, 2), 16);
            p.g = parseInt(hex.substring(2, 4), 16);
            p.b = parseInt(hex.substring(4, 6), 16);
            p.a = 0.88; p.tp = 2; // Fine Color Sand Dust
          }
        }

        c.save();
        c.translate(jet.x, jet.y);
        c.rotate(Math.atan2(jet.vy, jet.vx));
        c.scale(jet.scale, jet.scale);

        const glow = c.createRadialGradient(-30, 0, 0, -30, 0, 30);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.3, 'rgba(255, 140, 0, 0.9)');
        glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        c.fillStyle = glow;
        c.fillRect(-55, -12, 35, 24);

        c.fillStyle = '#1c1c1c';
        c.beginPath();
        c.moveTo(35, 0);
        c.quadraticCurveTo(15, -4, -10, -5);
        c.lineTo(-24, -3);
        c.lineTo(-24, 3);
        c.lineTo(-10, 5);
        c.quadraticCurveTo(15, 4, 35, 0);
        c.fill();

        c.fillStyle = 'rgba(100, 190, 255, 0.8)';
        c.beginPath(); c.ellipse(12, -1, 10, 3, 0, 0, Math.PI * 2); c.fill();

        c.fillStyle = '#242424';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -26); c.lineTo(-24, -26); c.lineTo(-10, 0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, 26); c.lineTo(-24, 26); c.lineTo(-10, 0); c.closePath(); c.fill();
        c.restore();
      });
      c.restore();
    };

    // LAYER 10: PARTICLES ENGINE (Dust + Spectacular sky-wide Tricolor Rain)
    const spawnParticles = (t: number, elapsed: number) => {
      // 1. Ambient sparkles (dust)
      if (t > 1 && Math.random() < 0.25) {
        const p = grab(pl);
        if (p) {
          p.on = true;
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.vx = Math.sin(elapsed + Math.random() * 10) * 0.25;
          p.vy = -0.2 - Math.random() * 0.25;
          p.life = 5;
          p.ml = 5;
          p.sz = 1 + Math.random() * 1.5;
          p.r = 255;
          p.g = 210 + Math.random() * 45;
          p.b = 160;
          p.a = 0.35;
          p.tp = 1; // dust
        }
      }

      // 2. MAGICAL SKY-WIDE TRICOLOR COLOR RAIN (Starts after Jets are active t >= 3.2s)
      if (t >= 3.2 && t < 11.5) {
        const rainIntensity = 4; // High frequency spawn rate for screen-wide rain effect
        for (let i = 0; i < rainIntensity; i++) {
          const p = grab(pl);
          if (p) {
            p.on = true;
            p.x = Math.random() * W; // Scattered across entire canvas width
            p.y = -10 - Math.random() * 15; // Spawn right above the screen viewport
            p.vx = (Math.random() - 0.5) * 0.5; // Soft natural descent with minor sway
            p.vy = 1.5 + Math.random() * 2.0; // Falling down smoothly
            p.life = 6.0; p.ml = 6.0;
            p.sz = 1.3 + Math.random() * 1.8; // Fine sand granules (not leaves)

            const rand = Math.random();
            if (rand < 0.34) {
              p.r = 255; p.g = 153; p.b = 51; // Saffron
            } else if (rand < 0.67) {
              p.r = 255; p.g = 255; p.b = 255; // White
            } else {
              p.r = 19; p.g = 136; p.b = 8; // India Green
            }

            p.a = 0.88;
            p.tp = 2; // Tricolor fine sand
          }
        }
      }
    };

    const updateParticles = (dt: number, elapsed: number) => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i];
        if (!p.on) continue;
        p.life -= dt;
        p.x += p.vx;
        p.y += p.vy;

        if (p.tp === 4) { // smoke
          p.sz += 0.45;
          p.vx *= 0.985;
          p.vy *= 0.985;
          p.life -= 0.012;
        } else if (p.tp === 2) { // Tiny color sand particles falling under gravity
          p.vy += 0.045; // Gravity pull
          p.vy *= 0.985; // Terminal velocity drag
          p.vx = p.vx * 0.96 + Math.sin(elapsed * 2 + p.y * 0.015) * 0.15; // Smooth breeze sway
          p.life -= 0.007;
        } else if (p.tp === 3) { // embers
          p.vy -= 0.015;
          p.vx += (Math.random() - 0.5) * 0.15;
          p.life -= 0.018;
        } else { // dust
          p.life -= 0.005;
        }

        if (p.life <= 0 || p.x < -120 || p.x > W + 120 || p.y > H + 120) {
          p.on = false;
        }
      }
    };

    const drawParticles = () => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i];
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
        } else if (p.tp === 1 || p.tp === 3) { // dust & embers
          c.save();
          c.globalCompositeOperation = 'screen';
          c.globalAlpha = alpha;
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},1)`;
          c.beginPath();
          c.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
          c.fill();
          c.restore();
        } else if (p.tp === 2) { // Tiny circular sand color drops with microglow
          c.save();
          c.globalCompositeOperation = 'screen';
          const rGrad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz * 1.5);
          rGrad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha})`);
          rGrad.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = rGrad;
          c.beginPath();
          c.arc(p.x, p.y, p.sz * 1.5, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
      }
    };

    // LAYER 11: LENS FLARES
    const drawLensFlares = (t: number, sceneAlpha: number) => {
      if (t < 5.0) return;
      const intensity = clamp((t - 5.0) * 0.35, 0, 0.65) * sceneAlpha;
      const fx = W * 0.5;
      const fy = lerp(H * 1.1, H * 0.38, eOE((t - 4) / 5));

      c.save();
      c.globalAlpha = intensity;
      c.globalCompositeOperation = 'screen';

      const streakGrad = c.createLinearGradient(0, fy, W, fy);
      streakGrad.addColorStop(0, 'rgba(255, 140, 50, 0)');
      streakGrad.addColorStop(0.5, 'rgba(255, 220, 160, 0.7)');
      streakGrad.addColorStop(1, 'rgba(255, 140, 50, 0)');
      c.fillStyle = streakGrad;
      c.fillRect(0, fy - 6, W, 12);

      const rings = [0.25, 0.45, -0.15, -0.3];
      rings.forEach(mult => {
        const rx = fx + (W * 0.15) * mult;
        const ry = fy + (H * 0.1) * mult;
        const rGrad = c.createRadialGradient(rx, ry, 0, rx, ry, 35);
        rGrad.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
        rGrad.addColorStop(0.6, 'rgba(255, 100, 50, 0.1)');
        rGrad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = rGrad;
        c.beginPath(); c.arc(rx, ry, 35, 0, Math.PI * 2); c.fill();
      });

      c.restore();
    };

    // LAYER 13: TYPOGRAPHY
    const drawTypography = (t: number) => {
      if (t < 11.5) return;
      const textAlpha = clamp((t - 11.5) * 1.5, 0, 1);
      const titleY = lerp(H * 0.58, H * 0.44, eOE((t - 11.5) * 0.5));
      
      c.save();
      c.globalAlpha = textAlpha;
      c.textAlign = 'center';
      
      const fontSize = Math.min(W * 0.065, 52);
      c.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;
      
      c.fillStyle = 'rgba(0,0,0,0.9)';
      c.fillText("HAPPY REPUBLIC DAY", W/2 + 1.5, titleY + 1.5);
      
      const grad = c.createLinearGradient(0, titleY - fontSize/2, 0, titleY + fontSize/2);
      grad.addColorStop(0, '#FFFACD'); grad.addColorStop(0.4, '#FFD700');
      grad.addColorStop(0.6, '#DAA520'); grad.addColorStop(1, '#8B6914');
      c.fillStyle = grad;
      c.fillText("HAPPY REPUBLIC DAY", W/2, titleY);

      if (t > 12.4) {
        const ss = Math.min(W * 0.018, H * 0.022, 15);
        c.font = `400 ${ss}px 'Georgia', serif`;
        c.fillStyle = 'rgba(0,0,0,0.8)';
        c.fillText('सत्यमेव जयते  •  वन्दे मातरम्', W / 2 + 1, titleY + fontSize * 0.95 + 1);
        c.fillStyle = '#ffd700';
        c.fillText('सत्यमेव जयते  •  वन्दे मातरम्', W / 2, titleY + fontSize * 0.95);
      }
      c.restore();
    };

    // LAYER 12 & 15: POST EFFECTS
    const drawPostFX = () => {
      c.save();
      c.globalCompositeOperation = 'soft-light';
      const grade = c.createLinearGradient(0, 0, W, H);
      grade.addColorStop(0, 'rgba(255, 140, 50, 0.22)'); 
      grade.addColorStop(1, 'rgba(0, 50, 100, 0.32)');   
      c.fillStyle = grade;
      c.fillRect(0, 0, W, H);
      c.restore();

      const vignette = c.createRadialGradient(W/2, H/2, H * 0.35, W/2, H/2, H * 0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
      c.fillStyle = vignette;
      c.fillRect(0, 0, W, H);

      c.save();
      c.globalCompositeOperation = 'overlay';
      c.globalAlpha = 0.04;
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0, 0, W, H); }
      c.restore();
    };

    // EXTRA LAYER: HIGH-FIDELITY SCARY FLYAWAY PEACE DOVES
    const drawDoves = (t: number, elapsed: number, sceneAlpha: number) => {
      // Pigeons are visible as sitting elements first, then startled upwards
      const dAlpha = sceneAlpha;
      c.save();
      c.globalAlpha = dAlpha;

      // Startle trigger synchronized perfectly with the Jets crossing (t >= 2.6s)
      if (t >= 2.6) {
        dovesList.forEach(d => {
          if (d.state === 'sitting') {
            d.state = 'flying';
            // Startled velocity vectors
            if (d.side === 'left') {
              // Left pigeons fly up and to the right
              d.vx = 2.0 + Math.random() * 1.8;
              d.vy = -2.2 - Math.random() * 1.5;
            } else {
              // Right pigeons fly up and to the left
              d.vx = -2.0 - Math.random() * 1.8;
              d.vy = -2.2 - Math.random() * 1.5;
            }
          }
        });
      }

      dovesList.forEach(d => {
        if (d.state === 'flying') {
          d.x += d.vx; d.y += d.vy; d.wing += 0.32; // Energetic flaps
          d.vy += 0.012; // Minor gravity drift
        }

        c.save();
        c.translate(d.x, d.y);
        
        const dScale = 0.52; // Elegant, compact size
        c.scale(dScale, dScale);

        if (d.state === 'flying') {
          // Align facing angle to flight vector
          const flightAngle = Math.atan2(d.vy, d.vx);
          c.rotate(flightAngle);

          const wingFactor = Math.sin(d.wing);

          // 1. Tail Feathers
          c.fillStyle = '#d8d8d8';
          c.beginPath();
          c.moveTo(-15, 0);
          c.lineTo(-26, -5 + wingFactor * 2);
          c.lineTo(-26, 5 - wingFactor * 2);
          c.closePath();
          c.fill();

          // 2. Streamlined Body Torso
          const bodyGrad = c.createLinearGradient(-15, 0, 15, 0);
          bodyGrad.addColorStop(0, '#dadada');
          bodyGrad.addColorStop(0.5, '#ffffff');
          bodyGrad.addColorStop(1, '#e3e3e3');
          c.fillStyle = bodyGrad;
          c.beginPath();
          c.ellipse(0, 0, 15, 5.0, 0, 0, Math.PI * 2);
          c.fill();

          // Head & Beak
          c.fillStyle = '#ffffff';
          c.beginPath(); c.arc(13, -2, 4.0, 0, Math.PI * 2); c.fill();
          
          c.fillStyle = '#e29b3c';
          c.beginPath();
          c.moveTo(16, -3);
          c.lineTo(21, -2);
          c.lineTo(15, -1);
          c.closePath();
          c.fill();

          // Flapping Wings
          [-1, 1].forEach(side => {
            c.save();
            c.scale(1, side);

            const shoulderAngle = (wingFactor * 0.5 - 0.15);
            c.rotate(shoulderAngle);
            c.fillStyle = '#f0f0f0';
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(-7, -15);
            c.lineTo(-13, -13);
            c.closePath();
            c.fill();

            c.translate(-7, -15);
            const elbowAngle = (wingFactor * 0.4 - 0.08);
            c.rotate(elbowAngle);

            const featherGrad = c.createLinearGradient(0, 0, -10, -20);
            featherGrad.addColorStop(0, '#ffffff');
            featherGrad.addColorStop(1, '#cccccc');
            c.fillStyle = featherGrad;
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(-11, -21);
            c.lineTo(-16, -10);
            c.closePath();
            c.fill();

            c.restore();
          });
        } else {
          // SITTING STATE on Ledges (Folded wings, head bobbing)
          const headBob = Math.sin(elapsed * 6 + d.bobOffset) * 1.2;

          // 1. Folded Tail
          c.fillStyle = '#b5b5b5';
          c.beginPath();
          c.moveTo(-10, 2);
          c.lineTo(-22, 6);
          c.lineTo(-20, 0);
          c.closePath();
          c.fill();

          // 2. Compact Sitting Body Torso
          const bodyGrad = c.createLinearGradient(-12, 0, 12, 0);
          bodyGrad.addColorStop(0, '#cccccc');
          bodyGrad.addColorStop(0.5, '#f5f5f5');
          bodyGrad.addColorStop(1, '#d8d8d8');
          c.fillStyle = bodyGrad;
          c.beginPath();
          c.ellipse(0, 2, 13, 6.5, 0.1, 0, Math.PI * 2);
          c.fill();

          // Head & Beak (bobbing gently)
          c.fillStyle = '#ffffff';
          c.beginPath(); 
          c.arc(10, -2 + headBob, 4.2, 0, Math.PI * 2); 
          c.fill();
          
          c.fillStyle = '#e29b3c';
          c.beginPath();
          c.moveTo(13, -3 + headBob);
          c.lineTo(17, -2 + headBob);
          c.lineTo(12, -1 + headBob);
          c.closePath();
          c.fill();

          // Folded Wing overlay
          c.fillStyle = '#e2e2e2';
          c.beginPath();
          c.ellipse(-1, 2, 10, 4.2, -0.15, 0, Math.PI * 2);
          c.fill();
        }

        c.restore();
      });

      c.restore();
    };

    // STARS RENDERING
    const drawStars = (t: number, sceneAlpha: number) => {
      if (t > 7) return;
      const alpha = clamp(1 - t / 7, 0, 1) * sceneAlpha;
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
    };

    // SPOKES GLOW
    const drawChakraSpokes = (t: number, sceneAlpha: number) => {
      if (t < 7.0 || t > 11.5) return;
      let alpha = (t < 8.0 ? eOC((t - 7.0) / 1.0) : t < 10.0 ? 1 : 1 - eOC((t - 10.0) / 1.5)) * sceneAlpha;
      if (alpha <= 0) return;
      const cxVal = W / 2, cyVal = H / 2, scVal = Math.min(W, H), or = Math.max(W, H) * 0.9, spokes = 24;
      c.save(); c.globalAlpha = alpha * 0.12; c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < spokes; i++) {
        const ang = (i / spokes) * Math.PI * 2 + t * 0.08;
        c.beginPath(); c.moveTo(cxVal, cyVal);
        c.lineTo(cxVal + Math.cos(ang) * or, cyVal + Math.sin(ang) * or);
        c.strokeStyle = 'rgba(30,70,160,0.55)'; c.stroke();
      }
      c.restore();
    };

    /* 🎬 ANIMATION LOOP (Layer orchestration) */
    let prevTime = 0;
    const loop = (now: number) => {
      if (!t0.current) { t0.current = now; prevTime = now; }
      const t = (now - t0.current) / 1000;
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      if (t >= DUR) {
        if (!done.current) { done.current = true; cbR.current?.(); }
        return;
      }

      spawnParticles(t, now / 1000);
      updateParticles(dt, now / 1000);

      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, H);

      const camDollyZ = lerp(1.0, 1.08, eOE(t / DUR)); 
      const breatheX = Math.sin(t * 0.4) * 2;
      const breatheY = Math.cos(t * 0.3) * 1.5;
      const camRot = Math.sin(t * 0.15) * 0.003;

      c.save();
      c.translate(W / 2 + breatheX, H / 2 + breatheY);
      c.rotate(camRot);
      c.scale(camDollyZ, camDollyZ);
      c.translate(-W / 2, -H / 2);

      const sceneAlpha = t < 11.5 ? 1 : clamp(1 - (t - 11.5) * 1.8, 0, 1);

      // Progressive Layer Assembly
      drawSky(t, now / 1000, sceneAlpha);                     // Layer 1: Sky
      drawClouds(t, sceneAlpha);                              // Layer 2: Clouds
      drawStars(t, sceneAlpha);                               // Stars (Background)
      drawWavingFlagAndChakra(t, now / 1000, sceneAlpha);     // Layer 6 & 7: Flag & Chakra
      drawIndiaGate(t, sceneAlpha);                           // Layer 4: India Gate
      drawTorch(t, now / 1000, sceneAlpha);                   // Layer 5: Flame
      drawFog(t, now / 1000, sceneAlpha);                     // Layer 3: Volumetric Fog
      drawLensFlares(t, sceneAlpha);                          // Layer 11: Flares
      drawJetsAndTrails(t, sceneAlpha);                       // Layer 8 & 9: Jets & Smoke (Spawns Color Trails)
      drawParticles();                                        // Layer 10: Particles (Dust & Colors)
      drawChakraSpokes(t, sceneAlpha);                        // Ashoka spokes glow
      drawDoves(t, now / 1000, sceneAlpha);                   // Peace Doves (Sitting first, startling Flyaway)

      c.restore();

      // Layer 13 Premium Transition: Smooth backdrop overlay fade-in (at 11.5s)
      if (t >= 11.5) {
        const bgFade = clamp((t - 11.5) * 1.8, 0, 1);
        c.save();
        c.globalAlpha = bgFade;
        const bgGrad = c.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#060810');
        bgGrad.addColorStop(1, '#0c101c');
        c.fillStyle = bgGrad;
        c.fillRect(0, 0, W, H);
        c.restore();
      }

      drawTypography(t);                                      // Layer 13: Typography
      drawPostFX();                                           // Layer 12, 14, 15: Post Grading/Vignette/Grain

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
        audioCtxRef.current = null;
      }
    };
  }, [mkPool, grab, triggerMilitaryAudio]);

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
