
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons (Merged from both codes)
import { 
  TrendingUp, TrendingDown, Wallet, Building2, Smartphone, 
  CheckCircle, Users, Landmark, AlertCircle, LogOut, Loader2,
  CreditCard
} from 'lucide-react';

// Chart
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Utils
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/hooks/useCurrency';

export default function ClientDashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState({
    netProfit: 0, totalIncome: 0, totalExpense: 0, margin: "0",
    cashBal: 0, bankBal: 0, upiBal: 0, depositTotal: 0, pendingLoans: 0,
    activeMembers: 0, health: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  // 🚀 LOGIC: LocalStorage Data Fetching (Common in both codes)
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const savedUser = localStorage.getItem('current_user');
      if (!savedUser) {
        router.push('/login');
        return;
      }
      
      const profile = JSON.parse(savedUser);
      setUser(profile);

      // Resolve Society ID (Treasurer ho ya Owner)
      const societyId = profile.role === 'treasurer' ? profile.client_id : profile.id;

      // Fetch Stats from our API (RLS Bypass)
      const res = await fetch(`/api/admin/clients/${societyId}/stats`);
      const data = await res.json();

      if (res.ok && data.success) {
        // Calculate Margin
        const marginVal = data.debug?.income > 0 
          ? ((data.netProfit / data.debug.income) * 100).toFixed(1) 
          : "0";

        setFinancials({
          netProfit: data.netProfit,
          totalIncome: data.debug?.income || 0,
          totalExpense: data.debug?.expense || 0,
          margin: marginVal,
          cashBal: data.debug?.ops || 0, // Simplified mapping
          bankBal: 0, // These will come from your mode-wise logic if needed
          upiBal: 0,
          depositTotal: 0, 
          pendingLoans: data.loanCount || 0,
          activeMembers: data.memberCount || 0,
          health: data.healthScore || 0
        });

        setChartData([
          { month: 'Current', amount: data.debug?.income || 0 }
        ]);
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Helper from Code 2
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading && !user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500 h-10 w-10" />
      <p className="text-slate-400 mt-4">Loading Financial Overview...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. HEADER SECTION (Code 1 UI + Code 2 Controls) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{user?.society_name || 'My Society'}</h1>
          <p className="text-slate-400 mt-1">Financial Overview • {user?.name}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block mr-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">SYSTEM DATE</p>
            <p className="text-lg font-bold text-slate-200">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          
          {/* Code 2 Controls Integrated */}
          <Link href="/subscription">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* 2. MAIN KPI CARDS (Matches Code 1 Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={`border-l-4 bg-slate-900/50 border-slate-800 ${financials.netProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-400">Net Profit</p>
            <h3 className={`text-3xl font-bold mt-2 ${financials.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(financials.netProfit)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Actual Earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-400">Total Income</p>
            <h3 className="text-3xl font-bold text-emerald-400 mt-2">{formatCurrency(financials.totalIncome)}</h3>
            <div className="flex items-center text-[10px] text-emerald-500 mt-1"><TrendingUp className="w-3 h-3 mr-1"/> Interest + Fines</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-400">Total Expense</p>
            <h3 className="text-3xl font-bold text-red-400 mt-2">{formatCurrency(financials.totalExpense)}</h3>
            <div className="flex items-center text-[10px] text-red-500 mt-1"><TrendingDown className="w-3 h-3 mr-1"/> Ops + Liability</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-slate-400">Margin</p>
            <h3 className="text-3xl font-bold text-blue-400 mt-2">{financials.margin}%</h3>
            <p className="text-[10px] text-slate-500 mt-1">Health Indicator</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. LIQUIDITY POSITION SECTION (Matches Code 1 Screenshot) */}
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Landmark className="w-6 h-6 text-orange-500" /> Liquidity Position
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#064e3b]/20 border-emerald-900/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center text-emerald-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Cash In Hand</span>
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-100">{formatCurrency(financials.cashBal)}</h3>
          </CardContent>
        </Card>

        <Card className="bg-[#1e3a8a]/20 border-blue-900/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center text-blue-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Bank</span>
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-blue-100">{formatCurrency(financials.bankBal)}</h3>
          </CardContent>
        </Card>

        <Card className="bg-[#4c1d95]/20 border-purple-900/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center text-purple-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">UPI</span>
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-purple-100">{formatCurrency(financials.upiBal)}</h3>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-center text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Total Liquidity</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(financials.cashBal + financials.bankBal + financials.upiBal)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* 4. SYSTEM STATUS & CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Alert className="bg-orange-950/20 border-orange-900 text-orange-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold">System Status</AlertTitle>
            <AlertDescription className="text-xs opacity-80">
              {financials.pendingLoans} active loans.
            </AlertDescription>
          </Alert>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Total Deposits</p>
                <h4 className="text-2xl font-bold text-white mt-1">{formatCurrency(financials.depositTotal)}</h4>
              </div>
              <Users className="w-10 h-10 text-orange-500 opacity-50" />
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
