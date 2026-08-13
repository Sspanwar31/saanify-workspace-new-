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

interface Diya {
  x: number; y: number; size: number; vy: number; vx: number; flicker: number;
}

export default function DevDeepawaliCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (typeof document !== 'undefined' && !document.getElementById('dev-deepawali-fonts')) {
      const link = document.createElement('link');
      link.id = 'dev-deepawali-fonts';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap';
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

    const floatingDiyas: Diya[] = [];
    const goldParticles: { x: number; y: number; vy: number; size: number; alpha: number }[] = [];

    function resize() {
      if (!canvas) return;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function spawnParticles(t: number) {
      // Floating Diyas in the air
      if (t < 8.5 && floatingDiyas.length < 12 && Math.random() < 0.02) {
        floatingDiyas.push({
          x: Math.random() * W,
          y: H * 0.7 + Math.random() * 50,
          size: 15 + Math.random() * 20,
          vy: -0.3 - Math.random() * 0.4,
          vx: (Math.random() - 0.5) * 0.5,
          flicker: Math.random() * Math.PI * 2,
        });
      }

      // Golden Sparks
      if (t < 9.0 && goldParticles.length < 80 && Math.random() < 0.3) {
        goldParticles.push({
          x: Math.random() * W,
          y: H * 0.6 + Math.random() * H * 0.4,
          vy: -0.5 - Math.random() * 1.5,
          size: 1 + Math.random() * 2,
          alpha: 0,
        });
      }
    }

    // =========================================================================
    // SCENE 1: VARANASI GHAT NIGHT (0.0s -> 9.0s)
    // =========================================================================
    function drawGhatScene(t: number) {
      const vis = smoothstep(0.0, 1.2, t) * (1 - smoothstep(8.5, 9.5, t));
      if (vis <= 0.001) return;
      
      const baseY = H * 0.70; // Water level

      ctx.save();
      ctx.globalAlpha = vis;

      // 1. Deep River Night Sky
      const skyGrad = ctx.createRadialGradient(W * 0.5, baseY * 0.6, 0, W * 0.5, baseY * 0.6, W);
      skyGrad.addColorStop(0.0, '#4a1f06');
      skyGrad.addColorStop(0.4, '#1a0a02');
      skyGrad.addColorStop(1.0, '#000000');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Ganga Water Base
      const waterGrad = ctx.createLinearGradient(0, baseY, 0, H);
      waterGrad.addColorStop(0.0, '#1c0a02');
      waterGrad.addColorStop(1.0, '#000000');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, baseY, W, H - baseY);

      // 3. Moving River Reflections (Shimmer)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++) {
        const rx = W * 0.15 + Math.random() * W * 0.7;
        const ry = baseY + Math.random() * (H - baseY);
        const rw = 30 + Math.random() * 50;
        const rAlpha = (0.05 + Math.random() * 0.1) * vis * Math.abs(Math.sin(t * 3 + i));
        ctx.fillStyle = `rgba(255, 180, 80, ${rAlpha})`;
        ctx.fillRect(rx, ry, rw, 2);
      }
      ctx.restore();

      // 4. Ghat Steps with Diyas (Light Rows)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let step = 0; step < 4; step++) {
        const stepY = baseY - step * 18;
        const numDiyas = 15 - step * 2;
        for (let i = 0; i < numDiyas; i++) {
          const dx = W * 0.1 + (W * 0.8 / numDiyas) * i + Math.sin(t + i) * 4;
          const dy = stepY;
          const flicker = 0.8 + Math.sin(t * 10 + i + step) * 0.2;

          // Diya Glow
          const diyaGlow = ctx.createRadialGradient(dx, dy, 0, dx, dy, 25);
          diyaGlow.addColorStop(0, `rgba(255, 200, 80, ${0.8 * vis * flicker})`);
          diyaGlow.addColorStop(0.4, `rgba(255, 100, 0, ${0.3 * vis * flicker})`);
          diyaGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = diyaGlow;
          ctx.beginPath();
          ctx.arc(dx, dy, 25, 0, Math.PI * 2);
          ctx.fill();

          // Diya Flame Core
          ctx.fillStyle = `rgba(255, 255, 240, ${vis * flicker})`;
          ctx.beginPath();
          ctx.arc(dx, dy - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 5. Floating Diyas in the Air
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = floatingDiyas.length - 1; i >= 0; i--) {
        const d = floatingDiyas[i];
        d.x += d.vx + Math.sin(t * 2 + d.flicker) * 0.2;
        d.y += d.vy;
        d.flicker += 0.1;
        
        if (d.y < -50) {
          floatingDiyas.splice(i, 1);
          continue;
        }

        const flicker = 0.8 + Math.sin(d.flicker * 2) * 0.2;
        const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.size * 2);
        glow.addColorStop(0, `rgba(255, 220, 100, ${0.4 * vis * flicker})`);
        glow.addColorStop(0.5, `rgba(255, 140, 0, ${0.1 * vis * flicker})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 240, ${vis * flicker})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 6. Golden Particles (Fireflies)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = goldParticles.length - 1; i >= 0; i--) {
        const p = goldParticles[i];
        p.y += p.vy;
        p.alpha = Math.sin(t * 2 + i) * 0.5 + 0.5;
        
        if (p.y < 0) {
          goldParticles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.alpha * vis * 0.8;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.restore();
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

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = vis;

      // Dark Luxury Background for Text Focus
      const darkGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.65);
      darkGrad.addColorStop(0, 'rgba(25, 10, 2, 0.88)');
      darkGrad.addColorStop(1, 'rgba(5, 1, 0, 0.98)');
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // 1. "शुभ देव दीपावली"
      const fontS1 = Math.min(W * 0.07, 62);
      ctx.font = `700 ${fontS1}px "Tiro Devanagari Hindi", serif`;

      ctx.strokeStyle = '#050200';
      ctx.lineWidth = fontS1 * 0.08;
      ctx.strokeText('शुभ देव दीपावली', 0, -25 * s);

      const goldText = ctx.createLinearGradient(0, -25 * s - fontS1, 0, -25 * s);
      goldText.addColorStop(0.0, '#FFFDF0');
      goldText.addColorStop(0.3, '#FFD700');
      goldText.addColorStop(0.7, '#D4AF37');
      goldText.addColorStop(1.0, '#593800');

      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.85)';
      ctx.fillStyle = goldText;
      ctx.fillText('शुभ देव दीपावली', 0, -25 * s);

      // 2. "HAPPY DEV DEEPAWALI 2027"
      const fontS2 = Math.min(W * 0.05, 46);
      const cyEng = 45 * s;
      ctx.font = `900 ${fontS2}px "Cinzel", Georgia, serif`;

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#050200';
      ctx.lineWidth = fontS2 * 0.08;
      ctx.strokeText('HAPPY DEV DEEPAWALI 2027', 0, cyEng);

      const goldEng = ctx.createLinearGradient(0, cyEng - fontS2 / 2, 0, cyEng + fontS2 / 2);
      goldEng.addColorStop(0.0, '#FFFFFF');
      goldEng.addColorStop(0.4, '#FFE680');
      goldEng.addColorStop(0.8, '#C68A00');
      goldEng.addColorStop(1.0, '#2E1A00');

      ctx.shadowBlur = 25;
      ctx.shadowColor = 'rgba(255, 200, 0, 0.75)';
      ctx.fillStyle = goldEng;
      ctx.fillText('HAPPY DEV DEEPAWALI 2027', 0, cyEng);

      ctx.restore();
    }

    function render(t: number) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      spawnParticles(t);
      
      drawGhatScene(t);
      drawDevDeepawaliText(t);

      const fadeIn = 1 - smoothstep(0, 1.0, t);
      const fadeOut = smoothstep(11.5, 12.0, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx.fillRect(0, 0, W, H);
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
        render(t);
      } else {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
      }
      rafId = requestAnimationFrame(loop);
    }

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        resize();
        window.addEventListener('resize', resize);
        rafId = requestAnimationFrame(loop);
      });
    } else {
      resize();
      window.addEventListener('resize', resize);
      rafId = requestAnimationFrame(loop);
    }

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
