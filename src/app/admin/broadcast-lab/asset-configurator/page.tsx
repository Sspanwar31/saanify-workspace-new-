'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Save, Loader2, Image as ImageIcon, Box, Zap, Palette, Wind, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroFactory from '@/components/festival/v2/HeroFactory';

// 🚀 1. MASTER FESTIVAL LIST (DB ke hisab se)
const FESTIVAL_LIST = [
  "DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "INDEPENDENCE_DAY",
  "MAHASHIVRATRI", "DUSSEHRA", "NAVRATRI", "DURGA_PUJA", "GANESH_CHATURTHI", "RAKSHA_BANDHAN",
  "MAKAR_SANKRANTI", "LOHRI", "RAM_NAVAMI", "HANUMAN_JAYANTI", "KARWA_CHAUTH", "CHHATH_PUJA",
  "GURU_NANAK_JAYANTI", "PONGAL", "EID_UL_FITR", "EID_AL_ADHA"
];

// 🚀 2. MASTER DESIGN OPTIONS (Extracted from your DB Data)
const BACKGROUND_STYLES = [
  "FIRE", "SOFT_GOLD", "SOFT_PINK", "WINTER", "DARK_GOLD", "ROYAL_BLUE", 
  "DIVINE_RED", "SAFFRON", "DIVINE_LIGHT", "EMERALD", "SKY", "RAINBOW", 
  "NIGHT", "ORANGE_RED", "GOLD", "TRICOLOR", "HARVEST_GOLD", "SUNSET", "DARK_BLUE"
];

const OVERLAY_EFFECTS = [
  "FIRE_EMBERS", "ROMANTIC_LIGHTS", "THREAD_GLOW", "SNOW_PARTICLES", 
  "FLOATING_LIGHTS", "PEACOCK_PARTICLES", "DIVINE_AURA", "GOLDEN_AURA", 
  "COLOR_BURST", "LOTUS_PARTICLES", "SPARKLES", "GOLDEN_PARTICLES", 
  "RED_GOLD_PARTICLES", "LIGHT_RAYS", "MOON_GLOW", "WIND_EFFECT", 
  "FLYING_KITES", "SMOKE_GLOW", "BLUE_AURA", "FLOATING_GRAINS", 
  "HARVEST_SPARKS", "FLAG_MOTION", "COUNTDOWN", "CONFETTI_BLAST", 
  "WATER_GLOW", "SUNRISE_RAYS", "LOTUS_GLOW", "LIGHT_STREAKS", 
  "DIVINE_LIGHT", "STAR_SPARKLES", "VICTORY_RAYS", "FIRE_SPARKS", 
  "DIVINE_SPARKLES", "GOLDEN_LIGHT", "FLYING_PARTICLES", "TRICOLOR_WAVES"
];

// 🚀 3. 24 FESTIVALS VISUAL KEYS (Mapped from DB 'visual_key' column)
const VISUAL_COMPONENTS = [
  { label: "Royal Diya (Diwali)", value: "ROYAL_DIYA" },
  { label: "Holi Vibrant Palette", value: "VIBRANT_PALETTE" },
  { label: "Ganesha Murti", value: "GANESH_MURTI" },
  { label: "Maa Durga", value: "MAA_DURGA" },
  { label: "Durga Face Art", value: "DURGA_FACE_ART" },
  { label: "Ashoka Chakra", value: "ASHOKA_CHAKRA" },
  { label: "Christmas Tree", value: "CHRISTMAS_TREE" },
  { label: "Ravan Dahan", value: "RAVAN_DAHAN" },
  { label: "Lord Ram", value: "LORD_RAM" },
  { label: "Ganga Ghat Diya", value: "GANGA_GHAT_DIYA" },
  { label: "Kaaba Silhouette (Eid)", value: "KAABA_SILHOUETTE" },
  { label: "Khanda", value: "KHANDA" },
  { label: "Flying Kites", value: "KITES" },
  { label: "Shiva Trishul Damru", value: "SHIVA_TRISHUL_DAMRU" },
  { label: "Sugarcane Pot (Pongal)", value: "SUGARCANE_POT" },
  { label: "Waving Tricolor", value: "WAVING_TRICOLOR" },
  { label: "Golden Clock 2027", value: "GOLDEN_CLOCK_2027" },
  { label: "Sun Arghya (Chhath)", value: "SUN_ARGHYA" },
  { label: "Hanuman Face", value: "HANUMAN_FACE" },
  { label: "Mosque Crescent", value: "MOSQUE_CRESCENT" },
  { label: "Premium Rakhi", value: "PREMIUM_RAKHI" },
  { label: "Full Moon Sieve", value: "FULL_MOON_SIEVE" },
  { label: "Real Bonfire (Lohri)", value: "REAL_BONFIRE" }
];

