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
  reservedForText: boolean;
  rotation: number;
  rotSpeed: number;
}

interface Star {
  x: number; y: number;
  size: number; brightness: number;
  speed: number; phase: number;
}

interface SilkThread {
  index: number; total: number;
  color: string; highlight: string;
  width: number; phase: number;
}

/* ================================================================
   PARTICLE TYPES
   ================================================================ */

const PT_PETAL_DOWN = 0;
const PT_PETAL_UP = 1;
const PT_SPARK = 2;
const PT_ORBITAL = 3;
const PT_TEXT = 4;
const PT_CRYSTAL = 5;
const PT_RING = 6;
const PT_GOLD_DUST = 7;

/* ================================================================
   TIMELINE
   ================================================================ */

const T_LIGHT = 1.5;
const T_THREADS = 3.0;
const T_ORBIT = 4.5;
const T_RAKHI = 6.0;
const T_ENERGY = 8.0;
const T_PETALS = 9.0;
const T_TEXT = 10.5;
const T_CRYSTAL = 12.0;
const T_FADE = 13.0;
const T_END = 14.5;
const DURATION = 15;
const MAX_P = 7000;
const MAX_STARS = 120;
const THREAD_COUNT = 14;

/* ================================================================
   UTILS
   ================================================================ */

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp(v: number, mn: number, mx: number): number { return v < mn ? mn : v > mx ? mx : v; }
function rand(a: number, b: number): number { return a + Math.random() * (b - a); }
function randInt(a: number, b: number): number { return Math.floor(rand(a, b + 1)); }
function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }

/* ================================================================
   PARTICLE FACTORY
   ================================================================ */

function mkP(): Particle {
  return {
    active: false, x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 1, size: 1, sizeEnd: 1,
    r: 255, g: 200, b: 100, a: 1, aEnd: 0,
    type: 0, angle: 0, angularSpeed: 0,
    targetX: 0, targetY: 0, hasTarget: false,
    delay: 0, originX: 0, originY: 0,
    orbitRadius: 0, reservedForText: false,
    rotation: 0, rotSpeed: 0,
  };
}
function resetP(p: Particle): void {
  p.active = false; p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
  p.life = 0; p.maxLife = 1; p.size = 1; p.sizeEnd = 1;
  p.r = 255; p.g = 200; p.b = 100; p.a = 1; p.aEnd = 0;
  p.type = 0; p.angle = 0; p.angularSpeed = 0;
  p.targetX = 0; p.targetY = 0; p.hasTarget = false;
  p.delay = 0; p.originX = 0; p.originY = 0;
  p.orbitRadius = 0; p.reservedForText = false;
  p.rotation = 0; p.rotSpeed = 0;
}

/* ================================================================
   TEXT SAMPLER
   ================================================================ */

