'use client';

export default function ValentineVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-52 overflow-hidden my-2">
      
      {/* 🚀 1. BACKGROUND GLOW (Dark popup ke upar neon pink effect ke liye) */}
      <div className="absolute w-36 h-36 bg-gradient-to-tr from-pink-600 to-rose-500 rounded-full blur-2xl opacity-40 animate-pulse" />

      {/* 🚀 2. FLOATING & ROTATING PARTICLES (Sparkles/Small Hearts) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Floating Heart 1 */}
        <span className="absolute top-6 left-12 text-pink-400 text-sm animate-bounce opacity-70" style={{ animationDuration: '2.5s' }}>
          ✨
        </span>
        {/* Floating Heart 2 */}
        <span className="absolute bottom-8 left-16 text-rose-400 text-xs animate-ping opacity-60" style={{ animationDuration: '3s' }}>
          💖
        </span>
        {/* Floating Heart 3 */}
        <span className="absolute top-8 right-14 text-pink-300 text-base animate-bounce opacity-75" style={{ animationDuration: '2s' }}>
          💕
        </span>
        {/* Floating Heart 4 */}
        <span className="absolute bottom-6 right-12 text-rose-500 text-xs animate-pulse">
          ✨
        </span>
      </div>

      {/* 🚀 3. MAIN PULSING 3D-STYLE HEART (Center Visual) */}
      <div className="relative z-10 flex items-center justify-center">
        {/* Outer Ripple Wave */}
        <div className="absolute w-28 h-28 border border-pink-500/40 rounded-full animate-ping opacity-25" style={{ animationDuration: '2s' }} />

        {/* Main Glowing Heart Icon */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-rose-600/20 to-pink-500/20 border border-pink-500/30 backdrop-blur-sm shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all duration-300 hover:scale-110">
          
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-14 h-14 text-pink-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-[heartbeat_1.5s_ease-in-out_infinite]"
          >
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>

        </div>
      </div>

      {/* 🚀 4. CUSTOM HEARTBEAT ANIMATION */}
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.15);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.15);
          }
          70% {
            transform: scale(1);
          }
        }
      `}</style>

    </div>
  );
}
