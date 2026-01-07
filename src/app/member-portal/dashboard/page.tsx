'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet,
  AlertCircle,
  ArrowRightLeft,
  TrendingUp,
  Loader2
} from 'lucide-react';

export default function MemberDashboard() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [passbook, setPassbook] = useState<any[]>([]);
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

      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (!memberData) return;
      setMember(memberData);

      // 1. Passbook
      const { data: passbookData } = await supabase
        .from('passbook_entries')
        .select('*')
        .eq('member_id', memberData.id)
        .order('date', { ascending: false });

      setPassbook(passbookData || []);
      setLastTxn(passbookData?.[0] || null);

      const totalSavings =
        passbookData?.reduce(
          (sum, p) => sum + (Number(p.deposit_amount) || 0),
          0
        ) || 0;

      // 2. Loans (FIX: Sum ALL active loans)
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', memberData.id)
        .eq('status', 'active');

      // ✅ FIX: Reduce use kiya taaki saare loans jud jayein
      const totalOutstanding = loans?.reduce(
        (sum, loan) => sum + (Number(loan.remaining_balance) || 0), 
        0
      ) || 0;

      const currentInterest =
        totalOutstanding > 0 ? Math.round(totalOutstanding * 0.01) : 0;

      setStats({
        savings: totalSavings,
        loanPrincipal: totalOutstanding, // Ab ye Sahi Total dikhayega
        activeLoanInterest: currentInterest,
        hasActiveLoan: totalOutstanding > 0 // Agar total 0 se jyada hai tabhi active mano
      });

      setLoading(false);
    };

    fetchData();
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n);

  const getTxnType = (t: any) => {
    if (Number(t.deposit_amount) > 0) return 'Deposit';
    if (Number(t.installment_amount) > 0) return 'Installment';
    if (Number(t.interest_amount) > 0 || Number(t.fine_amount) > 0) return 'Interest / Fine';
    return 'Transaction';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Hello, {member?.name}
        </h1>
        <p className="text-slate-500">
          Here is your financial snapshot
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-slate-500">
              Total Savings
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fmt(stats.savings)}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Deposited so far
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-slate-500">
              Outstanding Loan
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fmt(stats.loanPrincipal)}
            </div>
            <p className="text-xs text-slate-400">
              Remaining principal
            </p>
          </CardContent>
        </Card>

        {stats.hasActiveLoan ? (
          <Card className="bg-orange-50 border-orange-100">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-orange-800">
                Current Interest
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {fmt(stats.activeLoanInterest)}
              </div>
              <p className="text-xs text-orange-600/80">
                Applicable this month
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-slate-400 font-medium">
                No Active Loan
              </p>
              <p className="text-xs text-slate-400">
                You are debt free 🎉
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-slate-500">
              Last Activity
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {lastTxn ? (
              <>
                <div className="text-xl font-bold">
                  {fmt(
                    Number(lastTxn.deposit_amount) +
                    Number(lastTxn.installment_amount) +
                    Number(lastTxn.interest_amount) +
                    Number(lastTxn.fine_amount)
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {getTxnType(lastTxn)} ·{' '}
                  {new Date(lastTxn.date).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                No activity yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Passbook */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Recent Passbook Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {passbook.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="flex justify-between text-sm border-b pb-2 last:border-0"
            >
              <div>
                <p className="font-medium">{getTxnType(p)}</p>
                <p className="text-xs text-slate-500">
                  {new Date(p.date).toLocaleDateString()}
                </p>
              </div>
              <div className="font-semibold">
                {fmt(
                  Number(p.deposit_amount) +
                  Number(p.installment_amount) +
                  Number(p.interest_amount) +
                  Number(p.fine_amount)
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
