'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Save, Loader2, Palette, Wind, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroFactory from '@/components/festival/v2/HeroFactory';

// 🚀 1. SAARE 24 FESTIVALS (Database Keys)
const FESTIVAL_LIST = ["DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "INDEPENDENCE_DAY", "MAHASHIVRATRI", "DUSSEHRA", "NAVRATRI", "DURGA_PUJA", "GANESH_CHATURTHI", "RAKSHA_BANDHAN", "MAKAR_SANKRANTI", "LOHRI", "RAM_NAVAMI", "HANUMAN_JAYANTI", "KARWA_CHAUTH", "CHHATH_PUJA", "GURU_NANAK_JAYANTI", "ONAM", "PONGAL", "EID_UL_FITR", "EID_AL_ADHA", "DEV_DEEPAWALI"];

// 🚀 2. MASTER ANIMATION THEMES (Updated List)
const ANIMATION_THEMES = ["GOLDEN_PARTICLES", "COLOR_SPLASH", "SNOW_FALL", "TRICOLOR_WAVES", "MOON_GLOW", "BLUE_AURA", "FIRE_EMBERS", "DIVINE_LIGHT", "DIVINE_GLOW", "TEMPLE_GLOW", "SUNRISE_RAYS", "HARVEST_SPARKS", "BONFIRE_SPARKS", "RED_GOLD_PARTICLES", "CONFETTI_BLAST", "SPARKLES", "WIND_EFFECT", "FLYING_KITES", "SMOKE_GLOW", "FLOATING_GRAINS", "FLAG_MOTION", "COUNTDOWN", "LIGHT_RAYS", "PEACOCK_PARTICLES", "THREAD_GLOW", "LOTUS_PARTICLES", "LOTUS_GLOW", "FIRE_SPARKS", "VICTORY_RAYS", "GOLDEN_LIGHT"];

// 🚀 3. MASTER VISUAL COMPONENTS
const VISUAL_COMPONENTS = [
  { label: "Royal Diya (Diwali)", value: "ROYAL_DIYA" },
  { label: "Holi Palette", value: "VIBRANT_PALETTE" },
  { label: "Ganesha Murti", value: "ROYAL_GANESHA" },
  { label: "Maa Durga", value: "DIVINE_TRISHUL" },
  { label: "Christmas Tree", value: "XMAS_TREE" },
  { label: "Ashoka Chakra", value: "DHARMA_CHAKRA" },
  { label: "Baby Krishna", value: "BABY_KRISHNA" },
  { label: "Ravan Dahan", value: "RAVAN_DAHAN" },
  { label: "Brother Bond", value: "BROTHER_BOND" },
  { label: "Kites Flying", value: "KITES_FLYING" },
  { label: "Real Bonfire", value: "REAL_BONFIRE" },
  { label: "Shiva Power", value: "SHIVA_POWER" },
  { label: "Ram Dharma", value: "RAM_DHARMA" },
  { label: "Hanuman Gada", value: "HANUMAN_GADA" },
  { label: "Moon Sieve", value: "MOON_SIEVE" },
  { label: "Sun Arghya", value: "SUN_ARGHYA" },
  { label: "Harvest Pot", value: "HARVEST_POT" },
  { label: "Eid Mubarak", value: "EID_MUBARAK" },
  { label: "Holy Kaaba", value: "HOLY_KAABA" },
  { label: "NY Countdown", value: "NY_COUNTDOWN" },
  { label: "National Pride", value: "NATIONAL_PRIDE" },
  { label: "Sikh Khanda", value: "SIKH_KHANDA" }
];

// 🚀 4. MASTER AUTO PRESETS (Updated Logic)
const AUTO_PRESETS: any = {
  LOHRI: { bg: 'FIRE', anim: 'BONFIRE_SPARKS', comp: 'REAL_BONFIRE' },
  KARWA_CHAUTH: { bg: 'SOFT_GOLD', anim: 'ROMANTIC_LIGHTS', comp: 'MOON_SIEVE' },
  RAKSHA_BANDHAN: { bg: 'SOFT_PINK', anim: 'THREAD_GLOW', comp: 'BROTHER_BOND' },
  CHRISTMAS: { bg: 'WINTER', anim: 'SNOW_FALL', comp: 'CHRISTMAS_TREE' },
  DIWALI: { bg: 'DARK_GOLD', anim: 'GOLDEN_PARTICLES', comp: 'ROYAL_DIYA' },
  JANMASHTAMI: { bg: 'DARK_BLUE', anim: 'PEACOCK_PARTICLES', comp: 'BABY_KRISHNA' },
  DURGA_PUJA: { bg: 'DIVINE_RED', anim: 'RED_GOLD_PARTICLES', comp: 'MAA_DURGA' },
  RAM_NAVAMI: { bg: 'SAFFRON', anim: 'TEMPLE_GLOW', comp: 'LORD_RAM' },
  DEV_DEEPAWALI: { bg: 'DARK_GOLD', anim: 'SPARKLES', comp: 'GANGA_GHAT_DIYA' },
  NAVRATRI: { bg: 'RED_GOLD', anim: 'RED_GOLD_PARTICLES', comp: 'DURGA_FACE_ART' },
  EID_AL_ADHA: { bg: 'EMERALD', anim: 'MOON_GLOW', comp: 'KAABA_SILHOUETTE' },
  DUSSEHRA: { bg: 'ORANGE_RED', anim: 'VICTORY_RAYS', comp: 'RAVAN_DAHAN' },
  MAKAR_SANKRANTI: { bg: 'SKY', anim: 'WIND_EFFECT', comp: 'KITES_FLYING' },
  MAHASHIVRATRI: { bg: 'DARK_BLUE', anim: 'BLUE_AURA', comp: 'SHIVA_POWER' },
  PONGAL: { bg: 'HARVEST_GOLD', anim: 'HARVEST_SPARKS', comp: 'SUGARCANE_POT' },
  REPUBLIC_DAY: { bg: 'TRICOLOR', anim: 'FLAG_MOTION', comp: 'ASHOKA_CHAKRA' },
  NEW_YEAR: { bg: 'NIGHT', anim: 'CONFETTI_BLAST', comp: 'GOLDEN_CLOCK_2027' },
  CHHATH_PUJA: { bg: 'SUNSET', anim: 'SUNRISE_RAYS', comp: 'SUN_ARGHYA' },
  HOLI: { bg: 'RAINBOW', anim: 'COLOR_SPLASH', comp: 'VIBRANT_PALETTE' },
  GANESH_CHATURTHI: { bg: 'SAFFRON', anim: 'LOTUS_PARTICLES', comp: 'ROYAL_GANESHA' },
  INDEPENDENCE_DAY: { bg: 'TRICOLOR', anim: 'TRICOLOR_WAVES', comp: 'NATIONAL_PRIDE' },
  HANUMAN_JAYANTI: { bg: 'ORANGE', anim: 'DIVINE_LIGHT', comp: 'HANUMAN_FACE' },
  EID_UL_FITR: { bg: 'EMERALD', anim: 'MOON_GLOW', comp: 'EID_MUBARAK' },
  GURU_NANAK_JAYANTI: { bg: 'SOFT_GOLD', anim: 'GOLDEN_LIGHT', comp: 'SIKH_KHANDA' }
};

// Backgrounds needed for dropdown
const BACKGROUND_STYLES = ["FIRE", "SOFT_GOLD", "SOFT_PINK", "WINTER", "DARK_GOLD", "ROYAL_BLUE", "DIVINE_RED", "SAFFRON", "DIVINE_LIGHT", "EMERALD", "SKY", "RAINBOW", "NIGHT", "TRICOLOR", "HARVEST_GOLD", "SUNSET", "DARK_BLUE", "ORANGE_RED"];

export default function AssetConfigurator() {
  const [selectedKey, setSelectedKey] = useState('DIWALI');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🚀 FIXED STATE: Uses 'animation' key
  const [config, setConfig] = useState<any>({
    render_type: 'COMPONENT',
    visual_key: 'ROYAL_DIYA',
    image_url: '',
    scale: 1.2,
    speed: 4,
    background_style: 'DARK_GOLD',
    animation: 'GOLDEN_PARTICLES' // 👈 Fixed Key Name
  });

  // 🔄 handle Festival Selection (Presets are just a starting point)
  const handleFestivalChange = (key: string) => {
    setSelectedKey(key);
    const p = AUTO_PRESETS[key] || { bg: 'DARK_GOLD', anim: 'GOLDEN_PARTICLES', comp: 'ROYAL_DIYA' };
    
    setConfig((prev: any) => ({
      ...prev,
      visual_key: p.comp,
      background_style: p.bg,
      animation: p.anim
    }));
  };

  // 🔄 PRIORITY FETCH: Database data always overrides presets
  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      const { data } = await supabase.from('festival_assets_v2').select('*').eq('festival_key', selectedKey).maybeSingle();
      
      if (data) {
        const dbHero = typeof data.hero_config === 'string' ? JSON.parse(data.hero_config) : (data.hero_config || {});
        const dbTheme = typeof data.theme_config === 'string' ? JSON.parse(data.theme_config) : (data.theme_config || {});
      
        setConfig({
          render_type: dbHero.render_type || 'COMPONENT',
          visual_key: dbHero.visual_key || 'ROYAL_DIYA',
          image_url: dbHero.image_url || '',
          scale: dbHero.scale || 1.2,
          speed: dbHero.speed || 4,
          background_style: dbTheme.background_style || 'DARK_GOLD',
          animation: dbHero.animation || dbHero.overlay || 'GOLDEN_PARTICLES' // 🚀 Fetching correctly from DB
        });
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
        hero_config: config, // 🎯 Config now contains 'animation' key perfectly
        theme_config: { 
            background_style: config.background_style, 
            primary_color: config.background_style === 'SKY' ? '#38bdf8' : '#fbbf24' // Simple auto-color logic
        }
      };

      await fetch('/api/admin/festival-assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      toast.success(`${selectedKey} Design Updated!`);
    } catch (e) { toast.error("Database Sync Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-poppins">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: MASTER CONTROLS */}
        <Card className="lg:col-span-5 shadow-2xl rounded-[2rem] bg-white border-none overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6"><CardTitle className="text-lg">Design Controls</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-8">
            
            {/* Festival Selector with Auto-Logic */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Target Festival (Auto-Sync On)</label>
              <Select value={selectedKey} onValueChange={handleFestivalChange}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 font-bold text-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {FESTIVAL_LIST.map(f => <SelectItem key={f} value={f}>{f.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Layout Customization */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1"><Palette className="w-3 h-3"/> Background</label>
                    <Select value={config.background_style} onValueChange={(v) => setConfig({...config, background_style: v})}>
                        <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>{BACKGROUND_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-purple-600 flex items-center gap-1"><Wind className="w-3 h-3"/> Particles</label>
                    <Select value={config.animation} onValueChange={(v) => setConfig({...config, animation: v})}>
                        <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>{ANIMATION_THEMES.map(o => <SelectItem key={o} value={o}>{o.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            {/* Mode Specific Inputs */}
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6">
                
                {/* Mode Toggles */}
                <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
                    {['COMPONENT', 'IMAGE'].map((m) => (
                        <Button key={m} variant={config.render_type === m ? 'default' : 'ghost'} size="sm" className="flex-1 rounded-xl h-10 font-black text-[10px]"
                                onClick={() => setConfig({...config, render_type: m})}>{m}</Button>
                    ))}
                </div>

                {config.render_type === 'COMPONENT' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">Select Visual Component</label>
                        <Select value={config.visual_key} onValueChange={(v) => setConfig({...config, visual_key: v})}>
                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent className="max-h-80">
                                {VISUAL_COMPONENTS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {config.render_type === 'IMAGE' && (
                    <Input placeholder="Paste Image URL..." value={config.image_url} onChange={(e) => setConfig({...config, image_url: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200" />
                )}

                {/* Scale & Speed Sliders (Updated Ranges) */}
                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Size Scale: {config.scale}x</label>
                        <input type="range" min="0.1" max="2.5" step="0.1" value={config.scale} onChange={(e) => setConfig({...config, scale: parseFloat(e.target.value)})} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Speed: {config.speed}s</label>
                        <input type="range" min="1" max="15" step="1" value={config.speed} onChange={(e) => setConfig({...config, speed: parseInt(e.target.value)})} className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>
            </div>

            <Button onClick={handleSave} disabled={saving || loading} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-xl font-black shadow-xl">
              {saving ? <Loader2 className="animate-spin" /> : 'APPLY TO PRODUCTION'}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: LIVE STUDIO PREVIEW (Updated UI) */}
        <Card className="lg:col-span-7 rounded-[3.5rem] bg-black flex flex-col items-center justify-center relative overflow-hidden h-[750px] shadow-2xl border-4 border-white/10">
           {loading ? <Loader2 className="animate-spin text-blue-500 w-12 h-12" /> : (
             <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* 🚀 HeroFactory now receives 'animation' correctly in the config object */}
                <HeroFactory config={config} themeColor={config.background_style === 'SKY' ? '#38bdf8' : '#fbbf24'} />
                
                <div className="absolute bottom-12 text-center z-50 pointer-events-none space-y-4">
                   <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">{selectedKey.replace('_', ' ')}</h2>
                   <Badge className="bg-blue-600/20 text-blue-400 tracking-[5px] font-black py-1.5 px-6 rounded-full border-blue-500/30">V2 SYNC ACTIVE</Badge>
                </div>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
}
