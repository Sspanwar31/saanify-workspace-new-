'use client';
import React from 'react';
import * as LucideIcons from 'lucide-react';
import RoyalDiya from '../heroes/RoyalDiya';
import GaneshaHero from '../heroes/GaneshaHero';
import DurgaHero from '../heroes/DurgaHero';
import HoliPalette from '../heroes/HoliPalette';
import AshokaChakra from '../heroes/AshokaChakra';
import ChristmasHero from '../heroes/ChristmasHero';
import MoonHero from '../heroes/MoonHero';

// Logic unchanged: Props structure same rahega
export default function HeroFactory({ config, themeColor = '#fbbf24' }: { config: any, themeColor?: string }) {
  if (!config) return null;

  const { render_type, visual_key, image_url, scale = 1, speed = 4 } = config;

  const animationStyle = { 
    animationDuration: `${speed}s`,
    transform: `scale(${scale})`
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-6 overflow-visible">
      
      {/* ✨ MINIMALIST BRAND TAG (Clean & Spaced) */}
      {/* 1. Box hata diya. 2. Letter spacing badha di (tracking-[0.4em]). */}
      <div className="absolute top-6 left-6 z-50 select-none pointer-events-none">
          <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-white/80 drop-shadow-md leading-none">
              SAANIFY PARIVAR
          </span>
      </div>

      {/* 🌈 DYNAMIC FESTIVAL AURA */}
      <div 
        className="absolute inset-0 blur-[100px] opacity-60 animate-pulse mix-blend-screen" 
        style={{ 
          background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 75%)`,
          animationDuration: `${speed * 1.5}s`
        }} 
      />
      
      {/* 🚀 THE HERO WRAPPER */}
      <div className="relative z-10 w-72 h-72 flex items-center justify-center animate-hero-breathe transition-all duration-500"
           style={animationStyle}>
         
         {/* MODE 1: COMPONENT */}
         {render_type === 'COMPONENT' && (
           <div className="scale-125">
              {{
                'ROYAL_DIYA': <RoyalDiya />,
                'GANESHA': <GaneshaHero />,
                'MAA_DURGA': <DurgaHero />,
                'VIBRANT_PALETTE': <HoliPalette />,
                'ASHOKA_CHAKRA': <AshokaChakra />,
                'CHRISTMAS_TREE': <ChristmasHero />,
                'CRESCENT_MOON': <MoonHero />
              }[visual_key] || <LucideIcons.Sparkles size={100} className="text-white" />}
           </div>
         )}

         {/* MODE 2: LUCIDE */}
         {render_type === 'LUCIDE' && (() => {
            const formatted = visual_key ? visual_key.charAt(0).toUpperCase() + visual_key.slice(1).toLowerCase() : 'Sparkles';
            const Icon = (LucideIcons as any)[formatted] || LucideIcons.Sparkles;
            return <Icon size={120} strokeWidth={1} className="text-white drop-shadow-2xl" />;
         })()}

         {/* MODE 3: IMAGE */}
         {render_type === 'IMAGE' && image_url && (
           <div className="w-full h-full p-4">
             <img src={image_url} className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" alt="Festival" />
           </div>
         )}
      </div>

      <style jsx global>{`
        @keyframes hero-breathe {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.08); filter: brightness(1.2); }
        }
        .animate-hero-breathe { animation: hero-breathe linear infinite; }
      `}</style>
    </div>
  );
}
