'use client';

export default function ColorSplash() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">

      {/* Left Gulal Clouds */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`left-${i}`}
          className="absolute blur-3xl animate-pulse"
          style={{
            width: '250px',
            height: '250px',
            left: '-100px',
            top: `${i * 12}%`,
            opacity: 0.18,
            background:
              ['#ff0080', '#ffcc00', '#00e5ff', '#00ff88'][i % 4],
            animationDuration: `${4 + i}s`,
          }}
        />
      ))}

      {/* Right Gulal Clouds */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`right-${i}`}
          className="absolute blur-3xl animate-pulse"
          style={{
            width: '250px',
            height: '250px',
            right: '-100px',
            top: `${i * 12}%`,
            opacity: 0.18,
            background:
              ['#ff0080', '#ffcc00', '#00e5ff', '#00ff88'][i % 4],
            animationDuration: `${5 + i}s`,
          }}
        />
      ))}

      {/* Falling Colors */}
      {[...Array(80)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full animate-bounce"
          style={{
            width: `${6 + Math.random() * 14}px`,
            height: `${6 + Math.random() * 14}px`,
            background:
              ['#ff0080', '#ffcc00', '#00e5ff', '#00ff88', '#ff4444'][
                i % 5
              ],
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 100}px`,
            opacity: 0.75,
            animationDuration: `${3 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}

      {/* Floating Color Mist */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,0,128,0.08), rgba(0,229,255,0.05), rgba(255,204,0,0.05), transparent 70%)',
        }}
      />
    </div>
  );
}
