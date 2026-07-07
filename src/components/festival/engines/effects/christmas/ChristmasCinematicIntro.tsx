'use client';

import React, { useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// 🚀 FIX: 'ei cannot be invoked without new' error को खत्म करने के लिए 
// इन्हें ssr: false के साथ dynamically import किया गया है।
const ChristmasScene = dynamic(() => import("./ChristmasScene"), { ssr: false });
const ChristmasParticles = dynamic(() => import("./ChristmasParticles"), { ssr: false });

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
   EASING & MATH
   ================================================================ */

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t: number): number { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp(v: number, min: number, max: number): number { return v < min ? min : v > max ? max : v; }
function rand(min: number, max: number): number { return min + Math.random() * (max - min); }
function randInt(min: number, max: number): number { return Math.floor(rand(min, max + 1)); }

/* ================================================================
   FACTORIES
   ================================================================ */

function makeParticle(): Particle {
  return {
    active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
    size: 1, sizeEnd: 1, r: 255, g: 255, b: 255, a: 1, aEnd: 0,
    type: PType.SNOW_BG, rotation: 0, rotationSpeed: 0, targetX: 0, targetY: 0,
    hasTarget: false, angle: 0, radius: 0, angularSpeed: 0,
    gravity: 0, drag: 0, delay: 0, phase: 0, originX: 0, originY: 0, reservedForText: false,
  };
}

function resetParticle(p: Particle): void {
  Object.assign(p, makeParticle());
}

function sampleTextPositions(text: string, maxWidth: number, gap: number): Array<{ x: number; y: number }> {
  const fontSize = Math.min(maxWidth * 0.075, 120);
  const cw = Math.ceil(maxWidth * 0.85), ch = Math.ceil(fontSize * 2);
  const off = document.createElement("canvas"); off.width = cw; off.height = ch;
  const oc = off.getContext("2d")!;
  oc.fillStyle = "#ffffff"; oc.font = `bold ${fontSize}px Georgia, "Times New Roman", serif`;
  oc.textAlign = "center"; oc.textBaseline = "middle"; oc.fillText(text, cw / 2, ch / 2);
  const img = oc.getImageData(0, 0, cw, ch);
  const pos: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < ch; y += gap) {
    for (let x = 0; x < cw; x += gap) {
      if (img.data[(y * cw + x) * 4 + 3] > 100) pos.push({ x: x - cw / 2 + rand(-0.5, 0.5), y: y - ch / 2 + rand(-0.5, 0.5) });
    }
  }
  return pos;
}

function generateStars(count: number, w: number, h: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: rand(0, w), y: rand(0, h * 0.5), size: rand(0.5, 2),
    brightness: rand(0.3, 1), speed: rand(0.5, 2), offset: rand(0, Math.PI * 2),
  }));
}

function generateMountainLayer(w: number, baseY: number, peaks: number, minH: number, maxH: number): MountainPoint[] {
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
  const minH = layer === 0 ? 20 : layer === 1 ? 35 : 50;
  const maxH = layer === 0 ? 40 : layer === 1 ? 60 : 90;
  const trees: TreeInfo[] = [];
  for (let i = 0; i < count; i++) trees.push({ x: rand(-20, w + 20), h: rand(minH, maxH), w: rand(minH * 0.4, maxH * 0.5), layer });
  return trees.sort((a, b) => a.h - b.h);
}

/* ================================================================
   DRAWING LOGIC
   ================================================================ */

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, a: number): void {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#050810"); g.addColorStop(0.4, "#0c1525"); g.addColorStop(0.7, "#142035"); g.addColorStop(1, "#1a2840");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
}

