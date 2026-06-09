'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import FestivalAnimationEngine from '@/components/festival/FestivalAnimationEngine';
import FestivalHeroEngine from '@/components/festival/FestivalHeroEngine';
import { X, Sparkles, ShieldCheck, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BroadcastPreviewPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTopBanner, setShowTopBanner] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);

  useEffect(() => { loadBroadcast(); }, []);

  const loadBroadcast = async () => {
    try {
      const { data } = await supabase.from('broadcasts').select('*').eq('preview_mode', true).order('created_at', { ascending: false }).limit(1).single();
      setBroadcast(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-black tracking-widest animate-pulse">SAANIFY LAB V2...</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview Found</div>;

  const isHoli = broadcast.festival_key === 'HOLI';
  
  // 🎨 MASTER THEME COLORS
  const themeColor = broadcast.theme_color || (isHoli ? '#ff0080' : '#fbbf24');
  const themeGradient = isHoli 
    ? 'linear-gradient(135deg, #ff0080 0%, #7c3aed 100%)'
    : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)';

  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* 1. ANIMATION ENGINE */}
      <FestivalAnimationEngine animationTheme={broadcast.animation_theme} />

      {/* 2. TOP BRANDED BANNER (Visible after Celebrate) */}
      {showTopBanner && (
        <div className="fixed top-0 left-0 w-full z-[100] py-4 px-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-top duration-700 border-b border-white/20"
          style={{ background: themeGradient }}>
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-4">
             <PartyPopper className="w-7 h-7 text-white animate-bounce" />
             <p className="text-white font-black tracking-wider text-base md:text-xl uppercase italic drop-shadow-lg">
                SAANIFY PARIVAR: {msgParts[0]}
             </p>
          </div>
        </div>
      )}

      {/* 3. THE PREMIUM CARD */}
      <div className={`relative w-full max-w-md transition-all duration-1000 ease-out ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        
        {/* Outer Glow Ambiance */}
        <div className="absolute -inset-2 rounded-[3rem] opacity-20 blur-2xl animate-pulse"
             style={{ background: themeGradient }} />

        <div className="relative bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          
          {/* --- HERO SECTION --- */}
          <div className="relative w-full h-80 overflow-hidden flex items-center justify-center">
              {broadcast.image_url ? (
                <img 
                  src={broadcast.image_url} 
                  className="w-full h-full object-cover object-top transform hover:scale-110 transition-transform duration-10000" 
                  alt="Festival" 
                />
              ) : (
                /* 🚀 ANIMATED HERO ENGINE (No more static) */
                <div className="animate-hero-breathe flex items-center justify-center scale-150">
                   <FestivalHeroEngine heroVisual={broadcast.hero_visual} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              
              {/* BRAND TEXT IN THEME COLOR */}
              <div className="absolute top-8 w-full text-center">
                  <span className="themed-text uppercase tracking-[12px] text-xs font-black italic drop-shadow-md">
                      SAANIFY PARIVAR
                  </span>
              </div>
          </div>

          {/* --- CONTENT SECTION --- */}
          <div className="p-8 text-center -mt-16 relative z-10 flex flex-col items-center">
            
            {/* Branded Badge Icon */}
            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-white to-slate-200 shadow-2xl flex items-center justify-center border-4 border-slate-950 mb-6 rotate-3">
               <ShieldCheck className="w-10 h-10 text-blue-900" strokeWidth={3} />
            </div>

            <div className="space-y-4 w-full">
                {/* 🏆 THEMED GRADIENT TITLE */}
                <div className="px-2">
                    <h1 className="themed-text text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic mb-2">
                        {titleParts[0]}
                    </h1>
                    {titleParts[1] && (
                        <h2 className="text-sm font-bold text-white/40 tracking-[6px] uppercase px-4">
                            {titleParts[1]}
                        </h2>
                    )}
                </div>
                
                <p className="text-slate-300 text-base md:text-lg font-bold leading-relaxed px-6 opacity-90">
                    {msgParts[0]}
                </p>
            </div>

            {/* BUTTON IN THEME COLOR */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-16 mt-8 rounded-[2rem] text-2xl font-black text-white shadow-2xl border-t border-white/20 transition-all hover:scale-105 active:scale-95"
              style={{ background: themeGradient }}
            >
              CELEBRATE NOW 🚀
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-6 right-6 p-1 text-white/30 hover:text-white transition-colors">
            <X className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* --- MASTER THEMED STYLES --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');
        
        .themed-text {
          background: ${themeGradient};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @keyframes hero-breathe {
          0%, 100% { transform: scale(1.4); filter: drop-shadow(0 0 20px rgba(255,255,255,0.2)); }
          50% { transform: scale(1.6); filter: drop-shadow(0 0 50px ${themeColor}); }
        }

        .animate-hero-breathe {
          animation: hero-breathe 4s infinite ease-in-out;
        }

        /* Responsive spacing for Hindi characters */
        h1 { padding-bottom: 5px; }
      `}</style>
    </div>
  );
}
