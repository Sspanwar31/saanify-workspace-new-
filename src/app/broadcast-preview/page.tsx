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
    } catch (err) { 
      toast.error("No preview found."); 
    } 
    finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-black animate-pulse tracking-[15px]">SAANIFY V2</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview</div>;

  // 🚀 THEME CONFIG
  const themeColor = broadcast.theme_config?.primary_color || broadcast.theme_color || '#fbbf24';
  const themeGradient = `linear-gradient(135deg, ${themeColor} 0%, #1e1b4b 100%)`;
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];
  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || []; // ✅ Fixed from Base Code
  const isHoli = broadcast.festival_key === 'HOLI';

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* BACKGROUND ANIMATION */}
      <AnimationFactory theme={broadcast.hero_config?.animation || broadcast.animation_theme} />

      {/* 🚀 TOP BANNER (Solid Theme Color) */}
      {showTopBanner && (
        <div className="fixed top-0 left-0 w-full z-[1000] h-12 flex items-center justify-center px-4 gap-3 shadow-lg animate-in slide-in-from-top duration-500"
             style={{ backgroundColor: themeColor }}>
         
         <Sparkles className="w-4 h-4 text-white/80 shrink-0" />
         
         <p className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] text-center truncate max-w-[90vw] drop-shadow-sm">
            {msgParts[0]}
         </p>

         <button onClick={() => setShowTopBanner(false)} className="absolute right-4 p-1">
           <X className="w-4 h-4 text-black/20" />
         </button>
    </div>
  )}

  {/* 🚀 THE MODERN CARD */}
  <div className={`relative w-full max-w-[380px] transition-all duration-700 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}`}>
    
    {/* ❌ GOLDEN SHADOW REMOVED (The background glow div is deleted) */}
    
    <div className="relative bg-slate-950/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
      
      {/* HERO SECTION (Height 65%) */}
      <div className="relative w-full h-[65%] overflow-hidden flex items-center justify-center bg-slate-900 p-6">
          
          {/* 🚀 STATIC BORDER BOX (Theme Color) */}
          <div 
             className="relative w-full h-full rounded-[2rem] border-4 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm shadow-2xl"
             style={{ 
               borderColor: isHoli 
                 ? 'transparent' 
                 : themeColor,
               // 🌈 Holi Rainbow Border
               background: isHoli 
                 ? 'linear-gradient(slate-900, slate-900) padding-box, linear-gradient(45deg, #ff0080, #8b5cf6, #ff0080) border-box' 
                 : 'transparent',
               backgroundSize: '200% 200%'
             }}
          >
             {/* 🎨 ANIMATION: Only on Image/Component */}
             {broadcast.image_url ? (
               <img src={broadcast.image_url} className="hero-anim w-full h-full object-contain relative z-10 drop-shadow-xl" alt="Festival Hero" />
             ) : (
               <div className="scale-125">
                  <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
               </div>
             )}
          </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 p-8 pt-4 text-center relative z-30 flex flex-col items-center justify-center">
        
        {/* Icon Badge */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-4 shadow-xl">
           <ShieldCheck className="w-6 h-6" style={{ color: themeColor }} strokeWidth={2.5} />
        </div>

        <div className="space-y-4 w-full">
            {/* 🎨 HEADLINE: Gold Color (Theme Color) */}
            <h1 className="text-4xl font-black uppercase tracking-tight leading-none italic drop-shadow-md" 
                style={{ color: themeColor }}>
                {titleParts[0]}
            </h1>
            
            <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed px-1">
                {msgParts[0]}
            </p>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={handleCelebrate}
          className="w-full h-12 mt-6 rounded-full text-base font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.95] border border-white/10"
          style={{ background: themeGradient }}
        >
          {broadcast.resolved_cta || 'CELEBRATE'}
        </Button>
      </div>
      
      <button onClick={() => setIsCardVisible(false)} className="absolute top-3 right-3 text-white/20 hover:text-white transition-all p-1 rounded-full"><X className="w-5 h-5" /></button>
    </div>
  </div>

  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;900&display=swap');
    body, html { font-family: 'Poppins', sans-serif !important; }
    
    .hero-anim { 
       animation: hero-float ${broadcast?.hero_config?.speed || 4}s ease-in-out infinite; 
       filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4)); 
    }

    @keyframes hero-float { 
      0%, 100% { transform: scale(1) translateY(0); } 
      50% { transform: scale(1.03) translateY(-5px); } 
    }
  `}</style>
</div>
);
}
