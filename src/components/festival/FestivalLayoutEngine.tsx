'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FestivalAnimationEngine from './FestivalAnimationEngine';

// =========================================================
// 1. MASTER WRAPPER (Size & Structure Fix)
// =========================================================
const TemplateWrapper = ({ children, broadcast, onDismiss }: any) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#050a1f]/80 backdrop-blur-md">
      
      {/* 🚀 Background Animation Engine (Particles, Smoke, Snow) */}
      <FestivalAnimationEngine animationTheme={broadcast.animation_theme} />

      {/* 🚀 FIXED SIZE CARD: PC par stable aur Mobile par auto-fit */}
      <div className="relative w-full max-w-[440px] bg-[#1a1a2e]/80 backdrop-blur-2xl border border-white/20 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Close Button */}
        <button onClick={onDismiss} className="absolute top-5 right-6 z-50 text-white/50 hover:text-white transition-colors">
          <X className="w-7 h-7" />
        </button>

        {children}

        {/* Footer Branding */}
        <div className="pb-6 text-center">
            <p className="text-[9px] uppercase tracking-[4px] text-white/20 font-black">
                Premium Saanify Experience
            </p>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// 2. COMPONENT LOGIC FOR EACH STYLE
// =========================================================

export default function FestivalLayoutEngine({ layoutTemplate, broadcast, onDismiss }: any) {
  
  // Helper for Messages
  const title = broadcast.resolved_title || broadcast.title;
  const message = broadcast.resolved_message || broadcast.message;

  switch (layoutTemplate) {
    
    // --- DIWALI / LIGHT STYLE ---
    case 'LIGHT_TEMPLATE':
      return (
        <TemplateWrapper broadcast={broadcast} onDismiss={onDismiss}>
          <div className="relative w-full h-[280px] bg-slate-800">
             <img src={broadcast.image_url} className="w-full h-full object-cover" alt="Hero" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent" />
          </div>
          <div className="p-10 text-center -mt-16 relative z-10 space-y-6">
            <div className="w-20 h-20 mx-auto bg-amber-500 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 border-4 border-white/10">
               <span className="text-5xl">🪔</span>
            </div>
            <h1 className="text-4xl font-black text-amber-400 uppercase italic tracking-tighter drop-shadow-md">{title}</h1>
            <p className="text-slate-300 text-sm leading-relaxed px-2 italic font-medium">{message}</p>
            <Button onClick={onDismiss} className="w-full h-14 bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-2xl text-xl font-bold shadow-lg">CELEBRATE 🪔</Button>
          </div>
        </TemplateWrapper>
      );

    // --- HOLI / COLOR STYLE ---
    case 'COLOR_TEMPLATE':
      return (
        <TemplateWrapper broadcast={broadcast} onDismiss={onDismiss}>
          <div className="relative w-full h-[280px] bg-slate-800">
             <img src={broadcast.image_url} className="w-full h-full object-cover" alt="Hero" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent" />
          </div>
          <div className="p-10 text-center -mt-16 relative z-10 space-y-6">
            <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl -rotate-6">
               <span className="text-5xl">🎨</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">{title}</h1>
            <p className="text-white/80 text-sm leading-relaxed px-4 font-bold">{message}</p>
            <Button onClick={onDismiss} className="w-full h-14 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white rounded-2xl text-xl font-bold shadow-xl">PLAY COLORS 🌈</Button>
          </div>
        </TemplateWrapper>
      );

    // --- CHRISTMAS / WINTER STYLE ---
    case 'CHRISTMAS_TEMPLATE':
      return (
        <TemplateWrapper broadcast={broadcast} onDismiss={onDismiss}>
          <div className="relative w-full h-[280px] bg-red-900">
             <img src={broadcast.image_url} className="w-full h-full object-cover" alt="Hero" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#b71c1c] via-transparent" />
          </div>
          <div className="p-10 text-center -mt-16 relative z-10 space-y-6">
            <div className="w-20 h-20 mx-auto bg-white rounded-3xl flex items-center justify-center shadow-2xl">
               <span className="text-5xl">🎄</span>
            </div>
            <h1 className="text-4xl font-black text-white drop-shadow-2xl">{title}</h1>
            <p className="text-white/90 text-sm italic">{message}</p>
            <Button onClick={onDismiss} className="w-full h-14 bg-white text-red-600 rounded-2xl text-xl font-black hover:bg-slate-100">MERRY CHRISTMAS ❄️</Button>
          </div>
        </TemplateWrapper>
      );

    // --- NATIONAL / PRIDE STYLE ---
    case 'NATIONAL_TEMPLATE':
      return (
        <TemplateWrapper broadcast={broadcast} onDismiss={onDismiss}>
          <div className="relative w-full h-[280px] bg-orange-600">
             <img src={broadcast.image_url} className="w-full h-full object-cover" alt="Hero" />
             <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent" />
          </div>
          <div className="p-10 text-center -mt-16 relative z-10 space-y-6">
            <div className="w-20 h-20 mx-auto bg-[#064e3b] rounded-full flex items-center justify-center border-4 border-white shadow-2xl animate-pulse">
               <span className="text-5xl">🇮🇳</span>
            </div>
            <h1 className="text-4xl font-black text-[#064e3b] uppercase tracking-tighter">{title}</h1>
            <p className="text-slate-700 text-sm font-bold leading-relaxed">{message}</p>
            <Button onClick={onDismiss} className="w-full h-14 bg-[#138808] text-white rounded-2xl text-xl font-black shadow-lg">JAI HIND 🫡</Button>
          </div>
        </TemplateWrapper>
      );

    default:
      return null;
  }
}
