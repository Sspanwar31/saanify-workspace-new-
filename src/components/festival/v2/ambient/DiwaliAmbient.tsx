'use client';

import { useState, useEffect, memo } from 'react';

const DiwaliAmbient = memo(() => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const count = 50;
    const blurWeights = [0, 0, 0, 0, 1, 1, 2];

    const generated = Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 6 + 2;
      const isLargeSpark = size > 6;
      const isMediumEmber = size > 3.5 && !isLargeSpark;

      return {
        id: i,
        size,
        duration: Math.random() * 9 + 6,
        delay: -(Math.random() * 15),
        left: Math.random() * 100,
        blur: blurWeights[Math.floor(Math.random() * blurWeights.length)],
        drift: Math.random() * 55 + 15,
        glowMultiplier: isLargeSpark ? 3.5 : isMediumEmber ? 2.2 : 1.4,
        brightness: isLargeSpark ? 1.3 : isMediumEmber ? 1.05 : 0.85,
        highlightX: 30 + Math.random() * 15,
        highlightY: 30 + Math.random() * 15,
      };
    });
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes ember-rise {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          5% { opacity: 0.85; }
          18% { transform: translateY(-18vh) translateX(calc(var(--d) * -0.55px)) rotate(65deg); opacity: 1; }
          35% { transform: translateY(-35vh) translateX(calc(var(--d) * 0.4px)) rotate(130deg); opacity: 0.7; }
          52% { transform: translateY(-52vh) translateX(calc(var(--d) * -0.28px)) rotate(195deg); opacity: 1; }
          70% { transform: translateY(-70vh) translateX(calc(var(--d) * 0.18px)) rotate(260deg); opacity: 0.55; }
          88% { opacity: 0.25; }
          100% { transform: translateY(-112vh) translateX(calc(var(--d) * -0.08px)) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {particles.map(p => {
        const glowR = p.size * p.glowMultiplier;
        const glowR2 = glowR * 1.8;

        return (
          <div
            key={p.id}
            className="absolute rounded-full will-change-transform"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: '-4%',
              background: `radial-gradient(circle at ${p.highlightX}% ${p.highlightY}%, #fef9c3 0%, #fbbf24 28%, #d97706 65%, #78350f 100%)`,
              boxShadow: `
                0 0 ${glowR}px ${glowR * 0.35}px rgba(251, 191, 36, 0.55),
                0 0 ${glowR2}px ${glowR * 0.7}px rgba(217, 119, 6, 0.18)
              `,
              filter: `blur(${p.blur}px) brightness(${p.brightness})`,
              animation: `ember-rise ${p.duration}s ${p.delay}s linear infinite`,
              ['--d' as string]: p.drift,
            }}
          />
        );
      })}
    </div>
  );
});

DiwaliAmbient.displayName = 'DiwaliAmbient';
export default DiwaliAmbient;
