'use client';

import { useEffect, useState } from 'react';
import { FESTIVAL_PHASE_SEQUENCES } from '@/config/FestivalPhaseConfig';
import LightRevealIntro from '@/components/festival/intro/LightRevealIntro';

export default function FestivalIntroController({
  isActive,
  onHandover,
  children,
  preset = 'DEFAULT',
  heroConfig,      
  themeColor = '#fbbf24' 
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

  // 🚨 YAHAN PAR MAINE CONSOLE LOG LAGAYA HAI
  const isLightRevealPreset = ['CHRISTMAS', 'RAM_NAVAMI', 'EID_UL_FITR', 'EID_AL_ADHA', 'REPUBLIC_DAY', 'INDEPENDENCE_DAY'].includes(preset.toUpperCase());

   {
    isActive: isActive,             // Yeh true hona zaroori hai
    preset: preset.toUpperCase(),   // Yeh list mein se koi ek hona chahiye
    isLightRevealPreset: isLightRevealPreset, 
    heroConfig: heroConfig          // 🚨 YEH UNDEFINED NAHI HONA CHAHIYE (Sabse bada reason)
  });

  preset,
  heroConfig,
  themeColor
});

if (isActive && isLightRevealPreset && heroConfig) {
  console.log('✅ LIGHT REVEAL RENDER HO RAHA HAI!');

  return (
    <LightRevealIntro
      preset={preset}
      phase={currentPhase}
      heroConfig={heroConfig}
      themeColor={themeColor}
    />
  );
}

  return (
    <>
      {children(currentPhase)}
      
      {/* HOLI Code ... */}
      {preset.toUpperCase() === 'HOLI' && currentPhase === 'TEXT_REVEAL' && (
        <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center pointer-events-none">
          {/* ... purana holi code wahi rahega ... */}
        </div>
      )}
    </>
  );
}
