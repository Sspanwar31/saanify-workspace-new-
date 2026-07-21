'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   2027 CINEMATIC ENGINE — Republic Day Intro
   Fixes: Clean dove flight, solid tricolor confetti, reduced glow
   ═══════════════════════════════════════════════════════════════ */

interface Particle {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  life: number; ml: number; sz: number; color: string; tp: number;
  rot: number; rs: number; on: boolean;
  r: number; g: number; b: number; a: number;
  prevX: number; prevY: number;
  turbOff: number; mass: number; glow: number;
}

interface Jet {
  x: number; y: number; scale: number; smokeColor: string;
  vx: number; vy: number; active: boolean;
  trail: { x: number; y: number; a: number }[];
}

interface Cloud {
  x: number; y: number; sz: number; speed: number; opacity: number;
  nOff: number;
  blobs: { ox: number; oy: number; r: number; a: number }[];
}

interface SittingDove {
  x: number; y: number; vx: number; vy: number; wing: number;
  state: 'sitting' | 'flying' | 'gone';
  side: 'left' | 'right';
  bobOff: number; flockIdx: number;
}

interface Firework {
  x: number; y: number; vy: number;
  state: 'rising' | 'burst';
  burstT: number;
  col: { r: number; g: number; b: number };
  pts: { x: number; y: number; vx: number; vy: number; life: number; ml: number; sz: number }[];
}

