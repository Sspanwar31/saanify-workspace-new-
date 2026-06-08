'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Input and Textarea removed as they are unused now
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Globe } from 'lucide-react';

export default function BroadcastLabPage() {
  const [loading, setLoading] = useState(false);

  // Updated Form state: Removed title, message, animation_type, theme_color, display_mode
  const [form, setForm] = useState({
    festival_key: 'DIWALI',
    language_mode: 'BOTH',
    full_screen_animation: true,
    dashboard_overlay: true
  });

  const publishBroadcast = async () => {
    try {
      setLoading(true);

      const payload = {
        festival_key: form.festival_key,
        language_mode: form.language_mode,
        full_screen_animation: form.full_screen_animation,
        dashboard_overlay: form.dashboard_overlay
      };

      const res = await fetch('/api/admin/broadcast-lab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      toast.success('Broadcast Generated');

      console.log(data);

    } catch (err:any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Broadcast Lab V2
        </h1>

        <p className="text-muted-foreground">
          Test new greeting engine safely without affecting production.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* FORM */}
        <Card>
          <CardHeader>
            <CardTitle>
              Broadcast Configuration
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* REMOVED: Title Input */}
            {/* REMOVED: Message Input */}

            <div>
              <label className="text-sm font-medium">
                Festival
              </label>

              <Select
                value={form.festival_key}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    festival_key: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="DIWALI">Diwali</SelectItem>
                  <SelectItem value="HOLI">Holi</SelectItem>
                  <SelectItem value="EID">Eid</SelectItem>
                  <SelectItem value="CHRISTMAS">Christmas</SelectItem>
                  <SelectItem value="REPUBLIC_DAY">Republic Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* REMOVED: Animation Select */}

            <div>
              <label className="text-sm font-medium">
                Language
              </label>

              <Select
                value={form.language_mode}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    language_mode: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="HI">Hindi</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="BOTH">Hindi + English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <span>Dashboard Overlay</span>

              <input
                type="checkbox"
                checked={form.dashboard_overlay}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dashboard_overlay: e.target.checked
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <span>Full Screen Animation</span>

              <input
                type="checkbox"
                checked={form.full_screen_animation}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_screen_animation: e.target.checked
                  })
                }
              />
            </div>

            {/* REMOVED: Display Mode Select (as it's not being sent in the payload) */}

            <Button
              className="w-full"
              onClick={publishBroadcast}
              disabled={loading}
            >
              <Globe className="mr-2 h-4 w-4" />
              Publish To V2 API
            </Button>

          </CardContent>
        </Card>

        {/* PREVIEW */}
        <Card>
          <CardHeader>
            <CardTitle>
              Live Preview
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="rounded-3xl overflow-hidden h-[500px] bg-slate-900 text-white relative flex flex-col justify-center items-center p-8">

              <Sparkles className="w-12 h-12 mb-4 text-yellow-400" />

              {/* Preview will show defaults since title/message are now automated */}
              <div className="text-4xl font-black text-center uppercase">
                {form.title || 'Greeting Title'}
              </div>

              <div className="mt-4 text-center text-white/80">
                {form.message || 'Greeting message preview'}
              </div>

              <div className="mt-8 flex gap-2 flex-wrap justify-center">

                <span className="px-3 py-1 rounded-full bg-white/10 text-xs">
                  {form.festival_key}
                </span>

                <span className="px-3 py-1 rounded-full bg-white/10 text-xs">
                  {form.language_mode}
                </span>

              </div>

            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
