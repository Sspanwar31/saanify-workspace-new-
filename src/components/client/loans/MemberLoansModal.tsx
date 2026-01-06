'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Lock, User } from 'lucide-react';
import { EditLoanModal } from './EditLoanModal';
import { toast } from 'sonner';

interface MemberLoansModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  loans: any[]; // List of individual loans
}

export function MemberLoansModal({ isOpen, onClose, memberName, loans }: MemberLoansModalProps) {
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const handleDelete = async (loanId: string) => {
    if(!confirm("Are you sure you want to DELETE this loan entry? This action cannot be undone.")) return;

    try {
        const { error } = await supabase.from('loans').delete().eq('id', loanId);
        if(error) throw error;
        toast.success("Loan entry deleted");
        window.location.reload();
    } catch(e: any) {
        toast.error(e.message);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl border-b pb-4">
              <div className="bg-blue-100 p-2 rounded-full"><User className="h-5 w-5 text-blue-600"/></div>
              Loan History: <span className="text-blue-700 font-bold">{memberName}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Interest (1%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const isClosed = loan.remainingBalance <= 0 || loan.status === 'closed';
                  
                  return (
                    <TableRow key={loan.id} className={`hover:bg-slate-50 ${isClosed ? 'opacity-70 bg-slate-50/50' : ''}`}>
                      <TableCell className="font-medium text-slate-600">
                        {formatDate(loan.start_date || loan.created_at)}
                      </TableCell>
                      
                      <TableCell className="font-bold text-blue-600">
                        {formatCurrency(loan.amount)}
                      </TableCell>
                      
                      <TableCell className={isClosed ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {isClosed ? 'Cleared' : formatCurrency(loan.remainingBalance)}
                      </TableCell>
                      
                      <TableCell className="text-purple-600">
                        {isClosed ? '-' : formatCurrency(Math.round(loan.remainingBalance * 0.01))}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={isClosed ? 'outline' : 'destructive'} 
                          className={isClosed ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-800'}>
                          {isClosed ? 'CLOSED' : 'ACTIVE'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isClosed ? (
                            // LOCKED MODE (For Closed Loans)
                            <Button size="sm" variant="ghost" disabled className="text-gray-400 cursor-not-allowed">
                               <Lock className="w-4 h-4 mr-1"/> Locked
                            </Button>
                          ) : (
                            // EDIT MODE (For Active Loans)
                            <>
                                <Button size="sm" variant="outline" onClick={() => setSelectedLoan({...loan, memberName})}>
                                    <Edit className="w-4 h-4 mr-1"/> Edit
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(loan.id)}>
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button onClick={onClose} variant="secondary">Close Viewer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal (Wahi purana wala jo humne fix kiya tha) */}
      {selectedLoan && (
        <EditLoanModal 
          isOpen={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
          loanData={selectedLoan}
        />
      )}
    </>
  );
}
