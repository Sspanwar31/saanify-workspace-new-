'use client';

import React from 'react';

export default function HanumanHero() {
  // 📝 Supabase Storage Custom Image URL
  const IMAGE_PATH = "https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Hanuman%20JI/Screenshot%202026-07-14%20221205.png"; 

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[220px] py-1">
      
      {/* 🌟 Back Aura Glow Effect */}
      <div className="absolute w-[180px] h-[180px] rounded-full bg-gradient-to-t from-orange-600/30 via-amber-500/10 to-transparent blur-2xl animate-pulse" style={{ animationDuration: '3.5s' }} />

      {/* 🌟 Temple Arch Frame */}
      <div className="relative z-10 p-[2px] rounded-t-full rounded-b-2xl bg-gradient-to-b from-amber-300 via-amber-500/40 to-orange-600 border border-amber-300/60 shadow-[0_0_30px_rgba(245,158,11,0.35)]">
        
        {/* 🌟 Inner Frame: Fixed Dimensions, Padding and Dark Match Background */}
        <div className="overflow-hidden rounded-t-full rounded-b-[14px] w-[140px] h-[185px] pt-7 pb-5 px-3 relative flex items-center justify-center bg-[#090a0f]">
          
          {IMAGE_PATH ? (
            <img 
              src={IMAGE_PATH} 
              alt="Hanuman Jayanti" 
              // 🌟 Changed to object-contain to prevent cropping & stretching
              className="w-full h-full object-contain rounded-lg transform transition-transform duration-700 ease-out"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('span');
                  fallback.className = "text-[70px] py-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]";
                  fallback.innerText = "🪓";
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <span className="text-[70px] py-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">🪓</span>
          )}

          {/* Soft inner shadow overlay to merge boundaries */}
          <div className="absolute inset-0 pointer-events-none rounded-t-full rounded-b-[14px] ring-1 ring-black/40 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
        </div>

      </div>

    </div>
  );
}
