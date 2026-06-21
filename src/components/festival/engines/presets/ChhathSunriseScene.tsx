'use client';

import GoldenParticles from '../../animations/GoldenParticles';
import SunriseRays from '../effects/SunriseRays';
import FloatingTempleLamps from '../effects/FloatingTempleLamps';
import WaterShimmer from '../effects/WaterShimmer';
import GhatLampRows from '../effects/GhatLampRows';

export default function ChhathSunriseScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      
      {/* 1. SKY BASE: Dark blue ki jagah thoda morning sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e] via-[#1e293b] to-[#0f172a]" />

      {/* 2. MAIN LIGHT: Suraj ki kiranen (Bright) */}
      <div className="scale-150 transform translate-y-[-10%] opacity-80">
          <SunriseRays />
      </div>

      {/* 3. PARTICLES: Sone ke sitare (Zyada quantity) */}
      <GoldenParticles />

      {/* 4. WATER SECTION: Sirf chamak aur diye (No dark reflection) */}
      <div className="absolute bottom-0 w-full h-[40%]" style={{ zIndex: 1 }}>
          <WaterShimmer />
          <GhatLampRows />
          <FloatingTempleLamps />
      </div>

      {/* 5. ATMOSPHERIC GLOW: Center glow for the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,rgba(251,191,36,0.1)_0%,transparent 70%)]" />

    </div>
  );
}
