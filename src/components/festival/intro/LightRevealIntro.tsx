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
    // ── 1. OBJECT_REVEAL (0 से 1.5 सेकंड): हीरो सिंबल प्रकट होता है
    timerRef.current = setTimeout(() => {
      setIntroPhase('ACTION_TRIGGER');

      // ── 2. ACTION_TRIGGER (1.5 से 3.5 सेकंड): तारा गिरना या तीर छूटना
      timerRef.current = setTimeout(() => {
        setIntroPhase('TRANSFORM');

        // ── 3. TRANSFORM (3.5 से 5.5 सेकंड): बैकग्राउंड इंजन विस्फोट
        timerRef.current = setTimeout(() => {
          setIntroPhase('HANDOVER');
          
          // ── 4. HANDOVER (5.5 सेकंड के बाद): डैशबोर्ड चालू
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

  const renderActionOverlay = () => {
    if (introPhase !== 'ACTION_TRIGGER' && introPhase !== 'TRANSFORM') return null;

    switch (preset) {
      case 'CHRISTMAS':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute -top-10" style={{ animation: 'christmas-star-descend 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
              <span className="text-[40px]" style={{ filter: 'drop-shadow(0 0 20px #fff)' }}>⭐</span>
            </div>
          </div>
        );

      case 'RAM_NAVAMI':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute h-[4px] w-[150px] bg-gradient-to-r from-orange-500 to-yellow-200" 
                 style={{ animation: 'arrow-shoot 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} />
          </div>
        );

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
      {/* 🚀 इनलाइन सीएसएस एनीमेशन (No global.css editing required!) */}
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
      {introPhase === 'TRANSFORM' && (
        <>
          {preset === 'CHRISTMAS' ? (
            <ParticleEngine preset="CHRISTMAS" phase="AMBIENT" />
          ) : (
            <RayEngine preset={preset} />
          )}
        </>
      )}

      {/* ── एक्शन लेयर ── */}
      {renderActionOverlay()}

      {/* ── फोरग्राउंड लेयर (हीरो सिंबल) ── */}
      <div 
        className={`transform transition-all duration-1000 ${
          introPhase === 'OBJECT_REVEAL' ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        } ${introPhase === 'TRANSFORM' ? 'scale-110 blur-[1px]' : ''}`}
      >
        <HeroFactory config={heroConfig} themeColor={themeColor} hideBranding={true} />
      </div>

      {/* ── शीर्षक और सबटाइटल ── */}
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
