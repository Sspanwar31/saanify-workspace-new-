'use client';

import React, { useEffect, useRef } from 'react';

interface Props { onComplete?: () => void; }

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
  flap: number; active: boolean; delay: number;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({ idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0, type: 'dust', tx: 0, ty: 0, rot: 0, rotSpd: 0, flap: 0, active: false, delay: 0 });
      this.free.push(i);
    }
  }
  spawn(): Particle | null { const idx = this.free.pop(); if (idx === undefined) return null; const p = this.particles[idx]; p.active = true; p.life = 0; p.alpha = 0; p.delay = 0; return p; }
  release(p: Particle) { p.active = false; this.free.push(p.idx); }
}

interface FW Rocket { x: number; y: number; vx: number; vy: number; ay: number; targetY: number; color: string; color2: string; type: string; trail: { x: number; y: number; alpha: number }[]; flicker: number; }
interface FWS park { x: number; y: number; vx: number; vy: number; color: string; color2: string; alpha: number; life: number; maxLife: number; size: number; gravity: number; drag: number; flicker: boolean; type: string; temp: number; wind: number; turb: number; stage: number; delay: number; hasExploded: boolean; isSecondary: boolean; }
interface Diya { x: number; y: number; scale: number; speed: number; phase: number; flamePulse: number; }

const TITLE_TEXT = 'जय श्री राम';
const HORIZON = 0.62;

interface RayDef { angle: number; width: number; len: number; opacity: number; broken: boolean; gapSeed: number; }
const RAYS: RayDef[] = [
  { angle: -2.4, width: 50, len: 0.8, opacity: 0.06, broken: false, gapSeed: 0 },
  { angle: -2.0, width: 25, len: 0.9, opacity: 0.04, broken: true, gapSeed: 1.7 },
  { angle: -1.65, width: 65, len: 0.7, opacity: 0.08, broken: false, gapSeed: 0 },
  { angle: -1.35, width: 30, len: 0.95, opacity: 0.05, broken: false, gapSeed: 0 },
  { angle: -1.05, width: 20, len: 0.6, opacity: 0.035, broken: true, gapSeed: 2.3 },
  { angle: -0.75, width: 35, len: 0.5, opacity: 0.04, broken: true, gapSeed: 3.1 },
  { angle: -0.45, width: 15, len: 0.35, opacity: 0.025, broken: true, gapSeed: 1.2 },
  { angle: -0.15, width: 10, len: 0.25, opacity: 0.015, broken: true, gapSeed: 0.8 },
  { angle: 0.15, width: 10, len: 0.25, opacity: 0.015, broken: true, gapSeed: 2.0 },
  { angle: 0.45, width: 15, len: 0.35, opacity: 0.025, broken: true, gapSeed: 1.5 },
  { angle: 0.75, width: 30, len: 0.52, opacity: 0.04, broken: true, gapSeed: 2.8 },
  { angle: 1.05, width: 20, len: 0.6, opacity: 0.035, broken: true, gapSeed: 0.5 },
  { angle: 1.35, width: 38, len: 0.9, opacity: 0.05, broken: false, gapSeed: 0 },
  { angle: 1.65, width: 60, len: 0.72, opacity: 0.075, broken: false, gapSeed: 0 },
  { angle: 2.0, width: 28, len: 0.85, opacity: 0.045, broken: true, gapSeed: 1.9 },
  { angle: 2.35, width: 48, len: 0.78, opacity: 0.055, broken: false, gapSeed: 0 },
];

