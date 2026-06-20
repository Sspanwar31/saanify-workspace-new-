'use client';

export default function SunGlow() {
  return (
    <>
      <style jsx>{`
        @keyframes sunPulse {
          0% {
            transform: translateX(-50%) scale(1);
          }

          50% {
            transform: translateX(-50%) scale(1.08);
          }

          100% {
            transform: translateX(-50%) scale(1);
          }
        }

        @keyframes glowPulse {
          0% {
            opacity: 0.7;
          }

          50% {
            opacity: 1;
          }

          100% {
            opacity: 0.7;
          }
        }
      `}</style>

      {/* Outer Glow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          top: '90px',
          width: '320px',
          height: '320px',
          background:
            'radial-gradient(circle, rgba(255,220,120,.85) 0%, rgba(255,180,60,.45) 45%, transparent 80%)',
          filter: 'blur(40px)',
          animation: 'glowPulse 6s ease-in-out infinite',
          zIndex: 1,
        }}
      />

      {/* Core Sun */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          top: '160px',
          width: '150px',
          height: '140px',
          background:
            'radial-gradient(circle, #FFE28A 0%, #FFC857 65%, #FFB347 100%)',
          boxShadow:
            '0 0 40px rgba(255,211,106,.9), 0 0 80px rgba(255,179,71,.6)',
          animation: 'sunPulse 6s ease-in-out infinite',
          zIndex: 2,
        }}
      />
    </>
  );
}
