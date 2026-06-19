'use client';

export default function LuxuryRays() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Left Ray */}
      <div className="ray ray-left" />

      {/* Center Ray */}
      <div className="ray ray-center" />

      {/* Right Ray */}
      <div className="ray ray-right" />

      <style jsx>{`
        .ray {
          position: absolute;
          top: -20%;
          width: 220px;
          height: 160%;
          opacity: 0.35;
          filter: blur(80px);

          background: linear-gradient(
            to bottom,
            rgba(255,255,255,.9),
            rgba(255,215,0,.6),
            transparent
          );

          animation: sway 12s ease-in-out infinite;
        }

        .ray-left {
          left: 15%;
          transform: rotate(-25deg);
          animation-delay: 0s;
        }

        .ray-center {
          left: 45%;
          transform: rotate(0deg);
          animation-delay: 2s;
        }

        .ray-right {
          right: 15%;
          transform: rotate(25deg);
          animation-delay: 4s;
        }

        @keyframes sway {

          0% {
            transform: translateY(0px) rotate(-25deg);
            opacity: .10;
          }

          50% {
            transform: translateY(-30px) rotate(-15deg);
            opacity: .22;
          }

          100% {
            transform: translateY(0px) rotate(-25deg);
            opacity: .10;
          }
        }
      `}</style>
    </div>
  );
}
