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

export default function HeroFactory({ config, themeColor = '#fbbf24' }: { config: any, themeColor?: string }) {
  if (!config) return null;
  const { render_type, visual_key, image_url, scale = 1, speed = 4, icon_name } = config;

  // 🚀 DYNAMIC WRAPPER
  const LayoutWrapper = ({ children }: any) => (
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

  // ━━━ 🏆 HARDCODED MASTER COMPONENTS (Strictly Matching 24 Table Keys) ━━━
  const PremiumComponents: any = {
    // 1. Premium Hand-made Animated React Components
    'ROYAL_DIYA': <RoyalDiya />,
    'GANGA_GHAT_DIYA': <RoyalDiya />, // Dev Deepawali
    'ROYAL_GANESHA': <GaneshaHero />,
    'VIBRANT_PALETTE': <HoliPalette />,
    'XMAS_TREE': <ChristmasHero />,
    'DHARMA_CHAKRA': <AshokaChakra />,
    'DIVINE_TRISHUL': <DurgaHero />, // Durga Puja

    // 2. High-End Branded Emojis (Sized as 3D Stickers)
    'DANDIYA_BEAT': <span className="text-[120px] drop-shadow-2xl">🥁</span>,
    'RAVAN_DAHAN': <span className="text-[120px] drop-shadow-2xl">🏹</span>,
    'BABY_KRISHNA': <span className="text-[120px] drop-shadow-2xl">🪈</span>,
    'BROTHER_BOND': <span className="text-[120px] drop-shadow-2xl">🎁</span>,
    'KITES_FLYING': <span className="text-[120px] drop-shadow-2xl">🪁</span>,
    'REAL_BONFIRE': <span className="text-[120px] drop-shadow-2xl">🔥</span>,
    'SHIVA_POWER': <span className="text-[120px] drop-shadow-2xl">🔱</span>,
    'RAM_DHARMA': <span className="text-[120px] drop-shadow-2xl">🏹</span>,
    'HANUMAN_GADA': <span className="text-[120px] drop-shadow-2xl">🔱</span>,
    'MOON_SIEVE': <span className="text-[120px] drop-shadow-2xl">🌕</span>,
    'SUN_ARGHYA': <span className="text-[120px] drop-shadow-2xl">☀️</span>,
    'HARVEST_POT': <span className="text-[120px] drop-shadow-2xl">🏺</span>,
    'EID_MUBARAK': <span className="text-[120px] drop-shadow-2xl">🌙</span>,
    'HOLY_KAABA': <span className="text-[120px] drop-shadow-2xl">🕋</span>,
    'NY_COUNTDOWN': <span className="text-[120px] drop-shadow-2xl">🕰️</span>,
    'NATIONAL_PRIDE': <span className="text-[120px] drop-shadow-2xl">🏛️</span>,
    'SIKH_KHANDA': <span className="text-[120px] drop-shadow-2xl">☬</span>,
  };

  if (render_type === 'COMPONENT' && PremiumComponents[visual_key]) {
    return <LayoutWrapper><div className="scale-125">{PremiumComponents[visual_key]}</div></LayoutWrapper>;
  }

  // ━━━ LOGIC 2: IMAGE OVERRIDE (For custom upload PNGs) ━━━
  if (render_type === 'IMAGE' && image_url) {
    return (
      <LayoutWrapper>
         <div className="w-full h-full p-4 flex items-center justify-center">
           <img src={image_url} className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" alt="Hero" />
         </div>
      </LayoutWrapper>
    );
  }

  // Default Fallback
  return <LayoutWrapper><LucideIcons.Sparkles size={80} className="text-white animate-pulse" /></LayoutWrapper>;
}
