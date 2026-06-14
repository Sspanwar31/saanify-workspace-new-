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

      {/* 🚀 2. MODERN TOP BANNER (Fixed to Top Edge) */}
      {showTopBanner && (
        <div 
          className="fixed top-0 left-0 w-full z-[100] h-16 backdrop-blur-xl border-b border-white/5 bg-black/40 flex items-center justify-center animate-in slide-in-from-top duration-500">
            {/* Theme Color Glow Line at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent opacity-50 animate-pulse" 
                 style={{ backgroundImage: `linear-gradient(90deg, transparent, ${themeColor}, transparent)` }} />
            
            <div className="flex items-center gap-3 px-4 w-full max-w-4xl">
                <div className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse shadow-[0_0_10px_#fbbf24]" 
                     style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }} />
                
                <p className="text-white font-bold text-xs md:text-sm uppercase tracking-[0.25em] text-center truncate w-full"
                   style={{ textShadow: `0 0 10px ${themeColor}66` }}>
                  SAANIFY PARIVAR: {msgParts[0]}
                </p>
            </div>
        </div>
      )}

      {/* 3. THE MASTER CARD (Premium 2027 Glassmorphism) */}
      <div className={`relative w-full max-w-lg transition-all duration-1000 ${isCardVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10'}`}>
        
        {/* 🔥 Outer Ambient Glow */}
        <div className="absolute -inset-1 rounded-[3.5rem] opacity-30 blur-3xl animate-pulse transition-all duration-1000"
             style={{ background: themeColor }} />

        <div className="relative bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
          
          {/* HERO SECTION (Image/Component) */}
          <div className="relative w-full aspect-square overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
              
              {/* ✨ Divine Aura Behind Hero */}
              <div className="absolute inset-0 opacity-40 mix-blend-screen" 
                   style={{ background: `radial-gradient(circle at 50% 40%, ${themeColor} 0%, transparent 60%)`, filter: 'blur(40px)' }} 
              />

              {broadcast.image_url ? (
                <div className="w-full h-full relative group">
                  <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain p-8 relative z-10 drop-shadow-2xl" alt="Hero" />
                  {/* Gradient Overlay for smooth transition to content */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-20" />
                </div>
              ) : (
                <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
              )}
          </div>

          {/* CONTENT SECTION */}
          <div className="p-8 pt-2 text-center relative z-30 flex flex-col items-center">
            
            {/* Modern Shield Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-center mb-6">
               <ShieldCheck className="w-6 h-6 text-white/80" />
            </div>

            <div className="space-y-4 w-full">
                {/* 🎨 HEADLINE: Fade-out Gradient Text */}
                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] italic bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/20"
                    style={{ filter: `drop-shadow(0 4px 20px ${themeColor}30)` }}>
                    {titleParts[0]}
                </h1>
                
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed px-4 max-w-[90%] mx-auto">
                    {msgParts[0]}
                </p>
            </div>

            {/* 🎨 ACTION BUTTON (Glassmorphic) */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-16 mt-10 rounded-[2rem] text-lg font-black text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.03] active:scale-[0.97] border border-white/10 overflow-hidden relative group bg-white/5"
            >
              <span className="relative z-10 flex items-center gap-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {ctaText} <Sparkles className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </span>
              
              {/* Inner Gradient Background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ background: `linear-gradient(90deg, transparent, ${themeColor}40, transparent)` }} 
              />
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-4 right-4 text-white/20 hover:text-white hover:bg-white/10 transition-all p-2 rounded-full"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;900&display=swap');
        body, html { font-family: 'Poppins', sans-serif !important; }
        
        .hero-anim { animation: hero-float 6s ease-in-out infinite; }
        @keyframes hero-float { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.03) translateY(-8px); } }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>
    </div>
  );
}
