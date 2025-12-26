'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
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
  const [members, setMembers] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLoanWarning, setActiveLoanWarning] = useState<string>('');

  // 1. Fetch Data
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const { data: clients } = await supabase.from('clients').select('id').limit(1);
        if (clients && clients.length > 0) {
          const cid = clients[0].id;
          setClientId(cid);

          const { data: membersData } = await supabase
            .from('members')
            .select('id, name, phone, status') // Fetch specific fields
            .eq('client_id', cid)
            .order('name', { ascending: true });
          
          if (membersData) setMembers(membersData);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // 2. Check Active Loan
  useEffect(() => {
    const checkActiveLoan = async () => {
      if (selectedMemberId && clientId) {
        const { data: activeLoans } = await supabase
          .from('loans')
          .select('amount, remaining_balance')
          .eq('member_id', selectedMemberId)
          .eq('status', 'active');
        
        if (activeLoans && activeLoans.length > 0) {
          const loan = activeLoans[0];
          const balance = loan.remaining_balance || loan.amount;
          setActiveLoanWarning(`This member has an active loan (Bal: ₹${balance.toLocaleString()}).`);
        } else {
          setActiveLoanWarning('');
        }
      }
    };
    checkActiveLoan();
  }, [selectedMemberId, clientId]);

  // Auto-select
  useEffect(() => {
    if (preSelectedMemberId && isOpen) setSelectedMemberId(preSelectedMemberId);
  }, [preSelectedMemberId, isOpen]);

  // 3. Submit Handler (Fixed: Removed 'purpose' to fix error)
  const handleSubmit = async () => {
    if (!selectedMemberId || !clientId) return alert('Please select a member');
    setIsSubmitting(true);

    try {
      const amountVal = loanAmount ? parseFloat(loanAmount) : 0;
      const startDate = new Date().toISOString().split('T')[0];

      // ✅ FIXED: Only sending columns that exist in your DB
      const loanData = {
        client_id: clientId,
        member_id: selectedMemberId,
        amount: amountVal,
        status: 'pending',
        start_date: startDate,
        // purpose: 'Loan Request' // Removed to prevent error
      };

      const { error } = await supabase.from('loans').insert([loanData]);

      if (!error) {
        alert('Loan request sent! Waiting for Admin Approval.');
        setSelectedMemberId('');
        setLoanAmount('');
        onClose();
      } else {
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request New Loan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Select */}
          {!preSelectedMemberId ? (
            <div className="space-y-2">
              <Label>Select Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger><SelectValue placeholder="Choose Member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="bg-orange-50 p-2 rounded border border-orange-200 text-orange-900 font-medium">
              Requesting for: {selectedMember?.name}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>Loan Amount</Label>
            <Input 
              type="number" 
              placeholder="Amount" 
              value={loanAmount} 
              onChange={(e) => setLoanAmount(e.target.value)} 
            />
          </div>

          {/* Warning */}
          {activeLoanWarning && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">{activeLoanWarning}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <Alert className="bg-blue-50 text-blue-900 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs">
              This request will appear in the Admin Panel for approval (80% Limit Logic applies there).
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !loanAmount} className="flex-1 bg-orange-600 hover:bg-orange-700">
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
