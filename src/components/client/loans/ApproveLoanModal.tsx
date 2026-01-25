'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  User, DollarSign, TrendingUp, Shield, AlertTriangle, Percent, Calendar, Loader2
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface ApproveLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
}

export function ApproveLoanModal({ isOpen, onClose, requestId }: ApproveLoanModalProps) {
  const { formatCurrency } = useCurrency();

  // --- Local States ---
  const [request, setRequest] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [isOverride, setIsOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalDeposit, setTotalDeposit] = useState(0);

  // ✅ CHANGE 1: New Payment Mode State
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'upi' | 'cheque'>('cash');

  // 1. Fetch Loan Request & Live Deposit Balance
  useEffect(() => {
    if (isOpen && requestId) {
      const fetchData = async () => {
        // A. Fetch Loan Request Details
        const { data: loanData, error } = await supabase
          .from('loans')
          .select(`
            *,
            members (
              id,
              name,
              avatar_url
            )
          `)
          .eq('id', requestId)
          .single();

        if (loanData && !error) {
          // Requested Amount fallback
          const requestedAmount =
            Number(loanData.approved_amount) ||
            Number(loanData.amount) ||
            Number(loanData.requested_amount) ||
            0;

          setRequest({
            id: loanData.id,
            memberId: loanData.member_id,
            clientId: loanData.client_id,
            memberName: loanData.members?.name || 'Unknown',
            memberAvatar: loanData.members?.avatar_url || null,
            amount: requestedAmount,
            status: loanData.status
          });

          // Total Deposit Calculation
          const { data: passbookData } = await supabase
            .from('passbook_entries')
            .select('deposit_amount, payment_mode')
            .eq('member_id', loanData.member_id);

          const totalDeposits = (passbookData || [])
            .reduce((sum, e) => sum + Number(e.deposit_amount || 0), 0);

          setTotalDeposit(totalDeposits);

          // Auto-fill Amount
          setAmount(requestedAmount > 0 ? requestedAmount.toString() : '');
          setIsOverride(false);
          // Reset payment mode to default on open
          setPaymentMode('cash');
        }
      };
      fetchData();
    }
  }, [isOpen, requestId]);

  // --- Logic: Limits Calculation ---
  const maxLimit = totalDeposit * 0.8;
  const requestedAmount = request?.amount || 0;
  const loanAmount = parseFloat(amount) || 0;

  // Validation
  const isOverLimit = loanAmount > maxLimit;
  const canApprove = !isOverLimit || isOverride;

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (!request || !canApprove) return;

    setIsSubmitting(true);
    try {
      const approvedAmount = loanAmount;
      const today = new Date().toISOString();

      // 1. Update Loan Status ONLY (NO PASSBOOK INSERT)
      // ✅ Removed passbook_entries insert to fix 0 amount issue
      // ✅ Added payment_mode to loan record
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          status: 'active',
          amount: approvedAmount,
          approved_amount: approvedAmount,
          approved_at: today,
          start_date: today.split('T')[0],
          override_limit: isOverride,
          interest_rate: 1, // Fixed 1%
          remaining_balance: approvedAmount,
          payment_mode: paymentMode // <--- New Field
        })
        .eq('id', request.id);

      if (loanError) throw loanError;

      // 2. Insert Notification for Member
      const { error: notifError } = await supabase.from('notifications').insert([{
        client_id: request.clientId,
        member_id: request.memberId,
        title: "Loan Approved ✅",
        message: `Your loan of ${formatCurrency(approvedAmount)} has been approved via ${paymentMode.toUpperCase()}.`,
        type: "success",
        is_read: false,
        created_at: new Date().toISOString()
      }]);

      if (notifError) console.error("Notification Error:", notifError);

      toast.success("Loan Approved Successfully!");

      onClose();
      setAmount('');
      setIsOverride(false);

      window.location.reload();

    } catch (error: any) {
      console.error('Error approving loan:', error);
      toast.error('Error approving loan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Shield className="h-5 w-5" />
            Approve Loan Request
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <User className="h-5 w-5" />
                Member Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {request.memberAvatar ? (
                    <AvatarImage src={request.memberAvatar} />
                  ) : null}
                  <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 text-lg font-semibold">
                    {request.memberName ? request.memberName.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg dark:text-white">{request.memberName}</h3>
                  <Badge variant="secondary" className="mt-1">
                    Pending Approval
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Deposit Card */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5" />
                Total Deposit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalDeposit)}</div>
              <p className="text-blue-100 text-sm mt-1">Live balance from passbook</p>
            </CardContent>
          </Card>

          {/* 80% Limit Card */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                80% Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(maxLimit)}</div>
              <p className="text-green-100 text-sm mt-1">Maximum without override</p>
            </CardContent>
          </Card>

          {/* Input Card */}
          <Card className="border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <DollarSign className="h-5 w-5" />
                Loan Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="loan-amount" className="dark:text-gray-300">Loan Amount ({formatCurrency(0).charAt(0)})</Label>
                <Input
                  id="loan-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="Enter amount or leave empty"
                />
              </div>

              <div className="text-sm text-muted-foreground dark:text-gray-400">
                Requested: {requestedAmount > 0
                  ? formatCurrency(requestedAmount)
                  : 'Not specified by member'}
              </div>
            </CardContent>
          </Card>

          {/* ✅ CHANGE 2: Payment Mode Card (Added Here) */}
          <Card className="border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <DollarSign className="h-5 w-5" />
                Payment Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Cash', value: 'cash' },
                  { label: 'Bank Transfer', value: 'bank' },
                  { label: 'UPI', value: 'upi' },
                  { label: 'Cheque', value: 'cheque' }
                ].map((m) => (
                  <Button
                    key={m.value}
                    type="button"
                    variant={paymentMode === m.value ? 'default' : 'outline'}
                    onClick={() => setPaymentMode(m.value as any)}
                    className="w-full"
                  >
                    {m.label}
                  </Button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Select how the loan amount is paid to the member
              </p>
            </CardContent>
          </Card>

          {/* Override Card */}
          <Card className={`${isOverride ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800' : 'border-gray-200 dark:border-slate-700 dark:bg-slate-900'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Shield className="h-5 w-5" />
                Override Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="override-toggle" className="text-sm font-medium dark:text-gray-300">
                  Enable Override
                </Label>
                <Switch
                  id="override-toggle"
                  checked={isOverride}
                  onCheckedChange={setIsOverride}
                />
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Allow loan amount up to 100% of deposits
              </p>
            </CardContent>
          </Card>

          {/* Interest Rate Card */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
                <Percent className="h-5 w-5" />
                Interest Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">1% / month</div>
              <p className="text-purple-600 dark:text-purple-400 text-sm mt-1">Fixed rate</p>
            </CardContent>
          </Card>

          {/* Loan Date Card */}
          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-gray-300 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Calendar className="h-5 w-5" />
                Loan Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold dark:text-white">Current Month</div>
              <p className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Validation Feedback */}
        {isOverLimit && (
          <Alert className={`mt-6 ${isOverride ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800' : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'}`}>
            <AlertTriangle className={`h-4 w-4 ${isOverride ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`} />
            <AlertDescription className={isOverride ? 'text-orange-800 dark:text-orange-300' : 'text-red-800 dark:text-red-300'}>
              {isOverride ? (
                <span className="font-medium">Override Active - Loan approval enabled up to 100% of deposits</span>
              ) : (
                <span className="font-medium">
                  Amount exceeds 80% limit ({formatCurrency(maxLimit)}). Enable override to approve.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 dark:bg-slate-800 dark:text-white dark:border-slate-700">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canApprove || isSubmitting || loanAmount <= 0}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving...
              </>
            ) : (
              'Approve Loan'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
