import React, { useEffect, useRef } from 'react';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  color: string; type: 'dust' | 'ember' | 'confetti' | 'bokeh';
  rotation: number; vr: number; active: boolean;
}

interface Jet {
  x: number; y: number; vx: number; vy: number;
  scale: number; smokeColor: string;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

const getObject = (pool: Particle[]): Particle => {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) return pool[i];
  }
  const p = { active: false } as Particle;
  pool.push(p);
  return p;
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

    // Initialize Jets
    jetsRef.current = [
      { x: -200, y: height * 0.4, vx: 6, vy: 3, scale: 1, smokeColor: '#FF9933' },
      { x: -250, y: height * 0.45, vx: 6, vy: 3, scale: 0.9, smokeColor: '#FFFFFF' },
      { x: -300, y: height * 0.5, vx: 6, vy: 3, scale: 0.8, smokeColor: '#138808' }
    ];

    // Initialize Doves
    dovesRef.current = Array.from({ length: 6 }, (_, i) => ({
      x: width * (0.2 + i * 0.1),
      y: height * (0.6 + Math.random() * 0.2),
      vx: 1 + Math.random(),
      vy: -0.5 - Math.random() * 0.5,
      wing: Math.random() * Math.PI * 2
    }));

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000; // in seconds
      const t = clamp(elapsed / 15, 0, 1); // Normalized 0 to 1 timeline

      // Base Clear
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Cinematic Camera Shake & Breathing
      const shakeX = Math.sin(elapsed * 0.8) * 2 * (1 - t);
      const shakeY = Math.cos(elapsed * 0.6) * 2 * (1 - t);
      const breathe = Math.sin(elapsed * 0.4) * 0.02;
      
      // Camera Zoom (Dolly)
      const baseZoom = lerp(1.0, 1.15, easeOutExpo(t));
      const zoom = baseZoom + breathe;

      ctx.save();
      ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // --- RENDER PIPELINE ---
      drawSky(ctx, width, height, t, elapsed);
      drawStars(ctx, width, height, t, elapsed);
      drawClouds(ctx, width, height, t, elapsed);
      
      // Sun and God Rays
      drawSun(ctx, width, height, t);
      drawGodRays(ctx, width, height, t, elapsed);

      // India Gate & Torch
      drawTorch(ctx, width, height, t, elapsed);
      drawIndiaGate(ctx, width, height, t);

      // Flag & Chakra
      drawFlagMesh(ctx, width, height, t, elapsed);
      
      // Atmosphere
      drawFog(ctx, width, height, t, elapsed);

      // Jets & Smoke
      if (t > 0.5 && t < 0.8) {
        drawJets(ctx, width, height, t, elapsed);
      }

      // Particles
      updateParticles(ctx, width, height, t, elapsed, particlePoolRef.current);
      drawParticles(ctx, particlePoolRef.current);

      // Typography
      drawTypography(ctx, width, height, t, elapsed);

      // Final Scene (13-15s)
      drawFinalScene(ctx, width, height, t, elapsed);

      ctx.restore();

      // Post Processing (Vignette & Grain)
      drawPostFX(ctx, width, height, t);

      if (elapsed < 15.5) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Loop or stop logic can go here
        startTimeRef.current = 0; // Reset for replay
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
  // RENDER FUNCTIONS
  // ==========================================

  function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    // Dynamic Sky Gradient: Night -> Purple -> Orange -> Golden -> Morning
    const phase1 = clamp(t / 0.4, 0, 1); // 0-6s
    const phase2 = clamp((t - 0.3) / 0.4, 0, 1); // 4.5-9s
    const phase3 = clamp((t - 0.6) / 0.4, 0, 1); // 9-15s

    // Deep Blue to Purple
    const r1 = lerp(5, 30, phase1);
    const g1 = lerp(10, 15, phase1);
    const b1 = lerp(35, 50, phase1);

    // Purple to Orange
    const r2 = lerp(r1, 255, phase2);
    const g2 = lerp(g1, 140, phase2);
    const b2 = lerp(b1, 50, phase2);

    // Orange to Golden Morning
    const r3 = lerp(r2, 255, phase3);
    const g3 = lerp(g2, 200, phase3);
    const b3 = lerp(b2, 150, phase3);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgb(${r3},${g3 * 0.6},${b3 * 0.8})`);
    grad.addColorStop(0.5, `rgb(${r3 * 0.8},${g3 * 0.7},${b3 * 0.6})`);
    grad.addColorStop(1, `rgb(${r3 * 0.2},${g3 * 0.3},${b3 * 0.4})`);
    ctx.fillStyle = grad;
    ctx.fillRect(-w, -h, w * 3, h * 3);

    // Subtle Moon (Fading out)
    if (t < 0.5) {
      const moonAlpha = 1 - phase2;
      ctx.save();
      ctx.globalAlpha = moonAlpha;
      const moonGrad = ctx.createRadialGradient(w * 0.8, h * 0.2, 0, w * 0.8, h * 0.2, 150);
      moonGrad.addColorStop(0, 'rgba(255, 255, 240, 1)');
      moonGrad.addColorStop(0.2, 'rgba(255, 255, 240, 0.8)');
      moonGrad.addColorStop(1, 'rgba(255, 255, 240, 0)');
      ctx.fillStyle = moonGrad;
      ctx.fillRect(w * 0.8 - 150, h * 0.2 - 150, 300, 300);
      ctx.restore();
    }
  }

  function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t > 0.6) return; // Hide stars in daytime
    const alpha = 1 - clamp(t / 0.5, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 200; i++) {
      const x = (Math.sin(i * 92.3) * 0.5 + 0.5) * w;
      const y = (Math.cos(i * 45.1) * 0.5 + 0.5) * h * 0.6;
      const twinkle = Math.sin(elapsed * 3 + i) * 0.5 + 0.5;
      const size = (Math.sin(i * 12.4) * 0.5 + 0.5) * 1.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Bright Star Glow
      if (size > 1.5) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }

  function drawClouds(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const offset = elapsed * 5;
    for (let i = 0; i < 5; i++) {
      const x = (i * w * 0.3 + offset) % (w * 1.5) - w * 0.2;
      const y = h * (0.1 + i * 0.05);
      const radius = h * (0.2 + i * 0.05);
      
      const cloudGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      cloudGrad.addColorStop(0, 'rgba(100, 100, 120, 0.1)');
      cloudGrad.addColorStop(1, 'rgba(100, 100, 120, 0)');
      ctx.fillStyle = cloudGrad;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    ctx.restore();
  }

  function drawFog(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const offset = elapsed * 15;
    
    // Ground fog
    const fogGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
    fogGrad.addColorStop(0, 'rgba(50, 50, 70, 0)');
    fogGrad.addColorStop(0.5, 'rgba(150, 150, 180, 0.1)');
    fogGrad.addColorStop(1, 'rgba(200, 200, 220, 0.2)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    // Moving fog wisps
    for(let i=0; i<4; i++) {
      const x = (i * w * 0.4 + offset) % (w * 1.5) - w * 0.2;
      const y = h * (0.75 + i * 0.02);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 300);
      grad.addColorStop(0, 'rgba(200, 200, 220, 0.05)');
      grad.addColorStop(1, 'rgba(200, 200, 220, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 300, y - 300, 600, 600);
    }
    ctx.restore();
  }

  function drawTorch(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    const tx = w * 0.5;
    const ty = h * 0.75;
    
    // Smoke (Only when off or just igniting)
    if (t < 0.2) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for(let i=0; i<5; i++) {
        const sy = ty - (elapsed * 20 + i * 40) % 200;
        const sx = tx + Math.sin(sy * 0.05 + elapsed) * 15;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 40);
        grad.addColorStop(0, 'rgba(80, 80, 80, 0.3)');
        grad.addColorStop(1, 'rgba(80, 80, 80, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(sx - 40, sy - 40, 80, 80);
      }
      ctx.restore();
    }

    // Ignition
    if (t > 0.1) {
      const fireAlpha = clamp((t - 0.1) * 5, 0, 1);
      ctx.save();
      ctx.globalAlpha = fireAlpha;
      ctx.globalCompositeOperation = 'lighter';
      
      // Base Fire Glow
      const glowGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 300);
      glowGrad.addColorStop(0, 'rgba(255, 150, 50, 0.8)');
      glowGrad.addColorStop(0.3, 'rgba(255, 100, 20, 0.4)');
      glowGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(tx - 300, ty - 300, 600, 600);

      // Fire Core
      const flicker = Math.sin(elapsed * 20) * 5 + Math.sin(elapsed * 7) * 3;
      const fireGrad = ctx.createRadialGradient(tx, ty + flicker, 0, tx, ty + flicker, 60);
      fireGrad.addColorStop(0, 'rgba(255, 255, 220, 1)');
      fireGrad.addColorStop(0.4, 'rgba(255, 200, 50, 0.8)');
      fireGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = fireGrad;
      
      ctx.beginPath();
      ctx.moveTo(tx - 40, ty);
      ctx.quadraticCurveTo(tx - 20, ty - 80 + flicker, tx, ty - 120 + flicker);
      ctx.quadraticCurveTo(tx + 20, ty - 80 - flicker, tx + 40, ty);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  function drawIndiaGate(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const gateW = w * 0.8;
    const gateH = h * 0.65;
    const baseY = h * 0.85;
    const cx = w * 0.5;

    ctx.save();
    
    // Visibility from darkness
    const visibility = clamp(t * 2, 0.2, 1);
    ctx.globalAlpha = visibility;

    // Base Shadow
    ctx.fillStyle = 'rgba(20, 15, 10, 0.8)';
    ctx.fillRect(cx - gateW/2, baseY - 20, gateW, 40);

    // Material setup
    const stoneColor = `rgb(${lerp(40, 180, t)}, ${lerp(40, 160, t)}, ${lerp(40, 120, t)})`;
    const darkStone = `rgb(${lerp(20, 100, t)}, ${lerp(20, 90, t)}, ${lerp(20, 70, t)})`;
    
    // Helper to draw architectural blocks
    const drawBlock = (x: number, y: number, width: number, height: number, isDark: boolean = false) => {
      ctx.fillStyle = isDark ? darkStone : stoneColor;
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = `rgba(0,0,0,0.3)`;
      ctx.strokeRect(x, y, width, height);
    };

    // Main Body
    drawBlock(cx - gateW/2, baseY - gateH, gateW, gateH);
    
    // Central Arch
    const archW = gateW * 0.25;
    const archH = gateH * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - archW/2, baseY);
    ctx.lineTo(cx - archW/2, baseY - archH * 0.6);
    ctx.quadraticCurveTo(cx, baseY - archH, cx + archW/2, baseY - archH * 0.6);
    ctx.lineTo(cx + archW/2, baseY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10, 5, 0, 0.9)';
    ctx.fill();

    // Side Arches
    [-1, 1].forEach(side => {
      const sArchW = gateW * 0.12;
      const sArchH = gateH * 0.4;
      const sX = cx + side * gateW * 0.3;
      ctx.beginPath();
      ctx.moveTo(sX - sArchW/2, baseY);
      ctx.lineTo(sX - sArchW/2, baseY - sArchH * 0.6);
      ctx.quadraticCurveTo(sX, baseY - sArchH, sX + sArchW/2, baseY - sArchH * 0.6);
      ctx.lineTo(sX + sArchW/2, baseY);
      ctx.closePath();
      ctx.fill();
    });

    // Cornices and Columns
    ctx.fillStyle = darkStone;
    ctx.fillRect(cx - gateW/2, baseY - gateH, gateW, 20); // Top horizontal cornice
    ctx.fillRect(cx - gateW/2, baseY - gateH * 0.3, gateW, 15); // Middle cornice
    
    // Columns
    for(let i=0; i<6; i++) {
      const colX = cx - gateW/2 + (gateW / 6) * i + 10;
      ctx.fillRect(colX, baseY - gateH * 0.8, 15, gateH * 0.8);
    }

    // Top Canopy
    const canopyY = baseY - gateH - 40;
    drawBlock(cx - gateW * 0.1, canopyY, gateW * 0.2, 40);
    ctx.beginPath();
    ctx.moveTo(cx - gateW * 0.15, canopyY);
    ctx.lineTo(cx, canopyY - 50);
    ctx.lineTo(cx + gateW * 0.15, canopyY);
    ctx.closePath();
    ctx.fillStyle = darkStone;
    ctx.fill();

    // Warm Torch Light Projection on Gate
    if (t > 0.1) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const torchLight = ctx.createRadialGradient(w/2, h*0.75, 0, w/2, h*0.75, gateH);
      torchLight.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
      torchLight.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = torchLight;
      ctx.fillRect(cx - gateW/2, baseY - gateH, gateW, gateH);
      ctx.restore();
    }

    // Sunrise Backlight
    if (t > 0.3) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const sunLight = ctx.createLinearGradient(0, baseY - gateH, 0, baseY);
      sunLight.addColorStop(0, `rgba(255, 200, 100, ${t * 0.5})`);
      sunLight.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = sunLight;
      ctx.fillRect(cx - gateW/2, baseY - gateH, gateW, gateH);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    if (t < 0.25) return;
    const sunY = lerp(h * 0.9, h * 0.45, easeOutExpo((t - 0.25) / 0.5));
    const sunX = w * 0.5;
    const intensity = clamp((t - 0.25) * 2, 0, 1);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Lens Bloom
    const bloomGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.6);
    bloomGrad.addColorStop(0, `rgba(255, 220, 150, ${0.8 * intensity})`);
    bloomGrad.addColorStop(0.2, `rgba(255, 150, 50, ${0.4 * intensity})`);
    bloomGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun Core
    const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 100);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    coreGrad.addColorStop(0.5, `rgba(255, 240, 180, ${0.8 * intensity})`);
    coreGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(sunX - 100, sunY - 100, 200, 200);

    ctx.restore();
  }

  function drawGodRays(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t < 0.35) return;
    const intensity = clamp((t - 0.35) * 3, 0, 1);
    const sunX = w * 0.5;
    const sunY = lerp(h * 0.9, h * 0.45, easeOutExpo((t - 0.25) / 0.5));

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(sunX, sunY);
    ctx.rotate(Math.sin(elapsed * 0.1) * 0.05); // Slow drift

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + elapsed * 0.02;
      const length = h * 0.8;
      const width = 100 + Math.sin(elapsed + i) * 50;
      
      ctx.save();
      ctx.rotate(angle);
      const rayGrad = ctx.createLinearGradient(0, 0, 0, length);
      rayGrad.addColorStop(0, `rgba(255, 220, 150, ${0.15 * intensity})`);
      rayGrad.addColorStop(1, 'rgba(255, 220, 150, 0)');
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

  function drawFlagMesh(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t < 0.35) return;
    const flagAlpha = clamp((t - 0.35) * 3, 0, 1);
    const riseY = lerp(h * 1.2, h * 0.25, easeOutExpo((t - 0.35) / 0.4));

    const flagW = w * 0.6;
    const flagH = flagW * (2/3); // Standard Indian Flag Ratio
    const cx = w * 0.5;

    ctx.save();
    ctx.globalAlpha = flagAlpha;

    const cols = 40;
    const rows = 20;
    const cellW = flagW / cols;
    const cellH = flagH / rows;

    // Procedural Cloth Simulation (Sine Wave Mesh Deformation)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = cx - flagW/2 + x * cellW;
        const py = riseY + y * cellH;
        
        // Wave deformation
        const wave1 = Math.sin(x * 0.2 + elapsed * 2) * 15;
        const wave2 = Math.sin(y * 0.3 + elapsed * 1.5) * 5;
        const zDepth = (wave1 + wave2) / 20; // -1 to 1
        
        const offsetX = zDepth * 10;
        const shading = 0.7 + zDepth * 0.3;

        // Color Bands
        let color = '';
        if (y < rows / 3) color = `rgba(255, 153, 51, ${shading})`; // Saffron
        else if (y < rows * 2 / 3) {
          color = `rgba(255, 255, 255, ${shading})`; // White
          // Draw Ashoka Chakra in center
          if (x > cols/2 - 4 && x < cols/2 + 4 && y > rows/2 - 4 && y < rows/2 + 4) {
            color = `rgba(0, 0, 128, ${shading})`;
          }
        } else {
          color = `rgba(18, 136, 8, ${shading})`; // Green
        }

        ctx.fillStyle = color;
        ctx.fillRect(px + offsetX, py, cellW + 1, cellH + 1);
      }
    }

    // Draw Detailed Ashoka Chakra
    const chakraX = cx;
    const chakraY = riseY + flagH / 2;
    drawAshokaChakra(ctx, chakraX, chakraY, flagH * 0.15, elapsed);

    // Flag Pole
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(cx - flagW/2 - 10, riseY, 20, h);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx - flagW/2, riseY, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawAshokaChakra(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, elapsed: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(elapsed * 0.1); // Slow rotation

    // Outer Ring
    ctx.strokeStyle = '#000080';
    ctx.lineWidth = radius * 0.08;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 24 Spokes
    ctx.lineWidth = radius * 0.04;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * radius * 0.95, Math.sin(angle) * radius * 0.95);
      ctx.stroke();
    }

    // Inner Hub
    ctx.fillStyle = '#000080';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Gold Rim Highlight
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawJets(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    const activeJets = jetsRef.current.filter(j => j.x < w + 400);
    
    activeJets.forEach(jet => {
      jet.x += jet.vx;
      jet.y += jet.vy;

      // Smoke Trail
      const smokeParticle = getObject(particlePoolRef.current);
      smokeParticle.active = true;
      smokeParticle.x = jet.x - 20 * jet.scale;
      smokeParticle.y = jet.y + 5 * jet.scale;
      smokeParticle.vx = -1 + Math.random() * 0.5;
      smokeParticle.vy = Math.random() * 0.5;
      smokeParticle.life = 2.5;
      smokeParticle.maxLife = 2.5;
      smokeParticle.size = 15 * jet.scale + Math.random() * 10;
      smokeParticle.color = jet.smokeColor;
      smokeParticle.type = 'confetti'; // Reusing confetti render for smoke volume
      smokeParticle.rotation = 0;
      smokeParticle.vr = 0;

      // Draw Sukhoi Silhouette
      ctx.save();
      ctx.translate(jet.x, jet.y);
      ctx.scale(jet.scale, jet.scale);
      
      // Afterburner
      const burnerGrad = ctx.createRadialGradient(-25, 0, 0, -25, 0, 20);
      burnerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      burnerGrad.addColorStop(0.3, 'rgba(255, 200, 50, 0.8)');
      burnerGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = burnerGrad;
      ctx.fillRect(-45, -10, 30, 20);

      // Jet Body
      ctx.fillStyle = '#1a1a1a';
      // Fuselage
      ctx.beginPath();
      ctx.moveTo(30, 0); // Nose
      ctx.lineTo(10, -3);
      ctx.lineTo(-20, -4);
      ctx.lineTo(-25, -2);
      ctx.lineTo(-25, 2);
      ctx.lineTo(-20, 4);
      ctx.lineTo(10, 3);
      ctx.closePath();
      ctx.fill();

      // Wings
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, -20);
      ctx.lineTo(-25, -20);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 20);
      ctx.lineTo(-25, 20);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-20, -2);
      ctx.lineTo(-30, -12);
      ctx.lineTo(-25, -2);
      ctx.closePath();
      ctx.fill();

      // Cockpit Glass
      ctx.fillStyle = 'rgba(50, 100, 150, 0.6)';
      ctx.beginPath();
      ctx.ellipse(15, -1, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  function updateParticles(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number, pool: Particle[]) {
    // Spawn new particles based on timeline
    if (t > 0.5) {
      // Golden Dust & Embers
      if (Math.random() < 0.5) {
        const p = getObject(pool);
        p.active = true;
        p.x = Math.random() * w;
        p.y = h + 10;
        p.vx = (Math.random() - 0.5) * 1;
        p.vy = -1 - Math.random() * 2;
        p.life = 4; p.maxLife = 4;
        p.size = 1 + Math.random() * 3;
        p.color = `rgba(255, ${200 + Math.random() * 55}, ${100 + Math.random() * 100}, ${Math.random() * 0.5})`;
        p.type = 'dust';
        p.rotation = 0; p.vr = 0;
      }

      // Tricolor Confetti
      if (Math.random() < 0.3) {
        const p = getObject(pool);
        p.active = true;
        p.x = Math.random() * w;
        p.y = -10;
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = 1 + Math.random() * 2;
        p.life = 5; p.maxLife = 5;
        p.size = 4 + Math.random() * 6;
        const colors = ['#FF9933', '#FFFFFF', '#138808'];
        p.color = colors[Math.floor(Math.random() * 3)];
        p.type = 'confetti';
        p.rotation = Math.random() * Math.PI * 2;
        p.vr = (Math.random() - 0.5) * 0.1;
      }
    }

    // Update existing
    pool.forEach(p => {
      if (!p.active) return;
      
      p.x += p.vx;
      p.y += p.vy;
      
      // Wind effect
      p.vx += Math.sin(elapsed + p.y * 0.01) * 0.05;
      
      if (p.type === 'confetti') {
        p.rotation += p.vr;
        p.vy += 0.02; // Gravity
      } else if (p.type === 'dust') {
        p.vy -= 0.01; // Buoyancy
      }

      p.life -= 0.016;
      if (p.life <= 0 || p.x < -50 || p.x > w + 50 || p.y > h + 50) {
        p.active = false;
      }
    });
  }

  function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[]) {
    ctx.save();
    pool.forEach(p => {
      if (!p.active) return;
      
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      
      if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'confetti') {
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
    if (t < 0.6) return;
    
    const textAlpha = clamp((t - 0.6) * 3, 0, 1);
    const titleY = lerp(h * 0.6, h * 0.4, easeOutExpo((t - 0.6) * 3));
    
    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.textAlign = 'center';
    
    // Premium Gold Typography
    const fontSize = Math.min(w * 0.08, 80);
    ctx.font = `900 ${fontSize}px Georgia, serif`;
    
    // Shadow & Depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    
    // Gold Gradient
    const grad = ctx.createLinearGradient(0, titleY - fontSize/2, 0, titleY + fontSize/2);
    grad.addColorStop(0, '#FFFACD');
    grad.addColorStop(0.5, '#FFD700');
    grad.addColorStop(1, '#B8860B');
    ctx.fillStyle = grad;
    ctx.fillText("HAPPY REPUBLIC DAY", w/2, titleY);
    
    // Light Sweep Effect
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(w/2 - 400, titleY - fontSize/2, 800, fontSize);
    ctx.clip();
    
    const sweepX = w/2 - 400 + ((elapsed * 300) % 1000);
    const sweepGrad = ctx.createLinearGradient(sweepX - 50, 0, sweepX + 50, 0);
    sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sweepGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(sweepX - 50, titleY - fontSize/2, 100, fontSize);
    ctx.restore();

    // Subtitle
    ctx.font = `400 ${fontSize * 0.4}px Georgia, serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText("जय हिन्द 🇮🇳", w/2, titleY + fontSize * 0.8);
    
    ctx.restore();
  }

  function drawFinalScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elapsed: number) {
    if (t < 0.85) return;
    
    // Fade to full screen Tiranga
    const phase = clamp((t - 0.85) / 0.15, 0, 1);
    
    // Update Doves
    dovesRef.current.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      d.wing += 0.2;
    });

    // Full Screen Flag Wave Overlay
    ctx.save();
    ctx.globalAlpha = phase * 0.9;
    const flagH = h;
    const flagW = h * 1.5;
    
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 50; x++) {
        const cellW = flagW / 50;
        const cellH = flagH / 30;
        const px = w/2 - flagW/2 + x * cellW;
        const py = y * cellH;
        
        const wave = Math.sin(x * 0.3 + elapsed * 3) * 20;
        const shading = 0.6 + (wave / 20) * 0.4;
        
        let color = '';
        if (y < 10) color = `rgba(255, 153, 51, ${shading})`;
        else if (y < 20) color = `rgba(255, 255, 255, ${shading})`;
        else color = `rgba(18, 136, 8, ${shading})`;
        
        ctx.fillStyle = color;
        ctx.fillRect(px + wave, py, cellW + 1, cellH + 1);
      }
    }
    ctx.restore();

    // Draw Doves
    ctx.save();
    ctx.globalAlpha = phase;
    ctx.fillStyle = '#FFFFFF';
    dovesRef.current.forEach(d => {
      ctx.save();
      ctx.translate(d.x, d.y);
      const wingY = Math.sin(d.wing) * 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-10, -wingY, -20, 0);
      ctx.quadraticCurveTo(-10, wingY, 0, 0);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, -wingY, 20, 0);
      ctx.quadraticCurveTo(10, wingY, 0, 0);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // Final Text Reveal
    ctx.save();
    ctx.globalAlpha = phase;
    ctx.textAlign = 'center';
    ctx.font = `900 ${Math.min(w * 0.12, 120)}px Georgia, serif`;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillText("वंदे मातरम्", w/2, h/2);
    ctx.restore();
  }

  function drawPostFX(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    // Cinematic Vignette
    const vignette = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h*0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Letterbox Bars
    const barH = h * 0.08;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);
    
    // Film Grain (Subtle)
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.03;
    for(let i=0; i<100; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#000000';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
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
      cursor: 'pointer'
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
