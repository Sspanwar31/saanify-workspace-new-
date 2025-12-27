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

interface PassbookAddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: any | null; // Data for editing
}

export default function PassbookAddEntryModal({ isOpen, onClose, entryToEdit }: PassbookAddEntryModalProps) {
  // --- Supabase States ---
  const [members, setMembers] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  // --- Form States ---
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [installmentAmount, setInstallmentAmount] = useState<string>('');
  
  // Custom Interest/Fine States (Manual Override allow karne ke liye)
  const [interestAmount, setInterestAmount] = useState<string>(''); 
  const [fineAmount, setFineAmount] = useState<string>(''); 

  // --- Calculated Values ---
  const [currentDepositBalance, setCurrentDepositBalance] = useState<number>(0);
  const [outstandingLoan, setOutstandingLoan] = useState<number>(0);
  const [projectedLoan, setProjectedLoan] = useState<number>(0);
  const [projectedDeposit, setProjectedDeposit] = useState<number>(0);
  const [loading, setLoading] = useState(false);

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

  // 2. Populate for Edit Mode (Existing Data Load Karna)
  useEffect(() => {
    if (isOpen) {
        if (entryToEdit) {
            // Edit Mode: Fill form with existing data
            setSelectedMemberId(entryToEdit.member_id || entryToEdit.memberId);
            setDepositAmount(entryToEdit.deposit_amount?.toString() || '0');
            setInstallmentAmount(entryToEdit.installment_amount?.toString() || '0');
            setInterestAmount(entryToEdit.interest_amount?.toString() || '0'); // Load saved interest
            setFineAmount(entryToEdit.fine_amount?.toString() || '0');         // Load saved fine
            setPaymentMode(entryToEdit.payment_mode || 'cash');
            if (entryToEdit.date) {
                setDate(new Date(entryToEdit.date));
            }
        } else {
            // Add Mode: Reset form
            setSelectedMemberId('');
            setDepositAmount('');
            setInstallmentAmount('');
            setInterestAmount(''); // Clear
            setFineAmount('');     // Clear
            setPaymentMode('cash');
            setDate(new Date());
        }
    }
  }, [entryToEdit, isOpen]);

  // 3. Auto-calculations (Only if fields are empty OR user changes member/date)
  useEffect(() => {
    const selectedMember = members.find(m => m.id === selectedMemberId);

    if (selectedMember) {
      const depositBalance = selectedMember.total_deposits || 0;
      const outstanding = selectedMember.outstanding_loan || 0;
      
      setCurrentDepositBalance(depositBalance);
      setOutstandingLoan(outstanding);

      // Only Auto-Calculate if we are NOT in Edit Mode OR if fields are empty
      // This prevents overwriting saved edited values
      if (!entryToEdit) {
          // Interest (1%)
          const calculatedInterest = outstanding * 0.01;
          if (!interestAmount) setInterestAmount(calculatedInterest.toString());

          // Fine
          const dayOfMonth = date.getDate();
          const calculatedFine = dayOfMonth > 15 ? (dayOfMonth - 15) * 10 : 0;
          if (!fineAmount) setFineAmount(calculatedFine.toString());
      }

      // Projections
      const dep = parseFloat(depositAmount) || 0;
      const inst = parseFloat(installmentAmount) || 0;
      
      setProjectedLoan(Math.max(0, outstanding - inst));
      setProjectedDeposit(depositBalance + dep);

    } else {
      setCurrentDepositBalance(0);
      setOutstandingLoan(0);
      setProjectedLoan(0);
      setProjectedDeposit(0);
    }
  }, [selectedMemberId, date, depositAmount, installmentAmount, members, entryToEdit]);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // 4. Submit Handler (Handles Both Create and Update)
  const handleSubmit = async () => {
    if (!selectedMemberId) {
      alert('Please select a member');
      return;
    }

    setLoading(true);
    
    // New Values from Form
    const newDepAmt = parseFloat(depositAmount) || 0;
    const newInstAmt = parseFloat(installmentAmount) || 0;
    const newIntAmt = parseFloat(interestAmount) || 0;
    const newFineAmt = parseFloat(fineAmount) || 0;
    const total = newDepAmt + newInstAmt + newIntAmt + newFineAmt;

    try {
        if (entryToEdit) {
            // --- UPDATE MODE (Edit) ---
            
            // Step A: Revert Old Balance Effects from Member
            const oldDep = parseFloat(entryToEdit.deposit_amount) || 0;
            const oldInst = parseFloat(entryToEdit.installment_amount) || 0;

            // Fetch latest member data to be safe
            const { data: currentMember } = await supabase
                .from('members')
                .select('outstanding_loan, total_deposits')
                .eq('id', selectedMemberId)
                .single();

            if (currentMember) {
                // Calculation: 
                // 1. Remove Old Effect: (Current - OldDeposit), (Current + OldInstallment)
                // 2. Add New Effect: (+ NewDeposit), (- NewInstallment)
                
                const adjustedDeposit = (currentMember.total_deposits - oldDep) + newDepAmt;
                const adjustedLoan = (currentMember.outstanding_loan + oldInst) - newInstAmt;

                // Update Member Balance
                await supabase.from('members').update({
                    total_deposits: adjustedDeposit,
                    outstanding_loan: adjustedLoan
                }).eq('id', selectedMemberId);
            }

            // Step B: Update the Passbook Entry (FIXED: Using Update)
            const { error } = await supabase
                .from('passbook_entries')
                .update({
                    date: format(date, 'yyyy-MM-dd'),
                    payment_mode: paymentMode,
                    deposit_amount: newDepAmt,
                    installment_amount: newInstAmt,
                    interest_amount: newIntAmt,
                    fine_amount: newFineAmt,
                    total_amount: total,
                    note: 'Edited Entry'
                })
                .eq('id', entryToEdit.id); // IMPORTANT: Update specific ID

            if (error) throw error;

        } else {
            // --- CREATE MODE (New) ---

            // Insert new entry
            const { error } = await supabase.from('passbook_entries').insert([{
                member_id: selectedMemberId,
                member_name: selectedMember?.name,
                date: format(date, 'yyyy-MM-dd'),
                payment_mode: paymentMode,
                deposit_amount: newDepAmt,
                installment_amount: newInstAmt,
                interest_amount: newIntAmt,
                fine_amount: newFineAmt,
                total_amount: total,
                note: 'Passbook Entry'
            }]);

            if (error) throw error;

            // Update Member Balance (Simple Addition/Subtraction)
            if (newDepAmt > 0 || newInstAmt > 0) {
                const newLoanBal = (selectedMember?.outstanding_loan || 0) - newInstAmt;
                const newDepositTotal = (selectedMember?.total_deposits || 0) + newDepAmt;

                await supabase.from('members').update({
                    outstanding_loan: newLoanBal,
                    total_deposits: newDepositTotal
                }).eq('id', selectedMemberId);
            }
        }

        // Success Cleanup
        onClose(); 

    } catch (error: any) {
        alert("Error saving entry: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const totalToCollect = (parseFloat(depositAmount) || 0) + 
                        (parseFloat(installmentAmount) || 0) + 
                        (parseFloat(interestAmount) || 0) + 
                        (parseFloat(fineAmount) || 0);

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
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId} disabled={!!entryToEdit}>
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

                {/* Interest & Fine (Now Editable) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interest">Interest</Label>
                    <Input
                      id="interest"
                      type="number"
                      value={interestAmount}
                      onChange={(e) => setInterestAmount(e.target.value)}
                      className="bg-gray-50"
                      placeholder="Auto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fine">Fine</Label>
                    <Input
                      id="fine"
                      type="number"
                      value={fineAmount}
                      onChange={(e) => setFineAmount(e.target.value)}
                      className="bg-gray-50"
                      placeholder="Auto"
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
                        <span>₹{((parseFloat(interestAmount)||0) + (parseFloat(fineAmount)||0)).toLocaleString()}</span>
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
              disabled={loading || !selectedMemberId || (!depositAmount && !installmentAmount && !interestAmount && !fineAmount)}
            >
              {loading ? 'Processing...' : (entryToEdit ? 'Update Entry' : 'Create Entry')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
