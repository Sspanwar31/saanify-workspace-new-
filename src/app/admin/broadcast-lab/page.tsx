'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Sparkles, Globe, FlaskConical, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function BroadcastLabPage() {
  const [loading, setLoading] = useState(false);
  const [dbLists, setDbLists] = useState<{ festivals: string[]; types: string[] }>({ festivals: [], types: [] }); 
  const [broadcastStatus, setBroadcastStatus] = useState('draft');
  const [totalCount, setTotalCount] = useState(0); // 🚀 NEW: State to store total active db rows
  
  const [form, setForm] = useState({
    type: 'FESTIVAL',
    festival_key: 'DIWALI',
    language_mode: 'BOTH',
    full_screen_animation: true,
    dashboard_overlay: true
  });

  // 🚀 1. Fetch Dynamic Lists & Live Row Count (useCallback to reuse after actions)
  const loadListsAndCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/broadcast-lab');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      setDbLists({
        festivals: data.festivals || [],
        types: data.types || []
      });
      setTotalCount(data.totalCount || 0); // Update the live DB count state
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Database se sync nahi ho saka.");
    }
  }, []);

  // Run on mount
  useEffect(() => {
    loadListsAndCount();
  }, [loadListsAndCount]);

  // 🚀 2. Handler for Start, Stop, and Single Delete Actions
  const handleBroadcastAction = async (
    action: 'start' | 'stop' | 'delete'
  ) => {
    try {
      setLoading(true);

      // Corporate/Festival consistency bug fix (resolved key resolution)
      const resolvedKey = form.type === 'FESTIVAL' ? form.festival_key : form.type;

      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          festival_key: resolvedKey,
          action
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      if (action === 'start') {
        setBroadcastStatus('active');
        toast.success('Broadcast Started');
      }

      if (action === 'stop') {
        setBroadcastStatus('stopped');
        toast.success('Broadcast Stopped');
      }

      if (action === 'delete') {
        setBroadcastStatus('draft');
        toast.success('Broadcast Deleted');
      }

      // 🚀 Action ke baad lists aur db row count ko automatic refresh karein
      await loadListsAndCount();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ━━━ 🚀 NEW: DELETE ALL ACTION (TABLE KHALLI KARNE KE LIYE) ━━━
  const handleDeleteAllBroadcasts = async () => {
    const isConfirmed = window.confirm(
      "⚠️ चेतावनी: क्या आप सचमुच डेटाबेस के सभी (All) ब्रॉडकास्ट रिकॉर्ड्स को डिलीट करके टेबल को खाली करना चाहते हैं? इससे लाइव डैशबोर्ड्स से बैनर तुरंत हट जाएंगे।"
    );
    if (!isConfirmed) return;

    try {
      setLoading(true);

      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete_all'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to clear broadcasts');
      }

      setBroadcastStatus('draft');
      toast.success('Database table fully cleared!');
      
      // Live count refresh karein
      await loadListsAndCount();

    } catch (err: any) {
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

            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
              <div className="space-y-6">

                {/* Status and Database Rows Info Block */}
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                  <div>
                    <p className="text-sm font-bold text-slate-600">
                      Broadcast Status
                    </p>
                    <Badge
                      className={
                        broadcastStatus === 'active'
                          ? 'bg-green-600 mt-1'
                          : broadcastStatus === 'stopped'
                          ? 'bg-red-600 mt-1'
                          : 'bg-yellow-500 mt-1'
                      }
                    >
                      {broadcastStatus.toUpperCase()}
                    </Badge>
                  </div>

                  {/* 🚀 NEW: Database live count display */}
                  <div className="text-right">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Database Cleanliness
                    </p>
                    <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold leading-none text-blue-800 bg-blue-100 rounded-full mt-1.5 animate-pulse">
                      {totalCount} Total Row(s)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">

                  <Button
                    className="bg-green-600 hover:bg-green-700 h-12 text-sm font-bold"
                    onClick={() => handleBroadcastAction('start')}
                    disabled={loading}
                  >
                    🚀 START BROADCAST
                  </Button>

                  <Button
                    variant="destructive"
                    className="h-12 text-sm font-bold"
                    onClick={() => handleBroadcastAction('stop')}
                    disabled={loading}
                  >
                    ⏹ STOP BROADCAST
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-12 text-xs font-black border-slate-200 hover:bg-slate-100"
                      onClick={() => handleBroadcastAction('delete')}
                      disabled={loading}
                    >
                      🗑️ DELETE SELECTED
                    </Button>

                    {/* 🚀 NEW: Delete All Clear Table Button */}
                    <Button
                      variant="outline"
                      className="h-12 text-xs font-black border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      onClick={handleDeleteAllBroadcasts}
                      disabled={loading}
                    >
                      🔥 DELETE ALL
                    </Button>
                  </div>

                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 👁️ PREVIEW CARD */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e2d7a_0%,transparent_70%)] opacity-40" />
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
