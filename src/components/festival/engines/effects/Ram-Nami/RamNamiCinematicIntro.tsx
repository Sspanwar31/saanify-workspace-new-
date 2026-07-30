'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
  imageUrl?: string;
}

// ============ EASING & MATH ============
const smoothstep = (a: number, b: number, t: number) => {
  if (b === a) return t < a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));

// ============ PARTICLE SYSTEM ============
type PType = 'dust' | 'petal' | 'sparkle' | 'smoke' | 'bird';

interface Particle {
  idx: number;
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  life: number; maxLife: number;
  alpha: number;
  type: PType;
  tx: number; ty: number;
  rot: number; rotSpd: number;
  flap: number;
  active: boolean;
  delay: number;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0,
        size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', tx: 0, ty: 0,
        rot: 0, rotSpd: 0, flap: 0,
        active: false, delay: 0
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    p.active = true;
    p.life = 0;
    p.alpha = 0;
    p.delay = 0;
    return p;
  }
  release(p: Particle) {
    p.active = false;
    this.free.push(p.idx);
  }
}

interface FireworkSpark {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  alpha: number;
  life: number; maxLife: number;
  size: number;
}

interface FloatingDiya {
  x: number; y: number;
  scale: number;
  speed: number;
  phase: number;
  flamePulse: number;
}

