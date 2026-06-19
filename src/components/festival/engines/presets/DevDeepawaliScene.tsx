'use client';

import GoldenParticles from '../../animations/GoldenParticles';

import LuxuryGlow from '../effects/LuxuryGlow';
import LuxuryRays from '../effects/LuxuryRays';
import FloatingDiyas from '../effects/FloatingDiyas';
import FireflyTrails from '../effects/FireflyTrails';
import RiverReflection from '../effects/RiverReflection';

export default function DevDeepawaliScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      <LuxuryGlow />

      <LuxuryRays />

      <GoldenParticles preset="DEV_DEEPAWALI" />

      <FloatingDiyas />

      <FireflyTrails />

      <RiverReflection />

    </div>
  );
}
