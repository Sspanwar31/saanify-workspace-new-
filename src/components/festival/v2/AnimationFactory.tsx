'use client';

import { AnimationRegistry } from '@/config/AnimationRegistry';

export default function AnimationFactory({
  engine,
  preset,
  phase,
}: {
  engine?: string;
  preset?: string;
  phase?: string;
}) {
  if (!engine) return null;

  const Engine = AnimationRegistry[engine as keyof typeof AnimationRegistry];
  if (!Engine) return null;

  // ✅ FIXED: Har phase ko USI KA NAAM DO — translation mat karo
  const getScenePhase = (p?: string): string => {
    switch (p) {
      case 'FLASH':
        return 'FLASH';       // ✅ Flash ko flash bhejo
      case 'ROCKET':
        return 'ROCKET';      // ✅ Rocket ko rocket bhejo
      case 'FIREWORK':
        return 'FIREWORK';    // ✅ Firework ko firework bhejo
      case 'HANDOVER':
        return 'HANDOVER';    // ✅ Handover ko handover bhejo (AMBIENT NAHI!)
      case 'IDLE':
      case 'ACTIVE':
      default:
        return 'AMBIENT';     // ✅ Sirf idle pe ambient
    }
  };

  const finalPhase = getScenePhase(phase);

  console.log('ANIMATION FACTORY:', phase, '→', finalPhase);

  return (
    <Engine
      preset={preset}
      phase={finalPhase}
    />
  );
}
