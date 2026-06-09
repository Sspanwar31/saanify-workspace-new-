'use client';

export default function AshokaChakra() {
  return (
    <div className="relative flex items-center justify-center p-4">
      
      {/* 🚀 1. TRICOLOR BACKING (Empty area bharne ke liye) */}
      <div className="absolute w-44 h-44 rounded-full bg-white shadow-2xl overflow-hidden border-4 border-white/20">
         <div className="h-1/3 w-full bg-[#FF9933]" /> {/* Saffron */}
         <div className="h-1/3 w-full bg-white" />     {/* White */}
         <div className="h-1/3 w-full bg-[#138808]" /> {/* Green */}
      </div>

      {/* 🚀 2. THE CHAKRA WHEEL */}
      <div className="relative w-36 h-32 sm:w-40 sm:h-40 border-[4px] border-[#000080] rounded-full flex items-center justify-center animate-[spin_15s_linear_infinite] z-10 shadow-inner">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[92%] bg-[#000080]"
            style={{ transform: `rotate(${i * 15}deg)` }}
          />
        ))}
        <div className="w-8 h-8 bg-[#000080] rounded-full z-20 border-2 border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
