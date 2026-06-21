'use client';

export default function FloatingTempleLamps() {
  const lamps = Array.from({ length: 28 });

  return (
    <>
      {lamps.map((_, i) => {
        const left = Math.random() * 100;

        const size = 20 + Math.random() * 30;

        const bottom = 10 + Math.random() * 55;

        const delay = Math.random() * 10;

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              bottom: `${bottom}%`,

              width: `${size}px`,
              height: `${size}px`,

              background:
                'radial-gradient(circle, #FFF5CC 0%, #FFD36A 30%, #FFB347 60%, rgba(255,140,0,.15) 100%)',

              boxShadow: `
                0 0 20px rgba(255,220,120,.95),
                0 0 40px rgba(255,180,0,.8),
                0 0 80px rgba(255,140,0,.55)
              `,

              animation: `lampFloat ${
                8 + Math.random() * 6
              }s ease-in-out infinite`,

              animationDelay: `${delay}s`,

              zIndex: 20,
            }}
          />
        );
      })}

      <style jsx>{`
        @keyframes lampFloat {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 0.7;
          }

          50% {
            transform: translateY(-30px) scale(1.08);
            opacity: 1;
          }

          100% {
            transform: translateY(0px) scale(1);
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
}
