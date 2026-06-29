'use client';

import { useEffect, useState } from 'react';

// Phases clearly defined
export type FestivalPhase =
  | 'IDLE'
  | 'FLASH'
  | 'ROCKET'
  | 'FIREWORK'
  | 'HANDOVER';

interface Props {
  isActive: boolean;           // Layout bolega: "Start kar"
  onHandover: () => void;      // Controller bolega: "Main ho gaya, ab tu le"
  children: (phase: FestivalPhase) => React.ReactNode;
}

// Modern Async Delay Helper (setTimeout ka clean alternative)
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function FestivalIntroController({
  isActive,
  onHandover,
  children,
}: Props) {
  const [phase, setPhase] = useState<FestivalPhase>('IDLE');

  useEffect(() => {
    // Agar layout ne start nahi kiya, toh idle raho
    if (!isActive) {
      setPhase('IDLE');
      return;
    }

    // Cancellation flag (agar component unmount ho jaye toh sequence ruk jaye)
    let isCancelled = false;

    const runIntroSequence = async () => {
      // 1. FLASH PHASE
      setPhase('FLASH');
      await delay(600); // 0.6 sec white flash
      if (isCancelled) return;

      // 2. ROCKET PHASE
      setPhase('ROCKET');
      await delay(1500); // 1.5 sec rocket launch
      if (isCancelled) return;

      // 3. FIREWORK PHASE
      setPhase('FIREWORK');
      await delay(1500); // 1.5 sec fireworks burst
      if (isCancelled) return;

      // 4. HANDOVER PHASE
      setPhase('HANDOVER');
      
      // Layout ko signal do ki ab tu control le
      onHandover();
    };

    runIntroSequence();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [isActive, onHandover]);

  return <>{children(phase)}</>;
}
