'use client';

import { useState, useEffect, memo } from 'react';

const HoliAmbient = memo(() => {
  const [drops, setDrops] = useState<any[]>([]);

  useEffect(() => {
    const colors = [
      'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), #ff006e 55%, #9d174d 100%)',
      'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), #ffbe0b 55%, #b45309 100%)',
      'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), #00f5d4 55%, #0f766e 100%)',
      'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), #3a86ff 55%, #1e40af 100%)',
      'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), #8338ec 55%, #581c87 100%)',
      'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), #fb5607 55%, #c2410c 100%)',
    ];

    const generated = Array.from({ length: 45 }, (_, i) => {
      const size = Math.random() * 10 + 6;
      return {
        id: i,
        size,
        duration: Math.random() * 4 + 3,
        delay: -(Math.random() * 7),
        left: Math.random() * 100,
        drift: Math.random() * 80 - 40,
        bg: colors[Math.floor(Math.random() * colors.length)],
        blur: size > 12 ? 1 : 0,
      };
    });
    setDrops(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes holi-drop-fall {
          0% { transform: translateY(-30px) translateX(0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.95; }
          25% { transform: translateY(25vh) translateX(calc(var(--d) * 0.3px)) rotate(15deg); opacity: 0.9; }
          50% { transform: translateY(50vh) translateX(calc(var(--d) * -0.2px)) rotate(-10deg); opacity: 0.8; }
          75% { transform: translateY(75vh) translateX(calc(var(--d) * 0.15px)) rotate(20deg); opacity: 0.5; }
          100% { transform: translateY(105vh) translateX(calc(var(--d) * -0.05px)) rotate(-5deg); opacity: 0; }
        }
      `}</style>

      {drops.map(d => (
        <div
          key={d.id}
          className="absolute will-change-transform"
          style={{
            width: d.size * 0.7,
            height: d.size,
            left: `${d.left}%`,
            top: '-4%',
            background: d.bg,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            filter: `blur(${d.blur}px)`,
            boxShadow: `0 0 ${d.size * 0.5}px ${d.size * 0.15}px rgba(0,0,0,0.15)`,
            animation: `holi-drop-fall ${d.duration}s ${d.delay}s linear infinite`,
            ['--d' as string]: d.drift,
          }}
        />
      ))}
    </div>
  );
});

HoliAmbient.displayName = 'HoliAmbient';
export default HoliAmbient;
