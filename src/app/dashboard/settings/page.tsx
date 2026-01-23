'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Save, RotateCw, Building2, Calculator, Shield, Database, 
  Trash2, AlertTriangle, Moon, Sun, 
  Upload, Download 
} from 'lucide-react'; // ✅ FIX: Typo fixed (lucice-react -> lucide-react)

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

// ✅ FIX: 'lucice-react' (Typo fixed)
// ✅ FIX: 'lucide-react' (Imports fixed)

// ✅ CURRENCIES LIST (Cleaned up for safety)
const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export default function SettingsPage() {
  // ✅ Hook call karo (Manual formatting removed)
  const { formatCurrency } = useCurrency();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Local state

  const [societyName, setSocietyName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [societyAddress, setSocietyAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  const [currency, setCurrency] = useState('INR');
  const [interestRate, setInterestRate] = useState(12);
  const [loanLimitPercent, setLoanLimitPercent] = useState(80);
  const [fineAmount, setFineAmount] = useState(10);
  const [gracePeriodDay, setGracePeriodDay] = useState(10);
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // 1. Init: Get Correct Client ID
  useEffect(() => {
    const fetchSettings = async () => {
      const user = JSON.parse(localStorage.getItem('current_user') || 'null');
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // ✅ FIX: Try to get data from admins table
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*') 
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          // Logic: Treasurer -> Owner ID, Owner -> Own ID
          const targetId = data.client_id ? data.client_id : user.id;
          setClientId(targetId);
        } else {
            // Fallback
            console.warn("DB Fetch failed, using LocalStorage fallback");
            setClientId(user.client_id || user.id);
        }
      } catch (err) {
        console.error("Critical ID Resolution Error:", err)
        setClientId(user.id)
      }
    };

    // 2. Fetch Data Trigger
    useEffect(() => {
      if (clientId) {
        fetchSettings();
      }
    }, [clientId]);

  // 3. Main Data Fetching
  const fetchSettings = async () => {
    setLoading(true);
    if (!clientId) return;

    try {
        const { data, error } = await supabase.from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (data && !error) {
            setSocietyName(data.society_name || '');
            setRegNumber(data.registration_number || '');
            setSocietyAddress(data.society_address || '');
            setContactEmail(data.contact_email || '');
            setCurrency(data.currency || 'INR');
            setInterestRate(data.interest_rate || 12);
            setLoanLimitPercent(data.loan_limit_percent || 80);
            setFineAmount(data.fine_amount || 10);
            setGracePeriodDay(data.grace_period_day || 10);
            setAutoBackup(data.auto_backup ?? true);
            setEmailNotifications(data.email_notifications ?? true);
            setSmsNotifications(data.sms_notifications ?? false);
            setTheme(data.theme || 'light');
        }
    } catch (error) {
        console.error("Final Fetch Error:", error);
    } finally {
        setLoading(false);
    }
  };

  // 4. Calculate Stats
  const [stats, setStats] = useState({
    netBalance: 0,
    totalFeesCollected: 0,
    totalExpenses: 0,
    membersPaidCount: 0
  });

  const getCategoryColor = (category: string) => {
    const colors: any = {
      'MAINTENANCE_FEE': 'bg-green-100 text-green-800',
      'STATIONERY': 'bg-blue-100 text-blue-800',
      'PRINTING': 'bg-purple-100 text-purple-800',
      'LOAN_FORMS': 'bg-orange-100 text-orange-800',
      'REFRESHMENTS': 'bg-pink-100 text-pink-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  };

  const getCategoryLabel = (category: string) => {
    const labels: any = {
      'MAINTENANCE_FEE': 'Maintenance Fee',
      'STATIONERY': 'Stationery',
      'PRINTING': 'Printing',
      'LOAN_FORMS': 'Loan Forms',
      'REFRESHMENTS': 'Refreshments',
      'OTHER': 'Other'
    }
    return labels[category] || category
  };

  // 5. Handle Save
  const handleSave = async () => {
    if (!clientId) return;
    
    setSaving(true);
    try {
        const { error } = await supabase.from('clients').update({
            society_name: societyName,
            registration_number: regNumber,
            society_address: societyAddress,
            contact_email: contactEmail,
            currency: currency,
            interest_rate: Number(interestRate),
            loan_limit_percent: Number(loanLimitPercent),
            fine_amount: Number(fineAmount),
            grace_period_day: Number(gracePeriodDay),
            theme: theme,
            auto_backup: autoBackup,
            email_notifications: emailNotifications,
            sms_notifications: smsNotifications
        }).eq('id', clientId);

        if (error) throw error;

        // Apply Theme
        applyTheme(theme);

        toast.success("Settings saved successfully!");
    } catch (err: any) {
        console.error("Error saving settings:", err);
        toast.error("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 6. Helper: Apply Theme
  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-sm text-gray-500">Loading settings...</p>
    </div>
  );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Sticky Header */}
      <div className="flex items-center justify-between border-b pb-4 sticky top-0 bg-gray-50/80 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your society preferences and rules.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => window.location.reload()}><RotateCw className="h-4 w-4 mr-2" /> Refresh</Button>
           <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
              {saving ? <Save className="h-4 w-4 mr-2 animate-spin" : <Save className="h-4 w-4 mr-2" /> Save Changes}
           </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-64 shrink-0">
            <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex flex-row lg:flex-col h-auto bg-transparent p-1">
                    <TabsTrigger value="profile" className="w-full justify-start px-4 py-3 text-left"><Building2 className="h-4 w-4 mr-2"/> Society Profile</TabsTrigger>
                    <TabsTrigger value="financial" className="w-full justify-start px-4 py-3 text-left"><Calculator className="h-4 w-4 mr-2"/> Financial Rules</TabsTrigger>
                    <TabsTrigger value="system" className="w-full justify-start px-4 py-3 text-left"><Shield className="h-4 w-4 mr-2"/> System</TabsTrigger>
                    <TabsTrigger value="data" className="w-full justify-start px-4 py-3 text-left"><Database className="h-4 w-4 mr-2"/> Data Backup</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1">
            
            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
                <Card>
                    <CardHeader><CardTitle>Society Profile</CardTitle><CardDescription>Basic information for reports and invoices.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2"><Label>Society Name</Label><Input value={societyName} onChange={(e) => setSocietyName(e.target.value)} placeholder="e.g. Gokuldham Society" /></div>
                            <div className="space-y-2"><Label>Registration No.</Label><Input type="number" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="12345..." /></div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2"><Label>Address</Label><Textarea value={societyAddress} onChange={(e) => setSocietyAddress(e.target.value)} placeholder="Sector 4, Near Main Road..." className="h-20" /></div>
                            <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="admin@mysociety.com" /></div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 2. FINANCIAL TAB */}
            {activeTab === 'financial' && (
                <Card>
                    <CardHeader><CardTitle>Financial Configuration</CardTitle><CardDescription>Set interest rates, loan limits, and currency.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Select Currency</Label>
                                <div className="relative w-64">
                                    <div className="absolute right-2 top-2.5 pointer-events-none z-10">{symbol}</div>
                                    <Select value={currency} onValueChange={(v) => setCurrency(v)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {CURRENCIES.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>{c.name} ({c.symbol})}</SelectItem>)
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Annual Interest Rate (%)</Label>
                                <div className="relative"><Input type="number" className="pl-10 text-right" placeholder="12" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} /><span className="absolute left-3 top-2.5 text-gray-400 font-bold">%</span></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Max Loan Limit (%)</Label>
                                <div className="relative"><Input type="number" className="pl-10 text-right" placeholder="80" value={loanLimitPercent} onChange={(e) => setLoanLimitPercent(e.target.value)} /><span className="absolute left-3 top-2.5 text-gray-400 font-bold">%</span></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Late Fee (Lifetime)</Label>
                                <div className="relative"><Input type="number" className="pl-10 text-right" placeholder="10" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} /><span className="absolute left-3 top-2.5 text-gray-400 font-bold">{formatCurrency(0)}</span></div>
                            </div>
                        </div>
                        </CardContent>
                </Card>
            )}

            {/* 3. SYSTEM TAB */}
            {activeTab === 'system' && (
                <Card>
                    <CardHeader><CardTitle>System Preferences</CardTitle><CardDescription>Manage notifications, theme, and backup settings.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* Theme */}
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="space-y-2">
                                <Label>App Theme</Label>
                                <p className="text-xs text-gray-500">Switch between light and dark mode</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Moon className={`h-5 w-5 text-gray-400 ${theme === 'dark' ? 'text-yellow-400' : ''}`} />
                                <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')}/>
                            </div>
                        </div>

                        {/* Backup & Notifications */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <Label>Auto Backup</Label>
                                        <p className="text-xs text-gray-500">Download database daily.</p>
                                    </div>
                                    <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Notifications</Label>
                                        <p className="text-xs text-gray-500">Get daily reports.</p>
                                    </div>
                                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                                </div>
                        </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 4. DATA TAB */}
            {activeTab === 'data' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Data Management</CardTitle><CardDescription>Download or restore your society data.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4">
                                <Button variant="outline" className="w-24 h-24 flex flex-col gap-2 border-dashed border-gray-300 hover:bg-blue-50"><Download className="h-8 w-6 text-blue-500 mb-1"/> Download JSON</Button>
                                <Button variant="outline" className="w-24 h-24 flex-col gap-2 border-dashed border-gray-300 hover:bg-green-50"><Upload className="h-8 w-6 text-green-500 mb-1"/> Restore from File</Button>
                            </div>

                            <Card className="border-orange-100 shadow-sm bg-orange-50/30">
                                <CardHeader className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Danger Zone</CardHeader>
                                <CardContent>
                                    <p className="text-sm text-orange-800 font-medium">
                                        <strong>Warning:</strong> Factory reset will wipe all members, loans, passbook, expenses, etc.
                                    </p>
                                    <p className="text-sm text-orange-700">
                                        This action <strong>CANNOT be undone.</strong>
                                    </p>
                                    <Button variant="destructive" onClick={() => { if(confirm("⚠️ CRITICAL: This will wipe ALL data. Are you absolutely sure?")) { console.warn("Simulated factory reset."); alert("Reset functionality not connected to API yet."); } }>
                                        <Database className="text-red-600 hover:bg-red-100"/>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
            
      </div>
    </div>
  );
}
