'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'exhaust' | 'spark' | 'trail' | 'smoke';
}

interface Rocket {
  id: number;
  startX: number;
  delay: number;
  curveDir: number;
  speed: number;
  launched: boolean;
  isDecoy: boolean;    // 🚀 NEW: Decoy aur Main rockets me antar karne ke liye
  duration: number;   // 🚀 NEW: Har rocket ki speed ko individual control karne ke liye
}

export default function RocketLaunch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeRockets, setActiveRockets] = useState<Rocket[]>([]);
  const [shake, setShake] = useState(false);
  const frameRef = useRef<number>(0);
  const particleIdRef = useRef(0);
  const rocketPhaseRef = useRef<Record<number, number>>({});
  const rocketsRef = useRef<Rocket[]>([]);

  const EXHAUST_COLORS = [
    '#00d4ff', '#0099ff', '#66e0ff', '#ffffff',
    '#ff6b00', '#ffaa00', '#ff4400', '#ffdd44',
  ];

  const SPARK_COLORS = [
    '#ffffff', '#ffe066', '#ff9933', '#00ccff', '#ff3366',
  ];

  // Initialize rockets with staggered timing and different paths
  useEffect(() => {
    const rocketConfigs: Rocket[] = [
      // 🚀 Decoy Rockets: Ye fast udenge aur screen ke bahar nikal jayenge
      { id: 1, startX: 18, delay: 100, curveDir: -1, speed: 1.1, launched: false, isDecoy: true, duration: 90 },
      { id: 2, startX: 82, delay: 400, curveDir: 1, speed: 1.2, launched: false, isDecoy: true, duration: 90 },
      
      // 🚀 Main Rockets: Ye screen ke top (15% height) par pahuch kar fade out honge aur blast karenge
      { id: 3, startX: 32, delay: 900, curveDir: -0.4, speed: 0.95, launched: false, isDecoy: false, duration: 110 },
      { id: 4, startX: 68, delay: 1300, curveDir: 0.5, speed: 1.05, launched: false, isDecoy: false, duration: 110 },
      { id: 5, startX: 50, delay: 1700, curveDir: 0, speed: 1.15, launched: false, isDecoy: false, duration: 110 },
    ];

    rocketsRef.current = rocketConfigs;
    setActiveRockets(rocketConfigs);

    rocketConfigs.forEach((r) => {
      rocketPhaseRef.current[r.id] = 0;
    });

    // Staggered launch triggers
    rocketConfigs.forEach((r) => {
      setTimeout(() => {
        setShake(true);
        setTimeout(() => setShake(false), 300);
        rocketsRef.current = rocketsRef.current.map((rocket) =>
          rocket.id === r.id ? { ...rocket, launched: true } : rocket
        );
        setActiveRockets([...rocketsRef.current]);
      }, r.delay);
    });

    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  // Particle spawn + animation loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const animate = () => {
      const newParticles: Particle[] = [];

      activeRockets.forEach((rocket) => {
        if (!rocket.launched) return;

        const phase = rocketPhaseRef.current[rocket.id] || 0;
        rocketPhaseRef.current[rocket.id] = phase + 1;

        // 🚀 Dynamic duration ke hissab se progress nikalenge
        const progress = Math.min(phase / rocket.duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        // Rocket position calculation
        const baseX = rocket.startX;
        const curve = Math.sin(progress * Math.PI * 2) * 3 * rocket.curveDir;
        const rocketX = baseX + curve;
        
        // 🚀 Decoy screen ke bahar (130) jayega, Main aakash me (85) rukega
        const heightFactor = rocket.isDecoy ? 130 : 85;
        const rocketY = 100 - eased * heightFactor;

        // Hide rocket after it leaves
        if (progress >= 1) return;

        // --- EXHAUST PARTICLES ---
        if (phase % 2 === 0) {
          for (let i = 0; i < 3; i++) {
            newParticles.push({
              id: particleIdRef.current++,
              x: rocketX + (Math.random() - 0.5) * 2,
              y: rocketY + 2,
              vx: (Math.random() - 0.5) * 1.5 + curve * 0.05,
              vy: Math.random() * 2 + 1,
              life: 0,
              maxLife: 30 + Math.random() * 20,
              size: 2 + Math.random() * 4,
              color: EXHAUST_COLORS[Math.floor(Math.random() * EXHAUST_COLORS.length)],
              type: 'exhaust',
            });
          }
        }

        // --- SPARK PARTICLES ---
        if (phase % 4 === 0) {
          for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            newParticles.push({
              id: particleIdRef.current++,
              x: rocketX,
              y: rocketY + 1,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed + 0.5,
              life: 0,
              maxLife: 15 + Math.random() * 15,
              size: 1 + Math.random() * 2,
              color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
              type: 'spark',
            });
          }
        }

        // --- SMOKE TRAIL ---
        if (phase % 6 === 0) {
          newParticles.push({
            id: particleIdRef.current++,
            x: rocketX + (Math.random() - 0.5) * 3,
            y: rocketY + 3,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0.3 + Math.random() * 0.5,
            life: 0,
            maxLife: 60 + Math.random() * 30,
            size: 6 + Math.random() * 8,
            color: 'rgba(180,200,220,0.3)',
            type: 'smoke',
          });
        }

        // --- GLOW TRAIL DOTS ---
        if (phase % 3 === 0) {
          newParticles.push({
            id: particleIdRef.current++,
            x: rocketX,
            y: rocketY + 1,
            vx: 0,
            vy: 0.2,
            life: 0,
            maxLife: 40 + Math.random() * 20,
            size: 3 + Math.random() * 2,
            color: '#00d4ff',
            type: 'trail',
          });
        }
      });

      // Update existing particles
      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.3,
            y: p.y + p.vy * 0.3,
            life: p.life + 1,
            vx: p.type === 'smoke' ? p.vx * 0.98 : p.vx * 0.96,
            vy: p.type === 'smoke' ? p.vy * 0.98 : p.vy * 0.96,
          }))
          .filter((p) => p.life < p.maxLife);

        return [...updated, ...newParticles];
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [activeRockets]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none z-20 transition-transform ${
        shake ? 'scale-[1.01]' : 'scale-100'
      }`}
      style={{ filter: shake ? 'brightness(1.2)' : 'brightness(1)' }}
    >
      {/* Screen flash on launch */}
      {shake && (
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
      )}

      {/* Speed lines */}
      {shake && (
        <>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`speed-${i}`}
              className="absolute w-[1px] bg-gradient-to-t from-transparent via-cyan-400/40 to-transparent"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: '60%',
                height: `${30 + Math.random() * 40}vh`,
                transform: `rotate(${(Math.random() - 0.5) * 10}deg)`,
                animation: `speedLineFade 0.5s ease-out forwards`,
              }}
            />
          ))}
        </>
      )}

      {/* Rocket elements */}
      {activeRockets.map((rocket) => {
        if (!rocket.launched) return null;
        const phase = rocketPhaseRef.current[rocket.id] || 0;
        
        // 🚀 Dynamic progress calculation
        const progress = Math.min(phase / rocket.duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const curve = Math.sin(progress * Math.PI * 2) * 3 * rocket.curveDir;
        const x = rocket.startX + curve;
        
        const heightFactor = rocket.isDecoy ? 130 : 85;
        const y = 100 - eased * heightFactor;

        const rotation = curve * 3 + (rocket.curveDir * -5);
        const scale = 0.8 + progress * 0.3;
        
        // 🚀 Rocket ke upar pahuchne par use smoothly adrishya (fade-out) karne ka logic
        const opacity = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

        if (progress >= 1) return null;

        return (
          <div
            key={`rocket-${rocket.id}`}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              opacity,
              filter: `drop-shadow(0 0 12px #00d4ff) drop-shadow(0 0 30px #0066ff) drop-shadow(0 -10px 20px rgba(255,100,0,0.6))`,
            }}
          >
            {/* SVG Rocket */}
            <svg
              width="24"
              height="48"
              viewBox="0 0 24 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Body */}
              <defs>
                <linearGradient id={`body-${rocket.id}`} x1="12" y1="0" x2="12" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#e8edf2" />
                  <stop offset="30%" stopColor="#c8d4e0" />
                  <stop offset="60%" stopColor="#a0b0c4" />
                  <stop offset="100%" stopColor="#7890a8" />
                </linearGradient>
                <linearGradient id={`flame-${rocket.id}`} x1="12" y1="36" x2="12" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#00d4ff" />
                  <stop offset="55%" stopColor="#0066ff" />
                  <stop offset="80%" stopColor="#ff6600" />
                  <stop offset="100%" stopColor="#ff220044" />
                </linearGradient>
                <linearGradient id={`window-${rocket.id}`} x1="12" y1="12" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00eeff" />
                  <stop offset="100%" stopColor="#0044aa" />
                </linearGradient>
              </defs>

              {/* Nose cone */}
              <path d="M12 0 L17 10 L7 10 Z" fill="url(#body-rocket-nose)" />
              <path d="M12 0 L17 10 L7 10 Z" fill="#d0dae6" />

              {/* Main body */}
              <rect x="7" y="10" width="10" height="22" rx="1" fill={`url(#body-${rocket.id})`} />

              {/* Body highlight stripe */}
              <rect x="8" y="10" width="3" height="22" rx="0.5" fill="rgba(255,255,255,0.25)" />

              {/* Window */}
              <circle cx="12" cy="16" r="3.5" fill={`url(#window-${rocket.id})`} />
              <circle cx="12" cy="16" r="3.5" fill="none" stroke="#607890" strokeWidth="0.8" />
              <circle cx="11" cy="15" r="1" fill="rgba(255,255,255,0.5)" />

              {/* Fins */}
              <path d="M7 26 L2 36 L7 32 Z" fill="#ff4444" />
              <path d="M17 26 L22 36 L17 32 Z" fill="#ff4444" />
              <path d="M7 26 L2 36 L7 32 Z" fill="url(#body-rocket-nose)" opacity="0.3" />

              {/* Nozzle */}
              <path d="M9 32 L8 36 L16 36 L15 32 Z" fill="#445566" />

              {/* Flame */}
              <path
                d="M8 36 Q10 44 12 48 Q14 44 16 36 Z"
                fill={`url(#flame-${rocket.id})`}
                className="animate-pulse"
              />
              <path
                d="M10 36 Q11 41 12 44 Q13 41 14 36 Z"
                fill="rgba(255,255,255,0.8)"
                className="animate-pulse"
                style={{ animationDuration: '0.1s' }}
              />
            </svg>

            {/* Engine glow */}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(0,200,255,0.6) 0%, rgba(255,100,0,0.3) 40%, transparent 70%)',
                filter: 'blur(4px)',
              }}
            />
          </div>
        );
      })}

      {/* Particles */}
      {particles.map((p) => {
        const lifeRatio = p.life / p.maxLife;
        const opacity =
          p.type === 'smoke'
            ? lifeRatio < 0.2
              ? lifeRatio * 5
              : 1 - (lifeRatio - 0.2) / 0.8
            : 1 - lifeRatio;

        const currentSize =
          p.type === 'smoke' ? p.size * (1 + lifeRatio * 2) : p.size * (1 - lifeRatio * 0.5);

        if (opacity <= 0 || currentSize <= 0) return null;

        return (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${currentSize}px`,
              height: `${currentSize}px`,
              backgroundColor:
                p.type === 'smoke' ? undefined : p.color,
              background:
                p.type === 'trail'
                  ? `radial-gradient(circle, ${p.color}, transparent)`
                  : p.type === 'smoke'
                  ? p.color
                  : undefined,
              opacity: opacity * (p.type === 'smoke' ? 0.4 : 0.9),
              transform: 'translate(-50%, -50%)',
              filter:
                p.type === 'trail'
                  ? `blur(2px) drop-shadow(0 0 4px ${p.color})`
                  : p.type === 'exhaust'
                  ? `blur(${1 + lifeRatio * 2}px)`
                  : p.type === 'smoke'
                  ? 'blur(6px)'
                  : 'none',
              boxShadow:
                p.type === 'spark'
                  ? `0 0 ${3 + (1 - lifeRatio) * 4}px ${p.color}`
                  : 'none',
              mixBlendMode:
                p.type === 'trail' || p.type === 'exhaust'
                  ? 'screen'
                  : 'normal',
            }}
          />
        );
      })}

      <style jsx>{`
        @keyframes speedLineFade {
          0% {
            opacity: 0.8;
            transform: scaleY(0.3);
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
            transform: scaleY(1.5);
          }
        }
      `}</style>
    </div>
  );
}
