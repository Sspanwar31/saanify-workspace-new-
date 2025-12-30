'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-simple'; // Supabase Connection
import { motion } from 'framer-motion';
import { 
  Plus, Users, Shield, UserCheck, RefreshCw, Crown, 
  TrendingUp, Download, Eye, Edit, Trash2, Search, Filter 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // ✅ Added Tabs
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // ✅ Tab State

  // 1. Fetch Users from Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles or members table depending on your auth setup
    // Assuming 'members' table holds user info for now
    const { data: clients } = await supabase.from('clients').select('id').limit(1);
    if (clients && clients.length > 0) {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('client_id', clients[0].id);
        
        if (data) {
            // Map Supabase data to UI format
            const mappedUsers = data.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email || 'N/A', // Assuming email might be missing in members table
                role: u.role || 'Member', // Default to Member if no role column
                status: u.status || 'active',
                phone: u.phone,
                joinDate: u.created_at
            }));
            setUsers(mappedUsers);
        }
    }
    setLoading(false);
  };

  // Stats Calculation
  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      inactiveUsers: users.filter(u => u.status === 'inactive').length,
      adminUsers: users.filter(u => u.role?.toLowerCase().includes('admin')).length
    };
  }, [users]);

  const handleRefresh = () => {
    fetchUsers();
    toast.success('Data Refreshed');
  };

  return (
    <div className="space-y-6 p-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage users, roles, permissions, and monitor system activity</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleRefresh} disabled={loading}>
             <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
           </Button>
           <Button variant="outline">
             <Download className="h-4 w-4 mr-2" /> Export
           </Button>
           <Button className="bg-blue-600 hover:bg-blue-700 text-white">
             <Plus className="h-4 w-4 mr-2" /> Add User
           </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
              <p className="text-xs text-gray-400">Registered users</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.activeUsers}</h3>
              <p className="text-xs text-gray-400">Currently active</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><UserCheck className="h-6 w-6 text-green-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Blocked Users</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</h3>
              <p className="text-xs text-gray-400">Blocked accounts</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg"><Shield className="h-6 w-6 text-slate-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Roles</p>
              <h3 className="text-2xl font-bold text-purple-600">3</h3>
              <p className="text-xs text-gray-400">System roles</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg"><Crown className="h-6 w-6 text-purple-600"/></div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ FIX: Added Tabs Structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        
        {/* Tab Buttons */}
        <div className="flex items-center justify-center mb-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-3 h-12 bg-white border shadow-sm rounded-full p-1">
                <TabsTrigger value="users" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Users className="h-4 w-4 mr-2"/> All Users
                </TabsTrigger>
                <TabsTrigger value="roles" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Shield className="h-4 w-4 mr-2"/> Roles & Permissions
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <TrendingUp className="h-4 w-4 mr-2"/> Activity Logs
                </TabsTrigger>
            </TabsList>
        </div>

        {/* 1. All Users Tab Content */}
        <TabsContent value="users">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border mb-4">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search users..." className="pl-10"/>
                </div>
                <Button variant="ghost" size="sm"><Filter className="h-4 w-4 mr-2"/> Filter</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Join Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No users found.</TableCell></TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'} 
                                                   className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                        <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost"><Edit className="h-4 w-4 text-blue-500"/></Button>
                                                <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 2. Roles & Permissions Tab Content (Static UI from Screenshot) */}
        <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Client Admin Role */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <Shield className="h-6 w-6 text-purple-600"/>
                            <Badge className="bg-purple-100 text-purple-800">12 permissions</Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">Client Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Society Owner - Full Access</p>
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">View</Badge>
                            <Badge variant="outline">Edit</Badge>
                            <Badge variant="outline">Delete</Badge>
                            <Badge variant="outline">+9 more</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Treasurer Role */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <Shield className="h-6 w-6 text-green-600"/>
                            <Badge className="bg-green-100 text-green-800">5 permissions</Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">Treasurer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Financial Management</p>
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">View</Badge>
                            <Badge variant="outline">Edit</Badge>
                            <Badge variant="outline">+2 more</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Member Role */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <Shield className="h-6 w-6 text-gray-600"/>
                            <Badge className="bg-gray-100 text-gray-800">1 permission</Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">Member</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Read-only Portal Access</p>
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">View</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="mt-8 border-dashed">
                <CardContent className="p-8 text-center text-gray-500">
                    <p className="font-medium">General Permissions & Role Settings</p>
                    <p className="text-sm mt-1">Configure system-wide access policies here.</p>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 3. Activity Logs Tab Content (Placeholder) */}
        <TabsContent value="activity">
            <Card>
                <CardHeader>
                    <CardTitle>System Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>IP Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>System Admin</TableCell>
                                <TableCell>Updated role permissions</TableCell>
                                <TableCell>{new Date().toLocaleDateString()}</TableCell>
                                <TableCell>192.168.1.1</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Treasurer</TableCell>
                                <TableCell>Added new expense entry</TableCell>
                                <TableCell>{new Date().toLocaleDateString()}</TableCell>
                                <TableCell>192.168.1.5</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>

    </div>
  );
}
