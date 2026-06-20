'use client';

export default function SunGlow() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-visible select-none pointer-events-none">
      <style jsx>{`
        @keyframes sun-breathe {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.2); }
        }

        @keyframes aura-rotate {
          0% { transform: rotate(0deg) scale(1); opacity: 0.4; }
          50% { transform: rotate(180deg) scale(1.3); opacity: 0.6; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.4; }
        }

        .sun-main {
          animation: sun-breathe 5s ease-in-out infinite;
        }

        .sun-aura {
          animation: aura-rotate 8s linear infinite;
        }
      `}</style>

      {/* 🚀 1. INTERNAL GLOW (Card ke andar ka mahaul) */}
      <div className="absolute w-[300px] h-[300px] bg-orange-500/20 rounded-full blur-[60px]" />

      {/* 🚀 2. DYNAMIC SUN AURA (Ghumne wali roshni) */}
      <div className="sun-aura absolute w-[280px] h-[280px] rounded-full opacity-50 blur-[50px]"
           style={{ background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #ea580c, #fbbf24)' }} />

      {/* 🚀 3. CORE SUN (The 3D Gola) */}
      <div className="sun-main relative z-10 flex items-center justify-center">
         {/* Sharp Glow */}
         <div className="absolute w-[140px] h-[140px] bg-yellow-400 rounded-full blur-2xl opacity-60" />
         
         {/* Sun Body */}
         <div className="relative w-32 h-32 rounded-full border-2 border-white/20 shadow-[0_0_50px_rgba(251,191,36,0.8)] overflow-hidden"
              style={{ background: 'radial-gradient(circle at 30% 30%, #fff7d6 0%, #ffd54f 40%, #ff9800 100%)' }}>
            
            {/* 3D Glossy Flare */}
            <div className="absolute top-2 left-4 w-12 h-6 bg-white/40 rounded-full blur-sm -rotate-45" />
         </div>
      </div>

      {/* 🚀 4. LENS FLARE (Subtle line) */}
      <div className="absolute w-[400px] h-[1px] bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent rotate-12 z-0" />
    </div>
  );
}
