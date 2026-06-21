'use client';

import SunriseRays from '../effects/SunriseRays';
import GoldenParticles from '../../animations/GoldenParticles';
import FloatingTempleLamps from '../effects/FloatingTempleLamps';
import RiverReflection from '../effects/RiverReflection';
import ArghyaReflection from '../effects/ArghyaReflection';
import GhatLampRows from '../effects/GhatLampRows';
import WaterShimmer from '../effects/WaterShimmer';

export default function ChhathSunriseScene() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* ══════ DEBUG MODE — har effect ko bright color se mark karo ══════ */}

      {/* SunriseRays ko RED tint do */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,0,0,0.15)', zIndex: 0 }}>
        <SunriseRays />
      </div>

      <GoldenParticles preset="CHHATH_PUJA" />

      {/* GhatLampRows ko GREEN tint do */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,255,0,0.15)', zIndex: 0 }}>
        <GhatLampRows />
      </div>

      {/* FloatingTempleLamps ko BLUE tint do */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,100,255,0.15)', zIndex: 0 }}>
        <FloatingTempleLamps />
      </div>

      {/* WaterShimmer ko YELLOW tint do */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,0,0.15)', zIndex: 0 }}>
        <WaterShimmer />
      </div>

      {/* RiverReflection ko PINK tint do */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,0,255,0.15)', zIndex: 0 }}>
        <RiverReflection />
      </div>

      {/* ArghyaReflection ko CYAN tint do */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,255,255,0.15)', zIndex: 0 }}>
        <ArghyaReflection />
      </div>

    </div>
  );
}
