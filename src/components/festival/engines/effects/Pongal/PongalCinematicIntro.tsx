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

    // Load Tamil & English Elegant Fonts asynchronously
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

    // Particle System
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; type: 'ember' | 'petal' | 'bird' | 'kite';
      rot: number; rotSpd: number; color: string;
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

    // =========================================================================
    // SCENE 1: HARVEST & BULLOCK CART (0.0s -> 3.5s) - [Screenshot 1]
    // =========================================================================
    function drawScene1_HarvestCart(t: number) {
      const vis = smoothstep(0.0, 0.8, t) * (1 - smoothstep(3.0, 3.5, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Golden Dawn Sky
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0.0, '#0c0301');
      skyGrad.addColorStop(0.3, '#591a05');
      skyGrad.addColorStop(0.6, '#d95816');
      skyGrad.addColorStop(0.85, '#f2a338');
      skyGrad.addColorStop(1.0, '#2b1402');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // Sunrise Lens Flare
      const sunX = W * 0.7, sunY = H * 0.45;
      const sunGlow = ctx!.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.5);
      sunGlow.addColorStop(0, 'rgba(255, 245, 200, 0.9)');
      sunGlow.addColorStop(0.3, 'rgba(255, 140, 30, 0.5)');
      sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = sunGlow;
      ctx!.fillRect(0, 0, W, H);

      // Flying Birds V-Formation
      ctx!.fillStyle = '#220801';
      for (let i = 0; i < 5; i++) {
        const bx = W * 0.2 + (t * 60) + i * 25;
        const by = H * 0.25 + Math.sin(t * 3 + i) * 10 - i * 12;
        ctx!.beginPath();
        ctx!.moveTo(bx, by);
        ctx!.quadraticCurveTo(bx - 10, by - 8, bx - 18, by - 2);
        ctx!.quadraticCurveTo(bx - 8, by + 2, bx, by);
        ctx!.quadraticCurveTo(bx + 8, by + 2, bx + 18, by - 2);
        ctx!.quadraticCurveTo(bx + 10, by - 8, bx, by);
        ctx!.fill();
      }

      // Golden Sugarcane Crop Fields
      ctx!.fillStyle = '#140801';
      ctx!.beginPath();
      ctx!.moveTo(0, H);
      ctx!.quadraticCurveTo(W * 0.4, H * 0.65, W * 0.7, H * 0.75);
      ctx!.quadraticCurveTo(W * 0.9, H * 0.8, W, H * 0.7);
      ctx!.lineTo(W, H);
      ctx!.closePath();
      ctx!.fill();

      // Bullock Cart Illustration (Moving Left to Right)
      const cartX = W * 0.15 + (t * 80);
      const cartY = H * 0.78;
      const wheelR = Math.min(W, H) * 0.08;

      ctx!.save();
      ctx!.translate(cartX, cartY);

      // Cart Wooden Body
      ctx!.fillStyle = '#3a1805';
      ctx!.fillRect(-wheelR * 1.5, -wheelR * 0.8, wheelR * 3, wheelR * 0.6);

      // Harvest Sugarcane Bundle Bags
      ctx!.fillStyle = '#c28527';
      ctx!.beginPath();
      ctx!.ellipse(-wheelR * 0.8, -wheelR * 1.3, wheelR * 0.6, wheelR * 0.5, 0, 0, Math.PI * 2);
      ctx!.ellipse(0, -wheelR * 1.4, wheelR * 0.7, wheelR * 0.6, 0, 0, Math.PI * 2);
      ctx!.ellipse(wheelR * 0.8, -wheelR * 1.2, wheelR * 0.5, wheelR * 0.5, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Rotating Wooden Wheel
      ctx!.save();
      ctx!.translate(0, 0);
      ctx!.rotate(t * 3);
      ctx!.strokeStyle = '#240e02';
      ctx!.lineWidth = 6;
      ctx!.beginPath();
      ctx!.arc(0, 0, wheelR, 0, Math.PI * 2);
      ctx!.stroke();

      // Spokes
      for (let s = 0; s < 8; s++) {
        const angle = (s / 8) * Math.PI * 2;
        ctx!.beginPath();
        ctx!.moveTo(0, 0);
        ctx!.lineTo(Math.cos(angle) * wheelR, Math.sin(angle) * wheelR);
        ctx!.stroke();
      }
      ctx!.restore();

      ctx!.restore();
      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2: VILLAGE HOUSE, KOLAM & BOILING POT (3.5s -> 7.0s) - [Screenshot 2 & 5]
    // =========================================================================
    function drawScene2_CourtyardPot(t: number) {
      const vis = smoothstep(3.2, 4.0, t) * (1 - smoothstep(6.5, 7.0, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Courtyard Ground Background
      const groundGrad = ctx!.createRadialGradient(W * 0.5, H * 0.75, 0, W * 0.5, H * 0.75, W * 0.8);
      groundGrad.addColorStop(0, '#3d1d0c');
      groundGrad.addColorStop(0.6, '#1f0a03');
      groundGrad.addColorStop(1, '#0a0301');
      ctx!.fillStyle = groundGrad;
      ctx!.fillRect(0, 0, W, H);

      // Traditional Tile Roof House Silhouette in Background
      ctx!.fillStyle = '#1c0903';
      ctx!.beginPath();
      ctx!.moveTo(W * 0.1, H * 0.45);
      ctx!.lineTo(W * 0.5, H * 0.2);
      ctx!.lineTo(W * 0.9, H * 0.45);
      ctx!.lineTo(W * 0.85, H * 0.65);
      ctx!.lineTo(W * 0.15, H * 0.65);
      ctx!.closePath();
      ctx!.fill();

      // Festive Mango Leaf Garlands (Toran)
      ctx!.strokeStyle = '#2e6b12';
      ctx!.lineWidth = 3;
      ctx!.beginPath();
      ctx!.moveTo(W * 0.15, H * 0.45);
      ctx!.quadraticCurveTo(W * 0.5, H * 0.52, W * 0.85, H * 0.45);
      ctx!.stroke();

      // Colorful Floor Kolam (Rangoli Pattern)
      const kx = W * 0.5, ky = H * 0.82;
      const kr = Math.min(W, H) * 0.22;

      ctx!.save();
      ctx!.translate(kx, ky);
      ctx!.scale(1, 0.4); // Perspective Tilt

      const kolamColors = ['#e63946', '#ffd166', '#06d6a0', '#ffffff'];
      for (let ring = 4; ring >= 1; ring--) {
        ctx!.fillStyle = kolamColors[ring % kolamColors.length];
        ctx!.beginPath();
        ctx!.arc(0, 0, (kr / 4) * ring, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();

      // Clay Stove & Earthen Pongal Pot
      const potX = W * 0.5, potY = H * 0.62;
      const pr = Math.min(W, H) * 0.12;

      // Clay Pot Shading
      const potGrad = ctx!.createRadialGradient(potX - pr * 0.3, potY - pr * 0.3, pr * 0.1, potX, potY, pr);
      potGrad.addColorStop(0, '#d97736');
      potGrad.addColorStop(0.5, '#7a3311');
      potGrad.addColorStop(1, '#2b0f02');
      ctx!.fillStyle = potGrad;
      ctx!.beginPath();
      ctx!.arc(potX, potY, pr, 0, Math.PI * 2);
      ctx!.fill();

      // Pot Neck & Rim
      ctx!.fillStyle = '#ffeedd';
      ctx!.beginPath();
      ctx!.ellipse(potX, potY - pr * 0.85, pr * 0.8, pr * 0.2, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Fire Flame underneath
      ctx!.globalCompositeOperation = 'lighter';
      const flicker = 0.8 + Math.sin(t * 20) * 0.2;
      const fireGrad = ctx!.createRadialGradient(potX, potY + pr * 0.9, 0, potX, potY + pr * 0.9, pr * 0.8);
      fireGrad.addColorStop(0, `rgba(255, 240, 150, ${0.9 * flicker})`);
      fireGrad.addColorStop(0.4, `rgba(255, 100, 0, ${0.6 * flicker})`);
      fireGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = fireGrad;
      ctx!.beginPath();
      ctx!.arc(potX, potY + pr * 0.9, pr * 0.8, 0, Math.PI * 2);
      ctx!.fill();

      // Boiling Milk Overflow
      if (t > 4.5) {
        const milkVis = smoothstep(4.5, 5.5, t);
        const milkGrad = ctx!.createRadialGradient(potX, potY - pr * 0.85, 0, potX, potY - pr * 0.85, pr * 1.1);
        milkGrad.addColorStop(0, `rgba(255, 255, 250, ${0.95 * milkVis})`);
        milkGrad.addColorStop(0.6, `rgba(255, 220, 120, ${0.7 * milkVis})`);
        milkGrad.addColorStop(1, 'rgba(255, 120, 0, 0)');
        ctx!.fillStyle = milkGrad;
        ctx!.beginPath();
        ctx!.arc(potX, potY - pr * 0.85, pr * 1.1, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 3: BANANA LEAF COMMUNITY FEAST (7.0s -> 10.0s) - [Screenshot 3]
    // =========================================================================
    function drawScene3_Feast(t: number) {
      const vis = smoothstep(6.8, 7.5, t) * (1 - smoothstep(9.5, 10.0, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Wooden Courtyard Flooring Background
      const woodGrad = ctx!.createLinearGradient(0, 0, W, H);
      woodGrad.addColorStop(0, '#2d1508');
      woodGrad.addColorStop(0.5, '#45210e');
      woodGrad.addColorStop(1, '#1b0a03');
      ctx!.fillStyle = woodGrad;
      ctx!.fillRect(0, 0, W, H);

      // Circular Arrangement of Green Banana Leaves
      const cx = W / 2, cy = H * 0.52;
      const radius = Math.min(W, H) * 0.3;
      const leafCount = 6;

      ctx!.save();
      ctx!.translate(cx, cy);

      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 2;
        const lx = Math.cos(angle) * radius;
        const ly = Math.sin(angle) * radius * 0.6;

        ctx!.save();
        ctx!.translate(lx, ly);
        ctx!.rotate(angle + Math.PI / 2);

        // Fresh Green Banana Leaf Shape
        ctx!.fillStyle = '#228b22';
        ctx!.beginPath();
        ctx!.ellipse(0, 0, 45, 80, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.strokeStyle = '#1e7b1e';
        ctx!.lineWidth = 2;
        ctx!.stroke();

        // Food Items on Leaf (Sweet Pongal Rice, Vada, Chutney, Sweets)
        // White Sweet Rice
        ctx!.fillStyle = '#fffdf0';
        ctx!.beginPath();
        ctx!.arc(0, 10, 18, 0, Math.PI * 2);
        ctx!.fill();

        // Ghee spot on Rice
        ctx!.fillStyle = '#ffd700';
        ctx!.beginPath();
        ctx!.arc(0, 10, 6, 0, Math.PI * 2);
        ctx!.fill();

        // Crispy Vada
        ctx!.fillStyle = '#c67d0a';
        ctx!.beginPath();
        ctx!.arc(-18, -15, 10, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = '#228b22'; // hole
        ctx!.beginPath();
        ctx!.arc(-18, -15, 3, 0, Math.PI * 2);
        ctx!.fill();

        // Chutney Spot
        ctx!.fillStyle = '#e63946';
        ctx!.beginPath();
        ctx!.arc(18, -15, 8, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.restore();
      }

      ctx!.restore();
      ctx!.restore();
    }

    // =========================================================================
    // SCENE 4: SUNSET BONFIRE & KITE FESTIVAL (10.0s -> 13.5s) - [Screenshot 4 & 6]
    // =========================================================================
    function drawScene4_BonfireKites(t: number) {
      const vis = smoothstep(9.8, 10.5, t) * (1 - smoothstep(13.0, 13.5, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Sunset Dusk Sky Gradient
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0.0, '#1a052e');
      skyGrad.addColorStop(0.4, '#7a1c3d');
      skyGrad.addColorStop(0.7, '#e85d04');
      skyGrad.addColorStop(1.0, '#faa307');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // Sunset Sun on Horizon
      ctx!.fillStyle = '#fff3b0';
      ctx!.beginPath();
      ctx!.arc(W * 0.5, H * 0.65, Math.min(W, H) * 0.12, 0, Math.PI * 2);
      ctx!.fill();

      // Ground Silhouette
      ctx!.fillStyle = '#10020d';
      ctx!.fillRect(0, H * 0.65, W, H * 0.35);

      // Flying Colorful Kites in the Sky
      const kites = [
        { x: W * 0.2, y: H * 0.25, color: '#e63946', size: 25 },
        { x: W * 0.75, y: H * 0.2, color: '#ffd166', size: 30 },
        { x: W * 0.5, y: H * 0.15, color: '#06d6a0', size: 22 },
        { x: W * 0.85, y: H * 0.35, color: '#118ab2', size: 28 },
      ];

      for (const k of kites) {
        const kx = k.x + Math.sin(t * 2 + k.size) * 15;
        const ky = k.y + Math.cos(t * 1.5 + k.size) * 10;

        ctx!.save();
        ctx!.translate(kx, ky);
        ctx!.rotate(Math.sin(t * 2 + k.size) * 0.15);

        // Diamond Kite Shape
        ctx!.fillStyle = k.color;
        ctx!.beginPath();
        ctx!.moveTo(0, -k.size);
        ctx!.lineTo(k.size * 0.7, 0);
        ctx!.lineTo(0, k.size);
        ctx!.lineTo(-k.size * 0.7, 0);
        ctx!.closePath();
        ctx!.fill();

        // Kite Tail Thread
        ctx!.strokeStyle = '#ffffff';
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(0, k.size);
        ctx!.quadraticCurveTo(15, k.size + 20, 5, k.size + 40);
        ctx!.stroke();

        ctx!.restore();
      }

      // Bhogi Bonfire in Center
      const fireX = W * 0.5, fireY = H * 0.75;

      ctx!.globalCompositeOperation = 'lighter';
      const fireFlicker = 0.85 + Math.sin(t * 25) * 0.15;
      const bonfireGlow = ctx!.createRadialGradient(fireX, fireY, 0, fireX, fireY, Math.min(W, H) * 0.25);
      bonfireGlow.addColorStop(0, `rgba(255, 220, 100, ${0.95 * fireFlicker})`);
      bonfireGlow.addColorStop(0.4, `rgba(255, 80, 0, ${0.7 * fireFlicker})`);
      bonfireGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = bonfireGlow;
      ctx!.beginPath();
      ctx!.arc(fireX, fireY, Math.min(W, H) * 0.25, 0, Math.PI * 2);
      ctx!.fill();

      // Fire Embers
      if (Math.random() < 0.6) {
        particles.push({
          x: fireX + (Math.random() - 0.5) * 40,
          y: fireY,
          vx: (Math.random() - 0.5) * 2,
          vy: -2 - Math.random() * 3,
          size: 2 + Math.random() * 3,
          alpha: 1,
          type: 'ember',
          rot: 0, rotSpd: 0,
          color: '#ffd700'
        });
      }

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 5: GRAND 3D GOLDEN TYPOGRAPHY REVEAL (13.5s -> 17.5s)
    // =========================================================================
    function drawScene5_Typography(t: number) {
      const vis = smoothstep(13.2, 14.2, t) * (1 - smoothstep(17.0, 17.5, t));
      if (vis <= 0.001) return;

      const scale = 0.92 + smoothstep(13.2, 15.0, t) * 0.08;

      ctx!.save();
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.globalAlpha = vis;

      // Dark Festive Luxury Background Backdrop
      const darkGrad = ctx!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
      darkGrad.addColorStop(0, 'rgba(15, 5, 2, 0.95)');
      darkGrad.addColorStop(1, 'rgba(5, 1, 0, 0.98)');
      ctx!.fillStyle = darkGrad;
      ctx!.fillRect(0, 0, W, H);

      // Volumetric Top God Rays
      ctx!.globalCompositeOperation = 'lighter';
      const rayCount = 14;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 0.25) + (i / rayCount) * (Math.PI * 0.5);
        const len = H * 0.8;
        const rayGrad = ctx!.createLinearGradient(W / 2, 0, W / 2 + Math.cos(angle) * len, Math.sin(angle) * len);
        rayGrad.addColorStop(0, `rgba(255, 215, 0, ${0.12 * vis})`);
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.fillStyle = rayGrad;
        ctx!.beginPath();
        ctx!.moveTo(W / 2, 0);
        ctx!.lineTo(W / 2 + Math.cos(angle - 0.04) * len, Math.sin(angle - 0.04) * len);
        ctx!.lineTo(W / 2 + Math.cos(angle + 0.04) * len, Math.sin(angle + 0.04) * len);
        ctx!.closePath();
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = 'source-over';

      ctx!.translate(W / 2, H * 0.45);
      ctx!.scale(scale, scale);

      // ── TAMIL TEXT (பொங்கல் திருநாள் வாழ்த்துக்கள்) ──
      const fontSizeTamil = Math.min(W * 0.075, 75);
      ctx!.font = `900 ${fontSizeTamil}px "Noto Sans Tamil", sans-serif, serif`;

      ctx!.strokeStyle = '#0a0301';
      ctx!.lineWidth = fontSizeTamil * 0.12;
      ctx!.strokeText('பொங்கல் திருநாள் வாழ்த்துக்கள்', 0, 0);

      const goldTamil = ctx!.createLinearGradient(0, -fontSizeTamil / 2, 0, fontSizeTamil / 2);
      goldTamil.addColorStop(0.0, '#FFFDF0');
      goldTamil.addColorStop(0.3, '#FFD700');
      goldTamil.addColorStop(0.6, '#D4AF37');
      goldTamil.addColorStop(1.0, '#663c00');

      ctx!.shadowBlur = 30;
      ctx!.shadowColor = '#FFD700';
      ctx!.fillStyle = goldTamil;
      ctx!.fillText('பொங்கல் திருநாள் வாழ்த்துக்கள்', 0, 0);

      // ── ENGLISH TEXT (HAPPY PONGAL 2027) ──
      const fontSizeEng = Math.min(W * 0.055, 55);
      const cyEng = fontSizeTamil * 1.25;
      ctx!.font = `900 ${fontSizeEng}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 0;
      ctx!.strokeStyle = '#0a0301';
      ctx!.lineWidth = fontSizeEng * 0.1;
      ctx!.strokeText('HAPPY PONGAL 2027', 0, cyEng);

      const goldEng = ctx!.createLinearGradient(0, cyEng - fontSizeEng / 2, 0, cyEng + fontSizeEng / 2);
      goldEng.addColorStop(0.0, '#FFFFFF');
      goldEng.addColorStop(0.4, '#FFE57F');
      goldEng.addColorStop(0.8, '#C68A00');
      goldEng.addColorStop(1.0, '#3A1F00');

      ctx!.shadowBlur = 20;
      ctx!.shadowColor = 'rgba(255, 215, 0, 0.8)';
      ctx!.fillStyle = goldEng;
      ctx!.fillText('HAPPY PONGAL 2027', 0, cyEng);

      // Falling Marigold Petals in Final Scene
      if (Math.random() < 0.3) {
        particles.push({
          x: Math.random() * W,
          y: -20,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1.2 + Math.random() * 1.8,
          size: 5 + Math.random() * 5,
          alpha: 0.8,
          type: 'petal',
          rot: Math.random() * Math.PI * 2,
          rotSpd: (Math.random() - 0.5) * 0.08,
          color: Math.random() < 0.5 ? '#ff9900' : '#ffcc00'
        });
      }

      ctx!.restore();
    }

    // Update Particles
    function updateAndDrawParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'ember') {
          ctx!.save();
          ctx!.globalCompositeOperation = 'lighter';
          ctx!.globalAlpha = p.alpha;
          ctx!.fillStyle = p.color;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
          p.alpha -= 0.015;
        } else if (p.type === 'petal') {
          p.rot += p.rotSpd;
          ctx!.save();
          ctx!.globalAlpha = p.alpha;
          ctx!.translate(p.x, p.y);
          ctx!.rotate(p.rot);
          ctx!.fillStyle = p.color;
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

      // Handover trigger at 17.5s
      if (t >= 17.5 && !handoverTriggered) {
        handoverTriggered = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }

      ctx!.clearRect(0, 0, W, H);

      // Render Pipeline
      drawScene1_HarvestCart(t);
      drawScene2_CourtyardPot(t);
      drawScene3_Feast(t);
      drawScene4_BonfireKites(t);
      drawScene5_Typography(t);

      updateAndDrawParticles();

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
    <div className="fixed inset-0 w-full h-full bg-[#050100] z-[99999]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-[#050100]"
      />
    </div>
  );
}
