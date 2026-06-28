'use client';

import GoldenParticles from '../../animations/GoldenParticles';

import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';

import RocketLaunch from '../effects/RocketLaunch';
import FireworkBurst from '../effects/FireworkBurst';

import LuxuryRays from '../effects/LuxuryRays';

export default function DiwaliScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Premium Ambient Glow */}
      <LuxuryGlow />

      <LuxuryRays />

      {/* Soft Bloom Lighting */}
      <BloomLighting />

      {/* Festival Entry */}
       <RocketLaunch />

    {/* Firework Celebration */}
      <FireworkBurst />

      {/* Golden Festival Atmosphere */}
      <GoldenParticles preset="DIWALI" />

    </div>
  );
}
