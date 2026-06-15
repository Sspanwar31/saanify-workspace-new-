'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AnimationFactory from '@/components/festival/v2/AnimationFactory';
import HeroFactory from '@/components/festival/v2/HeroFactory';
import { X, Sparkles, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BroadcastPreviewPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTopBanner, setShowTopBanner] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);
  
  // 🎉 9. Confetti Feature State
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => { 
    loadBroadcast(); 
    setShowConfetti(true); // Auto trigger confetti on load
  }, []);

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

      {/* 🚀 3. PREMIUM TOP BANNER (Updated per instructions) */}
      {showTopBanner && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] 
          min-h-[72px]
          max-w-[95vw]
          px-6 py-4
          rounded-full
          flex items-center justify-center gap-4
          backdrop-blur-3xl
          border border-white/10
          shadow-[0_10px_40px_rgba(0,0,0,0.4)]
          animate-in slide-in-from-top duration-700"
          style={{
            background: `${themeColor}22`,
            boxShadow: `0 0 30px ${themeColor}55`
          }}
        >
    
          <div className="animate-slow-spin text-2xl">
            🪔
          </div>
    
          <p
            className="text-white font-black text-center leading-relaxed"
            style={{
              fontSize: "clamp(12px,1.1vw,18px)",
              maxWidth: "900px"
            }}
          >
            {msgParts[0]}
          </p>
    
        </div>
      )}

      {/* 3. THE ULTRA COMPACT CARD (2027 Notification Style) */}
      {/* 🚀 1. CARD SIZE FIX: max-w-xs replaced with max-w-[480px] */}
      <div className={`relative w-full max-w-[480px] transition-all duration-700 ${isCardVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}>
        
        {/* 🔥 Subtle Glow */}
        <div className="absolute -inset-1 rounded-[2rem] opacity-30 blur-2xl transition-all duration-1000"
             style={{ background: themeColor }} />

        <div className="relative bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
          
          {/* 🚀 2. HERO SECTION BIGGER: h-48 replaced with h-[340px] */}
          <div className="relative w-full h-[340px] overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
              
              {/* ✨ Divine Aura (Sharper) */}
              <div className="absolute inset-0 opacity-40 mix-blend-screen" 
                   style={{ background: `radial-gradient(circle at 50% 50%, ${themeColor} 0%, transparent 70%)`, filter: 'blur(20px)' }} 
              />

              {broadcast.image_url ? (
                <div className="w-full h-full relative group">
                  <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain p-8 relative z-10 drop-shadow-2xl" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-20" />
                </div>
              ) : (
                <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
              )}
          </div>

          {/* CONTENT SECTION (Compact & Clean) */}
          <div className="p-5 pb-6 text-center relative z-30 flex flex-col items-center">
            
            {/* Icon (Small) */}
            {/* Note: For Step 8, keeping PartyPopper for stability. You can replace with <FestivalIconFactory /> later. */}
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 shadow-inner">
               <PartyPopper className="w-4 h-4 text-white/90" />
            </div>

            <div className="space-y-2 w-full">
                {/* 🚀 4. GREETING TITLE MODERN */}
                <h1
                  className="font-black uppercase tracking-tight leading-none italic"
                  style={{
                    fontSize: "clamp(52px,6vw,88px)",
                    color: themeColor,
                    textShadow: `0 0 25px ${themeColor}88`
                  }}
                >
                    {titleParts[0]}
                </h1>
                
                {/* 🚀 5. MESSAGE AUTO ADJUST */}
                <p
                 className="
                 text-slate-300
                 leading-relaxed
                 text-center
                 mx-auto
                 "
                 style={{
                   fontSize: "clamp(14px,1.1vw,20px)",
                   maxWidth: "90%"
                 }}
                >
                    {msgParts[0]}
                </p>
            </div>

            {/* 🚀 6. PREMIUM CTA */}
            <Button
              onClick={handleCelebrate}
              className="
              relative
              overflow-hidden
              w-full
              h-14
              mt-6
              rounded-full
              text-lg
              font-black
              text-white
              border
              border-white/10
              transition-all
              duration-300
              hover:scale-105
              "
              style={{
                background: `linear-gradient(135deg, ${themeColor}, ${themeColor}aa)`
              }}
            >
              <span className="relative z-10">
                {ctaText} 🚀
              </span>
        
              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-r
                  from-transparent
                  via-white/20
                  to-transparent
                  -translate-x-full
                  animate-shine
                "
              />
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
        
        /* 🚀 7. ADD THESE ANIMATIONS */
        @keyframes slowSpin {
          from {
            transform: rotate(0deg);
          }
        
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-slow-spin {
          animation: slowSpin 10s linear infinite;
        }
        
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
        
          100% {
            transform: translateX(200%);
          }
        }
        
        .animate-shine {
          animation: shine 3s infinite;
        }
      `}</style>
    </div>
  );
}
