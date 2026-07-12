'use client';

import { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; life: number; maxLife: number;
  r: number; g: number; b: number;
  alpha: number;
  rotation: number; rotSpeed: number;
  active: boolean;
  type: number;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const POOL = 2800;
const DUR = 12;
const E = 0.0001;

/* ═══════════════════════════════════════════════════════════════
   EASING
   ═══════════════════════════════════════════════════════════════ */
const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIOC = (t: number) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const eOQ = (t: number) => 1 - Math.pow(1 - t, 4);
const eIQ = (t: number) => t * t;

/* ═══════════════════════════════════════════════════════════════
   BEZIER HELPERS
   ═══════════════════════════════════════════════════════════════ */
function cb(t: number, a: number, b: number, c: number, d: number): number {
  const m = 1 - t;
  return m*m*m*a + 3*m*m*t*b + 3*m*t*t*c + t*t*t*d;
}
function sampleSeg(p0: number[], p1: number[], p2: number[], p3: number[], n: number): number[][] {
  const pts: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([cb(t,p0[0],p1[0],p2[0],p3[0]), cb(t,p0[1],p1[1],p2[1],p3[1])]);
  }
  return pts;
}

/* ═══════════════════════════════════════════════════════════════
   GANESHA OUTLINE PATH  (400×400 reference space → normalised 0-1)
   ═══════════════════════════════════════════════════════════════ */
