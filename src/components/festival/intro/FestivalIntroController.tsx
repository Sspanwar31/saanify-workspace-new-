'use client';

import { useEffect, useState } from 'react';
import { FESTIVAL_PHASE_SEQUENCES } from '@/config/FestivalPhaseConfig';
import LightRevealIntro from '@/components/festival/intro/LightRevealIntro';
// 🚀 लोहड़ी का नया प्रीमियम सिनेमाई इंट्रो इम्पोर्ट किया गया
import LohriCinematicIntro from '../engines/effects/lohri/LohriCinematicIntro';
// 🚀 रक्षाबंधन का नया प्रीमियम सिनेमाई इंट्रो इम्पोर्ट किया गया (Hyphenated path)
import RakshaBandhanCinematicIntro from '../engines/effects/raksha-bandhan/RakshaBandhanCinematicIntro';
// 🚀 मकर संक्रांति का नया प्रीमियम सिनेमाई इंट्रो इम्पोर्ट किया गया (सटीक पाथ मैचिंग)
import MakarSankrantiCinematicIntro from '../engines/effects/Makar-Sankranti /MakarSankrantiCinematicIntro';
// 🚀 नए साल का नया प्रीमियम सिनेमाई इंट्रो इम्पोर्ट किया गया
import NewYearCinematicIntro from '../engines/effects/new-year/NewYearCinematicIntro';
// 🚀 वैलेंटाइन डे का नया प्रीमियम सिनेमाई इंट्रो इम्पोर्ट किया गया
import ValentineCinematicIntro from '../engines/effects/valentines-day/ValentineCinematicIntro';
// 🚀 गणेश चतुर्थी का नया प्रीमियम सिनेमाई इंट्रो इम्पोर्ट किया गया
import GaneshChaturthiCinematicIntro from '../engines/effects/Ganesh-Chaturthi/GaneshChaturthiCinematicIntro';
import HanumanJayantiCinematicIntro from '../engines/effects/Hanuman-Jayanti/HanumanJayantiCinematicIntro';
import NavratriCinematicIntro from '../engines/effects/Navratri/NavratriCinematicIntro'; // 🚀 NAYA: Navratri Intro Import kiya
import RepublicDayCinematicIntro from '../engines/effects/Republic-Day/RepublicDayCinematicIntro';
import IndependenceDayCinematicIntro from '../engines/effects/Independence-Day/IndependenceDayCinematicIntro';
import RamNamiCinematicIntro from '../engines/effects/Ram-Nami/RamNamiCinematicIntro';
// 🚀 PONGAL CINEMATIC INTRO IMPORT
import PongalCinematicIntro from '../engines/effects/Pongal/PongalCinematicIntro';
// 🚀 EID ROYAL CINEMATIC INTRO IMPORT
import EidCinematicIntro from '../engines/effects/eid/EidCinematicIntro';
import MahashivratriCinematicIntro from '../engines/effects/mahashivratri/MahashivratriCinematicIntro';
import DurgaPujaCinematicIntro from '../engines/effects/durga-puja/DurgaPujaCinematicIntro';
import DevDeepawaliCinematicIntro from '../engines/effects/dev-deepawali/DevDeepawaliCinematicIntro';
import DiwaliCinematicIntro from '../engines/effects/diwali/DiwaliCinematicIntro';
import ChhathPujaCinematicIntro from '../engines/effects/chhath-puja/ChhathPujaCinematicIntro';
import KarwaChauthCinematicIntro from '../engines/effects/karwa-chauth/KarwaChauthCinematicIntro';
import GuruNanakJayantiCinematicIntro from '../engines/effects/guru-nanak-jayanti/GuruNanakJayantiCinematicIntro';
import DussehraCinematicIntro from '../engines/effects/dussehra/DussehraCinematicIntro';
import HoliCinematicIntro from '../engines/effects/Holi/HoliCinematicIntro';