interface LightLeak {
  x: number; y: number; sz: number; intensity: number;
  life: number; ml: number; col: string; angle: number;
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
  fbm(x: number, y: number, oct: number = 4): number {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { v += a * this.n2(x * f, y * f); a *= 0.5; f *= 2; }
    return v;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EASING & MATH
   ═══════════════════════════════════════════════════════════════ */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const eOB = (t: number) => { const n = 7.5625, d = 2.75; if (t < 1/d) return n*t*t; if (t < 2/d) return n*(t-=1.5/d)*t+0.75; if (t < 2.5/d) return n*(t-=2.25/d)*t+0.9375; return n*(t-=2.625/d)*t+0.984375; };
const ss = (e0: number, e1: number, x: number) => { const t = clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); };
const aces = (x: number) => { const a=2.51,b=0.03,c2=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c2*x+d)+e),0,1); };

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void }

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
        x:0,y:0,z:0,vx:0,vy:0,vz:0, life:0,ml:1,sz:0,color:'',
        rot:0,rs:0,on:false,tp:0, r:255,g:153,b:51,a:0,
        prevX:0,prevY:0, turbOff:Math.random()*1000, mass:1, glow:0
      });
    }
    return a;
  }, []);

  const grab = useCallback((p: Particle[]) => {
    for (let i = 0; i < p.length; i++) if (!p[i].on) return p[i];
    return null;
  }, []);

  /* ─── ENHANCED AUDIO: Chorus + Reverb ─── */
  const triggerMilitaryAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const rvLen = ctx.sampleRate * 2.5;
      const rvBuf = ctx.createBuffer(2, rvLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = rvBuf.getChannelData(ch);
        for (let i = 0; i < rvLen; i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/rvLen,2.8)*0.15;
      }
      const reverb = ctx.createConvolver(); reverb.buffer = rvBuf;
      const rvG = ctx.createGain(); rvG.gain.value = 0.3;
      reverb.connect(rvG); rvG.connect(ctx.destination);
      const dryG = ctx.createGain(); dryG.gain.value = 0.7;
      dryG.connect(ctx.destination);

      for (let beat = 0; beat < 12; beat++) {
        const bt = ctx.currentTime + beat * 0.35;
        const kick = ctx.createOscillator();
        const kg = ctx.createGain();
        kick.frequency.setValueAtTime(100, bt);
        kick.frequency.exponentialRampToValueAtTime(18, bt + 0.15);
        kg.gain.setValueAtTime(0.35, bt);
        kg.gain.exponentialRampToValueAtTime(0.001, bt + 0.18);
        kick.connect(kg); kg.connect(dryG); kg.connect(reverb);
        kick.start(bt); kick.stop(bt + 0.18);

        if (beat % 2 === 1) {
          const bufSz = ctx.sampleRate * 0.1;
          const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < bufSz; i++) d[i] = Math.random()*2-1;
          const ns = ctx.createBufferSource(); ns.buffer = buf;
          const ng = ctx.createGain();
          ng.gain.setValueAtTime(0.12, bt);
          ng.gain.exponentialRampToValueAtTime(0.001, bt + 0.1);
          const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=2500;
          ns.connect(hp); hp.connect(ng); ng.connect(dryG); ng.connect(reverb);
          ns.start(bt); ns.stop(bt + 0.1);
        }
      }

      [130.81,164.81,196.00,261.63,329.63,392.00].forEach((freq, i) => {
        [freq*0.998, freq*1.002].forEach(f => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = i < 3 ? 'sawtooth' : 'triangle';
          osc.frequency.value = f;
          const flt = ctx.createBiquadFilter(); flt.type='lowpass';
          flt.frequency.setValueAtTime(400, ctx.currentTime);
          flt.frequency.linearRampToValueAtTime(800, ctx.currentTime+2);
          flt.frequency.linearRampToValueAtTime(600, ctx.currentTime+5);
          flt.Q.value = 1.5;
          const vol = 0.018/(i*0.35+1);
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(vol, ctx.currentTime+1.5);
          g.gain.linearRampToValueAtTime(vol*1.3, ctx.currentTime+3.5);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+6.0);
          osc.connect(flt); flt.connect(g); g.connect(dryG); g.connect(reverb);
          osc.start(); osc.stop(ctx.currentTime+6.0);
        });
      });
    } catch (e) { /* silent */ }
  }, []);

  /* ═══════════════════════════════════════════════════════════
     MAIN CANVAS LIFECYCLE
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    triggerMilitaryAudio();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const rsz = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    rsz(); window.addEventListener('resize', rsz);

    const noise = new SimplexNoise(2613);

    /* Dynamic film grain 512×512 */
    const grainCv = document.createElement('canvas');
    grainCv.width = 512; grainCv.height = 512;
    const gc = grainCv.getContext('2d')!;
    const refreshGrain = () => {
      const gd = gc.createImageData(512, 512);
      for (let i = 0; i < gd.data.length; i += 4) {
        const v = Math.random()*255|0;
        gd.data[i]=v; gd.data[i+1]=v; gd.data[i+2]=v; gd.data[i+3]=255;
      }
      gc.putImageData(gd, 0, 0);
    };
    refreshGrain();
    let grainFrame = 0;

    const pl = mkPool();

    /* Multi-blob clouds */
    const clouds: Cloud[] = Array.from({ length: 8 }, (_, ci) => ({
      x: Math.random()*W*1.5 - W*0.25,
      y: H*0.05 + Math.random()*H*0.35,
      sz: 150 + Math.random()*200,
      speed: 0.1 + Math.random()*0.25,
      opacity: 0.1 + Math.random()*0.2,
      nOff: ci*100,
      blobs: Array.from({ length: 5+(Math.random()*4|0) }, () => ({
        ox: (Math.random()-0.5)*0.8,
        oy: (Math.random()-0.5)*0.4,
        r: 0.3 + Math.random()*0.5,
        a: 0.3 + Math.random()*0.5
      }))
    }));

    /* Jets with trail buffers */
    const jets: Jet[] = [
      { x:-W*0.3, y:H*0.16, scale:0.95, smokeColor:'#FF9933', vx:5.5, vy:0.8, active:true, trail:[] },
      { x:W+W*0.3, y:H*0.20, scale:0.90, smokeColor:'#FFFFFF', vx:-5.5, vy:0.6, active:true, trail:[] },
      { x:-W*0.45, y:H*0.24, scale:0.85, smokeColor:'#138808', vx:5.5, vy:0.4, active:true, trail:[] }
    ];

    /* Stars */
    const starI: number[] = [];
    for (let i = 0; i < 150; i++) {
      const p = pl[i]; p.on=true; p.tp=0;
      p.x=Math.random()*W; p.y=Math.random()*H*0.75;
      p.vx=0; p.vy=0; p.sz=Math.random()*1.5+0.2; p.ml=999; p.life=999;
      p.r=180; p.g=200; p.b=255; p.a=Math.random()*0.4+0.05;
      p.prevX=p.x; p.prevY=p.y; p.rot=0; p.rs=0;
      starI.push(i);
    }

    /* India Gate metrics */
    const sc = Math.min(window.innerWidth, window.innerHeight);
    const gateH = sc * 0.66;
    const gateW = gateH * 0.84;
    const baseY = window.innerHeight * 0.82;
    const cx = window.innerWidth * 0.5;
    const pillarH = gateH * 0.72;
    const pillarY = baseY - 32 - pillarH;

    /* ═══════════════════════════════════════════════════════════
       DOVES — FIXED: Clean directional flight, no flocking confusion
       Left pigeons: fly RIGHT + UP, exit screen right/top
       Right pigeons: fly LEFT + UP, exit screen left/top
       ═══════════════════════════════════════════════════════════ */
    const dovesList: SittingDove[] = [];
    for (let i = 0; i < 7; i++) {
      dovesList.push({
        x: cx - gateW * 0.42 + (gateW * 0.16) * (i / 6),
        y: pillarY - 2, vx: 0, vy: 0,
        wing: Math.random() * Math.PI * 2,
        state: 'sitting', side: 'left',
        bobOff: Math.random() * 10, flockIdx: i
      });
    }
    for (let i = 0; i < 7; i++) {
      dovesList.push({
        x: cx + gateW * 0.26 + (gateW * 0.16) * (i / 6),
        y: pillarY - 2, vx: 0, vy: 0,
        wing: Math.random() * Math.PI * 2,
        state: 'sitting', side: 'right',
        bobOff: Math.random() * 10, flockIdx: i + 7
      });
    }

    /* Fireworks */
    const fireworks: Firework[] = [];
    const fwCols = [{r:255,g:153,b:51},{r:255,g:255,b:255},{r:19,g:136,b:8},{r:255,g:215,b:0},{r:255,g:100,b:100}];

    /* Light leaks */
    const lightLeaks: LightLeak[] = [];

    /* Sun position */
    const sunPos = (t: number) => ({ x: lerp(W*0.3,W*0.5,eOE(t/10)), y: lerp(H*1.2,H*0.15,eOE(t/10)) });

    /* ═══════════════════════════════════════════════════════════
       ALL LAYER DRAWERS
       ═══════════════════════════════════════════════════════════ */

    // LAYER 1: SKY — FIX: Reduced gold horizon glow
    const drawSky = (t: number, elapsed: number, sceneAlpha: number) => {
      c.save(); c.globalAlpha = sceneAlpha;
      const p1 = clamp(t/6,0,1), p2 = clamp((t-4)/6,0,1), p3 = clamp((t-8)/7,0,1);
      const nV = noise.fbm(t*0.1, 0, 2)*0.1;
      const r = aces(lerp(lerp(8,35,p1),lerp(255,255,p3),p2)/255+nV);
      const g = aces(lerp(lerp(12,55,p1),lerp(130,195,p3),p2)/255+nV);
      const b = aces(lerp(lerp(30,85,p1),lerp(50,120,p3),p2)/255+nV);
      const grad = c.createLinearGradient(0,0,0,H);
      grad.addColorStop(0, `rgb(${r*0.4*255|0},${g*0.4*255|0},${b*0.7*255|0})`);
      grad.addColorStop(0.35, `rgb(${r*0.65*255|0},${g*0.55*255|0},${b*0.5*255|0})`);
      grad.addColorStop(0.65, `rgb(${r*0.9*255|0},${g*0.75*255|0},${b*0.4*255|0})`);
      grad.addColorStop(1, `rgb(${r*255|0},${g*0.85*255|0},${b*0.3*255|0})`);
      c.fillStyle = grad; c.fillRect(0,0,W,H);

      // FIX: Reduced horizon glow intensity (was 0.15/0.06, now 0.05/0.02)
      const sun = sunPos(t);
      if (sun.y < H) {
        const hG = c.createRadialGradient(sun.x, Math.min(sun.y,H*0.9), 0, sun.x, H*0.9, H*0.5);
        hG.addColorStop(0, `rgba(255,200,120,${0.05*sceneAlpha})`);
        hG.addColorStop(0.5, `rgba(255,150,80,${0.02*sceneAlpha})`);
        hG.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = hG; c.fillRect(0,0,W,H);
      }
      c.restore();
    };

    // LAYER 2: MULTI-BLOB CLOUDS
    const drawClouds = (t: number, sceneAlpha: number) => {
      c.save(); c.globalAlpha = sceneAlpha;
      clouds.forEach(cl => {
        cl.x += cl.speed + noise.n2(t*0.2, cl.nOff)*0.3;
        if (cl.x - cl.sz > W) cl.x = -cl.sz;
        cl.blobs.forEach(bl => {
          const lx = cl.x + bl.ox*cl.sz;
          const ly = cl.y + bl.oy*cl.sz + noise.n2(t*0.3, cl.nOff+bl.ox*10)*8;
          const lr = cl.sz * bl.r;
          const a = cl.opacity * bl.a;
          const g = c.createRadialGradient(lx,ly,0,lx,ly,lr);
          g.addColorStop(0, `rgba(255,240,225,${a})`);
          g.addColorStop(0.4, `rgba(255,215,195,${a*0.5})`);
          g.addColorStop(1, 'rgba(255,200,170,0)');
          c.fillStyle = g; c.beginPath(); c.arc(lx,ly,lr,0,Math.PI*2); c.fill();
        });
      });
      c.restore();
    };

    // LAYER 2.5: TRICOLOR AURORA
    const drawAurora = (t: number, sceneAlpha: number) => {
      if (t < 4.0 || t > 11.0) return;
      const aA = ss(4.0,6.0,t)*ss(11.0,9.0,t)*0.25*sceneAlpha;
      if (aA <= 0) return;
      c.save(); c.globalAlpha = aA; c.globalCompositeOperation = 'screen';
      const cols = [{r:255,g:153,b:51},{r:255,g:255,b:255},{r:19,g:136,b:8}];
      cols.forEach((col, ci) => {
        c.beginPath();
        const bY = H*(0.15+ci*0.08);
        c.moveTo(0, bY+60);
        for (let x = 0; x <= W; x += 8) {
          const n1 = noise.fbm(x*0.003+t*0.15, ci*3.7+t*0.05, 3);
          const n2 = noise.n2(x*0.008+t*0.1, ci*5.1);
          c.lineTo(x, bY + n1*50 + n2*20);
        }
        c.lineTo(W, bY+80); c.lineTo(0, bY+80); c.closePath();
        const aG = c.createLinearGradient(0, bY-50, 0, bY+80);
        aG.addColorStop(0, `rgba(${col.r},${col.g},${col.b},0)`);
        aG.addColorStop(0.3, `rgba(${col.r},${col.g},${col.b},0.4)`);
        aG.addColorStop(0.6, `rgba(${col.r},${col.g},${col.b},0.15)`);
        aG.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
        c.fillStyle = aG; c.fill();
      });
      c.restore();
    };

    // LAYER 3: VOLUMETRIC FOG
    const drawFog = (t: number, elapsed: number, sceneAlpha: number) => {
      const fI = clamp(2.5-(t/4),0,1)*sceneAlpha;
      if (fI <= 0) return;
      c.save(); c.globalAlpha = fI; c.globalCompositeOperation = 'screen';
      for (let i = 0; i < 6; i++) {
        const bY = H*(0.55+i*0.06);
        const nOff = noise.n2(elapsed*0.15, i*2.3)*40;
        const fG = c.createRadialGradient(W*0.5+nOff, bY, 0, W*0.5+nOff, bY, W*0.7);
        fG.addColorStop(0, `rgba(220,230,245,${0.08-i*0.01})`);
        fG.addColorStop(0.6, 'rgba(200,210,230,0.04)');
        fG.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = fG; c.fillRect(0, bY-100, W, 200);
      }
      const hG = c.createLinearGradient(0, H*0.7, 0, H);
      hG.addColorStop(0, 'rgba(180,190,210,0)');
      hG.addColorStop(0.5, 'rgba(200,210,225,0.15)');
      hG.addColorStop(1, 'rgba(220,225,235,0.3)');
      c.fillStyle = hG; c.fillRect(0, H*0.7, W, H*0.3);
      c.restore();
    };

    // LAYER 3.5: GOD RAYS
    const drawGodRays = (t: number, sceneAlpha: number) => {
      if (t < 3.0 || t > 12.0) return;
      const sun = sunPos(t);
      if (sun.y > H*0.8) return;
      const rA = ss(3.0,5.0,t)*ss(12.0,10.0,t)*0.08*sceneAlpha;
      if (rA <= 0) return;
      c.save(); c.globalAlpha = rA; c.globalCompositeOperation = 'screen';
      for (let i = 0; i < 12; i++) {
        const baseAng = (i/12)*Math.PI - Math.PI*0.5;
        const ang = baseAng + noise.n2(t*0.3, i*1.7)*0.08;
        const rayLen = H * (0.6 + noise.n2(t*0.2, i*2.3)*0.2);
        const rayW = 0.03 + noise.n2(t*0.15, i*3.1)*0.015;
        c.beginPath();
        c.moveTo(sun.x, sun.y);
        c.lineTo(sun.x + Math.cos(ang-rayW)*rayLen, sun.y + Math.sin(ang-rayW)*rayLen);
        c.lineTo(sun.x + Math.cos(ang+rayW)*rayLen, sun.y + Math.sin(ang+rayW)*rayLen);
        c.closePath();
        const rG = c.createLinearGradient(sun.x, sun.y, sun.x+Math.cos(ang)*rayLen, sun.y+Math.sin(ang)*rayLen);
        rG.addColorStop(0, 'rgba(255,220,150,0.5)');
        rG.addColorStop(0.4, 'rgba(255,180,100,0.15)');
        rG.addColorStop(1, 'rgba(255,150,80,0)');
        c.fillStyle = rG; c.fill();
      }
      c.restore();
    };

    // LAYER 4: INDIA GATE
    const drawIndiaGate = (t: number, sceneAlpha: number) => {
      const reveal = clamp((t-1.0)*0.4, 0, 1);
      c.save(); c.globalAlpha = reveal*sceneAlpha;
      const baseCol = '#c1805b';
      const shadowCol = '#6d3c26';
      const hiCol = '#eed2bc';

      const draw3DBlock = (x:number, y:number, w:number, h:number, d:number) => {
        const fG = c.createLinearGradient(x,y,x,y+h);
        fG.addColorStop(0, hiCol); fG.addColorStop(0.3, baseCol); fG.addColorStop(1, shadowCol);
        c.fillStyle = fG; c.fillRect(x,y,w,h);
        c.save(); c.globalAlpha = 0.08; c.strokeStyle = '#000000'; c.lineWidth = 0.5;
        for (let ly = y+8; ly < y+h; ly += 12) {
          c.beginPath(); c.moveTo(x, ly); c.lineTo(x+w, ly); c.stroke();
        }
        c.restore();
        const sG = c.createLinearGradient(x+w,y,x+w+d,y+h);
        sG.addColorStop(0, shadowCol); sG.addColorStop(1, '#3b1c10');
        c.fillStyle = sG;
        c.beginPath(); c.moveTo(x+w,y); c.lineTo(x+w+d,y+d); c.lineTo(x+w+d,y+h+d); c.lineTo(x+w,y+h); c.closePath(); c.fill();
        c.fillStyle = hiCol;
        c.beginPath(); c.moveTo(x,y); c.lineTo(x+d,y-d); c.lineTo(x+w+d,y-d); c.lineTo(x+w,y); c.closePath(); c.fill();
      };

      draw3DBlock(cx-gateW*0.52, baseY-16, gateW*1.04, 16, 5);
      draw3DBlock(cx-gateW*0.48, baseY-32, gateW*0.96, 16, 4);

      const pW = gateW*0.26, pH = gateH*0.72, pY = baseY-32-pH;
      draw3DBlock(cx-gateW*0.46, pY, pW, pH, 6);
      draw3DBlock(cx+gateW*0.46-pW, pY, pW, pH, 6);

      c.save(); c.globalAlpha = 0.1; c.strokeStyle = '#000000'; c.lineWidth = 0.8;
      for (let fi = 0; fi < 4; fi++) {
        const fx1 = cx-gateW*0.46 + pW*(fi+1)/5;
        c.beginPath(); c.moveTo(fx1, pY); c.lineTo(fx1, pY+pH); c.stroke();
        const fx2 = cx+gateW*0.46-pW + pW*(fi+1)/5;
        c.beginPath(); c.moveTo(fx2, pY); c.lineTo(fx2, pY+pH); c.stroke();
      }
      c.restore();

      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.fillRect(cx-gateW*0.48+pW-8, pY, 8, pH);
      c.fillRect(cx+gateW*0.48-pW, pY, 8, pH);

      const cAW = gateW*0.44, cAH = gateH*0.54, cAY = baseY-32-cAH;
      c.save(); c.beginPath();
      c.moveTo(cx-cAW/2, baseY-32);
      c.lineTo(cx-cAW/2, cAY+cAW/2);
      c.arc(cx, cAY+cAW/2, cAW/2, Math.PI, 0, false);
      c.lineTo(cx+cAW/2, baseY-32); c.closePath();
      const aS = c.createRadialGradient(cx, cAY+cAW/2, cAW*0.1, cx, cAY+cAW/2, cAW*0.5);
      aS.addColorStop(0, 'rgba(0,0,0,0)'); aS.addColorStop(1, 'rgba(0,0,0,0.65)');
      c.fillStyle = aS; c.fill(); c.restore();

      draw3DBlock(cx-gateW*0.5, pY-gateH*0.1, gateW*1.0, gateH*0.1, 8);

      c.save(); c.globalAlpha = 0.15;
      const dentilY = pY-gateH*0.1;
      for (let di = 0; di < 20; di++) {
        const dx = cx-gateW*0.5 + (gateW*1.0)*(di/20) + 2;
        c.fillStyle = shadowCol;
        c.fillRect(dx, dentilY, gateW*1.0/20-3, 4);
      }
      c.restore();

      draw3DBlock(cx-gateW*0.42, pY-gateH*0.22, gateW*0.84, gateH*0.12, 10);

      c.beginPath();
      c.moveTo(cx-gateW*0.2, pY-gateH*0.22);
      c.quadraticCurveTo(cx, pY-gateH*0.35, cx+gateW*0.2, pY-gateH*0.22);
      c.closePath(); c.fillStyle = shadowCol; c.fill();

      [cx-gateW*0.46, cx+gateW*0.46-pW].forEach(px => {
        c.fillStyle = hiCol;
        c.fillRect(px-2, pY-4, pW+4, 4);
        c.fillStyle = shadowCol;
        c.fillRect(px-2, pY+pH, pW+4, 4);
      });

      c.restore();
    };

    // LAYER 4.5: GROUND REFLECTION — FIX: Reduced flame reflection glow
    const drawGroundReflection = (t: number, sceneAlpha: number) => {
      if (t < 2.0) return;
      const rA = clamp((t-2.0)*0.3, 0, 0.1)*sceneAlpha;
      if (rA <= 0) return;
      c.save(); c.globalAlpha = rA; c.globalCompositeOperation = 'screen';
      const rG = c.createLinearGradient(0, baseY, 0, baseY+60);
      rG.addColorStop(0, 'rgba(193,128,91,0.25)');
      rG.addColorStop(0.3, 'rgba(193,128,91,0.08)');
      rG.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rG; c.fillRect(cx-gateW*0.6, baseY, gateW*1.2, 60);

      // FIX: Reduced from 0.25 to 0.08
      if (t > 2.0) {
        const fR = c.createRadialGradient(W*0.5, baseY+15, 0, W*0.5, baseY+15, 40);
        fR.addColorStop(0, 'rgba(255,120,20,0.08)');
        fR.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = fR; c.fillRect(W*0.5-40, baseY, 80, 40);
      }
      c.restore();
    };

    // LAYER 5: AMAR JAWAN JYOTI — FIX: Reduced all glow radii and intensity
    const drawTorch = (t: number, elapsed: number, sceneAlpha: number) => {
      if (t < 2.0) return;
      const tx = W*0.5, ty = H*0.795;
      const fA = clamp((t-2.0)*1.5, 0, 1)*sceneAlpha;
      c.save(); c.globalAlpha = fA; c.globalCompositeOperation = 'lighter';

      // FIX: Atmospheric outer glow — radius 180→100, intensity 0.3→0.12
      const oG = c.createRadialGradient(tx, ty-15, 0, tx, ty-15, 100);
      oG.addColorStop(0, 'rgba(255,100,10,0.12)');
      oG.addColorStop(0.5, 'rgba(255,50,0,0.03)');
      oG.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = oG; c.fillRect(tx-100, ty-115, 200, 200);

      // FIX: Inner glow — radius 140→70, intensity 0.9→0.4
      const iG = c.createRadialGradient(tx, ty, 0, tx, ty, 70);
      iG.addColorStop(0, 'rgba(255,120,20,0.4)');
      iG.addColorStop(0.4, 'rgba(255,60,5,0.12)');
      iG.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = iG; c.fillRect(tx-70, ty-70, 140, 140);

      // Outer flame
      const f1 = Math.sin(elapsed*28)*5;
      const h1 = 42+f1, w1 = 12;
      const fg1 = c.createLinearGradient(tx, ty, tx, ty-h1);
      fg1.addColorStop(0, 'rgba(255,180,50,0.7)');
      fg1.addColorStop(0.5, 'rgba(255,80,0,0.35)');
      fg1.addColorStop(1, 'rgba(200,0,0,0)');
      c.fillStyle = fg1;
      c.beginPath(); c.moveTo(tx-w1, ty);
      c.quadraticCurveTo(tx-w1*0.5, ty-h1*0.5, tx, ty-h1);
      c.quadraticCurveTo(tx+w1*0.5, ty-h1*0.5, tx+w1, ty);
      c.closePath(); c.fill();

      // Inner flame
      const f2 = Math.sin(elapsed*35+1)*3;
      const h2 = 30+f2, w2 = 7;
      const fg2 = c.createLinearGradient(tx, ty, tx, ty-h2);
      fg2.addColorStop(0, '#ffffff');
      fg2.addColorStop(0.2, 'rgba(255,220,100,0.95)');
      fg2.addColorStop(0.6, 'rgba(255,120,20,0.6)');
      fg2.addColorStop(1, 'rgba(255,50,0,0)');
      c.fillStyle = fg2;
      c.beginPath(); c.moveTo(tx-w2, ty);
      c.quadraticCurveTo(tx-w2*0.3, ty-h2*0.5, tx, ty-h2);
      c.quadraticCurveTo(tx+w2*0.3, ty-h2*0.5, tx+w2, ty);
      c.closePath(); c.fill();

      // Core
      const f3 = Math.sin(elapsed*42+2)*2;
      const h3 = 18+f3, w3 = 3;
      const fg3 = c.createLinearGradient(tx, ty, tx, ty-h3);
      fg3.addColorStop(0, '#ffffff');
      fg3.addColorStop(0.5, 'rgba(255,255,220,0.9)');
      fg3.addColorStop(1, 'rgba(255,200,100,0)');
      c.fillStyle = fg3;
      c.beginPath(); c.moveTo(tx-w3, ty);
      c.quadraticCurveTo(tx, ty-h3*0.6, tx, ty-h3);
      c.quadraticCurveTo(tx, ty-h3*0.6, tx+w3, ty);
      c.closePath(); c.fill();

      c.restore();
    };

    // LAYER 6 & 7: WAVING FLAG + ASHOKA CHAKRA
    const drawWavingFlagAndChakra = (t: number, elapsed: number, sceneAlpha: number) => {
      if (t < 3.0) return;
      const rA = clamp((t-3.0)*1.2, 0, 1)*sceneAlpha;
      const scV = Math.min(W, H);
      const fw = scV*0.38, fh = fw*0.66;
      const fx = W*0.5-fw/2, fy = H*0.44-fh/2;
      c.save(); c.globalAlpha = rA;

      const cols = 45, colW = fw/cols;
      for (let i = 0; i < cols; i++) {
        const xO = i*colW;
        const tX = fx+xO;
        const wave = Math.sin(i*0.22-elapsed*3.8)*8.5
                   + Math.sin(i*0.45-elapsed*5.2)*2.5
                   + noise.n2(i*0.15, elapsed*2.5)*3;
        const tY = fy+wave;
        const slope = Math.cos(i*0.22-elapsed*3.8);
        const shade = 0.85 + slope*0.15;

        const applyShade = (hex: string) => {
          const h = hex.replace('#','');
          const rr = parseInt(h.substring(0,2),16), gg = parseInt(h.substring(2,4),16), bb = parseInt(h.substring(4,6),16);
          return `rgb(${rr*shade|0},${gg*shade|0},${bb*shade|0})`;
        };

        c.fillStyle = applyShade('#FF9933');
        c.fillRect(tX, tY, colW+0.5, fh/3);
        c.fillStyle = applyShade('#FFFFFF');
        c.fillRect(tX, tY+fh/3, colW+0.5, fh/3);
        c.fillStyle = applyShade('#138808');
        c.fillRect(tX, tY+(fh*2)/3, colW+0.5, fh/3);
      }

      // Detailed Ashoka Chakra
      const cxV = fx+fw/2;
      const cyV = fy+fh/2 + (Math.sin(cols/2*0.22-elapsed*3.8)*8.5
                + Math.sin(cols/2*0.45-elapsed*5.2)*2.5
                + noise.n2(cols/2*0.15, elapsed*2.5)*3);
      const cr = fh*0.12;

      c.save(); c.translate(cxV, cyV); c.rotate(elapsed*0.6);
      c.strokeStyle = '#000080'; c.lineWidth = 3;
      c.beginPath(); c.arc(0,0,cr,0,Math.PI*2); c.stroke();
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(0,0,cr*0.82,0,Math.PI*2); c.stroke();
      c.lineWidth = 1.8;
      for (let i = 0; i < 24; i++) {
        const ang = (i/24)*Math.PI*2;
        c.beginPath();
        c.moveTo(Math.cos(ang)*cr*0.18, Math.sin(ang)*cr*0.18);
        c.lineTo(Math.cos(ang)*cr*0.78, Math.sin(ang)*cr*0.78);
        c.strokeStyle = '#000080'; c.stroke();
      }
      c.fillStyle = '#000080';
      c.beginPath(); c.arc(0,0,cr*0.18,0,Math.PI*2); c.fill();
      c.fillStyle = '#FFFFFF';
      c.beginPath(); c.arc(0,0,cr*0.07,0,Math.PI*2); c.fill();
      for (let i = 0; i < 24; i++) {
        const ang = (i/24)*Math.PI*2;
        c.fillStyle = '#000080';
        c.beginPath(); c.arc(Math.cos(ang)*cr*0.9, Math.sin(ang)*cr*0.9, 1.5, 0, Math.PI*2); c.fill();
      }
      c.restore();
      c.restore();
    };

    // LAYER 8 & 9: JETS
    const drawJetsAndTrails = (t: number, sceneAlpha: number) => {
      if (t < 2.5 || t > 9.0) return;
      c.save(); c.globalAlpha = sceneAlpha;

      jets.forEach(jet => {
        jet.x += jet.vx; jet.y += jet.vy;

        jet.trail.push({ x: jet.x, y: jet.y, a: 1 });
        if (jet.trail.length > 20) jet.trail.shift();
        jet.trail.forEach(tp => tp.a *= 0.92);

        if (jet.trail.length > 2) {
          c.save(); c.globalCompositeOperation = 'screen';
          for (let i = 1; i < jet.trail.length; i++) {
            const tp = jet.trail[i];
            const tAlpha = tp.a * 0.3;
            if (tAlpha < 0.01) continue;
            const hex = jet.smokeColor.replace('#','');
            const rr = parseInt(hex.substring(0,2),16), gg = parseInt(hex.substring(2,4),16), bb = parseInt(hex.substring(4,6),16);
            c.strokeStyle = `rgba(${rr},${gg},${bb},${tAlpha})`;
            c.lineWidth = (i/jet.trail.length)*4*jet.scale;
            c.beginPath();
            c.moveTo(jet.trail[i-1].x, jet.trail[i-1].y);
            c.lineTo(tp.x, tp.y);
            c.stroke();
          }
          c.restore();
        }

        const nozzleX = jet.x - (jet.vx > 0 ? 32 : -32)*jet.scale;
        const nozzleY = jet.y + 2*jet.scale;

        if (Math.random() < 0.68) {
          const p = grab(pl); if (p) {
            p.on=true; p.x=nozzleX; p.y=nozzleY;
            p.vx=-jet.vx*0.12+(Math.random()-0.5)*0.35;
            p.vy=(Math.random()-0.5)*0.35;
            p.life=4.0; p.ml=4.0; p.sz=14*jet.scale+Math.random()*14;
            const hex=jet.smokeColor.replace('#','');
            p.r=parseInt(hex.substring(0,2),16); p.g=parseInt(hex.substring(2,4),16); p.b=parseInt(hex.substring(4,6),16);
            p.a=0.58; p.tp=4;
          }
        }

        // FIX: Jet trail particles also use solid shape (tp=2 draw handles it now)
        if (Math.random() < 0.90) {
          const p = grab(pl); if (p) {
            p.on=true; p.x=nozzleX; p.y=nozzleY+(Math.random()-0.5)*6;
            p.vx=-jet.vx*0.15+(Math.random()-0.5)*0.4;
            p.vy=0.6+Math.random()*1.2;
            p.life=5.0; p.ml=5.0; p.sz=3+Math.random()*3;
            const hex=jet.smokeColor.replace('#','');
            p.r=parseInt(hex.substring(0,2),16); p.g=parseInt(hex.substring(2,4),16); p.b=parseInt(hex.substring(4,6),16);
            p.a=0.9; p.tp=2;
            p.rot = Math.random()*Math.PI*2;
            p.rs = (Math.random()-0.5)*0.1;
          }
        }

        c.save();
        c.translate(jet.x, jet.y);
        c.rotate(Math.atan2(jet.vy, jet.vx));
        c.scale(jet.scale, jet.scale);

        const aG = c.createRadialGradient(-30,0,0,-30,0,30);
        aG.addColorStop(0, '#ffffff');
        aG.addColorStop(0.3, 'rgba(255,140,0,0.9)');
        aG.addColorStop(1, 'rgba(255,0,0,0)');
        c.fillStyle = aG; c.fillRect(-55,-12,35,24);

        c.fillStyle = '#1c1c1c';
        c.beginPath();
        c.moveTo(35,0); c.quadraticCurveTo(15,-4,-10,-5);
        c.lineTo(-24,-3); c.lineTo(-24,3); c.lineTo(-10,5);
        c.quadraticCurveTo(15,4,35,0);
        c.fill();

        const canG = c.createLinearGradient(5,-3,5,3);
        canG.addColorStop(0, 'rgba(130,200,255,0.9)');
        canG.addColorStop(1, 'rgba(60,140,220,0.8)');
        c.fillStyle = canG;
        c.beginPath(); c.ellipse(12,-1,10,3,0,0,Math.PI*2); c.fill();

        c.fillStyle = '#242424';
        c.beginPath(); c.moveTo(0,0); c.lineTo(-18,-26); c.lineTo(-24,-26); c.lineTo(-10,0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(0,0); c.lineTo(-18,26); c.lineTo(-24,26); c.lineTo(-10,0); c.closePath(); c.fill();

        c.fillStyle = '#2a2a2a';
        c.beginPath(); c.moveTo(-20,0); c.lineTo(-26,-12); c.lineTo(-28,-11); c.lineTo(-24,0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-20,0); c.lineTo(-26,12); c.lineTo(-28,11); c.lineTo(-24,0); c.closePath(); c.fill();

        c.restore();
      });
      c.restore();
    };

    // LAYER 10: PARTICLE SPAWN
    // FIX: Tricolor particles spawn as small (2px) and grow to 5px, with rotation
    const spawnParticles = (t: number, elapsed: number) => {
      // Ambient dust
      if (t > 1 && Math.random() < 0.25) {
        const p = grab(pl);
        if (p) {
          p.on=true; p.x=Math.random()*W; p.y=Math.random()*H;
          p.vx=Math.sin(elapsed+Math.random()*10)*0.25;
          p.vy=-0.2-Math.random()*0.25;
          p.life=5; p.ml=5; p.sz=1+Math.random()*1.5;
          p.r=255; p.g=210+Math.random()*45; p.b=160;
          p.a=0.35; p.tp=1;
        }
      }

      // FIX: Tricolor confetti — small solid shapes, chote se bade
      if (t >= 3.2 && t < 11.5) {
        for (let i = 0; i < 4; i++) {
          const p = grab(pl);
          if (p) {
            p.on=true; p.x=Math.random()*W; p.y=-10-Math.random()*15;
            const windX = noise.n2(elapsed*0.5, p.turbOff)*0.6;
            p.vx = windX;
            p.vy = 1.2+Math.random()*1.5;
            p.life=6.0; p.ml=6.0;
            // FIX: Start small (2px), grow to max (5px) over lifetime
            p.sz = 2;
            p.rot = Math.random()*Math.PI*2;
            p.rs = (Math.random()-0.5)*0.15; // Rotation speed

            const rand = Math.random();
            if (rand<0.34) { p.r=255; p.g=153; p.b=51; }       // Saffron
            else if (rand<0.67) { p.r=255; p.g=255; p.b=255; }  // White
            else { p.r=19; p.g=136; p.b=8; }                     // Green
            p.a=0.92; p.tp=2;
          }
        }
      }

      // Embers near flame
      if (t > 3 && Math.random() < 0.15) {
        const p = grab(pl);
        if (p) {
          p.on=true; p.x=W*0.5+(Math.random()-0.5)*20;
          p.y=H*0.79;
          p.vx=(Math.random()-0.5)*0.8;
          p.vy=-0.5-Math.random()*0.8;
          p.life=2.5; p.ml=2.5; p.sz=1+Math.random()*2;
          p.r=255; p.g=150+Math.random()*100; p.b=0;
          p.a=0.7; p.tp=3;
        }
      }
    };

    const updateParticles = (dt: number, elapsed: number) => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i];
        if (!p.on) continue;
        p.life -= dt;
        p.prevX = p.x; p.prevY = p.y;
        p.x += p.vx; p.y += p.vy;

        if (p.tp === 4) { // smoke
          p.sz += 0.45; p.vx *= 0.985; p.vy *= 0.985; p.life -= 0.012;
        } else if (p.tp === 2) { // FIX: Tricolor confetti — grow from 2→5, rotate, gentle sway
          p.vy += 0.035; // Slightly less gravity for floatier feel
          p.vy *= 0.99;
          const windX = noise.n2(elapsed*1.5+p.y*0.01, p.turbOff)*0.15;
          p.vx = p.vx*0.97 + windX;
          // Grow size: 2px at start → 5px at end of life
          const lifeRatio = 1 - (p.life / p.ml);
          p.sz = 2 + lifeRatio * 3;
          p.rot += p.rs; // Rotate the confetti
          p.life -= 0.007;
        } else if (p.tp === 3) { // embers
          p.vy -= 0.015; p.vx += (Math.random()-0.5)*0.15; p.life -= 0.018;
        } else { // dust
          p.vx += noise.n2(elapsed*0.5, p.turbOff)*0.02;
          p.life -= 0.005;
        }

        if (p.life <= 0 || p.x < -120 || p.x > W+120 || p.y > H+120) p.on = false;
      }
    };

    const drawParticles = () => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i];
        if (!p.on) continue;
        const alpha = clamp(p.life/p.ml, 0, 1)*p.a;

        if (p.tp === 4) { // smoke — keep as soft blob
          c.save(); c.globalCompositeOperation = 'screen';
          const g = c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.sz);
          g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = g; c.fillRect(p.x-p.sz,p.y-p.sz,p.sz*2,p.sz*2);
          c.restore();
        } else if (p.tp === 1 || p.tp === 3) { // dust & embers
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = alpha;
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.beginPath(); c.arc(p.x,p.y,p.sz,0,Math.PI*2); c.fill();
          if (p.tp === 3) {
            const eg = c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.sz*3);
            eg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha*0.3})`);
            eg.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = eg; c.fillRect(p.x-p.sz*3,p.y-p.sz*3,p.sz*6,p.sz*6);
          }
          c.restore();
        } else if (p.tp === 2) {
          // ═══════════════════════════════════════════════════════
          // FIX: Solid tricolor confetti shapes (NOT blurry blobs)
          // Diamond/rectangle shapes that rotate, clearly saffron/white/green
          // ═══════════════════════════════════════════════════════
          c.save();
          c.globalAlpha = alpha;
          c.translate(p.x, p.y);
          c.rotate(p.rot);

          const s = p.sz; // 2→5 range

          // Solid fill — no radial gradient blur
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;

          // Alternate between diamond and rectangle shapes for variety
          if ((p.turbOff | 0) % 3 === 0) {
            // Diamond shape
            c.beginPath();
            c.moveTo(0, -s);
            c.lineTo(s * 0.6, 0);
            c.moveTo(0, s);
            c.lineTo(-s * 0.6, 0);
            c.closePath();
            c.fill();
          } else if ((p.turbOff | 0) % 3 === 1) {
            // Small rectangle (confetti strip)
            c.fillRect(-s*0.3, -s*0.7, s*0.6, s*1.4);
          } else {
            // Circle (petal)
            c.beginPath();
            c.arc(0, 0, s*0.5, 0, Math.PI*2);
            c.fill();
          }

          // Tiny bright edge highlight for visibility
          c.globalAlpha = alpha * 0.3;
          c.strokeStyle = `rgba(255,255,255,0.4)`;
          c.lineWidth = 0.5;
          if ((p.turbOff | 0) % 3 === 0) {
            c.beginPath();
            c.moveTo(0, -s); c.lineTo(s*0.6, 0);
            c.lineTo(0, s); c.lineTo(-s*0.6, 0);
            c.closePath(); c.stroke();
          }

          c.restore();
        }
      }
    };

    // STARS
    const drawStars = (t: number, sceneAlpha: number) => {
      if (t > 7) return;
      const alpha = clamp(1-t/7, 0, 1)*sceneAlpha;
      c.save(); c.globalAlpha = alpha;
      for (let i = 0; i < starI.length; i++) {
        const idx = starI[i]; const p = pl[idx];
        if (p && p.on) {
          const twinkle = 0.5 + noise.n2(t*2+i*0.5, i*0.3)*0.5;
          const sG = c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.sz*4);
          sG.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${p.a*twinkle*0.4})`);
          sG.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = sG; c.fillRect(p.x-p.sz*4,p.y-p.sz*4,p.sz*8,p.sz*8);
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a*twinkle})`;
          c.beginPath(); c.arc(p.x,p.y,p.sz,0,Math.PI*2); c.fill();
        }
      }
      c.restore();
    };

    // CHAKRA SPOKES GLOW
    const drawChakraSpokes = (t: number, sceneAlpha: number) => {
      if (t < 7.0 || t > 11.5) return;
      let alpha = (t<8.0?eOC((t-7.0)/1.0):t<10.0?1:1-eOC((t-10.0)/1.5))*sceneAlpha;
      if (alpha <= 0) return;
      const cxV=W/2, cyV=H/2, or=Math.max(W,H)*0.9, spokes=24;
      c.save(); c.globalAlpha=alpha*0.12; c.globalCompositeOperation='lighter';
      for (let i = 0; i < spokes; i++) {
        const ang = (i/spokes)*Math.PI*2 + t*0.08;
        c.beginPath(); c.moveTo(cxV,cyV);
        c.lineTo(cxV+Math.cos(ang)*or, cyV+Math.sin(ang)*or);
        c.strokeStyle='rgba(30,70,160,0.55)'; c.stroke();
      }
      c.restore();
    };

    // LAYER 11: LENS FLARES — FIX: Slightly reduced intensity
    const drawLensFlares = (t: number, sceneAlpha: number) => {
      if (t < 5.0) return;
      const intensity = clamp((t-5.0)*0.25, 0, 0.45)*sceneAlpha;
      const sun = sunPos(t);
      const fx = sun.x, fy = lerp(H*1.1, sun.y, eOE((t-4)/5));

      c.save(); c.globalAlpha = intensity; c.globalCompositeOperation = 'screen';

      const sG1 = c.createLinearGradient(0,fy,W,fy);
      sG1.addColorStop(0, 'rgba(255,140,50,0)');
      sG1.addColorStop(0.5, 'rgba(255,220,160,0.6)');
      sG1.addColorStop(1, 'rgba(255,140,50,0)');
      c.fillStyle = sG1; c.fillRect(0,fy-2,W,4);

      const sG2 = c.createLinearGradient(0,fy,W,fy);
      sG2.addColorStop(0, 'rgba(255,180,100,0)');
      sG2.addColorStop(0.5, 'rgba(255,240,200,0.2)');
      sG2.addColorStop(1, 'rgba(255,180,100,0)');
      c.fillStyle = sG2; c.fillRect(0,fy-7,W,14);

      const bokehs = [
        { m: 0.25, sz: 35, a: 0.25 }, { m: 0.45, sz: 25, a: 0.2 },
        { m: -0.15, sz: 40, a: 0.15 }, { m: -0.3, sz: 20, a: 0.1 },
        { m: 0.6, sz: 30, a: 0.12 }, { m: -0.5, sz: 15, a: 0.08 }
      ];
      bokehs.forEach(bk => {
        const bx = fx + (W*0.15)*bk.m;
        const by = fy + (H*0.1)*bk.m;
        c.save(); c.translate(bx, by); c.scale(2.5, 1);
        const bG = c.createRadialGradient(0,0,0,0,0,bk.sz);
        bG.addColorStop(0, `rgba(255,200,100,${bk.a})`);
        bG.addColorStop(0.5, `rgba(255,140,60,${bk.a*0.3})`);
        bG.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = bG; c.beginPath(); c.arc(0,0,bk.sz,0,Math.PI*2); c.fill();
        c.restore();
      });

      c.restore();
    };

    // LAYER 11.5: LIGHT LEAKS — FIX: Reduced intensity
    const drawLightLeaks = (t: number, sceneAlpha: number) => {
      if (t < 4.0 || t > 12.0) return;
      c.save(); c.globalCompositeOperation = 'screen';
      lightLeaks.forEach(lk => {
        if (lk.life <= 0) return;
        const a = clamp(lk.life/lk.ml, 0, 1)*lk.intensity*sceneAlpha;
        if (a <= 0) return;
        c.save(); c.globalAlpha = a;
        c.translate(lk.x, lk.y); c.rotate(lk.angle); c.scale(2.5, 1);
        const lG = c.createRadialGradient(0,0,0,0,0,lk.sz);
        lG.addColorStop(0, lk.col);
        lG.addColorStop(0.5, lk.col.replace('0.4', '0.12'));
        lG.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = lG; c.beginPath(); c.arc(0,0,lk.sz,0,Math.PI*2); c.fill();
        c.restore();
      });
      c.restore();
    };

    // FIREWORKS SYSTEM
    const spawnFirework = (t: number) => {
      const fw: Firework = {
        x: W*0.2+Math.random()*W*0.6, y: H,
        vy: -4-Math.random()*3, state: 'rising', burstT: 0,
        col: fwCols[Math.random()*fwCols.length|0], pts: []
      };
      fireworks.push(fw);
    };

    const updateFireworks = (dt: number, elapsed: number) => {
      for (let i = fireworks.length-1; i >= 0; i--) {
        const fw = fireworks[i];
        if (fw.state === 'rising') {
          fw.y += fw.vy; fw.vy += 0.03;
          const p = grab(pl);
          if (p) {
            p.on=true; p.x=fw.x; p.y=fw.y;
            p.vx=(Math.random()-0.5)*0.5; p.vy=0.5+Math.random()*0.5;
            p.life=0.8; p.ml=0.8; p.sz=2+Math.random()*2;
            p.r=255; p.g=200; p.b=100; p.a=0.8; p.tp=3;
          }
          if (fw.vy >= -0.5 || fw.y < H*0.15) {
            fw.state = 'burst';
            const count = 60+Math.random()*40|0;
            for (let j = 0; j < count; j++) {
              const ang = (j/count)*Math.PI*2;
              const spd = 1.5+Math.random()*3;
              fw.pts.push({
                x: fw.x, y: fw.y,
                vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
                life: 2+Math.random(), ml: 3, sz: 2+Math.random()*2
              });
            }
          }
        } else {
          fw.burstT += dt;
          for (let j = fw.pts.length-1; j >= 0; j--) {
            const pt = fw.pts[j];
            pt.x += pt.vx; pt.y += pt.vy;
            pt.vy += 0.04; pt.vx *= 0.98; pt.vy *= 0.98;
            pt.life -= dt;
            if (pt.life <= 0) fw.pts.splice(j, 1);
          }
          if (fw.pts.length === 0) fireworks.splice(i, 1);
        }
      }
    };

    const drawFireworks = (sceneAlpha: number) => {
      c.save(); c.globalCompositeOperation = 'lighter';
      fireworks.forEach(fw => {
        if (fw.state === 'rising') {
          c.fillStyle = 'rgba(255,220,150,0.9)';
          c.beginPath(); c.arc(fw.x,fw.y,3,0,Math.PI*2); c.fill();
        } else {
          fw.pts.forEach(pt => {
            const a = clamp(pt.life/pt.ml, 0, 1)*sceneAlpha;
            const gR = c.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,pt.sz*3);
            gR.addColorStop(0, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},${a})`);
            gR.addColorStop(0.3, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},${a*0.5})`);
            gR.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = gR; c.fillRect(pt.x-pt.sz*3,pt.y-pt.sz*3,pt.sz*6,pt.sz*6);
          });
        }
      });
      c.restore();
    };

    /* ═══════════════════════════════════════════════════════════
       DOVES — COMPLETELY FIXED
       - No flocking (was causing confusion between left/right groups)
       - Left pigeons: strong RIGHT + UP velocity, arc upward, exit screen
       - Right pigeons: strong LEFT + UP velocity, arc upward, exit screen
       - Gentle upward curve (slight negative vy acceleration, no gravity)
       - Small noise variation for natural feel
       - Marked 'gone' when off-screen, not drawn
       ═══════════════════════════════════════════════════════════ */
    const drawDoves = (t: number, elapsed: number, sceneAlpha: number) => {
      if (t < 2.0) return;
      const dA = clamp((t-2.0)*1.2, 0, 1)*sceneAlpha;
      c.save(); c.globalAlpha = dA;

      // Trigger startle — only once per dove
      if (t >= 2.6) {
        dovesList.forEach(d => {
          if (d.state === 'sitting') {
            d.state = 'flying';
            if (d.side === 'left') {
              // LEFT pigeons: fly RIGHT and UP — exit right side or top
              d.vx = 2.0 + Math.random() * 1.5;   // Strong rightward
              d.vy = -2.5 - Math.random() * 1.5;   // Strong upward
            } else {
              // RIGHT pigeons: fly LEFT and UP — exit left side or top
              d.vx = -2.0 - Math.random() * 1.5;  // Strong leftward
              d.vy = -2.5 - Math.random() * 1.5;   // Strong upward
            }
          }
        });
      }

      dovesList.forEach(d => {
        if (d.state === 'gone') return; // Don't process or draw exited doves

        if (d.state === 'flying') {
          // Gentle noise variation — very subtle, doesn't override direction
          d.vx += noise.n2(elapsed * 0.5, d.flockIdx * 7) * 0.02;
          // FIX: Gentle upward curve (negative acceleration = curves up more)
          // NOT gravity (which would pull down)
          d.vy -= 0.003;

          d.x += d.vx;
          d.y += d.vy;
          d.wing += 0.25; // Natural flap speed

          // FIX: Check if dove has exited the screen — mark as gone
          if (d.x < -100 || d.x > W + 100 || d.y < -100) {
            d.state = 'gone';
            return;
          }
        }

        // Draw the dove
        c.save();
        c.translate(d.x, d.y);
        const dS = 0.52;
        c.scale(dS, dS);

        if (d.state === 'flying') {
          const fA = Math.atan2(d.vy, d.vx);
          c.rotate(fA);
          const wf = Math.sin(d.wing);

          // Tail
          c.fillStyle = '#d8d8d8';
          c.beginPath();
          c.moveTo(-15, 0);
          c.lineTo(-26, -5 + wf * 2);
          c.lineTo(-26, 5 - wf * 2);
          c.closePath();
          c.fill();

          // Body
          const bG = c.createLinearGradient(-15, 0, 15, 0);
          bG.addColorStop(0, '#dadada');
          bG.addColorStop(0.5, '#ffffff');
          bG.addColorStop(1, '#e3e3e3');
          c.fillStyle = bG;
          c.beginPath();
          c.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2);
          c.fill();

          // Head
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(13, -2, 4, 0, Math.PI * 2);
          c.fill();

          // Beak
          c.fillStyle = '#e29b3c';
          c.beginPath();
          c.moveTo(16, -3);
          c.lineTo(21, -2);
          c.lineTo(15, -1);
          c.closePath();
          c.fill();

          // 2-segment wings
          [-1, 1].forEach(side => {
            c.save();
            c.scale(1, side);
            c.rotate(wf * 0.5 - 0.15);
            c.fillStyle = '#f0f0f0';
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(-7, -15);
            c.lineTo(-13, -13);
            c.closePath();
            c.fill();
            c.translate(-7, -15);
            c.rotate(wf * 0.4 - 0.08);
            const fG = c.createLinearGradient(0, 0, -10, -20);
            fG.addColorStop(0, '#ffffff');
            fG.addColorStop(1, '#cccccc');
            c.fillStyle = fG;
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(-11, -21);
            c.lineTo(-16, -10);
            c.closePath();
            c.fill();
            c.restore();
          });
        } else if (d.state === 'sitting') {
          // Sitting state
          const hB = Math.sin(elapsed * 6 + d.bobOff) * 1.2;

          // Folded tail
          c.fillStyle = '#b5b5b5';
          c.beginPath();
          c.moveTo(-10, 2);
          c.lineTo(-22, 6);
          c.lineTo(-20, 0);
          c.closePath();
          c.fill();

          // Body
          const bG = c.createLinearGradient(-12, 0, 12, 0);
          bG.addColorStop(0, '#cccccc');
          bG.addColorStop(0.5, '#f5f5f5');
          bG.addColorStop(1, '#d8d8d8');
          c.fillStyle = bG;
          c.beginPath();
          c.ellipse(0, 2, 13, 6.5, 0.1, 0, Math.PI * 2);
          c.fill();

          // Head with bob
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(10, -2 + hB, 4.2, 0, Math.PI * 2);
          c.fill();

          // Beak
          c.fillStyle = '#e29b3c';
          c.beginPath();
          c.moveTo(13, -3 + hB);
          c.lineTo(17, -2 + hB);
          c.lineTo(12, -1 + hB);
          c.closePath();
          c.fill();

          // Folded wing overlay
          c.fillStyle = '#e2e2e2';
          c.beginPath();
          c.ellipse(-1, 2, 10, 4.2, -0.15, 0, Math.PI * 2);
          c.fill();
        }

        c.restore();
      });

      c.restore();
    };

    // LAYER 13: TYPOGRAPHY
    const drawTypography = (t: number) => {
      if (t < 11.5) return;
      const textAlpha = clamp((t-11.5)*1.5, 0, 1);
      const titleY = lerp(H*0.58, H*0.44, eOE((t-11.5)*0.5));
      c.save(); c.globalAlpha = textAlpha; c.textAlign = 'center';
      const fontSize = Math.min(W*0.065, 52);
      c.font = `600 ${fontSize}px 'Cinzel','Playfair Display',Georgia,serif`;

      const title = "HAPPY REPUBLIC DAY";
      const charDelay = 0.04;

      let totalW = 0;
      const charWidths: number[] = [];
      for (let i = 0; i < title.length; i++) {
        const w = c.measureText(title[i]).width;
        charWidths.push(w);
        totalW += w;
      }

      let xOff = W/2 - totalW/2;

      for (let i = 0; i < title.length; i++) {
        const charT = clamp((t - 11.5 - i*charDelay) / 0.3, 0, 1);
        const charY = titleY + (1-eOB(charT)) * -20;
        const charA = eOC(charT);

        c.save(); c.globalAlpha = charA;

        if (charT > 0.5) {
          c.save(); c.globalCompositeOperation = 'screen';
          const cG = c.createRadialGradient(xOff+charWidths[i]/2, charY, 0, xOff+charWidths[i]/2, charY, fontSize*0.6);
          cG.addColorStop(0, `rgba(255,200,100,${(charT-0.5)*0.1})`);
          cG.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = cG; c.fillRect(xOff-fontSize, charY-fontSize, charWidths[i]+fontSize*2, fontSize*2);
          c.restore();
        }

        c.fillStyle = 'rgba(0,0,0,0.92)';
        c.textAlign = 'left';
        c.fillText(title[i], xOff+2, charY+2);

        const cG = c.createLinearGradient(0, charY-fontSize*0.5, 0, charY+fontSize*0.38);
        cG.addColorStop(0, '#FF9933');
        cG.addColorStop(0.48, '#FFFFFF');
        cG.addColorStop(0.52, '#FFFFFF');
        cG.addColorStop(1, '#138808');
        c.fillStyle = cG;
        c.fillText(title[i], xOff, charY);
        c.restore();

        xOff += charWidths[i];
      }

      if (t > 12.4) {
        const sub = 'सत्यमेव जयते  •  वन्दे मातरम्';
        const ss2 = Math.min(W*0.018, H*0.022, 15);
        c.font = `400 ${ss2}px 'Georgia',serif`;
        c.textAlign = 'center';
        const subAlpha = clamp((t-12.4)*2, 0, 1);
        c.save(); c.globalAlpha = subAlpha;
        c.fillStyle = 'rgba(0,0,0,0.8)';
        c.fillText(sub, W/2+1, titleY+fontSize*0.95+1);
        c.fillStyle = '#ffd700';
        c.fillText(sub, W/2, titleY+fontSize*0.95);
        c.restore();
      }
      c.restore();
    };

    // LETTERBOX
    const drawLetterbox = (t: number) => {
      const barH = lerp(0, H*0.08, eOE(clamp((t-0.5)*0.5, 0, 1)));
      if (barH <= 0) return;
      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, barH);
      c.fillRect(0, H-barH, W, barH);
    };

    // POST FX
    const drawPostFX = () => {
      c.save(); c.globalCompositeOperation = 'soft-light';
      const grade = c.createLinearGradient(0,0,W,H);
      grade.addColorStop(0, 'rgba(255,140,50,0.18)');
      grade.addColorStop(1, 'rgba(0,50,100,0.25)');
      c.fillStyle = grade; c.fillRect(0,0,W,H);
      c.restore();

      const vig = c.createRadialGradient(W/2,H/2,H*0.2, W/2,H/2,H*0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(0.4, 'rgba(0,0,0,0.1)');
      vig.addColorStop(0.7, 'rgba(0,0,0,0.4)');
      vig.addColorStop(1, 'rgba(0,0,0,0.88)');
      c.fillStyle = vig; c.fillRect(0,0,W,H);

      grainFrame++;
      if (grainFrame % 3 === 0) refreshGrain();
      c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.03;
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0,0,W,H); }
      c.restore();
    };

    // CHROMATIC ABERRATION
    const drawChromaticAberration = () => {
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.02;
      c.drawImage(cv, -1.5, 0, W, H);
      c.globalAlpha = 0.015;
      c.drawImage(cv, 1.5, 0, W, H);
      c.restore();
    };

    /* ═══════════════════════════════════════════════════════════
       ANIMATION LOOP
       ═══════════════════════════════════════════════════════════ */
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

      if (t > 5.0 && t < 11.0) {
        fwTimer += dt;
        if (fwTimer > 0.8 + Math.random()*0.6) {
          spawnFirework(t);
          fwTimer = 0;
        }
      }
      updateFireworks(dt, now/1000);

      // FIX: Reduced light leak spawn frequency and intensity
      if (t > 4.5 && t < 11.5 && Math.random() < 0.005) {
        lightLeaks.push({
          x: Math.random()*W, y: Math.random()*H*0.6,
          sz: 60+Math.random()*100, intensity: 0.08+Math.random()*0.1,
          life: 2+Math.random()*2, ml: 4,
          col: `rgba(255,${180+Math.random()*75|0},${80+Math.random()*80|0},0.25)`,
          angle: Math.random()*Math.PI
        });
      }
      for (let i = lightLeaks.length-1; i >= 0; i--) {
        lightLeaks[i].life -= dt;
        if (lightLeaks[i].life <= 0) lightLeaks.splice(i, 1);
      }

      spawnParticles(t, now/1000);
      updateParticles(dt, now/1000);

      c.fillStyle = '#000000'; c.fillRect(0,0,W,H);

      const camDolly = lerp(1.0, 1.08, eOE(t/DUR));
      const bX = Math.sin(t*0.4)*2 + noise.n2(t*0.3, 0)*1.5;
      const bY = Math.cos(t*0.3)*1.5 + noise.n2(0, t*0.3)*1;
      const camR = Math.sin(t*0.15)*0.003 + noise.n2(t*0.2, 1)*0.001;

      c.save();
      c.translate(W/2+bX, H/2+bY);
      c.rotate(camR);
      c.scale(camDolly, camDolly);
      c.translate(-W/2, -H/2);

      const sceneAlpha = t < 11.5 ? 1 : clamp(1-(t-11.5)*1.8, 0, 1);

      drawSky(t, now/1000, sceneAlpha);
      drawClouds(t, sceneAlpha);
      drawAurora(t, sceneAlpha);
      drawStars(t, sceneAlpha);
      drawWavingFlagAndChakra(t, now/1000, sceneAlpha);
      drawIndiaGate(t, sceneAlpha);
      drawGroundReflection(t, sceneAlpha);
      drawTorch(t, now/1000, sceneAlpha);
      drawFog(t, now/1000, sceneAlpha);
      drawGodRays(t, sceneAlpha);
      drawLensFlares(t, sceneAlpha);
      drawLightLeaks(t, sceneAlpha);
      drawJetsAndTrails(t, sceneAlpha);
      drawParticles();
      drawFireworks(sceneAlpha);
      drawChakraSpokes(t, sceneAlpha);
      drawDoves(t, now/1000, sceneAlpha);

      c.restore();

      if (t >= 11.5) {
        const bgF = clamp((t-11.5)*1.8, 0, 1);
        c.save(); c.globalAlpha = bgF;
        const bgG = c.createLinearGradient(0,0,0,H);
        bgG.addColorStop(0, '#060810'); bgG.addColorStop(1, '#0c101c');
        c.fillStyle = bgG; c.fillRect(0,0,W,H);
        c.restore();
      }

      drawTypography(t);
      drawLetterbox(t);
      drawChromaticAberration();
      drawPostFX();

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch(_) {} audioCtxRef.current = null; }
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
