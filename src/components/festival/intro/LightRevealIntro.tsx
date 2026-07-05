'use client';

import HeroFactory from '../v2/HeroFactory';
import RayEngine from '../engines/RayEngine';
import ParticleEngine from '../engines/ParticleEngine';

import ChristmasStarIntro from '../engines/effects/ChristmasStarIntro';

interface IntroProps {
  preset: string;
  phase: string; // 🚀 मुख्य कंट्रोलर से आने वाला सिंक फ़ेज़
  heroConfig: any;
  themeColor: string;
}

console.log('🔥 LIGHT REVEAL RECEIVED', {

  export default function LightRevealIntro({
  preset,
  phase,
  heroConfig,
  themeColor,
}: IntroProps) {
  
  // 🚀 कंट्रोलर के फेजेस का हमारे विज़ुअल स्टेप्स से 100% सटीक मिलान
  let introPhase: 'OBJECT_REVEAL' | 'ACTION_TRIGGER' | 'HANDOVER' = 'OBJECT_REVEAL';

  if (phase === 'FLASH') {
    introPhase = 'OBJECT_REVEAL';
  } else if (phase === 'SHOOTING') {
    introPhase = 'ACTION_TRIGGER'; // इसी फेज़ में तारा भी गिरेगा और बर्फबारी/किरणें भी शुरू होंगी
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
  return <ChristmasStarIntro />;

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

      {/* ── बैकग्राउंड लेयर: एक्शन फेज़ चालू होते ही शुरू होगी ── */}
      {introPhase === 'ACTION_TRIGGER' && (
        <>
          {preset === 'CHRISTMAS' ? (
            <ParticleEngine preset="CHRISTMAS" phase="AMBIENT" />
          ) : (
            <RayEngine preset={preset} />
          )}
        </>
      )}
{preset === 'CHRISTMAS' && (
  <div className="absolute top-10 left-10 z-[999] text-white text-xl">
    CHRISTMAS INTRO ACTIVE
  </div>
)}


      
      {/* ── एक्शन लेयर (तारा या तीर एनीमेशन) ── */}
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
