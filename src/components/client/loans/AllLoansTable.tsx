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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData: any;
}

export function EditLoanModal({ isOpen, onClose, loanData }: EditLoanModalProps) {
  // State for editable fields
  const [amount, setAmount] = useState<number>(0);
  const [remainingBalance, setRemainingBalance] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);

  // Populate form when modal opens or data changes
  useEffect(() => {
    if (loanData) {
      setAmount(loanData.amount || 0);
      setRemainingBalance(loanData.remainingBalance || 0);
    }
  }, [loanData, isOpen]);

  const handleUpdate = async () => {
    if (!loanData?.id) return;

    // Basic Validation
    if (amount < 0 || remainingBalance < 0) {
      toast.error('Invalid Amount', { description: 'Values cannot be negative.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('loans')
        .update({
          amount: amount,
          remainingBalance: remainingBalance,
          // Note: Hum sirf Amount aur Balance update kar rahe hain, baaki data safe rahega.
        })
        .eq('id', loanData.id);

      if (error) throw error;

      toast.success('Loan Updated', { description: 'Changes saved successfully.' });
      onClose(); // Modal band karein
      window.location.reload(); // Refresh to show new data in table
    } catch (error: any) {
      toast.error('Update Failed', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Loan Details</DialogTitle>
          <DialogDescription>
            Adjust the total principal or the outstanding balance for this loan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* --- READ ONLY FIELDS (Context kept) --- */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="memberName" className="text-right text-slate-500 font-medium">
              Member Name
            </Label>
            <Input
              id="memberName"
              value={loanData?.memberName || '-'}
              disabled
              className="col-span-3 bg-slate-50 border-slate-200 text-slate-700"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right text-slate-500 font-medium">
              Start Date
            </Label>
            <Input
              id="startDate"
              value={loanData?.startDate ? new Date(loanData.startDate).toLocaleDateString() : '-'}
              disabled
              className="col-span-3 bg-slate-50 border-slate-200 text-slate-700"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right text-slate-500 font-medium">
              Current Status
            </Label>
            <Input
              id="status"
              value={loanData?.status || 'Active'}
              disabled
              className="col-span-3 bg-slate-50 border-slate-200 text-slate-700"
            />
          </div>

          <div className="h-px bg-slate-200 my-2" />

          {/* --- EDITABLE FIELDS --- */}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right font-bold text-slate-800">
              Total Amount
            </Label>
            <div className="col-span-3 relative">
              <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="pl-7 font-medium text-blue-600 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="remainingBalance" className="text-right font-bold text-slate-800">
              Outstanding
            </Label>
            <div className="col-span-3 relative">
              <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
              <Input
                id="remainingBalance"
                type="number"
                value={remainingBalance}
                onChange={(e) => setRemainingBalance(parseFloat(e.target.value) || 0)}
                className="pl-7 font-medium text-red-600 focus-visible:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpdate} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
