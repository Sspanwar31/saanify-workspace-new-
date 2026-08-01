import React, { useRef, useEffect } from 'react';

/* ═══════════════════ UTILITIES ═══════════════════ */

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return v < lo ? lo : v > hi ? hi : v; }
function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
function easeOutCubic(t: number) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
function easeInOutCubic(t: number) {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}
function rand(a: number, b: number) { return Math.random() * (b - a) + a; }
function randInt(a: number, b: number) { return Math.floor(rand(a, b + 1)); }

function goldColor(shade: number, alpha = 1): string {
  const p = [[74,40,0],[138,90,10],[197,155,39],[255,179,0],[255,215,0],[255,224,102],[255,241,168]];
  const idx = clamp(shade, 0, 1) * (p.length - 1);
  const lo = Math.floor(idx), hi = Math.min(lo + 1, p.length - 1), f = idx - lo;
  const r = Math.round(lerp(p[lo][0], p[hi][0], f));
  const g = Math.round(lerp(p[lo][1], p[hi][1], f));
  const b = Math.round(lerp(p[lo][2], p[hi][2], f));
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

/* ═══════════════════ TYPES ═══════════════════ */

interface GP { x:number;y:number;vx:number;vy:number;tx:number;ty:number;sz:number;br:number;gs:number;sp:number;si:number; }
interface DustP { x:number;y:number;vx:number;vy:number;sz:number;a:number;life:number;ml:number; }
interface StarP { x:number;y:number;sz:number;br:number;tw:number;ts:number; }
interface Bird { x:number;y:number;spd:number;wp:number;ws:number;sz:number; }
interface Diya { x:number;y:number;ph:number;spd:number;sz:number;br:number;dr:number; }
interface Rocket { x:number;y:number;vy:number;ty:number;hue:number;on:boolean;trail:Array<{x:number;y:number;a:number}>;type:number; }
interface Spark { x:number;y:number;vx:number;vy:number;life:number;ml:number;hue:number;sat:number;lit:number;sz:number; }
interface Cloud { x:number;y:number;w:number;h:number;spd:number;blobs:number[]; }
interface Layout { w:number;h:number;dpr:number;cx:number;cy:number;tx:number;ty:number;tw:number;th:number;fs:number; }

/* ═══════════════════ COMPONENT ═══════════════════ */

interface Props { onComplete?: () => void; }

const CinematicIntro: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const t0Ref = useRef(0);
  const doneRef = useRef(false);

  const maskCvs = useRef<HTMLCanvasElement | null>(null);
  const titleCvs = useRef<HTMLCanvasElement | null>(null);
  const grainCvs = useRef<HTMLCanvasElement | null>(null);
  const templeCvs = useRef<HTMLCanvasElement | null>(null);

  const targets = useRef<Array<{x:number;y:number}>>([]);
  const gParts = useRef<GP[]>([]);
  const dustArr = useRef<DustP[]>([]);
  const starArr = useRef<StarP[]>([]);
  const birdArr = useRef<Bird[]>([]);
  const diyaArr = useRef<Diya[]>([]);
  const rocketArr = useRef<Rocket[]>([]);
  const sparkArr = useRef<Spark[]>([]);
  const cloudArr = useRef<Cloud[]>([]);

  const L = useRef<Layout>({ w:0,h:0,dpr:1,cx:0,cy:0,tx:0,ty:0,tw:0,th:0,fs:130 });

  const FONT = '"Tiro Devanagari Hindi", serif';
  const T_TEXT = 'जय श्री राम';
  const S1_TEXT = 'आपको एवं आपके परिवार को';
  const S2_TEXT = 'राम नवमी की हार्दिक शुभकामनाएँ';

  /* ─── Offscreen Builders ─── */

  function buildGrain(w: number, h: number) {
    const c = document.createElement('canvas');
    const gw = Math.ceil(w / 2), gh = Math.ceil(h / 2);
    c.width = gw; c.height = gh;
    const x = c.getContext('2d')!;
    const id = x.createImageData(gw, gh);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255;
      id.data[i] = v; id.data[i+1] = v; id.data[i+2] = v; id.data[i+3] = 12;
    }
    x.putImageData(id, 0, 0);
    grainCvs.current = c;
  }

  function buildMask() {
    const l = L.current, dpr = l.dpr, fs = l.fs;
    const mc = document.createElement('canvas');
    mc.width = Math.ceil(l.w * dpr); mc.height = Math.ceil(l.h * dpr);
    const mx = mc.getContext('2d')!;
    mx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mx.font = `${fs}px ${FONT}`;
    mx.textAlign = 'center'; mx.textBaseline = 'middle';
    mx.fillStyle = '#fff';
    const titleY = l.cy - l.h * 0.04;
    mx.fillText(T_TEXT, l.cx, titleY);
    const met = mx.measureText(T_TEXT);
    const tw = met.width, th = fs * 1.2;
    l.tx = l.cx - tw / 2; l.ty = titleY - th / 2; l.tw = tw; l.th = th;
    maskCvs.current = mc;
    const id = mx.getImageData(0, 0, mc.width, mc.height);
    const d = id.data;
    const pts: Array<{x:number;y:number}> = [];
    const step = Math.max(2, Math.round(3 * dpr));
    const x0 = Math.max(0, Math.round(l.tx * dpr));
    const y0 = Math.max(0, Math.round(l.ty * dpr));
    const x1 = Math.min(mc.width, Math.round((l.tx + tw) * dpr));
    const y1 = Math.min(mc.height, Math.round((l.ty + th) * dpr));
    for (let y = y0; y < y1; y += step)
      for (let x = x0; x < x1; x += step)
        if (d[(y * mc.width + x) * 4 + 3] > 128) pts.push({ x: x / dpr, y: y / dpr });
    if (pts.length > 5000) {
      for (let i = pts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
      pts.length = 5000;
    }
    targets.current = pts;
  }

  /* ─── Pre-render Temple to offscreen canvas ─── */

  function buildTemple() {
    const l = L.current, dpr = l.dpr;
    const c = document.createElement('canvas');
    c.width = Math.ceil(l.w * dpr); c.height = Math.ceil(l.h * dpr);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTempleToCtx(ctx, l);
    templeCvs.current = c;
  }

  function drawTempleToCtx(ctx: CanvasRenderingContext2D, l: Layout) {
    const cx = l.cx;
    const groundY = l.h * 0.64;
    const bw = l.w * 0.55;
    const baseH = l.h * 0.045;

    // ── Ground plane ──
    const ggnd = ctx.createLinearGradient(0, groundY, 0, l.h * 0.88);
    ggnd.addColorStop(0, '#1c1008');
    ggnd.addColorStop(0.3, '#140b04');
    ggnd.addColorStop(1, '#0a0502');
    ctx.fillStyle = ggnd;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.7, groundY);
    ctx.lineTo(cx + bw * 0.7, groundY);
    ctx.lineTo(l.w + 10, l.h * 0.88);
    ctx.lineTo(-10, l.h * 0.88);
    ctx.closePath();
    ctx.fill();

    // ── Ghat steps ──
    for (let s = 0; s < 4; s++) {
      const sy = groundY + s * (l.h * 0.015);
      const sw = bw * (0.52 + s * 0.06);
      ctx.fillStyle = s % 2 === 0 ? '#1a0e06' : '#160b04';
      ctx.fillRect(cx - sw / 2, sy, sw, l.h * 0.015);
      ctx.strokeStyle = 'rgba(255,180,80,0.04)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cx - sw / 2, sy, sw, l.h * 0.015);
    }

    // ── 3-tier stepped base (Jagati) ──
    for (let tier = 0; tier < 3; tier++) {
      const tw = bw * (0.48 - tier * 0.04);
      const ty = groundY - baseH * (tier + 1);
      const th = baseH;
      const tg = ctx.createLinearGradient(cx - tw / 2, ty, cx + tw / 2, ty);
      const base = 20 + tier * 8;
      tg.addColorStop(0, `rgb(${base},${Math.round(base*0.55)},${Math.round(base*0.25)})`);
      tg.addColorStop(0.3, `rgb(${base+12},${Math.round((base+12)*0.6)},${Math.round((base+12)*0.3)})`);
      tg.addColorStop(0.55, `rgb(${base+18},${Math.round((base+18)*0.65)},${Math.round((base+18)*0.32)})`);
      tg.addColorStop(0.8, `rgb(${base+8},${Math.round((base+8)*0.55)},${Math.round((base+8)*0.28)})`);
      tg.addColorStop(1, `rgb(${base-2},${Math.round((base-2)*0.5)},${Math.round((base-2)*0.22)})`);
      ctx.fillStyle = tg;
      ctx.fillRect(cx - tw / 2, ty, tw, th);
      // horizontal molding lines
      ctx.strokeStyle = `rgba(255,180,80,${0.06 + tier * 0.02})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - tw / 2, ty + 1);
      ctx.lineTo(cx + tw / 2, ty + 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - tw / 2, ty + th - 1);
      ctx.lineTo(cx + tw / 2, ty + th - 1);
      ctx.stroke();
      // small vertical lines (pillars on base)
      if (tier === 2) {
        const nPillars = 18;
        for (let p = 0; p < nPillars; p++) {
          const px = cx - tw / 2 + (tw / (nPillars - 1)) * p;
          ctx.strokeStyle = 'rgba(255,180,80,0.05)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, ty);
          ctx.lineTo(px, ty + th);
          ctx.stroke();
        }
      }
    }

    // ── Main wall ──
    const wallW = bw * 0.40;
    const wallH = l.h * 0.18;
    const wallY = groundY - baseH * 3 - wallH;
    const wg = ctx.createLinearGradient(cx - wallW / 2, 0, cx + wallW / 2, 0);
    wg.addColorStop(0, '#120804');
    wg.addColorStop(0.2, '#1e1008');
    wg.addColorStop(0.45, '#2a1810');
    wg.addColorStop(0.6, '#2a1810');
    wg.addColorStop(0.8, '#1e1008');
    wg.addColorStop(1, '#120804');
    ctx.fillStyle = wg;
    ctx.fillRect(cx - wallW / 2, wallY, wallW, wallH);

    // wall horizontal bands
    for (let b = 0; b < 6; b++) {
      const by = wallY + (wallH / 6) * b;
      ctx.strokeStyle = 'rgba(255,180,80,0.06)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - wallW / 2, by);
      ctx.lineTo(cx + wallW / 2, by);
      ctx.stroke();
    }

    // niches on wall
    const nicheW = wallW * 0.06;
    const nicheH = wallH * 0.2;
    for (let ni = 0; ni < 8; ni++) {
      const nx = cx - wallW * 0.38 + (wallW * 0.76 / 7) * ni;
      const ny = wallY + wallH * 0.35;
      ctx.beginPath();
      ctx.arc(nx, ny + nicheH * 0.5, nicheW, Math.PI, 0);
      ctx.lineTo(nx + nicheW, ny + nicheH);
      ctx.lineTo(nx - nicheW, ny + nicheH);
      ctx.closePath();
      ctx.fillStyle = '#0a0503';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,180,80,0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // tiny idol glow
      const ig = ctx.createRadialGradient(nx, ny + nicheH * 0.4, 0, nx, ny + nicheH * 0.4, nicheW * 0.6);
      ig.addColorStop(0, 'rgba(255,200,80,0.08)');
      ig.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = ig;
      ctx.fill();
    }

    // ── Entrance pillars ──
    const pillarW = wallW * 0.035;
    const pillarH = wallH * 0.85;
    for (const px of [cx - wallW * 0.12, cx + wallW * 0.12 - pillarW]) {
      const pg = ctx.createLinearGradient(px, 0, px + pillarW, 0);
      pg.addColorStop(0, '#1a0e06');
      pg.addColorStop(0.4, '#2e1c10');
      pg.addColorStop(0.6, '#352212');
      pg.addColorStop(1, '#1a0e06');
      ctx.fillStyle = pg;
      ctx.fillRect(px, wallY + wallH * 0.1, pillarW, pillarH);
      // pillar cap
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(px - 2, wallY + wallH * 0.08, pillarW + 4, pillarH * 0.04);
    }

    // ── Arched doorway ──
    const doorW = wallW * 0.09;
    const doorH = wallH * 0.7;
    const doorY = wallY + wallH - doorH;
    ctx.beginPath();
    ctx.arc(cx, doorY + doorW, doorW, Math.PI, 0);
    ctx.lineTo(cx + doorW, wallY + wallH);
    ctx.lineTo(cx - doorW, wallY + wallH);
    ctx.closePath();
    const dg = ctx.createLinearGradient(cx, doorY, cx, wallY + wallH);
    dg.addColorStop(0, '#080301');
    dg.addColorStop(0.7, '#050201');
    dg.addColorStop(1, '#0a0503');
    ctx.fillStyle = dg;
    ctx.fill();
    // door frame
    ctx.strokeStyle = 'rgba(197,155,39,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // inner warm glow from door
    const dglow = ctx.createRadialGradient(cx, doorY + doorH * 0.5, 0, cx, doorY + doorH * 0.5, doorW * 1.5);
    dglow.addColorStop(0, 'rgba(255,180,60,0.06)');
    dglow.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = dglow;
    ctx.beginPath();
    ctx.arc(cx, doorY + doorH * 0.5, doorW * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Shikhara base platform ──
    const shikBaseY = wallY;
    const shikBaseW = wallW * 0.95;
    const shikBaseH = l.h * 0.015;
    const sbg = ctx.createLinearGradient(cx - shikBaseW / 2, 0, cx + shikBaseW / 2, 0);
    sbg.addColorStop(0, '#150a04');
    sbg.addColorStop(0.5, '#251508');
    sbg.addColorStop(1, '#150a04');
    ctx.fillStyle = sbg;
    ctx.fillRect(cx - shikBaseW / 2, shikBaseY - shikBaseH, shikBaseW, shikBaseH);

    // ── 7 Shikhars ──
    const shikharas = [
      { rx: -0.42, h: 0.28, w: 0.048 },
      { rx: -0.28, h: 0.42, w: 0.065 },
      { rx: -0.14, h: 0.55, w: 0.078 },
      { rx: 0,    h: 0.72, w: 0.092 },
      { rx: 0.14, h: 0.55, w: 0.078 },
      { rx: 0.28, h: 0.42, w: 0.065 },
      { rx: 0.42, h: 0.28, w: 0.048 },
    ];

    for (let si = 0; si < shikharas.length; si++) {
      const s = shikharas[si];
      const sx = cx + shikBaseW * s.rx;
      const sy = shikBaseY - shikBaseH;
      const sh = wallH * s.h;
      const sw = wallW * s.w;
      const lightFactor = 1 - Math.abs(s.rx) / 0.5;
      const haze = Math.max(0, Math.abs(s.rx) - 0.2) * 0.4;

      // shikhar body
      ctx.beginPath();
      ctx.moveTo(sx - sw, sy);
      ctx.bezierCurveTo(sx - sw * 0.82, sy - sh * 0.35, sx - sw * 0.35, sy - sh * 0.82, sx, sy - sh);
      ctx.bezierCurveTo(sx + sw * 0.35, sy - sh * 0.82, sx + sw * 0.82, sy - sh * 0.35, sx + sw, sy);
      ctx.closePath();

      const sg = ctx.createLinearGradient(sx - sw, sy, sx + sw, sy);
      const bR = 18 + lightFactor * 30;
      const bG = 10 + lightFactor * 18;
      const bB = 5 + lightFactor * 8;
      sg.addColorStop(0, `rgba(${Math.round(bR*0.7)},${Math.round(bG*0.7)},${Math.round(bB*0.7)},${1 - haze})`);
      sg.addColorStop(0.3, `rgba(${Math.round(bR)},${Math.round(bG)},${Math.round(bB)},${1 - haze})`);
      sg.addColorStop(0.55, `rgba(${Math.round(bR*1.3)},${Math.round(bG*1.3)},${Math.round(bB*1.3)},${1 - haze})`);
      sg.addColorStop(0.75, `rgba(${Math.round(bR)},${Math.round(bG)},${Math.round(bB)},${1 - haze})`);
      sg.addColorStop(1, `rgba(${Math.round(bR*0.7)},${Math.round(bG*0.7)},${Math.round(bB*0.7)},${1 - haze})`);
      ctx.fillStyle = sg;
      ctx.fill();

      // edge highlight (light side)
      ctx.beginPath();
      ctx.bezierCurveTo(sx + sw * 0.35, sy - sh * 0.82, sx + sw * 0.82, sy - sh * 0.35, sx + sw, sy);
      ctx.strokeStyle = `rgba(255,180,80,${0.1 * lightFactor * (1 - haze)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // horizontal ridges
      for (let r = 1; r < 9; r++) {
        const t = r / 9;
        const ry = sy - sh * t;
        const rw = sw * (1 - t * 0.82) * 0.95;
        ctx.beginPath();
        ctx.moveTo(sx - rw, ry);
        ctx.quadraticCurveTo(sx, ry - 1.5 * t, sx + rw, ry);
        ctx.strokeStyle = `rgba(255,180,80,${0.04 * lightFactor * (1 - haze)})`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }

      // kalash
      const kY = sy - sh;
      const kW = sw * 0.18;
      ctx.beginPath();
      ctx.ellipse(sx, kY, kW, kW * 0.55, 0, 0, Math.PI * 2);
      const kg = ctx.createRadialGradient(sx - 1, kY - 1, 0, sx, kY, kW);
      kg.addColorStop(0, `rgba(255,225,80,${0.7 + 0.3 * lightFactor})`);
      kg.addColorStop(0.5, `rgba(197,155,39,${0.6 + 0.3 * lightFactor})`);
      kg.addColorStop(1, `rgba(138,90,10,${0.5 + 0.2 * lightFactor})`);
      ctx.fillStyle = kg;
      ctx.fill();

      // flag pole
      const poleH = sw * 2.5;
      ctx.beginPath();
      ctx.moveTo(sx, kY - kW * 0.5);
      ctx.lineTo(sx, kY - kW * 0.5 - poleH);
      ctx.strokeStyle = `rgba(197,155,39,${0.4 + 0.4 * lightFactor})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // saffron flag
      const flagLen = sw * 1.2;
      const flagH = sw * 0.5;
      const fY = kY - kW * 0.5 - poleH * 0.6;
      const wave1 = Math.sin(si * 2.1) * 1.5;
      const wave2 = Math.cos(si * 1.7) * 1;
      ctx.beginPath();
      ctx.moveTo(sx, fY);
      ctx.quadraticCurveTo(sx + flagLen * 0.4, fY - flagH * 0.25 + wave1, sx + flagLen, fY + wave2);
      ctx.lineTo(sx + flagLen, fY + flagH + wave2 * 0.5);
      ctx.quadraticCurveTo(sx + flagLen * 0.4, fY + flagH * 0.75 + wave1 * 0.5, sx, fY + flagH);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,130,0,${0.35 + 0.35 * lightFactor})`;
      ctx.fill();
    }

    // ── Small domes between shikhars ──
    const domePositions = [-0.35, -0.21, -0.07, 0.07, 0.21, 0.35];
    for (const dx of domePositions) {
      const domX = cx + shikBaseW * dx;
      const domY = shikBaseY - shikBaseH;
      const domR = wallW * 0.025;
      ctx.beginPath();
      ctx.arc(domX, domY, domR, Math.PI, 0);
      const domG = ctx.createLinearGradient(domX - domR, domY, domX + domR, domY);
      domG.addColorStop(0, '#150a04');
      domG.addColorStop(0.5, '#251508');
      domG.addColorStop(1, '#150a04');
      ctx.fillStyle = domG;
      ctx.fill();
      // tiny kalash
      ctx.beginPath();
      ctx.arc(domX, domY - domR - 2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(197,155,39,0.5)';
      ctx.fill();
    }

    // ── Overall warm temple glow ──
    const tGlow = ctx.createRadialGradient(cx, groundY - wallH * 0.5, 0, cx, groundY - wallH * 0.5, bw * 0.6);
    tGlow.addColorStop(0, 'rgba(255,160,50,0.06)');
    tGlow.addColorStop(0.5, 'rgba(255,120,30,0.02)');
    tGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tGlow;
    ctx.fillRect(0, 0, l.w, l.h);
  }

  /* ─── Init Functions ─── */

  function initGoldParticles() {
    const l = L.current, tg = targets.current, arr: GP[] = [];
    for (let i = 0; i < tg.length; i++) {
      const t = tg[i];
      let ox: number, oy: number;
      const e = Math.random();
      if (e < 0.25) { ox = rand(0, l.w); oy = -80; }
      else if (e < 0.5) { ox = rand(0, l.w); oy = l.h + 80; }
      else if (e < 0.75) { ox = -80; oy = rand(0, l.h); }
      else { ox = l.w + 80; oy = rand(0, l.h); }
      arr.push({ x:ox,y:oy,vx:0,vy:0,tx:t.x,ty:t.y,sz:rand(0.6,3),br:rand(0.45,1),gs:rand(0.25,1),sp:rand(0,2),si:rand(0.3,1.5) });
    }
    gParts.current = arr;
  }

  function initDust(n: number) {
    const l = L.current, a: DustP[] = [];
    for (let i = 0; i < n; i++)
      a.push({ x:rand(0,l.w),y:rand(0,l.h),vx:rand(-0.25,0.25),vy:rand(-0.35,-0.03),sz:rand(0.4,2.2),a:rand(0.08,0.4),life:rand(0,5),ml:rand(3,8) });
    dustArr.current = a;
  }

  function initStars() {
    const l = L.current, a: StarP[] = [];
    for (let i = 0; i < 60; i++)
      a.push({ x:rand(0,l.w),y:rand(0,l.h*0.4),sz:rand(0.3,1.5),br:rand(0.3,0.8),tw:rand(0,6.28),ts:rand(1,4) });
    starArr.current = a;
  }

  function initBirds() {
    const l = L.current, a: Bird[] = [];
    for (let i = 0; i < 8; i++)
      a.push({ x:rand(-150,l.w*0.25),y:rand(l.h*0.04,l.h*0.2),spd:rand(0.4,1.2),wp:rand(0,6.28),ws:rand(3,6),sz:rand(3,7) });
    birdArr.current = a;
  }

  function initDiyas() {
    const l = L.current, a: Diya[] = [];
    const wy = l.h * 0.72;
    for (let i = 0; i < 20; i++)
      a.push({ x:rand(l.w*0.06,l.w*0.94),y:wy+rand(-3,12),ph:rand(0,6.28),spd:rand(2,5),sz:rand(4,10),br:rand(0.55,1),dr:rand(-0.12,0.12) });
    diyaArr.current = a;
  }

  function initClouds() {
    const l = L.current, a: Cloud[] = [];
    for (let i = 0; i < 5; i++) {
      const blobs: number[] = [];
      const nb = randInt(4, 7);
      for (let b = 0; b < nb; b++) blobs.push(rand(-0.4, 0.4), rand(-0.3, 0.3), rand(0.15, 0.4));
      a.push({ x:rand(-l.w*0.2,l.w*1.2),y:rand(l.h*0.06,l.h*0.2),w:rand(l.w*0.1,l.w*0.22),h:rand(l.h*0.015,l.h*0.035),spd:rand(0.15,0.4),blobs });
    }
    cloudArr.current = a;
  }

  /* ═══════════════════ DRAW: SCENE 1 — SUNRISE ═══════════════════ */

  function drawSunrise(ctx: CanvasRenderingContext2D, w: number, l: Layout, time: number) {
    if (w <= 0) return;
    ctx.save();
    ctx.globalAlpha = w;

    // Stars (fade out as sunrise progresses)
    const starFade = 1 - smoothstep(0.5, 2.5, time);
    if (starFade > 0) {
      ctx.globalAlpha = w * starFade;
      for (const s of starArr.current) {
        const twinkle = 0.5 + Math.sin(time * s.ts + s.tw) * 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.sz * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,230,180,${s.br * twinkle})`;
        ctx.fill();
      }
      ctx.globalAlpha = w;
    }

    // Sky gradient - multi stop for realism
    const skyIntensity = smoothstep(0, 2, time);
    const sg = ctx.createLinearGradient(0, 0, 0, l.h * 0.65);
    sg.addColorStop(0, lerpColor('#050210', '#1a0a02', skyIntensity));
    sg.addColorStop(0.15, lerpColor('#0a0515', '#2a1005', skyIntensity));
    sg.addColorStop(0.3, lerpColor('#150818', '#6a2a08', skyIntensity));
    sg.addColorStop(0.45, lerpColor('#2a0c10', '#b85510', skyIntensity));
    sg.addColorStop(0.58, lerpColor('#4a1508', '#d87818', skyIntensity));
    sg.addColorStop(0.7, lerpColor('#6a2008', '#e89020', skyIntensity));
    sg.addColorStop(0.82, lerpColor('#803008', '#c06810', skyIntensity));
    sg.addColorStop(1, lerpColor('#3a1808', '#1a0a02', skyIntensity));
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, l.w, l.h * 0.7);

    // Sun position
    const sunX = l.cx;
    const sunY = l.h * 0.58 - smoothstep(0, 3, time) * l.h * 0.05;
    const sunRise = smoothstep(0.3, 2.5, time);

    // Sun outer glow (very large, soft)
    const outerR = l.w * 0.45;
    const og = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, outerR);
    og.addColorStop(0, `rgba(255,200,80,${0.25 * sunRise})`);
    og.addColorStop(0.2, `rgba(255,160,50,${0.15 * sunRise})`);
    og.addColorStop(0.45, `rgba(220,100,20,${0.06 * sunRise})`);
    og.addColorStop(0.7, `rgba(150,50,10,${0.02 * sunRise})`);
    og.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = og;
    ctx.fillRect(0, 0, l.w, l.h);

    // Sun mid glow
    const midR = l.w * 0.18;
    const mg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, midR);
    mg.addColorStop(0, `rgba(255,220,120,${0.5 * sunRise})`);
    mg.addColorStop(0.3, `rgba(255,180,60,${0.3 * sunRise})`);
    mg.addColorStop(0.7, `rgba(255,120,30,${0.08 * sunRise})`);
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, l.w, l.h);

    // Sun core
    const coreR = l.w * 0.04;
    const cg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, coreR);
    cg.addColorStop(0, `rgba(255,245,200,${0.9 * sunRise})`);
    cg.addColorStop(0.4, `rgba(255,220,120,${0.7 * sunRise})`);
    cg.addColorStop(1, `rgba(255,180,60,${0.0})`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, coreR, 0, Math.PI * 2);
    ctx.fill();

    // God rays - wider, softer, more numerous
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 20; i++) {
      const ang = (i / 20) * Math.PI * 0.9 + Math.PI * 0.05 + Math.sin(time * 0.3 + i * 0.7) * 0.03;
      const rlen = l.h * (0.55 + Math.sin(time * 0.6 + i * 1.3) * 0.1);
      const rw = 0.025 + Math.sin(time * 0.25 + i * 0.8) * 0.01;
      const rayAlpha = 0.02 + Math.sin(time * 0.4 + i * 1.1) * 0.008;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(ang - rw) * rlen, sunY + Math.sin(ang - rw) * rlen);
      ctx.lineTo(sunX + Math.cos(ang + rw) * rlen, sunY + Math.sin(ang + rw) * rlen);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,175,50,${rayAlpha * sunRise})`;
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Atmospheric haze at horizon
    const hz = ctx.createLinearGradient(0, l.h * 0.45, 0, l.h * 0.7);
    hz.addColorStop(0, 'rgba(200,120,40,0)');
    hz.addColorStop(0.5, `rgba(200,120,40,${0.08 * sunRise})`);
    hz.addColorStop(1, `rgba(180,100,30,${0.15 * sunRise})`);
    ctx.fillStyle = hz;
    ctx.fillRect(0, l.h * 0.45, l.w, l.h * 0.25);

    // Clouds
    for (const c of cloudArr.current) {
      const cx2 = ((c.x + time * c.spd * 15) % (l.w + c.w * 2)) - c.w;
      ctx.globalAlpha = w * 0.25 * sunRise;
      for (let b = 0; b < c.blobs.length; b += 3) {
        const bx = cx2 + c.blobs[b] * c.w;
        const by = c.y + c.blobs[b + 1] * c.h;
        const br = c.blobs[b + 2] * c.w;
        ctx.beginPath();
        ctx.ellipse(bx, by, br, br * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80,35,15,0.5)';
        ctx.fill();
      }
    }
    ctx.globalAlpha = w;

    // Subtle lens flare
    if (sunRise > 0.3) {
      const flareAlpha = (sunRise - 0.3) * 0.15;
      for (let f = 0; f < 3; f++) {
        const fx = sunX + (f - 1) * l.w * 0.12;
        const fy = sunY - (f - 1) * l.h * 0.03;
        const fr = 15 + f * 8;
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
        fg.addColorStop(0, `rgba(255,220,150,${flareAlpha})`);
        fg.addColorStop(0.5, `rgba(255,180,80,${flareAlpha * 0.3})`);
        fg.addColorStop(1, 'rgba(255,180,80,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function lerpColor(c1: string, c2: string, t: number): string {
    const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.round(lerp(r1, r2, t)), g = Math.round(lerp(g1, g2, t)), b = Math.round(lerp(b1, b2, t));
    return `rgb(${r},${g},${b})`;
  }

  /* ═══════════════════ DRAW: RIVER ═══════════════════ */

  function drawRiver(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;

    // Perspective trapezoid
    const topW = l.w * 0.65;
    const botW = l.w * 1.1;
    const topY = l.h * 0.72;
    const botY = l.h * 0.92;

    ctx.beginPath();
    ctx.moveTo(l.cx - topW / 2, topY);
    ctx.lineTo(l.cx + topW / 2, topY);
    ctx.lineTo(l.cx + botW / 2, botY);
    ctx.lineTo(l.cx - botW / 2, botY);
    ctx.closePath();

    const wg = ctx.createLinearGradient(0, topY, 0, botY);
    wg.addColorStop(0, 'rgba(15,30,40,0.5)');
    wg.addColorStop(0.3, 'rgba(10,22,32,0.6)');
    wg.addColorStop(0.7, 'rgba(8,18,28,0.7)');
    wg.addColorStop(1, 'rgba(5,12,20,0.8)');
    ctx.fillStyle = wg;
    ctx.fill();

    // Temple reflection (simplified, wavy)
    const tc = templeCvs.current;
    if (tc) {
      ctx.save();
      ctx.globalAlpha = op * 0.08;
      // Clip to river shape
      ctx.beginPath();
      ctx.moveTo(l.cx - topW / 2, topY);
      ctx.lineTo(l.cx + topW / 2, topY);
      ctx.lineTo(l.cx + botW / 2, botY);
      ctx.lineTo(l.cx - botW / 2, botY);
      ctx.closePath();
      ctx.clip();
      // Flip vertically around topY
      ctx.translate(0, topY * 2);
      ctx.scale(1, -1);
      ctx.drawImage(tc, 0, 0, l.w, l.h);
      ctx.restore();
    }

    // Wave lines
    ctx.strokeStyle = 'rgba(255,180,80,0.05)';
    ctx.lineWidth = 0.7;
    for (let r = 0; r < 10; r++) {
      const t = r / 10;
      const wy = topY + (botY - topY) * t;
      const lineW = lerp(topW, botW, t);
      const lx = l.cx - lineW / 2;
      ctx.beginPath();
      for (let x = 0; x <= lineW; x += 3) {
        const waveY = wy + Math.sin((lx + x) * 0.015 + time * 1.1 + r * 1.5) * (1.5 + t * 2);
        x === 0 ? ctx.moveTo(lx + x, waveY) : ctx.lineTo(lx + x, waveY);
      }
      ctx.stroke();
    }

    // Shimmer highlights
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 35; i++) {
      const t = (Math.sin(time * 0.5 + i * 3.7) * 0.5 + 0.5);
      const lineW = lerp(topW, botW, t);
      const sx = l.cx - lineW / 2 + Math.sin(time * 0.55 + i * 2.1) * lineW * 0.4 + lineW * 0.5;
      const sy = topY + (botY - topY) * t;
      const sr = rand(0.5, 2);
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,200,100,${rand(0.01, 0.035)})`;
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  /* ═══════════════════ DRAW: BIRDS ═══════════════════ */

  function drawBirds(ctx: CanvasRenderingContext2D, op: number, l: Layout, dt: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;
    ctx.strokeStyle = '#0d0603';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    for (const b of birdArr.current) {
      b.x += b.spd * dt * 60;
      b.wp += b.ws * dt;
      if (b.x > l.w + 150) { b.x = -150; b.y = rand(l.h * 0.04, l.h * 0.2); }
      const wing = Math.sin(b.wp) * b.sz * 0.6;
      ctx.beginPath();
      ctx.moveTo(b.x - b.sz, b.y + wing);
      ctx.quadraticCurveTo(b.x - b.sz * 0.25, b.y - b.sz * 0.2, b.x, b.y);
      ctx.quadraticCurveTo(b.x + b.sz * 0.25, b.y - b.sz * 0.2, b.x + b.sz, b.y + wing);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ═══════════════════ DRAW: DIYAS ═══════════════════ */

  function drawDiyas(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number, dt: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op;
    for (const d of diyaArr.current) {
      d.x += d.dr * dt * 60;
      d.ph += d.spd * dt;
      if (d.x < l.w * 0.04) d.dr = Math.abs(d.dr);
      if (d.x > l.w * 0.96) d.dr = -Math.abs(d.dr);
      const fl = 0.65 + Math.sin(d.ph) * 0.12 + Math.sin(d.ph * 3.3) * 0.1 + Math.sin(d.ph * 7.7) * 0.06;

      // Bowl
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + d.sz * 0.3, d.sz, d.sz * 0.3, 0, 0, Math.PI * 2);
      const bg = ctx.createRadialGradient(d.x, d.y + d.sz * 0.3, 0, d.x, d.y + d.sz * 0.3, d.sz);
      bg.addColorStop(0, '#8a4010');
      bg.addColorStop(0.7, '#6a2e08');
      bg.addColorStop(1, '#4a1e05');
      ctx.fillStyle = bg;
      ctx.fill();

      // Oil surface
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + d.sz * 0.15, d.sz * 0.6, d.sz * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,200,50,${0.4 * fl})`;
      ctx.fill();

      // Flame
      const fh = d.sz * 1.2 * fl;
      const fw = d.sz * 0.28 * fl;
      const fg = ctx.createRadialGradient(d.x, d.y - fh * 0.3, 0, d.x, d.y, fh);
      fg.addColorStop(0, `rgba(255,255,210,${0.9 * fl})`);
      fg.addColorStop(0.2, `rgba(255,220,80,${0.7 * fl})`);
      fg.addColorStop(0.5, `rgba(255,160,30,${0.35 * fl})`);
      fg.addColorStop(0.8, `rgba(255,100,15,${0.1 * fl})`);
      fg.addColorStop(1, 'rgba(255,60,10,0)');
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - fh);
      ctx.bezierCurveTo(d.x + fw * 0.5, d.y - fh * 0.7, d.x + fw, d.y - fh * 0.3, d.x + fw * 0.4, d.y);
      ctx.bezierCurveTo(d.x, d.y - fh * 0.08, d.x, d.y - fh * 0.08, d.x - fw * 0.4, d.y);
      ctx.bezierCurveTo(d.x - fw, d.y - fh * 0.3, d.x - fw * 0.5, d.y - fh * 0.7, d.x, d.y - fh);
      ctx.fillStyle = fg;
      ctx.fill();

      // Glow
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gg = ctx.createRadialGradient(d.x, d.y - fh * 0.3, 0, d.x, d.y - fh * 0.3, d.sz * 4);
      gg.addColorStop(0, `rgba(255,180,50,${0.07 * d.br * fl})`);
      gg.addColorStop(0.5, `rgba(255,120,30,${0.02 * d.br * fl})`);
      gg.addColorStop(1, 'rgba(255,100,20,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(d.x, d.y - fh * 0.3, d.sz * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Water reflection
      const refY = d.y + d.sz * 0.5 + Math.abs(d.y - l.h * 0.72) * 0.3;
      const refG = ctx.createRadialGradient(d.x, refY, 0, d.x, refY, d.sz * 2.5);
      refG.addColorStop(0, `rgba(255,180,50,${0.03 * fl})`);
      refG.addColorStop(1, 'rgba(255,180,50,0)');
      ctx.fillStyle = refG;
      ctx.beginPath();
      ctx.ellipse(d.x, refY, d.sz * 2.5, d.sz * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ═══════════════════ DRAW: FIREWORKS ═══════════════════ */

  function updateFireworks(l: Layout, dt: number, time: number) {
    const rk = rocketArr.current, sp = sparkArr.current;
    if (Math.random() < dt * 1.5) {
      rk.push({
        x: rand(l.w * 0.08, l.w * 0.92), y: l.h + 10,
        vy: rand(-5, -7.5), ty: rand(l.h * 0.06, l.h * 0.35),
        hue: randInt(0, 360), on: true, trail: [], type: randInt(0, 2),
      });
    }
    for (let i = rk.length - 1; i >= 0; i--) {
      const r = rk[i];
      if (!r.on) { rk.splice(i, 1); continue; }
      r.trail.push({ x: r.x, y: r.y, a: 0.8 });
      if (r.trail.length > 15) r.trail.shift();
      for (const tp of r.trail) tp.a *= 0.88;
      r.y += r.vy * dt * 60;
      r.x += Math.sin(time * 10 + i * 4) * 0.2;
      if (r.y <= r.ty) {
        r.on = false;
        const n = randInt(55, 95);
        for (let j = 0; j < n; j++) {
          const angle = (j / n) * Math.PI * 2 + rand(-0.15, 0.15);
          let speed: number, life: number;
          if (r.type === 0) { speed = rand(1.5, 5); life = rand(0.8, 1.8); }
          else if (r.type === 1) { speed = rand(3.5, 4.5); life = rand(0.5, 1.1); }
          else { speed = rand(1, 3.5); life = rand(1.5, 2.8); }
          sp.push({
            x: r.x, y: r.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (r.type === 2 ? 0.8 : 0),
            life, ml: life, hue: (r.hue + rand(-30, 30) + 360) % 360,
            sat: rand(55, 100), lit: rand(50, 85), sz: rand(0.7, 2.5),
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
      // Smoke trail
      for (let t = 0; t < r.trail.length; t++) {
        const tp = r.trail[t];
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 1 + (1 - t / r.trail.length) * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,180,140,${tp.a * 0.2})`;
        ctx.fill();
      }
      // Rocket head
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe8c0';
      ctx.fill();
      // Head glow
      const hg = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 6);
      hg.addColorStop(0, 'rgba(255,220,150,0.4)');
      hg.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
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
      s.vy += 0.03 * dt * 60;
      s.vx *= 0.99;
      s.vy *= 0.99;
      s.life -= dt;
      if (s.life <= 0) { sp.splice(i, 1); continue; }
      const lr = s.life / s.ml;
      const r = s.sz * lr;
      // Glow
      if (lr > 0.3) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},${s.sat}%,${s.lit}%,${lr * 0.05})`;
        ctx.fill();
      }
      // Core
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      const coreLit = Math.min(95, s.lit + (1 - lr) * 15);
      ctx.fillStyle = `hsla(${s.hue},${s.sat}%,${coreLit}%,${lr * 0.9})`;
      ctx.fill();
    }
    if (sp.length > 2500) sp.splice(0, sp.length - 2500);
    ctx.restore();
  }

  /* ═══════════════════ DRAW: DIVINE LIGHT ═══════════════════ */

  function drawDivineLight(ctx: CanvasRenderingContext2D, intensity: number, l: Layout, time: number) {
    if (intensity <= 0) return;
    ctx.save();
    ctx.globalAlpha = intensity;
    const pulse = 0.85 + Math.sin(time * 1.0) * 0.15;
    const g = ctx.createRadialGradient(l.cx, -l.h * 0.05, 0, l.cx, l.h * 0.45, l.w * 0.45 * pulse);
    g.addColorStop(0, 'rgba(255,200,80,0.1)');
    g.addColorStop(0.25, 'rgba(255,160,50,0.04)');
    g.addColorStop(0.6, 'rgba(200,100,20,0.01)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.w, l.h);
    // Beam
    const bw = l.w * 0.06;
    const bg = ctx.createLinearGradient(l.cx - bw, 0, l.cx + bw, 0);
    bg.addColorStop(0, 'rgba(255,200,80,0)');
    bg.addColorStop(0.35, 'rgba(255,200,80,0.025)');
    bg.addColorStop(0.5, 'rgba(255,220,120,0.04)');
    bg.addColorStop(0.65, 'rgba(255,200,80,0.025)');
    bg.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(l.cx - bw, 0, bw * 2, l.h * 0.65);
    ctx.restore();
  }

  /* ═══════════════════ DRAW: DUST ═══════════════════ */

  function drawDust(ctx: CanvasRenderingContext2D, op: number, l: Layout, dt: number, gold: boolean) {
    if (op <= 0) return;
    ctx.save();
    for (const d of dustArr.current) {
      d.x += d.vx * dt * 60;
      d.y += d.vy * dt * 60;
      d.life += dt;
      if (d.life > d.ml || d.y < -10 || d.x < -10 || d.x > l.w + 10) {
        d.x = rand(0, l.w); d.y = rand(l.h * 0.4, l.h + 10);
        d.life = 0; d.ml = rand(3, 8); d.a = rand(0.08, 0.4);
      }
      const fi = smoothstep(0, 0.5, d.life);
      const fo = smoothstep(0, 0.5, d.ml - d.life);
      const a = d.a * fi * fo * op;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.sz, 0, Math.PI * 2);
      ctx.fillStyle = gold ? `rgba(255,210,120,${a})` : `rgba(255,200,100,${a * 0.6})`;
      ctx.fill();
    }
    ctx.restore();
  }

  /* ═══════════════════ DRAW: GOLD PARTICLES ═══════════════════ */

  function drawGoldParticles(ctx: CanvasRenderingContext2D, op: number, conv: number, time: number, dt: number) {
    if (op <= 0) return;
    const ps = gParts.current;
    ctx.save();
    ctx.globalAlpha = op;
    for (const p of ps) {
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const force = conv * conv * 5;
      const attr = force / (1 + dist * 0.006);
      p.vx += (dx / dist) * attr * dt * 60;
      p.vy += (dy / dist) * attr * dt * 60;
      const turb = Math.max(0, 1 - conv * 0.9);
      p.vx += Math.sin(time * 2.3 + p.tx * 0.07) * turb * 0.5;
      p.vy += Math.cos(time * 1.9 + p.ty * 0.07) * turb * 0.5;
      p.vx *= 0.9; p.vy *= 0.9;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.sp += dt;
      let sparkle = 0;
      if (p.sp > p.si) { sparkle = 1; p.sp = 0; p.si = rand(0.3, 1.5); }
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const sz = p.sz * (0.8 + 0.2 * conv);
      const al = p.br * (0.6 + 0.4 * conv);

      // Motion trail
      if (speed > 0.8 && turb > 0.1) {
        const trailLen = Math.min(speed * 1.5, 6);
        ctx.beginPath();
        ctx.arc(p.x - (p.vx / speed) * trailLen, p.y - (p.vy / speed) * trailLen, sz * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = goldColor(p.gs, al * 0.2);
        ctx.fill();
      }
      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fillStyle = goldColor(p.gs, al);
      ctx.fill();
      // Sparkle
      if (sparkle > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,220,${0.35 * al})`;
        ctx.fill();
      }
      // Soft glow when near target
      if (conv > 0.6 && sz > 1.5) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = goldColor(p.gs, al * 0.04);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ═══════════════════ DRAW: GOLD TITLE ═══════════════════ */

  function drawGoldTitle(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    const tc = titleCvs.current;
    if (!tc) return;
    const fs = l.fs, x = l.cx, y = l.cy - l.h * 0.04;

    // Outline on MAIN canvas
    ctx.save();
    ctx.globalAlpha = op;
    ctx.font = `${fs}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#120801';
    ctx.lineWidth = 10; ctx.lineJoin = 'round';
    ctx.strokeText(T_TEXT, x, y + 2);
    ctx.strokeStyle = '#261102';
    ctx.lineWidth = 7;
    ctx.strokeText(T_TEXT, x, y);
    ctx.restore();

    // Fill on OFFSCREEN canvas
    const tctx = tc.getContext('2d')!;
    tctx.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
    tctx.clearRect(0, 0, l.w, l.h);
    const met = tctx.measureText(T_TEXT);
    const hw = met.width / 2;
    const topY = y - fs * 0.45, botY = y + fs * 0.45;

    const gg = tctx.createLinearGradient(x, topY, x, botY);
    gg.addColorStop(0, '#FFF1A8');
    gg.addColorStop(0.1, '#FFE066');
    gg.addColorStop(0.25, '#FFD700');
    gg.addColorStop(0.45, '#FFB300');
    gg.addColorStop(0.65, '#C59B27');
    gg.addColorStop(0.82, '#8A5A0A');
    gg.addColorStop(1, '#4A2800');
    tctx.font = `${fs}px ${FONT}`;
    tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
    tctx.fillStyle = gg;
    tctx.fillText(T_TEXT, x, y);

    // Reflection sweep
    tctx.globalCompositeOperation = 'source-atop';
    const swX = x + Math.sin(time * 0.35) * hw * 1.2;
    const swG = tctx.createLinearGradient(swX - 100, 0, swX + 100, 0);
    swG.addColorStop(0, 'rgba(255,255,255,0)');
    swG.addColorStop(0.3, 'rgba(255,255,220,0.08)');
    swG.addColorStop(0.5, 'rgba(255,255,240,0.14)');
    swG.addColorStop(0.7, 'rgba(255,255,220,0.08)');
    swG.addColorStop(1, 'rgba(255,255,255,0)');
    tctx.fillStyle = swG;
    tctx.fillRect(x - hw - 130, topY - 15, met.width + 260, botY - topY + 30);

    // Micro glitter
    for (let i = 0; i < 22; i++) {
      const gx = x - hw + Math.random() * met.width;
      const gy = topY + Math.random() * (botY - topY);
      tctx.beginPath();
      tctx.arc(gx, gy, rand(0.3, 0.8), 0, Math.PI * 2);
      tctx.fillStyle = `rgba(255,255,230,${rand(0.12, 0.45)})`;
      tctx.fill();
    }

    // Specular highlights
    for (const sp of [{rx:-0.3,ry:-0.25},{rx:0.1,ry:-0.3},{rx:0.4,ry:-0.2}]) {
      const sx2 = x + sp.rx * met.width, sy2 = y + sp.ry * fs;
      const sg = tctx.createRadialGradient(sx2, sy2, 0, sx2, sy2, 3);
      sg.addColorStop(0, 'rgba(255,255,240,0.5)');
      sg.addColorStop(1, 'rgba(255,255,240,0)');
      tctx.fillStyle = sg;
      tctx.fillRect(sx2 - 4, sy2 - 4, 8, 8);
    }
    tctx.globalCompositeOperation = 'source-over';

    // Composite
    ctx.save();
    ctx.globalAlpha = op;
    ctx.resetTransform();
    ctx.drawImage(tc, 0, 0);
    ctx.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
    ctx.restore();

    // Subtle warm glow behind text
    ctx.save();
    ctx.globalAlpha = op * 0.06;
    ctx.globalCompositeOperation = 'lighter';
    const glR = Math.max(met.width, fs) * 0.65;
    const glG = ctx.createRadialGradient(x, y, 0, x, y, glR);
    glG.addColorStop(0, '#FFB300');
    glG.addColorStop(0.6, 'rgba(255,179,0,0.2)');
    glG.addColorStop(1, 'rgba(255,179,0,0)');
    ctx.fillStyle = glG;
    ctx.beginPath();
    ctx.ellipse(x, y, glR, glR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ═══════════════════ DRAW: ORNAMENTS ═══════════════════ */

  function drawTilak(ctx: CanvasRenderingContext2D, op: number, l: Layout) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op * 0.8;
    const cx = l.cx, y = l.ty - l.fs * 0.18;
    const sz = l.fs * 0.1;
    // U shape
    ctx.beginPath();
    ctx.arc(cx, y + sz * 0.5, sz * 0.55, Math.PI, 0, false);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = Math.max(1.8, sz * 0.14);
    ctx.lineCap = 'round';
    ctx.stroke();
    // Chandan dot
    ctx.beginPath();
    ctx.arc(cx, y + sz * 0.08, sz * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    // Glow
    const gg = ctx.createRadialGradient(cx, y + sz * 0.3, 0, cx, y + sz * 0.3, sz * 1.5);
    gg.addColorStop(0, 'rgba(255,215,0,0.06)');
    gg.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(cx, y + sz * 0.3, sz * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSwash(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op * 0.65;
    const startX = l.tx + l.tw * 0.72;
    const y = l.ty + l.th + l.fs * 0.06;
    const sw = l.tw * 0.38;
    const sh = l.fs * 0.09;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.bezierCurveTo(startX + sw * 0.25, y + sh * 2, startX + sw * 0.5, y + sh * 0.6, startX + sw * 0.7, y + sh * 0.15);
    ctx.quadraticCurveTo(startX + sw * 0.85, y - sh * 0.1, startX + sw, y + sh * 0.4);
    ctx.strokeStyle = '#C59B27';
    ctx.lineWidth = Math.max(1.2, l.fs * 0.013);
    ctx.lineCap = 'round';
    ctx.stroke();
    // End curl
    ctx.beginPath();
    ctx.arc(startX + sw, y + sh * 0.4, l.fs * 0.016, 0, Math.PI * 1.4);
    ctx.strokeStyle = '#8A5A0A';
    ctx.lineWidth = Math.max(0.8, l.fs * 0.009);
    ctx.stroke();
    // Sparkle
    const st = (Math.sin(time * 1.3) * 0.5 + 0.5);
    const spX = startX + sw * st, spY = y + sh * (1 - st) * 0.7;
    const spG = ctx.createRadialGradient(spX, spY, 0, spX, spY, 3.5);
    spG.addColorStop(0, `rgba(255,241,168,${0.45 * op})`);
    spG.addColorStop(1, 'rgba(255,241,168,0)');
    ctx.fillStyle = spG;
    ctx.beginPath();
    ctx.arc(spX, spY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStarbursts(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    const fs = l.fs, y = l.cy - l.h * 0.04;
    const positions = [{rx:-0.36,ry:-0.32},{rx:0.12,ry:-0.36},{rx:0.4,ry:-0.22}];
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const pulse = 0.4 + Math.sin(time * 1.1 + i * 2.8) * 0.6;
      if (pulse < 0.3) continue;
      const sx = l.cx + p.rx * l.tw, sy = y + p.ry * fs;
      const sz = fs * 0.055 * (0.7 + pulse * 0.3);
      ctx.save();
      ctx.globalAlpha = op * pulse * 0.5;
      ctx.strokeStyle = 'rgba(255,241,168,0.6)';
      ctx.lineWidth = 0.7;
      for (let a = 0; a < 4; a++) {
        const ang = (a / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(ang) * sz, sy + Math.sin(ang) * sz);
        ctx.stroke();
      }
      const cg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sz * 0.35);
      cg.addColorStop(0, 'rgba(255,255,230,0.5)');
      cg.addColorStop(1, 'rgba(255,255,230,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(sx, sy, sz * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ═══════════════════ DRAW: GREETING ═══════════════════ */

  function drawDivider(ctx: CanvasRenderingContext2D, y: number, op: number, l: Layout) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha = op * 0.75;
    const halfW = l.tw * 0.42, cx = l.cx;
    const lw = Math.max(0.5, l.fs * 0.004);
    // Left
    const lg = ctx.createLinearGradient(cx - halfW, 0, cx - 6, 0);
    lg.addColorStop(0, 'rgba(197,155,39,0)');
    lg.addColorStop(0.25, 'rgba(197,155,39,0.5)');
    lg.addColorStop(1, 'rgba(255,215,0,0.7)');
    ctx.strokeStyle = lg; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx - 6, y); ctx.stroke();
    // Right
    const rg = ctx.createLinearGradient(cx + 6, 0, cx + halfW, 0);
    rg.addColorStop(0, 'rgba(255,215,0,0.7)');
    rg.addColorStop(0.75, 'rgba(197,155,39,0.5)');
    rg.addColorStop(1, 'rgba(197,155,39,0)');
    ctx.strokeStyle = rg;
    ctx.beginPath(); ctx.moveTo(cx + 6, y); ctx.lineTo(cx + halfW, y); ctx.stroke();
    // Center diamond
    const ds = Math.max(2.2, l.fs * 0.022);
    ctx.save(); ctx.translate(cx, y); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-ds / 2, -ds / 2, ds, ds);
    ctx.restore();
    // Tips glow
    for (const tx of [cx - halfW * 0.88, cx + halfW * 0.88]) {
      const tg = ctx.createRadialGradient(tx, y, 0, tx, y, 3.5);
      tg.addColorStop(0, 'rgba(255,215,0,0.25)');
      tg.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.arc(tx, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawGreeting(ctx: CanvasRenderingContext2D, op: number, l: Layout, time: number) {
    if (op <= 0) return;
    ctx.save();
    const fs = l.fs;
    const titleBottom = l.ty + l.th;
    const gap = fs * 0.22;

    const div1Y = titleBottom + gap * 0.5;
    drawDivider(ctx, div1Y, smoothstep(20.5, 21.3, time), l);

    const s1Size = Math.max(14, fs * 0.26);
    const s1Y = div1Y + gap * 0.85;
    ctx.globalAlpha = op * smoothstep(20.7, 21.5, time);
    ctx.font = `${s1Size}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dcc890';
    ctx.fillText(S1_TEXT, l.cx, s1Y);

    const s2Size = Math.max(16, fs * 0.3);
    const s2Y = s1Y + s1Size * 1.3;

    // Subtle glow
    ctx.globalAlpha = op * smoothstep(21.0, 22.0, time) * 0.06;
    ctx.globalCompositeOperation = 'lighter';
    ctx.font = `${s2Size}px ${FONT}`;
    ctx.fillStyle = '#FFB300';
    ctx.fillText(S2_TEXT, l.cx, s2Y);
    ctx.globalCompositeOperation = 'source-over';

    // Main text
    ctx.globalAlpha = op * smoothstep(21.0, 22.0, time);
    const s2g = ctx.createLinearGradient(l.cx - l.tw * 0.35, s2Y, l.cx + l.tw * 0.35, s2Y);
    s2g.addColorStop(0, '#C59B27');
    s2g.addColorStop(0.25, '#FFD700');
    s2g.addColorStop(0.5, '#FFE066');
    s2g.addColorStop(0.75, '#FFD700');
    s2g.addColorStop(1, '#C59B27');
    ctx.fillStyle = s2g;
    ctx.fillText(S2_TEXT, l.cx, s2Y);

    const div2Y = s2Y + s2Size * 0.85;
    drawDivider(ctx, div2Y, smoothstep(21.3, 22.0, time), l);

    ctx.restore();
  }

  /* ═══════════════════ POST-PROCESSING ═══════════════════ */

  function drawVignette(ctx: CanvasRenderingContext2D, l: Layout) {
    const g = ctx.createRadialGradient(l.cx, l.cy, l.w * 0.22, l.cx, l.cy, l.w * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    g.addColorStop(0.8, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.w, l.h);
  }

  function drawGrain(ctx: CanvasRenderingContext2D, l: Layout) {
    const gc = grainCvs.current;
    if (!gc) return;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.drawImage(gc, 0, 0, l.w, l.h);
    ctx.restore();
  }

  /* ═══════════════════ MAIN RENDER ═══════════════════ */

  function render(ts: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const l = L.current, dpr = l.dpr;
    const time = (ts - t0Ref.current) / 1000;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, l.w, l.h);
    const dt = Math.min(0.05, 1 / 60);

    /* ─── 25-SECOND TIMELINE ─── */

    // 0-3s: Sunrise | 3-8s: Temple+River | 8-13s: Deepotsav | 13-15.5s: Transition
    // 15.5-18.5s: Particles | 18.5-20.5s: Title | 20.5-25s: Greeting

    const sunriseOp = 1 - smoothstep(10, 13.5, time);
    const templeOp = smoothstep(3.0, 4.2, time) * (1 - smoothstep(13.0, 15.5, time));
    const riverOp = templeOp;
    const birdOp = smoothstep(3.5, 4.5, time) * (1 - smoothstep(11.0, 13.0, time));
    const diyaOp = smoothstep(8.0, 9.0, time) * (1 - smoothstep(13.0, 15.5, time));
    const fwOp = smoothstep(8.0, 9.0, time) * (1 - smoothstep(13.0, 15.5, time));

    const divineI = smoothstep(13.5, 15.0, time) * (1 - smoothstep(20, 23.0, time));

    const pStart = 15.5;
    const pFadeIn = smoothstep(pStart, pStart + 0.4, time);
    const pFadeOut = 1 - smoothstep(18.5, 20.5, time);
    const particleOp = pFadeIn * pFadeOut;
    const conv = clamp((time - pStart) / 2.5, 0, 1);
    const convE = easeInOutCubic(conv);

    const titleOp = smoothstep(18.5, 20.5, time);
    const greetingOp = smoothstep(20.5, 21.5, time);

    const dustOp = smoothstep(0, 0.4, time) * (1 - smoothstep(23.5, 25.0, time));
    const isGold = time > 13;

    // Fade in from black
    const fadeIn = smoothstep(0, 0.8, time);

    /* ─── 1. Background ─── */
    const dbg = ctx.createRadialGradient(l.cx, l.cy, 0, l.cx, l.cy, l.w * 0.7);
    dbg.addColorStop(0, '#120702');
    dbg.addColorStop(0.5, '#080401');
    dbg.addColorStop(1, '#000000');
    ctx.fillStyle = dbg;
    ctx.fillRect(0, 0, l.w, l.h);

    if (sunriseOp > 0) drawSunrise(ctx, sunriseOp * fadeIn, l, time);
    drawDivineLight(ctx, divineI, l, time);

    /* ─── 2. Atmosphere ─── */
    drawDust(ctx, dustOp * fadeIn, l, dt, isGold);

    /* ─── 3. Temple + River ─── */
    if (riverOp > 0) drawRiver(ctx, riverOp, l, time);
    if (templeOp > 0) {
      const tc = templeCvs.current;
      if (tc) {
        ctx.save();
        ctx.globalAlpha = templeOp;
        // Temple rises from bottom
        const riseOffset = (1 - smoothstep(3.0, 4.5, time)) * l.h * 0.15;
        ctx.translate(0, riseOffset);
        ctx.resetTransform();
        ctx.globalAlpha = templeOp;
        ctx.drawImage(tc, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.restore();
      }
    }
    drawBirds(ctx, birdOp, l, dt);
    drawDiyas(ctx, diyaOp, l, time, dt);
    if (fwOp > 0) {
      updateFireworks(l, dt, time);
      drawRockets(ctx, fwOp);
      drawSparks(ctx, fwOp, dt);
    }

    /* ─── 4. Central glow during convergence ─── */
    if (convE > 0.15) {
      const gi = (convE - 0.15) / 0.85;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const cg = ctx.createRadialGradient(l.cx, l.cy - l.h * 0.04, 0, l.cx, l.cy - l.h * 0.04, l.tw * 0.55);
      cg.addColorStop(0, `rgba(255,180,50,${0.035 * gi})`);
      cg.addColorStop(1, 'rgba(255,180,50,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, l.w, l.h);
      ctx.restore();
    }

    /* ─── 5. Gold particles ─── */
    drawGoldParticles(ctx, particleOp, convE, time, dt);

    /* ─── 6. Title + ornaments ─── */
    drawGoldTitle(ctx, titleOp, l, time);
    drawTilak(ctx, titleOp, l);
    drawSwash(ctx, titleOp, l, time);
    drawStarbursts(ctx, titleOp, l, time);

    /* ─── 7. Greeting ─── */
    drawGreeting(ctx, greetingOp, l, time);

    /* ─── 8. Post-processing ─── */
    drawVignette(ctx, l);
    drawGrain(ctx, l);

    /* ─── Loop ─── */
    if (time < 25.0) {
      rafRef.current = requestAnimationFrame(render);
    } else if (!doneRef.current) {
      doneRef.current = true;
      onComplete?.();
    }
  }

  /* ═══════════════════ INIT ═══════════════════ */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    const fs = Math.max(45, Math.min(130, w * 0.085));

    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const l = L.current;
    l.w = w; l.h = h; l.dpr = dpr;
    l.cx = w / 2; l.cy = h / 2; l.fs = fs;

    buildGrain(w, h);
    initDust(100);
    initStars();
    initBirds();
    initDiyas();
    initClouds();

    // Offscreen canvases
    const tc = document.createElement('canvas');
    tc.width = Math.ceil(w * dpr); tc.height = Math.ceil(h * dpr);
    titleCvs.current = tc;

    // Load font
    const linkEl = document.createElement('link');
    linkEl.href = 'https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi&display=swap';
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);

    const start = () => {
      buildMask();
      buildTemple();
      initGoldParticles();
      t0Ref.current = performance.now();
      rafRef.current = requestAnimationFrame(render);
    };

    document.fonts.load(`${fs}px "Tiro Devanagari Hindi"`).then(start).catch(start);
    const timeout = setTimeout(start, 4000);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeout);
      if (linkEl.parentNode) linkEl.parentNode.removeChild(linkEl);
      doneRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        display: 'block', background: '#000',
      }}
    />
  );
};

export default CinematicIntro;
