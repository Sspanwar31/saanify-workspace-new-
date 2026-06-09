'use client';

export default function MoonGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">

      <div className="absolute top-20 right-24 w-48 h-48 rounded-full bg-blue-300 opacity-30 blur-3xl animate-pulse" />

      {[...Array(25)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-pulse"
          style={{
            width: '4px',
            height: '4px',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random(),
            animationDuration: `${1 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
  );
}
