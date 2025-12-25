'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, User, MessageSquare, Phone, MapPin, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  User as UserType, 
  validateUserForm, 
  generateUserId,
  isEmailUnique
} from '@/data/usersData'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: UserType) => void
  editingUser?: UserType | null
  existingUsers: UserType[]
}

interface UserFormData {
  name: string
  email: string
  role: 'Admin' | 'Treasurer' | 'Member'
  status: 'Active' | 'Inactive'
  phone: string
  address: string
  department: string
  employeeId: string
}

export default function AddUserModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingUser,
  existingUsers
}: AddUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'Member',
    status: 'Active',
    phone: '',
    address: '',
    department: '',
    employeeId: ''
  })
  
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or editing user changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setFormData({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          status: editingUser.status,
          phone: editingUser.phone || '',
          address: editingUser.address || '',
          department: editingUser.department || '',
          employeeId: editingUser.employeeId || ''
        })
      } else {
        setFormData({
          name: '',
          email: '',
          role: 'Member',
          status: 'Active',
          phone: '',
          address: '',
          department: '',
          employeeId: ''
        })
      }
      setErrors([])
    }
  }, [isOpen, editingUser])

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): boolean => {
    const validationErrors = validateUserForm(formData, !!editingUser)
    
    // Check email uniqueness
    if (!editingUser && !isEmailUnique(formData.email, existingUsers)) {
      validationErrors.push('A user with this email already exists')
    } else if (editingUser && !isEmailUnique(formData.email, existingUsers, editingUser.id)) {
      validationErrors.push('A user with this email already exists')
    }
    
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
      const userData: UserType = {
        id: editingUser ? editingUser.id : generateUserId(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        status: formData.status,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        department: formData.department.trim() || undefined,
        employeeId: formData.employeeId.trim() || undefined,
        joinDate: editingUser ? editingUser.joinDate : new Date().toISOString().split('T')[0],
        lastLogin: editingUser ? editingUser.lastLogin : undefined,
        createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      onSave(userData)
      
      toast.success(editingUser ? '✅ User Updated Successfully!' : '✅ User Added Successfully!', {
        description: `${userData.name} has been ${editingUser ? 'updated' : 'added'} as ${userData.role}.`,
        duration: 3000,
      })

      onClose()
    } catch (error) {
      toast.error('❌ Error', {
        description: 'Failed to save user. Please try again.',
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
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => handleInputChange('role', value)}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">👑 Admin</SelectItem>
                    <SelectItem value="Treasurer">💰 Treasurer</SelectItem>
                    <SelectItem value="Member">👤 Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    <SelectItem value="Active">🟢 Active</SelectItem>
                    <SelectItem value="Inactive">🔴 Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  Department
                </Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="Enter department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-medium">
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="EMP001"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                />
              </div>
            </div>
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
                  {editingUser ? 'Updating...' : 'Creating...'}
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {editingUser ? 'Update User' : 'Create User'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}