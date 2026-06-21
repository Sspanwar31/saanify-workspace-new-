'use client';

// Helper for random-like distribution
function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function GhatLightRows() {
  const rows = [
    { count: 18, bottom: 22, scale: 1.2, opacity: 1, blur: '10px' },  // Front row (Brightest)
    { count: 15, bottom: 16, scale: 1.0, opacity: 0.8, blur: '8px' },
    { count: 12, bottom: 10, scale: 0.8, opacity: 0.6, blur: '6px' },
    { count: 10, bottom: 5, scale: 0.6, opacity: 0.4, blur: '4px' },  // Back row (Faded)
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {rows.map((row, ri) => (
        <div
          key={ri}
          className="absolute flex justify-center w-full"
          style={{
            bottom: `${row.bottom}%`,
            left: '50%',
            transform: `translateX(-50%)`,
            opacity: row.opacity,
            gap: '15px',
          }}
        >
          {Array.from({ length: row.count }, (_, li) => {
            const dur = 3 + sr(ri * 10 + li) * 2;
            const delay = sr(li * 5) * 3;
            
            return (
              <div key={li} className="relative flex items-center justify-center">
                {/* 🚀 1. UNDERGLOW (Water reflection feel) */}
                <div className="absolute rounded-full" 
                     style={{ 
                        width: '30px', height: '30px', 
                        background: 'rgba(255,180,0,0.3)', 
                        filter: `blur(${row.blur})` 
                     }} />

                {/* 🚀 2. THE LAMP CORE (Now 14px instead of 6px) */}
                <div
                  className="rounded-full shadow-2xl"
                  style={{
                    width: '14px',
                    height: '14px',
                    background: 'radial-gradient(circle at 30% 30%, #fff7d6 0%, #ffcc66 40%, #ea580c 100%)',
                    boxShadow: '0 0 15px rgba(255,200,50,0.8), 0 0 30px rgba(255,100,0,0.4)',
                    transform: `scale(${row.scale})`,
                    animation: `ghatLampPulse ${dur}s ease-in-out ${delay}s infinite alternate`,
                  }}
                />
              </div>
            );
          })}
        </div>
      ))}

      <style jsx>{`
        @keyframes ghatLampPulse {
          0%   { opacity: 0.7; transform: scale(0.9) translateY(0); filter: brightness(1); }
          100% { opacity: 1; transform: scale(1.1) translateY(-5px); filter: brightness(1.4); }
        }
      `}</style>
    </div>
  );
}
