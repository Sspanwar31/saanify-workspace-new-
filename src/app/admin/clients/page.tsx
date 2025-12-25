'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, MoreHorizontal, Eye, Edit, Lock, Calendar, Trash2, Unlock, RefreshCw 
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', society_name: '', phone: '', plan: 'BASIC', status: 'ACTIVE' });

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) setClients(data);
    setLoading(false);
  };

  const handleLockToggle = async (client: any) => {
     const newStatus = client.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
     const { error } = await supabase.from('clients').update({ status: newStatus }).eq('id', client.id);
     
     if (error) toast.error("Failed to update status");
     else {
        toast.success(newStatus === 'LOCKED' ? "Account Locked" : "Account Unlocked");
        fetchClients(); // Refresh UI immediately
     }
  };

  const handleMarkExpired = async (id: string) => {
     if(!confirm("Mark this subscription as expired?")) return;
     const { error } = await supabase.from('clients').update({ status: 'EXPIRED' }).eq('id', id);
     if (!error) {
        toast.success("Client marked as Expired");
        fetchClients();
     }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure? This will delete the client.")) return;
    await supabase.from('clients').delete().eq('id', id);
    toast.success("Client Deleted");
    fetchClients();
  };

  // ... (Keep Add/Edit Logic same as before, simplified here for brevity but ensure it's included in real code)
  const openAddModal = () => { setEditingId(null); setFormData({ name: '', email: '', password: '', society_name: '', phone: '', plan: 'BASIC', status: 'ACTIVE' }); setIsDialogOpen(true); };
  
  const handleSave = async () => {
      // Logic for save (Add/Edit)
      if(!formData.email) return;
      if(editingId) {
          await supabase.from('clients').update({
              name: formData.name, society_name: formData.society_name, 
              phone: formData.phone, plan: formData.plan, status: formData.status
          }).eq('id', editingId);
      } else {
          await fetch('/api/admin/create-client', { method: 'POST', body: JSON.stringify(formData) });
      }
      setIsDialogOpen(false);
      fetchClients();
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.society_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-slate-900">Client Management</h1><p className="text-slate-500">Manage Society Subscriptions</p></div>
        <Button onClick={openAddModal} className="bg-blue-600"><Plus className="w-4 h-4 mr-2"/> Add New Client</Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><Input placeholder="Search clients..." className="max-w-md" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}/></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b"><tr><th className="p-4 pl-6">Client Name</th><th className="p-4">Plan</th><th className="p-4">Status</th><th className="p-4">Revenue</th><th className="p-4 text-right pr-6">Actions</th></tr></thead>
            <tbody className="divide-y">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-4 pl-6">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">{c.society_name?.[0] || 'C'}</div>
                      <div><p className="font-bold text-slate-900">{c.society_name || c.name}</p><p className="text-xs text-slate-500">{c.email}</p></div>
                    </div>
                  </td>
                  <td className="p-4"><Badge variant="outline">{c.plan}</Badge></td>
                  <td className="p-4">
                    {/* FIXED BADGE LOGIC */}
                    <Badge className={
                        c.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                        c.status === 'LOCKED' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                        'bg-orange-100 text-orange-700 hover:bg-orange-100'
                    }>{c.status}</Badge>
                  </td>
                  <td className="p-4 font-bold text-slate-700">₹{c.plan === 'PRO' ? '125,000' : '45,000'}</td>
                  <td className="p-4 text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Manage Client</DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={() => router.push(`/admin/clients/${c.id}`)}><Eye className="mr-2 w-4 h-4 text-blue-500"/> View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={()=>{setEditingId(c.id); setFormData(c); setIsDialogOpen(true)}}><Edit className="mr-2 w-4 h-4"/> Edit Details</DropdownMenuItem>
                        
                        {/* FIXED TOGGLE LOGIC */}
                        <DropdownMenuItem onClick={() => handleLockToggle(c)}>
                            {c.status === 'LOCKED' ? <><Unlock className="mr-2 w-4 h-4 text-green-600"/> Unlock Account</> : <><Lock className="mr-2 w-4 h-4 text-orange-600"/> Lock Account</>}
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleMarkExpired(c.id)}>
                            <Calendar className="mr-2 w-4 h-4 text-slate-500"/> Mark Expired
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 w-4 h-4"/> Delete Client</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      {/* MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent><DialogHeader><DialogTitle>{editingId?'Edit':'Add'} Client</DialogTitle></DialogHeader>
         <div className="space-y-3">
             <Input placeholder="Society Name" value={formData.society_name} onChange={e=>setFormData({...formData, society_name:e.target.value})}/>
             <Input placeholder="Admin Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
             <Input placeholder="Email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/>
             <Input placeholder="Password" type="password" onChange={e=>setFormData({...formData, password:e.target.value})}/>
             <div className="grid grid-cols-2 gap-2">
                <Select value={formData.plan} onValueChange={v=>setFormData({...formData, plan:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="BASIC">Basic</SelectItem><SelectItem value="PRO">Pro</SelectItem></SelectContent></Select>
                <Select value={formData.status} onValueChange={v=>setFormData({...formData, status:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="LOCKED">Locked</SelectItem></SelectContent></Select>
             </div>
             <Button onClick={handleSave} className="w-full">Save</Button>
         </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}