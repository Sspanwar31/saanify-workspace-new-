'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Users, Shield, UserCheck, Ban, Plus, Search, Filter, 
  Download, RefreshCw, Edit, Trash2, Crown, Activity, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all-users');
  const [clientId, setClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // 1. Fetch Users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Get Client ID
      let cid = clientId;
      if (!cid) {
        const { data: clients } = await supabase.from('clients').select('id').limit(1);
        if (clients && clients.length > 0) {
            cid = clients[0].id;
            setClientId(cid);
        }
      }

      if (cid) {
        // Fetch Members
        const { data: membersData } = await supabase
            .from('members')
            .select('*')
            .eq('client_id', cid)
            .order('role', { ascending: true }); // Admins first usually
        
        if (membersData) {
            // Map Data
            const mappedUsers = membersData.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email || 'N/A',
                // Logic: Check DB role, default to Member
                role: u.role || 'member', 
                status: u.status || 'active',
                phone: u.phone,
                joinDate: u.created_at,
                lastLogin: u.last_login || null
            }));
            setUsers(mappedUsers);
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
      admins: users.filter(u => u.role === 'client_admin' || u.role === 'admin').length
    };
  }, [users]);

  // 3. Filter Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // 4. Handlers
  const handleDelete = async (userId: string, role: string) => {
    // LOCK LOGIC: Client Admin cannot be deleted
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-2">Manage administrators, treasurers, and society members.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2"/> Refresh</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-2"/> Add User</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <h3 className="text-2xl font-bold text-blue-600">{stats.total}</h3>
                <p className="text-xs text-gray-400">Registered users</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
                <p className="text-xs text-gray-400">Currently active</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><UserCheck className="h-6 w-6 text-green-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
                <p className="text-sm font-medium text-gray-500">Blocked Users</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.blocked}</h3>
                <p className="text-xs text-gray-400">Blocked accounts</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg"><Ban className="h-6 w-6 text-red-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
                <p className="text-sm font-medium text-gray-500">Total Roles</p>
                <h3 className="text-2xl font-bold text-purple-600">3</h3>
                <p className="text-xs text-gray-400">Admin, Treasurer, Member</p>
            </div>
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
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-4 items-center">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                    <Input 
                        placeholder="Search users..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                <Button variant="outline"><Download className="h-4 w-4 mr-2"/> Export</Button>
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>User Info</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead>Linked Member ID</TableHead>
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
                                                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="uppercase text-[10px]">
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500">
                                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                            </TableCell>
                                            <TableCell className="text-gray-500 font-mono text-xs">
                                                {user.id.substring(0, 12)}...
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

                                                    {/* LOCK LOGIC: Delete Button Disabled for Client Admin */}
                                                    {user.role === 'client_admin' ? (
                                                        <Button variant="ghost" size="icon" disabled className="text-gray-300 cursor-not-allowed" title="Cannot delete Admin">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-red-500 hover:bg-red-50"
                                                            onClick={() => handleDelete(user.id, user.role)}
                                                        >
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

        {/* 2. Roles Tab (Static View) */}
        <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between">
                            <Shield className="h-6 w-6 text-purple-600"/>
                            <Badge className="bg-purple-100 text-purple-800">Full Access</Badge>
                        </div>
                        <CardTitle className="mt-2">Client Admin</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-sm text-gray-500">Has full control over the system, can manage treasurers and members.</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between">
                            <Shield className="h-6 w-6 text-green-600"/>
                            <Badge className="bg-green-100 text-green-800">Financial</Badge>
                        </div>
                        <CardTitle className="mt-2">Treasurer</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-sm text-gray-500">Can manage expenses, collect fees, and view financial reports.</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between">
                            <Shield className="h-6 w-6 text-blue-600"/>
                            <Badge className="bg-blue-100 text-blue-800">Read Only</Badge>
                        </div>
                        <CardTitle className="mt-2">Member</CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-sm text-gray-500">Can view their own profile, passbook, and loan status.</p></CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* 3. Activity Logs Tab (Placeholder) */}
        <TabsContent value="activity">
            <Card>
                <CardHeader><CardTitle>System Activity</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell>System</TableCell><TableCell>Module loaded</TableCell><TableCell>{new Date().toLocaleDateString()}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
