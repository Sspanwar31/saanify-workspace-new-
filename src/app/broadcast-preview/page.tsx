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

      {/* 🚀 2. TOP BANNER (Solid Theme Color + Centered Message) */}
      {showTopBanner && (
        <div 
          className="fixed top-0 left-0 w-full z-[100] h-16 flex items-center justify-center px-4 gap-3 animate-in slide-in-from-top duration-500 shadow-2xl"
          style={{ 
            // ✨ Solid Background Color (Gold for Diwali, Pink for Holi)
            backgroundColor: themeColor
          }}>
            
            {/* White Dot Indicator */}
            <div className="w-2 h-2 rounded-full bg-white/80 shrink-0 shadow-lg" />
            
            {/* ✨ Centered Text (White/Silver) */}
            <p className="text-white/95 font-bold text-sm md:text-base uppercase tracking-[0.2em] text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[90vw]"
               style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {msgParts[0]}
            </p>
        </div>
      )}

      {/* 3. THE ULTRA COMPACT CARD (2027 Notification Style) */}
      <div className={`relative w-full max-w-xs transition-all duration-700 ${isCardVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}>
        
        {/* 🔥 Subtle Glow */}
        <div className="absolute -inset-1 rounded-[2rem] opacity-30 blur-2xl transition-all duration-1000"
             style={{ background: themeColor }} />

        <div className="relative bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
          
          {/* HERO SECTION (Fixed Height) */}
          <div className="relative w-full h-48 overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
              
              {/* ✨ Divine Aura (Sharper) */}
              <div className="absolute inset-0 opacity-40 mix-blend-screen" 
                   style={{ background: `radial-gradient(circle at 50% 50%, ${themeColor} 0%, transparent 70%)`, filter: 'blur(20px)' }} 
              />

              {broadcast.image_url ? (
                <div className="w-full h-full relative group">
                  <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain p-6 relative z-10 drop-shadow-2xl" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-20" />
                </div>
              ) : (
                <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
              )}
          </div>

          {/* CONTENT SECTION (Compact & Clean) */}
          <div className="p-5 pb-6 text-center relative z-30 flex flex-col items-center">
            
            {/* Icon (Small) */}
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 shadow-inner">
               <PartyPopper className="w-4 h-4 text-white/90" />
            </div>

            <div className="space-y-2 w-full">
                {/* HEADLINE (Big & Bold) */}
                <h1 className="text-3xl font-black uppercase tracking-tight leading-none italic text-white drop-shadow-md">
                    {titleParts[0]}
                </h1>
                
                <p className="text-slate-400 text-xs font-medium leading-tight px-1">
                    {msgParts[0]}
                </p>
            </div>

            {/* BUTTON (Solid Gradient) */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-11 mt-5 rounded-full text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.95] border border-white/10 overflow-hidden relative group"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}aa)` }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {ctaText} <Sparkles className="w-3.5 h-3.5 text-white" />
              </span>
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-3 right-3 text-white/30 hover:text-white hover:bg-white/10 transition-all p-1 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;900&display=swap');
        body, html { font-family: 'Poppins', sans-serif !important; }
        
        .hero-anim { animation: hero-float 6s ease-in-out infinite; }
        @keyframes hero-float { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.02) translateY(-5px); } }
      `}</style>
    </div>
  );
}
