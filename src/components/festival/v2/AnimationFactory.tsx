'use client';
import ColorSplash from '../animations/ColorSplash';
import GoldenParticles from '../animations/GoldenParticles';
import SnowFall from '../animations/SnowFall';
import MoonGlow from '../animations/MoonGlow';
import TricolorWaves from '../animations/TricolorWaves';

export default function AnimationFactory({ theme }: { theme: string }) {
  switch (theme) {
    // --- 1. Golden/Divine Group ---
    case 'GOLDEN_PARTICLES':
    case 'BONFIRE_SPARKS':
    case 'DIVINE_GLOW':
    case 'TEMPLE_GLOW':
    case 'VICTORY_RAYS':
    case 'SUNRISE_RAYS':
    case 'HARVEST_SPARKS':
    case 'DIVINE_LIGHT':
      return <GoldenParticles />;

    // --- 2. Color/Splash Group ---
    case 'COLOR_SPLASH':
    case 'RED_GOLD_PARTICLES':
      return <ColorSplash />;

    // --- 3. Nature/Environment Group ---
    case 'SNOW_FALL':
      return <SnowFall />;
    case 'FLOATING_PETALS':
    case 'LOTUS_GLOW':
      return <div className="absolute inset-0 pointer-events-none overflow-hidden"><div className="flower-particle" /></div>; // Custom CSS needed
    case 'FLYING_KITES':
      return <div className="absolute inset-0 opacity-20 bg-[url('/assets/kites-bg.png')] bg-repeat animate-pulse" />;

    // --- 4. Glow/Aura Group ---
    case 'MOON_GLOW':
    case 'BLUE_AURA':
      return <MoonGlow />;

    // --- 5. Patriotic Group ---
    case 'TRICOLOR_WAVES':
      return <TricolorWaves />;

    // --- 6. Broadcast/Corporate Themes ---
    case 'CONFETTI_BLAST':
    case 'SPARKLES':
      return <div className="absolute inset-0 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse opacity-30" />;
    
    case 'RED_FLASH':
    case 'WARNING_FLASH':
      return <div className="absolute inset-0 bg-red-600/20 animate-ping pointer-events-none" />;
    
    case 'PULSE':
      return <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none" />;

    default:
      return <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xl" />;
  }
}
