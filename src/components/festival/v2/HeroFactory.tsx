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

export default function HeroFactory({ config }: { config: any }) {
  if (!config) return null;

  const { render_type, visual_key, image_url, scale = 1, glow } = config;
  const glowColor = glow?.color || "rgba(255,255,255,0.15)";

  // ━━━ 1. MODE: COMPONENT (Aapka purana animated code) ━━━
  if (render_type === 'COMPONENT') {
    const PremiumMap: any = {
      'ROYAL_DIYA': <RoyalDiya />,
      'GANESHA': <GaneshaHero />,
      'MAA_DURGA': <DurgaHero />,
      'VIBRANT_PALETTE': <HoliPalette />,
      'ASHOKA_CHAKRA': <AshokaChakra />,
      'CHRISTMAS_TREE': <ChristmasHero />,
      'CRESCENT_MOON': <MoonHero />,
    };

    return (
      <div className="relative flex items-center justify-center scale-125 animate-hero-breathe">
         {PremiumMap[visual_key] || <div className="text-7xl">✨</div>}
      </div>
    );
  }

  // ━━━ 2. MODE: IMAGE (Directly from Database URL) ━━━
  if (render_type === 'IMAGE' && image_url) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 blur-3xl opacity-30 bg-white/20 rounded-full" />
        <div className="relative z-10 w-64 h-64 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl animate-hero-breathe">
           <img 
             src={image_url} 
             className="w-full h-full object-cover" 
             style={{ transform: `scale(${scale})` }}
             alt="Festival Visual" 
           />
        </div>
      </div>
    );
  }

  // ━━━ 3. MODE: LUCIDE (Dynamic Library Load) ━━━
  if (render_type === 'LUCIDE') {
    const DynamicIcon = (LucideIcons as any)[visual_key] || LucideIcons.Sparkles;
    return (
      <div className="relative flex items-center justify-center p-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl animate-hero-breathe"
           style={{ transform: `scale(${scale})` }}>
         <div className="absolute inset-0 blur-3xl opacity-20 bg-blue-500 rounded-full" />
         <DynamicIcon size={100} strokeWidth={1} className="text-white drop-shadow-2xl" />
      </div>
    );
  }

  return <div className="text-6xl animate-pulse">✨</div>;
}
