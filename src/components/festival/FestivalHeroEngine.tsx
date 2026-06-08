export default function FestivalHeroEngine({
 heroVisual
}:{
 heroVisual:string
}){

 switch(heroVisual){

   case 'ROYAL_DIYA':
      return <RoyalDiya/>

   case 'MAA_DURGA':
      return <DurgaHero/>

   case 'CRESCENT_MOON':
      return <MoonHero/>

   default:
      return null
 }
}
