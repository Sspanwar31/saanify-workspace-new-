'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  User, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Bell,
  ArrowLeft,
  Home,
  Settings,
  LogOut,
  ChevronDown,
  FileText,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Zap,
  CheckSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { makeAuthenticatedRequest } from '@/lib/auth'
import Link from 'next/link'

interface PaymentProof {
  id: string
  userId: string
  amount: number
  plan: string
  txnId: string
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  adminNotes?: string
  rejectionReason?: string
  user: {
    id: string
    name: string
    email: string
    societyName?: string
  }
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  totalAmount: number
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  data?: any
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentProof[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  const [selectedPlanForApproval, setSelectedPlanForApproval] = useState<string>('')

  useEffect(() => {
    fetchPayments()
    fetchAvailablePlans()
    fetchNotifications()
    // Set up periodic refresh for notifications
    const notificationInterval = setInterval(fetchNotifications, 30000) // Refresh every 30 seconds
    return () => clearInterval(notificationInterval)
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/subscriptions/payment-proofs')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.paymentProofs || [])
        
        // Calculate stats from payment data
        const paymentStats = data.paymentProofs?.reduce((acc: Stats, payment: PaymentProof) => {
          acc.total++
          acc.totalAmount += payment.amount || 0
          if (payment.status === 'pending') acc.pending++
          else if (payment.status === 'approved') acc.approved++
          else if (payment.status === 'rejected') acc.rejected++
          return acc
        }, { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 })
        
        setStats(paymentStats)
      } else {
        throw new Error('Failed to fetch payments')
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await makeAuthenticatedRequest('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const fetchAvailablePlans = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/subscription-plans?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        // Get all plans including inactive ones for payment approval
        setAvailablePlans(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching available plans:', error)
    }
  }

  const handleApprovePayment = async (paymentId: string, selectedPlan?: string) => {
    setIsProcessing(paymentId)
    try {
      // Find the payment to get userId and plan
      const payment = payments.find(p => p.id === paymentId)
      if (!payment) {
        throw new Error('Payment not found')
      }

      // Use selected plan if provided, otherwise use payment's plan
      const planToApprove = selectedPlan || payment.plan

      const response = await makeAuthenticatedRequest('/api/admin/subscriptions/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentId,
          userId: payment.userId,
          plan: planToApprove,
          adminNotes: 'Payment approved by admin'
        })
      })

      if (response.ok) {
        toast.success('Payment approved successfully', {
          description: 'User subscription has been activated for 30 days'
        })
        fetchPayments() // Refresh data
        fetchNotifications() // Refresh notifications
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve payment')
      }
    } catch (error) {
      console.error('Error approving payment:', error)
      toast.error('Failed to approve payment')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    setIsProcessing(paymentId)
    try {
      // Find the payment to get userId
      const payment = payments.find(p => p.id === paymentId)
      if (!payment) {
        throw new Error('Payment not found')
      }

      const response = await makeAuthenticatedRequest('/api/admin/subscriptions/reject-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentId,
          userId: payment.userId,
          adminNotes: 'Payment rejected by admin'
        })
      })

