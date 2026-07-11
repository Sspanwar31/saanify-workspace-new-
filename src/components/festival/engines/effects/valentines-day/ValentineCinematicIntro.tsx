'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   VALENTINE 2027 — Cinematic Love Story
   12.5s Disney-Pixar-Apple Premium Experience
   ═══════════════════════════════════════════════════════════════ */

interface P {
  x: number; y: number; vx: number; vy: number;
  sz: number; a: number; life: number; ml: number;
  r: number; g: number; b: number;
  rot: number; rotSpd: number; tmbSpd: number;
  tp: 'dust' | 'sparkle' | 'petal' | 'tinyH' | 'orbG' | 'orbP' | 'burst' | 'txtS';
  sx: number;
}

interface Star { x: number; y: number; s: number; tw: number; of: number; br: number; }

export default function ValentineCinematicIntro({ onComplete }: { onComplete: () => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d', { alpha: false })!;
    let w = 0, h = 0, dpr = 1, raf = 0, t0 = 0, run = true;

    const TAU = Math.PI * 2;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const rn = (a: number, b: number) => a + Math.random() * (b - a);
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
    const eIO = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const eOB = (t: number) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

    /* ── TIMELINE ── */
    const TL = {
      walkE: 2.5, gestE: 4.0, orbE: 6.0, explE: 7.0,
      rainE: 10.0, txtE: 11.5, fadeS: 11.5, end: 12.5,
    };

    /* ── PALETTE ── */
    const C = {
      skyTop: '#020818', skyMid: '#06102e', skyBot: '#0a0a20',
      moon: '#e8e0f0', moonGlow: 'rgba(180,190,240,',
      body: '#08081e', rim: 'rgba(140,170,255,0.09)',
      gold: [251, 191, 36], pink: [236, 72, 153], red: [220, 38, 38],
      rose: [244, 63, 94], white: [255, 245, 238],
    };

    const PETAL_COLS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#be123c', '#f9a8d4', '#f472b6'];
    const HEART_COLS = ['#e11d48', '#f43f5e', '#dc2626', '#ef4444', '#fbbf24'];

    /* ── STARS ── */
    const stars: Star[] = [];
    function genStars() {
      stars.length = 0;
      for (let i = 0; i < 220; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h * 0.6, s: rn(0.3, 1.8), tw: rn(0.4, 2.5), of: rn(0, TAU), br: rn(0.25, 0.85) });
      }
    }

    /* ── PARTICLE POOL ── */
    const MX = 650;
    const pts: P[] = [];
    for (let i = 0; i < MX; i++) pts.push({ x: 0, y: 0, vx: 0, vy: 0, sz: 1, a: 0, life: 0, ml: 1, r: 251, g: 191, b: 36, rot: 0, rotSpd: 0, tmbSpd: 0, tp: 'dust', sx: 1 });
    let pc = 0;
    function sp(o: Partial<P>) {
      if (pc >= MX) return;
      const p = pts[pc];
      Object.assign(p, { x: 0, y: 0, vx: 0, vy: 0, sz: 1, a: 0, life: 0, ml: 1, r: 251, g: 191, b: 36, rot: 0, rotSpd: 0, tmbSpd: 0, tp: 'dust' as P['tp'], sx: 1 }, o);
      p.life = 0;
      pc++;
    }

    /* ── ORB TRAILS ── */
    const gTr: { x: number; y: number }[] = [];
    const pTr: { x: number; y: number }[] = [];
    const TRM = 45;

    /* ── RESIZE ── */
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv!.width = w * dpr; cv!.height = h * dpr;
      cv!.style.width = w + 'px'; cv!.style.height = h + 'px';
      genStars();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ═══ DRAWING HELPERS ═══ */

    function drawPetal(x: number, y: number, sz: number, rot: number, col: string, scX: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(scX, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(sz * 0.4, -sz * 0.3, sz, -sz * 0.1, sz * 0.7, sz * 0.2);
      ctx.bezierCurveTo(sz * 0.5, sz * 0.5, sz * 0.15, sz * 0.45, 0, sz * 0.25);
      ctx.bezierCurveTo(-sz * 0.15, sz * 0.45, -sz * 0.5, sz * 0.5, -sz * 0.7, sz * 0.2);
      ctx.bezierCurveTo(-sz, -sz * 0.1, -sz * 0.4, -sz * 0.3, 0, 0);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();
    }

    function drawTinyHeart(x: number, y: number, sz: number, col: string) {
      ctx.save();
      ctx.translate(x, y);
      const s = sz;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.05, s * 0.05, -s * 0.5, -s * 0.25, -s * 0.5, 0);
      ctx.bezierCurveTo(-s * 0.5, s * 0.3, 0, s * 0.55, 0, s * 0.75);
      ctx.bezierCurveTo(0, s * 0.55, s * 0.5, s * 0.3, s * 0.5, 0);
      ctx.bezierCurveTo(s * 0.5, -s * 0.25, s * 0.05, s * 0.05, 0, s * 0.3);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();
    }

    function drawHeartShape(sz: number) {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * TAU;
        const px = 16 * Math.pow(Math.sin(t), 3) * sz;
        const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * sz;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    function drawFigure(x: number, y: number, s: number, face: number, opts: {
      aLX?: number; aLY?: number; aRX?: number; aRY?: number;
      legL?: number; legR?: number; turn?: number; bow?: boolean;
    }) {
      const { aLX = -14, aLY = 20, aRX = 14, aRY = 20, legL = 0, legR = 0, turn = 0, bow = false } = opts;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s * face, s);
      ctx.rotate(turn);
      ctx.fillStyle = C.body;
      ctx.strokeStyle = C.rim;
      ctx.lineWidth = 1.2 / s;
      ctx.lineCap = 'round';

      // Legs
      ctx.lineWidth = 5;
      ctx.save(); ctx.translate(-5, 28); ctx.rotate(legL);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 17, 5.5, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(5, 28); ctx.rotate(legR);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 17, 5.5, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();

      // Body
      ctx.beginPath(); ctx.ellipse(0, 14, 10, 17, 0, 0, TAU); ctx.fill(); ctx.stroke();

      // Arms
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(-9, 5); ctx.lineTo(aLX, aLY); ctx.stroke();
      ctx.beginPath(); ctx.arc(aLX, aLY, 3.8, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(9, 5); ctx.lineTo(aRX, aRY); ctx.stroke();
      ctx.beginPath(); ctx.arc(aRX, aRY, 3.8, 0, TAU); ctx.fill();

      // Head
      ctx.beginPath(); ctx.arc(0, -8, 12.5, 0, TAU); ctx.fill(); ctx.stroke();

      // Ears
      ctx.beginPath(); ctx.arc(-10.5, -18, 7.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(10.5, -18, 7.5, 0, TAU); ctx.fill(); ctx.stroke();

      // Bow
      if (bow) {
        ctx.beginPath(); ctx.ellipse(-7, -25.5, 6.5, 3.8, -0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(7, -25.5, 6.5, 3.8, 0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -23.5, 2.8, 0, TAU); ctx.fill();
      }

      // Moonlight rim on head & ears
      ctx.strokeStyle = 'rgba(170,195,255,0.12)';
      ctx.lineWidth = 1.8 / s;
      ctx.beginPath(); ctx.arc(0, -8, 13, -2.2, 0.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(10.5, -18, 8, -1.8, 0.6); ctx.stroke();

      ctx.restore();
    }

    /* ══════════════════ MAIN LOOP ══════════════════ */
    const animate = (ts: number) => {
      if (!run) return;
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = w / 2;
      const groundY = h * 0.78;
      const cScale = Math.min(w, h) * 0.0014;
      const moonX = w * 0.8, moonY = h * 0.14, moonR = Math.min(w, h) * 0.05;

      // Fade out
      const fadeA = 1 - eOC(cl((t - TL.fadeS) / (TL.end - TL.fadeS), 0, 1));
      if (fadeA <= 0.01) { onComplete(); return; }

      // Camera subtle follow
      let camY = 0;
      if (t > 4.0 && t < 7.5) {
        const cp = eIO(cl((t - 4.0) / 3.5, 0, 1));
        camY = -cp * h * 0.06;
      }

      ctx.save();
      ctx.translate(0, camY);

      /* ── 1. NIGHT SKY ── */
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, C.skyTop);
      sky.addColorStop(0.45, C.skyMid);
      sky.addColorStop(1, C.skyBot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, -20, w, h + 40);

      /* ── 2. MOON ── */
      const mGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.3, moonX, moonY, moonR * 5);
      mGlow.addColorStop(0, 'rgba(180,190,240,0.12)');
      mGlow.addColorStop(0.3, 'rgba(140,160,220,0.04)');
      mGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mGlow;
      ctx.fillRect(moonX - moonR * 5, moonY - moonR * 5, moonR * 10, moonR * 10);

      ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, TAU);
      const mFace = ctx.createRadialGradient(moonX - moonR * 0.2, moonY - moonR * 0.2, 0, moonX, moonY, moonR);
      mFace.addColorStop(0, '#f5f0ff');
      mFace.addColorStop(0.6, '#e0d8f0');
      mFace.addColorStop(1, '#c8c0d8');
      ctx.fillStyle = mFace;
      ctx.fill();

      /* ── 3. STARS ── */
      const starFade = t < 1.5 ? eOC(t / 1.5) : 1;
      for (const s of stars) {
        const tw = 0.4 + 0.6 * Math.sin(t * s.tw + s.of);
        const a = s.br * tw * starFade * fadeA;
        if (a < 0.01) continue;
        ctx.fillStyle = `rgba(210,220,255,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
        if (s.s > 1.2) {
          const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.s * 4);
          sg.addColorStop(0, `rgba(200,215,255,${a * 0.2})`);
          sg.addColorStop(1, 'rgba(200,215,255,0)');
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.s * 4, 0, TAU); ctx.fill();
        }
      }

      /* ── 4. GROUND HAZE ── */
      const gndH = ctx.createLinearGradient(0, groundY - 15, 0, groundY + 30);
      gndH.addColorStop(0, 'rgba(10,10,35,0)');
      gndH.addColorStop(0.5, 'rgba(15,12,40,0.25)');
      gndH.addColorStop(1, 'rgba(10,10,35,0)');
      ctx.fillStyle = gndH;
      ctx.fillRect(0, groundY - 15, w, 45);

      /* ── 5. CHARACTER POSITIONS ── */
      const walkP = eOC(cl(t / TL.walkE, 0, 1));
      const mX = lerp(-60, cx - 55 * cScale, walkP);
      const mnX = lerp(w + 60, cx + 55 * cScale, walkP);
      const mY = groundY;
      const mnY = groundY;

      // Walk cycle
      const wCyc = t * 5.5;
      const wDecay = 1 - walkP;
      const bounce = Math.abs(Math.sin(wCyc)) * 3.5 * wDecay;
      const legL = Math.sin(wCyc) * 0.32 * wDecay;
      const legR = -legL;
      const armSwing = Math.sin(wCyc) * 6 * wDecay;

      // Gesture transition
      const gestP = eOC(cl((t - TL.walkE) / 0.5, 0, 1));
      const armRaiseP = eOB(cl((t - TL.walkE - 0.5) / 0.8, 0, 1));
      const turnAmt = gestP * 0.12;

      // Arm positions: walking vs gesture
      const walkALX = -16, walkALY = 20 + armSwing;
      const walkARX = 16, walkARY = 20 - armSwing;
      const gestARX = 35, gestARY = lerp(20, -55, armRaiseP);

      const mLX = lerp(walkALX, -14, gestP);
      const mLY = lerp(walkALY, 20, gestP);
      const mRX = lerp(walkARX, gestARX, gestP);
      const mRY = lerp(walkARY, gestARY, gestP);

      const mnLX = lerp(walkARX, gestARX, gestP);
      const mnLY = lerp(walkARY, gestARY, gestP);
      const mnRX = lerp(walkALX, -14, gestP);
      const mnRY = lerp(walkALY, 20, gestP);

      const legDecay = 1 - gestP * 0.8;

      // Character shadows
      const shA = 0.12 * fadeA;
      if (shA > 0.005) {
        ctx.fillStyle = `rgba(0,0,0,${shA})`;
        ctx.beginPath(); ctx.ellipse(mX, groundY + 3, 22 * cScale, 5 * cScale, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mnX, groundY + 3, 22 * cScale, 5 * cScale, 0, 0, TAU); ctx.fill();
      }

      // Draw Mickey
      drawFigure(mX, mY - bounce * cScale, cScale, 1, {
        aLX: mLX, aLY: mLY, aRX: mRX, aRY: mRY,
        legL: legL * legDecay, legR: legR * legDecay, turn: -turnAmt,
      });

      // Draw Minnie
      drawFigure(mnX, mnY - bounce * cScale, cScale * 0.95, -1, {
        aLX: mnLX, aLY: mnLY, aRX: mnRX, aRY: mnRY,
        legL: -legL * legDecay, legR: -legR * legDecay, turn: -turnAmt, bow: true,
      });

      /* ── 6. HAND HEART GLOW ── */
      const heartApp = eOC(cl((t - 3.2) / 0.5, 0, 1));
      if (heartApp > 0.01 && t < TL.orbE) {
        const hX = cx;
        const hY = groundY - 65 * cScale - bounce * cScale;
        const hPulse = 1 + Math.sin((t - 3.7) * 4.5) * 0.1;
        const hSz = 0.75 * cScale * heartApp * hPulse;
        const hFade = t > TL.orbE - 0.5 ? 1 - eOC(cl((t - (TL.orbE - 0.5)) / 0.5, 0, 1)) : 1;
        const hAl = heartApp * hFade * fadeA;

        // Glow
        const hGl = ctx.createRadialGradient(hX, hY, 0, hX, hY, hSz * 4);
        hGl.addColorStop(0, `rgba(239,68,68,${0.25 * hAl})`);
        hGl.addColorStop(0.35, `rgba(251,191,36,${0.1 * hAl})`);
        hGl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hGl;
        ctx.beginPath(); ctx.arc(hX, hY, hSz * 4, 0, TAU); ctx.fill();

        // Heart shape
        ctx.save();
        ctx.translate(hX, hY);
        ctx.scale(hSz, hSz);
        drawHeartShape(1);
        const hGr = ctx.createLinearGradient(-16, -16, 16, 14);
        hGr.addColorStop(0, '#fca5a5');
        hGr.addColorStop(0.3, '#ef4444');
        hGr.addColorStop(0.5, '#fbbf24');
        hGr.addColorStop(0.7, '#ef4444');
        hGr.addColorStop(1, '#dc2626');
        ctx.fillStyle = hGr;
        ctx.shadowColor = `rgba(239,68,68,${0.5 * hAl})`;
        ctx.shadowBlur = 20;
        ctx.globalAlpha = hAl;
        ctx.fill();
        ctx.restore();

        // Heart sparkles
        if (hAl > 0.3 && Math.random() < 0.3) {
          sp({ x: hX + rn(-15, 15) * hSz, y: hY + rn(-15, 15) * hSz, vx: rn(-0.3, 0.3), vy: rn(-0.8, -0.1), sz: rn(0.8, 2), a: 0.8, ml: rn(20, 40), r: 255, g: 250, b: 220, tp: 'sparkle', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
      }

      /* ── 7. ENERGY ORBS ── */
      const orbP = cl((t - TL.gestE) / (TL.orbE - TL.gestE), 0, 1);
      if (orbP > 0 && orbP < 1) {
        const heartCenter = { x: cx, y: groundY - 65 * cScale };
        const skyCenter = { x: cx, y: h * 0.22 };
        const spiralA = orbP * Math.PI * 10;
        const spiralR = 35 * (1 - orbP * 0.7) * cScale;
        const gOx = heartCenter.x + Math.cos(spiralA) * spiralR;
        const gOy = lerp(heartCenter.y, skyCenter.y, eIO(orbP)) + Math.sin(spiralA * 0.7) * spiralR * 0.4;
        const pOx = heartCenter.x + Math.cos(spiralA + Math.PI) * spiralR;
        const pOy = lerp(heartCenter.y, skyCenter.y, eIO(orbP)) + Math.sin((spiralA + Math.PI) * 0.7) * spiralR * 0.4;

        // Trails
        gTr.push({ x: gOx, y: gOy });
        pTr.push({ x: pOx, y: pOy });
        if (gTr.length > TRM) gTr.shift();
        if (pTr.length > TRM) pTr.shift();

        // Draw trails
        ctx.save();
        ctx.globalAlpha = fadeA;
        for (const [trail, col] of [[gTr, C.gold], [pTr, C.pink]] as const) {
          if (trail.length > 2) {
            const s = trail[0], e = trail[trail.length - 1];
            const tg = ctx.createLinearGradient(s.x, s.y, e.x, e.y);
            tg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0)`);
            tg.addColorStop(0.3, `rgba(${col[0]},${col[1]},${col[2]},0.08)`);
            tg.addColorStop(0.7, `rgba(${col[0]},${col[1]},${col[2]},0.35)`);
            tg.addColorStop(1, `rgba(255,255,255,0.6)`);
            // Glow layer
            ctx.strokeStyle = tg;
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.2 * fadeA;
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length - 1; i++) {
              const xc = (trail[i].x + trail[i + 1].x) / 2;
              const yc = (trail[i].y + trail[i + 1].y) / 2;
              ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
            }
            ctx.stroke();
            // Core layer
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.8 * fadeA;
            ctx.stroke();
          }
        }
        ctx.restore();

        // Draw orbs
        ctx.save();
        ctx.globalAlpha = fadeA;
        ctx.globalCompositeOperation = 'lighter';
        for (const [ox, oy, col] of [[gOx, gOy, C.gold], [pOx, pOy, C.pink]] as const) {
          const oG = ctx.createRadialGradient(ox, oy, 0, ox, oy, 20);
          oG.addColorStop(0, 'rgba(255,255,255,0.9)');
          oG.addColorStop(0.15, `rgba(${col[0]},${col[1]},${col[2]},0.7)`);
          oG.addColorStop(0.5, `rgba(${col[0]},${col[1]},${col[2]},0.15)`);
          oG.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
          ctx.fillStyle = oG;
          ctx.beginPath(); ctx.arc(ox, oy, 20, 0, TAU); ctx.fill();
        }
        ctx.restore();

        // Trail sparkles
        if (Math.random() < 0.5) {
          sp({ x: gOx, y: gOy, vx: rn(-0.2, 0.2), vy: rn(-0.3, 0.1), sz: rn(0.6, 1.5), a: 0.6, ml: rn(15, 30), r: C.gold[0], g: C.gold[1], b: C.gold[2], tp: 'orbG', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
          sp({ x: pOx, y: pOy, vx: rn(-0.2, 0.2), vy: rn(-0.3, 0.1), sz: rn(0.6, 1.5), a: 0.6, ml: rn(15, 30), r: C.pink[0], g: C.pink[1], b: C.pink[2], tp: 'orbP', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
      }

      /* ── 8. HEART EXPLOSION ── */
      const explP = cl((t - TL.orbE) / (TL.explE - TL.orbE), 0, 1);
      if (explP > 0 && explP < 1) {
        const eX = cx, eY = h * 0.22;
        const bA = Math.sin(explP * Math.PI);

        // Big sky heart
        const bigH = eOB(cl(explP / 0.5, 0, 1));
        if (bigH > 0.01) {
          ctx.save();
          ctx.translate(eX, eY);
          ctx.scale(bigH * cScale * 1.2, bigH * cScale * 1.2);
          drawHeartShape(1);
          const eGr = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
          eGr.addColorStop(0, '#ffffff');
          eGr.addColorStop(0.2, '#fca5a5');
          eGr.addColorStop(0.5, '#ef4444');
          eGr.addColorStop(0.8, '#fbbf24');
          eGr.addColorStop(1, '#dc2626');
          ctx.fillStyle = eGr;
          ctx.shadowColor = `rgba(251,191,36,${bA * 0.6})`;
          ctx.shadowBlur = 50;
          ctx.globalAlpha = bA * fadeA;
          ctx.fill();
          ctx.restore();
        }

        // Flash bloom
        const flG = ctx.createRadialGradient(eX, eY, 0, eX, eY, 250 * bA);
        flG.addColorStop(0, `rgba(255,240,220,${bA * 0.35})`);
        flG.addColorStop(0.2, `rgba(251,191,36,${bA * 0.15})`);
        flG.addColorStop(0.5, `rgba(236,72,153,${bA * 0.08})`);
        flG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flG;
        ctx.globalAlpha = fadeA;
        ctx.fillRect(eX - 300, eY - 300, 600, 600);

        // Burst particles
        if (explP < 0.35 && Math.random() < 0.7) {
          const ba = rn(0, TAU);
          const spd = rn(2, 6);
          const col = Math.random() > 0.5 ? C.gold : C.pink;
          sp({ x: eX, y: eY, vx: Math.cos(ba) * spd, vy: Math.sin(ba) * spd, sz: rn(1.5, 3.5), a: 0.9, ml: rn(30, 60), r: col[0], g: col[1], b: col[2], tp: 'burst', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
      }

      /* ── 9. AMBIENT PARTICLES (always) ── */
      if (t > 0.5 && Math.random() < 0.08) {
        sp({ x: rn(0, w), y: rn(h * 0.1, h * 0.7), vx: rn(-0.03, 0.03), vy: rn(-0.04, 0.01), sz: rn(0.3, 0.8), a: rn(0.03, 0.1), ml: rn(200, 400), r: 160, g: 170, b: 220, tp: 'dust', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
      }
      if (t > 1 && Math.random() < 0.06) {
        sp({ x: rn(moonX - 80, moonX + 80), y: rn(moonY - 60, moonY + 60), vx: rn(-0.05, 0.05), vy: rn(-0.08, 0.02), sz: rn(0.5, 1.2), a: rn(0.05, 0.15), ml: rn(100, 200), r: 200, g: 210, b: 255, tp: 'dust', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
      }

      /* ── 10. ROSE PETAL RAIN ── */
      const rainP = cl((t - TL.explE) / (TL.rainE - TL.explE), 0, 1);
      if (rainP > 0 && t < TL.end) {
        const spawnRate = rainP < 0.1 ? rainP / 0.1 * 4 : 4;
        for (let i = 0; i < spawnRate; i++) {
          if (Math.random() < 0.85) {
            sp({
              x: rn(-30, w + 30), y: rn(-40, -5),
              vx: rn(-0.3, 0.3), vy: rn(0.5, 1.5),
              sz: rn(6, 14), a: rn(0.5, 0.85), ml: rn(200, 380),
              r: 0, g: 0, b: 0, tp: 'petal',
              rot: rn(0, TAU), rotSpd: rn(-0.02, 0.02), tmbSpd: rn(0.03, 0.08), sx: 1,
            });
          } else {
            const hc = HEART_COLS[Math.floor(Math.random() * HEART_COLS.length)];
            const [hr, hg, hb] = hc === '#fbbf24' ? [251, 191, 36] : [parseInt(hc.slice(1, 3), 16), parseInt(hc.slice(3, 5), 16), parseInt(hc.slice(5, 7), 16)];
            sp({
              x: rn(0, w), y: rn(-30, -5),
              vx: rn(-0.15, 0.15), vy: rn(0.4, 1.2),
              sz: rn(4, 8), a: rn(0.4, 0.7), ml: rn(200, 350),
              r: hr, g: hg, b: hb, tp: 'tinyH',
              rot: 0, rotSpd: rn(-0.015, 0.015), tmbSpd: 0, sx: 1,
            });
          }
        }

        // Ambient sparkles during rain
        if (Math.random() < 0.12) {
          sp({ x: rn(0, w), y: rn(h * 0.2, h * 0.75), vx: rn(-0.08, 0.08), vy: rn(-0.1, 0.05), sz: rn(0.5, 1.5), a: rn(0.15, 0.4), ml: rn(60, 120), r: 255, g: 220, b: 180, tp: 'sparkle', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
      }

      /* ── 11. PARTICLES UPDATE & DRAW ── */
      let alive = 0;
      for (let i = 0; i < pc; i++) {
        const p = pts[i];
        p.life++;
        if (p.life >= p.ml) continue;
        p.x += p.vx; p.y += p.vy;
        const lt = p.life / p.ml;
        let al = p.a;

        switch (p.tp) {
          case 'dust':
            al *= (1 - lt);
            p.vx += rn(-0.002, 0.002);
            break;
          case 'sparkle':
            al *= (1 - lt * lt) * (0.4 + 0.6 * Math.sin(p.life * 0.15));
            p.vy -= 0.002;
            break;
          case 'petal':
            p.x += Math.sin(p.life * 0.02 + p.rot) * 0.3;
            p.rot += p.rotSpd;
            p.sx = Math.abs(Math.cos(p.life * p.tmbSpd));
            al *= Math.sin(lt * Math.PI) * 0.9 + 0.1;
            p.vy += 0.002;
            break;
          case 'tinyH':
            p.x += Math.sin(p.life * 0.025) * 0.2;
            p.rot += p.rotSpd;
            al *= Math.sin(lt * Math.PI) * 0.85 + 0.15;
            break;
          case 'orbG': case 'orbP':
            al *= (1 - lt * lt);
            p.vx *= 0.95; p.vy *= 0.95;
            break;
          case 'burst':
            al *= (1 - lt * lt);
            p.vx *= 0.97; p.vy *= 0.97;
            p.vy += 0.015;
            break;
          case 'txtS':
            al *= (1 - lt * lt) * (0.5 + 0.5 * Math.sin(p.life * 0.12));
            p.vy -= 0.003;
            break;
        }
        if (al < 0.003 || p.y > h + 50) continue;

        ctx.save();
        ctx.globalAlpha = al * fadeA;

        switch (p.tp) {
          case 'dust':
            ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
            break;
          case 'sparkle': case 'orbG': case 'orbP': case 'txtS':
            const sG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz * 3);
            sG.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.75)`);
            sG.addColorStop(0.25, `rgba(${p.r},${p.g},${p.b},0.2)`);
            sG.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
            ctx.fillStyle = sG;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 3, 0, TAU); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${al * 0.5})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.3, p.sz * 0.3), 0, TAU); ctx.fill();
            break;
          case 'petal':
            drawPetal(p.x, p.y, p.sz, p.rot, PETAL_COLS[Math.floor(p.rot * 10) % PETAL_COLS.length], p.sx);
            break;
          case 'tinyH':
            drawTinyHeart(p.x, p.y, p.sz, `rgb(${p.r},${p.g},${p.b})`);
            break;
          case 'burst':
            const bG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz * 4);
            bG.addColorStop(0, `rgba(255,255,255,0.6)`);
            bG.addColorStop(0.2, `rgba(${p.r},${p.g},${p.b},0.4)`);
            bG.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
            ctx.fillStyle = bG;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 4, 0, TAU); ctx.fill();
            break;
        }
        ctx.restore();
        pts[alive++] = p;
      }
      pc = alive;

      ctx.restore(); // undo camera

      /* ── 12. GREETING TEXT ── */
      const txtP = eOC(cl((t - TL.rainE) / (TL.txtE - TL.rainE), 0, 1));
      if (txtP > 0.01) {
        const tA = txtP * fadeA;
        ctx.save();
        ctx.globalAlpha = tA;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const mTY = h * 0.30;
        const mSz = Math.min(w * 0.065, 56);
        ctx.font = `800 ${mSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${mSz * 0.02}px`;

        // Deep shadow
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText("Happy Valentine's Day", cx, mTY);

        // Gold base
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        const tG = ctx.createLinearGradient(cx - 250, mTY - mSz / 2, cx + 250, mTY + mSz / 2);
        tG.addColorStop(0, '#8b6914');
        tG.addColorStop(0.15, '#b8860b');
        tG.addColorStop(0.3, '#ffd700');
        tG.addColorStop(0.45, '#fff8dc');
        tG.addColorStop(0.55, '#ffd700');
        tG.addColorStop(0.7, '#daa520');
        tG.addColorStop(0.85, '#b8860b');
        tG.addColorStop(1, '#8b6914');
        ctx.fillStyle = tG;
        ctx.fillText("Happy Valentine's Day", cx, mTY);

        // Top highlight
        ctx.save();
        const tw = ctx.measureText("Happy Valentine's Day").width;
        ctx.beginPath();
        ctx.rect(cx - tw / 2, mTY - mSz * 0.55, tw, mSz * 0.45);
        ctx.clip();
        const tH = ctx.createLinearGradient(cx, mTY - mSz * 0.55, cx, mTY - mSz * 0.1);
        tH.addColorStop(0, 'rgba(255,255,255,0.35)');
        tH.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = tH;
        ctx.fillText("Happy Valentine's Day", cx, mTY);
        ctx.restore();

        // Moving shimmer
        const shP = ((t - TL.rainE) * 0.18) % 1;
        if (shP < 0.35) {
          const sp2 = shP / 0.35;
          const sx = cx - tw / 2 - 40 + sp2 * (tw + 80);
          const sGr = ctx.createLinearGradient(sx - 50, 0, sx + 50, 0);
          sGr.addColorStop(0, 'rgba(255,255,255,0)');
          sGr.addColorStop(0.4, `rgba(255,255,255,0.25)`);
          sGr.addColorStop(0.5, `rgba(255,255,255,0.45)`);
          sGr.addColorStop(0.6, `rgba(255,255,255,0.25)`);
          sGr.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = sGr;
          ctx.fillRect(sx - 50, mTY - mSz * 0.5, 100, mSz);
        }

        // Outer glow
        ctx.shadowColor = 'rgba(255,215,0,0.3)';
        ctx.shadowBlur = 45;
        ctx.fillStyle = 'rgba(255,215,0,0.04)';
        ctx.fillText("Happy Valentine's Day", cx, mTY);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Divider
        const lnW = Math.min(w * 0.12, 100) * txtP;
        const lnY = mTY + mSz * 0.75;
        const lnG = ctx.createLinearGradient(cx - lnW, 0, cx + lnW, 0);
        lnG.addColorStop(0, 'rgba(251,191,36,0)');
        lnG.addColorStop(0.3, 'rgba(251,191,36,0.35)');
        lnG.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        lnG.addColorStop(0.7, 'rgba(251,191,36,0.35)');
        lnG.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.strokeStyle = lnG;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(cx - lnW, lnY); ctx.lineTo(cx + lnW, lnY); ctx.stroke();

        // Subtitle
        const sTY = lnY + mSz * 0.55;
        const sSz = Math.min(w * 0.028, 22);
        ctx.font = `300 ${sSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${sSz * 0.35}px`;
        ctx.fillStyle = `rgba(252,165,165,0.55)`;
        ctx.shadowColor = 'rgba(236,72,153,0.15)';
        ctx.shadowBlur = 12;
        ctx.fillText('Love is Connection', cx, sTY);
        ctx.shadowBlur = 0;

        // Text sparkles
        if (Math.random() < 0.25) {
          sp({ x: cx + rn(-180, 180), y: mTY + rn(-mSz * 0.6, mSz * 0.6), vx: rn(-0.1, 0.1), vy: rn(-0.4, -0.05), sz: rn(0.6, 1.8), a: 0.7, ml: rn(30, 60), r: 255, g: 215, b: 0, tp: 'txtS', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }

        ctx.restore();
      }

      /* ── 13. VIGNETTE ── */
      const vg = ctx.createRadialGradient(cx, h * 0.4, Math.min(w, h) * 0.15, cx, h * 0.4, Math.max(w, h) * 0.9);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.5, 'rgba(0,0,0,0.08)');
      vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      /* ── 14. FILM GRAIN ── */
      ctx.save();
      ctx.globalAlpha = 0.015 * fadeA;
      for (let i = 0; i < 600; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        const gv = Math.random() * 255;
        ctx.fillStyle = `rgb(${gv},${gv},${gv})`;
        ctx.fillRect(gx, gy, 1, 1);
      }
      ctx.restore();

      /* ── 15. FADE TO BLACK ── */
      if (t > TL.fadeS) {
        const fO = eOC(cl((t - TL.fadeS) / (TL.end - TL.fadeS), 0, 1));
        ctx.fillStyle = `rgba(2,4,12,${fO})`;
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
  }, [onComplete]);

  return (
    <canvas
      ref={cvRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        display: 'block', background: '#020818',
        zIndex: 9999,
      }}
    />
  );
}