export default function CinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (!document.getElementById('ram-font')) {
      const link = document.createElement('link');
      link.id = 'ram-font';
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
    let screenFlash = 0, cameraShake = 0, lastRocketTime = 0;

    // ====== OFFSCREEN CANVASES for Volumetric Blur ======
    const rayCanvas = document.createElement('canvas');
    const rayCtx = rayCanvas.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    const pool = new ParticlePool(2000);
    let ramPoints: { x: number; y: number }[] = [];
    let diyas: Diya[] = [];
    const fwRockets: any[] = [];
    const fwSparks: any[] = [];
    const fwBursts: any[] = [];

    const fwColors = [['#ffaa00','#ff3300'],['#00e5ff','#0055ff'],['#ff00aa','#aa00ff'],['#ffd700','#ffffff'],['#00ff66','#00aa00'],['#ff0033','#ffffff']];

    function makeSprite(sz: number, inner: string, mid: string) {
      const c = document.createElement('canvas'); c.width = c.height = sz;
      const cx = c.getContext('2d')!;
      const g = cx.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);
      g.addColorStop(0,inner); g.addColorStop(0.35,mid); g.addColorStop(1,'rgba(0,0,0,0)');
      cx.fillStyle = g; cx.fillRect(0,0,sz,sz); return c;
    }
    const dustSprite = makeSprite(64,'rgba(255,220,150,1)','rgba(255,140,40,0.4)');
    const sparkSprite = makeSprite(64,'rgba(255,250,220,1)','rgba(255,180,80,0.4)');

    function sunVis(t: number) {
      return smoothstep(0,1.5,t) * (1 - smoothstep(1.5,1.8,t)*0.65) * (1 - smoothstep(6.5,8.5,t));
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // Ray canvas at HALF res for perf + natural softness
      rayCanvas.width = Math.floor(W / 2);
      rayCanvas.height = Math.floor(H / 2);
      grain.width = 256; grain.height = 256;
      const id = gctx.createImageData(256, 256);
      for (let i = 0; i < id.data.length; i += 4) { const n = Math.random()*255; id.data[i]=n; id.data[i+1]=n; id.data[i+2]=n; id.data[i+3]=14; }
      gctx.putImageData(id, 0, 0);
      sampleText(); initDiyas();
    }

    function initDiyas() {
      diyas.length = 0;
      for (let i = 0; i < 40; i++) {
        const p = Math.random();
        diyas.push({ x: Math.random()*W, y: lerp(H*HORIZON+10, H*0.97, p), scale: lerp(0.15,1,p), speed: lerp(2,10,p)*(Math.random()<0.5?-1:1), phase: Math.random()*Math.PI*2, flamePulse: Math.random()*10 });
      }
    }

    function sampleText() {
      const tc = document.createElement('canvas'); const tx = tc.getContext('2d')!;
      const fs = Math.min(W*0.125, 130);
      tc.width = Math.floor(W); tc.height = Math.floor(fs*2.4);
      tx.fillStyle = '#fff'; tx.textAlign = 'center'; tx.textBaseline = 'middle';
      tx.font = `900 ${fs}px "Tiro Devanagari Hindi","Nirmala UI",serif`;
      tx.lineJoin = 'round'; tx.lineCap = 'round';
      tx.fillText(TITLE_TEXT, tc.width/2, tc.height/2);
      const img = tx.getImageData(0,0,tc.width,tc.height);
      ramPoints = [];
      for (let y = 0; y < tc.height; y += 2) for (let x = 0; x < tc.width; x += 2) {
        if (img.data[(y*tc.width+x)*4+3] > 20) ramPoints.push({ x: x-tc.width/2, y: y-tc.height/2 });
      }
    }

    // ===================== SKY — Rich warm gradient =====================
    function drawSky(t: number) {
      const v = smoothstep(0,1.2,t) * (1 - smoothstep(6.5,8.5,t)) * (1 - smoothstep(6.5,8,t));
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0, '#000000');
      g.addColorStop(0.25, `rgb(${Math.floor(lerp(0,5,v))},${Math.floor(lerp(0,2,v))},${Math.floor(lerp(0,8,v))})`);
      g.addColorStop(0.45, `rgb(${Math.floor(lerp(0,20,v))},${Math.floor(lerp(0,6,v))},${Math.floor(lerp(0,8,v))})`);
      g.addColorStop(0.6, `rgb(${Math.floor(lerp(0,55,v))},${Math.floor(lerp(0,18,v))},${Math.floor(lerp(0,8,v))})`);
      g.addColorStop(0.75, `rgb(${Math.floor(lerp(0,120,v))},${Math.floor(lerp(0,45,v))},${Math.floor(lerp(0,12,v))})`);
      g.addColorStop(0.88, `rgb(${Math.floor(lerp(0,195,v))},${Math.floor(lerp(0,85,v))},${Math.floor(lerp(0,25,v))})`);
      g.addColorStop(HORIZON, `rgb(${Math.floor(lerp(0,240,v))},${Math.floor(lerp(0,125,v))},${Math.floor(lerp(0,40,v))})`);
      g.addColorStop(HORIZON + 0.005, `rgb(${Math.floor(lerp(0,12,v))},${Math.floor(lerp(0,5,v))},${Math.floor(lerp(0,2,v))})`);
      g.addColorStop(1, '#000000');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }

    // ===================== SUN — Bigger, half at horizon =====================
    function drawSun(t: number) {
      const vis = sunVis(t);
      if (vis <= 0) return;
      const sx = W*0.5, sy = H*HORIZON;
      const R = Math.min(W,H) * 0.22; // BIGGER sun
      const breath = Math.sin(t*0.4)*0.05;
      const bR = clamp(255+breath*30,242,255), bG = clamp(242+breath*20,225,255), bB = clamp(185-breath*40,145,205);

      ctx.save();
      // CLIP: only above horizon — half sun
      ctx.beginPath(); ctx.rect(0,0,W,H*HORIZON+2); ctx.clip();

      // Massive atmospheric glow
      const ag = ctx.createRadialGradient(sx,sy,R*0.2,sx,sy,R*5);
      ag.addColorStop(0, `rgba(${Math.floor(bR)},${Math.floor(bG*0.88)},${Math.floor(bB*0.65)},${0.4*vis})`);
      ag.addColorStop(0.15, `rgba(255,175,70,${0.18*vis})`);
      ag.addColorStop(0.35, `rgba(200,90,25,${0.07*vis})`);
      ag.addColorStop(0.6, `rgba(120,40,10,${0.02*vis})`);
      ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ag; ctx.fillRect(0,0,W,H*HORIZON);

      // Glow rings (lens effect)
      ctx.strokeStyle = `rgba(255,215,140,${0.1*vis})`; ctx.lineWidth = R*0.1;
      ctx.beginPath(); ctx.arc(sx,sy,R*1.4,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,235,190,${0.05*vis})`; ctx.lineWidth = R*0.06;
      ctx.beginPath(); ctx.arc(sx,sy,R*1.8,0,Math.PI*2); ctx.stroke();

      // Sun disk — white-hot core
      const dg = ctx.createRadialGradient(sx,sy-R*0.06,0,sx,sy,R);
      dg.addColorStop(0, `rgba(${Math.floor(bR)},${Math.floor(bG)},${Math.floor(bB)},${vis})`);
      dg.addColorStop(0.4, `rgba(255,228,165,${vis*0.92})`);
      dg.addColorStop(0.75, `rgba(255,195,95,${vis*0.5})`);
      dg.addColorStop(1, 'rgba(255,155,55,0)');
      ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(sx,sy,R,0,Math.PI*2); ctx.fill();

      ctx.restore();

      // Warmth glow below horizon on water
      const bg = ctx.createRadialGradient(sx,sy+8,0,sx,sy+8,R*3);
      bg.addColorStop(0, `rgba(255,185,85,${0.1*vis})`);
      bg.addColorStop(0.4, `rgba(200,105,35,${0.04*vis})`);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg; ctx.fillRect(sx-R*3.5,sy,R*7,R*3);
    }

    // ===================== VOLUMETRIC RAYS — Offscreen + Blur =====================
    function drawRaysOffscreen(t: number) {
      const vis = sunVis(t);
      const tReveal = smoothstep(1.8,3.5,t);
      if (vis <= 0) return;

      const rW = rayCanvas.width, rH = rayCanvas.height;
      const sc = 0.5; // half-res scale
      rayCtx.clearRect(0,0,rW,rH);
      rayCtx.globalCompositeOperation = 'lighter';

      const sx = W*0.5*sc, sy = H*HORIZON*sc;

      for (let i = 0; i < RAYS.length; i++) {
        const r = RAYS[i];
        const wobAngle = Math.sin(t*0.18+i*1.7)*0.02;
        const angle = r.angle + wobAngle - Math.PI/2;
        const wobW = Math.sin(t*0.25+i*2.3)*4;
        const width = (r.width + wobW) * sc;
        const length = H * r.len * sc;
        const flick = 0.6 + 0.4*Math.sin(t*0.55+i*0.95);
        let op = r.opacity * flick * vis;

        const isCenter = Math.abs(r.angle) < 0.9;
        if (isCenter) op *= (0.12 + 0.88*tReveal);
        if (op < 0.001) continue;

        const dx = Math.cos(angle), dy = Math.sin(angle);
        const px = -dy, py = dx;

        if (r.broken) {
          const segs = 5;
          for (let s = 0; s < segs; s++) {
            const gap = Math.sin(r.gapSeed + s*2.7 + t*0.12);
            if (gap > 0.15) continue;
            const sf = s/segs, ef = (s+0.5)/segs;
            const sw = width*(1-sf*0.65);
            const so = op*(1-sf*0.6);
            const ssx = sx+dx*length*sf, ssy = sy+dy*length*sf;
            const eex = sx+dx*length*ef, eey = sy+dy*length*ef;

            const g = rayCtx.createLinearGradient(ssx,ssy,eex,eey);
            g.addColorStop(0, `rgba(255,250,235,${so*1.8})`);
            g.addColorStop(0.2, `rgba(255,215,145,${so})`);
            g.addColorStop(0.55, `rgba(255,160,60,${so*0.35})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            rayCtx.fillStyle = g;
            rayCtx.beginPath();
            rayCtx.moveTo(ssx+px*sw*0.8, ssy+py*sw*0.8);
            rayCtx.lineTo(ssx-px*sw*0.8, ssy-py*sw*0.8);
            rayCtx.lineTo(eex-px*sw*0.12, eey-py*sw*0.12);
            rayCtx.lineTo(eex+px*sw*0.12, eey+py*sw*0.12);
            rayCtx.closePath(); rayCtx.fill();
          }
        } else {
          const ex = sx+dx*length, ey = sy+dy*length;
          // Wide soft
          const g1 = rayCtx.createLinearGradient(sx,sy,ex,ey);
          g1.addColorStop(0, `rgba(255,250,235,${op*1.8})`);
          g1.addColorStop(0.15, `rgba(255,215,145,${op})`);
          g1.addColorStop(0.5, `rgba(255,160,60,${op*0.3})`);
          g1.addColorStop(1, 'rgba(0,0,0,0)');
          rayCtx.fillStyle = g1;
          rayCtx.beginPath();
          rayCtx.moveTo(sx+px*width*0.9, sy+py*width*0.9);
          rayCtx.lineTo(sx-px*width*0.9, sy-py*width*0.9);
          rayCtx.lineTo(ex-px*width*0.1, ey-py*width*0.1);
          rayCtx.lineTo(ex+px*width*0.1, ey+py*width*0.1);
          rayCtx.closePath(); rayCtx.fill();

          // Narrow bright core
          const g2 = rayCtx.createLinearGradient(sx,sy,ex,ey);
          g2.addColorStop(0, `rgba(255,255,248,${op*2.5})`);
          g2.addColorStop(0.2, `rgba(255,240,200,${op*1.5})`);
          g2.addColorStop(0.5, `rgba(255,190,90,${op*0.4})`);
          g2.addColorStop(1, 'rgba(0,0,0,0)');
          rayCtx.fillStyle = g2;
          rayCtx.beginPath();
          rayCtx.moveTo(sx+px*width*0.2, sy+py*width*0.2);
          rayCtx.lineTo(sx-px*width*0.2, sy-py*width*0.2);
          rayCtx.lineTo(ex-px*width*0.02, ey-py*width*0.02);
          rayCtx.lineTo(ex+px*width*0.02, ey+py*width*0.02);
          rayCtx.closePath(); rayCtx.fill();
        }
      }

      // Scattering spots
      for (let i = 0; i < 25; i++) {
        const sa = (i/25)*Math.PI*1.5 - Math.PI*0.75 - Math.PI/2;
        const sd = H*sc*(0.12 + 0.38*((Math.sin(i*3.7)+1)/2));
        const spx = sx+Math.cos(sa)*sd + Math.sin(t*0.8+i*2.1)*8*sc;
        const spy = sy+Math.sin(sa)*sd;
        if (spy > H*HORIZON*sc) continue;
        const sa2 = 0.05*vis*(0.5+0.5*Math.sin(t*1.2+i*1.5));
        const ss = (2+Math.sin(i*1.3)*1.5)*sc;
        const sg = rayCtx.createRadialGradient(spx,spy,0,spx,spy,ss*4);
        sg.addColorStop(0, `rgba(255,245,210,${sa2})`);
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        rayCtx.fillStyle = sg;
        rayCtx.beginPath(); rayCtx.arc(spx,spy,ss*4,0,Math.PI*2); rayCtx.fill();
      }
    }

    function compositeRaysBlurred() {
      if (rayCanvas.width === 0) return;
      ctx.save();
      // PASS 1: Heavy blur — soft volumetric body
      ctx.filter = 'blur(18px)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.85;
      ctx.drawImage(rayCanvas, 0, 0, rayCanvas.width, rayCanvas.height, 0, 0, W, H);
      // PASS 2: Light blur — sharper core detail
      ctx.filter = 'blur(6px)';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(rayCanvas, 0, 0, rayCanvas.width, rayCanvas.height, 0, 0, W, H);
      ctx.filter = 'none';
      ctx.restore();
    }

    // ===================== HEAT SHIMMER =====================
    function drawHeatShimmer(t: number) {
      const vis = sunVis(t); if (vis <= 0) return;
      const sx = W*0.5, sy = H*HORIZON, r = Math.min(W,H)*0.22;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const y = sy - r*0.12 - i*r*0.16;
        const wx = Math.sin(t*2.5+i*1.8)*12 + Math.cos(t*1.7+i*0.9)*6;
        const sw = r*(1.3-i*0.1);
        const a = 0.018*vis*(1-i*0.1);
        if (a <= 0) continue;
        const g = ctx.createRadialGradient(sx+wx,y,0,sx+wx,y,sw);
        g.addColorStop(0, `rgba(255,238,195,${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(sx+wx,y,sw,sw*0.18,0,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }

    // ===================== TEMPLE GLOW (BEHIND silhouette) =====================
    function drawTempleGlow(t: number) {
      const reveal = smoothstep(1.8,4.0,t);
      const fade = 1 - smoothstep(6.5,8.0,t);
      const vis = reveal * fade;
      if (vis <= 0) return;

      const s = Math.min(W,H) * 0.0017;
      const mx = W*0.5, baseY = H*HORIZON;
      const pulse = 0.65 + 0.35*Math.sin(t*2.2);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Large golden aura behind entire temple
      const aura = ctx.createRadialGradient(mx, baseY-160*s, 15*s, mx, baseY-160*s, 380*s);
      aura.addColorStop(0, `rgba(255,225,130,${0.45*vis*pulse})`);
      aura.addColorStop(0.2, `rgba(255,180,70,${0.25*vis*pulse})`);
      aura.addColorStop(0.45, `rgba(220,110,30,${0.08*vis*pulse})`);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(mx-450*s, baseY-550*s, 900*s, 550*s);

      // Extra bright glow at shikhara tops
      const tops = [0, -80, 80, -140, 140];
      tops.forEach((ox, i) => {
        const h = i === 0 ? 280*s : (i < 3 ? 170*s : 120*s);
        const ty = baseY - 38*s - h;
        const tr = i === 0 ? 55*s : 35*s;
        const tg = ctx.createRadialGradient(mx+ox*s, ty, 0, mx+ox*s, ty, tr);
        tg.addColorStop(0, `rgba(255,235,160,${0.3*vis*pulse})`);
        tg.addColorStop(0.5, `rgba(255,180,60,${0.1*vis*pulse})`);
        tg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.arc(mx+ox*s, ty, tr, 0, Math.PI*2); ctx.fill();
      });

      ctx.restore();
    }

    // ===================== TEMPLE SILHOUETTE — Big, Bold, Rim Lit =====================
    function drawTempleSilhouette(t: number) {
      const reveal = smoothstep(1.8,4.0,t);
      const fade = 1 - smoothstep(6.5,8.0,t);
      const vis = reveal * fade;
      if (vis <= 0) return;

      const s = Math.min(W,H) * 0.0017; // 40% BIGGER
      const mx = W*0.5, baseY = H*HORIZON;
      const gp = 0.55 + 0.45*Math.sin(t*2.5);

      ctx.save();
      ctx.globalAlpha = vis;

      // STRONG rim lighting
      ctx.shadowColor = `rgba(255,195,85,${0.85*vis*gp})`;
      ctx.shadowBlur = 40*s;

      const DARK = '#020100';
      const gold = `rgba(255,205,105,${0.75*gp})`;
      const goldSoft = `rgba(255,205,105,${0.4*gp})`;

      // Platforms
      const plat = (pw:number, ph:number, py:number) => {
        ctx.fillStyle = DARK;
        ctx.fillRect(mx-pw/2, py, pw, ph);
        ctx.strokeStyle = gold; ctx.lineWidth = 1.5*s;
        ctx.strokeRect(mx-pw/2, py, pw, ph);
      };
      plat(420*s, 18*s, baseY-18*s);
      plat(380*s, 14*s, baseY-32*s);
      plat(340*s, 12*s, baseY-44*s);

      const sY = baseY - 44*s;
      const sW = 175*s, sH = 90*s;

      // Sanctum wall
      ctx.fillStyle = DARK;
      ctx.fillRect(mx-sW/2, sY-sH, sW, sH);

      // Door arches — gold outline
      ctx.strokeStyle = `rgba(255,215,125,${0.55*gp})`;
      ctx.lineWidth = 2*s;
      ctx.beginPath();
      ctx.moveTo(mx-sW*0.35, sY);
      ctx.lineTo(mx-sW*0.35, sY-sH*0.55);
      ctx.quadraticCurveTo(mx, sY-sH*0.88, mx+sW*0.35, sY-sH*0.55);
      ctx.lineTo(mx+sW*0.35, sY);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,205,95,${0.35*gp})`;
      ctx.lineWidth = 1.2*s;
      ctx.beginPath();
      ctx.moveTo(mx-sW*0.2, sY);
      ctx.lineTo(mx-sW*0.2, sY-sH*0.4);
      ctx.quadraticCurveTo(mx, sY-sH*0.68, mx+sW*0.2, sY-sH*0.4);
      ctx.lineTo(mx+sW*0.2, sY);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx, sY-sH*0.68); ctx.lineTo(mx, sY); ctx.stroke();

      // Pillars
      const pXs = [-115,-78,-40,40,78,115];
      pXs.forEach(px => {
        const pw = 12*s, ph = 78*s, ppx = mx+px*s;
        ctx.fillStyle = '#030200';
        ctx.fillRect(ppx-pw/2, sY-ph, pw, ph);
        ctx.strokeStyle = gold; ctx.lineWidth = 0.9*s;
        ctx.strokeRect(ppx-pw/2, sY-ph, pw, ph);
        ctx.fillStyle = DARK;
        ctx.fillRect(ppx-pw*0.85, sY-ph, pw*1.7, 6*s);
        ctx.strokeStyle = goldSoft; ctx.lineWidth = 0.7*s;
        ctx.strokeRect(ppx-pw*0.85, sY-ph, pw*1.7, 6*s);
      });

      // Arches between pillars
      ctx.strokeStyle = `rgba(255,205,105,${0.4*gp})`; ctx.lineWidth = 1.3*s;
      for (let i = 0; i < pXs.length-1; i++) {
        const x1 = mx+pXs[i]*s, x2 = mx+pXs[i+1]*s, aY = sY-68*s;
        ctx.beginPath(); ctx.arc((x1+x2)/2, aY, (x2-x1)/2, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = `rgba(255,220,55,${0.55*gp})`;
        ctx.beginPath(); ctx.arc((x1+x2)/2, aY+4*s, 3.5*s, 0, Math.PI*2); ctx.fill();
      }

      // Shikharas
      const drawShikhara = (cx:number, cy:number, w:number, h:number, main:boolean) => {
        ctx.fillStyle = DARK;
        ctx.beginPath();
        ctx.moveTo(cx-w/2, cy);
        ctx.bezierCurveTo(cx-w*0.46, cy-h*0.38, cx-w*0.2, cy-h*0.8, cx-w*0.06, cy-h);
        ctx.lineTo(cx+w*0.06, cy-h);
        ctx.bezierCurveTo(cx+w*0.2, cy-h*0.8, cx+w*0.46, cy-h*0.38, cx+w/2, cy);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(255,215,135,${0.5*gp})`; ctx.lineWidth = 1.8*s; ctx.stroke();

        // Tier lines
        const tiers = main ? 16 : 9;
        ctx.strokeStyle = `rgba(255,205,105,${0.18*gp})`; ctx.lineWidth = 0.7*s;
        for (let i = 1; i < tiers; i++) {
          const f = i/tiers, ty = cy-h*f, tw = lerp(w, w*0.12, Math.pow(f,1.15));
          ctx.beginPath(); ctx.moveTo(cx-tw/2, ty); ctx.lineTo(cx+tw/2, ty); ctx.stroke();
        }

        // Side spires (main only)
        if (main) {
          for (let i = 0; i < 4; i++) {
            const f = 0.18+i*0.14, ty = cy-h*f, tw = lerp(w, w*0.12, Math.pow(f,1.15));
            ctx.fillStyle = DARK;
            ctx.beginPath(); ctx.moveTo(cx-tw/2, ty); ctx.lineTo(cx-tw/2-12*s, ty-22*s); ctx.lineTo(cx-tw/2-2*s, ty); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx+tw/2, ty); ctx.lineTo(cx+tw/2+12*s, ty-22*s); ctx.lineTo(cx+tw/2+2*s, ty); ctx.closePath(); ctx.fill();
          }
        }

        // Amalaka
        const topY = cy-h, amW = w*0.32, amH = 13*s;
        ctx.fillStyle = DARK;
        ctx.beginPath(); ctx.ellipse(cx, topY-amH/2, amW/2, amH/2, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = `rgba(255,225,110,${0.7*gp})`; ctx.lineWidth = 1.8*s; ctx.stroke();

        // KALASH — MAXIMUM GLOW
        const kY = topY-amH, kG = main ? gp : gp*0.65;
        const kGlow = ctx.createRadialGradient(cx, kY-10*s, 0, cx, kY-10*s, 28*s);
        kGlow.addColorStop(0, `rgba(255,235,160,${0.6*kG})`);
        kGlow.addColorStop(0.4, `rgba(255,185,65,${0.2*kG})`);
        kGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = kGlow;
        ctx.beginPath(); ctx.arc(cx, kY-10*s, 28*s, 0, Math.PI*2); ctx.fill();

        const kg = ctx.createLinearGradient(cx-10*s, kY, cx+10*s, kY);
        kg.addColorStop(0, '#8a5500'); kg.addColorStop(0.25, '#ffd700');
        kg.addColorStop(0.5, '#fffbe8'); kg.addColorStop(0.75, '#ffd700'); kg.addColorStop(1, '#8a5500');
        ctx.fillStyle = kg;
        ctx.beginPath(); ctx.arc(cx, kY-10*s, 10*s, 0, Math.PI*2); ctx.fill();
        ctx.fillRect(cx-4*s, kY-16*s, 8*s, 6*s);
        ctx.beginPath(); ctx.moveTo(cx, kY-16*s); ctx.lineTo(cx-3*s, kY-30*s); ctx.lineTo(cx+3*s, kY-30*s); ctx.closePath(); ctx.fill();
        return kY-30*s;
      };

      const mainTop = drawShikhara(mx, sY, 130*s, 280*s, true);
      drawShikhara(mx-90*s, sY, 72*s, 170*s, false);
      drawShikhara(mx+90*s, sY, 72*s, 170*s, false);
      drawShikhara(mx-155*s, sY, 55*s, 120*s, false);
      drawShikhara(mx+155*s, sY, 55*s, 120*s, false);
      drawShikhara(mx-200*s, sY, 40*s, 85*s, false);
      drawShikhara(mx+200*s, sY, 40*s, 85*s, false);

      // Flag pole
      const pTop = mainTop-28*s;
      ctx.shadowBlur = 0;
      const pg = ctx.createLinearGradient(mx-2*s,0,mx+2*s,0);
      pg.addColorStop(0,'#120600'); pg.addColorStop(0.5,'#2d1508'); pg.addColorStop(1,'#120600');
      ctx.fillStyle = pg;
      ctx.fillRect(mx-1.8*s, pTop, 3.6*s, mainTop-pTop);

      ctx.shadowColor = `rgba(255,225,110,${0.8*gp})`; ctx.shadowBlur = 12*s;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(mx, pTop-4*s, 5*s, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

      const w1 = Math.sin(t*5.5)*6*s, w2 = Math.sin(t*5.5+1.3)*4*s;
      ctx.beginPath();
      ctx.moveTo(mx, pTop);
      ctx.quadraticCurveTo(mx+15*s, pTop+w1, mx+35*s+w1, pTop+12*s+w2);
      ctx.quadraticCurveTo(mx+15*s, pTop+24*s+w2, mx, pTop+26*s);
      ctx.closePath();
      const fg = ctx.createLinearGradient(mx,pTop,mx+35*s,pTop);
      fg.addColorStop(0,'#8a1100'); fg.addColorStop(0.5,'#cc3300'); fg.addColorStop(1,'#dd5500');
      ctx.fillStyle = fg; ctx.fill();

      ctx.restore();
    }

    // ===================== DIVINE EMERGENCE — Light from BEHIND temple =====================
    function drawDivineEmergence(t: number) {
      const reveal = smoothstep(2.5,4.5,t);
      const fade = 1 - smoothstep(6.5,8.0,t);
      const vis = reveal * fade;
      if (vis <= 0) return;

      const s = Math.min(W,H)*0.0017;
      const mx = W*0.5, baseY = H*HORIZON;
      const pulse = 0.5 + 0.5*Math.sin(t*1.8);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Bright shafts from gaps between shikharas — pointing UPWARD
      const gaps = [
        { x: -55, w: 25, h: 200, op: 0.06 },
        { x: -25, w: 18, h: 260, op: 0.08 },
        { x: 0, w: 22, h: 300, op: 0.1 },  // center — brightest
        { x: 25, w: 18, h: 260, op: 0.08 },
        { x: 55, w: 25, h: 200, op: 0.06 },
        { x: -120, w: 15, h: 140, op: 0.04 },
        { x: 120, w: 15, h: 140, op: 0.04 },
      ];

      gaps.forEach((gap, i) => {
        const gx = mx + gap.x*s;
        const gy = baseY - 44*s - 90*s; // start from mid-temple height
        const len = gap.h * s;
        const w = gap.w * s;
        const a = gap.op * vis * pulse * (0.7 + 0.3*Math.sin(t*2.5+i*1.3));
        const wobX = Math.sin(t*0.6+i*2)*3*s;

        const g = ctx.createLinearGradient(gx+wobX, gy, gx+wobX, gy-len);
        g.addColorStop(0, `rgba(255,240,180,${a*2})`);
        g.addColorStop(0.2, `rgba(255,210,130,${a})`);
        g.addColorStop(0.6, `rgba(255,165,60,${a*0.3})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(gx+wobX-w*0.8, gy);
        ctx.lineTo(gx+wobX+w*0.8, gy);
        ctx.lineTo(gx+wobX+w*0.08, gy-len);
        ctx.lineTo(gx+wobX-w*0.08, gy-len);
        ctx.closePath(); ctx.fill();
      });

      // Edge glow along temple outline — light "leaking"
      const edgePoints = [
        { x: -210, y: 44 }, { x: -155, y: 44 }, { x: -90, y: 44 },
        { x: 0, y: 44 }, { x: 90, y: 44 }, { x: 155, y: 44 }, { x: 210, y: 44 },
      ];
      edgePoints.forEach((ep, i) => {
        const ex = mx + ep.x*s;
        const ey = baseY - ep.y*s;
        const er = (i === 3 ? 50 : 30)*s;
        const ea = (i === 3 ? 0.07 : 0.04)*vis*pulse;
        const eg = ctx.createRadialGradient(ex, ey-80*s, 0, ex, ey-80*s, er);
        eg.addColorStop(0, `rgba(255,220,140,${ea})`);
        eg.addColorStop(0.5, `rgba(255,170,60,${ea*0.3})`);
        eg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = eg;
        ctx.beginPath(); ctx.arc(ex, ey-80*s, er, 0, Math.PI*2); ctx.fill();
      });

      ctx.restore();
    }

    // ===================== LIGHT LEAK — edges =====================
    function drawLightLeak(t: number) {
      const vis = smoothstep(2.8,4.2,t)*(1-smoothstep(6.5,8.0,t));
      if (vis <= 0) return;
      const s = Math.min(W,H)*0.0017, mx = W*0.5, baseY = H*HORIZON;
      const p = 0.55+0.45*Math.sin(t*2.2);

      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const pts = [
        {x:mx-165*s, y:baseY-200*s, r:48*s},
        {x:mx-95*s, y:baseY-280*s, r:42*s},
        {x:mx+95*s, y:baseY-280*s, r:42*s},
        {x:mx+165*s, y:baseY-200*s, r:48*s},
        {x:mx, y:baseY-370*s, r:60*s},
      ];
      pts.forEach((lp,i) => {
        const a = 0.08*vis*p*(0.6+0.4*Math.sin(t*3+i*1.5));
        const g = ctx.createRadialGradient(lp.x,lp.y,0,lp.x,lp.y,lp.r);
        g.addColorStop(0, `rgba(255,215,140,${a})`);
        g.addColorStop(0.4, `rgba(255,165,65,${a*0.35})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(lp.x,lp.y,lp.r,0,Math.PI*2); ctx.fill();
      });
      ctx.restore();
    }

    // ===================== FOG =====================
    function drawFog(t: number) {
      const intensity = smoothstep(0.5,3,t)*(1-smoothstep(6.5,8,t));
      if (intensity <= 0) return;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let l = 0; l < 5; l++) {
        const y = H*(HORIZON-0.03+l*0.035);
        const speed = 4+l*3.5;
        const off = (t*speed+l*180)%(W*2.5);
        const a = (0.055-l*0.007)*intensity;
        if (a <= 0) continue;
        const g = ctx.createLinearGradient(0,y-35,0,y+55);
        g.addColorStop(0, 'rgba(185,115,42,0)');
        g.addColorStop(0.3+Math.sin(t*0.28+l)*0.08, `rgba(185,115,42,${a})`);
        g.addColorStop(0.7+Math.cos(t*0.22+l*0.4)*0.08, `rgba(165,92,32,${a*0.55})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(-off,y-35,W*3.5,90);
      }
      ctx.restore();
    }

    // ===================== WATER =====================
    function drawWater(t: number) {
      const vis = smoothstep(2,3.5,t)*(1-smoothstep(6.5,8,t));
      if (vis <= 0) return;
      const wY = H*HORIZON, sv = sunVis(t);
      ctx.save(); ctx.globalAlpha = vis;

      const wg = ctx.createLinearGradient(0,wY,0,H);
      wg.addColorStop(0,'#0a0402'); wg.addColorStop(0.4,'#050201'); wg.addColorStop(1,'#020000');
      ctx.fillStyle = wg; ctx.fillRect(0,wY,W,H-wY);

      if (sv > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const sx = W*0.5;
        for (let y = wY+2; y < H; y += 2.5) {
          const d = (y-wY)/(H-wY);
          const wx = Math.sin(y*0.11+t*3.8)*(10+d*18)+Math.cos(y*0.07-t*2.2)*5;
          const lw = lerp(75,18,d)*(0.65+0.35*Math.sin(y*0.18+t*2.8));
          const a = lerp(0.08,0.025,d)*sv;
          const rg = ctx.createLinearGradient(sx+wx-lw,y,sx+wx+lw,y);
          rg.addColorStop(0,'rgba(0,0,0,0)');
          rg.addColorStop(0.25,`rgba(255,205,105,${a})`);
          rg.addColorStop(0.5,`rgba(255,245,185,${a*1.6})`);
          rg.addColorStop(0.75,`rgba(255,205,105,${a})`);
          rg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle = rg; ctx.fillRect(sx+wx-lw,y,lw*2,2);
        }
        ctx.restore();
      }

      // Temple reflection (dark shapes)
      const tr = smoothstep(2.5,4,t);
      if (tr > 0) {
        ctx.save(); ctx.globalAlpha = 0.12*tr;
        const s = Math.min(W,H)*0.0017, mx = W*0.5, bY = H*HORIZON;
        ctx.fillStyle = '#000';
        // Simplified shikhara reflections
        const shikRef = [
          {x:0, tw:65, th:280}, {x:-90, tw:36, th:170}, {x:90, tw:36, th:170},
          {x:-155, tw:28, th:120}, {x:155, tw:28, th:120}
        ];
        shikRef.forEach(sr => {
          ctx.beginPath();
          ctx.moveTo(mx+sr.x*s-sr.tw*s, bY);
          ctx.lineTo(mx+sr.x*s-5*s, bY-sr.th*s*0.4);
          ctx.lineTo(mx+sr.x*s+5*s, bY-sr.th*s*0.4);
          ctx.lineTo(mx+sr.x*s+sr.tw*s, bY);
          ctx.closePath(); ctx.fill();
        });
        ctx.restore();
      }

      // Firework reflections
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      fwBursts.forEach(b => {
        const rY = wY+(wY-b.y)*0.45;
        if (rY < wY || rY > H) return;
        const rg = ctx.createRadialGradient(b.x,rY,0,b.x,rY,b.r*1.5);
        rg.addColorStop(0, `${b.color}${Math.floor(b.alpha*35).toString(16).padStart(2,'0')}`);
        rg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.ellipse(b.x,rY,b.r*1.2,b.r*0.18,0,0,Math.PI*2); ctx.fill();
      });
      ctx.restore();
      ctx.restore();
    }

    // ===================== DIYAS =====================
    function drawDiyas(t: number) {
      const vis = smoothstep(3,4.5,t)*(1-smoothstep(6.5,8,t));
      if (vis <= 0) return;
      ctx.save(); ctx.globalAlpha = vis;
      diyas.forEach(d => {
        d.x += d.speed*0.016;
        if (d.x < -40) d.x = W+40; if (d.x > W+40) d.x = -40;
        const wy = d.y+Math.sin(t*1.5+d.phase)*2*d.scale;
        const fp = Math.sin(t*14+d.flamePulse)*1.2;
        const sz = d.scale*14, fh = sz*1.6+fp*d.scale;

        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const fg = ctx.createRadialGradient(d.x,wy-fh*0.3,0,d.x,wy-fh*0.3,sz*3.5);
        fg.addColorStop(0,'rgba(255,185,55,0.3)'); fg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(d.x,wy-fh*0.3,sz*3.5,0,Math.PI*2); ctx.fill();
        ctx.restore();

        const dg = ctx.createLinearGradient(d.x-sz,wy,d.x+sz,wy);
        dg.addColorStop(0,'#3a1505'); dg.addColorStop(0.5,'#8a4520'); dg.addColorStop(1,'#3a1505');
        ctx.fillStyle = dg;
        ctx.beginPath(); ctx.ellipse(d.x,wy+sz*0.2,sz,sz*0.3,0,0,Math.PI); ctx.fill();
        ctx.fillStyle = '#120200';
        ctx.beginPath(); ctx.ellipse(d.x,wy+sz*0.12,sz*0.85,sz*0.18,0,0,Math.PI*2); ctx.fill();

        const ffg = ctx.createLinearGradient(d.x,wy,d.x,wy-fh);
        ffg.addColorStop(0,'rgba(255,80,0,0.95)'); ffg.addColorStop(0.35,'rgba(255,195,45,1)');
        ffg.addColorStop(0.75,'rgba(255,252,205,1)'); ffg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = ffg;
        ctx.beginPath();
        ctx.moveTo(d.x-sz*0.15,wy+sz*0.08);
        ctx.quadraticCurveTo(d.x-sz*0.2,wy-fh*0.45,d.x,wy-fh);
        ctx.quadraticCurveTo(d.x+sz*0.2,wy-fh*0.45,d.x+sz*0.15,wy+sz*0.08);
        ctx.closePath(); ctx.fill();
      });
      ctx.restore();
    }

    // ===================== FIREWORKS =====================
    function launchFW(t: number) {
      if (t<3.5||t>6.5||fwRockets.length>=3) return;
      if (t-lastRocketTime<0.4+Math.random()*0.2) return;
      const sx = Math.random()<0.5?lerp(W*0.12,W*0.32,Math.random()):lerp(W*0.68,W*0.88,Math.random());
      const ty = lerp(H*0.28,H*0.06,Math.random());
      let type='small'; const r=Math.random();
      if(r<0.35)type='finale';else if(r<0.65)type='chrysanthemum';else type='medium';
      const cp=fwColors[Math.floor(Math.random()*fwColors.length)];
      fwRockets.push({x:sx,y:H*HORIZON,vx:(Math.random()-0.5)*1.2,vy:-8.5-Math.random()*3,ay:0.14+Math.random()*0.03,targetY:ty,color:cp[0],color2:cp[1],type,trail:[],flicker:0});
      lastRocketTime=t;
    }

    function burst(fx:number,fy:number,c:string,c2:string,type:string,sec=false) {
      let cnt=45,mR=50,shk=0,fl=0;
      if(type==='medium'){cnt=55;mR=70;}else if(type==='chrysanthemum'){cnt=70;mR=90;}else if(type==='finale'){cnt=90;mR=120;shk=3;fl=0.25;}
      if(sec){cnt=28;shk=0;fl=0;}
      screenFlash=Math.min(1,screenFlash+fl);cameraShake=Math.min(4,cameraShake+shk);
      fwBursts.push({x:fx,y:fy,color:c,r:0,maxR:mR,alpha:0.5});
      for(let i=0;i<cnt;i++){
        const a=(i/cnt)*Math.PI*2;let spd=2+Math.random()*3.5,grav=0.05,drag=0.982,ml=1.5+Math.random();
        let pc=c,pt='core',stg=0,del=0;
        if(type==='finale'&&Math.random()<0.2){stg=1;del=0.4+Math.random()*0.4;ml=del+0.5;pt='delayed';pc='#fff';spd=1+Math.random();}
        fwSparks.push({x:fx,y:fy,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,color:pc,color2:c2,alpha:1,life:0,maxLife:ml,size:1.2+Math.random()*1.5,gravity:grav,drag,flicker:Math.random()<0.3,type:pt,temp:1,wind:(Math.random()-0.5)*0.08,turb:Math.random()*0.04,stage:stg,delay:del,hasExploded:false,isSecondary:sec});
      }
      if(!sec&&type==='finale'){for(let i=0;i<2;i++){setTimeout(()=>{if(running)burst(fx+(Math.random()-0.5)*70,fy+(Math.random()-0.5)*30,c2,c,'small',true);},450+i*280);}}
    }

    function updateFW(dt:number,t:number) {
      const cl=t>=7.5;screenFlash=Math.max(0,screenFlash-dt*1.5);cameraShake=Math.max(0,cameraShake-dt*18);
      for(let i=fwRockets.length-1;i>=0;i--){const r=fwRockets[i];if(cl){fwRockets.splice(i,1);continue;}r.vy+=r.ay*dt*60;r.x+=r.vx*dt*60;r.y+=r.vy*dt*60;r.flicker=0.5+Math.random()*0.5;r.trail.push({x:r.x,y:r.y,alpha:1});if(r.trail.length>5)r.trail.shift();r.trail.forEach(tt=>tt.alpha-=0.15);if(r.y<=r.targetY||r.vy>=0){burst(r.x,r.y,r.color,r.color2,r.type);fwRockets.splice(i,1);}}
      for(let i=fwSparks.length-1;i>=0;i--){const s=fwSparks[i];if(cl){fwSparks.splice(i,1);continue;}s.life+=dt;if(s.type==='delayed'&&!s.hasExploded){if(s.life>s.delay){s.hasExploded=true;burst(s.x,s.y,s.color2,s.color,'small',true);s.alpha=0;}}else{s.vy+=s.gravity*dt*60;s.vx*=1-(1-s.drag)*dt*60;s.vy*=1-(1-s.drag)*dt*60;s.vx+=Math.sin(s.life*5+s.x*0.1)*s.turb*dt*60;s.x+=s.vx*dt*60;s.y+=s.vy*dt*60;s.temp=Math.max(0,1-s.life/s.maxLife);s.alpha=Math.max(0,1-s.life/s.maxLife);if(s.flicker)s.alpha*=(0.5+Math.random()*0.5);}if(s.life>s.maxLife||s.y>H*HORIZON||s.alpha<=0.01)fwSparks.splice(i,1);}
      for(let i=fwBursts.length-1;i>=0;i--){const b=fwBursts[i];if(cl){fwBursts.splice(i,1);continue;}b.r+=(b.maxR-b.r)*0.15;b.alpha-=0.045;if(b.alpha<=0)fwBursts.splice(i,1);}
    }

    function drawFW() {
      ctx.save();ctx.globalCompositeOperation='lighter';
      fwRockets.forEach(r=>{r.trail.forEach(tt=>{if(tt.alpha>0){ctx.globalAlpha=tt.alpha*0.7;ctx.fillStyle=r.color;ctx.beginPath();ctx.arc(tt.x,tt.y,1.2,0,Math.PI*2);ctx.fill();}});ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(r.x,r.y,1.8+r.flicker,0,Math.PI*2);ctx.fill();});
      fwBursts.forEach(b=>{const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,`${b.color}60`);g.addColorStop(0.5,`${b.color}15`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.globalAlpha=b.alpha;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});
      ctx.globalAlpha=1;fwSparks.forEach(s=>{if(s.alpha<=0)return;ctx.globalAlpha=s.alpha*0.2;ctx.drawImage(sparkSprite,s.x-s.size*3,s.y-s.size*3,s.size*6,s.size*6);ctx.globalAlpha=s.alpha;ctx.fillStyle=s.temp>0.5?'#ffffff':s.color;ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,Math.PI*2);ctx.fill();});
      ctx.restore();
    }

    // ===================== PARTICLES =====================
    function spawnDust(t:number){const tgt=Math.floor(65*smoothstep(0,3,t));let cnt=0;for(const p of pool.particles)if(p.active&&p.type==='dust')cnt++;let a=0;while(cnt<tgt&&a<5){const p=pool.spawn();if(!p)break;p.type='dust';p.x=Math.random()*W;p.y=Math.random()*H*HORIZON;p.vx=(Math.random()-0.5)*0.3;p.vy=-0.04-Math.random()*0.28;p.size=0.5+Math.random()*1.4;p.maxLife=5+Math.random()*5;p.life=Math.random()*p.maxLife*0.4;p.alpha=0;cnt++;a++;}}
    function spawnPetals(t:number){const i=smoothstep(2,5,t)*(1-smoothstep(6.5,8,t));if(i<=0||Math.random()>i*0.3)return;const p=pool.spawn();if(!p)return;p.type='petal';p.x=Math.random()*W;p.y=-15;p.vx=(Math.random()-0.5)*0.6;p.vy=0.4+Math.random()*0.6;p.size=4+Math.random()*4;p.maxLife=16;p.life=0;p.alpha=0;p.rot=Math.random()*Math.PI*2;p.rotSpd=(Math.random()-0.5)*2;}
    function spawnSmoke(t:number){const i=smoothstep(1.5,4,t)*(1-smoothstep(6.5,8,t));if(i<=0||Math.random()>0.05*i)return;const p=pool.spawn();if(!p)return;p.type='smoke';p.x=Math.random()<0.5?W*0.2:W*0.8;p.y=H*0.8;p.vx=(Math.random()-0.5)*0.2;p.vy=-0.4-Math.random()*0.35;p.size=5+Math.random()*6;p.maxLife=4+Math.random()*3;p.life=0;p.alpha=0;}
    function spawnBirds(t:number){if(t<3||t>4.5||birdsSpawned)return;birdsSpawned=true;for(let i=0;i<12;i++){const p=pool.spawn();if(!p)break;p.type='bird';p.x=-50-i*15+Math.random()*10;p.y=H*0.16+Math.random()*55+(i%3)*10;p.vx=2+Math.random()*0.5;p.vy=(Math.random()-0.5)*0.1;p.size=6+Math.random()*3;p.maxLife=22;p.life=0;p.alpha=0.5;p.flap=Math.random()*Math.PI*2;}}
    function spawnText(t:number){if(t<8.5||t>10.5||!ramPoints.length)return;const tgt=Math.min(ramPoints.length,1000);let act=0;for(const p of pool.particles)if(p.active&&p.type==='sparkle')act++;let a=0;while(act<tgt&&a<12){const p=pool.spawn();if(!p)break;const pt=ramPoints[Math.floor(Math.random()*ramPoints.length)];p.type='sparkle';const s=Math.floor(Math.random()*4);if(s===0){p.x=Math.random()*W;p.y=-20;}else if(s===1){p.x=W+20;p.y=Math.random()*H;}else if(s===2){p.x=Math.random()*W;p.y=H+20;}else{p.x=-20;p.y=Math.random()*H;}p.tx=W/2+pt.x;p.ty=H*0.38+pt.y;p.vx=0;p.vy=0;p.size=1+Math.random()*1.6;p.maxLife=8;p.life=0;p.alpha=0;p.delay=Math.random()*0.5;act++;a++;}}

    function updateParts(dt:number,t:number){
      for(const p of pool.particles){if(!p.active)continue;p.life+=dt;
        if(p.type==='dust'){p.x+=p.vx;p.y+=p.vy;p.vx+=(Math.random()-0.5)*0.02;p.vy-=0.002;const lr=p.life/p.maxLife;p.alpha=smoothstep(0,0.2,lr)*(1-smoothstep(0.75,1,lr))*0.5*smoothstep(0,2,t);if(p.life>p.maxLife||p.y<-20){p.life=0;p.x=Math.random()*W;p.y=H*0.55;p.alpha=0;}}
        else if(p.type==='petal'){p.x+=p.vx+Math.sin(t*0.7+p.y*0.01)*0.25;p.y+=p.vy;p.rot+=p.rotSpd*dt;p.alpha=smoothstep(0,0.1,p.life/p.maxLife)*0.75*(1-smoothstep(6.5,8,t));if(p.y>H*HORIZON||p.life>p.maxLife)pool.release(p);}
        else if(p.type==='sparkle'){if(p.delay>0){p.delay-=dt;p.alpha=0;continue;}const dx=p.tx-p.x,dy=p.ty-p.y,dist=Math.sqrt(dx*dx+dy*dy);if(dist>1.5){const spd=clamp(dist*5,120,650);p.vx=(dx/dist)*spd;p.vy=(dy/dist)*spd;p.x+=p.vx*dt;p.y+=p.vy*dt;p.alpha=clamp(p.alpha+dt*2.5,0,0.8);}else{p.x=p.tx+Math.sin(t*3.5+p.idx)*0.3;p.y=p.ty+Math.cos(t*3.5+p.idx*1.3)*0.3;p.alpha=clamp(p.alpha+dt*1.5,0,1);}if(t>17)p.alpha*=1-smoothstep(17,17.5,t);if(t>17.5&&p.alpha<0.01)pool.release(p);}
        else if(p.type==='smoke'){p.x+=p.vx+Math.sin(t*1.2+p.y*0.01)*0.18;p.y+=p.vy;p.size+=dt*4;const lr=p.life/p.maxLife;p.alpha=smoothstep(0,0.2,lr)*(1-smoothstep(0.7,1,lr))*0.13;if(p.life>p.maxLife||p.y<-20)pool.release(p);}
        else if(p.type==='bird'){p.x+=p.vx;p.y+=p.vy;p.flap+=dt*8;p.alpha=0.5*(1-smoothstep(6.5,8,t));if(p.x>W+50||p.alpha<0.01)pool.release(p);}
      }
    }

    function drawParts() {
      ctx.save();
      for(const p of pool.particles){if(!p.active||p.alpha<=0.01)continue;
        if(p.type==='dust'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=p.alpha;ctx.drawImage(dustSprite,p.x-p.size*3,p.y-p.size*3,p.size*6,p.size*6);}
        else if(p.type==='sparkle'){const d=Math.sqrt((p.tx-p.x)**2+(p.ty-p.y)**2),near=d<5;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=p.alpha*(near?0.8:0.6);const sz=near?p.size*0.8:p.size;ctx.drawImage(sparkSprite,p.x-sz*2.2,p.y-sz*2.2,sz*4.4,sz*4.4);ctx.globalAlpha=p.alpha;ctx.fillStyle=near?'#FFD700':'#FFB300';ctx.beginPath();ctx.arc(p.x,p.y,sz*0.5,0,Math.PI*2);ctx.fill();if(near&&Math.random()<0.02){ctx.globalAlpha=p.alpha*0.35;ctx.fillStyle='#FFF8E0';ctx.beginPath();ctx.arc(p.x,p.y,sz*1.3,0,Math.PI*2);ctx.fill();}}
        else if(p.type==='smoke'){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=p.alpha;const sg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);sg.addColorStop(0,'rgba(150,120,90,0.22)');sg.addColorStop(0.5,'rgba(110,85,60,0.1)');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
        else if(p.type==='petal'){ctx.globalCompositeOperation='source-over';ctx.save();ctx.globalAlpha=p.alpha;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle='#dd7733';ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*0.38,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ee9955';ctx.beginPath();ctx.ellipse(p.size*0.12,0,p.size*0.42,p.size*0.18,0,0,Math.PI*2);ctx.fill();ctx.restore();}
        else if(p.type==='bird'){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=p.alpha;ctx.strokeStyle='#0d0603';ctx.lineWidth=1.3;ctx.lineCap='round';const w=Math.sin(p.flap)*p.size*0.5;ctx.beginPath();ctx.moveTo(p.x-p.size,p.y+w);ctx.quadraticCurveTo(p.x-p.size*0.2,p.y-p.size*0.12,p.x,p.y);ctx.quadraticCurveTo(p.x+p.size*0.2,p.y-p.size*0.12,p.x+p.size,p.y+w);ctx.stroke();}
      }
      ctx.restore();
    }

    // ===================== LENS FLARE =====================
    function drawLensFlare(t:number){const v=sunVis(t);if(v<0.12)return;const sx=W*0.5,sy=H*HORIZON;ctx.save();ctx.globalCompositeOperation='lighter';[{d:0.12,sz:9,a:0.025,c:'185,205,255'},{d:0.25,sz:18,a:0.018,c:'255,225,185'},{d:0.4,sz:7,a:0.03,c:'205,185,255'},{d:0.55,sz:22,a:0.012,c:'255,205,155'}].forEach((e,i)=>{const fx=sx-0.2*W*e.d,fy=sy-0.4*H*e.d,sz=e.sz*v,a=e.a*v*(0.65+0.35*Math.sin(t*0.8+i*1.2));if(a<=0)return;const g=ctx.createRadialGradient(fx,fy,0,fx,fy,sz);g.addColorStop(0,`rgba(${e.c},${a})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(fx,fy,sz,0,Math.PI*2);ctx.fill();});ctx.restore();}

    function drawVignette(){const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.25,W/2,H/2,Math.max(W,H)*0.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.6)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}

    // ===================== MAIN RENDER =====================
    function render(ts:number) {
      if(!startTime) startTime=ts;
      const t=(ts-startTime)/1000;
      const dt=Math.min(0.05,(ts-lastTime)/1000);
      lastTime=ts;

      ctx.save();
      if(cameraShake>0.1) ctx.translate((Math.random()-0.5)*cameraShake*2,(Math.random()-0.5)*cameraShake*2);

      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);

      // === BACK LAYER ===
      drawSky(t);
      drawSun(t);
      drawHeatShimmer(t);

      // === VOLUMETRIC RAYS (offscreen + blur) ===
      drawRaysOffscreen(t);
      compositeRaysBlurred();

      // === TEMPLE GLOW (behind silhouette) ===
      drawTempleGlow(t);

      // === TEMPLE SILHOUETTE (dark, rim-lit) ===
      drawTempleSilhouette(t);

      // === DIVINE EMERGENCE (light FROM BEHIND temple) ===
      drawDivineEmergence(t);

      // === LIGHT LEAK ===
      drawLightLeak(t);

      // === FRONT LAYER ===
      drawFog(t);
      drawWater(t);
      drawDiyas(t);

      // === FIREWORKS ===
      launchFW(t); updateFW(dt,t); drawFW();

      // === PARTICLES ===
      spawnDust(t); spawnPetals(t); spawnSmoke(t); spawnBirds(t); spawnText(t);
      updateParts(dt,t); drawParts();

      // === POST ===
      drawLensFlare(t);
      drawVignette();

      if(screenFlash>0.01&&t<7){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,242,205,${screenFlash*0.3})`;ctx.fillRect(0,0,W,H);ctx.restore();}

      ctx.save();ctx.globalAlpha=0.055;ctx.drawImage(grain,0,0,W,H);ctx.restore();

      // Text bg glow
      const tBg=smoothstep(8,9,t)*(1-smoothstep(17,17.5,t));
      if(tBg>0){ctx.save();ctx.globalCompositeOperation='lighter';const tg=ctx.createRadialGradient(W/2,H*0.38,0,W/2,H*0.38,W*0.3);tg.addColorStop(0,`rgba(255,185,65,${0.07*tBg})`);tg.addColorStop(0.5,`rgba(200,105,35,${0.025*tBg})`);tg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=tg;ctx.fillRect(0,0,W,H);ctx.restore();}

      ctx.restore();

      if(t>17&&!handoverTriggered){handoverTriggered=true;setTimeout(()=>{if(running&&onCompleteRef.current)onCompleteRef.current();},1500);}
      if(running) rafId=requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(render);
    return () => { running=false; cancelAnimationFrame(rafId); window.removeEventListener('resize',resize); };
  }, []);

  return <canvas ref={canvasRef} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:9999,background:'#000'}} />;
}
