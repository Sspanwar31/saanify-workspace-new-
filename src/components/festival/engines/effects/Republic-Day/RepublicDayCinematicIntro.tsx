'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & INTERFACES (Physically Based Particles & Entities)
   ═══════════════════════════════════════════════════════════════ */
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; ml: number; sz: number;
  r: number; g: number; b: number; a: number;
  tp: number; // 1: Fog Dust, 2: Confetti, 3: Torch Embers, 4: Jet Smoke, 5: Gold Dust, 6: Solar
  rot: number; rs: number; on: boolean;
  turbOff: number;
}

interface Jet {
  x: number; y: number; scale: number; smokeColor: string; vx: number; vy: number; active: boolean;
}

interface Cloud {
  x: number; y: number; sz: number; speed: number; opacity: number;
}

interface BoidBird {
  x: number; y: number; vx: number; vy: number; wing: number;
  state: 'sitting' | 'flying';
  side: 'left' | 'right';
  noiseSeed: number;
  bank: number;
}

const POOL_SIZE = 5000;
const DUR = 16.0; // Cinematic 16s Climax Timeline

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
     CANVAS LIFE CYCLE & CINEMATIC DRAWERS
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    // Secure local math scope to prevent ReferenceErrors during bundling
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
    const eIO = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const eOB = (t: number) => { 
      const n = 7.5625, d = 2.75; 
      if (t < 1/d) return n*t*t; 
      if (t < 2/d) return n*(t-=1.5/d)*t+0.75; 
      if (t < 2.5/d) return n*(t-=2.25/d)*t+0.9375; 
      return n*(t-=2.625/d)*t+0.984375; 
    };
    const ss = (e0: number, e1: number, x: number) => { 
      const t = clamp((x-e0)/(e1-e0),0,1); 
      return t*t*(3-2*t); 
    };
    const aces = (x: number) => { 
      const a=2.51,b=0.03,c2=2.43,d=0.59,e=0.14; 
      return clamp((x*(a*x+b))/(x*(c2*x+d)+e),0,1); 
    };

    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    triggerMilitaryAudio();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    
    const noise = new SimplexNoise(3821);
    const pl = mkPool();

    // CLOTH SIMULATION FOR THE TRICOLOR FLAG (Verlet Spring-Mass Model)
    const numPoints = 14;
    const flagNodes: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      flagNodes.push({ x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0 });
    }

    // Crossing Fighter Jets Setup (With diagonal paths for realistic crossing)
    const jets: Jet[] = [
      { x: -W * 0.3, y: H * 0.45, scale: 0.95, smokeColor: '#FF9933', vx: 6.2, vy: -1.8, active: true }, // Climbing up
      { x: W + W * 0.3, y: H * 0.15, scale: 0.90, smokeColor: '#FFFFFF', vx: -6.2, vy: 1.2, active: true },  // Descending down
      { x: -W * 0.45, y: H * 0.52, scale: 0.85, smokeColor: '#138808', vx: 6.2, vy: -2.2, active: true } // Climbing up
    ];

    const starI: number[] = [];
    for (let i = 0; i < 150; i++) {
      const p = pl[i]; p.on = true; p.tp = 0;
      p.x = Math.random() * W; p.y = Math.random() * H * 0.75;
      p.sz = Math.random() * 1.2 + 0.2; p.ml = 999; p.life = 999;
      p.r = 200; p.g = 220; p.b = 255; p.a = Math.random() * 0.4 + 0.05;
      starI.push(i);
    }

    // BBC PLANET EARTH FLOCKING BIRDS setup
    const birds: BoidBird[] = [];

    // Master Sizing values computed dynamically
    let sc = Math.min(window.innerWidth, window.innerHeight);
    let gateH = sc * 0.66;
    let gateW = gateH * 0.84;
    let baseY = window.innerHeight * 0.82;
    let cx = window.innerWidth * 0.5;
    let pillarH = gateH * 0.72;
    let pillarY = baseY - 32 - pillarH;

    const rsz = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-calculate layout values
      sc = Math.min(W, H);
      gateH = sc * 0.66;
      gateW = gateH * 0.84;
      baseY = H * 0.82;
      cx = W * 0.5;
      pillarH = gateH * 0.72;
      pillarY = baseY - 32 - pillarH;

      // Initialize doves securely on high wall ledges of the newly scaled India Gate
      birds.length = 0;
      for (let i = 0; i < 8; i++) {
        birds.push({
          x: cx - gateW * 0.44 + (gateW * 0.16) * (i / 7),
          y: pillarY - 4, // Left wall ledge
          vx: 0, vy: 0,
          wing: Math.random() * Math.PI * 2,
          state: 'sitting',
          side: 'left',
          noiseSeed: Math.random() * 1000,
          bank: 0
        });
      }
      for (let i = 0; i < 8; i++) {
        birds.push({
          x: cx + gateW * 0.28 + (gateW * 0.16) * (i / 7),
          y: pillarY - 4, // Right wall ledge
          vx: 0, vy: 0,
          wing: Math.random() * Math.PI * 2,
          state: 'sitting',
          side: 'right',
          noiseSeed: Math.random() * 1000,
          bank: 0
        });
      }
    };
    rsz(); window.addEventListener('resize', rsz);

    // Film Grain Setup
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
    const sunPos = (t: number) => ({ x: lerp(W*0.3, W*0.5, eOE(t/10)), y: lerp(H*1.2, H*0.15, eOE(t/10)) });

    /* ═══════════════════════════════════════════════════════════
       RENDERER OBJECT (Encapsulates all layers to avoid scoping/compilation bugs)
       ═══════════════════════════════════════════════════════════ */
    const renderer = {
      // LAYER 1: SKY (Smooth Dawn Transition)
      sky: (t: number, sceneAlpha: number) => {
        c.save();
        c.globalAlpha = sceneAlpha;
        const grad = c.createLinearGradient(0, 0, 0, H);
        
        if (t < 3.5) {
          // Phase 1: Twilight Deep Blue
          const interp = clamp(t / 3.5, 0, 1);
          const r1 = lerp(4, 20, interp), g1 = lerp(6, 32, interp), b1 = lerp(18, 62, interp);
          const r2 = lerp(8, 48, interp), g2 = lerp(12, 40, interp), b2 = lerp(32, 90, interp);
          grad.addColorStop(0, `rgb(${r1 | 0}, ${g1 | 0}, ${b1 | 0})`);
          grad.addColorStop(1, `rgb(${r2 | 0}, ${g2 | 0}, ${b2 | 0})`);
        } else if (t < 7.5) {
          // Phase 2: Purple-to-Orange Horizon
          const interp = clamp((t - 3.5) / 4.0, 0, 1);
          const r1 = lerp(20, 85, interp), g1 = lerp(32, 38, interp), b1 = lerp(62, 80, interp);
          const r2 = lerp(48, 255, interp), g2 = lerp(40, 130, interp), b2 = lerp(90, 48, interp);
          grad.addColorStop(0, `rgb(${r1 | 0}, ${g1 | 0}, ${b1 | 0})`);
          grad.addColorStop(1, `rgb(${r2 | 0}, ${g2 | 0}, ${b2 | 0})`);
        } else if (t < 11.5) {
          // Phase 3: Golden Saffron Sunrise
          const interp = clamp((t - 7.5) / 4.0, 0, 1);
          const r1 = lerp(85, 255, interp), g1 = lerp(38, 195, interp), b1 = lerp(80, 110, interp);
          const r2 = lerp(255, 255, interp), g2 = lerp(130, 175, interp), b2 = lerp(48, 30, interp);
          grad.addColorStop(0, `rgb(${r1 | 0}, ${g1 | 0}, ${b1 | 0})`);
          grad.addColorStop(1, `rgb(${r2 | 0}, ${g2 | 0}, ${b2 | 0})`);
        } else {
          // Phase 4: Blue Morning Soft Haze
          const interp = clamp((t - 11.5) / 4.5, 0, 1);
          const r1 = lerp(255, 14, interp), g1 = lerp(195, 30, interp), b1 = lerp(110, 85, interp);
          const r2 = lerp(255, 32, interp), g2 = lerp(175, 54, interp), b2 = lerp(30, 140, interp);
          grad.addColorStop(0, `rgb(${r1 | 0}, ${g1 | 0}, ${b1 | 0})`);
          grad.addColorStop(1, `rgb(${r2 | 0}, ${g2 | 0}, ${b2 | 0})`);
        }

        c.fillStyle = grad;
        c.fillRect(0, 0, W, H);
        c.restore();
      },

      // STARS RENDERING (Fades progressively)
      stars: (t: number, sceneAlpha: number) => {
        if (t > 7) return;
        const alpha = clamp(1 - t / 7, 0, 1) * sceneAlpha;
        c.save();
        c.globalAlpha = alpha;
        for (let i = 0; i < starI.length; i++) {
          const idx = starI[i];
          const p = pl[idx];
          if (p && p.on) {
            const twinkle = Math.sin(t * 3.5 + i) * 0.4 + 0.6;
            c.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a * twinkle})`;
            c.beginPath();
            c.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
            c.fill();
          }
        }
        c.restore();
      },

      // LAYER 4: INDIA GATE
      indiaGate: (t: number, sceneAlpha: number) => {
        const reveal = clamp((t - 0.8) * 0.4, 0, 1);
        c.save();
        c.globalAlpha = reveal * sceneAlpha;

        const sandstoneBase = '#c1805b';
        const shadowBevel = '#613620';
        const highlightBevel = '#eed2bc';

        const drawBevelBlock = (x: number, y: number, w: number, h: number) => {
          c.fillStyle = 'rgba(0,0,0,0.32)';
          c.fillRect(x - 3, y - 3, w + 6, h + 6);

          const frontGrad = c.createLinearGradient(x, y, x, y + h);
          frontGrad.addColorStop(0, highlightBevel);
          frontGrad.addColorStop(0.3, sandstoneBase);
          frontGrad.addColorStop(1, shadowBevel);
          c.fillStyle = frontGrad;
          c.fillRect(x, y, w, h);

          c.strokeStyle = highlightBevel;
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(x, y + h);
          c.lineTo(x, y);
          c.lineTo(x + w, y);
          c.stroke();

          c.strokeStyle = shadowBevel;
          c.lineWidth = 2.0;
          c.beginPath();
          c.moveTo(x + w, y);
          c.lineTo(x + w, y + h);
          c.lineTo(x, y + h);
          c.stroke();
        };

        drawBevelBlock(cx - gateW * 0.52, baseY - 16, gateW * 1.04, 16);
        drawBevelBlock(cx - gateW * 0.48, baseY - 32, gateW * 0.96, 16);

        const pW = gateW * 0.26;
        const pH = gateH * 0.72;
        const pY = baseY - 32 - pH;
        
        drawBevelBlock(cx - gateW * 0.46, pY, pW, pH);
        drawBevelBlock(cx + gateW * 0.46 - pW, pY, pW, pH);

        drawBevelBlock(cx - gateW * 0.5, pY - gateH * 0.1, gateW * 1.0, gateH * 0.1);
        drawBevelBlock(cx - gateW * 0.42, pY - gateH * 0.22, gateW * 0.84, gateH * 0.12);

        c.beginPath();
        c.moveTo(cx - gateW * 0.2, pY - gateH * 0.22);
        c.quadraticCurveTo(cx, pY - gateH * 0.35, cx + gateW * 0.2, pY - gateH * 0.22);
        c.closePath();
        c.fillStyle = shadowBevel;
        c.fill();

        c.restore();
      },

      // LAYER 5: AMAR JAWAN JYOTI (Flame)
      torch: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 2.0) return;
        const tx = W * 0.5;
        const ty = H * 0.795;
        
        const fireAlpha = clamp((t - 2.0) * 1.5, 0, 1) * sceneAlpha;
        c.save();
        c.globalAlpha = fireAlpha;
        c.globalCompositeOperation = 'lighter';
        
        const glowGrad = c.createRadialGradient(tx, ty, 0, tx, ty, 140);
        glowGrad.addColorStop(0, 'rgba(255, 120, 20, 0.9)');
        glowGrad.addColorStop(0.4, 'rgba(255, 60, 5, 0.35)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        c.fillStyle = glowGrad;
        c.fillRect(tx - 140, ty - 140, 280, 280);

        const flicker = Math.sin(elapsed * 32) * 4;
        const flameH = 42 + flicker;
        const flameW = 11;

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
        c.closePath();
        c.fill();
        c.restore();
      },

      // LAYER 6 & 7: WAVING FLAG & ASHOKA CHAKRA (Silk simulation slowed down and elegant)
      wavingFlagAndChakra: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 3.0) return;
        const revealAlpha = clamp((t - 3.0) * 1.2, 0, 1) * sceneAlpha;

        const scVal = Math.min(W, H);
        const fw = scVal * 0.38;
        const fh = fw * 0.66;
        const fx = W * 0.5 - fw / 2;
        const fy = H * 0.44 - fh / 2;

        // Verlet Cloth Simulation Nodes setup
        if (flagNodes[0].x === 0) {
          for (let i = 0; i < numPoints; i++) {
            flagNodes[i].x = fx + (i * fw) / (numPoints - 1);
            flagNodes[i].y = fy;
            flagNodes[i].ox = flagNodes[i].x;
            flagNodes[i].oy = flagNodes[i].y;
          }
        }

        // Physics integration cycle (Elegantly tuned down to represent heavy heavy silk fabric)
        for (let i = 1; i < numPoints; i++) {
          // WIND FORCE: Extremely subtle slow-motion breeze wave (elapsed * 0.8 and force multiplier scaled down)
          const wind = 0.22 + noise.n2(elapsed * 0.8 + i * 0.15, 0) * 0.18;
          const gravity = 0.08; // Delicate downward drag for stable structure

          // High damping (0.94) to eliminate frantic/violent waving jitter
          flagNodes[i].vx = (flagNodes[i].x - flagNodes[i].ox) * 0.94 + wind;
          flagNodes[i].vy = (flagNodes[i].y - flagNodes[i].oy) * 0.94 + gravity;

          flagNodes[i].ox = flagNodes[i].x;
          flagNodes[i].oy = flagNodes[i].y;

          flagNodes[i].x += flagNodes[i].vx;
          flagNodes[i].y += flagNodes[i].vy;
        }

        flagNodes[0].x = fx;
        flagNodes[0].y = fy;

        const linkLength = fw / (numPoints - 1);
        for (let steps = 0; steps < 4; steps++) {
          for (let i = 0; i < numPoints - 1; i++) {
            const n1 = flagNodes[i];
            const n2 = flagNodes[i + 1];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const diff = linkLength - dist;
            const percent = (diff / dist) * 0.5;
            const offsetX = dx * percent;
            const offsetY = dy * percent;

            if (i > 0) {
              n1.x -= offsetX;
              n1.y -= offsetY;
            }
            n2.x += offsetX;
            n2.y += offsetY;
          }
        }

        c.save();
        c.globalAlpha = revealAlpha;

        for (let i = 0; i < numPoints - 1; i++) {
          const n1 = flagNodes[i];
          const n2 = flagNodes[i + 1];
          const shade = 0.85 + Math.sin(i * 0.3 - elapsed * 4) * 0.15;

          const applyShade = (hex: string) => {
            const h = hex.replace('#', '');
            const rr = parseInt(h.substring(0,2),16), gg = parseInt(h.substring(2,4),16), bb = parseInt(h.substring(4,6),16);
            return `rgb(${rr*shade|0},${gg*shade|0},${bb*shade|0})`;
          };

          c.fillStyle = applyShade('#FF9933');
          c.beginPath();
          c.moveTo(n1.x, n1.y);
          c.lineTo(n2.x, n2.y);
          c.lineTo(n2.x, n2.y + fh / 3);
          c.lineTo(n1.x, n1.y + fh / 3);
          c.closePath();
          c.fill();

          c.fillStyle = applyShade('#FFFFFF');
          c.beginPath();
          c.moveTo(n1.x, n1.y + fh / 3);
          c.lineTo(n2.x, n2.y + fh / 3);
          c.lineTo(n2.x, n2.y + (fh * 2) / 3);
          c.lineTo(n1.x, n1.y + (fh * 2) / 3);
          c.closePath();
          c.fill();

          c.fillStyle = applyShade('#138808');
          c.beginPath();
          c.moveTo(n1.x, n1.y + (fh * 2) / 3);
          c.lineTo(n2.x, n2.y + (fh * 2) / 3);
          c.lineTo(n2.x, n2.y + fh);
          c.lineTo(n1.x, n1.y + fh);
          c.closePath();
          c.fill();
        }

        const midIdx = numPoints / 2 | 0;
        const cxV = flagNodes[midIdx].x;
        const cyV = flagNodes[midIdx].y + fh / 2;
        const cr = fh * 0.11;

        let chakAlpha = 0;
        if (t >= 5.0 && t < 6.5) {
          c.save();
          c.translate(cxV, cyV);
          c.strokeStyle = 'rgba(192, 192, 192, 0.4)';
          c.lineWidth = 1.0;
          c.beginPath(); c.arc(0, 0, cr, 0, Math.PI * 2); c.stroke();
          c.restore();
        } else if (t >= 6.5) {
          chakAlpha = clamp((t - 6.5) / 1.5, 0, 1);
          c.save();
          c.translate(cxV, cyV);
          c.rotate(elapsed * 0.7);

          c.strokeStyle = `rgba(0, 0, 128, ${chakAlpha})`;
          c.lineWidth = 2.5;
          c.beginPath(); c.arc(0, 0, cr, 0, Math.PI * 2); c.stroke();

          c.lineWidth = 1.2;
          for (let i = 0; i < 24; i++) {
            const ang = (i / 24) * Math.PI * 2;
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(Math.cos(ang) * cr, Math.sin(ang) * cr);
            c.stroke();
          }
          c.restore();
        }

        c.restore();
      },

      // LAYER 11: VOLUMETRIC SUNRISE LIGHTING
      volumetricLighting: (t: number, sceneAlpha: number) => {
        if (t < 3.0) return;
        const intensity = clamp((t - 3.0) * 0.3, 0, 0.82) * sceneAlpha;
        const sunX = W * 0.5;
        const sunY = baseY - gateH * 0.4;

        c.save();
        c.globalAlpha = intensity;
        c.globalCompositeOperation = 'screen';

        const volumetricGrad = c.createRadialGradient(sunX, sunY, 10, sunX, sunY, gateW * 0.95);
        volumetricGrad.addColorStop(0, 'rgba(255, 160, 50, 0.7)');
        volumetricGrad.addColorStop(0.3, 'rgba(255, 110, 20, 0.3)');
        volumetricGrad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = volumetricGrad;
        c.fillRect(0, 0, W, H);

        for (let i = 0; i < 15; i++) {
          const angle = -Math.PI * 0.5 + (i / 15) * Math.PI - Math.PI * 0.5;
          const l = sc * 1.5;
          c.beginPath();
          c.moveTo(sunX, sunY);
          c.lineTo(sunX + Math.cos(angle - 0.05) * l, sunY + Math.sin(angle - 0.05) * l);
          c.lineTo(sunX + Math.cos(angle + 0.05) * l, sunY + Math.sin(angle + 0.05) * l);
          c.closePath();

          const rayGrad = c.createLinearGradient(sunX, sunY, sunX + Math.cos(angle) * l, sunY + Math.sin(angle) * l);
          rayGrad.addColorStop(0, 'rgba(255, 230, 160, 0.28)');
          rayGrad.addColorStop(0.5, 'rgba(255, 140, 50, 0.08)');
          rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = rayGrad;
          c.fill();
        }

        c.restore();
      },

      // LAYER 8: CROSSING JETS & THICK SMOKE TRAILS
      jetsAndTrails: (t: number, sceneAlpha: number) => {
        if (t < 2.5 || t > 9.0) return;
        c.save();
        c.globalAlpha = sceneAlpha;

        jets.forEach(jet => {
          jet.x += jet.vx; jet.y += jet.vy;

          if (Math.abs(jet.x - W * 0.5) < 180) {
            cameraShake = 3.5;
          }

          const nozzleX = jet.x - (jet.vx > 0 ? 32 : -32) * jet.scale;
          const nozzleY = jet.y + 2 * jet.scale;

          if (Math.random() < 0.85) {
            const p = grab(pl); if (p) {
              p.on = true; p.x = nozzleX; p.y = nozzleY;
              p.vx = -jet.vx * 0.12 + (Math.random() - 0.5) * 0.4;
              p.vy = (Math.random() - 0.5) * 0.4;
              p.life = 4.2; p.ml = 4.2;
              p.sz = 14 * jet.scale + Math.random() * 15;

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
          c.moveTo(35, 0); c.quadraticCurveTo(15, -4, -10, -5);
          c.lineTo(-24, -3); c.lineTo(-24, 3); c.lineTo(-10, 5);
          c.quadraticCurveTo(15, 4, 35, 0);
          c.fill();
          c.restore();
        });

        c.restore();
      },

      // LAYER 11: DOVES (Fades in correctly with India Gate, flying elegantly)
      doves: (t: number, elapsed: number, sceneAlpha: number) => {
        if (t < 2.0) return; // Hidden until India Gate is fully revealed
        const dAlpha = clamp((t - 2.0) * 1.2, 0, 1) * sceneAlpha;
        c.save();
        c.globalAlpha = dAlpha;

        if (t >= 2.6) {
          birds.forEach(b => {
            if (b.state === 'sitting') {
              b.state = 'flying';
              // Fixed: Gentle, organic flight speeds (much slower and natural)
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

            b.x += b.vx;
            b.y += b.vy;

            const dutyCycle = Math.sin(elapsed * 3.5 + b.noiseSeed);
            b.wing += dutyCycle > 0 ? 0.28 : 0.12;
            b.bank = b.vx * 0.10;
          }

          c.save();
          c.translate(b.x, b.y);
          c.rotate(b.state === 'flying' ? Math.atan2(b.vy, b.vx) + b.bank : 0);

          const scale = 0.52;
          c.scale(scale, scale);

          if (b.state === 'flying') {
            const wingFactor = Math.sin(b.wing);

            c.fillStyle = '#d8d8d8';
            c.beginPath();
            c.moveTo(-15, 0);
            c.lineTo(-26, -5 + wingFactor * 2);
            c.lineTo(-26, 5 - wingFactor * 2);
            c.closePath();
            c.fill();

            c.fillStyle = '#ffffff';
            c.beginPath(); c.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2); c.fill();

            c.fillStyle = '#ffffff';
            c.beginPath(); c.arc(13, -2, 4, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#e29b3c';
            c.beginPath();
            c.moveTo(16, -3); c.lineTo(21, -2); c.lineTo(15, -1);
            c.closePath(); c.fill();

            [-1, 1].forEach(side => {
              c.save();
              c.scale(1, side);
              c.rotate(wingFactor * 0.5 - 0.15);
              c.fillStyle = '#f0f0f0';
              c.beginPath();
              c.moveTo(0, 0); c.lineTo(-7, -15); c.lineTo(-13, -13);
              c.closePath(); c.fill();
              c.restore();
            });
          } else {
            const headBob = Math.sin(elapsed * 5.5 + b.noiseSeed) * 1.2;
            c.fillStyle = '#b5b5b5';
            c.beginPath();
            c.moveTo(-10, 2); c.lineTo(-22, 6); c.lineTo(-20, 0);
            c.closePath(); c.fill();

            c.fillStyle = '#f5f5f5';
            c.beginPath(); c.ellipse(0, 2, 13, 6.5, 0.1, 0, Math.PI * 2); c.fill();

            c.fillStyle = '#ffffff';
            c.beginPath(); c.arc(10, -2 + headBob, 4, 0, Math.PI * 2); c.fill();
          }

          c.restore();
        });

        c.restore();
      },

      // LAYER 13: PREMIUM TYPOGRAPHY (Perfect Center Position Fixed)
      typography: (t: number) => {
        if (t < 11.5) return;
        const titleY = lerp(H * 0.58, H * 0.44, eOE((t - 11.5) * 0.5));

        c.save();
        const fontSize = Math.min(W * 0.065, 52);
        c.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;

        const title = "HAPPY REPUBLIC DAY";
        const totalW = c.measureText(title).width;
        let xOff = W * 0.5 - totalW * 0.5; // Start boundary strictly centered

        for (let i = 0; i < title.length; i++) {
          const charW = c.measureText(title[i]).width;
          const charT = clamp((t - 11.5 - i * 0.035) / 0.4, 0, 1);
          const charY = titleY + (1 - eOB(charT)) * -15;

          c.save();
          c.globalAlpha = eOC(charT);

          // Shadow drawn centered
          c.fillStyle = 'rgba(0,0,0,0.92)';
          c.fillText(title[i], xOff + 2, charY + 2);

          // Waving Tricolor Gradient
          const sweepGrad = c.createLinearGradient(xOff, charY - fontSize * 0.5, xOff, charY + fontSize * 0.38);
          sweepGrad.addColorStop(0, '#FF9933');
          sweepGrad.addColorStop(0.48, '#FFFFFF');
          sweepGrad.addColorStop(0.52, '#FFFFFF');
          sweepGrad.addColorStop(1, '#138808');

          c.fillStyle = sweepGrad;
          c.fillText(title[i], xOff, charY);
          c.restore();

          xOff += charW; // Step boundary correctly centered
        }

        if (t > 13.0) {
          const subAlpha = clamp((t - 13.0) * 2, 0, 1);
          c.save();
          c.globalAlpha = subAlpha;
          c.fillStyle = '#ffd700';
          c.textAlign = 'center';
          c.font = `500 ${fontSize * 0.65}px 'Georgia', serif`;
          c.fillText("जय हिन्द", W * 0.5, titleY + fontSize * 1.1);
          c.restore();
        }

        c.restore();
      }
    };

    /* ═══════════════════════════════════════════════════════════
       LAYER 10: PARTICLES ENGINE (Dust + Spectacular sky-wide Tricolor Rain)
       ═══════════════════════════════════════════════════════════ */
    const spawnParticles = (t: number, elapsed: number) => {
      // 1. Fog Dust (tp=1: Slow, large, low opacity)
      if (Math.random() < 0.12) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = H * 0.6 + Math.random() * H * 0.3;
          p.vx = (Math.random() - 0.5) * 0.2; p.vy = -0.05 - Math.random() * 0.05;
          p.life = 8; p.ml = 8; p.sz = 35 + Math.random() * 40;
          p.r = 230; p.g = 235; p.b = 245; p.a = 0.05; p.tp = 1;
        }
      }

      // 2. Gold Dust (tp=5: floats upwards with noise turbulence)
      if (t > 4.0 && Math.random() < 0.4) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = H + 10;
          p.vx = (Math.random() - 0.5) * 0.5; p.vy = -0.4 - Math.random() * 0.7;
          p.life = 6; p.ml = 6; p.sz = 2.0 + Math.random() * 3.5;
          p.r = 255; p.g = 215; p.b = 0; p.a = 0.78; p.tp = 5;
        }
      }

      // 3. Solar Particles (tp=6: diagonally drifting glowing rays)
      if (t > 5.0 && Math.random() < 0.3) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = W * 0.5 + (Math.random() - 0.5) * 100; p.y = baseY - gateH * 0.4;
          p.vx = 1.5 + Math.random() * 2.0; p.vy = 1.0 + Math.random() * 1.5;
          p.life = 4; p.ml = 4; p.sz = 3.0 + Math.random() * 4.0;
          p.r = 255; p.g = 245; p.b = 200; p.a = 0.9; p.tp = 6;
        }
      }

      // 4. Tricolor Confetti (tp=2: paper falling under gravity, beautifully variegated 5px-9px)
      if (t >= 3.2 && t < 11.5) {
        const rainCount = 4;
        for (let i = 0; i < rainCount; i++) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = Math.random() * W; p.y = -20 - Math.random() * 30; // Random offset to prevent clumping
            p.vx = (Math.random() - 0.5) * 0.2; // Tiny lateral drift
            p.vy = 1.8 + Math.random() * 1.8; // Steady rainfall descent
            p.life = 6; p.ml = 6; p.sz = 5 + Math.random() * 4; // Variegated Size strictly between 5px and 9px
            p.rot = Math.random() * Math.PI * 2; p.rs = (Math.random() - 0.5) * 0.08;
            const rand = Math.random();
            if (rand < 0.34) { p.r = 255; p.g = 153; p.b = 51; }
            else if (rand < 0.67) { p.r = 255; p.g = 255; p.b = 255; }
            else { p.r = 19; p.g = 136; p.b = 8; }
            p.a = 0.9; p.tp = 2;
          }
        }
      }

      // 5. Torch Embers (tp=3: hot orange, rising quickly near the flame)
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

        if (p.tp === 4) { // Smoke
          p.x += p.vx; p.y += p.vy;
          p.sz += 0.45; p.vx *= 0.985; p.vy *= 0.985;
        } else if (p.tp === 2) { // Confetti falling with wind drift
          // FIX: Soft vertical rainfall descent (Dampens wind shaking completely)
          p.vy += 0.050; // High gravity pull downwards
          p.vy *= 0.980; // High terminal velocity drag
          p.vx = p.vx * 0.92 + Math.sin(elapsed * 0.6 + p.y * 0.015) * 0.015; // Extremely reduced 10x smaller sway
          p.x += p.vx; p.y += p.vy;
          p.rot += p.rs;
        } else if (p.tp === 5) { // Gold Dust (FBM flow noise)
          p.vy *= 0.99;
          p.vx = p.vx * 0.95 + noise.n2(elapsed * 0.5 + p.y * 0.01, p.turbOff) * 0.15;
          p.x += p.vx; p.y += p.vy;
        } else if (p.tp === 6) { // Solar (straight fast diagonal)
          p.x += p.vx; p.y += p.vy;
        } else { // Fog and Embers
          p.x += p.vx; p.y += p.vy;
        }

        if (p.life <= 0 || p.x < -120 || p.x > W + 120 || p.y > H + 120) p.on = false;
      }
    };

    const drawParticles = () => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue;
        const alpha = clamp(p.life / p.ml, 0, 1) * p.a;

        c.save();
        c.globalAlpha = alpha;

        if (p.tp === 4) { // Jet Smoke Renderer
          c.globalCompositeOperation = 'screen';
          const smokeGrad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
          smokeGrad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.35)`);
          smokeGrad.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = smokeGrad;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 2) { // Confetti solid shape renderer
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2);
        } else if (p.tp === 5) { // Gold Dust sparkles (highly bright)
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(255, 215, 0, ${alpha})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        } else if (p.tp === 6) { // Solar Particles (radiant diagonal streaks)
          c.globalCompositeOperation = 'screen';
          c.strokeStyle = `rgba(255, 230, 160, ${alpha * 0.4})`;
          c.lineWidth = p.sz * 0.5;
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
          c.stroke();
        } else { // Embers & Fog Dust
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill();
        }

        c.restore();
      }
    };

    // CHROMATIC ABERRATION
    const drawChromaticAberration = () => {
      c.save();
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.015;
      c.drawImage(cv, -1.5, 0, W, H);
      c.globalAlpha = 0.012;
      c.drawImage(cv, 1.5, 0, W, H);
      c.restore();
    };

    // POST FX (Film Grain & Vignette)
    const drawPostFX = () => {
      c.save();
      c.globalCompositeOperation = 'soft-light';
      const grade = c.createLinearGradient(0, 0, W, H);
      grade.addColorStop(0, 'rgba(255, 140, 50, 0.18)');
      grade.addColorStop(1, 'rgba(0, 50, 100, 0.25)');
      c.fillStyle = grade; c.fillRect(0, 0, W, H);
      c.restore();

      const vignette = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
      c.fillStyle = vignette; c.fillRect(0, 0, W, H);

      c.save();
      c.globalCompositeOperation = 'overlay';
      c.globalAlpha = 0.03;
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0, 0, W, H); }
      c.restore();
    };

    /* ═══════════════════════════════════════════════════════════
       ANIMATION LOOP (Cinematic Cameras and Handheld breathe)
       ═══════════════════════════════════════════════════════════ */
    let prevTime = 0;
    const loop = (now: number) => {
      if (!t0.current) { t0.current = now; prevTime = now; }
      const t = (now - t0.current) / 1000;
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      if (t >= DUR) {
        if (!done.current) { done.current = true; cbR.current?.(); }
        return;
      }

      spawnParticles(t, now / 1000);
      updateParticles(dt, now / 1000);

      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, H);

      // Cinematic Camera: Handheld breathing & shake decay
      cameraShake *= 0.92; // Decay factor
      const camDollyZ = lerp(1.0, 1.10, eOE(t / DUR)); // Ultra-slow dolly zoom
      const breatheX = Math.sin(t * 0.4) * 2 + (Math.random() - 0.5) * cameraShake;
      const breatheY = Math.cos(t * 0.3) * 1.5 + (Math.random() - 0.5) * cameraShake;
      const camRot = Math.sin(t * 0.15) * 0.003;

      c.save();
      c.translate(W / 2 + breatheX, H / 2 + breatheY);
      c.rotate(camRot);
      c.scale(camDollyZ, camDollyZ);
      c.translate(-W / 2, -H / 2);

      const sceneAlpha = t < 11.5 ? 1 : clamp(1 - (t - 11.5) * 1.8, 0, 1);

      // Layer Assembly Sequence via encapsulated renderer object (Secure Reference Binding)
      renderer.sky(t, sceneAlpha);
      renderer.stars(t, sceneAlpha);
      renderer.wavingFlagAndChakra(t, now / 1000, sceneAlpha);
      renderer.indiaGate(t, sceneAlpha);
      renderer.volumetricLighting(t, sceneAlpha); // UEFI-style god rays
      renderer.torch(t, now / 1000, sceneAlpha);
      renderer.jetsAndTrails(t, sceneAlpha);
      drawParticles();
      renderer.doves(t, now / 1000, sceneAlpha);

      c.restore();

      // EPIC ENDING TRANSITION: Solid tricolor backdrop expansion (t >= 11.5s)
      if (t >= 11.5) {
        const bgFade = clamp((t - 11.5) * 1.8, 0, 1);
        c.save();
        c.globalAlpha = bgFade;
        const bgGrad = c.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#060810');
        bgGrad.addColorStop(1, '#0c101c');
        c.fillStyle = bgGrad;
        c.fillRect(0, 0, W, H);
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
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        zIndex: 50,
      }}
    />
  );
}
