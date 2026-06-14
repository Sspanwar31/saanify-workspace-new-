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

// 🚀 1. POORI 24 FESTIVALS KI MASTER LIST (Selection ke liye)
const FESTIVAL_LIST = [
  "DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "INDEPENDENCE_DAY",
  "MAHASHIVRATRI", "DUSSEHRA", "NAVRATRI", "DURGA_PUJA", "GANESH_CHATURTHI", "RAKSHA_BANDHAN",
  "MAKAR_SANKRANTI", "LOHRI", "RAM_NAVAMI", "HANUMAN_JAYANTI", "KARWA_CHAUTH", "CHHATH_PUJA",
  "GURU_NANAK_JAYANTI", "PONGAL", "EID_UL_FITR", "EID_AL_ADHA", "DEV_DEEPAWALI"
];

// 🚀 2. MASTER VISUAL COMPONENTS (Strictly Matching HeroFactory V4.2)
const VISUAL_COMPONENTS = [
  { label: "Royal Diya (Diwali)", value: "ROYAL_DIYA" },
  { label: "Ganga Ghat Diya (Dev Deepawali)", value: "GANGA_GHAT_DIYA" },
  { label: "Holi Vibrant Palette", value: "VIBRANT_PALETTE" },
  { label: "Royal Ganesha", value: "ROYAL_GANESHA" },
  { label: "Divine Trishul (Goddess)", value: "DIVINE_TRISHUL" },
  { label: "Christmas Tree", value: "XMAS_TREE" },
  { label: "Ashoka Chakra", value: "DHARMA_CHAKRA" },
  { label: "Dandiya Beat (Navratri)", value: "DANDIYA_BEAT" },
  { label: "Ravan Dahan (Dussehra)", value: "RAVAN_DAHAN" },
  { label: "Baby Krishna (Bansuri)", value: "BABY_KRISHNA" },
  { label: "Brother Bond (Rakhi)", value: "BROTHER_BOND" },
  { label: "Kites Flying", value: "KITES_FLYING" },
  { label: "Real Bonfire (Lohri)", value: "REAL_BONFIRE" },
  { label: "Shiva Power (Trishul)", value: "SHIVA_POWER" },
  { label: "Ram Dharma (Bow)", value: "RAM_DHARMA" },
  { label: "Hanuman Gada", value: "HANUMAN_GADA" },
  { label: "Moon Sieve (Karwa Chauth)", value: "MOON_SIEVE" },
  { label: "Sun Arghya (Chhath Puja)", value: "SUN_ARGHYA" },
  { label: "Harvest Pot (Pongal)", value: "HARVEST_POT" },
  { label: "Eid Mubarak (Moon)", value: "EID_MUBARAK" },
  { label: "Holy Kaaba", value: "HOLY_KAABA" },
  { label: "NY Countdown (Clock)", value: "NY_COUNTDOWN" },
  { label: "National Pride (India Gate)", value: "NATIONAL_PRIDE" },
  { label: "Sikh Khanda", value: "SIKH_KHANDA" }
];