function drawMoon(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, t: number): void {
  if (a <= 0) return;
  const mx = w * 0.78, my = h * 0.18, mr = Math.min(w, h) * 0.06, p = 1 + Math.sin(t * 0.3) * 0.015;
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 6; i >= 1; i--) {
    const r = mr * (1 + i * 0.8) * p, al = 0.03 / i;
    const g = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, r);
    g.addColorStop(0, `rgba(140, 170, 220, ${al})`); g.addColorStop(1, "rgba(80, 120, 180, 0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
  }
  const mg = ctx.createRadialGradient(mx - mr * 0.2, my - mr * 0.2, mr * 0.1, mx, my, mr);
  mg.addColorStop(0, "#e8e4d8"); mg.addColorStop(1, "#b8b0a0");
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * p, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], a: number, t: number): void {
  if (a <= 0) return; ctx.save();
  for (const s of stars) {
    const al = a * s.brightness * (0.5 + 0.5 * Math.sin(t * s.speed + s.offset));
    if (al < 0.02) continue; ctx.globalAlpha = al; ctx.fillStyle = "#d0daf0";
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawMountainLayer(ctx: CanvasRenderingContext2D, l: MountainLayer, w: number, h: number, a: number): void {
  if (a <= 0 || l.points.length < 2) return; ctx.save(); ctx.globalAlpha = a;
  ctx.beginPath(); ctx.moveTo(l.points[0].x, l.points[0].y);
  for (let i = 1; i < l.points.length; i++) {
    const p = l.points[i - 1], c = l.points[i];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + c.x) / 2, (p.y + c.y) / 2);
  }
  ctx.lineTo(l.points[l.points.length - 1].x, l.points[l.points.length - 1].y);
  ctx.lineTo(w + 10, h + 10); ctx.lineTo(-10, h + 10); ctx.closePath();
  ctx.fillStyle = l.color; ctx.fill(); ctx.restore();
}

function drawForest(ctx: CanvasRenderingContext2D, trees: TreeInfo[], bY: number, cols: string[], sA: number, a: number): void {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
  for (const t of trees) {
    ctx.fillStyle = cols[t.layer];
    for (let i = 0; i < 3; i++) {
      const lH = t.h * (0.5 - i * 0.08), lW = t.w * (1 - i * 0.2), yO = t.h * 0.15 * i;
      ctx.beginPath(); ctx.moveTo(t.x, bY - t.h + yO); ctx.lineTo(t.x - lW / 2, bY - t.h + lH + yO);
      ctx.lineTo(t.x + lW / 2, bY - t.h + lH + yO); ctx.closePath(); ctx.fill();
    }
    ctx.fillRect(t.x - t.w * 0.06, bY - t.h * 0.15, t.w * 0.12, t.h * 0.18);
  }
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, gY: number, a: number): void {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, gY, 0, h);
  g.addColorStop(0, "#c8d4e8"); g.addColorStop(0.5, "#9aaaba"); g.addColorStop(1, "#7888a0");
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10, h + 10); ctx.lineTo(-10, gY);
  for (let x = 0; x <= w + 40; x += 40) ctx.lineTo(x, gY + Math.sin(x * 0.008) * 8);
  ctx.lineTo(w + 10, h + 10); ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, i: number): void {
  if (i <= 0) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.85);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${i})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

