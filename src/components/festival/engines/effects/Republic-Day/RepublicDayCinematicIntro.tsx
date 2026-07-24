'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════ */
interface Props {
  onComplete?: () => void;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; ml: number; sz: number;
  r: number; g: number; b: number; a: number;
  tp: number;
  rot: number; rs: number; on: boolean;
  turbOff: number;
}

interface Jet {
  x: number; y: number; scale: number; smokeColor: string; vx: number; vy: number; active: boolean;
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

interface TextJet {
  x: number; y: number; vx: number; scale: number;
  smokeColor: string; trail: { x: number; y: number; a: number }[];
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

export default function RepublicDayCinematicIntro({ onComplete }: Props) {
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
        kick.frequency.setValueAtTime(100, bt);
        kick.frequency.exponentialRampToValueAtTime(18, bt + 0.15);
        kg.gain.setValueAtTime(0.35, bt);
        kg.gain.exponentialRampToValueAtTime(0.001, bt + 0.18);
        kick.connect(kg); kg.connect(ctx.destination);
        kick.start(bt); kick.stop(bt + 0.18);
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

    const noise = new SimplexNoise(3821);
    const pl = mkPool();

    const numPoints = 14;
    const flagNodes: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      flagNodes.push({ x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0 });
    }

    const jets: Jet[] = Array.from({ length: 6 }, () => ({
      x: 0, y: 0, scale: 0.85, smokeColor: '#FFFFFF', vx: 0, vy: 0, active: true
    }));

    const textJets: TextJet[] = [];

    const starI: number[] = [];
    for (let i = 0; i < 150; i++) starI.push(i);

    const birds: BoidBird[] = [];

    let sc = 0, gateH = 0, gateW = 0, baseY = 0, cx = 0, pillarH = 0, pillarY = 0;

    const rsz = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      sc = Math.min(W, H);
      gateH = sc * 0.48;
      gateW = gateH * 0.84;
      baseY = H * 0.86;
      cx = W * 0.5;
      pillarH = gateH * 0.72;
      pillarY = baseY - 32 - pillarH;

      if (flagNodes.length > 0) flagNodes[0].x = 0;

      for (let i = 0; i < starI.length; i++) {
        const idx = starI[i]; const p = pl[idx];
        p.on = true; p.tp = 0;
        p.x = Math.random() * W;
        p.y = Math.random() * H * 0.75;
        p.sz = Math.random() * 1.2 + 0.2;
        p.ml = 999; p.life = 999;
        p.r = 200; p.g = 220; p.b = 255;
        p.a = Math.random() * 0.4 + 0.05;
      }

      jets[0] = { x: -W * 0.25, y: H * 0.40, scale: 0.90, smokeColor: '#FFFFFF', vx: 6.2, vy: -0.8, active: true };
      jets[1] = { x: -W * 0.38, y: H * 0.35, scale: 0.84, smokeColor: '#FF9933', vx: 6.2, vy: -0.8, active: true };
      jets[2] = { x: -W * 0.38, y: H * 0.45, scale: 0.84, smokeColor: '#138808', vx: 6.2, vy: -0.8, active: true };
      jets[3] = { x: W + W * 0.25, y: H * 0.15, scale: 0.90, smokeColor: '#FFFFFF', vx: -6.2, vy: 0.8, active: true };
      jets[4] = { x: W + W * 0.38, y: H * 0.10, scale: 0.84, smokeColor: '#FF9933', vx: -6.2, vy: 0.8, active: true };
      jets[5] = { x: W + W * 0.38, y: H * 0.20, scale: 0.84, smokeColor: '#138808', vx: -6.2, vy: 0.8, active: true };

