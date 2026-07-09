'use client';

import { useEffect, useRef } from 'react';

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

interface PresetConfig {
  default: Partial<EngineConfig>;
  phases?: Record<string, Partial<EngineConfig>>;
}

const PhaseBehavior: Record<string, { intensity: number; spawnRate: number }> = {
  IDLE:           { intensity: 0.3,  spawnRate: 0.025 },
  AMBIENT:        { intensity: 0.8,  spawnRate: 0.08  }, 
  SHOOTING:       { intensity: 1.2,  spawnRate: 0.24  }, 
  FLASH:          { intensity: 1.5,  spawnRate: 0.65  }, 
  HANDOVER:       { intensity: 0.9,  spawnRate: 0.12  },
  ROCKET_LAUNCH:  { intensity: 1.5,  spawnRate: 0.65 }, 
  COLOR_DHAMAKA:  { intensity: 2.0,  spawnRate: 0.90 }, 
  GULAL_RAIN:     { intensity: 1.2,  spawnRate: 0.30 }, 
};

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

const PRESET_MAP: Record<string, PresetConfig> = {
  LIQUID_SPLASH: {
    default: {
      gravity: 0.28, spread: 1.6, speed: 2.2,
      colors: ['#ff006e', '#ffbe0b', '#00f5d4', '#3a86ff', '#8338ec', '#fb5607'],
      minSize: 5, maxSize: 15, maxCount: 350, glow: false, wobble: true, direction: 'upward', spawnY: 0.75,
    },
    phases: {
      ROCKET:         { direction: 'upward',   spawnY: 0.9,  minSize: 10, maxSize: 25, speed: 3.5 },
      FIREWORK:       { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      FLASH:          { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      SHOOTING:       { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      ROCKET_LAUNCH:  { direction: 'upward',   spawnY: 0.9,  minSize: 10, maxSize: 25, speed: 1.9 },
      COLOR_DHAMAKA:  { direction: 'radial',   spawnY: 0.15, minSize: 6,  maxSize: 18, speed: 5.5 },
      GULAL_RAIN:     { direction: 'downward', spawnY: -0.1, minSize: 4,  maxSize: 12, speed: 1.5 },
      HANDOVER:       { direction: 'downward', spawnY: -0.05,minSize: 3,  maxSize: 7,  speed: 0.6 },
      AMBIENT:        { direction: 'downward', spawnY: -0.05,minSize: 3,  maxSize: 7,  speed: 0.6 },
    }
  },
  HOLI: {
    default: {
      gravity: 0.28, spread: 1.6, speed: 2.2,
      colors: ['#ff006e', '#ffbe0b', '#00f5d4', '#3a86ff', '#8338ec', '#fb5607'],
      minSize: 5, maxSize: 15, maxCount: 350, glow: false, wobble: true, direction: 'upward', spawnY: 0.75,
    },
    phases: {
      ROCKET:         { direction: 'upward',   spawnY: 0.9,  minSize: 10, maxSize: 25, speed: 3.5 },
      FIREWORK:       { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      FLASH:          { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      SHOOTING:       { direction: 'radial',   spawnY: 0.35, minSize: 5,  maxSize: 14, speed: 3.8 },
      ROCKET_LAUNCH:  { direction: 'upward',   spawnY: 0.9,  minSize: 10, maxSize: 25, speed: 1.9 },
      COLOR_DHAMAKA:  { direction: 'radial',   spawnY: 0.15, minSize: 6,  maxSize: 18, speed: 5.5 },
      GULAL_RAIN:     { direction: 'downward', spawnY: -0.1, minSize: 4,  maxSize: 12, speed: 1.5 },
      HANDOVER:       { direction: 'downward', spawnY: -0.05,minSize: 3,  maxSize: 7,  speed: 0.6 },
      AMBIENT:        { direction: 'downward', spawnY: -0.05,minSize: 3,  maxSize: 7,  speed: 0.6 },
    }
  },
  LOHRI: {
    default: {
      gravity: -0.015,       
      spread: 1.2,          
      speed: 0.6,           
      colors: ['#ff6b35', '#ff4500', '#ffd700', '#ff8c00'],
      minSize: 1.5, maxSize: 5.5, maxCount: 220, glow: true, wobble: true, direction: 'upward', spawnY: 1.02,
    }
  },
  CHRISTMAS: {
    default: {
      gravity: 0.025,       
      spread: 0.6,          
      speed: 0.9,           
      colors: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'], 
      minSize: 0.8,         
      maxSize: 2.5,         
      maxCount: 450,        
      glow: true,           
      wobble: true,         
      direction: 'downward', 
      spawnY: -0.1,
    }
  },
  RAKSHA_BANDHAN: {
    default: {
      gravity: 0.025,       
      spread: 0.7,          
      speed: 0.8,           
      colors: ['#ffffff', '#fef08a', '#fbbf24', '#f43f5e', '#ec4899'], 
      minSize: 1.0,         
      maxSize: 4.0,         
      maxCount: 280,        
      glow: true,           
      wobble: true,         
      direction: 'downward',
      spawnY: -0.1,         
    }
  },
  MAKAR_SANKRANTI: {
    default: {
      gravity: 0.012,       
      spread: 0.8,          
      speed: 0.7,           
      colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#34d399', '#ffffff'], 
      minSize: 1.2,         
      maxSize: 3.5,         
      maxCount: 160,        
      glow: true,           
      wobble: true,         
      direction: 'downward', 
      spawnY: -0.1,
    }
  },
  SPECIAL_OFFER: {
    default: {
      gravity: 0.08, spread: 1.2, speed: 1.4,
      colors: ['#ec4899', '#f43f5e', '#fda4af', '#e11d48'],
      minSize: 4, maxSize: 9, maxCount: 120, glow: true, wobble: true, direction: 'radial', spawnY: 0.5,
    }
  }
};

export default function ParticleEngine({ 
  preset, 
  phase = 'IDLE',
  customGravity,
  customSpeed,
  customColors,
  customMinSize,
  customMaxSize,
  customMaxCount
}: { 
  preset?: string; 
  phase?: string; 
  customGravity?: number | null;
  customSpeed?: number | null;
  customColors?: string[] | null;
  customMinSize?: number | null;
  customMaxSize?: number | null;
  customMaxCount?: number | null;
}) {
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

    // केस-इन्सेंसिटिव नॉर्मलाइज़ेशन
    const normalizedPreset = (preset || '').toUpperCase().trim();

    console.log("❄️ [ParticleEngine] PROPS RECEIVED:", {
      preset: normalizedPreset,
      phase,
      customSpeed,
      customGravity,
      customMinSize,
      customMaxSize,
      customMaxCount
    });

    const activePresetObj = PRESET_MAP[normalizedPreset || ''] || { default: DEFAULT };

    // सुरक्षित चेकिंग
    const config: EngineConfig = { 
      ...DEFAULT, 
      ...activePresetObj.default,
      ...(customGravity !== null && customGravity !== undefined && { gravity: customGravity }),
      ...(customSpeed !== null && customSpeed !== undefined && { speed: customSpeed }),
      ...(customColors !== null && customColors !== undefined && { colors: customColors }),
      ...(customMinSize !== null && customMinSize !== undefined && { minSize: customMinSize }),
      ...(customMaxSize !== null && customMaxSize !== undefined && { maxSize: customMaxSize }),
      ...(customMaxCount !== null && customMaxCount !== undefined && { maxCount: customMaxCount }),
    };

    console.log("❄️ [ParticleEngine] FINAL CONFIG RESOLVED:", config);

    let w = 0;
    let h = 0;

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width > 0 ? rect.width : window.innerWidth;
      h = rect.height > 0 ? rect.height : window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const spawn = (): Particle => {
      const phaseConfig = activePresetObj.phases?.[phaseRef.current] || {};

      let currentDirection = phaseConfig.direction || config.direction;
      let currentSpawnY    = phaseConfig.spawnY !== undefined ? phaseConfig.spawnY : (config.spawnY || 0.5);
      let currentMinSize   = config.minSize;
      let currentMaxSize   = config.maxSize;
      let currentSpeed     = config.speed;

      const cx = w / 2;
      const cy = h * currentSpawnY; 
      const spd = currentSpeed * rand(0.4, 1.3); 
      const size = rand(currentMinSize, currentMaxSize); 
      const angle = Math.random() * Math.PI * 2;

      let vx = 0;
      let vy = 0;

      switch (currentDirection) {
        case 'upward':   
          vx = rand(-1, 1) * spd * config.spread * 1.2; 
          vy = -spd * rand(1.2, 2.8) * config.spread; 
          break;
        case 'downward': 
          vx = rand(-0.15, 0.15) * spd; 
          vy = spd * rand(0.6, 1.2) * config.spread; 
          break;
        case 'spiral':   
          vx = Math.cos(angle + particles.current.length * 0.4) * spd * config.spread; 
          vy = Math.sin(angle + particles.current.length * 0.4) * spd * config.spread; 
          break;
        case 'radial':
        default:         
          vx = Math.cos(angle) * spd * config.spread * 2; 
          vy = Math.sin(angle) * spd * config.spread * 2;
      }

      const spawnX = (currentDirection === 'downward' || normalizedPreset === 'LOHRI') ? rand(0, w) : cx + rand(-20, 20);

      let baseMaxLife = 110;
      if (currentDirection === 'downward' || currentDirection === 'upward') {
         baseMaxLife = Math.max(350, Math.floor(h / (currentSpeed * 0.7))); 
      }

      return {
        x: spawnX,
        y: cy + rand(-10, 10),
        vx, vy, size,
        color: pick(config.colors),
        life: rand(baseMaxLife * 0.6, baseMaxLife),
        maxLife: baseMaxLife,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.1, 0.1),
      };
    };

    const draw = (p: Particle) => {
      const progress = 1 - p.life / p.maxLife;
      const alpha = Math.max(0, 1 - (progress * progress));

      const renderSize = normalizedPreset === 'LOHRI' ? p.size * (1 - progress * 0.8) : p.size;

      ctx.save();
      ctx.globalAlpha = alpha * 0.85; 
      
      if (config.glow) {
        ctx.globalCompositeOperation = 'lighter';
      }

      // 🚀 1. मकर संक्रांति विज़ुअल अपडेट (Micro-Kites)
      if (normalizedPreset === 'MAKAR_SANKRANTI') {
        const s = renderSize * 1.5; 
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.5;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = s * 1.8;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.7, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.7, p.y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(p.x, p.y + s);
        ctx.quadraticCurveTo(
          p.x + Math.sin(p.life * 0.15) * s * 0.4,
          p.y + s * 1.4,
          p.x + Math.sin(p.life * 0.08) * s * 0.7,
          p.y + s * 2.2
        );
        ctx.stroke();
      } 
      // 🚀 2. लोहड़ी विज़ुअल अपडेट (Layered 3D-feel Flickering Flames!)
      else if (normalizedPreset === 'LOHRI') {
        const s = renderSize * 1.6;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = s * 2;

        // क) बाहरी आवरण (Outer realistic teardrop flame)
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s * 1.4);
        ctx.quadraticCurveTo(p.x + s * 0.85, p.y - s * 0.3, p.x + s * 0.4, p.y + s * 0.4);
        ctx.quadraticCurveTo(p.x, p.y + s * 0.8, p.x - s * 0.4, p.y + s * 0.4);
        ctx.quadraticCurveTo(p.x - s * 0.8, p.y - s * 0.3, p.x, p.y - s * 1.4);
        ctx.closePath();
        ctx.fill();

        // ख) आंतरिक तीव्र ऊर्जा कोर (Bright white-yellow inner 3D core)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = s * 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y + s * 0.15, s * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      // 🚀 3. रक्षाबंधन विज़ुअल अपडेट (Exquisite Miniature Silk Rakhis)
      else if (normalizedPreset === 'RAKSHA_BANDHAN') {
        const s = renderSize * 1.4;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = s * 1.6;

        // क) कोमलता से लहराते हुए लाल कुमकुम धागे (Swaying red silk strings)
        ctx.strokeStyle = '#dc2626'; 
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y);
        ctx.quadraticCurveTo(p.x - s * 1.4, p.y + Math.sin(p.life * 0.1) * s * 0.25, p.x - s * 2.2, p.y);
        ctx.moveTo(p.x + s, p.y);
        ctx.quadraticCurveTo(p.x + s * 1.4, p.y + Math.cos(p.life * 0.1) * s * 0.25, p.x + s * 2.2, p.y);
        ctx.stroke();

        // ख) राखी की 4 रेशमी लाल/गुलाबी पंखुड़ियां (4 Silk Petals)
        ctx.fillStyle = p.color;
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + p.rotation; // Rotation can apply
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(ang) * s * 0.42, p.y + Math.sin(ang) * s * 0.42, s * 0.38, 0, Math.PI * 2);
          ctx.fill();
        }

        // ग) केंद्रीय स्वर्णिम मटका मोती (Shining golden center pearl)
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      // 🚀 4. डिफ़ॉल्ट ड्राइंग (क्रिसमस बर्फबारी और सामान्य गोल कणों के लिए)
      else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, renderSize, 0, Math.PI * 2);
        ctx.fill();

        if (config.wobble && p.size > 5) {
          ctx.globalAlpha = alpha * 0.4;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-renderSize * 0.25, -renderSize * 0.25, renderSize * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const animate = () => {
      const pb = PhaseBehavior[phaseRef.current] || PhaseBehavior.IDLE;

      ctx.clearRect(0, 0, w, h);

      const rawCount = config.maxCount;
      const Math_floor = Math.floor(rawCount * pb.intensity);
      
      const currentSpawnRate = normalizedPreset === 'CHRISTMAS' ? 0.35 : pb.spawnRate;

      if (particles.current.length < Math_floor && Math.random() < currentSpawnRate) {
        particles.current.push(spawn());
      }

      particles.current = particles.current.filter(p => {
        p.vy += config.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.rotation += p.rotationSpeed;

        if (config.direction === 'downward') {
          p.vx *= 0.94;  
          p.vy *= 0.995; 
        } else {
          p.vx *= 0.998;
          p.vy *= 0.998;
        }

        if (config.wobble) {
          p.vx += Math.sin(p.life * 0.04 + p.y * 0.005) * 0.05;
        }

        if (p.life > 0 && p.y < h + 60 && p.x > -60 && p.x < w + 60) {
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
    
  }, [preset, phase, customGravity, customSpeed, customColors, customMinSize, customMaxSize, customMaxCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
