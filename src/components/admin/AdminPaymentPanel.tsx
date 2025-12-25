'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw,
  TrendingUp,
  Users,
  CreditCard,
  AlertCircle
} from 'lucide-react'

interface PaymentData {
  id: string
  userId: string
  user: {
    name: string
    email: string
    subscriptionStatus?: string
    plan?: string
    expiryDate?: string
  }
  plan: string
  amount: number
  txnId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  screenshotUrl?: string
  adminNotes?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  source?: string
}

interface DashboardStats {
  overview: {
    totalUsers: number
    activeSubscriptions: number
    expiredSubscriptions: number
    trialUsers: number
    pendingPayments: number
    approvedPayments: number
    rejectedPayments: number
  }
  revenue: {
    total: number
    monthly: number
  }
  planDistribution: Array<{
    plan: string
    count: number
  }>
  recentActivity: {
    recentPayments: PaymentData[]
    expiringSoon: Array<{
      id: string
      name: string
      email: string
      plan: string
      expiryDate: string
      daysUntilExpiry: number
    }>
  }
  settings: {
    paymentMode: string
  }
}

export default function AdminPaymentPanel() {
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null)

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/payments')
      const data = await response.json()
      
      if (data.success) {
        setDashboardStats(data.dashboard)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/admin/subscriptions/pending?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setPayments(data.payments)
      }
    } catch (error) {
      setError('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats()
    fetchPayments()
  }, [statusFilter])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats()
      fetchPayments()
    }, 30000)

    return () => clearInterval(interval)
  }, [statusFilter])

  // Handle payment approval
  const handleApprove = async (paymentId: string, userId: string, plan: string) => {
    setApprovalLoading(paymentId)
    try {
      const response = await fetch('/api/admin/subscriptions/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan,
          paymentId,
          adminNotes,
          duration: 1 // 1 month
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Payment approved successfully!')
        fetchPayments()
        fetchDashboardStats()
        setSelectedPayment(null)
        setAdminNotes('')
      } else {
        setError(data.error || 'Failed to approve payment')
      }
    } catch (error) {
      setError('Failed to approve payment')
    } finally {
      setApprovalLoading(null)
    }
  }

  // Handle payment rejection
  const handleReject = async (paymentId: string) => {
    setApprovalLoading(paymentId)
    try {
      const response = await fetch('/api/admin/subscriptions/reject-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          adminNotes: rejectionReason
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Payment rejected successfully!')
        fetchPayments()
        fetchDashboardStats()
        setSelectedPayment(null)
        setRejectionReason('')
      } else {
        setError(data.error || 'Failed to reject payment')
      }
    } catch (error) {
      setError('Failed to reject payment')
    } finally {
      setApprovalLoading(null)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" /> Rejected</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      payment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.txnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.plan.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-gray-600">Manage subscription payments and user subscriptions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => { fetchDashboardStats(); fetchPayments(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="payments">Payment Review</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          {dashboardStats && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.overview.totalUsers}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboardStats.overview.activeSubscriptions}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{dashboardStats.overview.pendingPayments}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{dashboardStats.revenue.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      ₹{dashboardStats.revenue.monthly.toLocaleString()} this month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                    <CardDescription>Latest payment submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardStats.recentActivity.recentPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{payment.user.name}</p>
                            <p className="text-sm text-gray-500">{payment.plan} - ₹{payment.amount}</p>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expiring Soon</CardTitle>
                    <CardDescription>Users whose subscription expires in next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardStats.recentActivity.expiringSoon.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.plan}</p>
                          </div>
                          <Badge variant="outline">
                            {user.daysUntilExpiry} days
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Review</CardTitle>
              <CardDescription>Review and approve/reject payment submissions</CardDescription>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, transaction ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
                  <p>Loading payments...</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No payments found</h3>
                  <p className="text-gray-600">
                    {statusFilter !== 'ALL' ? 'Try changing the filter' : 'No payment submissions yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{payment.user.name}</h3>
                            <span className="text-gray-500">({payment.user.email})</span>
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Plan:</span>
                              <p className="font-medium">{payment.plan}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <p className="font-medium">₹{payment.amount}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Transaction ID:</span>
                              <p className="font-medium">{payment.txnId}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <p className="font-medium">
                                {new Date(payment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {payment.screenshotUrl && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Proof
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Payment Proof</DialogTitle>
                                  <DialogDescription>
                                    Screenshot submitted by {payment.user.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                  <img 
                                    src={payment.screenshotUrl} 
                                    alt="Payment proof" 
                                    className="w-full max-w-2xl mx-auto rounded"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {payment.status === 'PENDING' && (
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Approve Payment</DialogTitle>
                                    <DialogDescription>
                                      Approve payment for {payment.user.name} - {payment.plan} plan
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <div>
                                      <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                                      <Textarea
                                        id="adminNotes"
                                        placeholder="Add any notes about this approval..."
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                                        Cancel
                                      </Button>
                                      <Button 
                                        onClick={() => handleApprove(payment.id, payment.userId, payment.plan)}
                                        disabled={approvalLoading === payment.id}
                                      >
                                        {approvalLoading === payment.id ? 'Approving...' : 'Approve Payment'}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Payment</DialogTitle>
                                    <DialogDescription>
                                      Reject payment for {payment.user.name} - {payment.plan} plan
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <div>
                                      <Label htmlFor="rejectionReason">Rejection Reason</Label>
                                      <Textarea
                                        id="rejectionReason"
                                        placeholder="Please provide a reason for rejection..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        required
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                                        Cancel
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => handleReject(payment.id)}
                                        disabled={approvalLoading === payment.id}
                                      >
                                        {approvalLoading === payment.id ? 'Rejecting...' : 'Reject Payment'}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {payment.adminNotes && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <p className="text-sm"><strong>Admin Notes:</strong> {payment.adminNotes}</p>
                        </div>
                      )}
                      
                      {payment.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded">
                          <p className="text-sm"><strong>Rejection Reason:</strong> {payment.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Payment Mode</Label>
                  <p className="text-sm text-gray-500 mb-4">
                    Current payment processing mode
                  </p>
                  {dashboardStats && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Mode</p>
                          <p className="text-sm text-gray-500">
                            {dashboardStats.settings.paymentMode === 'MANUAL' 
                              ? 'Manual payment approval required' 
                              : 'Automatic payment processing'}
                          </p>
                        </div>
                        <Badge variant={dashboardStats.settings.paymentMode === 'MANUAL' ? 'secondary' : 'default'}>
                          {dashboardStats.settings.paymentMode}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}