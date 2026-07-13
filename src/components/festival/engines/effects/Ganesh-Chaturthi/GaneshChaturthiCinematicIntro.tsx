'use client';

import { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
interface P {
  x:number;y:number;vx:number;vy:number;
  sz:number;life:number;ml:number;
  r:number;g:number;b:number;a:number;
  rot:number;rs:number;on:boolean;tp:number;
}
const POOL=3400, DUR=12, EP=1e-4;

/* ═══════════════════════════════════════════════════════════════
   EASING
   ═══════════════════════════════════════════════════════════════ */
const eOC=(t:number)=>1-Math.pow(1-t,3);
const eIO=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eOQ=(t:number)=>1-Math.pow(1-t,4);
const eIQ=(t:number)=>t*t;
const eOE=(t:number)=>t===1?1:1-Math.pow(2,-10*t);

/* ═══════════════════════════════════════════════════════════════
   BEZIER SAMPLER
   ═══════════════════════════════════════════════════════════════ */
function cb(t:number,a:number,b:number,c:number,d:number){
  const m=1-t;return m*m*m*a+3*m*m*t*b+3*m*t*t*c+t*t*t*d;
}
function ss(a:number[],b:number[],c:number[],d:number[],n:number):number[][]{
  const r:number[][]=[];
  for(let i=0;i<=n;i++){const t=i/n;r.push([cb(t,a[0],b[0],c[0],d[0]),cb(t,a[1],b[1],c[1],d[1])]);}
  return r;
}

/* ═══════════════════════════════════════════════════════════════
   GANESHA OUTLINE  (400×400 → 0-1 normalised)
   ═══════════════════════════════════════════════════════════════ */
function buildGP():number[][]{
  const body:number[][][]=[
    [[200, 80], [150, 60], [100, 80], [100, 120]],
    [[100, 120], [100, 160], [140, 180], [175, 160]],
    [[175, 160], [150, 190], [130, 220], [130, 260]],
    [[130, 260], [130, 320], [170, 350], [200, 350]], 
    [[200, 350], [230, 350], [270, 320], [270, 260]],
    [[270, 260], [270, 220], [250, 190], [225, 160]],
    [[225, 160], [260, 180], [300, 160], [300, 120]],
    [[300, 120], [300, 80], [250, 60], [200, 80]],
  ];
  
  const trunk:number[][][]=[
    [[190, 110], [190, 150], [170, 190], [150, 215]],
    [[150, 215], [130, 235], [110, 220], [115, 200]], 
    [[115, 200], [120, 190], [135, 195], [145, 205]],
  ];
  
  const crown:number[][][]=[
    [[200, 80], [195, 60], [185, 45], [200, 20]],
    [[200, 20], [215, 45], [205, 60], [200, 80]],
  ];

  const all:number[][]=[];
  const add=(s:number[][][])=>{for(const c of s){const pts=ss(c[0],c[1],c[2],c[3],25);const s0=all.length>0?1:0;for(let i=s0;i<pts.length;i++)all.push(pts[i]);}};
  add(body);add(trunk);add(crown);
  return all.map(p=>[p[0]/400,p[1]/400]);
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
interface Props{onComplete?:()=>void}

export default function GaneshChaturthiCinematicIntro({onComplete}:Props){
  const cvRef=useRef<HTMLCanvasElement>(null);
  const raf=useRef(0);const t0=useRef(0);const done=useRef(false);
  const cbR=useRef(onComplete);cbR.current=onComplete;

  const mkPool=useCallback(()=>{
    const a:P[]=[];
    for(let i=0;i<POOL;i++)a.push({x:0,y:0,vx:0,vy:0,sz:0,life:0,ml:1,r:255,g:200,b:50,a:0,rot:0,rs:0,on:false,tp:0});
    return a;
  },[]);
  const grab=useCallback((p:P[])=>{for(let i=0;i<p.length;i++)if(!p[i].on)return p[i];return null;},[]);

  useEffect(() => {
    const cv=cvRef.current;if(!cv)return;
    const c=cv.getContext('2d',{alpha:false});if(!c)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    let W=0,H=0;
    const rsz=()=>{W=window.innerWidth;H=window.innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';c.setTransform(dpr,0,0,dpr,0,0);};
    rsz();window.addEventListener('resize',rsz);
    const pl=mkPool();
    const gp=buildGP();const gn=gp.length;

    /* persistent dust */
    const dI:number[]=[];
    for(let i=0;i<80;i++){
      const p=pl[i];p.on=true;p.tp=0;
      p.x=Math.random()*W;p.y=Math.random()*H;
      p.vx=(Math.random()-.5)*.22;p.vy=-Math.random()*.35-.06;
      p.sz=Math.random()*1.6+.4;p.ml=999;p.life=999;
      p.r=255;p.g=185+Math.random()*60|0;p.b=35+Math.random()*60|0;
      p.a=Math.random()*.22+.06;p.rot=0;p.rs=0;
      dI.push(i);
    }

    /* ───────── DRAW HELPERS ───────── */

    /* ─── 🚀 RELATIVE PROPORTIONAL DETAILED GANESHA DRAWING ─── */
    
    // Proportional Peacock Feather (S-Scaled)
    function drawPeacockFeather(x: number, y: number, r: number, rot: number) {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.strokeStyle = '#15803d'; c.lineWidth = r * 0.08;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(r*0.4, r*0.8, r*0.5, r*1.3); c.stroke();
      c.fillStyle = '#16a34a';
      c.beginPath(); c.ellipse(0, 0, r * 0.55, r, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#06b6d4';
      c.beginPath(); c.ellipse(0, r * 0.1, r * 0.4, r * 0.72, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2563eb';
      c.beginPath(); c.ellipse(0, r * 0.18, r * 0.26, r * 0.46, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fbbf24';
      c.beginPath(); c.ellipse(0, r * 0.22, r * 0.15, r * 0.28, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    // Proportional Pink Lotus Seat (S-Scaled)
    function drawLotusSeat(cx: number, cy: number, S: number) {
      c.save();
      const colors = ['#9f1239', '#e11d48', '#f43f5e', '#fb7185', '#fbcfe8'];
      for (let layer = 0; layer < 4; layer++) {
        c.fillStyle = colors[layer];
        const numPetals = 8 - layer * 2;
        const rX = S * (0.42 - layer * 0.07);
        const rY = S * (0.16 - layer * 0.03);
        const petalY = cy + S * 0.28;
        
        for (let i = 0; i < numPetals; i++) {
          const ang = (i / (numPetals - 1)) * Math.PI - Math.PI;
          const px = cx + Math.cos(ang) * rX;
          const py = petalY + Math.sin(ang) * rY;
          c.save();
          c.translate(px, py);
          c.rotate(ang + Math.PI/2);
          c.beginPath();
          c.ellipse(0, 0, S * 0.09, S * 0.18, 0, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
      }
      c.restore();
    }

    // 100% PROPORTIONAL CUTE GANESHA (कभी स्ट्रेच नहीं होगा)
    function drawDetailedGanesha(cx: number, cy: number, S: number, opacity: number) {
      c.save();
      c.globalAlpha = opacity;

      // A. back Peacock Feathers
      drawPeacockFeather(cx - S * 0.3, cy - S * 0.16, S * 0.22, -0.45);
      drawPeacockFeather(cx + S * 0.3, cy - S * 0.16, S * 0.22, 0.45);

      // B. Pink Lotus Base
      drawLotusSeat(cx, cy, S);

      // C. Seated Body & Yellow Clothes (धोती)
      c.fillStyle = '#fde8d0';
      c.strokeStyle = '#4c0519';
      c.lineWidth = S * 0.008;

      c.beginPath(); c.ellipse(cx - S*0.14, cy + S*0.16, S*0.11, S*0.08, 0.2, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(cx + S*0.14, cy + S*0.16, S*0.11, S*0.08, -0.2, 0, Math.PI * 2); c.fill(); c.stroke();

      c.beginPath(); c.ellipse(cx, cy + S*0.08, S*0.18, S*0.16, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      
      c.fillStyle = '#facc15';
      c.beginPath(); c.ellipse(cx, cy + S*0.15, S*0.18, S*0.08, 0, 0, Math.PI * 2); c.fill(); c.stroke();

      // D. Cute Peach Ears (गोल-मटोल कान)
      c.fillStyle = '#fde8d0';
      c.beginPath(); c.ellipse(cx - S*0.18, cy - S*0.1, S*0.11, S*0.08, -0.15, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(cx + S*0.18, cy - S*0.1, S*0.11, S*0.08, 0.15, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#fda4af';
      c.beginPath(); c.ellipse(cx - S*0.17, cy - S*0.1, S*0.07, S*0.05, -0.15, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx + S*0.17, cy - S*0.1, S*0.07, S*0.05, 0.15, 0, Math.PI * 2); c.fill();

      // E. Chubby Face (चेहरा)
      c.fillStyle = '#fde8d0';
      c.beginPath(); c.arc(cx, cy - S*0.08, S*0.14, 0, Math.PI * 2); c.fill(); c.stroke();

      // F. Smooth Trunk curving Left
      c.beginPath();
      c.moveTo(cx - S*0.015, cy - S*0.06);
      c.bezierCurveTo(cx - S*0.1, cy + S*0.05, cx - S*0.12, S*0.16 + cy, cx - S*0.16, cy + S*0.18);
      c.bezierCurveTo(cx - S*0.2, cy + S*0.2, cx - S*0.24, cy + S*0.14, cx - S*0.19, cy + S*0.11);
      c.bezierCurveTo(cx - S*0.14, cy + S*0.1, cx - S*0.13, cy + S*0.04, cx - S*0.05, cy - S*0.06);
      c.closePath(); c.fill(); c.stroke();

      c.fillStyle = '#fbbf24';
      c.beginPath(); c.arc(cx - S*0.17, cy + S*0.11, S*0.026, 0, Math.PI * 2); c.fill(); c.stroke();

      // G. Large Expressive Pixar Eyes (आकर्षक आँखें)
      c.fillStyle = '#0f172a';
      c.beginPath(); c.ellipse(cx - S*0.08, cy - S*0.09, S*0.028, S*0.04, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx + S*0.08, cy - S*0.09, S*0.028, S*0.04, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(cx - S*0.088, cy - S*0.105, S*0.01, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(cx + S*0.072, cy - S*0.105, S*0.01, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(cx - S*0.072, cy - S*0.075, S*0.005, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(cx + S*0.088, cy - S*0.075, S*0.005, 0, Math.PI * 2); c.fill();

      // H. Majestic Gold Crown (मुकुट)
      c.fillStyle = '#fbbf24';
      c.beginPath();
      c.moveTo(cx - S*0.075, cy - S*0.2);
      c.lineTo(cx, cy - S*0.35);
      c.lineTo(cx + S*0.075, cy - S*0.2);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#dc2626';
      c.beginPath(); c.arc(cx, cy - S*0.26, S*0.018, 0, Math.PI * 2); c.fill();

      // I. Red Tilak
      c.fillStyle = '#dc2626';
      c.beginPath();
      c.moveTo(cx - S*0.014, cy - S*0.16);
      c.quadraticCurveTo(cx, cy - S*0.21, cx + S*0.014, cy - S*0.16);
      c.quadraticCurveTo(cx, cy - S*0.12, cx - S*0.014, cy - S*0.16);
      c.fill();

      c.restore();
    }

    /* Background rendering */
    function dBg(t:number){
      c.fillStyle='#07030a';c.fillRect(0,0,W,H);
      const aa=t<2.5?eOC(Math.min(t/2,1))*.6:.6;
      let g=c.createRadialGradient(W*.5,H*.22,0,W*.5,H*.22,H*.9);
      g.addColorStop(0,`rgba(185,85,12,${aa*.3})`);g.addColorStop(.55,`rgba(105,22,22,${aa*.16})`);g.addColorStop(1,'rgba(7,3,10,0)');
      c.fillStyle=g;c.fillRect(0,0,W,H);
      g=c.createRadialGradient(W*.5,H*.88,0,W*.5,H*.88,H*.5);
      g.addColorStop(0,`rgba(70,10,18,${aa*.4})`);g.addColorStop(1,'rgba(7,3,10,0)');
      c.fillStyle=g;c.fillRect(0,0,W,H);
      let ca=0;
      if(t>2)ca=Math.min((t-2)/4,1)*.2;
      if(t>5.5)ca=.2+Math.min((t-5.5)/2,1)*.18;
      if(t>7.5)ca=.38+Math.min((t-7.5)/1.5,1)*.15;
      if(t>9.5)ca=.53+Math.min((t-9.5)/1.5,1)*.12;
      g=c.createRadialGradient(W*.5,H*.43,0,W*.5,H*.43,H*.5);
      g.addColorStop(0,`rgba(255,170,40,${ca})`);g.addColorStop(.4,`rgba(190,65,22,${ca*.4})`);g.addColorStop(1,'rgba(7,3,10,0)');
      c.fillStyle=g;c.fillRect(0,0,W,H);
      g=c.createRadialGradient(W*.5,H*.5,H*.26,W*.5,H*.5,H*.96);
      g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.62)');
      c.fillStyle=g;c.fillRect(0,0,W,H);
    }

    /* Temple silhouettes */
    function dTemples(t:number){
      const fa=t<2.5?eOC(Math.min(t/2,1))*.28:.28;
      if(t>9) {
        const fo=Math.max(0,1-(t-9)/2);
        if(fo<=0)return;
      }
      const al=t>9?Math.max(0,.28-(t-9)*.14):fa;
      c.save();c.globalAlpha=al;c.fillStyle='#0e0718';
      const gops=[
        {cx:W*.1,bw:W*.1,bh:H*.28,ti:5},{cx:W*.18,bw:W*.065,bh:H*.2,ti:4},
        {cx:W*.83,bw:W*.09,bh:H*.25,ti:5},{cx:W*.92,bw:W*.055,bh:H*.18,ti:3},
        {cx:W*.5,bw:W*.045,bh:H*.12,ti:3},{cx:W*.38,bw:W*.04,bh:H*.1,ti:3},
        {cx:W*.62,bw:W*.04,bh:H*.1,ti:3},
      ];
      for(const g of gops){
        const by=H*.86;const th=g.bh/(g.ti+1);
        for(let i=0;i<g.ti;i++){
          const sh=1-(i/g.ti)*.55;const w=g.bw*sh;
          c.fillRect(g.cx-w/2,by-(i+1)*th,w,th+1);
        }
        const tw=g.bw*.28;const ty=by-g.ti*th;
        c.beginPath();c.moveTo(g.cx,ty-th*.7);c.lineTo(g.cx-tw/2,ty);c.lineTo(g.cx+tw/2,ty);c.closePath();c.fill();
      }
      c.fillRect(0,H*.86,W,H*.14);
      const gg=c.createLinearGradient(0,H*.84,0,H*.9);
      gg.addColorStop(0,'rgba(120,40,20,0)');gg.addColorStop(1,`rgba(120,40,20,${al*.3})`);
      c.fillStyle=gg;c.fillRect(0,H*.84,W,H*.06);
      c.restore();
    }

    /* Smoke */
    function sSmoke(){
      if(Math.random()>.2)return;
      const p=grab(pl);if(!p)return;
      p.x=W*.2+Math.random()*W*.6;p.y=H*.5+Math.random()*H*.3;
      p.vx=(Math.random()-.5)*.4;p.vy=-Math.random()*.6-.2;
      p.sz=Math.random()*50+20;p.ml=5+Math.random()*3;p.life=p.ml;
      p.r=150;p.g=95;p.b=65;p.a=.03+Math.random()*.02;
      p.rot=0;p.rs=0;p.on=true;p.tp=6;
    }
    function dSmoke(){
      for(const p of pl){if(!p.on||p.tp!==6)continue;
        const lr=p.life/p.ml;const a=p.a*(lr<.3?lr/.3:lr>.7?(1-lr)/.3:1);
        const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,Math.max(EP,p.sz));
        g.addColorStop(0,`rgba(${p.r},${p.g},${p.b},${a})`);g.addColorStop(1,`rgba(${p.r},${p.g},${p.b},0)`);
        c.fillStyle=g;c.fillRect(p.x-p.sz,p.y-p.sz,p.sz*2,p.sz*2);
      }
    }

    /* Phase 1: Streams */
    function sStreams(t:number){
      if(t>2.8)return;
      const prog=Math.min(t/2.5,1);
      for(let s=0;s<2;s++){
        const side=s===0?-1:1;
        const sx=s===0?-30:W+30;const ex=W*.5,ey=H*.43;
        for(let i=0;i<5;i++){
          const p=grab(pl);if(!p)break;
          const tt=Math.random()*prog;
          const cpx=side===-1?W*.16:W*.84;
          const cpy=H*.16+Math.sin(tt*Math.PI)*H*.14;
          const m=1-tt;
          p.x=m*m*sx+2*m*tt*cpx+tt*tt*ex+(Math.random()-.5)*40;
          p.y=m*m*(H*.52)+2*m*tt*cpy+tt*tt*ey+(Math.random()-.5)*40;
          p.vx=side*(Math.random()*2.5+.8);p.vy=(Math.random()-.5)*.5;
          p.sz=Math.random()*3.2+.7;p.ml=1.5+Math.random();p.life=p.ml;
          p.r=255;p.g=170+Math.random()*70|0;p.b=20+Math.random()*50|0;
          p.a=.5+Math.random()*.45;p.rot=0;p.rs=0;p.on=true;p.tp=1;
        }
      }
    }
    function dStreams(){
      for(const p of pl){if(!p.on||p.tp!==1)continue;
        const lr=p.life/p.ml;const a=p.a*Math.min(lr*3,1)*Math.min((1-lr)*3,1);
        c.beginPath();c.arc(p.x,p.y,Math.max(EP,p.sz),0,Math.PI*2);
        c.fillStyle=`rgba(${p.r},${p.g},${p.b},${a})`;c.fill();
        if(p.sz>1.6){const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,Math.max(EP,p.sz*3.5));
          g.addColorStop(0,`rgba(${p.r},${p.g},${p.b},${a*.22})`);g.addColorStop(1,`rgba(${p.r},${p.g},${p.b},0)`);
          c.fillStyle=g;c.fillRect(p.x-p.sz*3.5,p.y-p.sz*3.5,p.sz*7,p.sz*7);}
      }
    }

    /* Dust */
    function dDust(t:number){
      for(let i=0;i<dI.length;i++){
        const p=pl[dI[i]];
        p.x+=p.vx+Math.sin(t*.35+i)*.07;p.y+=p.vy;
        if(p.y<-12){p.y=H+12;p.x=Math.random()*W;}
        if(p.x<-12)p.x=W+12;if(p.x>W+12)p.x=-12;
        const fl=.6+Math.sin(t*1.6+i*.55)*.4;
        c.beginPath();c.arc(p.x,p.y,Math.max(EP,p.sz),0,Math.PI*2);
        c.fillStyle=`rgba(${p.r},${p.g},${p.b},${p.a*fl})`;c.fill();
      }
    }

    /* Phase 2: Ganesha outline */
    function dOutline(t:number){
      const ps=2.5,dur=3;
      const prog=eIO(Math.min((t-ps)/dur,1));
      const show=Math.floor(prog*gn);if(show<2)return;
      const sc=Math.min(W,H)*.56;const ox=(W-sc)/2,oy=(H-sc)/2-H*.015;
      c.save();c.lineCap='round';c.lineJoin='round';
      c.shadowColor='rgba(255,170,40,.6)';c.shadowBlur=22;
      c.strokeStyle=`rgba(255,190,65,.35)`;c.lineWidth=5.2;
      c.beginPath();c.moveTo(gp[0][0]*sc+ox,gp[0][1]*sc+oy);
      for(let i=1;i<show;i++)c.lineTo(gp[i][0]*sc+ox,gp[i][1]*sc+oy);c.stroke();
      c.shadowColor='rgba(255,210,85,.8)';c.shadowBlur=10;
      c.strokeStyle='rgba(255,225,130,.95)';c.lineWidth=2.4;
      c.beginPath();c.moveTo(gp[0][0]*sc+ox,gp[0][1]*sc+oy);
      for(let i=1;i<show;i++)c.lineTo(gp[i][0]*sc+ox,gp[i][1]*sc+oy);c.stroke();
      if(t-ps<dur&&show>0){
        const lp=gp[show-1];const lx=lp[0]*sc+ox,ly=lp[1]*sc+oy;
        const eg=c.createRadialGradient(lx,ly,0,lx,ly,Math.max(EP,20));
        eg.addColorStop(0,'rgba(255,255,190,.9)');eg.addColorStop(.35,'rgba(255,190,65,.4)');eg.addColorStop(1,'rgba(255,165,35,0)');
        c.fillStyle=eg;c.fillRect(lx-20,ly-20,40,40);
      }
      c.shadowBlur=0;
      for(let i=0;i<show;i+=4){const pt=gp[i];const sp=.22+Math.sin(t*3.2+i*.4)*.22;
        c.beginPath();c.arc(pt[0]*sc+ox,pt[1]*sc+oy,Math.max(EP,1.1),0,Math.PI*2);
        c.fillStyle=`rgba(255,232,165,${sp})`;c.fill();}
      c.restore();
    }

    /* Orbit particles */
    function sOrbit(t:number){
      if(t<3.5||t>11.5||Math.random()>.2)return;
      const p=grab(pl);if(!p)return;
      const sc=Math.min(W,H)*.56;const cx=W/2,cy=H/2-H*.015;
      const ang=Math.random()*Math.PI*2;const rad=sc*.38+Math.random()*sc*.08;
      p.x=cx+Math.cos(ang)*rad;p.y=cy+Math.sin(ang)*rad;
      p.vx=Math.cos(ang+Math.PI/2)*.65;p.vy=Math.sin(ang+Math.PI/2)*.65;
      p.sz=Math.random()*1.6+.4;p.ml=2+Math.random()*2;p.life=p.ml;
      p.r=255;p.g=200+Math.random()*50|0;p.b=65+Math.random()*55|0;
      p.a=.4+Math.random()*.35;p.rot=0;p.rs=0;p.on=true;p.tp=5;
    }
    function dOrbit(){
      for(const p of pl){if(!p.on||p.tp!==5)continue;
        const lr=p.life/p.ml;const a=p.a*Math.min(lr*2,1)*Math.min((1-lr)*2,1);
        c.beginPath();c.arc(p.x,p.y,Math.max(EP,p.sz),0,Math.PI*2);
        c.fillStyle=`rgba(${p.r},${p.g},${p.b},${a})`;c.fill();}
    }

    /* Phase 3: Divine energy */
    function dEnergy(t:number){
      if(t<5.5||t>9.5)return;
      const sc=Math.min(W,H)*.56;const cx=W/2,cy=H/2-H*.015;
      let ea=0;
      if(t<7.5)ea=Math.min((t-5.5)/2,1)*.14;
      else ea=.14*(1-Math.min((t-7.5)/2,1)*.5);
      const eg=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(EP,sc*.42));
      eg.addColorStop(0,`rgba(255,195,55,${ea})`);eg.addColorStop(.5,`rgba(255,140,35,${ea*.4})`);eg.addColorStop(1,'rgba(255,100,20,0)');
      c.fillStyle=eg;c.fillRect(0,0,W,H);
    }

    /* Phase 3: Bells */
    function dBells(t:number){
      const bs=5.5;
      if(t<bs)return;
      let ba=Math.min((t-bs)/.6,1);
      if(t>8)ba=Math.max(0,1-(t-8)/.6);
      if(ba<=0)return;
      const bsz=Math.min(W,H)*.11;
      const b1x=W*.28,b2x=W*.72,by=H*.04;
      const a1=.28*Math.sin(t*2.6)*ba;
      const a2=.24*Math.sin(t*2.9+1.6)*ba;
      drawBell(b1x,by,bsz,a1,ba);
      drawBell(b2x,by,bsz,a2,ba);
    }
    function drawBell(ax:number,ay:number,s:number,ang:number,al:number){
      c.save();c.globalAlpha=al;c.translate(ax,ay);c.rotate(ang);
      c.strokeStyle='#7a6535';c.lineWidth=1.2;
      for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,s*.08*(i+1),s*.028,s*.045,0,0,Math.PI*2);c.stroke();}
      const ty=s*.32,by=s,tw=s*.11,bw=s*.34;
      c.beginPath();c.moveTo(-tw,ty);
      c.bezierCurveTo(-tw,ty+s*.2,-bw*.82,ty+s*.4,-bw,by);
      c.lineTo(bw,by);
      c.bezierCurveTo(bw*.82,ty+s*.4,tw,ty+s*.2,tw,ty);
      c.closePath();
      const bg=c.createLinearGradient(-bw,0,bw,0);
      bg.addColorStop(0,'#523e10');bg.addColorStop(.25,'#9a7520');bg.addColorStop(.45,'#c9a030');
      bg.addColorStop(.55,'#dab540');bg.addColorStop(.75,'#9a7520');bg.addColorStop(1,'#523e10');
      c.fillStyle=bg;c.fill();
      c.beginPath();c.moveTo(-tw*.25,ty+s*.05);
      c.bezierCurveTo(-tw*.25,ty+s*.2,-bw*.22,ty+s*.4,-bw*.22,by-s*.04);
      c.lineTo(-bw*.1,by-s*.04);
      c.bezierCurveTo(-bw*.1,ty+s*.4,-tw*.1,ty+s*.2,-tw*.1,ty+s*.05);
      c.closePath();c.fillStyle='rgba(255,228,165,.12)';c.fill();
      c.beginPath();c.moveTo(-bw,by);c.lineTo(bw,by);
      c.strokeStyle='#dab540';c.lineWidth=1.8;c.stroke();
      const rg=c.createRadialGradient(0,by,0,0,by,Math.max(EP,s*.3));
      rg.addColorStop(0,'rgba(255,195,65,.15)');rg.addColorStop(1,'rgba(255,195,65,0)');
      c.fillStyle=rg;c.fillRect(-s*.3,by-s*.3,s*.6,s*.6);
      c.beginPath();c.arc(0,by-s*.06,s*.035,0,Math.PI*2);c.fillStyle='#3e2e0c';c.fill();
      c.restore();
    }

    /* Phase 3: Aarti */
    function dAarti(t:number){
      const as=5.5;
      if(t<as)return;
      let aa=Math.min((t-as)/.6,1);
      if(t>7.8)aa=Math.max(0,1-(t-7.8)/.4);
      if(aa<=0)return;
      const sc=Math.min(W,H)*.56;const cx=W/2,cy=H/2-H*.015;
      const orad=sc*.44;const ang=(t-as)*Math.PI*1.3;
      const ax=cx+Math.cos(ang)*orad;const ay=cy+Math.sin(ang)*orad*.52;
      for(let i=1;i<18;i++){
        const ta=ang-i*.045;const tx=cx+Math.cos(ta)*orad;const ty=cy+Math.sin(ta)*orad*.52;
        const tla=(1-i/18)*.12*aa;
        const tg=c.createRadialGradient(tx,ty,0,tx,ty,Math.max(EP,10));
        tg.addColorStop(0,`rgba(255,175,45,${tla})`);tg.addColorStop(1,'rgba(255,140,30,0)');
        c.fillStyle=tg;c.fillRect(tx-10,ty-10,20,20);
      }
      c.save();c.globalAlpha=aa;c.translate(ax,ay);
      c.beginPath();c.ellipse(0,0,11,4.5,0,0,Math.PI*2);
      c.fillStyle='#b8942e';c.fill();c.strokeStyle='#7a6520';c.lineWidth=.8;c.stroke();
      const fk=1+Math.sin(t*13)*.14+Math.sin(t*19)*.09;const fh=17*fk;
      c.beginPath();c.moveTo(0,-2);
      c.bezierCurveTo(-5.5,-fh*.4,-4.5,-fh*.8,0,-fh);
      c.bezierCurveTo(4.5,-fh*.8,5.5,-fh*.4,0,-2);
      c.fillStyle='rgba(255,135,18,.68)';c.fill();
      c.beginPath();c.moveTo(0,-2);
      c.bezierCurveTo(-2.8,-fh*.32,-2.2,-fh*.58,0,-fh*.68);
      c.bezierCurveTo(2.2,-fh*.58,2.8,-fh*.32,0,-2);
      c.fillStyle='rgba(255,218,95,.88)';c.fill();
      c.beginPath();c.moveTo(0,-2);
      c.bezierCurveTo(-1.2,-fh*.18,-.8,-fh*.32,0,-fh*.38);
      c.bezierCurveTo(.8,-fh*.32,1.2,-fh*.18,0,-2);
      c.fillStyle='rgba(255,252,218,.92)';c.fill();
      const fg=c.createRadialGradient(0,-fh*.28,0,0,-fh*.28,Math.max(EP,32));
      fg.addColorStop(0,'rgba(255,175,48,.22)');fg.addColorStop(.5,'rgba(255,135,28,.06)');fg.addColorStop(1,'rgba(255,95,18,0)');
      c.fillStyle=fg;c.fillRect(-32,-fh-14,64,fh+42);
      c.restore();
    }

    /* Phase 4: Bloom */
    function dBloom(t:number){
      const bs=7.5;const bt=Math.min((t-bs)/1.4,1);if(bt<=0)return;
      const sc=Math.min(W,H)*.56;const cx=W/2,cy=H/2-H*.015;const maxR=sc*.88;
      const r=maxR*eOQ(bt);
      const ra=(1-bt)*.4;
      c.save();c.beginPath();c.arc(cx,cy,Math.max(EP,r),0,Math.PI*2);
      c.strokeStyle=`rgba(255,190,65,${ra})`;c.lineWidth=3.5*(1-bt);c.stroke();c.restore();
      const ba=(1-bt*.65)*.16;
      const bg=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(EP,r));
      bg.addColorStop(0,`rgba(255,190,65,${ba})`);bg.addColorStop(.5,`rgba(255,140,42,${ba*.4})`);bg.addColorStop(1,'rgba(255,95,22,0)');
      c.fillStyle=bg;c.fillRect(0,0,W,H);
      if(bt<.45&&Math.random()<.6){const p=grab(pl);if(p){
        const ang=Math.random()*Math.PI*2;const spd=2.2+Math.random()*4.8;
        p.x=cx;p.y=cy;p.vx=Math.cos(ang)*spd;p.vy=Math.sin(ang)*spd;
        p.sz=Math.random()*3+.8;p.ml=1.3+Math.random();p.life=p.ml;
        p.r=255;p.g=180+Math.random()*60|0;p.b=40+Math.random()*55|0;
        p.a=.6;p.rot=0;p.rs=0;p.on=true;p.tp=3;
      }}
    }
    function dBloomP(){
      for(const p of pl){if(!p.on||p.tp!==3)continue;
        const lr=p.life/p.ml;const a=p.a*lr;
        c.beginPath();c.arc(p.x,p.y,Math.max(EP,p.sz*(1+(1-lr)*.4)),0,Math.PI*2);
        c.fillStyle=`rgba(${p.r},${p.g},${p.b},${a})`;c.fill();}
    }

    /* Phase 4: Petals */
    function sPetals(t:number){
      if(t<7.8||Math.random()>.3)return;
      const p=grab(pl);if(!p)return;
      p.x=Math.random()*W;p.y=-24-Math.random()*60;
      p.vx=(Math.random()-.5)*1.5;p.vy=1.5+Math.random()*2.2;
      p.sz=4.5+Math.random()*6.5;p.ml=7+Math.random()*3;p.life=p.ml;
      const ct=Math.random();
      if(ct<.35){p.r=255;p.g=128;p.b=0;}
      else if(ct<.65){p.r=255;p.g=182;p.b=22;}
      else{p.r=255;p.g=215;p.b=42;}
      p.a=.5+Math.random()*.3;p.rot=Math.random()*Math.PI*2;
      p.rs=(Math.random()-.5)*.04;p.on=true;p.tp=4;
    }
    function dPetals(){
      for(const p of pl){if(!p.on||p.tp!==4)continue;
        const lr=p.life/p.ml;const a=p.a*Math.min(lr*2,1)*(lr>.82?(1-lr)/.18:1);
        c.save();c.translate(p.x,p.y);c.rotate(p.rot);
        c.beginPath();c.ellipse(0,0,Math.max(EP,p.sz*.36),Math.max(EP,p.sz),0,0,Math.PI*2);
        c.fillStyle=`rgba(${p.r},${p.g},${p.b},${a})`;c.fill();
        c.beginPath();c.ellipse(-p.sz*.07,-p.sz*.2,Math.max(EP,p.sz*.1),Math.max(EP,p.sz*.32),0,0,Math.PI*2);
        c.fillStyle=`rgba(255,255,210,${a*.25})`;c.fill();
        c.restore();}
    }

    /* Phase 4: Kumkum / Akshat */
    function sKum(t:number){
      if(t<7.8||Math.random()>.3)return;
      const p=grab(pl);if(!p)return;
      p.x=Math.random()*W;p.y=-12-Math.random()*35;
      p.vx=(Math.random()-.5)*.6;p.vy=.45+Math.random()*1.3;
      p.sz=.8+Math.random()*2;p.ml=5.5+Math.random()*3;p.life=p.ml;
      if(Math.random()<.45){p.r=190+Math.random()*60|0;p.g=15+Math.random()*28|0;p.b=15+Math.random()*28|0;}
      else{p.r=255;p.g=222+Math.random()*30|0;p.b=140+Math.random()*55|0;}
      p.a=.4+Math.random()*.38;p.rot=Math.random()*Math.PI*2;
      p.rs=(Math.random()-.5)*.06;p.on=true;p.tp=8;
    }
    function dKum(){
      for(const p of pl){if(!p.on||p.tp!==8)continue;
        const lr=p.life/p.ml;const a=p.a*Math.min(lr*2,1)*(lr>.84?(1-lr)/.16:1);
        c.save();c.translate(p.x,p.y);c.rotate(p.rot);
        c.fillStyle=`rgba(${p.r},${p.g},${p.b},${a})`;
        c.fillRect(-p.sz*.5,-p.sz*.2,p.sz,p.sz*.4);c.restore();}
    }

    /* Phase 4: Light rays */
    function dRays(t:number){
      if(t<7.5)return;
      const rt=Math.min((t-7.5)/2,1);
      const al=eOC(rt)*.09;
      const cx=W/2,cy=H/2-H*.015;const rl=Math.max(W,H)*.85;
      c.save();c.globalAlpha=al;const nr=16;
      for(let i=0;i<nr;i++){
        const ang=(i/nr)*Math.PI*2+t*.035;const hw=(Math.PI/nr)*.36;
        c.beginPath();c.moveTo(cx,cy);
        c.lineTo(cx+Math.cos(ang-hw)*rl,cy+Math.sin(ang-hw)*rl);
        c.lineTo(cx+Math.cos(ang+hw)*rl,cy+Math.sin(ang+hw)*rl);
        c.closePath();
        const rg=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(EP,rl));
        rg.addColorStop(0,'rgba(255,190,65,.7)');rg.addColorStop(.5,'rgba(255,150,42,.2)');rg.addColorStop(1,'rgba(255,110,22,0)');
        c.fillStyle=rg;c.fill();
      }
      c.restore();
    }

    /* Phase 5: Dissolve */
    function dDissolve(t:number){
      const ps=9.5;const dt=Math.min((t-ps)/1.8,1);if(dt<=0)return;
      const sc=Math.min(W,H)*.56;const ox=(W-sc)/2,oy=(H-sc)/2-H*.015;
      const oa=Math.max(0,1-dt*1.7);
      if(oa>0){c.save();c.globalAlpha=oa;
        c.shadowColor=`rgba(255,190,65,${oa*.5})`;c.shadowBlur=20;
        c.strokeStyle=`rgba(255,215,105,${oa*.72})`;c.lineWidth=2;c.lineCap='round';c.lineJoin='round';
        c.beginPath();c.moveTo(gp[0][0]*sc+ox,gp[0][1]*sc+oy);
        for(let i=1;i<gn;i++)c.lineTo(gp[i][0]*sc+ox,gp[i][1]*sc+oy);c.stroke();c.restore();}
      const la=eOC(dt)*.12;
      const lg=c.createRadialGradient(W/2,H/2-H*.015,0,W/2,H/2-H*.015,Math.max(EP,sc*.3));
      lg.addColorStop(0,`rgba(255,220,135,${la})`);lg.addColorStop(.5,`rgba(255,170,42,${la*.4})`);lg.addColorStop(1,'rgba(255,140,22,0)');
      c.fillStyle=lg;c.fillRect(0,0,W,H);
    }

    /* Phase 5: Text */
    function dText(t:number){
      const ps=9.5;const ft=Math.min((t-ps)/1.3,1);if(ft<=0)return;
      const fi=eOC(ft);const ty=H*.35;
      c.save();c.globalAlpha=fi;c.textAlign='center';c.textBaseline='middle';
      const ts=Math.min(W*.058,H*.065,50);
      c.font=`700 ${ts}px 'Georgia','Times New Roman',serif`;
      const tw=c.measureText('Happy Ganesh Chaturthi').width;
      c.strokeStyle='rgba(60,35,6,.38)';c.lineWidth=3.5;
      c.shadowColor='rgba(255,190,42,.45)';c.shadowBlur=20;
      c.strokeText('Happy Ganesh Chaturthi',W/2,ty);
      const mg=c.createLinearGradient(W/2-tw/2,0,W/2+tw/2,0);
      mg.addColorStop(0,'#5a4210');mg.addColorStop(.15,'#b08018');mg.addColorStop(.32,'#d4a020');
      mg.addColorStop(.48,'#ffd700');mg.addColorStop(.52,'#fffacd');mg.addColorStop(.68,'#ffd700');
      mg.addColorStop(.84,'#d4a020');mg.addColorStop(1,'#5a4210');
      c.fillStyle=mg;c.shadowBlur=16;c.fillText('Happy Ganesh Chaturthi',W/2,ty);
      const sp=(Math.sin(t*2.2)+1)/2;
      const sg=c.createLinearGradient(W/2-tw*.6,0,W/2+tw*.6,0);
      const s0=Math.max(0,sp-.12),s1=Math.max(0,sp-.04),s2=Math.min(1,sp+.04),s3=Math.min(1,sp+.12);
      sg.addColorStop(s0,'rgba(255,255,232,0)');sg.addColorStop(s1,'rgba(255,255,232,.1)');
      sg.addColorStop(sp,'rgba(255,255,232,.18)');sg.addColorStop(s2,'rgba(255,255,232,.1)');
      sg.addColorStop(s3,'rgba(255,255,232,0)');
      c.shadowBlur=0;c.fillStyle=sg;c.fillText('Happy Ganesh Chaturthi',W/2,ty);
      const ss=Math.min(W*.024,H*.028,19);
      c.font=`400 ${ss}px 'Nirmala UI','Devanagari Sangam MN','Mangal','Segoe UI',sans-serif`;
      c.shadowColor='rgba(255,170,42,.22)';c.shadowBlur=10;
      const shg=c.createLinearGradient(W/2-ss*10,0,W/2+ss*10,0);
      shg.addColorStop(0,'#856314');shg.addColorStop(.25,'#d4a020');shg.addColorStop(.5,'#ffd700');
      shg.addColorStop(.75,'#d4a020');shg.addColorStop(1,'#856314');
      c.fillStyle=shg;
      const l1y=ty+ts*1.3;const l2y=l1y+ss*2.1;
      c.fillText('वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।',W/2,l1y);
      c.fillText('निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',W/2,l2y);
      c.fillStyle=sg;c.shadowBlur=0;
      c.fillText('वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।',W/2,l1y);
      c.fillText('निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',W/2,l2y);
      c.restore();
    }

    /* Final: Blessing wave */
    function dWave(t:number){
      const ws=11;const wt=Math.min((t-ws)/.7,1);if(wt<=0)return;
      const cx=W/2,cy=H/2;const maxR=Math.max(W,H)*.95;
      const r=maxR*eOE(wt);const al=(1-wt)*.35;
      c.save();c.beginPath();c.arc(cx,cy,Math.max(EP,r),0,Math.PI*2);
      c.strokeStyle=`rgba(255,195,65,${al})`;c.lineWidth=4*(1-wt);c.stroke();c.restore();
      const inner=Math.max(EP,r-18);const outer=Math.max(inner+EP,r+18);
      const wg=c.createRadialGradient(cx,cy,inner,cx,cy,outer);
      wg.addColorStop(0,'rgba(255,195,65,0)');wg.addColorStop(.4,`rgba(255,195,65,${al*.4})`);
      wg.addColorStop(.6,`rgba(255,195,65,${al*.4})`);wg.addColorStop(1,'rgba(255,195,65,0)');
      c.fillStyle=wg;c.fillRect(0,0,W,H);
      if(wt<.7){for(let i=0;i<12;i++){
        const ang=(i/12)*Math.PI*2+t*.5;
        const sx=cx+Math.cos(ang)*r;const sy=cy+Math.sin(ang)*r;
        const sa=(1-wt/.7)*.5;
        c.beginPath();c.arc(sx,sy,Math.max(EP,2*(1-wt)),0,Math.PI*2);
        c.fillStyle=`rgba(255,235,170,${sa})`;c.fill();
      }}
    }

    /* Final: Fade out */
    function dFade(t:number){
      const fs=11.3;const ft=Math.min((t-fs)/.7,1);if(ft<=0)return;
      const fa=eIQ(ft);
      c.fillStyle=`rgba(15,8,3,${fa})`;c.fillRect(0,0,W,H);
      if(ft<.72){const ga=(1-ft/.72)*.22;
        const gg=c.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(EP,H*.4));
        gg.addColorStop(0,`rgba(255,190,65,${ga})`);gg.addColorStop(1,'rgba(255,140,22,0)');
        c.fillStyle=gg;c.fillRect(0,0,W,H);}
    }

    /* ───────── UPDATE ───────── */
    function upd(dt:number){
      for(const p of pl){
        if(!p.on||p.tp===0)continue;
        p.x+=p.vx;p.y+=p.vy;p.life-=dt;p.rot+=p.rs;
        switch(p.tp){
          case 1:p.vx*=.99;p.vy*=.99;break;
          case 3:p.vx*=.97;p.vy*=.97;break;
          case 4:p.vx+=Math.sin(p.y*.018+p.rot)*.016;p.vy*=.999;break;
          case 5:p.vx*=.98;p.vy*=.98;break;
          case 6:p.vx*=.995;p.vy*=.998;p.sz+=.3;break;
          case 8:p.vx+=(Math.random()-.5)*.016;break;
        }
        if(p.life<=0||p.y>H+60||p.x<-120||p.x>W+120)p.on=false;
      }
    }

    /* ───────── MAIN LOOP ───────── */
    let lt=0;
    const loop=(ts:number)=>{
      if(!t0.current){t0.current=ts;lt=ts;}
      const t=(ts-t0.current)/1000;const dt=Math.min((ts-lt)/1000,.05);lt=ts;

      dBg(t);
      dTemples(t);
      dSmoke();
      dRays(t);
      dStreams();
      dOutline(t);
      dEnergy(t);
      dAarti(t);
      dBells(t);

      // 🚀 NEW: 5.5s के बाद रंगीन बाल गणेश (Detailed Colored Mascot) प्रकट होंगे
      if(t >= 5.5 && t < 9.5) {
        const coloredGaneshaFade = Math.min((t - 5.5) / 1.2, 1.0);
        const gScale = Math.min(W,H) * 0.02; // सही स्केलिंग के लिए
        drawDetailedGanesha(W/2, H/2-H*.015, gScale * (1 + Math.sin(t*2.5)*0.015), coloredGaneshaFade);
      }

      dBloom(t);
      dBloomP();
      dPetals();
      dKum();
      dOrbit();
      dDissolve(t);
      dText(t);
      dWave(t);
      dFade(t);
      dDust(t);

      /* spawners */
      if(t<2.8)sStreams(t);
      sSmoke();
      sOrbit(t);
      if(t>7.8){sPetals(t);sKum(t);}

      upd(dt);

      if(t<DUR+.15){raf.current=requestAnimationFrame(loop);}
      else if(!done.current){done.current=true;cbR.current?.();}
    };
    raf.current=requestAnimationFrame(loop);

    return ()=>{cancelAnimationFrame(raf.current);window.removeEventListener('resize',rsz);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  return(
    <div className="fixed inset-0 z-[9999]" style={{background:'#07030a'}}>
      <canvas ref={cvRef} className="block w-full h-full"/>
    </div>
  );
}