export default function AssetConfigurator() {
  const [selectedKey, setSelectedKey] = useState('DIWALI');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🚀 V4 Master Config State
  const [config, setConfig] = useState({
    render_type: 'COMPONENT',
    visual_key: 'ROYAL_DIYA',
    image_url: '',
    scale: 1.2,
    speed: 4,
    icon_name: 'diya',
    background_style: 'DARK_GOLD',
    overlay_effect: 'GOLDEN_AURA',
    animation: 'float' // Added animation field
  });

  // 🔄 FETCH DATA FROM DB (Auto-Load Logic)
  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      const { data } = await supabase.from('festival_assets_v2').select('*').eq('festival_key', selectedKey).maybeSingle();
      
      if (data) {
        // Parse JSON configs
        const dbHero = typeof data.hero_config === 'string' ? JSON.parse(data.hero_config) : (data.hero_config || {});
        const dbTheme = typeof data.theme_config === 'string' ? JSON.parse(data.theme_config) : (data.theme_config || {});

        // Merge DB Data into State (Priority to DB)
        setConfig(prevConfig => ({
          ...prevConfig,
          render_type: dbHero.render_type || 'COMPONENT',
          visual_key: dbHero.visual_key || 'ROYAL_DIYA',
          image_url: dbHero.image_url || '',
          scale: dbHero.scale || 1.2,
          speed: dbHero.speed || 4,
          icon_name: dbHero.icon_name || 'diya',
          background_style: dbTheme.background_style || 'DARK_GOLD',
          overlay_effect: dbHero.overlay || 'GOLDEN_AURA',
          animation: dbHero.animation || 'float'
        }));
      }
      setLoading(false);
    }
    fetchAsset();
  }, [selectedKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        festival_key: selectedKey,
        hero_config: {
            render_type: config.render_type,
            visual_key: config.render_type === 'COMPONENT' ? config.visual_key : undefined,
            image_url: config.render_type === 'IMAGE' ? config.image_url : undefined,
            icon_name: config.render_type === 'LUCIDE' ? config.icon_name : undefined,
            scale: config.scale,
            speed: config.speed,
            overlay: config.overlay_effect,
            animation: config.animation
        },
        theme_config: { 
            background_style: config.background_style, 
            font_family: 'Poppins' 
        }
      };

      const res = await fetch('/api/admin/festival-assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) toast.success(`${selectedKey} Design Updated!`);
      else toast.error("Error updating config");
    } catch (e) { 
        console.error(e);
        toast.error("Database Sync Error"); 
    }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen font-sans selection:bg-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Design Studio <span className="text-blue-600">V4</span></h1>
          <p className="text-slate-500 text-sm mt-1">Smart Asset Configurator & Preview Engine</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 border-blue-200 text-blue-600 font-bold">LIVE DB SYNC</Badge>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: MASTER CONTROLS (Width 5/12) */}
        <Card className="lg:col-span-5 shadow-xl rounded-[2rem] bg-white border-none overflow-hidden sticky top-8">
          <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">🎨 Appearance Controls</CardTitle>
            <Zap className="w-5 h-5 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            
            {/* 1. Festival Picker */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Festival</label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 font-bold text-lg focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select Festival..." />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {FESTIVAL_LIST.map(f => (
                    <SelectItem key={f} value={f} className="font-medium">
                      {f.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Auto-Layout Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1"><Palette className="w-3 h-3"/> Background</label>
                    <Select value={config.background_style} onValueChange={(v) => setConfig({...config, background_style: v})}>
                        <SelectTrigger className="rounded-xl h-12 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>{BACKGROUND_STYLES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-purple-600 flex items-center gap-1"><Wind className="w-3 h-3"/> Particles</label>
                    <Select value={config.overlay_effect} onValueChange={(v) => setConfig({...config, overlay_effect: v})}>
                        <SelectTrigger className="rounded-xl h-12 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>{OVERLAY_EFFECTS.map(o => <SelectItem key={o} value={o}>{o.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            {/* 3. Render Mode Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Hero Render Mode</label>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                 {['COMPONENT', 'IMAGE', 'LUCIDE'].map((m) => (
                   <Button key={m} 
                     variant={config.render_type === m ? 'default' : 'ghost'} 
                     size="sm" 
                     className={`flex-1 rounded-xl h-10 font-bold text-xs transition-all ${config.render_type === m ? 'shadow-md scale-105' : 'hover:bg-white'}`}
                     onClick={() => setConfig({...config, render_type: m})}
                   >
                     {m}
                   </Button>
                 ))}
              </div>
            </div>

            {/* 4. Dynamic Configuration Panel */}
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-5">
                
                {/* COMPONENT MODE: 24 Options */}
                {config.render_type === 'COMPONENT' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">Select Visual Component</label>
                        <Select value={config.visual_key} onValueChange={(v) => setConfig({...config, visual_key: v})}>
                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-300">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {VISUAL_COMPONENTS.map(c => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* IMAGE MODE: URL & Preview */}
                {config.render_type === 'IMAGE' && (
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-600">Image Asset URL</label>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Paste Image URL..." 
                                value={config.image_url} 
                                onChange={(e) => setConfig({...config, image_url: e.target.value})} 
                                className="h-12 rounded-xl bg-white border-slate-300" 
                            />
                        </div>
                        {/* LIVE PREVIEW THUMBNAIL */}
                        {config.image_url && (
                            <div className="relative w-full h-40 bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
                                <img src={config.image_url} alt="Preview" className="w-full h-full object-contain bg-black" />
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">PREVIEW</div>
                            </div>
                        )}
                    </div>
                )}

                {/* LUCIDE MODE: Icon Selection */}
                {config.render_type === 'LUCIDE' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">Select Lucide Icon</label>
                        <Select value={config.icon_name} onValueChange={(v) => setConfig({...config, icon_name: v})}>
                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-300">
                                <SelectValue placeholder="Select Symbol" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {["flame", "palette", "feather", "flower2", "star", "moon", "sun", "flag", "zap", "target", "sparkles", "heart", "wind", "sprout", "infinity", "plane", "gift"].map(i => (
                                    <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="h-px bg-slate-200 my-4"></div>

                {/* SCALE & SPEED SLIDERS */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-[10px] font-bold text-slate-500">SIZE SCALE</label>
                            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 rounded">{config.scale.toFixed(1)}x</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.1" 
                            max="3.5" 
                            step="0.1" 
                            value={config.scale} 
                            onChange={(e) => setConfig({...config, scale: parseFloat(e.target.value)})} 
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                            <span>TINY (0.1)</span>
                            <span>HUGE (3.5)</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                         <div className="flex justify-between">
                            <label className="text-[10px] font-bold text-slate-500">ANIMATION SPEED</label>
                            <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 rounded">{config.speed}s</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="15" 
                            step="1" 
                            value={config.speed} 
                            onChange={(e) => setConfig({...config, speed: parseInt(e.target.value)})} 
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                        />
                    </div>
                </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl text-lg font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-95">
              {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-5 h-5" />}
              {saving ? 'SYNCING...' : 'APPLY TO PRODUCTION'}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: LIVE STUDIO PREVIEW (Width 7/12) */}
        <Card className="lg:col-span-7 rounded-[3rem] bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden min-h-[700px] shadow-2xl border-4 border-white/10">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
           
           {loading ? (
             <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
                <p className="text-slate-400 text-sm animate-pulse">Loading Assets...</p>
             </div>
           ) : (
             <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                
                {/* 🚀 LIVE HERO PREVIEW */}
                {/* Passing scale directly to HeroFactory to ensure it works */}
                <div className="relative z-10 transform transition-transform duration-300" style={{ transform: `scale(${config.scale})` }}>
                   <HeroFactory config={config} themeColor="#fbbf24" />
                </div>
                
                {/* Overlay Info */}
                <div className="absolute bottom-8 text-center z-50 pointer-events-none space-y-2">
                   <h2 className="text-white text-6xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                       {selectedKey.replace('_', ' ')}
                   </h2>
                   <div className="flex justify-center gap-2">
                     <Badge className="bg-white/10 backdrop-blur-md border border-white/20 text-white/90 px-4 py-1.5 tracking-[4px] text-[10px] font-bold rounded-full">
                        {config.background_style}
                     </Badge>
                     <Badge className="bg-blue-600/20 backdrop-blur-md border border-blue-500/30 text-blue-400 px-4 py-1.5 tracking-[4px] text-[10px] font-bold rounded-full">
                        {config.render_type}
                     </Badge>
                   </div>
                </div>

                {/* Background Effect Visualization (Simulated) */}
                <div className="absolute inset-0 pointer-events-none" 
                     style={{
                        background: `radial-gradient(circle at center, ${config.background_style === 'RAINBOW' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.4)'} 0%, transparent 70%)`
                     }}
                />
             </div>
           )}
        </Card>
      </div>
    </div>
  );
}
