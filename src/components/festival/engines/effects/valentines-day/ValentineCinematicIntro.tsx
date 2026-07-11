'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   VALENTINE 2027 — Cinematic Love Story (V3: Real Characters + Heart Rain)
   12.5s Disney-Pixar-Apple Premium Experience
   ═══════════════════════════════════════════════════════════════ */

interface P {
  x: number; y: number; vx: number; vy: number;
  sz: number; a: number; life: number; ml: number;
  r: number; g: number; b: number;
  rot: number; rotSpd: number; tmbSpd: number;
  tp: 'dust' | 'sparkle' | 'tinyH' | 'orbG' | 'orbP' | 'burst' | 'txtS';
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
    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

    const TL = {
      walkE: 3.8, gestE: 5.2, orbE: 7.2, explE: 8.2,
      rainE: 10.5, txtE: 11.5, fadeS: 11.5, end: 12.5,
    };

    const C = {
      skyTop: '#020818', skyMid: '#06102e', skyBot: '#0a0a20',
      moon: '#e8e0f0',
      gold: [251, 191, 36], pink: [236, 72, 153],
      shortsRed: '#dc2626', dressPink: '#f43f5e',
      shoeYellow: '#facc15', shoePink: '#e11d48',
      btnYellow: '#facc15', skinLight: '#fde8d0', skinMid: '#f5cba7',
    };

    // ✅ Heart rain colors — rich reds, pinks, soft gold
    const HEART_RAIN_COLS = [
      [220, 38, 38], [185, 28, 28], [239, 68, 68],
      [244, 63, 94], [251, 113, 133], [252, 165, 165],
      [225, 29, 72], [190, 18, 60], [251, 191, 36],
    ];

