'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { useSuperClientStore, Member } from '@/lib/super-client/store';

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoanRequestModal({ isOpen, onClose }: LoanRequestModalProps) {
  const { members, loans, requestLoan } = useSuperClientStore();

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLoanWarning, setActiveLoanWarning] = useState<string>('');

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Check if member already has an active loan
  useEffect(() => {
    if (selectedMemberId) {
      const activeLoan = loans.find(loan => 
        loan.memberId === selectedMemberId && loan.status === 'active'
      );
      
      if (activeLoan) {
        setActiveLoanWarning(`This member already has an active loan of ₹${activeLoan.remainingBalance.toLocaleString()}. New loan requests may be subject to additional review.`);
      } else {
        setActiveLoanWarning('');
      }
    } else {
      setActiveLoanWarning('');
    }
  }, [selectedMemberId, loans]);

  const handleSubmit = async () => {
    if (!selectedMemberId) {
      alert('Please select a member');
      return;
    }

    setIsSubmitting(true);

    try {
      const loanData = {
        memberId: selectedMemberId,
        amount: loanAmount ? parseFloat(loanAmount) : 0,
        interestRate: 12, // Default interest rate
        tenure: 12, // Default tenure in months
        startDate: new Date().toISOString().split('T')[0],
        maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        emiAmount: loanAmount ? (parseFloat(loanAmount) * 1.12) / 12 : 0, // Simple EMI calculation
        purpose: 'Loan request via super client'
      };

      const result = requestLoan(loanData);

      if (result.success) {
        alert('Loan request submitted successfully!');
        // Reset form
        setSelectedMemberId('');
        setLoanAmount('');
        onClose();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting loan request:', error);
      alert('An error occurred while submitting the loan request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter active members for selection
  const activeMembers = members.filter(member => member.status === 'active');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Request New Loan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="member">Select Member</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {activeMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loan Amount (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="loanAmount">Loan Amount (Optional)</Label>
            <Input
              id="loanAmount"
              type="number"
              placeholder="Enter amount or leave empty"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              If not specified, admin will determine the loan amount based on member's profile and deposit history.
            </p>
          </div>

          {/* Warning for Active Loans */}
          {activeLoanWarning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {activeLoanWarning}
              </AlertDescription>
            </Alert>
          )}

          {/* Member Info Display */}
          {selectedMember && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Member Details:</h4>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {selectedMember.name}</div>
                <div><strong>Phone:</strong> {selectedMember.phone}</div>
                <div><strong>Join Date:</strong> {selectedMember.joinDate}</div>
                <div><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    selectedMember.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Loan requests will be reviewed by the administrator. The final approved amount and terms are subject to admin discretion.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || !selectedMemberId}
            >
              {isSubmitting ? 'Submitting...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}