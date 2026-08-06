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

    // Load fonts smoothly without blocking animation
    if (!document.getElementById('pongal-google-font')) {
      const link = document.createElement('link');
      link.id = 'pongal-google-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Sans+Tamil:wght@700;900&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, DPR = 1;
    let startTime = 0;
    let rafId = 0;
    let running = true;
    let handoverTriggered = false;

    // Particles Array
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; type: 'spark' | 'petal' | 'steam';
      rot: number; rotSpd: number;
    }> = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx?.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    const smoothstep = (a: number, b: number, t: number) => {
      const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
      return x * x * (3 - 2 * x);
    };

    // Spawn Particles
    function spawnParticles(t: number) {
      if (t > 1.0 && t < 10.0 && Math.random() < 0.4) {
        // Golden Embers
        particles.push({
          x: Math.random() * W,
          y: H + 10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -1.5 - Math.random() * 2.0,
          size: 1.5 + Math.random() * 3,
          alpha: 0.3 + Math.random() * 0.7,
          type: 'spark',
          rot: 0, rotSpd: 0
        });
      }
      if (t > 2.5 && t < 10.0 && Math.random() < 0.25) {
        // Marigold Petals
        particles.push({
          x: Math.random() * W,
          y: -20,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1.0 + Math.random() * 1.8,
          size: 5 + Math.random() * 5,
          alpha: 0.4 + Math.random() * 0.6,
          type: 'petal',
          rot: Math.random() * Math.PI * 2,
          rotSpd: (Math.random() - 0.5) * 0.08
        });
      }
    }

    // 🌟 1. DAWN SUNBURST & VOLUMETRIC GOD RAYS (0s - 4s)
    function drawDawnSky(t: number) {
      const vis = smoothstep(0, 1.2, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      // Deep Sunrise Gradient
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#100401');
      skyGrad.addColorStop(0.4, '#3d1204');
      skyGrad.addColorStop(0.7, '#853209');
      skyGrad.addColorStop(1, '#1a0802');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // Central Sunburst Lens Flare
      const cx = W / 2, cy = H * 0.45;
      const sunR = Math.min(W, H) * 0.25 * smoothstep(0, 3, t);

      ctx!.save();
      ctx!.globalCompositeOperation = 'screen';
      ctx!.globalAlpha = vis;

      const sunGrad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, sunR * 2));
      sunGrad.addColorStop(0, 'rgba(255, 245, 200, 0.9)');
      sunGrad.addColorStop(0.3, 'rgba(255, 140, 30, 0.5)');
      sunGrad.addColorStop(0.7, 'rgba(180, 50, 10, 0.2)');
      sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = sunGrad;
      ctx!.fillRect(0, 0, W, H);

      // Rotating Sun Beams
      const beamCount = 16;
      ctx!.translate(cx, cy);
      ctx!.rotate(t * 0.05);
      for (let i = 0; i < beamCount; i++) {
        const angle = (i / beamCount) * Math.PI * 2;
        ctx!.beginPath();
        ctx!.moveTo(0, 0);
        ctx!.arc(0, 0, W * 0.8, angle - 0.08, angle + 0.08);
        ctx!.closePath();
        ctx!.fillStyle = `rgba(255, 200, 100, ${0.04 * vis})`;
        ctx!.fill();
      }
      ctx!.restore();
    }

    // 🌟 2. ROYAL GOLDEN PONGAL VESSEL (3s - 7s)
    function drawGoldenVessel(t: number) {
      const vis = smoothstep(2.5, 3.8, t) * (1 - smoothstep(6.5, 7.5, t));
      if (vis <= 0.001) return;

      const scale = smoothstep(2.5, 4.0, t);
      const cx = W / 2;
      const cy = H * 0.48;
      const r = Math.min(W, H) * 0.18 * scale;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Outer Aura
      const aura = ctx!.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.2);
      aura.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      aura.addColorStop(0.6, 'rgba(234, 88, 12, 0.15)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = aura;
      ctx!.fillRect(0, 0, W, H);

      // Metallic Pot Shading
      const potGrad = ctx!.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      potGrad.addColorStop(0, '#FFFDF0');
      potGrad.addColorStop(0.25, '#FFD700');
      potGrad.addColorStop(0.5, '#D4AF37');
      potGrad.addColorStop(0.75, '#996515');
      potGrad.addColorStop(1, '#4A2505');

      // Pot Silhouette
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, Math.PI * 2);
      ctx!.fillStyle = potGrad;
      ctx!.shadowBlur = 30;
      ctx!.shadowColor = '#FFD700';
      ctx!.fill();

      // Pot Neck & Rim
      ctx!.beginPath();
      ctx!.ellipse(cx, cy - r * 0.85, r * 0.75, r * 0.25, 0, 0, Math.PI * 2);
      ctx!.fillStyle = '#FFF5C0';
      ctx!.fill();
      ctx!.strokeStyle = '#996515';
      ctx!.lineWidth = 4;
      ctx!.stroke();

      // Glowing Froth Overflow Effect (Milk Boiling Over)
      if (t > 4.2) {
        const overflowVis = smoothstep(4.2, 5.0, t);
        ctx!.globalCompositeOperation = 'screen';
        const frothGrad = ctx!.createRadialGradient(cx, cy - r * 0.85, 0, cx, cy - r * 0.85, r * 1.1);
        frothGrad.addColorStop(0, `rgba(255, 255, 240, ${0.9 * overflowVis})`);
        frothGrad.addColorStop(0.5, `rgba(255, 215, 0, ${0.6 * overflowVis})`);
        frothGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx!.fillStyle = frothGrad;
        ctx!.beginPath();
        ctx!.arc(cx, cy - r * 0.85, r * 1.1, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.restore();
    }

    // 🌟 3. SUGARCANE SILHOUETTE FRAMING (Left & Right Sides)
    function drawSugarcaneFrame(t: number) {
      const vis = smoothstep(1.0, 2.5, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis * 0.85;

      // Dark Sugarcane Stalks on Left & Right
      const drawStalks = (sideLeft: boolean) => {
        const baseX = sideLeft ? W * 0.08 : W * 0.92;
        const dir = sideLeft ? 1 : -1;
        
        ctx!.strokeStyle = '#120602';
        ctx!.lineWidth = Math.min(W, H) * 0.02;
        ctx!.lineCap = 'round';
        
        ctx!.beginPath();
        ctx!.moveTo(baseX, H + 20);
        ctx!.quadraticCurveTo(baseX + 40 * dir, H * 0.5, baseX + 10 * dir, -20);
        ctx!.stroke();

        // Sugarcane Leaves (Top Arch)
        ctx!.fillStyle = '#1c0a03';
        for (let i = 0; i < 5; i++) {
          const ly = H * 0.2 + i * 60;
          ctx!.beginPath();
          ctx!.moveTo(baseX + (i * 5) * dir, ly);
          ctx!.quadraticCurveTo(baseX + 120 * dir, ly - 30, baseX + 180 * dir, ly + 80);
          ctx!.quadraticCurveTo(baseX + 100 * dir, ly + 20, baseX + (i * 5) * dir, ly);
          ctx!.fill();
        }
      };

      drawStalks(true);  // Left
      drawStalks(false); // Right

      ctx!.restore();
    }

    // 🌟 4. CINEMATIC 3D GOLDEN TYPOGRAPHY (7s - 11s)
    function drawTypography(t: number) {
      const vis = smoothstep(6.8, 8.0, t) * (1 - smoothstep(10.5, 11.5, t));
      if (vis <= 0.001) return;

      const scale = 0.9 + smoothstep(6.8, 8.5, t) * 0.1;

      ctx!.save();
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.globalAlpha = vis;

      // Dark Backdrop Glow for Text Contrast
      const textGlow = ctx!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.4);
      textGlow.addColorStop(0, 'rgba(0,0,0,0.85)');
      textGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = textGlow;
      ctx!.fillRect(0, 0, W, H);

      ctx!.translate(W / 2, H * 0.44);
      ctx!.scale(scale, scale);

      // ── TAMIL TEXT (இனிய பொங்கல் நல்வாழ்த்துக்கள்) ──
      const fontSizeTamil = Math.min(W * 0.075, 72);
      ctx!.font = `900 ${fontSizeTamil}px "Noto Sans Tamil", sans-serif, serif`;

      // Text Shadow 3D
      ctx!.strokeStyle = '#0f0501';
      ctx!.lineWidth = fontSizeTamil * 0.12;
      ctx!.strokeText('இனிய பொங்கல் நல்வாழ்த்துக்கள்', 0, 0);

      // Golden Gradient
      const goldTamil = ctx!.createLinearGradient(0, -fontSizeTamil / 2, 0, fontSizeTamil / 2);
      goldTamil.addColorStop(0.0, '#FFFDF0');
      goldTamil.addColorStop(0.3, '#FFD700');
      goldTamil.addColorStop(0.6, '#D4AF37');
      goldTamil.addColorStop(1.0, '#7A4a00');

      ctx!.shadowBlur = 25;
      ctx!.shadowColor = '#FFD700';
      ctx!.fillStyle = goldTamil;
      ctx!.fillText('இனிய பொங்கல் நல்வாழ்த்துக்கள்', 0, 0);

      // ── ENGLISH TEXT (Happy Pongal 2027) ──
      const fontSizeEng = Math.min(W * 0.055, 52);
      const cyEng = fontSizeTamil * 1.2;
      ctx!.font = `900 ${fontSizeEng}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 0;
      ctx!.strokeStyle = '#0f0501';
      ctx!.lineWidth = fontSizeEng * 0.1;
      ctx!.strokeText('HAPPY PONGAL 2027', 0, cyEng);

      const goldEng = ctx!.createLinearGradient(0, cyEng - fontSizeEng / 2, 0, cyEng + fontSizeEng / 2);
      goldEng.addColorStop(0.0, '#FFFFFF');
      goldEng.addColorStop(0.4, '#FFE57F');
      goldEng.addColorStop(0.8, '#C68A00');
      goldEng.addColorStop(1.0, '#4A2800');

      ctx!.shadowBlur = 20;
      ctx!.shadowColor = 'rgba(255, 215, 0, 0.8)';
      ctx!.fillStyle = goldEng;
      ctx!.fillText('HAPPY PONGAL 2027', 0, cyEng);

      ctx!.restore();
    }

    // Draw Particles
    function drawParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'spark') {
          ctx!.save();
          ctx!.globalCompositeOperation = 'lighter';
          ctx!.globalAlpha = p.alpha;
          ctx!.fillStyle = '#FFD700';
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        } else if (p.type === 'petal') {
          p.rot += p.rotSpd;
          ctx!.save();
          ctx!.globalAlpha = p.alpha;
          ctx!.translate(p.x, p.y);
          ctx!.rotate(p.rot);
          ctx!.fillStyle = Math.random() < 0.5 ? '#FF9900' : '#FFCC00';
          ctx!.beginPath();
          ctx!.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        }

        if (p.y < -30 || p.y > H + 30 || p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }
    }

    // Main Loop
    function loop(now: number) {
      if (!running) return;
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;

      // Handover trigger at 11 seconds
      if (t >= 11.0 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      ctx!.clearRect(0, 0, W, H);

      spawnParticles(t);
      drawDawnSky(t);
      drawSugarcaneFrame(t);
      drawGoldenVessel(t);
      drawParticles();
      drawTypography(t);

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
    <div className="fixed inset-0 w-full h-full bg-[#0a0301] z-[99999]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#0a0301]"
      />
    </div>
  );
}
