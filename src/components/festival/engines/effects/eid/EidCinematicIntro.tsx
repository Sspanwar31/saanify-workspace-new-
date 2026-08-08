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
type PType = 'star' | 'spark' | 'dust' | 'firefly';

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
        type: 'dust', active: false, gravity: 0, drag: 0.98,
        color: '#fff', twinkle: Math.random() * Math.PI * 2
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
    const fireflySprite = makeSprite(64, 'rgba(255,255,200,1)', 'rgba(100,255,150,0.2)');

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
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 18;
      }
      gctx.putImageData(id, 0, 0);
    }

    // ============ SCENE 1: CINEMATIC NIGHT SKY & 3D MOON (0.0s -> 10.5s) ============
    function drawBackgroundAndMoon(t: number) {
      const vis = smoothstep(0.0, 2.0, t) * (1 - smoothstep(9.5, 10.5, t));
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
      const my = H * 0.35 - smoothstep(0, 4, t) * 30; // Moon rises slightly
      const moonR = Math.min(W, H) * 0.08;

      // Moon Volumetric God Rays
      ctx.globalCompositeOperation = 'screen';
      const halo = ctx.createRadialGradient(mx, my, 0, mx, my, Math.min(W, H) * 0.6);
      halo.addColorStop(0, `rgba(15, 255, 180, ${0.15 * vis})`);
      halo.addColorStop(0.3, `rgba(255, 215, 100, ${0.1 * vis})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      // Moon Core (3D Shaded Sphere)
      const moonGrad = ctx.createRadialGradient(mx - moonR * 0.3, my - moonR * 0.3, moonR * 0.1, mx, my, moonR);
      moonGrad.addColorStop(0.0, `rgba(255, 255, 240, ${1.0 * vis})`);
      moonGrad.addColorStop(0.6, `rgba(255, 220, 100, ${0.9 * vis})`);
      moonGrad.addColorStop(1.0, `rgba(150, 100, 40, ${0.8 * vis})`);
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(0.1, moonR), 0, Math.PI * 2);
      ctx.fill();

      // Moon Craters for Realism
      ctx.fillStyle = `rgba(100, 70, 30, ${0.4 * vis})`;
      ctx.beginPath(); ctx.arc(mx - moonR * 0.2, my - moonR * 0.1, moonR * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + moonR * 0.3, my + moonR * 0.2, moonR * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx - moonR * 0.4, my + moonR * 0.4, moonR * 0.08, 0, Math.PI * 2); ctx.fill();

      // Crescent Cutout (Shadow Sphere)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(2, 18, 10, ${1.0 * vis})`; // Match sky color
      ctx.beginPath();
      ctx.arc(mx + moonR * 0.4, my - moonR * 0.1, Math.max(0.1, moonR * 0.95), 0, Math.PI * 2);
      ctx.fill();

      // Earthshine (Faint glow on the dark part)
      ctx.globalCompositeOperation = 'lighter';
      const earthshine = ctx.createRadialGradient(mx + moonR * 0.4, my - moonR * 0.1, 0, mx + moonR * 0.4, my - moonR * 0.1, moonR);
      earthshine.addColorStop(0, 'rgba(0,0,0,0)');
      earthshine.addColorStop(0.8, `rgba(20, 60, 40, ${0.1 * vis})`);
      earthshine.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = earthshine;
      ctx.beginPath();
      ctx.arc(mx + moonR * 0.4, my - moonR * 0.1, Math.max(0.1, moonR), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
    }

    // ============ SCENE 2: 3D MOSQUE SILHOUETTE (3.0s -> 10.5s) ============
    function drawMosque(t: number) {
      const vis = smoothstep(3.0, 4.5, t) * (1 - smoothstep(9.5, 10.5, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      const baseY = H * 0.85;
      const scale = Math.min(W, H) * 0.002;

      // Mosque Base Body
      ctx.fillStyle = '#010806';
      ctx.fillRect(W * 0.3, baseY - 100 * scale, W * 0.4, 100 * scale);

      // Main Dome
      ctx.fillStyle = '#020b07';
      ctx.beginPath();
      ctx.moveTo(W * 0.4, baseY - 100 * scale);
      ctx.bezierCurveTo(W * 0.4, baseY - 180 * scale, W * 0.5, baseY - 200 * scale, W * 0.5, baseY - 200 * scale);
      ctx.bezierCurveTo(W * 0.5, baseY - 200 * scale, W * 0.6, baseY - 180 * scale, W * 0.6, baseY - 100 * scale);
      ctx.closePath();
      ctx.fill();

      // Minarets
      ctx.fillRect(W * 0.28, baseY - 200 * scale, 20 * scale, 200 * scale);
      ctx.fillRect(W * 0.72, baseY - 200 * scale, 20 * scale, 200 * scale);

      // Crescent on top
      ctx.fillStyle = `rgba(255, 215, 100, ${0.9 * vis})`;
      ctx.beginPath(); ctx.arc(W * 0.5, baseY - 210 * scale, 5 * scale, 0, Math.PI * 2); ctx.fill();
      
      // Cinematic Rim Light (Moonlight hitting the edges)
      ctx.strokeStyle = `rgba(255, 215, 100, ${0.3 * vis})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.4, baseY - 100 * scale);
      ctx.bezierCurveTo(W * 0.4, baseY - 180 * scale, W * 0.5, baseY - 200 * scale, W * 0.5, baseY - 200 * scale);
      ctx.stroke();

      ctx.restore();
    }

    // ============ SCENE 3: FLOATING LANTERNS & FIREFLIES (4.0s -> 10.5s) ============
    function drawLanterns(t: number) {
      const vis = smoothstep(4.0, 5.0, t) * (1 - smoothstep(9.5, 10.5, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.globalAlpha = vis;

      const lanters = [
        { x: W * 0.2, y: H * 0.7 - smoothstep(4, 9, t) * 100, s: 1.0 },
        { x: W * 0.8, y: H * 0.6 - smoothstep(4, 9, t) * 80, s: 1.2 },
        { x: W * 0.15, y: H * 0.5 - smoothstep(4, 9, t) * 120, s: 0.8 },
        { x: W * 0.85, y: H * 0.4 - smoothstep(4, 9, t) * 90, s: 0.9 }
      ];

      lanters.forEach((l, i) => {
        const sway = Math.sin(t * 1.5 + i) * 10;
        const lx = l.x + sway;
        const ly = l.y;
        const ls = l.s;

        // Lantern Glow
        ctx.globalCompositeOperation = 'lighter';
        const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(0.1, 60 * ls));
        glow.addColorStop(0, `rgba(255, 200, 80, ${0.6 * vis})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(lx - 60 * ls, ly - 60 * ls, 120 * ls, 120 * ls);

        // Lantern Body
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#1a0a02';
        ctx.beginPath();
        ctx.moveTo(lx - 15 * ls, ly);
        ctx.lineTo(lx + 15 * ls, ly);
        ctx.lineTo(lx + 10 * ls, ly - 25 * ls);
        ctx.lineTo(lx - 10 * ls, ly - 25 * ls);
        ctx.closePath();
        ctx.fill();

        // Lantern Flame
        ctx.fillStyle = '#ffdd66';
        ctx.beginPath();
        ctx.ellipse(lx, ly - 12 * ls, Math.max(0.1, 3 * ls), Math.max(0.1, 6 * ls), 0, 0, Math.PI * 2);
        ctx.fill();

        // Spawn sparks
        if (Math.random() < 0.1) {
          const p = pool.spawn(); if (!p) return;
          p.type = 'spark'; p.x = lx; p.y = ly - 15 * ls;
          p.vx = (Math.random() - 0.5) * 0.5; p.vy = -1 - Math.random();
          p.size = 1 + Math.random(); p.maxLife = 1.5; p.life = 0; p.alpha = 1;
          p.gravity = -0.5; p.drag = 0.95; p.color = '#ffaa00';
        }
      });

      ctx.restore();
    }

    // ============ SCENE 4: 3D METALLIC TYPOGRAPHY (6.0s -> 10.5s) ============
    function drawTextBackgroundDarken(t: number) {
      const vis = smoothstep(6.0, 7.0, t) * (1 - smoothstep(10.0, 10.5, t));
      if (vis <= 0.001) return;
      ctx.save();
      ctx.fillStyle = `rgba(1, 8, 6, ${0.85 * vis})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function drawTypography(t: number) {
      const vis = smoothstep(6.5, 7.5, t) * (1 - smoothstep(10.0, 10.5, t));
      if (vis <= 0.001) return;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Arabic Text (عيد مبارك)
      const fontSizeAr = Math.min(W * 0.08, 80);
      const cy1 = H * 0.42;
      ctx.font = `700 ${fontSizeAr}px "Amiri", serif`;
      
      ctx.strokeStyle = '#0a0301';
      ctx.lineWidth = fontSizeAr * 0.05;
      ctx.lineJoin = 'round';
      ctx.strokeText('عيد مبارك', W / 2, cy1);

      const goldAr = ctx.createLinearGradient(0, cy1 - fontSizeAr * 0.5, 0, cy1 + fontSizeAr * 0.5);
      goldAr.addColorStop(0.00, '#FFFDF0');
      goldAr.addColorStop(0.30, '#FFE8A3');
      goldAr.addColorStop(0.50, '#FFC837');
      goldAr.addColorStop(0.80, '#B87B00');
      goldAr.addColorStop(1.00, '#3A1F00');

      ctx.shadowBlur = 25;
      ctx.shadowColor = `rgba(229, 160, 13, ${0.8 * vis})`;
      ctx.fillStyle = goldAr;
      ctx.fillText('عيد مبارك', W / 2, cy1);

      // English Text (EID MUBARAK)
      const fontSizeEng = Math.min(W * 0.06, 60);
      const cy2 = H * 0.55;
      ctx.font = `900 ${fontSizeEng}px "Cinzel", serif`;
      
      ctx.strokeStyle = '#0a0301';
      ctx.lineWidth = fontSizeEng * 0.05;
      ctx.strokeText('EID MUBARAK', W / 2, cy2);

      const goldEng = ctx.createLinearGradient(0, cy2 - fontSizeEng * 0.5, 0, cy2 + fontSizeEng * 0.5);
      goldEng.addColorStop(0.00, '#FFFFFF');
      goldEng.addColorStop(0.40, '#FFE57F');
      goldEng.addColorStop(0.80, '#C68A00');
      goldEng.addColorStop(1.00, '#3A1F00');

      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(229, 160, 13, ${0.6 * vis})`;
      ctx.fillStyle = goldEng;
      ctx.fillText('EID MUBARAK', W / 2, cy2);

      ctx.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============
    function spawnAmbientParticles(t: number) {
      // Stars (0s - 10.5s)
      if (t < 10.5 && Math.random() < 0.3) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'star'; p.x = Math.random() * W; p.y = Math.random() * H * 0.6;
        p.vx = 0; p.vy = 0;
        p.size = 0.5 + Math.random() * 1.5; p.maxLife = 3 + Math.random() * 2; p.life = 0; p.alpha = 0;
        p.twinkle = Math.random() * Math.PI * 2;
      }
      // Gold Dust (3s - 10.5s)
      if (t > 3.0 && t < 10.5 && Math.random() < 0.4) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'dust'; p.x = Math.random() * W; p.y = H + 10;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = -0.5 - Math.random() * 0.8;
        p.size = 1 + Math.random() * 2; p.maxLife = 5; p.life = 0; p.alpha = 0;
      }
    }

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

        if (p.type === 'star') {
          p.twinkle += dt * 2;
          p.alpha = (0.5 + Math.sin(p.twinkle) * 0.5) * (1 - smoothstep(9.5, 10.5, t));
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (p.type === 'dust') {
          p.alpha = smoothstep(0, 0.5, lr) * (1 - smoothstep(0.8, 1, lr)) * 0.6 * (t < 10 ? 1 : 1 - smoothstep(10, 10.5, t));
          if (p.alpha > 0.01) {
            ctx.globalAlpha = p.alpha;
            const sz = p.size * 4;
            ctx.drawImage(goldDustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
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
            ctx.drawImage(goldDustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }
      ctx.restore();
    }

    // ============ POST-PROCESSING EFFECTS ============
    function applyBloom() {
      const bloomAlpha = 0.45;
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
      drawMosque(t);
      drawLanterns(t);
      
      spawnAmbientParticles(t);
      updateAndDrawParticles(dt, t);

      drawTextBackgroundDarken(t);
      drawTypography(t);

      const fadeIn = 1 - smoothstep(0, 1.2, t);
      const fadeOut = smoothstep(10.0, 10.5, t);
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

      if (t >= 10.5 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 11.0) {
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
