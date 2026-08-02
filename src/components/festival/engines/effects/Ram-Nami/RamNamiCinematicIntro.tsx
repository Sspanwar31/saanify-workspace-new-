'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
}

// ============ MATH & EASING ============
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; tx: number; ty: number; rot: number; rotSpd: number;
  flap: number; active: boolean; delay: number; color: string; trail: { x: number; y: number }[];
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', tx: 0, ty: 0, rot: 0, rotSpd: 0, flap: 0, active: false, delay: 0, color: '#fff', trail: []
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    p.active = true; p.life = 0; p.alpha = 0; p.delay = 0; p.trail = [];
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

// ============ एक ही जगह नाम लिखा है — यही PARTICLES और TITLE दोनों के लिए use होगा ============
const TITLE_TEXT = 'जय श्री राम';

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
    let lastSampleTime = 0;
    let screenFlash = 0;
    let cameraShake = 0;
    let lastRocketLaunchTime = 0;

    const reflectCanvas = document.createElement('canvas');
    const rctx = reflectCanvas.getContext('2d')!;
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    // Cached title offscreen canvas — built once, reused every frame
    let titleOffscreen: HTMLCanvasElement | null = null;
    let titleOffscreenW = 0;
    let titleOffscreenH = 0;
    let lastTitleFontSize = 0;

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

    const pool = new ParticlePool(2000);
    const cam = { x: 0, y: 0, zoom: 1, rot: 0 };
    let ramPoints: { x: number; y: number }[] = [];
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
      sampleText();
      initializeDiyas();
      // Invalidate title cache on resize
      titleOffscreen = null;
      lastTitleFontSize = 0;
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

    // ============ FIXED: एक ही constant TITLE_TEXT use कर रहे हैं ============
    function sampleText() {
      const tc = document.createElement("canvas");
      const tctx = tc.getContext("2d")!;
      const fontSize = Math.min(W * 0.125, 130);
      tc.width = Math.floor(W);
      tc.height = Math.floor(fontSize * 2.4);
      tctx.clearRect(0, 0, tc.width, tc.height);
      tctx.fillStyle = "#fff";
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";
      tctx.font = `900 ${fontSize}px "Tiro Devanagari Hindi","Nirmala UI","Mangal",serif`;
      tctx.lineJoin = "round";
      tctx.lineCap = "round";
      // ✅ FIX: TITLE_TEXT constant use — "जय श्री राम"
      tctx.fillText(TITLE_TEXT, tc.width / 2, tc.height / 2);
      const img = tctx.getImageData(0, 0, tc.width, tc.height);
      ramPoints = [];
      const step = 2;
      for (let y = 0; y < tc.height; y += step) {
        for (let x = 0; x < tc.width; x += step) {
          const i = (y * tc.width + x) * 4;
          if (img.data[i + 3] > 20) {
            ramPoints.push({
              x: x - tc.width / 2,
              y: y - tc.height / 2
            });
          }
        }
      }
    }

    // ============ DRAW FUNCTIONS ============

    function drawBackground(t: number) {
      const reveal = smoothstep(0, 1.2, t);
      const fadeOut = smoothstep(17.0, 17.5, t);
      const vis = reveal * (1 - fadeOut);

      const textSceneDarkness = smoothstep(6.5, 8.0, t);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      const ir = Math.floor(lerp(lerp(4, 50, vis), 0, textSceneDarkness));
      const ig = Math.floor(lerp(lerp(2, 25, vis), 0, textSceneDarkness));
      const ib = Math.floor(lerp(lerp(5, 15, vis), 0, textSceneDarkness));

      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.6, `rgb(${ir},${ig},${ib})`);
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      if (screenFlash > 0.01 && t < 7.0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 240, 200, ${screenFlash * 0.4})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }

    function drawDivineLight(t: number) {
      const reveal = smoothstep(0.5, 1.5, t);
      const fade = smoothstep(6.5, 8.0, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);
      const sx = W * 0.5;
      const sy = H * 0.42;
      const sunR = W * 0.25;
      const sunGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sunR);
      sunGrad.addColorStop(0, `rgba(255, 240, 180, ${0.95 * vis})`);
      sunGrad.addColorStop(0.2, `rgba(255, 180, 80, ${0.65 * vis})`);
      sunGrad.addColorStop(0.5, `rgba(200, 90, 30, ${0.25 * vis})`);
      sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rayCount = 28;
      const maxLen = Math.max(W, H) * 1.2;
      for (let i = 0; i < rayCount; i++) {
        const baseAngle = (i / rayCount) * Math.PI * 2;
        const angle = baseAngle + t * 0.04 + Math.sin(t * 0.3 + i * 0.8) * 0.03;
        const len = maxLen * (0.6 + 0.4 * Math.sin(t * 0.5 + i * 1.7));
        const flicker = 0.7 + 0.3 * Math.sin(t * 1.5 + i * 2.3);
        const a = 0.09 * vis * flicker;
        const ex = sx + Math.cos(angle) * len;
        const ey = sy + Math.sin(angle) * len;
        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, `rgba(255, 220, 150, ${a})`);
        grad.addColorStop(0.4, `rgba(255, 160, 60, ${a * 0.5})`);
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
        const a = 0.04 * vis * (0.7 + 0.3 * Math.sin(t * 1.5 + i));
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

    // ============ HYPER-REALISTIC 3D RAM MANDIR ============

    function drawRamMandir(t: number, targetCtx: CanvasRenderingContext2D) {
      const reveal = smoothstep(1.8, 4.0, t);
      const fade = smoothstep(6.5, 8.0, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);

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
        const frontGrad = targetCtx.createLinearGradient(mx - pw / 2, py, mx + pw / 2, py);
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
        for (let i = 0; i < 5; i++) {
          const lx = mx - pw / 2 + (pw / 5) * i;
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

      const garbhaGlow = targetCtx.createRadialGradient(mx, sanctumY - 40 * s, 0, mx, sanctumY - 40 * s, 90 * s);
      garbhaGlow.addColorStop(0, 'rgba(255, 240, 160, 1)');
      garbhaGlow.addColorStop(0.4, 'rgba(255, 150, 40, 0.8)');
      garbhaGlow.addColorStop(1, 'rgba(0,0,0,0)');
      targetCtx.fillStyle = garbhaGlow;
      targetCtx.fillRect(mx - 120 * s, sanctumY - 100 * s, 240 * s, 120 * s);

      targetCtx.fillStyle = '#0a0201';
      targetCtx.fillRect(mx - sanctumW / 2, sanctumY - sanctumH, sanctumW, sanctumH);

      const doorLayers = [
        { w: sanctumW, h: sanctumH, c: '#5e2d14' },
        { w: sanctumW * 0.85, h: sanctumH * 0.9, c: '#7a3d1a' },
        { w: sanctumW * 0.7, h: sanctumH * 0.8, c: '#994d22' }
      ];
      doorLayers.forEach(layer => {
        const dy = sanctumY - layer.h;
        targetCtx.fillStyle = layer.c;
        targetCtx.beginPath();
        targetCtx.moveTo(mx - layer.w / 2, sanctumY);
        targetCtx.lineTo(mx - layer.w / 2, dy + layer.w * 0.2);
        targetCtx.quadraticCurveTo(mx, dy - layer.w * 0.1, mx + layer.w / 2, dy + layer.w * 0.2);
        targetCtx.lineTo(mx + layer.w / 2, sanctumY);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.strokeStyle = goldGlow;
        targetCtx.lineWidth = 1.5 * s;
        targetCtx.stroke();
      });

      targetCtx.fillStyle = '#1a0702';
      targetCtx.fillRect(mx - 40 * s, sanctumY - 60 * s, 80 * s, 60 * s);
      targetCtx.strokeStyle = `rgba(255, 215, 0, ${0.8 + 0.2 * Math.sin(t * 2)})`;
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
        targetCtx.arc((x1 + x2) / 2, sanctumY - 70 * s, (x2 - x1) / 2, Math.PI, 0);
        targetCtx.stroke();

        targetCtx.fillStyle = `rgba(255, 200, 50, ${0.6 + 0.4 * Math.sin(t * 4 + i)})`;
        targetCtx.beginPath();
        targetCtx.arc((x1 + x2) / 2, sanctumY - 70 * s + 6 * s, 4 * s, 0, Math.PI * 2);
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
        const amalakaW = w * 0.35;
        const amalakaH = 14 * s;

        const amalakaGrad = targetCtx.createRadialGradient(cx, topY - amalakaH / 2, 0, cx, topY - amalakaH / 2, amalakaW / 2);
        amalakaGrad.addColorStop(0, '#ffaa00');
        amalakaGrad.addColorStop(0.5, '#d48031');
        amalakaGrad.addColorStop(1, '#5e2d14');
        targetCtx.fillStyle = amalakaGrad;
        targetCtx.beginPath();
        targetCtx.ellipse(cx, topY - amalakaH / 2, amalakaW / 2, amalakaH / 2, 0, 0, Math.PI * 2);
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
        targetCtx.arc(cx, kalashY - 10 * s, 10 * s, 0, Math.PI * 2);
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
      targetCtx.arc(mx, topCenterY, 6 * s, 0, Math.PI * 2);
      targetCtx.fill();

      const poleGrad = targetCtx.createLinearGradient(mx - 3 * s, 0, mx + 3 * s, 0);
      poleGrad.addColorStop(0, '#5e3818');
      poleGrad.addColorStop(0.4, '#d4aa70');
      poleGrad.addColorStop(0.5, '#fff5e0');
      poleGrad.addColorStop(0.6, '#d4aa70');
      poleGrad.addColorStop(1, '#5e3818');
      targetCtx.fillStyle = poleGrad;
      targetCtx.fillRect(mx - 2 * s, flagPoleTop, 4 * s, topCenterY - flagPoleTop);

      const finialGrad = targetCtx.createRadialGradient(mx - 1 * s, flagPoleTop - 4 * s, 0, mx, flagPoleTop - 4 * s, 6 * s);
      finialGrad.addColorStop(0, '#ffffff');
      finialGrad.addColorStop(0.4, '#ffd700');
      finialGrad.addColorStop(1, '#994d22');
      targetCtx.fillStyle = finialGrad;
      targetCtx.beginPath();
      targetCtx.arc(mx, flagPoleTop - 4 * s, 5 * s, 0, Math.PI * 2);
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

      targetCtx.fillStyle = `rgba(255, 234, 0, ${0.8 + 0.2 * Math.sin(t * 3)})`;
      targetCtx.beginPath();
      targetCtx.arc(mx + 12 * s, flagPoleTop + 13 * s + wave1 * 0.5, 4 * s, 0, Math.PI * 2);
      targetCtx.fill();

      targetCtx.restore();
    }

    function drawWater(t: number) {
      const reveal = smoothstep(2.2, 4.0, t);
      const fade = smoothstep(6.5, 8.0, t);
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
        const rfGrad = ctx.createRadialGradient(b.x, rY, 0, b.x, rY, b.r * 1.8);
        rfGrad.addColorStop(0, `${b.color}${Math.floor(b.alpha * 50).toString(16).padStart(2, '0')}`);
        rfGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rfGrad;

        ctx.beginPath();
        ctx.ellipse(b.x, waterY + dy * 0.65, b.r * 1.4, b.r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    function updateAndDrawFloatingDiyas(t: number) {
      const reveal = smoothstep(3.0, 4.5, t);
      const fade = smoothstep(6.5, 8.0, t);
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
        ctx.ellipse(d.x, waveY + s * 0.25, s, s * 0.35, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#170300';
        ctx.beginPath();
        ctx.ellipse(d.x, waveY + s * 0.15, s * 0.88, s * 0.22, 0, 0, Math.PI * 2);
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
        ctx.drawImage(dustSprite, d.x - s * 1.8, waveY - flameH - s * 0.5, s * 3.6, s * 3.6);
        ctx.restore();
      });

      ctx.restore();
    }

    function drawFogAndHaze(t: number) {
      const intensity = smoothstep(0.5, 4.0, t) * (1 - smoothstep(6.5, 8.0, t));
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

    // SCENE 3: REALISTIC FIREWORKS
    function launchFireworks(t: number) {
      if (t < 3.5 || t > 6.5) return;

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

      if (isSecondary) { particleCount = 30; shake = 0; flash = 0; }

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

        if (type === 'willow') { gravity = 0.15; drag = 0.995; maxLife = 2.5 + Math.random() * 1.5; pColor = '#ffd700'; pColor2 = '#ffaa00'; }
        else if (type === 'finale') {
          if (Math.random() < 0.2) { stage = 1; delay = 0.5 + Math.random() * 0.5; maxLife = delay + 0.5; pType = 'delayed'; pColor = '#ffffff'; spd = 1.0 + Math.random() * 2.0; }
        }

        vx = Math.cos(ang) * spd;
        vy = Math.sin(ang) * spd;

        sparks.push({ x: fx, y: fy, vx, vy, color: pColor, color2: pColor2, alpha: 1, life: 0, maxLife, size, gravity, drag, flicker: Math.random() < 0.3, type: pType, temp: 1.0, rot: Math.random() * Math.PI * 2, rotSpd: (Math.random() - 0.5) * 0.2, wind: (Math.random() - 0.5) * 0.1, turb: Math.random() * 0.05, stage, delay, hasExploded: false, isSecondary });
      }

      if (!isSecondary && type === 'finale') {
        for (let i = 0; i < 2; i++) {
          setTimeout(() => { if (running) { createBurst(fx + (Math.random() - 0.5) * 80, fy + (Math.random() - 0.5) * 40, color2, color, 'small', true); } }, 500 + i * 300);
        }
      }
    }

    function updateFireworks(dt: number, t: number) {
      const forceCleanup = t >= 7.5;
      screenFlash = Math.max(0, screenFlash - dt * 1.5);
      cameraShake = Math.max(0, cameraShake - dt * 20.0);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        if (forceCleanup) { rockets.splice(i, 1); continue; }
        r.vy += r.ay * dt * 60; r.vx += r.ax * dt * 60; r.x += r.vx * dt * 60; r.y += r.vy * dt * 60;
        r.flicker = 0.5 + Math.random() * 0.5; r.smokeTimer += dt; r.sparkTimer += dt;
        r.trail.push({ x: r.x, y: r.y, alpha: 1, type: 'core' });
        if (r.trail.length > 6) r.trail.shift();
        r.trail.forEach(tt => tt.alpha -= 0.12);
        if (r.smokeTimer > 0.15) { r.smokeTimer = 0; sparks.push({ x: r.x + (Math.random() - 0.5) * 2, y: r.y + 5, vx: (Math.random() - 0.5) * 0.5, vy: 1 + Math.random() * 0.5, color: 'rgba(150,130,110,1)', color2: 'rgba(100,80,60,1)', alpha: 0.3, life: 0, maxLife: 1.5, size: 2 + Math.random() * 2, gravity: -0.02, drag: 0.98, flicker: false, type: 'smoke', temp: 0, rot: 0, rotSpd: 0, wind: 0.1, turb: 0.02, stage: 0, delay: 0, hasExploded: false, isSecondary: false }); }
        if (r.sparkTimer > 0.03) { r.sparkTimer = 0; sparks.push({ x: r.x, y: r.y + 4, vx: (Math.random() - 0.5) * 1, vy: 2 + Math.random() * 1.5, color: '#ffffff', color2: r.color, alpha: 1, life: 0, maxLife: 0.4, size: 1.0, gravity: 0.1, drag: 0.95, flicker: true, type: 'ember', temp: 1, rot: 0, rotSpd: 0, wind: 0, turb: 0, stage: 0, delay: 0, hasExploded: false, isSecondary: false }); }
        if (r.y <= r.targetY || r.vy >= 0) { createBurst(r.x, r.y, r.color, r.color2, r.type); rockets.splice(i, 1); }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        if (forceCleanup) { sparks.splice(i, 1); continue; }
        s.life += dt;
        if (s.type === 'delayed' && !s.hasExploded) { if (s.life > s.delay) { s.hasExploded = true; createBurst(s.x, s.y, s.color2, s.color, 'small', true); s.alpha = 0; } }
        else { s.vy += s.gravity * dt * 60; s.vx *= (1 - (1 - s.drag) * dt * 60); s.vy *= (1 - (1 - s.drag) * dt * 60); s.vx += Math.sin(s.life * 5 + s.x * 0.1) * s.turb * dt * 60; s.vx += s.wind * dt * 60; s.x += s.vx * dt * 60; s.y += s.vy * dt * 60; s.rot += s.rotSpd * dt * 60; s.temp = Math.max(0, 1 - s.life / s.maxLife); if (s.type === 'smoke') { s.size += dt * 8; s.alpha = Math.max(0, 0.3 * (1 - s.life / s.maxLife)); } else if (s.type === 'ember') { s.alpha = s.temp; } else { s.alpha = Math.max(0, 1 - s.life / s.maxLife); if (s.flicker) s.alpha *= (0.5 + Math.random() * 0.5); } }
        if (s.life > s.maxLife || s.y > H * 0.62 || s.alpha <= 0.01) { sparks.splice(i, 1); }
      }

      for (let i = activeFireworkBursts.length - 1; i >= 0; i--) { const b = activeFireworkBursts[i]; if (forceCleanup) { activeFireworkBursts.splice(i, 1); continue; } b.r += (b.maxR - b.r) * 0.15; b.alpha -= 0.05; if (b.alpha <= 0) activeFireworkBursts.splice(i, 1); }
    }

    function drawFireworks() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      rockets.forEach(r => { r.trail.forEach(tt => { if (tt.alpha > 0) { ctx.globalAlpha = tt.alpha * 0.8; ctx.fillStyle = r.color; ctx.beginPath(); ctx.arc(tt.x, tt.y, 1.5, 0, Math.PI * 2); ctx.fill(); } }); ctx.globalAlpha = 1; const fl = 6 + Math.random() * 3; const fg = ctx.createLinearGradient(r.x, r.y, r.x, r.y + fl); fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.5, '#ffaa00'); fg.addColorStop(1, 'rgba(255,0,0,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(r.x - 1.5, r.y); ctx.lineTo(r.x + 1.5, r.y); ctx.lineTo(r.x, r.y + fl); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(r.x, r.y, 2.0 + r.flicker, 0, Math.PI * 2); ctx.fill(); });
      activeFireworkBursts.forEach((b) => { const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); g.addColorStop(0, `${b.color}80`); g.addColorStop(0.4, `${b.color}20`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.globalAlpha = b.alpha; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      sparks.forEach((s) => { if (s.alpha <= 0 || s.type === 'smoke') return; const a = clamp(s.alpha, 0, 1); ctx.globalAlpha = a * 0.25; ctx.drawImage(sparkSprite, s.x - s.size * 4, s.y - s.size * 4, s.size * 8, s.size * 8); ctx.globalAlpha = a; ctx.fillStyle = s.temp > 0.5 ? '#ffffff' : s.color; ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalCompositeOperation = 'source-over';
      sparks.forEach((s) => { if (s.alpha <= 0 || s.type !== 'smoke') return; ctx.globalAlpha = s.alpha * 0.3; ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============

    function spawnDust(t: number) {
      const target = Math.floor(85 * smoothstep(0, 3, t));
      let count = 0;
      for (const p of pool.particles) if (p.active && p.type === 'dust') count++;
      let attempts = 0;
      while (count < target && attempts < 8) { const p = pool.spawn(); if (!p) break; p.type = 'dust'; p.x = Math.random() * W; p.y = Math.random() * H; p.vx = (Math.random() - 0.5) * 0.4; p.vy = -0.05 - Math.random() * 0.35; p.size = 0.6 + Math.random() * 1.8; p.maxLife = 5 + Math.random() * 5; p.life = Math.random() * p.maxLife * 0.4; p.alpha = 0; p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 0.5; count++; attempts++; }
    }

    function spawnPetals(t: number) {
      const intensity = smoothstep(2.0, 5.0, t) * (1 - smoothstep(6.5, 8.0, t));
      if (intensity <= 0) return;
      if (Math.random() > intensity * 0.4) return;
      const p = pool.spawn(); if (!p) return;
      p.type = 'petal'; p.x = Math.random() * W; p.y = -20; p.vx = (Math.random() - 0.5) * 0.8; p.vy = 0.5 + Math.random() * 0.8; p.size = 5 + Math.random() * 6; p.maxLife = 18; p.life = 0; p.alpha = 0; p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 2.5;
    }

    function spawnTextParticles(t: number) {
      if (t < 8.5 || t > 10.5) return;
      if (ramPoints.length === 0) return;
      const target = Math.min(ramPoints.length, 1200);
      let active = 0;
      for (const p of pool.particles) if (p.active && p.type === 'sparkle') active++;
      let attempts = 0;
      while (active < target && attempts < 16) { const p = pool.spawn(); if (!p) break; const pt = ramPoints[Math.floor(Math.random() * ramPoints.length)]; p.type = 'sparkle'; const side = Math.floor(Math.random() * 4); if (side === 0) { p.x = Math.random() * W; p.y = -20; } else if (side === 1) { p.x = W + 20; p.y = Math.random() * H; } else if (side === 2) { p.x = Math.random() * W; p.y = H + 20; } else { p.x = -20; p.y = Math.random() * H; } p.tx = W / 2 + pt.x; p.ty = H * 0.38 + pt.y; p.vx = 0; p.vy = 0; p.size = 1.2 + Math.random() * 2.0; p.maxLife = 8; p.life = 0; p.alpha = 0; p.delay = Math.random() * 0.5; active++; attempts++; }
    }

    function spawnIncenseSmoke(t: number) {
      const intensity = smoothstep(1.5, 4.0, t) * (1 - smoothstep(6.5, 8.0, t));
      if (intensity <= 0) return;
      if (Math.random() > 0.08 * intensity) return;
      const s = Math.min(W, H) * 0.0011;
      const emitterX = Math.random() < 0.5 ? W * 0.15 : W * 0.85;
      const p = pool.spawn(); if (!p) return;
      p.type = 'smoke'; p.x = emitterX; p.y = H * 0.85 - 12 * s; p.vx = (Math.random() - 0.5) * 0.25; p.vy = -0.5 - Math.random() * 0.45; p.size = 6 + Math.random() * 8; p.maxLife = 4.5 + Math.random() * 3.5; p.life = 0; p.alpha = 0;
    }

    function spawnBirds(t: number) {
      if (t < 3.0 || t > 4.5) return;
      if (birdsSpawned) return;
      birdsSpawned = true;
      for (let i = 0; i < 14; i++) { const p = pool.spawn(); if (!p) break; p.type = 'bird'; p.x = -60 - i * 18 + Math.random() * 15; p.y = H * 0.22 + Math.random() * 70 + (i % 3) * 12; p.vx = 2.2 + Math.random() * 0.6; p.vy = (Math.random() - 0.5) * 0.15; p.size = 7 + Math.random() * 4; p.maxLife = 25; p.life = 0; p.alpha = 0.65; p.flap = Math.random() * Math.PI * 2; }
    }

    function updateParticles(dt: number, t: number) {
      for (const p of pool.particles) {
        if (!p.active) continue;
        p.life += dt;
        if (p.type === 'dust') { p.x += p.vx; p.y += p.vy; p.vx += (Math.random() - 0.5) * 0.03; p.vy += -0.002; p.rot += p.rotSpd * dt; const lr = p.life / p.maxLife; const env = smoothstep(0, 2, t) * (1 - smoothstep(17.0, 17.5, t)); p.alpha = smoothstep(0, 0.25, lr) * (1 - smoothstep(0.75, 1, lr)) * 0.65 * env; if (p.life > p.maxLife || p.y < -30) { p.life = 0; p.x = Math.random() * W; p.y = H * 0.6; p.alpha = 0; } }
        else if (p.type === 'petal') { p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.012) * 0.35; p.y += p.vy; p.rot += p.rotSpd * dt; const lr = p.life / p.maxLife; p.alpha = smoothstep(0, 0.12, lr) * 0.85 * (1 - smoothstep(6.5, 8.0, t)); if (p.y > H * 0.62 || p.life > p.maxLife) pool.release(p); }
        else if (p.type === 'sparkle') { if (p.delay > 0) { p.delay -= dt; p.alpha = 0; continue; } const dx = p.tx - p.x, dy = p.ty - p.y; const dist = Math.sqrt(dx * dx + dy * dy); if (dist > 1.5) { const speed = clamp(dist * 6.0, 140, 750); p.vx = (dx / dist) * speed; p.vy = (dy / dist) * speed; p.x += p.vx * dt; p.y += p.vy * dt; p.alpha = clamp(p.alpha + dt * 3.0, 0, 0.9); } else { p.x = p.tx + Math.sin(t * 4 + p.idx) * 0.35; p.y = p.ty + Math.cos(t * 4 + p.idx * 1.3) * 0.35; p.alpha = clamp(p.alpha + dt * 2.0, 0, 1); } if (t > 17.0) p.alpha *= 1 - smoothstep(17.0, 17.5, t); if (t > 17.5 && p.alpha < 0.01) pool.release(p); }
        else if (p.type === 'smoke') { p.x += p.vx + Math.sin(t * 1.4 + p.y * 0.01) * 0.25; p.y += p.vy; p.size += dt * 5.2; const lr = p.life / p.maxLife; p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.18; if (p.life > p.maxLife || p.y < -30) pool.release(p); }
        else if (p.type === 'bird') { p.x += p.vx; p.y += p.vy; p.flap += dt * 9; p.alpha = 0.65 * (1 - smoothstep(6.5, 8.0, t)); if (p.x > W + 60 || p.alpha < 0.01) pool.release(p); }
      }
    }

    function drawParticles() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of pool.particles) {
        if (!p.active || p.alpha <= 0.01) continue;
        if (p.type === 'dust') { ctx.globalAlpha = p.alpha; ctx.drawImage(dustSprite, p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8); }
        else if (p.type === 'sparkle') {
          const dist = Math.sqrt((p.tx - p.x) ** 2 + (p.ty - p.y) ** 2);
          const nearTarget = dist < 5;
          ctx.globalAlpha = p.alpha * (nearTarget ? 0.9 : 0.7);
          const sz = nearTarget ? p.size * 0.9 : p.size;
          ctx.drawImage(sparkSprite, p.x - sz * 3, p.y - sz * 3, sz * 6, sz * 6);
          ctx.globalAlpha = p.alpha;
          // ✅ FIX: Particle color gold — same as title
          ctx.fillStyle = nearTarget ? '#FFD700' : '#FFB300';
          ctx.beginPath(); ctx.arc(p.x, p.y, sz * 0.6, 0, Math.PI * 2); ctx.fill();
          if (nearTarget && Math.random() < 0.03) { ctx.globalAlpha = p.alpha * 0.5; ctx.fillStyle = '#FFF8E0'; ctx.beginPath(); ctx.arc(p.x, p.y, sz * 1.8, 0, Math.PI * 2); ctx.fill(); }
        }
        else if (p.type === 'smoke') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = p.alpha; const sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size); sg.addColorStop(0, 'rgba(160,130,100,0.3)'); sg.addColorStop(0.5, 'rgba(120,95,70,0.15)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; }
        else if (p.type === 'petal') { ctx.globalCompositeOperation = 'source-over'; ctx.save(); ctx.globalAlpha = p.alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = '#ff8844'; ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffaa66'; ctx.beginPath(); ctx.ellipse(p.size * 0.15, 0, p.size * 0.5, p.size * 0.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.globalCompositeOperation = 'lighter'; }
        else if (p.type === 'bird') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = p.alpha; ctx.strokeStyle = '#0d0603'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; const wing = Math.sin(p.flap) * p.size * 0.6; ctx.beginPath(); ctx.moveTo(p.x - p.size, p.y + wing); ctx.quadraticCurveTo(p.x - p.size * 0.2, p.y - p.size * 0.2, p.x, p.y); ctx.quadraticCurveTo(p.x + p.size * 0.2, p.y - p.size * 0.2, p.x + p.size, p.y + wing); ctx.stroke(); ctx.globalCompositeOperation = 'lighter'; }
      }
      ctx.restore();
    }

    // ============ ✅ FIXED: 24K GOLD TITLE — SAME TEXT AS PARTICLES, NO WHITE BORDER ============

    function buildTitleOffscreen(fontSize: number): HTMLCanvasElement {
      const padding = 40;
      const tc = document.createElement("canvas");
      const tctx = tc.getContext("2d")!;
      // ✅ FIX: measure the SAME text — TITLE_TEXT = "जय श्री राम"
      tctx.font = `900 ${fontSize}px "Tiro Devanagari Hindi","Nirmala UI","Mangal",serif`;
      const metrics = tctx.measureText(TITLE_TEXT);
      const textW = metrics.width;
      const textH = fontSize * 1.2;

      tc.width = Math.ceil(textW + padding * 2);
      tc.height = Math.ceil(textH + padding * 2);

      // Re-set font after resize (canvas resize clears state)
      tctx.font = `900 ${fontSize}px "Tiro Devanagari Hindi","Nirmala UI","Mangal",serif`;
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";
      tctx.lineJoin = "round";
      tctx.lineCap = "round";

      const cx = tc.width / 2;
      const cy = tc.height / 2;

      // ✅ FIX: NO white stroke/border — only gold glow behind
      // Soft outer glow — gold, NOT white
      tctx.save();
      tctx.shadowColor = 'rgba(255, 180, 0, 0.8)';
      tctx.shadowBlur = fontSize * 0.35;
      tctx.shadowOffsetX = 0;
      tctx.shadowOffsetY = 0;
      tctx.fillStyle = 'rgba(255, 200, 50, 0.5)';
      tctx.fillText(TITLE_TEXT, cx, cy);
      tctx.restore();

      // Second glow layer — warmer
      tctx.save();
      tctx.shadowColor = 'rgba(255, 140, 0, 0.6)';
      tctx.shadowBlur = fontSize * 0.2;
      tctx.fillStyle = 'rgba(255, 180, 30, 0.6)';
      tctx.fillText(TITLE_TEXT, cx, cy);
      tctx.restore();

      // ✅ FIX: Main text — 24K Gold gradient, NO white stroke
      const goldGrad = tctx.createLinearGradient(cx - textW / 2, cy - textH / 2, cx + textW / 2, cy + textH / 2);
      goldGrad.addColorStop(0, '#FFF1B8');    // light gold highlight
      goldGrad.addColorStop(0.2, '#FFD700');   // pure gold
      goldGrad.addColorStop(0.45, '#FFAA00');  // deep gold
      goldGrad.addColorStop(0.55, '#FF8C00');  // dark gold
      goldGrad.addColorStop(0.8, '#FFD700');   // pure gold
      goldGrad.addColorStop(1, '#FFF1B8');     // light gold highlight
      tctx.fillStyle = goldGrad;
      tctx.fillText(TITLE_TEXT, cx, cy);

      // ✅ FIX: Inner highlight — NOT white stroke, just a subtle lighter pass
      tctx.save();
      tctx.globalCompositeOperation = 'lighter';
      tctx.globalAlpha = 0.15;
      const hlGrad = tctx.createLinearGradient(cx - textW / 2, cy - textH / 2, cx - textW / 2, cy);
      hlGrad.addColorStop(0, '#FFFFFF');
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
      tctx.fillStyle = hlGrad;
      tctx.fillText(TITLE_TEXT, cx, cy);
      tctx.restore();

      titleOffscreenW = tc.width;
      titleOffscreenH = tc.height;
      lastTitleFontSize = fontSize;

      return tc;
    }

    function drawTitle(t: number) {
      // Title appears after particles settle (t > 10.5) and fades before handover (t > 17)
      const fadeIn = smoothstep(10.5, 11.5, t);
      const fadeOut = smoothstep(17.0, 17.5, t);
      const vis = fadeIn * (1 - fadeOut);
      if (vis <= 0) return;

      const fontSize = Math.min(W * 0.125, 130);

      // Rebuild cache if needed (resize or first time)
      if (!titleOffscreen || Math.abs(lastTitleFontSize - fontSize) > 1) {
        titleOffscreen = buildTitleOffscreen(fontSize);
      }

      ctx.save();
      ctx.globalAlpha = vis;

      // Draw the cached gold title centered on screen
      const drawX = (W - titleOffscreenW) / 2;
      const drawY = (H * 0.38 - titleOffscreenH / 2);

      // ✅ FIX: No extra white glow around the title
      // Only a very subtle gold ambient glow
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = vis * 0.3;
      const ambientGlow = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, titleOffscreenW * 0.8);
      ambientGlow.addColorStop(0, 'rgba(255, 180, 0, 0.25)');
      ambientGlow.addColorStop(0.5, 'rgba(255, 120, 0, 0.08)');
      ambientGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Draw the cached title
      ctx.drawImage(titleOffscreen, drawX, drawY);

      ctx.restore();
    }

    // ============ SUBTITLE ============
    function drawSubtitle(t: number) {
      const fadeIn = smoothstep(11.5, 12.5, t);
      const fadeOut = smoothstep(17.0, 17.5, t);
      const vis = fadeIn * (1 - fadeOut);
      if (vis <= 0) return;

      const fontSize = Math.min(W * 0.032, 28);
      const subtitleY = H * 0.38 + Math.min(W * 0.125, 130) * 0.8;

      ctx.save();
      ctx.globalAlpha = vis * 0.85;
      ctx.font = `400 ${fontSize}px "Tiro Devanagari Hindi","Nirmala UI","Mangal",serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Gold color matching the title
      const subGrad = ctx.createLinearGradient(W / 2 - 150, subtitleY, W / 2 + 150, subtitleY);
      subGrad.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
      subGrad.addColorStop(0.5, 'rgba(255, 235, 150, 0.9)');
      subGrad.addColorStop(1, 'rgba(255, 215, 0, 0.7)');
      ctx.fillStyle = subGrad;
      ctx.fillText(' आपको और आपके परिवार को राम नवमी की हार्दिक शुभकामनाएं', W / 2, subtitleY);

      ctx.restore();
    }

    // ============ VIGNETTE & GRAIN ============
    function drawVignette() {
      const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function drawGrain() {
      ctx.save();
      ctx.globalAlpha = 0.035;
      ctx.globalCompositeOperation = 'overlay';
      // Tile the grain texture
      const pattern = ctx.createPattern(grain, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // ============ MAIN ANIMATION LOOP ============
    function animate(timestamp: number) {
      if (!running) return;

      if (startTime === 0) {
        startTime = timestamp;
        lastTime = timestamp;
      }

      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;
      const t = (timestamp - startTime) / 1000;

      // Camera shake
      let shakeX = 0, shakeY = 0;
      if (cameraShake > 0.01) {
        shakeX = (Math.random() - 0.5) * cameraShake * 2;
        shakeY = (Math.random() - 0.5) * cameraShake * 2;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Background
      drawBackground(t);

      // 2. Divine light (Scene 1-2)
      drawDivineLight(t);

      // 3. Ram Mandir (Scene 2)
      drawRamMandir(t, ctx);

      // 4. Capture reflection before water
      if (t > 2.0 && t < 8.0) {
        rctx.clearRect(0, 0, reflectCanvas.width, reflectCanvas.height);
        rctx.drawImage(canvas, 0, 0, reflectCanvas.width, reflectCanvas.height);
      }

      // 5. Water reflection (Scene 2)
      drawWater(t);

      // 6. Floating diyas (Scene 2)
      updateAndDrawFloatingDiyas(t);

      // 7. Fog (Scene 2)
      drawFogAndHaze(t);

      // 8. Fireworks (Scene 2-3 transition)
      launchFireworks(t);
      updateFireworks(dt, t);
      drawFireworks();

      // 9. Text scene god rays (Scene 3)
      const textVis = smoothstep(8.0, 9.5, t) * (1 - smoothstep(17.0, 17.5, t));
      drawTopGodRays(t, textVis);

      // 10. Spawn particles
      spawnDust(t);
      spawnPetals(t);
      spawnTextParticles(t);
      spawnIncenseSmoke(t);
      spawnBirds(t);

      // 11. Update & draw particles
      updateParticles(dt, t);
      drawParticles();

      // 12. ✅ FIXED: Gold title — same text as particles, no white border
      drawTitle(t);

      // 13. Subtitle
      drawSubtitle(t);

      // 14. Post-processing
      drawVignette();
      drawGrain();

      ctx.restore();

      // Handover trigger
      if (t > 18.0 && !handoverTriggered) {
        handoverTriggered = true;
        setTimeout(() => {
          if (running && onCompleteRef.current) {
            onCompleteRef.current();
          }
        }, 200);
      }

      // Stop after handover + fade
      if (t > 19.0) {
        running = false;
        return;
      }

      rafId = requestAnimationFrame(animate);
    }

    // ============ INIT ============
    resize();
    window.addEventListener('resize', resize);

    // Wait for font to load before starting
    const startAnimation = () => {
      sampleText();
      titleOffscreen = null;
      lastTitleFontSize = 0;
      rafId = requestAnimationFrame(animate);
    };

    // Try to start after font loads, with fallback
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(startAnimation);
    } else {
      setTimeout(startAnimation, 500);
    }

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#000',
      }}
    />
  );
}
