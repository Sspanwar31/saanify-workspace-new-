'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
      <div className="h-screen flex items-center justify-center">
        Loading Preview...
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="h-screen flex items-center justify-center">
        No Preview Broadcast Found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-10">

      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-10">

        <div className="mb-8">
          <h1 className="text-4xl font-black">
            Broadcast Preview
          </h1>

          <p className="text-slate-400 mt-2">
            Testing Mode
          </p>
        </div>

        <div className="space-y-4">

          <div>
            <span className="text-slate-500">
              Festival:
            </span>

            <div className="text-xl font-bold">
              {broadcast.festival_key}
            </div>
          </div>

          <div>
            <span className="text-slate-500">
              Title:
            </span>

            <div className="text-3xl font-black">
              {broadcast.resolved_title || broadcast.title}
            </div>
          </div>

          <div>
            <span className="text-slate-500">
              Message:
            </span>

            <div className="text-lg">
              {broadcast.resolved_message || broadcast.message}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">

            <div className="p-4 rounded-xl bg-slate-800">
              <div className="text-slate-400 text-sm">
                Hero Visual
              </div>

              <div className="font-bold">
                {broadcast.hero_visual}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800">
              <div className="text-slate-400 text-sm">
                Animation Theme
              </div>

              <div className="font-bold">
                {broadcast.animation_theme}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800">
              <div className="text-slate-400 text-sm">
                Theme Color
              </div>

              <div className="font-bold">
                {broadcast.theme_color}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800">
              <div className="text-slate-400 text-sm">
                Layout
              </div>

              <div className="font-bold">
                {broadcast.layout_template}
              </div>
            </div>

          </div>

          <div className="mt-8 flex gap-3 flex-wrap">

            {broadcast.dashboard_overlay && (
              <span className="px-4 py-2 rounded-full bg-green-600">
                Dashboard Overlay ON
              </span>
            )}

            {broadcast.full_screen_animation && (
              <span className="px-4 py-2 rounded-full bg-blue-600">
                Full Screen Animation ON
              </span>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
