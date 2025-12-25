'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle 
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Types
interface LoanRequest {
  id: string
  memberId: string
  memberName: string
  memberPhone?: string
  memberAddress?: string
  loanAmount: number
  interestRate: number
  status: string
  createdAt: string
  description: string
}

interface LoanRequestCardProps {
  loan: LoanRequest
  onApprove: (loan: LoanRequest) => void
  onReject: (loan: LoanRequest) => void
  processingAction: string | null
}

export default function LoanRequestCard({ loan, onApprove, onReject, processingAction }: LoanRequestCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    )
  }

  return (
    <motion.div
      key={loan.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {loan.memberName}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4" />
            {loan.memberPhone || 'Not provided'}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            Requested on {formatDate(loan.createdAt)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Requested Amount</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(loan.loanAmount)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Interest Rate</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {loan.interestRate}%
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Status</p>
              <div>{getStatusBadge(loan.status)}</div>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Description</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {loan.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button
          onClick={() => onApprove(loan)}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={processingAction === loan.id}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button
          onClick={() => onReject(loan)}
          variant="destructive"
          disabled={processingAction === loan.id}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </div>
    </motion.div>
  )
}