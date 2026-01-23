'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  Save, RotateCcw, Building2, Calculator, Shield, Database,
  Trash2, AlertTriangle, Moon, Sun, Upload, Download, Copy, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Extended Currency List
const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

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

  // Factory Reset State
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [isResetAllowed, setIsResetAllowed] = useState(false);

  // 1. Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      const user = JSON.parse(localStorage.getItem('current_user') || 'null');
      if (!user?.id) return;

      const finalId = user.client_id || user.id;
      setClientId(finalId);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', finalId)
        .single();

      if (data && !error) {
        setSettings({
            societyName: data.society_name || '',
            registrationNumber: data.registration_number || '',
            societyAddress: data.society_address || '',
            contactEmail: data.contact_email || '',
            currency: data.currency || 'INR',
            interestRate: data.interest_rate || 12,
            loanLimitPercent: data.loan_limit_percent || 80,
            fineAmount: data.fine_amount || 10,
            gracePeriodDay: data.grace_period_day || 10,
            theme: data.theme || 'light',
            autoBackup: data.auto_backup ?? true,
            emailNotifications: data.email_notifications ?? true,
            smsNotifications: data.sms_notifications ?? false
        });
        applyTheme(data.theme || 'light');
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  };

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
      applyTheme(settings.theme);
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'theme') applyTheme(value);
  };

  // ✅ 3. Backup Logic (Generate Token)
  const handleBackup = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('current_user') || 'null');
      if (!user?.id) return;

      // A. Fetch All Data (Snapshot)
      const [membersRes, loansRes, passbookRes] = await Promise.all([
        supabase.from('members').select('*').eq('client_id', user.client_id || user.id),
        supabase.from('loans').select('*').eq('client_id', user.client_id || user.id),
        supabase.from('passbook_entries').select('*').eq('client_id', user.client_id || user.id)
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        client_id: user.client_id || user.id,
        members: membersRes.data || [],
        loans: loansRes.data || [],
        passbook: passbookRes.data || [],
        version: '1.0'
      };

      // B. Generate Security Token (The Key)
      const securityToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // C. Add Token to Backup
      const finalPayload = {
        ...backupData,
        __security_token: securityToken // Ye token user ko milega
      };

      // D. Download JSON
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalPayload, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `saanify_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      // E. Save Token in Browser (For Verification)
      localStorage.setItem('factory_reset_token', securityToken);
      
      // F. Copy Token to Clipboard
      navigator.clipboard.writeText(securityToken);
      toast.success("Backup Downloaded! Security Token copied to clipboard. Save it safely.");

    } catch (error) {
      console.error(error);
      toast.error("Backup failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 4. Restore Logic
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target.result as string);
        
        // Basic Validation
        if (!content.members || !content.__security_token) {
          toast.error("Invalid backup file structure.");
          return;
        }

        // Token Validation
        const storedToken = localStorage.getItem('factory_reset_token');
        if (!storedToken || storedToken !== content.__security_token) {
          toast.error("Security Token Mismatch! Cannot restore data from this file.");
          return;
        }

        // If Valid -> Restore Logic (Placeholder)
        toast.success("File verified! Ready to restore (API integration required).");
        // NOTE: Actual Supabase restoration needs complex upsert logic which requires backend API usually.
      } catch (err) {
        toast.error("Error reading file");
      }
    };
    reader.readAsText(file);
  };

  // ✅ 5. Factory Reset Logic
  const handleFactoryReset = async () => {
    // 1. Get Token
    const userToken = resetTokenInput.trim();
    const storedToken = localStorage.getItem('factory_reset_token');

    // 2. Verify Token
    if (!userToken) {
        toast.error("Please enter your Security Token first.");
        return;
    }

    if (userToken !== storedToken) {
        toast.error("Invalid Security Token! You are not authorized to reset this data.");
        setIsResetAllowed(false);
        return;
    }

    // 3. Execute Reset
    if (!confirm("DANGER: This will wipe ALL data. Are you 100% sure?")) return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('current_user'));
      const finalId = user?.client_id || user?.id;

      // Delete everything for this client
      const { error: mError } = await supabase.from('members').delete().eq('client_id', finalId);
      const { error: lError } = await supabase.from('loans').delete().eq('client_id', finalId);
      const { error: pError } = await supabase.from('passbook_entries').delete().eq('client_id', finalId);
      const { error: tError } = await supabase.from('transactions').delete().eq('client_id', finalId); // Assuming transactions table

      if (mError || lError || pError || tError) throw new Error("Some data deletion failed");

      // Clear Local Token
      localStorage.removeItem('factory_reset_token');
      
      toast.success("Factory Reset Successful! Reloading...");
      setTimeout(() => window.location.reload(), 1500);

    } catch (err: any) {
      console.error(err);
      toast.error("Reset Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkTokenValidity = (val: string) => {
      const storedToken = localStorage.getItem('factory_reset_token');
      setIsResetAllowed(!!storedToken && val === storedToken);
  }

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 p-6 space-y-6 w-full max-w-6xl mx-auto">
      
      {/* Sticky Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-10 bg-white/60 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings & Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your society preferences and rules.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()} className="dark:bg-slate-800 dark:text-white dark:border-slate-700"><RotateCcw className="h-4 w-4 mr-2"/> Reset</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-2"/> Save Changes</>}
            </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR */}
        <div className="w-full lg:w-64 shrink-0">
            <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-row lg:flex-col h-auto bg-transparent gap-1 p-0">
                    <TabsTrigger value="profile" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-blue-600 rounded-none lg:rounded-r-lg text-gray-600 dark:text-gray-400 dark:data-[state=active]:text-white">
                        <Building2 className="h-4 w-4 mr-3"/> Society Profile
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-green-600 rounded-none lg:rounded-r-lg text-gray-600 dark:text-gray-400 dark:data-[state=active]:text-white">
                        <Calculator className="h-4 w-4 mr-3"/> Financial Rules
                    </TabsTrigger>
                    <TabsTrigger value="system" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-purple-600 rounded-none lg:rounded-r-lg text-gray-600 dark:text-gray-400 dark:data-[state=active]:text-white">
                        <Shield className="h-4 w-4 mr-3"/> Security & System
                    </TabsTrigger>
                    <TabsTrigger value="data" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-orange-600 rounded-none lg:rounded-r-lg text-gray-600 dark:text-gray-400 dark:data-[state=active]:text-white">
                        <Database className="h-4 w-4 mr-3"/> Data & Backup
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 space-y-6">
            
            {/* 1. PROFILE */}
            {activeTab === 'profile' && (
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm">
                    <CardHeader><CardTitle className="dark:text-white">Society Profile</CardTitle><CardDescription className="dark:text-gray-400">Basic information for reports and invoices.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2"><Label className="dark:text-gray-300">Society Name</Label><Input value={settings.societyName} onChange={(e) => handleChange('societyName', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"/></div>
                            <div className="space-y-2"><Label className="dark:text-gray-300">Reg. No.</Label><Input value={settings.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"/></div>
                        </div>
                        <div className="space-y-2"><Label className="dark:text-gray-300">Address</Label><Input value={settings.societyAddress} onChange={(e) => handleChange('societyAddress', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"/></div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2"><Label className="dark:text-gray-300">Contact Email</Label><Input value={settings.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"/></div>
                            <div className="space-y-2"><Label className="dark:text-gray-300">Currency</Label>
                              <Select value={settings.currency} onValueChange={(v) => handleChange('currency', v)}>
                                <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"><SelectValue/></SelectTrigger>
                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                  {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code} className="dark:text-white dark:focus:bg-slate-700">{c.name} ({c.symbol})</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 2. FINANCIAL */}
            {activeTab === 'financial' && (
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm">
                    <CardHeader><CardTitle className="dark:text-white">Financial Configuration</CardTitle><CardDescription className="dark:text-gray-400">Set interest rates and penalty rules.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="dark:text-gray-300">Annual Interest Rate (%)</Label>
                                <div className="relative"><Input type="number" value={settings.interestRate} onChange={(e) => handleChange('interestRate', e.target.value)} className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"/><span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-500 font-bold">%</span></div>
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-gray-300">Max Loan Limit (%) of Deposit)</Label>
                                <div className="relative"><Input type="number" value={settings.loanLimitPercent} onChange={(e) => handleChange('loanLimitPercent', e.target.value)} className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"/><span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-500 font-bold">%</span></div>
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-gray-300">Late Fine Amount (Daily)</Label>
                                <div className="relative"><Input type="number" value={settings.fineAmount} onChange={(e) => handleChange('fineAmount', e.target.value)} className="pl-12 dark:bg-slate-800 dark:border-slate-700 dark:text-white"/><span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-500 font-bold">{CURRENCIES.find(c => c.code === settings.currency)?.symbol}</span></div>
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-gray-300">Grace Period (Days)</Label>
                                <Select value={String(settings.gracePeriodDay)} onValueChange={(v) => handleChange('gracePeriodDay', v)}><SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"><SelectValue/></SelectTrigger><SelectContent className="dark:bg-slate-800 dark:border-slate-700">{Array.from({length: 28}, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)} className="dark:text-white dark:focus:bg-slate-700">{d}th of month</SelectItem>)}</SelectContent></Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 3. SYSTEM */}
            {activeTab === 'system' && (
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm">
                    <CardHeader><CardTitle className="dark:text-white">System Preferences</CardTitle><CardDescription className="dark:text-gray-400">Manage notifications and theme.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4 dark:border-slate-700">
                            <div className="space-y-0.5"><Label className="dark:text-gray-300">Theme</Label><p className="text-xs text-gray-500 dark:text-gray-500">Switch between light and dark mode</p></div>
                            <div className="flex items-center gap-2"><Sun className="h-4 w-4 text-gray-400 dark:text-gray-500"/><Switch checked={settings.theme === 'dark'} onCheckedChange={(c) => handleChange('theme', c ? 'dark' : 'light')}/><Moon className="h-4 w-4 text-blue-600 dark:text-blue-400"/></div>
                        </div>
                        <div className="flex items-center justify-between border-b pb-4 dark:border-slate-700">
                            <div className="space-y-0.5"><Label className="dark:text-gray-300">Auto Backup</Label><p className="text-xs text-gray-500 dark:text-gray-500">Daily automated data backup</p></div>
                            <Switch checked={settings.autoBackup} onCheckedChange={(c) => handleChange('autoBackup', c)}/>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5"><Label className="dark:text-gray-300">Email Alerts</Label><p className="text-xs text-gray-500 dark:text-gray-500">Receive transactional updates via email</p></div>
                            <Switch checked={settings.emailNotifications} onCheckedChange={(c) => handleChange('emailNotifications', c)}/>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 4. DATA (Fixed Layout & Dark Mode) */}
            {activeTab === 'data' && (
                <div className="space-y-6">
                    
                    {/* ✅ BACKUP CARD */}
                    <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm">
                        <CardHeader><CardTitle className="dark:text-white">Data Backup</CardTitle><CardDescription className="dark:text-gray-400">Download or restore your society data.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Downloading a backup generates a <strong>Security Token</strong>. 
                                This token is required to perform a Factory Reset.
                            </p>
                            
                            {/* ✅ FIXED: Grid Layout for Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:border-slate-700 dark:text-white" onClick={handleBackup}>
                                    <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" /> 
                                    <span>Download Backup JSON</span>
                                    {loading && <div className="absolute top-2 right-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div></div>}
                                </Button>
                                <div className="relative">
                                    <input type="file" onChange={handleRestore} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <Button variant="outline" className="w-full h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20 dark:border-slate-700 dark:text-white">
                                        <Upload className="h-6 w-6 text-green-600 dark:text-green-400"/> 
                                        <span>Restore from File</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ✅ DANGER ZONE CARD */}
                    <Card className="border-red-100 bg-red-50/30 dark:bg-red-950/10 dark:border-red-900">
                        <CardHeader><CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2"><Lock className="h-5 w-5"/> Danger Zone</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-6">
                                Factory reset will wipe all members, loans, and transaction history. This action cannot be undone. To enable, enter your <span className="font-bold">Security Token</span>.
                            </p>
                            
                            {/* ✅ FIXED: Token Input & Logic */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="flex-1">
                                    <Label className="dark:text-gray-300 mb-2">Security Token</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 text-gray-500 h-4 w-4" />
                                        <Input 
                                            type="password" 
                                            value={resetTokenInput} 
                                            onChange={(e) => {
                                                setResetTokenInput(e.target.value);
                                                checkTokenValidity(e.target.value);
                                            }} 
                                            placeholder="Paste token here..."
                                            className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        />
                                    </div>
                                    {isResetAllowed && <span className="absolute right-3 top-3 text-green-600 dark:text-green-400"><CheckCircle className="h-4 w-4" /></span>}
                                </div>
                            </div>

                            <Button 
                                variant="destructive" 
                                onClick={handleFactoryReset} 
                                disabled={!isResetAllowed}
                                className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Factory Reset
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
