'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

export default function ClientDashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Detailed Financials State (Matching Code 2 UI requirements)
  const [financials, setFinancials] = useState({
    netProfit: 0,
    totalIncome: 0,
    totalExpense: 0,
    interestIncome: 0,
    fineIncome: 0,
    maintenanceIncome: 0,
    operationalCost: 0,
    maturityLiability: 0,
    margin: "0",
    cashBal: 0,
    bankBal: 0,
    upiBal: 0,
    totalLiquidity: 0,
    depositTotal: 0,
    activeLoans: 0,
    activeMembers: 0,
    health: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  // 🚀 CORE LOGIC: Using Code 1's Exact Manual Calculation Logic
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

      // Impersonation check (Code 2 Feature)
      setIsImpersonating(localStorage.getItem('is_admin_impersonating') === 'true');

      const societyId = profile.role === 'treasurer' ? profile.client_id : profile.id;

      // 1. FETCH ALL RAW DATA (Code 1 Logic: Manual Calculation)
      const [passbookRes, ledgerRes, loansRes, membersRes, fundRes] = await Promise.all([
        supabase.from('passbook_entries').select('*').eq('client_id', societyId),
        supabase.from('expenses_ledger').select('*').eq('client_id', societyId),
        supabase.from('loans').select('*').eq('client_id', societyId).eq('status', 'active'),
        supabase.from('members').select('*').eq('client_id', societyId).eq('status', 'active'), // Added for Maturity Calc
        supabase.from('admin_fund_ledger').select('*').eq('client_id', societyId)
      ]);

      let income_interest = 0, income_fine = 0, income_other = 0;
      let exp_ops = 0, exp_maturity = 0;
      let cash = 0, bank = 0, upi = 0, deposits = 0;

      // 2. PROCESS PASSBOOK (Code 1 Logic for Breakdown + Code 2 for Liquidity)
      passbookRes.data?.forEach(t => {
        const total = Number(t.total_amount) || 0;
        const interest = Number(t.interest_amount) || 0;
        const fine = Number(t.fine_amount) || 0;
        const depAmt = Number(t.deposit_amount) || 0;
        const mode = (t.payment_mode || 'cash').toLowerCase().trim();
        
        // Income Breakdown (Code 1)
        income_interest += interest;
        income_fine += fine;
        deposits += depAmt;

        // Liquidity IN (Code 2 Mode Logic)
        if (mode.includes('bank')) bank += total;
        else if (mode.includes('upi')) upi += total;
        else cash += total;
      });

      // 3. PROCESS EXPENSES LEDGER (Code 1 Logic for Ops/Income + Code 2 for Liquidity)
      ledgerRes.data?.forEach(e => {
        const amt = Number(e.amount) || 0;
        const mode = (e.payment_mode || 'cash').toLowerCase();
        if (e.type === 'INCOME') {
          income_other += amt;
          // Liquidity IN
          if (mode.includes('bank')) bank += amt;
          else if (mode.includes('upi')) upi += amt;
          else cash += amt;
        } else {
          exp_ops += amt;
          // Liquidity OUT
          if (mode.includes('bank')) bank -= amt;
          else if (mode.includes('upi')) upi -= amt;
          else cash -= amt;
        }
      });

      // 4. PROCESS LOANS (OUT) - Code 2 Liquidity Logic
      loansRes.data?.forEach(l => {
        const amt = Number(l.amount) || 0;
        const mode = (l.payment_mode || 'cash').toLowerCase();
        if (mode.includes('bank')) bank -= amt;
        else if (mode.includes('upi')) upi -= amt;
        else cash -= amt;
      });

      // 5. ADMIN FUND (IN/OUT) - Code 2 Liquidity Logic
      fundRes.data?.forEach(f => {
        const amt = Number(f.amount) || 0;
        if (f.type === 'INJECT') cash += amt;
        else cash -= amt;
      });

      // 6. MATURITY LIABILITY CALCULATION (Code 1 Specific Logic)
      membersRes.data?.forEach(m => {
        const monthlyDep = Number(m.monthly_deposit_amount || 0);
        const count = passbookRes.data?.filter(p => p.member_id === m.id && Number(p.deposit_amount) > 0).length || 0;
        let settledInt = m.maturity_is_override ? Number(m.maturity_manual_amount) : (monthlyDep * 36 * 0.12);
        exp_maturity += (settledInt / 36) * count;
      });

      // 7. AGGREGATION (Code 1 Logic)
      const totalInc = income_interest + income_fine + income_other;
      const totalExp = exp_ops + exp_maturity;
      const netProf = totalInc - totalExp;
      const marginVal = totalInc > 0 ? ((netProf / totalInc) * 100).toFixed(1) : "0";

      setFinancials({
        netProfit: netProf,
        totalIncome: totalInc,
        totalExpense: totalExp,
        interestIncome: income_interest,
        fineIncome: income_fine,
        maintenanceIncome: income_other, // Mapped from income_other
        operationalCost: exp_ops,
        maturityLiability: exp_maturity,
        margin: marginVal,
        cashBal: cash,
        bankBal: bank,
        upiBal: upi,
        totalLiquidity: cash + bank + upi,
        depositTotal: deposits,
        activeLoans: loansRes.data?.length || 0,
        activeMembers: membersRes.data?.length || 0,
        health: membersRes.data?.length ? 85 : 0 // Fallback health logic from Code 1
      });

      // Dynamic Chart Data
      setChartData([
        { name: 'Income', amount: totalInc, color: '#10b981' },
        { name: 'Expense', amount: totalExp, color: '#ef4444' }
      ]);
    } catch (err) {
      console.error("Dashboard Error:", err);
      toast.error("Failed to sync financial data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleLogout = async () => {
    localStorage.clear();
    await supabase.auth.signOut();
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
