'use client';
import ColorSplash from '../animations/ColorSplash';
import GoldenParticles from '../animations/GoldenParticles';
import SnowFall from '../animations/SnowFall';
import MoonGlow from '../animations/MoonGlow';
import TricolorWaves from '../animations/TricolorWaves';

export default function AnimationFactory({ theme }: { theme: string }) {
  switch (theme) {
    // ━━━ 1. GOLDEN ENGINE (Diwali, Lohri, Pooja styles) ━━━
    case 'GOLDEN_PARTICLES':
    case 'FIRE_EMBERS':      // 🚀 Fixed for LOHRI
    case 'BONFIRE_SPARKS':
    case 'DIVINE_GLOW':
    case 'TEMPLE_GLOW':      // 🚀 Fixed for RAM_NAVAMI
    case 'VICTORY_RAYS':     // 🚀 Fixed for DUSSEHRA
    case 'SUNRISE_RAYS':     // 🚀 Fixed for CHHATH_PUJA
    case 'HARVEST_SPARKS':   // 🚀 Fixed for PONGAL
    case 'DIVINE_LIGHT':
    case 'GOLDEN_LIGHT':
    case 'SPARKLES':
      return <GoldenParticles />;

    // ━━━ 2. VIBRANT ENGINE (Holi, Navratri styles) ━━━
    case 'COLOR_SPLASH':
    case 'COLOR_BURST':
    case 'RED_GOLD_PARTICLES': // 🚀 Fixed for DURGA_PUJA
    case 'LOTUS_PARTICLES':    // 🚀 Fixed for GANESH_CHATURTHI
    case 'FLOATING_PETALS':    // 🚀 Fixed for RAKSHA_BANDHAN
    case 'CONFETTI_BLAST':
      return <ColorSplash />;

    // ━━━ 3. SPECIALIZED ENGINES ━━━
    case 'SNOW_FALL': 
    case 'SNOW_PARTICLES':
      return <SnowFall />;

    case 'TRICOLOR_WAVES': 
    case 'FLAG_MOTION':
      return <TricolorWaves />;

    case 'MOON_GLOW': 
    case 'BLUE_AURA':      // 🚀 Fixed for MAHASHIVRATRI
    case 'SMOKE_GLOW':
      return <MoonGlow />;

    case 'PEACOCK_PARTICLES': // 🚀 Fixed for JANMASHTAMI
      return (
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,128,255,0.1)_0%,transparent 70%)]">
           <GoldenParticles />
        </div>
      );

    case 'ROMANTIC_LIGHTS': // 🚀 Fixed for KARWA_CHAUTH
    case 'THREAD_GLOW':
      return (
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,165,0,0.1)_0%,transparent 80%)]">
           <ColorSplash />
        </div>
      );

    case 'WIND_EFFECT': // 🚀 Fixed for MAKAR_SANKRANTI
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent opacity-30">
          <div className="absolute inset-0 animate-pulse bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        </div>
      );

    default:
      return <GoldenParticles />;
  }
}
