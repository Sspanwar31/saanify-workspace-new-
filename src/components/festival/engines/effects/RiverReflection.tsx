'use client';

export default function RiverReflection() {
  return (
    <div className="absolute bottom-0 left-0 w-full h-[35%] overflow-hidden pointer-events-none">

      {/* Water Layer */}
      <div className="water-surface" />

      {/* Reflection Lines */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="reflection-line"
          style={{
            left: `${5 + i * 8}%`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      <style jsx>{`
        .water-surface {
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              to top,
              rgba(255,140,0,.15),
              rgba(255,215,0,.08),
              transparent
            );

          backdrop-filter: blur(8px);
        }

        .reflection-line {
          position: absolute;
          bottom: 0;

          width: 6px;
          height: 100%;

          background: linear-gradient(
            to top,
            rgba(255,215,0,.8),
            rgba(255,215,0,.2),
            transparent
          );

          filter: blur(6px);

          animation:
            shimmer 4s ease-in-out infinite;
        }

        @keyframes shimmer {

          0% {
            transform: scaleY(.8);
            opacity: .2;
          }

          50% {
            transform: scaleY(1.2);
            opacity: .9;
          }

          100% {
            transform: scaleY(.8);
            opacity: .2;
          }
        }
      `}</style>
    </div>
  );
}