// 🚀 3. AUTO-CONFIG PRESETS (Updated Master List - Step 1)
const AUTO_PRESETS: any = {
  DIWALI: { bg: 'DARK_GOLD', part: 'GOLDEN_PARTICLES', comp: 'ROYAL_DIYA' },
  HOLI: { bg: 'RAINBOW', part: 'COLOR_BURST', comp: 'VIBRANT_PALETTE' },
  JANMASHTAMI: { bg: 'ROYAL_BLUE', part: 'PEACOCK_PARTICLES', comp: 'BABY_KRISHNA' },
  CHRISTMAS: { bg: 'WINTER', part: 'SNOW_PARTICLES', comp: 'XMAS_TREE' },
  REPUBLIC_DAY: { bg: 'TRICOLOR', part: 'FLAG_MOTION', comp: 'DHARMA_CHAKRA' },
  INDEPENDENCE_DAY: { bg: 'TRICOLOR', part: 'FLAG_MOTION', comp: 'NATIONAL_PRIDE' },
  RAKSHA_BANDHAN: { bg: 'SOFT_PINK', part: 'THREAD_GLOW', comp: 'BROTHER_BOND' }, // 👈 Added
  MAKAR_SANKRANTI: { bg: 'SKY', part: 'WIND_EFFECT', comp: 'KITES_FLYING' },
  LOHRI: { bg: 'FIRE', part: 'FIRE_EMBERS', comp: 'REAL_BONFIRE' },
  MAHASHIVRATRI: { bg: 'DARK_BLUE', part: 'SMOKE_GLOW', comp: 'SHIVA_POWER' },
  DUSSEHRA: { bg: 'ORANGE_RED', part: 'FIRE_SPARKS', comp: 'RAVAN_DAHAN' },
  NAVRATRI: { bg: 'DIVINE_RED', part: 'LOTUS_PARTICLES', comp: 'DANDIYA_BEAT' },
  DURGA_PUJA: { bg: 'DIVINE_RED', part: 'DIVINE_AURA', comp: 'DIVINE_TRISHUL' },
  GANESH_CHATURTHI: { bg: 'SAFFRON', part: 'LOTUS_PARTICLES', comp: 'ROYAL_GANESHA' },
  RAM_NAVAMI: { bg: 'SAFFRON', part: 'GOLDEN_AURA', comp: 'RAM_DHARMA' },
  HANUMAN_JAYANTI: { bg: 'FIRE', part: 'DIVINE_LIGHT', comp: 'HANUMAN_GADA' },
  KARWA_CHAUTH: { bg: 'SOFT_GOLD', part: 'ROMANTIC_LIGHTS', comp: 'MOON_SIEVE' },
  CHHATH_PUJA: { bg: 'SUNSET', part: 'WATER_GLOW', comp: 'SUN_ARGHYA' },
  PONGAL: { bg: 'HARVEST_GOLD', part: 'FLOATING_GRAINS', comp: 'HARVEST_POT' },
  EID_UL_FITR: { bg: 'EMERALD', part: 'LIGHT_RAYS', comp: 'EID_MUBARAK' },
  EID_AL_ADHA: { bg: 'EMERALD', part: 'DIVINE_AURA', comp: 'HOLY_KAABA' },
  GURU_NANAK_JAYANTI: { bg: 'SOFT_GOLD', part: 'GOLDEN_LIGHT', comp: 'SIKH_KHANDA' },
  NEW_YEAR: { bg: 'NIGHT', part: 'COUNTDOWN', comp: 'NY_COUNTDOWN' },
  DEV_DEEPAWALI: { bg: 'DARK_GOLD', part: 'SPARKLES', comp: 'GANGA_GHAT_DIYA' }
};

// Added missing keys to support AUTO_PRESETS logic
const BACKGROUND_STYLES = ["FIRE", "SOFT_GOLD", "SOFT_PINK", "WINTER", "DARK_GOLD", "ROYAL_BLUE", "DIVINE_RED", "SAFFRON", "DIVINE_LIGHT", "EMERALD", "SKY", "RAINBOW", "NIGHT", "TRICOLOR", "HARVEST_GOLD", "SUNSET", "DARK_BLUE", "ORANGE_RED"];
const OVERLAY_EFFECTS = ["FIRE_EMBERS", "ROMANTIC_LIGHTS", "THREAD_GLOW", "SNOW_PARTICLES", "FLOATING_LIGHTS", "PEACOCK_PARTICLES", "DIVINE_AURA", "GOLDEN_AURA", "COLOR_BURST", "LOTUS_PARTICLES", "FLAG_MOTION", "COUNTDOWN", "LIGHT_RAYS", "SMOKE_GLOW", "FIRE_SPARKS", "TRICOLOR_WAVES", "GOLDEN_PARTICLES", "WIND_EFFECT", "DIVINE_LIGHT", "WATER_GLOW", "FLOATING_GRAINS", "SPARKLES"];

