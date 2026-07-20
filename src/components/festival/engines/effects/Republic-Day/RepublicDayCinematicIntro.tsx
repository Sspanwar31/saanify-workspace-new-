import React, { useEffect, useRef } from 'react';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Particle {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  life: number; maxLife: number; size: number;
  color: string; type: 'dust' | 'ember' | 'smoke' | 'bokeh' | 'confetti';
  rotation: number; vr: number; active: boolean;
}

interface Jet {
  x: number; y: number; z: number; vx: number; vy: number;
  scale: number; smokeColor: string; active: boolean;
}

// ==========================================
// UTILITY FUNCTIONS (CINEMATIC MATH)
// ==========================================
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const getObject = (pool: Particle[]): Particle => {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) return pool[i];
  }
  const p = { active: false, z: 0, vz: 0 } as Particle;
  pool.push(p);
  return p;
};

// ACES Filmic Tone Mapping Approximation
const ACESFilmic = (x: number) => {
  const a = 2.51;
  const b = 0.03;
  const c = 2.43;
  const d = 0.59;
  const e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1);
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const RepublicDayCinematicIntro: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const particlePoolRef = useRef<Particle[]>([]);
  const jetsRef = useRef<Jet[]>([]);
  const dovesRef = useRef<{x: number, y: number, vx: number, vy: number, wing: number}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Initialize Jets (Z represents depth, 1 is closest)
    jetsRef.current = [
      { x: -width * 0.3, y: height * 0.3, z: 0.8, vx: 12, vy: 4, scale: 1, smokeColor: '#FF9933', active: true },
      { x: -width * 0.35, y: height * 0.35, z: 0.9, vx: 12, vy: 4, scale: 0.9, smokeColor: '#FFFFFF', active: true },
      { x: -width * 0.4, y: height * 0.4, z: 1.0, vx: 12, vy: 4, scale: 0.8, smokeColor: '#138808', active: true }
    ];

    // Initialize Doves
    dovesRef.current = Array.from({ length: 8 }, (_, i) => ({
      x: width * (0.1 + i * 0.12),
      y: height * (0.7 + Math.random() * 0.2),
      vx: 1.5 + Math.random(),
      vy: -0.8 - Math.random() * 0.4,
      wing: Math.random() * Math.PI * 2
    }));

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const t = clamp(elapsed / 15, 0, 1); // Normalized 0 to 1 timeline

      // Base Clear (Deep Black)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Cinematic Camera System (Crane, Dolly, Handheld Breathing)
      const camDollyZ = lerp(1.0, 1.25, easeOutExpo(t));
      const camCraneY = lerp(0, -height * 0.1, easeInOutCubic(t));
      const breatheX = Math.sin(elapsed * 0.6) * 3 * (1 - t);
      const breatheY = Math.cos(elapsed * 0.5) * 3 * (1 - t);
      
      const camRot = Math.sin(elapsed * 0.2) * 0.005; // Subtle handheld rotation
      const finalZoom = camDollyZ + Math.sin(elapsed * 0.8) * 0.005;

      ctx.save();
      ctx.translate(width / 2 + breatheX, height / 2 + breatheY + camCraneY);
      ctx.rotate(camRot);
      ctx.scale(finalZoom, finalZoom);
      ctx.translate(-width / 2, -height / 2);

      // --- RENDER PIPELINE (Physically Based Layering) ---
      drawAtmosphere(ctx, width, height, t, elapsed);
      drawSkyAndSun(ctx, width, height, t, elapsed);
      drawGodRays(ctx, width, height, t, elapsed);
      
      // Depth fog separates background from midground
      drawVolumetricFog(ctx, width, height, t, elapsed);

      drawIndiaGate(ctx, width, height, t, elapsed);
      drawTorchAndFire(ctx, width, height, t, elapsed);
      
      // Flag is drawn behind India Gate initially, then emerges
      if (t > 0.4) drawFlagMesh(ctx, width, height, t, elapsed);
      
      // Jets and Smoke
      if (t > 0.6 && t < 0.85) drawJetsAndSmoke(ctx, width, height, t, elapsed);

      // Particles (Embers, Dust, Confetti)
      updateParticles(ctx, width, height, t, elapsed, particlePoolRef.current);
      drawParticles(ctx, particlePoolRef.current);

      // Typography
      drawTypography(ctx, width, height, t, elapsed);

      // Final Scene Overlay
      drawFinalScene(ctx, width, height, t, elapsed);

      ctx.restore();

      // Post Processing (Color Grading & Film FX)
      drawPostFX(ctx, width, height, t, elapsed);

      if (elapsed < 15.5) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        startTimeRef.current = 0;
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', setupCanvas);
    };
  }, []);

  // ==========================================
  // CINEMATIC RENDER FUNCTIONS
  // ==========================================

  function drawAtmosphere(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    // Base atmosphere gradient: Deep night -> Dawn -> Golden Morning
    const phase1 = clamp(t / 0.4, 0, 1); 
    const phase2 = clamp((t - 0.3) / 0.4, 0, 1);
    const phase3 = clamp((t - 0.6) / 0.4, 0, 1);

    // Lerp deep blue to teal to orange to gold
    const r = lerp(lerp(5, 20, phase1), lerp(255, 255, phase3), phase2);
    const g = lerp(lerp(10, 40, phase1), lerp(140, 200, phase3), phase2);
    const b = lerp(lerp(30, 70, phase1), lerp(50, 150, phase3), phase2);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgb(${r*0.5},${g*0.5},${b*0.8})`); // Cool top
    grad.addColorStop(0.6, `rgb(${r*0.8},${g*0.7},${b*0.6})`); // Mid
    grad.addColorStop(1, `rgb(${r},${g*0.9},${b*0.4})`); // Warm horizon
    ctx.fillStyle = grad;
    ctx.fillRect(-w, -h, w * 3, h * 3);

    // Stars (Fading out)
    if (t < 0.5) {
      const alpha = 1 - phase2;
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 300; i++) {
        const x = (Math.sin(i * 92.3) * 0.5 + 0.5) * w;
        const y = (Math.cos(i * 45.1) * 0.5 + 0.5) * h * 0.7;
        const twinkle = Math.sin(elapsed * 4 + i) * 0.5 + 0.5;
        const size = (Math.sin(i * 12.4) * 0.5 + 0.5) * 1.2 + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.9})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawSkyAndSun(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t < 0.25) return;
    const sunY = lerp(h * 1.1, h * 0.35, easeOutExpo((t - 0.25) / 0.5));
    const sunX = w * 0.5;
    const intensity = clamp((t - 0.25) * 2, 0, 1);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Extreme HDR Bloom
    const bloomGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.8);
    bloomGrad.addColorStop(0, `rgba(255, 240, 200, ${0.9 * intensity})`);
    bloomGrad.addColorStop(0.15, `rgba(255, 180, 80, ${0.6 * intensity})`);
    bloomGrad.addColorStop(0.4, `rgba(255, 100, 30, ${0.2 * intensity})`);
    bloomGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun Core
    const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    coreGrad.addColorStop(0.3, `rgba(255, 250, 220, ${0.9 * intensity})`);
    coreGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(sunX - 120, sunY - 120, 240, 240);

    // Anamorphic Lens Flare
    ctx.translate(sunX, sunY);
    ctx.rotate(Math.PI / 2);
    const flareGrad = ctx.createLinearGradient(-w, 0, w, 0);
    flareGrad.addColorStop(0, 'rgba(100, 150, 255, 0)');
    flareGrad.addColorStop(0.5, `rgba(150, 200, 255, ${0.4 * intensity})`);
    flareGrad.addColorStop(1, 'rgba(100, 150, 255, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(-w, -2, w * 2, 4);
    ctx.restore();
  }

  function drawGodRays(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t < 0.35) return;
    const intensity = clamp((t - 0.35) * 3, 0, 1);
    const sunX = w * 0.5;
    const sunY = lerp(h * 1.1, h * 0.35, easeOutExpo((t - 0.25) / 0.5));

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(sunX, sunY);
    ctx.rotate(Math.sin(elapsed * 0.05) * 0.02);

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + elapsed * 0.01;
      const length = h * 1.2;
      const width = 80 + Math.sin(elapsed * 2 + i) * 40;
      
      ctx.save();
      ctx.rotate(angle);
      const rayGrad = ctx.createLinearGradient(0, 0, 0, length);
      rayGrad.addColorStop(0, `rgba(255, 230, 180, ${0.2 * intensity})`);
      rayGrad.addColorStop(0.5, `rgba(255, 200, 150, ${0.1 * intensity})`);
      rayGrad.addColorStop(1, 'rgba(255, 200, 150, 0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(-width/4, 0);
      ctx.lineTo(width/4, 0);
      ctx.lineTo(width, length);
      ctx.lineTo(-width, length);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawVolumetricFog(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const offset = elapsed * 8;
    
    // Atmospheric haze layer
    const hazeGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
    hazeGrad.addColorStop(0, 'rgba(40, 50, 70, 0)');
    hazeGrad.addColorStop(0.7, `rgba(100, 110, 130, ${0.2 + t * 0.1})`);
    hazeGrad.addColorStop(1, `rgba(180, 190, 210, ${0.4 + t * 0.2})`);
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // Moving fog volumes
    for(let i=0; i<6; i++) {
      const x = (i * w * 0.3 + offset) % (w * 1.5) - w * 0.2;
      const y = h * (0.7 + i * 0.03);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 400);
      grad.addColorStop(0, `rgba(220, 230, 240, ${0.08 + t * 0.04})`);
      grad.addColorStop(1, 'rgba(220, 230, 240, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 400, y - 400, 800, 800);
    }
    ctx.restore();
  }

  function drawTorchAndFire(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    const tx = w * 0.5;
    const ty = h * 0.78;
    
    // Pre-ignition smoke
    if (t < 0.15) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for(let i=0; i<5; i++) {
        const sy = ty - (elapsed * 25 + i * 40) % 200;
        const sx = tx + Math.sin(sy * 0.05 + elapsed) * 10;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 50);
        grad.addColorStop(0, 'rgba(60, 60, 60, 0.4)');
        grad.addColorStop(1, 'rgba(60, 60, 60, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(sx - 50, sy - 50, 100, 100);
      }
      ctx.restore();
    }

    // Ignition & Fire
    if (t > 0.1) {
      const fireAlpha = clamp((t - 0.1) * 5, 0, 1);
      ctx.save();
      ctx.globalAlpha = fireAlpha;
      ctx.globalCompositeOperation = 'lighter';
      
      // Volumetric fire glow
      const glowGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 400);
      glowGrad.addColorStop(0, 'rgba(255, 180, 80, 0.9)');
      glowGrad.addColorStop(0.2, 'rgba(255, 120, 30, 0.5)');
      glowGrad.addColorStop(0.5, 'rgba(200, 50, 0, 0.2)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(tx - 400, ty - 400, 800, 800);

      // Fire core (Procedural Flicker)
      const flicker = Math.sin(elapsed * 25) * 8 + Math.sin(elapsed * 9) * 4;
      const fireGrad = ctx.createRadialGradient(tx, ty + flicker, 0, tx, ty + flicker, 80);
      fireGrad.addColorStop(0, 'rgba(255, 255, 240, 1)');
      fireGrad.addColorStop(0.3, 'rgba(255, 220, 100, 0.9)');
      fireGrad.addColorStop(0.7, 'rgba(255, 100, 0, 0.5)');
      fireGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = fireGrad;
      
      ctx.beginPath();
      ctx.moveTo(tx - 50, ty);
      ctx.quadraticCurveTo(tx - 30, ty - 100 + flicker, tx, ty - 150 + flicker);
      ctx.quadraticCurveTo(tx + 30, ty - 100 - flicker, tx + 50, ty);
      ctx.closePath();
      ctx.fill();

      // Spawn embers
      if (Math.random() < 0.6) {
        const p = getObject(particlePoolRef.current);
        p.active = true;
        p.x = tx + (Math.random() - 0.5) * 30;
        p.y = ty - 100;
        p.vx = (Math.random() - 0.5) * 1;
        p.vy = -2 - Math.random() * 3;
        p.life = 3; p.maxLife = 3;
        p.size = 1 + Math.random() * 2;
        p.color = `rgba(255, ${150 + Math.random() * 100}, 50, 1)`;
        p.type = 'ember';
      }
      ctx.restore();
    }
  }

  function drawIndiaGate(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    const gateW = w * 0.7;
    const gateH = h * 0.6;
    const baseY = h * 0.85;
    const cx = w * 0.5;

    ctx.save();
    
    // Light reveal factor
    const reveal = clamp((t - 0.1) * 3, 0, 1);
    ctx.globalAlpha = reveal;

    // Procedural Stone Material (Warm base + Cool shadows)
    const stoneBase = `rgb(${lerp(30, 190, t)}, ${lerp(30, 170, t)}, ${lerp(30, 130, t)})`;
    const stoneDark = `rgb(${lerp(10, 80, t)}, ${lerp(10, 70, t)}, ${lerp(10, 50, t)})`;
    const stoneHighlight = `rgb(${lerp(50, 220, t)}, ${lerp(50, 200, t)}, ${lerp(50, 160, t)})`;
    
    const drawArchitecturalBlock = (x: number, y: number, width: number, height: number, depth: number) => {
      // Front face
      const grad = ctx.createLinearGradient(x, y, x, y + height);
      grad.addColorStop(0, stoneHighlight);
      grad.addColorStop(0.5, stoneBase);
      grad.addColorStop(1, stoneDark);
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, width, height);
      
      // Top cornice (depth extrusion)
      ctx.fillStyle = stoneDark;
      ctx.fillRect(x, y - depth, width, depth);
      
      // Ambient Occlusion crevices
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x, y, width, 4);
      ctx.fillRect(x, y + height - 4, width, 4);
    };

    // Base Platform
    drawArchitecturalBlock(cx - gateW/2 - 50, baseY - 40, gateW + 100, 40, 20);
    
    // Main Body
    drawArchitecturalBlock(cx - gateW/2, baseY - gateH, gateW, gateH, 30);
    
    // Central Arch (Deep void with inner steps)
    const archW = gateW * 0.3;
    const archH = gateH * 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - archW/2, baseY);
    ctx.lineTo(cx - archW/2, baseY - archH * 0.7);
    ctx.quadraticCurveTo(cx, baseY - archH, cx + archW/2, baseY - archH * 0.7);
    ctx.lineTo(cx + archW/2, baseY);
    ctx.closePath();
    
    // Arch Inner Shadow (Deep)
    const archGrad = ctx.createLinearGradient(cx, baseY - archH, cx, baseY);
    archGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
    archGrad.addColorStop(1, 'rgba(20,10,5,0.8)');
    ctx.fillStyle = archGrad;
    ctx.fill();

    // Side Arches
    [-1, 1].forEach(side => {
      const sArchW = gateW * 0.15;
      const sArchH = gateH * 0.45;
      const sX = cx + side * gateW * 0.32;
      ctx.beginPath();
      ctx.moveTo(sX - sArchW/2, baseY);
      ctx.lineTo(sX - sArchW/2, baseY - sArchH * 0.7);
      ctx.quadraticCurveTo(sX, baseY - sArchH, sX + sArchW/2, baseY - sArchH * 0.7);
      ctx.lineTo(sX + sArchW/2, baseY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fill();
    });

    // Fluted Columns (Vertical gradients for cylindrical look)
    for(let i=0; i<8; i++) {
      const colX = cx - gateW/2 + (gateW / 8) * i + 15;
      const colGrad = ctx.createLinearGradient(colX, 0, colX + 20, 0);
      colGrad.addColorStop(0, stoneDark);
      colGrad.addColorStop(0.5, stoneHighlight);
      colGrad.addColorStop(1, stoneDark);
      ctx.fillStyle = colGrad;
      ctx.fillRect(colX, baseY - gateH * 0.85, 20, gateH * 0.85);
    }

    // Top Canopy
    const canopyY = baseY - gateH - 50;
    drawArchitecturalBlock(cx - gateW * 0.15, canopyY, gateW * 0.3, 50, 40);
    ctx.beginPath();
    ctx.moveTo(cx - gateW * 0.2, canopyY);
    ctx.lineTo(cx, canopyY - 60);
    ctx.lineTo(cx + gateW * 0.2, canopyY);
    ctx.closePath();
    ctx.fillStyle = stoneDark;
    ctx.fill();

    // Warm Torch Bounce Light on Stone
    if (t > 0.1) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const torchLight = ctx.createRadialGradient(w/2, h*0.78, 0, w/2, h*0.78, gateH);
      torchLight.addColorStop(0, 'rgba(255, 120, 30, 0.8)');
      torchLight.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = torchLight;
      ctx.fillRect(cx - gateW/2, baseY - gateH, gateW, gateH);
      ctx.restore();
    }

    // Sunrise Rim Light
    if (t > 0.35) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const sunRim = ctx.createLinearGradient(0, baseY - gateH, 0, baseY);
      sunRim.addColorStop(0, `rgba(255, 200, 100, ${(t - 0.35) * 0.8})`);
      sunRim.addColorStop(0.5, 'rgba(255, 100, 50, 0)');
      ctx.fillStyle = sunRim;
      ctx.fillRect(cx - gateW/2, baseY - gateH, gateW, gateH);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawFlagMesh(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t < 0.4) return;
    const flagAlpha = clamp((t - 0.4) * 3, 0, 1);
    // Majestic emergence (scale and position)
    const riseY = lerp(h * 1.5, h * 0.15, easeOutBack((t - 0.4) / 0.4));

    const flagW = w * 0.65;
    const flagH = flagW * (2/3);
    const cx = w * 0.5;

    ctx.save();
    ctx.globalAlpha = flagAlpha;

    const cols = 60;
    const rows = 30;
    const cellW = flagW / cols;
    const cellH = flagH / rows;

    // Procedural Cloth Simulation Data
    const points: {x: number, y: number, z: number, shade: number}[][] = [];
    
    for (let y = 0; y <= rows; y++) {
      points[y] = [];
      for (let x = 0; x <= cols; x++) {
        // Complex wind solver (layered sines + noise)
        const wind1 = Math.sin(x * 0.15 + elapsed * 3) * 25;
        const wind2 = Math.sin(y * 0.2 - elapsed * 2 + x * 0.05) * 15;
        const flutter = Math.sin(x * 0.8 + elapsed * 10) * 5;
        
        // Z-depth (0 to 1)
        const z = (wind1 + wind2 + flutter) / 45;
        
        // Shade based on normal facing (simulated lighting)
        const shade = clamp(0.4 + z * 0.6, 0, 1);
        
        const px = cx - flagW/2 + x * cellW + (z * 15); // perspective skew
        const py = riseY + y * cellH;
        
        points[y][x] = { x: px, y: py, z, shade };
      }
    }

    // Render Cloth Mesh
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p1 = points[y][x];
        const p2 = points[y][x+1];
        const p3 = points[y+1][x];
        const p4 = points[y+1][x+1];
        
        const avgShade = (p1.shade + p2.shade + p3.shade + p4.shade) / 4;
        
        let baseColor = [0, 0, 0];
        if (y < rows / 3) baseColor = [255, 153, 51]; // Saffron
        else if (y < rows * 2 / 3) baseColor = [255, 255, 255]; // White
        else baseColor = [18, 136, 8]; // Green

        const r = ACESFilmic(baseColor[0] * avgShade / 255) * 255;
        const g = ACESFilmic(baseColor[1] * avgShade / 255) * 255;
        const b = ACESFilmic(baseColor[2] * avgShade / 255) * 255;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        
        // Draw quad
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw Metallic Ashoka Chakra
    const chakraX = cx + points[Math.floor(rows/2)][Math.floor(cols/2)].x - cx;
    const chakraY = riseY + flagH / 2;
    drawAshokaChakra(ctx, chakraX, chakraY, flagH * 0.16, elapsed, t);

    // Flag Pole
    const poleGrad = ctx.createLinearGradient(cx - flagW/2 - 10, 0, cx - flagW/2 + 10, 0);
    poleGrad.addColorStop(0, '#3a2a1a');
    poleGrad.addColorStop(0.5, '#8B4513');
    poleGrad.addColorStop(1, '#3a2a1a');
    ctx.fillStyle = poleGrad;
    ctx.fillRect(cx - flagW/2 - 10, riseY - 50, 20, h);
    
    // Gold Finial
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx - flagW/2, riseY - 50, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawAshokaChakra(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, elapsed: number, t: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(elapsed * 0.08); // Extremely slow rotation

    // Metallic Navy Blue Base
    const metalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    metalGrad.addColorStop(0, '#1a1a8a');
    metalGrad.addColorStop(0.7, '#000050');
    metalGrad.addColorStop(1, '#000030');
    ctx.strokeStyle = metalGrad;
    ctx.lineWidth = radius * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 24 Embossed Spokes
    ctx.lineWidth = radius * 0.05;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const x1 = Math.cos(angle) * radius * 0.1;
      const y1 = Math.sin(angle) * radius * 0.1;
      const x2 = Math.cos(angle) * radius * 0.95;
      const y2 = Math.sin(angle) * radius * 0.95;
      
      // Shadow pass
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.moveTo(x1+1, y1+1);
      ctx.lineTo(x2+1, y2+1);
      ctx.stroke();
      
      // Metallic pass
      ctx.strokeStyle = metalGrad;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center Hub
    ctx.fillStyle = metalGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Gold Rim Highlight (Sun reflection)
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(elapsed*2)*0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.08, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawJetsAndSmoke(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    const activeJets = jetsRef.current.filter(j => j.x < w + 500);
    
    activeJets.forEach(jet => {
      jet.x += jet.vx;
      jet.y += jet.vy;

      // Spawn Volumetric Smoke
      if (Math.random() < 0.8) {
        const p = getObject(particlePoolRef.current);
        p.active = true;
        p.x = jet.x - 30 * jet.scale;
        p.y = jet.y + 5 * jet.scale;
        p.vx = -2 + Math.random();
        p.vy = (Math.random() - 0.5) * 1;
        p.life = 3; p.maxLife = 3;
        p.size = 20 * jet.scale + Math.random() * 20;
        p.color = jet.smokeColor;
        p.type = 'smoke';
      }

      // Draw Sukhoi Su-30MKI Silhouette
      ctx.save();
      ctx.translate(jet.x, jet.y);
      ctx.scale(jet.scale, jet.scale);
      
      // Afterburner Glow
      const burnerGrad = ctx.createRadialGradient(-30, 0, 0, -30, 0, 40);
      burnerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      burnerGrad.addColorStop(0.2, 'rgba(100, 200, 255, 0.8)');
      burnerGrad.addColorStop(0.6, 'rgba(255, 150, 50, 0.6)');
      burnerGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = burnerGrad;
      ctx.fillRect(-70, -20, 50, 40);

      // Jet Body (Dark Metallic)
      ctx.fillStyle = '#0a0a0a';
      
      // Fuselage
      ctx.beginPath();
      ctx.moveTo(40, 0); // Nose
      ctx.quadraticCurveTo(20, -5, -10, -6);
      ctx.lineTo(-30, -4);
      ctx.lineTo(-30, 4);
      ctx.lineTo(-10, 6);
      ctx.quadraticCurveTo(20, 5, 40, 0);
      ctx.fill();

      // Canopy
      ctx.fillStyle = 'rgba(20, 40, 80, 0.8)';
      ctx.beginPath();
      ctx.ellipse(15, -1, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main Delta Wings
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-25, -35); // Leading edge
      ctx.lineTo(-35, -35); // Trailing edge
      ctx.lineTo(-15, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-25, 35);
      ctx.lineTo(-35, 35);
      ctx.lineTo(-15, 0);
      ctx.closePath();
      ctx.fill();

      // Tail Fins
      ctx.beginPath();
      ctx.moveTo(-20, -2);
      ctx.lineTo(-35, -20);
      ctx.lineTo(-40, -20);
      ctx.lineTo(-25, -2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }

  function updateParticles(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number, pool: Particle[]) {
    // Spawn Cinematic Dust Motes
    if (t > 0.1 && Math.random() < 0.3) {
      const p = getObject(pool);
      p.active = true;
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.vx = Math.sin(elapsed + Math.random()*10) * 0.3;
      p.vy = -0.2 - Math.random() * 0.3;
      p.life = 5; p.maxLife = 5;
      p.size = 1 + Math.random() * 2;
      p.color = `rgba(255, ${200 + Math.random() * 55}, 150, 0.4)`;
      p.type = 'dust';
    }

    // Spawn Tricolor Confetti
    if (t > 0.8 && Math.random() < 0.4) {
      const p = getObject(pool);
      p.active = true;
      p.x = Math.random() * w;
      p.y = -10;
      p.vx = (Math.random() - 0.5) * 3;
      p.vy = 1 + Math.random() * 3;
      p.life = 6; p.maxLife = 6;
      p.size = 6 + Math.random() * 8;
      const colors = ['#FF9933', '#FFFFFF', '#138808'];
      p.color = colors[Math.floor(Math.random() * 3)];
      p.type = 'confetti';
      p.rotation = Math.random() * Math.PI * 2;
      p.vr = (Math.random() - 0.5) * 0.2;
    }

    // Update existing particles
    pool.forEach(p => {
      if (!p.active) return;
      
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.type === 'smoke') {
        p.size += 0.5; // Expand
        p.vx *= 0.98; // Slow down
        p.vy *= 0.98;
        p.life -= 0.015;
      } else if (p.type === 'confetti') {
        p.rotation += p.vr;
        p.vy += 0.05; // Gravity
        p.vx += Math.sin(elapsed + p.y * 0.01) * 0.1; // Wind
        p.life -= 0.012;
      } else if (p.type === 'ember') {
        p.vy -= 0.02; // Buoyancy
        p.vx += (Math.random() - 0.5) * 0.2;
        p.life -= 0.02;
      } else { // dust
        p.life -= 0.005;
      }

      if (p.life <= 0 || p.x < -100 || p.x > w + 100 || p.y > h + 100) {
        p.active = false;
      }
    });
  }

  function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[]) {
    ctx.save();
    pool.forEach(p => {
      if (!p.active) return;
      
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      
      if (p.type === 'smoke') {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha * 0.6;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      } else if (p.type === 'dust' || p.type === 'ember') {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'confetti') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
        ctx.restore();
      }
    });
    ctx.restore();
  }

  function drawTypography(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t < 0.65) return;
    
    const textAlpha = clamp((t - 0.65) * 3, 0, 1);
    const titleY = lerp(h * 0.65, h * 0.4, easeOutExpo((t - 0.65) * 3));
    
    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.textAlign = 'center';
    
    const fontSize = Math.min(w * 0.09, 90);
    // Premium Serif Font
    ctx.font = `600 ${fontSize}px 'Cinzel', 'Playfair Display', Georgia, serif`;
    
    // Multi-layer Text for Gold Emboss & Bloom
    // 1. Outer Bloom
    ctx.shadowColor = 'rgba(255, 180, 50, 0.8)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(255, 150, 0, 0.2)';
    ctx.fillText("HAPPY REPUBLIC DAY", w/2, titleY);
    
    // 2. Gold Foil Gradient
    ctx.shadowBlur = 0;
    const grad = ctx.createLinearGradient(0, titleY - fontSize/2, 0, titleY + fontSize/2);
    grad.addColorStop(0, '#FFFACD');
    grad.addColorStop(0.4, '#FFD700');
    grad.addColorStop(0.6, '#DAA520');
    grad.addColorStop(1, '#8B6914');
    ctx.fillStyle = grad;
    ctx.fillText("HAPPY REPUBLIC DAY", w/2, titleY);

    // 3. Light Sweep Animation
    ctx.save();
    ctx.beginPath();
    ctx.rect(w/2 - 500, titleY - fontSize, 1000, fontSize * 1.2);
    ctx.clip();
    
    const sweepX = w/2 - 500 + ((elapsed * 400) % 1200);
    const sweepGrad = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
    sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sweepGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(sweepX - 80, titleY - fontSize, 160, fontSize * 1.2);
    ctx.restore();

    // Subtitle
    ctx.font = `400 ${fontSize * 0.4}px 'Cinzel', Georgia, serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillText("जय हिन्द", w/2, titleY + fontSize * 0.8);
    
    ctx.restore();
  }

  function drawFinalScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t < 0.85) return;
    
    const phase = clamp((t - 0.85) / 0.15, 0, 1);
    
    // Update Doves
    dovesRef.current.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      d.wing += 0.25;
    });

    // Full Screen Flag Wave (Procedural Mesh)
    ctx.save();
    ctx.globalAlpha = phase * 0.85;
    const flagH = h;
    const flagW = h * 1.5;
    
    const fCols = 50;
    const fRows = 30;
    const fCellW = flagW / fCols;
    const fCellH = flagH / fRows;

    for (let y = 0; y < fRows; y++) {
      for (let x = 0; x < fCols; x++) {
        const px = w/2 - flagW/2 + x * fCellW;
        const py = y * fCellH;
        
        const wave = Math.sin(x * 0.25 + elapsed * 3) * 30 + Math.sin(y * 0.4 + elapsed * 2) * 10;
        const shade = clamp(0.5 + (wave / 40) * 0.5, 0, 1);
        
        let color = [0,0,0];
        if (y < fRows / 3) color = [255, 153, 51];
        else if (y < fRows * 2 / 3) color = [255, 255, 255];
        else color = [18, 136, 8];

        const r = ACESFilmic(color[0] * shade / 255) * 255;
        const g = ACESFilmic(color[1] * shade / 255) * 255;
        const b = ACESFilmic(color[2] * shade / 255) * 255;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(px + wave, py, fCellW + 1, fCellH + 1);
      }
    }
    ctx.restore();

    // Draw Doves
    ctx.save();
    ctx.globalAlpha = phase;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    dovesRef.current.forEach(d => {
      ctx.save();
      ctx.translate(d.x, d.y);
      const wingY = Math.sin(d.wing) * 12;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-15, -wingY, -30, 0);
      ctx.quadraticCurveTo(-15, wingY * 0.5, 0, 0);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(15, -wingY, 30, 0);
      ctx.quadraticCurveTo(15, wingY * 0.5, 0, 0);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // Final Text Reveal
    ctx.save();
    ctx.globalAlpha = phase;
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.min(w * 0.14, 140)}px 'Cinzel', Georgia, serif`;
    
    // Deep shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 50;
    
    const grad = ctx.createLinearGradient(0, h/2 - 70, 0, h/2 + 70);
    grad.addColorStop(0, '#FFFACD');
    grad.addColorStop(0.5, '#FFD700');
    grad.addColorStop(1, '#8B6914');
    ctx.fillStyle = grad;
    ctx.fillText("वंदे मातरम्", w/2, h/2);
    ctx.restore();
  }

  function drawPostFX(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    // 1. ACES Color Grade (Orange & Teal approximation)
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const gradeGrad = ctx.createLinearGradient(0, 0, w, h);
    gradeGrad.addColorStop(0, 'rgba(255, 140, 50, 0.3)'); // Warm highlights
    gradeGrad.addColorStop(1, 'rgba(0, 50, 100, 0.4)');   // Cool shadows
    ctx.fillStyle = gradeGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 2. Cinematic Vignette
    const vignette = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h*0.9);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // 3. Letterbox Bars (2.35:1 Aspect Ratio)
    const barH = h * 0.1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);
    
    // 4. High Quality Film Grain (Procedural Noise)
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.04;
    for(let i=0; i<150; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#000000';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    ctx.restore();
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000', 
      overflow: 'hidden', 
      position: 'relative',
      cursor: 'pointer',
      fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif"
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%' 
        }} 
      />
    </div>
  );
};

export default RepublicDayCinematicIntro;
