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

// 🚀 1. MASTER PRESETS (Isse Background aur Particles auto-select honge)
const MASTER_PRESETS: any = {
  DIWALI: { bg: 'DARK_GOLD', part: 'GOLDEN_PARTICLES', icon: 'ROYAL_DIYA' },
  HOLI: { bg: 'RAINBOW', part: 'COLOR_BURST', icon: 'GULAL_EXPLOSION' },
  JANMASHTAMI: { bg: 'ROYAL_BLUE', part: 'PEACOCK_PARTICLES', icon: 'BABY_KRISHNA' },
  CHRISTMAS: { bg: 'WINTER', part: 'SNOW_PARTICLES', icon: 'CHRISTMAS_TREE' },
  REPUBLIC_DAY: { bg: 'TRICOLOR', part: 'FLAG_MOTION', icon: 'ASHOKA_CHAKRA' },
  LOHRI: { bg: 'FIRE', part: 'FIRE_EMBERS', icon: 'REAL_BONFIRE' },
  NAVRATRI: { bg: 'DIVINE_RED', part: 'LOTUS_PARTICLES', icon: 'DURGA_FACE_ART' },
  EID_UL_FITR: { bg: 'EMERALD', part: 'LIGHT_RAYS', icon: 'MOSQUE_CRESCENT' },
  MAHASHIVRATRI: { bg: 'DARK_BLUE', part: 'SMOKE_GLOW', icon: 'SHIVA_TRISHUL_DAMRU' },
  NEW_YEAR: { bg: 'NIGHT', part: 'COUNTDOWN', icon: 'GOLDEN_CLOCK_2027' },
  // ... Baaki sab ke liye default 'SOFT_GOLD' aur 'GOLDEN_PARTICLES' set hai logic mein
};

// 🚀 2. POORE 24 FESTIVALS (Dropdown List)
const ALL_VISUAL_KEYS = [
  "ROYAL_DIYA", "GULAL_EXPLOSION", "DURGA_FACE_ART", "MAA_DURGA", "RAVAN_DAHAN", "GANESH_MURTI", 
  "BABY_KRISHNA", "PREMIUM_RAKHI", "KITES", "REAL_BONFIRE", "SHIVA_TRISHUL_DAMRU", "LORD_RAM", 
  "HANUMAN_FACE", "FULL_MOON_SIEVE", "SUN_ARGHYA", "SUGARCANE_POT", "MOSQUE_CRESCENT", 
  "KAABA_SILHOUETTE", "CHRISTMAS_TREE", "GOLDEN_CLOCK_2027", "ASHOKA_CHAKRA", "WAVING_TRICOLOR", 
  "GANGA_GHAT_DIYA", "KHANDA", "GEAR_ICON", "MEGAPHONE", "SIREN"
];

const BACKGROUND_STYLES = ["FIRE", "SOFT_GOLD", "SOFT_PINK", "WINTER", "DARK_GOLD", "ROYAL_BLUE", "DIVINE_RED", "SAFFRON", "DIVINE_LIGHT", "EMERALD", "SKY", "RAINBOW", "NIGHT", "TRICOLOR"];
const OVERLAY_EFFECTS = ["FIRE_EMBERS", "ROMANTIC_LIGHTS", "THREAD_GLOW", "SNOW_PARTICLES", "FLOATING_LIGHTS", "PEACOCK_PARTICLES", "DIVINE_AURA", "GOLDEN_AURA", "COLOR_BURST", "LOTUS_PARTICLES", "FLAG_MOTION", "COUNTDOWN", "LIGHT_RAYS", "SMOKE_GLOW"];