export default function AssetConfigurator() {
  const [selectedKey, setSelectedKey] = useState('DIWALI');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<any>({
    render_type: 'COMPONENT',
    visual_key: 'ROYAL_DIYA',
    image_url: '',
    scale: 1.2,
    speed: 4,
    background_style: 'DARK_GOLD',
    overlay_effect: 'GOLDEN_PARTICLES'
  });

  // 🔄 handle Festival Selection (Auto-Fill Logic - Step 3)
  const handleFestivalChange = (key: string) => {
    setSelectedKey(key);
    // Agar list mein festival mil jaye toh wo lo, warna Default Blue template dikhao
    const preset = AUTO_PRESETS[key] || { bg: 'ROYAL_BLUE', part: 'SPARKLES', comp: 'ROYAL_DIYA' };
    
    setConfig((prev: any) => ({
      ...prev,
      visual_key: preset.comp,
      background_style: preset.bg,
      overlay_effect: preset.part
    }));
  };

  // 🔄 Fetch actual settings from DB when festival key changes
  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      const { data } = await supabase.from('festival_assets_v2').select('*').eq('festival_key', selectedKey).maybeSingle();
      if (data?.hero_config) {
        const dbHero = typeof data.hero_config === 'string' ? JSON.parse(data.hero_config) : data.hero_config;
        const dbTheme = typeof data.theme_config === 'string' ? JSON.parse(data.theme_config) : (data.theme_config || {});
        
        setConfig({
          render_type: dbHero.render_type || 'COMPONENT',
          visual_key: dbHero.visual_key || dbHero.component_key || 'ROYAL_DIYA',
          image_url: dbHero.image_url || '',
          scale: dbHero.scale || 1.2,
          speed: dbHero.speed || 4,
          icon_name: dbHero.icon_name || 'diya',
          background_style: dbTheme.background_style || 'DARK_GOLD',
          overlay_effect: dbHero.overlay || 'GOLDEN_AURA'
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
        hero_config: { ...config, overlay: config.overlay_effect },
        theme_config: { background_style: config.background_style, font_family: 'Poppins' }
      };

      await fetch('/api/admin/festival-assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      toast.success(`${selectedKey} Config Updated!`);
    } catch (e) { toast.error("Error saving data"); }
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
                  {FESTIVAL_LIST.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
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
                    <Select value={config.overlay_effect} onValueChange={(v) => setConfig({...config, overlay_effect: v})}>
                        <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>{OVERLAY_EFFECTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            {/* Mode Specific Inputs */}
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6">
                
                {/* Mode Toggles */}
                <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
                    {['COMPONENT', 'IMAGE', 'LUCIDE'].map((m) => (
                        <Button key={m} variant={config.render_type === m ? 'default' : 'ghost'} size="sm" className="flex-1 rounded-xl h-10 font-black text-[10px]"
                                onClick={() => setConfig({...config, render_type: m})}>{m}</Button>
                    ))}
                </div>

                {config.render_type === 'COMPONENT' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">Select Visual Component</label>
                        <Select value={config.visual_key} onValueChange={(v) => setConfig({...config, visual_key: v})}>
                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 shadow-sm font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent className="max-h-80">
                                {VISUAL_COMPONENTS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {config.render_type === 'IMAGE' && (
                    <Input placeholder="Paste Image URL..." value={config.image_url} onChange={(e) => setConfig({...config, image_url: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200" />
                )}

                {/* Scaling & Speed */}
                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400">SCALE: {config.scale}x</label>
                        <input type="range" min="0.5" max="2.5" step="0.1" value={config.scale} onChange={(e) => setConfig({...config, scale: parseFloat(e.target.value)})} className="w-full accent-blue-600" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400">SPEED: {config.speed}s</label>
                        <input type="range" min="1" max="10" step="1" value={config.speed} onChange={(e) => setConfig({...config, speed: parseInt(e.target.value)})} className="w-full accent-orange-500" />
                    </div>
                </div>
            </div>

            <Button onClick={handleSave} disabled={saving || loading} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-xl font-black shadow-xl">
              {saving ? <Loader2 className="animate-spin" /> : 'APPLY TO PRODUCTION'}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: LIVE STUDIO PREVIEW */}
        <Card className="lg:col-span-7 rounded-[3.5rem] bg-black flex flex-col items-center justify-center relative overflow-hidden h-[750px] shadow-2xl border-4 border-white/10">
           {loading ? <Loader2 className="animate-spin text-blue-500 w-12 h-12" /> : (
             <div className="relative w-full h-full flex flex-col items-center justify-center">
                <HeroFactory config={config} themeColor="#fbbf24" />
                <div className="absolute bottom-12 text-center z-50 pointer-events-none space-y-4">
                   <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">{selectedKey.replace('_', ' ')}</h2>
                   <Badge className="bg-blue-600/20 text-blue-400 tracking-[5px] font-black py-1.5 px-6 rounded-full border-blue-500/30">V4.2 STUDIO READY</Badge>
                </div>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
}
