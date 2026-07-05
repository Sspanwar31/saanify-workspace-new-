'use client';

import { useEffect, useState, useRef } from 'react';
import HeroFactory from '../v2/HeroFactory';
import RayEngine from '../engines/RayEngine';
import ParticleEngine from '../engines/ParticleEngine';

interface IntroProps {
  preset: string;
  heroConfig: any;
  themeColor: string;
  onComplete: () => void;
}

export default function LightRevealIntro({
  preset,
  heroConfig,
  themeColor,
  onComplete,
}: IntroProps) {
  const [introPhase, setIntroPhase] = useState<'OBJECT_REVEAL' | 'ACTION_TRIGGER' | 'TRANSFORM' | 'HANDOVER'>('OBJECT_REVEAL');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // ── 1. OBJECT_REVEAL (0 से 1.5 सेकंड): मुख्य हीरो सिंबल (जैसे ट्री, चाँद, या धनुष) धीरे से प्रकट होता है
    timerRef.current = setTimeout(() => {
      setIntroPhase('ACTION_TRIGGER');

      // ── 2. ACTION_TRIGGER (1.5 से 3.5 सेकंड): विशिष्ट क्रिया (जैसे तारा गिरना, तीर छूटना, चाँद चमकना)
      timerRef.current = setTimeout(() => {
        setIntroPhase('TRANSFORM');

        // ── 3. TRANSFORM (3.5 से 5.5 सेकंड): बैकग्राउंड के किरण इंजन का पूर्ण विस्फोट
        timerRef.current = setTimeout(() => {
          setIntroPhase('HANDOVER');
          
          // ── 4. HANDOVER (5.5 सेकंड के बाद): डैशबोर्ड पर सुगम नियंत्रण स्थानांतरण
          timerRef.current = setTimeout(() => {
            onComplete();
          }, 800);
        }, 2000);
      }, 2000);
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  // प्रेसेट के आधार पर विशिष्ट विज़ुअल स्टोरी तय करना
  const renderActionOverlay = () => {
    if (introPhase !== 'ACTION_TRIGGER' && introPhase !== 'TRANSFORM') return null;

    switch (preset) {
      case 'CHRISTMAS':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* 🌟 आसमान से गिरता हुआ जादुई तारा (Star Descends) */}
            <div className="absolute -top-10 animate-christmas-star-descend">
              <span className="text-[40px] drop-shadow-[0_0_20px_#fff]">⭐</span>
            </div>
          </div>
        );

      case 'RAM_NAVAMI':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* 🏹 चार्ज होता हुआ चमकीला दिव्य बाण (Arrow Energy charge) */}
            <div className="absolute h-[4px] w-[150px] bg-gradient-to-r from-orange-500 to-yellow-200 animate-arrow-shoot" />
          </div>
        );

      case 'EID_UL_FITR':
      case 'EID_AL_ADHA':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* 🌙 चाँद के चारों ओर फैलती कोमल पवित्र रोशनी (Lunar Stroke Draw) */}
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
      {/* ── बैकग्राउंड लेयर: ट्रांसफॉर्म फेज में रे या पार्टिकल इंजनों का विस्फोट ── */}
      {introPhase === 'TRANSFORM' && (
        <>
          {preset === 'CHRISTMAS' ? (
            // क्रिसमस के लिए धीमी बर्फबारी (Particle Engine)
            <ParticleEngine preset="CHRISTMAS" phase="AMBIENT" />
          ) : (
            // बाकी अन्य त्योहारों के लिए दिव्य किरणें (Ray Engine)
            <RayEngine preset={preset} />
          )}
        </>
      )}

      {/* ── एक्शन लेयर: कहानी का मुख्य एनीमेशन प्रभाव (जैसे तारा गिरना या तीर छूटना) ── */}
      {renderActionOverlay()}

      {/* ── फोरग्राउंड लेयर: हीरो सिंबल जो धीरे से प्रकट होगा ── */}
      <div 
        className={`transform transition-all duration-1000 ${
          introPhase === 'OBJECT_REVEAL' ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        } ${introPhase === 'TRANSFORM' ? 'scale-110 blur-[1px]' : ''}`}
      >
        <HeroFactory config={heroConfig} themeColor={themeColor} hideBranding={true} />
      </div>

      {/* ── त्योहार का नाम और सबटाइटल जो क्रिया के समय प्रकट होंगे ── */}
      <div 
        className={`absolute bottom-20 flex flex-col items-center justify-center transition-all duration-1000 ${
          introPhase === 'ACTION_TRIGGER' || introPhase === 'TRANSFORM' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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
