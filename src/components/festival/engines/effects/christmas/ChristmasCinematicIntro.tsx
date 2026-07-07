'use client';

import React, { useRef, useEffect } from "react";
import ChristmasScene from "./ChristmasScene";
import ChristmasParticles from "./ChristmasParticles";

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

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
    active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
    size: 1, sizeEnd: 1, r: 255, g: 255, b: 255, a: 1, aEnd: 0,
    type: PType.SNOW_BG, rotation: 0, rotationSpeed: 0,
    targetX: 0, targetY: 0, hasTarget: false,
    angle: 0, radius: 0, angularSpeed: 0,
    gravity: 0, drag: 0, delay: 0, phase: 0,
    originX: 0, originY: 0, reservedForText: false,
  };
}

function resetParticle(p: Particle): void {
  p.active = false; p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
  p.life = 0; p.maxLife = 1; p.size = 1; p.sizeEnd = 1;
  p.r = 255; p.g = 255; p.b = 255; p.a = 1; p.aEnd = 0;
  p.type = PType.SNOW_BG; p.rotation = 0; p.rotationSpeed = 0;
  p.targetX = 0; p.targetY = 0; p.hasTarget = false;
  p.angle = 0; p.radius = 0; p.angularSpeed = 0;
  p.gravity = 0; p.drag = 0; p.delay = 0; p.phase = 0;
  p.originX = 0; p.originY = 0; p.reservedForText = false;
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
      x: rand(0, w), y: rand(0, h * 0.5), size: rand(0.5, 2),
      brightness: rand(0.3, 1), speed: rand(0.5, 2), offset: rand(0, Math.PI * 2),
    });
  }
  return stars;
}

function generateMountainLayer(
  w: number, baseY: number, peaks: number, minH: number, maxH: number
): MountainPoint[] {
  const pts: MountainPoint[] = [{ x: -10, y: baseY }];
  const seg = w / peaks;
  for (let i = 0; i < peaks; i++) {
    pts.push({ x: i * seg + seg * 0.3 + rand(-seg * 0.1, seg * 0.1), y: baseY - rand(minH, maxH) });
    pts.push({ x: i * seg + seg * 0.7 + rand(-seg * 0.1, seg * 0.1), y: baseY - rand(0, minH * 0.3) });
  }
  pts.push({ x: w + 10, y: baseY });
  return pts;
}

function generateTrees(count: number, w: number, baseY: number, layer: number): TreeInfo[] {
  const trees: TreeInfo[] = [];
  const minH = layer === 0 ? 20 : layer === 1 ? 35 : 50;
  const maxH = layer === 0 ? 40 : layer === 1 ? 60 : 90;
  for (let i = 0; i < count; i++) {
    trees.push({ x: rand(-20, w + 20), h: rand(minH, maxH), w: rand(minH * 0.4, maxH * 0.5), layer });
  }
  trees.sort((a, b) => a.h - b.h);
  return trees;
}

/* ================================================================
   DRAWING: SCENE
   ================================================================ */

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#050810"); grad.addColorStop(0.4, "#0c1525");
  grad.addColorStop(0.7, "#142035"); grad.addColorStop(1, "#1a2840");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h); ctx.restore();
}

