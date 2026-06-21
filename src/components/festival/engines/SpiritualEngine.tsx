'use client';

import DiwaliScene from './presets/DiwaliScene';
import DevDeepawaliScene from './presets/DevDeepawaliScene';

export default function SpiritualEngine({
  preset,
}: {
  preset?: string;
}) {

  switch (preset) {

    case 'DIWALI':
      return <DiwaliScene />;

    case 'DEV_DEEPAWALI':
      return <DevDeepawaliScene />;

    default:
      return null;
  }
}
