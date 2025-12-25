'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, 
  User, 
  DollarSign, 
  CreditCard, 
  IndianRupee,
  Calculator,
  TrendingUp,
  TrendingDown,
  Info,
  Wallet,
  Target,
  Receipt,
  RefreshCw
} from 'lucide-react';

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
  totalDeposits: number; // SUM of all deposits only
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
  paymentMode: z.string().min(1, 'Payment mode is required'),
  note: z.string().optional(),
}).refine((data) => {
  // Custom validation: At least one of deposit or installment must be greater than 0
  return data.depositAmount > 0 || data.installmentAmount > 0;
}, {
  message: 'At least one of deposit or installment amount must be greater than 0',
  path: ['depositAmount', 'installmentAmount']
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

interface PassbookAddEntryFormProps {
  editingEntry?: PassbookEntry | null;
  onSave: (entry: PassbookEntry) => void;
  onCancel: () => void;
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}

function FormField({ label, children, error, required }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

interface PreviewCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function PreviewCard({ title, value, icon, gradient, trend }: PreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        relative rounded-xl p-4 bg-gradient-to-br ${gradient} 
        shadow-lg transition-all duration-300
        backdrop-blur-sm border border-white/20
        text-white overflow-hidden
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend.isPositive ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
          }`}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      
      <div className="text-lg font-bold mb-1">
        {value}
      </div>
      <div className="text-white/80 text-xs">
        {title}
      </div>
    </motion.div>
  );
}

export default function PassbookAddEntryForm({ 
  editingEntry, 
  onSave, 
  onCancel 
}: PassbookAddEntryFormProps) {
  
  // State
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      paymentMode: 'Cash',
      note: '',
    },
  });

  const watchedValues = form.watch();

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const response = await fetch(`${window.location.origin}/api/client/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  // Fetch member details
  const fetchMemberDetails = useCallback(async (memberId: string, skipAutoCalculation = false) => {
    try {
      const response = await fetch(`${window.location.origin}/api/client/members/${memberId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Handle API response structure with fallbacks
        const memberData = {
          member: data.member || {},
          currentBalance: data.currentBalance || 0,
          totalDeposits: data.totalDeposits || 0,
          activeLoan: data.activeLoan || null
        };
        
        setSelectedMember(memberData);
        
        // IMPORTANT: Skip auto-calculation when editing to preserve saved values
        if (!skipAutoCalculation) {
          // Auto-calculate interest and fine based on loan (Hybrid Auto/Manual)
          if (memberData.activeLoan) {
            const interest = Math.round((memberData.activeLoan.outstandingBalance * 0.01) * 100) / 100;
            // Only set interest if current value is 0 (to preserve manual edits)
            if (form.getValues('interest') === 0) {
              form.setValue('interest', interest);
            }
          } else {
            // Reset interest to 0 if member has no active loan
            form.setValue('interest', 0);
          }

          const depositDate = form.getValues('depositDate');
          if (depositDate) {
            const daysLate = Math.max(0, depositDate.getDate() - 15);
            const fine = daysLate * 10;
            // Only set fine if current value is 0 (to preserve manual edits)
            if (form.getValues('fine') === 0) {
              form.setValue('fine', fine);
            }
          }
        }
      } else {
        console.error('Failed to fetch member details:', response.status);
        toast.error('Failed to fetch member details');
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      toast.error('Failed to fetch member details');
    }
  }, [form]);

  // Calculate live preview with CORRECT LOGIC and REAL-TIME PROJECTIONS
  const calculatePreview = useCallback(() => {
    if (!selectedMember || !selectedMember.member) return null;

    const { depositAmount, installmentAmount, interest, fine } = watchedValues;
    
    // A. Previous Balance = SUM(All Deposits Only) - For Display Only
    const previousBalance = selectedMember.totalDeposits || 0;
    
    // B. Today's Total = Deposit + Installment + Interest + Fine
    const todayTotal = depositAmount + installmentAmount + interest + fine;
    
    // C. New Balance = Today's Total ONLY (No Previous Balance)
    // इस entry में user ने जो भरा है उनका total only
    const newBalance = todayTotal;
    
    // D. Live Loan Reduction Preview
    const currentDbLoan = selectedMember.activeLoan?.outstandingBalance || 0;
    const oldInstallment = editingEntry?.installment || 0;
    const newInstallment = installmentAmount || 0;

    // REAL-TIME PROJECTION: Outstanding Loan
    const projectedLoan = editingEntry
      ? (currentDbLoan + oldInstallment) - newInstallment // If Editing: Add back old amount first (Simulate Reversal), then subtract new
      : currentDbLoan - newInstallment; // If Adding: Just subtract new

    // E. REAL-TIME PROJECTION: Deposit Balance
    const currentDbDeposit = selectedMember.totalDeposits || 0;
    const oldDeposit = editingEntry?.deposit || 0;
    const newDeposit = depositAmount || 0;

    const projectedDeposit = editingEntry
      ? (currentDbDeposit - oldDeposit) + newDeposit // If Editing: Remove old deposit, add new
      : currentDbDeposit + newDeposit; // If Adding: Just add new

    // F. Calculate changes for visual indicators
    const loanChanged = projectedLoan !== currentDbLoan;
    const depositChanged = projectedDeposit !== currentDbDeposit;
    const loanDirection = loanChanged ? (projectedLoan < currentDbLoan ? 'decrease' : 'increase') : 'neutral';
    const depositDirection = depositChanged ? (projectedDeposit > currentDbDeposit ? 'increase' : 'decrease') : 'neutral';

    return {
      previousBalance,
      depositAmount,
      installmentAmount,
      interest,
      fine,
      todayTotal,
      newBalance,
      currentLoanBalance: currentDbLoan,
      projectedLoanBalance: projectedLoan,
      currentDepositBalance: currentDbDeposit,
      projectedDepositBalance: projectedDeposit,
      loanChanged,
      depositChanged,
      loanDirection,
      depositDirection,
      memberName: selectedMember.member.name || 'Unknown Member'
    };
  }, [selectedMember, watchedValues, editingEntry]);

  // Auto-calculate fine when date changes (Hybrid Auto/Manual)
  useEffect(() => {
    if (watchedValues.depositDate && selectedMember && !editingEntry) {
      const daysLate = Math.max(0, watchedValues.depositDate.getDate() - 15);
      const fine = daysLate * 10;
      
      // Only auto-calculate if user hasn't manually entered a value
      // This preserves manual edits while still providing auto-calculation
      // IMPORTANT: Skip auto-calculation when editing to preserve saved values
      if (form.getValues('fine') === 0 || !form.getValues('fine')) {
        form.setValue('fine', fine);
      }
    }
  }, [watchedValues.depositDate, form, selectedMember, editingEntry]);

  // Auto-calculate interest when member changes (Hybrid Auto/Manual)
  useEffect(() => {
    if (selectedMember && selectedMember.activeLoan && !editingEntry) {
      const interest = Math.round((selectedMember.activeLoan.outstandingBalance * 0.01) * 100) / 100;
      
      // Only auto-calculate if user hasn't manually entered a value
      // IMPORTANT: Skip auto-calculation when editing to preserve saved values
      if (form.getValues('interest') === 0 || !form.getValues('interest')) {
        form.setValue('interest', interest);
      }
    } else if (selectedMember && !editingEntry) {
      // Reset interest to 0 if member has no active loan
      form.setValue('interest', 0);
    }
  }, [selectedMember, form, editingEntry]);

  // Initial data fetch and form setup for editing
  useEffect(() => {
    fetchMembers();
    
    if (editingEntry) {
      // Set form values from editingEntry
      form.setValue('memberId', editingEntry.memberId);
      form.setValue('depositDate', new Date(editingEntry.date));
      form.setValue('depositAmount', editingEntry.deposit);
      form.setValue('installmentAmount', editingEntry.installment);
      form.setValue('interest', editingEntry.interest);
      form.setValue('fine', editingEntry.fine);
      form.setValue('paymentMode', editingEntry.mode);
      form.setValue('note', editingEntry.description);
      
      // Fetch member details for display, but skip auto-calculation
      fetchMemberDetails(editingEntry.memberId, true);
    }
  }, [fetchMembers, editingEntry, form, fetchMemberDetails]);

  // Handle member selection
  const handleMemberChange = (memberId: string) => {
    form.setValue('memberId', memberId);
    // Only fetch member details if not in edit mode (to preserve existing data)
    if (!editingEntry) {
      fetchMemberDetails(memberId);
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    // Note: Custom validation is now handled by Zod schema refine()
    // No need for manual validation here as react-hook-form will catch it

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
        response = await fetch(`${window.location.origin}/api/client/passbook/update?id=${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${window.location.origin}/api/client/passbook/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();
        const entryData = result.entry;
        
        toast.success(editingEntry ? 'Entry updated successfully' : 'Entry created successfully');

        onSave(entryData);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const preview = calculatePreview();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section - 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    <Calculator className="h-5 w-5" />
                  </div>
                  {editingEntry ? 'Edit Entry' : 'Add New Entry'}
                </CardTitle>
                <CardDescription>
                  {editingEntry ? 'Modify transaction details' : 'Create a new passbook entry'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Member Select */}
                    <FormField
                      label="Member"
                      error={form.formState.errors.memberId?.message}
                      required
                    >
                      {editingEntry ? (
                        <>
                          {/* Hidden input for form validation */}
                          <input
                            type="hidden"
                            {...form.register("memberId")}
                          />
                          {/* Read-only display */}
                          <div className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {members.find(m => m.id === editingEntry.memberId)?.name || 'Unknown Member'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <Controller
                          name="memberId"
                          control={form.control}
                          render={({ field }) => (
                            <Select 
                              onValueChange={handleMemberChange} 
                              value={field.value}
                            >
                              <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary">
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
                                        {member.name || 'Unknown Member'}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}
                    </FormField>

                    {/* Deposit Date */}
                    <FormField
                      label="Deposit Date"
                      error={form.formState.errors.depositDate?.message}
                      required
                    >
                      <Controller
                        name="depositDate"
                        control={form.control}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
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
                    </FormField>

                    {/* Payment Mode */}
                    <FormField
                      label="Payment Mode"
                      error={form.formState.errors.paymentMode?.message}
                      required
                    >
                      <Controller
                        name="paymentMode"
                        control={form.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary">
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
                    </FormField>
                  </div>

                  {/* Amount Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deposit Amount */}
                    <FormField
                      label="Deposit Amount"
                      error={form.formState.errors.depositAmount?.message}
                    >
                      <Controller
                        name="depositAmount"
                        control={form.control}
                        render={({ field }) => (
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}
                      />
                    </FormField>

                    {/* Installment Amount */}
                    <FormField
                      label="Installment Amount"
                      error={form.formState.errors.installmentAmount?.message}
                    >
                      <Controller
                        name="installmentAmount"
                        control={form.control}
                        render={({ field }) => (
                          <div className="relative">
                            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}
                      />
                    </FormField>

                    {/* Interest */}
                    <FormField
                      label="Interest (Auto-calculated)"
                      error={form.formState.errors.interest?.message}
                    >
                      <Controller
                        name="interest"
                        control={form.control}
                        render={({ field }) => (
                          <div className="relative">
                            <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}
                      />
                      {selectedMember?.activeLoan && (
                        <p className="text-xs text-gray-500 mt-1">
                          Auto: 1% of outstanding loan (₹{selectedMember.activeLoan.outstandingBalance.toFixed(2)})
                        </p>
                      )}
                    </FormField>

                    {/* Fine */}
                    <FormField
                      label="Fine (Auto-calculated)"
                      error={form.formState.errors.fine?.message}
                    >
                      <Controller
                        name="fine"
                        control={form.control}
                        render={({ field }) => (
                          <div className="relative">
                            <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}
                      />
                      {watchedValues.depositDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Auto: ₹10/day after 15th ({Math.max(0, watchedValues.depositDate.getDate() - 15)} days late)
                        </p>
                      )}
                    </FormField>
                  </div>

                  {/* Note */}
                  <FormField
                    label="Note"
                    error={form.formState.errors.note?.message}
                  >
                    <Controller
                      name="note"
                      control={form.control}
                      render={({ field }) => (
                        <Textarea
                          placeholder="Add any additional notes..."
                          className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary resize-none"
                          rows={3}
                          {...field}
                        />
                      )}
                    />
                  </FormField>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="mr-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </motion.div>
                            {editingEntry ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            {editingEntry ? 'Update Entry' : 'Create Entry'}
                          </>
                        )}
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all duration-300"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Live Preview Section - 1 column on desktop */}
        <div className="space-y-6">
          {preview && (
            <>
              {/* Member Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      Member Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="font-medium">{preview.memberName}</span>
                      </div>
                      
                      {/* Projected Deposit Balance with Visual Cue */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Deposit Balance</span>
                        <div className="flex items-center gap-2">
                          {preview.depositChanged && (
                            <div className={`flex items-center gap-1 text-xs font-medium ${
                              preview.depositDirection === 'increase' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {preview.depositDirection === 'increase' ? (
                                <>
                                  <TrendingUp className="h-3 w-3" />
                                  +₹{(preview.projectedDepositBalance - preview.currentDepositBalance).toLocaleString('en-IN')}
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="h-3 w-3" />
                                  -₹{(preview.currentDepositBalance - preview.projectedDepositBalance).toLocaleString('en-IN')}
                                </>
                              )}
                            </div>
                          )}
                          <span className={`font-medium ${
                            preview.depositChanged ? 'text-blue-600' : ''
                          }`}>
                            ₹{preview.projectedDepositBalance.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Projected Outstanding Loan with Visual Cue */}
                      {(preview.currentLoanBalance > 0 || preview.projectedLoanBalance > 0) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Outstanding Loan</span>
                          <div className="flex items-center gap-2">
                            {preview.loanChanged && (
                              <div className={`flex items-center gap-1 text-xs font-medium ${
                                preview.loanDirection === 'decrease' 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                              }`}>
                                {preview.loanDirection === 'decrease' ? (
                                  <>
                                    <TrendingDown className="h-3 w-3" />
                                    -₹{(preview.currentLoanBalance - preview.projectedLoanBalance).toLocaleString('en-IN')}
                                  </>
                                ) : (
                                  <>
                                    <TrendingUp className="h-3 w-3" />
                                    +₹{(preview.projectedLoanBalance - preview.currentLoanBalance).toLocaleString('en-IN')}
                                  </>
                                )}
                              </div>
                            )}
                            <span className={`font-medium ${
                              preview.loanChanged 
                                ? (preview.loanDirection === 'decrease' ? 'text-green-600' : 'text-orange-600')
                                : 'text-orange-600'
                            }`}>
                              ₹{preview.projectedLoanBalance.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {preview.currentLoanBalance === 0 && preview.projectedLoanBalance === 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Outstanding Loan</span>
                          <span className="font-medium text-gray-400">-</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Live Preview Title */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Live Preview
                </h3>
              </motion.div>

              {/* Preview Cards */}
              <div className="space-y-4">
                {(preview.depositAmount > 0 || preview.installmentAmount > 0 || preview.interest > 0 || preview.fine > 0) ? (
                  <>
                    {preview.depositAmount > 0 && (
                      <PreviewCard
                        title="Deposit Amount"
                        value={`₹${preview.depositAmount.toLocaleString('en-IN')}`}
                        icon={<IndianRupee className="h-4 w-4 text-white" />}
                        gradient="from-emerald-500 to-emerald-600"
                      />
                    )}
                    
                    {preview.installmentAmount > 0 && (
                      <PreviewCard
                        title="Installment Amount"
                        value={`₹${preview.installmentAmount.toLocaleString('en-IN')}`}
                        icon={<Wallet className="h-4 w-4 text-white" />}
                        gradient="from-blue-500 to-blue-600"
                      />
                    )}
                    
                    {(preview.interest > 0 || preview.fine > 0) && (
                      <PreviewCard
                        title="Interest & Fine"
                        value={`₹${(preview.interest + preview.fine).toLocaleString('en-IN')}`}
                        icon={<Target className="h-4 w-4 text-white" />}
                        gradient="from-purple-500 to-purple-600"
                      />
                    )}

                    <PreviewCard
                      title="New Balance"
                      value={`₹${preview.newBalance.toLocaleString('en-IN')}`}
                      icon={<Receipt className="h-4 w-4 text-white" />}
                      gradient="from-teal-500 to-teal-600"
                    />

                    {/* Live Loan Reduction Preview */}
                    {preview.currentLoanBalance > 0 && preview.installmentAmount > 0 && (
                      <PreviewCard
                        title="Loan Balance After Payment"
                        value={`₹${preview.projectedLoanBalance.toLocaleString('en-IN')}`}
                        icon={<TrendingDown className="h-4 w-4 text-white" />}
                        gradient="from-green-500 to-green-600"
                        trend={{
                          value: Math.round(((preview.currentLoanBalance - preview.projectedLoanBalance) / preview.currentLoanBalance) * 100),
                          isPositive: preview.projectedLoanBalance < preview.currentLoanBalance
                        }}
                      />
                    )}

                    {/* Show current loan balance if no installment */}
                    {preview.currentLoanBalance > 0 && preview.installmentAmount === 0 && (
                      <PreviewCard
                        title="Current Loan Balance"
                        value={`₹${preview.currentLoanBalance.toLocaleString('en-IN')}`}
                        icon={<Wallet className="h-4 w-4 text-white" />}
                        gradient="from-orange-500 to-orange-600"
                      />
                    )}
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4">
                      <Info className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground">
                      Enter amounts to see live preview
                    </p>
                  </motion.div>
                )}
              </div>
            </>
          )}

          {/* Helper Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Alert className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Tips:</strong> Interest is calculated as 1% of outstanding loan amount. 
                Fine is charged at ₹10 per day after the 15th of each month.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </div>
    </div>
  );
}