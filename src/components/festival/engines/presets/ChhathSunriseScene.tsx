'use client';

import SunriseRays from '../effects/SunriseRays';
import SunGlow from '../effects/SunGlow';
import FloatingTempleLamps from '../effects/FloatingTempleLamps';
import RiverReflection from '../effects/RiverReflection';
import ArghyaReflection from '../effects/ArghyaReflection';

export default function ChhathSunriseScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      <SunriseRays />

      <SunGlow />

      <FloatingTempleLamps />

      <RiverReflection />

      <ArghyaReflection />

    </div>
  );
}
