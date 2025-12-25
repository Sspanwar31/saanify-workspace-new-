'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Edit, Trash2, Save, X, Calculator, User, DollarSign, CreditCard, IndianRupee, Plus } from 'lucide-react';

// CSS for removing up/down arrows from number inputs
const inputStyles = `
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type=number] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
`;

// Types
interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
}

interface MemberDetails {
  member: Member;
  currentBalance: number;
  loanBalance?: number;
  remainingLoan?: number;
  activeLoan?: {
    loanId: string;
    outstandingBalance: number;
    loanAmount: number;
    interestRate: number;
  };
}

interface PassbookEntry {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  deposit: number;
  installment: number;
  interest: number;
  fine: number;
  mode: string;
  description: string;
  balance: number;
  loanBalance?: number;
  remainingLoan?: number;
  loanId?: string;
  createdAt: string;
  updatedAt: string;
}

// Form Schema
const formSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  depositDate: z.date({
    required_error: 'Deposit date is required',
  }),
  depositAmount: z.number().min(0, 'Deposit amount must be non-negative'),
  installmentAmount: z.number().min(0, 'Installment amount must be non-negative'),
  interest: z.number().min(0, 'Interest must be non-negative'),
  fine: z.number().min(0, 'Fine must be non-negative'),
  loanRequestAmount: z.number().optional(),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  note: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Payment modes
const paymentModes = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Other', label: 'Other' },
];

