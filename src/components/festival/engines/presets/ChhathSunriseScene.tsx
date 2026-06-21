'use client';

export default function ChhathSunriseScene() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* 🔴 RED test */}
      <div
        className="absolute"
        style={{
          top: '0%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '50%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,50,50,0.7) 0%, transparent 70%)',
          animation: 'tp 3s ease-in-out infinite',
        }}
      />

      {/* 🟢 GREEN dots */}
      <div
        className="absolute left-0 w-full flex justify-evenly pointer-events-none"
        style={{ bottom: '15%' }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: '12px',
              height: '12px',
              background: '#00ff44',
              boxShadow: '0 0 15px #00ff44',
              animation: `tp ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* 🔵 BLUE bar */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '25%',
          background: 'linear-gradient(to top, rgba(0,100,255,0.6), transparent)',
          animation: 'tp 4s ease-in-out infinite',
        }}
      />

      <style jsx>{`
        @keyframes tp {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
