'use client';

import ColorSplash from '../animations/ColorSplash';
import GoldenParticles from '../animations/GoldenParticles';
import SnowFall from '../animations/SnowFall';
import MoonGlow from '../animations/MoonGlow';
import TricolorWaves from '../animations/TricolorWaves';

export default function AnimationFactory({ theme }: { theme: string }) {

  switch (theme) {

    // ━━━━━━━━━ GOLDEN ENGINE ━━━━━━━━━
    case 'GOLDEN_PARTICLES':
    case 'FIRE_EMBERS':
    case 'BONFIRE_SPARKS':
    case 'DIVINE_GLOW':
    case 'TEMPLE_GLOW':
    case 'VICTORY_RAYS':
    case 'SUNRISE_RAYS':
    case 'HARVEST_SPARKS':
    case 'LOTUS_PARTICLES':
    case 'DIVINE_LIGHT':
    case 'GOLDEN_LIGHT':
    case 'SPARKLES':

      return (
        <GoldenParticles preset={theme} />
      );

    // ━━━━━━━━━ COLOR ENGINE ━━━━━━━━━
    case 'COLOR_SPLASH':
    case 'COLOR_BURST':
    case 'RED_GOLD_PARTICLES':
    case 'FLOATING_PETALS':
    case 'CONFETTI_BLAST':
    case 'THREAD_GLOW':
    case 'ROMANTIC_LIGHTS':

      return (
        <ColorSplash preset={theme} />
      );

    // ━━━━━━━━━ MOON ENGINE ━━━━━━━━━
    case 'MOON_GLOW':
    case 'BLUE_AURA':
    case 'SMOKE_GLOW':

      return (
        <MoonGlow preset={theme} />
      );

    // ━━━━━━━━━ SNOW ENGINE ━━━━━━━━━
    case 'SNOW_FALL':
    case 'SNOW_PARTICLES':

      return (
        <SnowFall preset={theme} />
      );

    // ━━━━━━━━━ TRICOLOR ENGINE ━━━━━━━━━
    case 'TRICOLOR_WAVES':
    case 'FLAG_MOTION':

      return (
        <TricolorWaves preset={theme} />
      );

    // ━━━━━━━━━ PEACOCK ENGINE ━━━━━━━━━
    case 'PEACOCK_PARTICLES':

      return (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle, rgba(0,128,255,0.15) 0%, transparent 70%)'
          }}
        >
          <GoldenParticles preset="PEACOCK_PARTICLES" />
        </div>
      );

    // ━━━━━━━━━ WIND ENGINE ━━━━━━━━━
    case 'WIND_EFFECT':

      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent opacity-40" />

          <div
            className="absolute inset-0 animate-pulse opacity-20"
            style={{
              backgroundImage:
                "url('https://grainy-gradients.vercel.app/noise.svg')"
            }}
          />
        </div>
      );

    default:

      return (
        <GoldenParticles preset="GOLDEN_PARTICLES" />
      );
  }
}
