'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// 🚀 V2 ENGINES IMPORT
import AnimationFactory from '@/components/festival/v2/AnimationFactory';
import HeroFactory from '@/components/festival/v2/HeroFactory';
import { X, Sparkles, ShieldCheck, Trash2, RefreshCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BroadcastPreviewPage() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [allPreviews, setAllPreviews] = useState<any[]>([]); // 👈 List of all test broadcasts
  const [loading, setLoading] = useState(true);
  const [showTopBanner, setShowTopBanner] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);

  useEffect(() => { loadBroadcasts(); }, []);

  // ━━━ 1. LOAD ALL PREVIEWS ━━━
  const loadBroadcasts = async () => {
    try {
      const { data } = await supabase.from('broadcasts')
        .select('*')
        .eq('preview_mode', true)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setAllPreviews(data);
        setBroadcast(data[0]); // Default to latest
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // ━━━ 2. DELETE LOGIC (Clean up the table) ━━━
  const clearLabData = async () => {
    if(!confirm("Are you sure? This will delete ALL test previews from database.")) return;
    
    const { error } = await supabase.from('broadcasts').delete().eq('preview_mode', true);
    if (!error) {
      toast.success("Lab V2 Cleared!");
      setBroadcast(null);
      setAllPreviews([]);
    } else {
      toast.error("Failed to clear data");
    }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-bold animate-pulse">SAANIFY LAB V2 LOADING...</div>;
  
  if (!broadcast) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-white gap-4">
      <p>No active previews found in the Lab.</p>
      <Button onClick={loadBroadcasts} variant="outline">Retry <RefreshCw className="ml-2 w-4 h-4"/></Button>
    </div>
  );

  // ━━━ THEME LOGIC ━━━
  const themeColor = broadcast.theme_color || '#fbbf24';
  const themeGradient = `linear-gradient(135deg, ${themeColor} 0%, #4f46e5 100%)`;
  const msgParts = (broadcast.resolved_message || broadcast.message)?.split('|') || [];

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#020617] font-poppins">
      
      {/* 🚀 V2 ANIMATION ENGINE (Called from Factory) */}
      <AnimationFactory theme={broadcast.animation_theme} />

      {/* TOP SUCCESS BANNER */}
      {showTopBanner && (
        <div className="fixed top-0 left-0 w-full z-[100] py-4 px-6 animate-in slide-in-from-top duration-700 shadow-2xl"
          style={{ background: themeGradient }}>
          <p className="text-white font-black text-center uppercase italic drop-shadow-md">
             SAANIFY PARIVAR: {msgParts[0]}
          </p>
        </div>
      )}

      {/* 🚀 THE MASTER CARD */}
      {isCardVisible && (
        <div className="relative w-full max-w-md transition-all duration-1000 animate-in zoom-in-95">
          <div className="absolute -inset-2 rounded-[3rem] opacity-20 blur-2xl animate-pulse" style={{ background: themeGradient }} />
          
          <div className="relative bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
            
            {/* HERO SECTION */}
            <div className="relative w-full h-80 overflow-hidden flex items-center justify-center">
                {broadcast.image_url ? (
                  <img src={broadcast.image_url} className="w-full h-full object-cover pt-16 animate-hero-breathe" alt="Hero" />
                ) : (
                  /* 🚀 V2 HERO ENGINE (Called from Factory) */
                  <div className="scale-150 pt-16">
                     <HeroFactory visual={broadcast.hero_visual} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent" />
            </div>

            {/* CONTENT */}
            <div className="p-8 text-center -mt-16 relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-2xl flex items-center justify-center border-4 border-slate-950 mb-6 rotate-3">
                 <ShieldCheck className="w-10 h-10 text-blue-900" strokeWidth={3} />
              </div>

              <h1 className="text-4xl font-black uppercase italic mb-4" style={{ color: themeColor }}>
                {broadcast.resolved_title?.split('|')[0] || broadcast.title}
              </h1>
              
              <p className="text-slate-300 text-lg font-bold leading-tight opacity-90 px-4">
                {msgParts[0]}
              </p>

              <Button 
                onClick={() => { setShowTopBanner(true); setIsCardVisible(false); }}
                className="w-full h-16 mt-8 rounded-[2rem] text-2xl font-black text-white shadow-2xl transition-all hover:scale-105"
                style={{ background: themeGradient }}
              >
                CELEBRATE NOW 🚀
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ 🛠️ LAB V2 ADMIN TOOLBAR (Bottom Fixed) ━━━ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl">
         
         {/* Switch Previews */}
         <div className="flex items-center gap-2 px-3 border-r border-white/10 mr-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <select 
              className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
              onChange={(e) => setBroadcast(allPreviews.find(p => p.id === e.target.value))}
            >
              {allPreviews.map((p, idx) => (
                <option key={p.id} value={p.id} className="bg-slate-900">Preview #{allPreviews.length - idx} ({p.festival_key})</option>
              ))}
            </select>
         </div>

         {/* Refresh Button */}
         <Button variant="ghost" size="icon" onClick={loadBroadcasts} className="text-white hover:bg-white/10">
            <RefreshCw className="w-4 h-4" />
         </Button>

         {/* CLEAR ALL BUTTON */}
         <Button 
            onClick={clearLabData}
            className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 rounded-xl px-4 py-2 flex items-center gap-2 transition-all font-bold text-xs"
         >
            <Trash2 className="w-4 h-4" /> Clear Lab V2 Data
         </Button>

         <button onClick={() => window.history.back()} className="p-2 text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
      </div>

      <style jsx global>{`
        @keyframes hero-breathe {
          0%, 100% { transform: scale(1.4); }
          50% { transform: scale(1.6); }
        }
        .animate-hero-breathe { animation: hero-breathe 4s infinite ease-in-out; }
      `}</style>
    </div>
  );
}
