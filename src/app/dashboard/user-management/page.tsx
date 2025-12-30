'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Users, Shield, UserCheck, Ban, Plus, Search, Filter, 
  Download, RefreshCw, Edit, Trash2, Crown, Activity, 
  CheckCircle, XCircle, Lock, Unlock, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [ledgerMembers, setLedgerMembers] = useState<any[]>([]); // For Linking
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all-users');
  const [clientId, setClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'member',
    email: '',
    phone: '',
    linked_member_id: '',
    status: 'active'
  });

  // 1. Fetch Users & Ledger Members
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      let cid = clientId;
      if (!cid) {
        const { data: clients } = await supabase.from('clients').select('id').limit(1);
        if (clients && clients.length > 0) {
            cid = clients[0].id;
            setClientId(cid);
        }
      }

      if (cid) {
        // Fetch Users (Actually Members table used for users in this schema)
        const { data: userData } = await supabase
            .from('members')
            .select('*')
            .eq('client_id', cid)
            .order('role', { ascending: true }); // Show Admins first
        
        // Fetch All Members from Ledger (To populate 'Link Member' dropdown)
        // In your current schema, 'members' table IS both user and ledger.
        // So we use the same data.
        if (userData) {
            setUsers(userData);
            setLedgerMembers(userData); // Using same list for linking logic
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [clientId]);

  // 2. Stats Calculation
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      blocked: users.filter(u => u.status === 'blocked').length,
      admins: users.filter(u => u.role === 'client_admin').length
    };
  }, [users]);

  // 3. Filter Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // --- HANDLERS ---

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
        name: '', role: 'member', email: '', phone: '', 
        linked_member_id: '', status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
        name: user.name,
        role: user.role || 'member',
        email: user.email || '',
        phone: user.phone || '',
        linked_member_id: user.id, // In this schema, User IS Member
        status: user.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if(!clientId || !formData.name) return;

    try {
        if (editingUser) {
            // EDIT USER
            const { error } = await supabase
                .from('members')
                .update({
                    name: formData.name,
                    role: formData.role,
                    email: formData.email,
                    phone: formData.phone,
                    status: formData.status
                })
                .eq('id', editingUser.id);
            
            if (error) throw error;
        } else {
            // ADD NEW USER
            const { error } = await supabase.from('members').insert([{
                client_id: clientId,
                name: formData.name,
                role: formData.role,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                join_date: new Date().toISOString()
            }]);

            if (error) throw error;
        }
        
        // Refresh Data
        window.location.reload();

    } catch (error: any) {
        alert("Error saving user: " + error.message);
    }
  };

  const handleDelete = async (userId: string, role: string) => {
    if (role === 'client_admin') {
        alert("Action Denied: You cannot delete the Main Client Admin account.");
        return;
    }
    if (confirm("Are you sure you want to delete this user?")) {
        const { error } = await supabase.from('members').delete().eq('id', userId);
        if (!error) {
            setUsers(users.filter(u => u.id !== userId));
        } else {
            alert("Error deleting user: " + error.message);
        }
    }
  };

  const handleToggleBlock = async (user: any) => {
    if (user.role === 'client_admin') return;

    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const { error } = await supabase.from('members').update({ status: newStatus }).eq('id', user.id);
    
    if (!error) {
        setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
        case 'client_admin': return 'bg-purple-100 text-purple-800';
        case 'treasurer': return 'bg-green-100 text-green-800';
        default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage administrators, treasurers, and society members.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4 mr-2"/> Refresh</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenAdd}><Plus className="h-4 w-4 mr-2"/> Add User</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Total Users</p><h3 className="text-2xl font-bold text-blue-600">{stats.total}</h3></div>
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Active Users</p><h3 className="text-2xl font-bold text-green-600">{stats.active}</h3></div>
            <div className="p-3 bg-green-100 rounded-lg"><UserCheck className="h-6 w-6 text-green-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Blocked Users</p><h3 className="text-2xl font-bold text-red-600">{stats.blocked}</h3></div>
            <div className="p-3 bg-red-100 rounded-lg"><Ban className="h-6 w-6 text-red-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Total Roles</p><h3 className="text-2xl font-bold text-purple-600">3</h3></div>
            <div className="p-3 bg-purple-100 rounded-lg"><Crown className="h-6 w-6 text-purple-600"/></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-3">
                <TabsTrigger value="all-users"><Users className="h-4 w-4 mr-2"/> All Users</TabsTrigger>
                <TabsTrigger value="roles"><Shield className="h-4 w-4 mr-2"/> Roles & Permissions</TabsTrigger>
                <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-2"/> Activity Logs</TabsTrigger>
            </TabsList>
        </div>

        {/* 1. All Users Tab */}
        <TabsContent value="all-users" className="space-y-4">
            <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-4 items-center">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                    <Input placeholder="Search users..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="client_admin">Client Admin</SelectItem>
                        <SelectItem value="treasurer">Treasurer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>User Info</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Linked Member</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8">Loading users...</TableCell></TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No users found.</TableCell></TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={`/avatars/${user.id}.jpg`} />
                                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getRoleBadgeColor(user.role)} border-0`}>
                                                    {user.role.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-600">{user.phone}</TableCell>
                                            <TableCell>
                                                {user.role === 'member' ? (
                                                     <div className="flex items-center text-blue-600 text-xs">
                                                        <LinkIcon className="h-3 w-3 mr-1"/> Linked
                                                     </div>
                                                ) : <span className="text-gray-400 text-xs">System User</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)} className="text-blue-500 hover:bg-blue-50">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

                                                    {/* Block Button */}
                                                    {user.role !== 'client_admin' && (
                                                        <Button 
                                                            variant="ghost" size="icon" 
                                                            onClick={() => handleToggleBlock(user)}
                                                            className={user.status === 'active' ? "text-orange-500 hover:bg-orange-50" : "text-green-500 hover:bg-green-50"}
                                                            title={user.status === 'active' ? 'Block User' : 'Unblock User'}
                                                        >
                                                            {user.status === 'active' ? <Lock className="h-4 w-4"/> : <Unlock className="h-4 w-4"/>}
                                                        </Button>
                                                    )}

                                                    {/* Delete Button */}
                                                    {user.role === 'client_admin' ? (
                                                        <Button variant="ghost" size="icon" disabled className="text-gray-300">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(user.id, user.role)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Static UI for now */}
                <Card>
                    <CardHeader className="pb-2"><div className="flex justify-between"><Shield className="h-6 w-6 text-purple-600"/><Badge className="bg-purple-100 text-purple-800">Full Access</Badge></div><CardTitle className="mt-2">Client Admin</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-gray-500">Full control over the system.</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><div className="flex justify-between"><Shield className="h-6 w-6 text-green-600"/><Badge className="bg-green-100 text-green-800">Financial</Badge></div><CardTitle className="mt-2">Treasurer</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-gray-500">Manage expenses and fees.</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><div className="flex justify-between"><Shield className="h-6 w-6 text-blue-600"/><Badge className="bg-blue-100 text-blue-800">Read Only</Badge></div><CardTitle className="mt-2">Member</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-gray-500">View own profile and passbook.</p></CardContent>
                </Card>
            </div>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity">
            <Card>
                <CardHeader><CardTitle>System Activity</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-center py-10 text-gray-400">No activity logs recorded yet.</div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter name"/>
                </div>
                <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                        <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="client_admin">Client Admin</SelectItem>
                            <SelectItem value="treasurer">Treasurer</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="user@example.com"/>
                </div>
                <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91..."/>
                </div>
                
                {/* Only show Link Member if role is Member */}
                {formData.role === 'member' && (
                    <div className="grid gap-2">
                        <Label>Link to Existing Member Record</Label>
                        <Select value={formData.linked_member_id} onValueChange={(val) => setFormData({...formData, linked_member_id: val})}>
                            <SelectTrigger><SelectValue placeholder="Select Member Ledger..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="not_linked">Not Linked</SelectItem>
                                {ledgerMembers.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.phone})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="flex items-center justify-between border p-3 rounded-lg">
                    <div className="space-y-0.5">
                        <Label>Account Status</Label>
                        <p className="text-xs text-gray-500">Enable to allow login access</p>
                    </div>
                    <Switch 
                        checked={formData.status === 'active'}
                        onCheckedChange={(checked) => setFormData({...formData, status: checked ? 'active' : 'blocked'})}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-blue-600 text-white">{editingUser ? 'Update User' : 'Create User'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
