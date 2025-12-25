'use client';
import { useAdminStore } from '@/lib/admin/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const { analyticsData } = useAdminStore();

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Analytics & Insights</h1>
        <p className="text-gray-500">Business performance and data visualization</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        {/* RESTORED 4 TABS */}
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">Client Growth</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="visualization" className="gap-2"><PieIcon className="w-4 h-4"/> Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
           <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-blue-50 border-blue-200"><CardContent className="p-6"><p className="text-blue-700 font-bold uppercase text-xs mb-2">Total Revenue</p><div className="text-3xl font-bold text-blue-900">₹4.5L</div><p className="text-xs text-blue-600 mt-1">+12% vs last month</p></CardContent></Card>
              <Card className="bg-green-50 border-green-200"><CardContent className="p-6"><p className="text-green-700 font-bold uppercase text-xs mb-2">Active Users</p><div className="text-3xl font-bold text-green-900">1,240</div><p className="text-xs text-green-600 mt-1">+5% new signups</p></CardContent></Card>
              <Card className="bg-purple-50 border-purple-200"><CardContent className="p-6"><p className="text-purple-700 font-bold uppercase text-xs mb-2">Churn Rate</p><div className="text-3xl font-bold text-purple-900">1.2%</div><p className="text-xs text-purple-600 mt-1">Low risk</p></CardContent></Card>
           </div>
           {/* Overview Charts */}
           <Card><CardHeader><CardTitle>Performance Summary</CardTitle></CardHeader><CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={analyticsData.revenueTrend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><Tooltip/><Bar dataKey="value" fill="#8884d8" /></BarChart>
             </ResponsiveContainer>
           </CardContent></Card>
        </TabsContent>

        {/* TAB 2: CLIENT GROWTH */}
        <TabsContent value="growth" className="space-y-6">
           <Card><CardHeader><CardTitle>Client Acquisition Trend</CardTitle></CardHeader><CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={analyticsData.userGrowth}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Line type="monotone" dataKey="active" stroke="#82ca9d" strokeWidth={2}/><Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2}/></LineChart>
              </ResponsiveContainer>
           </CardContent></Card>
        </TabsContent>

        {/* TAB 3: REVENUE TRENDS */}
        <TabsContent value="revenue" className="space-y-6">
           <Card><CardHeader><CardTitle>Monthly Revenue Stream</CardTitle></CardHeader><CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={analyticsData.revenueTrend}><defs><linearGradient id="colorRv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorRv)"/></AreaChart>
              </ResponsiveContainer>
           </CardContent></Card>
        </TabsContent>

        {/* TAB 4: DATA VISUALIZATION */}
        <TabsContent value="visualization" className="space-y-6">
           <div className="grid gap-6 md:grid-cols-2">
              <Card><CardHeader><CardTitle>Device Usage</CardTitle></CardHeader><CardContent className="h-[300px] flex justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analyticsData.deviceUsage} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label>{analyticsData.deviceUsage.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>Regional Heatmap</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center bg-slate-50 text-slate-400">Map Visualization Component Placeholder</CardContent></Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}