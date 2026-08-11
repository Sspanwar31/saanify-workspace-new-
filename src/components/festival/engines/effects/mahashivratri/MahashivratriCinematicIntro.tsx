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
    if (!document.getElementById('maha-shiv-fonts-v2')) {
      const link = document.createElement('link');
      link.id = 'maha-shiv-fonts-v2';
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

    // Offscreen Canvas
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    const pool = new ParticlePool(3500);

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
    // SCENE 1: WINTER FOG & TRISHUL ON RIGHT SIDE (0.0s -> 3.5s)
    // =========================================================================
    function drawTrishulRightSide(t: number) {
      const vis = smoothstep(0.0, 1.0, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0022;
      
      // Trishul enters from bottom and settles on Right Side
      const trishulX = W * 0.80;
      const entryY = H * 1.2 - smoothstep(0.0, 3.0, t) * (H * 0.65);
      const trishulY = entryY;

      ctx!.save();
      ctx!.globalAlpha = vis;
      ctx!.translate(trishulX, trishulY);

      // Gold Metallic Shaft
      const shaftW = 10 * s;
      const shaftH = 320 * s;
      const topY = -shaftH / 2;

      const goldGrad = ctx!.createLinearGradient(-shaftW, 0, shaftW, 0);
      goldGrad.addColorStop(0, '#FFFDF0');
      goldGrad.addColorStop(0.3, '#FFD700');
      goldGrad.addColorStop(0.7, '#C59B27');
      goldGrad.addColorStop(1, '#3D2800');

      ctx!.fillStyle = goldGrad;
      ctx!.fillRect(-shaftW / 2, topY, shaftW, shaftH);

      // Center Prongs
      ctx!.beginPath();
      ctx!.moveTo(0, topY - 70 * s);
      ctx!.lineTo(-10 * s, topY);
      ctx!.lineTo(10 * s, topY);
      ctx!.closePath();
      ctx!.fill();

      // Left Prong
      ctx!.beginPath();
      ctx!.moveTo(-45 * s, topY - 45 * s);
      ctx!.quadraticCurveTo(-35 * s, topY + 15 * s, -15 * s, topY + 50 * s);
      ctx!.lineTo(-6 * s, topY + 30 * s);
      ctx!.quadraticCurveTo(-22 * s, topY - 10 * s, -30 * s, topY - 35 * s);
      ctx!.closePath();
      ctx!.fill();

      // Right Prong
      ctx!.beginPath();
      ctx!.moveTo(45 * s, topY - 45 * s);
      ctx!.quadraticCurveTo(35 * s, topY + 15 * s, 15 * s, topY + 50 * s);
      ctx!.lineTo(6 * s, topY + 30 * s);
      ctx!.quadraticCurveTo(22 * s, topY - 10 * s, 30 * s, topY - 35 * s);
      ctx!.closePath();
      ctx!.fill();

      // Sharp Edges
      ctx!.strokeStyle = '#FFFFFF';
      ctx!.lineWidth = 1.5 * s;
      ctx!.stroke();

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2 & 3: GRAND DECORATED SHIVALINGA & GANGA ABHISHEKAM (3.5s -> 10.5s)
    // =========================================================================
    function drawDecoratedShivalinga(t: number) {
      const vis = smoothstep(3.2, 4.2, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0022;
      const cx = W * 0.42; // Center-left for balance with Trishul
      const baseY = H * 0.75;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // --- SHIVALINGA BASE (Jaladhari) ---
      const baseGrad = ctx!.createLinearGradient(cx - 100 * s, baseY, cx + 100 * s, baseY);
      baseGrad.addColorStop(0, '#111318');
      baseGrad.addColorStop(0.5, '#2a2e38');
      baseGrad.addColorStop(1, '#090a0d');

      // Lower Pedestal
      ctx!.fillStyle = baseGrad;
      ctx!.beginPath();
      ctx!.ellipse(cx, baseY + 30 * s, 110 * s, 25 * s, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = '#555f6e';
      ctx!.lineWidth = 2 * s;
      ctx!.stroke();

      // Jaladhari Spout
      ctx!.beginPath();
      ctx!.ellipse(cx, baseY + 10 * s, 90 * s, 20 * s, 0, 0, Math.PI * 2);
      ctx!.fill();

      // --- MAIN SHIVALINGA STONE (Pind) ---
      const lingaGrad = ctx!.createRadialGradient(cx - 20 * s, baseY - 50 * s, 10 * s, cx, baseY - 50 * s, 60 * s);
      lingaGrad.addColorStop(0, '#3a3f4d');
      lingaGrad.addColorStop(0.5, '#181b24');
      lingaGrad.addColorStop(1, '#050608');

      ctx!.fillStyle = lingaGrad;
      ctx!.beginPath();
      ctx!.moveTo(cx - 45 * s, baseY + 10 * s);
      ctx!.lineTo(cx - 45 * s, baseY - 50 * s);
      ctx!.bezierCurveTo(cx - 45 * s, baseY - 110 * s, cx + 45 * s, baseY - 110 * s, cx + 45 * s, baseY - 50 * s);
      ctx!.lineTo(cx + 45 * s, baseY + 10 * s);
      ctx!.closePath();
      ctx!.fill();

      // --- TRIPUNDRA BHASMA TILAK & KUMKUM BINDU ---
      ctx!.fillStyle = 'rgba(230, 240, 255, 0.9)';
      for (let i = 0; i < 3; i++) {
        ctx!.fillRect(cx - 22 * s, baseY - 70 * s + i * 6 * s, 44 * s, 3 * s);
      }
      // Red Kumkum Bindu
      ctx!.fillStyle = '#e62e00';
      ctx!.beginPath();
      ctx!.arc(cx, baseY - 64 * s, 5 * s, 0, Math.PI * 2);
      ctx!.fill();

      // --- MARIGOLD FLOWER GARLAND DECORATION (Jaimala) ---
      for (let a = -Math.PI * 0.8; a <= Math.PI * 0.8; a += 0.3) {
        const gx = cx + Math.cos(a) * 48 * s;
        const gy = baseY + 12 * s + Math.sin(a) * 12 * s;
        ctx!.fillStyle = (Math.sin(a * 10) > 0) ? '#ff9900' : '#ffcc00';
        ctx!.beginPath();
        ctx!.arc(gx, gy, 6 * s, 0, Math.PI * 2);
        ctx!.fill();
      }

      // --- GANGA JAL / MILK ABHISHEKAM STREAM (7.0s -> 10.5s) ---
      if (t > 6.5) {
        const streamVis = smoothstep(6.5, 7.5, t) * (1 - smoothstep(10.0, 10.5, t));
        
        // Vertical Milk/Ganga Stream
        const gangaGrad = ctx!.createLinearGradient(cx, -10, cx, baseY - 80 * s);
        gangaGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * streamVis})`);
        gangaGrad.addColorStop(0.7, `rgba(220, 240, 255, ${0.85 * streamVis})`);
        gangaGrad.addColorStop(1, `rgba(255, 255, 255, ${0.95 * streamVis})`);

        ctx!.strokeStyle = gangaGrad;
        ctx!.lineWidth = 8 * s;
        ctx!.beginPath();
        ctx!.moveTo(cx, -10);
        ctx!.lineTo(cx, baseY - 80 * s);
        ctx!.stroke();

        // Milk Splashing / Overflowing on Shivalinga Top
        const splashR = 25 * s * streamVis;
        const milkGlow = ctx!.createRadialGradient(cx, baseY - 80 * s, 0, cx, baseY - 80 * s, splashR);
        milkGlow.addColorStop(0, `rgba(255, 255, 255, ${0.95 * streamVis})`);
        milkGlow.addColorStop(0.6, `rgba(200, 230, 255, ${0.7 * streamVis})`);
        milkGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx!.fillStyle = milkGlow;
        ctx!.beginPath();
        ctx!.arc(cx, baseY - 80 * s, splashR, 0, Math.PI * 2);
        ctx!.fill();

        // Milk Flowing down sides
        ctx!.fillStyle = `rgba(255, 255, 255, ${0.6 * streamVis})`;
        ctx!.fillRect(cx - 35 * s, baseY - 80 * s, 70 * s, 85 * s);
      }

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 4: SNOWY KAILASH TRANSITION & FROZEN ICE TEXT (10.5s -> 14.5s)
    // =========================================================================
    function drawSnowyKailashAndText(t: number) {
      const vis = smoothstep(10.2, 11.2, t) * (1 - smoothstep(14.0, 14.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0022;
      const cx = W / 2;
      const cy = H * 0.45;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // --- DEEP SNOWY KAILASH BACKDROP ---
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#01050a');
      skyGrad.addColorStop(0.5, '#051824');
      skyGrad.addColorStop(1, '#01050a');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // Snowy Mountain Peaks Silhouette
      ctx!.fillStyle = '#06131f';
      ctx!.beginPath();
      ctx!.moveTo(0, H * 0.8);
      ctx!.lineTo(W * 0.2, H * 0.5);
      ctx!.lineTo(W * 0.5, H * 0.3); // Kailash Main Peak
      ctx!.lineTo(W * 0.8, H * 0.55);
      ctx!.lineTo(W, H * 0.8);
      ctx!.lineTo(W, H);
      ctx!.lineTo(0, H);
      ctx!.closePath();
      ctx!.fill();

      // Snow Cap Highlights
      ctx!.fillStyle = '#e0f7ff';
      ctx!.beginPath();
      ctx!.moveTo(W * 0.42, H * 0.353);
      ctx!.lineTo(W * 0.5, H * 0.3);
      ctx!.lineTo(W * 0.58, H * 0.38);
      ctx!.lineTo(W * 0.52, H * 0.37);
      ctx!.closePath();
      ctx!.fill();

      // --- FROZEN ICE/SNOW STYLE TEXT REVEAL ---
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      // 1. "ॐ नमः शिवाय"
      const fontS1 = Math.min(W * 0.08, 70);
      ctx!.font = `700 ${fontS1}px "Tiro Devanagari Hindi", serif`;

      // Ice Glow Shadow
      ctx!.shadowBlur = 25;
      ctx!.shadowColor = '#00e5ff';
      ctx!.strokeStyle = '#ffffff';
      ctx!.lineWidth = fontS1 * 0.08;
      ctx!.strokeText('ॐ नमः शिवाय', cx, cy - 20 * s);

      // Crystalline Ice Gradient Fill
      const iceGrad1 = ctx!.createLinearGradient(0, cy - fontS1, 0, cy);
      iceGrad1.addColorStop(0.0, '#FFFFFF');
      iceGrad1.addColorStop(0.4, '#E0F7FF');
      iceGrad1.addColorStop(0.8, '#A5F3FC');
      iceGrad1.addColorStop(1.0, '#0284C7');

      ctx!.fillStyle = iceGrad1;
      ctx!.fillText('ॐ नमः शिवाय', cx, cy - 20 * s);

      // 2. "HAPPY MAHA SHIVRATRI 2027"
      const fontS2 = Math.min(W * 0.048, 42);
      const cyEng = cy + fontS1 * 0.95;
      ctx!.font = `900 ${fontS2}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 15;
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
      // Winter Fog/Smoke Rising from Bottom (0s -> 10s)
      if (t < 10.5 && Math.random() < 0.6) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'smoke'; p.x = Math.random() * W; p.y = H + 20;
        p.vx = (Math.random() - 0.5) * 0.8; p.vy = -1.2 - Math.random() * 1.5;
        p.size = 25 + Math.random() * 35; p.maxLife = 5; p.life = 0; p.alpha = 0;
        p.color = '#cce8ff';
      }

      // Falling Bel Patra Leaves (7s -> 10.5s)
      if (t > 6.8 && t < 10.5 && Math.random() < 0.4) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'belpatra'; p.x = W * 0.2 + Math.random() * W * 0.5; p.y = -20;
        p.vx = (Math.random() - 0.5) * 1.5; p.vy = 1.5 + Math.random() * 2;
        p.size = 6 + Math.random() * 6; p.maxLife = 4; p.life = 0; p.alpha = 0;
        p.color = '#22c55e'; p.rotSpeed = (Math.random() - 0.5) * 0.1;
      }

      // Heavy Snowfall (10.5s -> 14.5s)
      if (t > 10.0 && t < 14.5 && Math.random() < 0.8) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'snow'; p.x = Math.random() * W; p.y = -10;
        p.vx = (Math.random() - 0.5) * 1.8; p.vy = 1.2 + Math.random() * 2.2;
        p.size = 1.5 + Math.random() * 3; p.maxLife = 6; p.life = 0; p.alpha = 0;
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
          p.alpha = smoothstep(0, 0.3, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.25 * (t < 10 ? 1 : 1 - smoothstep(10, 10.5, t));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, 'rgba(200, 230, 255, 0.4)');
            grad.addColorStop(1, 'rgba(200, 230, 255, 0)');
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
            // 🍃 Bel Patra Leaf Shape (Trifoliate)
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

      drawTrishulRightSide(t);
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
