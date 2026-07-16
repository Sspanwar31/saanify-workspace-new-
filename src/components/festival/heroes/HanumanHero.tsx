'use client';

import React from 'react';

export default function HanumanHero() {
  // 📝 Supabase Storage Custom Image URL
  const IMAGE_PATH = "https://cgntcihiwlzwkurkkarr.supabase.co/storage/v1/object/public/broadcasts/Hanuman%20JI/Screenshot%202026-07-14%20221205.png"; 

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[200px] py-2">
      {/* Dynamic Background Glow Effect (Soft Orange) */}
      <div className="absolute w-[160px] h-[160px] rounded-full bg-orange-500/20 blur-[50px] animate-pulse" style={{ animationDuration: '4s' }} />
      
      {/* Main Image Container */}
      <div className="relative z-10 transform hover:scale-105 transition-transform duration-500 ease-out flex items-center justify-center">
        {IMAGE_PATH ? (
          <img 
            src={IMAGE_PATH} 
            alt="Hanuman Jayanti" 
            // 🌟 Sizing chota kiya (max-h-[170px]) aur mix-blend-screen use kiya background ko merge karne ke liye
            className="max-w-[170px] max-h-[170px] w-auto h-auto object-contain mix-blend-screen drop-shadow-[0_10px_25px_rgba(249,115,22,0.6)]"
            // 🌟 Radial mask lagaya hai jisse rectangular edges smooth aur fade ho jayein
            style={{
              maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('span');
                fallback.className = "text-[80px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]";
                fallback.innerText = "🪓";
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <span className="text-[80px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">🪓</span>
        )}
      </div>
    </div>
  );
}