function drawSantaFormation(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, lU: boolean, rU: boolean, lP: number, hB: number, a: number): void {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#000000"; ctx.strokeStyle = "#000000"; ctx.lineCap = "round";
  const gap = 65 * s;
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.translate(cx - (3 - i) * gap, cy + 10 * s); ctx.scale(s, s);
    const lo1 = Math.sin(lP + i * 0.8) * 3, lo2 = Math.sin(lP + i * 0.8 + Math.PI) * 3, bob = hB * (1 - i * 0.15);
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(30, -18 + bob, 8, 6, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(27, -24 + bob); ctx.lineTo(21, -38 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(33, -24 + bob); ctx.lineTo(39, -38 + bob); ctx.stroke();
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(12, 9); ctx.lineTo(12 + lo1, 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(17, 9); ctx.lineTo(17 + lo2, 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-13, 9); ctx.lineTo(-13 + lo2, 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, 9); ctx.lineTo(-8 + lo1, 28); ctx.stroke();
    ctx.restore();
  }
  ctx.save(); ctx.translate(cx + gap * 0.8, cy + 18 * s); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-45, -28); ctx.quadraticCurveTo(-50, -8, -44, 2); ctx.lineTo(42, 2);
  ctx.quadraticCurveTo(52, -2, 52, -14); ctx.lineTo(48, -28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-45, -28); ctx.quadraticCurveTo(-55, -52, -47, -58); ctx.lineTo(-33, -58);
  ctx.lineTo(-33, -28); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-52, 7); ctx.quadraticCurveTo(-48, 18, -20, 20);
  ctx.quadraticCurveTo(25, 20, 58, 10); ctx.quadraticCurveTo(65, 6, 62, 0); ctx.stroke();
  ctx.restore();

  const sX = cx + gap * 0.8 - 5 * s, sY = cy + 18 * s - 2 * s;
  ctx.save(); ctx.translate(sX, sY); ctx.scale(s, s);
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
  
  ctx.save(); ctx.translate(-18, -48); ctx.rotate(lU ? -2.2 : -0.35);
  ctx.fillRect(0, -3.5, 24, 7); ctx.beginPath(); ctx.arc(24, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(18, -48); ctx.rotate(rU ? 2.2 : 0.35);
  ctx.fillRect(-24, -3.5, 24, 7); ctx.beginPath(); ctx.arc(-24, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.restore();
  ctx.restore();
}

/* ================================================================
   SPRITES
   ================================================================ */

function createCrystalSprite(): HTMLCanvasElement {
  const s = 16, c = document.createElement("canvas"); c.width = s; c.height = s;
  const x = s / 2, y = s / 2, g = c.getContext("2d")!;
  const gl = g.createRadialGradient(x, y, 0, x, y, x);
  gl.addColorStop(0, "rgba(140,190,255,0.25)"); gl.addColorStop(1, "rgba(100,150,220,0)");
  g.fillStyle = gl; g.fillRect(0, 0, s, s);
  g.beginPath(); g.moveTo(x, 1.5); g.lineTo(s - 2, y); g.lineTo(x, s - 1.5); g.lineTo(2, y); g.closePath();
  g.fillStyle = "rgba(180,220,255,0.45)"; g.fill(); g.strokeStyle = "rgba(255,200,50,0.65)"; g.lineWidth = 0.7; g.stroke();
  return c;
}

function createSparkleSprite(): HTMLCanvasElement {
  const s = 20, c = document.createElement("canvas"); c.width = s; c.height = s;
  const x = s / 2, y = s / 2, g = c.getContext("2d")!;
  g.fillStyle = "rgba(255,220,100,0.9)"; g.beginPath(); g.moveTo(x, 1); g.lineTo(x + 1.5, y - 1.5);
  g.lineTo(s - 1, y); g.lineTo(x + 1.5, y + 1.5); g.lineTo(x, s - 1);
  g.lineTo(x - 1.5, y + 1.5); g.lineTo(1, y); g.lineTo(x - 1.5, y - 1.5); g.closePath(); g.fill();
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
    const mLayers = [
      { points: generateMountainLayer(w, groundY - h * 0.08, 5, h * 0.06, h * 0.14), color: "#141d30", snowColor: "rgba(180,200,225,0.5)", snowLine: h * 0.08 },
      { points: generateMountainLayer(w, groundY - h * 0.02, 4, h * 0.04, h * 0.1), color: "#0f1722", snowColor: "rgba(170,190,215,0.4)", snowLine: h * 0.06 },
      { points: generateMountainLayer(w, groundY + h * 0.02, 6, h * 0.02, h * 0.06), color: "#0a0f18", snowColor: "rgba(160,180,205,0.3)", snowLine: h * 0.04 },
    ];
    const tLayers = [
      { trees: generateTrees(35, w, groundY + h * 0.01, 0), baseY: groundY + h * 0.01 },
      { trees: generateTrees(25, w, groundY + h * 0.04, 1), baseY: groundY + h * 0.04 },
      { trees: generateTrees(18, w, groundY + h * 0.06, 2), baseY: groundY + h * 0.06 },
    ];

    const textPos = sampleTextPositions("MERRY CHRISTMAS", w, 3);
    const tCX = w / 2, tCY = h * 0.42;
    const tScale = Math.min(w * 0.8 / (w * 0.85), h * 0.15 / 120) || 1;
    const sTextPos = textPos.map(tp => ({ x: tp.x * tScale + tCX, y: tp.y * tScale + tCY })).sort((a, b) => a.x - b.x);

    const sScale = h / 650, sStartX = -350 * sScale, sEndX = w * 0.33, sY = groundY - h * 0.08;
    const effects: Particle[] = Array.from({ length: MAX_EFFECTS }, makeParticle);

    function spawnEffect(cfg: Partial<Particle>): Particle | null {
      for (let i = 0; i < effects.length; i++) {
        if (!effects[i].active) {
          resetParticle(effects[i]);
          const p = effects[i]; p.active = true;
          Object.keys(cfg).forEach(k => { (p as any)[k] = (cfg as any)[k]; });
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
      p.a = rand(0.2, 0.5); p.aEnd = p.a; p.maxLife = 999; p.life = 999; snowBg.push(p);
    }
    for (let i = 0; i < MAX_SNOW_FG; i++) {
      const p = makeParticle(); p.active = true; p.type = PType.SNOW_FG;
      p.x = rand(0, w); p.y = rand(-h, h); p.size = rand(1.5, 3.5); p.sizeEnd = p.size;
      p.vy = rand(20, 40); p.vx = rand(-5, 5); p.angle = rand(0, Math.PI * 2);
      p.a = rand(0.3, 0.7); p.aEnd = p.a; p.maxLife = 999; p.life = 999; snowFg.push(p);
    }

    let swR = 0, swA = 0, flA = 0, exA = 0, exR = 0;
    const exCX = w / 2, exCY = h * 0.42;
    let helixT = false, expT = false, textT = false, crysT = false, sparT = false;
    let bT = 0, gST = 0, iST = 0, pT = 0, sT = 0, init = false;

    function animate(now: number): void {
      if (!init) { sT = now; pT = now; init = true; }
      const el = (now - sT) / 1000, dt = Math.min((now - pT) / 1000, 0.05); pT = now;
      ctx.clearRect(0, 0, w, h);

      const scA = el >= T_FADE ? clamp(1 - (el - T_FADE) / 0.8, 0, 1) : 1;
      const snA = el >= T_FADE + 0.4 ? clamp(1 - (el - T_FADE - 0.4) / 0.6, 0, 1) : clamp(el / 0.5, 0, 1);
      const saA = el >= T_FADE ? clamp(1 - (el - T_FADE) / 0.5, 0, 1) : clamp((el - T_SANTA_ENTER) / 0.3, 0, 1);

      drawSky(ctx, w, h, scA);
      drawStars(ctx, stars, clamp((el - T_MOON) / 1.5, 0, 1) * scA, el);
      drawMoon(ctx, w, h, clamp((el - T_MOON) / 1.0, 0, 1) * scA, el);
      mLayers.forEach(m => drawMountainLayer(ctx, m, w, h, scA));
      
      for (let i = 0; i < tLayers.length - 1; i++) drawForest(ctx, tLayers[i].trees, tLayers[i].baseY, ["#0d1520", "#0a1018", "#070c14"], 0.4 * scA, scA);

      ctx.save(); ctx.globalAlpha = snA;
      for (const sp of snowBg) {
        sp.y += sp.vy * dt; sp.x += Math.sin(sp.angle + el * 0.5) * 8 * dt + sp.vx * dt;
        if (sp.y > h + 20) { sp.y = rand(-30, -5); sp.x = rand(-20, w + 20); }
        const al = lerp(sp.a, sp.aEnd, 0), sz = lerp(sp.size, sp.sizeEnd, 0);
        if(al > 0.01) { ctx.fillStyle = `rgba(${sp.r},${sp.g},${sp.b},${al})`; ctx.beginPath(); ctx.arc(sp.x, sp.y, sz, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();

      let sX = sStartX, lU = el >= T_LEFT_HAND, rU = el >= T_RIGHT_HAND, lP = el * 4, hB = Math.sin(el * 3) * 1.5, bY = 0;
      if (el >= T_SANTA_ENTER && el < T_SANTA_STOP) { const t = clamp((el - T_SANTA_ENTER) / (T_SANTA_STOP - T_SANTA_ENTER), 0, 1); sX = lerp(sStartX, sEndX, easeOutCubic(t)); bY = -Math.sin(t * Math.PI) * 15 * sScale; }
      else if (el >= T_SANTA_STOP) { sX = sEndX; lP = Math.sin(el * 0.5) * 0.15; hB = Math.sin(el * 0.7) * 0.8; bY = Math.sin((el - T_SANTA_STOP) * 10) * 4 * sScale * Math.exp(-(el - T_SANTA_STOP) * 3); }

      if (el >= T_SANTA_ENTER) {
        drawSantaFormation(ctx, sX, sY + bY, sScale, lU, rU, lP, hB, saA);
        if (el >= T_SANTA_STOP && el < T_EXPLOSION) { bT += dt; if (bT > 0.8) { bT = 0; for (let i=0; i<3; i++) spawnEffect({ type: PType.SMOKE, x: sX + 38 * sScale + rand(-2, 2), y: sY - 8 * sScale + rand(-2, 2), vx: rand(8, 18) * sScale, vy: rand(-8, -2) * sScale, size: rand(4, 8) * sScale, sizeEnd: rand(15, 25) * sScale, life: 2, maxLife: 2, r: 210, g: 218, b: 230, a: 0.5, aEnd: 0 }); } }
      }

      const lT = tLayers[tLayers.length - 1];
      drawForest(ctx, lT.trees, lT.baseY, ["#0d1520", "#0a1018", "#070c14"], 0.4 * scA, scA);
      drawGround(ctx, w, h, groundY, scA);
      drawVignette(ctx, w, h, 0.45 * scA);

      if (el >= T_LEFT_HAND && el < T_HELIX && !helixT) { gST += dt; if (gST > 0.03) { gST = 0; for(let i=0;i<3;i++) spawnEffect({ type: PType.GOLDEN_SPARK, x: sX - 50 * sScale + rand(-5, 5), y: sY - 60 * sScale + rand(-5, 5), vx: rand(-30, 30), vy: rand(-60, -20), size: rand(0.8, 1.8), sizeEnd: 0.3, life: 1.5, maxLife: 1.5, r: 255, g: randInt(200, 240), b: randInt(50, 120), a: 1, aEnd: 0 }); } }
      if (el >= T_RIGHT_HAND && el < T_HELIX && !helixT) { iST += dt; if (iST > 0.03) { iST = 0; for(let i=0;i<3;i++) spawnEffect({ type: PType.ICE_SPARK, x: sX + 50 * sScale + rand(-5, 5), y: sY - 60 * sScale + rand(-5, 5), vx: rand(-25, 25), vy: rand(-50, -15), size: rand(0.8, 1.5), sizeEnd: 0.2, life: 1.5, maxLife: 1.5, r: randInt(180, 220), g: randInt(220, 245), b: 255, a: 1, aEnd: 0 }); } }

      if (el >= T_HELIX && !helixT) {
        helixT = true; let gI = 0, iI = 0;
        for (const p of effects) {
          if (!p.active) continue;
          if (p.type === PType.GOLDEN_SPARK || p.type === PType.GOLDEN_DUST || p.type === PType.GOLDEN_GLOW) { p.originX = p.x; p.originY = p.y; p.phase = 0; p.angle = gI * 0.3; p.type = PType.HELIX_GOLD; p.life = 2; p.maxLife = 2; p.a = 1; p.aEnd = 1; gI++; }
          else if (p.type === PType.ICE_SPARK || p.type === PType.ICE_DUST || p.type === PType.ICE_CRYSTAL) { p.originX = p.x; p.originY = p.y; p.phase = 0; p.angle = iI * 0.3 + Math.PI; p.type = PType.HELIX_ICE; p.life = 2; p.maxLife = 2; p.a = 1; p.aEnd = 1; iI++; }
        }
      }

      if (el >= T_EXPLOSION && !expT) {
        expT = true; flA = 1; exA = 1; exR = 10;
        for (const p of effects) { if (p.type === PType.HELIX_GOLD || p.type === PType.HELIX_ICE) p.active = false; }
        const tC = sTextPos.length, eC = Math.min(2000, MAX_EFFECTS - tC);
        for (let i = 0; i < tC + eC; i++) {
          const ang = rand(0, Math.PI * 2), spd = rand(80, 550);
          spawnEffect({ type: PType.EXPLOSION, x: exCX + rand(-5, 5), y: exCY + rand(-5, 5), vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, gravity: rand(30, 120), drag: rand(0.96, 0.995), size: rand(1, 3.5), sizeEnd: rand(0.3, 1.5), life: rand(1.5, 4), maxLife: 4, r: 255, g: 240, b: 220, a: 1, aEnd: 0, reservedForText: i < tC });
        }
        swR = 5; swA = 0.8;
      }

      if (swA > 0) { swR += 350 * dt; swA -= 0.6 * dt; if (swA < 0) swA = 0; }
      if (flA > 0) { flA -= 3.5 * dt; if (flA < 0) flA = 0; }
      if (exA > 0) { exR += 200 * dt; exA -= 0.8 * dt; if (exA < 0) exA = 0; }

      if (el >= T_TEXT_FORM && !textT) {
        textT = true; let tI = 0;
        const mnX = sTextPos[0]?.x || 0, mxX = sTextPos[sTextPos.length - 1]?.x || 1, rX = mxX - mnX || 1;
        for (const p of effects) {
          if (!p.active || p.type !== PType.EXPLOSION || !p.reservedForText || tI >= sTextPos.length) continue;
          const tgt = sTextPos[tI++];
          Object.assign(p, { type: PType.TEXT_PARTICLE, targetX: tgt.x, targetY: tgt.y, hasTarget: true, delay: ((tgt.x - mnX) / rX) * 0.8, vx: 0, vy: 0, gravity: 0, drag: 0, life: 10, maxLife: 10, size: rand(1.5, 2.8), sizeEnd: rand(1.5, 2.8), r: 255, g: 240, b: 210, a: 1, aEnd: 1 });
        }
        for (const p of effects) { if (p.active && p.type === PType.EXPLOSION && !p.reservedForText) p.life = Math.min(p.life, 1.5); }
      }

      if (el >= T_CRYSTAL && !crysT) { crysT = true; for (const p of effects) { if (p.active && p.type === PType.TEXT_PARTICLE) { p.type = PType.CRYSTAL; p.size = rand(2, 3.5); p.sizeEnd = p.size; } } }
      if (el >= T_SPARKLE && !sparT) { sparT = true; for (let i = 0; i < 150; i++) { const tp = sTextPos[randInt(0, sTextPos.length - 1)] || { x: w / 2, y: h * 0.42 }; spawnEffect({ type: PType.SPARKLE, x: tp.x + rand(-30, 30), y: tp.y + rand(-30, 30), size: rand(1, 3), sizeEnd: rand(1, 3), life: rand(1, 3), maxLife: 3, r: 255, g: randInt(210, 240), b: randInt(80, 150), a: 1, aEnd: 1, angle: rand(0, Math.PI * 2) }); } }

      // Update & Draw Effects
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      if (exA > 0) {
        const egR = Math.max(1, exR), egG = ctx.createRadialGradient(exCX, exCY, 0, exCX, exCY, egR);
        egG.addColorStop(0, `rgba(255,240,200,${exA * 0.6})`); egG.addColorStop(1, "rgba(180,160,240,0)");
        ctx.fillStyle = egG; ctx.beginPath(); ctx.arc(exCX, exCY, egR, 0, Math.PI * 2); ctx.fill();
      }

      for (const p of effects) {
        if (!p.active) continue;
        if (p.delay > 0) { p.delay -= dt; continue; }
        p.life -= dt; if (p.life <= 0) { p.active = false; continue; }

        if (p.type === PType.HELIX_GOLD || p.type === PType.HELIX_ICE) {
          p.phase += 0.75 * dt; const t = easeInOutCubic(clamp(p.phase, 0, 1)), hR = 100 * (1 - t);
          const dir = p.type === PType.HELIX_GOLD ? 1 : -1, ang = p.angle + t * 3.5 * Math.PI * 2 * dir;
          p.x = lerp(p.originX, exCX, t) + hR * Math.cos(ang); p.y = lerp(p.originY, exCY, t) + hR * Math.sin(ang) * 0.4;
        } else if (p.type === PType.EXPLOSION && !p.hasTarget) {
          p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60); p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        } else if (p.type === PType.TEXT_PARTICLE || p.type === PType.CRYSTAL) {
          if (p.hasTarget) { p.vx += ((p.targetX - p.x) * 55 - p.vx * 12) * dt; p.vy += ((p.targetY - p.y) * 55 - p.vy * 12) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
        } else if (p.type === PType.SPARKLE) { p.a = 0.5 + 0.5 * Math.sin(el * 4 + p.angle); }
        else { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; }

        const t = 1 - p.life / p.maxLife, sz = lerp(p.size, p.sizeEnd, t), al = lerp(p.a, p.aEnd, t);
        if (al < 0.01 || sz < 0.1) continue;
        const col = `rgba(${p.r},${p.g},${p.b},${al})`;

        if (p.type === PType.CRYSTAL && crystalSprite) { const cs = sz * 2.5; ctx.globalAlpha = al; ctx.drawImage(crystalSprite, p.x - cs / 2, p.y - cs / 2, cs, cs); }
        else if (p.type === PType.SPARKLE && sparkleSprite) { const ss = sz * 3; ctx.globalAlpha = al; ctx.drawImage(sparkleSprite, p.x - ss / 2, p.y - ss / 2, ss, ss); }
        else if (p.type === PType.SMOKE || p.type === PType.GOLDEN_GLOW || p.type === PType.EXPLOSION_GLOW) {
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz);
          gr.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${al * 0.5})`); gr.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();

      if (swA > 0) { ctx.save(); ctx.globalAlpha = swA; ctx.strokeStyle = "#c8daf0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(exCX, exCY, swR, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      if (flA > 0) { ctx.save(); ctx.globalAlpha = flA; ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, w, h); ctx.restore(); }

      ctx.save(); ctx.globalAlpha = snA;
      for (const sp of snowFg) {
        sp.y += sp.vy * dt; sp.x += Math.sin(sp.angle + el * 0.5) * 8 * dt + sp.vx * dt;
        if (sp.y > h + 20) { sp.y = rand(-30, -5); sp.x = rand(-20, w + 20); }
        ctx.fillStyle = `rgba(${sp.r},${sp.g},${sp.b},${sp.a})`; ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      if (el >= T_END - 0.5) { ctx.save(); ctx.globalAlpha = clamp((el - (T_END - 0.5)) / 0.5, 0, 1); ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, w, h); ctx.restore(); }
      if (el >= DURATION && !completedRef.current) { completedRef.current = true; ctx.clearRect(0, 0, w, h); onCompleteRef.current(); return; }
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
