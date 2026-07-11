'use client';
import { useEffect, useRef } from 'react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALENTINE 2027 — "Two Lights Become One"
Advanced Cinematic Engine v2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface Pt {
  x: number; y: number; vx: number; vy: number;
  sz: number; a: number; life: number; ml: number;
  r: number; g: number; b: number;
  tp: 'dust' | 'ember' | 'pulse' | 'burst';
}

export default function ValentineCinematicIntro({ onComplete }: { onComplete: () => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d', { alpha: false })!;
    let w = 0, h = 0, dpr = 1, raf = 0, t0 = 0, run = true;
    const done = { v: false };

    const rn = (a: number, b: number) => a + Math.random() * (b - a);
    const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
    const eOB = (t: number) => {
      const c = 2.70158;
      return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    };
    const TAU = Math.PI * 2;

    /* ── Crimson Red + Warm Gold Palette ── */
    const R = { dk: [127,29,29], md: [185,28,28], br: [220,38,38], lt: [252,165,165] };
    const G = { dk: [180,130,80], br: [251,191,36] };
    const W = [255, 245, 238];

    /* ── Particle Pool ── */
    const MX = 500;
    const pts: Pt[] = [];
    for (let i = 0; i < MX; i++) pts.push({ x:0,y:0,vx:0,vy:0,sz:1,a:0,life:0,ml:1,r:220,g:38,b:38,tp:'dust' });
    let pc = 0;
    function sp(o: Partial<Pt>) {
      if (pc >= MX) return;
      const p = pts[pc];
      p.x=o.x??0; p.y=o.y??0; p.vx=o.vx??0; p.vy=o.vy??0;
      p.sz=o.sz??1; p.a=o.a??1; p.life=0; p.ml=o.ml??100;
      p.r=o.r??220; p.g=o.g??38; p.b=o.b??38; p.tp=o.tp??'dust';
      pc++;
    }

    /* ── Heart Parametric ── */
    function hXY(t: number, s: number) {
      return {
        x: 16 * Math.pow(Math.sin(t), 3) * s,
        y: -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) * s,
      };
    }

    /* ── Orb Trails ── */
    const gTrail: {x:number;y:number;a:number}[] = [];
    const rTrail: {x:number;y:number;a:number}[] = [];
    const TMAX = 30;

    /* ── Bokeh ── */
    interface Bk { x:number;y:number;r:number;a:number;sp:number;of:number;cr:number;cg:number;cb:number; }
    const bks: Bk[] = [];

    /* ── Resize ── */
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv!.width = w * dpr; cv!.height = h * dpr;
      cv!.style.width = w + 'px'; cv!.style.height = h + 'px';
      bks.length = 0;
      for (let i = 0; i < 6; i++) {
        bks.push({
          x: w*0.12+Math.random()*w*0.76, y: h*0.12+Math.random()*h*0.5,
          r: rn(30,85), a: rn(0.006,0.022), sp: rn(0.18,0.55), of: rn(0,TAU),
          cr: rn(100,170), cg: rn(15,45), cb: rn(15,45),
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);

    /* ═══ TIMELINE — 9.5 seconds ═══ */
    const T = {
      darkEnd: 1.0,
      emergeS: 1.0, emergeE: 1.7,
      orbitS: 1.7, orbitE: 4.6,
      fusionS: 4.6, fusionE: 5.3,
      heartS: 5.3, heartE: 6.1,
      pulseS: 6.1,
      textS: 7.2, textE: 8.0,
      warmS: 8.2, fadeS: 8.5, end: 9.5,
    };

    /* ══════════════════ MAIN LOOP ══════════════════ */
    const animate = (ts: number) => {
      if (!run) return;
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = w / 2;
      const cy = h * 0.40;
      const baseHeartScale = Math.min(w, h) * 0.011; // नाम बदलकर टकराव से बचाया

      const fadeA = 1 - eOC(cl((t - T.fadeS) / (T.end - T.fadeS), 0, 1));
      if (fadeA <= 0.01) {
        if (!done.v) { done.v = true; onComplete(); }
        return;
      }

      /* ── 1. BACKGROUND — Pure black, warm tint ── */
      const bg = ctx.createRadialGradient(cx, h*0.38, 0, cx, h*0.38, Math.max(w,h)*0.75);
      bg.addColorStop(0, '#06040a');
      bg.addColorStop(0.4, '#030206');
      bg.addColorStop(1, '#020204');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* ── 2. AMBIENT HEARTBEAT GLOW (from 0.5s, very subtle) ── */
      if (t > 0.5) {
        const hbC = ((t - 0.5) % 1.6) / 1.6;
        let hb = 0;
        if (hbC < 0.11) hb = Math.sin(hbC/0.11*Math.PI) * 0.04;
        else if (hbC > 0.17 && hbC < 0.26) hb = Math.sin((hbC-0.17)/0.09*Math.PI) * 0.02;
        const baseGlow = eOC(cl((t - 0.5) / 1.5, 0, 1)) * 0.05;
        const gr = Math.min(w,h) * (0.18 + hb);
        const gG = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
        gG.addColorStop(0, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},${baseGlow + hb*0.15})`);
        gG.addColorStop(0.3, `rgba(${R.dk[0]},${R.dk[1]},${R.dk[2]},${(baseGlow+hb*0.08)*0.5})`);
        gG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gG;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── 3. BOKEH ── */
      const orbVis = eOC(cl((t - T.orbitS) / 0.8, 0, 1));
      if (orbVis > 0.01) {
        for (const b of bks) {
          const ba = b.a * orbVis * (0.4 + 0.6*Math.sin(t*b.sp + b.of));
          if (ba < 0.001) continue;
          const bG = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
          bG.addColorStop(0, `rgba(${b.cr},${b.cg},${b.cb},${ba})`);
          bG.addColorStop(0.4, `rgba(${b.cr},${b.cg},${b.cb},${ba*0.18})`);
          bG.addColorStop(1, `rgba(${b.cr},${b.cg},${b.cb},0)`);
          ctx.fillStyle = bG;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
        }
      }

      /* ── 4. SPAWN DUST ── */
      if (t > 0.2 && Math.random() < 0.1) {
        sp({ x:rn(0,w), y:rn(0,h*0.7), vx:rn(-0.03,0.03), vy:rn(-0.06,-0.005),
          sz:rn(0.2,0.7), a:rn(0.02,0.08), ml:rn(180,350), r:160,g:120,b:100, tp:'dust' });
      }

      /* ── 5. TWO ORBS + INFINITY ORBIT ── */
      const emA = eOC(cl((t - T.emergeS) / (T.emergeE - T.emergeS), 0, 1));
      const oP = cl((t - T.orbitS) / (T.orbitE - T.orbitS), 0, 1);
      const fP = cl((t - T.fusionS) / (T.fusionE - T.fusionS), 0, 1);

      let gX = cx - w*0.22*(1-fP), gY = cy;
      let rX = cx + w*0.22*(1-fP), rY = cy;

      if (oP > 0 && oP < 1) {
        const lSc = Math.min(w,h) * 0.24;
        const ang = oP * Math.PI * 4;
        const d = 1 + Math.sin(ang)*Math.sin(ang);
        gX = cx + (lSc*Math.cos(ang))/d;
        gY = cy + (lSc*Math.sin(ang)*Math.cos(ang))/d;
        const pA = ang + Math.PI;
        const pD = 1 + Math.sin(pA)*Math.sin(pA);
        rX = cx + (lSc*Math.cos(pA))/pD;
        rY = cy + (lSc*Math.sin(pA)*Math.cos(pA))/pD;

        if (Math.random() < 0.45) {
          sp({ x:gX, y:gY, vx:rn(-0.12,0.12), vy:rn(-0.25,-0.04), sz:rn(0.7,1.8), a:0.65, ml:rn(28,55), r:G.br[0],g:G.br[1],b:G.br[2], tp:'ember' });
          sp({ x:rX, y:rY, vx:rn(-0.12,0.12), vy:rn(-0.25,-0.04), sz:rn(0.7,1.8), a:0.65, ml:rn(28,55), r:R.br[0],g:R.br[1],b:R.br[2], tp:'ember' });
        }
        gTrail.push({x:gX,y:gY,a:1});
        rTrail.push({x:rX,y:rY,a:1});
        if (gTrail.length > TMAX) gTrail.shift();
        if (rTrail.length > TMAX) rTrail.shift();
      }

      for (let i = 0; i < gTrail.length; i++) {
        gTrail[i].a *= 0.9;
        const ta = gTrail[i].a * (1-fP);
        if (ta < 0.008) continue;
        ctx.fillStyle = `rgba(${G.br[0]},${G.br[1]},${G.br[2]},${ta*0.28})`;
        ctx.beginPath(); ctx.arc(gTrail[i].x, gTrail[i].y, 2.5*ta+0.5, 0, TAU); ctx.fill();
      }
      for (let i = 0; i < rTrail.length; i++) {
        rTrail[i].a *= 0.9;
        const ta = rTrail[i].a * (1-fP);
        if (ta < 0.008) continue;
        ctx.fillStyle = `rgba(${R.br[0]},${R.br[1]},${R.br[2]},${ta*0.28})`;
        ctx.beginPath(); ctx.arc(rTrail[i].x, rTrail[i].y, 2.5*ta+0.5, 0, TAU); ctx.fill();
      }

      if (oP > 0.05 && oP < 0.95 && fP < 0.5) {
        const mAlpha = 0.06 * (1-fP*2) * Math.sin(oP*Math.PI);
        if (mAlpha > 0.003) {
          const mG = ctx.createLinearGradient(gX, gY, rX, rY);
          mG.addColorStop(0, `rgba(${G.br[0]},${G.br[1]},${G.br[2]},${mAlpha})`);
          mG.addColorStop(0.5, `rgba(255,255,255,${mAlpha*0.8})`);
          mG.addColorStop(1, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},${mAlpha})`);
          ctx.strokeStyle = mG;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          const midX = (gX+rX)/2, midY = (gY+rY)/2 - 20*Math.sin(t*2);
          ctx.moveTo(gX, gY);
          ctx.quadraticCurveTo(midX, midY, rX, rY);
          ctx.stroke();
        }
      }

      const orbA = emA * (1 - fP);
      if (orbA > 0.01) {
        ctx.save();
        ctx.globalAlpha = orbA * fadeA;
        ctx.globalCompositeOperation = 'lighter';

        const gR = 13 + Math.sin(t*3.2)*2;
        const gGl = ctx.createRadialGradient(gX, gY, 0, gX, gY, gR*2.8);
        gGl.addColorStop(0, 'rgba(255,255,255,0.92)');
        gGl.addColorStop(0.12, `rgba(${G.br[0]},${G.br[1]},${G.br[2]},0.75)`);
        gGl.addColorStop(0.45, `rgba(${G.dk[0]},${G.dk[1]},${G.dk[2]},0.22)`);
        gGl.addColorStop(1, `rgba(${G.dk[0]},${G.dk[1]},${G.dk[2]},0)`);
        ctx.fillStyle = gGl;
        ctx.beginPath(); ctx.arc(gX, gY, gR*2.8, 0, TAU); ctx.fill();

        const rRad = 13 + Math.sin(t*3.2+1)*2;
        const rGl = ctx.createRadialGradient(rX, rY, 0, rX, rY, rRad*2.8);
        rGl.addColorStop(0, 'rgba(255,255,255,0.92)');
        rGl.addColorStop(0.12, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},0.75)`);
        rGl.addColorStop(0.45, `rgba(${R.dk[0]},${R.dk[1]},${R.dk[2]},0.22)`);
        rGl.addColorStop(1, `rgba(${R.dk[0]},${R.dk[1]},${R.dk[2]},0)`);
        ctx.fillStyle = rGl;
        ctx.beginPath(); ctx.arc(rX, rY, rRad*2.8, 0, TAU); ctx.fill();

        ctx.restore();
      }

      /* ── 6. FUSION BURST ── */
      if (fP > 0 && fP < 1) {
        const bA = Math.sin(fP * Math.PI);
        const fG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90*bA);
        fG.addColorStop(0, `rgba(255,255,255,${bA*0.4})`);
        fG.addColorStop(0.15, `rgba(${G.br[0]},${G.br[1]},${G.br[2]},${bA*0.25})`);
        fG.addColorStop(0.35, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},${bA*0.18})`);
        fG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fG;
        ctx.fillRect(cx-120, cy-120, 240, 240);

        if (fP < 0.35 && Math.random() < 0.55) {
          const ba = rn(0, TAU);
          const spd = rn(1.5, 4.5);
          sp({ x:cx, y:cy, vx:Math.cos(ba)*spd, vy:Math.sin(ba)*spd, sz:rn(1,2.8), a:0.85, ml:rn(22,45), r:G.br[0],g:G.br[1],b:G.br[2], tp:'burst' });
          sp({ x:cx, y:cy, vx:Math.cos(ba+0.4)*spd*0.8, vy:Math.sin(ba+0.4)*spd*0.8, sz:rn(0.8,2.2), a:0.85, ml:rn(22,45), r:R.br[0],g:R.br[1],b:R.br[2], tp:'burst' });
        }
      }

      /* ── 7. HEART FORM + PULSE ── */
      const hFormA = eOB(cl((t - T.heartS) / (T.heartE - T.heartS), 0, 1));
      const isPulse = t > T.pulseS;

      let currentHeartScale = hFormA * baseHeartScale; // डुप्लिकेट एरर दूर करने के लिए नाम बदला
      let hAl = hFormA * fadeA;

      if (isPulse) {
        const hbC = ((t - T.pulseS) % 1.4) / 1.4;
        if (hbC < 0.11) {
          currentHeartScale *= (1 + Math.sin(hbC/0.11*Math.PI) * 0.09);
          if (hbC > 0.09 && Math.random() < 0.2) {
            sp({ x:cx, y:cy, vx:0, vy:0, sz:currentHeartScale*8, a:0.3, ml:65, r:R.br[0],g:R.br[1],b:R.br[2], tp:'pulse' });
          }
        } else if (hbC > 0.17 && hbC < 0.26) {
          currentHeartScale *= (1 + Math.sin((hbC-0.17)/0.09*Math.PI) * 0.045);
        }

        if (Math.random() < 0.18) {
          const sT = rn(0, TAU);
          const sp2 = hXY(sT, currentHeartScale);
          sp({ x:cx+sp2.x, y:cy+sp2.y, vx:rn(-0.3,0.3), vy:rn(-0.7,-0.1), sz:rn(0.5,1.6), a:0.8, ml:rn(22,48), r:W[0],g:W[1],b:W[2], tp:'ember' });
        }
      }

      if (t > T.textS) {
        hAl *= (1 - eOC(cl((t - T.textS) / 0.65, 0, 1)));
      }

      if (hAl > 0.01 && currentHeartScale > 0.01) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = hAl;

        ctx.beginPath();
        for (let i = 0; i <= 160; i++) {
          const ht = (i/160)*TAU;
          const p = hXY(ht, currentHeartScale);
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();

        ctx.shadowColor = `rgba(${R.br[0]},${R.br[1]},${R.br[2]},0.55)`;
        ctx.shadowBlur = 40;

        const hG = ctx.createLinearGradient(-16*currentHeartScale, -17*currentHeartScale, 16*currentHeartScale, 13*currentHeartScale);
        hG.addColorStop(0, `rgb(${R.dk[0]},${R.dk[1]},${R.dk[2]})`);
        hG.addColorStop(0.15, `rgb(${R.md[0]},${R.md[1]},${R.md[2]})`);
        hG.addColorStop(0.32, `rgb(${R.br[0]},${R.br[1]},${R.br[2]})`);
        hG.addColorStop(0.45, `rgb(${R.lt[0]},${R.lt[1]},${R.lt[2]})`);
        hG.addColorStop(0.52, '#ffffff');
        hG.addColorStop(0.58, `rgb(${R.lt[0]},${R.lt[1]},${R.lt[2]})`);
        hG.addColorStop(0.7, `rgb(${R.br[0]},${R.br[1]},${R.br[2]})`);
        hG.addColorStop(0.85, `rgb(${R.md[0]},${R.md[1]},${R.md[2]})`);
        hG.addColorStop(1, `rgb(${R.dk[0]},${R.dk[1]},${R.dk[2]})`);
        ctx.fillStyle = hG;
        ctx.fill();

        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.strokeStyle = `rgba(${G.dk[0]},${G.dk[1]},${G.dk[2]},0.15)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.globalAlpha = hAl * 0.06;
        ctx.fillStyle = '#ff2222';
        ctx.fill();
        ctx.translate(2, 0);
        ctx.fillStyle = '#2222ff';
        ctx.fill();

        ctx.restore();
      }

      /* ── 8. TEXT ── */
      const txtA = eOC(cl((t - T.textS) / (T.textE - T.textS), 0, 1)) * fadeA;
      if (txtA > 0.01) {
        ctx.save();
        ctx.globalAlpha = txtA;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const mY = cy + h*0.12;
        const mSz = Math.min(w*0.055, 44);
        ctx.font = `200 ${mSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${mSz*0.06}px`;
        const mG = ctx.createLinearGradient(cx-190, mY, cx+190, mY);
        mG.addColorStop(0, `rgba(${R.md[0]},${R.md[1]},${R.md[2]},0.35)`);
        mG.addColorStop(0.18, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},0.85)`);
        mG.addColorStop(0.5, `rgb(${W[0]},${W[1]},${W[2]})`);
        mG.addColorStop(0.82, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},0.85)`);
        mG.addColorStop(1, `rgba(${R.md[0]},${R.md[1]},${R.md[2]},0.35)`);
        ctx.fillStyle = mG;
        ctx.shadowColor = `rgba(${R.br[0]},${R.br[1]},${R.br[2]},0.28)`;
        ctx.shadowBlur = 18;
        ctx.fillText('Love is Connection', cx, mY);
        ctx.shadowBlur = 0;

        const lnW = Math.min(w*0.13, 105) * txtA;
        const lnY = mY + mSz*0.85;
        const lnG = ctx.createLinearGradient(cx-lnW, 0, cx+lnW, 0);
        lnG.addColorStop(0, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},0)`);
        lnG.addColorStop(0.3, `rgba(${G.dk[0]},${G.dk[1]},${G.dk[2]},0.35)`);
        lnG.addColorStop(0.5, `rgba(${W[0]},${W[1]},${W[2]},0.45)`);
        lnG.addColorStop(0.7, `rgba(${G.dk[0]},${G.dk[1]},${G.dk[2]},0.35)`);
        lnG.addColorStop(1, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},0)`);
        ctx.strokeStyle = lnG; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(cx-lnW, lnY); ctx.lineTo(cx+lnW, lnY); ctx.stroke();

        const sY = lnY + mSz*0.55;
        const sSz = Math.min(w*0.026, 21);
        ctx.font = `300 ${sSz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${sSz*0.32}px`;
        ctx.fillStyle = `rgba(${R.lt[0]},${R.lt[1]},${R.lt[2]},0.45)`;
        ctx.fillText("Happy Valentine's Day", cx, sY);

        const yY = sY + sSz*0.8;
        const ySz = Math.min(w*0.02, 16);
        ctx.font = `300 ${ySz}px "Inter","Segoe UI",system-ui,sans-serif`;
        ctx.letterSpacing = `${ySz*0.5}px`;
        ctx.fillStyle = `rgba(${W[0]},${W[1]},${W[2]},0.3)`;
        ctx.fillText('2027', cx, yY);

        ctx.restore();
      }

      /* ── 9. PARTICLES UPDATE & DRAW ── */
      let alive = 0;
      for (let i = 0; i < pc; i++) {
        const p = pts[i]; p.life++;
        if (p.life >= p.ml) continue;
        p.x += p.vx; p.y += p.vy;
        const lt = p.life / p.ml;
        let al = p.a;

        if (p.tp === 'dust') {
          al *= (1-lt);
        } else if (p.tp === 'ember') {
          al *= (1-lt*lt) * (0.45+0.55*Math.sin(p.life*0.11));
          p.vx += rn(-0.005,0.005);
          p.vy -= 0.0008;
        } else if (p.tp === 'burst') {
          al *= (1-lt*lt);
          p.vx *= 0.96; p.vy *= 0.96;
          p.vy += 0.008;
        } else if (p.tp === 'pulse') {
          p.sz += 2.2;
          al *= (1-lt);
        }
        if (al < 0.003) continue;

        ctx.save();
        ctx.globalAlpha = al * fadeA;

        if (p.tp === 'pulse') {
          ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${al*0.2})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          const rsc = p.sz * 0.038;
          for (let j = 0; j <= 90; j++) {
            const ht = (j/90)*TAU;
            const rpx = p.x + 16*Math.pow(Math.sin(ht),3)*rsc;
            const rpy = p.y - (13*Math.cos(ht)-5*Math.cos(2*ht)-2*Math.cos(3*ht)-Math.cos(4*ht))*rsc;
            j === 0 ? ctx.moveTo(rpx, rpy) : ctx.lineTo(rpx, rpy);
          }
          ctx.closePath();
          ctx.stroke();
        } else if (p.tp === 'ember' || p.tp === 'burst') {
          const eG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz*3.2);
          eG.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.72)`);
          eG.addColorStop(0.25, `rgba(${p.r},${p.g},${p.b},0.18)`);
          eG.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.fillStyle = eG;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz*3.2, 0, TAU); ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${al*0.45})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.3, p.sz*0.25), 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${al})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        }
        ctx.restore();
        pts[alive++] = p;
      }
      pc = alive;

      /* ── 10. WARM WASH ── */
      const washA = eOC(cl((t - T.warmS) / 0.6, 0, 1))
                  * (1 - eOC(cl((t - T.fadeS) / (T.end - T.fadeS), 0, 1)));
      if (washA > 0.003) {
        const wG = ctx.createRadialGradient(cx, h*0.4, 0, cx, h*0.4, Math.max(w,h)*0.55);
        wG.addColorStop(0, `rgba(${R.br[0]},${R.br[1]},${R.br[2]},${washA*0.055})`);
        wG.addColorStop(0.35, `rgba(${G.dk[0]},${G.dk[1]},${G.dk[2]},${washA*0.025})`);
        wG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wG;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── 11. VIGNETTE ── */
      const vg = ctx.createRadialGradient(cx, h*0.42, Math.min(w,h)*0.14, cx, h*0.42, Math.max(w,h)*0.92);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.45, 'rgba(0,0,0,0.08)');
      vg.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      /* ── 12. SUBTLE FILM GRAIN ── */
      ctx.save();
      ctx.globalAlpha = 0.018 * fadeA;
      for (let i = 0; i < 800; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        const gv = Math.random() * 255;
        ctx.fillStyle = `rgb(${gv},${gv},${gv})`;
        ctx.fillRect(gx, gy, 1, 1);
      }
      ctx.restore();

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
        position:'fixed', top:0, left:0,
        width:'100vw', height:'100vh',
        display:'block', background:'#020204',
        zIndex:9999,
      }}
    />
  );
}
