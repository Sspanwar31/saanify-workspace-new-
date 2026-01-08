'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Standard import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PassbookTabProps {
  data: any[];    
  members: any[]; 
}

export default function PassbookTab({ data, members }: PassbookTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // ✅ IMPROVED: Handle Delete Logic (Smart Reverse Calculation)
  const handleDelete = async (entry: any) => {
    if(!confirm("Are you sure? Deleting this entry will reverse the transaction balance.")) return;
    setDeletingId(entry.id);

    try {
        const depositAmt = Number(entry.depositAmount || entry.deposit_amount || 0);
        const instAmt = Number(entry.installmentAmount || entry.installment_amount || 0);
        const memberId = entry.memberId || entry.member_id;

        // 1. Delete Passbook Entry First
        const { error } = await supabase.from('passbook_entries').delete().eq('id', entry.id);
        if(error) throw error;

        // 2. Reverse Loan Balance (If Installment was paid)
        // Note: Hum pehle Loan update karenge, taaki baad me Member sync sahi data uthaye
        if(instAmt > 0) {
            // Find active loans or recently closed loans
            const { data: loans } = await supabase
                .from('loans')
                .select('*')
                .eq('member_id', memberId)
                .order('created_at', { ascending: false }); // Latest first

            if(loans && loans.length > 0) {
                // Latest loan par reverse karo
                const targetLoan = loans.find(l => l.status === 'active') || loans[0];
                
                if (targetLoan) {
                    const newBal = Number(targetLoan.remaining_balance) + instAmt;
                    const status = newBal > 0 ? 'active' : 'closed';
                    
                    // Update and Wait
                    await supabase.from('loans').update({
                        remaining_balance: newBal,
                        status: status
                    }).eq('id', targetLoan.id);
                }
            }
        }

        // 3. FINAL SYNC: Update Member Totals from Scratch
        // Ab Loan table update ho chuki hai, ab total sahi aayega
        
        // A. Calculate Total Active Loans
        const { data: updatedLoans } = await supabase
            .from('loans')
            .select('remaining_balance')
            .eq('member_id', memberId)
            .eq('status', 'active');
            
        const realOutstanding = updatedLoans?.reduce((sum, l) => sum + Number(l.remaining_balance), 0) || 0;
        
        // B. Calculate Deposit (Directly Subtract)
        // Member table ko read karo aur minus karke update karo
        const { data: currentMember } = await supabase.from('members').select('total_deposits').eq('id', memberId).single();
        
        // Safety check: Deposit negative na ho
        const currentDep = Number(currentMember?.total_deposits || 0);
        const realDeposit = Math.max(0, currentDep - depositAmt);

        await supabase.from('members').update({
            outstanding_loan: realOutstanding, // ✅ Synced with updated Loan Table
            total_deposits: realDeposit
        }).eq('id', memberId);

        toast.success("Entry Deleted & Balances Re-Synced");
        window.location.reload();

    } catch(e: any) {
        toast.error("Delete Failed: " + e.message);
    } finally {
        setDeletingId(null);
    }
  };

  return (
    <div className="mt-6">
      <Card className="rounded-xl border-orange-100 shadow-sm">
        <CardHeader>
          <CardTitle>Passbook Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No entries found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((entry: any, i: number) => {
                    const member = members.find(m => m.id === entry.memberId);
                    const dateStr = entry.date || entry.created_at;
                    
                    const type = entry.type || (Number(entry.deposit_amount) > 0 ? 'DEPOSIT' : 'LOAN_REPAYMENT');

                    return (
                      <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-700">
                          {dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-800">
                          {member?.name || entry.memberName || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={type === 'DEPOSIT' ? 'default' : 'secondary'}
                            className={type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {entry.description || entry.note}
                        </TableCell>
                        <TableCell className={`font-bold ${type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(entry.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px]">
                            {entry.paymentMode || entry.payment_mode || 'CASH'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-blue-600 font-bold bg-blue-50/30">
                          {formatCurrency(entry.balance)}
                        </TableCell>
                        
                        <TableCell className="text-right">
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                onClick={() => handleDelete(entry)}
                                disabled={!!deletingId}
                            >
                                {deletingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                            </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
