'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useIframeSecurity, useRazorpaySecurity } from '@/hooks/useIframeSecurity'
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentProps {
  planName: string
  amount: number
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

export default function PaymentComponent({ planName, amount, onSuccess, onError }: PaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Enable iframe security monitoring
  useIframeSecurity()
  const { initializeSecureRazorpay } = useRazorpaySecurity()

  const handlePayment = async () => {
    if (isProcessing) return

    setIsProcessing(true)
    setError(null)
    setSuccess(false)

    try {
      // Create payment order first
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planName.toLowerCase(),
          amount: amount,
          currency: 'INR'
        })
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order')
      }

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order')
      }

      // Initialize secure Razorpay
      const razorpay = initializeSecureRazorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.order.id,
        prefill: orderData.prefill,
        handler: function(response: any) {
          console.log('Payment successful:', response)
          setIsProcessing(false)
          setSuccess(true)
          toast.success('Payment Successful!', {
            description: `Your ${planName} subscription has been activated.`,
            duration: 5000
          })
          onSuccess?.(response)
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed')
            setIsProcessing(false)
            toast.info('Payment Cancelled', {
              description: 'Payment was cancelled by user.',
              duration: 3000
            })
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
        },
        notes: {
          plan_name: planName,
          plan_amount: amount,
          source: 'saanify_web',
          timestamp: new Date().toISOString()
        }
      })

      if (!razorpay) {
        throw new Error('Failed to initialize payment gateway')
      }

      // Open payment modal
      razorpay.open()

    } catch (error) {
      console.error('Payment error:', error)
      setIsProcessing(false)
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.')
      toast.error('Payment Failed', {
        description: error instanceof Error ? error.message : 'Payment failed. Please try again.',
        duration: 5000
      })
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

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              Payment processed successfully!
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing || success}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : success ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Payment Complete
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

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-blue-600 space-y-1">
            <p>🔧 Development mode active</p>
            <p>• IFrame security monitoring enabled</p>
            <p>• CSP policies applied dynamically</p>
            <p>• Razorpay permissions configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}