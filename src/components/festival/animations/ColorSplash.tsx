'use client';

export default function ColorSplash() {
  const colors = ['#ff0080', '#ffcc00', '#00e5ff', '#00ff88', '#ff4444'];

  return (
    // 🚀 Z-Index ko z-40 ya z-50 karein taaki ye dikhe
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-40">

      {/* Branded Color Splashes (Using Global CSS Animation) */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`splash-${i}`}
          // 🚀 Yahan hum globals.css wali 'color-splash' class use kar rahe hain
          className="color-splash" 
          style={{
            width: `${200 + Math.random() * 200}px`,
            height: `${200 + Math.random() * 200}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: colors[i % colors.length],
            // 🚀 Yeh variables globals.css ke 'splash-boom' mein use honge
            "--tx": `${(Math.random() - 0.5) * 200}px`,
            "--ty": `${(Math.random() - 0.5) * 200}px`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          } as any}
        />
      ))}

      {/* Falling Gulal Particles */}
      {[...Array(60)].map((_, i) => (
        <div
          key={`p-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${8 + Math.random() * 10}px`,
            height: `${8 + Math.random() * 10}px`,
            background: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            // 🚀 Diwali jaisa fall animation lekin multicolor
            animation: `fall ${3 + Math.random() * 4}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.6
          }}
        />
      ))}

      {/* Global Fall Animation for Particles */}
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
