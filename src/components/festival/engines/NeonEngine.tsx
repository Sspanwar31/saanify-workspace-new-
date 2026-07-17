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
  tp: 'petal' | 'sparkle' | 'confetti' | 'tulsi' | 'ember'; 
}

const DEFAULT_COLORS = ['#fde047', '#facc15', '#f97316'];

const PRESET_COLORS: Record<string, string[]> = {
  GANESH_CHATURTHI: ['#fde047', '#facc15', '#fef08a', '#f97316'],
  HANUMAN_JAYANTI: ['#dc2626', '#f97316', '#16a34a', '#fbbf24'], 
  NAVRATRI: ['#f43f5e', '#fbcfe8', '#ffffff'],
  REPUBLIC_DAY: ['#ff9933', '#ffffff', '#128807'],
  INDEPENDENCE_DAY: ['#ff9933', '#ffffff', '#128807']
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
}: {
  preset?: string;
  customColors?: string[];
  customScale?: number;
  customGravity?: number | null;
  customSpeed?: number | null;
  customMinSize?: number | null;
  customMaxSize?: number | null;
  customMaxCount?: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const timeRef = useRef<number>(0);
  
  const spawnDebugCount = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const normalizedPreset = (preset || '').toUpperCase().trim();
    const colors = customColors || PRESET_COLORS[normalizedPreset] || DEFAULT_COLORS;

    // ── 🚀 Step 1: Default/Incoming Prop values ──
    let scaleFactor = customScale ?? 0.55;
    let speedFactor = customSpeed ?? 1.0;
    let gravityFactor = customGravity ?? 0.003; 
    let maxParticles = customMaxCount ?? 90;
    let minPartSize = customMinSize ?? 5;
    let maxPartSize = customMaxSize ?? 11;

    // ── 🚀 Step 2: HANUMAN JAYANTI INTERNAL OVERRIDE (Bypasses missing parent props) ──
    if (normalizedPreset === 'HANUMAN_JAYANTI') {
      scaleFactor = customScale ?? 1.0;         // Normal visible size
      speedFactor = customSpeed ?? 0.65;        // Comfortable falling speed
      gravityFactor = customGravity ?? 0.0012;   // Gentle floating gravity
      maxParticles = customMaxCount ?? 130;      // Optimal beautiful density
      minPartSize = customMinSize ?? 6.0;
      maxPartSize = customMaxSize ?? 12.0;
    }

    // ── 🛠️ MOUNT DIAGNOSTICS LOG ──
    console.log(
      `%c🟢 NeonEngine Mounted! %c\nPreset: "${preset}"\nScale Factor: ${scaleFactor} (Prop: ${customScale})\nSpeed Factor: ${speedFactor} (Prop: ${customSpeed})\nGravity Factor: ${gravityFactor} (Prop: ${customGravity})\nMax Count: ${maxParticles} (Prop: ${customMaxCount})\nMin Size: ${minPartSize} (Prop: ${customMinSize})\nMax Size: ${maxPartSize} (Prop: ${customMaxSize})`,
      "color: #22c55e; font-weight: bold; font-size: 13px;",
      "color: #a3a3a3; font-size: 11px;"
    );

    const particles: NeonParticle[] = [];
    const rn = (min: number, max: number) => min + Math.random() * (max - min);

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Genda/Rose Petal Drawing
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

    // Sacred Tulsi Leaf Drawing
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

    // Sindoori Glowing Ember Drawing
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

    // Twinkling Sparkles
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

    // Patriotic Confetti
    const drawConfetti = (c: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, rot: number, color: string) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.fillRect(-size / 2, -size / 4, size, size * 0.5);
      c.restore();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.015;

      // ── SCREEN-WIDE EMITTER ──
      if (particles.length < maxParticles) {
        if (normalizedPreset === 'GANESH_CHATURTHI' && Math.random() < 0.35) {
          const isPetal = Math.random() < 0.7;
          const randCol = Math.random();
          let petalColor = '#fde047'; 
          if (randCol < 0.5) {
            petalColor = '#fde047';
          } else if (randCol < 0.8) {
            petalColor = '#facc15'; 
          } else {
            petalColor = '#f97316'; 
          }

          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.5, 0.5),
            vy: rn(1.0, 2.4) * speedFactor, 
            size: isPetal ? rn(minPartSize, maxPartSize) * scaleFactor : rn(minPartSize * 0.6, maxPartSize * 0.6) * scaleFactor,
            alpha: 1,
            color: isPetal ? petalColor : '#ffffff', 
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.015, 0.015),
            life: 0,
            maxLife: rn(320, 520),
            tp: isPetal ? 'petal' : 'sparkle'
          });
        } 
        // 🚀 HANUMAN JAYANTI EMITTER
        else if (normalizedPreset === 'HANUMAN_JAYANTI' && Math.random() < 0.38) {
          const randType = Math.random();
          let newParticle: NeonParticle | null = null;
          
          if (randType < 0.35) {
            // 1. Tulsi Leaves
            newParticle = {
              x: rn(-20, w + 20),
              y: rn(-30, -10),
              vx: rn(-0.7, 0.7),
              vy: rn(1.1, 2.2) * speedFactor,
              size: rn(minPartSize, maxPartSize) * scaleFactor * 1.1,
              alpha: 1,
              color: '#16a34a',
              rotation: rn(0, Math.PI * 2),
              rotSpeed: rn(-0.02, 0.02),
              life: 0,
              maxLife: rn(340, 500),
              tp: 'tulsi'
            };
          } else if (randType < 0.70) {
            // 2. Sindoori Embers
            newParticle = {
              x: rn(-20, w + 20),
              y: rn(-30, -10),
              vx: rn(-0.9, 0.9),
              vy: rn(0.8, 1.8) * speedFactor,
              size: rn(minPartSize * 0.4, maxPartSize * 0.4) * scaleFactor,
              alpha: 1,
              color: Math.random() < 0.55 ? '#dc2626' : '#f97316',
              rotation: rn(0, Math.PI * 2),
              rotSpeed: rn(-0.01, 0.01),
              life: 0,
              maxLife: rn(240, 380),
              tp: 'ember'
            };
          } else {
            // 3. Golden Pawan Dust
            newParticle = {
              x: rn(-20, w + 20),
              y: rn(-30, -10),
              vx: rn(-1.4, 1.4), 
              vy: rn(1.6, 3.2) * speedFactor,
              size: rn(minPartSize * 0.4, maxPartSize * 0.5) * scaleFactor,
              alpha: 1,
              color: '#fbbf24', 
              rotation: rn(0, Math.PI * 2),
              rotSpeed: 0,
              life: 0,
              maxLife: rn(180, 320),
              tp: 'sparkle'
            };
          }

          if (newParticle) {
            particles.push(newParticle);
            if (spawnDebugCount.current < 5) {
              spawnDebugCount.current++;
              console.log(
                `%c✨ Debug: Spawned Hanuman Jayanti Particle %c(${spawnDebugCount.current}/5) \nType: "${newParticle.tp}" \nColor: "${newParticle.color}"`,
                "color: #eab308; font-weight: bold;",
                "color: #a3a3a3;"
              );
            }
          }
        } 
        else if (normalizedPreset === 'NAVRATRI' && Math.random() < 0.3) {
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.4, 0.4),
            vy: rn(0.8, 2.0) * speedFactor,
            size: rn(minPartSize, maxPartSize) * scaleFactor,
            alpha: 1,
            color: Math.random() < 0.7 ? '#f43f5e' : '#fbcfe8',
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.01, 0.01),
            life: 0,
            maxLife: rn(350, 550),
            tp: 'petal'
          });
        } else if (['REPUBLIC_DAY', 'INDEPENDENCE_DAY'].includes(normalizedPreset) && Math.random() < 0.3) {
          const cols = ['#ff9933', '#ffffff', '#128807'];
          particles.push({
            x: rn(-20, w + 20),
            y: rn(-30, -10),
            vx: rn(-0.6, 0.6),
            vy: rn(1.2, 2.6) * speedFactor,
            size: rn(minPartSize, maxPartSize) * scaleFactor,
            alpha: 1,
            color: cols[Math.floor(Math.random() * cols.length)],
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.03, 0.03),
            life: 0,
            maxLife: rn(250, 420),
            tp: 'confetti'
          });
        }
      }

      // ── UPDATE & DRAW PARTICLES ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        p.vy += gravityFactor;

        const windWave = normalizedPreset === 'HANUMAN_JAYANTI' ? 0.035 : 0.015;
        p.vx += Math.sin(timeRef.current + p.y * 0.01) * windWave;
        
        if (p.tp !== 'sparkle' && p.tp !== 'ember') p.rotation += p.rotSpeed;

        const lt = p.life / p.maxLife;
        p.alpha = lt < 0.85 ? 1 : (1 - lt) / 0.15;

        if (p.life >= p.maxLife || p.y > h + 30) {
          particles.splice(i, 1);
          continue;
        }

        if (p.tp === 'petal') {
          drawPetal(ctx, p.x, p.y, p.size, p.alpha, p.rotation, p.color);
        } else if (p.tp === 'sparkle') {
          drawSparkle(ctx, p.x, p.y, p.size, p.alpha, p.color);
        } else if (p.tp === 'confetti') {
          drawConfetti(ctx, p.x, p.y, p.size, p.alpha, p.rotation, p.color);
        } else if (p.tp === 'tulsi') {
          drawTulsi(ctx, p.x, p.y, p.size, p.alpha, p.rotation); 
        } else if (p.tp === 'ember') {
          drawEmber(ctx, p.x, p.y, p.size, p.alpha, p.color); 
        }
      }

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
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
    customMaxCount
  ]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }} />;
}
