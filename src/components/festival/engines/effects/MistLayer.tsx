'use client';

export default function MistLayer() {
  const mistLayers = Array.from({ length: 6 });

  return (
    <>
      {mistLayers.map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: `${300 + i * 120}px`,
            height: `${120 + i * 40}px`,
            left: `${-10 + i * 15}%`,
            bottom: `${5 + i * 4}%`,
            background:
              'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)',
            animation: `mistDrift ${25 + i * 5}s linear infinite`,
            opacity: 0.7,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes mistDrift {
          0% {
            transform: translateX(-50px);
          }

          50% {
            transform: translateX(50px);
          }

          100% {
            transform: translateX(-50px);
          }
        }
      `}</style>
    </>
  );
}
