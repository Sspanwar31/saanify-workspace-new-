'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
}

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smoothstep = (a: number, b: number, t: number) => {
  if (b === a) return t < a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));

type PType = 'dust' | 'petal' | 'sparkle' | 'smoke' | 'bird';
interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; tx: number; ty: number; rot: number; rotSpd: number;
  flap: number; active: boolean; delay: number; color: string;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', tx: 0, ty: 0, rot: 0, rotSpd: 0, flap: 0, active: false, delay: 0, color: '#fff'
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    p.active = true; p.life = 0; p.alpha = 0; p.delay = 0;
    return p;
  }
  release(p: Particle) { p.active = false; this.free.push(p.idx); }
}

interface FireworkRocket {
  x: number; y: number; vx: number; vy: number; ax: number; ay: number;
  targetY: number; color: string; color2: string; type: string;
  trail: { x: number; y: number; alpha: number }[]; flicker: number;
  smokeTimer: number; sparkTimer: number;
}
interface FireworkSpark {
  x: number; y: number; vx: number; vy: number; color: string; color2: string;
  alpha: number; life: number; maxLife: number; size: number;
  gravity: number; drag: number; flicker: boolean; type: string;
  temp: number; wind: number; turb: number;
  stage: number; delay: number; hasExploded: boolean; isSecondary: boolean;
}
interface FloatingDiya {
  x: number; y: number; scale: number; speed: number;
  phase: number; flamePulse: number;
}

const TITLE_TEXT = 'जय श्री राम';
const HORIZON = 0.62;

// ============ Volumetric Ray Definition ============
interface RayShaft {
  angle: number;
  width: number;
  len: number;
  opacity: number;
  broken: boolean;
  gapPattern: number;
}

