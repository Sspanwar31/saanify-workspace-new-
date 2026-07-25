'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════ */
interface Props {
  onComplete?: () => void;
  imageUrl?: string;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; ml: number; sz: number;
  r: number; g: number; b: number; a: number;
  tp: number;
  rot: number; rs: number; on: boolean;
  turbOff: number;
}

interface Kite {
  x: number; y: number; base_x: number; base_y: number;
  target_y: number; scale: number;
  vx: number; vy: number;
  angle: number; swaySpeed: number; swayAmp: number;
  colors: string[];
}

interface BoidBird {
  x: number; y: number; vx: number; vy: number; wing: number;
  state: 'sitting' | 'flying';
  side: 'left' | 'right';
  noiseSeed: number;
  bank: number;
}

interface Firework {
  x: number; y: number; vy: number;
  state: 'rising' | 'burst';
  burstT: number;
  col: { r: number; g: number; b: number };
  pts: { x: number; y: number; vx: number; vy: number; life: number; ml: number; sz: number }[];
}

const POOL_SIZE = 5000;
const DUR = 18.0;

/* ═══════════════════════════════════════════════════════════════
   SIMPLEX NOISE 2D
   ═══════════════════════════════════════════════════════════════ */
class SimplexNoise {
  private perm: Uint8Array;
  private g2: number[][] = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  constructor(seed: number = 42) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  n2(x: number, y: number): number {
    const F = 0.5 * (Math.sqrt(3) - 1), G = (3 - Math.sqrt(3)) / 6;
    const s = (x + y) * F, i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G, x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G, y1 = y0 - j1 + G, x2 = x0 - 1 + 2 * G, y2 = y0 - 1 + 2 * G;
    const ii = i & 255, jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0, t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; const gi = this.perm[ii + this.perm[jj]] % 8; n0 = t0 * t0 * (this.g2[gi][0] * x0 + this.g2[gi][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; const gi = this.perm[ii + i1 + this.perm[jj + j1]] % 8; n1 = t1 * t1 * (this.g2[gi][0] * x1 + this.g2[gi][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; const gi = this.perm[ii + 1 + this.perm[jj + 1]] % 8; n2 = t2 * t2 * (this.g2[gi][0] * x2 + this.g2[gi][1] * y2); }
    return 70 * (n0 + n1 + n2);
  }
}

export default function IndependenceDayCinematicIntro({ onComplete }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const raf = useRef<number>(0);
  const t0 = useRef<number>(0);
  const done = useRef<boolean>(false);
  const cbR = useRef(onComplete);
  cbR.current = onComplete;

  const mkPool = useCallback(() => {
    const a: Particle[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      a.push({
        x:0,y:0,vx:0,vy:0,life:0,ml:1,sz:0,r:255,g:153,b:51,a:0,
        tp:1,rot:0,rs:0,on:false,turbOff:Math.random()*1000
      });
    }
    return a;
  }, []);

  const grab = useCallback((p: Particle[]) => {
    for (let i = 0; i < p.length; i++) if (!p[i].on) return p[i];
    return null;
  }, []);

  const triggerMilitaryAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      for (let beat = 0; beat < 12; beat++) {
        const bt = ctx.currentTime + beat * 0.35;
        const kick = ctx.createOscillator();
        const kg = ctx.createGain();
        kick.frequency.setValueAtTime(120, bt);
        kick.frequency.exponentialRampToValueAtTime(18, bt + 0.18);
        kg.gain.setValueAtTime(0.3, bt);
        kg.gain.exponentialRampToValueAtTime(0.001, bt + 0.20);
        kick.connect(kg); kg.connect(ctx.destination);
        kick.start(bt); kick.stop(bt + 0.20);
      }
    } catch (e) { /* silent */ }
  }, []);

