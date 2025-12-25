'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface PaymentData {
  id: string
  plan: string
  amount: number
  txnId: string
  status: 'pending' | 'completed' | 'not-paid' | 'expired'
  createdAt: string
  screenshotUrl?: string
  adminNotes?: string
  rejectionReason?: string
}

interface SubscriptionData {
  status: string
  plan?: string
  expiryDate?: string
  trialEndsAt?: string
}

interface PaymentSystemProps {
  onPaymentComplete?: () => void
  onPaymentSubmit?: (data: any) => void
}

const PLANS = [
  { name: 'Basic', price: 4000, duration: '1 month', features: ['Up to 10 users', 'Basic features'] },
  { name: 'Pro', price: 7000, duration: '1 month', features: ['Unlimited users', 'Advanced features', 'Priority support'] },
  { name: 'Enterprise', price: 10000, duration: '1 month', features: ['Custom features', 'Dedicated support', 'SLA guarantee'] }
]

export default function PaymentSystem({ onPaymentComplete, onPaymentSubmit }: PaymentSystemProps) {
  const [selectedPlan, setSelectedPlan] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'not-paid' | 'expired'>('not-paid')
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentData[]>([])
  const [countdown, setCountdown] = useState<any>(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('payment')

  // Fetch payment status
  const fetchPaymentStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/payment-status')
      const data = await response.json()
      
      if (data.authenticated) {
        setPaymentStatus(data.paymentStatus)
        setSubscription(data.subscription)
        setCountdown(data.countdown)
        setPolling(data.polling?.enabled || false)
        
        if (data.payment) {
          // Update payment history if new payment
          setPaymentHistory(prev => {
            const exists = prev.find(p => p.id === data.payment.id)
            if (!exists) {
              return [data.payment, ...prev]
            }
            return prev
          })
        }
      }
    } catch (error) {
      console.error('Error fetching payment status:', error)
    }
  }, [])

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/payment-history')
      const data = await response.json()
      
      if (data.success) {
        setPaymentHistory(data.payments)
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchPaymentStatus()
    fetchPaymentHistory()
  }, [fetchPaymentStatus, fetchPaymentHistory])

  // Polling effect
  useEffect(() => {
    if (!polling) return

    const interval = setInterval(() => {
      fetchPaymentStatus()
    }, 4000) // 4 seconds

    return () => clearInterval(interval)
  }, [polling, fetchPaymentStatus])

  // Handle plan selection
  const handlePlanSelect = (planName: string) => {
    const plan = PLANS.find(p => p.name === planName)
    if (plan) {
      setSelectedPlan(planName)
      setAmount(plan.price.toString())
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed')
        return
      }
      setScreenshot(file)
      setError('')
    }
  }

  // Handle payment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlan || !amount || !transactionId || !screenshot) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('plan', selectedPlan)
      formData.append('amount', amount)
      formData.append('transactionId', transactionId)
      formData.append('screenshot', screenshot)

      const response = await fetch('/api/subscription/submit-payment', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Payment proof submitted successfully! Awaiting admin approval.')
        setPaymentStatus('pending')
        setPolling(true)
        setActiveTab('status')
        
        // Reset form
        setSelectedPlan('')
        setAmount('')
        setTransactionId('')
        setScreenshot(null)
        
        // Fetch updated payment history
        fetchPaymentHistory()
        
        if (onPaymentSubmit) {
          onPaymentSubmit(data)
        }
      } else {
        setError(data.error || 'Failed to submit payment')
      }
    } catch (error) {
      setError('Failed to submit payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Completed</Badge>
      case 'not-paid':
        return <Badge variant="outline"><XCircle className="w-4 h-4 mr-1" /> Not Paid</Badge>
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="w-4 h-4 mr-1" /> Expired</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-gray-600">Manage your subscription payments and view history</p>
      </div>

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current Subscription Status
            {getStatusBadge(paymentStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Current Plan</Label>
              <p className="text-lg font-semibold">
                {subscription?.plan || 'No active plan'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <p className="text-lg font-semibold capitalize">
                {subscription?.status || 'Unknown'}
              </p>
            </div>
            {countdown && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Time Remaining</Label>
                <p className="text-lg font-semibold text-orange-600">
                  {countdown.message}
                </p>
                <Progress 
                  value={countdown.days > 0 ? (countdown.days / 30) * 100 : 0} 
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payment">Make Payment</TabsTrigger>
          <TabsTrigger value="status">Payment Status</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Submit Payment Proof</CardTitle>
              <CardDescription>
                Upload your payment proof and wait for admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Plan Selection */}
                <div className="space-y-2">
                  <Label>Select Plan</Label>
                  <Select value={selectedPlan} onValueChange={handlePlanSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANS.map((plan) => (
                        <SelectItem key={plan.name} value={plan.name}>
                          {plan.name} - ₹{plan.price}/{plan.duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Plan Details */}
                {selectedPlan && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Plan Details:</h4>
                    {PLANS.find(p => p.name === selectedPlan)?.features.map((feature, index) => (
                      <div key={index} className="text-sm text-gray-600">• {feature}</div>
                    ))}
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                {/* Transaction ID */}
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID"
                    required
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <Label htmlFor="screenshot">Payment Screenshot</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="screenshot" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {screenshot ? screenshot.name : 'Click to upload payment screenshot'}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </label>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || paymentStatus === 'pending'}
                >
                  {loading ? 'Submitting...' : 'Submit Payment Proof'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Payment Status
                {polling && (
                  <div className="flex items-center text-sm text-blue-600">
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Checking for updates...
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentStatus === 'pending' ? (
                  <div className="text-center py-8">
                    <Clock className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Payment Under Review</h3>
                    <p className="text-gray-600 mb-4">
                      Your payment proof is being reviewed by our admin team.
                    </p>
                    <p className="text-sm text-gray-500">
                      This page will automatically update when the status changes.
                    </p>
                  </div>
                ) : paymentStatus === 'completed' ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Payment Approved</h3>
                    <p className="text-gray-600 mb-4">
                      Your subscription is now active!
                    </p>
                    <Button onClick={onPaymentComplete}>
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Active Payment</h3>
                    <p className="text-gray-600 mb-4">
                      Submit a payment proof to activate your subscription.
                    </p>
                    <Button onClick={() => setActiveTab('payment')}>
                      Make Payment
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View all your past payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Payment History</h3>
                    <p className="text-gray-600">
                      Your payment history will appear here once you make payments.
                    </p>
                  </div>
                ) : (
                  paymentHistory.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(payment.status)}
                          <span className="font-semibold">{payment.plan}</span>
                        </div>
                        <span className="text-lg font-bold">₹{payment.amount}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Transaction ID:</span>
                          <span className="ml-2">{payment.txnId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {payment.adminNotes && (
                          <div className="md:col-span-2">
                            <span className="text-gray-500">Admin Notes:</span>
                            <span className="ml-2">{payment.adminNotes}</span>
                          </div>
                        )}
                        {payment.rejectionReason && (
                          <div className="md:col-span-2">
                            <span className="text-gray-500">Rejection Reason:</span>
                            <span className="ml-2 text-red-600">{payment.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                      {payment.screenshotUrl && (
                        <div className="mt-2">
                          <a
                            href={payment.screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Payment Proof
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}