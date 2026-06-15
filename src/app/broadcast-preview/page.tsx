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
      const { data, error } = await supabase.from('broadcasts').select('*').eq('preview_mode', true).order('created_at', { ascending: false }).limit(1).single();
      if (error) throw error;
      setBroadcast(data);
    } catch (err) { toast.error("No preview found."); } 
    finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-black animate-pulse tracking-[15px]">SAANIFY V2</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview</div>;

  // ━━━ 🚀 MASTER THEME CONFIG ━━━
  const themeColor = broadcast.theme_config?.primary_color || broadcast.theme_color || '#fbbf24';
  const themeGradient = `linear-gradient(135deg, ${themeColor} 0%, #1e1b4b 100%)`;
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* 🚀 1. FULL SCREEN ATMOSPHERE */}
      <AnimationFactory theme={broadcast.hero_config?.animation || broadcast.animation_theme} />

      {/* 🚀 2. TOP BANNER (Patti) - PREMIUM FLOATING PILL */}
      {showTopBanner && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-auto max-w-[95vw] min-w-[300px] animate-in slide-in-from-top duration-1000">
           <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center gap-5">
              
              {/* 🎯 Rotating Festival Icon (Same as Hero) */}
              <div className="w-10 h-10 flex items-center justify-center animate-spin-slow scale-125">
                 <HeroFactory config={{...broadcast.hero_config, scale: 0.4}} themeColor={themeColor} />
              </div>

              {/* 🎯 Self-Adjusting Message */}
              <div className="flex flex-col items-center text-center">
                 <span className="text-[9px] font-black uppercase tracking-[5px] text-white/40 mb-1">SAANIFY PARIVAR</span>
                 <p className={`text-white font-bold leading-tight uppercase tracking-wide drop-shadow-md whitespace-normal
                    ${msgParts[0].length > 30 ? 'text-xs md:text-sm' : 'text-sm md:text-lg'}`}
                    style={{ color: themeColor }}>
                   {msgParts[0]}
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* 🚀 3. THE LARGE MASTER CARD (Image 3 Size) */}
      <div className={`relative w-full max-w-md md:max-w-[480px] transition-all duration-1000 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}`}>
        
        {/* Luxury Glow behind the Card */}
        <div className="absolute -inset-4 rounded-[4rem] opacity-20 blur-3xl animate-pulse"
             style={{ background: themeColor }} />

        <div className="relative bg-slate-950/80 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] shadow-[0_50px_150px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
          
          {/* HERO SECTION - Height increased for Better Vision */}
          <div className="relative w-full aspect-[4/5] overflow-hidden flex items-center justify-center bg-slate-900 group">
              {broadcast.image_url ? (
                <div className="w-full h-full relative">
                  <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain p-6 relative z-10" alt="Festival Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent z-20" />
                </div>
              ) : (
                <div className="scale-125 md:scale-150">
                   <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
                </div>
              )}

              {/* BRAND TAG (Top Left - Professional) */}
              <div className="absolute top-10 left-10 z-50">
                  <span className="text-[10px] font-black uppercase tracking-[8px] italic text-white/30 drop-shadow-md">SAANIFY</span>
              </div>
          </div>

          {/* CONTENT SECTION (Large & Clear) */}
          <div className="p-10 pt-0 text-center -mt-20 relative z-30 flex flex-col items-center">
            
            {/* Branded Shield Badge */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center mb-8 rotate-6">
               <ShieldCheck className="w-10 h-10" style={{ color: themeColor }} strokeWidth={2} />
            </div>

            <div className="space-y-5 w-full">
                {/* HEADLINE: Dynamic Color from Theme */}
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
                    style={{ color: themeColor }}>
                    {broadcast.resolved_title?.split('|')[0] || broadcast.title}
                </h1>
                
                <p className="text-slate-200 text-lg md:text-xl font-bold leading-relaxed px-2 opacity-90">
                    {msgParts[0]}
                </p>
            </div>

            {/* CTA BUTTON */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-18 mt-10 rounded-[2.5rem] text-2xl font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95 border-t border-white/20"
              style={{ background: `linear-gradient(135deg, ${themeColor}, #4f46e5)` }}
            >
              {broadcast.resolved_cta || 'CELEBRATE NOW 🚀'}
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-8 right-10 p-2 text-white/20 hover:text-white transition-all"><X className="w-8 h-8" /></button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');
        body, html { font-family: 'Poppins', sans-serif !important; }
        
        .hero-anim { 
           animation: hero-float ${broadcast?.hero_config?.speed || 4}s ease-in-out infinite; 
           filter: drop-shadow(0 20px 40px rgba(0,0,0,0.4));
        }

        @keyframes hero-float { 
          0%, 100% { transform: scale(1) translateY(0); } 
          50% { transform: scale(1.05) translateY(-15px); } 
        }

        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
