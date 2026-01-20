'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase'; 
import {
  Users, Shield, UserCheck, Ban, Plus, Search,
  Download, RefreshCw, Edit, Trash2, Crown, Activity,
  Lock, Unlock, Link as LinkIcon, Save, X, Filter as FilterIcon,
  Eye, EyeOff 
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
import { toast } from 'sonner';

// --- CONFIGURATION CONSTANTS ---
const PERMISSION_CATEGORIES = [
  { name: 'General Permissions', items: ['View Dashboard', 'View Passbook', 'View Loans', 'View Members', 'View Reports', 'View Settings', 'Export Data'] },
  { name: 'User Management Permissions', items: ['User Management Access', 'Manage Users', 'Manage Members'] },
  { name: 'Financial Permissions', items: ['Manage Finance', 'Manage Loans', 'Manage Expenses', 'Approve Loans', 'Manage Passbook', 'Manage Admin Fund'] },
  { name: 'System Permissions', items: ['Manage System', 'Manage Subscription'] },
  { name: 'Security Permissions', items: ['View Activity Logs', 'Manage Roles', 'Ghost Mode'] }
];

// ✅ CHANGE-3: Kept DEFAULT_PERMISSIONS (Fallback logic)
const DEFAULT_PERMISSIONS = {
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
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [showPassword, setShowPassword] = useState(false); 
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', role: 'member', email: '', phone: '', linked_member_id: '', status: 'active', password: ''
  });

  // Roles State
  const [roleConfig, setRoleConfig] = useState<any>(DEFAULT_PERMISSIONS);
  const [isEditingRoles, setIsEditingRoles] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('current_user');
      let cid = clientId;

      if (!cid && storedUser) {
        const user = JSON.parse(storedUser);
        cid = user.id;
        setClientId(cid);
      }

      if (cid) {
        // Members
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .eq('client_id', cid)
          .eq('role', 'member');

        // Treasurers
        const { data: treasurerData } = await supabase
          .from('clients') 
          .select('*')
          .eq('client_id', cid)
          .eq('role', 'treasurer');

        const treasurers = treasurerData || [];
        const members = memberData || [];

        // Combine for UI
        const userData = [...treasurers, ...members];
        
        setUsers(userData);
        setLedgerMembers(members); 

        // Logs
        const { data: logsData } = await supabase.from('activity_logs').select('*').eq('client_id', cid).order('created_at', { ascending: false }).limit(50);
        if (logsData) setActivityLogs(logsData);
      }
      setLoading(false);
    };
    fetchData();
  }, [clientId]);

  // 2. Load Permissions Effect
  useEffect(() => {
    if (!clientId) return;

    const loadPermissions = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('role_permissions')
        .eq('id', clientId)
        .single();

      if (!error && data?.role_permissions) {
        setRoleConfig((prev: any) => ({
          ...prev,
          ...data.role_permissions
        }));
      }
    };

    loadPermissions();
  }, [clientId]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      blocked: users.filter(u => u.status === 'blocked').length,
      treasurers: users.filter(u => u.role === 'treasurer').length
    };
  }, [users]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const logActivity = async (action: string, details: string) => {
    if (!clientId) return;
    await supabase.from('activity_logs').insert([{ client_id: clientId, user_name: 'Current User', action: action, details: details }]);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', role: 'member', email: '', phone: '', linked_member_id: '', status: 'active', password: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name, role: user.role || 'member', email: user.email || '',
      phone: user.phone || '', linked_member_id: user.id, status: user.status || 'active',
      password: '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if(!clientId || !formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }

    setIsSaving(true); 

    try {
      const payload = {
        id: editingUser ? editingUser.id : null, 
        clientId: clientId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        targetTable: formData.role === 'treasurer' ? 'clients' : 'members',
        password: formData.password 
      };

      const response = await fetch('/api/users/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Fixed Header Name
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      await logActivity(editingUser ? 'Update User' : 'Create User', `${editingUser ? 'Updated' : 'Created'} user: ${formData.name}`);
      toast.success(editingUser ? "User Updated Successfully" : "User Created Successfully");
      
      setIsModalOpen(false);

    } catch (error: any) { 
      console.error(error);
      toast.error(error.message || "Operation failed"); 
    } finally {
      setIsSaving(false); 
    }
  };

  const handleDelete = async (userId: string, role: string) => {
    if (role === 'client_admin') { alert("Action Denied: Cannot delete Main Admin."); return; }
    if (confirm("Delete this user? This will also remove their login access.")) {
      const { error } = await supabase.from('members').delete().eq('id', userId);
      if (!error) {
        setUsers(users.filter(u => u.id !== userId));
        await logActivity('Delete User', `Deleted user ID: ${userId}`);
        toast.success("User Deleted");
      } else {
        toast.error("Delete Failed: " + error.message);
      }
    }
  };

  const handleToggleBlock = async (user: any) => {
    if (user.role === 'client_admin') return;
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const { error } = await supabase.from('members').update({ status: newStatus }).eq('id', user.id);
    if (!error) {
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      await logActivity('Status Change', `Changed status of ${user.name} to ${newStatus}`);
      toast.success(`User ${newStatus === 'active' ? 'Activated' : 'Blocked'}`);
    }
  };

  const togglePermission = (role: string, permission: string) => {
    if (!isEditingRoles || role === 'client_admin') return;
    setRoleConfig((prev: any) => {
      const currentPerms = prev[role];
      return currentPerms.includes(permission) ? { ...prev, [role]: currentPerms.filter((p: string) => p !== permission) } : { ...prev, [role]: [...currentPerms, permission] };
    });
  };

  const savePermissions = async () => {
    if (!clientId) return;

    try {
      const res = await fetch('/api/roles/update-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          role: 'treasurer',
          permissions: roleConfig.treasurer
        })
      });

      if (!res.ok) throw new Error('Permission save failed');

      await logActivity('Permissions Update', 'Updated role permissions matrix');
      toast.success("Permissions updated successfully");
      setIsEditingRoles(false);
    } catch (err) {
      toast.error("Failed to save permissions");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) { 
      case 'client_admin': return 'bg-purple-100 text-purple-800'; 
      case 'treasurer': return 'bg-green-100 text-green-800'; 
      default: return 'bg-blue-100 text-blue-800'; 
    }
  };

  const getPermissionCount = (role: string, categoryItems: string[]) => { return roleConfig[role].filter((p: string) => categoryItems.includes(p)).length; };

  return (
    <div className="p-6 space-y-6">
      {/* 1. Header */}
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

      {/* 2. TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12 bg-white rounded-full p-1 shadow-sm border">
            <TabsTrigger value="all-users" className="rounded-full text-sm font-medium data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 transition-all">
              <Users className="h-4 w-4 mr-2"/> All Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="rounded-full text-sm font-medium data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 transition-all">
              <Shield className="h-4 w-4 mr-2"/> Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-full text-sm font-medium data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 transition-all">
              <Activity className="h-4 w-4 mr-2"/> Activity Logs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 3. Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex justify-between items-center">
              <div><p className="text-sm font-medium text-gray-500">Total Users</p><h3 className="text-3xl font-bold text-blue-600 mt-1">{stats.total}</h3><p className="text-xs text-gray-400 mt-1">Registered users</p></div>
              <div className="p-4 bg-blue-50 rounded-xl"><Users className="h-6 w-6 text-blue-600"/></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex justify-between items-center">
              <div><p className="text-sm font-medium text-gray-500">Active Users</p><h3 className="text-3xl font-bold text-green-600 mt-1">{stats.active}</h3><p className="text-xs text-gray-400 mt-1">Currently active</p></div>
              <div className="p-4 bg-green-50 rounded-xl"><UserCheck className="h-6 w-6 text-green-600"/></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex justify-between items-center">
              <div><p className="text-sm font-medium text-gray-500">Blocked Users</p><h3 className="text-3xl font-bold text-red-600 mt-1">{stats.blocked}</h3><p className="text-xs text-gray-400 mt-1">Blocked accounts</p></div>
              <div className="p-4 bg-red-50 rounded-xl"><Ban className="h-6 w-6 text-red-600"/></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex justify-between items-center">
              <div><p className="text-sm font-medium text-gray-500">Total Treasurers</p><h3 className="text-3xl font-bold text-purple-600 mt-1">{stats.treasurers}</h3><p className="text-xs text-gray-400 mt-1">Active treasurers</p></div>
              <div className="p-4 bg-purple-50 rounded-xl"><Crown className="h-6 w-6 text-purple-600"/></div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Tab Contents */}
        <TabsContent value="all-users" className="space-y-6">
          <div className="bg-white p-4 rounded-lg border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 w-full items-center">
              <div className="flex items-center gap-2 text-gray-500 font-medium whitespace-nowrap">
                <FilterIcon className="h-4 w-4" /> Filters
              </div>
              <div className="relative flex-grow w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <Input placeholder="Search users by name or email..." className="pl-10 h-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              </div>
              <div className="w-full md:w-48"><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="h-10 w-full bg-white"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select></div>
              <div className="w-full md:w-48"><Select value={filterRole} onValueChange={setFilterRole}><SelectTrigger className="h-10 w-full bg-white"><SelectValue placeholder="All Roles" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="treasurer">Treasurer</SelectItem><SelectItem value="member">Member</SelectItem></SelectContent></Select></div>
              <Button variant="outline" className="h-10 px-4 w-full md:w-auto"><Download className="h-4 w-4 mr-2"/> Export</Button>
            </div>
          </div>
          <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader className="bg-gray-50"><TableRow><TableHead className="py-4 pl-6 w-[300px]">User Info</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Phone</TableHead><TableHead>Linked</TableHead><TableHead className="text-right pr-6">Actions</TableHead></TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-500">Loading users...</TableCell></TableRow> : filteredUsers.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-500">No users found matching filters.</TableCell></TableRow> : filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge className={`${getRoleBadgeColor(user.role)} border-0 px-3 py-1 font-medium`}>{user.role.replace('_', ' ').toUpperCase()}</Badge></TableCell>
                <TableCell><Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="uppercase text-[10px] px-2">{user.status}</Badge></TableCell>
                <TableCell className="text-gray-600 font-medium text-sm">{user.phone}</TableCell>
                <TableCell>
                  {user.role === 'member' ? <div className="flex items-center text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded w-fit"><LinkIcon className="h-3 w-3 mr-1"/> Linked</div> : <span className="text-gray-400 text-xs italic">System User</span>}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)} className="text-blue-600 hover:bg-blue-50 h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    {user.role !== 'client_admin' && <Button variant="ghost" size="icon" onClick={() => handleToggleBlock(user)} className={`h-8 w-8 ${user.status === 'active' ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}>{user.status === 'active' ? <Lock className="h-4 w-4"/> : <Unlock className="h-4 w-4" />}</Button>}
                    {user.role !== 'client_admin' && <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 h-8 w-8" onClick={() => handleDelete(user.id, user.role)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table></div></CardContent></Card>
        </TabsContent>

        {/* Roles & Activity Tabs (Fixed Table Structure) */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
            <div><h2 className="text-lg font-bold text-gray-900">Role Capabilities</h2><p className="text-sm text-gray-500 mt-1">Configure what each role can access and perform.</p></div>
            <div className="flex gap-3">{isEditingRoles ? <><Button variant="outline" onClick={() => setIsEditingRoles(false)} className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100"><X className="h-4 w-4 mr-2"/> Cancel</Button><Button onClick={savePermissions} className="bg-green-600 text-white hover:bg-green-700 shadow-md"><Save className="h-4 w-4 mr-2"/> Save Changes</Button></> : <Button onClick={() => setIsEditingRoles(true)} className="bg-blue-600 text-white hover:bg-blue-700 shadow-md"><Edit className="h-4 w-4 mr-2"/> Edit Permissions</Button>}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['treasurer', 'member'].map(role => (
              <Card key={role} className={`border-t-4 ${role === 'treasurer' ? 'border-t-green-600' : 'border-t-blue-600'}`}>
                <CardHeader className="pb-2"><div className="flex justify-between items-start"><Badge className={getRoleBadgeColor(role)}>{role.replace('_', ' ').toUpperCase()}</Badge><span className="text-xs font-bold text-gray-400">{roleConfig[role].length} total</span></div></CardHeader>
                <CardContent><div className="space-y-2 text-sm"><div className="flex justify-between"><span>General</span><span className="font-medium">{getPermissionCount(role, PERMISSION_CATEGORIES[0].items)} / {PERMISSION_CATEGORIES[0].items.length}</span></div><div className="flex justify-between"><span>Financial</span><span className="font-medium">{getPermissionCount(role, PERMISSION_CATEGORIES[2].items)} / {PERMISSION_CATEGORIES[2].items.length}</span></div></div></CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-[300px]">Permission</TableHead>
                    <TableHead className="text-center bg-green-50">Treasurer</TableHead>
                    <TableHead className="text-center bg-blue-50">Member</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_CATEGORIES.map((cat) => (
                    <>
                      <TableRow key={cat.name} className="bg-gray-50/50 hover:bg-gray-50">
                        <TableCell colSpan={4} className="font-bold text-gray-700 py-3">{cat.name}</TableCell>
                      </TableRow>
                      {cat.items.map(perm => (
                        <TableRow key={perm}>
                          <TableCell className="text-gray-600 pl-6">{perm}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox checked={roleConfig.treasurer.includes(perm)} disabled={!isEditingRoles} onCheckedChange={() => togglePermission('treasurer', perm)} className="data-[state=checked]:bg-green-600"/>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox checked={roleConfig.member.includes(perm)} disabled={!isEditingRoles} className="data-[state=checked]:bg-blue-600"/>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>System Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow> {/* ✅ FIX: Added Missing TableRow here */}
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow> {/* ✅ FIX: Closed TableRow correctly */}
                  </TableHeader>
                  <TableBody>
                    {activityLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-gray-500">No activity logs recorded yet.</TableCell>
                      </TableRow>
                    ) : (
                      activityLogs.map(log => (
                        <TableRow key={log.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{log.user_name}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-white">{log.action}</Badge></TableCell>
                          <TableCell className="text-gray-500 text-sm max-w-xs truncate" title={log.details}>{log.details}</TableCell>
                          <TableCell className="text-right text-gray-500">{new Date(log.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL WITH PASSWORD INPUT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter name"/></div>
            <div className="grid gap-2"><Label>Role</Label><Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
              {/* ✅ PROBLEM-4 FIX: Removed Client Admin from options */}
              <SelectItem value="treasurer">Treasurer</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent></Select></div>
            <div className="grid gap-2"><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="user@example.com"/></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91..."/></div>
            
            {/* PASSWORD FIELD */}
            <div className="grid gap-2">
              <Label>Password</Label>
              <div className="relative">
                <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder={editingUser ? "Enter new to reset (Optional)" : "Set Password"} 
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {editingUser && <p className="text-[10px] text-gray-400">Only enter if you want to change the password.</p>}
            </div>

            {formData.role === 'member' && <div className="grid gap-2"><Label>Link Member</Label><Select value={formData.linked_member_id} onValueChange={(val) => setFormData({ ...formData, linked_member_id: val })}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent><SelectItem value="not_linked">Not Linked</SelectItem>{ledgerMembers.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}</SelectContent></Select></div>}
            <div className="flex justify-between items-center border p-3 rounded"><Label>Status</Label><Switch checked={formData.status === 'active'} onCheckedChange={(c) => setFormData({ ...formData, status: c ? 'active' : 'blocked' })}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white">
              {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
