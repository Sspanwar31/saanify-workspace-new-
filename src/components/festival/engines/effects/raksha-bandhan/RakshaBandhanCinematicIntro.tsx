'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'snow' | 'gold_spark' | 'rose_petal' | 'smoke';
  wobble?: number;
}

const DURATION = 12.5; // 12.5 Seconds of Cinematic Experience

export default function RakshaBandhanCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const startTime = useRef<number>(Date.now());
  const particles = useRef<Particle[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('DIYA_GLOW');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const setSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    // ── 1. PARTICLES EMITTERS ──
    const spawnGoldDust = (x: number, y: number) => {
      particles.current.push({
        x, y,
        vx: rand(-0.4, 0.4),
        vy: rand(-0.5, -1.5),
        size: rand(1.2, 3.2),
        alpha: 0.9,
        color: '#fbbf24',
        life: 0,
        maxLife: rand(60, 100),
        type: 'gold_spark',
      });
    };

    const spawnRosePetal = (w: number) => {
      particles.current.push({
        x: Math.random() * w,
        y: -10,
        vx: rand(-0.5, 0.5),
        vy: rand(0.8, 1.6),
        size: rand(3.5, 7.5),
        alpha: rand(0.5, 0.8),
        color: '#dc2626', // Roli Red Petal
        life: 0,
        maxLife: 450,
        type: 'rose_petal',
        wobble: Math.random() * Math.PI * 2,
      });
    };

    const spawnIncenseSmoke = (x: number, y: number) => {
      particles.current.push({
        x, y,
        vx: rand(-0.2, 0.2) + 0.15, // Soft drift
        vy: rand(-0.4, -0.9),
        size: rand(12, 24),
        alpha: 0.22,
        color: '#cbd5e1', // Light smoke grey
        life: 0,
        maxLife: 200,
        type: 'smoke',
      });
    };

    const spawnExplosionSparks = (cx: number, cy: number) => {
      const colors = ['#fbbf24', '#f59e0b', '#dc2626', '#db2777', '#ffffff'];
      for (let i = 0; i < 180; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(1.5, 7.0);
        particles.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(1.2, 4.0),
          alpha: 1.0,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          maxLife: rand(80, 150),
          type: 'gold_spark',
        });
      }
    };

    // ── 2. MAIN CINEMATIC ANIMATION LOOP ──
    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const elapsed = Date.now() - startTime.current;

      // ── TIME-BASED STATE MACHINE (12.5 Seconds Sequence) ──
      let step = 'DIYA_GLOW';
      if (elapsed >= 12500) {
        cancelAnimationFrame(rafId.current);
        setFinished(true);
        onComplete();
        return;
      } else if (elapsed >= 11500) {
        step = 'FADE_OUT';
      } else if (elapsed >= 8200) {
        step = 'TEXT_REVEAL';
      } else if (elapsed >= 6500) {
        step = 'SHIELD_SHOCKWAVE';
      } else if (elapsed >= 4200) {
        step = 'RAKHI_WEAVING';
      } else if (elapsed >= 1500) {
        step = 'SILK_THREAD_FLOW';
      }

      if (step !== currentStep) {
        setCurrentStep(step);
        if (step === 'SHIELD_SHOCKWAVE') {
          spawnExplosionSparks(cx, cy - 35);
        }
      }

      // ── 3. ATMOSPHERIC BACKGROUNDS ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#060813');   // Deep Midnight Indigo
      bgGrad.addColorStop(0.55, '#13111d'); // Soft Crimson Transition
      bgGrad.addColorStop(1, '#2e0f21');   // Warm Kumkum Red Bottom
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // ── 4. POOJA DIYA AT THE BOTTOM (सजीव जलता दीया) ──
      const diyaX = cx;
      const diyaY = h * 0.94;
      const pulseFlame = 1 + Math.sin(elapsed * 0.006) * 0.08;

      ctx.save();
      // दीये की स्वर्णिम आभा (Glow)
      const diyaGlow = ctx.createRadialGradient(diyaX, diyaY - 20, 0, diyaX, diyaY - 20, 140 * pulseFlame);
      diyaGlow.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
      diyaGlow.addColorStop(0.5, 'rgba(220, 38, 38, 0.06)');
      diyaGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = diyaGlow;
      ctx.beginPath(); ctx.arc(diyaX, diyaY - 20, 160, 0, Math.PI * 2); ctx.fill();

      // पीतल का पूजा दीया (Brass Diya)
      ctx.fillStyle = '#b45309'; // Brass Brown
      ctx.beginPath();
      ctx.moveTo(diyaX - 45, diyaY);
      ctx.quadraticCurveTo(diyaX, diyaY + 12, diyaX + 45, diyaY);
      ctx.lineTo(diyaX + 35, diyaY - 14);
      ctx.quadraticCurveTo(diyaX, diyaY - 22, diyaX - 35, diyaY - 14);
      ctx.closePath();
      ctx.fill();

      // दीये की जलती लौ (Flickering Flame)
      const flameGrad = ctx.createLinearGradient(diyaX, diyaY - 18, diyaX, diyaY - 48 * pulseFlame);
      flameGrad.addColorStop(0, '#dc2626'); // Red base
      flameGrad.addColorStop(0.4, '#ea580c'); // Orange
      flameGrad.addColorStop(0.7, '#fbbf24'); // Gold
      flameGrad.addColorStop(1, '#ffffff'); // White core
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(diyaX - 8 * pulseFlame, diyaY - 18);
      ctx.quadraticCurveTo(diyaX - 12 * pulseFlame, diyaY - 32, diyaX, diyaY - 50 * pulseFlame);
      ctx.quadraticCurveTo(diyaX + 12 * pulseFlame, diyaY - 32, diyaX + 8 * pulseFlame, diyaY - 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // धूप का धुआं (Incense Smoke Spawn)
      if (Math.random() < 0.04) {
        spawnIncenseSmoke(diyaX - 30, diyaY - 12);
      }

      // ── 5. SILK THREAD FLOW (कुमकुम लाल रेशमी धागे का तैरना) ──
      if (step === 'SILK_THREAD_FLOW') {
        const t = (elapsed - 1500) / 2700; // 0 to 1
        ctx.save();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, cy - 80);

        // कोमल तरंगदार गति (Wavy Dynamic Sine Path)
        const currentEndX = w * t;
        for (let x = 0; x <= currentEndX; x += 5) {
          const y = (cy - 60) + Math.sin(x * 0.005 + elapsed * 0.004) * 45;
          ctx.lineTo(x, y);
          
          if (x === Math.floor(currentEndX) && Math.random() < 0.3) {
            spawnGoldDust(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // ── 6. RAKHI WEAVING (रेशमी सोने की राखी का निर्माण और घूमना) ──
      if (step === 'RAKHI_WEAVING' || step === 'SHIELD_SHOCKWAVE' || step === 'TEXT_REVEAL') {
        const t = Math.min((elapsed - 4200) / 2300, 1); // Weaving duration
        const R = 65; // Rakhi Size
        const rot = elapsed * 0.0006;

        ctx.save();
        ctx.translate(cx, cy - 35);
        ctx.rotate(rot);

        // दिव्य स्वर्णिम पल्सिंग बैकग्राउंड आभा
        const pulseGlow = 1 + Math.sin(elapsed * 0.004) * 0.06;
        const rGrad = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 3.8 * pulseGlow * t);
        rGrad.addColorStop(0, 'rgba(220, 38, 38, 0.2)');   // कुमकुम लाल कोर
        rGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.12)'); // सुवर्ण किरण
        rGrad.addColorStop(0.7, 'rgba(219, 39, 119, 0.04)'); // रेशमी गुलाबी
        rGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rGrad;
        ctx.beginPath(); ctx.arc(0, 0, R * 4, 0, Math.PI * 2); ctx.fill();

        // क) रेशमी धागे (Hanging Silk Threads)
        ctx.strokeStyle = `rgba(220, 38, 38, ${0.75 * t})`;
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9);
          for (let j = 1; j <= 6; j++) {
            const ratio = j / 6;
            ctx.lineTo(Math.cos(a) * R * 0.9 + Math.sin(ratio * 3 + elapsed * 0.003) * 4, Math.sin(a) * R * 0.9 + ratio * 45 * t);
          }
          ctx.stroke();
        }

        // ख) बाहरी फूल की लाल-गुलाबी पंखुड़ियां (12 Silk Petals)
        ctx.fillStyle = `rgba(220, 38, 38, ${0.85 * t})`; // Ruby Red
        ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12 * t;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, 10 * t, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1; ctx.stroke();
        }

        // ग) मैटेलिक गोल्ड रिंग (Brass Gold Ring)
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2 * t); ctx.stroke();

        // घ) चमकते हीरे और मोती (Inner Pearls)
        if (t > 0.4) {
          ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath(); ctx.arc(Math.cos(a) * R * 0.52 * t, Math.sin(a) * R * 0.52 * t, 3.2, 0, Math.PI * 2); ctx.fill();
          }
        }

        // ङ) कुमकुम तिलक कोर (Roli Tilak Core)
        if (t > 0.7) {
          ctx.fillStyle = '#dc2626'; ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 15;
          ctx.beginPath(); ctx.arc(0, 0, R * 0.22, 0, Math.PI * 2); ctx.fill();
          // तिलक के ऊपर अक्षत (Pooja Rice Grains)
          ctx.fillStyle = '#fff9db';
          ctx.beginPath(); ctx.ellipse(-2, -2, 1.5, 3, 0.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(2, 2, 1.5, 3, -0.4, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
      }

      // गुलाब की पंखुड़ियों की बारिश (Rose Petals Rain)
      if (step === 'SHIELD_SHOCKWAVE' || step === 'TEXT_REVEAL') {
        if (particles.current.filter(p => p.type === 'rose_petal').length < 35) {
          spawnRosePetal(w);
        }
      }

      // ── 7. UPDATE & RENDER DYNAMIC SYSTEM ──
      particles.current = particles.current.filter(p => {
        p.life += 1;

        if (p.type === 'gold_spark') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.02; // Soft falling gravity
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        }
        else if (p.type === 'smoke') {
          p.x += p.vx;
          p.y += p.vy;
          p.size += 0.08; // Smooth puff expansion
          p.alpha = Math.max(0, 0.22 * (1 - p.life / p.maxLife));
        }
        else if (p.type === 'rose_petal') {
          p.y += p.vy;
          if (p.wobble !== undefined) {
            p.wobble += 0.015;
            p.x += Math.sin(p.wobble) * 0.25;
          }
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        }

        // Render Single Particle
        if (p.life < p.maxLife && p.y < h + 10 && p.x > -10 && p.x < w + 10) {
          ctx.save();
          ctx.globalAlpha = p.alpha;

          if (p.type === 'gold_spark') {
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
      
      {/* 🚀 इनलाइन प्रीमियम गोल्डन क्रोम सीएसएस एनीमेशन */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes text-glow-shimmer {
          0% { background-position: 0% 50%; filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.45)); }
          50% { background-position: 100% 50%; filter: drop-shadow(0 0 35px rgba(220, 38, 38, 0.7)); }
          100% { background-position: 0% 50%; filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.45)); }
        }
        @keyframes pooja-text-reveal {
          0% { transform: translateY(30px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0px) scale(1); opacity: 1; }
        }
        .animate-sacred-text {
          background: linear-gradient(135deg, #ffffff 10%, #fef08a 35%, #eab308 50%, #ca8a04 65%, #ffffff 90%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: text-pop-glow 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards, text-glow-shimmer 4s ease infinite;
        }
      `}} />

      {/* ── मुख्य कैनवास लेयर ── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* ── LAYER 3: EXQUISITE SACRED DEVANAGARI TEXT REVEAL ── */}
      {(currentStep === 'TEXT_REVEAL' || currentStep === 'FADE_OUT') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 p-6 text-center">
          
          {/* Devanagari Main Message */}
          <h1 
            className="animate-sacred-text text-5xl md:text-7xl font-extrabold tracking-tight select-none mt-[180px] drop-shadow-xl"
            style={{
              fontFamily: '"Noto Sans Devanagari", "Mangal", "Kokila", sans-serif',
              letterSpacing: '-0.02em',
              animation: 'pooja-text-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            बंधन नहीं, शक्ति है
          </h1>

          {/* Subtitle in Gold-Silver Silk */}
          <p className="mt-4 text-amber-200 text-xs md:text-sm tracking-[0.6em] translate-y-1 uppercase font-semibold animate-pulse">
            Happy Raksha Bandhan
          </p>
        </div>
      )}

    </div>
  );
}
