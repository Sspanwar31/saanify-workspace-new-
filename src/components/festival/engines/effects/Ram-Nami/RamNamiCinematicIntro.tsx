'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
  imageUrl?: string;
}

// ============ EASING & MATH ============
const easeInCubic = (t: number) => t * t * t;
const smoothstep = (a: number, b: number, t: number) => {
  if (b === a) return t < a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));

// ============ PARTICLE SYSTEM ============
type PType = 'dust' | 'petal' | 'sparkle' | 'smoke';

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
        rot: 0, rotSpd: 0,
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
    let birdsSpawned = false; // 🚀 FIXED: Added missing variable declaration
    let handoverTriggered = false;
    let lastSampleTime = 0;

    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

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
      const cx = W / 2, cy = H * 0.52;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.85);
      const ir = Math.floor(lerp(8, 65, reveal));
      const ig = Math.floor(lerp(4, 25, reveal));
      const ib = Math.floor(lerp(2, 10, reveal));
      grad.addColorStop(0, `rgb(${ir},${ig},${ib})`);
      grad.addColorStop(0.5, `rgb(${Math.floor(ir * 0.35)},${Math.floor(ig * 0.25)},${Math.floor(ib * 0.15)})`);
      grad.addColorStop(1, '#020104');
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

    // ============ NOBLE COURT & DARBAR SILHOUETTES ============

    function drawDarbarPillars(s: number, vis: number) {
      ctx.save();
      ctx.globalAlpha = vis * 0.45;
      ctx.fillStyle = '#060305';
      ctx.strokeStyle = `rgba(255, 160, 70, ${0.15 * vis})`;
      ctx.lineWidth = 1;

      const pillarW = 28 * s;
      const positions = [-1.8, -1.2, 1.2, 1.8];
      for (const pos of positions) {
        const px = W / 2 + pos * 110 * s - pillarW / 2;
        ctx.fillRect(px, 0, pillarW, H);
        ctx.strokeRect(px, 0, pillarW, H);
      }

      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.4, 180 * s, 180 * s, 0, Math.PI, 0);
      ctx.strokeStyle = `rgba(255, 150, 60, ${0.12 * vis})`;
      ctx.lineWidth = 4 * s;
      ctx.stroke();
      ctx.restore();
    }

    function drawSinghasan(cx: number, cy: number, s: number, vis: number, t: number) {
      ctx.save();
      ctx.globalAlpha = vis;
      
      const flicker = 0.9 + 0.1 * Math.sin(t * 8);

      ctx.lineWidth = 3 * s;
      ctx.strokeStyle = `rgba(180, 110, 30, ${0.85 * flicker})`;
      ctx.beginPath();
      ctx.arc(cx, cy + 10 * s, 85 * s, Math.PI, 0, false);
      ctx.stroke();

      const goldGrad = ctx.createLinearGradient(cx - 70 * s, cy, cx + 70 * s, cy);
      goldGrad.addColorStop(0, '#8c5315');
      goldGrad.addColorStop(0.3, '#dfb55c');
      goldGrad.addColorStop(0.5, '#fff4cb');
      goldGrad.addColorStop(0.7, '#dfb55c');
      goldGrad.addColorStop(1, '#8c5315');

      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 7 * s;
      ctx.beginPath();
      ctx.arc(cx, cy + 10 * s, 70 * s, Math.PI * 1.05, -Math.PI * 0.05, false);
      ctx.stroke();

      ctx.fillStyle = '#2d0406';
      ctx.beginPath();
      ctx.arc(cx, cy + 20 * s, 62 * s, Math.PI, 0, false);
      ctx.lineTo(cx + 62 * s, cy + 85 * s);
      ctx.lineTo(cx - 62 * s, cy + 85 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 190, 80, ${0.45 * flicker})`;
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();

      ctx.fillStyle = '#b38230';
      ctx.beginPath();
      ctx.arc(cx - 74 * s, cy + 60 * s, 10 * s, 0, Math.PI * 2);
      ctx.arc(cx + 74 * s, cy + 60 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f0709';
      ctx.strokeStyle = `rgba(255, 175, 70, ${0.35 * flicker})`;
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.rect(cx - 95 * s, cy + 85 * s, 190 * s, 25 * s);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function drawLordRamaSilhouette(cx: number, cy: number, s: number, vis: number, t: number) {
      ctx.save();
      ctx.globalAlpha = vis;

      const glow = Math.sin(t * 8) * 0.06;
      ctx.shadowBlur = (25 + glow * 50) * s;
      ctx.shadowColor = `rgba(255, 170, 60, ${0.85 + glow})`;

      ctx.fillStyle = '#060305';
      ctx.beginPath();
      
      ctx.moveTo(cx - 52 * s, cy + 85 * s);
      ctx.bezierCurveTo(cx - 65 * s, cy + 85 * s, cx - 74 * s, cy + 70 * s, cx - 50 * s, cy + 64 * s); 
      ctx.bezierCurveTo(cx - 40 * s, cy + 60 * s, cx - 35 * s, cy + 50 * s, cx - 35 * s, cy + 30 * s); 
      ctx.bezierCurveTo(cx - 35 * s, cy + 18 * s, cx - 22 * s, cy - 10 * s, cx - 18 * s, cy - 20 * s); 
      ctx.lineTo(cx - 5 * s, cy - 24 * s);
      ctx.bezierCurveTo(cx - 8 * s, cy - 29 * s, cx - 8 * s, cy - 35 * s, cx - 6 * s, cy - 39 * s); 
      ctx.bezierCurveTo(cx - 10 * s, cy - 42 * s, cx - 8 * s, cy - 48 * s, cx - 4 * s, cy - 48 * s); 
      ctx.lineTo(cx - 6 * s, cy - 54 * s);
      ctx.lineTo(cx - 12 * s, cy - 56 * s);
      ctx.lineTo(cx, cy - 78 * s); 
      ctx.lineTo(cx + 12 * s, cy - 56 * s);
      ctx.lineTo(cx + 6 * s, cy - 54 * s);
      ctx.lineTo(cx + 4 * s, cy - 48 * s);
      ctx.bezierCurveTo(cx + 8 * s, cy - 48 * s, cx + 10 * s, cy - 42 * s, cx + 6 * s, cy - 39 * s);
      ctx.bezierCurveTo(cx + 8 * s, cy - 35 * s, cx + 8 * s, cy - 29 * s, cx + 5 * s, cy - 24 * s); 
      ctx.lineTo(cx + 18 * s, cy - 20 * s); 
      ctx.bezierCurveTo(cx + 22 * s, cy - 10 * s, cx + 35 * s, cy + 18 * s, cx + 35 * s, cy + 30 * s);
      ctx.bezierCurveTo(cx + 35 * s, cy + 50 * s, cx + 40 * s, cy + 60 * s, cx + 50 * s, cy + 64 * s); 
      ctx.bezierCurveTo(cx + 74 * s, cy + 70 * s, cx + 65 * s, cy + 85 * s, cx + 52 * s, cy + 85 * s);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 195, 90, ${0.75 + glow})`;
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 15 * s, cy - 12 * s);
      ctx.quadraticCurveTo(cx - 18 * s, cy - 20 * s, cx - 6 * s, cy - 39 * s);
      ctx.lineTo(cx - 12 * s, cy - 56 * s);
      ctx.lineTo(cx, cy - 78 * s);
      ctx.lineTo(cx + 12 * s, cy - 56 * s);
      ctx.lineTo(cx + 6 * s, cy - 39 * s);
      ctx.quadraticCurveTo(cx + 18 * s, cy - 20 * s, cx + 15 * s, cy - 12 * s);
      ctx.stroke();

      ctx.strokeStyle = '#060305';
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.arc(cx - 45 * s, cy + 25 * s, 90 * s, -Math.PI * 0.7, -Math.PI * 0.1, false);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 180, 80, ${0.4 * vis})`;
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      ctx.restore();
    }

    function drawHanumanSilhouette(cx: number, cy: number, s: number, vis: number, t: number) {
      ctx.save();
      ctx.globalAlpha = vis;

      const flicker = Math.sin(t * 8) * 0.05;
      ctx.shadowBlur = (20 + flicker * 40) * s;
      ctx.shadowColor = `rgba(255, 160, 60, ${0.75 + flicker})`;

      const hx = cx + 80 * s;
      const hy = cy + 85 * s;

      ctx.fillStyle = '#060305';
      ctx.beginPath();
      ctx.moveTo(hx + 30 * s, hy);
      ctx.bezierCurveTo(hx + 35 * s, hy, hx + 32 * s, hy - 20 * s, hx + 22 * s, hy - 32 * s); 
      ctx.bezierCurveTo(hx + 18 * s, hy - 40 * s, hx + 18 * s, hy - 50 * s, hx + 8 * s, hy - 56 * s); 
      ctx.bezierCurveTo(hx - 2 * s, hy - 60 * s, hx - 5 * s, hy - 66 * s, hx - 4 * s, hy - 72 * s); 
      ctx.lineTo(hx - 6 * s, hy - 80 * s);
      ctx.lineTo(hx - 1 * s, hy - 84 * s);
      ctx.lineTo(hx + 2 * s, hy - 72 * s);
      ctx.bezierCurveTo(hx - 3 * s, hy - 68 * s, hx - 12 * s, hy - 68 * s, hx - 10 * s, hy - 60 * s); 
      ctx.lineTo(hx - 4 * s, hy - 56 * s); 
      ctx.bezierCurveTo(hx - 12 * s, hy - 52 * s, hx - 22 * s, hy - 44 * s, hx - 28 * s, hy - 34 * s); 
      ctx.bezierCurveTo(hx - 22 * s, hy - 30 * s, hx - 10 * s, hy - 36 * s, hx - 2 * s, hy - 40 * s); 
      ctx.bezierCurveTo(hx - 4 * s, hy - 25 * s, hx - 6 * s, hy - 5 * s, hx - 18 * s, hy); 
      ctx.lineTo(hx + 30 * s, hy);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#060305';
      ctx.lineWidth = 3.5 * s;
      ctx.beginPath();
      ctx.moveTo(hx + 22 * s, hy - 10 * s);
      ctx.bezierCurveTo(hx + 45 * s, hy - 18 * s, hx + 50 * s, hy - 65 * s, hx + 36 * s, hy - 70 * s);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 175, 70, ${0.65 + flicker})`;
      ctx.lineWidth = 1 * s;
      ctx.stroke();

      ctx.restore();
    }

    // ============ ATMOSPHERIC ENVIRONMENT & DETAILS ============

    function drawCourtroomVisuals(t: number) {
      const reveal = smoothstep(4.0, 7.5, t);
      const fade = smoothstep(16, 17.5, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);
      const s = Math.min(W, H) * 0.0011;
      const cx = W * 0.5;
      const cy = H * 0.52;

      drawDarbarPillars(s, vis);
      drawSinghasan(cx, cy, s, vis, t);
      drawLordRamaSilhouette(cx, cy, s, vis, t);
      drawHanumanSilhouette(cx, cy, s, vis, t);
    }

    function drawDiyas(t: number) {
      const reveal = smoothstep(6.5, 9, t);
      const fade = smoothstep(16, 17.5, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0) return;

      const s = Math.min(W, H) * 0.0011;
      const positions = [
        { x: W * 0.15, y: H * 0.85 },
        { x: W * 0.85, y: H * 0.85 },
        { x: W * 0.08, y: H * 0.9 },
        { x: W * 0.92, y: H * 0.9 },
      ];

      ctx.save();
      ctx.globalAlpha = vis;

      positions.forEach((pos, i) => {
        const flamePulse = Math.sin(t * 12 + i * 2.3) * 1.5 + Math.cos(t * 7 + i * 1.5) * 0.8;
        const baseW = 32 * s;
        const baseH = 14 * s;

        const brassGrad = ctx.createLinearGradient(pos.x - baseW, pos.y, pos.x + baseW, pos.y);
        brassGrad.addColorStop(0, '#5e380f');
        brassGrad.addColorStop(0.5, '#dfb55c');
        brassGrad.addColorStop(1, '#5e380f');
        ctx.fillStyle = brassGrad;
        ctx.beginPath();
        ctx.moveTo(pos.x - baseW / 2, pos.y);
        ctx.bezierCurveTo(pos.x - baseW * 0.6, pos.y + baseH, pos.x + baseW * 0.6, pos.y + baseH, pos.x + baseW / 2, pos.y);
        ctx.lineTo(pos.x, pos.y + 3 * s);
        ctx.closePath();
        ctx.fill();

        const flameH = (22 + flamePulse) * s;
        const flameW = 8 * s;
        const fGrad = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y - flameH);
        fGrad.addColorStop(0, 'rgba(255, 60, 0, 0.9)');
        fGrad.addColorStop(0.5, 'rgba(255, 150, 20, 0.95)');
        fGrad.addColorStop(0.9, 'rgba(255, 235, 170, 0.99)');
        fGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = fGrad;

        ctx.beginPath();
        ctx.moveTo(pos.x - flameW / 2, pos.y - 1);
        ctx.quadraticCurveTo(pos.x - flameW * 0.8, pos.y - flameH * 0.45, pos.x, pos.y - flameH);
        ctx.quadraticCurveTo(pos.x + flameW * 0.8, pos.y - flameH * 0.45, pos.x + flameW / 2, pos.y - 1);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const glowR = (50 + flamePulse * 3) * s;
        const gGrad = ctx.createRadialGradient(pos.x, pos.y - flameH * 0.5, 0, pos.x, pos.y - flameH * 0.5, glowR);
        gGrad.addColorStop(0, 'rgba(255, 140, 50, 0.28)');
        gGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - flameH * 0.5, glowR, 0, Math.PI * 2);
        ctx.fill();
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
            p.life = 0; p.x = Math.random() * W; p.y = H + 20; p.alpha = 0;
          }
        } else if (p.type === 'petal') {
          p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.012) * 0.35;
          p.y += p.vy;
          p.rot += p.rotSpd * dt;
          const lr = p.life / p.maxLife;
          p.alpha = smoothstep(0, 0.12, lr) * 0.85 * (1 - smoothstep(16, 17.5, t));
          if (p.y > H + 30 || p.life > p.maxLife) pool.release(p);
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
        }
      }
      ctx.restore();
    }

    function drawTitle(t: number) {
      if (t < 8.5) return;
      const intensity = smoothstep(8.5, 10, t) * (1 - smoothstep(12, 14, t));
      if (intensity <= 0.01) return;
      const fontSize = Math.min(W * 0.12, 125);
      const cy = H * 0.36;
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
      drawCitySilhouette(t);
      drawCourtroomVisuals(t);
      drawDiyas(t);
      drawFogAndHaze(t);
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
    window.addEventListener('resize', resize);
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
