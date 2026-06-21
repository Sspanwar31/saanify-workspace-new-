'use client';

import GoldenParticles from '../../animations/GoldenParticles';

import SunriseRays from '../effects/SunriseRays';
import FloatingTempleLamps from '../effects/FloatingTempleLamps';
import RiverReflection from '../effects/RiverReflection';
import ArghyaReflection from '../effects/ArghyaReflection';
import GhatLampRows from '../effects/GhatLampRows';
import WaterShimmer from '../effects/WaterShimmer';

export default function ChhathSunriseScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div
        style={{
          position: 'absolute',
          bottom: '100px',
          left: '100px',
          width: '100px',
          height: '100px',
          background: 'red',
          zIndex: 99999,
        }}
      />
      
  <SunriseRays />

<GoldenParticles preset="CHHATH_PUJA" />

<GhatLampRows />

<FloatingTempleLamps />

<WaterShimmer />

<RiverReflection />

<ArghyaReflection />

    </div>
  );
}
