'use client';

import RoyalDiya from '../heroes/RoyalDiya';
import GaneshaHero from '../heroes/GaneshaHero';
import DurgaHero from '../heroes/DurgaHero';
import HoliPalette from '../heroes/HoliPalette';
import AshokaChakra from '../heroes/AshokaChakra';
import ChristmasHero from '../heroes/ChristmasHero';
import MoonHero from '../heroes/MoonHero'; // Crescent Moon
import { 
  Rocket, Megaphone, AlertTriangle, Gift, 
  Settings, Calendar, Flame, Sun, Wind, Heart 
} from 'lucide-react';

export default function HeroFactory({ visual }: { visual: string }) {
  switch (visual) {
    // --- Traditional/Religious Heroes ---
    case 'ROYAL_DIYA': return <RoyalDiya />;
    case 'GANESHA': return <GaneshaHero />;
    case 'MAA_DURGA': return <DurgaHero />;
    case 'LORD_RAM': return <div className="scale-150"><Rocket className="text-orange-500" /></div>; // Replace with LordRam image/svg
    case 'KRISHNA_FLUTE': return <div className="text-7xl">🪈</div>;
    case 'HANUMAN_GADA': return <div className="text-7xl">🔱</div>;
    case 'KHANDA': return <div className="text-7xl">☬</div>;
    case 'CRESCENT_MOON':
    case 'MOON_SIEVE':
      return <MoonHero />;

    // --- Festival Icons ---
    case 'VIBRANT_PALETTE': return <HoliPalette />;
    case 'CHRISTMAS_TREE': return <ChristmasHero />;
    case 'ASHOKA_CHAKRA': return <AshokaChakra />;
    case 'INDIAN_FLAG': return <AshokaChakra />; // Reuse logic
    case 'BONFIRE': return <Flame className="w-24 h-24 text-orange-600 animate-bounce" />;
    case 'KITES': return <Wind className="w-24 h-24 text-blue-400 animate-pulse" />;
    case 'SUN_GOD': return <Sun className="w-24 h-24 text-yellow-500 animate-spin-slow" />;
    case 'RAKHI': return <Heart className="w-24 h-24 text-pink-500 animate-pulse" />;
    case 'FIREWORKS': return <div className="text-8xl animate-bounce">🎆</div>;

    // --- Broadcast/System Icons ---
    case 'MEGAPHONE': return <Megaphone className="w-24 h-24 text-blue-400 animate-bounce" />;
    case 'SIREN': return <AlertTriangle className="w-24 h-24 text-red-500 animate-pulse" />;
    case 'GEAR_ICON': return <Settings className="w-24 h-24 text-slate-400 animate-spin" />;
    case 'GIFT_BOX': return <Gift className="w-24 h-24 text-pink-500 animate-bounce" />;
    case 'CALENDAR_STAR': return <Calendar className="w-24 h-24 text-purple-400 animate-pulse" />;
    case 'TOOLS_ICON': return <Settings className="w-24 h-24 text-orange-400" />;

    default:
      return <div className="text-7xl animate-pulse">✨</div>;
  }
}