const RAY_DEFS: RayShaft[] = [
  { angle: -2.4, width: 45, len: 0.75, opacity: 0.055, broken: false, gapPattern: 0 },
  { angle: -2.05, width: 22, len: 0.85, opacity: 0.035, broken: true, gapPattern: 1.7 },
  { angle: -1.7, width: 60, len: 0.65, opacity: 0.07, broken: false, gapPattern: 0 },
  { angle: -1.4, width: 28, len: 0.9, opacity: 0.045, broken: false, gapPattern: 0 },
  { angle: -1.1, width: 18, len: 0.55, opacity: 0.03, broken: true, gapPattern: 2.3 },
  { angle: -0.8, width: 32, len: 0.45, opacity: 0.035, broken: true, gapPattern: 3.1 },
  { angle: -0.5, width: 14, len: 0.32, opacity: 0.02, broken: true, gapPattern: 1.2 },
  { angle: -0.2, width: 10, len: 0.22, opacity: 0.012, broken: true, gapPattern: 0.8 },
  { angle: 0.15, width: 10, len: 0.22, opacity: 0.012, broken: true, gapPattern: 2.0 },
  { angle: 0.4, width: 14, len: 0.32, opacity: 0.02, broken: true, gapPattern: 1.5 },
  { angle: 0.7, width: 28, len: 0.48, opacity: 0.035, broken: true, gapPattern: 2.8 },
  { angle: 1.0, width: 18, len: 0.55, opacity: 0.03, broken: true, gapPattern: 0.5 },
  { angle: 1.3, width: 35, len: 0.85, opacity: 0.045, broken: false, gapPattern: 0 },
  { angle: 1.6, width: 55, len: 0.68, opacity: 0.065, broken: false, gapPattern: 0 },
  { angle: 1.95, width: 24, len: 0.82, opacity: 0.04, broken: true, gapPattern: 1.9 },
  { angle: 2.3, width: 42, len: 0.72, opacity: 0.05, broken: false, gapPattern: 0 },
];

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
    let startTime = 0, rafId = 0, running = true, lastTime = 0;
    let birdsSpawned = false, handoverTriggered = false;
    let screenFlash = 0, cameraShake = 0, lastRocketLaunchTime = 0;

    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    const pool = new ParticlePool(2000);
    let ramPoints: { x: number; y: number }[] = [];
    let diyas: FloatingDiya[] = [];
    const rockets: FireworkRocket[] = [];
    const sparks: FireworkSpark[] = [];
    const fwBursts: { x: number; y: number; color: string; r: number; maxR: number; alpha: number }[] = [];

    const fwColors = [
      ['#ffaa00', '#ff3300'], ['#00e5ff', '#0055ff'], ['#ff00aa', '#aa00ff'],
      ['#ffd700', '#ffffff'], ['#00ff66', '#00aa00'], ['#ff0033', '#ffffff']
    ];

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

    function getSunVis(t: number): number {
      const reveal = smoothstep(0, 1.5, t);
      const dim = 1 - smoothstep(1.5, 1.8, t) * 0.7;
      const fade = 1 - smoothstep(6.5, 8.5, t);
      return reveal * dim * fade;
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      grain.width = 256; grain.height = 256;
      generateGrain();
      sampleText();
      initializeDiyas();
    }

    function generateGrain() {
      const id = gctx.createImageData(grain.width, grain.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = Math.random() * 255;
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 15;
      }
      gctx.putImageData(id, 0, 0);
    }

    function initializeDiyas() {
      diyas.length = 0;
      for (let i = 0; i < 40; i++) {
        const progress = Math.random();
        const y = lerp(H * HORIZON + 10, H * 0.97, progress);
        diyas.push({
          x: Math.random() * W, y,
          scale: lerp(0.15, 1.0, progress),
          speed: lerp(2, 10, progress) * (Math.random() < 0.5 ? -1 : 1),
          phase: Math.random() * Math.PI * 2,
          flamePulse: Math.random() * 10,
        });
      }
    }

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
      tctx.fillText(TITLE_TEXT, tc.width / 2, tc.height / 2);
      const img = tctx.getImageData(0, 0, tc.width, tc.height);
      ramPoints = [];
      const step = 2;
      for (let y = 0; y < tc.height; y += step) {
        for (let x = 0; x < tc.width; x += step) {
          if (img.data[(y * tc.width + x) * 4 + 3] > 20) {
            ramPoints.push({ x: x - tc.width / 2, y: y - tc.height / 2 });
          }
        }
      }
    }

    // ===================== DRAW: SKY =====================
    function drawSky(t: number) {
      const vis = smoothstep(0, 1.2, t) * (1 - smoothstep(6.5, 8.5, t));
      const textDark = smoothstep(6.5, 8.0, t);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      const v = vis * (1 - textDark);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.35, `rgb(${Math.floor(lerp(0, 8, v))},${Math.floor(lerp(0, 3, v))},${Math.floor(lerp(0, 5, v))})`);
      grad.addColorStop(0.55, `rgb(${Math.floor(lerp(0, 35, v))},${Math.floor(lerp(0, 10, v))},${Math.floor(lerp(0, 5, v))})`);
      grad.addColorStop(0.75, `rgb(${Math.floor(lerp(0, 100, v))},${Math.floor(lerp(0, 35, v))},${Math.floor(lerp(0, 10, v))})`);
      grad.addColorStop(0.9, `rgb(${Math.floor(lerp(0, 170, v))},${Math.floor(lerp(0, 70, v))},${Math.floor(lerp(0, 20, v))})`);
      grad.addColorStop(HORIZON, `rgb(${Math.floor(lerp(0, 220, v))},${Math.floor(lerp(0, 110, v))},${Math.floor(lerp(0, 35, v))})`);
      grad.addColorStop(HORIZON + 0.01, `rgb(${Math.floor(lerp(0, 15, v))},${Math.floor(lerp(0, 6, v))},${Math.floor(lerp(0, 2, v))})`);
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // ===================== DRAW: SUN (Horizon, Half Visible) =====================
    function drawSun(t: number) {
      const vis = getSunVis(t);
      if (vis <= 0) return;

      const sunX = W * 0.5;
      const sunY = H * HORIZON;
      const sunR = Math.min(W, H) * 0.16;

      // Color breathing — साँस लेता हुआ सूरज
      const breath = Math.sin(t * 0.4) * 0.06;
      const breathR = clamp(255 + breath * 30, 240, 255);
      const breathG = clamp(240 + breath * 20, 220, 255);
      const breathB = clamp(180 - breath * 40, 140, 200);

      ctx.save();

      // Clip to above horizon — आधा सूरज ऊपर, आधा नीचे छिपा
      ctx.beginPath();
      ctx.rect(0, 0, W, H * HORIZON + 2);
      ctx.clip();

      // Outer atmospheric glow
      const outerR = sunR * 4;
      const outerGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, outerR);
      outerGlow.addColorStop(0, `rgba(${Math.floor(breathR)}, ${Math.floor(breathG * 0.85)}, ${Math.floor(breathB * 0.6)}, ${0.35 * vis})`);
      outerGlow.addColorStop(0.25, `rgba(255, 160, 60, ${0.12 * vis})`);
      outerGlow.addColorStop(0.5, `rgba(180, 70, 20, ${0.04 * vis})`);
      outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, W, H * HORIZON);

      // Soft Glow Ring — camera lens effect
      ctx.strokeStyle = `rgba(255, 210, 130, ${0.08 * vis})`;
      ctx.lineWidth = sunR * 0.12;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 1.35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 230, 180, ${0.04 * vis})`;
      ctx.lineWidth = sunR * 0.08;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 1.7, 0, Math.PI * 2);
      ctx.stroke();

      // Sun disk gradient — सफेद-गर्म core
      const diskGrad = ctx.createRadialGradient(sunX, sunY - sunR * 0.08, 0, sunX, sunY, sunR);
      diskGrad.addColorStop(0, `rgba(${Math.floor(breathR)}, ${Math.floor(breathG)}, ${Math.floor(breathB)}, ${vis})`);
      diskGrad.addColorStop(0.5, `rgba(255, 225, 160, ${vis * 0.9})`);
      diskGrad.addColorStop(0.8, `rgba(255, 190, 90, ${vis * 0.5})`);
      diskGrad.addColorStop(1, 'rgba(255, 150, 50, 0)');
      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Sun glow below horizon (reflected warmth on water surface)
      const belowGlow = ctx.createRadialGradient(sunX, sunY + 10, 0, sunX, sunY + 10, sunR * 2.5);
      belowGlow.addColorStop(0, `rgba(255, 180, 80, ${0.08 * vis})`);
      belowGlow.addColorStop(0.5, `rgba(200, 100, 30, ${0.03 * vis})`);
      belowGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = belowGlow;
      ctx.fillRect(sunX - sunR * 3, sunY, sunR * 6, sunR * 3);
    }

    // ===================== DRAW: HEAT SHIMMER =====================
    function drawHeatShimmer(t: number) {
      const vis = getSunVis(t);
      if (vis <= 0) return;
      const sunX = W * 0.5;
      const sunY = H * HORIZON;
      const r = Math.min(W, H) * 0.2;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const y = sunY - r * 0.15 - i * r * 0.18;
        const wx = Math.sin(t * 2.5 + i * 1.8) * 10 + Math.cos(t * 1.7 + i * 0.9) * 5;
        const sw = r * (1.2 - i * 0.12);
        const a = 0.015 * vis * (1 - i * 0.12);
        if (a <= 0) continue;
        const grad = ctx.createRadialGradient(sunX + wx, y, 0, sunX + wx, y, sw);
        grad.addColorStop(0, `rgba(255, 235, 190, ${a})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(sunX + wx, y, sw, sw * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ===================== DRAW: VOLUMETRIC RAYS (NOT Triangles!) =====================
    function drawRaySegment(sx: number, sy: number, ex: number, ey: number, w: number, px: number, py: number, opacity: number, t: number) {
      if (opacity < 0.001) return;
      // Pass 1: Wide soft outer
      const g1 = ctx.createLinearGradient(sx, sy, ex, ey);
      g1.addColorStop(0, `rgba(255, 248, 230, ${opacity * 1.6})`);
      g1.addColorStop(0.15, `rgba(255, 210, 140, ${opacity})`);
      g1.addColorStop(0.5, `rgba(255, 155, 55, ${opacity * 0.35})`);
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.moveTo(sx + px * w * 0.7, sy + py * w * 0.7);
      ctx.lineTo(sx - px * w * 0.7, sy - py * w * 0.7);
      ctx.lineTo(ex - px * w * 0.15, ey - py * w * 0.15);
      ctx.lineTo(ex + px * w * 0.15, ey + py * w * 0.15);
      ctx.closePath();
      ctx.fill();

      // Pass 2: Narrow bright core
      const g2 = ctx.createLinearGradient(sx, sy, ex, ey);
      g2.addColorStop(0, `rgba(255, 255, 245, ${opacity * 2.2})`);
      g2.addColorStop(0.25, `rgba(255, 235, 190, ${opacity * 1.4})`);
      g2.addColorStop(0.6, `rgba(255, 180, 80, ${opacity * 0.4})`);
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.moveTo(sx + px * w * 0.18, sy + py * w * 0.18);
      ctx.lineTo(sx - px * w * 0.18, sy - py * w * 0.18);
      ctx.lineTo(ex - px * w * 0.04, ey - py * w * 0.04);
      ctx.lineTo(ex + px * w * 0.04, ey + py * w * 0.04);
      ctx.closePath();
      ctx.fill();
    }

    function drawVolumetricRays(t: number) {
      const vis = getSunVis(t);
      const templeReveal = smoothstep(1.8, 3.5, t);
      if (vis <= 0) return;

      const sunX = W * 0.5;
      const sunY = H * HORIZON;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < RAY_DEFS.length; i++) {
        const r = RAY_DEFS[i];
        const angleWobble = Math.sin(t * 0.18 + i * 1.7) * 0.018;
        const angle = r.angle + angleWobble - Math.PI / 2;
        const widthWobble = Math.sin(t * 0.25 + i * 2.3) * 6;
        const width = r.width + widthWobble;
        const length = H * r.len;
        const flicker = 0.65 + 0.35 * Math.sin(t * 0.55 + i * 0.95);
        let opacity = r.opacity * flicker * vis;

        // Center rays: मंदिर आने के बाद ज़्यादा visible (light leaking from behind)
        const isCenter = Math.abs(r.angle) < 0.9;
        if (isCenter) opacity *= (0.15 + 0.85 * templeReveal);

        if (opacity < 0.001) continue;

        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const perpX = -dirY;
        const perpY = dirX;

        if (r.broken) {
          // टूटी-फूटी किरनें — segments with gaps
          const segCount = 4;
          for (let s = 0; s < segCount; s++) {
            const gapVal = Math.sin(r.gapPattern + s * 2.7 + t * 0.15);
            if (gapVal > 0.2) continue; // skip this segment — gap
            const sf = s / segCount;
            const ef = (s + 0.55) / segCount;
            const ssx = sunX + dirX * length * sf;
            const ssy = sunY + dirY * length * sf;
            const eex = sunX + dirX * length * ef;
            const eey = sunY + dirY * length * ef;
            const segW = width * (1 - sf * 0.6);
            drawRaySegment(ssx, ssy, eex, eey, segW, perpX, perpY, opacity * (1 - sf * 0.65), t);
          }
        } else {
          drawRaySegment(sunX, sunY, sunX + dirX * length, sunY + dirY * length, width, perpX, perpY, opacity, t);
        }
      }

      // Scattering spots — धूल के कणों पर रोशनी
      for (let i = 0; i < 20; i++) {
        const sa = (i / 20) * Math.PI * 1.4 - Math.PI * 0.7 - Math.PI / 2;
        const sd = H * (0.15 + 0.35 * ((Math.sin(i * 3.7) + 1) / 2));
        const sx = sunX + Math.cos(sa) * sd + Math.sin(t * 0.8 + i * 2.1) * 15;
        const sy = sunY + Math.sin(sa) * sd;
        if (sy > H * HORIZON) continue;
        const sAlpha = 0.04 * vis * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 1.5));
        const sSize = 3 + Math.sin(i * 1.3) * 2;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sSize * 4);
        sg.addColorStop(0, `rgba(255, 240, 200, ${sAlpha})`);
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, sSize * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ===================== DRAW: TEMPLE SILHOUETTE + RIM LIGHTING =====================
    function drawTempleSilhouette(t: number) {
      const reveal = smoothstep(1.8, 4.0, t);
      const fade = 1 - smoothstep(6.5, 8.0, t);
      if (reveal <= 0) return;
      const vis = reveal * fade;

      const s = Math.min(W, H) * 0.0012;
      const mx = W * 0.5; // CENTERED — सूरज के सामने
      const baseY = H * HORIZON;

      const goldPulse = 0.6 + 0.4 * Math.sin(t * 2.5);

      ctx.save();
      ctx.globalAlpha = vis;

      // === Rim lighting setup: golden shadow glow ===
      ctx.shadowColor = `rgba(255, 190, 80, ${0.6 * vis * goldPulse})`;
      ctx.shadowBlur = 18 * s;

      const dark = '#060201';
      const darkMid = '#0a0403';
      const goldStroke = `rgba(255, 200, 100, ${0.5 * goldPulse})`;

      // --- Platforms ---
      const drawPlatform = (pw: number, ph: number, py: number) => {
        ctx.fillStyle = dark;
        ctx.fillRect(mx - pw / 2, py, pw, ph);
        ctx.strokeStyle = goldStroke;
        ctx.lineWidth = 1.2 * s;
        ctx.strokeRect(mx - pw / 2, py, pw, ph);
      };
      drawPlatform(360 * s, 16 * s, baseY - 16 * s);
      drawPlatform(320 * s, 12 * s, baseY - 28 * s);
      drawPlatform(280 * s, 10 * s, baseY - 38 * s);

      const sanctumY = baseY - 38 * s;
      const sanctumW = 150 * s;
      const sanctumH = 80 * s;

      // --- Sanctum wall (dark silhouette) ---
      ctx.fillStyle = dark;
      ctx.fillRect(mx - sanctumW / 2, sanctumY - sanctumH, sanctumW, sanctumH);

      // Door arch — gold outline only (silhouette style)
      ctx.strokeStyle = `rgba(255, 210, 120, ${0.45 * goldPulse})`;
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      ctx.moveTo(mx - sanctumW * 0.35, sanctumY);
      ctx.lineTo(mx - sanctumW * 0.35, sanctumY - sanctumH * 0.55);
      ctx.quadraticCurveTo(mx, sanctumY - sanctumH * 0.85, mx + sanctumW * 0.35, sanctumY - sanctumH * 0.55);
      ctx.lineTo(mx + sanctumW * 0.35, sanctumY);
      ctx.stroke();

      // Inner door
      ctx.strokeStyle = `rgba(255, 200, 90, ${0.3 * goldPulse})`;
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(mx - sanctumW * 0.2, sanctumY);
      ctx.lineTo(mx - sanctumW * 0.2, sanctumY - sanctumH * 0.4);
      ctx.quadraticCurveTo(mx, sanctumY - sanctumH * 0.65, mx + sanctumW * 0.2, sanctumY - sanctumH * 0.4);
      ctx.lineTo(mx + sanctumW * 0.2, sanctumY);
      ctx.stroke();

      // Vertical center line
      ctx.beginPath();
      ctx.moveTo(mx, sanctumY - sanctumH * 0.65);
      ctx.lineTo(mx, sanctumY);
      ctx.stroke();

      // --- Pillars (dark rectangles with gold edges) ---
      const pillarXs = [-100, -65, -30, 30, 65, 100];
      pillarXs.forEach(px => {
        const pw = 10 * s;
        const ph = 70 * s;
        const pxPos = mx + px * s;
        ctx.fillStyle = darkMid;
        ctx.fillRect(pxPos - pw / 2, sanctumY - ph, pw, ph);
        ctx.strokeStyle = goldStroke;
        ctx.lineWidth = 0.8 * s;
        ctx.strokeRect(pxPos - pw / 2, sanctumY - ph, pw, ph);
        // Capital
        ctx.fillStyle = dark;
        ctx.fillRect(pxPos - pw * 0.8, sanctumY - ph, pw * 1.6, 5 * s);
        ctx.strokeRect(pxPos - pw * 0.8, sanctumY - ph, pw * 1.6, 5 * s);
      });

      // --- Arches between pillars ---
      ctx.strokeStyle = `rgba(255, 200, 100, ${0.35 * goldPulse})`;
      ctx.lineWidth = 1.2 * s;
      for (let i = 0; i < pillarXs.length - 1; i++) {
        const x1 = mx + pillarXs[i] * s;
        const x2 = mx + pillarXs[i + 1] * s;
        const archY = sanctumY - 62 * s;
        ctx.beginPath();
        ctx.arc((x1 + x2) / 2, archY, (x2 - x1) / 2, Math.PI, 0);
        ctx.stroke();
        // Small gold dot at apex
        ctx.fillStyle = `rgba(255, 215, 50, ${0.5 * goldPulse})`;
        ctx.beginPath();
        ctx.arc((x1 + x2) / 2, archY + 4 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Nagara Shikharas (silhouette with gold outline) ---
      const drawShikhara = (cx: number, cy: number, w: number, h: number, isMain: boolean) => {
        // Dark filled shape
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, cy);
        ctx.bezierCurveTo(cx - w * 0.48, cy - h * 0.4, cx - w * 0.22, cy - h * 0.82, cx - w * 0.06, cy - h);
        ctx.lineTo(cx + w * 0.06, cy - h);
        ctx.bezierCurveTo(cx + w * 0.22, cy - h * 0.82, cx + w * 0.48, cy - h * 0.4, cx + w / 2, cy);
        ctx.closePath();
        ctx.fill();

        // Gold outline — rim light effect
        ctx.strokeStyle = `rgba(255, 210, 130, ${0.4 * goldPulse})`;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // Subtle tier lines
        const tiers = isMain ? 14 : 8;
        ctx.strokeStyle = `rgba(255, 200, 100, ${0.15 * goldPulse})`;
        ctx.lineWidth = 0.7 * s;
        for (let i = 1; i < tiers; i++) {
          const f = i / tiers;
          const ty = cy - h * f;
          const tw = lerp(w, w * 0.12, Math.pow(f, 1.2));
          ctx.beginPath();
          ctx.moveTo(cx - tw / 2, ty);
          ctx.lineTo(cx + tw / 2, ty);
          ctx.stroke();
        }

        // Amalaka
        const topY = cy - h;
        const amW = w * 0.3;
        const amH = 10 * s;
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(cx, topY - amH / 2, amW / 2, amH / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 220, 100, ${0.6 * goldPulse})`;
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // Kalash — maximum glow!
        const kalashY = topY - amH;
        const kGlow = isMain ? goldPulse : goldPulse * 0.7;
        // Glow behind kalash
        const kGlowGrad = ctx.createRadialGradient(cx, kalashY - 8 * s, 0, cx, kalashY - 8 * s, 20 * s);
        kGlowGrad.addColorStop(0, `rgba(255, 230, 150, ${0.5 * kGlow})`);
        kGlowGrad.addColorStop(0.5, `rgba(255, 180, 60, ${0.15 * kGlow})`);
        kGlowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = kGlowGrad;
        ctx.beginPath();
        ctx.arc(cx, kalashY - 8 * s, 20 * s, 0, Math.PI * 2);
        ctx.fill();

        // Kalash body
        const kGrad = ctx.createLinearGradient(cx - 8 * s, kalashY, cx + 8 * s, kalashY);
        kGrad.addColorStop(0, '#8a5500');
        kGrad.addColorStop(0.3, '#ffd700');
        kGrad.addColorStop(0.5, '#fff8e0');
        kGrad.addColorStop(0.7, '#ffd700');
        kGrad.addColorStop(1, '#8a5500');
        ctx.fillStyle = kGrad;
        ctx.beginPath();
        ctx.arc(cx, kalashY - 8 * s, 8 * s, 0, Math.PI * 2);
        ctx.fill();

        // Kalash neck + finial
        ctx.fillRect(cx - 3 * s, kalashY - 13 * s, 6 * s, 5 * s);
        ctx.beginPath();
        ctx.moveTo(cx, kalashY - 13 * s);
        ctx.lineTo(cx - 2.5 * s, kalashY - 24 * s);
        ctx.lineTo(cx + 2.5 * s, kalashY - 24 * s);
        ctx.closePath();
        ctx.fill();

        return kalashY - 24 * s;
      };

      // Main shikhara center, smaller ones on sides
      const mainTop = drawShikhara(mx, sanctumY, 110 * s, 240 * s, true);
      drawShikhara(mx - 75 * s, sanctumY, 60 * s, 145 * s, false);
      drawShikhara(mx + 75 * s, sanctumY, 60 * s, 145 * s, false);
      drawShikhara(mx - 130 * s, sanctumY, 48 * s, 100 * s, false);
      drawShikhara(mx + 130 * s, sanctumY, 48 * s, 100 * s, false);

      // --- Flag pole ---
      const poleTop = mainTop - 25 * s;
      const poleGrad = ctx.createLinearGradient(mx - 2 * s, 0, mx + 2 * s, 0);
      poleGrad.addColorStop(0, '#1a0a02');
      poleGrad.addColorStop(0.5, '#3d210d');
      poleGrad.addColorStop(1, '#1a0a02');
      ctx.shadowBlur = 0; // no shadow on thin pole
      ctx.fillStyle = poleGrad;
      ctx.fillRect(mx - 1.5 * s, poleTop, 3 * s, mainTop - poleTop);

      // Finial gold tip
      ctx.shadowColor = `rgba(255, 220, 100, ${0.7 * goldPulse})`;
      ctx.shadowBlur = 10 * s;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(mx, poleTop - 3 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();

      // Waving flag
      const w1 = Math.sin(t * 5.5) * 5 * s;
      const w2 = Math.sin(t * 5.5 + 1.3) * 3 * s;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(mx, poleTop);
      ctx.quadraticCurveTo(mx + 13 * s, poleTop + w1, mx + 30 * s + w1, poleTop + 10 * s + w2);
      ctx.quadraticCurveTo(mx + 13 * s, poleTop + 20 * s + w2, mx, poleTop + 22 * s);
      ctx.closePath();
      const flagGrad = ctx.createLinearGradient(mx, poleTop, mx + 30 * s, poleTop);
      flagGrad.addColorStop(0, '#991100');
      flagGrad.addColorStop(0.5, '#cc3300');
      flagGrad.addColorStop(1, '#dd5500');
      ctx.fillStyle = flagGrad;
      ctx.fill();

      ctx.restore();
    }

    // ===================== DRAW: LIGHT LEAK (temple edges) =====================
    function drawLightLeak(t: number) {
      const reveal = smoothstep(2.5, 4.0, t);
      const fade = 1 - smoothstep(6.5, 8.0, t);
      const vis = reveal * fade;
      if (vis <= 0) return;

      const s = Math.min(W, H) * 0.0012;
      const mx = W * 0.5;
      const baseY = H * HORIZON;
      const pulse = 0.6 + 0.4 * Math.sin(t * 2);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Light leaking from left edge of temple
      const leakPoints = [
        { x: mx - 140 * s, y: baseY - 180 * s, r: 40 * s },
        { x: mx - 80 * s, y: baseY - 250 * s, r: 35 * s },
        { x: mx + 80 * s, y: baseY - 250 * s, r: 35 * s },
        { x: mx + 140 * s, y: baseY - 180 * s, r: 40 * s },
        { x: mx, y: baseY - 320 * s, r: 50 * s }, // top of main shikhara
      ];

      leakPoints.forEach((lp, i) => {
        const a = 0.06 * vis * pulse * (0.7 + 0.3 * Math.sin(t * 3 + i * 1.5));
        const grad = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, lp.r);
        grad.addColorStop(0, `rgba(255, 210, 130, ${a})`);
        grad.addColorStop(0.5, `rgba(255, 160, 60, ${a * 0.3})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(lp.x, lp.y, lp.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // ===================== DRAW: FOG & HAZE (Animated) =====================
    function drawFogAndHaze(t: number) {
      const intensity = smoothstep(0.5, 3.0, t) * (1 - smoothstep(6.5, 8.0, t));
      if (intensity <= 0) return;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let layer = 0; layer < 4; layer++) {
        const y = H * (HORIZON - 0.02 + layer * 0.04);
        const speed = 5 + layer * 4;
        const offset = (t * speed + layer * 200) % (W * 2);
        const a = (0.05 - layer * 0.008) * intensity;
        if (a <= 0) continue;

        // Animated haze — undulating
        const grad = ctx.createLinearGradient(0, y - 40, 0, y + 60);
        grad.addColorStop(0, 'rgba(180, 110, 40, 0)');
        grad.addColorStop(0.3 + Math.sin(t * 0.3 + layer) * 0.1, `rgba(180, 110, 40, ${a})`);
        grad.addColorStop(0.7 + Math.cos(t * 0.25 + layer * 0.5) * 0.1, `rgba(160, 90, 30, ${a * 0.6})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-offset, y - 40, W * 3, 100);
      }

      ctx.restore();
    }

    // ===================== DRAW: WATER =====================
    function drawWater(t: number) {
      const vis = smoothstep(2.0, 3.5, t) * (1 - smoothstep(6.5, 8.0, t));
      if (vis <= 0) return;

      const waterY = H * HORIZON;
      const sunVis = getSunVis(t);

      ctx.save();
      ctx.globalAlpha = vis;

      // Dark water base
      const wGrad = ctx.createLinearGradient(0, waterY, 0, H);
      wGrad.addColorStop(0, '#080301');
      wGrad.addColorStop(0.4, '#040101');
      wGrad.addColorStop(1, '#010000');
      ctx.fillStyle = wGrad;
      ctx.fillRect(0, waterY, W, H - waterY);

      // Sun reflection on water — golden shimmer path
      if (sunVis > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const sunX = W * 0.5;
        for (let y = waterY + 3; y < H; y += 3) {
          const dist = (y - waterY) / (H - waterY);
          const waveX = Math.sin(y * 0.12 + t * 4) * (8 + dist * 15) + Math.cos(y * 0.08 - t * 2.5) * 4;
          const lineW = lerp(60, 15, dist) * (0.7 + 0.3 * Math.sin(y * 0.2 + t * 3));
          const a = lerp(0.06, 0.02, dist) * sunVis;

          const rGrad = ctx.createLinearGradient(sunX + waveX - lineW, y, sunX + waveX + lineW, y);
          rGrad.addColorStop(0, 'rgba(0,0,0,0)');
          rGrad.addColorStop(0.3, `rgba(255, 200, 100, ${a})`);
          rGrad.addColorStop(0.5, `rgba(255, 240, 180, ${a * 1.5})`);
          rGrad.addColorStop(0.7, `rgba(255, 200, 100, ${a})`);
          rGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = rGrad;
          ctx.fillRect(sunX + waveX - lineW, y, lineW * 2, 2.5);
        }
        ctx.restore();
      }

      // Temple silhouette reflection (subtle dark shapes)
      const tReveal = smoothstep(2.5, 4.0, t);
      if (tReveal > 0) {
        ctx.save();
        ctx.globalAlpha = 0.15 * tReveal;
        ctx.translate(0, waterY * 2);
        ctx.scale(1, -1);
        // Simplified temple reflection — just dark vertical shapes
        const s = Math.min(W, H) * 0.0012;
        const mx = W * 0.5;
        const bY = H * HORIZON;
        ctx.fillStyle = '#000';
        // Main shikhara reflection
        ctx.beginPath();
        ctx.moveTo(mx - 55 * s, bY);
        ctx.lineTo(mx - 6 * s, bY - 240 * s);
        ctx.lineTo(mx + 6 * s, bY - 240 * s);
        ctx.lineTo(mx + 55 * s, bY);
        ctx.closePath();
        ctx.fill();
        // Side shikharas
        ctx.beginPath();
        ctx.moveTo(mx - 105 * s, bY);
        ctx.lineTo(mx - 72 * s, bY - 145 * s);
        ctx.lineTo(mx - 50 * s, bY - 145 * s);
        ctx.lineTo(mx - 45 * s, bY);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(mx + 45 * s, bY);
        ctx.lineTo(mx + 50 * s, bY - 145 * s);
        ctx.lineTo(mx + 72 * s, bY - 145 * s);
        ctx.lineTo(mx + 105 * s, bY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Firework reflections in water
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      fwBursts.forEach(b => {
        const rY = waterY + (waterY - b.y) * 0.5;
        if (rY < waterY || rY > H) return;
        const rGrad = ctx.createRadialGradient(b.x, rY, 0, b.x, rY, b.r * 1.5);
        rGrad.addColorStop(0, `${b.color}${Math.floor(b.alpha * 40).toString(16).padStart(2, '0')}`);
        rGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.ellipse(b.x, rY, b.r * 1.2, b.r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      ctx.restore();
    }

    // ===================== DRAW: DIYAS =====================
    function drawDiyas(t: number) {
      const vis = smoothstep(3.0, 4.5, t) * (1 - smoothstep(6.5, 8.0, t));
      if (vis <= 0) return;

      ctx.save();
      ctx.globalAlpha = vis;
      diyas.forEach(d => {
        d.x += d.speed * 0.016;
        if (d.x < -40) d.x = W + 40;
        if (d.x > W + 40) d.x = -40;

        const waveY = d.y + Math.sin(t * 1.5 + d.phase) * 2 * d.scale;
        const flamePulse = Math.sin(t * 14 + d.flamePulse) * 1.2;
        const sz = d.scale * 14;
        const flameH = sz * 1.6 + flamePulse * d.scale;

        // Flame glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fGlow = ctx.createRadialGradient(d.x, waveY - flameH * 0.3, 0, d.x, waveY - flameH * 0.3, sz * 3);
        fGlow.addColorStop(0, 'rgba(255, 180, 50, 0.25)');
        fGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fGlow;
        ctx.beginPath();
        ctx.arc(d.x, waveY - flameH * 0.3, sz * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Diya body
        const dGrad = ctx.createLinearGradient(d.x - sz, waveY, d.x + sz, waveY);
        dGrad.addColorStop(0, '#3a1505');
        dGrad.addColorStop(0.5, '#8a4520');
        dGrad.addColorStop(1, '#3a1505');
        ctx.fillStyle = dGrad;
        ctx.beginPath();
        ctx.ellipse(d.x, waveY + sz * 0.2, sz, sz * 0.3, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#120200';
        ctx.beginPath();
        ctx.ellipse(d.x, waveY + sz * 0.12, sz * 0.85, sz * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flame
        const fGrad = ctx.createLinearGradient(d.x, waveY, d.x, waveY - flameH);
        fGrad.addColorStop(0, 'rgba(255, 80, 0, 0.95)');
        fGrad.addColorStop(0.35, 'rgba(255, 190, 40, 1)');
        fGrad.addColorStop(0.75, 'rgba(255, 250, 200, 1)');
        fGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.moveTo(d.x - sz * 0.15, waveY + sz * 0.08);
        ctx.quadraticCurveTo(d.x - sz * 0.2, waveY - flameH * 0.45, d.x, waveY - flameH);
        ctx.quadraticCurveTo(d.x + sz * 0.2, waveY - flameH * 0.45, d.x + sz * 0.15, waveY + sz * 0.08);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    }

    // ===================== FIREWORKS =====================
    function launchFireworks(t: number) {
      if (t < 3.5 || t > 6.5) return;
      if (rockets.length >= 3) return;
      if (t - lastRocketLaunchTime < 0.4 + Math.random() * 0.2) return;

      const startX = Math.random() < 0.5 ? lerp(W * 0.15, W * 0.35, Math.random()) : lerp(W * 0.65, W * 0.85, Math.random());
      const targetY = lerp(H * 0.3, H * 0.08, Math.random());
      let type = 'small';
      const r = Math.random();
      if (r < 0.35) type = 'finale'; else if (r < 0.65) type = 'chrysanthemum'; else type = 'medium';
      const cPair = fwColors[Math.floor(Math.random() * fwColors.length)];

      rockets.push({
        x: startX, y: H * HORIZON,
        vx: (Math.random() - 0.5) * 1.2, vy: -8 - Math.random() * 3,
        ax: 0, ay: 0.14 + Math.random() * 0.03,
        targetY, color: cPair[0], color2: cPair[1], type,
        trail: [], flicker: 0, smokeTimer: 0, sparkTimer: 0
      });
      lastRocketLaunchTime = t;
    }

    function createBurst(fx: number, fy: number, color: string, color2: string, type: string, isSecondary = false) {
      let count = 45, maxR = 50, shake = 0, flash = 0;
      if (type === 'medium') { count = 55; maxR = 70; }
      else if (type === 'chrysanthemum') { count = 70; maxR = 90; }
      else if (type === 'finale') { count = 90; maxR = 120; shake = 3; flash = 0.25; }
      if (isSecondary) { count = 28; shake = 0; flash = 0; }

      screenFlash = Math.min(1, screenFlash + flash);
      cameraShake = Math.min(4, cameraShake + shake);
      fwBursts.push({ x: fx, y: fy, color, r: 0, maxR, alpha: 0.5 });

      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        let spd = 2 + Math.random() * 3.5;
        let gravity = 0.05, drag = 0.982, maxLife = 1.5 + Math.random();
        let pColor = color, pType = 'core', stage = 0, delay = 0;

        if (type === 'finale' && Math.random() < 0.2) {
          stage = 1; delay = 0.4 + Math.random() * 0.4; maxLife = delay + 0.5;
          pType = 'delayed'; pColor = '#fff'; spd = 1 + Math.random();
        }

        sparks.push({
          x: fx, y: fy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          color: pColor, color2, alpha: 1, life: 0, maxLife,
          size: 1.2 + Math.random() * 1.5, gravity, drag,
          flicker: Math.random() < 0.3, type: pType, temp: 1,
          wind: (Math.random() - 0.5) * 0.08, turb: Math.random() * 0.04,
          stage, delay, hasExploded: false, isSecondary
        });
      }

      if (!isSecondary && type === 'finale') {
        for (let i = 0; i < 2; i++) {
          setTimeout(() => { if (running) createBurst(fx + (Math.random() - 0.5) * 70, fy + (Math.random() - 0.5) * 30, color2, color, 'small', true); }, 450 + i * 280);
        }
      }
    }

    function updateFireworks(dt: number, t: number) {
      const clean = t >= 7.5;
      screenFlash = Math.max(0, screenFlash - dt * 1.5);
      cameraShake = Math.max(0, cameraShake - dt * 18);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        if (clean) { rockets.splice(i, 1); continue; }
        r.vy += r.ay * dt * 60; r.x += r.vx * dt * 60; r.y += r.vy * dt * 60;
        r.flicker = 0.5 + Math.random() * 0.5;
        r.trail.push({ x: r.x, y: r.y, alpha: 1 });
        if (r.trail.length > 5) r.trail.shift();
        r.trail.forEach(tt => tt.alpha -= 0.15);
        if (r.y <= r.targetY || r.vy >= 0) { createBurst(r.x, r.y, r.color, r.color2, r.type); rockets.splice(i, 1); }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        if (clean) { sparks.splice(i, 1); continue; }
        s.life += dt;
        if (s.type === 'delayed' && !s.hasExploded) {
          if (s.life > s.delay) { s.hasExploded = true; createBurst(s.x, s.y, s.color2, s.color, 'small', true); s.alpha = 0; }
        } else {
          s.vy += s.gravity * dt * 60;
          s.vx *= 1 - (1 - s.drag) * dt * 60;
          s.vy *= 1 - (1 - s.drag) * dt * 60;
          s.vx += Math.sin(s.life * 5 + s.x * 0.1) * s.turb * dt * 60;
          s.x += s.vx * dt * 60; s.y += s.vy * dt * 60;
          s.temp = Math.max(0, 1 - s.life / s.maxLife);
          s.alpha = Math.max(0, 1 - s.life / s.maxLife);
          if (s.flicker) s.alpha *= (0.5 + Math.random() * 0.5);
        }
        if (s.life > s.maxLife || s.y > H * HORIZON || s.alpha <= 0.01) sparks.splice(i, 1);
      }

      for (let i = fwBursts.length - 1; i >= 0; i--) {
        const b = fwBursts[i];
        if (clean) { fwBursts.splice(i, 1); continue; }
        b.r += (b.maxR - b.r) * 0.15; b.alpha -= 0.045;
        if (b.alpha <= 0) fwBursts.splice(i, 1);
      }
    }

    function drawFireworks() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      rockets.forEach(r => {
        r.trail.forEach(tt => {
          if (tt.alpha > 0) { ctx.globalAlpha = tt.alpha * 0.7; ctx.fillStyle = r.color; ctx.beginPath(); ctx.arc(tt.x, tt.y, 1.2, 0, Math.PI * 2); ctx.fill(); }
        });
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(r.x, r.y, 1.8 + r.flicker, 0, Math.PI * 2); ctx.fill();
      });

      fwBursts.forEach(b => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `${b.color}60`);
        g.addColorStop(0.5, `${b.color}15`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.globalAlpha = b.alpha;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      });

      ctx.globalAlpha = 1;
      sparks.forEach(s => {
        if (s.alpha <= 0) return;
        ctx.globalAlpha = s.alpha * 0.2;
        ctx.drawImage(sparkSprite, s.x - s.size * 3, s.y - s.size * 3, s.size * 6, s.size * 6);
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.temp > 0.5 ? '#ffffff' : s.color;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
      });

      ctx.restore();
    }

    // ===================== PARTICLES =====================
    function spawnDust(t: number) {
      const target = Math.floor(70 * smoothstep(0, 3, t));
      let count = 0;
      for (const p of pool.particles) if (p.active && p.type === 'dust') count++;
      let att = 0;
      while (count < target && att < 6) {
        const p = pool.spawn(); if (!p) break;
        p.type = 'dust'; p.x = Math.random() * W; p.y = Math.random() * H * HORIZON;
        p.vx = (Math.random() - 0.5) * 0.35; p.vy = -0.04 - Math.random() * 0.3;
        p.size = 0.5 + Math.random() * 1.5; p.maxLife = 5 + Math.random() * 5;
        p.life = Math.random() * p.maxLife * 0.4; p.alpha = 0;
        p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 0.4;
        count++; att++;
      }
    }

    function spawnPetals(t: number) {
      const intensity = smoothstep(2.0, 5.0, t) * (1 - smoothstep(6.5, 8.0, t));
      if (intensity <= 0 || Math.random() > intensity * 0.35) return;
      const p = pool.spawn(); if (!p) return;
      p.type = 'petal'; p.x = Math.random() * W; p.y = -15;
      p.vx = (Math.random() - 0.5) * 0.7; p.vy = 0.4 + Math.random() * 0.7;
      p.size = 4 + Math.random() * 5; p.maxLife = 16; p.life = 0; p.alpha = 0;
      p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 2;
    }

    function spawnSmoke(t: number) {
      const intensity = smoothstep(1.5, 4.0, t) * (1 - smoothstep(6.5, 8.0, t));
      if (intensity <= 0 || Math.random() > 0.06 * intensity) return;
      const p = pool.spawn(); if (!p) return;
      p.type = 'smoke';
      p.x = Math.random() < 0.5 ? W * 0.2 : W * 0.8;
      p.y = H * 0.8; p.vx = (Math.random() - 0.5) * 0.2; p.vy = -0.4 - Math.random() * 0.4;
      p.size = 5 + Math.random() * 7; p.maxLife = 4 + Math.random() * 3; p.life = 0; p.alpha = 0;
    }

    function spawnBirds(t: number) {
      if (t < 3.0 || t > 4.5 || birdsSpawned) return;
      birdsSpawned = true;
      for (let i = 0; i < 12; i++) {
        const p = pool.spawn(); if (!p) break;
        p.type = 'bird'; p.x = -50 - i * 16 + Math.random() * 12;
        p.y = H * 0.18 + Math.random() * 60 + (i % 3) * 10;
        p.vx = 2 + Math.random() * 0.5; p.vy = (Math.random() - 0.5) * 0.12;
        p.size = 6 + Math.random() * 3; p.maxLife = 22; p.life = 0; p.alpha = 0.55;
        p.flap = Math.random() * Math.PI * 2;
      }
    }

    function spawnTextParticles(t: number) {
      if (t < 8.5 || t > 10.5 || ramPoints.length === 0) return;
      const target = Math.min(ramPoints.length, 1100);
      let active = 0;
      for (const p of pool.particles) if (p.active && p.type === 'sparkle') active++;
      let att = 0;
      while (active < target && att < 14) {
        const p = pool.spawn(); if (!p) break;
        const pt = ramPoints[Math.floor(Math.random() * ramPoints.length)];
        p.type = 'sparkle';
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { p.x = Math.random() * W; p.y = -20; }
        else if (side === 1) { p.x = W + 20; p.y = Math.random() * H; }
        else if (side === 2) { p.x = Math.random() * W; p.y = H + 20; }
        else { p.x = -20; p.y = Math.random() * H; }
        p.tx = W / 2 + pt.x; p.ty = H * 0.38 + pt.y;
        p.vx = 0; p.vy = 0; p.size = 1.1 + Math.random() * 1.8;
        p.maxLife = 8; p.life = 0; p.alpha = 0; p.delay = Math.random() * 0.5;
        active++; att++;
      }
    }

    function updateParticles(dt: number, t: number) {
      for (const p of pool.particles) {
        if (!p.active) continue;
        p.life += dt;
        if (p.type === 'dust') {
          p.x += p.vx; p.y += p.vy; p.vx += (Math.random() - 0.5) * 0.025; p.vy -= 0.002;
          const lr = p.life / p.maxLife;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.75, 1, lr)) * 0.55 * smoothstep(0, 2, t);
          if (p.life > p.maxLife || p.y < -20) { p.life = 0; p.x = Math.random() * W; p.y = H * 0.55; p.alpha = 0; }
        } else if (p.type === 'petal') {
          p.x += p.vx + Math.sin(t * 0.7 + p.y * 0.01) * 0.3; p.y += p.vy; p.rot += p.rotSpd * dt;
          p.alpha = smoothstep(0, 0.1, p.life / p.maxLife) * 0.8 * (1 - smoothstep(6.5, 8.0, t));
          if (p.y > H * HORIZON || p.life > p.maxLife) pool.release(p);
        } else if (p.type === 'sparkle') {
          if (p.delay > 0) { p.delay -= dt; p.alpha = 0; continue; }
          const dx = p.tx - p.x, dy = p.ty - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.5) {
            const speed = clamp(dist * 5.5, 130, 700);
            p.vx = (dx / dist) * speed; p.vy = (dy / dist) * speed;
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.alpha = clamp(p.alpha + dt * 2.8, 0, 0.85);
          } else {
            p.x = p.tx + Math.sin(t * 3.5 + p.idx) * 0.3;
            p.y = p.ty + Math.cos(t * 3.5 + p.idx * 1.3) * 0.3;
            p.alpha = clamp(p.alpha + dt * 1.8, 0, 1);
          }
          if (t > 17.0) p.alpha *= 1 - smoothstep(17.0, 17.5, t);
          if (t > 17.5 && p.alpha < 0.01) pool.release(p);
        } else if (p.type === 'smoke') {
          p.x += p.vx + Math.sin(t * 1.2 + p.y * 0.01) * 0.2; p.y += p.vy;
          p.size += dt * 4.5;
          const lr = p.life / p.maxLife;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.15;
          if (p.life > p.maxLife || p.y < -20) pool.release(p);
        } else if (p.type === 'bird') {
          p.x += p.vx; p.y += p.vy; p.flap += dt * 8.5;
          p.alpha = 0.55 * (1 - smoothstep(6.5, 8.0, t));
          if (p.x > W + 50 || p.alpha < 0.01) pool.release(p);
        }
      }
    }

    function drawParticles() {
      ctx.save();
      for (const p of pool.particles) {
        if (!p.active || p.alpha <= 0.01) continue;
        if (p.type === 'dust') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = p.alpha;
          ctx.drawImage(dustSprite, p.x - p.size * 3.5, p.y - p.size * 3.5, p.size * 7, p.size * 7);
        } else if (p.type === 'sparkle') {
          const dist = Math.sqrt((p.tx - p.x) ** 2 + (p.ty - p.y) ** 2);
          const near = dist < 5;
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = p.alpha * (near ? 0.85 : 0.65);
          const sz = near ? p.size * 0.85 : p.size;
          ctx.drawImage(sparkSprite, p.x - sz * 2.5, p.y - sz * 2.5, sz * 5, sz * 5);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = near ? '#FFD700' : '#FFB300';
          ctx.beginPath(); ctx.arc(p.x, p.y, sz * 0.55, 0, Math.PI * 2); ctx.fill();
          if (near && Math.random() < 0.025) {
            ctx.globalAlpha = p.alpha * 0.4;
            ctx.fillStyle = '#FFF8E0';
            ctx.beginPath(); ctx.arc(p.x, p.y, sz * 1.5, 0, Math.PI * 2); ctx.fill();
          }
        } else if (p.type === 'smoke') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = p.alpha;
          const sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          sg.addColorStop(0, 'rgba(150,120,90,0.25)');
          sg.addColorStop(0.5, 'rgba(110,85,60,0.12)');
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'petal') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.save(); ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = '#dd7733';
          ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ee9955';
          ctx.beginPath(); ctx.ellipse(p.size * 0.12, 0, p.size * 0.45, p.size * 0.2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        } else if (p.type === 'bird') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = '#0d0603'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
          const wing = Math.sin(p.flap) * p.size * 0.55;
          ctx.beginPath();
          ctx.moveTo(p.x - p.size, p.y + wing);
          ctx.quadraticCurveTo(p.x - p.size * 0.2, p.y - p.size * 0.15, p.x, p.y);
          ctx.quadraticCurveTo(p.x + p.size * 0.2, p.y - p.size * 0.15, p.x + p.size, p.y + wing);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // ===================== DRAW: LENS FLARE =====================
    function drawLensFlare(t: number) {
      const vis = getSunVis(t);
      if (vis < 0.15) return;
      const sunX = W * 0.5;
      const sunY = H * HORIZON;
      const dirX = -0.25, dirY = -0.45;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const elements = [
        { dist: 0.15, size: 8, alpha: 0.02, color: '180,200,255' },
        { dist: 0.28, size: 15, alpha: 0.015, color: '255,220,180' },
        { dist: 0.42, size: 6, alpha: 0.025, color: '200,180,255' },
        { dist: 0.58, size: 20, alpha: 0.01, color: '255,200,150' },
      ];

      elements.forEach((el, i) => {
        const fx = sunX + dirX * W * el.dist;
        const fy = sunY + dirY * H * el.dist;
        const sz = el.size * vis;
        const a = el.alpha * vis * (0.7 + 0.3 * Math.sin(t * 0.8 + i * 1.2));
        if (a <= 0) return;
        const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, sz);
        grad.addColorStop(0, `rgba(${el.color}, ${a})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(fx, fy, sz, 0, Math.PI * 2); ctx.fill();
      });

      ctx.restore();
    }

    // ===================== DRAW: VIGNETTE =====================
    function drawVignette() {
      const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.72);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // ===================== MAIN RENDER LOOP =====================
    function render(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const t = (timestamp - startTime) / 1000;
      const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
      lastTime = timestamp;

      // Camera shake
      ctx.save();
      if (cameraShake > 0.1) {
        ctx.translate((Math.random() - 0.5) * cameraShake * 2, (Math.random() - 0.5) * cameraShake * 2);
      }

      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // ====== BACK LAYER: Sky → Sun → Heat Shimmer → Rays ======
      drawSky(t);
      drawSun(t);
      drawHeatShimmer(t);
      drawVolumetricRays(t);

      // ====== MID LAYER: Temple Silhouette → Light Leak ======
      drawTempleSilhouette(t);
      drawLightLeak(t);

      // ====== FRONT LAYER: Fog → Water → Diyas ======
      drawFogAndHaze(t);
      drawWater(t);
      drawDiyas(t);

      // ====== FIREWORKS ======
      launchFireworks(t);
      updateFireworks(dt, t);
      drawFireworks();

      // ====== PARTICLES ======
      spawnDust(t);
      spawnPetals(t);
      spawnSmoke(t);
      spawnBirds(t);
      spawnTextParticles(t);
      updateParticles(dt, t);
      drawParticles();

      // ====== POST EFFECTS ======
      drawLensFlare(t);
      drawVignette();

      // Screen flash
      if (screenFlash > 0.01 && t < 7.0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 240, 200, ${screenFlash * 0.35})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // Film grain
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.drawImage(grain, 0, 0, W, H);
      ctx.restore();

      // Text background glow (when text scene is active)
      const textBg = smoothstep(8.0, 9.0, t) * (1 - smoothstep(17.0, 17.5, t));
      if (textBg > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const tg = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, W * 0.3);
        tg.addColorStop(0, `rgba(255, 180, 60, ${0.06 * textBg})`);
        tg.addColorStop(0.5, `rgba(200, 100, 30, ${0.02 * textBg})`);
        tg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = tg;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      ctx.restore(); // camera shake restore

      // Handover
      if (t > 17.0 && !handoverTriggered) {
        handoverTriggered = true;
        setTimeout(() => { if (running && onCompleteRef.current) onCompleteRef.current(); }, 1500);
      }

      if (running) rafId = requestAnimationFrame(render);
    }

    // ====== INIT ======
    resize();
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(render);

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
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 9999,
        background: '#000',
      }}
    />
  );
}
