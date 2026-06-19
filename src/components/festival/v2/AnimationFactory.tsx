'use client';

import { AnimationRegistry } from '@/config/AnimationRegistry';

export default function AnimationFactory({
  engine,
  preset,
}: {
  engine?: string;
  preset?: string;
}) {

  console.log('=== AnimationFactory ===');
  console.log('engine =>', engine);
  console.log('preset =>', preset);

  if (!engine) {
    console.warn('NO ENGINE RECEIVED');
    return null;
  }

  const Engine =
    AnimationRegistry[
      engine as keyof typeof AnimationRegistry
    ];

  console.log('Engine Component =>', Engine);

  if (!Engine) {
    console.error('ENGINE NOT FOUND =>', engine);
    console.log('Available Engines =>', Object.keys(AnimationRegistry));
    return null;
  }

  return <Engine preset={preset} />;
}
