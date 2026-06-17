'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Save, Loader2, Palette, Wind, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroFactory from '@/components/festival/v2/HeroFactory';

// 🚀 1. LISTS & CONSTANTS
const FESTIVAL_LIST = ["DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "INDEPENDENCE_DAY", "MAHASHIVRATRI", "DUSSEHRA", "NAVRATRI", "DURGA_PUJA", "GANESH_CHATURTHI", "RAKSHA_BANDHAN", "MAKAR_SANKRANTI", "LOHRI", "RAM_NAVAMI", "HANUMAN_JAYANTI", "KARWA_CHAUTH", "CHHATH_PUJA", "PONGAL", "EID_UL_FITR", "EID_AL_ADHA", "DEV_DEEPAWALI", "GURU_NANAK_JAYANTI"];

const BACKGROUND_STYLES = ["FIRE", "SOFT_GOLD", "SOFT_PINK", "WINTER", "DARK_GOLD", "ROYAL_BLUE", "DIVINE_RED", "SAFFRON", "DIVINE_LIGHT", "EMERALD", "SKY", "RAINBOW", "NIGHT", "TRICOLOR", "HARVEST_GOLD", "SUNSET", "DARK_BLUE", "ORANGE_RED"];

const ANIMATION_THEMES = ["GOLDEN_PARTICLES", "COLOR_SPLASH", "SNOW_FALL", "TRICOLOR_WAVES", "MOON_GLOW", "BLUE_AURA", "FIRE_EMBERS", "DIVINE_LIGHT", "DIVINE_GLOW", "TEMPLE_GLOW", "SUNRISE_RAYS", "HARVEST_SPARKS", "BONFIRE_SPARKS", "RED_GOLD_PARTICLES", "CONFETTI_BLAST", "SPARKLES", "WIND_EFFECT", "FLYING_KITES", "SMOKE_GLOW", "FLOATING_GRAINS", "FLAG_MOTION", "COUNTDOWN", "LIGHT_RAYS", "PEACOCK_PARTICLES", "THREAD_GLOW", "LOTUS_PARTICLES", "LOTUS_GLOW", "FIRE_SPARKS", "VICTORY_RAYS", "ROMANTIC_LIGHTS", "GOLDEN_LIGHT"];

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
  { label: "Dandiya Beat (Navratri)", value: "DANDIYA_BEAT" },
  { label: "Ganga Ghat Diya (Dev Deepawali)", value: "GANGA_GHAT_DIYA" },
  { label: "Sikh Khanda", value: "SIKH_KHANDA" }
];

