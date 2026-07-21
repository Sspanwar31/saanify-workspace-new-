'use client';

import React, { useEffect, useRef, useCallback } from 'react';

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
const DUR = 15.0; // Cinematic Duration: 15.0 Seconds

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
interface Props { onComplete?: () => void }

export default function NationalCinematicIntro({ onComplete }: Props) {
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
    
    // Initialize Crossway Jets & Doves
    const jets: Jet[] = [
      // Left-to-Right Jet (Saffron smoke)
      { x: -W * 0.25, y: H * 0.15, scale: 0.95, smokeColor: '#FF9933', vx: 6.2, vy: 1.1, active: true },
      // Right-to-Left Jet (White smoke)
      { x: W + W * 0.25, y: H * 0.19, scale: 0.90, smokeColor: '#FFFFFF', vx: -6.2, vy: 0.9, active: true },
      // Left-to-Right Jet (Green smoke)
      { x: -W * 0.40, y: H * 0.23, scale: 0.85, smokeColor: '#138808', vx: 6.2, vy: 0.7, active: true }
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

    /* 🌌 ATMOSPHERE & SKY (Night -> Dawn -> Saffron Sunrise) */
    function drawAtmosphere(t: number, elapsed: number, sceneAlpha: number) {
      c.save();
      c.globalAlpha = sceneAlpha;
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
      c.restore();
    }

    /* ⭐ STAR RENDERING */
    function dStars(t: number, sceneAlpha: number) {
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
    }

    /* ☀️ SUN & VOLUMETRIC GOD RAYS */
    function drawSunAndRays(t: number, elapsed: number, sceneAlpha: number) {
      if (t < 4) return;
      const sunY = lerp(H * 1.1, H * 0.38, eOE((t - 4) / 5));
      const sunX = W * 0.5;
      const intensity = clamp((t - 4) * 0.5, 0, 1) * sceneAlpha;

      c.save();
      c.globalAlpha = intensity;
      c.globalCompositeOperation = 'screen';
      
      // Volumetric Sun Glow
      const bloomGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.7);
      bloomGrad.addColorStop(0, 'rgba(255, 240, 200, 0.8)');
      bloomGrad.addColorStop(0.2, 'rgba(255, 180, 80, 0.5)');
      bloomGrad.addColorStop(0.5, 'rgba(255, 100, 30, 0.15)');
      bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = bloomGrad;
      c.fillRect(0, 0, W, H);

      // Sun Core
      const coreGrad = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, 90);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      coreGrad.addColorStop(0.4, 'rgba(255, 245, 200, 0.8)');
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
    function drawFog(t: number, elapsed: number, sceneAlpha: number) {
      c.save();
      c.globalAlpha = sceneAlpha;
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

    /* 🔥 AMAR JAWAN JYOTI (Torch Flame) */
    function drawTorch(t: number, elapsed: number, sceneAlpha: number) {
      const tx = W * 0.5;
      const ty = H * 0.795;
      
      if (t > 1.5) {
        const fireAlpha = clamp((t - 1.5) * 2, 0, 1) * sceneAlpha;
        c.save();
        c.globalAlpha = fireAlpha;
        c.globalCompositeOperation = 'lighter';
        
        // Ambient glow
        const glowGrad = c.createRadialGradient(tx, ty, 0, tx, ty, 100);
        glowGrad.addColorStop(0, 'rgba(255, 130, 40, 0.85)');
        glowGrad.addColorStop(0.4, 'rgba(255, 70, 10, 0.35)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        c.fillStyle = glowGrad;
        c.fillRect(tx - 100, ty - 100, 200, 200);

        // Flame core
        const flicker = Math.sin(elapsed * 28) * 3;
        const flameH = 35 + flicker;
        const flameW = 8;

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

        // Rising embers
        if (Math.random() < 0.2) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = tx + (Math.random() - 0.5) * 6;
            p.y = ty - 5; p.vx = (Math.random() - 0.5) * 0.5;
            p.vy = -1.0 - Math.random() * 1.5; p.life = 1.8; p.ml = 1.8;
            p.sz = 0.8 + Math.random() * 1.0;
            p.r = 255; p.g = 150 + Math.random() * 80; p.b = 40; p.a = 0.95;
            p.tp = 3; 
          }
        }
        c.restore();
      }
    }

    /* 🏛️ INDIA GATE (Proportional Sandstone Structure) */
    function drawIndiaGate(t: number, sceneAlpha: number) {
      const sc = Math.min(W, H);
      const gateH = sc * 0.66;
      const gateW = gateH * 0.85;
      const baseY = H * 0.82;
      const cx = W * 0.5;

      c.save();
      const reveal = clamp((t - 1) * 0.5, 0, 1);
      c.globalAlpha = reveal * sceneAlpha;

      // Realistic Sandstone Palette
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
          c.fillRect(x, y, width, 1.5); 
          c.fillStyle = 'rgba(0,0,0,0.25)';
          c.fillRect(x, y + height - 2, width, 2); 
        }
      };

      // Base layers
      drawBlock(cx - gateW * 0.54, baseY - 16, gateW * 1.08, 16);
      drawBlock(cx - gateW * 0.5, baseY - 32, gateW, 16);

      // Flanking main pillars
      const pillarW = gateW * 0.28;
      const pillarH = gateH * 0.73;
      const pillarY = baseY - 32 - pillarH;
      
      drawBlock(cx - gateW * 0.48, pillarY, pillarW, pillarH);
      drawBlock(cx + gateW * 0.48 - pillarW, pillarY, pillarW, pillarH);

      // Inner structural shadows
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.fillRect(cx - gateW * 0.48 + pillarW - 8, pillarY, 8, pillarH);
      c.fillRect(cx + gateW * 0.48 - pillarW, pillarY, 8, pillarH);

      // Main Central Arch Shadow (soft edges)
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
      
      const archShadow = c.createRadialGradient(cx, cArchY + cArchW/2, cArchW * 0.1, cx, cArchY + cArchW/2, cArchW * 0.52);
      archShadow.addColorStop(0, 'rgba(0,0,0,0)');
      archShadow.addColorStop(1, 'rgba(0,0,0,0.6)');
      c.fillStyle = archShadow;
      c.fill();
      c.restore();

      // Top Beam & Cornice Layers
      const lintelH = gateH * 0.12;
      drawBlock(cx - gateW * 0.52, pillarY - lintelH, gateW * 1.04, lintelH);
      drawBlock(cx - gateW * 0.45, pillarY - lintelH - 24, gateW * 0.9, 24);
      drawBlock(cx - gateW * 0.36, pillarY - lintelH - 46, gateW * 0.72, 22);
      
      // Top Dome
      c.beginPath();
      c.moveTo(cx - gateW * 0.18, pillarY - lintelH - 46);
      c.quadraticCurveTo(cx, pillarY - lintelH - 72, cx + gateW * 0.18, pillarY - lintelH - 46);
      c.closePath();
      c.fillStyle = stoneDark;
      c.fill();

      // Side arches
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
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fill();
      });

      c.restore();
    }

    /* ✈️ CROSSING JETS & VOLUMETRIC SMOKE EFFECT */
    function drawJets(t: number, sceneAlpha: number) {
      if (t < 2.0 || t > 8.5) return;
      c.save();
      c.globalAlpha = sceneAlpha;
      jets.forEach(jet => {
        jet.x += jet.vx; jet.y += jet.vy;

        // Smoke Emitters (slower puff generation)
        if (Math.random() < 0.65) {
          const p = grab(pl); if (p) {
            p.on = true; 
            p.x = jet.x - (jet.vx > 0 ? 30 : -30) * jet.scale; 
            p.y = jet.y + 2 * jet.scale;
            p.vx = -jet.vx * 0.15 + (Math.random() - 0.5) * 0.4; 
            p.vy = (Math.random() - 0.5) * 0.4;
            p.life = 3.8; p.ml = 3.8; p.sz = 16 * jet.scale + Math.random() * 12;
            const hex = jet.smokeColor.replace('#', '');
            p.r = parseInt(hex.substring(0, 2), 16);
            p.g = parseInt(hex.substring(2, 4), 16);
            p.b = parseInt(hex.substring(4, 6), 16);
            p.a = 0.55; p.tp = 4; // Smoke
          }
        }

        // Draw Fighter jet silhouette facing its direction vector
        c.save();
        c.translate(jet.x, jet.y);
        const angle = Math.atan2(jet.vy, jet.vx);
        c.rotate(angle);
        c.scale(jet.scale, jet.scale);

        // Afterburner glow
        const burnerGrad = c.createRadialGradient(-30, 0, 0, -30, 0, 35);
        burnerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        burnerGrad.addColorStop(0.3, 'rgba(255, 160, 50, 0.85)');
        burnerGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
        c.fillStyle = burnerGrad;
        c.fillRect(-60, -15, 40, 30);

        // Jet Body Frame
        c.fillStyle = '#151515';
        c.beginPath();
        c.moveTo(35, 0); 
        c.quadraticCurveTo(15, -4, -10, -5); 
        c.lineTo(-25, -3);
        c.lineTo(-25, 3); 
        c.lineTo(-10, 5); 
        c.quadraticCurveTo(15, 4, 35, 0); 
        c.fill();

        // Cockpit glass
        c.fillStyle = 'rgba(100, 180, 255, 0.75)';
        c.beginPath(); c.ellipse(12, -1, 10, 3.2, 0, 0, Math.PI * 2); c.fill();

        // Main Wings
        c.fillStyle = '#1e1e1e';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -28); c.lineTo(-25, -28); c.lineTo(-10, 0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, 28); c.lineTo(-25, 28); c.lineTo(-10, 0); c.closePath(); c.fill();
        c.restore();
      });
      c.restore();
    }

    /* 🎊 CELEBRATORY TRICOLOR PETALS (Falling particles) */
    function spawnDust(t: number, elapsed: number) {
      if (t > 1 && Math.random() < 0.25) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = Math.random() * H;
          p.vx = Math.sin(elapsed + Math.random()*10) * 0.25; p.vy = -0.2 - Math.random() * 0.25;
          p.life = 5; p.ml = 5; p.sz = 1 + Math.random() * 1.5;
          p.r = 255; p.g = 200 + Math.random() * 55; p.b = 150; p.a = 0.35; p.tp = 1; // dust
        }
      }
      // Marigold flower petals and celebratory papers falling elegantly
      if (t > 2.5 && Math.random() < 0.35) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = -10;
          p.vx = (Math.random() - 0.5) * 2; p.vy = 0.8 + Math.random() * 1.5;
          p.life = 7; p.ml = 7; p.sz = 5 + Math.random() * 5;
          
          // Tricolor Indian Festive Palette (Saffron, White, Green)
          const ct = Math.random();
          if (ct < 0.34) { p.r = 255; p.g = 153; p.b = 51; }      // Saffron
          else if (ct < 0.67) { p.r = 255; p.g = 255; p.b = 255; } // Pure White
          else { p.r = 19; p.g = 136; p.b = 8; }                  // India Green
          
          p.a = 0.9; p.rot = Math.random() * Math.PI * 2; p.rs = (Math.random() - 0.5) * 0.1; p.tp = 2; // Petals
        }
      }
    }

    function updateParticles(dt: number, elapsed: number) {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue;
        p.life -= dt; p.x += p.vx; p.y += p.vy;
        
        if (p.tp === 4) { p.sz += 0.45; p.vx *= 0.985; p.vy *= 0.985; p.life -= 0.012; } 
        else if (p.tp === 2) { p.rot += p.rs; p.vy += 0.03; p.vx += Math.sin(elapsed + p.y * 0.01) * 0.12; p.life -= 0.008; } 
        else if (p.tp === 3) { p.vy -= 0.015; p.vx += (Math.random() - 0.5) * 0.18; p.life -= 0.015; } 
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
        } else if (p.tp === 2) { // Rounded marigold / tricolor petals
          c.save();
          c.globalAlpha = alpha;
          c.translate(p.x, p.y); 
          c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          
          c.beginPath();
          c.ellipse(0, 0, p.sz, p.sz * 0.55, 0, 0, Math.PI * 2);
          c.fill();
          
          // Delicate petal boundary
          c.strokeStyle = 'rgba(0, 0, 0, 0.08)';
          c.lineWidth = 1;
          c.stroke();
          c.restore();
        }
      }
    }

    /* 🔆 ASHOKA SPOKE GLOW BEAMS */
    function dChakraSpokes(t: number, sceneAlpha: number) {
      if (t < 7.0 || t > 11.5) return;
      let alpha = (t < 8.0 ? eOC((t - 7.0) / 1.0) : t < 10.0 ? 1 : 1 - eOC((t - 10.0) / 1.5)) * sceneAlpha;
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

    /* 📜 TYPOGRAPHY (Cleaned and scaled beautifully) */
    function drawTypography(t: number, elapsed: number) {
      if (t < 11.5) return;
      const textAlpha = clamp((t - 11.5) * 1.5, 0, 1);
      const titleY = lerp(H * 0.60, H * 0.44, eOE((t - 11.5) * 0.5));
      
      c.save();
      c.globalAlpha = textAlpha;
      c.textAlign = 'center';
      
      // Aspect ratio secure smaller font sizes
      const fontSize = Math.min(W * 0.065, 54);
      c.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;
      
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.9)';
      c.fillText("HAPPY REPUBLIC DAY", W/2 + 1.5, titleY + 1.5);
      
      // Gold Foil Gradient
      const grad = c.createLinearGradient(0, titleY - fontSize/2, 0, titleY + fontSize/2);
      grad.addColorStop(0, '#FFFACD'); grad.addColorStop(0.4, '#FFD700');
      grad.addColorStop(0.6, '#DAA520'); grad.addColorStop(1, '#8B6914');
      c.fillStyle = grad;
      c.fillText("HAPPY REPUBLIC DAY", W/2, titleY);

      // Slogans under main title
      if (t > 12.3) {
        const ss = Math.min(W * 0.020, H * 0.024, 16);
        c.font = `400 ${ss}px 'Georgia', serif`;
        c.fillStyle = 'rgba(0,0,0,0.85)';
        c.fillText('सत्यमेव जयते  •  वन्दे मातरम्', W / 2 + 1, titleY + fontSize * 0.9 + 1);
        c.fillStyle = '#ffd700';
        c.fillText('सत्यमेव जयते  •  वन्दे मातरम्', W / 2, titleY + fontSize * 0.9);
      }
      c.restore();
    }

    /* 🕊️🕊️ FLYING DOVES */
    function drawDoves(t: number, elapsed: number, sceneAlpha: number) {
      if (t < 12.5) return;
      const phaseAlpha = clamp((t - 12.5) / 1.5, 0, 1) * sceneAlpha;

      c.save();
      c.globalAlpha = phaseAlpha;
      c.fillStyle = '#FFFFFF';
      c.shadowColor = 'rgba(0,0,0,0.18)';
      c.shadowBlur = 6;

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
      gradeGrad.addColorStop(0, 'rgba(255, 140, 50, 0.22)'); 
      gradeGrad.addColorStop(1, 'rgba(0, 50, 100, 0.32)');   
      c.fillStyle = gradeGrad;
      c.fillRect(0, 0, W, H);
      c.restore();

      // Vignette
      const vignette = c.createRadialGradient(W/2, H/2, H*0.35, W/2, H/2, H*0.9);
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

      // Smooth horizontal camera drift only (Removed vertical crane to secure India Gate)
      const camDollyZ = lerp(1.0, 1.10, eOE(t / DUR)); // slow cinematically stable zoom
      const breatheX = Math.sin(t * 0.4) * 2;
      const breatheY = Math.cos(t * 0.3) * 1.5;
      const camRot = Math.sin(t * 0.15) * 0.003;

      c.save();
      c.translate(W / 2 + breatheX, H / 2 + breatheY);
      c.rotate(camRot);
      c.scale(camDollyZ, camDollyZ);
      c.translate(-W / 2, -H / 2);

      // Calculate fading factor when typography screen slides in (after 11.5s)
      const sceneAlpha = t < 11.5 ? 1 : clamp(1 - (t - 11.5) * 1.8, 0, 1);

      // Background Rendering Layer Order with Alpha blending
      drawAtmosphere(t, now / 1000, sceneAlpha);
      drawSunAndRays(t, now / 1000, sceneAlpha); 
      dStars(t, sceneAlpha); 
      drawIndiaGate(t, sceneAlpha);              
      drawTorch(t, now / 1000, sceneAlpha);      
      drawFog(t, now / 1000, sceneAlpha);        
      drawJets(t, sceneAlpha);                
      drawParticles();
      dChakraSpokes(t, sceneAlpha);
      drawDoves(t, now / 1000, sceneAlpha);   

      c.restore();

      // Premium Black/Dark Backdrop Fade-in strictly for the message (at 11.5s)
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

      drawTypography(t, now / 1000);
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
