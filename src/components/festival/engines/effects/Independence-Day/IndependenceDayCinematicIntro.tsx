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
  x: number; y: number; base_x: number; base_y: number; target_y: number;
  scale: number; angle: number; swaySpeed: number; swayAmp: number;
  tailPhase: number;
}

interface BoidBird {
  x: number; y: number; vx: number; vy: number; wing: number;
  state: 'sitting' | 'flying'; side: 'left' | 'right';
  noiseSeed: number; bank: number;
}

interface Firework {
  x: number; y: number; vy: number;
  state: 'rising' | 'burst'; burstT: number;
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

export default function IndependenceDayCinematicIntro({ onComplete }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const raf = useRef<number>(0);
  const t0 = useRef<number>(0);
  const done = useRef<boolean>(false);
  const cbR = useRef(onComplete);
  cbR.current = onComplete;

  const mkPool = useCallback(() => {
    const a: Particle[] = [];
    for (let i = 0; i < POOL; i++) a.push({ x:0,y:0,vx:0,vy:0,life:0,ml:1,sz:0,r:255,g:153,b:51,a:0,tp:1,rot:0,rs:0,on:false,turbOff:Math.random()*1000 });
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
    const eOB = (t: number) => { const n=7.5625,d=2.75; if(t<1/d)return n*t*t; if(t<2/d)return n*(t-=1.5/d)*t+.75; if(t<2.5/d)return n*(t-=2.25/d)*t+.9375; return n*(t-=2.625/d)*t+.984375; };

    audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    playAudio();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, sc = 0, cx = 0, baseY = 0, gateH = 0, gateW = 0;

    const noise = new SNoise(4822);
    const pl = mkPool();
    const numPts = 14;
    const fN: {x:number;y:number;ox:number;oy:number;vx:number;vy:number}[] = [];
    for (let i = 0; i < numPts; i++) fN.push({x:0,y:0,ox:0,oy:0,vx:0,vy:0});

    const starI: number[] = []; for (let i = 0; i < 120; i++) starI.push(i);
    const birds: BoidBird[] = [];
    const kites: Kite[] = [];
    const clouds: CloudPuff[] = [];
    const fwSmoke: FWSmoke[] = [];

    let fort = {
      wallL: 0, wallR: 0, wallTop: 0, wallBot: 0,
      archX: 0, archW: 0, archH: 0, archBot: 0,
      bastionL: {x:0,w:0,top:0}, bastionR: {x:0,w:0,top:0},
      merlonW: 0, merlonH: 0, merlonGap: 0,
    };

    // ── Procedural sandstone texture (generated once) ──
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
        stImg.data[idx+1] = (80 + n * 30) | 0;
        stImg.data[idx+2] = (50 + n * 20) | 0;
        stImg.data[idx+3] = 255;
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

      fort = {
        wallL: cx - wallW / 2, wallR: cx + wallW / 2,
        wallTop, wallBot: baseY,
        archX: cx, archW: wallW * 0.15, archH: wallH * 0.62, archBot: baseY,
        bastionL: { x: cx - wallW / 2 - bastionW * 0.3, w: bastionW, top: baseY - bastionH },
        bastionR: { x: cx + wallW / 2 - bastionW * 0.7, w: bastionW, top: baseY - bastionH },
        merlonW: Math.max(6, sc * 0.008), merlonH: Math.max(8, sc * 0.012), merlonGap: Math.max(5, sc * 0.007),
      };

      fN[0].x = 0;
      for (let i = 0; i < starI.length; i++) {
        const p = pl[starI[i]];
        p.on = true; p.tp = 0;
        p.x = Math.random() * W; p.y = Math.random() * H * 0.6;
        p.sz = Math.random() * 1.0 + 0.2; p.ml = 999; p.life = 999;
        p.r = 255; p.g = 245; p.b = 200; p.a = Math.random() * 0.25 + 0.05;
      }

      kites.length = 0;
      [{ bx: W*0.12, by: H*0.50, ty: H*0.12, s: 1.0, ss: 1.1, sa: 28 },
       { bx: W*0.24, by: H*0.58, ty: H*0.18, s: 0.8, ss: 1.5, sa: 20 },
       { bx: W*0.76, by: H*0.52, ty: H*0.14, s: 0.9, ss: 1.0, sa: 24 },
       { bx: W*0.88, by: H*0.60, ty: H*0.22, s: 0.72, ss: 1.4, sa: 16 },
       { bx: W*0.40, by: H*0.65, ty: H*0.28, s: 0.6, ss: 1.8, sa: 12 },
       { bx: W*0.62, by: H*0.62, ty: H*0.20, s: 0.65, ss: 1.3, sa: 14 },
      ].forEach(d => kites.push({ x:d.bx, y:d.by, base_x:d.bx, base_y:d.by, target_y:d.ty, scale:d.s, angle:0, swaySpeed:d.ss, swayAmp:d.sa, tailPhase:Math.random()*100 }));

      birds.length = 0;
      const bY = fort.bastionL.top - 6;
      for (let i = 0; i < 5; i++) {
        birds.push({ x: fort.bastionL.x + fort.bastionL.w * 0.3 + i * 5, y: bY, vx:0, vy:0, wing:Math.random()*6.28, state:'sitting', side:'left', noiseSeed:Math.random()*1000, bank:0 });
        birds.push({ x: fort.bastionR.x + fort.bastionR.w * 0.3 + i * 5, y: bY, vx:0, vy:0, wing:Math.random()*6.28, state:'sitting', side:'right', noiseSeed:Math.random()*1000, bank:0 });
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
    for (let i = 0; i < gd.data.length; i += 4) { const v = Math.random()*255|0; gd.data[i]=v; gd.data[i+1]=v; gd.data[i+2]=v; gd.data[i+3]=255; }
    gc.putImageData(gd, 0, 0);

    let camShake = 0;
    const fwList: Firework[] = [];
    const fwCols = [{r:255,g:153,b:51},{r:255,g:255,b:255},{r:19,g:136,b:8},{r:255,g:215,b:0},{r:255,g:100,b:60}];

    const spawnFW = () => {
      const col = fwCols[Math.random()*fwCols.length|0];
      fwList.push({ x: W*0.1+Math.random()*W*0.8, y: H, vy: -4.5-Math.random()*3, state:'rising', burstT:0, col, pts:[] });
    };
    const updateFW = (dt: number) => {
      for (let i = fwList.length-1; i >= 0; i--) {
        const fw = fwList[i];
        if (fw.state === 'rising') {
          // IMPROVEMENT: Spawn smoke trail particles
          if (Math.random() < 0.6) {
            fwSmoke.push({ x: fw.x + (Math.random()-0.5)*3, y: fw.y, a: 0.25, sz: 4 + Math.random()*5, vx: (Math.random()-0.5)*0.3, vy: 0.2 + Math.random()*0.3 });
          }
          fw.y += fw.vy; fw.vy += 0.04;
          if (fw.vy >= -0.5 || fw.y < H*0.18) {
            fw.state = 'burst';
            // IMPROVEMENT: Spawn secondary sparks into main particle pool
            for (let s = 0; s < 8; s++) {
              const sp = grab(pl); if (sp) {
                sp.on = true; sp.x = fw.x; sp.y = fw.y;
                const a = Math.random() * 6.283, sp2 = 2.5 + Math.random() * 2;
                sp.vx = Math.cos(a) * sp2; sp.vy = Math.sin(a) * sp2;
                sp.life = 0.6 + Math.random() * 0.4; sp.ml = 1.0;
                sp.sz = 0.8 + Math.random(); sp.r = 255; sp.g = 230; sp.b = 180;
                sp.a = 0.9; sp.tp = 6;
              }
            }
            const cnt = 45 + Math.random()*35|0;
            const pat = Math.random();
            for (let j = 0; j < cnt; j++) {
              let ang: number, spd: number;
              if (pat < 0.3) { ang = (j/cnt)*6.283; spd = 1.5+Math.random()*1.0; }
              else if (pat < 0.6) { ang = (j/cnt)*6.283+(Math.random()-0.5)*0.4; spd = 0.8+Math.random()*2.5; }
              else { ang = Math.random()*6.283; spd = 0.5+Math.random()*3.0; }
              fw.pts.push({ x:fw.x, y:fw.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, life:1.8+Math.random()*1.5, ml:3.3, sz:1.5+Math.random()*2.0 });
            }
          }
        } else {
          fw.burstT += dt;
          for (let j = fw.pts.length-1; j >= 0; j--) {
            const pt = fw.pts[j];
            pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.032; pt.vx *= 0.986; pt.vy *= 0.986; pt.life -= dt;
            if (pt.life <= 0) fw.pts.splice(j, 1);
          }
          if (fw.pts.length === 0) fwList.splice(i, 1);
        }
      }
      // IMPROVEMENT: Update smoke
      for (let i = fwSmoke.length - 1; i >= 0; i--) {
        const s = fwSmoke[i];
        s.x += s.vx; s.y += s.vy; s.a -= 0.003; s.sz += 0.15;
        if (s.a <= 0) fwSmoke.splice(i, 1);
      }
    };

    /* ═══════════════════════════════════════════════════════════
       RENDERER
       ═══════════════════════════════════════════════════════════ */
    const R = {
      /* ── SKY: Enhanced with atmospheric haze, sun disc, scattering ── */
      sky: (t: number, sa: number) => {
        c.save(); c.globalAlpha = sa;
        const g = c.createLinearGradient(0, 0, 0, H);
        if (t < 5) {
          const p = cl(t/5, 0, 1);
          g.addColorStop(0, `rgb(${lerp(10,25,p)|0},${lerp(14,38,p)|0},${lerp(42,88,p)|0})`);
          g.addColorStop(0.2, `rgb(${lerp(15,40,p)|0},${lerp(20,48,p)|0},${lerp(50,92,p)|0})`);
          g.addColorStop(0.4, `rgb(${lerp(30,72,p)|0},${lerp(32,58,p)|0},${lerp(62,98,p)|0})`);
          g.addColorStop(0.6, `rgb(${lerp(70,165,p)|0},${lerp(50,98,p)|0},${lerp(58,58,p)|0})`);
          g.addColorStop(0.78, `rgb(${lerp(110,210,p)|0},${lerp(70,135,p)|0},${lerp(48,65,p)|0})`);
          g.addColorStop(0.9, `rgb(${lerp(145,235,p)|0},${lerp(90,155,p)|0},${lerp(50,75,p)|0})`);
          g.addColorStop(1, `rgb(${lerp(160,245,p)|0},${lerp(100,170,p)|0},${lerp(55,90,p)|0})`);
        } else if (t < 11) {
          const p = cl((t-5)/6, 0, 1);
          g.addColorStop(0, `rgb(${lerp(25,50,p)|0},${lerp(38,75,p)|0},${lerp(88,135,p)|0})`);
          g.addColorStop(0.3, `rgb(${lerp(50,100,p)|0},${lerp(48,80,p)|0},${lerp(75,100,p)|0})`);
          g.addColorStop(0.55, `rgb(${lerp(80,160,p)|0},${lerp(65,120,p)|0},${lerp(60,82,p)|0})`);
          g.addColorStop(0.75, `rgb(${lerp(160,230,p)|0},${lerp(95,150,p)|0},${lerp(58,78,p)|0})`);
          g.addColorStop(1, `rgb(${lerp(220,250,p)|0},${lerp(140,190,p)|0},${lerp(70,100,p)|0})`);
        } else {
          const p = cl((t-11)/4, 0, 1);
          g.addColorStop(0, `rgb(${lerp(50,6,p)|0},${lerp(75,10,p)|0},${lerp(135,42,p)|0})`);
          g.addColorStop(1, `rgb(${lerp(250,15,p)|0},${lerp(190,30,p)|0},${lerp(100,75,p)|0})`);
        }
        c.fillStyle = g; c.fillRect(0, 0, W, H);

        // IMPROVEMENT: Sun disc with corona
        if (t > 1.5 && t < 12) {
          const si = cl((t-1.5)/2.5, 0, 1) * cl((12-t)/1, 0, 1);
          const sunX = cx + W * 0.15, sunY = baseY - gateH * 0.15;
          c.save(); c.globalCompositeOperation = 'screen';
          // Outer corona
          c.globalAlpha = si * 0.15 * sa;
          const cr = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sc * 0.6);
          cr.addColorStop(0, 'rgba(255,200,100,0.3)'); cr.addColorStop(0.5, 'rgba(255,120,40,0.05)'); cr.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = cr; c.fillRect(sunX-sc*0.6, sunY-sc*0.6, sc*1.2, sc*1.2);
          // Inner glow
          c.globalAlpha = si * 0.3 * sa;
          const sg = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sc * 0.25);
          sg.addColorStop(0, 'rgba(255,240,200,0.7)'); sg.addColorStop(0.4, 'rgba(255,180,80,0.2)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = sg; c.fillRect(sunX-sc*0.25, sunY-sc*0.25, sc*0.5, sc*0.5);
          // Sun disc
          c.globalAlpha = si * 0.5 * sa;
          const sd = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sc * 0.04);
          sd.addColorStop(0, 'rgba(255,250,230,0.9)'); sd.addColorStop(1, 'rgba(255,220,160,0)');
          c.fillStyle = sd; c.beginPath(); c.arc(sunX, sunY, sc*0.04, 0, 6.283); c.fill();
          c.restore();
        }

        // IMPROVEMENT: Atmospheric haze layers
        if (t > 2 && t < 12) {
          const hi = cl((t-2)*0.2, 0, 1) * cl((12-t)*0.3, 0, 1) * sa;
          c.save(); c.globalAlpha = hi * 0.06;
          const hg = c.createLinearGradient(0, baseY - gateH * 0.8, 0, baseY + 20);
          hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, 'rgba(200,160,120,0.3)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = hg; c.fillRect(0, baseY - gateH * 0.8, W, gateH * 0.8 + 20);
          c.restore();
        }

        c.restore();
      },

      stars: (t: number, sa: number) => {
        if (t > 5) return;
        const a = cl(1 - t/5, 0, 1) * sa;
        c.save(); c.globalAlpha = a;
        for (const idx of starI) {
          const p = pl[idx]; if (!p?.on) continue;
          const tw = Math.sin(t*3.2 + idx) * 0.35 + 0.65;
          // IMPROVEMENT: Subtle star glow
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * tw * 0.3})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz * 2.5, 0, 6.283); c.fill();
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * tw})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        }
        c.restore();
      },

      /* ── CLOUDS: Noise-based layered shapes ── */
      clouds: (t: number, sa: number) => {
        if (t < 2) return;
        const a = cl((t-2)*0.3, 0, 1) * (t > 11 ? cl((12-t), 0, 1) : 1) * sa;
        c.save(); c.globalAlpha = a;
        clouds.forEach(cl_ => {
          cl_.x += cl_.speed * 0.016;
          if (cl_.x > W + cl_.w) cl_.x = -cl_.w;
          // IMPROVEMENT: Multiple overlapping puffs with noise-based variation
          const puffs = [
            { dx: 0, dy: 0, sw: 1.0, sh: 1.0 },
            { dx: -cl_.w*0.28, dy: 4, sw: 0.38, sh: 0.45 },
            { dx: cl_.w*0.32, dy: 2, sw: 0.32, sh: 0.38 },
            { dx: -cl_.w*0.12, dy: -cl_.h*0.3, sw: 0.25, sh: 0.3 },
            { dx: cl_.w*0.15, dy: -cl_.h*0.2, sw: 0.28, sh: 0.25 },
          ];
          puffs.forEach((pf, pi) => {
            const nv = noise.n2(t * 0.1 + cl_.noiseOff + pi, cl_.noiseOff + pi * 7) * 0.3 + 0.7;
            c.fillStyle = `rgba(255,225,195,${cl_.a * nv})`;
            c.beginPath();
            c.ellipse(cl_.x + pf.dx, cl_.y + pf.dy, cl_.w*pf.sw/2, cl_.h*pf.sh/2, 0, 0, 6.283);
            c.fill();
          });
        });
        c.restore();
      },

      /* ── GROUND: Enhanced with texture, stones, better shadow ── */
      ground: (t: number, sa: number) => {
        const rev = cl((t - 0.6) * 0.4, 0, 1);
        c.save(); c.globalAlpha = rev * sa;
        const gT = baseY;

        const lg = c.createLinearGradient(0, gT, 0, H);
        lg.addColorStop(0, '#1a3318'); lg.addColorStop(0.15, '#152b13');
        lg.addColorStop(0.5, '#0f200e'); lg.addColorStop(1, '#091209');
        c.fillStyle = lg; c.fillRect(0, gT, W, H - gT);

        // IMPROVEMENT: Grass noise variation
        c.save(); c.globalAlpha = rev * sa * 0.08;
        for (let gx = 0; gx < W; gx += 12) {
          const gn = noise.n2(gx * 0.02, 0.5) * 0.5 + 0.5;
          if (gn > 0.6) {
            c.fillStyle = `rgba(30,${60 + gn*40|0},25,1)`;
            c.fillRect(gx, gT + 2, 10, 4);
          }
        }
        c.restore();

        // Red sandstone plaza
        const plW = gateW * 1.05, plH = 32;
        const pg = c.createLinearGradient(0, gT - 4, 0, gT + plH);
        pg.addColorStop(0, '#8b4228'); pg.addColorStop(0.4, '#7a3820'); pg.addColorStop(1, '#5a2815');
        c.fillStyle = pg; c.fillRect(cx - plW/2, gT - 4, plW, plH);
        // IMPROVEMENT: Sandstone surface noise on plaza
        c.save(); c.globalAlpha = 0.06;
        const stPat = c.createPattern(stoneTexCv, 'repeat');
        if (stPat) { c.fillStyle = stPat; c.fillRect(cx - plW/2, gT - 4, plW, plH); }
        c.restore();
        c.fillStyle = 'rgba(200,150,100,0.12)'; c.fillRect(cx - plW/2, gT - 4, plW, 1.5);

        const pathW = gateW * 0.18;
        const pathG = c.createLinearGradient(0, gT, 0, gT + 60);
        pathG.addColorStop(0, '#6b4028'); pathG.addColorStop(1, '#3d2215');
        c.fillStyle = pathG;
        c.beginPath(); c.moveTo(cx - pathW/2, gT); c.lineTo(cx + pathW/2, gT);
        c.lineTo(cx + pathW*0.6, H); c.lineTo(cx - pathW*0.6, H); c.closePath(); c.fill();
        // IMPROVEMENT: Path surface texture
        c.save(); c.globalAlpha = 0.04;
        if (stPat) { c.fillStyle = stPat; c.fill(); }
        c.restore();

        [cx - gateW*0.3, cx + gateW*0.3].forEach(px => {
          c.fillStyle = '#3d2215';
          c.beginPath(); c.moveTo(px - 8, gT); c.lineTo(px + 8, gT);
          c.lineTo(px + 14, H); c.lineTo(px - 14, H); c.closePath(); c.fill();
        });

        // IMPROVEMENT: Small stones near path edges
        c.save(); c.globalAlpha = 0.15;
        for (let si = 0; si < 20; si++) {
          const sx = cx + (Math.sin(si * 7.3) * pathW * 0.8);
          const sy = gT + 3 + (si * 3.7) % 25;
          const ss = 1 + Math.sin(si * 3.1) * 0.8;
          c.fillStyle = `rgb(${80+si*3|0},${60+si*2|0},${40+si|0})`;
          c.beginPath(); c.ellipse(sx, sy, ss*1.5, ss, si*0.5, 0, 6.283); c.fill();
        }
        c.restore();

        const drawTree = (tx: number, ty: number, s: number, a: number) => {
          c.save(); c.globalAlpha = a;
          // IMPROVEMENT: Tree shadow on ground
          c.fillStyle = 'rgba(0,0,0,0.12)';
          c.beginPath(); c.ellipse(tx + 8*s, ty + 3, 18*s, 4*s, 0.2, 0, 6.283); c.fill();
          c.fillStyle = '#1a1008'; c.fillRect(tx - 2.5*s, ty - 22*s, 5*s, 24*s);
          for (let l = 0; l < 3; l++) {
            const leafShade = l === 1 ? 1.1 : 0.9;
            c.fillStyle = `rgb(${12*leafShade|0},${28*leafShade|0},${11*leafShade|0})`;
            c.beginPath();
            c.ellipse(tx + (l-1)*3*s, ty - 22*s - l*9*s, (18-l*4)*s, (12-l*2)*s, 0, 0, 6.283);
            c.fill();
          }
          c.restore();
        };
        drawTree(cx - gateW*0.52, gT, 1.2, 0.9);
        drawTree(cx - gateW*0.62, gT, 0.9, 0.7);
        drawTree(cx - gateW*0.72, gT, 1.1, 0.5);
        drawTree(cx + gateW*0.52, gT, 1.15, 0.85);
        drawTree(cx + gateW*0.62, gT, 1.0, 0.65);
        drawTree(cx + gateW*0.72, gT, 0.85, 0.45);
        drawTree(cx - gateW*0.85, gT, 0.6, 0.3);
        drawTree(cx + gateW*0.85, gT, 0.55, 0.25);

        // IMPROVEMENT: Better ground fog with noise
        c.globalAlpha = rev * sa * 0.1;
        const fg = c.createLinearGradient(0, gT - 5, 0, gT + 40);
        fg.addColorStop(0, 'rgba(0,0,0,0)');
        fg.addColorStop(0.3, 'rgba(180,140,100,0.2)');
        fg.addColorStop(0.7, 'rgba(180,140,100,0.12)');
        fg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = fg; c.fillRect(0, gT - 5, W, 45);

        // IMPROVEMENT: Bounce light from fort onto ground
        c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = rev * sa * 0.04;
        const blg = c.createRadialGradient(cx, gT, 0, cx, gT, gateW * 0.4);
        blg.addColorStop(0, 'rgba(200,120,60,0.3)'); blg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = blg; c.fillRect(cx - gateW*0.4, gT - 5, gateW*0.8, 20);
        c.restore();

        c.restore();
      },

      /* ═══════════════════════════════════════════════════════════
         RED FORT — Enhanced with texture, cracks, AO, weathering
         ═══════════════════════════════════════════════════════════ */
      redFort: (t: number, sa: number) => {
        const rev = cl((t - 0.8) * 0.35, 0, 1);
        c.save(); c.globalAlpha = rev * sa;

        const { wallL, wallR, wallTop, wallBot, archX, archW, archH, archBot,
                bastionL, bastionR, merlonW, merlonH, merlonGap } = fort;

        const SAND = '#b84e34'; const SAND_LT = '#d06848'; const SAND_DK = '#7a3220';
        const SAND_SH = '#4e1c0e'; const INLAY = '#e8d5b8'; const DOME = '#f0ebe0'; const GOLD = '#c89a18';

        // IMPROVEMENT: Long morning shadow cast by fort
        c.save(); c.globalAlpha = rev * sa * 0.12;
        c.fillStyle = '#000';
        c.beginPath();
        c.moveTo(wallR, wallBot); c.lineTo(wallR + gateW * 0.15, wallBot + 8);
        c.lineTo(wallR + gateW * 0.25, H); c.lineTo(wallR - 5, H);
        c.closePath(); c.fill();
        c.restore();

        // Ground contact shadow
        c.fillStyle = 'rgba(0,0,0,0.4)';
        c.beginPath(); c.ellipse(cx, baseY + 8, gateW * 0.56, 12, 0, 0, 6.283); c.fill();
        // Soft shadow gradient
        const csg = c.createRadialGradient(cx, baseY + 8, gateW*0.3, cx, baseY + 8, gateW*0.6);
        csg.addColorStop(0, 'rgba(0,0,0,0.2)'); csg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = csg; c.fillRect(cx - gateW*0.6, baseY, gateW*1.2, 30);

        const fpW = gateW * 1.08;
        const fpGrad = c.createLinearGradient(0, baseY - 6, 0, baseY + 14);
        fpGrad.addColorStop(0, SAND_LT); fpGrad.addColorStop(0.4, SAND); fpGrad.addColorStop(1, SAND_SH);
        c.fillStyle = fpGrad; c.fillRect(cx - fpW/2, baseY - 6, fpW, 20);
        c.fillStyle = 'rgba(220,180,140,0.15)'; c.fillRect(cx - fpW/2, baseY - 6, fpW, 1.5);
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(cx - fpW/2, baseY + 10, fpW, 4);

        c.fillStyle = SAND; c.fillRect(cx - fpW*0.46, baseY - 14, fpW*0.92, 8);
        c.fillStyle = 'rgba(220,180,140,0.1)'; c.fillRect(cx - fpW*0.46, baseY - 14, fpW*0.92, 1);

        const drawBlock = (x: number, y: number, w: number, h: number, shade: number) => {
          c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
          const bg = c.createLinearGradient(x, y, x + w, y);
          const r = lerp(122, 208, shade) | 0, g2 = lerp(50, 104, shade) | 0, b = lerp(32, 72, shade) | 0;
          bg.addColorStop(0, `rgb(${r*0.65|0},${g2*0.65|0},${b*0.65|0})`);
          bg.addColorStop(0.15, `rgb(${r*0.75|0},${g2*0.75|0},${b*0.75|0})`);
          bg.addColorStop(0.5, `rgb(${r},${g2},${b})`);
          bg.addColorStop(0.85, `rgb(${Math.min(255,r*1.12)|0},${Math.min(255,g2*1.1)|0},${Math.min(255,b*1.08)|0})`);
          bg.addColorStop(1, `rgb(${Math.min(255,r*1.18)|0},${Math.min(255,g2*1.15)|0},${Math.min(255,b*1.12)|0})`);
          c.fillStyle = bg; c.fillRect(x, y, w, h);

          // IMPROVEMENT: Sandstone texture overlay
          c.save(); c.globalAlpha = 0.08;
          const stPat = c.createPattern(stoneTexCv, 'repeat');
          if (stPat) { c.fillStyle = stPat; c.fillRect(x, y, w, h); }
          c.restore();

          c.fillStyle = `rgba(220,180,140,${0.1 * shade})`; c.fillRect(x, y, w, 1.5);
          c.strokeStyle = 'rgba(0,0,0,0.05)'; c.lineWidth = 0.5;
          for (let by = y + 18; by < y + h; by += 18) {
            c.beginPath(); c.moveTo(x, by); c.lineTo(x + w, by); c.stroke();
          }
          // IMPROVEMENT: Vertical mortar lines with offset
          for (let bx = x + 22; bx < x + w; bx += 22 + ((bx / 22 | 0) % 2) * 4) {
            c.beginPath(); c.moveTo(bx, y); c.lineTo(bx, y + h); c.stroke();
          }
        };

        const wallW = wallR - wallL;
        const wallH = wallBot - wallTop;
        drawBlock(wallL, wallTop, wallW, wallH - 6, 0.55);

        // IMPROVEMENT: Weathering stains
        c.save(); c.globalAlpha = 0.06;
        for (let wi = 0; wi < 5; wi++) {
          const wx = wallL + wallW * (0.15 + wi * 0.18);
          const wy = wallTop + wallH * (0.3 + noise.n2(wi * 3.7, 0) * 0.3);
          c.fillStyle = 'rgba(40,20,10,1)';
          c.beginPath(); c.ellipse(wx, wy, 8 + wi * 2, 15 + wi * 4, 0.2, 0, 6.283); c.fill();
        }
        c.restore();

        // IMPROVEMENT: Subtle crack lines
        c.save(); c.globalAlpha = 0.08; c.strokeStyle = 'rgba(30,15,5,1)'; c.lineWidth = 0.5;
        for (let ci = 0; ci < 4; ci++) {
          const cx0 = wallL + wallW * (0.2 + ci * 0.2);
          const cy0 = wallTop + wallH * 0.2;
          c.beginPath(); c.moveTo(cx0, cy0);
          c.lineTo(cx0 + noise.n2(ci*5, 0)*8, cy0 + 20 + noise.n2(0, ci*5)*15);
          c.lineTo(cx0 + noise.n2(ci*5, 1)*5, cy0 + 40 + noise.n2(1, ci*5)*10);
          c.stroke();
        }
        c.restore();

        c.fillStyle = INLAY;
        [0.15, 0.45, 0.72, 0.92].forEach(bp => {
          const by = wallTop + wallH * bp;
          c.globalAlpha = rev * sa * 0.35;
          c.fillRect(wallL + 4, by, wallW - 8, 2);
        });
        c.globalAlpha = rev * sa;

        c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 1;
        for (let i = 1; i < 12; i++) {
          const px = wallL + (wallW / 12) * i;
          c.beginPath(); c.moveTo(px, wallTop + 10); c.lineTo(px, wallBot - 10); c.stroke();
        }

        c.fillStyle = SAND_LT;
        for (let mx = wallL + merlonGap; mx < wallR - merlonW; mx += merlonW + merlonGap) {
          c.fillRect(mx, wallTop - merlonH, merlonW, merlonH);
          c.fillStyle = 'rgba(220,180,140,0.1)'; c.fillRect(mx, wallTop - merlonH, merlonW, 1);
          // IMPROVEMENT: Merlon top highlight
          c.fillStyle = 'rgba(255,200,150,0.06)'; c.fillRect(mx, wallTop - merlonH, merlonW, 1);
          c.fillStyle = SAND_LT;
        }

        const drawBastion = (bx: number, bw: number, btop: number) => {
          const bh = wallBot - btop;
          drawBlock(bx, btop, bw, bh, 0.6);
          // IMPROVEMENT: Ambient occlusion at bastion-wall junction
          c.save(); c.globalAlpha = 0.1;
          const aoGrad = c.createLinearGradient(bx, btop, bx + bw, btop);
          aoGrad.addColorStop(0, 'rgba(0,0,0,0.4)'); aoGrad.addColorStop(0.15, 'rgba(0,0,0,0)'); aoGrad.addColorStop(0.85, 'rgba(0,0,0,0)'); aoGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
          c.fillStyle = aoGrad; c.fillRect(bx - 5, btop, bw + 10, bh * 0.3);
          c.restore();

          c.fillStyle = INLAY; c.globalAlpha = rev * sa * 0.3;
          c.fillRect(bx + 3, btop + bh * 0.3, bw - 6, 1.5);
          c.fillRect(bx + 3, btop + bh * 0.7, bw - 6, 1.5);
          c.globalAlpha = rev * sa;

          const bmW = merlonW * 0.8, bmH = merlonH * 0.9;
          c.fillStyle = SAND_LT;
          for (let mx = bx + 2; mx < bx + bw - bmW; mx += bmW + merlonGap * 0.7) {
            c.fillRect(mx, btop - bmH, bmW, bmH);
          }

          const chW = bw * 0.7, chX = bx + (bw - chW) / 2, chY = btop - bmH;
          const pilH = 14;
          c.fillStyle = SAND_LT;
          for (let pi = 0; pi < 4; pi++) {
            const ppx = chX + 3 + (chW - 6) * (pi / 3);
            c.fillRect(ppx, chY - pilH, 2.5, pilH);
          }
          c.fillStyle = SAND; c.fillRect(chX, chY - 2, chW, 3);
          c.beginPath(); c.arc(chX + chW/2, chY - 2, chW * 0.42, Math.PI, 0, false); c.closePath();
          const dg = c.createLinearGradient(chX, chY - 2 - chW*0.42, chX + chW, chY - 2);
          dg.addColorStop(0, '#d8d0c4'); dg.addColorStop(0.4, DOME); dg.addColorStop(1, '#c8c0b4');
          c.fillStyle = dg; c.fill();
          // IMPROVEMENT: Dome highlight
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.08;
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(chX + chW*0.35, chY - 2 - chW*0.3, chW*0.15, 0, 6.283); c.fill();
          c.restore();
          c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 0.7; c.stroke();
          c.fillStyle = GOLD;
          c.fillRect(chX + chW/2 - 1, chY - 2 - chW*0.42 - 5, 2, 6);
          c.beginPath(); c.arc(chX + chW/2, chY - 2 - chW*0.42 - 6, 2.5, 0, 6.283); c.fill();
        };

        drawBastion(bastionL.x, bastionL.w, bastionL.top);
        drawBastion(bastionR.x, bastionR.w, bastionR.top);

        const drawSmallChhatri = (sx: number) => {
          const sw = 18;
          c.fillStyle = SAND_LT; c.fillRect(sx - sw/2, wallTop - merlonH - 2, sw, 3);
          c.beginPath(); c.arc(sx, wallTop - merlonH - 2, sw*0.42, Math.PI, 0, false); c.closePath();
          c.fillStyle = DOME; c.fill();
          c.strokeStyle = 'rgba(0,0,0,0.1)'; c.lineWidth = 0.5; c.stroke();
          c.fillStyle = GOLD; c.fillRect(sx - 0.8, wallTop - merlonH - 2 - sw*0.42 - 3, 1.6, 4);
        };
        drawSmallChhatri(cx - wallW * 0.3); drawSmallChhatri(cx + wallW * 0.3);
        drawSmallChhatri(cx - wallW * 0.15); drawSmallChhatri(cx + wallW * 0.15);

        // LAHORE GATE
        const aL = archX - archW/2, aR = archX + archW/2;
        const aTop = archBot - archH, aNeckY = archBot - archH * 0.6;

        c.save();
        c.beginPath();
        c.moveTo(aL - 6, archBot); c.lineTo(aL - 6, aNeckY - 4);
        c.quadraticCurveTo(aL - 6, aTop - 4, archX, aTop - 4);
        c.quadraticCurveTo(aR + 6, aTop - 4, aR + 6, aNeckY - 4);
        c.lineTo(aR + 6, archBot); c.closePath();
        c.fillStyle = INLAY; c.globalAlpha = rev * sa * 0.5; c.fill();
        c.globalAlpha = rev * sa; c.restore();

        c.save();
        c.beginPath();
        c.moveTo(aL, archBot); c.lineTo(aL, aNeckY);
        c.quadraticCurveTo(aL, aTop, archX, aTop);
        c.quadraticCurveTo(aR, aTop, aR, aNeckY);
        c.lineTo(aR, archBot); c.closePath(); c.clip();

        // IMPROVEMENT: Better deep shadow with AO
        const aShadow = c.createRadialGradient(archX, aTop + archH*0.3, archW*0.15, archX, aTop + archH*0.3, archW*0.65);
        aShadow.addColorStop(0, '#060201');
        aShadow.addColorStop(0.5, '#0a0303');
        aShadow.addColorStop(1, '#1a0805');
        c.fillStyle = aShadow; c.fillRect(aL - 5, aTop - 5, archW + 10, archH + 10);

        // IMPROVEMENT: Interior depth hint — receding arches
        for (let ai = 0; ai < 3; ai++) {
          const aiw = archW * (0.7 - ai * 0.15), aih = archH * (0.55 - ai * 0.12);
          const aiy = archBot - aih;
          const ainy = archBot - aih * 0.6;
          c.strokeStyle = `rgba(60,30,18,${0.15 - ai * 0.04})`; c.lineWidth = 0.8;
          c.beginPath();
          c.moveTo(archX - aiw/2, archBot); c.lineTo(archX - aiw/2, ainy);
          c.quadraticCurveTo(archX - aiw/2, aiy, archX, aiy);
          c.quadraticCurveTo(archX + aiw/2, aiy, archX + aiw/2, ainy);
          c.lineTo(archX + aiw/2, archBot); c.stroke();
        }
        c.restore();

        const drawSideArch = (sx: number) => {
          const sw = archW * 0.4, sh = archH * 0.38;
          const sl = sx - sw/2, sTop = archBot - sh, sNeck = archBot - sh * 0.6;
          c.save();
          c.beginPath();
          c.moveTo(sl, archBot); c.lineTo(sl, sNeck);
          c.quadraticCurveTo(sl, sTop, sx, sTop);
          c.quadraticCurveTo(sx + sw/2, sTop, sx + sw/2, sNeck);
          c.lineTo(sx + sw/2, archBot); c.closePath(); c.clip();
          // IMPROVEMENT: Better window interior
          const wShadow = c.createRadialGradient(sx, sTop + sh*0.3, 2, sx, sTop + sh*0.3, sw*0.5);
          wShadow.addColorStop(0, '#080201'); wShadow.addColorStop(1, '#120503');
          c.fillStyle = wShadow; c.fillRect(sl, sTop, sw, sh + 2);
          c.restore();
          c.strokeStyle = 'rgba(200,160,120,0.18)'; c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(sl, archBot); c.lineTo(sl, sNeck);
          c.quadraticCurveTo(sl, sTop, sx, sTop);
          c.quadraticCurveTo(sx + sw/2, sTop, sx + sw/2, sNeck);
          c.lineTo(sx + sw/2, archBot); c.stroke();
          // IMPROVEMENT: Window inlay border
          c.strokeStyle = 'rgba(232,213,184,0.12)'; c.lineWidth = 0.6;
          c.stroke();
        };
        drawSideArch(cx - wallW * 0.28); drawSideArch(cx + wallW * 0.28);
        drawSideArch(cx - wallW * 0.42); drawSideArch(cx + wallW * 0.42);

        // IMPROVEMENT: Enhanced rim light with gradient
        c.save(); c.globalCompositeOperation = 'screen';
        // Right edge rim
        const rimG = c.createLinearGradient(wallR - 5, 0, wallR + 2, 0);
        rimG.addColorStop(0, 'rgba(0,0,0,0)'); rimG.addColorStop(0.5, 'rgba(255,200,100,0.15)'); rimG.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = rev * sa * 0.8;
        c.fillStyle = rimG; c.fillRect(wallR - 5, wallTop - merlonH, 7, wallH + merlonH);
        // Top edge rim
        const topRimG = c.createLinearGradient(0, wallTop - merlonH - 2, 0, wallTop - merlonH + 4);
        topRimG.addColorStop(0, 'rgba(0,0,0,0)'); topRimG.addColorStop(0.4, 'rgba(255,200,100,0.12)'); topRimG.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = topRimG; c.fillRect(wallL, wallTop - merlonH - 2, wallW, 6);
        // Merlon top rim
        c.globalAlpha = rev * sa * 0.15;
        c.fillStyle = '#ffcc66';
        for (let mx = wallL + merlonGap; mx < wallR - merlonW; mx += merlonW + merlonGap) {
          c.fillRect(mx, wallTop - merlonH - 0.5, merlonW, 1);
        }
        c.restore();

        c.restore();
      },

      /* ── TORCH: Enhanced glow with heat distortion hint ── */
      torch: (t: number, el: number, sa: number) => {
        if (t < 2.5) return;
        const tx = cx, ty = baseY - 6;
        const fa = cl((t-2.5)*1.2, 0, 1) * sa;
        c.save(); c.globalAlpha = fa; c.globalCompositeOperation = 'lighter';
        // IMPROVEMENT: Larger ambient glow
        const ag = c.createRadialGradient(tx, ty - 15, 0, tx, ty - 15, 140);
        ag.addColorStop(0, 'rgba(255,100,10,0.15)'); ag.addColorStop(0.5, 'rgba(255,60,5,0.04)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = ag; c.fillRect(tx - 140, ty - 155, 280, 280);
        // Core glow
        const gg = c.createRadialGradient(tx, ty, 0, tx, ty, 60);
        gg.addColorStop(0, 'rgba(255,180,40,0.7)'); gg.addColorStop(0.5, 'rgba(255,80,10,0.15)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gg; c.fillRect(tx-60, ty-60, 120, 160);
        const fl = Math.sin(el*30)*3 + Math.sin(el*47)*1.5, fH = 32+fl;
        // IMPROVEMENT: Multi-layer flame
        for (let fi = 0; fi < 3; fi++) {
          const fOff = fi * 0.15, fW = 8 - fi * 2, fAlpha = 1 - fi * 0.3;
          const ffg = c.createLinearGradient(tx, ty, tx, ty - fH * fAlpha);
          ffg.addColorStop(0, fi === 0 ? '#ffffff' : 'rgba(255,220,100,0.6)');
          ffg.addColorStop(0.15 + fOff, 'rgba(255,200,70,0.7)');
          ffg.addColorStop(0.5, `rgba(255,${120-fi*30|0},20,0.4)`);
          ffg.addColorStop(1, 'rgba(255,50,0,0)');
          c.fillStyle = ffg; c.beginPath();
          c.moveTo(tx - fW, ty); c.quadraticCurveTo(tx - fW*0.4, ty - fH*0.5, tx, ty - fH * fAlpha);
          c.quadraticCurveTo(tx + fW*0.4, ty - fH*0.5, tx + fW, ty); c.closePath(); c.fill();
        }
        c.restore();
      },

      /* ── FLAG: Enhanced cloth sim with fold shading ── */
      flag: (t: number, el: number, sa: number) => {
        if (t < 3.0) return;
        const ra = cl((t-3.0)*1.0, 0, 1) * sa;
        const fwS = sc * 0.20, fh = fwS * 0.66;
        const pBaseY = baseY - 14;
        const pH = gateH * 0.72;
        const pTopY = pBaseY - pH;

        const hoist = cl((t - 3.0) / 3.5, 0, 1);
        const curY = lerp(pBaseY - fh, pTopY, eOC(hoist));
        const unfurl = cl((t - 6.0) * 1.8, 0, 1);
        const fw = lerp(fwS * 0.12, fwS, eOC(unfurl));

        if (fN[0].x === 0) {
          for (let i = 0; i < numPts; i++) {
            fN[i].x = cx + (i * fw) / (numPts - 1);
            fN[i].y = curY;
            fN[i].ox = fN[i].x; fN[i].oy = fN[i].y;
          }
        }

        // IMPROVEMENT: Better wind with turbulence
        for (let i = 1; i < numPts; i++) {
          const wind = 0.14 + noise.n2(el*0.55 + i*0.11, 0) * 0.13 + noise.n2(el*1.2 + i*0.3, 1) * 0.04;
          fN[i].vx = (fN[i].x - fN[i].ox) * 0.93 + wind;
          fN[i].vy = (fN[i].y - fN[i].oy) * 0.93 + 0.02 + noise.n2(el*0.8 + i*0.2, 2) * 0.01;
          fN[i].ox = fN[i].x; fN[i].oy = fN[i].y;
          fN[i].x += fN[i].vx; fN[i].y += fN[i].vy;
        }
        fN[0].x = cx; fN[0].y = curY;

        const ll = fw / (numPts - 1);
        // IMPROVEMENT: More constraint iterations for stiffer cloth
        for (let s = 0; s < 8; s++) {
          for (let i = 0; i < numPts - 1; i++) {
            const a = fN[i], b = fN[i+1];
            const dx = b.x-a.x, dy = b.y-a.y;
            const d = Math.sqrt(dx*dx+dy*dy);
            const diff = ll - d, pct = (diff/d)*0.5;
            const ox = dx*pct, oy = dy*pct;
            if (i > 0) { a.x -= ox; a.y -= oy; }
            b.x += ox; b.y += oy;
          }
        }

        c.save(); c.globalAlpha = ra;
        const pg = c.createLinearGradient(cx-2, pTopY, cx+2, pBaseY);
        pg.addColorStop(0, '#eee'); pg.addColorStop(0.5, '#fff'); pg.addColorStop(1, '#aaa');
        c.fillStyle = pg; c.fillRect(cx-2, pTopY, 4, pH);
        // IMPROVEMENT: Pole shadow on wall
        c.save(); c.globalAlpha = 0.06;
        c.fillStyle = '#000';
        c.fillRect(cx + 2, pTopY + 20, 6, pH - 20);
        c.restore();
        c.fillStyle = '#ffd700'; c.beginPath(); c.arc(cx, pTopY, 3.5, 0, 6.283); c.fill();

        // Flag strips with fold shading
        for (let i = 0; i < numPts - 1; i++) {
          const a = fN[i], b = fN[i+1];
          // IMPROVEMENT: Per-segment fold shading based on curvature
          const dx = b.x - a.x, dy = b.y - a.y;
          const curvature = Math.abs(dy) / (Math.abs(dx) + 0.01);
          const foldDarken = cl(1 - curvature * 0.3, 0.7, 1.0);
          const sh = (0.82 + Math.sin(i*0.3 - el*4) * 0.18) * foldDarken;
          const shade = (hex: string) => {
            const h = hex.replace('#','');
            return `rgb(${parseInt(h.substring(0,2),16)*sh|0},${parseInt(h.substring(2,4),16)*sh|0},${parseInt(h.substring(4,6),16)*sh|0})`;
          };
          c.fillStyle = shade('#FF9933');
          c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); c.lineTo(b.x,b.y+fh/3); c.lineTo(a.x,a.y+fh/3); c.closePath(); c.fill();
          c.fillStyle = shade('#FFFFFF');
          c.beginPath(); c.moveTo(a.x,a.y+fh/3); c.lineTo(b.x,b.y+fh/3); c.lineTo(b.x,b.y+fh*2/3); c.lineTo(a.x,a.y+fh*2/3); c.closePath(); c.fill();
          c.fillStyle = shade('#138808');
          c.beginPath(); c.moveTo(a.x,a.y+fh*2/3); c.lineTo(b.x,b.y+fh*2/3); c.lineTo(b.x,b.y+fh); c.lineTo(a.x,a.y+fh); c.closePath(); c.fill();

          // IMPROVEMENT: Fold crease lines
          if (curvature > 0.15) {
            c.save(); c.globalAlpha = ra * curvature * 0.12;
            c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 0.5;
            c.beginPath(); c.moveTo((a.x+b.x)/2, a.y); c.lineTo((a.x+b.x)/2, a.y + fh); c.stroke();
            c.restore();
          }
        }

        // IMPROVEMENT: Flag edge flutter — small wave at free edge
        if (unfurl > 0.5) {
          const lastN = fN[numPts - 1];
          const flutter = Math.sin(el * 6) * 2;
          c.save(); c.globalAlpha = ra * 0.15;
          c.fillStyle = '#000';
          c.beginPath();
          c.moveTo(lastN.x, lastN.y + fh);
          c.quadraticCurveTo(lastN.x + 3 + flutter, lastN.y + fh * 0.5, lastN.x + 1 + flutter * 0.5, lastN.y);
          c.quadraticCurveTo(lastN.x + 3 + flutter, lastN.y + fh * 1.5, lastN.x, lastN.y + fh);
          c.fill();
          c.restore();
        }

        if (unfurl > 0.15) {
          const mi = numPts/2|0;
          const chx = fN[mi].x, chy = fN[mi].y + fh/2, cr = fh*0.11*unfurl;
          c.save(); c.translate(chx, chy); c.rotate(el*0.7);
          c.strokeStyle = 'rgba(0,0,128,0.85)'; c.lineWidth = 1.6;
          c.beginPath(); c.arc(0,0,cr,0,6.283); c.stroke();
          c.lineWidth = 0.7;
          for (let i = 0; i < 24; i++) { const a = (i/24)*6.283; c.beginPath(); c.moveTo(0,0); c.lineTo(Math.cos(a)*cr, Math.sin(a)*cr); c.stroke(); }
          c.restore();
        }
        c.restore();
      },

      /* ── VOLUMETRIC LIGHT: Enhanced god rays ── */
      volLight: (t: number, sa: number) => {
        if (t < 3.5 || t > 11) return;
        const int = cl((t-3.5)*0.18, 0, 0.4) * cl((11-t)*0.3, 0, 1) * sa;
        c.save(); c.globalAlpha = int; c.globalCompositeOperation = 'screen';
        const sx = cx + W*0.12, sy = baseY - gateH*0.4;
        // IMPROVEMENT: Variable width rays with noise
        for (let i = 0; i < 16; i++) {
          const a = -1.4 + (i/16)*2.8;
          const nw = noise.n2(t * 0.3 + i, 0) * 0.015;
          const len = sc * (1.0 + noise.n2(i * 0.5, t * 0.2) * 0.3);
          c.beginPath(); c.moveTo(sx, sy);
          c.lineTo(sx + Math.cos(a - 0.03 + nw)*len, sy + Math.sin(a - 0.03 + nw)*len);
          c.lineTo(sx + Math.cos(a + 0.03 + nw)*len, sy + Math.sin(a + 0.03 + nw)*len);
          c.closePath();
          const rg = c.createLinearGradient(sx, sy, sx + Math.cos(a)*len, sy + Math.sin(a)*len);
          rg.addColorStop(0, 'rgba(255,215,120,0.15)');
          rg.addColorStop(0.3, 'rgba(255,140,50,0.06)');
          rg.addColorStop(0.7, 'rgba(255,100,40,0.02)');
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = rg; c.fill();
        }
        c.restore();
      },

      /* ── KITES: Enhanced with cloth shading, wrinkles, translucency ── */
      drawKites: (t: number, sa: number) => {
        if (t < 1.5) return;
        const ka = cl((t-1.5)*1.0, 0, 1) * (t > 11 ? cl((12-t),0,1) : 1) * sa;
        c.save(); c.globalAlpha = ka;

        kites.forEach((k, idx) => {
          const sway = Math.sin(t * k.swaySpeed + k.tailPhase) * k.swayAmp;
          k.x = k.base_x + sway;
          k.y = lerp(k.base_y, k.target_y, cl((t-1.5)*0.07, 0, 1));
          const tilt = Math.sin(t*1.3 + k.tailPhase) * 0.12 + Math.cos(t*k.swaySpeed*0.7)*0.06;

          c.save(); c.translate(k.x, k.y); c.rotate(tilt);
          const s = 16 * k.scale;

          // IMPROVEMENT: Paper translucency — back-light glow
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = ka * 0.1;
          const tlg = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.2);
          tlg.addColorStop(0, 'rgba(255,240,200,0.3)'); tlg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = tlg; c.beginPath(); c.arc(0, 0, s*1.2, 0, 6.283); c.fill();
          c.restore();

          const bodyGrad = c.createLinearGradient(-s, 0, s, 0);
          bodyGrad.addColorStop(0, '#e08830'); bodyGrad.addColorStop(0.20, '#ff9933');
          bodyGrad.addColorStop(0.45, '#ffe8c0'); bodyGrad.addColorStop(0.50, '#ffffff');
          bodyGrad.addColorStop(0.55, '#ffffff'); bodyGrad.addColorStop(0.60, '#d0f0d0');
          bodyGrad.addColorStop(0.80, '#128807'); bodyGrad.addColorStop(1, '#0e6e06');
          c.fillStyle = bodyGrad;
          c.beginPath();
          c.moveTo(0, -s*1.35);
          c.bezierCurveTo(s*0.4, -s*0.8, s*1.05, -s*0.2, s*1.05, 0);
          c.bezierCurveTo(s*1.05, s*0.2, s*0.4, s*0.7, 0, s*1.15);
          c.bezierCurveTo(-s*0.4, s*0.7, -s*1.05, s*0.2, -s*1.05, 0);
          c.bezierCurveTo(-s*1.05, -s*0.2, -s*0.4, -s*0.8, 0, -s*1.35);
          c.fill();

          // IMPROVEMENT: Paper wrinkle lines
          c.save(); c.globalAlpha = 0.08; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 0.3;
          for (let wl = 0; wl < 3; wl++) {
            const wy = -s*0.6 + wl * s * 0.5;
            c.beginPath(); c.moveTo(-s*0.8, wy);
            c.quadraticCurveTo(0, wy + Math.sin(t*2 + wl)*s*0.1, s*0.8, wy);
            c.stroke();
          }
          c.restore();

          c.strokeStyle = 'rgba(100,65,25,0.3)'; c.lineWidth = 0.8;
          c.beginPath(); c.moveTo(0, -s*1.35); c.lineTo(0, s*1.15); c.stroke();
          c.beginPath(); c.moveTo(-s*1.05, 0); c.quadraticCurveTo(0, -s*0.15, s*1.05, 0); c.stroke();

          // IMPROVEMENT: Better tail with more natural movement
          c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 0.5;
          c.beginPath(); c.moveTo(0, s*1.15);
          const tailLen = Math.min(H - k.y, s * 18);
          const tw1 = Math.sin(t*2 + k.tailPhase) * s * 0.5;
          const tw2 = Math.sin(t*1.5 + k.tailPhase + 2) * s * 0.3;
          c.bezierCurveTo(tw1, s*1.15 + tailLen*0.25, -tw2, s*1.15 + tailLen*0.55, tw1*0.3, s*1.15 + tailLen);
          c.stroke();

          for (let bi = 1; bi <= 5; bi++) {
            const by = s*1.15 + tailLen * (bi/6);
            const bx = Math.sin(t*2 + k.tailPhase + bi) * s * 0.35 * (bi/5);
            const bowColors = ['#ff9933', '#ffffff', '#128807'];
            // IMPROVEMENT: 3D bow shape
            c.fillStyle = bowColors[bi % 3]; c.globalAlpha = ka * 0.55;
            c.beginPath();
            c.ellipse(bx, by, s*0.25, s*0.12, Math.sin(t*3 + bi)*0.5, 0, 6.283);
            c.fill();
            c.globalAlpha = ka;
          }

          c.strokeStyle = 'rgba(200,200,200,0.06)'; c.lineWidth = 0.3;
          c.beginPath(); c.moveTo(0, s*1.15);
          c.lineTo(Math.sin(t*0.5+k.tailPhase)*25, H - k.y + 50);
          c.stroke();

          c.restore();
        });
        c.restore();
      },

      /* ── DOVES: Enhanced silhouettes with motion blur ── */
      doves: (t: number, el: number, sa: number) => {
        if (t < 2.5) return;
        const da = cl((t-2.5)*1.0, 0, 1) * sa;
        c.save(); c.globalAlpha = da;
        if (t >= 4.0) birds.forEach(b => {
          if (b.state === 'sitting') {
            b.state = 'flying';
            b.vx = (b.side === 'left' ? -0.9 : 0.9) + (Math.random()-0.5)*0.4;
            b.vy = -1.4 - Math.random()*0.8;
          }
        });
        birds.forEach(b => {
          if (b.state === 'flying') {
            b.vx = cl(b.vx*0.98 + noise.n2(el*0.6, b.noiseSeed)*0.5, -3, 3);
            b.vy = cl(b.vy*0.98 + noise.n2(el*0.4, b.noiseSeed+100)*0.3, -3, -0.8);
            b.x += b.vx; b.y += b.vy;
            b.wing += Math.sin(el*4 + b.noiseSeed) > 0 ? 0.28 : 0.14;
            b.bank = b.vx * 0.08;
          }
          c.save(); c.translate(b.x, b.y);
          c.rotate(b.state === 'flying' ? Math.atan2(b.vy, b.vx) + b.bank : 0);
          const s = 0.48; c.scale(s, s);

          // IMPROVEMENT: Motion blur trail for flying birds
          if (b.state === 'flying') {
            c.save(); c.globalAlpha = 0.15;
            c.translate(-b.vx * 2, -b.vy * 2);
            c.rotate(-b.bank * 0.3);
            c.fillStyle = '#ddd';
            c.beginPath(); c.ellipse(0, 0, 13, 4.5, 0, 0, 6.283); c.fill();
            c.restore();
          }

          if (b.state === 'flying') {
            const wf = Math.sin(b.wing);
            // IMPROVEMENT: Better wing shape with feather suggestion
            c.fillStyle = '#f0f0f0';
            c.beginPath(); c.ellipse(0, 0, 14, 5, 0, 0, 6.283); c.fill();
            c.beginPath(); c.arc(12, -2, 3.5, 0, 6.283); c.fill();
            // Tail feathers
            c.fillStyle = '#e8e8e8';
            c.beginPath(); c.moveTo(-10, 2); c.lineTo(-18, 5); c.lineTo(-12, 3); c.closePath(); c.fill();
            [-1,1].forEach(sd => {
              c.save(); c.scale(1, sd); c.rotate(wf*0.5 - 0.15);
              // IMPROVEMENT: Better wing silhouette
              c.fillStyle = '#e8e8e8';
              c.beginPath(); c.moveTo(0, 0); c.lineTo(-5, -8); c.lineTo(-9, -12); c.lineTo(-14, -10); c.lineTo(-12, -5); c.lineTo(-6, 0); c.closePath(); c.fill();
              // Feather detail
              c.strokeStyle = 'rgba(0,0,0,0.05)'; c.lineWidth = 0.3;
              c.beginPath(); c.moveTo(-2, -2); c.lineTo(-8, -8); c.stroke();
              c.restore();
            });
          } else {
            const hb = Math.sin(el*4 + b.noiseSeed)*0.8;
            c.fillStyle = '#e8e8e8';
            c.beginPath(); c.ellipse(0, 2, 12, 6, 0.1, 0,  6.283); c.fill();
            c.beginPath(); c.arc(9, -2+hb, 3.5, 0, 6.283); c.fill();
            // Beak
            c.fillStyle = '#d4a030';
            c.beginPath(); c.moveTo(13, -2+hb); c.lineTo(16, -1+hb); c.lineTo(13, 0+hb); c.closePath(); c.fill();
          }
          c.restore();
        });
        c.restore();
      },

      /* ═══════════════════════════════════════════════════════════
         TYPOGRAPHY: Enhanced with glow, shimmer, cinematic shadow
         ═══════════════════════════════════════════════════════════ */
      typography: (t: number) => {
        if (t < 12.5) return;
        const titleY = lerp(H*0.56, H*0.40, eOE((t-12.5)*0.45));
        c.save();

        // IMPROVEMENT: Background glow behind text
        if (t >= 12.5 && t < 17) {
          const ga = cl((t-12.5)*0.8, 0, 1) * (t > 17 ? cl((17.5-t)*2, 0, 1) : 1);
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = ga * 0.06;
          const tg = c.createRadialGradient(W*0.5, titleY, 0, W*0.5, titleY, W*0.3);
          tg.addColorStop(0, 'rgba(255,180,60,0.3)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = tg; c.fillRect(0, titleY - 40, W, 80);
          c.restore();
        }

        const fs = Math.min(W*0.06, 48);
        c.font = `700 ${fs}px 'Cinzel','Playfair Display',Georgia,serif`;
        const title = "HAPPY INDEPENDENCE DAY";
        const tw = c.measureText(title).width;
        let xo = W*0.5 - tw*0.5;

        for (let i = 0; i < title.length; i++) {
          const cw = c.measureText(title[i]).width;
          const ct = cl((t - 12.5 - i*0.032) / 0.38, 0, 1);
          if (ct <= 0) { xo += cw; continue; }
          const cy = titleY + (1 - eOB(ct)) * -14;
          c.save(); c.globalAlpha = eOC(ct);

          // IMPROVEMENT: Better shadow — offset + blur
          c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillText(title[i], xo+3, cy+3);
          c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillText(title[i], xo+1, cy+1);

          const sg = c.createLinearGradient(xo, cy-fs*0.5, xo, cy+fs*0.38);
          sg.addColorStop(0, '#FF9933'); sg.addColorStop(0.47, '#FFFFFF');
          sg.addColorStop(0.53, '#FFFFFF'); sg.addColorStop(1, '#138808');
          c.fillStyle = sg; c.fillText(title[i], xo, cy);

          // IMPROVEMENT: Gold shimmer on each letter
          if (ct > 0.5 && ct < 0.9) {
            const shimmer = Math.sin(t * 8 + i * 2.5) * 0.5 + 0.5;
            c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = shimmer * 0.08;
            c.fillStyle = '#ffd700';
            c.fillText(title[i], xo, cy);
            c.restore();
          }
          c.restore(); xo += cw;
        }

        if (t > 14.0) {
          const sa = cl((t-14.0)*1.8, 0, 1);
          c.save(); c.globalAlpha = sa; c.textAlign = 'center';
          // IMPROVEMENT: Subtle glow on anniversary text
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = sa * 0.15;
          c.font = `400 ${fs*0.32}px 'Cinzel','Georgia',serif`;
          c.fillStyle = '#ffd700'; c.fillText("80th Anniversary  •  1947 — 2027", W*0.5, titleY + fs*0.85);
          c.restore();
          c.font = `400 ${fs*0.32}px 'Cinzel','Georgia',serif`;
          c.fillStyle = '#c89a18'; c.fillText("80th Anniversary  •  1947 — 2027", W*0.5, titleY + fs*0.85);
          c.restore();
        }

        if (t > 15.0) {
          const ja = cl((t-15.0)*2, 0, 1);
          c.save(); c.globalAlpha = ja; c.textAlign = 'center';
          // IMPROVEMENT: Glow on जय हिन्द
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = ja * 0.12;
          c.font = `500 ${fs*0.6}px 'Georgia',serif`;
          c.fillStyle = '#ffd700'; c.fillText("जय हिन्द", W*0.5, titleY + fs*1.35);
          c.restore();
          c.font = `500 ${fs*0.6}px 'Georgia',serif`;
          c.fillStyle = '#ffd700'; c.fillText("जय हिन्द", W*0.5, titleY + fs*1.35);
          c.restore();
        }
        c.restore();
      },

      /* ── FIREWORKS: Enhanced with smoke, flash, trails ── */
      fireworks: (sa: number) => {
        c.save(); c.globalCompositeOperation = 'lighter';
        // IMPROVEMENT: Draw smoke trails
        fwSmoke.forEach(s => {
          c.globalAlpha = s.a * sa * 0.5;
          c.fillStyle = `rgba(180,170,160,${s.a * 0.15})`;
          c.beginPath(); c.arc(s.x, s.y, s.sz, 0, 6.283); c.fill();
        });
        // Reset alpha for fireworks
        c.globalAlpha = sa;

        fwList.forEach(fw => {
          if (fw.state === 'rising') {
            // IMPROVEMENT: Rising trail glow
            c.fillStyle = 'rgba(255,230,150,0.4)';
            c.beginPath(); c.arc(fw.x, fw.y, 4, 0, 6.283); c.fill();
            c.fillStyle = 'rgba(255,230,150,0.95)';
            c.beginPath(); c.arc(fw.x, fw.y, 2, 0, 6.283); c.fill();
          } else {
            // IMPROVEMENT: Burst flash (first 0.15s)
            if (fw.burstT < 0.15) {
              const flashA = 1 - fw.burstT / 0.15;
              c.globalAlpha = flashA * sa;
              const flashG = c.createRadialGradient(fw.x, fw.y, 0, fw.x, fw.y, 30 + fw.burstT * 100);
              flashG.addColorStop(0, 'rgba(255,255,255,0.6)');
              flashG.addColorStop(1, 'rgba(0,0,0,0)');
              c.fillStyle = flashG; c.beginPath(); c.arc(fw.x, fw.y, 30 + fw.burstT * 100, 0, 6.283); c.fill();
              c.globalAlpha = sa;
            }
            fw.pts.forEach(pt => {
              const a = cl(pt.life/pt.ml, 0, 1) * sa;
              // IMPROVEMENT: Long fading trail
              const trailA = a * 0.3;
              if (trailA > 0.05) {
                c.fillStyle = `rgba(${fw.col.r},${fw.col.g},${fw.col.b},${trailA * 0.3})`;
                c.beginPath(); c.arc(pt.x - pt.vx*1.5, pt.y - pt.vy*1.5, pt.sz*1.5, 0, 6.283); c.fill();
              }
              // Main particle with better glow
              const fg = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.sz*2.5);
              fg.addColorStop(0, `rgba(${Math.min(255,fw.col.r+60)},${Math.min(255,fw.col.g+60)},${Math.min(255,fw.col.b+60)},${a})`);
              fg.addColorStop(0.4, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},${a * 0.6})`);
              fg.addColorStop(1, 'rgba(0,0,0,0)');
              c.fillStyle = fg; c.beginPath(); c.arc(pt.x, pt.y, pt.sz*2.5, 0, 6.283); c.fill();
            });
          }
        });
        c.restore();
      }
    };

    /* ═══════════════════════════════════════════════════════════
       PARTICLES
       ═══════════════════════════════════════════════════════════ */
    const spawnP = (t: number, el: number) => {
      if (Math.random() < 0.10) {
        const p = grab(pl); if (p) { p.on=true; p.x=Math.random()*W; p.y=H*0.6+Math.random()*H*0.3; p.vx=(Math.random()-0.5)*0.15; p.vy=-0.04; p.life=8; p.ml=8; p.sz=30+Math.random()*35; p.r=200; p.g=190; p.b=170; p.a=0.04; p.tp=1; }
      }
      if (t > 4 && t < 11 && Math.random() < 0.3) {
        const p = grab(pl); if (p) { p.on=true; p.x=Math.random()*W; p.y=H+10; p.vx=(Math.random()-0.5)*0.4; p.vy=-0.35-Math.random()*0.6; p.life=6; p.ml=6; p.sz=1.5+Math.random()*2.5; p.r=255; p.g=200; p.b=50; p.a=0.7; p.tp=5; }
      }
      if (t >= 4.5 && t < 11.5 && Math.random() < 0.25) {
        const p = grab(pl); if (p) {
          p.on=true; p.x=Math.random()*W; p.y=-15-Math.random()*25;
          p.vx=-0.8+Math.random()*1.6; p.vy=1.0+Math.random()*1.3;
          p.life=7; p.ml=7; p.sz=4+Math.random()*3;
          p.rot=Math.random()*6.28; p.rs=(Math.random()-0.5)*0.04;
          const r = Math.random();
          if (r < 0.5) { p.r=255; p.g=107; p.b=53; }
          else if (r < 0.85) { p.r=245; p.g=180; p.b=30; }
          else { p.r=255; p.g=255; p.b=240; }
          p.a=0.8; p.tp=2;
        }
      }
      if (t > 2.5 && Math.random() < 0.2) {
        const p = grab(pl); if (p) { p.on=true; p.x=cx+(Math.random()-0.5)*12; p.y=baseY-6; p.vx=(Math.random()-0.5)*0.5; p.vy=-1.0-Math.random()*1.5; p.life=2.5; p.ml=2.5; p.sz=0.8+Math.random()*1.5; p.r=255; p.g=120+Math.random()*80|0; p.b=30; p.a=0.9; p.tp=3; }
      }
      // IMPROVEMENT: Floating pollen / atmospheric dust
      if (t > 3 && t < 11 && Math.random() < 0.06) {
        const p = grab(pl); if (p) {
          p.on=true; p.x=Math.random()*W; p.y=Math.random()*H*0.7;
          p.vx=(Math.random()-0.5)*0.15; p.vy=-0.02+Math.random()*0.03;
          p.life=10; p.ml=10; p.sz=0.8+Math.random()*0.6;
          p.r=255; p.g=240; p.b=180; p.a=0.25; p.tp=7;
        }
      }
    };

    const updateP = (dt: number, el: number) => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue; p.life -= dt;
        // IMPROVEMENT: Store previous position for motion blur
        if (p.tp === 2 || p.tp === 3 || p.tp === 6) {
          if (p.prevX === undefined) { p.prevX = p.x; p.prevY = p.y; }
          else { p.prevX = p.x; p.prevY = p.y; }
        }
        if (p.tp === 2) {
          p.vy += 0.012; p.vy *= 0.988;
          p.vx = p.vx*0.95 + Math.sin(el*0.7 + p.y*0.01)*0.025;
          p.x += p.vx; p.y += p.vy; p.rot += p.rs;
        } else if (p.tp === 5) {
          p.vy *= 0.992;
          p.vx = p.vx*0.96 + noise.n2(el*0.4+p.y*0.008, p.turbOff)*0.12;
          p.x += p.vx; p.y += p.vy;
        } else if (p.tp === 6) {
          // Secondary firework sparks — fast decay
          p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.94; p.vy *= 0.94;
        } else if (p.tp === 7) {
          // Pollen — very gentle drift
          p.vx += Math.sin(el*0.3 + p.turbOff)*0.005;
          p.vy += Math.cos(el*0.2 + p.turbOff)*0.003;
          p.x += p.vx; p.y += p.vy;
        } else {
          p.x += p.vx; p.y += p.vy;
        }
        if (p.life <= 0 || p.x < -100 || p.x > W+100 || p.y > H+100) p.on = false;
      }
    };

    const drawP = () => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue;
        const a = cl(p.life/p.ml, 0, 1) * p.a;
        c.save(); c.globalAlpha = a;
        if (p.tp === 2) {
          // IMPROVEMENT: Motion blur for petals
          if (p.prevX !== undefined) {
            const dx = p.x - p.prevX, dy = p.y - p.prevY;
            const spd = Math.sqrt(dx*dx + dy*dy);
            if (spd > 0.5) {
              c.save(); c.globalAlpha = a * 0.25;
              c.translate(p.prevX - dx * 0.5, p.prevY - dy * 0.5); c.rotate(p.rot - p.rs);
              c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
              c.beginPath(); c.ellipse(0, 0, p.sz*0.5, p.sz*0.8, 0, 0, 6.283); c.fill();
              c.restore();
            }
          }
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.beginPath(); c.ellipse(0, 0, p.sz*0.6, p.sz, 0, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.15)';
          c.beginPath(); c.arc(0, 0, p.sz*0.3, 0, 6.283); c.fill();
        } else if (p.tp === 5) {
          c.globalCompositeOperation = 'lighter';
          const gg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz*2);
          gg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a})`);
          gg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gg; c.beginPath(); c.arc(p.x, p.y, p.sz*2, 0, 6.283); c.fill();
        } else if (p.tp === 3) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        } else if (p.tp === 6) {
          // IMPROVEMENT: Secondary spark rendering
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        } else if (p.tp === 7) {
          // IMPROVEMENT: Pollen — tiny bright dot
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a * 0.5})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        } else if (p.tp === 1) {
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        }
        c.restore();
      }
    };

    /* ═══════════════════════════════════════════════════════════
       POST PROCESSING: Cinematic film look
       ═══════════════════════════════════════════════════════════ */
    const postFX = () => {
      // IMPROVEMENT: Filmic color grading — warm highlights, teal shadows
      c.save(); c.globalCompositeOperation = 'soft-light';
      const cg = c.createLinearGradient(0, 0, W * 0.3, H);
      cg.addColorStop(0, 'rgba(255,140,50,0.10)');
      cg.addColorStop(0.5, 'rgba(255,180,100,0.06)');
      cg.addColorStop(1, 'rgba(0,50,90,0.12)');
      c.fillStyle = cg; c.fillRect(0, 0, W, H);
      c.restore();

      // IMPROVEMENT: Teal shadow push
      c.save(); c.globalCompositeOperation = 'multiply';
      c.globalAlpha = 0.03;
      c.fillStyle = 'rgb(240,245,255)';
      c.fillRect(0, 0, W, H);
      c.restore();

      // IMPROVEMENT: Soft contrast S-curve
      c.save(); c.globalCompositeOperation 'soft-light'; c.globalAlpha = 0.04;
      c.fillStyle = 'rgb(128,128,128)'; c.fillRect(0, 0, W, H);
      c.restore();

      // IMPROVEMENT: Better vignette — softer falloff
      const vg = c.createRadialGradient(W/2, H/2, H*0.28, W/2, H/2, H*0.82);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.5, 'rgba(0,0,0,0.08)');
      vg.addColorStop(0.8, 'rgba(0,0,0,0.35)');
      vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      // IMPROVEMENT: Soft bloom via screen overlay
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.02;
      const bloomG = c.createRadialGradient(W*0.65, baseY - gateH*0.3, 0, W*0.65, baseY - gateH*0.3, sc*0.4);
      bloomG.addColorStop(0, 'rgba(255,180,80,0.15)'); bloomG.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = bloomG; c.fillRect(0, 0, W, H);
      c.restore();

      // IMPROVEMENT: Film grain — warmer, more subtle
      c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.018;
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0, 0, W, H); }
      c.restore();
    };

    /* ═══════════════════════════════════════════════════════════
       LENS EFFECTS: Flare, subtle CA
       ═══════════════════════════════════════════════════════════ */
    const lensFX = (t: number) => {
      // IMPROVEMENT: Lens flare near sun
      if (t > 2 && t < 12) {
        const fi = cl((t-2)/2, 0, 1) * cl((12-t)/1, 0, 1);
        if (fi > 0.1) {
          const sunX = cx + W * 0.15, sunY = baseY - gateH * 0.15;
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = fi * 0.06;
          const flarePoints = [
            { d: 0.08, r: 12, a: 0.4 }, { d: 0.15, r: 20, a: 0.2 },
            { d: 0.25, r: 35, a: 0.1 }, { d: 0.4, r: 50, a: 0.05 },
          ];
          const dx = W/2 - sunX, dy = H/2 - sunY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const nx = dx/dist, ny = dy/dist;
          flarePoints.forEach(fp => {
            const fx = sunX + nx * dist * fp.d, fy = sunY + ny * dist * fp.d;
            const fg = c.createRadialGradient(fx, fy, 0, fx, fy, fp.r);
            fg.addColorStop(0, `rgba(255,220,150,${fp.a})`);
            fg.addColorStop(1, 'rgba(255,150,50,0)');
            c.fillStyle = fg; c.beginPath(); c.arc(fx, fy, fp.r, 0, 6.283); c.fill();
          });
          // Anamorphic streak
          c.globalAlpha = fi * 0.03;
          const streakG = c.createLinearGradient(sunX, sunY, W/2, H/2);
          streakG.addColorStop(0, 'rgba(255,200,120,0.5)');
          streakG.addColorStop(1, 'rgba(255,200,120,0)');
          c.fillStyle = streakG;
          c.fillRect(Math.min(sunX, W/2), sunY - 2, Math.abs(W/2 - sunX) + 2, 4);
          c.restore();
        }
      }
      // IMPROVEMENT: Subtle chromatic aberration — only at edges
      c.save(); c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.006; c.drawImage(cv, -1.5, 0, W, H);
      c.globalAlpha = 0.004; c.drawImage(cv, 1.5, 0, W, H);
      c.restore();
    };

    let prev = 0, fwT = 0;

    /* ═══════════════════════════════════════════════════════════
       MAIN LOOP
       ═══════════════════════════════════════════════════════════ */
    const loop = (now: number) => {
      if (!t0.current) { t0.current = now; prev = now; }
      const t = (now - t0.current) / 1000;
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      if (t >= DUR) {
        if (!done.current) { done.current = true; cbR.current?.(); }
        return;
      }

      if (t >= 6.0 && t < 12.0) {
        fwT += dt;
        if (fwT > 0.7 + Math.random()*0.5) { spawnFW(); fwT = 0; }
      }
      if (t >= 13.0 && t < 17.0) {
        fwT += dt;
        if (fwT > 1.2) { spawnFW(); fwT = 0; }
      }
      updateFW(dt);
      spawnP(t, now/1000);
      updateP(dt, now/1000);

      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);

      // IMPROVEMENT: Subtle cinematic dolly + breathing
      camShake *= 0.92;
      const dollyX = Math.sin(t * 0.05) * 3; // Very slow horizontal drift
      const bx = Math.sin(t*0.35)*1.5 + (Math.random()-0.5)*camShake + dollyX;
      const by = Math.cos(t*0.25)*1.0 + (Math.random()-0.5)*camShake;
      const zoom = 1.0 + Math.sin(t*0.08)*0.008;

      c.save();
      c.translate(W/2 + bx, H/2 + by);
      c.scale(zoom, zoom);
      c.translate(-W/2, -H/2);

      const sa = t < 11.5 ? 1 : cl(1 - (t-11.5)*1.5, 0, 1);

      R.sky(t, sa);
      R.stars(t, sa);
      R.clouds(t, sa);
      R.drawKites(t, sa);
      R.flag(t, now/1000, sa);
      R.ground(t, sa);
      R.redFort(t, sa);
      R.volLight(t, sa);
      R.torch(t, now/1000, sa);
      drawP();
      R.fireworks(sa);
      R.doves(t, now/1000, sa);

      c.restore();

      if (t >= 11.5 && t < 13.5) {
        const bf = cl((t-11.5)*1.5, 0, 1);
        c.save(); c.globalAlpha = bf;
        const bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#060810'); bg.addColorStop(1, '#0c101c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.restore();
      }

      R.typography(t);
      postFX();
      lensFX(t);

      if (t >= 17.5) {
        const wa = cl((t-17.5)*0.8, 0, 1);
        c.save(); c.globalAlpha = wa;
        c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
        c.restore();
      }
      if (t >= 18.2) {
        const ba = cl((t-18.2)*1.2, 0, 1);
        c.save(); c.globalAlpha = ba;
        c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
        c.restore();
      }

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioRef.current) { try { audioRef.current.close(); } catch(_){} audioRef.current = null; }
    };
  }, [mkPool, grab, playAudio]);

  return (
    <canvas
      ref={cvRef}
      style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', display:'block', zIndex:50 }}
    />
  );
}
