"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple' // Added Supabase Import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Download,
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react'

interface PaymentProof {
  id: string
  userId: string
  userName: string
  userEmail: string
  societyName?: string
  planName: string
  amount: number
  transactionId: string
  paymentDate: string
  proofFile: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  adminNotes?: string
  rejectionReason?: string
  approvedDate?: string
  durationDays?: number // Added for calculation
}

// Mock data kept for reference but not used in logic
const mockPaymentProofs: PaymentProof[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    societyName: 'Green Valley Society',
    planName: 'Pro',
    amount: 7000,
    transactionId: 'TXN123456789',
    paymentDate: '2025-11-28',
    proofFile: '/uploads/payment-proofs/proof1.jpg',
    status: 'pending',
    submittedAt: '2025-11-29T10:30:00Z'
  }
]

export default function AdminSubscriptionVerification() {
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([])
  const [filteredProofs, setFilteredProofs] = useState<PaymentProof[]>([])
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchPaymentProofs()
  }, [])

  useEffect(() => {
    let filtered = paymentProofs

    if (statusFilter !== 'all') {
      filtered = filtered.filter(proof => proof.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(proof => 
        proof.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proof.societyName && proof.societyName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredProofs(filtered)
  }, [paymentProofs, searchTerm, statusFilter])

  // --- 1. FETCH REAL DATA FROM SUPABASE ---
  const fetchPaymentProofs = async () => {
    setLoading(true)
    try {
      // Fetch Orders
      const { data: orders, error } = await supabase
        .from('subscription_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch Clients for Names
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email, society_name');

      if (!orders) {
         setPaymentProofs([]);
         return;
      }

      // Map Data
      const formattedData: PaymentProof[] = orders.map(order => {
        const client = clients?.find(c => c.id === order.client_id);
        return {
          id: order.id,
          userId: order.client_id,
          userName: client?.name || 'Unknown User',
          userEmail: client?.email || 'N/A',
          societyName: client?.society_name || 'N/A',
          planName: order.plan_name,
          amount: order.amount,
          transactionId: order.transaction_id || 'N/A',
          paymentDate: new Date(order.created_at).toLocaleDateString(),
          proofFile: order.screenshot_url || '', // Assuming this column exists
          status: order.status === 'success' ? 'approved' : order.status, 
          submittedAt: order.created_at,
          durationDays: order.duration_days || 30 // Default 30 days
        };
      });
      
      setPaymentProofs(formattedData)
    } catch (error) {
      console.error('Failed to fetch payment proofs:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- 2. APPROVE LOGIC (REAL DATABASE UPDATE) ---
  const handleApprove = async () => {
    if (!selectedProof) {
      return
    }

    setIsProcessing(true)
    
    try {
      // Step A: Update Subscription Order Status
      const { error: orderError } = await supabase
        .from('subscription_orders')
        .update({ status: 'approved' }) // or 'success'
        .eq('id', selectedProof.id);

      if (orderError) throw orderError;

      // Step B: Update Client Plan (Activation)
      const startDate = new Date();
      const endDate = new Date();
      const duration = selectedProof.durationDays || 30;
      endDate.setDate(startDate.getDate() + duration);

      const { error: clientError } = await supabase
        .from('clients')
        .update({
          plan_name: selectedProof.planName,
          plan_start_date: startDate.toISOString(),
          plan_end_date: endDate.toISOString(),
          subscription_status: 'active'
        })
        .eq('id', selectedProof.userId);

      if (clientError) throw clientError;

      // Update Local State UI
      setPaymentProofs(prev => 
        prev.map(p => 
          p.id === selectedProof.id 
            ? { 
                ...p, 
                status: 'approved', 
                adminNotes: adminNotes.trim(),
                approvedDate: new Date().toISOString()
              }
            : p
        )
      )

      setSelectedProof(null)
      setAdminNotes('')
      
    } catch (error) {
      console.error('Failed to approve payment:', error)
      alert("Failed to approve. Check console for details.");
    } finally {
      setIsProcessing(false)
    }
  }

  // --- 3. REJECT LOGIC (REAL DATABASE UPDATE) ---
  const handleReject = async () => {
    if (!selectedProof || !rejectionReason.trim()) {
      return
    }

    setIsProcessing(true)
    
    try {
      // Only Update Subscription Order Status
      const { error } = await supabase
        .from('subscription_orders')
        .update({ status: 'rejected' })
        .eq('id', selectedProof.id);

      if (error) throw error;

      // Update Local State UI
      setPaymentProofs(prev => 
        prev.map(p => 
          p.id === selectedProof.id 
            ? { 
                ...p, 
                status: 'rejected', 
                rejectionReason: rejectionReason.trim(),
                adminNotes: adminNotes.trim()
              }
            : p
        )
      )

      setSelectedProof(null)
      setAdminNotes('')
      setRejectionReason('')
      
    } catch (error) {
      console.error('Failed to reject payment:', error)
      alert("Failed to reject. Check console.");
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const viewProof = (proofFile: string) => {
    if (proofFile) {
        window.open(proofFile, '_blank')
    } else {
        alert("No proof file attached");
    }
  }

  const stats = {
    total: paymentProofs.length,
    pending: paymentProofs.filter(p => p.status === 'pending').length,
    approved: paymentProofs.filter(p => p.status === 'approved').length,
    rejected: paymentProofs.filter(p => p.status === 'rejected').length,
    revenue: paymentProofs
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0)
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
          <h1 className="text-3xl font-bold">Subscription Verification</h1>
          <p className="text-muted-foreground">Review and verify payment proofs</p>
        </div>
        <Button onClick={fetchPaymentProofs} variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, email, plan, or transaction ID..."
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
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Proofs List */}
      <div className="space-y-4">
        {filteredProofs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payment proof requests found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredProofs.map((proof) => (
            <Card key={proof.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{proof.userName}</h3>
                      <Badge className={getStatusColor(proof.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(proof.status)}
                          {proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="font-medium">Email:</span> {proof.userEmail}
                      </div>
                      <div>
                        <span className="font-medium">Society:</span> {proof.societyName || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Plan:</span> {proof.planName}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> ₹{proof.amount.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Transaction ID:</span> {proof.transactionId}
                      </div>
                      <div>
                        <span className="font-medium">Payment Date:</span> {proof.paymentDate}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {formatDate(proof.submittedAt)}
                      </div>
                      {proof.approvedDate && (
                        <div>
                          <span className="font-medium">Approved:</span> {formatDate(proof.approvedDate)}
                        </div>
                      )}
                    </div>

                    {proof.adminNotes && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Admin Notes:</span> {proof.adminNotes}
                      </div>
                    )}

                    {proof.rejectionReason && (
                      <div className="mt-2 text-sm text-red-600">
                        <span className="font-medium">Rejection Reason:</span> {proof.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewProof(proof.proofFile)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Proof
                    </Button>
                    
                    {proof.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedProof(proof)}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        {selectedProof && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Payment Proof</DialogTitle>
              <DialogDescription>
                Review the payment proof submitted by {selectedProof.userName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Payment Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>User Name</Label>
                  <p className="font-medium">{selectedProof.userName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedProof.userEmail}</p>
                </div>
                <div>
                  <Label>Society</Label>
                  <p className="font-medium">{selectedProof.societyName || 'N/A'}</p>
                </div>
                <div>
                  <Label>Plan</Label>
                  <p className="font-medium">{selectedProof.planName}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-medium">₹{selectedProof.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Transaction ID</Label>
                  <p className="font-medium">{selectedProof.transactionId}</p>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes *</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Enter your review notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Rejection Reason (only shown when rejecting) */}
              {selectedProof.status === 'pending' && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              {/* Proof Preview */}
              <div className="space-y-2">
                <Label>Payment Proof</Label>
                <div className="border rounded-lg p-4">
                  <Button
                    variant="outline"
                    onClick={() => viewProof(selectedProof.proofFile)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Payment Proof
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <div className="flex gap-3 w-full">
                {selectedProof.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleReject()}
                      disabled={isProcessing || !adminNotes.trim() || !rejectionReason.trim()}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove()}
                      disabled={isProcessing || !adminNotes.trim()}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedProof(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
