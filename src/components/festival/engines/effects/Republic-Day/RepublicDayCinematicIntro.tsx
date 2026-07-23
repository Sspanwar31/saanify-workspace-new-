'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════TYPES & INTERFACES═══════════════════════════════════════════════════════════════ */
interface Props {
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ml: number;
  sz: number;
  r: number;
  g: number;
  b: number;
  a: number;
  tp: number;
  rot: number;
  rs: number;
  on: boolean;
  turbOff: number;
  depth: number;
  confettiColor: number;
  sparklePhase: number;
  bokehRadius: number;
  bokehAperture: number;
}

interface Star {
  x: number;
  y: number;
  sz: number;
  br: number;
  tw: number;
  tp: number;
}

interface Bird {
  x: number;
  y: number;
  vx: number;
  vy: number;
  wingPhase: number;
  wingSpeed: number;
  sz: number;
  depth: number;
  flapAmplitude: number;
}

interface Sukhoi {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Array<{x: number; y: number; a: number}>;
  afterburner: number;
  depth: number;
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
  tilt: number;
  shakeX: number;
  shakeY: number;
  breathing: number;
  dollySpeed: number;
  targetZoom: number;
}

interface Lighting {
  torchIntensity: number;
  ambientIntensity: number;
  sunIntensity: number;
  sunAngle: number;
  sunColor: { r: number; g: number; b: number };
  backLightIntensity: number;
  rimLightIntensity: number;
  fogDensity: number;
  fogColor: { r: number; g: number; b: number };
  exposure: number;
}

interface FlagCloth {
  points: Array<{x: number; y: number; z: number; vx: number; vy: number; vz: number}>;
  constraints: Array<{p1: number; p2: number; length: number}>;
  cols: number;
  rows: number;
  width: number;
  height: number;
}

interface FogLayer {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
  turbulence: number;
}

/* ═══════════════════════════════════════════════════════════════CONSTANTS═══════════════════════════════════════════════════════════════ */
const TOTAL_DURATION = 15000; // 15 seconds
const FLAG_COLS = 30;
const FLAG_ROWS = 20;
const STAR_COUNT = 300;
const MAX_PARTICLES = 500;
const BIRD_COUNT = 15;
const SUKHOI_COUNT = 3;
const FOG_LAYERS = 8;

/* ═══════════════════════════════════════════════════════════════HELPER FUNCTIONS═══════════════════════════════════════════════════════════════ */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3 - 2 * t);
};

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInQuart = (t: number) => t * t * t * t;

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(randomRange(min, max + 1));

const createGradient = (
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  stops: Array<{pos: number; color: string}>
) => {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(stop => gradient.addColorStop(stop.pos, stop.color));
  return gradient;
};

const createRadialGradient = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r0: number, r1: number,
  stops: Array<{pos: number; color: string}>
) => {
  const gradient = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(stop => gradient.addColorStop(stop.pos, stop.color));
  return gradient;
};

