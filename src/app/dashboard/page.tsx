'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, Wallet, Building2, Smartphone, 
  CheckCircle, Users, Landmark, AlertCircle, LogOut 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

// ------------------------------------------------------------------
// 2️⃣ HELPER FUNCTIONS
// ------------------------------------------------------------------

function getMonthlyKey() {
  const now = new Date();
  return `monthly_summary_${now.getFullYear()}_${now.getMonth() + 1}`;
}

function getMonthlyBannerKey() {
  const now = new Date()
  return `monthly_banner_closed_${now.getFullYear()}_${now.getMonth() + 1}`
}

function getOverdueMembers(members: any[], gracePeriod: number) {
  const today = new Date();
  return members.filter(m => {
    if (!m.last_payment_date) return false;
    const lastPaid = new Date(m.last_payment_date);
    const dueDate = new Date(lastPaid);
    dueDate.setDate(dueDate.getDate() + gracePeriod);
    return today > dueDate;
  });
}

function getRiskyLoans(loans: any[]) {
  return loans.filter(l => {
    if (!l.outstanding_amount) return false;
    return (
      l.missed_installments >= 2 ||
      l.outstanding_amount > (l.loan_amount * 0.8)
    );
  });
}

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------

export default function ClientDashboard() {
  const router = useRouter();
  const { formatCurrency, symbol } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  const [membersData, setMembersData] = useState<any[]>([]);
  const [loansData, setLoansData] = useState<any[]>([]);
  const [transactionsData, setTransactionsData] = useState<any[]>([]);
  const [showMonthlyBanner, setShowMonthlyBanner] = useState(false);

  // ✅ UPDATED STATE: Using isImpersonating
  const [isImpersonating, setIsImpersonating] = useState(false);

  const [financials, setFinancials] = useState({
    netProfit: 0,
    totalIncome: 0,
    totalExpense: 0,
    cashBal: 0,
    bankBal: 0,
    upiBal: 0,
    depositTotal: 0,
    pendingLoans: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  // ✅ UPDATED USE EFFECT: Direct Auth Check & Fetch Logic
  useEffect(() => {
    const init = async () => {
        try {
            setLoading(true);

            // 🚀 1. SABSE ZAROORI: Seedha Supabase Auth se Current User lo
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error("No active session found");
                router.push('/login');
                return;
            }

            // 🚀 2. Is ID ke base par database se Profile fetch karo
            const { data: userData, error: dbError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', user.id) 
                .maybeSingle();

            if (!userData) {
                const { data: memberData } = await supabase
                    .from('members')
                    .select('*')
                    .eq('auth_user_id', user.id)
                    .maybeSingle();
                
                if (memberData) {
                    const { data: parentClient } = await supabase.from('clients').select('*').eq('id', memberData.client_id).single();
                    setClientData(parentClient);
                    await fetchAndCalculate(memberData.client_id, memberData.role, parentClient?.role_permissions);
                } else {
                    router.push('/login');
                    return;
                }
            } else {
                setClientData(userData);
                let activeClientId = userData.role === 'client' ? userData.id : userData.client_id;
                
                let perms = [];
                if (userData.role === 'treasurer') {
                    perms = typeof userData.role_permissions === 'string' 
                        ? JSON.parse(userData.role_permissions)?.treasurer || []
                        : userData.role_permissions?.treasurer || [];
                }

                await fetchAndCalculate(activeClientId, userData.role, perms);
            }

        } catch(e) {
            console.error("Dashboard Init Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAndCalculate = async (userId: string, userRole: string, permissions: any[]) => {
        const canViewPassbook = userRole === 'client' || permissions.includes('VIEW_PASSBOOK');
        const canViewLoans = userRole === 'client' || permissions.includes('VIEW_LOANS');
        const canViewExpenses = userRole === 'client' || permissions.includes('MANAGE_EXPENSES');
        const canViewMembers = userRole === 'client' || permissions.includes('VIEW_MEMBERS');

        const [passbookRes, expenseRes, loansRes, membersRes, adminFundRes] = await Promise.all([
            canViewPassbook ? supabase.from('passbook_entries').select('*').eq('client_id', userId) : Promise.resolve({ data: [] }),
            canViewExpenses ? supabase.from('expenses_ledger').select('*').eq('client_id', userId) : Promise.resolve({ data: [] }),
            canViewLoans ? supabase.from('loans').select('*').eq('client_id', userId) : Promise.resolve({ data: [] }),
            canViewMembers ? supabase.from('members').select('*').eq('client_id', userId) : Promise.resolve({ data: [] }),
            canViewExpenses ? supabase.from('admin_fund_ledger').select('*').eq('client_id', userId) : Promise.resolve({ data: [] })
        ]);

        setMembersData(membersRes.data || []);
        setLoansData(loansRes.data || []);
        setTransactionsData(passbookRes.data || []); 

        calculateFinancials(
            passbookRes.data || [], 
            expenseRes.data || [], 
            loansRes.data || [],
            membersRes.data || [],
            adminFunds.data || []
        );
    };

    init();
  }, [router]);  

  // ✅ UPDATED CHECK LOGIC: Strict check for impersonation
  useEffect(() => {
    const checkImpersonation = async () => {
      try {
        const res = await fetch('/api/admin/restore-session');
        const data = await res.json();

        // ✅ FIX: sirf tab true jab adminSession hai + user client hai
        if (res.ok && data?.isImpersonating === true) {
          setIsImpersonating(true);
        } else {
          setIsImpersonating(false);
        }
      } catch {
        setIsImpersonating(false);
      }
    };

    checkImpersonation();
  }, []);

  // Banner Logic
  useEffect(() => {
    const key = getMonthlyBannerKey()
    if (!localStorage.getItem(key)) {
      setShowMonthlyBanner(true)
    }
  }, [])

  function closeMonthlyBanner() {
    const key = getMonthlyBannerKey()
    localStorage.setItem(key, 'closed')
    setShowMonthlyBanner(false)
  }

  // Monthly Summary
  useEffect(() => {
    if (!membersData || !loansData || !transactionsData) return
    const monthlyKey = getMonthlyKey()
    if (localStorage.getItem(monthlyKey)) return

    const totalDeposits = transactionsData.reduce((sum, t) => sum + Number(t.deposit_amount || 0), 0);
    const activeLoans = loansData.filter(l => l.status === 'active' || (l.remaining_balance > 0 && l.status !== 'closed'));
    const riskyLoans = getRiskyLoans(loansData)
    const overdueMembers = getOverdueMembers(membersData, 10)

    if(loading === false && transactionsData.length > 0) {
        toast.info('📅 Monthly Summary', {
        description: `
    💰 Deposits: ₹${totalDeposits}
    🏦 Active Loans: ${activeLoans.length}
    ⚠️ Overdue Members: ${overdueMembers.length}
    🚨 Risky Loans: ${riskyLoans.length}
        `,
        duration: 8000,
        })
        localStorage.setItem(monthlyKey, 'shown')
    }
  }, [membersData, loansData, transactionsData, loading])

  // Alerts
  useEffect(() => {
    if (!membersData.length && !loansData.length) return;
    if (!clientData) return;
    const alreadyShown = sessionStorage.getItem('dashboard_alerts_shown');
    if (alreadyShown) return;

    const gracePeriod = clientData.grace_period_day || 10;
    const overdueMembers = getOverdueMembers(membersData, gracePeriod);
    const riskyLoans = getRiskyLoans(loansData);

    let hasAlert = false;
    if (overdueMembers.length > 0) {
      toast.warning(`⚠️ ${overdueMembers.length} member(s) have overdue dues`, { description: 'Please review pending installments', duration: 6000 });
    }
    if (riskyLoans.length > 0) {
      toast.error(`🚨 ${riskyLoans.length} loan(s) at risk of default`, { description: 'Immediate attention required', duration: 7000 });
    }
    sessionStorage.setItem('dashboard_alerts_shown', 'true');
  }, [membersData, loansData, clientData]);


  // ✅ FINANCIAL LOGIC
  const calculateFinancials = (passbook: any[], expenses: any[], loans: any[], membersList: any[], adminFunds: any[]) => {
    
    let realIncome = 0; 
    let cashExpense = 0;
    let cash = 0, bank = 0, upi = 0;
    let pendingLoanCount = 0;
    let totalDepositsCollected = 0; 
    const monthlyMap: {[key: string]: number} = {};

    passbook.forEach(t => {
        const totalAmt = Number(t.total_amount) || 0; 
        const interest = Number(t.interest_amount) || 0;
        const fine = Number(t.fine_amount) || 0;
        const deposit = Number(t.deposit_amount) || 0;

        realIncome += (interest + fine);
        totalDepositsCollected += deposit;

        const mode = (t.payment_mode || '').toLowerCase().trim();
        if (mode.includes('cash')) cash += totalAmt;
        else if (mode.includes('bank') || mode.includes('cheque')) bank += totalAmt;
        else if (mode.includes('upi') || mode.includes('online')) upi += totalAmt;

        const date = t.date ? new Date(t.date) : new Date(t.created_at);
        const month = date.toLocaleString('default', { month: 'short' });
        monthlyMap[month] = (monthlyMap[month] || 0) + totalAmt;
    });

    expenses.forEach(e => {
        const amt = Number(e.amount) || 0;
        const type = (e.type || '').toUpperCase().trim();
        
        if (type === 'EXPENSE') {
            cashExpense += amt;
            cash -= amt; 
        } 
        else if (type === 'INCOME') {
            realIncome += amt;
            cash += amt; 
        }
    });

    adminFunds.forEach(f => {
        const amt = Number(f.amount) || 0;
        const type = (f.type || '').toUpperCase().trim();

        if (type === 'INJECT') {
            cash += amt;
        } else if (type === 'WITHDRAW') {
            cash -= amt;
        }
    });

    loans.forEach(l => {
        const outstanding = Number(l.remaining_balance) || 0;
        const principal = Number(l.amount) || 0; 
        const mode = (l.payment_mode || 'cash').toLowerCase(); 

        if (l.status === 'active' || (outstanding > 0 && l.status !== 'closed')) {
             pendingLoanCount++;
        }
        
        if (mode.includes('cash')) {
            cash -= principal;
        } else if (mode.includes('bank') || mode.includes('cheque')) {
            bank -= principal;
        } else if (mode.includes('upi') || mode.includes('online')) {
            upi -= principal;
        } else {
            cash -= principal; 
        }
    });

    let maturityLiability = 0;
    const memberDeposits: {[key: string]: any[]} = {};
    passbook.forEach(p => {
        if(p.member_id && Number(p.deposit_amount) > 0) {
            if(!memberDeposits[p.member_id]) memberDeposits[p.member_id] = [];
            memberDeposits[p.member_id].push(p);
        }
    });

    Object.keys(memberDeposits).forEach(memberId => {
        const deposits = memberDeposits[memberId];
        const memberInfo = membersList.find(m => m.id === memberId);

        if (deposits.length > 0) {
             const sorted = deposits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
             const monthlyDeposit = Number(sorted[0].deposit_amount || 0);
             const tenureMonths = 36;
             
             const isOverride = memberInfo?.maturity_is_override || false;
             const manualAmount = Number(memberInfo?.maturity_manual_amount || 0);

             let settledInterest = 0;
             if (isOverride && manualAmount > 0) {
                 settledInterest = manualAmount;
             } else {
                 const totalPrincipal = monthlyDeposit * tenureMonths;
                 settledInterest = totalPrincipal * 0.12; 
             }
             
             const monthlyInterestShare = settledInterest / tenureMonths;
             const depositCount = deposits.length;
             maturityLiability += (monthlyInterestShare * depositCount);
        }
    });

    const totalExpenseFinal = cashExpense + Number(maturityLiability.toFixed(2));
    const netProfitFinal = realIncome - totalExpenseFinal;
    const chart = Object.keys(monthlyMap).map(m => ({ month: m, amount: monthlyMap[m] }));

    setFinancials({
        netProfit: netProfitFinal,
        totalIncome: realIncome, 
        totalExpense: totalExpenseFinal,
        cashBal: cash, 
        bankBal: bank,
        upiBal: upi,
        depositTotal: totalDepositsCollected,
        pendingLoans: pendingLoanCount
    });
    setChartData(chart);
  };

  // ✅ NEW HANDLER: Return to Admin
  const handleReturnToAdmin = async () => {
    try {
      const res = await fetch('/api/admin/restore-session');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const session = data.session;

      // ✅ Restore admin session
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      // ✅ Go back to admin
      window.location.href = '/admin';

    } catch (err) {
      console.error(err);
      alert("Failed to return to admin");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('current_member'); 
    router.push('/login');
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">Loading Dashboard...</div>;
  if (!clientData) return null;

  const totalLiquidity = financials.cashBal + financials.bankBal + financials.upiBal;
  const profitMargin = financials.totalIncome > 0 
    ? ((financials.netProfit / financials.totalIncome) * 100).toFixed(1) 
    : "0";
    
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const totalDeposits = Array.isArray(transactionsData)
    ? transactionsData.reduce((sum, t) => sum + Number(t?.deposit_amount ?? 0), 0)
    : 0;
  
  const activeLoans = loansData.filter(l => 
    l.status === 'active' || (l.remaining_balance > 0 && l.status !== 'closed')
  );
  
  const overdueMembers = getOverdueMembers(membersData, 10);
  const riskyLoans = getRiskyLoans(loansData);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-6 transition-colors duration-300">
      
      {showMonthlyBanner && !loading && (
        <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-blue-800 dark:text-blue-200 text-lg">
              📅 This Month Summary
            </CardTitle>
            <button
              onClick={closeMonthlyBanner}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="text-slate-700 dark:text-slate-300">💰 Deposits: ₹{totalDeposits}</div>
            <div className="text-slate-700 dark:text-slate-300">🏦 Active Loans: {activeLoans.length}</div>
            <div className="text-slate-700 dark:text-slate-300">⚠️ Overdue Members: {overdueMembers.length}</div>
            <div className="text-slate-700 dark:text-slate-300">🚨 Risky Loans: {riskyLoans.length}</div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{clientData.society_name || 'My Society'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Financial Overview • {clientData.name}</p>
        </div>
        <div className="flex items-center gap-4">
            {/* ✅ BACK TO ADMIN BUTTON (Updated State) */}
            {isImpersonating && (
              <Button onClick={handleReturnToAdmin} variant="outline" className="gap-2 text-sm font-medium">
                <LogOut className="w-4 h-4 rotate-180" />
                Back to Admin
              </Button>
            )}
            
            <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase">SYSTEM DATE</p>
            <p className="font-bold text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut className="w-5 h-5"/></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`border-l-4 dark:bg-slate-900 dark:border-slate-800 ${financials.netProfit >= 0 ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-300">Net Profit</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${financials.netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {formatCurrency(financials.netProfit)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Actual Earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-400">Total Income</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(financials.totalIncome)}</div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1"><TrendingUp className="w-3 h-3 mr-1"/> Interest + Fines</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-400">Total Expense</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(financials.totalExpense)}</div>
            <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-1"><TrendingDown className="w-3 h-3 mr-1"/> Ops + Liability</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-400">Margin</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${Number(profitMargin) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{profitMargin}%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Health Indicator</p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-4">
        <Landmark className="w-5 h-5 text-orange-600 dark:text-orange-400" /> Liquidity Position
      </h3>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Cash In Hand</span>
                 <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(financials.cashBal)}</div>
           </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Bank</span>
                 <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatCurrency(financials.bankBal)}</div>
           </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">UPI</span>
                 <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">{formatCurrency(financials.upiBal)}</div>
           </CardContent>
        </Card>

        <Card className="bg-slate-900 dark:bg-black text-white border border-slate-700 dark:border-slate-800">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-slate-300 uppercase">Total Liquidity</span>
                 <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totalLiquidity)}</div>
           </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <div className="space-y-4">
            <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
               <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
               <AlertTitle className="text-yellow-800 dark:text-yellow-400">System Status</AlertTitle>
               <AlertDescription className="text-yellow-700 dark:text-yellow-500">
                 {financials.pendingLoans > 0 
                   ? `${financials.pendingLoans} active loans.` 
                   : "System updated live from Supabase."}
               </AlertDescription>
            </Alert>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
               <CardContent className="p-4 flex justify-between items-center">
                  <div><p className="text-xs text-gray-500 dark:text-gray-400">Total Deposits</p><h4 className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(financials.depositTotal)}</h4></div>
                  <Users className="text-orange-500" />
               </CardContent>
            </Card>
         </div>

         <Card className="col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader><CardTitle className="text-slate-900 dark:text-white">Monthly Performance</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.length > 0 ? chartData : [{month: 'No Data', amount: 0}]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  />
                  <Bar dataKey="amount" fill="#10B981" radius={[4,4,0,0]} name="Income" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
