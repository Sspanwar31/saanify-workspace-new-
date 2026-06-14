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
  // Removed 'icon_name' from destructuring as per new logic to keep it simple
  const { render_type, visual_key, image_url, scale = 1, speed = 4 } = config;

  // 🚀 MASTER WRAPPER: Scaling yahan apply hogi (100% Guaranteed)
  const LayoutWrapper = ({ children }: any) => (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-visible">
      {/* Dynamic Background Aura */}
      <div className="absolute inset-0 blur-[100px] opacity-50 animate-pulse mix-blend-screen" 
           style={{ background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 75%)`, animationDuration: `${speed * 1.5}s` }} />
      
      {/* 🎯 SCALE BOX: Isme scale aur animation dono handle honge */}
      <div 
        className="relative z-10 w-full h-full flex items-center justify-center animate-hero-breathe"
        style={{ 
           transform: `scale(${scale})`, 
           transition: 'transform 0.3s ease-out', // ✨ Smooth transition added
           animationDuration: `${speed}s`
        }}
      >
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
    // Removed 'scale-125' wrapper to rely on parent LayoutWrapper scale
    return <LayoutWrapper>{PremiumComponents[visual_key]}</LayoutWrapper>;
  }

  // ━━━ LOGIC 2: IMAGE OVERRIDE (For custom upload PNGs) ━━━
  if (render_type === 'IMAGE' && image_url) {
    return (
      <LayoutWrapper>
         <img src={image_url} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="Hero" />
      </LayoutWrapper>
    );
  }

  // Default Fallback
  return <LayoutWrapper><LucideIcons.Sparkles size={80} className="text-white animate-pulse" /></LayoutWrapper>;
}
