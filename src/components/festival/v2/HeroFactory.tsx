'use client';
import dynamic from 'next/dynamic';
import * as LucideIcons from 'lucide-react'; // Saare icons ek saath le liye
import RoyalDiya from '../heroes/RoyalDiya';
import GaneshaHero from '../heroes/GaneshaHero';
import DurgaHero from '../heroes/DurgaHero';
import HoliPalette from '../heroes/HoliPalette';
import AshokaChakra from '../heroes/AshokaChakra';
import ChristmasHero from '../heroes/ChristmasHero';
import MoonHero from '../heroes/MoonHero';

export default function HeroFactory({ visual }: { visual: string }) {
  // 1. PREMIUM CUSTOM COMPONENTS MAP
  const CustomComponents: any = {
    'ROYAL_DIYA': <RoyalDiya />,
    'GANESHA': <GaneshaHero />,
    'MAA_DURGA': <DurgaHero />,
    'VIBRANT_PALETTE': <HoliPalette />,
    'ASHOKA_CHAKRA': <AshokaChakra />,
    'CHRISTMAS_TREE': <ChristmasHero />,
    'CRESCENT_MOON': <MoonHero />,
    'MOON_SIEVE': <MoonHero />,
  };

  // 2. CHECK FOR CUSTOM COMPONENT FIRST
  if (CustomComponents[visual]) {
    return <div className="scale-125 animate-hero-breathe">{CustomComponents[visual]}</div>;
  }

  // 3. 🚀 AUTOMATIC LUCIDE MAPPING (No Hardcoding Needed)
  // Agar visual 'FLAME' hai, toh ye Lucide se 'Flame' icon utha lega
  const IconName = visual.charAt(0).toUpperCase() + visual.slice(1).toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  const DynamicIcon = (LucideIcons as any)[IconName] || (LucideIcons as any)[visual] || LucideIcons.Sparkles;

  return (
    <div className="flex items-center justify-center p-4 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl rotate-3 animate-hero-breathe">
       <DynamicIcon size={80} strokeWidth={1.5} className="text-white drop-shadow-2xl" />
    </div>
  );
}
