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

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-bold animate-pulse tracking-[10px]">SAANIFY LAB V2</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview</div>;

  // 🚀 1. UNIVERSAL THEME COLOR LOGIC
  const getFestivalTheme = () => {
    const key = broadcast.festival_key;
    const dbColor = broadcast.theme_config?.primary_color || broadcast.theme_color;
    
    if (dbColor && dbColor !== 'DEFAULT' && dbColor !== 'default') return dbColor;

    // Default Mapping agar DB mein color nahi hai
    const colorMap: any = {
      HOLI: '#ff0080',
      CHRISTMAS: '#ef4444', // Red for Christmas
      EID_UL_FITR: '#10b981',
      EID_AL_ADHA: '#10b981',
      REPUBLIC_DAY: '#FF9933',
      INDEPENDENCE_DAY: '#16a34a',
      DIWALI: '#fbbf24',
      NEW_YEAR: '#8b5cf6'
    };
    return colorMap[key] || '#fbbf24'; // Default Gold
  };

  const themeColor = getFestivalTheme();
  
  // 🚀 2. DYNAMIC GRADIENT (Based on Festival Mood)
  const themeGradient = `linear-gradient(135deg, ${themeColor} 0%, #1e1b4b 100%)`;

  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];
  const ctaText = broadcast.resolved_cta || 'CELEBRATE NOW';

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* BACKGROUND ANIMATION */}
      <AnimationFactory theme={broadcast.hero_config?.animation || broadcast.animation_theme} />

      {/* 🚀 3. TOP SUCCESS BANNER (Fixed Overflow & Positioning) */}
      {showTopBanner && (
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg py-3.5 px-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-top duration-500 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center justify-center gap-3"
          style={{ 
            background: `linear-gradient(90deg, ${themeColor}22 0%, rgba(2,6,23,0.8) 100%)`,
            borderColor: `${themeColor}40`,
            boxShadow: `0 0 20px ${themeColor}20`
          }}>
             
             <Sparkles className="w-6 h-6 animate-spin-slow shrink-0" style={{ color: themeColor }} />
             
             {/* ✨ FIX: 'whitespace-normal' allows text to wrap, preventing overflow */}
             <p className="text-white font-black text-sm md:text-base uppercase tracking-wide text-center leading-tight"
                style={{ textShadow: `0 0 8px ${themeColor}88` }}>
                SAANIFY PARIVAR: {msgParts[0]}
             </p>
        </div>
      )}

      {/* 4. THE MASTER CARD (2027 Modern Glassmorphism) */}
      <div className={`relative w-full max-w-md transition-all duration-1000 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
        
        {/* ✨ Modern Glow Effect behind card */}
        <div className="absolute -inset-4 rounded-[3.5rem] opacity-20 blur-2xl transition-all duration-1000 animate-pulse"
             style={{ background: themeColor }} />

        <div className="relative bg-[#020617]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
          
          {/* HERO SECTION */}
          <div className="relative w-full aspect-square overflow-hidden flex items-center justify-center">
              {broadcast.image_url ? (
                <div className="w-full h-full relative group">
                  <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain p-8 relative z-10" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-20" />
                </div>
              ) : (
                <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
              )}
          </div>

          {/* CONTENT SECTION */}
          <div className="p-8 pt-4 text-center relative z-30 flex flex-col items-center">
            
            {/* Modern Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center mb-6">
               <PartyPopper className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-3 w-full">
                {/* 🎨 THEME COLOR TITLE with Glow */}
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50 drop-shadow-2xl"
                    style={{ filter: `drop-shadow(0 0 20px ${themeColor}60)` }}>
                    {titleParts[0]}
                </h1>
                
                <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed px-2">
                    {msgParts[0]}
                </p>
            </div>

            {/* 🎨 MODERN BUTTON with Shine */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-16 mt-8 rounded-[1.5rem] text-xl font-black text-white shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/20 overflow-hidden relative group"
              style={{ background: `linear-gradient(135deg, ${themeColor}, #4f46e5)` }}
            >
              <span className="relative z-10">{ctaText} ✨</span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-all p-2 rounded-full hover:bg-white/10"><X className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Modern Animation Keyframes */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;900&display=swap');
        body, html { font-family: 'Poppins', sans-serif !important; }
        
        .hero-anim { animation: hero-float 6s ease-in-out infinite; }
        @keyframes hero-float { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.02) translateY(-10px); } }
        
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