      birds.length = 0;
      const birdY = baseY - gateH * 0.88;
      for (let i = 0; i < 8; i++) {
        birds.push({
          x: cx - gateW * 0.44 + (gateW * 0.16) * (i / 7),
          y: birdY - 4, vx: 0, vy: 0,
          wing: Math.random() * Math.PI * 2,
          state: 'sitting', side: 'left',
          noiseSeed: Math.random() * 1000, bank: 0
        });
      }
      for (let i = 0; i < 8; i++) {
        birds.push({
          x: cx + gateW * 0.28 + (gateW * 0.16) * (i / 7),
          y: birdY - 4, vx: 0, vy: 0,
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
    const fwColors = [
      {r:255,g:153,b:51}, {r:255,g:255,b:255},
      {r:19,g:136,b:8}, {r:255,g:215,b:0},
      {r:100,g:200,b:255}, {r:255,g:100,b:150}
    ];

    const spawnFirework = () => {
      const col = fwColors[Math.floor(Math.random() * fwColors.length)];
      fireworksList.push({
        x: W * 0.15 + Math.random() * W * 0.7, y: H,
        vy: -5.5 - Math.random() * 3.5, state: 'rising', burstT: 0, col: col, pts: []
      });
    };

    const updateFireworks = (dt: number) => {
      for (let i = fireworksList.length - 1; i >= 0; i--) {
        const fw = fireworksList[i];
        if (fw.state === 'rising') {
          fw.y += fw.vy; fw.vy += 0.04;
          if (fw.vy >= -0.5 || fw.y < H * 0.15) {
            fw.state = 'burst';
            const count = 50 + Math.random() * 40 | 0;
            const pattern = Math.random();
            for (let j = 0; j < count; j++) {
              let ang: number, spd: number;
              if (pattern < 0.3) {
                ang = (j / count) * Math.PI * 2;
                spd = 2.5 + Math.random() * 0.8;
              } else if (pattern < 0.6) {
                ang = (j / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                spd = 1.0 + Math.random() * 3.0;
              } else {
                ang = Math.random() * Math.PI * 2;
                spd = 0.5 + Math.random() * 3.5;
              }
              fw.pts.push({
                x: fw.x, y: fw.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 1.8 + Math.random() * 1.5, ml: 3.3, sz: 1.5 + Math.random() * 2.5
              });
            }
          }
        } else {
          fw.burstT += dt;
          for (let j = fw.pts.length - 1; j >= 0; j--) {
            const pt = fw.pts[j];
            pt.x += pt.vx; pt.y += pt.vy;
            pt.vy += 0.030; pt.vx *= 0.988; pt.vy *= 0.988;
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
        if (t < 3.5) {
          const ip = clamp(t / 3.5, 0, 1);
          grad.addColorStop(0, `rgb(${lerp(3,12,ip)|0},${lerp(5,18,ip)|0},${lerp(15,40,ip)|0})`);
          grad.addColorStop(0.6, `rgb(${lerp(5,15,ip)|0},${lerp(8,20,ip)|0},${lerp(22,48,ip)|0})`);
          grad.addColorStop(1, `rgb(${lerp(8,18,ip)|0},${lerp(10,22,ip)|0},${lerp(28,55,ip)|0})`);
        } else if (t < 7.5) {
          const ip = clamp((t - 3.5) / 4.0, 0, 1);
          grad.addColorStop(0, `rgb(${lerp(12,25,ip)|0},${lerp(18,30,ip)|0},${lerp(40,68,ip)|0})`);
          grad.addColorStop(0.4, `rgb(${lerp(15,35,ip)|0},${lerp(20,28,ip)|0},${lerp(48,72,ip)|0})`);
          grad.addColorStop(0.75, `rgb(${lerp(18,55,ip)|0},${lerp(22,40,ip)|0},${lerp(55,65,ip)|0})`);
          grad.addColorStop(1, `rgb(${lerp(18,70,ip)|0},${lerp(22,50,ip)|0},${lerp(55,58,ip)|0})`);
        } else if (t < 10.5) {
          const ip = clamp((t - 7.5) / 3.0, 0, 1);
          grad.addColorStop(0, `rgb(${lerp(25,55,ip)|0},${lerp(30,65,ip)|0},${lerp(68,105,ip)|0})`);
          grad.addColorStop(0.5, `rgb(${lerp(35,70,ip)|0},${lerp(28,55,ip)|0},${lerp(72,90,ip)|0})`);
          grad.addColorStop(0.8, `rgb(${lerp(55,90,ip)|0},${lerp(40,60,ip)|0},${lerp(65,70,ip)|0})`);
          grad.addColorStop(1, `rgb(${lerp(70,110,ip)|0},${lerp(50,68,ip)|0},${lerp(58,55,ip)|0})`);
        } else {
          // स्काई को 10.5s से ही डार्क करना शुरू करते हैं ताकि 14.5s पर टेक्स्ट के आने से पहले पूरी तरह रात का फील मिले
          const ip = clamp((t - 10.5) / 3.0, 0, 1);
          grad.addColorStop(0, `rgb(${lerp(55,8,ip)|0},${lerp(65,15,ip)|0},${lerp(105,55,ip)|0})`);
          grad.addColorStop(1, `rgb(${lerp(110,20,ip)|0},${lerp(68,30,ip)|0},${lerp(55,80,ip)|0})`);
        }
        c.fillStyle = grad; c.fillRect(0, 0, W, H);
        c.restore();
      },

      stars: (t: number, sceneAlpha: number) => {
        if (t > 7) return;
        const alpha = clamp(1 - t / 7, 0, 1) * sceneAlpha;
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

      horizonGlow: (t: number, sceneAlpha: number) => {
        if (t < 4.0 || t > 10.5) return;
        const fadeIn = clamp((t - 4.0) * 0.5, 0, 1);
        const fadeOut = clamp((10.5 - t) * 0.5, 0, 1);
        const alpha = fadeIn * fadeOut * 0.12 * sceneAlpha;
        c.save();
        c.globalAlpha = alpha;
        c.globalCompositeOperation = 'screen';
        const glowY = baseY - gateH * 0.3;
        const glowH = gateH * 1.2;
        const grad = c.createLinearGradient(0, glowY - glowH / 2, 0, glowY + glowH / 2);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.35, 'rgba(180,140,100,0.15)');
        grad.addColorStop(0.5, 'rgba(200,160,110,0.2)');
        grad.addColorStop(0.65, 'rgba(180,140,100,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = grad;
        c.fillRect(cx - gateW * 0.8, glowY - glowH / 2, gateW * 1.6, glowH);
        c.restore();
      },

      /* ═══════════════════════════════════════════════════════════
         GROUND / GARDEN — "पत्थर" हटाने के लिए सुधारे गए मार्ग
         ═══════════════════════════════════════════════════════════ */
      ground: (t: number, sceneAlpha: number) => {
        const reveal = clamp((t - 0.8) * 0.4, 0, 1);
        c.save(); c.globalAlpha = reveal * sceneAlpha;

        const gTop = baseY;
        const gBot = H;

        // ★★★ "पत्थर" हटाने का मुख्य सुधार: वर्टिकल राजपथ को पूरी तरह हटा दिया गया है
        // अब पूरा ग्राउंड एक समान समतल हरी घास (Main Lawn) में कनवर्टेड है
        const lawnGrad = c.createLinearGradient(0, gTop, 0, gBot);
        lawnGrad.addColorStop(0, '#112510');
        lawnGrad.addColorStop(0.3, '#0d1c0c');
        lawnGrad.addColorStop(1, '#060a05');
        c.fillStyle = lawnGrad;
        c.fillRect(0, gTop, W, gBot - gTop);

        // ── बगीचे के पौधे और साइड के फूल ──
        const flowerColors = ['rgba(120,40,30,0.06)', 'rgba(255,180,50,0.04)', 'rgba(60,100,40,0.05)'];
        const flowerPositions = [
          { x: cx - gateW * 0.38, y: gTop + 15 },
          { x: cx + gateW * 0.38, y: gTop + 20 },
          { x: cx - gateW * 0.28, y: gTop + 25 },
          { x: cx + gateW * 0.28, y: gTop + 18 },
          { x: cx - gateW * 0.18, y: gTop + 12 },
          { x: cx + gateW * 0.18, y: gTop + 22 },
        ];
        flowerPositions.forEach((fp, fi) => {
          c.fillStyle = flowerColors[fi % flowerColors.length];
          c.beginPath();
          c.ellipse(fp.x, fp.y, gateW * 0.04, 8, 0, 0, Math.PI * 2);
          c.fill();
        });

        // ── गेट के निचले हिस्से की झाड़ियाँ (Hedges) ──
        const hedgeColor = '#1a3015';
        const hedgeH = 14;
        const hedgeW = gateW * 0.10;
        for (let i = 0; i < 4; i++) {
          const hx = cx - gateW * 0.50 + i * (gateW * 0.065);
          c.fillStyle = hedgeColor;
          c.beginPath();
          c.ellipse(hx, gTop + 3, hedgeW / 2, hedgeH / 2, 0, 0, Math.PI * 2);
          c.fill();
          c.beginPath();
          c.ellipse(cx + gateW * 0.50 - i * (gateW * 0.065), gTop + 3, hedgeW / 2, hedgeH / 2, 0, 0, Math.PI * 2);
          c.fill();
        }

        // ── पेड़ों का आकार (Tree Silhouettes) ──
        const drawTree = (tx: number, ty: number, s: number) => {
          c.fillStyle = '#14100a';
          c.fillRect(tx - 3 * s, ty - 25 * s, 6 * s, 28 * s);
          for (let layer = 0; layer < 3; layer++) {
            const cw = (22 - layer * 5) * s;
            const ch = (14 - layer * 2) * s;
            const cy = ty - 25 * s - layer * 10 * s;
            c.fillStyle = layer === 1 ? '#0f200f' : '#0c180c';
            c.beginPath();
            c.ellipse(tx + (layer - 1) * 4 * s, cy, cw, ch, 0, 0, Math.PI * 2);
            c.fill();
          }
        };

        drawTree(cx - gateW * 0.56, gTop, 1.3);
        drawTree(cx - gateW * 0.65, gTop, 1.0);
        drawTree(cx - gateW * 0.72, gTop, 1.15);
        drawTree(cx + gateW * 0.56, gTop, 1.2);
        drawTree(cx + gateW * 0.63, gTop, 1.35);
        drawTree(cx + gateW * 0.70, gTop, 1.0);

        c.globalAlpha = reveal * sceneAlpha * 0.4;
        drawTree(cx - gateW * 0.82, gTop, 0.75);
        drawTree(cx + gateW * 0.80, gTop, 0.8);
        drawTree(cx - gateW * 0.90, gTop, 0.55);
        drawTree(cx + gateW * 0.88, gTop, 0.6);
        drawTree(cx - gateW * 0.96, gTop, 0.4);
        drawTree(cx + gateW * 0.94, gTop, 0.45);

        // ── कोहरा (Ground Fog) ──
        c.globalAlpha = reveal * sceneAlpha * 0.15;
        const fogGrad = c.createLinearGradient(0, gTop, 0, gTop + 40);
        fogGrad.addColorStop(0, 'rgba(20,30,40,0.3)');
        fogGrad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = fogGrad;
        c.fillRect(0, gTop, W, 40);

        c.restore();
      },

      indiaGate: (t: number, sceneAlpha: number) => {
        const reveal = clamp((t - 0.8) * 0.4, 0, 1);
        c.save(); c.globalAlpha = reveal * sceneAlpha;

        const baseColor = '#c1805b';
        const shadowColor = '#6d3c26';
        const highlightColor = '#eed2bc';
        const darkSienna = '#4e2311';
        const deepCavity = '#271005';

        const drawBevelBlock = (x: number, y: number, w: number, h: number) => {
          c.fillStyle = 'rgba(0,0,0,0.32)';
          c.fillRect(x - 2, y - 2, w + 4, h + 4);
          const frontGrad = c.createLinearGradient(x, y, x, y + h);
          frontGrad.addColorStop(0, highlightColor);
          frontGrad.addColorStop(0.35, baseColor);
          frontGrad.addColorStop(1, shadowColor);
          c.fillStyle = frontGrad; c.fillRect(x, y, w, h);
          c.strokeStyle = highlightColor; c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y); c.lineTo(x + w, y); c.stroke();
          c.strokeStyle = shadowColor; c.lineWidth = 1.8;
          c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.stroke();
        };

        const drawCorniceLine = (x: number, y: number, w: number, h: number) => {
          drawBevelBlock(x, y, w, h);
          c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x + 5, y + 2, w - 10, 2);
          c.fillStyle = highlightColor; c.fillRect(x, y, w, 1);
        };

        // ग्राउंड शैडो
        c.fillStyle = 'rgba(0,0,0,0.45)';
        c.beginPath();
        c.ellipse(cx, baseY + 5, gateW * 0.62, 10, 0, 0, Math.PI * 2);
        c.fill();

        // सुधारे गए बेस स्टेप्स - सीधे समतल मैदान पर स्थापित
        drawBevelBlock(cx - gateW * 0.50, baseY - 18, gateW * 1.00, 12);
        drawBevelBlock(cx - gateW * 0.46, baseY - 28, gateW * 0.92, 10);
        drawBevelBlock(cx - gateW * 0.44, baseY - 36, gateW * 0.88, 8);

        const pW = gateW * 0.25, pH = gateH * 0.72, pY = baseY - 36 - pH;
        drawBevelBlock(cx - gateW * 0.45, pY, pW, pH);
        drawBevelBlock(cx + gateW * 0.45 - pW, pY, pW, pH);

        c.fillStyle = 'rgba(90,52,32,0.12)';
        for (let fi = 1; fi <= 3; fi++) {
          const fx = pW * (fi / 4);
          c.fillRect(cx - gateW * 0.45 + fx - 1, pY + 5, 2, pH - 10);
          c.fillRect(cx + gateW * 0.45 - pW + fx - 1, pY + 5, 2, pH - 10);
        }

        const cArchW = gateW * 0.40, cArchH = gateH * 0.54, cArchY = baseY - 36 - cArchH;
        c.save();
        c.beginPath();
        c.moveTo(cx - cArchW/2, baseY - 36);
        c.lineTo(cx - cArchW/2, cArchY + cArchW/2);
        c.arc(cx, cArchY + cArchW/2, cArchW/2, Math.PI, 0, false);
        c.lineTo(cx + cArchW/2, baseY - 36);
        c.closePath(); c.clip();
        const archShadow = c.createRadialGradient(cx, cArchY + cArchW/2, cArchW * 0.25, cx, cArchY + cArchW/2, cArchW * 0.55);
        archShadow.addColorStop(0, 'rgba(0,0,0,0)');
        archShadow.addColorStop(1, 'rgba(0,0,0,0.65)');
        c.fillStyle = archShadow;
        c.fillRect(cx - cArchW/2, cArchY, cArchW, cArchH + 40);
        c.restore();

        const lintelH = gateH * 0.12, lintelY = pY - lintelH;
        drawBevelBlock(cx - gateW * 0.48, lintelY, gateW * 0.96, lintelH);

        c.save();
        const subFontSz = Math.min(gateW * 0.02, 10);
        c.font = `600 ${subFontSz}px 'Cinzel', serif`;
        c.fillStyle = darkSienna;
        c.textAlign = 'left'; c.fillText("MCMXIV", cx - gateW * 0.35, lintelY + lintelH * 0.5);
        c.textAlign = 'right'; c.fillText("MCMXIX", cx + gateW * 0.35, lintelY + lintelH * 0.5);
        const tSz = Math.min(gateW * 0.07, 24);
        c.font = `700 ${tSz}px 'Cinzel', 'Playfair Display', Georgia, serif`;
        c.textAlign = 'center';
        c.fillStyle = deepCavity; c.fillText("INDIA", cx + 1, lintelY + lintelH * 0.52 + 1);
        c.fillStyle = darkSienna; c.fillText("INDIA", cx, lintelY + lintelH * 0.52);
        c.restore();

        const attic1Y = lintelY - gateH * 0.08;
        drawCorniceLine(cx - gateW * 0.45, attic1Y, gateW * 0.90, gateH * 0.08);
        c.fillStyle = shadowColor;
        for (let di = 0; di < 24; di++) {
          const dx = cx - gateW * 0.43 + (gateW * 0.86) * (di / 24);
          c.fillRect(dx, attic1Y + 3, 5, 4);
        }

        const attic2Y = attic1Y - gateH * 0.06;
        drawCorniceLine(cx - gateW * 0.38, attic2Y, gateW * 0.76, gateH * 0.06);

        const domeH = gateH * 0.06, domeY = attic2Y - domeH;
        c.beginPath();
        c.moveTo(cx - gateW * 0.16, attic2Y);
        c.quadraticCurveTo(cx, domeY - domeH * 0.4, cx + gateW * 0.16, attic2Y);
        c.closePath();
        const domeGrad = c.createLinearGradient(cx - gateW * 0.16, domeY, cx + gateW * 0.16, attic2Y);
        domeGrad.addColorStop(0, highlightColor);
        domeGrad.addColorStop(0.4, baseColor);
        domeGrad.addColorStop(1, shadowColor);
        c.fillStyle = domeGrad; c.fill();
        c.strokeStyle = shadowColor; c.lineWidth = 1.2; c.stroke();

        c.fillStyle = shadowColor;
        c.beginPath(); c.moveTo(cx - 3, domeY + 2); c.lineTo(cx, domeY - 12); c.lineTo(cx + 3, domeY + 2); c.closePath(); c.fill();
        c.beginPath(); c.arc(cx, domeY - 14, 3.5, 0, Math.PI * 2); c.fill();

        c.strokeStyle = 'rgba(90,52,32,0.18)'; c.lineWidth = 1.5;
        [cx - gateW * 0.32, cx + gateW * 0.32].forEach(wx => {
          c.beginPath(); c.arc(wx, pY + pH * 0.12, 10, 0, Math.PI * 2); c.stroke();
        });

        c.restore();
      },

      torch: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 2.0) return;
        const tx = W * 0.5;
        const ty = baseY - 36;
        const fireAlpha = clamp((t - 2.0) * 1.5, 0, 1) * sceneAlpha;
        c.save(); c.globalAlpha = fireAlpha; c.globalCompositeOperation = 'lighter';
        const glowGrad = c.createRadialGradient(tx, ty, 0, tx, ty, 35);
        glowGrad.addColorStop(0, 'rgba(255,120,20,0.2)');
        glowGrad.addColorStop(0.5, 'rgba(255,60,5,0.06)');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = glowGrad;
        c.fillRect(tx - 35, ty - 35, 70, 70);
        const flicker = Math.sin(elapsed * 32) * 3;
        const flameH = 36 + flicker, flameW = 9;
        const fireGrad = c.createLinearGradient(tx, ty, tx, ty - flameH);
        fireGrad.addColorStop(0, '#ffffff');
        fireGrad.addColorStop(0.2, 'rgba(255,210,80,0.9)');
        fireGrad.addColorStop(0.6, 'rgba(255,120,20,0.5)');
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
        const fw = gateW * 0.48;
        const fh = fw * 0.66;
        const pH = gateH * 0.72;
        const pY = baseY - 36 - pH;
        const lintelH = gateH * 0.12;
        const lintelY = pY - lintelH;
        const attic1Y = lintelY - gateH * 0.08;
        const attic2Y = attic1Y - gateH * 0.06;
        const poleHeight = gateH * 0.48;
        const poleTopX = cx;
        const poleTopY = attic2Y - poleHeight;

        if (flagNodes[0].x === 0) {
          for (let i = 0; i < numPoints; i++) {
            flagNodes[i].x = poleTopX + (i * fw) / (numPoints - 1);
            flagNodes[i].y = poleTopY;
            flagNodes[i].ox = flagNodes[i].x; flagNodes[i].oy = flagNodes[i].y;
          }
        }

        for (let i = 1; i < numPoints; i++) {
          const wind = 0.15 + noise.n2(elapsed * 0.5 + i * 0.10, 0) * 0.12;
          const gravity = 0.02;
          const waveOffset = Math.sin(elapsed * 2.5 - i * 0.4) * 0.04;
          flagNodes[i].vx = (flagNodes[i].x - flagNodes[i].ox) * 0.94 + wind;
          flagNodes[i].vy = (flagNodes[i].y - flagNodes[i].oy) * 0.94 + gravity + waveOffset;
          flagNodes[i].ox = flagNodes[i].x; flagNodes[i].oy = flagNodes[i].y;
          flagNodes[i].x += flagNodes[i].vx; flagNodes[i].y += flagNodes[i].vy;
        }
        flagNodes[0].x = poleTopX; flagNodes[0].y = poleTopY;

        const linkLength = fw / (numPoints - 1);
        for (let steps = 0; steps < 6; steps++) {
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
        const poleBaseY = attic2Y + 15;
        const poleGrad = c.createLinearGradient(poleTopX - 3.5, poleTopY, poleTopX + 3.5, poleBaseY);
        poleGrad.addColorStop(0, '#f0f0f0');
        poleGrad.addColorStop(0.3, '#ffffff');
        poleGrad.addColorStop(0.7, '#9e9e9e');
        poleGrad.addColorStop(1, '#555555');
        c.fillStyle = poleGrad; c.fillRect(poleTopX - 3.5, poleTopY, 7, poleBaseY - poleTopY);
        c.fillStyle = '#ffd700'; c.beginPath(); c.arc(poleTopX, poleTopY, 6, 0, Math.PI * 2); c.fill();

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

        const midIdx = numPoints / 2 | 0;
        const cxV = flagNodes[midIdx].x, cyV = flagNodes[midIdx].y + fh / 2, cr = fh * 0.11;
        c.save(); c.translate(cxV, cyV); c.rotate(elapsed * 0.7);
        c.strokeStyle = 'rgba(0,0,128,1)'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(0, 0, cr, 0, Math.PI * 2); c.stroke();
        c.lineWidth = 1.2;
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * Math.PI * 2;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang) * cr, Math.sin(ang) * cr); c.stroke();
        }
        c.restore(); c.restore();
      },

      jetsAndTrails: (t: number, sceneAlpha: number) => {
        if (t < 2.5 || t > 9.0) return;
        c.save(); c.globalAlpha = sceneAlpha;
        jets.forEach(jet => {
          jet.x += jet.vx; jet.y += jet.vy;
          if (Math.abs(jet.x - W * 0.5) < 180) cameraShake = 3.5;
          const nozzleX = jet.x - (jet.vx > 0 ? 32 : -32) * jet.scale;
          const nozzleY = jet.y + 2 * jet.scale;
          if (Math.random() < 0.85) {
            const p = grab(pl); if (p) {
              p.on = true; p.x = nozzleX; p.y = nozzleY;
              p.vx = -jet.vx * 0.12 + (Math.random() - 0.5) * 0.4;
              p.vy = (Math.random() - 0.5) * 0.4;
              p.life = 4.2; p.ml = 4.2; p.sz = 14 * jet.scale + Math.random() * 15;
              const hex = jet.smokeColor.replace('#', '');
              p.r = parseInt(hex.substring(0, 2), 16);
              p.g = parseInt(hex.substring(2, 4), 16);
              p.b = parseInt(hex.substring(4, 6), 16);
              p.a = 0.65; p.tp = 4;
            }
          }
          c.save(); c.translate(jet.x, jet.y);
          c.rotate(Math.atan2(jet.vy, jet.vx)); c.scale(jet.scale, jet.scale);
          c.fillStyle = '#1c1c1c'; c.beginPath();
          c.moveTo(35, 0); c.lineTo(15, -4); c.lineTo(2, -18);
          c.lineTo(-10, -28); c.lineTo(-14, -28); c.lineTo(-12, -4);
          c.lineTo(-24, -3); c.lineTo(-28, -8); c.lineTo(-32, -8);
          c.lineTo(-30, 0); c.lineTo(-32, 8); c.lineTo(-28, 8);
          c.lineTo(-24, 3); c.lineTo(-12, 4); c.lineTo(-14, 28);
          c.lineTo(-10, 28); c.lineTo(2, 18); c.lineTo(15, 4);
          c.closePath(); c.fill(); c.restore();
        });
        c.restore();
      },

      doves: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 2.0) return;
        const dAlpha = clamp((t - 2.0) * 1.2, 0, 1) * sceneAlpha;
        c.save(); c.globalAlpha = dAlpha;
        if (t >= 2.6) {
          birds.forEach(b => {
            if (b.state === 'sitting') {
              b.state = 'flying';
              const driftX = b.side === 'left' ? 0.9 : -0.9;
              b.vx = driftX + (Math.random() - 0.5) * 0.4;
              b.vy = -1.2 - Math.random() * 0.8;
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
            const dutyCycle = Math.sin(elapsed * 3.5 + b.noiseSeed);
            b.wing += dutyCycle > 0 ? 0.28 : 0.12;
            b.bank = b.vx * 0.10;
          }
          c.save(); c.translate(b.x, b.y);
          c.rotate(b.state === 'flying' ? Math.atan2(b.vy, b.vx) + b.bank : 0);
          const scale = 0.52; c.scale(scale, scale);
          if (b.state === 'flying') {
            const wingFactor = Math.sin(b.wing);
            c.fillStyle = '#d8d8d8';
            c.beginPath(); c.moveTo(-15, 0); c.lineTo(-26, -5 + wingFactor * 2); c.lineTo(-26, 5 - wingFactor * 2); c.closePath(); c.fill();
            c.fillStyle = '#ffffff';
            c.beginPath(); c.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(13, -2, 4, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#e29b3c';
            c.beginPath(); c.moveTo(16, -3); c.lineTo(21, -2); c.lineTo(15, -1); c.closePath(); c.fill();
            [-1, 1].forEach(side => {
              c.save(); c.scale(1, side); c.rotate(wingFactor * 0.5 - 0.15);
              c.fillStyle = '#f0f0f0';
              c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -15); c.lineTo(-13, -13); c.closePath(); c.fill();
              c.restore();
            });
          } else {
            const headBob = Math.sin(elapsed * 5.5 + b.noiseSeed) * 1.2;
            c.fillStyle = '#b5b5b5';
            c.beginPath(); c.moveTo(-10, 2); c.lineTo(-22, 6); c.lineTo(-20, 0); c.closePath(); c.fill();
            c.fillStyle = '#f5f5f5';
            c.beginPath(); c.ellipse(0, 2, 13, 6.5, 0.1, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#ffffff';
            c.beginPath(); c.arc(10, -2 + headBob, 4, 0, Math.PI * 2); c.fill();
          }
          c.restore();
        });
        c.restore();
      },

      /* ═══════════════════════════════════════════════════════════
         TYPOGRAPHY — ★ सुधारा गया समय: 14.5 सेकंड से शुरू होगा
         ═══════════════════════════════════════════════════════════ */
      typography: (t: number, elapsed: number) => {
        // टेक्स्ट अब केवल तभी दिखाई देगा जब 14.5s पर इंडिया गेट पूरी तरह से ओझल हो जाएगा
        if (t < 14.5) return;
        const titleY = lerp(H * 0.58, H * 0.44, eOE((t - 14.5) * 0.5));
        c.save();

        /* ── जेट प्लेन का एनीमेशन ── */
        if (t >= 14.5 && t < 15.8) {
          const jetPhase = (t - 14.5) / 1.3;
          const jetSpeed = W * 0.38;
          const jetY = titleY - 5;

          if (textJets.length === 0) {
            textJets.push(
              { x: -60, y: jetY - 15, vx: jetSpeed, scale: 0.45, smokeColor: '#FF9933', trail: [] },
              { x: -120, y: jetY, vx: jetSpeed * 1.02, scale: 0.38, smokeColor: '#FFFFFF', trail: [] },
              { x: -80, y: jetY + 15, vx: jetSpeed * 0.98, scale: 0.38, smokeColor: '#138808', trail: [] },
            );
          }

          textJets.forEach((tj) => {
            tj.x += tj.vx;
            if (Math.random() < 0.6) {
              tj.trail.push({ x: tj.x - 18 * tj.scale, y: tj.y + (Math.random() - 0.5) * 4, a: 0.5 });
              if (tj.trail.length > 30) tj.trail.shift();
            }
            tj.trail.forEach((tp) => {
              c.save();
              c.globalAlpha = tp.a * clamp(1 - jetPhase * 0.3, 0, 1);
              const hex = tj.smokeColor.replace('#', '');
              c.fillStyle = `rgba(${parseInt(hex.substring(0,2),16)},${parseInt(hex.substring(2,4),16)},${parseInt(hex.substring(4,6),16)},0.5)`;
              c.beginPath();
              c.arc(tp.x, tp.y, 4 * tj.scale, 0, Math.PI * 2);
              c.fill();
              c.restore();
            });
            c.save();
            c.globalAlpha = clamp(1 - jetPhase * 0.5, 0, 1);
            c.translate(tj.x, tj.y);
            c.scale(tj.scale, tj.scale);
            c.fillStyle = '#1a1a1a';
            c.beginPath();
            c.moveTo(20, 0); c.lineTo(8, -2); c.lineTo(0, -10);
            c.lineTo(-5, -14); c.lineTo(-8, -14); c.lineTo(-5, -2);
            c.lineTo(-14, 0); c.lineTo(-18, -5); c.lineTo(-18, 5);
            c.lineTo(-14, 0); c.lineTo(-5, 2); c.lineTo(0, 10);
            c.lineTo(8, 2);
            c.closePath(); c.fill();
            c.restore();
          });
        }

        /* ── मुख्य शीर्षक (Main Title) ── */
        const fontSize = Math.min(W * 0.065, 52);
        c.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;
        const title = "HAPPY REPUBLIC DAY";
        const totalW = c.measureText(title).width;
        let xOff = W * 0.5 - totalW * 0.5;
        for (let i = 0; i < title.length; i++) {
          const charW = c.measureText(title[i]).width;
          const charT = clamp((t - 14.5 - i * 0.035) / 0.4, 0, 1);
          if (charT <= 0) { xOff += charW; continue; }
          const charY = titleY + (1 - eOB(charT)) * -15;

          c.save(); c.globalAlpha = eOC(charT);
          c.fillStyle = 'rgba(0,0,0,0.92)';
          c.fillText(title[i], xOff + 2, charY + 2);
          const sweepGrad = c.createLinearGradient(xOff, charY - fontSize * 0.5, xOff, charY + fontSize * 0.38);
          sweepGrad.addColorStop(0, '#FF9933'); sweepGrad.addColorStop(0.48, '#FFFFFF');
          sweepGrad.addColorStop(0.52, '#FFFFFF'); sweepGrad.addColorStop(1, '#138808');
          c.fillStyle = sweepGrad;
          c.fillText(title[i], xOff, charY);
          c.restore();

          if (charT > 0.3 && charT < 0.5) {
            const bx = xOff + charW / 2;
            const by = charY - fontSize * 0.1;
            const colors = [
              { r: 255, g: 153, b: 51 },
              { r: 255, g: 255, b: 255 },
              { r: 19, g: 136, b: 8 },
            ];
            for (let bi = 0; bi < 5; bi++) {
              const p = grab(pl); if (p) {
                p.on = true; p.x = bx; p.y = by;
                const ang = (bi / 5) * Math.PI * 2 + Math.random() * 0.8;
                const spd = 1.5 + Math.random() * 2.5;
                p.vx = Math.cos(ang) * spd;
                p.vy = Math.sin(ang) * spd - 0.5;
                p.life = 0.8 + Math.random() * 0.6; p.ml = 1.4; p.sz = 2.0 + Math.random() * 2.0;
                const col = colors[bi % 3];
                p.r = col.r; p.g = col.g; p.b = col.b;
                p.a = 0.9; p.tp = 7;
              }
            }
          }
          xOff += charW;
        }

        /* ── जय हिन्द ── */
        if (t > 16.0) {
          const subAlpha = clamp((t - 16.0) * 2, 0, 1);
          c.save(); c.globalAlpha = subAlpha;
          c.fillStyle = '#ffd700'; c.textAlign = 'center';
          c.font = `500 ${fontSize * 0.65}px 'Georgia', serif`;
          c.fillText("जय हिन्द", W * 0.5, titleY + fontSize * 1.1);

          if (subAlpha > 0.1 && subAlpha < 0.4) {
            const bx = W * 0.5, by = titleY + fontSize * 1.1;
            const colors = [
              { r: 255, g: 153, b: 51 },
              { r: 255, g: 255, b: 255 },
              { r: 19, g: 136, b: 8 },
              { r: 255, g: 215, b: 0 },
            ];
            for (let bi = 0; bi < 12; bi++) {
              const p = grab(pl); if (p) {
                p.on = true; p.x = bx; p.y = by;
                const ang = (bi / 12) * Math.PI * 2;
                const spd = 2.0 + Math.random() * 3.0;
                p.vx = Math.cos(ang) * spd;
                p.vy = Math.sin(ang) * spd - 0.8;
                p.life = 1.0 + Math.random() * 0.8; p.ml = 1.8; p.sz = 2.5 + Math.random() * 2.5;
                const col = colors[bi % 4];
                p.r = col.r; p.g = col.g; p.b = col.b;
                p.a = 0.85; p.tp = 7;
              }
            }
          }
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

    /* ═══════════════════════════════════════════════════════════
       PARTICLES
       ═══════════════════════════════════════════════════════════ */
    const spawnParticles = (t: number, elapsed: number) => {
      if (Math.random() < 0.12) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = H * 0.6 + Math.random() * H * 0.3;
          p.vx = (Math.random() - 0.5) * 0.2; p.vy = -0.05 - Math.random() * 0.05;
          p.life = 8; p.ml = 8; p.sz = 35 + Math.random() * 40;
          p.r = 230; p.g = 235; p.b = 245; p.a = 0.05; p.tp = 1;
        }
      }

      if (t > 4.0 && t < 10.5 && Math.random() < 0.15) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = H + 10;
          p.vx = (Math.random() - 0.5) * 0.5; p.vy = -0.4 - Math.random() * 0.7;
          p.life = 6; p.ml = 6; p.sz = 2.0 + Math.random() * 3.5;
          p.r = 255; p.g = 215; p.b = 0; p.a = 0.3; p.tp = 5;
        }
      }

      // टेक्स्ट प्रकटीकरण से पहले छोटे चमकीले कण (Sparkles)
      if (t >= 14.0 && t < 14.5) {
        for (let i = 0; i < 2; i++) {
          const p = grab(pl); if (p) {
            p.on = true;
            p.x = Math.random() * W;
            p.y = -10 - Math.random() * 20;
            p.vx = (Math.random() - 0.5) * 0.3;
            p.vy = 1.5 + Math.random() * 2.5;
            p.life = 2.5; p.ml = 2.5;
            p.sz = 1.0 + Math.random() * 1.5;
            if (Math.random() < 0.6) {
              p.r = 255; p.g = 230; p.b = 180; p.a = 0.7;
            } else {
              p.r = 255; p.g = 255; p.b = 255; p.a = 0.5;
            }
            p.tp = 8;
          }
        }
      }

      if (t >= 5.5 && t < 11.5) {
        for (let i = 0; i < 1; i++) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = Math.random() * W; p.y = -20 - Math.random() * 30;
            p.vx = (Math.random() - 0.5) * 0.2; p.vy = 1.8 + Math.random() * 1.8;
            p.life = 6; p.ml = 6; p.sz = 5 + Math.random() * 4;
            p.rot = Math.random() * Math.PI * 2; p.rs = (Math.random() - 0.5) * 0.08;
            const rand = Math.random();
            if (rand < 0.34) { p.r = 255; p.g = 153; p.b = 51; }
            else if (rand < 0.67) { p.r = 255; p.g = 255; p.b = 255; }
            else { p.r = 19; p.g = 136; p.b = 8; }
            p.a = 0.9; p.tp = 2;
          }
        }
      }

