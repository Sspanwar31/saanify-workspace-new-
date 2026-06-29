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

  const Engine =
    AnimationRegistry[
      engine as keyof typeof AnimationRegistry
    ];

  if (!Engine) return null;

  console.log('ENGINE =', engine);
  console.log('PRESET =', preset);
  console.log('PHASE =', phase);
  console.log('FACTORY PHASE =', phase);

  return (
    <Engine
      preset={preset}
      phase={phase}
    />
  );
}
