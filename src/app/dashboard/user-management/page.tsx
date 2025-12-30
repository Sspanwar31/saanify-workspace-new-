'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Users, Shield, UserCheck, Ban, Plus, Search, 
  Download, RefreshCw, Edit, Trash2, Crown, Activity, 
  Lock, Unlock, Link as LinkIcon, Save, Check, X, AlertTriangle, FileText, Filter as FilterIcon
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// --- CONFIGURATION CONSTANTS ---
const PERMISSION_CATEGORIES = [
  { name: 'General Permissions', items: ['View Dashboard', 'View Passbook', 'View Loans', 'View Members', 'View Reports', 'View Settings', 'Export Data'] },
  { name: 'User Management Permissions', items: ['User Management Access', 'Manage Users', 'Manage Members'] },
  { name: 'Financial Permissions', items: ['Manage Finance', 'Manage Loans', 'Manage Expenses', 'Approve Loans', 'Manage Passbook', 'Manage Admin Fund'] },
  { name: 'System Permissions', items: ['Manage System', 'Manage Subscription'] },
  { name: 'Security Permissions', items: ['View Activity Logs', 'Manage Roles', 'Ghost Mode'] }
];

const DEFAULT_PERMISSIONS = {
  client_admin: ['View Dashboard', 'View Passbook', 'View Loans', 'View Members', 'View Reports', 'View Settings', 'Export Data', 'User Management Access', 'Manage Users', 'Manage Members', 'Manage Finance', 'Manage Loans', 'Manage Expenses', 'Approve Loans', 'Manage Passbook', 'Manage Admin Fund', 'Manage System', 'Manage Subscription', 'View Activity Logs', 'Manage Roles', 'Ghost Mode'],
  treasurer: ['View Dashboard', 'View Passbook', 'View Loans', 'View Members', 'Manage Finance', 'Manage Expenses', 'Manage Passbook'],
  member: ['View Dashboard']
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [ledgerMembers, setLedgerMembers] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all-users');
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // New Status Filter

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', role: 'member', email: '', phone: '', linked_member_id: '', status: 'active'
  });

  // Roles State
  const [roleConfig, setRoleConfig] = useState<any>(DEFAULT_PERMISSIONS);
  const [isEditingRoles, setIsEditingRoles] = useState(false);

  // 1. Fetch Data
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
        // Users
        const { data: userData } = await supabase.from('members').select('*').eq('client_id', cid).order('role', { ascending: true });
        if (userData) {
            setUsers(userData);
            setLedgerMembers(userData);
        }
        // Logs
        const { data: logsData } = await supabase.from('activity_logs').select('*').eq('client_id', cid).order('created_at', { ascending: false }).limit(50);
        if (logsData) setActivityLogs(logsData);
      }
      setLoading(false);
    };
    fetchData();
  }, [clientId]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      blocked: users.filter(u => u.status === 'blocked').length,
      admins: users.filter(u => u.role === 'client_admin').length
    };
  }, [users]);

  // Updated Filter Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus; // Status Check
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ... (Keep logActivity, Handlers, etc. same as before) ...
  const logActivity = async (action: string, details: string) => {
    if (!clientId) return;
    await supabase.from('activity_logs').insert([{ client_id: clientId, user_name: 'Current User', action: action, details: details }]);
  };

  const handleOpenAdd = () => { setEditingUser(null); setFormData({ name: '', role: 'member', email: '', phone: '', linked_member_id: '', status: 'active' }); setIsModalOpen(true); };
  const handleOpenEdit = (user: any) => { setEditingUser(user); setFormData({ name: user.name, role: user.role || 'member', email: user.email || '', phone: user.phone || '', linked_member_id: user.id, status: user.status || 'active' }); setIsModalOpen(true); };
  
  const handleSubmit = async () => {
    if(!clientId || !formData.name) return;
    try {
        if (editingUser) {
            const { error } = await supabase.from('members').update({ name: formData.name, role: formData.role, email: formData.email, phone: formData.phone, status: formData.status }).eq('id', editingUser.id);
            if (error) throw error;
            await logActivity('Update User', `Updated user: ${formData.name}`);
        } else {
            const { error } = await supabase.from('members').insert([{ client_id: clientId, name: formData.name, role: formData.role, email: formData.email, phone: formData.phone, status: formData.status, join_date: new Date().toISOString() }]);
            if (error) throw error;
            await logActivity('Create User', `Created user: ${formData.name}`);
        }
        window.location.reload();
    } catch (error: any) { alert("Error: " + error.message); }
  };

  const handleDelete = async (userId: string, role: string) => {
    if (role === 'client_admin') { alert("Action Denied: Cannot delete Main Admin."); return; }
    if (confirm("Delete this user?")) {
        const { error } = await supabase.from('members').delete().eq('id', userId);
        if (!error) { setUsers(users.filter(u => u.id !== userId)); await logActivity('Delete User', `Deleted user ID: ${userId}`); }
    }
  };

  const handleToggleBlock = async (user: any) => {
    if (user.role === 'client_admin') return;
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const { error } = await supabase.from('members').update({ status: newStatus }).eq('id', user.id);
    if (!error) { setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u)); await logActivity('Status Change', `Changed status of ${user.name} to ${newStatus}`); }
  };

  const togglePermission = (role: string, permission: string) => {
    if (!isEditingRoles || role === 'client_admin') return; 
    setRoleConfig((prev: any) => {
      const currentPerms = prev[role];
      return currentPerms.includes(permission) ? { ...prev, [role]: currentPerms.filter((p: string) => p !== permission) } : { ...prev, [role]: [...currentPerms, permission] };
    });
  };

  const savePermissions = async () => { setIsEditingRoles(false); await logActivity('Permissions Update', 'Updated role permissions matrix'); toast.success("Permissions updated successfully!"); };

  const getRoleBadgeColor = (role: string) => {
    switch(role) { case 'client_admin': return 'bg-purple-100 text-purple-800'; case 'treasurer': return 'bg-green-100 text-green-800'; default: return 'bg-blue-100 text-blue-800'; }
  };
  const getPermissionCount = (role: string, categoryItems: string[]) => { return roleConfig[role].filter((p: string) => categoryItems.includes(p)).length; };


  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Manage administrators, treasurers, and society members.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4 mr-2"/> Refresh</Button><Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenAdd}><Plus className="h-4 w-4 mr-2"/> Add User</Button></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm font-medium text-gray-500">Total Users</p><h3 className="text-2xl font-bold text-blue-600">{stats.total}</h3></div><div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600"/></div></CardContent></Card>
        <Card><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm font-medium text-gray-500">Active Users</p><h3 className="text-2xl font-bold text-green-600">{stats.active}</h3></div><div className="p-3 bg-green-100 rounded-lg"><UserCheck className="h-6 w-6 text-green-600"/></div></CardContent></Card>
        <Card><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm font-medium text-gray-500">Blocked Users</p><h3 className="text-2xl font-bold text-red-600">{stats.blocked}</h3></div><div className="p-3 bg-red-100 rounded-lg"><Ban className="h-6 w-6 text-red-600"/></div></CardContent></Card>
        <Card><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm font-medium text-gray-500">Total Roles</p><h3 className="text-2xl font-bold text-purple-600">3</h3></div><div className="p-3 bg-purple-100 rounded-lg"><Crown className="h-6 w-6 text-purple-600"/></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-6"><TabsList className="grid w-full max-w-3xl grid-cols-3"><TabsTrigger value="all-users"><Users className="h-4 w-4 mr-2"/> All Users</TabsTrigger><TabsTrigger value="roles"><Shield className="h-4 w-4 mr-2"/> Roles & Permissions</TabsTrigger><TabsTrigger value="activity"><Activity className="h-4 w-4 mr-2"/> Activity Logs</TabsTrigger></TabsList></div>

        {/* 1. All Users Tab */}
        <TabsContent value="all-users" className="space-y-4">
            
            {/* ✅ UPDATED FILTERS BAR - Matches Screenshot Style */}
            <div className="bg-white p-4 rounded-lg border flex flex-col md:flex-row gap-4 items-center">
                
                {/* 1. Filter Label */}
                <div className="flex items-center gap-2 text-gray-900 font-semibold mr-2">
                    <Search className="h-5 w-5" /> Filters
                </div>
                
                {/* 2. Search Bar (Expanded Width) */}
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                    <Input 
                        placeholder="Search users by name or email..." 
                        className="pl-10 h-10 w-full" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* 3. Status Filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px] h-10 bg-white"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                </Select>

                {/* 4. Role Filter */}
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[180px] h-10 bg-white"><SelectValue placeholder="All Roles" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="client_admin">Client Admin</SelectItem>
                        <SelectItem value="treasurer">Treasurer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                </Select>

                {/* 5. Export Button */}
                <Button variant="outline" className="h-10 px-4">
                    <Download className="h-4 w-4 mr-2"/> Export
                </Button>
            </div>

            <Card>
                <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader className="bg-gray-50"><TableRow><TableHead>User Info</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Phone</TableHead><TableHead>Linked</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading users...</TableCell></TableRow> : filteredUsers.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8">No users found matching filters.</TableCell></TableRow> : filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell><div className="flex items-center gap-3"><Avatar><AvatarImage src={`/avatars/${user.id}.jpg`} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-medium text-gray-900">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div></div></TableCell>
                        <TableCell><Badge className={`${getRoleBadgeColor(user.role)} border-0`}>{user.role.replace('_', ' ').toUpperCase()}</Badge></TableCell>
                        <TableCell><Badge variant={user.status === 'active' ? 'default' : 'destructive'}>{user.status}</Badge></TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.role === 'member' ? <div className="flex items-center text-blue-600 text-xs"><LinkIcon className="h-3 w-3 mr-1"/> Linked</div> : <span className="text-gray-400 text-xs">System User</span>}</TableCell>
                        <TableCell className="text-right"><div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)} className="text-blue-500"><Edit className="h-4 w-4" /></Button>
                            {user.role !== 'client_admin' && <Button variant="ghost" size="icon" onClick={() => handleToggleBlock(user)} className={user.status==='active'?"text-orange-500":"text-green-500"}>{user.status==='active'?<Lock className="h-4 w-4"/>:<Unlock className="h-4 w-4"/>}</Button>}
                            {user.role !== 'client_admin' && <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(user.id, user.role)}><Trash2 className="h-4 w-4" /></Button>}
                        </div></TableCell>
                    </TableRow>
                ))}
            </TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div><h2 className="text-lg font-bold text-gray-800">Role Capabilities</h2><p className="text-sm text-gray-500">Configure what each role can access and perform.</p></div>
                <div className="flex gap-3">
                    {isEditingRoles ? <><Button variant="outline" onClick={() => setIsEditingRoles(false)} className="text-red-600"><X className="h-4 w-4 mr-2"/> Cancel</Button><Button onClick={savePermissions} className="bg-green-600 text-white"><Save className="h-4 w-4 mr-2"/> Save Changes</Button></> : <Button onClick={() => setIsEditingRoles(true)} className="bg-blue-600 text-white"><Edit className="h-4 w-4 mr-2"/> Edit Permissions</Button>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['client_admin', 'treasurer', 'member'].map(role => (
                    <Card key={role} className={`border-t-4 ${role === 'client_admin' ? 'border-t-purple-600' : role === 'treasurer' ? 'border-t-green-600' : 'border-t-blue-600'}`}>
                        <CardHeader className="pb-2"><div className="flex justify-between items-start"><Badge className={getRoleBadgeColor(role)}>{role.replace('_', ' ').toUpperCase()}</Badge><span className="text-xs font-bold text-gray-400">{roleConfig[role].length} total</span></div></CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>General</span><span className="font-medium">{getPermissionCount(role, PERMISSION_CATEGORIES[0].items)}/7</span></div>
                                <div className="flex justify-between"><span>Financial</span><span className="font-medium">{getPermissionCount(role, PERMISSION_CATEGORIES[2].items)}/6</span></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Permission</TableHead><TableHead className="text-center bg-purple-50">Client Admin</TableHead><TableHead className="text-center bg-green-50">Treasurer</TableHead><TableHead className="text-center bg-blue-50">Member</TableHead></TableRow></TableHeader><TableBody>
                {PERMISSION_CATEGORIES.map((cat) => (<><TableRow key={cat.name} className="bg-gray-50/50 hover:bg-gray-50"><TableCell colSpan={4} className="font-bold text-gray-700 py-3">{cat.name}</TableCell></TableRow>{cat.items.map(perm => (
                    <TableRow key={perm}><TableCell className="text-gray-600 pl-6">{perm}</TableCell>
                    <TableCell className="text-center"><div className="flex justify-center"><Checkbox checked={roleConfig.client_admin.includes(perm)} disabled className="data-[state=checked]:bg-purple-600" /></div></TableCell>
                    <TableCell className="text-center"><div className="flex justify-center"><Checkbox checked={roleConfig.treasurer.includes(perm)} disabled={!isEditingRoles} onCheckedChange={() => togglePermission('treasurer', perm)} className="data-[state=checked]:bg-green-600"/></div></TableCell>
                    <TableCell className="text-center"><div className="flex justify-center"><Checkbox checked={roleConfig.member.includes(perm)} disabled className="data-[state=checked]:bg-blue-600"/></div></TableCell></TableRow>
                ))}</>))}
            </TableBody></Table></CardContent></Card>
            {isEditingRoles && <Alert className="bg-yellow-50 border-yellow-200"><AlertTriangle className="h-4 w-4 text-yellow-600"/><AlertDescription className="text-yellow-800 text-xs">You are in Edit Mode. Changes to permissions will affect what users can see and do immediately after saving.</AlertDescription></Alert>}
        </TabsContent>

        <TabsContent value="activity">
            <Card><CardHeader><CardTitle>System Activity Logs</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>
                {activityLogs.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No activity logs recorded yet.</TableCell></TableRow> : activityLogs.map(log => (
                    <TableRow key={log.id}><TableCell className="font-medium">{log.user_name}</TableCell><TableCell><Badge variant="outline">{log.action}</Badge></TableCell><TableCell className="text-gray-500 text-sm">{log.details}</TableCell><TableCell>{new Date(log.created_at).toLocaleString()}</TableCell></TableRow>
                ))}
            </TableBody></Table></div></CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter name"/></div>
                <div className="grid gap-2"><Label>Role</Label><Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="client_admin">Client Admin</SelectItem><SelectItem value="treasurer">Treasurer</SelectItem><SelectItem value="member">Member</SelectItem></SelectContent></Select></div>
                <div className="grid gap-2"><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="user@example.com"/></div>
                <div className="grid gap-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91..."/></div>
                {formData.role === 'member' && <div className="grid gap-2"><Label>Link Member</Label><Select value={formData.linked_member_id} onValueChange={(val) => setFormData({...formData, linked_member_id: val})}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent><SelectItem value="not_linked">Not Linked</SelectItem>{ledgerMembers.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}</SelectContent></Select></div>}
                <div className="flex justify-between items-center border p-3 rounded"><Label>Status</Label><Switch checked={formData.status === 'active'} onCheckedChange={(c) => setFormData({...formData, status: c ? 'active' : 'blocked'})}/></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit} className="bg-blue-600 text-white">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
