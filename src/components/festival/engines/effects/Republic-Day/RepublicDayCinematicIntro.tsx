'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & INTERFACES (2027 AAA Architecture)
   ═══════════════════════════════════════════════════════════════ */
interface Particle {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  life: number; ml: number; sz: number;
  r: number; g: number; b: number; a: number;
  rot: number; rs: number; on: boolean; tp: number;
}

interface Jet {
  x: number; y: number; vx: number; vy: number;
  scale: number; smokeColor: string; active: boolean;
}

const POOL_SIZE = 5000;
const DUR = 15.0; // 15 Seconds Cinematic Timeline

/* ═══════════════════════════════════════════════════════════════
   EASING HELPERS & CINEMATIC MATH
   ═══════════════════════════════════════════════════════════════ */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIO = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOE = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const eOB = (t: number) => { // Back Out
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ACES Filmic Tone Mapping for Photorealistic Dynamic Range
const ACESFilmic = (x: number) => {
  const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1);
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: RepublicDayCinematicIntro
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
      a.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, ml: 1, sz: 0, r: 255, g: 153, b: 51, a: 0, rot: 0, rs: 0, on: false, tp: 0 });
    }
    return a;
  }, []);

  const grab = useCallback((p: Particle[]) => {
    for (let i = 0; i < p.length; i++) if (!p[i].on) return p[i];
    return null;
  }, []);

  /* ─── PROCEDURAL HYBRID ORCHESTRAL MILITARY SYNTH ─── */
  const triggerAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Deep Military Percussion
      for (let beat = 0; beat < 12; beat++) {
        const bt = ctx.currentTime + beat * 0.35;
        const kick = ctx.createOscillator();
        const kg = ctx.createGain();
        kick.frequency.setValueAtTime(140, bt);
        kick.frequency.exponentialRampToValueAtTime(30, bt + 0.15);
        kg.gain.setValueAtTime(0.4, bt);
        kg.gain.exponentialRampToValueAtTime(0.001, bt + 0.2);
        kick.connect(kg); kg.connect(ctx.destination);
        kick.start(bt); kick.stop(bt + 0.2);

        if (beat % 2 === 0) {
          const bufSz = ctx.sampleRate * 0.1;
          const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < bufSz; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSz, 2);
          const ns = ctx.createBufferSource(); ns.buffer = buf;
          const ng = ctx.createGain(); ng.gain.value = 0.15;
          const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
          ns.connect(hp); hp.connect(ng); ng.connect(ctx.destination);
          ns.start(bt); ns.stop(bt + 0.1);
        }
      }

      // Epic Orchestral Strings Chord (Am - F - C - G)
      [110.00, 130.81, 164.81, 196.00, 261.63, 329.63, 392.00].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle'; 
        osc.frequency.value = freq;
        const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 800;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 1.5);
        g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3.0);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 6.0);
        osc.connect(flt); flt.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 6.0);
      });
    } catch (e) {}
  }, []);

  /* ═══════════════════════════════════════════════════════════
     CANVAS LIFE CYCLE & RENDER PIPELINE
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const c = cv.getContext('2d', { alpha: false }); if (!c) return;

    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    triggerAudio();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const rsz = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    rsz(); window.addEventListener('resize', rsz);

    // Procedural Grain Texture
    const grainCv = document.createElement('canvas');
    grainCv.width = 512; grainCv.height = 512;
    const gc = grainCv.getContext('2d')!;
    const gd = gc.createImageData(512, 512);
    for (let i = 0; i < gd.data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      gd.data[i] = v; gd.data[i + 1] = v; gd.data[i + 2] = v; gd.data[i + 3] = 255;
    }
    gc.putImageData(gd, 0, 0);

    const pl = mkPool();
    const jets: Jet[] = [
      { x: -W * 0.3, y: H * 0.25, vx: 14, vy: 5, scale: 1, smokeColor: '#FF9933', active: true },
      { x: -W * 0.35, y: H * 0.30, vx: 14, vy: 5, scale: 0.9, smokeColor: '#FFFFFF', active: true },
      { x: -W * 0.4, y: H * 0.35, vx: 14, vy: 5, scale: 0.8, smokeColor: '#138808', active: true }
    ];
    const doves = Array.from({ length: 10 }, (_, i) => ({
      x: W * (0.1 + i * 0.1),
      y: H * (0.6 + Math.random() * 0.3),
      vx: 1.2 + Math.random() * 0.5,
      vy: -0.5 - Math.random() * 0.3,
      wing: Math.random() * Math.PI * 2
    }));

    /* 🌌 1. ATMOSPHERE & VOLUMETRIC SKY */
    function drawAtmosphere(t: number, elapsed: number) {
      const p1 = clamp(t / 5, 0, 1); 
      const p2 = clamp((t - 3) / 6, 0, 1);
      const p3 = clamp((t - 8) / 7, 0, 1);

      // Deep night to Saffron Dawn Lerp
      const r = lerp(lerp(4, 20, p1), lerp(255, 255, p3), p2);
      const g = lerp(lerp(8, 40, p1), lerp(140, 200, p3), p2);
      const b = lerp(lerp(25, 70, p1), lerp(50, 150, p3), p2);

      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgb(${r*0.4},${g*0.4},${b*0.8})`); // Cold Top
      grad.addColorStop(0.6, `rgb(${r*0.8},${g*0.7},${b*0.6})`); // Mid Atmosphere
      grad.addColorStop(1, `rgb(${r},${g*0.9},${b*0.4})`); // Warm Horizon
      c.fillStyle = grad;
      c.fillRect(-W, -H, W * 3, H * 3);

      // Stars
      if (t < 8) {
        const alpha = 1 - p2;
        c.save();
        c.globalAlpha = alpha;
        for (let i = 0; i < 400; i++) {
          const x = (Math.sin(i * 92.3) * 0.5 + 0.5) * W;
          const y = (Math.cos(i * 45.1) * 0.5 + 0.5) * H * 0.7;
          const tw = Math.sin(elapsed * 4 + i) * 0.5 + 0.5;
          const sz = (Math.sin(i * 12.4) * 0.5 + 0.5) * 1.5 + 0.3;
          c.fillStyle = `rgba(255, 255, 255, ${tw * 0.9})`;
          c.beginPath(); c.arc(x, y, sz, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }
    }

    /* ☀️ 2. SUN & PHYSICALLY BASED GOD RAYS */
    function drawSunAndRays(t: number, elapsed: number) {
      if (t < 4) return;
      const sunY = lerp(H * 1.2, H * 0.35, eOE((t - 4) / 5));
      const sunX = W * 0.5;
      const intensity = clamp((t - 4) * 0.5, 0, 1);

      c.save();
      c.globalCompositeOperation = 'screen';
      
      // HDR Bloom
      const bloom = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.9);
      bloom.addColorStop(0, `rgba(255, 240, 200, ${0.9 * intensity})`);
      bloom.addColorStop(0.15, `rgba(255, 180, 80, ${0.6 * intensity})`);
      bloom.addColorStop(0.4, `rgba(255, 100, 30, ${0.2 * intensity})`);
      bloom.addColorStop(1, 'rgba(255, 50, 0, 0)');
      c.fillStyle = bloom;
      c.fillRect(0, 0, W, H);

      // Sun Core
      const core = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
      core.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
      core.addColorStop(0.3, `rgba(255, 250, 220, ${0.9 * intensity})`);
      core.addColorStop(1, 'rgba(255, 200, 100, 0)');
      c.fillStyle = core;
      c.fillRect(sunX - 150, sunY - 150, 300, 300);

      // Volumetric God Rays
      const rayInt = clamp((t - 5) * 0.4, 0, 1);
      if (rayInt > 0) {
        c.translate(sunX, sunY);
        c.rotate(Math.sin(elapsed * 0.05) * 0.02);
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2 + elapsed * 0.01;
          const len = H * 1.5;
          const wid = 100 + Math.sin(elapsed * 2 + i) * 50;
          c.save();
          c.rotate(angle);
          const ray = c.createLinearGradient(0, 0, 0, len);
          ray.addColorStop(0, `rgba(255, 230, 180, ${0.25 * rayInt})`);
          ray.addColorStop(0.5, `rgba(255, 200, 150, ${0.1 * rayInt})`);
          ray.addColorStop(1, 'rgba(255, 200, 150, 0)');
          c.fillStyle = ray;
          c.beginPath();
          c.moveTo(-wid/4, 0); c.lineTo(wid/4, 0);
          c.lineTo(wid, len); c.lineTo(-wid, len);
          c.closePath(); c.fill();
          c.restore();
        }
      }
      c.restore();
    }

    /* 💨 3. DEPTH FOG & ATMOSPHERIC SCATTERING */
    function drawFog(t: number, elapsed: number) {
      c.save();
      c.globalCompositeOperation = 'screen';
      const off = elapsed * 10;
      const haze = c.createLinearGradient(0, H * 0.4, 0, H);
      haze.addColorStop(0, 'rgba(20, 30, 50, 0)');
      haze.addColorStop(0.7, `rgba(80, 90, 110, ${0.3 + (t/15) * 0.1})`);
      haze.addColorStop(1, `rgba(160, 170, 190, ${0.5 + (t/15) * 0.2})`);
      c.fillStyle = haze;
      c.fillRect(0, H * 0.4, W, H * 0.6);

      for(let i=0; i<8; i++) {
        const x = (i * W * 0.25 + off) % (W * 1.5) - W * 0.2;
        const y = H * (0.65 + i * 0.04);
        const g = c.createRadialGradient(x, y, 0, x, y, 500);
        g.addColorStop(0, `rgba(200, 210, 230, ${0.1 + (t/15) * 0.05})`);
        g.addColorStop(1, 'rgba(200, 210, 230, 0)');
        c.fillStyle = g;
        c.fillRect(x - 500, y - 500, 1000, 1000);
      }
      c.restore();
    }

    /* 🏛️ 4. PROCEDURAL INDIA GATE (Architectural Detail) */
    function drawIndiaGate(t: number) {
      const sc = Math.min(W, H);
      const gateW = sc * 0.65;
      const gateH = gateW * 0.85;
      const baseY = H * 0.82;
      const cx = W * 0.5;

      c.save();
      const reveal = clamp((t - 1) * 0.5, 0, 1);
      c.globalAlpha = reveal;

      // PBR Sandstone Material
      const sBase = `rgb(${lerp(20, 190, t/15)}, ${lerp(20, 160, t/15)}, ${lerp(20, 120, t/15)})`;
      const sDark = `rgb(${lerp(5, 80, t/15)}, ${lerp(5, 65, t/15)}, ${lerp(5, 45, t/15)})`;
      const sHigh = `rgb(${lerp(40, 230, t/15)}, ${lerp(40, 200, t/15)}, ${lerp(40, 160, t/15)})`;
      
      const drawArchBlock = (x: number, y: number, w: number, h: number, d: number) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, sHigh); g.addColorStop(0.4, sBase); g.addColorStop(1, sDark);
        c.fillStyle = g; c.fillRect(x, y, w, h);
        c.fillStyle = sDark; c.fillRect(x, y - d, w, d); // Depth extrusion
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x, y + h - 3, w, 3); // AO
      };

      // Foundations
      drawArchBlock(cx - gateW/2 - 60, baseY - 30, gateW + 120, 30, 15);
      drawArchBlock(cx - gateW/2 - 30, baseY - 60, gateW + 60, 30, 20);
      
      // Main Body
      drawArchBlock(cx - gateW/2, baseY - gateH, gateW, gateH, 40);
      
      // Central Arch Void
      const aW = gateW * 0.35, aH = gateH * 0.65;
      c.beginPath();
      c.moveTo(cx - aW/2, baseY - 60);
      c.lineTo(cx - aW/2, baseY - 60 - aH * 0.6);
      c.quadraticCurveTo(cx, baseY - 60 - aH, cx + aW/2, baseY - 60 - aH * 0.6);
      c.lineTo(cx + aW/2, baseY - 60);
      c.closePath();
      const aG = c.createLinearGradient(cx, baseY - aH, cx, baseY);
      aG.addColorStop(0, 'rgba(0,0,0,0.98)'); aG.addColorStop(1, 'rgba(10,5,0,0.8)');
      c.fillStyle = aG; c.fill();

      // Side Arches
      [-1, 1].forEach(s => {
        const sAW = gateW * 0.16, sAH = gateH * 0.42;
        const sX = cx + s * gateW * 0.33;
        c.beginPath();
        c.moveTo(sX - sAW/2, baseY - 60);
        c.lineTo(sX - sAW/2, baseY - 60 - sAH * 0.6);
        c.quadraticCurveTo(sX, baseY - 60 - sAH, sX + sAW/2, baseY - 60 - sAH * 0.6);
        c.lineTo(sX + sAW/2, baseY - 60);
        c.closePath();
        c.fillStyle = 'rgba(0,0,0,0.92)'; c.fill();
      });

      // Fluted Columns
      for(let i=0; i<10; i++) {
        const cX = cx - gateW/2 + (gateW / 10) * i + 12;
        const cG = c.createLinearGradient(cX, 0, cX + 24, 0);
        cG.addColorStop(0, sDark); cG.addColorStop(0.5, sHigh); cG.addColorStop(1, sDark);
        c.fillStyle = cG; c.fillRect(cX, baseY - gateH * 0.85, 24, gateH * 0.85);
      }

      // Top Canopy & Cornices
      const cY = baseY - gateH - 60;
      drawArchBlock(cx - gateW * 0.18, cY, gateW * 0.36, 60, 50);
      c.beginPath();
      c.moveTo(cx - gateW * 0.22, cY);
      c.lineTo(cx, cY - 80);
      c.lineTo(cx + gateW * 0.22, cY);
      c.closePath();
      c.fillStyle = sDark; c.fill();

      // Torch Bounce Light
      if (t > 2) {
        c.save();
        c.globalCompositeOperation = 'overlay';
        const tL = c.createRadialGradient(W/2, H*0.78, 0, W/2, H*0.78, gateH);
        tL.addColorStop(0, 'rgba(255, 100, 30, 0.9)');
        tL.addColorStop(1, 'rgba(255, 80, 0, 0)');
        c.fillStyle = tL;
        c.fillRect(cx - gateW/2, baseY - gateH, gateW, gateH);
        c.restore();
      }
      c.restore();
    }

    /* 🔥 5. AMAR JAWAN JYOTI (Volumetric Fire) */
    function drawTorch(t: number, elapsed: number) {
      const tx = W * 0.5, ty = H * 0.78;
      if (t > 1.5) {
        const fA = clamp((t - 1.5) * 2, 0, 1);
        c.save();
        c.globalAlpha = fA;
        c.globalCompositeOperation = 'lighter';
        
        const gG = c.createRadialGradient(tx, ty, 0, tx, ty, 500);
        gG.addColorStop(0, 'rgba(255, 180, 80, 0.9)');
        gG.addColorStop(0.2, 'rgba(255, 120, 30, 0.5)');
        gG.addColorStop(0.5, 'rgba(200, 50, 0, 0.2)');
        gG.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gG; c.fillRect(tx - 500, ty - 500, 1000, 1000);

        const fl = Math.sin(elapsed * 30) * 10 + Math.sin(elapsed * 11) * 5;
        const fG = c.createRadialGradient(tx, ty + fl, 0, tx, ty + fl, 100);
        fG.addColorStop(0, 'rgba(255, 255, 240, 1)');
        fG.addColorStop(0.3, 'rgba(255, 220, 100, 0.9)');
        fG.addColorStop(0.7, 'rgba(255, 100, 0, 0.5)');
        fG.addColorStop(1, 'rgba(255, 0, 0, 0)');
        c.fillStyle = fG;
        c.beginPath();
        c.moveTo(tx - 60, ty);
        c.quadraticCurveTo(tx - 40, ty - 120 + fl, tx, ty - 180 + fl);
        c.quadraticCurveTo(tx + 40, ty - 120 - fl, tx + 60, ty);
        c.closePath(); c.fill();

        if (Math.random() < 0.8) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = tx + (Math.random() - 0.5) * 40;
            p.y = ty - 120; p.vx = (Math.random() - 0.5) * 1.5;
            p.vy = -3 - Math.random() * 4; p.life = 4; p.ml = 4;
            p.sz = 1.5 + Math.random() * 2.5;
            p.r = 255; p.g = 150 + Math.random() * 100; p.b = 50; p.a = 1;
            p.tp = 3; // Ember
          }
        }
        c.restore();
      }
    }

    /* 🇮🇳 6. PROCEDURAL 3D FLAG MESH (Cloth Simulation) */
    function drawFlagMesh(t: number, elapsed: number) {
      if (t < 6) return;
      const fA = clamp((t - 6) * 1.5, 0, 1);
      const rY = lerp(H * 1.4, H * 0.2, eOB((t - 6) / 3)); // Majestic rise

      const fW = W * 0.6, fH = fW * (2/3), cx = W * 0.5;
      c.save();
      c.globalAlpha = fA;

      const cols = 50, rows = 25;
      const cW = fW / cols, cH = fH / rows;
      const pts: {x: number, y: number, z: number, s: number}[][] = [];

      // Wind Solver
      for (let y = 0; y <= rows; y++) {
        pts[y] = [];
        for (let x = 0; x <= cols; x++) {
          const w1 = Math.sin(x * 0.15 + elapsed * 3) * 30;
          const w2 = Math.sin(y * 0.2 - elapsed * 2 + x * 0.05) * 20;
          const fl = Math.sin(x * 0.8 + elapsed * 12) * 8;
          const z = (w1 + w2 + fl) / 58;
          const s = clamp(0.3 + z * 0.7, 0, 1);
          pts[y][x] = { x: cx - fW/2 + x * cW + (z * 20), y: rY + y * cH, z, s };
        }
      }

      // Render Cloth Quads
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const p1 = pts[y][x], p2 = pts[y][x+1], p3 = pts[y+1][x], p4 = pts[y+1][x+1];
          const aS = (p1.s + p2.s + p3.s + p4.s) / 4;
          let col = [0,0,0];
          if (y < rows / 3) col = [255, 153, 51];
          else if (y < rows * 2 / 3) col = [255, 255, 255];
          else col = [18, 136, 8];

          const r = ACESFilmic(col[0] * aS / 255) * 255;
          const g = ACESFilmic(col[1] * aS / 255) * 255;
          const b = ACESFilmic(col[2] * aS / 255) * 255;
          c.fillStyle = `rgb(${r}, ${g}, ${b})`;
          c.beginPath();
          c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.lineTo(p4.x, p4.y); c.lineTo(p3.x, p3.y);
          c.closePath(); c.fill();
        }
      }

      // Metallic Ashoka Chakra
      const cX = cx + pts[Math.floor(rows/2)][Math.floor(cols/2)].x - cx;
      const cY = rY + fH / 2;
      c.save();
      c.translate(cX, cY);
      c.rotate(elapsed * 0.1);
      const rad = fH * 0.16;
      const mG = c.createRadialGradient(0, 0, 0, 0, 0, rad);
      mG.addColorStop(0, '#1a1a8a'); mG.addColorStop(0.7, '#000050'); mG.addColorStop(1, '#000030');
      c.strokeStyle = mG; c.lineWidth = rad * 0.1;
      c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.stroke();
      c.lineWidth = rad * 0.05;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        c.beginPath();
        c.moveTo(Math.cos(a) * rad * 0.1, Math.sin(a) * rad * 0.1);
        c.lineTo(Math.cos(a) * rad * 0.95, Math.sin(a) * rad * 0.95);
        c.strokeStyle = mG; c.stroke();
      }
      c.fillStyle = mG; c.beginPath(); c.arc(0, 0, rad * 0.18, 0, Math.PI * 2); c.fill();
      c.strokeStyle = `rgba(255, 215, 0, 0.6)`; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, rad * 1.08, 0, Math.PI * 2); c.stroke();
      c.restore();

      // Pole
      const pG = c.createLinearGradient(cx - fW/2 - 12, 0, cx - fW/2 + 12, 0);
      pG.addColorStop(0, '#2a1a0a'); pG.addColorStop(0.5, '#6B4513'); pG.addColorStop(1, '#2a1a0a');
      c.fillStyle = pG; c.fillRect(cx - fW/2 - 12, rY - 60, 24, H);
      c.fillStyle = '#FFD700'; c.beginPath(); c.arc(cx - fW/2, rY - 60, 14, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    /* ✈️ 7. JETS & VOLUMETRIC SMOKE */
    function drawJets(t: number) {
      if (t < 8 || t > 11) return;
      const act = jets.filter(j => j.x < W + 500);
      act.forEach(jet => {
        jet.x += jet.vx; jet.y += jet.vy;
        if (Math.random() < 0.85) {
          const p = grab(pl); if (p) {
            p.on = true; p.x = jet.x - 35 * jet.scale; p.y = jet.y + 8 * jet.scale;
            p.vx = -3 + Math.random(); p.vy = (Math.random() - 0.5) * 1.5;
            p.life = 4; p.ml = 4; p.sz = 25 * jet.scale + Math.random() * 25;
            const h = jet.smokeColor.replace('#', '');
            p.r = parseInt(h.substring(0, 2), 16);
            p.g = parseInt(h.substring(2, 4), 16);
            p.b = parseInt(h.substring(4, 6), 16);
            p.a = 0.7; p.tp = 4;
          }
        }

        c.save();
        c.translate(jet.x, jet.y);
        c.scale(jet.scale, jet.scale);
        // Afterburner
        const bG = c.createRadialGradient(-30, 0, 0, -30, 0, 45);
        bG.addColorStop(0, 'rgba(255, 255, 255, 1)');
        bG.addColorStop(0.2, 'rgba(100, 200, 255, 0.8)');
        bG.addColorStop(0.6, 'rgba(255, 150, 50, 0.6)');
        bG.addColorStop(1, 'rgba(255, 50, 0, 0)');
        c.fillStyle = bG; c.fillRect(-80, -20, 50, 40);

        // Sukhoi Body
        c.fillStyle = '#0a0a0a';
        c.beginPath();
        c.moveTo(45, 0); c.quadraticCurveTo(20, -6, -15, -7); c.lineTo(-35, -5);
        c.lineTo(-35, 5); c.lineTo(-15, 7); c.quadraticCurveTo(20, 6, 45, 0); c.fill();
        // Canopy
        c.fillStyle = 'rgba(20, 40, 80, 0.8)';
        c.beginPath(); c.ellipse(15, -1, 14, 4.5, 0, 0, Math.PI * 2); c.fill();
        // Wings
        c.fillStyle = '#111';
        c.beginPath(); c.moveTo(5, 0); c.lineTo(-30, -40); c.lineTo(-40, -40); c.lineTo(-15, 0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(5, 0); c.lineTo(-30, 40); c.lineTo(-40, 40); c.lineTo(-15, 0); c.closePath(); c.fill();
        c.restore();
      });
    }

    /* 🎊 8. PARTICLES (Embers, Confetti, Bokeh) */
    function spawnParticles(t: number, elapsed: number) {
      // Dust Motes
      if (t > 1 && Math.random() < 0.4) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = Math.random() * H;
          p.vx = Math.sin(elapsed + Math.random()*10) * 0.4; p.vy = -0.3 - Math.random() * 0.4;
          p.life = 6; p.ml = 6; p.sz = 1 + Math.random() * 2.5;
          p.r = 255; p.g = 200 + Math.random() * 55; p.b = 150; p.a = 0.5; p.tp = 1;
        }
      }
      // Tricolor Confetti
      if (t > 9 && Math.random() < 0.5) {
        const p = grab(pl); if (p) {
          p.on = true; p.x = Math.random() * W; p.y = -10;
          p.vx = (Math.random() - 0.5) * 4; p.vy = 1 + Math.random() * 3;
          p.life = 7; p.ml = 7; p.sz = 7 + Math.random() * 10;
          const ct = Math.random();
          if (ct < 0.33) { p.r = 255; p.g = 153; p.b = 51; }
          else if (ct < 0.66) { p.r = 255; p.g = 255; p.b = 255; }
          else { p.r = 18; p.g = 136; p.b = 8; }
          p.a = 1; p.rot = Math.random() * Math.PI * 2; p.rs = (Math.random() - 0.5) * 0.2; p.tp = 2;
        }
      }
    }

    function updateParticles(dt: number, elapsed: number) {
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i]; if (!p.on) continue;
        p.life -= dt; p.x += p.vx; p.y += p.vy;
        if (p.tp === 4) { p.sz += 0.6; p.vx *= 0.98; p.vy *= 0.98; p.life -= 0.012; } 
        else if (p.tp === 2) { p.rot += p.rs; p.vy += 0.05; p.vx += Math.sin(elapsed + p.y * 0.01) * 0.15; p.life -= 0.01; } 
        else if (p.tp === 3) { p.vy -= 0.025; p.vx += (Math.random() - 0.5) * 0.25; p.life -= 0.018; } 
        else { p.life -= 0.005; }
        if (p.life <= 0 || p.x < -100 || p.x > W + 100 || p.y > H + 100) p.on = false;
      }
    }

    function drawParticles() {
      for (const p of pl) {
        if (!p.on) continue;
        const a = clamp(p.life / p.ml, 0, 1) * p.a;
        if (p.tp === 4) { // Smoke
          c.save(); c.globalCompositeOperation = 'screen';
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
          g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = g; c.fillRect(p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
          c.restore();
        } else if (p.tp === 1 || p.tp === 3) { // Dust & Embers
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = a;
          c.fillStyle = `rgba(${p.r},${p.g},${p.b},1)`;
          c.beginPath(); c.arc(p.x, p.y, p.sz, 0, Math.PI * 2); c.fill(); c.restore();
        } else if (p.tp === 2) { // Confetti
          c.save(); c.globalAlpha = a;
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.fillRect(-p.sz/2, -p.sz/4, p.sz, p.sz/2); c.restore();
        }
      }
    }

    /* 📜 9. TYPOGRAPHY (Gold Foil & Light Sweep) */
    function drawTypography(t: number, elapsed: number) {
      if (t < 10) return;
      const tA = clamp((t - 10) * 1.5, 0, 1);
      const tY = lerp(H * 0.65, H * 0.4, eOE((t - 10) * 0.5));
      c.save(); c.globalAlpha = tA; c.textAlign = 'center';
      const fS = Math.min(W * 0.09, 90);
      c.font = `700 ${fS}px 'Cinzel', 'Playfair Display', Georgia, serif`;
      
      // Shadow & Bloom
      c.shadowColor = 'rgba(255, 180, 50, 0.8)'; c.shadowBlur = 40;
      c.fillStyle = 'rgba(255, 150, 0, 0.2)';
      c.fillText("HAPPY REPUBLIC DAY", W/2, tY);
      
      // Gold Foil
      c.shadowBlur = 0;
      const gG = c.createLinearGradient(0, tY - fS/2, 0, tY + fS/2);
      gG.addColorStop(0, '#FFFACD'); gG.addColorStop(0.4, '#FFD700');
      gG.addColorStop(0.6, '#DAA520'); gG.addColorStop(1, '#8B6914');
      c.fillStyle = gG; c.fillText("HAPPY REPUBLIC DAY", W/2, tY);

      // Light Sweep
      c.save();
      c.beginPath(); c.rect(W/2 - 500, tY - fS, 1000, fS * 1.2); c.clip();
      const sX = W/2 - 500 + ((elapsed * 400) % 1200);
      const sG = c.createLinearGradient(sX - 80, 0, sX + 80, 0);
      sG.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sG.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      sG.addColorStop(1, 'rgba(255, 255, 255, 0)');
      c.fillStyle = sG; c.fillRect(sX - 80, tY - fS, 160, fS * 1.2);
      c.restore();

      // Slogan
      c.font = `400 ${fS * 0.4}px 'Cinzel', Georgia, serif`;
      c.fillStyle = 'rgba(255, 255, 255, 0.9)';
      c.shadowColor = 'rgba(0, 0, 0, 0.8)'; c.shadowBlur = 15;
      c.fillText("वंदे मातरम्", W/2, tY + fS * 0.8);
      c.restore();
    }

    /* 🕊️ 10. FINAL SCENE (13s - 15s) */
    function drawFinalScene(t: number, elapsed: number) {
      if (t < 13) return;
      const p = clamp((t - 13) / 2, 0, 1);
      doves.forEach(d => { d.x += d.vx; d.y += d.vy; d.wing += 0.25; });

      // Full Screen Tricolor Wave
      c.save(); c.globalAlpha = p * 0.85;
      const fH = H, fW = H * 1.5;
      const fC = 50, fR = 30, fCW = fW / fC, fCH = fH / fR;
      for (let y = 0; y < fR; y++) {
        for (let x = 0; x < fC; x++) {
          const px = W/2 - fW/2 + x * fCW, py = y * fCH;
          const w = Math.sin(x * 0.25 + elapsed * 3) * 35 + Math.sin(y * 0.4 + elapsed * 2) * 15;
          const s = clamp(0.5 + (w / 50) * 0.5, 0, 1);
          let col = [0,0,0];
          if (y < fR / 3) col = [255, 153, 51];
          else if (y < fR * 2 / 3) col = [255, 255, 255];
          else col = [18, 136, 8];
          const r = ACESFilmic(col[0] * s / 255) * 255;
          const g = ACESFilmic(col[1] * s / 255) * 255;
          const b = ACESFilmic(col[2] * s / 255) * 255;
          c.fillStyle = `rgb(${r}, ${g}, ${b})`;
          c.fillRect(px + w, py, fCW + 1, fCH + 1);
        }
      }
      c.restore();

      // Doves
      c.save(); c.globalAlpha = p; c.fillStyle = '#FFFFFF';
      c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 10;
      doves.forEach(d => {
        c.save(); c.translate(d.x, d.y);
        const wY = Math.sin(d.wing) * 14;
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, -wY, -36, 0); c.quadraticCurveTo(-18, wY * 0.5, 0, 0); c.fill();
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(18, -wY, 36, 0); c.quadraticCurveTo(18, wY * 0.5, 0, 0); c.fill();
        c.restore();
      });
      c.restore();

      // Final Text Reveal
      c.save(); c.globalAlpha = p; c.textAlign = 'center';
      c.font = `700 ${Math.min(W * 0.14, 140)}px 'Cinzel', Georgia, serif`;
      c.shadowColor = 'rgba(0, 0, 0, 0.9)'; c.shadowBlur = 50;
      const gG = c.createLinearGradient(0, H/2 - 70, 0, H/2 + 70);
      gG.addColorStop(0, '#FFFACD'); gG.addColorStop(0.5, '#FFD700'); gG.addColorStop(1, '#8B6914');
      c.fillStyle = gG; c.fillText("वंदे मातरम्", W/2, H/2);
      c.restore();
    }

    /* 🎞️ 11. POST PROCESSING (ACES, Vignette, Grain) */
    function drawPostFX() {
      // ACES Color Grade (Orange & Teal)
      c.save(); c.globalCompositeOperation = 'soft-light';
      const gG = c.createLinearGradient(0, 0, W, H);
      gG.addColorStop(0, 'rgba(255, 140, 50, 0.3)');
      gG.addColorStop(1, 'rgba(0, 50, 100, 0.4)');
      c.fillStyle = gG; c.fillRect(0, 0, W, H);
      c.restore();

      // Cinematic Vignette
      const vG = c.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.9);
      vG.addColorStop(0, 'rgba(0,0,0,0)'); vG.addColorStop(1, 'rgba(0,0,0,0.85)');
      c.fillStyle = vG; c.fillRect(0, 0, W, H);

      // Letterbox Bars (2.35:1 Aspect Ratio)
      const bH = H * 0.1;
      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, bH); c.fillRect(0, H - bH, W, bH);

      // High Quality Film Grain
      c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.04;
      const pat = c.createPattern(grainCv, 'repeat');
      if (pat) { c.fillStyle = pat; c.fillRect(0, 0, W, H); }
      c.restore();
    }

    /* 🎬 ANIMATION LOOP */
    let prevTime = 0;
    function loop(now: number) {
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

      c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);

      // ✅ FIXED CAMERA: Removed extreme zoom (camZ) and pan (camY) that were ruining the view.
      // Only keeping a very subtle handheld breathing effect at the start.
      const brX = Math.sin(t * 0.6) * 1.5 * (1 - t / DUR);
      const brY = Math.cos(t * 0.5) * 1.5 * (1 - t / DUR);

      c.save();
      c.translate(W / 2 + brX, H / 2 + brY);
      c.translate(-W / 2, -H / 2);

      drawAtmosphere(t, now / 1000);
      drawSunAndRays(t, now / 1000);
      drawFog(t, now / 1000);
      drawIndiaGate(t);
      drawTorch(t, now / 1000);
      drawFlagMesh(t, now / 1000);
      drawJets(t);
      drawParticles();
      drawTypography(t, now / 1000);
      drawFinalScene(t, now / 1000);

      c.restore();
      drawPostFX();

      raf.current = requestAnimationFrame(loop);
    }

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', rsz);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
        audioCtxRef.current = null;
      }
    };
  }, [mkPool, grab, triggerAudio]);

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
