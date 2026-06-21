'use client';

export default function ArghyaReflection() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* 🌊 Water base — warm teal, dark bg pe dikhega */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '32%',
          background: `
            linear-gradient(
              to top,
              rgba(0, 60, 90, 0.5),
              rgba(0, 90, 120, 0.25),
              transparent
            )
          `,
        }}
      />

      {/* ☀️ Sun reflection — wider, brighter, animated shimmer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0"
        style={{
          width: '60%',
          maxWidth: '320px',
          height: '32%',
          background: `
            linear-gradient(
              to top,
              rgba(255, 210, 80, 0.5),
              rgba(255, 180, 50, 0.2),
              transparent
            )
          `,
          filter: 'blur(18px)',
          animation: 'arghyaShimmer 3s ease-in-out infinite',
        }}
      />

      {/* ✨ Bright center streak */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0"
        style={{
          width: '4px',
          height: '28%',
          background: `
            linear-gradient(
              to top,
              rgba(255, 240, 150, 0.7),
              rgba(255, 220, 100, 0.3),
              transparent
            )
          `,
          filter: 'blur(4px)',
          animation: 'arghyaStreak 4s ease-in-out infinite',
        }}
      />

      {/* 🌊 Ripple waves — visible, animated */}
      <div className="absolute bottom-0 left-0 w-full" style={{ height: '32%' }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 w-full"
            style={{
              bottom: `${i * 4}%`,
              height: '1px',
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 220, 120, ${0.15 - i * 0.015}) 30%, 
                rgba(255, 240, 160, ${0.2 - i * 0.02}) 50%, 
                rgba(255, 220, 120, ${0.15 - i * 0.015}) 70%, 
                transparent 100%
              )`,
              animation: `arghyaRipple ${2.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>

      {/* 💫 Floating sparkles on water */}
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={`sp-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${20 + Math.sin(i * 47) * 30}%`,
            bottom: `${2 + (i * 2.5) % 28}%`,
            width: `${1.5 + (i % 3)}px`,
            height: `${1.5 + (i % 3)}px`,
            background: 'rgba(255, 230, 140, 0.8)',
            boxShadow: '0 0 4px rgba(255, 200, 80, 0.6)',
            animation: `arghyaSparkle ${2 + (i % 4)}s ease-in-out ${i * 0.5}s infinite`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes arghyaShimmer {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50%      { opacity: 1; transform: translateX(-50%) scaleX(1.15); }
        }

        @keyframes arghyaStreak {
          0%, 100% { opacity: 0.5; height: 28%; }
          50%      { opacity: 0.9; height: 30%; }
        }

        @keyframes arghyaRipple {
          0%, 100% { 
            opacity: 0.3; 
            transform: scaleX(0.95) translateX(0); 
          }
          25%      { 
            opacity: 0.7; 
            transform: scaleX(1.02) translateX(2px); 
          }
          50%      { 
            opacity: 0.4; 
            transform: scaleX(0.98) translateX(-1px); 
          }
          75%      { 
            opacity: 0.8; 
            transform: scaleX(1.01) translateX(1px); 
          }
        }

        @keyframes arghyaSparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          15%      { opacity: 1; transform: scale(1.2); }
          40%      { opacity: 0.6; transform: scale(0.8); }
          60%      { opacity: 0.9; transform: scale(1.1); }
          85%      { opacity: 0; transform: scale(0); }
        }
      `}</style>
    </div>
  );
}
