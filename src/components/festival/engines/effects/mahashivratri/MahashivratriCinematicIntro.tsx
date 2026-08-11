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
type PType = 'divine' | 'snow' | 'energy' | 'spark';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; active: boolean; gravity: number; drag: number;
  color: string; twinkle: number;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'divine', active: false, gravity: 0, drag: 0.98,
        color: '#fff', twinkle: 0
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

export default function MahashivratriCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (!document.getElementById('maha-shiv-fonts')) {
      const link = document.createElement('link');
      link.id = 'maha-shiv-fonts';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap';
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

    // Offscreen canvas for Bloom
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
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 20;
      }
      gctx.putImageData(id, 0, 0);
    }

    // =========================================================================
    // CINEMATIC PARTICLE LOGIC
    // =========================================================================
    function spawnEnergyBurst(x: number, y: number, count: number, color: string, speed: number) {
      for (let i = 0; i < count; i++) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'energy'; p.x = x; p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const sp = speed * (0.5 + Math.random() * 0.8);
        p.vx = Math.cos(angle) * sp;
        p.vy = Math.sin(angle) * sp;
        p.size = 1.5 + Math.random() * 2.5;
        p.maxLife = 1.5 + Math.random() * 1.0; p.life = 0; p.alpha = 1;
        p.gravity = 0; p.drag = 0.96; p.color = color;
      }
    }

    function spawnAmbientParticles(t: number) {
      // Floating Divine Dust
      if (t > 1 && t < 14.5 && Math.random() < 0.6) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'divine'; p.x = Math.random() * W; p.y = H + 10;
        p.vx = (Math.random() - 0.5) * 0.4; p.vy = -0.4 - Math.random() * 0.6;
        p.size = 1 + Math.random() * 2; p.maxLife = 6; p.life = 0; p.alpha = 0;
        p.color = `rgba(180, 220, 255, ${0.3 + Math.random() * 0.4})`;
      }
      // Snow
      if (t > 6 && t < 14.5 && Math.random() < 0.8) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'snow'; p.x = Math.random() * W; p.y = -10;
        p.vx = (Math.random() - 0.5) * 1.5; p.vy = 1 + Math.random() * 2;
        p.size = 1 + Math.random() * 2.5; p.maxLife = 8; p.life = 0; p.alpha = 0.8;
        p.color = '#ffffff';
      }
    }

    function updateAndDrawParticles(dt: number, t: number) {
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      
      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active) continue;

        p.life += dt;
        const lr = p.life / p.maxLife;

        p.vy += p.gravity * dt;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'divine' || p.type === 'energy') {
          p.alpha = Math.sin(lr * Math.PI) * (t < 13 ? 1 : 1 - smoothstep(13, 14.5, t));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx!.fill();
            
            // Glow
            ctx!.globalAlpha = p.alpha * 0.3;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.1, p.size * 3), 0, Math.PI * 2);
            ctx!.fill();
          }
        } else if (p.type === 'snow') {
          p.alpha = (1 - lr) * 0.6;
          if (p.alpha > 0.01) {
            ctx!.globalCompositeOperation = 'source-over';
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx!.fill();
            ctx!.globalCompositeOperation = 'lighter';
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }
      ctx!.restore();
    }

    // =========================================================================
    // SCENE 1: SACRED OM (0s -> 2.5s)
    // =========================================================================
    function drawSacredOm(t: number) {
      const vis = smoothstep(0.5, 1.5, t) * (1 - smoothstep(2.0, 2.5, t));
      if (vis <= 0.001) return;

      const cx = W / 2;
      const cy = H / 2;
      const s = Math.min(W, H) * 0.15;
      
      // Pulse Effect
      const pulse = 1 + Math.sin(t * 3) * 0.05;
      
      ctx!.save();
      ctx!.globalAlpha = vis;
      ctx!.translate(cx, cy);
      ctx!.scale(pulse, pulse);

      // Divine Halo
      const halo = ctx!.createRadialGradient(0, 0, 0, 0, 0, s * 2);
      halo.addColorStop(0, 'rgba(150, 200, 255, 0.4)');
      halo.addColorStop(0.5, 'rgba(50, 100, 200, 0.1)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = halo;
      ctx!.beginPath();
      ctx!.arc(0, 0, s * 2, 0, Math.PI * 2);
      ctx!.fill();

      // Glowing Om Symbol
      ctx!.font = `${s}px "Tiro Devanagari Hindi", serif`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.shadowBlur = 40;
      ctx!.shadowColor = '#80bdff';
      ctx!.fillStyle = '#ffffff';
      ctx!.fillText('ॐ', 0, 0);

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2: DIVINE DAMARU (2.5s -> 5s)
    // =========================================================================
    function drawDamaru(t: number) {
      const vis = smoothstep(3.5, 4.2, t) * (1 - smoothstep(4.5, 5.0, t));
      if (vis <= 0.001) return;

      const cx = W / 2;
      const cy = H / 2;
      const s = Math.min(W, H) * 0.002;
      const size = 60 * s;

      ctx!.save();
      ctx!.globalAlpha = vis;
      ctx!.translate(cx, cy);

      // Energy Glow
      const glow = ctx!.createRadialGradient(0, 0, 0, 0, 0, size * 3);
      glow.addColorStop(0, 'rgba(100, 150, 255, 0.3)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = glow;
      ctx!.fillRect(-size*3, -size*3, size*6, size*6);

      // Damaru Shape (Hourglass)
      ctx!.beginPath();
      ctx!.moveTo(-size, -size);
      ctx!.bezierCurveTo(-size * 0.5, -size * 0.5, -size * 0.5, size * 0.5, -size, size);
      ctx!.lineTo(size, size);
      ctx!.bezierCurveTo(size * 0.5, size * 0.5, size * 0.5, -size * 0.5, size, -size);
      ctx!.closePath();

      const damGrad = ctx!.createLinearGradient(-size, 0, size, 0);
      damGrad.addColorStop(0, '#2a1b0e');
      damGrad.addColorStop(0.5, '#5a3a1a');
      damGrad.addColorStop(1, '#2a1b0e');
      ctx!.fillStyle = damGrad;
      ctx!.fill();

      // Metallic Edges
      ctx!.strokeStyle = `rgba(180, 220, 255, ${0.8 * vis})`;
      ctx!.lineWidth = 3 * s;
      ctx!.stroke();

      // Central Rope
      ctx!.fillStyle = '#1a0a05';
      ctx!.fillRect(-size * 0.8, -size * 0.15, size * 1.6, size * 0.3);

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 3 & 4 & 5: MAJESTIC TRISHUL & KAILASH & SHIVA SILHOUETTE (5s -> 15s)
    // =========================================================================
    function drawTrishul(t: number) {
      const vis = smoothstep(6.0, 7.5, t) * (1 - smoothstep(13.5, 14.5, t));
      if (vis <= 0.001) return;

      const cx = W / 2;
      const cy = H / 2;
      const s = Math.min(W, H) * 0.002;
      
      // Slow Camera Orbit
      const orbit = Math.sin(t * 0.2) * 20 * s;
      
      ctx!.save();
      ctx!.globalAlpha = vis;
      ctx!.translate(cx + orbit, cy + 20 * s);

      const scale = 1 + smoothstep(6.0, 7.5, t) * 0.1;
      ctx!.scale(scale, scale);

      const shaftW = 12 * s;
      const shaftH = 350 * s;
      const topY = -shaftH / 2;
      
      // Divine Glow behind Trishul
      const glow = ctx!.createRadialGradient(0, topY, 0, 0, topY, 250 * s);
      glow.addColorStop(0, `rgba(100, 180, 255, ${0.4 * vis})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = glow;
      ctx!.fillRect(-300*s, -300*s, 600*s, 600*s);

      // Shaft
      const shaftGrad = ctx!.createLinearGradient(-shaftW, 0, shaftW, 0);
      shaftGrad.addColorStop(0, '#1e2a35');
      shaftGrad.addColorStop(0.5, '#8a9baa');
      shaftGrad.addColorStop(1, '#1e2a35');
      ctx!.fillStyle = shaftGrad;
      ctx!.fillRect(-shaftW / 2, topY + 50 * s, shaftW, shaftH - 50 * s);

      // Main Center Prong
      ctx!.beginPath();
      ctx!.moveTo(0, topY - 80 * s); // Tip
      ctx!.lineTo(-12 * s, topY + 60 * s);
      ctx!.lineTo(12 * s, topY + 60 * s);
      ctx!.closePath();
      ctx!.fillStyle = shaftGrad;
      ctx!.fill();

      // Left Prong
      ctx!.beginPath();
      ctx!.moveTo(-50 * s, topY - 50 * s); // Tip
      ctx!.quadraticCurveTo(-40 * s, topY + 20 * s, -20 * s, topY + 60 * s);
      ctx!.lineTo(-8 * s, topY + 40 * s);
      ctx!.quadraticCurveTo(-25 * s, topY, -35 * s, topY - 40 * s);
      ctx!.closePath();
      ctx!.fill();

      // Right Prong
      ctx!.beginPath();
      ctx!.moveTo(50 * s, topY - 50 * s);
      ctx!.quadraticCurveTo(40 * s, topY + 20 * s, 20 * s, topY + 60 * s);
      ctx!.lineTo(8 * s, topY + 40 * s);
      ctx!.quadraticCurveTo(25 * s, topY, 35 * s, topY - 40 * s);
      ctx!.closePath();
      ctx!.fill();

      // Highlights
      ctx!.strokeStyle = `rgba(220, 240, 255, ${0.6 * vis})`;
      ctx!.lineWidth = 2 * s;
      ctx!.stroke();

      // Crescent Moon on Center Prong
      const moonY = topY + 30 * s;
      ctx!.fillStyle = `rgba(200, 220, 255, ${vis})`;
      ctx!.beginPath();
      ctx!.arc(0, moonY, 16 * s, 0, Math.PI * 2);
      ctx!.fill();
      
      // Moon Cutout
      ctx!.globalCompositeOperation = 'destination-out';
      ctx!.beginPath();
      ctx!.arc(6 * s, moonY - 4 * s, 14 * s, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.globalCompositeOperation = 'source-over';

      ctx!.restore();
    }

    function drawKailashAndShiva(t: number) {
      const vis = smoothstep(7.5, 9.5, t) * (1 - smoothstep(13.5, 14.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.002;
      const baseY = H * 0.85;
      const cx = W / 2;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // --- HIMALAYAN NIGHT SKY & FOG ---
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#000000');
      skyGrad.addColorStop(0.4, '#03060f');
      skyGrad.addColorStop(0.8, '#050a15');
      skyGrad.addColorStop(1, '#000000');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // Background Fog
      const fogGrad = ctx!.createRadialGradient(cx, H * 0.6, 0, cx, H * 0.6, W * 0.6);
      fogGrad.addColorStop(0, `rgba(20, 30, 50, ${0.5 * vis})`);
      fogGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = fogGrad;
      ctx!.fillRect(0, 0, W, H);

      // --- SHIVA AURA & SILHOUETTE ---
      const auraX = cx;
      const auraY = H * 0.42;
      const auraR = Math.min(W, H) * 0.45;

      const aura = ctx!.createRadialGradient(auraX, auraY, 0, auraX, auraY, auraR);
      aura.addColorStop(0, `rgba(70, 120, 200, ${0.35 * vis})`);
      aura.addColorStop(0.5, `rgba(30, 50, 100, ${0.1 * vis})`);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = aura;
      ctx!.beginPath();
      ctx!.arc(auraX, auraY, auraR, 0, Math.PI * 2);
      ctx!.fill();

      // Shiva Silhouette (Meditating)
      ctx!.fillStyle = `rgba(0, 0, 5, ${0.95 * vis})`;
      ctx!.beginPath();
      
      // Base / Legs
      ctx!.moveTo(cx - 140 * s, H * 0.75);
      ctx!.bezierCurveTo(cx - 120 * s, H * 0.65, cx - 50 * s, H * 0.60, cx, H * 0.60);
      ctx!.bezierCurveTo(cx + 50 * s, H * 0.60, cx + 120 * s, H * 0.65, cx + 140 * s, H * 0.75);
      
      // Body / Arms
      ctx!.bezierCurveTo(cx + 70 * s, H * 0.50, cx + 30 * s, H * 0.45, cx + 10 * s, H * 0.38);
      
      // Head
      ctx!.bezierCurveTo(cx + 20 * s, H * 0.30, cx + 15 * s, H * 0.25, cx, H * 0.25);
      ctx!.bezierCurveTo(cx - 15 * s, H * 0.25, cx - 20 * s, H * 0.30, cx - 10 * s, H * 0.38);
      
      // Left Arm
      ctx!.bezierCurveTo(cx - 30 * s, H * 0.45, cx - 70 * s, H * 0.50, cx - 80 * s, H * 0.55);
      
      // Matted Hair (Jata) Pile
      ctx!.moveTo(cx - 20 * s, H * 0.25);
      ctx!.bezierCurveTo(cx - 40 * s, H * 0.15, cx - 30 * s, H * 0.05, cx, H * 0.0);
      ctx!.bezierCurveTo(cx + 30 * s, H * 0.05, cx + 40 * s, H * 0.15, cx + 20 * s, H * 0.25);
      
      ctx!.closePath();
      ctx!.fill();

      // --- MOUNT KAILASH ---
      ctx!.fillStyle = `rgba(10, 15, 25, ${vis})`;
      ctx!.beginPath();
      ctx!.moveTo(0, baseY);
      ctx!.lineTo(cx - 250 * s, baseY - 50 * s);
      ctx!.lineTo(cx - 150 * s, baseY - 150 * s);
      ctx!.lineTo(cx - 50 * s, baseY - 250 * s);
      ctx!.lineTo(cx, baseY - 300 * s); // Peak
      ctx!.lineTo(cx + 60 * s, baseY - 250 * s);
      ctx!.lineTo(cx + 160 * s, baseY - 180 * s);
      ctx!.lineTo(cx + 280 * s, baseY - 80 * s);
      ctx!.lineTo(W, baseY);
      ctx!.closePath();
      ctx!.fill();

      // Snow Caps
      ctx!.fillStyle = `rgba(200, 220, 255, ${0.8 * vis})`;
      ctx!.beginPath();
      ctx!.moveTo(cx - 50 * s, baseY - 250 * s);
      ctx!.lineTo(cx, baseY - 300 * s);
      ctx!.lineTo(cx + 60 * s, baseY - 250 * s);
      ctx!.lineTo(cx + 40 * s, baseY - 230 * s);
      ctx!.lineTo(cx + 10 * s, baseY - 260 * s);
      ctx!.lineTo(cx - 20 * s, baseY - 240 * s);
      ctx!.closePath();
      ctx!.fill();

      // --- CRESCENT MOON (Background Sky) ---
      const moonX = W * 0.75;
      const moonY = H * 0.2;
      const moonR = 40 * s;

      ctx!.globalCompositeOperation = 'screen';
      ctx!.fillStyle = `rgba(200, 220, 255, ${0.6 * vis})`;
      ctx!.beginPath();
      ctx!.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx!.fill();
      
      ctx!.globalCompositeOperation = 'source-over';
      ctx!.fillStyle = `rgba(0, 5, 10, ${vis})`;
      ctx!.beginPath();
      ctx!.arc(moonX + 15 * s, moonY - 5 * s, moonR * 0.9, 0, Math.PI * 2);
      ctx!.fill();

      // --- SACRED GANGA STREAM ---
      const gangaGrad = ctx!.createLinearGradient(cx, H * 0.0, cx, H * 0.6);
      gangaGrad.addColorStop(0, `rgba(150, 200, 255, 0)`);
      gangaGrad.addColorStop(0.2, `rgba(150, 200, 255, ${0.4 * vis})`);
      gangaGrad.addColorStop(1, `rgba(150, 200, 255, 0)`);
      
      ctx!.strokeStyle = gangaGrad;
      ctx!.lineWidth = 6 * s;
      ctx!.shadowBlur = 15;
      ctx!.shadowColor = '#80bdff';
      
      ctx!.beginPath();
      ctx!.moveTo(cx, H * 0.0);
      for (let i = 0; i <= 10; i++) {
        const y = lerp(H * 0.0, H * 0.65, i / 10);
        const x = cx + Math.sin(t * 1.5 + i * 0.8) * 20 * s;
        ctx!.lineTo(x, y);
      }
      ctx!.stroke();
      ctx!.shadowBlur = 0;

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 6: SACRED TEXT & FINAL FADE (12.5s -> 15s)
    // =========================================================================
    function drawSacredText(t: number) {
      const vis = smoothstep(12.8, 13.5, t) * (1 - smoothstep(14.5, 15.0, t));
      if (vis <= 0.001) return;

      const cx = W / 2;
      const cy = H * 0.72;
      const s = Math.min(W, H) * 0.002;

      ctx!.save();
      ctx!.globalAlpha = vis;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      // "ॐ नमः शिवाय"
      const fSize1 = 60 * s;
      ctx!.font = `700 ${fSize1}px "Tiro Devanagari Hindi", serif`;
      ctx!.shadowBlur = 30;
      ctx!.shadowColor = 'rgba(100, 150, 255, 0.8)';
      
      const grad1 = ctx!.createLinearGradient(0, cy - fSize1/2, 0, cy + fSize1/2);
      grad1.addColorStop(0, '#ffffff');
      grad1.addColorStop(0.5, '#e0f7ff');
      grad1.addColorStop(1, '#80bdff');
      ctx!.fillStyle = grad1;
      ctx!.fillText('ॐ नमः शिवाय', cx, cy);

      // "महाशिवरात्रि की हार्दिक शुभकामनाएँ"
      const fSize2 = 28 * s;
      ctx!.font = `400 ${fSize2}px "Tiro Devanagari Hindi", serif`;
      ctx!.shadowBlur = 15;
      ctx!.fillStyle = `rgba(220, 240, 255, ${vis})`;
      ctx!.fillText('महाशिवरात्रि की हार्दिक शुभकामनाएँ', cx, cy + fSize1 * 0.9);

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
      const grad = ctx!.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.9);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.9)');
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
      
      // Base Black Screen
      ctx!.fillStyle = '#000000';
      ctx!.fillRect(0, 0, W, H);

      // Spawning Logic
      if (t > 2.4 && t < 2.6) spawnEnergyBurst(W/2, H/2, 200, '#80bdff', 8);
      if (t > 4.9 && t < 5.1) spawnEnergyBurst(W/2, H/2, 200, '#ffffff', 10);
      spawnAmbientParticles(t);

      // Scene Drawing
      drawKailashAndShiva(t);
      drawTrishul(t);
      drawDamaru(t);
      drawSacredOm(t);

      updateAndDrawParticles(dt, t);
      drawSacredText(t);

      // Fades
      const fadeIn = 1 - smoothstep(0, 0.5, t);
      const fadeOut = smoothstep(14.5, 15.0, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx!.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx!.fillRect(0, 0, W, H);
      }

      // Cinematic Post Processing
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

      if (t >= 14.8 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 15.0) {
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
    <div className="fixed inset-0 w-full h-full bg-black z-[99999] overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#000000',
        }}
      />
      {/* SKIP BUTTON */}
      <button
        onClick={() => onComplete?.()}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-[100] px-4 py-2 rounded-full border border-blue-400/30 bg-black/40 text-blue-200 backdrop-blur-md text-[10px] sm:text-xs font-bold tracking-[0.2em] transition-all duration-300 hover:bg-blue-400/20 hover:border-blue-300/70"
      >
        SKIP →
      </button>
    </div>
  );
}