function buildGanesha(): number[][] {
  const body: number[][][] = [
    [[200,58],[158,38],[78,48],[58,105]],
    [[58,105],[42,148],[68,178],[112,162]],
    [[112,162],[128,154],[140,162],[144,182]],
    [[144,182],[142,208],[126,226],[108,234]],
    [[108,234],[96,242],[90,254],[100,258]],
    [[100,258],[114,262],[124,250],[128,232]],
    [[128,232],[124,264],[116,314],[124,350]],
    [[124,350],[130,368],[158,386],[200,390]],
    [[200,390],[242,386],[270,368],[276,350]],
    [[276,350],[284,314],[276,264],[272,232]],
    [[272,232],[276,250],[286,262],[300,258]],
    [[300,258],[310,254],[304,242],[292,234]],
    [[292,234],[274,226],[258,208],[256,182]],
    [[256,182],[260,162],[272,154],[288,162]],
    [[288,162],[332,178],[358,148],[342,105]],
    [[342,105],[322,48],[242,38],[200,58]],
  ];
  const trunk: number[][][] = [
    [[190,152],[176,190],[142,240],[118,274]],
    [[118,274],[108,290],[94,294],[92,284]],
    [[92,284],[90,274],[100,266],[114,272]],
  ];
  const crown: number[][][] = [
    [[188,58],[192,32],[200,18],[208,32],[212,58]],
  ];
  const all: number[][] = [];
  const sps = 14;
  const addSegs = (segs: number[][][]) => {
    for (const s of segs) {
      const pts = sampleSeg(s[0],s[1],s[2],s[3],sps);
      const start = all.length > 0 ? 1 : 0;
      for (let i = start; i < pts.length; i++) all.push(pts[i]);
    }
  };
  addSegs(body);
  addSegs(trunk);
  addSegs(crown);
  return all.map(p => [p[0]/400, p[1]/400]);
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
interface Props { onComplete?: () => void }

export default function GaneshChaturthiCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef   = useRef(0);
  const t0Ref    = useRef(0);
  const doneRef  = useRef(false);
  const cbRef    = useRef(onComplete);
  cbRef.current = onComplete;

  /* stable helpers */
  const initPool = useCallback(() => {
    const a: Particle[] = [];
    for (let i = 0; i < POOL; i++)
      a.push({ x:0,y:0,vx:0,vy:0,size:0,life:0,maxLife:1,r:255,g:200,b:50,
                alpha:0,rotation:0,rotSpeed:0,active:false,type:0 });
    return a;
  }, []);
  const grab = useCallback((p: Particle[]) => {
    for (let i = 0; i < p.length; i++) if (!p[i].active) return p[i];
    return null;
  }, []);

  /* ─── main effect ─── */
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d', { alpha: false });
    if (!ctx) return;

    /* retina */
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      cvs.width = W * dpr; cvs.height = H * dpr;
      cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize();
    window.addEventListener('resize', resize);

    /* init */
    const pool = initPool();
    const gp = buildGanesha();
    const gn = gp.length;

    /* ambient dust (persistent) */
    const dustIdx: number[] = [];
    for (let i = 0; i < 70; i++) {
      const p = pool[i]; p.active = true; p.type = 0;
      p.x = Math.random()*W; p.y = Math.random()*H;
      p.vx = (Math.random()-.5)*.25; p.vy = -Math.random()*.4-.08;
      p.size = Math.random()*1.8+.4; p.maxLife = 999; p.life = 999;
      p.r = 255; p.g = 190+Math.random()*60|0; p.b = 40+Math.random()*60|0;
      p.alpha = Math.random()*.25+.08; p.rotation = 0; p.rotSpeed = 0;
      dustIdx.push(i);
    }

    /* ─────────────────────── DRAW HELPERS ─────────────────────── */

    function bg(t: number) {
      ctx.fillStyle = '#08040a';
      ctx.fillRect(0,0,W,H);
      const aa = t < 3 ? eOC(Math.min(t/2.5,1))*.65 : .65;
      /* saffron top */
      let g = ctx.createRadialGradient(W*.5,H*.25,0,W*.5,H*.25,H*.85);
      g.addColorStop(0,`rgba(190,90,15,${aa*.32})`);
      g.addColorStop(.6,`rgba(110,25,25,${aa*.18})`);
      g.addColorStop(1,'rgba(8,4,10,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      /* maroon bottom */
      g = ctx.createRadialGradient(W*.5,H*.85,0,W*.5,H*.85,H*.55);
      g.addColorStop(0,`rgba(75,12,22,${aa*.45})`);
      g.addColorStop(1,'rgba(8,4,10,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      /* centre warmth */
      let ca = 0;
      if (t>2) ca = Math.min((t-2)/4,1)*.22;
      if (t>6) ca = .22 + Math.min((t-6)/2,1)*.2;
      if (t>9) ca = .42 + Math.min((t-9)/2,1)*.18;
      g = ctx.createRadialGradient(W*.5,H*.44,0,W*.5,H*.44,H*.48);
      g.addColorStop(0,`rgba(255,175,45,${ca})`);
      g.addColorStop(.45,`rgba(195,70,25,${ca*.45})`);
      g.addColorStop(1,'rgba(8,4,10,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      /* vignette */
      g = ctx.createRadialGradient(W*.5,H*.5,H*.28,W*.5,H*.5,H*.95);
      g.addColorStop(0,'rgba(0,0,0,0)');
      g.addColorStop(1,'rgba(0,0,0,.65)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }

    /* --- Phase 1 streams --- */
    function spawnStream(t: number) {
      const prog = Math.min(t/2.5,1);
      for (let s = 0; s < 2; s++) {
        const side = s===0?-1:1;
        const sx = s===0?-30:W+30;
        const ex = W*.5, ey = H*.44;
        for (let i = 0; i < 4; i++) {
          const p = grab(pool); if(!p) break;
          const tt = Math.random()*prog;
          const cpx = side===-1?W*.18:W*.82;
          const cpy = H*.18+Math.sin(tt*Math.PI)*H*.14;
          const m = 1-tt;
          p.x = m*m*sx+2*m*tt*cpx+tt*tt*ex+(Math.random()-.5)*35;
          p.y = m*m*(H*.52)+2*m*tt*cpy+tt*tt*ey+(Math.random()-.5)*35;
          p.vx = side*(Math.random()*2.2+.8);
          p.vy = (Math.random()-.5)*.6;
          p.size = Math.random()*3.5+.8;
          p.maxLife = 1.6+Math.random(); p.life = p.maxLife;
          p.r = 255; p.g = 175+Math.random()*65|0; p.b = 25+Math.random()*45|0;
          p.alpha = .55+Math.random()*.45;
          p.rotation = 0; p.rotSpeed = 0;
          p.active = true; p.type = 1;
        }
      }
    }

    function drawStreams() {
      for (const p of pool) {
        if (!p.active||p.type!==1) continue;
        const lr = p.life/p.maxLife;
        const a = p.alpha*Math.min(lr*3,1)*Math.min((1-lr)*3,1);
        ctx.beginPath();
        ctx.arc(p.x,p.y,Math.max(E,p.size),0,Math.PI*2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        ctx.fill();
        if (p.size>1.8) {
          const gl = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,Math.max(E,p.size*3.5));
          gl.addColorStop(0,`rgba(${p.r},${p.g},${p.b},${a*.25})`);
          gl.addColorStop(1,`rgba(${p.r},${p.g},${p.b},0)`);
          ctx.fillStyle = gl;
          ctx.fillRect(p.x-p.size*3.5,p.y-p.size*3.5,p.size*7,p.size*7);
        }
      }
    }

    /* --- Smoke --- */
    function spawnSmoke() {
      if (Math.random()>.18) return;
      const p = grab(pool); if(!p) return;
      p.x = W*.25+Math.random()*W*.5;
      p.y = H*.55+Math.random()*H*.25;
      p.vx = (Math.random()-.5)*.45; p.vy = -Math.random()*.7-.25;
      p.size = Math.random()*45+18;
      p.maxLife = 4.5+Math.random()*3; p.life = p.maxLife;
      p.r = 160; p.g = 105; p.b = 70;
      p.alpha = .035+Math.random()*.025;
      p.rotation = 0; p.rotSpeed = 0;
      p.active = true; p.type = 6;
    }
    function drawSmoke() {
      for (const p of pool) {
        if (!p.active||p.type!==6) continue;
        const lr = p.life/p.maxLife;
        const a = p.alpha*(lr<.3?lr/.3:lr>.7?(1-lr)/.3:1);
        const gl = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,Math.max(E,p.size));
        gl.addColorStop(0,`rgba(${p.r},${p.g},${p.b},${a})`);
        gl.addColorStop(1,`rgba(${p.r},${p.g},${p.b},0)`);
        ctx.fillStyle = gl;
        ctx.fillRect(p.x-p.size,p.y-p.size,p.size*2,p.size*2);
      }
    }

    /* --- Ambient dust --- */
    function drawDust(t: number) {
      for (let i = 0; i < dustIdx.length; i++) {
        const p = pool[dustIdx[i]];
        p.x += p.vx + Math.sin(t*.4+i)*.08;
        p.y += p.vy;
        if (p.y<-12){p.y=H+12;p.x=Math.random()*W;}
        if(p.x<-12)p.x=W+12; if(p.x>W+12)p.x=-12;
        const fl = .65+Math.sin(t*1.8+i*.6)*.35;
        ctx.beginPath();
        ctx.arc(p.x,p.y,Math.max(E,p.size),0,Math.PI*2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha*fl})`;
        ctx.fill();
      }
    }

    /* --- Ganesha outline --- */
    function drawOutline(t: number) {
      const ps = 3, dur = 3;
      const prog = eIOC(Math.min((t-ps)/dur,1));
      const show = Math.floor(prog*gn);
      if (show<2) return;
      const sc = Math.min(W,H)*.58;
      const ox = (W-sc)/2, oy = (H-sc)/2-H*.018;
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
      /* glow pass */
      ctx.shadowColor='rgba(255,175,45,.55)'; ctx.shadowBlur=16;
      ctx.strokeStyle='rgba(255,195,70,.35)'; ctx.lineWidth=3.5;
      ctx.beginPath();
      ctx.moveTo(gp[0][0]*sc+ox, gp[0][1]*sc+oy);
      for (let i=1;i<show;i++) ctx.lineTo(gp[i][0]*sc+ox, gp[i][1]*sc+oy);
      ctx.stroke();
      /* bright pass */
      ctx.shadowColor='rgba(255,215,90,.7)'; ctx.shadowBlur=6;
      ctx.strokeStyle='rgba(255,225,130,.88)'; ctx.lineWidth=1.6;
      ctx.beginPath();
      ctx.moveTo(gp[0][0]*sc+ox, gp[0][1]*sc+oy);
      for (let i=1;i<show;i++) ctx.lineTo(gp[i][0]*sc+ox, gp[i][1]*sc+oy);
      ctx.stroke();
      /* leading edge */
      if (t-ps<dur && show>0) {
        const lp = gp[show-1];
        const lx=lp[0]*sc+ox, ly=lp[1]*sc+oy;
        const eg = ctx.createRadialGradient(lx,ly,0,lx,ly,Math.max(E,18));
        eg.addColorStop(0,'rgba(255,255,195,.92)');
        eg.addColorStop(.35,'rgba(255,195,70,.45)');
        eg.addColorStop(1,'rgba(255,170,40,0)');
        ctx.fillStyle = eg;
        ctx.fillRect(lx-18,ly-18,36,36);
      }
      /* sparkle along drawn line */
      ctx.shadowBlur = 0;
      for (let i=0;i<show;i+=4) {
        const pt = gp[i];
        const sp = .25+Math.sin(t*3.5+i*.45)*.25;
        ctx.beginPath();
        ctx.arc(pt[0]*sc+ox, pt[1]*sc+oy, Math.max(E,1.1), 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,235,170,${sp})`;
        ctx.fill();
      }
      ctx.restore();
    }

    /* --- Orbit particles --- */
    function spawnOrbit(t: number) {
      if (t<3.5||t>11.5||Math.random()>.22) return;
      const p = grab(pool); if(!p) return;
      const sc = Math.min(W,H)*.58;
      const cx=W/2, cy=H/2-H*.018;
      const ang = Math.random()*Math.PI*2;
      const rad = sc*.36+Math.random()*sc*.08;
      p.x = cx+Math.cos(ang)*rad;
      p.y = cy+Math.sin(ang)*rad;
      p.vx = Math.cos(ang+Math.PI/2)*.7;
      p.vy = Math.sin(ang+Math.PI/2)*.7;
      p.size = Math.random()*1.8+.4;
      p.maxLife = 2.2+Math.random()*2; p.life = p.maxLife;
      p.r = 255; p.g = 205+Math.random()*50|0; p.b = 70+Math.random()*60|0;
      p.alpha = .45+Math.random()*.35;
      p.rotation = 0; p.rotSpeed = 0;
      p.active = true; p.type = 5;
    }
    function drawOrbit() {
      for (const p of pool) {
        if (!p.active||p.type!==5) continue;
        const lr = p.life/p.maxLife;
        const a = p.alpha*Math.min(lr*2,1)*Math.min((1-lr)*2,1);
        ctx.beginPath();
        ctx.arc(p.x,p.y,Math.max(E,p.size),0,Math.PI*2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        ctx.fill();
      }
    }

    /* --- Bloom --- */
    function drawBloom(t: number) {
      const bs = 6;
      const bt = Math.min((t-bs)/1.5,1);
      if (bt<=0) return;
      const sc = Math.min(W,H)*.58;
      const cx=W/2, cy=H/2-H*.018;
      const maxR = sc*.85;
      const r = maxR*eOQ(bt);
      /* ring */
      ctx.save();
      const ra = (1-bt)*.45;
      ctx.beginPath();
      ctx.arc(cx,cy,Math.max(E,r),0,Math.PI*2);
      ctx.strokeStyle = `rgba(255,195,70,${ra})`;
      ctx.lineWidth = 3.5*(1-bt);
      ctx.shadowColor = `rgba(255,175,45,${ra})`; ctx.shadowBlur = 28;
      ctx.stroke();
      ctx.restore();
      /* glow */
      const ba = (1-bt*.7)*.18;
      const bg = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(E,r));
      bg.addColorStop(0,`rgba(255,195,70,${ba})`);
      bg.addColorStop(.5,`rgba(255,145,45,${ba*.45})`);
      bg.addColorStop(1,'rgba(255,95,25,0)');
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
      /* bloom particles */
      if (bt<.45&&Math.random()<.55) {
        const p = grab(pool); if(p) {
          const ang = Math.random()*Math.PI*2;
          const spd = 2.5+Math.random()*4.5;
          p.x=cx; p.y=cy;
          p.vx=Math.cos(ang)*spd; p.vy=Math.sin(ang)*spd;
          p.size=Math.random()*3.2+.8;
          p.maxLife=1.4+Math.random(); p.life=p.maxLife;
          p.r=255; p.g=185+Math.random()*55|0; p.b=45+Math.random()*55|0;
          p.alpha=.65; p.rotation=0; p.rotSpeed=0;
          p.active=true; p.type=3;
        }
      }
    }
    function drawBloomParts() {
      for (const p of pool) {
        if (!p.active||p.type!==3) continue;
        const lr = p.life/p.maxLife;
        const a = p.alpha*lr;
        ctx.beginPath();
        ctx.arc(p.x,p.y,Math.max(E,p.size*(1+(1-lr)*.5)),0,Math.PI*2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        ctx.fill();
      }
    }

    /* --- Petals --- */
    function spawnPetals(t: number) {
      if (t<6.3||Math.random()>.28) return;
      const p = grab(pool); if(!p) return;
      p.x = Math.random()*W; p.y = -22-Math.random()*55;
      p.vx = (Math.random()-.5)*1.6; p.vy = 1.6+Math.random()*2.2;
      p.size = 4.5+Math.random()*6.5;
      p.maxLife = 6.5+Math.random()*3; p.life = p.maxLife;
      const ct = Math.random();
      if (ct<.38){p.r=255;p.g=132;p.b=0;}
      else if(ct<.68){p.r=255;p.g=185;p.b=25;}
      else{p.r=255;p.g=218;p.b=45;}
      p.alpha = .55+Math.random()*.3;
      p.rotation = Math.random()*Math.PI*2;
      p.rotSpeed = (Math.random()-.5)*.045;
      p.active = true; p.type = 4;
    }
    function drawPetals() {
      for (const p of pool) {
        if (!p.active||p.type!==4) continue;
        const lr = p.life/p.maxLife;
        const a = p.alpha*Math.min(lr*2,1)*(lr>.82?(1-lr)/.18:1);
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0,0,Math.max(E,p.size*.38),Math.max(E,p.size),0,0,Math.PI*2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-p.size*.08,-p.size*.22,Math.max(E,p.size*.12),Math.max(E,p.size*.35),0,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,215,${a*.28})`;
        ctx.fill();
        ctx.restore();
      }
    }

    /* --- Kumkum / Akshat --- */
    function spawnKumkum(t: number) {
      if (t<6.6||Math.random()>.32) return;
      const p = grab(pool); if(!p) return;
      p.x = Math.random()*W; p.y = -12-Math.random()*35;
      p.vx = (Math.random()-.5)*.7; p.vy = .5+Math.random()*1.4;
      p.size = .8+Math.random()*2;
      p.maxLife = 5.5+Math.random()*3; p.life = p.maxLife;
      if (Math.random()<.48){p.r=195+Math.random()*60|0;p.g=18+Math.random()*28|0;p.b=18+Math.random()*28|0;}
      else{p.r=255;p.g=225+Math.random()*30|0;p.b=145+Math.random()*55|0;}
      p.alpha = .45+Math.random()*.4;
      p.rotation = Math.random()*Math.PI*2;
      p.rotSpeed = (Math.random()-.5)*.07;
      p.active = true; p.type = 8;
    }
    function drawKumkum() {
      for (const p of pool) {
        if (!p.active||p.type!==8) continue;
        const lr = p.life/p.maxLife;
        const a = p.alpha*Math.min(lr*2,1)*(lr>.84?(1-lr)/.16:1);
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        ctx.fillRect(-p.size*.5,-p.size*.22,p.size,p.size*.44);
        ctx.restore();
      }
    }

    /* --- Light rays --- */
    function drawRays(t: number) {
      if (t<6.5) return;
      const rt = Math.min((t-6.5)/2,1);
      const alpha = eOC(rt)*.1;
      const cx=W/2, cy=H/2-H*.018;
      const rl = Math.max(W,H)*.82;
      ctx.save(); ctx.globalAlpha = alpha;
      const nr = 14;
      for (let i=0;i<nr;i++) {
        const ang = (i/nr)*Math.PI*2+t*.04;
        const hw = (Math.PI/nr)*.38;
        ctx.beginPath(); ctx.moveTo(cx,cy);
        ctx.lineTo(cx+Math.cos(ang-hw)*rl, cy+Math.sin(ang-hw)*rl);
        ctx.lineTo(cx+Math.cos(ang+hw)*rl, cy+Math.sin(ang+hw)*rl);
        ctx.closePath();
        const rg = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(E,rl));
        rg.addColorStop(0,'rgba(255,195,70,.75)');
        rg.addColorStop(.5,'rgba(255,155,45,.25)');
        rg.addColorStop(1,'rgba(255,115,25,0)');
        ctx.fillStyle = rg; ctx.fill();
      }
      ctx.restore();
    }

    /* --- Ganesha dissolve (Phase 4) --- */
    function drawDissolve(t: number) {
      const ps = 9;
      const dt = Math.min((t-ps)/2,1);
      if (dt<=0) return;
      const sc = Math.min(W,H)*.58;
      const ox = (W-sc)/2, oy = (H-sc)/2-H*.018;
      const oa = Math.max(0, 1-dt*1.6);
      if (oa>0) {
        ctx.save(); ctx.globalAlpha = oa;
        ctx.shadowColor = `rgba(255,195,70,${oa*.55})`; ctx.shadowBlur = 22;
        ctx.strokeStyle = `rgba(255,218,110,${oa*.75})`; ctx.lineWidth = 2;
        ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath();
        ctx.moveTo(gp[0][0]*sc+ox, gp[0][1]*sc+oy);
        for (let i=1;i<gn;i++) ctx.lineTo(gp[i][0]*sc+ox, gp[i][1]*sc+oy);
        ctx.stroke(); ctx.restore();
      }
      const la = eOC(dt)*.14;
      const lg = ctx.createRadialGradient(W/2,H/2-H*.018,0,W/2,H/2-H*.018,Math.max(E,sc*.32));
      lg.addColorStop(0,`rgba(255,225,140,${la})`);
      lg.addColorStop(.5,`rgba(255,175,45,${la*.45})`);
      lg.addColorStop(1,'rgba(255,145,25,0)');
      ctx.fillStyle = lg; ctx.fillRect(0,0,W,H);
    }

    /* --- Blessing text (Phase 4) --- */
    function drawText(t: number) {
      const ps = 9;
      const ft = Math.min((t-ps)/1.5,1);
      if (ft<=0) return;
      const fi = eOC(ft);
      const ty = H*.36;
      ctx.save(); ctx.globalAlpha = fi;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      /* Title */
      const ts = Math.min(W*.062, H*.068, 54);
      ctx.font = `700 ${ts}px 'Georgia','Times New Roman',serif`;
      const tw = ctx.measureText('Happy Ganesh Chaturthi').width;

      /* dark outline */
      ctx.strokeStyle = 'rgba(65,38,8,.4)';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = 'rgba(255,195,45,.5)'; ctx.shadowBlur = 22;
      ctx.strokeText('Happy Ganesh Chaturthi', W/2, ty);

      /* metallic gradient */
      const mg = ctx.createLinearGradient(W/2-tw/2,0,W/2+tw/2,0);
      mg.addColorStop(0,'#6B4F10'); mg.addColorStop(.15,'#B8860B');
      mg.addColorStop(.32,'#DAA520'); mg.addColorStop(.48,'#FFD700');
      mg.addColorStop(.52,'#FFFACD'); mg.addColorStop(.68,'#FFD700');
      mg.addColorStop(.84,'#DAA520'); mg.addColorStop(1,'#6B4F10');
      ctx.fillStyle = mg;
      ctx.shadowBlur = 18;
      ctx.fillText('Happy Ganesh Chaturthi', W/2, ty);

      /* shimmer overlay */
      const sp = (Math.sin(t*2)+1)/2;
      const sg = ctx.createLinearGradient(W/2-tw*.6,0,W/2+tw*.6,0);
      const s0 = Math.max(0,sp-.12), s1 = Math.max(0,sp-.04);
      const s2 = Math.min(1,sp+.04), s3 = Math.min(1,sp+.12);
      sg.addColorStop(s0,'rgba(255,255,235,0)');
      sg.addColorStop(s1,'rgba(255,255,235,.1)');
      sg.addColorStop(sp,'rgba(255,255,235,.18)');
      sg.addColorStop(s2,'rgba(255,255,235,.1)');
      sg.addColorStop(s3,'rgba(255,255,235,0)');
      ctx.shadowBlur = 0;
      ctx.fillStyle = sg;
      ctx.fillText('Happy Ganesh Chaturthi', W/2, ty);

      /* Shlok */
      const ss = Math.min(W*.026, H*.03, 20);
      ctx.font = `400 ${ss}px 'Nirmala UI','Devanagari Sangam MN','Segoe UI',sans-serif`;
      ctx.shadowColor = 'rgba(255,175,45,.25)'; ctx.shadowBlur = 10;
      const shg = ctx.createLinearGradient(W/2-ss*10,0,W/2+ss*10,0);
      shg.addColorStop(0,'#8B6914'); shg.addColorStop(.25,'#DAA520');
      shg.addColorStop(.5,'#FFD700'); shg.addColorStop(.75,'#DAA520');
      shg.addColorStop(1,'#8B6914');
      ctx.fillStyle = shg;
      const l1y = ty + ts*1.25;
      const l2y = l1y + ss*2;
      ctx.fillText('वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।', W/2, l1y);
      ctx.fillText('निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥', W/2, l2y);

      /* shimmer on shlok */
      ctx.fillStyle = sg;
      ctx.shadowBlur = 0;
      ctx.fillText('वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।', W/2, l1y);
      ctx.fillText('निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥', W/2, l2y);

      ctx.restore();
    }

    /* --- Final fade --- */
    function drawFade(t: number) {
      const fs = 11.5;
      const ft = Math.min((t-fs)/.5,1);
      const fa = eIQ(ft);
      ctx.fillStyle = `rgba(18,10,4,${fa})`;
      ctx.fillRect(0,0,W,H);
      if (ft<.72) {
        const ga = (1-ft/.72)*.28;
        const gg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(E,H*.42));
        gg.addColorStop(0,`rgba(255,195,70,${ga})`);
        gg.addColorStop(1,'rgba(255,145,25,0)');
        ctx.fillStyle = gg; ctx.fillRect(0,0,W,H);
      }
    }

    /* ─────────────────────── UPDATE ─────────────────────── */
    function update(dt: number) {
      for (const p of pool) {
        if (!p.active||p.type===0) continue;
        p.x += p.vx; p.y += p.vy;
        p.life -= dt; p.rotation += p.rotSpeed;
        switch(p.type) {
          case 1: p.vx*=.99; p.vy*=.99; break;
          case 3: p.vx*=.97; p.vy*=.97; break;
          case 4: p.vx+=Math.sin(p.y*.018+p.rotation)*.018; p.vy*=.999; break;
          case 5: p.vx*=.98; p.vy*=.98; break;
          case 6: p.vx*=.995; p.vy*=.998; p.size+=.28; break;
          case 8: p.vx+=(Math.random()-.5)*.018; break;
        }
        if (p.life<=0||p.y>H+55||p.x<-110||p.x>W+110) p.active = false;
      }
    }

    /* ─────────────────────── MAIN LOOP ─────────────────────── */
    let lt = 0;
    const loop = (ts: number) => {
      if (!t0Ref.current){t0Ref.current=ts;lt=ts;}
      const t = (ts-t0Ref.current)/1000;
      const dt = Math.min((ts-lt)/1000,.05);
      lt = ts;

      bg(t);

      if (t<3) {
        spawnStream(t); spawnSmoke();
        drawSmoke(); drawStreams();
      } else if (t<6) {
        spawnSmoke(); drawSmoke(); drawStreams();
        drawOutline(t); spawnOrbit(t); drawOrbit();
      } else if (t<9) {
        drawOutline(t); drawBloom(t); drawBloomParts();
        spawnPetals(t); drawPetals();
        spawnKumkum(t); drawKumkum();
        drawRays(t); spawnOrbit(t); drawOrbit();
      } else if (t<11.5) {
        drawDissolve(t); drawText(t);
        spawnPetals(t); drawPetals();
        spawnKumkum(t); drawKumkum();
        drawRays(t); spawnOrbit(t); drawOrbit();
      }
      if (t>=11.5) drawFade(t);

      drawDust(t);
      update(dt);

      if (t < DUR+.15) {
        rafRef.current = requestAnimationFrame(loop);
      } else if (!doneRef.current) {
        doneRef.current = true;
        cbRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize',resize); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[9999]" style={{ background:'#08040a' }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
