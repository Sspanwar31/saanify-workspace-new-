'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Sparkles, Globe, FlaskConical, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ━━━ MASTER LISTS (For Selection) ━━━
const BROADCAST_TYPES = [
  "FESTIVAL", "ANNOUNCEMENT", "SYSTEM_UPDATE", "SPECIAL_OFFER", "MAINTENANCE", "EMERGENCY", "EVENT"
];

const FESTIVALS = [
  "DIWALI", "HOLI", "NAVRATRI", "DUSSEHRA", "GANESH_CHATURTHI", "JANMASHTAMI", 
  "RAKSHA_BANDHAN", "MAKAR_SANKRANTI", "LOHRI", "MAHASHIVRATRI", "RAM_NAVAMI", 
  "HANUMAN_JAYANTI", "KARWA_CHAUTH", "CHHATH_PUJA", "GURU_PURNIMA", "ONAM", 
  "PONGAL", "UGADI", "BAISAKHI", "EID_AL_FITR", "EID_AL_ADHA", "CHRISTMAS", 
  "NEW_YEAR", "REPUBLIC_DAY", "INDEPENDENCE_DAY"
];

export default function BroadcastLabPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'FESTIVAL',
    festival_key: 'DIWALI',
    language_mode: 'BOTH',
    full_screen_animation: true,
    dashboard_overlay: true
  });

  const publishBroadcast = async () => {
    try {
      setLoading(true);
      // Logic: Agar Type Festival nahi hai, toh key wahi Type ban jayegi (e.g. ANNOUNCEMENT)
      const finalKey = form.type === 'FESTIVAL' ? form.festival_key : form.type;

      const payload = {
        festival_key: finalKey,
        language_mode: form.language_mode,
        full_screen_animation: form.full_screen_animation,
        dashboard_overlay: form.dashboard_overlay,
        preview_mode: true // 🚀 Isse ye production mein nahi jayega
      };

      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("API Error");

      toast.success(`${finalKey} Generated in Lab V2!`);
    } catch (err: any) {
      toast.error("Generation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <FlaskConical className="text-blue-600" /> Broadcast Lab V2
          </h1>
          <p className="text-slate-500 font-medium">Auto-generate and test all 40+ scenarios instantly.</p>
        </div>
        <Link href="/broadcast-preview" target="_blank">
          <Button variant="outline" className="bg-white shadow-sm gap-2">
            View Live Preview <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* CONFIGURATION CARD */}
        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6">
            <CardTitle className="text-lg">Broadcast Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            
            {/* 1. BROADCAST TYPE */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Broadcast Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BROADCAST_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 2. FESTIVAL SELECTION (Conditional) */}
            {form.type === 'FESTIVAL' && (
              <div className="space-y-2 animate-in slide-in-from-top duration-300">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Festival Preset</label>
                <Select value={form.festival_key} onValueChange={(v) => setForm({ ...form, festival_key: v })}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-blue-50/50 border-blue-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {FESTIVALS.map(f => <SelectItem key={f} value={f}>{f.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 3. LANGUAGE MODE */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Language Mode</label>
              <Select value={form.language_mode} onValueChange={(v) => setForm({ ...form, language_mode: v })}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HI">Hindi Only</SelectItem>
                  <SelectItem value="EN">English Only</SelectItem>
                  <SelectItem value="BOTH">Bilingual (HI + EN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <span className="text-sm font-bold text-slate-600">Overlay</span>
                <input type="checkbox" className="w-5 h-5 rounded-md accent-blue-600" checked={form.dashboard_overlay} onChange={(e) => setForm({ ...form, dashboard_overlay: e.target.checked })} />
              </div>
              <div className="flex items-center justify-between border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <span className="text-sm font-bold text-slate-600">Full Animation</span>
                <input type="checkbox" className="w-5 h-5 rounded-md accent-blue-600" checked={form.full_screen_animation} onChange={(e) => setForm({ ...form, full_screen_animation: e.target.checked })} />
              </div>
            </div>

            <Button 
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xl font-black shadow-lg shadow-blue-500/20" 
              onClick={publishBroadcast} 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Globe className="mr-2 h-5 w-5" /> GENERATE V2 PREVIEW</>}
            </Button>
          </CardContent>
        </Card>

        {/* PREVIEW CARD */}
        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e2d7a_0%,transparent_70%)] opacity-40" />
            <div className="relative p-12 h-full flex flex-col items-center justify-center text-center space-y-8">
               <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl rotate-6">
                  <Sparkles className="w-12 h-12 text-yellow-400" />
               </div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic text-blue-400">
                    {form.type === 'FESTIVAL' ? form.festival_key : form.type}
                  </h2>
                  <p className="text-slate-400 font-medium px-8 leading-relaxed">
                    This will call the naye auto-engine logic and load professional messages from database.
                  </p>
               </div>
               <div className="flex gap-4">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white px-4 py-1">{form.language_mode}</Badge>
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white px-4 py-1">V2 ENGINE</Badge>
               </div>
            </div>
        </Card>
      </div>
    </div>
  );
}
