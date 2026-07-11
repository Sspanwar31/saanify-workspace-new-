'use client';

import { useEffect, useRef, useState } from 'react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface LoveParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'snow_dust' | 'gold_spark' | 'pink_spark' | 'burst' | 'rose_petal' | 'micro_heart';
  wobble?: number;
}

export default function ValentineCinematicIntro({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<LoveParticle[]>([]);
  const rafId = useRef<number>(0);
  const startTime = useRef<number>(Date.now());
  const [introStep, setIntroStep] = useState<string>('REVEAL');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── 1. CANVAS SIZING ──
    const dpr = window.devicePixelRatio || 1;
    const setSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    // ── 2. PARTICLES GENERATORS ──
    const spawnSpaceDust = (w: number, h: number) => {
      particles.current.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-0.15, 0.15),
        vy: rand(-0.1, -0.3),
        size: rand(0.6, 2.0),
        color: Math.random() > 0.5 ? '#fbcfe8' : '#fffbeb',
        alpha: rand(0.12, 0.4),
        life: 0,
        maxLife: rand(150, 250),
        type: 'snow_dust',
      });
    };

    const spawnGoldSpark = (x: number, y: number) => {
      particles.current.push({
        x, y,
        vx: rand(-0.4, 0.4),
        vy: rand(-0.2, -1.2),
        size: rand(1.2, 3.2),
        color: '#fbbf24',
        alpha: 0.9,
        life: 0,
        maxLife: rand(45, 80),
        type: 'gold_spark',
      });
    };

    const spawnPinkSpark = (x: number, y: number) => {
      particles.current.push({
        x, y,
        vx: rand(-0.4, 0.4),
        vy: rand(-0.2, -1.2),
        size: rand(1.2, 3.2),
        color: '#db2777',
        alpha: 0.9,
        life: 0,
        maxLife: rand(45, 80),
        type: 'pink_spark',
      });
    };

    const spawnCollisionExplosion = (cx: number, cy: number) => {
      const colors = ['#fbbf24', '#f59e0b', '#dc2626', '#db2777', '#ffffff', '#fda4af'];
      for (let i = 0; i < 180; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(1.5, 7.5);
        particles.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(1.5, 4.5),
          color: pick(colors),
          alpha: 1.0,
          life: 0,
          maxLife: rand(80, 150),
          type: 'burst',
        });
      }
    };

    const spawnRosePetal = (w: number) => {
      particles.current.push({
        x: Math.random() * w,
        y: -10,
        vx: rand(-0.4, 0.4),
        vy: rand(0.6, 1.3),
        size: rand(3.5, 7.0),
        color: '#dc2626', // Roli Red Petal
        alpha: rand(0.5, 0.9),
        life: 0,
        maxLife: 450,
        type: 'rose_petal',
        wobble: Math.random() * Math.PI * 2,
      });
    };

    const spawnMicroHeart = (w: number) => {
      particles.current.push({
        x: Math.random() * w,
        y: -10,
        vx: rand(-0.3, 0.3),
        vy: rand(0.5, 1.1),
        size: rand(4.0, 8.0),
        color: '#db2777', // Silk Pink Heart
        alpha: rand(0.4, 0.8),
        life: 0,
        maxLife: 450,
        type: 'micro_heart',
        wobble: Math.random() * Math.PI * 2,
      });
    };

    // ── 3. MAIN CINEMATIC ANIMATION LOOP ──
    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h * 0.38; // Target sky center for collision

      ctx.clearRect(0, 0, w, h);
      const elapsed = Date.now() - startTime.current;

      // ── TIME-BASED STATE MACHINE ──
      let step = 'REVEAL';
      if (elapsed >= 12000) {
        cancelAnimationFrame(rafId.current);
        onComplete();
        return;
      } else if (elapsed >= 11000) {
        step = 'FADE_OUT';
      } else if (elapsed >= 8200) {
        step = 'TEXT_REVEAL';
      } else if (elapsed >= 6500) {
        step = 'MAGIC_COLLISION';
      } else if (elapsed >= 4200) {
        step = 'ORBS_RISE';
      } else if (elapsed >= 2200) {
        step = 'HAND_HEART';
      }

      if (step !== currentStep) {
        setCurrentStep(step);
        if (step === 'MAGIC_COLLISION') {
          spawnCollisionExplosion(cx, cy);
        }
      }

      // ── 4. ATMOSPHERIC BACKGROUNDS ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#030307');
      bgGrad.addColorStop(0.4, '#090514'); // Deep violet
      bgGrad.addColorStop(0.8, '#1b0615'); // Soft rose violet
      bgGrad.addColorStop(1, '#050308');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // एम्बिएंट स्पेस डस्ट जनरेशन
      if (particles.current.filter(p => p.type === 'space_dust').length < 80) {
        spawnSpaceDust(w, h);
      }

      // ── 5. DOUBLE HELIX ORBS RISE (हाथों से ऊपर उठती जादुई रोशनी) ──
      let goldX = cx - 15;
      let goldY = h * 0.58;
      let pinkX = cx + 15;
      let pinkY = h * 0.58;

      if (step === 'ORBS_RISE') {
        const t = (elapsed - 4200) / 2300; // 2.3 seconds rise duration
        const startY = h * 0.58;
        const endY = cy;

        // डीएनए-हेलिक्स स्पाइरल मैथ (Helix trajectory)
        const currentY = startY + (endY - startY) * t;
        const spiralRadius = 38 * (1 - t); // Meeting at the center

        goldX = cx + Math.cos(t * Math.PI * 6) * spiralRadius;
        goldY = currentY;

        pinkX = cx + Math.cos(t * Math.PI * 6 + Math.PI) * spiralRadius;
        pinkY = currentY;

        if (t < 0.98) {
          spawnGoldSpark(goldX, goldY);
          spawnPinkSpark(pinkX, pinkY);
        }
      }

      // ओर्ब्स रेंडरिंग
      if (step === 'ORBS_RISE') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 20;

        // Gold Orb
        ctx.shadowColor = '#fbbf24';
        const gGlow = ctx.createRadialGradient(goldX, goldY, 0, goldX, goldY, 10);
        gGlow.addColorStop(0, '#ffffff');
        gGlow.addColorStop(0.4, '#fbbf24');
        gGlow.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = gGlow;
        ctx.beginPath(); ctx.arc(goldX, goldY, 10, 0, Math.PI * 2); ctx.fill();

        // Pink Orb
        ctx.shadowColor = '#db2777';
        const pGlow = ctx.createRadialGradient(pinkX, pinkY, 0, pinkX, pinkY, 10);
        pGlow.addColorStop(0, '#ffffff');
        pGlow.addColorStop(0.4, '#db2777');
        pGlow.addColorStop(1, 'rgba(219,39,119,0)');
        ctx.fillStyle = pGlow;
        ctx.beginPath(); ctx.arc(pinkX, pinkY, 10, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }

      // गुलाब की पंखुड़ियां और कोमल दिलों की बारिश
      if (step === 'MAGIC_COLLISION' || step === 'TEXT_REVEAL') {
        if (particles.current.filter(p => p.type === 'rose_petal').length < 25) {
          spawnRosePetal(w);
        }
        if (particles.current.filter(p => p.type === 'micro_heart').length < 25) {
          spawnMicroHeart(w);
        }
      }

      // ── 6. UPDATE AND RENDER PARTICLES ──
      particles.current = particles.current.filter(p => {
        p.life += 1;

        if (p.type === 'space_dust') {
          p.x += p.vx; p.y += p.vy;
          p.alpha = Math.max(0, 0.35 * (1 - p.life / p.maxLife));
        } 
        else if (p.type === 'gold_spark' || p.type === 'pink_spark') {
          p.x += p.vx; p.y += p.vy;
          p.alpha = Math.max(0, 0.9 * (1 - p.life / p.maxLife));
        }
        else if (p.type === 'burst') {
          p.vx *= 0.96; p.vy *= 0.96;
          p.vy += 0.02; // Spark gravity
          p.x += p.vx; p.y += p.vy;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        }
        else if (p.type === 'rose_petal') {
          p.y += p.vy;
          if (p.wobble !== undefined) {
            p.wobble += 0.015;
            p.x += Math.sin(p.wobble) * 0.25;
          }
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        }
        else if (p.type === 'micro_heart') {
          p.y += p.vy;
          if (p.wobble !== undefined) {
            p.wobble += 0.02;
            p.x += Math.sin(p.wobble) * 0.2;
          }
          p.alpha = Math.max(0, 0.8 * (1 - p.life / p.maxLife));
        }

        // Draw Single Particle
        if (p.life < p.maxLife && p.y < h + 10 && p.x > -10 && p.x < w + 10) {
          ctx.save();
          ctx.globalAlpha = p.alpha;

          if (p.type === 'burst' || p.type === 'gold_spark' || p.type === 'pink_spark') {
            ctx.globalCompositeOperation = 'lighter';
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
          }

          if (p.type === 'micro_heart') {
            // नन्हे दिल की ड्राइंग (Canvas parametric hearts)
            ctx.fillStyle = p.color;
            ctx.beginPath();
            const r = p.size * 0.3;
            ctx.moveTo(p.x, p.y - r * 0.2);
            ctx.bezierCurveTo(p.x - r * 0.5, p.y - r * 0.7, p.x - r, p.y - r * 0.1, p.x, p.y + r * 0.7);
            ctx.bezierCurveTo(p.x + r, p.y - r * 0.1, p.x + r * 0.5, p.y - r * 0.7, p.x, p.y - r * 0.2);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          return true;
        }
        return false;
      });

      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', setSize);
    };
  }, [onComplete, currentStep]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 select-none overflow-hidden">
      
      {/* 🚀 इनलाइन प्रीमियम एनीमेशन सीएसएस */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes micky-slide-in {
          0% { transform: translateX(-150px) scale(0.9); opacity: 0; }
          100% { transform: translateX(-52px) scale(1.1); opacity: 0.95; }
        }
        @keyframes minnie-slide-in {
          0% { transform: translateX(150px) scale(0.9); opacity: 0; }
          100% { transform: translateX(52px) scale(1.05); opacity: 0.95; }
        }
        @keyframes hand-heart-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.9); filter: drop-shadow(0 0 10px #dc2626); }
          50% { transform: translate(-50%, -50%) scale(1.1); filter: drop-shadow(0 0 25px #fbbf24); }
        }
        @keyframes text-glow-shimmer {
          0% { background-position: 0% 50%; filter: drop-shadow(0 0 15px rgba(219, 39, 119, 0.45)); }
          50% { background-position: 100% 50%; filter: drop-shadow(0 0 35px rgba(251, 191, 36, 0.75)); }
          100% { background-position: 0% 50%; filter: drop-shadow(0 0 15px rgba(219, 39, 119, 0.45)); }
        }
        @keyframes pooja-text-reveal {
          0% { transform: translateY(30px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }
        .animate-micky { animation: micky-slide-in 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-minnie { animation: minnie-slide-in 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-hand-heart { animation: hand-heart-pulse 2s ease-in-out infinite; }
        .animate-love-text {
          background: linear-gradient(135deg, #ffffff 10%, #fbcfe8 35%, #fbbf24 50%, #db2777 65%, #ffffff 90%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: pooja-text-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards, text-glow-shimmer 4s ease infinite;
        }
      `}} />

      {/* ── कैनवास एनीमेशन लेयर ── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* ── LAYER 1: THE CUTE MICKEY & MINNIE SILHOUETTES ── */}
      {(currentStep !== 'TEXT_REVEAL' && currentStep !== 'FADE_OUT') && (
        <div className="absolute bottom-[20%] inset-x-0 flex items-center justify-center pointer-events-none z-20 h-[300px]">
          
          {/* Micky Silhouette (Left Side) */}
          <div 
            className="absolute animate-micky"
            style={{
              transform: currentStep !== 'REVEAL' ? 'translateX(-52px) scale(1.1)' : undefined,
              transition: 'all 0.4s ease-out'
            }}
          >
            <svg width="150" height="250" viewBox="0 0 100 160" fill="#000000" className="opacity-95 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
              {/* Mickey Body & Ears */}
              <circle cx="50" cy="40" r="22" /> {/* Head */}
              <circle cx="28" cy="20" r="13" /> {/* Left Ear */}
              <circle cx="72" cy="20" r="13" /> {/* Right Ear */}
              <ellipse cx="50" cy="100" rx="25" ry="38" /> {/* Torso */}
              
              {/* Left arm extending to make half heart */}
              <path d="M 30 75 Q 10 95, 20 120 T 50 125" fill="none" stroke="#000000" strokeWidth="12" strokeLinecap="round" />
            </svg>
          </div>

          {/* Minnie Silhouette (Right Side) */}
          <div 
            className="absolute animate-minnie"
            style={{
              transform: currentStep !== 'REVEAL' ? 'translateX(52px) scale(1.05)' : undefined,
              transition: 'all 0.4s ease-out'
            }}
          >
            <svg width="150" height="250" viewBox="0 0 100 160" fill="#000000" className="opacity-95 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
              {/* Minnie Body & Ears + Red Bow */}
              <circle cx="50" cy="40" r="21" /> {/* Head */}
              <circle cx="29" cy="21" r="12" /> {/* Left Ear */}
              <circle cx="71" cy="21" r="12" /> {/* Right Ear */}
              <path d="M 120 120 Z" /> {/* Ribbon Placeholder */}
              
              {/* Minnie Dress Dress */}
              <path d="M 50 72 L 20 135 L 80 135 Z" /> 

              {/* Red Bow on Head (Natural colored accent!) */}
              <g transform="translate(50, 18) scale(0.65)">
                <path d="M -15 -10 L 0 0 L -15 10 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M 15 -10 L 0 0 L 15 10 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="6" fill="#ffffff" />
              </g>
              
              {/* Right arm extending to make half heart */}
              <path d="M 70 75 Q 90 95, 80 120 T 50 125" fill="none" stroke="#000000" strokeWidth="12" strokeLinecap="round" />
            </svg>
          </div>

          {/* 💖 THE HAND-HEART GLOWING CONNECTOR (दिलों का कोमल मेल) ── */}
          {(currentStep === 'HAND_HEART' || currentStep === 'ORBS_RISE') && (
            <div 
              className="absolute top-[41%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 animate-hand-heart z-30"
              style={{
                background: 'radial-gradient(circle, rgba(220,38,38,0.7) 0%, rgba(251,191,36,0.3) 50%, transparent 70%)',
                borderRadius: '50%'
              }}
            />
          )}

        </div>
      )}

      {/* ── LAYER 2: CRYSTAL "LOVE IS CONNECTION" GREETING TEXT ── */}
      {(currentStep === 'TEXT_REVEAL' || currentStep === 'FADE_OUT') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 p-6 text-center">
          
          <h1 
            className="animate-love-text text-5xl md:text-7xl font-extrabold tracking-tight select-none mt-[180px] drop-shadow-xl"
            style={{
              fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            Love is Connection
          </h1>

          <p className="mt-4 text-pink-300 text-xs md:text-sm tracking-[0.6em] translate-y-1 uppercase font-semibold animate-pulse">
            Happy Valentine&apos;s Day
          </p>
        </div>
      )}

    </div>
  );
}
