'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, TrendingUp, History, LogOut, ArrowUpRight, ArrowDownLeft, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MemberPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [stats, setStats] = useState({ savings: 0, loan: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Loan Request State
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        // 1. Get Logged In User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        // 2. Fetch Member Profile
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (memberData) {
            setMember(memberData);
            
            // 3. Fetch Passbook (Savings)
            const { data: passbook } = await supabase
                .from('passbook_entries')
                .select('*')
                .eq('member_id', memberData.id)
                .order('date', { ascending: false });

            // 4. Fetch Loans
            const { data: loans } = await supabase
                .from('loans')
                .select('*')
                .eq('member_id', memberData.id);

            // Calculations
            const totalDeposit = passbook?.reduce((sum, p) => sum + (Number(p.deposit_amount) || 0), 0) || 0;
            const activeLoans = loans?.filter(l => l.status === 'active').reduce((sum, l) => sum + (Number(l.remaining_balance) || 0), 0) || 0;

            setStats({ savings: totalDeposit, loan: activeLoans });
            setTransactions(passbook || []);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
  };

  const handleLoanRequest = async () => {
    if(!loanAmount) return;
    setIsSubmitting(true);
    try {
        // Direct Entry to Loans Table (Status: Pending)
        const { error } = await supabase.from('loans').insert([{
            client_id: member.client_id, // Link to Society Admin
            member_id: member.id,
            amount: Number(loanAmount),
            status: 'pending', // Waiting for Admin Approval
            remaining_balance: Number(loanAmount), // Initial balance
            created_at: new Date().toISOString()
        }]);

        if(error) throw error;
        toast.success("Loan Request Sent!");
        setIsLoanModalOpen(false);
        setLoanAmount('');
    } catch (e: any) {
        toast.error("Failed: " + e.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* 1. APP HEADER */}
      <div className="bg-[#0B132B] text-white p-6 pb-24 rounded-b-[30px] shadow-lg relative">
        <div className="flex justify-between items-center mb-6">
            <div>
                <p className="text-blue-200 text-xs uppercase tracking-wider">Welcome Back</p>
                <h1 className="text-xl font-bold">{member?.name}</h1>
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" size="icon" className="bg-white/10 text-white hover:bg-white/20 rounded-full"><Bell className="w-5 h-5"/></Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="bg-red-500/20 text-red-200 hover:bg-red-500/30 rounded-full"><LogOut className="w-5 h-5"/></Button>
            </div>
        </div>
      </div>

      {/* 2. MAIN CARDS (Floating) */}
      <div className="px-4 -mt-20">
        <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                    <div className="text-center space-y-1">
                        <p className="text-slate-400 text-xs font-medium uppercase">Total Savings</p>
                        <h2 className="text-2xl font-bold text-green-600">{fmt(stats.savings)}</h2>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-slate-400 text-xs font-medium uppercase">Active Loan</p>
                        <h2 className="text-2xl font-bold text-red-600">{fmt(stats.loan)}</h2>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50">
                    <Button onClick={() => setIsLoanModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold shadow-blue-200 shadow-lg">
                        Request New Loan
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* 3. RECENT TRANSACTIONS */}
      <div className="px-6 mt-8">
        <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500"/> Recent Activity
        </h3>
        
        <div className="space-y-3">
            {transactions.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-10">No transactions yet.</p>
            ) : (
                transactions.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${Number(t.deposit_amount) > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {Number(t.deposit_amount) > 0 ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 text-sm">{Number(t.deposit_amount) > 0 ? 'Deposit' : 'Loan/Fine'}</p>
                                <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <span className={`font-bold ${Number(t.deposit_amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(t.deposit_amount) > 0 ? `+${fmt(t.deposit_amount)}` : `-${fmt(Number(t.installment_amount) + Number(t.interest_amount))}`}
                        </span>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* LOAN MODAL */}
      <Dialog open={isLoanModalOpen} onOpenChange={setIsLoanModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Apply for Loan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Amount Required (₹)</Label>
                    <Input 
                        type="number" 
                        placeholder="e.g. 50000" 
                        value={loanAmount} 
                        onChange={(e) => setLoanAmount(e.target.value)}
                        className="text-lg font-bold"
                    />
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 border border-yellow-100">
                    Note: Your request will be sent to the admin for approval. Interest rates will be applied as per society rules.
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsLoanModalOpen(false)}>Cancel</Button>
                <Button onClick={handleLoanRequest} disabled={isSubmitting || !loanAmount} className="bg-blue-600 text-white">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Send Request"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
