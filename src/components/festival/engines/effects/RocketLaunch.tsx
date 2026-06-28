'use client';

export default function RocketLaunch() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">

      {/* Left Rocket */}
      <div
        className="absolute bottom-0 left-[20%] text-4xl animate-[rocketLeft_2.5s_ease-out_forwards]"
      >
        🚀
      </div>

      {/* Right Rocket */}
      <div
        className="absolute bottom-0 right-[20%] text-4xl animate-[rocketRight_2.5s_ease-out_forwards]"
      >
        🚀
      </div>

      <style jsx>{`
        @keyframes rocketLeft {
          0% {
            transform: translateY(0);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          100% {
            transform: translateY(-120vh);
            opacity: 0;
          }
        }

        @keyframes rocketRight {
          0% {
            transform: translateY(0);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          100% {
            transform: translateY(-120vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
