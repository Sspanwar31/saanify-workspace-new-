'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  RefreshCw, 
  Eye,
  Upload,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface PaymentStatus {
  id: string
  amount: number
  plan: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  transactionId: string
  screenshotUrl?: string
}

export default function SubscriptionStatusPage() {
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPaymentStatus()
  }, [])

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch('/api/client/subscription/payment-status')
      if (response.ok) {
        const data = await response.json()
        setPaymentStatus(data.paymentStatus)
      } else {
        throw new Error('Failed to fetch payment status')
      }
    } catch (error) {
      console.error('Error fetching payment status:', error)
      toast.error('Failed to load payment status')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6" />
      case 'approved':
        return <CheckCircle className="w-6 h-6" />
      case 'rejected':
        return <AlertCircle className="w-6 h-6" />
      default:
        return <Clock className="w-6 h-6" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Payment Under Review',
          description: 'Your payment is being reviewed by our team. This usually takes 2-24 hours.',
          action: 'We\'ll notify you once approved'
        }
      case 'approved':
        return {
          title: 'Payment Approved',
          description: 'Your payment has been approved and your subscription is now active.',
          action: 'You can now access all features'
        }
      case 'rejected':
        return {
          title: 'Payment Rejected',
          description: 'Your payment could not be verified. Please contact support or submit a new payment.',
          action: 'Please upload a new payment proof'
        }
      default:
        return {
          title: 'Unknown Status',
          description: 'Unable to determine payment status.',
          action: 'Please contact support'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-gray-600">Loading payment status...</p>
        </div>
      </div>
    )
  }

  const statusInfo = paymentStatus ? getStatusMessage(paymentStatus.status) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Saanify</span>
            </div>
            <Link href="/client/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Status Card */}
          {paymentStatus && statusInfo && (
            <Card className={`border-2 ${getStatusColor(paymentStatus.status)}`}>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                    paymentStatus.status === 'pending' ? 'bg-yellow-100' :
                    paymentStatus.status === 'approved' ? 'bg-green-100' :
                    'bg-red-100'
                  }`}>
                    {getStatusIcon(paymentStatus.status)}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                      {statusInfo.title}
                    </h1>
                    <p className="text-slate-600 mb-4">
                      {statusInfo.description}
                    </p>
                    <p className="text-sm text-slate-500">
                      {statusInfo.action}
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(paymentStatus.status)}
                    >
                      {paymentStatus.status.toUpperCase()}
                    </Badge>
                    <div className="text-sm text-slate-600">
                      Plan: {paymentStatus.plan}
                    </div>
                    <div className="text-sm text-slate-600">
                      Amount: ₹{paymentStatus.amount}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Details */}
          {paymentStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Transaction ID</p>
                    <p className="font-mono text-sm bg-slate-100 p-2 rounded">
                      {paymentStatus.transactionId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Submission Date</p>
                    <p className="text-sm">
                      {new Date(paymentStatus.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Plan</p>
                    <p className="font-semibold">{paymentStatus.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Amount</p>
                    <p className="font-semibold">₹{paymentStatus.amount}</p>
                  </div>
                </div>

                {paymentStatus.screenshotUrl && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-slate-600 mb-2">Payment Screenshot</p>
                    <div className="border rounded-lg overflow-hidden max-w-md">
                      <img 
                        src={`data:image/jpeg;base64,${paymentStatus.screenshotUrl}`}
                        alt="Payment screenshot"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {paymentStatus?.status === 'pending' && (
              <Button 
                onClick={fetchPaymentStatus}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check Status</span>
              </Button>
            )}
            
            {paymentStatus?.status === 'rejected' && (
              <Button 
                onClick={() => router.push('/subscription/payment-upload')}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Payment</span>
              </Button>
            )}
            
            {paymentStatus?.status === 'approved' && (
              <Button 
                onClick={() => router.push('/client/dashboard')}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Button>
            )}

            <Button 
              onClick={() => router.push('/client/subscription')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>View Subscription</span>
            </Button>
          </div>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Payment Processing Time</p>
                  <p className="text-sm text-slate-600">
                    Most payments are reviewed within 2-24 hours during business days.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Contact Support</p>
                  <p className="text-sm text-slate-600">
                    If your payment is taking longer than expected, please contact our support team.
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">Email: support@saanify.com</p>
                    <p className="text-sm">Phone: +91 98765 43210</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}