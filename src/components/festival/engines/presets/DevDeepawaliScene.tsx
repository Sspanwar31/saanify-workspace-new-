'use client';

import GoldenParticles from '../../animations/GoldenParticles';

import FloatingTempleLamps from '../effects/FloatingTempleLamps';
import FireflyTrails from '../effects/FireflyTrails';
import RiverReflection from '../effects/RiverReflection';

export default function DevDeepawaliScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      <RiverReflection />

      <GoldenParticles preset="DEV_DEEPAWALI" />

      <FloatingTempleLamps />

      <FireflyTrails />

    </div>
  );
}
