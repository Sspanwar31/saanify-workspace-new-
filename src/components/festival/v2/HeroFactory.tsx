'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import RoyalDiya from '../heroes/RoyalDiya';
import GaneshaHero from '../heroes/GaneshaHero';
import DurgaHero from '../heroes/DurgaHero';
import MagicPichkari from '../heroes/MagicPichkari'; // 🚀 FIXED: Imported MagicPichkari instead of HoliPalette
import AshokaChakra from '../heroes/AshokaChakra';
import ChristmasHero from '../heroes/ChristmasHero';
import MoonHero from '../heroes/MoonHero';
import SunGlow from '../engines/effects/SunGlow'; 
import RakhiHero from '../heroes/RakhiHero'; // 🚀 नया: राखी हीरो इम्पोर्ट करें

import Crystal2027Hero from '../heroes/Crystal2027Hero'; // 🚀 
// 🚀 नाम सुधार दिया गया है (VALENTINESDAY की जगह GlassmorphicHeartHero किया गया)
import GlassmorphicHeartHero from '../heroes/GlassmorphicHeartHero';  


// ━━━ MASTER COMPONENT MAP (Moved outside for Performance) ━━━
const ComponentMap: any = {
  'ROYAL_DIYA': <RoyalDiya />,
  'GANESHA': <GaneshaHero />,
  'ROYAL_GANESHA': <GaneshaHero />,
  'MAA_DURGA': <DurgaHero />,
  'DIVINE_TRISHUL': <DurgaHero />,
  'VIBRANT_PALETTE': <MagicPichkari />, // 🚀 FIXED: Holi now renders the premium 3D MagicPichkari!
  'ASHOKA_CHAKRA': <AshokaChakra />,
  'DHARMA_CHAKRA': <AshokaChakra />,
  'CHRISTMAS_TREE': <ChristmasHero />,
  'XMAS_TREE': <ChristmasHero />,
  'MOON_HERO': <MoonHero />,
  'CRESCENT_MOON': <MoonHero />,
  'EID_MUBARAK': <MoonHero />, 
  'GANGA_GHAT_DIYA': <RoyalDiya />,
  'DANDIYA_BEAT': <span className="text-[110px] drop-shadow-2xl">🥁</span>,
  'RAVAN_DAHAN': <span className="text-[110px] drop-shadow-2xl">🏹</span>,
  'BABY_KRISHNA': <span className="text-[110px] drop-shadow-2xl">🪈</span>,
  'BROTHER_BOND': <RakhiHero />, // 🚀 अब गिफ्ट की जगह हमारी खुद की प्रोग्राम्ड राखी रेंडर होगी!
  'KITES_FLYING': <span className="text-[110px] drop-shadow-2xl">🪁</span>,
  'REAL_BONFIRE': <span className="text-[110px] drop-shadow-2xl">🔥</span>,
  'SHIVA_POWER': <span className="text-[110px] drop-shadow-2xl">🔱</span>,
  'RAM_DHARMA': <span className="text-[110px] drop-shadow-2xl">🏹</span>,
  'HANUMAN_GADA': <span className="text-[110px] drop-shadow-2xl">🪓</span>, 
  'MOON_SIEVE': <span className="text-[110px] drop-shadow-2xl">🌕</span>,
  'SUN_ARGHYA': <SunGlow />, 
  'SUN_GOD': <SunGlow />,
  'HARVEST_POT': <span className="text-[110px] drop-shadow-2xl">🏺</span>,
  'HOLY_KAABA': <span className="text-[110px] drop-shadow-2xl">🕋</span>,
  'NY_COUNTDOWN':  <Crystal2027Hero />, // 🚀 अब घड़ी की जगह हमारा खुद का 3D क्रिस्टल 2027 रेंडर होगा!
  'NATIONAL_PRIDE': <span className="text-[110px] drop-shadow-2xl">🏛️</span>,
  'SIKH_KHANDA': <span className="text-[110px] drop-shadow-2xl">☬</span>,
 // 🚀 एक्टिवेशन कीज़: वैलेंटाइन और ग्लास हार्ट के लिए
  'VALENTINE_HEART': <GlassmorphicHeartHero onOpenLetter={() => {}} />,
  
 
  MEGAPHONE: <span className="text-[110px]">📢</span>,
  SIREN: <span className="text-[110px]">🚨</span>,
  GEAR_ICON: <span className="text-[110px]">⚙️</span>,
  TOOLS_ICON: <span className="text-[110px]">🛠️</span>,
  GIFT_BOX: <span className="text-[110px]">🎁</span>,
  CALENDAR_STAR: <span className="text-[110px]">📅</span>,  
};

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
  const { render_type, image_url, scale = 1, speed = 4 } = config;

  // Checks banner_visual_key first, falls back to visual_key
  const activeVisual = config.banner_visual_key || config.visual_key;

  if (minimal) {
    return (
      <div className="flex items-center justify-center">
        {render_type === 'COMPONENT' ? (
           <div className="scale-50 transform">
             {ComponentMap[activeVisual] || '✨'}
           </div>
        ) : render_type === 'IMAGE' && image_url ? (
           <img src={image_url} className="h-16 w-16 object-contain" alt="Festival" />
        ) : <span className="text-xl">🪔</span>}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-6 overflow-visible">
      
      {/* ✨ MASTER BRAND TAG (Absolute Corner) */}
      {!hideBranding && (
        <div className="absolute top-4 left-4 z-50 select-none pointer-events-none opacity-40">
            <span className="block text-[8px] font-black uppercase tracking-[0.8em] text-white leading-none italic">
                SAANIFY
            </span>
        </div>
      )}

      {/* 🌈 DYNAMIC FESTIVAL AURA */}
      <div className="absolute inset-0 blur-[100px] opacity-40 animate-pulse mix-blend-screen" 
           style={{ background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 75%)`, animationDuration: `${speed * 1.5}s` }} />
      
      {/* 🚀 THE HERO WRAPPER */}
      <div 
        className="relative z-10 flex items-center justify-center animate-hero-breathe pt-12"
        style={{ animationDuration: `${speed}s`, width: '100%', height: '100%' }}
      >
        <div className="flex items-center justify-center"
             style={{ transform: `scale(${scale})`, transition: 'transform 0.4s ease-out' }}>
           {render_type === 'COMPONENT' && (
             <div className="flex items-center justify-center">
                {ComponentMap[activeVisual] || <LucideIcons.Sparkles size={80} className="text-white opacity-20" />}
             </div>
           )}

           {render_type === 'IMAGE' && image_url && (
             <img src={image_url} className="max-w-[280px] max-h-[280px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" alt="Hero" />
           )}
        </div>
      </div>
    </div>
  );
}
