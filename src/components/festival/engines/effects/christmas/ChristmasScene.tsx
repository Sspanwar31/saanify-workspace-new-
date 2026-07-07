'use client';

interface Props {
  step: number;
}

export default function ChristmasScene({ step }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Moon */}
      <div
        className={`absolute right-[8%] top-[8%] transition-all duration-[2500ms]
        ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
      >
        <div
          className="w-36 h-36 rounded-full"
          style={{
            background:
              'radial-gradient(circle,#ffffff 0%,#e2e8f0 45%,rgba(255,255,255,.08) 100%)',
            boxShadow:
              '0 0 80px rgba(255,255,255,.45),0 0 180px rgba(255,255,255,.12)',
          }}
        />
      </div>

      {/* Moon Glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 82% 18%, rgba(180,220,255,.14), transparent 35%)',
        }}
      />

      {/* Mountains */}
      <svg
        className="absolute bottom-0 w-full h-[45%]"
        viewBox="0 0 1920 500"
        preserveAspectRatio="none"
      >
        <path
          d="M0 500L250 220L500 500Z"
          fill="#0f172a"
        />

        <path
          d="M250 500L650 120L1050 500Z"
          fill="#111827"
        />

        <path
          d="M900 500L1350 180L1800 500Z"
          fill="#1e293b"
        />

        <path
          d="M1500 500L1750 260L1920 500Z"
          fill="#0f172a"
        />
      </svg>

      {/* Forest */}
      <div className="absolute bottom-0 left-0 w-full h-[28%] flex justify-around items-end opacity-90">

        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="relative"
            style={{
              width: 30 + (i % 3) * 12,
              height: 90 + (i % 4) * 18,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '80%',
                clipPath:
                  'polygon(50% 0%,100% 100%,0% 100%)',
                background:
                  'linear-gradient(#14532d,#052e16)',
              }}
            />

            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{
                width: 8,
                height: '22%',
                background: '#3f2b16',
              }}
            />
          </div>
        ))}

      </div>

      {/* Snow Ground */}
      <div
        className="absolute bottom-0 left-0 w-full h-[15%]"
        style={{
          background:
            'linear-gradient(to top,#dbeafe,#ffffff)',
          boxShadow:
            '0 -20px 60px rgba(255,255,255,.15)',
        }}
      />

      {/* Santa */}
      <div
        className={`absolute transition-all duration-[2600ms]
        ${
          step >= 2
            ? 'translate-x-[38vw] opacity-100'
            : '-translate-x-[120%] opacity-100'
        }`}
        style={{
          top: '22%',
        }}
      >
        <svg
          width="340"
          height="150"
          viewBox="0 0 700 260"
        >

          {/* Reindeer */}

          <ellipse
            cx="80"
            cy="110"
            rx="22"
            ry="18"
            fill="#fff"
          />

          <rect
            x="65"
            y="125"
            width="6"
            height="38"
            fill="#fff"
          />

          <rect
            x="90"
            y="125"
            width="6"
            height="38"
            fill="#fff"
          />

          <path
            d="M78 88 L65 58"
            stroke="#fff"
            strokeWidth="4"
          />

          <path
            d="M88 88 L100 58"
            stroke="#fff"
            strokeWidth="4"
          />

          {/* Rope */}

          <line
            x1="104"
            y1="108"
            x2="210"
            y2="108"
            stroke="#fff"
            strokeWidth="2"
          />

          {/* Sleigh */}

          <path
            d="M220 120
               L340 120
               L360 90
               L470 90"
            stroke="#fff"
            strokeWidth="8"
            fill="none"
          />

          <path
            d="M215 150
               Q330 180
               470 150"
            stroke="#fff"
            strokeWidth="8"
            fill="none"
          />

          {/* Santa */}

          <circle
            cx="370"
            cy="58"
            r="14"
            fill="#fff"
          />

          <rect
            x="360"
            y="72"
            width="22"
            height="34"
            fill="#fff"
          />

          <line
            x1="350"
            y1="84"
            x2="330"
            y2="98"
            stroke="#fff"
            strokeWidth="6"
          />

          <line
            x1="382"
            y1="84"
            x2="405"
            y2="96"
            stroke="#fff"
            strokeWidth="6"
          />

          {/* Hat */}

          <path
            d="M355 50
               L372 22
               L386 48"
            fill="#fff"
          />

        </svg>
      </div>

      {/* Breath */}

      {step >= 3 && (
        <div
          className="absolute"
          style={{
            left: '42%',
            top: '31%',
          }}
        >
          <div className="w-4 h-4 rounded-full bg-white/40 animate-ping absolute" />
          <div className="w-8 h-8 rounded-full bg-white/20 animate-ping delay-300 absolute" />
        </div>
      )}

    </div>
  );
}
