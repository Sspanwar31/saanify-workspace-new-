'use client';

import { useEffect, useRef, useState } from 'react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface CinematicParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'snow' | 'gold_dust' | 'ice_dust' | 'burst' | 'smoke';
  wobble?: number;
}

export default function ChristmasCinematicIntro({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<CinematicParticle[]>([]);
  const rafId = useRef<number>(0);
  const startTime = useRef<number>(Date.now());
  const [currentStep, setCurrentStep] = useState<string>('SNOW_START');

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

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    // ── 2. PARTICLES GENERATORS ──
    const spawnSnow = (w: number) => {
      particles.current.push({
        x: Math.random() * w,
        y: -10,
        vx: rand(-0.2, 0.2),
        vy: rand(0.5, 1.2),
        size: rand(0.8, 2.5),
        color: '#ffffff',
        alpha: rand(0.4, 0.9),
        life: 0,
        maxLife: 400,
        type: 'snow',
        wobble: Math.random() * Math.PI * 2,
      });
    };

    const spawnReindeerBreath = (x: number, y: number) => {
      // रेन्डियर की सांस (Soft expanding warm fog circles)
      particles.current.push({
        x,
        y,
        vx: rand(0.2, 0.8),
        vy: rand(-0.1, 0.1),
        size: rand(3, 8),
        color: '#f1f5f9',
        alpha: 0.35,
        life: 0,
        maxLife: 60,
        type: 'smoke',
      });
    };

    const spawnCollisionExplosion = (cx: number, cy: number) => {
      const colors = ['#fbbf24', '#38bdf8', '#38bdf8', '#ffffff', '#ef4444'];
      for (let i = 0; i < 150; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(1.5, 6.5);
        particles.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(1.5, 4.5),
          color: pick(colors),
          alpha: 1,
          life: 0,
          maxLife: rand(80, 140),
          type: 'burst',
        });
      }
    };

    // ── 3. MAIN CINEMATIC ANIMATION LOOP ──
    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // टाइमर कैलकुलेशन
      const elapsed = Date.now() - startTime.current;

      // ── TIME-BASED STATE MACHINE ──
      let step = 'SNOW_START';
      if (elapsed >= 11500) {
        // HANDOVER TO DASHBOARD
        cancelAnimationFrame(rafId.current);
        onComplete();
        return;
      } else if (elapsed >= 10200) {
        step = 'FADE_OUT';
      } else if (elapsed >= 7200) {
        step = 'CRYSTAL_TEXT_REVEAL';
      } else if (elapsed >= 6200) {
        step = 'MAGIC_COLLISION';
      } else if (elapsed >= 4200) {
        step = 'HANDS_DUST_ACTIVE';
      } else if (elapsed >= 3000) {
        step = 'SANTA_STOP_BREATH';
      } else if (elapsed >= 1000) {
        step = 'SANTA_ENTRY';
      }

      if (step !== currentStep) {
        setCurrentStep(step);
        // टक्कर के समय एक बार धमाका रेंडर करें
        if (step === 'MAGIC_COLLISION') {
          spawnCollisionExplosion(cx, cy - 30);
        }
      }

      // ── 4. BACKGROUND GLOWS (Moonlight & Ambient Atmosphere) ──
      // चांदनी (Moonlight Glow)
      const moonGlow = ctx.createRadialGradient(w * 0.8, h * 0.2, 0, w * 0.8, h * 0.2, 280);
      moonGlow.addColorStop(0, 'rgba(219, 234, 254, 0.16)');
      moonGlow.addColorStop(0.5, 'rgba(219, 234, 254, 0.04)');
      moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(0, 0, w, h);

      // जादुई कोमल एम्बिएंट बेस
      if (step === 'MAGIC_COLLISION' || step === 'CRYSTAL_TEXT_REVEAL') {
        const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 350);
        centerGlow.addColorStop(0, 'rgba(251, 191, 36, 0.08)');
        centerGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.03)');
        centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = centerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 400, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 5. SPONSORING DYNAMIC EMITTERS ──
      // हमेशा कोमल बर्फबारी बनाए रखें
      if (particles.current.filter(p => p.type === 'snow').length < 280) {
        spawnSnow(w);
      }

      // रेन्डियर की गर्म सांस छोड़ना
      if (step === 'SANTA_STOP_BREATH' && Math.random() < 0.2) {
        const santaX = w * 0.35 + 180; // रेन्डियर के मुंह की अनुमानित स्थिति
        const santaY = h * 0.28;
        spawnReindeerBreath(santaX, santaY);
      }

      // जादुई हाथों से उठती धूल (Spiraling Helix Helix of Gold and Ice-blue)
      if (step === 'HANDS_DUST_ACTIVE') {
        const t = (elapsed - 4200) / 2000; // 0 to 1
        
        // स्वर्णिम धूल (बाएं से केंद्र की तरफ)
        const goldX = w * 0.1 + (cx - w * 0.1) * t;
        const goldY = cy + Math.sin(t * Math.PI * 4) * 60 - 30;
        
        // बर्फीली नीली धूल (दाएं से केंद्र की तरफ)
        const iceX = w * 0.9 - (w * 0.9 - cx) * t;
        const iceY = cy + Math.cos(t * Math.PI * 4) * 60 - 30;

        if (t < 0.95) {
          // Gold particles
          for (let i = 0; i < 3; i++) {
            particles.current.push({
              x: goldX + rand(-10, 10),
              y: goldY + rand(-10, 10),
              vx: rand(-0.3, 0.3),
              vy: rand(-0.5, -1.5),
              size: rand(1.5, 3.5),
              color: '#fbbf24',
              alpha: 0.9,
              life: 0,
              maxLife: 60,
              type: 'gold_dust',
            });
          }
          // Ice particles
          for (let i = 0; i < 3; i++) {
            particles.current.push({
              x: iceX + rand(-10, 10),
              y: iceY + rand(-10, 10),
              vx: rand(-0.3, 0.3),
              vy: rand(-0.5, -1.5),
              size: rand(1.5, 3.5),
              color: '#38bdf8',
              alpha: 0.9,
              life: 0,
              maxLife: 60,
              type: 'ice_dust',
            });
          }
        }
      }

      // ── 6. UPDATE AND RENDER PARTICLES ──
      particles.current = particles.current.filter(p => {
        p.life += 1;

        if (p.type === 'snow') {
          p.vy += 0.005; // Gentle gravity
          p.x += p.vx;
          p.y += p.vy;
          if (p.wobble !== undefined) {
            p.wobble += 0.02;
            p.x += Math.sin(p.wobble) * 0.18;
          }
          const progress = p.life / p.maxLife;
          p.alpha = Math.max(0, 1 - progress * progress);
        } 
        else if (p.type === 'smoke') {
          p.x += p.vx;
          p.y += p.vy;
          p.size += 0.15; // Expansion
          p.alpha = Math.max(0, 0.35 * (1 - p.life / p.maxLife));
        }
        else if (p.type === 'gold_dust' || p.type === 'ice_dust') {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha = Math.max(0, 0.9 * (1 - p.life / p.maxLife));
        }
        else if (p.type === 'burst') {
          p.vx *= 0.96; // Deceleration
          p.vy *= 0.96;
          p.vy += 0.02; // Spark gravity fall
          p.x += p.vx;
          p.y += p.vy;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        }

        // Draw Particle
        if (p.life < p.maxLife && p.y < h + 10 && p.x > -10 && p.x < w + 10) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          
          if (p.type === 'burst' || p.type === 'gold_dust' || p.type === 'ice_dust') {
            ctx.globalCompositeOperation = 'lighter';
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
          }

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
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
      
      {/* 🚀 इनलाइन प्रीमियम ट्रांजिशन सीएसएस एनीमेशन */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes moon-fade-in {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes santa-glide-in {
          0% { transform: translateX(-110%) translateY(50px) rotate(8deg); }
          100% { transform: translateX(35vw) translateY(0px) rotate(0deg); }
        }
        @keyframes crystal-shimmer {
          0% { background-position: 0% 50%; filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.4)); }
          50% { background-position: 100% 50%; filter: drop-shadow(0 0 35px rgba(251, 191, 36, 0.8)); }
          100% { background-position: 0% 50%; filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.4)); }
        }
        @keyframes text-pop-glow {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-moon { animation: moon-fade-in 2.5s ease-out forwards; }
        .animate-santa { animation: santa-glide-in 2.0s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-crystal-text {
          background: linear-gradient(135deg, #ffffff 20%, #38bdf8 45%, #fbbf24 70%, #ffffff 90%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-pop-glow 1.0s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards, crystal-shimmer 4s ease infinite;
        }
      `}} />

      {/* ── कैनवास एनीमेशन लेयर ── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* ── LAYER 1: MOONLIGHT (चांदनी और चाँद) ── */}
      {(currentStep !== 'SNOW_START') && (
        <div 
          className="absolute top-[8%] right-[10%] w-24 h-24 rounded-full bg-slate-100 animate-moon pointer-events-none z-10"
          style={{
            boxShadow: '0 0 60px 20px rgba(219, 234, 254, 0.4), inset -10px -10px 20px rgba(0,0,0,0.1)'
          }}
        />
      )}

      {/* ── LAYER 2: SANTA CLAUS FLYING ENTRY ── */}
      {(currentStep === 'SANTA_ENTRY' || currentStep === 'SANTA_STOP_BREATH' || currentStep === 'HANDS_DUST_ACTIVE') && (
        <div 
          className="absolute top-[28%] left-0 w-[180px] pointer-events-none z-20"
          style={{
            // यदि स्टॉप फेज आ गया है तो इसे अपनी निश्चित जगह पर रखें, नहीं तो एंट्री एनीमेशन चलाएं
            animation: currentStep === 'SANTA_ENTRY' ? 'santa-glide-in 2s cubic-bezier(0.16, 1, 0.3, 1) forwards' : undefined,
            transform: currentStep !== 'SANTA_ENTRY' ? 'translateX(35vw) translateY(0px)' : undefined,
            transition: 'all 0.5s ease-out'
          }}
        >
          {/* Sleigh Svg Silhouette */}
          <svg viewBox="0 0 512 512" fill="#ffffff" className="w-full h-auto opacity-95 drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]">
            <path d="M496 256c0-9.3-5-17.8-13.1-22.3l-84-46.7c-9.3-5.2-20.7-3.7-28.4 3.7l-45.6 43.6-76.3-25.4-38.3-64c-5.2-8.7-14.7-14-24.9-14H128c-10.2 0-19.7 5.3-24.9 14l-38.3 64-76.3 25.4L-17.1 237.4c-7.7-7.4-19.1-8.9-28.4-3.7l-84 46.7C-137 284.9-142 293.4-142 302.7c0 14.1 10.4 26 24.4 27.6l23.5 2.6c31.1 3.5 61 17.5 83.1 39.2l12.4 12.2c16 15.7 37.7 24.5 60.3 24.5H416c14.1 0 25.6-11.5 25.6-25.6v-16.4c0-10.2-5.3-19.7-14-24.9l-31.6-18.9V256h100c14.1 0 25.6-11.5 25.6-25.6z" />
          </svg>
        </div>
      )}

      {/* ── LAYER 3: CRYSTAL "MERRY CHRISTMAS" TEXT REVEAL ── */}
      {(currentStep === 'CRYSTAL_TEXT_REVEAL' || currentStep === 'FADE_OUT') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 p-6 text-center">
          
          <h1 
            className="animate-crystal-text text-6xl md:text-8xl font-black uppercase tracking-tight select-none leading-none"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            Merry Christmas
          </h1>

          <p className="mt-4 text-slate-400 text-sm md:text-base tracking-[0.6em] translate-y-2 uppercase font-medium animate-pulse">
            Saanify Pariwar Welcomes You
          </p>
        </div>
      )}

    </div>
  );
}
