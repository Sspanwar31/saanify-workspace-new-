'use client';

import { useState } from 'react';
import { 
  Shield, Activity, Search, Filter, Download, Zap, CheckCircle, 
  XCircle, AlertTriangle, User, Server, Database, Clock 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminStore } from '@/lib/admin/store';

export default function ActivityPage() {
  const { activities } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');

  // MOCK DATA FOR DISPLAY
  const extendedLogs = [
    { id: 1, user: 'Super Admin', role: 'SUPER_ADMIN', action: 'System Backup', target: 'Database', ip: '192.168.1.1', status: 'SUCCESS', time: 'Just now', icon: Database },
    { id: 2, user: 'John Doe', role: 'SUPPORT', action: 'Reset Password', target: 'User: Rahul', ip: '10.0.0.45', status: 'SUCCESS', time: '10 mins ago', icon: User },
    { id: 3, user: 'System Bot', role: 'AUTOMATION', action: 'Schema Sync', target: 'Supabase', ip: '127.0.0.1', status: 'FAILED', time: '1 hour ago', icon: Server },
    { id: 4, user: 'Super Admin', role: 'SUPER_ADMIN', action: 'Update Settings', target: 'Global Config', ip: '192.168.1.1', status: 'SUCCESS', time: '2 hours ago', icon: Zap },
    { id: 5, user: 'Unknown', role: 'GUEST', action: 'Failed Login', target: 'Auth System', ip: '45.22.19.11', status: 'WARNING', time: '5 hours ago', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Activity & Audit</h1>
           <p className="text-gray-500">Monitor system events and security trails</p>
        </div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export Logs</Button>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="bg-blue-50 border-blue-200 shadow-sm">
            <CardContent className="p-4">
               <p className="text-xs font-bold text-blue-700 uppercase">Total Events</p>
               <h3 className="text-2xl font-bold text-blue-900">1,240</h3>
            </CardContent>
         </Card>
         <Card className="bg-green-50 border-green-200 shadow-sm">
            <CardContent className="p-4">
               <p className="text-xs font-bold text-green-700 uppercase">Success Rate</p>
               <h3 className="text-2xl font-bold text-green-900">98.5%</h3>
            </CardContent>
         </Card>
         <Card className="bg-red-50 border-red-200 shadow-sm">
            <CardContent className="p-4">
               <p className="text-xs font-bold text-red-700 uppercase">Failed Actions</p>
               <h3 className="text-2xl font-bold text-red-900">12</h3>
            </CardContent>
         </Card>
         <Card className="bg-purple-50 border-purple-200 shadow-sm">
            <CardContent className="p-4">
               <p className="text-xs font-bold text-purple-700 uppercase">Active Users</p>
               <h3 className="text-2xl font-bold text-purple-900">5</h3>
            </CardContent>
         </Card>
      </div>

      {/* TABS SECTION */}
      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="live" className="gap-2"><Activity className="w-4 h-4"/> Live Feed</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><Shield className="w-4 h-4"/> Audit Logs</TabsTrigger>
        </TabsList>

        {/* TAB 1: LIVE FEED (Timeline View) */}
        <TabsContent value="live">
           <Card>
             <CardHeader><CardTitle>Real-time Activity Stream</CardTitle></CardHeader>
             <CardContent>
                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-slate-200 ml-2">
                   {extendedLogs.map((log) => (
                      <div key={log.id} className="relative flex items-start gap-4 pl-4">
                         {/* Timeline Dot */}
                         <div className={`absolute left-0 mt-1.5 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 
                            ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : log.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            <log.icon className="w-5 h-5"/>
                         </div>
                         
                         {/* Timeline Content */}
                         <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="font-bold text-slate-800 text-base">{log.action}</p>
                                  <p className="text-sm text-slate-600">Performed by <span className="font-semibold text-blue-600">{log.user}</span> on <span className="font-mono bg-white px-1 rounded border">{log.target}</span></p>
                               </div>
                               <Badge variant="outline" className="text-xs bg-white">{log.time}</Badge>
                            </div>
                            {log.status === 'FAILED' && (
                               <div className="mt-3 text-xs text-red-700 bg-red-50 p-2 rounded-lg flex items-center gap-2 border border-red-100">
                                  <AlertTriangle className="w-4 h-4"/> Action failed due to connection timeout.
                               </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </CardContent>
           </Card>
        </TabsContent>

        {/* TAB 2: AUDIT TABLE (Detailed View) */}
        <TabsContent value="audit">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2"><Shield className="h-5 w-5 text-purple-600"/> Security Audit Trail</CardTitle>
              <div className="flex gap-2 w-1/3">
                 <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"/>
                    <Input placeholder="Search logs..." className="pl-8 bg-slate-50"/>
                 </div>
                 <Button variant="outline" size="icon"><Filter className="h-4 w-4"/></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>User / Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extendedLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="font-medium text-slate-900">{log.user}</div>
                        <div className="text-xs text-slate-500 font-mono">{log.role}</div>
                      </TableCell>
                      <TableCell><span className="font-medium">{log.action}</span></TableCell>
                      <TableCell><code className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{log.target}</code></TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">{log.ip}</TableCell>
                      <TableCell>
                        <Badge className={
                           log.status==='SUCCESS'?'bg-green-100 text-green-700 hover:bg-green-100': 
                           log.status==='FAILED'?'bg-red-100 text-red-700 hover:bg-red-100':'bg-orange-100 text-orange-700 hover:bg-orange-100'
                        }>{log.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">{log.time}</TableCell>
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