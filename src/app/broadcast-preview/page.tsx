'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AnimationFactory from '@/components/festival/v2/AnimationFactory';
import HeroFactory from '@/components/festival/v2/HeroFactory';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BroadcastPreviewPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTopBanner, setShowTopBanner] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);

  useEffect(() => { loadBroadcast(); }, []);

  const loadBroadcast = async () => {
    try {
      const { data } = await supabase.from('broadcasts').select('*').eq('preview_mode', true).order('created_at', { ascending: false }).limit(1).single();
      if (error) throw error;
      setBroadcast(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-black animate-pulse tracking-[15px]">SAANIFY V2</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview</div>;

  // 🚀 THEME CONFIG
  const themeColor = broadcast.theme_config?.primary_color || broadcast.theme_color || '#fbbf24';
  const themeGradient = `linear-gradient(135deg, ${themeColor} 0%, #1e1b4b 100%)`;
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];
  const isHoli = broadcast.festival_key === 'HOLI';

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* BACKGROUND ANIMATION */}
      <AnimationFactory theme={broadcast.hero_config?.animation || broadcast.animation_theme} />

      {/* TOP BANNER */}
      {showTopBanner && (
        <div className="fixed top-0 left-0 w-full z-[1000] h-12 flex items-center justify-center px-4 gap-3 shadow-lg animate-in slide-in-from-top duration-700"
             style={{ backgroundColor: themeColor }}>
             <Sparkles className="w-4 h-4 text-white/80 shrink-0" />
             <p className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] text-center truncate max-w-[90vw]">
                {msgParts[0]}
             </p>
             <button onClick={() => setShowTopBanner(false)} className="absolute right-4 p-1"><X className="w-4 h-4 text-black/20" /></button>
        </div>
      )}

      {/* 🚀 THE MODERN CARD (Updated with Theme-Based Outline) */}
      <div className={`relative w-full max-w-[380px] transition-all duration-1000 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}`}>
        
        {/* 🚀 MAIN CARD CONTAINER: Added border-[3px] and dynamic borderColor */}
        <div 
          className="relative bg-slate-950/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col border-[3px] transition-all duration-500"
          style={{ 
            borderColor: isHoli ? '#ff0080' : themeColor, // Holi pe pink/rainbow, Diwali pe Gold
            boxShadow: `0 0 50px ${themeColor}15` // Subtle outer glow matching theme
          }}
        >
          
          {/* HERO SECTION (Internal golden box removed) */}
          <div className="relative w-full h-[320px] overflow-hidden flex items-center justify-center bg-slate-950/50 p-6">
              
              {/* Image/Visual sitting directly in the card */}
              {broadcast.image_url ? (
                <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain relative z-10 drop-shadow-2xl" alt="Hero" />
              ) : (
                <div className="scale-125">
                   <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
                </div>
              )}

              {/* Smooth Bottom Blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20 pointer-events-none" />
          </div>

          {/* CONTENT SECTION */}
          <div className="p-8 pt-0 text-center relative z-30 flex flex-col items-center">
            
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-6 shadow-2xl rotate-3">
               <ShieldCheck className="w-8 h-8" style={{ color: themeColor }} strokeWidth={2.5} />
            </div>

            <div className="space-y-4 w-full">
                <h1 className="text-4xl font-black uppercase tracking-tight leading-none italic drop-shadow-lg" 
                    style={{ color: themeColor }}>
                    {titleParts[0]}
                </h1>
                
                <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed px-2 opacity-80">
                    {msgParts[0]}
                </p>
            </div>

            <Button 
              onClick={handleCelebrate}
              className="w-full h-14 mt-8 rounded-[1.5rem] text-xl font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95 border-t border-white/20"
              style={{ background: themeGradient }}
            >
              {broadcast.resolved_cta || 'CELEBRATE'}
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-4 right-6 text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');
        body, html { font-family: 'Poppins', sans-serif !important; }
        
        .hero-anim { 
           animation: hero-float ${broadcast?.hero_config?.speed || 4}s ease-in-out infinite; 
        }

        @keyframes hero-float { 
          0%, 100% { transform: scale(1) translateY(0); } 
          50% { transform: scale(1.05) translateY(-8px); } 
        }
      `}</style>
    </div>
  );
}
