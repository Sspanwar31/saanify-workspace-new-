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

// 🚀 1. MODERN ICON LIBRARY (Aapka Diya hua data + Premium Sizes)
const ModernFestivalIconMap: any = {
  fire: <LucideIcons.Flame className="w-24 h-24 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />,
  moon: <LucideIcons.MoonStar className="w-24 h-24 text-indigo-300 drop-shadow-[0_0_12px_rgba(165,180,252,0.5)]" />,
  rakhi: <LucideIcons.HeartHandshake className="w-24 h-24 text-pink-500 stroke-[1.5]" />,
  tree: <LucideIcons.Trees className="w-24 h-24 text-emerald-600 stroke-[1.5]" />,
  diya: (
    <svg viewBox="0 0 24 24" className="w-24 h-24 fill-none stroke-amber-500 stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14c0 4.4 3.6 8 8 8h4c4.4 0 8-3.6 8-8 0-4-3-7-7-7.8V3c0-.6-.4-1-1-1s-1 .4-1 1v3.2c-4 .8-7 3.8-7 7.8z" />
      <path d="M12 9c-1.1 0-2 .9-2 2s2 3 2 3 2-1.9 2-3-.9-2-2-2z" className="fill-orange-400 stroke-none animate-pulse" />
    </svg>
  ),
  flute: (
    <svg viewBox="0 0 24 24" className="w-24 h-24 fill-none stroke-amber-600 stroke-[1.5]">
      <path d="M3 19L19 3M5 17h.01M8 14h.01M11 11h.01M14 8h.01" strokeLinecap="round"/>
      <path d="M18 6l3 3" strokeLinecap="round" />
    </svg>
  ),
  DURGA: (
    <svg viewBox="0 0 24 24" className="w-24 h-24 fill-none stroke-red-600 stroke-[1.5]" strokeLinecap="round">
      <path d="M12 2v20M6 5c1 3 2 5 6 5s5-2 6-5M9 10c0 2 1 4 3 4s3-2 3-4" />
    </svg>
  ),
  bow: <LucideIcons.Crosshair className="w-24 h-24 text-rose-500 rotate-45" />,
  khanda: (
    <svg viewBox="0 0 24 24" className="w-24 h-24 fill-amber-500">
      <path d="M12 2c-.5 0-1 .4-1 1v4.1C7.6 7.6 5 10.5 5 14c0 3.9 3.1 7 7 7s7-3.1 7-7c0-3.5-2.6-6.4-6-6.9V3c0-.6-.4-1-1-1zm0 7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z"/>
    </svg>
  ),
  kite: (
    <svg viewBox="0 0 24 24" className="w-24 h-24 fill-none stroke-sky-500 stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 10l8 8 8-8zM4 10h16M12 2v16M12 18l-2 4h4z" />
    </svg>
  ),
  colors: <LucideIcons.PaintbrushVertical className="w-24 h-24 text-purple-500 stroke-[1.5]" />,
  ganesha: (
    <svg viewBox="0 0 24 24" className="w-24 h-24 fill-none stroke-orange-500 stroke-[1.5]" strokeLinecap="round">
      <path d="M5 10c0-4 3-7 7-7s7 3 7 7c0 3-2 5-4 7v3c0 1.5-1.5 2-3 2s-2-.5-2-2M9 7h6M12 3v4" />
    </svg>
  ),
  flag: <LucideIcons.Flag className="w-24 h-24 text-cyan-600 fill-cyan-50" />,
  fireworks: <LucideIcons.Sparkles className="w-24 h-24 text-yellow-400 animate-bounce" />,
  sun: <LucideIcons.SunDim className="w-24 h-24 text-amber-500 stroke-[1.5]" />,
  gada: (
    <svg viewBox="0 0 24 24" className="w-24 h-24 fill-none stroke-yellow-600 stroke-[1.5]" strokeLinecap="round">
      <path d="M12 10V22M8 6a4 4 0 1 1 8 0v4H8V6zM6 10h12" />
    </svg>
  )
};

export default function HeroFactory({ config, themeColor = '#fbbf24' }: { config: any, themeColor?: string }) {
  if (!config) return null;
  const { render_type, visual_key, image_url, scale = 1, speed = 4, icon_name } = config;

  // 🚀 2. DYNAMIC WRAPPER
  const LayoutWrapper = ({ children, customGlow }: any) => (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-6 overflow-visible">
      {/* Golden Saanify Tag */}
      <div className="absolute top-6 left-8 z-50 select-none">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-500 to-amber-200 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              SAANIFY PARIVAR
          </span>
      </div>
      {/* Background Aura */}
      <div className="absolute inset-0 blur-[100px] opacity-50 animate-pulse mix-blend-screen" 
           style={{ background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 75%)`, animationDuration: `${speed * 1.5}s` }} />
      {/* Icon Frame */}
      <div className="relative z-10 w-72 h-72 flex items-center justify-center animate-hero-breathe transition-all duration-500"
           style={{ transform: `scale(${scale})`, animationDuration: `${speed}s` }}>
         {children}
      </div>
    </div>
  );

  // ━━━ LOGIC 1: CUSTOM COMPONENTS ━━━
  const PremiumComponents: any = {
    'ROYAL_DIYA': <RoyalDiya />, 'GANESHA': <GaneshaHero />, 'MAA_DURGA': <DurgaHero />,
    'VIBRANT_PALETTE': <HoliPalette />, 'ASHOKA_CHAKRA': <AshokaChakra />,
    'CHRISTMAS_TREE': <ChristmasHero />, 'CRESCENT_MOON': <MoonHero />
  };

  if (render_type === 'COMPONENT' && PremiumComponents[visual_key]) {
    return <LayoutWrapper><div className="scale-125">{PremiumComponents[visual_key]}</div></LayoutWrapper>;
  }

  // ━━━ LOGIC 2: MODERN ICON MAP (THE NEW STUFF) ━━━
  const targetIcon = icon_name || visual_key?.toLowerCase();
  if (ModernFestivalIconMap[targetIcon]) {
    return <LayoutWrapper>{ModernFestivalIconMap[targetIcon]}</LayoutWrapper>;
  }

  // ━━━ LOGIC 3: IMAGE OVERRIDE ━━━
  if (render_type === 'IMAGE' && image_url) {
    return (
      <LayoutWrapper>
         <div className="w-full h-full p-4 flex items-center justify-center">
           <img src={image_url} className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" alt="Hero" />
         </div>
      </LayoutWrapper>
    );
  }

  return <LayoutWrapper><LucideIcons.Sparkles size={80} className="text-white animate-pulse" /></LayoutWrapper>;
}
