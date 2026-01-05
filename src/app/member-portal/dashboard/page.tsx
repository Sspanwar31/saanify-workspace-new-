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

      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', memberData.id)
        .eq('status', 'active');

      const activeLoan = loans?.[0];
      const loanPrincipal = activeLoan
        ? Number(activeLoan.remaining_balance)
        : 0;

      const currentInterest =
        loanPrincipal > 0 ? Math.round(loanPrincipal * 0.01) : 0;

      setStats({
        savings: totalSavings,
        loanPrincipal,
        activeLoanInterest: currentInterest,
        hasActiveLoan: !!activeLoan
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
    if (t.deposit_amount > 0) return 'Deposit';
    if (t.installment_amount > 0) return 'Installment';
    if (t.interest_amount > 0 || t.fine_amount > 0) return 'Interest / Fine';
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
                    lastTxn.deposit_amount ||
                      lastTxn.installment_amount ||
                      lastTxn.total_amount
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
                  p.deposit_amount ||
                    p.installment_amount ||
                    p.total_amount
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
