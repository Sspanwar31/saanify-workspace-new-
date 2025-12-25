'use client';

import { useState, useEffect } from 'react';
import { useClientStore } from '@/lib/client/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, Wallet, Building2, Smartphone, 
  AlertTriangle, CheckCircle, Clock, Users, ArrowUpRight, ArrowDownRight,
  Landmark, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function ClientDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { 
    members, loans, passbookEntries, expenseLedger, adminFundLedger, 
    loanRequests, getReportData, getSocietyCashInHand 
  } = useClientStore();

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="p-8">Loading Financial Cockpit...</div>;

  // --- 1. CALCULATE FINANCIAL HEALTH ---
  const analytics = getReportData(null, null); // Get all data without date filter
  const { financials } = analytics;
  const profitMargin = (financials.totalCollected + financials.totalInterestCollected) > 0 
    ? (((financials.totalCollected + financials.totalInterestCollected) - financials.totalExpenses) / (financials.totalCollected + financials.totalInterestCollected) * 100).toFixed(1) 
    : '0';

  // --- 2. CALCULATE LIQUIDITY (LIVE SNAPSHOT) ---
  // Re-calculating live mode balances for accuracy
  let cashBal = 0, bankBal = 0, upiBal = 0;
  
  const processTxn = (amount: number, mode: string, type: 'IN' | 'OUT') => {
    const val = Math.abs(amount);
    const m = (mode || 'CASH').toLowerCase();
    if (m.includes('bank')) {
      bankBal += type === 'IN' ? val : -val;
    } else if (m.includes('upi')) {
      upiBal += type === 'IN' ? val : -val;
    } else {
      cashBal += type === 'IN' ? val : -val;
    }
  };

  // Process all sources
  passbookEntries.forEach(e => {
    const isCredit = ['DEPOSIT', 'INSTALLMENT', 'INTEREST', 'FINE'].includes(e.type.toUpperCase());
    processTxn(e.amount, e.paymentMode || 'CASH', isCredit ? 'IN' : 'OUT');
  });
  expenseLedger.forEach(e => processTxn(e.amount, 'CASH', e.type === 'INCOME' ? 'IN' : 'OUT'));
  adminFundLedger.forEach(e => processTxn(e.amount, 'CASH', e.type === 'INJECT' ? 'IN' : 'OUT'));
  
  // Note: Loans are usually CASH OUT unless specified
  loans.filter(l => l.status === 'active').forEach(l => processTxn(l.amount, 'CASH', 'OUT'));

  const totalLiquidity = cashBal + bankBal + upiBal;

  // --- 3. RISK & SCALE ---
  const activeMembers = members.filter(m => m.status === 'active').length;
  const pendingRequests = loanRequests.filter(r => r.status === 'pending').length;
  const activeLoansCount = loans.filter(l => l.status === 'active').length;
  const totalDeposits = members.reduce((sum, m) => sum + (m.totalDeposits || 0), 0);
  const outstandingLoan = loans.filter(l => l.status === 'active').reduce((sum, l) => sum + l.remainingBalance, 0);

  // --- FORMATTER ---
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-gray-500">Real-time health check of your society</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-mono">SYSTEM DATE</p>
          <p className="font-bold text-gray-700">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
        </div>
      </div>

      {/* SECTION 1: FINANCIAL HEALTH (HERO) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`border-l-4 ${financials.netProfit >= 0 ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Net Profit / Loss</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${financials.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {fmt(financials.netProfit)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Actual Earnings (Income - Expense)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Income</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(financials.totalCollected + financials.totalInterestCollected)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1"><TrendingUp className="w-3 h-3 mr-1"/> Interest + Fines</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Expense</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(financials.totalExpenses)}</div>
            <div className="flex items-center text-xs text-red-600 mt-1"><TrendingDown className="w-3 h-3 mr-1"/> Ops + Maturity</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Profit Margin</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{profitMargin}%</div>
            <p className="text-xs text-gray-500 mt-1">Health Indicator</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: LIQUIDITY SNAPSHOT (MOST IMPORTANT) */}
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Landmark className="w-5 h-5 text-orange-600" /> Liquidity Position (Cash Reality)
      </h3>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-50 border-emerald-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-emerald-700 uppercase">Cash In Hand</span>
                 <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-800">{fmt(cashBal)}</div>
           </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-blue-700 uppercase">Bank Balance</span>
                 <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-800">{fmt(bankBal)}</div>
           </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-purple-700 uppercase">UPI Balance</span>
                 <Smartphone className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-800">{fmt(upiBal)}</div>
           </CardContent>
        </Card>
        <Card className="bg-gray-900 text-white">
           <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-gray-300 uppercase">Total Liquidity</span>
                 <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold">{fmt(totalLiquidity)}</div>
           </CardContent>
        </Card>
      </div>

      {/* SECTION 4: ALERTS & RISKS */}
      {(pendingRequests > 0 || cashBal < 5000) && (
        <div className="grid gap-4 md:grid-cols-2">
           {pendingRequests > 0 && (
             <Alert className="bg-yellow-50 border-yellow-200">
               <AlertCircle className="h-4 w-4 text-yellow-600" />
               <AlertTitle className="text-yellow-800">Action Required</AlertTitle>
               <AlertDescription className="text-yellow-700">
                 You have <b>{pendingRequests} pending loan requests</b> waiting for approval.
               </AlertDescription>
             </Alert>
           )}
           {cashBal < 5000 && (
             <Alert className="bg-red-50 border-red-200">
               <AlertTriangle className="h-4 w-4 text-red-600" />
               <AlertTitle className="text-red-800">Low Cash Warning</AlertTitle>
               <AlertDescription className="text-red-700">
                 Cash in Hand is below ₹5,000. Consider injecting funds via Admin Fund.
               </AlertDescription>
             </Alert>
           )}
        </div>
      )}

      {/* SECTION 3 & 5: BUSINESS SCALE & CHARTS */}
      <div className="grid gap-6 md:grid-cols-3">
         {/* Business Stats */}
         <div className="space-y-4">
            <Card>
               <CardContent className="p-4 flex justify-between items-center">
                  <div><p className="text-xs text-gray-500">Total Deposits (Liability)</p><h4 className="text-xl font-bold">{fmt(totalDeposits)}</h4></div>
                  <Users className="text-orange-500" />
               </CardContent>
            </Card>
            <Card>
               <CardContent className="p-4 flex justify-between items-center">
                  <div><p className="text-xs text-gray-500">Outstanding Loans (Asset)</p><h4 className="text-xl font-bold">{fmt(outstandingLoan)}</h4></div>
                  <TrendingUp className="text-blue-500" />
               </CardContent>
            </Card>
            <Card>
               <CardContent className="p-4 flex justify-between items-center">
                  <div><p className="text-xs text-gray-500">Active Members</p><h4 className="text-xl font-bold">{activeMembers}</h4></div>
                  <CheckCircle className="text-green-500" />
               </CardContent>
            </Card>
         </div>

         {/* Chart 1: Income vs Expense */}
         <Card className="col-span-2">
            <CardHeader><CardTitle>Monthly Performance</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trends.monthlyCollection.length > 0 ? analytics.trends.monthlyCollection : [
                  { month: 'Jan', amount: financials.totalCollected },
                  { month: 'Current', amount: financials.totalCollected }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#10B981" radius={[4,4,0,0]} name="Income" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>

    </div>
  );
}