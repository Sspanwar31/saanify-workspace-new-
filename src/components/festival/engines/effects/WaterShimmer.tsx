'use client';

function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function WaterShimmer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Moving shimmer streak */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{ height: '30%' }}
      >
        <div
          className="absolute"
          style={{
            width: '45%',
            height: '100%',
            background:
              'linear-gradient(90deg, transparent, rgba(255,220,120,0.3), transparent)',
            filter: 'blur(25px)',
            animation: 'shimmerSlide 7s ease-in-out infinite',
          }}
        />
        <div
          className="absolute"
          style={{
            width: '30%',
            height: '100%',
            left: '20%',
            background:
              'linear-gradient(90deg, transparent, rgba(255,200,80,0.15), transparent)',
            filter: 'blur(35px)',
            animation: 'shimmerSlide 11s ease-in-out 3s infinite reverse',
          }}
        />
      </div>

      {/* Base golden glow */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '25%',
          background:
            'linear-gradient(to top, rgba(255,210,120,0.15), transparent)',
          animation: 'waterGlow 5s ease-in-out infinite',
        }}
      />

      {/* Sparkles — seeded, no Math.random */}
      {Array.from({ length: 18 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${sr(i * 31 + 7) * 100}%`,
            bottom: `${3 + sr(i * 37 + 11) * 22}%`,
            width: `${1.5 + sr(i * 41 + 13) * 3}px`,
            height: `${1.5 + sr(i * 43 + 17) * 3}px`,
            background: '#FFF4B5',
            boxShadow: '0 0 6px rgba(255,211,106,0.7)',
            animation: `sparklePulse ${2.5 + sr(i * 47 + 19) * 3}s ease-in-out ${sr(i * 53 + 23) * 4}s infinite`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes shimmerSlide {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }

        @keyframes waterGlow {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.9; }
        }

        @keyframes sparklePulse {
          0%, 100% { opacity: 0; transform: scale(0); }
          20%      { opacity: 1; transform: scale(1.3); }
          50%      { opacity: 0.6; transform: scale(0.9); }
          80%      { opacity: 0; transform: scale(0); }
        }
      `}</style>
    </div>
  );
}
