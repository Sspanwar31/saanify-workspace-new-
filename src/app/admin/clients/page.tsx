'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, MoreHorizontal, Eye, Edit, Lock, Calendar, Trash2, Unlock, AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function ClientManagement() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', society_name: '', phone: '', plan: 'BASIC', status: 'ACTIVE' });

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) setClients(data);
    setLoading(false);
  };

  // ACTIONS
  const handleLockToggle = async (client: any) => {
     const newStatus = client.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
     const { error } = await supabase.from('clients').update({ status: newStatus }).eq('id', client.id);
     if (error) toast.error("Update failed");
     else {
        toast.success(`Account ${newStatus === 'LOCKED' ? 'Locked' : 'Unlocked'}`);
        fetchClients();
     }
  };

  const handleMarkExpired = async (id: string) => {
     if(!confirm("Mark this subscription as expired?")) return;
     const yesterday = new Date();
     yesterday.setDate(yesterday.getDate() - 1);
     
     const { error } = await supabase.from('clients').update({ 
        status: 'EXPIRED',
        subscription_expiry: yesterday.toISOString() 
     }).eq('id', id);

     if (error) toast.error("Update failed");
     else {
        toast.success("Client marked as Expired");
        fetchClients();
     }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure? This will delete client.")) return;
    await supabase.from('clients').delete().eq('id', id);
    toast.success("Client Deleted");
    fetchClients();
  };

  const handleSave = async () => {
    if(!formData.email || (!editingId && !formData.password) || !formData.name) {
      toast.error("Please fill required fields");
      return;
    }
    
    setIsSaving(true);
    const toastId = toast.loading(editingId ? "Updating Client..." : "Creating Client...");
    
    try {
      if (editingId) {
        // Update existing client
        const { error } = await supabase.from('clients').update({
          name: formData.name,
          society_name: formData.society_name,
          phone: formData.phone,
          plan: formData.plan,
          status: formData.status,
          ...(formData.password ? { password: formData.password } : {})
        }).eq('id', editingId);
        
        if (error) throw new Error(error.message);
        toast.success("Client Updated Successfully!", { id: toastId });
      } else {
        // Create new client
        const res = await fetch('/api/admin/create-client', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        toast.success("Client Created Successfully!", { id: toastId });
      }
      
      setIsDialogOpen(false);
      fetchClients();
      setFormData({ name: '', email: '', password: '', society_name: '', phone: '', plan: 'BASIC', status: 'ACTIVE' });
      setEditingId(null);
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', society_name: '', phone: '', plan: 'BASIC', status: 'ACTIVE' });
    setIsDialogOpen(true);
  };

  const openEditModal = (client: any) => {
    setEditingId(client.id);
    setFormData({ 
      name: client.name, 
      email: client.email, 
      password: '', 
      society_name: client.society_name, 
      phone: client.phone, 
      plan: client.plan, 
      status: client.status 
    });
    setIsDialogOpen(true);
  };
  
  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.society_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900">Client Management</h1><p className="text-slate-500">Manage Society Subscriptions & Access</p></div>
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
                  <tr><th className="p-4 pl-6">Client Name</th><th className="p-4">Plan</th><th className="p-4">Status</th><th className="p-4">Members</th><th className="p-4">Revenue</th><th className="p-4 text-right pr-6">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">{client.society_name?.charAt(0) || "C"}</div>
                             <div><div className="font-bold text-slate-900">{client.society_name || 'Unknown'}</div><div className="text-xs text-slate-500">{client.email}</div></div>
                          </div>
                      </td>
                      <td className="p-4"><Badge variant="outline" className="border-slate-300 text-slate-700 font-mono">{client.plan}</Badge></td>
                      <td className="p-4">
                        <Badge className={
                            client.status === 'ACTIVE' ? "bg-green-100 text-green-700" : 
                            client.status === 'LOCKED' ? "bg-red-100 text-red-700" : 
                            "bg-yellow-100 text-yellow-700"
                        }>{client.status}</Badge>
                      </td>
                      <td className="p-4 text-slate-500">{client.plan === 'PRO' ? 245 : 89}</td>
                      <td className="p-4 font-bold text-slate-700">₹{client.plan === 'PRO' ? '125,000' : '45,000'}</td>
                      <td className="p-4 text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Manage Client</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/admin/clients/${client.id}`)}><Eye className="mr-2 h-4 w-4 text-blue-500"/> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(client)}><Edit className="mr-2 h-4 w-4 text-slate-500"/> Edit Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleLockToggle(client)}>
                                {client.status === 'LOCKED' ? <><Unlock className="mr-2 h-4 w-4 text-green-500"/> Unlock Account</> : <><Lock className="mr-2 h-4 w-4 text-orange-500"/> Lock Account</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkExpired(client.id)}>
                                <Calendar className="mr-2 h-4 w-4 text-slate-500"/> Mark Expired
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(client.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete Client</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </CardContent>
      </Card>
      
      {/* ADD/EDIT CLIENT MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
               <DialogTitle>{editingId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
               <DialogDescription>{editingId ? 'Update client information.' : 'Create a new society account manually.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Input placeholder="Admin Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                  <div className="space-y-2"><Input placeholder="Society Name" value={formData.society_name} onChange={e=>setFormData({...formData, society_name:e.target.value})}/></div>
               </div>
               <div className="space-y-2"><Input placeholder="Email Address" type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/></div>
               <div className="space-y-2"><Input placeholder="Password" type="password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}/></div>
               <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Phone Number" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/>
                  <Select onValueChange={v=>setFormData({...formData, plan:v})} value={formData.plan}>
                     <SelectTrigger><SelectValue placeholder="Plan"/></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="BASIC">Basic Plan</SelectItem>
                        <SelectItem value="PRO">Pro Plan</SelectItem>
                        <SelectItem value="TRIAL">Trial (15 Days)</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <DialogFooter>
               <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                  {isSaving ? 'Saving...' : (editingId ? 'Update Client' : 'Create Account')}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}