'use client';

import React, { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════ TYPES ═══════════════════════ */

type Phase =
  | 'TEMPLE_START' | 'DIYA_IGNITE' | 'SMOKE_RISE' | 'THREAD_ENTER'
  | 'RAKHI_BUILD' | 'RAKHI_ROTATE' | 'ENERGY_BUILD' | 'SHIELD_BLAST'
  | 'PARTICLE_FLOAT' | 'TEXT_REVEAL' | 'FADE_OUT' | 'COMPLETE';

interface Props { onComplete: () => void; }

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; life: number; maxLife: number;
  color: string;
  type: 'gold_spark' | 'sacred_dust' | 'rose_petal' | 'smoke' | 'shield_particle' | 'ember';
  rot: number; rotSpd: number; tOff: number;
}

/* ═══════════════════ PARTICLE ENGINE ═══════════════════ */

class RakshaBandhanParticles {
  private p: Particle[] = [];
  private max = 2500;
  private add(v: Particle) { if (this.p.length < this.max) this.p.push(v); }

  spawnGoldDust(x: number, y: number, n: number) {
    const cols = ['#F0C75E','#D4A843','#FFE082','#FFD54F','#C8A415'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 0.2 + Math.random() * 0.8;
      this.add({ x: x+(Math.random()-.5)*20, y: y+(Math.random()-.5)*20, vx: Math.cos(a)*s, vy: Math.sin(a)*s-.3,
        size: 1+Math.random()*3, alpha: .6+Math.random()*.4, life: 0, maxLife: 60+Math.random()*120,
        color: cols[Math.floor(Math.random()*cols.length)], type:'gold_spark', rot:0, rotSpd:0, tOff: Math.random()*1e3 });
    }
  }

