'use client';

import React from 'react';

export default function HanumanHero() {
  // 📝 Supabase Storage Custom Image URL
  const IMAGE_PATH = "https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Hanuman%20JI/Screenshot%202026-07-14%20221205.png"; 

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[240px]">
      {/* Dynamic Background Glow Effect (Orange/Gold theme) */}
      <div className="absolute w-[200px] h-[200px] rounded-full bg-orange-500/20 blur-[60px] animate-pulse" style={{ animationDuration: '3s' }} />
      
      {/* Main Image Container */}
      <div className="relative z-10 transform hover:scale-105 transition-transform duration-500 ease-out flex items-center justify-center">
        {IMAGE_PATH ? (
          <img 
            src={IMAGE_PATH} 
            alt="Hanuman Jayanti" 
            className="max-w-[240px] max-h-[240px] w-auto h-auto object-contain drop-shadow-[0_15px_35px_rgba(249,115,22,0.5)] rounded-2xl"
            onError={(e) => {
              // Agar URL fail ho jaye, toh custom text/emoji fallback show hoga
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('span');
                fallback.className = "text-[110px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]";
                fallback.innerText = "🪓";
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          // Default fallback
          <span className="text-[110px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">🪓</span>
        )}
      </div>
    </div>
  );
}
