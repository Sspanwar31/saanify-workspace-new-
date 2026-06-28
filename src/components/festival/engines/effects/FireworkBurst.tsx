'use client';

export default function FireworkBurst() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">

      <div className="firework firework1"></div>
      <div className="firework firework2"></div>
      <div className="firework firework3"></div>

      <style jsx>{`
        .firework {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: gold;
          box-shadow:
            0 0 20px gold,
            0 0 40px orange,
            0 0 60px yellow;
          animation: explode 4s ease-out forwards;
          opacity: 0;
        }

        .firework1 {
          top: 18%;
          left: 25%;
          animation-delay: 1.8s;
        }

        .firework2 {
          top: 12%;
          left: 50%;
          animation-delay: 2.2s;
        }

        .firework3 {
          top: 20%;
          left: 75%;
          animation-delay: 2.6s;
        }

        @keyframes explode {
          0% {
            transform: scale(0);
            opacity: 0;
          }

          30% {
            transform: scale(8);
            opacity: 1;
          }

          100% {
            transform: scale(14);
            opacity: 0;
          }
        }
      `}</style>

    </div>
  );
}
