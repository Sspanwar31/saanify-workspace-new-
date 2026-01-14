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

interface ApproveLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
}

export function ApproveLoanModal({ isOpen, onClose, requestId }: ApproveLoanModalProps) {
  // --- Local States ---
  const [request, setRequest] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [isOverride, setIsOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalDeposit, setTotalDeposit] = useState(0);

  // 1. Fetch Loan Request & Live Deposit Balance
  useEffect(() => {
    if (isOpen && requestId) {
      const fetchData = async () => {
        // A. Fetch Loan Request Details
        // ✅ DRIF-1: Loan Fetch (BLANK MODAL FIX)
        const { data: loanData, error } = await supabase
          .from('loans')
          .select(`
            *,
            members (
              id,
              name
            )
          `)
          .eq('id', requestId)
          .single();

        if (loanData && !error) {
          // ✅ DRIF-2: Requested Amount Fallback (BLANK AMOUNT FIX)
          const requestedAmount =
            loanData.approved_amount ??
            loanData.amount ??
            0;

          setRequest({
            id: loanData.id,
            memberId: loanData.member_id,
            clientId: loanData.client_id,
            memberName: loanData.members?.name || 'Unknown',
            amount: requestedAmount,
            status: loanData.status
          });

          // ✅ DRIF-3: Total Deposit Calculation (MAIN BLANK ISSUE)
          // 🔥 REAL deposit calculation
          const { data: passbookData } = await supabase
            .from('passbook_entries')
            .select('deposit_amount, type') // Select 'type' to filter correctly
            .eq('member_id', loanData.member_id)
            .eq('client_id', loanData.client_id); // Safety filter

          // Calculate total deposits
          const totalDeposits = (passbookData || [])
            .filter(e => e.type === 'deposit')
            .reduce((sum, e) => sum + Number(e.deposit_amount || 0), 0);

          setTotalDeposit(totalDeposits);
          
          // ✅ DRIF-3 (Input Default): Auto-fill only if requested amount exists
          setAmount(
            requestedAmount > 0
              ? requestedAmount.toString()
              : ''
          );
          setIsOverride(false);
        }
      };
      fetchData();
    }
  }, [isOpen, requestId]);

  // --- Logic: Limits Calculation ---
  const maxLimit = totalDeposit * 0.8;
  const requestedAmount = request?.amount || 0;
  const loanAmount = parseFloat(amount) || requestedAmount; // Fallback to requestedAmount if input empty

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

      // 1. Update Loan Status (✅ DRIF-6: Loan Update)
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
          remaining_balance: approvedAmount
        })
        .eq('id', request.id);

      if (loanError) throw loanError;

      // 2. Insert Notification for Member
      const { error: notifError } = await supabase.from('notifications').insert([{
          client_id: request.clientId,
          member_id: request.memberId,
          title: "Loan Approved ✅",
          message: `Your loan of ₹${approvedAmount.toLocaleString('en-IN')} has been approved.`,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Approve Loan Request
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <User className="h-5 w-5" />
                Member Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/avatars/${request.memberId}.jpg`} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-lg font-semibold">
                    {request.memberName.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{request.memberName}</h3>
                  <Badge variant="secondary" className="mt-1">
                    Pending Approval
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Deposit Card */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
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
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
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
          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Loan Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="loan-amount">Loan Amount (₹)</Label>
                <Input
                  id="loan-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="Enter amount or leave empty"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                {/* ✅ DRIF-5: Requested Amount UI Safety */}
                Requested: {requestedAmount > 0
                  ? formatCurrency(requestedAmount)
                  : 'Not specified by member'}
              </div>
            </CardContent>
          </Card>

          {/* Override Card */}
          <Card className={`${isOverride ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Override Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="override-toggle" className="text-sm font-medium">
                  Enable Override
                </Label>
                <Switch
                  id="override-toggle"
                  checked={isOverride}
                  onCheckedChange={setIsOverride}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Allow loan amount up to 100% of deposits
              </p>
            </CardContent>
          </Card>

          {/* Interest Rate Card */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Percent className="h-5 w-5" />
                Interest Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">1% / month</div>
              <p className="text-purple-600 text-sm mt-1">Fixed rate</p>
            </CardContent>
          </Card>

          {/* Loan Date Card */}
          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Loan Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">Current Month</div>
              <p className="text-muted-foreground text-sm mt-1">
                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Validation Feedback */}
        {isOverLimit && (
          <Alert className={`mt-6 ${isOverride ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
            <AlertTriangle className={`h-4 w-4 ${isOverride ? 'text-orange-600' : 'text-red-600'}`} />
            <AlertDescription className={isOverride ? 'text-orange-800' : 'text-red-800'}>
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
            // ✅ DRIF-4: 80% Logic + Approve Button Enable
            disabled={!canApprove || isSubmitting || loanAmount <= 0}
            className="bg-green-600 hover:bg-green-700 flex-1"
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
