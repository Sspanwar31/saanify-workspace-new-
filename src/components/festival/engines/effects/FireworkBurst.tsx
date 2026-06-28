'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── Types ─── */
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'rise' | 'burst' | 'crackle' | 'flash';
  gravity: number;
  friction: number;
  twinkle: boolean;
  twinklePhase: number;
}

interface FireworkDef {
  id: number;
  launchTime: number;
  targetX: number;
  targetY: number;
  palette: string[];
  burstType: 'peony' | 'chrysanthemum' | 'willow' | 'ring' | 'palm' | 'double';
  count: number;
  hasBurst: boolean;
}

interface SkyGlow {
  id: number;
  x: number;
  y: number;
  color: string;
}

/* ─── Indian Festival Color Palettes ─── */
const PALETTES = [
  ['#ff1744', '#ff5252', '#ff8a80', '#ffffff'],       // Laal (Red)
  ['#00e5ff', '#18ffff', '#84ffff', '#ffffff'],       // Neela (Cyan)
  ['#ffd600', '#ffea00', '#ffff8d', '#ffffff'],       // Sunehra (Gold)
  ['#d500f9', '#e040fb', '#ea80fc', '#ffffff'],       // Baingani (Purple)
  ['#76ff03', '#b2ff59', '#ccff90', '#ffffff'],       // Haraa (Green)
  ['#ff6d00', '#ff9100', '#ffab40', '#ffffff'],       // Narangi (Orange)
  ['#f50057', '#ff4081', '#ff80ab', '#ffffff'],       // Gulabi (Pink)
  ['#00bfa5', '#1de9b6', '#a7ffeb', '#ffffff'],       // Panna (Teal)
];

const MAX_PARTICLES = 550;
const RISE_DURATION = 550;

