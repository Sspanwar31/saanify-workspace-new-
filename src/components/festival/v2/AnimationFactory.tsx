'use client';

import { AnimationRegistry } from '@/config/AnimationRegistry';

// ━━━ 2027 Modern Types ━━━
type RawPhase = 'IDLE' | 'FLASH' | 'ROCKET' | 'FIREWORK' | 'HANDOVER' | 'ACTIVE';
type ResolvedPhase = 'INTRO' | 'ACTIVE';

export default function AnimationFactory({
  engine,
  preset,
  phase,
}: {
  engine?: string;
  preset?: string;
  phase?: RawPhase;
}) {
  if (!engine) return null;

  const Engine = AnimationRegistry[engine as keyof typeof AnimationRegistry];
  if (!Engine) return null;

  // 🚀 2027 ADAPTER PATTERN: 
  // Controller granular phases bhejta hai (FLASH, ROCKET, FIREWORK).
  // Lekin purane engine components (DiwaliScene) sirf 'INTRO' aur 'ACTIVE' samajhte hain.
  // Factory inko smartly translate karta hai (Backward Compatibility).
  const resolvePhase = (p?: string): ResolvedPhase => {
    switch (p) {
      case 'FLASH':
      case 'ROCKET':
      case 'FIREWORK':
        return 'INTRO'; // DiwaliScene ka INTRO block trigger hoga
      case 'IDLE':
      case 'HANDOVER':
      case 'ACTIVE':
      default:
        return 'ACTIVE'; // DiwaliScene ka ACTIVE block trigger hoga
    }
  };

  const finalPhase = resolvePhase(phase);

  return (
    <Engine
      preset={preset}
      phase={finalPhase}
    />
  );
}
