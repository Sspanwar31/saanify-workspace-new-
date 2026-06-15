'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import RoyalDiya from '../heroes/RoyalDiya';
import GaneshaHero from '../heroes/GaneshaHero';
import DurgaHero from '../heroes/DurgaHero';
import HoliPalette from '../heroes/HoliPalette';
import AshokaChakra from '../heroes/AshokaChakra';
import ChristmasHero from '../heroes/ChristmasHero';
import MoonHero from '../heroes/MoonHero';
// 🚀 Naya Import: Animation engine ko andar le aaye
import AnimationFactory from '@/components/festival/v2/AnimationFactory';

export default function HeroFactory({ 
  config, 
  themeColor = '#fbbf24', 
  hideBranding = false,
  minimal = false 
}: { 
  config: any, 
  themeColor?: string, 
  hideBranding?: boolean,
  minimal?: boolean 
}) {
  if (!config) return null;

  const { render_type, visual_key, image_url, scale = 1, speed = 4 } = config;
  
  // 🎯 DYNAMIC ANIMATION: Pehle JSON se uthayega, warna default Gold Particles
  const currentAnimation = config?.animation || 'GOLDEN_PARTICLES';

  const ComponentMap: any = {
    'ROYAL_DIYA': <RoyalDiya />, 'GANESHA': <GaneshaHero />, 'ROYAL_GANESHA': <GaneshaHero />,
    'MAA_DURGA': <DurgaHero />, 'DIVINE_TRISHUL': <DurgaHero />, 'VIBRANT_PALETTE': <HoliPalette />,
    'ASHOKA_CHAKRA': <AshokaChakra />, 'DHARMA_CHAKRA': <AshokaChakra />, 'CHRISTMAS_TREE': <ChristmasHero />,
    'XMAS_TREE': <ChristmasHero />, 'MOON_HERO': <MoonHero />, 'CRESCENT_MOON': <MoonHero />,
    'EID_MUBARAK': <MoonHero />, 'GANGA_GHAT_DIYA': <RoyalDiya />,
    'DANDIYA_BEAT': <span className="text-[110px]">🥁</span>, 'RAVAN_DAHAN': <span className="text-[110px]">🏹</span>,
    'BABY_KRISHNA': <span className="text-[110px]">🪈</span>, 'BROTHER_BOND': <span className="text-[110px]">🎁</span>,
    'KITES_FLYING': <span className="text-[110px]">🪁</span>, 'REAL_BONFIRE': <span className="text-[110px]">🔥</span>,
    'SHIVA_POWER': <span className="text-[110px]">🔱</span>, 'RAM_DHARMA': <span className="text-[110px]">🏹</span>,
    'HANUMAN_GADA': <span className="text-[110px]">🔱</span>, 'MOON_SIEVE': <span className="text-[110px]">🌕</span>,
    'SUN_ARGHYA': <span className="text-[110px]">☀️</span>, 'HARVEST_POT': <span className="text-[110px]">🏺</span>,
    'NY_COUNTDOWN': <span className="text-[110px]">🕰️</span>, 'NATIONAL_PRIDE': <span className="text-[110px]">🏛️</span>,
    'SIKH_KHANDA': <span className="text-[110px]">☬</span>,
  };

  if (minimal) {
    return (
      <div className="flex items-center justify-center">
        {render_type === 'COMPONENT' ? (
           <div className="scale-50 transform">{ComponentMap[visual_key] || '✨'}</div>
        ) : render_type === 'IMAGE' && image_url ? (
           <img src={image_url} className="h-16 w-16 object-contain" alt="Icon" />
        ) : <span className="text-xl">🪔</span>}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden rounded-[3rem]">
      
      {/* 🌌 1. INTERNAL ANIMATION LAYER (Purely DB Driven) */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
         <AnimationFactory theme={currentAnimation} />
      </div>

      {/* 🏆 2. BRANDING */}
      {!hideBranding && (
        <div className="absolute top-6 left-8 z-50 pointer-events-none">
            <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white/30 italic">S A A N I F Y</span>
        </div>
      )}

      {/* 🌈 3. THEME AURA */}
      <div className="absolute inset-0 blur-[100px] opacity-40 animate-pulse mix-blend-screen" 
           style={{ background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 75%)` }} />
      
      {/* 🚀 4. HERO VISUAL (Fixed Scale & Animation) */}
      <div className="relative z-10 flex items-center justify-center animate-hero-breathe"
           style={{ animationDuration: `${speed}s`, width: '100%', height: '100%' }}>
        <div className="flex items-center justify-center"
             style={{ transform: `scale(${scale})`, transition: 'transform 0.4s ease-out' }}>
           {render_type === 'COMPONENT' ? (
              <div className="flex items-center justify-center">
                {ComponentMap[visual_key] || <LucideIcons.Sparkles size={80} className="text-white opacity-20" />}
              </div>
           ) : render_type === 'IMAGE' && image_url ? (
             <img src={image_url} className="max-w-[280px] max-h-[280px] object-contain drop-shadow-2xl" alt="Festival" />
           ) : null}
        </div>
      </div>
    </div>
  );
}
