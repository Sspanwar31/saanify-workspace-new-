'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ArrowLeft, ExternalLink, Mail, Phone, MoreVertical, CreditCard, ShieldCheck, 
  Users, TrendingUp, AlertTriangle, CheckCircle, Trash2, Bell, FileText, Lock, Unlock, RefreshCw, Calendar, Activity, Plus, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ClientProfile() {
  // ✅ FIX: Handle ID safely (Array check)
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  console.log("FRONTEND ID:", id);

  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false); 
  const [newPlan, setNewPlan] = useState('');  
  // Add Staff Form
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // ✅ 1. REAL DATA STATE (Updated with Net Profit & Admin Revenue)
  const [stats, setStats] = useState({
    members: 0,
    activeLoans: 0,
    netProfit: 0, // Society ka profit/loss
    adminRevenue: 0, // Admin ki kamai (Subscription)
    daysRemaining: 0, // For Subscription UI
    progress: 0, // For Subscription UI
    health: 0
  });

  // ✅ REPLACED FETCH FUNCTION
  const fetchClient = async () => {
    try {
      setLoading(true);
      
      // 1. Client Basic Info (Pehle client ka table data lo)
      const { data: clientTableData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();
        
      if (clientError || !clientTableData) {
        console.error("Client not found or error:", clientError);
        setLoading(false);
        return;
      }

      // State update karein
      setClient(clientTableData);
      setNewPlan(clientTableData.plan);

      // 🚀 2. FETCH REAL STATS FROM OUR API (The Fix)
      const res = await fetch(`/api/admin/clients/${id}/stats`);
      const statsData = await res.json();

      if (res.ok) {
        // Calculations using clientTableData (Jo humne upar fetch kiya)
        let revenueAmount = 4000;
        if (clientTableData.plan === 'PRO') revenueAmount = 7000;
        else if (clientTableData.plan === 'ENTERPRISE') revenueAmount = 10000;
        else if (clientTableData.plan === 'TRIAL') revenueAmount = 0;

        const today = new Date();
        const endDate = clientTableData.plan_end_date ? new Date(clientTableData.plan_end_date) : new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const prog = Math.min(100, Math.max(0, (days / 30) * 100));

        // Sabhi real values set karein
        setStats({
          members: statsData.memberCount || 0,
          activeLoans: statsData.loanCount || 0,
          netProfit: statsData.netProfit || 0,
          adminRevenue: revenueAmount,
          daysRemaining: days,
          progress: prog,
          health: statsData.healthScore || 0
        });

        console.log("--- DEBUG SUCCESS ---");
        console.log("Profit Match:", statsData.netProfit);
        console.log("Health Score:", statsData.healthScore);
      }

      // 3. Staff List fetch karein
      const { data: staffData } = await supabase
          .from('clients') 
          .select('*')
          .eq('client_id', id)
          .eq('role', 'treasurer')
          .eq('is_deleted', false);
      
      if (staffData) setStaffList(staffData);

    } catch (err) {
      console.error("Critical Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClient(); }, [id]);

  // 2. Handle Actions (Kept from Code - API First)

  // ✅ REPLACED: Improved handleLockToggle Logic
  const handleLockToggle = async () => {
    if (!client) return;

    const currentStatus = (client.status || 'ACTIVE').toUpperCase();
    const isLocked = currentStatus === 'LOCKED';
    const actionToSend = isLocked ? 'ACTIVATE' : 'LOCK'; 
    const newStatusLabel = isLocked ? 'ACTIVE' : 'LOCKED';

    // Toast ID taaki success hone par loading wala toast replace ho jaye
    const toastId = toast.loading(isLocked ? "Unlocking..." : "Locking...");

    try {
      const res = await fetch(`/api/admin/clients/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionToSend })
      });

      // Check karein ki response JSON hai ya nahi
      const data = await res.json().catch(() => ({ success: false, error: "Server Error" }));

      if (res.ok && data.success) {
        toast.success(`Account is now ${newStatusLabel}`, { id: toastId });
        
        // ✅ UI Refresh: Wait karein thoda taaki DB update sync ho jaye
        setTimeout(async () => {
          await fetchClient(); 
        }, 500);

      } else {
        throw new Error(data.error || "Update failed");
      }
    } catch (err: any) {
      console.error("Lock/Unlock Error:", err);
      toast.error(err.message || "Failed to update status", { id: toastId });
    }
  };

  // ✅ 2. handleExpireClient function fix
  const handleExpireClient = async () => {
    if (!confirm('Are you sure you want to expire this account?')) return;
  
    try {
      const res = await fetch(`/api/admin/clients/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXPIRE' })
      });

      if (res.ok) {
        toast.success('Account marked as EXPIRED');
        await fetchClient(); // ✅ Sync UI with DB
      }
    } catch (e) {
      toast.error('Failed to expire account');
    }
  };

  // ✅ NOTIFY CLIENT (Mock API for now)
  const handleNotifyClient = async () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
        loading: 'Sending Notification...',
        success: 'Notification Sent Successfully!',
        error: 'Failed to send'
    });
  };

  // ✅ GENERATE LEDGER (Mock)
  const handleGenerateLedger = () => {
      toast.info("Generating Ledger PDF...");
      setTimeout(() => toast.success("Ledger Downloaded"), 1500);
  };

  const handleUpdatePlan = async () => {
      const { error } = await supabase.from('clients').update({ plan: newPlan }).eq('id', id);
      if(error) toast.error("Failed to update plan");
      else {
          toast.success("Plan Updated Successfully");
          setIsRenewOpen(false);
          fetchClient();
      }
  };

  // ✅ UPDATED HANDLE DELETE (API Call)
  const handleDelete = async () => {
      if(!confirm("⚠️ WARNING: This will permanently delete client, all members, and all financial data. This cannot be undone.\n\nAre you sure?")) return;
      
      // Call the API endpoint instead of direct Supabase call
      const res = await fetch(`/api/admin/clients/${id}/delete`, {
          method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
          toast.error("Delete Failed: " + (data.error || "Unknown error"));
      } else {
          toast.success("Client Deleted Successfully"); // ✅ Change Message
          router.push('/admin/clients'); // Redirect back to list
      }
  };

  const handleDeleteStaff = async (staffId: string) => {
      if(!confirm("Are you sure you want to remove this staff member?")) return;
      
      // ✅ NEW (recommended soft delete)
      const { error } = await supabase
        .from('clients')
        .update({ is_deleted: true })
        .eq('id', staffId);
      
      if (error) {
          toast.error("Failed to delete staff: " + error.message);
      } else {
          toast.success("Staff Member Removed");
          setStaffList(prev => prev.filter(s => s.id !== staffId));
      }
  };

  // ✅ Add Staff Logic (Still Uses API because Creating User requires Admin Privileges)
  const handleAddStaff = async () => {
      if(!staffForm.name || !staffForm.email || !staffForm.password) return toast.error("Name, Email and Password required");
      
      setIsAddingStaff(true);
      try {
          const res = await fetch('/api/admin/create-staff', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  ...staffForm,
                  clientId: id // Link to this client
              })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to create staff");

          toast.success("Staff Account Created Successfully! 🎉");
          setIsStaffModalOpen(false);
          setStaffForm({ name: '', email: '', phone: '', password: '' }); 
          fetchClient(); 

      } catch (error: any) {
          toast.error(error.message);
      } finally {
          setIsAddingStaff(false);
      }
  };

  // ✅ UPDATED: handleAccess with Impersonation Logic
  const handleAccess = async () => {
    try {
      // ✅ 1. Save admin session
      const { data: sessionData } = await supabase.auth.getSession();

      localStorage.setItem(
        'admin_session',
        JSON.stringify(sessionData.session)
      );

      // ✅ 2. Set impersonation flag
      document.cookie = "impersonating=true; path=/";

      // ✅ 3. Store client info (optional but useful)
      localStorage.setItem('current_user', JSON.stringify(client));

      // ✅ 4. Open client dashboard
      window.open('/dashboard', '_blank');

    } catch (err) {
      console.error("Impersonation Error:", err);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>;
  if (!client) return <div className="p-10 text-center">Client Not Found</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4"/> Back to Clients
      </Link>
      
      {/* HEADER CARD */}
      <Card className="bg-white shadow-sm border-slate-200 overflow-visible">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="flex gap-5 items-center">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-200">
                    {client.society_name?.charAt(0) || client.name?.charAt(0)}
                </div>
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.society_name || 'Unknown Society'}</h1>
                   <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><ShieldCheck className="w-3.5 h-3.5 text-blue-500"/> {client.name}</span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Mail className="w-3.5 h-3.5 text-blue-500"/> {client.email}</span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Phone className="w-3.5 h-3.5 text-blue-500"/> {client.phone || '--'}</span>
                   </div>
                </div>
             </div>
             <div className="flex gap-3 items-center">
              {/* ✅ BADGE UI FIX: Jahan aapka Badge render ho raha hai */}
              <Badge className={
                client.status === 'ACTIVE' ? "bg-green-100 text-green-700" : 
                client.status === 'LOCKED' ? "bg-red-100 text-red-700" : 
                "bg-orange-100 text-orange-700"
              }>
                {client.status}
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200 px-3 py-1 text-xs uppercase font-bold">{client.plan} PLAN</Badge>
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              <Button onClick={handleAccess} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 font-medium">
                  <ExternalLink className="w-4 h-4 mr-2"/> Access Panel
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="rounded-full border-slate-300"><MoreVertical className="w-4 h-4 text-slate-600"/></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Smart Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem onClick={handleNotifyClient}><Bell className="mr-2 w-4 h-4 text-blue-500"/> Notify Client</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGenerateLedger}><FileText className="mr-2 w-4 h-4 text-purple-500"/> Statement & Ledger</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsRenewOpen(true)}><RefreshCw className="mr-2 w-4 h-4 text-green-500"/> Renew / Change Plan</DropdownMenuItem>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem onClick={handleLockToggle} className={client.status === 'LOCKED' ? "text-green-600" : "text-orange-600"}>
                     {client.status === 'LOCKED' ? <><Unlock className="mr-2 w-4 h-4"/> Unlock Account</> : <><Lock className="mr-2 w-4 h-4"/> Lock Account</>}
                  </DropdownMenuItem>
                  {/* ✅ Expire Action Menu Item */}
                  <DropdownMenuItem onClick={handleExpireClient} className="text-red-600">
                     <AlertTriangle className="mr-2 w-4 h-4"/> Expire Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
             </div>
        </CardContent>
      </Card>

      {/* STATS ROW - UPDATED WITH REAL FINANCIALS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Total Members</p>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">{stats.members}</h2>
            </CardContent>
         </Card>

         <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Active Loans</p>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">{stats.activeLoans}</h2>
            </CardContent>
         </Card>

         <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Society Net Profit</p>
                <h2 className={`text-3xl font-bold mt-2 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{stats.netProfit.toLocaleString()}
                </h2>
            </CardContent>
         </Card>

         <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Admin Revenue</p>
                <h2 className="text-3xl font-bold text-blue-600 mt-2">₹{stats.adminRevenue.toLocaleString()}</h2>
            </CardContent>
         </Card>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 shadow-sm border-slate-200 h-full">
            <CardHeader className="border-b border-slate-50 py-4 px-6"><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2 text-base font-bold"><Calendar className="w-4 h-4 text-slate-500"/> Subscription Status</CardTitle><Button variant="outline" size="sm" onClick={() => setIsRenewOpen(true)}>Renew Plan</Button></div></CardHeader>
            <CardContent className="p-8">
               <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                  <div><p className="text-sm text-slate-500 mb-1">Current Plan</p><h3 className="text-3xl font-bold text-blue-600 uppercase">{client.plan} <span className="text-lg text-slate-400 font-normal">/ Monthly</span></h3></div>
                  <div className="text-left md:text-right"><p className="text-xs text-slate-400 uppercase font-bold">Renewal Date</p><h4 className="text-xl font-bold text-slate-900">{client.plan_end_date ? new Date(client.plan_end_date).toLocaleDateString() : 'N/A'}</h4></div>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-2 text-slate-500 font-medium"><span>Plan Usage</span><span>{stats.daysRemaining} Days Remaining</span></div>
                  <Progress value={stats.progress} className="h-3 bg-slate-100" />
               </div>
            </CardContent>
         </Card>
         <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="border-b border-slate-50 py-4 px-6"><CardTitle className="flex items-center gap-2 text-base font-bold"><Activity className="w-4 h-4 text-slate-500"/> Account Health</CardTitle></CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center">
               <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full border-[6px] border-slate-50 flex items-center justify-center">
                    {/* ✅ UPDATED UI COLOR LOGIC */}
                    <span className={`text-4xl font-bold ${stats.health > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                       {stats.health}
                       <span className="text-xl text-slate-400 font-normal">/100</span>
                    </span>
                  </div>
                  <div className="absolute top-0 right-0 bg-green-500 text-white p-1.5 rounded-full shadow-lg border-4 border-white"><CheckCircle className="w-5 h-5"/></div>
               </div>
               <p className="text-sm text-slate-500 font-medium">Society Activity Score</p>
            </CardContent>
         </Card>
      </div>

      {/* ASSOCIATED STAFF */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Users className="w-4 h-4 text-slate-500"/> Associated Staff (Treasurers)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIsStaffModalOpen(true)}><Plus className="w-4 h-4 mr-2"/> Add Staff</Button>
        </CardHeader>
        <CardContent className="p-0">
            {staffList.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No staff members found for this client.</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {staffList.map((staff) => (
                        <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                                    {staff.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-slate-900">{staff.name}</p>
                                    <p className="text-xs text-slate-500">{staff.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline">{staff.role}</Badge>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                                    onClick={() => handleDeleteStaff(staff.id)}
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>

      {/* DANGER ZONE */}
      <div className="border border-red-200 bg-red-50/50 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-red-50 transition-colors">
         <div><h3 className="text-red-700 font-bold flex items-center gap-2 text-lg"><AlertTriangle className="w-5 h-5"/> Danger Zone</h3><p className="text-sm text-red-600/80 mt-1">Irreversible actions. Deleting this client will remove all associated data including invoices and members.</p></div>
         <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm shadow-red-200 font-bold px-6"><Trash2 className="w-4 h-4 mr-2"/> Delete Account</Button>
      </div>

      {/* RENEW PLAN DIALOG */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Renew / Change Plan</DialogTitle><DialogDescription>Update subscription tier for this client.</DialogDescription></DialogHeader>
            <div className="py-4">
                <Select value={newPlan} onValueChange={setNewPlan}>
                    <SelectTrigger><SelectValue placeholder="Select Plan"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TRIAL">Free Trial</SelectItem>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter><Button onClick={handleUpdatePlan} className="w-full bg-blue-600">Update Plan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD STAFF DIALOG (UPDATED) */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Add New Staff</DialogTitle><DialogDescription>Create a new treasurer account.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2"><Input placeholder="Staff Name" value={staffForm.name} onChange={e=>setStaffForm({...staffForm, name:e.target.value})}/></div>
                <div className="space-y-2"><Input placeholder="Email Address" type="email" value={staffForm.email} onChange={e=>setStaffForm({...staffForm, email:e.target.value})}/></div>
                {/* NEW PASSWORD FIELD */}
                <div className="space-y-2"><Input placeholder="Set Password" type="password" value={staffForm.password} onChange={e=>setStaffForm({...staffForm, password:e.target.value})}/></div>
                <div className="space-y-2"><Input placeholder="Phone Number (Optional)" value={staffForm.phone} onChange={e=>setStaffForm({...staffForm, phone:e.target.value})}/></div>
            </div>
            <DialogFooter>
                <Button onClick={handleAddStaff} disabled={isAddingStaff} className="w-full bg-green-600">
                    {isAddingStaff ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Create Staff Account'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
