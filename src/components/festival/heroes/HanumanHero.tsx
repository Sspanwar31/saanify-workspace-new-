'use client';

import React from 'react';

export default function HanumanHero() {
  // 📝 Yahan aap apni custom image ka path change kar sakte hain
  const IMAGE_PATH = "/images/festivals/hanuman-jayanti.png"; 

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[280px]">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute w-[200px] h-[200px] rounded-full bg-orange-600/30 blur-3xl animate-pulse" />
      
      {/* Main Image Container */}
      <div className="relative z-10 transform hover:scale-105 transition-transform duration-500 ease-out">
        {IMAGE_PATH ? (
          <img 
            src={IMAGE_PATH} 
            alt="Hanuman Jayanti" 
            className="max-w-[280px] max-h-[280px] object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.4)]"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          // Fallback Emoji if no image path is provided
          <span className="text-[110px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">🪓</span>
        )}
      </div>
    </div>
  );
}