/* ═══════════════════════════════════════════════════════════════MAIN COMPONENT═══════════════════════════════════════════════════════════════ */
const RepublicDayCinematicIntro: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  // Refs for all dynamic elements
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const birdsRef = useRef<Bird[]>([]);
  const sukhoisRef = useRef<Sukhoi[]>([]);
  const cameraRef = useRef<Camera>({
    x: 0, y: 0, zoom: 1, tilt: 0, shakeX: 0, shakeY: 0,
    breathing: 0, dollySpeed: 0, targetZoom: 1
  });
  const lightingRef = useRef<Lighting>({
    torchIntensity: 0.8, ambientIntensity: 0.1, sunIntensity: 0,
    sunAngle: -0.5, sunColor: { r: 255, g: 200, b: 100 },
    backLightIntensity: 0, rimLightIntensity: 0, fogDensity: 0.3,
    fogColor: { r: 20, g: 30, b: 50 }, exposure: 0.8
  });
  const flagRef = useRef<FlagCloth | null>(null);
  const fogLayersRef = useRef<FogLayer[]>([]);
  const completedRef = useRef(false);

  // Initialize all systems
  const initializeSystems = useCallback((width: number, height: number) => {
    // Initialize stars
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: randomRange(0, width),
      y: randomRange(0, height * 0.6),
      sz: randomRange(0.5, 2.5),
      br: randomRange(0.3, 1),
      tw: randomRange(0.5, 2),
      tp: randomRange(0, Math.PI * 2)
    }));

    // Initialize particles
    particlesRef.current = Array.from({ length: MAX_PARTICLES }, () => createParticle(width, height));

    // Initialize birds
    birdsRef.current = Array.from({ length: BIRD_COUNT }, () => ({
      x: randomRange(-200, width + 200),
      y: randomRange(height * 0.2, height * 0.5),
      vx: randomRange(0.5, 1.5),
      vy: randomRange(-0.2, 0.2),
      wingPhase: randomRange(0, Math.PI * 2),
      wingSpeed: randomRange(2, 4),
      sz: randomRange(3, 8),
      depth: randomRange(0.5, 1.5),
      flapAmplitude: randomRange(0.3, 0.8)
    }));

    // Initialize Sukhois
    sukhoisRef.current = Array.from({ length: SUKHOI_COUNT }, (_, i) => ({
      x: -300 - i * 150,
      y: height * 0.15 + i * 40,
      vx: randomRange(3, 5),
      vy: randomRange(-0.1, 0.1),
      trail: [],
      afterburner: 1,
      depth: 0.8 + i * 0.1
    }));

    // Initialize flag cloth simulation
    initializeFlagCloth();

    // Initialize fog layers
    fogLayersRef.current = Array.from({ length: FOG_LAYERS }, () => ({
      x: randomRange(-width * 0.5, width * 0.5),
      y: randomRange(height * 0.6, height * 0.9),
      width: randomRange(width * 0.8, width * 1.5),
      height: randomRange(30, 80),
      speed: randomRange(0.2, 0.8),
      opacity: randomRange(0.1, 0.3),
      turbulence: randomRange(0.5, 2)
    }));
  }, []);

  const createParticle = (width: number, height: number): Particle => ({
    x: randomRange(0, width),
    y: randomRange(0, height),
    vx: randomRange(-0.5, 0.5),
    vy: randomRange(-0.5, 0.5),
    life: 0,
    ml: randomRange(60, 180),
    sz: randomRange(1, 4),
    r: randomInt(200, 255),
    g: randomInt(150, 220),
    b: randomInt(0, 50),
    a: randomRange(0.3, 0.8),
    tp: randomInt(0, 5), // 0: golden dust, 1: ember, 2: lens dust, 3: confetti, 4: sparkle, 5: bokeh
    rot: randomRange(0, Math.PI * 2),
    rs: randomRange(-0.05, 0.05),
    on: false,
    turbOff: randomRange(0, Math.PI * 2),
    depth: randomRange(0.5, 1.5),
    confettiColor: randomInt(0, 2), // 0: saffron, 1: white, 2: green
    sparklePhase: randomRange(0, Math.PI * 2),
    bokehRadius: randomRange(5, 20),
    bokehAperture: randomRange(3, 8)
  });

  const initializeFlagCloth = () => {
    const cols = FLAG_COLS;
    const rows = FLAG_ROWS;
    const points: FlagCloth['points'] = [];
    const constraints: FlagCloth['constraints'] = [];
    
    // Create points in a grid
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        points.push({
          x: i * 8,
          y: j * 6,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0
        });
      }
    }
    
    // Create constraints between adjacent points
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const idx = j * (cols + 1) + i;
        if (i < cols) {
          constraints.push({ p1: idx, p2: idx + 1, length: 8 });
        }
        if (j < rows) {
          constraints.push({ p1: idx, p2: idx + (cols + 1), length: 6 });
        }
      }
    }
    
    flagRef.current = { points, constraints, cols, rows, width: cols * 8, height: rows * 6 };
  };

  // Update flag cloth simulation
  const updateFlagCloth = (time: number, windStrength: number) => {
    if (!flagRef.current) return;
    
    const flag = flagRef.current;
    const gravity = 0.05;
    const damping = 0.98;
    const windTime = time * 0.001;
    
    // Apply forces to each point
    for (let i = 0; i < flag.points.length; i++) {
      const p = flag.points[i];
      const col = i % (flag.cols + 1);
      
      // Skip first column (attached to pole)
      if (col === 0) continue;
      
      // Gravity
      p.vy += gravity;
      
      // Wind force with turbulence
      const windX = Math.sin(windTime * 2 + p.y * 0.05 + p.x * 0.02) * windStrength * 0.3;
      const windZ = Math.sin(windTime * 3 + p.x * 0.08) * windStrength * 0.2;
      p.vx += windX;
      p.vz += windZ;
      
      // Apply damping
      p.vx *= damping;
      p.vy *= damping;
      p.vz *= damping;
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
    }
    
    // Solve constraints multiple times for stability
    for (let iter = 0; iter < 5; iter++) {
      for (const c of flag.constraints) {
        const p1 = flag.points[c.p1];
        const p2 = flag.points[c.p2];
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist === 0) continue;
        
        const diff = (c.length - dist) / dist * 0.5;
        const offsetX = dx * diff;
        const offsetY = dy * diff;
        const offsetZ = dz * diff;
        
        // Don't move first column points
        if (c.p1 % (flag.cols + 1) !== 0) {
          p1.x -= offsetX;
          p1.y -= offsetY;
          p1.z -= offsetZ;
        }
        
        if (c.p2 % (flag.cols + 1) !== 0) {
          p2.x += offsetX;
          p2.y += offsetY;
          p2.z += offsetZ;
        }
      }
    }
  };

  // Update camera based on timeline
  const updateCamera = (progress: number, time: number) => {
    const camera = cameraRef.current;
    
    // Breathing effect
    camera.breathing = Math.sin(time * 0.001) * 0.002;
    
    // Micro shake
    camera.shakeX = Math.sin(time * 0.003) * 0.5 + Math.sin(time * 0.007) * 0.3;
    camera.shakeY = Math.cos(time * 0.004) * 0.3 + Math.cos(time * 0.006) * 0.2;
    
    // Scene-based camera movement
    if (progress < 0.167) {
      // Scene 1: Static with subtle breathing
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 1;
      camera.tilt = 0;
    } else if (progress < 0.333) {
      // Scene 2: Slow dolly forward
      const t = smoothstep(0.167, 0.333, progress);
      camera.x = lerp(0, 20, t);
      camera.y = lerp(0, -10, t);
      camera.zoom = lerp(1, 1.05, t);
      camera.tilt = lerp(0, -0.02, t);
    } else if (progress < 0.533) {
      // Scene 3: Continue dolly, slight tilt up
      const t = smoothstep(0.333, 0.533, progress);
      camera.x = lerp(20, 50, t);
      camera.y = lerp(-10, -20, t);
      camera.zoom = lerp(1.05, 1.1, t);
      camera.tilt = lerp(-0.02, -0.03, t);
    } else if (progress < 0.667) {
      // Scene 4: Continue dolly
      const t = smoothstep(0.533, 0.667, progress);
      camera.x = lerp(50, 80, t);
      camera.y = lerp(-20, -15, t);
      camera.zoom = lerp(1.1, 1.15, t);
      camera.tilt = lerp(-0.03, -0.025, t);
    } else if (progress < 0.867) {
      // Scene 5: Continue dolly, prepare for zoom
      const t = smoothstep(0.667, 0.867, progress);
      camera.x = lerp(80, 100, t);
      camera.y = lerp(-15, -5, t);
      camera.zoom = lerp(1.15, 1.2, t);
      camera.tilt = lerp(-0.025, -0.01, t);
    } else {
      // Scene 6: Push zoom into flag
      const t = smoothstep(0.867, 1.0, progress);
      camera.x = lerp(100, 150, t);
      camera.y = lerp(-5, 0, t);
      camera.zoom = lerp(1.2, 2.0, t);
      camera.tilt = lerp(-0.01, 0, t);
    }
    
    // Apply breathing and shake
    camera.zoom += camera.breathing;
    camera.x += camera.shakeX;
    camera.y += camera.shakeY;
  };

  // Update lighting based on timeline
  const updateLighting = (progress: number) => {
    const lighting = lightingRef.current;
    
    if (progress < 0.167) {
      // Scene 1: Night with torch
      lighting.torchIntensity = 0.8;
      lighting.ambientIntensity = 0.1;
      lighting.sunIntensity = 0;
      lighting.fogDensity = 0.4;
      lighting.fogColor = { r: 20, g: 30, b: 50 };
      lighting.exposure = 0.7;
    } else if (progress < 0.333) {
      // Scene 2: Torch brighter
      const t = smoothstep(0.167, 0.333, progress);
      lighting.torchIntensity = lerp(0.8, 1.0, t);
      lighting.ambientIntensity = lerp(0.1, 0.15, t);
      lighting.sunIntensity = 0;
      lighting.fogDensity = lerp(0.4, 0.35, t);
      lighting.exposure = lerp(0.7, 0.75, t);
    } else if (progress < 0.533) {
      // Scene 3: Sunrise begins
      const t = smoothstep(0.333, 0.533, progress);
      lighting.torchIntensity = lerp(1.0, 0.6, t);
      lighting.ambientIntensity = lerp(0.15, 0.3, t);
      lighting.sunIntensity = lerp(0, 0.4, t);
      lighting.sunAngle = lerp(-0.5, -0.3, t);
      lighting.sunColor = { r: 255, g: lerp(150, 200, t), b: lerp(50, 100, t) };
      lighting.fogDensity = lerp(0.35, 0.25, t);
      lighting.fogColor = { r: lerp(20, 60, t), g: lerp(30, 40, t), b: lerp(50, 50, t) };
      lighting.exposure = lerp(0.75, 0.85, t);
    } else if (progress < 0.667) {
      // Scene 4: Sunrise continues
      const t = smoothstep(0.533, 0.667, progress);
      lighting.torchIntensity = lerp(0.6, 0.3, t);
      lighting.ambientIntensity = lerp(0.3, 0.5, t);
      lighting.sunIntensity = lerp(0.4, 0.7, t);
      lighting.sunAngle = lerp(-0.3, -0.1, t);
      lighting.sunColor = { r: 255, g: lerp(200, 220, t), b: lerp(100, 150, t) };
      lighting.fogDensity = lerp(0.25, 0.2, t);
      lighting.fogColor = { r: lerp(60, 100, t), g: lerp(40, 60, t), b: lerp(50, 50, t) };
      lighting.exposure = lerp(0.85, 0.95, t);
    } else if (progress < 0.867) {
      // Scene 5: Full morning light
      const t = smoothstep(0.667, 0.867, progress);
      lighting.torchIntensity = lerp(0.3, 0.1, t);
      lighting.ambientIntensity = lerp(0.5, 0.7, t);
      lighting.sunIntensity = lerp(0.7, 1.0, t);
      lighting.sunAngle = lerp(-0.1, 0.1, t);
      lighting.sunColor = { r: 255, g: lerp(220, 240, t), b: lerp(150, 200, t) };
      lighting.fogDensity = lerp(0.2, 0.15, t);
      lighting.fogColor = { r: lerp(100, 140, t), g: lerp(60, 80, t), b: lerp(50, 60, t) };
      lighting.exposure = lerp(0.95, 1.0, t);
      lighting.backLightIntensity = lerp(0, 0.3, t);
      lighting.rimLightIntensity = lerp(0, 0.5, t);
    } else {
      // Scene 6: Strong backlight
      const t = smoothstep(0.867, 1.0, progress);
      lighting.torchIntensity = lerp(0.1, 0, t);
      lighting.ambientIntensity = lerp(0.7, 0.8, t);
      lighting.sunIntensity = lerp(1.0, 1.2, t);
      lighting.sunAngle = lerp(0.1, 0.2, t);
      lighting.sunColor = { r: 255, g: lerp(240, 250, t), b: lerp(200, 230, t) };
      lighting.fogDensity = lerp(0.15, 0.1, t);
      lighting.fogColor = { r: lerp(140, 180, t), g: lerp(80, 100, t), b: lerp(60, 70, t) };
      lighting.exposure = lerp(1.0, 1.1, t);
      lighting.backLightIntensity = lerp(0.3, 0.6, t);
      lighting.rimLightIntensity = lerp(0.5, 0.8, t);
    }
  };

  // Update particles
  const updateParticles = (progress: number, time: number, width: number, height: number) => {
    const particles = particlesRef.current;
    
    // Activate particles based on scene
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      if (!p.on) {
        // Activate particles based on scene
        if (progress > 0.333 && p.tp === 0 && Math.random() < 0.02) {
          // Golden dust in scene 3+
          p.on = true;
          p.life = 0;
          p.x = randomRange(0, width);
          p.y = randomRange(height * 0.4, height * 0.9);
          p.vx = randomRange(-0.3, 0.3);
          p.vy = randomRange(-0.5, -0.1);
        } else if (progress > 0.533 && p.tp === 1 && Math.random() < 0.01) {
          // Embers in scene 4+
          p.on = true;
          p.life = 0;
          p.x = randomRange(width * 0.2, width * 0.8);
          p.y = height * 0.8;
          p.vx = randomRange(-0.2, 0.2);
          p.vy = randomRange(-1.5, -0.5);
        } else if (progress > 0.667 && p.tp === 2 && Math.random() < 0.01) {
          // Lens dust in scene 5+
          p.on = true;
          p.life = 0;
          p.x = randomRange(0, width);
          p.y = randomRange(0, height);
          p.vx = randomRange(-0.1, 0.1);
          p.vy = randomRange(-0.1, 0.1);
        } else if (progress > 0.667 && p.tp === 3 && Math.random() < 0.015) {
          // Confetti in scene 5+
          p.on = true;
          p.life = 0;
          p.x = randomRange(0, width);
          p.y = -10;
          p.vx = randomRange(-1, 1);
          p.vy = randomRange(0.5, 1.5);
          p.confettiColor = randomInt(0, 2);
        } else if (progress > 0.667 && p.tp === 4 && Math.random() < 0.02) {
          // Sparkles in scene 5+
          p.on = true;
          p.life = 0;
          p.x = randomRange(0, width);
          p.y = randomRange(0, height);
          p.vx = 0;
          p.vy = 0;
        } else if (progress > 0.533 && p.tp === 5 && Math.random() < 0.005) {
          // Bokeh in scene 4+
          p.on = true;
          p.life = 0;
          p.x = randomRange(0, width);
          p.y = randomRange(0, height);
          p.vx = randomRange(-0.05, 0.05);
          p.vy = randomRange(-0.05, 0.05);
          p.bokehRadius = randomRange(10, 30);
          p.bokehAperture = randomRange(4, 10);
        }
      } else {
        // Update active particles
        p.life++;
        
        // Apply turbulence
        const turbulenceX = Math.sin(time * 0.002 + p.turbOff) * 0.1;
        const turbulenceY = Math.cos(time * 0.003 + p.turbOff) * 0.1;
        
        // Update position
        p.x += p.vx + turbulenceX;
        p.y += p.vy + turbulenceY;
        p.rot += p.rs;
        
        // Special behavior for different particle types
        if (p.tp === 1) { // Embers
          p.vx += Math.sin(time * 0.005 + p.turbOff) * 0.02;
          p.sz = lerp(p.sz, 0.5, 0.01);
        } else if (p.tp === 3) { // Confetti
          p.vx += Math.sin(time * 0.003 + p.turbOff) * 0.05;
          p.vy += 0.01; // Gravity
        } else if (p.tp === 4) { // Sparkles
          p.sparklePhase += 0.1;
        }
        
        // Reset if life exceeded
        if (p.life > p.ml || p.y > height + 10 || p.x < -10 || p.x > width + 10) {
          p.on = false;
        }
      }
    }
  };

  // Update birds
  const updateBirds = (progress: number, time: number, width: number, height: number) => {
    if (progress < 0.667) return; // Birds only in scene 5+
    
    const birds = birdsRef.current;
    const birdVisibility = smoothstep(0.667, 0.7, progress);
    
    for (const bird of birds) {
      // Update wing animation
      bird.wingPhase += bird.wingSpeed * 0.016;
      
      // Update position
      bird.x += bird.vx * birdVisibility;
      bird.y += bird.vy + Math.sin(time * 0.001 + bird.wingPhase) * 0.2;
      
      // Reset if off screen
      if (bird.x > width + 100) {
        bird.x = -100;
        bird.y = randomRange(height * 0.2, height * 0.5);
        bird.vx = randomRange(0.5, 1.5);
      }
    }
  };

  // Update Sukhois
  const updateSukhois = (progress: number, time: number, width: number, height: number) => {
    if (progress < 0.667 || progress > 0.867) return; // Sukhois only in scene 5
    
    const sukhois = sukhoisRef.current;
    const jetVisibility = smoothstep(0.667, 0.7, progress) * (1 - smoothstep(0.83, 0.867, progress));
    
    for (const jet of sukhois) {
      // Update position
      jet.x += jet.vx * jetVisibility;
      jet.y += jet.vy * jetVisibility;
      
      // Add to trail
      if (jetVisibility > 0.1) {
        jet.trail.push({ x: jet.x, y: jet.y, a: 1 });
        
        // Limit trail length
        if (jet.trail.length > 100) {
          jet.trail.shift();
        }
      }
      
      // Fade trail
      for (const point of jet.trail) {
        point.a *= 0.98;
      }
      
      // Remove faded points
      jet.trail = jet.trail.filter(point => point.a > 0.01);
      
      // Afterburner flicker
      jet.afterburner = 0.7 + Math.sin(time * 0.02 + jet.depth * 10) * 0.3;
      
      // Reset if off screen
      if (jet.x > width + 200) {
        jet.x = -300;
        jet.y = height * 0.15 + randomRange(-30, 30);
        jet.trail = [];
      }
    }
  };

  // Update fog layers
  const updateFogLayers = (progress: number, time: number, width: number) => {
    const fogLayers = fogLayersRef.current;
    const fogVisibility = 1 - smoothstep(0.867, 1.0, progress);
    
    for (const fog of fogLayers) {
      // Move fog
      fog.x += fog.speed * fogVisibility;
      
      // Add turbulence
      const turbulence = Math.sin(time * 0.001 * fog.turbulence) * 20;
      
      // Reset if off screen
      if (fog.x > width + fog.width) {
        fog.x = -fog.width + turbulence;
        fog.y += randomRange(-20, 20);
      }
    }
  };

  // Draw sky
  const drawSky = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    // Night sky for scene 1-2
    if (progress < 0.333) {
      const nightOpacity = 1 - smoothstep(0.167, 0.333, progress) * 0.5;
      const gradient = createGradient(ctx, 0, 0, 0, height, [
        { pos: 0, color: `rgba(10, 15, 40, ${nightOpacity})` },
        { pos: 0.5, color: `rgba(15, 25, 60, ${nightOpacity})` },
        { pos: 1, color: `rgba(20, 30, 50, ${nightOpacity})` }
      ]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Sunrise sky for scene 3-4
    if (progress > 0.333 && progress < 0.667) {
      const t = smoothstep(0.333, 0.667, progress);
      const gradient = createGradient(ctx, 0, 0, 0, height, [
        { pos: 0, color: `rgba(${lerp(10, 40, t)}, ${lerp(15, 50, t)}, ${lerp(40, 80, t)}, 1)` },
        { pos: 0.4, color: `rgba(${lerp(15, 80, t)}, ${lerp(25, 60, t)}, ${lerp(60, 70, t)}, 1)` },
        { pos: 0.7, color: `rgba(${lerp(20, 180, t)}, ${lerp(30, 100, t)}, ${lerp(50, 50, t)}, 1)` },
        { pos: 1, color: `rgba(${lerp(20, 220, t)}, ${lerp(30, 150, t)}, ${lerp(50, 80, t)}, 1)` }
      ]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Morning sky for scene 5-6
    if (progress >= 0.667) {
      const t = smoothstep(0.667, 0.867, progress);
      const gradient = createGradient(ctx, 0, 0, 0, height, [
        { pos: 0, color: `rgba(${lerp(40, 70, t)}, ${lerp(50, 100, t)}, ${lerp(80, 150, t)}, 1)` },
        { pos: 0.4, color: `rgba(${lerp(80, 120, t)}, ${lerp(60, 90, t)}, ${lerp(70, 80, t)}, 1)` },
        { pos: 0.7, color: `rgba(${lerp(180, 220, t)}, ${lerp(100, 140, t)}, ${lerp(50, 60, t)}, 1)` },
        { pos: 1, color: `rgba(${lerp(220, 250, t)}, ${lerp(150, 180, t)}, ${lerp(80, 90, t)}, 1)` }
      ]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Stars (only in night scenes)
    if (progress < 0.533) {
      const starOpacity = 1 - smoothstep(0.333, 0.533, progress);
      drawStars(ctx, time, starOpacity);
    }
    
    // Moon (only in night scenes)
    if (progress < 0.533) {
      const moonOpacity = 1 - smoothstep(0.333, 0.533, progress);
      drawMoon(ctx, width, height, moonOpacity);
    }
    
    // Sun (appears in scene 3+)
    if (progress > 0.333) {
      const sunOpacity = smoothstep(0.333, 0.533, progress);
      drawSun(ctx, width, height, progress, time, sunOpacity);
    }
  };

  // Draw stars
  const drawStars = (ctx: CanvasRenderingContext2D, time: number, opacity: number) => {
    const stars = starsRef.current;
    
    for (const star of stars) {
      const twinkle = Math.sin(time * 0.001 * star.tw + star.tp) * 0.3 + 0.7;
      const alpha = star.br * twinkle * opacity;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 240, ${alpha})`;
      ctx.fill();
      
      // Add glow to brighter stars
      if (star.sz > 1.5) {
        const glow = createRadialGradient(ctx, star.x, star.y, 0, star.x, star.y, star.sz * 3, [
          { pos: 0, color: `rgba(255, 255, 240, ${alpha * 0.5})` },
          { pos: 1, color: `rgba(255, 255, 240, 0)` }
        ]);
        ctx.fillStyle = glow;
        ctx.fillRect(star.x - star.sz * 3, star.y - star.sz * 3, star.sz * 6, star.sz * 6);
      }
    }
  };

  // Draw moon
  const drawMoon = (ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number) => {
    const moonX = width * 0.8;
    const moonY = height * 0.15;
    const moonRadius = 30;
    
    // Moon glow
    const glow = createRadialGradient(ctx, moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius * 4, [
      { pos: 0, color: `rgba(200, 210, 230, ${0.2 * opacity})` },
      { pos: 1, color: `rgba(200, 210, 230, 0)` }
    ]);
    ctx.fillStyle = glow;
    ctx.fillRect(moonX - moonRadius * 4, moonY - moonRadius * 4, moonRadius * 8, moonRadius * 8);
    
    // Moon body
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 225, 235, ${opacity})`;
    ctx.fill();
    
    // Moon craters
    ctx.beginPath();
    ctx.arc(moonX - 8, moonY - 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 205, 215, ${opacity * 0.7})`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(moonX + 10, moonY + 8, 7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 205, 215, ${opacity * 0.7})`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(moonX + 5, moonY - 12, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 205, 215, ${opacity * 0.7})`;
    ctx.fill();
  };

  // Draw sun
  const drawSun = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number, opacity: number) => {
    const sunProgress = smoothstep(0.333, 0.667, progress);
    const sunX = lerp(width * 0.3, width * 0.5, sunProgress);
    const sunY = lerp(height * 0.8, height * 0.6, sunProgress);
    const sunRadius = 40;
    
    // God rays
    if (progress > 0.4) {
      const rayOpacity = smoothstep(0.4, 0.6, progress) * opacity * 0.3;
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(time * 0.0001);
      
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const rayLength = sunRadius * 8;
        const rayWidth = sunRadius * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
          Math.cos(angle - 0.05) * rayLength,
          Math.sin(angle - 0.05) * rayLength
        );
        ctx.lineTo(
          Math.cos(angle + 0.05) * rayLength,
          Math.sin(angle + 0.05) * rayLength
        );
        ctx.closePath();
        
        const rayGradient = createRadialGradient(ctx, 0, 0, sunRadius, 0, 0, rayLength, [
          { pos: 0, color: `rgba(255, 200, 100, ${rayOpacity})` },
          { pos: 1, color: `rgba(255, 200, 100, 0)` }
        ]);
        ctx.fillStyle = rayGradient;
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    // Sun glow
    const glow = createRadialGradient(ctx, sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 5, [
      { pos: 0, color: `rgba(255, 200, 100, ${0.4 * opacity})` },
      { pos: 0.5, color: `rgba(255, 150, 50, ${0.1 * opacity})` },
      { pos: 1, color: `rgba(255, 100, 0, 0)` }
    ]);
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - sunRadius * 5, sunY - sunRadius * 5, sunRadius * 10, sunRadius * 10);
    
    // Sun body
    const sunBody = createRadialGradient(ctx, sunX, sunY, 0, sunX, sunY, sunRadius, [
      { pos: 0, color: `rgba(255, 255, 200, ${opacity})` },
      { pos: 0.7, color: `rgba(255, 220, 150, ${opacity})` },
      { pos: 1, color: `rgba(255, 180, 100, ${opacity * 0.8})` }
    ]);
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fillStyle = sunBody;
    ctx.fill();
    
    // Lens flare (only in scene 5+)
    if (progress > 0.667) {
      const flareOpacity = smoothstep(0.667, 0.7, progress) * opacity * 0.5;
      drawLensFlare(ctx, sunX, sunY, width, height, time, flareOpacity);
    }
  };

  // Draw lens flare
  const drawLensFlare = (ctx: CanvasRenderingContext2D, sunX: number, sunY: number, width: number, height: number, time: number, opacity: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Flare elements between sun and center
    const flareCount = 5;
    for (let i = 1; i <= flareCount; i++) {
      const t = i / (flareCount + 1);
      const x = lerp(sunX, centerX, t);
      const y = lerp(sunY, centerY, t);
      const size = (1 - t) * 30 + 10;
      
      const flare = createRadialGradient(ctx, x, y, 0, x, y, size, [
        { pos: 0, color: `rgba(255, 200, 100, ${opacity * (1 - t * 0.7)})` },
        { pos: 0.5, color: `rgba(255, 150, 50, ${opacity * (1 - t * 0.7) * 0.5})` },
        { pos: 1, color: `rgba(255, 100, 0, 0)` }
      ]);
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = flare;
      ctx.fill();
    }
    
    // Anamorphic streak
    ctx.save();
    ctx.globalAlpha = opacity * 0.3;
    ctx.beginPath();
    ctx.ellipse(sunX, sunY, 200, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
    ctx.fill();
    ctx.restore();
  };

  // Draw fog layers
  const drawFog = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    const fogLayers = fogLayersRef.current;
    const lighting = lightingRef.current;
    const fogVisibility = 1 - smoothstep(0.867, 1.0, progress);
    
    for (const fog of fogLayers) {
      const opacity = fog.opacity * fogVisibility * lighting.fogDensity * 2;
      const turbulence = Math.sin(time * 0.001 * fog.turbulence) * 20;
      
      ctx.save();
      ctx.globalAlpha = opacity;
      
      const fogGradient = createRadialGradient(
        ctx, 
        fog.x + fog.width / 2, 
        fog.y + fog.height / 2, 
        0,
        fog.x + fog.width / 2, 
        fog.y + fog.height / 2, 
        fog.width / 2
      );
      
      fogGradient.addColorStop(0, `rgba(${lighting.fogColor.r}, ${lighting.fogColor.g}, ${lighting.fogColor.b}, 0.8)`);
      fogGradient.addColorStop(0.7, `rgba(${lighting.fogColor.r}, ${lighting.fogColor.g}, ${lighting.fogColor.b}, 0.3)`);
      fogGradient.addColorStop(1, `rgba(${lighting.fogColor.r}, ${lighting.fogColor.g}, ${lighting.fogColor.b}, 0)`);
      
      ctx.fillStyle = fogGradient;
      ctx.fillRect(fog.x + turbulence, fog.y, fog.width, fog.height);
      
      ctx.restore();
    }
  };

  // Draw India Gate
  const drawIndiaGate = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    // India Gate visibility
    const visibility = smoothstep(0.167, 0.333, progress);
    if (visibility <= 0) return;
    
    const lighting = lightingRef.current;
    const camera = cameraRef.current;
    
    // Calculate position with camera transform
    const gateX = width * 0.5 + camera.x;
    const gateY = height * 0.4 + camera.y;
    const gateScale = camera.zoom;
    
    ctx.save();
    ctx.globalAlpha = visibility;
    ctx.translate(gateX, gateY);
    ctx.scale(gateScale, gateScale);
    
    // Apply tilt
    ctx.transform(1, camera.tilt, 0, 1, 0, 0);
    
    // Main gate dimensions
    const gateWidth = 300;
    const gateHeight = 200;
    const archWidth = 120;
    const archHeight = 150;
    const pillarWidth = 40;
    const pillarHeight = gateHeight + 30;
    const canopyWidth = gateWidth + 40;
    const canopyHeight = 30;
    
    // Calculate lighting
    const torchLightX = -gateWidth / 2 - 20;
    const torchLightY = -pillarHeight / 2;
    const sunLightX = Math.cos(lighting.sunAngle) * 100;
    const sunLightY = Math.sin(lighting.sunAngle) * 100;
    
    // Ground shadow
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * (lighting.sunIntensity + lighting.torchIntensity * 0.3)})`;
    ctx.beginPath();
    ctx.ellipse(0, pillarHeight / 2 + 20, gateWidth * 0.7, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Steps
    for (let i = 0; i < 5; i++) {
      const stepWidth = gateWidth + 40 + i * 10;
      const stepHeight = 8;
      const stepY = pillarHeight / 2 - i * stepHeight;
      
      ctx.fillStyle = `rgb(${180 - i * 5}, ${160 - i * 5}, ${130 - i * 5})`;
      ctx.fillRect(-stepWidth / 2, stepY, stepWidth, stepHeight);
      
      // Step shadow
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + i * 0.02})`;
      ctx.fillRect(-stepWidth / 2, stepY + stepHeight - 2, stepWidth, 2);
    }
    
    // Left pillar
    drawPillar(ctx, -gateWidth / 2, -pillarHeight / 2, pillarWidth, pillarHeight, lighting, torchLightX, torchLightY, sunLightX, sunLightY);
    
    // Right pillar
    drawPillar(ctx, gateWidth / 2 - pillarWidth, -pillarHeight / 2, pillarWidth, pillarHeight, lighting, torchLightX, torchLightY, sunLightX, sunLightY);
    
    // Arch
    drawArch(ctx, 0, 0, archWidth, archHeight, lighting, torchLightX, torchLightY, sunLightX, sunLightY);
    
    // Top canopy
    drawCanopy(ctx, 0, -pillarHeight / 2 - canopyHeight, canopyWidth, canopyHeight, lighting, torchLightX, torchLightY, sunLightX, sunLightY);
    
    // Stone carvings and details
    drawStoneDetails(ctx, 0, 0, gateWidth, gateHeight, archWidth, archHeight, lighting, time);
    
    ctx.restore();
  };

  // Draw a pillar with lighting
  const drawPillar = (
    ctx: CanvasRenderingContext2D, 
    x: number, y: number, 
    width: number, height: number,
    lighting: Lighting,
    torchLightX: number, torchLightY: number,
    sunLightX: number, sunLightY: number
  ) => {
    // Base color
    const baseR = 200;
    const baseG = 180;
    const baseB = 150;
    
    // Calculate lighting influence
    const torchDist = Math.sqrt((x + width/2 - torchLightX) ** 2 + (y + height/2 - torchLightY) ** 2);
    const torchInfluence = Math.max(0, 1 - torchDist / 300) * lighting.torchIntensity;
    
    const sunInfluence = lighting.sunIntensity;
    const ambientInfluence = lighting.ambientIntensity;
    
    // Final color
    const r = clamp(baseR * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.8), 0, 255);
    const g = clamp(baseG * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.6), 0, 255);
    const b = clamp(baseB * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.5), 0, 255);
    
    // Main pillar body
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, width, height);
    
    // Pillar gradient for depth
    const pillarGradient = createGradient(ctx, x, y, x + width, y, [
      { pos: 0, color: `rgba(0, 0, 0, 0.2)` },
      { pos: 0.3, color: `rgba(255, 255, 255, 0.1)` },
      { pos: 0.7, color: `rgba(0, 0, 0, 0.05)` },
      { pos: 1, color: `rgba(0, 0, 0, 0.3)` }
    ]);
    ctx.fillStyle = pillarGradient;
    ctx.fillRect(x, y, width, height);
    
    // Pillar edges
    ctx.strokeStyle = `rgba(0, 0, 0, 0.3)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // Stone texture
    for (let i = 0; i < height; i += 20) {
      ctx.strokeStyle = `rgba(0, 0, 0, 0.05)`;
      ctx.beginPath();
      ctx.moveTo(x, y + i);
      ctx.lineTo(x + width, y + i);
      ctx.stroke();
    }
    
    // Torch light highlight
    if (torchInfluence > 0.1) {
      const highlight = createRadialGradient(
        ctx, 
        torchLightX, torchLightY, 0,
        torchLightX, torchLightY, 200
      );
      highlight.addColorStop(0, `rgba(255, 150, 50, ${torchInfluence * 0.3})`);
      highlight.addColorStop(1, `rgba(255, 150, 50, 0)`);
      
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = highlight;
      ctx.fillRect(x, y, width, height);
      ctx.restore();
    }
    
    // Sun light highlight
    if (sunInfluence > 0.3) {
      const sunHighlight = createRadialGradient(
        ctx,
        x + width + sunLightX, y + height / 2 + sunLightY, 0,
        x + width + sunLightX, y + height / 2 + sunLightY, 200
      );
      sunHighlight.addColorStop(0, `rgba(${lighting.sunColor.r}, ${lighting.sunColor.g}, ${lighting.sunColor.b}, ${(sunInfluence - 0.3) * 0.5})`);
      sunHighlight.addColorStop(1, `rgba(${lighting.sunColor.r}, ${lighting.sunColor.g}, ${lighting.sunColor.b}, 0)`);
      
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = sunHighlight;
      ctx.fillRect(x, y, width, height);
      ctx.restore();
    }
  };

  // Draw arch with lighting
  const drawArch = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, centerY: number, 
    width: number, height: number,
    lighting: Lighting,
    torchLightX: number, torchLightY: number,
    sunLightX: number, sunLightY: number
  ) => {
    // Base color
    const baseR = 190;
    const baseG = 170;
    const baseB = 140;
    
    // Calculate lighting influence
    const torchDist = Math.sqrt((centerX - torchLightX) ** 2 + (centerY - torchLightY) ** 2);
    const torchInfluence = Math.max(0, 1 - torchDist / 300) * lighting.torchIntensity;
    
    const sunInfluence = lighting.sunIntensity;
    const ambientInfluence = lighting.ambientIntensity;
    
    // Final color
    const r = clamp(baseR * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.8), 0, 255);
    const g = clamp(baseG * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.6), 0, 255);
    const b = clamp(baseB * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.5), 0, 255);
    
    // Arch path
    ctx.beginPath();
    ctx.moveTo(centerX - width / 2, centerY);
    ctx.lineTo(centerX - width / 2, centerY - height + width / 2);
    ctx.arc(centerX, centerY - height + width / 2, width / 2, Math.PI, 0, false);
    ctx.lineTo(centerX + width / 2, centerY);
    ctx.closePath();
    
    // Fill arch
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();
    
    // Arch gradient for depth
    const archGradient = createGradient(ctx, centerX - width / 2, centerY, centerX + width / 2, centerY, [
      { pos: 0, color: `rgba(0, 0, 0, 0.2)` },
      { pos: 0.3, color: `rgba(255, 255, 255, 0.1)` },
      { pos: 0.7, color: `rgba(0, 0, 0, 0.05)` },
      { pos: 1, color: `rgba(0, 0, 0, 0.3)` }
    ]);
    ctx.fillStyle = archGradient;
    ctx.fill();
    
    // Arch edges
    ctx.strokeStyle = `rgba(0, 0, 0, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Arch inner shadow
    ctx.beginPath();
    ctx.moveTo(centerX - width / 2 + 5, centerY);
    ctx.lineTo(centerX - width / 2 + 5, centerY - height + width / 2 + 5);
    ctx.arc(centerX, centerY - height + width / 2 + 5, width / 2 - 5, Math.PI, 0, false);
    ctx.lineTo(centerX + width / 2 - 5, centerY);
    ctx.closePath();
    ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
    ctx.fill();
    
    // Torch light highlight
    if (torchInfluence > 0.1) {
      const highlight = createRadialGradient(
        ctx, 
        torchLightX, torchLightY, 0,
        torchLightX, torchLightY, 200
      );
      highlight.addColorStop(0, `rgba(255, 150, 50, ${torchInfluence * 0.3})`);
      highlight.addColorStop(1, `rgba(255, 150, 50, 0)`);
      
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = highlight;
      ctx.fill();
      ctx.restore();
    }
  };

  // Draw canopy with lighting
  const drawCanopy = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, y: number, 
    width: number, height: number,
    lighting: Lighting,
    torchLightX: number, torchLightY: number,
    sunLightX: number, sunLightY: number
  ) => {
    // Base color
    const baseR = 195;
    const baseG = 175;
    const baseB = 145;
    
    // Calculate lighting influence
    const torchDist = Math.sqrt((centerX - torchLightX) ** 2 + (y - torchLightY) ** 2);
    const torchInfluence = Math.max(0, 1 - torchDist / 300) * lighting.torchIntensity;
    
    const sunInfluence = lighting.sunIntensity;
    const ambientInfluence = lighting.ambientIntensity;
    
    // Final color
    const r = clamp(baseR * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.8), 0, 255);
    const g = clamp(baseG * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.6), 0, 255);
    const b = clamp(baseB * (ambientInfluence + sunInfluence * 0.7 + torchInfluence * 0.5), 0, 255);
    
    // Canopy shape
    ctx.beginPath();
    ctx.moveTo(centerX - width / 2, y + height);
    ctx.lineTo(centerX - width / 2 + 10, y);
    ctx.lineTo(centerX + width / 2 - 10, y);
    ctx.lineTo(centerX + width / 2, y + height);
    ctx.closePath();
    
    // Fill canopy
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();
    
    // Canopy gradient for depth
    const canopyGradient = createGradient(ctx, centerX, y, centerX, y + height, [
      { pos: 0, color: `rgba(255, 255, 255, 0.1)` },
      { pos: 1, color: `rgba(0, 0, 0, 0.2)` }
    ]);
    ctx.fillStyle = canopyGradient;
    ctx.fill();
    
    // Canopy edges
    ctx.strokeStyle = `rgba(0, 0, 0, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Top decoration
    ctx.beginPath();
    ctx.moveTo(centerX - width / 2 + 15, y + 5);
    ctx.lineTo(centerX + width / 2 - 15, y + 5);
    ctx.strokeStyle = `rgba(0, 0, 0, 0.2)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Torch light highlight
    if (torchInfluence > 0.1) {
      const highlight = createRadialGradient(
        ctx, 
        torchLightX, torchLightY, 0,
        torchLightX, torchLightY, 200
      );
      highlight.addColorStop(0, `rgba(255, 150, 50, ${torchInfluence * 0.3})`);
      highlight.addColorStop(1, `rgba(255, 150, 50, 0)`);
      
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = highlight;
      ctx.fill();
      ctx.restore();
    }
  };

  // Draw stone details and carvings
  const drawStoneDetails = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, centerY: number, 
    gateWidth: number, gateHeight: number,
    archWidth: number, archHeight: number,
    lighting: Lighting,
    time: number
  ) => {
    // Stone weathering effect
    const weatheringIntensity = 0.05;
    
    // Add subtle noise texture
    for (let i = 0; i < 100; i++) {
      const x = centerX - gateWidth / 2 + Math.random() * gateWidth;
      const y = centerY - gateHeight / 2 + Math.random() * gateHeight;
      const size = Math.random() * 3 + 1;
      
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * weatheringIntensity})`;
      ctx.fillRect(x, y, size, size);
    }
    
    // Carved lines on pillars
    const pillarWidth = 40;
    const leftPillarX = centerX - gateWidth / 2;
    const rightPillarX = centerX + gateWidth / 2 - pillarWidth;
    
    // Left pillar carvings
    for (let i = 0; i < 5; i++) {
      const y = centerY - gateHeight / 2 + 20 + i * 35;
      ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
      ctx.lineWidth = 1;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(leftPillarX + 10, y);
      ctx.lineTo(leftPillarX + 10, y + 25);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(leftPillarX + pillarWidth - 10, y);
      ctx.lineTo(leftPillarX + pillarWidth - 10, y + 25);
      ctx.stroke();
    }
    
    // Right pillar carvings
    for (let i = 0; i < 5; i++) {
      const y = centerY - gateHeight / 2 + 20 + i * 35;
      ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
      ctx.lineWidth = 1;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(rightPillarX + 10, y);
      ctx.lineTo(rightPillarX + 10, y + 25);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(rightPillarX + pillarWidth - 10, y);
      ctx.lineTo(rightPillarX + pillarWidth - 10, y + 25);
      ctx.stroke();
    }
    
    // Arch carvings
    ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
    ctx.lineWidth = 1;
    
    // Small arches above main arch
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      
      const x = centerX + i * 25;
      const y = centerY - archHeight + 20;
      const w = 15;
      const h = 15;
      
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x - w / 2, y - h + w / 2);
      ctx.arc(x, y - h + w / 2, w / 2, Math.PI, 0, false);
      ctx.lineTo(x + w / 2, y);
      ctx.stroke();
    }
    
    // Ambient occlusion in corners
    const aoGradient = createRadialGradient(
      ctx, 
      centerX - gateWidth / 2, centerY - gateHeight / 2, 0,
      centerX - gateWidth / 2, centerY - gateHeight / 2, 50
    );
    aoGradient.addColorStop(0, `rgba(0, 0, 0, 0.2)`);
    aoGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
    
    ctx.fillStyle = aoGradient;
    ctx.fillRect(centerX - gateWidth / 2 - 50, centerY - gateHeight / 2 - 50, 100, 100);
    
    const aoGradient2 = createRadialGradient(
      ctx, 
      centerX + gateWidth / 2, centerY - gateHeight / 2, 0,
      centerX + gateWidth / 2, centerY - gateHeight / 2, 50
    );
    aoGradient2.addColorStop(0, `rgba(0, 0, 0, 0.2)`);
    aoGradient2.addColorStop(1, `rgba(0, 0, 0, 0)`);
    
    ctx.fillStyle = aoGradient2;
    ctx.fillRect(centerX + gateWidth / 2 - 50, centerY - gateHeight / 2 - 50, 100, 100);
  };

  // Draw torch
  const drawTorch = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    // Torch visibility
    const visibility = 1 - smoothstep(0.667, 0.867, progress);
    if (visibility <= 0) return;
    
    const lighting = lightingRef.current;
    const camera = cameraRef.current;
    
    // Calculate position with camera transform
    const torchX = width * 0.35 + camera.x;
    const torchY = height * 0.65 + camera.y;
    const torchScale = camera.zoom;
    
    ctx.save();
    ctx.globalAlpha = visibility;
    ctx.translate(torchX, torchY);
    ctx.scale(torchScale, torchScale);
    
    // Torch pole
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(-5, -80, 10, 80);
    
    // Torch holder
    ctx.fillStyle = '#5a4738';
    ctx.fillRect(-15, -85, 30, 10);
    ctx.fillRect(-12, -90, 24, 5);
    
    // Flame
    drawFlame(ctx, 0, -90, time, lighting.torchIntensity);
    
    // Ground light from torch
    const groundLight = createRadialGradient(ctx, 0, 0, 0, 0, 100);
    groundLight.addColorStop(0, `rgba(255, 150, 50, ${0.2 * lighting.torchIntensity})`);
    groundLight.addColorStop(1, `rgba(255, 150, 50, 0)`);
    ctx.fillStyle = groundLight;
    ctx.fillRect(-100, -20, 200, 40);
    
    ctx.restore();
  };

  // Draw flame
  const drawFlame = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, intensity: number) => {
    const flameHeight = 40 * intensity;
    const flameWidth = 15 * intensity;
    
    // Outer flame
    ctx.beginPath();
    ctx.moveTo(x - flameWidth, y);
    ctx.quadraticCurveTo(
      x - flameWidth * 0.8, y - flameHeight * 0.5,
      x + Math.sin(time * 0.01) * 5, y - flameHeight
    );
    ctx.quadraticCurveTo(
      x + flameWidth * 0.8, y - flameHeight * 0.5,
      x + flameWidth, y
    );
    ctx.closePath();
    
    const outerFlameGradient = createGradient(ctx, x, y, x, y - flameHeight, [
      { pos: 0, color: `rgba(255, 100, 0, ${0.8 * intensity})` },
      { pos: 0.5, color: `rgba(255, 150, 0, ${0.6 * intensity})` },
      { pos: 1, color: `rgba(255, 200, 0, ${0.2 * intensity})` }
    ]);
    ctx.fillStyle = outerFlameGradient;
    ctx.fill();
    
    // Inner flame
    const innerFlameHeight = flameHeight * 0.7;
    const innerFlameWidth = flameWidth * 0.6;
    
    ctx.beginPath();
    ctx.moveTo(x - innerFlameWidth, y);
    ctx.quadraticCurveTo(
      x - innerFlameWidth * 0.8, y - innerFlameHeight * 0.5,
      x + Math.sin(time * 0.015) * 3, y - innerFlameHeight
    );
    ctx.quadraticCurveTo(
      x + innerFlameWidth * 0.8, y - innerFlameHeight * 0.5,
      x + innerFlameWidth, y
    );
    ctx.closePath();
    
    const innerFlameGradient = createGradient(ctx, x, y, x, y - innerFlameHeight, [
      { pos: 0, color: `rgba(255, 200, 50, ${0.9 * intensity})` },
      { pos: 0.5, color: `rgba(255, 230, 100, ${0.7 * intensity})` },
      { pos: 1, color: `rgba(255, 255, 200, ${0.3 * intensity})` }
    ]);
    ctx.fillStyle = innerFlameGradient;
    ctx.fill();
    
    // Flame core
    const coreHeight = flameHeight * 0.4;
    const coreWidth = flameWidth * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(x - coreWidth, y);
    ctx.quadraticCurveTo(
      x - coreWidth * 0.8, y - coreHeight * 0.5,
      x + Math.sin(time * 0.02) * 2, y - coreHeight
    );
    ctx.quadraticCurveTo(
      x + coreWidth * 0.8, y - coreHeight * 0.5,
      x + coreWidth, y
    );
    ctx.closePath();
    
    ctx.fillStyle = `rgba(255, 255, 230, ${0.8 * intensity})`;
    ctx.fill();
    
    // Flame glow
    const flameGlow = createRadialGradient(ctx, x, y - flameHeight * 0.5, 0, x, y - flameHeight * 0.5, flameHeight);
    flameGlow.addColorStop(0, `rgba(255, 150, 50, ${0.3 * intensity})`);
    flameGlow.addColorStop(1, `rgba(255, 100, 0, 0)`);
    ctx.fillStyle = flameGlow;
    ctx.fillRect(x - flameHeight, y - flameHeight * 1.5, flameHeight * 2, flameHeight * 2);
    
    // Smoke particles
    for (let i = 0; i < 5; i++) {
      const smokeY = y - flameHeight - i * 15 - Math.sin(time * 0.005 + i) * 10;
      const smokeX = x + Math.sin(time * 0.003 + i * 2) * 10;
      const smokeSize = 5 + i * 3;
      const smokeOpacity = 0.1 * (1 - i / 5) * intensity;
      
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 100, 100, ${smokeOpacity})`;
      ctx.fill();
    }
    
    // Embers
    for (let i = 0; i < 3; i++) {
      const emberX = x + Math.sin(time * 0.01 + i * 3) * 20;
      const emberY = y - flameHeight - Math.abs(Math.sin(time * 0.02 + i * 2)) * 40;
      const emberSize = 1 + Math.random();
      
      ctx.beginPath();
      ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 50, ${0.5 + Math.random() * 0.5})`;
      ctx.fill();
    }
  };

  // Draw flag pole
  const drawFlagPole = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    // Flag pole visibility (starts rising in scene 3)
    const poleRiseProgress = smoothstep(0.333, 0.5, progress);
    if (poleRiseProgress <= 0) return;
    
    const camera = cameraRef.current;
    const lighting = lightingRef.current;
    
    // Calculate position with camera transform
    const poleX = width * 0.25 + camera.x;
    const poleBaseY = height * 0.7 + camera.y;
    const poleTopY = height * 0.2 + camera.y;
    const poleScale = camera.zoom;
    
    // Pole height based on rise progress
    const currentPoleHeight = (poleBaseY - poleTopY) * poleRiseProgress;
    const currentPoleTopY = poleBaseY - currentPoleHeight;
    
    ctx.save();
    ctx.translate(poleX, poleBaseY);
    ctx.scale(poleScale, poleScale);
    
    // Pole shadow
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * lighting.sunIntensity})`;
    ctx.beginPath();
    ctx.ellipse(10, 5, 5, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main pole
    const poleGradient = createGradient(ctx, -3, 0, 3, 0, [
      { pos: 0, color: `rgba(100, 100, 100, 1)` },
      { pos: 0.3, color: `rgba(180, 180, 180, 1)` },
      { pos: 0.7, color: `rgba(150, 150, 150, 1)` },
      { pos: 1, color: `rgba(80, 80, 80, 1)` }
    ]);
    ctx.fillStyle = poleGradient;
    ctx.fillRect(-3, -currentPoleHeight, 6, currentPoleHeight);
    
    // Pole base
    ctx.fillStyle = '#606060';
    ctx.fillRect(-8, -10, 16, 10);
    ctx.fillRect(-6, -15, 12, 5);
    
    // Golden finial at top
    if (poleRiseProgress > 0.9) {
      const finialOpacity = smoothstep(0.9, 1.0, poleRiseProgress);
      
      ctx.save();
      ctx.globalAlpha = finialOpacity;
      
      // Finial base
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(0, -currentPoleHeight, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Finial spike
      ctx.beginPath();
      ctx.moveTo(0, -currentPoleHeight - 20);
      ctx.lineTo(-5, -currentPoleHeight - 5);
      ctx.lineTo(5, -currentPoleHeight - 5);
      ctx.closePath();
      ctx.fillStyle = '#d4af37';
      ctx.fill();
      
      // Finial highlight
      ctx.beginPath();
      ctx.arc(-2, -currentPoleHeight - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
      ctx.fill();
      
      ctx.restore();
    }
    
    // Pole reflection
    if (lighting.sunIntensity > 0.3) {
      const reflectionOpacity = (lighting.sunIntensity - 0.3) * 0.5;
      const reflectionX = Math.sin(lighting.sunAngle) * 2;
      
      ctx.beginPath();
      ctx.moveTo(reflectionX - 1, 0);
      ctx.lineTo(reflectionX - 1, -currentPoleHeight);
      ctx.lineTo(reflectionX + 1, -currentPoleHeight);
      ctx.lineTo(reflectionX + 1, 0);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 255, 255, ${reflectionOpacity})`;
      ctx.fill();
    }
    
    ctx.restore();
    
    // Return pole top position for flag attachment
    return {
      x: poleX,
      y: poleBaseY - currentPoleHeight * poleScale
    };
  };

  // Draw flag with cloth simulation
  const drawFlag = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    // Flag visibility (starts opening in scene 4)
    const flagOpenProgress = smoothstep(0.533, 0.667, progress);
    if (flagOpenProgress <= 0 || !flagRef.current) return;
    
    const camera = cameraRef.current;
    const lighting = lightingRef.current;
    
    // Calculate position with camera transform
    const poleX = width * 0.25 + camera.x;
    const poleBaseY = height * 0.7 + camera.y;
    const poleTopY = height * 0.2 + camera.y;
    const poleScale = camera.zoom;
    
    // Pole height based on rise progress
    const poleRiseProgress = smoothstep(0.333, 0.5, progress);
    const currentPoleHeight = (poleBaseY - poleTopY) * poleRiseProgress;
    const currentPoleTopY = poleBaseY - currentPoleHeight;
    
    // Flag attachment point
    const flagAttachX = poleX;
    const flagAttachY = currentPoleTopY * poleScale;
    
    // Update cloth simulation
    const windStrength = 0.5 + flagOpenProgress * 1.5;
    updateFlagCloth(time, windStrength);
    
    // Draw flag
    const flag = flagRef.current;
    
    ctx.save();
    ctx.translate(flagAttachX, flagAttachY);
    ctx.scale(poleScale, poleScale);
    
    // Draw flag as triangulated mesh
    for (let j = 0; j < flag.rows; j++) {
      for (let i = 0; i < flag.cols; i++) {
        const idx = j * (flag.cols + 1) + i;
        const p1 = flag.points[idx];
        const p2 = flag.points[idx + 1];
        const p3 = flag.points[idx + (flag.cols + 1)];
        const p4 = flag.points[idx + (flag.cols + 1) + 1];
        
        // Determine flag color based on position
        const u = i / flag.cols;
        const v = j / flag.rows;
        
        // Saffron (top third)
        let r, g, b;
        if (v < 0.33) {
          r = 255; g = 153; b = 51;
        } 
        // White (middle third)
        else if (v < 0.66) {
          r = 255; g = 255; b = 255;
        } 
        // Green (bottom third)
        else {
          r = 19; g = 136; b = 8;
        }
        
        // Apply lighting
        const lightFactor = lighting.ambientIntensity + lighting.sunIntensity * 0.7;
        r = clamp(r * lightFactor, 0, 255);
        g = clamp(g * lightFactor, 0, 255);
        b = clamp(b * lightFactor, 0, 255);
        
        // Calculate normal for shading (simplified)
        const nx = (p2.z - p1.z + p4.z - p3.z) * 0.5;
        const shade = clamp(1 + nx * 0.02, 0.7, 1.3);
        
        r = clamp(r * shade, 0, 255);
        g = clamp(g * shade, 0, 255);
        b = clamp(b * shade, 0, 255);
        
        // Draw two triangles for each quad
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();
      }
    }
    
    // Draw Ashoka Chakra in the middle
    if (flagOpenProgress > 0.5) {
      const chakraOpacity = smoothstep(0.5, 0.7, flagOpenProgress);
      const chakraCenterX = flag.width * 0.5;
      const chakraCenterY = flag.height * 0.5;
      
      // Find the actual position of the chakra center from cloth simulation
      const chakraIdx = Math.floor(flag.rows * 0.5) * (flag.cols + 1) + Math.floor(flag.cols * 0.5);
      const chakraPoint = flag.points[chakraIdx];
      
      drawAshokaChakra(ctx, chakraPoint.x, chakraPoint.y, 20, time, chakraOpacity, lighting);
    }
    
    // Flag shadow
    ctx.globalAlpha = 0.2 * lighting.sunIntensity;
    ctx.beginPath();
    ctx.moveTo(0, flag.height + 5);
    ctx.lineTo(flag.width, flag.height + 10);
    ctx.lineTo(flag.width, flag.height + 15);
    ctx.lineTo(0, flag.height + 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    ctx.restore();
  };

  // Draw Ashoka Chakra
  const drawAshokaChakra = (
    ctx: CanvasRenderingContext2D, 
    x: number, y: number, 
    radius: number, 
    time: number, 
    opacity: number,
    lighting: Lighting
  ) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    
    // Subtle rotation
    ctx.rotate(time * 0.0002);
    
    // Chakra base
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 128, 0.8)`;
    ctx.fill();
    
    // Metallic effect
    const metalGradient = createRadialGradient(ctx, -radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    metalGradient.addColorStop(0, 'rgba(100, 100, 200, 0.3)');
    metalGradient.addColorStop(0.7, 'rgba(0, 0, 128, 0.1)');
    metalGradient.addColorStop(1, 'rgba(0, 0, 80, 0.2)');
    ctx.fillStyle = metalGradient;
    ctx.fill();
    
    // Spokes
    const spokeCount = 24;
    ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const innerRadius = radius * 0.2;
      const outerRadius = radius * 0.9;
      
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
      ctx.lineTo(
        Math.cos(angle) * outerRadius,
        Math.sin(angle) * outerRadius
      );
      ctx.stroke();
    }
    
    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 128, 0.9)';
    ctx.fill();
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Small shine
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    
    ctx.restore();
  };

  // Draw birds
  const drawBirds = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    if (progress < 0.667) return;
    
    const birds = birdsRef.current;
    const birdVisibility = smoothstep(0.667, 0.7, progress);
    const camera = cameraRef.current;
    
    ctx.save();
    ctx.globalAlpha = birdVisibility;
    
    for (const bird of birds) {
      // Apply parallax based on depth
      const parallaxX = bird.x + camera.x * bird.depth * 0.5;
      const parallaxY = bird.y + camera.y * bird.depth * 0.5;
      const scale = camera.zoom * bird.depth * 0.7;
      
      ctx.save();
      ctx.translate(parallaxX, parallaxY);
      ctx.scale(scale, scale);
      
      // Wing animation
      const wingAngle = Math.sin(bird.wingPhase) * bird.flapAmplitude;
      
      // Bird body
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
      ctx.fill();
      
      // Left wing
      ctx.save();
      ctx.rotate(wingAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-10, -5, -15, wingAngle * 10);
      ctx.quadraticCurveTo(-10, 0, 0, 0);
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
      ctx.fill();
      ctx.restore();
      
      // Right wing
      ctx.save();
      ctx.rotate(-wingAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, -5, 15, -wingAngle * 10);
      ctx.quadraticCurveTo(10, 0, 0, 0);
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
      ctx.fill();
      ctx.restore();
      
      ctx.restore();
    }
    
    ctx.restore();
  };

  // Draw Sukhoi jets
  const drawSukhois = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    if (progress < 0.667 || progress > 0.867) return;
    
    const sukhois = sukhoisRef.current;
    const jetVisibility = smoothstep(0.667, 0.7, progress) * (1 - smoothstep(0.83, 0.867, progress));
    const camera = cameraRef.current;
    
    ctx.save();
    ctx.globalAlpha = jetVisibility;
    
    for (const jet of sukhois) {
      // Apply parallax based on depth
      const parallaxX = jet.x + camera.x * jet.depth * 0.3;
      const parallaxY = jet.y + camera.y * jet.depth * 0.3;
      const scale = camera.zoom * jet.depth * 0.8;
      
      // Draw smoke trail
      if (jet.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(jet.trail[0].x + camera.x * jet.depth * 0.3, jet.trail[0].y + camera.y * jet.depth * 0.3);
        
        for (let i = 1; i < jet.trail.length; i++) {
          ctx.lineTo(
            jet.trail[i].x + camera.x * jet.depth * 0.3, 
            jet.trail[i].y + camera.y * jet.depth * 0.3
          );
        }
        
        ctx.strokeStyle = `rgba(200, 200, 200, ${0.3 * jetVisibility})`;
        ctx.lineWidth = 3 * scale;
        ctx.stroke();
      }
      
      ctx.save();
      ctx.translate(parallaxX, parallaxY);
      ctx.scale(scale, scale);
      
      // Motion blur effect
      ctx.globalAlpha = 0.7;
      
      // Jet body
      ctx.beginPath();
      ctx.moveTo(30, 0);  // Nose
      ctx.lineTo(-20, -5);  // Top back
      ctx.lineTo(-30, 0);  // Back center
      ctx.lineTo(-20, 5);  // Bottom back
      ctx.closePath();
      ctx.fillStyle = 'rgba(80, 80, 80, 0.9)';
      ctx.fill();
      
      // Wings
      ctx.beginPath();
      ctx.moveTo(0, -5);  // Top wing root
      ctx.lineTo(-10, -20);  // Top wing tip
      ctx.lineTo(-15, -18);  // Top wing back
      ctx.lineTo(-10, -5);  // Top wing inner back
      ctx.closePath();
      ctx.fillStyle = 'rgba(70, 70, 70, 0.9)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(0, 5);  // Bottom wing root
      ctx.lineTo(-10, 20);  // Bottom wing tip
      ctx.lineTo(-15, 18);  // Bottom wing back
      ctx.lineTo(-10, 5);  // Bottom wing inner back
      ctx.closePath();
      ctx.fillStyle = 'rgba(70, 70, 70, 0.9)';
      ctx.fill();
      
      // Tail fin
      ctx.beginPath();
      ctx.moveTo(-20, -5);  // Tail root
      ctx.lineTo(-25, -15);  // Tail tip
      ctx.lineTo(-30, -12);  // Tail back
      ctx.lineTo(-25, -5);  // Tail inner back
      ctx.closePath();
      ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
      ctx.fill();
      
      // Afterburner
      ctx.beginPath();
      ctx.moveTo(-30, -3);
      ctx.lineTo(-40 - jet.afterburner * 10, 0);
      ctx.lineTo(-30, 3);
      ctx.closePath();
      
      const afterburnerGradient = createGradient(ctx, -30, 0, -50, 0, [
        { pos: 0, color: 'rgba(255, 200, 50, 0.8)' },
        { pos: 0.5, color: 'rgba(255, 100, 0, 0.5)' },
        { pos: 1, color: 'rgba(255, 50, 0, 0)' }
      ]);
      ctx.fillStyle = afterburnerGradient;
      ctx.fill();
      
      // Heat distortion effect
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.ellipse(-35, 0, 15, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.restore();
  };

  // Draw particles
  const drawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    const particles = particlesRef.current;
    const camera = cameraRef.current;
    
    for (const p of particles) {
      if (!p.on) continue;
      
      // Calculate life ratio
      const lifeRatio = p.life / p.ml;
      const alpha = p.a * (1 - lifeRatio);
      
      // Apply parallax based on depth
      const parallaxX = p.x + camera.x * p.depth * 0.3;
      const parallaxY = p.y + camera.y * p.depth * 0.3;
      const scale = camera.zoom * p.depth * 0.8;
      
      ctx.save();
      ctx.translate(parallaxX, parallaxY);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      
      switch (p.tp) {
        case 0: // Golden dust
          ctx.beginPath();
          ctx.arc(0, 0, p.sz, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
          ctx.fill();
          
          // Glow
          const dustGlow = createRadialGradient(ctx, 0, 0, 0, 0, 0, p.sz * 2);
          dustGlow.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, 0.3)`);
          dustGlow.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
          ctx.fillStyle = dustGlow;
          ctx.fillRect(-p.sz * 2, -p.sz * 2, p.sz * 4, p.sz * 4);
          break;
          
        case 1: // Embers
          ctx.beginPath();
          ctx.arc(0, 0, p.sz, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
          ctx.fill();
          
          // Ember glow
          const emberGlow = createRadialGradient(ctx, 0, 0, 0, 0, 0, p.sz * 3);
          emberGlow.addColorStop(0, `rgba(255, 150, 50, 0.5)`);
          emberGlow.addColorStop(1, `rgba(255, 100, 0, 0)`);
          ctx.fillStyle = emberGlow;
          ctx.fillRect(-p.sz * 3, -p.sz * 3, p.sz * 6, p.sz * 6);
          break;
          
        case 2: // Lens dust
          ctx.beginPath();
          ctx.arc(0, 0, p.sz * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();
          break;
          
        case 3: // Confetti
          ctx.rotate(p.rot);
          
          // Set color based on confetti type
          let confettiR, confettiG, confettiB;
          if (p.confettiColor === 0) { // Saffron
            confettiR = 255; confettiG = 153; confettiB = 51;
          } else if (p.confettiColor === 1) { // White
            confettiR = 255; confettiG = 255; confettiB = 255;
          } else { // Green
            confettiR = 19; confettiG = 136; confettiB = 8;
          }
          
          ctx.fillStyle = `rgb(${confettiR}, ${confettiG}, ${confettiB})`;
          ctx.fillRect(-p.sz, -p.sz * 0.5, p.sz * 2, p.sz);
          break;
          
        case 4: // Sparkles
          const sparkleAlpha = Math.sin(p.sparklePhase) * 0.5 + 0.5;
          ctx.globalAlpha = alpha * sparkleAlpha;
          
          // Four-point star
          ctx.beginPath();
          ctx.moveTo(0, -p.sz * 2);
          ctx.lineTo(p.sz * 0.3, -p.sz * 0.3);
          ctx.lineTo(p.sz * 2, 0);
          ctx.lineTo(p.sz * 0.3, p.sz * 0.3);
          ctx.lineTo(0, p.sz * 2);
          ctx.lineTo(-p.sz * 0.3, p.sz * 0.3);
          ctx.lineTo(-p.sz * 2, 0);
          ctx.lineTo(-p.sz * 0.3, -p.sz * 0.3);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
          ctx.fill();
          break;
          
        case 5: // Bokeh
          ctx.beginPath();
          ctx.arc(0, 0, p.bokehRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Bokeh highlight
          ctx.beginPath();
          ctx.arc(-p.bokehRadius * 0.3, -p.bokehRadius * 0.3, p.bokehAperture, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fill();
          break;
      }
      
      ctx.restore();
    }
  };

  // Draw typography
  const drawTypography = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    if (progress < 0.667) return;
    
    const typographyProgress = smoothstep(0.667, 0.8, progress);
    const fadeOutProgress = 1 - smoothstep(0.9, 1.0, progress);
    const camera = cameraRef.current;
    
    ctx.save();
    ctx.globalAlpha = typographyProgress * fadeOutProgress;
    
    // Calculate position with camera transform
    const textX = width * 0.5 + camera.x;
    const textY = height * 0.3 + camera.y;
    const textScale = camera.zoom;
    
    ctx.translate(textX, textY);
    ctx.scale(textScale, textScale);
    
    // "Happy Republic Day" text
    const mainText = "Happy Republic Day";
    const mainTextSize = 48;
    
    ctx.font = `bold ${mainTextSize}px 'Georgia', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(mainText, 2, 2);
    
    // Gold gradient for text
    const textGradient = createGradient(ctx, -200, -20, 200, 20, [
      { pos: 0, color: '#d4af37' },
      { pos: 0.3, color: '#f9e79f' },
      { pos: 0.5, color: '#d4af37' },
      { pos: 0.7, color: '#f9e79f' },
      { pos: 1, color: '#d4af37' }
    ]);
    ctx.fillStyle = textGradient;
    ctx.fillText(mainText, 0, 0);
    
    // Light sweep effect
    const sweepX = Math.sin(time * 0.002) * 300 - 150;
    const sweepGradient = createLinearGradient(ctx, sweepX - 50, 0, sweepX + 50, 0, [
      { pos: 0, color: 'rgba(255, 255, 255, 0)' },
      { pos: 0.5, color: 'rgba(255, 255, 255, 0.3)' },
      { pos: 1, color: 'rgba(255, 255, 255, 0)' }
    ]);
    ctx.fillStyle = sweepGradient;
    ctx.fillText(mainText, 0, 0);
    
    // "जय हिन्द" text
    const hindiText = "जय हिन्द";
    const hindiTextSize = 36;
    
    ctx.font = `bold ${hindiTextSize}px 'Noto Sans Devanagari', sans-serif`;
    
    // Text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(hindiText, 2, mainTextSize + 22);
    
    // Gold gradient for Hindi text
    const hindiTextGradient = createGradient(ctx, -100, mainTextSize, 100, mainTextSize + 40, [
      { pos: 0, color: '#d4af37' },
      { pos: 0.3, color: '#f9e79f' },
      { pos: 0.5, color: '#d4af37' },
      { pos: 0.7, color: '#f9e79f' },
      { pos: 1, color: '#d4af37' }
    ]);
    ctx.fillStyle = hindiTextGradient;
    ctx.fillText(hindiText, 0, mainTextSize + 20);
    
    // Light sweep effect for Hindi text
    ctx.fillStyle = sweepGradient;
    ctx.fillText(hindiText, 0, mainTextSize + 20);
    
    ctx.restore();
  };

  // Draw final zoom into flag
  const drawFinalZoom = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    if (progress < 0.867) return;
    
    const zoomProgress = smoothstep(0.867, 1.0, progress);
    const fadeOutProgress = smoothstep(0.9, 1.0, progress);
    
    // Get flag position
    const camera = cameraRef.current;
    const flagX = width * 0.25 + camera.x + flagRef.current ? flagRef.current.width * 0.5 : 0;
    const flagY = height * 0.45 + camera.y + flagRef.current ? flagRef.current.height * 0.5 : 0;
    
    // Ashoka Chakra zoom
    if (flagRef.current && zoomProgress > 0.5) {
      const chakraZoomProgress = smoothstep(0.5, 1.0, zoomProgress);
      const chakraIdx = Math.floor(flagRef.current.rows * 0.5) * (flagRef.current.cols + 1) + Math.floor(flagRef.current.cols * 0.5);
      const chakraPoint = flagRef.current.points[chakraIdx];
      
      const chakraX = flagX + chakraPoint.x * camera.zoom;
      const chakraY = flagY + chakraPoint.y * camera.zoom;
      const chakraRadius = 20 * camera.zoom * (1 + chakraZoomProgress * 5);
      
      ctx.save();
      ctx.globalAlpha = chakraZoomProgress * (1 - fadeOutProgress);
      
      // Draw enlarged Ashoka Chakra
      drawAshokaChakra(ctx, chakraX, chakraY, chakraRadius, time, 1, lightingRef.current);
      
      ctx.restore();
    }
    
    // Fade to black
    if (fadeOutProgress > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeOutProgress})`;
      ctx.fillRect(0, 0, width, height);
    }
  };

  // Apply post-processing effects
  const applyPostProcessing = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) => {
    // Vignette
    const vignetteGradient = createRadialGradient(ctx, width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
    vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Film grain (subtle)
    const grainIntensity = 0.03;
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * grainIntensity;
      
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${alpha})`;
      ctx.fillRect(x, y, size, size);
    }
    
    // Chromatic aberration (very subtle)
    if (progress > 0.667) {
      const aberrationIntensity = 0.5 * smoothstep(0.667, 0.8, progress);
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = aberrationIntensity * 0.1;
      
      // Red channel offset
      ctx.drawImage(ctx.canvas, -1, 0);
      
      // Blue channel offset
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(ctx.canvas, 1, 0);
      
      ctx.restore();
    }
    
    // Color grading based on scene
    if (progress < 0.333) {
      // Night scene - cool tones
      ctx.fillStyle = 'rgba(0, 0, 30, 0.1)';
      ctx.fillRect(0, 0, width, height);
    } else if (progress < 0.667) {
      // Sunrise scene - warm tones
      const warmIntensity = smoothstep(0.333, 0.667, progress) * 0.1;
      ctx.fillStyle = `rgba(50, 20, 0, ${warmIntensity})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Day scene - slightly warm
      ctx.fillStyle = 'rgba(20, 10, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
    }
    
    // Bloom effect (simplified)
    if (progress > 0.533) {
      const bloomIntensity = smoothstep(0.533, 0.667, progress) * 0.1;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = bloomIntensity;
      ctx.filter = 'blur(10px)';
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.filter = 'none';
      ctx.restore();
    }
    
    // Exposure adaptation
    const exposure = lightingRef.current.exposure;
    if (exposure !== 1.0) {
      ctx.fillStyle = exposure > 1.0 
        ? `rgba(255, 255, 255, ${(exposure - 1.0) * 0.5})`
        : `rgba(0, 0, 0, ${(1.0 - exposure) * 0.5})`;
      ctx.fillRect(0, 0, width, height);
    }
  };

  // Main animation loop
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate progress (0-1)
    const elapsedTime = timestamp - startTimeRef.current;
    const progress = Math.min(elapsedTime / TOTAL_DURATION, 1.0);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Update systems
    updateCamera(progress, timestamp);
    updateLighting(progress);
    updateParticles(progress, timestamp, width, height);
    updateBirds(progress, timestamp, width, height);
    updateSukhois(progress, timestamp, width, height);
    updateFogLayers(progress, timestamp, width);
    
    // Draw layers in order
    drawSky(ctx, width, height, progress, timestamp);
    drawFog(ctx, width, height, progress, timestamp);
    drawIndiaGate(ctx, width, height, progress, timestamp);
    drawTorch(ctx, width, height, progress, timestamp);
    drawFlagPole(ctx, width, height, progress, timestamp);
    drawFlag(ctx, width, height, progress, timestamp);
    drawBirds(ctx, width, height, progress, timestamp);
    drawSukhois(ctx, width, height, progress, timestamp);
    drawParticles(ctx, width, height, progress, timestamp);
    drawTypography(ctx, width, height, progress, timestamp);
    drawFinalZoom(ctx, width, height, progress, timestamp);
    applyPostProcessing(ctx, width, height, progress, timestamp);
    
    // Continue animation or complete
    if (progress < 1.0) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (!completedRef.current) {
      completedRef.current = true;
      if (onComplete) {
        setTimeout(onComplete, 500); // Small delay after fade out
      }
    }
  }, [onComplete]);

  // Initialize and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reinitialize systems with new dimensions
      initializeSystems(canvas.width, canvas.height);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, initializeSystems]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    />
  );
};

export default RepublicDayCinematicIntro;
