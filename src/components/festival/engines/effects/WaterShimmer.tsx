'use client';

export default function WaterShimmer() {
  return (
    <>
      <style jsx>{`
        @keyframes shimmerMove {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(120%);
          }
        }

        @keyframes waterPulse {
          0%,
          100% {
            opacity: 0.3;
          }

          50% {
            opacity: 0.8;
          }
        }
      `}</style>

      {/* Main Moving Reflection */}
      <div
        className="absolute bottom-0 left-0 w-full overflow-hidden"
        style={{
          height: '35%',
          zIndex: 4,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '40%',
            height: '100%',
            background:
              'linear-gradient(90deg, transparent, rgba(255,220,120,.35), transparent)',
            filter: 'blur(30px)',
            animation: 'shimmerMove 8s linear infinite',
          }}
        />
      </div>

      {/* Soft Golden Water Glow */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '30%',
          background:
            'linear-gradient(to top, rgba(255,210,120,.12), transparent)',
          animation: 'waterPulse 6s ease-in-out infinite',
          zIndex: 3,
        }}
      />

      {/* Random Sparkles */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `${5 + Math.random() * 25}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: '#FFF4B5',
            boxShadow: '0 0 10px #FFD36A',
            opacity: 0.6,
            animation: `waterPulse ${3 + Math.random() * 4}s ease-in-out infinite`,
            zIndex: 5,
          }}
        />
      ))}
    </>
  );
}
