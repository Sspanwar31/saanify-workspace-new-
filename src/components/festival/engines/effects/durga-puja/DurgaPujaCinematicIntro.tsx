'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
}

// ============ MATH & EASING ============
const smoothstep = (a: number, b: number, t: number) => {
  if (b === a) return t < a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// ============ HIGH-PERFORMANCE PARTICLE POOL ============
type PType = 'dhunuchi_smoke' | 'spark' | 'petal' | 'sindoor_dust';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; active: boolean; gravity: number; drag: number;
  color: string; rot: number; rotSpeed: number;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dhunuchi_smoke', active: false, gravity: 0, drag: 0.98,
        color: '#fff', rot: 0, rotSpeed: 0
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    if (!p) return null;
    p.active = true; p.life = 0; p.alpha = 0; p.rot = Math.random() * Math.PI * 2;
    return p;
  }
  release(p: Particle) {
    if (!p) return;
    p.active = false;
    this.free.push(p.idx);
  }
}

export default function DurgaPujaCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (!document.getElementById('durga-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'durga-google-fonts';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [onComplete]);

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
    let handoverTriggered = false;

    // Offscreen Canvas for Bloom & Post-processing
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    const pool = new ParticlePool(4000);

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = Math.floor(W * DPR);
      canvas!.height = Math.floor(H * DPR);
      ctx?.setTransform(DPR, 0, 0, DPR, 0, 0);
      
      bloom.width = Math.max(2, Math.floor(W / 2));
      bloom.height = Math.max(2, Math.floor(H / 2));
      grain.width = 256; grain.height = 256;
      generateGrain();
    }

    function generateGrain() {
      const id = gctx.createImageData(grain.width, grain.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = Math.random() * 255;
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 18;
      }
      gctx.putImageData(id, 0, 0);
    }

    // =========================================================================
    // SCENE 1: CRIMSON SUNSET SKY & DHUNUCHI SMOKE (0.0s -> 3.5s)
    // =========================================================================
    function drawCrimsonAtmosphere(t: number) {
      const vis = smoothstep(0.0, 1.0, t) * (1 - smoothstep(9.0, 9.5, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Deep Crimson Red & Gold Sky Gradient
      const skyGrad = ctx!.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W);
      skyGrad.addColorStop(0.0, '#4a050d');
      skyGrad.addColorStop(0.4, '#240206');
      skyGrad.addColorStop(1.0, '#0a0002');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2: MAAN DURGA TRINETRA, BINDI & GOLD NATH (3.0s -> 6.5s)
    // =========================================================================
    function drawDivineEyesAndNath(t: number) {
      const vis = smoothstep(2.8, 3.8, t) * (1 - smoothstep(6.2, 6.8, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0022;
      const cx = W / 2;
      const cy = H * 0.42;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Divine Red/Gold Halo behind Eyes
      const halo = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 220 * s);
      halo.addColorStop(0, `rgba(255, 60, 0, ${0.4 * vis})`);
      halo.addColorStop(0.5, `rgba(255, 180, 0, ${0.15 * vis})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = halo;
      ctx!.fillRect(cx - 220 * s, cy - 220 * s, 440 * s, 440 * s);

      // --- TRINETRA (Third Eye on Forehead) ---
      const eye3Y = cy - 60 * s;
      ctx!.fillStyle = '#FFFDF0';
      ctx!.beginPath();
      ctx!.moveTo(cx, eye3Y - 22 * s);
      ctx!.quadraticCurveTo(cx + 14 * s, eye3Y, cx, eye3Y + 22 * s);
      ctx!.quadraticCurveTo(cx - 14 * s, eye3Y, cx, eye3Y - 22 * s);
      ctx!.fill();

      // Third Eye Pupil
      ctx!.fillStyle = '#d90429';
      ctx!.beginPath();
      ctx!.arc(cx, eye3Y, 6 * s, 0, Math.PI * 2);
      ctx!.fill();

      // --- MAIN DIVINE EYES (Left & Right) ---
      const drawEye = (x: number, y: number, isRight: boolean) => {
        ctx!.save();
        ctx!.translate(x, y);

        // Eye Outline (Alpona Style Curved Eyes)
        ctx!.strokeStyle = '#FFFDF0';
        ctx!.lineWidth = 3.5 * s;
        ctx!.beginPath();
        ctx!.moveTo(-45 * s, 0);
        ctx!.quadraticCurveTo(0, -25 * s, 45 * s, 0);
        ctx!.quadraticCurveTo(0, 30 * s, -45 * s, 0);
        ctx!.stroke();

        // Eye Pupil
        ctx!.fillStyle = '#0a0002';
        ctx!.beginPath();
        ctx!.arc(0, 2 * s, 16 * s, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.fillStyle = '#FFFDF0';
        ctx!.beginPath();
        ctx!.arc(-4 * s, -3 * s, 5 * s, 0, Math.PI * 2);
        ctx!.fill();

        // Eyelash Extension
        ctx!.strokeStyle = '#FFFDF0';
        ctx!.lineWidth = 2 * s;
        ctx!.beginPath();
        ctx!.moveTo(isRight ? 42 * s : -42 * s, 0);
        ctx!.quadraticCurveTo(isRight ? 60 * s : -60 * s, -15 * s, isRight ? 65 * s : -65 * s, -25 * s);
        ctx!.stroke();

        ctx!.restore();
      };

      drawEye(cx - 65 * s, cy, false);
      drawEye(cx + 65 * s, cy, true);

      // --- CRIMSON SINDOOR BINDI ---
      ctx!.fillStyle = '#d90429';
      ctx!.shadowBlur = 15 * s;
      ctx!.shadowColor = '#ff0022';
      ctx!.beginPath();
      ctx!.arc(cx, cy - 25 * s, 10 * s, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;

      // --- GOLDEN NATH (Nose Ring) ---
      const nathX = cx - 25 * s;
      const nathY = cy + 35 * s;
      ctx!.strokeStyle = '#FFD700';
      ctx!.lineWidth = 3 * s;
      ctx!.beginPath();
      ctx!.arc(nathX, nathY, 28 * s, 0, Math.PI * 2);
      ctx!.stroke();

      // Nath Chain to Ear
      ctx!.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      ctx!.lineWidth = 1.5 * s;
      ctx!.beginPath();
      ctx!.moveTo(nathX - 28 * s, nathY);
      ctx!.quadraticCurveTo(cx - 100 * s, cy + 10 * s, cx - 130 * s, cy - 10 * s);
      ctx!.stroke();

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 3: 10-ARMED GOLDEN TRISHUL STRIKE & SHAKTI WAVE (6.5s -> 9.8s)
    // =========================================================================
    function drawGoldenTrishulImpact(t: number) {
      const vis = smoothstep(6.2, 7.0, t) * (1 - smoothstep(9.5, 10.0, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0022;
      const cx = W / 2;
      const cy = H * 0.48;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // 10-ARMED SHAKTI RADIANCE (Aura Blades)
      const radVis = smoothstep(6.5, 7.5, t);
      ctx!.strokeStyle = `rgba(255, 215, 0, ${0.25 * radVis})`;
      ctx!.lineWidth = 2 * s;
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI * 0.8 + (i / 9) * Math.PI * 1.6;
        ctx!.beginPath();
        ctx!.moveTo(cx, cy + 80 * s);
        ctx!.lineTo(cx + Math.cos(angle) * 260 * s, cy + 80 * s + Math.sin(angle) * 260 * s);
        ctx!.stroke();
      }

      // 3D GOLDEN TRISHUL (Striking Center)
      const strikeY = cy - 200 * s + smoothstep(6.5, 7.2, t) * (200 * s);
      ctx!.translate(cx, strikeY);

      const shaftW = 12 * s;
      const shaftH = 360 * s;
      const topY = -shaftH / 2;

      const goldGrad = ctx!.createLinearGradient(-shaftW, 0, shaftW, 0);
      goldGrad.addColorStop(0.0, '#FFFDF0');
      goldGrad.addColorStop(0.25, '#FFD700');
      goldGrad.addColorStop(0.65, '#D4AF37');
      goldGrad.addColorStop(1.0, '#3D2800');

      ctx!.fillStyle = goldGrad;
      ctx!.fillRect(-shaftW / 2, topY, shaftW, shaftH);

      // Center Spear Tip
      ctx!.beginPath();
      ctx!.moveTo(0, topY - 75 * s);
      ctx!.lineTo(-12 * s, topY);
      ctx!.lineTo(12 * s, topY);
      ctx!.closePath();
      ctx!.fill();

      // Left Curved Outer Prong
      ctx!.beginPath();
      ctx!.moveTo(-48 * s, topY - 48 * s);
      ctx!.quadraticCurveTo(-38 * s, topY + 12 * s, -18 * s, topY + 50 * s, -6 * s, topY + 28 * s);
      ctx!.quadraticCurveTo(-22 * s, topY - 8 * s, -35 * s, topY - 22 * s, -48 * s, topY - 48 * s);
      ctx!.closePath();
      ctx!.fill();

      // Right Curved Outer Prong
      ctx!.beginPath();
      ctx!.moveTo(48 * s, topY - 48 * s);
      ctx!.quadraticCurveTo(38 * s, topY + 12 * s, 18 * s, topY + 50 * s, 6 * s, topY + 28 * s);
      ctx!.quadraticCurveTo(22 * s, topY - 8 * s, 35 * s, topY - 22 * s, 48 * s, topY - 48 * s);
      ctx!.closePath();
      ctx!.fill();

      ctx!.strokeStyle = '#FFFFFF';
      ctx!.lineWidth = 1.8 * s;
      ctx!.stroke();

      // EXPANDING SHAKTI SHOCKWAVE RING
      if (t > 7.1) {
        const ringT = (t - 7.1) * 2;
        const ringR = ringT * 350 * s;
        ctx!.strokeStyle = `rgba(255, 215, 0, ${Math.max(0, 1 - ringT)})`;
        ctx!.lineWidth = 4 * s;
        ctx!.beginPath();
        ctx!.arc(0, topY + shaftH, ringR, 0, Math.PI * 2);
        ctx!.stroke();
      }

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 4: 3D METALLIC GOLD SANSKRIT SHLOKA & GREETING (9.5s -> 13.0s)
    // =========================================================================
    function draw3DGoldShlokaText(t: number) {
      const vis = smoothstep(9.3, 10.2, t) * (1 - smoothstep(12.5, 13.0, t));
      if (vis <= 0.001) return;

      const scale = 0.92 + smoothstep(9.3, 11.2, t) * 0.08;
      const cx = W / 2;
      const cy = H * 0.44;
      const s = Math.min(W, H) * 0.0022;

      ctx!.save();
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.globalAlpha = vis;

      // Dark Crimson Backdrop for Text
      const darkGrad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.65);
      darkGrad.addColorStop(0, 'rgba(35, 3, 7, 0.96)');
      darkGrad.addColorStop(1, 'rgba(8, 0, 2, 0.99)');
      ctx!.fillStyle = darkGrad;
      ctx!.fillRect(0, 0, W, H);

      ctx!.translate(cx, cy);
      ctx!.scale(scale, scale);

      // 1. SANSKRIT SHLOKA ("या देवी सर्वभूतेषु शक्ति-रूपेण संस्थिता")
      const fontS1 = Math.min(W * 0.065, 58);
      ctx!.font = `700 ${fontS1}px "Tiro Devanagari Hindi", serif`;

      ctx!.strokeStyle = '#0a0002';
      ctx!.lineWidth = fontS1 * 0.08;
      ctx!.strokeText('या देवी सर्वभूतेषु शक्ति-रूपेण संस्थिता', 0, -30 * s);

      const goldShloka = ctx!.createLinearGradient(0, -30 * s - fontS1, 0, -30 * s);
      goldShloka.addColorStop(0.0, '#FFFDF0');
      goldShloka.addColorStop(0.3, '#FFD700');
      goldShloka.addColorStop(0.7, '#D4AF37');
      goldShloka.addColorStop(1.0, '#593800');

      ctx!.shadowBlur = 30;
      ctx!.shadowColor = 'rgba(255, 215, 0, 0.85)';
      ctx!.fillStyle = goldShloka;
      ctx!.fillText('या देवी सर्वभूतेषु शक्ति-रूपेण संस्थिता', 0, -30 * s);

      // 2. MAIN TITLE ("SHUBHO DURGA PUJA 2027")
      const fontS2 = Math.min(W * 0.052, 48);
      const cyEng = 45 * s;
      ctx!.font = `900 ${fontS2}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 0;
      ctx!.strokeStyle = '#0a0002';
      ctx!.lineWidth = fontS2 * 0.08;
      ctx!.strokeText('SHUBHO DURGA PUJA 2027', 0, cyEng);

      const goldEng = ctx!.createLinearGradient(0, cyEng - fontS2 / 2, 0, cyEng + fontS2 / 2);
      goldEng.addColorStop(0.0, '#FFFFFF');
      goldEng.addColorStop(0.4, '#FFE680');
      goldEng.addColorStop(0.8, '#C68A00');
      goldEng.addColorStop(1.0, '#2E1A00');

      ctx!.shadowBlur = 25;
      ctx!.shadowColor = 'rgba(255, 200, 0, 0.75)';
      ctx!.fillStyle = goldEng;
      ctx!.fillText('SHUBHO DURGA PUJA 2027', 0, cyEng);

      ctx!.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============
    function spawnParticles(t: number) {
      // Dhunuchi Smoke Plumes from Bottom (0s -> 9s)
      if (t < 9.0 && Math.random() < 0.7) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'dhunuchi_smoke'; p.x = Math.random() * W; p.y = H + 30;
        p.vx = (Math.random() - 0.5) * 1.2; p.vy = -1.5 - Math.random() * 2.2;
        p.size = 35 + Math.random() * 45; p.maxLife = 5; p.life = 0; p.alpha = 0;
        p.color = '#ffd1a3';
      }

      // Amber Sparks from Dhunuchi (0s -> 9s)
      if (t < 9.0 && Math.random() < 0.6) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'spark'; p.x = Math.random() * W; p.y = H - 20;
        p.vx = (Math.random() - 0.5) * 2; p.vy = -2 - Math.random() * 3;
        p.size = 1.5 + Math.random() * 2.5; p.maxLife = 2; p.life = 0; p.alpha = 1;
        p.gravity = -0.1; p.drag = 0.97; p.color = '#ff9900';
      }

      // Marigold Flower Petal Rain (3.5s -> 13.0s)
      if (t > 3.5 && t < 13.0 && Math.random() < 0.5) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'petal'; p.x = Math.random() * W; p.y = -20;
        p.vx = (Math.random() - 0.5) * 1.5; p.vy = 1.5 + Math.random() * 2.2;
        p.size = 5 + Math.random() * 5; p.maxLife = 5; p.life = 0; p.alpha = 0;
        p.color = Math.random() < 0.6 ? '#ff9900' : '#ffcc00';
        p.rotSpeed = (Math.random() - 0.5) * 0.12;
      }

      // Sindoor Red Dust (3.0s -> 13.0s)
      if (t > 3.0 && t < 13.0 && Math.random() < 0.4) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'sindoor_dust'; p.x = Math.random() * W; p.y = Math.random() * H;
        p.vx = (Math.random() - 0.5) * 0.8; p.vy = -0.3 - Math.random() * 0.6;
        p.size = 1.5 + Math.random() * 2.5; p.maxLife = 4; p.life = 0; p.alpha = 0;
        p.color = '#d90429';
      }
    }

    function updateAndDrawParticles(dt: number, t: number) {
      ctx!.save();

      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active) continue;

        p.life += dt;
        const lr = p.life / p.maxLife;

        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'dhunuchi_smoke') {
          p.alpha = smoothstep(0, 0.3, lr) * (1 - smoothstep(0.6, 1, lr)) * 0.3 * (t < 9 ? 1 : 1 - smoothstep(9, 9.5, t));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, 'rgba(255, 200, 150, 0.35)');
            grad.addColorStop(1, 'rgba(255, 200, 150, 0)');
            ctx!.fillStyle = grad;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fill();
          }
        } else if (p.type === 'spark' || p.type === 'sindoor_dust') {
          ctx!.globalCompositeOperation = 'lighter';
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.8, 1, lr));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fill();
          }
          ctx!.globalCompositeOperation = 'source-over';
        } else if (p.type === 'petal') {
          p.rot += p.rotSpeed;
          p.alpha = smoothstep(0, 0.2, lr) * (1 - smoothstep(0.8, 1, lr));
          if (p.alpha > 0.01) {
            ctx!.save();
            ctx!.globalAlpha = p.alpha;
            ctx!.translate(p.x, p.y);
            ctx!.rotate(p.rot);
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }
      ctx!.restore();
    }

    // ============ POST-PROCESSING ============
    function applyBloom() {
      const bloomAlpha = 0.4;
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(4px) brightness(1.2)';
      bctx.drawImage(canvas!, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.globalAlpha = bloomAlpha;
      ctx!.drawImage(bloom, 0, 0, W, H);
      ctx!.restore();
    }

    function applyVignette() {
      const grad = ctx!.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.88);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx!.save();
      ctx!.globalCompositeOperation = 'overlay';
      ctx!.globalAlpha = 0.25;
      const ox = Math.floor(Math.random() * 64), oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) ctx!.drawImage(grain, x, y);
      }
      ctx!.restore();
    }

    // ============ MAIN RENDER PIPELINE ============
    function render(t: number, dt: number) {
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx!.fillStyle = '#0a0002';
      ctx!.fillRect(0, 0, W, H);

      spawnParticles(t);

      drawCrimsonAtmosphere(t);
      drawDivineEyesAndNath(t);
      drawGoldenTrishulImpact(t);
      draw3DGoldShlokaText(t);

      updateAndDrawParticles(dt, t);

      const fadeIn = 1 - smoothstep(0, 0.8, t);
      const fadeOut = smoothstep(12.5, 13.0, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx!.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx!.fillRect(0, 0, W, H);
      }

      applyBloom();
      applyVignette();
      applyGrain();
    }

    function loop(now: number) {
      if (!running) return;
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
      lastTime = now;

      if (t >= 12.8 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 13.0) {
        render(t, dt);
      } else {
        ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx!.fillStyle = '#000000';
        ctx!.fillRect(0, 0, W, H);
      }
      rafId = requestAnimationFrame(loop);
    }

    document.fonts.ready.then(() => {
      resize();
      window.addEventListener('resize', resize);
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-[99999] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#0a0002',
        }}
      />
      {/* SKIP BUTTON */}
      <button
        onClick={() => onComplete?.()}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-[100] px-4 py-2 rounded-full border border-amber-400/30 bg-black/40 text-amber-200 backdrop-blur-md text-[10px] sm:text-xs font-bold tracking-[0.2em] transition-all duration-300 hover:bg-amber-400/20 hover:border-amber-300/70"
      >
        SKIP →
      </button>
    </div>
  );
}
