'use client';

import React, { useRef, useEffect } from 'react';

export default function RakhiHero() {
  const svgRef = useRef<SVGSVGElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 🧬 2027: Dynamic floating particles via Canvas (GPU-accelerated)
    const container = particlesRef.current;
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 260, h = 200;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    interface P { x:number;y:number;vx:number;vy:number;r:number;life:number;maxLife:number;hue:number;type:'glow'|'spark'|'dust'; }
    const particles: P[] = [];
    const spawn = () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 70;
      particles.push({
        x: w/2 + Math.cos(angle) * dist,
        y: h/2 + Math.sin(angle) * dist,
        vx: (Math.random() - .5) * .4,
        vy: -.15 - Math.random() * .5,
        r: .4 + Math.random() * 1.8,
        life: 0, maxLife: 80 + Math.random() * 120,
        hue: Math.random() > .5 ? 45 + Math.random()*15 : 350 + Math.random()*20,
        type: Math.random() > .7 ? 'spark' : Math.random() > .4 ? 'glow' : 'dust',
      });
    };

    let frame = 0;
    let running = true;
    const animate = () => {
      if (!running) return;
      frame++;
      if (frame % 3 === 0 && particles.length < 60) spawn();
      ctx.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++; p.x += p.vx; p.y += p.vy;
        if (p.type === 'spark') { p.vx *= .97; p.vy *= .98; p.vy += .003; }
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
        const t = p.life / p.maxLife;
        const alpha = t < .15 ? t / .15 : 1 - Math.pow((t - .15) / .85, 2);
        ctx.save(); ctx.globalAlpha = alpha * .8;
        if (p.type === 'glow') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          g.addColorStop(0, `hsla(${p.hue},90%,75%,0.6)`);
          g.addColorStop(1, `hsla(${p.hue},90%,75%,0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = `hsla(${p.hue},85%,80%,1)`;
        ctx.shadowColor = `hsla(${p.hue},90%,70%,.8)`;
        ctx.shadowBlur = p.type === 'spark' ? 8 : 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(animate);
    };
    animate();
    return () => { running = false; canvas.remove(); };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[200px] select-none pointer-events-none" ref={particlesRef}>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* ═══ 2027 ANIMATION ENGINE ═══ */
        
        /* Organic silk flow via CSS Houdini-style multi-axis transforms */
        @keyframes silk-flow-L {
          0%, 100% { transform: rotate(0deg) skewY(0deg) scaleX(1); }
          25% { transform: rotate(-2.5deg) skewY(-1.8deg) scaleX(1.02); }
          50% { transform: rotate(-4deg) skewY(-3deg) scaleX(1.04); }
          75% { transform: rotate(-2deg) skewY(-1.5deg) scaleX(1.01); }
        }
        @keyframes silk-flow-R {
          0%, 100% { transform: rotate(0deg) skewY(0deg) scaleX(1); }
          25% { transform: rotate(2.5deg) skewY(1.8deg) scaleX(1.02); }
          50% { transform: rotate(4deg) skewY(3deg) scaleX(1.04); }
          75% { transform: rotate(2deg) skewY(1.5deg) scaleX(1.01); }
        }
        
        /* Ultra-slow cinematic rotation with subtle wobble */
        @keyframes orbit-outer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbit-middle {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes orbit-inner {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.04); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        /* Breathing energy core */
        @keyframes core-breathe {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(220,38,38,0.8)) drop-shadow(0 0 20px rgba(251,191,36,0.3)); }
          50% { transform: scale(1.12); filter: drop-shadow(0 0 18px rgba(220,38,38,1)) drop-shadow(0 0 40px rgba(251,191,36,0.6)) drop-shadow(0 0 60px rgba(219,39,119,0.3)); }
        }
        
        /* Holographic shimmer sweep */
        @keyframes holo-sweep {
          0% { transform: translateX(-150%) skewX(-15deg); }
          100% { transform: translateX(250%) skewX(-15deg); }
        }
        
        /* Energy ring pulse */
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes ring-pulse-alt {
          0%, 100% { transform: scale(1.05); opacity: 0.4; }
          50% { transform: scale(0.97); opacity: 0.8; }
        }
        
        /* Pearl shimmer */
        @keyframes pearl-shimmer {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        
        /* Background nebula drift */
        @keyframes nebula-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3px, -2px) scale(1.03); }
          66% { transform: translate(-2px, 3px) scale(0.98); }
        }

        .silk-L { animation: silk-flow-L 4s ease-in-out infinite; transform-origin: right center; }
        .silk-R { animation: silk-flow-R 4s ease-in-out infinite; transform-origin: left center; }
        .orbit-o { animation: orbit-outer 20s linear infinite; }
        .orbit-m { animation: orbit-middle 14s linear infinite; }
        .orbit-i { animation: orbit-inner 8s ease-in-out infinite; }
        .core-breathe { animation: core-breathe 3s ease-in-out infinite; }
        .ring-p { animation: ring-pulse 3s ease-in-out infinite; }
        .ring-p-alt { animation: ring-pulse-alt 2.5s ease-in-out infinite; }
        .pearl-s { animation: pearl-shimmer 2s ease-in-out infinite; }
        .nebula { animation: nebula-drift 8s ease-in-out infinite; }
        
        .holo-bar {
          animation: holo-sweep 3.5s ease-in-out infinite;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.15) 70%, transparent 100%);
        }
      `}} />

      <svg
        ref={svgRef}
        width="260" height="200" viewBox="0 0 260 200"
        className="overflow-visible"
        style={{ filter: 'contrast(1.05) saturate(1.1)' }}
      >
        <defs>
          {/* ═══ 2027 FILTER STACK ═══ */}
          
          {/* Deep cinematic blur for background elements */}
          <filter id="r-bg-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
          </filter>

          {/* Soft glow for threads */}
          <filter id="r-thread-glow" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Multi-layered neon bloom for petals */}
          <filter id="r-petal-bloom" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b2" />
            <feMerge>
              <feMergeNode in="b2"/>
              <feMergeNode in="b1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Metallic chrome sheen for gold ring */}
          <filter id="r-chrome" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="shadow" />
            <feOffset dx="0" dy="2" in="shadow" result="offShadow" />
            <feFlood floodColor="rgba(0,0,0,0.4)" result="shadowColor"/>
            <feComposite in="shadowColor" in2="offShadow" operator="in" result="coloredShadow"/>
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="glow" />
            <feMerge>
              <feMergeNode in="coloredShadow"/>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Hyper-glow for center core */}
          <filter id="r-core-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="b3" />
            <feMerge>
              <feMergeNode in="b3"/>
              <feMergeNode in="b2"/>
              <feMergeNode in="b1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Holographic iridescent displacement */}
          <filter id="r-holo" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="5" result="noise">
              <animate attributeName="seed" from="0" to="100" dur="8s" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
          </filter>

          {/* Turbulent organic thread distortion */}
          <filter id="r-silk-distort" x="-10%" y="-30%" width="120%" height="160%">
            <feTurbulence type="turbulence" baseFrequency="0.015 0.04" numOctaves="3" seed="42" result="turb">
              <animate attributeName="baseFrequency" values="0.015 0.04;0.018 0.045;0.015 0.04" dur="6s" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="turb" scale="8" xChannelSelector="R" yChannelSelector="G"/>
          </filter>

          {/* ═══ 2027 GRADIENT MESH SIMULATION ═══ */}

          {/* Holographic silk thread — shifts between gold, crimson, magenta */}
          <linearGradient id="g-silk-holo" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,191,36,0)">
              <animate attributeName="stopColor" values="rgba(251,191,36,0);rgba(219,39,119,0);rgba(251,191,36,0)" dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="20%" stopColor="#fbbf24">
              <animate attributeName="stopColor" values="#fbbf24;#f472b6;#fbbf24" dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="40%" stopColor="#dc2626">
              <animate attributeName="stopColor" values="#dc2626;#c026d3;#dc2626" dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="60%" stopColor="#db2777">
              <animate attributeName="stopColor" values="#db2777;#f59e0b;#db2777" dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="80%" stopColor="#fbbf24">
              <animate attributeName="stopColor" values="#fbbf24;#ec4899;#fbbf24" dur="4s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="rgba(251,191,36,0)">
              <animate attributeName="stopColor" values="rgba(251,191,36,0);rgba(219,39,119,0);rgba(251,191,36,0)" dur="4s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          {/* Ultra metallic gold with chrome reflections */}
          <linearGradient id="g-chrome-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b3a1f"/>
            <stop offset="15%" stopColor="#d97706"/>
            <stop offset="30%" stopColor="#fef3c7"/>
            <stop offset="45%" stopColor="#fbbf24"/>
            <stop offset="55%" stopColor="#fffbeb"/>
            <stop offset="70%" stopColor="#f59e0b"/>
            <stop offset="85%" stopColor="#b45309"/>
            <stop offset="100%" stopColor="#6b3a1f"/>
          </linearGradient>

          {/* Deep crimson-to-magenta petal gradient */}
          <radialGradient id="g-petal" cx="30%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#fca5a5"/>
            <stop offset="35%" stopColor="#dc2626"/>
            <stop offset="70%" stopColor="#be123c"/>
            <stop offset="100%" stopColor="#881337"/>
          </radialGradient>

          {/* Pearl with holographic sheen */}
          <radialGradient id="g-pearl" cx="30%" cy="25%" r="65%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="30%" stopColor="#f8fafc"/>
            <stop offset="60%" stopColor="#e2e8f0"/>
            <stop offset="85%" stopColor="#cbd5e1"/>
            <stop offset="100%" stopColor="#94a3b8"/>
          </radialGradient>

          {/* Core energy gradient */}
          <radialGradient id="g-core" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#fef2f2"/>
            <stop offset="25%" stopColor="#fca5a5"/>
            <stop offset="50%" stopColor="#dc2626"/>
            <stop offset="80%" stopColor="#991b1b"/>
            <stop offset="100%" stopColor="#450a0a"/>
          </radialGradient>

          {/* Energy ring gradient */}
          <linearGradient id="g-ring-energy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(251,191,36,0)">
              <animate attributeName="stopColor" values="rgba(251,191,36,0);rgba(219,39,119,0.3);rgba(251,191,36,0)" dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="rgba(251,191,36,0.8)">
              <animate attributeName="stopColor" values="rgba(251,191,36,0.8);rgba(244,114,182,0.9);rgba(251,191,36,0.8)" dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="rgba(251,191,36,0)">
              <animate attributeName="stopColor" values="rgba(251,191,36,0);rgba(219,39,119,0.3);rgba(251,191,36,0)" dur="3s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>

          {/* Clip for holographic sweep */}
          <clipPath id="r-main-clip">
            <circle cx="130" cy="100" r="58"/>
          </clipPath>
        </defs>

        {/* ════════════════════════════════════════════════
             LAYER 0: DEEP BACKGROUND NEBULA
             ════════════════════════════════════════════════ */}
        <g className="nebula" filter="url(#r-bg-blur)">
          <circle cx="130" cy="100" r="85" fill="rgba(220,38,38,0.08)"/>
          <circle cx="120" cy="90" r="60" fill="rgba(251,191,36,0.06)"/>
          <circle cx="140" cy="110" r="50" fill="rgba(219,39,119,0.05)"/>
        </g>

        {/* Ambient light field */}
        <circle cx="130" cy="100" r="95" fill="none" stroke="rgba(251,191,36,0.04)" strokeWidth="40" filter="url(#r-bg-blur)"/>

        {/* ════════════════════════════════════════════════
             LAYER 1: ORGANIC SILK THREADS (turbulence-distorted)
             ════════════════════════════════════════════════ */}
        <g className="silk-L" filter="url(#r-silk-distort)">
          <path d="M 5 100 C 25 82, 50 118, 75 98 S 110 108, 130 100" 
                fill="none" stroke="url(#g-silk-holo)" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
          <path d="M 20 100 C 40 88, 60 112, 85 100 S 115 105, 130 100" 
                fill="none" stroke="url(#g-silk-holo)" strokeWidth="2.8" strokeLinecap="round" opacity="0.5"/>
          {/* Micro-fine accent thread */}
          <path d="M 35 100 C 50 92, 68 108, 90 99 S 118 103, 130 100" 
                fill="none" stroke="rgba(254,240,138,0.25)" strokeWidth="1" strokeLinecap="round"/>
        </g>
        <g className="silk-R" filter="url(#r-silk-distort)">
          <path d="M 130 100 C 150 92, 175 108, 195 95 S 225 110, 255 100" 
                fill="none" stroke="url(#g-silk-holo)" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
          <path d="M 130 100 C 148 95, 170 108, 188 97 S 215 106, 240 100" 
                fill="none" stroke="url(#g-silk-holo)" strokeWidth="2.8" strokeLinecap="round" opacity="0.5"/>
          <path d="M 130 100 C 145 96, 165 107, 182 98 S 210 104, 225 100" 
                fill="none" stroke="rgba(254,240,138,0.25)" strokeWidth="1" strokeLinecap="round"/>
        </g>

        {/* ════════════════════════════════════════════════
             LAYER 2: ENERGY RINGS (pulsing, color-shifting)
             ════════════════════════════════════════════════ */}
        <g transform="translate(130,100)">
          <circle className="ring-p" cx="0" cy="0" r="62" fill="none" stroke="url(#g-ring-energy)" strokeWidth="1.5" opacity="0.5"/>
          <circle className="ring-p-alt" cx="0" cy="0" r="56" fill="none" stroke="url(#g-ring-energy)" strokeWidth="0.8" opacity="0.3" strokeDasharray="4 8"/>
          {/* Rotating dashed energy ring */}
          <g className="orbit-o" style={{animationDuration: '30s'}}>
            <circle cx="0" cy="0" r="68" fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="0.5" strokeDasharray="2 12"/>
          </g>
        </g>

        {/* ════════════════════════════════════════════════
             LAYER 3: OUTER SILK PETALS (neon bloom + holo)
             ════════════════════════════════════════════════ */}
        <g transform="translate(130,100)">
          <g className="orbit-o" filter="url(#r-petal-bloom)">
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i * 22.5 * Math.PI) / 180;
              const dist = 46;
              const x = Math.cos(angle) * dist;
              const y = Math.sin(angle) * dist;
              const petalLen = i % 2 === 0 ? 16 : 12;
              const petalW = i % 2 === 0 ? 7 : 5.5;
              return (
                <g key={i} transform={`translate(${x}, ${y}) rotate(${i * 22.5})`}>
                  <ellipse cx="0" cy="0" rx={petalW} ry={petalLen} fill="url(#g-petal)" opacity={i % 2 === 0 ? 0.9 : 0.55}/>
                  <ellipse cx="0" cy="0" rx={petalW} ry={petalLen} fill="none" stroke="rgba(251,191,36,0.5)" strokeWidth="0.6"/>
                  {/* Inner vein highlight */}
                  <line x1="0" y1={-petalLen * 0.6} x2="0" y2={petalLen * 0.6} stroke="rgba(254,202,202,0.3)" strokeWidth="0.5"/>
                </g>
              );
            })}
          </g>
        </g>

        {/* ════════════════════════════════════════════════
             LAYER 4: MIDDLE CHROME RING + PEARLS
             ════════════════════════════════════════════════ */}
        <g transform="translate(130,100)">
          <g className="orbit-m" filter="url(#r-chrome)">
            {/* Outer chrome ring */}
            <circle cx="0" cy="0" r="36" fill="url(#g-chrome-gold)" stroke="#78350f" strokeWidth="0.8"/>
            {/* Inner deep magenta ring */}
            <circle cx="0" cy="0" r="32" fill="#831843" stroke="url(#g-chrome-gold)" strokeWidth="1.5"/>
            {/* Embossed detail ring */}
            <circle cx="0" cy="0" r="29" fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="0.5" strokeDasharray="2 3"/>

            {/* 10 Pearl beads with staggered shimmer */}
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * 36 * Math.PI) / 180;
              const pr = 22;
              const px = Math.cos(angle) * pr;
              const py = Math.sin(angle) * pr;
              return (
                <g key={i} className="pearl-s" style={{animationDelay: `${i * 0.2}s`}}>
                  <circle cx={px} cy={py} r="4" fill="url(#g-pearl)" stroke="rgba(148,163,184,0.5)" strokeWidth="0.4"/>
                  {/* Specular highlight */}
                  <circle cx={px - 1.2} cy={py - 1.2} r="1.2" fill="rgba(255,255,255,0.8)"/>
                </g>
              );
            })}
          </g>
        </g>

        {/* ════════════════════════════════════════════════
             LAYER 5: INNER DECORATIVE MANDALA
             ════════════════════════════════════════════════ */}
        <g transform="translate(130,100)">
          <g className="orbit-i">
            {/* 8 tiny gold accent petals */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const dist = 14;
              const x = Math.cos(angle) * dist;
              const y = Math.sin(angle) * dist;
              return (
                <g key={i} transform={`translate(${x}, ${y}) rotate(${i * 45 + 22.5})`}>
                  <ellipse cx="0" cy="0" rx="2.5" ry="5" fill="#fbbf24" opacity="0.7"/>
                  <ellipse cx="0" cy="0" rx="2.5" ry="5" fill="none" stroke="#fef3c7" strokeWidth="0.3"/>
                </g>
              );
            })}
            {/* Thin connecting ring */}
            <circle cx="0" cy="0" r="14" fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="0.5"/>
          </g>
        </g>

        {/* ════════════════════════════════════════════════
             LAYER 6: SACRED CORE (hyper-glow + breathing)
             ════════════════════════════════════════════════ */}
        <g transform="translate(130,100)">
          <g className="core-breathe" filter="url(#r-core-glow)">
            {/* Deep base */}
            <circle cx="0" cy="0" r="10" fill="url(#g-core)" stroke="#fbbf24" strokeWidth="1"/>
            {/* Bright inner hotspot */}
            <circle cx="0" cy="0" r="5" fill="rgba(254,226,226,0.5)"/>
            
            {/* Akshat (Rice) — refined */}
            <ellipse cx="-2.2" cy="-1.8" rx="0.8" ry="2.2" fill="#fffbeb" transform="rotate(30 -2.2 -1.8)" opacity="0.9"/>
            <ellipse cx="2.2" cy="1.8" rx="0.8" ry="2.2" fill="#fffbeb" transform="rotate(-30 2.2 1.8)" opacity="0.9"/>
            <ellipse cx="2" cy="-2" rx="0.7" ry="1.8" fill="#fef3c7" transform="rotate(60 2 -2)" opacity="0.6"/>
            <ellipse cx="-2" cy="2" rx="0.7" ry="1.8" fill="#fef3c7" transform="rotate(-60 -2 2)" opacity="0.6"/>
          </g>
        </g>

        {/* ════════════════════════════════════════════════
             LAYER 7: HOLOGRAPHIC SWEEP OVERLAY
             ════════════════════════════════════════════════ */}
        <g clipPath="url(#r-main-clip)" filter="url(#r-holo)">
          <rect className="holo-bar" x="-40" y="42" width="60" height="116" fill="rgba(255,255,255,0.12)" rx="4"/>
        </g>

        {/* ════════════════════════════════════════════════
             LAYER 8: TOP RIM LIGHT (cinematic depth cue)
             ════════════════════════════════════════════════ */}
        <ellipse cx="130" cy="55" rx="40" ry="4" fill="rgba(251,191,36,0.06)" filter="url(#r-bg-blur)"/>
        
      </svg>
    </div>
  );
}