  /* ═══════════════════════════════════════════════════════════
     CANVAS LIFE CYCLE
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
    const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const eOB = (t: number) => {
      const n = 7.5625, d = 2.75;
      if (t < 1/d) return n*t*t;
      if (t < 2/d) return n*(t-=1.5/d)*t+0.75;
      if (t < 2.5/d) return n*(t-=2.25/d)*t+0.9375;
      return n*(t-=2.625/d)*t+0.984375;
    };

    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    triggerMilitaryAudio();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    const noise = new SimplexNoise(4822);
    const pl = mkPool();

    const numPoints = 14;
    const flagNodes: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      flagNodes.push({ x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0 });
    }

    const starI: number[] = [];
    for (let i = 0; i < 150; i++) starI.push(i);

    const birds: BoidBird[] = [];
    const kites: Kite[] = [];

    let sc = 0, gateH = 0, gateW = 0, baseY = 0, cx = 0;

    const rsz = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      sc = Math.min(W, H);
      gateH = sc * 0.44; 
      gateW = gateH * 1.5; 
      baseY = H * 0.86;
      cx = W * 0.5;

      if (flagNodes.length > 0) flagNodes[0].x = 0;

      for (let i = 0; i < starI.length; i++) {
        const idx = starI[i]; const p = pl[idx];
        p.on = true; p.tp = 0;
        p.x = Math.random() * W;
        p.y = Math.random() * H * 0.75;
        p.sz = Math.random() * 1.2 + 0.2;
        p.ml = 999; p.life = 999;
        p.r = 255; p.g = 250; p.b = 200;
        p.a = Math.random() * 0.3 + 0.05;
      }

      kites.length = 0;
      kites.push(
        { x: W * 0.15, y: H * 0.45, base_x: W * 0.15, base_y: H * 0.45, target_y: H * 0.15, scale: 0.9, vx: 0.8, vy: -0.4, angle: 0.1, swaySpeed: 1.2, swayAmp: 25, colors: ['#ff9933', '#ffffff', '#128807'] },
        { x: W * 0.28, y: H * 0.55, base_x: W * 0.28, base_y: H * 0.55, target_y: H * 0.22, scale: 0.75, vx: 1.0, vy: -0.5, angle: -0.15, swaySpeed: 1.6, swayAmp: 18, colors: ['#ff9933', '#ffffff', '#128807'] },
        { x: W * 0.72, y: H * 0.48, base_x: W * 0.72, base_y: H * 0.48, target_y: H * 0.18, scale: 0.82, vx: -0.7, vy: -0.4, angle: 0.05, swaySpeed: 1.1, swayAmp: 22, colors: ['#ff9933', '#ffffff', '#128807'] },
        { x: W * 0.85, y: H * 0.58, base_x: W * 0.85, base_y: H * 0.58, target_y: H * 0.26, scale: 0.7, vx: -0.9, vy: -0.55, angle: -0.08, swaySpeed: 1.5, swayAmp: 15, colors: ['#ff9933', '#ffffff', '#128807'] }
      );

      birds.length = 0;
      const leftTowerX = cx - gateW * 0.34;
      const rightTowerX = cx + gateW * 0.34;
      const towerY = baseY - gateH * 0.90;

      for (let i = 0; i < 6; i++) {
        birds.push({
          x: leftTowerX - 15 + i * 6,
          y: towerY - 8, vx: 0, vy: 0,
          wing: Math.random() * Math.PI * 2,
          state: 'sitting', side: 'left',
          noiseSeed: Math.random() * 1000, bank: 0
        });
        birds.push({
          x: rightTowerX - 15 + i * 6,
          y: towerY - 8, vx: 0, vy: 0,
          wing: Math.random() * Math.PI * 2,
          state: 'sitting', side: 'right',
          noiseSeed: Math.random() * 1000, bank: 0
        });
      }
    };
    rsz(); window.addEventListener('resize', rsz);

    const grainCv = document.createElement('canvas');
    grainCv.width = 256; grainCv.height = 256;
    const gc = grainCv.getContext('2d')!;
    const gd = gc.createImageData(256, 256);
    for (let i = 0; i < gd.data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      gd.data[i] = v; gd.data[i + 1] = v; gd.data[i + 2] = v; gd.data[i + 3] = 255;
    }
    gc.putImageData(gd, 0, 0);

    let cameraShake = 0;

    const fireworksList: Firework[] = [];
    const fwColors = [{r:255,g:153,b:51}, {r:255,g:255,b:255}, {r:19,g:136,b:8}, {r:255,g:215,b:0}];

    const spawnFirework = () => {
      const col = fwColors[Math.floor(Math.random() * fwColors.length)];
      fireworksList.push({
        x: W * 0.15 + Math.random() * W * 0.7, y: H,
        vy: -5.0 - Math.random() * 3.5, state: 'rising', burstT: 0, col: col, pts: []
      });
    };

    const updateFireworks = (dt: number) => {
      for (let i = fireworksList.length - 1; i >= 0; i--) {
        const fw = fireworksList[i];
        if (fw.state === 'rising') {
          fw.y += fw.vy; fw.vy += 0.04;
          if (fw.vy >= -0.5 || fw.y < H * 0.2) {
            fw.state = 'burst';
            const count = 40 + Math.random() * 30 | 0;
            for (let j = 0; j < count; j++) {
              const ang = (j / count) * Math.PI * 2;
              const spd = 1.2 + Math.random() * 2.5;
              fw.pts.push({
                x: fw.x, y: fw.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 1.5 + Math.random() * 1.5, ml: 3.0, sz: 1.5 + Math.random() * 2.0
              });
            }
          }
        } else {
          fw.burstT += dt;
          for (let j = fw.pts.length - 1; j >= 0; j--) {
            const pt = fw.pts[j];
            pt.x += pt.vx; pt.y += pt.vy;
            pt.vy += 0.035; pt.vx *= 0.985; pt.vy *= 0.985;
            pt.life -= dt;
            if (pt.life <= 0) fw.pts.splice(j, 1);
          }
          if (fw.pts.length === 0) fireworksList.splice(i, 1);
        }
      }
    };

    const renderer = {
      sky: (t: number, sceneAlpha: number) => {
        c.save(); c.globalAlpha = sceneAlpha;
        const grad = c.createLinearGradient(0, 0, 0, H);
        if (t < 4.0) {
          const ip = clamp(t / 4.0, 0, 1);
          grad.addColorStop(0, `rgb(${lerp(15,24,ip)|0},${lerp(35,65,ip)|0},${lerp(75,130,ip)|0})`);
          grad.addColorStop(0.65, `rgb(${lerp(45,180,ip)|0},${lerp(75,120,ip)|0},${lerp(120,60,ip)|0})`);
          grad.addColorStop(1, `rgb(${lerp(120,250,ip)|0},${lerp(110,180,ip)|0},${lerp(80,100,ip)|0})`);
        } else if (t < 10.0) {
          const ip = clamp((t - 4.0) / 6.0, 0, 1);
          grad.addColorStop(0, `rgb(${lerp(24,80,ip)|0},${lerp(65,145,ip)|0},${lerp(130,220,ip)|0})`);
          grad.addColorStop(0.5, `rgb(${lerp(180,240,ip)|0},${lerp(120,180,ip)|0},${lerp(60,110,ip)|0})`);
          grad.addColorStop(1, `rgb(${lerp(250,255,ip)|0},${lerp(180,210,ip)|0},${lerp(100,140,ip)|0})`);
        } else {
          const ip = clamp((t - 10.0) / 4.5, 0, 1);
          grad.addColorStop(0, `rgb(${lerp(80,10,ip)|0},${lerp(145,20,ip)|0},${lerp(220,65,ip)|0})`);
          grad.addColorStop(1, `rgb(${lerp(255,25,ip)|0},${lerp(210,42,ip)|0},${lerp(140,110,ip)|0})`);
        }
        c.fillStyle = grad; c.fillRect(0, 0, W, H);
        c.restore();
      },

      stars: (t: number, sceneAlpha: number) => {
        if (t > 4) return;
        const alpha = clamp(1 - t / 4, 0, 1) * sceneAlpha;
        c.save(); c.globalAlpha = alpha;
        for (let i = 0; i < starI.length; i++) {
          const idx = starI[i]; const p = pl[idx];
          if (p && p.on) {
            const twinkle = Math.sin(t * 3.5 + i) * 0.4 + 0.6;
            c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * twinkle})`;
            c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
          }
        }
        c.restore();
      },

      redFort: (t: number, sceneAlpha: number) => {
        const reveal = clamp((t - 0.8) * 0.4, 0, 1);
        c.save(); c.globalAlpha = reveal * sceneAlpha;

        const sandRed = '#a23c26';
        const shadowRed = '#6e2012';
        const lightSand = '#c4543d';
        const domeWhite = '#f6f6f6';

        const drawBlock = (x: number, y: number, w: number, h: number) => {
          c.fillStyle = 'rgba(0,0,0,0.3)';
          c.fillRect(x - 2, y - 2, w + 4, h + 4);
          const blockGrad = c.createLinearGradient(x, y, x, y + h);
          blockGrad.addColorStop(0, lightSand);
          blockGrad.addColorStop(0.3, sandRed);
          blockGrad.addColorStop(1, shadowRed);
          c.fillStyle = blockGrad;
          c.fillRect(x, y, w, h);
        };

        drawBlock(cx - gateW * 0.48, baseY - gateH * 0.45, gateW * 0.96, gateH * 0.45);

        c.fillStyle = shadowRed;
        const crenW = 8;
        for (let xOff = -gateW * 0.47; xOff < gateW * 0.47; xOff += 15) {
          c.fillRect(cx + xOff, baseY - gateH * 0.49, crenW, 6);
        }

        const twW = gateW * 0.12, twH = gateH * 0.80;
        const leftTx = cx - gateW * 0.38;
        drawBlock(leftTx, baseY - twH, twW, twH);

        const rightTx = cx + gateW * 0.38 - twW;
        drawBlock(rightTx, baseY - twH, twW, twH);

        const alcW = gateW * 0.22, alcH = gateH * 0.35;
        c.save();
        c.beginPath();
        c.moveTo(cx - alcW/2, baseY);
        c.lineTo(cx - alcW/2, baseY - alcH * 0.7);
        c.quadraticCurveTo(cx, baseY - alcH * 1.1, cx + alcW/2, baseY - alcH * 0.7);
        c.lineTo(cx + alcW/2, baseY);
        c.closePath(); c.clip();
        c.fillStyle = '#220803';
        c.fillRect(cx - alcW/2, baseY - alcH, alcW, alcH + 10);
        c.restore();

        const drawDomeChhatri = (tx: number, ty: number, w: number) => {
          c.strokeStyle = domeWhite; c.lineWidth = 2;
          for (let pIdx = 0; pIdx < 4; pIdx++) {
            const px = tx + 3 + (w - 6) * (pIdx / 3);
            c.beginPath(); c.moveTo(px, ty); c.lineTo(px, ty - 12); c.stroke();
          }
          c.fillStyle = sandRed; c.fillRect(tx, ty - 14, w, 3);
          c.beginPath();
          c.arc(tx + w / 2, ty - 14, w * 0.42, Math.PI, 0, false);
          c.closePath();
          c.fillStyle = domeWhite; c.fill();
          c.strokeStyle = shadowRed; c.lineWidth = 0.8; c.stroke();
          c.fillStyle = '#e0a924';
          c.fillRect(tx + w / 2 - 1, ty - 14 - w * 0.42 - 5, 2, 6);
        };

        drawDomeChhatri(leftTx + 2, baseY - twH, twW - 4);
        drawDomeChhatri(rightTx + 2, baseY - twH, twW - 4);

        for (let i = -1; i <= 1; i += 2) {
          drawDomeChhatri(cx + i * 40 - 10, baseY - gateH * 0.45, 20);
        }

        c.restore();
      },

      torch: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 2.0) return;
        const tx = W * 0.5, ty = H * 0.795;
        const fireAlpha = clamp((t - 2.0) * 1.5, 0, 1) * sceneAlpha;
        c.save(); c.globalAlpha = fireAlpha; c.globalCompositeOperation = 'lighter';
        const glowGrad = c.createRadialGradient(tx, ty, 0, tx, ty, 100);
        glowGrad.addColorStop(0, 'rgba(255,140,20,0.8)');
        glowGrad.addColorStop(0.5, 'rgba(255,60,5,0.25)');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = glowGrad; c.fillRect(tx - 100, ty - 100, 200, 280);
        const flicker = Math.sin(elapsed * 28) * 3;
        const flameH = 35 + flicker, flameW = 9;
        const fireGrad = c.createLinearGradient(tx, ty, tx, ty - flameH);
        fireGrad.addColorStop(0, '#ffffff');
        fireGrad.addColorStop(0.2, 'rgba(255,210,80,0.95)');
        fireGrad.addColorStop(0.6, 'rgba(255,120,20,0.6)');
        fireGrad.addColorStop(1, 'rgba(255,50,0,0)');
        c.fillStyle = fireGrad;
        c.beginPath();
        c.moveTo(tx - flameW, ty);
        c.quadraticCurveTo(tx - flameW * 0.4, ty - flameH * 0.5, tx, ty - flameH);
        c.quadraticCurveTo(tx + flameW * 0.4, ty - flameH * 0.5, tx + flameW, ty);
        c.closePath(); c.fill();
        c.restore();
      },

      wavingFlagAndChakra: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 3.0) return;
        const revealAlpha = clamp((t - 3.0) * 1.2, 0, 1) * sceneAlpha;
        const fw_static = sc * 0.22, fh = fw_static * 0.66;
        
        const poleTopX = cx;
        const poleBaseY = baseY - gateH * 0.49;
        const poleHeight = gateH * 0.85;
        const poleTopY = poleBaseY - poleHeight;

        const hoistProgress = clamp((t - 3.0) / 3.2, 0, 1);
        const currentFlagY = lerp(poleBaseY - fh, poleTopY, eOC(hoistProgress));

        const unfurlProgress = clamp((t - 5.8) * 2.0, 0, 1);
        const fw = lerp(fw_static * 0.15, fw_static, eOC(unfurlProgress)); 

        if (flagNodes[0].x === 0) {
          for (let i = 0; i < numPoints; i++) {
            flagNodes[i].x = poleTopX + (i * fw) / (numPoints - 1);
            flagNodes[i].y = currentFlagY;
            flagNodes[i].ox = flagNodes[i].x; flagNodes[i].oy = flagNodes[i].y;
          }
        }

        for (let i = 1; i < numPoints; i++) {
          const wind = 0.15 + noise.n2(elapsed * 0.6 + i * 0.12, 0) * 0.14;
          const gravity = 0.022;
          flagNodes[i].vx = (flagNodes[i].x - flagNodes[i].ox) * 0.94 + wind;
          flagNodes[i].vy = (flagNodes[i].y - flagNodes[i].oy) * 0.94 + gravity;
          flagNodes[i].ox = flagNodes[i].x; flagNodes[i].oy = flagNodes[i].y;
          flagNodes[i].x += flagNodes[i].vx; flagNodes[i].y += flagNodes[i].vy;
        }
        flagNodes[0].x = poleTopX; flagNodes[0].y = currentFlagY;

        const linkLength = fw / (numPoints - 1);
        for (let steps = 0; steps < 5; steps++) {
          for (let i = 0; i < numPoints - 1; i++) {
            const n1 = flagNodes[i], n2 = flagNodes[i + 1];
            const dx = n2.x - n1.x, dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const diff = linkLength - dist;
            const percent = (diff / dist) * 0.5;
            const offsetX = dx * percent, offsetY = dy * percent;
            if (i > 0) { n1.x -= offsetX; n1.y -= offsetY; }
            n2.x += offsetX; n2.y += offsetY;
          }
        }

        c.save(); c.globalAlpha = revealAlpha;
        
        const poleGrad = c.createLinearGradient(cx - 2.5, poleTopY, cx + 2.5, poleBaseY);
        poleGrad.addColorStop(0, '#f0f0f0'); poleGrad.addColorStop(0.5, '#ffffff'); poleGrad.addColorStop(1, '#a8a8a8');
        c.fillStyle = poleGrad; c.fillRect(cx - 2.5, poleTopY, 5, poleHeight);
        c.fillStyle = '#ffd700'; c.beginPath(); c.arc(cx, poleTopY, 4, 0, Math.PI * 2); c.fill();

        for (let i = 0; i < numPoints - 1; i++) {
          const n1 = flagNodes[i], n2 = flagNodes[i + 1];
          const shade = 0.85 + Math.sin(i * 0.3 - elapsed * 4) * 0.15;
          const applyShade = (hex: string) => {
            const h = hex.replace('#', '');
            const rr = parseInt(h.substring(0,2),16), gg = parseInt(h.substring(2,4),16), bb = parseInt(h.substring(4,6),16);
            return `rgb(${rr*shade|0},${gg*shade|0},${bb*shade|0})`;
          };
          c.fillStyle = applyShade('#FF9933');
          c.beginPath(); c.moveTo(n1.x, n1.y); c.lineTo(n2.x, n2.y);
          c.lineTo(n2.x, n2.y + fh / 3); c.lineTo(n1.x, n1.y + fh / 3); c.closePath(); c.fill();
          c.fillStyle = applyShade('#FFFFFF');
          c.beginPath(); c.moveTo(n1.x, n1.y + fh / 3); c.lineTo(n2.x, n2.y + fh / 3);
          c.lineTo(n2.x, n2.y + (fh * 2) / 3); c.lineTo(n1.x, n1.y + (fh * 2) / 3); c.closePath(); c.fill();
          c.fillStyle = applyShade('#138808');
          c.beginPath(); c.moveTo(n1.x, n1.y + (fh * 2) / 3); c.lineTo(n2.x, n2.y + (fh * 2) / 3);
          c.lineTo(n2.x, n2.y + fh); c.lineTo(n1.x, n1.y + fh); c.closePath(); c.fill();
        }

        if (unfurlProgress > 0.15) {
          const midIdx = numPoints / 2 | 0;
          const cxV = flagNodes[midIdx].x, cyV = flagNodes[midIdx].y + fh / 2, cr = fh * 0.11 * unfurlProgress;
          c.save(); c.translate(cxV, cyV); c.rotate(elapsed * 0.7);
          c.strokeStyle = 'rgba(0,0,128,0.85)'; c.lineWidth = 1.8;
          c.beginPath(); c.arc(0, 0, cr, 0, Math.PI * 2); c.stroke();
          c.lineWidth = 0.8;
          for (let i = 0; i < 24; i++) {
            const ang = (i / 24) * Math.PI * 2;
            c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang) * cr, Math.sin(ang) * cr); c.stroke();
          }
          c.restore();
        }
        c.restore();
      },

      volumetricLighting: (t: number, sceneAlpha: number) => {
        if (t < 3.0) return;
        const intensity = clamp((t - 3.0) * 0.22, 0, 0.65) * sceneAlpha;
        const sunX = W * 0.5, sunY = baseY - gateH * 0.5;
        c.save(); c.globalAlpha = intensity; c.globalCompositeOperation = 'screen';
        for (let i = 0; i < 15; i++) {
          const angle = -Math.PI * 0.5 + (i / 15) * Math.PI - Math.PI * 0.5;
          const l = sc * 1.5;
          c.beginPath(); c.moveTo(sunX, sunY);
          c.lineTo(sunX + Math.cos(angle - 0.05) * l, sunY + Math.sin(angle - 0.05) * l);
          c.lineTo(sunX + Math.cos(angle + 0.05) * l, sunY + Math.sin(angle + 0.05) * l);
          c.closePath();
          const rayGrad = c.createLinearGradient(sunX, sunY, sunX + Math.cos(angle) * l, sunY + Math.sin(angle) * l);
          rayGrad.addColorStop(0, 'rgba(255,220,130,0.22)');
          rayGrad.addColorStop(0.5, 'rgba(255,120,40,0.06)');
          rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = rayGrad; c.fill();
        }
        c.restore();
      },

      drawKites: (t: number, sceneAlpha: number) => {
        if (t < 1.5) return;
        const kAlpha = clamp((t - 1.5) * 1.2, 0, 1) * sceneAlpha;
        c.save(); c.globalAlpha = kAlpha;

        kites.forEach((kite, index) => {
          const sway = Math.sin(t * kite.swaySpeed + index) * kite.swayAmp;
          kite.x = kite.base_x + sway;
          kite.y = lerp(kite.base_y, kite.target_y, clamp((t - 1.5) * 0.08, 0, 1));

          c.save();
          c.translate(kite.x, kite.y);
          c.rotate(kite.angle + Math.sin(t * 1.5 + index) * 0.08);

          const s = 18 * kite.scale;

          const tricolorGrad = c.createLinearGradient(-s, 0, s, 0);
          tricolorGrad.addColorStop(0, '#ff9933');
          tricolorGrad.addColorStop(0.48, '#ffffff');
          tricolorGrad.addColorStop(0.52, '#ffffff');
          tricolorGrad.addColorStop(1, '#128807');
          c.fillStyle = tricolorGrad;

          c.beginPath();
          c.moveTo(0, -s * 1.4);
          c.lineTo(s * 1.1, 0);
          c.lineTo(0, s * 1.2);
          c.lineTo(-s * 1.1, 0);
          c.closePath();
          c.fill();

          c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 0.8;
          c.beginPath();
          c.moveTo(0, -s * 1.4); c.lineTo(0, s * 1.2);
          c.moveTo(-s * 1.1, 0); c.quadraticCurveTo(0, -s * 0.2, s * 1.1, 0);
          c.stroke();

          c.fillStyle = '#ff9933';
          c.beginPath();
          c.moveTo(0, s * 1.2);
          c.lineTo(-s * 0.25, s * 1.5);
          c.lineTo(s * 0.25, s * 1.5);
          c.closePath();
          c.fill();

          c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 0.6;
          c.beginPath();
          c.moveTo(0, s * 1.2);
          c.bezierCurveTo(-s * 1.5, s * 4, s * 2, s * 10, -s * 10, H);
          c.stroke();

          c.restore();
        });

        c.restore();
      },

      doves: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 2.0) return;
        const dAlpha = clamp((t - 2.0) * 1.2, 0, 1) * sceneAlpha;
        c.save(); c.globalAlpha = dAlpha;
        if (t >= 3.6) { 
          birds.forEach(b => {
            if (b.state === 'sitting') {
              b.state = 'flying';
              const driftX = b.side === 'left' ? -0.8 : 0.8;
              b.vx = driftX + (Math.random() - 0.5) * 0.5;
              b.vy = -1.5 - Math.random() * 0.8;
            }
          });
        }
        birds.forEach(b => {
          if (b.state === 'flying') {
            const noiseForceX = noise.n2(elapsed * 0.6, b.noiseSeed) * 0.5;
            const noiseForceY = noise.n2(elapsed * 0.4, b.noiseSeed + 100) * 0.3;
            b.vx = clamp(b.vx * 0.98 + noiseForceX, -3, 3);
            b.vy = clamp(b.vy * 0.98 + noiseForceY, -3, -0.8);
            b.x += b.vx; b.y += b.vy;
            const dutyCycle = Math.sin(elapsed * 4.2 + b.noiseSeed);
            b.wing += dutyCycle > 0 ? 0.3 : 0.15;
            b.bank = b.vx * 0.08;
          }
          c.save(); c.translate(b.x, b.y);
          c.rotate(b.state === 'flying' ? Math.atan2(b.vy, b.vx) + b.bank : 0);
          const scale = 0.52; c.scale(scale, scale);
          if (b.state === 'flying') {
            const wingFactor = Math.sin(b.wing);
            c.fillStyle = '#ffffff';
            c.beginPath(); c.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(13, -2, 4, 0, Math.PI * 2); c.fill();
            [-1, 1].forEach(side => {
              c.save(); c.scale(1, side); c.rotate(wingFactor * 0.5 - 0.15);
              c.fillStyle = '#f2f2f2';
              c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -15); c.lineTo(-13, -13); c.closePath(); c.fill();
              c.restore();
            });
          } else {
            const headBob = Math.sin(elapsed * 4.5 + b.noiseSeed) * 1.0;
            c.fillStyle = '#f0f0f0';
            c.beginPath(); c.ellipse(0, 2, 13, 6.5, 0.1, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(10, -2 + headBob, 4, 0, Math.PI * 2); c.fill();
          }
          c.restore();
        });
        c.restore();
      },

      typography: (t: number) => {
        if (t < 11.5) return;
        const titleY = lerp(H * 0.58, H * 0.44, eOE((t - 11.5) * 0.5));
        c.save();
        const fontSize = Math.min(W * 0.065, 52);
        c.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;
        const title = "HAPPY INDEPENDENCE DAY";
        const totalW = c.measureText(title).width;
        let xOff = W * 0.5 - totalW * 0.5;
        for (let i = 0; i < title.length; i++) {
          const charW = c.measureText(title[i]).width;
          const charT = clamp((t - 11.5 - i * 0.035) / 0.4, 0, 1);
          const charY = titleY + (1 - eOB(charT)) * -15;
          c.save(); c.globalAlpha = eOC(charT);
          c.fillStyle = 'rgba(0,0,0,0.92)'; c.fillText(title[i], xOff + 2, charY + 2);
          const sweepGrad = c.createLinearGradient(xOff, charY - fontSize * 0.5, xOff, charY + fontSize * 0.38);
          sweepGrad.addColorStop(0, '#FF9933'); sweepGrad.addColorStop(0.48, '#FFFFFF');
          sweepGrad.addColorStop(0.52, '#FFFFFF'); sweepGrad.addColorStop(1, '#138808');
          c.fillStyle = sweepGrad; c.fillText(title[i], xOff, charY);
          c.restore(); xOff += charW;
        }
        if (t > 13.0) {
          const subAlpha = clamp((t - 13.0) * 2, 0, 1);
          c.save(); c.globalAlpha = subAlpha;
          c.fillStyle = '#ffd700'; c.textAlign = 'center';
          c.font = `500 ${fontSize * 0.65}px 'Georgia', serif`;
          c.fillText("जय हिन्द", W * 0.5, titleY + fontSize * 1.1);
          c.restore();
        }
        c.restore();
      },

      fireworks: (sceneAlpha: number) => {
        c.save(); c.globalCompositeOperation = 'lighter';
        fireworksList.forEach(fw => {
          if (fw.state === 'rising') {
            c.fillStyle = 'rgba(255,230,150,0.95)';
            c.beginPath(); c.arc(fw.x, fw.y, 2.5, 0, Math.PI * 2); c.fill();
          } else {
            fw.pts.forEach(pt => {
              const alpha = clamp(pt.life / pt.ml, 0, 1) * sceneAlpha;
              const fGrad = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.sz * 2);
              fGrad.addColorStop(0, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},${alpha})`);
              fGrad.addColorStop(1, 'rgba(0,0,0,0)');
              c.fillStyle = fGrad;
              c.beginPath(); c.arc(pt.x, pt.y, pt.sz * 2, 0, Math.PI * 2); c.fill();
            });
          }
        });
        c.restore();
      }
    };

    const spawnParticles = (t: number, elapsed: number) => {
      if (Math.random() < 0.12) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = H * 0.6 + Math.random() * H * 0.3;
          p.vx = (Math.random() - 0.5) * 0.2; p.vy = -0.05 - Math.random() * 0.05;
          p.life = 8; p.ml = 8; p.sz = 35 + Math.random() * 40;
          p.r = 230; p.g = 235; p.b = 245; p.a = 0.05; p.tp = 1;
        }
      }
      if (t > 4.0 && Math.random() < 0.4) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = H + 10;
          p.vx = (Math.random() - 0.5) * 0.5; p.vy = -0.4 - Math.random() * 0.7;
          p.life = 6; p.ml = 6; p.sz = 2.0 + Math.random() * 3.5;
          p.r = 255; p.g = 215; p.b = 0; p.a = 0.9; p.tp = 5;
        }
      }
      if (t >= 5.0 && t < 11.5) {
        for (let i = 0; i < 2; i++) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = Math.random() * W; p.y = -20 - Math.random() * 30;
            p.vx = -1.2 + Math.random() * 2.4; p.vy = 1.2 + Math.random() * 1.5;
            p.life = 6; p.ml = 6; p.sz = 6 + Math.random() * 4;
            p.rot = Math.random() * Math.PI * 2; p.rs = (Math.random() - 0.5) * 0.06;
            
            const rand = Math.random();
            if (rand < 0.45) { p.r = 255; p.g = 107; p.b = 53; } 
            else if (rand < 0.85) { p.r = 251; p.g = 191; p.b = 36; } 
            else { p.r = 255; p.g = 255; p.b = 255; } 
            
            p.a = 0.85; p.tp = 2; 
          }
        }
      }
      if (t > 2.0 && Math.random() < 0.25) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = W * 0.5 + (Math.random() - 0.5) * 15; p.y = H * 0.795;
          p.vx = (Math.random() - 0.5) * 0.6; p.vy = -1.2 - Math.random() * 1.8;
          p.life = 2.5; p.ml = 2.5; p.sz = 1.0 + Math.random() * 2.0;
          p.r = 255; p.g = 120 + Math.random() * 80; p.b = 30; p.a = 0.95; p.tp = 3;
        }
      }
    };

    const updateParticles = (dt: number, elapsed: number) => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue;
        p.life -= dt;
        if (p.tp === 4) {
          p.x += p.vx; p.y += p.vy; p.sz += 0.45; p.vx *= 0.985; p.vy *= 0.985;
        } else if (p.tp === 2) {
          p.vy += 0.015; p.vy *= 0.985;
          p.vx = p.vx * 0.94 + Math.sin(elapsed * 0.8 + p.y * 0.012) * 0.035;
          p.x += p.vx; p.y += p.vy; p.rot += p.rs;
        } else if (p.tp === 5) {
          p.vy *= 0.99;
          p.vx = p.vx * 0.95 + noise.n2(elapsed * 0.5 + p.y * 0.01, p.turbOff) * 0.15;
          p.x += p.vx; p.y += p.vy;
        } else {
          p.x += p.vx; p.y += p.vy;
        }
        if (p.life <= 0 || p.x < -120 || p.x > W + 120 || p.y > H + 120) p.on = false;
      }
    };

    const drawParticles = () => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue;
        const alpha = clamp(p.life / p.ml, 0, 1) * p.a;
        c.save(); c.globalAlpha = alpha;
        if (p.tp === 2) {
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.beginPath();
          c.ellipse(0, 0, p.sz * 0.7, p.sz, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = 'rgba(255,255,255,0.2)';
          c.beginPath(); c.arc(0, 0, p.sz * 0.35, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 5) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(255,215,0,${alpha})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        } else {
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }
    };

    const drawChromaticAberration = () => {
      c.save(); c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.015; c.drawImage(cv, -1.5, 0, W, H);
      c.globalAlpha = 0.012; c.drawImage(cv, 1.5, 0, W, H);
      c.restore();
    };

    const drawPostFX = () => {
      c.save(); c.globalCompositeOperation = 'soft-light';
      const grade = c.createLinearGradient(0, 0, W, H);
      grade.addColorStop(0, 'rgba(255,140,50,0.18)');
      grade.addColorStop(1, 'rgba(0,50,100,0.25)');
      c.fillStyle = grade; c.fillRect(0, 0, W, H);
      c.restore();
      const vignette = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
      c.fillStyle = vignette; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.03;
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0, 0, W, H); }
      c.restore();
    };

    let prevTime = 0;
    let fwTimer = 0;

    const loop = (now: number) => {
      if (!t0.current) { t0.current = now; prevTime = now; }
      const t = (now - t0.current) / 1000;
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      if (t >= DUR) {
        if (!done.current) { done.current = true; cbR.current?.(); }
        return;
      }

      if (t >= 5.5 && t < 11.5) {
        fwTimer += dt;
        if (fwTimer > 0.8 + Math.random() * 0.6) { spawnFirework(); fwTimer = 0; }
      }
      updateFireworks(dt);
      spawnParticles(t, now / 1000);
      updateParticles(dt, now / 1000);

      c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);

      cameraShake *= 0.92;

      const zoomClimax = t < 11.5
        ? lerp(1.0, 1.10, eOE(t / 11.5))
        : lerp(1.10, 2.5, clamp((t - 11.5) / 2.5, 0, 1));

      const breatheX = Math.sin(t * 0.4) * 2 + (Math.random() - 0.5) * cameraShake;
      const breatheY = Math.cos(t * 0.3) * 1.5 + (Math.random() - 0.5) * cameraShake;
      const camRot = Math.sin(t * 0.15) * 0.003;

      c.save();
      c.translate(W / 2 + breatheX, H / 2 + breatheY);
      c.rotate(camRot);
      c.scale(zoomClimax, zoomClimax);
      c.translate(-W / 2, -H / 2);

      const sceneAlpha = t < 11.5 ? 1 : clamp(1 - (t - 11.5) * 1.8, 0, 1);

      renderer.sky(t, sceneAlpha);
      renderer.stars(t, sceneAlpha);
      renderer.drawKites(t, sceneAlpha); 
      renderer.wavingFlagAndChakra(t, now / 1000, sceneAlpha); 
      renderer.redFort(t, sceneAlpha); 
      renderer.volumetricLighting(t, sceneAlpha);
      renderer.torch(t, now / 1000, sceneAlpha);
      drawParticles();
      renderer.fireworks(sceneAlpha);
      renderer.doves(t, now / 1000, sceneAlpha);

      c.restore();

      if (t >= 11.5 && t < 14.5) {
        const bgFade = clamp((t - 11.5) * 1.8, 0, 1);
        c.save(); c.globalAlpha = bgFade;
        const bgGrad = c.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#060810'); bgGrad.addColorStop(1, '#0c101c');
        c.fillStyle = bgGrad; c.fillRect(0, 0, W, H);
        c.restore();
      }

      renderer.typography(t);
      drawChromaticAberration();
      drawPostFX();

      if (t >= 14.5) {
        const whiteFadeAlpha = clamp((t - 14.5) * 1.8, 0, 1);
        c.save();
        c.globalAlpha = whiteFadeAlpha;
        c.fillStyle = '#FFFFFF';
        c.fillRect(0, 0, W, H);
        c.restore();
      }

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
        audioCtxRef.current = null;
      }
    };
  }, [mkPool, grab, triggerMilitaryAudio]);

  return (
    <canvas
      ref={cvRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        display: 'block', zIndex: 50,
      }}
    />
  );
}