export default function FireworkBurst() {
  const particlesRef = useRef<Particle[]>([]);
  const idRef = useRef(0);
  const frameRef = useRef(0);
  const startRef = useRef(0);
  const fwRef = useRef<FireworkDef[]>([]);
  const glowIdRef = useRef(0);
  const [renderCount, setRenderCount] = useState(0);
  const [skyGlows, setSkyGlows] = useState<SkyGlow[]>([]);

  useEffect(() => {
    /* ─── Helper: create particle ─── */
    const spawn = (p: Omit<Particle, 'id'>): Particle => ({
      ...p,
      id: idRef.current++,
    });

    /* ─── Firework schedule — two waves like real show ─── */
    fwRef.current = [
      // Wave 1
      { id: 1, launchTime: 0,    targetX: 18, targetY: 18, palette: PALETTES[0], burstType: 'chrysanthemum', count: 120, hasBurst: false },
      { id: 2, launchTime: 400,  targetX: 52, targetY: 12, palette: PALETTES[2], burstType: 'peony',         count: 100, hasBurst: false },
      { id: 3, launchTime: 800,  targetX: 82, targetY: 20, palette: PALETTES[4], burstType: 'willow',        count: 90,  hasBurst: false },
      { id: 4, launchTime: 1200, targetX: 35, targetY: 14, palette: PALETTES[3], burstType: 'ring',          count: 80,  hasBurst: false },
      // Wave 2
      { id: 5, launchTime: 2000, targetX: 68, targetY: 10, palette: PALETTES[5], burstType: 'palm',          count: 70,  hasBurst: false },
      { id: 6, launchTime: 2400, targetX: 45, targetY: 22, palette: PALETTES[6], burstType: 'double',        count: 130, hasBurst: false },
      { id: 7, launchTime: 2900, targetX: 22, targetY: 16, palette: PALETTES[7], burstType: 'chrysanthemum', count: 110, hasBurst: false },
      { id: 8, launchTime: 3300, targetX: 76, targetY: 18, palette: PALETTES[0], burstType: 'peony',         count: 100, hasBurst: false },
    ];

    startRef.current = performance.now();
    let running = true;

    /* ─── Burst generator — creates particles based on type ─── */
    const createBurst = (fw: FireworkDef, next: Particle[], ps: Particle[]) => {
      // Center flash — white explosion
      next.push(spawn({
        x: fw.targetX, y: fw.targetY, vx: 0, vy: 0,
        life: 0, maxLife: 7, size: 45,
        color: '#ffffff', type: 'flash',
        gravity: 0, friction: 1,
        twinkle: false, twinklePhase: 0,
      }));

      // Sky glow — aasmaan roshan
      const gid = glowIdRef.current++;
      setSkyGlows(prev => [...prev, { id: gid, x: fw.targetX, y: fw.targetY, color: fw.palette[0] }]);
      setTimeout(() => setSkyGlows(prev => prev.filter(g => g.id !== gid)), 600);

      // Generic burst particle factory
      const make = (
        count: number, sMin: number, sMax: number,
        grav: number, fric: number, mlMin: number, mlMax: number,
        twChance: number, colorOverride?: string,
      ) => {
        for (let i = 0; i < count; i++) {
          if (ps.length + next.length >= MAX_PARTICLES) break;
          const angle = Math.random() * Math.PI * 2;
          const speed = sMin + Math.random() * (sMax - sMin);
          const color = colorOverride ?? fw.palette[Math.floor(Math.random() * (fw.palette.length - 1))];
          next.push(spawn({
            x: fw.targetX, y: fw.targetY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: mlMin + Math.random() * (mlMax - mlMin),
            size: 1.5 + Math.random() * 2,
            color, type: 'burst',
            gravity: grav, friction: fric,
            twinkle: Math.random() < twChance,
            twinklePhase: Math.random() * Math.PI * 2,
          }));
        }
      };

      /* ─── 6 Burst Patterns ─── */
      switch (fw.burstType) {
        /* Peony — classic round, medium trails */
        case 'peony':
          make(fw.count, 1.5, 3, 0.032, 0.975, 45, 72, 0.3);
          break;

        /* Chrysanthemum — long streaming trails, slow fade */
        case 'chrysanthemum':
          make(fw.count, 2, 3.5, 0.012, 0.988, 68, 105, 0.5);
          break;

        /* Willow — heavy gravity, droops down beautifully */
        case 'willow':
          make(fw.count, 1, 2.5, 0.052, 0.992, 95, 145, 0.4);
          break;

        /* Ring — perfect circle with white center */
        case 'ring': {
          const ringCount = Math.floor(fw.count * 0.8);
          for (let i = 0; i < ringCount; i++) {
            if (ps.length + next.length >= MAX_PARTICLES) break;
            const a = (i / ringCount) * Math.PI * 2;
            const s = 2.6 + Math.random() * 0.3;
            next.push(spawn({
              x: fw.targetX, y: fw.targetY,
              vx: Math.cos(a) * s, vy: Math.sin(a) * s,
              life: 0, maxLife: 42 + Math.random() * 14,
              size: 2.5, color: fw.palette[0], type: 'burst',
              gravity: 0.02, friction: 0.98,
              twinkle: false, twinklePhase: 0,
            }));
          }
          // White center fill
          for (let i = 0; i < fw.count - ringCount; i++) {
            if (ps.length + next.length >= MAX_PARTICLES) break;
            const a = Math.random() * Math.PI * 2;
            const s = Math.random() * 1;
            next.push(spawn({
              x: fw.targetX, y: fw.targetY,
              vx: Math.cos(a) * s, vy: Math.sin(a) * s,
              life: 0, maxLife: 28 + Math.random() * 14,
              size: 1.5, color: '#ffffff', type: 'burst',
              gravity: 0.02, friction: 0.97,
              twinkle: true, twinklePhase: Math.random() * Math.PI * 2,
            }));
          }
          break;
        }

        /* Palm — thick arms radiating out like a palm tree */
        case 'palm': {
          const arms = 6 + Math.floor(Math.random() * 3);
          const perArm = Math.floor(fw.count / arms);
          for (let a = 0; a < arms; a++) {
            const baseAngle = (a / arms) * Math.PI * 2;
            for (let i = 0; i < perArm; i++) {
              if (ps.length + next.length >= MAX_PARTICLES) break;
              const angle = baseAngle + (Math.random() - 0.5) * 0.12;
              const s = 0.8 + (i / perArm) * 3.5;
              const ci = Math.min(
                Math.floor((i / perArm) * (fw.palette.length - 1)),
                fw.palette.length - 2,
              );
              next.push(spawn({
                x: fw.targetX, y: fw.targetY,
                vx: Math.cos(angle) * s, vy: Math.sin(angle) * s,
                life: 0, maxLife: 58 + Math.random() * 30,
                size: 2 + Math.random() * 1.5, color: fw.palette[ci], type: 'burst',
                gravity: 0.04, friction: 0.98,
                twinkle: Math.random() < 0.15, twinklePhase: Math.random() * Math.PI * 2,
              }));
            }
          }
          break;
        }

        /* Double — two layers: outer fast + inner slow, different colors */
        case 'double': {
          make(
            Math.floor(fw.count * 0.6), 2, 4.5,
            0.025, 0.98, 48, 68, 0.3, fw.palette[0],
          );
          const innerColor = fw.palette[3] || fw.palette[1];
          make(
            Math.floor(fw.count * 0.4), 0.5, 2,
            0.02, 0.975, 58, 85, 0.4, innerColor,
          );
          break;
        }
      }

      /* ─── Secondary crackle sparks — real fireworks ka signature ─── */
      for (let i = 0; i < 15; i++) {
        if (ps.length + next.length >= MAX_PARTICLES) break;
        const a = Math.random() * Math.PI * 2;
        const d = 4 + Math.random() * 5;
        next.push(spawn({
          x: fw.targetX + Math.cos(a) * d,
          y: fw.targetY + Math.sin(a) * d,
          vx: (Math.random() - 0.5) * 0.9,
          vy: (Math.random() - 0.5) * 0.9,
          life: 0, maxLife: 8 + Math.random() * 10,
          size: 1 + Math.random() * 0.8,
          color: '#ffffff', type: 'crackle',
          gravity: 0.045, friction: 0.94,
          twinkle: false, twinklePhase: 0,
        }));
      }
    };

    /* ─── Main animation loop ─── */
    const loop = () => {
      if (!running) return;
      const t = performance.now() - startRef.current;
      const ps = particlesRef.current;
      const next: Particle[] = [];

      // Process each firework
      for (const fw of fwRef.current) {
        const elapsed = t - fw.launchTime;
        if (elapsed < 0 || fw.hasBurst) continue;

        if (elapsed < RISE_DURATION) {
          /* ── RISE PHASE — rocket going up with sparkle trail ── */
          const progress = elapsed / RISE_DURATION;
          const eased = 1 - (1 - progress) ** 2.5;
          const currentY = 100 - (100 - fw.targetY) * eased;
          const wobble = Math.sin(progress * Math.PI * 6) * 0.4;
          const currentX = fw.targetX + wobble;

          // Sparkle trail behind rising rocket
          if (ps.length + next.length < MAX_PARTICLES && Math.random() < 0.85) {
            next.push(spawn({
              x: currentX + (Math.random() - 0.5) * 0.7,
              y: currentY + 1.2,
              vx: (Math.random() - 0.5) * 0.25,
              vy: 0.25 + Math.random() * 0.45,
              life: 0, maxLife: 14 + Math.random() * 8,
              size: 1 + Math.random() * 1.2,
              color: fw.palette[Math.floor(Math.random() * 2)],
              type: 'rise', gravity: 0.01, friction: 0.96,
              twinkle: false, twinklePhase: 0,
            }));
          }

          // Bright rocket head
          next.push(spawn({
            x: currentX, y: currentY, vx: 0, vy: 0,
            life: 0, maxLife: 2, size: 3.5,
            color: '#ffffff', type: 'flash',
            gravity: 0, friction: 1,
            twinkle: false, twinklePhase: 0,
          }));
        } else {
          /* ── BURST PHASE — firework explodes! ── */
          fw.hasBurst = true;
          createBurst(fw, next, ps);
        }
      }

      // Physics update for existing particles
      const updated = ps
        .map(p => {
          const newLife = p.life + 1;
          if (newLife >= p.maxLife) return null;

          const nvx = p.vx * p.friction;
          const nvy = p.vy * p.friction + p.gravity;

          return {
            ...p,
            x: p.x + nvx,
            y: p.y + nvy,
            vx: nvx,
            vy: nvy,
            life: newLife,
            twinklePhase: p.twinklePhase + 0.18,
          };
        })
        .filter((p): p is Particle => p !== null);

      particlesRef.current = [...updated, ...next];
      setRenderCount(c => c + 1);

      // Continue if any firework pending or particles alive
      const hasPending = fwRef.current.some(fw => !fw.hasBurst);
      if (hasPending || particlesRef.current.length > 0) {
        frameRef.current = requestAnimationFrame(loop);
      }
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  /* ─── Particle renderer ─── */
  const renderParticle = (p: Particle) => {
    const lifeRatio = p.life / p.maxLife;

    // Flash — radial gradient white burst
    if (p.type === 'flash') {
      const opacity = 1 - lifeRatio;
      const size = p.size * (1 - lifeRatio * 0.6);
      return (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: size,
            height: size,
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
            opacity,
          }}
        />
      );
    }

    let opacity: number;
    let size: number;

    switch (p.type) {
      case 'rise':
        opacity = (1 - lifeRatio) * 0.85;
        size = p.size * (1 - lifeRatio * 0.5);
        break;
      case 'burst': {
        // Hold bright, then fade in last 35%
        const fadeStart = 0.65;
        opacity = lifeRatio < fadeStart
          ? 1
          : 1 - (lifeRatio - fadeStart) / (1 - fadeStart);
        // Twinkle effect
        if (p.twinkle) {
          opacity *= 0.45 + 0.55 * Math.sin(p.twinklePhase);
        }
        size = p.size * (1 - lifeRatio * 0.25);
        break;
      }
      case 'crackle':
        opacity = (1 - lifeRatio) * 0.95;
        size = p.size * (1 - lifeRatio * 0.6);
        break;
      default:
        opacity = 1 - lifeRatio;
        size = p.size;
    }

    if (opacity <= 0.01 || size <= 0.2) return null;

    const isBurst = p.type === 'burst';
    const glowRadius = isBurst ? size * 3 : size * 1.5;

    return (
      <div
        key={p.id}
        className="absolute rounded-full"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: size,
          height: size,
          transform: 'translate(-50%,-50%)',
          backgroundColor: p.color,
          boxShadow: isBurst
            ? `0 0 ${glowRadius}px ${p.color}, 0 0 ${glowRadius * 0.4}px ${p.color}`
            : `0 0 ${glowRadius * 0.6}px ${p.color}`,
          opacity: Math.min(1, Math.max(0, opacity)),
          willChange: 'transform, opacity',
        }}
      />
    );
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-10"
      data-rc={renderCount}
    >
      {/* ── Sky glow — aasmaan roshan hota hai jab phat ta hai ── */}
      {skyGlows.map(g => (
        <div
          key={`sky-${g.id}`}
          className="absolute"
          style={{
            left: `${g.x}%`,
            top: `${g.y}%`,
            width: '55vw',
            height: '55vw',
            transform: 'translate(-50%,-50%)',
            background: `radial-gradient(circle, ${g.color}18 0%, ${g.color}08 40%, transparent 70%)`,
            filter: 'blur(25px)',
            animation: 'skyGlow 0.6s ease-out forwards',
          }}
        />
      ))}

      {/* ── Ground reflection — zameen par roshni ── */}
      {skyGlows.map(g => (
        <div
          key={`gnd-${g.id}`}
          className="absolute"
          style={{
            left: `${g.x}%`,
            bottom: 0,
            width: '35vw',
            height: '18vh',
            transform: 'translateX(-50%)',
            background: `linear-gradient(to top, ${g.color}0a 0%, transparent 100%)`,
            filter: 'blur(18px)',
            animation: 'skyGlow 0.7s ease-out forwards',
          }}
        />
      ))}

      {/* ── All particles ── */}
      {particlesRef.current.map(renderParticle)}

      <style jsx>{`
        @keyframes skyGlow {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.4);
          }
        }
      `}</style>
    </div>
  );
}
