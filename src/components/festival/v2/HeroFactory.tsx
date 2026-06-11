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
  
  // ━━━ Premium Glass Card Component (Modern Frame) ━━━
  const GlassCard = ({ children, glowColor = "rgba(255,255,255,0.15)" }: any) => (
    <div className="relative group">
      {/* Soft Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,${glowColor}_0%,transparent_70%)] blur-3xl opacity-40 transition-opacity duration-700 group-hover:opacity-60" />
      
      {/* The Card Body */}
      <div className="relative z-10 w-72 h-48 rounded-3xl border border-white/10 bg-[#0f172a]/40 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden">
        
        {/* Subtle Internal Shine/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        
        {children}
      </div>
    </div>
  );

  // 1. 🏆 PREMIUM CUSTOM COMPONENTS (SVGs)
  const PremiumComponents: any = {
    'ROYAL_DIYA': <div className="scale-[1.8] drop-shadow-[0_0_30px_rgba(255,165,0,0.5)]"><RoyalDiya /></div>,
    'GANESHA': <div className="scale-[1.8] drop-shadow-[0_0_30px_rgba(255,165,0,0.5)]"><GaneshaHero /></div>,
    'MAA_DURGA': <div className="scale-[1.8] drop-shadow-[0_0_30px_rgba(255,0,0,0.5)]"><DurgaHero /></div>,
    'VIBRANT_PALETTE': <div className="scale-[1.8] drop-shadow-[0_0_30px_rgba(255,0,100,0.5)]"><HoliPalette /></div>,
    'ASHOKA_CHAKRA': <div className="scale-[1.5] drop-shadow-[0_0_20px_rgba(0,100,255,0.6)]"><AshokaChakra /></div>,
    'CHRISTMAS_TREE': <div className="scale-[1.5] drop-shadow-[0_0_20px_rgba(0,200,0,0.5)]"><ChristmasHero /></div>,
    'CRESCENT_MOON': <div className="scale-[1.5] drop-shadow-[0_0_20px_rgba(200,200,255,0.6)]"><MoonHero /></div>,
    'MOON_SIEVE': <div className="scale-[1.5] drop-shadow-[0_0_20px_rgba(200,200,255,0.6)]"><MoonHero /></div>,
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

  // 2. 🕉️ CULTURAL SYMBOL MAPPING (Emojis styled as Stickers)
  const CulturalMap: any = {
    'KRISHNA_FLUTE': { icon: '🪈', color: '#60a5fa', shadow: 'rgba(96,165,250,0.5)' },
    'BOW_ARROW':    { icon: '🏹', color: '#fbbf24', shadow: 'rgba(251,191,36,0.5)' },
    'LORD_RAM':     { icon: '🏹', color: '#f59e0b', shadow: 'rgba(245,158,11,0.5)' },
    'RAKHI':        { icon: '🎁', color: '#f472b6', shadow: 'rgba(244,114,182,0.5)' },
    'KITES':        { icon: '🪁', color: '#38bdf8', shadow: 'rgba(56,189,248,0.5)' },
    'FIREWORKS':    { icon: '🎆', color: '#818cf8', shadow: 'rgba(129,140,248,0.5)' },
    'SUN_GOD':      { icon: '☀️', color: '#fbbf24', shadow: 'rgba(251,191,36,0.6)' },
    'SUGARCANE_POT': { icon: '🏺', color: '#4ade80', shadow: 'rgba(74,222,128,0.5)' },
    'HANUMAN_GADA': { icon: '🔱', color: '#f87171', shadow: 'rgba(248,113,113,0.6)' },
    'TRISHUL_DAMRU': { icon: '🔱', color: '#60a5fa', shadow: 'rgba(96,165,250,0.6)' },
    'KHANDA':       { icon: '☬', color: '#fbbf24', shadow: 'rgba(251,191,36,0.6)' },
    'INDIA_GATE':   { icon: '🏛️', color: '#4ade80', shadow: 'rgba(74,222,128,0.5)' },
    'ISLAMIC_GEOMETRY': { icon: '🕌', color: '#f87171', shadow: 'rgba(248,113,113,0.6)' }
  };

  if (CulturalMap[visual]) {
    const item = CulturalMap[visual];
    return (
      <div className="flex justify-center items-center h-full">
        <GlassCard glowColor={item.shadow}>
          <span 
            className="text-8xl leading-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] filter brightness-110 transform transition-transform hover:scale-110 duration-500"
          >
            {item.icon}
          </span>
        </GlassCard>
      </div>
    );
  }

  // 3. 🚀 CORPORATE & SYSTEM MAPPING (Lucide Icons in a Circle)
  const LucideMap: any = {
    'BONFIRE':      { icon: LucideIcons.Flame, color: '#f97316', shadow: 'rgba(249,115,22,0.4)' },
    'MEGAPHONE':    { icon: LucideIcons.Megaphone, color: '#3b82f6', shadow: 'rgba(59,130,246,0.4)' },
    'SIREN':        { icon: LucideIcons.AlertTriangle, color: '#ef4444', shadow: 'rgba(239,68,68,0.4)' },
    'GEAR_ICON':     { icon: LucideIcons.Settings, color: '#94a3b8', shadow: 'rgba(148,163,184,0.4)' },
    'GIFT_BOX':      { icon: LucideIcons.Gift, color: '#db2777', shadow: 'rgba(219,39,119,0.4)' },
    'CALENDAR_STAR': { icon: LucideIcons.Calendar, color: '#a855f7', shadow: 'rgba(168,85,247,0.4)' },
    'TOOLS_ICON':    { icon: LucideIcons.Wrench, color: '#f59e0b', shadow: 'rgba(245,158,11,0.4)' }
  };

  const item = LucideMap[visual] || { icon: LucideIcons.Sparkles, color: '#fbbf24', shadow: 'rgba(251,191,36,0.4)' };
  const DynamicIcon = item.icon;

  return (
    <div className="flex justify-center items-center h-full">
      <GlassCard glowColor={item.shadow}>
        <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
           <DynamicIcon size={56} strokeWidth={1.5} className="text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]" />
        </div>
      </GlassCard>
    </div>
  );
}
