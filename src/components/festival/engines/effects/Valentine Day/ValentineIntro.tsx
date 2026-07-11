'use client';

import React, { useRef, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════
   VALENTINE 2027 — Cinematic "Warm Darkness" Intro
   ═══════════════════════════════════════════════════════════ */

interface Props { onComplete: () => void; }

export default function ValentineCinematicIntro({ onComplete }: Props) {
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
    const eOQ = (t: number) => 1 - Math.pow(1 - t, 4);
    const TAU = Math.PI * 2;

    /* ── Particle Pool ── */
    interface Pt {
      x: number; y: number; vx: number; vy: number;
      sz: number; a: number; life: number; ml: number;
      r: number; g: number; b: number;
      tp: 'ember' | 'sparkle' | 'dust';
    }
    const MX = 250;
    const pts: Pt[] = [];
    for (let i = 0; i < MX; i++) pts.push({ x:0,y:0,vx:0,vy:0,sz:1,a:0,life:0,ml:1,r:201,g:133,b:107,tp:'ember' });
    let pc = 0;
    function sp(o: Partial<Pt>) {
      if (pc >= MX) return;
      const p = pts[pc];
      p.x=o.x??0; p.y=o.y??0; p.vx=o.vx??0; p.vy=o.vy??0;
      p.sz=o.sz??1; p.a=o.a??1; p.life=0; p.ml=o.ml??100;
      p.r=o.r??201; p.g=o.g??133; p.b=o.b??107; p.tp=o.tp??'ember';
      pc++;
    }

    /* ── Heart parametric: x=16sin³(t), y=-(13cos-5cos2-2cos3-cos4) ── */
    function heartPt(t: number, s: number) {
      return {
        x: 16 * Math.pow(Math.sin(t), 3) * s,
        y: -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) * s,
      };
    }

    /* ── Bokeh ── */
    interface Bk { x:number; y:number; r:number; a:number; spd:number; off:number; cr:number; cg:number; cb:number; }
    const bokehs: Bk[] = [];

    /* ── Resize ── */
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv!.width = w * dpr; cv!.height = h * dpr;
      cv!.style.width = w + 'px'; cv!.style.height = h + 'px';
      bokehs.length = 0;
      for (let i = 0; i < 6; i++) {
        bokehs.push({
          x: w*0.15 + Math.random()*w*0.7, y: h*0.15 + Math.random()*h*0.55,
          r: rn(25,75), a: rn(0.012,0.035), spd: rn(0.25,0.7), off: rn(0,TAU),
          cr: rn(155,215), cg: rn(95,150), cb: rn(95,145),
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);

    /* ═══ TIMELINE ═══ */
    const TL = {
      glowStart: 0.8,   glowPeak: 1.8,
      heartStart: 2.2,  heartEnd: 3.6,
      heartPulse: 3.65, heartFade: 4.2,
      textIn: 4.2,      textFull: 5.2,
      warmWash: 5.6,    fadeOut: 5.9,
      end: 7.0,
    };

    /* ══════════════════ MAIN LOOP ══════════════════ */
    const animate = (ts: number) => {
      if (!run) return;
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = w / 2;
      const cy = h * 0.40;
      const hScale = Math.min(w, h) * 0.011;

      const fadeAlpha = 1 - eOC(cl((t - TL.fadeOut) / (TL.end - TL.fadeOut), 0, 1));
      if (fadeAlpha <= 0.01) {
        if (!doneRef.v) { doneRef.v = true; ocRef.current(); }
        return;
      }

      /* ── 1. BACKGROUND ── */
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#030304');
      bg.addColorStop(0.35, '#05040a');
      bg.addColorStop(0.65, '#0a0812');
      bg.addColorStop(1, '#07050e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* ── 2. HEARTBEAT GLOW ── */
      const glowA = eOC(cl((t - TL.glowStart) / (TL.glowPeak - TL.glowStart), 0, 1));
      // Double-pulse heartbeat
      const hbCycle = ((t - 0.5) % 1.4) / 1.4;
      let hb = 0;
      if (hbCycle < 0.12) hb = Math.sin(hbCycle / 0.12 * Math.PI) * 0.35;
      else if (hbCycle > 0.18 && hbCycle < 0.28) hb = Math.sin((hbCycle-0.18) / 0.10 * Math.PI) * 0.18;

      if (glowA > 0.01) {
        const gr = Math.min(w, h) * (0.22 + hb * 0.06);
        const gG = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
        gG.addColorStop(0, `rgba(201,133,107,${(0.13 + hb*0.08) * glowA})`);
        gG.addColorStop(0.25, `rgba(139,34,82,${0.07 * glowA})`);
        gG.addColorStop(0.55, `rgba(74,32,64,${0.03 * glowA})`);
        gG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gG;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── 3. BOKEH ── */
      if (glowA > 0.08) {
        for (const b of bokehs) {
          const ba = b.a * glowA * (0.6 + 0.4 * Math.sin(t * b.spd + b.off));
          if (ba < 0.002) continue;
          const bG = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
          bG.addColorStop(0, `rgba(${b.cr},${b.cg},${b.cb},${ba})`);
          bG.addColorStop(0.45, `rgba(${b.cr},${b.cg},${b.cb},${ba*0.25})`);
          bG.addColorStop(1, `rgba(${b.cr},${b.cg},${b.cb},0)`);
          ctx.fillStyle = bG;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
        }
      }

      /* ── 4. SPAWN DUST (very early, barely visible) ── */
      if (t > 0.2 && t < 3 && Math.random() < 0.1) {
        sp({
          x: cx + rn(-w*0.12, w*0.12), y: cy + rn(-h*0.08, h*0.08),
          vx: rn(-0.04,0.04), vy: rn(-0.1,-0.01),
          sz: rn(0.2,0.6), a: rn(0.03,0.1), ml: rn(150,300),
          r:180, g:130, b:110, tp:'dust',
        });
      }

      /* ── 5. SPAWN EMBERS (rising from center) ── */
      if (t > TL.glowStart && t < TL.heartFade && Math.random() < 0.22) {
        sp({
          x: cx + rn(-25,25), y: cy + rn(-5,25),
          vx: rn(-0.18,0.18), vy: rn(-0.55,-0.12),
          sz: rn(0.7,1.8), a: rn(0.35,0.75), ml: rn(55,130),
          r:212, g:165, b:116, tp:'ember',
        });
      }

      /* ── 6. HEART LINE DRAWING ── */
      const heartProg = eOQ(cl((t - TL.heartStart) / (TL.heartEnd - TL.heartStart), 0, 1));
      let heartAlpha = heartProg > 0.01 ? 1 : 0;
      if (t > TL.heartFade) {
        heartAlpha = 1 - eOC(cl((t - TL.heartFade) / 0.7, 0, 1));
      }
      // Pulse scale
      let hPulse = 1;
      if (t > TL.heartPulse && t < TL.heartPulse + 0.45) {
        const pp = (t - TL.heartPulse) / 0.45;
        hPulse = 1 + Math.sin(pp * Math.PI) * 0.07;
      }
      // Float up when fading
      let hYOff = 0;
      if (t > TL.heartFade) {
        hYOff = -eOC(cl((t - TL.heartFade) / 0.7, 0, 1)) * h * 0.1;
      }

      if (heartAlpha > 0.01 && heartProg > 0.01) {
        ctx.save();
        ctx.translate(cx, cy + hYOff);
        ctx.scale(hPulse, hPulse);
        ctx.globalAlpha = heartAlpha * fadeAlpha;

        const steps = Math.floor(heartProg * 220);
        if (steps > 1) {
          // Outer glow stroke
          ctx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const ht = (i / 220) * TAU;
            const p = heartPt(ht, hScale);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          }
          if (heartProg >= 0.998) ctx.closePath();
          const hG = ctx.createLinearGradient(-16*hScale, -17*hScale, 16*hScale, 12*hScale);
          hG.addColorStop(0, '#b8704a');
          hG.addColorStop(0.2, '#d4a574');
          hG.addColorStop(0.4, '#e8c4a0');
          hG.addColorStop(0.5, '#fff5ee');
          hG.addColorStop(0.6, '#e8c4a0');
          hG.addColorStop(0.8, '#d4a574');
          hG.addColorStop(1, '#c9856b');
          ctx.strokeStyle = hG;
          ctx.lineWidth = 2;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(201,133,107,0.55)';
          ctx.shadowBlur = 18;
          ctx.stroke();

          // Inner bright edge
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = 'rgba(255,245,238,0.28)';
          ctx.lineWidth = 0.7;
          ctx.stroke();

          // Drawing tip glow (leading point)
          if (heartProg < 0.98) {
            const tipT = (steps / 220) * TAU;
            const tip = heartPt(tipT, hScale);
            const tG = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 10);
            tG.addColorStop(0, 'rgba(255,245,238,0.7)');
            tG.addColorStop(0.3, 'rgba(212,165,116,0.3)');
            tG.addColorStop(1, 'rgba(212,165,116,0)');
            ctx.fillStyle = tG;
            ctx.beginPath(); ctx.arc(tip.x, tip.y, 10, 0, TAU); ctx.fill();
          }
        }
        ctx.restore();

        // Sparkle particles from heart when complete
        if (heartProg > 0.92 && t < TL.heartFade && Math.random() < 0.25) {
          const sT = Math.random() * TAU;
          const sp2 = heartPt(sT, hScale);
          sp({
            x: cx + sp2.x, y: cy + sp2.y + hYOff,
            vx: rn(-0.25,0.25), vy: rn(-0.7,-0.15),
            sz: rn(0.6,2.2), a: 0.85, ml: rn(25,55),
            r:255, g:245, b:238, tp:'sparkle',
          });
        }
      }

      /* ── 7. TEXT REVEAL ── */
      const textA = eOC(cl((t - TL.textIn) / (TL.textFull - TL.textIn), 0, 1)) * fadeAlpha;
      if (textA > 0.01) {
        ctx.save();
        ctx.globalAlpha = textA;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Small filled heart icon
        const icoY = cy + h * 0.04;
        const icoS = hScale * 0.22;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const ht = (i / 120) * TAU;
          const p = heartPt(ht, icoS);
          i === 0 ? ctx.moveTo(cx + p.x, icoY + p.y) : ctx.lineTo(cx + p.x, icoY + p.y);
        }
        ctx.closePath();
        const iG = ctx.createLinearGradient(cx - icoS*16, icoY - icoS*17, cx + icoS*16, icoY + icoS*10);
        iG.addColorStop(0, '#c9856b');
        iG.addColorStop(0.4, '#e8c4a0');
        iG.addColorStop(0.5, '#fff5ee');
        iG.addColorStop(0.6, '#e8c4a0');
        iG.addColorStop(1, '#c9856b');
        ctx.fillStyle = iG;
        ctx.shadowColor = 'rgba(201,133,107,0.45)';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // "Happy Valentine's Day"
        const mY = cy + h * 0.14;
        const mSz = Math.min(w * 0.06, 48);
        ctx.font = `200 ${mSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${mSz * 0.12}px`;
        const mG = ctx.createLinearGradient(cx - 200, mY, cx + 200, mY);
        mG.addColorStop(0, 'rgba(170,125,105,0.45)');
        mG.addColorStop(0.18, 'rgba(201,133,107,0.85)');
        mG.addColorStop(0.5, 'rgba(255,245,238,1)');
        mG.addColorStop(0.82, 'rgba(201,133,107,0.85)');
        mG.addColorStop(1, 'rgba(170,125,105,0.45)');
        ctx.fillStyle = mG;
        ctx.shadowColor = 'rgba(201,133,107,0.25)';
        ctx.shadowBlur = 16;
        ctx.fillText("Happy Valentine's Day", cx, mY);
        ctx.shadowBlur = 0;

        // Decorative thin line
        const lineW = Math.min(w * 0.15, 120) * textA;
        const lnY = mY + mSz * 0.9;
        const lnG = ctx.createLinearGradient(cx - lineW, 0, cx + lineW, 0);
        lnG.addColorStop(0, 'rgba(201,133,107,0)');
        lnG.addColorStop(0.3, 'rgba(201,133,107,0.35)');
        lnG.addColorStop(0.5, 'rgba(255,245,238,0.5)');
        lnG.addColorStop(0.7, 'rgba(201,133,107,0.35)');
        lnG.addColorStop(1, 'rgba(201,133,107,0)');
        ctx.strokeStyle = lnG;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(cx - lineW, lnY); ctx.lineTo(cx + lineW, lnY); ctx.stroke();

        // "2027"
        const yY = lnY + mSz * 0.65;
        const ySz = Math.min(w * 0.032, 26);
        ctx.font = `300 ${ySz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${ySz * 0.4}px`;
        ctx.fillStyle = 'rgba(240,230,224,0.5)';
        ctx.shadowColor = 'rgba(201,133,107,0.12)';
        ctx.shadowBlur = 8;
        ctx.fillText('2027', cx, yY);
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      /* ── 8. UPDATE & DRAW PARTICLES ── */
      let alive = 0;
      for (let i = 0; i < pc; i++) {
        const p = pts[i]; p.life++;
        if (p.life >= p.ml) continue;
        p.x += p.vx; p.y += p.vy;
        const lt = p.life / p.ml;
        let al = p.a;

        if (p.tp === 'ember') {
          al *= (1 - lt) * (0.5 + 0.5 * Math.sin(p.life * 0.14));
          p.vx += rn(-0.008, 0.008);
          p.vy -= 0.002;
        } else if (p.tp === 'sparkle') {
          al *= (1 - lt * lt);
        } else {
          al *= (1 - lt);
          p.vx += rn(-0.003, 0.003);
        }
        if (al < 0.003) continue;

        ctx.save();
        ctx.globalAlpha = al * fadeAlpha;

        if (p.tp === 'ember') {
          const eG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz * 3.5);
          eG.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.75)`);
          eG.addColorStop(0.25, `rgba(${p.r},${p.g},${p.b},0.25)`);
          eG.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.fillStyle = eG;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 3.5, 0, TAU); ctx.fill();
          ctx.fillStyle = `rgba(255,245,238,${al * 0.65})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 0.35, 0, TAU); ctx.fill();
        } else if (p.tp === 'sparkle') {
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.shadowColor = `rgb(${p.r},${p.g},${p.b})`;
          ctx.shadowBlur = p.sz * 7;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        }
        ctx.restore();
        pts[alive++] = p;
      }
      pc = alive;

      /* ── 9. WARM WASH ── */
      const washA = eOC(cl((t - TL.warmWash) / 0.8, 0, 1))
                  * (1 - eOC(cl((t - TL.fadeOut) / (TL.end - TL.fadeOut), 0, 1)));
      if (washA > 0.003) {
        const wG = ctx.createRadialGradient(cx, h * 0.4, 0, cx, h * 0.4, Math.max(w, h) * 0.6);
        wG.addColorStop(0, `rgba(201,133,107,${washA * 0.07})`);
        wG.addColorStop(0.45, `rgba(139,34,82,${washA * 0.035})`);
        wG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wG;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── 10. VIGNETTE ── */
      const vg = ctx.createRadialGradient(cx, h*0.42, Math.min(w,h)*0.18, cx, h*0.42, Math.max(w,h)*0.88);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.55, 'rgba(0,0,0,0.12)');
      vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      /* ── 11. LAST GLOW PULSE before fade ── */
      if (t > TL.warmWash && t < TL.fadeOut) {
        const lastP = Math.sin(((t - TL.warmWash) / (TL.fadeOut - TL.warmWash)) * Math.PI);
        const lG = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w,h)*0.3);
        lG.addColorStop(0, `rgba(201,133,107,${lastP * 0.06})`);
        lG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lG;
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
        display: 'block', background: '#030304',
        zIndex: 9999,
      }}
    />
  );
}