export default function RamNamiCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
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
    let birdsSpawned = false; 
    let handoverTriggered = false;
    let lastSampleTime = 0;

    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    const diyas: FloatingDiya[] = [];
    const sparks: FireworkSpark[] = [];
    const activeFireworkBursts: { x: number; y: number; color: string; r: number; maxR: number; alpha: number }[] = [];

    // Procedural light sprites
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
    const dustSprite = makeSprite(32, 'rgba(255,210,130,1)', 'rgba(255,130,40,0.3)');
    const sparkSprite = makeSprite(32, 'rgba(255,250,220,1)', 'rgba(255,180,80,0.35)');

    const pool = new ParticlePool(1000);
    const cam = { x: 0, y: 0, zoom: 1, rot: 0 };
    let ramPoints: { x: number; y: number }[] = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      bloom.width = Math.max(2, Math.floor(W / 2));
      bloom.height = Math.max(2, Math.floor(H / 2));
      grain.width = 256;
      grain.height = 256;
      generateGrain();
      sampleText();
      initializeDiyas();
    }

    function generateGrain() {
      const id = gctx.createImageData(grain.width, grain.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = Math.random() * 255;
        d[i] = n; d[i + 1] = n; d[i + 2] = n;
        d[i + 3] = 18;
      }
      gctx.putImageData(id, 0, 0);
    }

    function initializeDiyas() {
      diyas.length = 0;
      const count = 35;
      for (let i = 0; i < count; i++) {
        const progress = Math.random();
        const y = lerp(H * 0.65, H * 0.96, progress);
        const scale = lerp(0.18, 0.9, progress);
        diyas.push({
          x: Math.random() * W,
          y: y,
          scale,
          speed: lerp(3, 12, progress) * (Math.random() < 0.5 ? -1 : 1),
          phase: Math.random() * Math.PI * 2,
          flamePulse: Math.random() * 10,
        });
      }
    }

    function sampleText() {
      const tc = document.createElement('canvas');
      const tctx = tc.getContext('2d')!;
      const fontSize = Math.min(W * 0.13, 130);
      tc.width = Math.floor(W);
      tc.height = Math.floor(fontSize * 2);
      tctx.fillStyle = 'white';
      tctx.font = `700 ${fontSize}px "Noto Sans Devanagari", "Mangal", "Nirmala UI", sans-serif`;
      tctx.textAlign = 'center';
      tctx.textBaseline = 'middle';
      tctx.fillText('श्री राम', tc.width / 2, tc.height / 2);
      const id = tctx.getImageData(0, 0, tc.width, tc.height);
      ramPoints = [];
      const step = 3;
      for (let y = 0; y < tc.height; y += step) {
        for (let x = 0; x < tc.width; x += step) {
          const i = (y * tc.width + x) * 4;
          if (id.data[i + 3] > 128) {
            ramPoints.push({ x: x - tc.width / 2, y: y - tc.height / 2 });
          }
        }
      }
    }

    // ============ RENDER LAYERS ============

    function drawBackground(t: number) {
      const reveal = smoothstep(0, 4, t);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      const ir = Math.floor(lerp(4, 45, reveal));
      const ig = Math.floor(lerp(2, 22, reveal));
      const ib = Math.floor(lerp(5, 12, reveal));
      grad.addColorStop(0, '#020104');
      grad.addColorStop(0.6, `rgb(${ir},${ig},${ib})`);
      grad.addColorStop(1, '#0c0502');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function drawDivineLight(t: number) {
      const reveal = smoothstep(1.8, 5, t);
      const fade = smoothstep(16, 17.5, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);
      const sx = W * 0.5;
      const sy = H * 0.44; 
      const sunR = W * 0.22;
      const sunGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sunR);
      sunGrad.addColorStop(0, `rgba(255, 230, 160, ${0.9 * vis})`);
      sunGrad.addColorStop(0.2, `rgba(255, 170, 70, ${0.6 * vis})`);
      sunGrad.addColorStop(0.5, `rgba(180, 80, 20, ${0.2 * vis})`);
      sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rayCount = 24;
      const maxLen = Math.max(W, H) * 1.2;
      for (let i = 0; i < rayCount; i++) {
        const baseAngle = (i / rayCount) * Math.PI * 2;
        const angle = baseAngle + t * 0.04 + Math.sin(t * 0.3 + i * 0.8) * 0.03;
        const len = maxLen * (0.6 + 0.4 * Math.sin(t * 0.5 + i * 1.7));
        const flicker = 0.7 + 0.3 * Math.sin(t * 1.5 + i * 2.3);
        const a = 0.08 * vis * flicker;
        const ex = sx + Math.cos(angle) * len;
        const ey = sy + Math.sin(angle) * len;
        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, `rgba(255, 215, 140, ${a})`);
        grad.addColorStop(0.4, `rgba(255, 150, 50, ${a * 0.5})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        const w = 0.04 + Math.sin(t * 0.4 + i * 2) * 0.015;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle - w) * len, sy + Math.sin(angle - w) * len);
        ctx.lineTo(sx + Math.cos(angle + w) * len, sy + Math.sin(angle + w) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawRamMandir(t: number) {
      const reveal = smoothstep(2.5, 6, t);
      const fade = smoothstep(16, 17.5, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);

      const s = Math.min(W, H) * 0.0012;
      const mx = W * 0.72; 
      const baseY = H * 0.64;

      ctx.save();
      ctx.globalAlpha = vis;

      // Warm glow behind temple
      const glow = ctx.createRadialGradient(mx, baseY - 80 * s, 0, mx, baseY - 80 * s, 160 * s);
      glow.addColorStop(0, 'rgba(255, 140, 40, 0.25)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Nagara architecture drawing (Temple Towers)
      ctx.fillStyle = '#0a0503';
      ctx.strokeStyle = `rgba(255, 180, 80, ${0.45 * (0.6 + 0.4 * Math.sin(t * 5))})`;
      ctx.lineWidth = 1 * s;

      const drawShikhara = (tx: number, ty: number, tw: number, th: number) => {
        ctx.beginPath();
        ctx.moveTo(tx - tw / 2, ty);
        ctx.bezierCurveTo(tx - tw / 2, ty - th * 0.35, tx - tw * 0.15, ty - th * 0.78, tx - tw * 0.08, ty - th);
        ctx.lineTo(tx + tw * 0.08, ty - th);
        ctx.bezierCurveTo(tx + tw * 0.15, ty - th * 0.78, tx + tw / 2, ty - th * 0.35, tx + tw / 2, ty);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Horizontal bands
        for (let i = 1; i < 7; i++) {
          const f = i / 7;
          const y = ty - th * f;
          const w = lerp(tw, tw * 0.16, f * f);
          ctx.beginPath();
          ctx.moveTo(tx - w / 2, y);
          ctx.lineTo(tx + w / 2, y);
          ctx.stroke();
        }
      };

      // Mandapams & Base Platforms
      ctx.fillRect(mx - 130 * s, baseY - 24 * s, 260 * s, 24 * s);
      ctx.strokeRect(mx - 130 * s, baseY - 24 * s, 260 * s, 24 * s);

      ctx.fillRect(mx - 100 * s, baseY - 48 * s, 200 * s, 24 * s);
      ctx.strokeRect(mx - 100 * s, baseY - 48 * s, 200 * s, 24 * s);

      // Towers (Shikharas)
      drawShikhara(mx, baseY - 48 * s, 85 * s, 180 * s); // Main center
      drawShikhara(mx - 65 * s, baseY - 48 * s, 50 * s, 110 * s); // Left
      drawShikhara(mx + 65 * s, baseY - 48 * s, 50 * s, 110 * s); // Right

      // Flags waving on peaks
      ctx.strokeStyle = '#bc5333';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(mx, baseY - 228 * s);
      ctx.lineTo(mx, baseY - 248 * s);
      ctx.stroke();

      // Mini orange flag
      ctx.fillStyle = '#ff7300';
      ctx.beginPath();
      ctx.moveTo(mx, baseY - 248 * s);
      ctx.lineTo(mx + 15 * s + Math.sin(t * 6) * 3, baseY - 241 * s);
      ctx.lineTo(mx, baseY - 234 * s);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawWater(t: number) {
      const reveal = smoothstep(1, 4.5, t);
      const fade = smoothstep(16, 17.5, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0) return;

      const waterY = H * 0.62;
      ctx.save();
      ctx.globalAlpha = vis;

      // Deep dark water base gradient
      const wGrad = ctx.createLinearGradient(0, waterY, 0, H);
      wGrad.addColorStop(0, '#080402');
      wGrad.addColorStop(0.5, '#050201');
      wGrad.addColorStop(1, '#020000');
      ctx.fillStyle = wGrad;
      ctx.fillRect(0, waterY, W, H - waterY);

      // Render Saryu River reflection columns (Temple & Sun light)
      ctx.globalCompositeOperation = 'screen';
      
      const mandirX = W * 0.72;
      const refW = 140 * Math.min(W, H) * 0.0012;
      const colGrad = ctx.createLinearGradient(mandirX - refW / 2, 0, mandirX + refW / 2, 0);
      colGrad.addColorStop(0, 'rgba(180, 90, 20, 0)');
      colGrad.addColorStop(0.5, 'rgba(235, 140, 50, 0.16)');
      colGrad.addColorStop(1, 'rgba(180, 90, 20, 0)');
      ctx.fillStyle = colGrad;
      ctx.fillRect(mandirX - refW / 2, waterY, refW, H - waterY);

      // Horizontal wave displacements (Ripples)
      for (let y = waterY + 2; y < H; y += 3) {
        const distanceFactor = (y - waterY) / (H - waterY);
        const waveX = Math.sin(y * 0.14 + t * 4.5) * 5 * distanceFactor;
        const lineA = lerp(0.04, 0.15, distanceFactor);

        ctx.strokeStyle = `rgba(255, 190, 80, ${lineA})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mandirX - (refW / 2) * distanceFactor + waveX, y);
        ctx.lineTo(mandirX + (refW / 2) * distanceFactor + waveX, y);
        ctx.stroke();
      }

      // Dynamic Firework reflections in the water
      activeFireworkBursts.forEach((b) => {
        if (b.y > waterY) return;
        const rY = waterY + (waterY - b.y); 
        const dy = rY - waterY;
        const rfGrad = ctx.createRadialGradient(b.x, rY, 0, b.x, rY, b.r * 1.5);
        rfGrad.addColorStop(0, `${b.color}${Math.floor(b.alpha * 45).toString(16).padStart(2, '0')}`);
        rfGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rfGrad;
        
        ctx.beginPath();
        ctx.ellipse(b.x, waterY + dy * 0.6, b.r * 1.2, b.r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    function updateAndDrawFloatingDiyas(t: number) {
      const reveal = smoothstep(5, 7.5, t);
      const fade = smoothstep(16, 17.5, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0) return;

      const waterY = H * 0.62;

      ctx.save();
      ctx.globalAlpha = vis;

      diyas.forEach((d, i) => {
        d.x += (d.speed * 0.016);
        if (d.x < -40) d.x = W + 40;
        if (d.x > W + 40) d.x = -40;

        const waveY = d.y + Math.sin(t * 1.5 + d.phase) * 1.8 * d.scale;
        if (waveY < waterY) return;

        const flamePulse = Math.sin(t * 15 + d.flamePulse) * 1;
        const s = d.scale * 15; 
        const flameH = (s * 1.5) + flamePulse * d.scale;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const trailH = s * 4.5;
        const trailGrad = ctx.createLinearGradient(d.x, waveY, d.x, waveY + trailH);
        trailGrad.addColorStop(0, 'rgba(255, 170, 40, 0.35)');
        trailGrad.addColorStop(0.5, 'rgba(255, 120, 20, 0.12)');
        trailGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = trailGrad;
        ctx.fillRect(d.x - s * 0.3, waveY, s * 0.6, trailH);
        ctx.restore();

        const dGrad = ctx.createLinearGradient(d.x - s, waveY, d.x + s, waveY);
        dGrad.addColorStop(0, '#502008');
        dGrad.addColorStop(0.5, '#9e4a1a');
        dGrad.addColorStop(1, '#502008');
        ctx.fillStyle = dGrad;
        ctx.beginPath();
        ctx.ellipse(d.x, waveY + s * 0.25, s, s * 0.35, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#1c0500';
        ctx.beginPath();
        ctx.ellipse(d.x, waveY + s * 0.15, s * 0.88, s * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        const fGrad = ctx.createLinearGradient(d.x, waveY, d.x, waveY - flameH);
        fGrad.addColorStop(0, 'rgba(255, 80, 0, 0.95)');
        fGrad.addColorStop(0.4, 'rgba(255, 180, 30, 0.99)');
        fGrad.addColorStop(0.8, 'rgba(255, 245, 190, 0.99)');
        fGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = fGrad;

        ctx.beginPath();
        ctx.moveTo(d.x - s * 0.18, waveY + s * 0.1);
        ctx.quadraticCurveTo(d.x - s * 0.25, waveY - flameH * 0.45, d.x, waveY - flameH);
        ctx.quadraticCurveTo(d.x + s * 0.25, waveY - flameH * 0.45, d.x + s * 0.18, waveY + s * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.5 * vis;
        ctx.drawImage(dustSprite, d.x - s * 1.5, waveY - flameH - s * 0.5, s * 3, s * 3);
        ctx.restore();
      });

      ctx.restore();
    }

    function drawFogAndHaze(t: number) {
      const intensity = smoothstep(1.5, 5, t) * (1 - smoothstep(16, 17.5, t));
      if (intensity <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      for (let layer = 0; layer < 3; layer++) {
        const y = H * (0.64 + layer * 0.05);
        const speed = 6 + layer * 5;
        const offset = (t * speed + layer * 149) % (W * 1.5);
        const grad = ctx.createLinearGradient(0, y - 30, 0, y + 80);
        const a = 0.06 * intensity * (1 - layer * 0.2);
        grad.addColorStop(0, 'rgba(180, 110, 40, 0)');
        grad.addColorStop(0.5, `rgba(180, 110, 40, ${a})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-offset, y - 30, W * 2.5, 110);
      }
      ctx.restore();
    }

    // ============ FIREWORKS LOGIC ============

    function launchFireworks(t: number) {
      if (t < 4.5 || t > 15) return;
      if (Math.random() < 0.05) {
        const fx = W * 0.15 + Math.random() * W * 0.55;
        const fy = H * 0.12 + Math.random() * H * 0.24;
        const colors = ['#dfb55c', '#ff7300', '#fcfbf7', '#dfb55c', '#00ffcc'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        activeFireworkBursts.push({
          x: fx, y: fy, color, r: 0, maxR: 45 + Math.random() * 45, alpha: 1
        });

        for (let i = 0; i < 48; i++) {
          const ang = (i / 48) * Math.PI * 2 + Math.random() * 0.2;
          const spd = 1.5 + Math.random() * 3.5;
          sparks.push({
            x: fx, y: fy,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            color,
            alpha: 1,
            life: 0,
            maxLife: 2.5 + Math.random() * 1.5,
            size: 1 + Math.random() * 1.8
          });
        }
      }
    }

    function updateFireworks(dt: number) {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.035; 
        s.vx *= 0.985;
        s.vy *= 0.985;
        const lr = s.life / s.maxLife;
        s.alpha = 1 - lr;
        if (s.life > s.maxLife || s.y > H * 0.62) {
          sparks.splice(i, 1);
        }
      }

      for (let i = activeFireworkBursts.length - 1; i >= 0; i--) {
        const b = activeFireworkBursts[i];
        b.r += (b.maxR - b.r) * 0.12;
        b.alpha -= 0.04;
        if (b.alpha <= 0) {
          activeFireworkBursts.splice(i, 1);
        }
      }
    }

    function drawFireworks() {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      activeFireworkBursts.forEach((b) => {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `${b.color}aa`);
        grad.addColorStop(0.3, `${b.color}33`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      sparks.forEach((s) => {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        const sz = s.size;
        ctx.drawImage(sparkSprite, s.x - sz * 3, s.y - sz * 3, sz * 6, sz * 6);
      });

      ctx.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============

    function spawnDust(t: number) {
      const target = Math.floor(65 * smoothstep(0, 3, t));
      let count = 0;
      for (const p of pool.particles) if (p.active && p.type === 'dust') count++;
      let attempts = 0;
      while (count < target && attempts < 8) {
        const p = pool.spawn();
        if (!p) break;
        p.type = 'dust';
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.vx = (Math.random() - 0.5) * 0.35;
        p.vy = -0.05 - Math.random() * 0.3;
        p.size = 0.5 + Math.random() * 1.4;
        p.maxLife = 5 + Math.random() * 5;
        p.life = Math.random() * p.maxLife * 0.4;
        p.alpha = 0;
        p.rot = Math.random() * Math.PI * 2;
        p.rotSpd = (Math.random() - 0.5) * 0.5;
        count++;
        attempts++;
      }
    }

    function spawnPetals(t: number) {
      const intensity = smoothstep(6.5, 9.5, t) * (1 - smoothstep(16, 17.5, t));
      if (intensity <= 0) return;
      if (Math.random() > intensity * 0.35) return;
      const p = pool.spawn();
      if (!p) return;
      p.type = 'petal';
      p.x = Math.random() * W;
      p.y = -20;
      p.vx = (Math.random() - 0.5) * 0.7;
      p.vy = 0.4 + Math.random() * 0.65;
      p.size = 4.5 + Math.random() * 5.5;
      p.maxLife = 18;
      p.life = 0;
      p.alpha = 0;
      p.rot = Math.random() * Math.PI * 2;
      p.rotSpd = (Math.random() - 0.5) * 2.2;
    }

    function spawnTextParticles(t: number) {
      if (t < 7.5 || t > 9.5) return;
      if (ramPoints.length === 0) return;
      const target = Math.min(ramPoints.length, 650);
      let active = 0;
      for (const p of pool.particles) if (p.active && p.type === 'sparkle') active++;
      let attempts = 0;
      while (active < target && attempts < 10) {
        const p = pool.spawn();
        if (!p) break;
        const pt = ramPoints[Math.floor(Math.random() * ramPoints.length)];
        p.type = 'sparkle';
        p.x = W / 2 + (Math.random() - 0.5) * W * 1.3;
        p.y = H * 0.36 + (Math.random() - 0.5) * H * 1.1;
        p.tx = W / 2 + pt.x;
        p.ty = H * 0.36 + pt.y; 
        p.vx = 0; p.vy = 0;
        p.size = 1.1 + Math.random() * 1.4;
        p.maxLife = 7;
        p.life = 0;
        p.alpha = 0;
        p.delay = Math.random() * 1.1;
        active++;
        attempts++;
      }
    }

    function spawnIncenseSmoke(t: number) {
      const intensity = smoothstep(8, 10, t) * (1 - smoothstep(16, 17.5, t));
      if (intensity <= 0) return;
      if (Math.random() > 0.08 * intensity) return;
      
      const s = Math.min(W, H) * 0.0011;
      const emitterX = Math.random() < 0.5 ? W * 0.15 : W * 0.85;

      const p = pool.spawn();
      if (!p) return;
      p.type = 'smoke';
      p.x = emitterX;
      p.y = H * 0.85 - 12 * s;
      p.vx = (Math.random() - 0.5) * 0.25;
      p.vy = -0.5 - Math.random() * 0.45;
      p.size = 6 + Math.random() * 8;
      p.maxLife = 4.5 + Math.random() * 3.5;
      p.life = 0;
      p.alpha = 0;
    }

    function spawnBirds(t: number) {
      if (t < 9.8 || t > 10.5) return;
      if (birdsSpawned) return;
      birdsSpawned = true;
      const count = 12;
      for (let i = 0; i < count; i++) {
        const p = pool.spawn();
        if (!p) break;
        p.type = 'bird';
        p.x = -60 - i * 18 + Math.random() * 15;
        p.y = H * 0.22 + Math.random() * 70 + (i % 3) * 12;
        p.vx = 2.2 + Math.random() * 0.6;
        p.vy = (Math.random() - 0.5) * 0.15;
        p.size = 7 + Math.random() * 4;
        p.maxLife = 25;
        p.life = 0;
        p.alpha = 0.65;
        p.flap = Math.random() * Math.PI * 2;
      }
    }

    function updateParticles(dt: number, t: number) {
      for (const p of pool.particles) {
        if (!p.active) continue;
        p.life += dt;

        if (p.type === 'dust') {
          p.x += p.vx;
          p.y += p.vy;
          p.vx += (Math.random() - 0.5) * 0.03;
          p.vy += -0.002;
          p.rot += p.rotSpd * dt;
          const lr = p.life / p.maxLife;
          const env = smoothstep(0, 2, t) * (1 - smoothstep(16, 17.5, t));
          p.alpha = smoothstep(0, 0.25, lr) * (1 - smoothstep(0.75, 1, lr)) * 0.65 * env;
          if (p.life > p.maxLife || p.y < -30) {
            p.life = 0; p.x = Math.random() * W; p.y = H * 0.6; p.alpha = 0;
          }
        } else if (p.type === 'petal') {
          p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.012) * 0.35;
          p.y += p.vy;
          p.rot += p.rotSpd * dt;
          const lr = p.life / p.maxLife;
          p.alpha = smoothstep(0, 0.12, lr) * 0.85 * (1 - smoothstep(16, 17.5, t));
          if (p.y > H * 0.62 || p.life > p.maxLife) pool.release(p);
        } else if (p.type === 'sparkle') {
          if (p.delay > 0) {
            p.delay -= dt;
            p.alpha = 0;
            continue;
          }
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.5) {
            const speed = clamp(dist * 4.5, 90, 520);
            p.vx = (dx / dist) * speed;
            p.vy = (dy / dist) * speed;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha = clamp(p.alpha + dt * 1.6, 0, 0.7);
          } else {
            p.x = p.tx + Math.sin(t * 4 + p.idx) * 0.35;
            p.y = p.ty + Math.cos(t * 4 + p.idx * 1.3) * 0.35;
            p.alpha = clamp(p.alpha + dt * 1.8, 0, 1);
          }
          if (t > 12) p.alpha *= 1 - smoothstep(12, 14, t);
          if (t > 14.5 && p.alpha < 0.01) pool.release(p);
        } else if (p.type === 'smoke') {
          p.x += p.vx + Math.sin(t * 1.4 + p.y * 0.01) * 0.25;
          p.y += p.vy;
          p.size += dt * 5.2; 
          const lr = p.life / p.maxLife;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.18;
          if (p.life > p.maxLife || p.y < -30) pool.release(p);
        } else if (p.type === 'bird') {
          p.x += p.vx;
          p.y += p.vy;
          p.flap += dt * 9;
          p.alpha = 0.65 * (1 - smoothstep(15, 16, t));
          if (p.x > W + 60 || p.alpha < 0.01) pool.release(p);
        }
      }
    }

    function drawParticles() {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const p of pool.particles) {
        if (!p.active || p.alpha <= 0.01) continue;
        if (p.type === 'dust') {
          ctx.globalAlpha = p.alpha;
          const sz = p.size * 5.2;
          ctx.drawImage(dustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
        } else if (p.type === 'sparkle') {
          ctx.globalAlpha = p.alpha;
          const sz = p.size * 4.4;
          ctx.drawImage(sparkSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      for (const p of pool.particles) {
        if (!p.active || p.alpha <= 0.01) continue;
        if (p.type === 'petal') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(240, 120, 60, ${p.alpha})`; 
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.48, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.type === 'smoke') {
          ctx.save();
          const rad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          rad.addColorStop(0, `rgba(255, 230, 200, ${p.alpha})`);
          rad.addColorStop(0.3, `rgba(220, 160, 100, ${p.alpha * 0.5})`);
          rad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.type === 'bird') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.fillStyle = `rgba(10, 5, 2, ${p.alpha})`;
          const flap = Math.sin(p.flap) * 0.7;
          const sz = p.size;
          ctx.beginPath();
          ctx.moveTo(-sz, 0);
          ctx.quadraticCurveTo(-sz * 0.4, -sz * 0.6 * (1 - flap * 0.5), 0, 0);
          ctx.quadraticCurveTo(sz * 0.4, -sz * 0.6 * (1 - flap * 0.5), sz, 0);
          ctx.quadraticCurveTo(sz * 0.4, sz * 0.15, 0, sz * 0.1);
          ctx.quadraticCurveTo(-sz * 0.4, sz * 0.15, -sz, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    }

    function drawTitle(t: number) {
      if (t < 8.5) return;
      const intensity = smoothstep(8.5, 10, t) * (1 - smoothstep(12, 14, t));
      if (intensity <= 0.01) return;
      const fontSize = Math.min(W * 0.12, 125);
      const cy = H * 0.32;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${fontSize}px "Noto Sans Devanagari", "Mangal", "Nirmala UI", sans-serif`;

      ctx.globalCompositeOperation = 'screen';
      const haloGrad = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, fontSize * 2);
      haloGrad.addColorStop(0, `rgba(255, 190, 80, ${0.16 * intensity})`);
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(W / 2, cy);
      const rayCount = 18;
      for (let i = 0; i < rayCount; i++) {
        const a = (i / rayCount) * Math.PI * 2 + t * 0.06;
        const len = fontSize * 1.6;
        const flicker = 0.6 + 0.4 * Math.sin(t * 1.8 + i);
        const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        grad.addColorStop(0, `rgba(255, 190, 80, ${0.1 * intensity * flicker})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.035) * len, Math.sin(a - 0.035) * len);
        ctx.lineTo(Math.cos(a + 0.035) * len, Math.sin(a + 0.035) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255, 215, 120, ${0.04 * intensity})`;
      ctx.fillText('श्री राम', W / 2, cy);
      ctx.restore();
    }

    function drawGreeting(t: number) {
      const reveal = smoothstep(13, 14.5, t);
      const fade = smoothstep(16, 17.5, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0.01) return;
      const fontSize = Math.min(W * 0.054, 52);
      const cy = H * 0.54;
      const line1 = 'राम नवमी की';
      const line2 = 'हार्दिक शुभकामनाएँ';
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${fontSize}px "Noto Sans Devanagari", "Mangal", "Nirmala UI", sans-serif`;

      ctx.globalCompositeOperation = 'screen';
      const haloGrad = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, fontSize * 3.5);
      haloGrad.addColorStop(0, `rgba(255, 170, 60, ${0.11 * vis})`);
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'source-over';
      const y1 = cy - fontSize * 0.65;
      const y2 = cy + fontSize * 0.65;

      ctx.shadowBlur = 24;
      ctx.shadowColor = `rgba(255, 160, 50, ${vis})`;
      ctx.fillStyle = `rgba(180, 90, 20, ${vis * 0.5})`;
      ctx.fillText(line1, W / 2, y1);
      ctx.fillText(line2, W / 2, y2);
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(255, 190, 80, ${vis})`;
      ctx.fillStyle = `rgba(220, 140, 50, ${vis * 0.7})`;
      ctx.fillText(line1, W / 2, y1);
      ctx.fillText(line2, W / 2, y2);
      ctx.shadowBlur = 6;
      ctx.shadowColor = `rgba(255, 220, 130, ${vis})`;
      ctx.fillStyle = `rgba(255, 220, 150, ${vis})`;
      ctx.fillText(line1, W / 2, y1);
      ctx.fillText(line2, W / 2, y2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255, 245, 210, ${vis * 0.5})`;
      ctx.fillText(line1, W / 2 - 0.5, y1 - 0.5);
      ctx.fillText(line2, W / 2 - 0.5, y2 - 0.5);
      ctx.restore();
    }

    // ============ POST-PROCESSING ============

    function applyBloom() {
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(5px) brightness(1.25)';
      bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.5;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.restore();
    }

    function applyColorGrade() {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(80, 32, 4, 0.16)');
      grad.addColorStop(0.5, 'rgba(40, 12, 3, 0.06)');
      grad.addColorStop(1, 'rgba(20, 4, 0, 0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function applyVignette(t: number) {
      const fade = smoothstep(16, 17.5, t);
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.82);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${0.5 + fade * 0.45})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.35;
      const ox = Math.floor(Math.random() * 64);
      const oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) {
          ctx.drawImage(grain, x, y);
        }
      }
      ctx.restore();
    }

    // ============ CAMERA ============

    function updateCamera(t: number) {
      cam.zoom = 1 + smoothstep(0, 17.5, t) * 0.035;
      cam.rot = Math.sin(t * 0.11) * 0.003;
      cam.x = Math.sin(t * 0.25) * 3;
      cam.y = Math.cos(t * 0.2) * 2;
    }

    function applyCamera() {
      ctx.translate(W / 2 + cam.x, H / 2 + cam.y);
      ctx.rotate(cam.rot);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-W / 2, -H / 2);
    }

    // ============ RENDER PIPELINE ============

    function render(t: number, dt: number) {
      spawnDust(t);
      spawnPetals(t);
      spawnTextParticles(t);
      spawnIncenseSmoke(t);
      updateParticles(dt, t);
      updateCamera(t);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      applyCamera();
      drawBackground(t);
      drawDivineLight(t);
      drawWater(t);                   // 🚀 नया: सरयू नदी और परावर्तन (Reflection)
      drawRamMandir(t);               // 🚀 नया: भव्य राम मंदिर
      drawFireworks();                // 🚀 नया: आसमान में आतिशबाज़ी
      updateAndDrawFloatingDiyas(t);  // 🚀 नया: पानी पर तैरते दीये      drawFogAndHaze(t);
      drawParticles();
      ctx.restore();

      drawTitle(t);
      drawGreeting(t);

      const fadeIn = 1 - smoothstep(0, 1.2, t);
      const fadeOut = smoothstep(16, 17.5, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);
      if (fadeAmt > 0.001) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx.fillRect(0, 0, W, H);
      }

      applyBloom();
      applyColorGrade();
      applyVignette(t);
      applyGrain();
    }

    function loop(now: number) {
      if (!running) return;
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
      lastTime = now;

      if (t > 4 && lastSampleTime === 0) {
        sampleText();
        lastSampleTime = t;
      }

      if (t < 9.7) birdsSpawned = false;

      if (t >= 16.5 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }

      if (t < 17.5) {
        render(t, dt);
      } else {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
      }
      rafId = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);draw
    rafId = requestAnimationFrame(loop);

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
