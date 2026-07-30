import React, { useEffect, useRef } from 'react';

interface IntroProps {
  onComplete?: () => void;
}

// ============ EASING & MATH ============
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smoothstep = (a: number, b: number, t: number) => {
  if (b === a) return t < a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));

// ============ POOLS & STATE ============
type PType = 'dust' | 'petal' | 'text' | 'bird' | 'firework';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; tx: number; ty: number; rot: number; rotSpd: number;
  flap: number; active: boolean; delay: number; color: string; trail: {x: number, y: number}[];
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', tx: 0, ty: 0, rot: 0, rotSpd: 0, flap: 0, active: false, delay: 0, color: '#fff', trail: []
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    p.active = true; p.life = 0; p.alpha = 0; p.delay = 0; p.trail = [];
    return p;
  }
  release(p: Particle) {
    p.active = false;
    this.free.push(p.idx);
  }
}

const RamNavamiDivineArrivalIntro: React.FC<IntroProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let W = 0, H = 0, DPR = 1;
    let startTime = 0;
    let rafId = 0;
    let running = true;
    let lastTime = 0;

    // Offscreen canvases for post-processing and reflections
    const reflectCanvas = document.createElement('canvas');
    const rctx = reflectCanvas.getContext('2d')!;
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    function makeSprite(size: number, inner: string, mid: string): HTMLCanvasElement {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const cx = c.getContext('2d')!;
      const grad = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, inner);
      grad.addColorStop(0.35, mid);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = grad;
      cx.fillRect(0, 0, size, size);
      return c;
    }
    const dustSprite = makeSprite(32, 'rgba(255,220,150,1)', 'rgba(255,140,40,0.4)');
    const sparkSprite = makeSprite(32, 'rgba(255,250,220,1)', 'rgba(255,180,80,0.4)');

    const pool = new ParticlePool(1500);
    const cam = { x: 0, y: 0, zoom: 1, rot: 0 };
    let ramPoints: { x: number; y: number }[] = [];
    let diyas: { x: number; z: number; y: number; phase: number }[] = [];
    let birdsSpawned = false;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      
      reflectCanvas.width = Math.floor(W);
      reflectCanvas.height = Math.floor(H);
      bloom.width = Math.max(2, Math.floor(W / 2));
      bloom.height = Math.max(2, Math.floor(H / 2));
      grain.width = 256; grain.height = 256;
      generateGrain();
      sampleText();
      generateDiyas();
    }

    function generateGrain() {
      const id = gctx.createImageData(grain.width, grain.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = Math.random() * 255;
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 25;
      }
      gctx.putImageData(id, 0, 0);
    }

    function sampleText() {
      const tc = document.createElement('canvas');
      const tctx = tc.getContext('2d')!;
      const fontSize = Math.min(W * 0.14, 160);
      tc.width = Math.floor(W); tc.height = Math.floor(fontSize * 2);
      tctx.fillStyle = 'white';
      tctx.font = `700 ${fontSize}px "Noto Sans Devanagari", "Mangal", sans-serif`;
      tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
      tctx.fillText('श्री राम', tc.width / 2, tc.height / 2);
      const id = tctx.getImageData(0, 0, tc.width, tc.height);
      ramPoints = [];
      const step = 3;
      for (let y = 0; y < tc.height; y += step) {
        for (let x = 0; x < tc.width; x += step) {
          const i = (y * tc.width + x) * 4;
          if (id.data[i + 3] > 128) ramPoints.push({ x: x - tc.width / 2, y: y - tc.height / 2 });
        }
      }
    }

    function generateDiyas() {
      diyas = [];
      for (let i = 0; i < 40; i++) {
        const z = Math.random();
        diyas.push({
          x: (Math.random() - 0.5) * 1.4,
          z: z, 
          y: 0,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    // ============ DRAW FUNCTIONS ============

    function drawBackground(t: number) {
      const reveal = smoothstep(0, 5, t);
      const cx = W * 0.5, cy = H * 0.55;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.9);
      const ir = Math.floor(lerp(6, 85, reveal));
      const ig = Math.floor(lerp(3, 35, reveal));
      const ib = Math.floor(lerp(10, 22, reveal));
      grad.addColorStop(0, `rgb(${ir},${ig},${ib})`);
      grad.addColorStop(0.4, `rgb(${Math.floor(ir * 0.4)},${Math.floor(ig * 0.3)},${Math.floor(ib * 0.6)})`);
      grad.addColorStop(1, '#020104');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function drawGodRays(t: number) {
      const reveal = smoothstep(2, 4.5, t);
      const fade = smoothstep(16.5, 18, t);
      if (reveal <= 0) return;
      const vis = reveal * (1 - fade);
      const sx = W * 0.5, sy = H * 0.55;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const rayCount = 24;
      const maxLen = Math.max(W, H) * 1.3;
      for (let i = 0; i < rayCount; i++) {
        const baseAngle = (i / rayCount) * Math.PI * 2;
        const angle = baseAngle + t * 0.03 + Math.sin(t * 0.4 + i * 0.7) * 0.04;
        const len = maxLen * (0.55 + 0.45 * Math.sin(t * 0.6 + i * 1.9));
        const flicker = 0.5 + 0.5 * Math.sin(t * 1.2 + i * 2.3);
        const a = 0.08 * vis * flicker;
        if (a < 0.005) continue;
        const ex = sx + Math.cos(angle) * len, ey = sy + Math.sin(angle) * len;
        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, `rgba(255, 210, 130, ${a})`);
        grad.addColorStop(1, 'rgba(255, 130, 40, 0)');
        ctx.fillStyle = grad;
        const w = 0.035 + Math.sin(t * 0.5 + i * 2.1) * 0.015;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle - w) * len, sy + Math.sin(angle - w) * len);
        ctx.lineTo(sx + Math.cos(angle + w) * len, sy + Math.sin(angle + w) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawTemple(t: number, targetCtx: CanvasRenderingContext2D) {
      const edge = smoothstep(2.5, 5, t);
      const full = smoothstep(10, 12, t);
      const fade = smoothstep(16.5, 18, t);
      if (edge <= 0 && full <= 0) return;
      const vis = 1 - fade;
      const cx = W * 0.5;
      const baseY = H * 0.65;
      const s = Math.min(W, H) * 0.0012;
      
      targetCtx.save();
      targetCtx.globalAlpha = vis;
      
      const platColor = 'rgba(16, 9, 5, 0.95)';
      const edgeColor = `rgba(255, 180, 90, ${edge * 0.7 + full * 0.3})`;
      targetCtx.fillStyle = platColor;
      targetCtx.strokeStyle = edgeColor;
      targetCtx.lineWidth = 1.2;

      const platW = 420 * s;
      const tiers = [{ w: platW, h: 25 * s }, { w: platW * 0.85, h: 20 * s }, { w: platW * 0.75, h: 20 * s }];
      let curY = baseY;
      for (const tier of tiers) {
        targetCtx.beginPath();
        targetCtx.rect(cx - tier.w / 2, curY - tier.h, tier.w, tier.h);
        targetCtx.fill(); targetCtx.stroke();
        curY -= tier.h;
      }
      const platTop = curY;

      const mandaW = 300 * s, mandaH = 110 * s;
      targetCtx.beginPath();
      targetCtx.rect(cx - mandaW / 2, platTop - mandaH, mandaW, mandaH);
      targetCtx.fill(); targetCtx.stroke();

      const mainBaseY = platTop - mandaH;
      drawShikhara(cx, mainBaseY, 200 * s, 380 * s, 9, edge, full, true, s, targetCtx);
      drawShikhara(cx - 150 * s, platTop - 40 * s, 95 * s, 200 * s, 6, edge, full, false, s, targetCtx);
      drawShikhara(cx + 150 * s, platTop - 40 * s, 95 * s, 200 * s, 6, edge, full, false, s, targetCtx);
      drawShikhara(cx - 200 * s, platTop - 10 * s, 50 * s, 110 * s, 4, edge, full, false, s, targetCtx);
      drawShikhara(cx + 200 * s, platTop - 10 * s, 50 * s, 110 * s, 4, edge, full, false, s, targetCtx);

      const mainTop = mainBaseY - 380 * s;
      targetCtx.strokeStyle = `rgba(190, 140, 70, ${edge * 0.8 + full * 0.4})`;
      targetCtx.lineWidth = 2.5 * s;
      targetCtx.beginPath();
      targetCtx.moveTo(cx, mainTop); targetCtx.lineTo(cx, mainTop - 70 * s);
      targetCtx.stroke();

      targetCtx.fillStyle = `rgba(255, 200, 100, ${edge * 0.9 + full * 0.5})`;
      targetCtx.beginPath(); targetCtx.arc(cx, mainTop - 75 * s, 7 * s, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.restore();
    }

    function drawShikhara(cx: number, baseY: number, baseW: number, height: number, tiers: number, edge: number, full: number, isMain: boolean, s: number, targetCtx: CanvasRenderingContext2D) {
      const topY = baseY - height;
      const topW = baseW * 0.18;

      targetCtx.fillStyle = 'rgba(16, 9, 5, 0.95)';
      targetCtx.beginPath();
      targetCtx.moveTo(cx - baseW / 2, baseY);
      targetCtx.bezierCurveTo(cx - baseW / 2, baseY - height * 0.35, cx - topW / 2 - baseW * 0.1, baseY - height * 0.78, cx - topW / 2, topY);
      targetCtx.lineTo(cx + topW / 2, topY);
      targetCtx.bezierCurveTo(cx + topW / 2 + baseW * 0.1, baseY - height * 0.78, cx + baseW / 2, baseY - height * 0.35, cx + baseW / 2, baseY);
      targetCtx.closePath();
      targetCtx.fill();

      targetCtx.strokeStyle = `rgba(255, 180, 90, ${edge * 0.75 + full * 0.25})`;
      targetCtx.lineWidth = isMain ? 1.4 : 1;
      targetCtx.stroke();

      targetCtx.strokeStyle = `rgba(255, 165, 75, ${edge * 0.5 + full * 0.3})`;
      targetCtx.lineWidth = 0.7;
      for (let i = 1; i < tiers; i++) {
        const f = i / tiers;
        const y = baseY - height * f;
        const w = lerp(baseW, topW, easeInOutCubic(f));
        targetCtx.beginPath();
        targetCtx.moveTo(cx - w / 2, y); targetCtx.lineTo(cx + w / 2, y);
        targetCtx.stroke();
      }
    }

    function drawWater(t: number) {
      const waterY = H * 0.65;
      const fade = smoothstep(16.5, 18, t);
      
      // 1. Base Water Gradient
      const wGrad = ctx.createLinearGradient(0, waterY, 0, H);
      wGrad.addColorStop(0, `rgba(25, 10, 5, ${1 - fade})`);
      wGrad.addColorStop(1, `rgba(5, 2, 0, ${1 - fade})`);
      ctx.fillStyle = wGrad;
      ctx.fillRect(0, waterY, W, H - waterY);

      // 2. Reflection Layer
      ctx.save();
      ctx.globalAlpha = 0.4 * (1 - fade);
      ctx.translate(0, waterY * 2);
      ctx.scale(1, -1);
      
      // Ripple distortion via horizontal slices
      const sliceH = 4;
      for (let y = waterY; y < H; y += sliceH) {
        const dist = y - waterY;
        const wave = Math.sin((y + t * 80) * 0.04) * (dist * 0.08);
        ctx.drawImage(reflectCanvas, 0, y, W, sliceH, wave, y, W, sliceH);
      }
      ctx.restore();

      // 3. Water Surface Tint & Highlights
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const tintGrad = ctx.createLinearGradient(0, waterY, 0, H);
      tintGrad.addColorStop(0, `rgba(80, 35, 5, ${0.3 * (1 - fade)})`);
      tintGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tintGrad;
      ctx.fillRect(0, waterY, W, H - waterY);
      ctx.restore();

      // 4. Ripple highlights
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(255, 200, 100, ${0.05 * (1 - fade)})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const ry = waterY + (i / 15) * (H - waterY);
        ctx.beginPath();
        for (let x = 0; x < W; x += 20) {
          const y = ry + Math.sin(x * 0.02 + t * 2 + i) * 2;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawDiyas(t: number) {
      const reveal = smoothstep(5, 7, t);
      const fade = smoothstep(16.5, 18, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0) return;

      const waterY = H * 0.65;
      ctx.save();

      for (const diya of diyas) {
        // Perspective mapping
        const perspY = waterY + Math.pow(diya.z, 1.5) * (H - waterY) * 0.8;
        const perspX = W / 2 + diya.x * W * (0.5 + diya.z * 0.8);
        const scale = 0.3 + diya.z * 0.9;
        const flameFlick = Math.sin(t * 8 + diya.phase) * 0.2 + Math.sin(t * 23 + diya.phase) * 0.1;

        // Diya bowl (Brass)
        ctx.fillStyle = `rgba(190, 130, 50, ${vis})`;
        ctx.beginPath();
        ctx.ellipse(perspX, perspY, 12 * scale, 5 * scale, 0, 0, Math.PI);
        ctx.fill();
        
        // Flame
        const fX = perspX;
        const fY = perspY - 8 * scale;
        const fH = (10 + flameFlick * 4) * scale;
        
        const glowGrad = ctx.createRadialGradient(fX, fY, 0, fX, fY, 30 * scale);
        glowGrad.addColorStop(0, `rgba(255, 220, 100, ${0.6 * vis})`);
        glowGrad.addColorStop(0.4, `rgba(255, 140, 40, ${0.2 * vis})`);
        glowGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(fX - 30*scale, fY - 30*scale, 60*scale, 60*scale);

        ctx.fillStyle = `rgba(255, 240, 180, ${vis})`;
        ctx.beginPath();
        ctx.ellipse(fX, fY, 2 * scale, fH * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 180, 60, ${vis})`;
        ctx.beginPath();
        ctx.moveTo(fX - 2*scale, fY);
        ctx.quadraticCurveTo(fX, fY - fH, fX + 2*scale, fY);
        ctx.closePath();
        ctx.fill();

        // Reflection in water
        const reflY = perspY + (perspY - fY);
        const reflGrad = ctx.createLinearGradient(fX, perspY, fX, reflY);
        reflGrad.addColorStop(0, `rgba(255, 200, 80, ${0.5 * vis})`);
        reflGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = reflGrad;
        ctx.fillRect(fX - 3*scale, perspY, 6*scale, reflY - perspY);
      }
      ctx.restore();
    }

    // ============ PARTICLE LOGIC ============

    function spawnDust(t: number) {
      const target = Math.floor(70 * smoothstep(0, 3, t));
      let count = 0;
      for (const p of pool.particles) if (p.active && p.type === 'dust') count++;
      let attempts = 0;
      while (count < target && attempts < 8) {
        const p = pool.spawn(); if (!p) break;
        p.type = 'dust'; p.x = Math.random() * W; p.y = Math.random() * H * 0.7;
        p.vx = (Math.random() - 0.5) * 0.4; p.vy = -0.05 - Math.random() * 0.35;
        p.size = 0.6 + Math.random() * 1.6; p.maxLife = 5 + Math.random() * 5;
        p.life = Math.random() * p.maxLife * 0.4; p.alpha = 0;
        count++; attempts++;
      }
    }

    function spawnPetals(t: number) {
      const intensity = smoothstep(10, 12, t) * (1 - smoothstep(16.5, 18, t));
      if (intensity <= 0) return;
      if (Math.random() > intensity * 0.5) return;
      const p = pool.spawn(); if (!p) return;
      p.type = 'petal'; p.x = Math.random() * W; p.y = -20;
      p.vx = (Math.random() - 0.5) * 1.2; p.vy = 0.6 + Math.random() * 0.8;
      p.size = 4 + Math.random() * 5; p.maxLife = 20; p.life = 0; p.alpha = 0;
      p.rot = Math.random() * Math.PI * 2; p.rotSpd = (Math.random() - 0.5) * 2.5;
    }

    function spawnTextParticles(t: number) {
      if (t < 7.5 || t > 9.5) return;
      if (ramPoints.length === 0) return;
      const target = Math.min(ramPoints.length, 800);
      let active = 0;
      for (const p of pool.particles) if (p.active && p.type === 'text') active++;
      let attempts = 0;
      while (active < target && attempts < 10) {
        const p = pool.spawn(); if (!p) break;
        const pt = ramPoints[Math.floor(Math.random() * ramPoints.length)];
        p.type = 'text';
        p.x = W / 2 + (Math.random() - 0.5) * W * 0.5;
        p.y = H * 0.65 + Math.random() * 50; // Start from river ghat
        p.tx = W / 2 + pt.x; p.ty = H * 0.35 + pt.y;
        p.vx = (Math.random() - 0.5) * 50; p.vy = -Math.random() * 50;
        p.size = 1.2 + Math.random() * 1.6; p.maxLife = 8; p.life = 0; p.alpha = 0;
        p.delay = Math.random() * 1.0;
        active++; attempts++;
      }
    }

    function spawnBirds(t: number) {
      if (t < 5.2 || t > 6.5) return;
      if (birdsSpawned) return;
      birdsSpawned = true;
      const count = 14;
      for (let i = 0; i < count; i++) {
        const p = pool.spawn(); if (!p) break;
        p.type = 'bird';
        p.x = -60 - i * 25 + Math.random() * 15;
        p.y = H * 0.2 + Math.random() * 80 + (i % 3) * 12;
        p.vx = 2.5 + Math.random() * 0.6; p.vy = (Math.random() - 0.5) * 0.2;
        p.size = 7 + Math.random() * 5; p.maxLife = 25; p.life = 0;
        p.alpha = 0.6; p.flap = Math.random() * Math.PI * 2;
      }
    }

    function launchFireworks(t: number) {
      if (t < 10 || t > 12.5) return;
      if (Math.random() > 0.06) return;
      const p = pool.spawn(); if (!p) return;
      p.type = 'firework';
      p.x = W * (0.2 + Math.random() * 0.6);
      p.y = H;
      p.ty = H * (0.15 + Math.random() * 0.2);
      p.vx = 0; p.vy = -8 - Math.random() * 4;
      p.size = 2; p.maxLife = 1.5; p.life = 0; p.alpha = 1;
      p.color = ['#FF9933', '#FFD700', '#FF5555', '#FFFFFF'][Math.floor(Math.random()*4)];
    }

    function updateParticles(dt: number, t: number) {
      for (const p of pool.particles) {
        if (!p.active) continue;
        p.life += dt;

        if (p.type === 'dust') {
          p.x += p.vx; p.y += p.vy;
          p.vx += (Math.random() - 0.5) * 0.04; p.vy += -0.003;
          const lr = p.life / p.maxLife;
          const env = smoothstep(0, 2, t) * (1 - smoothstep(16.5, 18, t));
          p.alpha = smoothstep(0, 0.3, lr) * (1 - smoothstep(0.7, 1, lr)) * 0.7 * env;
          if (p.life > p.maxLife || p.y < -30) {
            p.life = 0; p.x = Math.random() * W; p.y = H * 0.7; p.alpha = 0;
          }
        } else if (p.type === 'petal') {
          p.x += p.vx + Math.sin(t * 0.8 + p.y * 0.01) * 0.4;
          p.y += p.vy; p.rot += p.rotSpd * dt;
          p.alpha = smoothstep(0, 0.1, p.life / p.maxLife) * 0.85 * (1 - smoothstep(16.5, 18, t));
          if (p.y > H * 0.65 || p.life > p.maxLife) pool.release(p);
        } else if (p.type === 'text') {
          if (p.delay > 0) { p.delay -= dt; p.alpha = 0; continue; }
          const dx = p.tx - p.x, dy = p.ty - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.5) {
            const swirl = Math.sin(t * 3 + p.idx) * 0.5;
            const ang = Math.atan2(dy, dx) + swirl;
            const speed = clamp(dist * 4, 80, 600);
            p.vx = Math.cos(ang) * speed; p.vy = Math.sin(ang) * speed;
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.alpha = clamp(p.alpha + dt * 1.5, 0, 0.7);
          } else {
            p.x = p.tx + Math.sin(t * 4 + p.idx) * 0.4;
            p.y = p.ty + Math.cos(t * 4 + p.idx * 1.3) * 0.4;
            p.alpha = clamp(p.alpha + dt * 2, 0, 1);
          }
          if (t > 13) p.alpha *= 1 - smoothstep(13, 14.5, t);
          if (t > 14.5 && p.alpha < 0.01) pool.release(p);
        } else if (p.type === 'bird') {
          p.x += p.vx; p.y += p.vy; p.flap += dt * 9;
          p.alpha = 0.6 * (1 - smoothstep(15.5, 16.5, t));
          if (p.x > W + 60 || p.alpha < 0.01) pool.release(p);
        } else if (p.type === 'firework') {
          if (p.vy < 0) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.15;
            p.trail.push({x: p.x, y: p.y});
            if (p.trail.length > 10) p.trail.shift();
          } else {
            p.maxLife -= dt;
            p.size += dt * 40;
            p.alpha = clamp(p.maxLife / 1.5, 0, 1) * 0.8;
            if (p.maxLife <= 0) pool.release(p);
          }
        }
      }
    }

    function drawParticles(t: number) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const p of pool.particles) {
        if (!p.active || p.alpha <= 0.01) continue;
        if (p.type === 'dust') {
          ctx.globalAlpha = p.alpha;
          const sz = p.size * 6;
          ctx.drawImage(dustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
        } else if (p.type === 'text') {
          ctx.globalAlpha = p.alpha;
          const sz = p.size * 5;
          ctx.drawImage(sparkSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
        } else if (p.type === 'firework') {
          if (p.vy < 0) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = p.color;
            for(let i=0; i<p.trail.length; i++) {
              ctx.globalAlpha = (i / p.trail.length) * 0.8;
              ctx.fillRect(p.trail[i].x, p.trail[i].y, 2, 2);
            }
          } else {
            ctx.globalAlpha = p.alpha;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, p.color);
            grad.addColorStop(0.4, p.color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      for (const p of pool.particles) {
        if (!p.active || p.alpha <= 0.01) continue;
        if (p.type === 'petal') {
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(255, 153, 51, ${p.alpha})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.type === 'bird') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.fillStyle = `rgba(10, 5, 2, ${p.alpha})`;
          const flap = Math.sin(p.flap) * 0.7;
          const sz = p.size;
          ctx.beginPath();
          ctx.moveTo(-sz, 0);
          ctx.quadraticCurveTo(-sz * 0.4, -sz * 0.6 * (1 - flap * 0.5), 0, 0);
          ctx.quadraticCurveTo(sz * 0.4, -sz * 0.6 * (1 - flap * 0.5), sz, 0);
          ctx.quadraticCurveTo(sz * 0.4, sz * 0.15, 0, sz * 0.1);
          ctx.quadraticCurveTo(-sz * 0.4, sz * 0.15, -sz, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    }

    function drawGreeting(t: number) {
      const reveal = smoothstep(13, 14.5, t);
      const fade = smoothstep(16.5, 18, t);
      const vis = reveal * (1 - fade);
      if (vis <= 0.01) return;
      
      const fontSize = Math.min(W * 0.06, 58);
      const cy = H * 0.42;
      const line1 = 'राम नवमी की';
      const line2 = 'हार्दिक शुभकामनाएँ';
      
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${fontSize}px "Noto Sans Devanagari", "Mangal", sans-serif`;

      // Halo
      ctx.globalCompositeOperation = 'screen';
      const haloGrad = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, fontSize * 4);
      haloGrad.addColorStop(0, `rgba(255, 180, 80, ${0.15 * vis})`);
      haloGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'source-over';
      const y1 = cy - fontSize * 0.65, y2 = cy + fontSize * 0.65;

      // 3D Gold Emboss Layering
      ctx.shadowBlur = 30; ctx.shadowColor = `rgba(255, 170, 70, ${vis})`;
      ctx.fillStyle = `rgba(120, 60, 10, ${vis})`;
      ctx.fillText(line1, W / 2, y1); ctx.fillText(line2, W / 2, y2);
      
      ctx.shadowBlur = 15; ctx.shadowColor = `rgba(255, 200, 100, ${vis})`;
      ctx.fillStyle = `rgba(200, 130, 40, ${vis * 0.8})`;
      ctx.fillText(line1, W / 2, y1); ctx.fillText(line2, W / 2, y2);
      
      ctx.shadowBlur = 8; ctx.shadowColor = `rgba(255, 230, 150, ${vis})`;
      ctx.fillStyle = `rgba(255, 225, 160, ${vis})`;
      ctx.fillText(line1, W / 2, y1); ctx.fillText(line2, W / 2, y2);
      
      // Top Highlight for 3D effect
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255, 250, 220, ${vis * 0.6})`;
      ctx.fillText(line1, W / 2 - 0.5, y1 - 1); ctx.fillText(line2, W / 2 - 0.5, y2 - 1);
      ctx.restore();
    }

    // ============ POST-PROCESSING ============

    function applyBloom() {
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(6px) brightness(1.4)';
      bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.6;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bloom, 0, 0, W, H);
      ctx.restore();
    }

    function applyVignette(t: number) {
      const fade = smoothstep(16.5, 18, t);
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${0.55 + fade * 0.4})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.4;
      const ox = Math.floor(Math.random() * 64), oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) ctx.drawImage(grain, x, y);
      }
      ctx.restore();
    }

    // ============ CAMERA ============
    function updateCamera(t: number) {
      cam.zoom = 1 + smoothstep(0, 18, t) * 0.06;
      cam.rot = Math.sin(t * 0.13) * 0.004;
      cam.x = Math.sin(t * 0.28) * 4;
      cam.y = Math.cos(t * 0.22) * 3;
    }

    function applyCamera(targetCtx: CanvasRenderingContext2D) {
      targetCtx.translate(W / 2 + cam.x, H / 2 + cam.y);
      targetCtx.rotate(cam.rot);
      targetCtx.scale(cam.zoom, cam.zoom);
      targetCtx.translate(-W / 2, -H / 2);
    }

    // ============ RENDER PIPELINE ============

    function render(t: number, dt: number) {
      spawnDust(t); spawnPetals(t); spawnTextParticles(t); spawnBirds(t); launchFireworks(t);
      updateParticles(dt, t);
      updateCamera(t);

      // 1. Render Scene to Reflection Canvas first
      rctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      rctx.fillStyle = '#000';
      rctx.fillRect(0, 0, W, H);
      rctx.save();
      applyCamera(rctx);
      drawBackground(t);
      drawGodRays(t);
      drawTemple(t, rctx);
      rctx.restore();

      // 2. Render Main Canvas
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      
      ctx.save();
      applyCamera(ctx);
      drawBackground(t);
      drawGodRays(t);
      drawTemple(t, ctx);
      ctx.restore();

      // 3. Draw Water (uses reflection canvas)
      drawWater(t);

      // 4. Draw Diyas & Particles
      ctx.save();
      applyCamera(ctx);
      drawDiyas(t);
      drawParticles(t);
      ctx.restore();

      // 5. Draw Text
      drawGreeting(t);

      // 6. Master Fade
      const fadeIn = 1 - smoothstep(0, 1.2, t);
      const fadeOut = smoothstep(16.5, 18, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);
      if (fadeAmt > 0.001) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx.fillRect(0, 0, W, H);
      }

      // 7. Post Processing
      applyBloom();
      applyVignette(t);
      applyGrain();
    }

    function loop(now: number) {
      if (!running) return;
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
      lastTime = now;

      if (t < 5.0) birdsSpawned = false;

      // Trigger onComplete
      if (t >= 16.5 && !completedRef.current) {
        completedRef.current = true;
        if (onComplete) onComplete();
      }

      if (t < 18.5) {
        render(t, dt);
      } else if (t < 20) {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
      } else {
        // Auto loop for continuous preview
        startTime = now;
        lastTime = 0;
        completedRef.current = false;
        birdsSpawned = false;
        for (const p of pool.particles) if (p.active) pool.release(p);
      }
      rafId = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: '#000',
      }}
    />
  );
};

export default RamNavamiDivineArrivalIntro;
