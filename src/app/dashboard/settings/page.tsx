'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { 
  Save, RotateCcw, Building2, Calculator, Shield, Database, 
  Trash2, AlertTriangle, Moon, Sun, Upload, Download, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Settings State
  const [settings, setSettings] = useState({
    societyName: '', registrationNumber: '', societyAddress: '', contactEmail: '',
    currency: 'INR', interestRate: 12, loanLimitPercent: 80, fineAmount: 10, gracePeriodDay: 10,
    theme: 'light', autoBackup: true, emailNotifications: true, smsNotifications: false
  });

  // 1. Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: clients } = await supabase.from('clients').select('*').limit(1);
      if (clients && clients.length > 0) {
        const c = clients[0];
        setClientId(c.id);
        setSettings({
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
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  // 2. Save Handler
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
        toast.success("Settings saved successfully!");
    } catch (err: any) {
        toast.error("Failed to save settings: " + err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Sticky Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings & Configuration</h1>
          <p className="text-gray-500 text-sm">Manage your society preferences and rules.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}><RotateCcw className="h-4 w-4 mr-2"/> Reset</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-2"/> Save Changes</>}
            </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-64 shrink-0">
            <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-row lg:flex-col h-auto bg-transparent gap-1 p-0">
                    <TabsTrigger value="profile" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-blue-600 rounded-none lg:rounded-r-lg text-gray-600">
                        <Building2 className="h-4 w-4 mr-3"/> Society Profile
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-green-600 rounded-none lg:rounded-r-lg text-gray-600">
                        <Calculator className="h-4 w-4 mr-3"/> Financial Rules
                    </TabsTrigger>
                    <TabsTrigger value="system" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-purple-600 rounded-none lg:rounded-r-lg text-gray-600">
                        <Shield className="h-4 w-4 mr-3"/> Security & System
                    </TabsTrigger>
                    <TabsTrigger value="data" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-orange-600 rounded-none lg:rounded-r-lg text-gray-600">
                        <Database className="h-4 w-4 mr-3"/> Data & Backup
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 space-y-6">
            
            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
                <Card>
                    <CardHeader><CardTitle>Society Profile</CardTitle><CardDescription>Basic information for reports and invoices.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2"><Label>Society Name</Label><Input value={settings.societyName} onChange={(e) => handleChange('societyName', e.target.value)} placeholder="e.g. Gokuldham Society"/></div>
                            <div className="space-y-2"><Label>Registration No.</Label><Input value={settings.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} placeholder="Reg. No."/></div>
                        </div>
                        <div className="space-y-2"><Label>Address</Label><Input value={settings.societyAddress} onChange={(e) => handleChange('societyAddress', e.target.value)} placeholder="Full Address"/></div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2"><Label>Contact Email</Label><Input value={settings.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} placeholder="admin@society.com"/></div>
                            <div className="space-y-2"><Label>Currency</Label><Select value={settings.currency} onValueChange={(v) => handleChange('currency', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="INR">Indian Rupee (₹)</SelectItem><SelectItem value="USD">US Dollar ($)</SelectItem></SelectContent></Select></div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 2. FINANCIAL TAB */}
            {activeTab === 'financial' && (
                <Card>
                    <CardHeader><CardTitle>Financial Configuration</CardTitle><CardDescription>Set interest rates and penalty rules.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Annual Interest Rate (%)</Label>
                                <div className="relative"><Input type="number" value={settings.interestRate} onChange={(e) => handleChange('interestRate', e.target.value)} className="pl-10"/><span className="absolute left-3 top-2.5 text-gray-500 font-bold">%</span></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Max Loan Limit (% of Deposit)</Label>
                                <div className="relative"><Input type="number" value={settings.loanLimitPercent} onChange={(e) => handleChange('loanLimitPercent', e.target.value)} className="pl-10"/><span className="absolute left-3 top-2.5 text-gray-500 font-bold">%</span></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Late Fine Amount (Daily)</Label>
                                <div className="relative"><Input type="number" value={settings.fineAmount} onChange={(e) => handleChange('fineAmount', e.target.value)} className="pl-10"/><span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Fine Applies After (Day of Month)</Label>
                                <Select value={String(settings.gracePeriodDay)} onValueChange={(v) => handleChange('gracePeriodDay', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Array.from({length: 28}, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)}>{d}th of month</SelectItem>)}</SelectContent></Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 3. SECURITY TAB */}
            {activeTab === 'system' && (
                <Card>
                    <CardHeader><CardTitle>System Preferences</CardTitle><CardDescription>Manage notifications and theme.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="space-y-0.5"><Label>Theme</Label><p className="text-xs text-gray-500">Switch between light and dark mode</p></div>
                            <div className="flex items-center gap-2"><Sun className="h-4 w-4 text-gray-400"/><Switch checked={settings.theme === 'dark'} onCheckedChange={(c) => handleChange('theme', c ? 'dark' : 'light')}/><Moon className="h-4 w-4 text-blue-600"/></div>
                        </div>
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="space-y-0.5"><Label>Auto Backup</Label><p className="text-xs text-gray-500">Daily automated data backup</p></div>
                            <Switch checked={settings.autoBackup} onCheckedChange={(c) => handleChange('autoBackup', c)}/>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5"><Label>Email Alerts</Label><p className="text-xs text-gray-500">Receive transactional updates via email</p></div>
                            <Switch checked={settings.emailNotifications} onCheckedChange={(c) => handleChange('emailNotifications', c)}/>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 4. DATA TAB (Backup/Reset) */}
            {activeTab === 'data' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Data Backup</CardTitle><CardDescription>Download or restore your society data.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-blue-50 hover:border-blue-200" onClick={() => toast.info("Backup Started...")}>
                                    <Download className="h-6 w-6 text-blue-600"/> <span>Download Backup JSON</span>
                                </Button>
                                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-green-50 hover:border-green-200">
                                    <Upload className="h-6 w-6 text-green-600"/> <span>Restore from File</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100 bg-red-50/30">
                        <CardHeader><CardTitle className="text-red-700 flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Danger Zone</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-red-600 mb-4">Factory reset will wipe all members, loans, and transaction history. This action cannot be undone.</p>
                            <Button variant="destructive" onClick={() => { if(confirm("Type DELETE to confirm")) toast.error("Reset functionality locked for safety."); }}>Factory Reset</Button>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
