'use client';

import React, { useRef, useEffect } from "react";

interface Props {
  onComplete: () => void;
}

/* ================================================================
   TYPES
   ================================================================ */

enum PType {
  SNOW_BG,
  SNOW_FG,
  SMOKE,
  GOLDEN_SPARK,
  GOLDEN_DUST,
  GOLDEN_GLOW,
  ICE_SPARK,
  ICE_DUST,
  ICE_CRYSTAL,
  EXPLOSION,
  EXPLOSION_GLOW,
  TEXT_PARTICLE,
  CRYSTAL,
  SPARKLE,
  HELIX_GOLD,
  HELIX_ICE,
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  sizeEnd: number;
  r: number;
  g: number;
  b: number;
  a: number;
  aEnd: number;
  type: PType;
  rotation: number;
  rotationSpeed: number;
  targetX: number;
  targetY: number;
  hasTarget: boolean;
  angle: number;
  radius: number;
  angularSpeed: number;
  gravity: number;
  drag: number;
  delay: number;
  phase: number;
  originX: number;
  originY: number;
  reservedForText: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  speed: number;
  offset: number;
}

interface MountainPoint {
  x: number;
  y: number;
}

interface MountainLayer {
  points: MountainPoint[];
  color: string;
  snowColor: string;
  snowLine: number;
}

interface TreeInfo {
  x: number;
  h: number;
  w: number;
  layer: number;
}

/* ================================================================
   CONSTANTS
   ================================================================ */

const DURATION = 13;
const MAX_EFFECTS = 6000;
const MAX_SNOW_BG = 200;
const MAX_SNOW_FG = 200;

const T_MOON = 1.2;
const T_SANTA_ENTER = 2.0;
const T_SANTA_STOP = 3.8;
const T_LEFT_HAND = 5.0;
const T_RIGHT_HAND = 6.0;
const T_HELIX = 7.2;
const T_EXPLOSION = 8.0;
const T_EXPAND = 8.4;
const T_TEXT_FORM = 9.2;
const T_CRYSTAL = 10.0;
const T_SPARKLE = 11.0;
const T_FADE = 12.0;
const T_END = 13.0;

/* ================================================================
   EASING
   ================================================================ */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeInQuad(t: number): number {
  return t * t;
}

/* ================================================================
   MATH UTILS
   ================================================================ */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

/* ================================================================
   PARTICLE FACTORY
   ================================================================ */

function makeParticle(): Particle {
  return {
    active: false,
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 1,
    size: 1, sizeEnd: 1,
    r: 255, g: 255, b: 255,
    a: 1, aEnd: 0,
    type: PType.SNOW_BG,
    rotation: 0, rotationSpeed: 0,
    targetX: 0, targetY: 0,
    hasTarget: false,
    angle: 0, radius: 0, angularSpeed: 0,
    gravity: 0, drag: 0,
    delay: 0, phase: 0,
    originX: 0, originY: 0,
    reservedForText: false,
  };
}

function resetParticle(p: Particle): void {
  p.active = false;
  p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
  p.life = 0; p.maxLife = 1;
  p.size = 1; p.sizeEnd = 1;
  p.r = 255; p.g = 255; p.b = 255;
  p.a = 1; p.aEnd = 0;
  p.type = PType.SNOW_BG;
  p.rotation = 0; p.rotationSpeed = 0;
  p.targetX = 0; p.targetY = 0;
  p.hasTarget = false;
  p.angle = 0; p.radius = 0; p.angularSpeed = 0;
  p.gravity = 0; p.drag = 0;
  p.delay = 0; p.phase = 0;
  p.originX = 0; p.originY = 0;
  p.reservedForText = false;
}

/* ================================================================
   TEXT SAMPLER
   ================================================================ */

function sampleTextPositions(
  text: string,
  maxWidth: number,
  samplingGap: number
): Array<{ x: number; y: number }> {
  const fontSize = Math.min(maxWidth * 0.075, 120);
  const cw = Math.ceil(maxWidth * 0.85);
  const ch = Math.ceil(fontSize * 2);
  const off = document.createElement("canvas");
  off.width = cw;
  off.height = ch;
  const oc = off.getContext("2d")!;
  oc.fillStyle = "#ffffff";
  oc.font = `bold ${fontSize}px Georgia, "Times New Roman", serif`;
  oc.textAlign = "center";
  oc.textBaseline = "middle";
  oc.fillText(text, cw / 2, ch / 2);
  const img = oc.getImageData(0, 0, cw, ch);
  const positions: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < ch; y += samplingGap) {
    for (let x = 0; x < cw; x += samplingGap) {
      const idx = (y * cw + x) * 4;
      if (img.data[idx + 3] > 100) {
        positions.push({
          x: x - cw / 2 + rand(-0.5, 0.5),
          y: y - ch / 2 + rand(-0.5, 0.5),
        });
      }
    }
  }
  return positions;
}

/* ================================================================
   SCENE GENERATORS
   ================================================================ */

function generateStars(count: number, w: number, h: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand(0, w),
      y: rand(0, h * 0.5),
      size: rand(0.5, 2),
      brightness: rand(0.3, 1),
      speed: rand(0.5, 2),
      offset: rand(0, Math.PI * 2),
    });
  }
  return stars;
}

function generateMountainLayer(
  w: number,
  baseY: number,
  peaks: number,
  minH: number,
  maxH: number
): MountainPoint[] {
  const pts: MountainPoint[] = [{ x: -10, y: baseY }];
  const seg = w / peaks;
  for (let i = 0; i < peaks; i++) {
    const px = i * seg + seg * 0.3 + rand(-seg * 0.1, seg * 0.1);
    const py = baseY - rand(minH, maxH);
    pts.push({ x: px, y: py });
    const vx = i * seg + seg * 0.7 + rand(-seg * 0.1, seg * 0.1);
    const vy = baseY - rand(0, minH * 0.3);
    pts.push({ x: vx, y: vy });
  }
  pts.push({ x: w + 10, y: baseY });
  return pts;
}

function generateTrees(count: number, w: number, baseY: number, layer: number): TreeInfo[] {
  const trees: TreeInfo[] = [];
  const minH = layer === 0 ? 20 : layer === 1 ? 35 : 50;
  const maxH = layer === 0 ? 40 : layer === 1 ? 60 : 90;
  for (let i = 0; i < count; i++) {
    trees.push({
      x: rand(-20, w + 20),
      h: rand(minH, maxH),
      w: rand(minH * 0.4, maxH * 0.5),
      layer,
    });
  }
  trees.sort((a, b) => a.h - b.h);
  return trees;
}

/* ================================================================
   DRAWING: SCENE
   ================================================================ */

