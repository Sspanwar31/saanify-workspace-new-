'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, DollarSign, Percent, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Member {
  id: string
  name: string
  phone: string
  joinDate: string
  address: string
  createdAt: string
  updatedAt: string
}

interface AddLoanModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (loan: any) => void
  editingLoan?: any | null
}

interface LoanFormData {
  memberId: string
  loanAmount: string
  interestRate: string
  totalInstallments: string
  paidInstallments: string
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'CLOSED' | 'REJECTED'
  description: string
}

export default function AddLoanModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingLoan 
}: AddLoanModalProps) {
  const [formData, setFormData] = useState<LoanFormData>({
    memberId: '',
    loanAmount: '',
    interestRate: '',
    totalInstallments: '',
    paidInstallments: '',
    startDate: '',
    endDate: '',
    status: 'PENDING',
    description: ''
  })
  
  const [members, setMembers] = useState<Member[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch members from API
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/client/members')
        const data = await response.json()
        
        if (response.ok) {
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error('Failed to fetch members:', error)
      }
    }

    if (isOpen) {
      fetchMembers()
    }
  }, [isOpen])

  // Reset form when modal opens/closes or editing loan changes
  useEffect(() => {
    if (isOpen) {
      if (editingLoan) {
        setFormData({
          memberId: editingLoan.memberId,
          loanAmount: editingLoan.loanAmount.toString(),
          interestRate: editingLoan.interestRate.toString(),
          totalInstallments: editingLoan.totalInstallments.toString(),
          paidInstallments: editingLoan.paidInstallments.toString(),
          startDate: editingLoan.startDate,
          endDate: editingLoan.endDate,
          status: editingLoan.status,
          description: editingLoan.description || ''
        })
      } else {
        setFormData({
          memberId: '',
          loanAmount: '',
          interestRate: '',
          totalInstallments: '',
          paidInstallments: '',
          startDate: '',
          endDate: '',
          status: 'PENDING',
          description: ''
        })
      }
      setErrors([])
    }
  }, [isOpen, editingLoan])

  const handleInputChange = (field: keyof LoanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): boolean => {
    if (!formData.memberId) {
      toast.error('❌ Validation Error', {
        description: 'Please select a member',
        duration: 3000,
      })
      return false
    }
    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      toast.error('❌ Validation Error', {
        description: 'Please enter a valid loan amount',
        duration: 3000,
      })
      return false
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      toast.error('❌ Validation Error', {
        description: 'Please enter a valid interest rate',
        duration: 3000,
      })
      return false
    }
    if (!formData.totalInstallments || parseInt(formData.totalInstallments) <= 0) {
      toast.error('❌ Validation Error', {
        description: 'Please enter valid total installments',
        duration: 3000,
      })
      return false
    }
    if (!formData.startDate) {
      toast.error('❌ Validation Error', {
        description: 'Please select a start date',
        duration: 3000,
      })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const selectedMember = members.find(m => m.id === formData.memberId)
      if (!selectedMember) {
        toast.error('❌ Error', {
          description: 'Please select a valid member',
          duration: 3000,
        })
        setIsSubmitting(false)
        return
      }

      const loanData = {
        id: editingLoan ? editingLoan.id : Date.now().toString(),
        member: selectedMember.name,
        memberId: formData.memberId,
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate),
        totalInstallments: parseInt(formData.totalInstallments),
        paidInstallments: parseInt(formData.paidInstallments) || 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        description: formData.description.trim() || undefined,
        createdAt: editingLoan ? editingLoan.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      onSave(loanData)
      
      toast.success(editingLoan ? '✅ Loan Updated Successfully!' : '✅ Loan Added Successfully!', {
        description: `Loan for ${selectedMember.name} has been ${editingLoan ? 'updated' : 'created'}.`,
        duration: 3000,
      })

      onClose()
    } catch (error) {
      toast.error('❌ Error', {
        description: 'Failed to save loan. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const calculateEndDate = () => {
    if (formData.startDate && formData.totalInstallments) {
      const startDate = new Date(formData.startDate)
      const totalMonths = parseInt(formData.totalInstallments)
      if (!isNaN(totalMonths)) {
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + totalMonths)
        const endDateStr = endDate.toISOString().split('T')[0]
        if (formData.endDate !== endDateStr) {
          setFormData(prev => ({ ...prev, endDate: endDateStr }))
        }
      }
    }
  }

  useEffect(() => {
    calculateEndDate()
  }, [formData.startDate, formData.totalInstallments])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {editingLoan ? 'Edit Loan' : 'Add New Loan'}
          </DialogTitle>
          <DialogDescription>
            {editingLoan ? 'Update the loan details below' : 'Fill in the details to create a new loan for the selected member'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="memberId" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Member *
            </Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) => handleInputChange('memberId', value)}
            >
              <SelectTrigger className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.phone}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount" className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Loan Amount (₹) *
              </Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="50000"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                min="0"
                step="1000"
              />
              {formData.loanAmount && (
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(parseFloat(formData.loanAmount) || 0)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate" className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Interest Rate (%) *
              </Label>
              <Input
                id="interestRate"
                type="number"
                placeholder="12"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          {/* Installment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalInstallments" className="text-sm font-medium">
                Total Installments *
              </Label>
              <Input
                id="totalInstallments"
                type="number"
                placeholder="12"
                value={formData.totalInstallments}
                onChange={(e) => handleInputChange('totalInstallments', e.target.value)}
                className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                min="1"
                max="360"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidInstallments" className="text-sm font-medium">
                Paid Installments
              </Label>
              <Input
                id="paidInstallments"
                type="number"
                placeholder="0"
                value={formData.paidInstallments}
                onChange={(e) => handleInputChange('paidInstallments', e.target.value)}
                className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                min="0"
              />
            </div>
          </div>

          {/* Date Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date *
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status *
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => handleInputChange('status', value)}
            >
              <SelectTrigger className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Enter loan description or purpose..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 resize-none"
              rows={3}
            />
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="text-sm text-red-800 dark:text-red-200">
                <div className="font-medium mb-1">Please fix the following errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-xs">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/40"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="flex items-center gap-2"
                >
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {editingLoan ? 'Updating...' : 'Creating...'}
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {editingLoan ? 'Update Loan' : 'Create Loan'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}