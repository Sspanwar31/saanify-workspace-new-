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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('preview_mode', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setBroadcast(data);
    } catch (err) { 
      toast.error("No preview found.");
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-bold animate-pulse tracking-[10px]">SAANIFY LAB V2</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview</div>;

  // ━━━ 🚀 V2 MAPPING ━━━
  const themeConfig = broadcast.theme_config || {};
  const heroConfig = broadcast.hero_config || {};
  const isHoli = broadcast.festival_key === 'HOLI';
  
  // Theme Color Base (From DB or Default)
  const themeColor = themeConfig.primary_color || broadcast.theme_color || (isHoli ? '#ff0080' : '#fbbf24');
  
  const themeGradient = isHoli 
    ? 'linear-gradient(135deg, #ff0080 0%, #7c3aed 100%)'
    : `linear-gradient(135deg, ${themeColor} 0%, #ea580c 100%)`;

  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];
  
  // Resolve Language-based CTA from DB
  const ctaText = broadcast.resolved_cta || 'CELEBRATE NOW';

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* 1. ANIMATION ENGINE (Always active in background) */}
      <AnimationFactory theme={heroConfig.animation || broadcast.animation_theme} />

      {/* 2. TOP SUCCESS BANNER (Modern Floating Pill Style) */}
      {showTopBanner && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-[90vw] py-4 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-top duration-700 backdrop-blur-2xl rounded-full border border-white/10 flex items-center gap-4"
             style={{ background: `linear-gradient(90deg, ${themeColor}22, ${themeColor}11)`, borderColor: `${themeColor}44` }}>
             
             {/* ✨ Rotating Icon Fix */}
             <Sparkles className="w-6 h-6 animate-spin-slow shrink-0" style={{ color: themeColor }} />
             
             {/* Single Line Centered Message */}
             <p className="text-white font-black text-sm md:text-lg uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ textShadow: `0 0 10px ${themeColor}66` }}>
                SAANIFY PARIVAR: {msgParts[0]}
             </p>
        </div>
      )}

      {/* 3. THE MASTER CARD */}
      <div className={`relative w-full max-w-md transition-all duration-1000 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
        
        {/* Themed Outer Glow */}
        <div className="absolute -inset-2 rounded-[3.5rem] opacity-30 blur-3xl animate-pulse"
             style={{ background: themeGradient }} />

        <div className="relative bg-[#020617]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
          
          {/* HERO SECTION (Self-adjusting based on HeroFactory V3.2) */}
          <div className="relative w-full aspect-[4/5] overflow-hidden flex items-center justify-center">
              {broadcast.image_url ? (
                <div className="w-full h-full relative group">
                  <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain p-8 relative z-10" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-20" />
                </div>
              ) : (
                <HeroFactory config={heroConfig} themeColor={themeColor} />
              )}
          </div>

          {/* CONTENT SECTION */}
          <div className="p-10 pt-0 text-center -mt-12 relative z-30 flex flex-col items-center">
            
            {/* Branded Shield Icon */}
            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center mb-8 rotate-3">
               <ShieldCheck className="w-10 h-10" style={{ color: themeColor }} strokeWidth={2.5} />
            </div>

            <div className="space-y-4 w-full">
                {/* 🎨 THEMED TITLE (Dynamic Gradient or Color) */}
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none italic" 
                    style={{ color: themeColor, filter: `drop-shadow(0 0 10px ${themeColor}44)` }}>
                    {titleParts[0]}
                </h1>
                
                <p className="text-slate-300 text-base md:text-lg font-bold leading-relaxed px-4 opacity-80">
                    {msgParts[0]}
                </p>
            </div>

            {/* 🎨 THEMED BUTTON */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-16 mt-10 rounded-[2rem] text-xl font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95 border border-white/20"
              style={{ background: themeGradient }}
            >
              {ctaText} 🚀
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-6 right-8 text-white/20 hover:text-white transition-all"><X className="w-7 h-7" /></button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;900&display=swap');
        
        body, html { font-family: 'Poppins', sans-serif !important; }

        .hero-anim { 
          animation: hero-float 6s ease-in-out infinite; 
          animation-duration: ${heroConfig.speed || 4}s;
        }

        @keyframes hero-float { 
          0%, 100% { transform: scale(1) translateY(0); } 
          50% { transform: scale(1.05) translateY(-15px); } 
        }
        
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
