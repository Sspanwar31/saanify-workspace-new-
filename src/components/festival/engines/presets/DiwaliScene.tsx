'use client';

import GoldenParticles from '../../animations/GoldenParticles';

import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';

export default function DiwaliScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Premium Ambient Glow */}
      <LuxuryGlow />

      {/* Soft Bloom Lighting */}
      <BloomLighting />

      {/* Golden Festival Atmosphere */}
      <GoldenParticles preset="DIWALI" />

    </div>
  );
}
