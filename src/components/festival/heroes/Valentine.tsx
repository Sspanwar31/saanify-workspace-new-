'use client';

export default function ValentineVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-56 my-1 select-none">
      
      {/* 🔮 1. DEEP AMBIENT NEON GLOW (Seamless Background Blend) */}
      <div className="absolute w-64 h-64 bg-rose-600/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-40 h-40 bg-pink-500/30 rounded-full blur-2xl" />

      {/* 🪐 2. FUTURISTIC ORBITING RINGS */}
      {/* Orbit 1 */}
      <div className="absolute w-48 h-48 rounded-full border border-dashed border-pink-500/20 animate-[spin_20s_linear_infinite]" />
      
      {/* Orbit 2 (Opposite Direction with Glow Node) */}
      <div className="absolute w-36 h-36 rounded-full border border-pink-400/25 animate-[spin_10s_linear_infinite_reverse] flex items-start justify-center">
        <div className="w-2.5 h-2.5 bg-pink-400 rounded-full shadow-[0_0_10px_#f43f5e] -translate-y-1" />
      </div>

      {/* ✨ 3. FLOATING AMBIENT PARTICLES */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="absolute top-4 left-8 text-pink-400/70 text-xs animate-bounce" style={{ animationDuration: '3s' }}>✦</span>
        <span className="absolute top-10 right-10 text-rose-300/80 text-sm animate-pulse">✨</span>
        <span className="absolute bottom-6 left-12 text-rose-500/60 text-xs animate-ping" style={{ animationDuration: '2.5s' }}>💖</span>
        <span className="absolute bottom-4 right-8 text-pink-400/70 text-xs animate-bounce" style={{ animationDuration: '4s' }}>✦</span>
      </div>

      {/* 💎 4. 3D GLASS POD & DUAL GLOWING HEART */}
      <div className="relative z-10 flex items-center justify-center">
        
        {/* Expanding Pulse Wave */}
        <div className="absolute w-32 h-32 rounded-full border border-pink-500/30 animate-ping opacity-30" style={{ animationDuration: '2.4s' }} />

        {/* Futuristic Glass Bubble Container */}
        <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-b from-white/10 to-pink-500/5 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(244,63,94,0.37)]">
          
          {/* Inner Glowing Core */}
          <div className="absolute w-16 h-16 bg-pink-500/40 rounded-full blur-md" />

          {/* 3D SVG Heart with Realistic Depth */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            className="w-14 h-14 relative z-20 animate-[heartbeat_1.8s_ease-in-out_infinite]"
          >
            <defs>
              <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4b72" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#f43f5e" floodOpacity="0.8"/>
              </filter>
            </defs>

            <path 
              fill="url(#heartGradient)" 
              filter="url(#neonGlow)"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
            {/* Top Gloss Reflection */}
            <path 
              d="M7.5 5C5.5 5 4 6.5 4 8.5c0 1 .5 2 1.5 3" 
              stroke="rgba(255,255,255,0.6)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              fill="none" 
            />
          </svg>
        </div>
      </div>

      {/* 🚀 5. CUSTOM SMOOTH ANIMATION */}
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          15% {
            transform: scale(1.18);
          }
          30% {
            transform: scale(1);
          }
          45% {
            transform: scale(1.12);
          }
        }
      `}</style>

    </div>
  );
}
