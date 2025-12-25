"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Download, 
  Eye, 
  Filter, 
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  CreditCard
} from 'lucide-react'

interface PaymentRecord {
  id: string
  date: string
  planName: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  transactionId: string
  paymentMethod: string
  proofFile?: string
  approvedDate?: string
  rejectedReason?: string
  nextBillingDate?: string
}

interface SubscriptionRecord {
  id: string
  planName: string
  startDate: string
  endDate?: string
  status: 'active' | 'expired' | 'trial' | 'cancelled'
  amount: number
  billingCycle: 'monthly' | 'yearly'
  autoRenew: boolean
}

const mockPaymentHistory: PaymentRecord[] = [
  {
    id: '1',
    date: '2025-11-29',
    planName: 'Pro',
    amount: 7000,
    status: 'pending',
    transactionId: 'TXN123456789',
    paymentMethod: 'Bank Transfer',
    proofFile: '/uploads/payment-proofs/proof1.jpg'
  },
  {
    id: '2',
    date: '2025-11-15',
    planName: 'Trial',
    amount: 0,
    status: 'completed',
    transactionId: 'TRIAL001',
    paymentMethod: 'Free Trial',
    approvedDate: '2025-11-15',
    nextBillingDate: '2025-12-13'
  }
]

const mockSubscriptionHistory: SubscriptionRecord[] = [
  {
    id: '1',
    planName: 'Pro',
    startDate: '2025-11-29',
    status: 'pending',
    amount: 7000,
    billingCycle: 'monthly',
    autoRenew: true
  },
  {
    id: '2',
    planName: 'Trial',
    startDate: '2025-11-15',
    endDate: '2025-12-13',
    status: 'trial',
    amount: 0,
    billingCycle: 'monthly',
    autoRenew: false
  }
]

export default function SubscriptionHistory() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // In a real implementation, fetch from API
      // const paymentsResponse = await fetch('/api/subscription/payment-history')
      // const subscriptionsResponse = await fetch('/api/subscription/history')
      
      // For now, use mock data
      setPayments(mockPaymentHistory)
      setSubscriptions(mockSubscriptionHistory)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'trial':
        return 'bg-orange-100 text-orange-800'
      case 'rejected':
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
      case 'trial':
        return <Clock className="h-4 w-4" />
      case 'rejected':
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const downloadReceipt = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/subscription/receipt/${paymentId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt-${paymentId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download receipt:', error)
    }
  }

  const viewProof = (proofFile: string) => {
    window.open(proofFile, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription History</h1>
          <p className="text-muted-foreground">Track your payments and subscription changes</p>
        </div>
        <Button onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Timeline</TabsTrigger>
        </TabsList>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by plan name or transaction ID..."
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payment records found</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{payment.planName} Plan</h3>
                          <Badge className={getStatusColor(payment.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="font-medium">Date:</span> {payment.date}
                          </div>
                          <div>
                            <span className="font-medium">Transaction ID:</span> {payment.transactionId}
                          </div>
                          <div>
                            <span className="font-medium">Method:</span> {payment.paymentMethod}
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> ₹{payment.amount.toLocaleString()}
                          </div>
                        </div>

                        {payment.approvedDate && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Approved:</span> {payment.approvedDate}
                          </div>
                        )}

                        {payment.rejectedReason && (
                          <div className="mt-2 text-sm text-red-600">
                            <span className="font-medium">Reason:</span> {payment.rejectedReason}
                          </div>
                        )}

                        {payment.nextBillingDate && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Next Billing:</span> {payment.nextBillingDate}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {payment.proofFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewProof(payment.proofFile!)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Proof
                          </Button>
                        )}
                        
                        {(payment.status === 'completed' || payment.status === 'approved') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReceipt(payment.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Subscription Timeline Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No subscription records found</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              subscriptions.map((subscription, index) => (
                <Card key={subscription.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{subscription.planName} Plan</h3>
                          <Badge className={getStatusColor(subscription.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(subscription.status)}
                              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                            </div>
                          </Badge>
                          {subscription.autoRenew && (
                            <Badge variant="secondary">Auto-renew ON</Badge>
                          )}
                        </div>
                        
                        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="font-medium">Start Date:</span> {subscription.startDate}
                          </div>
                          {subscription.endDate && (
                            <div>
                              <span className="font-medium">End Date:</span> {subscription.endDate}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Billing:</span> {subscription.billingCycle}
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> ₹{subscription.amount.toLocaleString()}/{subscription.billingCycle.slice(0, -2)}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">₹{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{subscriptions.length}</div>
              <p className="text-sm text-muted-foreground">Plan Changes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {subscriptions.find(s => s.status === 'active') ? 'Active' : 'Inactive'}
              </div>
              <p className="text-sm text-muted-foreground">Current Status</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}