'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield, Activity, Search, Filter, Download, Zap,
  AlertTriangle, User, Database, RefreshCw, XCircle, HardDrive, Clock, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

// MASTER IMPORT
import { supabase } from '@/lib/supabase';

// DATABASE ROW TYPE DEFINITION
type ClientLog = {
  id: string;
  client_name: string;
  actor_name: string;
  actor_role: string;
  action: string;
  resource: string;
  ip_address: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  created_at: string;
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<ClientLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Health Monitor States with extended parameters
  const [healthData, setHealthData] = useState<{ 
    connections: any[]; 
    dbSize: string;
    dbSizeBytes: number;
    dbPercentage: number;
    dbLimit: string;
  }>({ 
    connections: [], 
    dbSize: '0 MB', 
    dbSizeBytes: 0, 
    dbPercentage: 0, 
    dbLimit: '500 MB' 
  });
  const [fetchingHealth, setFetchingHealth] = useState(false);

  // Fetch Database Live Health logs
  const fetchSystemHealth = useCallback(async () => {
    try {
      setFetchingHealth(true);
      const res = await fetch('/api/admin/system-health');
      if (!res.ok) throw new Error("Failed to fetch database diagnostics");
      const data = await res.json();
      setHealthData(data);
    } catch (err: any) {
      console.error("Failed to fetch health data:", err);
    } finally {
      setFetchingHealth(false);
    }
  }, []);

  useEffect(() => {
    // Pehle purane logs fetch karein
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('client_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error("Supabase Error:", error.message);
          return;
        }
        
        if (data) setLogs(data);
      } catch (error) {
        console.error('Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    fetchSystemHealth(); // Live database diagnostics load hoga

    // Realtime Listener
    const channel = supabase
      .channel('audit-logs-global')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'client_audit_logs' }, 
        (payload) => {
          const incoming = payload.new as ClientLog;
          if (incoming) {
            setLogs((current) => {
              if (current.some(l => l.id === incoming.id)) return current;
              const updated = [incoming, ...current];
              return updated.slice(0, 100);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSystemHealth]);

  // Terminate hanging connection
  const handleKillConnection = async (pid: number) => {
    const confirmKill = window.confirm(`⚠️ चेतावनी: क्या आप सचमुच डेटाबेस कनेक्शन (PID: ${pid}) को जबरन बंद (Terminate) करना चाहते हैं?`);
    if (!confirmKill) return;

    try {
      const res = await fetch('/api/admin/system-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });
      if (!res.ok) throw new Error("Failed to terminate connection");
      toast.success(`Database connection ${pid} successfully terminated!`);
      await fetchSystemHealth(); // Reload the list
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const timeAgo = (dateString: string) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
  };

  // Safe Wrapper added
  const getIcon = (action: any) => {
    const lower = String(action || '').toLowerCase();
    if (lower.includes('login') || lower.includes('auth')) return Shield;
    if (lower.includes('backup') || lower.includes('database')) return Database;
    if (lower.includes('update') || lower.includes('setting')) return Zap;
    if (lower.includes('user') || lower.includes('member')) return User;
    return Activity;
  };

  // Stats Calculation Fix
  const stats = useMemo(() => {
    if (!logs || logs.length === 0) return { total: 0, failed: 0, successRate: '100', uniqueClients: 0 };

    const total = logs.length;
    const failed = logs.filter(l => l && l.status === 'FAILED').length;
    const successRate = total > 0 ? ((total - failed) / total * 100).toFixed(1) : '100';
    const uniqueClients = new Set(logs.map(l => l?.client_name || 'Unknown')).size;

    return { total, failed, successRate, uniqueClients };
  }, [logs]);

  // Safe Wrappers added
  const filteredLogs = logs.filter(log => {
    const search = String(searchTerm).toLowerCase();
    const clientName = String(log?.client_name || 'System').toLowerCase();
    const actorName = String(log?.actor_name || 'Unknown').toLowerCase();
    const action = String(log?.action || 'Action').toLowerCase();

    return clientName.includes(search) || 
           actorName.includes(search) || 
           action.includes(search);
  });

  // Helper: check if connection is idle for too long (System safe filters)
  const isHangingConnection = (duration: any, state: any, appName: any, query: any) => {
    if (state !== 'idle') return false;

    const app = String(appName || '').toLowerCase();
    const q = String(query || '').toLowerCase();
    const durStr = String(duration || '');

    // internal safe system processes ko leak na maanein
    if (
      app.includes('postgrest') || 
      app.includes('realtime') || 
      app.includes('supavisor') || 
      app.includes('postgres_exporter') ||
      q.includes('listen "pgrst"') ||
      q.includes('show archive_mode')
    ) {
      return false;
    }
    
    if (durStr.includes('days') || durStr.includes('hours') || durStr.includes('mins')) return true;
    const match = durStr.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const mins = parseInt(match[2], 10);
      if (mins >= 3) return true;
    }
    return false;
  };

  // Helper to calculate free megabytes
  const getFreeMegabytes = () => {
    const usedMB = (healthData.dbSizeBytes || 0) / 1048576; // Convert bytes to MB
    const freeMB = 500 - usedMB;
    return freeMB > 0 ? freeMB.toFixed(1) : '0';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2">
             <Shield className="text-blue-600 h-8 w-8" /> Security & Activity Hub
           </h1>
           <p className="text-gray-500">Track client actions and monitor live database health metrics.</p>
        </div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export Report</Button>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="bg-blue-50 border-blue-200 shadow-sm">
            <CardContent className="p-4">
               <p className="text-xs font-bold text-blue-700 uppercase">Total Events</p>
               <h3 className="text-2xl font-bold text-blue-900">{stats.total}</h3>
            </CardContent>
         </Card>
         <Card className="bg-green-50 border-green-200 shadow-sm">
            <CardContent className="p-4">
               <p className="text-xs font-bold text-green-700 uppercase">Success Rate</p>
               <h3 className="text-2xl font-bold text-green-900">{stats.successRate}%</h3>
            </CardContent>
         </Card>
         <Card className="bg-red-50 border-red-200 shadow-sm">
            <CardContent className="p-4">
               <p className="text-xs font-bold text-red-700 uppercase">Failed Actions</p>
               <h3 className="text-2xl font-bold text-red-900">{stats.failed}</h3>
            </CardContent>
         </Card>
         <Card className="bg-purple-50 border-purple-200 shadow-sm">
            <CardContent className="p-4">
               <p className="text-xs font-bold text-purple-700 uppercase">Active Clients</p>
               <h3 className="text-2xl font-bold text-purple-900">{stats.uniqueClients}</h3>
            </CardContent>
         </Card>
      </div>

      {/* TABS SECTION */}
      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="live" className="gap-2"><Activity className="w-4 h-4"/> Live Feed</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><Shield className="w-4 h-4"/> Audit Logs</TabsTrigger>
          <TabsTrigger value="health" className="gap-2" onClick={fetchSystemHealth}>
            <Database className="w-4 h-4"/> System Health
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: LIVE FEED */}
        <TabsContent value="live">
           <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
             <CardHeader><CardTitle>Real-time Client Actions</CardTitle></CardHeader>
             <CardContent>
                {loading ? <p className="p-4 text-center text-gray-500">Loading logs...</p> : (
                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-slate-200 ml-2">
                   {filteredLogs.map((log) => {
                      const Icon = getIcon(log.action);
                      return (
                      <div key={log.id} className="relative flex items-start gap-4 pl-4">
                         {/* Timeline Dot */}
                         <div className={`absolute left-0 mt-1.5 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 
                            ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : log.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            <Icon className="w-5 h-5"/>
                         </div>
                         
                         {/* Timeline Content */}
                         <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center text-sm">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 text-base">{String(log.action || 'Action')}</span>
                                <p className="text-sm text-slate-600 mt-1">
                                  Performed by <span className="font-semibold text-blue-600">{String(log.actor_name || 'Unknown')}</span> 
                                  <span className="text-gray-400"> ({String(log.client_name || 'System')})</span>
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs bg-white shrink-0 ml-3">
                                {timeAgo(log.created_at)}
                              </Badge>
                            </div>
                            <div className="mt-2 text-xs font-mono bg-white px-2 py-1 inline-block rounded border">
                              Target: {String(log.resource || 'N/A')}
                            </div>
                            {log.status === 'FAILED' && (
                               <div className="mt-3 text-xs text-red-700 bg-red-50 p-2 rounded-lg flex items-center gap-2 border border-red-100">
                                  <AlertTriangle className="w-4 h-4"/> Action Failed
                               </div>
                            )}
                         </div>
                      </div>
                   )})}
                </div>
                )}
             </CardContent>
           </Card>
        </TabsContent>

        {/* TAB 2: AUDIT TABLE */}
        <TabsContent value="audit">
           <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2"><Shield className="h-5 w-5 text-purple-600"/> Security Audit Trail</CardTitle>
              <div className="flex gap-2 w-1/3">
                 <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"/>
                    <Input 
                        placeholder="Search..." 
                        className="pl-8 bg-slate-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Button variant="outline" size="icon"><Filter className="h-4 w-4"/></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Client / Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading data...</TableCell></TableRow>
                  ) : filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="font-bold text-slate-800">{String(log.client_name || 'Unknown')}</div>
                        <div className="text-xs text-blue-600 font-medium">{String(log.actor_name || 'Unknown')} <span className='text-gray-400'>({String(log.actor_role || 'N/A')})</span></div>
                      </TableCell>
                      <TableCell><span className="font-medium text-slate-700">{String(log.action || 'Action')}</span></TableCell>
                      <TableCell><code className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200 text-gray-600">{String(log.resource || 'N/A')}</code></TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{String(log.ip_address || '0.0.0.0')}</TableCell>
                      <TableCell>
                        <Badge className={
                           log.status==='SUCCESS'?'bg-green-100 text-green-700 hover:bg-green-100 border-green-200': 
                           log.status==='FAILED'?'bg-red-100 text-red-700 hover:bg-red-100 border-red-200':'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200'
                        }>{String(log.status || 'UNKNOWN')}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: SYSTEM DIAGNOSTICS & DB HEALTH (UPGRADED METRICS) */}
        <TabsContent value="health">
           <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
              
              {/* Health Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* UPGRADED: Database Size Progress Meter */}
                 <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Database Size</p>
                            <h4 className="text-2xl font-bold text-slate-800 mt-1">
                              {healthData.dbSize} <span className="text-xs text-slate-400 font-bold">/ {healthData.dbLimit}</span>
                            </h4>
                         </div>
                         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                            <HardDrive className="w-6 h-6" />
                         </div>
                       </div>

                       {/* Visual Progress Bar */}
                       <div className="mt-4 space-y-1.5">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                             <div 
                               className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                               style={{ width: `${healthData.dbPercentage || 0}%` }}
                             />
                          </div>
                          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                             <span>{healthData.dbPercentage || 0}% Used</span>
                             <span>{getFreeMegabytes()} MB Free</span>
                          </div>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="border-none shadow-md bg-white rounded-2xl">
                    <CardContent className="p-6 flex items-center justify-between">
                       <div>
                          <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Active Connections</p>
                          <h4 className="text-2xl font-bold text-slate-800 mt-1">
                            {healthData.connections?.filter(c => c.state === 'active').length || 0} Open
                          </h4>
                       </div>
                       <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100">
                          <Clock className="w-6 h-6 animate-pulse" />
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="border-none shadow-md bg-white rounded-2xl">
                    <CardContent className="p-6 flex items-center justify-between">
                       <div>
                          <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Hanging Leaks</p>
                          <h4 className="text-2xl font-bold text-slate-800 mt-1">
                            {healthData.connections?.filter(c => isHangingConnection(c.duration, c.state, c.application_name, c.query)).length || 0} Leak(s)
                          </h4>
                       </div>
                       <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100">
                          <AlertTriangle className="w-6 h-6 animate-bounce" />
                       </div>
                    </CardContent>
                 </Card>
              </div>

              {/* Active Connections Detail Card */}
              <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <Database className="h-5 w-5 text-blue-600" /> Active PostgreSQL Connection Registry
                    </CardTitle>
                    <p className="text-slate-400 text-xs mt-0.5">Real-time status of all active TCP client sessions inside the pooler.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 h-10 border-slate-200" 
                    onClick={fetchSystemHealth}
                    disabled={fetchingHealth}
                  >
                    {fetchingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                     <TableHeader className="bg-slate-50">
                        <TableRow>
                           <TableHead>Application Source</TableHead>
                           <TableHead>PID</TableHead>
                           <TableHead>Connection State</TableHead>
                           <TableHead>Hanging Duration</TableHead>
                           <TableHead>Current Query</TableHead>
                           <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {fetchingHealth ? (
                          <TableRow><TableCell colSpan={6} className="text-center h-24">Refreshing diagnostics...</TableCell></TableRow>
                        ) : healthData.connections?.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No active database connections.</TableCell></TableRow>
                        ) : healthData.connections?.map((conn) => {
                          const hanging = isHangingConnection(conn.duration, conn.state, conn.application_name, conn.query);
                          return (
                            <TableRow key={conn.pid} className={`hover:bg-slate-50/50 ${hanging ? 'bg-red-50/20' : ''}`}>
                               {/* App Source */}
                               <TableCell className="font-bold text-slate-800">
                                  {String(conn.application_name || 'Generic API / Connection String')}
                               </TableCell>
                               {/* PID */}
                               <TableCell>
                                  <Badge variant="outline" className="bg-slate-100 text-slate-600 font-mono font-bold text-xs">{conn.pid}</Badge>
                               </TableCell>
                               {/* State */}
                               <TableCell>
                                  <Badge className={
                                     conn.state === 'active' 
                                       ? 'bg-green-100 text-green-700 hover:bg-green-100 border border-green-200 animate-pulse' 
                                       : 'bg-slate-100 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                  }>
                                     {String(conn.state || 'UNKNOWN').toUpperCase()}
                                  </Badge>
                               </TableCell>
                               {/* Duration */}
                               <TableCell className="font-mono text-xs text-slate-600">
                                  {hanging ? (
                                    <span className="text-red-600 font-bold flex items-center gap-1 animate-pulse">
                                       <AlertTriangle className="w-3.5 h-3.5" /> {String(conn.duration)} (Leak!)
                                    </span>
                                  ) : (
                                    <span>{String(conn.duration || 'N/A')}</span>
                                  )}
                               </TableCell>
                               {/* Current Query */}
                               <TableCell className="max-w-xs">
                                  <code className="text-xs bg-slate-100 px-2 py-1 rounded border block overflow-x-auto whitespace-pre font-mono text-slate-500 max-h-16">
                                     {String(conn.query || 'IDLE')}
                                  </code>
                               </TableCell>
                               {/* Action */}
                               <TableCell className="text-right">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 font-bold rounded-lg"
                                    onClick={() => handleKillConnection(conn.pid)}
                                    disabled={fetchingHealth}
                                  >
                                     <XCircle className="w-5 h-5" />
                                  </Button>
                               </TableCell>
                            </TableRow>
                          );
                        })}
                     </TableBody>
                   </Table>
                </CardContent>
              </Card>
           </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
