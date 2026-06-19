'use client';

import { AnimationRegistry } from '@/config/AnimationRegistry';

export default function AnimationFactory({
  engine,
  preset,
}: {
  engine?: string;
  preset?: string;
}) {
  if (!engine) return null;

  const Engine =
    AnimationRegistry[
      engine as keyof typeof AnimationRegistry
    ];

  if (!Engine) {
    console.warn('Unknown Engine:', engine);
    return null;
  }

  return (
    <Engine preset={preset} />
  );
}
