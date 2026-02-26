'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useAdminStore } from '@/lib/admin/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const { analyticsData, kpiData, refreshDashboard, isLoading } = useAdminStore();

  // ✅ PAGE LOAD HOTE HI DATA FETCH KAREGA
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // ✅ SAFE DATA LOGIC
  const safeData = analyticsData ?? {
    revenueTrend: [],
    userGrowth: [],
    deviceUsage: [],
  };

  const safeKpi = kpiData ?? {
    totalRevenue: 0,
    activeUsers: 0,
    churnRate: '0.0',
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Analytics & Insights</h1>
        <p className="text-gray-500">Business performance and data visualization</p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-slate-500">Loading Analytics...</div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="growth">Client Growth</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
            <TabsTrigger value="visualization" className="gap-2"><PieIcon className="w-4 h-4"/> Visualization</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
             <div className="grid gap-4 md:grid-cols-3">
                {/* DYNAMIC REVENUE */}
                <Card className="bg-blue-50 border-blue-200"><CardContent className="p-6"><p className="text-blue-700 font-bold uppercase text-xs mb-2">Total Revenue (MRR)</p><div className="text-3xl font-bold text-blue-900">₹{safeKpi.totalRevenue.toLocaleString('en-IN')}</div><p className="text-xs text-blue-600 mt-1">Based on active plans</p></CardContent></Card>
                {/* DYNAMIC USERS */}
                <Card className="bg-green-50 border-green-200"><CardContent className="p-6"><p className="text-green-700 font-bold uppercase text-xs mb-2">Active Users</p><div className="text-3xl font-bold text-green-900">{safeKpi.activeUsers}</div><p className="text-xs text-green-600 mt-1">Current total active</p></CardContent></Card>
                {/* DYNAMIC CHURN */}
                <Card className="bg-purple-50 border-purple-200"><CardContent className="p-6"><p className="text-purple-700 font-bold uppercase text-xs mb-2">Churn Rate</p><div className="text-3xl font-bold text-purple-900">{safeKpi.churnRate}%</div><p className="text-xs text-purple-600 mt-1">Deleted vs Total Accounts</p></CardContent></Card>
             </div>
             
             <Card><CardHeader><CardTitle>Performance Summary</CardTitle></CardHeader><CardContent className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={safeData.revenueTrend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><Tooltip/><Bar dataKey="value" fill="#8884d8" name="Revenue (₹)" /></BarChart>
               </ResponsiveContainer>
             </CardContent></Card>
          </TabsContent>

          {/* TAB 2: CLIENT GROWTH */}
          <TabsContent value="growth" className="space-y-6">
             <Card><CardHeader><CardTitle>Client Acquisition Trend</CardTitle></CardHeader><CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={safeData.userGrowth}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Line type="monotone" dataKey="active" stroke="#82ca9d" strokeWidth={2} name="New Users"/><Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Total Users"/></LineChart>
                </ResponsiveContainer>
             </CardContent></Card>
          </TabsContent>

          {/* TAB 3: REVENUE TRENDS */}
          <TabsContent value="revenue" className="space-y-6">
             <Card><CardHeader><CardTitle>Monthly Revenue Stream</CardTitle></CardHeader><CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={safeData.revenueTrend}><defs><linearGradient id="colorRv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorRv)" name="Revenue"/></AreaChart>
                </ResponsiveContainer>
             </CardContent></Card>
          </TabsContent>

          {/* TAB 4: DATA VISUALIZATION */}
          <TabsContent value="visualization" className="space-y-6">
             <div className="grid gap-6 md:grid-cols-2">
                <Card><CardHeader><CardTitle>Platform Usage</CardTitle></CardHeader><CardContent className="h-[300px] flex justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={safeData.deviceUsage} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label>{safeData.deviceUsage.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>System Health</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center bg-slate-50 text-slate-400">Database Connection Active <br/> APIs Operational</CardContent></Card>
             </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
