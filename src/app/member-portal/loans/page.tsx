'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Loader2,
  Wallet,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function MemberLoans() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLoans = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (memberData) {
        setMember(memberData);

        const { data: loans } = await supabase
          .from('loans')
          .select('*')
          .eq('member_id', memberData.id);

        setActiveLoan(loans?.find(l => l.status === 'active') || null);
        setPendingRequest(loans?.find(l => l.status === 'pending') || null);
      }
      setLoading(false);
    };

    fetchLoans();
  }, []);

  const currentInterest = useMemo(() => {
    if (!activeLoan) return 0;
    return Math.round(Number(activeLoan.remaining_balance) * 0.01);
  }, [activeLoan]);

  const handleRequest = async () => {
    if (!amount) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('loans').insert([{
        client_id: member.client_id,
        member_id: member.id,
        amount: Number(amount),
        remaining_balance: Number(amount),
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      toast.success('Loan request sent successfully');
      setPendingRequest({ amount: Number(amount), status: 'pending' });
      setIsRequestOpen(false);
      setAmount('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin inline" /> Loading Loans...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Loans</h1>
        <p className="text-slate-500 text-sm">
          Track your loan status & requests
        </p>
      </div>

      {/* 🔹 SECTION 1: SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-slate-500">Loan Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {activeLoan ? 'Active' : pendingRequest ? 'Pending' : 'None'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-slate-500">
              Remaining Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent className="text-xl font-bold">
            ₹{activeLoan ? Number(activeLoan.remaining_balance).toLocaleString() : '0'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-slate-500">
              Total Loan Taken
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="text-xl font-bold">
            ₹{activeLoan ? Number(activeLoan.amount).toLocaleString() : '0'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-slate-500">
              Current Interest (1%)
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="text-xl font-bold">
            ₹{currentInterest.toLocaleString()}
          </CardContent>
        </Card>
      </div>

      {/* 🔹 SECTION 2: MY LOAN */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">My Loan</h2>

        {activeLoan && (
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-red-600 bg-red-50">
                  Active Loan
                </Badge>
                <span className="text-xs text-slate-500">
                  {new Date(activeLoan.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-500">Remaining</p>
                  <p className="text-2xl font-bold">
                    ₹{Number(activeLoan.remaining_balance).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="font-medium">
                    ₹{Number(activeLoan.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingRequest && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-yellow-800">
                  Loan Request Pending
                </p>
                <p className="text-xs text-yellow-600">
                  ₹{Number(pendingRequest.amount).toLocaleString()}
                </p>
              </div>
              <Badge className="bg-yellow-200 text-yellow-800">
                Pending
              </Badge>
            </CardContent>
          </Card>
        )}

        {!activeLoan && !pendingRequest && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center text-green-700 font-medium">
              You don’t have any active loans.
            </CardContent>
          </Card>
        )}
      </div>

      {/* 🔹 SECTION 3: REQUEST LOAN (ALWAYS VISIBLE) */}
      <div className="pt-4">
        <Button
          onClick={() => setIsRequestOpen(true)}
          className="w-full h-12 text-lg rounded-xl"
        >
          Request New Loan
        </Button>

        {(activeLoan || pendingRequest) && (
          <p className="mt-2 text-xs text-slate-500 text-center">
            You can request another loan even if one is active or under review.
          </p>
        )}
      </div>

      {/* MODAL */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Loan</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Label>Loan Amount</Label>
            <Input
              type="number"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={handleRequest}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? <Loader2 className="animate-spin" /> : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
