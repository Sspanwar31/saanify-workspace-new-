'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { 
  Save, RotateCw, Building2, Calculator, Database, 
  Trash2, AlertTriangle, Moon, Sun 
  Upload, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ✅ IMPORT KARO
import { useCurrency } from '@/hooks/useCurrency'; 

// ✅ CURRENCIES LIST
const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export default function SettingsPage() {
  // ✅ Hook call karo
  const { formatCurrency, symbol } = useCurrency();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Local state

  const [societyName, setSocietyName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [societyAddress, setSocietyAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  // Currency Defaults
  const [currency, setCurrency] = useState('INR');
  const [interestRate, setInterestRate] = useState('12');
  const [loanLimit, setLoanLimit] = useState('80');
  const [fineAmount, setFineAmount] = useState(10);
  const [gracePeriodDay, setGracePeriodDay] = useState(10);
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // 1. Init ID Fetch
  useEffect(() => {
    const init = async () => {
      const user = JSON.parse(localStorage.getItem('current_user') || 'null');
      if (user?.id) {
        const id = user.client_id || user.id;
        setClientId(id);
      } else {
        setClientId(null);
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      if (!clientId) return;

      try {
        const { data, error } = await supabase
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
          setLoanLimit(data.loan_limit || 80);
          setFineAmount(data.fine_amount || 10);
          setGracePeriodDay(data.grace_period_day || 10);
          setAutoBackup(data.auto_backup ?? true);
          setEmailNotifications(data.email_notifications ?? true);
          setSmsNotifications(data.sms_notifications ?? false);
          setTheme(data.theme || 'light');
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [clientId]);

  // --- Handlers ---
  const handleSave = async () => {
    if (!clientId) return;
    
    setSaving(true);
    try {
        // 1. Update DB
        const { error } = await supabase.from('clients').update({
            society_name: societyName,
            registration_number: regNumber,
            society_address: societyAddress,
            contact_email: contactEmail,
            currency: currency,
            interest_rate: Number(interestRate),
            loan_limit: Number(loanLimit),
            fine_amount: Number(fineAmount),
            grace_period_day: Number(gracePeriodDay),
            auto_backup: autoBackup,
            email_notifications: emailNotifications,
            sms_notifications: smsNotifications,
            theme: theme
          }).eq('id', clientId);

        if (error) throw error;

        // 2. Apply Theme to DOM (Visual Update)
        applyTheme(theme);

        toast.success("Settings saved!");
        // Optional: Refresh page to reload data with new theme
        // window.location.reload(); 
    } catch (err: any) {
        console.error("Error saving settings:", err);
        toast.error("Failed to save settings.");
    } finally {
        setSaving(false);
    }
  };

  const handleFactoryReset = () => {
    if(!confirm("⚠️ CRITICAL: This will wipe ALL data including members, loans, passbook, expenses, etc. This action CANNOT be undone. Are you absolutely sure?")) return;
    
    if(!clientId) return;

    setSaving(true);
    // (Simulate heavy operation or reset if needed)
    setTimeout(() => {
        setSaving(false);
        toast.error("Reset function is a placeholder for security reasons.");
    }, 1000);
  };

  // Helper: Apply Theme
  const applyTheme = (theme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 mx-auto mb-4"></div><p className="text-sm text-gray-500">Loading Settings...</p></div>;

  return (
    <div className="p-6 space-y-8 max-w-[1200px] mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Society configuration and preferences</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={handleFactoryReset} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Database className="h-4 w-4 mr-2" /> Factory Reset</Button>
           <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]" disabled={saving}>
             {saving ? <Save className="h-4 w-4 mr-2 animate-spin" : <Save className="h-4 w-4 mr-2" /> Save Changes}
           </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-72 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             <TabsList className="flex flex-col h-auto bg-white border shadow-sm rounded-xl p-2">
                <TabsTrigger value="profile" className="w-full justify-start px-4 py-3 hover:bg-blue-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><Building2 className="h-4 w-4 mr-2" /> Profile</TabsTrigger>
                <TabsTrigger value="financial" className="w-full justify-start px-4 py-3 hover:bg-gray-100 data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700"><Calculator className="h-4 w-4 mr-2" /> Financial</TabsTrigger>
                <TabsTrigger value="system" className="w-full justify-start px-4 py-3 hover:bg-gray-100 data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700"><Shield className="h-4 w-4 mr-2" /> System</TabsTrigger>
                <TabsTrigger value="data" className="w-full justify-start px-4 py-3 hover:bg-gray-100 data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700"><Database className="h-4 w-4 mr-2" /> Data Management</TabsTrigger>
             </TabsList>
          </Tabs>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1">

            {/* TAB 1: SOCIETY PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Info Card */}
                <Card className="border-l-4 border-l-purple-200 bg-purple-50">
                  <CardHeader>
                        <CardTitle className="text-xl text-purple-900">
                          Society Details
                        </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Society Name</Label>
                                <Input value={societyName} onChange={(e) => setSocietyName(e.target.value)} className="bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>Registration No.</Label>
                                <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className="bg-white" />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>Society Address</Label>
                                <Textarea placeholder="Enter address" value={societyAddress} onChange={(e) => setSocietyAddress(e.target.value)} className="bg-white" />
                            </div>
                        </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 2: FINANCIAL */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                {/* Financial Config */}
                <Card>
                  <CardHeader>
                        <CardTitle className="text-xl text-purple-900">
                          Financial Rules & Currency
                        </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                        {/* Currency Selector */}
                        <div className="space-y-2">
                          <Label>Select Currency</Label>
                          <div className="relative w-64">
                              <div className="absolute right-2 top-2.5 pointer-events-none z-10">{symbol}</div>
                              <Select value={currency} onValueChange={(v) => setCurrency(v)} className="w-full">
                                  <SelectTrigger><SelectValue placeholder="Select Currency..." /></SelectTrigger>
                                  <SelectContent>
                                      {CURRENCIES.map((c) => (
                                          <SelectItem key={c.code} value={c.code}>{c.name} ({c.symbol})}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                        </div>
                        {/* Preview */}
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">Currency Preview:</p>
                          <p className="text-2xl font-mono text-gray-900">{formatCurrency(5000)}</p>
                          <p className="text-sm text-gray-500">This is how currency will look in the app.</p>
                        </div>

                        {/* Rules */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm">Annual Interest Rate (%)</Label>
                                <div className="relative w-24"><Input type="number" className="pl-7 text-right" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="bg-white" /><span className="absolute left-3 top-2.5 font-bold text-gray-400">%</span></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <Label className="text-sm">Max Loan Limit (%) of Deposit</Label>
                                <div className="relative w-24"><Input type="number" className="pl-7 text-right" value={loanLimit} onChange={(e) => setLoanLimit(e.target.value)} className="bg-white" /><span className="absolute left-3 top-2.5 font-bold text-gray-400">%</span></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <Label className="text-sm">Maintenance Fee (Lifetime)</Label>
                                <div className="relative w-24"><Input type="number" className="pl-7 text-right" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} className="bg-white" /></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <Label className="text-sm">Grace Period (Days)</Label>
                                <div className="relative w-24"><Input type="number" className="pl-7 text-right" value={gracePeriodDay} onChange={(e) => setGracePeriodDay(e.target.value)} className="bg-white" /><span className="absolute left-3 top-2.5 font-bold text-gray-400">Days</span></div>
                            </div>
                        </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 3: SYSTEM & SECURITY */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                {/* System Config */}
                <Card className="border-l-4 border-l-green-200 bg-green-50">
                  <CardHeader>
                        <CardTitle className="text-xl text-green-900">
                          System Preferences
                        </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                        {/* Theme Switch */}
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="space-y-1">
                              <Label>App Theme</Label>
                              <p className="text-xs text-gray-500">Choose appearance</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Moon className={`h-5 w-5 text-gray-500 ${theme === 'dark' ? 'text-yellow-400' : ''}`} />
                                <Switch
                                    checked={theme === 'dark'}
                                    onCheckedChange={() => {
                                        const newTheme = theme === 'dark' ? 'light' : 'dark';
                                        setTheme(newTheme);
                                    }}
                                    className="data-[state=active]:data-[state=active]:bg-blue-600" 
                                    data-[state=active]:data-[state=active]:checked:bg-blue-600 data-[state=active]:focus:ring-blue-500 data-[state=active]:data-[state=active]:hover:bg-blue-700
                                    data-[state=active]:checked:bg-blue-600 checked:bg-blue-600
                              }
                                />
                            </div>
                        </div>

                        {/* Auto Backup */}
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="space-y-1">
                                <Label>Auto Backup</Label>
                                <p className="text-xs text-gray-500">Download database daily.</p>
                            </div>
                            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                        </div>

                        {/* Notifications */}
                        <div className="flex flex-col gap-4">
                           <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-1">
                                    <Label>Email Notifications</Label>
                                    <p className="text-xs text-gray-500">Get daily reports.</p>
                                </div>
                                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                           </div>
                           <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-1">
                                    <Label>SMS Notifications</Label>
                                    <p className="text-xs text-gray-500">Updates via SMS.</p>
                                </div>
                                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                           </div>
                        </div>

                        {/* Factory Reset */}
                        <div className="pt-2">
                          <Button variant="destructive" onClick={handleFactoryReset} className="w-full">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Factory Reset
                          </Button>
                          <p className="text-xs text-gray-400 mt-1">
                             <AlertTriangle className="inline-block w-3 h-3 mr-1"/> 
                             Wipes all data.
                          </p>
                        </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 4: DATA MANAGEMENT */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="text-xl text-gray-800">
                            Data Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">System Data</h3>
                                <p className="text-sm text-gray-500">Manage core data integrity.</p>
                            </div>
                            <RefreshCw className="text-blue-500 cursor-pointer" onClick={() => toast.info('Syncing...')} />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button variant="outline" className="h-12 w-12 border border-gray-300">
                                <Download className="h-4 w-4 mr-2"/>
                                Backup
                            </Button>
                            <Button className="h-12 w-12 border-gray-300 bg-white">
                                <Upload className="h-4 w-4 mr-2"/>
                                Restore
                            </Button>
                        </div>
                        <div className="h-[1px] w-full bg-gray-200 my-2"></div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                             <div className="bg-gray-50 p-4 rounded-lg">
                                 <h4 className="text-sm text-gray-500 font-medium">Total Members</h4>
                                 <p className="text-xl font-bold text-gray-900">154</p>
                             </div>
                             <div className="bg-gray-50 p-4 rounded-lg">
                                 <h4 className="text-sm text-gray-500 font-medium">Total Loans</h4>
                                 <p className="text-xl font-bold text-gray-900">{formatCurrency(540000)}</p>
                             </div>
                             <div className="bg-gray-50 p-4 rounded-lg">
                                 <h4 className="text-sm text-gray-500 font-medium">Total Expenses</h4>
                                 <p className="text-xl font-bold text-gray-900">{formatCurrency(24000)}</p>
                             </div>
                        </div>
                  </CardContent>
                  <Card>
                        <CardHeader>
                            <CardTitle className="text-xl text-gray-800">Activity Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader className="sticky top-0 bg-white">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-right">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { id: '1', action: 'Login', user: 'Admin', time: '10:30 AM' },
                                        { id: '2', action: 'Logout', user: 'Admin', time: '09:15 AM' },
                                        { id: '3', action: 'Update', user: 'Admin', time: 'Yesterday' },
                                        { id: '4', action: 'Delete', user: 'Admin', time: 'Yesterday' }
                                    ].map((log) => (
                                        <TableRow key={log.id} className="hover:bg-gray-50">
                                             <TableCell>{new Date('2024-12-31').toLocaleDateString()}</TableCell>
                                             <TableCell>
                                                  <Badge className="bg-green-100 text-green-800">
                                                        {log.action}
                                                  </Badge>
                                             </TableCell>
                                             <TableCell className="text-gray-600">{log.user}</TableCell>
                                             <TableCell className="text-right text-gray-500 text-xs">{log.time}</TableCell>
                                        </TableRow>
                                    ))
                                </TableBody>
                           </Table>
                        </CardContent>
                  </Card>
              </div>
            )}
            
      </div>
    </div>
  );
}
