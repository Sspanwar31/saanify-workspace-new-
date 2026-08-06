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
type PType = 'ember' | 'steam' | 'petal' | 'dust' | 'spark';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; active: boolean; gravity: number; drag: number;
  color: string; rot: number; rotSpd: number;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', active: false, gravity: 0, drag: 0.98,
        color: '#fff', rot: 0, rotSpd: 0
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    if (!p) return null;
    p.active = true; p.life = 0; p.alpha = 0;
    return p;
  }
  release(p: Particle) {
    if (!p) return;
    p.active = false;
    this.free.push(p.idx);
  }
}

export default function PongalCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (!document.getElementById('pongal-google-font')) {
      const link = document.createElement('link');
      link.id = 'pongal-google-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Sans+Tamil:wght@700;900&display=swap';
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

    // Offscreen canvases for Cinematic Post-Processing
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    // Soft Glowing Sprites for Particles
    function makeSprite(size: number, inner: string, mid: string): HTMLCanvasElement {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const cx = c.getContext('2d')!;
      const grad = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, inner);
      grad.addColorStop(0.35, mid);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = grad;
      cx.fillRect(0, 0, size, size);
      return c;
    }
    const dustSprite = makeSprite(64, 'rgba(255,220,150,1)', 'rgba(255,140,40,0.4)');
    const steamSprite = makeSprite(64, 'rgba(255,255,255,0.8)', 'rgba(200,200,200,0.2)');

    const pool = new ParticlePool(2000);
    const cam = { x: 0, y: 0, zoom: 1 };

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      
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
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 20;
      }
      gctx.putImageData(id, 0, 0);
    }

    // =========================================================================
    // SCENE 1: CINEMATIC HARVEST & BULLOCK CART (0.0s -> 3.5s) - [Screenshot 1]
    // =========================================================================
    function drawScene1_HarvestCart(t: number) {
      const vis = smoothstep(0.0, 0.8, t) * (1 - smoothstep(3.0, 3.5, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      // Deep Cinematic Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0.0, '#050102');
      skyGrad.addColorStop(0.3, '#3a0e02');
      skyGrad.addColorStop(0.6, '#8a300a');
      skyGrad.addColorStop(0.85, '#d65a15');
      skyGrad.addColorStop(1.0, '#2a1a05');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Sun with Anamorphic Lens Flare
      const sx = W * 0.7, sy = H * 0.45;
      const sunR = Math.min(W, H) * 0.06;
      ctx.globalCompositeOperation = 'screen';
      
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.min(W, H) * 0.6);
      halo.addColorStop(0, `rgba(255, 220, 120, ${0.7 * vis})`);
      halo.addColorStop(0.3, `rgba(255, 100, 20, ${0.3 * vis})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(0.1, sunR));
      core.addColorStop(0, `rgba(255, 255, 240, ${1.0 * vis})`);
      core.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.1, sunR), 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.6 * vis;
      const flareGrad = ctx.createLinearGradient(0, sy, W, sy);
      flareGrad.addColorStop(0, 'rgba(255,200,100,0)');
      flareGrad.addColorStop(0.5, `rgba(255,220,150,0.4)`);
      flareGrad.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, sy - 2, W, 4);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Layered Sugarcane Field
      const drawSugarcaneLayer = (yOffset: number, color: string, scale: number, count: number) => {
        for (let i = 0; i < count; i++) {
          const tx = (i / count) * W + Math.sin(i * 12.3) * 30 * scale;
          const ty = H * 0.7 + yOffset + (i % 4) * 10 * scale;
          const sway = Math.sin(t * 1.5 + i) * 15 * scale;
          ctx.strokeStyle = color;
          ctx.lineWidth = 4 * scale + (i % 3);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx + sway, ty - 120 * scale, tx + sway * 1.5, ty - 240 * scale);
          ctx.stroke();
        }
      };
      drawSugarcaneLayer(80, `rgba(40, 15, 5, ${0.9 * vis})`, 1.2, 20);
      drawSugarcaneLayer(40, `rgba(25, 10, 2, ${1.0 * vis})`, 1.0, 25);
      
      // Realistic Bullock Cart & White Ox
      const cartX = W * 0.15 + (t * 80);
      const cartY = H * 0.78;
      const wheelR = Math.min(W, H) * 0.06;

      ctx.save();
      ctx.translate(cartX, cartY);

      // Ox Silhouette
      ctx.fillStyle = '#0a0301';
      ctx.beginPath();
      ctx.moveTo(-wheelR * 3.5, 0);
      ctx.quadraticCurveTo(-wheelR * 4.5, -wheelR * 0.5, -wheelR * 5, -wheelR * 0.2); // Head
      ctx.lineTo(-wheelR * 5.5, -wheelR * 0.8); // Horn
      ctx.lineTo(-wheelR * 4.2, wheelR); // Bottom neck
      ctx.lineTo(-wheelR * 1.5, wheelR * 0.8);
      ctx.closePath();
      ctx.fill();

      // Cart Body Shadow & 3D Shading
      const cartGrad = ctx.createLinearGradient(0, -wheelR, 0, wheelR);
      cartGrad.addColorStop(0, '#4a200a');
      cartGrad.addColorStop(1, '#1a0a02');
      ctx.fillStyle = cartGrad;
      ctx.fillRect(-wheelR * 1.5, -wheelR * 0.8, wheelR * 3, wheelR * 0.6);

      // Person on Cart
      ctx.fillStyle = '#2a1005';
      ctx.beginPath();
      ctx.arc(wheelR * 0.5, -wheelR * 1.5, wheelR * 0.4, 0, Math.PI * 2); // Head
      ctx.fill();
      ctx.fillRect(wheelR * 0.2, -wheelR * 1.2, wheelR * 0.6, wheelR * 0.8); // Body

      // Sugarcane Load
      ctx.fillStyle = '#c28527';
      ctx.beginPath();
      ctx.ellipse(-wheelR * 0.8, -wheelR * 1.3, wheelR * 0.6, wheelR * 0.5, 0, 0, Math.PI * 2);
      ctx.ellipse(0, -wheelR * 1.4, wheelR * 0.7, wheelR * 0.6, 0, 0, Math.PI * 2);
      ctx.ellipse(wheelR * 0.8, -wheelR * 1.2, wheelR * 0.5, wheelR * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3D Wooden Wheel
      ctx.save();
      ctx.rotate(t * 3);
      const wheelGrad = ctx.createRadialGradient(0, 0, wheelR * 0.2, 0, 0, wheelR);
      wheelGrad.addColorStop(0, '#3a1805');
      wheelGrad.addColorStop(1, '#0a0301');
      ctx.fillStyle = wheelGrad;
      ctx.beginPath();
      ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#240e02';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
      ctx.stroke();

      for (let s = 0; s < 8; s++) {
        const angle = (s / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * wheelR, Math.sin(angle) * wheelR);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
      ctx.restore();

      // Spawn Dust behind cart
      if (Math.random() < 0.3) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'dust'; p.x = cartX - wheelR * 2; p.y = cartY;
        p.vx = -1 - Math.random(); p.vy = -0.5 - Math.random();
        p.size = 2 + Math.random() * 3; p.maxLife = 2; p.life = 0; p.alpha = 0.5;
        p.gravity = -0.2; p.drag = 0.95;
      }
    }

    // =========================================================================
    // SCENE 2: 3D POT, KOLAM & COURTYARD (3.2s -> 6.5s) - [Screenshot 2]
    // =========================================================================
    function drawScene2_CourtyardPot(t: number) {
      const vis = smoothstep(3.2, 4.0, t) * (1 - smoothstep(6.0, 6.5, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      // Dark Courtyard Ground
      const groundGrad = ctx.createRadialGradient(W * 0.5, H * 0.75, 0, W * 0.5, H * 0.75, W * 0.9);
      groundGrad.addColorStop(0, '#3d1d0c');
      groundGrad.addColorStop(0.6, '#1f0a03');
      groundGrad.addColorStop(1, '#0a0301');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 0, W, H);

      // Traditional House with Festive Decor
      ctx.fillStyle = '#0a0301';
      ctx.beginPath();
      ctx.moveTo(W * 0.1, H * 0.45);
      ctx.lineTo(W * 0.5, H * 0.2);
      ctx.lineTo(W * 0.9, H * 0.45);
      ctx.lineTo(W * 0.85, H * 0.65);
      ctx.lineTo(W * 0.15, H * 0.65);
      ctx.closePath();
      ctx.fill();
      
      // Mango Leaf Toran
      ctx.strokeStyle = `rgba(46, 107, 18, ${vis})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W * 0.15, H * 0.45);
      ctx.quadraticCurveTo(W * 0.5, H * 0.52, W * 0.85, H * 0.45);
      ctx.stroke();

      // Glowing Kolam
      ctx.strokeStyle = `rgba(255, 240, 200, ${0.6 * vis})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(255, 200, 100, ${0.8 * vis})`;
      const kx = W * 0.5, ky = H * 0.85;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(kx, ky, Math.max(0.1, 40 + i * 18), Math.max(0.1, 10 + i * 4), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // People Silhouettes around pot
      ctx.fillStyle = '#050100';
      ctx.beginPath();
      ctx.arc(W * 0.35, H * 0.68, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(W * 0.33, H * 0.70, 20, 40);
      ctx.beginPath();
      ctx.arc(W * 0.65, H * 0.68, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(W * 0.63, H * 0.70, 20, 40);

      // 3D Clay Stove
      const potX = W * 0.5, potY = H * 0.62;
      const s = Math.min(W, H) * 0.002;
      
      const stoveGrad = ctx.createLinearGradient(potX - 40*s, potY, potX + 40*s, potY);
      stoveGrad.addColorStop(0, '#1a0500');
      stoveGrad.addColorStop(0.5, '#5a2515');
      stoveGrad.addColorStop(1, '#1a0500');
      ctx.fillStyle = stoveGrad;
      ctx.fillRect(potX - 40*s, potY, 80*s, 30*s);

      // 3D Earthen Pot
      ctx.fillStyle = '#0a0200';
      ctx.beginPath();
      ctx.ellipse(potX, potY - 30*s, Math.max(0.1, 35*s), Math.max(0.1, 10*s), 0, 0, Math.PI * 2);
      ctx.fill();

      const potGrad = ctx.createRadialGradient(potX - 15*s, potY - 10*s, 5*s, potX, potY, 50*s);
      potGrad.addColorStop(0, '#b3622d');
      potGrad.addColorStop(0.4, '#5e2d14');
      potGrad.addColorStop(1, '#1a0500');
      ctx.fillStyle = potGrad;
      ctx.beginPath();
      ctx.moveTo(potX - 25*s, potY - 30*s);
      ctx.bezierCurveTo(potX - 45*s, potY, potX - 35*s, potY + 40*s, potX, potY + 45*s);
      ctx.bezierCurveTo(potX + 35*s, potY + 40*s, potX + 45*s, potY, potX + 25*s, potY - 30*s);
      ctx.closePath();
      ctx.fill();

      // Realistic Fire
      ctx.globalCompositeOperation = 'lighter';
      const flicker = 0.8 + Math.sin(t * 20) * 0.2;
      
      const fireGlow = ctx.createRadialGradient(potX, potY + 10*s, 0, potX, potY + 10*s, Math.max(0.1, 60*s));
      fireGlow.addColorStop(0, `rgba(255, 100, 0, ${0.7 * vis * flicker})`);
      fireGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fireGlow;
      ctx.fillRect(potX - 80*s, potY - 50*s, 160*s, 160*s);

      const fireCore = ctx.createRadialGradient(potX, potY + 5*s, 0, potX, potY + 5*s, Math.max(0.1, 25*s));
      fireCore.addColorStop(0, `rgba(255, 255, 200, ${1.0 * vis * flicker})`);
      fireCore.addColorStop(0.4, `rgba(255, 200, 50, ${0.8 * vis * flicker})`);
      fireCore.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = fireCore;
      ctx.beginPath();
      ctx.arc(potX, potY + 5*s, Math.max(0.1, 25*s), 0, Math.PI * 2);
      ctx.fill();

      // Boiling Milk Overflow
      if (t > 4.5) {
        const milkVis = smoothstep(4.5, 5.5, t) * vis;
        const milkGrad = ctx.createRadialGradient(potX, potY - 30*s, 0, potX, potY - 30*s, Math.max(0.1, 40*s));
        milkGrad.addColorStop(0, `rgba(255, 255, 250, ${0.95 * milkVis})`);
        milkGrad.addColorStop(0.6, `rgba(255, 220, 120, ${0.7 * milkVis})`);
        milkGrad.addColorStop(1, 'rgba(255, 120, 0, 0)');
        ctx.fillStyle = milkGrad;
        ctx.beginPath();
        ctx.arc(potX, potY - 30*s, Math.max(0.1, 40*s), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Particles
      if (Math.random() < 0.6) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'spark'; p.x = potX + (Math.random() - 0.5) * 20*s; p.y = potY + 5*s;
        p.vx = (Math.random() - 0.5) * 1; p.vy = -2 - Math.random() * 2;
        p.size = 1 + Math.random(); p.maxLife = 1.5; p.life = 0; p.alpha = 1;
        p.gravity = 2; p.drag = 0.96; p.color = '#ffaa00';
      }
      if (Math.random() < 0.4) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'steam'; p.x = potX + (Math.random() - 0.5) * 15*s; p.y = potY - 35*s;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = -1 - Math.random();
        p.size = 10 + Math.random() * 10; p.maxLife = 3; p.life = 0; p.alpha = 0.3;
        p.gravity = -0.5; p.drag = 0.99;
      }

      ctx.restore();
    }

    // =========================================================================
    // SCENE 3: BANANA LEAF FEAST (6.3s -> 9.5s) - [Screenshot 3]
    // =========================================================================
    function drawScene3_Feast(t: number) {
      const vis = smoothstep(6.3, 7.0, t) * (1 - smoothstep(9.0, 9.5, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      const woodGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W);
      woodGrad.addColorStop(0, '#45210e');
      woodGrad.addColorStop(1, '#0a0301');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H * 0.55;
      const radius = Math.min(W, H) * 0.25;
      const leafCount = 6;

      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 2;
        const lx = cx + Math.cos(angle) * radius;
        const ly = cy + Math.sin(angle) * radius * 0.5;

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle + Math.PI / 2);

        // Realistic Banana Leaf
        const leafGrad = ctx.createLinearGradient(-40, 0, 40, 0);
        leafGrad.addColorStop(0, '#1a5e1a');
        leafGrad.addColorStop(0.5, '#2eb02e');
        leafGrad.addColorStop(1, '#1a5e1a');
        ctx.fillStyle = leafGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 45, 85, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#0d3d0d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -85);
        ctx.lineTo(0, 85);
        ctx.stroke();

        // Food Textures
        ctx.fillStyle = '#fffdf0'; ctx.beginPath(); ctx.arc(0, 15, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, 15, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c67d0a'; ctx.beginPath(); ctx.arc(-18, -10, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0d3d0d'; ctx.beginPath(); ctx.arc(-18, -10, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(18, -10, 8, 0, Math.PI * 2); ctx.fill();
        
        // People Silhouettes behind leaves
        ctx.restore();
      }
      
      // Draw people around the table
      ctx.fillStyle = `rgba(10, 5, 2, ${vis})`;
      for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const px = cx + Math.cos(angle) * (radius + 40);
          const py = cy + Math.sin(angle) * (radius * 0.5 + 20);
          ctx.beginPath();
          ctx.arc(px, py - 30, 12, 0, Math.PI * 2); ctx.fill(); // Head
          ctx.fillRect(px - 8, py - 20, 16, 30); // Body
      }

      // Steam from food
      if (Math.random() < 0.2) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'steam'; p.x = cx + (Math.random() - 0.5) * 40; p.y = cy;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = -1 - Math.random();
        p.size = 12 + Math.random() * 10; p.maxLife = 2.5; p.life = 0; p.alpha = 0.4;
        p.gravity = -0.5; p.drag = 0.99;
      }

      ctx.restore();
    }

    // =========================================================================
    // SCENE 4: SUNSET BONFIRE (9.3s -> 12.5s) - [Screenshot 4]
    // =========================================================================
    function drawScene4_BonfireKites(t: number) {
      const vis = smoothstep(9.3, 10.0, t) * (1 - smoothstep(12.0, 12.5, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0.0, '#1a052e');
      skyGrad.addColorStop(0.4, '#7a1c3d');
      skyGrad.addColorStop(0.7, '#e85d04');
      skyGrad.addColorStop(1.0, '#2b1402');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // River and Mountains
      ctx.fillStyle = '#0a0301';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.6);
      ctx.quadraticCurveTo(W * 0.3, H * 0.4, W * 0.5, H * 0.55);
      ctx.quadraticCurveTo(W * 0.8, H * 0.7, W, H * 0.5);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();

      // Sun
      ctx.globalCompositeOperation = 'screen';
      const sunGlow = ctx.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, W * 0.4);
      sunGlow.addColorStop(0, `rgba(255, 245, 200, ${0.8 * vis})`);
      sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';

      // Ground
      ctx.fillStyle = '#050100';
      ctx.fillRect(0, H * 0.7, W, H * 0.3);

      // People around fire
      ctx.fillStyle = '#050100';
      const fireX = W * 0.5, fireY = H * 0.8;
      for(let i=0; i<5; i++) {
        const px = fireX + (i - 2) * 60;
        const py = fireY + 10;
        ctx.beginPath(); ctx.arc(px, py - 20, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(px - 7, py - 10, 14, 25);
      }

      // Bonfire
      ctx.globalCompositeOperation = 'lighter';
      const fireFlicker = 0.85 + Math.sin(t * 25) * 0.15;
      
      const bonfireGlow = ctx.createRadialGradient(fireX, fireY, 0, fireX, fireY, Math.min(W, H) * 0.3);
      bonfireGlow.addColorStop(0, `rgba(255, 220, 100, ${0.9 * fireFlicker * vis})`);
      bonfireGlow.addColorStop(0.4, `rgba(255, 80, 0, ${0.6 * fireFlicker * vis})`);
      bonfireGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bonfireGlow;
      ctx.fillRect(0, 0, W, H);

      const fireCore = ctx.createRadialGradient(fireX, fireY - 10, 0, fireX, fireY - 10, Math.min(W, H) * 0.08);
      fireCore.addColorStop(0, `rgba(255, 255, 255, ${1.0 * vis})`);
      fireCore.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = fireCore;
      ctx.beginPath();
      ctx.arc(fireX, fireY - 10, Math.min(W, H) * 0.08, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalCompositeOperation = 'source-over';

      // Intense Embers
      if (Math.random() < 0.8) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'spark'; p.x = fireX + (Math.random() - 0.5) * 40; p.y = fireY;
        p.vx = (Math.random() - 0.5) * 3; p.vy = -3 - Math.random() * 4;
        p.size = 1.5 + Math.random() * 2.5; p.maxLife = 2; p.life = 0; p.alpha = 1;
        p.gravity = 1.5; p.drag = 0.97; p.color = Math.random() < 0.5 ? '#ffd700' : '#ff3300';
      }

      // Kites in background
      const kites = [
        { x: W * 0.2, y: H * 0.25, color: '#e63946', size: 25 },
        { x: W * 0.75, y: H * 0.2, color: '#ffd166', size: 30 }
      ];
      for (const k of kites) {
        const kx = k.x + Math.sin(t * 1.5 + k.size) * 20;
        const ky = k.y + Math.cos(t * 1.2 + k.size) * 15;
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(Math.sin(t * 1.5 + k.size) * 0.2);
        const kGrad = ctx.createLinearGradient(0, -k.size, 0, k.size);
        kGrad.addColorStop(0, k.color);
        kGrad.addColorStop(1, '#000');
        ctx.fillStyle = kGrad;
        ctx.beginPath();
        ctx.moveTo(0, -k.size);
        ctx.lineTo(k.size * 0.7, 0);
        ctx.lineTo(0, k.size);
        ctx.lineTo(-k.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    // =========================================================================
    // SCENE 5: KITE FESTIVAL (12.3s -> 15.5s) - [Screenshot 5 & 6]
    // =========================================================================
    function drawScene5_KiteFestival(t: number) {
      const vis = smoothstep(12.3, 13.0, t) * (1 - smoothstep(15.0, 15.5, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0.0, '#2b1004');
      skyGrad.addColorStop(0.5, '#e85d04');
      skyGrad.addColorStop(1.0, '#faa307');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Intense Sun Rays
      ctx.globalCompositeOperation = 'lighter';
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + t * 0.1;
        ctx.save();
        ctx.translate(W/2, H*0.4);
        ctx.rotate(angle);
        const rayGrad = ctx.createLinearGradient(0, 0, 0, -W);
        rayGrad.addColorStop(0, `rgba(255, 200, 100, ${0.15 * vis})`);
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rayGrad;
        ctx.fillRect(-20, -W, 40, W);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Ground & Kids Silhouettes
      ctx.fillStyle = '#1a0500';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.8);
      ctx.quadraticCurveTo(W * 0.5, H * 0.75, W, H * 0.8);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.fill();

      // Kids flying kites
      for(let i=0; i<4; i++) {
        const px = W * 0.2 + i * (W * 0.2);
        const py = H * 0.85;
        ctx.fillStyle = '#0a0200';
        ctx.beginPath(); ctx.arc(px, py - 15, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(px - 6, py - 7, 12, 20);
        
        // Kite string
        const kx = px + Math.sin(t * 2 + i) * 40;
        const ky = H * 0.3 - i * 20;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py - 15);
        ctx.quadraticCurveTo(px + 20, py - 60, kx, ky);
        ctx.stroke();
      }

      // Dynamic Colorful Kites
      const kites = [
        { x: W * 0.2, y: H * 0.3, color: '#e63946', size: 35 },
        { x: W * 0.4, y: H * 0.2, color: '#06d6a0', size: 30 },
        { x: W * 0.6, y: H * 0.35, color: '#118ab2', size: 40 },
        { x: W * 0.8, y: H * 0.25, color: '#ffd166', size: 32 },
        { x: W * 0.5, y: H * 0.15, color: '#ef476f', size: 28 }
      ];

      for (const k of kites) {
        const kx = k.x + Math.sin(t * 1.5 + k.size) * 30;
        const ky = k.y + Math.cos(t * 1.2 + k.size) * 20;
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(Math.sin(t * 1.5 + k.size) * 0.3);

        const kGrad = ctx.createLinearGradient(0, -k.size, 0, k.size);
        kGrad.addColorStop(0, k.color);
        kGrad.addColorStop(0.5, k.color);
        kGrad.addColorStop(1, '#000');
        ctx.fillStyle = kGrad;
        ctx.beginPath();
        ctx.moveTo(0, -k.size);
        ctx.lineTo(k.size * 0.7, 0);
        ctx.lineTo(0, k.size);
        ctx.lineTo(-k.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -k.size);
        ctx.lineTo(0, k.size);
        ctx.moveTo(-k.size * 0.7, 0);
        ctx.lineTo(k.size * 0.7, 0);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, k.size);
        ctx.quadraticCurveTo(15, k.size + 20, 5, k.size + 40);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    // =========================================================================
    // SCENE 6: 3D METALLIC TYPOGRAPHY (15.3s -> 18.0s)
    // =========================================================================
    function drawTextBackgroundDarken(t: number) {
      const vis = smoothstep(15.3, 16.0, t) * (1 - smoothstep(17.5, 18.0, t));
      if (vis <= 0.001) return;
      ctx.save();
      ctx.fillStyle = `rgba(2, 1, 0, ${0.98 * vis})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function drawScene6_Typography(t: number) {
      const vis = smoothstep(15.5, 16.5, t) * (1 - smoothstep(17.5, 18.0, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Volumetric God Rays
      ctx.globalCompositeOperation = 'lighter';
      const rayCount = 15;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 0.25) + (i / rayCount) * (Math.PI * 0.5);
        const len = H * 0.9;
        const a = 0.04 * vis * (0.7 + 0.3 * Math.sin(t * 1.5 + i));
        const grad = ctx.createLinearGradient(W / 2, 0, W / 2 + Math.cos(angle) * len, Math.sin(angle) * len);
        grad.addColorStop(0, `rgba(255, 225, 140, ${a * 1.5})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(W / 2, 0);
        ctx.lineTo(W / 2 + Math.cos(angle - 0.03) * len, Math.sin(angle - 0.03) * len);
        ctx.lineTo(W / 2 + Math.cos(angle + 0.03) * len, Math.sin(angle + 0.03) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Tamil Text
      const fontSizeTamil = Math.min(W * 0.075, 75);
      const cy1 = H * 0.42;
      ctx.font = `900 ${fontSizeTamil}px "Noto Sans Tamil", sans-serif`;
      
      ctx.strokeStyle = '#0a0301';
      ctx.lineWidth = fontSizeTamil * 0.08;
      ctx.lineJoin = 'round';
      ctx.strokeText('பொங்கல் திருநாள் வாழ்த்துக்கள்', W / 2, cy1);

      const goldTamil = ctx.createLinearGradient(0, cy1 - fontSizeTamil * 0.5, 0, cy1 + fontSizeTamil * 0.5);
      goldTamil.addColorStop(0.00, '#FFFDF0');
      goldTamil.addColorStop(0.30, '#FFE8A3');
      goldTamil.addColorStop(0.50, '#FFC837');
      goldTamil.addColorStop(0.80, '#B87B00');
      goldTamil.addColorStop(1.00, '#3A1F00');

      ctx.shadowBlur = 25;
      ctx.shadowColor = `rgba(229, 160, 13, ${0.8 * vis})`;
      ctx.fillStyle = goldTamil;
      ctx.fillText('பொங்கல் திருநாள் வாழ்த்துக்கள்', W / 2, cy1);

      // English Text
      const fontSizeEng = Math.min(W * 0.055, 55);
      const cy2 = H * 0.55;
      ctx.font = `900 ${fontSizeEng}px "Cinzel", Georgia, serif`;
      
      ctx.strokeStyle = '#0a0301';
      ctx.lineWidth = fontSizeEng * 0.06;
      ctx.strokeText('HAPPY PONGAL 2027', W / 2, cy2);

      const goldEng = ctx.createLinearGradient(0, cy2 - fontSizeEng * 0.5, 0, cy2 + fontSizeEng * 0.5);
      goldEng.addColorStop(0.00, '#FFFFFF');
      goldEng.addColorStop(0.40, '#FFE57F');
      goldEng.addColorStop(0.80, '#C68A00');
      goldEng.addColorStop(1.00, '#3A1F00');

      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(229, 160, 13, ${0.6 * vis})`;
      ctx.fillStyle = goldEng;
      ctx.fillText('HAPPY PONGAL 2027', W / 2, cy2);

      ctx.restore();

      // Marigold Petals
      if (Math.random() < 0.3) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'petal'; p.x = Math.random() * W; p.y = -20;
        p.vx = (Math.random() - 0.5) * 1.2; p.vy = 1.2 + Math.random() * 1.8;
        p.size = 5 + Math.random() * 5; p.maxLife = 10; p.life = 0; p.alpha = 0.8;
        p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 0.1;
        p.color = Math.random() < 0.5 ? '#ff9900' : '#ffcc00';
        p.gravity = 0; p.drag = 0.99;
      }
    }

    // ============ PARTICLE RENDERING ============
    function updateAndDrawParticles(dt: number, t: number) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active) continue;

        p.life += dt;
        const lr = p.life / p.maxLife;

        // Physics Update
        p.vy += p.gravity * dt;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'dust') {
          p.alpha = (1 - lr) * 0.5;
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            const sz = p.size * 4;
            ctx.drawImage(dustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        } else if (p.type === 'steam') {
          p.size += dt * 10;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.4;
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            const sz = p.size;
            ctx.drawImage(steamSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        } else if (p.type === 'spark') {
          p.alpha = 1 - lr;
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();
            // Glow
            ctx.globalAlpha = p.alpha * 0.4;
            const sz = p.size * 4;
            ctx.drawImage(dustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Draw Petals (Normal blending)
      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active || p.type !== 'petal') continue;

        const lr_petal = p.life / p.maxLife;
        p.rot += p.rotSpd * dt * 60;
        p.alpha = smoothstep(0, 0.5, lr_petal) * (1 - smoothstep(0.8, 1, lr_petal)) * 0.9 * (t < 18 ? 1 : 1 - smoothstep(18, 18.5, t));

        if (p.alpha > 0.01) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(0.1, p.size), Math.max(0.1, p.size * 0.4), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (p.life > p.maxLife) pool.release(p);
      }
    }

    // ============ POST-PROCESSING EFFECTS ============
    function applyBloom(t: number) {
      const bloomAlpha = 0.4;
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(4px) brightness(1.2)';
      bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = bloomAlpha;
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.restore();
    }

    function applyVignette() {
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.35;
      const ox = Math.floor(Math.random() * 64), oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) ctx.drawImage(grain, x, y);
      }
      ctx.restore();
    }

    // ============ MAIN RENDER PIPELINE ============
    function render(t: number, dt: number) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      drawScene1_HarvestCart(t);
      drawScene2_CourtyardPot(t);
      drawScene3_Feast(t);
      drawScene4_BonfireKites(t);
      drawScene5_KiteFestival(t);
      
      updateAndDrawParticles(dt, t);

      drawTextBackgroundDarken(t);
      drawScene6_Typography(t);

      const fadeIn = 1 - smoothstep(0, 1.2, t);
      const fadeOut = smoothstep(17.5, 18.0, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx.fillRect(0, 0, W, H);
      }

      applyBloom(t);
      applyVignette();
      applyGrain();
    }     
    
    function loop(now: number) {
      if (!running) return;
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
      lastTime = now;

      if (t >= 18.0 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 18.5) {
        render(t, dt);
      } else {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
      }
      rafId = requestAnimationFrame(loop);
    }

    // Wait for fonts to load
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
    <div className="fixed inset-0 w-full h-full bg-black z-[99999] overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#000',
        }}
      />
    </div>
  );
}
