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
type PType = 'dust' | 'petal' | 'smoke' | 'bird';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; rot: number; rotSpd: number; flap: number; active: boolean;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', rot: 0, rotSpd: 0, flap: 0, active: false
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    p.active = true; p.life = 0; p.alpha = 0;
    return p;
  }
  release(p: Particle) {
    p.active = false;
    this.free.push(p.idx);
  }
}

// ============ REALISTIC FIREWORKS DATA STRUCTURES ============
interface FireworkRocket {
  x: number; y: number; vx: number; vy: number; ax: number; ay: number;
  targetY: number; color: string; color2: string; type: string;
  trail: { x: number; y: number; alpha: number; type: string }[];
  flicker: number; smokeTimer: number; sparkTimer: number;
}

interface FireworkSpark {
  x: number; y: number; vx: number; vy: number; color: string; color2: string;
  alpha: number; life: number; maxLife: number; size: number;
  gravity: number; drag: number; flicker: boolean; type: string;
  temp: number; rot: number; rotSpd: number; wind: number; turb: number;
  stage: number; delay: number; hasExploded: boolean; isSecondary: boolean;
}

interface FloatingDiya {
  x: number; y: number; scale: number; speed: number;
  phase: number; flamePulse: number;
}

export default function CinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;

    if (!document.getElementById('ram-mandir-google-font')) {
      const link = document.createElement('link');
      link.id = 'ram-mandir-google-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&display=swap';
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
    let birdsSpawned = false;
    let handoverTriggered = false;
    let screenFlash = 0;
    let cameraShake = 0;
    let lastRocketLaunchTime = 0;

    const reflectCanvas = document.createElement('canvas');
    const rctx = reflectCanvas.getContext('2d')!;
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
    const sparkSprite = makeSprite(64, 'rgba(255,250,220,1)', 'rgba(255,180,80,0.4)');

    const pool = new ParticlePool(1200);
    const cam = { x: 0, y: 0, zoom: 1, rot: 0 };
    let diyas: FloatingDiya[] = [];
    
    const rockets: FireworkRocket[] = [];
    const sparks: FireworkSpark[] = [];
    const activeFireworkBursts: { x: number; y: number; color: string; r: number; maxR: number; alpha: number; type: string }[] = [];

    const fwColors = [
      ['#ffaa00', '#ff3300'], ['#00e5ff', '#0055ff'], ['#ff00aa', '#aa00ff'],
      ['#ffd700', '#ffffff'], ['#00ff66', '#00aa00'], ['#ff0033', '#ffffff']
    ];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      
      reflectCanvas.width = Math.floor(W);
      reflectCanvas.height = Math.floor(H);
      bloom.width = Math.max(2, Math.floor(W / 2));
      bloom.height = Math.max(2, Math.floor(H / 2));
      grain.width = 256; grain.height = 256;
      generateGrain();
      initializeDiyas();
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

    function initializeDiyas() {
      diyas.length = 0;
      const count = 45;
      for (let i = 0; i < count; i++) {
        const progress = Math.random();
        const y = lerp(H * 0.64, H * 0.98, progress);
        const scale = lerp(0.15, 1.0, progress);
        diyas.push({
          x: Math.random() * W,
          y: y,
          scale,
          speed: lerp(2, 12, progress) * (Math.random() < 0.5 ? -1 : 1),
          phase: Math.random() * Math.PI * 2,
          flamePulse: Math.random() * 10,
        });
      }
    }

    // ============ SCENE 1: CINEMATIC NATURAL SUNRISE BACKGROUND ============

function drawBackground(t: number) {

  const reveal = smoothstep(0.0, 1.5, t);
  const fadeOut = smoothstep(17.0, 17.5, t);

  const vis = reveal * (1 - fadeOut);

  // Scene 1 sunrise strength
  const sunrise = smoothstep(0.0, 1.8, t);

  // --------------------------------------------------
  // NATURAL SKY GRADIENT
  // --------------------------------------------------

  const grad = ctx.createLinearGradient(
    0,
    0,
    0,
    H * 0.68
  );

  // Top — almost black / deep maroon
  grad.addColorStop(
    0.00,
    '#07050A'
  );

  // Upper sky
  grad.addColorStop(
    0.25,
    `rgb(
      ${Math.floor(lerp(7, 35, sunrise))},
      ${Math.floor(lerp(5, 13, sunrise))},
      ${Math.floor(lerp(12, 25, sunrise))}
    )`
  );

  // Middle warm atmosphere
  grad.addColorStop(
    0.52,
    `rgb(
      ${Math.floor(lerp(12, 95, sunrise))},
      ${Math.floor(lerp(7, 32, sunrise))},
      ${Math.floor(lerp(14, 18, sunrise))}
    )`
  );

  // Lower orange atmosphere
  grad.addColorStop(
    0.76,
    `rgb(
      ${Math.floor(lerp(18, 180, sunrise))},
      ${Math.floor(lerp(9, 70, sunrise))},
      ${Math.floor(lerp(12, 25, sunrise))}
    )`
  );

  // Horizon — IMPORTANT: never pure white
  grad.addColorStop(
    1.00,
    `rgb(
      ${Math.floor(lerp(22, 235, sunrise))},
      ${Math.floor(lerp(10, 105, sunrise))},
      ${Math.floor(lerp(12, 35, sunrise))}
    )`
  );

  ctx.fillStyle = grad;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  // --------------------------------------------------
  // SOFT HORIZON ATMOSPHERIC GLOW
  // --------------------------------------------------

  if (vis > 0.001) {

    const horizonGlow = ctx.createRadialGradient(
      W * 0.5,
      H * 0.62,
      0,
      W * 0.5,
      H * 0.62,
      Math.min(W, H) * 0.55
    );

    horizonGlow.addColorStop(
      0.00,
      `rgba(255, 190, 80, ${0.16 * vis})`
    );

    horizonGlow.addColorStop(
      0.20,
      `rgba(255, 135, 45, ${0.10 * vis})`
    );

    horizonGlow.addColorStop(
      0.45,
      `rgba(210, 70, 25, ${0.045 * vis})`
    );

    horizonGlow.addColorStop(
      0.75,
      `rgba(100, 30, 15, ${0.018 * vis})`
    );

    horizonGlow.addColorStop(
      1.00,
      'rgba(0,0,0,0)'
    );

    ctx.save();

    ctx.globalCompositeOperation = 'screen';

    ctx.fillStyle = horizonGlow;

    ctx.fillRect(
      0,
      H * 0.20,
      W,
      H * 0.65
    );

    ctx.restore();
  }

  // --------------------------------------------------
  // VERY SUBTLE SCREEN FLASH
  // --------------------------------------------------

  if (screenFlash > 0.01 && t < 6.8) {

    ctx.save();

    ctx.globalCompositeOperation = 'screen';

    ctx.fillStyle =
      `rgba(255, 210, 140, ${screenFlash * 0.12})`;

    ctx.fillRect(
      0,
      0,
      W,
      H
    );

    ctx.restore();
  }
}
   // ============ SCENE 1: NATURAL HALF SUN ============

function drawSun(t: number) {

  const reveal = smoothstep(0.35, 1.2, t);
  const fade = smoothstep(2.15, 3.0, t);

  const vis = reveal * (1 - fade);

  if (vis <= 0.001) return;

  const sx = W * 0.50;
  const sy = H * 0.62;

  // IMPORTANT:
  // Small realistic sun.
  // Do NOT use 0.22 here.
  const sunR =
    Math.min(W, H) * 0.065;

  ctx.save();

  ctx.globalCompositeOperation = 'screen';

  // --------------------------------------------------
  // LARGE SOFT ATMOSPHERIC GLOW
  // --------------------------------------------------

  const glowR =
    Math.min(W, H) * 0.42;

  const halo =
    ctx.createRadialGradient(
      sx,
      sy,
      0,
      sx,
      sy,
      glowR
    );

  halo.addColorStop(
    0.00,
    `rgba(255, 190, 80, ${0.20 * vis})`
  );

  halo.addColorStop(
    0.18,
    `rgba(255, 145, 45, ${0.12 * vis})`
  );

  halo.addColorStop(
    0.40,
    `rgba(235, 90, 25, ${0.055 * vis})`
  );

  halo.addColorStop(
    0.70,
    `rgba(150, 45, 15, ${0.018 * vis})`
  );

  halo.addColorStop(
    1.00,
    'rgba(0,0,0,0)'
  );

  ctx.fillStyle = halo;

  ctx.fillRect(
    0,
    H * 0.30,
    W,
    H * 0.55
  );

  // --------------------------------------------------
  // SMALL NATURAL SUN CORE
  // --------------------------------------------------

  const core =
    ctx.createRadialGradient(
      sx,
      sy,
      0,
      sx,
      sy,
      sunR
    );

  core.addColorStop(
    0.00,
    `rgba(255, 248, 215, ${0.95 * vis})`
  );

  core.addColorStop(
    0.30,
    `rgba(255, 220, 120, ${0.85 * vis})`
  );

  core.addColorStop(
    0.65,
    `rgba(255, 160, 45, ${0.42 * vis})`
  );

  core.addColorStop(
    1.00,
    'rgba(255, 100, 20, 0)'
  );

  ctx.fillStyle = core;

  // ONLY SMALL HALF SUN
  ctx.beginPath();

  ctx.arc(
    sx,
    sy,
    sunR,
    Math.PI,
    0
  );

  ctx.closePath();

  ctx.fill();

  ctx.restore();
}
  // ============ SCENE 1: NATURAL ATMOSPHERIC GOD RAYS ============

function drawDivineLight(t: number) {

  const reveal =
    smoothstep(0.35, 1.3, t);

  const fade =
    smoothstep(2.2, 3.1, t);

  const vis =
    reveal * (1 - fade);

  if (vis <= 0.001) return;

  const sx = W * 0.50;
  const sy = H * 0.62;

  ctx.save();

  // --------------------------------------------------
  // SCREEN BLENDING
  // --------------------------------------------------

  ctx.globalCompositeOperation = 'screen';

  // --------------------------------------------------
  // SOFT ATMOSPHERIC LIGHT
  // --------------------------------------------------

  const atmosphere =
    ctx.createRadialGradient(
      sx,
      sy,
      0,
      sx,
      sy,
      Math.min(W, H) * 0.48
    );

  atmosphere.addColorStop(
    0.00,
    `rgba(255, 210, 125, ${0.10 * vis})`
  );

  atmosphere.addColorStop(
    0.25,
    `rgba(255, 160, 65, ${0.055 * vis})`
  );

  atmosphere.addColorStop(
    0.55,
    `rgba(255, 110, 35, ${0.022 * vis})`
  );

  atmosphere.addColorStop(
    1.00,
    'rgba(0,0,0,0)'
  );

  ctx.fillStyle = atmosphere;

  ctx.fillRect(
    0,
    H * 0.20,
    W,
    H * 0.55
  );

  // --------------------------------------------------
  // NATURAL UPWARD LIGHT BEAMS
  // --------------------------------------------------

  const rayCount = 9;

  for (let i = 0; i < rayCount; i++) {

    const n =
      i / (rayCount - 1);

    // LEFT → UP → RIGHT
    const angle =
      Math.PI +
      n * Math.PI;

    const movement =
      Math.sin(
        t * 0.35 +
        i * 1.8
      ) * 0.008;

    const finalAngle =
      angle + movement;

    const len =
      H *
      (
        0.28 +
        0.05 *
        Math.sin(
          t * 0.45 +
          i
        )
      );

    // Very thin beam
    const width =
      0.010 +
      0.003 *
      Math.sin(
        t * 0.5 +
        i
      );

    // VERY LOW opacity
    const alpha =
      0.0065 *
      vis *
      (
        0.75 +
        0.25 *
        Math.sin(
          t * 0.7 +
          i
        )
      );

    const ex =
      sx +
      Math.cos(finalAngle) *
      len;

    const ey =
      sy +
      Math.sin(finalAngle) *
      len;

    const ray =
      ctx.createLinearGradient(
        sx,
        sy,
        ex,
        ey
      );

    ray.addColorStop(
      0.00,
      `rgba(255, 220, 150, ${alpha * 1.4})`
    );

    ray.addColorStop(
      0.30,
      `rgba(255, 180, 90, ${alpha})`
    );

    ray.addColorStop(
      0.65,
      `rgba(255, 130, 45, ${alpha * 0.25})`
    );

    ray.addColorStop(
      1.00,
      'rgba(255, 100, 30, 0)'
    );

    ctx.fillStyle = ray;

    ctx.beginPath();

    ctx.moveTo(
      sx,
      sy
    );

    ctx.lineTo(
      sx +
      Math.cos(
        finalAngle - width
      ) *
      len,

      sy +
      Math.sin(
        finalAngle - width
      ) *
      len
    );

    ctx.lineTo(
      sx +
      Math.cos(
        finalAngle + width
      ) *
      len,

      sy +
      Math.sin(
        finalAngle + width
      ) *
      len
    );

    ctx.closePath();

    ctx.fill();
  }

  ctx.restore();
}
    
  // -----------------------------------------
  // FINAL SOFT CENTRAL HAZE
  // -----------------------------------------

  const haze = ctx.createRadialGradient(
    sx,
    sy,
    0,
    sx,
    sy,
    H * 0.28
  );

  haze.addColorStop(
    0.00,
    `rgba(255, 205, 125, ${0.025 * vis})`
  );

  haze.addColorStop(
    0.35,
    `rgba(255, 155, 65, ${0.012 * vis})`
  );

  haze.addColorStop(
    1.00,
    'rgba(0,0,0,0)'
  );

  ctx.fillStyle = haze;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.restore();
}
    // STAGE 4 & 5: TOP GOD RAYS FOR TEXT (9.0s to 17.5s ONLY)
    function drawTopGodRays(t: number, vis: number) {
      if (vis <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rayCount = 18;
      const sx = W / 2;
      const sy = -20;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 0.2) + (i / rayCount) * (Math.PI * 0.6) + Math.sin(t * 0.2 + i) * 0.015;
        const len = H * 0.65;
        const a = 0.035 * vis * (0.7 + 0.3 * Math.sin(t * 1.5 + i));
        const ex = sx + Math.cos(angle) * len;
        const ey = sy + Math.sin(angle) * len;

        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, `rgba(255, 225, 140, ${a * 1.8})`);
        grad.addColorStop(0.5, `rgba(255, 170, 50, ${a})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle - 0.035) * len, sy + Math.sin(angle - 0.035) * len);
        ctx.lineTo(sx + Math.cos(angle + 0.035) * len, sy + Math.sin(angle + 0.035) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // STAGE 2: 3D RAM MANDIR (3.0s to 8.0s ONLY)
    function drawRamMandir(t: number, targetCtx: CanvasRenderingContext2D) {
      const reveal = smoothstep(3.0, 4.2, t);
      const fade = smoothstep(6.8, 8.0, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);
      if (vis <= 0) return;

      const s = Math.min(W, H) * 0.0013;
      const mx = W * 0.72; 
      const baseY = H * 0.64;

      targetCtx.save();
      targetCtx.globalAlpha = vis;

      const darkSandstone = '#2b1005';
      const midSandstone = '#6b3517';
      const lightSandstone = '#a35527';
      const goldGlow = `rgba(255, 200, 100, ${0.7 + 0.3 * Math.sin(t * 3)})`;

      const auraGrad = targetCtx.createRadialGradient(mx, baseY - 140 * s, 10 * s, mx, baseY - 140 * s, 280 * s);
      auraGrad.addColorStop(0, 'rgba(255, 180, 60, 0.6)');
      auraGrad.addColorStop(0.4, 'rgba(200, 90, 20, 0.2)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      targetCtx.fillStyle = auraGrad;
      targetCtx.fillRect(mx - 400 * s, baseY - 450 * s, 800 * s, 500 * s);

      const drawPlatform = (pw: number, ph: number, py: number, depth: number) => {
        const frontGrad = targetCtx.createLinearGradient(mx - pw/2, py, mx + pw/2, py);
        frontGrad.addColorStop(0, darkSandstone);
        frontGrad.addColorStop(0.3, midSandstone);
        frontGrad.addColorStop(0.5, lightSandstone);
        frontGrad.addColorStop(0.7, midSandstone);
        frontGrad.addColorStop(1, darkSandstone);
        targetCtx.fillStyle = frontGrad;
        targetCtx.fillRect(mx - pw / 2, py, pw, ph);
        
        targetCtx.fillStyle = '#7a3d1a';
        targetCtx.beginPath();
        targetCtx.moveTo(mx - pw / 2, py);
        targetCtx.lineTo(mx - pw / 2 + depth, py - depth);
        targetCtx.lineTo(mx + pw / 2 + depth, py - depth);
        targetCtx.lineTo(mx + pw / 2, py);
        targetCtx.closePath();
        targetCtx.fill();
        
        targetCtx.fillStyle = '#1a0702';
        targetCtx.beginPath();
        targetCtx.moveTo(mx + pw / 2, py);
        targetCtx.lineTo(mx + pw / 2 + depth, py - depth);
        targetCtx.lineTo(mx + pw / 2 + depth, py + ph - depth);
        targetCtx.lineTo(mx + pw / 2, py + ph);
        targetCtx.closePath();
        targetCtx.fill();

        targetCtx.strokeStyle = 'rgba(20, 10, 5, 0.6)';
        targetCtx.lineWidth = 1 * s;
        for(let i=0; i<5; i++) {
          const lx = mx - pw/2 + (pw / 5) * i;
          targetCtx.beginPath();
          targetCtx.moveTo(lx, py);
          targetCtx.lineTo(lx, py + ph);
          targetCtx.stroke();
        }
        targetCtx.strokeStyle = goldGlow;
        targetCtx.lineWidth = 1.2 * s;
        targetCtx.strokeRect(mx - pw / 2, py, pw, ph);
      };

      drawPlatform(380 * s, 18 * s, baseY - 18 * s, 12 * s);
      drawPlatform(340 * s, 14 * s, baseY - 32 * s, 10 * s);
      drawPlatform(300 * s, 12 * s, baseY - 44 * s, 8 * s);

      const sanctumY = baseY - 44 * s;
      const sanctumW = 160 * s;
      const sanctumH = 90 * s;
      
      const garbhaGlow = targetCtx.createRadialGradient(mx, sanctumY - 40 * s, 0, mx, sanctumY - 40 * s, Math.max(0.1, 90 * s));
      garbhaGlow.addColorStop(0, 'rgba(255, 240, 160, 1)');
      garbhaGlow.addColorStop(0.4, 'rgba(255, 150, 40, 0.8)');
      garbhaGlow.addColorStop(1, 'rgba(0,0,0,0)');
      targetCtx.fillStyle = garbhaGlow;
      targetCtx.fillRect(mx - 120 * s, sanctumY - 100 * s, 240 * s, 120 * s);

      targetCtx.fillStyle = '#0a0201';
      targetCtx.fillRect(mx - sanctumW/2, sanctumY - sanctumH, sanctumW, sanctumH);

      const doorLayers = [
        { w: sanctumW, h: sanctumH, c: '#5e2d14' },
        { w: sanctumW * 0.85, h: sanctumH * 0.9, c: '#7a3d1a' },
        { w: sanctumW * 0.7, h: sanctumH * 0.8, c: '#994d22' }
      ];
      doorLayers.forEach(layer => {
        const dy = sanctumY - layer.h;
        targetCtx.fillStyle = layer.c;
        targetCtx.beginPath();
        targetCtx.moveTo(mx - layer.w/2, sanctumY);
        targetCtx.lineTo(mx - layer.w/2, dy + layer.w * 0.2);
        targetCtx.quadraticCurveTo(mx, dy - layer.w * 0.1, mx + layer.w/2, dy + layer.w * 0.2);
        targetCtx.lineTo(mx + layer.w/2, sanctumY);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.strokeStyle = goldGlow;
        targetCtx.lineWidth = 1.5 * s;
        targetCtx.stroke();
      });

      targetCtx.fillStyle = '#1a0702';
      targetCtx.fillRect(mx - 40 * s, sanctumY - 60 * s, 80 * s, 60 * s);
      targetCtx.strokeStyle = `rgba(255, 215, 0, ${0.8 + 0.2 * Math.sin(t*2)})`;
      targetCtx.lineWidth = 2 * s;
      targetCtx.strokeRect(mx - 40 * s, sanctumY - 60 * s, 80 * s, 60 * s);
      targetCtx.beginPath();
      targetCtx.moveTo(mx, sanctumY - 60 * s);
      targetCtx.lineTo(mx, sanctumY);
      targetCtx.stroke();

      const drawCarvedPillar = (px: number, py: number, pw: number, ph: number) => {
        targetCtx.fillStyle = '#3d210d';
        targetCtx.fillRect(px - pw * 0.6, py, pw * 1.2, ph * 0.1);
        targetCtx.fillStyle = '#1a0702';
        targetCtx.fillRect(px - pw * 0.6, py + ph * 0.08, pw * 1.2, ph * 0.02);
        
        const pilGrad = targetCtx.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
        pilGrad.addColorStop(0, '#2b1005');
        pilGrad.addColorStop(0.2, '#5e2d14');
        pilGrad.addColorStop(0.5, '#b3622d');
        pilGrad.addColorStop(0.8, '#5e2d14');
        pilGrad.addColorStop(1, '#2b1005');
        targetCtx.fillStyle = pilGrad;
        targetCtx.fillRect(px - pw / 2, py - ph * 0.9, pw, ph * 0.9);
        
        targetCtx.strokeStyle = 'rgba(0,0,0,0.4)';
        targetCtx.lineWidth = 1 * s;
        for (let i = 1; i < 3; i++) {
          targetCtx.beginPath();
          targetCtx.moveTo(px - pw / 2 + (pw / 3) * i, py - ph * 0.9);
          targetCtx.lineTo(px - pw / 2 + (pw / 3) * i, py);
          targetCtx.stroke();
        }
        
        targetCtx.fillStyle = '#b3622d';
        targetCtx.fillRect(px - pw * 0.7, py - ph * 0.9, pw * 1.4, ph * 0.08);
        targetCtx.fillStyle = '#7a3d1a';
        targetCtx.fillRect(px - pw * 0.6, py - ph * 0.98, pw * 1.2, ph * 0.08);
        targetCtx.strokeStyle = goldGlow;
        targetCtx.lineWidth = 1 * s;
        targetCtx.strokeRect(px - pw * 0.7, py - ph * 0.9, pw * 1.4, ph * 0.08);
      };

      const pillarColsX = [-110, -70, -30, 30, 70, 110];
      pillarColsX.forEach(colX => {
        drawCarvedPillar(mx + colX * s, sanctumY, 12 * s, 80 * s);
      });

      targetCtx.strokeStyle = goldGlow;
      targetCtx.lineWidth = 2 * s;
      for (let i = 0; i < pillarColsX.length - 1; i++) {
        const x1 = mx + pillarColsX[i] * s;
        const x2 = mx + pillarColsX[i + 1] * s;
        targetCtx.beginPath();
        targetCtx.arc((x1 + x2) / 2, sanctumY - 70 * s, Math.max(0.1, (x2 - x1) / 2), Math.PI, 0);
        targetCtx.stroke();
        
        targetCtx.fillStyle = `rgba(255, 200, 50, ${0.6 + 0.4 * Math.sin(t*4 + i)})`;
        targetCtx.beginPath();
        targetCtx.arc((x1 + x2) / 2, sanctumY - 70 * s + 6 * s, Math.max(0.1, 4 * s), 0, Math.PI * 2);
        targetCtx.fill();
      }

      const drawNagaraShikhara = (cx: number, cy: number, w: number, h: number, isMain = false) => {
        targetCtx.fillStyle = 'rgba(0,0,0,0.7)';
        targetCtx.beginPath();
        targetCtx.moveTo(cx - w / 2 - 4 * s, cy);
        targetCtx.bezierCurveTo(cx - w * 0.5, cy - h * 0.4, cx - w * 0.25, cy - h * 0.85, cx, cy - h - 4 * s);
        targetCtx.lineTo(cx, cy - h - 4 * s);
        targetCtx.bezierCurveTo(cx + w * 0.25, cy - h * 0.85, cx + w * 0.5, cy - h * 0.4, cx + w / 2 + 4 * s, cy);
        targetCtx.closePath();
        targetCtx.fill();

        const shikhGrad = targetCtx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
        shikhGrad.addColorStop(0, '#1a0702');
        shikhGrad.addColorStop(0.15, '#421d0d');
        shikhGrad.addColorStop(0.4, '#8c451e');
        shikhGrad.addColorStop(0.5, '#c67033');
        shikhGrad.addColorStop(0.6, '#8c451e');
        shikhGrad.addColorStop(0.85, '#421d0d');
        shikhGrad.addColorStop(1, '#1a0702');

        targetCtx.fillStyle = shikhGrad;
        targetCtx.beginPath();
        targetCtx.moveTo(cx - w / 2, cy);
        targetCtx.bezierCurveTo(cx - w * 0.48, cy - h * 0.4, cx - w * 0.22, cy - h * 0.82, cx - w * 0.08, cy - h);
        targetCtx.lineTo(cx + w * 0.08, cy - h);
        targetCtx.bezierCurveTo(cx + w * 0.22, cy - h * 0.82, cx + w * 0.48, cy - h * 0.4, cx + w / 2, cy);
        targetCtx.closePath();
        targetCtx.fill();

        targetCtx.strokeStyle = 'rgba(255, 220, 150, 0.4)';
        targetCtx.lineWidth = 1.5 * s;
        targetCtx.stroke();

        const tiers = isMain ? 16 : 10;
        for (let i = 1; i < tiers; i++) {
          const f = i / tiers;
          const ty = cy - h * f;
          const tw = lerp(w, w * 0.16, Math.pow(f, 1.15));

          targetCtx.fillStyle = `rgba(30, 15, 5, ${0.6 - f * 0.2})`;
          targetCtx.fillRect(cx - tw / 2, ty - 2 * s, tw, 3 * s);
          
          targetCtx.fillStyle = `rgba(255, 210, 120, ${0.2 + 0.2 * (1 - f)})`;
          targetCtx.fillRect(cx - tw / 2, ty, tw, 1.5 * s);
        }

        targetCtx.strokeStyle = 'rgba(10, 5, 2, 0.5)';
        targetCtx.lineWidth = 1 * s;
        const ribs = isMain ? 5 : 3;
        for (let r = 1; r < ribs; r++) {
          targetCtx.beginPath();
          for (let i = 0; i <= tiers; i++) {
            const f = i / tiers;
            const ty = cy - h * f;
            const tw = lerp(w, w * 0.16, Math.pow(f, 1.15));
            const rx = cx - tw / 2 + (tw / ribs) * r;
            if (i === 0) targetCtx.moveTo(rx, ty);
            else targetCtx.lineTo(rx, ty);
          }
          targetCtx.stroke();
        }

        if (isMain) {
          for (let i = 0; i < 4; i++) {
            const f = 0.2 + i * 0.15;
            const ty = cy - h * f;
            const tw = lerp(w, w * 0.16, Math.pow(f, 1.15));
            targetCtx.fillStyle = '#421d0d';
            targetCtx.beginPath();
            targetCtx.moveTo(cx - tw / 2, ty);
            targetCtx.lineTo(cx - tw / 2 - 10 * s, ty - 18 * s);
            targetCtx.lineTo(cx - tw / 2 - 2 * s, ty);
            targetCtx.closePath();
            targetCtx.fill();
            targetCtx.beginPath();
            targetCtx.moveTo(cx + tw / 2, ty);
            targetCtx.lineTo(cx + tw / 2 + 10 * s, ty - 18 * s);
            targetCtx.lineTo(cx + tw / 2 + 2 * s, ty);
            targetCtx.closePath();
            targetCtx.fill();
          }
        }

        const topY = cy - h;
        const amalakaW = Math.max(0.1, w * 0.35);
        const amalakaH = Math.max(0.1, 14 * s);

        const amalakaGrad = targetCtx.createRadialGradient(cx, topY - amalakaH / 2, 0, cx, topY - amalakaH / 2, Math.max(0.1, amalakaW / 2));
        amalakaGrad.addColorStop(0, '#ffaa00');
        amalakaGrad.addColorStop(0.5, '#d48031');
        amalakaGrad.addColorStop(1, '#5e2d14');
        targetCtx.fillStyle = amalakaGrad;
        targetCtx.beginPath();
        targetCtx.ellipse(cx, topY - amalakaH / 2, Math.max(0.1, amalakaW / 2), Math.max(0.1, amalakaH / 2), 0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.strokeStyle = '#ffea00';
        targetCtx.lineWidth = 1.5 * s;
        targetCtx.stroke();

        const kalashY = topY - amalakaH;
        const kGrad = targetCtx.createLinearGradient(cx - 10 * s, kalashY, cx + 10 * s, kalashY);
        kGrad.addColorStop(0, '#cc7700');
        kGrad.addColorStop(0.3, '#ffff00');
        kGrad.addColorStop(0.5, '#ffffff');
        kGrad.addColorStop(0.7, '#ffff00');
        kGrad.addColorStop(1, '#cc7700');

        targetCtx.fillStyle = kGrad;
        targetCtx.beginPath();
        targetCtx.arc(cx, kalashY - 10 * s, Math.max(0.1, 10 * s), 0, Math.PI * 2);
        targetCtx.fill();

        targetCtx.fillRect(cx - 4 * s, kalashY - 15 * s, 8 * s, 5 * s);

        targetCtx.beginPath();
        targetCtx.moveTo(cx, kalashY - 15 * s);
        targetCtx.lineTo(cx - 3 * s, kalashY - 28 * s);
        targetCtx.lineTo(cx + 3 * s, kalashY - 28 * s);
        targetCtx.closePath();
        targetCtx.fill();

        return kalashY - 28 * s;
      };

      const topCenterY = drawNagaraShikhara(mx, sanctumY, 120 * s, 260 * s, true);
      drawNagaraShikhara(mx - 80 * s, sanctumY, 70 * s, 160 * s);
      drawNagaraShikhara(mx + 80 * s, sanctumY, 70 * s, 160 * s);
      drawNagaraShikhara(mx - 140 * s, sanctumY, 55 * s, 110 * s);
      drawNagaraShikhara(mx + 140 * s, sanctumY, 55 * s, 110 * s);

      const flagPoleTop = topCenterY - 30 * s;
      
      targetCtx.fillStyle = `rgba(200, 130, 40, ${0.8})`;
      targetCtx.beginPath();
      targetCtx.arc(mx, topCenterY, Math.max(0.1, 6 * s), 0, Math.PI * 2);
      targetCtx.fill();

      const poleGrad = targetCtx.createLinearGradient(mx - 3 * s, 0, mx + 3 * s, 0);
      poleGrad.addColorStop(0, '#5e3818');
      poleGrad.addColorStop(0.4, '#d4aa70');
      poleGrad.addColorStop(0.5, '#fff5e0');
      poleGrad.addColorStop(0.6, '#d4aa70');
      poleGrad.addColorStop(1, '#5e3818');
      targetCtx.fillStyle = poleGrad;
      targetCtx.fillRect(mx - 2 * s, flagPoleTop, 4 * s, topCenterY - flagPoleTop);
      
      const finialGrad = targetCtx.createRadialGradient(mx - 1 * s, flagPoleTop - 4 * s, 0, mx, flagPoleTop - 4 * s, Math.max(0.1, 6 * s));
      finialGrad.addColorStop(0, '#ffffff');
      finialGrad.addColorStop(0.4, '#ffd700');
      finialGrad.addColorStop(1, '#994d22');
      targetCtx.fillStyle = finialGrad;
      targetCtx.beginPath();
      targetCtx.arc(mx, flagPoleTop - 4 * s, Math.max(0.1, 5 * s), 0, Math.PI * 2);
      targetCtx.fill();

      const wave1 = Math.sin(t * 6) * 6 * s;
      const wave2 = Math.sin(t * 6 + 1.5) * 4 * s;
      
      targetCtx.beginPath();
      targetCtx.moveTo(mx, flagPoleTop);
      targetCtx.quadraticCurveTo(mx + 15 * s, flagPoleTop + wave1, mx + 35 * s + wave1, flagPoleTop + 12 * s + wave2);
      targetCtx.quadraticCurveTo(mx + 15 * s, flagPoleTop + 24 * s + wave2, mx, flagPoleTop + 26 * s);
      targetCtx.closePath();
      
      const flagGrad = targetCtx.createLinearGradient(mx, flagPoleTop, mx + 35 * s, flagPoleTop);
      flagGrad.addColorStop(0, '#cc3300');
      flagGrad.addColorStop(0.5, '#ff5500');
      flagGrad.addColorStop(1, '#ff7700');
      targetCtx.fillStyle = flagGrad;
      targetCtx.fill();
      
      targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      targetCtx.lineWidth = 1 * s;
      targetCtx.stroke();

      targetCtx.fillStyle = `rgba(255, 234, 0, ${0.8 + 0.2 * Math.sin(t*3)})`;
      targetCtx.beginPath();
      targetCtx.arc(mx + 12 * s, flagPoleTop + 13 * s + wave1 * 0.5, Math.max(0.1, 4 * s), 0, Math.PI * 2);
      targetCtx.fill();

      targetCtx.restore();
    }

    // STAGE 2: SARYU WATER REFLECTIONS (3.0s to 8.0s ONLY - ALWAYS VISIBLE FROM 0.0s)
    function drawWater(t: number) {
      const reveal = smoothstep(0.0, 1.5, t); // Water active from first second
      const fade = smoothstep(6.8, 8.0, t);  // Fades out cleanly before text scene
      const vis = reveal * (1 - fade);
      if (vis <= 0) return;

      const waterY = H * 0.62;
      ctx.save();
      ctx.globalAlpha = vis;

      const wGrad = ctx.createLinearGradient(0, waterY, 0, H);
      wGrad.addColorStop(0, '#060301');
      wGrad.addColorStop(0.5, '#040101');
      wGrad.addColorStop(1, '#020000');
      ctx.fillStyle = wGrad;
      ctx.fillRect(0, waterY, W, H - waterY);

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.translate(0, waterY * 2);
      ctx.scale(1, -1);
      
      const sliceH = 3;
      for (let y = waterY; y < H; y += sliceH) {
        const dist = y - waterY;
        const distanceFactor = dist / (H - waterY);
        const ripple = Math.sin(y * 0.15 + t * 6.5) * 5 * distanceFactor + 
                       Math.cos(y * 0.35 - t * 4.2) * 2 * distanceFactor;
        ctx.drawImage(reflectCanvas, 0, y, W, sliceH, ripple, y, W, sliceH);
      }
      ctx.restore();

      ctx.globalCompositeOperation = 'lighter';
      for (let y = waterY + 2; y < H; y += 4) {
        const distanceFactor = (y - waterY) / (H - waterY);
        const waveX = Math.sin(y * 0.12 + t * 4.5) * 6 * distanceFactor;
        const lineAlpha = lerp(0.03, 0.16, distanceFactor);

        ctx.strokeStyle = `rgba(255, 200, 100, ${lineAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        const mandirX = W * 0.72;
        const refW = 160 * Math.min(W, H) * 0.0013;
        ctx.moveTo(mandirX - (refW / 2) * distanceFactor + waveX, y);
        ctx.lineTo(mandirX + (refW / 2) * distanceFactor + waveX, y);
        ctx.stroke();
      }

      activeFireworkBursts.forEach((b) => {
        if (b.y > waterY) return;
        const rY = waterY + (waterY - b.y); 
        const dy = rY - waterY;
        const rfGrad = ctx.createRadialGradient(b.x, rY, 0, b.x, rY, Math.max(0.1, b.r * 1.8));
        rfGrad.addColorStop(0, `${b.color}${Math.floor(b.alpha * 50).toString(16).padStart(2, '0')}`);
        rfGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rfGrad;
        
        ctx.beginPath();
        ctx.ellipse(b.x, waterY + dy * 0.65, Math.max(0.1, b.r * 1.4), Math.max(0.1, b.r * 0.25), 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // STAGE 2: FLOATING DIYAS (3.0s to 8.0s ONLY)
    function updateAndDrawFloatingDiyas(t: number) {
      const reveal = smoothstep(3.0, 4.2, t);
      const fade = smoothstep(6.8, 8.0, t); // Completely 0% by 8.0s!
      const vis = reveal * (1 - fade);
      if (vis <= 0) return;

      const waterY = H * 0.62;

      ctx.save();
      ctx.globalAlpha = vis;

      diyas.forEach((d) => {
        d.x += (d.speed * 0.016);
        if (d.x < -40) d.x = W + 40;
        if (d.x > W + 40) d.x = -40;

        const waveY = d.y + Math.sin(t * 1.5 + d.phase) * 2.0 * d.scale;
        if (waveY < waterY) return;

        const flamePulse = Math.sin(t * 15 + d.flamePulse) * 1.5;
        const s = d.scale * 16; 
        const flameH = (s * 1.8) + flamePulse * d.scale;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const trailH = s * 6;
        const trailGrad = ctx.createLinearGradient(d.x, waveY, d.x, waveY + trailH);
        trailGrad.addColorStop(0, 'rgba(255, 180, 50, 0.5)');
        trailGrad.addColorStop(0.5, 'rgba(255, 130, 30, 0.2)');
        trailGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = trailGrad;
        ctx.fillRect(d.x - s * 0.3, waveY, s * 0.6, trailH);
        ctx.restore();

        const dGrad = ctx.createLinearGradient(d.x - s, waveY, d.x + s, waveY);
        dGrad.addColorStop(0, '#4a1b05');
        dGrad.addColorStop(0.5, '#a64f1d');
        dGrad.addColorStop(1, '#4a1b05');
        ctx.fillStyle = dGrad;
        ctx.beginPath();
        ctx.ellipse(d.x, waveY + s * 0.25, Math.max(0.1, s), Math.max(0.1, s * 0.35), 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#170300';
        ctx.beginPath();
        ctx.ellipse(d.x, waveY + s * 0.15, Math.max(0.1, s * 0.88), Math.max(0.1, s * 0.18), 0, 0, Math.PI * 2);
        ctx.fill();

        const fGrad = ctx.createLinearGradient(d.x, waveY, d.x, waveY - flameH);
        fGrad.addColorStop(0, 'rgba(255, 80, 0, 0.98)');
        fGrad.addColorStop(0.4, 'rgba(255, 190, 40, 1)');
        fGrad.addColorStop(0.8, 'rgba(255, 250, 200, 1)');
        fGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = fGrad;

        ctx.beginPath();
        ctx.moveTo(d.x - s * 0.18, waveY + s * 0.1);
        ctx.quadraticCurveTo(d.x - s * 0.25, waveY - flameH * 0.45, d.x, waveY - flameH);
        ctx.quadraticCurveTo(d.x + s * 0.25, waveY - flameH * 0.45, d.x + s * 0.18, waveY + s * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.6 * vis;
        ctx.drawImage(dustSprite, d.x - s * 1.8, waveY - flameH - s * 0.5, Math.max(0.1, s * 3.6), Math.max(0.1, s * 3.6));
        ctx.restore();
      });

      ctx.restore();
    }

    function drawFogAndHaze(t: number) {
      const intensity = smoothstep(0.5, 4.0, t) * (1 - smoothstep(6.8, 8.0, t));
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

    // STAGE 2: REALISTIC FIREWORKS (3.8s to 6.8s ONLY)
    function launchFireworks(t: number) {
      if (t < 3.8 || t > 6.8) return;

      if (rockets.length >= 3) return;
      if (t - lastRocketLaunchTime < 0.35 + Math.random() * 0.15) return;

      let startX = 0;
      if (Math.random() < 0.5) startX = lerp(W * 0.2, W * 0.4, Math.random());
      else startX = lerp(W * 0.6, W * 0.8, Math.random());

      const targetY = lerp(H * 0.35, H * 0.1, Math.random());

      for (const b of activeFireworkBursts) {
        if (b.alpha > 0.1) {
          const dx = b.x - startX;
          const dy = b.y - targetY;
          if (Math.sqrt(dx * dx + dy * dy) < 100) return;
        }
      }

      let type = 'small';
      const r = Math.random();
      if (r < 0.4) type = 'finale';
      else if (r < 0.7) type = 'chrysanthemum';
      else type = 'medium';

      const cPair = fwColors[Math.floor(Math.random() * fwColors.length)];

      rockets.push({
        x: startX, y: H * 0.62,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -9 - Math.random() * 3,
        ax: 0, ay: 0.15 + Math.random() * 0.03,
        targetY, color: cPair[0], color2: cPair[1], type,
        trail: [], flicker: 0, smokeTimer: 0, sparkTimer: 0
      });

      lastRocketLaunchTime = t;
    }

    function createBurst(fx: number, fy: number, color: string, color2: string, type: string, isSecondary: boolean = false) {
      let particleCount = 45;
      let maxR = 50;
      let shake = 0;
      let flash = 0;

      if (type === 'small') { particleCount = 45; maxR = 50; }
      else if (type === 'medium') { particleCount = 55; maxR = 70; }
      else if (type === 'chrysanthemum') { particleCount = 70; maxR = 90; }
      else if (type === 'willow') { particleCount = 60; maxR = 80; }
      else if (type === 'finale') { particleCount = 90; maxR = 120; shake = 3; flash = 0.3; }

      if (isSecondary) {
        particleCount = 30;
        shake = 0;
        flash = 0;
      }

      screenFlash = Math.min(1, screenFlash + flash);
      cameraShake = Math.min(4, cameraShake + shake);

      activeFireworkBursts.push({ x: fx, y: fy, color, r: 0, maxR, alpha: 0.6, type: 'flash' });

      for (let i = 0; i < particleCount; i++) {
        let ang = (i / particleCount) * Math.PI * 2;
        let spd = 2.0 + Math.random() * 4.0;
        let vx = 0, vy = 0;
        let gravity = 0.05;
        let drag = 0.982;
        let maxLife = 1.5 + Math.random() * 1.2;
        let pColor = color;
        let pColor2 = color2;
        let pType = 'core';
        let stage = 0;
        let delay = 0;
        let size = 1.2 + Math.random() * 1.8;

        if (type === 'willow') {
          gravity = 0.15;
          drag = 0.995;
          maxLife = 2.5 + Math.random() * 1.5;
          pColor = '#ffd700';
          pColor2 = '#ffaa00';
        } else if (type === 'finale') {
          if (Math.random() < 0.2) {
            stage = 1;
            delay = 0.5 + Math.random() * 0.5;
            maxLife = delay + 0.5;
            pType = 'delayed';
            pColor = '#ffffff';
            spd = 1.0 + Math.random() * 2.0;
          }
        }

        vx = Math.cos(ang) * spd;
        vy = Math.sin(ang) * spd;

        sparks.push({
          x: fx, y: fy, vx, vy, color: pColor, color2: pColor2,
          alpha: 1, life: 0, maxLife, size, gravity, drag,
          flicker: Math.random() < 0.3, type: pType,
          temp: 1.0, rot: Math.random() * Math.PI * 2, rotSpd: (Math.random() - 0.5) * 0.2,
          wind: (Math.random() - 0.5) * 0.1, turb: Math.random() * 0.05,
          stage, delay, hasExploded: false, isSecondary
        });
      }

      if (!isSecondary && type === 'finale') {
        for(let i=0; i<2; i++) {
          setTimeout(() => {
            if (running) {
              const offX = (Math.random() - 0.5) * 70;
              const offY = (Math.random() - 0.5) * 30;
              createBurst(fx + offX, fy + offY, color2, color, 'small', true);
            }
          }, 500 + i * 300);
        }
      }
    }

    function updateFireworks(dt: number, t: number) {
      const forceCleanup = t >= 7.8;

      screenFlash = Math.max(0, screenFlash - dt * 1.5);
      cameraShake = Math.max(0, cameraShake - dt * 20.0);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        
        if (forceCleanup) {
          rockets.splice(i, 1);
          continue;
        }

        r.vy += r.ay * dt * 60;
        r.vx += r.ax * dt * 60;
        r.x += r.vx * dt * 60;
        r.y += r.vy * dt * 60;
        
        r.flicker = 0.5 + Math.random() * 0.5;
        r.smokeTimer += dt;
        r.sparkTimer += dt;

        r.trail.push({ x: r.x, y: r.y, alpha: 1, type: 'core' });
        if (r.trail.length > 6) r.trail.shift(); 
        r.trail.forEach(tt => tt.alpha -= 0.12); 

        if (r.smokeTimer > 0.15) {
          r.smokeTimer = 0;
          sparks.push({
            x: r.x + (Math.random()-0.5)*2, y: r.y + 5, 
            vx: (Math.random()-0.5)*0.5, vy: 1 + Math.random()*0.5,
            color: 'rgba(150,130,110,1)', color2: 'rgba(100,80,60,1)',
            alpha: 0.3, life: 0, maxLife: 1.5, size: 2 + Math.random()*2,
            gravity: -0.02, drag: 0.98, flicker: false, type: 'smoke',
            temp: 0, rot: 0, rotSpd: 0, wind: 0.1, turb: 0.02,
            stage: 0, delay: 0, hasExploded: false, isSecondary: false
          });
        }
        
        if (r.sparkTimer > 0.03) {
          r.sparkTimer = 0;
          sparks.push({
            x: r.x, y: r.y + 4, 
            vx: (Math.random()-0.5)*1, vy: 2 + Math.random()*1.5,
            color: '#ffffff', color2: r.color,
            alpha: 1, life: 0, maxLife: 0.4, size: 1.0, 
            gravity: 0.1, drag: 0.95, flicker: true, type: 'ember',
            temp: 1, rot: 0, rotSpd: 0, wind: 0, turb: 0,
            stage: 0, delay: 0, hasExploded: false, isSecondary: false
          });
        }

        if (r.y <= r.targetY || r.vy >= 0) {
          createBurst(r.x, r.y, r.color, r.color2, r.type);
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];

        if (forceCleanup) {
          sparks.splice(i, 1);
          continue;
        }

        s.life += dt;
        
        if (s.type === 'delayed' && !s.hasExploded) {
          if (s.life > s.delay) {
            s.hasExploded = true;
            createBurst(s.x, s.y, s.color2, s.color, 'small', true);
            s.alpha = 0;
          }
        } else {
          s.vy += s.gravity * dt * 60;
          s.vx *= (1 - (1 - s.drag) * dt * 60);
          s.vy *= (1 - (1 - s.drag) * dt * 60);
          s.vx += Math.sin(s.life * 5 + s.x * 0.1) * s.turb * dt * 60;
          s.vx += s.wind * dt * 60;
          s.x += s.vx * dt * 60;
          s.y += s.vy * dt * 60;
          s.rot += s.rotSpd * dt * 60;

          s.temp = Math.max(0, 1 - s.life / s.maxLife);
          
          if (s.type === 'smoke') {
            s.size += dt * 8;
            s.alpha = Math.max(0, 0.3 * (1 - s.life / s.maxLife));
          } else if (s.type === 'ember') {
            s.alpha = s.temp;
          } else {
            s.alpha = Math.max(0, 1 - s.life / s.maxLife);
            if (s.flicker) s.alpha *= (0.5 + Math.random() * 0.5);
          }
        }

        if (s.life > s.maxLife || s.y > H * 0.62 || s.alpha <= 0.01) {
          sparks.splice(i, 1);
        }
      }

      for (let i = activeFireworkBursts.length - 1; i >= 0; i--) {
        const b = activeFireworkBursts[i];
        if (forceCleanup) {
          activeFireworkBursts.splice(i, 1);
          continue;
        }
        b.r += (b.maxR - b.r) * 0.15;
        b.alpha -= 0.05;
        if (b.alpha <= 0) activeFireworkBursts.splice(i, 1);
      }
    }

    function drawFireworks() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      rockets.forEach(r => {
        r.trail.forEach(tt => {
          if (tt.alpha > 0) {
            ctx.globalAlpha = tt.alpha * 0.8;
            ctx.fillStyle = r.color;
            ctx.beginPath();
            ctx.arc(tt.x, tt.y, Math.max(0.1, 1.5), 0, Math.PI * 2); 
            ctx.fill();
          }
        });
        
        ctx.globalAlpha = 1;
        const flameLen = 6 + Math.random() * 3; 
        const fGrad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + flameLen);
        fGrad.addColorStop(0, '#ffffff');
        fGrad.addColorStop(0.5, '#ffaa00');
        fGrad.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.moveTo(r.x - 1.5, r.y); 
        ctx.lineTo(r.x + 1.5, r.y);
        ctx.lineTo(r.x, r.y + flameLen);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(0.1, 2.0 + r.flicker), 0, Math.PI * 2); 
        ctx.fill();
      });

      activeFireworkBursts.forEach((b) => {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, Math.max(0.1, b.r));
        grad.addColorStop(0, `${b.color}80`); 
        grad.addColorStop(0.4, `${b.color}20`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = b.alpha;
        ctx.beginPath();
        ctx.arc(b.x, b.y, Math.max(0.1, b.r), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      sparks.forEach((s) => {
        if (s.alpha <= 0 || s.type === 'smoke') return;
        
        const alpha = clamp(s.alpha, 0, 1);
        const sz = Math.max(0.1, s.size);
        
        ctx.globalAlpha = alpha * 0.25;
        ctx.drawImage(sparkSprite, s.x - sz * 4, s.y - sz * 4, sz * 8, sz * 8);
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.temp > 0.5 ? '#ffffff' : s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, sz, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = 'source-over';
      
      sparks.forEach((s) => {
        if (s.alpha <= 0 || s.type !== 'smoke') return;
        ctx.globalAlpha = s.alpha * 0.3;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.1, s.size), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============ 

    function spawnDust(t: number) {
      const target = Math.floor(85 * smoothstep(0, 3, t));
      let count = 0;
      for (const p of pool.particles) if (p.active && p.type === 'dust') count++;
      let attempts = 0;
      while (count < target && attempts < 8) {
        const p = pool.spawn(); if (!p) break;
        p.type = 'dust'; p.x = Math.random() * W; p.y = Math.random() * H;
        p.vx = (Math.random() - 0.5) * 0.4; p.vy = -0.05 - Math.random() * 0.35;
        p.size = 0.6 + Math.random() * 1.8; p.maxLife = 5 + Math.random() * 5;
        p.life = Math.random() * p.maxLife * 0.4; p.alpha = 0;
        p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 0.5;
        count++; attempts++;
      }
    }

    function spawnPetals(t: number) {
      const intensity = smoothstep(4.0, 6.5, t) * (1 - smoothstep(6.8, 8.0, t));
      if (intensity <= 0) return;
      if (Math.random() > intensity * 0.4) return;
      const p = pool.spawn(); if (!p) return;
      p.type = 'petal'; p.x = Math.random() * W; p.y = -20;
      p.vx = (Math.random() - 0.5) * 0.8; p.vy = 0.5 + Math.random() * 0.8;
      p.size = 5 + Math.random() * 6; p.maxLife = 18; p.life = 0; p.alpha = 0;
      p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 2.5;
    }

    function spawnIncenseSmoke(t: number) {
      const intensity = smoothstep(1.5, 4.0, t) * (1 - smoothstep(6.8, 8.0, t));
      if (intensity <= 0) return;
      if (Math.random() > 0.08 * intensity) return;
      
      const s = Math.min(W, H) * 0.0011;
      const emitterX = Math.random() < 0.5 ? W * 0.15 : W * 0.85;

      const p = pool.spawn(); if (!p) return;
      p.type = 'smoke'; p.x = emitterX; p.y = H * 0.85 - 12 * s;
      p.vx = (Math.random() - 0.5) * 0.25; p.vy = -0.5 - Math.random() * 0.45;
      p.size = 6 + Math.random() * 8; p.maxLife = 4.5 + Math.random() * 3.5;
      p.life = 0; p.alpha = 0;
    }

    function spawnBirds(t: number) {
      if (t < 0.8 || t > 2.8) return; // STAGE 1 ONLY
      if (birdsSpawned) return;
      birdsSpawned = true;
      const count = 14;
      for (let i = 0; i < count; i++) {
        const p = pool.spawn(); if (!p) break;
        p.type = 'bird';
        p.x = -60 - i * 18 + Math.random() * 15;
        p.y = H * 0.22 + Math.random() * 70 + (i % 3) * 12;
        p.vx = 2.2 + Math.random() * 0.6; p.vy = (Math.random() - 0.5) * 0.15;
        p.size = 7 + Math.random() * 4; p.maxLife = 25; p.life = 0;
        p.alpha = 0.65; p.flap = Math.random() * Math.PI * 2;
      }
    }

    function updateParticles(dt: number, t: number) {
      for (const p of pool.particles) {
        if (!p.active) continue;
        p.life += dt;

        if (p.type === 'dust') {
          p.x += p.vx; p.y += p.vy;
          p.vx += (Math.random() - 0.5) * 0.03; p.vy += -0.002;
          p.rot += p.rotSpd * dt;
          const lr = p.life / p.maxLife;
          const env = smoothstep(0, 2, t) * (1 - smoothstep(17.0, 17.5, t));
          p.alpha = smoothstep(0, 0.25, lr) * (1 - smoothstep(0.75, 1, lr)) * 0.65 * env;
          if (p.life > p.maxLife || p.y < -30) {
            p.life = 0; p.x = Math.random() * W; p.y = H * 0.6; p.alpha = 0;
          }
        } else if (p.type === 'petal') {
          p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.012) * 0.35;
          p.y += p.vy; p.rot += p.rotSpd * dt;
          const lr = p.life / p.maxLife;
          p.alpha = smoothstep(0, 0.12, lr) * 0.85 * (1 - smoothstep(6.8, 8.0, t));
          if (p.y > H * 0.62 || p.life > p.maxLife) pool.release(p);
        } else if (p.type === 'smoke') {
          p.x += p.vx + Math.sin(t * 1.4 + p.y * 0.01) * 0.25;
          p.y += p.vy; p.size += dt * 5.2; 
          const lr = p.life / p.maxLife;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.18;
          if (p.life > p.maxLife || p.y < -30) pool.release(p);
        } else if (p.type === 'bird') {
          p.x += p.vx; p.y += p.vy; p.flap += dt * 9;
          p.alpha = 0.65 * (1 - smoothstep(2.5, 3.2, t));
          if (p.x > W + 60 || p.alpha < 0.01) pool.release(p);
        }
      }
    }

    function drawParticles() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of pool.particles) {
        if (!p.active || p.alpha <= 0.01) continue;
        if (p.type === 'dust') {
          ctx.globalAlpha = p.alpha;
          const sz = p.size * 5.2;
          ctx.drawImage(dustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      for (const p of pool.particles) {
        if (!p.active || p.alpha <= 0.01) continue;
        if (p.type === 'petal') {
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(240, 120, 60, ${p.alpha})`; 
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(0.1, p.size), Math.max(0.1, p.size * 0.48), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.type === 'smoke') {
          ctx.save();
          const rad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(0.1, p.size));
          rad.addColorStop(0, `rgba(255, 230, 200, ${p.alpha})`);
          rad.addColorStop(0.3, `rgba(220, 160, 100, ${p.alpha * 0.5})`);
          rad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
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

    // ============ AMBIENT GOLDEN STAR DUST AROUND TEXT ============
    // ✅ CRASH FIX: Guaranteed positive twinkle multiplier
    function drawAmbientTextSparkles(t: number, cy: number, vis: number) {
      if (vis <= 0.001) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const sparkCount = 80;
      for (let i = 0; i < sparkCount; i++) {
        const seed = i * 19.83;
        const x = (W / 2 - W * 0.4) + ((seed * 117) % (W * 0.8));
        const y = (cy - H * 0.25) + ((seed * 223) % (H * 0.5));
        
        const floatY = Math.sin(t * 1.2 + seed) * 12;
        const twinkle = 0.55 + 0.45 * Math.sin(t * 3.5 + seed * 2);
        const sz = Math.max(0.1, (1.0 + (i % 3) * 0.8) * twinkle);
        const alpha = 0.25 * vis * twinkle;

        ctx.fillStyle = i % 2 === 0 ? `rgba(255, 225, 120, ${alpha})` : `rgba(255, 180, 50, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y + floatY, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    
    // ============ ORNAMENTAL GRAPHICS HELPERS ============

    function drawTilakOrnament(x: number, y: number, scale: number, alpha: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      
      const grad = ctx.createLinearGradient(0, -22, 0, 5);
      grad.addColorStop(0, '#FFE8A3');
      grad.addColorStop(0.3, '#FFC837');
      grad.addColorStop(0.7, '#E5A00D');
      grad.addColorStop(1, '#B87B00');
      
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#FFC837';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.quadraticCurveTo(-9, -12, 0, 2);
      ctx.quadraticCurveTo(9, -12, 0, -24);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -31, Math.max(0.1, 3.2), 0, Math.PI * 2);
      ctx.fillStyle = '#FFE8A3';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-2, -6);
      ctx.quadraticCurveTo(-18, -14, -24, -2);
      ctx.quadraticCurveTo(-14, 4, 0, 0);
      ctx.moveTo(2, -6);
      ctx.quadraticCurveTo(18, -14, 24, -2);
      ctx.quadraticCurveTo(14, 4, 0, 0);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    }

    function drawRamSwash(x: number, y: number, scale: number, alpha: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      const swashGrad = ctx.createLinearGradient(-30, 0, 110, 40);
      swashGrad.addColorStop(0, '#FFE8A3');
      swashGrad.addColorStop(0.2, '#FFC837');
      swashGrad.addColorStop(0.5, '#E5A00D');
      swashGrad.addColorStop(0.8, '#B87B00');
      swashGrad.addColorStop(1, 'rgba(184, 123, 0, 0)');

      ctx.strokeStyle = swashGrad;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.bezierCurveTo(20, 35, 75, 45, 110, 15);
      ctx.stroke();

      ctx.restore();
    }

    function drawOrnamentalDivider(x: number, y: number, width: number, alpha: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha;

      const halfW = width / 2;

      const gradL = ctx.createLinearGradient(-halfW, 0, -18, 0);
      gradL.addColorStop(0, 'rgba(184, 123, 0, 0)');
      gradL.addColorStop(0.7, 'rgba(255, 200, 55, 0.8)');
      gradL.addColorStop(1, '#FFE8A3');

      ctx.strokeStyle = gradL;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.lineTo(-18, 0);
      ctx.stroke();

      const gradR = ctx.createLinearGradient(18, 0, halfW, 0);
      gradR.addColorStop(0, '#FFE8A3');
      gradR.addColorStop(0.3, 'rgba(255, 200, 55, 0.8)');
      gradR.addColorStop(1, 'rgba(184, 123, 0, 0)');

      ctx.strokeStyle = gradR;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(halfW, 0);
      ctx.stroke();

      ctx.fillStyle = '#FFC837';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.1, 4), 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fillStyle = '#FFE8A3';
      ctx.fill();

      ctx.fillStyle = '#FFC837';
      ctx.beginPath();
      ctx.arc(-halfW + 4, 0, Math.max(0.1, 2), 0, Math.PI * 2);
      ctx.arc(halfW - 4, 0, Math.max(0.1, 2), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // STAGE 4: DIRECT REVEAL - 24K METALLIC GOLD TITLE (9.0s to 17.5s STRICT)
    function drawTitle(t: number) {
      if (t < 9.0) return; // STRICT: Does not start until Stage 2 is 100% gone at 8.0s!

      const fadeIn = smoothstep(9.0, 10.2, t);
      const fadeOut = smoothstep(17.0, 17.5, t);
      const intensity = fadeIn * (1 - fadeOut);
      if (intensity <= 0.001) return;
      
      const fontSize = Math.min(W * 0.13, 140);
      const cy = H * 0.38;
      
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      
      ctx.font = `900 ${fontSize}px "Tiro Devanagari Hindi","Nirmala UI","Mangal","Kokila",serif`;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      drawTopGodRays(t, intensity);
      drawAmbientTextSparkles(t, cy, intensity);

      ctx.globalCompositeOperation = 'source-over';

      // 1. Dark Chocolate Outer Stroke Edge for Crispness
      ctx.strokeStyle = '#1d0b02';
      ctx.lineWidth = fontSize * 0.045;
      ctx.strokeText('जय श्री राम', W / 2, cy);

      // 2. Pure 24K Metallic Gold Fill Gradient
      const pure24kGoldGrad = ctx.createLinearGradient(0, cy - fontSize * 0.45, 0, cy + fontSize * 0.45);
      pure24kGoldGrad.addColorStop(0.00, '#FFFDF0'); // Bright gold top
      pure24kGoldGrad.addColorStop(0.20, '#FFE8A3'); // Polished highlight
      pure24kGoldGrad.addColorStop(0.40, '#FFC837'); // 24k Gold core
      pure24kGoldGrad.addColorStop(0.65, '#E5A00D'); // Deep amber gold
      pure24kGoldGrad.addColorStop(0.85, '#B87B00'); // Bronze gold
      pure24kGoldGrad.addColorStop(1.00, '#3A1F00'); // Base shadow

      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(229, 160, 13, ${0.5 * intensity})`;
      ctx.fillStyle = pure24kGoldGrad;
      ctx.fillText('जय श्री राम', W / 2, cy);

      // 3. Tilak Ornament
      const tilakX = W / 2 + fontSize * 0.02;
      const tilakY = cy - fontSize * 0.52;
      const tilakScale = (fontSize / 130) * 1.1;
      drawTilakOrnament(tilakX, tilakY, tilakScale, intensity);

      // 4. Golden Swash Curve under 'म'
      const swashX = W / 2 + fontSize * 1.15;
      const swashY = cy + fontSize * 0.28;
      drawRamSwash(swashX, swashY, fontSize / 130, intensity);

      ctx.restore();
    }

    // STAGE 5: ROYAL GREETING WITH DIVIDERS (10.8s to 17.5s STRICT)
    function drawGreeting(t: number) {
      if (t < 10.8) return;
      const reveal = smoothstep(10.8, 12.0, t);
      const fade = smoothstep(17.0, 17.5, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0.001) return;
      
      const fontSize1 = Math.min(W * 0.038, 30);
      const fontSize2 = Math.min(W * 0.048, 38);
      const slideY = 20 * (1 - reveal);
      const cy = H * 0.65 + slideY;
      
      const line1 = 'आपको एवं आपके परिवार को';
      const line2 = 'राम नवमी की हार्दिक शुभकामनाएँ';
      
      ctx.save();
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle';

      // Divider Line 1
      const divY1 = cy - fontSize1 * 1.25;
      drawOrnamentalDivider(W / 2, divY1, Math.min(W * 0.38, 300), vis);

      // Line 1: Dark Chocolate Stroke + Warm Cream Gold Fill
      ctx.font = `500 ${fontSize1}px "Tiro Devanagari Hindi", "Mangal", sans-serif`;
      ctx.strokeStyle = '#1d0b02';
      ctx.lineWidth = fontSize1 * 0.12;
      ctx.lineJoin = 'round';
      ctx.strokeText(line1, W / 2, cy - fontSize1 * 0.2);

      ctx.fillStyle = '#FFE5B4';
      ctx.fillText(line1, W / 2, cy - fontSize1 * 0.2);

      // Line 2: Dark Chocolate Stroke + Metallic Gold Fill
      const y2 = cy + fontSize2 * 1.15;
      const goldGrad2 = ctx.createLinearGradient(0, y2 - fontSize2 * 0.5, 0, y2 + fontSize2 * 0.5);
      goldGrad2.addColorStop(0.00, '#FFE8A3');
      goldGrad2.addColorStop(0.35, '#FFC837');
      goldGrad2.addColorStop(0.70, '#B87B00');
      goldGrad2.addColorStop(1.00, '#3A1F00');

      ctx.font = `700 ${fontSize2}px "Tiro Devanagari Hindi", "Mangal", sans-serif`;
      ctx.strokeStyle = '#1d0b02';
      ctx.lineWidth = fontSize2 * 0.12;
      ctx.lineJoin = 'round';
      ctx.strokeText(line2, W / 2, y2);

      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(229, 160, 13, ${vis * 0.5})`;
      ctx.fillStyle = goldGrad2;
      ctx.fillText(line2, W / 2, y2);

      // Divider Line 2
      const divY2 = y2 + fontSize2 * 0.95;
      drawOrnamentalDivider(W / 2, divY2, Math.min(W * 0.48, 380), vis);

      ctx.restore();
    }

    // ============ POST-PROCESSING ============

    function applyBloom(t: number) {
      const textSceneVis = smoothstep(8.5, 10.5, t);
      const bloomAlpha = lerp(0.55, 0.12, textSceneVis);

      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(5px) brightness(1.2)';
      bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = bloomAlpha;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.restore();
    }

    function applyColorGrade(t: number) {
      const textSceneDarkness = smoothstep(6.8, 8.0, t);
      const gradeAlpha = 0.18 * (1 - textSceneDarkness);
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
      const fade = smoothstep(17.0, 17.5, t);
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${0.55 + fade * 0.4})`);
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
      const camActive = 1 - smoothstep(6.8, 8.0, t);
      cam.zoom = 1 + smoothstep(1.8, 4.0, t) * 0.045 * camActive + cameraShake * 0.005;
      cam.rot = Math.sin(t * 0.11) * 0.004 * camActive + cameraShake * 0.002 * Math.sin(t * 50);
      cam.x = Math.sin(t * 0.25) * 4 * camActive + (Math.random() - 0.5) * cameraShake;
      cam.y = Math.cos(t * 0.2) * 3 * camActive + (Math.random() - 0.5) * cameraShake;
    }

    function applyCamera() {
      ctx.translate(W / 2 + cam.x, H / 2 + cam.y);
      ctx.rotate(cam.rot);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-W / 2, -H / 2);
    }

    // ============ RENDER PIPELINE ============

    function render(t: number, dt: number) {
      spawnDust(t); spawnPetals(t);
      spawnIncenseSmoke(t); spawnBirds(t); launchFireworks(t);
      updateFireworks(dt, t); updateParticles(dt, t); updateCamera(t);

      rctx.clearRect(0, 0, W, H);
      drawRamMandir(t, rctx);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      applyCamera();
      drawBackground(t);
      drawSun(t);                  // STAGE 1: SUNRISE (0.0s - 3.0s STRICT)
      drawDivineLight(t);          // STAGE 1: SUNLIGHT RAYS (0.0s - 3.0s STRICT)
      drawWater(t);                // STAGE 2: SARYU WATER (3.0s - 8.0s STRICT)
      drawRamMandir(t, ctx);       / STAGE 2: FIREWORKS (3.8s - 6.8s)
      updateAndDrawFloatingDiyas(t); // STAGE 2: FLOATING DIYAS (3.0s - 8.0s STRICT)
      drawFogAndHaze(t);
      drawParticles();// STAGE 2: 3D SANDSTONE TEMPLE (3.0s - 8.0s STRICT)
      drawFireworks();             /
      ctx.restore();

      drawTitle(t);                // STAGE 4: 24K GOLD TITLE (9.0s - 17.5s STRICT)
      drawGreeting(t);             // STAGE 5: ROYAL GREETING (10.8s - 17.5s STRICT)

      const fadeIn = 1 - smoothstep(0, 1.2, t);
      const fadeOut = smoothstep(17.0, 17.5, t);
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

      if (t < 2.8) birdsSpawned = false;

      if (t >= 17.5 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 18.0) {
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
