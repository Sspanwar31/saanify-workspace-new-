'use client';

import { useEffect, useState } from 'react';

export type FestivalPhase =
  | 'IDLE'
  | 'FLASH'
  | 'SHOOTING'
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
      await delay(350);
      if (isCancelled) return;

      // 2. SHOOTING — Rockets launch + explode
      setPhase('SHOOTING');
      await delay(6000);
      if (isCancelled) return;

      // 3. HANDOVER — Glow triggers
      setPhase('HANDOVER');
      await delay(150);
      if (isCancelled) return;

      // 4. Signal card to show
      onHandover();
    };

    runIntroSequence();

    return () => { isCancelled = true; };
  }, [isActive, onHandover]);

  return <>{children(phase)}</>;
}
