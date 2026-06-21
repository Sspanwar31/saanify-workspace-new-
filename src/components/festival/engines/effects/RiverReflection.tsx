'use client';

function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function RiverReflection() {
  return (
    <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none"
      style={{ height: '32%' }}
    >
      {/* Water tint — no backdrop-filter */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(255,140,0,0.12), rgba(255,215,0,0.05), transparent)',
        }}
      />

      {/* Reflection streaks */}
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="absolute bottom-0"
          style={{
            left: `${8 + sr(i * 59 + 31) * 84}%`,
            width: `${3 + sr(i * 61 + 37) * 5}px`,
            height: '100%',
            background: `linear-gradient(to top,
              rgba(255,215,0,${0.5 + sr(i * 67 + 41) * 0.4}),
              rgba(255,215,0,${0.1 + sr(i * 71 + 43) * 0.15}),
              transparent
            )`,
            filter: `blur(${4 + sr(i * 73 + 47) * 4}px)`,
            animation: `riverShimmer ${3 + sr(i * 79 + 53) * 3}s ease-in-out ${sr(i * 83 + 59) * 3}s infinite`,
          }}
        />
      ))}

      {/* Horizontal wave lines */}
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={`w-${i}`}
          className="absolute left-0 w-full"
          style={{
            bottom: `${3 + i * 5}%`,
            height: '1px',
            background: `linear-gradient(90deg,
              transparent 5%,
              rgba(255,220,120,${0.08 + sr(i * 89 + 61) * 0.1}) 30%,
              rgba(255,240,160,${0.12 + sr(i * 97 + 67) * 0.1}) 50%,
              rgba(255,220,120,${0.08 + sr(i * 101 + 71) * 0.1}) 70%,
              transparent 95%
            )`,
            animation: `waveDrift ${4 + i * 0.8}s ease-in-out ${i * 0.5}s infinite`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes riverShimmer {
          0%, 100% { transform: scaleY(0.7); opacity: 0.2; }
          35%      { transform: scaleY(1.3); opacity: 0.9; }
          65%      { transform: scaleY(0.9); opacity: 0.5; }
        }

        @keyframes waveDrift {
          0%, 100% { transform: scaleX(0.96) translateX(0); opacity: 0.3; }
          30%      { transform: scaleX(1.02) translateX(3px); opacity: 0.7; }
          60%      { transform: scaleX(0.98) translateX(-2px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
