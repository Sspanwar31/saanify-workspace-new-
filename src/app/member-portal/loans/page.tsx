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

// ✅ DIFF-1: Helper functions (TOP of file)
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

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Logic
  const fetchLoans = async () => {
    console.log("🚀 DEBUG START: Fetching Loans...");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("❌ DEBUG: User not logged in");
        return;
    }
    console.log("✅ DEBUG: User ID found:", user.id);

    let memberId = member?.id;
    if(!memberId) {
        const { data: mem, error: memError } = await supabase.from('members').select('*').eq('auth_user_id', user.id).single();
        if(memError) console.error("❌ DEBUG: Member fetch error:", memError);
        
        if(mem) {
            setMember(mem);
            memberId = mem.id;
            console.log("✅ DEBUG: Member ID found:", memberId);
        }
    }

    if (memberId) {
      // ✅ Fetch Loans
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (loansError) console.error("❌ DEBUG: Error fetching loans:", loansError);
      console.log("✅ DEBUG: Loans fetched:", loans?.length, loans);

      if (loans) {
        const loanIds = loans.map(l => l.id) || [];
        console.log("🔍 DEBUG: Searching Passbook for Loan IDs:", loanIds);

        if (loanIds.length > 0) {
            // ✅ FIX: Fetch directly from 'passbook_entries' (Updated Table Name)
            // Added 'error' capture for debugging
            const { data: passbookEntries, error: pbError } = await supabase
              .from('passbook_entries')
              .select('loan_id, date')
              .in('loan_id', loanIds)
              .order('date', { ascending: false });

            // 🛑 DEBUGGING BLOCK (Important)
            if (pbError) {
                console.error("❌ DEBUG: Error fetching passbook_entries:", pbError);
                toast.error("Error loading EMI details");
            } else {
                console.log("✅ DEBUG: Passbook Entries found:", passbookEntries);
                if (passbookEntries?.length === 0) {
                    console.warn("⚠️ DEBUG: Query succeeded but returned 0 rows. Check RLS or IDs.");
                }
            }

            // Map banaya taaki har loan id ke liye latest date mil jaye
            const installmentMap = new Map();
            passbookEntries?.forEach((entry: any) => {
              if (entry.loan_id && !installmentMap.has(entry.loan_id)) {
                installmentMap.set(entry.loan_id, entry.date);
              }
            });
            console.log("✅ DEBUG: Installment Map created:", Object.fromEntries(installmentMap));

            const mergedLoans = loans.map(loan => ({
              ...loan,
              last_installment_date: installmentMap.get(loan.id) || null,
            }));
            
            console.log("✅ DEBUG: Final Merged Loans Data:", mergedLoans);

            setAllLoans(mergedLoans);
            setActiveLoan(mergedLoans.find(l => l.status === 'active') || null);
            setPendingRequest(mergedLoans.find(l => l.status === 'pending') || null);
        } else {
            console.log("ℹ️ DEBUG: No loans found, skipping passbook fetch.");
            setAllLoans(loans);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();

    const channel = supabase.channel('member-loans-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => {
          console.log("🔄 DEBUG: Realtime update detected");
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

  // ✅ REAL backend driven installment date (from passbook logic)
  const lastInstallmentDate = useMemo(() => {
    if (!activeLoan) return undefined;
    console.log("DEBUG: Active Loan Last Installment Date:", activeLoan.last_installment_date);
    return activeLoan.last_installment_date;
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
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline" /> Loading Loans...</div>;

  return (
    <div className="space-y-10">
      <div><h1 className="text-2xl font-bold text-slate-800">My Loans</h1><p className="text-slate-500 text-sm">Track your loan status & requests</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="flex justify-between pb-2"><CardTitle className="text-sm text-slate-500">Loan Status</CardTitle><AlertCircle className="h-4 w-4 text-red-600" /></CardHeader><CardContent className="text-xl font-bold">{activeLoan ? 'Active' : pendingRequest ? 'Pending' : 'None'}</CardContent></Card>
        <Card><CardHeader className="flex justify-between pb-2"><CardTitle className="text-sm text-slate-500">Remaining Balance</CardTitle><Wallet className="h-4 w-4 text-slate-600" /></CardHeader><CardContent className="text-xl font-bold">₹{totalOutstanding.toLocaleString()}</CardContent></Card>
        <Card><CardHeader className="flex justify-between pb-2"><CardTitle className="text-sm text-slate-500">Total Loan Taken</CardTitle><TrendingUp className="h-4 w-4 text-blue-600" /></CardHeader><CardContent className="text-xl font-bold">₹{totalLoanTaken.toLocaleString()}</CardContent></Card>
        
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm text-slate-500">Total Recovered</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="text-xl font-bold text-green-700">
            ₹{(totalLoanTaken - totalOutstanding).toLocaleString()}
          </CardContent>
        </Card>
        
        <Card><CardHeader className="flex justify-between pb-2"><CardTitle className="text-sm text-slate-500">Current Interest (1%)</CardTitle><Clock className="h-4 w-4 text-orange-600" /></CardHeader><CardContent className="text-xl font-bold">₹{currentInterest.toLocaleString()}</CardContent></Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">EMI Details</h2>
        
        {activeLoan ? (
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <Badge className="bg-orange-100 text-orange-700">Active Loan</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                <div>
                  <p className="text-sm text-slate-500">Remaining Loan</p>
                  <p className="text-2xl font-bold">₹{totalOutstanding.toLocaleString()}</p>
                </div>
                <div className="sm:text-center">
                   <p className="text-sm text-slate-500">Last Paid On</p>
                   <p className="text-lg font-medium text-slate-800">{formatInstallmentDate(lastInstallmentDate)}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-slate-500">Next EMI Date</p>
                  <p className="text-lg font-medium text-orange-600">{getNextEmiCycle(lastInstallmentDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center text-green-700 font-medium">You don’t have any active loans.</CardContent>
          </Card>
        )}
        
        {pendingRequest && <Card className="bg-yellow-50 border-yellow-200"><CardContent className="p-4 flex justify-between items-center"><div><p className="font-semibold text-yellow-800">Loan Request Pending</p><p className="text-xs text-yellow-600">₹{Number(pendingRequest.amount).toLocaleString()}</p></div><Badge className="bg-yellow-200 text-yellow-800">Pending</Badge></CardContent></Card>}
      </div>

      <div className="pt-4"><Button onClick={() => setIsRequestOpen(true)} className="w-full h-12 text-lg rounded-xl">Request New Loan</Button></div>

      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Apply for Loan</DialogTitle></DialogHeader><div className="space-y-3 py-3"><Label>Loan Amount</Label><Input type="number" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)}/></div><DialogFooter><Button onClick={handleRequest} disabled={submitting} className="w-full">{submitting ? <Loader2 className="animate-spin"/> : 'Submit Request'}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
