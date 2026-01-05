'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData: any;
}

export function EditLoanModal({ isOpen, onClose, loanData }: EditLoanModalProps) {
  const [amount, setAmount] = useState<string>('0');
  const [remainingBalance, setRemainingBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loanData) {
      setAmount(String(loanData.amount || 0));
      setRemainingBalance(String(loanData.remainingBalance || 0));
    }
  }, [loanData, isOpen]);

  const handleUpdate = async () => {
    if (!loanData?.id) return;

    const numAmount = parseFloat(amount);
    const numBalance = parseFloat(remainingBalance);

    if (isNaN(numAmount) || isNaN(numBalance)) {
      toast.error('Invalid Input', { description: 'Please enter valid numbers.' });
      return;
    }

    if (numAmount < 0 || numBalance < 0) {
      toast.error('Invalid Amount', { description: 'Values cannot be negative.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('loans')
        .update({
          amount: numAmount,
          remainingBalance: numBalance,
        })
        .eq('id', loanData.id);

      if (error) throw error;

      toast.success('Success', { description: 'Loan details updated successfully.' });
      onClose();
      window.location.reload();
    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Failed to update loan.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Loan</DialogTitle>
          <DialogDescription>
            Make changes to the loan amounts here.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Read-Only Fields */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member" className="text-right text-slate-500 font-medium">
              Member
            </Label>
            <Input
              id="member"
              value={loanData?.memberName || ''}
              disabled
              className="col-span-3 bg-slate-50"
            />
          </div>

          <div className="h-px bg-slate-200 my-1" />

          {/* Editable Fields */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right font-bold text-slate-800">
              Total Amount
            </Label>
            <div className="col-span-3 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <IndianRupee className="h-4 w-4" />
              </div>
              <Input
                id="amount"
                type="number"
                className="pl-9 focus-visible:ring-blue-500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right font-bold text-slate-800">
              Outstanding
            </Label>
            <div className="col-span-3 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <IndianRupee className="h-4 w-4" />
              </div>
              <Input
                id="balance"
                type="number"
                className="pl-9 focus-visible:ring-blue-500"
                value={remainingBalance}
                onChange={(e) => setRemainingBalance(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpdate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
