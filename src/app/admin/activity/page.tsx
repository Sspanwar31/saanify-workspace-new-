'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Activity, Search, Filter, Download, Zap, 
  AlertTriangle, User, Database 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const supabase = createClientComponentClient(); 
  const [logs, setLogs] = useState<ClientLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. DATA FETCHING
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('client_audit_logs') // Ensure this table exists in Supabase
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        if (data) setLogs(data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // 2. HELPER: Time Ago Function (Replaces date-fns to fix error)
  const timeAgo = (dateString: string) => {
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

  // 3. HELPER: Select Icon
  const getIcon = (action: string) => {
    const lower = action ? action.toLowerCase() : '';
    if (lower.includes('login') || lower.includes('auth')) return Shield;
    if (lower.includes('backup') || lower.includes('database')) return Database;
    if (lower.includes('update') || lower.includes('setting')) return Zap;
    if (lower.includes('user') || lower.includes('member')) return User;
    return Activity;
  };

  // 4. STATS CALCULATION
  const stats = useMemo(() => {
    const total = logs.length;
    const failed = logs.filter(l => l.status === 'FAILED').length;
    const successRate = total > 0 ? ((total - failed) / total * 100).toFixed(1) : '100';
    const uniqueClients = new Set(logs.map(l => l.client_name)).size;

    return { total, failed, successRate, uniqueClients };
  }, [logs]);

  // Filter Logic
  const filteredLogs = logs.filter(log => 
    (log.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.actor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Client Activity Monitor</h1>
           <p className="text-gray-500">Track actions performed by Society Admins</p>
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
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="live" className="gap-2"><Activity className="w-4 h-4"/> Live Feed</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><Shield className="w-4 h-4"/> Audit Logs</TabsTrigger>
        </TabsList>

        {/* TAB 1: LIVE FEED */}
        <TabsContent value="live">
           <Card>
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
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="font-bold text-slate-800 text-base">{log.action}</p>
                                  <p className="text-sm text-slate-600 mt-1">
                                    Performed by <span className="font-semibold text-blue-600">{log.actor_name}</span> 
                                    <span className="text-gray-400"> ({log.client_name})</span>
                                  </p>
                                  <div className="mt-2 text-xs font-mono bg-white px-2 py-1 inline-block rounded border">
                                    Target: {log.resource}
                                  </div>
                               </div>
                               <Badge variant="outline" className="text-xs bg-white">
                                 {timeAgo(log.created_at)}
                               </Badge>
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
           <Card>
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
                        <div className="font-bold text-slate-800">{log.client_name}</div>
                        <div className="text-xs text-blue-600 font-medium">{log.actor_name} <span className='text-gray-400'>({log.actor_role})</span></div>
                      </TableCell>
                      <TableCell><span className="font-medium text-slate-700">{log.action}</span></TableCell>
                      <TableCell><code className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200 text-gray-600">{log.resource}</code></TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{log.ip_address}</TableCell>
                      <TableCell>
                        <Badge className={
                           log.status==='SUCCESS'?'bg-green-100 text-green-700 hover:bg-green-100 border-green-200': 
                           log.status==='FAILED'?'bg-red-100 text-red-700 hover:bg-red-100 border-red-200':'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200'
                        }>{log.status}</Badge>
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

      </Tabs>
    </div>
  );
}
