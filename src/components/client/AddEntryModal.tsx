'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  DollarSign, 
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  RefreshCw,
  Plus,
  TrendingUp,
  Shield,
  PieChart,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { 
  PassbookEntry as PassbookEntryType, 
  validatePassbookForm, 
  generatePassbookId
} from '@/data/passbookData'

interface AddEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: PassbookEntryType) => void
  editingEntry?: PassbookEntryType | null
  existingEntries: PassbookEntryType[]
}

interface EntryFormData {
  memberId: string
  depositAmount: string
  loanInstallment: string
  interestRate: string
  fine: string
  mode: 'Cash' | 'Online' | 'Cheque'
  description: string
}

export default function AddEntryModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingEntry,
  existingEntries
}: AddEntryModalProps) {
  const [formData, setFormData] = useState<EntryFormData>({
    memberId: '',
    depositAmount: '',
    loanInstallment: '',
    interestRate: '8.5',
    fine: '',
    mode: 'Cash',
    description: ''
  })
  
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or editing entry changes
  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        setFormData({
          memberId: editingEntry.memberId,
          depositAmount: editingEntry.depositAmount.toString(),
          loanInstallment: editingEntry.loanInstallment.toString(),
          interestRate: editingEntry.interestRate,
          fine: editingEntry.fine.toString(),
          mode: editingEntry.mode,
          description: editingEntry.description
        })
      } else {
        setFormData({
          memberId: '',
          depositAmount: '',
          loanInstallment: '',
          interestRate: '8.5',
          fine: '',
          mode: 'Cash',
          description: ''
        })
      }
      setErrors([])
    }
  }, [isOpen, editingEntry])

  const handleInputChange = (field: keyof EntryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): boolean => {
    const validationErrors = validatePassbookForm(formData, !!editingEntry)
    
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
      const entryData: PassbookEntryType = {
        id: editingEntry ? editingEntry.id : generatePassbookId(),
        memberId: formData.memberId,
        date: formData.date,
        depositAmount: parseFloat(formData.depositAmount),
        loanInstallment: parseFloat(formData.loanInstallment),
        interestRate: parseFloat(formData.interestRate),
        fine: parseFloat(formData.fine),
        mode: formData.mode as 'Cash' | 'Online' | 'Cheque',
        description: formData.description.trim(),
        addedBy: 'Admin',
        createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      onSave(entryData)
      
      if (editingEntry) {
        // Update existing entry
        setPassbook(prev => prev.map(entry => 
          entry.id === entryData.id ? entryData : entry
        ))
        toast.success('✅ Entry Updated Successfully!', {
          description: `${entryData.memberName}'s passbook entry has been updated.`,
          duration: 3000,
        })
      } else {
        // Add new entry
        setPassbook(prev => [...prev, entryData])
        toast.success('✅ Entry Added Successfully!', {
          description: `${entryData.memberName}'s passbook entry of ₹${entryData.depositAmount} has been added.`,
          duration: 3000,
        })
      }
      
      // Update stats
      const updatedPassbook = editingEntry 
        ? passbook.map(entry => entry.id === entryData.id ? entryData : entry)
        : [...passbook, entryData]
      setStats(getPassbookStats(updatedPassbook))
      
      setIsModalOpen(false)
      setEditingEntry(null)
    } catch (error) {
      toast.error('❌ Error', {
        description: 'Failed to save entry. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Passbook Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track all member transactions and passbook entries efficiently
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={handleAddEntry}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-xl bg-white/80 dark:bg-black/40 backdrop-blur-xl">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 mb-4" />
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-8 w-8 text-emerald-100" />
                  <Badge className="bg-emerald-400 text-emerald-900">
                    Total
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ₹{stats.totalDeposits.toLocaleString('en-IN')}
                </div>
                <div className="text-emerald-100 text-sm">
                  Total Deposits
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="h-8 w-8 text-blue-100" />
                  <Badge className="bg-blue-400 text-blue-900">
                    This Month
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ₹{stats.thisMonthDeposits.toLocaleString('en-IN')}
                </div>
                <div className="text-blue-100 text-sm">
                  Monthly Deposits
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-100" />
                  <Badge className="bg-purple-400 text-purple-900">
                    Total Interest
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ₹{stats.totalInterest.toLocaleString('en-IN')}
                </div>
                <div className="text-purple-100 text-sm">
                  Total Interest
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-8 w-8 text-teal-100" />
                  <Badge className="bg-amber-400 text-amber-900">
                    Fines
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ₹{stats.totalFine.toLocaleString('en-IN')}
                </div>
                <div className="text-amber-100 text-sm">
                  Total Fines
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <PieChart className="h-8 w-8 text-teal-100" />
                  <Badge className="bg-teal-400 text-teal-900">
                    Categories
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {stats.paymentModeBreakdown.Cash}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </motion.div>

      {/* Add/Edit Entry Modal */}
      <AddEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
        existingEntries={passbook}
      />
    </motion.div>
  )
}