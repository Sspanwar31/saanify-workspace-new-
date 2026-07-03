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

  const getScenePhase = (p?: string): string => {
    switch (p) {
      case 'FLASH':
        return 'FLASH';
      case 'SHOOTING':
        return 'SHOOTING';
      case 'HANDOVER':
        return 'HANDOVER';
      case 'AMBIENT':
        return 'AMBIENT';
      case 'IDLE':
      default:
        return 'IDLE';
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
