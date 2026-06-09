'use client';

import RoyalDiya from './heroes/RoyalDiya';
import GaneshaHero from './heroes/GaneshaHero';
import DurgaHero from './heroes/DurgaHero';
import MoonHero from './heroes/MoonHero';
import ChristmasHero from './heroes/ChristmasHero';
// 🚀 NEW IMPORT
import HoliPalette from './heroes/HoliPalette';
import AshokaChakra from './heroes/AshokaChakra';

export default function FestivalHeroEngine({
  heroVisual
}: {
  heroVisual: string;
}) {

  switch(heroVisual){

    case 'ROYAL_DIYA':
      return <RoyalDiya />;

    case 'GANESHA':
      return <GaneshaHero />;

    case 'MAA_DURGA':
      return <DurgaHero />;

    case 'CRESCENT_MOON':
      return <MoonHero />;

    case 'CHRISTMAS_TREE':
      return <ChristmasHero />;

    // 🚀 NEW CASE ADDED (Matches your DB value)
    case 'VIBRANT_PALETTE':
      return <HoliPalette />;

      case 'ASHOKA_CHAKRA':
  return <AshokaChakra />;

    default:
      // Fallback: Agar kuch match na kare toh default icon dikhao
      return <div className="text-6xl animate-bounce">✨</div>;
  }
}
