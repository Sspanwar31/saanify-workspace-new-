'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  FileText,
  AlertCircle 
} from 'lucide-react'
import { toast } from 'sonner'

interface Transaction {
  id?: string
  member: string
  date: string
  description: string
  depositAmount: number
  loanInstallment: number
  interest: number
  fine: number
  mode: 'Cash' | 'Online' | 'Calculated'
  balance: number
}

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (transaction: Transaction) => void
  editingTransaction?: Transaction | null
  members: string[]
}

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingTransaction, 
  members 
}: AddTransactionModalProps) {
  const [formData, setFormData] = useState<Transaction>({
    member: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    depositAmount: 0,
    loanInstallment: 0,
    interest: 0,
    fine: 0,
    mode: 'Cash',
    balance: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editingTransaction) {
      // Convert date from display format to input format if needed
      const convertDate = (dateStr: string) => {
        if (!dateStr) return new Date().toISOString().split('T')[0]
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
        ...editingTransaction,
        date: convertDate(editingTransaction.date)
      })
    } else {
      setFormData({
        member: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        depositAmount: 0,
        loanInstallment: 0,
        interest: 0,
        fine: 0,
        mode: 'Cash',
        balance: 0
      })
    }
    setErrors({})
  }, [editingTransaction, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.member.trim()) {
      newErrors.member = 'Member selection is required'
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Date is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters'
    }

    if (formData.depositAmount < 0) {
      newErrors.depositAmount = 'Deposit amount must be 0 or greater'
    }

    if (formData.loanInstallment < 0) {
      newErrors.loanInstallment = 'Loan installment must be 0 or greater'
    }

    if (formData.interest < 0) {
      newErrors.interest = 'Interest must be 0 or greater'
    }

    if (formData.fine < 0) {
      newErrors.fine = 'Fine must be 0 or greater'
    }

    // Check if at least one field has a value
    const hasValidAmount = formData.depositAmount > 0 || 
                          formData.loanInstallment > 0 || 
                          formData.interest > 0 || 
                          formData.fine > 0

    if (!hasValidAmount) {
      newErrors.amount = 'At least one amount field must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('⚠️ Validation Error', {
        description: 'Please fix the errors in the form',
        duration: 3000
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate balance
      const calculatedBalance = formData.depositAmount - 
                                     formData.loanInstallment - 
                                     formData.interest - 
                                     formData.fine

      const transactionData = {
        ...formData,
        balance: calculatedBalance
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSubmit(transactionData)
      onClose()
      
      toast.success('✅ Transaction Saved', {
        description: `Transaction for ${formData.member} has been saved successfully`,
        duration: 3000
      })
    } catch (error) {
      toast.error('❌ Error', {
        description: 'Failed to save transaction. Please try again.',
        duration: 3000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof Transaction, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const calculateBalance = () => {
    const balance = formData.depositAmount - 
                     formData.loanInstallment - 
                     formData.interest - 
                     formData.fine
    setFormData(prev => ({ ...prev, balance }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return <DollarSign className="h-4 w-4" />
      case 'Online':
        return <CreditCard className="h-4 w-4" />
      case 'Cheque':
        return <FileText className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </DialogTitle>
              <DialogDescription>
                {editingTransaction 
                  ? 'Update the transaction details below'
                  : 'Fill in the details to add a new transaction to the passbook'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Member */}
                <div className="space-y-2">
                  <Label htmlFor="member" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Member <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.member} 
                    onValueChange={(value) => handleInputChange('member', value)}
                  >
                    <SelectTrigger className={errors.member ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map(member => (
                        <SelectItem key={member} value={member}>{member}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.member && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.member}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={errors.date ? 'border-red-500' : ''}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="description"
                    placeholder="Monthly subscription fee, loan payment, etc."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Deposit Amount */}
                <div className="space-y-2">
                  <Label htmlFor="depositAmount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Deposit Amount (₹)
                  </Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="0"
                    value={formData.depositAmount || ''}
                    onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value) || 0)}
                    className={errors.depositAmount ? 'border-red-500' : ''}
                  />
                  {errors.depositAmount && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.depositAmount}
                    </p>
                  )}
                </div>

                {/* Loan Installment */}
                <div className="space-y-2">
                  <Label htmlFor="loanInstallment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Loan Installment (₹)
                  </Label>
                  <Input
                    id="loanInstallment"
                    type="number"
                    placeholder="0"
                    value={formData.loanInstallment || ''}
                    onChange={(e) => handleInputChange('loanInstallment', parseFloat(e.target.value) || 0)}
                    className={errors.loanInstallment ? 'border-red-500' : ''}
                  />
                  {errors.loanInstallment && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.loanInstallment}
                    </p>
                  )}
                </div>

                {/* Interest */}
                <div className="space-y-2">
                  <Label htmlFor="interest" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Interest (₹)
                  </Label>
                  <Input
                    id="interest"
                    type="number"
                    placeholder="0"
                    value={formData.interest || ''}
                    onChange={(e) => handleInputChange('interest', parseFloat(e.target.value) || 0)}
                    className={errors.interest ? 'border-red-500' : ''}
                  />
                  {errors.interest && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.interest}
                    </p>
                  )}
                </div>

                {/* Fine */}
                <div className="space-y-2">
                  <Label htmlFor="fine" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Fine (₹)
                  </Label>
                  <Input
                    id="fine"
                    type="number"
                    placeholder="0"
                    value={formData.fine || ''}
                    onChange={(e) => handleInputChange('fine', parseFloat(e.target.value) || 0)}
                    className={errors.fine ? 'border-red-500' : ''}
                  />
                  {errors.fine && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.fine}
                    </p>
                  )}
                </div>

                {/* Payment Mode */}
                <div className="space-y-2">
                  <Label htmlFor="mode" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Payment Mode
                  </Label>
                  <Select 
                    value={formData.mode} 
                    onValueChange={(value: 'Cash' | 'Online' | 'Cheque') => 
                      handleInputChange('mode', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Balance Calculation */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Balance Calculation
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Deposit:</span>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(formData.depositAmount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Deductions:</span>
                    <p className="font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(formData.loanInstallment + formData.interest + formData.fine)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Net Balance:</span>
                    <p className={`text-lg font-bold ${
                      formData.balance >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(formData.balance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Form Data Preview */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Transaction Preview
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Member:</span>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formData.member || 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Date:</span>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formData.date || 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Mode:</span>
                    <div className="mt-1">
                      <Badge variant="secondary" className="flex items-center gap-2">
                        {getModeIcon(formData.mode)}
                        {formData.mode}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Balance:</span>
                    <p className={`font-medium ${
                      formData.balance >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(formData.balance)}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingTransaction ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}