'use client';

import React from 'react';

export default function ValentineVisual() {
  const hearts = [
    { x: 8, y: 25, size: 8, delay: '0s', duration: '6s', opacity: 0.45 },
    { x: 14, y: 62, size: 6, delay: '1.5s', duration: '7s', opacity: 0.55 },
    { x: 21, y: 38, size: 5, delay: '2.2s', duration: '6.5s', opacity: 0.4 },
    { x: 27, y: 17, size: 7, delay: '0.8s', duration: '7.5s', opacity: 0.5 },
    { x: 31, y: 72, size: 5, delay: '3s', duration: '6.2s', opacity: 0.45 },

    { x: 68, y: 20, size: 6, delay: '1.1s', duration: '6.8s', opacity: 0.5 },
    { x: 74, y: 70, size: 7, delay: '2.4s', duration: '7.2s', opacity: 0.45 },
    { x: 81, y: 39, size: 5, delay: '0.4s', duration: '6.4s', opacity: 0.55 },
    { x: 88, y: 62, size: 8, delay: '1.9s', duration: '7.8s', opacity: 0.4 },
    { x: 93, y: 27, size: 5, delay: '2.7s', duration: '6.6s', opacity: 0.5 },

    { x: 38, y: 13, size: 4, delay: '1.4s', duration: '5.8s', opacity: 0.35 },
    { x: 62, y: 84, size: 5, delay: '2.1s', duration: '6.9s', opacity: 0.4 },
  ];

  const particles = [
    { x: 10, y: 45, size: 2 },
    { x: 17, y: 18, size: 2 },
    { x: 25, y: 81, size: 1.5 },
    { x: 34, y: 27, size: 2 },
    { x: 42, y: 12, size: 1.5 },
    { x: 58, y: 15, size: 2 },
    { x: 66, y: 31, size: 1.5 },
    { x: 76, y: 84, size: 2 },
    { x: 86, y: 18, size: 1.5 },
    { x: 92, y: 47, size: 2 },
    { x: 82, y: 77, size: 1.5 },
    { x: 19, y: 78, size: 2 },
  ];

  const petals = [
    { x: 10, y: 30, rotate: -30, scale: 0.65 },
    { x: 19, y: 74, rotate: 35, scale: 0.5 },
    { x: 84, y: 29, rotate: 25, scale: 0.65 },
    { x: 91, y: 70, rotate: -35, scale: 0.55 },
    { x: 29, y: 84, rotate: 50, scale: 0.45 },
    { x: 76, y: 15, rotate: -20, scale: 0.45 },
  ];

  return (
    <div className="relative flex items-center justify-center w-full h-56 my-1 select-none overflow-hidden">

      {/* =========================================================
          PREMIUM CINEMATIC BACKGROUND
      ========================================================= */}

      <div className="absolute inset-0 pointer-events-none">

        {/* Deep central red atmosphere */}
        <div
          className="
            absolute
            left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            w-[250px] h-[250px]
            rounded-full
            bg-red-700/20
            blur-[65px]
            animate-[cinematicGlow_6s_ease-in-out_infinite]
          "
        />

        {/* Soft pink halo */}
        <div
          className="
            absolute
            left-1/2 top-[48%]
            -translate-x-1/2 -translate-y-1/2
            w-[150px] h-[150px]
            rounded-full
            bg-rose-500/20
            blur-[45px]
          "
        />

        {/* Tiny warm center */}
        <div
          className="
            absolute
            left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            w-[80px] h-[80px]
            rounded-full
            bg-red-400/15
            blur-[25px]
          "
        />

      </div>


      {/* =========================================================
          FLOATING MINI HEARTS
      ========================================================= */}

      <div className="absolute inset-0 z-10 pointer-events-none">

        {hearts.map((heart, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              opacity: heart.opacity,
              animation: `romanticFloat ${heart.duration} ease-in-out ${heart.delay} infinite`,
            }}
          >

            <svg
              width={heart.size}
              height={heart.size}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter:
                  'drop-shadow(0 0 5px rgba(244,63,94,0.65))',
              }}
            >

              <path
                d="
                  M12 21
                  C11.7 21 11.4 20.9 11.1 20.65
                  C5.3 16 2 12.95 2 8.7
                  C2 5.55 4.45 3 7.5 3
                  C9.3 3 10.95 3.8 12 5.15
                  C13.05 3.8 14.7 3 16.5 3
                  C19.55 3 22 5.55 22 8.7
                  C22 12.95 18.7 16 12.9 20.65
                  C12.6 20.9 12.3 21 12 21Z
                "
                fill="#fb526f"
              />

            </svg>

          </div>
        ))}

      </div>


      {/* =========================================================
          PREMIUM GOLD / LIGHT PARTICLES
      ========================================================= */}

      <div className="absolute inset-0 z-20 pointer-events-none">

        {particles.map((particle, index) => (
          <span
            key={index}
            className="
              absolute
              rounded-full
              bg-white
              animate-[twinkle_3s_ease-in-out_infinite]
            "
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${index * 0.27}s`,
              boxShadow:
                '0 0 7px rgba(255,180,190,0.9)',
            }}
          />
        ))}

      </div>


      {/* =========================================================
          FLOATING ROSE PETALS
      ========================================================= */}

      <div className="absolute inset-0 z-20 pointer-events-none">

        {petals.map((petal, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${petal.x}%`,
              top: `${petal.y}%`,
              transform: `
                rotate(${petal.rotate}deg)
                scale(${petal.scale})
              `,
              animation: `petalDrift ${6 + index * 0.7}s ease-in-out ${index * 0.6}s infinite`,
            }}
          >

            <svg
              width="26"
              height="17"
              viewBox="0 0 26 17"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter:
                  'drop-shadow(0 3px 7px rgba(90,0,20,0.6))',
              }}
            >

              <defs>

                <linearGradient
                  id={`petal-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >

                  <stop
                    offset="0%"
                    stopColor="#ff9aaa"
                  />

                  <stop
                    offset="30%"
                    stopColor="#f43f5e"
                  />

                  <stop
                    offset="70%"
                    stopColor="#be123c"
                  />

                  <stop
                    offset="100%"
                    stopColor="#4c0519"
                  />

                </linearGradient>

              </defs>

              <path
                d="
                  M1 9
                  C5 2 14 1 25 5
                  C21 13 11 18 1 9Z
                "
                fill={`url(#petal-${index})`}
              />

              <path
                d="M5 8C10 6 15 5 20 6"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="0.8"
                strokeLinecap="round"
                fill="none"
              />

            </svg>

          </div>
        ))}

      </div>


      {/* =========================================================
          LARGE CRYSTAL HEART AURA
      ========================================================= */}

      <div className="relative z-30 flex items-center justify-center">

        {/* Outer heartbeat aura */}
        <div
          className="
            absolute
            w-[150px] h-[150px]
            rounded-full
            border
            border-rose-400/10
            animate-[auraPulse_3s_ease-in-out_infinite]
          "
        />

        {/* Second glass halo */}
        <div
          className="
            absolute
            w-[126px] h-[126px]
            rounded-full
            border
            border-white/10
            bg-white/[0.015]
            backdrop-blur-[1px]
          "
        />

        {/* Deep heart glow */}
        <div
          className="
            absolute
            w-[95px] h-[95px]
            rounded-full
            bg-rose-600/25
            blur-[28px]
            animate-[heartGlow_2.8s_ease-in-out_infinite]
          "
        />


        {/* =====================================================
            MAIN 3D RUBY / CRYSTAL HEART
        ===================================================== */}

        <svg
          width="132"
          height="132"
          viewBox="0 0 220 220"
          xmlns="http://www.w3.org/2000/svg"
          className="
            relative
            z-40
            overflow-visible
            animate-[premiumHeartbeat_3s_ease-in-out_infinite]
          "
          style={{
            filter:
              'drop-shadow(0 12px 20px rgba(90,0,25,0.55)) drop-shadow(0 0 15px rgba(244,63,94,0.45))',
          }}
        >

          <defs>

            {/* Main ruby body */}
            <linearGradient
              id="rubyHeart"
              x1="12%"
              y1="5%"
              x2="88%"
              y2="100%"
            >

              <stop
                offset="0%"
                stopColor="#ffb1bd"
              />

              <stop
                offset="12%"
                stopColor="#ff6b83"
              />

              <stop
                offset="32%"
                stopColor="#f43f5e"
              />

              <stop
                offset="58%"
                stopColor="#c91843"
              />

              <stop
                offset="82%"
                stopColor="#7f1233"
              />

              <stop
                offset="100%"
                stopColor="#350313"
              />

            </linearGradient>


            {/* Crystal depth */}
            <radialGradient
              id="rubyDepth"
              cx="42%"
              cy="27%"
              r="75%"
            >

              <stop
                offset="0%"
                stopColor="#ffffff"
                stopOpacity="0.24"
              />

              <stop
                offset="22%"
                stopColor="#ffb6c2"
                stopOpacity="0.15"
              />

              <stop
                offset="55%"
                stopColor="#b3123d"
                stopOpacity="0.08"
              />

              <stop
                offset="100%"
                stopColor="#16030a"
                stopOpacity="0.48"
              />

            </radialGradient>


            {/* Strong glow */}
            <filter
              id="rubyGlow"
              x="-60%"
              y="-60%"
              width="220%"
              height="220%"
            >

              <feGaussianBlur
                stdDeviation="4"
                result="blur"
              />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>

            </filter>


            {/* White crystal shine */}
            <linearGradient
              id="crystalShine"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >

              <stop
                offset="0%"
                stopColor="#ffffff"
                stopOpacity="0.85"
              />

              <stop
                offset="18%"
                stopColor="#ffffff"
                stopOpacity="0.28"
              />

              <stop
                offset="42%"
                stopColor="#ffffff"
                stopOpacity="0"
              />

              <stop
                offset="100%"
                stopColor="#ffffff"
                stopOpacity="0"
              />

            </linearGradient>


            {/* Bottom ruby reflection */}
            <linearGradient
              id="bottomReflection"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >

              <stop
                offset="0%"
                stopColor="#ff8298"
                stopOpacity="0"
              />

              <stop
                offset="100%"
                stopColor="#ff365f"
                stopOpacity="0.35"
              />

            </linearGradient>

          </defs>


          {/* =================================================
              HEART SHADOW / DEPTH
          ================================================= */}

          <path
            d="
              M110 186
              C98 176 30 130 30 76
              C30 42 53 21 81 21
              C95 21 105 28 110 40
              C115 28 125 21 139 21
              C167 21 190 42 190 76
              C190 130 122 176 110 186Z
            "
            fill="rgba(20,0,8,0.42)"
            transform="translate(0 5)"
          />


          {/* =================================================
              MAIN HEART
          ================================================= */}

          <path
            d="
              M110 181
              C99 172 34 128 34 76
              C34 45 55 25 81 25
              C95 25 105 32 110 44
              C115 32 125 25 139 25
              C165 25 186 45 186 76
              C186 128 121 172 110 181Z
            "
            fill="url(#rubyHeart)"
            filter="url(#rubyGlow)"
          />


          {/* =================================================
              INNER CRYSTAL DEPTH
          ================================================= */}

          <path
            d="
              M110 174
              C99 165 43 126 43 78
              C43 51 60 34 82 34
              C95 34 104 42 110 55
              C116 42 125 34 138 34
              C160 34 177 51 177 78
              C177 126 121 165 110 174Z
            "
            fill="url(#rubyDepth)"
          />


          {/* =================================================
              LARGE GLASS REFLECTION
          ================================================= */}

          <path
            d="
              M66 53
              C53 62 49 76 53 91
              C56 102 64 111 75 117
            "
            stroke="url(#crystalShine)"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />


          {/* Small bright reflection */}
          <ellipse
            cx="78"
            cy="48"
            rx="14"
            ry="6"
            transform="rotate(-27 78 48)"
            fill="rgba(255,255,255,0.34)"
          />


          {/* Fine crystal highlight */}
          <path
            d="
              M63 127
              C76 143 94 156 110 166
            "
            stroke="rgba(255,140,160,0.18)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />


          {/* Bottom depth */}
          <path
            d="
              M56 126
              C76 149 98 164 110 174
              C122 164 144 149 164 126
            "
            fill="url(#bottomReflection)"
            opacity="0.5"
          />

        </svg>


        {/* =====================================================
            TINY LIGHT RING AROUND HEART
        ===================================================== */}

        <div
          className="
            absolute
            w-[116px] h-[116px]
            rounded-full
            border
            border-rose-300/15
            animate-[ringPulse_4s_ease-in-out_infinite]
          "
        />

      </div>


      {/* =========================================================
          FOREGROUND HEARTS
      ========================================================= */}

      <div className="absolute inset-0 z-50 pointer-events-none">

        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          className="
            absolute
            left-[7%]
            top-[52%]
            opacity-40
            blur-[0.5px]
            animate-[foregroundHeart_7s_ease-in-out_infinite]
          "
        >

          <path
            d="
              M12 21
              C11.7 21 11.4 20.9 11.1 20.65
              C5.3 16 2 12.95 2 8.7
              C2 5.55 4.45 3 7.5 3
              C9.3 3 10.95 3.8 12 5.15
              C13.05 3.8 14.7 3 16.5 3
              C19.55 3 22 5.55 22 8.7
              C22 12.95 18.7 16 12.9 20.65
              C12.6 20.9 12.3 21 12 21Z
            "
            fill="#f43f5e"
          />

        </svg>


        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          className="
            absolute
            right-[6%]
            bottom-[30%]
            opacity-35
            blur-[1px]
            animate-[foregroundHeart_8s_ease-in-out_1.5s_infinite]
          "
        >

          <path
            d="
              M12 21
              C11.7 21 11.4 20.9 11.1 20.65
              C5.3 16 2 12.95 2 8.7
              C2 5.55 4.45 3 7.5 3
              C9.3 3 10.95 3.8 12 5.15
              C13.05 3.8 14.7 3 16.5 3
              C19.55 3 22 5.55 22 8.7
              C22 12.95 18.7 16 12.9 20.65
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

        /* ---------------------------------------------
           Cinematic background breathing
        --------------------------------------------- */

        @keyframes cinematicGlow {

          0%, 100% {
            opacity: 0.55;
            transform:
              translate(-50%, -50%)
              scale(0.92);
          }

          50% {
            opacity: 0.95;
            transform:
              translate(-50%, -50%)
              scale(1.08);
          }

        }


        /* ---------------------------------------------
           Main heart heartbeat
        --------------------------------------------- */

        @keyframes premiumHeartbeat {

          0%, 100% {
            transform: scale(1);
          }

          8% {
            transform: scale(1.015);
          }

          15% {
            transform: scale(1.055);
          }

          23% {
            transform: scale(1);
          }

          35% {
            transform: scale(1.035);
          }

          44% {
            transform: scale(1);
          }

        }


        /* ---------------------------------------------
           Heart light
        --------------------------------------------- */

        @keyframes heartGlow {

          0%, 100% {
            opacity: 0.45;
            transform: scale(0.9);
          }

          50% {
            opacity: 0.9;
            transform: scale(1.1);
          }

        }


        /* ---------------------------------------------
           Outer aura
        --------------------------------------------- */

        @keyframes auraPulse {

          0%, 100% {
            transform: scale(0.94);
            opacity: 0.25;
          }

          50% {
            transform: scale(1.08);
            opacity: 0.65;
          }

        }


        /* ---------------------------------------------
           Ring
        --------------------------------------------- */

        @keyframes ringPulse {

          0%, 100% {
            transform: scale(0.96);
            opacity: 0.15;
          }

          50% {
            transform: scale(1.08);
            opacity: 0.45;
          }

        }


        /* ---------------------------------------------
           Floating mini hearts
        --------------------------------------------- */

        @keyframes romanticFloat {

          0%, 100% {
            transform:
              translate3d(0, 7px, 0)
              scale(0.75)
              rotate(-5deg);
          }

          50% {
            transform:
              translate3d(5px, -13px, 0)
              scale(1.08)
              rotate(7deg);
          }

        }


        /* ---------------------------------------------
           Tiny lights
        --------------------------------------------- */

        @keyframes twinkle {

          0%, 100% {
            opacity: 0.15;
            transform: scale(0.6);
          }

          50% {
            opacity: 1;
            transform: scale(1.4);
          }

        }


        /* ---------------------------------------------
           Rose petals
        --------------------------------------------- */

        @keyframes petalDrift {

          0%, 100% {
            opacity: 0.18;
            transform:
              translate3d(0, 5px, 0)
              rotate(0deg)
              scale(0.9);
          }

          30% {
            opacity: 0.65;
          }

          50% {
            opacity: 0.9;
            transform:
              translate3d(10px, -14px, 0)
              rotate(20deg)
              scale(1);
          }

          75% {
            opacity: 0.4;
          }

        }


        /* ---------------------------------------------
           Foreground hearts
        --------------------------------------------- */

        @keyframes foregroundHeart {

          0%, 100% {
            transform:
              translate3d(0, 8px, 0)
              rotate(-5deg);
          }

          50% {
            transform:
              translate3d(9px, -13px, 0)
              rotate(8deg);
          }

        }

      `}</style>

    </div>
  );
}
