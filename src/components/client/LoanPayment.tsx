'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  CreditCard, 
  IndianRupee, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Types
interface LoanPaymentProps {
  loanId: string
  memberId: string
  outstandingBalance: number
  emiAmount?: number
  onPaymentSuccess?: () => void
}

export default function LoanPayment({ 
  loanId, 
  memberId, 
  outstandingBalance, 
  emiAmount,
  onPaymentSuccess 
}: LoanPaymentProps) {
  const [paymentAmount, setPaymentAmount] = useState(emiAmount || 0)
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [processing, setProcessing] = useState(false)

  const handlePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (paymentAmount > outstandingBalance) {
      toast.error('Payment amount cannot exceed outstanding balance')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/client/loan-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId,
          memberId,
          paymentAmount,
          paymentMode
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('✅ Payment Successful', {
          description: `EMI payment of ₹${paymentAmount.toFixed(2)} processed successfully`,
          duration: 3000
        })
        
        if (data.paymentDetails.loanStatus === 'completed') {
          toast.success('🎉 Loan Completed', {
            description: 'Congratulations! Your loan has been fully paid off.',
            duration: 5000
          })
        }

        setPaymentAmount(emiAmount || 0)
        onPaymentSuccess?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to process payment')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Failed to process payment')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const paymentModes = [
    'Cash',
    'Bank Transfer',
    'Cheque',
    'Online Payment',
    'UPI',
    'Net Banking'
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Make EMI Payment</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pay your monthly installment
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Outstanding Balance Display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Balance</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(outstandingBalance)}
                </p>
              </div>
              <div className="text-right">
                {emiAmount && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly EMI</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(emiAmount)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="1"
                max={outstandingBalance}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="mt-1"
                placeholder="Enter payment amount"
              />
              {emiAmount && (
                <p className="text-sm text-gray-500 mt-1">
                  Suggested EMI: {formatCurrency(emiAmount)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Summary */}
            {paymentAmount > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Payment Amount:</span>
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      {formatCurrency(paymentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Remaining Balance:</span>
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      {formatCurrency(Math.max(0, outstandingBalance - paymentAmount))}
                    </span>
                  </div>
                  {paymentAmount >= outstandingBalance && (
                    <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded">
                      <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">This payment will complete your loan!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handlePayment}
              disabled={processing || !paymentAmount || paymentAmount <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {processing ? 'Processing...' : 'Make Payment'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setPaymentAmount(emiAmount || 0)}
              disabled={processing}
            >
              Reset
            </Button>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Important Notes
            </h4>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Please ensure sufficient funds before making payment</li>
              <li>• Payment confirmation will be sent to your registered contact</li>
              <li>• Interest will be calculated automatically</li>
              <li>• Loan will be marked as completed when fully paid</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}