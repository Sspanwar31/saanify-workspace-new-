'use client';

function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function GhatLightRows() {
  const rows = [
    // 🚀 FIXED: 'bottom' values ko kam kiya hai taaki ye card ke niche rahein
    { count: 18, bottom: 12, scale: 1.2, opacity: 1, blur: '10px' },  
    { count: 15, bottom: 8, scale: 1.0, opacity: 0.8, blur: '8px' },
    { count: 12, bottom: 4, scale: 0.8, opacity: 0.6, blur: '6px' },
    { count: 10, bottom: 1, scale: 0.6, opacity: 0.4, blur: '4px' }, 
  ];

  return (
    // 🚀 FIXED: 'z-10' ko hata kar 'z-0' ya kuch na rakhein taaki ye piche jaye
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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
                <div className="absolute rounded-full" 
                     style={{ 
                        width: '30px', height: '30px', 
                        background: 'rgba(255,180,0,0.2)', 
                        filter: `blur(${row.blur})` 
                     }} />

                <div
                  className="rounded-full"
                  style={{
                    width: '12px',
                    height: '12px',
                    background: 'radial-gradient(circle at 30% 30%, #fff7d6 0%, #ffcc66 40%, #ea580c 100%)',
                    boxShadow: '0 0 15px rgba(255,200,50,0.6)',
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
          0%   { opacity: 0.7; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
