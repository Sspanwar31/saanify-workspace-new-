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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [showPassword, setShowPassword] = useState(false); 
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', role: 'member', email: '', phone: '', linked_member_id: '', status: 'active', password: ''
  });

  const [roleConfig, setRoleConfig] = useState<any>(DEFAULT_PERMISSIONS);
  const [isEditingRoles, setIsEditingRoles] = useState(false);

  // 1. Fetch Data with Detailed Debugging
  useEffect(() => {
    const fetchData = async () => {
      console.log("🚀 Starting Data Fetch...");
      setLoading(true);
      const storedUser = localStorage.getItem('current_user');
      let cid = clientId;

      if (!cid && storedUser) {
        const user = JSON.parse(storedUser);
        cid = user.id;
        setClientId(cid);
        console.log("🆔 Client ID resolved from LocalStorage:", cid);
      }

      if (cid) {
        try {
            console.log("📡 Fetching Members...");
            const { data: memberData, error: memError } = await supabase
            .from('members')
            .select('*')
            .eq('client_id', cid)
            .eq('role', 'member');

            if (memError) {
                console.error("❌ Members Fetch Failed:", memError);
            } else {
                console.log(`✅ Members Fetched: ${memberData?.length}`);
            }

            console.log("📡 Fetching Treasurers (from clients table)...");
            const { data: treasurerData, error: trError } = await supabase
            .from('clients') 
            .select('*')
            .eq('client_id', cid)
            .eq('role', 'treasurer');

            if (trError) {
                console.error("❌ Treasurers Fetch Failed (Possible 500 Error Here):", trError);
            } else {
                console.log(`✅ Treasurers Fetched: ${treasurerData?.length}`);
            }

            const treasurers = treasurerData || [];
            const members = memberData || [];
            const userData = [...treasurers, ...members];
            
            setUsers(userData);
            setLedgerMembers(members); 

            console.log("📡 Fetching Activity Logs...");
            const { data: logsData, error: logError } = await supabase.from('activity_logs').select('*').eq('client_id', cid).order('created_at', { ascending: false }).limit(50);
            
            if (logError) console.error("❌ Logs Fetch Failed:", logError);
            if (logsData) setActivityLogs(logsData);

        } catch (err) {
            console.error("💥 Critical Fetch Error:", err);
        }
      } else {
          console.warn("⚠️ No Client ID found, skipping fetch.");
      }
      setLoading(false);
    };
    fetchData();
  }, [clientId]);

  // 2. Load Permissions Effect with Debug
  useEffect(() => {
    if (!clientId) return;

    const loadPermissions = async () => {
      console.log("🔐 Loading Permissions...");
      const { data, error } = await supabase
        .from('clients')
        .select('role_permissions')
        .eq('id', clientId)
        .single();

      if (error) {
          console.error("❌ Permissions Load Failed:", error);
      } else if (data?.role_permissions) {
        console.log("✅ Permissions Loaded:", data.role_permissions);
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
        headers: { 'Content-Type': 'application/json' },
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management (Debug Mode)</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Check console (F12) for error logs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4 mr-2"/> Refresh</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenAdd}><Plus className="h-4 w-4 mr-2"/> Add User</Button>
        </div>
      </div>

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

        {/* 4. Tab Contents */}
        <TabsContent value="all-users" className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="py-4 pl-6 w-[300px]">User Info</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Linked</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-500">Loading users...</TableCell></TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-500">No users found matching filters.</TableCell></TableRow>
                    ) : (
                      filteredUsers.map((user) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
