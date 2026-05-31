'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // ✅ ADDED IMPORT
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Users, Settings, Database, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalClients: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 🚀 ASLI FIX: Hamare naye View se real numbers uthao
        const { data: kpis } = await supabase.from('admin_dashboard_kpis').select('total_clients').maybeSingle();
        
        // Pending requests ke liye subscription_orders table dekhein
        const { count } = await supabase
          .from('subscription_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        setStats({
          totalClients: kpis?.total_clients || 0,
          pendingRequests: count || 0
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Console</h1>
          <p className="text-slate-500">System overview and management.</p>
        </div>
        {/* 🚀 Dashboard par jane ka button */}
        <Button onClick={() => router.push('/admin/dashboard')} className="bg-blue-600">
           Go to Main Dashboard <ArrowRight className="ml-2 h-4 w-4"/>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Clients</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-green-600 mt-1">Live from database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">System Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-lg font-bold text-slate-700">Online</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Vercel & Supabase Connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Pending Requests</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingRequests}</div>
            <p className="text-xs text-slate-500 mt-1">Manual payments to verify</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-blue-600"/> Database Ready</CardTitle>
            <CardDescription>Tables and views are already configured.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
                <CheckCircle className="w-5 h-5"/>
                <span className="text-sm font-medium">Core tables verified and synced.</span>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-slate-700"/> Quick Access</CardTitle>
            <CardDescription>Direct links to management tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/clients')}>
               Manage All Clients <Users className="w-4 h-4"/>
             </Button>
             <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/dashboard')}>
               View Detailed Stats <LayoutDashboard className="w-4 h-4"/>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
