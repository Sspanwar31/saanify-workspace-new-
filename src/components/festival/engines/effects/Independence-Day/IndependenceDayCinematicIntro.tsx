'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void; imageUrl?: string; }

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; ml: number; sz: number;
  r: number; g: number; b: number; a: number;
  tp: number; rot: number; rs: number; on: boolean; turbOff: number;
  prevX?: number; prevY?: number;
}

interface Kite {
  x: number; y: number; base_x: number; base_y: number;
  scale: number; angle: number; swaySpeed: number; swayAmp: number;
  tailPhase: number; driftX: number;
}

interface BoidBird {
  x: number; y: number; vx: number; vy: number; wing: number;
  state: 'sitting' | 'flying'; side: 'left' | 'right';
  noiseSeed: number; bank: number;
}

interface Firework {
  x: number; y: number; vy: number;
  state: 'rising' | 'burst' | 'secondary'; burstT: number; secondaryT: number;
  col: { r: number; g: number; b: number };
  pts: { x: number; y: number; vx: number; vy: number; life: number; ml: number; sz: number }[];
}

interface CloudPuff { x: number; y: number; w: number; h: number; a: number; speed: number; noiseOff: number; }
interface FWSmoke { x: number; y: number; a: number; sz: number; vx: number; vy: number; }

const POOL = 5000;
const DUR = 19.0;

/* ═══════════════════════════════════════════════════════════════
   SIMPLEX NOISE
   ═══════════════════════════════════════════════════════════════ */
