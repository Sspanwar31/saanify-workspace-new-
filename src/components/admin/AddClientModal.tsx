'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, User, Mail, Phone, MapPin, Plus, X, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { makeAuthenticatedRequest } from '@/lib/auth'

interface AddClientModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AddClientModal({ onClose, onSuccess }: AddClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    adminName: '',
    email: '',
    phone: '',
    address: '',
    subscriptionPlan: 'TRIAL'
  })

  const [emailError, setEmailError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name || !formData.adminName || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    if (emailError) {
      toast.error('Please fix email validation errors')
      return
    }

    setLoading(true)

    try {
      const submissionData = {
        name: formData.name,
        adminName: formData.adminName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        plan: formData.subscriptionPlan
      }

      const response = await makeAuthenticatedRequest('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Client added successfully!', {
          description: `Society: ${formData.name}`,
          duration: 4000,
        })
        onSuccess()
      } else {
        const error = await response.json()
        if (error.error && error.error.includes('already exists')) {
          setEmailError('This email is already registered')
        }
        toast.error(error.message || 'Failed to add client')
      }
    } catch (error) {
      toast.error('An error occurred while adding client')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear email error when email changes
    if (field === 'email') {
      setEmailError('')
    }
  }

  const handleEmailBlur = () => {
    if (formData.email && !formData.email.includes('@')) {
      setEmailError('Please enter a valid email address')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-blue-500" />
            Add New Client
          </CardTitle>
          <CardDescription>
            Enter client details to create a new society account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Society Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Enter society name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-blue-500 border-blue-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminName" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Admin Name *
                </Label>
                <Input
                  id="adminName"
                  placeholder="Enter admin name"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-blue-500 border-blue-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Admin Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@society.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={handleEmailBlur}
                required
                className={`focus:ring-2 focus:ring-blue-500 border-blue-200 ${
                  emailError ? 'border-red-500' : ''
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-500" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500 border-blue-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Subscription Plan
                </Label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value) => handleInputChange('subscriptionPlan', value)}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500 border-blue-200">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                    <SelectItem value="PRO">Professional</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                Address
              </Label>
              <Textarea
                id="address"
                placeholder="Enter society address..."
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="focus:ring-2 focus:ring-blue-500 border-blue-200 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}