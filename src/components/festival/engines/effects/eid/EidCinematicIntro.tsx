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
type PType = 'star' | 'dust' | 'firework_spark' | 'firework_rocket' | 'shimmer';

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
    if (!document.getElementById('eid-google-fonts-grand')) {
      const link = document.createElement('link');
      link.id = 'eid-google-fonts-grand';
      link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Cinzel:wght@700;900&display=swap';
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

    // Offscreen canvases for Post-Processing
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    // Particle Sprites
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
    const fireworkSprite = makeSprite(64, 'rgba(255,255,255,1)', 'rgba(255,215,100,0.5)');

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
    // SCENE 1: CINEMATIC NIGHT SKY & MOONRISE (0.0s -> 3.5s)
    // =========================================================================
    function drawNightSkyAndMoon(t: number) {
      const vis = smoothstep(0.0, 1.5, t) * (1 - smoothstep(8.5, 9.5, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Deep Midnight Sky Gradient
      const skyGrad = ctx!.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, W);
      skyGrad.addColorStop(0.0, '#0a231b');
      skyGrad.addColorStop(0.4, '#03120d');
      skyGrad.addColorStop(1.0, '#000403');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // 3D Crescent Moon
      const mx = W * 0.5;
      const my = H * 0.28 - smoothstep(0, 3.5, t) * 25;
      const moonR = Math.min(W, H) * 0.075;

      ctx!.globalCompositeOperation = 'screen';
      const halo = ctx!.createRadialGradient(mx, my, 0, mx, my, Math.min(W, H) * 0.55);
      halo.addColorStop(0, `rgba(255, 230, 150, ${0.25 * vis})`);
      halo.addColorStop(0.4, `rgba(16, 185, 129, ${0.15 * vis})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, W, H);

      const moonGrad = ctx!.createRadialGradient(mx - moonR * 0.3, my - moonR * 0.3, moonR * 0.1, mx, my, moonR);
      moonGrad.addColorStop(0.0, `rgba(255, 255, 245, ${1.0 * vis})`);
      moonGrad.addColorStop(0.5, `rgba(255, 215, 100, ${0.9 * vis})`);
      moonGrad.addColorStop(1.0, `rgba(180, 120, 30, ${0.8 * vis})`);
      ctx!.fillStyle = moonGrad;
      ctx!.beginPath();
      ctx!.arc(mx, my, Math.max(0.1, moonR), 0, Math.PI * 2);
      ctx!.fill();

      // Crescent Moon Cutout
      ctx!.globalCompositeOperation = 'source-over';
      ctx!.fillStyle = `rgba(3, 18, 13, ${1.0 * vis})`;
      ctx!.beginPath();
      ctx!.arc(mx + moonR * 0.4, my - moonR * 0.1, Math.max(0.1, moonR * 0.95), 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2: GRAND MOSQUE ARCHITECTURE & MARBLE REFLECTION (2.5s -> 9.0s)
    // =========================================================================
    function drawGrandMosqueWithReflections(t: number) {
      const vis = smoothstep(2.2, 3.5, t) * (1 - smoothstep(8.5, 9.5, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis;

      const baseY = H * 0.72;
      const s = Math.min(W, H) * 0.0024;

      // Golden Metallic Gradients
      const goldGrad = ctx!.createLinearGradient(0, baseY - 280 * s, 0, baseY);
      goldGrad.addColorStop(0.0, '#FFFDF0');
      goldGrad.addColorStop(0.2, '#FFD700');
      goldGrad.addColorStop(0.6, '#C59B27');
      goldGrad.addColorStop(1.0, '#3D2800');

      const darkSil = '#0b0601';

      // ── MARBLE COURTYARD REFLECTION FLOOR ──
      const floorGrad = ctx!.createLinearGradient(0, baseY, 0, H);
      floorGrad.addColorStop(0.0, 'rgba(10, 35, 25, 0.95)');
      floorGrad.addColorStop(0.4, 'rgba(5, 18, 12, 0.98)');
      floorGrad.addColorStop(1.0, '#000000');
      ctx!.fillStyle = floorGrad;
      ctx!.fillRect(0, baseY, W, H - baseY);

      // Marble Floor Reflection Water Ripples
      ctx!.strokeStyle = 'rgba(255, 215, 100, 0.12)';
      ctx!.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const ry = baseY + i * 15 * s + Math.sin(t * 2 + i) * 2;
        ctx!.beginPath();
        ctx!.moveTo(W * 0.1, ry);
        ctx!.lineTo(W * 0.9, ry);
        ctx!.stroke();
      }

      // ── MOSQUE ARCHITECTURE ──
      // Main Base Body
      ctx!.fillStyle = darkSil;
      ctx!.fillRect(W * 0.22, baseY - 110 * s, W * 0.56, 110 * s);
      ctx!.strokeStyle = goldGrad;
      ctx!.lineWidth = 3 * s;
      ctx!.strokeRect(W * 0.22, baseY - 110 * s, W * 0.56, 110 * s);

      // Central Grand Onion Dome
      ctx!.fillStyle = goldGrad;
      ctx!.beginPath();
      ctx!.moveTo(W * 0.4, baseY - 110 * s);
      ctx!.bezierCurveTo(W * 0.4, baseY - 230 * s, W * 0.5, baseY - 260 * s, W * 0.5, baseY - 260 * s);
      ctx!.bezierCurveTo(W * 0.5, baseY - 260 * s, W * 0.6, baseY - 230 * s, W * 0.6, baseY - 110 * s);
      ctx!.closePath();
      ctx!.fill();

      // Dome Finial Crescent Peak
      ctx!.fillStyle = '#FFFDF0';
      ctx!.beginPath();
      ctx!.arc(W * 0.5, baseY - 265 * s, 6 * s, 0, Math.PI * 2);
      ctx!.fill();

      // Secondary Side Domes
      const drawDome = (xCenter: number, width: number, height: number) => {
        ctx!.beginPath();
        ctx!.moveTo(xCenter - width / 2, baseY - 110 * s);
        ctx!.bezierCurveTo(xCenter - width / 2, baseY - 110 * s - height * 0.8, xCenter, baseY - 110 * s - height, xCenter, baseY - 110 * s - height);
        ctx!.bezierCurveTo(xCenter, baseY - 110 * s - height, xCenter + width / 2, baseY - 110 * s - height * 0.8, xCenter + width / 2, baseY - 110 * s);
        ctx!.closePath();
        ctx!.fill();
      };

      ctx!.fillStyle = goldGrad;
      drawDome(W * 0.32, 60 * s, 80 * s);
      drawDome(W * 0.68, 60 * s, 80 * s);
      drawDome(W * 0.25, 45 * s, 60 * s);
      drawDome(W * 0.75, 45 * s, 60 * s);

      // 4 Grand Minarets (Towers)
      const drawMinaret = (x: number, w: number, h: number) => {
        ctx!.fillStyle = darkSil;
        ctx!.fillRect(x - w / 2, baseY - h, w, h);
        ctx!.strokeStyle = goldGrad;
        ctx!.lineWidth = 2 * s;
        ctx!.strokeRect(x - w / 2, baseY - h, w, h);

        // Minaret Balconies
        ctx!.fillStyle = goldGrad;
        ctx!.fillRect(x - w * 0.7, baseY - h * 0.6, w * 1.4, 6 * s);
        ctx!.fillRect(x - w * 0.7, baseY - h * 0.85, w * 1.4, 6 * s);

        // Minaret Dome Peak
        ctx!.beginPath();
        ctx!.moveTo(x - w * 0.6, baseY - h);
        ctx!.lineTo(x, baseY - h - 30 * s);
        ctx!.lineTo(x + w * 0.6, baseY - h);
        ctx!.closePath();
        ctx!.fill();
      };

      drawMinaret(W * 0.16, 18 * s, 260 * s);
      drawMinaret(W * 0.21, 15 * s, 220 * s);
      drawMinaret(W * 0.79, 15 * s, 220 * s);
      drawMinaret(W * 0.84, 18 * s, 260 * s);

      // Illuminated Mosque Arch Windows
      ctx!.fillStyle = `rgba(255, 220, 120, ${0.85 * vis})`;
      ctx!.shadowBlur = 15 * s;
      ctx!.shadowColor = '#FFD700';

      // Center Grand Arch Entrance
      ctx!.beginPath();
      ctx!.moveTo(W * 0.46, baseY);
      ctx!.lineTo(W * 0.46, baseY - 65 * s);
      ctx!.quadraticCurveTo(W * 0.5, baseY - 85 * s, W * 0.54, baseY - 65 * s);
      ctx!.lineTo(W * 0.54, baseY);
      ctx!.fill();

      // Side Windows Arches
      for (let i = 0; i < 4; i++) {
        const lx1 = W * 0.26 + i * 14 * s;
        const rx1 = W * 0.74 - i * 14 * s;
        ctx!.fillRect(lx1, baseY - 70 * s, 7 * s, 25 * s);
        ctx!.fillRect(rx1, baseY - 70 * s, 7 * s, 25 * s);
      }
      ctx!.shadowBlur = 0;

      // ── INVERTED REFLECTION ON MARBLE FLOOR ──
      ctx!.save();
      ctx!.globalAlpha = 0.25 * vis;
      ctx!.translate(0, baseY * 2);
      ctx!.scale(1, -0.6); // Flip upside down
      ctx!.fillStyle = goldGrad;
      drawDome(W * 0.5, 100 * s, 120 * s);
      drawDome(W * 0.32, 60 * s, 80 * s);
      drawDome(W * 0.68, 60 * s, 80 * s);
      ctx!.restore();

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 3: SPECTACULAR FIREWORKS ENGINE (3.5s -> 9.0s)
    // =========================================================================
    function launchFirework(t: number) {
      if (t < 3.2 || t > 8.8) return;

      if (Math.random() < 0.12) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'firework_rocket';
        p.x = W * 0.15 + Math.random() * W * 0.7;
        p.y = H * 0.75;
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = -11 - Math.random() * 5;
        p.size = 2.5;
        p.maxLife = 1.3 + Math.random() * 0.4;
        p.life = 0; p.alpha = 1;
        p.gravity = 0.08; p.drag = 0.99;
        p.color = [
          '#FFD700', '#FF4500', '#00FF7F', '#00FFFF', '#FF1493', '#FFFFFF', '#FFA500'
        ][Math.floor(Math.random() * 7)];
      }
    }

    function explodeFirework(x: number, y: number, color: string) {
      screenFlash = Math.min(1.0, screenFlash + 0.35); // Real-time lighting flash
      const sparkCount = 65 + Math.floor(Math.random() * 35);

      for (let i = 0; i < sparkCount; i++) {
        const p = pool.spawn(); if (!p) break;
        p.type = 'firework_spark';
        p.x = x; p.y = y;
        const angle = (i / sparkCount) * Math.PI * 2;
        const speed = 2.5 + Math.random() * 5.5;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = 1.5 + Math.random() * 2.5;
        p.maxLife = 1.4 + Math.random() * 0.8;
        p.life = 0; p.alpha = 1;
        p.gravity = 0.06; p.drag = 0.96;
        p.color = color;
      }
    }

    // =========================================================================
    // SCENE 4: 3D METALLIC GOLDEN TYPOGRAPHY & ARABIC CALLIGRAPHY (8.5s -> 12.0s)
    // =========================================================================
    function draw3DGoldenText(t: number) {
      const vis = smoothstep(8.5, 9.5, t) * (1 - smoothstep(11.5, 12.0, t));
      if (vis <= 0.001) return;

      const scale = 0.92 + smoothstep(8.5, 10.5, t) * 0.08;

      ctx!.save();
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.globalAlpha = vis;

      // Dark Luxury Background Backdrop for Text
      const darkGrad = ctx!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65);
      darkGrad.addColorStop(0, 'rgba(4, 18, 12, 0.96)');
      darkGrad.addColorStop(1, 'rgba(1, 5, 3, 0.99)');
      ctx!.fillStyle = darkGrad;
      ctx!.fillRect(0, 0, W, H);

      // Volumetric Top Light Beams
      ctx!.globalCompositeOperation = 'lighter';
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 0.25) + (i / rayCount) * (Math.PI * 0.5);
        const len = H * 0.85;
        const rayGrad = ctx!.createLinearGradient(W / 2, 0, W / 2 + Math.cos(angle) * len, Math.sin(angle) * len);
        rayGrad.addColorStop(0, `rgba(255, 215, 0, ${0.15 * vis})`);
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.fillStyle = rayGrad;
        ctx!.beginPath();
        ctx!.moveTo(W / 2, 0);
        ctx!.lineTo(W / 2 + Math.cos(angle - 0.03) * len, Math.sin(angle - 0.03) * len);
        ctx!.lineTo(W / 2 + Math.cos(angle + 0.03) * len, Math.sin(angle + 0.03) * len);
        ctx!.closePath();
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = 'source-over';

      ctx!.translate(W / 2, H * 0.44);
      ctx!.scale(scale, scale);

      // ── ARABIC CALLIGRAPHY (عيد مبارك) ──
      const fontSizeArabic = Math.min(W * 0.09, 85);
      ctx!.font = `700 ${fontSizeArabic}px "Amiri", serif`;

      ctx!.strokeStyle = '#020b06';
      ctx!.lineWidth = fontSizeArabic * 0.1;
      ctx!.strokeText('عيد مبارك', 0, -fontSizeArabic * 0.3);

      const goldArabic = ctx!.createLinearGradient(0, -fontSizeArabic, 0, 0);
      goldArabic.addColorStop(0.0, '#FFFDF0');
      goldArabic.addColorStop(0.3, '#FFD700');
      goldArabic.addColorStop(0.6, '#D4AF37');
      goldArabic.addColorStop(1.0, '#593800');

      ctx!.shadowBlur = 35;
      ctx!.shadowColor = 'rgba(255, 215, 0, 0.85)';
      ctx!.fillStyle = goldArabic;
      ctx!.fillText('عيد مبارك', 0, -fontSizeArabic * 0.3);

      // ── ENGLISH METALLIC TEXT (EID MUBARAK 2027) ──
      const fontSizeEng = Math.min(W * 0.055, 52);
      const cyEng = fontSizeArabic * 0.9;
      ctx!.font = `900 ${fontSizeEng}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 0;
      ctx!.strokeStyle = '#020b06';
      ctx!.lineWidth = fontSizeEng * 0.08;
      ctx!.strokeText('EID MUBARAK 2027', 0, cyEng);

      const goldEng = ctx!.createLinearGradient(0, cyEng - fontSizeEng / 2, 0, cyEng + fontSizeEng / 2);
      goldEng.addColorStop(0.0, '#FFFFFF');
      goldEng.addColorStop(0.4, '#FFE680');
      goldEng.addColorStop(0.8, '#C68A00');
      goldEng.addColorStop(1.0, '#2E1A00');

      ctx!.shadowBlur = 25;
      ctx!.shadowColor = 'rgba(255, 200, 0, 0.75)';
      ctx!.fillStyle = goldEng;
      ctx!.fillText('EID MUBARAK 2027', 0, cyEng);

      ctx!.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============
    function spawnAmbientParticles(t: number) {
      // Twinkling Stars
      if (t < 11.5 && Math.random() < 0.4) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'star'; p.x = Math.random() * W; p.y = Math.random() * H * 0.65;
        p.vx = 0; p.vy = 0;
        p.size = 0.5 + Math.random() * 1.5; p.maxLife = 3 + Math.random() * 2; p.life = 0; p.alpha = 0;
        p.twinkle = Math.random() * Math.PI * 2;
      }
      // Gold Shimmer Dust
      if (t > 2.0 && t < 11.5 && Math.random() < 0.5) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'dust'; p.x = Math.random() * W; p.y = H + 10;
        p.vx = (Math.random() - 0.5) * 0.6; p.vy = -0.6 - Math.random() * 0.8;
        p.size = 1 + Math.random() * 2.5; p.maxLife = 5; p.life = 0; p.alpha = 0;
      }
    }

    function updateAndDrawParticles(dt: number, t: number) {
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      
      // Real-time Explosion Screen Flash Lighting
      screenFlash = Math.max(0, screenFlash - dt * 2.0);
      if (screenFlash > 0) {
        ctx!.fillStyle = `rgba(255, 230, 160, ${screenFlash * 0.2})`;
        ctx!.fillRect(0, 0, W, H);
      }

      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active) continue;

        p.life += dt;
        const lr = p.life / p.maxLife;

        // Physics Engine
        p.vy += p.gravity * dt;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'star') {
          p.twinkle += dt * 2;
          p.alpha = (0.5 + Math.sin(p.twinkle) * 0.5) * (1 - smoothstep(11.0, 11.8, t));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = '#ffffff';
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx!.fill();
          }
        } else if (p.type === 'dust') {
          p.alpha = smoothstep(0, 0.4, lr) * (1 - smoothstep(0.8, 1, lr)) * 0.65 * (t < 11.5 ? 1 : 1 - smoothstep(11.5, 12.0, t));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            const sz = p.size * 4;
            ctx!.drawImage(goldDustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        } else if (p.type === 'firework_rocket') {
          p.alpha = 1 - lr;
          if (p.vy >= -1.5 || p.life > p.maxLife) {
            if (!p.hasExploded) {
              p.hasExploded = true;
              explodeFirework(p.x, p.y, p.color);
              p.alpha = 0;
            }
          }
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx!.fill();
            ctx!.globalAlpha = p.alpha * 0.5;
            ctx!.fillRect(p.x - 1, p.y, 2, 12);
          }
        } else if (p.type === 'firework_spark') {
          p.alpha = 1 - lr;
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            const sz = p.size * 4;
            ctx!.drawImage(fireworkSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx!.fill();
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }
      ctx!.restore();
    }

    // ============ POST-PROCESSING EFFECTS ============
    function applyBloom() {
      const bloomAlpha = 0.5;
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
      const grad = ctx!.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx!.save();
      ctx!.globalCompositeOperation = 'overlay';
      ctx!.globalAlpha = 0.3;
      const ox = Math.floor(Math.random() * 64), oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) ctx!.drawImage(grain, x, y);
      }
      ctx!.restore();
    }

    // ============ MAIN RENDER PIPELINE ============
    function render(t: number, dt: number) {
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx!.fillStyle = '#000000';
      ctx!.fillRect(0, 0, W, H);

      drawNightSkyAndMoon(t);
      drawGrandMosqueWithReflections(t);

      launchFirework(t);
      spawnAmbientParticles(t);
      updateAndDrawParticles(dt, t);

      draw3DGoldenText(t);

      const fadeIn = 1 - smoothstep(0, 1.0, t);
      const fadeOut = smoothstep(11.5, 12.0, t);
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

      if (t >= 11.5 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 12.0) {
        render(t, dt);
      } else {
        ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx!.fillStyle = '#000000';
        ctx!.fillRect(0, 0, W, H);
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
          background: '#000000',
        }}
      />
      {/* SKIP BUTTON */}
      <button
        onClick={() => onComplete?.()}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-[100] px-4 py-2 rounded-full border border-amber-400/30 bg-black/40 text-amber-200 backdrop-blur-md text-[10px] sm:text-xs font-bold tracking-[0.2em] transition-all duration-300 hover:bg-amber-400/20 hover:border-amber-300/70"
      >
        SKIP →
      </button>
    </div>
  );
}