export default function PassbookPageUpgraded() {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  
  // State
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [passbookEntries, setPassbookEntries] = useState<PassbookEntry[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PassbookEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [loanRequestEnabled, setLoanRequestEnabled] = useState(false);

  // Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
      depositDate: new Date(),
      depositAmount: 0,
      installmentAmount: 0,
      interest: 0,
      fine: 0,
      loanRequestAmount: 0,
      paymentMode: 'Cash',
      note: '',
    },
  });

  const watchedValues = form.watch();

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const response = await fetch('/api/client/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch members',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMembers(false);
    }
  }, [toast]);

  // Fetch member details with loan info
  const fetchMemberDetails = useCallback(async (memberId: string) => {
    try {
      // Fetch member basic info
      const memberResponse = await fetch(`/api/client/members?memberId=${memberId}`);
      if (!memberResponse.ok) return;
      
      const memberData = await memberResponse.json();
      
      // Fetch loan status
      const loanResponse = await fetch(`/api/client/member-loan-status?memberId=${memberId}`);
      let loanData = { loanBalance: 0, remainingLoan: 0, activeLoan: false };
      
      if (loanResponse.ok) {
        loanData = await loanResponse.json();
      }
      
      const memberDetails: MemberDetails = {
        ...memberData,
        loanBalance: loanData.loanBalance,
        remainingLoan: loanData.remainingLoan,
        activeLoan: loanData.activeLoan ? {
          loanId: loanData.activeLoan.loanId,
          outstandingBalance: loanData.activeLoan.outstandingBalance,
          loanAmount: loanData.activeLoan.loanAmount,
          interestRate: loanData.activeLoan.interestRate,
        } : undefined,
      };
      
      setSelectedMember(memberDetails);
      
      // Auto-calculate interest and fine
      if (loanData.activeLoan) {
        const interest = Math.round((loanData.remainingLoan * 0.01) * 100) / 100;
        form.setValue('interest', interest);
      }

      const depositDate = form.getValues('depositDate');
      if (depositDate) {
        const daysLate = Math.max(0, depositDate.getDate() - 15);
        const fine = daysLate * 10;
        form.setValue('fine', fine);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
    }
  }, [form]);

  // Fetch passbook entries
  const fetchPassbookEntries = useCallback(async () => {
    setIsLoadingEntries(true);
    try {
      const response = await fetch('/api/client/passbook');
      if (response.ok) {
        const data = await response.json();
        setPassbookEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching passbook entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch passbook entries',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEntries(false);
    }
  }, [toast]);

  // Calculate live preview
  const calculatePreview = useCallback(() => {
    if (!selectedMember) return null;

    const { depositAmount, installmentAmount, interest, fine } = watchedValues;
    const previousBalance = selectedMember.currentBalance;
    const newBalance = previousBalance + depositAmount - installmentAmount + interest + fine;

    return {
      previousBalance,
      newBalance,
      netChange: depositAmount - installmentAmount + interest + fine,
      newRemainingLoan: selectedMember.remainingLoan ? selectedMember.remainingLoan - installmentAmount : 0,
    };
  }, [selectedMember, watchedValues]);

  // Auto-calculate fine when date changes
  useEffect(() => {
    if (watchedValues.depositDate) {
      const daysLate = Math.max(0, watchedValues.depositDate.getDate() - 15);
      const fine = daysLate * 10;
      form.setValue('fine', fine);
    }
  }, [watchedValues.depositDate, form]);

  // Auto-calculate interest when member changes
  useEffect(() => {
    if (selectedMember?.remainingLoan) {
      const interest = Math.round((selectedMember.remainingLoan * 0.01) * 100) / 100;
      form.setValue('interest', interest);
    }
  }, [selectedMember?.remainingLoan, form]);

  // Initial data fetch
  useEffect(() => {
    fetchMembers();
    fetchPassbookEntries();
  }, [fetchMembers, fetchPassbookEntries]);

  // Handle member selection
  const handleMemberChange = (memberId: string) => {
    form.setValue('memberId', memberId);
    fetchMemberDetails(memberId);
  };

  // Handle loan request submission
  const handleLoanRequest = async () => {
    if (!selectedMember) {
      toast({
        title: "❌ Validation Error",
        description: "Please select a member first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Sending loan request from upgraded page...");
      const response = await fetch('/api/client/loan-request/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember.member.id,
          amount: watchedValues.loanRequestAmount || undefined,
        }),
      });

      console.log("Loan request response:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("Loan request success:", data);
        
        toast({
          title: "🎯 Loan Request Sent Successfully!",
          description: `Your loan request for ${watchedValues.loanRequestAmount ? '₹' + watchedValues.loanRequestAmount.toLocaleString('en-IN') : 'the requested amount'} has been submitted and is pending approval.`,
        });
        setLoanRequestEnabled(false);
        form.setValue('loanRequestAmount', 0);
        
        // Clear form completely
        form.reset();
        setSelectedMember(null);
        
        // Redirect to loan requests tab
        window.location.href = '/client/loans?tab=requests';
      } else {
        const error = await response.json();
        console.log("Loan request error:", error);
        toast({
          title: "❌ Failed to Send Loan Request",
          description: error.error || 'Something went wrong. Please try again.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending loan request:', error);
      toast({
        title: "❌ Network Error",
        description: 'Failed to send loan request. Please check your connection and try again.',
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    if (!data.depositAmount && !data.installmentAmount) {
      toast({
        title: 'Validation Error',
        description: 'Either deposit or installment amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        memberId: data.memberId,
        date: format(data.depositDate, 'yyyy-MM-dd'),
        deposit: data.depositAmount,
        installment: data.installmentAmount,
        interest: data.interest,
        fine: data.fine,
        mode: data.paymentMode,
        note: data.note,
      };

      let response;
      if (editingEntry) {
        response = await fetch(`/api/client/passbook/update?id=${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/client/passbook/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: editingEntry ? 'Entry updated successfully' : 'Entry Added Successfully',
        });

        // Reset form and refresh data
        form.reset();
        setEditingEntry(null);
        setSelectedMember(null);
        fetchPassbookEntries();
        
        // Invalidate SWR cache
        mutate('/api/client/passbook');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save entry',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (entry: PassbookEntry) => {
    setEditingEntry(entry);
    form.setValue('memberId', entry.memberId);
    form.setValue('depositDate', new Date(entry.date));
    form.setValue('depositAmount', entry.deposit);
    form.setValue('installmentAmount', entry.installment);
    form.setValue('interest', entry.interest);
    form.setValue('fine', entry.fine);
    form.setValue('paymentMode', entry.mode);
    form.setValue('note', entry.description);
    
    fetchMemberDetails(entry.memberId);
  };

  // Handle delete
  const handleDelete = async (entryId: string) => {
    try {
      const response = await fetch(`/api/client/passbook/delete?id=${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Entry deleted successfully',
        });
        fetchPassbookEntries();
        mutate('/api/client/passbook');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete entry',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingEntry(null);
    form.reset();
    setSelectedMember(null);
  };

  const preview = calculatePreview();

  return (
    <>
      <style jsx>{inputStyles}</style>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Passbook Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage member transactions and entries</p>
            </div>
            {editingEntry && (
              <Badge variant="secondary" className="text-sm">
                Editing Entry #{editingEntry.id.slice(-8)}
              </Badge>
            )}
          </div>

          {/* Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </CardTitle>
              <CardDescription>
                {editingEntry ? 'Modify transaction details' : 'Create a new passbook entry'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Loan Request Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={loanRequestEnabled}
                      onCheckedChange={setLoanRequestEnabled}
                    />
                    <label className="text-sm font-medium">Request New Loan</label>
                  </div>
                  {loanRequestEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Loan amount (optional)"
                        className="w-40"
                        {...form.register('loanRequestAmount', { valueAsNumber: true })}
                        onChange={(e) => form.setValue('loanRequestAmount', parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleLoanRequest}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Send Request
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Member Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Member *</label>
                    <Controller
                      name="memberId"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={handleMemberChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingMembers ? (
                              <div className="p-2">
                                <Skeleton className="h-4 w-full" />
                              </div>
                            ) : (
                              members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {member.name} — {member.id.slice(-8)}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.memberId && (
                      <p className="text-sm text-red-600">{form.formState.errors.memberId.message}</p>
                    )}
                  </div>

                  {/* Deposit Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deposit Date *</label>
                    <Controller
                      name="depositDate"
                      control={form.control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {form.formState.errors.depositDate && (
                      <p className="text-sm text-red-600">{form.formState.errors.depositDate.message}</p>
                    )}
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Mode *</label>
                    <Controller
                      name="paymentMode"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentModes.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.paymentMode && (
                      <p className="text-sm text-red-600">{form.formState.errors.paymentMode.message}</p>
                    )}
                  </div>

                  {/* Deposit Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deposit Amount</label>
                    <Controller
                      name="depositAmount"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                    {form.formState.errors.depositAmount && (
                      <p className="text-sm text-red-600">{form.formState.errors.depositAmount.message}</p>
                    )}
                  </div>

                  {/* Installment Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Loan Installment</label>
                    <Controller
                      name="installmentAmount"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                    {form.formState.errors.installmentAmount && (
                      <p className="text-sm text-red-600">{form.formState.errors.installmentAmount.message}</p>
                    )}
                  </div>

                  {/* Interest */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interest (Auto-calculated)</label>
                    <Controller
                      name="interest"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                    {selectedMember?.remainingLoan && (
                      <p className="text-xs text-gray-500">
                        1% of remaining loan: ₹{selectedMember.remainingLoan.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Fine */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fine (Auto-calculated)</label>
                    <Controller
                      name="fine"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                    {watchedValues.depositDate && (
                      <p className="text-xs text-gray-500">
                        ₹10/day after 15th: {Math.max(0, watchedValues.depositDate.getDate() - 15)} days
                      </p>
                    )}
                  </div>

                  {/* Loan Balance Display */}
                  {selectedMember?.loanBalance !== undefined && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Loan Balance</label>
                      <div className="p-2 border rounded bg-gray-50">
                        ₹{selectedMember.loanBalance.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Remaining Loan Display */}
                  {selectedMember?.remainingLoan !== undefined && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Remaining Loan</label>
                      <div className="p-2 border rounded bg-gray-50">
                        ₹{selectedMember.remainingLoan.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium">Note / Description</label>
                    <Controller
                      name="note"
                      control={form.control}
                      render={({ field }) => (
                        <Textarea
                          placeholder="Enter any additional notes..."
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Live Preview */}
                {preview && selectedMember && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20"
                  >
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Live Preview
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Previous Balance:</span>
                        <p className="font-medium">₹{preview.previousBalance.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Net Change:</span>
                        <p className={`font-medium ${preview.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {preview.netChange >= 0 ? '+' : ''}₹{preview.netChange.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">New Balance:</span>
                        <p className="font-medium text-lg">₹{preview.newBalance.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">New Remaining Loan:</span>
                        <p className="font-medium">₹{preview.newRemainingLoan.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Member:</span>
                        <p className="font-medium">{selectedMember.member.name}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedMember}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Save Entry')}
                  </Button>
                  {editingEntry && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel Edit
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                Recent passbook entries with edit and delete options
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : passbookEntries.length === 0 ? (
                <div className="text-center py-8">
                  <IndianRupee className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No passbook entries found</p>
                  <p className="text-sm text-gray-500 mt-1">Create your first entry above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Member</th>
                        <th className="text-right p-2">Deposit</th>
                        <th className="text-right p-2">Installment</th>
                        <th className="text-right p-2">Interest</th>
                        <th className="text-right p-2">Fine</th>
                        <th className="text-right p-2">Loan Balance</th>
                        <th className="text-right p-2">Remaining Loan</th>
                        <th className="text-right p-2">Balance</th>
                        <th className="text-left p-2">Mode</th>
                        <th className="text-left p-2">Notes</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {passbookEntries.map((entry, index) => (
                          <motion.tr
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="p-2">{format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.memberName}
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              {entry.deposit > 0 && (
                                <span className="text-green-600">+₹{entry.deposit.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {entry.installment > 0 && (
                                <span className="text-red-600">-₹{entry.installment.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {entry.interest > 0 && (
                                <span className="text-blue-600">+₹{entry.interest.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {entry.fine > 0 && (
                                <span className="text-orange-600">+₹{entry.fine.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {entry.loanBalance ? (
                                <span className="text-purple-600">₹{entry.loanBalance.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {entry.remainingLoan !== undefined ? (
                                <span className="text-indigo-600">₹{entry.remainingLoan.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-2 text-right font-medium">₹{entry.balance.toFixed(2)}</td>
                            <td className="p-2">
                              <Badge variant="outline">{entry.mode}</Badge>
                            </td>
                            <td className="p-2 max-w-xs truncate">
                              {entry.description || '-'}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(entry)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this entry for {entry.memberName}? 
                                        This action cannot be undone and will affect running balance.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(entry.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}