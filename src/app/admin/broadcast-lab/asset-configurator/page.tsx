'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Loader2, Image as ImageIcon, Box, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroFactory from '@/components/festival/v2/HeroFactory';

const FESTIVAL_LIST = ["DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "MAHASHIVRATRI", "EID_UL_FITR"];

export default function AssetConfigurator() {
  const [selectedKey, setSelectedKey] = useState('DIWALI');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🚀 V3 Logic State (Added speed: 4)
  const [config, setConfig] = useState({
    render_type: 'COMPONENT',
    visual_key: 'ROYAL_DIYA',
    image_url: '',
    scale: 1.2,
    speed: 4, // 🚀 NEW: Default Speed
    glow: { color: 'rgba(251, 191, 36, 0.4)' }
  });

  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      const { data } = await supabase.from('festival_assets_v2').select('*').eq('festival_key', selectedKey).maybeSingle();
      if (data?.hero_config) {
        // DB format handling
        const dbConfig = typeof data.hero_config === 'string' ? JSON.parse(data.hero_config) : data.hero_config;
        setConfig({
          render_type: dbConfig.render_type || 'COMPONENT',
          visual_key: dbConfig.visual_key || dbConfig.component_key || 'SPARKLES',
          image_url: dbConfig.image_url || '',
          scale: dbConfig.scale || 1.2,
          speed: dbConfig.speed || 4, // 🚀 NEW: Load speed from DB or default to 4
          glow: dbConfig.glow || { color: 'rgba(255,255,255,0.2)' }
        });
      }
      setLoading(false);
    }
    fetchAsset();
  }, [selectedKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/festival-assets', {
        method: 'PATCH',
        body: JSON.stringify({
          festival_key: selectedKey,
          hero_config: config, // Ab isme speed bhi save hoga
          theme_config: { primary_color: config.glow.color.includes('rgba') ? '#fbbf24' : config.glow.color }
        })
      });
      if (res.ok) toast.success("V3 Configuration Live!");
    } catch (e) { toast.error("Sync Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-poppins">
      <h1 className="text-3xl font-black tracking-tighter">Studio V3: Universal Configurator</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side: Controls */}
        <Card className="shadow-2xl rounded-[2.5rem] bg-white overflow-hidden border-none">
          <CardHeader className="bg-slate-900 text-white p-6">
            <CardTitle>Design Engine</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            {/* 1. Target Festival */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Target Festival</label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 font-bold text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FESTIVAL_LIST.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Mode Selector */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400">Render Mode</label>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                 {['COMPONENT', 'LUCIDE', 'IMAGE'].map((m) => (
                   <Button 
                     key={m} 
                     variant={config.render_type === m ? 'default' : 'ghost'} 
                     className="flex-1 rounded-xl h-12 font-bold text-xs"
                     onClick={() => setConfig({
                       ...config, 
                       render_type: m, 
                       visual_key: m === 'COMPONENT' ? 'ROYAL_DIYA' : (m === 'LUCIDE' ? 'Sparkles' : '')
                     })}
                   >
                     {m === 'COMPONENT' && <Box className="w-4 h-4 mr-2"/>}
                     {m === 'LUCIDE' && <Zap className="w-4 h-4 mr-2"/>}
                     {m === 'IMAGE' && <ImageIcon className="w-4 h-4 mr-2"/>}
                     {m}
                   </Button>
                 ))}
              </div>
            </div>

            {/* 3. Inputs (Merged with Code 1 options) */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
               
               {/* Component Selector */}
               {config.render_type === 'COMPONENT' && (
                 <div className="space-y-2">
                    <label className="text-xs font-bold">Select Template</label>
                    <Select value={config.visual_key} onValueChange={(v) => setConfig({...config, visual_key: v})}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {/* 🚀 ADDED ALL PREMIUM COMPONENTS FROM CODE 1 */}
                            <SelectItem value="ROYAL_DIYA">Royal Diya 🪔</SelectItem>
                            <SelectItem value="GANESHA">Lord Ganesha 🐘</SelectItem>
                            <SelectItem value="MAA_DURGA">Maa Durga 🔱</SelectItem>
                            <SelectItem value="VIBRANT_PALETTE">Holi Colors 🎨</SelectItem>
                            <SelectItem value="ASHOKA_CHAKRA">Ashoka Chakra 🇮🇳</SelectItem>
                            <SelectItem value="CHRISTMAS_TREE">Christmas Tree 🎄</SelectItem>
                            <SelectItem value="CRESCENT_MOON">Eid Moon 🌙</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
               )}

               {/* Lucide Input */}
               {config.render_type === 'LUCIDE' && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold">Try typing: Flame, Star, Rocket, Crown, Gift</label>
                    <Input 
                      placeholder="Icon Name..." 
                      value={config.visual_key} 
                      onChange={(e) => setConfig({...config, visual_key: e.target.value})} 
                    />
                 </div>
               )}

               {/* Image Input */}
               {config.render_type === 'IMAGE' && (
                 <div className="space-y-2">
                    <label className="text-xs font-bold">Image URL (Direct Link)</label>
                    <Input 
                      placeholder="Paste Image URL here..." 
                      value={config.image_url} 
                      onChange={(e) => setConfig({...config, image_url: e.target.value})} 
                    />
                 </div>
               )}

               {/* 🚀 UPDATED: Sliders Section (Scale + Speed) */}
               <div className="space-y-4 border-t pt-6">
                  
                  {/* SCALE SLIDER */}
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase">Icon Scale: {config.scale}x</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.5" 
                      step="0.1" 
                      value={config.scale} 
                      onChange={(e) => setConfig({...config, scale: parseFloat(e.target.value)})} 
                      className="w-1/2 accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                    />
                  </div>

                  {/* 🚀 NEW: SPEED SLIDER */}
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase">Breathe Speed: {config.speed}s</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1" 
                      value={config.speed || 4} 
                      onChange={(e) => setConfig({...config, speed: parseInt(e.target.value)})} 
                      className="w-1/2 accent-orange-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Lower is faster, Higher is slower (Smoother).</p>
               </div>

            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-xl font-black shadow-xl transition-all">
              {saving ? <Loader2 className="animate-spin" /> : 'SAVE TO CLOUD DATABASE'}
            </Button>
          </CardContent>
        </Card>

        {/* Right Side: Universal Preview (From Code 2) */}
        <Card className="rounded-[3rem] bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden h-[650px] shadow-2xl">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e2d7a_0%,transparent 70%)] opacity-40" />
           
           {loading ? (
             <Loader2 className="animate-spin text-blue-600 w-12 h-12" /> 
           ) : (
             <div className="relative z-10 flex flex-col items-center w-full">
                <div className="mb-12">
                   {/* Rendering the Visual */}
                   <HeroFactory config={config} />
                </div>
                <div className="text-center px-4">
                   <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase">{selectedKey}</h2>
                   <p className="text-blue-400 text-[10px] font-black uppercase tracking-[5px] mt-4">V3 Universal Engine</p>
                </div>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
}
