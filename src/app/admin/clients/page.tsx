'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, MoreHorizontal, Eye, Edit, Lock, Calendar, Trash2, Unlock, AlertTriangle, RefreshCw, Users 
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function ClientManagement() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [treasurers, setTreasurers] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false); 
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]); 
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', society_name: '', phone: '', plan: 'BASIC', status: 'ACTIVE' });

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('role', 'client')
      .eq('is_deleted', false) // ✅ ADD THIS
      .order('created_at', { ascending: false });

    const { data: staffData } = await supabase
      .from('clients')
      .select('*')
      .eq('role', 'treasurer')
      .eq('is_deleted', false); // ✅ ADD THIS

    if (clientData) setClients(clientData);
    if (staffData) setTreasurers(staffData);
    setLoading(false);
  };

  const handleViewStaff = (clientId: string) => {
      const staff = treasurers.filter(t => t.client_id === clientId);
      setSelectedStaff(staff);
      setIsStaffModalOpen(true);
  };

  // ACTIONS
  
  // ✅ ACTION 1: LOCK / UNLOCK (Full Fix)
  const handleLockToggle = async (client: any) => {
     // Case handle karne ke liye uppercase karein
     const currentStatus = (client.status || 'ACTIVE').toUpperCase();
     const newStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
     
     toast.loading(newStatus === 'LOCKED' ? "Locking Account..." : "Unlocking Account...", { id: 'status-update' });

     //1. Database Update
     const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', client.id);
     
     if (error) {
        return toast.error("Failed: " + error.message, { id: 'status-update' });
     }

     //2. Force Logout API call (For Security)
     if (newStatus === 'LOCKED') {
        await fetch(`/api/admin/clients/${client.id}/status`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'LOCK' })
        }).catch(() => null);
     }

     toast.success(newStatus === 'LOCKED' ? "Account Locked" : "Account Unlocked", { id: 'status-update' });
     
     //3. ✅ Refresh from DB (Isse status change hamesha ke liye save hoga)
     fetchClients();
  };

  // ✅ ACTION 2: EXPIRE ACCOUNT (Fix)
  const handleMarkExpired = async (id: string) => {
     if(!confirm("Mark this subscription as expired? Client will be unable to login.")) return;
     
     toast.loading("Marking as Expired...", { id: 'expire-update' });

     const { error } = await supabase
        .from('clients')
        .update({ 
          status: 'EXPIRED'
        })
        .eq('id', id);

     if (error) return toast.error("Failed to expire", { id: 'expire-update' });
     
     toast.success("Client status set to EXPIRED", { id: 'expire-update' });
     fetchClients(); // Sync UI
  };

  // ✅ ACTION 3: DELETE CLIENT
  const handleDelete = async (id: string) => {
    if(!confirm("⚠️ DANGER: This will delete client and ALL their data! Continue?")) return;
    
    toast.loading("Deleting Client...", { id: 'delete-client' });
    
    // Try API for auth deletion + DB Cascade
    const res = await fetch(`/api/admin/clients/${id}/delete`, { method: 'DELETE' });
    
    if (res.ok) {
        toast.success("Client & Auth Deleted", { id: 'delete-client' });
        fetchClients();
    } else {
        // Fallback: Direct DB Update (is_deleted flag)
        const { error } = await supabase.from('clients').update({ is_deleted: true, status: 'DELETED' }).eq('id', id);
        if(!error) {
            toast.success("Client marked as Deleted", { id: 'delete-client' });
            fetchClients();
        } else {
            toast.error("Delete Failed", { id: 'delete-client' });
        }
    }
  };

  // UI rendering mein badges check karein (Standard Case)
  const getBadgeStyle = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return "bg-green-100 text-green-700 border-green-200";
    if (s === 'LOCKED') return "bg-red-100 text-red-700 border-red-200";
    if (s === 'EXPIRED') return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-slate-100 text-slate-700";
  };

  // ... (Baaki code wahi rahega) ... 

  const openAddModal = () => { 
      setEditingId(null); 
      setFormData({ name: '', email: '', password: '', society_name: '', phone: '', plan: 'BASIC', status: 'ACTIVE' }); 
      setIsDialogOpen(true); 
  };
  
  const openEditModal = (client: any) => {
    setEditingId(client.id);
    setFormData({ 
        name: client.name, email: client.email, password: '', 
        society_name: client.society_name, phone: client.phone, 
        plan: client.plan, status: client.status
    });
    setIsDialogOpen(true);
  };

  // SAVE LOGIC
  const handleSave = async () => {
    if(!formData.email || !formData.name) return toast.error("Required fields missing");
    setIsSaving(true);

    try {
        if (editingId) {
            const updates: any = { 
                name: formData.name,
                society_name: formData.society_name,
                phone: formData.phone,
                plan: formData.plan
            };
            const { error } = await supabase.from('clients').update(updates).eq('id', editingId);
            if(error) throw error;
            toast.success("Details Updated");
        } else {
            const res = await fetch('/api/admin/create-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password || '123456',
                    society_name: formData.society_name,
                    phone: formData.phone,
                    plan: formData.plan 
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create client");
            
            toast.success("Client Created Successfully! 🎉");
        }
        
        setIsDialogOpen(false);
        fetchClients();
    } catch(e: any) {
        toast.error(e.message);
    } finally {
        setIsSaving(false);
    }
  };

  // ✅ Better: Extra safety filter
  const filteredClients = clients
    .filter(c => !c.is_deleted) // ✅ safety layer
    .filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.society_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900">Client Management</h1><p className="text-slate-500">Manage Society Subscriptions</p></div>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"><Plus className="w-4 h-4 mr-2"/> Add New Client</Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
            <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Search clients..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr><th className="p-4 pl-6">Client Name</th><th className="p-4">Plan</th><th className="p-4">Staff</th><th className="p-4">Status</th><th className="p-4">Revenue</th><th className="p-4 text-right pr-6">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((c) => {
                    const staffCount = treasurers.filter(t => t.client_id === c.id).length;
                    
                    // ✅ FIXED REVENUE LOGIC
                    let revenue = '4,000';
                    if (c.plan === 'PRO') revenue = '7,000';
                    else if (c.plan === 'ENTERPRISE') revenue = '10,000';
                    else if (c.plan === 'TRIAL' || c.plan === 'FREE_TRIAL') revenue = '0';

                    return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">{c.society_name?.charAt(0) || "C"}</div>
                             <div><div className="font-bold text-slate-900">{c.society_name || c.name}</div><div className="text-xs text-slate-500">{c.email}</div></div>
                          </div>
                      </td>
                      <td className="p-4"><Badge variant="outline" className="border-slate-300 text-slate-700 font-mono">{c.plan}</Badge></td>
                      <td className="p-4">
                          <Badge variant="secondary" className="cursor-pointer hover:bg-slate-200" onClick={() => handleViewStaff(c.id)}>
                             <Users className="w-3 h-3 mr-1"/> {staffCount} Staff
                          </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getBadgeStyle(c.status)}>{c.status}</Badge>
                      </td>
                      <td className="p-4 font-bold text-slate-700">₹{revenue}</td>
                      <td className="p-4 text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Manage Client</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/admin/clients/${c.id}`)}><Eye className="mr-2 h-4 w-4 text-blue-500"/> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(c)}><Edit className="mr-2 h-4 w-4 text-slate-500"/> Edit Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleLockToggle(c)}>{c.status === 'LOCKED' ? <><Unlock className="mr-2 h-4 w-4 text-green-600"/> Unlock Account</> : <><Lock className="mr-2 h-4 w-4 text-orange-600"/> Lock Account</>}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkExpired(c.id)}><Calendar className="mr-2 h-4 w-4 text-slate-500"/> Mark Expired</DropdownMenuItem>
                            <DropdownMenuSeparator/><DropdownMenuItem className="text-red-600" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete Client</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
        </CardContent>
      </Card>
      
      {/* EDIT MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{editingId?'Edit Details':'Add New Client'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Input placeholder="Admin Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                  <div className="space-y-2"><Input placeholder="Society Name" value={formData.society_name} onChange={e=>setFormData({...formData, society_name:e.target.value})}/></div>
               </div>
               <div className="space-y-2"><Input placeholder="Email Address" type="email" disabled={!!editingId} value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/></div>
               <div className="space-y-2"><Input placeholder={editingId ? "New Password (Leave empty to keep same)" : "Password"} type="password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}/></div>
               <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Phone Number" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/>
                  <Select value={formData.plan} onValueChange={v=>setFormData({...formData, plan:v})}>
                     <SelectTrigger><SelectValue placeholder="Plan"/></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="TRIAL">Free Trial (15 Days)</SelectItem>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <DialogFooter><Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">{isSaving ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : (editingId ? 'Update Client' : 'Create Account')}</Button></DialogFooter>
         </DialogContent>
      </Dialog>

      {/* STAFF LIST MODAL */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>Associated Staff</DialogTitle></DialogHeader>
            <div className="space-y-3">
                {selectedStaff.length === 0 ? <p className="text-sm text-slate-500">No staff found for this client.</p> : selectedStaff.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                        <div><div className="font-semibold text-sm">{s.name}</div><div className="text-xs text-slate-500">{s.email}</div></div>
                        <Badge variant="outline">{s.role}</Badge>
                    </div>
                ))}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
