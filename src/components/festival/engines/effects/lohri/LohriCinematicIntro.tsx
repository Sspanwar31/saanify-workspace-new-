'use client';

import React, { useRef, useEffect } from 'react';

/* ================================================================
   TYPES
   ================================================================ */

interface Particle {
  active: boolean;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; sizeEnd: number;
  r: number; g: number; b: number;
  a: number; aEnd: number;
  type: number;
  angle: number;
  angularSpeed: number;
  targetX: number; targetY: number;
  hasTarget: boolean;
  delay: number;
  originX: number; originY: number;
  orbitRadius: number;
  orbitSpeed: number;
  reservedForText: boolean;
}

interface Star {
  x: number; y: number;
  size: number;
  brightness: number;
  speed: number;
  phase: number;
}

interface FogBlob {
  x: number; y: number;
  radius: number;
  speed: number;
  alpha: number;
  phase: number;
}

const PT_EMBER = 0;
const PT_SMOKE = 1;
const PT_SPARK = 2;
const PT_ORBITAL = 3;
const PT_TEXT = 4;
const PT_SHIMMER = 5;
const PT_WAVE = 6;

/* ================================================================
   TIMELINE
   ================================================================ */

const DURATION = 13;
const T_EMBERS = 1.5;
const T_FIRE_START = 3.0;
const T_FIRE_GROW = 4.5;
const T_ORBITAL = 6.0;
const T_TEXT_FORM = 8.0;
const T_TEXT_GLOW = 10.0;
const T_FADE = 11.5;
const T_END = 12.5;

const MAX_PARTICLES = 8000;
const MAX_STARS = 160;
const MAX_FOG = 8;

/* ================================================================
   UTILS
   ================================================================ */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function clamp(v: number, mn: number, mx: number): number {
  return v < mn ? mn : v > mx ? mx : v;
}
function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}
function randInt(a: number, b: number): number {
  return Math.floor(rand(a, b + 1));
}
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/* ================================================================
   PARTICLE FACTORY
   ================================================================ */

function makeParticle(): Particle {
  return {
    active: false, x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 1, size: 1, sizeEnd: 1,
    r: 255, g: 200, b: 50, a: 1, aEnd: 0,
    type: PT_EMBER, angle: 0, angularSpeed: 0,
    targetX: 0, targetY: 0, hasTarget: false,
    delay: 0, originX: 0, originY: 0,
    orbitRadius: 0, orbitSpeed: 0, reservedForText: false,
  };
}
function resetParticle(p: Particle): void {
  p.active = false;
  p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
  p.life = 0; p.maxLife = 1; p.size = 1; p.sizeEnd = 1;
  p.r = 255; p.g = 200; p.b = 50; p.a = 1; p.aEnd = 0;
  p.type = PT_EMBER; p.angle = 0; p.angularSpeed = 0;
  p.targetX = 0; p.targetY = 0; p.hasTarget = false;
  p.delay = 0; p.originX = 0; p.originY = 0;
  p.orbitRadius = 0; p.orbitSpeed = 0; p.reservedForText = false;
}

/* ================================================================
   TEXT SAMPLER
   ================================================================ */

function sampleTextPositions(
  text: string, maxW: number, gap: number
): Array<{ x: number; y: number }> {
  const fs = Math.min(maxW * 0.075, 100);
  const cw = Math.ceil(maxW * 0.9);
  const ch = Math.ceil(fs * 2.5);
  const off = document.createElement('canvas');
  off.width = cw; off.height = ch;
  const oc = off.getContext('2d')!;
  oc.fillStyle = '#ffffff';
  oc.font = `bold ${fs}px Georgia, "Times New Roman", serif`;
  oc.textAlign = 'center';
  oc.textBaseline = 'middle';
  oc.fillText(text, cw / 2, ch / 2);
  const img = oc.getImageData(0, 0, cw, ch);
  const pos: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < ch; y += gap) {
    for (let x = 0; x < cw; x += gap) {
      if (img.data[(y * cw + x) * 4 + 3] > 100) {
        pos.push({ x: x - cw / 2 + rand(-0.5, 0.5), y: y - ch / 2 + rand(-0.5, 0.5) });
      }
    }
  }
  return pos;
}

