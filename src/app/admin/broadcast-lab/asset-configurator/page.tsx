'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Save, Loader2, Image as ImageIcon, Box, Zap, Palette, Wind } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroFactory from '@/components/festival/v2/HeroFactory';

// 🚀 1. POORI 24 FESTIVALS KI MASTER LIST
const FESTIVAL_LIST = [
  "DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "INDEPENDENCE_DAY",
  "MAHASHIVRATRI", "DUSSEHRA", "NAVRATRI", "DURGA_PUJA", "GANESH_CHATURTHI", "RAKSHA_BANDHAN",
  "MAKAR_SANKRANTI", "LOHRI", "RAM_NAVAMI", "HANUMAN_JAYANTI", "KARWA_CHAUTH", "CHHATH_PUJA",
  "GURU_PURNIMA", "ONAM", "PONGAL", "UGADI", "BAISAKHI", "EID_AL_FITR", "EID_AL_ADHA"
];

// 🚀 2. MASTER DESIGN OPTIONS (Matches HeroFactory V4)
const BACKGROUND_STYLES = ["FIRE", "SOFT_GOLD", "SOFT_PINK", "WINTER", "DARK_GOLD", "ROYAL_BLUE", "DIVINE_RED", "SAFFRON", "DIVINE_LIGHT", "EMERALD", "SKY", "RAINBOW", "NIGHT"];
const ICON_NAMES = ["diya", "colors", "moon", "rakhi", "tree", "flute", "DURGA", "bow", "khanda", "kite", "ganesha", "flag", "fireworks", "sun", "gada", "fire"];
const OVERLAY_EFFECTS = ["FIRE_EMBERS", "ROMANTIC_LIGHTS", "THREAD_GLOW", "SNOW_PARTICLES", "FLOATING_LIGHTS", "PEACOCK_PARTICLES", "DIVINE_AURA", "GOLDEN_AURA", "COLOR_BURST", "LOTUS_PARTICLES"];

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
    overlay_effect: 'GOLDEN_PARTICLES'
  });

  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      const { data } = await supabase.from('festival_assets_v2').select('*').eq('festival_key', selectedKey).maybeSingle();
      if (data?.hero_config) {
        const dbConfig = typeof data.hero_config === 'string' ? JSON.parse(data.hero_config) : data.hero_config;
        setConfig({
          ...config,
          ...dbConfig,
          background_style: data.theme_config?.background_style || 'DARK_GOLD'
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
          hero_config: config,
          theme_config: { background_style: config.background_style, font_family: 'Poppins' }
        })
      });
      if (res.ok) toast.success(`${selectedKey} Design Updated!`);
    } catch (e) { toast.error("Database Sync Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-poppins">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Design Studio V4</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT: MASTER CONTROLS */}
        <Card className="shadow-2xl rounded-[2.5rem] bg-white border-none overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6"><CardTitle>Appearance Controls</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-6">
            
            {/* Festival Picker */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Target Festival</label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 font-bold text-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">{FESTIVAL_LIST.map(f => <SelectItem key={f} value={f}>{f.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Layout Settings (Background & Overlay) */}
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
                        <SelectContent>{OVERLAY_EFFECTS.map(o => <SelectItem key={o} value={o}>{o.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            {/* Render Mode */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Hero Render Mode</label>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                 {['COMPONENT', 'IMAGE', 'LUCIDE'].map((m) => (
                   <Button key={m} variant={config.render_type === m ? 'default' : 'ghost'} size="sm" className="flex-1 rounded-xl h-10 font-bold text-[10px]"
                           onClick={() => setConfig({...config, render_type: m})}>{m}</Button>
                 ))}
              </div>
            </div>

            {/* Mode Specific Logic */}
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                {config.render_type === 'COMPONENT' && (
                    <Select value={config.visual_key} onValueChange={(v) => setConfig({...config, visual_key: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ROYAL_DIYA">Royal Diya 🪔</SelectItem>
                            <SelectItem value="GANESHA">Lord Ganesha 🐘</SelectItem>
                            <SelectItem value="MAA_DURGA">Maa Durga 🔱</SelectItem>
                            <SelectItem value="VIBRANT_PALETTE">Holi Palette 🎨</SelectItem>
                            <SelectItem value="ASHOKA_CHAKRA">Ashoka Chakra 🇮🇳</SelectItem>
                            <SelectItem value="CHRISTMAS_TREE">Xmas Tree 🎄</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {config.render_type !== 'COMPONENT' && (
                    <Select value={config.icon_name} onValueChange={(v) => setConfig({...config, icon_name: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Select Icon Symbol" /></SelectTrigger>
                        <SelectContent className="max-h-60">{ICON_NAMES.map(i => <SelectItem key={i} value={i}>{i.toUpperCase()}</SelectItem>)}</SelectContent>
                    </Select>
                )}

                {config.render_type === 'IMAGE' && (
                    <Input placeholder="Paste Image URL..." value={config.image_url} onChange={(e) => setConfig({...config, image_url: e.target.value})} className="h-12 rounded-xl bg-white" />
                )}

                {/* Scale & Speed Sliders */}
                <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold">SCALE: {config.scale}x</label>
                        <input type="range" min="0.5" max="2.5" step="0.1" value={config.scale} onChange={(e) => setConfig({...config, scale: parseFloat(e.target.value)})} className="w-full accent-blue-600" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold">SPEED: {config.speed}s</label>
                        <input type="range" min="1" max="10" step="1" value={config.speed} onChange={(e) => setConfig({...config, speed: parseInt(e.target.value)})} className="w-full accent-orange-500" />
                    </div>
                </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-xl font-black shadow-xl">
              {saving ? <Loader2 className="animate-spin" /> : 'APPLY TO PRODUCTION'}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: LIVE STUDIO PREVIEW */}
        <Card className="rounded-[3rem] bg-black flex flex-col items-center justify-center relative overflow-hidden h-[650px] shadow-2xl border-4 border-white/5">
           {loading ? <Loader2 className="animate-spin text-blue-600 w-12 h-12" /> : (
             <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* 🚀 CALLING MASTER HERO FACTORY V4 */}
                <HeroFactory config={config} />
                
                <div className="absolute bottom-12 text-center z-50 pointer-events-none">
                   <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">{selectedKey}</h2>
                   <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-400 mt-4 tracking-[4px]">V4 STUDIO ENGINE</Badge>
                </div>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
}