function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number
): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#050810");
  grad.addColorStop(0.4, "#0c1525");
  grad.addColorStop(0.7, "#142035");
  grad.addColorStop(1, "#1a2840");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
  elapsed: number
): void {
  if (alpha <= 0) return;
  const mx = w * 0.78;
  const my = h * 0.18;
  const mr = Math.min(w, h) * 0.06;
  const pulse = 1 + Math.sin(elapsed * 0.3) * 0.015;

  ctx.save();
  ctx.globalAlpha = alpha;

  for (let i = 6; i >= 1; i--) {
    const r = mr * (1 + i * 0.8) * pulse;
    const grad = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, r);
    const a = 0.03 / i;
    grad.addColorStop(0, `rgba(140, 170, 220, ${a})`);
    grad.addColorStop(0.5, `rgba(100, 140, 200, ${a * 0.5})`);
    grad.addColorStop(1, "rgba(80, 120, 180, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const innerGlow = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 2 * pulse);
  innerGlow.addColorStop(0, "rgba(200, 215, 240, 0.15)");
  innerGlow.addColorStop(0.5, "rgba(160, 185, 220, 0.06)");
  innerGlow.addColorStop(1, "rgba(120, 150, 200, 0)");
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(mx, my, mr * 2 * pulse, 0, Math.PI * 2);
  ctx.fill();

  const moonGrad = ctx.createRadialGradient(
    mx - mr * 0.2, my - mr * 0.2, mr * 0.1,
    mx, my, mr
  );
  moonGrad.addColorStop(0, "#e8e4d8");
  moonGrad.addColorStop(0.6, "#d4cfc0");
  moonGrad.addColorStop(1, "#b8b0a0");
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(mx, my, mr * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.12;
  ctx.fillStyle = "#a09888";
  const craters = [
    { dx: -0.25, dy: 0.15, r: 0.15 },
    { dx: 0.2, dy: -0.2, r: 0.1 },
    { dx: 0.1, dy: 0.3, r: 0.12 },
    { dx: -0.15, dy: -0.3, r: 0.08 },
  ];
  for (const c of craters) {
    ctx.beginPath();
    ctx.arc(mx + c.dx * mr, my + c.dy * mr, c.r * mr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  alpha: number,
  elapsed: number
): void {
  if (alpha <= 0) return;
  ctx.save();
  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(elapsed * s.speed + s.offset);
    const a = alpha * s.brightness * twinkle;
    if (a < 0.02) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = "#d0daf0";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    if (s.size > 1.2) {
      ctx.globalAlpha = a * 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawMountainLayer(
  ctx: CanvasRenderingContext2D,
  layer: MountainLayer,
  w: number,
  h: number,
  alpha: number
): void {
  if (alpha <= 0 || layer.points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.moveTo(layer.points[0].x, layer.points[0].y);
  for (let i = 1; i < layer.points.length; i++) {
    const prev = layer.points[i - 1];
    const curr = layer.points[i];
    const cpx = (prev.x + curr.x) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
  }
  const last = layer.points[layer.points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.lineTo(w + 10, h + 10);
  ctx.lineTo(-10, h + 10);
  ctx.closePath();
  ctx.fillStyle = layer.color;
  ctx.fill();

  if (layer.snowLine > 0) {
    ctx.fillStyle = layer.snowColor;
    ctx.globalAlpha = alpha * 0.6;
    for (let i = 1; i < layer.points.length - 1; i++) {
      const p = layer.points[i];
      if (p.y < layer.points[0].y - layer.snowLine) {
        const snowH = (layer.points[0].y - p.y) * 0.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 15, p.y + snowH);
        ctx.lineTo(p.x + 15, p.y + snowH);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  tree: TreeInfo,
  baseY: number,
  color: string,
  snowAlpha: number
): void {
  const { x, h, w: tw } = tree;
  ctx.fillStyle = color;

  for (let i = 0; i < 3; i++) {
    const layerH = h * (0.5 - i * 0.08);
    const layerW = tw * (1 - i * 0.2);
    const yOff = h * 0.15 * i;
    ctx.beginPath();
    ctx.moveTo(x, baseY - h + yOff);
    ctx.lineTo(x - layerW / 2, baseY - h + layerH + yOff);
    ctx.lineTo(x + layerW / 2, baseY - h + layerH + yOff);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillRect(x - tw * 0.06, baseY - h * 0.15, tw * 0.12, h * 0.18);

  if (snowAlpha > 0) {
    ctx.fillStyle = `rgba(200, 215, 235, ${snowAlpha})`;
    ctx.beginPath();
    ctx.moveTo(x, baseY - h - 1);
    ctx.lineTo(x - tw * 0.18, baseY - h + h * 0.12);
    ctx.lineTo(x + tw * 0.18, baseY - h + h * 0.12);
    ctx.closePath();
    ctx.fill();
  }
}

function drawForest(
  ctx: CanvasRenderingContext2D,
  trees: TreeInfo[],
  baseY: number,
  colors: string[],
  snowAlpha: number,
  alpha: number
): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const tree of trees) {
    drawTree(ctx, tree, baseY, colors[tree.layer], snowAlpha);
  }
  ctx.restore();
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  groundY: number,
  alpha: number
): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const grad = ctx.createLinearGradient(0, groundY, 0, h);
  grad.addColorStop(0, "#c8d4e8");
  grad.addColorStop(0.15, "#b8c4d8");
  grad.addColorStop(0.5, "#9aaaba");
  grad.addColorStop(1, "#7888a0");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(-10, h + 10);
  ctx.lineTo(-10, groundY);
  for (let x = 0; x <= w + 40; x += 40) {
    const y = groundY + Math.sin(x * 0.008) * 8 + Math.sin(x * 0.02) * 3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w + 10, h + 10);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = alpha * 0.15;
  ctx.fillStyle = "#6080b0";
  for (let x = 0; x < w; x += 80) {
    const y = groundY + Math.sin(x * 0.008) * 8 + Math.sin(x * 0.02) * 3;
    ctx.beginPath();
    ctx.ellipse(x + 40, y + 15, 35, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
): void {
  if (intensity <= 0) return;
  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.25,
    w / 2, h / 2, Math.max(w, h) * 0.85
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/* ================================================================
   DRAWING: SANTA FORMATION
   ================================================================ */

/* ★ CHANGE #1 (क): drawReindeer — Black → Natural Brown Colors + Gallop */
function drawReindeer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  legPhase: number,
  headBob: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // 🦌 रेन्डियर की असली खाल और सींग का नेचुरल रंग
  const bodyColor = "#5c4033"; // Deep Brown
  const antlerColor = "#3d2b1f"; // Dark Wood Brown
  const snoutColor = "#d2b48c"; // Light Beige

  const lo1 = Math.sin(legPhase) * 9; // 🚀 व्यापक रनिंग मोशन (Gallop)
  const lo2 = Math.sin(legPhase + Math.PI) * 9;

  // 1. शरीर (Body)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. गर्दन और सिर (Neck & Head)
  ctx.beginPath();
  ctx.moveTo(16, -7);
  ctx.quadraticCurveTo(22, -18, 28, -20 + headBob);
  ctx.lineTo(32, -16 + headBob);
  ctx.quadraticCurveTo(26, -12, 18, -2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(30, -18 + headBob, 8, 6, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // थूथन (Snout)
  ctx.fillStyle = snoutColor;
  ctx.beginPath();
  ctx.ellipse(34, -18 + headBob, 3, 2, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. सींग (Antlers)
  ctx.strokeStyle = antlerColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(27, -24 + headBob);
  ctx.lineTo(21, -38 + headBob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(23, -31 + headBob);
  ctx.lineTo(17, -36 + headBob);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(33, -24 + headBob);
  ctx.lineTo(39, -38 + headBob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(37, -31 + headBob);
  ctx.lineTo(43, -36 + headBob);
  ctx.stroke();

  // 4. पैर (Running Legs)
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(12, 9);
  ctx.lineTo(12 + lo1, 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(17, 9);
  ctx.lineTo(17 + lo2, 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-13, 9);
  ctx.lineTo(-13 + lo2, 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, 9);
  ctx.lineTo(-8 + lo1, 28);
  ctx.stroke();

  // खुर (Hooves)
  ctx.fillStyle = "#1e293b";
  [
    [12 + lo1, 28], [17 + lo2, 28],
    [-13 + lo2, 28], [-8 + lo1, 28],
  ].forEach(([hx, hy]) => {
    ctx.beginPath();
    ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // पूंछ (Tail)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-22, -5);
  ctx.quadraticCurveTo(-28, -12, -24, -3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/* ★ CHANGE #1 (ख): drawSleigh — Black → Bright Red & Gold */
function drawSleigh(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // 🛷 क्रिसमस की लाल गाड़ी और चमचमाते गोल्डन स्किज़ (Runners)
  const sleighRed = "#dc2626";
  const runnerGold = "#fbbf24";

  // 1. गाड़ी की बॉडी
  ctx.fillStyle = sleighRed;
  ctx.beginPath();
  ctx.moveTo(-45, -28);
  ctx.quadraticCurveTo(-50, -8, -44, 2);
  ctx.lineTo(42, 2);
  ctx.quadraticCurveTo(52, -2, 52, -14);
  ctx.lineTo(48, -28);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-45, -28);
  ctx.quadraticCurveTo(-55, -52, -47, -58);
  ctx.lineTo(-33, -58);
  ctx.lineTo(-33, -28);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(48, -28);
  ctx.quadraticCurveTo(55, -35, 52, -42);
  ctx.lineTo(48, -38);
  ctx.lineTo(48, -28);
  ctx.closePath();
  ctx.fill();

  // 2. गाड़ी के नीचे के गोल्डन रनर (Skis)
  ctx.strokeStyle = runnerGold;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-52, 7);
  ctx.quadraticCurveTo(-48, 18, -20, 20);
  ctx.quadraticCurveTo(25, 20, 58, 10);
  ctx.quadraticCurveTo(65, 6, 62, 0);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(62, 0);
  ctx.quadraticCurveTo(72, -8, 66, -16);
  ctx.stroke();

  // गाड़ी की आंतरिक ग्रिल
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -28); ctx.lineTo(-30, 2);
  ctx.moveTo(-10, -28); ctx.lineTo(-10, 2);
  ctx.moveTo(10, -28);  ctx.lineTo(10, 2);
  ctx.moveTo(30, -28);  ctx.lineTo(30, 2);
  ctx.stroke();

  ctx.restore();
}

/* ★ CHANGE #1 (ग): drawSantaBody — Black → Red Coat & White Beard */
function drawSantaBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  leftUp: boolean,
  rightUp: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // 🎅 सान्ता की लाल ड्रेस और सफेद दाढ़ी
  const coatRed = "#ef4444";
  const beardWhite = "#ffffff";
  const beltBlack = "#1e293b";

  // 1. पेट और शरीर (Body)
  ctx.fillStyle = coatRed;
  ctx.beginPath();
  ctx.ellipse(0, -35, 20, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // बेल्ट (Belt)
  ctx.fillStyle = beltBlack;
  ctx.fillRect(-20, -28, 40, 5);
  // गोल्डन बकल (Gold Buckle)
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(-4, -30, 8, 9);

  // 2. सिर (Head)
  ctx.fillStyle = "#fbcfe8"; // Skin tone
  ctx.beginPath();
  ctx.arc(2, -64, 11, 0, Math.PI * 2);
  ctx.fill();

  // सान्ता की टोपी (Hat)
  ctx.fillStyle = coatRed;
  ctx.beginPath();
  ctx.moveTo(-9, -70);
  ctx.quadraticCurveTo(-5, -85, 3, -92);
  ctx.quadraticCurveTo(10, -96, 18, -88);
  ctx.quadraticCurveTo(14, -84, 12, -70);
  ctx.closePath();
  ctx.fill();

  // टोपी का सफेद फर (Hat Fur)
  ctx.fillStyle = beardWhite;
  ctx.beginPath();
  ctx.ellipse(2, -70, 15, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // टोपी का पोम्पम (Pom-pom)
  ctx.beginPath();
  ctx.arc(17, -87, 5, 0, Math.PI * 2);
  ctx.fill();

  // 3. घनी सफेद दाढ़ी (Fluffy White Beard)
  ctx.fillStyle = beardWhite;
  ctx.beginPath();
  ctx.moveTo(-7, -57);
  ctx.quadraticCurveTo(-14, -42, -10, -24);
  ctx.quadraticCurveTo(-5, -18, 0, -20);
  ctx.quadraticCurveTo(5, -18, 10, -24);
  ctx.quadraticCurveTo(14, -42, 9, -57);
  ctx.closePath();
  ctx.fill();

  // जूते (Boots)
  ctx.fillStyle = beltBlack;
  ctx.fillRect(-14, -14, 11, 14);
  ctx.fillRect(5, -14, 11, 14);

  // 4. हाथ (Arms)
  ctx.fillStyle = coatRed;
  ctx.save();
  ctx.translate(-18, -48);
  if (leftUp) ctx.rotate(-2.2);
  else ctx.rotate(-0.35);
  ctx.fillRect(0, -3.5, 24, 7);
  ctx.fillStyle = beardWhite; // दस्ताने
  ctx.beginPath(); ctx.arc(24, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = coatRed;
  ctx.save();
  ctx.translate(18, -48);
  if (rightUp) ctx.rotate(2.2);
  else ctx.rotate(0.35);
  ctx.fillRect(-24, -3.5, 24, 7);
  ctx.fillStyle = beardWhite; // दस्ताने
  ctx.beginPath(); ctx.arc(-24, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawHarness(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  y: number,
  s: number
): void {
  ctx.save();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5 * s;
  ctx.lineCap = "round";
  const midX = (fromX + toX) / 2;
  ctx.beginPath();
  ctx.moveTo(fromX, y);
  ctx.quadraticCurveTo(midX, y + 6 * s, toX, y);
  ctx.stroke();
  ctx.restore();
}

function drawSantaFormation(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  leftUp: boolean,
  rightUp: boolean,
  legPhase: number,
  headBob: number,
  alpha: number
): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  /* ★ CHANGE #2: गाड़ी पीछे (Left), रेन्डियर आगे (Right) */
  const gap = 65 * s;
  // 🚀 गाड़ी पीछे (Left) रहेगी, और चारों रेन्डियर आगे (Right) खींचते हुए दौड़ेंगे
  const sleighX = -gap * 1.5;
  const sleighY = cy + 18 * s;
  const santaX = sleighX - 2 * s;
  const santaY = sleighY - 2 * s;

  const deerX = [-gap * 0.4, 0.6 * gap, 1.6 * gap, 2.6 * gap];
  const deerY = cy + 10 * s;

  for (let i = 0; i < 3; i++) {
    const fromX = cx + deerX[i] + 25 * s;
    const toX = cx + deerX[i + 1] - 22 * s;
    drawHarness(ctx, fromX, toX, deerY - 5 * s, s);
  }
  drawHarness(ctx, cx + deerX[0] - 22 * s, cx + sleighX + 42 * s, (deerY + sleighY) / 2 - 5 * s, s);

  for (let i = 0; i < 4; i++) {
    const lp = legPhase + i * 0.8;
    const hb = headBob * (1 - i * 0.15);
    drawReindeer(ctx, cx + deerX[i], deerY, s, lp, hb);
  }

  drawSleigh(ctx, cx + sleighX, sleighY, s);
  drawSantaBody(ctx, cx + santaX, santaY, s, leftUp, rightUp);

  ctx.restore();
}

/* ★ getHandPositions updated to match CHANGE #2 positions */
function getHandPositions(
  cx: number,
  cy: number,
  s: number,
  leftUp: boolean,
  rightUp: boolean
): { left: { x: number; y: number }; right: { x: number; y: number } } {
  const gap = 65 * s;
  const sleighX = cx - gap * 1.5;
  const sleighY = cy + 18 * s;
  const santaX = sleighX - 2 * s;
  const santaY = sleighY - 2 * s;

  let leftX = santaX - 18 * s;
  let leftY = santaY - 48 * s;
  let rightX = santaX + 18 * s;
  let rightY = santaY - 48 * s;

  if (leftUp) {
    const armLen = 32 * s;
    const angle = -2.2;
    leftX += Math.cos(angle) * armLen + Math.cos(angle - 0.5) * 8 * s;
    leftY += Math.sin(angle) * armLen + Math.sin(angle - 0.5) * 8 * s;
  } else {
    leftX += Math.cos(-0.35) * 24 * s;
    leftY += Math.sin(-0.35) * 24 * s;
  }

  if (rightUp) {
    const armLen = 32 * s;
    const angle = 2.2;
    rightX += Math.cos(angle) * armLen + Math.cos(angle + 0.5) * 8 * s;
    rightY += Math.sin(angle) * armLen + Math.sin(angle + 0.5) * 8 * s;
  } else {
    rightX += Math.cos(0.35) * 24 * s;
    rightY += Math.sin(0.35) * 24 * s;
  }

  return {
    left: { x: leftX, y: leftY },
    right: { x: rightX, y: rightY },
  };
}

/* ================================================================
   DRAWING: PARTICLES
   ================================================================ */

function drawSingleParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  crystalSprite: HTMLCanvasElement | null,
  sparkleSprite: HTMLCanvasElement | null,
  crystalMode: boolean
): void {
  const t = 1 - p.life / p.maxLife;
  const size = lerp(p.size, p.sizeEnd, t);
  const alpha = lerp(p.a, p.aEnd, t);
  if (alpha < 0.01 || size < 0.1) return;

  const color = `rgba(${p.r},${p.g},${p.b},${alpha})`;

  switch (p.type) {
    case PType.SNOW_BG:
    case PType.SNOW_FG: {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PType.SMOKE: {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
      grad.addColorStop(0, `rgba(220,225,235,${alpha * 0.5})`);
      grad.addColorStop(0.6, `rgba(200,210,225,${alpha * 0.2})`);
      grad.addColorStop(1, "rgba(180,190,210,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PType.GOLDEN_SPARK:
    case PType.ICE_SPARK: {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PType.GOLDEN_DUST: {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case PType.GOLDEN_GLOW: {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
      grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha * 0.6})`);
      grad.addColorStop(0.5, `rgba(${p.r},${p.g},${p.b},${alpha * 0.15})`);
      grad.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PType.ICE_DUST: {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.5, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case PType.ICE_CRYSTAL: {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha * 0.6})`;
      ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${alpha * 0.8})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.6, -size * 0.2);
      ctx.lineTo(size * 0.4, size);
      ctx.lineTo(-size * 0.4, size);
      ctx.lineTo(-size * 0.6, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = `rgba(220,240,255,${alpha * 0.5})`;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.15, -size * 0.6);
      ctx.lineTo(size * 0.1, -size * 0.1);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case PType.EXPLOSION: {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PType.EXPLOSION_GLOW: {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
      grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case PType.HELIX_GOLD:
    case PType.HELIX_ICE: {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x - p.vx * 0.02, p.y - p.vy * 0.02, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      break;
    }
    case PType.TEXT_PARTICLE: {
      if (crystalMode && crystalSprite) {
        const cs = size * 2.5;
        ctx.globalAlpha = alpha;
        ctx.drawImage(crystalSprite, p.x - cs / 2, p.y - cs / 2, cs, cs);
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case PType.CRYSTAL: {
      if (crystalSprite) {
        const cs = size * 2.5;
        ctx.globalAlpha = alpha;
        ctx.drawImage(crystalSprite, p.x - cs / 2, p.y - cs / 2, cs, cs);
      }
      break;
    }
    case PType.SPARKLE: {
      if (sparkleSprite) {
        const ss = size * 3;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sparkleSprite, p.x - ss / 2, p.y - ss / 2, ss, ss);
      }
      break;
    }
  }
}

function drawShockwave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  lineWidth: number
): void {
  if (alpha <= 0 || radius <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#c8daf0";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  const grad = ctx.createRadialGradient(x, y, radius * 0.85, x, y, radius * 1.1);
  grad.addColorStop(0, "rgba(180,210,255,0)");
  grad.addColorStop(0.5, `rgba(180,210,255,${alpha * 0.15})`);
  grad.addColorStop(1, "rgba(180,210,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ================================================================
   SPRITE GENERATORS
   ================================================================ */

function createCrystalSprite(): HTMLCanvasElement {
  const size = 16;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cx = size / 2;
  const cy = size / 2;
  const g = c.getContext("2d")!;

  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, cx);
  glow.addColorStop(0, "rgba(140,190,255,0.25)");
  glow.addColorStop(0.6, "rgba(120,170,240,0.08)");
  glow.addColorStop(1, "rgba(100,150,220,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, size, size);

  g.beginPath();
  g.moveTo(cx, 1.5);
  g.lineTo(size - 2, cy);
  g.lineTo(cx, size - 1.5);
  g.lineTo(2, cy);
  g.closePath();
  g.fillStyle = "rgba(180,220,255,0.45)";
  g.fill();
  g.strokeStyle = "rgba(255,200,50,0.65)";
  g.lineWidth = 0.7;
  g.stroke();

  g.beginPath();
  g.moveTo(cx, 3);
  g.lineTo(size - 4, cy);
  g.lineTo(cx, size - 3);
  g.closePath();
  g.fillStyle = "rgba(200,230,255,0.15)";
  g.fill();

  g.strokeStyle = "rgba(210,235,255,0.7)";
  g.lineWidth = 0.5;
  g.beginPath();
  g.moveTo(cx - 2, cy - 3);
  g.lineTo(cx + 1.5, cy + 1);
  g.stroke();

  g.fillStyle = "rgba(255,255,255,0.85)";
  g.beginPath();
  g.arc(cx - 1.5, cy - 2.5, 1, 0, Math.PI * 2);
  g.fill();

  return c;
}

function createSparkleSprite(): HTMLCanvasElement {
  const size = 20;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cx = size / 2;
  const cy = size / 2;
  const g = c.getContext("2d")!;

  g.fillStyle = "rgba(255,220,100,0.9)";
  g.beginPath();
  g.moveTo(cx, 1);
  g.lineTo(cx + 1.5, cy - 1.5);
  g.lineTo(size - 1, cy);
  g.lineTo(cx + 1.5, cy + 1.5);
  g.lineTo(cx, size - 1);
  g.lineTo(cx - 1.5, cy + 1.5);
  g.lineTo(1, cy);
  g.lineTo(cx - 1.5, cy - 1.5);
  g.closePath();
  g.fill();

  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, cx);
  glow.addColorStop(0, "rgba(255,220,100,0.3)");
  glow.addColorStop(1, "rgba(255,220,100,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, size, size);

  return c;
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function ChristmasCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const crystalSprite = createCrystalSprite();
    const sparkleSprite = createSparkleSprite();

    const stars = generateStars(180, w, h);
    const groundY = h * 0.72;
    const mountainLayers: MountainLayer[] = [
      {
        points: generateMountainLayer(w, groundY - h * 0.08, 5, h * 0.06, h * 0.14),
        color: "#141d30",
        snowColor: "rgba(180,200,225,0.5)",
        snowLine: h * 0.08,
      },
      {
        points: generateMountainLayer(w, groundY - h * 0.02, 4, h * 0.04, h * 0.1),
        color: "#0f1722",
        snowColor: "rgba(170,190,215,0.4)",
        snowLine: h * 0.06,
      },
      {
        points: generateMountainLayer(w, groundY + h * 0.02, 6, h * 0.02, h * 0.06),
        color: "#0a0f18",
        snowColor: "rgba(160,180,205,0.3)",
        snowLine: h * 0.04,
      },
    ];
    const treeLayers = [
      { trees: generateTrees(35, w, groundY + h * 0.01, 0), color: "#0d1520", baseY: groundY + h * 0.01 },
      { trees: generateTrees(25, w, groundY + h * 0.04, 1), color: "#0a1018", baseY: groundY + h * 0.04 },
      { trees: generateTrees(18, w, groundY + h * 0.06, 2), color: "#070c14", baseY: groundY + h * 0.06 },
    ];

    const textPositions = sampleTextPositions("MERRY CHRISTMAS", w, 3);
    const textCenterX = w / 2;
    const textCenterY = h * 0.42;
    const textScale = Math.min(w * 0.8 / (w * 0.85), h * 0.15 / 120) || 1;
    const scaledTextPositions = textPositions.map((tp) => ({
      x: tp.x * textScale + textCenterX,
      y: tp.y * textScale + textCenterY,
    }));
    scaledTextPositions.sort((a, b) => a.x - b.x);

    const santaScale = h / 650;
    const santaStartX = -350 * santaScale;
    const santaEndX = w * 0.33;
    const santaY = groundY - h * 0.08;

    const effects: Particle[] = [];
    for (let i = 0; i < MAX_EFFECTS; i++) {
      effects.push(makeParticle());
    }

    function spawnEffect(cfg: Partial<Particle>): Particle | null {
      for (let i = 0; i < effects.length; i++) {
        if (!effects[i].active) {
          resetParticle(effects[i]);
          const p = effects[i];
          p.active = true;
          if (cfg.x !== undefined) p.x = cfg.x;
          if (cfg.y !== undefined) p.y = cfg.y;
          if (cfg.vx !== undefined) p.vx = cfg.vx;
          if (cfg.vy !== undefined) p.vy = cfg.vy;
          if (cfg.life !== undefined) p.life = cfg.life;
          if (cfg.maxLife !== undefined) p.maxLife = cfg.maxLife;
          if (cfg.size !== undefined) p.size = cfg.size;
          if (cfg.sizeEnd !== undefined) p.sizeEnd = cfg.sizeEnd;
          if (cfg.r !== undefined) p.r = cfg.r;
          if (cfg.g !== undefined) p.g = cfg.g;
          if (cfg.b !== undefined) p.b = cfg.b;
          if (cfg.a !== undefined) p.a = cfg.a;
          if (cfg.aEnd !== undefined) p.aEnd = cfg.aEnd;
          if (cfg.type !== undefined) p.type = cfg.type;
          if (cfg.rotation !== undefined) p.rotation = cfg.rotation;
          if (cfg.rotationSpeed !== undefined) p.rotationSpeed = cfg.rotationSpeed;
          if (cfg.targetX !== undefined) p.targetX = cfg.targetX;
          if (cfg.targetY !== undefined) p.targetY = cfg.targetY;
          if (cfg.hasTarget !== undefined) p.hasTarget = cfg.hasTarget;
          if (cfg.angle !== undefined) p.angle = cfg.angle;
          if (cfg.radius !== undefined) p.radius = cfg.radius;
          if (cfg.angularSpeed !== undefined) p.angularSpeed = cfg.angularSpeed;
          if (cfg.gravity !== undefined) p.gravity = cfg.gravity;
          if (cfg.drag !== undefined) p.drag = cfg.drag;
          if (cfg.delay !== undefined) p.delay = cfg.delay;
          if (cfg.phase !== undefined) p.phase = cfg.phase;
          if (cfg.originX !== undefined) p.originX = cfg.originX;
          if (cfg.originY !== undefined) p.originY = cfg.originY;
          if (cfg.reservedForText !== undefined) p.reservedForText = cfg.reservedForText;
          return p;
        }
      }
      return null;
    }

    const snowBg: Particle[] = [];
    const snowFg: Particle[] = [];
    for (let i = 0; i < MAX_SNOW_BG; i++) {
      const p = makeParticle();
      p.active = true;
      p.type = PType.SNOW_BG;
      p.x = rand(0, w);
      p.y = rand(-h, h);
      p.size = rand(0.8, 2);
      p.sizeEnd = p.size;
      p.vy = rand(8, 18);
      p.vx = rand(-3, 3);
      p.angle = rand(0, Math.PI * 2);
      p.a = rand(0.2, 0.5);
      p.aEnd = p.a;
      p.r = 220; p.g = 225; p.b = 240;
      p.maxLife = 999;
      p.life = 999;
      snowBg.push(p);
    }
    for (let i = 0; i < MAX_SNOW_FG; i++) {
      const p = makeParticle();
      p.active = true;
      p.type = PType.SNOW_FG;
      p.x = rand(0, w);
      p.y = rand(-h, h);
      p.size = rand(1.5, 3.5);
      p.sizeEnd = p.size;
      p.vy = rand(20, 40);
      p.vx = rand(-5, 5);
      p.angle = rand(0, Math.PI * 2);
      p.a = rand(0.3, 0.7);
      p.aEnd = p.a;
      p.r = 230; p.g = 235; p.b = 245;
      p.maxLife = 999;
      p.life = 999;
      snowFg.push(p);
    }

    let shockwaveRadius = 0;
    let shockwaveAlpha = 0;
    let shockwave2Radius = 0;
    let shockwave2Alpha = 0;
    let flashAlpha = 0;
    let explosionGlowAlpha = 0;
    let explosionGlowRadius = 0;
    let explosionCenterX = w / 2;
    let explosionCenterY = h * 0.42;

    let goldenSpawned = false;
    let iceSpawned = false;
    let helixTriggered = false;
    let explosionTriggered = false;
    let textFormTriggered = false;
    let crystalTriggered = false;
    let sparkleSpawned = false;
    let breathTimer = 0;
    let goldenSpawnTimer = 0;
    let iceSpawnTimer = 0;

    let prevTime = 0;
    let startTime = 0;
    let initialized = false;

    function updateSnow(p: Particle, dt: number, elapsed: number, speed: number): void {
      p.y += p.vy * speed * dt;
      p.x += Math.sin(p.angle + elapsed * 0.5) * 8 * dt + p.vx * dt;
      if (p.y > h + 20) {
        p.y = rand(-30, -5);
        p.x = rand(-20, w + 20);
      }
      if (p.x < -30) p.x = w + 20;
      if (p.x > w + 30) p.x = -20;
    }

    function updateEffect(p: Particle, dt: number, elapsed: number): void {
      if (!p.active) return;
      if (p.delay > 0) {
        p.delay -= dt;
        return;
      }

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        return;
      }

      p.rotation += p.rotationSpeed * dt;

      switch (p.type) {
        case PType.SMOKE: {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.98;
          p.vy -= 5 * dt;
          break;
        }
        case PType.GOLDEN_SPARK:
        case PType.ICE_SPARK: {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy -= 15 * dt;
          p.vx *= 0.97;
          break;
        }
        case PType.GOLDEN_DUST: {
          p.angle += p.angularSpeed * dt;
          p.radius += 8 * dt;
          p.x += Math.cos(p.angle) * 20 * dt;
          p.y -= 30 * dt;
          p.vy -= 10 * dt;
          break;
        }
        case PType.GOLDEN_GLOW: {
          p.angle += p.angularSpeed * dt;
          p.x += Math.cos(p.angle) * 10 * dt;
          p.y -= 15 * dt;
          break;
        }
        case PType.ICE_DUST:
        case PType.ICE_CRYSTAL: {
          p.angle += p.angularSpeed * dt;
          p.x += p.vx * dt + Math.cos(p.angle) * 15 * dt;
          p.y += p.vy * dt - 20 * dt;
          p.vy += 5 * dt;
          break;
        }
        case PType.HELIX_GOLD:
        case PType.HELIX_ICE: {
          p.phase += 0.75 * dt;
          const t = easeInOutCubic(clamp(p.phase, 0, 1));
          const helixR = 100 * (1 - t);
          const turns = 3.5;
          const dir = p.type === PType.HELIX_GOLD ? 1 : -1;
          const ang = p.angle + t * turns * Math.PI * 2 * dir;
          p.x = lerp(p.originX, explosionCenterX, t) + helixR * Math.cos(ang);
          p.y = lerp(p.originY, explosionCenterY, t) + helixR * Math.sin(ang) * 0.4;
          p.vx = p.x - (lerp(p.originX, explosionCenterX, Math.max(0, p.phase - 0.01 * 0.75)) || p.x);
          p.vy = p.y - (lerp(p.originY, explosionCenterY, Math.max(0, p.phase - 0.01 * 0.75)) || p.y);
          break;
        }
        case PType.EXPLOSION: {
          if (p.hasTarget) break;
          p.vx *= Math.pow(p.drag, dt * 60);
          p.vy *= Math.pow(p.drag, dt * 60);
          p.vy += p.gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        }
        case PType.EXPLOSION_GLOW: {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.95;
          p.vy *= 0.95;
          break;
        }
        case PType.TEXT_PARTICLE:
        case PType.CRYSTAL: {
          if (p.hasTarget) {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const springK = 55;
            const dampC = 12;
            p.vx += (dx * springK - p.vx * dampC) * dt;
            p.vy += (dy * springK - p.vy * dampC) * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }
          break;
        }
        case PType.SPARKLE: {
          const twinkle = 0.5 + 0.5 * Math.sin(elapsed * 4 + p.angle);
          p.a = twinkle;
          break;
        }
        default:
          break;
      }
    }

    function animate(now: number): void {
      if (!initialized) {
        startTime = now;
        prevTime = now;
        initialized = true;
      }

      const elapsed = (now - startTime) / 1000;
      const rawDt = (now - prevTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      prevTime = now;

      ctx.clearRect(0, 0, w, h);

      const sceneAlpha = elapsed >= T_FADE
        ? clamp(1 - (elapsed - T_FADE) / 0.8, 0, 1)
        : 1;
      const snowAlpha = elapsed >= T_FADE + 0.4
        ? clamp(1 - (elapsed - T_FADE - 0.4) / 0.6, 0, 1)
        : clamp(elapsed / 0.5, 0, 1);
      const textAlpha = elapsed >= T_FADE
        ? clamp(1 - (elapsed - T_FADE) / 0.6, 0, 1)
        : 1;
      const santaAlpha = elapsed >= T_FADE
        ? clamp(1 - (elapsed - T_FADE) / 0.5, 0, 1)
        : clamp((elapsed - T_SANTA_ENTER) / 0.3, 0, 1);

      drawSky(ctx, w, h, sceneAlpha);

      const starAlpha = clamp((elapsed - T_MOON) / 1.5, 0, 1) * sceneAlpha;
      drawStars(ctx, stars, starAlpha, elapsed);

      const moonAlpha = clamp((elapsed - T_MOON) / 1.0, 0, 1) * sceneAlpha;
      drawMoon(ctx, w, h, moonAlpha, elapsed);

      for (const ml of mountainLayers) {
        drawMountainLayer(ctx, ml, w, h, sceneAlpha);
      }

      for (let li = 0; li < treeLayers.length - 1; li++) {
        const tl = treeLayers[li];
        drawForest(ctx, tl.trees, tl.baseY, ["#0d1520", "#0a1018", "#070c14"], 0.4 * sceneAlpha, sceneAlpha);
      }

      ctx.save();
      ctx.globalAlpha = snowAlpha;
      for (const sp of snowBg) {
        updateSnow(sp, dt, elapsed, 1);
        drawSingleParticle(ctx, sp, crystalSprite, sparkleSprite, false);
      }
      ctx.restore();

      /* ★ CHANGE #3: तिरछा उतरना (Tilted Descending Path) */
      let santaX = santaStartX;
      // 🚀 आसमान से ज़मीन की तरफ़ तिरखा उतरने के लिए Y कोऑर्डिनेट की गणना
      let santaYAdjusted = santaY - (h * 0.22);
      let leftUp = false;
      let rightUp = false;
      let legPhase = elapsed * 8; // 🚀 पैरों की तेज़ दौड़ने वाली गति (Sprinting Legs)
      let headBob = Math.sin(elapsed * 5) * 2;
      let bounceY = 0;
      let rotationAngle = 0; // ज़मीन पर उतरते समय थोड़ा सा झुकाव

      if (elapsed >= T_SANTA_ENTER && elapsed < T_SANTA_STOP) {
        const t = clamp((elapsed - T_SANTA_ENTER) / (T_SANTA_STOP - T_SANTA_ENTER), 0, 1);
        const et = easeOutCubic(t);
        santaX = lerp(santaStartX, santaEndX, et);
        // 🚀 उतरते समय Y-अक्ष पर कोमल ढलान (Tilted Descending)
        santaYAdjusted = lerp(santaY - (h * 0.35), santaY, et);
        bounceY = -Math.sin(t * Math.PI) * 25 * santaScale;
        rotationAngle = lerp(0.12, 0, et); // उतरते समय गाड़ी का आगे की तरफ झुकाव
      } else if (elapsed >= T_SANTA_STOP) {
        santaX = santaEndX;
        santaYAdjusted = santaY;
        legPhase = Math.sin(elapsed * 0.5) * 0.15;
        headBob = Math.sin(elapsed * 0.7) * 0.8;
        const bt = elapsed - T_SANTA_STOP;
        bounceY = Math.sin(bt * 10) * 4 * santaScale * Math.exp(-bt * 3);
      }

      if (elapsed >= T_LEFT_HAND) leftUp = true;
      if (elapsed >= T_RIGHT_HAND) rightUp = true;

      /* ★ CHANGE #3: झुकाव (slanted landing rotate) के साथ रेंडर करें */
      if (elapsed >= T_SANTA_ENTER) {
        ctx.save();
        ctx.translate(santaX, santaYAdjusted + bounceY);
        ctx.rotate(rotationAngle);
        drawSantaFormation(
          ctx, 0, 0, santaScale,
          leftUp, rightUp, legPhase, headBob, santaAlpha
        );
        ctx.restore();

        if (elapsed >= T_SANTA_STOP && elapsed < T_EXPLOSION) {
          breathTimer += dt;
          if (breathTimer > 0.8) {
            breathTimer = 0;
            const hands = getHandPositions(santaX, santaYAdjusted + bounceY, santaScale, leftUp, rightUp);
            const noseX = hands.right.x;
            const noseY = hands.right.y;
            for (let i = 0; i < 3; i++) {
              spawnEffect({
                type: PType.SMOKE,
                x: noseX + rand(-2, 2),
                y: noseY + rand(-2, 2),
                vx: rand(8, 18) * santaScale,
                vy: rand(-8, -2) * santaScale,
                size: rand(4, 8) * santaScale,
                sizeEnd: rand(15, 25) * santaScale,
                life: rand(1.5, 2.5),
                maxLife: 2.5,
                r: 210, g: 218, b: 230,
                a: 0.5, aEnd: 0,
              });
            }
          }
        }
      }

      {
        const tl = treeLayers[treeLayers.length - 1];
        drawForest(ctx, tl.trees, tl.baseY, ["#0d1520", "#0a1018", "#070c14"], 0.4 * sceneAlpha, sceneAlpha);
      }

      drawGround(ctx, w, h, groundY, sceneAlpha);

      drawVignette(ctx, w, h, 0.45 * sceneAlpha);

      if (elapsed >= T_LEFT_HAND && elapsed < T_HELIX && !helixTriggered) {
        goldenSpawnTimer += dt;
        if (goldenSpawnTimer > 0.03) {
          goldenSpawnTimer = 0;
          const hands = getHandPositions(santaX, santaYAdjusted + bounceY, santaScale, leftUp, rightUp);
          const hx = hands.left.x;
          const hy = hands.left.y;
          const roll = Math.random();
          if (roll < 0.4) {
            spawnEffect({
              type: PType.GOLDEN_SPARK,
              x: hx + rand(-5, 5), y: hy + rand(-5, 5),
              vx: rand(-30, 30), vy: rand(-60, -20),
              size: rand(0.8, 1.8), sizeEnd: 0.3,
              life: rand(0.8, 1.5), maxLife: 1.5,
              r: 255, g: randInt(200, 240), b: randInt(50, 120),
              a: 1, aEnd: 0,
              angle: rand(0, Math.PI * 2),
              angularSpeed: rand(1, 4) * (Math.random() > 0.5 ? 1 : -1),
            });
          } else if (roll < 0.85) {
            spawnEffect({
              type: PType.GOLDEN_DUST,
              x: hx + rand(-8, 8), y: hy + rand(-8, 8),
              vx: rand(-15, 15), vy: rand(-30, -10),
              size: rand(2, 4), sizeEnd: 1,
              life: rand(1.2, 2.2), maxLife: 2.2,
              r: 255, g: randInt(180, 220), b: randInt(40, 90),
              a: 0.9, aEnd: 0,
              angle: rand(0, Math.PI * 2),
              angularSpeed: rand(2, 5) * (Math.random() > 0.5 ? 1 : -1),
            });
          } else {
            spawnEffect({
              type: PType.GOLDEN_GLOW,
              x: hx + rand(-10, 10), y: hy + rand(-10, 10),
              vx: rand(-5, 5), vy: rand(-20, -8),
              size: rand(10, 20), sizeEnd: 25,
              life: rand(1.5, 2.5), maxLife: 2.5,
              r: 255, g: randInt(200, 230), b: randInt(80, 140),
              a: 0.4, aEnd: 0,
              angle: rand(0, Math.PI * 2),
              angularSpeed: rand(0.5, 2),
            });
          }
        }
      }

      if (elapsed >= T_RIGHT_HAND && elapsed < T_HELIX && !helixTriggered) {
        iceSpawnTimer += dt;
        if (iceSpawnTimer > 0.03) {
          iceSpawnTimer = 0;
          const hands = getHandPositions(santaX, santaYAdjusted + bounceY, santaScale, leftUp, rightUp);
          const hx = hands.right.x;
          const hy = hands.right.y;
          const roll = Math.random();
          if (roll < 0.35) {
            spawnEffect({
              type: PType.ICE_SPARK,
              x: hx + rand(-5, 5), y: hy + rand(-5, 5),
              vx: rand(-25, 25), vy: rand(-50, -15),
              size: rand(0.8, 1.5), sizeEnd: 0.2,
              life: rand(0.8, 1.5), maxLife: 1.5,
              r: randInt(180, 220), g: randInt(220, 245), b: 255,
              a: 1, aEnd: 0,
            });
          } else if (roll < 0.7) {
            spawnEffect({
              type: PType.ICE_DUST,
              x: hx + rand(-8, 8), y: hy + rand(-8, 8),
              vx: rand(-20, 20), vy: rand(-30, -10),
              size: rand(2, 4), sizeEnd: 0.8,
              life: rand(1.2, 2.2), maxLife: 2.2,
              r: randInt(170, 210), g: randInt(220, 240), b: 255,
              a: 0.9, aEnd: 0,
              angle: rand(0, Math.PI * 2),
              angularSpeed: rand(1, 3) * (Math.random() > 0.5 ? 1 : -1),
              rotationSpeed: rand(-3, 3),
            });
          } else {
            spawnEffect({
              type: PType.ICE_CRYSTAL,
              x: hx + rand(-10, 10), y: hy + rand(-10, 10),
              vx: rand(-10, 10), vy: rand(-25, -5),
              size: rand(3, 6), sizeEnd: 1.5,
              life: rand(1.5, 2.5), maxLife: 2.5,
              r: randInt(190, 230), g: randInt(230, 250), b: 255,
              a: 0.85, aEnd: 0,
              angle: rand(0, Math.PI * 2),
              angularSpeed: rand(0.5, 2) * (Math.random() > 0.5 ? 1 : -1),
              rotationSpeed: rand(-3, 3),
            });
          }
        }
      }

      if (elapsed >= T_HELIX && !helixTriggered) {
        helixTriggered = true;
        let goldIdx = 0;
        let iceIdx = 0;
        for (const p of effects) {
          if (!p.active) continue;
          if (p.type === PType.GOLDEN_SPARK || p.type === PType.GOLDEN_DUST || p.type === PType.GOLDEN_GLOW) {
            p.originX = p.x;
            p.originY = p.y;
            p.phase = 0;
            p.angle = goldIdx * 0.3;
            p.type = PType.HELIX_GOLD;
            p.life = 2;
            p.maxLife = 2;
            p.a = 1;
            p.aEnd = 1;
            p.size = Math.max(p.size, 1.5);
            p.sizeEnd = p.size;
            goldIdx++;
          } else if (p.type === PType.ICE_SPARK || p.type === PType.ICE_DUST || p.type === PType.ICE_CRYSTAL) {
            p.originX = p.x;
            p.originY = p.y;
            p.phase = 0;
            p.angle = iceIdx * 0.3 + Math.PI;
            p.type = PType.HELIX_ICE;
            p.life = 2;
            p.maxLife = 2;
            p.a = 1;
            p.aEnd = 1;
            p.size = Math.max(p.size, 1.5);
            p.sizeEnd = p.size;
            iceIdx++;
          }
        }
      }

      if (elapsed >= T_EXPLOSION && !explosionTriggered) {
        explosionTriggered = true;
        flashAlpha = 1;
        explosionGlowAlpha = 1;
        explosionGlowRadius = 10;
        for (const p of effects) {
          if (p.type === PType.HELIX_GOLD || p.type === PType.HELIX_ICE) p.active = false;
        }
        const textCount = scaledTextPositions.length;
        const extraCount = Math.min(2000, MAX_EFFECTS - textCount);
        for (let i = 0; i < textCount + extraCount; i++) {
          const ang = rand(0, Math.PI * 2);
          const spd = rand(100, 600);
          const isText = i < textCount;
          let r = 255, g = 240, b = 210;
          const roll = Math.random();
          if (roll < 0.3) { r = 255; g = randInt(200, 240); b = randInt(50, 120); }
          else if (roll < 0.55) { r = randInt(180, 220); g = randInt(225, 245); b = 255; }
          else if (roll < 0.75) { r = 255; g = 255; b = 255; }
          else if (roll < 0.9) { r = 255; g = randInt(140, 180); b = randInt(60, 100); }
          else { r = randInt(140, 180); g = randInt(200, 235); b = 255; }
          spawnEffect({
            type: PType.EXPLOSION,
            x: explosionCenterX + rand(-5, 5),
            y: explosionCenterY + rand(-5, 5),
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            gravity: rand(30, 120),
            drag: rand(0.96, 0.995),
            size: rand(1, 3.5),
            sizeEnd: rand(0.3, 1.5),
            life: rand(1.5, 4),
            maxLife: 4,
            r, g, b,
            a: 1, aEnd: 0,
            reservedForText: isText,
          });
        }
        for (let i = 0; i < 40; i++) {
          const ang = rand(0, Math.PI * 2);
          const spd = rand(20, 100);
          spawnEffect({
            type: PType.EXPLOSION_GLOW,
            x: explosionCenterX,
            y: explosionCenterY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: rand(30, 80),
            sizeEnd: rand(60, 140),
            life: rand(1, 2.5),
            maxLife: 2.5,
            r: 255, g: randInt(220, 245), b: randInt(180, 220),
            a: 0.5, aEnd: 0,
          });
        }
        shockwaveRadius = 5;
        shockwaveAlpha = 0.8;
      }

      if (elapsed >= T_EXPAND && shockwave2Alpha <= 0 && shockwaveAlpha <= 0) {
        shockwave2Radius = 5;
        shockwave2Alpha = 0.5;
      }

      if (shockwaveAlpha > 0) {
        shockwaveRadius += 350 * dt;
        shockwaveAlpha -= 0.6 * dt;
        if (shockwaveAlpha < 0) shockwaveAlpha = 0;
      }
      if (shockwave2Alpha > 0) {
        shockwave2Radius += 250 * dt;
        shockwave2Alpha -= 0.5 * dt;
        if (shockwave2Alpha < 0) shockwave2Alpha = 0;
      }
      if (flashAlpha > 0) {
        flashAlpha -= 3.5 * dt;
        if (flashAlpha < 0) flashAlpha = 0;
      }
      if (explosionGlowAlpha > 0) {
        explosionGlowRadius += 200 * dt;
        explosionGlowAlpha -= 0.8 * dt;
        if (explosionGlowAlpha < 0) explosionGlowAlpha = 0;
      }

      if (elapsed >= T_TEXT_FORM && !textFormTriggered) {
        textFormTriggered = true;
        let textIdx = 0;
        const minX = scaledTextPositions[0]?.x || 0;
        const maxX = scaledTextPositions[scaledTextPositions.length - 1]?.x || 1;
        const rangeX = maxX - minX || 1;
        for (const p of effects) {
          if (!p.active || p.type !== PType.EXPLOSION || !p.reservedForText || textIdx >= scaledTextPositions.length) continue;
          const tgt = scaledTextPositions[textIdx++];
          p.type = PType.TEXT_PARTICLE;
          p.targetX = tgt.x;
          p.targetY = tgt.y;
          p.hasTarget = true;
          p.delay = ((tgt.x - minX) / rangeX) * 0.8;
          p.vx = 0;
          p.vy = 0;
          p.gravity = 0;
          p.drag = 0;
          p.life = 10;
          p.maxLife = 10;
          p.size = rand(1.5, 2.8);
          p.sizeEnd = rand(1.5, 2.8);
          p.r = 255;
          p.g = randInt(200, 240);
          p.b = randInt(50, 120);
          p.a = 1;
          p.aEnd = 1;
        }
        for (const p of effects) {
          if (p.active && p.type === PType.EXPLOSION && !p.reservedForText) {
            p.life = Math.min(p.life, 1.5);
          }
        }
      }

      if (elapsed >= T_CRYSTAL && !crystalTriggered) {
        crystalTriggered = true;
        for (const p of effects) {
          if (p.active && p.type === PType.TEXT_PARTICLE) {
            p.type = PType.CRYSTAL;
            p.size = rand(2.5, 4);
            p.sizeEnd = p.size;
          }
        }
      }

      if (elapsed >= T_SPARKLE && !sparkleSpawned) {
        sparkleSpawned = true;
        for (let i = 0; i < 180; i++) {
          const tp = scaledTextPositions[randInt(0, scaledTextPositions.length - 1)] || { x: w / 2, y: h * 0.42 };
          spawnEffect({
            type: PType.SPARKLE,
            x: tp.x + rand(-40, 40),
            y: tp.y + rand(-40, 40),
            size: rand(1, 3),
            sizeEnd: rand(1, 3),
            life: rand(1, 3),
            maxLife: 3,
            r: 255, g: randInt(210, 240), b: randInt(80, 150),
            a: 1, aEnd: 1,
            angle: rand(0, Math.PI * 2),
          });
        }
      }

      // Update all effects
      for (const p of effects) {
        updateEffect(p, dt, elapsed);
      }

      // Draw explosion glow
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      if (explosionGlowAlpha > 0) {
        const egR = Math.max(1, explosionGlowRadius);
        const egG = ctx.createRadialGradient(explosionCenterX, explosionCenterY, 0, explosionCenterX, explosionCenterY, egR);
        egG.addColorStop(0, `rgba(255,240,200,${explosionGlowAlpha * 0.6})`);
        egG.addColorStop(1, "rgba(180,160,240,0)");
        ctx.fillStyle = egG;
        ctx.beginPath();
        ctx.arc(explosionCenterX, explosionCenterY, egR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw all effects
      const isCrystalMode = elapsed >= T_CRYSTAL;
      for (const p of effects) {
        if (!p.active) continue;
        drawSingleParticle(ctx, p, crystalSprite, sparkleSprite, isCrystalMode);
      }
      ctx.restore();

      // Draw shockwaves
      if (shockwaveAlpha > 0) {
        drawShockwave(ctx, explosionCenterX, explosionCenterY, shockwaveRadius, shockwaveAlpha, 3);
      }
      if (shockwave2Alpha > 0) {
        drawShockwave(ctx, explosionCenterX, explosionCenterY, shockwave2Radius, shockwave2Alpha, 2);
      }

      // Draw flash
      if (flashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = "#fffaf0";
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // Draw foreground snow
      ctx.save();
      ctx.globalAlpha = snowAlpha;
      for (const sp of snowFg) {
        updateSnow(sp, dt, elapsed, 1);
        drawSingleParticle(ctx, sp, crystalSprite, sparkleSprite, false);
      }
      ctx.restore();

      // Fade out to black
      if (elapsed >= T_END - 0.5) {
        ctx.save();
        ctx.globalAlpha = clamp((elapsed - (T_END - 0.5)) / 0.5, 0, 1);
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      if (elapsed >= DURATION && !completedRef.current) {
        completedRef.current = true;
        ctx.clearRect(0, 0, w, h);
        onCompleteRef.current();
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
