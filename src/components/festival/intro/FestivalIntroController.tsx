'use client';

import { useEffect, useState } from 'react';
import { FESTIVAL_PHASE_SEQUENCES } from '@/config/FestivalPhaseConfig';
import LightRevealIntro from '@/components/festival/intro/LightRevealIntro';

export default function FestivalIntroController({
  isActive,
  onHandover,
  children,
  preset = 'DEFAULT',
  heroConfig,      // 🚀 नया प्रोप जोड़ा गया
  themeColor = '#fbbf24' // 🚀 नया प्रोप जोड़ा गया
}: {
  isActive: boolean;
  onHandover: () => void;
  children: (phase: string) => React.ReactNode;
  preset?: string;
  heroConfig?: any;
  themeColor?: string;
}) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  const sequence = FESTIVAL_PHASE_SEQUENCES[preset.toUpperCase()] || FESTIVAL_PHASE_SEQUENCES.DEFAULT;

  useEffect(() => {
    console.log("🎯 INTRO DEBUG -> Preset:", preset, "| Using Phases:", sequence.phases);
  }, [preset, sequence.phases]);

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

  // 🚀 उन त्योहारों की सूची जो LightRevealIntro  का उपयोग करेंगे
  const isLightRevealPreset = ['CHRISTMAS', 'RAM_NAVAMI', 'EID_UL_FITR', 'EID_AL_ADHA', 'REPUBLIC_DAY', 'INDEPENDENCE_DAY'].includes(preset.toUpperCase());

  if (isActive && isLightRevealPreset && heroConfig) {
    return (
      <LightRevealIntro
        preset={preset.toUpperCase()}
        phase={currentPhase}
        heroConfig={heroConfig}
        themeColor={themeColor}
      />
    );
  }

  return (
    <>
      {children(currentPhase)}
      
      {/* 🎨 HOLI 2027 EXCLUSIVE: Liquid Drip "Happy Holi" Text */}
      {preset.toUpperCase() === 'HOLI' && currentPhase === 'TEXT_REVEAL' && (
        <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center pointer-events-none">
          <style>{`
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
          `}</style>
          
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
