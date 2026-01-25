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
// 1️⃣ IMPORT TOAST
import { toast } from 'sonner';

// 2️⃣ HELPER FUNCTIONS (Outside Component)

// 🆕 Helper function for Monthly Key
function getMonthlyKey() {
  const now = new Date();
  return `monthly_summary_${now.getFullYear()}_${now.getMonth() + 1}`;
}

// 🆕 STEP 3.1 – Monthly key reuse karo (Banner Key)
function getMonthlyBannerKey() {
  const now = new Date()
  return `monthly_banner_closed_${now.getFullYear()}_${now.getMonth() + 1}`
}

// 🔴 Check overdue members
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

// 🔴 Check risky loans
function getRiskyLoans(loans: any[]) {
  return loans.filter(l => {
    if (!l.outstanding_amount) return false;

    // simple rule (safe + understandable)
    return (
      l.missed_installments >= 2 ||
      l.outstanding_amount > (l.loan_amount * 0.8)
    );
  });
}

export default function ClientDashboard() {
  const router = useRouter();
  const { formatCurrency, symbol } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  // Store raw data for Toast Logic
  const [membersData, setMembersData] = useState<any[]>([]);
  const [loansData, setLoansData] = useState<any[]>([]);
  // Store transactions for Monthly Summary Logic
  const [transactionsData, setTransactionsData] = useState<any[]>([]);

  // 🆕 STEP 3.2 – State add karo (dashboard file)
  const [showMonthlyBanner, setShowMonthlyBanner] = useState(false);

  // Initial Financial State
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

  useEffect(() => {
    const init = async () => {
        const storedUser = localStorage.getItem('current_user');
        const storedMember = localStorage.getItem('current_member');

        if (!storedUser && !storedMember) { router.push('/login'); return; }
        
        try {
            let userId = ''; // Ye society Owner ki ID hogi
            let userRole = 'client_admin';
            let permissions: string[] = [];

            if (storedUser) {
                const user = JSON.parse(storedUser);
                
                // ✅ FIXED: Search by 'id' (Primary Key) instead of 'client_id'
                // This finds the logged-in user's record specifically
                const { data: userData, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', user.id) // 🔥 Corrected Logic Here
                    .single();

                if (error || !userData) {
                    console.error('❌ User record not found:', user.id);
                    return;
                }

                setClientData(userData);
                userRole = userData.role || 'client';

                // 🔥 LOGIC TO DETERMINE DATA SOURCE
                if (userRole === 'client') {
                    // I am the boss, show my data
                    userId = userData.id; 
                } else {
                    // I am treasurer/member, show my Boss's data (client_id)
                    userId = userData.client_id;
                }

                // Load permissions if treasurer
                if (userRole === 'treasurer') {
                    // JSON parsing safety for permission string
                    try {
                        const perms = typeof userData.role_permissions === 'string' 
                            ? JSON.parse(userData.role_permissions) 
                            : userData.role_permissions;
                        permissions = perms?.treasurer || [];
                    } catch (e) { console.log('Permission parse error', e); }
                }

            } else if (storedMember) {
                // Fallback for old member login flow (if used)
                const member = JSON.parse(storedMember);
                userRole = member.role;
                // Fetch owner data
                const { data: client } = await supabase.from('clients').select('*').eq('id', member.client_id).single();
                setClientData(client);
                userId = member.client_id;
                
                if (member.role === 'treasurer') {
                    permissions = client?.role_permissions?.['treasurer'] || [];
                }
            }

            console.log("✅ USER ID RESOLVED:", userId); // Debugging check

            // --- FETCH DATA FOR DASHBOARD ---
            
            // 🔥 TREASURER FIX: Added "|| userRole === 'treasurer'" logic
            const canViewPassbook = userRole === 'client_admin' || userRole === 'treasurer' || permissions.includes('VIEW_PASSBOOK') || permissions.includes('View Passbook');
            const canViewLoans = userRole === 'client_admin' || userRole === 'treasurer' || permissions.includes('VIEW_LOANS') || permissions.includes('View Loans');
            const canViewExpenses = userRole === 'client_admin' || userRole === 'treasurer' || permissions.includes('MANAGE_EXPENSES') || permissions.includes('Manage Expenses');
            const canViewMembers = userRole === 'client_admin' || userRole === 'treasurer' || permissions.includes('VIEW_MEMBERS') || permissions.includes('View Members');

            // Pass resolved userId to all queries
            const [passbookRes, expenseRes, loansRes, membersRes] = await Promise.all([
                canViewPassbook ? supabase.from('passbook_entries').select('*').eq('client_id', userId) : Promise.resolve({ data: [] }),
                canViewExpenses ? supabase.from('expenses_ledger').select('*').eq('client_id', userId) : Promise.resolve({ data: [] }),
                canViewLoans ? supabase.from('loans').select('*').eq('client_id', userId) : Promise.resolve({ data: [] }),
                canViewMembers ? supabase.from('members').select('*').eq('client_id', userId) : Promise.resolve({ data: [] })
            ]);

            // Save raw data for Toast logic
            setMembersData(membersRes.data || []);
            setLoansData(loansRes.data || []);
            setTransactionsData(passbookRes.data || []); 

            calculateFinancials(
                passbookRes.data || [], 
                expenseRes.data || [], 
                loansRes.data || [],
                membersRes.data || []
            );

        } catch(e) {
            console.error("Error fetching dashboard data:", e);
        } finally {
            setLoading(false);
        }
    };
    init();
  }, [router]);

  // 🆕 STEP 3.3 – Banner visibility logic
  useEffect(() => {
    const key = getMonthlyBannerKey()
    if (!localStorage.getItem(key)) {
      setShowMonthlyBanner(true)
    }
  }, [])

  // 🆕 STEP 3.4 – Close handler
  function closeMonthlyBanner() {
    const key = getMonthlyBannerKey()
    localStorage.setItem(key, 'closed')
    setShowMonthlyBanner(false)
  }

  // 🆕 4️⃣ MONTHLY SUMMARY LOGIC
  useEffect(() => {
    if (!membersData || !loansData || !transactionsData) return

    const monthlyKey = getMonthlyKey()

    if (localStorage.getItem(monthlyKey)) return

    // 📊 calculations
    // 🔴 PROBLEM 2 FIX: Monthly Summary → Deposits galat add ho rahe
    const totalDeposits = transactionsData
      .reduce((sum, t) => sum + Number(t.deposit_amount || 0), 0);

    // ✅ FIXED: Active Loan Logic (Banner) - Checks outstanding amount too
    const activeLoans = loansData.filter(l => 
        l.status === 'active' || (l.outstanding_amount > 0 && l.status !== 'closed')
    );
    
    const riskyLoans = getRiskyLoans(loansData)
    const overdueMembers = getOverdueMembers(membersData, 10)

    // Show toast only if data is actually loaded
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

  // 3️⃣ TOAST LOGIC (Alerts)
  useEffect(() => {
    // Wait until data is loaded
    if (!membersData.length && !loansData.length) return;
    if (!clientData) return;

    // 🔐 avoid repeat alerts
    const alreadyShown = sessionStorage.getItem('dashboard_alerts_shown');
    if (alreadyShown) return;

    // Get grace period from client settings (default 10)
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


  // ✅ LOGIC: Real Profit & Maturity Liability Logic (Matches Report)
  const calculateFinancials = (passbook: any[], expenses: any[], loans: any[], membersList: any[]) => {
    
    // Variables for Calculation
    let realIncome = 0; // Interest + Fine Only
    let cashExpense = 0;
    
    // Liquidity (Cash Flow)
    let cash = 0, bank = 0, upi = 0;
    let pendingLoanCount = 0;
    let totalDepositsCollected = 0; // For Deposits Card

    const monthlyMap: {[key: string]: number} = {};

    // 1. Passbook Processing
    passbook.forEach(t => {
        const totalAmt = Number(t.total_amount) || 0; // Cash Flow
        
        const interest = Number(t.interest_amount) || 0;
        const fine = Number(t.fine_amount) || 0;
        const deposit = Number(t.deposit_amount) || 0;

        realIncome += (interest + fine);
        totalDepositsCollected += deposit;

        // Liquidity Logic (Cash Flow based on Total Amount)
        const mode = (t.payment_mode || '').toLowerCase().trim();
        if (mode.includes('cash')) cash += totalAmt;
        else if (mode.includes('bank') || mode.includes('cheque')) bank += totalAmt;
        else if (mode.includes('upi') || mode.includes('online')) upi += totalAmt;

        const date = t.date ? new Date(t.date) : new Date(t.created_at);
        const month = date.toLocaleString('default', { month: 'short' });
        monthlyMap[month] = (monthlyMap[month] || 0) + totalAmt;
    });

    // 2. Expenses Ledger Processing
    // 🔥 NET PROFIT FIX 1: Handle Case Sensitivity (Income vs INCOME)
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

    // 3. Loans Count Logic
    loans.forEach(l => {
        // 🔥 FIXED: Logic consistent with banner
        if (l.status === 'active' || (l.outstanding_amount > 0 && l.status !== 'closed')) {
             pendingLoanCount++;
        }
    });

    // --- 4. MATURITY LIABILITY CALCULATION ---
    
    let maturityLiability = 0;

    // Group deposits by Member
    const memberDeposits: {[key: string]: any[]} = {};
    passbook.forEach(p => {
        if(p.member_id && Number(p.deposit_amount) > 0) {
            if(!memberDeposits[p.member_id]) memberDeposits[p.member_id] = [];
            memberDeposits[p.member_id].push(p);
        }
    });

    // Calculate Liability per member (Using Member Settings)
    Object.keys(memberDeposits).forEach(memberId => {
        const deposits = memberDeposits[memberId];
        // Member ki details nikalo (taaki manual override check kar sakein)
        const memberInfo = membersList.find(m => m.id === memberId);

        if (deposits.length > 0) {
             // A. Monthly Amount (First deposit se)
             const sorted = deposits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
             const monthlyDeposit = Number(sorted[0].deposit_amount || 0);
             const tenureMonths = 36;
             
             // --- CRITICAL CHECK: Manual Override ---
             const isOverride = memberInfo?.maturity_is_override || false;
             const manualAmount = Number(memberInfo?.maturity_manual_amount || 0);

             let settledInterest = 0;

             if (isOverride && manualAmount > 0) {
                 settledInterest = manualAmount;
             } else {
                 const totalPrincipal = monthlyDeposit * tenureMonths;
                 settledInterest = totalPrincipal * 0.12; 
             }
             
             // C. Monthly Interest Share
             // 🔥 NET PROFIT FIX 2: REMOVED ROUNDING INSIDE LOOP
             const monthlyInterestShare = settledInterest / tenureMonths;

             // D. Count payments made
             const depositCount = deposits.length;

             // E. Current Liability (Rounding removed here)
             maturityLiability += (monthlyInterestShare * depositCount);
        }
    });

    // --- FINAL TOTALS ---
    
    // Total Expense = Ops Cost + Maturity Liability (Round ONLY at end)
    const totalExpenseFinal = cashExpense + Number(maturityLiability.toFixed(2));
    
    // Real Net Profit = Actual Income - All Expenses
    const netProfitFinal = realIncome - totalExpenseFinal;

    // Chart formatting
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

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_member'); // Clear member session too
    router.push('/login');
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">Loading Dashboard...</div>;
  if (!clientData) return null;

  const totalLiquidity = financials.cashBal + financials.bankBal + financials.upiBal;
  
  // Profit Margin Calculation (Safe Divide)
  const profitMargin = financials.totalIncome > 0 
    ? ((financials.netProfit / financials.totalIncome) * 100).toFixed(1) 
    : "0";
    
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // 📊 Prepare data for banner
  const totalDeposits = transactionsData.reduce((sum, t) => sum + Number(t.deposit_amount || 0), 0);
  
  // ✅ FIXED 1 (UI Display): Active Loans consistent with logic
  const activeLoans = loansData.filter(l => 
    l.status === 'active' || (l.outstanding_amount > 0 && l.status !== 'closed')
  );
  
  const overdueMembers = getOverdueMembers(membersData, 10);
  const riskyLoans = getRiskyLoans(loansData);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-6 transition-colors duration-300">
      
      {/* 🆕 STEP 3.5 – Dashboard TOP pe Banner UI (JSX) */}
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
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{clientData.society_name || 'My Society'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Financial Overview • {clientData.name}</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase">SYSTEM DATE</p>
            <p className="font-bold text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut className="w-5 h-5"/></Button>
        </div>
      </div>

      {/* SECTION 1: FINANCIAL HEALTH */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Net Profit Card */}
        <Card className={`border-l-4 dark:bg-slate-900 dark:border-slate-800 ${financials.netProfit >= 0 ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-300">Net Profit</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${financials.netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {formatCurrency(financials.netProfit)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Actual Earnings</p>
          </CardContent>
        </Card>

        {/* Total Income Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-400">Total Income</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(financials.totalIncome)}</div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1"><TrendingUp className="w-3 h-3 mr-1"/> Interest + Fines</div>
          </CardContent>
        </Card>

        {/* Total Expense Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-400">Total Expense</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(financials.totalExpense)}</div>
            <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-1"><TrendingDown className="w-3 h-3 mr-1"/> Ops + Liability</div>
          </CardContent>
        </Card>

        {/* Margin Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-400">Margin</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${Number(profitMargin) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{profitMargin}%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Health Indicator</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: LIQUIDITY */}
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-4">
        <Landmark className="w-5 h-5 text-orange-600 dark:text-orange-400" /> Liquidity Position
      </h3>
      <div className="grid gap-4 md:grid-cols-4">
        {/* Cash Card */}
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Cash In Hand</span>
                 <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(financials.cashBal)}</div>
           </CardContent>
        </Card>

        {/* Bank Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Bank</span>
                 <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatCurrency(financials.bankBal)}</div>
           </CardContent>
        </Card>

        {/* UPI Card */}
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">UPI</span>
                 <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">{formatCurrency(financials.upiBal)}</div>
           </CardContent>
        </Card>

        {/* Total Liquidity */}
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

      {/* SECTION 3: ALERTS & CHARTS */}
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

         {/* Chart Card */}
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
