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

// 🚀 Naya Interface: Ab hum poora config object accept karenge
export default function HeroFactory({ config }: { config: any }) {
  
  // Database se aane waali values nikalna
  const visual = config?.visual_key || 'SPARKLES';
  const scale = config?.scale || 1.0;
  const glowColor = config?.glow?.color || "rgba(255,255,255,0.15)";

  // ━━━ Premium Glass Card Component ━━━
  const GlassCard = ({ children, customGlow }: any) => (
    <div className="relative group flex items-center justify-center">
      {/* 🎨 DYNAMIC GLOW: Ab ye database se aayega */}
      <div 
        className="absolute inset-0 blur-3xl opacity-30 transition-opacity duration-700 group-hover:opacity-50" 
        style={{ background: `radial-gradient(circle, ${customGlow} 0%, transparent 70%)` }}
      />
      
      <div className="relative z-10 w-72 h-56 rounded-[3rem] border border-white/10 bg-[#0f172a]/40 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none rounded-[3rem]" />
        
        {/* 🚀 DYNAMIC SCALE: Ab hum CSS se scale control karenge */}
        <div style={{ transform: `scale(${scale})` }} className="transition-transform duration-500">
           {children}
        </div>
      </div>
    </div>
  );

  // 1. 🏆 PREMIUM CUSTOM COMPONENTS
  const PremiumComponents: any = {
    'ROYAL_DIYA': <RoyalDiya />,
    'GANESHA': <GaneshaHero />,
    'MAA_DURGA': <DurgaHero />,
    'VIBRANT_PALETTE': <HoliPalette />,
    'ASHOKA_CHAKRA': <AshokaChakra />,
    'CHRISTMAS_TREE': <ChristmasHero />,
    'CRESCENT_MOON': <MoonHero />,
    'MOON_SIEVE': <MoonHero />,
  };

  if (PremiumComponents[visual]) {
    return (
      <div className="flex justify-center items-center h-full">
        <GlassCard customGlow={glowColor}>
          {PremiumComponents[visual]}
        </GlassCard>
      </div>
    );
  }

  // 2. 🕉️ CULTURAL SYMBOL MAPPING
  const CulturalMap: any = {
    'KRISHNA_FLUTE': '🪈', 'BOW_ARROW': '🏹', 'LORD_RAM': '🏹',
    'RAKHI': '🎁', 'KITES': '🪁', 'FIREWORKS': '🎆', 'SUN_GOD': '☀️',
    'SUGARCANE_POT': '🏺', 'HANUMAN_GADA': '🔱', 'TRISHUL_DAMRU': '🔱',
    'KHANDA': '☬', 'INDIA_GATE': '🏛️', 'ISLAMIC_GEOMETRY': '🕌'
  };

  if (CulturalMap[visual]) {
    return (
      <div className="flex justify-center items-center h-full">
        <GlassCard customGlow={glowColor}>
          <span className="text-8xl leading-none drop-shadow-2xl filter brightness-110">
            {CulturalMap[visual]}
          </span>
        </GlassCard>
      </div>
    );
  }

  // 3. 🚀 CORPORATE & SYSTEM MAPPING
  const LucideMap: any = {
    'BONFIRE': LucideIcons.Flame, 'MEGAPHONE': LucideIcons.Megaphone,
    'SIREN': LucideIcons.AlertTriangle, 'GEAR_ICON': LucideIcons.Settings,
    'GIFT_BOX': LucideIcons.Gift, 'CALENDAR_STAR': LucideIcons.Calendar,
    'TOOLS_ICON': LucideIcons.Wrench
  };

  const DynamicIcon = LucideMap[visual] || LucideIcons.Sparkles;

  return (
    <div className="flex justify-center items-center h-full">
      <GlassCard customGlow={glowColor}>
        <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
           <DynamicIcon size={56} strokeWidth={1.5} className="text-white drop-shadow-xl" />
        </div>
      </GlassCard>
    </div>
  );
}
