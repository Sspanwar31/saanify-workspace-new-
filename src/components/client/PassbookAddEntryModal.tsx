'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; // Supabase Connection
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Local Interface needed since we removed the store
interface Member {
  id: string;
  name: string;
  phone: string;
  status: string;
  total_deposits?: number;
  outstanding_loan?: number;
}

interface PassbookAddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: any | null;
}

export default function PassbookAddEntryModal({ isOpen, onClose, entryToEdit }: PassbookAddEntryModalProps) {
  // --- Supabase States ---
  const [members, setMembers] = useState<Member[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  // --- Form States ---
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [installmentAmount, setInstallmentAmount] = useState<string>('');

  // --- Calculated Values ---
  const [currentDepositBalance, setCurrentDepositBalance] = useState<number>(0);
  const [outstandingLoan, setOutstandingLoan] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [fine, setFine] = useState<number>(0);
  const [projectedLoan, setProjectedLoan] = useState<number>(0);
  const [projectedDeposit, setProjectedDeposit] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Client & Members
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        // Get Client ID
        const { data: clients } = await supabase.from('clients').select('id').limit(1);
        if (clients && clients.length > 0) {
          const cid = clients[0].id;
          setClientId(cid);

          // Get Members
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

  // 2. Populate for Edit Mode
  useEffect(() => {
    if (entryToEdit) {
      setSelectedMemberId(entryToEdit.member_id || entryToEdit.memberId);
      setDepositAmount(entryToEdit.deposit_amount?.toString() || '0');
      setInstallmentAmount(entryToEdit.installment_amount?.toString() || '0');
      setPaymentMode(entryToEdit.payment_mode || 'cash');
      if (entryToEdit.date) {
        setDate(new Date(entryToEdit.date));
      }
    } else {
      setDepositAmount('');
      setInstallmentAmount('');
      setPaymentMode('cash');
      setDate(new Date());
    }
  }, [entryToEdit, isOpen]);

  // 3. Auto-calculations (Live Logic)
  useEffect(() => {
    const selectedMember = members.find(m => m.id === selectedMemberId);

    if (selectedMember) {
      // Data from Database Columns
      const depositBalance = selectedMember.total_deposits || 0;
      const outstanding = selectedMember.outstanding_loan || 0;
      
      setCurrentDepositBalance(depositBalance);
      setOutstandingLoan(outstanding);

      // Calculate interest (1% of outstanding loan)
      const interestAmount = outstanding * 0.01;
      setInterest(interestAmount);

      // Calculate fine (if date.day > 15, fine = (day - 15) * 10)
      const dayOfMonth = date.getDate();
      const fineAmount = dayOfMonth > 15 ? (dayOfMonth - 15) * 10 : 0;
      setFine(fineAmount);

      // Calculate projected values
      const deposit = parseFloat(depositAmount) || 0;
      const installment = parseFloat(installmentAmount) || 0;
      
      setProjectedLoan(Math.max(0, outstanding - installment));
      setProjectedDeposit(depositBalance + deposit);
    } else {
      setCurrentDepositBalance(0);
      setOutstandingLoan(0);
      setInterest(0);
      setFine(0);
      setProjectedLoan(0);
      setProjectedDeposit(0);
    }
  }, [selectedMemberId, date, depositAmount, installmentAmount, members]);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // 4. Submit Handler (Supabase)
  const handleSubmit = async () => {
    if (!selectedMemberId || (!depositAmount && !installmentAmount)) {
      alert('Please select a member and enter at least deposit or installment amount');
      return;
    }

    setLoading(true);
    const depAmt = parseFloat(depositAmount) || 0;
    const instAmt = parseFloat(installmentAmount) || 0;
    
    // Total Amount Calculation
    const total = depAmt + instAmt + interest + fine;

    // A. Insert into passbook_entries
    const { error } = await supabase.from('passbook_entries').insert([{
      member_id: selectedMemberId,
      member_name: selectedMember?.name,
      date: format(date, 'yyyy-MM-dd'),
      payment_mode: paymentMode,
      deposit_amount: depAmt,
      installment_amount: instAmt,
      interest_amount: interest,
      fine_amount: fine,
      total_amount: total,
      note: 'Passbook Entry'
    }]);

    if (!error) {
      // B. Update Member Balances in Database
      if (depAmt > 0 || instAmt > 0) {
        const newLoanBal = (selectedMember?.outstanding_loan || 0) - instAmt;
        const newDepositTotal = (selectedMember?.total_deposits || 0) + depAmt;

        await supabase.from('members').update({
            outstanding_loan: newLoanBal,
            total_deposits: newDepositTotal
        }).eq('id', selectedMemberId);
      }

      // Reset & Close
      setSelectedMemberId('');
      setDepositAmount('');
      setInstallmentAmount('');
      setPaymentMode('cash');
      setDate(new Date());
      onClose();
    } else {
      alert("Error adding entry: " + error.message);
    }
    setLoading(false);
  };

  const totalToCollect = (parseFloat(depositAmount) || 0) + 
                        (parseFloat(installmentAmount) || 0) + 
                        interest + fine;

  const loanProgressPercentage = outstandingLoan > 0 ? ((outstandingLoan - projectedLoan) / outstandingLoan) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {entryToEdit ? 'Edit Passbook Entry' : 'Add Passbook Entry'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entry Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Member Selection */}
                <div className="space-y-2">
                  <Label htmlFor="member">Select Member</Label>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select a member" />
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

                {/* Date Picker */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Payment Mode */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Deposit Amount */}
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="Enter deposit amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>

                {/* Installment Amount */}
                <div className="space-y-2">
                  <Label htmlFor="installmentAmount">Installment Amount</Label>
                  <Input
                    id="installmentAmount"
                    type="number"
                    placeholder="Enter installment amount"
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                  />
                </div>

                {/* Auto-calculated Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interest">Interest (Auto)</Label>
                    <Input
                      id="interest"
                      type="number"
                      value={interest.toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fine">Fine (Auto)</Label>
                    <Input
                      id="fine"
                      type="number"
                      value={fine.toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Live Feedback Cards */}
          <div className="space-y-4">
            {/* Member Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedMember ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Name:</span>
                      <span>{selectedMember.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Current Deposit:</span>
                      <div className="flex items-center gap-2">
                        <span>₹{currentDepositBalance.toLocaleString()}</span>
                        {depositAmount && parseFloat(depositAmount) > 0 && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            +₹{parseFloat(depositAmount).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Outstanding Loan:</span>
                      <div className="flex items-center gap-2">
                        <span>₹{outstandingLoan.toLocaleString()}</span>
                        {installmentAmount && parseFloat(installmentAmount) > 0 && (
                          <Badge variant="default" className="bg-red-100 text-red-800">
                            -₹{parseFloat(installmentAmount).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Please select a member</p>
                )}
              </CardContent>
            </Card>

            {/* Live Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMember ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Deposit:</span>
                        <span>₹{(parseFloat(depositAmount) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Installment:</span>
                        <span>₹{(parseFloat(installmentAmount) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest/Fine:</span>
                        <span>₹{(interest + fine).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total to Collect:</span>
                          <span className="text-blue-600">₹{totalToCollect.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {outstandingLoan > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Final Loan Balance:</span>
                          <span className="font-medium">₹{projectedLoan.toLocaleString()}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Progress:</span>
                            <span>{loanProgressPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={loanProgressPercentage} className="h-2" />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Final Deposit Balance:</span>
                      <span className="font-medium text-green-600">₹{projectedDeposit.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Select a member to see preview</p>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={loading || !selectedMemberId || (!depositAmount && !installmentAmount)}
            >
              {loading ? 'Processing...' : (entryToEdit ? 'Update Entry' : 'Create Entry')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
