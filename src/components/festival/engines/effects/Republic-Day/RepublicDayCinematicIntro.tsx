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

const POOL_SIZE = 5000;
const DUR = 16.0;

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
      gateH = sc * 0.66;
      gateW = gateH * 0.84;
      baseY = H * 0.82;
      cx = W * 0.5;
      pillarH = gateH * 0.72;

      /* FIX: Birds को gate के ऊपर cornice पर बिठाओ */
      pillarY = baseY - gateH * 0.90;

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
      for (let i = 0; i < 8; i++) {
        birds.push({
          x: cx - gateW * 0.44 + (gateW * 0.16) * (i / 7),
          y: pillarY - 4, vx: 0, vy: 0,
          wing: Math.random() * Math.PI * 2, state: 'sitting', side: 'left',
          noiseSeed: Math.random() * 1000, bank: 0
        });
      }
      for (let i = 0; i < 8; i++) {
        birds.push({
          x: cx + gateW * 0.28 + (gateW * 0.16) * (i / 7),
          y: pillarY - 4, vx: 0, vy: 0,
          wing: Math.random() * Math.PI * 2, state: 'sitting', side: 'right',
          noiseSeed: Math.random() * 1000, bank: 0
        });
      }
    };
    rsz();
    window.addEventListener('resize', rsz);

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
        x: W * 0.25 + Math.random() * W * 0.5, y: H,
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

    /* ═══════════════════════════════════════════════════════════
       drawSun — REMOVED (यही गोला और सूरज बना रहा था)
       ═══════════════════════════════════════════════════════════ */

    const renderer = {
      sky: (t: number, sceneAlpha: number) => {
        c.save();
        c.globalAlpha = sceneAlpha;
        const grad = c.createLinearGradient(0, 0, 0, H);

        if (t < 3.5) {
          const interp = clamp(t / 3.5, 0, 1);
          const r1 = lerp(4, 20, interp), g1 = lerp(6, 32, interp), b1 = lerp(18, 62, interp);
          const r2 = lerp(8, 48, interp), g2 = lerp(12, 40, interp), b2 = lerp(32, 90, interp);
          grad.addColorStop(0, `rgb(${r1 | 0}, ${g1 | 0}, ${b1 | 0})`);
          grad.addColorStop(1, `rgb(${r2 | 0}, ${g2 | 0}, ${b2 | 0})`);
        } else if (t < 7.5) {
          const interp = clamp((t - 3.5) / 4.0, 0, 1);
          const r1 = lerp(20, 50, interp), g1 = lerp(32, 35, interp), b1 = lerp(62, 75, interp);
          const r2 = lerp(48, 120, interp), g2 = lerp(40, 60, interp), b2 = lerp(90, 85, interp);
          grad.addColorStop(0, `rgb(${r1 | 0}, ${g1 | 0}, ${b1 | 0})`);
          grad.addColorStop(0.7, `rgb(${(r2*0.6) | 0}, ${(g2*0.7) | 0}, ${(b2*1.1) | 0})`);
          grad.addColorStop(1, `rgb(${r2 | 0}, ${g2 | 0}, ${b2 | 0})`);
        } else if (t < 11.5) {
          const interp = clamp((t - 7.5) / 4.0, 0, 1);
          const r1 = lerp(50, 90, interp), g1 = lerp(35, 80, interp), b1 = lerp(75, 120, interp);
          const r2 = lerp(120, 150, interp), g2 = lerp(60, 100, interp), b2 = lerp(85, 110, interp);
          grad.addColorStop(0, `rgb(${r1 | 0}, ${g1 | 0}, ${b1 | 0})`);
          grad.addColorStop(0.7, `rgb(${(r2*0.7) | 0}, ${(g2*0.8) | 0}, ${(b2*1.05) | 0})`);
          grad.addColorStop(1, `rgb(${r2 | 0}, ${g2 | 0}, ${b2 | 0})`);
        } else {
          const interp = clamp((t - 11.5) / 4.5, 0, 1);
          const r1 = lerp(90, 14, interp), g1 = lerp(80, 30, interp), b1 = lerp(120, 85, interp);
          const r2 = lerp(150, 32, interp), g2 = lerp(100, 54, interp), b2 = lerp(110, 140, interp);
          grad.addColorStop(0, `rgb(${r1 | 0}, ${g1 | 0}, ${b1 | 0})`);
          grad.addColorStop(1, `rgb(${r2 | 0}, ${g2 | 0}, ${b2 | 0})`);
        }

        c.fillStyle = grad;
        c.fillRect(0, 0, W, H);
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
            c.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a * twinkle})`;
            c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
          }
        }
        c.restore();
      },

      /* ═══════════════════════════════════════════════════════════
         INDIA GATE — COMPLETE REWRITE with realistic details
         ═══════════════════════════════════════════════════════════ */
      indiaGate: (t: number, sceneAlpha: number) => {
        const reveal = clamp((t - 0.8) * 0.4, 0, 1);
        c.save();
        c.globalAlpha = reveal * sceneAlpha;

        // ── Sandstone Color Palette ──
        const S  = '#c4885e';
        const SL = '#d9a87a';
        const SD = '#a06a42';
        const SV = '#7a4e30';
        const HI = '#eaccad';
        const SH = '#5a3420';
        const DS = '#2a1508';
        const AI = '#1a0e05';

        // ── Key Coordinates ──
        const L  = cx - gateW / 2;
        const R  = cx + gateW / 2;
        const B  = baseY;
        const MX = cx;
        const pW = gateW * 0.19; // pillar width

        // ── Helpers ──
        const blk = (x: number, y: number, w: number, h: number) => {
          const g = c.createLinearGradient(x, y, x, y + h);
          g.addColorStop(0, HI);
          g.addColorStop(0.06, SL);
          g.addColorStop(0.35, S);
          g.addColorStop(0.88, SD);
          g.addColorStop(1, SH);
          c.fillStyle = g;
          c.fillRect(x, y, w, h);
        };

        const crn = (x: number, y: number, w: number, h: number) => {
          blk(x, y, w, h);
          c.fillStyle = HI;  c.fillRect(x, y, w, 1.5);
          c.fillStyle = SD;  c.fillRect(x, y + 2, w, 0.8);
          c.fillStyle = SV;  c.fillRect(x, y + h - 2, w, 0.8);
          c.fillStyle = DS;  c.fillRect(x, y + h - 1, w, 1);
        };

        // ── Vertical Section Heights ──
        const ht = {
          steps:  gateH * 0.050,
          base:   gateH * 0.065,
          lower:  gateH * 0.220,
          arch:   gateH * 0.360,
          crn1:   gateH * 0.040,
          upper:  gateH * 0.100,
          crn2:   gateH * 0.035,
          top:    gateH * 0.080,
          dome:   gateH * 0.050,
        };

        // ── Cumulative Y (bottom → top) ──
        let y = B;
        const Y: Record<string, number> = {};
        Y.sB = y; y -= ht.steps;
        Y.sT = y; y -= ht.base;
        Y.bT = y; y -= ht.lower;
        Y.lT = y; y -= ht.arch;
        Y.aT = y; y -= ht.crn1;
        Y.c1T = y; y -= ht.upper;
        Y.uT = y; y -= ht.crn2;
        Y.c2T = y; y -= ht.top;
        Y.tT = y; y -= ht.dome;
        Y.dT = y;

        // ═════════════════════════════════════════
        // 1. STEPS — 4 layers, progressively wider
        // ═════════════════════════════════════════
        for (let i = 0; i < 4; i++) {
          const ext = (4 - i) * gateW * 0.018;
          const sx = L - ext;
          const sw = gateW + ext * 2;
          const sy = Y.sB - i * (ht.steps / 4);
          const sh = ht.steps / 4 + 0.5;
          blk(sx, sy, sw, sh);
          c.fillStyle = HI; c.fillRect(sx, sy, sw, 1);
          c.fillStyle = DS; c.fillRect(sx, sy + sh - 0.5, sw, 0.5);
        }

        // ═════════════════════════════════════════
        // 2. BASE PLATFORM
        // ═════════════════════════════════════════
        blk(L, Y.bT, gateW, ht.base);
        c.fillStyle = HI; c.fillRect(L, Y.bT, gateW, 1.5);
        c.fillStyle = DS; c.fillRect(L, Y.bT + ht.base - 1, gateW, 1);
        // Base decorative line
        c.fillStyle = SD;
        c.fillRect(L + 4, Y.bT + ht.base * 0.45, gateW - 8, 1);

        // ═════════════════════════════════════════
        // 3. LOWER PILLARS
        // ═════════════════════════════════════════
        blk(L, Y.lT, pW, ht.lower);
        blk(R - pW, Y.lT, pW, ht.lower);

        // Thin wall between pillars at bottom
        const wL = L + pW;
        const wR = R - pW;
        blk(wL, Y.lT, wR - wL, ht.lower * 0.10);

        // Pillar horizontal lines (stone course marks)
        c.strokeStyle = 'rgba(90,52,32,0.22)';
        c.lineWidth = 0.6;
        for (let i = 1; i <= 6; i++) {
          const ly = Y.lT + i * (ht.lower / 7);
          [L, R - pW].forEach(px => {
            c.beginPath(); c.moveTo(px + 3, ly); c.lineTo(px + pW - 3, ly); c.stroke();
          });
        }

        // Pillar vertical fluting
        c.strokeStyle = 'rgba(90,52,32,0.10)';
        c.lineWidth = 0.5;
        for (let f = 1; f <= 3; f++) {
          const fx = (pW / 4) * f;
          [L + fx, R - pW + fx].forEach(fxx => {
            c.beginPath(); c.moveTo(fxx, Y.lT + 2); c.lineTo(fxx, Y.aT - 2); c.stroke();
          });
        }

        // Pillar edge highlights
        c.strokeStyle = 'rgba(234,204,173,0.25)';
        c.lineWidth = 1;
        [L + 1.5, R - pW + 1.5].forEach(ex => {
          c.beginPath(); c.moveTo(ex, Y.lT); c.lineTo(ex, Y.aT); c.stroke();
        });

        // ═════════════════════════════════════════
        // 4. ARCH SECTION — pillars continue up
        // ═════════════════════════════════════════
        blk(L, Y.aT, pW, ht.arch);
        blk(R - pW, Y.aT, pW, ht.arch);

        // Continue fluting up through arch section
        c.strokeStyle = 'rgba(90,52,32,0.10)';
        for (let f = 1; f <= 3; f++) {
          const fx = (pW / 4) * f;
          [L + fx, R - pW + fx].forEach(fxx => {
            c.beginPath(); c.moveTo(fxx, Y.aT + 2); c.lineTo(fxx, Y.aT + ht.arch - 2); c.stroke();
          });
        }

        // ── Pointed (Ogival) Arch Opening ──
        const aIW = (wR - wL) * 0.70;
        const aIL = MX - aIW / 2;
        const aIR = MX + aIW / 2;
        const aBot = Y.lT;
        const aPeak = Y.aT + ht.arch * 0.07;
        const aSpring = aBot - ht.arch * 0.04;

        c.beginPath();
        c.moveTo(aIL, aBot);
        c.lineTo(aIL, aSpring);
        // Left curve of pointed arch
        c.bezierCurveTo(
          aIL, aPeak + ht.arch * 0.20,
          MX - aIW * 0.10, aPeak,
          MX, aPeak
        );
        // Right curve of pointed arch
        c.bezierCurveTo(
          MX + aIW * 0.10, aPeak,
          aIR, aPeak + ht.arch * 0.20,
          aIR, aSpring
        );
        c.lineTo(aIR, aBot);
        c.closePath();

        // Dark interior
        c.fillStyle = AI;
        c.fill();

        // Interior depth gradient
        const ag = c.createLinearGradient(MX, aPeak, MX, aBot);
        ag.addColorStop(0, 'rgba(60,35,15,0.4)');
        ag.addColorStop(0.4, 'rgba(25,12,5,0.2)');
        ag.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = ag;
        c.fill();

        // Inner shadow glow (deep inside arch)
        const ag2 = c.createRadialGradient(MX, (aPeak + aBot) * 0.5, aIW * 0.05, MX, (aPeak + aBot) * 0.5, aIW * 0.55);
        ag2.addColorStop(0, 'rgba(0,0,0,0.15)');
        ag2.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = ag2;
        c.fill();

        // Arch border — double stroke for depth
        c.strokeStyle = DS;
        c.lineWidth = 3;
        c.stroke();
        c.strokeStyle = 'rgba(234,204,173,0.3)';
        c.lineWidth = 1;
        c.stroke();

        // Arch ke andar small recessed line (decorative inner border)
        c.beginPath();
        const inOff = 6;
        c.moveTo(aIL + inOff, aBot);
        c.lineTo(aIL + inOff, aSpring + inOff);
        c.bezierCurveTo(
          aIL + inOff, aPeak + ht.arch * 0.20 + inOff,
          MX - (aIW * 0.10 - inOff), aPeak + inOff * 0.5,
          MX, aPeak + inOff * 0.5
        );
        c.bezierCurveTo(
          MX + (aIW * 0.10 - inOff), aPeak + inOff * 0.5,
          aIR - inOff, aPeak + ht.arch * 0.20 + inOff,
          aIR - inOff, aSpring + inOff
        );
        c.lineTo(aIR - inOff, aBot);
        c.strokeStyle = 'rgba(90,52,32,0.15)';
        c.lineWidth = 0.8;
        c.stroke();

        // ═════════════════════════════════════════
        // 5. FIRST CORNICE BAND
        // ═════════════════════════════════════════
        const c1i = gateW * 0.02;
        crn(L + c1i, Y.c1T, gateW - c1i * 2, ht.crn1);

        // Small dentil/molding pattern on cornice
        c.fillStyle = 'rgba(90,52,32,0.15)';
        const dentilW = 6;
        const dentilGap = 4;
        for (let dx = L + c1i + 8; dx < R - c1i - 8; dx += dentilW + dentilGap) {
          c.fillRect(dx, Y.c1T + 2, dentilW, ht.crn1 * 0.4);
        }

        // ═════════════════════════════════════════
        // 6. UPPER WALL — "INDIA" inscription
        // ═════════════════════════════════════════
        const uI = gateW * 0.06;
        blk(L + uI, Y.uT, gateW - uI * 2, ht.upper);

        // Decorative border
        const brd = gateW * 0.14;
        c.strokeStyle = 'rgba(90,52,32,0.35)';
        c.lineWidth = 1.2;
        c.strokeRect(L + brd, Y.uT + ht.upper * 0.12, gateW - brd * 2, ht.upper * 0.76);

        // Inner border
        c.strokeStyle = 'rgba(90,52,32,0.18)';
        c.lineWidth = 0.6;
        c.strokeRect(L + brd + 3, Y.uT + ht.upper * 0.12 + 3, gateW - brd * 2 - 6, ht.upper * 0.76 - 6);

        // "INDIA" text
        const tSz = Math.min(gateW * 0.075, 28);
        c.save();
        c.font = `700 ${tSz}px 'Cinzel', 'Playfair Display', Georgia, serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        // Shadow
        c.fillStyle = DS;
        c.fillText('INDIA', MX + 1.5, Y.uT + ht.upper / 2 + 1.5);
        // Main text
        c.fillStyle = SD;
        c.fillText('INDIA', MX, Y.uT + ht.upper / 2);
        c.restore();

        // Decorative lines above/below text
        c.strokeStyle = SH;
        c.lineWidth = 0.8;
        const lnW = gateW * 0.18;
        c.beginPath(); c.moveTo(MX - lnW, Y.uT + ht.upper * 0.10); c.lineTo(MX + lnW, Y.uT + ht.upper * 0.10); c.stroke();
        c.beginPath(); c.moveTo(MX - lnW, Y.uT + ht.upper * 0.90); c.lineTo(MX + lnW, Y.uT + ht.upper * 0.90); c.stroke();

        // Small diamond ornaments on the lines
        [MX - lnW - 4, MX + lnW + 4].forEach(ox => {
          [Y.uT + ht.upper * 0.10, Y.uT + ht.upper * 0.90].forEach(oy => {
            c.fillStyle = SD;
            c.beginPath();
            c.moveTo(ox, oy - 3); c.lineTo(ox + 3, oy);
            c.lineTo(ox, oy + 3); c.lineTo(ox - 3, oy);
            c.closePath(); c.fill();
          });
        });

        // ═════════════════════════════════════════
        // 7. SECOND CORNICE BAND
        // ═════════════════════════════════════════
        const c2i = gateW * 0.04;
        crn(L + c2i, Y.c2T, gateW - c2i * 2, ht.crn2);

        // ═════════════════════════════════════════
        // 8. TOP SECTION
        // ═════════════════════════════════════════
        const tI = gateW * 0.14;
        blk(L + tI, Y.tT, gateW - tI * 2, ht.top);

        // Small decorative arches on top section
        const smAW = gateW * 0.055;
        const smAY = Y.tT + ht.top * 0.40;
        c.strokeStyle = SH;
        c.lineWidth = 1.2;
        // Left small arch
        c.beginPath();
        c.arc(L + tI + smAW + 2, smAY, smAW, Math.PI, 0);
        c.stroke();
        // Right small arch
        c.beginPath();
        c.arc(R - tI - smAW - 2, smAY, smAW, Math.PI, 0);
        c.stroke();
        // Center small arch (slightly bigger)
        const csmAW = gateW * 0.045;
        c.beginPath();
        c.arc(MX, smAY - 2, csmAW, Math.PI, 0);
        c.stroke();

        // Horizontal line on top section
        c.strokeStyle = 'rgba(90,52,32,0.15)';
        c.lineWidth = 0.5;
        c.beginPath(); c.moveTo(L + tI + 4, Y.tT + ht.top * 0.15); c.lineTo(R - tI - 4, Y.tT + ht.top * 0.15); c.stroke();

        // ═════════════════════════════════════════
        // 9. DOME (Chhatri)
        // ═════════════════════════════════════════
        const dW = gateW * 0.10;
        const dH = ht.dome;
        const dY = Y.dT + dH;

        c.beginPath();
        c.moveTo(MX - dW, dY);
        c.quadraticCurveTo(MX - dW, dY - dH * 1.3, MX, dY - dH * 1.3);
        c.quadraticCurveTo(MX + dW, dY - dH * 1.3, MX + dW, dY);
        c.closePath();
        const dg = c.createLinearGradient(MX - dW, dY - dH * 1.3, MX + dW, dY);
        dg.addColorStop(0, HI);
        dg.addColorStop(0.3, SL);
        dg.addColorStop(0.7, S);
        dg.addColorStop(1, SD);
        c.fillStyle = dg;
        c.fill();
        c.strokeStyle = SH;
        c.lineWidth = 1.2;
        c.stroke();

        // Dome highlight line
        c.strokeStyle = 'rgba(234,204,173,0.3)';
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(MX - dW * 0.3, dY - dH * 1.1);
        c.quadraticCurveTo(MX, dY - dH * 1.35, MX + dW * 0.3, dY - dH * 1.1);
        c.stroke();

        // Finial (कलश) on top
        c.fillStyle = SD;
        c.beginPath();
        c.moveTo(MX - 3, dY - dH * 1.3);
        c.lineTo(MX, dY - dH * 1.3 - 10);
        c.lineTo(MX + 3, dY - dH * 1.3);
        c.closePath();
        c.fill();
        c.beginPath();
        c.arc(MX, dY - dH * 1.3 - 12, 3, 0, Math.PI * 2);
        c.fill();
        // Finial highlight
        c.fillStyle = SL;
        c.beginPath();
        c.arc(MX - 1, dY - dH * 1.3 - 13, 1, 0, Math.PI * 2);
        c.fill();

        // ═════════════════════════════════════════
        // 10. GROUND SHADOW (elliptical)
        // ═════════════════════════════════════════
        c.fillStyle = 'rgba(0,0,0,0.12)';
        c.beginPath();
        c.ellipse(MX, B + 4, gateW * 0.60, 6, 0, 0, Math.PI * 2);
        c.fill();

        // ═════════════════════════════════════════
        // 11. AMAR JAWAN JYOTI basin at bottom center
        // ═════════════════════════════════════════
        const bjW = gateW * 0.08;
        const bjH = gateH * 0.025;
        const bjX = MX - bjW / 2;
        const bjY = B + 1;
        const bjGrad = c.createLinearGradient(bjX, bjY, bjX, bjY + bjH);
        bjGrad.addColorStop(0, SD);
        bjGrad.addColorStop(1, SV);
        c.fillStyle = bjGrad;
        c.beginPath();
        c.ellipse(MX, bjY + bjH / 2, bjW / 2, bjH / 2, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = SH;
        c.lineWidth = 0.8;
        c.stroke();

        c.restore();
      },

      torch: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 2.0) return;
        const tx = W * 0.5, ty = H * 0.795;
        const fireAlpha = clamp((t - 2.0) * 1.5, 0, 1) * sceneAlpha;
        c.save(); c.globalAlpha = fireAlpha; c.globalCompositeOperation = 'lighter';

        const glowGrad = c.createRadialGradient(tx, ty, 0, tx, ty, 40);
        glowGrad.addColorStop(0, 'rgba(255, 120, 20, 0.25)');
        glowGrad.addColorStop(0.5, 'rgba(255, 60, 5, 0.08)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        c.fillStyle = glowGrad;
        c.fillRect(tx - 40, ty - 40, 80, 80);

        const flicker = Math.sin(elapsed * 32) * 4;
        const flameH = 38 + flicker, flameW = 10;
        const fireGrad = c.createLinearGradient(tx, ty, tx, ty - flameH);
        fireGrad.addColorStop(0, '#ffffff');
        fireGrad.addColorStop(0.2, 'rgba(255, 210, 80, 0.95)');
        fireGrad.addColorStop(0.6, 'rgba(255, 120, 20, 0.6)');
        fireGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
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
        const scVal = Math.min(W, H);
        const fw = scVal * 0.38, fh = fw * 0.66;
        const fx = W * 0.5 - fw / 2, fy = H * 0.44 - fh / 2;

        if (flagNodes[0].x === 0) {
          for (let i = 0; i < numPoints; i++) {
            flagNodes[i].x = fx + (i * fw) / (numPoints - 1);
            flagNodes[i].y = fy;
            flagNodes[i].ox = flagNodes[i].x;
            flagNodes[i].oy = flagNodes[i].y;
          }
        }

        for (let i = 1; i < numPoints; i++) {
          const wind = 0.22 + noise.n2(elapsed * 0.8 + i * 0.15, 0) * 0.18;
          const gravity = 0.08;
          flagNodes[i].vx = (flagNodes[i].x - flagNodes[i].ox) * 0.94 + wind;
          flagNodes[i].vy = (flagNodes[i].y - flagNodes[i].oy) * 0.94 + gravity;
          flagNodes[i].ox = flagNodes[i].x; flagNodes[i].oy = flagNodes[i].y;
          flagNodes[i].x += flagNodes[i].vx; flagNodes[i].y += flagNodes[i].vy;
        }
        flagNodes[0].x = fx; flagNodes[0].y = fy;

        const linkLength = fw / (numPoints - 1);
        for (let steps = 0; steps < 4; steps++) {
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
        c.strokeStyle = 'rgba(0, 0, 128, 1)'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(0, 0, cr, 0, Math.PI * 2); c.stroke();
        c.lineWidth = 1.2;
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * Math.PI * 2;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang) * cr, Math.sin(ang) * cr); c.stroke();
        }
        c.restore(); c.restore();
      },

      /* ═══════════════════════════════════════════════════════════
         volumetricLighting — REMOVED (gate के पीछे glow बना रहा था)
         ═══════════════════════════════════════════════════════════ */

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
          c.save();
          c.translate(jet.x, jet.y);
          c.rotate(Math.atan2(jet.vy, jet.vx));
          c.scale(jet.scale, jet.scale);
          c.fillStyle = '#1c1c1c';
          c.beginPath();
          c.moveTo(35, 0); c.lineTo(15, -4); c.lineTo(2, -18);
          c.lineTo(-10, -28); c.lineTo(-14, -28); c.lineTo(-12, -4);
          c.lineTo(-24, -3); c.lineTo(-28, -8); c.lineTo(-32, -8);
          c.lineTo(-30, 0); c.lineTo(-32, 8); c.lineTo(-28, 8);
          c.lineTo(-24, 3); c.lineTo(-12, 4); c.lineTo(-14, 28);
          c.lineTo(-10, 28); c.lineTo(2, 18); c.lineTo(15, 4);
          c.closePath(); c.fill();
          c.restore();
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
          c.save();
          c.translate(b.x, b.y);
          c.rotate(b.state === 'flying' ? Math.atan2(b.vy, b.vx) + b.bank : 0);
          const scale = 0.52; c.scale(scale, scale);
          if (b.state === 'flying') {
            const wingFactor = Math.sin(b.wing);
            c.fillStyle = '#d8d8d8';
            c.beginPath(); c.moveTo(-15, 0); c.lineTo(-26, -5 + wingFactor * 2); c.lineTo(-26, 5 - wingFactor * 2); c.closePath(); c.fill();
            c.fillStyle = '#ffffff';
            c.beginPath(); c.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#ffffff';
            c.beginPath(); c.arc(13, -2, 4, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#e29b3c';
            c.beginPath(); c.moveTo(16, -3); c.lineTo(21, -2); c.lineTo(15, -1); c.closePath(); c.fill();
            [-1, 1].forEach(side => {
              c.save(); c.scale(1, side);
              c.rotate(wingFactor * 0.5 - 0.15);
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

      typography: (t: number) => {
        if (t < 11.5) return;
        const titleY = lerp(H * 0.58, H * 0.44, eOE((t - 11.5) * 0.5));
        c.save();
        const fontSize = Math.min(W * 0.065, 52);
        c.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;
        const title = "HAPPY REPUBLIC DAY";
        const totalW = c.measureText(title).width;
        let xOff = W * 0.5 - totalW * 0.5;
        for (let i = 0; i < title.length; i++) {
          const charW = c.measureText(title[i]).width;
          const charT = clamp((t - 11.5 - i * 0.035) / 0.4, 0, 1);
          const charY = titleY + (1 - eOB(charT)) * -15;
          c.save(); c.globalAlpha = eOC(charT);
          c.fillStyle = 'rgba(0,0,0,0.92)';
          c.fillText(title[i], xOff + 2, charY + 2);
          const sweepGrad = c.createLinearGradient(xOff, charY - fontSize * 0.5, xOff, charY + fontSize * 0.38);
          sweepGrad.addColorStop(0, '#FF9933');
          sweepGrad.addColorStop(0.48, '#FFFFFF');
          sweepGrad.addColorStop(0.52, '#FFFFFF');
          sweepGrad.addColorStop(1, '#138808');
          c.fillStyle = sweepGrad;
          c.fillText(title[i], xOff, charY);
          c.restore();
          xOff += charW;
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
              fGrad.addColorStop(0, `rgba(${fw.col.r}, ${fw.col.g}, ${fw.col.b}, ${alpha})`);
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
       PARTICLES — tp=6 (solar streaks) REMOVED
       ═══════════════════════════════════════════════════════════ */
    const spawnParticles = (t: number, elapsed: number) => {
      // Fog Dust
      if (Math.random() < 0.12) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = H * 0.6 + Math.random() * H * 0.3;
          p.vx = (Math.random() - 0.5) * 0.2; p.vy = -0.05 - Math.random() * 0.05;
          p.life = 8; p.ml = 8; p.sz = 35 + Math.random() * 40;
          p.r = 230; p.g = 235; p.b = 245; p.a = 0.05; p.tp = 1;
        }
      }

      // Gold Dust
      if (t > 4.0 && Math.random() < 0.06) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = H + 10;
          p.vx = (Math.random() - 0.5) * 0.5; p.vy = -0.4 - Math.random() * 0.7;
          p.life = 6; p.ml = 6; p.sz = 2.0 + Math.random() * 3.5;
          p.r = 255; p.g = 215; p.b = 0; p.a = 0.25; p.tp = 5;
        }
      }

      // tp=6 REMOVED — solar particles jo gate se golden streaks bana rahe the

      // Confetti
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

      // Torch Embers
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
          p.x += p.vx; p.y += p.vy;
          p.sz += 0.45; p.vx *= 0.985; p.vy *= 0.985;
        } else if (p.tp === 2) {
          p.vy += 0.050; p.vy *= 0.980;
          p.vx = p.vx * 0.92 + Math.sin(elapsed * 0.6 + p.y * 0.015) * 0.015;
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
        if (p.tp === 4) {
          c.globalCompositeOperation = 'screen';
          const smokeGrad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
          smokeGrad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.35)`);
          smokeGrad.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = smokeGrad;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 2) {
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2);
        } else if (p.tp === 5) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(255, 215, 0, ${alpha})`;
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
      c.globalAlpha = 0.015;
      c.drawImage(cv, -1.5, 0, W, H);
      c.globalAlpha = 0.012;
      c.drawImage(cv, 1.5, 0, W, H);
      c.restore();
    };

    const drawPostFX = () => {
      c.save(); c.globalCompositeOperation = 'soft-light';
      const grade = c.createLinearGradient(0, 0, W, H);
      grade.addColorStop(0, 'rgba(255, 140, 50, 0.03)');
      grade.addColorStop(1, 'rgba(0, 50, 100, 0.08)');
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
      const camDollyZ = lerp(1.0, 1.10, eOE(t / DUR));
      const breatheX = Math.sin(t * 0.4) * 2 + (Math.random() - 0.5) * cameraShake;
      const breatheY = Math.cos(t * 0.3) * 1.5 + (Math.random() - 0.5) * cameraShake;
      const camRot = Math.sin(t * 0.15) * 0.003;

      c.save();
      c.translate(W / 2 + breatheX, H / 2 + breatheY);
      c.rotate(camRot); c.scale(camDollyZ, camDollyZ);
      c.translate(-W / 2, -H / 2);

      const sceneAlpha = t < 11.5 ? 1 : clamp(1 - (t - 11.5) * 1.8, 0, 1);

      renderer.sky(t, sceneAlpha);
      // drawSun — REMOVED (गोला + सूरज हटाया)
      renderer.stars(t, sceneAlpha);
      renderer.wavingFlagAndChakra(t, now / 1000, sceneAlpha);
      renderer.indiaGate(t, sceneAlpha);
      // volumetricLighting — REMOVED (gate पीछे glow हटाया)
      renderer.torch(t, now / 1000, sceneAlpha);
      renderer.jetsAndTrails(t, sceneAlpha);
      drawParticles();
      renderer.fireworks(sceneAlpha);
      renderer.doves(t, now / 1000, sceneAlpha);

      c.restore();

      if (t >= 11.5) {
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
