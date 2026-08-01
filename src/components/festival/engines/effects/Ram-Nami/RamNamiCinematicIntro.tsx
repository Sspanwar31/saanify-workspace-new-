import React, { useRef, useEffect } from 'react';

/* ═══════════════════ UTILITIES ═══════════════════ */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}
function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}
function rand(a: number, b: number): number {
  return Math.random() * (b - a) + a;
}
function randInt(a: number, b: number): number {
  return Math.floor(rand(a, b + 1));
}

function goldColor(shade: number, alpha = 1): string {
  const palette = [
    [74, 40, 0], [138, 90, 10], [197, 155, 39],
    [255, 179, 0], [255, 215, 0], [255, 224, 102], [255, 241, 168],
  ];
  const idx = clamp(shade, 0, 1) * (palette.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, palette.length - 1);
  const f = idx - lo;
  const r = Math.round(lerp(palette[lo][0], palette[hi][0], f));
  const g = Math.round(lerp(palette[lo][1], palette[hi][1], f));
  const b = Math.round(lerp(palette[lo][2], palette[hi][2], f));
  return alpha < 1
    ? `rgba(${r},${g},${b},${alpha})`
    : `rgb(${r},${g},${b})`;
}

/* ═══════════════════ TYPES ═══════════════════ */

interface GP {
  x: number; y: number; vx: number; vy: number;
  tx: number; ty: number; sz: number;
  br: number; gs: number; sp: number; si: number;
}
interface Dust {
  x: number; y: number; vx: number; vy: number;
  sz: number; a: number; life: number; ml: number;
}
interface Bird {
  x: number; y: number; spd: number;
  wp: number; ws: number; sz: number;
}
interface Diya {
  x: number; y: number; ph: number; spd: number;
  sz: number; br: number; dr: number;
}
interface Rocket {
  x: number; y: number; vy: number; ty: number;
  hue: number; on: boolean;
  trail: Array<{ x: number; y: number; a: number }>;
}
interface Spark {
  x: number; y: number; vx: number; vy: number;
  life: number; ml: number; hue: number;
  sat: number; lit: number; sz: number;
}
interface Layout {
  w: number; h: number; dpr: number; cx: number; cy: number;
  tx: number; ty: number; tw: number; th: number; fs: number;
}

/* ═══════════════════ COMPONENT ═══════════════════ */

interface Props {
  onComplete?: () => void;
}

