'use client';

import DiwaliScene from './presets/DiwaliScene';
import DevDeepawaliScene from './presets/DevDeepawaliScene';

// 🚀 2027 UPGRADE: Purana FestivalIntroController import HATA DO
// import FestivalIntroController from '../intro/FestivalIntroController';

export default function SpiritualEngine({
  preset,
  phase,
}: {
  preset?: string;
  phase?: string;
}) {

  console.log('SPIRITUAL ENGINE PHASE =', phase);

  switch (preset) {
    case 'DIWALI':
      // ✅ SAHI: Jo phase aaya hai, seedha DiwaliScene ko bhej do. 
      // Ab yahan koi INTRO/ACTIVE ka drama nahi hoga.
      return (
        <DiwaliScene
          phase={phase}
        />
      );

    case 'DEV_DEEPAWALI':
      return (
        <DevDeepawaliScene
          phase={phase}
        />
      );

    default:
      return null;
  }
}
