'use client'

import { useState, useEffect } from 'react'
import { useClientStore } from '@/lib/client/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Info,
  Calendar,
  Percent
} from 'lucide-react'

interface ApproveLoanModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: string | null
}

export function ApproveLoanModal({ isOpen, onClose, requestId }: ApproveLoanModalProps) {
  const { loanRequests, approveLoan, getMemberDepositBalance } = useClientStore()
  const [amount, setAmount] = useState<string>('')
  const [isOverride, setIsOverride] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalDeposit, setTotalDeposit] = useState(0)

  const request = loanRequests.find(r => r.id === requestId)

  // FETCH LIVE DATA ON OPEN
  useEffect(() => {
    if (isOpen && request) {
      // 1. Get Live Balance from Store
      const liveBalance = getMemberDepositBalance(request.memberId);
      setTotalDeposit(liveBalance);
      
      // 2. Set Initial Amount
      setAmount(request.amount?.toString() || '0');
      setIsOverride(false);
    }
  }, [isOpen, request, getMemberDepositBalance]);

  // Calculate limits with live data
  const maxLimit = totalDeposit * 0.8
  const requestedAmount = request?.amount || 0
  const loanAmount = parseFloat(amount) || requestedAmount

  // Validation logic
  const isOverLimit = loanAmount > maxLimit
  const canApprove = !isOverLimit || isOverride

  const handleSubmit = async () => {
    if (!request || !canApprove) return

    setIsSubmitting(true)
    try {
      approveLoan(request.id, loanAmount, isOverride)
      onClose()
      setAmount('')
      setIsOverride(false)
    } catch (error) {
      console.error('Error approving loan:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (!request) return null

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
                    {request.memberName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{request.memberName}</h3>
                  <Badge variant="secondary" className="mt-1">
                    Active Member
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
              <p className="text-blue-100 text-sm mt-1">Live balance from store</p>
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
                  placeholder="Enter loan amount"
                />
              </div>
              
              {/* Requested Amount Info */}
              <div className="text-sm text-muted-foreground">
                Requested: {formatCurrency(requestedAmount)}
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
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canApprove || isSubmitting || !amount}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Approving...' : 'Approve Loan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}