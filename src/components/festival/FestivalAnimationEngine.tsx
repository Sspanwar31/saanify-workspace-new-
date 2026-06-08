import GoldenParticles from './animations/GoldenParticles';
import ColorSplash from './animations/ColorSplash';
import SnowFall from './animations/SnowFall';
import MoonGlow from './animations/MoonGlow';
import TricolorWaves from './animations/TricolorWaves';

export default function FestivalAnimationEngine({
  animationTheme
}: {
  animationTheme: string;
}) {
  switch (animationTheme) {
    case 'GOLDEN_PARTICLES':
      return <GoldenParticles />;

    case 'COLOR_SPLASH':
      return <ColorSplash />;

    case 'SNOW_FALL':
      return <SnowFall />;

    case 'MOON_GLOW':
      return <MoonGlow />;

    case 'TRICOLOR_WAVES':
      return <TricolorWaves />;

    default:
      return null;
  }
}
