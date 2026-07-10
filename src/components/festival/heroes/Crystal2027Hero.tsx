'use client';

import React, { useRef, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════
   CRYSTAL 2027 — Premium New Year Cinematic Hero (Enhanced Crystal)
   ═══════════════════════════════════════════════════════════ */

interface Props { onComplete: () => void; }

export default function NewYearCrystalHero({ onComplete }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const ocRef = useRef(onComplete);

  useEffect(() => { ocRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d', { alpha: false })!;
    let w = 0, h = 0, dpr = 1, raf = 0, t0 = 0, run = true;
    const doneRef = { v: false };

    const rn = (a: number, b: number) => a + Math.random() * (b - a);
    const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
    const TAU = Math.PI * 2;

    /* ── Particle Pool ── */
    interface Pt {
      x: number; y: number; vx: number; vy: number;
      sz: number; a: number; life: number; ml: number;
      r: number; g: number; b: number;
      tp: 'dust' | 'sparkle' | 'fog' | 'ring';
    }
    const MX = 500;
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

    /* ── City ── */
    interface Bld { x:number;y:number;w:number;h:number;wins:{x:number;y:number;c:string}[] }
    const oCity = document.createElement('canvas');
    const cCity = oCity.getContext('2d')!;

    function genCity() {
      oCity.width = w; oCity.height = h;
      cCity.clearRect(0, 0, w, h);
      const baseY = h * 0.64;
      for (let x = -10; x < w + 10;) {
        const bw = rn(14, 42);
        const cd = Math.abs((x + bw / 2) / w - 0.5) * 2;
        const bh = rn(h * 0.08, h * 0.35) * (1 - cd * 0.5);
        const wins: {x:number;y:number;c:string}[] = [];
        for (let wy = baseY - bh + 5; wy < baseY - 4; wy += rn(6, 11)) {
          for (let wx = x + 3; wx < x + bw - 3; wx += rn(4, 8)) {
            if (Math.random() > 0.4) wins.push({ x: wx, y: wy, c: Math.random() > 0.7 ? 'g' : 'b' });
          }
        }
        const b: Bld = { x, y: baseY, w: bw, h: bh, wins };
        const g = cCity.createLinearGradient(b.x, b.y, b.x, b.y - b.h);
        g.addColorStop(0, '#0a0e24'); g.addColorStop(1, '#0d1230');
        cCity.fillStyle = g;
        cCity.fillRect(b.x, b.y - b.h, b.w, b.h);
        cCity.fillStyle = 'rgba(37,99,235,0.12)';
        cCity.fillRect(b.x, b.y - b.h, b.w, 1);
        for (const wi of b.wins) {
          cCity.fillStyle = wi.c === 'g' ? `rgba(251,191,36,${rn(0.2,0.6)})` : `rgba(37,99,235,${rn(0.15,0.4)})`;
          cCity.fillRect(wi.x, wi.y, 2.5, 2.5);
        }
        x += bw + rn(1, 4);
      }
      const tmp = document.createElement('canvas');
      tmp.width = Math.floor(w * 0.2); tmp.height = Math.floor(h * 0.2);
      tmp.getContext('2d')!.drawImage(oCity, 0, 0, tmp.width, tmp.height);
      cCity.clearRect(0, 0, w, h);
      cCity.imageSmoothingEnabled = true;
      cCity.imageSmoothingQuality = 'high';
      cCity.drawImage(tmp, 0, 0, w, h);
    }

    /* ── Crystal Offscreen ── */
    const oCrys = document.createElement('canvas');
    const cCrys = oCrys.getContext('2d')!;
    let cW = 0, cH = 0, fSz = 0;

    /* ═══════════════════════════════════════════════════════
       ✨ ENHANCED CRYSTAL RENDERER — Shimmer + Facets + Refraction
       ═══════════════════════════════════════════════════════ */
    function renderCrystal(t: number) {
      cCrys.clearRect(0, 0, cW, cH);
      cCrys.save();
      cCrys.translate(cW / 2, cH / 2);

      // Enhanced floating — dual-frequency for organic feel
      const floatY = Math.sin(t * 0.7) * 10 + Math.sin(t * 1.4) * 4;
      const scaleX = 0.92 + Math.cos(t * 0.45) * 0.08;
      const breath = 1 + Math.sin(t * 1.2) * 0.018;
      cCrys.translate(0, floatY);
      cCrys.scale(scaleX * breath, breath);

      const txt = '2027';
      cCrys.font = `900 ${fSz}px "SF Pro Display","Inter","Segoe UI",system-ui,sans-serif`;
      cCrys.textAlign = 'center';
      cCrys.textBaseline = 'middle';
      const tw = cCrys.measureText(txt).width;

      // ── LAYER 1: Deep shadow ──
      cCrys.shadowColor = 'rgba(0,0,0,0.85)';
      cCrys.shadowBlur = 65;
      cCrys.shadowOffsetX = 4;
      cCrys.shadowOffsetY = 22;
      cCrys.fillStyle = 'rgba(0,0,0,0.45)';
      cCrys.fillText(txt, 0, 0);
      cCrys.shadowColor = 'transparent';
      cCrys.shadowBlur = 0;
      cCrys.shadowOffsetX = 0;
      cCrys.shadowOffsetY = 0;

      // ── LAYER 2: Outer gold glow ──
      cCrys.shadowColor = 'rgba(251,191,36,0.55)';
      cCrys.shadowBlur = 55;
      cCrys.fillStyle = 'rgba(251,191,36,0.12)';
      cCrys.fillText(txt, 0, 0);
      cCrys.shadowColor = 'transparent';
      cCrys.shadowBlur = 0;

      // ── LAYER 3: Thick gold edge (SHIMMER gradient — moves like CSS version) ──
      const shimOff = (t * 0.18) % 1;
      const eg = cCrys.createLinearGradient(
        -tw / 2 + shimOff * tw * 0.8, -fSz * 0.5,
        tw / 2 + shimOff * tw * 0.8, fSz * 0.5
      );
      eg.addColorStop(0, '#2A1F06');
      eg.addColorStop(0.08, '#6B4F1D');
      eg.addColorStop(0.2, '#B8860B');
      eg.addColorStop(0.3, '#FFD700');
      eg.addColorStop(0.38, '#FFFACD');
      eg.addColorStop(0.42, '#FFFFFF');
      eg.addColorStop(0.48, '#FFFACD');
      eg.addColorStop(0.55, '#FFD700');
      eg.addColorStop(0.65, '#B8860B');
      eg.addColorStop(0.78, '#FFD700');
      eg.addColorStop(0.88, '#FFFACD');
      eg.addColorStop(0.95, '#B8860B');
      eg.addColorStop(1, '#2A1F06');
      cCrys.strokeStyle = eg;
      cCrys.lineWidth = Math.max(4.5, fSz * 0.038);
      cCrys.lineJoin = 'round';
      cCrys.strokeText(txt, 0, 0);

      // ── LAYER 4: Inner bright edge ──
      cCrys.strokeStyle = 'rgba(255,250,205,0.55)';
      cCrys.lineWidth = Math.max(1.5, fSz * 0.013);
      cCrys.strokeText(txt, 0, 0);

      // ── LAYER 5: Glass body fill — moving shimmer (CSS bg-position clone) ──
      const sPhase = (t * 0.22) % 1;
      const gf = cCrys.createLinearGradient(
        -tw / 2 + sPhase * tw * 0.6, -fSz * 0.5,
        tw / 2 - sPhase * tw * 0.6, fSz * 0.5
      );
      gf.addColorStop(0, 'rgba(70,110,255,0.38)');
      gf.addColorStop(0.12, 'rgba(130,170,255,0.18)');
      gf.addColorStop(0.25, 'rgba(255,255,255,0.45)');
      gf.addColorStop(0.35, 'rgba(255,250,205,0.3)');
      gf.addColorStop(0.45, 'rgba(251,191,36,0.32)');
      gf.addColorStop(0.55, 'rgba(255,255,255,0.4)');
      gf.addColorStop(0.65, 'rgba(190,210,255,0.22)');
      gf.addColorStop(0.78, 'rgba(251,191,36,0.22)');
      gf.addColorStop(0.9, 'rgba(255,255,255,0.3)');
      gf.addColorStop(1, 'rgba(170,130,40,0.32)');
      cCrys.fillStyle = gf;
      cCrys.fillText(txt, 0, 0);

      // ── LAYER 6: Vertical depth pass ──
      const gf2 = cCrys.createLinearGradient(0, -fSz * 0.5, 0, fSz * 0.5);
      gf2.addColorStop(0, 'rgba(255,255,255,0.18)');
      gf2.addColorStop(0.25, 'rgba(255,255,255,0)');
      gf2.addColorStop(0.6, 'rgba(251,191,36,0.12)');
      gf2.addColorStop(1, 'rgba(200,150,50,0.18)');
      cCrys.fillStyle = gf2;
      cCrys.fillText(txt, 0, 0);

      // ── LAYER 7: Crystal facet lines (clipped to text) ──
      cCrys.globalCompositeOperation = 'source-atop';

      // Diagonal facets
      cCrys.strokeStyle = 'rgba(255,255,255,0.07)';
      cCrys.lineWidth = 0.7;
      for (let i = -tw * 1.4; i < tw * 1.4; i += 9) {
        cCrys.beginPath();
        cCrys.moveTo(i, -fSz * 0.58);
        cCrys.lineTo(i + fSz * 0.55, fSz * 0.58);
        cCrys.stroke();
      }
      // Horizontal facets
      for (let j = -fSz * 0.48; j < fSz * 0.48; j += 11) {
        cCrys.beginPath();
        cCrys.moveTo(-tw * 0.58, j);
        cCrys.lineTo(tw * 0.58, j);
        cCrys.stroke();
      }
      // Moving highlight facet (simulates light hitting crystal face)
      const facetX = Math.sin(t * 0.65) * tw * 0.35;
      cCrys.strokeStyle = 'rgba(255,255,255,0.18)';
      cCrys.lineWidth = 2.2;
      cCrys.beginPath();
      cCrys.moveTo(facetX - fSz * 0.25, -fSz * 0.52);
      cCrys.lineTo(facetX + fSz * 0.25, fSz * 0.52);
      cCrys.stroke();
      // Second moving facet
      const facetX2 = Math.sin(t * 0.65 + 2) * tw * 0.3;
      cCrys.strokeStyle = 'rgba(251,191,36,0.1)';
      cCrys.lineWidth = 1.5;
      cCrys.beginPath();
      cCrys.moveTo(facetX2 - fSz * 0.2, -fSz * 0.48);
      cCrys.lineTo(facetX2 + fSz * 0.2, fSz * 0.48);
      cCrys.stroke();

      // ── LAYER 8: Enhanced chromatic aberration (RGB + slight green) ──
      cCrys.globalAlpha = 0.13;
      cCrys.fillStyle = '#ff2222';
      cCrys.fillText(txt, -3.5, -1);
      cCrys.fillStyle = '#2222ff';
      cCrys.fillText(txt, 3.5, 1);
      cCrys.globalAlpha = 0.05;
      cCrys.fillStyle = '#22ff44';
      cCrys.fillText(txt, 0, 3.5);
      cCrys.globalAlpha = 1;

      // ── LAYER 9: Multi-pass light sweep (CSS shimmer clone — 3 passes) ──
      for (let pass = 0; pass < 3; pass++) {
        const sPeriod = 3.2 + pass * 1.4;
        const sPhase2 = ((t + pass * 1.6) % sPeriod) / sPeriod;
        if (sPhase2 < 0.38) {
          const sp = sPhase2 / 0.38;
          const sx = -tw * 0.95 + sp * tw * 2.3;
          const sweepW = 55 + pass * 35;
          const peakAlpha = [0.65, 0.45, 0.3][pass];
          const sg = cCrys.createLinearGradient(sx - sweepW, 0, sx + sweepW, 0);
          sg.addColorStop(0, 'rgba(255,255,255,0)');
          sg.addColorStop(0.25, `rgba(255,255,255,${peakAlpha * 0.5})`);
          sg.addColorStop(0.5, `rgba(255,255,255,${peakAlpha})`);
          sg.addColorStop(0.75, `rgba(255,255,255,${peakAlpha * 0.5})`);
          sg.addColorStop(1, 'rgba(255,255,255,0)');
          cCrys.fillStyle = sg;
          cCrys.fillRect(-tw * 1.3, -fSz * 0.62, tw * 2.6, fSz * 1.24);
        }
      }

      // ── LAYER 10: Top highlight (pulsing) ──
      cCrys.globalAlpha = 0.28 + Math.sin(t * 2.1) * 0.08;
      const thg = cCrys.createLinearGradient(0, -fSz * 0.52, 0, -fSz * 0.08);
      thg.addColorStop(0, 'rgba(255,255,255,0.85)');
      thg.addColorStop(1, 'rgba(255,255,255,0)');
      cCrys.fillStyle = thg;
      cCrys.fillText(txt, 0, 0);
      cCrys.globalAlpha = 1;

      // ── LAYER 11: Bottom warm glow ──
      cCrys.globalAlpha = 0.16 + Math.sin(t * 1.4 + 1.2) * 0.05;
      const bg = cCrys.createLinearGradient(0, fSz * 0.08, 0, fSz * 0.52);
      bg.addColorStop(0, 'rgba(251,191,36,0)');
      bg.addColorStop(0.45, 'rgba(251,191,36,0.45)');
      bg.addColorStop(1, 'rgba(200,150,50,0.22)');
      cCrys.fillStyle = bg;
      cCrys.fillText(txt, 0, 0);
      cCrys.globalAlpha = 1;

      // ── LAYER 12: Enhanced sparkles with CROSS shape ──
      for (let i = 0; i < 20; i++) {
        const seed = Math.floor(t * 3.2) + i * 67;
        const hx = ((seed * 2654435761) >>> 0) / 4294967296;
        const hy = ((seed * 340573321) >>> 0) / 4294967296;
        const sx2 = (hx - 0.5) * tw * 0.92;
        const sy2 = (hy - 0.5) * fSz * 0.72;
        const sa = Math.pow(Math.sin(t * 5.5 + i * 1.6) * 0.5 + 0.5, 2.2);
        if (sa > 0.08) {
          const ssz = 0.8 + sa * 4.5;
          // Glow
          const sgr = cCrys.createRadialGradient(sx2, sy2, 0, sx2, sy2, ssz * 5.5);
          sgr.addColorStop(0, `rgba(255,255,255,${sa * 0.95})`);
          sgr.addColorStop(0.12, `rgba(255,250,205,${sa * 0.55})`);
          sgr.addColorStop(0.28, `rgba(251,191,36,${sa * 0.2})`);
          sgr.addColorStop(1, 'rgba(251,191,36,0)');
          cCrys.fillStyle = sgr;
          cCrys.beginPath(); cCrys.arc(sx2, sy2, ssz * 5.5, 0, TAU); cCrys.fill();
          // ✦ Cross sparkle lines
          const crossLen = ssz * 3.5;
          cCrys.strokeStyle = `rgba(255,255,255,${sa * 0.55})`;
          cCrys.lineWidth = 0.6;
          cCrys.beginPath(); cCrys.moveTo(sx2 - crossLen, sy2); cCrys.lineTo(sx2 + crossLen, sy2); cCrys.stroke();
          cCrys.beginPath(); cCrys.moveTo(sx2, sy2 - crossLen); cCrys.lineTo(sx2, sy2 + crossLen); cCrys.stroke();
          // Diagonal cross (smaller)
          const dLen = crossLen * 0.5;
          cCrys.strokeStyle = `rgba(251,191,36,${sa * 0.3})`;
          cCrys.lineWidth = 0.4;
          cCrys.beginPath(); cCrys.moveTo(sx2 - dLen, sy2 - dLen); cCrys.lineTo(sx2 + dLen, sy2 + dLen); cCrys.stroke();
          cCrys.beginPath(); cCrys.moveTo(sx2 + dLen, sy2 - dLen); cCrys.lineTo(sx2 - dLen, sy2 + dLen); cCrys.stroke();
          // Center bright dot
          cCrys.fillStyle = '#fff';
          cCrys.beginPath(); cCrys.arc(sx2, sy2, ssz * 0.55, 0, TAU); cCrys.fill();
        }
      }

      // ── LAYER 13: Rainbow edge refraction (crystal prism effect) ──
      cCrys.globalAlpha = 0.055;
      const rbPhase = t * 0.35;
      const spectrum = ['#ff0044','#ff6600','#ffcc00','#00ff66','#0088ff','#8800ff'];
      for (let i = 0; i < spectrum.length; i++) {
        const offset = Math.sin(rbPhase + i * 1.05) * 3.5;
        cCrys.strokeStyle = spectrum[i];
        cCrys.lineWidth = 0.9;
        cCrys.strokeText(txt, offset, offset * 0.45);
      }
      cCrys.globalAlpha = 1;

      cCrys.globalCompositeOperation = 'source-over';
      cCrys.restore();
    }

    /* ── Stars ── */
    const stars: {x:number;y:number;s:number;a:number;tw:number;to:number}[] = [];

    /* ── Resize ── */
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv!.width = w * dpr; cv!.height = h * dpr;
      cv!.style.width = w + 'px'; cv!.style.height = h + 'px';

      fSz = Math.min(w * 0.2, 200);
      cW = Math.ceil(fSz * 3);
      cH = Math.ceil(fSz * 1.6);
      oCrys.width = cW; oCrys.height = cH;

      genCity();
      stars.length = 0;
      for (let i = 0; i < 250; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h * 0.55,
          s: rn(0.3, 1.8), a: rn(0.15, 0.8),
          tw: rn(0.6, 3.5), to: rn(0, TAU)
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);

    /* ═══ TIMELINE ═══ */
    const T = {
      fadeIn: 0, cityIn: 0.5, crysIn: 1.2, textIn: 2.5,
      hold: 5.5, glowIn: 6.0, fadeOut: 7.0, end: 8.0,
    };

    /* ── Main Loop ── */
    const animate = (ts: number) => {
      if (!run) return;
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = w / 2;
      const crysY = h * 0.36;
      const floorY = h * 0.58;

      const fadeAlpha = 1 - eOC(cl((t - T.fadeOut) / (T.end - T.fadeOut), 0, 1));
      if (fadeAlpha <= 0.01) {
        if (!doneRef.v) { doneRef.v = true; ocRef.current(); }
        return;
      }

      /* ─ 1. SKY ─ */
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#020408');
      sky.addColorStop(0.3, '#050816');
      sky.addColorStop(0.6, '#080d22');
      sky.addColorStop(1, '#0c1230');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      /* ─ 2. STARS ─ */
      const starAlpha = eOC(cl((t - 0.2) / 1.5, 0, 1)) * (1 - eOC(cl((t - T.glowIn) / 2, 0, 1)) * 0.5);
      if (starAlpha > 0.01) {
        for (const s of stars) {
          const tw = 0.5 + 0.5 * Math.sin(t * s.tw + s.to);
          const a = s.a * tw * starAlpha;
          if (a < 0.01) continue;
          ctx.fillStyle = `rgba(200,215,255,${a})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
          if (s.s > 1.2) {
            const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.s * 4);
            sg.addColorStop(0, `rgba(180,200,255,${a * 0.25})`);
            sg.addColorStop(1, 'rgba(180,200,255,0)');
            ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(s.x, s.y, s.s * 4, 0, TAU); ctx.fill();
          }
        }
      }

      /* ─ 3. CITY ─ */
      const cityA = eOC(cl((t - T.cityIn) / 1.5, 0, 1)) * 0.45;
      if (cityA > 0.01) {
        ctx.save(); ctx.globalAlpha = cityA;
        ctx.drawImage(oCity, 0, 0, w, h);
        ctx.restore();
      }

      /* ─ 4. CITY GLOW ─ */
      const ambG = ctx.createRadialGradient(cx, h * 0.65, 0, cx, h * 0.65, w * 0.55);
      ambG.addColorStop(0, 'rgba(37,99,235,0.05)');
      ambG.addColorStop(0.4, 'rgba(251,191,36,0.02)');
      ambG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ambG;
      ctx.fillRect(0, 0, w, h);

      /* ─ 5. GLASS FLOOR ─ */
      const flA = eOC(cl((t - T.crysIn) / 1, 0, 1));
      if (flA > 0.01) {
        const flG = ctx.createLinearGradient(0, floorY - 2, 0, floorY + 40);
        flG.addColorStop(0, `rgba(100,160,255,${0.08 * flA})`);
        flG.addColorStop(0.4, `rgba(150,180,255,${0.03 * flA})`);
        flG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flG;
        ctx.fillRect(w * 0.03, floorY - 2, w * 0.94, 42);
        ctx.strokeStyle = `rgba(120,170,255,${0.1 * flA})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(w * 0.06, floorY); ctx.lineTo(w * 0.94, floorY); ctx.stroke();
      }

      /* ─ 6. REFLECTION ─ */
      const crysA = eOC(cl((t - T.crysIn) / 1.2, 0, 1));
      if (crysA > 0.01) {
        renderCrystal(t);
        ctx.save();
        ctx.translate(0, 2 * floorY);
        ctx.scale(1, -1);
        ctx.globalAlpha = crysA * 0.15;
        ctx.drawImage(oCrys, cx - cW / 2, crysY - cH / 2, cW, cH);
        ctx.restore();
        const rfG = ctx.createLinearGradient(0, floorY, 0, floorY + 100);
        rfG.addColorStop(0, 'rgba(5,8,22,0)');
        rfG.addColorStop(1, 'rgba(5,8,22,1)');
        ctx.fillStyle = rfG;
        ctx.fillRect(0, floorY, w, 100);
      }

      /* ─ 7. GOLDEN FOG ─ */
      if (crysA > 0.3) {
        for (let i = 0; i < 4; i++) {
          const fx = cx + Math.sin(t * 0.25 + i * 1.8) * w * 0.2;
          const fy = floorY + 5 + i * 12;
          const fr = w * (0.2 + i * 0.08);
          const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
          fg.addColorStop(0, `rgba(251,191,36,${0.05 * crysA})`);
          fg.addColorStop(0.5, `rgba(200,150,40,${0.025 * crysA})`);
          fg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = fg;
          ctx.fillRect(0, floorY - 15, w, 80);
        }
      }

      /* ─ 8. ENERGY RING ─ */
      if (crysA > 0.2) {
        const rRx = fSz * 1.55;
        const rRy = fSz * 0.32;
        ctx.save();
        ctx.translate(cx, crysY);
        ctx.globalAlpha = crysA;

        ctx.beginPath(); ctx.ellipse(0, 0, rRx, rRy, 0, 0, TAU);
        const rgG = ctx.createLinearGradient(-rRx, 0, rRx, 0);
        rgG.addColorStop(0, 'rgba(251,191,36,0)');
        rgG.addColorStop(0.2, 'rgba(251,191,36,0.2)');
        rgG.addColorStop(0.5, 'rgba(255,255,255,0.3)');
        rgG.addColorStop(0.8, 'rgba(251,191,36,0.2)');
        rgG.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.strokeStyle = rgG; ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 12]); ctx.lineDashOffset = -t * 25;
        ctx.stroke(); ctx.setLineDash([]);

        ctx.beginPath(); ctx.ellipse(0, 0, rRx * 1.1, rRy * 1.15, 0, 0, TAU);
        ctx.strokeStyle = 'rgba(37,99,235,0.08)'; ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 20]); ctx.lineDashOffset = t * 18;
        ctx.stroke(); ctx.setLineDash([]);

        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * TAU + t * 0.4;
          const px = Math.cos(a) * rRx;
          const py = Math.sin(a) * rRy;
          const pa = 0.35 + Math.sin(t * 3.5 + i * 1.5) * 0.35;
          const pg = ctx.createRadialGradient(px, py, 0, px, py, 6);
          pg.addColorStop(0, `rgba(251,191,36,${pa})`);
          pg.addColorStop(1, 'rgba(251,191,36,0)');
          ctx.fillStyle = pg;
          ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
          ctx.fillStyle = `rgba(255,250,220,${pa * 0.9})`;
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, TAU); ctx.fill();
        }
        ctx.restore();

        if (Math.random() < 0.35) {
          const a = rn(0, TAU);
          sp({ x:cx+Math.cos(a)*rRx, y:crysY+Math.sin(a)*rRy, vx:Math.cos(a+1.5)*0.35, vy:Math.sin(a+1.5)*0.2-0.15, sz:rn(0.5,1.8), a:0.65, ml:rn(25,55), r:251,g:191,b:36, tp:'ring' });
        }
      }

      /* ─ 9. CRYSTAL 2027 ─ */
      if (crysA > 0.01) {
        ctx.save(); ctx.globalAlpha = crysA;
        ctx.drawImage(oCrys, cx - cW / 2, crysY - cH / 2, cW, cH);
        ctx.restore();
      }

      /* ─ 10. RIM LIGHT ─ */
      if (crysA > 0.1) {
        const rimG = ctx.createRadialGradient(cx, crysY, fSz * 0.4, cx, crysY, fSz * 1.5);
        rimG.addColorStop(0, 'rgba(251,191,36,0)');
        rimG.addColorStop(0.5, 'rgba(251,191,36,0.03)');
        rimG.addColorStop(0.8, `rgba(251,191,36,${0.1 * crysA})`);
        rimG.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = rimG;
        ctx.fillRect(cx - fSz * 1.6, crysY - fSz * 1.2, fSz * 3.2, fSz * 2.4);
      }

      /* ─ 11. LIGHT RAYS ─ */
      for (let i = 0; i < 4; i++) {
        const rp = (t * 0.12 + i * 0.25) % 1;
        if (rp < 0.2 && crysA > 0.3) {
          const ra = rp / 0.2; const fi = ra < 0.5 ? ra * 2 : 2 - ra * 2;
          const ang = -0.5 + i * 0.35 + Math.sin(t * 0.25 + i) * 0.08;
          ctx.save(); ctx.translate(cx, crysY - fSz * 0.3); ctx.rotate(ang);
          ctx.globalAlpha = fi * 0.08 * crysA;
          const rayG = ctx.createLinearGradient(0, 0, 0, -h * 0.45);
          rayG.addColorStop(0, 'rgba(255,248,220,0.9)');
          rayG.addColorStop(0.2, 'rgba(251,191,36,0.4)');
          rayG.addColorStop(1, 'rgba(251,191,36,0)');
          ctx.fillStyle = rayG;
          ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-18, -h * 0.45); ctx.lineTo(18, -h * 0.45); ctx.lineTo(2, 0); ctx.fill();
          ctx.restore();
        }
      }

      /* ─ 12. LENS FLARE ─ */
      const fp = (t * 0.1) % 1;
      if (fp < 0.12 && crysA > 0.5) {
        const fi = fp / 0.12; const fl = fi < 0.5 ? fi * 2 : 2 - fi * 2;
        const fx = cx + fSz * 0.25, fy = crysY - fSz * 0.2;
        ctx.save(); ctx.globalAlpha = fl * 0.15 * crysA;
        const flG = ctx.createLinearGradient(fx - 100, fy, fx + 100, fy);
        flG.addColorStop(0, 'rgba(255,248,220,0)');
        flG.addColorStop(0.35, 'rgba(255,248,220,0.7)');
        flG.addColorStop(0.5, 'rgba(255,255,255,1)');
        flG.addColorStop(0.65, 'rgba(255,248,220,0.7)');
        flG.addColorStop(1, 'rgba(255,248,220,0)');
        ctx.fillStyle = flG; ctx.fillRect(fx - 100, fy - 2, 200, 4);
        const fcG = ctx.createRadialGradient(fx, fy, 0, fx, fy, 18);
        fcG.addColorStop(0, `rgba(255,255,255,${fl * 0.9})`);
        fcG.addColorStop(0.3, `rgba(251,191,36,${fl * 0.4})`);
        fcG.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = fcG; ctx.beginPath(); ctx.arc(fx, fy, 18, 0, TAU); ctx.fill();
        ctx.restore();
      }

      /* ─ 13. SPAWN PARTICLES ─ */
      if (t > 1 && Math.random() < 0.4) sp({ x:rn(0,w), y:rn(h*0.1,h*0.7), vx:rn(-0.12,0.12), vy:rn(-0.25,-0.03), sz:rn(0.4,1.5), a:rn(0.1,0.3), ml:rn(100,220), r:251,g:191,b:36, tp:'dust' });
      if (crysA > 0.3 && Math.random() < 0.12) sp({ x:rn(cx-fSz,cx+fSz), y:rn(crysY-fSz,crysY+fSz*0.4), vx:rn(-0.4,0.4), vy:rn(-0.6,0.15), sz:rn(1,3), a:0.9, ml:rn(18,45), r:255,g:250,b:220, tp:'sparkle' });
      if (t > 2 && Math.random() < 0.18) sp({ x:rn(w*0.08,w*0.92), y:floorY+rn(-8,25), vx:rn(-0.25,0.25), vy:rn(0.03,0.18), sz:rn(18,45), a:0.035, ml:rn(70,140), r:251,g:191,b:36, tp:'fog' });

      /* ─ 14. UPDATE & DRAW PARTICLES ─ */
      let alive = 0;
      for (let i = 0; i < pc; i++) {
        const p = pts[i]; p.life++;
        if (p.life >= p.ml) continue;
        p.x += p.vx; p.y += p.vy;
        const lt = p.life / p.ml;
        let al = p.a;
        if (p.tp === 'dust') { al *= (1 - lt); p.vy -= 0.002; }
        else if (p.tp === 'sparkle') { al *= (1 - lt * lt); }
        else if (p.tp === 'ring') { al *= (1 - lt); p.vx *= 0.97; p.vy *= 0.97; }
        else if (p.tp === 'fog') { al *= Math.sin(lt * Math.PI); }
        if (al < 0.005) continue;
        ctx.save(); ctx.globalAlpha = al;
        if (p.tp === 'fog') {
          const fg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
          fg.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.18)`);
          fg.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        } else if (p.tp === 'sparkle') {
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.shadowColor = `rgb(${p.r},${p.g},${p.b})`; ctx.shadowBlur = p.sz * 5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        }
        ctx.restore();
        pts[alive++] = p;
      }
      pc = alive;

      /* ─ 15. BLOOM ─ */
      const blG = ctx.createRadialGradient(cx, crysY, 0, cx, crysY, fSz * 2.2);
      blG.addColorStop(0, `rgba(251,191,36,${0.035 * crysA})`);
      blG.addColorStop(0.4, `rgba(251,191,36,${0.018 * crysA})`);
      blG.addColorStop(0.7, `rgba(37,99,235,${0.01 * crysA})`);
      blG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = blG;
      ctx.fillRect(0, 0, w, h);

      /* ─ 16. GOLDEN GLOW ─ */
      const glowA = eOC(cl((t - T.glowIn) / 1.5, 0, 1)) * (1 - eOC(cl((t - T.fadeOut) / (T.end - T.fadeOut), 0, 1)));
      if (glowA > 0.005) {
        const gG = ctx.createRadialGradient(cx, h * 0.4, 0, cx, h * 0.4, Math.max(w, h) * 0.65);
        gG.addColorStop(0, `rgba(251,191,36,${glowA * 0.2})`);
        gG.addColorStop(0.4, `rgba(217,119,6,${glowA * 0.1})`);
        gG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gG;
        ctx.fillRect(0, 0, w, h);
      }

      /* ─ 17. TEXT ─ */
      const textA = eOC(cl((t - T.textIn) / 1.2, 0, 1)) * (1 - eOC(cl((t - T.fadeOut) / (T.end - T.fadeOut), 0, 1)));
      if (textA > 0.01) {
        ctx.save(); ctx.globalAlpha = textA;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        const nyY = h * 0.76;
        const nySz = Math.min(w * 0.055, 46);
        ctx.font = `200 ${nySz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${nySz * 0.4}px`;
        const nyG = ctx.createLinearGradient(cx - 160, nyY, cx + 160, nyY);
        nyG.addColorStop(0, 'rgba(180,180,210,0.5)');
        nyG.addColorStop(0.25, 'rgba(251,191,36,0.9)');
        nyG.addColorStop(0.5, 'rgba(255,255,255,1)');
        nyG.addColorStop(0.75, 'rgba(251,191,36,0.9)');
        nyG.addColorStop(1, 'rgba(180,180,210,0.5)');
        ctx.fillStyle = nyG;
        ctx.shadowColor = 'rgba(251,191,36,0.4)'; ctx.shadowBlur = 20;
        ctx.fillText('NEW YEAR', cx, nyY);
        ctx.shadowBlur = 0;

        const lineW = Math.min(w * 0.22, 220) * textA;
        const dlG = ctx.createLinearGradient(cx - lineW, 0, cx + lineW, 0);
        dlG.addColorStop(0, 'rgba(251,191,36,0)');
        dlG.addColorStop(0.3, 'rgba(251,191,36,0.5)');
        dlG.addColorStop(0.5, 'rgba(255,255,255,0.7)');
        dlG.addColorStop(0.7, 'rgba(251,191,36,0.5)');
        dlG.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.strokeStyle = dlG; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - lineW, nyY + nySz * 0.85); ctx.lineTo(cx + lineW, nyY + nySz * 0.85); ctx.stroke();
        for (const s of [-1, 1]) {
          ctx.fillStyle = `rgba(255,250,205,${textA * 0.7})`;
          ctx.save(); ctx.translate(cx + s * lineW, nyY + nySz * 0.85); ctx.rotate(Math.PI / 4);
          ctx.fillRect(-3, -3, 6, 6); ctx.restore();
        }

        const nbY = nyY + nySz * 1.45;
        const nbSz = Math.min(w * 0.042, 34);
        ctx.font = `300 ${nbSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${nbSz * 0.32}px`;
        ctx.fillStyle = 'rgba(210,210,230,0.75)';
        ctx.shadowColor = 'rgba(251,191,36,0.18)'; ctx.shadowBlur = 10;
        ctx.fillText('NEW BEGINNING', cx, nbY);
        ctx.shadowBlur = 0;

        const wtY = h * 0.87;
        const wtSz = Math.min(w * 0.024, 19);
        ctx.font = `300 ${wtSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${wtSz * 0.22}px`;
        ctx.fillStyle = 'rgba(160,170,200,0.55)';
        ctx.fillText('Welcome to 2027', cx, wtY);

        ctx.restore();
      }

      /* ─ 18. VIGNETTE ─ */
      const vg = ctx.createRadialGradient(cx, h * 0.42, Math.min(w, h) * 0.28, cx, h * 0.42, Math.max(w, h) * 0.88);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.65, 'rgba(0,0,0,0.18)');
      vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      /* ─ 19. FINAL FADE TO WARM ─ */
      if (glowA > 0.3) {
        ctx.fillStyle = `rgba(255,248,230,${(glowA - 0.3) * 0.5})`;
        ctx.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(animate);
    };

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
        display: 'block', background: '#020408',
        zIndex: 9999,
      }}
    />
  );
}
