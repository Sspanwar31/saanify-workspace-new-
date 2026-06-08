export default function FestivalAnimationEngine({
  animationTheme
}:{
  animationTheme:string
}) {

  switch(animationTheme){

    case 'GOLDEN_PARTICLES':
      return <GoldenParticles />

    case 'COLOR_SPLASH':
      return <ColorSplash />

    case 'SNOW_FALL':
      return <SnowFall />

    case 'MOON_GLOW':
      return <MoonGlow />

    default:
      return null
  }
}
