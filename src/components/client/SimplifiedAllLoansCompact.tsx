'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Users, 
  Calendar, 
  TrendingUp, 
  RefreshCw, 
  Download, 
  BookOpen, 
  Percent,
  Search,
  Edit,
  Trash2,
  IndianRupee,
  Eye,
  MoreHorizontal
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { loansData, Loan } from '@/data/loansData'
import EditLoanModal from './EditLoanModal'

// Types
interface SimplifiedLoan {
  id: string
  memberName: string
  loanAmount: number
  remainingBalance: number
  nextEmiDate: string
  interestRate: number
  totalInterestEarned: number
  status: 'active' | 'pending' | 'closed'
  startDate: string
  endDate: string
  description: string
  emi?: number
}

export default function SimplifiedAllLoansCompact() {
  const [loans, setLoans] = useState<SimplifiedLoan[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingLoan, setEditingLoan] = useState<SimplifiedLoan | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null)

  // Fetch loans from API
  const fetchLoans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/loans')
      if (response.ok) {
        const data = await response.json()
        // Transform to simplified format
        const simplifiedLoans = data.loans.map((loan: any): SimplifiedLoan => ({
          id: loan.id,
          memberName: loan.memberName,
          loanAmount: loan.amount,
          remainingBalance: loan.remainingBalance,
          nextEmiDate: loan.endDate || calculateNextDate(loan.startDate, 12),
          interestRate: loan.interest,
          totalInterestEarned: loan.totalInterestEarned || 0,
          status: loan.remainingBalance > 0 ? 'active' : 'closed',
          startDate: loan.startDate,
          endDate: loan.remainingBalance > 0 ? '' : (loan.endDate || calculateEndDate(loan.startDate, 12)),
          description: loan.description || 'No description provided',
          emi: loan.emi
        }))
        setLoans(simplifiedLoans)
      } else {
        toast.error('Failed to fetch loans')
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
      toast.error('Failed to fetch loans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  // Helper functions
  const calculateNextDate = (startDate: string, tenureMonths: number): string => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split('T')[0]
  }

  const calculateEndDate = (startDate: string, tenureMonths: number): string => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + tenureMonths)
    return date.toISOString().split('T')[0]
  }

  // Filter loans
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const matchesSearch = loan.memberName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [loans, searchTerm, statusFilter])

  // Calculate statistics
  const stats = useMemo(() => ({
    totalLoans: loans.length,
    activeLoans: loans.filter(loan => loan.status === 'active').length,
    pendingLoans: loans.filter(loan => loan.status === 'pending').length,
    closedLoans: loans.filter(loan => loan.status === 'closed').length,
    totalAmount: loans.reduce((sum, loan) => sum + loan.loanAmount, 0),
    outstandingAmount: loans.reduce((sum, loan) => sum + loan.remainingBalance, 0)
  }), [loans])

  const handleRefresh = () => {
    setLoading(true)
    fetchLoans()
    toast.success('🔄 Data Refreshed', {
      description: 'Loan data has been refreshed',
      duration: 2000
    })
  }

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Loan data is being exported to CSV',
      duration: 3000
    })
  }

  const handleEditLoan = (loan: SimplifiedLoan) => {
    setEditingLoan(loan)
    setIsEditModalOpen(true)
  }

  const handleDeleteLoan = (loanId: string) => {
    setLoanToDelete(loanId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!loanToDelete) return

    try {
      const response = await fetch(`/api/client/loans/${loanToDelete}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('✅ Loan Deleted', {
          description: 'Loan has been deleted successfully',
          duration: 3000
        })
        fetchLoans()
      } else {
        toast.error('❌ Delete Failed', {
          description: data.error || 'Failed to delete loan',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error deleting loan:', error)
      toast.error('❌ Delete Failed', {
        description: 'An unexpected error occurred',
        duration: 3000
      })
    } finally {
      setDeleteDialogOpen(false)
      setLoanToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      closed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    }
    return (
      <Badge className={`${variants[status as keyof typeof variants] || variants.pending} px-2 py-1 text-xs font-medium rounded-full`}>
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Compact Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalLoans}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeLoans}</p>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingLoans}</p>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Closed</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.closedLoans}</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search loans by member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 h-10 text-sm border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-10 px-4"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-10 px-4"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compact Loan Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-slate-200 rounded"></div>
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      </div>
                      <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="h-4 w-20 bg-slate-200 rounded"></div>
                      <div className="h-4 w-20 bg-slate-200 rounded"></div>
                      <div className="h-4 w-20 bg-slate-200 rounded"></div>
                      <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLoans.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">No loans found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'No loans have been created yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLoans.map((loan, index) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                              {loan.memberName}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {loan.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(loan.status)}
                          </div>
                        </div>
                      </div>

                      {/* Loan Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Loan Amount</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(loan.loanAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
                          <p className={`font-semibold ${loan.remainingBalance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatCurrency(loan.remainingBalance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Interest</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {loan.interestRate}% ({formatCurrency(loan.totalInterestEarned)})
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Next EMI</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {formatDate(loan.nextEmiDate)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLoan(loan)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Additional Details Row */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Started: {formatDate(loan.startDate)}</span>
                        {loan.endDate && <span>Ends: {formatDate(loan.endDate)}</span>}
                        {loan.emi && <span>EMI: {formatCurrency(loan.emi)}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingLoan && (
        <EditLoanModal
          loan={editingLoan}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingLoan(null)
          }}
          onSave={() => {
            setIsEditModalOpen(false)
            setEditingLoan(null)
            fetchLoans()
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}