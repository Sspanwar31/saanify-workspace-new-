'use client';

import { useEffect, useState } from 'react';

export type FestivalPhase =
  | 'FLASH'
  | 'ROCKET'
  | 'FIREWORK'
  | 'POPUP'
  | 'AMBIENT';

interface Props {
  children: (phase: FestivalPhase) => React.ReactNode;
}

export default function FestivalIntroController({
  children,
}: Props) {
  const [phase, setPhase] =
    useState<FestivalPhase>('FLASH');

  useEffect(() => {
    console.log('🚀 Intro Started');

    const timers = [
      setTimeout(() => {
        console.log('PHASE → ROCKET');
        setPhase('ROCKET');
      }, 500),

      setTimeout(() => {
        console.log('PHASE → FIREWORK');
        setPhase('FIREWORK');
      }, 2000),

      setTimeout(() => {
        console.log('PHASE → POPUP');
        setPhase('POPUP');
      }, 3000),

      setTimeout(() => {
        console.log('PHASE → AMBIENT');
        setPhase('AMBIENT');
      }, 4000),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return <>{children(phase)}</>;
}
