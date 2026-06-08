'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

  // Change #2: Form state updated with new fields
  const [form, setForm] = useState({
    title: '',
    message: '',
    festival_key: 'DIWALI',
    animation_type: 'DIYA',
    display_mode: 'POPUP',
    theme_color: 'GOLD',
    target_audience: 'BOTH',
    image_url: '',

    language_mode: 'BOTH',
    full_screen_animation: true,
    dashboard_overlay: true
  });

  // Change #3: Publish function replaced with new logic
  const publishBroadcast = async () => {
    try {
      setLoading(true);

      const payload = {
        festival_key: form.festival_key,
        language_mode: form.language_mode,
        full_screen_animation: form.full_screen_animation,
        dashboard_overlay: form.dashboard_overlay
      };

      // Change #1: URL updated to broadcast-lab
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

            <div>
              <label className="text-sm font-medium">
                Title
              </label>

              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Message
              </label>

              <Textarea
                rows={4}
                value={form.message}
                onChange={(e) =>
                  setForm({
                    ...form,
                    message: e.target.value,
                  })
                }
              />
            </div>

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

            <div>
              <label className="text-sm font-medium">
                Animation
              </label>

              <Select
                value={form.animation_type}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    animation_type: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="DIYA">Diya</SelectItem>
                  <SelectItem value="FIREWORKS">Fireworks</SelectItem>
                  <SelectItem value="HOLI">Holi Color</SelectItem>
                  <SelectItem value="SNOW">Snow</SelectItem>
                  <SelectItem value="MOON">Moon</SelectItem>
                  <SelectItem value="FLOWERS">Flowers</SelectItem>
                  <SelectItem value="CONFETTI">Confetti</SelectItem>
                  <SelectItem value="SPARKLES">Sparkles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Change #4: Language Selector added below Animation */}
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

            {/* Change #5: Testing Switches added */}
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

            <div>
              <label className="text-sm font-medium">
                Display Mode
              </label>

              <Select
                value={form.display_mode}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    display_mode: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="TOP_BANNER">
                    Top Banner
                  </SelectItem>

                  <SelectItem value="BOTTOM_BANNER">
                    Bottom Banner
                  </SelectItem>

                  <SelectItem value="POPUP">
                    Popup
                  </SelectItem>

                  <SelectItem value="FULLSCREEN">
                    Fullscreen
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  {form.animation_type}
                </span>

                <span className="px-3 py-1 rounded-full bg-white/10 text-xs">
                  {form.display_mode}
                </span>

              </div>

            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
