'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Edit, X, Save, DollarSign, Percent, Calendar } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface EditLoanModalProps {
  isOpen: boolean
  onClose: () => void
  loan: {
    id: string
    memberName: string
    loanAmount: number
    remainingBalance: number
    interestRate: number
    status: string
    startDate: string
    endDate: string
  } | null
  onLoanUpdated: () => void
}

export default function EditLoanModal({ isOpen, onClose, loan, onLoanUpdated }: EditLoanModalProps) {
  const [formData, setFormData] = useState({
    loanAmount: '',
    interestRate: '',
    remainingBalance: '',
    status: '',
    startDate: '',
    endDate: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (loan) {
      // Convert dates from display format to input format if needed
      const convertDate = (dateStr: string) => {
        if (!dateStr) return ''
        // If date is in DD/MM/YYYY format, convert to yyyy-MM-dd
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const [day, month, year] = dateStr.split('/')
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        // If date is already in yyyy-MM-dd format, keep it
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr
        }
        // If it's a full ISO date string, extract just the date part
        if (dateStr.includes('T')) {
          return dateStr.split('T')[0]
        }
        return dateStr
      }

      setFormData({
        loanAmount: loan.loanAmount.toString(),
        interestRate: loan.interestRate.toString(),
        remainingBalance: loan.remainingBalance.toString(),
        status: loan.status,
        startDate: convertDate(loan.startDate),
        endDate: convertDate(loan.endDate)
      })
    }
  }, [loan])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loan) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/loans/${loan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('✅ Loan Updated', {
          description: 'Loan details have been updated successfully',
          duration: 3000
        })
        onLoanUpdated()
        onClose()
      } else {
        toast.error('❌ Update Failed', {
          description: data.error || 'Failed to update loan',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error updating loan:', error)
      toast.error('❌ Update Failed', {
        description: 'An unexpected error occurred',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  if (!loan) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Edit className="h-5 w-5" />
            Edit Loan Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Member Name (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="memberName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Member Name
              </Label>
              <Input
                id="memberName"
                value={loan.memberName}
                disabled
                className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="loanAmount" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Loan Amount
              </Label>
              <Input
                id="loanAmount"
                type="number"
                step="0.01"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                required
                min="0"
                className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Enter loan amount"
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="interestRate" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Interest Rate (% per month)
              </Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                required
                min="0"
                className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Enter interest rate"
              />
            </div>

            {/* Remaining Balance */}
            <div className="space-y-2">
              <Label htmlFor="remainingBalance" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Remaining Balance
              </Label>
              <Input
                id="remainingBalance"
                type="number"
                step="0.01"
                value={formData.remainingBalance}
                onChange={(e) => handleInputChange('remainingBalance', e.target.value)}
                required
                min="0"
                className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Enter remaining balance"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Loan Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
                className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Leave blank if still active"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}