'use client';

import SunriseRays from '../effects/SunriseRays';
import FloatingTempleLamps from '../effects/FloatingTempleLamps';
import RiverReflection from '../effects/RiverReflection';
import ArghyaReflection from '../effects/ArghyaReflection';
import GhatLampRows from '../effects/GhatLampRows';

export default function ChhathSunriseScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      <SunriseRays />

      <GhatLampRows />

      <FloatingTempleLamps />

      <RiverReflection />

      <ArghyaReflection />

    </div>
  );
}
