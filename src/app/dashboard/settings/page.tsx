'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  Save, RotateCcw, Building2, Calculator, Shield, Database,
  AlertTriangle, Moon, Sun, Upload, Download, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [initialSettings, setInitialSettings] = useState<any>(null);

  const [settings, setSettings] = useState({
    societyName: '', registrationNumber: '', societyAddress: '', contactEmail: '',
    currency: 'INR', interestRate: 12, loanLimitPercent: 80, fineAmount: 10, gracePeriodDay: 10,
    theme: 'light', autoBackup: true, emailNotifications: true, smsNotifications: false
  });

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('clients').select('*').limit(1);
      if (data?.length) {
        const c = data[0];
        const loaded = {
          societyName: c.society_name || '',
          registrationNumber: c.registration_number || '',
          societyAddress: c.society_address || '',
          contactEmail: c.contact_email || '',
          currency: c.currency || 'INR',
          interestRate: c.interest_rate || 12,
          loanLimitPercent: c.loan_limit_percent || 80,
          fineAmount: c.fine_amount || 10,
          gracePeriodDay: c.grace_period_day || 10,
          theme: c.theme || 'light',
          autoBackup: c.auto_backup ?? true,
          emailNotifications: c.email_notifications ?? true,
          smsNotifications: c.sms_notifications ?? false
        };
        setClientId(c.id);
        setSettings(loaded);
        setInitialSettings(loaded);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('clients').update({
        society_name: settings.societyName,
        registration_number: settings.registrationNumber,
        society_address: settings.societyAddress,
        contact_email: settings.contactEmail,
        currency: settings.currency,
        interest_rate: settings.interestRate,
        loan_limit_percent: settings.loanLimitPercent,
        fine_amount: settings.fineAmount,
        grace_period_day: settings.gracePeriodDay,
        theme: settings.theme,
        auto_backup: settings.autoBackup,
        email_notifications: settings.emailNotifications,
        sms_notifications: settings.smsNotifications
      }).eq('id', clientId);

      if (error) throw error;

      setInitialSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (k: string, v: any) =>
    setSettings(p => ({ ...p, [k]: v }));

  /* ---------------- DERIVED UI STATES ---------------- */
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  const healthStatus = useMemo(() => {
    if (!settings.contactEmail) return { label: 'Email Missing', color: 'destructive' };
    if (!settings.autoBackup) return { label: 'Backup Disabled', color: 'warning' };
    return { label: 'All Good', color: 'success' };
  }, [settings]);

  if (loading)
    return <div className="p-10 text-center text-gray-400">Loading settings…</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* UNSAVED WARNING */}
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠ You have unsaved changes
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSettings(initialSettings)}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              Save Now
            </Button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border bg-white/70 backdrop-blur p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings & Configuration
          </h1>
          <p className="text-sm text-gray-500">
            Manage your society preferences securely.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              healthStatus.color === 'success'
                ? 'default'
                : healthStatus.color === 'warning'
                ? 'secondary'
                : 'destructive'
            }
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {healthStatus.label}
          </Badge>

          <Button variant="outline" onClick={() => location.reload()}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* SIDEBAR */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex lg:flex-col gap-2 bg-transparent p-0">
            {[
              ['profile', Building2, 'Society Profile'],
              ['financial', Calculator, 'Financial Rules'],
              ['system', Shield, 'Security & System'],
              ['data', Database, 'Data & Backup'],
            ].map(([v, Icon, label]: any) => (
              <TabsTrigger
                key={v}
                value={v}
                className="group justify-start gap-3 rounded-xl px-4 py-3 border bg-white hover:shadow data-[state=active]:border-blue-500 data-[state=active]:shadow-md"
              >
                <span className="p-2 rounded-lg bg-gray-100 group-data-[state=active]:bg-blue-100">
                  <Icon className="h-4 w-4 text-blue-600" />
                </span>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* CONTENT */}
        <div className="space-y-6">

          {activeTab === 'system' && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>Theme & notification controls</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-xs text-gray-500">Light / Dark mode</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <Switch
                      checked={settings.theme === 'dark'}
                      onCheckedChange={v => handleChange('theme', v ? 'dark' : 'light')}
                    />
                    <Moon className="h-4 w-4 text-indigo-600" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Auto Backup</p>
                    <p className="text-xs text-gray-500">
                      Last backup: Today 02:14 AM
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={v => handleChange('autoBackup', v)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Email Alerts</p>
                    <p className="text-xs text-gray-500">Transactional updates</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={v => handleChange('emailNotifications', v)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'data' && (
            <>
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>
                    Secure your data with manual backups
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <Download className="h-6 w-6" /> Download Backup
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <Upload className="h-6 w-6" /> Restore Backup
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" /> Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-600 mb-4">
                    Factory reset permanently deletes all society data.
                  </p>
                  <Button variant="destructive">Factory Reset</Button>
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
