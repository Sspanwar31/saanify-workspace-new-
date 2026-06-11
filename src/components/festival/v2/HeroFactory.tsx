'use client';

import RoyalDiya from '../heroes/RoyalDiya';
import GaneshaHero from '../heroes/GaneshaHero';
import DurgaHero from '../heroes/DurgaHero';
import HoliPalette from '../heroes/HoliPalette';
import AshokaChakra from '../heroes/AshokaChakra';
import ChristmasHero from '../heroes/ChristmasHero';
import MoonHero from '../heroes/MoonHero';

// ✅ Updated Imports to include all used icons
import { 
  Flame, Sun, Wind, Megaphone, Settings, 
  AlertTriangle, Gift, Heart, Calendar, 
  Tent, Moon, Star, MapPin 
} from 'lucide-react';

export default function HeroFactory({ visual }: { visual: string }) {
  // 🚀 FIXED: Every case now matches your exact Database Keys
  switch (visual) {
    // --- 1. Master Premium Components ---
    case 'ROYAL_DIYA': return <RoyalDiya />;
    case 'GANESHA': return <GaneshaHero />;
    case 'MAA_DURGA': return <DurgaHero />;
    case 'VIBRANT_PALETTE': return <HoliPalette />;
    case 'ASHOKA_CHAKRA': return <AshokaChakra />;
    case 'CHRISTMAS_TREE': return <ChristmasHero />;
    case 'CRESCENT_MOON': 
    case 'MOON_SIEVE': 
      return <MoonHero />;

    // --- 2. Fixed Festival Specific Icons (Emoji + Animation) ---
    case 'BOW_ARROW': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🏹</div>;
    
    case 'TRISHUL_DAMRU': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🔱</div>;

    case 'KRISHNA_FLUTE': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🪈</div>;

    case 'LORD_RAM': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🏹</div>;

    case 'HANUMAN_GADA': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🔱</div>;

    case 'RAKHI': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🎁</div>;

    case 'KITES': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🪁</div>;

    case 'BONFIRE': 
      return <Flame className="w-28 h-28 text-orange-500 animate-bounce" />;

    case 'KHANDA': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">☬</div>;

    case 'SUN_GOD': 
      return <Sun className="w-28 h-28 text-yellow-500 animate-spin-slow" />;

    case 'SUGARCANE_POT': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🏺</div>;

    case 'INDIA_GATE': 
    case 'INDIAN_FLAG':
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🏛️</div>;

    case 'ISLAMIC_GEOMETRY': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🕌</div>;

    case 'FIREWORKS': 
      return <div className="text-8xl drop-shadow-2xl animate-hero-breathe">🎆</div>;

    // --- 3. Corporate & System Icons ---
    case 'MEGAPHONE': return <Megaphone className="w-24 h-24 text-blue-500 animate-bounce" />;
    case 'SIREN': return <AlertTriangle className="w-24 h-24 text-red-500 animate-pulse" />;
    case 'GEAR_ICON': return <Settings className="w-24 h-24 text-slate-400 animate-spin-slow" />;
    case 'GIFT_BOX': return <Gift className="w-24 h-24 text-pink-500 animate-bounce" />;
    case 'CALENDAR_STAR': return <Calendar className="w-24 h-24 text-purple-400 animate-pulse" />;
    case 'TOOLS_ICON': return <Settings className="w-24 h-24 text-orange-400" />;

    default:
      // Fallback
      return <div className="text-7xl animate-pulse">✨</div>;
  }
}
