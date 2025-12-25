'use client';
import { useState } from 'react';
import { useClientStore } from '@/lib/client/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditLoanModal({ isOpen, onClose, loanData }: any) {
  const { updateLoan } = useClientStore();
  const [balance, setBalance] = useState(loanData?.remainingBalance || 0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update via API first to persist to database
      const response = await fetch(`/api/client/loans/${loanData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loanAmount: loanData.amount,
          interestRate: loanData.interestRate || 12,
          remainingBalance: parseFloat(balance),
          status: loanData.status,
          startDate: loanData.startDate,
          endDate: loanData.endDate
        })
      });

      if (response.ok) {
        // Update local store as well
        updateLoan(loanData.id, { remainingBalance: parseFloat(balance) });
        onClose();
      } else {
        alert('Failed to update loan. Please try again.');
      }
    } catch (error) {
      console.error('Error updating loan:', error);
      alert('Failed to update loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Loan Balance</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="balance">Outstanding Balance</Label>
            <Input 
              id="balance"
              type="number" 
              step="0.01"
              value={balance} 
              onChange={(e) => setBalance(e.target.value)} 
              placeholder="Enter outstanding balance"
            />
          </div>
          <div className="text-sm text-gray-600">
            <p>Member: {loanData?.memberName || 'Unknown'}</p>
            <p>Original Amount: {loanData?.amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(loanData.amount) : 'N/A'}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}