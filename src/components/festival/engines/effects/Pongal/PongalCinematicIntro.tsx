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
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));

// ============ PARTICLE SYSTEM ============
type PType = 'dust' | 'steam' | 'spark' | 'petal' | 'overflow';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; rot: number; rotSpd: number; active: boolean;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', rot: 0, rotSpd: 0, active: false
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
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Noto+Sans+Tamil:wght@400;700;900&display=swap';
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

    const pool = new ParticlePool(1500);
    const cam = { x: 0, y: 0, zoom: 1, rot: 0 };

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
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 18;
      }
      gctx.putImageData(id, 0, 0);
    }

    // ============ SCENE 1: DAWN & HARVEST FIELD (0.0s -> 4.0s) ============
    function drawDawnAndField(t: number) {
      const vis = smoothstep(0.0, 1.5, t) * (1 - smoothstep(3.5, 4.0, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      // Cinematic Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0.00, '#050102');
      skyGrad.addColorStop(0.3, '#3a0e02');
      skyGrad.addColorStop(0.6, '#8a300a');
      skyGrad.addColorStop(0.85, '#d65a15');
      skyGrad.addColorStop(1.00, '#2a1a05');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Sun with Lens Flare
      const sx = W * 0.5;
      const sy = H * 0.6 - smoothstep(0, 4, t) * H * 0.15;
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
      core.addColorStop(0.8, `rgba(255, 180, 50, ${0.8 * vis})`);
      core.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.1, sunR), 0, Math.PI * 2);
      ctx.fill();

      // Anamorphic Lens Flare Line
      ctx.globalAlpha = 0.5 * vis;
      const flareGrad = ctx.createLinearGradient(0, sy, W, sy);
      flareGrad.addColorStop(0, 'rgba(255,200,100,0)');
      flareGrad.addColorStop(0.5, `rgba(255,220,150,0.4)`);
      flareGrad.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, sy - 2, W, 4);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Realistic Sugarcane Field (Layered)
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
      drawSugarcaneLayer(10, `rgba(10, 5, 0, ${1.0 * vis})`, 0.8, 30);

      ctx.restore();
    }

    // ============ SCENE 2: COURTYARD, KOLAM & CLAY STOVE (4.0s -> 12.0s) ============
    function drawCourtyardAndStove(t: number) {
      const vis = smoothstep(4.0, 5.0, t) * (1 - smoothstep(11.5, 12.0, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      // Dark Cinematic Courtyard Ground
      const groundGrad = ctx.createRadialGradient(W * 0.5, H * 0.8, 0, W * 0.5, H * 0.8, W * 0.9);
      groundGrad.addColorStop(0, '#3d2818');
      groundGrad.addColorStop(0.6, '#1a0d04');
      groundGrad.addColorStop(1, '#0a0500'); // ✅ Fixed Syntax Error Here
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H * 0.4, W, H * 0.6);

      // Glowing Kolam (Floor Drawing)
      ctx.strokeStyle = `rgba(255, 240, 200, ${0.6 * vis})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(255, 200, 100, ${0.8 * vis})`;
      const kx = W * 0.5, ky = H * 0.88;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse(kx, ky, Math.max(0.1, 50 + i * 20), Math.max(0.1, 12 + i * 5), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // 3D Clay Stove (Chulha)
      const stoveX = W * 0.5;
      const stoveY = H * 0.68;
      const s = Math.min(W, H) * 0.0025;

      // Stove Base
      const stoveGrad = ctx.createLinearGradient(stoveX - 50 * s, stoveY, stoveX + 50 * s, stoveY);
      stoveGrad.addColorStop(0, '#1a0500');
      stoveGrad.addColorStop(0.5, '#5a2515');
      stoveGrad.addColorStop(1, '#1a0500');
      ctx.fillStyle = stoveGrad;
      ctx.beginPath();
      ctx.moveTo(stoveX - 50 * s, stoveY);
      ctx.lineTo(stoveX - 40 * s, stoveY + 40 * s);
      ctx.lineTo(stoveX + 40 * s, stoveY + 40 * s);
      ctx.lineTo(stoveX + 50 * s, stoveY);
      ctx.closePath();
      ctx.fill();
      
      // Stove Top
      ctx.fillStyle = '#2a1208';
      ctx.beginPath();
      ctx.ellipse(stoveX, stoveY, Math.max(0.1, 50 * s), Math.max(0.1, 15 * s), 0, 0, Math.PI * 2);
      ctx.fill();

      // 3D Earthen Pot (Pongal Pot)
      const potX = stoveX;
      const potY = stoveY - 20 * s;
      
      // Pot Shadow/Inner
      ctx.fillStyle = '#0a0200';
      ctx.beginPath();
      ctx.ellipse(potX, potY - 50 * s, Math.max(0.1, 40 * s), Math.max(0.1, 12 * s), 0, 0, Math.PI * 2);
      ctx.fill();

      // Pot Body with 3D Gradient
      const potGrad = ctx.createRadialGradient(potX - 20 * s, potY - 10 * s, 5 * s, potX, potY, 60 * s);
      potGrad.addColorStop(0, '#b3622d');
      potGrad.addColorStop(0.4, '#5e2d14');
      potGrad.addColorStop(1, '#1a0500');
      ctx.fillStyle = potGrad;
      ctx.beginPath();
      ctx.moveTo(potX - 30 * s, potY - 50 * s);
      ctx.bezierCurveTo(potX - 50 * s, potY, potX - 40 * s, potY + 50 * s, potX, potY + 55 * s);
      ctx.bezierCurveTo(potX + 40 * s, potY + 50 * s, potX + 50 * s, potY, potX + 30 * s, potY - 50 * s);
      ctx.closePath();
      ctx.fill();
      
      // Pot Rim
      ctx.strokeStyle = `rgba(255, 150, 50, ${0.5 * vis})`;
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.ellipse(potX, potY - 50 * s, Math.max(0.1, 40 * s), Math.max(0.1, 12 * s), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Realistic Fire in Stove
      ctx.globalCompositeOperation = 'lighter';
      const fireFlicker = 0.8 + Math.sin(t * 20) * 0.2;
      
      // Outer Fire Glow
      const fireGlow = ctx.createRadialGradient(potX, stoveY, 0, potX, stoveY, Math.max(0.1, 80 * s));
      fireGlow.addColorStop(0, `rgba(255, 100, 0, ${0.6 * vis * fireFlicker})`);
      fireGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fireGlow;
      ctx.fillRect(potX - 100 * s, stoveY - 100 * s, 200 * s, 200 * s);

      // Inner Fire Core
      const fireCore = ctx.createRadialGradient(potX, stoveY - 10 * s, 0, potX, stoveY - 10 * s, Math.max(0.1, 30 * s));
      fireCore.addColorStop(0, `rgba(255, 255, 200, ${1.0 * vis * fireFlicker})`);
      fireCore.addColorStop(0.4, `rgba(255, 200, 50, ${0.8 * vis * fireFlicker})`);
      fireCore.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = fireCore;
      ctx.beginPath();
      ctx.arc(potX, stoveY - 10 * s, Math.max(0.1, 30 * s), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
    }

    // ============ SCENE 3: OVERFLOW & CELEBRATION (8.0s -> 12.0s) ============
    function drawOverflowEffect(t: number) {
      const vis = smoothstep(8.0, 9.0, t) * (1 - smoothstep(11.5, 12.0, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0025;
      const potX = W * 0.5;
      const potTopY = H * 0.68 - 20 * s - 50 * s;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Magical Overflow Glow Burst
      const glowR = Math.min(W, H) * 0.4 * smoothstep(8.0, 9.5, t);
      const glow = ctx.createRadialGradient(potX, potTopY, 0, potX, potTopY, Math.max(0.1, glowR));
      glow.addColorStop(0, `rgba(255, 240, 180, ${0.5 * vis})`);
      glow.addColorStop(0.3, `rgba(255, 180, 50, ${0.3 * vis})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Overflowing Milk & Rice Particles
      if (t > 8.0 && t < 10.5 && Math.random() < 0.9) {
        for (let i = 0; i < 4; i++) {
          const p = pool.spawn(); if (!p) break;
          p.type = 'overflow';
          p.x = potX + (Math.random() - 0.5) * 30 * s;
          p.y = potTopY;
          p.vx = (Math.random() - 0.5) * 5;
          p.vy = -4 - Math.random() * 5;
          p.size = 3 + Math.random() * 5;
          p.maxLife = 2.5; p.life = 0;
          p.alpha = 1.0;
        }
      }

      ctx.restore();
    }

    // ============ SCENE 4: CINEMATIC DARKNESS & GOLDEN TYPOGRAPHY (11.5s -> 18.0s) ============
    function drawTextBackgroundDarken(t: number) {
      const vis = smoothstep(11.5, 12.5, t) * (1 - smoothstep(17.0, 18.0, t));
      if (vis <= 0.001) return;
      
      // Darken everything behind the text
      ctx.save();
      ctx.fillStyle = `rgba(2, 1, 0, ${0.95 * vis})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function drawTypography(t: number) {
      const vis = smoothstep(12.0, 13.5, t) * (1 - smoothstep(17.0, 18.0, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Top God Rays for Text
      ctx.globalCompositeOperation = 'lighter';
      const rayCount = 15;
      const sx = W / 2, sy = -20;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 0.3) + (i / rayCount) * (Math.PI * 0.4) + Math.sin(t * 0.2 + i) * 0.02;
        const len = H * 0.8;
        const a = 0.05 * vis * (0.7 + 0.3 * Math.sin(t * 1.5 + i));
        const ex = sx + Math.cos(angle) * len;
        const ey = sy + Math.sin(angle) * len;
        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, `rgba(255, 225, 140, ${a * 1.5})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle - 0.03) * len, sy + Math.sin(angle - 0.03) * len);
        ctx.lineTo(sx + Math.cos(angle + 0.03) * len, sy + Math.sin(angle + 0.03) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Tamil Text (பொங்கல் திருநாள் வாழ்த்துக்கள்)
      const fontSizeTamil = Math.min(W * 0.08, 80);
      const cy1 = H * 0.42;
      ctx.font = `900 ${fontSizeTamil}px "Noto Sans Tamil", sans-serif`;
      
      // 3D Extrude Effect
      ctx.strokeStyle = '#1d0b02';
      ctx.lineWidth = fontSizeTamil * 0.08;
      ctx.lineJoin = 'round';
      ctx.strokeText('பொங்கல் திருநாள் வாழ்த்துக்கள்', W / 2, cy1);

      const goldGradTamil = ctx.createLinearGradient(0, cy1 - fontSizeTamil * 0.5, 0, cy1 + fontSizeTamil * 0.5);
      goldGradTamil.addColorStop(0.00, '#FFFDF0');
      goldGradTamil.addColorStop(0.30, '#FFE8A3');
      goldGradTamil.addColorStop(0.50, '#FFC837');
      goldGradTamil.addColorStop(0.80, '#B87B00');
      goldGradTamil.addColorStop(1.00, '#3A1F00');

      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(229, 160, 13, ${0.8 * vis})`;
      ctx.fillStyle = goldGradTamil;
      ctx.fillText('பொங்கல் திருநாள் வாழ்த்துக்கள்', W / 2, cy1);

      // English Text (Happy Pongal 2027)
      const fontSizeEng = Math.min(W * 0.06, 60);
      const cy2 = H * 0.58;
      ctx.font = `700 ${fontSizeEng}px "Cinzel", serif`;
      
      ctx.strokeStyle = '#1d0b02';
      ctx.lineWidth = fontSizeEng * 0.06;
      ctx.strokeText('Happy Pongal 2027', W / 2, cy2);

      const goldGradEng = ctx.createLinearGradient(0, cy2 - fontSizeEng * 0.5, 0, cy2 + fontSizeEng * 0.5);
      goldGradEng.addColorStop(0.00, '#FFFDF0');
      goldGradEng.addColorStop(0.30, '#FFC837');
      goldGradEng.addColorStop(0.70, '#B87B00');
      goldGradEng.addColorStop(1.00, '#3A1F00');

      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(229, 160, 13, ${0.6 * vis})`;
      ctx.fillStyle = goldGradEng;
      ctx.fillText('Happy Pongal 2027', W / 2, cy2);

      ctx.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============
    function spawnAmbientParticles(t: number) {
      if (t < 4.0 && Math.random() < 0.3) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'dust'; p.x = Math.random() * W; p.y = H * 0.5 + Math.random() * H * 0.5;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = -0.5 - Math.random() * 0.5;
        p.size = 1 + Math.random() * 2; p.maxLife = 5; p.life = 0; p.alpha = 0;
      }
      if (t > 4.0 && t < 12.0 && Math.random() < 0.4) {
        const s = Math.min(W, H) * 0.0025;
        const p = pool.spawn(); if (!p) return;
        p.type = 'steam'; p.x = W * 0.5 + (Math.random() - 0.5) * 20 * s; p.y = H * 0.68 - 60 * s;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = -1 - Math.random() * 1.5;
        p.size = 15 + Math.random() * 15; p.maxLife = 3.5; p.life = 0; p.alpha = 0;
      }
      if (t > 4.0 && t < 12.0 && Math.random() < 0.6) {
        const s = Math.min(W, H) * 0.0025;
        const p = pool.spawn(); if (!p) return;
        p.type = 'spark'; p.x = W * 0.5 + (Math.random() - 0.5) * 30 * s; p.y = H * 0.68;
        p.vx = (Math.random() - 0.5) * 2; p.vy = -2 - Math.random() * 3;
        p.size = 1 + Math.random() * 2; p.maxLife = 1.5; p.life = 0; p.alpha = 1;
      }
      if (t > 8.0 && t < 17.5 && Math.random() < 0.2) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'petal'; p.x = Math.random() * W; p.y = -20;
        p.vx = (Math.random() - 0.5) * 1; p.vy = 1 + Math.random() * 1.5;
        p.size = 6 + Math.random() * 4; p.maxLife = 10; p.life = 0; p.alpha = 0;
        p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 0.1;
      }
    }

    function updateAndDrawParticles(dt: number, t: number) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active) continue;

        p.life += dt;
        // ✅ Fixed variable scope: defined lr here so all types can use it
        const lr = p.life / p.maxLife;

        if (p.type === 'dust') {
          p.x += p.vx; p.y += p.vy;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.8, 1, lr)) * 0.6 * (t < 4 ? 1 : 1 - smoothstep(4, 5, t));
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            const sz = p.size * 4;
            ctx.drawImage(dustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        } else if (p.type === 'steam') {
          p.x += p.vx; p.y += p.vy;
          p.size += dt * 15;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.3 * (t < 12 ? 1 : 1 - smoothstep(12, 13, t));
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            const sz = p.size;
            ctx.drawImage(steamSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        } else if (p.type === 'spark') {
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.5 * dt * 60;
          p.alpha = 1 - lr;
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = lr < 0.5 ? '#ffffff' : '#ffaa00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (p.type === 'overflow') {
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.8 * dt * 60;
          p.alpha = 1 - lr;
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha * 0.8;
            ctx.fillStyle = '#ffeedd';
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = p.alpha * 0.4;
            const sz = p.size * 4;
            ctx.drawImage(dustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Draw Petals
      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active || p.type !== 'petal') continue;

        p.x += p.vx + Math.sin(t * 2 + p.y * 0.01) * 0.5;
        p.y += p.vy; p.rot += p.rotSpd * dt * 60;
        // ✅ Fixed variable scope: used local lr for petals
        const lr_petal = p.life / p.maxLife;
        p.alpha = smoothstep(0, 0.5, lr_petal) * (1 - smoothstep(0.8, 1, lr_petal)) * 0.9 * (t < 17 ? 1 : 1 - smoothstep(17, 18, t));

        if (p.alpha > 0.01) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(0.1, p.size), Math.max(0.1, p.size * 0.4), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (p.life > p.maxLife) pool.release(p);
      }
      ctx.restore();
    }

    // ============ POST-PROCESSING ============
    function applyBloom(t: number) {
      const textSceneVis = smoothstep(12.0, 13.5, t);
      const bloomAlpha = lerp(0.45, 0.25, textSceneVis);

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

    function applyColorGrade(t: number) {
      const textSceneDarkness = smoothstep(11.5, 12.5, t);
      const gradeAlpha = 0.15 * (1 - textSceneDarkness);
      if (gradeAlpha <= 0.001) return;

      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgba(80, 32, 4, ${gradeAlpha})`);
      grad.addColorStop(0.5, `rgba(40, 12, 3, ${gradeAlpha * 0.5})`);
      grad.addColorStop(1, `rgba(20, 4, 0, ${gradeAlpha * 0.8})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function applyVignette(t: number) {
      const fade = smoothstep(17.0, 18.0, t);
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${0.65 + fade * 0.35})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.4;
      const ox = Math.floor(Math.random() * 64), oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) ctx.drawImage(grain, x, y);
      }
      ctx.restore();
    }

    // ============ CAMERA ============
    function updateCamera(t: number) {
      const camActive = 1 - smoothstep(11.5, 12.5, t);
      cam.zoom = 1 + smoothstep(0, 4, t) * 0.05 * camActive - smoothstep(15, 18, t) * 0.05;
      cam.x = Math.sin(t * 0.25) * 4 * camActive;
      cam.y = Math.cos(t * 0.2) * 3 * camActive;
    }

    function applyCamera() {
      ctx.translate(W / 2 + cam.x, H / 2 + cam.y);
      ctx.rotate(cam.rot);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-W / 2, -H / 2);
    }

    // ============ RENDER PIPELINE ============
    function render(t: number, dt: number) {
      spawnAmbientParticles(t);
      updateCamera(t);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      applyCamera();

      drawDawnAndField(t);
      drawCourtyardAndStove(t);
      drawOverflowEffect(t);
      updateAndDrawParticles(dt, t);

      ctx.restore();

      // Darken background specifically for text phase
      drawTextBackgroundDarken(t);
      
      drawTypography(t);

      const fadeIn = 1 - smoothstep(0, 1.2, t);
      const fadeOut = smoothstep(17.0, 18.0, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx.fillRect(0, 0, W, H);
      }

      applyBloom(t);
      applyColorGrade(t);
      applyVignette(t);
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

    // Wait for fonts to load before starting animation to prevent missing text
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
    <div className="fixed inset-0 w-full h-full bg-black z-[99999]">
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
