'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from 'sonner';
import { Sparkles, Globe, FlaskConical, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
      const finalKey = form.type === 'FESTIVAL' ? form.festival_key : form.type;
      const payload = {
        festival_key: finalKey,
        language_mode: form.language_mode,
        full_screen_animation: form.full_screen_animation,
        dashboard_overlay: form.dashboard_overlay,
        preview_mode: true 
      };

      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("API Error");
      toast.success(`${finalKey} Generated!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <FlaskConical className="text-blue-600" /> Broadcast Lab V2
          </h1>
        </div>
        <Link href="/broadcast-preview" target="_blank">
          <Button variant="outline" className="gap-2">Preview <ExternalLink className="w-4 h-4" /></Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="shadow-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-900 text-white"><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-6">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>{BROADCAST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>

            {form.type === 'FESTIVAL' && (
              <Select value={form.festival_key} onValueChange={(v) => setForm({ ...form, festival_key: v })}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">{FESTIVALS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            )}

            <Button className="w-full h-16 bg-blue-600 rounded-2xl text-xl font-bold" onClick={publishBroadcast} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'GENERATE PREVIEW'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] bg-slate-900 text-white flex items-center justify-center p-12 text-center">
            <div className="space-y-4">
              <Sparkles className="w-12 h-12 mx-auto text-yellow-400" />
              <h2 className="text-3xl font-black uppercase italic text-blue-400">{form.type === 'FESTIVAL' ? form.festival_key : form.type}</h2>
              <p className="text-slate-400">Ready to test in V2 Engine.</p>
            </div>
        </Card>
      </div>
    </div>
  );
}
