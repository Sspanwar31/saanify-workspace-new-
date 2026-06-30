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
  // 1. FLASH
  setPhase('FLASH');
  await delay(600);
  if (isCancelled) return;

  // 2. ROCKET — Thoda extra time
  setPhase('ROCKET');
  await delay(2000);  // ✅ 1.5 se badha kar 2.0 kiya
  if (isCancelled) return;

  // 3. FIREWORK — Zyada time chahiye burst ke liye
  setPhase('FIREWORK');
  await delay(2500);  // ✅ 1.5 se badha kar 2.5 kiya
  if (isCancelled) return;

  // 4. HANDOVER — Ambient settle hone do
  setPhase('HANDOVER');
  await delay(500);   // ✅ NAYA — Ambient settle hone do
  if (isCancelled) return;

  // 5. Ab signal do
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
