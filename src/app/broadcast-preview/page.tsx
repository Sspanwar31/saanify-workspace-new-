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
  
  // Modern Gradient Logic
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
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-outfit selection:bg-white/20">
      
      {/* 1. ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-[#020617] to-[#020617]" />
      {/* Subtle Noise Texture for 2027 feel */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* 🚀 V2: Animation Engine ab JSON 'animation' key se chalega */}
      <AnimationFactory theme={heroConfig.animation || broadcast.animation_theme} />

      {/* 2. TOP SUCCESS BANNER (Modernized) */}
      {showTopBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-[50] py-3 px-6 shadow-2xl animate-in slide-in-from-top duration-500 backdrop-blur-xl rounded-full border border-white/10"
             style={{ backgroundColor: `${themeColor}15`, borderColor: `${themeColor}50` }}>
          <div className="flex items-center justify-center gap-3">
             <Sparkles className="w-5 h-5" style={{ color: themeColor }} />
             <p className="text-white font-bold text-sm text-center uppercase tracking-widest">
                {msgParts[0] || 'Enjoy the Festival!'}
             </p>
          </div>
        </div>
      )}

      {/* 3. THE MASTER CARD */}
      <div className={`relative w-full max-w-md transition-all duration-1000 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-10'}`}>
        
        {/* Outer Glow - Creates the Festival Vibe */}
        <div className="absolute -inset-1 rounded-[2.5rem] opacity-60 blur-2xl animate-pulse"
             style={{ background: themeGradient }} />

        <div className="relative bg-[#0f172a]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
          
          {/* HERO SECTION */}
          <div className="relative w-full aspect-[4/5] md:aspect-[4/3] overflow-hidden bg-slate-900 flex items-center justify-center group">
              
              {/* 🎨 FESTIVAL GLOW (Theme Color Shadow) */}
              {/* Yeh div image ke peeche glow karega theme color mein */}
              <div className="absolute inset-0 opacity-40 mix-blend-screen" 
                   style={{ 
                     background: `radial-gradient(circle at 50% 30%, ${themeColor} 0%, transparent 65%)`,
                     filter: 'blur(40px)'
                   }} 
              />

              {broadcast.image_url ? (
                <img src={broadcast.image_url} className="hero-anim w-full h-full object-cover relative z-10" alt="Festival" />
              ) : (
                <div className="w-full h-full flex items-center justify-center relative z-10">
                   <HeroFactory config={heroConfig} />
                </div>
              )}
              
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent/60 to-transparent z-20 pointer-events-none" />
              
              {/* 🚀 BRAND NAME (Transparent & Modern) */}
              {/* Black background hata diya. Direct text with heavy shadow/glows. */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
                  <div className="relative px-6 py-2 rounded-full border border-white/10 backdrop-blur-[2px]">
                      {/* Glow Effect Behind Text */}
                      <div className="absolute inset-0 blur-md rounded-full opacity-70" style={{ backgroundColor: themeColor }} />
                      {/* Text Itself */}
                      <span className="relative block text-[11px] font-black tracking-[0.3em] uppercase text-white drop-shadow-md mix-blend-overlay">
                          SAANIFY
                      </span>
                  </div>
              </div>
          </div>

          {/* CONTENT SECTION */}
          <div className="p-8 pb-10 text-center -mt-4 relative z-30 flex flex-col items-center">
            
            {/* Icon Container - Glassy look */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center mb-6">
               <ShieldCheck className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>

            <div className="space-y-3 w-full">
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white leading-none">
                    <span style={{ color: themeColor }}>{titleParts[0]?.split(' ')[0]}</span> {titleParts[0]?.split(' ').slice(1).join(' ')}
                </h1>
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed px-2">
                    {msgParts[0]}
                </p>
            </div>

            <Button 
              onClick={handleCelebrate}
              className="w-full h-14 mt-8 rounded-full text-lg font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95 border border-white/20 group relative overflow-hidden"
              style={{ background: themeGradient }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {ctaText} <Sparkles className="w-4 h-4" />
              </span>
              {/* Button Inner Shine */}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-4 right-4 p-2 text-white/20 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"><X className="w-5 h-5" /></button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;600;800;900&display=swap');
        
        body, html { 
          font-family: 'Inter', sans-serif !important; 
          -webkit-font-smoothing: antialiased;
        }

        .font-outfit {
          font-family: 'Outfit', sans-serif !important;
        }

        .hero-anim { 
          animation: hero-float 7s ease-in-out infinite; 
          filter: contrast(1.1) saturate(1.1);
        }

        @keyframes hero-float { 
          0% { transform: scale(1) translateY(0); } 
          50% { transform: scale(1.08) translateY(-15px); } 
          100% { transform: scale(1) translateY(0); } 
        }
        
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
