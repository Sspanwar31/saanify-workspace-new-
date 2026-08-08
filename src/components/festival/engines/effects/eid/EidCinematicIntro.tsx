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
type PType = 'star' | 'dust' | 'firework_spark' | 'firework_rocket';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; active: boolean; gravity: number; drag: number;
  color: string; twinkle: number; hasExploded: boolean;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', active: false, gravity: 0, drag: 0.98,
        color: '#fff', twinkle: 0, hasExploded: false
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    if (!p) return null;
    p.active = true; p.life = 0; p.alpha = 0; p.hasExploded = false;
    return p;
  }
  release(p: Particle) {
    if (!p) return;
    p.active = false;
    this.free.push(p.idx);
  }
}

export default function EidCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (!document.getElementById('eid-google-font')) {
      const link = document.createElement('link');
      link.id = 'eid-google-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cinzel:wght@700;900&display=swap';
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
    let screenFlash = 0;

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
    const goldDustSprite = makeSprite(64, 'rgba(255,215,100,1)', 'rgba(255,140,40,0.4)');
    const fireworkSprite = makeSprite(64, 'rgba(255,255,255,1)', 'rgba(255,200,100,0.4)');

    const pool = new ParticlePool(3000);
    
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

    // ============ SCENE 1: CINEMATIC NIGHT SKY & 3D MOON (0.0s -> 4.0s) ============
    function drawBackgroundAndMoon(t: number) {
      // Moon fades out when mosque appears (3.0s to 3.8s)
      const vis = smoothstep(0.0, 2.0, t) * (1 - smoothstep(3.0, 3.8, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      // Deep Cinematic Sky Gradient
      const skyGrad = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, W);
      skyGrad.addColorStop(0.0, '#052316');
      skyGrad.addColorStop(0.4, '#02120a');
      skyGrad.addColorStop(1.0, '#000000');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // 3D Crescent Moon
      const mx = W * 0.5;
      const my = H * 0.35 - smoothstep(0, 4, t) * 30;
      const moonR = Math.min(W, H) * 0.08;

      ctx.globalCompositeOperation = 'screen';
      const halo = ctx.createRadialGradient(mx, my, 0, mx, my, Math.min(W, H) * 0.6);
      halo.addColorStop(0, `rgba(15, 255, 180, ${0.15 * vis})`);
      halo.addColorStop(0.3, `rgba(255, 215, 100, ${0.1 * vis})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      const moonGrad = ctx.createRadialGradient(mx - moonR * 0.3, my - moonR * 0.3, moonR * 0.1, mx, my, moonR);
      moonGrad.addColorStop(0.0, `rgba(255, 255, 240, ${1.0 * vis})`);
      moonGrad.addColorStop(0.6, `rgba(255, 220, 100, ${0.9 * vis})`);
      moonGrad.addColorStop(1.0, `rgba(150, 100, 40, ${0.8 * vis})`);
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(0.1, moonR), 0, Math.PI * 2);
      ctx.fill();

      // Moon Craters
      ctx.fillStyle = `rgba(100, 70, 30, ${0.4 * vis})`;
      ctx.beginPath(); ctx.arc(mx - moonR * 0.2, my - moonR * 0.1, moonR * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + moonR * 0.3, my + moonR * 0.2, moonR * 0.1, 0, Math.PI * 2); ctx.fill();

      // Crescent Cutout
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(2, 18, 10, ${1.0 * vis})`;
      ctx.beginPath();
      ctx.arc(mx + moonR * 0.4, my - moonR * 0.1, Math.max(0.1, moonR * 0.95), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ============ SCENE 2: GOLDEN MOSQUE WITH NAKASHI (3.5s -> 10.0s) ============
    function drawGoldenMosque(t: number) {
      // Mosque fades in at 3.5s, stays for fireworks, fades out at 10.0s for text
      const vis = smoothstep(3.5, 4.5, t) * (1 - smoothstep(10.0, 10.8, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      const baseY = H * 0.85;
      const s = Math.min(W, H) * 0.0025;

      // Golden Gradients
      const goldGrad = ctx.createLinearGradient(0, baseY - 300*s, 0, baseY);
      goldGrad.addColorStop(0.0, '#FFD700');
      goldGrad.addColorStop(0.3, '#D4AF37');
      goldGrad.addColorStop(0.7, '#8B6508');
      goldGrad.addColorStop(1.0, '#3A2A00');
      
      const darkGold = '#2a1a00';
      const lightGold = '#FFFDF0';

      // Mosque Base Body
      ctx.fillStyle = darkGold;
      ctx.fillRect(W * 0.3, baseY - 120 * s, W * 0.4, 120 * s);
      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 4 * s;
      ctx.strokeRect(W * 0.3, baseY - 120 * s, W * 0.4, 120 * s);

      // Main Grand Dome
      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.moveTo(W * 0.38, baseY - 120 * s);
      ctx.bezierCurveTo(W * 0.38, baseY - 220 * s, W * 0.5, baseY - 250 * s, W * 0.5, baseY - 250 * s);
      ctx.bezierCurveTo(W * 0.5, baseY - 250 * s, W * 0.62, baseY - 220 * s, W * 0.62, baseY - 120 * s);
      ctx.closePath();
      ctx.fill();
      
      // Dome Rim Light
      ctx.strokeStyle = lightGold;
      ctx.lineWidth = 2 * s;
      ctx.shadowBlur = 15 * s;
      ctx.shadowColor = '#FFD700';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Side Domes
      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.moveTo(W * 0.28, baseY - 120 * s);
      ctx.bezierCurveTo(W * 0.28, baseY - 170 * s, W * 0.34, baseY - 180 * s, W * 0.34, baseY - 180 * s);
      ctx.bezierCurveTo(W * 0.34, baseY - 180 * s, W * 0.4, baseY - 170 * s, W * 0.4, baseY - 120 * s);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(W * 0.6, baseY - 120 * s);
      ctx.bezierCurveTo(W * 0.6, baseY - 170 * s, W * 0.66, baseY - 180 * s, W * 0.66, baseY - 180 * s);
      ctx.bezierCurveTo(W * 0.66, baseY - 180 * s, W * 0.72, baseY - 170 * s, W * 0.72, baseY - 120 * s);
      ctx.closePath();
      ctx.fill();

      // Minarets (Towers)
      ctx.fillStyle = darkGold;
      // Left Minaret
      ctx.fillRect(W * 0.26, baseY - 250 * s, 20 * s, 250 * s);
      ctx.beginPath(); ctx.moveTo(W * 0.26, baseY - 250 * s); ctx.lineTo(W * 0.27, baseY - 270 * s); ctx.lineTo(W * 0.28, baseY - 250 * s); ctx.fill();
      // Right Minaret
      ctx.fillRect(W * 0.74, baseY - 250 * s, 20 * s, 250 * s);
      ctx.beginPath(); ctx.moveTo(W * 0.74, baseY - 250 * s); ctx.lineTo(W * 0.75, baseY - 270 * s); ctx.lineTo(W * 0.76, baseY - 250 * s); ctx.fill();

      // Nakashi (Intricate Arches and Windows)
      ctx.fillStyle = `rgba(255, 215, 0, ${0.8 * vis})`;
      ctx.shadowBlur = 10 * s;
      ctx.shadowColor = '#FFD700';
      
      // Main Arch
      ctx.beginPath();
      ctx.moveTo(W * 0.45, baseY);
      ctx.lineTo(W * 0.45, baseY - 60 * s);
      ctx.quadraticCurveTo(W * 0.5, baseY - 80 * s, W * 0.55, baseY - 60 * s);
      ctx.lineTo(W * 0.55, baseY);
      ctx.fill();
      
      // Side Windows
      for(let i=0; i<3; i++) {
        ctx.fillRect(W * 0.32 + i * 15 * s, baseY - 80 * s, 8 * s, 30 * s);
        ctx.fillRect(W * 0.68 - i * 15 * s, baseY - 80 * s, 8 * s, 30 * s);
      }
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    // ============ SCENE 3: FIREWORKS SYSTEM (5.0s -> 10.0s) ============
    function launchFirework(t: number) {
      if (t < 5.0 || t > 9.5) return;
      if (Math.random() < 0.05) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'firework_rocket';
        p.x = W * 0.3 + Math.random() * W * 0.4;
        p.y = H * 0.9;
        p.vx = (Math.random() - 0.5) * 1;
        p.vy = -10 - Math.random() * 4;
        p.size = 2;
        p.maxLife = 1.5; p.life = 0; p.alpha = 1;
        p.gravity = 0.1; p.drag = 0.99;
        p.color = ['#FFD700', '#FF4500', '#00FF7F', '#FFFFFF'][Math.floor(Math.random() * 4)];
      }
    }

    function explodeFirework(x: number, y: number, color: string) {
      screenFlash = Math.min(1, screenFlash + 0.3); // Flash screen on explosion
      const sparkCount = 40 + Math.random() * 20;
      for (let i = 0; i < sparkCount; i++) {
        const p = pool.spawn(); if (!p) break;
        p.type = 'firework_spark';
        p.x = x; p.y = y;
        const angle = (i / sparkCount) * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = 1.5 + Math.random() * 2;
        p.maxLife = 1.5 + Math.random(); p.life = 0; p.alpha = 1;
        p.gravity = 0.05; p.drag = 0.96;
        p.color = color;
      }
    }

    // ============ PARTICLE SPAWN & UPDATES ============
    function spawnAmbientParticles(t: number) {
      // Stars (0s - 12s)
      if (t < 12.0 && Math.random() < 0.3) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'star'; p.x = Math.random() * W; p.y = Math.random() * H * 0.6;
        p.vx = 0; p.vy = 0;
        p.size = 0.5 + Math.random() * 1.5; p.maxLife = 3 + Math.random() * 2; p.life = 0; p.alpha = 0;
        p.twinkle = Math.random() * Math.PI * 2;
      }
      // Gold Dust (3.5s - 12s)
      if (t > 3.5 && t < 12.0 && Math.random() < 0.4) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'dust'; p.x = Math.random() * W; p.y = H + 10;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = -0.5 - Math.random() * 0.8;
        p.size = 1 + Math.random() * 2; p.maxLife = 5; p.life = 0; p.alpha = 0;
      }
    }

    function updateAndDrawParticles(dt: number, t: number) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      // Update Screen Flash
      screenFlash = Math.max(0, screenFlash - dt * 1.5);
      if (screenFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${screenFlash * 0.15})`;
        ctx.fillRect(0, 0, W, H);
      }

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

        if (p.type === 'star') {
          p.twinkle += dt * 2;
          p.alpha = (0.5 + Math.sin(p.twinkle) * 0.5) * (1 - smoothstep(11.5, 12.0, t));
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (p.type === 'dust') {
          p.alpha = smoothstep(0, 0.5, lr) * (1 - smoothstep(0.8, 1, lr)) * 0.6 * (t < 12 ? 1 : 1 - smoothstep(12, 12.5, t));
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            const sz = p.size * 4;
            ctx.drawImage(goldDustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        } else if (p.type === 'firework_rocket') {
          p.alpha = 1 - lr;
          if (p.vy >= -1 || p.life > p.maxLife) {
            if (!p.hasExploded) {
              p.hasExploded = true;
              explodeFirework(p.x, p.y, p.color);
              p.alpha = 0;
            }
          }
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();
            // Rocket trail
            ctx.globalAlpha = p.alpha * 0.5;
            ctx.fillRect(p.x - 1, p.y, 2, 10);
          }
        } else if (p.type === 'firework_spark') {
          p.alpha = 1 - lr;
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            const sz = p.size * 4;
            ctx.drawImage(fireworkSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }
      ctx.restore();
    }

    // ============ POST-PROCESSING EFFECTS ============
    function applyBloom() {
      // Enhanced Bloom for Fireworks
      const bloomAlpha = 0.55;
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(4px) brightness(1.3)';
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
      grad.addColorStop(1, 'rgba(0,0,0,0.85)');
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

      drawBackgroundAndMoon(t);
      drawGoldenMosque(t);
      
      launchFirework(t);
      spawnAmbientParticles(t);
      updateAndDrawParticles(dt, t);

      // Background Darken for Text Phase (Starts at 10.0s)
      const textBgVis = smoothstep(10.0, 10.8, t) * (1 - smoothstep(11.5, 12.0, t));
      if (textBgVis > 0.001) {
        ctx.fillStyle = `rgba(1, 8, 6, ${0.95 * textBgVis})`;
        ctx.fillRect(0, 0, W, H);
      }

      const fadeIn = 1 - smoothstep(0, 1.2, t);
      const fadeOut = smoothstep(11.5, 12.0, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx.fillRect(0, 0, W, H);
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

      if (t >= 12.0 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 12.5) {
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
      {/* Skip Button */}
      <button
        onClick={() => onComplete?.()}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-[100] px-4 py-2 rounded-full border border-amber-400/30 bg-black/30 text-amber-200 backdrop-blur-md text-[10px] sm:text-xs font-semibold tracking-[0.18em] transition-all duration-300 hover:bg-amber-400/10 hover:border-amber-300/60"
      >
        SKIP →
      </button>
    </div>
  );
}
