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
  
  // 1. 🏆 PREMIUM CUSTOM COMPONENTS (Exact DB Keys)
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
    return <div className="scale-125 animate-hero-breathe">{PremiumComponents[visual]}</div>;
  }

  // 2. 🕉️ CULTURAL SYMBOL MAPPING (For 31 Festivals)
  // Yeh section ensure karega ki Star ki jagah sahi icon dikhe
  const CulturalMap: any = {
    'KRISHNA_FLUTE': '🪈',
    'BOW_ARROW': '🏹',
    'LORD_RAM': '🏹',
    'RAKHI': '🎁',
    'KITES': '🪁',
    'FIREWORKS': '🎆',
    'SUN_GOD': '☀️',
    'SUGARCANE_POT': '🏺',
    'HANUMAN_GADA': '🔱',
    'TRISHUL_DAMRU': '🔱',
    'KHANDA': '☬',
    'INDIA_GATE': '🏛️'
  };

  if (CulturalMap[visual]) {
    return (
      <div className="flex items-center justify-center p-6 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl rotate-3 animate-hero-breathe">
        <span className="text-8xl drop-shadow-2xl filter brightness-110">{CulturalMap[visual]}</span>
      </div>
    );
  }

  // 3. 🚀 CORPORATE & BROADCAST MAPPING (Lucide Icons)
  // Automatic mapping to Lucide Library
  const LucideMap: any = {
    'BONFIRE': LucideIcons.Flame,
    'MEGAPHONE': LucideIcons.Megaphone,
    'SIREN': LucideIcons.AlertTriangle,
    'GEAR_ICON': LucideIcons.Settings,
    'GIFT_BOX': LucideIcons.Gift,
    'CALENDAR_STAR': LucideIcons.Calendar,
    'TOOLS_ICON': LucideIcons.Wrench
  };

  const DynamicIcon = LucideMap[visual] || LucideIcons.Sparkles;

  // Icon Color logic based on visual name
  const getIconColor = () => {
    if(visual === 'SIREN') return 'text-red-500';
    if(visual === 'BONFIRE') return 'text-orange-500';
    if(visual === 'GIFT_BOX') return 'text-pink-500';
    return 'text-white';
  };

  return (
    <div className="flex items-center justify-center p-6 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl rotate-3 animate-hero-breathe">
       <DynamicIcon size={80} strokeWidth={1.5} className={`${getIconColor()} drop-shadow-2xl`} />
    </div>
  );
}