function sampleText(text: string, maxW: number, gap: number): Array<{ x: number; y: number }> {
  const fs = Math.min(maxW * 0.065, 90);
  const cw = Math.ceil(maxW * 0.92);
  const ch = Math.ceil(fs * 2.8);
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

function genStars(n: number, w: number, h: number): Star[] {
  return Array.from({ length: n }, () => ({
    x: rand(0, w), y: rand(0, h * 0.5),
    size: rand(0.3, 1.3), brightness: rand(0.2, 0.8),
    speed: rand(0.3, 1.5), phase: rand(0, Math.PI * 2),
  }));
}

function genThreads(): SilkThread[] {
  const colors = [
    { c: '#DC143C', h: '#FF6B8A' },
    { c: '#FFD700', h: '#FFED80' },
    { c: '#C41E3A', h: '#FF7090' },
    { c: '#DAA520', h: '#FFE680' },
  ];
  return Array.from({ length: THREAD_COUNT }, (_, i) => {
    const ci = i % colors.length;
    return {
      index: i, total: THREAD_COUNT,
      color: colors[ci].c, highlight: colors[ci].h,
      width: rand(1.8, 3), phase: rand(0, Math.PI * 2),
    };
  });
}

/* ================================================================
   DRAWING: DAWN SKY
   ================================================================ */

function drawDawnSky(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgb(${Math.round(lerp(6, 40, warmth))},${Math.round(lerp(4, 15, warmth))},${Math.round(lerp(28, 55, warmth))})`);
  g.addColorStop(0.3, `rgb(${Math.round(lerp(10, 120, warmth))},${Math.round(lerp(8, 40, warmth))},${Math.round(lerp(35, 75, warmth))})`);
  g.addColorStop(0.58, `rgb(${Math.round(lerp(14, 210, warmth))},${Math.round(lerp(10, 70, warmth))},${Math.round(lerp(30, 85, warmth))})`);
  g.addColorStop(0.72, `rgb(${Math.round(lerp(12, 255, warmth))},${Math.round(lerp(10, 175, warmth))},${Math.round(lerp(22, 70, warmth))})`);
  g.addColorStop(0.85, `rgb(${Math.round(lerp(8, 180, warmth))},${Math.round(lerp(6, 100, warmth))},${Math.round(lerp(18, 50, warmth))})`);
  g.addColorStop(1, `rgb(${Math.round(lerp(5, 30, warmth))},${Math.round(lerp(4, 15, warmth))},${Math.round(lerp(15, 25, warmth))})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (warmth > 0.25) {
    const ga = (warmth - 0.25) / 0.75 * 0.2;
    const hg = ctx.createRadialGradient(w * 0.5, h * 0.62, 0, w * 0.5, h * 0.62, w * 0.55);
    hg.addColorStop(0, `rgba(255,210,120,${ga})`);
    hg.addColorStop(0.5, `rgba(255,160,70,${ga * 0.25})`);
    hg.addColorStop(1, 'rgba(255,100,40,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, w, h);
  }
}

/* ================================================================
   DRAWING: STARS
   ================================================================ */

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], alpha: number, t: number): void {
  if (alpha <= 0) return;
  ctx.save();
  for (const s of stars) {
    const tw = 0.3 + 0.7 * Math.sin(t * s.speed + s.phase);
    const a = alpha * s.brightness * tw;
    if (a < 0.01) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#d0d8f0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ================================================================
   DRAWING: SACRED LIGHT
   ================================================================ */

function drawSacredLight(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number, intensity: number, t: number): void {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 1 + Math.sin(t * 1.5) * 0.08;

  const lg = ctx.createRadialGradient(cx, cy - h * 0.2 * pulse, 0, cx, cy, h * 0.45 * pulse);
  lg.addColorStop(0, `rgba(255,225,140,${0.25 * intensity})`);
  lg.addColorStop(0.25, `rgba(255,195,90,${0.12 * intensity})`);
  lg.addColorStop(0.6, `rgba(255,160,60,${0.04 * intensity})`);
  lg.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.1 * pulse, h * 0.12, h * 0.45 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28 * pulse);
  cg.addColorStop(0, `rgba(255,245,200,${0.45 * intensity})`);
  cg.addColorStop(0.4, `rgba(255,210,120,${0.18 * intensity})`);
  cg.addColorStop(1, 'rgba(255,170,70,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(cx, cy, 28 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ================================================================
   DRAWING: PETAL SHAPE
   ================================================================ */

function drawPetalShape(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, rot: number, color: string, alpha: number): void {
  if (alpha < 0.01 || sz < 0.3) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -sz);
  ctx.bezierCurveTo(sz * 0.55, -sz * 0.75, sz * 0.6, -sz * 0.05, sz * 0.18, sz * 0.42);
  ctx.bezierCurveTo(0, sz * 0.65, 0, sz * 0.65, -sz * 0.18, sz * 0.42);
  ctx.bezierCurveTo(-sz * 0.6, -sz * 0.05, -sz * 0.55, -sz * 0.75, 0, -sz);
  ctx.fill();
  ctx.restore();
}

/* ================================================================
   DRAWING: SILK THREADS
   ================================================================ */

function getThreadAnchor(th: SilkThread, el: number, cx: number, cy: number, s: number, w: number, h: number): { x: number; y: number } {
  const ba = (th.index / th.total) * Math.PI * 2;

  if (el < T_THREADS) return { x: -200, y: -200 };

  if (el < T_ORBIT) {
    const t = smoothstep(T_THREADS, T_ORBIT - 0.3, el);
    const ex = th.index % 2 === 0 ? -40 : w + 40;
    const ey = h * 0.15 + (th.index / th.total) * h * 0.55;
    const nx = cx + Math.cos(ba) * 95 * s;
    const ny = cy + Math.sin(ba) * 38 * s;
    return { x: lerp(ex, nx, t), y: lerp(ey, ny, t) };
  }

  if (el < T_RAKHI) {
    const t = (el - T_ORBIT) / (T_RAKHI - T_ORBIT);
    const r = lerp(95, 28, t) * s;
    const a = ba + el * 0.65;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.42 };
  }

  if (el < T_RAKHI + 2) {
    const t = smoothstep(T_RAKHI, T_RAKHI + 1.8, el);
    const pa = ba + T_RAKHI * 0.65;
    const pr = 28 * s;
    const px = cx + Math.cos(pa) * pr;
    const py = cy + Math.sin(pa) * pr * 0.42;
    const rx = cx + (th.index - th.total / 2 + 0.5) * 4.2 * s;
    const ry = cy + 30 * s;
    return { x: lerp(px, rx, t), y: lerp(py, ry, t) };
  }

  return {
    x: cx + (th.index - th.total / 2 + 0.5) * 4.2 * s,
    y: cy + 30 * s,
  };
}

function drawSilkThreads(ctx: CanvasRenderingContext2D, threads: SilkThread[], el: number, cx: number, cy: number, s: number, w: number, h: number, fadeOut: number): void {
  if (el < T_THREADS) return;
  const threadAlpha = 1 - fadeOut;
  if (threadAlpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = threadAlpha;

  for (const th of threads) {
    const anchor = getThreadAnchor(th, el, cx, cy, s, w, h);
    if (anchor.x < -150) continue;

    const segCount = el < T_RAKHI ? 12 : 7;
    const segLen = el < T_RAKHI ? 11 * s : 5 * s;
    const points: Array<{ x: number; y: number }> = [{ x: anchor.x, y: anchor.y }];

    let px = anchor.x, py = anchor.y;
    let ang = th.phase + el * (el < T_ORBIT ? 0.35 : 0.7);

    for (let i = 0; i < segCount; i++) {
      ang += Math.sin(el * 1.6 + i * 0.75 + th.phase) * 0.45;
      px += Math.cos(ang) * segLen;
      py += Math.sin(ang) * segLen * 0.38 + segLen * 0.22;
      points.push({ x: px, y: py });
    }

    ctx.strokeStyle = th.color;
    ctx.lineWidth = th.width * s * 0.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const p = points[i - 1], c = points[i];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + c.x) / 2, (p.y + c.y) / 2);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();

    ctx.strokeStyle = th.highlight;
    ctx.lineWidth = th.width * s * 0.18;
    ctx.stroke();
  }

  ctx.restore();
}

