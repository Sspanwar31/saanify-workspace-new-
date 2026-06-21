'use client';

export default function GhatLampRows() {
  // 🚀 15-20 Diye jo nadi ke kinare ek line mein honge
  const rowDiyas = [...Array(18)];

  return (
    <div className="absolute bottom-0 w-full h-[35%] pointer-events-none overflow-hidden flex flex-col justify-end pb-4">
      
      {/* 🚀 Kinare ki line (The Ghat Line) */}
      <div className="w-full flex justify-around items-end opacity-90">
        {rowDiyas.map((_, i) => (
          <div
            key={i}
            className="diya-ghat-shine"
            style={{
              fontSize: '20px',
              animationDelay: `${i * 0.2}s`,
              filter: 'drop-shadow(0 0 10px #ffcc00)',
              transform: `translateY(${Math.sin(i) * 5}px)` // Halka upar niche wave
            }}
          >
            🪔
          </div>
        ))}
      </div>

      <style jsx>{`
        .diya-ghat-shine {
          animation: ghatGlow 3s ease-in-out infinite alternate;
          transition: all 0.5s;
        }
        @keyframes ghatGlow {
          0% { opacity: 0.6; transform: scale(1); filter: brightness(1); }
          100% { opacity: 1; transform: scale(1.1); filter: brightness(1.4) drop-shadow(0 0 15px gold); }
        }
      `}</style>
    </div>
  );
}
