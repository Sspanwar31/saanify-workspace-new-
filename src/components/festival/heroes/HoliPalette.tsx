'use client';
import { Palette } from 'lucide-react';

export default function HoliPalette() {
  return (
    <div className="relative flex items-center justify-center">
      {/* 🚀 Background Glows (Vibrant Colors) */}
      <div className="absolute -inset-10 bg-pink-500/30 blur-[60px] animate-pulse" />
      <div className="absolute -inset-10 bg-yellow-400/20 blur-[80px] animate-pulse delay-700" />
      
      {/* 🚀 The Palette Card (Premium Glass) */}
      <div className="relative bg-white/10 backdrop-blur-3xl border border-white/20 p-8 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] rotate-6 transform hover:rotate-0 transition-all duration-700">
        
        {/* Colors (Gulal representation) */}
        <div className="flex gap-2 mb-4 justify-center">
            <div className="w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_15px_#ec4899]" />
            <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_15px_#facc15]" />
            <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
        </div>

        <Palette className="w-20 h-20 text-white filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" strokeWidth={1.5} />
        
        {/* Decorative Splash */}
        <div className="absolute -bottom-2 -right-2 text-3xl animate-bounce">🌈</div>
      </div>
    </div>
  );
}
