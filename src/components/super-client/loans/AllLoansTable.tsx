'use client'

import { useState } from 'react'
import { useSuperClientStore } from '@/lib/super-client/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  DollarSign, 
  User, 
  Edit, 
  Trash2, 
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react'

export function AllLoansTable() {
  const { loans, members } = useSuperClientStore()
  const [editingLoan, setEditingLoan] = useState<string | null>(null)

  // Get all loans (both active and closed)
  const allLoans = loans.map(loan => {
    const member = members.find(m => m.id === loan.memberId)
    return {
      ...loan,
      memberName: member?.name || 'Unknown Member',
      memberPhoto: member?.id || ''
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const calculateNextEMI = (loan: any) => {
    if (loan.status !== 'active') return '-'
    
    const startDate = new Date(loan.startDate)
    const currentDate = new Date()
    
    // Calculate months passed
    const monthsPassed = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    
    // Next EMI is (monthsPassed + 1) months from start date
    const nextEMIDate = new Date(startDate)
    nextEMIDate.setMonth(startDate.getMonth() + monthsPassed + 1)
    
    return formatDate(nextEMIDate.toISOString().split('T')[0])
  }

  const calculateInterest = (outstandingBalance: number) => {
    // 1% per month interest
    return outstandingBalance * 0.01
  }

  const handleEdit = (loanId: string) => {
    setEditingLoan(loanId)
    // TODO: Implement edit functionality
    console.log('Edit loan:', loanId)
  }

  const handleDelete = (loanId: string) => {
    // TODO: Implement delete functionality with confirmation
    console.log('Delete loan:', loanId)
  }

  if (allLoans.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No loans found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          All Loans
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead>Interest (1%)</TableHead>
                <TableHead>Total Interest Earned</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Next EMI</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/avatars/${loan.memberPhoto}.jpg`} />
                        <AvatarFallback>
                          {loan.memberName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{loan.memberName}</div>
                        <div className="text-sm text-muted-foreground">{loan.memberId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{formatCurrency(loan.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className={loan.remainingBalance > 0 ? "font-medium text-blue-600" : "text-muted-foreground"}>
                        {formatCurrency(loan.remainingBalance)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-600">
                        {formatCurrency(calculateInterest(loan.remainingBalance))}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">
                        {formatCurrency((loan.amount - loan.remainingBalance) * 0.12)} {/* Simplified calculation */}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(loan.startDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {loan.remainingBalance === 0 ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{formatDate(loan.maturityDate)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{calculateNextEMI(loan)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={loan.remainingBalance === 0 ? "secondary" : "default"}
                      className={loan.remainingBalance === 0 ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"}
                    >
                      {loan.remainingBalance === 0 ? 'Closed' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(loan.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(loan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}