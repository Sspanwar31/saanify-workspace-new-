'use client';

export default function ChhathSunriseScene() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* 🔴 TEST 1: Sunrise glow — RED color, impossible to miss */}
      <div
        className="absolute"
        style={{
          top: '0%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '50%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,50,50,0.6) 0%, transparent 70%)',
          animation: 'testPulse 3s ease-in-out infinite',
        }}
      />

      {/* 🟢 TEST 2: Ghat lamps — GREEN dots, bottom area */}
      <div
        className="absolute left-0 w-full flex justify-evenly pointer-events-none"
        style={{ bottom: '15%', opacity: 0.9 }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: '10px',
              height: '10px',
              background: '#00ff44',
              boxShadow: '0 0 12px #00ff44, 0 0 24px rgba(0,255,68,0.5)',
              animation: `testPulse ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* 🔵 TEST 3: Water shimmer — BLUE bar at bottom */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '25%',
          background: 'linear-gradient(to top, rgba(0,100,255,0.5), transparent)',
          animation: 'testPulse 4s ease-in-out infinite',
        }}
      />

      {/* 🟡 TEST 4: Floating lamps — YELLOW dots */}
      <div
        className="absolute rounded-full"
        style={{
          left: '30%',
          bottom: '30%',
          width: '14px',
          height: '14px',
          background: '#ffff00',
          boxShadow: '0 0 15px #ffff00, 0 0 30px rgba(255,255,0,0.5)',
          animation: 'testPulse 2.5s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: '60%',
          bottom: '25%',
          width: '10px',
          height: '10px',
          background: '#ffff00',
          boxShadow: '0 0 10px #ffff00',
          animation: 'testPulse 3s ease-in-out 0.5s infinite',
        }}
      />

      {/* 🟣 TEST 5: River reflection — PURPLE streaks */}
      <div
        className="absolute bottom-0"
        style={{
          left: '25%',
          width: '4px',
          height: '30%',
          background: 'linear-gradient(to top, rgba(180,0,255,0.8), transparent)',
          filter: 'blur(4px)',
          animation: 'testPulse 3.5s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-0"
        style={{
          left: '55%',
          width: '4px',
          height: '25%',
          background: 'linear-gradient(to top, rgba(180,0,255,0.6), transparent)',
          filter: 'blur(4px)',
          animation: 'testPulse 4s ease-in-out 1s infinite',
        }}
      />
      <div
        className="absolute bottom-0"
        style={{
          left: '75%',
          width: '4px',
          height: '28%',
          background: 'linear-gradient(to top, rgba(180,0,255,0.7), transparent)',
          filter: 'blur(4px)',
          animation: 'testPulse 3s ease-in-out 0.7s infinite',
        }}
      />

      {/* 🟠 TEST 6: Arghya — ORANGE glow center */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0"
        style={{
          width: '150px',
          height: '25%',
          background: 'linear-gradient(to top, rgba(255,120,0,0.6), transparent)',
          filter: 'blur(15px)',
          animation: 'testPulse 3s ease-in-out infinite',
        }}
      />

      <style jsx>{`
        @keyframes testPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
