'use client';

function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function SunriseRays() {
  const rays = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * 180; // 0° to 180° — semicircle downward
    const width = 1.5 + sr(i * 31 + 7) * 3;
    const length = 25 + sr(i * 37 + 11) * 35;
    const dur = 4 + sr(i * 41 + 13) * 5;
    const delay = sr(i * 43 + 17) * 6;
    const peakOpacity = 0.15 + sr(i * 47 + 19) * 0.25;
    return { angle, width, length, dur, delay, peakOpacity, id: i };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Core sun glow */}
      <div
        className="absolute"
        style={{
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          height: '55%',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255,220,120,0.5) 0%, rgba(255,180,60,0.2) 30%, rgba(255,140,0,0.05) 55%, transparent 75%)',
          animation: 'sunGlow 7s ease-in-out infinite',
        }}
      />

      {/* Hot center point */}
      <div
        className="absolute"
        style={{
          top: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '60px',
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(255,250,220,0.7) 0%, rgba(255,220,120,0.3) 40%, transparent 70%)',
          filter: 'blur(8px)',
          animation: 'sunGlow 5s ease-in-out 1s infinite',
        }}
      />

      {/* ✨ Actual rays radiating downward */}
      <div
        className="absolute"
        style={{
          top: '8%',
          left: '50%',
          width: '0',
          height: '0',
        }}
      >
        {rays.map((r) => (
          <div
            key={r.id}
            className="absolute"
            style={{
              width: `${r.length}vw`,
              height: `${r.width}px`,
              left: '0',
              top: '0',
              transformOrigin: '0 0',
              transform: `rotate(${r.angle}deg)`,
              background: `linear-gradient(90deg, 
                rgba(255,220,120,${r.peakOpacity}) 0%, 
                rgba(255,200,80,${r.peakOpacity * 0.4}) 40%, 
                transparent 100%
              )`,
              filter: 'blur(3px)',
              animation: `rayPulse ${r.dur}s ease-in-out ${r.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Secondary soft wide rays */}
      <div
        className="absolute"
        style={{
          top: '8%',
          left: '50%',
          width: '0',
          height: '0',
        }}
      >
        {Array.from({ length: 7 }, (_, i) => {
          const angle = 10 + (i / 7) * 160;
          return (
            <div
              key={`soft-${i}`}
              className="absolute"
              style={{
                width: `${35 + sr(i * 71 + 53) * 25}vw`,
                height: `${8 + sr(i * 73 + 59) * 12}px`,
                left: '0',
                top: '0',
                transformOrigin: '0 0',
                transform: `rotate(${angle}deg)`,
                background: `linear-gradient(90deg, 
                  rgba(255,200,80,0.08) 0%, 
                  rgba(255,180,60,0.03) 50%, 
                  transparent 100%
                )`,
                filter: 'blur(10px)',
                animation: `rayPulse ${6 + sr(i * 79 + 61) * 4}s ease-in-out ${sr(i * 83 + 67) * 5}s infinite`,
              }}
            />
          );
        })}
      </div>

      <style jsx>{`
        @keyframes sunGlow {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50%      { opacity: 1; transform: translateX(-50%) scale(1.06); }
        }

        @keyframes rayPulse {
          0%, 100% { opacity: 0.4; }
          30%      { opacity: 1; }
          60%      { opacity: 0.5; }
          80%      { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