export default function FestivalIntroController({
  isActive,
  onHandover,
  children,
  preset = 'DEFAULT',
  heroConfig, 
  mediaConfig, // 👈 1. NAYA PROP ADD KIYA (Supabase media_config ke liye)
  themeColor = '#fbbf24' 
}: {
  isActive: boolean;
  onHandover: () => void;
  children: (phase: string) => React.ReactNode;
  preset?: string;
  heroConfig?: any;
  mediaConfig?: any; // 👈 2. TYPE DEFINE KIYA
  themeColor?: string;
}) {

  // 🚀 FIX: DEFINE presetKey AT THE VERY FIRST LINE
  const presetKey = (preset || 'DEFAULT').toUpperCase();

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  const sequence = FESTIVAL_PHASE_SEQUENCES[preset.toUpperCase()] || FESTIVAL_PHASE_SEQUENCES.DEFAULT;

  useEffect(() => {
    if (!isActive) {
      setCurrentPhaseIndex(0);
      return;
    }

    const currentPhaseName = sequence.phases[currentPhaseIndex];
    const duration = sequence.timings[currentPhaseName] || 1000;

    const timer = setTimeout(() => {
      if (currentPhaseIndex < sequence.phases.length - 1) {
        setCurrentPhaseIndex(prev => prev + 1);
      } else {
        onHandover();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, currentPhaseIndex, sequence, onHandover]);

  const currentPhase = sequence.phases[currentPhaseIndex] || 'IDLE';

  // 🚀 1. LOHRI ACTIVATION: यदि लोहड़ी सक्रिय है, तो सीधे इसका सिनेमाई इंजन रेंडर करें
  if (isActive && preset.toUpperCase() === 'LOHRI') {
    return (
      <LohriCinematicIntro onComplete={onHandover} />
    );
  }

  // 🚀 2. RAKSHA_BANDHAN ACTIVATION: रक्षाबंधन का स्वतंत्र सिनेमाई इंजन यहाँ चलेगा
  if (isActive && preset.toUpperCase() === 'RAKSHA_BANDHAN') {
    return (
      <RakshaBandhanCinematicIntro onComplete={onHandover} />
    );
  }

  // 🚀 3. LIGHT REVEAL GROUP (Christmas, Ram Navami, Eid, etc.)
   // ✅ NAYA (Ise replace karein):
  const isLightRevealPreset = ['CHRISTMAS', ].includes(preset.toUpperCase());

  if (isActive && isLightRevealPreset && heroConfig) {
    return (
      <LightRevealIntro
        preset={preset}
        phase={currentPhase}
        heroConfig={heroConfig}
        themeColor={themeColor}
      />
    );
  }

    // 🚀 4. MAKAR_SANKRANTI ACTIVATION: मकर संक्रांति का स्वतंत्र सिनेमाई इंजन यहाँ चलेगा
  if (isActive && preset.toUpperCase() === 'MAKAR_SANKRANTI') {
    return (
      <MakarSankrantiCinematicIntro onComplete={onHandover} />
    );
  }

  // 🚀 5. NEW_YEAR ACTIVATION: नए साल का स्वतंत्र सिनेमाई इंजन यहाँ चलेगा
  if (isActive && preset.toUpperCase() === 'NEW_YEAR') {
    return (
      <NewYearCinematicIntro onComplete={onHandover} />
    );
  }

  // 🚀 6. VALENTINES_DAY ACTIVATION: वैलेंटाइन डे का स्वतंत्र सिनेमाई इंजन यहाँ चलेगा
  if (isActive && preset.toUpperCase() === 'VALENTINES_DAY') {
    return (
      <ValentineCinematicIntro onComplete={onHandover} />
    );
  }

  // 🚀 7. GANESH_CHATURTHI ACTIVATION: गणेश चतुर्थी का स्वतंत्र सिनेमाई इंजन यहाँ चलेगा
  if (isActive && preset.toUpperCase() === 'GANESH_CHATURTHI') {
    return (
      <GaneshChaturthiCinematicIntro onComplete={onHandover} />
    );
  }

// 🚀 8. HANUMAN_JAYANTI ACTIVATION: हनुमान जयंती का स्वतंत्र सिनेमाई इंजन यहाँ चलेगा
  if (isActive && preset.toUpperCase() === 'HANUMAN_JAYANTI') {
    return (
      <HanumanJayantiCinematicIntro onComplete={onHandover} />
    );
  }

  // 🚀 9. NAVRATRI ACTIVATION: नवरात्रि का स्वतंत्र सिनेमाई इंजन यहाँ चलेगा (Trishul reveal and Garba motion)
  if (isActive && preset.toUpperCase() === 'NAVRATRI') {
    return (
      <NavratriCinematicIntro 
        onComplete={onHandover} 
        imageUrl={heroConfig?.image_url} 
      />
    );
  }

  // 🚀 10. REPUBLIC_DAY ACTIVATION (Tricolor Jet Smoke Trails & Confetti)
  if (isActive && preset.toUpperCase() === 'REPUBLIC_DAY') {
    return (
      <RepublicDayCinematicIntro 
        onComplete={onHandover} 
        imageUrl={heroConfig?.image_url} 
      />
    );
  }

  // 🚀 11. INDEPENDENCE_DAY ACTIVATION (Lal Qila, Rising Flag & Kites)
  if (isActive && preset.toUpperCase() === 'INDEPENDENCE_DAY') {
    return (
      <IndependenceDayCinematicIntro 
        onComplete={onHandover} 
        imageUrl={heroConfig?.image_url} 
      />
    );
  }

  // 🚀 12. RAM_NAVAMI ACTIVATION (Suryavanshi Solar Halo & Bow Reveal)
  if (isActive && preset.toUpperCase() === 'RAM_NAVAMI') {
    return (
      <RamNamiCinematicIntro 
        onComplete={onHandover} 
        imageUrl={heroConfig?.image_url} 
      />
    );
  }

  // 🚀 13. PONGAL ACTIVATION (FIXED: Ab mediaConfig & fallback video pass ho raha hai)
  if (isActive && preset.toUpperCase() === 'PONGAL') {
    return (
      <PongalCinematicIntro 
        onComplete={onHandover} 
        mediaConfig={mediaConfig || heroConfig?.media_config}
        videoUrl={mediaConfig?.video_url || heroConfig?.video_url || "/videos/pongal-intro.mp4"}
      />
    );
  }

// 🚀 14. EID ACTIVATION (FLEXIBLE MATCH: EID_UL_FITR, EID UL_FITR, EID_AL_ADHA sabhi catch honge!)
  if (isActive && presetKey.includes('EID')) {
    return <EidCinematicIntro onComplete={onHandover} />;
  } 

  // 🚀 15. MAHASHIVRATRI ACTIVATION (Divine Cosmic Kailash Intro)
if (isActive && (presetKey.includes('SHIV') || presetKey.includes('MAHASHIVRATRI'))) {
  return <MahashivratriCinematicIntro onComplete={onHandover} />;
}

  // 🚀 16. DURGA PUJA / NAVRATRI ACTIVATION (FIXED: Strict match without "PUJA" conflict)
  if (isActive && (presetKey.includes('DURGA') || presetKey === 'NAVRATRI')) {
    return (
      <DurgaPujaCinematicIntro 
        onComplete={onHandover} 
        mediaConfig={mediaConfig || heroConfig?.media_config}
        videoUrl={mediaConfig?.video_url || heroConfig?.video_url || "/videos/durga-puja-intro.mp4"}
      />
    );
  }

  // 🚀 17. DEV DEEPAWALI ACTIVATION (Sacred Varanasi Ghat Intro)
if (isActive && (presetKey.includes('DEV_DEEPAWALI') || presetKey.includes('DEV_DIWALI'))) {
  return <DevDeepawaliCinematicIntro onComplete={onHandover} />;
}

  // 🚀 18. DIWALI ACTIVATION (Royal Ayodhya Fireworks & Lakshmi Charan Intro)
if (isActive && presetKey === 'DIWALI') {
  return (
    <DiwaliCinematicIntro 
      onComplete={onHandover} 
      videoUrl={mediaConfig?.video_url || heroConfig?.video_url || "/videos/diwali-intro.mp4"}
    />
  );
}

// 🚀 19. CHHATH PUJA ACTIVATION (FIXED: Placed BEFORE Durga Puja to prevent conflict!)
  if (isActive && (presetKey.includes('CHHATH') || presetKey.includes('CHATH'))) {
    return (
      <ChhathPujaCinematicIntro 
        onComplete={onHandover} 
        mediaConfig={mediaConfig || heroConfig?.media_config}
        videoUrl={mediaConfig?.video_url || heroConfig?.video_url || "/videos/chhath-puja-intro.mp4"}
      />
    );
  }

  // 🚀 20. KARWA CHAUTH ACTIVATION (Full Moon & Sieve Chhanni Intro)
  if (isActive && (presetKey.includes('KARWA') || presetKey.includes('CHAUTH'))) {
    return (
      <KarwaChauthCinematicIntro 
        onComplete={onHandover} 
        videoUrl={mediaConfig?.video_url || heroConfig?.video_url || "/videos/karwa-chauth-intro.mp4"}
      />
    );
  }

   // 🚀 21. GURUNANK JAYANTI ACTIVATION 
if (isActive && (presetKey.includes('GURU') || presetKey.includes('NANAK') || presetKey.includes('JAYANTI'))) {
  return (
    <GuruNanakJayantiCinematicIntro 
      onComplete={onHandover} 
      videoUrl={mediaConfig?.video_url || heroConfig?.video_url || "/videos/guru-nanak-jayanti-intro.mp4"}
    />
  );
}


   // 🚀 22. DUSSEHRA ACTIVATION 
if (isActive && (presetKey.includes('DUSSEHRA') || presetKey.includes('VIJAYADASHAMI') || presetKey.includes('DASARA'))) {
  return (
    <DussehraCinematicIntro 
      onComplete={onHandover} 
      videoUrl={mediaConfig?.video_url || heroConfig?.video_url || "/videos/dussehra-intro.mp4"}
    />
  );
}

  // 🚀 23. HOLI ACTIVATION (Radha-Krishna Vrindavan Maha Holi Intro)
if (isActive && (presetKey.includes('HOLI') || presetKey === 'HOLI')) {
  return (
    <HoliCinematicIntro 
      onComplete={onHandover} 
      videoUrl={mediaConfig?.video_url || heroConfig?.video_url || "/videos/holi-intro.mp4"}
    />
  );
}

return (
  <>
    {presetKey !== 'DIWALI' && presetKey !== 'HOLI' && children(currentPhase)}
      
      {/* 🎨 HOLI 2027 EXCLUSIVE: Liquid Drip "Happy Holi" Text */}
      {preset.toUpperCase() === 'HOLI' && currentPhase === 'TEXT_REVEAL' && (
        <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center pointer-events-none">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes holi-drip-in {
              0% { transform: translateY(-50px) scale(1.3); opacity: 0; filter: blur(12px); }
              60% { transform: translateY(8px) scale(0.95); opacity: 1; filter: blur(0.5px); }
              100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0.5px); }
            }
            @keyframes drip-fall {
              0% { height: 0px; opacity: 0; }
              30% { height: 15px; opacity: 0.8; }
              100% { height: 40px; opacity: 0; transform: translateY(20px); }
            }
          `}} />
          
          <h1 
            className="text-7xl md:text-9xl font-black text-white tracking-tighter select-none"
            style={{
              textShadow: '0px 6px 0px #ff006e, 0px 10px 25px rgba(255, 0, 110, 0.7), 0px 15px 50px rgba(0,0,0,0.5)',
              animation: 'holi-drip-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            }}
          >
            Happy Holi
          </h1>

          <div className="flex gap-12 mt-[-10px]">
            {['#ff006e', '#ffbe0b', '#00f5d4', '#8338ec'].map((color, i) => (
              <div 
                key={i} 
                className="w-3 rounded-b-full"
                style={{
                  backgroundColor: color,
                  animation: `drip-fall 1.2s ${0.5 + i * 0.2}s ease-out infinite`,
                  boxShadow: `0 5px 15px ${color}80`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
