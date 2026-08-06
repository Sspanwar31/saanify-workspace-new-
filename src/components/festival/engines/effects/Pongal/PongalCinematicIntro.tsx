'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
}

export default function PongalCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;

    // Load Google Fonts dynamically
    if (!document.getElementById('pongal-google-fonts')) {
      const link = document.createElement('link');
      link.id = 'pongal-google-fonts';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Sans+Tamil:wght@700;900&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0,
      H = 0,
      DPR = 1;
    let startTime = 0;
    let rafId = 0;
    let running = true;
    let handoverTriggered = false;

    // High-End Particle Engine
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      maxAlpha: number;
      life: number;
      maxLife: number;
      type: 'ember' | 'bokeh' | 'smoke' | 'petal' | 'gold_dust';
      color: string;
      rotation: number;
      rotSpeed: number;
    }

    const particles: Particle[] = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.floor(W * DPR);
      canvas!.height = Math.floor(H * DPR);
      ctx?.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    const smoothstep = (a: number, b: number, t: number) => {
      const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
      return x * x * (3 - 2 * x);
    };

    // Emit Ambient Floating Gold Dust / Bokeh
    function spawnGoldDust() {
      if (particles.length < 120 && Math.random() < 0.4) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.2 - Math.random() * 0.5,
          size: 1 + Math.random() * 3,
          alpha: 0,
          maxAlpha: 0.3 + Math.random() * 0.5,
          life: 0,
          maxLife: 200 + Math.random() * 200,
          type: 'gold_dust',
          color: Math.random() < 0.5 ? '#ffd700' : '#ffa500',
          rotation: 0,
          rotSpeed: 0,
        });
      }
    }

    // Spawn Smoke Particles
    function spawnSteam(x: number, y: number) {
      if (Math.random() < 0.5) {
        particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -1 - Math.random() * 1.5,
          size: 15 + Math.random() * 25,
          alpha: 0,
          maxAlpha: 0.25,
          life: 0,
          maxLife: 120 + Math.random() * 80,
          type: 'smoke',
          color: '#ffffff',
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
    }

    // Spawn Fire Embers
    function spawnEmbers(x: number, y: number) {
      if (Math.random() < 0.7) {
        particles.push({
          x: x + (Math.random() - 0.5) * 60,
          y: y,
          vx: (Math.random() - 0.5) * 2,
          vy: -2 - Math.random() * 3,
          size: 1.5 + Math.random() * 2.5,
          alpha: 0,
          maxAlpha: 0.9,
          life: 0,
          maxLife: 80 + Math.random() * 60,
          type: 'ember',
          color: Math.random() < 0.6 ? '#ffaa00' : '#ff3300',
          rotation: 0,
          rotSpeed: 0,
        });
      }
    }

    // Render Lighting Effects (Volumetric Rays & Vignette)
    function drawCinematicAtmosphere(t: number) {
      // Vignette Overlay
      const vigGrad = ctx!.createRadialGradient(
        W / 2,
        H / 2,
        Math.max(W, H) * 0.3,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.85
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx!.fillStyle = vigGrad;
      ctx!.fillRect(0, 0, W, H);
    }

    // SCENE 1: HARVEST DAWN (0.0s -> 3.5s)
    function drawScene1_HarvestCart(t: number) {
      const vis = smoothstep(0.0, 0.6, t) * (1 - smoothstep(3.0, 3.5, t));
      if (vis <= 0.001) return;

      const camScale = 1.0 + t * 0.03; // Smooth Zoom

      ctx!.save();
      ctx!.globalAlpha = vis;

      ctx!.translate(W / 2, H / 2);
      ctx!.scale(camScale, camScale);
      ctx!.translate(-W / 2, -H / 2);

      // Deep Sunrise Gradient
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0.0, '#0a0201');
      skyGrad.addColorStop(0.4, '#3a0c02');
      skyGrad.addColorStop(0.7, '#a83204');
      skyGrad.addColorStop(0.9, '#f27e13');
      skyGrad.addColorStop(1.0, '#120501');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // Sun Flare Bloom
      const sunX = W * 0.65,
        sunY = H * 0.5;
      const sunGlow = ctx!.createRadialGradient(
        sunX,
        sunY,
        0,
        sunX,
        sunY,
        W * 0.6
      );
      sunGlow.addColorStop(0, 'rgba(255, 240, 200, 0.95)');
      sunGlow.addColorStop(0.2, 'rgba(255, 140, 30, 0.6)');
      sunGlow.addColorStop(0.6, 'rgba(180, 40, 0, 0.2)');
      sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = sunGlow;
      ctx!.fillRect(0, 0, W, H);

      // Distant Mountains & Crop Fields Silhouette
      ctx!.fillStyle = '#0f0402';
      ctx!.beginPath();
      ctx!.moveTo(0, H * 0.75);
      ctx!.quadraticCurveTo(W * 0.25, H * 0.62, W * 0.5, H * 0.72);
      ctx!.quadraticCurveTo(W * 0.75, H * 0.8, W, H * 0.68);
      ctx!.lineTo(W, H);
      ctx!.lineTo(0, H);
      ctx!.fill();

      // Birds Flying V-Formation
      ctx!.fillStyle = '#1c0803';
      for (let i = 0; i < 6; i++) {
        const bx = W * 0.2 + t * 50 + i * 22;
        const by = H * 0.28 + Math.sin(t * 3 + i) * 8 - i * 10;
        ctx!.beginPath();
        ctx!.arc(bx, by, 3, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.restore();
    }

    // SCENE 2: BOILING PONGAL POT (3.5s -> 7.0s)
    function drawScene2_BoilingPot(t: number) {
      const vis = smoothstep(3.2, 3.8, t) * (1 - smoothstep(6.5, 7.0, t));
      if (vis <= 0.001) return;

      const camScale = 1.05 - (t - 3.5) * 0.02;

      ctx!.save();
      ctx!.globalAlpha = vis;
      ctx!.translate(W / 2, H / 2);
      ctx!.scale(camScale, camScale);
      ctx!.translate(-W / 2, -H / 2);

      // Warm Courtyard Atmosphere
      const bgGrad = ctx!.createRadialGradient(
        W / 2,
        H * 0.6,
        0,
        W / 2,
        H * 0.6,
        W * 0.7
      );
      bgGrad.addColorStop(0, '#2e0f03');
      bgGrad.addColorStop(0.6, '#120401');
      bgGrad.addColorStop(1, '#050100');
      ctx!.fillStyle = bgGrad;
      ctx!.fillRect(0, 0, W, H);

      const potX = W * 0.5;
      const potY = H * 0.58;
      const potR = Math.min(W, H) * 0.16;

      // Fire Flame Glow Effect
      ctx!.globalCompositeOperation = 'lighter';
      const fireFlicker = 0.85 + Math.sin(t * 22) * 0.15;
      const fireGlow = ctx!.createRadialGradient(
        potX,
        potY + potR * 0.8,
        0,
        potX,
        potY + potR * 0.8,
        potR * 1.4
      );
      fireGlow.addColorStop(0, `rgba(255, 200, 80, ${0.9 * fireFlicker})`);
      fireGlow.addColorStop(0.4, `rgba(255, 70, 0, ${0.6 * fireFlicker})`);
      fireGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = fireGlow;
      ctx!.beginPath();
      ctx!.arc(potX, potY + potR * 0.8, potR * 1.4, 0, Math.PI * 2);
      ctx!.fill();

      spawnEmbers(potX, potY + potR * 0.7);
      spawnSteam(potX, potY - potR * 0.8);

      ctx!.globalCompositeOperation = 'source-over';

      // Realistic 3D Brass/Earthen Pot Texture
      const potGrad = ctx!.createRadialGradient(
        potX - potR * 0.3,
        potY - potR * 0.3,
        potR * 0.1,
        potX,
        potY,
        potR
      );
      potGrad.addColorStop(0, '#fca34d');
      potGrad.addColorStop(0.3, '#c25a13');
      potGrad.addColorStop(0.7, '#591e04');
      potGrad.addColorStop(1, '#1c0701');

      ctx!.shadowColor = '#000000';
      ctx!.shadowBlur = 40;
      ctx!.fillStyle = potGrad;
      ctx!.beginPath();
      ctx!.arc(potX, potY, potR, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;

      // Overflowing Milk Animation
      if (t > 4.5) {
        const milkVis = smoothstep(4.5, 5.5, t);
        const milkGlow = ctx!.createRadialGradient(
          potX,
          potY - potR * 0.8,
          0,
          potX,
          potY - potR * 0.8,
          potR * 0.9 * milkVis
        );
        milkGlow.addColorStop(0, '#ffffff');
        milkGlow.addColorStop(0.7, '#fff3cc');
        milkGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx!.fillStyle = milkGlow;
        ctx!.beginPath();
        ctx!.arc(potX, potY - potR * 0.8, potR * 0.9 * milkVis, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.restore();
    }

    // SCENE 3: GRAND 3D METALLIC GOLD TYPOGRAPHY (7.0s -> 12.0s)
    function drawScene3_Typography(t: number) {
      const vis = smoothstep(6.8, 7.5, t) * (1 - smoothstep(11.5, 12.0, t));
      if (vis <= 0.001) return;

      const scale = 0.92 + smoothstep(6.8, 9.0, t) * 0.08;

      ctx!.save();
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.globalAlpha = vis;

      // Dark Luxury Background
      const darkGrad = ctx!.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        W * 0.7
      );
      darkGrad.addColorStop(0, 'rgba(20, 7, 2, 0.98)');
      darkGrad.addColorStop(1, 'rgba(4, 1, 0, 0.99)');
      ctx!.fillStyle = darkGrad;
      ctx!.fillRect(0, 0, W, H);

      // Cinematic God Rays
      ctx!.globalCompositeOperation = 'lighter';
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = Math.PI * 0.2 + (i / rayCount) * (Math.PI * 0.6);
        const len = H * 0.9;
        const rayGrad = ctx!.createLinearGradient(
          W / 2,
          0,
          W / 2 + Math.cos(angle) * len,
          Math.sin(angle) * len
        );
        rayGrad.addColorStop(0, `rgba(255, 215, 0, ${0.15 * vis})`);
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.fillStyle = rayGrad;
        ctx!.beginPath();
        ctx!.moveTo(W / 2, 0);
        ctx!.lineTo(
          W / 2 + Math.cos(angle - 0.03) * len,
          Math.sin(angle - 0.03) * len
        );
        ctx!.lineTo(
          W / 2 + Math.cos(angle + 0.03) * len,
          Math.sin(angle + 0.03) * len
        );
        ctx!.closePath();
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = 'source-over';

      ctx!.translate(W / 2, H * 0.45);
      ctx!.scale(scale, scale);

      // TAMIL TEXT (பொங்கல் திருநாள் வாழ்த்துக்கள்)
      const fontSizeTamil = Math.min(W * 0.075, 72);
      ctx!.font = `900 ${fontSizeTamil}px "Noto Sans Tamil", sans-serif`;

      ctx!.strokeStyle = '#050100';
      ctx!.lineWidth = fontSizeTamil * 0.12;
      ctx!.strokeText('பொங்கல் திருநாள் வாழ்த்துக்கள்', 0, 0);

      const goldTamil = ctx!.createLinearGradient(
        0,
        -fontSizeTamil / 2,
        0,
        fontSizeTamil / 2
      );
      goldTamil.addColorStop(0.0, '#FFFFFF');
      goldTamil.addColorStop(0.3, '#FFE680');
      goldTamil.addColorStop(0.6, '#D4AF37');
      goldTamil.addColorStop(1.0, '#593800');

      ctx!.shadowBlur = 35;
      ctx!.shadowColor = 'rgba(255, 215, 0, 0.8)';
      ctx!.fillStyle = goldTamil;
      ctx!.fillText('பொங்கல் திருநாள் வாழ்த்துக்கள்', 0, 0);

      // ENGLISH TEXT (HAPPY PONGAL 2027)
      const fontSizeEng = Math.min(W * 0.05, 50);
      const cyEng = fontSizeTamil * 1.3;
      ctx!.font = `900 ${fontSizeEng}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 0;
      ctx!.strokeStyle = '#050100';
      ctx!.lineWidth = fontSizeEng * 0.1;
      ctx!.strokeText('HAPPY PONGAL 2027', 0, cyEng);

      const goldEng = ctx!.createLinearGradient(
        0,
        cyEng - fontSizeEng / 2,
        0,
        cyEng + fontSizeEng / 2
      );
      goldEng.addColorStop(0.0, '#FFFFFF');
      goldEng.addColorStop(0.4, '#FFD700');
      goldEng.addColorStop(0.8, '#B8860B');
      goldEng.addColorStop(1.0, '#2E1A00');

      ctx!.shadowBlur = 25;
      ctx!.shadowColor = 'rgba(255, 200, 0, 0.7)';
      ctx!.fillStyle = goldEng;
      ctx!.fillText('HAPPY PONGAL 2027', 0, cyEng);

      ctx!.restore();
    }

    // Update Particles Dynamic
    function updateAndDrawParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // Life Alpha Fade In/Out
        const progress = p.life / p.maxLife;
        if (progress < 0.2) p.alpha = (progress / 0.2) * p.maxAlpha;
        else if (progress > 0.8)
          p.alpha = ((1 - progress) / 0.2) * p.maxAlpha;
        else p.alpha = p.maxAlpha;

        ctx!.save();
        ctx!.globalAlpha = p.alpha;

        if (p.type === 'ember') {
          ctx!.globalCompositeOperation = 'lighter';
          ctx!.fillStyle = p.color;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fill();
        } else if (p.type === 'gold_dust') {
          ctx!.globalCompositeOperation = 'lighter';
          ctx!.fillStyle = p.color;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fill();
        } else if (p.type === 'smoke') {
          ctx!.translate(p.x, p.y);
          ctx!.rotate(p.rotation);
          p.rotation += p.rotSpeed;
          const smokeGlow = ctx!.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            p.size
          );
          smokeGlow.addColorStop(0, 'rgba(255, 240, 220, 0.15)');
          smokeGlow.addColorStop(1, 'rgba(255, 240, 220, 0)');
          ctx!.fillStyle = smokeGlow;
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.restore();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }
    }

    // Main Render Animation Loop
    function loop(now: number) {
      if (!running) return;
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;

      // Intro Finish Trigger at 12s
      if (t >= 12.0 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      ctx!.clearRect(0, 0, W, H);

      // Render Pipeline
      spawnGoldDust();

      drawScene1_HarvestCart(t);
      drawScene2_BoilingPot(t);
      drawScene3_Typography(t);

      updateAndDrawParticles();
      drawCinematicAtmosphere(t);

      rafId = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#050100] z-[99999] overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block bg-[#050100]" />
    </div>
  );
}
