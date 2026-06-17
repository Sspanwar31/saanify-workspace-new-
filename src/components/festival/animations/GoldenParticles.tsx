'use client';

type Props = {
  preset?: string;
};

export default function GoldenParticles({
  preset = 'GOLDEN_PARTICLES'
}: Props) {

  const configs: any = {

    GOLDEN_PARTICLES: {
      color: '#FFD700',
      particles: 80,
      minSize: 2,
      maxSize: 8,
      speedMin: 4,
      speedMax: 8
    },

    FIRE_EMBERS: {
      color: '#FF4500',
      particles: 120,
      minSize: 2,
      maxSize: 5,
      speedMin: 2,
      speedMax: 4
    },

    LOTUS_PARTICLES: {
      color: '#FF69B4',
      particles: 90,
      minSize: 4,
      maxSize: 10,
      speedMin: 5,
      speedMax: 9
    },

    TEMPLE_GLOW: {
      color: '#FFA500',
      particles: 40,
      minSize: 6,
      maxSize: 12,
      speedMin: 8,
      speedMax: 14
    },

    DIVINE_LIGHT: {
      color: '#FFF8DC',
      particles: 30,
      minSize: 8,
      maxSize: 14,
      speedMin: 10,
      speedMax: 16
    },

    SUNRISE_RAYS: {
      color: '#FFB000',
      particles: 25,
      minSize: 10,
      maxSize: 18,
      speedMin: 12,
      speedMax: 18
    },

    HARVEST_SPARKS: {
      color: '#F4D03F',
      particles: 70,
      minSize: 4,
      maxSize: 8,
      speedMin: 6,
      speedMax: 10
    },

    PEACOCK_PARTICLES: {
      color: '#00BFFF',
      particles: 100,
      minSize: 3,
      maxSize: 8,
      speedMin: 5,
      speedMax: 10
    }
  };

  const config =
    configs[preset] ||
    configs.GOLDEN_PARTICLES;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">

      {[...Array(config.particles)].map((_, i) => {

        const size =
          config.minSize +
          Math.random() *
            (config.maxSize - config.minSize);

        const duration =
          config.speedMin +
          Math.random() *
            (config.speedMax - config.speedMin);

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${Math.random() * 100}%`,
              top: '-20px',
              background: config.color,
              opacity: 0.85,
              filter: `drop-shadow(0 0 10px ${config.color})`,
              animation: `fall ${duration}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        );
      })}

      <style jsx>{`
        @keyframes fall {

          0% {
            transform:
              translateY(0px)
              translateX(0px);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          50% {
            transform:
              translateY(50vh)
              translateX(
                ${preset === 'FIRE_EMBERS'
                  ? '20px'
                  : '0px'}
              );
          }

          100% {
            transform:
              translateY(120vh)
              translateX(
                ${preset === 'FIRE_EMBERS'
                  ? '40px'
                  : '0px'}
              );
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
