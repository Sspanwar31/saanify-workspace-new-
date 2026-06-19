'use client';

export default function FireflyTrails() {
  const particles = Array.from({ length: 60 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 4 + Math.random() * 8;
        const duration = 6 + Math.random() * 8;
        const delay = Math.random() * 5;

        return (
          <div
            key={i}
            className="firefly"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}

      <style jsx>{`
        .firefly {
          position: absolute;
          border-radius: 999px;
          background: #ffd700;
          box-shadow:
            0 0 10px #ffd700,
            0 0 20px #ffb300,
            0 0 40px rgba(255, 215, 0, 0.8);
          animation:
            floatFirefly linear infinite,
            pulseFirefly ease-in-out infinite;
        }

        @keyframes floatFirefly {
          0% {
            transform: translate(0, 0);
          }

          25% {
            transform: translate(30px, -40px);
          }

          50% {
            transform: translate(-20px, -80px);
          }

          75% {
            transform: translate(40px, -30px);
          }

          100% {
            transform: translate(0, 0);
          }
        }

        @keyframes pulseFirefly {
          0%,
          100% {
            opacity: 0.2;
          }

          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
