'use client';

import ChhathSunriseScene from './presets/ChhathSunriseScene';

export default function SunEngine({
  preset,
}: {
  preset?: string;
}) {
  console.log('🔥 SunEngine received =>', preset);

  switch (preset) {
    case 'CHHATH_PUJA':
    case 'SUN_ARGHYA':        // ✅ visual_key bhi handle karo
      return <ChhathSunriseScene />;

    case 'PONGAL':
    case 'HARVEST_POT':       // ✅ PONGAL ka visual_key
      return <ChhathSunriseScene />; // ya alag scene ho toh wo lagao

    default:
      // ✅ Safety net — agar kuch bhi aaye toh bhi render karo
      // Baad me hatana ya specific cases add karna
      if (preset) {
        console.warn('SunEngine: No exact match for', preset, '→ rendering default scene');
        return <ChhathSunriseScene />;
      }
      return null;
  }
}
