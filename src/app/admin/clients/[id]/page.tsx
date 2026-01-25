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
  Users, TrendingUp, AlertTriangle, CheckCircle, Trash2, Bell, FileText, Lock, Unlock, RefreshCw, Calendar, Activity, Plus
} from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ClientProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]); // New State for Staff
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false); // New Staff Modal
  const [newPlan, setNewPlan] = useState('');
  
  // Add Staff Form
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '' });

  // 1. Fetch Client & Staff
  const fetchClient = async () => {
    // A. Client Data
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (data) {
        setClient(data);
        setNewPlan(data.plan);
    }

    // B. Staff Data (Fetch users linked to this client with role treasurer)
    const { data: staffData } = await supabase
        .from('clients') // Using same table as per your structure
        .select('*')
        .eq('client_id', id)
        .eq('role', 'treasurer');
    
    if (staffData) setStaffList(staffData);

    setLoading(false);
  };

  useEffect(() => { fetchClient(); }, [id]);

  // 2. Handle Actions
  const handleLockToggle = async () => {
      const newStatus = client.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
      const { error } = await supabase.from('clients').update({ status: newStatus }).eq('id', id);
      if(error) toast.error("Update Failed");
      else {
          toast.success(`Account ${newStatus === 'LOCKED' ? 'Locked' : 'Unlocked'}`);
          fetchClient();
      }
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

  const handleDelete = async () => {
      if(!confirm("IRREVERSIBLE ACTION: Delete this client and ALL associated data?")) return;
      await supabase.from('clients').delete().eq('id', id);
      toast.success("Client Deleted");
      router.push('/admin/clients');
  };

  const handleAddStaff = async () => {
      if(!staffForm.name || !staffForm.email) return toast.error("Name and Email required");
      
      // Note: Real implementation needs auth signup API. This just adds DB entry for demo.
      // Assuming you have an API route or trigger for this.
      
      // Temporary: Just show toast as we don't have direct auth create access here
      toast.info("To add staff, use the Signup page or API. (This is a view-only demo)");
      setIsStaffModalOpen(false);
  };

  const handleAccess = () => {
      localStorage.setItem('current_user', JSON.stringify(client));
      window.open('/dashboard', '_blank');
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
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
              <Badge className={client.status === 'ACTIVE' ? "bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1" : "bg-red-100 text-red-700 px-3 py-1"}>{client.status}</Badge>
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
                  <DropdownMenuItem onClick={() => toast.info("Notification Sent!")}><Bell className="mr-2 w-4 h-4 text-blue-500"/> Notify Client</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Generating Ledger...")}><FileText className="mr-2 w-4 h-4 text-purple-500"/> Statement & Ledger</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsRenewOpen(true)}><RefreshCw className="mr-2 w-4 h-4 text-green-500"/> Renew / Change Plan</DropdownMenuItem>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem onClick={handleLockToggle} className={client.status === 'LOCKED' ? "text-green-600" : "text-orange-600"}>
                     {client.status === 'LOCKED' ? <><Unlock className="mr-2 w-4 h-4"/> Unlock Account</> : <><Lock className="mr-2 w-4 h-4"/> Lock Account</>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </CardContent>
      </Card>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="border-l-4 border-l-blue-500 shadow-sm"><CardContent className="p-6"><div><p className="text-[11px] font-bold text-slate-400 uppercase">Total Members</p><h2 className="text-3xl font-bold text-slate-900 mt-2">245</h2></div></CardContent></Card>
         <Card className="border-l-4 border-l-purple-500 shadow-sm"><CardContent className="p-6"><div><p className="text-[11px] font-bold text-slate-400 uppercase">Active Loans</p><h2 className="text-3xl font-bold text-slate-900 mt-2">89000</h2></div></CardContent></Card>
         <Card className="border-l-4 border-l-green-500 shadow-sm"><CardContent className="p-6"><div><p className="text-[11px] font-bold text-slate-400 uppercase">Revenue</p><h2 className="text-3xl font-bold text-slate-900 mt-2">₹125,000</h2></div></CardContent></Card>
         <Card className="border-l-4 border-l-orange-500 shadow-sm"><CardContent className="p-6"><div><p className="text-[11px] font-bold text-slate-400 uppercase">Risk Level</p><h2 className="text-3xl font-bold text-green-600 mt-2">Low</h2></div></CardContent></Card>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 shadow-sm border-slate-200 h-full">
            <CardHeader className="border-b border-slate-50 py-4 px-6"><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2 text-base font-bold"><Calendar className="w-4 h-4 text-slate-500"/> Subscription Status</CardTitle><Button variant="outline" size="sm" onClick={() => setIsRenewOpen(true)}>Renew Plan</Button></div></CardHeader>
            <CardContent className="p-8">
               <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                  <div><p className="text-sm text-slate-500 mb-1">Current Plan</p><h3 className="text-3xl font-bold text-blue-600 uppercase">{client.plan} <span className="text-lg text-slate-400 font-normal">/ Monthly</span></h3></div>
                  <div className="text-left md:text-right"><p className="text-xs text-slate-400 uppercase font-bold">Renewal Date</p><h4 className="text-xl font-bold text-slate-900">12/31/2025</h4></div>
               </div>
               <div><div className="flex justify-between text-xs mb-2 text-slate-500 font-medium"><span>Plan Usage</span><span>12 Days Remaining</span></div><Progress value={65} className="h-3 bg-slate-100" /><p className="text-xs text-right text-slate-400 mt-2">Auto-renewal enabled</p></div>
            </CardContent>
         </Card>
         <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="border-b border-slate-50 py-4 px-6"><CardTitle className="flex items-center gap-2 text-base font-bold"><Activity className="w-4 h-4 text-slate-500"/> Account Health</CardTitle></CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center">
               <div className="relative mb-4"><div className="w-32 h-32 rounded-full border-[6px] border-slate-50 flex items-center justify-center"><span className="text-4xl font-bold text-green-600">92<span className="text-xl text-slate-400 font-normal">/100</span></span></div><div className="absolute top-0 right-0 bg-green-500 text-white p-1.5 rounded-full shadow-lg border-4 border-white"><CheckCircle className="w-5 h-5"/></div></div>
               <p className="text-sm text-slate-500 font-medium">Overall Score</p>
               <div className="w-full mt-8 pt-6 border-t border-slate-50"><div className="flex justify-between items-center"><div><p className="text-xs text-slate-400 mb-1">This Month Revenue</p><p className="text-xl font-bold text-slate-900">₹125,000</p></div><div className="text-right"><TrendingUp className="w-6 h-6 text-green-500 ml-auto"/><p className="text-[10px] text-green-600 mt-1 font-bold">+12% growth</p></div></div></div>
            </CardContent>
         </Card>
      </div>

      {/* ✅ NEW SECTION: ASSOCIATED STAFF */}
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></Button>
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
                    <SelectContent><SelectItem value="TRIAL">Free Trial</SelectItem><SelectItem value="BASIC">Basic</SelectItem><SelectItem value="PRO">Pro</SelectItem><SelectItem value="ENTERPRISE">Enterprise</SelectItem></SelectContent>
                </Select>
            </div>
            <DialogFooter><Button onClick={handleUpdatePlan} className="w-full bg-blue-600">Update Plan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD STAFF DIALOG */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Add New Staff</DialogTitle><DialogDescription>Create a new treasurer account under this client.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2"><Input placeholder="Staff Name" value={staffForm.name} onChange={e=>setStaffForm({...staffForm, name:e.target.value})}/></div>
                <div className="space-y-2"><Input placeholder="Email Address" type="email" value={staffForm.email} onChange={e=>setStaffForm({...staffForm, email:e.target.value})}/></div>
                <div className="space-y-2"><Input placeholder="Phone Number (Optional)" value={staffForm.phone} onChange={e=>setStaffForm({...staffForm, phone:e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={handleAddStaff} className="w-full bg-green-600">Create Staff Account</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
