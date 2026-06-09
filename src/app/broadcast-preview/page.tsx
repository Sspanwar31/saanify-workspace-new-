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

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-bold tracking-widest animate-pulse">LOADING LAB V2...</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview Found</div>;

  const isHoli = broadcast.festival_key === 'HOLI';
  // Holi ke liye vibrant colors, nahi toh Gold/Amber theme
  const themeColor = broadcast.theme_color || (isHoli ? '#db2777' : '#fbbf24');
  const themeGradient = isHoli 
    ? 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)'
    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';

  // Text splitting logic
  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false); // Card smooth fade out hoga animation ke saath
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins selection:bg-pink-500/30">
      
      {/* 1. BACKGROUND AMBIANCE & ANIMATION */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]" />
      <FestivalAnimationEngine animationTheme={broadcast.animation_theme} />

      {/* 2. TOP SUCCESS BANNER */}
      {showTopBanner && (
        <div className="fixed top-0 left-0 w-full z-[50] py-3 px-6 shadow-2xl animate-in slide-in-from-top duration-500 backdrop-blur-md border-b border-white/10"
          style={{ background: isHoli ? 'rgba(219, 39, 119, 0.9)' : 'rgba(245, 158, 11, 0.9)' }}>
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
             <PartyPopper className="w-6 h-6 text-white animate-bounce" />
             <p className="text-white font-bold tracking-wide text-sm md:text-base uppercase text-center">
                Celebration Mode Activated: {msgParts[0] || 'Enjoy the Festival!'}
             </p>
          </div>
        </div>
      )}

      {/* 3. THE MASTER CARD (Redesigned) */}
      <div className={`relative w-full max-w-md transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isCardVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}>
        
        {/* Decorative Glow Behind Card */}
        <div className="absolute -inset-1 rounded-[2.5rem] opacity-30 blur-xl transition duration-1000 group-hover:duration-200"
             style={{ background: themeGradient }} />

        {/* Main Card Container */}
        <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
          
          {/* --- HERO IMAGE SECTION --- */}
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-900">
              {broadcast.image_url ? (
                <img 
                  src={broadcast.image_url} 
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" 
                  alt="Festival" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                   <FestivalHeroEngine heroVisual={broadcast.hero_visual} />
                </div>
              )}
              
              {/* Gradient Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
              
              {/* Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
                  <span className="text-[10px] md:text-xs font-extrabold tracking-[0.2em] text-white/90 uppercase">
                      SAANIFY PARIVAR
                  </span>
              </div>
          </div>

          {/* --- CONTENT SECTION --- */}
          <div className="p-6 md:p-8 text-center relative z-10 flex flex-col items-center -mt-12">
            
            {/* Icon Circle */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-300 shadow-xl flex items-center justify-center border-4 border-[#0f172a] mb-4 relative z-20">
               <ShieldCheck className="w-10 h-10 text-slate-900" strokeWidth={2.5} />
            </div>

            <div className="space-y-3 w-full">
                {/* Main Title - Better Typography for Hindi/English */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-1 premium-text-shadow">
                        {titleParts[0]}
                    </h1>
                    {/* Subtitle / Second Line */}
                    {titleParts[1] && (
                        <h2 className="text-sm md:text-base font-medium text-white/60 tracking-wide uppercase">
                            {titleParts[1]}
                        </h2>
                    )}
                </div>
                
                {/* Message Body - Line Height improved for Hindi */}
                <div className="py-2">
                    <p className="text-slate-300 text-base md:text-lg font-normal leading-relaxed">
                        {msgParts[0]}
                    </p>
                    {msgParts[1] && <p className="text-slate-400 text-sm mt-1 italic">{msgParts[1]}</p>}
                </div>
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-14 mt-4 rounded-2xl text-lg font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 border-b-4 border-white/20"
              style={{ background: themeGradient }}
            >
              CELEBRATE NOW <Sparkles className="w-5 h-5 ml-2 animate-pulse" />
            </Button>

          </div>
          
          {/* Close Button */}
          <button 
            onClick={() => setIsCardVisible(false)} 
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

        </div>
      </div>

      {/* --- GLOBAL STYLES & FONTS --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        
        body, html {
          font-family: 'Poppins', sans-serif;
          /* Hindi ke liye line height zaroori hai */
          line-height: 1.5; 
        }

        /* Text Shadow for better readability against busy backgrounds */
        .premium-text-shadow {
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
