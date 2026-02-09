'use client';
import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/admin/store';
import { useRouter } from 'next/navigation';
import { 
  Shield, TrendingUp, Users, DollarSign, Activity, AlertTriangle, 
  CheckCircle, ArrowRight, Plus, CreditCard, Clock, Zap, UploadCloud
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminDashboard() {
  const router = useRouter();
  const { getOverviewData, activities, refreshDashboard } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => { setIsMounted(true); refreshDashboard(); }, []);
  if (!isMounted) return <div className="p-8">Loading Command Center...</div>;

  // ✅ FIX 1: Safe Data Object (Agar data undefined ho to crash nahi hoga)
  const data = getOverviewData() || {
    alerts: [],
    kpi: { totalClients: 0, revenue: 0, activeTrials: 0, systemHealth: 'Good' }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Welcome back, Admin 👋</h1>
           <p className="text-gray-500">SaaS Command Center • {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
           <span className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
           </span>
           <span className="text-sm font-bold text-green-700">System Healthy</span>
        </div>
      </div>

      {/* 2. SMART ALERTS */}
      {/* ✅ FIX 2: Optional chaining aur fallback empty array use kiya hai */}
      <div className="space-y-3">
         {(data?.alerts || []).map((alert, i) => (
           <Alert key={i} className={`border-l-4 ${alert.type === 'critical' || alert.type === 'error' ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
              <AlertTriangle className={`h-4 w-4 ${alert.type === 'critical' || alert.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`} />
              <div className="flex justify-between items-center w-full">
                 <AlertTitle className="text-sm font-bold mb-0 ml-2 text-slate-800">{alert.message}</AlertTitle>
                 <Button size="sm" variant="ghost" className="h-6 text-xs hover:bg-white/50" onClick={() => router.push(alert.action)}>Fix Now <ArrowRight className="ml-1 h-3 w-3"/></Button>
              </div>
           </Alert>
         ))}
      </div>

      {/* 3. KPI HERO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
           <CardContent className="p-6">
              <div className="flex justify-between items-start">
                 <div><p className="text-xs font-bold text-slate-400 uppercase">Total Clients</p><h3 className="text-3xl font-bold text-slate-800 mt-1">{data.kpi?.totalClients || 0}</h3></div>
                 <div className="p-2 bg-blue-50 rounded-lg"><Users className="h-6 w-6 text-blue-600"/></div>
              </div>
              <p className="text-xs text-green-600 mt-3 flex items-center font-medium"><TrendingUp className="h-3 w-3 mr-1"/> +2 this month</p>
           </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-emerald-500 shadow-sm">
           <CardContent className="p-6">
              <div className="flex justify-between items-start">
                 <div><p className="text-xs font-bold text-slate-400 uppercase">Revenue (MTD)</p><h3 className="text-3xl font-bold text-slate-800 mt-1">₹{(data.kpi?.revenue || 0).toLocaleString()}</h3></div>
                 <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="h-6 w-6 text-emerald-600"/></div>
              </div>
              <p className="text-xs text-green-600 mt-3 flex items-center font-medium"><TrendingUp className="h-3 w-3 mr-1"/> +12% growth</p>
           </CardContent>
        </Card>

        <Card className="border-t-4 border-t-orange-500 shadow-sm">
           <CardContent className="p-6">
              <div className="flex justify-between items-start">
                 <div><p className="text-xs font-bold text-slate-400 uppercase">Active Trials</p><h3 className="text-3xl font-bold text-slate-800 mt-1">{data.kpi?.activeTrials || 0}</h3></div>
                 <div className="p-2 bg-orange-50 rounded-lg"><Clock className="h-6 w-6 text-orange-600"/></div>
              </div>
              <p className="text-xs text-orange-600 mt-3 flex items-center font-medium">Potential Leads</p>
           </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500 shadow-sm">
           <CardContent className="p-6">
              <div className="flex justify-between items-start">
                 <div><p className="text-xs font-bold text-slate-400 uppercase">System Health</p><h3 className="text-3xl font-bold text-slate-800 mt-1">{data.kpi?.systemHealth || '-'}</h3></div>
                 <div className="p-2 bg-purple-50 rounded-lg"><Activity className="h-6 w-6 text-purple-600"/></div>
              </div>
              <p className="text-xs text-slate-400 mt-3">All systems operational</p>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* 4. SMART ACTIONS */}
         <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500"/> Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
               <Card className="hover:border-blue-300 transition-all cursor-pointer group" onClick={() => router.push('/admin/clients')}>
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus className="h-6 w-6 text-blue-600"/></div>
                     <div><h4 className="font-bold text-slate-700">Add New Client</h4><p className="text-xs text-slate-500">Onboard a new society</p></div>
                  </CardContent>
               </Card>
               <Card className="hover:border-orange-300 transition-all cursor-pointer group" onClick={() => router.push('/admin/subscriptions')}>
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform"><CreditCard className="h-6 w-6 text-orange-600"/></div>
                     <div>
                        <h4 className="font-bold text-slate-700">Verify Payments</h4>
                        {/* ✅ FIX 3: Safe check for alerts inside map */}
                        {(data?.alerts || []).find(a => a.type === 'critical') && <Badge className="mt-1 bg-red-500 text-white">Action Needed</Badge>}
                     </div>
                  </CardContent>
               </Card>
               <Card className="hover:border-purple-300 transition-all cursor-pointer group" onClick={() => router.push('/admin/settings')}>
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform"><UploadCloud className="h-6 w-6 text-purple-600"/></div>
                     <div><h4 className="font-bold text-slate-700">Run Backup</h4><p className="text-xs text-slate-500">Manual Git Push</p></div>
                  </CardContent>
               </Card>
               <Card className="hover:border-green-300 transition-all cursor-pointer group" onClick={() => router.push('/admin/analytics')}>
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform"><Activity className="h-6 w-6 text-green-600"/></div>
                     <div><h4 className="font-bold text-slate-700">View Live Activity</h4><p className="text-xs text-slate-500">Check system logs</p></div>
                  </CardContent>
               </Card>
            </div>
         </div>

         {/* 5. LIVE ACTIVITY SNAPSHOT */}
         <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-slate-500"/> Live Pulse</h3>
            <Card>
               <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                     {/* ✅ FIX 4: Added (activities || []) fallback to prevent slice crash */}
                     {(activities || []).slice(0, 5).map((act, i) => (
                        <div key={i} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                           <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                           <div>
                              <p className="text-sm font-medium text-slate-700">{act?.type || 'Unknown Activity'}</p>
                              <p className="text-xs text-slate-500">{act?.client || 'Unknown'} • {act?.time || 'Just now'}</p>
                           </div>
                        </div>
                     ))}
                  </div>
                  <Button variant="ghost" className="w-full text-xs text-slate-500 border-t" onClick={() => router.push('/admin/activity')}>View Full Audit Log</Button>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
