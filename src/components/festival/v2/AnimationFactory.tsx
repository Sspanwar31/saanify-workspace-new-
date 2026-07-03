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

  // Factory ka kaam sirf phase pass karna hai — sequence decide engine khud karega
  const finalPhase = phase || 'IDLE';

  return (
    <Engine
      preset={preset}
      phase={finalPhase}
    />
  );
}
