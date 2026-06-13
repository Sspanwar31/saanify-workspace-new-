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

  const { render_type, visual_key, image_url, scale = 1 } = config;

  // 🚀 MASTER SCALE WRAPPER (Apply scale to everything)
  const Wrapper = ({ children }: any) => (
    <div style={{ transform: `scale(${scale})` }} className="transition-all duration-500 ease-out flex items-center justify-center">
      {children}
    </div>
  );

  // 1. COMPONENT MODE
  if (render_type === 'COMPONENT') {
    const PremiumMap: any = {
      'ROYAL_DIYA': <RoyalDiya />,
      'GANESHA': <GaneshaHero />,
      'MAA_DURGA': <DurgaHero />,
      'VIBRANT_PALETTE': <HoliPalette />,
      'ASHOKA_CHAKRA': <AshokaChakra />,
      'CHRISTMAS_TREE': <ChristmasHero />,
      'CRESCENT_MOON': <MoonHero />,
      'MOON_SIEVE': <MoonHero />,
    };
    return <Wrapper>{PremiumMap[visual_key] || <div className="text-4xl text-white">Select Template</div>}</Wrapper>;
  }

  // 2. LUCIDE MODE (Auto-Fix Case Sensitivity)
  if (render_type === 'LUCIDE') {
    // Force PascalCase (flame -> Flame)
    const formattedKey = visual_key ? visual_key.charAt(0).toUpperCase() + visual_key.slice(1).toLowerCase() : 'Sparkles';
    const DynamicIcon = (LucideIcons as any)[formattedKey] || LucideIcons.Sparkles;
    
    return (
      <Wrapper>
        <div className="p-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-2xl">
           <DynamicIcon size={100} strokeWidth={1} className="text-white drop-shadow-2xl" />
        </div>
      </Wrapper>
    );
  }

  // ━━━ 3. MODE: IMAGE (Updated for Auto-Fit & Animation) ━━━
  if (render_type === 'IMAGE' && image_url) {
    return (
      <div className="relative flex items-center justify-center w-full h-full p-4">
        {/* 🚀 Background Glow (Image ke piche ka rang) */}
        <div className="absolute inset-0 blur-[60px] opacity-30 bg-white/20 rounded-full animate-pulse" />
        
        {/* 🚀 The Image Wrapper with Breathing Animation */}
        <div className="relative z-10 w-72 h-72 flex items-center justify-center animate-hero-breathe overflow-visible">
           <img 
             src={image_url} 
             className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(255,255,255,0.3)]" 
             style={{ transform: `scale(${scale})` }}
             alt="Festival Visual" 
           />
        </div>
      </div>
    );
  }

  return <div className="text-4xl animate-pulse text-white/20">✨</div>;
}
