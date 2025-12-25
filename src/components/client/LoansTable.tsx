'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Loan, 
  getStatusColor, 
  formatCurrency, 
  formatDate 
} from '@/data/loansData'

interface LoansTableProps {
  loans: Loan[]
  loading?: boolean
  onEdit?: (loan: Loan) => void
  onDelete?: (loanId: string) => void
}

type SortField = keyof Loan
type SortDirection = 'asc' | 'desc'

export default function LoansTable({ 
  loans, 
  loading = false, 
  onEdit, 
  onDelete 
}: LoansTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filter and sort loans
  const filteredLoans = useMemo(() => {
    let filtered = loans

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(loan =>
        loan.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort loans
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === undefined || bValue === undefined) return 0
      
      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [loans, searchTerm, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleEdit = (loan: Loan) => {
    if (onEdit) {
      onEdit(loan)
    }
  }

  const handleDelete = (loanId: string, memberName: string) => {
    if (onDelete) {
      if (confirm(`Are you sure you want to delete the loan for ${memberName}?`)) {
        onDelete(loanId)
      }
    }
  }

  const getInstallmentProgress = (paid: number, total: number) => {
    if (total === 0) return 0
    return Math.round((paid / total) * 100)
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Loans History
            </CardTitle>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full lg:w-80 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredLoans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No loans found
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search terms to find the loans you\'re looking for.'
                  : 'No loans have been added yet. Click "Add Loan" to create the first loan.'
                }
              </p>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center gap-2">
                        Loan ID
                        {sortField === 'id' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => handleSort('member')}
                    >
                      <div className="flex items-center gap-2">
                        Member
                        {sortField === 'member' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => handleSort('loanAmount')}
                    >
                      <div className="flex items-center gap-2">
                        Amount
                        {sortField === 'loanAmount' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => handleSort('interestRate')}
                    >
                      <div className="flex items-center gap-2">
                        Interest
                        {sortField === 'interestRate' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Installments</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => handleSort('startDate')}
                    >
                      <div className="flex items-center gap-2">
                        Duration
                        {sortField === 'startDate' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredLoans.map((loan, index) => (
                      <motion.tr
                        key={loan.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-border/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {loan.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {loan.member}
                            </div>
                            {loan.description && (
                              <div className="text-sm text-muted-foreground">
                                {loan.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(loan.loanAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <span>{loan.interestRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm font-medium">{loan.paidInstallments}/{loan.totalInstallments}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getInstallmentProgress(loan.paidInstallments, loan.totalInstallments)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(loan.startDate)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span>{formatDate(loan.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(loan)}
                              className="hover:bg-emerald-100 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(loan.id, loan.member)}
                              className="hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}