/* ================================================================
   GENERATORS
   ================================================================ */

function generateStars(n: number, w: number, h: number): Star[] {
  return Array.from({ length: n }, () => ({
    x: rand(0, w), y: rand(0, h * 0.45),
    size: rand(0.3, 1.4), brightness: rand(0.15, 0.75),
    speed: rand(0.4, 1.8), phase: rand(0, Math.PI * 2),
  }));
}

function generateFog(n: number, w: number, h: number): FogBlob[] {
  return Array.from({ length: n }, () => ({
    x: rand(-80, w + 80), y: rand(h * 0.35, h * 0.82),
    radius: rand(120, 280), speed: rand(2, 8),
    alpha: rand(0.015, 0.05), phase: rand(0, Math.PI * 2),
  }));
}

/* ================================================================
   DRAWING: BACKGROUND
   ================================================================ */

function drawNightSky(
  ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number
): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgb(${Math.round(lerp(4, 12, warmth))},${Math.round(lerp(6, 8, warmth))},${Math.round(lerp(22, 16, warmth))})`);
  g.addColorStop(0.45, `rgb(${Math.round(lerp(8, 20, warmth))},${Math.round(lerp(12, 12, warmth))},${Math.round(lerp(30, 22, warmth))})`);
  g.addColorStop(1, `rgb(${Math.round(lerp(12, 28, warmth))},${Math.round(lerp(16, 14, warmth))},${Math.round(lerp(24, 16, warmth))})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawStars(
  ctx: CanvasRenderingContext2D, stars: Star[], alpha: number, t: number
): void {
  if (alpha <= 0) return;
  ctx.save();
  for (const s of stars) {
    const tw = 0.35 + 0.65 * Math.sin(t * s.speed + s.phase);
    const a = alpha * s.brightness * tw;
    if (a < 0.015) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#c0d0e8';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    if (s.size > 1) {
      ctx.globalAlpha = a * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFog(
  ctx: CanvasRenderingContext2D, fog: FogBlob[], w: number, h: number, t: number, warmth: number
): void {
  ctx.save();
  const fR = Math.round(lerp(130, 160, warmth));
  const fG = Math.round(lerp(140, 130, warmth));
  const fB = Math.round(lerp(170, 100, warmth));
  for (const f of fog) {
    const x = f.x + Math.sin(t * 0.12 + f.phase) * 60;
    const drift = (t * f.speed * 0.4) % (h * 0.5);
    const y = f.y - drift;
    const g = ctx.createRadialGradient(x, y, 0, x, y, f.radius);
    g.addColorStop(0, `rgba(${fR},${fG},${fB},${f.alpha})`);
    g.addColorStop(1, `rgba(${fR},${fG},${fB},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ================================================================
   DRAWING: GROUND
   ================================================================ */

function drawGround(
  ctx: CanvasRenderingContext2D, w: number, h: number, gY: number, fi: number
): void {
  ctx.save();
  const r = Math.round(lerp(16, 35, fi));
  const g = Math.round(lerp(18, 25, fi));
  const b = Math.round(lerp(24, 16, fi));
  const gr = ctx.createLinearGradient(0, gY, 0, h);
  gr.addColorStop(0, `rgb(${r},${g},${b})`);
  gr.addColorStop(0.4, `rgb(${Math.round(r * 0.6)},${Math.round(g * 0.6)},${Math.round(b * 0.6)})`);
  gr.addColorStop(1, `rgb(${Math.round(r * 0.3)},${Math.round(g * 0.3)},${Math.round(b * 0.3)})`);
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(-10, h + 10);
  ctx.lineTo(-10, gY);
  for (let x = 0; x <= w + 30; x += 25) {
    ctx.lineTo(x, gY + Math.sin(x * 0.012) * 3 + Math.sin(x * 0.028) * 1.5);
  }
  ctx.lineTo(w + 10, h + 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ================================================================
   DRAWING: WOOD LOGS
   ================================================================ */

function drawWoodLogs(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, intensity: number
): void {
  if (intensity < 0.05) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, intensity * 1.5);
  const ll = 42 * s, lw = 6 * s;

  ctx.fillStyle = '#1e1008';
  ctx.strokeStyle = '#120a04';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';

  const logs = [
    { ox: -4 * s, oy: 2 * s, rot: -0.35, len: ll, w: lw },
    { ox: 3 * s, oy: 0, rot: 0.4, len: ll * 0.95, w: lw },
    { ox: 0, oy: -4 * s, rot: 0.08, len: ll * 1.15, w: lw * 0.9 },
    { ox: -2 * s, oy: 4 * s, rot: -0.15, len: ll * 0.8, w: lw * 0.85 },
  ];

  for (const log of logs) {
    ctx.save();
    ctx.translate(cx + log.ox, cy + log.oy);
    ctx.rotate(log.rot);
    ctx.fillStyle = log.oy < 0 ? '#2a1508' : '#1e1008';
    ctx.beginPath();
    ctx.roundRect(-log.len / 2, -log.w / 2, log.len, log.w, log.w / 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/* ================================================================
   DRAWING: FIRE
   ================================================================ */

function drawFire(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, s: number, intensity: number, t: number
): void {
  if (intensity < 0.005) return;
  const fH = 135 * s * intensity;
  const fW = 58 * s * intensity;

  ctx.save();

  /* Ground reflection (normal blend) */
  const rg = ctx.createRadialGradient(cx, cy + 12 * s, 0, cx, cy + 55 * s * intensity, fH * 1.1);
  rg.addColorStop(0, `rgba(255,110,25,${0.12 * intensity})`);
  rg.addColorStop(0.6, `rgba(255,70,10,${0.04 * intensity})`);
  rg.addColorStop(1, 'rgba(255,40,0,0)');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 25 * s, fW * 2.2, fH * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  /* Switch to additive */
  ctx.globalCompositeOperation = 'lighter';

  /* Base ambient glow */
  const bg = ctx.createRadialGradient(cx, cy - fH * 0.18, 0, cx, cy - fH * 0.18, fH * 2.2);
  bg.addColorStop(0, `rgba(255,130,35,${0.22 * intensity})`);
  bg.addColorStop(0.25, `rgba(255,95,18,${0.1 * intensity})`);
  bg.addColorStop(0.55, `rgba(180,55,8,${0.03 * intensity})`);
  bg.addColorStop(1, 'rgba(120,25,0,0)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy - fH * 0.18, fH * 2.2, 0, Math.PI * 2);
  ctx.fill();

  /* Flame tongues */
  const tc = 11;
  for (let i = 0; i < tc; i++) {
    const np = (i / (tc - 1)) - 0.5;
    const xOff = np * fW * 0.95;
    const f1 = Math.sin(t * (3.2 + i * 0.75) + i * 1.8) * 0.22;
    const f2 = Math.sin(t * (5.5 + i * 0.45) + i * 2.6) * 0.14;
    const hMul = 1 - Math.abs(np) * 1.3;
    const tH = fH * (0.65 + f1 + f2) * Math.max(0.15, hMul);
    const tW = fW * (0.18 + Math.sin(t * 2.2 + i * 0.85) * 0.04) * (1 - Math.abs(np) * 0.55);
    const sway = Math.sin(t * 3.8 + i * 1.2) * 4.5 * s;
    const bx = cx + xOff;
    const tx = bx + sway;
    const ty = cy - tH;
    const inner = 1 - Math.abs(np) * 2;

    const fg = ctx.createLinearGradient(bx, cy, tx, ty);
    fg.addColorStop(0, `rgba(${Math.round(lerp(190, 255, inner))},${Math.round(lerp(35, 130, inner))},0,${0.65 * intensity})`);
    fg.addColorStop(0.3, `rgba(255,${Math.round(lerp(70, 170, inner))},${Math.round(lerp(0, 25, inner))},${0.45 * intensity})`);
    fg.addColorStop(0.65, `rgba(255,${Math.round(lerp(140, 215, inner))},${Math.round(lerp(25, 70, inner))},${0.2 * intensity})`);
    fg.addColorStop(1, `rgba(255,${Math.round(lerp(195, 250, inner))},${Math.round(lerp(90, 170, inner))},0)`);

    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(bx - tW, cy);
    ctx.quadraticCurveTo(
      bx - tW * 0.35 + Math.sin(t * 2.8 + i) * 3.5 * s, cy - tH * 0.38,
      tx, ty
    );
    ctx.quadraticCurveTo(
      bx + tW * 0.35 + Math.sin(t * 3.2 + i * 1.4) * 3.5 * s, cy - tH * 0.38,
      bx + tW, cy
    );
    ctx.fill();
  }

  /* Inner core */
  const cg = ctx.createRadialGradient(
    cx + Math.sin(t * 5.5) * 2 * s, cy - fH * 0.12, 0,
    cx, cy - fH * 0.12, fW * 0.55
  );
  cg.addColorStop(0, `rgba(255,255,225,${0.9 * intensity})`);
  cg.addColorStop(0.25, `rgba(255,225,140,${0.55 * intensity})`);
  cg.addColorStop(0.65, `rgba(255,170,55,${0.18 * intensity})`);
  cg.addColorStop(1, 'rgba(255,110,25,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.ellipse(cx, cy - fH * 0.12, fW * 0.55, fH * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  /* Top wisps */
  for (let i = 0; i < 6; i++) {
    const wx = cx + Math.sin(t * 2.5 + i * 2.2) * fW * 0.45;
    const wy = cy - fH * (0.72 + i * 0.05) + Math.sin(t * 3.5 + i * 1.1) * 6 * s;
    const ws = (2.5 + Math.sin(t * 4.5 + i * 1.8) * 1.5) * s;
    const wa = (0.28 - i * 0.04) * intensity;
    if (wa > 0.008) {
      const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, ws);
      wg.addColorStop(0, `rgba(255,195,90,${wa})`);
      wg.addColorStop(1, 'rgba(255,140,45,0)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.arc(wx, wy, ws, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/* ================================================================
   DRAWING: LIGHT RAYS
   ================================================================ */

function drawLightRays(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  intensity: number, t: number, s: number
): void {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = intensity * 0.06;
  const rc = 14;
  const ml = 320 * s;
  for (let i = 0; i < rc; i++) {
    const ba = (i / rc) * Math.PI * 2 + t * 0.08;
    const wb = Math.sin(t * 1.8 + i * 1.6) * 0.04;
    const a = ba + wb;
    const len = ml * (0.55 + Math.sin(t * 1.2 + i * 0.7) * 0.45);
    const sp = 0.025;
    const lg = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    lg.addColorStop(0, 'rgba(255,170,70,0.5)');
    lg.addColorStop(0.5, 'rgba(255,130,35,0.15)');
    lg.addColorStop(1, 'rgba(255,90,15,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a - sp) * len, cy + Math.sin(a - sp) * len);
    ctx.lineTo(cx + Math.cos(a + sp) * len, cy + Math.sin(a + sp) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* ================================================================
   DRAWING: PARTICLES
   ================================================================ */

function drawParticle(
  ctx: CanvasRenderingContext2D, p: Particle, t: number
): void {
  const prog = 1 - p.life / p.maxLife;
  const sz = lerp(p.size, p.sizeEnd, prog);
  const al = lerp(p.a, p.aEnd, prog);
  if (al < 0.004 || sz < 0.15) return;
  const col = `rgba(${p.r},${p.g},${p.b},${al})`;

  switch (p.type) {
    case PT_EMBER: {
      const hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 3.5);
      hg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${al * 0.25})`);
      hg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PT_SMOKE: {
      const sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz);
      sg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${al * 0.35})`);
      sg.addColorStop(0.55, `rgba(${p.r},${p.g},${p.b},${al * 0.12})`);
      sg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PT_SPARK: {
      ctx.globalAlpha = al * 0.35;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x - p.vx * 0.015, p.y - p.vy * 0.015, sz * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = al;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PT_ORBITAL: {
      const og = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 2.5);
      og.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${al * 0.5})`);
      og.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PT_TEXT: {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PT_SHIMMER: {
      const sh = 0.45 + 0.55 * Math.sin(t * 5.5 + p.angle);
      ctx.globalAlpha = al * sh;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case PT_WAVE: {
      ctx.globalAlpha = al;
      ctx.strokeStyle = col;
      ctx.lineWidth = sz;
      ctx.beginPath();
      ctx.arc(p.originX, p.originY, p.orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
  }
}

/* ================================================================
   DRAWING: OVERLAYS
   ================================================================ */

function drawWarmOverlay(
  ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number
): void {
  if (warmth <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = warmth * 0.25;
  ctx.fillStyle = '#ff7818';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawVignette(
  ctx: CanvasRenderingContext2D, w: number, h: number, i: number
): void {
  if (i <= 0) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.18, w / 2, h / 2, Math.max(w, h) * 0.92);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${i})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function LohriCinematicIntro({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const groundY = h * 0.72;
    const fCX = w / 2;
    const fCY = groundY;
    const fS = h / 600;

    const stars = generateStars(MAX_STARS, w, h);
    const fog = generateFog(MAX_FOG, w, h);

    const textPos = sampleTextPositions('HAPPY LOHRI', w, 3);
    const tCX = w / 2;
    const tCY = h * 0.3;
    const tSc = Math.min(w * 0.85 / (w * 0.9), h * 0.11 / 100) || 1;
    const sTP = textPos.map(tp => ({
      x: tp.x * tSc + tCX,
      y: tp.y * tSc + tCY,
    })).sort((a, b) => a.x - b.x);

    const particles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) particles.push(makeParticle());

    function spawn(cfg: Partial<Particle>): Particle | null {
      for (let i = 0; i < particles.length; i++) {
        if (!particles[i].active) {
          resetParticle(particles[i]);
          const p = particles[i];
          p.active = true;
          const keys = Object.keys(cfg) as (keyof Particle)[];
          for (const k of keys) {
            if (cfg[k] !== undefined) (p as Record<string, unknown>)[k] = cfg[k] as never;
          }
          return p;
        }
      }
      return null;
    }

    let emberT = 0, smokeT = 0, sparkT = 0, orbitalT = 0, waveT = 0;
    let prevT = 0, startT = 0, init = false;
    let textFormDone = false, textGlowDone = false, shimmerDone = false;

    function updateP(p: Particle, dt: number, el: number): void {
      if (!p.active) return;
      if (p.delay > 0) { p.delay -= dt; return; }
      p.life -= dt;
      if (p.life <= 0) { p.active = false; return; }
      switch (p.type) {
        case PT_EMBER:
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx += Math.sin(el * 1.8 + p.angle) * 4 * dt;
          p.vy -= 7 * dt;
          break;
        case PT_SMOKE:
          p.x += p.vx * dt + Math.sin(el * 0.7 + p.angle) * 7 * dt;
          p.y += p.vy * dt;
          p.vx *= 0.98;
          p.vy -= 2.5 * dt;
          break;
        case PT_SPARK:
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 12 * dt;
          p.vx *= 0.997;
          break;
        case PT_ORBITAL:
          p.angle += p.angularSpeed * dt;
          p.orbitRadius += 7 * dt;
          p.x = p.originX + Math.cos(p.angle) * p.orbitRadius;
          p.y = p.originY + Math.sin(p.angle) * p.orbitRadius * 0.38;
          break;
        case PT_TEXT:
          if (p.hasTarget) {
            p.vx += ((p.targetX - p.x) * 55 - p.vx * 13) * dt;
            p.vy += ((p.targetY - p.y) * 55 - p.vy * 13) * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }
          break;
        case PT_SHIMMER:
          p.x += Math.sin(el * 2.8 + p.angle) * 0.25;
          p.y += Math.cos(el * 2.2 + p.angle * 1.3) * 0.25;
          break;
        case PT_WAVE:
          p.orbitRadius += 140 * dt;
          p.a -= 0.45 * dt;
          if (p.a <= 0) p.active = false;
          break;
      }
    }

    function animate(now: number): void {
      if (!init) { startT = now; prevT = now; init = true; }
      const el = (now - startT) / 1000;
      const dt = Math.min((now - prevT) / 1000, 0.05);
      prevT = now;

      const fadeOut = smoothstep(T_END, T_END + 0.5, el);
      const fireBase = smoothstep(T_FIRE_START, T_FIRE_GROW + 1.2, el);
      const textDamp = 1 - smoothstep(T_TEXT_GLOW, T_TEXT_GLOW + 1.5, el) * 0.25;
      const fI = fireBase * textDamp * Math.max(0, 1 - smoothstep(T_FADE, T_END, el));
      const warmth = fI;
      const starA = smoothstep(0, 1.5, el) * Math.max(0, 1 - smoothstep(T_FADE, T_END, el));
      const emberI = smoothstep(T_EMBERS, T_EMBERS + 1.5, el) * Math.max(0, 1 - smoothstep(T_FADE, T_END, el));
      const sparkI = smoothstep(T_FIRE_GROW, T_FIRE_GROW + 1, el) * Math.max(0, 1 - smoothstep(T_FADE, T_END, el));
      const orbitalI = smoothstep(T_ORBITAL, T_ORBITAL + 1, el) * Math.max(0, 1 - smoothstep(T_FADE + 0.5, T_END, el));
      const rayI = smoothstep(T_ORBITAL, T_ORBITAL + 2, el) * (1 - smoothstep(T_FADE, T_END, el));

      /* Background */
      drawNightSky(ctx, w, h, warmth);
      drawStars(ctx, stars, starA * 0.65, el);
      drawFog(ctx, fog, w, h, el, warmth);
      drawGround(ctx, w, h, groundY, fI);

      /* Ignition flash */
      if (el >= T_FIRE_START && el < T_FIRE_START + 0.6) {
        const ip = (el - T_FIRE_START) / 0.6;
        const ia = Math.sin(ip * Math.PI) * 0.7;
        const ig = ctx.createRadialGradient(fCX, fCY, 0, fCX, fCY, 35 * fS);
        ig.addColorStop(0, `rgba(255,210,140,${ia})`);
        ig.addColorStop(0.4, `rgba(255,140,45,${ia * 0.35})`);
        ig.addColorStop(1, 'rgba(255,90,15,0)');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(fCX, fCY, 35 * fS, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Wood logs */
      drawWoodLogs(ctx, fCX, fCY, fS, fI);

      /* Fire */
      drawFire(ctx, fCX, fCY, fS, fI, el);

      /* Light rays */
      drawLightRays(ctx, fCX, fCY - 35 * fS, rayI, el, fS);

      /* ── Spawn Embers ── */
      if (el >= T_EMBERS && el < T_END) {
        emberT += dt;
        const rate = lerp(0.06, 0.018, emberI);
        while (emberT > rate) {
          emberT -= rate;
          spawn({
            type: PT_EMBER,
            x: fCX + rand(-w * 0.38, w * 0.38),
            y: groundY + rand(-5, 12),
            vx: rand(-7, 7), vy: rand(-38, -12),
            size: rand(0.7, 1.8), sizeEnd: rand(0.15, 0.5),
            life: rand(2.5, 5.5), maxLife: 5.5,
            r: 255, g: randInt(110, 195), b: randInt(15, 55),
            a: rand(0.55, 1), aEnd: 0,
            angle: rand(0, Math.PI * 2),
          });
        }
      }

      /* ── Spawn Smoke ── */
      if (el >= T_FIRE_START && el < T_END) {
        smokeT += dt;
        while (smokeT > 0.12) {
          smokeT -= 0.12;
          spawn({
            type: PT_SMOKE,
            x: fCX + rand(-12, 12) * fS,
            y: fCY - 35 * fS * fI,
            vx: rand(-4, 4), vy: rand(-22, -8),
            size: rand(18, 35) * fS, sizeEnd: rand(55, 110) * fS,
            life: rand(2.5, 4.5), maxLife: 4.5,
            r: randInt(70, 110), g: randInt(60, 90), b: randInt(50, 70),
            a: rand(0.12, 0.25) * fI, aEnd: 0,
            angle: rand(0, Math.PI * 2),
          });
        }
      }

      /* ── Spawn Sparks ── */
      if (el >= T_FIRE_GROW && el < T_END) {
        sparkT += dt;
        const sr = lerp(0.008, 0.004, sparkI);
        while (sparkT > sr) {
          sparkT -= sr;
          const a = rand(-Math.PI * 0.85, -Math.PI * 0.15);
          const sp = rand(70, 230) * fS;
          spawn({
            type: PT_SPARK,
            x: fCX + rand(-8, 8) * fS,
            y: fCY - 45 * fS * fI,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            size: rand(0.4, 1.3), sizeEnd: rand(0.15, 0.4),
            life: rand(0.5, 1.8), maxLife: 1.8,
            r: 255, g: randInt(175, 235), b: randInt(40, 110),
            a: 1, aEnd: 0,
          });
        }
      }

      /* ── Spawn Orbital ── */
      if (el >= T_ORBITAL && el < T_FADE + 0.5) {
        orbitalT += dt;
        while (orbitalT > 0.04) {
          orbitalT -= 0.04;
          const sa = rand(0, Math.PI * 2);
          const sr = rand(25, 55) * fS;
          spawn({
            type: PT_ORBITAL,
            x: fCX + Math.cos(sa) * sr,
            y: fCY - 28 * fS + Math.sin(sa) * sr * 0.38,
            vx: 0, vy: 0,
            size: rand(0.8, 2.2), sizeEnd: rand(0.4, 0.9),
            life: rand(2, 3.5), maxLife: 3.5,
            r: 255, g: randInt(175, 225), b: randInt(40, 110),
            a: rand(0.6, 1), aEnd: 0,
            angle: sa,
            angularSpeed: rand(0.8, 2.8) * (Math.random() > 0.5 ? 1 : -1),
            originX: fCX, originY: fCY - 28 * fS,
            orbitRadius: sr,
          });
        }
      }

      /* ── Spawn Energy Waves ── */
      if (el >= T_ORBITAL && el < T_FADE) {
        waveT += dt;
        if (waveT > 1.1) {
          waveT = 0;
          spawn({
            type: PT_WAVE, x: 0, y: 0, vx: 0, vy: 0,
            size: rand(1.5, 3.5), sizeEnd: 0.3,
            life: 2.2, maxLife: 2.2,
            r: 255, g: randInt(150, 195), b: randInt(40, 90),
            a: rand(0.25, 0.4), aEnd: 0,
            originX: fCX, originY: fCY - 25 * fS,
            orbitRadius: 18 * fS,
          });
        }
      }

      /* ── Text Formation ── */
      if (el >= T_TEXT_FORM && !textFormDone) {
        textFormDone = true;
        for (const p of particles) {
          if (p.active && (p.type === PT_EMBER || p.type === PT_SPARK)) {
            p.life = Math.min(p.life, 0.4);
          }
        }
        const tC = sTP.length;
        const eC = Math.min(1200, MAX_PARTICLES - tC);
        const mnX = sTP[0]?.x || 0;
        const mxX = sTP[sTP.length - 1]?.x || 1;
        const rX = mxX - mnX || 1;
        for (let i = 0; i < tC + eC; i++) {
          const isT = i < tC;
          const ang = rand(0, Math.PI * 2);
          const spd = rand(40, 180);
          spawn({
            type: PT_TEXT,
            x: fCX + rand(-25, 25) * fS,
            y: fCY - rand(15, 70) * fS,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - rand(40, 130),
            size: rand(0.8, 2.2), sizeEnd: rand(1, 2.2),
            life: rand(3, 5.5), maxLife: 5.5,
            r: 255, g: randInt(150, 210), b: randInt(25, 70),
            a: 1, aEnd: 1,
            hasTarget: isT,
            targetX: isT ? (sTP[i]?.x || 0) : 0,
            targetY: isT ? (sTP[i]?.y || 0) : 0,
            delay: isT ? ((sTP[i]?.x || 0) - mnX) / rX * 0.7 : 0,
            reservedForText: isT,
            angle: rand(0, Math.PI * 2),
          });
        }
        for (const p of particles) {
          if (p.active && p.type === PT_TEXT && !p.reservedForText) {
            p.life = Math.min(p.life, 1.5);
          }
        }
      }

      /* ── Text Glow Phase ── */
      if (el >= T_TEXT_GLOW && !textGlowDone) {
        textGlowDone = true;
        for (const p of particles) {
          if (p.active && p.type === PT_TEXT && p.reservedForText) {
            p.r = 255; p.g = randInt(210, 240); p.b = randInt(110, 170);
            p.size = rand(2, 3.2); p.sizeEnd = rand(2, 3.2);
            p.a = 1; p.aEnd = 1; p.life = 10; p.maxLife = 10;
          }
        }
      }

      /* ── Shimmer ── */
      if (el >= T_TEXT_GLOW && !shimmerDone) {
        shimmerDone = true;
        for (let i = 0; i < 100; i++) {
          const tp = sTP[randInt(0, sTP.length - 1)] || { x: w / 2, y: h * 0.3 };
          spawn({
            type: PT_SHIMMER,
            x: tp.x + rand(-28, 28), y: tp.y + rand(-18, 18),
            vx: 0, vy: 0,
            size: rand(0.7, 1.8), sizeEnd: rand(0.7, 1.8),
            life: rand(1.5, 3), maxLife: 3,
            r: 255, g: randInt(225, 255), b: randInt(170, 220),
            a: rand(0.4, 0.9), aEnd: 1,
            angle: rand(0, Math.PI * 2),
          });
        }
      }

      /* ── Update All ── */
      for (const p of particles) updateP(p, dt, el);

      /* ── Draw Particles (additive) ── */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        if (p.active) drawParticle(ctx, p, el);
      }
      ctx.restore();

      /* ── Text Glow Overlay ── */
      if (el >= T_TEXT_GLOW && el < T_END) {
        const ga = smoothstep(T_TEXT_GLOW, T_TEXT_GLOW + 1.2, el) * (1 - smoothstep(T_FADE, T_END, el));
        if (ga > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = ga * 0.12;
          const tg = ctx.createRadialGradient(tCX, tCY, 0, tCX, tCY, w * 0.38);
          tg.addColorStop(0, 'rgba(255,195,70,0.45)');
          tg.addColorStop(0.5, 'rgba(255,145,35,0.12)');
          tg.addColorStop(1, 'rgba(255,95,15,0)');
          ctx.fillStyle = tg;
          ctx.beginPath();
          ctx.ellipse(tCX, tCY, w * 0.38, h * 0.08, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      /* ── Overlays ── */
      drawWarmOverlay(ctx, w, h, warmth);
      drawVignette(ctx, w, h, 0.48 - warmth * 0.12);

      /* ── Fade Out ── */
      if (fadeOut > 0) {
        ctx.save();
        ctx.globalAlpha = fadeOut;
        ctx.fillStyle = '#040610';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      /* ── Complete ── */
      if (el >= DURATION && !completedRef.current) {
        completedRef.current = true;
        ctx.clearRect(0, 0, w, h);
        onCompleteRef.current();
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
