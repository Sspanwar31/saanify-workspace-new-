'use client';

import React from 'react';

export default function RamNavamiHero() {
  // 📝 Prabhu Shri Ram Image URL (Supabase)
  const IMAGE_PATH = "https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/ram%20nami/Screenshot%202026-08-04%20223254.png"; 

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[220px] py-1">
      
      {/* 🌟 Back Aura Glow Effect (Saffron / Sunehra Glow) */}
      <div className="absolute w-[180px] h-[180px] rounded-full bg-gradient-to-t from-amber-500/30 via-orange-500/20 to-transparent blur-2xl animate-pulse" style={{ animationDuration: '3.5s' }} />

      {/* 🌟 Temple Arch Frame (Saffron & 24K Gold Theme) */}
      <div className="relative z-10 p-[2.5px] rounded-t-full rounded-b-2xl bg-gradient-to-b from-amber-300 via-orange-500/40 to-amber-600 border border-amber-300/60 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
        
        {/* Inner Frame */}
        <div className="overflow-hidden rounded-t-full rounded-b-[14px] w-[136px] h-[176px] relative flex items-center justify-center bg-[#0d0502]">
          
          {IMAGE_PATH ? (
            <img 
              src={IMAGE_PATH} 
              alt="Prabhu Shri Ram Navami" 
              className="w-full h-full object-cover transform scale-100 hover:scale-105 transition-transform duration-700 ease-out"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('span');
                  fallback.className = "text-[70px] py-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]";
                  fallback.innerText = "🏹";
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <span className="text-[70px] py-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">🏹</span>
          )}

          {/* Soft top/bottom fade overlay */}
          <div className="absolute inset-0 pointer-events-none rounded-t-full rounded-b-[14px] bg-gradient-to-t from-black/40 via-transparent to-black/30" />
        </div>

      </div>

    </div>
  );
}
