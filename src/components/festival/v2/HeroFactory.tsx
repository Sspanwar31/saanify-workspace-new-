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

export default function HeroFactory({ visual }: { visual: string }) {
  
  // ━━━ Premium Glass Card Component ━━━
  const GlassCard = ({ children, glowColor = "rgba(255,255,255,0.15)" }: any) => (
    <div className="relative group flex items-center justify-center">
      {/* Glow Layer */}
      <div 
        className="absolute inset-0 blur-3xl opacity-30 transition-opacity duration-700 group-hover:opacity-50" 
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
      
      {/* The Card Body */}
      <div className="relative z-10 w-72 h-56 rounded-[3rem] border border-white/10 bg-[#0f172a]/40 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-visible">
        {/* Subtle Shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none rounded-[3rem]" />
        {children}
      </div>
    </div>
  );

  // 1. 🏆 PREMIUM CUSTOM COMPONENTS (Scales Adjusted to prevent "Too Big" issue)
  const PremiumComponents: any = {
    // Diya ko scale-100 rakha hai kyunki wo pehle se bada tha
    'ROYAL_DIYA': <div className="transform scale-100 transition-transform"><RoyalDiya /></div>,
    
    // Baaki components ko scale-100 (1.5x) rakha hai, scale-150 nahi
    'GANESHA': <div className="transform scale-100"><GaneshaHero /></div>,
    'MAA_DURGA': <div className="transform scale-100"><DurgaHero /></div>,
    'VIBRANT_PALETTE': <div className="transform scale-100"><HoliPalette /></div>,
    
    // Normal size components
    'ASHOKA_CHAKRA': <div className="transform scale-100"><AshokaChakra /></div>,
    'CHRISTMAS_TREE': <div className="transform scale-100"><ChristmasHero /></div>,
    'CRESCENT_MOON': <div className="transform scale-100"><MoonHero /></div>,
    'MOON_SIEVE': <div className="transform scale-100"><MoonHero /></div>,
  };

  if (PremiumComponents[visual]) {
    return (
      <div className="flex justify-center items-center h-full">
        <GlassCard glowColor="rgba(255, 165, 0, 0.3)">
          {PremiumComponents[visual]}
        </GlassCard>
      </div>
    );
  }

  // 2. 🕉️ CULTURAL SYMBOL MAPPING
  const CulturalMap: any = {
    'KRISHNA_FLUTE': { icon: '🪈', color: 'rgba(96,165,250,0.4)' },
    'BOW_ARROW':    { icon: '🏹', color: 'rgba(251,191,36,0.4)' },
    'LORD_RAM':     { icon: '🏹', color: 'rgba(245,158,11,0.4)' },
    'RAKHI':        { icon: '🎁', color: 'rgba(244,114,182,0.4)' },
    'KITES':        { icon: '🪁', color: 'rgba(56,189,248,0.4)' },
    'FIREWORKS':    { icon: '🎆', color: 'rgba(129,140,248,0.4)' },
    'SUN_GOD':      { icon: '☀️', color: 'rgba(251,191,36,0.5)' },
    'SUGARCANE_POT': { icon: '🏺', color: 'rgba(74,222,128,0.4)' },
    'HANUMAN_GADA': { icon: '🔱', color: 'rgba(248,113,113,0.5)' },
    'TRISHUL_DAMRU': { icon: '🔱', color: 'rgba(96,165,250,0.5)' },
    'KHANDA':       { icon: '☬', color: 'rgba(251,191,36,0.5)' },
    'INDIA_GATE':   { icon: '🏛️', color: 'rgba(74,222,128,0.4)' },
    'ISLAMIC_GEOMETRY': { icon: '🕌', color: 'rgba(248,113,113,0.5)' }
  };

  if (CulturalMap[visual]) {
    const item = CulturalMap[visual];
    return (
      <div className="flex justify-center items-center h-full">
        <GlassCard glowColor={item.color}>
          <span className="text-8xl leading-none drop-shadow-2xl filter brightness-110 hover:scale-110 transition-transform duration-500">
            {item.icon}
          </span>
        </GlassCard>
      </div>
    );
  }

  // 3. 🚀 CORPORATE & SYSTEM MAPPING
  const LucideMap: any = {
    'BONFIRE':      { icon: LucideIcons.Flame, color: 'rgba(249,115,22,0.4)' },
    'MEGAPHONE':    { icon: LucideIcons.Megaphone, color: 'rgba(59,130,246,0.4)' },
    'SIREN':        { icon: LucideIcons.AlertTriangle, color: 'rgba(239,68,68,0.4)' },
    'GEAR_ICON':     { icon: LucideIcons.Settings, color: 'rgba(148,163,184,0.4)' },
    'GIFT_BOX':      { icon: LucideIcons.Gift, color: 'rgba(219,39,119,0.4)' },
    'CALENDAR_STAR': { icon: LucideIcons.Calendar, color: 'rgba(168,85,247,0.4)' },
    'TOOLS_ICON':    { icon: LucideIcons.Wrench, color: 'rgba(245,158,11,0.4)' }
  };

  const item = LucideMap[visual] || { icon: LucideIcons.Sparkles, color: 'rgba(251,191,36,0.4)' };
  const DynamicIcon = item.icon;

  return (
    <div className="flex justify-center items-center h-full">
      <GlassCard glowColor={item.color}>
        <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
           <DynamicIcon size={56} strokeWidth={1.5} className="text-white drop-shadow-xl" />
        </div>
      </GlassCard>
    </div>
  );
}
