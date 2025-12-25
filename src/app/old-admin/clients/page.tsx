'use client';

import { useState } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, Shield, 
  Lock, Unlock, Trash2, Eye, Clock, Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

// INITIAL DUMMY DATA
const INITIAL_DATA = [
  { id: 1, name: 'Green Valley Society', email: 'admin@greenvalley.com', plan: 'PRO', status: 'ACTIVE', members: 245, revenue: 125000 },
  { id: 2, name: 'Royal Residency', email: 'admin@royal.com', plan: 'BASIC', status: 'ACTIVE', members: 89, revenue: 45000 },
  { id: 3, name: 'Blue Sky Heights', email: 'admin@blue.com', plan: 'ENTERPRISE', status: 'LOCKED', members: 312, revenue: 280000 },
];

export default function ClientManagement() {
  const [clients, setClients] = useState(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Form State
  const [newClient, setNewClient] = useState({ name: '', email: '', plan: 'BASIC', status: 'ACTIVE' });

  // --- ACTIONS ---
  const handleAddClient = () => {
    if(!newClient.name || !newClient.email) return toast.error("Fill all fields");
    
    const client = {
      id: Date.now(),
      ...newClient,
      members: 0,
      revenue: 0
    };
    
    setClients([client, ...clients]);
    setIsAddOpen(false);
    toast.success("New Client Added Successfully");
    setNewClient({ name: '', email: '', plan: 'BASIC', status: 'ACTIVE' });
  };

  const updateStatus = (id: number, status: string) => {
    setClients(clients.map(c => c.id === id ? { ...c, status } : c));
    toast.success(`Client marked as ${status}`);
  };

  const handleDelete = (id: number) => {
    if(confirm("Are you sure? Data will be lost.")) {
      setClients(clients.filter(c => c.id !== id));
      toast.error("Client Deleted");
    }
  };

  // Filter Logic
  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-gray-400">Manage all societies and subscriptions</p>
        </div>
        
        {/* ADD CLIENT MODAL */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 border-0 hover:opacity-90">
              <Plus className="mr-2 h-4 w-4"/> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e2337] border-white/10 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Society</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label>Society Name</Label>
                 <Input className="bg-[#151929] border-white/10" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Admin Email</Label>
                 <Input className="bg-[#151929] border-white/10" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select onValueChange={v => setNewClient({...newClient, plan: v})} defaultValue="BASIC">
                      <SelectTrigger className="bg-[#151929] border-white/10"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label>Status</Label>
                    <Select onValueChange={v => setNewClient({...newClient, status: v})} defaultValue="ACTIVE">
                      <SelectTrigger className="bg-[#151929] border-white/10"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
               </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddClient} className="bg-cyan-600 w-full">Create Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 bg-[#1e2337] p-4 rounded-xl border border-white/5">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500"/>
            <Input 
              placeholder="Search clients..." 
              className="pl-10 bg-[#151929] border-white/10 text-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5"><Filter className="mr-2 h-4 w-4"/> Filters</Button>
      </div>

      {/* TABLE */}
      <Card className="bg-[#1e2337] border-white/5 text-white overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-gray-400 text-sm uppercase">
              <tr>
                <th className="p-4">Client Name</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Members</th>
                <th className="p-4">Revenue</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white">{client.name}</div>
                    <div className="text-xs text-gray-500">{client.email}</div>
                  </td>
                  <td className="p-4"><Badge variant="outline" className="border-white/20 text-cyan-400">{client.plan}</Badge></td>
                  <td className="p-4">
                    <Badge className={
                      client.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                      client.status === 'LOCKED' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                      client.status === 'EXPIRED' ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' :
                      'bg-blue-500/20 text-blue-400'
                    }>
                      {client.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-gray-300">{client.members}</td>
                  <td className="p-4 font-mono text-green-400">₹{client.revenue.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><MoreHorizontal className="h-5 w-5"/></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#151929] border-white/10 text-white" align="end">
                        <DropdownMenuLabel>Manage Access</DropdownMenuLabel>
                        
                        <DropdownMenuItem onClick={() => toast.info(`Viewing ${client.name}`)}>
                           <Eye className="mr-2 h-4 w-4"/> View Details
                        </DropdownMenuItem>
                        
                        {client.status === 'LOCKED' ? (
                           <DropdownMenuItem onClick={() => updateStatus(client.id, 'ACTIVE')}>
                              <Unlock className="mr-2 h-4 w-4 text-green-400"/> Unlock Account
                           </DropdownMenuItem>
                        ) : (
                           <DropdownMenuItem onClick={() => updateStatus(client.id, 'LOCKED')}>
                              <Lock className="mr-2 h-4 w-4 text-red-400"/> Lock Account
                           </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => updateStatus(client.id, 'EXPIRED')}>
                           <Clock className="mr-2 h-4 w-4 text-orange-400"/> Mark Expired
                        </DropdownMenuItem>
                        
                        <div className="h-[1px] bg-white/10 my-1"/>
                        <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-red-500 hover:text-red-400 hover:bg-red-900/20">
                           <Trash2 className="mr-2 h-4 w-4"/> Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}