'use client';

export default function GhatLampRows() {
  const rows = [
    { count: 10, size: 10, bottom: '16%', opacity: 0.85, gap: 'gap-3' },
    { count: 8, size: 8, bottom: '12%', opacity: 0.65, gap: 'gap-4' },
    { count: 6, size: 6, bottom: '8%', opacity: 0.45, gap: 'gap-5' },
  ];

  return (
    <>
      {rows.map((row, ri) => (
        <div
          key={ri}
          className={`absolute left-0 w-full flex justify-evenly ${row.gap} pointer-events-none`}
          style={{ bottom: row.bottom, opacity: row.opacity }}
        >
          {Array.from({ length: row.count }, (_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: `${row.size}px`,
                height: `${row.size}px`,
                background: 'radial-gradient(circle at 35% 35%, #fff8e1, #FFD36A 50%, #e6a800)',
                boxShadow: `0 0 ${row.size}px #FFD36A, 0 0 ${row.size * 2}px rgba(255,211,106,.6), 0 0 ${row.size * 3.5}px rgba(255,180,60,.3)`,
                animation: `ghatLampFlicker ${2.5 + (i * 0.3) % 2}s ease-in-out ${(i * 0.4 + ri * 0.7) % 4}s infinite`,
              }}
            />
          ))}
        </div>
      ))}

      <style jsx>{`
        @keyframes ghatLampFlicker {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          30%      { opacity: 1; transform: scale(1.12); }
          60%      { opacity: 0.85; transform: scale(1.04); }
          80%      { opacity: 1; transform: scale(1.08); }
        }
      `}</style>
    </>
  );
}
