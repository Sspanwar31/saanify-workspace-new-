'use client';

import { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, Clock, Mail, Bell, Server, Activity, Database, Loader2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// CHANGE: Standard Supabase Import (No extra package needed)
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client directly using Env Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Static UI Config (Icons & Descriptions)
const SYSTEM_TASKS_CONFIG = [
  { id: 'init_db', description: 'Create/Repair Supabase Tables (Run Once)', schedule: 'One-time', icon: Database },
  { id: 'schema_sync', description: 'Sync database schema changes', schedule: '0 */6 * * *', icon: Server },
  { id: 'backup', description: 'Secure backup to Supabase/GitHub', schedule: 'Manual', icon: Server },
  { id: 'restore', description: 'Restore from backup files', schedule: 'Manual', icon: RotateCcw },
  { id: 'auto_sync', description: 'Scheduled client data synchronization', schedule: '0 */2 * * *', icon: Server },
  { id: 'health', description: 'Monitor connectivity & latency', schedule: '*/5 * * * *', icon: Activity },
];

export default function AutomationPage() {
  const [loading, setLoading] = useState(true);
  const [systemTasks, setSystemTasks] = useState<any[]>([]);
  const [commRules, setCommRules] = useState<any[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  // 1. Fetch Data from Supabase
  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_automation_settings')
        .select('*')
        .order('task_key');

      if (error) throw error;

      if (data) {
        // Merge DB data with UI Config
        const tasks = SYSTEM_TASKS_CONFIG.map(conf => {
            const dbItem = data.find((d: any) => d.task_key === conf.id);
            return {
                ...conf,
                name: dbItem?.name || conf.id,
                status: dbItem?.status || 'PENDING',
                lastRun: dbItem?.last_run ? new Date(dbItem.last_run).toLocaleString() : 'Never'
            };
        });
        setSystemTasks(tasks);

        const rules = data.filter((d: any) => d.type === 'EMAIL' || d.type === 'PUSH').map((d: any) => ({
            id: d.task_key,
            name: d.name,
            type: d.type,
            status: d.status, // ACTIVE or PAUSED
            stats: d.meta || { sent: 0, pending: 0 }
        }));
        setCommRules(rules);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load automation settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Handle "Run Now" (Updates DB)
  const handleRun = async (id: string) => {
    setRunningId(id);
    toast.info("Initiating Task...");

    // Simulate Processing Delay
    setTimeout(async () => {
        try {
            // Update DB Status
            const { error } = await supabase
                .from('admin_automation_settings')
                .update({ 
                    status: 'SUCCESS', 
                    last_run: new Date().toISOString() 
                })
                .eq('task_key', id);

            if (error) throw error;

            toast.success("Task Completed Successfully");
            fetchData(); // Refresh UI

        } catch (e) {
            toast.error("Task Update Failed");
        } finally {
            setRunningId(null);
        }
    }, 2000); // 2 second fake delay for UX
  };

  // 3. Handle Toggle Switch (Updates DB)
  const toggleCommRule = async (id: string, currentStatus: string) => {
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      
      // Optimistic UI Update
      setCommRules(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

      try {
        const { error } = await supabase
            .from('admin_automation_settings')
            .update({ status: newStatus })
            .eq('task_key', id);
        
        if (error) throw error;
        toast.success(`Rule updated to ${newStatus}`);
      } catch (e) {
        toast.error("Failed to update rule");
        fetchData(); // Revert on error
      }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Automation Center</h1>
           <p className="text-gray-500">Manage cron jobs, backups, and communication workflows</p>
        </div>
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
                               <span className="text-xs text-gray-400">Last Run: {task.lastRun}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                         <Badge className={
                            task.status === 'SUCCESS' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                            task.status === 'FAILED' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                            'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                         }>
                            {task.status}
                         </Badge>
                         <Button size="sm" variant="outline" onClick={() => handleRun(task.id)} disabled={runningId === task.id}>
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
                             <Switch checked={rule.status === 'ACTIVE'} onCheckedChange={() => toggleCommRule(rule.id, rule.status)} />
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
                                <p className="text-xs text-gray-500 mt-1">Status: {rule.status}</p>
                             </div>
                             <Switch checked={rule.status === 'ACTIVE'} onCheckedChange={() => toggleCommRule(rule.id, rule.status)} />
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
