'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, RefreshCcw, MoreHorizontal, Edit, Trash2, 
  Users, UserCheck, UserX, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('');  
  
  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', father_name: '', phone: '', email: '', address: '', join_date: new Date().toISOString().split('T')[0], status: 'active'
  });

  const fetchMembers = async (id: string) => {
     try {
       const res = await fetch(`/api/client/members?client_id=${id}`);
       if (res.ok) {
         const data = await res.json();
         setMembers(data);
       }
     } catch (e) { console.error(e); } 
     finally { setLoading(false); }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('current_user');
    if (!userStr) return;

    const user = JSON.parse(userStr);

    // ✅ UNIVERSAL CLIENT ID RESOLVER
    const resolvedClientId = user.client_id ?? user.id;

    if (!resolvedClientId) {
        console.error('CLIENT ID NOT FOUND', user);
        return;
    }

    setClientId(resolvedClientId);
    fetchMembers(resolvedClientId);
  }, []);

  // ACTIONS
  const handleSave = async () => {
     if(!formData.name || !formData.phone) return toast.error("Name and Phone required");
     setIsSaving(true);
     
     try {
         if(editingId) {
            // UPDATE via API
            const res = await fetch('/api/client/members', {
                method: 'PUT',
                body: JSON.stringify({ id: editingId, ...formData })
            });
            if(!res.ok) throw new Error("Update Failed");
            toast.success("Member Updated");
         } else {
            // CREATE via API (Separate route for creation as it handles Auth)
            const res = await fetch('/api/client/add-member', {
                method: 'POST',
                body: JSON.stringify({ ...formData, client_id: clientId })
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.error);
            toast.success("Member Added");
         }

         setIsDialogOpen(false);
         fetchMembers(clientId);
         setFormData({ name: '', father_name: '', phone: '', email: '', address: '', join_date: new Date().toISOString().split('T')[0], status: 'active' });

     } catch(e: any) {
         toast.error(e.message);
     } finally {
         setIsSaving(false);
     }
  };

  const handleDelete = async (id: string) => {
     if(!confirm("Delete member? This cannot be undone.")) return;
     
     const loadingToast = toast.loading("Deleting...");
     try {
         const res = await fetch(`/api/client/members?id=${id}`, { method: 'DELETE' });
         if(!res.ok) throw new Error("Delete Failed");
         
         toast.success("Member Deleted", { id: loadingToast });
         fetchMembers(clientId);
     } catch(e) {
         toast.error("Failed to delete", { id: loadingToast });
     }
  };

  const openEdit = (m: any) => {
     setEditingId(m.id);
     setFormData({ 
        name: m.name, father_name: m.father_name, phone: m.phone, 
        email: m.email, address: m.address, join_date: m.join_date, status: m.status 
     });
     setIsDialogOpen(true);
  };

  const activeCount = members.filter(m => m.status === 'active').length;

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600 dark:text-blue-400"/></div>;

  return (
    <div className="p-8 space-y-6">
       {/* STATS */}
       <div className="grid gap-4 md:grid-cols-4">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 dark:text-gray-400">Total Members</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{members.length}</div></CardContent>
          </Card>
          <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 dark:text-gray-400">Active</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</div></CardContent>
          </Card>
          <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 dark:text-gray-400">Inactive</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-600 dark:text-red-400">{members.length - activeCount}</div></CardContent>
          </Card>
       </div>

       {/* HEADER */}
       <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Members Ledger</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage society members</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => fetchMembers(clientId)} className="dark:bg-slate-800 dark:text-white dark:border-slate-700">
                <RefreshCcw className="w-4 h-4 mr-2"/> Refresh
             </Button>
             
             {/* ✅ FIXED (IMPORTANT): Button onClick logic updated */}
             <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '',
                  father_name: '',
                  phone: '',
                  email: '',
                  address: '',
                  join_date: new Date().toISOString().split('T')[0],
                  status: 'active'
                });
                setIsDialogOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2"/> Add New Member
            </Button>
          </div>
       </div>

       {/* TABLE */}
       <Card className="dark:bg-slate-900 dark:border-slate-800">
         <CardContent className="p-0">
           <div className="rounded-md border dark:border-slate-700">
            <Table>
                 <TableHeader className="bg-slate-50 dark:bg-slate-800">
                      <TableRow className="dark:border-slate-700">
                          <TableHead className="dark:text-gray-300">Name</TableHead>
                          <TableHead className="dark:text-gray-300">Father Name</TableHead>
                          <TableHead className="dark:text-gray-300">Phone</TableHead>
                          <TableHead className="dark:text-gray-300">Join Date</TableHead>
                          <TableHead className="dark:text-gray-300">Status</TableHead>
                          <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {members.map(m => (
                          <TableRow key={m.id} className="dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                              <TableCell className="font-medium dark:text-white">{m.name}</TableCell>
                              <TableCell className="dark:text-gray-300">{m.father_name}</TableCell>
                              <TableCell className="dark:text-gray-300">{m.phone}</TableCell>
                              <TableCell className="dark:text-gray-300">{m.join_date}</TableCell>
                              <TableCell><Badge variant={m.status === 'active' ? 'default' : 'destructive'}>{m.status}</Badge></TableCell>
                              <TableCell className="text-right">
                                  <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost" className="dark:text-gray-300 dark:hover:bg-slate-700">
                                                <MoreHorizontal className="w-4 h-4"/>
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700">
                                              <DropdownMenuItem onClick={() => openEdit(m)} className="dark:text-white dark:focus:bg-slate-700">
                                                <Edit className="w-4 h-4 mr-2"/> Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:focus:bg-slate-700" onClick={() => handleDelete(m.id)}>
                                                <Trash2 className="w-4 h-4 mr-2"/> Delete
                                              </DropdownMenuItem>
                                          </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      ))}
                      {members.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center p-8 text-slate-500 dark:text-gray-400">
                                No members found
                            </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
            </Table>
           </div>
         </CardContent>
       </Card>

       {/* DIALOG */}
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
             <DialogHeader><DialogTitle className="dark:text-white">{editingId ? 'Edit' : 'Add'} Member</DialogTitle></DialogHeader>
             <div className="space-y-3 py-2">
                <Input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                <Input placeholder="Father Name" value={formData.father_name} onChange={e => setFormData({...formData, father_name: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                <Input placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                <Input placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                <Input placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                <Input type="date" value={formData.join_date} onChange={e => setFormData({...formData, join_date: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                   <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"><SelectValue/></SelectTrigger>
                   <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                       <SelectItem value="active" className="dark:text-white dark:focus:bg-slate-700">Active</SelectItem>
                       <SelectItem value="inactive" className="dark:text-white dark:focus:bg-slate-700">Inactive</SelectItem>
                   </SelectContent>
                </Select>
                <Button onClick={handleSave} disabled={isSaving} className="w-full bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700">
                    {isSaving ? <Loader2 className="animate-spin"/> : (editingId ? 'Update' : 'Add Member')}
                </Button>
             </div>
          </DialogContent>
       </Dialog>
    </div>
  );
}
