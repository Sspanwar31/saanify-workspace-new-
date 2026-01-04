'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function MemberLoans() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  
  // Modal State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLoans = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        const { data: memberData } = await supabase.from('members').select('*').eq('auth_user_id', user.id).single();
        if(memberData) {
            setMember(memberData);
            
            // Get Loans
            const { data: loans } = await supabase
                .from('loans')
                .select('*')
                .eq('member_id', memberData.id);

            const active = loans?.find(l => l.status === 'active');
            const pending = loans?.find(l => l.status === 'pending'); // Assuming request goes to loans table with status 'pending'
            // OR if you use 'loan_requests' table, fetch from there.
            
            setActiveLoan(active);
            setPendingRequest(pending);
        }
        setLoading(false);
    };
    fetchLoans();
  }, []);

  const handleRequest = async () => {
      if(!amount) return;
      setSubmitting(true);
      try {
          const { error } = await supabase.from('loans').insert([{
              client_id: member.client_id,
              member_id: member.id,
              amount: Number(amount),
              status: 'pending',
              remaining_balance: Number(amount),
              created_at: new Date().toISOString()
          }]);

          if(error) throw error;
          
          toast.success("Request Sent Successfully");
          setIsRequestOpen(false);
          setPendingRequest({ amount: Number(amount), status: 'pending' }); // Optimistic Update

      } catch(e: any) {
          toast.error(e.message);
      } finally {
          setSubmitting(false);
      }
  };

  if(loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline"/> Loading Loans...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Loans</h1>

      {/* 1. ACTIVE LOAN */}
      {activeLoan ? (
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-red-600 bg-red-50">Active Loan</Badge>
              <span className="text-xs text-gray-500">{new Date(activeLoan.start_date || activeLoan.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-end">
               <div>
                 <p className="text-sm text-gray-500">Remaining Balance</p>
                 <p className="text-3xl font-bold text-gray-900">₹{Number(activeLoan.remaining_balance).toLocaleString()}</p>
               </div>
               <div className="text-right">
                 <p className="text-sm text-gray-500">Total Taken</p>
                 <p className="font-medium">₹{Number(activeLoan.amount).toLocaleString()}</p>
               </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        !pendingRequest && (
            <Card className="bg-green-50 border-green-100">
            <CardContent className="p-6 text-center">
                <p className="text-green-700 font-medium">You have no active loans.</p>
            </CardContent>
            </Card>
        )
      )}

      {/* 2. PENDING REQUEST */}
      {pendingRequest && (
        <Card className="bg-yellow-50 border-yellow-200 animate-pulse">
           <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-yellow-800 font-bold">Request Pending</p>
                <p className="text-xs text-yellow-600">₹{Number(pendingRequest.amount).toLocaleString()} - Under Review</p>
              </div>
              <Badge className="bg-yellow-200 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
           </CardContent>
        </Card>
      )}

      {/* 3. REQUEST BUTTON */}
      {!pendingRequest && !activeLoan && (
        <Button 
          onClick={() => setIsRequestOpen(true)}
          className="w-full h-12 text-lg bg-gray-900 hover:bg-black rounded-xl shadow-xl"
        >
          Request New Loan
        </Button>
      )}

      {/* MODAL */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Apply for Loan</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label>Amount Required</Label>
                    <Input type="number" placeholder="50000" value={amount} onChange={e=>setAmount(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleRequest} disabled={submitting} className="bg-blue-600 w-full">
                    {submitting ? <Loader2 className="animate-spin"/> : "Submit Request"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
