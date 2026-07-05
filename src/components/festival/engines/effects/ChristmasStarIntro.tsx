'use client';

export default function ChristmasStarIntro() {
  return (
    <>
      <style jsx>{`
        @keyframes starFall {
          0% {
            transform: translateY(-500px) scale(0.2) rotate(0deg);
            opacity: 0;
          }

          60% {
            transform: translateY(0px) scale(1.3) rotate(180deg);
            opacity: 1;
          }

          100% {
            transform: translateY(-40px) scale(1);
            opacity: 1;
          }
        }

        @keyframes starGlow {
          0%,100% {
            filter: drop-shadow(0 0 10px #fff);
          }

          50% {
            filter:
              drop-shadow(0 0 25px #fff)
              drop-shadow(0 0 60px #fbbf24);
          }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">

        <div
          style={{
            animation:
              'starFall 2s cubic-bezier(0.22,1,0.36,1) forwards, starGlow 1.5s ease-in-out infinite'
          }}
        >
          ⭐
        </div>

      </div>
    </>
  );
}
