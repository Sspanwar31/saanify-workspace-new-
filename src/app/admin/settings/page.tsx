'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; 
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, Save, Github, Database, Shield, UserPlus, Trash2, 
  Settings, Globe, Edit, CheckCircle, AlertTriangle, Lock, Radio
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper — dates ko safely ISO mein convert karo
const toISO = (val: string) => val ? new Date(val).toISOString() : '';

// ✅ NEW: Helper — DB se aaye datetime ko datetime-local input ke liye format karo
const formatDateTimeLocal = (value: string | null) => {
  if (!value) return '';

  return new Date(value)
    .toISOString()
    .slice(0, 16);
};

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  
  // Data State
  const [admins, setAdmins] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState('ADMIN'); 
  const [currentEmail, setCurrentEmail] = useState('');

  // Modal State
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isGithubDialogOpen, setIsGithubDialogOpen] = useState(false);
  
  // Forms
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', name: '', role: 'SUPPORT', status: 'ACTIVE' });
  
  // Initial State
  const [formData, setFormData] = useState({
    github_username: '', github_repo: '', github_token: '', github_branch: 'main',
    is_maintenance_mode: false, trial_days: 15, max_users_basic: 25, max_users_pro: 100,
    auto_renewal: true, email_notify: true,
    maintenance_title: '🏦 Saanify Maintenance Mode',
    maintenance_msg: "We're currently upgrading our systems to provide better performance.",
    maintenance_start: '',
    maintenance_end: '',
    is_maintenance_scheduled: false,
  });

  // 1. INITIAL FETCH
  useEffect(() => {
    const init = async () => {
      const email = localStorage.getItem('admin_email');
      if (email) setCurrentEmail(email);
      await Promise.all([fetchSettings(), fetchAdmins()]);
      setLoading(false);
    };
    init();
  }, []);

  // 2. REALTIME SUBSCRIPTION — ✅ FIXED: table name
  useEffect(() => {
    const channel = supabase
      .channel('settings-maintenance-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_settings' },
        (payload: any) => {
          const updated = payload.new;
          if (!updated) return;

          setFormData(prev => ({
            ...prev,
            is_maintenance_mode: updated.is_maintenance_mode ?? prev.is_maintenance_mode,
            is_maintenance_scheduled: updated.is_maintenance_scheduled ?? prev.is_maintenance_scheduled,
            maintenance_title: updated.maintenance_title ?? prev.maintenance_title,
            maintenance_msg: updated.maintenance_msg ?? prev.maintenance_msg,
            maintenance_start: formatDateTimeLocal(updated.maintenance_start),
            maintenance_end: formatDateTimeLocal(updated.maintenance_end),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (currentEmail && admins.length > 0) {
        const me = admins.find(a => a.email === currentEmail);
        if (me) setCurrentUserRole(me.role);
    }
  }, [admins, currentEmail]);

  // ✅ FIXED: fetchSettings with proper date formatting
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');

      if (res.ok) {
        const data = await res.json();

        setFormData(prev => ({
          ...prev,
          ...data,

          maintenance_start: formatDateTimeLocal(
            data.maintenance_start
          ),

          maintenance_end: formatDateTimeLocal(
            data.maintenance_end
          ),
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdmins = async () => {
    const { data } = await supabase.from('admins').select('*').order('created_at');
    if (data) setAdmins(data);
  };

  // =========================================================
  // ✅ NEW: REALTIME MAINTENANCE TOGGLE — Direct & Fast
  // =========================================================
  const handleMaintenanceToggle = async (value: boolean) => {
    if (isReadOnly || togglingMaintenance) return;

    setTogglingMaintenance(true);
    // Optimistic Update: Pehle UI badal do taaki fast lage
    const previousMode = formData.is_maintenance_mode;
    setFormData(prev => ({ ...prev, is_maintenance_mode: value }));

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData, // Pura data bhej rahe hain taaki API crash na ho
          is_maintenance_mode: value,
          // 🚀 CRITICAL FIX: Dates ko null ya valid ISO bhejna zaroori hai
          maintenance_start: formData.maintenance_start ? new Date(formData.maintenance_start).toISOString() : null,
          maintenance_end: formData.maintenance_end ? new Date(formData.maintenance_end).toISOString() : null,
        }),
      });

      // 🚀 Force Refresh taaki maintenance card dikhne lage
      if (res.ok) {
        toast.success(value ? '🚨 Maintenance LIVE' : '✅ System ONLINE');
        window.location.reload(); 
      } else {
        throw new Error("Update Failed");
      }
    } catch (e: any) {
      // Error aane par purana state wapas le aao
      setFormData(prev => ({ ...prev, is_maintenance_mode: previousMode }));
      toast.error("Database connection slow. Try again.");
    } finally {
      setTogglingMaintenance(false);
    }
  };

  // =========================================================
  // SCHEDULED BANNER TOGGLE — Fixed payload
  // =========================================================
  const handleScheduledToggle = async (value: boolean) => {
    if (isReadOnly) return;

    setFormData(prev => ({ ...prev, is_maintenance_scheduled: value }));

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // FIX: Same date conversion
        body: JSON.stringify({
          ...formData,
          is_maintenance_scheduled: value,
          maintenance_start: toISO(formData.maintenance_start),
          maintenance_end: toISO(formData.maintenance_end),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server Error (${res.status})`);
      }

      toast.success(value ? 'Scheduled Banner ON' : 'Scheduled Banner OFF');
    } catch (e: any) {
      setFormData(prev => ({ ...prev, is_maintenance_scheduled: !value }));
      toast.error(e.message || 'Failed');
    }
  };

  // ✅ FIXED: handleSave with proper headers and error handling
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        maintenance_start: toISO(formData.maintenance_start),
        maintenance_end: toISO(formData.maintenance_end),
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error);
      }

      toast.success("Settings Saved!");
      setIsGithubDialogOpen(false);
    } catch (e: any) { 
      toast.error(e.message || "Failed to save"); 
    } 
    finally { setSaving(false); }
  };

  const handleSaveAdmin = async () => {
    if (!adminForm.email || (!editingId && !adminForm.password)) {
      return toast.error("Required fields missing");
    }
    setSaving(true); 
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ ...adminForm, userId: editingId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Operation failed");
      toast.success(editingId ? "Admin Updated" : "Admin Created");
      setIsAdminDialogOpen(false);
      fetchAdmins();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setAdminForm({ email: '', password: '', name: '', role: 'SUPPORT', status: 'ACTIVE' });
    setIsAdminDialogOpen(true);
  };

  const openEditModal = (admin: any) => {
    setEditingId(admin.id);
    setAdminForm({ email: admin.email, password: '', name: admin.name, role: admin.role, status: admin.status });
    setIsAdminDialogOpen(true);
  };

  const handleDeleteAdmin = async (email: string) => {
    if (confirm("Delete this admin?")) {
        await supabase.from('admins').delete().eq('email', email);
        fetchAdmins();
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/admin/github-backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backup Failed');
      toast.success("Backup Successful!");
    } catch (e: any) { toast.error(e.message); }
    finally { setBackupLoading(false); }
  };

  const isReadOnly = currentUserRole === 'SUPPORT';

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            System Settings
            {isReadOnly && <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800"><Lock className="w-3 h-3 mr-1"/> View Only</Badge>}
          </h1>
          <p className="text-slate-500">Configure core preferences & security</p>
        </div>
        {!isReadOnly && (
            <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white shadow-lg hover:bg-slate-800">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
            Save Changes
            </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: ADMIN MANAGEMENT */}
        <Card className="flex flex-col shadow-sm border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 py-4 px-6">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-lg font-bold">
              <Shield className="w-5 h-5"/> Admin Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[350px] p-4 space-y-3">
                {admins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {admin.name?.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-slate-900">{admin.name}</p>
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${admin.status==='ACTIVE'?'bg-green-50 text-green-700 border-green-200':'text-slate-500'}`}>
                                {admin.status || 'ACTIVE'}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{admin.email} • <span className="uppercase">{admin.role}</span></p>
                    </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {!isReadOnly && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEditModal(admin)}>
                                <Edit className="w-4 h-4"/>
                            </Button>
                        )}
                        {!isReadOnly && admin.email !== 'admin@saanify.com' && admin.email !== currentEmail && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDeleteAdmin(admin.email)}>
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                        )}
                    </div>
                </div>
                ))}
            </div>
            {!isReadOnly && (
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <Button onClick={openAddModal} variant="outline" className="w-full border-dashed border-2 border-slate-300 hover:bg-slate-100 text-slate-600">
                        <UserPlus className="w-4 h-4 mr-2"/> Add New Admin
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT: BACKUP CENTER */}
        <Card className="flex flex-col shadow-sm border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-4 px-6">
             <CardTitle className="flex items-center gap-2 text-purple-700 text-lg font-bold">
                <Database className="w-5 h-5"/> Backup Center
             </CardTitle>
             <Dialog open={isGithubDialogOpen} onOpenChange={setIsGithubDialogOpen}>
               <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                    <Settings className="w-4 h-4"/>
                 </Button>
               </DialogTrigger>
               <DialogContent>
                 <DialogHeader><DialogTitle>GitHub Configuration</DialogTitle><DialogDescription>Secure storage settings</DialogDescription></DialogHeader>
                 <div className="space-y-3 py-2">
                    <div className="grid gap-2"><Label>User</Label><Input value={formData.github_username} onChange={e => setFormData({...formData, github_username: e.target.value})} /></div>
                    <div className="grid gap-2"><Label>Repo</Label><Input value={formData.github_repo} onChange={e => setFormData({...formData, github_repo: e.target.value})} /></div>
                    <div className="grid gap-2"><Label>Token</Label><Input type="password" value={formData.github_token} onChange={e => setFormData({...formData, github_token: e.target.value})} /></div>
                    <div className="grid gap-2"><Label>Branch</Label><Input value={formData.github_branch} onChange={e => setFormData({...formData, github_branch: e.target.value})} placeholder="main" /></div>
                    <Button onClick={handleSave} className="w-full mt-2">Save Config</Button>
                 </div>
               </DialogContent>
             </Dialog>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-10">
             <div className="relative group">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center shadow-xl">
                   <Github className="w-10 h-10 text-white"/>
                </div>
                <div className={`absolute bottom-0 right-0 w-5 h-5 border-2 border-white rounded-full ${formData.github_repo ? 'bg-green-500' : 'bg-red-500'}`}></div>
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-900">System Secured</h3>
                <div className="flex items-center justify-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit mx-auto mt-1">
                    <CheckCircle className="w-3 h-3"/> <span>{formData.github_repo ? 'Connected' : 'Not Configured'}</span>
                </div>
             </div>
             <div className="flex gap-3 w-full max-w-xs pt-4">
                <Button onClick={handleBackup} disabled={backupLoading || isReadOnly} className="flex-1 bg-purple-600 hover:bg-purple-700 h-10 shadow-lg">
                   {backupLoading ? <Loader2 className="mr-2 w-4 w-4 animate-spin"/> : 'Backup Now'}
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* GLOBAL CONFIG */}
      <Card className="shadow-sm border-slate-200 border-t-4 border-t-orange-500">
        <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-orange-600 text-lg font-bold">
                <Globe className="w-5 h-5"/> Global Configuration
            </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
           <div className="space-y-1"><Label className="text-xs">Trial Days</Label><Input disabled={isReadOnly} type="number" className="h-9" value={formData.trial_days} onChange={e => setFormData({...formData, trial_days: parseInt(e.target.value)})}/></div>
           <div className="space-y-1"><Label className="text-xs">Basic Users</Label><Input disabled={isReadOnly} type="number" className="h-9" value={formData.max_users_basic} onChange={e => setFormData({...formData, max_users_basic: parseInt(e.target.value)})}/></div>
           <div className="space-y-1"><Label className="text-xs">Pro Users</Label><Input disabled={isReadOnly} type="number" className="h-9" value={formData.max_users_pro} onChange={e => setFormData({...formData, max_users_pro: parseInt(e.target.value)})}/></div>
           <div className="flex items-center justify-between p-3 border rounded-lg md:col-span-1">
              <Label className="text-sm">Auto-Renewal</Label>
              <Switch disabled={isReadOnly} checked={formData.auto_renewal} onCheckedChange={v => setFormData({...formData, auto_renewal: v})}/>
           </div>
           <div className="flex items-center justify-between p-3 border rounded-lg md:col-span-1">
              <Label className="text-sm">Email Alerts</Label>
              <Switch disabled={isReadOnly} checked={formData.email_notify} onCheckedChange={v => setFormData({...formData, email_notify: v})}/>
           </div>
           
           {/* REALTIME MAINTENANCE SWITCH */}
           <div className={`flex items-center justify-between p-3 rounded-lg md:col-span-1 transition-colors duration-300 ${formData.is_maintenance_mode ? 'bg-red-50 border-2 border-red-400' : 'bg-red-50/50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-red-700 font-bold">Maintenance</Label>
                {formData.is_maintenance_mode && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                    <Radio className="w-3 h-3 animate-pulse"/> LIVE
                  </span>
                )}
              </div>
              <Switch 
                disabled={isReadOnly || togglingMaintenance} 
                checked={formData.is_maintenance_mode} 
                onCheckedChange={handleMaintenanceToggle}
              />
           </div>
        </CardContent>
      </Card>

      {/* MAINTENANCE CONTROL CENTER */}
      <Card className={`border-t-4 transition-colors duration-300 ${formData.is_maintenance_mode ? 'border-t-red-600 bg-red-50/30' : 'border-t-red-300'}`}>
        <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${formData.is_maintenance_mode ? 'text-red-600' : 'text-red-700'}`}>
                <AlertTriangle className={`w-5 h-5 ${formData.is_maintenance_mode ? 'animate-pulse' : ''}`}/> 
                Maintenance Control Center
                {formData.is_maintenance_mode && (
                  <Badge className="bg-red-600 text-white text-[10px] ml-2">⚠ ACTIVE NOW</Badge>
                )}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Alert Title</Label>
                    <Input disabled={isReadOnly} value={formData.maintenance_title} onChange={e => setFormData({...formData, maintenance_title: e.target.value})} />
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                    <Label>Schedule Notice</Label>
                    <div className="flex items-center space-x-2">
                        <Switch disabled={isReadOnly} checked={formData.is_maintenance_scheduled} onCheckedChange={handleScheduledToggle} />
                        <span className="text-xs text-gray-500">Enable banner</span>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Textarea disabled={isReadOnly} value={formData.maintenance_msg} onChange={e => setFormData({...formData, maintenance_msg: e.target.value})} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Start Date & Time</Label>
                    <Input disabled={isReadOnly} type="datetime-local" value={formData.maintenance_start} onChange={e => setFormData({...formData, maintenance_start: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>End Date & Time</Label>
                    <Input disabled={isReadOnly} type="datetime-local" value={formData.maintenance_end} onChange={e => setFormData({...formData, maintenance_end: e.target.value})} />
                </div>
            </div>
        </CardContent>
      </Card>

      {/* ADMIN DIALOG */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>{editingId ? 'Edit Admin' : 'Add New Admin'}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
               <Input placeholder="Full Name" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} />
               <Input placeholder="Email Address" value={adminForm.email} disabled={!!editingId} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
               <Input type="password" placeholder={editingId ? "Reset Password" : "Password"} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                 <Select value={adminForm.role} onValueChange={v => setAdminForm({...adminForm, role: v})}>
                    <SelectTrigger><SelectValue placeholder="Role"/></SelectTrigger>
                    <SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="SUPPORT">Support</SelectItem></SelectContent>
                 </Select>
                 <Select value={adminForm.status} onValueChange={v => setAdminForm({...adminForm, status: v})}>
                    <SelectTrigger><SelectValue placeholder="Status"/></SelectTrigger>
                    <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
                 </Select>
               </div>
               <Button onClick={handleSaveAdmin} className="w-full mt-2">{editingId ? 'Update' : 'Create'}</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