function drawMoon(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number, elapsed: number): void {
  if (alpha <= 0) return;
  const mx = w * 0.78, my = h * 0.18, mr = Math.min(w, h) * 0.06;
  const pulse = 1 + Math.sin(elapsed * 0.3) * 0.015;
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 6; i >= 1; i--) {
    const r = mr * (1 + i * 0.8) * pulse;
    const grad = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, r);
    const a = 0.03 / i;
    grad.addColorStop(0, `rgba(140, 170, 220, ${a})`); grad.addColorStop(0.5, `rgba(100, 140, 200, ${a * 0.5})`);
    grad.addColorStop(1, "rgba(80, 120, 180, 0)"); ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
  }
  const moonGrad = ctx.createRadialGradient(mx - mr * 0.2, my - mr * 0.2, mr * 0.1, mx, my, mr);
  moonGrad.addColorStop(0, "#e8e4d8"); moonGrad.addColorStop(0.6, "#d4cfc0"); moonGrad.addColorStop(1, "#b8b0a0");
  ctx.fillStyle = moonGrad; ctx.beginPath(); ctx.arc(mx, my, mr * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], alpha: number, elapsed: number): void {
  if (alpha <= 0) return;
  ctx.save();
  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(elapsed * s.speed + s.offset);
    const a = alpha * s.brightness * twinkle;
    if (a < 0.02) continue;
    ctx.globalAlpha = a; ctx.fillStyle = "#d0daf0";
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawMountainLayer(ctx: CanvasRenderingContext2D, layer: MountainLayer, w: number, h: number, alpha: number): void {
  if (alpha <= 0 || layer.points.length < 2) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.moveTo(layer.points[0].x, layer.points[0].y);
  for (let i = 1; i < layer.points.length; i++) {
    const prev = layer.points[i - 1], curr = layer.points[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
  }
  const last = layer.points[layer.points.length - 1];
  ctx.lineTo(last.x, last.y); ctx.lineTo(w + 10, h + 10); ctx.lineTo(-10, h + 10); ctx.closePath();
  ctx.fillStyle = layer.color; ctx.fill(); ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, tree: TreeInfo, baseY: number, color: string, snowAlpha: number): void {
  const { x, h, w: tw } = tree; ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const layerH = h * (0.5 - i * 0.08), layerW = tw * (1 - i * 0.2), yOff = h * 0.15 * i;
    ctx.beginPath(); ctx.moveTo(x, baseY - h + yOff); ctx.lineTo(x - layerW / 2, baseY - h + layerH + yOff);
    ctx.lineTo(x + layerW / 2, baseY - h + layerH + yOff); ctx.closePath(); ctx.fill();
  }
  ctx.fillRect(x - tw * 0.06, baseY - h * 0.15, tw * 0.12, h * 0.18);
  if (snowAlpha > 0) {
    ctx.fillStyle = `rgba(200, 215, 235, ${snowAlpha})`;
    ctx.beginPath(); ctx.moveTo(x, baseY - h - 1); ctx.lineTo(x - tw * 0.18, baseY - h + h * 0.12);
    ctx.lineTo(x + tw * 0.18, baseY - h + h * 0.12); ctx.closePath(); ctx.fill();
  }
}

function drawForest(ctx: CanvasRenderingContext2D, trees: TreeInfo[], baseY: number, colors: string[], snowAlpha: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  for (const tree of trees) drawTree(ctx, tree, baseY, colors[tree.layer], snowAlpha);
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(0, groundY, 0, h);
  grad.addColorStop(0, "#c8d4e8"); grad.addColorStop(0.5, "#9aaaba"); grad.addColorStop(1, "#7888a0");
  ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(-10, h + 10); ctx.lineTo(-10, groundY);
  for (let x = 0; x <= w + 40; x += 40) ctx.lineTo(x, groundY + Math.sin(x * 0.008) * 8);
  ctx.lineTo(w + 10, h + 10); ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number): void {
  if (intensity <= 0) return;
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.85);
  grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
}

/* ================================================================
   DRAWING: SANTA FORMATION (100% Canvas)
   ================================================================ */