class SNoise {
  private p: Uint8Array;
  private g: number[][] = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  constructor(s: number = 42) {
    this.p = new Uint8Array(512);
    const a = new Uint8Array(256);
    for (let i = 0; i < 256; i++) a[i] = i;
    let v = s;
    for (let i = 255; i > 0; i--) { v = (v * 16807) % 2147483647; const j = v % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    for (let i = 0; i < 512; i++) this.p[i] = a[i & 255];
  }
  n2(x: number, y: number): number {
    const F = 0.5 * (Math.sqrt(3) - 1), G = (3 - Math.sqrt(3)) / 6;
    const s = (x + y) * F, i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G, x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G, y1 = y0 - j1 + G, x2 = x0 - 1 + 2 * G, y2 = y0 - 1 + 2 * G;
    const ii = i & 255, jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0, t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; const gi = this.p[ii + this.p[jj]] % 8; n0 = t0 * t0 * (this.g[gi][0] * x0 + this.g[gi][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; const gi = this.p[ii + i1 + this.p[jj + j1]] % 8; n1 = t1 * t1 * (this.g[gi][0] * x1 + this.g[gi][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; const gi = this.p[ii + 1 + this.p[jj + 1]] % 8; n2 = t2 * t2 * (this.g[gi][0] * x2 + this.g[gi][1] * y2); }
    return 70 * (n0 + n1 + n2);
  }
}

export default function IndependenceDayCinematicIntro({ onComplete, imageUrl }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const raf = useRef<number>(0);
  const t0 = useRef<number>(0);
  const done = useRef<boolean>(false);
  const cbR = useRef(onComplete);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgReady = useRef(false);
  cbR.current = onComplete;

  const mkPool = useCallback(() => {
    const a: Particle[] = [];
    for (let i = 0; i < POOL; i++) a.push({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, ml: 1, sz: 0,
      r: 255, g: 153, b: 51, a: 0, tp: 1, rot: 0, rs: 0,
      on: false, turbOff: Math.random() * 1000
    });
    return a;
  }, []);

  const grab = useCallback((p: Particle[]) => {
    for (let i = 0; i < p.length; i++) if (!p[i].on) return p[i];
    return null;
  }, []);

  const playAudio = useCallback(() => {
    try {
      if (!audioRef.current) return;
      const x = audioRef.current;
      if (x.state === 'suspended') x.resume();
      for (let b = 0; b < 8; b++) {
        const bt = x.currentTime + b * 0.4;
        const o = x.createOscillator(); const g = x.createGain();
        o.frequency.setValueAtTime(90, bt);
        o.frequency.exponentialRampToValueAtTime(20, bt + 0.22);
        g.gain.setValueAtTime(0.22, bt);
        g.gain.exponentialRampToValueAtTime(0.001, bt + 0.25);
        o.connect(g); g.connect(x.destination);
        o.start(bt); o.stop(bt + 0.25);
      }
    } catch (_) {}
  }, []);

  /* ═══════════════════════════════════════════════════════════
     MAIN CANVAS LIFECYCLE
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const cl = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
    const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const eOB = (t: number) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
    const eOBack = (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

    try {
      audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      playAudio();
    } catch (err) { console.warn("AudioContext failed:", err); }

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imgRef.current = img; imgReady.current = true; };
      img.src = imageUrl;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, sc = 0, cx = 0, baseY = 0, gateH = 0, gateW = 0;

    const noise = new SNoise(4822);
    const pl = mkPool();
    const numPts = 14;
    const fN: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < numPts; i++) fN.push({ x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0 });

    // ★ CLOTH FLAG SIMULATION SYSTEM
    const cfNumPts = 14;
    const cfPts: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < cfNumPts; i++) cfPts.push({ x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0 });

    // ★ HELIUM BALLOONS
    const balloons: { x: number; y: number; r: number; g: number; b: number; sz: number; swaySpeed: number; swayAmp: number; phase: number; seed: number; vy: number; born: number }[] = [];

    const starI: number[] = []; for (let i = 0; i < 120; i++) starI.push(i);
    const birds: BoidBird[] = [];
    const kites: Kite[] = [];
    const clouds: CloudPuff[] = [];
    const fwSmoke: FWSmoke[] = [];

    let fort = {
      wallL: 0, wallR: 0, wallTop: 0, wallBot: 0,
      archX: 0, archW: 0, archH: 0, archBot: 0,
      bastionL: { x: 0, w: 0, top: 0 }, bastionR: { x: 0, w: 0, top: 0 },
      merlonW: 0, merlonH: 0, merlonGap: 0,
      roofY: 0,
    };

    const stoneTexCv = document.createElement('canvas');
    stoneTexCv.width = 128; stoneTexCv.height = 128;
    const stCtx = stoneTexCv.getContext('2d')!;
    const stImg = stCtx.createImageData(128, 128);
    for (let py = 0; py < 128; py += 1) {
      for (let px = 0; px < 128; px += 1) {
        const n1 = noise.n2(px * 0.035, py * 0.035) * 0.5 + 0.5;
        const n2 = noise.n2(px * 0.08 + 50, py * 0.08 + 50) * 0.3 + 0.5;
        const n = n1 * 0.7 + n2 * 0.3;
        const idx = (py * 128 + px) * 4;
        stImg.data[idx] = (155 + n * 55) | 0;
        stImg.data[idx + 1] = (80 + n * 30) | 0;
        stImg.data[idx + 2] = (50 + n * 20) | 0;
        stImg.data[idx + 3] = 255;
      }
    }
    stCtx.putImageData(stImg, 0, 0);

    const rsz = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      sc = Math.min(W, H);
      gateH = sc * 0.42;
      gateW = gateH * 1.45;
      baseY = H * 0.82;
      cx = W * 0.5;

      const wallH = gateH * 0.68;
      const wallW = gateW * 0.96;
      const wallTop = baseY - wallH;
      const bastionW = wallW * 0.11;
      const bastionH = wallH * 1.12;
      const roofY = wallTop - Math.max(8, sc * 0.012);

      fort = {
        wallL: cx - wallW / 2, wallR: cx + wallW / 2,
        wallTop, wallBot: baseY,
        archX: cx, archW: wallW * 0.15, archH: wallH * 0.62, archBot: baseY,
        bastionL: { x: cx - wallW / 2 - bastionW * 0.3, w: bastionW, top: baseY - bastionH },
        bastionR: { x: cx + wallW / 2 - bastionW * 0.7, w: bastionW, top: baseY - bastionH },
        merlonW: Math.max(6, sc * 0.008), merlonH: Math.max(8, sc * 0.012), merlonGap: Math.max(5, sc * 0.007),
        roofY,
      };

      if (fN.length > 0) fN[0].x = 0;

      const centerY = H * 0.26;
      c.save();
      c.font = `bold ${Math.min(W * 0.045, 34)}px 'Georgia', serif`;
      const titleW = c.measureText('HAPPY INDEPENDENCE DAY').width;
      c.restore();

      const cfPoleX = cx - titleW / 2;
      const cfPoleTopY = centerY + 100;
      const cfPoleBotY = H * 0.85;
      const cfPoleH = cfPoleBotY - cfPoleTopY;
      const cfFlagW = Math.min(sc * 0.24, 250);
      const cfFlagTopY = cfPoleTopY + 8;
      const cfLl = cfFlagW / (cfNumPts - 1);

      for (let i = 0; i < cfNumPts; i++) {
        cfPts[i] = {
          x: cfPoleX + 2 + i * cfLl,
          y: cfFlagTopY,
          ox: cfPoleX + 2 + i * cfLl,
          oy: cfFlagTopY,
          vx: 0,
          vy: 0
        };
      }

      balloons.length = 0;

      for (let i = 0; i < starI.length; i++) {
        const p = pl[starI[i]];
        p.on = true; p.tp = 0;
        p.x = Math.random() * W; p.y = Math.random() * H * 0.6;
        p.sz = Math.random() * 1.0 + 0.2; p.ml = 999; p.life = 999;
        p.r = 255; p.g = 245; p.b = 200; p.a = Math.random() * 0.25 + 0.05;
      }

      kites.length = 0;
      [
        { bx: W * 0.12, by: H * 0.14, s: 1.0, ss: 1.1, sa: 28 },
        { bx: W * 0.24, by: H * 0.20, s: 0.8, ss: 1.5, sa: 20 },
        { bx: W * 0.76, by: H * 0.16, s: 0.9, ss: 1.0, sa: 24 },
        { bx: W * 0.88, by: H * 0.24, s: 0.72, ss: 1.4, sa: 16 },
        { bx: W * 0.40, by: H * 0.30, s: 0.6, ss: 1.8, sa: 12 },
        { bx: W * 0.62, by: H * 0.22, s: 0.65, ss: 1.3, sa: 14 },
      ].forEach(d => kites.push({
        x: d.bx, y: d.by, base_x: d.bx, base_y: d.by,
        scale: d.s, angle: 0, swaySpeed: d.ss, swayAmp: d.sa,
        tailPhase: Math.random() * 100, driftX: Math.random() * 1000,
      }));

      birds.length = 0;
      const bY = fort.bastionL.top - 6;
      for (let i = 0; i < 5; i++) {
        birds.push({ x: fort.bastionL.x + fort.bastionL.w * 0.3 + i * 5, y: bY, vx: 0, vy: 0, wing: Math.random() * 6.28, state: 'sitting', side: 'left', noiseSeed: Math.random() * 1000, bank: 0 });
        birds.push({ x: fort.bastionR.x + fort.bastionR.w * 0.3 + i * 5, y: bY, vx: 0, vy: 0, wing: Math.random() * 6.28, state: 'sitting', side: 'right', noiseSeed: Math.random() * 1000, bank: 0 });
      }

      clouds.length = 0;
      for (let i = 0; i < 6; i++) {
        clouds.push({
          x: Math.random() * W * 1.4 - W * 0.2,
          y: H * 0.08 + Math.random() * H * 0.25,
          w: 120 + Math.random() * 200, h: 20 + Math.random() * 30,
          a: 0.03 + Math.random() * 0.05, speed: 0.15 + Math.random() * 0.25,
          noiseOff: Math.random() * 1000,
        });
      }
    };
    rsz(); window.addEventListener('resize', rsz);

    const grainCv = document.createElement('canvas');
    grainCv.width = 256; grainCv.height = 256;
    const gc = grainCv.getContext('2d')!;
    const gd = gc.createImageData(256, 256);
    for (let i = 0; i < gd.data.length; i += 4) { const v = Math.random() * 255 | 0; gd.data[i] = v; gd.data[i + 1] = v; gd.data[i + 2] = v; gd.data[i + 3] = 255; }
    gc.putImageData(gd, 0, 0);

    let camShake = 0;
    const fwList: Firework[] = [];
    const fwCols = [{ r: 255, g: 153, b: 51 }, { r: 255, g: 255, b: 255 }, { r: 19, g: 136, b: 8 }, { r: 255, g: 215, b: 0 }, { r: 255, g: 100, b: 60 }];

    let celebrationCleaned = false;

    const drawRealisticSoldierSilhouette = (sx: number, sy: number, scale: number) => {
      c.save();
      c.translate(sx, sy);
      c.scale(scale, scale);
      c.fillStyle = '#02010c';

      c.beginPath();
      c.ellipse(0, 0, 16, 4, 0, 0, 6.283);
      c.fillStyle = 'rgba(0, 0, 0, 0.4)';
      c.fill();
      c.fillStyle = '#02010c';

      c.beginPath();
      c.moveTo(-4.5, 0);
      c.lineTo(-4, -13);
      c.lineTo(-2.2, -19);
      c.lineTo(2.2, -19);
      c.lineTo(4, -13);
      c.lineTo(4.5, 0);
      c.lineTo(2.2, 0);
      c.lineTo(1.8, -12);
      c.lineTo(-1.8, -12);
      c.lineTo(-2.2, 0);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(-5.5, -19);
      c.lineTo(-7.2, -40);
      c.quadraticCurveTo(-3, -42, 0, -42);
      c.quadraticCurveTo(3, -42, 7.2, -40);
      c.lineTo(5.5, -19);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(-7.2, -40);
      c.quadraticCurveTo(-11.5, -28, -9.5, -21);
      c.lineTo(-6.5, -21);
      c.quadraticCurveTo(-8.5, -28, -5.5, -38);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(7.2, -40);
      c.lineTo(13.5, -44);
      c.lineTo(6.5, -51);
      c.lineTo(4.2, -48);
      c.lineTo(9.5, -42);
      c.lineTo(5.5, -38);
      c.closePath();
      c.fill();

      c.beginPath();
      c.arc(0, -46, 3.8, 0, 6.283);
      c.fill();

      c.beginPath();
      c.arc(0, -47.8, 5.2, Math.PI - 0.2, 0.2);
      c.fill();
      c.lineWidth = 1;
      c.strokeStyle = '#02010c';
      c.beginPath();
      c.moveTo(-5.5, -47);
      c.lineTo(5.5, -47);
      c.stroke();

      c.beginPath();
      c.moveTo(-3.5, -24);
      c.lineTo(-12, -58);
      c.lineWidth = 1.5;
      c.strokeStyle = '#02010c';
      c.stroke();

      c.restore();
    };

    const spawnFW = () => {
      const col = fwCols[Math.random() * fwCols.length | 0];
      const targetX = W * 0.12 + Math.random() * W * 0.76;
      const velocityY = -6.5 - Math.random() * 5.5;
      fwList.push({
        x: targetX,
        y: baseY,
        vy: velocityY,
        state: 'rising', burstT: 0, secondaryT: 0, col, pts: []
      });
    };

    const updateFW = (dt: number) => {
      const burstH = H * 0.30;
      for (let i = fwList.length - 1; i >= 0; i--) {
        const fw = fwList[i];
        if (fw.state === 'rising') {
          if (Math.random() < 0.7) {
            fwSmoke.push({ x: fw.x + (Math.random() - 0.5) * 4, y: fw.y, a: 0.3, sz: 5 + Math.random() * 6, vx: (Math.random() - 0.5) * 0.4, vy: 0.3 + Math.random() * 0.4 });
          }
          fw.y += fw.vy; fw.vy += 0.035;
          if (fw.vy >= -1.0 || fw.y < burstH) {
            fw.state = 'burst';
            camShake = Math.min(camShake + 2.5, 6);
            for (let s = 0; s < 12; s++) {
              const sp = grab(pl); if (sp) {
                sp.on = true; sp.x = fw.x; sp.y = fw.y;
                const a = Math.random() * 6.283, spd = 2 + Math.random() * 2.5;
                sp.vx = Math.cos(a) * spd; sp.vy = Math.sin(a) * spd;
                sp.life = 0.8 + Math.random() * 0.6; sp.ml = 1.4;
                sp.sz = 0.8 + Math.random(); sp.r = 255; sp.g = 230; sp.b = 180;
                sp.a = 0.9; sp.tp = 6;
              }
            }
            const cnt = 55 + Math.random() * 40 | 0;
            const pat = Math.random();
            for (let j = 0; j < cnt; j++) {
              let ang: number, spd: number;
              if (pat < 0.3) { ang = (j / cnt) * 6.283; spd = 1.5 + Math.random() * 1.2; }
              else if (pat < 0.6) { ang = (j / cnt) * 6.283 + (Math.random() - 0.5) * 0.4; spd = 0.8 + Math.random() * 2.8; }
              else { ang = Math.random() * 6.283; spd = 0.5 + Math.random() * 3.5; }
              fw.pts.push({ x: fw.x, y: fw.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 2.5 + Math.random() * 2.0, ml: 4.5, sz: 1.5 + Math.random() * 2.5 });
            }
          }
        } else if (fw.state === 'burst') {
          fw.burstT += dt;
          for (let j = fw.pts.length - 1; j >= 0; j--) {
            const pt = fw.pts[j];
            pt.x += pt.vx; pt.y += pt.vy;
            pt.vy += 0.025; pt.vx *= 0.988; pt.vy *= 0.988; pt.life -= dt;
            if (pt.life <= 0) fw.pts.splice(j, 1);
          }
          if (fw.burstT > 0.8 && fw.state === 'burst' && Math.random() < 0.4) {
            fw.state = 'secondary';
            for (let j = 0; j < 20; j++) {
              const ang = Math.random() * 6.283, spd = 0.5 + Math.random() * 2;
              fw.pts.push({ x: fw.x + (Math.random() - 0.5) * 20, y: fw.y + (Math.random() - 0.5) * 20, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 1.5 + Math.random() * 1.0, ml: 2.5, sz: 1 + Math.random() * 1.5 });
            }
          }
          if (fw.pts.length === 0) fwList.splice(i, 1);
        } else {
          fw.secondaryT += dt;
          for (let j = fw.pts.length - 1; j >= 0; j--) {
            const pt = fw.pts[j];
            pt.x += pt.vx; pt.y += pt.vy;
            pt.vy += 0.03; pt.vx *= 0.98; pt.vy *= 0.98; pt.life -= dt;
            if (pt.life <= 0) fw.pts.splice(j, 1);
          }
          if (fw.pts.length === 0) fwList.splice(i, 1);
        }
      }
      for (let i = fwSmoke.length - 1; i >= 0; i--) {
        const s = fwSmoke[i];
        s.x += s.vx; s.y += s.vy; s.a -= 0.002; s.sz += 0.2;
        if (s.a <= 0) fwSmoke.splice(i, 1);
      }
    };

    const R = {
      sky: (t: number, sa: number) => {
        c.save(); c.globalAlpha = sa;
        const g = c.createLinearGradient(0, 0, 0, H);
        if (t < 5) {
          const p = cl(t / 5, 0, 1);
          g.addColorStop(0, `rgb(${lerp(8, 25, p) | 0},${lerp(12, 38, p) | 0},${lerp(45, 88, p) | 0})`);
          g.addColorStop(0.2, `rgb(${lerp(12, 40, p) | 0},${lerp(18, 48, p) | 0},${lerp(52, 92, p) | 0})`);
          g.addColorStop(0.4, `rgb(${lerp(25, 72, p) | 0},${lerp(28, 58, p) | 0},${lerp(60, 98, p) | 0})`);
          g.addColorStop(0.6, `rgb(${lerp(60, 165, p) | 0},${lerp(45, 98, p) | 0},${lerp(55, 58, p) | 0})`);
          g.addColorStop(0.78, `rgb(${lerp(100, 210, p) | 0},${lerp(65, 135, p) | 0},${lerp(45, 65, p) | 0})`);
          g.addColorStop(0.9, `rgb(${lerp(135, 235, p) | 0},${lerp(85, 155, p) | 0},${lerp(48, 75, p) | 0})`);
          g.addColorStop(1, `rgb(${lerp(150, 245, p) | 0},${lerp(95, 170, p) | 0},${lerp(52, 90, p) | 0})`);
        } else if (t < 12) {
          const p = cl((t - 5) / 7, 0, 1);
          g.addColorStop(0, `rgb(${lerp(25, 45, p) | 0},${lerp(38, 70, p) | 0},${lerp(88, 120, p) | 0})`);
          g.addColorStop(0.3, `rgb(${lerp(50, 100, p) | 0},${lerp(48, 80, p) | 0},${lerp(75, 95, p) | 0})`);
          g.addColorStop(0.55, `rgb(${lerp(80, 155, p) | 0},${lerp(65, 115, p) | 0},${lerp(60, 78, p) | 0})`);
          g.addColorStop(0.75, `rgb(${lerp(160, 225, p) | 0},${lerp(95, 145, p) | 0},${lerp(58, 72, p) | 0})`);
          g.addColorStop(1, `rgb(${lerp(220, 245, p) | 0},${lerp(140, 185, p) | 0},${lerp(70, 92, p) | 0})`);
        } else {
          const p = cl((t - 12) / 4, 0, 1);
          g.addColorStop(0, `rgb(${lerp(45, 8, p) | 0},${lerp(70, 14, p) | 0},${lerp(120, 50, p) | 0})`);
          g.addColorStop(1, `rgb(${lerp(245, 20, p) | 0},${lerp(185, 35, p) | 0},${lerp(92, 80, p) | 0})`);
        }
        c.fillStyle = g; c.fillRect(0, 0, W, H);

        if (t > 1.0 && t < 13) {
          const si = cl((t - 1.0) / 2.0, 0, 1) * cl((13 - t) / 1, 0, 1);
          const sunX = cx + W * 0.18, sunY = baseY - gateH * 0.2;
          c.save(); c.globalCompositeOperation = 'screen';
          c.globalAlpha = si * 0.18 * sa;
          const cr = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sc * 0.7);
          cr.addColorStop(0, 'rgba(255,210,110,0.35)'); cr.addColorStop(0.4, 'rgba(255,130,50,0.08)'); cr.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = cr; c.fillRect(sunX - sc * 0.7, sunY - sc * 0.7, sc * 1.4, sc * 1.4);
          c.globalAlpha = si * 0.35 * sa;
          const sg = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sc * 0.28);
          sg.addColorStop(0, 'rgba(255,245,210,0.8)'); sg.addColorStop(0.4, 'rgba(255,190,90,0.25)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = sg; c.fillRect(sunX - sc * 0.28, sunY - sc * 0.28, sc * 0.56, sc * 0.56);
          c.globalAlpha = si * 0.55 * sa;
          const sd = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sc * 0.045);
          sd.addColorStop(0, 'rgba(255,252,240,0.95)'); sd.addColorStop(1, 'rgba(255,225,170,0)');
          c.fillStyle = sd; c.beginPath(); c.arc(sunX, sunY, sc * 0.045, 0, 6.283); c.fill();
          c.restore();
        }
        c.restore();
      },

      stars: (t: number, sa: number) => {
        if (t > 5) return;
        const a = cl(1 - t / 5, 0, 1) * sa;
        c.save(); c.globalAlpha = a;
        for (const idx of starI) {
          const p = pl[idx]; if (!p?.on) continue;
          const tw = Math.sin(t * 3.2 + idx) * 0.35 + 0.65;
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * tw * 0.35})`; c.beginPath(); c.arc(p.x, p.y, p.sz * 2.5, 0, 6.283); c.fill();
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * tw})`; c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        }
        c.restore();
      },

      clouds: (t: number, sa: number) => {
        const a = cl(t * 0.5, 0, 1) * (t > 12 ? cl((13 - t), 0, 1) : 1) * sa;
        c.save(); c.globalAlpha = a;
        clouds.forEach(cl_ => {
          cl_.x += cl_.speed * 0.016;
          if (cl_.x > W + cl_.w) cl_.x = -cl_.w;
          const puffs = [
            { dx: 0, dy: 0, sw: 1.0, sh: 1.0 },
            { dx: -cl_.w * 0.28, dy: 4, sw: 0.38, sh: 0.45 },
            { dx: cl_.w * 0.32, dy: 2, sw: 0.32, sh: 0.38 },
            { dx: -cl_.w * 0.12, dy: -cl_.h * 0.3, sw: 0.25, sh: 0.3 },
            { dx: cl_.w * 0.15, dy: -cl_.h * 0.2, sw: 0.28, sh: 0.25 },
          ];
          puffs.forEach((pf, pi) => {
            const nv = noise.n2(t * 0.1 + cl_.noiseOff + pi, cl_.noiseOff + pi * 7) * 0.3 + 0.7;
            c.fillStyle = `rgba(255,225,195,${cl_.a * nv})`;
            c.beginPath();
            c.ellipse(cl_.x + pf.dx, cl_.y + pf.dy, cl_.w * pf.sw / 2, cl_.h * pf.sh / 2, 0, 0, 6.283);
            c.fill();
          });
        });
        c.restore();
      },

      atmosFog: (t: number, sa: number) => {
        const fi = cl(t * 0.4, 0, 1) * (t > 12 ? cl((13 - t) * 0.5, 0, 1) : 1) * sa;
        c.save();
        for (let i = 0; i < 6; i++) {
          const fy = baseY - 15 + i * 10;
          const fn = noise.n2(t * 0.12 + i * 3.7, i * 5.3) * 0.5 + 0.5;
          c.globalAlpha = fi * 0.035 * fn;
          c.fillStyle = '#c8b898';
          c.fillRect(0, fy, W, 14);
        }
        for (let i = 0; i < 4; i++) {
          const fx = ((noise.n2(t * 0.08 + i * 5.1, 0) * 0.5 + 0.5) * W * 1.3) - W * 0.15;
          const fy = baseY - 40 + noise.n2(0, t * 0.06 + i * 4) * 25;
          const fw = 180 + noise.n2(i * 3, t * 0.04) * 120;
          c.globalAlpha = fi * 0.025;
          const fg = c.createRadialGradient(fx, fy, 0, fx, fy, fw);
          fg.addColorStop(0, 'rgba(210,190,160,0.4)'); fg.addColorStop(1, 'rgba(210,190,160,0)');
          c.fillStyle = fg; c.fillRect(fx - fw, fy - fw * 0.3, fw * 2, fw * 0.6);
        }
        c.restore();
      },

      ground: (t: number, sa: number) => {
        const rev = cl(t * 0.6, 0, 1);
        c.save(); c.globalAlpha = rev * sa;
        const gT = baseY;

        // Flat maidan base layer — no wave distortion
        c.fillStyle = '#0f240d';
        c.fillRect(0, gT - 4, W, H - gT + 4);

        // Layer 2: Lush Fresh green dynamic maidan lawn
        const lg = c.createLinearGradient(0, gT - 4, 0, H);
        lg.addColorStop(0, '#1c4217');
        lg.addColorStop(0.3, '#143310');
        lg.addColorStop(1, '#0b1d09');
        c.fillStyle = lg;
        c.fillRect(0, gT - 4, W, H - gT + 4);

        const plW = gateW * 1.05, plH = 32;
        const pg = c.createLinearGradient(0, gT - 4, 0, gT + plH);
        pg.addColorStop(0, '#8b4228'); pg.addColorStop(0.4, '#7a3820'); pg.addColorStop(1, '#5a2815');
        c.fillStyle = pg; c.fillRect(cx - plW / 2, gT - 4, plW, plH);
        c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.06;
        const stPat = c.createPattern(stoneTexCv, 'repeat');
        if (stPat) { c.fillStyle = stPat; c.fillRect(cx - plW / 2, gT - 4, plW, plH); }
        c.restore();
        c.fillStyle = 'rgba(220,180,140,0.12)'; c.fillRect(cx - plW / 2, gT - 4, plW, 1.5);

        const pathW = gateW * 0.18;
        const pathG = c.createLinearGradient(0, gT, 0, gT + 60);
        pathG.addColorStop(0, '#7a4a30'); pathG.addColorStop(1, '#4a2a18');
        c.fillStyle = pathG;
        c.beginPath(); c.moveTo(cx - pathW / 2, gT); c.lineTo(cx + pathW / 2, gT);
        c.lineTo(cx + pathW * 0.6, H); c.lineTo(cx - pathW * 0.6, H); c.closePath(); c.fill();
        c.fillStyle = 'rgba(180,140,100,0.08)';
        c.fillRect(cx - pathW / 2, gT, pathW, 3);

        const drawTree = (tx: number, ty: number, s: number, a: number) => {
          c.save(); c.globalAlpha = a;
          c.fillStyle = 'rgba(0,0,0,0.10)';
          c.beginPath(); c.ellipse(tx + 8 * s, ty + 3, 18 * s, 4 * s, 0.2, 0, 6.283); c.fill();
          c.fillStyle = '#1a1008'; c.fillRect(tx - 2.5 * s, ty - 22 * s, 5 * s, 24 * s);
          for (let l = 0; l < 3; l++) {
            const ls = l === 1 ? 1.1 : 0.9;
            c.fillStyle = `rgb(${12 * ls | 0},${28 * ls | 0},${11 * ls | 0})`;
            c.beginPath();
            c.ellipse(tx + (l - 1) * 3 * s, ty - 22 * s - l * 9 * s, (18 - l * 4) * s, (12 - l * 2) * s, 0, 0, 6.283);
            c.fill();
          }
          c.restore();
        };
        drawTree(cx - gateW * 0.52, gT, 1.2, 0.9);
        drawTree(cx - gateW * 0.62, gT, 0.9, 0.7);
        drawTree(cx - gateW * 0.72, gT, 1.1, 0.5);
        drawTree(cx + gateW * 0.52, gT, 1.15, 0.85);
        drawTree(cx + gateW * 0.62, gT, 1.0, 0.65);
        drawTree(cx + gateW * 0.72, gT, 0.85, 0.45);

        c.restore();
      },

      redFort: (t: number, sa: number) => {
        c.save(); c.globalAlpha = sa;

        if (imgReady.current && imgRef.current) {
          const img = imgRef.current;
          const imgAsp = img.width / img.height;
          const dW = gateW * 1.15;
          const dH = dW / imgAsp;
          const dX = cx - dW / 2;
          const dY = fort.bastionL.top - 10;
          c.drawImage(img, dX, dY, dW, dH);
          c.restore();
          return;
        }

        const { wallL, wallR, wallTop, wallBot, archX, archW, archH, archBot,
          bastionL, bastionR, merlonW, merlonH, merlonGap } = fort;
        const SAND = '#b84e34'; const SAND_LT = '#d06848'; const SAND_DK = '#7a3220';
        const SAND_SH = '#4e1c0e'; const INLAY = '#e8d5b8'; const DOME = '#f0ebe0'; const GOLD = '#c89a18';

        const csGrad = c.createRadialGradient(cx, baseY + 3, gateW * 0.15, cx, baseY + 5, gateW * 0.55);
        csGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
        csGrad.addColorStop(0.6, 'rgba(0,0,0,0.12)');
        csGrad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = csGrad;
        c.beginPath(); c.ellipse(cx, baseY + 5, gateW * 0.55, 8, 0, 0, 6.283); c.fill();

        const fpW = gateW * 1.08;
        const fpGrad = c.createLinearGradient(0, baseY - 6, 0, baseY + 14);
        fpGrad.addColorStop(0, SAND_LT); fpGrad.addColorStop(0.4, SAND); fpGrad.addColorStop(1, SAND_SH);
        c.fillStyle = fpGrad; c.fillRect(cx - fpW / 2, baseY - 6, fpW, 20);
        c.fillStyle = 'rgba(220,180,140,0.15)'; c.fillRect(cx - fpW / 2, baseY - 6, fpW, 1.5);

        const drawBlock = (x: number, y: number, w: number, h: number, shade: number) => {
          c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
          const bg = c.createLinearGradient(x, y, x + w, y);
          const r = lerp(122, 208, shade) | 0, g2 = lerp(50, 104, shade) | 0, b = lerp(32, 72, shade) | 0;
          bg.addColorStop(0, `rgb(${r * 0.65 | 0},${g2 * 0.65 | 0},${b * 0.65 | 0})`);
          bg.addColorStop(0.15, `rgb(${r * 0.78 | 0},${g2 * 0.78 | 0},${b * 0.78 | 0})`);
          bg.addColorStop(0.5, `rgb(${r},${g2},${b})`);
          bg.addColorStop(0.85, `rgb(${Math.min(255, r * 1.12) | 0},${Math.min(255, g2 * 1.1) | 0},${Math.min(255, b * 1.08) | 0})`);
          bg.addColorStop(1, `rgb(${Math.min(255, r * 1.18) | 0},${Math.min(255, g2 * 1.15) | 0},${Math.min(255, b * 1.12) | 0})`);
          c.fillStyle = bg; c.fillRect(x, y, w, h);
          c.save(); c.globalAlpha = 0.1;
          const stPat = c.createPattern(stoneTexCv, 'repeat');
          if (stPat) { c.fillStyle = stPat; c.fillRect(x, y, w, h); }
          c.restore();
          c.fillStyle = `rgba(220,180,140,${0.1 * shade})`; c.fillRect(x, y, w, 1.5);
          c.strokeStyle = 'rgba(0,0,0,0.04)'; c.lineWidth = 0.5;
          for (let by = y + 18; by < y + h; by += 18) { c.beginPath(); c.moveTo(x, by); c.lineTo(x + w, by); c.stroke(); }
          for (let bx = x + 22; bx < x + w; bx += 22 + ((bx / 22 | 0) % 2) * 4) { c.beginPath(); c.moveTo(bx, y); c.lineTo(bx, y + h); c.stroke(); }
        };

        const wallW = wallR - wallL;
        const wallH = wallBot - wallTop;
        drawBlock(wallL, wallTop, wallW, wallH - 6, 0.55);

        c.save(); c.globalAlpha = 0.05;
        for (let wi = 0; wi < 5; wi++) {
          const wx = wallL + wallW * (0.15 + wi * 0.18);
          const wy = wallTop + wallH * (0.3 + noise.n2(wi * 3.7, 0) * 0.3);
          c.fillStyle = 'rgba(40,20,10,1)';
          c.beginPath(); c.ellipse(wx, wy, 8 + wi * 2, 15 + wi * 4, 0.2, 0, 6.283); c.fill();
        }
        c.restore();

        c.fillStyle = INLAY;
        [0.15, 0.45, 0.72, 0.92].forEach(bp => {
          const by = wallTop + wallH * bp;
          c.globalAlpha = sa * 0.35;
          c.fillRect(wallL + 4, by, wallW - 8, 2);
        });
        c.globalAlpha = sa;

        c.fillStyle = SAND_LT;
        for (let mx = wallL + merlonGap; mx < wallR - merlonW; mx += merlonW + merlonGap) {
          c.fillRect(mx, wallTop - merlonH, merlonW, merlonH);
          c.fillStyle = 'rgba(255,200,150,0.06)'; c.fillRect(mx, wallTop - merlonH, merlonW, 1);
          c.fillStyle = SAND_LT;
        }

        const drawBastion = (bx: number, bw: number, btop: number) => {
          const bh = wallBot - btop;
          drawBlock(bx, btop, bw, bh, 0.6);
          c.fillStyle = INLAY; c.globalAlpha = sa * 0.3;
          c.fillRect(bx + 3, btop + bh * 0.3, bw - 6, 1.5);
          c.fillRect(bx + 3, btop + bh * 0.7, bw - 6, 1.5);
          c.globalAlpha = sa;
          const bmW = merlonW * 0.8, bmH = merlonH * 0.9;
          c.fillStyle = SAND_LT;
          for (let mx = bx + 2; mx < bx + bw - bmW; mx += bmW + merlonGap * 0.7) { c.fillRect(mx, btop - bmH, bmW, bmH); }
          const chW = bw * 0.7, chX = bx + (bw - chW) / 2, chY = btop - bmH;
          c.fillStyle = SAND_LT;
          for (let pi = 0; pi < 4; pi++) { const ppx = chX + 3 + (chW - 6) * (pi / 3); c.fillRect(ppx, chY - 14, 2.5, 14); }
          c.fillStyle = SAND; c.fillRect(chX, chY - 2, chW, 3);
          c.beginPath(); c.arc(chX + chW / 2, chY - 2 - chW * 0.42 - 6, 2.5, 0, 6.283); c.fill();
        };
        drawBastion(bastionL.x, bastionL.w, bastionL.top);
        drawBastion(bastionR.x, bastionR.w, bastionR.top);

        const drawSmallChhatri = (sx: number) => {
          const sw = 18;
          c.fillStyle = SAND_LT; c.fillRect(sx - sw / 2, wallTop - merlonH - 2, sw, 3);
          c.beginPath(); c.arc(sx, wallTop - merlonH - 2, sw * 0.42, Math.PI, 0, false); c.closePath();
          c.fillStyle = DOME; c.fill();
          c.strokeStyle = 'rgba(0,0,0,0.1)'; c.lineWidth = 0.5; c.stroke();
          c.fillStyle = GOLD; c.fillRect(sx - 0.8, wallTop - merlonH - 2 - sw * 0.42 - 3, 1.6, 4);
        };
        drawSmallChhatri(cx - wallW * 0.3); drawSmallChhatri(cx + wallW * 0.3);
        drawSmallChhatri(cx - wallW * 0.15); drawSmallChhatri(cx + wallW * 0.15);

        const aL = archX - archW / 2, aR = archX + archW / 2;
        const aTop = archBot - archH, aNeckY = archBot - archH * 0.6;
        c.save(); c.beginPath();
        c.moveTo(aL - 6, archBot); c.lineTo(aL - 6, aNeckY - 4);
        c.quadraticCurveTo(aL - 6, aTop - 4, archX, aTop - 4);
        c.quadraticCurveTo(aR + 6, aTop - 4, aR + 6, aNeckY - 4);
        c.lineTo(aR + 6, archBot); c.closePath();
        c.fillStyle = INLAY; c.globalAlpha = sa * 0.5; c.fill();
        c.globalAlpha = sa; c.restore();

        c.save(); c.beginPath();
        c.moveTo(aL, archBot); c.lineTo(aL, aNeckY);
        c.quadraticCurveTo(aL, aTop, archX, aTop);
        c.quadraticCurveTo(aR, aTop, aR, aNeckY);
        c.lineTo(aR, archBot); c.closePath(); c.clip();
        const aShadow = c.createRadialGradient(archX, aTop + archH * 0.3, archW * 0.15, archX, aTop + archH * 0.3, archW * 0.65);
        aShadow.addColorStop(0, '#060201'); aShadow.addColorStop(0.5, '#0a0303'); aShadow.addColorStop(1, '#1a0805');
        c.fillStyle = aShadow; c.fillRect(aL - 5, aTop - 5, archW + 10, archH + 10);
        for (let ai = 0; ai < 3; ai++) {
          const aiw = archW * (0.7 - ai * 0.15), aih = archH * (0.55 - ai * 0.12);
          const aiy = archBot - aih; const ainy = archBot - aih * 0.6;
          c.strokeStyle = `rgba(60,30,18,${0.15 - ai * 0.04})`; c.lineWidth = 0.8;
          c.beginPath(); c.moveTo(archX - aiw / 2, archBot); c.lineTo(archX - aiw / 2, ainy);
          c.quadraticCurveTo(archX - aiw / 2, aiy, archX, aiy);
          c.quadraticCurveTo(archX + aiw / 2, aiy, archX + aiw / 2, ainy);
          c.lineTo(archX + aiw / 2, archBot); c.stroke();
        }
        c.restore();

        const drawSideArch = (sx: number) => {
          const sw = archW * 0.4, sh = archH * 0.38;
          const sl = sx - sw / 2, sTop = archBot - sh, sNeck = archBot - sh * 0.6;
          c.save(); c.beginPath();
          c.moveTo(sl, archBot); c.lineTo(sl, sNeck);
          c.quadraticCurveTo(sl, sTop, sx, sTop);
          c.quadraticCurveTo(sx + sw / 2, sTop, sx + sw / 2, sNeck);
          c.lineTo(sx + sw / 2, archBot); c.closePath(); c.clip();
          const wShadow = c.createRadialGradient(sx, sTop + sh * 0.3, 2, sx, sTop + sh * 0.3, sw * 0.5);
          wShadow.addColorStop(0, '#080201'); wShadow.addColorStop(1, '#120503');
          c.fillStyle = wShadow; c.fillRect(sl, sTop, sw, sh + 2);
          c.restore();
          c.strokeStyle = 'rgba(200,160,120,0.18)'; c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(sl, archBot); c.lineTo(sl, sNeck);
          c.quadraticCurveTo(sl, sTop, sx, sTop);
          c.quadraticCurveTo(sx + sw / 2, sTop, sx + sw / 2, sNeck);
          c.lineTo(sx + sw / 2, archBot); c.stroke();
        };
        drawSideArch(cx - wallW * 0.28); drawSideArch(cx + wallW * 0.28);
        drawSideArch(cx - wallW * 0.42); drawSideArch(cx + wallW * 0.42);

        c.save(); c.globalCompositeOperation = 'screen';
        const rimG = c.createLinearGradient(wallR - 5, 0, wallR + 2, 0);
        rimG.addColorStop(0, 'rgba(0,0,0,0)'); rimG.addColorStop(0.5, 'rgba(255,200,100,0.15)'); rimG.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = sa * 0.8;
        c.fillStyle = rimG; c.fillRect(wallR - 5, wallTop - merlonH, 7, wallH + merlonH);
        const topRimG = c.createLinearGradient(0, wallTop - merlonH - 2, 0, wallTop - merlonH + 4);
        topRimG.addColorStop(0, 'rgba(0,0,0,0)'); topRimG.addColorStop(0.4, 'rgba(255,200,100,0.12)'); topRimG.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = topRimG; c.fillRect(wallL, wallTop - merlonH - 2, wallW, 6);
        c.restore();
        c.restore();
      },

      torch: (t: number, el: number, sa: number) => {
        if (t < 1.5) return;
        const tx = cx, ty = baseY - 6;
        const fa = cl((t - 1.5) * 1.5, 0, 1) * sa;
        c.save(); c.globalAlpha = fa; c.globalCompositeOperation = 'lighter';
        const ag = c.createRadialGradient(tx, ty - 15, 0, tx, ty - 15, 120);
        ag.addColorStop(0, 'rgba(255,100,10,0.12)'); ag.addColorStop(0.5, 'rgba(255,60,5,0.03)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = ag; c.fillRect(tx - 120, ty - 135, 240, 240);
        const gg = c.createRadialGradient(tx, ty, 0, tx, ty, 50);
        gg.addColorStop(0, 'rgba(255,180,40,0.6)'); gg.addColorStop(0.5, 'rgba(255,80,10,0.12)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gg; c.fillRect(tx - 50, ty - 50, 100, 140);
        const fl = Math.sin(el * 30) * 3 + Math.sin(el * 47) * 1.5, fH = 28 + fl;
        for (let fi = 0; fi < 3; fi++) {
          const fW = 7 - fi * 2, fAlpha = 1 - fi * 0.3;
          const ffg = c.createLinearGradient(tx, ty, tx, ty - fH * fAlpha);
          ffg.addColorStop(0, fi === 0 ? '#ffffff' : 'rgba(255,220,100,0.6)');
          ffg.addColorStop(0.15 + fi * 0.15, 'rgba(255,200,70,0.7)');
          ffg.addColorStop(0.5, `rgba(255,${120 - fi * 30 | 0},20,0.4)`);
          ffg.addColorStop(1, 'rgba(255,50,0,0)');
          c.fillStyle = ffg; c.beginPath();
          c.moveTo(tx - fW, ty); c.quadraticCurveTo(tx - fW * 0.4, ty - fH * 0.5, tx, ty - fH * fAlpha);
          c.quadraticCurveTo(tx + fW * 0.4, ty - fH * 0.5, tx + fW, ty); c.closePath(); c.fill();
        }
        c.restore();
      },

      flag: (t: number, el: number, sa: number) => {
        if (t < 5.0) return;
        const ra = cl((t - 5.0) * 1.2, 0, 1) * sa;
        const fwS = sc * 0.18, fh = fwS * 0.66;

        const pBaseY = fort.roofY;
        const pH = gateH * 0.45;
        const pTopY = pBaseY - pH;

        const hoist = cl((t - 5.0) / 2.0, 0, 1);
        const curY = lerp(pBaseY - fh, pTopY, eOC(hoist));
        const unfurl = cl((t - 6.5) * 1.5, 0, 1);
        const fw = lerp(fwS * 0.1, fwS, eOC(unfurl));

        if (hoist < 1.0 || unfurl < 1.0) {
          for (let i = 0; i < numPts; i++) {
            fN[i].x = cx + (i * fw) / (numPts - 1);
            fN[i].y = curY;
            fN[i].ox = fN[i].x;
            fN[i].oy = fN[i].y;
            fN[i].vx = 0;
            fN[i].vy = 0;
          }
        } else {
          for (let i = 1; i < numPts; i++) {
            const wind = 0.12 + noise.n2(el * 0.55 + i * 0.11, 0) * 0.1 + noise.n2(el * 1.2 + i * 0.3, 1) * 0.03;
            fN[i].vx = (fN[i].x - fN[i].ox) * 0.92 + wind;
            fN[i].vy = (fN[i].y - fN[i].oy) * 0.92 + 0.015 + noise.n2(el * 0.8 + i * 0.2, 2) * 0.008;
            fN[i].ox = fN[i].x; fN[i].oy = fN[i].y;
            fN[i].x += fN[i].vx; fN[i].y += fN[i].vy;
          }
          fN[0].x = cx; fN[0].y = curY;

          const ll = fw / (numPts - 1);
          for (let s = 0; s < 6; s++) {
            for (let i = 0; i < numPts - 1; i++) {
              const a = fN[i], b = fN[i + 1];
              const dx = b.x - a.x, dy = b.y - a.y;
              const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
              const diff = ll - d, pct = (diff / d) * 0.5;
              const ox = dx * pct, oy = dy * pct;
              if (i > 0) { a.x -= ox; a.y -= oy; }
              b.x += ox; b.y += oy;
            }
          }
        }

        c.save(); c.globalAlpha = ra;
        const pg = c.createLinearGradient(cx - 2, pTopY, cx + 2, pBaseY);
        pg.addColorStop(0, '#ddd'); pg.addColorStop(0.5, '#fff'); pg.addColorStop(1, '#999');
        c.fillStyle = pg; c.fillRect(cx - 1.5, pTopY, 3, pH);
        c.fillStyle = '#ffd700'; c.beginPath(); c.arc(cx, pTopY, 3.5, 0, 6.283); c.fill();

        for (let i = 0; i < numPts - 1; i++) {
          const a = fN[i]; const b = fN[i + 1];
          const clothLight = 0.90 + Math.sin(i * 0.45 - el * 5.2) * 0.10 + Math.cos(i * 0.20 + el * 2.5) * 0.05;
          const shade = (hex: string) => {
            const h = hex.replace("#", "");
            const r = Math.min(255, Math.max(0, Math.round(parseInt(h.substring(0, 2), 16) * clothLight)));
            const g = Math.min(255, Math.max(0, Math.round(parseInt(h.substring(2, 4), 16) * clothLight)));
            const bVal = Math.min(255, Math.max(0, Math.round(parseInt(h.substring(4, 6), 16) * clothLight)));
            return `rgb(${r},${g},${bVal})`;
          };

          c.fillStyle = shade("#FF9933");
          c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, b.y + fh / 3); c.lineTo(a.x, a.y + fh / 3); c.closePath(); c.fill();

          c.fillStyle = shade("#FFFFFF");
          c.beginPath(); c.moveTo(a.x, a.y + fh / 3); c.lineTo(b.x, b.y + fh / 3);
          c.lineTo(b.x, b.y + (fh * 2) / 3); c.lineTo(a.x, a.y + (fh * 2) / 3);
          c.closePath(); c.fill();

          c.fillStyle = shade("#138808");
          c.beginPath(); c.moveTo(a.x, a.y + (fh * 2) / 3); c.lineTo(b.x, b.y + (fh * 2) / 3);
          c.lineTo(b.x, b.y + fh); c.lineTo(a.x, a.y + fh);
          c.closePath(); c.fill();

          c.strokeStyle = "rgba(255,255,255,0.12)"; c.lineWidth = 0.5;
          c.beginPath(); c.moveTo(a.x, a.y + fh / 3); c.lineTo(b.x, b.y + fh / 3); c.stroke();
          c.beginPath(); c.moveTo(a.x, a.y + (fh * 2) / 3); c.lineTo(b.x, b.y + (fh * 2) / 3); c.stroke();
        }

        if (unfurl > 0.15) {
          const mi = numPts / 2 | 0;
          const chx = fN[mi].x, chy = fN[mi].y + fh / 2;
          const cr = fh * 0.11 * unfurl;
          c.save(); c.translate(chx, chy); c.rotate(el * 0.7);
          c.strokeStyle = 'rgba(0,0,128,0.85)'; c.lineWidth = 1.4;
          c.beginPath(); c.arc(0, 0, cr, 0, 6.283); c.stroke();
          c.lineWidth = 0.6;
          for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.283; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * cr, Math.sin(a) * cr); c.stroke(); }
          c.restore();
        }
        c.restore();
      },

      volLight: (t: number, sa: number) => {
        if (t < 3 || t > 12) return;
        const int = cl((t - 3) * 0.15, 0, 0.35) * cl((12 - t) * 0.25, 0, 1) * sa;
        c.save(); c.globalAlpha = int; c.globalCompositeOperation = 'screen';
        const sx = cx + W * 0.12, sy = baseY - gateH * 0.4;
        for (let i = 0; i < 14; i++) {
          const a = -1.3 + (i / 14) * 2.6;
          const nw = noise.n2(t * 0.3 + i, 0) * 0.012;
          const len = sc * (0.9 + noise.n2(i * 0.5, t * 0.2) * 0.25);
          c.beginPath(); c.moveTo(sx, sy);
          c.lineTo(sx + Math.cos(a - 0.025 + nw) * len, sy + Math.sin(a - 0.025 + nw) * len);
          c.lineTo(sx + Math.cos(a + 0.025 + nw) * len, sy + Math.sin(a + 0.025 + nw) * len);
          c.closePath();
          const rg = c.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
          rg.addColorStop(0, 'rgba(255,215,120,0.12)'); rg.addColorStop(0.4, 'rgba(255,140,50,0.04)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = rg; c.fill();
        }
        c.restore();
      },

      drawKites: (t: number, sa: number) => {
        const ka = cl(t * 0.5, 0, 1) * (t > 12 ? cl((13 - t), 0, 1) : 1) * sa;
        c.save(); c.globalAlpha = ka;
        kites.forEach((k) => {
          const drift = noise.n2(t * 0.2 + k.driftX, 0) * 30;
          k.x = k.base_x + Math.sin(t * k.swaySpeed + k.tailPhase) * k.swayAmp + drift;
          k.y = k.base_y + Math.sin(t * 0.3 + k.tailPhase) * 6;
          const tilt = Math.sin(t * 1.3 + k.tailPhase) * 0.12 + Math.cos(t * k.swaySpeed * 0.7) * 0.06;
          c.save(); c.translate(k.x, k.y); c.rotate(tilt);
          const s = 16 * k.scale;
          const bodyGrad = c.createLinearGradient(-s, 0, s, 0);
          bodyGrad.addColorStop(0, '#e08830'); bodyGrad.addColorStop(0.20, '#ff9933');
          bodyGrad.addColorStop(0.45, '#ffe8c0'); bodyGrad.addColorStop(0.50, '#ffffff');
          bodyGrad.addColorStop(0.55, '#ffffff'); bodyGrad.addColorStop(0.60, '#d0f0d0');
          bodyGrad.addColorStop(0.80, '#128807'); bodyGrad.addColorStop(1, '#0e6e06');
          c.fillStyle = bodyGrad;
          c.beginPath();
          c.moveTo(0, -s * 1.35);
          c.bezierCurveTo(s * 0.4, -s * 0.8, s * 1.05, -s * 0.2, s * 1.05, 0);
          c.bezierCurveTo(s * 1.05, s * 0.2, s * 0.4, s * 0.7, 0, s * 1.15);
          c.bezierCurveTo(-s * 0.4, s * 0.7, -s * 1.05, s * 0.2, -s * 1.05, 0);
          c.bezierCurveTo(-s * 1.05, -s * 0.2, -s * 0.4, -s * 0.8, 0, -s * 1.35);
          c.fill();
          c.strokeStyle = 'rgba(100,65,25,0.3)'; c.lineWidth = 0.8;
          c.beginPath(); c.moveTo(0, -s * 1.35); c.lineTo(0, s * 1.15); c.stroke();
          c.beginPath(); c.moveTo(-s * 1.05, 0); c.quadraticCurveTo(0, -s * 0.15, s * 1.05, 0); c.stroke();
          c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 0.5;
          c.beginPath(); c.moveTo(0, s * 1.15);
          const tailLen = Math.min(H - k.y, s * 15);
          const tw1 = Math.sin(t * 2 + k.tailPhase) * s * 0.5;
          const tw2 = Math.sin(t * 1.5 + k.tailPhase + 2) * s * 0.3;
          c.bezierCurveTo(tw1, s * 1.15 + tailLen * 0.25, -tw2, s * 1.15 + tailLen * 0.55, tw1 * 0.3, s * 1.15 + tailLen);
          c.stroke();
          for (let bi = 1; bi <= 4; bi++) {
            const by = s * 1.15 + tailLen * (bi / 5);
            const bx = Math.sin(t * 2 + k.tailPhase + bi) * s * 0.3 * (bi / 4);
            c.fillStyle = ['#ff9933', '#ffffff', '#128807'][bi % 3]; c.globalAlpha = ka * 0.5;
            c.beginPath(); c.ellipse(bx, by, s * 0.22, s * 0.1, Math.sin(t * 3 + bi) * 0.5, 0, 6.283); c.fill();
            c.globalAlpha = ka;
          }
          c.restore();
        });
        c.restore();
      },

      doves: (t: number, el: number, sa: number) => {
        const vis = cl((t - 3) * 0.4, 0, 1) * sa;
        c.save(); c.globalAlpha = vis;
        birds.forEach(b => {
          if (b.state === 'sitting' && t < 3.5) {
            c.strokeStyle = '#0a0a0a'; c.lineWidth = 1;
            c.beginPath(); c.moveTo(b.x - 4, b.y); c.lineTo(b.x, b.y - 2); c.lineTo(b.x + 4, b.y); c.stroke();
            return;
          }
          if (b.state === 'sitting' && t >= 3.5) {
            b.state = 'flying';
            b.vx = b.side === 'left' ? -1.5 - Math.random() : 1.5 + Math.random();
            b.vy = -2 - Math.random() * 1.5;
          }
          if (b.state === 'flying') {
            const tx = b.side === 'left' ? -50 : W + 50;
            const ty = H * 0.15 + Math.sin(el * 0.5 + b.noiseSeed) * 40;
            const ddx = tx - b.x, ddy = ty - b.y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy) + 0.01;
            b.vx += (ddx / dist) * 0.08 + noise.n2(el * 0.8 + b.noiseSeed, 0) * 0.04;
            b.vy += (ddy / dist) * 0.05 + noise.n2(el * 0.6, b.noiseSeed) * 0.03;
            const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (spd > 3.5) { b.vx *= 3.5 / spd; b.vy *= 3.5 / spd; }
            b.x += b.vx; b.y += b.vy; b.wing += 0.25 + spd * 0.08; b.bank = b.vx * 0.15;
            const wingA = Math.sin(b.wing) * 0.6; const sz = 5;
            c.save(); c.translate(b.x, b.y); c.rotate(b.bank);
            c.fillStyle = '#0a0a0a';
            c.beginPath(); c.ellipse(0, 0, sz * 0.6, sz * 0.25, 0, 0, 6.283); c.fill();
            c.beginPath(); c.moveTo(-sz * 0.3, 0);
            c.quadraticCurveTo(-sz * 0.8, -sz * wingA, -sz * 1.4, -sz * wingA * 0.7);
            c.quadraticCurveTo(-sz * 0.8, sz * 0.1, -sz * 0.3, 0); c.fill();
            c.beginPath(); c.moveTo(sz * 0.3, 0);
            c.quadraticCurveTo(sz * 0.8, -sz * wingA, sz * 1.4, -sz * wingA * 0.7);
            c.quadraticCurveTo(sz * 0.8, sz * 0.1, sz * 0.3, 0); c.fill();
            c.restore();
          }
        });
        c.restore();
      },

      fireworks: (t: number, el: number, sa: number) => {
        if (t < 12) return;
        const fa = cl((t - 12) * 0.5, 0, 1) * sa;
        c.save(); c.globalAlpha = fa;

        for (const fw of fwList) {
          if (fw.state === 'rising') {
            const tg = c.createRadialGradient(fw.x, fw.y, 0, fw.x, fw.y, 6);
            tg.addColorStop(0, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},0.9)`);
            tg.addColorStop(1, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},0)`);
            c.fillStyle = tg; c.beginPath(); c.arc(fw.x, fw.y, 6, 0, 6.283); c.fill();
          }
          for (const pt of fw.pts) {
            const al = cl(pt.life / pt.ml, 0, 1);
            const tg = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.sz * 2);
            tg.addColorStop(0, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},${al * 0.9})`);
            tg.addColorStop(0.4, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},${al * 0.4})`);
            tg.addColorStop(1, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},0)`);
            c.fillStyle = tg; c.beginPath(); c.arc(pt.x, pt.y, pt.sz * 2, 0, 6.283); c.fill();
            c.fillStyle = `rgba(255,255,255,${al * 0.7})`; c.beginPath(); c.arc(pt.x, pt.y, pt.sz * 0.4, 0, 6.283); c.fill();
          }
        }

        for (const s of fwSmoke) {
          c.globalAlpha = fa * s.a * 0.3;
          c.fillStyle = 'rgba(180,160,140,0.3)';
          c.beginPath(); c.arc(s.x, s.y, s.sz, 0, 6.283); c.fill();
        }
        c.restore();
      },

      celebrationScene: (t: number, el: number, sa: number) => {
        if (t < 12.5) return;
        const ca = cl((t - 12.5) * 0.8, 0, 1) * sa;
        const centerY = H * 0.26;
        c.save(); c.globalAlpha = ca;

        c.font = `bold ${Math.min(W * 0.045, 34)}px 'Georgia', serif`;
        c.textAlign = 'center'; c.textBaseline = 'middle';

        c.shadowColor = 'rgba(255,153,51,0.6)'; c.shadowBlur = 20;
        c.fillStyle = '#FFD700';
        c.fillText('HAPPY INDEPENDENCE DAY', cx, centerY);
        c.shadowBlur = 0;

        c.font = `${Math.min(W * 0.018, 16)}px 'Georgia', serif`;
        c.fillStyle = 'rgba(255,215,0,0.8)';
        c.fillText('80th Anniversary | 1947 - 2027', cx, centerY + Math.min(W * 0.04, 32));

        c.font = `bold ${Math.min(W * 0.028, 24)}px 'Georgia', serif`;
        c.fillStyle = 'rgba(255,180,60,0.9)';
        c.fillText('\u0935\u0902\u0926\u0947 \u092E\u093E\u0924\u0930\u092E\u094D', cx, centerY + Math.min(W * 0.07, 56));

        c.font = `bold ${Math.min(W * 0.022, 18)}px 'Georgia', serif`;
        c.fillStyle = 'rgba(255,200,100,0.7)';
        c.fillText('\u091C\u092F \u0939\u093F\u0928\u094D\u0926', cx, centerY + Math.min(W * 0.1, 80));

        c.restore();

        c.save(); c.globalAlpha = ca * 0.8;
        const soldierSpacing = Math.min(40, W * 0.035);
        const soldierCount = Math.min(8, Math.floor(gateW * 0.6 / soldierSpacing));
        const soldierStartX = cx - (soldierCount - 1) * soldierSpacing / 2;
        const soldierScale = Math.min(1.2, sc * 0.0022);
        for (let i = 0; i < soldierCount; i++) {
          drawRealisticSoldierSilhouette(soldierStartX + i * soldierSpacing, baseY - 2, soldierScale);
        }
        c.restore();

        if (Math.random() < 0.06 && balloons.length < 15) {
          const cols = [{ r: 255, g: 153, b: 51 }, { r: 255, g: 255, b: 255 }, { r: 19, g: 136, b: 8 }];
          const col = cols[Math.random() * 3 | 0];
          balloons.push({
            x: cx + (Math.random() - 0.5) * gateW * 0.8,
            y: baseY + 20,
            r: col.r, g: col.g, b: col.b,
            sz: 6 + Math.random() * 8,
            swaySpeed: 0.8 + Math.random() * 1.2,
            swayAmp: 15 + Math.random() * 25,
            phase: Math.random() * 6.28,
            seed: Math.random() * 1000,
            vy: -0.4 - Math.random() * 0.6,
            born: t,
          });
        }
        for (let i = balloons.length - 1; i >= 0; i--) {
          const bl = balloons[i];
          bl.y += bl.vy;
          bl.x += Math.sin(el * bl.swaySpeed + bl.phase) * 0.3 + noise.n2(el * 0.3 + bl.seed, 0) * 0.2;
          const age = t - bl.born;
          const blAlpha = age < 0.5 ? age / 0.5 : (bl.y > -50 ? 1 : 0);
          if (bl.y < -50 || blAlpha <= 0) { balloons.splice(i, 1); continue; }
          c.save(); c.globalAlpha = ca * blAlpha * 0.7;
          c.fillStyle = `rgb(${bl.r},${bl.g},${bl.b})`;
          c.beginPath(); c.ellipse(bl.x, bl.y, bl.sz * 0.6, bl.sz, 0, 0, 6.283); c.fill();
          c.fillStyle = `rgba(${bl.r},${bl.g},${bl.b},0.3)`;
          c.beginPath(); c.ellipse(bl.x, bl.y + bl.sz, bl.sz * 0.15, bl.sz * 0.2, 0, 0, 6.283); c.fill();
          c.strokeStyle = `rgba(${Math.max(0,bl.r-40)},${Math.max(0,bl.g-40)},${Math.max(0,bl.b-40)},0.5)`;
          c.lineWidth = 0.5;
          c.beginPath(); c.moveTo(bl.x, bl.y + bl.sz);
          c.lineTo(bl.x + Math.sin(el + bl.seed) * 3, bl.y + bl.sz + 20); c.stroke();
          c.restore();
        }
      },

      grain: (sa: number) => {
        c.save(); c.globalAlpha = sa * 0.04; c.globalCompositeOperation = 'overlay';
        const ox = Math.random() * 256, oy = Math.random() * 256;
        const pat = c.createPattern(grainCv, 'repeat');
        if (pat) { c.fillStyle = pat; c.translate(ox, oy); c.fillRect(-ox, -oy, W + 256, H + 256); }
        c.restore();
      },

      vignette: (sa: number) => {
        c.save(); c.globalAlpha = sa * 0.5;
        const vg = c.createRadialGradient(cx, H * 0.45, sc * 0.3, cx, H * 0.45, sc * 0.9);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.7, 'rgba(0,0,0,0.1)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
        c.fillStyle = vg; c.fillRect(0, 0, W, H);
        c.restore();
      },
    };

    let lastT = 0;
    let fwTimer = 0;

    const frame = (now: number) => {
      if (!t0.current) t0.current = now;
      const t = Math.min((now - t0.current) / 1000, DUR);
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      const el = t;

      if (t >= 12) {
        fwTimer += dt;
        if (fwTimer > 0.6) { fwTimer = 0; spawnFW(); }
        updateFW(dt);
      }

      if (camShake > 0.1) {
        c.save();
        c.translate((Math.random() - 0.5) * camShake, (Math.random() - 0.5) * camShake);
        camShake *= 0.88;
      }

      const sceneAlpha = t >= DUR ? cl((DUR - t) * 2 + 1, 0, 1) : 1;

      R.sky(t, sceneAlpha);
      R.stars(t, sceneAlpha);
      R.clouds(t, sceneAlpha);
      R.atmosFog(t, sceneAlpha);
      R.volLight(t, sceneAlpha);
      R.ground(t, sceneAlpha);
      R.redFort(t, sceneAlpha);
      R.torch(t, el, sceneAlpha);
      R.flag(t, el, sceneAlpha);
      R.drawKites(t, sceneAlpha);
      R.doves(t, el, sceneAlpha);
      R.fireworks(t, el, sceneAlpha);
      R.celebrationScene(t, el, sceneAlpha);
      R.grain(sceneAlpha);
      R.vignette(sceneAlpha);

      if (camShake > 0.1) c.restore();

      if (t < DUR) {
        raf.current = requestAnimationFrame(frame);
      } else {
        if (!done.current) {
          done.current = true;
          setTimeout(() => { if (cbR.current) cbR.current(); }, 400);
        }
      }
    };

    raf.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
    };
  }, [imageUrl, mkPool, grab, playAudio]);

  return (
    <canvas
      ref={cvRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 9999, pointerEvents: 'none',
      }}
    />
  );
}
