'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroFactory from '@/components/festival/v2/HeroFactory';

const FESTIVAL_LIST = ["DIWALI", "HOLI", "JANMASHTAMI", "CHRISTMAS", "NEW_YEAR", "REPUBLIC_DAY", "MAHASHIVRATRI"];

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchAsset() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('festival_assets_v2')
          .select('*')
          .eq('festival_key', selectedKey)
          .maybeSingle();

        if (error) throw error;
        // Agar data nahi hai toh ek basic template set karein crash se bachne ke liye
        setAssetData(data || { festival_key: selectedKey, hero_config: { visual_key: 'SPARKLES', scale: 1 }, theme_config: {} });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAsset();
  }, [selectedKey]);

  const handleSave = async () => {
    if (!assetData) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/festival-assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festival_key: selectedKey,
          hero_config: assetData.hero_config,
          theme_config: assetData.theme_config
        })
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("Design Saved!");
    } catch (err) {
      toast.error("Database sync failed");
    } finally {
      setSaving(false);
    }
  };

  // Safe update function
  const updateVisual = (id: string) => {
    setAssetData((prev: any) => ({
      ...prev,
      hero_config: { ...prev?.hero_config, visual_key: id }
    }));
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black">Design Configurator V2</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="shadow-xl rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6"><CardTitle>Controls</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Festival</label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{FESTIVAL_LIST.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
               {VISUAL_OPTIONS.map(opt => (
                 <Button 
                   key={opt.id} 
                   variant={assetData?.hero_config?.visual_key === opt.id ? 'default' : 'outline'}
                   className="h-14 rounded-2xl text-xs font-bold"
                   onClick={() => updateVisual(opt.id)}
                 >
                   {opt.label}
                 </Button>
               ))}
            </div>

            <Button onClick={handleSave} disabled={saving || loading} className="w-full h-16 bg-blue-600 rounded-2xl text-xl font-bold">
              {saving ? <Loader2 className="animate-spin" /> : 'SAVE DESIGN'}
            </Button>
          </CardContent>
        </Card>

        {/* PREVIEW WITH SAFETY CHECK */}
        <Card className="rounded-[2.5rem] bg-slate-950 min-h-[500px] flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e2d7a_0%,transparent 70%)] opacity-40" />
           {loading ? <Loader2 className="animate-spin text-blue-500 w-12 h-12" /> : (
             <div className="relative z-10 flex flex-col items-center scale-90">
                <Badge className="mb-8 opacity-50 uppercase tracking-[4px]">Lab Preview</Badge>
                {/* 🚀 Safety Check: Sirf tab render karein jab data ho */}
                {assetData?.hero_config && <HeroFactory config={assetData.hero_config} />}
                <h2 className="text-white text-3xl font-black mt-8 italic uppercase">{selectedKey}</h2>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
}
