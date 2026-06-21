'use client';

function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function GhatLightRows() {
  const rows = [
    { count: 15, bottom: 20, scale: 1, opacity: 0.9 },
    { count: 13, bottom: 16, scale: 0.95, opacity: 0.78 },
    { count: 11, bottom: 12, scale: 0.9, opacity: 0.65 },
    { count: 9, bottom: 8, scale: 0.85, opacity: 0.5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {rows.map((row, ri) => (
        <div
          key={ri}
          className="absolute flex justify-center"
          style={{
            bottom: `${row.bottom}%`,
            left: '50%',
            transform: `translateX(-50%) scale(${row.scale})`,
            opacity: row.opacity,
            gap: '12px',
          }}
        >
          {Array.from({ length: row.count }, (_, li) => {
            const dur = 2 + sr(ri * 100 + li * 7) * 3;
            const delay = sr(ri * 200 + li * 13) * 4;
            return (
              <div
                key={li}
                className="rounded-full"
                style={{
                  width: '6px',
                  height: '6px',
                  background:
                    'radial-gradient(circle, #fff5c4 0%, #ffcc66 40%, #ff9900 70%, transparent 100%)',
                  boxShadow:
                    '0 0 6px rgba(255,220,120,0.8), 0 0 14px rgba(255,170,0,0.5)',
                  animation: `ghatLightFlicker ${dur}s ease-in-out ${delay}s infinite`,
                }}
              />
            );
          })}
        </div>
      ))}

      <style jsx>{`
        @keyframes ghatLightFlicker {
          0%, 100% { opacity: 0.65; transform: scale(0.92); }
          25%      { opacity: 0.9; transform: scale(1.08); }
          50%      { opacity: 1; transform: scale(1.15); }
          75%      { opacity: 0.8; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
