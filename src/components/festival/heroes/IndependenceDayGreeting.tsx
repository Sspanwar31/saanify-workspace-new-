'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  className?: string;
}

export default function IndependenceDayGreeting({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;
    let scale = 1;

    // Flag physics configuration
    const wavePointsCount = 28;
    const flagPoints: { x: number; y: number; py: number; vy: number }[] = [];
    
    // Initialize flag cloth points
    for (let i = 0; i < wavePointsCount; i++) {
      flagPoints.push({
        x: 0,
        y: 0,
        py: 0,
        vy: 0,
      });
    }

    const resizeCanvas = () => {
      // Set responsive height/width
      const container = canvas.parentElement;
      width = container ? container.clientWidth : window.innerWidth;
      height = container ? container.clientHeight : window.innerHeight;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Determine scale based on portrait/landscape viewport
      scale = Math.min(width / 600, height / 900);
      if (scale < 0.5) scale = 0.5;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Helpers for procedural textures
    const drawSandstoneGradient = (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      isLight = false
    ) => {
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      if (isLight) {
        grad.addColorStop(0, '#d16a49');
        grad.addColorStop(0.3, '#bc5333');
        grad.addColorStop(1, '#94381c');
      } else {
        grad.addColorStop(0, '#94381c');
        grad.addColorStop(0.5, '#782811');
        grad.addColorStop(1, '#501505');
      }
      return grad;
    };

    // Detailed 3D Bushes rendering
    const drawRealisticBush = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number
    ) => {
      ctx.save();
      // Base shadow
      const shadowGrad = ctx.createRadialGradient(cx, cy + r * 0.2, 0, cx, cy + r * 0.2, r);
      shadowGrad.addColorStop(0, 'rgba(10, 30, 5, 0.6)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.3, r, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Multi-layered organic leaf structures
      const layers = 5;
      for (let i = 0; i < layers; i++) {
        const layerR = r * (1 - i * 0.15);
        const offsetMax = i * 4;
        
        // Coloring from deep shadow green to bright highlight green
        const rVal = Math.floor(15 + i * 15);
        const gVal = Math.floor(45 + i * 25);
        const bVal = Math.floor(10 + i * 10);
        
        ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;

        for (let j = 0; j < 12 - i * 2; j++) {
          const angle = (j / (12 - i * 2)) * Math.PI * 2;
          const leafX = cx + Math.cos(angle) * (layerR * 0.8) + (Math.random() - 0.5) * offsetMax;
          const leafY = cy + Math.sin(angle) * (layerR * 0.6) + (Math.random() - 0.5) * offsetMax;
          
          ctx.beginPath();
          ctx.arc(leafX, leafY, r * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    // Main animation loop
    const render = (time: number) => {
      const t = time * 0.001;
      ctx.clearRect(0, 0, width, height);

      // Center the coordinates around base of the fort dynamically
      const centerX = width * 0.5;
      const fortBaseY = height * 0.78;
      const fortWidth = 480 * scale;
      const fortHeight = 220 * scale;

      ctx.save();

      // ==========================================
      // 1. FOREGROUND GARDEN & HILL (MOUND)
      // ==========================================
      // Grassy Mound under the flagpole
      const hillGrad = ctx.createLinearGradient(0, fortBaseY - 30 * scale, 0, height);
      hillGrad.addColorStop(0, '#557c3e');
      hillGrad.addColorStop(0.3, '#325222');
      hillGrad.addColorStop(1, '#1b3211');
      ctx.fillStyle = hillGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, fortBaseY + 30 * scale, fortWidth * 0.62, 50 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // 2. RED FORT (LAL QILA) ARCHITECTURE
      // ==========================================
      // Red Fort Main Wall
      const wallX = centerX - fortWidth / 2;
      const wallY = fortBaseY - fortHeight * 0.6;
      const wallW = fortWidth;
      const wallH = fortHeight * 0.6;

      ctx.fillStyle = drawSandstoneGradient(ctx, wallX, wallY, wallX + wallW, wallY, false);
      ctx.fillRect(wallX, wallY, wallW, wallH);

      // Procedural Brick Patterns on Main Wall
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 0.8;
      const brickRows = 16;
      const brickCols = 32;
      const rowHeight = wallH / brickRows;
      const colWidth = wallW / brickCols;
      for (let i = 0; i < brickRows; i++) {
        const yOffset = wallY + i * rowHeight;
        ctx.beginPath();
        ctx.moveTo(wallX, yOffset);
        ctx.lineTo(wallX + wallW, yOffset);
        ctx.stroke();
        
        const shift = (i % 2) * (colWidth / 2);
        for (let j = 0; j <= brickCols; j++) {
          const xOffset = wallX + j * colWidth + shift;
          if (xOffset >= wallX && xOffset <= wallX + wallW) {
            ctx.beginPath();
            ctx.moveTo(xOffset, yOffset);
            ctx.lineTo(xOffset, yOffset + rowHeight);
            ctx.stroke();
          }
        }
      }

      // Arched structures on the lower wall (Niches)
      const archCount = 7;
      const archSpacing = wallW / (archCount + 1);
      for (let i = 1; i <= archCount; i++) {
        const ax = wallX + i * archSpacing;
        const ay = fortBaseY - 10 * scale;
        const aw = 24 * scale;
        const ah = 40 * scale;

        // Arch Shadow
        ctx.fillStyle = 'rgba(25, 5, 2, 0.82)';
        ctx.beginPath();
        ctx.moveTo(ax - aw / 2, ay);
        ctx.lineTo(ax - aw / 2, ay - ah + aw / 2);
        ctx.arc(ax, ay - ah + aw / 2, aw / 2, Math.PI, 0);
        ctx.lineTo(ax + aw / 2, ay);
        ctx.closePath();
        ctx.fill();

        // Arch Border Accent
        ctx.strokeStyle = 'rgba(232, 213, 184, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Main Central Balcony (Archway structure)
      const centerArchW = 75 * scale;
      const centerArchH = 90 * scale;
      const centerArchX = centerX;
      const centerArchY = fortBaseY - centerArchH * 0.4;

      // Dark shadow recess
      ctx.fillStyle = '#1c0702';
      ctx.beginPath();
      ctx.moveTo(centerArchX - centerArchW / 2, centerArchY);
      ctx.lineTo(centerArchX - centerArchW / 2, centerArchY - centerArchH + centerArchW / 2);
      ctx.arc(centerArchX, centerArchY - centerArchH + centerArchW / 2, centerArchW / 2, Math.PI, 0);
      ctx.lineTo(centerArchX + centerArchW / 2, centerArchY);
      ctx.closePath();
      ctx.fill();

      // White/Cream Marble inlay arches
      ctx.strokeStyle = '#e6d9be';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(centerArchX - centerArchW * 0.46, centerArchY);
      ctx.lineTo(centerArchX - centerArchW * 0.46, centerArchY - centerArchH + centerArchW * 0.46);
      ctx.arc(centerArchX, centerArchY - centerArchH + centerArchW * 0.46, centerArchW * 0.46, Math.PI, 0);
      ctx.lineTo(centerArchX + centerArchW * 0.46, centerArchY);
      ctx.stroke();

      // Left and Right Octagonal Pillars (Grand Bastions)
      const pillarW = 44 * scale;
      const pillarH = fortHeight * 0.82;
      const pillarLX = wallX + 40 * scale;
      const pillarRX = wallX + wallW - 40 * scale - pillarW;
      const pillarY = fortBaseY - pillarH;

      [pillarLX, pillarRX].forEach((px) => {
        // Base Pillar
        ctx.fillStyle = drawSandstoneGradient(ctx, px, pillarY, px + pillarW, pillarY, true);
        ctx.fillRect(px, pillarY, pillarW, pillarH);

        // Shadow Edge
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(px + pillarW * 0.7, pillarY, pillarW * 0.3, pillarH);

        // Tower Chhatri (Dome Top)
        const domeR = pillarW * 0.55;
        const domeCY = pillarY - 15 * scale;

        // Pillars supporting dome
        ctx.strokeStyle = '#bc5333';
        ctx.lineWidth = 3 * scale;
        for (let k = 0; k < 4; k++) {
          const pxOffset = px + (pillarW / 3) * k;
          ctx.beginPath();
          ctx.moveTo(pxOffset, pillarY);
          ctx.lineTo(pxOffset, domeCY);
          ctx.stroke();
        }

        // Dome Base platform
        ctx.fillStyle = '#94381c';
        ctx.fillRect(px - 4 * scale, domeCY, pillarW + 8 * scale, 5 * scale);

        // White Marble Dome Cupola
        ctx.fillStyle = '#f6f4eb';
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px + pillarW / 2, domeCY, domeR, Math.PI, 0);
        ctx.quadraticCurveTo(px + pillarW / 2, domeCY - domeR * 1.3, px + pillarW / 2, domeCY - domeR * 1.4);
        ctx.quadraticCurveTo(px + pillarW / 2, domeCY - domeR * 1.1, px + pillarW / 2 - domeR, domeCY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Kalash (Golden Tip)
        ctx.fillStyle = '#dfb15b';
        ctx.beginPath();
        ctx.arc(px + pillarW / 2, domeCY - domeR * 1.45, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Upper center miniature cupolas (Chhatris)
      const miniCupolaCount = 5;
      const miniCupolaW = 18 * scale;
      const miniCupolaH = 26 * scale;
      const startMiniX = centerX - (miniCupolaW + 8 * scale) * (miniCupolaCount - 1) * 0.5;

      for (let i = 0; i < miniCupolaCount; i++) {
        const cx_ = startMiniX + i * (miniCupolaW + 8 * scale);
        const cy_ = wallY - 14 * scale;

        // Sandstone base
        ctx.fillStyle = '#94381c';
        ctx.fillRect(cx_ - miniCupolaW / 2, cy_, miniCupolaW, 4 * scale);

        // Columns
        ctx.strokeStyle = '#d16a49';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx_ - miniCupolaW / 3, cy_);
        ctx.lineTo(cx_ - miniCupolaW / 3, cy_ - miniCupolaH * 0.4);
        ctx.moveTo(cx_ + miniCupolaW / 3, cy_);
        ctx.lineTo(cx_ + miniCupolaW / 3, cy_ - miniCupolaH * 0.4);
        ctx.stroke();

        // Small white dome
        ctx.fillStyle = '#fcfbf7';
        ctx.beginPath();
        ctx.arc(cx_, cy_ - miniCupolaH * 0.4, miniCupolaW / 2, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
      }

      // Balcony guard railing (White Jali details)
      ctx.fillStyle = 'rgba(240, 235, 225, 0.85)';
      ctx.fillRect(wallX + 15 * scale, wallY, wallW - 30 * scale, 4 * scale);

      // ==========================================
      // 3. MAIN FLAGPOLE (SILVER/CHROME)
      // ==========================================
      const poleX = centerX - 25 * scale;
      const poleBaseY = fortBaseY - 10 * scale;
      const poleH = 260 * scale;
      const poleTopY = poleBaseY - poleH;
      const poleW = 4.5 * scale;

      // Chrome metallic gradient
      const chromeGrad = ctx.createLinearGradient(poleX - poleW, 0, poleX + poleW, 0);
      chromeGrad.addColorStop(0, '#757575');
      chromeGrad.addColorStop(0.3, '#bdbdbd');
      chromeGrad.addColorStop(0.5, '#f5f5f5');
      chromeGrad.addColorStop(0.8, '#eeeeee');
      chromeGrad.addColorStop(1, '#616161');

      ctx.fillStyle = chromeGrad;
      ctx.fillRect(poleX - poleW / 2, poleTopY, poleW, poleH);

      // Gold sphere on top of the pole
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(poleX, poleTopY, 5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // 4. ANIMATED WAVING INDIAN FLAG (TIRANGA)
      // ==========================================
      const flagW = 150 * scale;
      const flagH = 95 * scale;
      const stripeH = flagH / 3;

      // Configure/Step flag physical points
      const frequency = 4.8;
      const waveSpeed = 6.2;
      const amplitude = 5.2 * scale;

      for (let i = 0; i < wavePointsCount; i++) {
        const pt = flagPoints[i];
        pt.x = poleX + (i * flagW) / (wavePointsCount - 1);
        
        // Complex trigonometric wave equation for highly organic movement
        const waveOffset1 = Math.sin(t * waveSpeed - i * 0.36) * amplitude;
        const waveOffset2 = Math.cos(t * waveSpeed * 1.4 - i * 0.18) * (amplitude * 0.35);
        
        // Dampen wave close to the flagpole attachment point
        const dampeningFactor = Math.min(i / 5, 1.0);
        pt.y = poleTopY + 15 * scale + (waveOffset1 + waveOffset2) * dampeningFactor;
      }

      // Draw the flag mesh segments
      for (let i = 0; i < wavePointsCount - 1; i++) {
        const p1 = flagPoints[i];
        const p2 = flagPoints[i + 1];

        // Slopes for calculating dynamic light folds
        const slope = (p2.y - p1.y) / (p2.x - p1.x);
        const foldShadow = Math.max(-0.4, Math.min(0.4, slope * 1.8));

        // Color manipulation helper to render dynamic shadows/highlights on folds
        const getFoldAdjustedColor = (hex: string, shadow: number) => {
          const cleanHex = hex.replace('#', '');
          let r = parseInt(cleanHex.substring(0, 2), 16);
          let g = parseInt(cleanHex.substring(2, 4), 16);
          let b = parseInt(cleanHex.substring(4, 6), 16);

          if (shadow < 0) {
            // Shadowing
            r = Math.floor(r * (1 + shadow * 0.7));
            g = Math.floor(g * (1 + shadow * 0.7));
            b = Math.floor(b * (1 + shadow * 0.7));
          } else {
            // Highlighting
            r = Math.floor(r + (255 - r) * shadow * 0.5);
            g = Math.floor(g + (255 - g) * shadow * 0.5);
            b = Math.floor(b + (255 - b) * shadow * 0.5);
          }

          return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
        };

        // 1. Saffron Stripe
        ctx.fillStyle = getFoldAdjustedColor('#FF9933', foldShadow);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p2.x, p2.y + stripeH);
        ctx.lineTo(p1.x, p1.y + stripeH);
        ctx.closePath();
        ctx.fill();

        // 2. White Stripe
        ctx.fillStyle = getFoldAdjustedColor('#FFFFFF', foldShadow);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y + stripeH);
        ctx.lineTo(p2.x, p2.y + stripeH);
        ctx.lineTo(p2.x, p2.y + stripeH * 2);
        ctx.lineTo(p1.x, p1.y + stripeH * 2);
        ctx.closePath();
        ctx.fill();

        // 3. Green Stripe
        ctx.fillStyle = getFoldAdjustedColor('#128807', foldShadow);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y + stripeH * 2);
        ctx.lineTo(p2.x, p2.y + stripeH * 2);
        ctx.lineTo(p2.x, p2.y + flagH);
        ctx.lineTo(p1.x, p1.y + flagH);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Ashoka Chakra on the center (White) stripe of the flag
      const centerPointIdx = Math.floor(wavePointsCount * 0.42);
      const chakraX = flagPoints[centerPointIdx].x;
      const chakraY = flagPoints[centerPointIdx].y + stripeH * 1.5;
      const chakraR = stripeH * 0.42;

      ctx.save();
      ctx.translate(chakraX, chakraY);
      
      // Calculate dynamic tilt of chakra based on local flag fold slope
      const chakraP1 = flagPoints[centerPointIdx - 1];
      const chakraP2 = flagPoints[centerPointIdx + 1];
      const chakraSlope = (chakraP2.y - chakraP1.y) / (chakraP2.x - chakraP1.x);
      ctx.rotate(Math.atan(chakraSlope));

      // Outer circle
      ctx.strokeStyle = '#000080';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, chakraR, 0, Math.PI * 2);
      ctx.stroke();

      // spokes
      ctx.lineWidth = 0.5 * scale;
      for (let k = 0; k < 24; k++) {
        const spAngle = (k / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(spAngle) * chakraR, Math.sin(spAngle) * chakraR);
        ctx.stroke();
      }
      ctx.restore();

      // ==========================================
      // 5. GARDEN BUSHES (AGAINST BASE WALL)
      // ==========================================
      // Procedural round hedges / topiary bushes at the base of fort
      const bushScale = scale * 1.15;
      drawRealisticBush(ctx, centerX - 190 * scale, fortBaseY + 35 * scale, 34 * bushScale);
      drawRealisticBush(ctx, centerX - 130 * scale, fortBaseY + 40 * scale, 24 * bushScale);
      
      drawRealisticBush(ctx, centerX + 120 * scale, fortBaseY + 42 * scale, 28 * bushScale);
      drawRealisticBush(ctx, centerX + 180 * scale, fortBaseY + 35 * scale, 32 * bushScale);

      // Main big trimmed bushes in the central front courtyard
      drawRealisticBush(ctx, centerX - 240 * scale, fortBaseY + 65 * scale, 38 * bushScale);
      drawRealisticBush(ctx, centerX + 240 * scale, fortBaseY + 65 * scale, 38 * bushScale);

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[500px] overflow-hidden ${className}`}>
      {/* Elegantly overlayed handwriting cursive greeting text */}
      <div className="absolute top-12 left-0 right-0 z-10 text-center select-none pointer-events-none">
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl text-white font-normal drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)] tracking-wide"
          style={{ fontFamily: "'Dancing Script', 'Georgia', cursive" }}
        >
          Happy Independence Day
        </h1>
      </div>

      <canvas 
        ref={canvasRef} 
        className="block w-full h-full"
      />
    </div>
  );
}
