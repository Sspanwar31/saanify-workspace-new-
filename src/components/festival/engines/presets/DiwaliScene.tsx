'use client';

import GoldenParticles from '../../animations/GoldenParticles';

import LuxuryGlow from '../effects/LuxuryGlow';
import BloomLighting from '../effects/BloomLighting';
import LuxuryRays from '../effects/LuxuryRays';

import RocketLaunch from '../effects/RocketLaunch';
import FireworkBurst from '../effects/FireworkBurst';

export default function DiwaliScene({
  phase,
}: {
  phase?: string;
}) {

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* INTRO SEQUENCE */}
      {phase === 'INTRO' && (
        <>
          <RocketLaunch />
          <FireworkBurst />
        </>
      )}

      {/* ACTIVE FESTIVAL MODE */}
      {phase === 'ACTIVE' && (
        <>
          <LuxuryGlow />

          <LuxuryRays />

          <BloomLighting />

          <GoldenParticles preset="DIWALI" />
        </>
      )}

    </div>
  );
}
