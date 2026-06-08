'use client';

export default function GoldenParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {[...Array(60)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-yellow-400 opacity-80"
          style={{
            width: `${2 + Math.random() * 6}px`,
            height: `${2 + Math.random() * 6}px`,
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animation: `fall ${4 + Math.random() * 6}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0px);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          100% {
            transform: translateY(120vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
