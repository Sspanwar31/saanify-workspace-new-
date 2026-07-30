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

// ============ PARTICLE POOL ============
type PType = 'dust' | 'petal' | 'text' | 'bird';

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

export default function RamNamiCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep ref up to date to prevent closure capture issues
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

    // Offscreen canvases for bloom & texture effects
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    // Pre-rendered radial sprites for optimal rendering performance
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
    const dustSprite = makeSprite(32, 'rgba(255,220,150,1)', 'rgba(255,140,40,0.4)');
    const sparkSprite = makeSprite(32, 'rgba(255,250,220,1)', 'rgba(255,180,80,0.4)');

    const pool = new ParticlePool(1200);
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
        d[i + 3] = 20;
      }
      gctx.putImageData(id, 0, 0);
    }

    function sampleText() {
      // Dynamic fallback rendering of Devanagari text
      const tc = document.createElement('canvas');
      const tctx = tc.getContext('2d')!;
      const fontSize = Math.min(W * 0.13, 140);
      tc.width = Math.floor(W);
      tc.height = Math.floor(fontSize * 2);
      tctx.fillStyle = 'white';
      tctx.font = `700 ${fontSize}px "Noto Sans Devanagari", "Mangal", "Nirmala UI", "Arial Unicode MS", sans-serif`;
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
      const cx = W / 2, cy = H * 0.62;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.9);
      const ir = Math.floor(lerp(6, 75, reveal));
      const ig = Math.floor(lerp(3, 32, reveal));
      const ib = Math.floor(lerp(10, 22, reveal));
      grad.addColorStop(0, `rgb(${ir},${ig},${ib})`);
      grad.addColorStop(0.4, `rgb(${Math.floor(ir * 0.4)},${Math.floor(ig * 0.3)},${Math.floor(ib * 0.6)})`);
      grad.addColorStop(1, '#020104');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function drawSunrise(t: number) {
      const reveal = smoothstep(1.8, 4.5, t);
      const fade = smoothstep(16, 17.5, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);
      const sx = W * 0.5;
      const sy = H * 0.62 - reveal * H * 0.04;
      const sunR = W * 0.18;
      const sunGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sunR);
      sunGrad.addColorStop(0, `rgba(255, 235, 170, ${0.85 * vis})`);
      sunGrad.addColorStop(0.15, `rgba(255, 190, 90, ${0.55 * vis})`);
      sunGrad.addColorStop(0.45, `rgba(220, 110, 30, ${0.18 * vis})`);
      sunGrad.addColorStop(1, 'rgba(80, 30, 10, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, W, H);
      drawGodRays(sx, sy, t, vis);
    }

    function drawGodRays(cx: number, cy: number, t: number, intensity: number) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rayCount = 28;
      const maxLen = Math.max(W, H) * 1.3;
      for (let i = 0; i < rayCount; i++) {
        const baseAngle = (i / rayCount) * Math.PI * 2;
        const angle = baseAngle + t * 0.03 + Math.sin(t * 0.4 + i * 0.7) * 0.04;
        const len = maxLen * (0.55 + 0.45 * Math.sin(t * 0.6 + i * 1.9));
        const flicker = 0.5 + 0.5 * Math.sin(t * 1.2 + i * 2.3);
        const a = 0.07 * intensity * flicker;
        if (a < 0.005) continue;
        const ex = cx + Math.cos(angle) * len;
        const ey = cy + Math.sin(angle) * len;
        const grad = ctx.createLinearGradient(cx, cy, ex, ey);
        grad.addColorStop(0, `rgba(255, 210, 130, ${a})`);
        grad.addColorStop(0.4, `rgba(255, 170, 70, ${a * 0.6})`);
        grad.addColorStop(1, 'rgba(255, 130, 40, 0)');
        ctx.fillStyle = grad;
        const w = 0.035 + Math.sin(t * 0.5 + i * 2.1) * 0.015;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle - w) * len, cy + Math.sin(angle - w) * len);
        ctx.lineTo(cx + Math.cos(angle + w) * len, cy + Math.sin(angle + w) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawCitySilhouette(t: number) {
      const reveal = smoothstep(2, 4.5, t);
      const fade = smoothstep(16, 17.5, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);
      ctx.save();
      ctx.globalAlpha = vis * 0.85;
      ctx.fillStyle = '#0a0508';
      const baseY = H * 0.74;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, baseY);
      const buildings = [
        [0.02, 0.05, 0.04, 0], [0.08, 0.06, 0.06, 1], [0.15, 0.04, 0.04, 0],
        [0.20, 0.06, 0.07, 1], [0.27, 0.04, 0.035, 0], [0.32, 0.03, 0.05, 1],
        [0.66, 0.04, 0.045, 0], [0.71, 0.06, 0.06, 1], [0.78, 0.04, 0.035, 0],
        [0.83, 0.07, 0.055, 1], [0.91, 0.05, 0.045, 0], [0.97, 0.03, 0.04, 0]
      ];
      for (const [bx, bw, bh, ty] of buildings) {
        const px = bx * W, pw = bw * W, ph = bh * H;
        ctx.lineTo(px, baseY);
        ctx.lineTo(px, baseY - ph);
        if (ty === 1) {
          ctx.lineTo(px + pw / 2, baseY - ph - pw * 0.4);
          ctx.lineTo(px + pw, baseY - ph);
        } else {
          ctx.lineTo(px + pw, baseY - ph);
        }
      }
      ctx.lineTo(W, baseY);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawTemple(t: number) {
      const edge = smoothstep(4, 6, t);
      const full = smoothstep(10, 12, t);
      const fade = smoothstep(16, 17.5, t);
      if (edge <= 0 && full <= 0) return;
      const vis = 1 - fade;
      const cx = W * 0.5;
      const baseY = H * 0.85;
      const s = Math.min(W, H) * 0.0011;
      ctx.save();
      ctx.globalAlpha = vis;
      drawTempleStructure(cx, baseY, s, t, edge, full);
      ctx.restore();
    }

    function drawTempleStructure(cx: number, baseY: number, s: number, t: number, edge: number, full: number) {
      const platColor = 'rgba(16, 9, 5, 0.95)';
      const edgeColor = `rgba(255, 180, 90, ${edge * 0.7 + full * 0.3})`;
      ctx.fillStyle = platColor;
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1.2;

      // Three-tier platform
      const platW = 420 * s;
      const tierDefs = [
        { w: platW, h: 25 * s },
        { w: platW * 0.85, h: 20 * s },
        { w: platW * 0.75, h: 20 * s }
      ];
      let curY = baseY;
      for (const tier of tierDefs) {
        ctx.beginPath();
        ctx.rect(cx - tier.w / 2, curY - tier.h, tier.w, tier.h);
        ctx.fill();
        ctx.stroke();
        curY -= tier.h;
      }
      const platTop = curY;

      // Mandapa (main hall)
      const mandaW = 300 * s;
      const mandaH = 110 * s;
      ctx.beginPath();
      ctx.rect(cx - mandaW / 2, platTop - mandaH, mandaW, mandaH);
      ctx.fill();
      ctx.stroke();

      // Three arches on mandapa
      for (let i = -1; i <= 1; i++) {
        const ax = cx + i * 85 * s;
        const ay = platTop - mandaH * 0.25;
        const aw = 38 * s;
        const ah = 65 * s;
        ctx.beginPath();
        ctx.moveTo(ax - aw / 2, ay + ah);
        ctx.lineTo(ax - aw / 2, ay + aw / 2);
        ctx.arc(ax, ay + aw / 2, aw / 2, Math.PI, 0, false);
        ctx.lineTo(ax + aw / 2, ay + ah);
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fill();
        ctx.strokeStyle = edgeColor;
        ctx.stroke();
        ctx.fillStyle = platColor;
      }

      // Main central shikhara
      const mainBaseY = platTop - mandaH;
      drawShikhara(cx, mainBaseY, 200 * s, 380 * s, 9, edge, full, true, s);

      // Side shikharas
      drawShikhara(cx - 150 * s, platTop - 40 * s, 95 * s, 200 * s, 6, edge, full, false, s);
      drawShikhara(cx + 150 * s, platTop - 40 * s, 95 * s, 200 * s, 6, edge, full, false, s);

      // Corner small spires
      drawShikhara(cx - 200 * s, platTop - 10 * s, 50 * s, 110 * s, 4, edge, full, false, s);
      drawShikhara(cx + 200 * s, platTop - 10 * s, 50 * s, 110 * s, 4, edge, full, false, s);

      // Flag pole rising from main shikhara top
      const mainTop = mainBaseY - 380 * s;
      ctx.strokeStyle = `rgba(190, 140, 70, ${edge * 0.8 + full * 0.4})`;
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      ctx.moveTo(cx, mainTop);
      ctx.lineTo(cx, mainTop - 70 * s);
      ctx.stroke();

      // Kalasha (sacred finial pot)
      ctx.fillStyle = `rgba(255, 200, 100, ${edge * 0.9 + full * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, mainTop - 75 * s, 7 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 240, 180, ${(edge + full) * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx - 2 * s, mainTop - 77 * s, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawShikhara(cx: number, baseY: number, baseW: number, height: number, tiers: number, edge: number, full: number, isMain: boolean, s: number) {
      const topY = baseY - height;
      const topW = baseW * 0.18;

      ctx.fillStyle = 'rgba(16, 9, 5, 0.95)';
      ctx.beginPath();
      ctx.moveTo(cx - baseW / 2, baseY);
      ctx.bezierCurveTo(
        cx - baseW / 2, baseY - height * 0.35,
        cx - topW / 2 - baseW * 0.1, baseY - height * 0.78,
        cx - topW / 2, topY
      );
      ctx.lineTo(cx + topW / 2, topY);
      ctx.bezierCurveTo(
        cx + topW / 2 + baseW * 0.1, baseY - height * 0.78,
        cx + baseW / 2, baseY - height * 0.35,
        cx + baseW / 2, baseY
      );
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 180, 90, ${edge * 0.75 + full * 0.25})`;
      ctx.lineWidth = isMain ? 1.4 : 1;
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 165, 75, ${edge * 0.5 + full * 0.3})`;
      ctx.lineWidth = 0.7;
      for (let i = 1; i < tiers; i++) {
        const f = i / tiers;
        const y = baseY - height * f;
        const w = lerp(baseW, topW, easeInCubic(f));
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, y);
        ctx.lineTo(cx + w / 2, y);
        ctx.stroke();
      }

      if (isMain) {
        ctx.strokeStyle = `rgba(255, 150, 60, ${edge * 0.4 + full * 0.25})`;
        ctx.lineWidth = 0.6;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          const xo = i * baseW * 0.25;
          ctx.moveTo(cx + xo, baseY);
          ctx.quadraticCurveTo(cx + xo * 0.5, baseY - height * 0.5, cx + xo * 0.15, topY);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(18, 10, 6, 0.95)';
        ctx.beginPath();
        ctx.moveTo(cx - topW * 0.6, topY);
        ctx.lineTo(cx, topY - 20 * s);
        ctx.lineTo(cx + topW * 0.6, topY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 180, 90, ${edge * 0.7 + full * 0.3})`;
        ctx.stroke();
      }
    }

    function drawFlag(t: number) {
      const reveal = smoothstep(6, 8, t);
      const fade = smoothstep(16, 17.5, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0) return;

      const cx = W * 0.5;
      const baseY = H * 0.85;
      const s = Math.min(W, H) * 0.0011;
      const platH = (25 + 20 + 20) * s;
      const mandaH = 110 * s;
      const shikharaH = 380 * s;
      const mainTop = baseY - platH - mandaH - shikharaH;
      const poleTop = mainTop - 70 * s;

      ctx.save();
      ctx.globalAlpha = vis;

      const poleW = 3 * s;
      const poleGrad = ctx.createLinearGradient(cx - poleW, 0, cx + poleW, 0);
      poleGrad.addColorStop(0, '#2a1a08');
      poleGrad.addColorStop(0.4, '#7a5a28');
      poleGrad.addColorStop(0.5, '#d4a850');
      poleGrad.addColorStop(0.6, '#7a5a28');
      poleGrad.addColorStop(1, '#2a1a08');
      ctx.fillStyle = poleGrad;
      ctx.fillRect(cx - poleW / 2, poleTop, poleW, 70 * s);

      ctx.fillStyle = '#e8b850';
      ctx.beginPath();
      ctx.arc(cx, poleTop, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
      ctx.beginPath();
      ctx.arc(cx - 1 * s, poleTop - 1 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();

      const flagW = 90 * s;
      const flagH = 55 * s;
      const unfurl = smoothstep(6, 8, t);
      const wind = Math.sin(t * 0.7) * 0.4 + Math.sin(t * 1.9 + 1) * 0.2;
      const segs = 18;
      const rows = 6;

      for (let row = 0; row < rows; row++) {
        for (let seg = 0; seg < segs; seg++) {
          const u1 = seg / segs;
          const u2 = (seg + 1) / segs;
          const v1 = row / rows;
          const v2 = (row + 1) / rows;
          if (u1 > unfurl) continue;
          const u2c = Math.min(u2, unfurl);
          const x1 = cx + u1 * flagW;
          const x2 = cx + u2c * flagW;
          const wave1 = Math.sin(u1 * Math.PI * 2.5 + t * 2.5) * 7 * s * u1;
          const wave2 = Math.sin(u2c * Math.PI * 2.5 + t * 2.5) * 7 * s * u2c;
          const lift1 = (1 - v1) * Math.sin(u1 * Math.PI) * wind * 4 * s;
          const lift2 = (1 - v1) * Math.sin(u2c * Math.PI) * wind * 4 * s;
          const y1T = poleTop + v1 * flagH + wave1 + lift1;
          const y2T = poleTop + v1 * flagH + wave2 + lift2;
          const y1B = poleTop + v2 * flagH + wave1 * 0.95 + lift1 * 0.95;
          const y2B = poleTop + v2 * flagH + wave2 * 0.95 + lift2 * 0.95;
          const shade = 0.6 + 0.4 * Math.sin(u1 * Math.PI * 2.5 + t * 2.5 + v1 * Math.PI);
          const r = Math.floor(230 * shade);
          const g = Math.floor(110 * shade);
          const b = Math.floor(30 * shade);
          ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
          ctx.beginPath();
          ctx.moveTo(x1, y1T);
          ctx.lineTo(x2, y2T);
          ctx.lineTo(x2, y2B);
          ctx.lineTo(x1, y1B);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawFog(t: number) {
      const intensity = smoothstep(2, 5, t) * (1 - smoothstep(16, 17.5, t));
      if (intensity <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let layer = 0; layer < 3; layer++) {
        const y = H * (0.68 + layer * 0.04);
        const speed = 8 + layer * 6;
        const offset = (t * speed + layer * 137) % (W * 1.5);
        const grad = ctx.createLinearGradient(0, y - 40, 0, y + 100);
        const a = 0.07 * intensity * (1 - layer * 0.2);
        grad.addColorStop(0, 'rgba(190, 140, 80, 0)');
        grad.addColorStop(0.4, `rgba(190, 140, 80, ${a})`);
        grad.addColorStop(0.6, `rgba(160, 100, 60, ${a * 0.8})`);
        grad.addColorStop(1, 'rgba(140, 80, 40, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-offset, y - 40, W * 2.5, 140);
      }
      ctx.restore();
    }

    function drawBellPulse(t: number) {
      const pulses = [
        { time: 8, intensity: 1 },
        { time: 13, intensity: 0.7 },
        { time: 13.6, intensity: 0.5 },
        { time: 14.2, intensity: 0.4 }
      ];
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const cx = W * 0.5, cy = H * 0.62;
      for (const p of pulses) {
        const dt = t - p.time;
        if (dt < 0 || dt > 1.8) continue;
        const f = dt / 1.8;
        const r = f * W * 0.7;
        const a = (1 - f) * 0.12 * p.intensity * (1 - smoothstep(16, 17.5, t));
        if (a <= 0) continue;
        const grad = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r);
        grad.addColorStop(0, 'rgba(255, 200, 100, 0)');
        grad.addColorStop(0.7, `rgba(255, 200, 100, ${a})`);
        grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // ============ PARTICLE LOGIC ============

    function spawnDust(t: number) {
      const target = Math.floor(70 * smoothstep(0, 3, t));
      let count = 0;
      for (const p of pool.particles) if (p.active && p.type === 'dust') count++;
      let attempts = 0;
      while (count < target && attempts < 8) {
        const p = pool.spawn();
        if (!p) break;
        p.type = 'dust';
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = -0.05 - Math.random() * 0.35;
        p.size = 0.6 + Math.random() * 1.6;
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
      const intensity = smoothstep(4, 6, t) * (1 - smoothstep(16, 17.5, t));
      if (intensity <= 0) return;
      if (Math.random() > intensity * 0.4) return;
      const p = pool.spawn();
      if (!p) return;
      p.type = 'petal';
      p.x = Math.random() * W;
      p.y = -20;
      p.vx = (Math.random() - 0.5) * 0.8;
      p.vy = 0.4 + Math.random() * 0.7;
      p.size = 5 + Math.random() * 6;
      p.maxLife = 20;
      p.life = 0;
      p.alpha = 0;
      p.rot = Math.random() * Math.PI * 2;
      p.rotSpd = (Math.random() - 0.5) * 2.5;
    }

    function spawnTextParticles(t: number) {
      if (t < 7.5 || t > 9.5) return;
      if (ramPoints.length === 0) return;
      const target = Math.min(ramPoints.length, 700);
      let active = 0;
      for (const p of pool.particles) if (p.active && p.type === 'text') active++;
      let attempts = 0;
      while (active < target && attempts < 10) {
        const p = pool.spawn();
        if (!p) break;
        const pt = ramPoints[Math.floor(Math.random() * ramPoints.length)];
        p.type = 'text';
        p.x = W / 2 + (Math.random() - 0.5) * W * 1.4;
        p.y = H * 0.4 + (Math.random() - 0.5) * H * 1.2;
        p.tx = W / 2 + pt.x;
        p.ty = H * 0.4 + pt.y;
        p.vx = 0; p.vy = 0;
        p.size = 1.2 + Math.random() * 1.6;
        p.maxLife = 8;
        p.life = 0;
        p.alpha = 0;
        p.delay = Math.random() * 1.2;
        active++;
        attempts++;
      }
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
          p.vx += (Math.random() - 0.5) * 0.04;
          p.vy += -0.003;
          p.rot += p.rotSpd * dt;
          const lr = p.life / p.maxLife;
          const fadeIn = smoothstep(0, 0.3, lr);
          const fadeOut = 1 - smoothstep(0.7, 1, lr);
          const env = smoothstep(0, 2, t) * (1 - smoothstep(16, 17.5, t));
          p.alpha = fadeIn * fadeOut * 0.7 * env;
          if (p.life > p.maxLife || p.y < -30) {
            p.life = 0;
            p.x = Math.random() * W;
            p.y = H + 20;
            p.alpha = 0;
          }
        } else if (p.type === 'petal') {
          p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.01) * 0.4;
          p.y += p.vy;
          p.rot += p.rotSpd * dt;
          const lr = p.life / p.maxLife;
          p.alpha = smoothstep(0, 0.1, lr) * 0.85 * (1 - smoothstep(16, 17.5, t));
          if (p.y > H + 30 || p.life > p.maxLife) pool.release(p);
        } else if (p.type === 'text') {
          if (p.delay > 0) {
            p.delay -= dt;
            p.alpha = 0;
            continue;
          }
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.5) {
            const speed = clamp(dist * 4, 80, 500);
            p.vx = (dx / dist) * speed;
            p.vy = (dy / dist) * speed;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha = clamp(p.alpha + dt * 1.5, 0, 0.7);
          } else {
            p.x = p.tx + Math.sin(t * 4 + p.idx) * 0.4;
            p.y = p.ty + Math.cos(t * 4 + p.idx * 1.3) * 0.4;
            p.alpha = clamp(p.alpha + dt * 2, 0, 1);
          }
          if (t > 12) p.alpha *= 1 - smoothstep(12, 14, t);
          if (t > 14.5 && p.alpha < 0.01) pool.release(p);
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
          const sz = p.size * 6;
          ctx.drawImage(dustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
        } else if (p.type === 'text') {
          ctx.globalAlpha = p.alpha;
          const sz = p.size * 5;
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
          ctx.fillStyle = `rgba(240, 140, 70, ${p.alpha})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
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
      const fontSize = Math.min(W * 0.13, 140);
      const cy = H * 0.4;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${fontSize}px "Noto Sans Devanagari", "Mangal", "Nirmala UI", sans-serif`;

      ctx.globalCompositeOperation = 'screen';
      const haloGrad = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, fontSize * 2.2);
      haloGrad.addColorStop(0, `rgba(255, 200, 100, ${0.18 * intensity})`);
      haloGrad.addColorStop(0.4, `rgba(255, 150, 50, ${0.08 * intensity})`);
      haloGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(W / 2, cy);
      const rayCount = 18;
      for (let i = 0; i < rayCount; i++) {
        const a = (i / rayCount) * Math.PI * 2 + t * 0.06;
        const len = fontSize * 1.8 + Math.sin(t * 1.5 + i) * fontSize * 0.3;
        const flicker = 0.6 + 0.4 * Math.sin(t * 2 + i * 1.7);
        const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        grad.addColorStop(0, `rgba(255, 200, 100, ${0.12 * intensity * flicker})`);
        grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.04) * len, Math.sin(a - 0.04) * len);
        ctx.lineTo(Math.cos(a + 0.04) * len, Math.sin(a + 0.04) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255, 220, 140, ${0.03 * intensity})`;
      ctx.fillText('श्री राम', W / 2, cy);
      ctx.restore();
    }

    function drawGreeting(t: number) {
      const reveal = smoothstep(13, 14.5, t);
      const fade = smoothstep(16, 17.5, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0.01) return;
      const fontSize = Math.min(W * 0.058, 56);
      const cy = H * 0.6;
      const line1 = 'राम नवमी की';
      const line2 = 'हार्दिक शुभकामनाएँ';
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${fontSize}px "Noto Sans Devanagari", "Mangal", "Nirmala UI", sans-serif`;

      ctx.globalCompositeOperation = 'screen';
      const haloGrad = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, fontSize * 4);
      haloGrad.addColorStop(0, `rgba(255, 180, 80, ${0.12 * vis})`);
      haloGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'source-over';
      const y1 = cy - fontSize * 0.65;
      const y2 = cy + fontSize * 0.65;

      ctx.shadowBlur = 30;
      ctx.shadowColor = `rgba(255, 170, 70, ${vis})`;
      ctx.fillStyle = `rgba(180, 100, 30, ${vis * 0.5})`;
      ctx.fillText(line1, W / 2, y1);
      ctx.fillText(line2, W / 2, y2);
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(255, 200, 100, ${vis})`;
      ctx.fillStyle = `rgba(220, 150, 60, ${vis * 0.7})`;
      ctx.fillText(line1, W / 2, y1);
      ctx.fillText(line2, W / 2, y2);
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(255, 230, 150, ${vis})`;
      ctx.fillStyle = `rgba(255, 225, 160, ${vis})`;
      ctx.fillText(line1, W / 2, y1);
      ctx.fillText(line2, W / 2, y2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255, 250, 220, ${vis * 0.5})`;
      ctx.fillText(line1, W / 2 - 0.5, y1 - 0.5);
      ctx.fillText(line2, W / 2 - 0.5, y2 - 0.5);
      ctx.restore();
    }

    // ============ POST-PROCESSING ============

    function applyBloom() {
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(6px) brightness(1.3)';
      bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.55;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.restore();
    }

    function applyColorGrade() {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(80, 35, 5, 0.18)');
      grad.addColorStop(0.5, 'rgba(40, 15, 5, 0.08)');
      grad.addColorStop(1, 'rgba(20, 5, 0, 0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function applyVignette(t: number) {
      const fade = smoothstep(16, 17.5, t);
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${0.55 + fade * 0.4})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.4;
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
      cam.zoom = 1 + smoothstep(0, 17.5, t) * 0.04;
      cam.rot = Math.sin(t * 0.13) * 0.004;
      cam.x = Math.sin(t * 0.28) * 4;
      cam.y = Math.cos(t * 0.22) * 3;
      const tiltUp = smoothstep(6, 8, t) * 8 - smoothstep(11, 15, t) * 8;
      cam.y -= tiltUp;
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
      spawnBirds(t);
      updateParticles(dt, t);
      updateCamera(t);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      applyCamera();
      drawBackground(t);
      drawSunrise(t);
      drawCitySilhouette(t);
      drawTemple(t);
      drawFlag(t);
      drawFog(t);
      drawBellPulse(t);
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

      // Smart dynamic re-sampling to catch late loaded web-fonts
      if (t > 4 && lastSampleTime === 0) {
        sampleText();
        lastSampleTime = t;
      }

      if (t < 9.7) birdsSpawned = false;

      // Dynamic Handover Trigger at the end of the transition (around 16.5-17.5s)
      if (t >= 16.5 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }

      if (t < 17.5) {
        render(t, dt);
      } else {
        // Hold pure black frame
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
