'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Icons (Merged)
import { 
  TrendingUp, TrendingDown, Wallet, Building2, Smartphone, 
  CheckCircle, Users, Landmark, AlertCircle, LogOut, Loader2,
  CreditCard, Calendar, Activity, ArrowUpRight, ArrowDownRight,
  ShieldAlert
} from 'lucide-react';

// Charts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Utils
import { useCurrency } from '@/hooks/useCurrency';
import { useReportLogic } from '@/hooks/useReportLogic';

export default function ClientDashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  
  const [user, setUser] = useState<any>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // ✅ Shared Reports Logic
  const {
    loading,
    auditData,
    members,
    passbookEntries
  } = useReportLogic();

  // User Setup Effect
  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (!savedUser) {
      router.push('/login');
      return;
    }

    const profile = JSON.parse(savedUser);
    setUser(profile);

    setIsImpersonating(
      localStorage.getItem('is_admin_impersonating') === 'true'
    );
  }, [router]);

  // ✅ Dashboard Financials from Reports Logic
  const summary = auditData?.summary || {};

  const income_interest = summary?.income?.interest || 0;
  const income_fine = summary?.income?.fine || 0;
  const income_other = summary?.income?.other || 0;

  const exp_ops = summary?.expenses?.operational || 0;
  const exp_maturity = summary?.expenses?.maturity || 0;

  const totalIncome = summary?.income?.total || 0;
  const totalExpense = summary?.expenses?.total || 0;

  const netProfit = totalIncome - totalExpense;

  const margin = totalIncome > 0
    ? ((netProfit / totalIncome) * 100).toFixed(1)
    : "0";

  const cashBal = auditData?.modeStats?.cashBal || 0;
  const bankBal = auditData?.modeStats?.bankBal || 0;
  const upiBal = auditData?.modeStats?.upiBal || 0;

  const totalLiquidity = cashBal + bankBal + upiBal;

  const depositTotal = passbookEntries.reduce(
    (acc: number, e: any) =>
      acc + (Number(e.depositAmount || e.deposit_amount) || 0),
    0
  );

  const activeLoans = auditData?.loans?.length || 0;

  const activeMembers =
    members.filter((m: any) => m.status === 'active').length || 0;

  const health = activeMembers > 0 ? 85 : 0;

  const financials = {
    netProfit,
    totalIncome,
    totalExpense,
    interestIncome: income_interest,
    fineIncome: income_fine,
    maintenanceIncome: income_other,
    operationalCost: exp_ops,
    maturityLiability: exp_maturity,
    margin,
    cashBal,
    bankBal,
    upiBal,
    totalLiquidity,
    depositTotal,
    activeLoans,
    activeMembers,
    health
  };

  const chartData = [
    {
      name: 'Income',
      amount: totalIncome,
      color: '#10b981'
    },
    {
      name: 'Expense',
      amount: totalExpense,
      color: '#ef4444'
    }
  ];

  const handleLogout = async () => {
    localStorage.clear();
    // Note: supabase.auth.signOut() removed because supabase import was removed.
    window.location.href = '/login';
  };

  if (loading && !user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      <p className="text-slate-500 mt-4 animate-pulse">Synchronizing Society Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. TOP HEADER & NAVIGATION (Code 2 UI) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-xl"><Landmark className="text-white w-6 h-6"/></div>
             <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {user?.society_name || 'Society Dashboard'}
             </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            Financial Overview • {user?.name} ({user?.role})
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-left md:text-right px-4 border-r dark:border-slate-700 hidden sm:block">
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">SYSTEM DATE</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          
          <Link href="/dashboard/subscription">
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
              <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
              Subscription
            </Button>
          </Link>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      {/* 2. MAIN KPI CARDS (Code 2 UI with Code 1 Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card className={`border-l-4 bg-white dark:bg-slate-900 shadow-md ${financials.netProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
               {financials.netProfit >= 0 ? <ArrowUpRight className="text-green-500 w-4 h-4"/> : <ArrowDownRight className="text-red-500 w-4 h-4"/>}
            </div>
            <h3 className={`text-3xl font-black mt-2 ${financials.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(financials.netProfit)}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Actual Society Earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 shadow-md border-slate-100 dark:border-slate-800">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Income</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(financials.totalIncome)}</h3>
            <div className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
               <TrendingUp className="w-3 h-3 mr-1"/> Interest: {formatCurrency(financials.interestIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 shadow-md border-slate-100 dark:border-slate-800">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expense</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(financials.totalExpense)}</h3>
            <div className="flex items-center text-[10px] text-red-500 mt-1 font-bold">
               <TrendingDown className="w-3 h-3 mr-1"/> Maturity: {formatCurrency(financials.maturityLiability)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 shadow-md border-slate-100 dark:border-slate-800">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profit Margin</p>
            <h3 className={`text-3xl font-black mt-2 ${Number(financials.margin) >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
               {financials.margin}%
            </h3>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
               <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, Number(financials.margin)))}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. LIQUIDITY POSITION SECTION (Code 2 UI with Code 1 Logic) */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-orange-500" /> Liquidity Position (Live)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
            <CardContent className="p-6">
                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Cash In Hand</span>
                <Wallet className="w-5 h-5 opacity-70" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{formatCurrency(financials.cashBal)}</h3>
            </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
            <CardContent className="p-6">
                <div className="flex justify-between items-center text-blue-700 dark:text-blue-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Bank Balance</span>
                <Building2 className="w-5 h-5 opacity-70" />
                </div>
                <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-200">{formatCurrency(financials.bankBal)}</h3>
            </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/50">
            <CardContent className="p-6">
                <div className="flex justify-between items-center text-purple-700 dark:text-purple-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">UPI / Online</span>
                <Smartphone className="w-5 h-5 opacity-70" />
                </div>
                <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-200">{formatCurrency(financials.upiBal)}</h3>
            </CardContent>
            </Card>

            <Card className="bg-slate-900 dark:bg-black border-slate-800 shadow-xl">
            <CardContent className="p-6">
                <div className="flex justify-between items-center text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-green-400">Total Liquidity</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white">{formatCurrency(financials.totalLiquidity)}</h3>
            </CardContent>
            </Card>
        </div>
      </div>

      {/* 4. STATS & PERFORMANCE GRID (Code 2 UI with Code 1 Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: System Status & Deposits */}
        <div className="space-y-6">
          <Alert className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            <AlertTitle className="font-bold text-slate-900 dark:text-white">System Status</AlertTitle>
            <AlertDescription className="text-xs text-slate-500">
              {financials.activeLoans > 0 
                ? `Attention: You have ${financials.activeLoans} active loans in process.` 
                : "All society systems are synchronized with Supabase."}
            </AlertDescription>
          </Alert>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-6 flex justify-between items-center relative">
              <div className="z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Deposits</p>
                <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(financials.depositTotal)}</h4>
                <p className="text-[10px] text-green-500 font-bold mt-2">+ Real-time Collection</p>
              </div>
              <Users className="w-16 h-16 text-slate-100 dark:text-slate-800 absolute right-4 bottom-2 z-0" />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
             <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-400 uppercase">Account Health</CardTitle></CardHeader>
             <CardContent>
                <div className="flex items-end justify-between">
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white">{financials.health}%</h3>
                   <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none rounded-lg">Operational</Badge>
                </div>
                <Progress value={financials.health} className="h-2 mt-4 bg-slate-100 dark:bg-slate-800" />
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Monthly Chart */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 p-6">
            <div>
               <CardTitle className="text-slate-900 dark:text-white">Society Performance</CardTitle>
               <p className="text-xs text-slate-500 mt-1">Income vs Expense Real-time Analysis</p>
            </div>
            <TrendingUp className="text-blue-500 w-5 h-5" />
          </CardHeader>
          <CardContent className="p-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [formatCurrency(value), 'Amount']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
