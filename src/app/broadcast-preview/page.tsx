'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import FestivalAnimationEngine from '@/components/festival/FestivalAnimationEngine';
import FestivalHeroEngine from '@/components/festival/FestivalHeroEngine';

export default function BroadcastPreviewPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBroadcast();
  }, []);

  const loadBroadcast = async () => {
    try {
      const { data } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('preview_mode', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setBroadcast(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading Preview...
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        No Preview Broadcast Found
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{
        background:
          'linear-gradient(to bottom, #050816, #0f172a, #1e293b)',
      }}
    >
      {/* 2. Full Background Image Add Karo */}
      {broadcast.image_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url(${broadcast.image_url})`,
          }}
        />
      )}

      {/* 3. Gradient Overlay Add Karo */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* Animation */}
      <FestivalAnimationEngine
        animationTheme={broadcast.animation_theme}
      />

      {/* Dashboard Overlay */}
      {broadcast.dashboard_overlay && (
        <div className="fixed inset-0 bg-yellow-500/5 pointer-events-none z-10" />
      )}

      {/* Main Greeting */}
      <div className="relative z-20 text-center max-w-4xl px-8">

        {/* 1. Hero Section Replacement */}
        <div className="mb-10 flex justify-center">
          {broadcast.image_url ? (
            <img
              src={broadcast.image_url}
              alt="Festival Hero"
              className="w-[320px] md:w-[500px] rounded-3xl drop-shadow-[0_0_50px_rgba(255,255,255,0.25)]"
            />
          ) : (
            <FestivalHeroEngine
              heroVisual={broadcast.hero_visual}
            />
          )}
        </div>

        {/* Title */}
        <h1
          className="text-6xl md:text-7xl font-black mb-6"
          style={{
            color: broadcast.theme_color || '#F59E0B'
          }}
        >
          {broadcast.resolved_title || broadcast.title}
        </h1>

        {/* Message */}
        <p className="text-xl md:text-2xl text-slate-200 leading-relaxed max-w-3xl mx-auto mb-10">
          {broadcast.resolved_message || broadcast.message}
        </p>

        {/* CTA */}
        <button
          className="px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl transition hover:scale-105"
          style={{
            backgroundColor:
              broadcast.theme_color || '#F59E0B',
            color: '#000'
          }}
        >
          {broadcast.resolved_cta ||
            broadcast.cta_text ||
            'Celebrate'}
        </button>

      </div>

      {/* Fullscreen Greeting Mode */}
      {broadcast.full_screen_animation && (
        <div className="fixed inset-0 border-[12px] border-yellow-500 pointer-events-none z-30" />
      )}
    </div>
  );
}
