'use client';

import React from 'react';
import DiwaliAmbient from './DiwaliAmbient';
import HoliAmbient from './HoliAmbient';
// 🚀 IMPORT ADDED
import ParticleEngine from '../../engines/ParticleEngine';

const AmbientRegistry: Record<string, React.ComponentType> = {
  DIWALI: DiwaliAmbient,
  DEV_DEEPAWALI: DiwaliAmbient,
  HOLI: HoliAmbient,
  // 🚀 CHRISTMAS ADDED: Intro ke baad snow continue rahega
  CHRISTMAS: () => <ParticleEngine preset="CHRISTMAS" phase="AMBIENT" />,
};

export default function AmbientFactory({
  preset, // ✅ FIX: festivalKey की जगह preset लिखा
}: {
  preset?: string; // ✅ FIX: यहाँ भी preset
}) {
  if (!preset) return null; // ✅ FIX: यहाँ भी preset

  const key = preset.toUpperCase();
  const Component = AmbientRegistry[key];

  if (!Component) return null;

  return <Component />;
}
