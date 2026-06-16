'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Save, Loader2, Palette, Wind } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroFactory from '@/components/festival/v2/HeroFactory';

// 🚀 1. SAARE 24 FESTIVALS (Matches DB)
const FESTIVAL_LIST = ["DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "INDEPENDENCE_DAY", "MAHASHIVRATRI", "DUSSEHRA", "NAVRATRI", "DURGA_PUJA", "GANESH_CHATURTHI", "RAKSHA_BANDHAN", "MAKAR_SANKRANTI", "LOHRI", "RAM_NAVAMI", "HANUMAN_JAYANTI", "KARWA_CHAUTH", "CHHATH_PUJA", "PONGAL", "EID_UL_FITR", "EID_AL_ADHA", "DEV_DEEPAWALI", "GURU_NANAK_JAYANTI"];

// 🚀 2. SAARE PARTICLE ENGINES (Matches HeroFactory)
const ANIMATION_THEMES = ["GOLDEN_PARTICLES", "COLOR_SPLASH", "SNOW_FALL", "TRICOLOR_WAVES", "MOON_GLOW", "BLUE_AURA", "FIRE_EMBERS", "DIVINE_LIGHT", "DIVINE_GLOW", "TEMPLE_GLOW", "SUNRISE_RAYS", "HARVEST_SPARKS", "BONFIRE_SPARKS", "RED_GOLD_PARTICLES", "CONFETTI_BLAST", "SPARKLES", "WIND_EFFECT", "FLYING_KITES", "SMOKE_GLOW", "FLOATING_GRAINS", "FLAG_MOTION", "COUNTDOWN", "LIGHT_RAYS"];

const BACKGROUND_STYLES = ["FIRE", "SOFT_GOLD", "SOFT_PINK", "WINTER", "DARK_GOLD", "ROYAL_BLUE", "DIVINE_RED", "SAFFRON", "DIVINE_LIGHT", "EMERALD", "SKY", "RAINBOW", "NIGHT", "TRICOLOR", "HARVEST_GOLD", "SUNSET", "DARK_BLUE", "ORANGE_RED"];

// 🚀 3. MASTER PRESETS (Only used if DB is empty)
const AUTO_PRESETS: any = {
  DIWALI: { bg: 'DARK_GOLD', anim: 'GOLDEN_PARTICLES', comp: 'ROYAL_DIYA' },
  HOLI: { bg: 'RAINBOW', anim: 'COLOR_SPLASH', comp: 'VIBRANT_PALETTE' },
  CHRISTMAS: { bg: 'WINTER', anim: 'SNOW_FALL', comp: 'XMAS_TREE' },
  MAKAR_SANKRANTI: { bg: 'SKY', anim: 'WIND_EFFECT', comp: 'KITES_FLYING' },
  LOHRI: { bg: 'FIRE', anim: 'BONFIRE_SPARKS', comp: 'REAL_BONFIRE' }
};

const VISUAL_COMPONENTS = [
  { label: "Royal Diya (Diwali)", value: "ROYAL_DIYA" },
  { label: "Holi Palette", value: "VIBRANT_PALETTE" },
  { label: "Makar Sankranti Kite", value: "KITES_FLYING" },
  { label: "Baby Krishna", value: "BABY_KRISHNA" },
  { label: "Ravan Dahan", value: "RAVAN_DAHAN" },
  { label: "Shiva Power", value: "SHIVA_POWER" },
  { label: "National Pride", value: "NATIONAL_PRIDE" },
  { label: "Xmas Tree", value: "XMAS_TREE" },
  { label: "Ganga Ghat Diya", value: "GANGA_GHAT_DIYA" }
];

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
    animation: 'GOLDEN_PARTICLES' // 👈 Always use 'animation'
  });

  // 🔄 handle Festival Selection (Preset Fallback)
  const handleFestivalChange = (key: string) => {
    setSelectedKey(key);
    const p = AUTO_PRESETS[key] || { bg: 'DARK_GOLD', anim: 'GOLDEN_PARTICLES', comp: 'ROYAL_DIYA' };
    setConfig((prev: any) => ({ ...prev, visual_key: p.comp, background_style: p.bg, animation: p.anim }));
  };

  // 🔄 PRIORITY FETCH: Database always wins
  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      const { data } = await supabase.from('festival_assets_v2').select('*').eq('festival_key', selectedKey).maybeSingle();
      if (data) {
        const dbHero = typeof data.hero_config === 'string' ? JSON.parse(data.hero_config) : (data.hero_config || {});
        const dbTheme = typeof data.theme_config === 'string' ? JSON.parse(data.theme_config) : (data.theme_config || {});
        
        setConfig({
          ...config,
          ...dbHero,
          background_style: dbTheme.background_style || 'DARK_GOLD',
          // 🚀 FIX: Mapping 'animation' correctly
          animation: dbHero.animation || dbHero.overlay || 'GOLDEN_PARTICLES' 
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
        hero_config: config, 
        theme_config: { background_style: config.background_style, primary_color: '#fbbf24' }
      };
      await fetch('/api/admin/festival-assets', { method: 'PATCH', body: JSON.stringify(payload) });
      toast.success(`${selectedKey} Design Updated!`);
    } catch (e) { toast.error("Database Sync Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <Card className="lg:col-span-5 shadow-2xl rounded-[2rem] bg-white border-none overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6"><CardTitle className="text-lg">Appearance Controls</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Target Festival</label>
              <Select value={selectedKey} onValueChange={handleFestivalChange}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 font-bold text-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {FESTIVAL_LIST.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

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

            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6">
                <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
                    {['COMPONENT', 'IMAGE'].map((m) => (
                        <Button key={m} variant={config.render_type === m ? 'default' : 'ghost'} size="sm" className="flex-1 rounded-xl h-10 font-black text-[10px]"
                                onClick={() => setConfig({...config, render_type: m})}>{m}</Button>
                    ))}
                </div>
                {config.render_type === 'COMPONENT' && (
                    <Select value={config.visual_key} onValueChange={(v) => setConfig({...config, visual_key: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-80">
                            {VISUAL_COMPONENTS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}

                {config.render_type === 'IMAGE' && (
                    <Input placeholder="Paste Image URL..." value={config.image_url} onChange={(e) => setConfig({...config, image_url: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200" />
                )}

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

        {/* RIGHT: LIVE STUDIO PREVIEW */}
        <Card className="lg:col-span-7 rounded-[3.5rem] bg-black flex items-center justify-center relative overflow-hidden h-[750px] shadow-2xl border-4 border-white/10">
           {loading ? <Loader2 className="animate-spin text-blue-500 w-12 h-12" /> : (
             <div className="relative w-full h-full flex flex-col items-center justify-center">
                <HeroFactory config={config} themeColor="#fbbf24" />
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
