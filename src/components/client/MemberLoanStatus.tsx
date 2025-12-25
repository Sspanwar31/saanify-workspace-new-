'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  IndianRupee, 
  Percent, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Calculator,
  Clock,
  Target,
  Eye
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import LoanPayment from './LoanPayment'

// Types
interface LoanStatus {
  loanBalance: number
  remainingLoan: number
  activeLoan?: {
    loanId: string
    outstandingBalance: number
    loanAmount: number
    interestRate: number
  }
}

interface LoanDetail {
  id: string
  loanAmount: number
  interestRate: number
  status: string
  startDate: string
  endDate?: string
  emi?: number
  paidInstallments: number
  totalInstallments: number
  outstandingBalance: number
}

export default function MemberLoanStatus({ memberId }: { memberId: string }) {
  const [loanStatus, setLoanStatus] = useState<LoanStatus | null>(null)
  const [loanDetails, setLoanDetails] = useState<LoanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Fetch loan status
  const fetchLoanStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/client/member-loan-status?memberId=${memberId}`)
      if (response.ok) {
        const data = await response.json()
        setLoanStatus(data)
        
        // If there's an active loan, fetch detailed information
        if (data.activeLoan) {
          fetchLoanDetails(data.activeLoan.loanId)
        }
      } else {
        toast.error('Failed to fetch loan status')
      }
    } catch (error) {
      console.error('Error fetching loan status:', error)
      toast.error('Failed to fetch loan status')
    } finally {
      setLoading(false)
    }
  }

  // Fetch detailed loan information
  const fetchLoanDetails = async (loanId: string) => {
    try {
      const response = await fetch(`/api/client/loans`)
      if (response.ok) {
        const data = await response.json()
        const loan = data.loans.find((l: LoanDetail) => l.id === loanId)
        if (loan) {
          setLoanDetails(loan)
        }
      }
    } catch (error) {
      console.error('Error fetching loan details:', error)
    }
  }

  useEffect(() => {
    if (memberId) {
      fetchLoanStatus()
    }
  }, [memberId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getProgressPercentage = (paid: number, total: number) => {
    if (total === 0) return 0
    return Math.round((paid / total) * 100)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Loan Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Loan Status</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your current loan information
                </p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {loanStatus?.activeLoan ? (
              // Active Loan Display
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-300">Active Loan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetailsModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay EMI
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <IndianRupee className="h-4 w-4" />
                      Total Loan Amount
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(loanStatus.activeLoan.loanAmount)}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Target className="h-4 w-4" />
                      Outstanding Balance
                    </div>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(loanStatus.activeLoan.outstandingBalance)}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Percent className="h-4 w-4" />
                      Interest Rate
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {loanStatus.activeLoan.interestRate}%
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Calendar className="h-4 w-4" />
                      Next Payment
                    </div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {loanDetails ? formatDate(loanDetails.endDate || '') : 'N/A'}
                    </p>
                  </div>
                </div>

                {loanDetails && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Payment Progress</h4>
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        {loanDetails.paidInstallments} / {loanDetails.totalInstallments} installments
                      </span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(loanDetails.paidInstallments, loanDetails.totalInstallments)} 
                      className="h-3"
                    />
                    <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                      {getProgressPercentage(loanDetails.paidInstallments, loanDetails.totalInstallments)}% completed
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // No Active Loan
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Loan
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have any active loans. You can request a new loan from the passbook section.
                </p>
                <Button
                  onClick={() => window.location.href = '/client/passbook'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Request New Loan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Loan Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
            <DialogDescription>
              Complete information about your active loan
            </DialogDescription>
          </DialogHeader>

          {loanDetails && (
            <div className="space-y-6">
              {/* Loan Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Loan Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Loan ID</p>
                    <p className="font-medium font-mono">{loanDetails.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Status</p>
                    <div>{getStatusBadge(loanDetails.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Loan Amount</p>
                    <p className="font-medium">{formatCurrency(loanDetails.loanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Interest Rate</p>
                    <p className="font-medium">{loanDetails.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Start Date</p>
                    <p className="font-medium">{formatDate(loanDetails.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">End Date</p>
                    <p className="font-medium">{loanDetails.endDate ? formatDate(loanDetails.endDate) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400">Monthly EMI</p>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      {loanDetails.emi ? formatCurrency(loanDetails.emi) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 dark:text-blue-400">Outstanding Balance</p>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      {formatCurrency(loanDetails.outstandingBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 dark:text-blue-400">Paid Installments</p>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      {loanDetails.paidInstallments} / {loanDetails.totalInstallments}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 dark:text-blue-400">Progress</p>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      {getProgressPercentage(loanDetails.paidInstallments, loanDetails.totalInstallments)}%
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600 dark:text-blue-400">Payment Progress</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      {loanDetails.paidInstallments} of {loanDetails.totalInstallments} installments
                    </span>
                  </div>
                  <Progress 
                    value={getProgressPercentage(loanDetails.paidInstallments, loanDetails.totalInstallments)} 
                    className="h-3"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Make EMI Payment</DialogTitle>
            <DialogDescription>
              Pay your monthly loan installment
            </DialogDescription>
          </DialogHeader>

          {loanStatus?.activeLoan && (
            <LoanPayment
              loanId={loanStatus.activeLoan.loanId}
              memberId={memberId}
              outstandingBalance={loanStatus.activeLoan.outstandingBalance}
              emiAmount={loanDetails?.emi}
              onPaymentSuccess={() => {
                setShowPaymentModal(false)
                fetchLoanStatus()
                fetchLoanDetails(loanStatus.activeLoan.loanId)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}