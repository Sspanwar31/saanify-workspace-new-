'use client';

import DiwaliScene from './presets/DiwaliScene';
import DevDeepawaliScene from './presets/DevDeepawaliScene';

export default function SpiritualEngine({
  preset,
  phase,
}: {
  preset?: string;
  phase?: string;
}) {

  console.log('SPIRITUAL ENGINE PHASE =', phase);

  switch (preset) {

    case 'DIWALI':
      return (
        <DiwaliScene
          phase={phase}
        />
      );

    case 'DEV_DEEPAWALI':
      return (
        <DevDeepawaliScene
          phase={phase}
        />
      );

    default:
      return null;
  }
}
