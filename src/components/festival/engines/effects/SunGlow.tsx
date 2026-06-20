'use client';

export default function SunGlow() {
  return (
    // 🚀 FIXED: Added '-translate-y-16' to move it up into the sparkles position
    <div className="relative w-full h-full flex items-center justify-center overflow-visible select-none pointer-events-none -translate-y-16">
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
        .sun-main { animation: sun-breathe 5s ease-in-out infinite; }
        .sun-aura { animation: aura-rotate 8s linear infinite; }
      `}</style>

      {/* 🚀 1. INTERNAL GLOW */}
      <div className="absolute w-[250px] h-[250px] bg-orange-500/20 rounded-full blur-[50px]" />

      {/* 🚀 2. DYNAMIC SUN AURA */}
      <div className="sun-aura absolute w-[240px] h-[240px] rounded-full opacity-50 blur-[40px]"
           style={{ background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #ea580c, #fbbf24)' }} />

      {/* 🚀 3. CORE SUN */}
      <div className="sun-main relative z-10 flex items-center justify-center">
         <div className="absolute w-[120px] h-[120px] bg-yellow-400 rounded-full blur-2xl opacity-60" />
         <div className="relative w-28 h-28 rounded-full border-2 border-white/20 shadow-[0_0_50px_rgba(251,191,36,0.8)] overflow-hidden"
              style={{ background: 'radial-gradient(circle at 30% 30%, #fff7d6 0%, #ffd54f 40%, #ff9800 100%)' }}>
            <div className="absolute top-2 left-4 w-10 h-5 bg-white/40 rounded-full blur-sm -rotate-45" />
         </div>
      </div>
    </div>
  );
}
