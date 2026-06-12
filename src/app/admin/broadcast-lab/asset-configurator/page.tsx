'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Eye, Sparkles, RefreshCcw, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroFactory from '@/components/festival/v2/HeroFactory';

// 🚀 1. LIST OF ALL FESTIVALS (Matches DB Keys)
const FESTIVAL_LIST = ["DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "MAHASHIVRATRI"];

// 🚀 2. NEXT LEVEL VISUAL OPTIONS (IDs for HeroFactory)
const VISUAL_OPTIONS = [
  { id: 'ROYAL_DIYA', label: 'Premium Diya 🪔', color: '#F59E0B' },
  { id: 'VIBRANT_PALETTE', label: 'Color Palette 🎨', color: '#DB2777' },
  { id: 'ASHOKA_CHAKRA', label: 'Ashoka Chakra 🇮🇳', color: '#2563EB' },
  { id: 'CHRISTMAS_TREE', label: 'Christmas Tree 🎄', color: '#16A34A' },
  { id: 'GOLDEN_AURA', label: 'Golden Aura ✨', color: '#fbbf24' },
  { id: 'DIVINE_LIGHT', label: 'Divine Glow 🌟', color: '#fbbf24' }
];

export default function AssetConfigurator() {
  const [selectedKey, setSelectedKey] = useState('DIWALI');
  const [assetData, setAssetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ━━━ 1. LOAD DATA FROM V2 TABLE ━━━
  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true);
      const { data } = await supabase.from('festival_assets_v2').select('*').eq('festival_key', selectedKey).single();
      setAssetData(data);
      setLoading(false);
    };
    fetchAsset();
  }, [selectedKey]);

  // ━━━ 2. HANDLE LIVE PREVIEW UPDATES ━━━
  const updatePreview = (visualId: string) => {
    setAssetData((prev: any) => ({
      ...prev,
      hero_config: { ...prev.hero_config, visual_key: visualId }
    }));
  };

  // ━━━ 3. SAVE TO DATABASE (Calling Step 2 API) ━━━
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/festival-assets', {
        method: 'PATCH',
        body: JSON.stringify({
          festival_key: selectedKey,
          hero_config: assetData.hero_config,
          theme_config: assetData.theme_config
        })
      });

      if (!res.ok) throw new Error("Update Failed");
      toast.success(`${selectedKey} Config Saved Successfully!`);
    } catch (err) {
      toast.error("Error saving to DB");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-poppins">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Asset Configurator V2</h1>
          <p className="text-slate-500">Live Control Center for Hero Visuals</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT: CONTROLS */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6"><CardTitle className="text-lg">Design Controls</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Select Festival</label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{FESTIVAL_LIST.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-slate-400">Visual Style (2027 Standard)</label>
              <div className="grid grid-cols-2 gap-3">
                {VISUAL_OPTIONS.map((opt) => (
                  <Button 
                    key={opt.id} 
                    variant={assetData?.hero_config?.visual_key === opt.id ? 'default' : 'outline'}
                    className="h-14 rounded-2xl justify-start gap-3 px-4 border-slate-100"
                    onClick={() => updatePreview(opt.id)}
                  >
                    <span className="text-xl" style={{ color: opt.color }}>{opt.id.includes('DIYA') ? '🪔' : '✨'}</span>
                    <span className="text-xs font-bold truncate">{opt.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xl font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> SAVE VISUAL CONFIG</>}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: LIVE PREVIEW */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden h-[550px]">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e2d7a_0%,transparent_70%)] opacity-40" />
           
           <div className="relative z-10 flex flex-col items-center space-y-8 w-full">
              <Badge variant="outline" className="text-white/40 border-white/10 px-4 py-1 tracking-[5px] uppercase text-[10px]">Live Lab Preview</Badge>
              
              <div className="w-full h-64 flex items-center justify-center scale-110">
                 {loading ? <Loader2 className="animate-spin text-blue-500 w-10 h-10" /> : 
                  assetData ? <HeroFactory config={assetData.hero_config} /> : 'No data'}
              </div>

              <div className="text-center space-y-2">
                 <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{selectedKey}</h2>
                 <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Active Visual: {assetData?.hero_config?.visual_key || '...'}</p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
