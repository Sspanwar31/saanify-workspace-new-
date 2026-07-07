'use client';

import HeroFactory from '../v2/HeroFactory';
import RayEngine from '../engines/RayEngine';
import ParticleEngine from '../engines/ParticleEngine';
// 🚀 पुराना ChristmasStarIntro हटाकर नया प्रीमियम ChristmasCinematicIntro इम्पोर्ट किया गया
import ChristmasCinematicIntro from '../engines/effects/ChristmasCinematicIntro';

interface IntroProps {
  preset: string;
  phase: string; 
  heroConfig: any;
  themeColor: string;
}

export default function LightRevealIntro({
  preset,
  phase,
  heroConfig,
  themeColor,
}: IntroProps) {
  
  // 🚀 जेसन पार्सर
  const parsedHeroConfig = typeof heroConfig === 'string' ? JSON.parse(heroConfig) : (heroConfig || {});

  // 🚀 कंट्रोलर के फेजेस का हमारे विज़ुअल स्टेप्स से मिलान
  let introPhase: 'OBJECT_REVEAL' | 'ACTION_TRIGGER' | 'HANDOVER' = 'OBJECT_REVEAL';

  if (phase === 'FLASH') {
    introPhase = 'OBJECT_REVEAL';
  } else if (phase === 'SHOOTING') {
    introPhase = 'ACTION_TRIGGER'; 
  } else if (phase === 'HANDOVER') {
    introPhase = 'HANDOVER';
  }

  const renderActionOverlay = () => {
    if (introPhase !== 'ACTION_TRIGGER') return null;

    switch (preset) {
      case 'RAM_NAVAMI':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute h-[4px] w-[150px] bg-gradient-to-r from-orange-500 to-yellow-200" 
                 style={{ animation: 'arrow-shoot 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} />
          </div>
        );

      case 'CHRISTMAS':
        // 🚀 नया सिनेमाई कंपोनेंट रेंडर होगा (onComplete फॉलबैक के साथ सुरक्षित)
        return <ChristmasCinematicIntro onComplete={() => {}} />;

      case 'EID_UL_FITR':
      case 'EID_AL_ADHA':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[240px] h-[240px] rounded-full border border-emerald-400 opacity-30 animate-ping" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${
        introPhase === 'HANDOVER' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes christmas-star-descend {
          0% { transform: translateY(-400px) scale(0.5); opacity: 0; }
          70% { transform: translateY(0px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-80px) scale(1); opacity: 1; filter: drop-shadow(0 0 30px #fbbf24); }
        }
        @keyframes arrow-shoot {
          0% { transform: translateX(-300px) scaleX(0.1); opacity: 0; }
          50% { transform: translateX(0px) scaleX(1); opacity: 1; }
          100% { transform: translateX(400px) scaleX(0.1); opacity: 0; }
        }
      `}} />

      {/* ── बैकग्राउंड लेयर ── */}
      {introPhase === 'ACTION_TRIGGER' && (
        <>
          {preset === 'CHRISTMAS' ? (
            <ParticleEngine 
              preset="CHRISTMAS" 
              phase="AMBIENT" 
              customGravity={parsedHeroConfig.customGravity}
              customSpeed={parsedHeroConfig.customSpeed}
              customColors={parsedHeroConfig.customColors}
              customMinSize={parsedHeroConfig.customMinSize}
              customMaxSize={parsedHeroConfig.customMaxSize}
              customMaxCount={parsedHeroConfig.customMaxCount}
            />
          ) : (
            <RayEngine 
              preset={preset}
              customRayCount={parsedHeroConfig.customRayCount}
              customRayLength={parsedHeroConfig.customRayLength}
              customPulseSpeed={parsedHeroConfig.customPulseSpeed}
              customColors={parsedHeroConfig.customColors}
            />
          )}
        </>
      )}

      {/* ── एक्शन लेयर (नया सिनेमाई इंजन यहाँ चलेगा) ── */}
      {renderActionOverlay()}

      {/* ── फोरग्राउंड लेयर (हीरो सिंबल) ── */}
      <div 
        className={`transform transition-all duration-1000 ${
          introPhase === 'OBJECT_REVEAL' ? 'opacity-100 scale-100' : 'opacity-100 scale-105'
        }`}
      >
        <HeroFactory config={heroConfig} themeColor={themeColor} hideBranding={true} />
      </div>

      {/* ── शीर्षक और सबटाइटल ── */}
      <div 
        className={`absolute bottom-20 flex flex-col items-center justify-center transition-all duration-1000 ${
          introPhase === 'ACTION_TRIGGER' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <h1 className="text-4xl font-extrabold tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          {preset.replace('_', ' ')}
        </h1>
        <span className="mt-2 text-xs font-medium tracking-[0.4em] text-gray-400 uppercase">
          {preset === 'CHRISTMAS' && 'MERRY & BRIGHT'}
          {preset === 'RAM_NAVAMI' && 'DIVINE DHARMA RAYS'}
          {(preset === 'EID_UL_FITR' || preset === 'EID_AL_ADHA') && 'SACRED LUNAR GLOW'}
        </span>
      </div>
    </div>
  );
}
