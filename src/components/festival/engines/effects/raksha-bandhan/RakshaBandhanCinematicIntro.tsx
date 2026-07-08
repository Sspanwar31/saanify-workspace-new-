'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';

/* ═══════════════════════════════════════════════════
   RakshaBandhanCinematicIntro
   AAA cinematic festival intro — Canvas + React Hooks
   ═══════════════════════════════════════════════════ */

interface Props {
  onComplete: () => void;
}

/* ── Easing ─────────────────────────────────────── */
const easeOutCubic  = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic   = (t: number) => t * t * t;
const easeInOutCubic= (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const easeOutExpo   = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeOutQuart  = (t: number) => 1 - Math.pow(1 - t, 4);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── Palette ────────────────────────────────────── */
const C = {
  gold:     '#FFD700',
  deepGold: '#ca8a04',
  orange:   '#f97316',
  crimson:  '#dc2626',
  pink:     '#db2777',
  light:    '#fef08a',
  warm:     '#fffbeb',
};

/* ── Particle interface ─────────────────────────── */
interface Pt {
  x: number; y: number;
  sx: number; sy: number;
  tx: number; ty: number;
  vx: number; vy: number;
  sz: number;
  a: number;
  hue: number;
  delay: number;
  nb: number[];
}

/* ── Phase timestamps (ms) ──────────────────────── */
const PH = {
  darkEnd: 500, starEnd: 1500, threadEnd: 2500, warriorEnd: 4500,
  dissolveEnd: 5500, brotherEnd: 6500, sisterEnd: 7500, moveEnd: 8000,
  rakhiEnd: 9000, detailEnd: 9500, shieldEnd: 10000, spreadEnd: 10500,
  textEnd: 11000, glowEnd: 11500, fadeEnd: 12000,
};

/* ═══════════════════════════════════════════════════
   ANATOMICAL SILHOUETTE — Edge-Biased Generator
   68% particles on contour, 32% inside = recognizable
   human energy-being shape instead of random blobs.
   ═══════════════════════════════════════════════════ */
function genSilhouette(cx: number, cy: number, s: number, type: 'warrior' | 'brother' | 'sister'): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];

  /* edge-biased fill: most dots hug the outline */
  const edge = (ex: number, ey: number, rx: number, ry: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() < 0.68
        ? 0.82 + Math.random() * 0.18
        : Math.sqrt(Math.random()) * 0.75;
      pts.push({ x: ex + Math.cos(a) * rx * r, y: ey + Math.sin(a) * ry * r });
    }
  };

  /* ── Head (taller oval) ── */
  edge(cx, cy - 76 * s, 10 * s, 13 * s, 58);
  edge(cx, cy - 62 * s, 5 * s, 3 * s, 8);

  /* ── Neck ── */
  edge(cx, cy - 57 * s, 5 * s, 4 * s, 12);

  const sw = type === 'warrior' ? 48 * s : 38 * s;

  /* ── Torso — stacked bands with natural taper ── */
  edge(cx, cy - 49 * s, sw, 7 * s, 52);
  edge(cx, cy - 39 * s, sw * 0.62, 8 * s, 40);
  edge(cx, cy - 27 * s, sw * 0.50, 7 * s, 32);
  edge(cx, cy - 16 * s, sw * 0.42, 6 * s, 26);
  edge(cx, cy - 5 * s, (type === 'warrior' ? 21 : 16) * s, 7 * s, 22);

  /* ── Arms (pose varies by type) ── */
  if (type === 'sister') {
    /* right arm: natural hang */
    edge(cx + sw - 5 * s, cy - 37 * s, 7 * s, 15 * s, 18);
    edge(cx + sw - 4 * s, cy - 19 * s, 6 * s, 15 * s, 15);
    edge(cx + sw - 3 * s, cy - 2 * s, 5 * s, 8 * s, 8);
    /* left arm: REACHING toward brother (horizontal) */
    edge(cx - sw + 14 * s, cy - 47 * s, 18 * s, 6 * s, 22);
    edge(cx - sw - 6 * s, cy - 47 * s, 16 * s, 5 * s, 18);
    edge(cx - sw - 22 * s, cy - 47 * s, 6 * s, 5 * s, 10);
  } else if (type === 'warrior') {
    /* left arm: natural */
    edge(cx - sw + 5 * s, cy - 37 * s, 7 * s, 15 * s, 18);
    edge(cx - sw + 4 * s, cy - 19 * s, 6 * s, 15 * s, 15);
    edge(cx - sw + 3 * s, cy - 2 * s, 5 * s, 8 * s, 8);
    /* right arm: RAISED with sword */
    edge(cx + sw - 3 * s, cy - 57 * s, 6 * s, 16 * s, 18);
    edge(cx + sw - 2 * s, cy - 75 * s, 5 * s, 14 * s, 15);
    edge(cx + sw - 1 * s, cy - 89 * s, 5 * s, 7 * s, 8);
    edge(cx + sw, cy - 108 * s, 2.5 * s, 24 * s, 24);
    edge(cx + sw, cy - 87 * s, 8 * s, 2 * s, 6);
  } else {
    /* brother: both arms natural */
    edge(cx - sw + 5 * s, cy - 37 * s, 7 * s, 15 * s, 18);
    edge(cx - sw + 4 * s, cy - 19 * s, 6 * s, 15 * s, 15);
    edge(cx - sw + 3 * s, cy - 2 * s, 5 * s, 8 * s, 8);
    edge(cx + sw - 5 * s, cy - 37 * s, 7 * s, 15 * s, 18);
    edge(cx + sw - 4 * s, cy - 19 * s, 6 * s, 15 * s, 15);
    edge(cx + sw - 3 * s, cy - 2 * s, 5 * s, 8 * s, 8);
  }

  /* ── Legs ── */
  const lw = type === 'warrior' ? 9 * s : 7 * s;
  const lg = type === 'warrior' ? 10 * s : 7 * s;
  edge(cx - lg - lw * 0.4, cy + 8 * s, lw, 18 * s, 24);
  edge(cx - lg - lw * 0.35, cy + 30 * s, lw * 0.85, 20 * s, 22);
  edge(cx - lg - lw * 0.2, cy + 52 * s, lw * 0.9, 5 * s, 8);
  edge(cx + lg + lw * 0.4, cy + 8 * s, lw, 18 * s, 24);
  edge(cx + lg + lw * 0.35, cy + 30 * s, lw * 0.85, 20 * s, 22);
  edge(cx + lg + lw * 0.2, cy + 52 * s, lw * 0.9, 5 * s, 8);

  return pts;
}

