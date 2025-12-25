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
  Filter,
  Edit,
  Trash2,
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

export default function SimplifiedAllLoans() {
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
          totalInterestEarned: loan.totalInterestEarned || 0, // Use API calculated value
          status: loan.remainingBalance > 0 ? 'active' : 'closed',
          startDate: loan.startDate,
          // Fixed: End Date behavior - blank for active, actual date for closed
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
        fetchLoans() // Refresh the loans list
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
      active: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-200 dark:border-blue-800 shadow-md',
      pending: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-2 border-amber-200 dark:border-amber-800 shadow-md',
      closed: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-200 dark:border-emerald-800 shadow-md'
    }
    return (
      <Badge className={`${variants[status as keyof typeof variants] || variants.pending} px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full`}>
        {status}
      </Badge>
    )
  }

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

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-blue-100">Total Loans</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{stats.totalLoans}</div>
              <p className="text-sm text-blue-100 font-medium">All registered loans</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-emerald-100">Active</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{stats.activeLoans}</div>
              <p className="text-sm text-emerald-100 font-medium">Currently active</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-amber-600 to-amber-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-amber-100">Pending</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{stats.pendingLoans}</div>
              <p className="text-sm text-amber-100 font-medium">Awaiting approval</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-600 to-purple-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-purple-100">Closed</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{stats.closedLoans}</div>
              <p className="text-sm text-purple-100 font-medium">Completed loans</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search loans by member name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 w-full h-12 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-all duration-200 bg-gray-50 dark:bg-gray-700/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48 h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-all duration-200 bg-gray-50 dark:bg-gray-700/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 h-12 px-6 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl transition-all duration-200 text-base font-medium"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2 h-12 px-6 border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 rounded-xl transition-all duration-200 text-base font-medium"
        >
          <Download className="h-5 w-5" />
          Export Loans
        </Button>
      </motion.div>

      {/* Modern Loans Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-xl bg-white dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              All Loans Register
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Loading loan data...</p>
                </div>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <CreditCard className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    No Loans Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    {searchTerm 
                      ? 'Try adjusting your search terms to find loans you\'re looking for.'
                      : 'No loans have been added yet.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Member Name</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Loan Amount</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Remaining Balance</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Next EMI Date</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Interest</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Total Interest Earned</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Start Date</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">End Date</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan, index) => (
                      <motion.tr 
                        key={loan.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-200"
                      >
                        <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{loan.memberName}</td>
                        <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(loan.loanAmount)}
                        </td>
                        <td className="p-4 font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(loan.remainingBalance)}
                        </td>
                        <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{loan.nextEmiDate}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <span className="font-semibold text-green-700 dark:text-green-300 text-sm">
                                {formatCurrency(loan.loanAmount * 0.01)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">(1%)</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(loan.totalInterestEarned)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{formatDate(loan.startDate)}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">
                          {loan.endDate ? formatDate(loan.endDate) : '-'}
                        </td>
                        <td className="p-4">{getStatusBadge(loan.status)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLoan(loan)}
                              className="flex items-center gap-1 h-8 px-3 border-blue-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLoan(loan.id)}
                              className="flex items-center gap-1 h-8 px-3 border-red-200 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Loan Modal */}
      <EditLoanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        loan={editingLoan}
        onLoanUpdated={fetchLoans}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Loan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan? This action cannot be undone.
              <br />
              <span className="text-amber-600 font-medium">
                Note: Loans with existing payment records cannot be deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="flex items-center gap-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete Loan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}