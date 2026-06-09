'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import FestivalAnimationEngine from '@/components/festival/FestivalAnimationEngine';
import { X, Sparkles, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-white bg-[#050a1f]">Loading Preview...</div>;
  if (!broadcast) return <div className="h-screen flex items-center justify-center text-white bg-[#050a1f]">No Preview Found</div>;

  // 🚀 Logic for Dynamic Styles (Holi vs Diwali)
  const isHoli = broadcast.festival_key === 'HOLI';
  const themeColor = broadcast.theme_color || (isHoli ? '#EC4899' : '#F59E0B');

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-[#050a1f]">
      
      {/* 1. MASTER ANIMATION ENGINE (Particles) */}
      <FestivalAnimationEngine animationTheme={broadcast.animation_theme} />

      {/* 2. DYNAMIC BACKGROUND GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 pointer-events-none"
           style={{ backgroundColor: themeColor }} />

      {/* 3. PREMIUM RESPONSIVE CARD (Image 3 Style) */}
      <div className="relative w-full max-w-[450px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] shadow-[0_50px_150px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-500">
        
        {/* HERO IMAGE SECTION */}
        <div className="relative w-full h-[300px] bg-slate-800 group">
          {broadcast.image_url ? (
            <img 
              src={broadcast.image_url} 
              className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110" 
              alt="Hero" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
               <span className="text-6xl">{isHoli ? '🎨' : '🪔'}</span>
            </div>
          )}
          {/* Bottom Blending Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050a1f]/90 via-transparent to-transparent" />
          
          <div className="absolute top-8 left-8 text-white/40 uppercase tracking-[6px] text-[10px] font-black">
             SAANIFY PREMIUM
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="p-10 pt-0 text-center -mt-20 relative z-10 w-full flex flex-col items-center space-y-6">
          
          {/* Floating Branded Icon */}
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] shadow-2xl flex items-center justify-center -rotate-6 transform hover:rotate-0 transition-all duration-700 border-4 border-white/10">
             <Globe className="w-12 h-12 text-white" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-2xl italic"
                style={{ color: isHoli ? undefined : themeColor }}>
              {broadcast.resolved_title || broadcast.title}
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed px-4 opacity-90">
              {broadcast.resolved_message || broadcast.message}
            </p>
          </div>

          {/* ACTION BUTTON */}
          <Button 
            className="w-full h-16 rounded-3xl text-xl font-black text-white shadow-2xl transition-all hover:scale-[1.03] active:scale-95"
            style={{ background: `linear-gradient(90deg, ${themeColor}, #6366f1)` }}
          >
            {broadcast.resolved_cta || broadcast.cta_text || 'CELEBRATE NOW 🚀'}
          </Button>

          <p className="text-[9px] uppercase tracking-[4px] text-white/20 font-black pt-4">
             Professional Greeting Engine
          </p>
        </div>

        {/* Close Button Top Right */}
        <button className="absolute top-6 right-8 text-white/30 hover:text-white transition-colors">
          <X className="w-7 h-7" />
        </button>
      </div>

      {/* 🚀 CSS FOR TEXT ANIMATION (Only for Holi) */}
      {isHoli && (
        <style jsx>{`
          h1 {
            background: linear-gradient(90deg, #ff0080, #ffcc00, #00e5ff, #00ff88, #ff0080);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: textFlow 3s linear infinite;
          }
          @keyframes textFlow { to { background-position: 200% center; } }
        `}</style>
      )}
    </div>
  );
}
