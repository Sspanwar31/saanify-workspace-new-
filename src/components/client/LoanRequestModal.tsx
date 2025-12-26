'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; // Supabase Connection
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedMemberId?: string;
}

export default function LoanRequestModal({ isOpen, onClose, preSelectedMemberId }: LoanRequestModalProps) {
  // --- Supabase States ---
  const [members, setMembers] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  // --- Form States ---
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLoanWarning, setActiveLoanWarning] = useState<string>('');

  // 1. Fetch Client & Members
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const { data: clients } = await supabase.from('clients').select('id').limit(1);
        if (clients && clients.length > 0) {
          const cid = clients[0].id;
          setClientId(cid);

          const { data: membersData } = await supabase
            .from('members')
            .select('*')
            .eq('client_id', cid);
          
          if (membersData) setMembers(membersData);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // 2. Check for Active Loan (Async Check in Supabase)
  useEffect(() => {
    const checkActiveLoan = async () => {
      if (selectedMemberId && clientId) {
        // Query loans table for active status
        const { data: activeLoans } = await supabase
          .from('loans')
          .select('*')
          .eq('member_id', selectedMemberId)
          .eq('status', 'active');
        
        if (activeLoans && activeLoans.length > 0) {
          const loan = activeLoans[0];
          setActiveLoanWarning(`This member already has an active loan of ₹${(loan.remaining_balance || loan.amount).toLocaleString()}. New loan requests may be subject to additional review.`);
        } else {
          setActiveLoanWarning('');
        }
      } else {
        setActiveLoanWarning('');
      }
    };
    checkActiveLoan();
  }, [selectedMemberId, clientId]);

  // Auto-select if prop provided
  useEffect(() => {
    if (preSelectedMemberId && isOpen) {
      setSelectedMemberId(preSelectedMemberId);
    }
  }, [preSelectedMemberId, isOpen]);

  // 3. Submit Handler (Supabase)
  const handleSubmit = async () => {
    if (!selectedMemberId || !clientId) {
      alert('Please select a member');
      return;
    }

    setIsSubmitting(true);

    try {
      const amountVal = loanAmount ? parseFloat(loanAmount) : 0;
      
      const { error } = await supabase.from('loans').insert([{
        client_id: clientId,
        member_id: selectedMemberId,
        amount: amountVal,
        status: 'pending', // Default status for requests
        start_date: new Date().toISOString().split('T')[0],
        // Additional fields can be added here if your schema supports them
        // interest_rate: 12,
        // duration: 12,
      }]);

      if (!error) {
        alert('Loan request submitted successfully!');
        setSelectedMemberId('');
        setLoanAmount('');
        onClose();
      } else {
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting loan request:', error);
      alert('An error occurred while submitting the loan request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Request New Loan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Selection */}
          {!preSelectedMemberId ? (
            <div className="space-y-2">
              <Label htmlFor="member">Select Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Requesting For</Label>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="font-medium text-orange-900">
                  {selectedMember?.name}
                </p>
              </div>
            </div>
          )}

          {/* Loan Amount */}
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
              If not specified, admin will determine the loan amount based on member's profile.
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
                <div><strong>Status:</strong> 
                  <span className="ml-2 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Active
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
