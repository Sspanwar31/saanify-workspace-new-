'use client';

import React, { useRef, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface Props { onComplete: () => void; }

interface P {
  x: number; y: number; vx: number; vy: number;
  sz: number; a: number; life: number; ml: number;
  r: number; g: number; b: number;
  tp: number; rot: number; rs: number; gv: number; dr: number;
}

interface Shard {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; rot: number; rs: number; a: number;
}

interface FW {
  x: number; y: number; vy: number; ty: number;
  ph: number; cr: number; cg: number; cb: number; et: number;
}

interface Crack { pts: { x: number; y: number }[]; }

interface Drone {
  x: number; y: number; tx: number; ty: number;
  ox: number; oy: number; active: boolean;
}

/* ═══════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════ */

const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIQ = (t: number) => t * t;
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lr = (a: number, b: number, t: number) => a + (b - a) * t;
const rn = (a: number, b: number) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function NewYearCinematicIntro({ onComplete }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(false);
  const ocRef = useRef(onComplete);

  useEffect(() => { ocRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d', { alpha: false })!;

    let w = 0, h = 0, dpr = 1, raf = 0, t0 = 0, run = true;

    /* ── PARTICLE POOL ── */
    const MX = 6000;
    const ps: P[] = [];
    for (let i = 0; i < MX; i++) ps.push({ x:0,y:0,vx:0,vy:0,sz:1,a:0,life:0,ml:1,r:255,g:255,b:255,tp:0,rot:0,rs:0,gv:0,dr:1 });
    let pc = 0;

    function sp(o: Partial<P>) {
      if (pc >= MX) return;
      const p = ps[pc];
      p.x=o.x??0; p.y=o.y??0; p.vx=o.vx??0; p.vy=o.vy??0;
      p.sz=o.sz??1; p.a=o.a??1; p.life=0; p.ml=o.ml??100;
      p.r=o.r??255; p.g=o.g??255; p.b=o.b??255;
      p.tp=o.tp??0; p.rot=o.rot??0; p.rs=o.rs??0;
      p.gv=o.gv??0; p.dr=o.dr??1;
      pc++;
    }

    /* ── STARS ── */
    const stars: { x:number;y:number;s:number;tw:number;to:number;a:number }[] = [];

    /* ── SHARDS & CRACKS ── */
    let shards: Shard[] = [];
    let cracks: Crack[] = [];

    /* ── FIREWORKS ── */
    let fws: FW[] = [];
    let lastFW = 0;
    const fwC = [[255,215,0],[255,255,255],[100,149,237],[148,103,189],[220,38,38],[247,233,163],[255,105,180],[0,210,211]];

    /* ── DRONES ── */
    const DRONE_MAX = 350;
    const drones: Drone[] = [];
    for (let i = 0; i < DRONE_MAX; i++) drones.push({ x:0,y:0,tx:0,ty:0,ox:0,oy:0,active:false });
    let droneTextIdx = -1;
    const droneTexts = ['2027', 'NEW YEAR', 'NEW BEGINNING'];
    const offCv = document.createElement('canvas');
    const offCtx = offCv.getContext('2d')!;

    function sampleText(text: string, max: number) {
      const fs = text.length <= 4 ? Math.min(w * 0.14, 100) : Math.min(w * 0.065, 52);
      offCv.width = w; offCv.height = h;
      offCtx.clearRect(0, 0, w, h);
      offCtx.fillStyle = '#fff';
      offCtx.font = `900 ${fs}px "Inter","Segoe UI",system-ui,sans-serif`;
      offCtx.textAlign = 'center'; offCtx.textBaseline = 'middle';
      offCtx.fillText(text, w / 2, h / 2);
      const d = offCtx.getImageData(0, 0, w, h).data;
      const pts: { x:number;y:number }[] = [];
      const step = Math.max(3, Math.floor(Math.sqrt((w * h) / max)));
      for (let yy = 0; yy < h; yy += step)
        for (let xx = 0; xx < w; xx += step)
          if (d[(yy * w + xx) * 4] > 128) pts.push({ x: xx, y: yy });
      for (let i = pts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
      return pts.slice(0, max);
    }

    function setDroneTargets(text: string) {
      const pts = sampleText(text, DRONE_MAX);
      for (let i = 0; i < DRONE_MAX; i++) {
        const dr = drones[i];
        if (i < pts.length) {
          if (!dr.active) {
            dr.x = rn(0, w); dr.y = rn(h * 0.2, h * 0.8);
            dr.active = true;
          }
          dr.ox = dr.x; dr.oy = dr.y;
          dr.tx = pts[i].x; dr.ty = pts[i].y;
        } else {
          dr.active = false;
        }
      }
    }

    /* ── HELPERS ── */
    function launchFW() {
      const c = fwC[Math.floor(Math.random() * fwC.length)];
      fws.push({ x: rn(w*0.1, w*0.9), y: h+10, vy: -(rn(9,16)), ty: rn(h*0.08, h*0.38), ph:0, cr:c[0], cg:c[1], cb:c[2], et:0 });
    }

    function explodeFW(fw: FW) {
      const n = Math.floor(rn(90, 180));
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + rn(-0.15, 0.15);
        const spd = rn(1.5, 7);
        sp({ x:fw.x, y:fw.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, sz:rn(1,3.2), a:1, ml:rn(45,90), r:fw.cr, g:fw.cg, b:fw.cb, tp:3, gv:0.035, dr:0.975 });
      }
      for (let i = 0; i < 25; i++) {
        const ang = rn(0, TAU); const spd = rn(0.3, 2.5);
        sp({ x:fw.x, y:fw.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, sz:rn(1.5,3.5), a:1, ml:rn(15,35), r:255, g:250, b:230, tp:3, gv:0.02, dr:0.96 });
      }
    }

    function createShards() {
      shards = [];
      const tw = Math.min(w * 0.5, 380), th = tw * 0.32;
      const cx = w / 2, cy = h / 2;
      const cols = 10, rows = 3;
      const sw = tw / cols, sh = th / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const sx = cx - tw/2 + c * sw, sy = cy - th/2 + r * sh;
          const ang = Math.atan2(sy - cy, sx - cx) + rn(-0.6, 0.6);
          const spd = rn(4, 14);
          shards.push({ x:sx, y:sy, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd - rn(2,6), w:sw-1.5, h:sh-1.5, rot:0, rs:rn(-0.18,0.18), a:1 });
        }
      }
    }

    function createCracks() {
      cracks = [];
      const cx = w / 2, cy = h / 2;
      const tw = Math.min(w * 0.5, 380);
      for (let i = 0; i < 9; i++) {
        const pts: { x:number;y:number }[] = [];
        let px = cx - tw/2 + (tw * (i + 0.5)) / 9;
        let py = cy - 30;
        pts.push({ x: px, y: py });
        for (let j = 0; j < 5; j++) {
          px += rn(-35, 35); py += rn(12, 28);
          pts.push({ x: px, y: py });
        }
        cracks.push({ pts });
      }
    }

    /* ── RESIZE ── */
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv!.width = w * dpr; cv!.height = h * dpr;
      cv!.style.width = w + 'px'; cv!.style.height = h + 'px';
      stars.length = 0;
      for (let i = 0; i < 350; i++)
        stars.push({ x:Math.random()*w, y:Math.random()*h*0.75, s:rn(0.3,2.2), tw:rn(0.8,4), to:rn(0,TAU), a:rn(0.2,1) });
    }
    resize();
    window.addEventListener('resize', resize);

    /* ═══ TIMELINE ═══ */
    const T = {
      sky: 0, stars: 0.8, dust: 1.3, clock: 1.8,
      cdStart: 2.3, cdFinal: 3.5, freeze: 4.85,
      y2026: 5.35, crack: 5.85, shatter: 6.35,
      portal: 6.85, energy: 7.3, y2027: 7.8,
      fw: 8.3, drone1: 9.3, drone2: 10.1, drone3: 10.8,
      confetti: 11.4, warm: 11.8, text: 12.1,
      glow: 12.8, fade: 13.4, end: 14.0,
    };

    /* ═══ ANIMATE ═══ */
    const animate = (ts: number) => {
      if (!run) return;
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* ── SKY ── */
      const sa = eOC(cl((t - T.sky) / 1, 0, 1));
      let st0 = [lr(2,5,sa), lr(2,8,sa), lr(8,28,sa)];
      let sb0 = [lr(2,10,sa), lr(2,15,sa), lr(5,50,sa)];
      const wm = eOC(cl((t - T.warm) / 1.2, 0, 1));
      if (wm > 0) {
        st0 = [lr(st0[0],55,wm*0.45), lr(st0[1],35,wm*0.45), lr(st0[2],18,wm*0.25)];
        sb0 = [lr(sb0[0],75,wm*0.5), lr(sb0[1],50,wm*0.5), lr(sb0[2],22,wm*0.3)];
      }
      const sg = ctx.createLinearGradient(0,0,0,h);
      sg.addColorStop(0, `rgb(${st0[0]|0},${st0[1]|0},${st0[2]|0})`);
      sg.addColorStop(1, `rgb(${sb0[0]|0},${sb0[1]|0},${sb0[2]|0})`);
      ctx.fillStyle = sg; ctx.fillRect(0,0,w,h);

      /* ── STARS ── */
      const sA = eOC(cl((t-T.stars)/1,0,1)) * (1 - eOC(cl((t-T.warm)/1.5,0,1)));
      if (sA > 0.01) {
        for (const s of stars) {
          const tw = 0.5 + 0.5 * Math.sin(t * s.tw + s.to);
          const a = s.a * tw * sA;
          if (a < 0.01) continue;
          ctx.fillStyle = `rgba(210,225,255,${a})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
          if (s.s > 1.4) {
            const gg = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.s*3.5);
            gg.addColorStop(0,`rgba(180,200,255,${a*0.2})`);
            gg.addColorStop(1,'rgba(180,200,255,0)');
            ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(s.x,s.y,s.s*3.5,0,TAU); ctx.fill();
          }
        }
      }

      /* ── COLD DUST ── */
      if (t > T.dust && t < T.warm + 1.5 && Math.random() < 0.35)
        sp({ x:rn(0,w), y:rn(0,h*0.8), vx:rn(-0.15,0.15), vy:rn(0.05,0.4), sz:rn(0.4,1.8), a:rn(0.08,0.22), ml:rn(120,220), r:170,g:195,b:230, tp:1, gv:0, dr:0.999 });

      /* ── CLOCK ── */
      if (t > T.clock && t < T.y2026) {
        const cA = eOC(cl((t-T.clock)/0.4,0,1)) * (t > T.y2026-0.3 ? 1-eOC(cl((t-T.y2026+0.3)/0.3,0,1)) : 1);
        if (cA > 0.01) {
          const cx = w/2, cy = h/2, cr = Math.min(w,h)*0.14;
          ctx.save(); ctx.globalAlpha = cA; ctx.translate(cx,cy);
          // Face
          const fg = ctx.createRadialGradient(0,0,0,0,0,cr);
          fg.addColorStop(0,'rgba(15,18,35,0.92)'); fg.addColorStop(1,'rgba(8,10,22,0.95)');
          ctx.beginPath(); ctx.arc(0,0,cr,0,TAU); ctx.fillStyle=fg; ctx.fill();
          ctx.strokeStyle='rgba(212,175,55,0.55)'; ctx.lineWidth=2.5; ctx.stroke();
          // Outer ring glow
          ctx.beginPath(); ctx.arc(0,0,cr+3,0,TAU);
          ctx.strokeStyle=`rgba(212,175,55,${0.15+0.05*Math.sin(t*3)})`; ctx.lineWidth=1; ctx.stroke();
          // Markers
          for (let i=0;i<12;i++){
            const a=(i/12)*TAU-Math.PI/2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a)*cr*0.8, Math.sin(a)*cr*0.8);
            ctx.lineTo(Math.cos(a)*cr*0.93, Math.sin(a)*cr*0.93);
            ctx.strokeStyle='rgba(212,175,55,0.7)'; ctx.lineWidth=i%3===0?2.5:1; ctx.stroke();
          }
          for (let i=0;i<60;i++){
            if(i%5===0)continue;
            const a=(i/60)*TAU-Math.PI/2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a)*cr*0.88,Math.sin(a)*cr*0.88);
            ctx.lineTo(Math.cos(a)*cr*0.93,Math.sin(a)*cr*0.93);
            ctx.strokeStyle='rgba(212,175,55,0.2)'; ctx.lineWidth=0.5; ctx.stroke();
          }
          // Hands
          let secA2, minA, hrA;
          if (t < T.cdFinal) {
            const pr = cl((t-T.cdStart)/(T.cdFinal-T.cdStart),0,1);
            const sec = 55+pr*4;
            secA2 = ((sec/60)*TAU)-Math.PI/2;
            minA = ((59/60)*TAU)-Math.PI/2;
            hrA = ((11/12)*TAU)-Math.PI/2;
          } else if (t < T.freeze) {
            const pr = cl((t-T.cdFinal)/(T.freeze-T.cdFinal),0,1);
            secA2 = (pr*TAU)-Math.PI/2;
            minA = ((59/60)*TAU)-Math.PI/2;
            hrA = ((11/12+pr/12)*TAU)-Math.PI/2;
          } else { secA2=-Math.PI/2; minA=-Math.PI/2; hrA=0; }
          ctx.lineCap='round';
          // Hour
          ctx.beginPath(); ctx.moveTo(0,0);
          ctx.lineTo(Math.cos(hrA)*cr*0.48,Math.sin(hrA)*cr*0.48);
          ctx.strokeStyle='rgba(212,175,55,0.9)'; ctx.lineWidth=3.5; ctx.stroke();
          // Minute
          ctx.beginPath(); ctx.moveTo(0,0);
          ctx.lineTo(Math.cos(minA)*cr*0.68,Math.sin(minA)*cr*0.68);
          ctx.strokeStyle='rgba(212,175,55,0.85)'; ctx.lineWidth=2.5; ctx.stroke();
          // Second
          ctx.beginPath();
          ctx.moveTo(Math.cos(secA2+Math.PI)*cr*0.12,Math.sin(secA2+Math.PI)*cr*0.12);
          ctx.lineTo(Math.cos(secA2)*cr*0.82,Math.sin(secA2)*cr*0.82);
          ctx.strokeStyle='rgba(220,50,50,0.9)'; ctx.lineWidth=1.2; ctx.stroke();
          // Center
          ctx.beginPath(); ctx.arc(0,0,3.5,0,TAU); ctx.fillStyle='rgba(212,175,55,1)'; ctx.fill();
          ctx.restore();
        }
      }

      /* ── COUNTDOWN TEXT ── */
      if (t >= T.cdStart && t < T.freeze) {
        ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
        if (t < T.cdFinal) {
          const pr = cl((t-T.cdStart)/(T.cdFinal-T.cdStart),0,1);
          const sec = 55+Math.floor(pr*4.99);
          const txt = `11:59:${sec.toString().padStart(2,'0')}`;
          const a = eOC(cl((t-T.cdStart)/0.3,0,1));
          const fs = Math.min(w*0.055,44);
          ctx.globalAlpha=a;
          ctx.font=`300 ${fs}px "Courier New",monospace`;
          ctx.fillStyle='rgba(190,205,230,0.9)';
          ctx.shadowColor='rgba(100,150,255,0.5)'; ctx.shadowBlur=18;
          ctx.fillText(txt, w/2, h/2+Math.min(w,h)*0.24);
        } else {
          const el = t-T.cdFinal;
          const num = 10-Math.floor(el/0.135);
          if (num >= 1 && num <= 10) {
            const frac = (el%0.135)/0.135;
            const pulse = 1+Math.sin(el*18)*0.06;
            const fs = Math.min(w*0.18,140)*pulse;
            ctx.globalAlpha = 1-frac*0.35;
            ctx.font=`900 ${fs}px "Inter","Segoe UI",system-ui,sans-serif`;
            const ng = ctx.createLinearGradient(w/2-fs*0.4,h/2-fs*0.4,w/2+fs*0.4,h/2+fs*0.4);
            ng.addColorStop(0,'#fef3c7'); ng.addColorStop(0.5,'#fbbf24'); ng.addColorStop(1,'#d97706');
            ctx.fillStyle=ng;
            ctx.shadowColor='rgba(251,191,36,0.8)'; ctx.shadowBlur=35;
            ctx.fillText(num.toString(), w/2, h/2);
            // Subtle ring on each beat
            ctx.beginPath(); ctx.arc(w/2,h/2,fs*0.7*(1-frac*0.3),0,TAU);
            ctx.strokeStyle=`rgba(251,191,36,${0.2*(1-frac)})`; ctx.lineWidth=1.5; ctx.stroke();
          }
        }
        ctx.restore();
      }

      /* ── 2026 TEXT + CRACKS ── */
      if (t >= T.y2026 && t < T.shatter + 0.5) {
        const a26 = eOC(cl((t-T.y2026)/0.25,0,1));
        const crkT = cl((t-T.crack)/(T.shatter-T.crack),0,1);
        const fadeT = crkT > 0.75 ? 1-(crkT-0.75)/0.25 : 1;
        const total = a26 * fadeT;
        if (total > 0.01) {
          ctx.save(); ctx.globalAlpha=total;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          const sz = Math.min(w*0.19,155);
          ctx.font=`900 ${sz}px "Inter","Segoe UI",system-ui,sans-serif`;
          // Steel gradient
          const stg = ctx.createLinearGradient(w/2,h/2-sz/2,w/2,h/2+sz/2);
          stg.addColorStop(0,'#64748b'); stg.addColorStop(0.2,'#cbd5e1'); stg.addColorStop(0.4,'#f1f5f9');
          stg.addColorStop(0.6,'#e2e8f0'); stg.addColorStop(0.8,'#94a3b8'); stg.addColorStop(1,'#475569');
          ctx.fillStyle=stg;
          ctx.shadowColor='rgba(148,163,184,0.4)'; ctx.shadowBlur=20;
          ctx.fillText('2026',w/2,h/2);
          ctx.shadowBlur=0;
          // Cracks
          if (crkT > 0 && cracks.length === 0) createCracks();
          if (crkT > 0) {
            ctx.shadowColor='rgba(251,191,36,0.9)'; ctx.shadowBlur=12*crkT;
            ctx.strokeStyle=`rgba(251,191,36,${crkT*0.9})`; ctx.lineWidth=1.8;
            const tw26 = ctx.measureText('2026').width;
            for (let ci = 0; ci < cracks.length; ci++) {
              const ck = cracks[ci];
              const reveal = Math.min(1, crkT * cracks.length - ci);
              if (reveal <= 0) continue;
              const nPts = Math.ceil(ck.pts.length * reveal);
              ctx.beginPath();
              ctx.moveTo(ck.pts[0].x, ck.pts[0].y);
              for (let j = 1; j < nPts; j++) ctx.lineTo(ck.pts[j].x, ck.pts[j].y);
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      }

      /* ── SHARDS ── */
      if (t >= T.shatter) {
        if (shards.length === 0) createShards();
        const sT = t - T.shatter;
        for (const s of shards) {
          s.x += s.vx; s.y += s.vy; s.vy += 0.18; s.rot += s.rs;
          s.a = Math.max(0, 1 - sT / 2.2);
          if (s.a < 0.01) continue;
          ctx.save(); ctx.globalAlpha=s.a;
          ctx.translate(s.x,s.y); ctx.rotate(s.rot);
          const shg = ctx.createLinearGradient(-s.w/2,0,s.w/2,0);
          shg.addColorStop(0,'#94a3b8'); shg.addColorStop(0.5,'#e2e8f0'); shg.addColorStop(1,'#64748b');
          ctx.fillStyle=shg;
          ctx.shadowColor='rgba(251,191,36,0.4)'; ctx.shadowBlur=6;
          ctx.fillRect(-s.w/2,-s.h/2,s.w,s.h);
          ctx.restore();
        }
        // Explosion flash
        if (sT < 0.15) {
          const fl = 1 - sT / 0.15;
          const fg = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.min(w,h)*0.3);
          fg.addColorStop(0,`rgba(255,250,220,${fl*0.7})`);
          fg.addColorStop(0.5,`rgba(251,191,36,${fl*0.3})`);
          fg.addColorStop(1,'rgba(251,191,36,0)');
          ctx.fillStyle=fg; ctx.fillRect(0,0,w,h);
        }
      }

      /* ── PORTAL ── */
      if (t >= T.portal && t < T.y2027 + 2.5) {
        const pT = eOC(cl((t-T.portal)/1.0,0,1));
        const pF = t > T.y2027+1.5 ? 1-eOC(cl((t-T.y2027-1.5)/1,0,1)) : 1;
        const pa = pT * pF;
        if (pa > 0.01) {
          const cx=w/2, cy=h/2, pr=Math.min(w,h)*0.28*pT;
          ctx.save(); ctx.globalAlpha=pa;
          // Dark void
          const vg=ctx.createRadialGradient(cx,cy,0,cx,cy,pr*1.6);
          vg.addColorStop(0,'rgba(0,0,0,0.92)'); vg.addColorStop(0.4,'rgba(15,5,30,0.75)'); vg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=vg; ctx.beginPath(); ctx.arc(cx,cy,pr*1.6,0,TAU); ctx.fill();
          // Energy rings
          for (let i=0;i<5;i++){
            const rr=pr*(0.5+i*0.14);
            const rot=t*(1.8+i*0.6)*(i%2===0?1:-1);
            ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot);
            ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*(0.8+i*0.25));
            const rg=ctx.createLinearGradient(-rr,0,rr,0);
            rg.addColorStop(0,'rgba(251,191,36,0)');
            rg.addColorStop(0.5,`rgba(251,191,36,${0.55-i*0.08})`);
            rg.addColorStop(1,'rgba(251,191,36,0)');
            ctx.strokeStyle=rg; ctx.lineWidth=2.5-i*0.35; ctx.stroke();
            ctx.restore();
          }
          // Inner glow
          const ig=ctx.createRadialGradient(cx,cy,0,cx,cy,pr*0.45);
          ig.addColorStop(0,`rgba(255,252,235,${0.85*pT})`);
          ig.addColorStop(0.4,`rgba(251,191,36,${0.45*pT})`);
          ig.addColorStop(1,'rgba(251,191,36,0)');
          ctx.fillStyle=ig; ctx.beginPath(); ctx.arc(cx,cy,pr*0.45,0,TAU); ctx.fill();
          // Portal particles
          if (Math.random()<0.5){
            const ang=rn(0,TAU), dist=rn(pr*0.2,pr*0.9);
            sp({ x:cx+Math.cos(ang)*dist, y:cy+Math.sin(ang)*dist, vx:-Math.cos(ang)*rn(0.5,2.5), vy:-Math.sin(ang)*rn(0.5,2.5), sz:rn(1,3), a:0.8, ml:rn(18,35), r:251,g:191,b:36, tp:5, gv:0, dr:0.97 });
          }
          ctx.restore();
        }
      }

      /* ── 2027 TEXT ── */
      if (t >= T.y2027) {
        const r27 = eOC(cl((t-T.y2027)/1.3,0,1));
        const sz27 = Math.min(w*0.24,195);
        const sY = h/2+sz27*0.6, eY = h/2;
        const cY = lr(sY, eY, r27);
        const f27 = t > T.fade ? 1-eOC(cl((t-T.fade)/(T.end-T.fade),0,1)) : 1;
        const total = r27 * f27;
        if (total > 0.01) {
          ctx.save(); ctx.globalAlpha=total;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.font=`900 ${sz27}px "Inter","Segoe UI",system-ui,sans-serif`;
          // Metallic gold vertical gradient
          const mg=ctx.createLinearGradient(w/2,cY-sz27/2,w/2,cY+sz27/2);
          mg.addColorStop(0,'#78350f'); mg.addColorStop(0.12,'#b45309'); mg.addColorStop(0.25,'#d97706');
          mg.addColorStop(0.38,'#fbbf24'); mg.addColorStop(0.48,'#fef3c7'); mg.addColorStop(0.55,'#fffbeb');
          mg.addColorStop(0.62,'#fef3c7'); mg.addColorStop(0.72,'#fbbf24'); mg.addColorStop(0.85,'#d97706');
          mg.addColorStop(0.93,'#92400e'); mg.addColorStop(1,'#78350f');
          ctx.fillStyle=mg;
          ctx.shadowColor='rgba(251,191,36,0.65)'; ctx.shadowBlur=35*r27;
          ctx.fillText('2027',w/2,cY);
          // Shimmer
          if (r27 >= 0.95) {
            const shX = w/2-sz27*1.2+((t*90)%(sz27*2.8));
            const shg=ctx.createLinearGradient(shX-40,0,shX+40,0);
            shg.addColorStop(0,'rgba(255,255,255,0)'); shg.addColorStop(0.5,'rgba(255,255,255,0.35)'); shg.addColorStop(1,'rgba(255,255,255,0)');
            ctx.globalCompositeOperation='lighter';
            ctx.fillStyle=shg; ctx.fillText('2027',w/2,cY);
            ctx.globalCompositeOperation='source-over';
          }
          ctx.restore();
        }
      }

      /* ── FIREWORKS ── */
      if (t >= T.fw && t < T.end) {
        if (ts - lastFW > 150 + Math.random() * 250) {
          launchFW();
          if (Math.random() < 0.45) launchFW();
          if (t > T.drone1 && Math.random() < 0.3) launchFW();
          lastFW = ts;
        }
      }
      for (let i = fws.length - 1; i >= 0; i--) {
        const fw = fws[i];
        if (fw.ph === 0) {
          fw.y += fw.vy; fw.vy += 0.1;
          sp({ x:fw.x+rn(-1.5,1.5), y:fw.y, vx:rn(-0.4,0.4), vy:rn(0.8,2), sz:rn(1.2,2.8), a:0.85, ml:rn(12,22), r:fw.cr,g:fw.cg,b:fw.cb, tp:2, gv:0.025, dr:0.97 });
          if (fw.y <= fw.ty || fw.vy >= 0) { fw.ph = 1; explodeFW(fw); }
        }
        if (fw.ph === 1) { fw.et++; if (fw.et > 110) fws.splice(i, 1); }
      }

      /* ── DRONE SHOW ── */
      if (t >= T.drone1 && t < T.confetti + 1) {
        let idx = -1;
        if (t < T.drone2) idx = 0;
        else if (t < T.drone3) idx = 1;
        else idx = 2;
        if (idx !== droneTextIdx) { droneTextIdx = idx; setDroneTargets(droneTexts[idx]); }
        const dA = eOC(cl((t-T.drone1)/0.4,0,1)) * (t > T.confetti ? 1-eOC(cl((t-T.confetti)/0.5,0,1)) : 1);
        if (dA > 0.01) {
          const lerpF = 0.06;
          ctx.save(); ctx.globalAlpha = dA;
          for (const dr of drones) {
            if (!dr.active) continue;
            dr.x += (dr.tx - dr.x) * lerpF;
            dr.y += (dr.ty - dr.y) * lerpF;
            // Glow
            const dg = ctx.createRadialGradient(dr.x,dr.y,0,dr.x,dr.y,6);
            dg.addColorStop(0,'rgba(251,191,36,0.6)'); dg.addColorStop(1,'rgba(251,191,36,0)');
            ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dr.x,dr.y,6,0,TAU); ctx.fill();
            // Core
            ctx.fillStyle='#fef3c7'; ctx.beginPath(); ctx.arc(dr.x,dr.y,1.5,0,TAU); ctx.fill();
          }
          ctx.restore();
        }
      }

      /* ── CONFETTI ── */
      if (t >= T.confetti && t < T.end) {
        const rate = Math.min(1, (t - T.confetti) / 0.5);
        if (Math.random() < 0.6 * rate) {
          const cols = [[251,191,36],[255,215,0],[255,255,255],[212,175,55],[247,233,163],[220,38,38],[100,149,237]];
          const c = cols[Math.floor(Math.random()*cols.length)];
          sp({ x:rn(0,w), y:-rn(5,20), vx:rn(-1.5,1.5), vy:rn(1.2,3.5), sz:rn(3,8), a:1, ml:rn(160,280), r:c[0],g:c[1],b:c[2], tp:4, gv:0.008, dr:0.998, rot:rn(0,TAU), rs:rn(-0.12,0.12) });
        }
      }

      /* ── GOLDEN RAIN PARTICLES ── */
      if (t >= T.drone2 && t < T.end && Math.random() < 0.4) {
        sp({ x:rn(0,w), y:-5, vx:rn(-0.3,0.3), vy:rn(1.5,4), sz:rn(0.8,2.5), a:rn(0.4,0.8), ml:rn(80,160), r:251,g:191,b:36, tp:5, gv:0.01, dr:0.995 });
      }

      /* ── PARTICLES UPDATE & DRAW ── */
      let alive = 0;
      for (let i = 0; i < pc; i++) {
        const p = ps[i];
        p.life++;
        if (p.life >= p.ml) continue;
        p.vx *= p.dr; p.vy *= p.dr; p.vy += p.gv;
        p.x += p.vx; p.y += p.vy; p.rot += p.rs;
        const lt = p.life / p.ml;
        let al = p.a;
        if (p.tp === 1) al = p.a * (1 - lt);
        else if (p.tp === 2) al = p.a * (1 - lt) * 0.75;
        else if (p.tp === 3) al = p.a * (1 - lt * lt);
        else if (p.tp === 4) al = p.a * Math.min(1, lt / 0.08);
        else if (p.tp === 5) al = p.a * (1 - lt);
        if (al < 0.008) continue;

        ctx.save(); ctx.globalAlpha = al;
        if (p.tp === 4) {
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.fillRect(-p.sz/2, -p.sz/4, p.sz, p.sz/2);
        } else if (p.tp === 3) {
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.shadowColor = `rgb(${p.r},${p.g},${p.b})`; ctx.shadowBlur = p.sz * 3.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.3, p.sz * (1 - lt * 0.4)), 0, TAU); ctx.fill();
        } else if (p.tp === 5) {
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.shadowColor = `rgb(${p.r},${p.g},${p.b})`; ctx.shadowBlur = p.sz * 4;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, TAU); ctx.fill();
        }
        ctx.restore();
        ps[alive++] = p;
      }
      pc = alive;

      /* ── HAPPY NEW YEAR TEXT ── */
      if (t >= T.text) {
        const tA = eOC(cl((t-T.text)/0.7,0,1));
        const tF = t > T.fade ? 1-eOC(cl((t-T.fade)/(T.end-T.fade),0,1)) : 1;
        const ta = tA * tF;
        if (ta > 0.01) {
          ctx.save(); ctx.globalAlpha = ta;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const mSz = Math.min(w*0.065,52);
          const tY = h * 0.8;
          // Crystal gold gradient
          ctx.font = `200 ${mSz}px "Inter","Segoe UI",system-ui,sans-serif`;
          const tg = ctx.createLinearGradient(w/2-250,tY-mSz/2,w/2+250,tY+mSz/2);
          tg.addColorStop(0,'#92400e'); tg.addColorStop(0.15,'#d97706'); tg.addColorStop(0.3,'#fbbf24');
          tg.addColorStop(0.42,'#fef3c7'); tg.addColorStop(0.5,'#ffffff');
          tg.addColorStop(0.58,'#fef3c7'); tg.addColorStop(0.7,'#fbbf24');
          tg.addColorStop(0.85,'#d97706'); tg.addColorStop(1,'#92400e');
          ctx.fillStyle = tg;
          ctx.shadowColor = 'rgba(251,191,36,0.55)'; ctx.shadowBlur = 28;
          ctx.fillText('HAPPY NEW YEAR 2027', w/2, tY);
          // Shimmer sweep
          if (tA >= 0.9) {
            const sx = w/2-300+((t*100)%700);
            const sg = ctx.createLinearGradient(sx-50,0,sx+50,0);
            sg.addColorStop(0,'rgba(255,255,255,0)'); sg.addColorStop(0.5,'rgba(255,255,255,0.4)'); sg.addColorStop(1,'rgba(255,255,255,0)');
            ctx.globalCompositeOperation='lighter'; ctx.fillStyle=sg;
            ctx.fillText('HAPPY NEW YEAR 2027', w/2, tY);
            ctx.globalCompositeOperation='source-over';
          }
          // Subtitle
          const sA = eOC(cl((t-T.text-0.25)/0.5,0,1));
          ctx.globalAlpha = ta * sA * 0.65;
          const sSz = Math.min(w*0.03,24);
          ctx.font = `300 ${sSz}px "Inter","Segoe UI",system-ui,sans-serif`;
          ctx.fillStyle = 'rgba(254,243,199,0.85)'; ctx.shadowBlur = 12;
          ctx.fillText('A NEW BEGINNING AWAITS', w/2, tY + mSz * 1.1);
          // Decorative lines
          const lw = Math.min(w * 0.35, 280) * tA;
          ctx.globalAlpha = ta * 0.4;
          const lg = ctx.createLinearGradient(w/2-lw/2,0,w/2+lw/2,0);
          lg.addColorStop(0,'rgba(251,191,36,0)'); lg.addColorStop(0.3,'rgba(251,191,36,0.6)');
          lg.addColorStop(0.5,'rgba(255,255,255,0.8)'); lg.addColorStop(0.7,'rgba(251,191,36,0.6)');
          lg.addColorStop(1,'rgba(251,191,36,0)');
          ctx.strokeStyle = lg; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(w/2-lw/2, tY-mSz*0.75); ctx.lineTo(w/2+lw/2, tY-mSz*0.75); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w/2-lw/2, tY+mSz*0.75+sSz*1.1); ctx.lineTo(w/2+lw/2, tY+mSz*0.75+sSz*1.1); ctx.stroke();
          ctx.restore();
        }
      }

      /* ── GOLDEN GLOW ── */
      if (t >= T.glow && t < T.end) {
        const gA = eOC(cl((t-T.glow)/0.5,0,1)) * 0.18;
        const gF = t > T.fade ? 1-eOC(cl((t-T.fade)/(T.end-T.fade),0,1)) : 1;
        const ga = gA * gF;
        if (ga > 0.001) {
          const gg = ctx.createRadialGradient(w/2,h*0.5,0,w/2,h*0.5,Math.max(w,h)*0.65);
          gg.addColorStop(0,`rgba(251,191,36,${ga})`);
          gg.addColorStop(0.5,`rgba(217,119,6,${ga*0.35})`);
          gg.addColorStop(1,'rgba(217,119,6,0)');
          ctx.fillStyle = gg; ctx.fillRect(0,0,w,h);
        }
      }

      /* ── FINAL FADE ── */
      if (t >= T.fade) {
        const fp = eIQ(cl((t-T.fade)/(T.end-T.fade),0,1));
        ctx.fillStyle = `rgba(255,248,230,${fp})`;
        ctx.fillRect(0,0,w,h);
      }

      /* ── VIGNETTE ── */
      if (t < T.fade) {
        const vA = eOC(cl(t/1.5,0,1)) * 0.4 * (1 - eOC(cl((t-T.warm)/2,0,1)) * 0.5);
        if (vA > 0.01) {
          const vg = ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*0.25,w/2,h/2,Math.max(w,h)*0.85);
          vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,`rgba(0,0,0,${vA})`);
          ctx.fillStyle = vg; ctx.fillRect(0,0,w,h);
        }
      }

      /* ── COMPLETE ── */
      if (t >= T.end && !doneRef.current) {
        doneRef.current = true; run = false;
        ocRef.current();
        return;
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
        display: 'block', background: '#000',
        zIndex: 9999,
      }}
    />
  );
}
