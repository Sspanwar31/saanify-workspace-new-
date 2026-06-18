'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Sparkles, Globe, FlaskConical, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BroadcastLabPage() {
  const [loading, setLoading] = useState(false);
  const [dbLists, setDbLists] = useState({ festivals: [], types: [] }); // 🚀 Naya state
  
  const [form, setForm] = useState({
    type: 'FESTIVAL',
    festival_key: 'DIWALI',
    language_mode: 'BOTH',
    full_screen_animation: true,
    dashboard_overlay: true
  });

  // 🚀 1. Fetch Dynamic Lists on Mount
  useEffect(() => {
    const loadLists = async () => {
      try {
        const res = await fetch('/api/admin/broadcast-lab');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        // 🚀 SAFETY: Ensure data has the right structure before setting state
        setDbLists({
          festivals: data.festivals || [],
          types: data.types || []
        });
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Database se list nahi mil saki.");
      }
    };
    loadLists();
  }, []);

  const publishBroadcast = async () => {
    try {
      setLoading(true);

      // ✅ UPDATED PAYLOAD LOGIC
      const payload =
        form.type === 'FESTIVAL'
          ? {
              festival_key: form.festival_key,
              language_mode: form.language_mode,
              full_screen_animation: form.full_screen_animation,
              dashboard_overlay: form.dashboard_overlay,
              preview_mode: true
            }
          : {
              broadcast_type: form.type,
              language_mode: form.language_mode,
              full_screen_animation: form.full_screen_animation,
              dashboard_overlay: form.dashboard_overlay,
              preview_mode: true
            };
      
      console.log('PAYLOAD =>', payload); // ✅ DEBUG LOG

      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      // ✅ UPDATED TOAST MESSAGE
      toast.success(
        `${form.type === 'FESTIVAL'
            ? form.festival_key
            : form.type
         } Generated! Check Preview.`
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <FlaskConical className="text-blue-600 w-8 h-8" /> Broadcast Lab V2
          </h1>
          <p className="text-slate-500 font-medium mt-1">Test all 40+ celebration scenarios instantly.</p>
        </div>
        <Link href="/broadcast-preview" target="_blank" className="w-fit">
          <Button variant="outline" className="bg-white shadow-sm gap-2 border-slate-200">
            View Live Preview <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 🛠 CONFIGURATION CARD */}
        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-6">
            <CardTitle className="text-lg font-bold">Broadcast Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Broadcast Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* 🚀 Corporate Types from DB */}
                  {dbLists.types?.map(t => (
                    <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                  ))}
                  <SelectItem value="FESTIVAL">FESTIVAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === 'FESTIVAL' && (
              <div className="space-y-2 animate-in slide-in-from-top duration-300">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Festival Preset</label>
                <Select value={form.festival_key} onValueChange={(v) => setForm({ ...form, festival_key: v })}>
                  <SelectTrigger className="h-12 rounded-xl border-blue-100 bg-blue-50/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {/* 🚀 Festivals from DB */}
                    {dbLists.festivals?.map(f => (
                      <SelectItem key={f} value={f}>{f.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                <input type="checkbox" className="w-5 h-5 rounded-md accent-blue-600 cursor-pointer" checked={form.dashboard_overlay} onChange={(e) => setForm({ ...form, dashboard_overlay: e.target.checked })} />
              </div>
              <div className="flex items-center justify-between border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <span className="text-sm font-bold text-slate-600">Full Anim</span>
                <input type="checkbox" className="w-5 h-5 rounded-md accent-blue-600 cursor-pointer" checked={form.full_screen_animation} onChange={(e) => setForm({ ...form, full_screen_animation: e.target.checked })} />
              </div>
            </div>

            <Button 
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95" 
              onClick={publishBroadcast} 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <><Globe className="mr-2 h-6 w-6" /> GENERATE V2 PREVIEW</>}
            </Button>
          </CardContent>
        </Card>

        {/* 👁️ PREVIEW CARD */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e2d7a_0%,transparent 70%)] opacity-40" />
            <div className="relative p-12 h-full flex flex-col items-center justify-center text-center space-y-8">
               <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl rotate-6 animate-pulse">
                  <Sparkles className="w-12 h-12 text-yellow-400" />
               </div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic text-blue-400 drop-shadow-lg">
                    {form.type === 'FESTIVAL' ? form.festival_key : form.type}
                  </h2>
                  <p className="text-slate-400 font-medium px-8 leading-relaxed max-w-sm">
                    Calls the auto-v2 engine and loads professional assets from the cloud database.
                  </p>
               </div>
               <div className="flex gap-4">
                  <Badge variant="secondary" className="bg-white/10 border-white/10 text-white px-4 py-1">{form.language_mode}</Badge>
                  <Badge variant="secondary" className="bg-blue-500/20 border-blue-500/30 text-blue-400 px-4 py-1 font-black">V2 LAB</Badge>
               </div>
            </div>
        </Card>
      </div>
    </div>
  );
}
