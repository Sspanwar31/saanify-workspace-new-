import RoyalDiya from './heroes/RoyalDiya';
import GaneshaHero from './heroes/GaneshaHero';
import DurgaHero from './heroes/DurgaHero';
import MoonHero from './heroes/MoonHero';
import ChristmasHero from './heroes/ChristmasHero';

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

    default:
      return null;
  }
}
