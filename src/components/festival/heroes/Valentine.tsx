'use client';

import React from 'react';

export default function ValentineVisual() {
  const particles = [
    { x: 14, y: 34, s: 7, d: '0s', dur: '5.8s', o: 0.65 },
    { x: 22, y: 18, s: 5, d: '1.2s', dur: '6.5s', o: 0.5 },
    { x: 29, y: 72, s: 6, d: '2.1s', dur: '5.2s', o: 0.7 },
    { x: 36, y: 24, s: 4, d: '0.8s', dur: '6.8s', o: 0.45 },
    { x: 42, y: 82, s: 5, d: '2.8s', dur: '5.7s', o: 0.55 },
    { x: 49, y: 14, s: 6, d: '1.7s', dur: '6.2s', o: 0.6 },
    { x: 56, y: 80, s: 4, d: '0.4s', dur: '5.4s', o: 0.5 },
    { x: 63, y: 20, s: 5, d: '2.3s', dur: '6.7s', o: 0.65 },
    { x: 70, y: 74, s: 7, d: '1.1s', dur: '5.9s', o: 0.55 },
    { x: 77, y: 30, s: 4, d: '2.7s', dur: '6.3s', o: 0.5 },
    { x: 84, y: 62, s: 6, d: '0.9s', dur: '5.6s', o: 0.65 },
    { x: 90, y: 40, s: 5, d: '2.0s', dur: '6.1s', o: 0.45 },
  ];

  const petals = [
    { x: 16, y: 63, r: -25, s: 0.72, d: '0s', dur: '8s' },
    { x: 27, y: 31, r: 35, s: 0.55, d: '2s', dur: '9s' },
    { x: 73, y: 29, r: -40, s: 0.6, d: '1s', dur: '8.5s' },
    { x: 84, y: 65, r: 28, s: 0.72, d: '3s', dur: '9.5s' },
    { x: 12, y: 23, r: 55, s: 0.42, d: '2.5s', dur: '7.5s' },
    { x: 88, y: 24, r: -20, s: 0.48, d: '1.8s', dur: '8.2s' },
  ];

  return (
    <div className="relative flex items-center justify-center w-full h-56 my-1 select-none overflow-hidden">

      {/* =========================================================
          PREMIUM DARK ROMANTIC ATMOSPHERE
      ========================================================= */}

      <div className="absolute inset-0 pointer-events-none">

        {/* Main ambient red glow */}
        <div
          className="
            absolute left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            w-64 h-64
            rounded-full
            bg-rose-700/20
            blur-[55px]
            animate-[ambientGlow_5s_ease-in-out_infinite]
          "
        />

        {/* Secondary pink-red glow */}
        <div
          className="
            absolute left-1/2 top-[48%]
            -translate-x-1/2 -translate-y-1/2
            w-40 h-40
            rounded-full
            bg-red-500/20
            blur-[40px]
          "
        />

        {/* Central soft halo */}
        <div
          className="
            absolute left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            w-32 h-32
            rounded-full
            bg-rose-500/15
            blur-2xl
          "
        />
      </div>


      {/* =========================================================
          FLOATING HEART PARTICLES
          SVG HEARTS — NO EMOJIS
      ========================================================= */}

      <div className="absolute inset-0 pointer-events-none z-10">

        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `heartFloat ${p.dur} ease-in-out ${p.d} infinite`,
              opacity: p.o,
            }}
          >
            <svg
              width={p.s}
              height={p.s}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter:
                  'drop-shadow(0 0 5px rgba(244,63,94,0.7))',
              }}
            >
              <path
                d="
                  M12 21
                  C11.7 21 11.4 20.9 11.15 20.7
                  C5.4 16.05 2 13 2 8.7
                  C2 5.55 4.45 3 7.5 3
                  C9.25 3 10.95 3.8 12 5.15
                  C13.05 3.8 14.75 3 16.5 3
                  C19.55 3 22 5.55 22 8.7
                  C22 13 18.6 16.05 12.85 20.7
                  C12.6 20.9 12.3 21 12 21Z
                "
                fill="#fb7185"
              />
            </svg>
          </div>
        ))}

      </div>


      {/* =========================================================
          SOFT GOLDEN MICRO PARTICLES
      ========================================================= */}

      <div className="absolute inset-0 pointer-events-none z-10">

        <span
          className="
            absolute left-[18%] top-[43%]
            w-1 h-1 rounded-full
            bg-amber-200/80
            blur-[0.5px]
            animate-[sparkle_2.8s_ease-in-out_infinite]
          "
        />

        <span
          className="
            absolute left-[31%] top-[19%]
            w-1.5 h-1.5 rounded-full
            bg-rose-200/80
            blur-[0.5px]
            animate-[sparkle_3.5s_ease-in-out_0.7s_infinite]
          "
        />

        <span
          className="
            absolute left-[69%] top-[17%]
            w-1 h-1 rounded-full
            bg-amber-100/80
            animate-[sparkle_3s_ease-in-out_1.2s_infinite]
          "
        />

        <span
          className="
            absolute left-[81%] top-[45%]
            w-1.5 h-1.5 rounded-full
            bg-pink-200/70
            animate-[sparkle_2.5s_ease-in-out_0.4s_infinite]
          "
        />

        <span
          className="
            absolute left-[25%] top-[78%]
            w-1 h-1 rounded-full
            bg-amber-100/70
            animate-[sparkle_3.2s_ease-in-out_1.8s_infinite]
          "
        />

        <span
          className="
            absolute left-[76%] top-[79%]
            w-1 h-1 rounded-full
            bg-rose-100/80
            animate-[sparkle_2.9s_ease-in-out_1s_infinite]
          "
        />

      </div>


      {/* =========================================================
          FLOATING ROSE PETALS
      ========================================================= */}

      <div className="absolute inset-0 pointer-events-none z-20">

        {petals.map((petal, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${petal.x}%`,
              top: `${petal.y}%`,
              transform: `rotate(${petal.r}deg) scale(${petal.s})`,
              animation: `petalFloat ${petal.dur} ease-in-out ${petal.d} infinite`,
            }}
          >
            <svg
              width="20"
              height="13"
              viewBox="0 0 20 13"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter:
                  'drop-shadow(0 3px 6px rgba(127,29,29,0.45))',
              }}
            >

              <defs>

                <linearGradient
                  id={`petalGradient-${i}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="#fb7185"
                  />

                  <stop
                    offset="45%"
                    stopColor="#e11d48"
                  />

                  <stop
                    offset="100%"
                    stopColor="#881337"
                  />
                </linearGradient>

              </defs>

              <path
                d="M1 7C4 1 10 0 19 3C16 10 9 14 1 7Z"
                fill={`url(#petalGradient-${i})`}
              />

              <path
                d="M4 6C8 4 12 3 16 4"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="0.8"
                strokeLinecap="round"
                fill="none"
              />

            </svg>
          </div>
        ))}

      </div>


      {/* =========================================================
          MAIN HERO HEART
      ========================================================= */}

      <div className="relative z-30 flex items-center justify-center">

        {/* Large soft red aura */}
        <div
          className="
            absolute
            w-36 h-36
            rounded-full
            bg-red-600/25
            blur-3xl
            animate-[heartAura_3.2s_ease-in-out_infinite]
          "
        />

        {/* Secondary glow */}
        <div
          className="
            absolute
            w-28 h-28
            rounded-full
            bg-rose-500/25
            blur-2xl
          "
        />


        {/* =====================================================
            PREMIUM RUBY HEART
        ===================================================== */}

        <svg
          width="138"
          height="138"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="
            relative
            z-20
            overflow-visible
            animate-[heroHeartbeat_3s_ease-in-out_infinite]
          "
          style={{
            filter:
              'drop-shadow(0 14px 22px rgba(127,29,29,0.55)) drop-shadow(0 0 18px rgba(244,63,94,0.42))',
          }}
        >

          <defs>

            {/* Premium ruby gradient */}
            <linearGradient
              id="premiumHeartGradient"
              x1="15%"
              y1="5%"
              x2="90%"
              y2="100%"
            >

              <stop
                offset="0%"
                stopColor="#ff8a9d"
              />

              <stop
                offset="14%"
                stopColor="#fb526f"
              />

              <stop
                offset="38%"
                stopColor="#e11d48"
              />

              <stop
                offset="68%"
                stopColor="#be123c"
              />

              <stop
                offset="100%"
                stopColor="#4c0519"
              />

            </linearGradient>


            {/* Inner heart depth */}
            <radialGradient
              id="heartDepth"
              cx="42%"
              cy="30%"
              r="75%"
            >

              <stop
                offset="0%"
                stopColor="#ffb4c1"
                stopOpacity="0.35"
              />

              <stop
                offset="35%"
                stopColor="#fb7185"
                stopOpacity="0.08"
              />

              <stop
                offset="75%"
                stopColor="#7f1d1d"
                stopOpacity="0.2"
              />

              <stop
                offset="100%"
                stopColor="#1f0710"
                stopOpacity="0.45"
              />

            </radialGradient>


            {/* Heart glow */}
            <filter
              id="heartGlow"
              x="-60%"
              y="-60%"
              width="220%"
              height="220%"
            >

              <feGaussianBlur
                stdDeviation="5"
                result="blur"
              />

              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  1 0 0 0 0
                  0 0.15 0 0 0
                  0 0 0.25 0 0
                  0 0 0 0.75 0
                "
              />

              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>

            </filter>


            {/* Gloss reflection */}
            <linearGradient
              id="heartShine"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >

              <stop
                offset="0%"
                stopColor="#ffffff"
                stopOpacity="0.7"
              />

              <stop
                offset="20%"
                stopColor="#ffffff"
                stopOpacity="0.18"
              />

              <stop
                offset="45%"
                stopColor="#ffffff"
                stopOpacity="0"
              />

            </linearGradient>

          </defs>


          {/* Main heart silhouette */}
          <path
            d="
              M100 170
              C91 162 27 118 27 66
              C27 36 48 19 73 19
              C86 19 96 25 100 36
              C104 25 114 19 127 19
              C152 19 173 36 173 66
              C173 118 109 162 100 170Z
            "
            fill="url(#premiumHeartGradient)"
            filter="url(#heartGlow)"
          />


          {/* Inner depth */}
          <path
            d="
              M100 164
              C89 154 35 115 35 68
              C35 43 51 29 72 29
              C85 29 94 35 100 47
              C106 35 115 29 128 29
              C149 29 165 43 165 68
              C165 115 111 154 100 164Z
            "
            fill="url(#heartDepth)"
          />


          {/* Glossy reflection */}
          <path
            d="
              M55 47
              C43 55 40 69 45 82
              C49 91 56 96 63 100
            "
            stroke="url(#heartShine)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />


          {/* Small glass highlight */}
          <ellipse
            cx="67"
            cy="43"
            rx="11"
            ry="5"
            transform="rotate(-28 67 43)"
            fill="rgba(255,255,255,0.28)"
          />


          {/* Lower subtle reflection */}
          <path
            d="M69 139 C83 151 94 158 100 162"
            stroke="rgba(255,120,145,0.16)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

        </svg>

      </div>


      {/* =========================================================
          FOREGROUND BLURRED HEART PARTICLES
      ========================================================= */}

      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">

        {/* Left foreground heart */}
        <svg
          className="
            absolute
            left-[8%]
            top-[28%]
            opacity-30
            blur-[1px]
            animate-[foregroundFloat_7s_ease-in-out_infinite]
          "
          width="18"
          height="18"
          viewBox="0 0 24 24"
        >

          <path
            d="
              M12 21
              C11.7 21 11.4 20.9 11.15 20.7
              C5.4 16.05 2 13 2 8.7
              C2 5.55 4.45 3 7.5 3
              C9.25 3 10.95 3.8 12 5.15
              C13.05 3.8 14.75 3 16.5 3
              C19.55 3 22 5.55 22 8.7
              C22 13 18.6 16.05 12.85 20.7
              C12.6 20.9 12.3 21 12 21Z
            "
            fill="#fb7185"
          />

        </svg>


        {/* Right foreground heart */}
        <svg
          className="
            absolute
            right-[7%]
            bottom-[24%]
            opacity-25
            blur-[1.5px]
            animate-[foregroundFloat_8s_ease-in-out_1s_infinite]
          "
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >

          <path
            d="
              M12 21
              C11.7 21 11.4 20.9 11.15 20.7
              C5.4 16.05 2 13 2 8.7
              C2 5.55 4.45 3 7.5 3
              C9.25 3 10.95 3.8 12 5.15
              C13.05 3.8 14.75 3 16.5 3
              C19.55 3 22 5.55 22 8.7
              C22 13 18.6 16.05 12.85 20.7
              C12.6 20.9 12.3 21 12 21Z
            "
            fill="#e11d48"
          />

        </svg>

      </div>


      {/* =========================================================
          ANIMATIONS
      ========================================================= */}

      <style jsx>{`

        /* Main heart heartbeat */
        @keyframes heroHeartbeat {

          0%, 100% {
            transform: scale(1);
          }

          18% {
            transform: scale(1.035);
          }

          32% {
            transform: scale(0.995);
          }

          46% {
            transform: scale(1.025);
          }

          62% {
            transform: scale(1);
          }

        }


        /* Ambient glow */
        @keyframes ambientGlow {

          0%, 100% {
            opacity: 0.65;
            transform: translate(-50%, -50%) scale(0.94);
          }

          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.08);
          }

        }


        /* Heart aura */
        @keyframes heartAura {

          0%, 100% {
            opacity: 0.55;
            transform: scale(0.92);
          }

          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }

        }


        /* Small heart particles */
        @keyframes heartFloat {

          0%, 100% {
            transform:
              translate3d(0, 6px, 0)
              scale(0.8);

            opacity: 0.35;
          }

          50% {
            transform:
              translate3d(0, -12px, 0)
              scale(1.08);

            opacity: 0.95;
          }

        }


        /* Golden sparkles */
        @keyframes sparkle {

          0%, 100% {
            opacity: 0.2;
            transform: scale(0.65);
          }

          50% {
            opacity: 1;
            transform: scale(1.25);
          }

        }


        /* Rose petals */
        @keyframes petalFloat {

          0%, 100% {
            transform:
              translate3d(0, 0, 0)
              rotate(0deg)
              scale(1);

            opacity: 0.25;
          }

          30% {
            opacity: 0.75;
          }

          50% {
            transform:
              translate3d(10px, -12px, 0)
              rotate(22deg)
              scale(1);

            opacity: 0.9;
          }

          75% {
            opacity: 0.55;
          }

        }


        /* Foreground depth */
        @keyframes foregroundFloat {

          0%, 100% {
            transform:
              translate3d(0, 8px, 0)
              rotate(-5deg);
          }

          50% {
            transform:
              translate3d(8px, -12px, 0)
              rotate(8deg);
          }

        }

      `}</style>

    </div>
  );
}
