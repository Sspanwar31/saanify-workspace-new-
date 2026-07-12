'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; life: number; maxLife: number;
  r: number; g: number; b: number;
  alpha: number;
  rotation: number; rotSpeed: number;
  active: boolean;
  type: 'ambient' | 'petal' | 'spark';
}

interface Bell {
  x: number;
  length: number;
  angle: number;
  angleSpeed: number;
  lastBellTime: number;
}

export default function GaneshChaturthiCinematicIntro({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);
  
  const rafRef = useRef<number>(0);
  const t0Ref = useRef<number>(0);
  const doneRef = useRef<boolean>(false);
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;

  // घंटियों की आवाज़ सिंथेसाइज़ करने की विधि (Deep Temple Brass Bell Synthesizer)
  const triggerBellSound = (frequency: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const duration = 4.5; // Long echoing resonance
    const mainGain = ctx.createGain();
    mainGain.connect(ctx.destination);
    mainGain.gain.setValueAtTime(0, ctx.currentTime);
    mainGain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.015);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    // Auspicious temple bell harmonics
    const overtones = [1.0, 1.5, 1.98, 2.56, 3.12, 4.05];
    const volumes = [1.0, 0.55, 0.38, 0.22, 0.15, 0.08];

    overtones.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.frequency.setValueAtTime(frequency * ratio, ctx.currentTime);
      osc.type = i === 0 ? 'sine' : 'triangle';
      
      // Warm chorus detuning
      osc.detune.setValueAtTime(ratio * 5 - 10, ctx.currentTime);

      gainNode.gain.setValueAtTime(volumes[i], ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / (ratio * 0.85));

      osc.connect(gainNode);
      gainNode.connect(mainGain);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.2);
    });
  };

  const handleStartInteraction = () => {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        setAudioStarted(true);
        // Play an initial deep welcoming bell
        triggerBellSound(165); // Deep base bell (E3/F3 note)
      }
    }
  };

  useEffect(() => {
    if (!audioStarted) return; // Wait for user tap to start rendering beautifully

    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      cvs.width = W * dpr; cvs.height = H * dpr;
      cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // ── INITIALIZE PARTICLES ──
    const particles: Particle[] = [];
    const maxParticles = 350;

    const rn = (min: number, max: number) => min + Math.random() * (max - min);

    // ── INITIALIZE SWINGING BELLS (घंटियाँ) ──
    const bells: Bell[] = [
      { x: 0.22, length: 75, angle: 0.25, angleSpeed: 0, lastBellTime: 0 },
      { x: 0.50, length: 105, angle: -0.15, angleSpeed: 0, lastBellTime: 0 },
      { x: 0.78, length: 75, angle: 0.20, angleSpeed: 0, lastBellTime: 0 },
    ];

    // ── DRAWING DEITY SILHOUETTE (गणेश जी का भव्य रूप) ──
    const drawGaneshaAura = (c: CanvasRenderingContext2D, cx: number, cy: number, scale: number, opacity: number) => {
      c.save();
      c.translate(cx, cy);
      c.scale(scale, scale);
      c.globalAlpha = opacity;

      // Deep glowing Saffron and Gold Background
      const auraGlow = c.createRadialGradient(0, -10, 5, 0, -10, 85);
      auraGlow.addColorStop(0, 'rgba(251,191,36,0.35)');
      auraGlow.addColorStop(0.4, 'rgba(244,63,94,0.15)');
      auraGlow.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = auraGlow;
      c.beginPath(); c.arc(0, -10, 85, 0, Math.PI * 2); c.fill();

      // Seated Lotus Base (कमल का आसन)
      const lotusGlow = c.createLinearGradient(-45, 55, 45, 55);
      lotusGlow.addColorStop(0, 'rgba(220,38,38,0.85)');
      lotusGlow.addColorStop(0.5, 'rgba(244,63,94,0.9)');
      lotusGlow.addColorStop(1, 'rgba(220,38,38,0.85)');
      c.fillStyle = lotusGlow;
      c.shadowBlur = 15; c.shadowColor = '#f43f5e';
      c.beginPath();
      c.moveTo(-45, 55);
      c.bezierCurveTo(-55, 40, -25, 35, -20, 50);
      c.bezierCurveTo(-10, 35, 10, 35, 20, 50);
      c.bezierCurveTo(25, 35, 55, 40, 45, 55);
      c.closePath(); c.fill();

      // Body Silhouette (गहरे सोने का रंग)
      const bodyGlow = c.createLinearGradient(0, -50, 0, 50);
      bodyGlow.addColorStop(0, '#fcb524');
      bodyGlow.addColorStop(0.5, '#d97706');
      bodyGlow.addColorStop(1, '#854d0e');
      c.fillStyle = bodyGlow;
      c.shadowBlur = 20; c.shadowColor = 'rgba(251,191,36,0.5)';

      // 1. Ganesha Ears & Head
      c.beginPath();
      c.arc(0, -18, 20, 0, Math.PI * 2); // Head
      c.ellipse(-23, -20, 15, 11, -0.2, 0, Math.PI * 2); // Left Ear
      c.ellipse(23, -20, 15, 11, 0.2, 0, Math.PI * 2);  // Right Ear
      c.fill();

      // 2. Trunk & Belly (सूंड और पेट)
      c.beginPath();
      c.ellipse(0, 18, 26, 22, 0, 0, Math.PI * 2); // Huge Modak-loving Belly
      c.fill();

      // Trunk Path (सुंदर वक्र सूंड)
      c.beginPath();
      c.moveTo(-3, -15);
      c.bezierCurveTo(-14, 0, -16, 25, -22, 28);
      c.bezierCurveTo(-26, 30, -32, 22, -26, 16);
      c.bezierCurveTo(-20, 14, -20, 5, -8, -15);
      c.closePath(); c.fill();

      // 3. Crown (भव्य मुकुट)
      c.fillStyle = '#fef08a'; // Bright gold mukut
      c.beginPath();
      c.moveTo(-10, -35);
      c.lineTo(0, -56);
      c.lineTo(10, -35);
      c.bezierCurveTo(6, -30, -6, -35, -10, -35);
      c.fill();

      // 4. Forehead Tilak (पवित्र लाल तिलक)
      c.fillStyle = '#dc2626';
      c.beginPath();
      c.moveTo(-2, -28);
      c.quadraticCurveTo(0, -36, 2, -28);
      c.quadraticCurveTo(0, -22, -2, -28);
      c.fill();
      c.fillStyle = '#fbbf24';
      c.fillRect(-4, -25, 8, 1.2);

      c.restore();
    };

    // ── TEMPLE BELL RENDERING (गूँजती घंटियाँ) ──
    const drawBells = (c: CanvasRenderingContext2D, t: number) => {
      c.save();
      c.strokeStyle = 'rgba(251,191,36,0.45)';
      c.lineWidth = 1.2;

      bells.forEach((bell, idx) => {
        // Swing physics (sine oscillation)
        const swingFreq = 1.8 + idx * 0.35;
        bell.angle = Math.sin(t * swingFreq) * 0.18;

        const bx = bell.x * W;
        const by = 0;
        const ex = bx + Math.sin(bell.angle) * bell.length;
        const ey = by + Math.cos(bell.angle) * bell.length;

        // Draw Chain
        c.beginPath();
        c.moveTo(bx, by);
        c.lineTo(ex, ey);
        c.stroke();

        // Bell Body
        c.save();
        c.translate(ex, ey);
        c.rotate(bell.angle);

        // Clapper (घंटी का लोलक - जो अंदर बजता है)
        c.fillStyle = '#d97706';
        c.beginPath();
        c.arc(0, 18, 3.5, 0, Math.PI * 2);
        c.fill();

        // Authentic brass gradient
        const bGrad = c.createLinearGradient(-15, 0, 15, 15);
        bGrad.addColorStop(0, '#fef08a');
        bGrad.addColorStop(0.5, '#ca8a04');
        bGrad.addColorStop(1, '#854d0e');
        c.fillStyle = bGrad;
        c.strokeStyle = '#000000';
        c.lineWidth = 0.8;

        c.beginPath();
        c.moveTo(-5, 0);
        c.lineTo(-12, 14);
        c.quadraticCurveTo(-15, 17, -8, 17);
        c.lineTo(8, 17);
        c.quadraticCurveTo(15, 17, 12, 14);
        c.lineTo(5, 0);
        c.closePath();
        c.fill(); c.stroke();

        // Bell Dome Top
        c.beginPath();
        c.arc(0, 0, 5, 0, Math.PI * 2);
        c.fill(); c.stroke();

        c.restore();

        // ── SOUND SYNCHRONIZATION ──
        // Trigger a deep bell chime when the bell swings through the center point
        if (Math.abs(bell.angle) < 0.02 && t - bell.lastBellTime > 0.85) {
          bell.lastBellTime = t;
          const frequencies = [220, 165, 294]; // Deep A3, E3, D4 auspicious notes
          triggerBellSound(frequencies[idx]);
        }
      });

      c.restore();
    };

    // ── BACKGROUND GRADIENT (धूप और छांव) ──
    const drawBackground = (t: number) => {
      ctx.fillStyle = '#060309';
      ctx.fillRect(0, 0, W, H);

      const glowVal = eOC(Math.min(t / 2.5, 1)) * 0.7;

      // Divine Marigold Aura
      let g = ctx.createRadialGradient(W * 0.5, H * 0.44, 0, W * 0.5, H * 0.44, H * 0.8);
      g.addColorStop(0, `rgba(234,88,12,${glowVal * 0.28})`); // Saffron
      g.addColorStop(0.5, `rgba(146,14,35,${glowVal * 0.16})`); // Vermilion
      g.addColorStop(1, 'rgba(6,3,9,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    };

    /* ── ANIMATE FUNCTION ── */
    const animate = (ts: number) => {
      if (doneRef.current || !run) return;
      if (!t0Ref.current) t0Ref.current = ts;
      const t = (ts - t0Ref.current) / 1000;

      drawBackground(t);

      const cx = W / 2;
      const cy = H / 2 - H * 0.02;
      const scale = Math.min(W, H) * 0.0035;

      // ── RENDER LORD GANESHA (धड़कता हुआ दिव्य रूप) ──
      const fadeVal = Math.min(t / 2.0, 1.0);
      drawGaneshaAura(ctx, cx, cy, scale * (1 + Math.sin(t * 1.5) * 0.015), fadeVal);

      // ── THE MOVING AARTI PLATE (घूमती हुई आरती थाली) ──
      if (t > 1.0) {
        // Aarti dynamic orbit (perfect hand rotation motion)
        const aX = cx + Math.cos(t * 1.8) * 65;
        const aY = cy + 125 + Math.sin(t * 3.6) * 16;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Aarti Warm Radial Lighting Ray beams
        const rayGrad = ctx.createRadialGradient(aX, aY, 2, cx, cy, Math.max(W, H) * 0.7);
        rayGrad.addColorStop(0, 'rgba(251,191,36,0.22)');
        rayGrad.addColorStop(0.3, 'rgba(234,88,12,0.06)');
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rayGrad;
        
        // Draw Light rays sweeping across Ganesha
        ctx.beginPath();
        ctx.moveTo(aX, aY);
        ctx.lineTo(cx - 200, cy - 200);
        ctx.lineTo(cx + 200, cy - 200);
        ctx.closePath(); ctx.fill();

        // Physical Golden Diya on plate
        const dGlow = ctx.createRadialGradient(aX, aY, 0, aX, aY, 28);
        dGlow.addColorStop(0, '#ffffff');
        dGlow.addColorStop(0.2, '#facc15');
        dGlow.addColorStop(0.5, '#ea580c');
        dGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = dGlow;
        ctx.beginPath(); ctx.arc(aX, aY, 28, 0, Math.PI * 2); ctx.fill();

        // Flame inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(aX, aY - 4, 3, 7 + Math.random() * 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ── SPAWN DIVINE FLOWERS & SPARKLES (फूलों की दिव्य वर्षा) ──
      if (t > 0.5 && particles.length < maxParticles) {
        const rate = t < 2.0 ? 1 : 2;
        for (let i = 0; i < rate; i++) {
          const typeRand = Math.random();
          let tp: Particle['type'] = 'ambient';
          let r = 255, g = 200, b = 50;
          let size = rn(0.8, 2.2);

          if (typeRand < 0.6) {
            tp = 'petal';
            // Colorful marigold and red hibiscus flower petals
            const pColor = Math.random();
            if (pColor < 0.45) {
              r = 245; g = 158; b = 11; // Orange Marigold
            } else if (pColor < 0.8) {
              r = 234; g = 88; b = 12; // Saffron Yellow
            } else {
              r = 220; g = 38; b = 38; // Red Hibiscus/Rose
            }
            size = rn(6, 12);
          } else if (typeRand < 0.85) {
            tp = 'spark'; // Golden sparkles
            r = 254; g = 240; b = 138;
            size = rn(2, 5);
          }

          particles.push({
            x: rn(-20, W + 20),
            y: rn(-30, -5),
            vx: rn(-0.6, 0.6),
            vy: rn(1.1, 2.4),
            size,
            life: 0,
            maxLife: rn(250, 450),
            r, g, b,
            alpha: rn(0.65, 0.95),
            rotation: rn(0, Math.PI * 2),
            rotSpeed: rn(-0.02, 0.02),
            active: true,
            type: tp,
          });
        }
      }

      // ── UPDATE & DRAW FLOWERS ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // Sway flow
        if (p.type === 'petal') {
          p.vx += Math.sin(t * 1.5 + p.y * 0.01) * 0.025;
          p.rotation += p.rotSpeed;
        }

        const lt = p.life / p.maxLife;
        p.alpha = lt < 0.85 ? 1 : (1 - lt) / 0.15;

        if (p.life >= p.maxLife || p.y > H + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha * fadeVal;

        if (p.type === 'petal') {
          // Draw detailed vector flower petals
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          
          const petalGrad = ctx.createLinearGradient(0, -p.size, 0, p.size);
          petalGrad.addColorStop(0, `rgb(${p.r},${p.g},${p.b})`);
          petalGrad.addColorStop(1, `rgb(${Math.max(0, p.r - 40)},${Math.max(0, p.g - 35)},${Math.max(0, p.b - 20)})`);
          ctx.fillStyle = petalGrad;

          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.45, p.size, 0, 0, Math.PI * 2);
          ctx.fill();

          // Petal texture center line
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.beginPath();
          ctx.ellipse(-p.size * 0.05, -p.size * 0.2, p.size * 0.1, p.size * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Twinkling stars / sparkles
          ctx.translate(p.x, p.y);
          ctx.rotate(t * 1.5);
          ctx.strokeStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = p.size * 2;
          ctx.shadowColor = `rgb(${p.r},${p.g},${p.b})`;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0); ctx.lineTo(p.size, 0);
          ctx.moveTo(0, -p.size); ctx.lineTo(0, p.size);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── DRAW SWINGING BELLS (गूँजती घंटियाँ) ──
      drawBells(ctx, t);

      // ── DRAW TEXT AND MANTRAS (Phase 3) ──
      if (t > 4.5) {
        const textFade = Math.min((t - 4.5) / 1.5, 1.0);
        ctx.save();
        ctx.globalAlpha = textFade;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const ty = H * 0.33;
        const ts = Math.min(W * 0.065, 52);
        
        ctx.font = `800 ${ts}px "Georgia", serif`;
        ctx.letterSpacing = `${ts * 0.015}px`;

        // Golden metallic text gradient
        const tG = ctx.createLinearGradient(W/2 - 250, ty - ts/2, W/2 + 250, ty + ts/2);
        tG.addColorStop(0, '#8b6914');
        tG.addColorStop(0.2, '#ca8a04');
        tG.addColorStop(0.5, '#fef08a');
        tG.addColorStop(0.8, '#daa520');
        tG.addColorStop(1, '#8b6914');

        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = tG;
        ctx.fillText("Happy Ganesh Chaturthi", W/2, ty);

        // Sanskrit Shlokas
        const ss = Math.min(W * 0.024, 18);
        ctx.font = `300 ${ss}px "Inter", system-ui, sans-serif`;
        ctx.letterSpacing = `${ss * 0.22}px`;
        ctx.fillStyle = 'rgba(254,240,138,0.7)'; // Warm pastel gold
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(251,191,36,0.3)';

        ctx.fillText("वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।", W/2, ty + ts * 1.15);
        ctx.fillText("निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥", W/2, ty + ts * 1.15 + ss * 2);

        ctx.restore();
      }

      // ── FADE OUT TRANSITION ──
      if (t > 11.0) {
        const outP = Math.min((t - 11.0) / 1.0, 1.0);
        ctx.fillStyle = `rgba(8, 4, 10, ${outP})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (t < DUR) {
        rafRef.current = requestAnimationFrame(animate);
      } else if (!doneRef.current) {
        doneRef.current = true;
        cbRef.current?.();
      }
    };

    let run = true;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      run = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [audioStarted, initPool, grab]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#08040a]">
      {/* ── DIVINE INTERACTION PROMPT ── */}
      {!audioStarted ? (
        <button
          onClick={handleStartInteraction}
          className="relative px-12 py-5 rounded-full overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_15px_40px_rgba(251,191,36,0.22)] flex flex-col items-center gap-3"
        >
          {/* Glowing Divine Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/25 via-red-500/25 to-yellow-500/25 rounded-full animate-pulse border border-yellow-500/30" />
          
          <span className="relative z-10 text-sm font-semibold tracking-[0.25em] uppercase text-yellow-100 animate-bounce">
            Touch To Begin Aarti
          </span>
          <span className="relative z-10 text-[10px] tracking-[0.1em] text-yellow-500/60 uppercase">
            वक्रतुण्ड महाकाय
          </span>
        </button>
      ) : (
        <canvas ref={canvasRef} className="block w-full h-full" />
      )}
    </div>
  );
}
