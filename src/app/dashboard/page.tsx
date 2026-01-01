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

  // ✅ AB DATA 0 SE SHURU HOGA (Backend se bhara jayega)
  const [financials, setFinancials] = useState({
    netProfit: 0,
    totalIncome: 0,
    totalExpense: 0,
    cashBal: 0,
    bankBal: 0,
    upiBal: 0,
    depositTotal: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
        const storedUser = localStorage.getItem('current_user');
        if (!storedUser) { router.push('/login'); return; }
        
        try {
            const user = JSON.parse(storedUser);
            
            // 1. Client Details Fetch karna
            const { data: client } = await supabase.from('clients').select('*').eq('id', user.id).single();
            if (client) setClientData(client);
            else setClientData(user);

            // 2. ✅ REAL FINANCIAL DATA FETCH KARNA
            const { data: transactions } = await supabase
                .from('transactions')
                .select('*')
                .eq('client_id', user.id);

            if (transactions) {
                calculateFinancials(transactions);
            }

        } catch(e) {
            console.error("Error fetching dashboard data:", e);
        } finally {
            setLoading(false);
        }
    };
    init();
  }, [router]);

  // ✅ CALCULATE LOGIC (Jadu Yaha Hai)
  const calculateFinancials = (data: any[]) => {
    let income = 0;
    let expense = 0;
    let cash = 0;
    let bank = 0;
    let upi = 0;

    // Monthly Chart Data ke liye map
    const monthlyMap: {[key: string]: number} = {};

    data.forEach(t => {
        const amt = Number(t.amount);
        
        // Income vs Expense Calculation
        if (t.type === 'income') {
            income += amt;
            // Liquidity Add karna
            if (t.category === 'cash') cash += amt;
            if (t.category === 'bank') bank += amt;
            if (t.category === 'upi') upi += amt;
        } else {
            expense += amt;
            // Liquidity Subtract karna (Kharche se paisa kam hoga)
            if (t.category === 'cash') cash -= amt;
            if (t.category === 'bank') bank -= amt;
            if (t.category === 'upi') upi -= amt;
        }

        // Chart Data banana (Month wise)
        const month = new Date(t.created_at).toLocaleString('default', { month: 'short' });
        if (t.type === 'income') {
            monthlyMap[month] = (monthlyMap[month] || 0) + amt;
        }
    });

    // Chart array convert
    const chart = Object.keys(monthlyMap).map(m => ({ month: m, amount: monthlyMap[m] }));

    setFinancials({
        netProfit: income - expense,
        totalIncome: income,
        totalExpense: expense,
        cashBal: cash,
        bankBal: bank,
        upiBal: upi,
        depositTotal: income // Example: Total Deposits = Total Income (Change logic if needed)
    });
    setChartData(chart);
  };

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    router.push('/login');
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Loading Dashboard...</div>;
  if (!clientData) return null;

  const totalLiquidity = financials.cashBal + financials.bankBal + financials.upiBal;
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
        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Net Profit</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{fmt(financials.netProfit)}</div>
            <p className="text-xs text-slate-500 mt-1">Actual Earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Total Income</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(financials.totalIncome)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1"><TrendingUp className="w-3 h-3 mr-1"/> Interest + Fines</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Total Expense</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(financials.totalExpense)}</div>
            <div className="flex items-center text-xs text-red-600 mt-1"><TrendingDown className="w-3 h-3 mr-1"/> Ops + Salary</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Margin</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{profitMargin}%</div>
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
               <AlertDescription className="text-yellow-700">Data live from Supabase.</AlertDescription>
            </Alert>
            <Card>
               <CardContent className="p-4 flex justify-between items-center">
                  <div><p className="text-xs text-gray-500">Total Volume</p><h4 className="text-xl font-bold">{fmt(financials.totalIncome + financials.totalExpense)}</h4></div>
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