function drawReindeer(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, legPhase: number, headBob: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "#000000"; ctx.strokeStyle = "#000000"; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const lo1 = Math.sin(legPhase) * 3, lo2 = Math.sin(legPhase + Math.PI) * 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(16, -7); ctx.quadraticCurveTo(22, -18, 28, -20 + headBob);
  ctx.lineTo(32, -16 + headBob); ctx.quadraticCurveTo(26, -12, 18, -2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(30, -18 + headBob, 8, 6, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(27, -24 + headBob); ctx.lineTo(21, -38 + headBob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(33, -24 + headBob); ctx.lineTo(39, -38 + headBob); ctx.stroke();
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(12, 9); ctx.lineTo(12 + lo1, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(17, 9); ctx.lineTo(17 + lo2, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-13, 9); ctx.lineTo(-13 + lo2, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, 9); ctx.lineTo(-8 + lo1, 28); ctx.stroke();
  ctx.restore();
}

function drawSleigh(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "#000000"; ctx.strokeStyle = "#000000"; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-45, -28); ctx.quadraticCurveTo(-50, -8, -44, 2); ctx.lineTo(42, 2);
  ctx.quadraticCurveTo(52, -2, 52, -14); ctx.lineTo(48, -28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-45, -28); ctx.quadraticCurveTo(-55, -52, -47, -58); ctx.lineTo(-33, -58);
  ctx.lineTo(-33, -28); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-52, 7); ctx.quadraticCurveTo(-48, 18, -20, 20);
  ctx.quadraticCurveTo(25, 20, 58, 10); ctx.quadraticCurveTo(65, 6, 62, 0); ctx.stroke();
  ctx.restore();
}

function drawSantaBody(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, leftUp: boolean, rightUp: boolean): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "#000000"; ctx.strokeStyle = "#000000"; ctx.lineCap = "round";
  ctx.beginPath(); ctx.ellipse(0, -35, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-20, -28, 40, 5); ctx.fillRect(-4, -30, 8, 9);
  ctx.beginPath(); ctx.arc(2, -64, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-9, -70); ctx.quadraticCurveTo(-5, -85, 3, -92);
  ctx.quadraticCurveTo(10, -96, 18, -88); ctx.quadraticCurveTo(14, -84, 12, -70); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(2, -70, 15, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(17, -87, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7, -57); ctx.quadraticCurveTo(-14, -42, -10, -24);
  ctx.quadraticCurveTo(-5, -18, 0, -20); ctx.quadraticCurveTo(5, -18, 10, -24);
  ctx.quadraticCurveTo(14, -42, 9, -57); ctx.closePath(); ctx.fill();
  ctx.fillRect(-14, -14, 11, 14); ctx.fillRect(5, -14, 11, 14);
  
  ctx.save(); ctx.translate(-18, -48); ctx.rotate(leftUp ? -2.2 : -0.35);
  ctx.fillRect(0, -3.5, 24, 7); ctx.beginPath(); ctx.arc(24, 0, 5, 0, Math.PI * 2); ctx.fill();
  if (leftUp) { for (let f = -0.4; f <= 0.4; f += 0.2) { ctx.save(); ctx.translate(28, 0); ctx.rotate(f); ctx.fillRect(0, -1.5, 6, 3); ctx.restore(); } }
  ctx.restore();
  
  ctx.save(); ctx.translate(18, -48); ctx.rotate(rightUp ? 2.2 : 0.35);
  ctx.fillRect(-24, -3.5, 24, 7); ctx.beginPath(); ctx.arc(-24, 0, 5, 0, Math.PI * 2); ctx.fill();
  if (rightUp) { for (let f = -0.4; f <= 0.4; f += 0.2) { ctx.save(); ctx.translate(-28, 0); ctx.rotate(f + Math.PI); ctx.fillRect(0, -1.5, 6, 3); ctx.restore(); } }
  ctx.restore();
  ctx.restore();
}

function drawSantaFormation(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, leftUp: boolean, rightUp: boolean, legPhase: number, headBob: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const gap = 65 * s;
  const deerX = [-3 * gap, -2 * gap, -1 * gap, 0];
  const deerY = cy + 10 * s, sleighX = gap * 0.8, sleighY = cy + 18 * s;
  for (let i = 0; i < 4; i++) drawReindeer(ctx, cx + deerX[i], deerY, s, legPhase + i * 0.8, headBob * (1 - i * 0.15));
  drawSleigh(ctx, cx + sleighX, sleighY, s);
  drawSantaBody(ctx, cx + sleighX - 5 * s, sleighY - 2 * s, s, leftUp, rightUp);
  ctx.restore();
}

function getHandPositions(cx: number, cy: number, s: number, leftUp: boolean, rightUp: boolean): { left: { x: number; y: number }; right: { x: number; y: number } } {
  const gap = 65 * s, sleighX = cx + gap * 0.8, sleighY = cy + 18 * s, santaX = sleighX - 5 * s, santaY = sleighY - 2 * s;
  let leftX = santaX - 18 * s, leftY = santaY - 48 * s, rightX = santaX + 18 * s, rightY = santaY - 48 * s;
  if (leftUp) { const a = -2.2, l = 32 * s; leftX += Math.cos(a) * l + Math.cos(a - 0.5) * 8 * s; leftY += Math.sin(a) * l + Math.sin(a - 0.5) * 8 * s; }
  else { leftX += Math.cos(-0.35) * 24 * s; leftY += Math.sin(-0.35) * 24 * s; }
  if (rightUp) { const a = 2.2, l = 32 * s; rightX += Math.cos(a) * l + Math.cos(a + 0.5) * 8 * s; rightY += Math.sin(a) * l + Math.sin(a + 0.5) * 8 * s; }
  else { rightX += Math.cos(0.35) * 24 * s; rightY += Math.sin(0.35) * 24 * s; }
  return { left: { x: leftX, y: leftY }, right: { x: rightX, y: rightY } };
}

/* ================================================================
   DRAWING: PARTICLES
   ================================================================ */

function drawSingleParticle(ctx: CanvasRenderingContext2D, p: Particle, crystalSprite: HTMLCanvasElement | null, sparkleSprite: HTMLCanvasElement | null, crystalMode: boolean): void {
  const t = 1 - p.life / p.maxLife;
  const size = lerp(p.size, p.sizeEnd, t);
  const alpha = lerp(p.a, p.aEnd, t);
  if (alpha < 0.01 || size < 0.1) return;
  const color = `rgba(${p.r},${p.g},${p.b},${alpha})`;

  switch (p.type) {
    case PType.SNOW_BG: case PType.SNOW_FG: case PType.GOLDEN_SPARK: case PType.ICE_SPARK: case PType.EXPLOSION:
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill(); break;
    case PType.SMOKE: case PType.GOLDEN_GLOW: case PType.EXPLOSION_GLOW: {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
      grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha * 0.5})`); grad.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill(); break;
    }
    case PType.HELIX_GOLD: case PType.HELIX_ICE:
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha * 0.3; ctx.beginPath(); ctx.arc(p.x - p.vx * 0.02, p.y - p.vy * 0.02, size * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha; break;
    case PType.TEXT_PARTICLE: {
      if (crystalMode && crystalSprite) { const cs = size * 2.5; ctx.globalAlpha = alpha; ctx.drawImage(crystalSprite, p.x - cs / 2, p.y - cs / 2, cs, cs); }
      else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill(); } break;
    }
    case PType.CRYSTAL: if (crystalSprite) { const cs = size * 2.5; ctx.globalAlpha = alpha; ctx.drawImage(crystalSprite, p.x - cs / 2, p.y - cs / 2, cs, cs); } break;
    case PType.SPARKLE: if (sparkleSprite) { const ss = size * 3; ctx.globalAlpha = alpha; ctx.drawImage(sparkleSprite, p.x - ss / 2, p.y - ss / 2, ss, ss); } break;
    default: break;
  }
}

function drawShockwave(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, lineWidth: number): void {
  if (alpha <= 0 || radius <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = "#c8daf0"; ctx.lineWidth = lineWidth;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

/* ================================================================
   SPRITE GENERATORS
   ================================================================ */

function createCrystalSprite(): HTMLCanvasElement {
  const size = 16, c = document.createElement("canvas"); c.width = size; c.height = size;
  const cx = size / 2, cy = size / 2, g = c.getContext("2d")!;
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, cx);
  glow.addColorStop(0, "rgba(140,190,255,0.25)"); glow.addColorStop(1, "rgba(100,150,220,0)");
  g.fillStyle = glow; g.fillRect(0, 0, size, size);
  g.beginPath(); g.moveTo(cx, 1.5); g.lineTo(size - 2, cy); g.lineTo(cx, size - 1.5); g.lineTo(2, cy); g.closePath();
  g.fillStyle = "rgba(180,220,255,0.45)"; g.fill(); g.strokeStyle = "rgba(255,200,50,0.65)"; g.lineWidth = 0.7; g.stroke();
  return c;
}

function createSparkleSprite(): HTMLCanvasElement {
  const size = 20, c = document.createElement("canvas"); c.width = size; c.height = size;
  const cx = size / 2, cy = size / 2, g = c.getContext("2d")!;
  g.fillStyle = "rgba(255,220,100,0.9)"; g.beginPath(); g.moveTo(cx, 1); g.lineTo(cx + 1.5, cy - 1.5);
  g.lineTo(size - 1, cy); g.lineTo(cx + 1.5, cy + 1.5); g.lineTo(cx, size - 1);
  g.lineTo(cx - 1.5, cy + 1.5); g.lineTo(1, cy); g.lineTo(cx - 1.5, cy - 1.5); g.closePath(); g.fill();
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
    const w = rect.width, h = rect.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const crystalSprite = createCrystalSprite();
    const sparkleSprite = createSparkleSprite();
    const stars = generateStars(180, w, h);
    const groundY = h * 0.72;
    const mountainLayers: MountainLayer[] = [
      { points: generateMountainLayer(w, groundY - h * 0.08, 5, h * 0.06, h * 0.14), color: "#141d30", snowColor: "rgba(180,200,225,0.5)", snowLine: h * 0.08 },
      { points: generateMountainLayer(w, groundY - h * 0.02, 4, h * 0.04, h * 0.1), color: "#0f1722", snowColor: "rgba(170,190,215,0.4)", snowLine: h * 0.06 },
      { points: generateMountainLayer(w, groundY + h * 0.02, 6, h * 0.02, h * 0.06), color: "#0a0f18", snowColor: "rgba(160,180,205,0.3)", snowLine: h * 0.04 },
    ];
    const treeLayers = [
      { trees: generateTrees(35, w, groundY + h * 0.01, 0), baseY: groundY + h * 0.01 },
      { trees: generateTrees(25, w, groundY + h * 0.04, 1), baseY: groundY + h * 0.04 },
      { trees: generateTrees(18, w, groundY + h * 0.06, 2), baseY: groundY + h * 0.06 },
    ];

    const textPositions = sampleTextPositions("MERRY CHRISTMAS", w, 3);
    const textCenterX = w / 2, textCenterY = h * 0.42;
    const textScale = Math.min(w * 0.8 / (w * 0.85), h * 0.15 / 120) || 1;
    const scaledTextPositions = textPositions.map(tp => ({ x: tp.x * textScale + textCenterX, y: tp.y * textScale + textCenterY }));
    scaledTextPositions.sort((a, b) => a.x - b.x);

    const santaScale = h / 650, santaStartX = -350 * santaScale, santaEndX = w * 0.33, santaY = groundY - h * 0.08;

    const effects: Particle[] = [];
    for (let i = 0; i < MAX_EFFECTS; i++) effects.push(makeParticle());

    function spawnEffect(cfg: Partial<Particle>): Particle | null {
      for (let i = 0; i < effects.length; i++) {
        if (!effects[i].active) {
          resetParticle(effects[i]);
          const p = effects[i];
          p.active = true;
          Object.keys(cfg).forEach(key => { (p as any)[key] = (cfg as any)[key]; });
          return p;
        }
      }
      return null;
    }

    const snowBg: Particle[] = [], snowFg: Particle[] = [];
    for (let i = 0; i < MAX_SNOW_BG; i++) {
      const p = makeParticle(); p.active = true; p.type = PType.SNOW_BG;
      p.x = rand(0, w); p.y = rand(-h, h); p.size = rand(0.8, 2); p.sizeEnd = p.size;
      p.vy = rand(8, 18); p.vx = rand(-3, 3); p.angle = rand(0, Math.PI * 2);
      p.a = rand(0.2, 0.5); p.aEnd = p.a; p.r = 220; p.g = 225; p.b = 240; p.maxLife = 999; p.life = 999;
      snowBg.push(p);
    }
    for (let i = 0; i < MAX_SNOW_FG; i++) {
      const p = makeParticle(); p.active = true; p.type = PType.SNOW_FG;
      p.x = rand(0, w); p.y = rand(-h, h); p.size = rand(1.5, 3.5); p.sizeEnd = p.size;
      p.vy = rand(20, 40); p.vx = rand(-5, 5); p.angle = rand(0, Math.PI * 2);
      p.a = rand(0.3, 0.7); p.aEnd = p.a; p.r = 230; p.g = 235; p.b = 245; p.maxLife = 999; p.life = 999;
      snowFg.push(p);
    }

    let shockwaveRadius = 0, shockwaveAlpha = 0, flashAlpha = 0;
    let explosionGlowAlpha = 0, explosionGlowRadius = 0;
    const explosionCenterX = w / 2, explosionCenterY = h * 0.42;
    let helixTriggered = false, explosionTriggered = false, textFormTriggered = false, crystalTriggered = false, sparkleSpawned = false;
    let breathTimer = 0, goldenSpawnTimer = 0, iceSpawnTimer = 0;
    let prevTime = 0, startTime = 0, initialized = false;

    function updateSnow(p: Particle, dt: number, elapsed: number): void {
      p.y += p.vy * dt; p.x += Math.sin(p.angle + elapsed * 0.5) * 8 * dt + p.vx * dt;
      if (p.y > h + 20) { p.y = rand(-30, -5); p.x = rand(-20, w + 20); }
    }

    function updateEffect(p: Particle, dt: number, elapsed: number): void {
      if (!p.active) return;
      if (p.delay > 0) { p.delay -= dt; return; }
      p.life -= dt;
      if (p.life <= 0) { p.active = false; return; }
      p.rotation += p.rotationSpeed * dt;

      if (p.type === PType.HELIX_GOLD || p.type === PType.HELIX_ICE) {
        p.phase += 0.75 * dt;
        const t = easeInOutCubic(clamp(p.phase, 0, 1)), helixR = 100 * (1 - t);
        const dir = p.type === PType.HELIX_GOLD ? 1 : -1;
        const ang = p.angle + t * 3.5 * Math.PI * 2 * dir;
        p.x = lerp(p.originX, explosionCenterX, t) + helixR * Math.cos(ang);
        p.y = lerp(p.originY, explosionCenterY, t) + helixR * Math.sin(ang) * 0.4;
        p.vx = p.x - (lerp(p.originX, explosionCenterX, Math.max(0, p.phase - 0.01)) || p.x);
        p.vy = p.y - (lerp(p.originY, explosionCenterY, Math.max(0, p.phase - 0.01)) || p.y);
      } else if (p.type === PType.EXPLOSION && !p.hasTarget) {
        p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60);
        p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      } else if (p.type === PType.TEXT_PARTICLE || p.type === PType.CRYSTAL) {
        if (p.hasTarget) {
          p.vx += ((p.targetX - p.x) * 55 - p.vx * 12) * dt;
          p.vy += ((p.targetY - p.y) * 55 - p.vy * 12) * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
        }
      } else if (p.type === PType.SPARKLE) {
        p.a = 0.5 + 0.5 * Math.sin(elapsed * 4 + p.angle);
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97;
      }
    }

    function animate(now: number): void {
      if (!initialized) { startTime = now; prevTime = now; initialized = true; }
      const elapsed = (now - startTime) / 1000;
      const dt = Math.min((now - prevTime) / 1000, 0.05); prevTime = now;

      ctx.clearRect(0, 0, w, h);
      const sceneAlpha = elapsed >= T_FADE ? clamp(1 - (elapsed - T_FADE) / 0.8, 0, 1) : 1;
      const snowAlpha = elapsed >= T_FADE + 0.4 ? clamp(1 - (elapsed - T_FADE - 0.4) / 0.6, 0, 1) : clamp(elapsed / 0.5, 0, 1);
      const santaAlpha = elapsed >= T_FADE ? clamp(1 - (elapsed - T_FADE) / 0.5, 0, 1) : clamp((elapsed - T_SANTA_ENTER) / 0.3, 0, 1);

      drawSky(ctx, w, h, sceneAlpha);
      drawStars(ctx, stars, clamp((elapsed - T_MOON) / 1.5, 0, 1) * sceneAlpha, elapsed);
      drawMoon(ctx, w, h, clamp((elapsed - T_MOON) / 1.0, 0, 1) * sceneAlpha, elapsed);
      mountainLayers.forEach(ml => drawMountainLayer(ctx, ml, w, h, sceneAlpha));
      
      for (let li = 0; li < treeLayers.length - 1; li++) {
        const tl = treeLayers[li];
        drawForest(ctx, tl.trees, tl.baseY, ["#0d1520", "#0a1018", "#070c14"], 0.4 * sceneAlpha, sceneAlpha);
      }

      ctx.save(); ctx.globalAlpha = snowAlpha;
      for (const sp of snowBg) { updateSnow(sp, dt, elapsed); drawSingleParticle(ctx, sp, crystalSprite, sparkleSprite, false); }
      ctx.restore();

      let santaX = santaStartX, leftUp = elapsed >= T_LEFT_HAND, rightUp = elapsed >= T_RIGHT_HAND;
      let legPhase = elapsed * 4, headBob = Math.sin(elapsed * 3) * 1.5, bounceY = 0;

      if (elapsed >= T_SANTA_ENTER && elapsed < T_SANTA_STOP) {
        const t = clamp((elapsed - T_SANTA_ENTER) / (T_SANTA_STOP - T_SANTA_ENTER), 0, 1);
        santaX = lerp(santaStartX, santaEndX, easeOutCubic(t));
        bounceY = -Math.sin(t * Math.PI) * 15 * santaScale;
      } else if (elapsed >= T_SANTA_STOP) {
        santaX = santaEndX; legPhase = Math.sin(elapsed * 0.5) * 0.15; headBob = Math.sin(elapsed * 0.7) * 0.8;
        bounceY = Math.sin((elapsed - T_SANTA_STOP) * 10) * 4 * santaScale * Math.exp(-(elapsed - T_SANTA_STOP) * 3);
      }

      if (elapsed >= T_SANTA_ENTER) {
        drawSantaFormation(ctx, santaX, santaY + bounceY, santaScale, leftUp, rightUp, legPhase, headBob, santaAlpha);
        if (elapsed >= T_SANTA_STOP && elapsed < T_EXPLOSION) {
          breathTimer += dt;
          if (breathTimer > 0.8) {
            breathTimer = 0;
            for (let i = 0; i < 3; i++) spawnEffect({ type: PType.SMOKE, x: santaX + 38 * santaScale + rand(-2, 2), y: santaY - 8 * santaScale + rand(-2, 2), vx: rand(8, 18) * santaScale, vy: rand(-8, -2) * santaScale, size: rand(4, 8) * santaScale, sizeEnd: rand(15, 25) * santaScale, life: rand(1.5, 2.5), maxLife: 2.5, r: 210, g: 218, b: 230, a: 0.5, aEnd: 0 });
          }
        }
      }

      const lastTree = treeLayers[treeLayers.length - 1];
      drawForest(ctx, lastTree.trees, lastTree.baseY, ["#0d1520", "#0a1018", "#070c14"], 0.4 * sceneAlpha, sceneAlpha);
      drawGround(ctx, w, h, groundY, sceneAlpha);
      drawVignette(ctx, w, h, 0.45 * sceneAlpha);

      if (elapsed >= T_LEFT_HAND && elapsed < T_HELIX && !helixTriggered) {
        goldenSpawnTimer += dt;
        if (goldenSpawnTimer > 0.03) {
          goldenSpawnTimer = 0;
          const hands = getHandPositions(santaX, santaY + bounceY, santaScale, leftUp, rightUp);
          for (let i = 0; i < 3; i++) spawnEffect({ type: PType.GOLDEN_SPARK, x: hands.left.x + rand(-5, 5), y: hands.left.y + rand(-5, 5), vx: rand(-30, 30), vy: rand(-60, -20), size: rand(0.8, 1.8), sizeEnd: 0.3, life: rand(0.8, 1.5), maxLife: 1.5, r: 255, g: randInt(200, 240), b: randInt(50, 120), a: 1, aEnd: 0 });
        }
      }
      if (elapsed >= T_RIGHT_HAND && elapsed < T_HELIX && !helixTriggered) {
        iceSpawnTimer += dt;
        if (iceSpawnTimer > 0.03) {
          iceSpawnTimer = 0;
          const hands = getHandPositions(santaX, santaY + bounceY, santaScale, leftUp, rightUp);
          for (let i = 0; i < 3; i++) spawnEffect({ type: PType.ICE_SPARK, x: hands.right.x + rand(-5, 5), y: hands.right.y + rand(-5, 5), vx: rand(-25, 25), vy: rand(-50, -15), size: rand(0.8, 1.5), sizeEnd: 0.2, life: rand(0.8, 1.5), maxLife: 1.5, r: randInt(180, 220), g: randInt(220, 245), b: 255, a: 1, aEnd: 0 });
        }
      }

      if (elapsed >= T_HELIX && !helixTriggered) {
        helixTriggered = true; let goldIdx = 0, iceIdx = 0;
        for (const p of effects) {
          if (!p.active) continue;
          if (p.type === PType.GOLDEN_SPARK || p.type === PType.GOLDEN_DUST || p.type === PType.GOLDEN_GLOW) {
            p.originX = p.x; p.originY = p.y; p.phase = 0; p.angle = goldIdx * 0.3; p.type = PType.HELIX_GOLD; p.life = 2; p.maxLife = 2; p.a = 1; p.aEnd = 1; goldIdx++;
          } else if (p.type === PType.ICE_SPARK || p.type === PType.ICE_DUST || p.type === PType.ICE_CRYSTAL) {
            p.originX = p.x; p.originY = p.y; p.phase = 0; p.angle = iceIdx * 0.3 + Math.PI; p.type = PType.HELIX_ICE; p.life = 2; p.maxLife = 2; p.a = 1; p.aEnd = 1; iceIdx++;
          }
        }
      }

      if (elapsed >= T_EXPLOSION && !explosionTriggered) {
        explosionTriggered = true; flashAlpha = 1; explosionGlowAlpha = 1; explosionGlowRadius = 10;
        for (const p of effects) { if (p.type === PType.HELIX_GOLD || p.type === PType.HELIX_ICE) p.active = false; }
        const textCount = scaledTextPositions.length, extraCount = Math.min(2000, MAX_EFFECTS - textCount);
        for (let i = 0; i < textCount + extraCount; i++) {
          const angle = rand(0, Math.PI * 2), speed = rand(80, 550);
          spawnEffect({ type: PType.EXPLOSION, x: explosionCenterX + rand(-5, 5), y: explosionCenterY + rand(-5, 5), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, gravity: rand(30, 120), drag: rand(0.96, 0.995), size: rand(1, 3.5), sizeEnd: rand(0.3, 1.5), life: rand(1.5, 4), maxLife: 4, r: 255, g: 240, b: 220, a: 1, aEnd: 0, reservedForText: i < textCount });
        }
        shockwaveRadius = 5; shockwaveAlpha = 0.8;
      }

      if (shockwaveAlpha > 0) { shockwaveRadius += 350 * dt; shockwaveAlpha -= 0.6 * dt; if (shockwaveAlpha < 0) shockwaveAlpha = 0; }
      if (flashAlpha > 0) { flashAlpha -= 3.5 * dt; if (flashAlpha < 0) flashAlpha = 0; }
      if (explosionGlowAlpha > 0) { explosionGlowRadius += 200 * dt; explosionGlowAlpha -= 0.8 * dt; if (explosionGlowAlpha < 0) explosionGlowAlpha = 0; }

      if (elapsed >= T_TEXT_FORM && !textFormTriggered) {
        textFormTriggered = true; let textIdx = 0;
        const minX = scaledTextPositions[0]?.x || 0, maxX = scaledTextPositions[scaledTextPositions.length - 1]?.x || 1, rangeX = maxX - minX || 1;
        for (const p of effects) {
          if (!p.active || p.type !== PType.EXPLOSION || !p.reservedForText || textIdx >= scaledTextPositions.length) continue;
          const target = scaledTextPositions[textIdx++];
          p.type = PType.TEXT_PARTICLE; p.targetX = target.x; p.targetY = target.y; p.hasTarget = true;
          p.delay = ((target.x - minX) / rangeX) * 0.8; p.vx = 0; p.vy = 0; p.gravity = 0; p.drag = 0; p.life = 10; p.maxLife = 10; p.size = rand(1.5, 2.8); p.sizeEnd = p.size; p.r = 255; p.g = 240; p.b = 210; p.a = 1; p.aEnd = 1;
        }
        for (const p of effects) { if (p.active && p.type === PType.EXPLOSION && !p.reservedForText) p.life = Math.min(p.life, 1.5); }
      }

      if (elapsed >= T_CRYSTAL && !crystalTriggered) {
        crystalTriggered = true;
        for (const p of effects) { if (p.active && p.type === PType.TEXT_PARTICLE) { p.type = PType.CRYSTAL; p.size = rand(2, 3.5); p.sizeEnd = p.size; } }
      }

      if (elapsed >= T_SPARKLE && !sparkleSpawned) {
        sparkleSpawned = true;
        for (let i = 0; i < 150; i++) {
          const tp = scaledTextPositions[randInt(0, scaledTextPositions.length - 1)] || { x: w / 2, y: h * 0.42 };
          spawnEffect({ type: PType.SPARKLE, x: tp.x + rand(-30, 30), y: tp.y + rand(-30, 30), size: rand(1, 3), sizeEnd: rand(1, 3), life: rand(1, 3), maxLife: 3, r: 255, g: randInt(210, 240), b: randInt(80, 150), a: 1, aEnd: 1, angle: rand(0, Math.PI * 2) });
        }
      }

      for (const p of effects) updateEffect(p, dt, elapsed);

      ctx.save(); ctx.globalCompositeOperation = "lighter";
      if (explosionGlowAlpha > 0) {
        const egR = Math.max(1, explosionGlowRadius);
        const egGrad = ctx.createRadialGradient(explosionCenterX, explosionCenterY, 0, explosionCenterX, explosionCenterY, egR);
        egGrad.addColorStop(0, `rgba(255,240,200,${explosionGlowAlpha * 0.6})`); egGrad.addColorStop(1, "rgba(180,160,240,0)");
        ctx.fillStyle = egGrad; ctx.beginPath(); ctx.arc(explosionCenterX, explosionCenterY, egR, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of effects) { if (p.active) drawSingleParticle(ctx, p, crystalSprite, sparkleSprite, crystalTriggered); }
      ctx.restore();

      if (shockwaveAlpha > 0) drawShockwave(ctx, explosionCenterX, explosionCenterY, shockwaveRadius, shockwaveAlpha, 3);
      if (flashAlpha > 0) { ctx.save(); ctx.globalAlpha = flashAlpha; ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, w, h); ctx.restore(); }

      ctx.save(); ctx.globalAlpha = snowAlpha;
      for (const sp of snowFg) { updateSnow(sp, dt, elapsed); drawSingleParticle(ctx, sp, crystalSprite, sparkleSprite, false); }
      ctx.restore();

      if (elapsed >= T_END - 0.5) {
        ctx.save(); ctx.globalAlpha = clamp((elapsed - (T_END - 0.5)) / 0.5, 0, 1); ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, w, h); ctx.restore();
      }

      if (elapsed >= DURATION && !completedRef.current) {
        completedRef.current = true; ctx.clearRect(0, 0, w, h); onCompleteRef.current(); return;
      }
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <ChristmasScene />
      <ChristmasParticles />
    </div>
  );
}
