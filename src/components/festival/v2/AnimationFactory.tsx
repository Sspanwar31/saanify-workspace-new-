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

  // 🚀 2027 ADAPTER: Controller ki language -> Scene ki language
  const getScenePhase = (p?: string): string => {
    switch (p) {
      case 'FLASH':
      case 'ROCKET':
        return 'ROCKET';     // Scene ka ROCKET block chalega
      case 'FIREWORK':
        return 'FIREWORK';   // Scene ka FIREWORK block chalega
      case 'IDLE':
      case 'HANDOVER':
      case 'ACTIVE':
      default:
        return 'AMBIENT';    // Normal particles chalega
    }
  };

  const finalPhase = getScenePhase(phase);

  return (
    <Engine
      preset={preset}
      phase={finalPhase}
    />
  );
}
