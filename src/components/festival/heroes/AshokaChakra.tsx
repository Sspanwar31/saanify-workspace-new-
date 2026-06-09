'use client';

export default function AshokaChakra() {
  return (
    <div className="relative flex items-center justify-center p-6 scale-110 sm:scale-125">
      
      {/* 🚀 1. PATRIOTIC GLOW (Chakra ke piche ka Kesariya aur Hara Aura) */}
      <div className="absolute -top-10 w-48 h-48 bg-[#FF9933]/30 blur-[70px] rounded-full animate-pulse" />
      <div className="absolute -bottom-10 w-48 h-48 bg-[#138808]/30 blur-[70px] rounded-full animate-pulse" />
      
      {/* 🚀 2. THE MASTER WHEEL (Ashoka Chakra) */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 border-[5px] border-[#000080] rounded-full flex items-center justify-center animate-[spin_12s_linear_infinite] shadow-[0_0_40px_rgba(0,0,128,0.3)] bg-white/5 backdrop-blur-sm">
        
        {/* 24 Spokes (Teeliyan) - Auto Generated */}
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[96%] bg-[#000080]/80"
            style={{ transform: `rotate(${i * 15}deg)` }}
          />
        ))}

        {/* Center Hub */}
        <div className="w-8 h-8 bg-[#000080] rounded-full z-10 border-[4px] border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      </div>

      {/* 🚀 3. DECORATIVE SPARKLES (Chakra ke charon taraf) */}
      <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-0 left-0 text-xl animate-bounce">✨</span>
          <span className="absolute bottom-0 right-0 text-xl animate-bounce delay-700">✨</span>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
