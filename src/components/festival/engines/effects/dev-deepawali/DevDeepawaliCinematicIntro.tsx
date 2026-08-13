'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
}

const smoothstep = (a: number, b: number, t: number) => {
  if (b === a) return t < a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// High-performance particle system for Fireflies & Golden Sparks
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; life: number; maxLife: number; type: string;
}

export default function DevDeepawaliCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (!document.getElementById('dev-deepawali-fonts')) {
      const link = document.createElement('link');
      link.id = 'dev-deepawali-fonts';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let W = 0, H = 0, DPR = 1;
    let startTime = 0;
    let rafId = 0;
    let running = true;
    let handoverTriggered = false;
    let lastTime = 0;
    
    const particles: Particle[] = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = Math.floor(W * DPR);
      canvas!.height = Math.floor(H * DPR);
      ctx?.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    // Spawn Golden Particles & Fireflies continuously
    function spawnParticles(t: number) {
      if (t < 9.0 && particles.length < 150) {
        if (Math.random() < 0.4) {
          particles.push({
            x: Math.random() * W,
            y: H * 0.6 + Math.random() * H * 0.4,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.5 - Math.random() * 1.5,
            size: 1 + Math.random() * 2.5,
            alpha: 0,
            life: 0,
            maxLife: 100 + Math.random() * 150,
            type: Math.random() < 0.3 ? 'firefly' : 'gold',
          });
        }
      }
    }

    function updateAndDrawParticles(t: number) {
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter'; // Glowing effect

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        
        // Movement logic
        p.x += p.vx + Math.sin(t * 2 + p.y * 0.01) * 0.3;
        p.y += p.vy;

        const lifeRatio = p.life / p.maxLife;
        p.alpha = Math.sin(lifeRatio * Math.PI) * 0.8; // Fade in and out

        if (p.life >= p.maxLife || p.y < 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx!.globalAlpha = p.alpha;
        if (p.type === 'firefly') {
          ctx!.fillStyle = '#ffdd99';
        } else {
          ctx!.fillStyle = '#ffd700';
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    // =========================================================================
    // SCENE 1: VARANASI GHAT DAWN & FLOATING DIYAS (0.0s -> 9.0s)
    // =========================================================================
    function drawVaranasiGhatScene(t: number) {
      const vis = smoothstep(0.0, 1.2, t) * (1 - smoothstep(8.5, 9.5, t));
      if (vis <= 0.001) return;

      const s = Math.min(W, H) * 0.0022;
      const baseY = H * 0.72;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Deep River Night Sky
      const skyGrad = ctx!.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W);
      skyGrad.addColorStop(0.0, '#3a1805');
      skyGrad.addColorStop(0.5, '#1a0a02');
      skyGrad.addColorStop(1.0, '#050200');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // --- MIST LAYER (Fog at the bottom) ---
      ctx!.save();
      ctx!.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const mistX = W * 0.5 + Math.sin(t * 0.3 + i * 2) * W * 0.2;
        const mistY = baseY + 20 * s + i * 30 * s;
        const mistGrad = ctx!.createRadialGradient(mistX, mistY, 0, mistX, mistY, W * 0.4);
        mistGrad.addColorStop(0, `rgba(80, 50, 30, ${0.2 * vis})`);
        mistGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.fillStyle = mistGrad;
        ctx!.fillRect(0, mistY - 100 * s, W, 200 * s);
      }
      ctx!.restore();

      // Ganga Water Base
      const waterGrad = ctx!.createLinearGradient(0, baseY, 0, H);
      waterGrad.addColorStop(0.0, '#1c0a02');
      waterGrad.addColorStop(1.0, '#000000');
      ctx!.fillStyle = waterGrad;
      ctx!.fillRect(0, baseY, W, H - baseY);

      // --- RIVER REFLECTIONS (Shimmering lights on water) ---
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 25; i++) {
        const rx = W * 0.2 + Math.random() * W * 0.6;
        const ry = baseY + Math.random() * (H - baseY);
        const rw = 20 + Math.random() * 40;
        const rAlpha = (0.1 + Math.random() * 0.2) * vis * Math.sin(t * 5 + i);
        ctx!.fillStyle = `rgba(255, 150, 50, ${Math.abs(rAlpha)})`;
        ctx!.fillRect(rx, ry, rw, 2);
      }
      ctx!.restore();

      // --- GHAT LIGHT ROWS (Steps with Diyas) ---
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      for (let step = 0; step < 4; step++) {
        const stepY = baseY - step * 15 * s;
        const numDiyas = 15 - step * 2;
        for (let i = 0; i < numDiyas; i++) {
          const dx = W * 0.1 + (W * 0.8 / numDiyas) * i + Math.sin(t + i) * 2 * s;
          const dy = stepY;
          
          // Diya Glow
          const diyaGlow = ctx!.createRadialGradient(dx, dy, 0, dx, dy, 15 * s);
          diyaGlow.addColorStop(0, `rgba(255, 200, 80, ${0.8 * vis})`);
          diyaGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx!.fillStyle = diyaGlow;
          ctx!.beginPath();
          ctx!.arc(dx, dy, 15 * s, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.restore();

      // --- FLOATING TEMPLE LAMPS (Diyas on the water) ---
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) {
        const dx = (W * 0.1) + ((i * 55 * s + t * 15) % (W * 0.8));
        const dy = baseY + 20 * s + (i % 5) * 18 * s + Math.sin(t * 2 + i) * 3;

        // Diya Light Glow
        const diyaGlow = ctx!.createRadialGradient(dx, dy, 0, dx, dy, 25 * s);
        diyaGlow.addColorStop(0, 'rgba(255, 200, 80, 0.8)');
        diyaGlow.addColorStop(0.4, 'rgba(255, 100, 0, 0.3)');
        diyaGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.fillStyle = diyaGlow;
        ctx!.beginPath();
        ctx!.arc(dx, dy, 25 * s, 0, Math.PI * 2);
        ctx!.fill();

        // Diya Flame Core
        ctx!.fillStyle = '#ffffff';
        ctx!.beginPath();
        ctx!.arc(dx, dy - 2 * s, 3 * s, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2: 3D GOLDEN DEVANAGARI TEXT ("शुभ देव दीपावली") (8.5s -> 12.0s)
    // =========================================================================
    function drawDevDeepawaliText(t: number) {
      const vis = smoothstep(8.5, 9.5, t) * (1 - smoothstep(11.5, 12.0, t));
      if (vis <= 0.001) return;

      const scale = 0.92 + smoothstep(8.5, 10.5, t) * 0.08;
      const cx = W / 2;
      const cy = H * 0.44;
      const s = Math.min(W, H) * 0.0022;

      ctx!.save();
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.globalAlpha = vis;

      // Dark Luxury Background
      const darkGrad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.65);
      darkGrad.addColorStop(0, 'rgba(25, 10, 2, 0.96)');
      darkGrad.addColorStop(1, 'rgba(5, 1, 0, 0.99)');
      ctx!.fillStyle = darkGrad;
      ctx!.fillRect(0, 0, W, H);

      ctx!.translate(cx, cy);
      ctx!.scale(scale, scale);

      // 1. "शुभ देव दीपावली"
      const fontS1 = Math.min(W * 0.07, 62);
      ctx!.font = `700 ${fontS1}px "Tiro Devanagari Hindi", serif`;

      ctx!.strokeStyle = '#050200';
      ctx!.lineWidth = fontS1 * 0.08;
      ctx!.strokeText('शुभ देव दीपावली', 0, -25 * s);

      const goldText = ctx!.createLinearGradient(0, -25 * s - fontS1, 0, -25 * s);
      goldText.addColorStop(0.0, '#FFFDF0');
      goldText.addColorStop(0.3, '#FFD700');
      goldText.addColorStop(0.7, '#D4AF37');
      goldText.addColorStop(1.0, '#593800');

      ctx!.shadowBlur = 30;
      ctx!.shadowColor = 'rgba(255, 215, 0, 0.85)';
      ctx!.fillStyle = goldText;
      ctx!.fillText('शुभ देव दीपावली', 0, -25 * s);

      // 2. "HAPPY DEV DEEPAWALI 2027"
      const fontS2 = Math.min(W * 0.05, 46);
      const cyEng = 45 * s;
      ctx!.font = `900 ${fontS2}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 0;
      ctx!.strokeStyle = '#050200';
      ctx!.lineWidth = fontS2 * 0.08;
      ctx!.strokeText('HAPPY DEV DEEPAWALI 2027', 0, cyEng);

      const goldEng = ctx!.createLinearGradient(0, cyEng - fontS2 / 2, 0, cyEng + fontS2 / 2);
      goldEng.addColorStop(0.0, '#FFFFFF');
      goldEng.addColorStop(0.4, '#FFE680');
      goldEng.addColorStop(0.8, '#C68A00');
      goldEng.addColorStop(1.0, '#2E1A00');

      ctx!.shadowBlur = 25;
      ctx!.shadowColor = 'rgba(255, 200, 0, 0.75)';
      ctx!.fillStyle = goldEng;
      ctx!.fillText('HAPPY DEV DEEPAWALI 2027', 0, cyEng);

      ctx!.restore();
    }

    function render(t: number, dt: number) {
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx!.fillStyle = '#050200';
      ctx!.fillRect(0, 0, W, H);

      // 1. Draw Base Scene
      drawVaranasiGhatScene(t);
      
      // 2. Spawn and Draw Particles (Fireflies, Golden Sparks)
      spawnParticles(t);
      updateAndDrawParticles(t);

      // 3. Draw Text Overlay
      drawDevDeepawaliText(t);

      const fadeIn = 1 - smoothstep(0, 1.0, t);
      const fadeOut = smoothstep(11.5, 12.0, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx!.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx!.fillRect(0, 0, W, H);
      }
    }

    function loop(now: number) {
      if (!running) return;
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
      lastTime = now;

      if (t >= 11.5 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      if (t < 12.0) {
        render(t, dt);
      } else {
        ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx!.fillStyle = '#000000';
        ctx!.fillRect(0, 0, W, H);
      }
      rafId = requestAnimationFrame(loop);
    }

    document.fonts.ready.then(() => {
      resize();
      window.addEventListener('resize', resize);
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-[99999] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block bg-black" />
      <button
        onClick={() => onComplete?.()}
        className="absolute top-5 right-5 z-[100] px-4 py-2 rounded-full border border-amber-400/30 bg-black/40 text-amber-200 text-xs font-bold tracking-widest"
      >
        SKIP →
      </button>
    </div>
  );
}
