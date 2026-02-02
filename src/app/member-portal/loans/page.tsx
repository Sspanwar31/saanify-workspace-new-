'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Wallet, AlertCircle, TrendingUp, Clock, Bell } from 'lucide-react';

// ✅ Helper functions
const formatInstallmentDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getNextEmiCycle = (dateStr?: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + 1);
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

export default function MemberLoans() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [allLoans, setAllLoans] = useState<any[]>([]);
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  
  // State for last payment date
  const [lastPaymentDate, setLastPaymentDate] = useState<string | undefined>(undefined);

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Logic
  const fetchLoans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let memberId = member?.id;
    if(!memberId) {
        const { data: mem } = await supabase.from('members').select('*').eq('auth_user_id', user.id).single();
        if(mem) {
            setMember(mem);
            memberId = mem.id;
        }
    }

    if (memberId) {
      // Fetch Loans (Clean)
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (loans) {
        setAllLoans(loans);
        
        // Find LATEST active loan
        setActiveLoan(loans.find(l => l.status === 'active') || null);
        setPendingRequest(loans.find(l => l.status === 'pending') || null);
      }

      // Last payment fetch
      const { data: lastPayment, error: payError } = await supabase
        .from('member_last_payment')
        .select('last_payment_date')
        .eq('member_id', memberId)
        .single();

      if (!payError) {
        setLastPaymentDate(lastPayment?.last_payment_date);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();

    // Realtime Listener
    const channel = supabase.channel('member-loans-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => {
          fetchLoans();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- CALCULATION LOGIC ---
  const totalLoanTaken = useMemo(() => {
    return allLoans.reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
  }, [allLoans]);

  const totalOutstanding = useMemo(() => {
    return allLoans
        .filter(l => l.status === 'active')
        .reduce((sum, loan) => sum + Number(loan.remaining_balance || 0), 0);
  }, [allLoans]);

  const currentInterest = useMemo(() => {
    return Math.round(totalOutstanding * 0.01);
  }, [totalOutstanding]);

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
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline" /> Loading Loans...</div>;

  return (
    <div className="space-y-10">
      <div><h1 className="text-2xl font-bold text-slate-800">My Loans</h1><p className="text-slate-500 text-sm">Track your loan status & requests</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-500">Loan Status</CardTitle><AlertCircle className="h-4 w-4 text-red-600" /></CardHeader><CardContent className="text-xl font-bold">{activeLoan ? 'Active' : pendingRequest ? 'Pending' : 'None'}</CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-500">Remaining Balance</CardTitle><Wallet className="h-4 w-4 text-slate-600" /></CardHeader><CardContent className="text-xl font-bold">₹{totalOutstanding.toLocaleString()}</CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Loan Taken</CardTitle><TrendingUp className="h-4 w-4 text-blue-600" /></CardHeader><CardContent className="text-xl font-bold">₹{totalLoanTaken.toLocaleString()}</CardContent></Card>
        
        {/* Total Recovered Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Recovered</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="text-xl font-bold text-green-700">
            ₹{(totalLoanTaken - totalOutstanding).toLocaleString()}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-500">Current Interest (1%)</CardTitle><Clock className="h-4 w-4 text-orange-600" /></CardHeader><CardContent className="text-xl font-bold">₹{currentInterest.toLocaleString()}</CardContent></Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">EMI Details</h2>
        
        {/* Cleaned UI Layout */}
        {activeLoan ? (
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-6 space-y-6">              
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <p className="text-sm text-slate-500 uppercase font-bold tracking-wider">Active Loan</p>
                    <p className="text-3xl font-bold text-slate-900">₹{totalOutstanding.toLocaleString()}</p>
                </div>
                <Badge className="bg-orange-100 text-orange-700 px-3 py-1 text-sm">
                  Running
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Next EMI Due</p>
                  <div className="flex items-center gap-2">
                     <CalendarIcon className="w-5 h-5 text-blue-600"/>
                     <span className="text-lg font-semibold text-blue-700">{getNextEmiCycle(lastPaymentDate)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Last Payment Received</p>
                  <div className="flex items-center gap-2">
                     <CheckCircleIcon className="w-5 h-5 text-green-600"/>
                     <span className="text-lg font-semibold text-green-700">{formatInstallmentDate(lastPaymentDate)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center text-green-700 font-medium flex flex-col items-center gap-2">
              <CheckCircleIcon className="w-8 h-8"/>
              You don’t have any active loans. Great job!
            </CardContent>
          </Card>
        )}
        
        {pendingRequest && <Card className="bg-yellow-50 border-yellow-200"><CardContent className="p-4 flex justify-between items-center"><div><p className="font-semibold text-yellow-800">Loan Request Pending</p><p className="text-xs text-yellow-600">₹{Number(pendingRequest.amount).toLocaleString()}</p></div><Badge className="bg-yellow-200 text-yellow-800">Pending</Badge></CardContent></Card>}
      </div>

      <div className="pt-4"><Button onClick={() => setIsRequestOpen(true)} className="w-full h-12 text-lg rounded-xl shadow-lg bg-slate-900 hover:bg-slate-800 transition-all">Request New Loan</Button></div>

      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Apply for Loan</DialogTitle></DialogHeader><div className="space-y-3 py-3"><Label>Loan Amount</Label><Input type="number" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)}/></div><DialogFooter><Button onClick={handleRequest} disabled={submitting} className="w-full">{submitting ? <Loader2 className="animate-spin"/> : 'Submit Request'}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

// Additional Icons needed for new UI
function CalendarIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
}

function CheckCircleIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}