/* ================================================================
   DRAWING: RAKHI
   ================================================================ */

function drawRakhi(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, progress: number, t: number, fadeOut: number): void {
  if (progress <= 0) return;
  const p = clamp(progress, 0, 1);
  const alpha = (1 - fadeOut) * (el => el);
  if (alpha <= 0) return;

  // Phase 1: Silk threads (0-0.25)
  if (p > 0) {
    const ta = smoothstep(0, 0.25, p) * alpha;
    ctx.save();
    ctx.globalAlpha = ta;
    const tc = 7;
    const ts = 4.5 * s;
    const tl = 38 * s * smoothstep(0, 0.2, p);
    for (let i = 0; i < tc; i++) {
      const tx = cx + (i - (tc - 1) / 2) * ts;
      const ty = cy + 30 * s;
      ctx.strokeStyle = i % 2 === 0 ? '#DC143C' : '#FFD700';
      ctx.lineWidth = 1.6 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      for (let j = 1; j <= 9; j++) {
        const f = j / 9;
        ctx.lineTo(tx + Math.sin(j * 0.9 + t * 2.2 + i * 1.4) * 2.8 * s * (1 - f * 0.4), ty + tl * f);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Phase 2: Medallion (0.2-0.5)
  if (p > 0.2) {
    const ma = smoothstep(0.2, 0.5, p) * alpha;
    ctx.save();
    ctx.globalAlpha = ma;

    const og = ctx.createRadialGradient(cx, cy, 18 * s, cx, cy, 52 * s);
    og.addColorStop(0, 'rgba(255,200,80,0.12)');
    og.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(cx, cy, 52 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 3.5 * s;
    ctx.beginPath();
    ctx.arc(cx, cy, 31 * s, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(cx, cy, 27.5 * s, 0, Math.PI * 2);
    ctx.stroke();

    const fg = ctx.createRadialGradient(cx - 4 * s, cy - 4 * s, 0, cx, cy, 27 * s);
    fg.addColorStop(0, '#DC143C');
    fg.addColorStop(0.5, '#B22222');
    fg.addColorStop(1, '#8B0000');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(cx, cy, 27 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Phase 3: Mandala (0.45-0.7)
  if (p > 0.45) {
    const pa = smoothstep(0.45, 0.7, p) * alpha;
    ctx.save();
    ctx.globalAlpha = pa;
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFD700';

    ctx.beginPath();
    ctx.arc(cx, cy, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 0.9 * s;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * 10 * s, cy + Math.sin(a) * 10 * s, 4 * s, 2 * s, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * 18 * s, cy + Math.sin(a) * 18 * s, 5.5 * s, 2.5 * s, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 18 * s, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 14 * s, cy + Math.sin(a) * 14 * s, 0.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Phase 4: Gemstones (0.65-0.85)
  if (p > 0.65) {
    const ga = smoothstep(0.65, 0.85, p) * alpha;
    ctx.save();
    ctx.globalAlpha = ga;
    const gc = 8;
    for (let i = 0; i < gc; i++) {
      const a = (i / gc) * Math.PI * 2;
      const gx = cx + Math.cos(a) * 29 * s;
      const gy = cy + Math.sin(a) * 29 * s;
      const gs = 3.2 * s;

      const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gs * 2.8);
      gg.addColorStop(0, 'rgba(220,20,60,0.35)');
      gg.addColorStop(1, 'rgba(220,20,60,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(gx, gy, gs * 2.8, 0, Math.PI * 2);
      ctx.fill();

      const gemG = ctx.createRadialGradient(gx - gs * 0.3, gy - gs * 0.3, 0, gx, gy, gs);
      gemG.addColorStop(0, '#FF6B6B');
      gemG.addColorStop(0.5, '#DC143C');
      gemG.addColorStop(1, '#8B0000');
      ctx.fillStyle = gemG;
      ctx.beginPath();
      ctx.arc(gx, gy, gs, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(gx - gs * 0.28, gy - gs * 0.28, gs * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Phase 5: Aura (0.8-1.0)
  if (p > 0.8) {
    const aa = smoothstep(0.8, 1.0, p) * 0.3 * alpha;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ag = ctx.createRadialGradient(cx, cy, 12 * s, cx, cy, 58 * s);
    ag.addColorStop(0, `rgba(255,210,110,${aa})`);
    ag.addColorStop(0.5, `rgba(255,160,65,${aa * 0.3})`);
    ag.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(cx, cy, 58 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ================================================================
   DRAWING: ENERGY RINGS
   ================================================================ */

function drawEnergyRings(ctx: CanvasRenderingContext2D, cx: number, cy: number, el: number, s: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const rs = T_ENERGY + i * 0.35;
    if (el < rs) continue;
    const age = (el - rs) / 2.8;
    if (age > 1) continue;
    const r = Math.max(1, age * 220 * s);
    const al = (1 - age) * 0.45;
    const lw = Math.max(0.5, (1 - age) * 3 * s);

    ctx.strokeStyle = `rgba(255,200,80,${al * 0.25})`;
    ctx.lineWidth = lw * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,210,100,${al})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/* ================================================================
   DRAWING: PARTICLES
   ================================================================ */

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, t: number): void {
  const prog = 1 - p.life / p.maxLife;
  const sz = lerp(p.size, p.sizeEnd, prog);
  const al = lerp(p.a, p.aEnd, prog);
  if (al < 0.005 || sz < 0.15) return;

  switch (p.type) {
    case PT_PETAL_DOWN:
    case PT_PETAL_UP: {
      const cols = ['#FF69B4', '#FF1493', '#DC143C', '#FFB6C1', '#FFD700', '#FFA500'];
      drawPetalShape(ctx, p.x, p.y, sz, p.rotation, cols[p.r % cols.length], al);
      break;
    }
    case PT_SPARK: {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = al * 0.3;
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al * 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = al;
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case PT_ORBITAL: {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = al * 0.3;
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al * 0.25})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = al;
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case PT_TEXT: {
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PT_CRYSTAL: {
      const shimmer = 0.7 + 0.3 * Math.sin(t * 5.5 + p.angle * 3);
      const ca = al * shimmer;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${ca})`;
      ctx.beginPath();
      ctx.moveTo(0, -sz * 1.3);
      ctx.lineTo(sz * 0.65, 0);
      ctx.lineTo(0, sz * 1.3);
      ctx.lineTo(-sz * 0.65, 0);
      ctx.closePath();
      ctx.fill();
      if (sz > 1.2) {
        ctx.fillStyle = `rgba(255,255,255,${ca * 0.35})`;
        ctx.beginPath();
        ctx.arc(-sz * 0.15, -sz * 0.35, sz * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case PT_RING: {
      p.orbitRadius += 160 * (1 / 60);
      p.a -= 0.4 * (1 / 60);
      if (p.a <= 0) { p.active = false; break; }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${p.a})`;
      ctx.lineWidth = Math.max(0.5, p.size);
      ctx.beginPath();
      ctx.arc(p.originX, p.originY, Math.max(1, p.orbitRadius), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case PT_GOLD_DUST: {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const dg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 2);
      dg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${al * 0.4})`);
      dg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
  }
}

/* ================================================================
   DRAWING: OVERLAYS
   ================================================================ */

function drawTextGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, intensity: number): void {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = intensity * 0.08;
  const tg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.35);
  tg.addColorStop(0, 'rgba(180,30,50,0.5)');
  tg.addColorStop(0.4, 'rgba(255,180,60,0.15)');
  tg.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.35, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrystalGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, intensity: number): void {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = intensity * 0.06;
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.3);
  cg.addColorStop(0, 'rgba(220,40,60,0.5)');
  cg.addColorStop(0.3, 'rgba(255,200,80,0.2)');
  cg.addColorStop(0.7, 'rgba(180,30,50,0.1)');
  cg.addColorStop(1, 'rgba(120,20,40,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.3, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, i: number): void {
  if (i <= 0) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.9);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${i})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function RakshaBandhanCinematicIntro({
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

    const cX = w / 2;
    const cY = h * 0.38;
    const sc = h / 650;

    const stars = genStars(MAX_STARS, w, h);
    const threads = genThreads();

    const textPos = sampleText('HAPPY RAKSHA BANDHAN', w, 4);
    const tCX = w / 2;
    const tCY = h * 0.32;
    const tSc = Math.min(w * 0.82 / (w * 0.92), h * 0.095 / 100) || 1;
    const sTP = textPos.map(tp => ({ x: tp.x * tSc + tCX, y: tp.y * tSc + tCY })).sort((a, b) => a.x - b.x);

    const particles: Particle[] = [];
    for (let i = 0; i < MAX_P; i++) particles.push(mkP());

    function spawn(cfg: Partial<Particle>): Particle | null {
      for (let i = 0; i < particles.length; i++) {
        if (!particles[i].active) {
          resetP(particles[i]);
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

    let petalDownT = 0, petalUpT = 0, sparkT = 0, orbitalT = 0;
    let prevT = 0, startT = 0, init = false;
    let textDone = false, crystalDone = false;

    function updateP(p: Particle, dt: number, el: number): void {
      if (!p.active) return;
      if (p.delay > 0) { p.delay -= dt; return; }
      p.life -= dt;
      if (p.life <= 0) { p.active = false; return; }
      p.rotation += p.rotSpeed * dt;

      switch (p.type) {
        case PT_PETAL_DOWN:
          p.x += p.vx * dt + Math.sin(el * 0.8 + p.angle) * 8 * dt;
          p.y += p.vy * dt;
          p.rotation += p.rotSpeed * dt;
          break;
        case PT_PETAL_UP:
          p.x += p.vx * dt + Math.sin(el * 1.2 + p.angle) * 12 * dt;
          p.y += p.vy * dt;
          p.vy -= 15 * dt;
          p.rotation += p.rotSpeed * dt;
          break;
        case PT_SPARK:
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 8 * dt;
          p.vx *= 0.995;
          break;
        case PT_ORBITAL:
          p.angle += p.angularSpeed * dt;
          p.orbitRadius += 12 * dt;
          p.x = p.originX + Math.cos(p.angle) * p.orbitRadius;
          p.y = p.originY + Math.sin(p.angle) * p.orbitRadius * 0.38;
          break;
        case PT_TEXT:
          if (p.hasTarget) {
            p.vx += ((p.targetX - p.x) * 50 - p.vx * 12) * dt;
            p.vy += ((p.targetY - p.y) * 50 - p.vy * 12) * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }
          break;
        case PT_CRYSTAL:
          p.x += Math.sin(el * 2.5 + p.angle) * 0.2;
          p.y += Math.cos(el * 2 + p.angle * 1.3) * 0.2;
          break;
        case PT_GOLD_DUST:
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy -= 10 * dt;
          break;
      }
    }

    function animate(now: number): void {
      if (!init) { startT = now; prevT = now; init = true; }
      const el = (now - startT) / 1000;
      const dt = Math.min((now - prevT) / 1000, 0.05);
      prevT = now;

      const warmth = smoothstep(0, 3.5, el) * (1 - smoothstep(T_FADE, T_END, el));
      const starA = smoothstep(0, 1.2, el) * (1 - smoothstep(2.5, 5, el)) * (1 - smoothstep(T_FADE, T_END, el));
      const lightI = smoothstep(T_LIGHT, T_LIGHT + 1.5, el) * (1 - smoothstep(T_RAKHI + 1, T_FADE, el));
      const rakhiP = smoothstep(T_RAKHI, T_RAKHI + 2.5, el) * (1 - smoothstep(T_TEXT - 0.5, T_FADE, el));
      const fadeOut = smoothstep(T_FADE, T_END, el);
      const globalFade = 1 - smoothstep(T_END - 0.2, T_END, el);

      /* ── Background ── */
      drawDawnSky(ctx, w, h, warmth);
      drawStars(ctx, stars, starA, el);
      drawSacredLight(ctx, cX, cY, h * 0.35, lightI, el);

      /* ── Silk Threads ── */
      drawSilkThreads(ctx, threads, el, cX, cY, sc, w, h, fadeOut);

      /* ── Rakhi ── */
      drawRakhi(ctx, cX, cY, sc, rakhiP, el, fadeOut);

      /* ── Energy Rings ── */
      if (el >= T_ENERGY && el < T_ENERGY + 3) {
        drawEnergyRings(ctx, cX, cY, el, sc);
      }

      /* ── Spawn: Floating Petals ── */
      if (el >= 0.5 && el < T_TEXT) {
        petalDownT += dt;
        const rate = lerp(0.12, 0.08, smoothstep(0.5, T_PETALS, el));
        while (petalDownT > rate) {
          petalDownT -= rate;
          spawn({
            type: PT_PETAL_DOWN,
            x: rand(-30, w + 30), y: rand(-30, h * 0.1),
            vx: rand(-8, 8), vy: rand(12, 28),
            size: rand(3, 7), sizeEnd: rand(2, 5),
            life: rand(4, 8), maxLife: 8,
            r: randInt(0, 5), g: 0, b: 0,
            a: rand(0.35, 0.7), aEnd: 0,
            angle: rand(0, Math.PI * 2),
            rotation: rand(0, Math.PI * 2),
            rotSpeed: rand(-0.5, 0.5),
          });
        }
      }

      /* ── Spawn: Rising Petals ── */
      if (el >= T_PETALS && el < T_FADE) {
        petalUpT += dt;
        while (petalUpT > 0.025) {
          petalUpT -= 0.025;
          const a = rand(-Math.PI * 0.9, -Math.PI * 0.1);
          const sp = rand(30, 100);
          spawn({
            type: PT_PETAL_UP,
            x: cX + rand(-60, 60) * sc, y: cY + rand(-20, 20) * sc,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            size: rand(3, 8), sizeEnd: rand(2, 5),
            life: rand(2, 4.5), maxLife: 4.5,
            r: randInt(0, 5), g: 0, b: 0,
            a: rand(0.5, 0.9), aEnd: 0,
            angle: rand(0, Math.PI * 2),
            rotation: rand(0, Math.PI * 2),
            rotSpeed: rand(-1, 1),
          });
          if (Math.random() < 0.4) {
            spawn({
              type: PT_GOLD_DUST,
              x: cX + rand(-80, 80) * sc, y: cY + rand(-30, 30) * sc,
              vx: rand(-15, 15), vy: rand(-50, -20),
              size: rand(1.5, 3.5), sizeEnd: rand(0.5, 1.5),
              life: rand(1.5, 3), maxLife: 3,
              r: 255, g: randInt(190, 230), b: randInt(50, 100),
              a: rand(0.5, 0.9), aEnd: 0,
            });
          }
        }
      }

      /* ── Spawn: Orbital Sparkles ── */
      if (el >= T_ORBIT && el < T_ENERGY) {
        orbitalT += dt;
        while (orbitalT > 0.035) {
          orbitalT -= 0.035;
          spawn({
            type: PT_ORBITAL,
            x: 0, y: 0,
            vx: 0, vy: 0,
            size: rand(0.8, 2), sizeEnd: rand(0.4, 1),
            life: rand(1.5, 3), maxLife: 3,
            r: 255, g: randInt(180, 225), b: randInt(40, 100),
            a: rand(0.5, 1), aEnd: 0,
            angle: rand(0, Math.PI * 2),
            angularSpeed: rand(1.5, 3.5) * (Math.random() > 0.5 ? 1 : -1),
            originX: cX, originY: cY - 15 * sc,
            orbitRadius: rand(20, 50) * sc,
          });
        }
      }

      /* ── Spawn: Divine Sparks ── */
      if (el >= T_LIGHT && el < T_ORBIT + 1) {
        sparkT += dt;
        const sr = lerp(0.06, 0.02, smoothstep(T_LIGHT, T_ORBIT, el));
        while (sparkT > sr) {
          sparkT -= sr;
          const a = rand(0, Math.PI * 2);
          const d = rand(5, 35) * sc;
          spawn({
            type: PT_SPARK,
            x: cX + Math.cos(a) * d, y: cY + Math.sin(a) * d * 0.5,
            vx: rand(-8, 8), vy: rand(-18, -5),
            size: rand(0.5, 1.5), sizeEnd: rand(0.2, 0.5),
            life: rand(0.8, 2), maxLife: 2,
            r: 255, g: randInt(200, 240), b: randInt(100, 170),
            a: rand(0.4, 1), aEnd: 0,
          });
        }
      }

      /* ── Text Formation ── */
      if (el >= T_TEXT && !textDone) {
        textDone = true;
        for (const p of particles) {
          if (p.active && (p.type === PT_PETAL_DOWN || p.type === PT_PETAL_UP || p.type === PT_GOLD_DUST)) {
            p.life = Math.min(p.life, 0.8);
          }
        }
        const tC = sTP.length;
        const eC = Math.min(800, MAX_P - tC);
        const mnX = sTP[0]?.x || 0;
        const mxX = sTP[sTP.length - 1]?.x || 1;
        const rX = mxX - mnX || 1;
        for (let i = 0; i < tC + eC; i++) {
          const isT = i < tC;
          const ang = rand(0, Math.PI * 2);
          const spd = rand(30, 150);
          spawn({
            type: PT_TEXT,
            x: cX + rand(-20, 20) * sc, y: cY + rand(-15, 15) * sc,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - rand(20, 60),
            size: rand(0.8, 2), sizeEnd: rand(0.8, 2),
            life: rand(2.5, 5), maxLife: 5,
            r: 255, g: randInt(190, 230), b: randInt(50, 100),
            a: 1, aEnd: 1,
            hasTarget: isT,
            targetX: isT ? (sTP[i]?.x || 0) : 0,
            targetY: isT ? (sTP[i]?.y || 0) : 0,
            delay: isT ? ((sTP[i]?.x || 0) - mnX) / rX * 0.8 : 0,
            reservedForText: isT,
            angle: rand(0, Math.PI * 2),
          });
        }
        for (const p of particles) {
          if (p.active && p.type === PT_TEXT && !p.reservedForText) {
            p.life = Math.min(p.life, 1.2);
          }
        }
      }

      /* ── Crystal Text ── */
      if (el >= T_CRYSTAL && !crystalDone) {
        crystalDone = true;
        for (const p of particles) {
          if (p.active && p.type === PT_TEXT && p.reservedForText) {
            const roll = Math.random();
            if (roll < 0.55) {
              p.type = PT_CRYSTAL;
              p.r = randInt(160, 220);
              p.g = randInt(15, 45);
              p.b = randInt(25, 60);
              p.size = rand(2, 3.5);
              p.sizeEnd = rand(2, 3.5);
              p.rotation = rand(0, Math.PI * 2);
              p.rotSpeed = rand(-0.3, 0.3);
            } else if (roll < 0.85) {
              p.type = PT_CRYSTAL;
              p.r = 255;
              p.g = randInt(195, 235);
              p.b = randInt(60, 120);
              p.size = rand(1.8, 3.2);
              p.sizeEnd = rand(1.8, 3.2);
              p.rotation = rand(0, Math.PI * 2);
              p.rotSpeed = rand(-0.3, 0.3);
            } else {
              p.type = PT_CRYSTAL;
              p.r = 255;
              p.g = 255;
              p.b = randInt(200, 240);
              p.size = rand(1.2, 2.5);
              p.sizeEnd = rand(1.2, 2.5);
              p.rotation = rand(0, Math.PI * 2);
              p.rotSpeed = rand(-0.3, 0.3);
            }
            p.a = 1;
            p.aEnd = 1;
            p.life = 10;
            p.maxLife = 10;
          }
        }
        for (let i = 0; i < 80; i++) {
          const tp = sTP[randInt(0, sTP.length - 1)] || { x: w / 2, y: h * 0.32 };
          spawn({
            type: PT_GOLD_DUST,
            x: tp.x + rand(-30, 30), y: tp.y + rand(-20, 20),
            vx: rand(-10, 10), vy: rand(-15, -5),
            size: rand(1, 2.5), sizeEnd: rand(0.3, 1),
            life: rand(1, 2.5), maxLife: 2.5,
            r: 255, g: randInt(210, 245), b: randInt(130, 190),
            a: rand(0.4, 0.8), aEnd: 0,
          });
        }
      }

      /* ── Update All ── */
      for (const p of particles) updateP(p, dt, el);

      /* ── Draw Particles ── */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        if (p.active && p.type !== PT_RING) drawParticle(ctx, p, el);
      }
      ctx.restore();

      /* ── Text Glows ── */
      const textGlowI = smoothstep(T_TEXT + 0.5, T_TEXT + 2, el) * (1 - smoothstep(T_CRYSTAL + 0.5, T_FADE, el));
      if (textGlowI > 0) drawTextGlow(ctx, tCX, tCY, w, textGlowI);
      const crystalGlowI = smoothstep(T_CRYSTAL, T_CRYSTAL + 1.5, el) * (1 - smoothstep(T_FADE, T_END, el));
      if (crystalGlowI > 0) drawCrystalGlow(ctx, tCX, tCY, w, crystalGlowI);

      /* ── Overlays ── */
      drawVignette(ctx, w, h, 0.5 - warmth * 0.1);

      if (fadeOut > 0) {
        ctx.save();
        ctx.globalAlpha = fadeOut;
        ctx.fillStyle = '#0a0515';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      if (globalFade <= 0 && !completedRef.current) {
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
