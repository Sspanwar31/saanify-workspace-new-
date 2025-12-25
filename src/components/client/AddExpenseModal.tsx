'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, DollarSign, Calendar, CreditCard, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Expense as ExpenseType, 
  validateExpenseForm, 
  generateExpenseId
} from '@/data/expensesData'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (expense: ExpenseType) => void
  editingExpense?: ExpenseType | null
}

interface ExpenseFormData {
  date: string
  category: 'Maintenance' | 'Repair' | 'Event' | 'Salary' | 'Utilities' | 'Other'
  amount: string
  mode: 'Cash' | 'Online' | 'Cheque'
  description: string
}

export default function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingExpense
}: AddExpenseModalProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    category: 'Maintenance',
    amount: '',
    mode: 'Cash',
    description: ''
  })
  
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or editing expense changes
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
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
          date: convertDate(editingExpense.date),
          category: editingExpense.category,
          amount: editingExpense.amount.toString(),
          mode: editingExpense.mode,
          description: editingExpense.description
        })
      } else {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: 'Maintenance',
          amount: '',
          mode: 'Cash',
          description: ''
        })
      }
      setErrors([])
    }
  }, [isOpen, editingExpense])

  const handleInputChange = (field: keyof ExpenseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): boolean => {
    const validationErrors = validateExpenseForm({
      ...formData,
      amount: parseFloat(formData.amount) || 0
    }, !!editingExpense)
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      validationErrors.forEach(error => {
        toast.error('❌ Validation Error', {
          description: error,
          duration: 3000,
        })
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
      const expenseData: ExpenseType = {
        id: editingExpense ? editingExpense.id : generateExpenseId(),
        date: formData.date,
        category: formData.category,
        amount: parseFloat(formData.amount),
        mode: formData.mode,
        description: formData.description.trim(),
        addedBy: 'Admin', // Mock logged-in user
        createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      onSave(expenseData)
      
      toast.success(editingExpense ? '✅ Expense Updated Successfully!' : '✅ Expense Added Successfully!', {
        description: `${formData.category} expense of ₹${formData.amount} has been ${editingExpense ? 'updated' : 'added'}.`,
        duration: 3000,
      })

      onClose()
    } catch (error) {
      toast.error('❌ Error', {
        description: 'Failed to save expense. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogDescription>
            {editingExpense ? 'Update the expense details below' : 'Fill in the details to record a new expense transaction'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Expense Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maintenance">🔧 Maintenance</SelectItem>
                    <SelectItem value="Repair">🔨 Repair</SelectItem>
                    <SelectItem value="Event">🎉 Event</SelectItem>
                    <SelectItem value="Salary">💰 Salary</SelectItem>
                    <SelectItem value="Utilities">⚡ Utilities</SelectItem>
                    <SelectItem value="Other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount (₹) *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode" className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Mode *
                </Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value: any) => handleInputChange('mode', value)}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">💵 Cash</SelectItem>
                    <SelectItem value="Online">🌐 Online</SelectItem>
                    <SelectItem value="Cheque">📄 Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Enter expense description..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 resize-none"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <div className="font-medium mb-1">Please fix the following errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </div>
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
                  {editingExpense ? 'Updating...' : 'Creating...'}
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}