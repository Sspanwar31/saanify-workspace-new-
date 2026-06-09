'use client';

export default function TricolorWaves() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">

      <div className="absolute top-0 left-0 w-full h-1/3 bg-orange-500 opacity-15 animate-pulse" />

      <div className="absolute top-1/3 left-0 w-full h-1/3 bg-white opacity-10 animate-pulse" />

      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-green-500 opacity-15 animate-pulse" />

      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-ping"
          style={{
            width: '6px',
            height: '6px',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}
