'use client';

import React, { useState, useEffect } from 'react';
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
import { useClientStore, Member, PassbookEntry } from '@/lib/client/store';

interface PassbookAddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: PassbookEntry | null; // Add this prop
}

export default function PassbookAddEntryModal({ isOpen, onClose, entryToEdit }: PassbookAddEntryModalProps) {
  const { 
    members, 
    loans, 
    addPassbookEntry, 
    getMemberDepositBalance, 
    getMemberOutstandingLoan 
  } = useClientStore();

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [installmentAmount, setInstallmentAmount] = useState<string>('');

  // Calculated values
  const [currentDepositBalance, setCurrentDepositBalance] = useState<number>(0);
  const [outstandingLoan, setOutstandingLoan] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [fine, setFine] = useState<number>(0);
  const [projectedLoan, setProjectedLoan] = useState<number>(0);
  const [projectedDeposit, setProjectedDeposit] = useState<number>(0);

  // Data Population Effect for Edit Mode
  useEffect(() => {
    if (entryToEdit) {
      setSelectedMemberId(entryToEdit.memberId);
      setDepositAmount(entryToEdit.depositAmount?.toString() || '0');
      setInstallmentAmount(entryToEdit.installmentAmount?.toString() || '0');
      setPaymentMode(entryToEdit.paymentMode || 'cash');
      // Set date if available
      if (entryToEdit.date) {
        setDate(new Date(entryToEdit.date));
      }
    } else {
      // Reset if adding new
      setDepositAmount('');
      setInstallmentAmount('');
      setPaymentMode('cash');
      setDate(new Date());
    }
  }, [entryToEdit, isOpen]);

  // Auto-calculations
  useEffect(() => {
    if (selectedMemberId) {
      const depositBalance = getMemberDepositBalance(selectedMemberId);
      const outstanding = getMemberOutstandingLoan(selectedMemberId);
      
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
  }, [selectedMemberId, date, depositAmount, installmentAmount, getMemberDepositBalance, getMemberOutstandingLoan]);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const handleSubmit = () => {
    if (!selectedMemberId || (!depositAmount && !installmentAmount)) {
      alert('Please select a member and enter at least deposit or installment amount');
      return;
    }

    const entry: Omit<PassbookEntry, 'id' | 'balance'> = {
      memberId: selectedMemberId,
      date: format(date, 'yyyy-MM-dd'),
      type: 'deposit',
      amount: parseFloat(depositAmount) || 0,
      description: 'Passbook entry',
      balance: 0,
      depositAmount: parseFloat(depositAmount) || 0,
      installmentAmount: parseFloat(installmentAmount) || 0,
      interestAmount: interest,
      fineAmount: fine,
      paymentMode
    };

    addPassbookEntry(entry);
    
    // Reset form
    setSelectedMemberId('');
    setDepositAmount('');
    setInstallmentAmount('');
    setPaymentMode('cash');
    setDate(new Date());
    
    onClose();
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
                      {members.filter(m => m.status === 'active').map((member) => (
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
              disabled={!selectedMemberId || (!depositAmount && !installmentAmount)}
            >
              {entryToEdit ? 'Update Entry' : 'Create Entry'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}