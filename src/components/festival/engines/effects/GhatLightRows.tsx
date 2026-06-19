'use client';

export default function GhatLightRows() {
  const rows = 6;
  const lightsPerRow = 40;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="absolute flex justify-center gap-3"
          style={{
            bottom: `${8 + rowIndex * 4}%`,
            left: '50%',
            transform: `translateX(-50%) scale(${1 - rowIndex * 0.08})`,
            opacity: 1 - rowIndex * 0.08,
          }}
        >
          {Array.from({ length: lightsPerRow }).map((_, lightIndex) => (
            <div
              key={lightIndex}
              className="rounded-full"
              style={{
                width: '8px',
                height: '8px',
                background:
                  'radial-gradient(circle, #fff5c4 0%, #ffcc66 40%, #ff9900 70%, transparent 100%)',
                boxShadow:
                  '0 0 8px rgba(255,220,120,0.9), 0 0 18px rgba(255,170,0,0.6)',
                animation: `ghatFlicker ${
                  2 + Math.random() * 3
                }s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      ))}

      <style jsx>{`
        @keyframes ghatFlicker {
          0% {
            opacity: 0.7;
            transform: scale(0.95);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }

          100% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}