  spawnSmoke(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      this.add({ x: x+(Math.random()-.5)*10, y: y+Math.random()*5, vx: (Math.random()-.5)*.3, vy: -.5-Math.random()*1.2,
        size: 3+Math.random()*5, alpha: .15+Math.random()*.15, life: 0, maxLife: 120+Math.random()*180,
        color:'#B8A090', type:'smoke', rot:0, rotSpd:(Math.random()-.5)*.01, tOff: Math.random()*1e3 });
    }
  }

  spawnRosePetals(x: number, y: number, n: number) {
    const cols = ['#C41E3A','#E8384F','#D4364D','#B8293A','#F04060'];
    for (let i = 0; i < n; i++) {
      const a = Math.random()*Math.PI*2, s = .5+Math.random()*2;
      this.add({ x: x+(Math.random()-.5)*40, y: y+(Math.random()-.5)*40, vx: Math.cos(a)*s, vy: Math.sin(a)*s-.5,
        size: 3+Math.random()*5, alpha: .5+Math.random()*.5, life: 0, maxLife: 120+Math.random()*180,
        color: cols[Math.floor(Math.random()*cols.length)], type:'rose_petal', rot: Math.random()*Math.PI*2,
        rotSpd: (Math.random()-.5)*.05, tOff: Math.random()*1e3 });
    }
  }

  spawnShieldExplosion(cx: number, cy: number, n: number) {
    const cols = ['#F0C75E','#D4A843','#FFE082','#FFFFFF','#FFD700'];
    for (let i = 0; i < n; i++) {
      const a = Math.random()*Math.PI*2, s = 2+Math.random()*8;
      this.add({ x:cx, y:cy, vx: Math.cos(a)*s, vy: Math.sin(a)*s, size: 1+Math.random()*4,
        alpha: .8+Math.random()*.2, life:0, maxLife: 40+Math.random()*80,
        color: cols[Math.floor(Math.random()*cols.length)], type:'shield_particle', rot:0, rotSpd:0, tOff:Math.random()*1e3 });
    }
  }

  spawnAmbient(w: number, h: number, n: number) {
    const cols = ['#F0C75E','#D4A843','#FFE082','#C8A415','#F5E6D0'];
    for (let i = 0; i < n; i++) {
      this.add({ x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-.5)*.2, vy: -.1-Math.random()*.3,
        size: .5+Math.random()*2, alpha: .2+Math.random()*.3, life:0, maxLife: 200+Math.random()*300,
        color: cols[Math.floor(Math.random()*cols.length)], type:'sacred_dust', rot:0, rotSpd:0, tOff:Math.random()*1e3 });
    }
  }

  spawnEmbers(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      this.add({ x: x+(Math.random()-.5)*8, y, vx: (Math.random()-.5)*.5, vy: -1-Math.random()*2,
        size: .5+Math.random()*1.5, alpha: .8+Math.random()*.2, life:0, maxLife: 30+Math.random()*60,
        color: Math.random()>.5?'#FF6B35':'#FFA500', type:'ember', rot:0, rotSpd:0, tOff:Math.random()*1e3 });
    }
  }

  update(dt: number) {
    const f = dt / 16.67;
    for (let i = this.p.length - 1; i >= 0; i--) {
      const q = this.p[i]; q.life += f;
      if (q.life >= q.maxLife) { this.p.splice(i, 1); continue; }
      const lr = q.life / q.maxLife;
      if (q.type === 'smoke') {
        q.vx += Math.sin(q.life * .02 + q.tOff) * .003 * f;
        q.x += q.vx * f; q.y += q.vy * f; q.size += .03 * f; q.alpha = (1 - lr) * .2;
      } else if (q.type === 'rose_petal') {
        q.vx += Math.sin(q.life * .03 + q.tOff) * .02 * f;
        q.vy += .008 * f; q.vy = Math.min(q.vy, 1.5);
        q.x += q.vx * f; q.y += q.vy * f; q.rot += q.rotSpd * f; q.alpha = (1 - lr * .5) * .7;
      } else if (q.type === 'shield_particle') {
        q.vx *= .97; q.vy *= .97; q.x += q.vx * f; q.y += q.vy * f; q.alpha = (1 - lr) * .9;
      } else if (q.type === 'ember') {
        q.vx += Math.sin(q.life * .05 + q.tOff) * .02 * f;
        q.x += q.vx * f; q.y += q.vy * f; q.alpha = (1 - lr) * .9;
      } else {
        q.x += q.vx * f; q.y += q.vy * f;
        if (q.type === 'gold_spark') q.alpha = (1 - lr) * .8;
        else { const pulse = .5 + .5 * Math.sin(q.life * .05 + q.tOff); q.alpha = (1 - lr) * .3 * pulse + .1; }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const q of this.p) {
      ctx.save(); ctx.globalAlpha = Math.max(0, q.alpha);
      if (q.type === 'rose_petal') {
        ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = q.color;
        ctx.beginPath(); ctx.ellipse(0, 0, q.size, q.size * .6, 0, 0, Math.PI * 2); ctx.fill();
      } else if (q.type === 'smoke') {
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.size);
        g.addColorStop(0, q.color); g.addColorStop(1, 'rgba(184,160,144,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill();
      } else if (q.type === 'gold_spark' || q.type === 'shield_particle' || q.type === 'ember') {
        ctx.fillStyle = q.color; ctx.shadowColor = q.color; ctx.shadowBlur = q.size * 3;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  clear() { this.p = []; }
  get count() { return this.p.length; }
}

/* ═══════════════════ UTILITIES ═══════════════════ */

const easeIO = (t: number) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
const easeO = (t: number) => 1 - Math.pow(1-t, 3);
const easeI = (t: number) => t*t*t;
const easeOE = (t: number) => t===1?1:1-Math.pow(2,-10*t);
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));

function getPhase(t: number): Phase {
  if (t < 1) return 'TEMPLE_START';
  if (t < 2) return 'DIYA_IGNITE';
  if (t < 3) return 'SMOKE_RISE';
  if (t < 4.5) return 'THREAD_ENTER';
  if (t < 6) return 'RAKHI_BUILD';
  if (t < 7) return 'RAKHI_ROTATE';
  if (t < 8) return 'ENERGY_BUILD';
  if (t < 8.5) return 'SHIELD_BLAST';
  if (t < 10) return 'PARTICLE_FLOAT';
  if (t < 11) return 'TEXT_REVEAL';
  if (t < 12) return 'FADE_OUT';
  return 'COMPLETE';
}

const PHASE_STARTS: Record<Phase, number> = {
  TEMPLE_START:0, DIYA_IGNITE:1, SMOKE_RISE:2, THREAD_ENTER:3, RAKHI_BUILD:4.5,
  RAKHI_ROTATE:6, ENERGY_BUILD:7, SHIELD_BLAST:8, PARTICLE_FLOAT:8.5, TEXT_REVEAL:10, FADE_OUT:11, COMPLETE:12
};
const PHASE_DURS: Record<Phase, number> = {
  TEMPLE_START:1, DIYA_IGNITE:1, SMOKE_RISE:1, THREAD_ENTER:1.5, RAKHI_BUILD:1.5,
  RAKHI_ROTATE:1, ENERGY_BUILD:1, SHIELD_BLAST:.5, PARTICLE_FLOAT:1.5, TEXT_REVEAL:1, FADE_OUT:1, COMPLETE:0
};

function phaseProgress(t: number, phase: Phase): number {
  return clamp((t - PHASE_STARTS[phase]) / PHASE_DURS[phase], 0, 1);
}

/* ═══════════════════ SCENE RENDERER ═══════════════════ */

function drawTemple(ctx: CanvasRenderingContext2D, w: number, h: number, a: number) {
  ctx.save(); ctx.globalAlpha = a;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#050302'); bg.addColorStop(0.4, '#0A0604');
  bg.addColorStop(0.7, '#120A06'); bg.addColorStop(1, '#1A0E08');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  const vig = ctx.createRadialGradient(w/2, h*.72, 0, w/2, h*.72, Math.max(w,h)*.8);
  vig.addColorStop(0, 'rgba(60,30,10,0.25)'); vig.addColorStop(0.5, 'rgba(20,10,5,0.08)'); vig.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#080403';
  const pw = w * .055, ph = h * .55;
  ctx.fillRect(w*.2-pw/2, h*.3, pw, ph);
  ctx.fillRect(w*.8-pw/2, h*.3, pw, ph);
  ctx.fillRect(w*.2-pw*.8, h*.28, pw*1.6, pw*.25);
  ctx.fillRect(w*.8-pw*.8, h*.28, pw*1.6, pw*.25);

  ctx.beginPath();
  ctx.moveTo(w*.2+pw/2, h*.3);
  ctx.quadraticCurveTo(w*.32, h*.08, w*.5, h*.03);
  ctx.quadraticCurveTo(w*.68, h*.08, w*.8-pw/2, h*.3);
  ctx.lineTo(w*.8-pw/2, h*.34); ctx.lineTo(w*.2+pw/2, h*.34); ctx.closePath(); ctx.fill();

  ctx.beginPath(); ctx.moveTo(w*.5-4, h*.03); ctx.lineTo(w*.5, h*-.01); ctx.lineTo(w*.5+4, h*.03); ctx.fill();
  ctx.fillRect(w*.16, h*.28, w*.68, pw*.12);

  const fl = ctx.createLinearGradient(0, h*.88, 0, h);
  fl.addColorStop(0, 'rgba(30,15,5,0.2)'); fl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fl; ctx.fillRect(0, h*.88, w, h*.12);

  ctx.restore();
}

function drawDiya(ctx: CanvasRenderingContext2D, cx: number, cy: number, intensity: number, time: number) {
  ctx.save(); ctx.globalAlpha = intensity;
  const s = .8 + intensity * .2;
  ctx.translate(cx, cy); ctx.scale(s, s);

  const gr = 80 + Math.sin(time*3)*10;
  const hg = ctx.createRadialGradient(0, -10, 0, 0, -10, gr);
  hg.addColorStop(0, 'rgba(255,150,50,0.12)'); hg.addColorStop(0.5, 'rgba(255,100,20,0.04)'); hg.addColorStop(1, 'rgba(255,50,0,0)');
  ctx.fillStyle = hg; ctx.fillRect(-gr, -10-gr, gr*2, gr*2);

  const bowl = ctx.createLinearGradient(-30, 0, 30, 0);
  bowl.addColorStop(0, '#8B6914'); bowl.addColorStop(0.3, '#D4A843'); bowl.addColorStop(0.5, '#F0C75E');
  bowl.addColorStop(0.7, '#D4A843'); bowl.addColorStop(1, '#8B6914');
  ctx.fillStyle = bowl;
  ctx.beginPath();
  ctx.moveTo(-35, 5); ctx.quadraticCurveTo(-30, 20, -15, 25); ctx.lineTo(15, 25);
  ctx.quadraticCurveTo(30, 20, 35, 5); ctx.lineTo(30, -2);
  ctx.quadraticCurveTo(38, -2, 42, -8); ctx.quadraticCurveTo(40, -5, 35, -2);
  ctx.lineTo(-30, -2); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#FFE082'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-30, -2); ctx.lineTo(30, -2); ctx.stroke();

  ctx.fillStyle = 'rgba(200,160,50,0.6)';
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI*2); ctx.fill();

  ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(5, -2); ctx.lineTo(8, -12); ctx.stroke();

  ctx.fillStyle = '#FF6B35'; ctx.shadowColor = '#FF6B35'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(8, -13, 2, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();
}

function drawFlame(ctx: CanvasRenderingContext2D, cx: number, cy: number, intensity: number, time: number) {
  if (intensity <= 0) return;
  ctx.save(); ctx.globalAlpha = intensity;
  const layers = [
    { c1:'rgba(255,180,80,0.85)', c2:'rgba(255,120,40,0.5)', oy:0, sx:1, sy:1, f:1 },
    { c1:'rgba(255,240,180,0.75)', c2:'rgba(255,190,90,0.35)', oy:-3, sx:.6, sy:1.1, f:1.3 },
    { c1:'rgba(255,255,240,0.6)', c2:'rgba(255,240,180,0.15)', oy:-5, sx:.3, sy:.8, f:1.7 },
  ];
  for (const l of layers) {
    const fx = Math.sin(time*8*l.f)*2 + Math.sin(time*13*l.f)*1;
    const fy = Math.cos(time*6*l.f)*2;
    const fs = 1 + Math.sin(time*10*l.f)*.1;
    const px = cx+fx, py = cy+l.oy+fy;
    const fw = 12*l.sx*fs, fh = 35*l.sy*fs;
    const fg = ctx.createRadialGradient(px, py+fh*.3, 0, px, py, fh);
    fg.addColorStop(0, l.c1); fg.addColorStop(0.6, l.c2); fg.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = fg; ctx.beginPath();
    ctx.moveTo(px, py+fh*.3);
    ctx.bezierCurveTo(px-fw, py+fh*.1, px-fw*.8, py-fh*.5, px+fx*.5, py-fh);
    ctx.bezierCurveTo(px+fw*.8, py-fh*.5, px+fw, py+fh*.1, px, py+fh*.3);
    ctx.fill();
  }
  ctx.shadowColor = '#FF8C00'; ctx.shadowBlur = 35*intensity;
  ctx.fillStyle = 'rgba(255,140,0,0.04)';
  ctx.beginPath(); ctx.arc(cx, cy-10, 28, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();
}

function drawThread(ctx: CanvasRenderingContext2D, w: number, h: number, prog: number, time: number) {
  if (prog <= 0) return;
  ctx.save();
  const sx = -50, sy = h*.4, c1x = w*.22, c1y = h*.15, c2x = w*.38, c2y = h*.35, ex = w*.5, ey = h*.42;
  const p = easeIO(prog), steps = Math.floor(p * 100);
  if (steps < 1) { ctx.restore(); return; }

  const tg = ctx.createLinearGradient(sx, sy, ex, ey);
  tg.addColorStop(0, '#D4A843'); tg.addColorStop(0.5, '#FFE082'); tg.addColorStop(1, '#F0C75E');
  ctx.strokeStyle = tg; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.shadowColor = '#F0C75E'; ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i/100, m = 1-t;
    const px = m*m*m*sx + 3*m*m*t*c1x + 3*m*t*t*c2x + t*t*t*ex;
    const py = m*m*m*sy + 3*m*m*t*c1y + 3*m*t*t*c2y + t*t*t*ey;
    const wave = Math.sin(t*Math.PI*4 + time*3)*2*(1-t);
    if (i===0) ctx.moveTo(px, py+wave); else ctx.lineTo(px, py+wave);
  }
  ctx.stroke();

  if (prog < 1) {
    const t = p, m = 1-t;
    const tx = m*m*m*sx+3*m*m*t*c1x+3*m*t*t*c2x+t*t*t*ex;
    const ty = m*m*m*sy+3*m*m*t*c1y+3*m*t*t*c2y+t*t*t*ey;
    const tw = Math.sin(t*Math.PI*4+time*3)*2*(1-t);
    const sg = ctx.createRadialGradient(tx, ty+tw, 0, tx, ty+tw, 14);
    sg.addColorStop(0, 'rgba(255,240,200,0.8)'); sg.addColorStop(0.5, 'rgba(255,200,100,0.3)'); sg.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(tx, ty+tw, 14, 0, Math.PI*2); ctx.fill();
  }
  ctx.shadowBlur = 0; ctx.restore();
}

function drawRakhi(ctx: CanvasRenderingContext2D, cx: number, cy: number, bp: number, rot: number, time: number, w: number) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  const r = Math.min(50, Math.min(w, 600) * .085);
  const p = clamp(bp, 0, 1);
  const floatY = Math.sin(time*1.5)*3;
  ctx.translate(0, floatY);

  const goldG = () => {
    const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, '#8B6914'); g.addColorStop(0.25, '#F0C75E'); g.addColorStop(0.45, '#FFF3C4');
    g.addColorStop(0.55, '#FFE082'); g.addColorStop(0.75, '#D4A843'); g.addColorStop(1, '#8B6914');
    return g;
  };

  // Outer ring
  if (p > 0) {
    const rp = easeO(clamp(p/.25, 0, 1));
    ctx.strokeStyle = goldG(); ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.shadowColor = '#F0C75E'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI/2, -Math.PI/2 + rp*Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  // Inner ring
  if (p > .15) {
    const rp = easeO(clamp((p-.15)/.2, 0, 1));
    ctx.strokeStyle = '#C8A415'; ctx.lineWidth = 2; ctx.shadowColor = '#D4A843'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(0, 0, r*.78, -Math.PI/2, -Math.PI/2 + rp*Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  // Petals
  if (p > .25) {
    const pp = easeO(clamp((p-.25)/.2, 0, 1));
    for (let i = 0; i < 8; i++) {
      const ip = clamp(pp*8-i, 0, 1); if (ip <= 0) continue;
      const a = (i/8)*Math.PI*2 - Math.PI/2;
      ctx.save(); ctx.rotate(a); ctx.globalAlpha = ip;
      ctx.fillStyle = 'rgba(240,199,94,0.5)';
      ctx.beginPath(); ctx.ellipse(0, -r*.84, r*.1*ip, r*.22*ip, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  // Center mandala
  if (p > .4) {
    const cp = easeO(clamp((p-.4)/.2, 0, 1));
    ctx.save(); ctx.globalAlpha = cp;
    ctx.fillStyle = '#FFE082'; ctx.shadowColor = '#FFE082'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, 0, r*.12, 0, Math.PI*2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = (i/6)*Math.PI*2 + time*.15;
      ctx.save(); ctx.rotate(a);
      ctx.fillStyle = 'rgba(240,199,94,0.55)';
      ctx.beginPath(); ctx.ellipse(0, -r*.32*cp, r*.08*cp, r*.2*cp, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0; ctx.restore();
  }
  // Rubies
  if (p > .5) {
    const gp = easeO(clamp((p-.5)/.2, 0, 1));
    const angles = [0, Math.PI/2, Math.PI, Math.PI*1.5];
    for (let i = 0; i < 4; i++) {
      const ig = clamp(gp*4-i, 0, 1); if (ig <= 0) continue;
      const a = angles[i] - Math.PI/2;
      const gx = Math.cos(a)*r*.78, gy = Math.sin(a)*r*.78;
      const sz = 5*ig;
      const rg = ctx.createRadialGradient(gx-sz*.3, gy-sz*.3, 0, gx, gy, sz);
      rg.addColorStop(0, '#FF6B7A'); rg.addColorStop(0.5, '#C41E3A'); rg.addColorStop(1, '#8B0000');
      ctx.fillStyle = rg; ctx.shadowColor = '#C41E3A'; ctx.shadowBlur = 8*ig;
      ctx.beginPath(); ctx.arc(gx, gy, sz, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(gx-sz*.25, gy-sz*.25, sz*.3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  // Pearls
  if (p > .6) {
    const pp = easeO(clamp((p-.6)/.2, 0, 1));
    for (let i = 0; i < 8; i++) {
      const ip = clamp(pp*8-i, 0, 1); if (ip <= 0) continue;
      const a = (i/8)*Math.PI*2;
      const px = Math.cos(a)*r*.9, py = Math.sin(a)*r*.9;
      const sz = 2.5*ip;
      const pg = ctx.createRadialGradient(px-sz*.3, py-sz*.3, 0, px, py, sz);
      pg.addColorStop(0, '#FFFFFF'); pg.addColorStop(0.6, '#F0EDE5'); pg.addColorStop(1, '#C8C0B0');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI*2); ctx.fill();
    }
  }
  // Fringes
  if (p > .78) {
    const fp = easeO(clamp((p-.78)/.22, 0, 1));
    const fringeCount = 7;
    for (let i = 0; i < fringeCount; i++) {
      const ifp = clamp(fp*fringeCount-i, 0, 1); if (ifp <= 0) continue;
      const fx = -r*.5 + (i/(fringeCount-1))*r;
      const fy = r*1.05;
      const fLen = (15 + Math.sin(i*2.5+time*2)*3)*ifp;
      const sway = Math.sin(time*2+i*.8)*2*ifp;
      ctx.strokeStyle = i%2===0 ? '#D4A843' : '#C41E3A';
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx+sway, fy+fLen*.6, fx+sway*1.5, fy+fLen); ctx.stroke();
    }
  }
  // Overall glow
  if (p > .4) {
    const ga = (p-.4)*.25;
    const gg = ctx.createRadialGradient(0, 0, r*.2, 0, 0, r*1.6);
    gg.addColorStop(0, `rgba(240,199,94,${ga})`); gg.addColorStop(1, 'rgba(240,199,94,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, r*1.6, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawEnergy(ctx: CanvasRenderingContext2D, cx: number, cy: number, intensity: number, time: number, w: number) {
  if (intensity <= 0) return;
  ctx.save();
  const r = Math.min(50, Math.min(w, 600)*.085);
  const pulse = .5 + .5*Math.sin(time*8);
  const sz = r * (1.5 + intensity*2 + pulse*intensity*.5);

  const eg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz);
  eg.addColorStop(0, `rgba(255,240,180,${intensity*.4})`);
  eg.addColorStop(0.3, `rgba(255,200,100,${intensity*.2})`);
  eg.addColorStop(0.7, `rgba(240,199,94,${intensity*.08})`);
  eg.addColorStop(1, 'rgba(240,199,94,0)');
  ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(cx, cy, sz, 0, Math.PI*2); ctx.fill();

  // Light rays
  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const a = (i/rayCount)*Math.PI*2 + time*1.5;
    const rayLen = r * (2 + intensity*3 + pulse*intensity);
    ctx.strokeStyle = `rgba(255,220,130,${intensity*.15*pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a)*r*.5, cy + Math.sin(a)*r*.5);
    ctx.lineTo(cx + Math.cos(a)*rayLen, cy + Math.sin(a)*rayLen);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShield(ctx: CanvasRenderingContext2D, cx: number, cy: number, prog: number, w: number, h: number) {
  if (prog <= 0) return;
  ctx.save();
  const maxR = Math.sqrt(w*w + h*h) * .7;
  const r = easeOE(prog) * maxR;
  const alpha = (1 - prog) * .7;

  // Outer ring
  ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
  ctx.lineWidth = 4 + (1-prog)*8;
  ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 30*(1-prog);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();

  // Inner softer ring
  ctx.strokeStyle = `rgba(255,240,180,${alpha*.5})`;
  ctx.lineWidth = 12 + (1-prog)*20;
  ctx.shadowBlur = 50*(1-prog);
  ctx.beginPath(); ctx.arc(cx, cy, r*.95, 0, Math.PI*2); ctx.stroke();

  // Fill glow
  const sg = ctx.createRadialGradient(cx, cy, r*.8, cx, cy, r);
  sg.addColorStop(0, 'rgba(255,215,0,0)');
  sg.addColorStop(0.7, `rgba(255,215,0,${alpha*.05})`);
  sg.addColorStop(1, `rgba(255,240,180,${alpha*.15})`);
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

  ctx.shadowBlur = 0; ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, w: number, h: number, prog: number, time: number) {
  if (prog <= 0) return;
  ctx.save();
  const p = easeO(prog);
  const alpha = p;
  const scale = 1.15 - .15*p;
  const cy = h*.38;

  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // Hindi text
  const hindiSize = Math.min(42, w*.055);
  ctx.save(); ctx.translate(w/2, cy); ctx.scale(scale, scale);
  ctx.font = `700 ${hindiSize}px "Noto Sans Devanagari", "Tiro Devanagari Hindi", "Devanagari Sangam MN", sans-serif`;
  ctx.shadowColor = '#F0C75E'; ctx.shadowBlur = 20*p;
  const tg = ctx.createLinearGradient(w/2-hindiSize*4, cy, w/2+hindiSize*4, cy);
  tg.addColorStop(0, '#D4A843'); tg.addColorStop(0.3, '#FFE082'); tg.addColorStop(0.5, '#FFF3C4');
  tg.addColorStop(0.7, '#FFE082'); tg.addColorStop(1, '#D4A843');
  ctx.fillStyle = tg;
  ctx.fillText('\u092C\u0902\u0927\u0928 \u0928\u0939\u0940\u0902, \u0936\u0915\u094D\u0924\u093F \u0939\u0948', 0, 0);
  ctx.shadowBlur = 0;
  // Decorative line under Hindi text
  const lineW = hindiSize*5*p;
  const lg = ctx.createLinearGradient(-lineW/2, 0, lineW/2, 0);
  lg.addColorStop(0, 'rgba(212,168,67,0)'); lg.addColorStop(0.2, 'rgba(212,168,67,0.6)');
  lg.addColorStop(0.5, 'rgba(255,224,130,0.8)'); lg.addColorStop(0.8, 'rgba(212,168,67,0.6)');
  lg.addColorStop(1, 'rgba(212,168,67,0)');
  ctx.strokeStyle = lg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-lineW/2, hindiSize*.7); ctx.lineTo(lineW/2, hindiSize*.7); ctx.stroke();
  ctx.restore();

  // English text
  const engSize = Math.min(24, w*.035);
  ctx.font = `300 ${engSize}px "Cormorant Garamond", "Georgia", serif`;
  ctx.fillStyle = `rgba(240,199,94,${alpha*.8})`;
  ctx.letterSpacing = `${engSize*.15}px`;
  ctx.fillText('Happy Raksha Bandhan', w/2, cy + hindiSize*1.2);

  ctx.restore();
}

function drawFadeOut(ctx: CanvasRenderingContext2D, w: number, h: number, prog: number) {
  if (prog <= 0) return;
  ctx.save();
  const p = easeI(prog);
  const fg = ctx.createRadialGradient(w/2, h*.42, 0, w/2, h*.42, Math.max(w,h)*.8);
  fg.addColorStop(0, `rgba(240,199,94,${p*.9})`);
  fg.addColorStop(0.5, `rgba(212,168,67,${p*.7})`);
  fg.addColorStop(1, `rgba(139,105,20,${p})`);
  ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */

export default function RakshaBandhanCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const particlesRef = useRef(new RakshaBandhanParticles());
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0 });
  const lastSpawnRef = useRef({ smoke: 0, ember: 0, ambient: 0, shield: false, particle: 0 });

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const resize = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    dprRef.current = dpr;
    const w = window.innerWidth, h = window.innerHeight;
    sizeRef.current = { w, h };
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + 'px'; c.style.height = h + 'px';
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) / 1000;
      const { w, h } = sizeRef.current;
      const dpr = dprRef.current;
      const particles = particlesRef.current;
      const sp = lastSpawnRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const phase = getPhase(elapsed);
      const diyaCx = w / 2, diyaCy = h * .78;
      const rakhiCx = w / 2, rakhiCy = h * .42;

      // ─── TEMPLE ───
      drawTemple(ctx, w, h, easeO(clamp(elapsed / 1, 0, 1)));

      // ─── DIYA + FLAME ───
      if (elapsed >= 1) {
        const di = easeO(clamp((elapsed - 1) / 1, 0, 1));
        drawDiya(ctx, diyaCx, diyaCy, di, elapsed);
        drawFlame(ctx, diyaCx, diyaCy - 22, di, elapsed);
        // Embers
        if (elapsed > 1.5 && timestamp - sp.ember > 80) {
          particles.spawnEmbers(diyaCx + 8, diyaCy - 25, 1);
          sp.ember = timestamp;
        }
      }

      // ─── SMOKE ───
      if (elapsed >= 2) {
        if (timestamp - sp.smoke > 60) {
          particles.spawnSmoke(diyaCx, diyaCy - 55, 2);
          sp.smoke = timestamp;
        }
      }

      // ─── AMBIENT PARTICLES ───
      if (elapsed >= 2.5 && timestamp - sp.ambient > 400 && particles.count < 200) {
        particles.spawnAmbient(w, h, 3);
        sp.ambient = timestamp;
      }

      // ─── THREAD ───
      if (elapsed >= 3 && elapsed < 6) {
        const tp = clamp((elapsed - 3) / 1.5, 0, 1);
        drawThread(ctx, w, h, tp, elapsed);
        if (tp < 1 && Math.random() < .3) particles.spawnGoldDust(
          w * tp * .5, h * .35, 1
        );
      }

      // ─── RAKHI BUILD ───
      if (elapsed >= 4.5 && elapsed < 7) {
        const bp = clamp((elapsed - 4.5) / 1.5, 0, 1);
        drawRakhi(ctx, rakhiCx, rakhiCy, bp, 0, elapsed, w);
        if (bp > .5 && Math.random() < .2) particles.spawnGoldDust(rakhiCx, rakhiCy, 1);
      }

      // ─── RAKHI ROTATE ───
      if (elapsed >= 6 && elapsed < 8) {
        const rp = (elapsed - 6);
        const rot = rp * Math.PI * .3;
        drawRakhi(ctx, rakhiCx, rakhiCy, 1, rot, elapsed, w);
        // Show thread connected to Rakhi
        ctx.save();
        const tg = ctx.createLinearGradient(-50, h*.4, rakhiCx, rakhiCy);
        tg.addColorStop(0, '#D4A843'); tg.addColorStop(1, '#F0C75E');
        ctx.strokeStyle = tg; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.shadowColor = '#F0C75E'; ctx.shadowBlur = 5; ctx.globalAlpha = .6;
        ctx.beginPath();
        ctx.moveTo(-50, h*.4);
        ctx.bezierCurveTo(w*.22, h*.15, w*.38, h*.35, rakhiCx - Math.min(50, Math.min(w,600)*.085), rakhiCy);
        ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
      }

      // ─── ENERGY BUILD ───
      if (elapsed >= 7 && elapsed < 8.5) {
        const ep = easeI(clamp((elapsed - 7) / 1, 0, 1));
        const rot = (elapsed - 6) * Math.PI * .3;
        drawRakhi(ctx, rakhiCx, rakhiCy, 1, rot, elapsed, w);
        drawEnergy(ctx, rakhiCx, rakhiCy, ep, elapsed, w);
        if (Math.random() < ep * .4) particles.spawnGoldDust(rakhiCx, rakhiCy, 1);
      }

      // ─── SHIELD BLAST ───
      if (elapsed >= 8 && elapsed < 9) {
        const sp2 = clamp((elapsed - 8) / .5, 0, 1);
        drawShield(ctx, rakhiCx, rakhiCy, sp2, w, h);
        if (!sp.shield) {
          particles.spawnShieldExplosion(rakhiCx, rakhiCy, 150);
          sp.shield = true;
        }
        // Screen flash
        if (sp2 < .3) {
          ctx.save();
          ctx.fillStyle = `rgba(255,240,200,${(.3 - sp2) * 1.5})`;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }

      // ─── PARTICLE FLOAT ───
      if (elapsed >= 8.5 && elapsed < 10) {
        if (timestamp - sp.particle > 50) {
          particles.spawnGoldDust(w/2 + (Math.random()-.5)*w*.6, h/2 + (Math.random()-.5)*h*.6, 3);
          if (Math.random() < .3) particles.spawnRosePetals(w/2 + (Math.random()-.5)*w*.4, h/2 + (Math.random()-.5)*h*.3, 1);
          sp.particle = timestamp;
        }
      }

      // ─── TEXT REVEAL ───
      if (elapsed >= 10 && elapsed < 12) {
        const tp = clamp((elapsed - 10) / 1, 0, 1);
        drawText(ctx, w, h, tp, elapsed);
      }

      // ─── FADE OUT ───
      if (elapsed >= 11) {
        const fp = clamp((elapsed - 11) / 1, 0, 1);
        drawFadeOut(ctx, w, h, fp);
      }

      // ─── PARTICLES UPDATE & DRAW ───
      particles.update(16.67);
      particles.draw(ctx);

      // ─── COMPLETE ───
      if (elapsed >= 12 && !doneRef.current) {
        doneRef.current = true;
        cancelAnimationFrame(frameRef.current);
        onCompleteRef.current();
        return;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frameRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        display: 'block',
        background: '#050302',
        zIndex: 9999,
      }}
    />
  );
}
