'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Standard import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ 1. Import Hook

interface PassbookTabProps {
  data: any[];    
  members: any[]; 
}

export default function PassbookTab({ data, members }: PassbookTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // ✅ 2. Call Hook
  const { formatCurrency } = useCurrency();

  // ❌ 3. Manual formatCurrency function REMOVED (Replaced by Hook)

  // ✅ SIMPLIFIED DELETE LOGIC (Let Trigger Handle Loan)
  const handleDelete = async (entry: any) => {
    if(!confirm("Are you sure? This will delete the transaction.")) return;
    setDeletingId(entry.id);

    try {
        const depositAmt = Number(entry.depositAmount || entry.deposit_amount || 0);
        // Note: Installment logic hata diya hai, Database Trigger khud sambhal lega
        const memberId = entry.memberId || entry.member_id;

        // 1. Delete Passbook Entry First
        const { error } = await supabase.from('passbook_entries').delete().eq('id', entry.id);
        if(error) throw error;

        // 2. Reverse Deposit Balance (Only Deposit needs manual sync here)
        // Kyunki loan trigger se sync ho raha hai, hum sirf deposit ko manually adjust karenge
        if(depositAmt > 0) {
            const { data: currentMember } = await supabase
                .from('members')
                .select('total_deposits')
                .eq('id', memberId)
                .single();
                
            const currentDep = Number(currentMember?.total_deposits || 0);
            const realDeposit = Math.max(0, currentDep - depositAmt);

            await supabase.from('members').update({
                total_deposits: realDeposit
            }).eq('id', memberId);
        }

        toast.success("Entry Deleted Successfully");
        
        // Reload to fetch updated data from trigger
        setTimeout(() => window.location.reload(), 800);

    } catch(e: any) {
        toast.error("Delete Failed: " + e.message);
    } finally {
        setDeletingId(null);
    }
  };

  return (
    <div className="mt-6">
      <Card className="rounded-xl border-gray-800 shadow-sm bg-gray-900">
        <CardHeader>
          <CardTitle className="text-gray-200">Passbook Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-950 z-10 shadow-sm border-b border-gray-800">
                <TableRow>
                  <TableHead className="w-[120px] text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Member</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Description</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Payment Mode</TableHead>
                  <TableHead className="text-gray-300">Balance</TableHead>
                  <TableHead className="text-right text-gray-300">Action</TableHead> 
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
                      <TableRow key={i} className="hover:bg-gray-800 transition-colors border-b border-gray-800">
                        <TableCell className="font-medium text-gray-300">
                          {dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-200">
                          {member?.name || entry.memberName || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={type === 'DEPOSIT' ? 'default' : 'secondary'}
                            className={type === 'DEPOSIT' ? 'bg-green-900/50 text-green-300 hover:bg-green-900/80 border-green-700' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600'}
                          >
                            {type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm max-w-[200px] truncate">
                          {entry.description || entry.note}
                        </TableCell>
                        
                        {/* ✅ 4. Hook Usage Here */}
                        <TableCell className={`font-bold ${type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(Math.abs(entry.amount))}
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px] text-gray-300 border-gray-700">
                            {entry.paymentMode || entry.payment_mode || 'CASH'}
                          </Badge>
                        </TableCell>
                        
                        {/* ✅ 5. Hook Usage Here */}
                        <TableCell className="text-blue-400 font-bold bg-blue-950/20">
                          {formatCurrency(entry.balance)}
                        </TableCell>
                        
                        <TableCell className="text-right">
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-red-400 hover:text-red-500 hover:bg-red-950/50 h-8 w-8"
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
