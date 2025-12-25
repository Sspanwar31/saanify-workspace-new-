'use client';

import { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, AlertCircle, CheckCircle, Clock, Mail, 
  Bell, Server, Activity, PauseCircle, PlayCircle, Database, Lock, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Static Config to maintain UI structure (Icons & Descriptions)
const SYSTEM_TASKS_CONFIG = [
  { id: 'init_db', name: 'Database Initialization', description: 'Create/Repair Supabase Tables (Run Once)', schedule: 'One-time', icon: Database },
  { id: 'schema_sync', name: 'Schema Sync', description: 'Sync database schema changes', schedule: '0 */6 * * *', icon: Server },
  { id: 'backup', name: 'Database Backup', description: 'Secure backup to Supabase/GitHub', schedule: 'Manual', icon: Server },
  { id: 'restore', name: 'Database Restore', description: 'Restore from backup files', schedule: 'Manual', icon: RotateCcw },
  { id: 'auto_sync', name: 'Auto Data Sync', description: 'Scheduled client data synchronization', schedule: '0 */2 * * *', icon: Server },
  { id: 'health', name: 'System Health', description: 'Monitor connectivity & latency', schedule: '*/5 * * * *', icon: Activity },
];

const COMM_RULES_CONFIG = [
  // Emails
  { id: 'email_welcome', name: 'Welcome Email', type: 'EMAIL' },
  { id: 'email_expiry', name: 'Trial Expiry Warning', type: 'EMAIL' },
  { id: 'email_fail', name: 'Payment Failed Alert', type: 'EMAIL' },
  { id: 'email_renew', name: 'Renewal Reminder', type: 'EMAIL' },
  // Push
  { id: 'push_signup', name: 'New Client Signup', type: 'PUSH' },
  { id: 'push_renew', name: 'Subscription Renewed', type: 'PUSH' },
  { id: 'push_fail', name: 'Payment Failed', type: 'PUSH' },
  { id: 'push_maint', name: 'System Maintenance', type: 'PUSH' },
];

export default function AutomationPage() {
  const [loading, setLoading] = useState(true);
  const [systemTasks, setSystemTasks] = useState<any[]>([]);
  const [commRules, setCommRules] = useState<any[]>([]);
  const [role, setRole] = useState('ADMIN');
  const [runningId, setRunningId] = useState<string | null>(null);

  // 1. Fetch Data & Role
  useEffect(() => {
    const init = async () => {
      // Get Role
      const email = localStorage.getItem('admin_email');
      if (email) {
         const { data } = await supabase.from('admins').select('role').eq('email', email).single();
         if (data) setRole(data.role);
      }

      // Get Task Statuses from DB
      try {
        const res = await fetch('/api/admin/automation');
        const dbData = res.ok ? await res.json() : [];
        
        // Merge DB data with Static Config to preserve UI
        const mergedTasks = SYSTEM_TASKS_CONFIG.map(conf => {
            const dbItem = dbData.find((d: any) => d.task_key === conf.id);
            return {
                ...conf,
                lastRunStatus: dbItem?.status || 'PENDING',
                lastRunTime: dbItem?.last_run ? new Date(dbItem.last_run).toLocaleTimeString() : 'Never'
            };
        });
        setSystemTasks(mergedTasks);

        const mergedRules = COMM_RULES_CONFIG.map(conf => {
            const dbItem = dbData.find((d: any) => d.task_key === conf.id);
            return {
                ...conf,
                status: dbItem?.status || 'ACTIVE',
                stats: dbItem?.meta || { sent: 0, pending: 0, lastSent: 'Never' }
            };
        });
        setCommRules(mergedRules);

      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  // 2. Handle Actions
  const handleRun = async (id: string) => {
    if (role === 'SUPPORT') return toast.error("Restricted Action");
    
    setRunningId(id);
    toast.info("Task Triggered...");
    
    try {
        let endpoint = '/api/admin/automation';
        if (id === 'init_db') endpoint = '/api/admin/setup-db';
        if (id === 'backup') endpoint = '/api/admin/github-backup';

        const res = await fetch(endpoint, { 
            method: 'POST', 
            body: JSON.stringify({ task_key: id }) 
        });

        if (!res.ok) throw new Error("Failed");
        
        toast.success("Task Completed Successfully");
        
        // Update UI state locally to show immediate feedback
        setSystemTasks(prev => prev.map(t => t.id === id ? { ...t, lastRunStatus: 'SUCCESS', lastRunTime: 'Just now' } : t));

    } catch (e) { 
        toast.error("Task Failed"); 
        setSystemTasks(prev => prev.map(t => t.id === id ? { ...t, lastRunStatus: 'FAILED' } : t));
    } finally {
        setRunningId(null);
    }
  };

  const toggleCommRule = async (id: string) => {
      if (role === 'SUPPORT') return toast.error("Restricted Action");
      
      const rule = commRules.find(r => r.id === id);
      const newStatus = rule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      
      // Optimistic Update
      setCommRules(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      
      // API Call (Mock for toggle logic, in real app update DB)
      // await fetch('/api/admin/automation/toggle', ...)
      toast.success(`${rule.name} is now ${newStatus}`);
  };

  const isRestricted = role === 'SUPPORT';

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Automation Center</h1>
           <p className="text-gray-500">Manage cron jobs, backups, and communication workflows</p>
        </div>
        {isRestricted && <Badge variant="destructive"><Lock className="w-3 h-3 mr-1"/> View Only Mode</Badge>}
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="system">System Tasks</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        {/* TAB 1: SYSTEM TASKS */}
        <TabsContent value="system" className="space-y-4">
           <div className="grid gap-4">
              {systemTasks.map(task => (
                <Card key={task.id} className={`shadow-sm border-l-4 ${task.id === 'init_db' ? 'border-l-purple-500 bg-purple-50/30' : 'border-l-blue-500'}`}>
                   <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${task.id === 'init_db' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                            <task.icon className="h-6 w-6"/>
                         </div>
                         <div>
                            <h3 className="font-bold text-lg text-slate-800">{task.name}</h3>
                            <p className="text-sm text-gray-500">{task.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                               <Badge variant="outline" className="font-mono text-xs"><Clock className="w-3 h-3 mr-1"/> {task.schedule}</Badge>
                               <span className="text-xs text-gray-400">Last Run: {task.lastRunTime}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                         <Badge className={
                            task.lastRunStatus === 'SUCCESS' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                            task.lastRunStatus === 'FAILED' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                            'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                         }>
                            {task.lastRunStatus}
                         </Badge>
                         <Button size="sm" variant="outline" onClick={() => handleRun(task.id)} disabled={runningId === task.id || isRestricted}>
                            {runningId === task.id ? <Loader2 className="w-3 h-3 mr-2 animate-spin"/> : <Play className="w-3 h-3 mr-2"/>} 
                            Run Now
                         </Button>
                      </div>
                   </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        {/* TAB 2: COMMUNICATIONS */}
        <TabsContent value="communication" className="space-y-8">
           
           {/* Email Automation */}
           <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Mail className="w-5 h-5"/> Email Workflows</h3>
              <div className="grid md:grid-cols-2 gap-4">
                 {commRules.filter((r: any) => r.type === 'EMAIL').map((rule: any) => (
                    <Card key={rule.id}>
                       <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="font-bold text-slate-800">{rule.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                   Sent: <span className="font-bold text-green-600">{rule.stats.sent || 0}</span> | 
                                   Pending: <span className="font-bold text-orange-600">{rule.stats.pending || 0}</span>
                                </p>
                             </div>
                             <Switch disabled={isRestricted} checked={rule.status === 'ACTIVE'} onCheckedChange={() => toggleCommRule(rule.id)} />
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant="secondary" className={rule.status === 'ACTIVE' ? "text-green-600 bg-green-50" : "text-gray-500"}>
                                {rule.status}
                             </Badge>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           </div>

           {/* Push Notifications */}
           <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Bell className="w-5 h-5"/> Push Notifications</h3>
              <div className="grid md:grid-cols-2 gap-4">
                 {commRules.filter((r: any) => r.type === 'PUSH').map((rule: any) => (
                    <Card key={rule.id}>
                       <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="font-bold text-slate-800">{rule.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Last: {rule.stats.lastSent || 'Never'}</p>
                             </div>
                             <Switch disabled={isRestricted} checked={rule.status === 'ACTIVE'} onCheckedChange={() => toggleCommRule(rule.id)} />
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant="secondary" className={rule.status === 'ACTIVE' ? "text-blue-600 bg-blue-50" : "text-gray-500"}>
                                {rule.status}
                             </Badge>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}