// 🚀 2. MASTER AUTO PRESETS (100% Unique Colors for 24 Festivals)
const AUTO_PRESETS: any = {
  DIWALI: { 
    background_style: 'DARK_GOLD', animation: 'GOLDEN_PARTICLES', visual_key: 'ROYAL_DIYA', 
    banner_visual_key: 'ROYAL_DIYA', particle_variant: 'royal', design_preset: 'luxury', 
    title_variant: 'royal', cta_variant: 'premium', banner_variant: 'luxury', card_glow: 'gold',
    primary_color: '#fbbf24' // Gold
  },
  HOLI: { 
    background_style: 'RAINBOW', animation: 'COLOR_SPLASH', visual_key: 'VIBRANT_PALETTE', 
    banner_visual_key: 'VIBRANT_PALETTE', particle_variant: 'festival', design_preset: 'modern', 
    title_variant: 'gradient', cta_variant: 'gradient', banner_variant: 'glass', card_glow: 'premium',
    primary_color: '#ff0080' // Pink
  },
  JANMASHTAMI: { 
    background_style: 'ROYAL_BLUE', animation: 'PEACOCK_PARTICLES', visual_key: 'BABY_KRISHNA', 
    banner_visual_key: 'BABY_KRISHNA', particle_variant: 'premium', design_preset: 'royal', 
    title_variant: 'glow', cta_variant: 'neon', banner_variant: 'premium', card_glow: 'theme',
    primary_color: '#3b82f6' // Blue
  },
  CHRISTMAS: { 
    background_style: 'WINTER', animation: 'SNOW_FALL', visual_key: 'XMAS_TREE', 
    banner_visual_key: 'XMAS_TREE', particle_variant: 'soft', design_preset: 'glass', 
    title_variant: 'glow', cta_variant: 'glass', banner_variant: 'glass', card_glow: 'white',
    primary_color: '#ef4444' // Red
  },
  EID_UL_FITR: { 
    background_style: 'EMERALD', animation: 'MOON_GLOW', visual_key: 'EID_MUBARAK', 
    banner_visual_key: 'EID_MUBARAK', particle_variant: 'premium', design_preset: 'premium', 
    title_variant: 'royal', cta_variant: 'premium', banner_variant: 'premium', card_glow: 'theme',
    primary_color: '#10b981' // Green
  },
  MAHASHIVRATRI: { 
    background_style: 'DARK_BLUE', animation: 'BLUE_AURA', visual_key: 'SHIVA_POWER', 
    banner_visual_key: 'SHIVA_POWER', particle_variant: 'royal', design_preset: 'luxury', 
    title_variant: 'glow', cta_variant: 'neon', banner_variant: 'premium', card_glow: 'theme',
    primary_color: '#6366f1' // Shiva Blue/Indigo
  },
  REPUBLIC_DAY: { 
    background_style: 'TRICOLOR', animation: 'FLAG_MOTION', visual_key: 'DHARMA_CHAKRA', 
    banner_visual_key: 'DHARMA_CHAKRA', particle_variant: 'premium', design_preset: 'standard', 
    title_variant: 'modern', cta_variant: 'solid', banner_variant: 'solid', card_glow: 'white',
    primary_color: '#FF9933' // Saffron
  },
  DUSSEHRA: { 
    background_style: 'ORANGE_RED', animation: 'FIRE_SPARKS', visual_key: 'RAVAN_DAHAN', 
    banner_visual_key: 'RAVAN_DAHAN', particle_variant: 'festival', design_preset: 'luxury', 
    title_variant: 'royal', cta_variant: 'premium', banner_variant: 'luxury', card_glow: 'gold',
    primary_color: '#B45309' // Burnt Orange
  },
  NAVRATRI: { 
    background_style: 'DIVINE_RED', animation: 'LOTUS_PARTICLES', visual_key: 'DANDIYA_BEAT', 
    banner_visual_key: 'DANDIYA_BEAT', particle_variant: 'festival', design_preset: 'modern', 
    title_variant: 'gradient', cta_variant: 'neon', banner_variant: 'glass', card_glow: 'premium',
    primary_color: '#DC2626' // Red
  },
  DURGA_PUJA: { 
    background_style: 'DIVINE_RED', animation: 'DIVINE_AURA', visual_key: 'DIVINE_TRISHUL', 
    banner_visual_key: 'DIVINE_TRISHUL', particle_variant: 'royal', design_preset: 'luxury', 
    title_variant: 'royal', cta_variant: 'premium', banner_variant: 'luxury', card_glow: 'gold',
    primary_color: '#DC2626' // Durga Red
  },
  NEW_YEAR: { 
    background_style: 'NIGHT', animation: 'COUNTDOWN', visual_key: 'NY_COUNTDOWN', 
    banner_visual_key: 'NY_COUNTDOWN', particle_variant: 'festival', design_preset: 'modern', 
    title_variant: 'glow', cta_variant: 'neon', banner_variant: 'glass', card_glow: 'premium',
    primary_color: '#8b5cf6' // Purple
  },
  RAKSHA_BANDHAN: { 
    background_style: 'SOFT_PINK', animation: 'THREAD_GLOW', visual_key: 'BROTHER_BOND', 
    banner_visual_key: 'BROTHER_BOND', particle_variant: 'soft', design_preset: 'glass', 
    title_variant: 'gradient', cta_variant: 'premium', banner_variant: 'glass', card_glow: 'theme',
    primary_color: '#db2777' // Rose/Pink
  },
  LOHRI: { 
    background_style: 'FIRE', animation: 'FIRE_EMBERS', visual_key: 'REAL_BONFIRE', 
    banner_visual_key: 'REAL_BONFIRE', particle_variant: 'festival', design_preset: 'modern', 
    title_variant: 'glow', cta_variant: 'neon', banner_variant: 'solid', card_glow: 'gold',
    primary_color: '#f97316' // Flame Orange
  },
  MAKAR_SANKRANTI: { 
    background_style: 'SKY', animation: 'WIND_EFFECT', visual_key: 'KITES_FLYING', 
    banner_visual_key: 'KITES_FLYING', particle_variant: 'soft', design_preset: 'minimal', 
    title_variant: 'modern', cta_variant: 'glass', banner_variant: 'minimal', card_glow: 'white',
    primary_color: '#38bdf8' // Sky Blue
  },
  GANESH_CHATURTHI: { 
    background_style: 'SAFFRON', animation: 'LOTUS_PARTICLES', visual_key: 'ROYAL_GANESHA', 
    banner_visual_key: 'ROYAL_GANESHA', particle_variant: 'premium', design_preset: 'royal', 
    title_variant: 'royal', cta_variant: 'premium', banner_variant: 'premium', card_glow: 'theme',
    primary_color: '#f97316' // Orange
  },
  RAM_NAVAMI: { 
    background_style: 'SAFFRON', animation: 'GOLDEN_AURA', visual_key: 'RAM_DHARMA', 
    banner_visual_key: 'RAM_DHARMA', particle_variant: 'royal', design_preset: 'luxury', 
    title_variant: 'royal', cta_variant: 'premium', banner_variant: 'luxury', card_glow: 'gold',
    primary_color: '#f59e0b' // Saffron Yellow
  },
  HANUMAN_JAYANTI: { 
    background_style: 'FIRE', animation: 'DIVINE_LIGHT', visual_key: 'HANUMAN_GADA', 
    banner_visual_key: 'HANUMAN_GADA', particle_variant: 'premium', design_preset: 'premium', 
    title_variant: 'glow', cta_variant: 'solid', banner_variant: 'premium', card_glow: 'theme',
    primary_color: '#ea580c' // Deep Orange
  },
  KARWA_CHAUTH: { 
    background_style: 'SOFT_GOLD', animation: 'ROMANTIC_LIGHTS', visual_key: 'MOON_SIEVE', 
    banner_visual_key: 'MOON_SIEVE', particle_variant: 'soft', design_preset: 'glass', 
    title_variant: 'glow', cta_variant: 'premium', banner_variant: 'glass', card_glow: 'gold',
    primary_color: '#f59e0b' // Moon Gold
  },
  CHHATH_PUJA: { 
    background_style: 'SUNSET', animation: 'WATER_GLOW', visual_key: 'SUN_ARGHYA', 
    banner_visual_key: 'SUN_ARGHYA', particle_variant: 'soft', design_preset: 'modern', 
    title_variant: 'gradient', cta_variant: 'solid', banner_variant: 'glass', card_glow: 'theme',
    primary_color: '#F97316' // Sunset Orange
  },
  PONGAL: { 
    background_style: 'HARVEST_GOLD', animation: 'FLOATING_GRAINS', visual_key: 'HARVEST_POT', 
    banner_visual_key: 'HARVEST_POT', particle_variant: 'soft', design_preset: 'standard', 
    title_variant: 'modern', cta_variant: 'premium', banner_variant: 'minimal', card_glow: 'white',
    primary_color: '#22c55e' // Harvest Green
  },
  GURU_NANAK_JAYANTI: { 
    background_style: 'SOFT_GOLD', animation: 'GOLDEN_LIGHT', visual_key: 'SIKH_KHANDA', 
    banner_visual_key: 'SIKH_KHANDA', particle_variant: 'royal', design_preset: 'luxury', 
    title_variant: 'royal', cta_variant: 'premium', banner_variant: 'luxury', card_glow: 'gold',
    primary_color: '#fbbf24' // Gurudwara Gold
  },
  DEV_DEEPAWALI: { 
    background_style: 'DARK_GOLD', animation: 'SPARKLES', visual_key: 'GANGA_GHAT_DIYA', 
    banner_visual_key: 'GANGA_GHAT_DIYA', particle_variant: 'royal', design_preset: 'luxury', 
    title_variant: 'glow', cta_variant: 'neon', banner_variant: 'luxury', card_glow: 'gold',
    primary_color: '#fbbf24'
  },
  EID_AL_ADHA: { 
    background_style: 'EMERALD', animation: 'LIGHT_RAYS', visual_key: 'HOLY_KAABA', 
    banner_visual_key: 'HOLY_KAABA', particle_variant: 'premium', design_preset: 'standard', 
    title_variant: 'royal', cta_variant: 'solid', banner_variant: 'premium', card_glow: 'theme',
    primary_color: '#10b981'
  },
  INDEPENDENCE_DAY: { 
    background_style: 'TRICOLOR', animation: 'TRICOLOR_WAVES', visual_key: 'NATIONAL_PRIDE', 
    banner_visual_key: 'NATIONAL_PRIDE', particle_variant: 'premium', design_preset: 'standard', 
    title_variant: 'modern', cta_variant: 'solid', banner_variant: 'solid', card_glow: 'white',
    primary_color: '#16a34a' // India Green
  }
};

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
    animation: 'GOLDEN_PARTICLES',
    // Visual Configs
    banner_visual_key: 'ROYAL_DIYA',
    particle_variant: 'default',
    design_preset: 'standard',
    // Theme Configs
    title_variant: 'royal',
    cta_variant: 'premium',
    banner_variant: 'glass',
    card_glow: 'theme'
  });

  // 🔄 handle Festival Selection (Apply Full Preset)
  const handleFestivalChange = (key: string) => {
    setSelectedKey(key);
    const p = AUTO_PRESETS[key] || AUTO_PRESETS.DIWALI;
    
    setConfig((prev: any) => ({
      ...prev,
      visual_key: p.visual_key,
      background_style: p.background_style,
      animation: p.animation,
      banner_visual_key: p.banner_visual_key,
      particle_variant: p.particle_variant,
      design_preset: p.design_preset,
      title_variant: p.title_variant,
      cta_variant: p.cta_variant,
      banner_variant: p.banner_variant,
      card_glow: p.card_glow,
      // 🚀 YE LINE ADD KAREIN:
      primary_color: p.primary_color 
    }));
  };

  // 🔄 PRIORITY FETCH: Database data always overrides
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
          animation: dbHero.animation || dbHero.overlay || 'GOLDEN_PARTICLES',
          // 🚀 Fixed: Using safe fallbacks instead of 'prev'
          banner_visual_key: dbHero.banner_visual_key || dbHero.visual_key || 'ROYAL_DIYA',
          particle_variant: dbHero.particle_variant || 'default',
          design_preset: dbHero.design_preset || 'standard',
          // 🚀 Fetching theme config overrides
          title_variant: dbTheme.title_variant || 'royal',
          cta_variant: dbTheme.cta_variant || 'premium',
          banner_variant: dbTheme.banner_variant || 'glass',
          card_glow: dbTheme.card_glow || 'theme'
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
        hero_config: {
          ...config
        },
        theme_config: { 
            background_style: config.background_style, 
            primary_color: config.background_style === 'SKY' ? '#38bdf8' : '#fbbf24',
            title_variant: config.title_variant,
            cta_variant: config.cta_variant,
            banner_variant: config.banner_variant,
            card_glow: config.card_glow
        }
      };

      await fetch('/api/admin/festival-assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      toast.success(`${selectedKey} Published to V2!`);
    } catch (e) { toast.error("Database Sync Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-poppins">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: MASTER CONTROLS */}
        <Card className="lg:col-span-5 shadow-2xl rounded-[2rem] bg-white border-none overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6"><CardTitle className="text-lg">Appearance Controls</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
            
            {/* Festival Selector */}
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

            {/* HERO CONFIG SECTION */}
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Hero Assets</h3>
                
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

                {/* Banner Visual */}
                <div className="space-y-2">
                    <Label>Banner Visual</Label>
                    <Select value={config.banner_visual_key} onValueChange={(v) => setConfig({...config, banner_visual_key: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {VISUAL_COMPONENTS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Particle Variant */}
                <div className="space-y-2">
                    <Label>Particle Variant</Label>
                    <Select value={config.particle_variant || 'default'} onValueChange={(v) => setConfig({...config, particle_variant: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="royal">Royal</SelectItem>
                            <SelectItem value="festival">Festival</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                            <SelectItem value="soft">Soft</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Design Preset */}
                <div className="space-y-2">
                    <Label>Design Preset</Label>
                    <Select value={config.design_preset || 'standard'} onValueChange={(v) => setConfig({...config, design_preset: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="royal">Royal</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="glass">Glass</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Scale & Speed Sliders */}
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

            {/* THEME CONFIG SECTION */}
            <div className="p-6 bg-slate-100 rounded-[2rem] border border-slate-200 space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Theme Styling</h3>
                
                {/* Title Variant */}
                <div className="space-y-2">
                    <Label>Title Variant</Label>
                    <Select value={config.title_variant || 'royal'} onValueChange={(v) => setConfig({...config, title_variant: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="royal">Royal</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                            <SelectItem value="glow">Glow</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* CTA Variant */}
                <div className="space-y-2">
                    <Label>CTA Variant</Label>
                    <Select value={config.cta_variant || 'premium'} onValueChange={(v) => setConfig({...config, cta_variant: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="glass">Glass</SelectItem>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                            <SelectItem value="neon">Neon</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Banner Variant */}
                <div className="space-y-2">
                    <Label>Banner Variant</Label>
                    <Select value={config.banner_variant || 'glass'} onValueChange={(v) => setConfig({...config, banner_variant: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="glass">Glass</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Card Glow */}
                <div className="space-y-2">
                    <Label>Card Glow</Label>
                    <Select value={config.card_glow || 'theme'} onValueChange={(v) => setConfig({...config, card_glow: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="theme">Theme Color</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="white">White</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
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
