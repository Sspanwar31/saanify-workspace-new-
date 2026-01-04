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

export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

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
        if (!storedUser) { router.push('/login'); return; }
        
        try {
            const user = JSON.parse(storedUser);
            
            // 1. Client Fetch
            const { data: client } = await supabase.from('clients').select('*').eq('id', user.id).single();
            if (client) setClientData(client);
            else setClientData(user);

            // --- FETCH DATA FOR DASHBOARD ---
            
            // A. Passbook (Income + Liquidity)
            const passbookReq = supabase
                .from('passbook_entries')
                .select('*'); 

            // B. Expenses (Cash Expense)
            const expenseReq = supabase
                .from('expenses_ledger') 
                .select('*')
                .eq('client_id', user.id);

            // C. Loans (Status)
            const loansReq = supabase
                .from('loans')
                .select('*')
                .eq('client_id', user.id);

            // D. Members (Zaroori hai Maturity Calculation ke liye)
            const membersReq = supabase
                .from('members')
                .select('*')
                .eq('client_id', user.id);

            // Run Queries
            const [passbookRes, expenseRes, loansRes, membersRes] = await Promise.all([
                passbookReq, expenseReq, loansReq, membersReq
            ]);

            if (passbookRes.data) {
                calculateFinancials(
                    passbookRes.data || [], 
                    expenseRes.data || [], 
                    loansRes.data || [],
                    membersRes.data || [] // Members Data bhi pass kiya
                );
            }

        } catch(e) {
            console.error("Error fetching dashboard data:", e);
        } finally {
            setLoading(false);
        }
    };
    init();
  }, [router]);

  // ✅ LOGIC: Real Profit & Maturity Liability Logic (Matches Report)
  const calculateFinancials = (passbook: any[], expenses: any[], loans: any[], membersList: any[]) => {
    
    // Variables for Calculation
    let realIncome = 0; // Interest + Fine Only
    let cashExpense = 0;
    
    // Liquidity (Cash Flow)
    let cash = 0;
    let bank = 0;
    let upi = 0;
    
    let pendingLoanCount = 0;
    let totalDepositsCollected = 0; // For Deposits Card

    const monthlyMap: {[key: string]: number} = {};

    // 1. Passbook Processing
    passbook.forEach(t => {
        const totalAmt = Number(t.total_amount) || 0; // Cash Flow
        
        // Income Logic: Sirf Interest aur Fine hi profit hai
        // Deposit ko income me nahi jodna chahiye (wo liability hai)
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

        // Chart Data (Cash Flow ke hisab se)
        const date = t.date ? new Date(t.date) : new Date(t.created_at);
        const month = date.toLocaleString('default', { month: 'short' });
        monthlyMap[month] = (monthlyMap[month] || 0) + totalAmt;
    });

    // 2. Expenses Ledger Processing
    expenses.forEach(e => {
        const amt = Number(e.amount) || 0;
        
        if (e.type === 'EXPENSE') {
            cashExpense += amt;
            // Subtract from Liquidity (Default Cash)
            cash -= amt; 
        } 
        else if (e.type === 'INCOME') {
            // Agar koi aur income hai (Form Fees etc.)
            realIncome += amt;
            cash += amt; 
        }
    });

    // 3. Loans Count Logic
    loans.forEach(l => {
        if (l.status === 'active') pendingLoanCount++;
        // Loan diya hai toh cash kam hua hoga
        // (Agar expenses me entry nahi hai toh yahan minus karein)
        // cash -= Number(l.amount); 
    });

    // --- 4. MATURITY LIABILITY CALCULATION (The Real Fix) ---
    // Formula: (Monthly Share * Deposit Count)
    
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
             
             // B. Constants
             const tenureMonths = 36; // 3 Years
             
             // --- CRITICAL CHECK: Manual Override ---
             const isOverride = memberInfo?.maturity_is_override || false;
             const manualAmount = Number(memberInfo?.maturity_manual_amount || 0);

             let settledInterest = 0;

             if (isOverride && manualAmount > 0) {
                 // Agar Manual Amount set hai
                 settledInterest = manualAmount;
             } else {
                 // Standard 12% Calculation
                 const totalPrincipal = monthlyDeposit * tenureMonths;
                 settledInterest = totalPrincipal * 0.12; 
             }
             
             // C. Monthly Interest Share
             const monthlyInterestShare = settledInterest / tenureMonths;

             // D. Count payments made
             const depositCount = deposits.length;

             // E. Current Liability
             maturityLiability += (monthlyInterestShare * depositCount);
        }
    });

    // --- FINAL TOTALS ---
    
    // Total Expense = Ops Cost + Maturity Liability
    const totalExpenseFinal = cashExpense + maturityLiability;
    
    // Real Net Profit = Actual Income - All Expenses
    const netProfitFinal = realIncome - totalExpenseFinal;

    // Chart formatting
    const chart = Object.keys(monthlyMap).map(m => ({ month: m, amount: monthlyMap[m] }));

    setFinancials({
        netProfit: netProfitFinal,
        totalIncome: realIncome, // Interest + Fine + Other
        totalExpense: totalExpenseFinal, // Includes Ops + Maturity
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
    router.push('/login');
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Loading Financial Cockpit...</div>;
  if (!clientData) return null;

  const totalLiquidity = financials.cashBal + financials.bankBal + financials.upiBal;
  
  // Profit Margin Calculation (Safe Divide)
  const profitMargin = financials.totalIncome > 0 
    ? ((financials.netProfit / financials.totalIncome) * 100).toFixed(1) 
    : "0";
    
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{clientData.society_name || 'My Society'}</h1>
          <p className="text-slate-500 text-sm">Financial Overview • {clientData.name}</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400 font-mono uppercase">SYSTEM DATE</p>
            <p className="font-bold text-slate-700">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50"><LogOut className="w-5 h-5"/></Button>
        </div>
      </div>

      {/* SECTION 1: FINANCIAL HEALTH */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Net Profit Card - Color Changes dynamically */}
        <Card className={`border-l-4 ${financials.netProfit >= 0 ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Net Profit</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${financials.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {fmt(financials.netProfit)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Actual Earnings</p>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Total Income</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(financials.totalIncome)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1"><TrendingUp className="w-3 h-3 mr-1"/> Interest + Fines</div>
          </CardContent>
        </Card>

        {/* Total Expense - Updated with Maturity */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Total Expense</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(financials.totalExpense)}</div>
            <div className="flex items-center text-xs text-red-600 mt-1"><TrendingDown className="w-3 h-3 mr-1"/> Ops + Liability</div>
          </CardContent>
        </Card>

        {/* Margin */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Margin</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${Number(profitMargin) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{profitMargin}%</div>
            <p className="text-xs text-slate-500 mt-1">Health Indicator</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: LIQUIDITY */}
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-4">
        <Landmark className="w-5 h-5 text-orange-600" /> Liquidity Position
      </h3>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-50 border-emerald-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-emerald-700 uppercase">Cash In Hand</span>
                 <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-800">{fmt(financials.cashBal)}</div>
           </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-blue-700 uppercase">Bank</span>
                 <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-800">{fmt(financials.bankBal)}</div>
           </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-purple-700 uppercase">UPI</span>
                 <Smartphone className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-800">{fmt(financials.upiBal)}</div>
           </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-slate-300 uppercase">Total Liquidity</span>
                 <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold">{fmt(totalLiquidity)}</div>
           </CardContent>
        </Card>
      </div>

      {/* SECTION 3: ALERTS & CHARTS */}
      <div className="grid gap-6 md:grid-cols-3">
         <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
               <AlertCircle className="h-4 w-4 text-yellow-600" />
               <AlertTitle className="text-yellow-800">System Status</AlertTitle>
               <AlertDescription className="text-yellow-700">
                 {financials.pendingLoans > 0 
                   ? `${financials.pendingLoans} active loans.` 
                   : "System updated live from Supabase."}
               </AlertDescription>
            </Alert>
            <Card>
               <CardContent className="p-4 flex justify-between items-center">
                  <div><p className="text-xs text-gray-500">Total Deposits</p><h4 className="text-xl font-bold">{fmt(financials.depositTotal)}</h4></div>
                  <Users className="text-orange-500" />
               </CardContent>
            </Card>
         </div>

         <Card className="col-span-2">
            <CardHeader><CardTitle>Monthly Performance</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.length > 0 ? chartData : [{month: 'No Data', amount: 0}]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <Tooltip formatter={(value) => fmt(Number(value))} />
                  <Bar dataKey="amount" fill="#10B981" radius={[4,4,0,0]} name="Income" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