    const stars: Star[] = [];
    function genStars() {
      stars.length = 0;
      for (let i = 0; i < 220; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h * 0.6, s: rn(0.3, 1.8), tw: rn(0.4, 2.5), of: rn(0, TAU), br: rn(0.25, 0.85) });
      }
    }

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

    const gTr: { x: number; y: number }[] = [];
    const pTr: { x: number; y: number }[] = [];
    const TRM = 45;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv!.width = w * dpr; cv!.height = h * dpr;
      cv!.style.width = w + 'px'; cv!.style.height = h + 'px';
      genStars();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ═══ ENHANCED DRAWING HELPERS ═══ */

    // ✅ Better heart shape — rounder, more symmetrical
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

    // ✅ Pretty falling heart with glow
    function drawPrettyHeart(x: number, y: number, sz: number, r: number, g: number, b: number, glow: boolean) {
      ctx.save();
      ctx.translate(x, y);
      const s = sz;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.05, s * 0.05, -s * 0.5, -s * 0.25, -s * 0.5, 0);
      ctx.bezierCurveTo(-s * 0.5, s * 0.3, 0, s * 0.55, 0, s * 0.75);
      ctx.bezierCurveTo(0, s * 0.55, s * 0.5, s * 0.3, s * 0.5, 0);
      ctx.bezierCurveTo(s * 0.5, -s * 0.25, s * 0.05, s * 0.05, 0, s * 0.3);
      ctx.closePath();

      if (glow) {
        ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
        ctx.shadowBlur = s * 2;
      }

      // Gradient fill
      const hG = ctx.createRadialGradient(0, s * 0.15, 0, 0, s * 0.15, s * 0.7);
      hG.addColorStop(0, `rgba(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)},1)`);
      hG.addColorStop(0.5, `rgb(${r},${g},${b})`);
      hG.addColorStop(1, `rgb(${Math.max(0,r-40)},${Math.max(0,g-30)},${Math.max(0,b-30)})`);
      ctx.fillStyle = hG;
      ctx.fill();

      // Top highlight
      ctx.beginPath();
      ctx.ellipse(-s * 0.18, -s * 0.08, s * 0.18, s * 0.12, -0.3, 0, TAU);
      ctx.fillStyle = `rgba(255,255,255,0.25)`;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.restore();
    }

    /* ═══ ENHANCED DISNEY CHARACTER ═══ */
    function drawDisneyCharacter(x: number, y: number, s: number, face: number, isMinnie: boolean, opts: {
      aLX?: number; aLY?: number; aRX?: number; aRY?: number;
      legL?: number; legR?: number; turn?: number;
    }) {
      const { aLX = -14, aLY = 20, aRX = 14, aRY = 20, legL = 0, legR = 0, turn = 0 } = opts;
      const shoeCol = isMinnie ? C.shoePink : C.shoeYellow;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s * face, s);
      ctx.rotate(turn);

      // ── 1. LEGS & SHOES ──
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineCap = 'round';

      // Left leg
      ctx.save(); ctx.translate(-5, 27); ctx.rotate(legL);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 13); ctx.stroke();
      // Shoe with gradient
      const shG1 = ctx.createLinearGradient(-6, 12, 6, 18);
      shG1.addColorStop(0, shoeCol);
      shG1.addColorStop(1, isMinnie ? '#be123c' : '#ca8a04');
      ctx.fillStyle = shG1;
      ctx.beginPath(); ctx.ellipse(0, 15, 6.5, 4.5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
      // Shoe highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.ellipse(-2, 13, 3, 1.5, -0.2, 0, TAU); ctx.fill();
      ctx.restore();

      // Right leg
      ctx.save(); ctx.translate(5, 27); ctx.rotate(legR);
      ctx.lineWidth = 5; ctx.strokeStyle = '#1a1a2e';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 13); ctx.stroke();
      const shG2 = ctx.createLinearGradient(-6, 12, 6, 18);
      shG2.addColorStop(0, shoeCol);
      shG2.addColorStop(1, isMinnie ? '#be123c' : '#ca8a04');
      ctx.fillStyle = shG2;
      ctx.beginPath(); ctx.ellipse(0, 15, 6.5, 4.5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.ellipse(-2, 13, 3, 1.5, -0.2, 0, TAU); ctx.fill();
      ctx.restore();

      // ── 2. BODY / CLOTHING ──
      if (isMinnie) {
        // Dress with gradient & skirt flare
        const dG = ctx.createLinearGradient(0, 8, 0, 27);
        dG.addColorStop(0, '#fb7185');
        dG.addColorStop(0.5, C.dressPink);
        dG.addColorStop(1, '#be123c');
        ctx.fillStyle = dG;
        ctx.beginPath();
        ctx.moveTo(-9, 10);
        ctx.quadraticCurveTo(-12, 18, -14, 27);
        ctx.lineTo(14, 27);
        ctx.quadraticCurveTo(12, 18, 9, 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();

        // White collar
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 10, 6, 2.5, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();

        // Polka-dots grid (more dots!)
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        const dots = [[-4,15],[4,15],[0,20],[-7,20],[7,20],[-3,25],[3,25],[-8,24],[8,24],[-5,11],[5,11]];
        for (const [dx, dy] of dots) {
          ctx.beginPath(); ctx.arc(dx, dy, 1.6, 0, TAU); ctx.fill();
        }
      } else {
        // Mickey upper body (dark with subtle blue tint)
        const bG = ctx.createRadialGradient(0, 12, 0, 0, 12, 14);
        bG.addColorStop(0, '#1a1a30');
        bG.addColorStop(1, '#0a0a18');
        ctx.fillStyle = bG;
        ctx.beginPath(); ctx.ellipse(0, 14, 10, 14, 0, 0, TAU); ctx.fill();

        // Red shorts with gradient
        const sG = ctx.createLinearGradient(0, 14, 0, 26);
        sG.addColorStop(0, '#ef4444');
        sG.addColorStop(0.5, C.shortsRed);
        sG.addColorStop(1, '#991b1b');
        ctx.fillStyle = sG;
        ctx.beginPath();
        ctx.ellipse(0, 20, 10, 8.5, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#000000'; ctx.lineWidth = 0.8; ctx.stroke();

        // Yellow buttons with 3D effect
        for (const bx of [-3.5, 3.5]) {
          ctx.fillStyle = '#b45309';
          ctx.beginPath(); ctx.ellipse(bx, 20, 1.8, 2.8, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = C.btnYellow;
          ctx.beginPath(); ctx.ellipse(bx - 0.3, 19.5, 1.5, 2.2, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath(); ctx.ellipse(bx - 0.6, 18.8, 0.6, 0.7, -0.3, 0, TAU); ctx.fill();
        }
      }

      // ── 3. ARMS & GLOVES ──
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineCap = 'round';

      // Left arm
      ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(aLX, aLY); ctx.stroke();
      // Glove with gradient
      const glG1 = ctx.createRadialGradient(aLX - 1, aLY - 1, 0, aLX, aLY, 5);
      glG1.addColorStop(0, '#ffffff');
      glG1.addColorStop(0.7, '#f0f0f0');
      glG1.addColorStop(1, '#d0d0d0');
      ctx.fillStyle = glG1;
      ctx.beginPath(); ctx.arc(aLX, aLY, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 0.8; ctx.stroke();
      // Glove line detail
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(aLX - 3, aLY + 3); ctx.lineTo(aLX + 3, aLY - 3); ctx.stroke();

      // Right arm
      ctx.lineWidth = 5; ctx.strokeStyle = '#1a1a2e';
      ctx.beginPath(); ctx.moveTo(9, 8); ctx.lineTo(aRX, aRY); ctx.stroke();
      const glG2 = ctx.createRadialGradient(aRX - 1, aRY - 1, 0, aRX, aRY, 5);
      glG2.addColorStop(0, '#ffffff');
      glG2.addColorStop(0.7, '#f0f0f0');
      glG2.addColorStop(1, '#d0d0d0');
      ctx.fillStyle = glG2;
      ctx.beginPath(); ctx.arc(aRX, aRY, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(aRX - 3, aRY + 3); ctx.lineTo(aRX + 3, aRY - 3); ctx.stroke();

      // ── 4. HEAD ──
      const hG = ctx.createRadialGradient(-2, -10, 0, 0, -8, 13);
      hG.addColorStop(0, '#1e1e35');
      hG.addColorStop(1, '#0e0e1e');
      ctx.fillStyle = hG;
      ctx.beginPath(); ctx.arc(0, -8, 13, 0, TAU); ctx.fill();

      // ── 5. EARS ──
      ctx.fillStyle = '#12122a';
      ctx.beginPath(); ctx.arc(-12, -20, 7.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(12, -20, 7.5, 0, TAU); ctx.fill();

      // ── 6. FACE DETAILS ✅ NEW ──
      // Skin area (front of face, lighter)
      const fG = ctx.createRadialGradient(0, -6, 0, 0, -6, 10);
      fG.addColorStop(0, C.skinLight);
      fG.addColorStop(0.6, C.skinMid);
      fG.addColorStop(1, 'rgba(245,203,167,0)');
      ctx.fillStyle = fG;
      ctx.beginPath(); ctx.ellipse(0, -6, 9, 10, 0, 0, TAU); ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(-4, -9, 3.5, 4, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4, -9, 3.5, 4, 0, 0, TAU); ctx.fill();
      // Pupils
      ctx.fillStyle = '#0a0a15';
      ctx.beginPath(); ctx.ellipse(-3.5, -8.5, 2, 2.8, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4.5, -8.5, 2, 2.8, 0, 0, TAU); ctx.fill();
      // Eye shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-4.2, -9.8, 1, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(3.8, -9.8, 1, 0, TAU); ctx.fill();

      // Nose
      ctx.fillStyle = C.skinMid;
      ctx.beginPath(); ctx.ellipse(0, -5.5, 2.2, 1.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(0, -5, 1.5, 0.8, 0, 0, TAU); ctx.fill();

      // Smile
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, -4, 5, 0.15, Math.PI - 0.15); ctx.stroke();

      // Cheek blush
      ctx.fillStyle = 'rgba(255,130,130,0.18)';
      ctx.beginPath(); ctx.ellipse(-7, -4, 3, 2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(7, -4, 3, 2, 0, 0, TAU); ctx.fill();

      // ── 7. MINNIE SPECIFIC ──
      if (isMinnie) {
        // Large detailed bow
        ctx.fillStyle = C.dressPink;
        // Left loop
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.bezierCurveTo(-4, -28, -12, -30, -10, -26);
        ctx.bezierCurveTo(-9, -22, -3, -23, 0, -25);
        ctx.fill();
        // Right loop
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.bezierCurveTo(4, -28, 12, -30, 10, -26);
        ctx.bezierCurveTo(9, -22, 3, -23, 0, -25);
        ctx.fill();
        // Bow outlines
        ctx.strokeStyle = '#be123c'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.bezierCurveTo(-4, -28, -12, -30, -10, -26);
        ctx.bezierCurveTo(-9, -22, -3, -23, 0, -25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.bezierCurveTo(4, -28, 12, -30, 10, -26);
        ctx.bezierCurveTo(9, -22, 3, -23, 0, -25);
        ctx.stroke();
        // Bow dots
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(-6, -26.5, 1.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -26.5, 1.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(-3, -28, 1, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -28, 1, 0, TAU); ctx.fill();
        // Center knot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, -24.5, 2.8, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#be123c'; ctx.lineWidth = 0.6; ctx.stroke();

        // Eyelashes (3 per eye)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        // Left eye lashes
        ctx.beginPath(); ctx.moveTo(-7.5, -12); ctx.quadraticCurveTo(-11, -14, -13, -10.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-7, -10.5); ctx.quadraticCurveTo(-10.5, -12, -12.5, -9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-7.5, -9.5); ctx.quadraticCurveTo(-10, -10, -11.5, -7.5); ctx.stroke();
        // Right eye lashes
        ctx.beginPath(); ctx.moveTo(7.5, -12); ctx.quadraticCurveTo(11, -14, 13, -10.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7, -10.5); ctx.quadraticCurveTo(10.5, -12, 12.5, -9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7.5, -9.5); ctx.quadraticCurveTo(10, -10, 11.5, -7.5); ctx.stroke();

        // Minnie's eyeliner (subtle)
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(-4, -9, 3.8, 4.3, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(4, -9, 3.8, 4.3, 0, 0, TAU); ctx.stroke();
      }

      // Moonlight rim on head & ears
      ctx.strokeStyle = 'rgba(180,200,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, -8, 13.5, -2.3, -0.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(12, -20, 8, -1.5, 0.5); ctx.stroke();

      // Ear inner highlight
      ctx.fillStyle = 'rgba(180,190,220,0.08)';
      ctx.beginPath(); ctx.arc(12.5, -20.5, 4, 0, TAU); ctx.fill();

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

      const fadeA = 1 - eOC(cl((t - TL.fadeS) / (TL.end - TL.fadeS), 0, 1));
      if (fadeA <= 0.01) { onComplete(); return; }

      let camY = 0;
      if (t > 4.5 && t < 8.0) {
        const cp = eIO(cl((t - 4.5) / 3.5, 0, 1));
        camY = -cp * h * 0.06;
      }

      ctx.save();
      ctx.translate(0, camY);

      // 1. SKY
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, C.skyTop); sky.addColorStop(0.45, C.skyMid); sky.addColorStop(1, C.skyBot);
      ctx.fillStyle = sky; ctx.fillRect(0, -20, w, h + 40);

      // 2. MOON
      const mGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.3, moonX, moonY, moonR * 5);
      mGlow.addColorStop(0, 'rgba(180,190,240,0.12)'); mGlow.addColorStop(0.3, 'rgba(140,160,220,0.04)'); mGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mGlow; ctx.fillRect(moonX - moonR * 5, moonY - moonR * 5, moonR * 10, moonR * 10);
      ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, TAU);
      const mF = ctx.createRadialGradient(moonX - moonR * 0.2, moonY - moonR * 0.2, 0, moonX, moonY, moonR);
      mF.addColorStop(0, '#f5f0ff'); mF.addColorStop(0.6, '#e0d8f0'); mF.addColorStop(1, '#c8c0d8');
      ctx.fillStyle = mF; ctx.fill();

      // 3. STARS
      const starFade = t < 1.5 ? eOC(t / 1.5) : 1;
      for (const s of stars) {
        const tw = 0.4 + 0.6 * Math.sin(t * s.tw + s.of);
        const a = s.br * tw * starFade * fadeA;
        if (a < 0.01) continue;
        ctx.fillStyle = `rgba(210,220,255,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
      }

      // 4. GROUND
      const gndH = ctx.createLinearGradient(0, groundY - 15, 0, groundY + 30);
      gndH.addColorStop(0, 'rgba(10,10,35,0)'); gndH.addColorStop(0.5, 'rgba(15,12,40,0.25)'); gndH.addColorStop(1, 'rgba(10,10,35,0)');
      ctx.fillStyle = gndH; ctx.fillRect(0, groundY - 15, w, 45);

      // 5. CHARACTERS
      const rawWalkP = cl(t / TL.walkE, 0, 1);
      const easedWalkP = easeInOutSine(rawWalkP);
      const mX = lerp(-60, cx - 65 * cScale, easedWalkP);
      const mnX = lerp(w + 60, cx + 65 * cScale, easedWalkP);
      const wCyc = t * 6.5;
      const wDecay = 1 - easedWalkP;
      const bounce = Math.abs(Math.sin(wCyc)) * 3.8 * wDecay;
      const legL = Math.sin(wCyc) * 0.48 * wDecay;
      const legR = -legL;
      const armSwing = Math.sin(wCyc) * 8.0 * wDecay;

      const gestP = eOC(cl((t - TL.walkE) / 0.6, 0, 1));
      const armRaiseP = eOB(cl((t - TL.walkE - 0.5) / 0.8, 0, 1));
      const turnAmt = gestP * 0.08;

      const mLX = lerp(-16, -14, gestP), mLY = lerp(20 + armSwing, 20, gestP);
      const mRX = lerp(16, 42, gestP), mRY = lerp(20 - armSwing, -50, armRaiseP);
      const mnLX = lerp(16, 42, gestP), mnLY = lerp(20 - armSwing, -50, armRaiseP);
      const mnRX = lerp(-16, -14, gestP), mnRY = lerp(20 + armSwing, 20, gestP);
      const legDecay = 1 - gestP * 0.9;

      const shA = 0.18 * fadeA;
      if (shA > 0.005) {
        ctx.fillStyle = `rgba(0,0,0,${shA})`;
        ctx.beginPath(); ctx.ellipse(mX, groundY + 3, 26 * cScale, 6 * cScale, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mnX, groundY + 3, 26 * cScale, 6 * cScale, 0, 0, TAU); ctx.fill();
      }

      drawDisneyCharacter(mX, groundY - bounce * cScale, cScale, 1, false, {
        aLX: mLX, aLY: mLY, aRX: mRX, aRY: mRY,
        legL: legL * legDecay, legR: legR * legDecay, turn: -turnAmt,
      });
      drawDisneyCharacter(mnX, groundY - bounce * cScale, cScale * 0.95, -1, true, {
        aLX: mnLX, aLY: mnLY, aRX: mnRX, aRY: mnRY,
        legL: -legL * legDecay, legR: -legR * legDecay, turn: -turnAmt,
      });

      // ── 6. HAND HEART (FIXED: Richer, deeper glow) ──
      const heartApp = eOC(cl((t - (TL.walkE - 0.3)) / 0.6, 0, 1));
      if (heartApp > 0.01 && t < TL.orbE) {
        const hX = cx;
        const hY = groundY - 68 * cScale;
        const hPulse = 1 + Math.sin((t - 4.2) * 5.5) * 0.14;
        const hSz = 2.0 * cScale * heartApp * hPulse;
        const hFade = t > TL.orbE - 0.5 ? 1 - eOC(cl((t - (TL.orbE - 0.5)) / 0.5, 0, 1)) : 1;
        const hAl = heartApp * hFade * fadeA;

        // Multi-layer glow
        const hG1 = ctx.createRadialGradient(hX, hY, 0, hX, hY, hSz * 7);
        hG1.addColorStop(0, `rgba(239,68,68,${0.3 * hAl})`);
        hG1.addColorStop(0.3, `rgba(251,191,36,${0.12 * hAl})`);
        hG1.addColorStop(0.6, `rgba(236,72,153,${0.06 * hAl})`);
        hG1.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hG1;
        ctx.beginPath(); ctx.arc(hX, hY, hSz * 7, 0, TAU); ctx.fill();

        // Heart shape
        ctx.save();
        ctx.translate(hX, hY);
        ctx.scale(hSz, hSz);
        drawHeartShape(1);

        // Rich gradient
        const hGr = ctx.createLinearGradient(-16, -17, 16, 15);
        hGr.addColorStop(0, '#7f1d1d');
        hGr.addColorStop(0.15, '#dc2626');
        hGr.addColorStop(0.3, '#ef4444');
        hGr.addColorStop(0.42, '#fca5a5');
        hGr.addColorStop(0.5, '#ffffff');
        hGr.addColorStop(0.58, '#fca5a5');
        hGr.addColorStop(0.7, '#ef4444');
        hGr.addColorStop(0.85, '#dc2626');
        hGr.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = hGr;
        ctx.shadowColor = `rgba(239,68,68,${0.8 * hAl})`;
        ctx.shadowBlur = 30;
        ctx.globalAlpha = hAl;
        ctx.fill();

        // Inner bright glow
        ctx.globalCompositeOperation = 'source-atop';
        const iG = ctx.createRadialGradient(0, -4, 0, 0, -4, 10);
        iG.addColorStop(0, `rgba(255,255,255,${0.5 * hAl})`);
        iG.addColorStop(0.4, `rgba(255,220,200,${0.15 * hAl})`);
        iG.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = iG;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        if (hAl > 0.3 && Math.random() < 0.35) {
          sp({ x: hX + rn(-25, 25) * hSz, y: hY + rn(-25, 25) * hSz, vx: rn(-0.5, 0.5), vy: rn(-1, -0.2), sz: rn(1, 2.5), a: 0.85, ml: rn(20, 40), r: 255, g: 250, b: 220, tp: 'sparkle', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
      }

      // ── 7. ENERGY ORBS ──
      const orbP = cl((t - TL.gestE) / (TL.orbE - TL.gestE), 0, 1);
      if (orbP > 0 && orbP < 1) {
        const hC = { x: cx, y: groundY - 68 * cScale };
        const sC = { x: cx, y: h * 0.22 };
        const spA = orbP * Math.PI * 10;
        const spR = 35 * (1 - orbP * 0.7) * cScale;
        const gOx = hC.x + Math.cos(spA) * spR;
        const gOy = lerp(hC.y, sC.y, eIO(orbP)) + Math.sin(spA * 0.7) * spR * 0.4;
        const pOx = hC.x + Math.cos(spA + Math.PI) * spR;
        const pOy = lerp(hC.y, sC.y, eIO(orbP)) + Math.sin((spA + Math.PI) * 0.7) * spR * 0.4;

        gTr.push({ x: gOx, y: gOy }); pTr.push({ x: pOx, y: pOy });
        if (gTr.length > TRM) gTr.shift();
        if (pTr.length > TRM) pTr.shift();

        ctx.save(); ctx.globalAlpha = fadeA;
        for (const [trail, col] of [[gTr, C.gold], [pTr, C.pink]] as const) {
          if (trail.length > 2) {
            const s = trail[0], e = trail[trail.length - 1];
            const tg = ctx.createLinearGradient(s.x, s.y, e.x, e.y);
            tg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0)`);
            tg.addColorStop(0.3, `rgba(${col[0]},${col[1]},${col[2]},0.08)`);
            tg.addColorStop(0.7, `rgba(${col[0]},${col[1]},${col[2]},0.35)`);
            tg.addColorStop(1, `rgba(255,255,255,0.6)`);
            ctx.strokeStyle = tg; ctx.lineWidth = 7; ctx.lineCap = 'round';
            ctx.globalAlpha = 0.2 * fadeA;
            ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length - 1; i++) {
              const xc = (trail[i].x + trail[i + 1].x) / 2;
              const yc = (trail[i].y + trail[i + 1].y) / 2;
              ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
            }
            ctx.stroke();
            ctx.lineWidth = 2.5; ctx.globalAlpha = 0.8 * fadeA; ctx.stroke();
          }
        }
        ctx.restore();

        ctx.save(); ctx.globalAlpha = fadeA; ctx.globalCompositeOperation = 'lighter';
        for (const [ox, oy, col] of [[gOx, gOy, C.gold], [pOx, pOy, C.pink]] as const) {
          const oG = ctx.createRadialGradient(ox, oy, 0, ox, oy, 22);
          oG.addColorStop(0, 'rgba(255,255,255,0.9)');
          oG.addColorStop(0.15, `rgba(${col[0]},${col[1]},${col[2]},0.7)`);
          oG.addColorStop(0.5, `rgba(${col[0]},${col[1]},${col[2]},0.15)`);
          oG.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
          ctx.fillStyle = oG;
          ctx.beginPath(); ctx.arc(ox, oy, 22, 0, TAU); ctx.fill();
        }
        ctx.restore();

        if (Math.random() < 0.5) {
          sp({ x: gOx, y: gOy, vx: rn(-0.2, 0.2), vy: rn(-0.3, 0.1), sz: rn(0.6, 1.5), a: 0.6, ml: rn(15, 30), r: C.gold[0], g: C.gold[1], b: C.gold[2], tp: 'orbG', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
          sp({ x: pOx, y: pOy, vx: rn(-0.2, 0.2), vy: rn(-0.3, 0.1), sz: rn(0.6, 1.5), a: 0.6, ml: rn(15, 30), r: C.pink[0], g: C.pink[1], b: C.pink[2], tp: 'orbP', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
      }

      // ── 8. HEART EXPLOSION ──
      const explP = cl((t - TL.orbE) / (TL.explE - TL.orbE), 0, 1);
      if (explP > 0 && explP < 1) {
        const eX = cx, eY = h * 0.22;
        const bA = Math.sin(explP * Math.PI);
        const bigH = eOB(cl(explP / 0.5, 0, 1));
        if (bigH > 0.01) {
          ctx.save(); ctx.translate(eX, eY);
          ctx.scale(bigH * cScale * 3.2, bigH * cScale * 3.2);
          drawHeartShape(1);
          const eGr = ctx.createLinearGradient(-18, -18, 18, 16);
          eGr.addColorStop(0, '#ffffff');
          eGr.addColorStop(0.2, '#fca5a5');
          eGr.addColorStop(0.45, '#ef4444');
          eGr.addColorStop(0.7, '#fbbf24');
          eGr.addColorStop(1, '#dc2626');
          ctx.fillStyle = eGr;
          ctx.shadowColor = `rgba(239,68,68,${bA * 0.85})`; ctx.shadowBlur = 60;
          ctx.globalAlpha = bA * fadeA; ctx.fill();
          ctx.restore();
        }
        const flG = ctx.createRadialGradient(eX, eY, 0, eX, eY, 320 * bA);
        flG.addColorStop(0, `rgba(255,230,220,${bA * 0.4})`);
        flG.addColorStop(0.25, `rgba(251,191,36,${bA * 0.2})`);
        flG.addColorStop(0.6, `rgba(236,72,153,${bA * 0.1})`);
        flG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flG; ctx.globalAlpha = fadeA;
        ctx.fillRect(eX - 350, eY - 350, 700, 700);
        if (explP < 0.35 && Math.random() < 0.7) {
          const ba = rn(0, TAU), spd = rn(2.5, 6.5);
          const col = Math.random() > 0.5 ? C.gold : C.pink;
          sp({ x: eX, y: eY, vx: Math.cos(ba) * spd, vy: Math.sin(ba) * spd, sz: rn(1.5, 3.5), a: 0.9, ml: rn(30, 60), r: col[0], g: col[1], b: col[2], tp: 'burst', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
      }

      // ── 9. AMBIENT ──
      if (t > 0.5 && Math.random() < 0.08) {
        sp({ x: rn(0, w), y: rn(h * 0.1, h * 0.7), vx: rn(-0.03, 0.03), vy: rn(-0.04, 0.01), sz: rn(0.3, 0.8), a: rn(0.03, 0.1), ml: rn(200, 400), r: 160, g: 170, b: 220, tp: 'dust', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
      }

      // ── 10. HEART RAIN (No petals — all hearts!) ──
      const rainP = cl((t - TL.explE) / (TL.rainE - TL.explE), 0, 1);
      if (rainP > 0 && t < TL.end) {
        const rate = rainP < 0.1 ? rainP / 0.1 * 5 : 5;
        for (let i = 0; i < rate; i++) {
          const hc = HEART_RAIN_COLS[Math.floor(Math.random() * HEART_RAIN_COLS.length)];
          const hasGlow = Math.random() < 0.35;
          const sz = rn(5, 14);
          sp({
            x: rn(-30, w + 30), y: rn(-40, -5),
            vx: rn(-0.3, 0.3), vy: rn(0.5, 1.3),
            sz, a: rn(0.55, 0.9), ml: rn(200, 380),
            r: hc[0], g: hc[1], b: hc[2], tp: 'tinyH',
            rot: rn(-0.3, 0.3), rotSpd: rn(-0.012, 0.012), tmbSpd: rn(0.015, 0.05), sx: 1,
          });
        }
        if (Math.random() < 0.15) {
          sp({ x: rn(0, w), y: rn(h * 0.2, h * 0.75), vx: rn(-0.08, 0.08), vy: rn(-0.1, 0.05), sz: rn(0.5, 1.5), a: rn(0.15, 0.4), ml: rn(60, 120), r: 255, g: 200, b: 200, tp: 'sparkle', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
      }

      // ── 11. PARTICLES ──
      let alive = 0;
      for (let i = 0; i < pc; i++) {
        const p = pts[i]; p.life++;
        if (p.life >= p.ml) continue;
        p.x += p.vx; p.y += p.vy;
        const lt = p.life / p.ml;
        let al = p.a;

        switch (p.tp) {
          case 'dust': al *= (1 - lt); p.vx += rn(-0.002, 0.002); break;
          case 'sparkle': al *= (1 - lt * lt) * (0.4 + 0.6 * Math.sin(p.life * 0.15)); p.vy -= 0.002; break;
          case 'tinyH':
            p.x += Math.sin(p.life * 0.018 + p.rot) * 0.4;
            p.rot += p.rotSpd;
            // ✅ 3D tumble via scale oscillation
            const tmb = Math.abs(Math.cos(p.life * p.tmbSpd));
            al *= Math.sin(lt * Math.PI) * 0.9 + 0.1;
            p.sx = 0.6 + tmb * 0.4;
            p.vy += 0.001;
            break;
          case 'orbG': case 'orbP': al *= (1 - lt * lt); p.vx *= 0.95; p.vy *= 0.95; break;
          case 'burst': al *= (1 - lt * lt); p.vx *= 0.97; p.vy *= 0.97; p.vy += 0.015; break;
          case 'txtS': al *= (1 - lt * lt) * (0.5 + 0.5 * Math.sin(p.life * 0.12)); p.vy -= 0.003; break;
        }
        if (al < 0.003 || p.y > h + 50) continue;

        ctx.save(); ctx.globalAlpha = al * fadeA;

        switch (p.tp) {
          case 'dust':
            ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
            break;
          case 'sparkle': case 'orbG': case 'orbP': case 'txtS': {
            const sG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz * 3);
            sG.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.75)`);
            sG.addColorStop(0.25, `rgba(${p.r},${p.g},${p.b},0.2)`);
            sG.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
            ctx.fillStyle = sG;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 3, 0, TAU); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${al * 0.5})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.3, p.sz * 0.3), 0, TAU); ctx.fill();
            break;
          }
          case 'tinyH':
            // ✅ Draw pretty heart with optional glow
            drawPrettyHeart(p.x, p.y, p.sz * p.sx, p.r, p.g, p.b, p.sz > 9);
            break;
          case 'burst': {
            const bG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz * 4);
            bG.addColorStop(0, `rgba(255,255,255,0.6)`);
            bG.addColorStop(0.2, `rgba(${p.r},${p.g},${p.b},0.4)`);
            bG.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
            ctx.fillStyle = bG;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 4, 0, TAU); ctx.fill();
            break;
          }
        }
        ctx.restore();
        pts[alive++] = p;
      }
      pc = alive;

      ctx.restore(); // camera

      // ── 12. TEXT ──
      const txtP = eOC(cl((t - TL.rainE) / (TL.txtE - TL.rainE), 0, 1));
      if (txtP > 0.01) {
        const tA = txtP * fadeA;
        ctx.save(); ctx.globalAlpha = tA;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        const mTY = h * 0.30;
        const mSz = Math.min(w * 0.065, 56);
        ctx.font = `800 ${mSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${mSz * 0.02}px`;

        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 35; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 10;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText("Happy Valentine's Day", cx, mTY);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

        const tG = ctx.createLinearGradient(cx - 250, mTY - mSz / 2, cx + 250, mTY + mSz / 2);
        tG.addColorStop(0, '#8b6914'); tG.addColorStop(0.15, '#b8860b'); tG.addColorStop(0.3, '#ffd700');
        tG.addColorStop(0.45, '#fff8dc'); tG.addColorStop(0.55, '#ffd700'); tG.addColorStop(0.7, '#daa520');
        tG.addColorStop(0.85, '#b8860b'); tG.addColorStop(1, '#8b6914');
        ctx.fillStyle = tG; ctx.fillText("Happy Valentine's Day", cx, mTY);

        ctx.save();
        const tw = ctx.measureText("Happy Valentine's Day").width;
        ctx.beginPath(); ctx.rect(cx - tw / 2, mTY - mSz * 0.55, tw, mSz * 0.45); ctx.clip();
        const tH = ctx.createLinearGradient(cx, mTY - mSz * 0.55, cx, mTY - mSz * 0.1);
        tH.addColorStop(0, 'rgba(255,255,255,0.35)'); tH.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = tH; ctx.fillText("Happy Valentine's Day", cx, mTY);
        ctx.restore();

        const shP = ((t - TL.rainE) * 0.18) % 1;
        if (shP < 0.35) {
          const sp2 = shP / 0.35;
          const sx = cx - tw / 2 - 40 + sp2 * (tw + 80);
          const sGr = ctx.createLinearGradient(sx - 50, 0, sx + 50, 0);
          sGr.addColorStop(0, 'rgba(255,255,255,0)'); sGr.addColorStop(0.4, 'rgba(255,255,255,0.25)');
          sGr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sGr.addColorStop(0.6, 'rgba(255,255,255,0.25)');
          sGr.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = sGr; ctx.fillRect(sx - 50, mTY - mSz * 0.5, 100, mSz);
        }

        ctx.shadowColor = 'rgba(255,215,0,0.3)'; ctx.shadowBlur = 45;
        ctx.fillStyle = 'rgba(255,215,0,0.04)'; ctx.fillText("Happy Valentine's Day", cx, mTY);
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

        const lnW = Math.min(w * 0.12, 100) * txtP;
        const lnY = mTY + mSz * 0.75;
        const lnG = ctx.createLinearGradient(cx - lnW, 0, cx + lnW, 0);
        lnG.addColorStop(0, 'rgba(251,191,36,0)'); lnG.addColorStop(0.3, 'rgba(251,191,36,0.35)');
        lnG.addColorStop(0.5, 'rgba(255,255,255,0.5)'); lnG.addColorStop(0.7, 'rgba(251,191,36,0.35)');
        lnG.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.strokeStyle = lnG; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(cx - lnW, lnY); ctx.lineTo(cx + lnW, lnY); ctx.stroke();

        const sTY = lnY + mSz * 0.55;
        const sSz = Math.min(w * 0.028, 22);
        ctx.font = `300 ${sSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${sSz * 0.35}px`;
        ctx.fillStyle = 'rgba(252,165,165,0.55)';
        ctx.shadowColor = 'rgba(236,72,153,0.15)'; ctx.shadowBlur = 12;
        ctx.fillText('Love is Connection', cx, sTY);
        ctx.shadowBlur = 0;

        if (Math.random() < 0.25) {
          sp({ x: cx + rn(-180, 180), y: mTY + rn(-mSz * 0.6, mSz * 0.6), vx: rn(-0.1, 0.1), vy: rn(-0.4, -0.05), sz: rn(0.6, 1.8), a: 0.7, ml: rn(30, 60), r: 255, g: 215, b: 0, tp: 'txtS', rot: 0, rotSpd: 0, tmbSpd: 0, sx: 1 });
        }
        ctx.restore();
      }

      // ── 13. VIGNETTE ──
      const vg = ctx.createRadialGradient(cx, h * 0.4, Math.min(w, h) * 0.15, cx, h * 0.4, Math.max(w, h) * 0.9);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.5, 'rgba(0,0,0,0.08)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

      // ── 14. GRAIN ──
      ctx.save(); ctx.globalAlpha = 0.015 * fadeA;
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
      ctx.restore();

      // ── 15. FADE ──
      if (t > TL.fadeS) {
        ctx.fillStyle = `rgba(2,4,12,${eOC(cl((t - TL.fadeS) / (TL.end - TL.fadeS), 0, 1))})`;
        ctx.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => { run = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [onComplete]);

  return (
    <canvas
      ref={cvRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'block', background: '#020818', zIndex: 9999 }}
    />
  );
}