export default function AssetConfigurator() {
  const [selectedKey, setSelectedKey] = useState('DIWALI');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    render_type: 'COMPONENT',
    visual_key: 'ROYAL_DIYA',
    image_url: '',
    scale: 1.2,
    speed: 4,
    background_style: 'DARK_GOLD',
    overlay_effect: 'GOLDEN_PARTICLES'
  });

  // ━━━ 1. AUTOMATIC PRESET LOADER ━━━
  const handleFestivalChange = (key: string) => {
    setSelectedKey(key);
    const preset = MASTER_PRESETS[key] || { bg: 'SOFT_GOLD', part: 'GOLDEN_PARTICLES', icon: key };
    
    setConfig(prev => ({
      ...prev,
      visual_key: preset.icon,
      background_style: preset.bg,
      overlay_effect: preset.part
    }));
  };

  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      const { data } = await supabase.from('festival_assets_v2').select('*').eq('festival_key', selectedKey).maybeSingle();
      if (data?.hero_config) {
        const dbConfig = typeof data.hero_config === 'string' ? JSON.parse(data.hero_config) : data.hero_config;
        setConfig(prev => ({
          ...prev,
          ...dbConfig,
          background_style: data.theme_config?.background_style || prev.background_style
        }));
      }
      setLoading(false);
    }
    fetchAsset();
  }, [selectedKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/festival-assets', {
        method: 'PATCH',
        body: JSON.stringify({
          festival_key: selectedKey,
          hero_config: config,
          theme_config: { background_style: config.background_style }
        })
      });
      toast.success(`${selectedKey} Published!`);
    } catch (e) { toast.error("Sync Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-poppins">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT: MASTER CONTROLS */}
        <Card className="shadow-2xl rounded-[2.5rem] bg-white border-none overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6"><CardTitle>Studio V4.1 Controls</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-6">
            
            {/* Festival Picker with Auto-Logic */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Target Festival (Auto-Select On)</label>
              <Select value={selectedKey} onValueChange={handleFestivalChange}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 font-bold text-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.keys(MASTER_PRESETS).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Environment Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase">Background</label>
                    <Select value={config.background_style} onValueChange={(v) => setConfig({...config, background_style: v})}>
                        <SelectTrigger className="rounded-xl h-12 bg-blue-50/30 border-blue-100"><SelectValue /></SelectTrigger>
                        <SelectContent>{BACKGROUND_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-purple-600 uppercase">Particles</label>
                    <Select value={config.overlay_effect} onValueChange={(v) => setConfig({...config, overlay_effect: v})}>
                        <SelectTrigger className="rounded-xl h-12 bg-purple-50/30 border-purple-100"><SelectValue /></SelectTrigger>
                        <SelectContent>{OVERLAY_EFFECTS.map(o => <SelectItem key={o} value={o}>{o.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            {/* Full Component List */}
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Select All-Festival Hero Component</label>
                   <Select value={config.visual_key} onValueChange={(v) => setConfig({...config, visual_key: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-80">
                            {ALL_VISUAL_KEYS.map(k => <SelectItem key={k} value={k}>{k.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* 🚀 FIXED SCALE SLIDER */}
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <label className="text-[10px] font-black uppercase">Scaling Factor: {config.scale}x</label>
                    </div>
                    <input type="range" min="0.5" max="2.5" step="0.1" value={config.scale} 
                           onChange={(e) => setConfig({...config, scale: parseFloat(e.target.value)})} 
                           className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-xl font-black shadow-xl">
              {saving ? <Loader2 className="animate-spin" /> : 'SAVE & GO LIVE'}
            </Button>
          </CardContent>
        </Card>

        {/* PREVIEW */}
        <Card className="rounded-[3rem] bg-black relative overflow-hidden h-[650px] shadow-2xl flex items-center justify-center">
           {loading ? <Loader2 className="animate-spin text-blue-600 w-12 h-12" /> : (
             <div className="relative w-full h-full">
                {/* 🚀 PASSED CONFIG OBJECT CORRECTLY FOR SCALE FIX */}
                <HeroFactory config={config} themeColor="#fbbf24" />
                <div className="absolute bottom-10 w-full text-center z-50 pointer-events-none">
                    <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">{selectedKey}</h2>
                    <Badge className="bg-blue-600/20 text-blue-400 mt-4 tracking-[5px]">V4.1 LIVE STUDIO</Badge>
                </div>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
}
