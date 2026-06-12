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

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-bold animate-pulse">LOADING V2 DATA...</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview</div>;

  // ━━━ 🚀 NEW V2 JSON MAPPING ━━━
  const themeConfig = broadcast.theme_config || {};
  const heroConfig = broadcast.hero_config || {};
  
  const isHoli = broadcast.festival_key === 'HOLI';
  
  // JSON se color uthayega, agar nahi mila toh fallback color lega
  const themeColor = themeConfig.primary_color || broadcast.theme_color || (isHoli ? '#db2777' : '#fbbf24');
  
  const themeGradient = isHoli 
    ? 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)'
    : `linear-gradient(135deg, ${themeColor} 0%, #ea580c 100%)`;

  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];
  const ctaText = broadcast.resolved_cta || broadcast.cta_text || 'CELEBRATE NOW';

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* 1. BACKGROUND ANIMATION (Uses JSON Config) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]" />
      
      {/* 🚀 V2: Animation Engine ab JSON 'animation' key se chalega */}
      <AnimationFactory theme={heroConfig.animation || broadcast.animation_theme} />

      {/* 2. TOP SUCCESS BANNER */}
      {showTopBanner && (
        <div className="fixed top-0 left-0 w-full z-[50] py-4 px-6 shadow-2xl animate-in slide-in-from-top duration-700 backdrop-blur-md"
             style={{ backgroundColor: themeColor }}>
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
             <Sparkles className="w-6 h-6 text-white animate-spin-slow" />
             <p className="text-white font-bold text-lg text-center uppercase italic">
                {msgParts[0] || 'Enjoy the Festival!'}
             </p>
          </div>
        </div>
      )}

      {/* 3. THE MASTER CARD */}
      <div className={`relative w-full max-w-md transition-all duration-1000 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-10'}`}>
        
        <div className="absolute -inset-1 rounded-[2.5rem] opacity-40 blur-xl animate-pulse"
             style={{ background: themeGradient }} />

        <div className="relative bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
          
          {/* HERO SECTION */}
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-900 flex items-center justify-center">
              {broadcast.image_url ? (
                <img src={broadcast.image_url} className="hero-anim w-full h-full object-cover" alt="Festival" />
              ) : (
                <div className="w-full h-full flex items-center justify-center relative">
                   {/* 🚀 V2: HeroFactory ab pura config object lega */}
                   <HeroFactory config={heroConfig} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
              
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-50">
                  <span className="text-[10px] font-bold tracking-[6px] uppercase" style={{ color: themeColor }}>
                      SAANIFY PARIVAR
                  </span>
              </div>
          </div>

          {/* CONTENT SECTION */}
          <div className="p-8 text-center -mt-12 relative z-10 flex flex-col items-center">
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-slate-200 shadow-xl flex items-center justify-center border-4 border-[#0f172a] mb-5">
               <ShieldCheck className="w-10 h-10 text-blue-950" strokeWidth={2.5} />
            </div>

            <div className="space-y-4 w-full">
                <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter" style={{ color: themeColor }}>
                    {titleParts[0]}
                </h1>
                <p className="text-slate-300 text-lg font-bold leading-tight px-2">
                    {msgParts[0]}
                </p>
            </div>

            <Button 
              onClick={handleCelebrate}
              className="w-full h-16 mt-8 rounded-[2rem] text-xl font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95 border-b-4 border-white/20"
              style={{ background: themeGradient }}
            >
              {ctaText} 🚀
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-4 right-4 p-1 text-white/30 hover:text-white transition-all"><X className="w-6 h-6" /></button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');
        body, html { font-family: 'Poppins', sans-serif !important; }
        .hero-anim { animation: hero-float 6s ease-in-out infinite; }
        @keyframes hero-float { 0% { transform: scale(1) translateY(0); } 50% { transform: scale(1.05) translateY(-10px); } 100% { transform: scale(1) translateY(0); } }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
