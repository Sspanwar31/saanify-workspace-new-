'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { 
  Plus, 
  Users, 
  Shield, 
  UserCheck, 
  RefreshCw,
  Crown,
  TrendingUp,
  Key,
  Trash2,
  Edit,
  Lock,
  Unlock,
  Search,
  Filter,
  Download,
  Activity,
  Ban,
  Link as LinkIcon // Renamed to avoid conflict with standard Link
} from 'lucide-react';
import { toast } from 'sonner'; // Added for toast notifications
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Added Table Imports

// Mock Data Interfaces
interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  joinDate: string;
  lastLogin?: string | null;
  linked_member_id?: string | null;
}
interface ActivityLog { id: string; userId: string; action: string; timestamp: string; }
interface Role { id: string; name: string; color?: string; }

const MOCK_ROLES: Role[] = [
  { id: 'client_admin', name: 'Client Admin', color: 'bg-purple-100 text-purple-800' },
  { id: 'treasurer', name: 'Treasurer', color: 'bg-green-100 text-green-800' },
  { id: 'member', name: 'Member', color: 'bg-blue-100 text-blue-800' }
];

export default function UserManagementPage() {
  // Fixed: Added isModalOpen and formData state as they are used in JSX but were missing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // Used in edit
  const [formData, setFormData] = useState({
    name: '',
    role: 'member',
    email: '',
    phone: '',
    linked_member_id: '',
    status: 'active'
  });

  const [activeTab, setActiveTab] = useState('all-users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // ✅ FIX: Calculate stats from users to avoid "stats is not defined" error
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    blocked: users.filter(u => u.status === 'blocked').length
  };

  // Mock permissions check
  const hasPermission = (userId: string, permission: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    if (user.role === 'client_admin' && permission.includes('MANAGE')) return true;
    if (user.role === 'treasurer' && permission.includes('FINANCIAL')) return true;
    return false;
  };

  useEffect(() => {
    const fetchUserData = async () => {
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
        const { data, error } = await supabase
          .from('members')
          .select('id, name, email, phone, role, status, join_date, created_at')
          .eq('client_id', cid)
          .order('role', { ascending: true });
        
        if (data) {
          const mappedUsers = data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email || 'N/A',
            role: u.role || 'member',
            status: u.status || 'active',
            phone: u.phone || '',
            joinDate: u.join_date || u.created_at,
            lastLogin: u.last_login || null,
            linked_member_id: u.id
          }));
          setUsers(mappedUsers);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [clientId]);

  // Functions (Placeholders keeping logic same)
  const addUser = (newUser: any) => { /* ... */ };
  const blockUser = (userId: string) => { /* ... */ };
  const unblockUser = (userId: string) => { /* ... */ };
  const deleteUser = (userId: string) => { /* ... */ };
  const linkMember = (userId: string, memberId: string) => { /* ... */ };
  const unlinkMember = (userId: string) => { /* ... */ };
  const impersonateUser = (userId: string) => { console.log("Impersonating user:", userId); };
  const stopImpersonation = () => { console.log("Stopping impersonation"); };
  const togglePermission = (userId: string, permission: string, value: boolean) => { console.log(`Toggling permission ${permission}`); };

  const handleAddUser = (userData: any) => {
    const newUser = {
      ...userData,
      id: `user-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };
    setUsers([...users, newUser]);
    toast.success('User Added', { description: `${newUser.name} added successfully.` });
    setIsModalOpen(false); // Close modal
  };

  const handleSaveUser = (savedUser: any) => {
    setUsers(users.map(u => u.id === savedUser.id ? { ...savedUser, updatedAt: new Date().toISOString() } : u));
    toast.success('User Updated', { description: `${savedUser.name} updated successfully.` });
  };

  const handleDelete = async (userId: string, role: string) => {
    if (role === 'client_admin') {
        alert("Action Denied: Cannot delete Client Admin.");
        return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
        const { error } = await supabase.from('members').delete().eq('id', userId);
        if (!error) {
            setUsers(users.filter(u => u.id !== userId));
            toast.success('User Deleted', { description: 'User removed successfully.' });
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
        toast.success(newStatus === 'active' ? '✅ User Unblocked' : '✅ User Blocked', { description: `${user.name} is now ${newStatus}.` });
    } else {
        alert("Error updating status: " + error.message);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      linked_member_id: user.linked_member_id || '',
      status: user.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (selectedUser) {
        handleSaveUser({ ...formData, id: selectedUser.id });
    } else {
        handleAddUser(formData);
    }
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      role: 'member',
      email: '',
      phone: '',
      linked_member_id: '',
      status: 'active'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
        case 'client_admin': return 'bg-purple-100 text-purple-800';
        case 'treasurer': return 'bg-green-100 text-green-800';
        default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Filter logic
  const filteredUsers = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage users, roles, permissions, and monitor system activity</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()} className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" className="flex items-center gap-2"><Download className="h-4 w-4"/> Export</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                setSelectedUser(null);
                setFormData({
                  name: '',
                  role: 'member',
                  email: '',
                  phone: '',
                  linked_member_id: '',
                  status: 'active'
                });
                setIsModalOpen(true);
            }}>
                <Plus className="h-4 w-4"/> Add User
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Total Users</p><h3 className="text-2xl font-bold text-blue-600">{stats.total}</h3><p className="text-xs text-gray-400">Registered users</p></div>
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm font-medium">Active Users</p><h3 className="text-2xl font-bold text-green-600">{stats.active}</h3><p className="text-xs text-gray-400">Currently active</p></div>
            <div className="p-3 bg-green-100 rounded-lg"><UserCheck className="h-6 w-6 text-green-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm font-medium">Blocked Users</p><h3 className="text-2xl font-bold text-red-600">{stats.blocked}</h3><p className="text-xs text-gray-400">Blocked accounts</p></div>
            <div className="p-3 bg-red-100 rounded-lg"><Ban className="h-6 w-6 text-red-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div><p className="text-sm font-medium">Total Roles</p><h3 className="text-2xl font-bold text-purple-600">3</h3><p className="text-xs text-gray-400">System roles</p></div>
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
                            <TableHeader>
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
                                                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} 
                                                       className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                    {user.status?.toUpperCase()}
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
                                                    <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50" onClick={() => handleEditUser(user)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

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

                                                    {user.role !== 'client_admin' && (
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

        {/* 2. Roles & Permissions Tab */}
        <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MOCK_ROLES.map(role => (
                    <Card key={role.id} className="border-2" style={{ borderColor: role.color?.split('-')[2] || '#ccc' }}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Shield className={`h-6 w-6 text-${role.color?.split('-')[2] || 'gray'}-600`} />
                                <Badge className={`${role.color || 'bg-gray-100 text-gray-800'}`}>5 permissions</Badge>
                            </div>
                            <CardTitle className="mt-2 text-lg">{role.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">
                                Permissions related to financial management.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline">View</Badge>
                                <Badge variant="outline">Create</Badge>
                                <Badge variant="outline">Edit</Badge>
                                <Badge variant="outline">+9 more</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        {/* 3. Activity Logs Tab */}
        <TabsContent value="activity">
            <Card>
                <CardHeader>
                    <CardTitle>System Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white">
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activityLogs.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No activity logs found.</TableCell></TableRow>
                                ) : (
                                    activityLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell>{(users.find(u => u.id === log.userId))?.name || 'Unknown'}</TableCell>
                                            <TableCell>{log.action}</TableCell>
                                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">N/A</TableCell>
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

      {/* Add/Edit User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter name"/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
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
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="user@example.com"/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91..."/>
                </div>
                
                {formData.role === 'member' && (
                    <div className="grid gap-2">
                        <Label>Link to Member Record</Label>
                        <Select value={formData.linked_member_id} onValueChange={(val) => setFormData({...formData, linked_member_id: val})}>
                            <SelectTrigger><SelectValue placeholder="Select Member Ledger..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="not_linked">Not Linked</SelectItem>
                                {users.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
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
                <Button onClick={handleSubmit} className="bg-blue-600 text-white">{selectedUser ? 'Update User' : 'Create User'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
