'use client';

import { useEffect, useState } from 'react';

export type FestivalPhase =
  | 'IDLE'
  | 'FLASH'
  | 'ROCKET'
  | 'FIREWORK'
  | 'HANDOVER';

interface Props {
  isActive: boolean;           
  onHandover: () => void;      
  children: (phase: FestivalPhase) => React.ReactNode;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function FestivalIntroController({
  isActive,
  onHandover,
  children,
}: Props) {
  const [phase, setPhase] = useState<FestivalPhase>('IDLE');

  useEffect(() => {
    if (!isActive) {
      setPhase('IDLE');
      return;
    }

    let isCancelled = false;

    const runIntroSequence = async () => {
      // 1. FLASH (Starts instantly)
      setPhase('FLASH');
      await delay(600);
      if (isCancelled) return;

      // 2. ROCKET — 🚀 2.9 Seconds (Perfect Sync with RocketLaunch Peak)
      setPhase('ROCKET');
      await delay(2900);  // 🚀 FIXED: wait exactly 2.9 seconds so all main rockets reach the sky and fade out
      if (isCancelled) return;

      // 3. FIREWORK — 🎇 Fireworks burst instantly at the peak
      setPhase('FIREWORK');
      await delay(2500);  
      if (isCancelled) return;

      // 4. HANDOVER — Ambient settle
      setPhase('HANDOVER');
      await delay(500);   
      if (isCancelled) return;

      // 5. Signal to layout to render card
      onHandover();
    };
    
    runIntroSequence();

    return () => {
      isCancelled = true;
    };
  }, [isActive, onHandover]);

  return <>{children(phase)}</>;
}
