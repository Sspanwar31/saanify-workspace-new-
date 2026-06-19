'use client';

import DiwaliScene from './presets/DiwaliScene';
import DevDeepawaliScene from './presets/DevDeepawaliScene';
import ChhathScene from './presets/ChhathScene';

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

    case 'CHHATH_PUJA':
      return <ChhathScene />;

    default:
      return null;
  }
}
