'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; // ✅ Supabase Connection Added
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
  // --- Local State to replace Store ---
  const [members, setMembers] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLoanWarning, setActiveLoanWarning] = useState<string>('');

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // 1. ✅ Fetch Client & Members Data from Supabase
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        // ✅ CHANGE #1: Client ID fetch (MAIN BUG) - Logic Updated Here
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return;

        const user = JSON.parse(userStr);
        const resolvedClientId = user.client_id ?? user.id;

        if (!resolvedClientId) {
          console.error('CLIENT ID NOT FOUND', user);
          return;
        }

        setClientId(resolvedClientId);

        // Get Members linked to this client
        const { data: membersData } = await supabase
          .from('members')
          .select('*')
          .eq('client_id', resolvedClientId)
          .order('name', { ascending: true });
        
        if (membersData) setMembers(membersData);
      };
      fetchData();
    }
  }, [isOpen]);

  // 2. ✅ Check Active Loan (Converted Store Logic to Supabase Query)
  useEffect(() => {
    const checkActiveLoan = async () => {
      if (selectedMemberId && clientId) {
        // Query loans table
        const { data: activeLoans } = await supabase
          .from('loans')
          .select('amount, remaining_balance')
          // ✅ CHANGE #3: Added client_id filter & pending status check
          .eq('client_id', clientId)          // 🔴 MISSING FILTER
          .eq('member_id', selectedMemberId)
          .in('status', ['active', 'pending']) // 🔴 pending bhi check karo
          .gt('remaining_balance', 0); 
      
        if (activeLoans && activeLoans.length > 0) {
          const loan = activeLoans[0];
          const balance = loan.remaining_balance || loan.amount; // Fallback to amount if balance is null
          
          setActiveLoanWarning(`This member already has an active loan of ₹${balance.toLocaleString()}. New loan requests may be subject to additional review.`);
        } else {
          setActiveLoanWarning('');
        }
      } else {
        setActiveLoanWarning('');
      }
    };
    checkActiveLoan();
  }, [selectedMemberId, clientId]);

  // Auto-select member if preSelectedMemberId is provided
  useEffect(() => {
    if (preSelectedMemberId && isOpen) {
      setSelectedMemberId(preSelectedMemberId);
    }
  }, [preSelectedMemberId, isOpen]);

  // 3. ✅ Submit Handler (Converted to Supabase Insert)
  const handleSubmit = async () => {
    if (!selectedMemberId || !clientId) {
      alert('Please select a member');
      return;
    }

    setIsSubmitting(true);

    try {
      const amountVal = loanAmount ? parseFloat(loanAmount) : 0;
      
      // ✅ DIFF–4: Pending loan guard (IMPORTANT)
      const { data: activeLoans } = await supabase
        .from('loans')
        .select('id')
        .eq('client_id', clientId)
        .eq('member_id', selectedMemberId)
        .in('status', ['active', 'pending']);

      if (activeLoans && activeLoans.length > 0) {
        alert('This member already has an active or pending loan.');
        setIsSubmitting(false);
        return;
      }
      
      // Calculations (Frontend Safe - Kept for logic but NOT inserted)
      const interestRate = 12;
      const tenure = 12;
      const startDate = new Date().toISOString().split('T')[0];
      const maturityDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const emiAmount = amountVal ? (amountVal * 1.12) / 12 : 0;

      // ✅ DIFF–5: Loan insert (SAFE MINIMUM)
      // Insert into Supabase
      const { error } = await supabase.from('loans').insert([{
        client_id: clientId,
        member_id: selectedMemberId,
        amount: amountVal,
        status: 'pending',
        start_date: startDate,
        remaining_balance: amountVal
      }]);

      if (!error) {
        alert('Loan request submitted successfully!');
        // Reset form
        setSelectedMemberId('');
        setLoanAmount('');
        onClose();
        // Optional: Reload to show update immediately
        // window.location.reload(); 
      } else {
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting loan request:', error);
      alert('An error occurred while submitting loan request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ CHANGE #3: Active members filter (silent dropdown bug) - Logic Updated Here
  const activeMembers = members.filter(
    member => !member.status || member.status === 'active'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Request New Loan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Selection - Hide if preSelectedMemberId is provided */}
          {!preSelectedMemberId ? (
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
              If not specified, admin will determine loan amount based on member's profile and deposit history.
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
                {/* <div><strong>Join Date:</strong> {selectedMember.join_date}</div> */}
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
              Loan requests will be reviewed by administrator. The final approved amount and terms are subject to admin discretion.
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
