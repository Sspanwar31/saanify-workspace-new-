'use client';

import { useEffect, useState } from 'react';

export type FestivalPhase =
  | 'IDLE'
  | 'FLASH'
  | 'SHOOTING'      // ← NEW: rocket + explosion ek saath
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
      // 1. FLASH — White flash
      setPhase('FLASH');
      await delay(600);
      if (isCancelled) return;

      // 2. SHOOTING — Rockets launch + explode (component handles its own timing)
      //    4500ms = enough for 7 rockets to launch (0-1800ms) + reach top + explode + fade
      setPhase('SHOOTING');
      await delay(4500);
      if (isCancelled) return;

      // 3. HANDOVER — Card appears
      setPhase('HANDOVER');
      await delay(500);
      if (isCancelled) return;

      // 4. Signal card to show
      onHandover();
    };

    runIntroSequence();

    return () => { isCancelled = true; };
  }, [isActive, onHandover]);

  return <>{children(phase)}</>;
}
