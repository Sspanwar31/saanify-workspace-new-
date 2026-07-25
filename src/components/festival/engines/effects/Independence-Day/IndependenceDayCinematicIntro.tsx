'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
interface NeonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  tp: 'petal' | 'sparkle' | 'confetti' | 'tulsi' | 'ember' | 'kite' | 'streamer' | 'pinwheel' | 'diya';
  tailPoints?: { x: number; y: number }[];
}

interface PresetConfig {
  scale: number;
  speed: number;
  gravity: number;
  maxCount: number;
  minSize: number;
  maxSize: number;
  sway: number;
}

const DEFAULT_COLORS = ['#fde047', '#facc15', '#f97316'];

const PRESET_COLORS: Record<string, string[]> = {
  GANESH_CHATURTHI: ['#fde047', '#facc15', '#fef08a', '#f97316'],
  HANUMAN_JAYANTI: ['#dc2626', '#f97316', '#16a34a', '#fbbf24'],
  NAVRATRI: ['#f43f5e', '#fbcfe8', '#ffffff'],
  REPUBLIC_DAY: ['#ff9933', '#ffffff', '#128807'],
  INDEPENDENCE_DAY: ['#ff9933', '#ffffff', '#128807', '#ffd700', '#ff6b35']
};

const MASTER_PRESET_CONFIGS: Record<string, PresetConfig> = {
  GANESH_CHATURTHI: { scale: 0.55, speed: 1.0,  gravity: 0.003,  maxCount: 90,  minSize: 5,   maxSize: 11, sway: 0.03 },
  HANUMAN_JAYANTI:  { scale: 1.0,  speed: 0.65, gravity: 0.0012, maxCount: 130, minSize: 6,   maxSize: 12, sway: 0.06 },
  NAVRATRI:         { scale: 0.55, speed: 1.0,  gravity: 0.003,  maxCount: 90,  minSize: 5,   maxSize: 11, sway: 0.03 },
  REPUBLIC_DAY:     { scale: 0.55, speed: 0.7,  gravity: 0.003,  maxCount: 120, minSize: 4,   maxSize: 9,  sway: 0.02 },
  INDEPENDENCE_DAY: { scale: 0.50, speed: 0.55, gravity: 0.0008, maxCount: 85,  minSize: 4,   maxSize: 10, sway: 0.07 },
  DEFAULT:          { scale: 0.55, speed: 1.0,  gravity: 0.003,  maxCount: 90,  minSize: 5,   maxSize: 11, sway: 0.03 }
};