      if (t > 2.0 && Math.random() < 0.25) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = W * 0.5 + (Math.random() - 0.5) * 15; p.y = baseY - 36;
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
          p.vy += 0.050; p.vy *= 0.980;
          p.vx = p.vx * 0.92 + Math.sin(elapsed * 0.6 + p.y * 0.015) * 0.015;
          p.x += p.vx; p.y += p.vy; p.rot += p.rs;
        } else if (p.tp === 5) {
          p.vy *= 0.99;
          p.vx = p.vx * 0.95 + noise.n2(elapsed * 0.5 + p.y * 0.01, p.turbOff) * 0.15;
          p.x += p.vx; p.y += p.vy;
        } else if (p.tp === 7) {
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.8;
          p.vx *= 0.97;
          p.vy *= 0.97;
        } else if (p.tp === 8) {
          p.vx = p.vx * 0.98 + Math.sin(elapsed * 2 + p.y * 0.02) * 0.3;
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
        if (p.tp === 0) {
          // Stars — drawn separately in renderer.stars
        } else if (p.tp === 4) {
          c.globalCompositeOperation = 'screen';
          const smokeGrad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
          smokeGrad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.35)`);
          smokeGrad.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = smokeGrad; c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 2) {
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2);
        } else if (p.tp === 3) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 5) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(255,215,0,${alpha})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 7) {
          c.globalCompositeOperation = 'lighter';
          const glow = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz * 2);
          glow.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha})`);
          glow.addColorStop(0.4, `rgba(${p.r},${p.g},${p.b},${alpha * 0.4})`);
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = glow;
          c.beginPath(); c.arc(p.x, p.y, p.sz * 2, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 8) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 1) {
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }
    };

    /* ═══════════════════════════════════════════════════════════
       MAIN LOOP — टाइमिंग सिंक और फेड-आउट का क्रियान्वयन
       ═══════════════════════════════════════════════════════════ */
    let lastTs = 0;
    let fwTimer = 0;
    const loop = (ts: number) => {
      if (!t0.current) { t0.current = ts; lastTs = ts; }
      const elapsed = (ts - t0.current) / 1000;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      const t = elapsed;

      // ★★★ टाइमिंग सुधारी गई: 13.0s से 14.5s के बीच इंडिया गेट फेड-आउट हो जाएगा
      const sceneAlpha = t < 13.0 ? 1 : clamp(1 - (t - 13.0) * 0.66, 0, 1);

      // कैमरा शेक
      let shakeX = 0, shakeY = 0;
      if (cameraShake > 0.1) {
        shakeX = (Math.random() - 0.5) * cameraShake * 2;
        shakeY = (Math.random() - 0.5) * cameraShake * 2;
        cameraShake *= 0.92;
      } else {
        cameraShake = 0;
      }

      c.save();
      c.translate(shakeX, shakeY);

      // बैकग्राउंड क्लियर
      c.fillStyle = '#000';
      c.fillRect(-10, -10, W + 20, H + 20);

      // परतों को रेंडर करें (Render Layers)
      renderer.sky(t, sceneAlpha);
      renderer.stars(t, sceneAlpha);
      renderer.horizonGlow(t, sceneAlpha);
      renderer.ground(t, sceneAlpha);
      renderer.indiaGate(t, sceneAlpha);
      renderer.torch(t, elapsed, sceneAlpha);
      renderer.wavingFlagAndChakra(t, elapsed, sceneAlpha);
      renderer.jetsAndTrails(t, sceneAlpha);
      renderer.doves(t, elapsed, sceneAlpha);
      
      // टेक्स्ट रेंडरिंग (14.5s से शुरू होगी जब गेट ओझल हो चुका होगा)
      renderer.typography(t, elapsed);
      renderer.fireworks(sceneAlpha);
      drawParticles();

      // स्पॉन पार्टिकल्स
      spawnParticles(t, elapsed);
      updateParticles(dt, elapsed);

      // 11.0s के बाद से हल्की आतिशबाजी शुरू होती है जो टेक्स्ट तक चलती है
      if (t >= 11.0) {
        fwTimer += dt;
        if (fwTimer > 0.4) {
          fwTimer = 0;
          spawnFirework();
          if (t >= 14.5 && Math.random() < 0.5) spawnFirework(); 
        }
      }
      updateFireworks(dt);

      // फिल्म ग्रेन ओवरले
      c.save();
      c.globalAlpha = 0.04;
      c.globalCompositeOperation = 'overlay';
      const grainPat = c.createPattern(grainCv, 'repeat');
      if (grainPat) {
        c.fillStyle = grainPat;
        c.fillRect(0, 0, W, H);
      }
      c.restore();

      // विग्नेट (Vignette)
      c.save();
      const vigGrad = c.createRadialGradient(cx, H * 0.5, W * 0.25, cx, H * 0.5, W * 0.75);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
      c.fillStyle = vigGrad;
      c.fillRect(0, 0, W, H);
      c.restore();

      // समाप्ति पर अंतिम फेड-टू-ब्लैक
      if (t > DUR - 1.0) {
        const fadeAlpha = clamp((t - (DUR - 1.0)) / 1.0, 0, 1);
        c.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        c.fillRect(-10, -10, W + 20, H + 20);
      }

      c.restore();

      // कम्प्लीशन चेक
      if (t >= DUR && !done.current) {
        done.current = true;
        if (cbR.current) cbR.current();
      }

      if (t < DUR + 0.5) {
        raf.current = requestAnimationFrame(loop);
      }
    };

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [mkPool, grab, triggerMilitaryAudio]);

  return (
    <canvas
      ref={cvRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        cursor: 'default',
        zIndex: 9999,
      }}
    />
  );
}
