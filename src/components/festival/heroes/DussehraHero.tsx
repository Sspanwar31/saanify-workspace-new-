'use client';

import React, { useState } from 'react';

interface Props {
  imageUrl?: string;
  heroConfig?: any;
  scale?: number;
}

export default function DussehraHero({
  heroConfig,
  scale,
  imageUrl,
}: Props) {
  const userScale = scale ?? heroConfig?.scale ?? 1.08;

  const rawUrl = imageUrl || heroConfig?.image_url;
  const posterUrl =
    rawUrl &&
    typeof rawUrl === 'string' &&
    rawUrl.trim().length > 5
      ? rawUrl.trim()
      : null;

  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="relative w-full min-h-[280px] sm:min-h-[340px] flex items-center justify-center overflow-visible select-none"
      style={{
        transform: `scale(${userScale})`,
        transformOrigin: 'center center',
      }}
    >
      {/* =========================================================
          BACKGROUND FESTIVAL GLOW
      ========================================================= */}

      <div
        className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2
        w-[330px] h-[330px] rounded-full pointer-events-none
        blur-[70px] bg-red-600/20 animate-pulse"
      />

      <div
        className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2
        w-[230px] h-[230px] rounded-full pointer-events-none
        blur-[45px] bg-orange-500/25"
      />

      {/* =========================================================
          UPLOADED POSTER
      ========================================================= */}

      {posterUrl && !imgError ? (
        <div
          className="relative z-20 w-full max-w-[270px] aspect-[3/4]
          rounded-2xl overflow-hidden
          border border-amber-500/40
          shadow-[0_15px_55px_rgba(239,68,68,0.4)]"
        >
          <img
            src={posterUrl}
            alt="Dussehra Ravan Dahan"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        /* =======================================================
           PURE SVG RAVAN DAHAN HERO
        ======================================================== */

        <div
          className="relative z-10 w-full max-w-[350px] sm:max-w-[410px]
          flex items-center justify-center
          drop-shadow-[0_18px_40px_rgba(220,38,38,0.55)]"
        >
          <svg
            viewBox="0 0 420 430"
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label="Ten headed Ravan Dahan Dussehra illustration"
          >
            <defs>
              {/* Gold */}
              <linearGradient
                id="dussehraGold"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#fff8c7" />
                <stop offset="22%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#d99b00" />
                <stop offset="78%" stopColor="#ffdf54" />
                <stop offset="100%" stopColor="#7a4500" />
              </linearGradient>

              {/* Face */}
              <linearGradient
                id="ravanFace"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#8d241c" />
                <stop offset="45%" stopColor="#55100f" />
                <stop offset="100%" stopColor="#210608" />
              </linearGradient>

              {/* Armor */}
              <linearGradient
                id="ravanArmor"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#7f1d1d" />
                <stop offset="35%" stopColor="#3b0909" />
                <stop offset="65%" stopColor="#8f2417" />
                <stop offset="100%" stopColor="#210306" />
              </linearGradient>

              {/* Fire */}
              <linearGradient
                id="flameGradient"
                x1="0%"
                y1="100%"
                x2="0%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#ff2d00" />
                <stop offset="35%" stopColor="#ff6500" />
                <stop offset="65%" stopColor="#ffd000" />
                <stop offset="100%" stopColor="#fff6a0" />
              </linearGradient>

              {/* Fire glow */}
              <radialGradient id="fireGlow">
                <stop offset="0%" stopColor="#fff4a3" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#ff8a00" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#ff2400" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
              </radialGradient>

              {/* Smoke */}
              <radialGradient id="smokeGradient">
                <stop offset="0%" stopColor="#555" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#111" stopOpacity="0" />
              </radialGradient>

              {/* Glow */}
              <filter
                id="goldGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur
                  stdDeviation="2.5"
                  result="blur"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter
                id="fireBlur"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="7" />
              </filter>

              {/* Face shadow */}
              <filter
                id="faceShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="3"
                  floodColor="#000000"
                  floodOpacity="0.65"
                />
              </filter>
            </defs>

            {/* =====================================================
                FIRE BACK GLOW
            ====================================================== */}

            <ellipse
              cx="210"
              cy="335"
              rx="165"
              ry="100"
              fill="url(#fireGlow)"
              filter="url(#fireBlur)"
              className="animate-pulse"
            />

            {/* =====================================================
                FIREWORKS
            ====================================================== */}

            <g opacity="0.85">
              {/* Left firework */}
              <g transform="translate(45 80)">
                <circle r="4" fill="#ffd700" />

                {[...Array(10)].map((_, i) => {
                  const angle = (i * Math.PI * 2) / 10;
                  const x = Math.cos(angle) * 28;
                  const y = Math.sin(angle) * 28;

                  return (
                    <line
                      key={i}
                      x1="0"
                      y1="0"
                      x2={x}
                      y2={y}
                      stroke="#ffd700"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              {/* Right firework */}
              <g transform="translate(375 105)">
                <circle r="3" fill="#ffb000" />

                {[...Array(9)].map((_, i) => {
                  const angle = (i * Math.PI * 2) / 9;
                  const x = Math.cos(angle) * 23;
                  const y = Math.sin(angle) * 23;

                  return (
                    <line
                      key={i}
                      x1="0"
                      y1="0"
                      x2={x}
                      y2={y}
                      stroke="#ff8c00"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            </g>

            {/* =====================================================
                SMOKE BEHIND RAVAN
            ====================================================== */}

            <g opacity="0.45">
              <ellipse
                cx="170"
                cy="160"
                rx="35"
                ry="28"
                fill="url(#smokeGradient)"
              />

              <ellipse
                cx="240"
                cy="135"
                rx="42"
                ry="35"
                fill="url(#smokeGradient)"
              />

              <ellipse
                cx="285"
                cy="170"
                rx="30"
                ry="25"
                fill="url(#smokeGradient)"
              />
            </g>

            {/* =====================================================
                RAVAN BODY
            ====================================================== */}

            <g filter="url(#faceShadow)">
              {/* Wide shoulders */}
              <path
                d="
                  M105 290
                  Q125 255 155 245
                  L265 245
                  Q295 255 315 290
                  L345 410
                  L75 410
                  Z
                "
                fill="url(#ravanArmor)"
                stroke="url(#dussehraGold)"
                strokeWidth="4"
              />

              {/* Chest armor */}
              <path
                d="
                  M145 265
                  Q210 290 275 265
                  L295 395
                  L125 395
                  Z
                "
                fill="#45090a"
                stroke="#c69222"
                strokeWidth="2"
              />

              {/* Golden chest ornament */}
              <path
                d="
                  M210 280
                  L230 310
                  L210 355
                  L190 310
                  Z
                "
                fill="url(#dussehraGold)"
                filter="url(#goldGlow)"
              />

              {/* Shoulder ornaments */}
              <circle
                cx="108"
                cy="295"
                r="20"
                fill="url(#dussehraGold)"
              />

              <circle
                cx="312"
                cy="295"
                r="20"
                fill="url(#dussehraGold)"
              />

              {/* Belt */}
              <path
                d="M100 375 Q210 395 320 375 L315 398 Q210 418 105 398 Z"
                fill="url(#dussehraGold)"
              />

              {/* Belt gems */}
              {[145, 180, 210, 240, 275].map((x) => (
                <circle
                  key={x}
                  cx={x}
                  cy="394"
                  r="4"
                  fill="#8b0000"
                />
              ))}
            </g>

            {/* =====================================================
                10 RAVAN HEADS
            ====================================================== */}

            <g filter="url(#faceShadow)">
              {[
                { x: 58, y: 180, s: 0.72 },
                { x: 95, y: 148, s: 0.78 },
                { x: 135, y: 128, s: 0.84 },
                { x: 175, y: 115, s: 0.9 },
                { x: 210, y: 105, s: 1.08 },
                { x: 245, y: 115, s: 0.9 },
                { x: 285, y: 128, s: 0.84 },
                { x: 325, y: 148, s: 0.78 },
                { x: 362, y: 180, s: 0.72 },
                { x: 210, y: 158, s: 0.86 },
              ].map((head, index) => {
                const faceW = 27 * head.s;
                const faceH = 32 * head.s;

                return (
                  <g
                    key={index}
                    transform={`translate(${head.x} ${head.y})`}
                  >
                    {/* Face */}
                    <ellipse
                      cx="0"
                      cy="0"
                      rx={faceW}
                      ry={faceH}
                      fill="url(#ravanFace)"
                      stroke="url(#dussehraGold)"
                      strokeWidth={index === 4 ? 3 : 2}
                    />

                    {/* Ears */}
                    <ellipse
                      cx={-faceW - 2}
                      cy="2"
                      rx="5"
                      ry="9"
                      fill="#651412"
                    />

                    <ellipse
                      cx={faceW + 2}
                      cy="2"
                      rx="5"
                      ry="9"
                      fill="#651412"
                    />

                    {/* Crown */}
                    <path
                      d={`
                        M ${-faceW * 0.9} ${-faceH * 0.65}
                        L ${-faceW * 0.55} ${-faceH * 1.35}
                        L 0 ${-faceH * 0.92}
                        L ${faceW * 0.55} ${-faceH * 1.35}
                        L ${faceW * 0.9} ${-faceH * 0.65}
                        Z
                      `}
                      fill="url(#dussehraGold)"
                      stroke="#8a5500"
                      strokeWidth="1.5"
                    />

                    {/* Crown gem */}
                    <circle
                      cx="0"
                      cy={-faceH * 0.85}
                      r={2.5 * head.s}
                      fill="#ef233c"
                    />

                    {/* Eyebrows */}
                    <path
                      d={`
                        M ${-faceW * 0.65} ${-faceH * 0.12}
                        Q ${-faceW * 0.3} ${-faceH * 0.32}
                        ${-faceW * 0.05} ${-faceH * 0.12}
                      `}
                      fill="none"
                      stroke="#120204"
                      strokeWidth={3 * head.s}
                    />

                    <path
                      d={`
                        M ${faceW * 0.05} ${-faceH * 0.12}
                        Q ${faceW * 0.3} ${-faceH * 0.32}
                        ${faceW * 0.65} ${-faceH * 0.12}
                      `}
                      fill="none"
                      stroke="#120204"
                      strokeWidth={3 * head.s}
                    />

                    {/* Eyes */}
                    <ellipse
                      cx={-faceW * 0.32}
                      cy={-faceH * 0.02}
                      rx={4 * head.s}
                      ry={2.5 * head.s}
                      fill="#ffd166"
                    />

                    <ellipse
                      cx={faceW * 0.32}
                      cy={-faceH * 0.02}
                      rx={4 * head.s}
                      ry={2.5 * head.s}
                      fill="#ffd166"
                    />

                    <circle
                      cx={-faceW * 0.32}
                      cy={-faceH * 0.02}
                      r={1.5 * head.s}
                      fill="#ff1e00"
                    />

                    <circle
                      cx={faceW * 0.32}
                      cy={-faceH * 0.02}
                      r={1.5 * head.s}
                      fill="#ff1e00"
                    />

                    {/* Nose */}
                    <path
                      d={`
                        M 0 ${-faceH * 0.05}
                        L ${-faceW * 0.12} ${faceH * 0.28}
                        L ${faceW * 0.12} ${faceH * 0.28}
                      `}
                      fill="#3a0909"
                    />

                    {/* Moustache */}
                    <path
                      d={`
                        M 0 ${faceH * 0.23}
                        Q ${-faceW * 0.35} ${faceH * 0.12}
                        ${-faceW * 0.55} ${faceH * 0.3}
                        Q ${-faceW * 0.25} ${faceH * 0.42}
                        0 ${faceH * 0.27}

                        M 0 ${faceH * 0.27}
                        Q ${faceW * 0.25} ${faceH * 0.42}
                        ${faceW * 0.55} ${faceH * 0.3}
                        Q ${faceW * 0.35} ${faceH * 0.12}
                        0 ${faceH * 0.23}
                      `}
                      fill="#120204"
                    />

                    {/* Angry mouth */}
                    <path
                      d={`
                        M ${-faceW * 0.32} ${faceH * 0.5}
                        Q 0 ${faceH * 0.65}
                        ${faceW * 0.32} ${faceH * 0.5}
                      `}
                      fill="none"
                      stroke="#160204"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
            </g>

            {/* =====================================================
                FLAMES AT RAVAN'S FEET
            ====================================================== */}

            <g>
              {/* Main flames */}
              <path
                d="
                  M80 415
                  C72 390 95 382 91 350
                  C115 370 105 395 125 405
                  C119 380 140 368 145 340
                  C165 370 150 400 172 410
                  C178 380 195 370 205 340
                  C220 370 205 397 225 410
                  C240 385 245 360 260 350
                  C270 380 255 400 280 407
                  C295 385 310 375 320 350
                  C335 382 320 405 340 415
                  Z
                "
                fill="url(#flameGradient)"
                opacity="0.95"
              />

              {/* Bright inner flame */}
              <path
                d="
                  M125 415
                  C120 395 140 388 145 370
                  C160 392 148 405 165 414
                  C180 390 192 382 205 365
                  C214 393 202 405 220 415
                  C235 392 245 385 255 372
                  C262 398 250 407 270 415
                  Z
                "
                fill="#fff2a1"
                opacity="0.9"
              />
            </g>

            {/* =====================================================
                FLYING EMBERS
            ====================================================== */}

            <g>
              <circle
                cx="105"
                cy="330"
                r="3"
                fill="#ffd166"
                className="animate-ping"
              />

              <circle
                cx="325"
                cy="320"
                r="3"
                fill="#ff7b00"
                className="animate-pulse"
              />

              <circle
                cx="75"
                cy="270"
                r="2"
                fill="#ffd700"
              />

              <circle
                cx="345"
                cy="255"
                r="2"
                fill="#ff4500"
              />

              <circle
                cx="150"
                cy="235"
                r="2.5"
                fill="#ffb000"
                className="animate-ping"
              />

              <circle
                cx="275"
                cy="230"
                r="2.5"
                fill="#ffd700"
                className="animate-pulse"
              />
            </g>

            {/* =====================================================
                GROUND
            ====================================================== */}

            <ellipse
              cx="210"
              cy="416"
              rx="145"
              ry="10"
              fill="#ff5a00"
              opacity="0.35"
              filter="url(#fireBlur)"
            />

            {/* =====================================================
                HINDI TEXT
            ====================================================== */}

            <text
              x="210"
              y="428"
              textAnchor="middle"
              fill="url(#dussehraGold)"
              fontSize="13"
              fontWeight="900"
              fontFamily="'Tiro Devanagari Hindi', 'Nirmala UI', serif"
              filter="url(#goldGlow)"
            >
              अधर्म पर धर्म की विजय • विजयदशमी
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
