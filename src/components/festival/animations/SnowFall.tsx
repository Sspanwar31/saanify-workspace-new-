'use client';

export default function SnowFall() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(60)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: `${3 + Math.random() * 8}px`,
            height: `${3 + Math.random() * 8}px`,
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 100}px`,
            opacity: 0.8,
            animation: `snowfall ${4 + Math.random() * 8}s linear infinite`
          }}
        />
      ))}

      <style jsx>{`
        @keyframes snowfall {
          from {
            transform: translateY(-50px);
          }
          to {
            transform: translateY(120vh);
          }
        }
      `}</style>
    </div>
  );
}
