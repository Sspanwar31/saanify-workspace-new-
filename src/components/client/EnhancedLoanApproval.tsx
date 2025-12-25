'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  IndianRupee,
  Clock,
  User,
  Calendar,
  Wallet,
  TrendingUp
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Types ---
interface LoanRequest {
  id: string
  memberId: string
  memberName: string
  memberPhone?: string
  loanAmount: number
  interestRate: number
  status: string
  description: string
  createdAt: string
}

interface PassbookEntry {
  mode: string
  deposit?: number
  depositAmount?: number 
  amount?: number
  date?: string
}

export default function EnhancedLoanApproval() {
  
  const [pendingLoans, setPendingLoans] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null)
  
  // Logic State
  const [memberPassbook, setMemberPassbook] = useState<PassbookEntry[]>([])
  const [passbookLoading, setPassbookLoading] = useState(false)
  const [finalLoanAmount, setFinalLoanAmount] = useState<number>(0)
  const [overrideEnabled, setOverrideEnabled] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  // 1. Fetch Pending Loans
  const fetchPendingLoans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/loan-requests/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingLoans(data.pendingLoans || [])
      } else {
        toast.error('Failed to fetch pending requests')
      }
    } catch (error) {
      // Error logged silently to avoid console spam
      toast.error('Error fetching requests')
    } finally {
      setLoading(false)
    }
  }

  // 2. Fetch Member Total Deposit (Direct API for accurate calculation)
  const fetchMemberTotalDeposit = async (memberId: string) => {
    setPassbookLoading(true)
    try {
      // Primary API Call
      const response = await fetch(`/api/client/members/${memberId}/deposit-total`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMemberPassbook([{
            mode: 'DEPOSIT',
            deposit: data.totalDeposit,
            date: new Date().toISOString().split('T')[0]
          }])
          return; // Exit if successful
        }
      } 
      
      // Fallback 1: Individual member API if deposit-total fails
      const response2 = await fetch(`/api/client/members/${memberId}`)
      if(response2.ok) {
          const data2 = await response2.json()
          if (data2.totalDeposits !== undefined) {
            setMemberPassbook([{
              mode: 'DEPOSIT',
              deposit: data2.totalDeposits,
              date: new Date().toISOString().split('T')[0]
            }])
          }
      }
      
    } catch (error) {
      // Fallback 2: Catch block fallback
      try {
        const response2 = await fetch(`/api/client/members/${memberId}`)
        if(response2.ok) {
           const data2 = await response2.json()
           if (data2.totalDeposits !== undefined) {
             setMemberPassbook([{
               mode: 'DEPOSIT',
               deposit: data2.totalDeposits,
               date: new Date().toISOString().split('T')[0]
             }])
           }
        }
      } catch (fallbackError) {
        // Silent failure to keep console clean
      }
    } finally {
      setPassbookLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingLoans()
  }, [])

  // 3. Open Modal Handler
  const openApprovalModal = async (loan: LoanRequest) => {
    setSelectedLoan(loan)
    setFinalLoanAmount(loan.loanAmount)
    setOverrideEnabled(false) 
    setIsApprovalModalOpen(true)
    
    // Fetch member total deposit immediately
    await fetchMemberTotalDeposit(loan.memberId)
  }

  // 4. Submit Approval
  const handleApprove = async () => {
    if (!selectedLoan) return

    setProcessingAction('approve')
    try {
      const response = await fetch('/api/client/loan-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedLoan.id,
          finalLoanAmount: finalLoanAmount,
          interestRate: 1, // Fixed 1% per month
          installmentsCount: 12, // Default 12 months
          installmentAmount: finalLoanAmount / 12, // Simple calculation
        })
      })

      if (response.ok) {
        toast.success('Loan Approved Successfully')
        setIsApprovalModalOpen(false)
        setSelectedLoan(null)
        fetchPendingLoans()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve loan')
      }
    } catch (error) {
      toast.error('Failed to approve loan')
    } finally {
      setProcessingAction(null)
    }
  }

  // 5. Reject Logic
  const handleReject = async (loan: LoanRequest) => {
    if (!confirm(`Reject loan request from ${loan.memberName}?`)) return
    setProcessingAction(loan.id)
    try {
      await fetch('/api/client/loan-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId: loan.id })
      })
      toast.success('Loan Rejected')
      fetchPendingLoans()
    } catch (error) {
      toast.error('Failed to reject loan')
    } finally {
      setProcessingAction(null)
    }
  }

  // Helper: Currency Formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // --- FIXED CALCULATIONS (Cleaned logs) ---
  const totalDeposits = memberPassbook
    .filter((entry) => {
      const mode = (entry.mode || '').toLowerCase()
      return mode.includes('deposit') && !mode.includes('interest')
    })
    .reduce((sum, entry) => {
      const val = Number(entry.deposit) || Number(entry.depositAmount) || Number(entry.amount) || 0
      return sum + val
    }, 0)
  
  const limitAmount = totalDeposits * 0.8
  const isLimitExceeded = finalLoanAmount > limitAmount
  const canApprove = !isLimitExceeded || overrideEnabled

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold">Loan Requests</h1>
          <p className="text-gray-500">Manage approval requests</p>
        </div>
        <Button variant="outline" onClick={fetchPendingLoans} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4"/> Pending Requests</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingLoans.length}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><IndianRupee className="h-4 w-4"/> Total Requested Amount</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(pendingLoans.reduce((s, l) => s + l.loanAmount, 0))}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4"/> Average Request</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               {pendingLoans.length > 0 
                  ? formatCurrency(pendingLoans.reduce((s, l) => s + l.loanAmount, 0) / pendingLoans.length)
                  : formatCurrency(0)
                }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Loans Table (Clean Layout) */}
      <Card>
        <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
             <div className="py-8 text-center">Loading requests...</div>
          ) : pendingLoans.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2 opacity-50"/>
              <p>No pending loan requests found.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Requested Amount</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <User className="h-4 w-4"/>
                          </div>
                          <div>
                            <p className="font-semibold">{loan.memberName}</p>
                            <p className="text-xs text-gray-500">ID hidden</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(loan.loanAmount)}</TableCell>
                      <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => openApprovalModal(loan)} className="bg-green-600 hover:bg-green-700 text-white h-8">
                            Approve
                          </Button>
                          <Button size="sm" onClick={() => handleReject(loan)} variant="destructive" className="h-8">
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* FINAL APPROVED MODAL DESIGN (MODERN CLIENT THEME) */}
      {/* ========================================================= */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-transparent backdrop-blur-none" />
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-emerald-100">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white"/>
              </div>
              Approve Loan
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Enter loan details to approve (1% monthly interest)
            </DialogDescription>
          </DialogHeader>

          {selectedLoan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
              
              {/* 1. Member Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                <Label className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-2 block">Member Details</Label>
                <div className="text-xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600"/>
                  </div>
                  {selectedLoan.memberName}
                </div>
              </div>

              {/* 2. Deposit & Limit Stats (MODERN CARDS) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <Wallet className="h-4 w-4"/>
                    <span className="text-xs font-semibold uppercase">Total Deposit</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-900">
                    {passbookLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        Calculating...
                      </div>
                    ) : (
                      formatCurrency(totalDeposits)
                    )}
                  </div>
                </div>
                
                <div className={`bg-gradient-to-br rounded-xl p-4 border transition-all duration-300 ${
                  isLimitExceeded && !overrideEnabled 
                    ? 'from-red-50 to-red-100 border-red-200' 
                    : 'from-teal-50 to-teal-100 border-teal-200'
                }`}>
                  <div className={`flex items-center gap-2 mb-2 ${
                    isLimitExceeded && !overrideEnabled ? 'text-red-600' : 'text-teal-600'
                  }`}>
                    <TrendingUp className="h-4 w-4"/>
                    <span className="text-xs font-semibold uppercase">80% Limit</span>
                  </div>
                  <div className={`text-lg font-bold ${
                    isLimitExceeded && !overrideEnabled ? 'text-red-900' : 'text-teal-900'
                  }`}>
                    {passbookLoading ? "..." : formatCurrency(limitAmount)}
                  </div>
                </div>
              </div>

              {/* 3. Warning (Only if limit exceeded and override is disabled) */}
              {isLimitExceeded && !overrideEnabled && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-4 rounded-xl"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-600"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Limit Exceeded</p>
                    <p className="text-xs text-red-600 mt-1">
                      Requested amount is greater than 80% of deposits. You must enable override to proceed.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* 4. Loan Amount Input */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                <Label htmlFor="loanAmount" className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-3 block">
                  Loan Amount (₹)
                </Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={finalLoanAmount}
                  onChange={(e) => setFinalLoanAmount(Number(e.target.value))}
                  className={`text-lg font-bold border-2 rounded-lg transition-all duration-200 ${
                    isLimitExceeded && !overrideEnabled 
                      ? "border-red-300 bg-red-50 text-red-900 focus-visible:ring-red-500 focus-visible:border-red-500" 
                      : "border-emerald-200 bg-emerald-50 text-emerald-900 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                  }`}
                />
              </div>

              {/* 5. Override Toggle */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch 
                      id="override" 
                      checked={overrideEnabled}
                      onCheckedChange={setOverrideEnabled}
                      className="scale-110"
                    />
                    <div>
                      <Label htmlFor="override" className="text-sm font-bold cursor-pointer text-teal-800">
                        Enable Override
                      </Label>
                      <p className="text-xs text-teal-600 mt-1">
                        Allow loan amount up to 100% of deposits
                      </p>
                    </div>
                  </div>
                  {overrideEnabled && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 text-white"/>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 6. Static Info Footer (MODERN DESIGN) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-600 mb-2">
                    <span className="text-xs font-bold uppercase">Interest Rate</span>
                  </div>
                  <p className="font-bold text-amber-900 text-lg">1% / month</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-teal-600 mb-2">
                    <Calendar className="h-4 w-4"/>
                    <span className="text-xs font-bold uppercase">Loan Date</span>
                  </div>
                  <p className="font-bold text-teal-900 text-lg">Current Month</p>
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="mt-6 pt-4 border-t border-emerald-100 flex justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={() => setIsApprovalModalOpen(false)}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg px-6 py-3"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={!canApprove || processingAction === 'approve'}
              className={`rounded-lg px-8 py-3 font-bold transition-all duration-200 text-lg ${
                !canApprove 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {processingAction === 'approve' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5"/>
                  Approve Loan
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
    </div>
  )
}