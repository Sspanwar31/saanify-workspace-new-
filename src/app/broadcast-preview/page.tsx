'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AnimationFactory from '@/components/festival/v2/AnimationFactory';
import HeroFactory from '@/components/festival/v2/HeroFactory';
import { X, Sparkles, ShieldCheck, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BroadcastPreviewPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTopBanner, setShowTopBanner] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);

  useEffect(() => { loadBroadcast(); }, []);

  const loadBroadcast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('broadcasts').select('*').eq('preview_mode', true).order('created_at', { ascending: false }).limit(1).single();
      if (error) throw error;
      setBroadcast(data);
    } catch (err) { toast.error("No preview found."); } 
    finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen bg-[#030712] flex items-center justify-center text-white font-bold animate-pulse tracking-[15px] text-xs md:text-sm">SAANIFY LAB V2</div>;
  if (!broadcast) return <div className="h-screen bg-[#030712] flex items-center justify-center text-white">No Active Preview</div>;

  // 🚀 1. UNIVERSAL THEME COLOR LOGIC
  const getFestivalTheme = () => {
    const key = broadcast.festival_key;
    const dbColor = broadcast.theme_config?.primary_color || broadcast.theme_color;
    
    if (dbColor && dbColor !== 'DEFAULT' && dbColor !== 'default') return dbColor;

    const colorMap: any = {
      HOLI: '#ff0080',
      CHRISTMAS: '#ef4444',
      EID_UL_FITR: '#10b981',
      EID_AL_ADHA: '#10b981',
      REPUBLIC_DAY: '#FF9933',
      INDEPENDENCE_DAY: '#16a34a',
      DIWALI: '#fbbf24',
      NEW_YEAR: '#8b5cf6'
    };
    return colorMap[key] || '#fbbf24';
  };

  const themeColor = getFestivalTheme();
  
  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];
  const ctaText = broadcast.resolved_cta || 'CELEBRATE NOW';

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#030712] font-sans selection:bg-white/20">
      
      {/* BACKGROUND ANIMATION */}
      <AnimationFactory theme={broadcast.hero_config?.animation || broadcast.animation_theme} />

      {/* 🚀 2. MODERN TOP BANNER (Dynamic Theme + Left Aligned) */}
      {showTopBanner && (
        <div 
          className="fixed top-0 left-0 w-full z-[100] h-16 border-b border-white/10 flex items-center justify-start px-4 gap-3 animate-in slide-in-from-top duration-500 backdrop-blur-md"
          style={{ 
            // ✨ Dynamic Background: Black + Theme Color Glow Animation
            background: `linear-gradient(90deg, rgba(2,6,23,0.9) 0%, ${themeColor}15 50%, rgba(2,6,23,0.9) 100%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer-bg 3s linear infinite'
          }}>
            
            {/* Indicator Dot */}
            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-lg" 
                 style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }} />
            
            {/* ✨ Text: Left Aligned, No Truncate on container, Allow wrapping if needed but prioritize single line */}
            <p className="text-white font-bold text-xs md:text-sm uppercase tracking-[0.2em] text-left leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
               style={{ textShadow: `0 0 10px ${themeColor}44` }}>
              SAANIFY PARIVAR: {msgParts[0]}
            </p>
        </div>
      )}

      {/* 3. THE COMPACT CARD (2027 Notification Style) */}
      {/* Changed: max-w-lg -> max-w-sm (Small), aspect-square -> aspect-[3/4] (Portrait) */}
      <div className={`relative w-full max-w-sm transition-all duration-700 ${isCardVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}>
        
        {/* 🔥 Outer Glow (Subtle) */}
        <div className="absolute -inset-1 rounded-[2.5rem] opacity-20 blur-2xl animate-pulse transition-all duration-1000"
             style={{ background: themeColor }} />

        <div className="relative bg-[#0f172a]/70 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
          
          {/* HERO SECTION (Reduced Height) */}
          <div className="relative w-full aspect-[3/4] overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
              
              {/* ✨ Divine Aura */}
              <div className="absolute inset-0 opacity-30 mix-blend-screen" 
                   style={{ background: `radial-gradient(circle at 50% 40%, ${themeColor} 0%, transparent 60%)`, filter: 'blur(30px)' }} 
              />

              {broadcast.image_url ? (
                <div className="w-full h-full relative group">
                  <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain p-6 relative z-10 drop-shadow-xl" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-20" />
                </div>
              ) : (
                <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
              )}
          </div>

          {/* CONTENT SECTION (Compact) */}
          <div className="p-6 pb-8 text-center relative z-30 flex flex-col items-center">
            
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-inner">
               <PartyPopper className="w-5 h-5 text-white/90" />
            </div>

            <div className="space-y-2 w-full">
                {/* HEADLINE (Smaller but Bold) */}
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none italic text-white drop-shadow-md">
                    {titleParts[0]}
                </h1>
                
                <p className="text-slate-400 text-xs md:text-sm font-medium leading-snug px-2">
                    {msgParts[0]}
                </p>
            </div>

            {/* BUTTON (Pill Shape) */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-12 mt-6 rounded-full text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.05] active:scale-[0.95] border border-white/10 overflow-hidden relative group bg-white/5"
            >
              <span className="relative z-10 flex items-center gap-2">
                {ctaText} <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              </span>
              
              {/* Hover Gradient Shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ background: `linear-gradient(90deg, transparent, ${themeColor}40, transparent)` }} 
              />
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-3 right-3 text-white/20 hover:text-white hover:bg-white/10 transition-all p-1 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;900&display=swap');
        body, html { font-family: 'Poppins', sans-serif !important; }
        
        .hero-anim { animation: hero-float 6s ease-in-out infinite; }
        @keyframes hero-float { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.02) translateY(-5px); } }
        
        /* ✨ Banner Background Animation */
        @keyframes shimmer-bg {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
