'use client';

export const dynamic = 'force-dynamic';

// useMemo ko import kiya
import { useEffect, useMemo } from 'react';
import { useAdminStore } from '@/lib/admin/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

export default function AnalyticsPage() {
  const { analyticsData, kpiData, refreshDashboard, isLoading } = useAdminStore();

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const safeData = analyticsData ?? {
    revenueTrend: [],
    userGrowth: [],
    planDistribution: [],
    clientStatus: [],
  };

  const safeKpi = kpiData ?? {
    totalRevenue: 0,
    activeUsers: 0,
    churnRate: '0.0',
  };

  // --- ✅ NAYA LOGIC: Plan Distribution ko saaf karne ke liye ---
  const normalizedPlanData = useMemo(() => {
    if (!safeData.planDistribution || safeData.planDistribution.length === 0) return [];

    const planGroups = {
      'TRIAL': 0,
      'BASIC': 0,
      'PROFESSIONAL': 0,
      'ENTERPRISE': 0
    };

    safeData.planDistribution.forEach(item => {
      const name = (item.name || '').toUpperCase();
      
      if (name.includes('TRIAL') || name.includes('FREE')) {
        planGroups['TRIAL'] += item.value;
      } else if (name.includes('BASIC')) {
        planGroups['BASIC'] += item.value;
      } else if (name.includes('PRO')) {
        planGroups['PROFESSIONAL'] += item.value;
      } else if (name.includes('ENTERPRISE')) {
        planGroups['ENTERPRISE'] += item.value;
      }
    });

    // Sirf wahi return karein jisme value 0 se zyada ho
    return Object.entries(planGroups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [safeData.planDistribution]);

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

          <TabsContent value="overview" className="space-y-6">
             <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-blue-50 border-blue-200"><CardContent className="p-6"><p className="text-blue-700 font-bold uppercase text-xs mb-2">Total Revenue (MRR)</p><div className="text-3xl font-bold text-blue-900">₹{safeKpi.totalRevenue.toLocaleString('en-IN')}</div><p className="text-xs text-blue-600 mt-1">Based on active plans</p></CardContent></Card>
                <Card className="bg-green-50 border-green-200"><CardContent className="p-6"><p className="text-green-700 font-bold uppercase text-xs mb-2">Active Users</p><div className="text-3xl font-bold text-green-900">{safeKpi.activeUsers}</div><p className="text-xs text-green-600 mt-1">Current total active</p></CardContent></Card>
                <Card className="bg-purple-50 border-purple-200"><CardContent className="p-6"><p className="text-purple-700 font-bold uppercase text-xs mb-2">Churn Rate</p><div className="text-3xl font-bold text-purple-900">{safeKpi.churnRate}%</div><p className="text-xs text-purple-600 mt-1">Deleted vs Total Accounts</p></CardContent></Card>
             </div>
             <Card><CardHeader><CardTitle>Performance Summary</CardTitle></CardHeader><CardContent className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={safeData.revenueTrend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><Tooltip/><Bar dataKey="value" fill="#8884d8" name="Revenue (₹)" /></BarChart>
               </ResponsiveContainer>
             </CardContent></Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
             <Card><CardHeader><CardTitle>Client Acquisition Trend</CardTitle></CardHeader><CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={safeData.userGrowth}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Line type="monotone" dataKey="active" stroke="#82ca9d" strokeWidth={2} name="New Users"/><Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Total Users"/></LineChart>
                </ResponsiveContainer>
             </CardContent></Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
             <Card><CardHeader><CardTitle>Monthly Revenue Stream</CardTitle></CardHeader><CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={safeData.revenueTrend}><defs><linearGradient id="colorRv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorRv)" name="Revenue"/></AreaChart>
                </ResponsiveContainer>
             </CardContent></Card>
          </TabsContent>

          {/* --- CHANGED START --- */}
          <TabsContent value="visualization" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* 1. PLAN DISTRIBUTION (Improved Donut Chart) */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-purple-500" /> Plan Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={normalizedPlanData} // 👈 Naya normalized data yahan use karein
                        cx="50%"
                        cy="45%"
                        innerRadius={70}  // Inner radius badhaya (Donut look)
                        outerRadius={100}
                        paddingAngle={5}   // Sections ke beech gap
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`} // Labels ko informative banaya
                      >
                        {/* Map function mein bhi normalizedPlanData use karein */}
                        {normalizedPlanData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 2. CLIENT STATUS OVERVIEW (Modern Horizontal Bar) */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800">Client Status Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={safeData.clientStatus || []} 
                      layout="vertical" 
                      margin={{ left: 30, right: 30, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide /> {/* X-Axis hide kiya clean look ke liye */}
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Bar 
                        dataKey="value" 
                        barSize={40}  // Bar ko thoda mota kiya
                        radius={[0, 10, 10, 0]} // Round edges
                        label={{ position: 'right', fill: '#1e293b', fontWeight: 'bold' }} // Bar ke aage value dikhao
                      >
                        {(safeData.clientStatus || []).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name.toLowerCase().includes('active') ? '#10b981' : '#f43f5e'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
            </div>
          </TabsContent>
          {/* --- CHANGED END --- */}

        </Tabs>
      )}
    </div>
  ); 
}
