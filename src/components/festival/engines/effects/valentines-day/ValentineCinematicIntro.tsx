'use client';

import { useEffect, useRef, useState } from 'react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES & CONFIG
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
  type: 'space_dust' | 'gold_spark' | 'pink_spark' | 'heart_glow';
  wobble?: number;
}

const DURATION = 12.0; // 12 Seconds Cinematic Experience

export default function ValentineCinematicIntro({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<LoveParticle[]>([]);
  const rafId = useRef<number>(0);
  const startTime = useRef<number>(Date.now());
  const [currentStep, setCurrentStep] = useState<string>('NEBULA_START');

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

    // ── 2. PARTICLE SPONSORS ──
    const spawnSpaceDust = (w: number, h: number) => {
      particles.current.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-0.15, 0.15),
        vy: rand(-0.1, -0.3),
        size: rand(0.5, 1.8),
        color: Math.random() > 0.5 ? '#fbcfe8' : '#fffbeb', // Soft pink/white
        alpha: rand(0.1, 0.35),
        life: 0,
        maxLife: rand(150, 250),
        type: 'space_dust',
      });
    };

    const spawnGoldSpark = (x: number, y: number) => {
      particles.current.push({
        x, y,
        vx: rand(-0.4, 0.4),
        vy: rand(-0.2, -1.2),
        size: rand(1.2, 3.2),
        color: '#fbbf24', // Warm gold
        alpha: 0.9,
        life: 0,
        maxLife: rand(50, 90),
        type: 'gold_spark',
      });
    };

    const spawnPinkSpark = (x: number, y: number) => {
      particles.current.push({
        x, y,
        vx: rand(-0.4, 0.4),
        vy: rand(-0.2, -1.2),
        size: rand(1.2, 3.2),
        color: '#db2777', // Silk rose pink
        alpha: 0.9,
        life: 0,
        maxLife: rand(50, 90),
        type: 'pink_spark',
      });
    };

    const spawnHeartPulseGlow = (cx: number, cy: number, size: number) => {
      // दिल के धड़कने पर फैलने वाले छल्ले (Heartbeat Pulse Waves)
      particles.current.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        size: size * 5,
        color: 'rgba(219,39,119,0.22)',
        alpha: 0.5,
        life: 0,
        maxLife: 55,
        type: 'heart_glow',
      });
    };

    // ── 3. MAIN ANIMATION LOOP ──
    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h * 0.42;

      ctx.clearRect(0, 0, w, h);
      const elapsed = Date.now() - startTime.current;

      // ── TIME-BASED STATE MACHINE ──
      let step = 'NEBULA_START';
      if (elapsed >= 12000) {
        cancelAnimationFrame(rafId.current);
        onComplete();
        return;
      } else if (elapsed >= 11000) {
        step = 'FADE_OUT';
      } else if (elapsed >= 8500) {
        step = 'TEXT_REVEAL';
      } else if (elapsed >= 5500) {
        step = 'HEART_PULSE_ACTIVE';
      } else if (elapsed >= 4500) {
        step = 'SOFT_FUSION';
      } else if (elapsed >= 1500) {
        step = 'TWO_LIGHTS_ORBIT';
      }

      if (step !== currentStep) {
        setCurrentStep(step);
        // कोलिशन के समय कोमल स्वर्णिम छल्ला छोड़ें
        if (step === 'SOFT_FUSION') {
          spawnHeartPulseGlow(cx, cy, 35);
        }
      }

      // ── 4. BACKGROUND COSMIC AURORA (अंतरिक्ष का कोमल धुआँ) ──
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

      // ── 5. TWO LIGHTS MAGNETIC ORBIT (अनंतता का स्वर्णिम-गुलाबी नृत्य) ──
      let goldX = cx - w * 0.25;
      let goldY = cy;
      let pinkX = cx + w * 0.25;
      let pinkY = cy;

      if (step === 'TWO_LIGHTS_ORBIT') {
        const t = (elapsed - 1500) / 3000; // 3 seconds orbit duration
        const loopScale = Math.min(w, h) * 0.28;
        const angle = t * Math.PI * 2; // Complete 360 loop

        // 🚀 Bernoulli's Lemniscate (Infinity Symbol `∞` Math)
        const denom = 1 + Math.sin(angle) * Math.sin(angle);
        
        // स्वर्णिम लाइट (Left to center)
        goldX = cx + (loopScale * Math.cos(angle)) / denom;
        goldY = cy + (loopScale * Math.sin(angle) * Math.cos(angle)) / denom;

        // गुलाबी लाइट (दाएं से केंद्र - 180 degree out of phase)
        const pAngle = angle + Math.PI;
        const pDenom = 1 + Math.sin(pAngle) * Math.sin(pAngle);
        pinkX = cx + (loopScale * Math.cos(pAngle)) / pDenom;
        pinkY = cy + (loopScale * Math.sin(pAngle) * Math.cos(pAngle)) / pDenom;

        // स्पार्कल्स का उत्सर्जन (Emit sparkling trails)
        if (t < 0.98) {
          spawnGoldSpark(goldX, goldY);
          spawnPinkSpark(pinkX, pinkY);
        }
      }

      // ── 6. DRAW ORBITS (ओर्ब्स का रेंडरिंग) ──
      if (step === 'TWO_LIGHTS_ORBIT') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 30;

        // Gold Orb
        ctx.shadowColor = '#fbbf24';
        const gGlow = ctx.createRadialGradient(goldX, goldY, 0, goldX, goldY, 15);
        gGlow.addColorStop(0, '#ffffff');
        gGlow.addColorStop(0.3, '#fbbf24');
        gGlow.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = gGlow;
        ctx.beginPath(); ctx.arc(goldX, goldY, 15, 0, Math.PI * 2); ctx.fill();

        // Pink Orb
        ctx.shadowColor = '#db2777';
        const pGlow = ctx.createRadialGradient(pinkX, pinkY, 0, pinkX, pinkY, 15);
        pGlow.addColorStop(0, '#ffffff');
        pGlow.addColorStop(0.3, '#db2777');
        pGlow.addColorStop(1, 'rgba(219,39,119,0)');
        ctx.fillStyle = pGlow;
        ctx.beginPath(); ctx.arc(pinkX, pinkY, 15, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }

      // ── 7. HEART BEAT PULSE TRIGGER (दिल की धड़कन पल्स) ──
      if (step === 'HEART_PULSE_ACTIVE' || step === 'TEXT_REVEAL') {
        const hPulseCycle = ((elapsed - 5500) % 1500) / 1500; // Complete beat every 1.5s
        
        // डबल बीट इफ़ेक्ट (Double-pump heartbeat physics)
        let pulseFactor = 1.0;
        if (hPulseCycle < 0.12) {
          pulseFactor = 1.0 + Math.sin((hPulseCycle / 0.12) * Math.PI) * 0.08;
          if (Math.random() < 0.08) spawnHeartPulseGlow(cx, cy, 35); // लहरों को जन्म दें
        } else if (hPulseCycle > 0.18 && hPulseCycle < 0.28) {
          pulseFactor = 1.0 + Math.sin(((hPulseCycle - 0.18) / 0.1) * Math.PI) * 0.04;
        }

        // 3D-feel Glowing Crystal Heart Weaving
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pulseFactor, pulseFactor);
        
        // दिल का आकार (Parametric Heart formula)
        ctx.beginPath();
        const sc = Math.min(w, h) * 0.012;
        for (let i = 0; i <= 150; i++) {
          const ht = (i / 150) * Math.PI * 2;
          const px = 16 * Math.pow(Math.sin(ht), 3) * sc;
          const py = -(13 * Math.cos(ht) - 5 * Math.cos(2 * ht) - 2 * Math.cos(3 * ht) - Math.cos(4 * ht)) * sc;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();

        // सुवर्ण-गुलाबी मेटैलिक ग्रेडिएंट (Rich Gold-Pink Metallic Chrome)
        const hGrad = ctx.createLinearGradient(-15 * sc, -15 * sc, 15 * sc, 15 * sc);
        hGrad.addColorStop(0, '#db2777'); // Pink silk
        hGrad.addColorStop(0.35, '#fda4af'); // Soft rose
        hGrad.addColorStop(0.5, '#ffffff'); // White reflection
        hGrad.addColorStop(0.65, '#fef08a'); // Gold shimmer
        hGrad.addColorStop(1, '#ca8a04'); // Dark brass gold
        
        ctx.fillStyle = hGrad;
        ctx.shadowColor = '#db2777'; ctx.shadowBlur = 30 * pulseFactor;
        ctx.fill();
        ctx.restore();
      }

      // ── 8. UPDATE AND DRAW PARTICLES ──
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
        else if (p.type === 'heart_glow') {
          p.size += 3.5; // लहरों का विस्तार (Expanding ripples)
          p.alpha = Math.max(0, 0.5 * (1 - p.life / p.maxLife));
        }

        // Draw Particle
        if (p.life < p.maxLife && p.y < h + 20 && p.x > -20 && p.x < w + 20) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          
          if (p.type === 'heart_glow') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            // दिल के आकार का धड़कता छल्ला ड्रा करें
            const rsc = p.size * 0.05;
            for (let i = 0; i <= 100; i++) {
              const ht = (i / 100) * Math.PI * 2;
              const rpx = p.x + 16 * Math.pow(Math.sin(ht), 3) * rsc;
              const rpy = p.y - (13 * Math.cos(ht) - 5 * Math.cos(2 * ht) - 2 * Math.cos(3 * ht) - Math.cos(4 * ht)) * rsc;
              i === 0 ? ctx.moveTo(rpx, rpy) : ctx.lineTo(rpx, rpy);
            }
            ctx.closePath();
            ctx.stroke();
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
      
      {/* 🚀 इनलाइन लक्ज़री क्रोम ट्रांजिशन सीएसएस */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes text-glow-pulse {
          0% { filter: drop-shadow(0 0 15px rgba(219, 39, 119, 0.45)); }
          50% { filter: drop-shadow(0 0 35px rgba(251, 191, 36, 0.75)); }
          100% { filter: drop-shadow(0 0 15px rgba(219, 39, 119, 0.45)); }
        }
        @keyframes love-text-reveal {
          0% { transform: translateY(30px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }
        .animate-love-text {
          background: linear-gradient(135deg, #ffffff 10%, #fbcfe8 35%, #fbbf24 50%, #db2777 65%, #ffffff 90%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: love-text-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards, text-glow-pulse 4s ease infinite;
        }
      `}} />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* ── LAYER 1: CINEMATIC LOVE TEXT REVEAL ── */}
      {(currentStep === 'TEXT_REVEAL' || currentStep === 'FADE_OUT') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 p-6 text-center">
          
          {/* Main Message */}
          <h1 
            className="animate-love-text text-5xl md:text-7xl font-extrabold tracking-tight select-none mt-[180px] drop-shadow-xl"
            style={{
              fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            Love is Connection
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-pink-300 text-xs md:text-sm tracking-[0.6em] translate-y-1 uppercase font-semibold animate-pulse">
            Happy Valentine&apos;s Day
          </p>
        </div>
      )}

    </div>
  );
}
