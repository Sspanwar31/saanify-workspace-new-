'use client';

export default function GhatLampRows() {
  return (
    <div className="absolute bottom-[12%] left-0 w-full pointer-events-none overflow-hidden">

      {/* Row 1 */}
      <div className="flex justify-evenly mb-4 opacity-90">
        {Array.from({ length: 12 }).map((_, i) => (
          <Lamp key={`r1-${i}`} size={12} />
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex justify-evenly mb-4 opacity-75">
        {Array.from({ length: 10 }).map((_, i) => (
          <Lamp key={`r2-${i}`} size={10} />
        ))}
      </div>

      {/* Row 3 */}
      <div className="flex justify-evenly opacity-60">
        {Array.from({ length: 8 }).map((_, i) => (
          <Lamp key={`r3-${i}`} size={8} />
        ))}
      </div>

    </div>
  );
}

function Lamp({ size }: { size: number }) {
  return (
    <div
      className="relative rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: '#FFD36A',
        boxShadow: `
          0 0 10px #FFD36A,
          0 0 20px rgba(255,211,106,.7),
          0 0 40px rgba(255,180,60,.5)
        `,
        animation: 'lampFlicker 3s ease-in-out infinite',
      }}
    >
      <style jsx>{`
        @keyframes lampFlicker {
          0%,100% {
            opacity: 0.8;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
