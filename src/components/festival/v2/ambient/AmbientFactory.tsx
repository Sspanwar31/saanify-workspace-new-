'use client';

import React from 'react';
import DiwaliAmbient from './DiwaliAmbient';
import HoliAmbient from './HoliAmbient';

// 🚀 DYNAMIC REGISTRY: Ek-ek line me naye ambient yahan jodte jayenge
const AmbientRegistry: Record<string, React.ComponentType> = {
  DIWALI: DiwaliAmbient,
  DEV_DEEPAWALI: DiwaliAmbient,
  HOLI: HoliAmbient,
  // LOHRI: LohriAmbient, (baki baad me aise hi jodenge)
};

export default function AmbientFactory({
  festivalKey,
}: {
  festivalKey?: string;
}) {
  if (!festivalKey) return null;

  const key = festivalKey.toUpperCase();
  const Component = AmbientRegistry[key];

  if (!Component) return null;

  return <Component />;
}
