'use client';

export default function SunGlow() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      <style jsx>{`
        @keyframes sun-breathe {
          0%, 100% { transform: scale(1); filter: brightness(1) blur(0px); }
          50% { transform: scale(1.1); filter: brightness(1.2) blur(1px); }
        }

        @keyframes aura-rotate {
          0% { transform: rotate(0deg) scale(1); opacity: 0.5; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 0.8; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.5; }
        }

        .sun-main {
          animation: sun-breathe 5s ease-in-out infinite;
        }

        .sun-aura {
          animation: aura-rotate 10s linear infinite;
        }
      `}</style>

      {/* 🚀 1. DEEP BACKGROUND GLOW (Poori screen ka mahaul) */}
      <div className="absolute w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent 60%)]" />

      {/* 🚀 2. DYNAMIC SUN AURA (Piche ghumne wali roshni) */}
      <div className="sun-aura absolute w-[400px] h-[400px] rounded-full opacity-40 blur-[80px]"
           style={{ background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #ea580c, #fbbf24)' }} />

      {/* 🚀 3. SOFT SECONDARY GLOW */}
      <div className="absolute w-[300px] h-[300px] rounded-full blur-[40px] opacity-60"
           style={{ background: 'radial-gradient(circle, rgba(255,220,120,0.8) 0%, transparent 70%)' }} />

      {/* 🚀 4. CORE CRYSTAL SUN (Main Element) */}
      <div className="sun-main relative flex items-center justify-center">
         {/* Inner Glow */}
         <div className="absolute w-[160px] h-[160px] bg-orange-500 rounded-full blur-2xl opacity-50" />
         
         {/* Main Sun Body */}
         <div className="relative w-36 h-36 rounded-full border-4 border-white/10 shadow-[0_0_60px_rgba(251,191,36,0.8)] overflow-hidden"
              style={{ background: 'radial-gradient(circle at 30% 30%, #fff7d6 0%, #ffd54f 40%, #ff9800 100%)' }}>
            
            {/* Glossy Surface Effect */}
            <div className="absolute top-2 left-4 w-12 h-6 bg-white/40 rounded-full blur-sm -rotate-45" />
         </div>
      </div>

      {/* 🚀 5. LENS FLARE (Modern Touch) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent rotate-12" />
    </div>
  );
}
