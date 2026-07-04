'use client';

import { useEffect, useState, useCallback } from 'react';
import { FESTIVAL_PHASE_SEQUENCES } from '@/config/FestivalPhaseConfig';

export default function FestivalIntroController({
  isActive,
  onHandover,
  children,
  preset = 'DEFAULT'
}: {
  isActive: boolean;
  onHandover: () => void;
  children: (phase: string) => React.ReactNode;
  preset?: string;
}) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  // Preset ke hisaab se sequence nikalo (Agar nahi mila toh DEFAULT use karo)
  const sequence = FESTIVAL_PHASE_SEQUENCES[preset.toUpperCase()] || FESTIVAL_PHASE_SEQUENCES.DEFAULT;

  useEffect(() => {
    // Jab intro band ho, reset karo
    if (!isActive) {
      setCurrentPhaseIndex(0);
      return;
    }

    // Current phase ka naam aur time nikalo
    const currentPhaseName = sequence.phases[currentPhaseIndex];
    const duration = sequence.timings[currentPhaseName] || 1000;

    const timer = setTimeout(() => {
      if (currentPhaseIndex < sequence.phases.length - 1) {
        // Agla phase
        setCurrentPhaseIndex(prev => prev + 1);
      } else {
        // Last phase khatam → Handover (Popup dikhao)
        onHandover();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, currentPhaseIndex, sequence, onHandover]);

  // Jo bhi current phase hai, use children function me pass karo
  const currentPhase = sequence.phases[currentPhaseIndex] || 'IDLE';

  return <>{children(currentPhase)}</>;
}
