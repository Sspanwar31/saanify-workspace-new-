'use client';

import * as LucideIcons from 'lucide-react';
import RoyalDiya from '../heroes/RoyalDiya';
import GaneshaHero from '../heroes/GaneshaHero';
import DurgaHero from '../heroes/DurgaHero';
import HoliPalette from '../heroes/HoliPalette';
import AshokaChakra from '../heroes/AshokaChakra';
import ChristmasHero from '../heroes/ChristmasHero';
import MoonHero from '../heroes/MoonHero';

export default function HeroFactory({ visual }: { visual: string }) {
  
  // ━━━ Helper: Visual Wrapper taaki saare icons ek jaise premium dikhein ━━━
  const VisualWrapper = ({ children, glowColor = "rgba(255,255,255,0.2)" }: any) => (
    <div className="relative flex items-center justify-center p-8 sm:p-10">
      {/* 🚀 Dynamic Glow Layer */}
      <div className="absolute inset-0 blur-[80px] rounded-full opacity-40 animate-pulse" 
           style={{ backgroundColor: glowColor }} />
      
      {/* 🚀 The Premium Glass Container */}
      <div className="relative z-10 bg-white/10 backdrop-blur-3xl border border-white/20 p-8 rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] rotate-3 animate-hero-breathe flex items-center justify-center min-w-[180px] min-h-[180px]">
         {children}
      </div>
    </div>
  );

  // 1. 🏆 PREMIUM CUSTOM COMPONENTS
  const PremiumComponents: any = {
    'ROYAL_DIYA': <div className="scale-[1.8]"><RoyalDiya /></div>,
    'GANESHA': <div className="scale-[1.8]"><GaneshaHero /></div>,
    'MAA_DURGA': <div className="scale-[1.8]"><DurgaHero /></div>,
    'VIBRANT_PALETTE': <div className="scale-[1.8]"><HoliPalette /></div>,
    'ASHOKA_CHAKRA': <div className="scale-[1.5]"><AshokaChakra /></div>,
    'CHRISTMAS_TREE': <div className="scale-[1.5]"><ChristmasHero /></div>,
    'CRESCENT_MOON': <div className="scale-[1.5]"><MoonHero /></div>,
    'MOON_SIEVE': <div className="scale-[1.5]"><MoonHero /></div>,
  };

  if (PremiumComponents[visual]) {
    return <div className="flex justify-center items-center h-full">{PremiumComponents[visual]}</div>;
  }

  // 2. 🕉️ CULTURAL SYMBOL MAPPING (Professional 3D Style)
  const CulturalMap: any = {
    'KRISHNA_FLUTE': { icon: '🪈', color: '#60a5fa' },
    'BOW_ARROW':    { icon: '🏹', color: '#fbbf24' },
    'LORD_RAM':     { icon: '🏹', color: '#f59e0b' },
    'RAKHI':        { icon: '🎁', color: '#f472b6' },
    'KITES':        { icon: '🪁', color: '#38bdf8' },
    'FIREWORKS':    { icon: '🎆', color: '#818cf8' },
    'SUN_GOD':      { icon: '☀️', color: '#fbbf24' },
    'SUGARCANE_POT': { icon: '🏺', color: '#4ade80' },
    'HANUMAN_GADA': { icon: '🔱', color: '#f87171' },
    'TRISHUL_DAMRU': { icon: '🔱', color: '#60a5fa' },
    'KHANDA':       { icon: '☬', color: '#fbbf24' },
    'INDIA_GATE':   { icon: '🏛️', color: '#4ade80' }
  };

  if (CulturalMap[visual]) {
    return (
      <VisualWrapper glowColor={CulturalMap[visual].color}>
        <span className="text-[100px] leading-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] filter brightness-110">
          {CulturalMap[visual].icon}
        </span>
      </VisualWrapper>
    );
  }

  // 3. 🚀 CORPORATE & SYSTEM MAPPING (Lucide Modernized)
  const LucideMap: any = {
    'BONFIRE':      { icon: LucideIcons.Flame, color: '#f97316' },
    'MEGAPHONE':    { icon: LucideIcons.Megaphone, color: '#3b82f6' },
    'SIREN':        { icon: LucideIcons.AlertTriangle, color: '#ef4444' },
    'GEAR_ICON':     { icon: LucideIcons.Settings, color: '#94a3b8' },
    'GIFT_BOX':      { icon: LucideIcons.Gift, color: '#db2777' },
    'CALENDAR_STAR': { icon: LucideIcons.Calendar, color: '#a855f7' },
    'TOOLS_ICON':    { icon: LucideIcons.Wrench, color: '#f59e0b' }
  };

  const item = LucideMap[visual] || { icon: LucideIcons.Sparkles, color: '#fbbf24' };
  const DynamicIcon = item.icon;

  return (
    <VisualWrapper glowColor={item.color}>
       <DynamicIcon size={90} strokeWidth={1} className="text-white drop-shadow-2xl" />
    </VisualWrapper>
  );
}
