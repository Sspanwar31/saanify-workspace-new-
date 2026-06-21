'use client';

export default function SunGlow() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-visible select-none pointer-events-none z-20 scale-110">
      <style jsx>{`
        @keyframes sun-pulsar {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.3); }
        }
        @keyframes ray-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes aura-flow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .sun-core-v4 { animation: sun-pulsar 4s infinite ease-in-out; }
        .sun-rays-v4 { animation: ray-rotate 20s linear infinite; }
        .sun-aura-v4 { animation: aura-flow 6s infinite ease-in-out; }
      `}</style>

      {/* 🚀 1. DEEP ATMOSPHERIC GLOW (Background) */}
      <div className="sun-aura-v4 absolute w-[350px] h-[350px] bg-orange-600/30 rounded-full blur-[80px]" />

      {/* 🚀 2. RADIANT RAYS (Pinterest Style Kiran) */}
      <div className="sun-rays-v4 absolute flex items-center justify-center w-full h-full opacity-60">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[220px] bg-gradient-to-t from-transparent via-yellow-400 to-transparent"
            style={{ transform: `rotate(${i * 15}deg)` }}
          />
        ))}
      </div>

      {/* 🚀 3. THE GOLDEN HALO (Ghumne wala ghera) */}
      <div className="sun-rays-v4 absolute w-48 h-48 border-2 border-dashed border-yellow-500/30 rounded-full" />

      {/* 🚀 4. MAIN SUN BODY (The Masterpiece) */}
      <div className="sun-core-v4 relative flex items-center justify-center">
         {/* Sharp Center Glow */}
         <div className="absolute w-[140px] h-[140px] bg-yellow-300 rounded-full blur-2xl opacity-70" />
         
         {/* Sun Core with 3D Gradient */}
         <div className="relative w-36 h-36 rounded-full border-2 border-white/20 shadow-[0_0_80px_rgba(251,191,36,1)] overflow-hidden"
              style={{ background: 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #FFE28A 20%, #FFC857 60%, #EA580C 100%)' }}>
            
            {/* Mirror Reflection (Glass Look) */}
            <div className="absolute top-2 left-6 w-16 h-8 bg-white/40 rounded-full blur-sm -rotate-45" />
            
            {/* Bottom Shadow for Depth */}
        
         </div>
      </div>

      {/* 🚀 5. HORIZONTAL LENS FLARE */}
      <div className="absolute w-[500px] h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent rotate-6 blur-[1px]" />
    </div>
  );
}
