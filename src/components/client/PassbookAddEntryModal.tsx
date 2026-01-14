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
import { toast } from 'sonner';

// ✅ STEP 1: Props change करो
interface PassbookAddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: any | null;
  members: any[];          // ✅ ADD
  clientId: string | null; // ✅ ADD
}

export default function PassbookAddEntryModal({
  isOpen,
  onClose,
  entryToEdit,
  members,
  clientId
}: PassbookAddEntryModalProps) {

  // ✅ STEP 2: Local state हटाओ
  // const [members, setMembers] = useState<any[]>([]); 
  // const [clientId, setClientId] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [installmentAmount, setInstallmentAmount] = useState<string>('');
  const [interestAmount, setInterestAmount] = useState<string>(''); 
  const [fineAmount, setFineAmount] = useState<string>(''); 

  const [currentDepositBalance, setCurrentDepositBalance] = useState<number>(0);
  const [outstandingLoan, setOutstandingLoan] = useState<number>(0);
  const [projectedLoan, setProjectedLoan] = useState<number>(0);
  const [projectedDeposit, setProjectedDeposit] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // ✅ FIX: Added optional chaining to prevent crash if members is undefined
  const selectedMember = members?.find(m => m.id === selectedMemberId);

  // ✅ STEP 3: Fetch वाला useEffect हटाओ
  // useEffect(() => { ... }, [isOpen]);

  // 2. Populate Edit Logic
  useEffect(() => {
      if (isOpen) {
          if (entryToEdit) {
              setSelectedMemberId(entryToEdit.member_id || entryToEdit.memberId);
              setDepositAmount(entryToEdit.deposit_amount?.toString() || '0');
              setInstallmentAmount(entryToEdit.installment_amount?.toString() || '0');
              setInterestAmount(entryToEdit.interest_amount?.toString() || '0'); 
              setFineAmount(entryToEdit.fine_amount?.toString() || '0');         
              setPaymentMode(entryToEdit.payment_mode || 'cash');
              if (entryToEdit.date) setDate(new Date(entryToEdit.date));
          } else {
              setSelectedMemberId('');
              setDepositAmount('');
              setInstallmentAmount('');
              setInterestAmount(''); 
              setFineAmount('');     
              setPaymentMode('cash');
              setDate(new Date());
          }
      }
  }, [entryToEdit, isOpen]);

  // 3. Auto-calculation (Fine Logic Fixed)
  useEffect(() => {
      if (selectedMember) {
        const depositBalance = Number(selectedMember.total_deposits || 0);
        const outstanding = Number(selectedMember.outstanding_loan || 0);
        
        let baseDeposit = depositBalance;
        let baseLoan = outstanding;

        if (entryToEdit) {
            baseDeposit -= Number(entryToEdit.deposit_amount || 0);
            baseLoan += Number(entryToEdit.installment_amount || 0);
        }
        
        setCurrentDepositBalance(baseDeposit);
        setOutstandingLoan(baseLoan);

        // --- AUTO CALCULATION LOGIC ---
        if (!entryToEdit) {
            // A. Interest (1% of Loan)
            if (baseLoan > 0) {
              const calculatedInterest = Math.round(baseLoan * 0.01);
              setInterestAmount(calculatedInterest.toString());
            } else {
              setInterestAmount('');
            }

            // B. Fine (After 15th)
            const dayOfMonth = date.getDate(); // Uses selected date
            if (dayOfMonth > 15) {
               const fine = (dayOfMonth - 15) * 10;
               setFineAmount(fine.toString()); // Auto set fine
            } else {
               setFineAmount(''); // Reset fine if date is early
            }
        }

        const dep = parseFloat(depositAmount) || 0;
        const inst = parseFloat(installmentAmount) || 0;
        
        setProjectedLoan(Math.max(0, baseLoan - inst));
        setProjectedDeposit(baseDeposit + dep);
    } else {
        // Reset if no member
        setCurrentDepositBalance(0);
        setOutstandingLoan(0);
        if (!entryToEdit) {
          setInterestAmount('');
          setFineAmount('');
        }
    }
  }, [selectedMember, date, depositAmount, installmentAmount, entryToEdit]); 

  // 4. SUBMIT HANDLER (Updated Logic for Edit)
  const handleSubmit = async () => {
      if (!selectedMemberId) return toast.error('Please select a member');
      setLoading(true);

    const newDepAmt = parseFloat(depositAmount) || 0;
    const newInstAmt = parseFloat(installmentAmount) || 0;
    const newIntAmt = parseFloat(interestAmount) || 0;
    const newFineAmt = parseFloat(fineAmount) || 0;
    const total = newDepAmt + newInstAmt + newIntAmt + newFineAmt;

    try {
        if (entryToEdit) {
            // --- EDIT MODE ---
            // 1. Calculate Difference (New - Old)
            const oldDep = Number(entryToEdit.deposit_amount || 0);
            const oldInst = Number(entryToEdit.installment_amount || 0);
            
            const depositDiff = newDepAmt - oldDep; 
            const installmentDiff = newInstAmt - oldInst; 

            // 2. Update Passbook
            const { error: updateError } = await supabase
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
                .eq('id', entryToEdit.id);

            if (updateError) throw updateError;

            // 3. Update Member Balance
            const { data: currentMember } = await supabase
                .from('members')
                .select('outstanding_loan, total_deposits')
                .eq('id', selectedMemberId)
                .single();

            if (currentMember) {
                const newLoanBal = Number(currentMember.outstanding_loan) - installmentDiff;
                const newDepositTotal = Number(currentMember.total_deposits) + depositDiff;

                await supabase.from('members').update({
                    outstanding_loan: newLoanBal,
                    total_deposits: newDepositTotal
                }).eq('id', selectedMemberId);
                
                // 4. Update Loan Table (If Installment Changed)
                if (installmentDiff !== 0) {
                     const { data: loans } = await supabase.from('loans').select('*').eq('member_id', selectedMemberId).eq('status', 'active');
                     if(loans && loans.length > 0) {
                         const loan = loans[0]; 
                         const newBal = Number(loan.remaining_balance) - installmentDiff;
                         await supabase.from('loans').update({ remaining_balance: newBal }).eq('id', loan.id);
                     }
                }
            }
            toast.success("Entry Updated Successfully!");

        } else {
            // --- CREATE MODE (Existing Logic) ---
            const { data: currentMember } = await supabase.from('members').select('name').eq('id', selectedMemberId).single();

           let attachedLoanId: string | null = null;

          if (newInstAmt > 0) {
            const { data: activeLoans } = await supabase
                .from('loans')
                .select('id, remaining_balance')
                .eq('member_id', selectedMemberId)
                .eq('status', 'active')
                .gt('remaining_balance', 0)
                .order('created_at', { ascending: true })
                .limit(1);

            if (activeLoans && activeLoans.length > 0) {
              attachedLoanId = activeLoans[0].id;
            }
          }

          const { error: insertError } = await supabase.from('passbook_entries').insert([{
            client_id: clientId,
            member_id: selectedMemberId,
            member_name: currentMember?.name,
            loan_id: attachedLoanId, // ✅ AUTO ATTACHED
            date: format(date, 'yyyy-MM-dd'),
            payment_mode: paymentMode,
            deposit_amount: newDepAmt,
            installment_amount: newInstAmt,
            interest_amount: newIntAmt,
            fine_amount: newFineAmt,
            total_amount: total,
            note: 'Passbook Entry'
          }]);

            if (insertError) throw insertError;

            if (newDepAmt > 0 || newInstAmt > 0) {
                const { data: memData } = await supabase.from('members').select('outstanding_loan, total_deposits').eq('id', selectedMemberId).single();
                if(memData) {
                    const newLoanBal = (memData.outstanding_loan || 0) - newInstAmt;
                    const newDepositTotal = (memData.total_deposits || 0) + newDepAmt;
                    await supabase.from('members').update({ outstanding_loan: newLoanBal, total_deposits: newDepositTotal }).eq('id', selectedMemberId);
                    
                    // Deduct from Loan Table
                    if(newInstAmt > 0) {
                        const { data: activeLoans } = await supabase.from('loans').select('*').eq('member_id', selectedMemberId).eq('status', 'active').gt('remaining_balance', 0).order('created_at', { ascending: true });
                        let amtLeft = newInstAmt;
                        if(activeLoans) {
                            for (const loan of activeLoans) {
                                if (amtLeft <= 0) break;
                                const bal = Number(loan.remaining_balance);
                                if (amtLeft >= bal) {
                                    await supabase.from('loans').update({ remaining_balance: 0, status: 'closed' }).eq('id', loan.id);
                                    amtLeft -= bal;
                                } else {
                                    await supabase.from('loans').update({ remaining_balance: bal - amtLeft }).eq('id', loan.id);
                                    amtLeft = 0;
                                }
                            }
                        }
                    }
                }
            }
            toast.success("Entry Added Successfully!");
        }

        onClose(); 
        window.location.reload();

    } catch (error: any) {
        toast.error("Error: " + error.message);
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
          {/* Left Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entry Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount</Label>
                  <Input id="depositAmount" type="number" placeholder="Enter deposit amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installmentAmount">Installment Amount</Label>
                  <Input id="installmentAmount" type="number" placeholder="Enter installment amount" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interest">Interest</Label>
                    <Input id="interest" type="number" value={interestAmount} onChange={(e) => setInterestAmount(e.target.value)} className="bg-gray-50" placeholder="Auto" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fine">Fine</Label>
                    <Input id="fine" type="number" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} className="bg-gray-50" placeholder="Auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedMember ? (
                  <>
                      <div className="flex justify-between items-center"><span className="font-medium">Name:</span><span>{selectedMember.name}</span></div>
                      <div className="flex justify-between items-center"><span className="font-medium">Current Deposit:</span><div className="flex items-center gap-2"><span>₹{currentDepositBalance.toLocaleString()}</span>{depositAmount && parseFloat(depositAmount) > 0 && <Badge variant="default" className="bg-green-100 text-green-800">+₹{parseFloat(depositAmount).toLocaleString()}</Badge>}</div></div>
                      <div className="flex justify-between items-center"><span className="font-medium">Outstanding Loan:</span><div className="flex items-center gap-2"><span>₹{outstandingLoan.toLocaleString()}</span>{installmentAmount && parseFloat(installmentAmount) > 0 && <Badge variant="default" className="bg-red-100 text-red-800">-₹{parseFloat(installmentAmount).toLocaleString()}</Badge>}</div></div>
                  </>
                ) : <p className="text-muted-foreground">Please select a member</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMember ? (
                  <>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span>Deposit:</span><span>₹{(parseFloat(depositAmount) || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Installment:</span><span>₹{(parseFloat(installmentAmount) || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Interest/Fine:</span><span>₹{((parseFloat(interestAmount)||0) + (parseFloat(fineAmount)||0)).toLocaleString()}</span></div>
                        <div className="border-t pt-2"><div className="flex justify-between font-bold"><span>Total to Collect:</span><span className="text-blue-600">₹{totalToCollect.toLocaleString()}</span></div></div>
                      </div>
                      {outstandingLoan > 0 && <div className="space-y-2"><div className="flex justify-between"><span>Final Loan Balance:</span><span className="font-medium">₹{projectedLoan.toLocaleString()}</span></div><div className="space-y-1"><div className="flex justify-between text-sm text-muted-foreground"><span>Progress:</span><span>{loanProgressPercentage.toFixed(1)}%</span></div><Progress value={loanProgressPercentage} className="h-2" /></div></div>}
                      <div className="flex justify-between"><span>Final Deposit Balance:</span><span className="font-medium text-green-600">₹{projectedDeposit.toLocaleString()}</span></div>
                  </>
                ) : <p className="text-muted-foreground">Select a member to see preview</p>}
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} className="w-full" size="lg" disabled={loading || !selectedMemberId || (!depositAmount && !installmentAmount && !interestAmount && !fineAmount)}>{loading ? 'Processing...' : (entryToEdit ? 'Update Entry' : 'Create Entry')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