export default function NeonEngine({
  preset,
  customColors,
  customScale,
  customGravity,
  customSpeed,
  customMinSize,
  customMaxSize,
  customMaxCount,
  customSway,
}: {
  preset?: string;
  customColors?: string[];
  customScale?: number;
  customGravity?: number | null;
  customSpeed?: number | null;
  customMinSize?: number | null;
  customMaxSize?: number | null;
  customMaxCount?: number | null;
  customSway?: number | null;
}) {
  // 1. Component Load hua ya nahi
  console.log("✅ IndependenceDayCinematicIntro Mounted");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    // 2. useEffect chala ya nahi
    console.log("✅ useEffect Started");

    const canvas = canvasRef.current;
    // 3. Canvas mila ya nahi
    console.log("Canvas =", canvas);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // 4. Context mila ya nahi
    console.log("Context =", ctx);
    if (!ctx) return;

    const normalizedPreset = (preset || '').toUpperCase().trim();
    const colors = customColors || PRESET_COLORS[normalizedPreset] || DEFAULT_COLORS;
    const presetConfig = MASTER_PRESET_CONFIGS[normalizedPreset] || MASTER_PRESET_CONFIGS.DEFAULT;

    const scaleFactor = customScale ?? presetConfig.scale;
    const speedFactor = customSpeed ?? presetConfig.speed;
    const gravityFactor = customGravity ?? presetConfig.gravity;
    const maxParticles = customMaxCount ?? presetConfig.maxCount;
    const minPartSize = customMinSize ?? presetConfig.minSize;
    const maxPartSize = customMaxSize ?? presetConfig.maxSize;
    const swayFactor = customSway ?? presetConfig.sway;

    const particles: NeonParticle[] = [];
    const rn = (min: number, max: number) => min + Math.random() * (max - min);

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 9. Canvas Size
      console.log(canvas.width, canvas.height);
    };
    setSize();
    window.addEventListener('resize', setSize);

    /* ═══════════════════════════════════════════════════════════
       DRAWING FUNCTIONS — Sabhi particle types
       ═══════════════════════════════════════════════════════════ */

    // ── Genda/Rose Petal ──
    const drawPetal = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;
      const grad = c.createLinearGradient(0, -size, 0, size);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(255,255,255,0.15)');
      c.fillStyle = grad;
      c.beginPath();
      c.ellipse(0, 0, size * 0.42, size, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // ── Tulsi Leaf ──
    const drawTulsi = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;
      const grad = c.createLinearGradient(0, -size, 0, size);
      grad.addColorStop(0, '#16a34a');
      grad.addColorStop(1, '#14532d');
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(0, -size);
      c.quadraticCurveTo(size * 0.55, -size * 0.2, 0, size);
      c.quadraticCurveTo(-size * 0.55, -size * 0.2, 0, -size);
      c.closePath();
      c.fill();
      c.strokeStyle = '#15803d';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(0, -size);
      c.lineTo(0, size * 0.5);
      c.stroke();
      c.restore();
    };

    // ── Sindoori Ember ──
    const drawEmber = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;
      const grad = c.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, color);
      grad.addColorStop(1, 'rgba(220,38,38,0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // ── Twinkling Sparkle ──
    const drawSparkle = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha * 0.85;
      c.strokeStyle = color;
      c.lineWidth = 1.0;
      c.shadowBlur = size * 2;
      c.shadowColor = color;
      c.beginPath();
      c.moveTo(-size, 0); c.lineTo(size, 0);
      c.moveTo(0, -size); c.lineTo(0, size);
      c.stroke();
      c.restore();
    };

    // ── Patriotic Confetti (Republic Day — chhoke squares) ──
    const drawConfetti = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.fillRect(-size / 2, -size / 4, size, size * 0.5);
      c.restore();
    };

    /* ═══════════════════════════════════════════════════════════
       INDEPENDENCE DAY KE ALAG DRAWING FUNCTIONS
       ═══════════════════════════════════════════════════════════ */

    // ── 🪁 Mini Patang (Kite) — diamond shape + dor ki tail ──
    const drawKite = (c: CanvasRenderingContext2D, p: NeonParticle) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.globalAlpha = p.alpha;

      const s = p.size;

      // Kite ka diamond body — tricolor fill
      const kiteGrad = c.createLinearGradient(-s * 0.5, 0, s * 0.5, 0);
      kiteGrad.addColorStop(0, '#ff9933');
      kiteGrad.addColorStop(0.48, '#ffffff');
      kiteGrad.addColorStop(0.52, '#ffffff');
      kiteGrad.addColorStop(1, '#128807');
      c.fillStyle = kiteGrad;

      c.beginPath();
      c.moveTo(0, -s);           // top
      c.lineTo(s * 0.6, 0);      // right
      c.lineTo(0, s * 0.8);      // bottom
      c.lineTo(-s * 0.6, 0);     // left
      c.closePath();
      c.fill();

      // Cross stick lines
      c.strokeStyle = 'rgba(0,0,0,0.2)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(0, -s); c.lineTo(0, s * 0.8);
      c.moveTo(-s * 0.6, 0); c.lineTo(s * 0.6, 0);
      c.stroke();

      // Dor (tail) — wavy curve neeche
      if (p.tailPoints && p.tailPoints.length > 1) {
        c.beginPath();
        c.moveTo(0, s * 0.8);
        for (let i = 0; i < p.tailPoints.length; i++) {
          const tp = p.tailPoints[i];
          const localX = tp.x - p.x;
          const localY = tp.y - p.y;
          const cos = Math.cos(-p.rotation);
          const sin = Math.sin(-p.rotation);
          const dx = localX * cos - localY * sin;
          const dy = localX * sin + localY * cos;
          c.lineTo(dx, dy);
        }
        c.strokeStyle = `rgba(180,180,180,${p.alpha * 0.5})`;
        c.lineWidth = 0.7;
        c.stroke();

        // Tail pe chhote bows
        for (let i = 2; i < p.tailPoints.length; i += 4) {
          const tp = p.tailPoints[i];
          const localX = tp.x - p.x;
          const localY = tp.y - p.y;
          const cos = Math.cos(-p.rotation);
          const sin = Math.sin(-p.rotation);
          const dx = localX * cos - localY * sin;
          const dy = localX * sin + localY * cos;
          c.fillStyle = `rgba(255,100,100,${p.alpha * 0.6})`;
          c.beginPath();
          c.arc(dx, dy, 1.5, 0, Math.PI * 2);
          c.fill();
        }
      }

      c.restore();
    };

    // ── 🌸 Gainda ka Phool (Marigold) — Red Fort wala orange-red ──
    const drawMarigold = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;

      const petalCount = 6;
      for (let i = 0; i < petalCount; i++) {
        const ang = (i / petalCount) * Math.PI * 2;
        c.save();
        c.rotate(ang);
        c.fillStyle = color;
        c.beginPath();
        c.ellipse(0, -size * 0.55, size * 0.3, size * 0.5, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      const centerGrad = c.createRadialGradient(0, 0, 0, 0, 0, size * 0.28);
      centerGrad.addColorStop(0, '#fde047');
      centerGrad.addColorStop(1, '#f59e0b');
      c.fillStyle = centerGrad;
      c.beginPath();
      c.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    // ── 🎊 Lambe Streamers (Phooljhadi ke patte) — twisting ribbons ──
    const drawStreamer = (c: CanvasRenderingContext2D, p: NeonParticle) => {
      c.save();
      c.translate(p.x, p.y);
      c.globalAlpha = p.alpha;

      const s = p.size;
      const waveAmp = Math.sin(p.life * 0.08) * s * 0.6;

      c.beginPath();
      c.moveTo(0, -s * 2.5);
      c.quadraticCurveTo(waveAmp, -s * 0.8, 0, 0);
      c.quadraticCurveTo(-waveAmp * 0.7, s * 0.8, 0, s * 2.5);
      c.strokeStyle = p.color;
      c.lineWidth = s * 0.25;
      c.lineCap = 'round';
      c.stroke();

      c.globalAlpha = p.alpha * 0.3;
      c.strokeStyle = '#ffffff';
      c.lineWidth = s * 0.08;
      c.beginPath();
      c.moveTo(0.5, -s * 2.3);
      c.quadraticCurveTo(waveAmp + 0.5, -s * 0.8, 0.5, 0);
      c.stroke();

      c.restore();
    };

    // ── ✨ Tricolor Chakri (Spinning Pinwheel) — Charkha inspired ──
    const drawPinwheel = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;

      const blades = 4;
      const bladeColors = ['#ff9933', '#ffffff', '#128807', '#ffd700'];

      for (let i = 0; i < blades; i++) {
        const ang = (i / blades) * Math.PI * 2;
        c.save();
        c.rotate(ang);
        c.fillStyle = bladeColors[i];
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(size * 0.5, -size * 0.3, 0, -size);
        c.quadraticCurveTo(-size * 0.15, -size * 0.4, 0, 0);
        c.fill();
        c.restore();
      }

      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(0, 0, size * 0.1, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.15)';
      c.lineWidth = 0.5;
      c.stroke();

      c.restore();
    };

    // ── 🕯️ Diya Jyoti (Warm Glow Spark) ──
    const drawDiya = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;

      const outerGlow = c.createRadialGradient(0, 0, 0, 0, 0, size * 2.5);
      outerGlow.addColorStop(0, 'rgba(255,200,50,0.4)');
      outerGlow.addColorStop(0.5, 'rgba(255,140,20,0.1)');
      outerGlow.addColorStop(1, 'rgba(255,100,0,0)');
      c.fillStyle = outerGlow;
      c.beginPath();
      c.arc(0, 0, size * 2.5, 0, Math.PI * 2);
      c.fill();

      const coreGrad = c.createRadialGradient(0, 0, 0, 0, 0, size);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, '#ffe066');
      coreGrad.addColorStop(1, 'rgba(255,160,20,0)');
      c.fillStyle = coreGrad;
      c.beginPath();
      c.arc(0, 0, size, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    /* ═══════════════════════════════════════════════════════════
       ANIMATION LOOP
       ═══════════════════════════════════════════════════════════ */
    // 6. animate Function ke andar sabse pehli line
    const animate = (time: number) => {
      console.log("Frame", time);

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // 7. Drawing Sky
      console.log("Drawing Sky");

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.015;

      // 8. Timeline Check
      console.log("Elapsed =", timeRef.current);

      /* ─────────────────────────────────────────────────────
         PARTICLE SPAWNING — Har preset alag
         ───────────────────────────────────────────────────── */
      if (particles.length < maxParticles) {

        // ═══ GANESH CHATURTHI ═══
        if (normalizedPreset === 'GANESH_CHATURTHI' && Math.random() < 0.35) {
          const isPetal = Math.random() < 0.7;
          const randCol = Math.random();
          let petalColor = '#fde047';
          if (randCol < 0.5) petalColor = '#fde047';
          else if (randCol < 0.8) petalColor = '#facc15';
          else petalColor = '#f97316';

          particles.push({
            x: rn(-20, w + 20), y: rn(-30, -10),
            vx: rn(-0.5, 0.5), vy: rn(1.0, 2.4) * speedFactor,
            size: isPetal ? rn(minPartSize, maxPartSize) * scaleFactor : rn(minPartSize * 0.6, maxPartSize * 0.6) * scaleFactor,
            alpha: 1, color: isPetal ? petalColor : '#ffffff',
            rotation: rn(0, Math.PI * 2), rotSpeed: rn(-0.015, 0.015),
            life: 0, maxLife: rn(320, 520),
            tp: isPetal ? 'petal' : 'sparkle'
          });
        }

        // ═══ HANUMAN JAYANTI ═══
        else if (normalizedPreset === 'HANUMAN_JAYANTI' && Math.random() < 0.38) {
          const randType = Math.random();
          let np: NeonParticle | null = null;

          if (randType < 0.35) {
            np = { x: rn(-20, w + 20), y: rn(-30, -10), vx: rn(-0.7, 0.7), vy: rn(1.1, 2.2) * speedFactor, size: rn(minPartSize, maxPartSize) * scaleFactor * 1.1, alpha: 1, color: '#16a34a', rotation: rn(0, Math.PI * 2), rotSpeed: rn(-0.02, 0.02), life: 0, maxLife: rn(340, 500), tp: 'tulsi' };
          } else if (randType < 0.70) {
            np = { x: rn(-20, w + 20), y: rn(-30, -10), vx: rn(-0.9, 0.9), vy: rn(0.8, 1.8) * speedFactor, size: rn(minPartSize * 0.4, maxPartSize * 0.4) * scaleFactor, alpha: 1, color: Math.random() < 0.55 ? '#dc2626' : '#f97316', rotation: rn(0, Math.PI * 2), rotSpeed: rn(-0.01, 0.01), life: 0, maxLife: rn(240, 380), tp: 'ember' };
          } else {
            np = { x: rn(-20, w + 20), y: rn(-30, -10), vx: rn(-1.4, 1.4), vy: rn(1.6, 3.2) * speedFactor, size: rn(minPartSize * 0.4, maxPartSize * 0.5) * scaleFactor, alpha: 1, color: '#fbbf24', rotation: rn(0, Math.PI * 2), rotSpeed: 0, life: 0, maxLife: rn(180, 320), tp: 'sparkle' };
          }
          if (np) particles.push(np);
        }

        // ═══ NAVRATRI ═══
        else if (normalizedPreset === 'NAVRATRI' && Math.random() < 0.3) {
          particles.push({
            x: rn(-20, w + 20), y: rn(-30, -10),
            vx: rn(-0.4, 0.4), vy: rn(0.8, 2.0) * speedFactor,
            size: rn(minPartSize, maxPartSize) * scaleFactor,
            alpha: 1, color: Math.random() < 0.7 ? '#f43f5e' : '#fbcfe8',
            rotation: rn(0, Math.PI * 2), rotSpeed: rn(-0.01, 0.01),
            life: 0, maxLife: rn(350, 550), tp: 'petal'
          });
        }

        // ═══════════════════════════════════════════════════════
        // ★ REPUBLIC DAY — Fauji, disciplined, controlled
        // ═══════════════════════════════════════════════════════
        else if (normalizedPreset === 'REPUBLIC_DAY' && Math.random() < 0.35) {
          const isConfetti = Math.random() < 0.65;
          particles.push({
            x: rn(-20, w + 20), y: rn(-30, -10),
            vx: rn(-0.5, 0.5),
            vy: (isConfetti ? rn(1.0, 2.2) : rn(0.8, 1.8)) * speedFactor,
            size: (isConfetti ? rn(minPartSize, maxPartSize) : rn(minPartSize * 0.4, maxPartSize * 0.5)) * scaleFactor,
            alpha: 1,
            color: isConfetti
              ? colors[Math.floor(Math.random() * 3)]
              : (Math.random() < 0.5 ? '#ffd700' : '#ffffff'),
            rotation: rn(0, Math.PI * 2), rotSpeed: rn(-0.02, 0.02),
            life: 0, maxLife: rn(250, 420),
            tp: isConfetti ? 'confetti' : 'sparkle'
          });
        }

        // ═══════════════════════════════════════════════════════
        // ★ INDEPENDENCE DAY — Azaad, udti hui, free-spirited
        // ═══════════════════════════════════════════════════════
        else if (normalizedPreset === 'INDEPENDENCE_DAY' && Math.random() < 0.32) {
          const roll = Math.random();
          let np: NeonParticle | null = null;

          if (roll < 0.28) {
            np = {
              x: rn(-10, w + 10), y: rn(-40, -10),
              vx: rn(-0.8, 0.8),
              vy: rn(0.3, 1.0) * speedFactor,
              size: rn(minPartSize * 1.2, maxPartSize * 1.4) * scaleFactor,
              alpha: 1, color: '#ff9933',
              rotation: rn(-0.3, 0.3),
              rotSpeed: rn(-0.025, 0.025),
              life: 0, maxLife: rn(400, 650),
              tp: 'kite',
              tailPoints: []
            };
          } else if (roll < 0.50) {
            const marigoldColors = ['#ff6b35', '#f97316', '#ea580c', '#dc2626'];
            np = {
              x: rn(-20, w + 20), y: rn(-30, -10),
              vx: rn(-0.6, 0.6),
              vy: rn(0.6, 1.6) * speedFactor,
              size: rn(minPartSize * 1.0, maxPartSize * 1.1) * scaleFactor,
              alpha: 1,
              color: marigoldColors[Math.floor(Math.random() * marigoldColors.length)],
              rotation: rn(0, Math.PI * 2), rotSpeed: rn(-0.012, 0.012),
              life: 0, maxLife: rn(300, 500),
              tp: 'petal'
            };
          } else if (roll < 0.72) {
            np = {
              x: rn(-20, w + 20), y: rn(-40, -10),
              vx: rn(-1.0, 1.0),
              vy: rn(0.8, 2.0) * speedFactor,
              size: rn(minPartSize * 0.8, maxPartSize) * scaleFactor,
              alpha: 1,
              color: colors[Math.floor(Math.random() * colors.length)],
              rotation: rn(0, Math.PI * 2), rotSpeed: rn(-0.03, 0.03),
              life: 0, maxLife: rn(280, 440),
              tp: 'streamer'
            };
          } else if (roll < 0.88) {
            np = {
              x: rn(-20, w + 20), y: rn(-30, -10),
              vx: rn(-0.5, 0.5),
              vy: rn(0.5, 1.4) * speedFactor,
              size: rn(minPartSize * 0.8, maxPartSize * 0.9) * scaleFactor,
              alpha: 1, color: '#ff9933',
              rotation: rn(0, Math.PI * 2), rotSpeed: rn(0.08, 0.18),
              life: 0, maxLife: rn(260, 400),
              tp: 'pinwheel'
            };
          } else {
            np = {
              x: rn(-20, w + 20), y: rn(-20, -5),
              vx: rn(-0.3, 0.3),
              vy: rn(0.2, 0.7) * speedFactor,
              size: rn(minPartSize * 0.5, maxPartSize * 0.6) * scaleFactor,
              alpha: 1, color: '#ffe066',
              rotation: 0, rotSpeed: 0,
              life: 0, maxLife: rn(200, 350),
              tp: 'diya'
            };
          }
          if (np) particles.push(np);
        }
      }

      /* ─────────────────────────────────────────────────────
         UPDATE & DRAW — Har particle type ka apna logic
         ───────────────────────────────────────────────────── */
      // 7. Drawing Gate
      console.log("Drawing Gate");

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.tp === 'kite') {
          p.vy += gravityFactor * 0.3;
          if (Math.random() < 0.02) p.vy -= 0.15;
        }
        else if (p.tp === 'diya') {
          p.vy += gravityFactor * 0.5;
        }
        else if (p.tp === 'pinwheel') {
          p.vy += gravityFactor * 0.7;
          p.vx += Math.sin(p.life * 0.12) * 0.04;
        }
        else if (p.tp === 'streamer') {
          p.vy += gravityFactor * 0.8;
        }
        else {
          p.vy += gravityFactor;
        }

        const individualSway = Math.sin(timeRef.current * 1.5 + p.y * 0.01 + p.rotation) * swayFactor;
        p.vx = p.vx * 0.98 + individualSway;

        if (p.tp !== 'sparkle' && p.tp !== 'ember' && p.tp !== 'diya') {
          p.rotation += p.rotSpeed;
        }
        if (p.tp === 'pinwheel') {
          p.rotation += p.rotSpeed * 0.5;
        }

        if (p.tp === 'kite') {
          if (!p.tailPoints) p.tailPoints = [];
          p.tailPoints.push({ x: p.x, y: p.y + p.size * 0.8 });
          if (p.tailPoints.length > 12) p.tailPoints.shift();
        }

        const lt = p.life / p.maxLife;
        p.alpha = lt < 0.85 ? 1 : (1 - lt) / 0.15;

        if (p.life >= p.maxLife || p.y > h + 40) {
          particles.splice(i, 1);
          continue;
        }

        // 7. Drawing Flag
        console.log("Drawing Flag");

        if (p.tp === 'petal') {
          if (normalizedPreset === 'INDEPENDENCE_DAY') {
            drawMarigold(ctx, p.x, p.y, p.size, p.alpha, p.rotation, p.color);
          } else {
            drawPetal(ctx, p.x, p.y, p.size, p.alpha, p.rotation, p.color);
          }
        } else if (p.tp === 'sparkle') {
          drawSparkle(ctx, p.x, p.y, p.size, p.alpha, p.color);
        } else if (p.tp === 'confetti') {
          drawConfetti(ctx, p.x, p.y, p.size, p.alpha, p.rotation, p.color);
        } else if (p.tp === 'tulsi') {
          drawTulsi(ctx, p.x, p.y, p.size, p.alpha, p.rotation);
        } else if (p.tp === 'ember') {
          drawEmber(ctx, p.x, p.y, p.size, p.alpha, p.color);
        } else if (p.tp === 'kite') {
          drawKite(ctx, p);
        } else if (p.tp === 'streamer') {
          drawStreamer(ctx, p);
        } else if (p.tp === 'pinwheel') {
          drawPinwheel(ctx, p.x, p.y, p.size, p.alpha, p.rotation);
        } else if (p.tp === 'diya') {
          drawDiya(ctx, p.x, p.y, p.size, p.alpha);
        }
      }

      rafId.current = requestAnimationFrame(animate);
    };

    // 5. requestAnimationFrame Start hua ya nahi
    console.log("🚀 Animation Started");
    animate();

    return () => {
      // 10. Component Unmount ho raha hai kya
      console.log("❌ Intro Unmounted");
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [
    preset,
    customSpeed,
    customColors,
    customScale,
    customGravity,
    customMinSize,
    customMaxSize,
    customMaxCount,
    customSway
  ]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }} />;
}