      if (response.ok) {
        toast.success('Payment rejected', {
          description: 'User has been notified about rejection'
        })
        fetchPayments() // Refresh data
        fetchNotifications() // Refresh notifications
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject payment')
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast.error('Failed to reject payment')
    } finally {
      setIsProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        payment.txnId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-gray-600">Loading payments data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <div className="border-b bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Back to Admin Panel Button */}
              <Link href="/admin">
                <Button variant="outline" size="sm" className="flex items-center space-x-2 hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </Button>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-900">Payment Approval</span>
                  <p className="text-xs text-slate-500">Review & verify payments</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative hover:bg-slate-100"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                      <p className="text-sm text-slate-500">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 text-sm">{notification.title}</p>
                                <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <Button variant="outline" size="sm" onClick={fetchPayments} className="hover:bg-slate-100">
                <RefreshCw className="w-4 h-4" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2 hover:bg-slate-100">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/avatars/admin.jpg" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Payments</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                    <p className="text-blue-100 text-xs mt-1">All transactions</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold">{stats.pending}</p>
                    <p className="text-yellow-100 text-xs mt-1">Need review</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Approved</p>
                    <p className="text-3xl font-bold">{stats.approved}</p>
                    <p className="text-green-100 text-xs mt-1">Verified</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-pink-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Rejected</p>
                    <p className="text-3xl font-bold">{stats.rejected}</p>
                    <p className="text-red-100 text-xs mt-1">Not verified</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Amount</p>
                    <p className="text-3xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
                    <p className="text-purple-100 text-xs mt-1">Revenue</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters */}
          <Card className="mb-6 shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, transaction ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="w-full lg:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  className="h-12 hover:bg-slate-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Payments List */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Payment Submissions</CardTitle>
                  <CardDescription className="text-slate-600">
                    {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </div>
                {stats.pending > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    {stats.pending} Pending Review
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredPayments.length > 0 ? (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`border rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${
                        payment.status === 'pending' ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={payment.user.email} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {payment.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900 text-lg">{payment.user.name}</p>
                            <p className="text-sm text-slate-600">{payment.user.email}</p>
                            {payment.user.societyName && (
                              <p className="text-xs text-slate-500 mt-1">{payment.user.societyName}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="flex items-center space-x-1">
                                <CreditCard className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-slate-600 font-medium">{payment.plan} Plan</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-slate-600">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-slate-600">{payment.txnId}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl font-bold text-slate-900">₹{payment.amount}</span>
                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(payment.status)} px-3 py-1`}
                            >
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(payment.status)}
                                <span className="font-medium">{payment.status.toUpperCase()}</span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">Transaction ID</p>
                          <div className="flex items-center space-x-2">
                            {/* Enhanced View Button */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayment(payment)
                                    setSelectedPlanForApproval(payment.plan) // Set current plan as default
                                  }}
                                  className="hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Proof
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold">Payment Verification Details</DialogTitle>
                                  <DialogDescription>
                                    Review payment proof and user information carefully
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedPayment && (
                                  <div className="space-y-6">
                                    {/* User Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg">
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">User Name</p>
                                        <p className="font-semibold text-slate-900">{selectedPayment.user.name}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Email Address</p>
                                        <p className="font-semibold text-slate-900">{selectedPayment.user.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Subscription Plan</p>
                                        <div className="space-y-2">
                                          <p className="text-sm text-slate-500">Current: <span className="font-semibold">{selectedPayment.plan}</span></p>
                                          <Select value={selectedPlanForApproval} onValueChange={setSelectedPlanForApproval}>
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select plan for approval" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {availablePlans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.name}>
                                                  {plan.name} - ₹{plan.price}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Payment Amount</p>
                                        <p className="font-bold text-xl text-green-600">₹{selectedPayment.amount}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Transaction ID</p>
                                        <p className="font-mono text-sm bg-white px-2 py-1 rounded border">{selectedPayment.txnId}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Current Status</p>
                                        <Badge variant="outline" className={getStatusColor(selectedPayment.status)}>
                                          {selectedPayment.status.toUpperCase()}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Submitted On</p>
                                        <p className="font-semibold">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Last Updated</p>
                                        <p className="font-semibold">{new Date(selectedPayment.updatedAt).toLocaleString()}</p>
                                      </div>
                                    </div>

                                    {/* Payment Screenshot */}
                                    {selectedPayment.screenshotUrl && (
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-3">Payment Screenshot</p>
                                        <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                          <img 
                                            src={`data:image/jpeg;base64,${selectedPayment.screenshotUrl}`}
                                            alt="Payment screenshot"
                                            className="w-full h-auto max-h-96 object-contain"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Admin Notes */}
                                    {(selectedPayment.adminNotes || selectedPayment.rejectionReason) && (
                                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm font-medium text-slate-600 mb-2">Admin Notes</p>
                                        <p className="text-sm text-slate-800">
                                          {selectedPayment.adminNotes || selectedPayment.rejectionReason || 'No notes added'}
                                        </p>
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex justify-between items-center pt-4 border-t">
                                      <Button 
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        className="hover:bg-slate-100"
                                      >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to List
                                      </Button>
                                      <div className="flex space-x-3">
                                        <Button 
                                          variant="destructive"
                                          onClick={() => handleRejectPayment(selectedPayment.id)}
                                          disabled={isProcessing === selectedPayment.id}
                                          className="hover:bg-red-600"
                                        >
                                          {isProcessing === selectedPayment.id ? (
                                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                          ) : (
                                            <XCircle className="w-4 h-4 mr-2" />
                                          )}
                                          Reject Payment
                                        </Button>
                                        <Button 
                                          onClick={() => handleApprovePayment(selectedPayment.id, selectedPlanForApproval)}
                                          disabled={isProcessing === selectedPayment.id || !selectedPlanForApproval}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          {isProcessing === selectedPayment.id ? (
                                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                          ) : (
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                          )}
                                          Approve Payment
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {/* Quick Action Buttons for Pending Payments */}
                            {payment.status === 'pending' && (
                              <>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRejectPayment(payment.id)}
                                  disabled={isProcessing === payment.id}
                                  className="hover:bg-red-600"
                                >
                                  {isProcessing === payment.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPlanForApproval(payment.plan) // Set current plan as default
                                    handleApprovePayment(payment.id, payment.plan)
                                  }}
                                  disabled={isProcessing === payment.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isProcessing === payment.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="h-24 w-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No payments found</h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms' 
                      : 'No payment submissions have been received yet'
                    }
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}