const CinematicIntro: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const t0Ref = useRef(0);
  const doneRef = useRef(false);

  const maskCvs = useRef<HTMLCanvasElement | null>(null);
  const titleCvs = useRef<HTMLCanvasElement | null>(null);
  const grainCvs = useRef<HTMLCanvasElement | null>(null);

  const targets = useRef<Array<{ x: number; y: number }>>([]);
  const gParts = useRef<GP[]>([]);
  const dustArr = useRef<Dust[]>([]);
  const birdArr = useRef<Bird[]>([]);
  const diyaArr = useRef<Diya[]>([]);
  const rocketArr = useRef<Rocket[]>([]);
  const sparkArr = useRef<Spark[]>([]);

  const L = useRef<Layout>({
    w: 0, h: 0, dpr: 1, cx: 0, cy: 0,
    tx: 0, ty: 0, tw: 0, th: 0, fs: 130,
  });

  const FONT = '"Tiro Devanagari Hindi", serif';
  const T_TEXT = 'जय श्री राम';
  const S1_TEXT = 'आपको एवं आपके परिवार को';
  const S2_TEXT = 'राम नवमी की हार्दिक शुभकामनाएँ';

  /* ─── Build grain texture ─── */
  function buildGrain(w: number, h: number) {
    const c = document.createElement('canvas');
    const gw = Math.ceil(w / 2);
    const gh = Math.ceil(h / 2);
    c.width = gw; c.height = gh;
    const x = c.getContext('2d')!;
    const id = x.createImageData(gw, gh);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255;
      id.data[i] = v; id.data[i + 1] = v;
      id.data[i + 2] = v; id.data[i + 3] = 14;
    }
    x.putImageData(id, 0, 0);
    grainCvs.current = c;
  }

  /* ─── Build font mask & extract targets ─── */
  function buildMask() {
    const l = L.current;
    const dpr = l.dpr;
    const fs = l.fs;
    const mc = document.createElement('canvas');
    mc.width = Math.ceil(l.w * dpr);
    mc.height = Math.ceil(l.h * dpr);
    const mx = mc.getContext('2d')!;
    mx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mx.font = `${fs}px ${FONT}`;
    mx.textAlign = 'center';
    mx.textBaseline = 'middle';
    mx.fillStyle = '#fff';
    const titleY = l.cy - l.h * 0.02;
    mx.fillText(T_TEXT, l.cx, titleY);

    const met = mx.measureText(T_TEXT);
    const tw = met.width;
    const th = fs * 1.2;
    l.tx = l.cx - tw / 2;
    l.ty = titleY - th / 2;
    l.tw = tw;
    l.th = th;
    maskCvs.current = mc;

    // extract
    const id = mx.getImageData(0, 0, mc.width, mc.height);
    const d = id.data;
    const pts: Array<{ x: number; y: number }> = [];
    const step = Math.max(2, Math.round(3 * dpr));
    const x0 = Math.max(0, Math.round(l.tx * dpr));
    const y0 = Math.max(0, Math.round(l.ty * dpr));
    const x1 = Math.min(mc.width, Math.round((l.tx + tw) * dpr));
    const y1 = Math.min(mc.height, Math.round((l.ty + th) * dpr));

    for (let y = y0; y < y1; y += step) {
      for (let x = x0; x < x1; x += step) {
        if (d[(y * mc.width + x) * 4 + 3] > 128) {
          pts.push({ x: x / dpr, y: y / dpr });
        }
      }
    }
    const maxP = 4500;
    if (pts.length > maxP) {
      for (let i = pts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
      pts.length = maxP;
    }
    targets.current = pts;
  }

  /* ─── Init particles ─── */
  function initGoldParticles() {
    const l = L.current;
    const tg = targets.current;
    const arr: GP[] = [];
    for (let i = 0; i < tg.length; i++) {
      const t = tg[i];
      let ox: number, oy: number;
      const e = Math.random();
      if (e < 0.25) { ox = rand(0, l.w); oy = -60; }
      else if (e < 0.5) { ox = rand(0, l.w); oy = l.h + 60; }
      else if (e < 0.75) { ox = -60; oy = rand(0, l.h); }
      else { ox = l.w + 60; oy = rand(0, l.h); }
      arr.push({
        x: ox, y: oy, vx: 0, vy: 0,
        tx: t.x, ty: t.y,
        sz: rand(0.8, 2.8), br: rand(0.5, 1),
        gs: rand(0.3, 1), sp: rand(0, 2), si: rand(0.3, 1.5),
      });
    }
    gParts.current = arr;
  }

  function initDust(n: number) {
    const l = L.current;
    const a: Dust[] = [];
    for (let i = 0; i < n; i++) {
      a.push({
        x: rand(0, l.w), y: rand(0, l.h),
        vx: rand(-0.3, 0.3), vy: rand(-0.4, -0.05),
        sz: rand(0.5, 2), a: rand(0.1, 0.45),
        life: rand(0, 5), ml: rand(3, 8),
      });
    }
    dustArr.current = a;
  }

  function initBirds() {
    const l = L.current;
    const a: Bird[] = [];
    for (let i = 0; i < 7; i++) {
      a.push({
        x: rand(-100, l.w * 0.3),
        y: rand(l.h * 0.05, l.h * 0.22),
        spd: rand(0.5, 1.4), wp: rand(0, 6.28),
        ws: rand(3, 6), sz: rand(3, 7),
      });
    }
    birdArr.current = a;
  }

  function initDiyas() {
    const l = L.current;
    const a: Diya[] = [];
    const wy = l.h * 0.65;
    for (let i = 0; i < 14; i++) {
      a.push({
        x: rand(l.w * 0.08, l.w * 0.92),
        y: wy + rand(-4, 10),
        ph: rand(0, 6.28), spd: rand(2, 5),
        sz: rand(5, 11), br: rand(0.6, 1), dr: rand(-0.15, 0.15),
      });
    }
    diyaArr.current = a;
  }

  /* ═══════════════════ DRAW FUNCTIONS ═══════════════════ */

  function drawDarkBg(ctx: CanvasRenderingContext2D, l: Layout) {
    const g = ctx.createRadialGradient(l.cx, l.cy, 0, l.cx, l.cy, l.w * 0.7);
    g.addColorStop(0, '#120702');
    g.addColorStop(0.6, '#080401');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.w, l.h);
  }

  function drawSunriseOverlay(ctx: CanvasRenderingContext2D, w: number, l: Layout, time: number) {
    if (w <= 0) return;
    ctx.save();
    ctx.globalAlpha = w;
    // sky
    const sg = ctx.createLinearGradient(0, 0, 0, l.h);
    sg.addColorStop(0, '#1a0a02');
    sg.addColorStop(0.35, '#8a3a08');
    sg.addColorStop(0.55, '#c86810');
    sg.addColorStop(0.65, '#dc8014');
    sg.addColorStop(0.75, '#b05010');
    sg.addColorStop(1, '#1a0a02');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, l.w, l.h);

    // sun disc glow
    const sx = l.cx, sy = l.h * 0.6;
    const sr = l.w * 0.35;
    const sng = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sng.addColorStop(0, 'rgba(255,190,60,0.7)');
    sng.addColorStop(0.25, 'rgba(255,130,30,0.35)');
    sng.addColorStop(0.55, 'rgba(200,70,15,0.12)');
    sng.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sng;
    ctx.fillRect(0, 0, l.w, l.h);

    // god rays
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI + Math.sin(time * 0.4 + i) * 0.04;
      const rlen = l.h * (0.65 + Math.sin(time * 0.8 + i * 1.7) * 0.12);
      const rw = 0.018 + Math.sin(time * 0.3 + i * 0.9) * 0.008;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(ang - rw) * rlen, sy + Math.sin(ang - rw) * rlen);
      ctx.lineTo(sx + Math.cos(ang + rw) * rlen, sy + Math.sin(ang + rw) * rlen);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,165,45,0.035)';
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // haze
    const hz = ctx.createLinearGradient(0, l.h * 0.5, 0, l.h);
    hz.addColorStop(0, 'rgba(180,100,30,0)');
    hz.addColorStop(1, 'rgba(180,100,30,0.12)');
    ctx.fillStyle = hz;
    ctx.fillRect(0, 0, l.w, l.h);
    ctx.restore();
  }

  function drawDivineLight(ctx: CanvasRenderingContext2D, intensity: number, l: Layout, time: number) {
    if (intensity <= 0) return;
    ctx.save();
    ctx.globalAlpha = intensity;
    const pulse = 0.8 + Math.sin(time * 1.2) * 0.2;
    const g = ctx.createRadialGradient(l.cx, 0, 0, l.cx, l.h * 0.5, l.w * 0.5 * pulse);
    g.addColorStop(0, 'rgba(255,200,80,0.12)');
    g.addColorStop(0.3, 'rgba(255,160,50,0.05)');
    g.addColorStop(0.7, 'rgba(200,100,20,0.015)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.w, l.h);

    // subtle beam
    const bw = l.w * 0.08;
    const bg = ctx.createLinearGradient(l.cx - bw, 0, l.cx + bw, 0);
    bg.addColorStop(0, 'rgba(255,200,80,0)');
    bg.addColorStop(0.4, 'rgba(255,200,80,0.03)');
    bg.addColorStop(0.5, 'rgba(255,220,120,0.05)');
    bg.addColorStop(0.6, 'rgba(255,200,80,0.03)');
    bg.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(l.cx - bw, 0, bw * 2, l.h * 0.7);
    ctx.restore();
  }

  function drawTemple(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;
    const by = l.h * 0.62;
    const cx = l.cx;
    const bw = l.w * 0.48;
    const bh = l.h * 0.14;

    // warm glow
    const tg = ctx.createRadialGradient(cx, by - bh * 0.5, 0, cx, by - bh * 0.5, bw * 0.8);
    tg.addColorStop(0, 'rgba(255,180,60,0.12)');
    tg.addColorStop(0.5, 'rgba(255,120,30,0.04)');
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg;
    ctx.fillRect(cx - bw, by - bh * 2.5, bw * 2, bh * 4);

    // base
    ctx.fillStyle = '#1a0e05';
    ctx.fillRect(cx - bw / 2, by - bh, bw, bh);
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 5; i++) {
      const ly = by - bh + (bh / 5) * i;
      ctx.beginPath(); ctx.moveTo(cx - bw / 2, ly); ctx.lineTo(cx + bw / 2, ly); ctx.stroke();
    }

    // door
    const dw = bw * 0.11;
    const dh = bh * 0.7;
    ctx.fillStyle = '#0d0603';
    ctx.beginPath();
    ctx.arc(cx, by - dh, dw / 2, Math.PI, 0);
    ctx.lineTo(cx + dw / 2, by);
    ctx.lineTo(cx - dw / 2, by);
    ctx.closePath();
    ctx.fill();

    // shikhars
    const shData = [
      { rx: -0.35, h: 0.26, w: 0.055 },
      { rx: -0.17, h: 0.36, w: 0.075 },
      { rx: 0, h: 0.48, w: 0.095 },
      { rx: 0.17, h: 0.36, w: 0.075 },
      { rx: 0.35, h: 0.26, w: 0.055 },
    ];
    for (const s of shData) {
      const sx = cx + bw * s.rx;
      const sy = by - bh;
      const sh = bh * s.h;
      const sw = bw * s.w;

      ctx.beginPath();
      ctx.moveTo(sx - sw, sy);
      ctx.quadraticCurveTo(sx - sw * 0.7, sy - sh * 0.5, sx, sy - sh);
      ctx.quadraticCurveTo(sx + sw * 0.7, sy - sh * 0.5, sx + sw, sy);
      ctx.closePath();
      const sg = ctx.createLinearGradient(sx - sw, sy, sx + sw, sy);
      sg.addColorStop(0, '#150a04');
      sg.addColorStop(0.35, '#2a1a0a');
      sg.addColorStop(0.55, '#352210');
      sg.addColorStop(0.75, '#2a1a0a');
      sg.addColorStop(1, '#150a04');
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,180,80,0.12)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // kalash
      ctx.beginPath();
      ctx.ellipse(sx, sy - sh - 3, sw * 0.28, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#c59b27';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, sy - sh - 10);
      ctx.lineTo(sx - 1.5, sy - sh - 3);
      ctx.lineTo(sx + 1.5, sy - sh - 3);
      ctx.closePath();
      ctx.fillStyle = '#ffd700';
      ctx.fill();

      // saffron flag
      const fw = Math.sin(time * 2.2 + s.rx * 12) * 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy - sh - 10);
      ctx.lineTo(sx + 14, sy - sh - 13 + fw);
      ctx.lineTo(sx, sy - sh - 18);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,140,0,0.65)';
      ctx.fill();
    }

    // bands
    ctx.fillStyle = '#1a0e05';
    ctx.fillRect(cx - bw * 0.41, by - bh - bh * 0.07, bw * 0.82, bh * 0.07);
    ctx.fillRect(cx - bw * 0.37, by - bh - bh * 0.14, bw * 0.74, bh * 0.07);

    // small domes
    for (const dx of [-0.26, -0.085, 0.085, 0.26]) {
      const domX = cx + bw * dx;
      const domY = by - bh - bh * 0.14;
      ctx.beginPath();
      ctx.arc(domX, domY, bw * 0.022, Math.PI, 0);
      ctx.fillStyle = '#2a1a0a';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRiver(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;
    const wt = l.h * 0.65;
    const wb = l.h * 0.85;

    const wg = ctx.createLinearGradient(0, wt, 0, wb);
    wg.addColorStop(0, 'rgba(18,35,45,0.55)');
    wg.addColorStop(0.5, 'rgba(12,25,35,0.65)');
    wg.addColorStop(1, 'rgba(8,18,28,0.75)');
    ctx.fillStyle = wg;
    ctx.fillRect(0, wt, l.w, wb - wt);

    ctx.strokeStyle = 'rgba(255,180,80,0.06)';
    ctx.lineWidth = 0.8;
    for (let r = 0; r < 7; r++) {
      const wy = wt + (wb - wt) * (r / 7) + 4;
      ctx.beginPath();
      for (let x = 0; x < l.w; x += 4) {
        const y = wy + Math.sin(x * 0.018 + time * 1.3 + r * 1.3) * 1.8;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // shimmer
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 25; i++) {
      const sx = (Math.sin(time * 0.6 + i * 3.9) * 0.5 + 0.5) * l.w;
      const sy = wt + (Math.sin(time * 0.45 + i * 2.3) * 0.5 + 0.5) * (wb - wt);
      ctx.beginPath();
      ctx.arc(sx, sy, rand(0.8, 2.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,200,100,${rand(0.015, 0.04)})`;
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function drawBirds(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number, dt: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;
    ctx.strokeStyle = '#1a0e05';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (const b of birdArr.current) {
      b.x += b.spd * dt * 60;
      b.wp += b.ws * dt;
      if (b.x > l.w + 120) { b.x = -120; b.y = rand(l.h * 0.05, l.h * 0.22); }
      const wing = Math.sin(b.wp) * b.sz * 0.55;
      ctx.beginPath();
      ctx.moveTo(b.x - b.sz, b.y + wing);
      ctx.quadraticCurveTo(b.x - b.sz * 0.3, b.y - b.sz * 0.15, b.x, b.y);
      ctx.quadraticCurveTo(b.x + b.sz * 0.3, b.y - b.sz * 0.15, b.x + b.sz, b.y + wing);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDiyas(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number, dt: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;
    for (const d of diyaArr.current) {
      d.x += d.dr * dt * 60;
      d.ph += d.spd * dt;
      if (d.x < l.w * 0.05) d.dr = Math.abs(d.dr);
      if (d.x > l.w * 0.95) d.dr = -Math.abs(d.dr);
      const fl = 0.7 + Math.sin(d.ph) * 0.12 + Math.sin(d.ph * 3.7) * 0.1 + Math.sin(d.ph * 7.1) * 0.05;

      // bowl
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + d.sz * 0.3, d.sz, d.sz * 0.32, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7a3b10';
      ctx.fill();
      ctx.strokeStyle = '#a05828';
      ctx.lineWidth = 0.4;
      ctx.stroke();

      // oil
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + d.sz * 0.2, d.sz * 0.65, d.sz * 0.18, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,215,0,0.5)';
      ctx.fill();

      // flame
      const fh = d.sz * 1.1 * fl;
      const fw = d.sz * 0.32 * fl;
      const fg = ctx.createRadialGradient(d.x, d.y - fh * 0.3, 0, d.x, d.y, fh);
      fg.addColorStop(0, 'rgba(255,255,200,0.85)');
      fg.addColorStop(0.3, 'rgba(255,200,50,0.65)');
      fg.addColorStop(0.7, 'rgba(255,120,20,0.25)');
      fg.addColorStop(1, 'rgba(255,60,10,0)');
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - fh);
      ctx.quadraticCurveTo(d.x + fw, d.y - fh * 0.4, d.x + fw * 0.5, d.y);
      ctx.quadraticCurveTo(d.x, d.y - fh * 0.1, d.x - fw * 0.5, d.y);
      ctx.quadraticCurveTo(d.x - fw, d.y - fh * 0.4, d.x, d.y - fh);
      ctx.fillStyle = fg;
      ctx.fill();

      // glow
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gg = ctx.createRadialGradient(d.x, d.y - fh * 0.3, 0, d.x, d.y - fh * 0.3, d.sz * 3.5);
      gg.addColorStop(0, `rgba(255,180,50,${0.08 * d.br * fl})`);
      gg.addColorStop(1, 'rgba(255,100,20,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(d.x, d.y - fh * 0.3, d.sz * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function updateFireworks(l: Layout, dt: number, time: number) {
    const rk = rocketArr.current;
    const sp = sparkArr.current;
    if (Math.random() < dt * 1.8) {
      rk.push({
        x: rand(l.w * 0.1, l.w * 0.9), y: l.h + 10,
        vy: rand(-4.5, -6.5), ty: rand(l.h * 0.08, l.h * 0.38),
        hue: randInt(0, 360), on: true, trail: [],
      });
    }
    for (let i = rk.length - 1; i >= 0; i--) {
      const r = rk[i];
      if (!r.on) { rk.splice(i, 1); continue; }
      r.trail.push({ x: r.x, y: r.y, a: 1 });
      if (r.trail.length > 12) r.trail.shift();
      for (const tp of r.trail) tp.a *= 0.9;
      r.y += r.vy * dt * 60;
      r.x += Math.sin(time * 11 + i * 3) * 0.25;
      if (r.y <= r.ty) {
        r.on = false;
        const n = randInt(45, 85);
        for (let j = 0; j < n; j++) {
          const a = rand(0, Math.PI * 2);
          const s = rand(0.8, 4.5);
          sp.push({
            x: r.x, y: r.y,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life: rand(0.5, 1.6), ml: rand(0.5, 1.6),
            hue: (r.hue + rand(-35, 35)) % 360,
            sat: rand(60, 100), lit: rand(50, 80),
            sz: rand(0.8, 2.8),
          });
        }
      }
    }
  }

  function drawRockets(ctx: CanvasRenderingContext2D, op: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;
    for (const r of rocketArr.current) {
      if (!r.on) continue;
      for (const tp of r.trail) {
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,100,${tp.a * 0.4})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(r.x, r.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe0a0';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSparks(ctx: CanvasRenderingContext2D, op: number, dt: number) {
    if (op <= 0) return;
    const sp = sparkArr.current;
    ctx.save();
    ctx.globalAlpha = op;
    for (let i = sp.length - 1; i >= 0; i--) {
      const s = sp[i];
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;
      s.vy += 0.028 * dt * 60;
      s.vx *= 0.992;
      s.vy *= 0.992;
      s.life -= dt;
      if (s.life <= 0) { sp.splice(i, 1); continue; }
      const lr = s.life / s.ml;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.sz * lr, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue},${s.sat}%,${s.lit}%,${lr})`;
      ctx.fill();
      if (lr > 0.35) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.sz * 2.5 * lr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},${s.sat}%,${s.lit}%,${lr * 0.08})`;
        ctx.fill();
      }
    }
    // cap
    if (sp.length > 2000) sp.splice(0, sp.length - 2000);
    ctx.restore();
  }

  function drawDust(ctx: CanvasRenderingContext2D, op: number, l: Layout, dt: number, gold: boolean) {
    if (op <= 0) return;
    ctx.save();
    for (const d of dustArr.current) {
      d.x += d.vx * dt * 60;
      d.y += d.vy * dt * 60;
      d.life += dt;
      if (d.life > d.ml || d.y < -10 || d.x < -10 || d.x > l.w + 10) {
        d.x = rand(0, l.w);
        d.y = rand(l.h * 0.5, l.h + 10);
        d.life = 0;
        d.ml = rand(3, 8);
        d.a = rand(0.1, 0.45);
      }
      const fi = smoothstep(0, 0.5, d.life);
      const fo = smoothstep(0, 0.5, d.ml - d.life);
      const a = d.a * fi * fo * op;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.sz, 0, Math.PI * 2);
      ctx.fillStyle = gold
        ? `rgba(255,210,120,${a})`
        : `rgba(255,200,100,${a * 0.7})`;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGoldParticles(ctx: CanvasRenderingContext2D, op: number, conv: number, time: number, dt: number) {
    if (op <= 0) return;
    const ps = gParts.current;
    ctx.save();
    ctx.globalAlpha = op;
    for (const p of ps) {
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const force = conv * conv * 4.5;
      const attr = force / (1 + dist * 0.008);
      p.vx += (dx / dist) * attr * dt * 60;
      p.vy += (dy / dist) * attr * dt * 60;
      const turb = Math.max(0, 1 - conv * 0.85);
      p.vx += Math.sin(time * 2.1 + p.tx * 0.08) * turb * 0.6;
      p.vy += Math.cos(time * 1.8 + p.ty * 0.08) * turb * 0.6;
      p.vx *= 0.91;
      p.vy *= 0.91;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.sp += dt;
      let sparkle = 0;
      if (p.sp > p.si) { sparkle = 1; p.sp = 0; p.si = rand(0.3, 1.5); }

      const sz = p.sz * (0.85 + 0.15 * conv);
      const al = p.br * (0.65 + 0.35 * conv);
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fillStyle = goldColor(p.gs, al);
      ctx.fill();
      if (sparkle > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,220,${0.4 * al})`;
        ctx.fill();
      }
      if (sz > 1.8 && conv > 0.5) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 3, 0, Math.PI * 2);
        ctx.fillStyle = goldColor(p.gs, al * 0.06);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawGoldTitle(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    const tc = titleCvs.current;
    if (!tc) return;
    const fs = l.fs;
    const x = l.cx;
    const y = l.cy - l.h * 0.02;

    // Draw outline on MAIN canvas
    ctx.save();
    ctx.globalAlpha = op;
    ctx.font = `${fs}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // deep shadow outline
    ctx.strokeStyle = '#1a0a01';
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.strokeText(T_TEXT, x, y + 1.5);
    // main chocolate outline
    ctx.strokeStyle = '#261102';
    ctx.lineWidth = 6;
    ctx.strokeText(T_TEXT, x, y);
    ctx.restore();

    // Draw filled title on OFFSCREEN canvas
    const tctx = tc.getContext('2d')!;
    tctx.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
    tctx.clearRect(0, 0, l.w, l.h);

    const met = tctx.measureText(T_TEXT);
    const hw = met.width / 2;
    const topY = y - fs * 0.45;
    const botY = y + fs * 0.45;

    // gold gradient fill
    const gg = tctx.createLinearGradient(x, topY, x, botY);
    gg.addColorStop(0, '#FFF1A8');
    gg.addColorStop(0.12, '#FFE066');
    gg.addColorStop(0.28, '#FFD700');
    gg.addColorStop(0.48, '#FFB300');
    gg.addColorStop(0.68, '#C59B27');
    gg.addColorStop(0.84, '#8A5A0A');
    gg.addColorStop(1, '#4A2800');
    tctx.font = `${fs}px ${FONT}`;
    tctx.textAlign = 'center';
    tctx.textBaseline = 'middle';
    tctx.fillStyle = gg;
    tctx.fillText(T_TEXT, x, y);

    // moving reflection sweep (source-atop)
    tctx.globalCompositeOperation = 'source-atop';
    const swX = x + Math.sin(time * 0.4) * hw * 1.1;
    const swG = tctx.createLinearGradient(swX - 90, 0, swX + 90, 0);
    swG.addColorStop(0, 'rgba(255,255,255,0)');
    swG.addColorStop(0.35, 'rgba(255,255,220,0.1)');
    swG.addColorStop(0.5, 'rgba(255,255,240,0.15)');
    swG.addColorStop(0.65, 'rgba(255,255,220,0.1)');
    swG.addColorStop(1, 'rgba(255,255,255,0)');
    tctx.fillStyle = swG;
    tctx.fillRect(x - hw - 120, topY - 10, met.width + 240, botY - topY + 20);

    // micro glitter
    for (let i = 0; i < 18; i++) {
      const gx = x - hw + Math.random() * met.width;
      const gy = topY + Math.random() * (botY - topY);
      tctx.beginPath();
      tctx.arc(gx, gy, rand(0.3, 0.9), 0, Math.PI * 2);
      tctx.fillStyle = `rgba(255,255,230,${rand(0.15, 0.5)})`;
      tctx.fill();
    }

    // tiny specular highlights
    const specs = [
      { rx: -0.32, ry: -0.22 }, { rx: 0.08, ry: -0.28 }, { rx: 0.38, ry: -0.18 },
    ];
    for (const sp of specs) {
      const sx = x + sp.rx * met.width;
      const sy = y + sp.ry * fs;
      const sg = tctx.createRadialGradient(sx, sy, 0, sx, sy, 3.5);
      sg.addColorStop(0, 'rgba(255,255,240,0.55)');
      sg.addColorStop(1, 'rgba(255,255,240,0)');
      tctx.fillStyle = sg;
      tctx.fillRect(sx - 4, sy - 4, 8, 8);
    }
    tctx.globalCompositeOperation = 'source-over';

    // composite onto main canvas
    ctx.save();
    ctx.globalAlpha = op;
    ctx.resetTransform();
    ctx.drawImage(tc, 0, 0);
    ctx.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
    ctx.restore();

    // subtle warm glow BEHIND text (on main canvas, very controlled)
    ctx.save();
    ctx.globalAlpha = op * 0.07;
    ctx.globalCompositeOperation = 'lighter';
    const glR = Math.max(met.width, fs) * 0.7;
    const glG = ctx.createRadialGradient(x, y, 0, x, y, glR);
    glG.addColorStop(0, '#FFB300');
    glG.addColorStop(0.5, 'rgba(255,179,0,0.3)');
    glG.addColorStop(1, 'rgba(255,179,0,0)');
    ctx.fillStyle = glG;
    ctx.beginPath();
    ctx.ellipse(x, y, glR, glR * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTilak(ctx: CanvasRenderingContext2D, op: number, l: Layout) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op * 0.85;
    const cx = l.cx;
    const y = l.ty - l.fs * 0.15;
    const sz = l.fs * 0.12;

    // U shape
    ctx.beginPath();
    ctx.arc(cx, y + sz * 0.5, sz * 0.5, Math.PI, 0, false);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = Math.max(1.5, sz * 0.12);
    ctx.lineCap = 'round';
    ctx.stroke();

    // center dot
    ctx.beginPath();
    ctx.arc(cx, y + sz * 0.1, sz * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    // subtle glow
    const gg = ctx.createRadialGradient(cx, y + sz * 0.3, 0, cx, y + sz * 0.3, sz * 1.2);
    gg.addColorStop(0, 'rgba(255,215,0,0.08)');
    gg.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(cx, y + sz * 0.3, sz * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSwash(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op * 0.7;
    const startX = l.tx + l.tw * 0.75;
    const y = l.ty + l.th + l.fs * 0.05;
    const sw = l.tw * 0.35;
    const sh = l.fs * 0.08;

    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.quadraticCurveTo(startX + sw * 0.3, y + sh * 1.5, startX + sw * 0.5, y + sh * 0.8);
    ctx.quadraticCurveTo(startX + sw * 0.7, y + sh * 0.2, startX + sw, y + sh * 0.5);
    ctx.strokeStyle = '#C59B27';
    ctx.lineWidth = Math.max(1, l.fs * 0.012);
    ctx.lineCap = 'round';
    ctx.stroke();

    // end curl
    ctx.beginPath();
    ctx.arc(startX + sw, y + sh * 0.5, l.fs * 0.015, 0, Math.PI * 1.5);
    ctx.strokeStyle = '#8A5A0A';
    ctx.lineWidth = Math.max(0.8, l.fs * 0.008);
    ctx.stroke();

    // sparkle on swash
    const sparkT = (Math.sin(time * 1.5) * 0.5 + 0.5);
    const spX = startX + sw * sparkT;
    const spY = y + sh * (1 - sparkT) * 0.8;
    const spG = ctx.createRadialGradient(spX, spY, 0, spX, spY, 4);
    spG.addColorStop(0, `rgba(255,241,168,${0.5 * op})`);
    spG.addColorStop(1, 'rgba(255,241,168,0)');
    ctx.fillStyle = spG;
    ctx.beginPath();
    ctx.arc(spX, spY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawStarburst(ctx: CanvasRenderingContext2D, cx: number, cy: number, sz: number, alpha: number) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255,241,168,0.7)';
    ctx.lineWidth = 0.8;
    const arms = 4;
    for (let i = 0; i < arms; i++) {
      const ang = (i / arms) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * sz, cy + Math.sin(ang) * sz);
      ctx.stroke();
    }
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz * 0.4);
    cg.addColorStop(0, 'rgba(255,255,230,0.6)');
    cg.addColorStop(1, 'rgba(255,255,230,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, sz * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStarbursts(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    const fs = l.fs;
    const y = l.cy - l.h * 0.02;
    const positions = [
      { rx: -0.38, ry: -0.3 },
      { rx: 0.15, ry: -0.35 },
      { rx: 0.42, ry: -0.2 },
    ];
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const pulse = 0.5 + Math.sin(time * 1.2 + i * 2.5) * 0.5;
      const sx = l.cx + p.rx * l.tw;
      const sy = y + p.ry * fs;
      drawStarburst(ctx, sx, sy, fs * 0.06 * (0.7 + pulse * 0.3), op * (0.3 + pulse * 0.4));
    }
  }

  function drawDivider(ctx: CanvasRenderingContext2D, y: number, op: number, l: Layout) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op * 0.8;
    const halfW = l.tw * 0.4;
    const cx = l.cx;
    const lw = Math.max(0.5, l.fs * 0.005);

    // left line
    const lg = ctx.createLinearGradient(cx - halfW, 0, cx - 8, 0);
    lg.addColorStop(0, 'rgba(197,155,39,0)');
    lg.addColorStop(0.3, 'rgba(197,155,39,0.6)');
    lg.addColorStop(1, 'rgba(255,215,0,0.8)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, y);
    ctx.lineTo(cx - 8, y);
    ctx.stroke();

    // right line
    const rg = ctx.createLinearGradient(cx + 8, 0, cx + halfW, 0);
    rg.addColorStop(0, 'rgba(255,215,0,0.8)');
    rg.addColorStop(0.7, 'rgba(197,155,39,0.6)');
    rg.addColorStop(1, 'rgba(197,155,39,0)');
    ctx.strokeStyle = rg;
    ctx.beginPath();
    ctx.moveTo(cx + 8, y);
    ctx.lineTo(cx + halfW, y);
    ctx.stroke();

    // center diamond
    const ds = Math.max(2.5, l.fs * 0.025);
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-ds / 2, -ds / 2, ds, ds);
    ctx.restore();

    // glowing tips
    for (const tx of [cx - halfW * 0.85, cx + halfW * 0.85]) {
      const tg = ctx.createRadialGradient(tx, y, 0, tx, y, 4);
      tg.addColorStop(0, 'rgba(255,215,0,0.3)');
      tg.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(tx, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGreeting(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;
    const fs = l.fs;
    const titleBottom = l.ty + l.th;
    const gap = fs * 0.2;

    // divider 1
    const div1Y = titleBottom + gap * 0.6;
    drawDivider(ctx, div1Y, smoothstep(15.0, 15.8, time), l);

    // sub1
    const s1Size = Math.max(16, fs * 0.28);
    const s1Y = div1Y + gap * 0.9;
    ctx.font = `${s1Size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8d5a0';
    ctx.globalAlpha = op * smoothstep(15.2, 16.0, time);
    ctx.fillText(S1_TEXT, l.cx, s1Y);

    // sub2
    const s2Size = Math.max(18, fs * 0.32);
    const s2Y = s1Y + s1Size * 1.2;

    // sub2 glow (very subtle)
    ctx.globalAlpha = op * smoothstep(15.5, 16.5, time) * 0.08;
    ctx.globalCompositeOperation = 'lighter';
    ctx.font = `${s2Size}px ${FONT}`;
    ctx.fillStyle = '#FFB300';
    ctx.fillText(S2_TEXT, l.cx, s2Y);
    ctx.globalCompositeOperation = 'source-over';

    // sub2 text
    ctx.globalAlpha = op * smoothstep(15.5, 16.5, time);
    const s2g = ctx.createLinearGradient(l.cx - l.tw * 0.4, s2Y, l.cx + l.tw * 0.4, s2Y);
    s2g.addColorStop(0, '#C59B27');
    s2g.addColorStop(0.3, '#FFD700');
    s2g.addColorStop(0.5, '#FFE066');
    s2g.addColorStop(0.7, '#FFD700');
    s2g.addColorStop(1, '#C59B27');
    ctx.fillStyle = s2g;
    ctx.fillText(S2_TEXT, l.cx, s2Y);

    // divider 2
    const div2Y = s2Y + s2Size * 0.8;
    drawDivider(ctx, div2Y, smoothstep(15.8, 16.5, time), l);

    ctx.restore();
  }

  function drawVignette(ctx: CanvasRenderingContext2D, l: Layout) {
    const g = ctx.createRadialGradient(l.cx, l.cy, l.w * 0.25, l.cx, l.cy, l.w * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.w, l.h);
  }

  function drawGrainOverlay(ctx: CanvasRenderingContext2D, l: Layout) {
    const gc = grainCvs.current;
    if (!gc) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(gc, 0, 0, l.w, l.h);
    ctx.restore();
  }

  /* ═══════════════════ MAIN RENDER ═══════════════════ */

  function render(ts: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const l = L.current;
    const dpr = l.dpr;
    const time = (ts - t0Ref.current) / 1000;

    // reset transform & clear
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, l.w, l.h);

    const dt = Math.min(0.05, 1 / 60);

    /* ─── Scene opacities ─── */
    const bgWarmth = 1 - smoothstep(9.8, 11.5, time);
    const divineLightI = smoothstep(10.5, 12.0, time) * (1 - smoothstep(14.5, 16.0, time));
    const templeOp = smoothstep(2.5, 3.5, time) * (1 - smoothstep(10.2, 11.5, time));
    const riverOp = templeOp;
    const birdOp = templeOp * (1 - smoothstep(9.0, 10.2, time));
    const diyaOp = smoothstep(5.5, 6.5, time) * (1 - smoothstep(10.2, 11.5, time));
    const fwOp = smoothstep(5.5, 6.5, time) * (1 - smoothstep(10.2, 11.5, time));

    const pStart = 11.5;
    const pFadeIn = smoothstep(pStart, pStart + 0.3, time);
    const pFadeOut = 1 - smoothstep(13.5, 15.0, time);
    const particleOp = pFadeIn * pFadeOut;
    const convergence = clamp((time - pStart) / 2.0, 0, 1);
    const convergenceEased = easeInOutCubic(convergence);

    const titleOp = smoothstep(13.5, 15.0, time);
    const greetingOp = smoothstep(15.0, 16.0, time);

    const dustOp = smoothstep(0, 0.3, time) * (1 - smoothstep(18.5, 19.5, time));
    const isGoldDust = time > 10.5;

    /* ─── 1. Background ─── */
    drawDarkBg(ctx, l);
    if (bgWarmth > 0) drawSunriseOverlay(ctx, bgWarmth, l, time);
    drawDivineLight(ctx, divineLightI, l, time);

    /* ─── 2. Atmosphere ─── */
    drawDust(ctx, dustOp, l, dt, isGoldDust);

    /* ─── 3. Scene elements ─── */
    drawRiver(ctx, riverOp, l, time);
    drawTemple(ctx, templeOp, l, time);
    drawBirds(ctx, birdOp, l, time, dt);
    drawDiyas(ctx, diyaOp, l, time, dt);

    if (fwOp > 0) {
      updateFireworks(l, dt, time);
      drawRockets(ctx, fwOp);
      drawSparks(ctx, fwOp, dt);
    }

    /* ─── 4. Central glow during particle convergence ─── */
    if (convergenceEased > 0.2) {
      const gi = (convergenceEased - 0.2) / 0.8;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const cg = ctx.createRadialGradient(l.cx, l.cy - l.h * 0.02, 0, l.cx, l.cy - l.h * 0.02, l.tw * 0.6);
      cg.addColorStop(0, `rgba(255,180,50,${0.04 * gi})`);
      cg.addColorStop(1, 'rgba(255,180,50,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, l.w, l.h);
      ctx.restore();
    }

    /* ─── 5. Gold particles ─── */
    drawGoldParticles(ctx, particleOp, convergenceEased, time, dt);

    /* ─── 6. Title ─── */
    drawGoldTitle(ctx, titleOp, l, time);
    drawTilak(ctx, titleOp, l);
    drawSwash(ctx, titleOp, l, time);
    drawStarbursts(ctx, titleOp, l, time);

    /* ─── 7. Greeting ─── */
    drawGreeting(ctx, greetingOp, l, time);

    /* ─── 8. Post-processing ─── */
    drawVignette(ctx, l);
    drawGrainOverlay(ctx, l);

    /* ─── Continue or complete ─── */
    if (time < 20.0) {
      rafRef.current = requestAnimationFrame(render);
    } else if (!doneRef.current) {
      doneRef.current = true;
      onComplete?.();
    }
  }

  /* ═══════════════════ INIT EFFECT ═══════════════════ */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const fs = Math.max(50, Math.min(130, w * 0.09));

    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const l = L.current;
    l.w = w; l.h = h; l.dpr = dpr;
    l.cx = w / 2; l.cy = h / 2;
    l.fs = fs;

    // Build grain immediately
    buildGrain(w, h);

    // Init scene elements
    initDust(80);
    initBirds();
    initDiyas();

    // Create title offscreen canvas
    const tc = document.createElement('canvas');
    tc.width = Math.ceil(w * dpr);
    tc.height = Math.ceil(h * dpr);
    titleCvs.current = tc;

    // Load font
    const linkEl = document.createElement('link');
    linkEl.href = 'https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi&display=swap';
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);

    const start = () => {
      buildMask();
      initGoldParticles();
      t0Ref.current = performance.now();
      rafRef.current = requestAnimationFrame(render);
    };

    // Wait for font or timeout
    document.fonts.load(`${fs}px "Tiro Devanagari Hindi"`).then(start).catch(start);
    const timeout = setTimeout(start, 3500);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeout);
      if (linkEl.parentNode) linkEl.parentNode.removeChild(linkEl);
      doneRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══════════════════ JSX ═══════════════════ */

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        background: '#000',
      }}
    />
  );
};

export default CinematicIntro;
