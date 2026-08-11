'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
}

// ============ MATH & EASING ============
const smoothstep = (a: number, b: number, t: number) => {
  if (b === a) return t < a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ============ HIGH-PERFORMANCE PARTICLE POOL ============
type PType = 'smoke' | 'snow' | 'belpatra' | 'water_splash' | 'star' | 'glow';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; active: boolean; gravity: number; drag: number;
  color: string; rot: number; rotSpeed: number;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'smoke', active: false, gravity: 0, drag: 0.98,
        color: '#fff', rot: 0, rotSpeed: 0
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    if (!p) return null;
    p.active = true; p.life = 0; p.alpha = 0; p.rot = Math.random() * Math.PI * 2;
    return p;
  }
  release(p: Particle) {
    if (!p) return;
    p.active = false;
    this.free.push(p.idx);
  }
}

export default function MahashivratriCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (!document.getElementById('maha-shiv-fonts-v4')) {
      const link = document.createElement('link');
      link.id = 'maha-shiv-fonts-v4';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let W = 0, H = 0, DPR = 1;
    let startTime = 0;
    let rafId = 0;
    let running = true;
    let lastTime = 0;
    let handoverTriggered = false;

    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    const pool = new ParticlePool(5000);

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = Math.floor(W * DPR);
      canvas!.height = Math.floor(H * DPR);
      ctx?.setTransform(DPR, 0, 0, DPR, 0, 0);
      
      bloom.width = Math.max(2, Math.floor(W / 2));
      bloom.height = Math.max(2, Math.floor(H / 2));
      grain.width = 256; grain.height = 256;
      generateGrain();
    }

    function generateGrain() {
      const id = gctx.createImageData(grain.width, grain.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = Math.random() * 255;
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 16;
      }
      gctx.putImageData(id, 0, 0);
    }

    // =========================================================================
    // SCENE 1: 3D GOLDEN TRISHUL (Right Side) (0.0s -> 11.0s)
    // =========================================================================
    function draw3DGoldenTrishul(t: number) {
      const vis = smoothstep(0.0, 1.5, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0024;
      const trishulX = W * 0.78;
      const entryY = H * 1.2 - smoothstep(0.0, 3.5, t) * (H * 0.72);
      const trishulY = entryY;

      ctx!.save();
      ctx!.globalAlpha = vis;
      ctx!.translate(trishulX, trishulY);

      // Divine Aura behind Trishul
      const auraGrad = ctx!.createRadialGradient(0, -100*s, 0, 0, -100*s, 300*s);
      auraGrad.addColorStop(0, `rgba(20, 40, 80, ${0.5 * vis})`);
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = auraGrad;
      ctx!.fillRect(-300*s, -400*s, 600*s, 600*s);

      const shaftW = 14 * s;
      const shaftH = 380 * s;
      const topY = -shaftH / 2;

      // 24K Gold Metallic Gradient (Rich Highlights & Dark Shadows)
      const goldGrad = ctx!.createLinearGradient(-shaftW, 0, shaftW, 0);
      goldGrad.addColorStop(0.0, '#2d1a00');
      goldGrad.addColorStop(0.2, '#8a6d1f');
      goldGrad.addColorStop(0.5, '#FFFDF0'); // Bright Specular Highlight
      goldGrad.addColorStop(0.8, '#C59B27');
      goldGrad.addColorStop(1.0, '#1a0f00');

      // Main Shaft
      ctx!.fillStyle = goldGrad;
      ctx!.fillRect(-shaftW / 2, topY, shaftW, shaftH);

      // Ornamental Gold Rings on Shaft
      ctx!.fillStyle = '#FFD700';
      for(let i=0; i<4; i++) {
        ctx!.fillRect(-shaftW/2 - 3*s, topY + 80*s + i*80*s, shaftW + 6*s, 5*s);
      }

      // Center Spear Tip (Sharp & Curved)
      ctx!.beginPath();
      ctx!.moveTo(0, topY - 120 * s); // Sharp Tip
      ctx!.lineTo(-15 * s, topY + 20 * s);
      ctx!.lineTo(15 * s, topY + 20 * s);
      ctx!.closePath();
      ctx!.fill();

      // Left Outer Prong (Curved & Sharp)
      ctx!.beginPath();
      ctx!.moveTo(-60 * s, topY - 80 * s); // Tip
      ctx!.bezierCurveTo(-50 * s, topY + 20 * s, -25 * s, topY + 70 * s, -8 * s, topY + 40 * s);
      ctx!.bezierCurveTo(-28 * s, topY + 10 * s, -42 * s, topY - 30 * s, -60 * s, topY - 80 * s);
      ctx!.closePath();
      ctx!.fill();

      // Right Outer Prong (Curved & Sharp)
      ctx!.beginPath();
      ctx!.moveTo(60 * s, topY - 80 * s); // Tip
      ctx!.bezierCurveTo(50 * s, topY + 20 * s, 25 * s, topY + 70 * s, 8 * s, topY + 40 * s);
      ctx!.bezierCurveTo(28 * s, topY + 10 * s, 42 * s, topY - 30 * s, 60 * s, topY - 80 * s);
      ctx!.closePath();
      ctx!.fill();

      // Sharp Edge Highlights
      ctx!.strokeStyle = 'rgba(255, 255, 240, 0.9)';
      ctx!.lineWidth = 2 * s;
      ctx!.stroke();

      // Crescent Moon Finial on Center Spear
      const moonY = topY - 30 * s;
      
      // Moon Glow
      ctx!.globalCompositeOperation = 'screen';
      const moonGlow = ctx!.createRadialGradient(0, moonY, 0, 0, moonY, 40*s);
      moonGlow.addColorStop(0, 'rgba(150, 200, 255, 0.6)');
      moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = moonGlow;
      ctx!.beginPath();
      ctx!.arc(0, moonY, 40*s, 0, Math.PI*2);
      ctx!.fill();
      ctx!.globalCompositeOperation = 'source-over';

      // Moon Metal
      ctx!.fillStyle = '#E0F7FF';
      ctx!.beginPath();
      ctx!.arc(0, moonY, 16 * s, 0, Math.PI * 2);
      ctx!.fill();
      // Moon Shadow Cutout
      ctx!.fillStyle = '#021827';
      ctx!.beginPath();
      ctx!.arc(6 * s, moonY - 4 * s, 14 * s, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2 & 3: GRAND DECORATED SHIVALINGA & ABHISHEKAM (3.5s -> 11.0s)
    // =========================================================================
    function drawDecoratedShivalinga(t: number) {
      const vis = smoothstep(3.2, 4.5, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0024;
      const cx = W * 0.42; 
      const baseY = H * 0.78;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Divine Backlight Halo
      const haloGrad = ctx!.createRadialGradient(cx, baseY - 60*s, 0, cx, baseY - 60*s, 200*s);
      haloGrad.addColorStop(0, `rgba(40, 80, 120, ${0.3 * vis})`);
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = haloGrad;
      ctx!.fillRect(cx - 200*s, baseY - 250*s, 400*s, 400*s);

      // --- SHIVALINGA BASE (Jaladhari Spout - Black Marble) ---
      const baseGrad = ctx!.createLinearGradient(cx - 120 * s, baseY, cx + 120 * s, baseY);
      baseGrad.addColorStop(0, '#05060a');
      baseGrad.addColorStop(0.5, '#1a1d28'); // Polished Black Marble Highlight
      baseGrad.addColorStop(1, '#020304');

      // Lower Pedestal
      ctx!.fillStyle = baseGrad;
      ctx!.beginPath();
      ctx!.ellipse(cx, baseY + 35 * s, 130 * s, 32 * s, 0, 0, Math.PI * 2);
      ctx!.fill();
      
      // Gold Edge of Pedestal
      ctx!.strokeStyle = `rgba(214, 169, 40, ${0.8 * vis})`;
      ctx!.lineWidth = 2 * s;
      ctx!.stroke();

      // Jaladhari Platform
      ctx!.beginPath();
      ctx!.ellipse(cx, baseY + 12 * s, 105 * s, 24 * s, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.stroke();

      // --- MAIN SHIVALINGA STONE (Polished Black Marble Pind) ---
      const lingaGrad = ctx!.createRadialGradient(cx - 25 * s, baseY - 70 * s, 5 * s, cx, baseY - 50 * s, 80 * s);
      lingaGrad.addColorStop(0, '#3a4252'); // Specular curve highlight
      lingaGrad.addColorStop(0.3, '#11131a');
      lingaGrad.addColorStop(0.8, '#050608');
      lingaGrad.addColorStop(1, '#000000');

      ctx!.fillStyle = lingaGrad;
      ctx!.beginPath();
      ctx!.moveTo(cx - 55 * s, baseY + 12 * s);
      ctx!.lineTo(cx - 55 * s, baseY - 60 * s);
      ctx!.bezierCurveTo(cx - 55 * s, baseY - 135 * s, cx + 55 * s, baseY - 135 * s, cx + 55 * s, baseY - 60 * s);
      ctx!.lineTo(cx + 55 * s, baseY + 12 * s);
      ctx!.closePath();
      ctx!.fill();

      // --- TRIPUNDRA BHASMA TILAK & KUMKUM BINDU ---
      ctx!.fillStyle = 'rgba(240, 250, 255, 0.98)';
      for (let i = 0; i < 3; i++) {
        ctx!.fillRect(cx - 26 * s, baseY - 88 * s + i * 8 * s, 52 * s, 4 * s);
      }
      // Red Kumkum Bindu
      ctx!.fillStyle = '#ff3300';
      ctx!.shadowBlur = 10 * s;
      ctx!.shadowColor = '#ff0000';
      ctx!.beginPath();
      ctx!.arc(cx, baseY - 80 * s, 6 * s, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;

      // --- MARIGOLD FLOWER GARLAND (Jaimala) ---
      for (let a = -Math.PI * 0.85; a <= Math.PI * 0.85; a += 0.22) {
        const gx = cx + Math.cos(a) * 57 * s;
        const gy = baseY + 14 * s + Math.sin(a) * 16 * s;
        
        // Leaf Base
        ctx!.fillStyle = '#16a34a';
        ctx!.beginPath();
        ctx!.arc(gx, gy, 8 * s, 0, Math.PI * 2);
        ctx!.fill();
        
        // Marigold Flower
        ctx!.fillStyle = (Math.sin(a * 12) > 0) ? '#ff9900' : '#ffcc00';
        ctx!.beginPath();
        ctx!.arc(gx, gy, 6.5 * s, 0, Math.PI * 2);
        ctx!.fill();
      }

      // --- REAL FLUID GANGA JAL / MILK ABHISHEKAM (6.5s -> 11.0s) ---
      if (t > 6.5) {
        const streamVis = smoothstep(6.5, 7.5, t) * (1 - smoothstep(10.0, 10.5, t));
        
        ctx!.save();
        ctx!.globalCompositeOperation = 'screen';
        
        // Fluid Stream (Wavy & Thick)
        const gangaGrad = ctx!.createLinearGradient(cx, -10, cx, baseY - 100 * s);
        gangaGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * streamVis})`);
        gangaGrad.addColorStop(0.5, `rgba(180, 230, 255, ${0.85 * streamVis})`);
        gangaGrad.addColorStop(1, `rgba(255, 255, 255, ${0.95 * streamVis})`);

        ctx!.strokeStyle = gangaGrad;
        ctx!.lineWidth = 12 * s;
        ctx!.lineCap = 'round';
        
        ctx!.beginPath();
        ctx!.moveTo(cx, -10);
        for (let y = -10; y <= baseY - 100 * s; y += 8) {
          const waveX = cx + Math.sin(t * 10 + y * 0.06) * 4 * s;
          ctx!.lineTo(waveX, y);
        }
        ctx!.stroke();

        // Milk Splash Impact Glow
        const splashR = 35 * s * streamVis;
        const milkGlow = ctx!.createRadialGradient(cx, baseY - 100 * s, 0, cx, baseY - 100 * s, splashR);
        milkGlow.addColorStop(0, `rgba(255, 255, 255, ${0.95 * streamVis})`);
        milkGlow.addColorStop(0.4, `rgba(150, 200, 255, ${0.6 * streamVis})`);
        milkGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx!.fillStyle = milkGlow;
        ctx!.beginPath();
        ctx!.arc(cx, baseY - 100 * s, splashR, 0, Math.PI * 2);
        ctx!.fill();

        // Fluid Coating Flowing Down Stone
        ctx!.fillStyle = `rgba(255, 255, 255, ${0.6 * streamVis})`;
        ctx!.beginPath();
        ctx!.ellipse(cx, baseY - 40 * s, 45 * s, 55 * s, 0, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.restore();
      }

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 4: SNOWY MOUNT KAILASH & FROZEN ICE TEXT (10.5s -> 14.5s)
    // =========================================================================
    function drawSnowyKailashAndText(t: number) {
      const vis = smoothstep(10.2, 11.5, t) * (1 - smoothstep(14.0, 14.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0022;
      const cx = W / 2;
      const cy = H * 0.42;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // --- HIMALAYAN SNOWY KAILASH BACKDROP ---
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#01040a');
      skyGrad.addColorStop(0.4, '#03131f');
      skyGrad.addColorStop(0.8, '#051b29');
      skyGrad.addColorStop(1, '#01050a');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // Moon Halo
      const mX = W * 0.8;
      const mY = H * 0.2;
      const halo = ctx!.createRadialGradient(mX, mY, 0, mX, mY, 150 * s);
      halo.addColorStop(0, 'rgba(150, 200, 255, 0.15)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, W, H);

      // Snowy Mountain Peaks (Jagged & Realistic)
      ctx!.fillStyle = '#051420';
      ctx!.beginPath();
      ctx!.moveTo(0, H * 0.9);
      ctx!.lineTo(W * 0.15, H * 0.55);
      ctx!.lineTo(W * 0.25, H * 0.65);
      ctx!.lineTo(W * 0.45, H * 0.25); // Kailash Peak
      ctx!.lineTo(W * 0.60, H * 0.45);
      ctx!.lineTo(W * 0.75, H * 0.35);
      ctx!.lineTo(W, H * 0.7);
      ctx!.lineTo(W, H);
      ctx!.lineTo(0, H);
      ctx!.closePath();
      ctx!.fill();

      // Snow Cap Highlights (Crystalline White)
      ctx!.fillStyle = '#e0f7ff';
      ctx!.beginPath();
      ctx!.moveTo(W * 0.38, H * 0.35);
      ctx!.lineTo(W * 0.45, H * 0.25); // Peak
      ctx!.lineTo(W * 0.52, H * 0.38);
      ctx!.lineTo(W * 0.48, H * 0.36);
      ctx!.lineTo(W * 0.45, H * 0.40); // Jagged snow drips
      ctx!.lineTo(W * 0.42, H * 0.37);
      ctx!.closePath();
      ctx!.fill();

      // --- FROZEN ICE / CRYSTALLINE SNOW STYLE TEXT ---
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      // 1. "ॐ नमः शिवाय"
      const fontS1 = Math.min(W * 0.09, 80);
      ctx!.font = `700 ${fontS1}px "Tiro Devanagari Hindi", serif`;

      // Outer Frosted Glow
      ctx!.shadowBlur = 35;
      ctx!.shadowColor = '#00e5ff';
      
      // Deep Ice Shadow Stroke
      ctx!.strokeStyle = '#021827';
      ctx!.lineWidth = fontS1 * 0.1;
      ctx!.strokeText('ॐ नमः शिवाय', cx, cy - 20 * s);

      // Crystalline Ice Gradient Fill
      const iceGrad1 = ctx!.createLinearGradient(0, cy - fontS1, 0, cy);
      iceGrad1.addColorStop(0.0, '#FFFFFF');
      iceGrad1.addColorStop(0.3, '#E0F7FF');
      iceGrad1.addColorStop(0.7, '#A5F3FC');
      iceGrad1.addColorStop(1.0, '#0284C7');

      ctx!.fillStyle = iceGrad1;
      ctx!.fillText('ॐ नमः शिवाय', cx, cy - 20 * s);

      // 2. "HAPPY MAHA SHIVRATRI 2027"
      const fontS2 = Math.min(W * 0.05, 48);
      const cyEng = cy + fontS1 * 0.95;
      ctx!.font = `900 ${fontS2}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 20;
      ctx!.shadowColor = '#38bdf8';
      ctx!.strokeStyle = '#021827';
      ctx!.lineWidth = fontS2 * 0.08;
      ctx!.strokeText('HAPPY MAHA SHIVRATRI 2027', cx, cyEng);

      const iceGrad2 = ctx!.createLinearGradient(0, cyEng - fontS2 / 2, 0, cyEng + fontS2 / 2);
      iceGrad2.addColorStop(0.0, '#FFFFFF');
      iceGrad2.addColorStop(0.5, '#BAE6FD');
      iceGrad2.addColorStop(1.0, '#0369A1');

      ctx!.fillStyle = iceGrad2;
      ctx!.fillText('HAPPY MAHA SHIVRATRI 2027', cx, cyEng);

      ctx!.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============
    function spawnParticles(t: number) {
    // =========================================================
// CINEMATIC SHIVA FOG / SMOKE — 0s → 11s
// =========================================================
if (t < 11.0 && Math.random() < 0.95) {

  const p = pool.spawn();
  if (!p) return;

  p.type = 'smoke';

  // Start INSIDE the lower screen instead of below canvas
  p.x =
    W * 0.15 +
    Math.random() * W * 0.70;

  p.y =
    H * 0.82 +
    Math.random() * H * 0.18;

  // Slow upward drifting fog
  p.vx =
    (Math.random() - 0.5) * 0.45;

  p.vy =
    -0.45 -
    Math.random() * 0.9;

  // Larger soft fog clouds
  p.size =
    65 +
    Math.random() * 95;

  p.maxLife =
    5.5 +
    Math.random() * 2.5;

  // Start immediately visible
  p.life =
    0.15 +
    Math.random() * 0.35;

  p.alpha = 0;

  p.color = '#d0ebff';
}
      // Abhishekam Water Splashes (6.5s -> 10.5s)
      if (t > 6.5 && t < 10.5 && Math.random() < 0.9) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'water_splash'; 
        p.x = W * 0.42 + (Math.random() - 0.5) * 20; 
        p.y = H * 0.78 - 110; // Splash origin
        p.vx = (Math.random() - 0.5) * 8; 
        p.vy = -3 - Math.random() * 5;
        p.size = 2 + Math.random() * 4; 
        p.maxLife = 1.5; p.life = 0; p.alpha = 1;
        p.gravity = 0.3; p.drag = 0.98;
        p.color = 'rgba(200, 240, 255, 0.9)';
      }

      // Falling Bel Patra Leaves (6.8s -> 11.0s)
      if (t > 6.8 && t < 11.0 && Math.random() < 0.4) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'belpatra'; p.x = W * 0.2 + Math.random() * W * 0.5; p.y = -20;
        p.vx = (Math.random() - 0.5) * 1.5; p.vy = 1.5 + Math.random() * 2.5;
        p.size = 7 + Math.random() * 7; p.maxLife = 5; p.life = 0; p.alpha = 0;
        p.color = '#16a34a'; p.rotSpeed = (Math.random() - 0.5) * 0.15;
      }

      // Heavy Snowfall (10.0s -> 14.5s)
      if (t > 10.0 && t < 14.5 && Math.random() < 0.85) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'snow'; p.x = Math.random() * W; p.y = -10;
        p.vx = (Math.random() - 0.5) * 2.0; p.vy = 1.2 + Math.random() * 3.0;
        p.size = 1.5 + Math.random() * 4; p.maxLife = 7; p.life = 0; p.alpha = 0;
        p.color = '#ffffff';
      }
    }

    function updateAndDrawParticles(dt: number, t: number) {
      ctx!.save();

      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active) continue;

        p.life += dt;
        const lr = p.life / p.maxLife;

        // Physics
        if (p.type === 'water_splash') {
          p.vy += p.gravity;
          p.vx *= p.drag;
          p.x += p.vx;
          p.y += p.vy;
        } else {
          p.x += p.vx;
          p.y += p.vy;
        }

        if (p.type === 'smoke') {

  // Soft cinematic fade-in / fade-out
  const fadeIn =
    smoothstep(0.0, 0.12, lr);

  const fadeOut =
    1 -
    smoothstep(0.65, 1.0, lr);

  p.alpha =
    fadeIn *
    fadeOut *
    0.55 *
    (
      t < 10.5
        ? 1
        : 1 - smoothstep(10.5, 11.0, t)
    );

  // Gentle horizontal movement
  p.x +=
    Math.sin(
      t * 0.7 +
      p.x * 0.01
    ) * 0.25;

  if (p.alpha > 0.005) {

    ctx!.globalAlpha =
      p.alpha;

    const grad =
      ctx!.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        p.size
      );

    grad.addColorStop(
      0,
      'rgba(210,235,255,0.42)'
    );

    grad.addColorStop(
      0.45,
      'rgba(190,220,235,0.18)'
    );

    grad.addColorStop(
      1,
      'rgba(180,215,235,0)'
    );

    ctx!.fillStyle =
      grad;

    ctx!.beginPath();

    ctx!.arc(
      p.x,
      p.y,
      p.size,
      0,
      Math.PI * 2
    );

    ctx!.fill();
  }
}
      } else if (p.type === 'belpatra') {
          p.rot += p.rotSpeed;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.8, 1, lr));
          if (p.alpha > 0.01) {
            ctx!.save();
            ctx!.globalAlpha = p.alpha;
            ctx!.translate(p.x, p.y);
            ctx!.rotate(p.rot);
            ctx!.fillStyle = '#15803d';
            ctx!.beginPath();
            ctx!.ellipse(0, -p.size, p.size * 0.5, p.size, 0, 0, Math.PI * 2); ctx!.fill();
            ctx!.ellipse(-p.size * 0.7, 0, p.size * 0.5, p.size, -0.6, 0, Math.PI * 2); ctx!.fill();
            ctx!.ellipse(p.size * 0.7, 0, p.size * 0.5, p.size, 0.6, 0, Math.PI * 2); ctx!.fill();
            ctx!.restore();
          }
        } else if (p.type === 'snow') {
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.8, 1, lr)) * 0.85;
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fill();
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }
      ctx!.restore();
    }

    // ============ POST-PROCESSING ============
    function applyBloom() {
      const bloomAlpha = 0.4;
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(4px) brightness(1.25)';
      bctx.drawImage(canvas!, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.globalAlpha = bloomAlpha;
      ctx!.drawImage(bloom, 0, 0, W, H);
      ctx!.restore();
    }

    function applyVignette() {
      const grad = ctx!.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.9);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx!.save();
      ctx!.globalCompositeOperation = 'overlay';
      ctx!.globalAlpha = 0.2;
      const ox = Math.floor(Math.random() * 64), oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) ctx!.drawImage(grain, x, y);
      }
      ctx!.restore();
    }

    // ============ MAIN RENDER PIPELINE ============
    function render(t: number, dt: number) {
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx!.fillStyle = '#01040a';
      ctx!.fillRect(0, 0, W, H);

      spawnParticles(t);

      draw3DGoldenTrishul(t);
      drawDecoratedShivalinga(t);
      drawSnowyKailashAndText(t);

      updateAndDrawParticles(dt, t);

      const fadeIn = 1 - smoothstep(0, 0.8, t);
      const fadeOut = smoothstep(14.0, 14.5, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx!.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx!.fillRect(0, 0, W, H);
      }

      applyBloom();
      applyVignette();
      applyGrain();
    }

    function loop(now: number) {
      if (!running) return;
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
      lastTime = now;

      if (t >= 14.3 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 14.5) {
        render(t, dt);
      } else {
        ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx!.fillStyle = '#000000';
        ctx!.fillRect(0, 0, W, H);
      }
      rafId = requestAnimationFrame(loop);
    }

    document.fonts.ready.then(() => {
      resize();
      window.addEventListener('resize', resize);
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-[99999] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#01040a',
        }}
      />
      {/* SKIP BUTTON */}
      <button
        onClick={() => onComplete?.()}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-[100] px-4 py-2 rounded-full border border-sky-400/30 bg-black/40 text-sky-200 backdrop-blur-md text-[10px] sm:text-xs font-bold tracking-[0.2em] transition-all duration-300 hover:bg-sky-400/20 hover:border-sky-300/70"
      >
        SKIP →
      </button>
    </div>
  );
}
