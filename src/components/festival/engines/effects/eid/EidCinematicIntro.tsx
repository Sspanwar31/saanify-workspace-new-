'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  onComplete?: () => void;
}

// ============ MATH & EASING ============
const smoothstep = (a: number, b: number, t: number) => {
  if (b === a) return t < a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// ============ HIGH-PERFORMANCE PARTICLE POOL ============
type PType = 'star' | 'dust' | 'firework_spark' | 'firework_rocket' | 'shimmer';

interface Particle {
  idx: number; x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; alpha: number;
  type: PType; active: boolean; gravity: number; drag: number;
  color: string; twinkle: number; hasExploded: boolean;
}

class ParticlePool {
  particles: Particle[] = [];
  free: number[] = [];
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.particles.push({
        idx: i, x: 0, y: 0, vx: 0, vy: 0, size: 1, life: 0, maxLife: 1, alpha: 0,
        type: 'dust', active: false, gravity: 0, drag: 0.98,
        color: '#fff', twinkle: 0, hasExploded: false
      });
      this.free.push(i);
    }
  }
  spawn(): Particle | null {
    const idx = this.free.pop();
    if (idx === undefined) return null;
    const p = this.particles[idx];
    if (!p) return null;
    p.active = true; p.life = 0; p.alpha = 0; p.hasExploded = false;
    return p;
  }
  release(p: Particle) {
    if (!p) return;
    p.active = false;
    this.free.push(p.idx);
  }
}