/* ═══════════════════════════════════════════════════
   NEIGHBOR GRID — Pre-computed energy mesh
   Connects nearby particles into a living energy web
   ═══════════════════════════════════════════════════ */
function computeNeighbors(arr: Pt[], maxDist: number): void {
  const md2 = maxDist * maxDist;
  for (let i = 0; i < arr.length; i++) arr[i].nb = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const dx = arr[i].tx - arr[j].tx;
      const dy = arr[i].ty - arr[j].ty;
      if (dx * dx + dy * dy < md2) {
        arr[i].nb.push(j);
        arr[j].nb.push(i);
      }
    }
  }
}

/* ═══════════════════════════════════════════════════
   BODY GLOW — Anatomically-shaped soft light
   Uses simple shapes + heavy shadowBlur for organic
   silhouette that matches particle positions.
   ═══════════════════════════════════════════════════ */
function drawSilGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, type: 'warrior' | 'brother' | 'sister', alpha: number) {
  if (alpha < 0.01) return;
  ctx.save();
  const fem = type === 'sister';
  ctx.globalAlpha = alpha * 0.30;
  ctx.shadowColor = fem ? '#db2777' : '#FFD700';
  ctx.shadowBlur = 55 * s;
  ctx.fillStyle = fem ? '#ec4899' : '#fbbf24';

  /* head */
  ctx.beginPath();
  ctx.ellipse(cx, cy - 76 * s, 10 * s, 13 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  const sw = type === 'warrior' ? 48 * s : 38 * s;
  const hw = type === 'warrior' ? 21 * s : 16 * s;

  /* torso */
  ctx.beginPath();
  ctx.moveTo(cx - 5 * s, cy - 64 * s);
  ctx.lineTo(cx - sw, cy - 50 * s);
  ctx.quadraticCurveTo(cx - sw * 0.65, cy - 20 * s, cx - hw, cy - 3 * s);
  ctx.lineTo(cx + hw, cy - 3 * s);
  ctx.quadraticCurveTo(cx + sw * 0.65, cy - 20 * s, cx + sw, cy - 50 * s);
  ctx.lineTo(cx + 5 * s, cy - 64 * s);
  ctx.closePath();
  ctx.fill();

  /* arms */
  const aw = 12 * s;
  if (type === 'sister') {
    ctx.fillRect(cx + sw - aw / 2 - 2 * s, cy - 50 * s, aw, 58 * s);
    ctx.save();
    ctx.translate(cx - sw + 5 * s, cy - 47 * s);
    ctx.rotate(-0.08);
    ctx.fillRect(-70 * s, -aw * 0.4, 70 * s, aw * 0.8);
    ctx.restore();
  } else if (type === 'warrior') {
    ctx.fillRect(cx - sw - aw / 2 + 2 * s, cy - 50 * s, aw, 58 * s);
    ctx.save();
    ctx.translate(cx + sw - 2 * s, cy - 50 * s);
    ctx.rotate(0.18);
    ctx.fillRect(-aw / 2, -50 * s, aw, 52 * s);
    ctx.restore();
  } else {
    ctx.fillRect(cx - sw - aw / 2 + 2 * s, cy - 50 * s, aw, 58 * s);
    ctx.fillRect(cx + sw - aw / 2 - 2 * s, cy - 50 * s, aw, 58 * s);
  }

  /* legs */
  const lw = type === 'warrior' ? 9 * s : 7 * s;
  const lg = type === 'warrior' ? 10 * s : 7 * s;
  ctx.fillRect(cx - lg - lw, cy - 3 * s, lw * 2, 62 * s);
  ctx.fillRect(cx + lg - lw, cy - 3 * s, lw * 2, 62 * s);

  /* inner energy core */
  ctx.shadowBlur = 0;
  const ig = ctx.createRadialGradient(cx, cy - 35 * s, 0, cx, cy - 35 * s, 28 * s);
  ig.addColorStop(0, `rgba(255,250,230,${alpha * 0.14})`);
  ig.addColorStop(1, 'rgba(255,250,230,0)');
  ctx.fillStyle = ig;
  ctx.beginPath();
  ctx.arc(cx, cy - 35 * s, 28 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ── Rakhi point generator ──────────────────────── */
function genRakhiPts(R: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; pts.push({ x: Math.cos(a) * R, y: Math.sin(a) * R }); }
  for (let i = 0; i < 55; i++) { const a = (i / 55) * Math.PI * 2; pts.push({ x: Math.cos(a) * R * 0.72, y: Math.sin(a) * R * 0.72 }); }
  for (let sp = 0; sp < 8; sp++) { const ba = (sp / 8) * Math.PI * 2; for (let j = 0; j < 7; j++) { const t = (j + 1) / 8; pts.push({ x: Math.cos(ba) * R * t, y: Math.sin(ba) * R * t }); } }
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; pts.push({ x: Math.cos(a) * R * 0.14, y: Math.sin(a) * R * 0.14 }); }
  return pts;
}

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */
export default function RakshaBandhanCinematicIntro({ onComplete }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef(0);
  const t0Ref      = useRef(0);
  const doneRef    = useRef(false);
  const mountedRef = useRef(true);
  const onCompRef  = useRef(onComplete);
  const ambRef     = useRef<Pt[]>([]);
  const [finished, setFinished] = useState(false);

  onCompRef.current = onComplete;

  /* ── Ambient particle pool ─────────────────────── */
  const initAmb = useCallback((w: number, h: number): Pt[] => {
    const a: Pt[] = [];
    for (let i = 0; i < 50; i++) {
      a.push({
        x: Math.random() * w, y: Math.random() * h,
        sx: 0, sy: 0, tx: 0, ty: 0,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * 0.35 + 0.12),
        sz: Math.random() * 1.6 + 0.5,
        a: Math.random() * 0.3 + 0.06,
        hue: Math.random(), delay: 0, nb: [],
      });
    }
    return a;
  }, []);

  /* ── Main effect ───────────────────────────────── */
  useEffect(() => {
    mountedRef.current = true;
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext('2d')!;
    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      cvs.width = W * dpr; cvs.height = H * dpr;
      cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ambRef.current = initAmb(W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── Pre-generate data ──────────────────────── */
    const sc = Math.min(W, H) / 780;
    const warriorPts = genSilhouette(0, 80 * sc, sc, 'warrior');
    const brotherPts = genSilhouette(-80 * sc, 80 * sc, sc * 0.95, 'brother');
    const sisterPts  = genSilhouette(80 * sc, 80 * sc, sc * 0.88, 'sister');
    const rakhiR     = 55 * sc;
    const rakhiPts   = genRakhiPts(rakhiR);
    const nbDist     = 16 * sc;

    /* ── Particle factories ─────────────────────── */
    const makeForm = (pts: { x: number; y: number }[], ox: number, oy: number, spread: number): Pt[] => {
      const arr: Pt[] = pts.map((p, i) => ({
        x: ox + (Math.random() - 0.5) * spread,
        y: oy + (Math.random() - 0.5) * spread,
        sx: ox + (Math.random() - 0.5) * spread,
        sy: oy + (Math.random() - 0.5) * spread,
        tx: p.x, ty: p.y, vx: 0, vy: 0,
        sz: Math.random() * 1.4 + 0.6,
        a: 0, hue: Math.random(),
        delay: (i / pts.length) * 0.45,
        nb: [],
      }));
      computeNeighbors(arr, nbDist);
      return arr;
    };

    const warriorP = makeForm(warriorPts, 0, -100 * sc, 80 * sc);

    const dissolveP: Pt[] = warriorPts.map((p, i) => ({
      x: p.x, y: p.y, sx: p.x, sy: p.y,
      tx: p.x + (Math.random() - 0.5) * 350 * sc,
      ty: p.y + (Math.random() - 0.5) * 350 * sc - 60 * sc,
      vx: 0, vy: 0, sz: Math.random() * 1.4 + 0.5,
      a: 0.8, hue: Math.random(),
      delay: (i / warriorPts.length) * 0.35, nb: [],
    }));
    computeNeighbors(dissolveP, nbDist);

    const brotherP = makeForm(brotherPts, 0, 0, 220 * sc);
    const sisterP  = makeForm(sisterPts, 0, 0, 220 * sc);

    const rakhiP: Pt[] = rakhiPts.map((p, i) => ({
      x: (Math.random() - 0.5) * 50 * sc,
      y: (Math.random() - 0.5) * 50 * sc,
      sx: (Math.random() - 0.5) * 50 * sc,
      sy: (Math.random() - 0.5) * 50 * sc,
      tx: p.x, ty: p.y - 20 * sc,
      vx: 0, vy: 0, sz: Math.random() * 2.2 + 0.9,
      a: 0, hue: Math.random() * 0.6,
      delay: (i / rakhiPts.length) * 0.35, nb: [],
    }));

    const spreadP: Pt[] = [];
    for (let i = 0; i < 100; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * Math.max(W, H) * 0.65;
      spreadP.push({
        x: 0, y: -20 * sc, sx: 0, sy: -20 * sc,
        tx: Math.cos(a) * d, ty: Math.sin(a) * d,
        vx: 0, vy: 0, sz: Math.random() * 2 + 0.5,
        a: Math.random() * 0.45 + 0.15, hue: Math.random(),
        delay: Math.random() * 0.35, nb: [],
      });
    }

    /* ══════════════════════════════════════════════
       DRAWING HELPERS
       ══════════════════════════════════════════════ */

    const drawPt = (p: Pt, alpha: number) => {
      if (alpha < 0.008) return;
      const r = 255, g = Math.round(lerp(215, 140, p.hue)), b = 0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = `rgb(${r},${g},${b})`;
      ctx.shadowBlur = 4 + p.sz * 2.5;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /* ── Energy mesh — the KEY to "energy being" look ── */
    const drawMesh = (arr: Pt[], color: string) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 2;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        if (p.a < 0.08) continue;
        for (const j of p.nb) {
          if (j <= i) continue;
          const q = arr[j];
          if (q.a < 0.08) continue;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawForm = (arr: Pt[], prog: number, fade: number, offX = 0, meshCol = 'rgba(255,215,0,1)') => {
      if (prog <= 0 && fade <= 0) return;
      for (const p of arr) {
        const lp = clamp((prog - p.delay) / (1 - p.delay), 0, 1);
        const ep = easeOutCubic(lp);
        p.x = lerp(p.sx, p.tx + offX, ep);
        p.y = lerp(p.sy, p.ty, ep);
        p.a = ep * (1 - fade) * 0.88;
      }
      drawMesh(arr, meshCol);
      for (const p of arr) drawPt(p, p.a);
    };

    const drawDiss = (arr: Pt[], prog: number) => {
      if (prog <= 0) return;
      for (const p of arr) {
        const lp = clamp((prog - p.delay) / (1 - p.delay), 0, 1);
        const ep = easeOutQuart(lp);
        p.x = lerp(p.sx, p.tx, ep);
        p.y = lerp(p.sy, p.ty, ep);
        p.a = (1 - ep) * 0.72;
      }
      drawMesh(arr, 'rgba(255,215,0,1)');
      for (const p of arr) drawPt(p, p.a);
    };

    /* ── Rakhi art (Warm Silk design) ───────────── */
    const drawRakhiArt = (cx: number, cy: number, prog: number, detail: number, time: number) => {
      if (prog <= 0) return;
      const R = rakhiR;
      ctx.save();
      ctx.globalAlpha = prog;

      const gr = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 3.5);
      gr.addColorStop(0, 'rgba(220, 38, 38, 0.15)');
      gr.addColorStop(0.5, 'rgba(251, 191, 36, 0.08)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(cx, cy, R * 3.5, 0, Math.PI * 2); ctx.fill();

      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + Math.sin(time * 0.001) * 0.05;
        const sx2 = cx + Math.cos(a) * R * 0.95;
        const sy2 = cy + Math.sin(a) * R * 0.95;
        const tl = R * 0.85 * prog;
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 ? `rgba(220, 38, 38, ${0.65 * prog})` : `rgba(219, 39, 119, ${0.6 * prog})`;
        ctx.lineWidth = 1.5;
        ctx.moveTo(sx2, sy2);
        for (let j = 1; j <= 8; j++) {
          const t2 = j / 8;
          ctx.lineTo(sx2 + Math.sin(t2 * 3.0 + time * 0.002 + i) * 4 * sc, sy2 + t2 * tl);
        }
        ctx.stroke();
      }

      ctx.shadowColor = C.gold; ctx.shadowBlur = 15 * prog;
      ctx.fillStyle = `rgba(220, 38, 38, ${0.85 * prog})`;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + time * 0.0005;
        const px = cx + Math.cos(a) * R * 0.85;
        const py = cy + Math.sin(a) * R * 0.85;
        ctx.beginPath(); ctx.arc(px, py, 12 * sc, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.gold; ctx.lineWidth = 1.2; ctx.stroke();
      }

      ctx.strokeStyle = C.gold; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2 * Math.min(1, prog * 1.15)); ctx.stroke();

      if (prog > 0.4) {
        const dp = clamp((prog - 0.4) / 0.4, 0, 1);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - time * 0.0003;
          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fef08a';
          ctx.shadowBlur = 8 * dp;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * R * 0.58, cy + Math.sin(a) * R * 0.58, 3.5 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (detail > 0) {
        ctx.shadowColor = C.crimson; ctx.shadowBlur = 18;
        ctx.fillStyle = `rgba(220, 38, 38, ${detail * 0.95})`;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255, 248, 220, ${detail})`;
        for (let i = 0; i < 5; i++) {
          const rx = cx + (i - 2) * 3 * sc;
          const ry = cy + Math.sin(i * 10) * 4 * sc;
          ctx.beginPath(); ctx.ellipse(rx, ry, 2 * sc, 4 * sc, 0.4, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    };

    /* ── Shield wave ────────────────────────────── */
    const drawShield = (cx: number, cy: number, prog: number) => {
      if (prog <= 0) return;
      const maxR = Math.max(W, H) * 0.85;
      const r = easeOutExpo(prog) * maxR;
      const alpha = (1 - prog) * 0.55;
      ctx.save();
      const grd = ctx.createRadialGradient(cx, cy, Math.max(0, r - 20), cx, cy, r + 10);
      grd.addColorStop(0, 'rgba(255,215,0,0)');
      grd.addColorStop(0.5, `rgba(255,215,0,${alpha * 0.35})`);
      grd.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,230,150,${alpha})`;
      ctx.lineWidth = 3 + (1 - prog) * 6;
      ctx.shadowColor = C.gold; ctx.shadowBlur = 25;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    };

    /* ── Hindi text (Golden Chrome gradient) ────── */
    const drawText = (prog: number, glow: number, time: number) => {
      if (prog <= 0) return;
      const cx = W / 2, cy = H / 2;
      const fs = Math.min(W * 0.058, 54);
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${fs}px "Noto Sans Devanagari","Mangal","Kokila","Segoe UI",sans-serif`;
      const txt = 'बंधन नहीं, शक्ति है';
      const yOff = 50 * sc;

      ctx.shadowColor = '#db2777';
      ctx.shadowBlur = 15 + glow * 25;
      const textGrad = ctx.createLinearGradient(cx, cy + yOff - 20, cx, cy + yOff + 20);
      textGrad.addColorStop(0, '#ffffff');
      textGrad.addColorStop(0.4, '#fef08a');
      textGrad.addColorStop(0.5, '#eab308');
      textGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = textGrad;
      ctx.fillText(txt, cx, cy + yOff);
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeText(txt, cx, cy + yOff);

      ctx.shadowColor = C.gold;
      ctx.shadowBlur = (15 + glow * 25) * 0.3;
      ctx.fillStyle = `rgba(255,254,230,${prog * 0.18})`;
      ctx.fillText(txt, cx, cy + yOff);

      const subFs = Math.min(W * 0.017, 15);
      ctx.font = `400 ${subFs}px "Noto Sans Devanagari","Mangal","Segoe UI",sans-serif`;
      ctx.fillStyle = `rgba(255,200,100,${prog * 0.45})`;
      ctx.shadowColor = C.gold; ctx.shadowBlur = 4;
      ctx.fillText('Raksha Bandhan', cx, cy + yOff + fs * 0.85);
      ctx.restore();
    };

    /* ── Energy threads between figures ─────────── */
    const drawEnergyThreads = (cx: number, cy: number, prog: number, time: number) => {
      if (prog <= 0) return;
      ctx.save();
      ctx.globalAlpha = prog * 0.35;
      for (let i = 0; i < 5; i++) {
        const yOff = (i - 2) * 14 * sc;
        ctx.beginPath();
        ctx.strokeStyle = C.gold; ctx.lineWidth = 1;
        ctx.shadowColor = C.gold; ctx.shadowBlur = 8;
        ctx.moveTo(cx - 40 * sc, cy + yOff);
        ctx.bezierCurveTo(
          cx - 15 * sc, cy + yOff + Math.sin(time * 0.003 + i) * 10 * sc,
          cx + 15 * sc, cy + yOff + Math.cos(time * 0.003 + i) * 10 * sc,
          cx + 40 * sc, cy + yOff,
        );
        ctx.stroke();
      }
      ctx.restore();
    };

    /* ══════════════════════════════════════════════
       ANIMATION LOOP
       ══════════════════════════════════════════════ */
    t0Ref.current = performance.now();

    const frame = (now: number) => {
      const ms = now - t0Ref.current;
      const cx = W / 2, cy = H / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

      const vig = ctx.createRadialGradient(cx, cy, W * 0.18, cx, cy, W * 0.78);
      vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

      let gA = 1;
      if (ms > PH.glowEnd) gA = 1 - easeInCubic(clamp((ms - PH.glowEnd) / (PH.fadeEnd - PH.glowEnd), 0, 1));

      ctx.save();
      ctx.globalAlpha = gA;

      if (ms > PH.rakhiEnd && ms < PH.spreadEnd) {
        const tint = Math.sin(clamp((ms - PH.rakhiEnd) / (PH.spreadEnd - PH.rakhiEnd), 0, 1) * Math.PI) * 0.06;
        ctx.fillStyle = `rgba(255,200,50,${tint})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.save();
      ctx.translate(cx, cy);

      /* ─ PHASE 2: Star ─ */
      if (ms > PH.darkEnd && ms < PH.fadeEnd) {
        const sp = easeOutCubic(clamp((ms - PH.darkEnd) / (PH.starEnd - PH.darkEnd), 0, 1));
        const pulse = 0.7 + Math.sin(now * 0.004) * 0.3;
        const sa = sp * pulse;

        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, sp * 110 * sc * pulse);
        gr.addColorStop(0, `rgba(255,215,0,${sa * 0.5})`);
        gr.addColorStop(0.35, `rgba(255,165,0,${sa * 0.18})`);
        gr.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(0, 0, sp * 110 * sc * pulse, 0, Math.PI * 2); ctx.fill();

        ctx.shadowColor = C.gold; ctx.shadowBlur = 28 * sp;
        ctx.fillStyle = `rgba(255,248,220,${sa})`;
        ctx.beginPath(); ctx.arc(0, 0, sp * 4.5 * sc, 0, Math.PI * 2); ctx.fill();

        if (sp > 0.5) {
          const ra = (sp - 0.5) * 2 * pulse;
          ctx.strokeStyle = `rgba(255,215,0,${ra * 0.22})`; ctx.lineWidth = 1.5; ctx.shadowBlur = 8;
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI + now * 0.0004;
            const len = 38 * sp * sc * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke();
          }
        }

        if (sp > 0.65) {
          const fa = (sp - 0.65) / 0.35 * pulse * 0.12;
          const fg = ctx.createLinearGradient(-90 * sc, 0, 90 * sc, 0);
          fg.addColorStop(0, 'rgba(255,215,0,0)');
          fg.addColorStop(0.5, `rgba(255,235,160,${fa})`);
          fg.addColorStop(1, 'rgba(255,215,0,0)');
          ctx.fillStyle = fg;
          ctx.fillRect(-90 * sc, -2, 180 * sc, 4);
        }
      }

      /* ─ PHASE 3: Thread ─ */
      if (ms > PH.starEnd && ms < PH.warriorEnd) {
        const tp = easeOutCubic(clamp((ms - PH.starEnd) / (PH.threadEnd - PH.starEnd), 0, 1));
        const tf = ms > PH.warriorEnd - 500 ? 1 - easeInCubic(clamp((ms - (PH.warriorEnd - 500)) / 500, 0, 1)) : 1;
        if (tf > 0.01) {
          ctx.save(); ctx.globalAlpha *= tf;
          const sy = 0, ey = 180 * sc;
          const curEnd = sy + (ey - sy) * tp;
          ctx.beginPath(); ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
          ctx.shadowColor = C.gold; ctx.shadowBlur = 14;
          ctx.moveTo(0, sy);
          for (let y = sy; y <= curEnd; y += 2) {
            const p2 = (y - sy) / (curEnd - sy || 1);
            ctx.lineTo(Math.sin(p2 * 10 + now * 0.006) * 3 * sc * (1 - p2 * 0.3), y);
          }
          ctx.stroke();
          for (let i = 0; i < 18; i++) {
            const pt = Math.random() * tp;
            const py = sy + pt * (ey - sy);
            ctx.fillStyle = `rgba(255,248,220,${Math.random() * 0.55 + 0.2})`;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(
              Math.sin(pt * 10 + now * 0.006) * 3 * sc + (Math.random() - 0.5) * 8 * sc,
              py + (Math.random() - 0.5) * 6 * sc,
              Math.random() * 1.4 + 0.4, 0, Math.PI * 2
            );
            ctx.fill();
          }
          ctx.restore();
        }
      }

      /* ─ PHASE 4: Warrior ─ */
      if (ms > PH.threadEnd && ms < PH.dissolveEnd) {
        const fp = easeOutCubic(clamp((ms - PH.threadEnd) / (PH.warriorEnd - PH.threadEnd), 0, 1));
        const dp = ms > PH.warriorEnd ? easeInCubic(clamp((ms - PH.warriorEnd) / (PH.dissolveEnd - PH.warriorEnd), 0, 1)) : 0;
        drawSilGlow(ctx, 0, 80 * sc, sc, 'warrior', fp * (1 - dp));
        drawForm(warriorP, fp, dp, 0, 'rgba(255,215,0,1)');
      }

      /* ─ PHASE 5: Dissolve ─ */
      if (ms > PH.warriorEnd && ms < PH.brotherEnd) {
        drawDiss(dissolveP, easeOutQuart(clamp((ms - PH.warriorEnd) / (PH.dissolveEnd - PH.warriorEnd), 0, 1)));
      }

      /* ─ PHASE 6: Brother ─ */
      if (ms > PH.dissolveEnd && ms < PH.rakhiEnd) {
        const fp = easeOutCubic(clamp((ms - PH.dissolveEnd) / (PH.brotherEnd - PH.dissolveEnd), 0, 1));
        const fade = ms > PH.moveEnd ? easeInCubic(clamp((ms - PH.moveEnd) / (PH.rakhiEnd - PH.moveEnd), 0, 1)) : 0;
        const mv = ms > PH.sisterEnd ? easeInOutCubic(clamp((ms - PH.sisterEnd) / (PH.moveEnd - PH.sisterEnd), 0, 1)) : 0;
        drawSilGlow(ctx, -80 * sc + mv * 40 * sc, 80 * sc, sc * 0.95, 'brother', fp * (1 - fade));
        drawForm(brotherP, fp, fade, mv * 40 * sc, 'rgba(255,215,0,1)');
      }

      /* ─ PHASE 7: Sister ─ */
      if (ms > PH.brotherEnd && ms < PH.rakhiEnd) {
        const fp = easeOutCubic(clamp((ms - PH.brotherEnd) / (PH.sisterEnd - PH.brotherEnd), 0, 1));
        const fade = ms > PH.moveEnd ? easeInCubic(clamp((ms - PH.moveEnd) / (PH.rakhiEnd - PH.moveEnd), 0, 1)) : 0;
        const mv = ms > PH.sisterEnd ? easeInOutCubic(clamp((ms - PH.sisterEnd) / (PH.moveEnd - PH.sisterEnd), 0, 1)) : 0;
        drawSilGlow(ctx, 80 * sc - mv * 40 * sc, 80 * sc, sc * 0.88, 'sister', fp * (1 - fade));
        drawForm(sisterP, fp, fade, -mv * 40 * sc, 'rgba(219,39,119,1)');
      }

      /* ─ PHASE 8: Energy threads ─ */
      if (ms > PH.sisterEnd && ms < PH.rakhiEnd) {
        const tp = easeInOutCubic(clamp((ms - PH.sisterEnd) / (PH.moveEnd - PH.sisterEnd), 0, 1));
        const tf = ms > PH.moveEnd ? 1 - easeInCubic(clamp((ms - PH.moveEnd) / (PH.rakhiEnd - PH.moveEnd), 0, 1)) : 1;
        drawEnergyThreads(0, 80 * sc, tp * tf, now);
      }

      /* ─ PHASE 9-10: Rakhi ─ */
      if (ms > PH.moveEnd && ms < PH.shieldEnd + 200) {
        const rp = easeOutCubic(clamp((ms - PH.moveEnd) / (PH.rakhiEnd - PH.moveEnd), 0, 1));
        const dp = easeOutCubic(clamp((ms - PH.rakhiEnd) / (PH.detailEnd - PH.rakhiEnd), 0, 1));
        const fade = ms > PH.shieldEnd - 200 ? 1 - easeInCubic(clamp((ms - (PH.shieldEnd - 200)) / 400, 0, 1)) : 1;
        ctx.save(); ctx.globalAlpha *= fade;
        drawRakhiArt(0, -20 * sc, rp, dp, now);
        for (const p of rakhiP) {
          const lp = clamp((rp - p.delay) / (1 - p.delay), 0, 1);
          const ep = easeOutCubic(lp);
          p.x = lerp(p.sx, p.tx, ep);
          p.y = lerp(p.sy, p.ty, ep);
          drawPt(p, ep * 0.85);
        }
        ctx.restore();
      }

      /* ─ Flash before shield ─ */
      if (ms > PH.detailEnd - 80 && ms < PH.detailEnd + 250) {
        const fp = 1 - Math.abs(ms - PH.detailEnd) / 250;
        const fa = Math.max(0, fp) * 0.45;
        const fg = ctx.createRadialGradient(0, -20 * sc, 0, 0, -20 * sc, 180 * sc);
        fg.addColorStop(0, `rgba(255,248,220,${fa})`);
        fg.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(0, -20 * sc, 180 * sc, 0, Math.PI * 2); ctx.fill();
      }

      /* ─ PHASE 11: Shield ─ */
      if (ms > PH.detailEnd && ms < PH.spreadEnd) {
        drawShield(0, -20 * sc, clamp((ms - PH.detailEnd) / (PH.shieldEnd - PH.detailEnd), 0, 1));
      }

      /* ─ PHASE 12: Spread particles ─ */
      if (ms > PH.shieldEnd && ms < PH.textEnd + 800) {
        const sp = easeOutCubic(clamp((ms - PH.shieldEnd) / (PH.spreadEnd - PH.shieldEnd), 0, 1));
        for (const p of spreadP) {
          const lp = clamp((sp - p.delay) / (1 - p.delay), 0, 1);
          const ep = easeOutCubic(lp);
          p.x = lerp(p.sx, p.tx, ep);
          p.y = lerp(p.sy, p.ty, ep);
          drawPt(p, ep * p.a * (1 - sp * 0.25));
        }
      }

      ctx.restore(); // center translate

      /* ─ PHASE 13-14: Text ─ */
      if (ms > PH.spreadEnd && ms < PH.fadeEnd) {
        const tp = easeOutCubic(clamp((ms - PH.spreadEnd) / (PH.textEnd - PH.spreadEnd), 0, 1));
        const gp = easeOutCubic(clamp((ms - PH.textEnd) / (PH.glowEnd - PH.textEnd), 0, 1));
        drawText(tp, gp, now);
      }

      ctx.restore(); // global alpha

      /* ─ Ambient particles ─ */
      const ambA = doneRef.current ? 1 : clamp((ms - PH.shieldEnd) / 2000, 0, 0.55) * gA;
      if (ambA > 0.008) {
        for (const p of ambRef.current) {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
          if (p.x < -10) p.x = W + 10;
          if (p.x > W + 10) p.x = -10;
          const g = Math.round(lerp(215, 140, p.hue));
          ctx.save();
          ctx.globalAlpha = p.a * ambA;
          ctx.shadowColor = `rgb(255,${g},0)`;
          ctx.shadowBlur = 5;
          ctx.fillStyle = `rgb(255,${g},0)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }

      /* ─ Completion ─ */
      if (ms >= PH.fadeEnd && !doneRef.current) {
        doneRef.current = true;
        setFinished(true);
        setTimeout(() => { if (mountedRef.current) onCompRef.current(); }, 350);
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [initAmb]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: finished ? 'none' : 'all',
      }}
    />
  );
}
