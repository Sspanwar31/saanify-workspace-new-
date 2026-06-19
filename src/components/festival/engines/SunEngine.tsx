'use client';

import ChhathSunriseScene from './presets/ChhathSunriseScene';

export default function SunEngine({
  preset,
}: {
  preset?: string;
}) {
  switch (preset) {
    case 'CHHATH_PUJA':
      return <ChhathSunriseScene />;

    default:
      return null;
  }
}
