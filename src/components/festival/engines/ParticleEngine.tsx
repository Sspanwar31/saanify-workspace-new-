'use client';

import { useEffect, useRef } from 'react';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

interface EngineConfig {
  gravity: number;
  spread: number;
  speed: number;
  colors: string[];
  minSize: number;
  maxSize: number;
  maxCount: number;
  glow: boolean;
  wobble: boolean;
  direction: 'radial' | 'upward' | 'downward' | 'spiral';
  spawnY?: number; 
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 PHASE BEHAVIOR
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const PhaseBehavior: Record<string, { intensity: number; spawnRate: number }> = {
  IDLE:           { intensity: 0.3,  spawnRate: 0.025 },
  AMBIENT:        { intensity: 0.8,  spawnRate: 0.08  }, 
  SHOOTING:       { intensity: 1.2,  spawnRate: 0.24  }, 
  FLASH:          { intensity: 1.5,  spawnRate: 0.65  }, 
  HANDOVER:       { intensity: 0.9,  spawnRate: 0.12  },
  
  // ━━━ HOLI 2027 "FIRST PERSON ATTACK" PHASES ━━━
  PUCK_PUMP:      { intensity: 0.6,  spawnRate: 0.15  },
  STREAM_BLAST:   { intensity: 1.4,  spawnRate: 0.35  },
  COLOR_BURST:    { intensity: 1.6,  spawnRate: 0.50  },
  GULAL_RAIN:     { intensity: 1.2,  spawnRate: 0.25  },
  FADE_MIST:      { intensity: 0.4,  spawnRate: 0.05  },
  APPROACHING:    { intensity: 0.8,  spawnRate: 0.12  }, // Zoom-in gutkas
  IMPACT:         { intensity: 2.0,  spawnRate: 0.85  }, // Fast dust blast
  SMOKE_FILL:     { intensity: 0.5,  spawnRate: 0.08  }, // Slow thick clouds
  TEXT_REVEAL:    { intensity: 0.1,  spawnRate: 0.01  }, // Almost idle for text
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DEFAULT CONFIG
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const DEFAULT: EngineConfig = {
  gravity: 0.15,
  spread: 1.0,
  speed: 1.0,
  colors: ['#ffffff', '#e2e8f0', '#94a3b8'],
  minSize: 2,
  maxSize: 5,
  maxCount: 40,
  glow: false,
  wobble: false,
  direction: 'radial',
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 PRESET MAP
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const PRESET_MAP: Record<string, Partial<EngineConfig>> = {
  LIQUID_SPLASH: {
    gravity: 0.28, spread: 1.6, speed: 2.2,
    colors: ['#ff006e', '#ffbe0b', '#00f5d4', '#3a86ff', '#8338ec', '#fb5607'],
    minSize: 5, maxSize: 15, maxCount: 350, glow: false, wobble: true, direction: 'upward', spawnY: 0.75,
  },
  HOLI: {
    gravity: 0.28, spread: 1.6, speed: 2.2,
    colors: ['#ff006e', '#ffbe0b', '#00f5d4', '#3a86ff', '#8338ec', '#fb5607'],
    minSize: 5, maxSize: 15, maxCount: 350, glow: false, wobble: true, direction: 'upward', spawnY: 0.75,
  },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function ParticleEngine({ preset, phase = 'IDLE' }: { preset?: string; phase?: string; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafId = useRef<number>(0);
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: EngineConfig = { ...DEFAULT, ...(PRESET_MAP[preset || ''] || {}) };

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const spawn = (): Particle => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      let currentDirection = config.direction;
      let currentSpawnY = config.spawnY || 0.5;
      let currentMinSize = config.minSize;
      let currentMaxSize = config.maxSize;
      let currentSpeed = config.speed;

      if (preset === 'LIQUID_SPLASH' || preset === 'HOLI') {
        const currentPhase = phaseRef.current;

        // ━━━ DIWALI PHASES (PURANA LOGIC - SAFE) ━━━
        if (currentPhase === 'ROCKET') {
          currentDirection = 'upward'; currentSpawnY = 0.9; currentMinSize = 10; currentMaxSize = 25; currentSpeed = 3.5;        
        } 
        else if (currentPhase === 'FIREWORK' || currentPhase === 'FLASH' || currentPhase === 'SHOOTING') {
          currentDirection = 'radial'; currentSpawnY = 0.35; currentMinSize = 5; currentMaxSize = 14; currentSpeed = 3.8;        
        } 
        
        // ━━━ HOLI 2027 "FIRST PERSON ATTACK" LOGIC ━━━
        else if (currentPhase === 'APPROACHING') {
          // Bade gutke seedha camera ki taraf aate hain (Center me bade circles)
          currentDirection = 'radial'; 
          currentSpawnY = 0.5;       
          currentMinSize = 40;       // Bahut bade size
          currentMaxSize = 90;       
          currentSpeed = 0.1;        // Almost stationary (Zoom illusion)
        }
        else if (currentPhase === 'IMPACT') {
          // Phat kar chhote dhool ke kankar bahar jate hain
          currentDirection = 'radial';
          currentSpawnY = 0.5;      
          currentMinSize = 3;
          currentMaxSize = 10;
          currentSpeed = 8.0;        // Bahut tez blast
        }
        else if (currentPhase === 'SMOKE_FILL') {
          // Dheeme dhua bharega (Huge low-opacity clouds)
          currentDirection = 'radial';
          currentSpawnY = 0.5;      
          currentMinSize = 120;      // Giant circles
          currentMaxSize = 250;      
          currentSpeed = 0.3;        // Very slow spread
        }
        else if (currentPhase === 'TEXT_REVEAL') {
          // Text ke liye almost band (Controller text dikhayega)
          currentDirection = 'radial';
          currentSpawnY = -1; // Screen ke bahar spawn ho
          currentMinSize = 1;
          currentMaxSize = 2;
          currentSpeed = 0;
        }
        else if (currentPhase === 'HANDOVER' || currentPhase === 'AMBIENT' || currentPhase === 'FADE_MIST') {
          currentDirection = 'downward'; currentSpawnY = -0.05; currentMinSize = 3; currentMaxSize = 7; currentSpeed = 0.6;
        }
      }

      const cx = w / 2;
      const cy = h * currentSpawnY; 
      const spd = currentSpeed * rand(0.4, 1.3); 
      const size = rand(currentMinSize, currentMaxSize); 
      const angle = Math.random() * Math.PI * 2;

      let vx = 0;
      let vy = 0;

      switch (currentDirection) {
        case 'upward': vx = rand(-1, 1) * spd * config.spread * 1.2; vy = -spd * rand(1.2, 2.8) * config.spread; break;
        case 'downward': vx = rand(-1, 1) * spd * config.spread; vy = spd * rand(0.5, 1.5) * config.spread; break;
        case 'spiral': vx = Math.cos(angle + particles.current.length * 0.4) * spd * config.spread; vy = Math.sin(angle + particles.current.length * 0.4) * spd * config.spread; break;
        case 'radial':
        default: vx = Math.cos(angle) * spd * config.spread * 2; vy = Math.sin(angle) * spd * config.spread * 2;
      }

      // SMOKE_FILL ke liye zyada life chahiye taaki dhua rahe
      const isSmoke = phaseRef.current === 'SMOKE_FILL';

      return {
        x: cx + rand(-20, 20), y: cy + rand(-10, 10), vx, vy, size,
        color: pick(config.colors),
        life: isSmoke ? rand(150, 250) : rand(50, 110),
        maxLife: isSmoke ? 250 : 110,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.1, 0.1),
      };
    };

    /* ── Draw Particle ── */
    const draw = (p: Particle) => {
      const progress = 1 - p.life / p.maxLife;
      let alpha = Math.max(0, 1 - progress * progress);

      // ✨ SMOKE_FILL SPECIAL LOGIC: Transparent dhua banane ke liye
      if (phaseRef.current === 'SMOKE_FILL') {
        alpha = 0.08; // Thick smoke transparency
      }

      // ✨ APPROACHING SPECIAL LOGIC: Gutke thode transparent aayein
      if (phaseRef.current === 'APPROACHING') {
        alpha = Math.min(alpha, 0.85);
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (config.wobble && p.size > 5 && phaseRef.current !== 'SMOKE_FILL') {
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-p.size * 0.25, -p.size * 0.25, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    /* ── Main Loop ── */
    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const pb = PhaseBehavior[phaseRef.current] || PhaseBehavior.IDLE;

      ctx.clearRect(0, 0, w, h);

      const rawCount = config.maxCount;
      const cap = Math.floor(rawCount * pb.intensity);
      
      if (particles.current.length < cap && Math.random() < pb.spawnRate) {
        particles.current.push(spawn());
      }

      // SMOKE me gravity 0 chahiye
      const activeGravity = phaseRef.current === 'SMOKE_FILL' ? 0 : config.gravity;

      particles.current = particles.current.filter(p => {
        p.vy += activeGravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.rotation += p.rotationSpeed;
        
        // Smoke ko zyada der tak rukne do (no friction)
        if (phaseRef.current !== 'SMOKE_FILL') {
          p.vx *= 0.995;
          p.vy *= 0.995;
        }

        if (config.wobble && phaseRef.current !== 'SMOKE_FILL') {
          p.vx += Math.sin(p.life * 0.12) * 0.18;
        }

        if (p.life > 0 && p.y < h + 300 && p.x > -300 && p.x < w + 300) {
          draw(p);
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
      particles.current = [];
    };
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
