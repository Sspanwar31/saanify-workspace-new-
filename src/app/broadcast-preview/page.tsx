'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import FestivalAnimationEngine from '@/components/festival/FestivalAnimationEngine';
import { X, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BroadcastPreviewPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBroadcast(); }, []);

  const loadBroadcast = async () => {
    try {
      const { data } = await supabase.from('broadcasts').select('*').eq('preview_mode', true).order('created_at', { ascending: false }).limit(1).single();
      setBroadcast(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-bold tracking-widest">LOADING LAB V2...</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview Found</div>;

  const isHoli = broadcast.festival_key === 'HOLI';
  const isDiwali = broadcast.festival_key === 'DIWALI';
  const themeColor = broadcast.theme_color || (isHoli ? '#ff0080' : '#F59E0B');

  // ━━━ Bilingual Logic ━━━
  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 sm:p-10 bg-[#020617]">
      
      {/* 🚀 1. MASTER BACKGROUND ANIMATION */}
      <FestivalAnimationEngine animationTheme={broadcast.animation_theme} />

      {/* 🚀 2. THE MASTER PREMIUM CARD */}
      <div className="relative w-full max-w-[460px] bg-[#1a1a2e]/60 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] shadow-[0_50px_150px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-700">
        
        {/* HERO SECTION (Auto-Switch: Image vs CSS Template) */}
        <div className="relative w-full h-[320px] overflow-hidden flex items-center justify-center">
          {broadcast.image_url ? (
            <>
              <img src={broadcast.image_url} className="w-full h-full object-cover transform hover:scale-105 transition-all duration-[5s]" alt="Festival" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/20 to-transparent" />
            </>
          ) : (
            /* 🎯 NO IMAGE? SHOW CSS TEMPLATE HERO */
            <div className={`absolute inset-0 flex items-center justify-center ${isDiwali ? 'bg-[radial-gradient(circle_at_top,#1e2d7a_0%,#090d1f_100%)]' : 'bg-gradient-to-br from-pink-600 to-indigo-900'}`}>
                {isDiwali ? (
                    <div className="relative scale-150 flex flex-col items-center">
                        <div className="diya-flame w-10 h-14 bg-gradient-to-t from-orange-500 via-yellow-400 to-white rounded-full blur-[1px]" style={{boxShadow: '0 0 40px orange'}} />
                        <div className="mt-[-10px] w-20 h-8 rounded-b-full bg-gradient-to-b from-amber-700 to-amber-950" />
                    </div>
                ) : (
                    <div className="bg-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl border border-white/20 rotate-12">
                        <span className="text-7xl">🎨</span>
                    </div>
                )}
            </div>
          )}
          <div className="absolute top-10 left-10 text-white/30 uppercase tracking-[8px] text-[10px] font-black italic">SAANIFY PREMIUM</div>
        </div>

        {/* CONTENT AREA */}
        <div className="p-10 pt-0 text-center -mt-14 relative z-10 w-full space-y-6">
          
          {/* Branded Globe Icon (Lowered and Blended) */}
          <div className="w-20 h-20 mx-auto bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/20">
             <Globe className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-4">
            {/* ━━ Multi-Language Title ━━ */}
            <div className="flex flex-col gap-1">
                <h1 className="premium-text-effect text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none italic">
                    {titleParts[0]}
                </h1>
                {titleParts[1] && <h2 className="text-white/60 text-lg font-bold tracking-widest">{titleParts[1]}</h2>}
            </div>
            
            {/* ━━ Multi-Language Message ━━ */}
            <div className="space-y-2 px-4">
                <p className="text-slate-200 text-sm sm:text-base font-bold leading-relaxed">
                    {msgParts[0]}
                </p>
                {msgParts[1] && <p className="text-white/40 text-xs italic font-medium">{msgParts[1]}</p>}
            </div>
          </div>

          {/* DYNAMIC BUTTON */}
          <Button 
            className="w-full h-16 rounded-[2rem] text-xl font-black text-white shadow-2xl transition-all hover:scale-[1.03] active:scale-95 border border-white/10"
            style={{ background: `linear-gradient(135deg, ${themeColor}, #4f46e5)` }}
          >
            {broadcast.resolved_cta || broadcast.cta_text || 'CELEBRATE NOW 🚀'}
          </Button>

          <p className="text-[10px] uppercase tracking-[5px] text-white/10 font-black">
             Universal Branded Engine V2
          </p>
        </div>

        <button className="absolute top-6 right-8 text-white/20 hover:text-white transition-colors">
          <X className="w-8 h-8" />
        </button>
      </div>

      <style jsx>{`
        .premium-text-effect {
          background: ${isHoli 
            ? 'linear-gradient(90deg, #ff0080, #ffcc00, #00e5ff, #00ff88, #ff0080)' 
            : 'linear-gradient(180deg, #fff7d6 0%, #ffd54f 40%, #ff9800 100%)'};
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textFlow 4s linear infinite;
        }
        @keyframes textFlow { to { background-position: 200% center; } }
        @keyframes diya-flame { 0%,100%{transform:scale(1) rotate(-2deg);} 50%{transform:scale(1.15) rotate(2deg);} }
        .diya-flame { animation: diya-flame 1s infinite ease-in-out; }
      `}</style>
    </div>
  );
}
