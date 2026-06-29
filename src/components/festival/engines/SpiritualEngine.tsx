'use client';

import DiwaliScene from './presets/DiwaliScene';
import DevDeepawaliScene from './presets/DevDeepawaliScene';

import FestivalIntroController from '../intro/FestivalIntroController';

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

      // INTRO MODE
      if (phase === 'INTRO') {
        return (
          <FestivalIntroController>
            {(introPhase) => {
              console.log(
                'INTRO PHASE =',
                introPhase
              );

              return (
                <DiwaliScene
                  phase={introPhase}
                />
              );
            }}
          </FestivalIntroController>
        );
      }

      // ACTIVE MODE
      return (
        <DiwaliScene
          phase="AMBIENT"
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
