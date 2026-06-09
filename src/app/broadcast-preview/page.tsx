'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import FestivalAnimationEngine from '@/components/festival/FestivalAnimationEngine';
import FestivalHeroEngine from '@/components/festival/FestivalHeroEngine'; // ✅ Added Hero Engine
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BroadcastPreviewPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTopBanner, setShowTopBanner] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true); // ✅ Visibility State

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
  const themeColor = broadcast.theme_color || (isHoli ? '#ff0080' : '#F59E0B');

  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false); // ✅ Card hat jayega
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 sm:p-10 bg-[#020617] font-poppins">
      
      {/* 🚀 1. FULL SCREEN ANIMATION (Hamesha chalta rahega) */}
      <FestivalAnimationEngine animationTheme={broadcast.animation_theme} />

      {/* 🚀 2. TOP BANNER (Celebrate click ke baad dikhega) */}
      {showTopBanner && (
        <div className={`fixed top-0 left-0 w-full z-[10000] py-4 px-6 shadow-2xl animate-in slide-in-from-top duration-700 
          ${isHoli ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600' : 'bg-gradient-to-r from-amber-600 to-yellow-500'} text-white`}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-center">
             <Sparkles className="w-5 h-5 animate-bounce shrink-0" />
             <p className="text-base md:text-xl font-black italic tracking-wide drop-shadow-md">
                SAANIFY PARIWAR: {msgParts[0]}
             </p>
          </div>
        </div>
      )}

      {/* 🚀 3. THE MASTER PREMIUM CARD (Visibility Check Added) */}
      {isCardVisible && (
        <div className="relative w-full max-w-[460px] bg-[#1a1a2e]/60 backdrop-blur-3xl border border-white/10 rounded-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-700">
          
          {/* HERO SECTION (Auto-Switch logic) */}
          <div className="relative w-full h-[400px] overflow-hidden flex items-center justify-center bg-slate-900/50">
              {broadcast.image_url ? (
                <img 
                  src={broadcast.image_url} 
                  className="w-full h-full object-cover object-top transform hover:scale-105 transition-all duration-[5s]" 
                  alt="Festival" 
                />
              ) : (
                /* 🎯 NO IMAGE? SHOW FESTIVAL HERO ENGINE */
                <div className="scale-150 transform">
                   <FestivalHeroEngine heroVisual={broadcast.hero_visual} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/10 to-transparent" />
              
              <div className="absolute top-10 w-full text-center px-4">
                  <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] uppercase tracking-[12px] text-xs font-black italic opacity-90">
                      S A A N I F Y
                  </span>
              </div>
          </div>

          {/* CONTENT AREA */}
          <div className="p-10 pt-0 text-center -mt-20 relative z-10 w-full space-y-8">
            
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] shadow-2xl flex items-center justify-center border-4 border-white/20 rotate-3">
               <ShieldCheck className="w-12 h-12 text-white" />
            </div>

            <div className="space-y-4 px-2">
                <div className="flex flex-col gap-2">
                    <h1 className="premium-text-effect text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none italic py-2">
                        {titleParts[0]}
                    </h1>
                    {titleParts[1] && <h2 className="text-white/40 text-sm font-bold tracking-[6px] uppercase">{titleParts[1]}</h2>}
                </div>
                
                <div className="space-y-3 px-2">
                    <p className="text-slate-200 text-lg font-bold leading-tight drop-shadow-sm">
                        {msgParts[0]}
                    </p>
                </div>
            </div>

            <Button 
              onClick={handleCelebrate}
              className="w-full h-18 rounded-[2.5rem] text-2xl font-black text-white shadow-2xl transition-all hover:scale-[1.05] active:scale-95 border-t border-white/20"
              style={{ background: `linear-gradient(135deg, ${themeColor}, #4f46e5)` }}
            >
              CELEBRATE NOW 🚀
            </Button>
          </div>

          <button onClick={() => setIsCardVisible(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* 🚀 GOOGLE FONTS IMPORT */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800;900&display=swap');
        
        body, html {
          font-family: 'Poppins', sans-serif !important;
        }

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
