'use client';

import React, { useRef, useEffect } from 'react';
import HoliColorBlast from '../HoliColorBlast';

interface HoliCinematicIntroProps {
  onComplete: () => void;
  videoUrl?: string;
}

export default function HoliCinematicIntro({
  onComplete,
  videoUrl = '/videos/holi-intro.mp4',
}: HoliCinematicIntroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen flex items-center justify-center overflow-hidden bg-black select-none">
      {/* 🎬 1. VIDEO INTRO */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        playsInline
        onEnded={onComplete}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 🎆 2. DYNAMIC COLOR BLAST & GULAL */}
      <HoliColorBlast phase="GULAL_RAIN" />
    </div>
  );
}
