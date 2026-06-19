'use client';

import GoldenParticles from '../../animations/GoldenParticles';

import FloatingDiyas from '../effects/FloatingDiyas';
import FireflyTrails from '../effects/FireflyTrails';
import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';

export default function DiwaliScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Base Luxury Glow */}
      <LuxuryGlow />

      {/* Bloom Lighting */}
      <BloomLighting />

      {/* Golden Dust Layer */}
      <GoldenParticles preset="DIWALI" />

      {/* Floating Diyas */}
      <FloatingDiyas />

      {/* Fireflies */}
      <FireflyTrails />

    </div>
  );
}
