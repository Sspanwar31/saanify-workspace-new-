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
  Settings, RefreshCw, Globe, Edit, CheckCircle, AlertTriangle, Lock, Sparkles 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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

  // Broadcast Form State (With all new fields)
  const [broadcastForm, setBroadcastForm] = useState({
    title: '', message: '', image_url: '', 
    type: 'FESTIVAL', style: 'POPUP', starts_at: '', ends_at: '',
    target_audience: 'BOTH', animation_type: 'NONE',
    // New Fields Added
    festival_key: '',
    priority: 'MEDIUM',
    display_mode: 'TOP_BANNER',
    theme_color: 'DEFAULT',
    cta_text: '',
    cta_link: '',
    is_recurring: false,
    recurring_type: 'NONE'
  });

  // Broadcast List State
  const [activeBroadcasts, setActiveBroadcasts] = useState<any[]>([]);

  // 1. INITIAL FETCH
  useEffect(() => {
    const init = async () => {
      const email = localStorage.getItem('admin_email');
      if (email) setCurrentEmail(email);
      await Promise.all([fetchSettings(), fetchAdmins(), fetchBroadcasts()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (currentEmail && admins.length > 0) {
        const me = admins.find(a => a.email === currentEmail);
        if (me) setCurrentUserRole(me.role);
    }
  }, [admins, currentEmail]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, ...data }));
      }
    } catch(e) { console.error(e); }
  };

  const fetchAdmins = async () => {
    const { data } = await supabase.from('admins').select('*').order('created_at');
    if (data) setAdmins(data);
  };

  const fetchBroadcasts = async () => {
    const res = await fetch('/api/admin/broadcasts');
    const data = await res.json();
    if (Array.isArray(data)) setActiveBroadcasts(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `broadcast-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('broadcasts')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('broadcasts').getPublicUrl(filePath);
        setBroadcastForm({ ...broadcastForm, image_url: data.publicUrl });
        toast.success("Image Uploaded Successfully!");
    } catch (error) {
        toast.error("Upload failed");
    } finally {
        setIsUploading(false);
    }
  };

  // AI Suggest Logic
  const handleAISuggest = () => {
    const title = broadcastForm.title.toLowerCase();
    let detected = null;
    
    if (title.includes('diwali')) detected = { type: 'FESTIVAL', key: 'DIWALI', anim: 'DIYA', color: 'GOLD' };
    else if (title.includes('holi')) detected = { type: 'FESTIVAL', key: 'HOLI', anim: 'HOLI', color: 'RED' };
    else if (title.includes('navratri')) detected = { type: 'FESTIVAL', key: 'NAVRATRI', anim: 'GARBA', color: 'ORANGE' };
    else if (title.includes('ganesh')) detected = { type: 'FESTIVAL', key: 'GANESH_CHATURTHI', anim: 'FLOWERS', color: 'RED' };
    else if (title.includes('janmashtami')) detected = { type: 'FESTIVAL', key: 'JANMASHTAMI', anim: 'MOON', color: 'BLUE' };
    else if (title.includes('raksha')) detected = { type: 'FESTIVAL', key: 'RAKSHA_BANDHAN', anim: 'SPARKLES', color: 'PURPLE' };
    else if (title.includes('dussehra')) detected = { type: 'FESTIVAL', key: 'DUSSEHRA', anim: 'FIREWORKS', color: 'ORANGE' };
    else if (title.includes('eid')) detected = { type: 'FESTIVAL', key: 'EID_AL_FITR', anim: 'MOON', color: 'GREEN' };
    else if (title.includes('christmas')) detected = { type: 'FESTIVAL', key: 'CHRISTMAS', anim: 'SNOW', color: 'RED' };
    else if (title.includes('new year')) detected = { type: 'EVENT', key: 'NEW_YEAR', anim: 'CONFETTI', color: 'GOLD' };
    else if (title.includes('republic') || title.includes('independence')) detected = { type: 'EVENT', key: 'REPUBLIC_DAY', anim: 'TRICOLOR', color: 'ORANGE' };
    else detected = { type: 'UPDATE', key: '', anim: 'CONFETTI', color: 'BLUE' };

    setBroadcastForm({
      ...broadcastForm, 
      animation_type: detected.anim, 
      type: detected.type,
      festival_key: detected.key,
      theme_color: detected.color
    });
    
    toast.info(`AI: ${detected.key || 'Generic'} theme detected.`);
  };

  // Festival Presets Handler (UPDATED WITH SOLID LIBRARY)
  const applyPreset = (key: string) => {
    // Master Library for Professional Content
    const library: any = {
      DIWALI: {
        title: "Shubh Deepawali! 🪔",
        msg: "Saanify Pariwar ki taraf se aapko aur aapke parivar ko Diwali ki hardik shubhkamnayein! | Saanify Pariwar wishes you a year full of light, joy and prosperity.",
        img: "https://images.unsplash.com/photo-1573148164257-8a3064436573?q=80&w=1200", // Fixed High-Res Diwali Image
        anim: "DIYA", color: "GOLD"
      },
      HOLI: {
        title: "Happy Holi! 🎨",
        msg: "Saanify Pariwar ki taraf se aapko rangon bhari Holi ki shubhkamnayein! | May your life be as colorful and joyful as the festival of Holi.",
        img: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=1200",
        anim: "HOLI", color: "RED"
      },
      NEW_YEAR: {
        title: "Happy New Year! 🎆",
        msg: "Naya Saal, Nayi Shuruat! Saanify Pariwar ki taraf se aapko naye saal ki mubarakbaad. | Wishing you 365 days of success and happiness in the New Year.",
        img: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=1200",
        anim: "FIREWORKS", color: "GOLD"
      }
    };

    if (library[key]) {
      const data = library[key];
      setBroadcastForm({
        ...broadcastForm,
        title: data.title,
        message: data.msg,
        image_url: data.img,
        animation_type: data.anim,
        theme_color: data.color,
        festival_key: key,
        display_mode: 'POPUP' // Default Modern Popup
      });
      toast.success(`${key} settings applied with professional branding!`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        maintenance_start: formData.maintenance_start ? new Date(formData.maintenance_start).toISOString() : '',
        maintenance_end: formData.maintenance_end ? new Date(formData.maintenance_end).toISOString() : '',
      };

      await fetch('/api/admin/settings', { method: 'POST', body: JSON.stringify(payload) });
      toast.success("Settings Saved!");
      setIsGithubDialogOpen(false);
    } catch (e) { toast.error("Failed"); } 
    finally { setSaving(false); }
  };

  // Priority Mapping Object
  const priorityMap: any = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
  };

  const handlePublishBroadcast = async () => {
    if(!broadcastForm.title || !broadcastForm.message) {
      return toast.error("Required fields!");
    }

    const res = await fetch('/api/admin/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...broadcastForm,
        priority: priorityMap[broadcastForm.priority]
      })
    });

    if (res.ok) {
      toast.success("Broadcast Published!");
      fetchBroadcasts();

      setBroadcastForm({
        title:'',
        message:'',
        image_url:'',
        type:'FESTIVAL',
        style:'POPUP',
        starts_at:'',
        ends_at:'',
        target_audience: 'BOTH',
        animation_type: 'NONE',
        festival_key: '',
        priority: 'MEDIUM',
        display_mode: 'TOP_BANNER',
        theme_color: 'DEFAULT',
        cta_text: '',
        cta_link: '',
        is_recurring: false,
        recurring_type: 'NONE'
      });

    } else {
      toast.error("Publish failed");
    }
  };

  const toggleBroadcast = async (id: string, currentStatus: boolean) => {
    const res = await fetch('/api/admin/broadcasts', {
      method: 'PATCH',
      body: JSON.stringify({ id, is_active: !currentStatus })
    });
    if (res.ok) fetchBroadcasts();
  };

  const handleDeleteBroadcast = async (id: string) => {
    if(confirm("Delete?")) {
      const res = await fetch(`/api/admin/broadcasts?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchBroadcasts();
    }
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
                   {backupLoading ? <Loader2 className="mr-2 w-4 h-4 animate-spin"/> : 'Backup Now'}
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
           <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg md:col-span-1">
              <Label className="text-sm text-red-700 font-bold">Maintenance</Label>
              <Switch disabled={isReadOnly} checked={formData.is_maintenance_mode} onCheckedChange={v => setFormData({...formData, is_maintenance_mode: v})}/>
           </div>
        </CardContent>
      </Card>

      {/* MAINTENANCE CONTROL CENTER */}
      <Card className="border-t-4 border-t-red-600">
        <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5"/> Maintenance Control Center
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
                        <Switch disabled={isReadOnly} checked={formData.is_maintenance_scheduled} onCheckedChange={v => setFormData({...formData, is_maintenance_scheduled: v})} />
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

      {/* PROFESSIONAL BROADCASTER */}
      <Card className="border-t-4 border-t-blue-600">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-blue-700 flex items-center gap-2 text-lg font-bold">
            <Globe className="w-5 h-5"/> Professional Broadcaster
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchBroadcasts} className="rounded-full">
             <RefreshCw className="w-4 h-4 text-slate-400" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border">
            
            {/* Title + AI */}
            <div className="space-y-2 lg:col-span-2">
                <Label>Alert Title <span className="text-blue-500 text-[10px]">(AI Enabled)</span></Label>
                <div className="flex gap-2">
                    <Input 
                        disabled={isReadOnly}
                        value={broadcastForm.title} 
                        onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} 
                        onBlur={handleAISuggest} 
                        placeholder="Happy Diwali!" 
                    />
                    <Button variant="outline" onClick={handleAISuggest} title="AI Auto-Detect" disabled={isReadOnly}><Sparkles className="w-4 h-4"/></Button>
                </div>
            </div>

            {/* Broadcast Type */}
            <div className="space-y-2">
                <Label>Broadcast Type</Label>
                <Select disabled={isReadOnly} value={broadcastForm.type} onValueChange={v => setBroadcastForm({...broadcastForm, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="FESTIVAL">Festival</SelectItem>
                        <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                        <SelectItem value="UPDATE">System Update</SelectItem>
                        <SelectItem value="OFFER">Special Offer</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                        <SelectItem value="EVENT">Event</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select disabled={isReadOnly} value={broadcastForm.target_audience} onValueChange={v => setBroadcastForm({...broadcastForm, target_audience: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="BOTH">Everyone</SelectItem>
                        <SelectItem value="CLIENT">Clients Only</SelectItem>
                        <SelectItem value="MEMBER">Members Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Festival Preset Library (Point 13 & 4) */}
            <div className="space-y-2">
                <Label>Festival Preset Library</Label>
                <div className="flex gap-2">
                   <Select disabled={isReadOnly} value={broadcastForm.festival_key} onValueChange={v => setBroadcastForm({...broadcastForm, festival_key: v})}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select Festival..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DIWALI">Diwali</SelectItem>
                            <SelectItem value="HOLI">Holi</SelectItem>
                            <SelectItem value="NAVRATRI">Navratri</SelectItem>
                            <SelectItem value="DUSSEHRA">Dussehra</SelectItem>
                            <SelectItem value="GANESH_CHATURTHI">Ganesh Chaturthi</SelectItem>
                            <SelectItem value="JANMASHTAMI">Janmashtami</SelectItem>
                            <SelectItem value="RAKSHA_BANDHAN">Raksha Bandhan</SelectItem>
                            <SelectItem value="MAKAR_SANKRANTI">Makar Sankranti</SelectItem>
                            <SelectItem value="LOHRI">Lohri</SelectItem>
                            <SelectItem value="MAHASHIVRATRI">Maha Shivratri</SelectItem>
                            <SelectItem value="RAM_NAVAMI">Ram Navami</SelectItem>
                            <SelectItem value="HANUMAN_JAYANTI">Hanuman Jayanti</SelectItem>
                            <SelectItem value="KARWA_CHAUTH">Karwa Chauth</SelectItem>
                            <SelectItem value="CHHATH_PUJA">Chhath Puja</SelectItem>
                            <SelectItem value="GURU_PURNIMA">Guru Purnima</SelectItem>
                            <SelectItem value="ONAM">Onam</SelectItem>
                            <SelectItem value="PONGAL">Pongal</SelectItem>
                            <SelectItem value="UGADI">Ugadi</SelectItem>
                            <SelectItem value="BAISAKHI">Baisakhi</SelectItem>
                            <SelectItem value="EID_AL_FITR">Eid al-Fitr</SelectItem>
                            <SelectItem value="EID_AL_ADHA">Eid al-Adha</SelectItem>
                            <SelectItem value="CHRISTMAS">Christmas</SelectItem>
                            <SelectItem value="NEW_YEAR">New Year</SelectItem>
                            <SelectItem value="REPUBLIC_DAY">Republic Day</SelectItem>
                            <SelectItem value="INDEPENDENCE_DAY">Independence Day</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="secondary" size="icon" onClick={() => applyPreset(broadcastForm.festival_key)} title="Auto Fill Settings" disabled={isReadOnly || !broadcastForm.festival_key}><RefreshCw className="w-4 h-4"/></Button>
                </div>
            </div>

            {/* Priority Select (Point 6) */}
            <div className="space-y-2">
                <Label>Priority</Label>
                <Select disabled={isReadOnly} value={broadcastForm.priority} onValueChange={v => setBroadcastForm({...broadcastForm, priority: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                </Select>
            </div>

             {/* Display Mode (Point 7) */}
             <div className="space-y-2">
                <Label>Display Mode</Label>
                <Select disabled={isReadOnly} value={broadcastForm.display_mode} onValueChange={v => setBroadcastForm({...broadcastForm, display_mode: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TOP_BANNER">Top Banner</SelectItem>
                        <SelectItem value="BOTTOM_BANNER">Bottom Banner</SelectItem>
                        <SelectItem value="POPUP">Center Popup</SelectItem>
                        <SelectItem value="FULLSCREEN">Fullscreen</SelectItem>
                        <SelectItem value="MARQUEE">Marquee</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Theme Color (Point 8) */}
            <div className="space-y-2">
                <Label>Theme Color</Label>
                <Select disabled={isReadOnly} value={broadcastForm.theme_color} onValueChange={v => setBroadcastForm({...broadcastForm, theme_color: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DEFAULT">Default</SelectItem>
                        <SelectItem value="RED">Red</SelectItem>
                        <SelectItem value="GREEN">Green</SelectItem>
                        <SelectItem value="BLUE">Blue</SelectItem>
                        <SelectItem value="PURPLE">Purple</SelectItem>
                        <SelectItem value="ORANGE">Orange</SelectItem>
                        <SelectItem value="GOLD">Gold</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Animation Select (Point 3) */}
            <div className="space-y-2">
                <Label>Animation Style</Label>
                <Select disabled={isReadOnly} value={broadcastForm.animation_type} onValueChange={v => setBroadcastForm({...broadcastForm, animation_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="DIYA">Diyas</SelectItem>
                        <SelectItem value="HOLI">Colors</SelectItem>
                        <SelectItem value="GARBA">Garba Lights</SelectItem>
                        <SelectItem value="FIREWORKS">Fireworks</SelectItem>
                        <SelectItem value="MOON">Moon</SelectItem>
                        <SelectItem value="SNOW">Snow</SelectItem>
                        <SelectItem value="FLOWERS">Flowers</SelectItem>
                        <SelectItem value="CONFETTI">Confetti</SelectItem>
                        <SelectItem value="SPARKLES">Sparkles</SelectItem>
                        <SelectItem value="TRICOLOR">Tricolor</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2 lg:col-span-3">
                <Label>Upload Image</Label>
                <div className="flex items-center gap-2">
                    <Input disabled={isReadOnly || isUploading} type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin"/>}
                </div>
                {broadcastForm.image_url && <p className="text-[10px] text-green-600 truncate">{broadcastForm.image_url}</p>}
            </div>

            {/* Message Content */}
            <div className="md:col-span-3 space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Message Content</Label>
              <Textarea 
                disabled={isReadOnly}
                value={broadcastForm.message} 
                onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} 
                placeholder="Type your message here..." 
              />
            </div>

            {/* CTA Button Support (Point 9) */}
            <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input disabled={isReadOnly} value={broadcastForm.cta_text} onChange={e => setBroadcastForm({...broadcastForm, cta_text: e.target.value})} placeholder="Learn More" />
            </div>
            <div className="space-y-2">
                <Label>CTA Button Link</Label>
                <Input disabled={isReadOnly} value={broadcastForm.cta_link} onChange={e => setBroadcastForm({...broadcastForm, cta_link: e.target.value})} placeholder="https://..." />
            </div>

            {/* Start Date (Point 10) */}
            <div className="space-y-2">
                <Label>Start Date</Label>
                <Input disabled={isReadOnly} type="datetime-local" value={broadcastForm.starts_at} onChange={e => setBroadcastForm({...broadcastForm, starts_at: e.target.value})} />
            </div>

            {/* Expires At */}
            <div className="space-y-2">
                <Label>Expires At</Label>
                <Input disabled={isReadOnly} type="datetime-local" value={broadcastForm.ends_at} onChange={e => setBroadcastForm({...broadcastForm, ends_at: e.target.value})} />
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label className="text-sm">Recurring Event</Label>
                <Switch disabled={isReadOnly} checked={broadcastForm.is_recurring} onCheckedChange={v => setBroadcastForm({...broadcastForm, is_recurring: v})}/>
            </div>

            <Button disabled={isReadOnly} onClick={handlePublishBroadcast} className="md:col-span-3 bg-blue-600 hover:bg-blue-700 shadow-lg w-full">
               Publish Broadcast Live
            </Button>
          </div>

          {/* LIST SECTION (Point 11) */}
          {!isReadOnly && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
               <h4 className="text-sm font-bold text-slate-800">Active Broadcasts</h4>
               {activeBroadcasts.length === 0 ? (
                 <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-xl">No broadcasts created yet.</div>
               ) : (
                 <div className="grid gap-3">
                   {activeBroadcasts.map((b) => (
                     <div key={b.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-all gap-4">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${b.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                              <Globe className="w-5 h-5" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-slate-900 truncate">{b.title}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-500">
                                  <span className="font-semibold text-slate-700">{b.festival_key || 'Custom'}</span>
                                  <span>• Priority: {b.priority}</span>
                                  <span>• {b.target_audience}</span>
                                  <span>• {b.animation_type}</span>
                                  <span>• Exp: {new Date(b.ends_at).toLocaleDateString()}</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0">
                           <div className="flex items-center gap-2">
                              <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px]">
                                 {b.is_active ? 'ACTIVE' : 'OFFLINE'}
                              </Badge>
                              <Switch 
                                checked={b.is_active} 
                                onCheckedChange={() => toggleBroadcast(b.id, b.is_active)}
                              />
                           </div>
                           <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 h-8 w-8" onClick={() => handleDeleteBroadcast(b.id)}>
                              <Trash2 className="w-4 h-4"/>
                           </Button>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
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
