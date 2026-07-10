'use client';

import React, { useRef, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════
   CRYSTAL 2027 — Premium New Year Hero
   ═══════════════════════════════════════════════════════════ */

export default function NewYearCrystalHero() {
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    let w = 0, h = 0, dpr = 1, raf = 0, t0 = 0, run = true;

    /* ── Offscreen Canvases ── */
    const oCrys = document.createElement('canvas');
    const cCrys = oCrys.getContext('2d')!;
    const oCity = document.createElement('canvas');
    const cCity = oCity.getContext('2d')!;

    /* ── Utilities ── */
    const rn = (a: number, b: number) => a + Math.random() * (b - a);
    const TAU = Math.PI * 2;

    /* ── Particle Pool ── */
    interface Pt {
      x: number; y: number; vx: number; vy: number;
      sz: number; a: number; life: number; ml: number;
      r: number; g: number; b: number;
      tp: 'dust' | 'sparkle' | 'fog' | 'ring';
    }
    const MX = 400;
    const pts: Pt[] = [];
    for (let i = 0; i < MX; i++) pts.push({ x:0,y:0,vx:0,vy:0,sz:1,a:0,life:0,ml:1,r:251,g:191,b:36,tp:'dust' });
    let pc = 0;
    function sp(o: Partial<Pt>) {
      if (pc >= MX) return;
      const p = pts[pc];
      p.x=o.x??0; p.y=o.y??0; p.vx=o.vx??0; p.vy=o.vy??0;
      p.sz=o.sz??1; p.a=o.a??1; p.life=0; p.ml=o.ml??100;
      p.r=o.r??251; p.g=o.g??191; p.b=o.b??36; p.tp=o.tp??'dust';
      pc++;
    }

    /* ── City Data ── */
    interface Bld { x:number; y:number; w:number; h:number; wins:{x:number;y:number;c:string}[] }
    let buildings: Bld[] = [];

    function genCity() {
      buildings = [];
      oCity.width = w * dpr; oCity.height = h * dpr;
      cCity.setTransform(dpr, 0, 0, dpr, 0, 0);
      cCity.clearRect(0, 0, w, h);
      const baseY = h * 0.62;
      for (let x = -20; x < w + 20;) {
        const bw = rn(12, 38);
        const centerDist = Math.abs((x + bw / 2) / w - 0.5) * 2;
        const bh = rn(h * 0.06, h * 0.32) * (1 - centerDist * 0.55);
        const wins: {x:number;y:number;c:string}[] = [];
        for (let wy = baseY - bh + 4; wy < baseY - 3; wy += rn(5, 10)) {
          for (let wx = x + 2; wx < x + bw - 2; wx += rn(4, 9)) {
            if (Math.random() > 0.45) {
              wins.push({ x: wx, y: wy, c: Math.random() > 0.72 ? 'gold' : 'blue' });
            }
          }
        }
        buildings.push({ x, y: baseY, w: bw, h: bh, wins });
        x += bw + rn(1, 5);
      }
      // Render city to offscreen
      for (const b of buildings) {
        const g = cCity.createLinearGradient(b.x, b.y, b.x, b.y - b.h);
        g.addColorStop(0, 'rgba(8,12,28,0.95)');
        g.addColorStop(1, 'rgba(12,18,38,0.85)');
        cCity.fillStyle = g;
        cCity.fillRect(b.x, b.y - b.h, b.w, b.h);
        for (const wi of b.wins) {
          cCity.fillStyle = wi.c === 'gold'
            ? `rgba(251,191,36,${rn(0.15, 0.5)})`
            : `rgba(37,99,235,${rn(0.1, 0.35)})`;
          cCity.fillRect(wi.x, wi.y, 2, 2);
        }
      }
      // Blur pass — simple box blur via scale down/up
      const tmp = document.createElement('canvas');
      const tCtx = tmp.getContext('2d')!;
      const sw = Math.floor(w * dpr * 0.25);
      const sh = Math.floor(h * dpr * 0.25);
      tmp.width = sw; tmp.height = sh;
      tCtx.drawImage(oCity, 0, 0, sw, sh);
      cCity.clearRect(0, 0, oCity.width, oCity.height);
      cCity.setTransform(1, 0, 0, 1, 0, 0);
      cCity.imageSmoothingEnabled = true;
      cCity.drawImage(tmp, 0, 0, oCity.width, oCity.height);
      cCity.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* ── Crystal 2027 Renderer ── */
    let crysW = 0, crysH = 0, fontSize = 0;

    function renderCrystal(t: number) {
      cCrys.clearRect(0, 0, crysW, crysH);
      cCrys.save();
      cCrys.translate(crysW / 2, crysH / 2);

      // 3D float & rotation
      const floatY = Math.sin(t * 1.05) * 6;
      const rotScale = 0.92 + Math.cos(t * 0.52) * 0.08;
      const breath = 1 + Math.sin(t * 1.57) * 0.012;
      cCrys.translate(0, floatY);
      cCrys.scale(rotScale * breath, breath);

      const text = '2027';
      cCrys.font = `900 ${fontSize}px "SF Pro Display","Inter","Segoe UI",system-ui,sans-serif`;
      cCrys.textAlign = 'center';
      cCrys.textBaseline = 'middle';

      // Pass 1 — Depth shadow
      cCrys.shadowColor = 'rgba(0,0,0,0.6)';
      cCrys.shadowBlur = 35;
      cCrys.shadowOffsetX = 4;
      cCrys.shadowOffsetY = 12;
      cCrys.fillStyle = 'rgba(0,0,0,0.2)';
      cCrys.fillText(text, 0, 0);
      cCrys.shadowColor = 'transparent';
      cCrys.shadowBlur = 0;
      cCrys.shadowOffsetX = 0;
      cCrys.shadowOffsetY = 0;

      // Pass 2 — Gold edge stroke
      const tw = cCrys.measureText(text).width;
      const gg = cCrys.createLinearGradient(-tw / 2, 0, tw / 2, 0);
      gg.addColorStop(0, '#6B4E14');
      gg.addColorStop(0.2, '#D4A017');
      gg.addColorStop(0.4, '#FBBF24');
      gg.addColorStop(0.5, '#FFF8DC');
      gg.addColorStop(0.6, '#FBBF24');
      gg.addColorStop(0.8, '#D4A017');
      gg.addColorStop(1, '#6B4E14');
      cCrys.strokeStyle = gg;
      cCrys.lineWidth = Math.max(2, fontSize * 0.02);
      cCrys.lineJoin = 'round';
      cCrys.strokeText(text, 0, 0);

      // Pass 3 — Inner gold stroke (thinner, brighter)
      cCrys.strokeStyle = 'rgba(251,191,36,0.25)';
      cCrys.lineWidth = Math.max(1, fontSize * 0.008);
      cCrys.strokeText(text, 0, 0);

      // Pass 4 — Glass fill
      const gf = cCrys.createLinearGradient(0, -fontSize * 0.55, 0, fontSize * 0.55);
      gf.addColorStop(0, 'rgba(120,160,255,0.18)');
      gf.addColorStop(0.25, 'rgba(180,200,255,0.06)');
      gf.addColorStop(0.42, 'rgba(255,255,255,0.22)');
      gf.addColorStop(0.52, 'rgba(255,255,255,0.18)');
      gf.addColorStop(0.65, 'rgba(200,170,80,0.08)');
      gf.addColorStop(0.85, 'rgba(251,191,36,0.1)');
      gf.addColorStop(1, 'rgba(180,140,40,0.15)');
      cCrys.fillStyle = gf;
      cCrys.fillText(text, 0, 0);

      // Pass 5 — Facet lines (source-atop)
      cCrys.globalCompositeOperation = 'source-atop';
      cCrys.strokeStyle = 'rgba(255,255,255,0.045)';
      cCrys.lineWidth = 0.5;
      for (let i = -tw * 1.2; i < tw * 1.2; i += 14) {
        cCrys.beginPath();
        cCrys.moveTo(i, -fontSize * 0.6);
        cCrys.lineTo(i + fontSize * 0.8, fontSize * 0.6);
        cCrys.stroke();
      }
      // Horizontal facets
      for (let j = -fontSize * 0.5; j < fontSize * 0.5; j += 18) {
        cCrys.beginPath();
        cCrys.moveTo(-tw * 0.6, j);
        cCrys.lineTo(tw * 0.6, j);
        cCrys.stroke();
      }

      // Pass 6 — Chromatic dispersion
      cCrys.globalAlpha = 0.07;
      cCrys.fillStyle = '#ff4444';
      cCrys.fillText(text, -1.5, 0);
      cCrys.fillStyle = '#4444ff';
      cCrys.fillText(text, 1.5, 0);
      cCrys.globalAlpha = 1;

      // Pass 7 — Light sweep
      const sweepPeriod = 4.5;
      const sweepPhase = (t % sweepPeriod) / sweepPeriod;
      if (sweepPhase < 0.4) {
        const sp = sweepPhase / 0.4;
        const sx = -tw * 0.7 + sp * tw * 1.8;
        const sg = cCrys.createLinearGradient(sx - 60, 0, sx + 60, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)');
        sg.addColorStop(0.4, 'rgba(255,255,255,0.3)');
        sg.addColorStop(0.5, 'rgba(255,255,255,0.45)');
        sg.addColorStop(0.6, 'rgba(255,255,255,0.3)');
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        cCrys.fillStyle = sg;
        cCrys.fillRect(-tw, -fontSize * 0.6, tw * 2, fontSize * 1.2);
      }

      // Pass 8 — Top-edge highlight
      cCrys.globalAlpha = 0.15 + Math.sin(t * 2) * 0.05;
      const thg = cCrys.createLinearGradient(0, -fontSize * 0.55, 0, -fontSize * 0.25);
      thg.addColorStop(0, 'rgba(255,255,255,0.6)');
      thg.addColorStop(1, 'rgba(255,255,255,0)');
      cCrys.fillStyle = thg;
      cCrys.fillText(text, 0, 0);
      cCrys.globalAlpha = 1;

      // Pass 9 — Sparkle points
      const sparkleSeed = Math.floor(t * 2);
      for (let i = 0; i < 8; i++) {
        const si = sparkleSeed + i * 137;
        const hash = ((si * 2654435761) >>> 0) / 4294967296;
        const sx = (hash - 0.5) * tw * 0.9;
        const sy = (((si * 340573321) >>> 0) / 4294967296 - 0.5) * fontSize * 0.7;
        const sa = (Math.sin(t * 5 + i * 2.3) * 0.5 + 0.5) * 0.8;
        if (sa > 0.2) {
          const ssz = 1 + sa * 2.5;
          const sgr = cCrys.createRadialGradient(sx, sy, 0, sx, sy, ssz * 3);
          sgr.addColorStop(0, `rgba(255,255,255,${sa})`);
          sgr.addColorStop(1, 'rgba(255,255,255,0)');
          cCrys.fillStyle = sgr;
          cCrys.beginPath();
          cCrys.arc(sx, sy, ssz * 3, 0, TAU);
          cCrys.fill();
          cCrys.fillStyle = '#fff';
          cCrys.beginPath();
          cCrys.arc(sx, sy, ssz * 0.4, 0, TAU);
          cCrys.fill();
        }
      }

      cCrys.globalCompositeOperation = 'source-over';
      cCrys.restore();
    }

    /* ── Resize ── */
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv!.width = w * dpr; cv!.height = h * dpr;
      cv!.style.width = w + 'px'; cv!.style.height = h + 'px';
      fontSize = Math.min(w * 0.18, 180);
      const tw = fontSize * 2.8;
      crysW = Math.ceil(tw * dpr);
      crysH = Math.ceil(fontSize * 1.6 * dpr);
      oCrys.width = crysW; oCrys.height = crysH;
      cCrys.setTransform(dpr, 0, 0, dpr, 0, 0);
      genCity();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── Main Loop ── */
    const animate = (ts: number) => {
      if (!run) return;
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = w / 2;
      const crysY = h * 0.38;
      const floorY = h * 0.6;

      /* ─ 1. SKY ─ */
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#030510');
      sky.addColorStop(0.4, '#050816');
      sky.addColorStop(0.7, '#080d22');
      sky.addColorStop(1, '#0a1028');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      /* ─ 2. STARS ─ */
      if (Math.random() < 0.15) {
        sp({ x:rn(0,w), y:rn(0,h*0.5), vx:0, vy:0, sz:rn(0.3,1.2), a:rn(0.2,0.7), ml:rn(60,150), r:200,g:210,b:255, tp:'dust' });
      }

      /* ─ 3. CITY ─ */
      ctx.globalAlpha = 0.5;
      ctx.drawImage(oCity, 0, 0, w, h);
      ctx.globalAlpha = 1;

      /* ─ 4. CITY AMBIENT GLOW ─ */
      const ambG = ctx.createRadialGradient(cx, h * 0.65, 0, cx, h * 0.65, w * 0.6);
      ambG.addColorStop(0, 'rgba(37,99,235,0.06)');
      ambG.addColorStop(0.5, 'rgba(251,191,36,0.02)');
      ambG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ambG;
      ctx.fillRect(0, 0, w, h);

      /* ─ 5. GLASS FLOOR ─ */
      const flG = ctx.createLinearGradient(0, floorY - 3, 0, floorY + 50);
      flG.addColorStop(0, 'rgba(100,150,255,0.07)');
      flG.addColorStop(0.3, 'rgba(150,180,255,0.03)');
      flG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = flG;
      ctx.fillRect(w * 0.05, floorY - 3, w * 0.9, 53);
      ctx.strokeStyle = 'rgba(120,160,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, floorY);
      ctx.lineTo(w * 0.92, floorY);
      ctx.stroke();

      /* ─ 6. REFLECTION ─ */
      renderCrystal(t);
      ctx.save();
      ctx.translate(0, 2 * floorY);
      ctx.scale(1, -1);
      ctx.globalAlpha = 0.12;
      ctx.drawImage(oCrys, cx - crysW / (2 * dpr), crysY - crysH / (2 * dpr), crysW / dpr, crysH / dpr);
      ctx.restore();
      // Fade reflection
      const rfG = ctx.createLinearGradient(0, floorY, 0, floorY + 120);
      rfG.addColorStop(0, 'rgba(5,8,22,0)');
      rfG.addColorStop(1, 'rgba(5,8,22,1)');
      ctx.fillStyle = rfG;
      ctx.fillRect(0, floorY, w, 120);

      /* ─ 7. GOLDEN FOG ─ */
      for (let i = 0; i < 3; i++) {
        const fx = cx + Math.sin(t * 0.3 + i * 2.1) * w * 0.25;
        const fy = floorY + 10 + i * 15;
        const fr = w * (0.25 + i * 0.1);
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
        fg.addColorStop(0, `rgba(251,191,36,${0.04 - i * 0.01})`);
        fg.addColorStop(0.5, `rgba(200,150,40,${0.02 - i * 0.005})`);
        fg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fg;
        ctx.fillRect(0, floorY - 20, w, 100);
      }

      /* ─ 8. ENERGY RING ─ */
      const ringRx = fontSize * 1.6;
      const ringRy = fontSize * 0.35;
      ctx.save();
      ctx.translate(cx, crysY);
      // Outer glow ring
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRx, ringRy, 0, 0, TAU);
      const rgG = ctx.createLinearGradient(-ringRx, 0, ringRx, 0);
      rgG.addColorStop(0, 'rgba(251,191,36,0)');
      rgG.addColorStop(0.25, 'rgba(251,191,36,0.15)');
      rgG.addColorStop(0.5, 'rgba(255,255,255,0.25)');
      rgG.addColorStop(0.75, 'rgba(251,191,36,0.15)');
      rgG.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.strokeStyle = rgG;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 10]);
      ctx.lineDashOffset = -t * 30;
      ctx.stroke();
      ctx.setLineDash([]);
      // Second ring (counter-rotate)
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRx * 1.08, ringRy * 1.1, 0, 0, TAU);
      ctx.strokeStyle = 'rgba(37,99,235,0.06)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 18]);
      ctx.lineDashOffset = t * 20;
      ctx.stroke();
      ctx.setLineDash([]);
      // Orbiting particles
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + t * 0.45;
        const px = Math.cos(a) * ringRx;
        const py = Math.sin(a) * ringRy;
        const pa = 0.3 + Math.sin(t * 3 + i * 1.7) * 0.3;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 5);
        pg.addColorStop(0, `rgba(251,191,36,${pa})`);
        pg.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(255,248,220,${pa})`;
        ctx.beginPath(); ctx.arc(px, py, 1.2, 0, TAU); ctx.fill();
      }
      ctx.restore();

      // Spawn ring particles
      if (Math.random() < 0.3) {
        const a = rn(0, TAU);
        sp({
          x: cx + Math.cos(a) * ringRx, y: crysY + Math.sin(a) * ringRy,
          vx: Math.cos(a + 1.5) * 0.3, vy: Math.sin(a + 1.5) * 0.15 - 0.1,
          sz: rn(0.5, 1.5), a: 0.6, ml: rn(30, 60),
          r: 251, g: 191, b: 36, tp: 'ring'
        });
      }

      /* ─ 9. CRYSTAL 2027 (main) ─ */
      ctx.drawImage(oCrys, cx - crysW / (2 * dpr), crysY - crysH / (2 * dpr), crysW / dpr, crysH / dpr);

      /* ─ 10. GOLD RIM LIGHT ─ */
      const rimG = ctx.createRadialGradient(cx, crysY, fontSize * 0.5, cx, crysY, fontSize * 1.4);
      rimG.addColorStop(0, 'rgba(251,191,36,0)');
      rimG.addColorStop(0.6, 'rgba(251,191,36,0.04)');
      rimG.addColorStop(0.85, 'rgba(251,191,36,0.08)');
      rimG.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = rimG;
      ctx.fillRect(cx - fontSize * 1.5, crysY - fontSize, fontSize * 3, fontSize * 2);

      /* ─ 11. LIGHT RAYS ─ */
      for (let i = 0; i < 3; i++) {
        const rayPhase = (t * 0.15 + i * 0.33) % 1;
        if (rayPhase < 0.25) {
          const rp = rayPhase / 0.25;
          const ra = rp < 0.5 ? rp * 2 : 2 - rp * 2;
          const ang = -0.4 + i * 0.4 + Math.sin(t * 0.3 + i) * 0.1;
          ctx.save();
          ctx.translate(cx, crysY - fontSize * 0.3);
          ctx.rotate(ang);
          ctx.globalAlpha = ra * 0.06;
          const rayG = ctx.createLinearGradient(0, 0, 0, -h * 0.5);
          rayG.addColorStop(0, 'rgba(255,248,220,0.8)');
          rayG.addColorStop(0.3, 'rgba(251,191,36,0.3)');
          rayG.addColorStop(1, 'rgba(251,191,36,0)');
          ctx.fillStyle = rayG;
          ctx.beginPath();
          ctx.moveTo(-3, 0); ctx.lineTo(-20, -h * 0.5);
          ctx.lineTo(20, -h * 0.5); ctx.lineTo(3, 0);
          ctx.fill();
          ctx.restore();
        }
      }

      /* ─ 12. LENS FLARE ─ */
      const flarePhase = (t * 0.12) % 1;
      if (flarePhase < 0.15) {
        const fa = (flarePhase / 0.15);
        const fi = fa < 0.5 ? fa * 2 : 2 - fa * 2;
        const fx = cx + fontSize * 0.3;
        const fy = crysY - fontSize * 0.25;
        ctx.save();
        ctx.globalAlpha = fi * 0.12;
        // Horizontal streak
        const flG = ctx.createLinearGradient(fx - 80, fy, fx + 80, fy);
        flG.addColorStop(0, 'rgba(255,248,220,0)');
        flG.addColorStop(0.4, 'rgba(255,248,220,0.6)');
        flG.addColorStop(0.5, 'rgba(255,255,255,0.9)');
        flG.addColorStop(0.6, 'rgba(255,248,220,0.6)');
        flG.addColorStop(1, 'rgba(255,248,220,0)');
        ctx.fillStyle = flG;
        ctx.fillRect(fx - 80, fy - 1.5, 160, 3);
        // Core glow
        const fcG = ctx.createRadialGradient(fx, fy, 0, fx, fy, 15);
        fcG.addColorStop(0, `rgba(255,255,255,${fi * 0.8})`);
        fcG.addColorStop(0.3, `rgba(251,191,36,${fi * 0.3})`);
        fcG.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = fcG;
        ctx.beginPath(); ctx.arc(fx, fy, 15, 0, TAU); ctx.fill();
        ctx.restore();
      }

      /* ─ 13. SPAWN AMBIENT PARTICLES ─ */
      if (Math.random() < 0.35) {
        sp({
          x: rn(0, w), y: rn(h * 0.15, h * 0.75),
          vx: rn(-0.15, 0.15), vy: rn(-0.3, -0.05),
          sz: rn(0.4, 1.5), a: rn(0.1, 0.3), ml: rn(120, 250),
          r: 251, g: 191, b: 36, tp: 'dust'
        });
      }
      if (Math.random() < 0.08) {
        sp({
          x: rn(cx - fontSize, cx + fontSize), y: rn(crysY - fontSize, crysY + fontSize * 0.5),
          vx: rn(-0.3, 0.3), vy: rn(-0.5, 0.1),
          sz: rn(0.8, 2.5), a: 0.9, ml: rn(20, 50),
          r: 255, g: 250, b: 220, tp: 'sparkle'
        });
      }
      if (Math.random() < 0.15) {
        sp({
          x: rn(w * 0.1, w * 0.9), y: floorY + rn(-10, 30),
          vx: rn(-0.3, 0.3), vy: rn(0.05, 0.2),
          sz: rn(15, 40), a: 0.03, ml: rn(80, 160),
          r: 251, g: 191, b: 36, tp: 'fog'
        });
      }

      /* ─ 14. UPDATE & DRAW PARTICLES ─ */
      let alive = 0;
      for (let i = 0; i < pc; i++) {
        const p = pts[i];
        p.life++;
        if (p.life >= p.ml) continue;
        p.x += p.vx; p.y += p.vy;
        const lt = p.life / p.ml;
        let al = p.a;
        if (p.tp === 'dust') { al *= (1 - lt); p.vy -= 0.002; }
        else if (p.tp === 'sparkle') { al *= (1 - lt * lt); }
        else if (p.tp === 'ring') { al *= (1 - lt); p.vx *= 0.98; p.vy *= 0.98; }
        else if (p.tp === 'fog') { al *= Math.sin(lt * Math.PI) * 0.5; }
        if (al < 0.005) continue;

        ctx.save();
        ctx.globalAlpha = al;
        if (p.tp === 'fog') {
          const fg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
          fg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.15)`);
          fg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.fillStyle = fg;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        } else if (p.tp === 'sparkle') {
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.shadowColor = `rgb(${p.r},${p.g},${p.b})`;
          ctx.shadowBlur = p.sz * 4;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        }
        ctx.restore();
        pts[alive++] = p;
      }
      pc = alive;

      /* ─ 15. BLOOM OVERLAY ─ */
      const blG = ctx.createRadialGradient(cx, crysY, 0, cx, crysY, fontSize * 2);
      blG.addColorStop(0, 'rgba(251,191,36,0.025)');
      blG.addColorStop(0.3, 'rgba(251,191,36,0.015)');
      blG.addColorStop(0.6, 'rgba(37,99,235,0.008)');
      blG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = blG;
      ctx.fillRect(0, 0, w, h);

      /* ─ 16. TEXT ─ */
      const textA = Math.min(1, cl((t - 0.5) / 1.5, 0, 1));
      if (textA > 0.01) {
        ctx.save();
        ctx.globalAlpha = textA;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // "NEW YEAR"
        const nyY = h * 0.78;
        const nySz = Math.min(w * 0.05, 42);
        ctx.font = `200 ${nySz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${nySz * 0.35}px`;
        const nyG = ctx.createLinearGradient(cx - 150, nyY, cx + 150, nyY);
        nyG.addColorStop(0, 'rgba(180,180,200,0.6)');
        nyG.addColorStop(0.3, 'rgba(251,191,36,0.85)');
        nyG.addColorStop(0.5, 'rgba(255,255,255,0.95)');
        nyG.addColorStop(0.7, 'rgba(251,191,36,0.85)');
        nyG.addColorStop(1, 'rgba(180,180,200,0.6)');
        ctx.fillStyle = nyG;
        ctx.shadowColor = 'rgba(251,191,36,0.3)';
        ctx.shadowBlur = 15;
        ctx.fillText('NEW YEAR', cx, nyY);
        ctx.shadowBlur = 0;

        // Decorative line
        const lineW = Math.min(w * 0.25, 200) * textA;
        const dlG = ctx.createLinearGradient(cx - lineW, 0, cx + lineW, 0);
        dlG.addColorStop(0, 'rgba(251,191,36,0)');
        dlG.addColorStop(0.3, 'rgba(251,191,36,0.4)');
        dlG.addColorStop(0.5, 'rgba(255,255,255,0.6)');
        dlG.addColorStop(0.7, 'rgba(251,191,36,0.4)');
        dlG.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.strokeStyle = dlG;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - lineW, nyY + nySz * 0.8);
        ctx.lineTo(cx + lineW, nyY + nySz * 0.8);
        ctx.stroke();

        // "NEW BEGINNING"
        const nbY = nyY + nySz * 1.4;
        const nbSz = Math.min(w * 0.038, 32);
        ctx.font = `300 ${nbSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${nbSz * 0.3}px`;
        ctx.fillStyle = 'rgba(200,200,220,0.7)';
        ctx.shadowColor = 'rgba(251,191,36,0.15)';
        ctx.shadowBlur = 8;
        ctx.fillText('NEW BEGINNING', cx, nbY);
        ctx.shadowBlur = 0;

        // "Welcome to 2027"
        const wtY = h * 0.88;
        const wtSz = Math.min(w * 0.022, 18);
        ctx.font = `300 ${wtSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${wtSz * 0.2}px`;
        ctx.fillStyle = 'rgba(150,160,190,0.5)';
        ctx.fillText('Welcome to 2027', cx, wtY);

        ctx.restore();
      }

      /* ─ 17. VIGNETTE ─ */
      const vg = ctx.createRadialGradient(cx, h * 0.45, Math.min(w, h) * 0.3, cx, h * 0.45, Math.max(w, h) * 0.85);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.7, 'rgba(0,0,0,0.15)');
      vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      /* ─ 18. TOP GRADIENT (depth) ─ */
      const tg = ctx.createLinearGradient(0, 0, 0, h * 0.15);
      tg.addColorStop(0, 'rgba(3,5,16,0.6)');
      tg.addColorStop(1, 'rgba(3,5,16,0)');
      ctx.fillStyle = tg;
      ctx.fillRect(0, 0, w, h * 0.15);

      raf = requestAnimationFrame(animate);
    };

    function cl(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

    raf = requestAnimationFrame(animate);
    return () => {
      run = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={cvRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        display: 'block', background: '#030510',
        zIndex: 9999,
      }}
    />
  );
}
