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
      const { data, error } = await supabase.from('broadcasts').select('*').eq('preview_mode', true).order('created_at', { ascending: false }).limit(1).single();
      if (error) throw error;
      setBroadcast(data);
    } catch (err) { toast.error("No preview found."); } 
    finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-black animate-pulse tracking-[15px]">SAANIFY V2</div>;
  if (!broadcast) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">No Active Preview</div>;

  // 🚀 DYNAMIC CONFIG EXTRACTION
  const themeColor = broadcast.theme_config?.primary_color || broadcast.theme_color || '#fbbf24';
  const themeGradient = `linear-gradient(135deg, ${themeColor} 0%, #020617 100%)`;
  
  // 1. Title Config
  const titleVariant = broadcast.theme_config?.title_variant || 'royal';
  
  // 2. CTA Config
  const ctaVariant = broadcast.theme_config?.cta_variant || 'premium';
  
  // 3. Banner Config
  const bannerVariant = broadcast.theme_config?.banner_variant || 'glass';
  
  // 4. Glow Config
  const cardGlow = broadcast.theme_config?.card_glow || 'theme';
  
  // 5. Particle Config
  const particleVariant = broadcast.hero_config?.particle_variant || 'default';

  // 6. Design Preset Config
  const designPreset = broadcast.hero_config?.design_preset || 'standard';

  // Text Splitting
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];
  const titleParts = (broadcast.resolved_title || broadcast.title)?.split('|') || [];
  const isHoli = broadcast.festival_key === 'HOLI';

  // 🚀 1. DYNAMIC TITLE STYLES
  const titleStyles: any = {
    royal: 'font-black italic tracking-tight',
    modern: 'font-bold tracking-wide',
    minimal: 'font-semibold tracking-normal',
    gradient: 'font-black bg-clip-text text-transparent',
    glow: 'font-black drop-shadow-[0_0_20px_currentColor]'
  };

  // 🚀 2. DYNAMIC CTA STYLES
  const getCTAStyle = () => {
    switch(ctaVariant){
      case 'glass':
        return {
          background:'rgba(255,255,255,0.1)',
          backdropFilter:'blur(20px)',
          color: 'white'
        };
      case 'solid':
        return {
          background: themeColor,
          color: '#020617'
        };
      case 'gradient':
        return {
          background: `linear-gradient(135deg,${themeColor},#ffffff)`,
          color: '#020617'
        };
      case 'neon':
        return {
          background: themeColor,
          color: '#020617',
          boxShadow:`0 0 30px ${themeColor}`
        };
      default:
        return {
          background: themeGradient,
          color: 'white'
        };
    }
  };

  // 🚀 3. DYNAMIC BANNER CLASSES
  const cardClasses: any = {
    glass: 'bg-[#0a0f1e]/90 backdrop-blur-3xl',
    premium: 'bg-[#0a0f1e]',
    luxury: 'bg-gradient-to-br from-black via-slate-900 to-black',
    royal: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
    minimal: 'bg-[#111827]',
    festival: 'bg-gradient-to-br from-slate-950 to-black'
  };

  // 🚀 4. DYNAMIC GLOW
  const getGlow = () => {
    switch(cardGlow){
      case 'gold':
        return '0 0 80px rgba(251,191,36,.4)';
      case 'white':
        return '0 0 80px rgba(255,255,255,.25)';
      case 'premium':
        return `0 0 120px ${themeColor}55`;
      case 'none':
        return 'none';
      default:
        return `0 0 80px ${themeColor}30`;
    }
  };

  // 🚀 5. DESIGN PRESET LOGIC
  const getDesignTweaks = () => {
    switch(designPreset) {
      case 'premium': return 'scale-110'; // Bigger Hero
      case 'modern': return 'shadow-2xl shadow-black/50';
      case 'minimal': return 'shadow-lg shadow-black/20';
      case 'glass': return 'backdrop-blur-3xl';
      default: return '';
    }
  };

  const handleCelebrate = () => {
    setShowTopBanner(true);
    setIsCardVisible(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* BACKGROUND ANIMATION (Passing Variant) */}
     <AnimationFactory
  engine={broadcast?.hero_config?.animation}
  preset={broadcast?.festival_key}
/>

      {/* 🚀 1. TOP BANNER */}
      {showTopBanner && (
        <div className="fixed top-0 left-0 w-full z-[1000] h-14 flex items-center justify-center px-8 gap-4 shadow-2xl animate-in slide-in-from-top duration-700 border-b border-white/10"
             style={{ background: themeGradient }}>
             
             <Sparkles className="w-6 h-6 text-white animate-spin-slow shrink-0" />
             
             <p className="text-white font-black text-xs md:text-sm uppercase tracking-[0.3em] text-center drop-shadow-md">
                SAANIFY PARIVAR: {msgParts[0]}
             </p>

             <button onClick={() => setShowTopBanner(false)} className="absolute right-6 p-1 text-white/40 hover:text-white transition-all">
               <X className="w-5 h-5" />
             </button>
        </div>
      )}

      {/* 🚀 2. THE MASTER CARD CONTAINER */}
      <div className={`relative w-full max-w-[350px] transition-all duration-1000 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}`}>
        
        <div 
          className={`relative rounded-[3rem] shadow-[0_50px_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col border-[3px] transition-all duration-500 ${cardClasses[bannerVariant]}`}
          style={{ 
            borderColor: designPreset === 'royal' ? '#ffd700' : (isHoli ? '#ff0080' : themeColor),
            boxShadow: getGlow(),
            ...(designPreset === 'luxury' && { boxShadow: `0 0 100px ${themeColor}60, 0 0 200px ${themeColor}20` }) // Luxury Extra Glow
          }}
        >
          
          {/* 🚀 3. HERO SECTION */}
          <div className="relative w-full h-[320px] overflow-hidden flex items-center justify-center bg-slate-950/50 p-6 pt-16">
              
              {/* Image/Visual */}
              {broadcast.image_url ? (
                <img src={broadcast.image_url} className={`hero-anim w-full h-full object-contain relative z-10 drop-shadow-2xl ${getDesignTweaks()}`} alt="Hero" />
              ) : (
                <div className={`transition-transform duration-500 ${getDesignTweaks()}`}>
                   {/* HeroFactory now internally handles banner_visual_key logic */}
                   <HeroFactory config={broadcast.hero_config} themeColor={themeColor} />
                </div>
              )}

              {/* Smooth Bottom Blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent z-20 pointer-events-none" />
          </div>

          {/* CONTENT SECTION */}
          <div className="p-8 pt-0 text-center relative z-30 flex flex-col items-center">
            
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-6 shadow-2xl rotate-3">
               <ShieldCheck className="w-8 h-8" style={{ color: themeColor }} strokeWidth={2} />
            </div>

            <div className="space-y-4 w-full">
                {/* 🚀 DYNAMIC TITLE */}
                <h1
                 className={`text-3xl uppercase leading-none drop-shadow-lg ${titleStyles[titleVariant]}`}
                 style={{
                   color: titleVariant !== 'gradient'
                      ? themeColor
                      : undefined,

                   background:
                      titleVariant === 'gradient'
                      ? `linear-gradient(90deg, ${themeColor}, white)`
                      : undefined
                 }}
                >
                    {titleParts[0]}
                </h1>
                
                <p className="text-slate-300 text-[13px] font-medium leading-relaxed px-2 opacity-80">
                    {msgParts[0]}
                </p>
            </div>

            {/* 🚀 DYNAMIC CTA */}
            <Button 
              onClick={handleCelebrate}
              className="w-full h-14 mt-8 rounded-[1.5rem] text-lg font-black shadow-2xl transition-all hover:scale-105 active:scale-95 border-t border-white/20"
              style={getCTAStyle()}
            >
              {broadcast.resolved_cta || 'CELEBRATE'}
            </Button>
          </div>
          
          <button onClick={() => setIsCardVisible(false)} className="absolute top-6 right-8 text-white/20 hover:text-white transition-all"><X className="w-6 h-6" /></button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');
        body, html { font-family: 'Poppins', sans-serif !important; }

        /* Spinning Star for Top Banner */
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Breathing Animation for Hero */
        .hero-anim { 
           animation: hero-float ${broadcast?.hero_config?.speed || 4}s ease-in-out infinite; 
        }
        @keyframes hero-float { 
          0%, 100% { transform: scale(1) translateY(0); } 
          50% { transform: scale(1.05) translateY(-6px); } 
        }
      `}</style>
    </div>
  );
}
