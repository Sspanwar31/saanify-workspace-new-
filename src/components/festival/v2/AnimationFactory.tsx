'use client';

import { AnimationRegistry } from '@/config/AnimationRegistry';

export default function AnimationFactory({
  engine,
  preset,
  phase,
  // 🚀 डेटाबेस से आने वाले लाइव कंट्रोल्स को इंजन तक पहुँचाना
  customGravity,
  customSpeed,
  customColors,
  customMinSize,
  customMaxSize,
  customMaxCount,
}: {
  engine?: string;
  preset?: string;
  phase?: string;
  customGravity?: number;
  customSpeed?: number;
  customColors?: string[];
  customMinSize?: number;
  customMaxSize?: number;
  customMaxCount?: number;
}) {
  if (!engine) return null;

  const Engine = AnimationRegistry[engine as keyof typeof AnimationRegistry];
  if (!Engine) return null;

  const finalPhase = phase || 'IDLE';

  return (
    <Engine
      preset={preset}
      phase={finalPhase}
      customGravity={customGravity}
      customSpeed={customSpeed}
      customColors={customColors}
      customMinSize={customMinSize}
      customMaxSize={customMaxSize}
      customMaxCount={customMaxCount}
    />
  );
}
