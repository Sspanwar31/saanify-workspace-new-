'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { 
  Sparkles, Globe, FlaskConical, ExternalLink, Loader2, Trash2, 
  Calendar, Clock, Plus, Save, RotateCcw, AlertTriangle 
} from 'lucide-react';
import Link from 'next/link';

export default function BroadcastLabPage() {
  const [loading, setLoading] = useState(false);
  const [dbLists, setDbLists] = useState<{ festivals: string[]; types: string[] }>({ festivals: [], types: [] }); 
  const [broadcastStatus, setBroadcastStatus] = useState('draft');
  const [totalCount, setTotalCount] = useState(0); 
  
  // Dynamic Year Generator
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 15 }, (_, i) => (currentYear + i).toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  
  // State for Hybrid Scheduler Planner List
  const [schedules, setSchedules] = useState<any[]>([]);

  const [form, setForm] = useState({
    type: 'FESTIVAL',
    festival_key: 'DIWALI',
    language_mode: 'BOTH',
    full_screen_animation: true,
    dashboard_overlay: true
  });

  // Timezone safe helper to format ISO timestamp to "YYYY-MM-DDTHH:MM" for datetime-local input
  const formatForDateTimeLocal = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // GET Request with 'no-store' cache and Timestamp to bypass NextJS Cache
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/broadcast-lab?action=get_schedules&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Failed to fetch schedules');
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error("Schedules Fetch Error:", err);
    }
  }, []);

  // GET Request with 'no-store' cache and Timestamp
  const loadListsAndCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/broadcast-lab?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      setDbLists({
        festivals: data.festivals || [],
        types: data.types || []
      });
      setTotalCount(data.totalCount || 0); 
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Database se sync nahi ho saka.");
    }
  }, []);

  // Run on mount
  useEffect(() => {
    loadListsAndCount();
    fetchSchedules(); 
  }, [loadListsAndCount, fetchSchedules]);

  // Handler for Start, Stop, and Single Delete Actions (Existing unbroken logic)
  const handleBroadcastAction = async (
    action: 'start' | 'stop' | 'delete'
  ) => {
    try {
      setLoading(true);

      const resolvedKey = form.type === 'FESTIVAL' ? form.festival_key : form.type;

      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          festival_key: resolvedKey,
          action,
          language_mode: form.language_mode,
          dashboard_overlay: form.dashboard_overlay,
          full_screen_animation: form.full_screen_animation,
          broadcast_type: form.type !== 'FESTIVAL' ? form.type : undefined
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

      await loadListsAndCount();
      await fetchSchedules(); 

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE ALL ACTION
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
      toast.success("Database table fully cleared!");
      
      await loadListsAndCount();
      await fetchSchedules();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ━━━ 🚀 SHEDULER HYBRID DYNAMIC ACTIONS (FUTURE PROOF) ━━━

  // A. Dynamic Year Preset Generator
  const handleLoadYearPreset = () => {
    if (dbLists.festivals.length === 0) {
      toast.error("Database se festivals ki list khali mili!");
      return;
    }

    const generatedDrafts = dbLists.festivals.map((fest) => {
      let monthDayStart = '10-01T00:00'; 
      let monthDayEnd = '10-02T00:00';

      switch (fest.toUpperCase()) {
        case 'REPUBLIC_DAY': monthDayStart = '01-26T00:00'; monthDayEnd = '01-27T00:00'; break;
        case 'NEW_YEAR': monthDayStart = '01-01T00:00'; monthDayEnd = '01-02T00:00'; break;
        case 'HOLI': monthDayStart = '03-03T00:00'; monthDayEnd = '03-05T00:00'; break;
        case 'INDEPENDENCE_DAY': monthDayStart = '08-15'; monthDayEnd = '08-16'; break;
        case 'DUSSEHRA': monthDayStart = '10-20T00:00'; monthDayEnd = '10-21T00:00'; break;
        case 'DIWALI': monthDayStart = '11-08T00:00'; monthDayEnd = '11-10'; break;
        case 'CHRISTMAS': monthDayStart = '12-25T00:00'; monthDayEnd = '12-26T00:00'; break;
        case 'JANMASHTAMI': monthDayStart = '08-25T00:00'; monthDayEnd = '08-26T00:00'; break;
        case 'GURU_NANAK_JAYANTI': monthDayStart = '11-25T00:00'; monthDayEnd = '11-26T00:00'; break;
        case 'GANESH_CHATURTHI': monthDayStart = '09-15T00:00'; monthDayEnd = '09-17T00:00'; break;
        case 'MAHASHIVRATRI': monthDayStart = '02-15T00:00'; monthDayEnd = '02-16T00:00'; break;
        case 'EID_UL_FITR': monthDayStart = '04-10'; monthDayEnd = '04-11'; break;
        case 'EID_AL_ADHA': monthDayStart = '06-16'; monthDayEnd = '06-17'; break;
      }

      return {
        type: 'FESTIVAL',
        festival_key: fest,
        starts_at: `${selectedYear}-${monthDayStart}+05:30`,
        ends_at: `${selectedYear}-${monthDayEnd}+05:30`,
        is_new: true
      };
    });

    setSchedules(generatedDrafts);
    toast.success(`Loaded all ${generatedDrafts.length} festivals for ${selectedYear}! Review and edit before saving.`);
  };

  // B. Add Blank Custom Row (Supports Festival & Corporate Double Selector)
  const handleAddCustomSchedule = () => {
    const newRow = {
      type: 'FESTIVAL', 
      festival_key: dbLists.festivals[0] || 'DIWALI',
      starts_at: `${selectedYear}-01-01T00:00+05:30`,
      ends_at: `${selectedYear}-01-02T00:00+05:30`,
      is_new: true
    };
    setSchedules([newRow, ...schedules]);
  };

  // C. Handle Date/Key Changes in Draft Rows
  const handleScheduleRowChange = (index: number, field: string, value: string) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
  };

  // D. Save All Schedules (Post to Database)
  const handleSaveAllSchedules = async () => {
    try {
      setLoading(true);

      // 🚀 CRITICAL FIX: datetime-local se aayi value me koi timezone nahi hoti
      // Hum explicitly "+05:30" lagate hain taaki koi confusion na ho
      const sanitizedSchedules = schedules.map(item => {
        let startsAt = item.starts_at;
        let endsAt = item.ends_at;

        const isLocalDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt || '');
        if (isLocalDateTime) {
          startsAt = startsAt + '+05:30';
        }

        const isLocalDateTimeEnd = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(endsAt || '');
        if (isLocalDateTimeEnd) {
          endsAt = endsAt + '+05:30';
        }

        // Agar pehle se UTC string hai (Z ya +00:00) toh waise hi chhod do
        return {
          ...item,
          starts_at: startsAt,
          ends_at: endsAt
        };
      });

      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_schedules',
          schedules: sanitizedSchedules
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save schedules');

      toast.success("All festival schedules saved and published!");
      await loadListsAndCount();
      await fetchSchedules(); 
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // E. Delete Single Row (DB or local draft)
  const handleDeleteRow = async (index: number, dbId?: string) => {
    if (!dbId) {
      setSchedules(schedules.filter((_, i) => i !== index));
      return;
    }

    const isConfirmed = window.confirm("Are you sure you want to delete this scheduled event?");
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_schedule',
          id: dbId
        })
      });

      if (!res.ok) throw new Error('Failed to delete schedule');

      toast.success("Schedule deleted!");
      await loadListsAndCount();
      await fetchSchedules();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleStatusBadge = (starts: string, ends: string) => {
    const now = new Date();
    const startDate = new Date(starts);
    const endDate = new Date(ends);

    if (now < startDate) {
      return <Badge className="bg-blue-500/10 text-blue-600 border border-blue-200">Upcoming</Badge>;
    }
    if (now >= startDate && now <= endDate) {
      return (
        <Badge className="bg-green-600 text-white border border-green-700 animate-pulse">
          Live Now
        </Badge>
      );
    }
    return <Badge className="bg-slate-300 text-slate-600">Ended</Badge>;
  };

  // FALLBACK LISTS
  const safeTypesList = dbLists.types.length > 0 
    ? dbLists.types 
    : ['SYSTEM_UPDATE', 'MAINTENANCE', 'SPECIAL_OFFER', 'EMERGENCY', 'ANNOUNCEMENT', 'EVENT'];

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
                  {safeTypesList.map(t => (
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

                  {/* Database live count display */}
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

      {/* ━━━ 📅 🚀 UPGRADED SECTION: DYNAMIC ANNUAL BROADCAST SCHEDULER (FUTURE PROOF) ━━━ */}
      <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white mt-12">
        <CardHeader className="bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="text-blue-400 w-6 h-6" /> Annual Broadcast Scheduler
            </CardTitle>
            <p className="text-slate-400 text-xs mt-1">Pre-plan any year's celebration timeline in draft before publishing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 🚀 Dynamic Future Proof Year Selector Selector */}
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-lg px-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Year:</span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-8 w-24 border-none text-white bg-transparent font-bold text-xs focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-800">
                  {yearsList.map((yr) => (
                    <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5"
              onClick={handleLoadYearPreset}
              disabled={loading}
            >
              <RotateCcw className="w-4 h-4" /> Load Preset
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-blue-600 hover:bg-blue-700 text-white border-none gap-1.5"
              onClick={handleAddCustomSchedule}
              disabled={loading}
            >
              <Plus className="w-4 h-4" /> Add Custom
            </Button>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              onClick={handleSaveAllSchedules}
              disabled={loading}
            >
              <Save className="w-4 h-4" /> Save All Schedules
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Calendar className="w-12 h-12 mx-auto stroke-1" />
              <p className="font-medium text-sm">No scheduled events found.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a Year, click "Load Preset" to dynamically import database drafts, or click "Add Custom" to plan your own.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Festival/Event</th>
                    <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Starts At (Date/Time)</th>
                    <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Ends At (Date/Time)</th>
                    <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Timeline Status</th>
                    <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      {/* Event Column (Clean Festival & Corporate selector) */}
                      <td className="p-4">
                        {item.is_new ? (
                          <div className="flex flex-col gap-2">
                            {/* A. Type Selector */}
                            <Select 
                              value={item.type || 'FESTIVAL'} 
                              onValueChange={(v) => {
                                const defaultKey = v === 'FESTIVAL' ? (dbLists.festivals[0] || 'DIWALI') : (safeTypesList[0] || 'ANNOUNCEMENT');
                                
                                // 🚀 Direct State Update instead of two separate async calls
                                const updated = [...schedules];
                                updated[index] = {
                                  ...updated[index],
                                  type: v,
                                  festival_key: defaultKey
                                };
                                setSchedules(updated);
                              }}
                            >
                              <SelectTrigger className="h-9 rounded-lg w-48 border-slate-200 text-xs font-black">
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FESTIVAL">🌸 FESTIVAL</SelectItem>
                                <SelectItem value="CORPORATE">🏢 CORPORATE</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* B. Event Key Selector */}
                            <Select 
                              value={item.festival_key} 
                              onValueChange={(v) => handleScheduleRowChange(index, 'festival_key', v)}
                            >
                              <SelectTrigger className="h-9 rounded-lg w-48 border-slate-200 font-bold text-xs text-slate-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[250px]">
                                {item.type === 'CORPORATE' ? (
                                  safeTypesList.map(t => (
                                    <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                                  ))
                                ) : (
                                  dbLists.festivals?.map(f => (
                                    <SelectItem key={f} value={f}>{f.replace('_', ' ')}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <Badge variant="outline" className={`font-bold px-3 py-1 ${item.type === 'CORPORATE' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
                            {item.festival_key?.replace('_', ' ')}
                          </Badge>
                        )}
                      </td>

                      {/* Starts At (Custom Styled Date-Time Picker) */}
                      <td className="p-4">
                        <input
                          type="datetime-local"
                          className="border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition-all text-xs font-semibold"
                          value={formatForDateTimeLocal(item.starts_at)} 
                          onChange={(e) => handleScheduleRowChange(index, 'starts_at', e.target.value)}
                        />
                      </td>

                      {/* Ends At (Custom Styled Date-Time Picker) */}
                      <td className="p-4">
                        <input
                          type="datetime-local"
                          className="border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition-all text-xs font-semibold"
                          value={formatForDateTimeLocal(item.ends_at)} 
                          onChange={(e) => handleScheduleRowChange(index, 'ends_at', e.target.value)}
                        />
                      </td>

                      {/* Status Column */}
                      <td className="p-4">
                        {item.is_new ? (
                          <Badge className="bg-yellow-500/10 text-yellow-600 border border-yellow-200 font-bold">Draft</Badge>
                        ) : (
                          getScheduleStatusBadge(item.starts_at, item.ends_at)
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="p-4 text-right">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          onClick={() => handleDeleteRow(index, item.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
