'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Phone, MapPin, Calendar, AlertCircle, CheckCircle2, Sparkles, UserPlus, Edit3, X, UserCheck, Home, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Member {
  id?: string
  name: string
  email?: string | null
  phone: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  membershipId: string
  address: string
  fatherHusbandName: string
  joinDate?: string
  lastLogin?: string | null
}

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (member: Member) => void
  editingMember?: Member | null
}

export default function AddMemberModal({ isOpen, onClose, onSubmit, editingMember }: AddMemberModalProps) {
  const [formData, setFormData] = useState<Member>({
    name: '',
    email: null,
    phone: '',
    status: 'ACTIVE',
    membershipId: '',
    address: '',
    fatherHusbandName: '',
    joinDate: new Date().toISOString().split('T')[0],
    lastLogin: null
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (editingMember) {
      setFormData(editingMember)
    } else {
      setFormData({
        name: '',
        email: null,
        phone: '',
        status: 'ACTIVE',
        membershipId: '',
        address: '',
        fatherHusbandName: '',
        joinDate: new Date().toISOString().split('T')[0],
        lastLogin: null
      })
    }
    setErrors({})
  }, [editingMember, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email is optional now since database doesn't support it
    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.membershipId.trim()) {
      newErrors.membershipId = 'Membership ID is required'
    } else if (formData.membershipId.length < 3) {
      newErrors.membershipId = 'Membership ID must be at least 3 characters'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'name':
        return <User className="h-4 w-4 text-blue-500" />
      case 'email':
        return <Mail className="h-4 w-4 text-green-500" />
      case 'phone':
        return <Phone className="h-4 w-4 text-purple-500" />
      case 'address':
        return <MapPin className="h-4 w-4 text-red-500" />
      case 'fatherHusbandName':
        return <User className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('⚠️ Validation Error', {
        description: 'Please fix errors in form',
        duration: 3000
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSubmit(formData)
      onClose()
      
      toast.success(editingMember ? '✅ Member Updated' : '✅ Member Added', {
        description: `${formData.name} has been ${editingMember ? 'updated' : 'added'} successfully`,
        duration: 3000
      })
    } catch (error) {
      toast.error('❌ Error', {
        description: 'Failed to save member. Please try again.',
        duration: 3000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof Member, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const generateMembershipId = () => {
    const prefix = 'MEM'
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setFormData(prev => ({ ...prev, membershipId: `${prefix}${randomNum}` }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 relative z-50" showCloseButton={false}>
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-8 rounded-t-lg relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12" />
                <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full" />
              </div>
              
              <DialogHeader className="text-white relative z-10">
                <DialogTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                    {editingMember ? (
                      <Edit3 className="h-7 w-7 text-white" />
                    ) : (
                      <UserPlus className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold">
                      {editingMember ? 'Edit Member Information' : 'Add New Member'}
                    </h2>
                    <p className="text-emerald-100 font-normal mt-2 text-base">
                      {editingMember 
                        ? 'Update member details and save changes'
                        : 'Enter member information to register in the society system'
                      }
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
            </div>

            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-gradient-to-b from-gray-50 to-white">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-3">
                  {['Personal', 'Contact', 'Details'].map((step, index) => {
                    const isCompleted = 
                      index === 0 ? (formData.name && formData.fatherHusbandName) :
                      index === 1 ? (formData.phone && formData.email) :
                      (formData.address && formData.membershipId);
                    
                    return (
                      <div key={step} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500 text-white shadow-lg' : 
                          index === 0 ? 'bg-gray-200 text-gray-500' :
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        {index < 2 && (
                          <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                            index === 0 && (formData.name && formData.fatherHusbandName) ? 'bg-emerald-500' :
                            index === 1 && (formData.phone && formData.email) ? 'bg-emerald-500' :
                            'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Personal Information */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                      Personal Information
                    </h3>
                    
                    {/* Name */}
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-500" />
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter member's full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`border-2 ${errors.name ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'} transition-all duration-200 h-12 rounded-xl bg-gray-50 focus:bg-white`}
                      />
                      {errors.name && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-500 flex items-center gap-1 bg-red-50 p-2 rounded-lg"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </motion.div>
                      )}
                    </div>

                    {/* Father/Husband Name */}
                    <div className="space-y-3">
                      <Label htmlFor="fatherHusbandName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        Father/Husband Name
                      </Label>
                      <Input
                        id="fatherHusbandName"
                        placeholder="Enter father or husband name"
                        value={formData.fatherHusbandName}
                        onChange={(e) => handleInputChange('fatherHusbandName', e.target.value)}
                        className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200 h-12 rounded-xl bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-emerald-600" />
                      Contact Information
                    </h3>
                    
                    {/* Phone */}
                    <div className="space-y-3 mb-4">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-purple-500" />
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`border-2 ${errors.phone ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'} transition-all duration-200 h-12 rounded-xl bg-gray-50 focus:bg-white`}
                      />
                      {errors.phone && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-500 flex items-center gap-1 bg-red-50 p-2 rounded-lg"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.phone}
                        </motion.div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-emerald-500" />
                        Email Address <span className="text-xs text-gray-400">(Optional)</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="member@example.com"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`border-2 ${errors.email ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'} transition-all duration-200 h-12 rounded-xl bg-gray-50 focus:bg-white`}
                      />
                      {errors.email && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-500 flex items-center gap-1 bg-red-50 p-2 rounded-lg"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.email}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Membership Details */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      Membership Details
                    </h3>
                    
                    {/* Membership ID */}
                    <div className="space-y-3 mb-4">
                      <Label htmlFor="membershipId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Membership ID <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          id="membershipId"
                          placeholder="MEM0001"
                          value={formData.membershipId}
                          onChange={(e) => handleInputChange('membershipId', e.target.value)}
                          className={`border-2 flex-1 ${errors.membershipId ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'} transition-all duration-200 h-12 rounded-xl bg-gray-50 focus:bg-white`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateMembershipId}
                          className="px-6 h-12 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 rounded-xl font-medium"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                      {errors.membershipId && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-500 flex items-center gap-1 bg-red-50 p-2 rounded-lg"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.membershipId}
                        </motion.div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="space-y-3 mb-4">
                      <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                        Membership Status
                      </Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'PENDING') => 
                          handleInputChange('status', value)
                        }
                      >
                        <SelectTrigger className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 h-12 rounded-xl bg-gray-50 focus:bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="INACTIVE">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 bg-gray-400 rounded-full" />
                              Inactive
                            </div>
                          </SelectItem>
                          <SelectItem value="PENDING">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 bg-yellow-400 rounded-full" />
                              Pending
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Join Date */}
                    <div className="space-y-3">
                      <Label htmlFor="joinDate" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Join Date
                      </Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => handleInputChange('joinDate', e.target.value)}
                        className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200 h-12 rounded-xl bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5 text-emerald-600" />
                  Address Information
                </h3>
                
                <div className="space-y-3">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    Complete Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter complete residential address with landmark, area, city, and pincode"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={4}
                    className={`border-2 ${errors.address ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'} transition-all duration-200 resize-none rounded-xl bg-gray-50 focus:bg-white`}
                  />
                  {errors.address && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 flex items-center gap-1 bg-red-50 p-2 rounded-lg"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.address}
                    </motion.div>
                  )}
                </div>
              </div>

              <Separator className="my-8" />

              {/* Live Preview Card */}
              <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Member Preview
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg"
                    >
                      {showPreview ? 'Hide' : 'Show'} Details
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <span className="text-gray-600 block text-xs font-medium mb-1">Name</span>
                      <p className="font-semibold text-gray-900">
                        {formData.name || 'Not provided'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <span className="text-gray-600 block text-xs font-medium mb-1">Email</span>
                      <p className="font-semibold text-gray-900 truncate">
                        {formData.email || 'Not provided'}
                      </p>
                    </div>
                    {showPreview && (
                      <>
                        <div className="bg-white p-3 rounded-lg border border-emerald-100">
                          <span className="text-gray-600 block text-xs font-medium mb-1">Phone</span>
                          <p className="font-semibold text-gray-900">
                            {formData.phone || 'Not provided'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-emerald-100">
                          <span className="text-gray-600 block text-xs font-medium mb-1">Membership ID</span>
                          <p className="font-semibold text-gray-900">
                            {formData.membershipId || 'Not provided'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-emerald-100">
                          <span className="text-gray-600 block text-xs font-medium mb-1">Father/Husband</span>
                          <p className="font-semibold text-gray-900">
                            {formData.fatherHusbandName || 'Not provided'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-emerald-100">
                          <span className="text-gray-600 block text-xs font-medium mb-1">Status</span>
                          <div className="mt-1">
                            <Badge 
                              variant={formData.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={
                                formData.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-medium' :
                                formData.status === 'INACTIVE' ? 'bg-slate-100 text-slate-800 border-slate-200 font-medium' :
                                'bg-amber-100 text-amber-800 border-amber-200 font-medium'
                              }
                            >
                              {formData.status}
                            </Badge>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {showPreview && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-emerald-100">
                      <span className="text-gray-600 block text-xs font-medium mb-1">Address</span>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formData.address || 'Not provided'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <DialogFooter className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-12 px-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                    {editingMember ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingMember ? (
                      <>
                        <Edit3 className="h-4 w-4 mr-3" />
                        Update Member
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-3" />
                        Add Member
                      </>
                    )}
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