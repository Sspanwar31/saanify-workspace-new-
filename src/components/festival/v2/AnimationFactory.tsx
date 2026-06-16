'use client';
import ColorSplash from '../animations/ColorSplash';
import GoldenParticles from '../animations/GoldenParticles';
import SnowFall from '../animations/SnowFall';
import MoonGlow from '../animations/MoonGlow';
import TricolorWaves from '../animations/TricolorWaves';

export default function AnimationFactory({ theme }: { theme: string }) {
  // 🚀 Debug log taaki aap console mein dekh sakein kaunsa theme load ho raha hai
  console.log("🎬 Animation Engine Loading Theme:", theme);

  switch (theme) {
    // ━━━ 1. GOLDEN ENGINE GROUP (Traditional/Divine) ━━━
    case 'GOLDEN_PARTICLES':
    case 'DIVINE_LIGHT':
    case 'DIVINE_GLOW':
    case 'TEMPLE_GLOW':
    case 'SUNRISE_RAYS':
    case 'HARVEST_SPARKS':
    case 'BONFIRE_SPARKS':
    case 'GOLDEN_AURA':
    case 'SPARKLES':
    case 'FIRE_EMBERS':
    case 'GOLDEN_LIGHT':
      return <GoldenParticles />;

    // ━━━ 2. COLOR SPLASH GROUP (Holi/Vibrant) ━━━
    case 'COLOR_SPLASH':
    case 'RED_GOLD_PARTICLES':
    case 'CONFETTI_BLAST':
    case 'COLOR_BURST':
    case 'LOTUS_PARTICLES':
    case 'FLYING_PARTICLES':
      return <ColorSplash />;

    // ━━━ 3. JANMASHTAMI SPECIAL (Peacock Theme) ━━━
    case 'PEACOCK_PARTICLES': 
      return (
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,128,255,0.1)_0%,transparent 70%)]">
           <GoldenParticles />
        </div>
      );

    // ━━━ 4. RAKSHA BANDHAN / NAVRATRI (Soft Glows) ━━━
    case 'THREAD_GLOW':
    case 'ROMANTIC_LIGHTS':
    case 'LOTUS_GLOW':
      return (
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,0,128,0.05)_0%,transparent 80%)]">
           <ColorSplash />
        </div>
      );

    // ━━━ 5. WEATHER & NATIONAL ENGINES ━━━
    case 'SNOW_FALL':
    case 'SNOW_PARTICLES':
      return <SnowFall />;

    case 'TRICOLOR_WAVES':
    case 'FLAG_MOTION':
      return <TricolorWaves />;

    case 'FLYING_KITES':
    case 'WIND_EFFECT':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute bg-white/40 rounded-full blur-xl animate-pulse"
                 style={{ width: '40px', height: '40px', left: (Math.random()*100)+'%', top: (Math.random()*100)+'%' }} />
          ))}
        </div>
      );

    case 'MOON_GLOW':
    case 'STAR_SPARKLES':
    case 'BLUE_AURA':
    case 'SMOKE_GLOW':
      return <MoonGlow />;

    // ━━━ 6. SYSTEM ALERTS ━━━
    case 'RED_FLASH':
    case 'WARNING_FLASH':
      return <div className="fixed inset-0 bg-red-600/10 animate-pulse pointer-events-none z-0" />;

    case 'PULSE':
    case 'COUNTDOWN':
      return <div className="fixed inset-0 bg-blue-500/5 animate-pulse pointer-events-none z-0" />;

    // ━━━ 7. FINAL FALLBACK (No more blank screens) ━━━
    default:
      return <GoldenParticles />;
  }
}
