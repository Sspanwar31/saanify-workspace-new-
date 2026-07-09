'use client';

import React, { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface Props { onComplete: () => void; }

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; life: number; maxLife: number;
  color: string; type: 'dust' | 'sunlight' | 'trail' | 'sparkle' | 'haze';
}
interface Star { x: number; y: number; sz: number; ba: number; ts: number; to: number; }
interface CBlob { ox: number; oy: number; rx: number; ry: number; }
interface Cloud { x: number; y: number; w: number; h: number; d: number; sp: number; a: number; bl: CBlob[]; }
interface Kite {
  x: number; y: number; vx: number; sz: number; d: number;
  c1: string; c2: string; c3: string;
  fp: number; fs: number; sp: number; ss: number; sa: number;
  bp: number; bs: number; ba: number;
  ax: number; ay: number; at: number; on: boolean; hero: boolean;
}
interface Bird { x: number; y: number; vx: number; sz: number; wp: number; ws: number; a: number; at: number; }

/* ═══════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════ */

const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
const eIOC = (t: number) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const eOE = (t: number) => t===1?1:1-Math.pow(2,-10*t);
const eIQ = (t: number) => t*t;
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const l3 = (a: number[], b: number[], t: number) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const rs = (c: number[], a = 1) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

/* ═══════════════════════════════════════════════════════════
   PARTICLE ENGINE
   ═══════════════════════════════════════════════════════════ */