export default function EidCinematicIntro({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    if (!document.getElementById('eid-google-fonts-grand')) {
      const link = document.createElement('link');
      link.id = 'eid-google-fonts-grand';
      link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Cinzel:wght@700;900&display=swap';
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
    let lastTime = 0;
    let handoverTriggered = false;
    let screenFlash = 0;

    // Offscreen canvases for Post-Processing
    const bloom = document.createElement('canvas');
    const bctx = bloom.getContext('2d')!;
    const grain = document.createElement('canvas');
    const gctx = grain.getContext('2d')!;

    // Particle Sprites
    function makeSprite(size: number, inner: string, mid: string): HTMLCanvasElement {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const cx = c.getContext('2d')!;
      const grad = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, inner);
      grad.addColorStop(0.35, mid);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = grad;
      cx.fillRect(0, 0, size, size);
      return c;
    }
    const goldDustSprite = makeSprite(64, 'rgba(255,215,100,1)', 'rgba(255,140,40,0.4)');
    const fireworkSprite = makeSprite(64, 'rgba(255,255,255,1)', 'rgba(255,215,100,0.5)');

    // 🚀 FIXED: INCREASED PARTICLE POOL CAPACITY TO 6000
    const pool = new ParticlePool(6000);
    
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = Math.floor(W * DPR);
      canvas!.height = Math.floor(H * DPR);
      ctx?.setTransform(DPR, 0, 0, DPR, 0, 0);
      
      bloom.width = Math.max(2, Math.floor(W / 2));
      bloom.height = Math.max(2, Math.floor(H / 2));
      grain.width = 256; grain.height = 256;
      generateGrain();
    }

    function generateGrain() {
      const id = gctx.createImageData(grain.width, grain.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = Math.random() * 255;
        d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 16;
      }
      gctx.putImageData(id, 0, 0);
    }

    // =========================================================================
    // SCENE 1: CINEMATIC NIGHT SKY & MOONRISE (0.0s -> 3.5s)
    // =========================================================================
    function drawNightSkyAndMoon(t: number) {
      const vis = smoothstep(0.0, 1.5, t) * (1 - smoothstep(8.5, 9.5, t));
      if (vis <= 0.001) return;

      ctx!.save();
      ctx!.globalAlpha = vis;

      // Deep Midnight Sky Gradient
      const skyGrad = ctx!.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, W);
      skyGrad.addColorStop(0.0, '#0a231b');
      skyGrad.addColorStop(0.4, '#03120d');
      skyGrad.addColorStop(1.0, '#000403');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, W, H);

      // 3D Crescent Moon
      const mx = W * 0.5;
      const my = H * 0.28 - smoothstep(0, 3.5, t) * 25;
      const moonR = Math.min(W, H) * 0.075;

      ctx!.globalCompositeOperation = 'screen';
      const halo = ctx!.createRadialGradient(mx, my, 0, mx, my, Math.min(W, H) * 0.55);
      halo.addColorStop(0, `rgba(255, 230, 150, ${0.25 * vis})`);
      halo.addColorStop(0.4, `rgba(16, 185, 129, ${0.15 * vis})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, W, H);

      const moonGrad = ctx!.createRadialGradient(mx - moonR * 0.3, my - moonR * 0.3, moonR * 0.1, mx, my, moonR);
      moonGrad.addColorStop(0.0, `rgba(255, 255, 245, ${1.0 * vis})`);
      moonGrad.addColorStop(0.5, `rgba(255, 215, 100, ${0.9 * vis})`);
      moonGrad.addColorStop(1.0, `rgba(180, 120, 30, ${0.8 * vis})`);
      ctx!.fillStyle = moonGrad;
      ctx!.beginPath();
      ctx!.arc(mx, my, Math.max(0.1, moonR), 0, Math.PI * 2);
      ctx!.fill();

      // Crescent Moon Cutout
      ctx!.globalCompositeOperation = 'source-over';
      ctx!.fillStyle = `rgba(3, 18, 13, ${1.0 * vis})`;
      ctx!.beginPath();
      ctx!.arc(mx + moonR * 0.4, my - moonR * 0.1, Math.max(0.1, moonR * 0.95), 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 2 — CINEMATIC GRAND MOSQUE
    // 2.5s → 9.0s
    // 2027 EID UL FITR — ROYAL EMERALD / IVORY / GOLD
    // =========================================================================

    function drawGrandMosqueWithReflections(t: number) {

      const vis =
        smoothstep(2.2, 3.2, t) *
        (1 - smoothstep(8.2, 9.2, t));

      if (vis <= 0.001) return;

      ctx!.save();

      // ---------------------------------------------------------
      // CINEMATIC CAMERA REVEAL
      // ---------------------------------------------------------
      // 🚀 APPLIED CHANGE: Camera zoom हटाओ
      ctx!.globalAlpha = vis;

      // ---------------------------------------------------------
      // SCALE
      // ---------------------------------------------------------

      const s = Math.min(W, H) * 0.0024;

      // 🚀 APPLIED CHANGE: Base नीचे
      const baseY = H * 0.74;

      // ---------------------------------------------------------
      // COLOR PALETTE
      // ---------------------------------------------------------

      const deepEmerald = '#03150F';
      const emerald = '#073B2A';

      const ivory = '#FFF8E8';
      const warmIvory = '#F5E7C4';

      const gold = '#D6A928';
      const brightGold = '#FFE39A';

      // ---------------------------------------------------------
      // ATMOSPHERIC GLOW BEHIND MOSQUE
      // ---------------------------------------------------------

      const atmosphere =
        ctx!.createRadialGradient(
          W * 0.5,
          baseY - 190 * s,
          0,
          W * 0.5,
          baseY - 190 * s,
          330 * s
        );

      atmosphere.addColorStop(
        0,
        `rgba(255,220,130,${0.14 * vis})`
      );

      atmosphere.addColorStop(
        0.25,
        `rgba(90,190,145,${0.10 * vis})`
      );

      atmosphere.addColorStop(
        0.65,
        `rgba(20,100,70,${0.055 * vis})`
      );

      atmosphere.addColorStop(
        1,
        'rgba(0,0,0,0)'
      );

      ctx!.fillStyle = atmosphere;

      ctx!.fillRect(
        W * 0.15,
        H * 0.20,
        W * 0.70,
        H * 0.60
      );

      // =========================================================
      // MARBLE COURTYARD
      // =========================================================

      const floorGrad =
        ctx!.createLinearGradient(
          0,
          baseY,
          0,
          H
        );

      floorGrad.addColorStop(
        0,
        '#102E25'
      );

      floorGrad.addColorStop(
        0.25,
        '#082119'
      );

      floorGrad.addColorStop(
        0.65,
        '#04140F'
      );

      floorGrad.addColorStop(
        1,
        '#010705'
      );

      ctx!.fillStyle = floorGrad;

      ctx!.fillRect(
        0,
        baseY,
        W,
        H - baseY
      );

      // ---------------------------------------------------------
      // MARBLE PERSPECTIVE LINES
      // ---------------------------------------------------------

      ctx!.save();

      // 🚀 APPLIED CHANGE: Floor alpha and colors
      ctx!.globalAlpha = 0.10 * vis;

      ctx!.strokeStyle = '#8E8568';
      ctx!.lineWidth = Math.max(0.5, 0.55 * s);

      for (let i = -7; i <= 7; i++) {

        const bottomX =
          W * 0.5 + i * W * 0.11;

        ctx!.beginPath();

        ctx!.moveTo(
          W * 0.5 + i * W * 0.025,
          baseY
        );

        ctx!.lineTo(
          bottomX,
          H
        );

        ctx!.stroke();
      }

      // Horizontal marble seams

      // 🚀 APPLIED CHANGE: loop limit changed to i < 6
      for (let i = 1; i < 6; i++) {

        const p = i / 7;

        const y =
          baseY +
          Math.pow(p, 1.65) *
          (H - baseY);

        ctx!.beginPath();

        ctx!.moveTo(
          W * 0.08 + p * W * 0.08,
          y
        );

        ctx!.lineTo(
          W * 0.92 - p * W * 0.08,
          y
        );

        ctx!.stroke();
      }

      ctx!.restore();

      // =========================================================
      // MOSQUE SIZE CONTROL
      // =========================================================

      // 1.00 = current size
      // 0.90 = slightly smaller
      // 0.82 = clearly smaller
      // 0.78 = compact cinematic size
      const mosqueScale =
        0.80 + smoothstep(2.2, 4.0, t) * 0.02;

      // Scale ONLY the mosque around its ground/base.
      // Floor remains completely unaffected.
      ctx!.translate(W * 0.5, baseY);
      ctx!.scale(mosqueScale, mosqueScale);
      ctx!.translate(-W * 0.5, -baseY);

      // =========================================================
      // MOSQUE SHADOW / FOUNDATION
      // =========================================================

      ctx!.save();

      ctx!.fillStyle =
        'rgba(0,0,0,0.55)';

      ctx!.beginPath();

      ctx!.ellipse(
        W * 0.5,
        baseY + 4 * s,
        W * 0.38,
        20 * s,
        0,
        0,
        Math.PI * 2
      );

      ctx!.fill();

      ctx!.restore();

      // =========================================================
      // MAIN MOSQUE BODY
      // =========================================================

      // 🚀 APPLIED CHANGE: Body छोटा
      const bodyTop =
        baseY - 112 * s;

      const bodyBottom =
        baseY;

      const bodyGrad =
        ctx!.createLinearGradient(
          0,
          bodyTop,
          0,
          bodyBottom
        );

      bodyGrad.addColorStop(
        0,
        '#173D31'
      );

      bodyGrad.addColorStop(
        0.35,
        '#0B2A20'
      );

      bodyGrad.addColorStop(
        1,
        '#03130E'
      );

      ctx!.fillStyle = bodyGrad;

      ctx!.beginPath();

      ctx!.roundRect(
        W * 0.23,
        bodyTop,
        W * 0.54,
        bodyBottom - bodyTop,
        5 * s
      );

      ctx!.fill();

      // ---------------------------------------------------------
      // MAIN BODY GOLD EDGE
      // ---------------------------------------------------------

      ctx!.strokeStyle =
        `rgba(214,169,40,${0.55 * vis})`;

      ctx!.lineWidth =
        Math.max(1, 1.5 * s);

      ctx!.stroke();

      // =========================================================
      // CENTRAL GRAND DOME
      // =========================================================

      const domeBase =
        bodyTop + 10 * s;

      // 🚀 APPLIED CHANGE: Dome छोटा
      const domeTop =
        bodyTop - 118 * s;

      const domeX =
        W * 0.5;

      // 🚀 APPLIED CHANGE: Dome छोटा
      const domeWidth =
        W * 0.19;

      const domeGrad =
        ctx!.createLinearGradient(
          domeX - domeWidth / 2,
          domeTop,
          domeX + domeWidth / 2,
          domeBase
        );

      domeGrad.addColorStop(
        0,
        '#FFFDF2'
      );

      domeGrad.addColorStop(
        0.20,
        '#F8E9BD'
      );

      domeGrad.addColorStop(
        0.48,
        '#D9B94E'
      );

      domeGrad.addColorStop(
        0.72,
        '#9B7420'
      );

      domeGrad.addColorStop(
        1,
        '#4D3708'
      );

      ctx!.fillStyle = domeGrad;

      ctx!.beginPath();

      ctx!.moveTo(
        domeX - domeWidth / 2,
        domeBase
      );

      ctx!.bezierCurveTo(
        domeX - domeWidth / 2,
        domeTop + 55 * s,
        domeX - domeWidth * 0.27,
        domeTop,
        domeX,
        domeTop
      );

      ctx!.bezierCurveTo(
        domeX + domeWidth * 0.27,
        domeTop,
        domeX + domeWidth / 2,
        domeTop + 55 * s,
        domeX + domeWidth / 2,
        domeBase
      );

      ctx!.closePath();

      ctx!.fill();

      // ---------------------------------------------------------
      // DOME HIGHLIGHT
      // ---------------------------------------------------------

      const highlightX =
        domeX - domeWidth * 0.18;

      const highlight =
        ctx!.createRadialGradient(
          highlightX,
          domeTop + 35 * s,
          0,
          highlightX,
          domeTop + 35 * s,
          domeWidth * 0.42
        );

      highlight.addColorStop(
        0,
        `rgba(255,255,240,${0.45 * vis})`
      );

      highlight.addColorStop(
        1,
        'rgba(255,255,255,0)'
      );

      ctx!.fillStyle = highlight;

      ctx!.beginPath();

      ctx!.arc(
        domeX,
        domeTop + 55 * s,
        domeWidth * 0.48,
        0,
        Math.PI * 2
      );

      ctx!.fill();

      // =========================================================
      // DOME RIBS — ISLAMIC ARCHITECTURAL DETAIL
      // =========================================================

      ctx!.save();

      ctx!.strokeStyle =
        `rgba(120,82,15,${0.30 * vis})`;

      ctx!.lineWidth =
        Math.max(0.7, 1 * s);

      for (let i = -3; i <= 3; i++) {

        const x =
          domeX +
          i * domeWidth * 0.105;

        ctx!.beginPath();

        ctx!.moveTo(
          x,
          domeBase
        );

        ctx!.quadraticCurveTo(
          domeX + i * domeWidth * 0.07,
          domeTop + 35 * s,
          domeX + i * domeWidth * 0.025,
          domeTop + 5 * s
        );

        ctx!.stroke();
      }

      ctx!.restore();

      // =========================================================
      // DOME NECK / DRUM
      // =========================================================

      ctx!.fillStyle =
        '#D5B45A';

      ctx!.fillRect(
        domeX - domeWidth * 0.42,
        domeBase - 12 * s,
        domeWidth * 0.84,
        12 * s
      );

      // =========================================================
      // CRESCENT FINIAL
      // =========================================================

      // 🚨 UNCHANGED AS REQUESTED: crescentY stays 25
      const crescentY =
        domeTop - 25 * s;

      ctx!.save();

      ctx!.shadowBlur =
        18 * s;

      ctx!.shadowColor =
        'rgba(255,215,90,0.75)';

      ctx!.strokeStyle =
        brightGold;

      ctx!.lineWidth =
        3 * s;

      ctx!.beginPath();

      ctx!.arc(
        domeX,
        crescentY,
        13 * s,
        -0.9,
        2.2
      );

      ctx!.stroke();

      // small star

      ctx!.fillStyle =
        ivory;

      ctx!.beginPath();

      const starX =
        domeX + 13 * s;

      const starY =
        crescentY - 5 * s;

      for (let i = 0; i < 10; i++) {

        const a =
          -Math.PI / 2 +
          i * Math.PI / 5;

        const r =
          i % 2 === 0
            ? 5 * s
            : 2 * s;

        const px =
          starX + Math.cos(a) * r;

        const py =
          starY + Math.sin(a) * r;

        if (i === 0) {
          ctx!.moveTo(px, py);
        } else {
          ctx!.lineTo(px, py);
        }
      }

      ctx!.closePath();

      ctx!.fill();

      ctx!.restore();

      // =========================================================
      // SIDE DOMES
      // =========================================================

      const drawSideDome =
        (
          x: number,
          width: number,
          height: number
        ) => {

          const top =
            bodyTop - height;

          const grad =
            ctx!.createLinearGradient(
              x - width / 2,
              top,
              x + width / 2,
              bodyTop
            );

          grad.addColorStop(
            0,
            '#FFF8DF'
          );

          grad.addColorStop(
            0.45,
            '#D7B54B'
          );

          grad.addColorStop(
            1,
            '#64480E'
          );

          ctx!.fillStyle = grad;

          ctx!.beginPath();

          ctx!.moveTo(
            x - width / 2,
            bodyTop
          );

          ctx!.bezierCurveTo(
            x - width / 2,
            top + height * 0.35,
            x - width * 0.18,
            top,
            x,
            top
          );

          ctx!.bezierCurveTo(
            x + width * 0.18,
            top,
            x + width / 2,
            top + height * 0.35,
            x + width / 2,
            bodyTop
          );

          ctx!.closePath();

          ctx!.fill();
        };

      drawSideDome(
        W * 0.34,
        W * 0.105,
        65 * s
      );

      drawSideDome(
        W * 0.66,
        W * 0.105,
        65 * s
      );

      drawSideDome(
        W * 0.27,
        W * 0.075,
        43 * s
      );

      drawSideDome(
        W * 0.73,
        W * 0.075,
        43 * s
      );

      // =========================================================
      // MINARETS
      // =========================================================

      const drawMinaret =
        (
          x: number,
          width: number,
          height: number
        ) => {

          const bottom =
            baseY + 2 * s;

          const top =
            bottom - height;

          // tower body

          const towerGrad =
            ctx!.createLinearGradient(
              x - width / 2,
              0,
              x + width / 2,
              0
            );

          towerGrad.addColorStop(
            0,
            '#03120D'
          );

          towerGrad.addColorStop(
            0.45,
            '#174535'
          );

          towerGrad.addColorStop(
            0.75,
            '#09271D'
          );

          towerGrad.addColorStop(
            1,
            '#010806'
          );

          ctx!.fillStyle =
            towerGrad;

          ctx!.fillRect(
            x - width / 2,
            top,
            width,
            height
          );

          // golden vertical trim

          ctx!.strokeStyle =
            `rgba(214,169,40,${0.65 * vis})`;

          ctx!.lineWidth =
            Math.max(0.7, 1 * s);

          ctx!.strokeRect(
            x - width / 2,
            top,
            width,
            height
          );

          // balcony 1

          ctx!.fillStyle =
            '#B58A26';

          ctx!.fillRect(
            x - width * 0.85,
            top + height * 0.35,
            width * 1.7,
            5 * s
          );

          // balcony railing

          ctx!.strokeStyle =
            '#E8CB73';

          ctx!.lineWidth =
            Math.max(0.6, 0.8 * s);

          for (
            let i = -3;
            i <= 3;
            i++
          ) {

            ctx!.beginPath();

            ctx!.moveTo(
              x + i * width * 0.20,
              top + height * 0.35
            );

            ctx!.lineTo(
              x + i * width * 0.20,
              top + height * 0.35 - 7 * s
            );

            ctx!.stroke();
          }

          // balcony 2

          ctx!.fillStyle =
            '#8E6A1D';

          ctx!.fillRect(
            x - width * 0.72,
            top + height * 0.62,
            width * 1.44,
            4 * s
          );

          // pointed roof

          ctx!.fillStyle =
            gold;

          ctx!.beginPath();

          ctx!.moveTo(
            x - width * 0.75,
            top
          );

          ctx!.lineTo(
            x,
            top - 28 * s
          );

          ctx!.lineTo(
            x + width * 0.75,
            top
          );

          ctx!.closePath();

          ctx!.fill();

          // finial

          ctx!.strokeStyle =
            brightGold;

          ctx!.lineWidth =
            Math.max(0.7, 1 * s);

          ctx!.beginPath();

          ctx!.moveTo(
            x,
            top - 28 * s
          );

          ctx!.lineTo(
            x,
            top - 42 * s
          );

          ctx!.stroke();
        };

      // back towers first

      drawMinaret(
        W * 0.18,
        15 * s,
        235 * s
      );

      drawMinaret(
        W * 0.82,
        15 * s,
        235 * s
      );

      // foreground towers

      drawMinaret(
        W * 0.125,
        20 * s,
        275 * s
      );

      drawMinaret(
        W * 0.875,
        20 * s,
        275 * s
      );

      // =========================================================
      // CENTRAL FACADE ARCH
      // =========================================================

      const archX =
        W * 0.5;

      const archBottom =
        baseY;

      const archTop =
        bodyTop + 25 * s;

      // outer arch

      ctx!.fillStyle =
        '#071D16';

      ctx!.beginPath();

      ctx!.moveTo(
        archX - 48 * s,
        archBottom
      );

      ctx!.lineTo(
        archX - 48 * s,
        archTop + 38 * s
      );

      ctx!.quadraticCurveTo(
        archX,
        archTop - 20 * s,
        archX + 48 * s,
        archTop + 38 * s
      );

      ctx!.lineTo(
        archX + 48 * s,
        archBottom
      );

      ctx!.closePath();

      ctx!.fill();

      // golden arch border

      ctx!.strokeStyle =
        `rgba(230,196,100,${0.75 * vis})`;

      ctx!.lineWidth =
        Math.max(1, 2 * s);

      ctx!.beginPath();

      ctx!.moveTo(
        archX - 52 * s,
        archBottom
      );

      ctx!.lineTo(
        archX - 52 * s,
        archTop + 38 * s
      );

      ctx!.quadraticCurveTo(
        archX,
        archTop - 27 * s,
        archX + 52 * s,
        archTop + 38 * s
      );

      ctx!.lineTo(
        archX + 52 * s,
        archBottom
      );

      ctx!.stroke();

      // =========================================================
      // GLOWING MAIN ENTRANCE
      // =========================================================

      const entranceGlow =
        ctx!.createRadialGradient(
          archX,
          archTop + 45 * s,
          0,
          archX,
          archTop + 45 * s,
          85 * s
        );

      entranceGlow.addColorStop(
        0,
        `rgba(255,221,130,${0.55 * vis})`
      );

      entranceGlow.addColorStop(
        0.35,
        `rgba(255,190,70,${0.18 * vis})`
      );

      entranceGlow.addColorStop(
        1,
        'rgba(255,180,50,0)'
      );

      ctx!.fillStyle =
        entranceGlow;

      ctx!.fillRect(
        archX - 90 * s,
        archTop - 20 * s,
        180 * s,
        160 * s
      );

      // inner doorway

      ctx!.fillStyle =
        '#020A07';

      ctx!.beginPath();

      ctx!.moveTo(
        archX - 28 * s,
        archBottom
      );

      ctx!.lineTo(
        archX - 28 * s,
        archTop + 45 * s
      );

      ctx!.quadraticCurveTo(
        archX,
        archTop + 10 * s,
        archX + 28 * s,
        archTop + 45 * s
      );

      ctx!.lineTo(
        archX + 28 * s,
        archBottom
      );

      ctx!.closePath();

      ctx!.fill();

      // warm doorway light

      ctx!.fillStyle =
        `rgba(255,214,120,${0.32 * vis})`;

      ctx!.beginPath();

      ctx!.moveTo(
        archX - 19 * s,
        archBottom
      );

      ctx!.lineTo(
        archX - 19 * s,
        archTop + 48 * s
      );

      ctx!.quadraticCurveTo(
        archX,
        archTop + 23 * s,
        archX + 19 * s,
        archTop + 48 * s
      );

      ctx!.lineTo(
        archX + 19 * s,
        archBottom
      );

      ctx!.closePath();

      ctx!.fill();

      // =========================================================
      // SIDE ARCH WINDOWS
      // =========================================================

      const drawWindow =
        (
          x: number,
          y: number,
          w: number,
          h: number,
          phase: number
        ) => {

          const pulse =
            0.55 +
            Math.sin(t * 2.2 + phase) * 0.12;

          ctx!.save();

          ctx!.shadowBlur =
            12 * s;

          ctx!.shadowColor =
            `rgba(255,205,90,${0.45 * vis})`;

          ctx!.fillStyle =
            `rgba(255,218,130,${pulse * vis})`;

          ctx!.beginPath();

          ctx!.moveTo(
            x - w / 2,
            y + h
          );

          ctx!.lineTo(
            x - w / 2,
            y + h * 0.35
          );

          ctx!.quadraticCurveTo(
            x,
            y - h * 0.05,
            x + w / 2,
            y + h * 0.35
          );

          ctx!.lineTo(
            x + w / 2,
            y + h
          );

          ctx!.closePath();

          ctx!.fill();

          // vertical mullion

          ctx!.shadowBlur = 0;

          ctx!.strokeStyle =
            `rgba(108,70,12,${0.6 * vis})`;

          ctx!.lineWidth =
            Math.max(0.5, 0.8 * s);

          ctx!.beginPath();

          ctx!.moveTo(
            x,
            y + h * 0.30
          );

          ctx!.lineTo(
            x,
            y + h
          );

          ctx!.stroke();

          ctx!.restore();
        };

      drawWindow(
        W * 0.31,
        bodyTop + 42 * s,
        20 * s,
        38 * s,
        0
      );

      drawWindow(
        W * 0.39,
        bodyTop + 50 * s,
        17 * s,
        34 * s,
        1.2
      );

      drawWindow(
        W * 0.61,
        bodyTop + 50 * s,
        17 * s,
        34 * s,
        2.4
      );

      drawWindow(
        W * 0.69,
        bodyTop + 42 * s,
        20 * s,
        38 * s,
        3.5
      );

      // =========================================================
      // ISLAMIC GEOMETRIC FACADE DETAILS
      // =========================================================

      ctx!.save();

      ctx!.strokeStyle =
        `rgba(224,193,103,${0.28 * vis})`;

      ctx!.lineWidth =
        Math.max(0.5, 0.7 * s);

      const patternY =
        bodyTop + 92 * s;

      for (let i = 0; i < 9; i++) {

        const px =
          W * 0.29 + i * W * 0.052;

        ctx!.beginPath();

        ctx!.moveTo(
          px,
          patternY
        );

        ctx!.lineTo(
          px + 12 * s,
          patternY + 8 * s
        );

        ctx!.lineTo(
          px,
          patternY + 16 * s
        );

        ctx!.lineTo(
          px - 12 * s,
          patternY + 8 * s
        );

        ctx!.closePath();

        ctx!.stroke();
      }

      ctx!.restore();

      // =========================================================
      // MOVING DOME LIGHT
      // =========================================================

      const lightProgress =
        (Math.sin(t * 0.8) + 1) / 2;

      const movingX =
        domeX -
        domeWidth * 0.35 +
        lightProgress *
        domeWidth * 0.7;

      const movingGlow =
        ctx!.createRadialGradient(
          movingX,
          domeTop + 65 * s,
          0,
          movingX,
          domeTop + 65 * s,
          35 * s
        );

      movingGlow.addColorStop(
        0,
        `rgba(255,255,220,${0.28 * vis})`
      );

      movingGlow.addColorStop(
        1,
        'rgba(255,255,255,0)'
      );

      ctx!.fillStyle =
        movingGlow;

      ctx!.fillRect(
        domeX - domeWidth,
        domeTop,
        domeWidth * 2,
        100 * s
      );

      // =========================================================
      // MARBLE REFLECTION
      // =========================================================

      ctx!.save();

      ctx!.globalAlpha =
        0.20 * vis;

      ctx!.translate(
        0,
        baseY * 2
      );

      ctx!.scale(
        1,
        -0.48
      );

      // simplified reflected mosque mass

      ctx!.fillStyle =
        'rgba(218,190,100,0.55)';

      ctx!.beginPath();

      ctx!.moveTo(
        W * 0.25,
        baseY - 110 * s
      );

      ctx!.lineTo(
        W * 0.25,
        baseY
      );

      ctx!.lineTo(
        W * 0.75,
        baseY
      );

      ctx!.lineTo(
        W * 0.75,
        baseY - 110 * s
      );

      ctx!.closePath();

      ctx!.fill();

      ctx!.restore();

      // =========================================================
      // ANIMATED WATER-LIKE MARBLE RIPPLE
      // =========================================================

      ctx!.save();

      ctx!.globalAlpha =
        0.16 * vis;

      ctx!.strokeStyle =
        '#E6CC83';

      ctx!.lineWidth =
        Math.max(0.5, 0.8 * s);

      for (let i = 0; i < 11; i++) {

        const phase =
          t * 0.7 + i * 0.45;

        const y =
          baseY +
          12 * s +
          i * 12 * s;

        const wave =
          Math.sin(phase) * 4 * s;

        ctx!.beginPath();

        ctx!.moveTo(
          W * 0.28,
          y
        );

        ctx!.quadraticCurveTo(
          W * 0.5,
          y + wave,
          W * 0.72,
          y
        );

        ctx!.stroke();
      }

      ctx!.restore();

      // =========================================================
      // FLOATING GOLD PARTICLES
      // =========================================================

      ctx!.save();

      ctx!.globalCompositeOperation =
        'screen';

      for (let i = 0; i < 22; i++) {

        const seed =
          i * 37.17;

        const px =
          W * (
            0.12 +
            ((seed % 71) / 100)
          );

        const py =
          H * (
            0.25 +
            ((seed * 1.37) % 45) / 100
          );

        const drift =
          Math.sin(
            t * 0.7 + i
          ) * 6;

        const pulse =
          0.3 +
          0.3 *
          Math.sin(
            t * 2 + i
          );

        ctx!.fillStyle =
          `rgba(255,218,130,${pulse * vis})`;

        ctx!.beginPath();

        ctx!.arc(
          px + drift,
          py,
          (1.0 + (i % 3) * 0.6) * s,
          0,
          Math.PI * 2
        );

        ctx!.fill();
      }

      ctx!.restore();

      // =========================================================
      // SOFT GROUND LIGHT
      // =========================================================

      const groundGlow =
        ctx!.createRadialGradient(
          W * 0.5,
          baseY,
          0,
          W * 0.5,
          baseY,
          W * 0.40
        );

      groundGlow.addColorStop(
        0,
        `rgba(255,205,100,${0.12 * vis})`
      );

      groundGlow.addColorStop(
        0.45,
        `rgba(40,130,90,${0.08 * vis})`
      );

      groundGlow.addColorStop(
        1,
        'rgba(0,0,0,0)'
      );

      ctx!.fillStyle =
        groundGlow;

      ctx!.fillRect(
        W * 0.08,
        baseY - 20 * s,
        W * 0.84,
        H * 0.28
      );

      ctx!.restore();
    }

    // =========================================================================
    // SCENE 3: SPECTACULAR EID FIREWORKS ENGINE (FIXED HIGH-SKY BLAST)
    // =========================================================================
    function launchFirework(t: number) {
      if (t < 3.2 || t > 8.8) return;

      if (Math.random() > 0.18) return;

      const p = pool.spawn();
      if (!p) return;

      p.type = 'firework_rocket';
      p.hasExploded = false; // ADDED: Explicit reset

      p.x = W * 0.12 + Math.random() * W * 0.76;
      p.y = H * 0.85;

      p.vx = (Math.random() - 0.5) * 1.5;
      
      // 🚀 CHANGED: Natural high-sky trajectory
      p.vy = -14.5 - Math.random() * 3.0;

      p.size = 2.5;
      p.maxLife = 1.8 + Math.random() * 0.3; // CHANGED: Longer flight time
      p.life = 0;
      p.alpha = 1;

      p.gravity = 0.08; 
      p.drag = 0.992;

      p.color = [
        '#FFD700', '#00FF9D', '#00E5FF', '#FF1493', '#FFA500', '#FFFFFF', '#9D4EDD'
      ][Math.floor(Math.random() * 7)];
    }

    // 💥 MULTI-COLOR HIGH-SKY BLAST EXPLOSION
    function explodeFirework(x: number, y: number, mainColor: string) {
      // 🚀 APPLIED CHANGE: screenFlash 0.16
      screenFlash = Math.min(1.0, screenFlash + 0.16); 

      const sparkCount = 90 + Math.floor(Math.random() * 40); 

      // CHANGED: Color-heavy palettes (Removed whites)
      const multiColors = [
        ['#FFD700', '#FFB300', '#FFC857', '#FFF1A8'],
        ['#00E5FF', '#00B8D4', '#7DF9FF', '#00FFCC'],
        ['#FF1493', '#FF4FA3', '#FF77B7', '#FFD1E6'],
        ['#FF6D00', '#FFA500', '#FFCA28', '#FFD700'],
        ['#9D4EDD', '#B66DFF', '#E0AAFF', '#C77DFF']
      ];

      const colorPalette = multiColors[Math.floor(Math.random() * multiColors.length)];

      for (let i = 0; i < sparkCount; i++) {
        const p = pool.spawn();
        if (!p) break;

        p.type = 'firework_spark';
        p.x = x;
        p.y = y;

        const angle = (i / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
        // CHANGED: Controlled blast radius
        const speed = 3.2 + Math.random() * 5.8;

        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        // CHANGED: Controlled spark size
        p.size = 1.1 + Math.random() * 1.8;
        p.maxLife = 1.4 + Math.random() * 0.8;
        p.life = 0;
        p.alpha = 1;

        p.gravity = 0.06; 
        p.drag = 0.965;

        p.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      }
    }

    // =========================================================================
    // SCENE 4: 3D METALLIC GOLDEN TYPOGRAPHY & ARABIC CALLIGRAPHY (8.5s -> 12.0s)
    // =========================================================================
    function draw3DGoldenText(t: number) {
      const vis = smoothstep(8.5, 9.5, t) * (1 - smoothstep(11.5, 12.0, t));
      if (vis <= 0.001) return;

      const scale = 0.92 + smoothstep(8.5, 10.5, t) * 0.08;

      ctx!.save();
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.globalAlpha = vis;

      // Dark Luxury Background Backdrop for Text
      const darkGrad = ctx!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65);
      darkGrad.addColorStop(0, 'rgba(4, 18, 12, 0.96)');
      darkGrad.addColorStop(1, 'rgba(1, 5, 3, 0.99)');
      ctx!.fillStyle = darkGrad;
      ctx!.fillRect(0, 0, W, H);

      // Volumetric Top Light Beams
      ctx!.globalCompositeOperation = 'lighter';
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 0.25) + (i / rayCount) * (Math.PI * 0.5);
        const len = H * 0.85;
        const rayGrad = ctx!.createLinearGradient(W / 2, 0, W / 2 + Math.cos(angle) * len, Math.sin(angle) * len);
        rayGrad.addColorStop(0, `rgba(255, 215, 0, ${0.15 * vis})`);
        rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.fillStyle = rayGrad;
        ctx!.beginPath();
        ctx!.moveTo(W / 2, 0);
        ctx!.lineTo(W / 2 + Math.cos(angle - 0.03) * len, Math.sin(angle - 0.03) * len);
        ctx!.lineTo(W / 2 + Math.cos(angle + 0.03) * len, Math.sin(angle + 0.03) * len);
        ctx!.closePath();
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = 'source-over';

      ctx!.translate(W / 2, H * 0.44);
      ctx!.scale(scale, scale);

      // ── ARABIC CALLIGRAPHY (عيد مبارك) ──
      const fontSizeArabic = Math.min(W * 0.09, 85);
      ctx!.font = `700 ${fontSizeArabic}px "Amiri", serif`;

      ctx!.strokeStyle = '#020b06';
      ctx!.lineWidth = fontSizeArabic * 0.1;
      ctx!.strokeText('عيد مبارك', 0, -fontSizeArabic * 0.3);

      const goldArabic = ctx!.createLinearGradient(0, -fontSizeArabic, 0, 0);
      goldArabic.addColorStop(0.0, '#FFFDF0');
      goldArabic.addColorStop(0.3, '#FFD700');
      goldArabic.addColorStop(0.6, '#D4AF37');
      goldArabic.addColorStop(1.0, '#593800');

      ctx!.shadowBlur = 35;
      ctx!.shadowColor = 'rgba(255, 215, 0, 0.85)';
      ctx!.fillStyle = goldArabic;
      ctx!.fillText('عيد مبارك', 0, -fontSizeArabic * 0.3);

      // ── ENGLISH METALLIC TEXT (EID MUBARAK 2027) ──
      const fontSizeEng = Math.min(W * 0.055, 52);
      const cyEng = fontSizeArabic * 0.9;
      ctx!.font = `900 ${fontSizeEng}px "Cinzel", Georgia, serif`;

      ctx!.shadowBlur = 0;
      ctx!.strokeStyle = '#020b06';
      ctx!.lineWidth = fontSizeEng * 0.08;
      ctx!.strokeText('EID MUBARAK 2027', 0, cyEng);

      const goldEng = ctx!.createLinearGradient(0, cyEng - fontSizeEng / 2, 0, cyEng + fontSizeEng / 2);
      goldEng.addColorStop(0.0, '#FFFFFF');
      goldEng.addColorStop(0.4, '#FFE680');
      goldEng.addColorStop(0.8, '#C68A00');
      goldEng.addColorStop(1.0, '#2E1A00');

      ctx!.shadowBlur = 25;
      ctx!.shadowColor = 'rgba(255, 200, 0, 0.75)';
      ctx!.fillStyle = goldEng;
      ctx!.fillText('EID MUBARAK 2027', 0, cyEng);

      ctx!.restore();
    }

    // ============ PARTICLE SPAWN & UPDATES ============
    function spawnAmbientParticles(t: number) {
      // Twinkling Stars
      if (t < 11.5 && Math.random() < 0.4) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'star'; p.x = Math.random() * W; p.y = Math.random() * H * 0.65;
        p.vx = 0; p.vy = 0;
        p.size = 0.5 + Math.random() * 1.5; p.maxLife = 3 + Math.random() * 2; p.life = 0; p.alpha = 0;
        p.twinkle = Math.random() * Math.PI * 2;
      }
      // Gold Shimmer Dust
      if (t > 2.0 && t < 11.5 && Math.random() < 0.5) {
        const p = pool.spawn(); if (!p) return;
        p.type = 'dust'; p.x = Math.random() * W; p.y = H + 10;
        p.vx = (Math.random() - 0.5) * 0.6; p.vy = -0.6 - Math.random() * 0.8;
        p.size = 1 + Math.random() * 2.5; p.maxLife = 5; p.life = 0; p.alpha = 0;
      }
    }

    function updateAndDrawParticles(dt: number, t: number) {
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      
      // Real-time Explosion Screen Flash Lighting
      screenFlash = Math.max(0, screenFlash - dt * 2.0);
      if (screenFlash > 0) {
        // 🚀 APPLIED CHANGE: screenFlash opacity 0.12
        ctx!.fillStyle = `rgba(255, 230, 160, ${screenFlash * 0.12})`;
        ctx!.fillRect(0, 0, W, H);
      }

      for (let i = 0; i < pool.particles.length; i++) {
        const p = pool.particles[i];
        if (!p || !p.active) continue;

        p.life += dt;
        const lr = p.life / p.maxLife;

        // Physics Engine
        p.vy += p.gravity * dt;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'star') {
          p.twinkle += dt * 2;
          p.alpha = (0.5 + Math.sin(p.twinkle) * 0.5) * (1 - smoothstep(11.0, 11.8, t));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = '#ffffff';
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx!.fill();
          }
        } else if (p.type === 'dust') {
          p.alpha = smoothstep(0, 0.4, lr) * (1 - smoothstep(0.8, 1, lr)) * 0.65 * (t < 11.5 ? 1 : 1 - smoothstep(11.5, 12.0, t));
          if (p.alpha > 0.01) {
            ctx!.globalAlpha = p.alpha;
            const sz = p.size * 4;
            ctx!.drawImage(goldDustSprite, p.x - sz, p.y - sz, sz * 2, sz * 2);
          }
        } else if (p.type === 'firework_rocket') {
          p.alpha = 1 - lr;

          // 🚀 APPLIED CHANGE: Rocket premature explosion हटाओ
          if ((p.y <= H * 0.28 || lr >= 0.92) && !p.hasExploded) {
            p.hasExploded = true;
            explodeFirework(p.x, p.y, p.color);
            p.alpha = 0;
            p.life = p.maxLife; // Release rocket immediately
          }

          if (p.alpha > 0.01 && !p.hasExploded) {
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx!.fill();
            // Rocket Trail
            ctx!.globalAlpha = p.alpha * 0.6;
            ctx!.fillRect(p.x - 1, p.y, 2, 14);
          }
        } else if (p.type === 'firework_spark') {
          p.alpha = 1 - lr;
          if (p.alpha > 0.01) {
            const sz = p.size * 3.0;

            // CHANGED: Soft colored glow
            ctx!.globalAlpha = p.alpha * 0.28;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(1, sz * 2.2), 0, Math.PI * 2);
            ctx!.fill();

            // CHANGED: Bright colored spark core
            ctx!.globalAlpha = p.alpha;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.8, p.size), 0, Math.PI * 2);
            ctx!.fill();

            // CHANGED: Tiny white hot center — only subtle
            ctx!.globalAlpha = p.alpha * 0.45;
            ctx!.fillStyle = '#FFFFFF';
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, Math.max(0.35, p.size * 0.28), 0, Math.PI * 2);
            ctx!.fill();
          }
        }

        if (p.life > p.maxLife || p.alpha <= 0.01) pool.release(p);
      }
      ctx!.restore();
    }

    // ============ POST-PROCESSING EFFECTS ============
    function applyBloom() {
      // CHANGED: Bloom parameters reduced heavily
      const bloomAlpha = 0.24;
      bctx.clearRect(0, 0, bloom.width, bloom.height);
      bctx.filter = 'blur(3px) brightness(1.08)';
      bctx.drawImage(canvas!, 0, 0, bloom.width, bloom.height);
      bctx.filter = 'none';
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.globalAlpha = bloomAlpha;
      ctx!.drawImage(bloom, 0, 0, W, H);
      ctx!.restore();
    }

    function applyVignette() {
      const grad = ctx!.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function applyGrain() {
      ctx!.save();
      ctx!.globalCompositeOperation = 'overlay';
      ctx!.globalAlpha = 0.3;
      const ox = Math.floor(Math.random() * 64), oy = Math.floor(Math.random() * 64);
      for (let x = -ox; x < W; x += grain.width) {
        for (let y = -oy; y < H; y += grain.height) ctx!.drawImage(grain, x, y);
      }
      ctx!.restore();
    }

    // ============ MAIN RENDER PIPELINE ============
    function render(t: number, dt: number) {
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx!.fillStyle = '#000000';
      ctx!.fillRect(0, 0, W, H);

      drawNightSkyAndMoon(t);
      drawGrandMosqueWithReflections(t);

      launchFirework(t);
      spawnAmbientParticles(t);
      updateAndDrawParticles(dt, t);

      draw3DGoldenText(t);

      const fadeIn = 1 - smoothstep(0, 1.0, t);
      const fadeOut = smoothstep(11.5, 12.0, t);
      const fadeAmt = Math.max(fadeIn, fadeOut);

      if (fadeAmt > 0.001) {
        ctx!.fillStyle = `rgba(0, 0, 0, ${fadeAmt})`;
        ctx!.fillRect(0, 0, W, H);
      }

      applyBloom();
      applyVignette();
      applyGrain();
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

    // Wait for fonts to load
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
    <div className="fixed inset-0 w-full h-full bg-black z-[99999] overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#000000',
        }}
      />
      {/* SKIP BUTTON */}
      <button
        onClick={() => onComplete?.()}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-[100] px-4 py-2 rounded-full border border-amber-400/30 bg-black/40 text-amber-200 backdrop-blur-md text-[10px] sm:text-xs font-bold tracking-[0.2em] transition-all duration-300 hover:bg-amber-400/20 hover:border-amber-300/70"
      >
        SKIP →
      </button>
    </div>
  );
}
