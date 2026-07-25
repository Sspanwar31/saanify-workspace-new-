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

interface CloudPuff { x: number; y: number; w: number; h: number; a: number; speed: number; }

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

    // ── Red Fort architecture cache ──
    let fort = {
      wallL: 0, wallR: 0, wallTop: 0, wallBot: 0,
      archX: 0, archW: 0, archH: 0, archBot: 0,
      bastionL: {x:0,w:0,top:0}, bastionR: {x:0,w:0,top:0},
      merlonW: 0, merlonH: 0, merlonGap: 0,
    };

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
      const kiteData = [
        { bx: W*0.12, by: H*0.50, ty: H*0.12, s: 1.0, ss: 1.1, sa: 28 },
        { bx: W*0.24, by: H*0.58, ty: H*0.18, s: 0.8, ss: 1.5, sa: 20 },
        { bx: W*0.76, by: H*0.52, ty: H*0.14, s: 0.9, ss: 1.0, sa: 24 },
        { bx: W*0.88, by: H*0.60, ty: H*0.22, s: 0.72, ss: 1.4, sa: 16 },
        { bx: W*0.40, by: H*0.65, ty: H*0.28, s: 0.6, ss: 1.8, sa: 12 },
        { bx: W*0.62, by: H*0.62, ty: H*0.20, s: 0.65, ss: 1.3, sa: 14 },
      ];
      kiteData.forEach(d => kites.push({ x:d.bx, y:d.by, base_x:d.bx, base_y:d.by, target_y:d.ty, scale:d.s, angle:0, swaySpeed:d.ss, swayAmp:d.sa, tailPhase:Math.random()*100 }));

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
          w: 120 + Math.random() * 200,
          h: 20 + Math.random() * 30,
          a: 0.03 + Math.random() * 0.05,
          speed: 0.15 + Math.random() * 0.25,
        });
      }
    };
    rsz(); window.addEventListener('resize', rsz);

    // Film grain texture
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
          fw.y += fw.vy; fw.vy += 0.04;
          if (fw.vy >= -0.5 || fw.y < H*0.18) {
            fw.state = 'burst';
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
    };

    /* ═══════════════════════════════════════════════════════════
       RENDERER
       ═══════════════════════════════════════════════════════════ */
    const R = {
      /* ── SKY: Realistic golden-hour dawn ── */
      sky: (t: number, sa: number) => {
        c.save(); c.globalAlpha = sa;
        const g = c.createLinearGradient(0, 0, 0, H);
        if (t < 5) {
          const p = cl(t/5, 0, 1);
          g.addColorStop(0, `rgb(${lerp(12,28,p)|0},${lerp(18,42,p)|0},${lerp(48,95,p)|0})`);
          g.addColorStop(0.35, `rgb(${lerp(25,65,p)|0},${lerp(30,55,p)|0},${lerp(65,100,p)|0})`);
          g.addColorStop(0.6, `rgb(${lerp(60,170,p)|0},${lerp(50,100,p)|0},${lerp(60,60,p)|0})`);
          g.addColorStop(0.82, `rgb(${lerp(120,220,p)|0},${lerp(75,140,p)|0},${lerp(50,70,p)|0})`);
          g.addColorStop(1, `rgb(${lerp(160,245,p)|0},${lerp(100,170,p)|0},${lerp(55,90,p)|0})`);
        } else if (t < 11) {
          const p = cl((t-5)/6, 0, 1);
          g.addColorStop(0, `rgb(${lerp(28,55,p)|0},${lerp(42,80,p)|0},${lerp(95,140,p)|0})`);
          g.addColorStop(0.45, `rgb(${lerp(65,140,p)|0},${lerp(55,110,p)|0},${lerp(60,85,p)|0})`);
          g.addColorStop(0.75, `rgb(${lerp(170,235,p)|0},${lerp(100,155,p)|0},${lerp(60,80,p)|0})`);
          g.addColorStop(1, `rgb(${lerp(220,250,p)|0},${lerp(140,190,p)|0},${lerp(70,100,p)|0})`);
        } else {
          const p = cl((t-11)/4, 0, 1);
          g.addColorStop(0, `rgb(${lerp(55,8,p)|0},${lerp(80,14,p)|0},${lerp(140,48,p)|0})`);
          g.addColorStop(1, `rgb(${lerp(250,18,p)|0},${lerp(190,35,p)|0},${lerp(100,80,p)|0})`);
        }
        c.fillStyle = g; c.fillRect(0, 0, W, H);

        // Sun glow near horizon
        if (t > 2 && t < 12) {
          const si = cl((t-2)/2, 0, 1) * cl((12-t)/1, 0, 1);
          c.save(); c.globalAlpha = si * 0.35 * sa;
          c.globalCompositeOperation = 'screen';
          const sunX = cx + W * 0.15, sunY = baseY - gateH * 0.2;
          const sg = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, sc * 0.5);
          sg.addColorStop(0, 'rgba(255,220,140,0.5)');
          sg.addColorStop(0.3, 'rgba(255,160,60,0.15)');
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = sg;
          c.fillRect(sunX - sc*0.5, sunY - sc*0.5, sc, sc);
          c.restore();
        }
        c.restore();
      },

      /* ── STARS ── */
      stars: (t: number, sa: number) => {
        if (t > 5) return;
        const a = cl(1 - t/5, 0, 1) * sa;
        c.save(); c.globalAlpha = a;
        for (const idx of starI) {
          const p = pl[idx]; if (!p?.on) continue;
          const tw = Math.sin(t*3.2 + idx) * 0.35 + 0.65;
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * tw})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        }
        c.restore();
      },

      /* ── CLOUDS: Subtle atmospheric haze ── */
      clouds: (t: number, sa: number) => {
        if (t < 2) return;
        const a = cl((t-2)*0.3, 0, 1) * (t > 11 ? cl((12-t), 0, 1) : 1) * sa;
        c.save(); c.globalAlpha = a;
        clouds.forEach(cl_ => {
          cl_.x += cl_.speed * 0.016;
          if (cl_.x > W + cl_.w) cl_.x = -cl_.w;
          c.fillStyle = `rgba(255,230,200,${cl_.a})`;
          c.beginPath(); c.ellipse(cl_.x, cl_.y, cl_.w/2, cl_.h/2, 0, 0, 6.283); c.fill();
          c.beginPath(); c.ellipse(cl_.x - cl_.w*0.25, cl_.y + 5, cl_.w*0.35, cl_.h*0.4, 0, 0, 6.283); c.fill();
          c.beginPath(); c.ellipse(cl_.x + cl_.w*0.3, cl_.y + 3, cl_.w*0.3, cl_.h*0.35, 0, 0, 6.283); c.fill();
        });
        c.restore();
      },

      /* ── GROUND: Red sandstone plaza + lawns + paths ── */
      ground: (t: number, sa: number) => {
        const rev = cl((t - 0.6) * 0.4, 0, 1);
        c.save(); c.globalAlpha = rev * sa;
        const gT = baseY;

        // Main lawn
        const lg = c.createLinearGradient(0, gT, 0, H);
        lg.addColorStop(0, '#1a3318'); lg.addColorStop(0.15, '#152b13');
        lg.addColorStop(0.5, '#0f200e'); lg.addColorStop(1, '#091209');
        c.fillStyle = lg; c.fillRect(0, gT, W, H - gT);

        // Red sandstone plaza
        const plW = gateW * 1.05, plH = 32;
        const pg = c.createLinearGradient(0, gT - 4, 0, gT + plH);
        pg.addColorStop(0, '#8b4228'); pg.addColorStop(0.4, '#7a3820');
        pg.addColorStop(1, '#5a2815');
        c.fillStyle = pg; c.fillRect(cx - plW/2, gT - 4, plW, plH);
        c.fillStyle = 'rgba(200,150,100,0.12)'; c.fillRect(cx - plW/2, gT - 4, plW, 1.5);

        // Central path
        const pathW = gateW * 0.18;
        const pathG = c.createLinearGradient(0, gT, 0, gT + 60);
        pathG.addColorStop(0, '#6b4028'); pathG.addColorStop(1, '#3d2215');
        c.fillStyle = pathG;
        c.beginPath(); c.moveTo(cx - pathW/2, gT); c.lineTo(cx + pathW/2, gT);
        c.lineTo(cx + pathW*0.6, H); c.lineTo(cx - pathW*0.6, H); c.closePath(); c.fill();

        // Side paths
        [cx - gateW*0.3, cx + gateW*0.3].forEach(px => {
          c.fillStyle = '#3d2215';
          c.beginPath(); c.moveTo(px - 8, gT); c.lineTo(px + 8, gT);
          c.lineTo(px + 14, H); c.lineTo(px - 14, H); c.closePath(); c.fill();
        });

        // Trees
        const drawTree = (tx: number, ty: number, s: number, a: number) => {
          c.save(); c.globalAlpha = a;
          c.fillStyle = '#1a1008'; c.fillRect(tx - 2.5*s, ty - 22*s, 5*s, 24*s);
          for (let l = 0; l < 3; l++) {
            c.fillStyle = l === 1 ? '#0e1e0d' : '#0b180b';
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

        // Ground fog
        c.globalAlpha = rev * sa * 0.12;
        const fg = c.createLinearGradient(0, gT, 0, gT + 35);
        fg.addColorStop(0, 'rgba(180,140,100,0.25)'); fg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = fg; c.fillRect(0, gT, W, 35);

        c.restore();
      },

      /* ═══════════════════════════════════════════════════════════
         RED FORT — Cinematic Architectural Rendering
         ═══════════════════════════════════════════════════════════ */
      redFort: (t: number, sa: number) => {
        const rev = cl((t - 0.8) * 0.35, 0, 1);
        c.save(); c.globalAlpha = rev * sa;

        const { wallL, wallR, wallTop, wallBot, archX, archW, archH, archBot,
                bastionL, bastionR, merlonW, merlonH, merlonGap } = fort;

        // Palette — Real red sandstone
        const SAND = '#b84e34';
        const SAND_LT = '#d06848';
        const SAND_DK = '#7a3220';
        const SAND_SH = '#4e1c0e';
        const INLAY = '#e8d5b8';
        const DOME = '#f0ebe0';
        const GOLD = '#c89a18';

        // ── Ground shadow ──
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.beginPath(); c.ellipse(cx, baseY + 6, gateW * 0.55, 10, 0, 0, 6.283); c.fill();

        // ── Wide foundation (sinks into ground) ──
        const fpW = gateW * 1.08;
        const fpGrad = c.createLinearGradient(0, baseY - 6, 0, baseY + 14);
        fpGrad.addColorStop(0, SAND_LT); fpGrad.addColorStop(0.4, SAND);
        fpGrad.addColorStop(1, SAND_SH);
        c.fillStyle = fpGrad; c.fillRect(cx - fpW/2, baseY - 6, fpW, 20);
        c.fillStyle = 'rgba(220,180,140,0.15)'; c.fillRect(cx - fpW/2, baseY - 6, fpW, 1.5);
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(cx - fpW/2, baseY + 10, fpW, 4);

        // ── Stepped base ──
        c.fillStyle = SAND; c.fillRect(cx - fpW*0.46, baseY - 14, fpW*0.92, 8);
        c.fillStyle = 'rgba(220,180,140,0.1)'; c.fillRect(cx - fpW*0.46, baseY - 14, fpW*0.92, 1);

        // ── Helper: draw textured block ──
        const drawBlock = (x: number, y: number, w: number, h: number, shade: number) => {
          // Shadow
          c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
          // Body gradient (left darker = shadow side, right lighter = sun side)
          const bg = c.createLinearGradient(x, y, x + w, y);
          const r = lerp(122, 208, shade) | 0, g2 = lerp(50, 104, shade) | 0, b = lerp(32, 72, shade) | 0;
          bg.addColorStop(0, `rgb(${r*0.7|0},${g2*0.7|0},${b*0.7|0})`);
          bg.addColorStop(0.5, `rgb(${r},${g2},${b})`);
          bg.addColorStop(1, `rgb(${Math.min(255,r*1.15)|0},${Math.min(255,g2*1.12)|0},${Math.min(255,b*1.1)|0})`);
          c.fillStyle = bg; c.fillRect(x, y, w, h);
          // Top highlight
          c.fillStyle = `rgba(220,180,140,${0.08 * shade})`; c.fillRect(x, y, w, 1.5);
          // Stone block joints
          c.strokeStyle = 'rgba(0,0,0,0.06)'; c.lineWidth = 0.5;
          for (let by = y + 18; by < y + h; by += 18) {
            c.beginPath(); c.moveTo(x, by); c.lineTo(x + w, by); c.stroke();
          }
        };

        // ── Main wall body ──
        const wallW = wallR - wallL;
        const wallH = wallBot - wallTop;
        drawBlock(wallL, wallTop, wallW, wallH - 6, 0.55);

        // ── Horizontal inlay bands (Mughal architecture hallmark) ──
        c.fillStyle = INLAY;
        const bandPositions = [0.15, 0.45, 0.72, 0.92];
        bandPositions.forEach(bp => {
          const by = wallTop + wallH * bp;
          c.globalAlpha = rev * sa * 0.35;
          c.fillRect(wallL + 4, by, wallW - 8, 2);
        });
        c.globalAlpha = rev * sa;

        // ── Vertical pillar suggestions ──
        c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 1;
        const pillarCount = 12;
        for (let i = 1; i < pillarCount; i++) {
          const px = wallL + (wallW / pillarCount) * i;
          c.beginPath(); c.moveTo(px, wallTop + 10); c.lineTo(px, wallBot - 10); c.stroke();
        }

        // ── Battlements (merlons) ──
        c.fillStyle = SAND_LT;
        for (let mx = wallL + merlonGap; mx < wallR - merlonW; mx += merlonW + merlonGap) {
          c.fillRect(mx, wallTop - merlonH, merlonW, merlonH);
          c.fillStyle = 'rgba(220,180,140,0.1)'; c.fillRect(mx, wallTop - merlonH, merlonW, 1);
          c.fillStyle = SAND_LT;
        }

        // ── BASTIONS (corner towers) ──
        const drawBastion = (bx: number, bw: number, btop: number) => {
          const bh = wallBot - btop;
          drawBlock(bx, btop, bw, bh, 0.6);

          // Extra bands on bastion
          c.fillStyle = INLAY; c.globalAlpha = rev * sa * 0.3;
          c.fillRect(bx + 3, btop + bh * 0.3, bw - 6, 1.5);
          c.fillRect(bx + 3, btop + bh * 0.7, bw - 6, 1.5);
          c.globalAlpha = rev * sa;

          // Merlons on bastion
          const bmW = merlonW * 0.8, bmH = merlonH * 0.9;
          c.fillStyle = SAND_LT;
          for (let mx = bx + 2; mx < bx + bw - bmW; mx += bmW + merlonGap * 0.7) {
            c.fillRect(mx, btop - bmH, bmW, bmH);
          }

          // ── Chhatri (dome on pillars) ──
          const chW = bw * 0.7, chX = bx + (bw - chW) / 2, chY = btop - bmH;
          const pilH = 14;

          // Pillars
          c.fillStyle = SAND_LT;
          for (let pi = 0; pi < 4; pi++) {
            const ppx = chX + 3 + (chW - 6) * (pi / 3);
            c.fillRect(ppx, chY - pilH, 2.5, pilH);
          }
          // Platform
          c.fillStyle = SAND; c.fillRect(chX, chY - 2, chW, 3);
          // Dome
          c.beginPath(); c.arc(chX + chW/2, chY - 2, chW * 0.42, Math.PI, 0, false); c.closePath();
          const dg = c.createLinearGradient(chX, chY - 2 - chW*0.42, chX + chW, chY - 2);
          dg.addColorStop(0, '#d8d0c4'); dg.addColorStop(0.4, DOME); dg.addColorStop(1, '#c8c0b4');
          c.fillStyle = dg; c.fill();
          c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 0.7; c.stroke();
          // Finial
          c.fillStyle = GOLD;
          c.fillRect(chX + chW/2 - 1, chY - 2 - chW*0.42 - 5, 2, 6);
          c.beginPath(); c.arc(chX + chW/2, chY - 2 - chW*0.42 - 6, 2.5, 0, 6.283); c.fill();
        };

        drawBastion(bastionL.x, bastionL.w, bastionL.top);
        drawBastion(bastionR.x, bastionR.w, bastionR.top);

        // ── Small chhatris on wall ──
        const drawSmallChhatri = (sx: number) => {
          const sw = 18, sh = 10;
          c.fillStyle = SAND_LT;
          c.fillRect(sx - sw/2, wallTop - merlonH - 2, sw, 3);
          c.beginPath(); c.arc(sx, wallTop - merlonH - 2, sw*0.42, Math.PI, 0, false); c.closePath();
          c.fillStyle = DOME; c.fill();
          c.strokeStyle = 'rgba(0,0,0,0.1)'; c.lineWidth = 0.5; c.stroke();
          c.fillStyle = GOLD; c.fillRect(sx - 0.8, wallTop - merlonH - 2 - sw*0.42 - 3, 1.6, 4);
        };
        drawSmallChhatri(cx - wallW * 0.3);
        drawSmallChhatri(cx + wallW * 0.3);
        drawSmallChhatri(cx - wallW * 0.15);
        drawSmallChhatri(cx + wallW * 0.15);

        // ── LAHORE GATE — Central pointed arch ──
        const aL = archX - archW/2, aR = archX + archW/2;
        const aTop = archBot - archH;
        const aNeckY = archBot - archH * 0.6;

        // Arch border (inlay frame)
        c.save();
        c.beginPath();
        c.moveTo(aL - 6, archBot);
        c.lineTo(aL - 6, aNeckY - 4);
        c.quadraticCurveTo(aL - 6, aTop - 4, archX, aTop - 4);
        c.quadraticCurveTo(aR + 6, aTop - 4, aR + 6, aNeckY - 4);
        c.lineTo(aR + 6, archBot);
        c.closePath();
        c.fillStyle = INLAY; c.globalAlpha = rev * sa * 0.5; c.fill();
        c.globalAlpha = rev * sa;
        c.restore();

        // Arch shape
        c.save();
        c.beginPath();
        c.moveTo(aL, archBot);
        c.lineTo(aL, aNeckY);
        c.quadraticCurveTo(aL, aTop, archX, aTop);
        c.quadraticCurveTo(aR, aTop, aR, aNeckY);
        c.lineTo(aR, archBot);
        c.closePath(); c.clip();

        // Deep interior shadow
        const aShadow = c.createRadialGradient(archX, aTop + archH*0.3, archW*0.2, archX, aTop + archH*0.3, archW*0.7);
        aShadow.addColorStop(0, '#0d0403');
        aShadow.addColorStop(1, '#1a0805');
        c.fillStyle = aShadow; c.fillRect(aL, aTop, archW, archH + 5);

        // Inner arch hint
        const iaw = archW * 0.55, iah = archH * 0.5;
        c.strokeStyle = 'rgba(80,40,25,0.3)'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(archX - iaw/2, archBot);
        c.lineTo(archX - iaw/2, archBot - iah * 0.6);
        c.quadraticCurveTo(archX - iaw/2, archBot - iah, archX, archBot - iah);
        c.quadraticCurveTo(archX + iaw/2, archBot - iah, archX + iaw/2, archBot - iah * 0.6);
        c.lineTo(archX + iaw/2, archBot);
        c.stroke();
        c.restore();

        // ── Side arched windows ──
        const drawSideArch = (sx: number) => {
          const sw = archW * 0.4, sh = archH * 0.38;
          const sl = sx - sw/2, sr = sx + sw/2;
          const sTop = archBot - sh;
          const sNeck = archBot - sh * 0.6;
          c.save();
          c.beginPath();
          c.moveTo(sl, archBot); c.lineTo(sl, sNeck);
          c.quadraticCurveTo(sl, sTop, sx, sTop);
          c.quadraticCurveTo(sr, sTop, sr, sNeck);
          c.lineTo(sr, archBot); c.closePath(); c.clip();
          c.fillStyle = '#150604'; c.fillRect(sl, sTop, sw, sh + 2);
          c.restore();
          // Border
          c.strokeStyle = 'rgba(200,160,120,0.15)'; c.lineWidth = 1;
          c.beginPath();
          c.moveTo(sl, archBot); c.lineTo(sl, sNeck);
          c.quadraticCurveTo(sl, sTop, sx, sTop);
          c.quadraticCurveTo(sr, sTop, sr, sNeck);
          c.lineTo(sr, archBot); c.stroke();
        };
        drawSideArch(cx - wallW * 0.28);
        drawSideArch(cx + wallW * 0.28);
        drawSideArch(cx - wallW * 0.42);
        drawSideArch(cx + wallW * 0.42);

        // ── Rim light (golden hour sun from right) ──
        c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = rev * sa * 0.12;
        c.fillStyle = '#ffcc66';
        c.fillRect(wallR - 3, wallTop - merlonH, 4, wallH + merlonH);
        // Top edge rim
        c.fillRect(wallL, wallTop - merlonH - 1, wallW, 2);
        c.restore();

        c.restore();
      },

      /* ── TORCH ── */
      torch: (t: number, el: number, sa: number) => {
        if (t < 2.5) return;
        const tx = cx, ty = baseY - 6;
        const fa = cl((t-2.5)*1.2, 0, 1) * sa;
        c.save(); c.globalAlpha = fa; c.globalCompositeOperation = 'lighter';
        const gg = c.createRadialGradient(tx, ty, 0, tx, ty, 80);
        gg.addColorStop(0, 'rgba(255,140,20,0.6)'); gg.addColorStop(0.5, 'rgba(255,60,5,0.15)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gg; c.fillRect(tx-80, ty-80, 160, 200);
        const fl = Math.sin(el*30)*3, fH = 30+fl;
        const fg = c.createLinearGradient(tx, ty, tx, ty-fH);
        fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.2, 'rgba(255,210,80,0.9)');
        fg.addColorStop(0.6, 'rgba(255,120,20,0.5)'); fg.addColorStop(1, 'rgba(255,50,0,0)');
        c.fillStyle = fg; c.beginPath();
        c.moveTo(tx-8, ty); c.quadraticCurveTo(tx-3, ty-fH*0.5, tx, ty-fH);
        c.quadraticCurveTo(tx+3, ty-fH*0.5, tx+8, ty); c.closePath(); c.fill();
        c.restore();
      },

      /* ── FLAG: Hoisting then waving ── */
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

        for (let i = 1; i < numPts; i++) {
          const wind = 0.14 + noise.n2(el*0.55 + i*0.11, 0) * 0.13;
          fN[i].vx = (fN[i].x - fN[i].ox) * 0.94 + wind;
          fN[i].vy = (fN[i].y - fN[i].oy) * 0.94 + 0.02;
          fN[i].ox = fN[i].x; fN[i].oy = fN[i].y;
          fN[i].x += fN[i].vx; fN[i].y += fN[i].vy;
        }
        fN[0].x = cx; fN[0].y = curY;

        const ll = fw / (numPts - 1);
        for (let s = 0; s < 5; s++) {
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
        // Pole
        const pg = c.createLinearGradient(cx-2, pTopY, cx+2, pBaseY);
        pg.addColorStop(0, '#eee'); pg.addColorStop(0.5, '#fff'); pg.addColorStop(1, '#aaa');
        c.fillStyle = pg; c.fillRect(cx-2, pTopY, 4, pH);
        c.fillStyle = '#ffd700'; c.beginPath(); c.arc(cx, pTopY, 3.5, 0, 6.283); c.fill();

        // Flag strips
        for (let i = 0; i < numPts - 1; i++) {
          const a = fN[i], b = fN[i+1];
          const sh = 0.85 + Math.sin(i*0.3 - el*4) * 0.15;
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
        }

        // Chakra
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

      /* ── VOLUMETRIC LIGHT ── */
      volLight: (t: number, sa: number) => {
        if (t < 3.5 || t > 11) return;
        const int = cl((t-3.5)*0.18, 0, 0.45) * cl((11-t)*0.3, 0, 1) * sa;
        c.save(); c.globalAlpha = int; c.globalCompositeOperation = 'screen';
        const sx = cx + W*0.12, sy = baseY - gateH*0.4;
        for (let i = 0; i < 12; i++) {
          const a = -1.2 + (i/12)*2.4;
          const len = sc * 1.2;
          c.beginPath(); c.moveTo(sx, sy);
          c.lineTo(sx + Math.cos(a-0.04)*len, sy + Math.sin(a-0.04)*len);
          c.lineTo(sx + Math.cos(a+0.04)*len, sy + Math.sin(a+0.04)*len);
          c.closePath();
          const rg = c.createLinearGradient(sx, sy, sx + Math.cos(a)*len, sy + Math.sin(a)*len);
          rg.addColorStop(0, 'rgba(255,210,120,0.18)'); rg.addColorStop(0.5, 'rgba(255,120,40,0.04)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = rg; c.fill();
        }
        c.restore();
      },

      /* ── KITES: Realistic patang with tail ── */
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

          // Body - slight 3D curve effect
          const bodyGrad = c.createLinearGradient(-s, 0, s, 0);
          bodyGrad.addColorStop(0, '#ff9933'); bodyGrad.addColorStop(0.46, '#ffe0b0');
          bodyGrad.addColorStop(0.50, '#ffffff'); bodyGrad.addColorStop(0.54, '#ffffff');
          bodyGrad.addColorStop(0.58, '#c8f0c8'); bodyGrad.addColorStop(1, '#128807');
          c.fillStyle = bodyGrad;
          c.beginPath();
          c.moveTo(0, -s*1.35);
          c.bezierCurveTo(s*0.4, -s*0.8, s*1.05, -s*0.2, s*1.05, 0);
          c.bezierCurveTo(s*1.05, s*0.2, s*0.4, s*0.7, 0, s*1.15);
          c.bezierCurveTo(-s*0.4, s*0.7, -s*1.05, s*0.2, -s*1.05, 0);
          c.bezierCurveTo(-s*1.05, -s*0.2, -s*0.4, -s*0.8, 0, -s*1.35);
          c.fill();

          // Bamboo frame
          c.strokeStyle = 'rgba(120,80,30,0.35)'; c.lineWidth = 0.8;
          c.beginPath(); c.moveTo(0, -s*1.35); c.lineTo(0, s*1.15); c.stroke();
          c.beginPath(); c.moveTo(-s*1.05, 0); c.quadraticCurveTo(0, -s*0.15, s*1.05, 0); c.stroke();

          // Tail with bows
          c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 0.6;
          c.beginPath(); c.moveTo(0, s*1.15);
          const tailLen = Math.min(H - k.y, s * 18);
          const tailWave = Math.sin(t*2 + k.tailPhase) * s * 0.4;
          c.bezierCurveTo(tailWave, s*1.15 + tailLen*0.3, -tailWave*0.7, s*1.15 + tailLen*0.6, tailWave*0.3, s*1.15 + tailLen);
          c.stroke();

          // Tail bows (latexage)
          for (let bi = 1; bi <= 5; bi++) {
            const by = s*1.15 + tailLen * (bi/6);
            const bx = Math.sin(t*2 + k.tailPhase + bi) * s * 0.3 * (bi/5);
            const bowColors = ['#ff9933', '#ffffff', '#128807'];
            c.fillStyle = bowColors[bi % 3]; c.globalAlpha = ka * 0.6;
            c.beginPath(); c.arc(bx, by, s*0.2, 0, 6.283); c.fill();
            c.globalAlpha = ka;
          }

          // String going down
          c.strokeStyle = 'rgba(200,200,200,0.08)'; c.lineWidth = 0.4;
          c.beginPath(); c.moveTo(0, s*1.15);
          c.lineTo(Math.sin(t*0.5+k.tailPhase)*30, H - k.y + 50);
          c.stroke();

          c.restore();
        });
        c.restore();
      },

      /* ── DOVES ── */
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
          if (b.state === 'flying') {
            const wf = Math.sin(b.wing);
            c.fillStyle = '#f5f5f5';
            c.beginPath(); c.ellipse(0, 0, 14, 5, 0, 0, 6.283); c.fill();
            c.beginPath(); c.arc(12, -2, 3.5, 0, 6.283); c.fill();
            [-1,1].forEach(sd => {
              c.save(); c.scale(1, sd); c.rotate(wf*0.5 - 0.15);
              c.fillStyle = '#eee';
              c.beginPath(); c.moveTo(0,0); c.lineTo(-7,-14); c.lineTo(-12,-12); c.closePath(); c.fill();
              c.restore();
            });
          } else {
            const hb = Math.sin(el*4 + b.noiseSeed)*0.8;
            c.fillStyle = '#eee';
            c.beginPath(); c.ellipse(0, 2, 12, 6, 0.1, 0, 6.283); c.fill();
            c.beginPath(); c.arc(9, -2+hb, 3.5, 0, 6.283); c.fill();
          }
          c.restore();
        });
        c.restore();
      },

      /* ═══════════════════════════════════════════════════════════
         TYPOGRAPHY — 80th Anniversary Edition
         ═══════════════════════════════════════════════════════════ */
      typography: (t: number) => {
        if (t < 12.5) return;
        const titleY = lerp(H*0.56, H*0.40, eOE((t-12.5)*0.45));
        c.save();

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
          c.fillStyle = 'rgba(0,0,0,0.9)'; c.fillText(title[i], xo+2, cy+2);
          const sg = c.createLinearGradient(xo, cy-fs*0.5, xo, cy+fs*0.38);
          sg.addColorStop(0, '#FF9933'); sg.addColorStop(0.47, '#FFFFFF');
          sg.addColorStop(0.53, '#FFFFFF'); sg.addColorStop(1, '#138808');
          c.fillStyle = sg; c.fillText(title[i], xo, cy);
          c.restore(); xo += cw;
        }

        // 80th Anniversary
        if (t > 14.0) {
          const sa = cl((t-14.0)*1.8, 0, 1);
          c.save(); c.globalAlpha = sa;
          c.textAlign = 'center';
          c.font = `400 ${fs*0.32}px 'Cinzel','Georgia',serif`;
          c.fillStyle = '#c89a18';
          c.fillText("80th Anniversary  •  1947 — 2027", W*0.5, titleY + fs*0.85);
          c.restore();
        }

        // जय हिन्द
        if (t > 15.0) {
          const ja = cl((t-15.0)*2, 0, 1);
          c.save(); c.globalAlpha = ja; c.textAlign = 'center';
          c.font = `500 ${fs*0.6}px 'Georgia',serif`;
          c.fillStyle = '#ffd700'; c.fillText("जय हिन्द", W*0.5, titleY + fs*1.35);
          c.restore();
        }
        c.restore();
      },

      fireworks: (sa: number) => {
        c.save(); c.globalCompositeOperation = 'lighter';
        fwList.forEach(fw => {
          if (fw.state === 'rising') {
            c.fillStyle = 'rgba(255,230,150,0.95)';
            c.beginPath(); c.arc(fw.x, fw.y, 2.5, 0, 6.283); c.fill();
          } else {
            fw.pts.forEach(pt => {
              const a = cl(pt.life/pt.ml, 0, 1) * sa;
              const fg = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.sz*2);
              fg.addColorStop(0, `rgba(${fw.col.r},${fw.col.g},${fw.col.b},${a})`);
              fg.addColorStop(1, 'rgba(0,0,0,0)');
              c.fillStyle = fg; c.beginPath(); c.arc(pt.x, pt.y, pt.sz*2, 0, 6.283); c.fill();
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
      // Fog
      if (Math.random() < 0.10) {
        const p = grab(pl); if (p) { p.on=true; p.x=Math.random()*W; p.y=H*0.6+Math.random()*H*0.3; p.vx=(Math.random()-0.5)*0.15; p.vy=-0.04; p.life=8; p.ml=8; p.sz=30+Math.random()*35; p.r=200; p.g=190; p.b=170; p.a=0.04; p.tp=1; }
      }
      // Gold dust
      if (t > 4 && t < 11 && Math.random() < 0.3) {
        const p = grab(pl); if (p) { p.on=true; p.x=Math.random()*W; p.y=H+10; p.vx=(Math.random()-0.5)*0.4; p.vy=-0.35-Math.random()*0.6; p.life=6; p.ml=6; p.sz=1.5+Math.random()*2.5; p.r=255; p.g=200; p.b=50; p.a=0.7; p.tp=5; }
      }
      // Marigold petals (Red Fort decoration)
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
      // Torch embers
      if (t > 2.5 && Math.random() < 0.2) {
        const p = grab(pl); if (p) { p.on=true; p.x=cx+(Math.random()-0.5)*12; p.y=baseY-6; p.vx=(Math.random()-0.5)*0.5; p.vy=-1.0-Math.random()*1.5; p.life=2.5; p.ml=2.5; p.sz=0.8+Math.random()*1.5; p.r=255; p.g=120+Math.random()*80|0; p.b=30; p.a=0.9; p.tp=3; }
      }
    };

    const updateP = (dt: number, el: number) => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue; p.life -= dt;
        if (p.tp === 2) {
          p.vy += 0.012; p.vy *= 0.988;
          p.vx = p.vx*0.95 + Math.sin(el*0.7 + p.y*0.01)*0.025;
          p.x += p.vx; p.y += p.vy; p.rot += p.rs;
        } else if (p.tp === 5) {
          p.vy *= 0.992;
          p.vx = p.vx*0.96 + noise.n2(el*0.4+p.y*0.008, p.turbOff)*0.12;
          p.x += p.vx; p.y += p.vy;
        } else { p.x += p.vx; p.y += p.vy; }
        if (p.life <= 0 || p.x < -100 || p.x > W+100 || p.y > H+100) p.on = false;
      }
    };

    const drawP = () => {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue;
        const a = cl(p.life/p.ml, 0, 1) * p.a;
        c.save(); c.globalAlpha = a;
        if (p.tp === 2) {
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.beginPath(); c.ellipse(0, 0, p.sz*0.6, p.sz, 0, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.15)';
          c.beginPath(); c.arc(0, 0, p.sz*0.3, 0, 6.283); c.fill();
        } else if (p.tp === 5) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        } else if (p.tp === 3) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        } else {
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, 6.283); c.fill();
        }
        c.restore();
      }
    };

    /* ═══════════════════════════════════════════════════════════
       POST PROCESSING
       ═══════════════════════════════════════════════════════════ */
    const postFX = () => {
      // Warm color grade
      c.save(); c.globalCompositeOperation = 'soft-light';
      const cg = c.createLinearGradient(0, 0, W, H);
      cg.addColorStop(0, 'rgba(255,140,50,0.12)');
      cg.addColorStop(1, 'rgba(0,40,80,0.18)');
      c.fillStyle = cg; c.fillRect(0, 0, W, H);
      c.restore();
      // Vignette
      const vg = c.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.85);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      // Grain
      c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.025;
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0, 0, W, H); }
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

      // Fireworks
      if (t >= 6.0 && t < 12.0) {
        fwT += dt;
        if (fwT > 0.7 + Math.random()*0.5) { spawnFW(); fwT = 0; }
      }
      // Extra fireworks during text
      if (t >= 13.0 && t < 17.0) {
        fwT += dt;
        if (fwT > 1.2) { spawnFW(); fwT = 0; }
      }
      updateFW(dt);
      spawnP(t, now/1000);
      updateP(dt, now/1000);

      // Clear
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);

      // Subtle cinematic camera
      camShake *= 0.92;
      const bx = Math.sin(t*0.35)*1.5 + (Math.random()-0.5)*camShake;
      const by = Math.cos(t*0.25)*1.0 + (Math.random()-0.5)*camShake;
      const zoom = 1.0 + Math.sin(t*0.08)*0.008;

      c.save();
      c.translate(W/2 + bx, H/2 + by);
      c.scale(zoom, zoom);
      c.translate(-W/2, -H/2);

      // Scene alpha: fade out scene before text
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

      // Transition to dark background for text
      if (t >= 11.5 && t < 13.5) {
        const bf = cl((t-11.5)*1.5, 0, 1);
        c.save(); c.globalAlpha = bf;
        const bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#060810'); bg.addColorStop(1, '#0c101c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.restore();
      }

      // Typography (drawn on top of dark bg)
      R.typography(t);

      // Post processing
      postFX();

      // Subtle chromatic aberration
      c.save(); c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.008; c.drawImage(cv, -1, 0, W, H);
      c.globalAlpha = 0.006; c.drawImage(cv, 1, 0, W, H);
      c.restore();

      // Final fade to white then black
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
