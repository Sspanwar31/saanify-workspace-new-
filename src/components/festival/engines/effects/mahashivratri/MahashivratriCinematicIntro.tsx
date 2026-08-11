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

// ============ HIGH-PERFORMANCE PARTICLE POOL ============
type PType = 'smoke' | 'snow' | 'belpatra' | 'water_splash' | 'star';

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
    if (!document.getElementById('maha-shiv-fonts-v3')) {
      const link = document.createElement('link');
      link.id = 'maha-shiv-fonts-v3';
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

    // Offscreen Canvas for Bloom
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    const pool = new ParticlePool(4000);

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
    // SCENE 1: 3D GOLDEN TRISHUL ON RIGHT SIDE (0.0s -> 10.5s)
    // =========================================================================
    function draw3DGoldenTrishul(t: number) {
      const vis = smoothstep(0.0, 1.2, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0024;
      const trishulX = W * 0.82;
      const entryY = H * 1.2 - smoothstep(0.0, 3.0, t) * (H * 0.68);
      const trishulY = entryY;

      ctx!.save();
      ctx!.globalAlpha = vis;
      ctx!.translate(trishulX, trishulY);

      const shaftW = 12 * s;
      const shaftH = 340 * s;
      const topY = -shaftH / 2;

      // 24K Gold Metallic Gradient
      const goldGrad = ctx!.createLinearGradient(-shaftW, 0, shaftW, 0);
      goldGrad.addColorStop(0.0, '#FFFDF0');
      goldGrad.addColorStop(0.2, '#FFD700');
      goldGrad.addColorStop(0.6, '#C59B27');
      goldGrad.addColorStop(1.0, '#3D2800');

      // Main Shaft
      ctx!.fillStyle = goldGrad;
      ctx!.fillRect(-shaftW / 2, topY, shaftW, shaftH);

      // Center Spear Tip
      ctx!.beginPath();
      ctx!.moveTo(0, topY - 80 * s);
      ctx!.lineTo(-12 * s, topY);
      ctx!.lineTo(12 * s, topY);
      ctx!.closePath();
      ctx!.fill();

      // Curved Left Outer Prong
      ctx!.beginPath();
      ctx!.moveTo(-50 * s, topY - 50 * s);
      ctx!.bezierCurveTo(-40 * s, topY + 10 * s, -20 * s, topY + 55 * s, -6 * s, topY + 30 * s);
      ctx!.bezierCurveTo(-22 * s, topY, -35 * s, topY - 20 * s, -50 * s, topY - 50 * s);
      ctx!.closePath();
      ctx!.fill();

      // Curved Right Outer Prong
      ctx!.beginPath();
      ctx!.moveTo(50 * s, topY - 50 * s);
      ctx!.bezierCurveTo(40 * s, topY + 10 * s, 20 * s, topY + 55 * s, 6 * s, topY + 30 * s);
      ctx!.bezierCurveTo(22 * s, topY, 35 * s, topY - 20 * s, 50 * s, topY - 50 * s);
      ctx!.closePath();
      ctx!.fill();

      // Sharp Highlight Edges
      ctx!.strokeStyle = '#FFFFFF';
      ctx!.lineWidth = 1.8 * s;
      ctx!.stroke();

      // Crescent Moon Finial on Center
      const moonY = topY - 15 * s;
      ctx!.fillStyle = '#FFFDF0';
      ctx!.beginPath();
      ctx!.arc(0, moonY, 12 * s, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = '#051824';
      ctx!.beginPath();
      ctx!.arc(4 * s, moonY - 3 * s, 10 * s, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2 & 3: GRAND DECORATED SHIVALINGA & GANGA ABHISHEKAM (3.5s -> 10.5s)
    // =========================================================================
    function drawDecoratedShivalinga(t: number) {
      const vis = smoothstep(3.2, 4.2, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0024;
      const cx = W * 0.42; // Center-left for Trishul balance
      const baseY = H * 0.76;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // --- SHIVALINGA BASE (Jaladhari Spout) ---
      const baseGrad = ctx!.createLinearGradient(cx - 110 * s, baseY, cx + 110 * s, baseY);
      baseGrad.addColorStop(0, '#0d0f14');
      baseGrad.addColorStop(0.5, '#282d38');
      baseGrad.addColorStop(1, '#06070a');

      // Lower Pedestal
      ctx!.fillStyle = baseGrad;
      ctx!.beginPath();
      ctx!.ellipse(cx, baseY + 32 * s, 120 * s, 28 * s, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = '#525c6e';
      ctx!.lineWidth = 2 * s;
      ctx!.stroke();

      // Jaladhari Platform
      ctx!.beginPath();
      ctx!.ellipse(cx, baseY + 10 * s, 98 * s, 22 * s, 0, 0, Math.PI * 2);
      ctx!.fill();

      // --- MAIN SHIVALINGA STONE (Pind) ---
      const lingaGrad = ctx!.createRadialGradient(cx - 20 * s, baseY - 55 * s, 10 * s, cx, baseY - 55 * s, 65 * s);
      lingaGrad.addColorStop(0, '#424857');
      lingaGrad.addColorStop(0.4, '#1b1e26');
      lingaGrad.addColorStop(1, '#050608');

      ctx!.fillStyle = lingaGrad;
      ctx!.beginPath();
      ctx!.moveTo(cx - 50 * s, baseY + 10 * s);
      ctx!.lineTo(cx - 50 * s, baseY - 55 * s);
      ctx!.bezierCurveTo(cx - 50 * s, baseY - 120 * s, cx + 50 * s, baseY - 120 * s, cx + 50 * s, baseY - 55 * s);
      ctx!.lineTo(cx + 50 * s, baseY + 10 * s);
      ctx!.closePath();
      ctx!.fill();

      // --- TRIPUNDRA BHASMA TILAK & KUMKUM BINDU ---
      ctx!.fillStyle = 'rgba(235, 245, 255, 0.95)';
      for (let i = 0; i < 3; i++) {
        ctx!.fillRect(cx - 24 * s, baseY - 78 * s + i * 7 * s, 48 * s, 3.5 * s);
      }
      // Red Kumkum Bindu
      ctx!.fillStyle = '#e62e00';
      ctx!.beginPath();
      ctx!.arc(cx, baseY - 71 * s, 5.5 * s, 0, Math.PI * 2);
      ctx!.fill();

      // --- MARIGOLD FLOWER GARLAND DECORATION (Jaimala) ---
      for (let a = -Math.PI * 0.85; a <= Math.PI * 0.85; a += 0.28) {
        const gx = cx + Math.cos(a) * 52 * s;
        const gy = baseY + 12 * s + Math.sin(a) * 14 * s;
        ctx!.fillStyle = (Math.sin(a * 12) > 0) ? '#ff9900' : '#ffcc00';
        ctx!.beginPath();
        ctx!.arc(gx, gy, 6.5 * s, 0, Math.PI * 2);
        ctx!.fill();
      }

      // --- REAL FLUID GANGA JAL / MILK ABHISHEKAM STREAM (6.5s -> 10.5s) ---
      if (t > 6.5) {
        const streamVis = smoothstep(6.5, 7.5, t) * (1 - smoothstep(10.0, 10.5, t));
        
        // Fluid Behti Hui Ganga Jal Stream
        ctx!.save();
        ctx!.globalCompositeOperation = 'screen';
        
        const gangaGrad = ctx!.createLinearGradient(cx, -10, cx, baseY - 90 * s);
        gangaGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * streamVis})`);
        gangaGrad.addColorStop(0.5, `rgba(180, 230, 255, ${0.85 * streamVis})`);
        gangaGrad.addColorStop(1, `rgba(255, 255, 255, ${0.95 * streamVis})`);

        ctx!.strokeStyle = gangaGrad;
        ctx!.lineWidth = 10 * s;
        ctx!.lineCap = 'round';
        
        ctx!.beginPath();
        ctx!.moveTo(cx, -10);
        for (let y = -10; y <= baseY - 90 * s; y += 10) {
          const waveX = cx + Math.sin(t * 8 + y * 0.05) * 3 * s;
          ctx!.lineTo(waveX, y);
        }
        ctx!.stroke();

        // Splash Droplets on Shivalinga Top
        const splashR = 28 * s * streamVis;
        const milkGlow = ctx!.createRadialGradient(cx, baseY - 90 * s, 0, cx, baseY - 90 * s, splashR);
        milkGlow.addColorStop(0, `rgba(255, 255, 255, ${0.95 * streamVis})`);
        milkGlow.addColorStop(0.5, `rgba(180, 225, 255, ${0.7 * streamVis})`);
        milkGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx!.fillStyle = milkGlow;
        ctx!.beginPath();
        ctx!.arc(cx, baseY - 90 * s, splashR, 0, Math.PI * 2);
        ctx!.fill();

        // Water/Milk Coating Flowing Down Stone Sides
        ctx!.fillStyle = `rgba(255, 255, 255, ${0.5 * streamVis})`;
        ctx!.beginPath();
        ctx!.ellipse(cx, baseY - 40 * s, 42 * s, 48 * s, 0, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.restore();
      }

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 4: SNOWY MOUNT KAILASH & FROZEN ICE TEXT (10.5s -> 14.5s)
    // =========================================================================
    function drawSnowyKailashAndText(t: number) {
      const vis = smoothstep(10.2, 11.2, t) * (1 - smoothstep(14.0, 14.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0022;
      const cx = W / 2;
      const cy = H * 0.45;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // --- HIMALAYAN SNOWY KAILASH BACKDROP ---
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#01050a');
      skyGrad.addColorStop(0.5, '#051b29');
      skyGrad.addColorStop(1, '#01050a');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // Snowy Mountain Peaks
      ctx!.fillStyle = '#061726';
      ctx!.beginPath();
      ctx!.moveTo(0, H * 0.85);
      ctx!.lineTo(W * 0.2, H * 0.52);
      ctx!.lineTo(W * 0.5, H * 0.28); // Kailash Peak
      ctx!.lineTo(W * 0.8, H * 0.58);
      ctx!.lineTo(W, H * 0.85);
      ctx!.lineTo(W, H);
      ctx!.lineTo(0, H);
      ctx!.closePath();
      ctx!.fill();

      // Snow Cap Highlights
      ctx!.fillStyle = '#e0f7ff';
      ctx!.beginPath();
      ctx!.moveTo(W * 0.42, H * 0.355);
      ctx!.lineTo(W * 0.5, H * 0.28);
      ctx!.lineTo(W * 0.58, H * 0.38);
      ctx!.lineTo(W * 0.52, H * 0.37);
      ctx!.closePath();
      ctx!.fill();

      // --- FROZEN ICE / CRYSTALLINE SNOW STYLE TEXT ---
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      // 1. "ॐ नमः शिवाय"
      const fontS1 = Math.min(W * 0.08, 72);
      ctx!.font = `700 ${fontS1}px "Tiro Devanagari Hindi", serif`;

      ctx!.shadowBlur = 30;
      ctx!.shadowColor = '#00e5ff';
      ctx!.strokeStyle = '#ffffff';
      ctx!.lineWidth = fontS1 * 0.08;
      ctx!.strokeText('ॐ नमः शिवाय', cx, cy - 20 * s);

      const iceGrad1 = ctx!.createLinearGradient(0, cy - fontS1, 0, cy);
      iceGrad1.addColorStop(0.0, '#FFFFFF');
      iceGrad1.addColorStop(0.4, '#E0F7FF');
      iceGrad1.addColorStop(0.8, '#A5F3FC');
      iceGrad1.addColorStop(1.0, '#0284C7');

      ctx!.fillStyle = iceGrad1;
      ctx!.fillText('ॐ नमः शिवाय', cx, cy - 20 * s);

      // 2. "HAPPY MAHA SHIVRATRI 2027"
      const fontS2 = Math.min(W * 0.048, 44);
      const cyEng = cy + fontS1 * 0.95;
      ctx!.font = `900 ${fontS2}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 18;
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
      // Thick Winter Fog/Smoke Rising from Bottom (0s -> 10.5s)
      if (t < 10.5 && Math.random() < 0.7) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'smoke'; p.x = Math.random() * W; p.y = H + 30;
        p.vx = (Math.random() - 0.5) * 1.0; p.vy = -1.5 - Math.random() * 2.0;
        p.size = 35 + Math.random() * 45; p.maxLife = 5; p.life = 0; p.alpha = 0;
        p.color = '#d0ebff';
      }

      // Falling Bel Patra Leaves (6.8s -> 10.5s)
      if (t > 6.8 && t < 10.5 && Math.random() < 0.45) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'belpatra'; p.x = W * 0.2 + Math.random() * W * 0.5; p.y = -20;
        p.vx = (Math.random() - 0.5) * 1.5; p.vy = 1.8 + Math.random() * 2.2;
        p.size = 6.5 + Math.random() * 6.5; p.maxLife = 4; p.life = 0; p.alpha = 0;
        p.color = '#22c55e'; p.rotSpeed = (Math.random() - 0.5) * 0.12;
      }

      // Heavy Snowfall on Kailash (10.0s -> 14.5s)
      if (t > 10.0 && t < 14.5 && Math.random() < 0.85) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'snow'; p.x = Math.random() * W; p.y = -10;
        p.vx = (Math.random() - 0.5) * 1.8; p.vy = 1.2 + Math.random() * 2.5;
        p.size = 1.5 + Math.random() * 3.5; p.maxLife = 6; p.life = 0; p.alpha = 0;
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

        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'smoke') {
          p.alpha = smoothstep(0, 0.3, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.35 * (t < 10 ? 1 : 1 - smoothstep(10, 10.5, t));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, 'rgba(210, 235, 255, 0.45)');
            grad.addColorStop(1, 'rgba(210, 235, 255, 0)');
            ctx!.fillStyle = grad;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fill();
          }
        } else if (p.type === 'belpatra') {
          p.rot += p.rotSpeed;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.8, 1, lr));
          if (p.alpha > 0.01) {
            ctx!.save();
            ctx!.globalAlpha = p.alpha;
            ctx!.translate(p.x, p.y);
            ctx!.rotate(p.rot);
            ctx!.fillStyle = '#16a34a';
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
      const bloomAlpha = 0.35;
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(4px) brightness(1.2)';
      bctx.drawImage(canvas!, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.globalAlpha = bloomAlpha;
      ctx!.drawImage(bloom, 0, 0, W, H);
      ctx!.restore();
    }

    function applyVignette() {
      const grad = ctx!.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.88);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx!.save();
      ctx!.globalCompositeOperation = 'overlay';
      ctx!.globalAlpha = 0.25;
      const ox = Math.floor(Math.random() * 64), oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) ctx!.drawImage(grain, x, y);
      }
      ctx!.restore();
    }

    // ============ MAIN RENDER PIPELINE ============
    function render(t: number, dt: number) {
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx!.fillStyle = '#01050a';
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
          background: '#01050a',
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
