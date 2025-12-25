'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRazorpay, useIframeSecurity } from '@/hooks/useRazorpay'
import { toast } from 'sonner'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'

interface SecurePaymentProps {
  planName: string
  amount: number
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

export default function SecurePayment({ planName, amount, onSuccess, onError }: SecurePaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use secure Razorpay hook
  const { openPayment, isReady } = useRazorpay({
    onPaymentSuccess: (response) => {
      console.log('Payment successful:', response)
      setIsProcessing(false)
      setError(null)
      toast.success('Payment Successful!', {
        description: `Your ${planName} subscription has been activated.`,
        duration: 5000
      })
      onSuccess?.(response)
    },
    onPaymentError: (error) => {
      console.error('Payment failed:', error)
      setIsProcessing(false)
      setError(error.message || 'Payment failed. Please try again.')
      toast.error('Payment Failed', {
        description: error.message || 'Payment failed. Please try again.',
        duration: 5000
      })
      onError?.(error)
    },
    onModalClose: () => {
      if (isProcessing) {
        setIsProcessing(false)
        toast.info('Payment Cancelled', {
          description: 'Payment was cancelled by user.',
          duration: 3000
        })
      }
    }
  })

  // Enable iframe security monitoring
  useIframeSecurity()

  const handlePayment = async () => {
    if (!isReady) {
      setError('Payment system is not ready. Please refresh the page.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create Razorpay order first
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: planName.toLowerCase(),
          amount: amount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        })
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order')
      }

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order')
      }

      // Open secure payment modal
      const paymentSuccess = await openPayment({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.order.id,
        prefill: orderData.prefill,
        notes: {
          plan_name: planName,
          plan_amount: amount,
          source: 'saanify_web',
          timestamp: new Date().toISOString()
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
          },
          escape: true,
          handleback: true,
          confirm_close: false,
          persist: 'company_session_token'
        },
        theme: {
          color: '#3399cc',
          backdrop_color: '#ffffff',
          highlight_color: '#3399cc'
        }
      })

      if (!paymentSuccess) {
        throw new Error('Failed to open payment modal')
      }

    } catch (error) {
      console.error('Payment error:', error)
      setIsProcessing(false)
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.')
      onError?.(error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Details */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">{planName} Plan</span>
            <Badge variant="secondary">₹{amount.toLocaleString()}</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Secure payment powered by Razorpay
          </p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700">
            🔒 Secure 256-bit SSL encryption
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing || !isReady}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ₹{amount.toLocaleString()}
            </>
          )}
        </Button>

        {/* Security Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Payment processed securely through Razorpay</p>
          <p>• No card details stored on our servers</p>
          <p>• All transactions are PCI DSS compliant</p>
          <p>• Instant payment confirmation</p>
        </div>

        {/* Ready Status */}
        {!isReady && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment system is loading. Please wait...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}