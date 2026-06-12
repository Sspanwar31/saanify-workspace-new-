'use client';
import { Flame } from 'lucide-react';

export default function RoyalDiya() {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 w-full h-full">
      
      {/* 🪔 Golden Glow */}
      <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full" />

      {/* 🪔 The Diya (Hero) */}
      <div className="relative mb-4 drop-shadow-[0_0_40px_rgba(245,158,11,0.8)]">
         <div className="text-[100px] leading-none animate-hero-breathe">🪔</div>
         
         {/* Flame Aura */}
         <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-orange-400 blur-xl rounded-full animate-pulse" />
      </div>

      {/* 🏷️ Text Badge */}
      <div className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-amber-400/30 shadow-lg">
         <span className="text-amber-300 font-bold text-sm tracking-widest uppercase">
            Festival of Lights
         </span>
      </div>
    </div>
  );
}
