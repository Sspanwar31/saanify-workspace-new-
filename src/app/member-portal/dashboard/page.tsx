'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertCircle, ArrowRightLeft, TrendingUp, Loader2 } from 'lucide-react';

export default function MemberDashboard() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [stats, setStats] = useState({ 
    savings: 0, 
    loanPrincipal: 0, 
    activeLoanInterest: 0,
    hasActiveLoan: false 
  });
  const [lastTxn, setLastTxn] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get Member
      const { data: memberData } = await supabase.from('members').select('*').eq('auth_user_id', user.id).single();
      if (memberData) {
        setMember(memberData);

        // 2. Passbook (Total Savings & Last Txn)
        const { data: passbook } = await supabase
            .from('passbook_entries')
            .select('*')
            .eq('member_id', memberData.id)
            .order('date', { ascending: false });

        const totalSavings = passbook?.reduce((sum, p) => sum + (Number(p.deposit_amount) || 0), 0) || 0;
        setLastTxn(passbook?.[0] || null);

        // 3. Loans (Active Principal Only)
        const { data: loans } = await supabase
            .from('loans')
            .select('*')
            .eq('member_id', memberData.id)
            .eq('status', 'active');

        const activeLoan = loans?.[0]; // Assuming one active loan at a time mostly
        const loanPrincipal = activeLoan ? Number(activeLoan.remaining_balance) : 0;
        
        // Rule 3.1: Show Interest ONLY if active
        // Logic: 1% of remaining balance (Simple placeholder logic)
        const currentInterest = loanPrincipal > 0 ? Math.round(loanPrincipal * 0.01) : 0;

        setStats({
            savings: totalSavings,
            loanPrincipal: loanPrincipal,
            activeLoanInterest: currentInterest,
            hasActiveLoan: !!activeLoan
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Hello, {member?.name}</h1>
            <p className="text-slate-500">Here is your financial snapshot.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Savings */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Savings</CardTitle>
                <Wallet className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{fmt(stats.savings)}</div>
                <p className="text-xs text-emerald-600 font-medium mt-1">Safe & Secure</p>
            </CardContent>
        </Card>

        {/* Card 2: Outstanding Loan */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Outstanding Loan</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{fmt(stats.loanPrincipal)}</div>
                <p className="text-xs text-slate-400 mt-1">Principal Balance</p>
            </CardContent>
        </Card>

        {/* Card 3: Active Interest (Conditional) */}
        {stats.hasActiveLoan ? (
            <Card className="bg-orange-50 border-orange-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800">Current Interest</CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-700">{fmt(stats.activeLoanInterest)}</div>
                    <p className="text-xs text-orange-600/80 mt-1">For this month</p>
                </CardContent>
            </Card>
        ) : (
            <Card className="bg-slate-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full pt-6">
                    <p className="text-sm text-slate-400 font-medium">No Active Loans</p>
                    <p className="text-xs text-slate-400">You are debt free!</p>
                </CardContent>
            </Card>
        )}

        {/* Card 4: Last Transaction */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Last Activity</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                {lastTxn ? (
                    <>
                        <div className={`text-2xl font-bold ${Number(lastTxn.deposit_amount) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {Number(lastTxn.deposit_amount) > 0 ? '+' : '-'}{fmt(Number(lastTxn.deposit_amount) || Number(lastTxn.total_amount))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{new Date(lastTxn.date).toLocaleDateString()}</p>
                    </>
                ) : <p className="text-sm text-slate-400">No activity yet</p>}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
