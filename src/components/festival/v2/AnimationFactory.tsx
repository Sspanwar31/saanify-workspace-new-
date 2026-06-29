'use client';

import { AnimationRegistry } from '@/config/AnimationRegistry';

export default function AnimationFactory({
  engine,
  preset,
  introMode, // ← Layout se boolean aayega
}: {
  engine?: string;
  preset?: string;
  introMode?: boolean; // ← boolean accept karo
}) {

  // ✅ MAGIC: Boolean ko String mein convert karo
  const phase = introMode ? 'INTRO' : 'ACTIVE';

  console.log('ENGINE =', engine);
  console.log('PRESET =', preset);
  console.log('PHASE =', phase); // ← Ab "INTRO" ya "ACTIVE" aayega!

  if (!engine) return null;

  const Engine =
    AnimationRegistry[
      engine as keyof typeof AnimationRegistry
    ];

  console.log('ENGINE COMPONENT =', Engine);

  if (!Engine) return null;

  return (
    <Engine
      preset={preset}
      phase={phase} // ← Ab child components ko sahi string milega
    />
  );
}