class PEngine {
  private p: Particle[] = [];
  private mx = 1500;
  spawn(o: Partial<Particle> & { type: Particle['type'] }) {
    if (this.p.length >= this.mx) return;
    this.p.push({ x:0,y:0,vx:0,vy:0,size:1,alpha:1,life:0,maxLife:100,color:'#fff',...o });
  }
  update(dt: number) {
    const f = dt/16.67; let a = 0;
    for (let i = 0; i < this.p.length; i++) {
      const q = this.p[i]; q.life += f;
      if (q.life >= q.maxLife) continue;
      q.x += q.vx*f; q.y += q.vy*f;
      if (q.type==='dust') { q.vx += Math.sin(q.life*.02+q.x*.01)*.005*f; q.alpha = (1-q.life/q.maxLife)*.25; }
      else if (q.type==='sunlight') { q.vy -= .01*f; q.alpha = (1-q.life/q.maxLife)*.4; }
      else if (q.type==='trail') { q.vx *= .98; q.vy *= .99; q.alpha = (1-q.life/q.maxLife)*.7; }
      else if (q.type==='sparkle') { q.vy += .02*f; q.alpha = (1-q.life/q.maxLife); }
      else if (q.type==='haze') { q.vx += Math.sin(q.life*.005)*.002*f; q.alpha = (1-q.life/q.maxLife)*.08; }
      this.p[a++] = q;
    }
    this.p.length = a;
  }
  draw(ctx: CanvasRenderingContext2D) {
    for (const q of this.p) {
      ctx.save(); ctx.globalAlpha = cl(q.alpha,0,1);
      if (q.type==='haze') {
        const g = ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,q.size);
        g.addColorStop(0,'rgba(255,230,180,0.3)'); g.addColorStop(1,'rgba(255,230,180,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(q.x,q.y,q.size,0,Math.PI*2); ctx.fill();
      } else if (q.type==='trail'||q.type==='sparkle') {
        ctx.fillStyle=q.color; ctx.shadowColor=q.color; ctx.shadowBlur=q.size*4;
        ctx.beginPath(); ctx.arc(q.x,q.y,q.size,0,Math.PI*2); ctx.fill();
      } else if (q.type==='sunlight') {
        ctx.fillStyle=q.color; ctx.shadowColor=q.color; ctx.shadowBlur=q.size*2;
        ctx.beginPath(); ctx.arc(q.x,q.y,q.size,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle=q.color; ctx.beginPath(); ctx.arc(q.x,q.y,q.size,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }
  get count() { return this.p.length; }
}

/* ═══════════════════════════════════════════════════════════
   GENERATORS
   ═══════════════════════════════════════════════════════════ */

const KC=[['#E63946','#F4A261','#E9C46A'],['#2A9D8F','#E9C46A','#264653'],['#9B5DE5','#F15BB5','#FEE440'],['#00BBF9','#00F5D4','#FEE440'],['#FF006E','#FB5607','#FFBE0B'],['#3A86FF','#8338EC','#FF006E'],['#06D6A0','#118AB2','#073B4C'],['#EF476F','#FFD166','#06D6A0'],['#FF9F1C','#FFBF69','#CBF3F0'],['#D62828','#F77F00','#FCBF49'],['#7209B7','#B5179E','#F72585'],['#4CC9F0','#4361EE','#3A0CA3']];

function mkStars(w:number,h:number):Star[]{return Array.from({length:220},()=>({x:Math.random()*w,y:Math.random()*h*.72,sz:.3+Math.random()*1.5,ba:.3+Math.random()*.7,ts:1+Math.random()*3,to:Math.random()*6.28}));}

function mkClouds(w:number,h:number):Cloud[]{return Array.from({length:14},()=>{const d=.15+Math.random()*.85,cw=100+Math.random()*280*d,ch=28+Math.random()*55*d;return{x:Math.random()*(w+600)-300,y:h*.06+Math.random()*h*.38,w:cw,h:ch,d,sp:(.06+Math.random()*.2)*d,a:.1+d*.2,bl:Array.from({length:3+Math.floor(Math.random()*4)},()=>({ox:(Math.random()-.5)*cw*.6,oy:(Math.random()-.5)*ch*.4,rx:cw*(.2+Math.random()*.35),ry:ch*(.3+Math.random()*.5)}))};}).sort((a,b)=>a.d-b.d);}

function mkKites(w:number,h:number):Kite[]{const k:Kite[]=[];for(let i=0;i<28;i++){const d=.12+Math.random()*.88,c=KC[Math.floor(Math.random()*KC.length)],dir=Math.random()>.5?1:-1;k.push({x:Math.random()*w,y:h*.1+Math.random()*h*.44,vx:(.12+Math.random()*.4)*d*dir,sz:12+d*34,d,c1:c[0],c2:c[1],c3:c[2],fp:Math.random()*6.28,fs:3+Math.random()*4,sp:Math.random()*6.28,ss:.4+Math.random()*1.2,sa:6+Math.random()*18,bp:Math.random()*6.28,bs:.5+Math.random()*1,ba:3+Math.random()*10,ax:Math.random()*w,ay:h*.82+Math.random()*h*.18,at:6.5+Math.random()*2.5,on:false,hero:false});}return k.sort((a,b)=>a.d-b.d);}

function mkBirds(w:number,h:number):Bird[]{return Array.from({length:6},()=>({x:-60-Math.random()*250,y:h*.08+Math.random()*h*.22,vx:.7+Math.random()*1.4,sz:3+Math.random()*4,wp:Math.random()*6.28,ws:4+Math.random()*3,a:.15+Math.random()*.25,at:5+Math.random()*2}));}

/* ═══════════════════════════════════════════════════════════
   DRAWING — SKY
   ═══════════════════════════════════════════════════════════ */

function drawSky(ctx:CanvasRenderingContext2D,w:number,h:number,t:number){
  const nT=[5,5,18],nB=[10,10,28];
  const dT=[18,22,55],dB=[45,55,85];
  const sT=[30,48,100],sB=[130,85,55];
  const yT=[50,95,175],yB=[190,150,105];
  let top:number[],bot:number[];
  if(t<1.5){top=nT;bot=nB;}
  else if(t<3){const p=eOC(cl((t-1.5)/1.5,0,1));top=l3(nT,dT,p);bot=l3(nB,dB,p);}
  else if(t<5.5){const p=eOC(cl((t-3)/2.5,0,1));top=l3(dT,sT,p);bot=l3(dB,sB,p);}
  else if(t<7.5){const p=eOC(cl((t-5.5)/2,0,1));top=l3(sT,yT,p);bot=l3(sB,yB,p);}
  else{top=yT;bot=yB;}
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,rs(top));g.addColorStop(1,rs(bot));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(t>2.2){const ha=eOC(cl((t-2.2)/3.5,0,1))*.55;const hg=ctx.createRadialGradient(w*.5,h*.97,0,w*.5,h*.97,w*.85);hg.addColorStop(0,`rgba(255,175,70,${ha})`);hg.addColorStop(.3,`rgba(255,135,45,${ha*.45})`);hg.addColorStop(.6,`rgba(200,95,45,${ha*.12})`);hg.addColorStop(1,'rgba(200,95,45,0)');ctx.fillStyle=hg;ctx.fillRect(0,0,w,h);}
  if(t>4){const sa=eOC(cl((t-4)/3,0,1))*.18;const sg=ctx.createLinearGradient(0,h*.55,0,h);sg.addColorStop(0,'rgba(100,150,220,0)');sg.addColorStop(.5,`rgba(160,185,235,${sa*.3})`);sg.addColorStop(1,`rgba(210,185,150,${sa})`);ctx.fillStyle=sg;ctx.fillRect(0,h*.55,w,h*.45);}
  // Vignette
  const vg=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.25,w/2,h/2,Math.max(w,h)*.85);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.35)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
}

/* ═══════════════════════════════════════════════════════════
   DRAWING — STARS
   ═══════════════════════════════════════════════════════════ */

function drawStars(ctx:CanvasRenderingContext2D,stars:Star[],t:number){
  const sa=t<2?1:t<5.5?1-eOC((t-2)/3.5):0;if(sa<=0)return;
  for(const s of stars){const tw=.5+.5*Math.sin(t*s.ts+s.to);const a=s.ba*tw*sa;if(a<.01)continue;ctx.fillStyle=`rgba(255,255,245,${a})`;ctx.beginPath();ctx.arc(s.x,s.y,s.sz,0,Math.PI*2);ctx.fill();if(s.sz>1.1){const gg=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.sz*3);gg.addColorStop(0,`rgba(200,220,255,${a*.25})`);gg.addColorStop(1,'rgba(200,220,255,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(s.x,s.y,s.sz*3,0,Math.PI*2);ctx.fill();}}
}

/* ═══════════════════════════════════════════════════════════
   DRAWING — SUN
   ═══════════════════════════════════════════════════════════ */

function drawSun(ctx:CanvasRenderingContext2D,w:number,h:number,t:number){
  if(t<3)return;const sp=eOC(cl((t-3)/4,0,1));const sx=w*.5,sy=h*.97-sp*h*.42,sr=28+sp*16;
  // Outer atmospheric
  const o=ctx.createRadialGradient(sx,sy,0,sx,sy,sr*16);o.addColorStop(0,`rgba(255,200,100,${sp*.07})`);o.addColorStop(.3,`rgba(255,175,75,${sp*.03})`);o.addColorStop(1,'rgba(255,150,50,0)');ctx.fillStyle=o;ctx.fillRect(0,0,w,h);
  // Mid
  const m=ctx.createRadialGradient(sx,sy,0,sx,sy,sr*7);m.addColorStop(0,`rgba(255,220,150,${sp*.18})`);m.addColorStop(.4,`rgba(255,180,80,${sp*.07})`);m.addColorStop(1,'rgba(255,150,50,0)');ctx.fillStyle=m;ctx.beginPath();ctx.arc(sx,sy,sr*7,0,Math.PI*2);ctx.fill();
  // Inner
  const i=ctx.createRadialGradient(sx,sy,0,sx,sy,sr*2.8);i.addColorStop(0,`rgba(255,250,225,${sp*.55})`);i.addColorStop(.3,`rgba(255,220,150,${sp*.28})`);i.addColorStop(.7,`rgba(255,180,80,${sp*.08})`);i.addColorStop(1,'rgba(255,150,50,0)');ctx.fillStyle=i;ctx.beginPath();ctx.arc(sx,sy,sr*2.8,0,Math.PI*2);ctx.fill();
  // Disc
  const dg=ctx.createRadialGradient(sx-sr*.2,sy-sr*.2,0,sx,sy,sr);dg.addColorStop(0,`rgba(255,255,242,${sp})`);dg.addColorStop(.5,`rgba(255,242,205,${sp})`);dg.addColorStop(.8,`rgba(255,215,145,${sp})`);dg.addColorStop(1,`rgba(255,185,85,${sp*.8})`);ctx.fillStyle=dg;ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();
  // Corona pulse
  const pu=.94+.06*Math.sin(t*2);const cg=ctx.createRadialGradient(sx,sy,sr*.85,sx,sy,sr*1.6*pu);cg.addColorStop(0,'rgba(255,240,200,0)');cg.addColorStop(.5,`rgba(255,220,150,${sp*.12})`);cg.addColorStop(1,'rgba(255,200,100,0)');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(sx,sy,sr*1.6*pu,0,Math.PI*2);ctx.fill();
}

/* ═══════════════════════════════════════════════════════════
   DRAWING — CLOUDS
   ═══════════════════════════════════════════════════════════ */

function drawClouds(ctx:CanvasRenderingContext2D,clouds:Cloud[],t:number,w:number){
  if(t<4.5)return;const ca=eOC(cl((t-4.5)/2,0,1));
  for(const c of clouds){c.x+=c.sp;if(c.x-c.w>w+150)c.x=-c.w-150;const a=c.a*ca;if(a<.005)continue;ctx.save();ctx.globalAlpha=a;for(const b of c.bl){const bx=c.x+b.ox,by=c.y+b.oy,rr=Math.max(b.rx,b.ry);const g=ctx.createRadialGradient(bx,by,0,bx,by,rr);g.addColorStop(0,'rgba(255,255,255,0.55)');g.addColorStop(.5,'rgba(242,242,252,0.25)');g.addColorStop(1,'rgba(235,238,248,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(bx,by,b.rx,b.ry,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
}

/* ═══════════════════════════════════════════════════════════
   DRAWING — BIRDS
   ═══════════════════════════════════════════════════════════ */

function drawBirds(ctx:CanvasRenderingContext2D,birds:Bird[],t:number,w:number){
  for(const b of birds){if(t<b.at)continue;b.x+=b.vx;if(b.x>w+100){b.x=-60;b.y=Math.random()*200+50;}const wg=Math.sin(t*b.ws+b.wp)*b.sz;ctx.strokeStyle=`rgba(25,25,35,${b.a})`;ctx.lineWidth=1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-b.sz,b.y+wg);ctx.quadraticCurveTo(b.x-b.sz*.3,b.y-Math.abs(wg)*.3,b.x,b.y);ctx.quadraticCurveTo(b.x+b.sz*.3,b.y-Math.abs(wg)*.3,b.x+b.sz,b.y+wg);ctx.stroke();}
}

/* ═══════════════════════════════════════════════════════════
   DRAWING — KITE
   ═══════════════════════════════════════════════════════════ */

function drawKite(ctx:CanvasRenderingContext2D,k:Kite,t:number){
  if(!k.on)return;
  const fl=Math.sin(t*k.fs+k.fp)*.18+Math.sin(t*k.fs*1.7+k.fp*.5)*.09;
  const sw=Math.sin(t*k.ss+k.sp)*k.sa;
  const bob=Math.sin(t*k.bs+k.bp)*k.ba;
  const dx=k.x+sw,dy=k.y+bob,s=k.sz;
  ctx.save();ctx.translate(dx,dy);ctx.rotate(fl*.5+Math.sin(t*.8+k.fp)*.08);
  const bulge=fl*.3;
  // Left half
  ctx.beginPath();ctx.moveTo(0,-s*.65);ctx.quadraticCurveTo(-s*.25-bulge*s,-s*.35,-s*.4,0);ctx.quadraticCurveTo(-s*.25-bulge*s*.5,s*.25,0,s*.5);ctx.closePath();
  const lg=ctx.createLinearGradient(-s*.4,-s*.65,0,s*.5);lg.addColorStop(0,k.c1);lg.addColorStop(1,k.c2);ctx.fillStyle=lg;ctx.fill();
  // Right half
  ctx.beginPath();ctx.moveTo(0,-s*.65);ctx.quadraticCurveTo(s*.25+bulge*s,-s*.35,s*.4,0);ctx.quadraticCurveTo(s*.25+bulge*s*.5,s*.25,0,s*.5);ctx.closePath();
  const rg=ctx.createLinearGradient(0,-s*.65,s*.4,s*.5);rg.addColorStop(0,k.c2);rg.addColorStop(1,k.c3);ctx.fillStyle=rg;ctx.fill();
  // Bottom tail section
  ctx.beginPath();ctx.moveTo(-s*.14,s*.5);ctx.lineTo(s*.14,s*.5);ctx.lineTo(0,s*.68);ctx.closePath();ctx.fillStyle=k.c3;ctx.fill();
  // Frame
  ctx.strokeStyle=k.hero?'rgba(180,140,50,0.75)':'rgba(50,35,15,0.45)';ctx.lineWidth=k.hero?1.5:1;
  ctx.beginPath();ctx.moveTo(0,-s*.65);ctx.lineTo(0,s*.68);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-s*.4,0);ctx.lineTo(s*.4,0);ctx.stroke();
  // Tails
  const tl=s*1.1,seg=8,sl=tl/seg;
  ctx.lineCap='round';
  for(let ti=0;ti<(k.hero?2:1);ti++){
    ctx.strokeStyle=ti===0?k.c1:k.c2;ctx.lineWidth=ti===0?2:1.5;
    ctx.beginPath();ctx.moveTo(0,s*.68);
    for(let i=1;i<=seg;i++){const tt=i/seg;const wv=Math.sin(t*4.5+k.fp+ti*1.2+tt*3.5)*s*.14*tt;ctx.lineTo(wv+(ti-.5)*4,s*.68+sl*i);}
    ctx.stroke();
  }
  // Tail cloth pieces
  for(let i=2;i<seg;i+=2){const tt=i/seg;const wv=Math.sin(t*4.5+k.fp+tt*3.5)*s*.14*tt;const px=wv,py=s*.68+sl*i;ctx.fillStyle=k.c1;ctx.globalAlpha=.55;ctx.beginPath();ctx.ellipse(px,py,s*.07,s*.1,Math.sin(t*3+i)*.3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  // Hero glow
  if(k.hero){const gg=ctx.createRadialGradient(0,0,s*.3,0,0,s*2.2);gg.addColorStop(0,'rgba(255,215,0,0.12)');gg.addColorStop(.5,'rgba(255,200,50,0.04)');gg.addColorStop(1,'rgba(255,180,0,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,s*2.2,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  // String
  ctx.save();ctx.strokeStyle=k.hero?'rgba(200,170,80,0.35)':`rgba(140,130,120,${.08+k.d*.12})`;ctx.lineWidth=k.hero?1:.4+k.d*.5;ctx.lineCap='round';
  const mx=(dx+k.ax)*.5+Math.sin(t*1.2+dx*.008)*12;const my=(dy+k.ay)*.5+18+k.d*14;
  ctx.beginPath();ctx.moveTo(dx,dy+s*.68);ctx.quadraticCurveTo(mx,my,k.ax,k.ay);ctx.stroke();ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   DRAWING — TEXT REVEAL
   ═══════════════════════════════════════════════════════════ */

const HINDI = '\u090A\u0901\u091A\u0940 \u0909\u0921\u093C\u093E\u0928, \u0928\u0908 \u0936\u0941\u0930\u0941\u0906\u0924';

function drawText(ctx:CanvasRenderingContext2D,w:number,h:number,t:number,pe:PEngine){
  // Hindi text reveal 10.5s - 11.2s
  const tp=eOC(cl((t-10.5)/.7,0,1));
  if(tp<=0)return;
  const fs=Math.min(38,w*.052);const cy=h*.56;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`700 ${fs}px "Noto Sans Devanagari","Tiro Devanagari Hindi","Devanagari Sangam MN",sans-serif`;
  const met=ctx.measureText(HINDI);const tw=met.width;
  // Clip reveal left to right
  ctx.beginPath();ctx.rect(w/2-tw/2-12,cy-fs*1.2,(tw+24)*tp,fs*2.4);ctx.clip();
  // Golden gradient
  const tg=ctx.createLinearGradient(w/2-tw/2,cy,w/2+tw/2,cy);tg.addColorStop(0,'#C8961E');tg.addColorStop(.25,'#F0C75E');tg.addColorStop(.45,'#FFF8E1');tg.addColorStop(.55,'#FFE082');tg.addColorStop(.75,'#F0C75E');tg.addColorStop(1,'#C8961E');
  ctx.fillStyle=tg;ctx.shadowColor='#FFD700';ctx.shadowBlur=22*tp;
  ctx.fillText(HINDI,w/2,cy);
  ctx.shadowBlur=0;
  // Shimmer after full reveal
  if(tp>=1){const st=cl((t-11.2)/.6,0,1);if(st<1){const sx=w/2-tw/2-20+(tw+40)*st;const sg=ctx.createLinearGradient(sx-35,0,sx+35,0);sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,0.35)');sg.addColorStop(1,'rgba(255,255,255,0)');ctx.globalCompositeOperation='lighter';ctx.fillStyle=sg;ctx.fillRect(w/2-tw/2-12,cy-fs*1.2,tw+24,fs*2.4);ctx.globalCompositeOperation='source-over';}}
  ctx.restore();
  // Decorative lines
  ctx.save();const lw=tw*.6*tp;ctx.strokeStyle=`rgba(212,168,67,${tp*.5})`;ctx.lineWidth=1;
  const dg1=ctx.createLinearGradient(w/2-lw/2,0,w/2+lw/2,0);dg1.addColorStop(0,'rgba(212,168,67,0)');dg1.addColorStop(.3,`rgba(212,168,67,${tp*.5})`);dg1.addColorStop(.5,`rgba(255,224,130,${tp*.7})`);dg1.addColorStop(.7,`rgba(212,168,67,${tp*.5})`);dg1.addColorStop(1,'rgba(212,168,67,0)');
  ctx.strokeStyle=dg1;ctx.beginPath();ctx.moveTo(w/2-lw/2,cy+fs*.85);ctx.lineTo(w/2+lw/2,cy+fs*.85);ctx.stroke();
  // Small diamonds
  for(let i=-1;i<=1;i+=2){const dx=w/2+i*lw/2;ctx.fillStyle=`rgba(240,199,94,${tp*.6})`;ctx.save();ctx.translate(dx,cy+fs*.85);ctx.rotate(Math.PI/4);ctx.fillRect(-2.5,-2.5,5,5);ctx.restore();}
  ctx.restore();
  // English subtitle 11.2s - 11.7s
  const ep=eOC(cl((t-11.2)/.5,0,1));if(ep<=0)return;
  const es=Math.min(22,w*.032);
  ctx.save();ctx.globalAlpha=ep*.85;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`300 ${es}px "Cormorant Garamond","Georgia",serif`;
  ctx.fillStyle='rgba(240,199,94,0.85)';ctx.letterSpacing=`${es*.18}px`;
  ctx.fillText('Happy Makar Sankranti',w/2,cy+fs*1.5);
  ctx.restore();
  // Sparkle particles during reveal
  if(tp<1&&Math.random()<.4){const rx=w/2-tw/2+tw*tp;pe.spawn({x:rx+(Math.random()-.5)*16,y:cy+(Math.random()-.5)*12,vx:(Math.random()-.5)*2,vy:-.5+Math.random(),size:.5+Math.random()*2,alpha:.9,maxLife:12+Math.random()*12,color:'#FFFFFF',type:'sparkle'});}
}

/* ═══════════════════════════════════════════════════════════
   DRAWING — FINAL EFFECTS
   ═══════════════════════════════════════════════════════════ */

function drawGoldenGlow(ctx:CanvasRenderingContext2D,w:number,h:number,t:number){
  const p=eOC(cl((t-11.5)/.5,0,1));if(p<=0)return;const a=p*.22;
  const g=ctx.createRadialGradient(w/2,h*.42,0,w/2,h*.42,Math.max(w,h)*.72);g.addColorStop(0,`rgba(255,222,135,${a})`);g.addColorStop(.5,`rgba(255,202,105,${a*.45})`);g.addColorStop(1,`rgba(205,155,55,${a*.15})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}

function drawFade(ctx:CanvasRenderingContext2D,w:number,h:number,t:number){
  const p=eIQ(cl((t-11.7)/.3,0,1));if(p<=0)return;
  ctx.fillStyle=`rgba(255,242,205,${p})`;ctx.fillRect(0,0,w,h);
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function MakarSankrantiCinematicIntro({ onComplete }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef(0);
  const frRef = useRef(0);
  const dnRef = useRef(false);
  const ocRef = useRef(onComplete);
  const dpRef = useRef(1);
  const szRef = useRef({ w: 0, h: 0 });
  const peRef = useRef(new PEngine());
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const kitesRef = useRef<Kite[]>([]);
  const birdsRef = useRef<Bird[]>([]);
  const spRef = useRef({ dust:0, sun:0, haze:0, trail:0, txtP:0 });

  useEffect(() => { ocRef.current = onComplete; }, [onComplete]);

  const resize = useCallback(() => {
    const c = cvRef.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dpRef.current = dpr;
    const w = window.innerWidth, h = window.innerHeight;
    szRef.current = { w, h };
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + 'px'; c.style.height = h + 'px';
    // Regenerate scene elements on resize
    starsRef.current = mkStars(w, h);
    cloudsRef.current = mkClouds(w, h);
    kitesRef.current = mkKites(w, h);
    birdsRef.current = mkBirds(w, h);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;

    const animate = (ts: number) => {
      if (!stRef.current) stRef.current = ts;
      const t = (ts - stRef.current) / 1000;
      const { w, h } = szRef.current;
      const dpr = dpRef.current;
      const pe = peRef.current;
      const sp = spRef.current;
      const stars = starsRef.current;
      const clouds = cloudsRef.current;
      const kites = kitesRef.current;
      const birds = birdsRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ─── SKY ───
      drawSky(ctx, w, h, t);

      // ─── STARS ───
      drawStars(ctx, stars, t);

      // ─── SUN ───
      drawSun(ctx, w, h, t);

      // ─── CLOUDS ───
      drawClouds(ctx, clouds, t, w);

      // ─── BIRDS ───
      drawBirds(ctx, birds, t, w);

      // ─── KITES ───
      for (const k of kites) {
        if (t >= k.at && !k.on) k.on = true;
        if (k.on) {
          k.x += k.vx;
          if (k.x > w + 80) k.x = -80;
          if (k.x < -80) k.x = w + 80;
          drawKite(ctx, k, t);
        }
      }

      // ─── HERO KITE ───
      if (t >= 9.5) {
        const riseT = eOC(cl((t - 9.5) / 1, 0, 1));
        const hx = w * .5 + Math.sin(t * .8) * 18 * riseT;
        const hy = h + 60 - riseT * (h * .62);
        const hAlpha = t < 11.5 ? riseT : riseT * (1 - eOC(cl((t - 11.5) / .5, 0, 1)));
        const hSz = Math.min(55, Math.min(w, 600) * .09);

        if (hAlpha > .01) {
          ctx.save(); ctx.globalAlpha = hAlpha;
          drawKite(ctx, {
            x: hx, y: hy, vx: 0, sz: hSz, d: 1,
            c1: '#D4A017', c2: '#FFD700', c3: '#FFF8DC',
            fp: 0, fs: 3.5, sp: 0, ss: .7, sa: 12,
            bp: 0, bs: .4, ba: 6,
            ax: w * .5, ay: h * .95, at: 0, on: true, hero: true,
          }, t);
          ctx.restore();
        }

        // Trail particles during hovering
        if (t > 10.5 && t < 11.5 && hAlpha > .1) {
          for (let i = 0; i < 3; i++) {
            pe.spawn({
              x: hx + (Math.random() - .5) * 28,
              y: hy + hSz * .7,
              vx: (Math.random() - .5) * 1.2,
              vy: 1.8 + Math.random() * 2.2,
              size: 1 + Math.random() * 2.5,
              alpha: .5 + Math.random() * .5,
              maxLife: 22 + Math.random() * 18,
              color: Math.random() > .3 ? '#FFD700' : '#FFF3C4',
              type: 'trail',
            });
          }
        }
      }

      // ─── TEXT ───
      if (t > 10.5) drawText(ctx, w, h, t, pe);

      // ─── AMBIENT PARTICLES ───
      // Dust
      if (t > 5 && ts - sp.dust > 300 && pe.count < 1400) {
        pe.spawn({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .15, vy: -.05 + Math.random() * .1, size: 15 + Math.random() * 30, alpha: .08, maxLife: 300 + Math.random() * 200, color: 'rgba(255,230,180,0.08)', type: 'haze' });
        pe.spawn({ x: Math.random() * w, y: h * .3 + Math.random() * h * .5, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .15, size: .5 + Math.random() * 1.5, alpha: .2, maxLife: 150 + Math.random() * 150, color: '#F5E6D0', type: 'dust' });
        sp.dust = ts;
      }
      // Sunlight particles
      if (t > 5.5 && ts - sp.sun > 120 && pe.count < 1400) {
        const sunX = w * .5, sunY = h * .97 - eOC(cl((t - 3) / 4, 0, 1)) * h * .42;
        pe.spawn({ x: sunX + (Math.random() - .5) * 100, y: sunY + 20, vx: (Math.random() - .5) * .5, vy: -1 - Math.random() * 2, size: .8 + Math.random() * 2, alpha: .35, maxLife: 60 + Math.random() * 80, color: Math.random() > .5 ? '#FFE082' : '#FFD54F', type: 'sunlight' });
        sp.sun = ts;
      }
      // Golden float particles (final phase)
      if (t > 11 && ts - sp.trail > 40 && pe.count < 1400) {
        pe.spawn({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .3, vy: -.2 - Math.random() * .5, size: .5 + Math.random() * 2, alpha: .5, maxLife: 80 + Math.random() * 80, color: Math.random() > .4 ? '#FFD700' : '#FFF8E1', type: 'trail' });
        sp.trail = ts;
      }

      // ─── PARTICLES UPDATE & DRAW ───
      pe.update(16.67);
      pe.draw(ctx);

      // ─── GOLDEN GLOW ───
      drawGoldenGlow(ctx, w, h, t);

      // ─── FADE OUT ───
      drawFade(ctx, w, h, t);

      // ─── COMPLETE ───
      if (t >= 12 && !dnRef.current) {
        dnRef.current = true;
        cancelAnimationFrame(frRef.current);
        ocRef.current();
        return;
      }
      frRef.current = requestAnimationFrame(animate);
    };

    frRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frRef.current); };
  }, []);

  return (
    <canvas
      ref={cvRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        display: 'block', background: '#050512',
        zIndex: 9999,
      }}
    />
  );
}
