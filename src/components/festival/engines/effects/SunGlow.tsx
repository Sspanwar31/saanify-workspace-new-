'use client';

export default function SunGlow() {
  return (
    // 🚀 FIXED: Removed negative translate and ensured it fills the hero container
    <div className="relative w-full h-full flex items-center justify-center overflow-visible select-none pointer-events-none z-20">
      <style jsx>{`
        @keyframes sun-breathe {
          0%, 100% { transform: scale(1.3); filter: brightness(1); }
          50% { transform: scale(1.45); filter: brightness(1.2); }
        }
        @keyframes aura-rotate {
          0% { transform: rotate(0deg) scale(1); opacity: 0.4; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 0.6; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.4; }
        }
        .sun-main { animation: sun-breathe 5s ease-in-out infinite; }
        .sun-aura { animation: aura-rotate 8s linear infinite; }
      `}</style>

      {/* 🚀 1. INTERNAL CARD GLOW */}
      <div className="absolute w-[200px] h-[200px] bg-orange-500/20 rounded-full blur-[40px]" />

      {/* 🚀 2. DYNAMIC SUN AURA */}
      <div className="sun-aura absolute w-[220px] h-[220px] rounded-full opacity-50 blur-[30px]"
           style={{ background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #ea580c, #fbbf24)' }} />

      {/* 🚀 3. THE ACTUAL SUN */}
      <div className="sun-main relative z-10 flex items-center justify-center">
         {/* Sharp Center Glow */}
         <div className="absolute w-[100px] h-[100px] bg-yellow-400 rounded-full blur-xl opacity-60" />
         
         {/* Sun Body */}
         <div className="relative w-28 h-28 rounded-full border-2 border-white/20 shadow-[0_0_40px_rgba(251,191,36,0.8)] overflow-hidden"
              style={{ background: 'radial-gradient(circle at 30% 30%, #fff7d6 0%, #ffd54f 40%, #ff9800 100%)' }}>
            
            {/* 3D Glossy Shine */}
            <div className="absolute top-2 left-4 w-10 h-5 bg-white/40 rounded-full blur-sm -rotate-45" />
         </div>
      </div>
    </div>
  );
}
