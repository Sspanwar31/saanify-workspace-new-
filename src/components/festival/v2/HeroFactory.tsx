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

// 🚀 Function Signature update: minimal prop added
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

  // ━━━ MASTER COMPONENT MAP (Reusable for both modes) ━━━
  const ComponentMap: any = {
    // Premium React Components
    'ROYAL_DIYA': <RoyalDiya />,
    'GANESHA': <GaneshaHero />,
    'ROYAL_GANESHA': <GaneshaHero />,
    'MAA_DURGA': <DurgaHero />,
    'DIVINE_TRISHUL': <DurgaHero />,
    'VIBRANT_PALETTE': <HoliPalette />,
    'ASHOKA_CHAKRA': <AshokaChakra />,
    'DHARMA_CHAKRA': <AshokaChakra />,
    'CHRISTMAS_TREE': <ChristmasHero />,
    'XMAS_TREE': <ChristmasHero />,
    'MOON_HERO': <MoonHero />,
    'CRESCENT_MOON': <MoonHero />,
    'EID_MUBARAK': <MoonHero />,
    'GANGA_GHAT_DIYA': <RoyalDiya />,
    
    // High-End Branded Emojis
    'DANDIYA_BEAT': <span className="text-[110px] drop-shadow-2xl">🥁</span>,
    'RAVAN_DAHAN': <span className="text-[110px] drop-shadow-2xl">🏹</span>,
    'BABY_KRISHNA': <span className="text-[110px] drop-shadow-2xl">🪈</span>,
    'BROTHER_BOND': <span className="text-[110px] drop-shadow-2xl">🎁</span>,
    'KITES_FLYING': <span className="text-[110px] drop-shadow-2xl">🪁</span>,
    'REAL_BONFIRE': <span className="text-[110px] drop-shadow-2xl">🔥</span>,
    'SHIVA_POWER': <span className="text-[110px] drop-shadow-2xl">🔱</span>,
    'RAM_DHARMA': <span className="text-[110px] drop-shadow-2xl">🏹</span>,
    'HANUMAN_GADA': <span className="text-[110px] drop-shadow-2xl">🔱</span>,
    'MOON_SIEVE': <span className="text-[110px] drop-shadow-2xl">🌕</span>,
    'SUN_ARGHYA': <span className="text-[110px] drop-shadow-2xl">☀️</span>,
    'HARVEST_POT': <span className="text-[110px] drop-shadow-2xl">🏺</span>,
    'EID_MUBARAK': <span className="text-[110px] drop-shadow-2xl">🌙</span>,
    'HOLY_KAABA': <span className="text-[110px] drop-shadow-2xl">🕋</span>,
    'NY_COUNTDOWN': <span className="text-[110px] drop-shadow-2xl">🕰️</span>,
    'NATIONAL_PRIDE': <span className="text-[110px] drop-shadow-2xl">🏛️</span>,
    'SIKH_KHANDA': <span className="text-[110px] drop-shadow-2xl">☬</span>,
  };

  // ━━━ MODE A: MINIMAL (Sirf Banner ke liye) ━━━
  if (minimal) {
    return (
      <div className="flex items-center justify-center">
        {render_type === 'COMPONENT' ? (
           <div className="scale-50 transform">
             {ComponentMap[visual_key] || '✨'}
           </div>
        ) : render_type === 'IMAGE' && image_url ? (
           <img src={image_url} className="h-16 w-16 object-contain" alt="Festival" />
        ) : (
           <span className="text-xl">🪔</span> // Fallback for emojis
        )}
      </div>
    );
  }

  // ━━━ MODE B: FULL PREMIUM CARD ━━━
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-visible">
      
      {/* 🏆 BRANDING: Absolute Top-Left (Updated Text Style) */}
      {!hideBranding && (
        <div className="absolute top-0 left-0 z-50 pointer-events-none p-6">
            <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white/20 italic">
                S A A N I F Y
            </span>
        </div>
      )}

      {/* 🌈 DYNAMIC AURA */}
      <div className="absolute inset-0 blur-[100px] opacity-40 animate-pulse mix-blend-screen" 
           style={{ background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 75%)`, animationDuration: `${speed * 1.5}s` }} />
      
      {/* 🚀 3. THE HERO CONTENT (FIXED: Separated Scale & Animation) */}
      
      {/* Step A: Apply 'Breathing' Animation here (Movement up/down) */}
      <div 
        className="relative z-10 flex items-center justify-center animate-hero-breathe"
        style={{ 
           animationDuration: `${speed}s`,
           width: '100%', 
           height: '100%'
        }}
      >
        {/* Step B: Apply 'Scaling' here (Zoom In/Out) */}
        <div 
           className="flex items-center justify-center"
           style={{ 
              transform: `scale(${scale})`, 
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
           }}
        >
           {render_type === 'COMPONENT' && (
             <div className="flex items-center justify-center">
                {ComponentMap[visual_key] || <LucideIcons.Sparkles size={80} className="text-white opacity-20" />}
             </div>
           )}

           {render_type === 'IMAGE' && image_url && (
             <img src={image_url} className="max-w-[280px] max-h-[280px] object-contain drop-shadow-2xl" alt="Festival" />
           )}
        </div>
      </div>
    </div>
  );
}
