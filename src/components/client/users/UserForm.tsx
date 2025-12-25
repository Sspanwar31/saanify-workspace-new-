'use client'

import { useState, useEffect } from 'react'
import { User, MOCK_ROLES } from '@/lib/client/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield } from 'lucide-react'

interface UserFormProps {
  initialData?: Partial<User>
  mode: 'add' | 'edit'
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function UserForm({ 
  initialData, 
  mode, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'MEMBER' as User['role'],
    phone: '',
    department: '',
    linkedMemberId: '',
    status: 'ACTIVE' as User['status'],
    ...initialData
  })
  
  const [tempPassword, setTempPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: '',
        email: '',
        role: 'MEMBER' as User['role'],
        phone: '',
        department: '',
        linkedMemberId: '',
        status: 'ACTIVE' as User['status'],
        ...initialData
      })
    }
  }, [initialData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      await onSubmit({
        ...formData,
        linkedMemberId: formData.linkedMemberId === 'none' ? undefined : formData.linkedMemberId
      })
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const copyPassword = () => {
    const password = generatePassword()
    setTempPassword(password)
    navigator.clipboard.writeText(password)
    setTimeout(() => setTempPassword(''), 5000) // Clear after 5 seconds
  }

  const resetPassword = () => {
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
    alert(`New temporary password: ${newPassword}\n\nIn a real application, this would be sent to the user's email.`)
  }

  const currentRole = MOCK_ROLES.find(r => r.id === formData.role)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center pb-2 border-b">
        <h2 className="text-lg font-bold text-gray-900">
          {mode === 'add' ? 'Add New User' : 'Edit User'}
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          {mode === 'add' 
            ? 'Create a new user account' 
            : 'Update user information'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <ScrollArea className="max-h-[45vh] px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            {/* LEFT COLUMN */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter user's full name"
                  className={`h-9 text-sm ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                  className={`h-9 text-sm ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="role" className="text-xs font-medium">Role *</Label>
                <Select value={formData.role} onValueChange={(value: User['role']) => handleInputChange('role', value)}>
                  <SelectTrigger className={`h-9 text-sm ${errors.role ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <span className={`${role.color.replace('text-', 'bg-').replace('800', '100')} px-2 py-0.5 rounded text-xs`}>
                            {role.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-xs text-red-500">{errors.role}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="department" className="text-xs font-medium">Department</Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., Finance, Operations"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="linkedMemberId" className="text-xs font-medium">Link Member (Optional)</Label>
                <Select value={formData.linkedMemberId} onValueChange={(value) => handleInputChange('linkedMemberId', value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select member to link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No member linked</SelectItem>
                    <SelectItem value="M001">Rajesh Kumar (M001)</SelectItem>
                    <SelectItem value="M002">Priya Sharma (M002)</SelectItem>
                    <SelectItem value="M003">Mohammed Ali (M003)</SelectItem>
                    <SelectItem value="M004">Anjali Patel (M004)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* TOGGLE & PASSWORD SECTION */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="status"
                checked={formData.status === 'ACTIVE'}
                onCheckedChange={(checked) => handleInputChange('status', checked ? 'ACTIVE' : 'BLOCKED')}
              />
              <Label htmlFor="status" className="text-sm font-medium">Active User</Label>
            </div>
          </div>

          {/* Password Generation - Only for Add Mode */}
          {mode === 'add' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Temporary Password</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={tempPassword || generatePassword()}
                  readOnly
                  placeholder="Click generate to create password"
                  className="font-mono text-xs h-8"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyPassword}
                  size="sm"
                  className="h-8 text-xs"
                >
                  {tempPassword ? 'Copied!' : 'Generate & Copy'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                User will need to change password on first login
              </p>
            </div>
          )}

          {/* Password Reset - Only for Edit Mode */}
          {mode === 'edit' && initialData && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Password Management</Label>
              <Button
                type="button"
                variant="outline"
                onClick={resetPassword}
                className="w-full"
                size="sm"
              >
                Reset Password
              </Button>
              <p className="text-xs text-gray-500">
                New temporary password will be sent to user's email
              </p>
            </div>
          )}
        </div>

        {/* User Information - Only for Edit Mode - Compact Version */}
        {mode === 'edit' && initialData && (
          <div className="border-t pt-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* User ID Card */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xs">ID</span>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">User ID</Label>
                      <p className="font-mono text-xs font-bold text-gray-900">{initialData.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Created Date Card */}
              <Card>
                <CardContent className="p-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Created On</Label>
                    <p className="text-xs text-gray-900 font-medium">
                      {initialData.createdAt ? new Date(initialData.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Last Login Card */}
              <Card>
                <CardContent className="p-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Last Login</Label>
                    <p className="text-xs text-gray-900 font-medium">
                      {initialData.lastLogin && initialData.lastLogin !== 'Invalid Date' 
                        ? new Date(initialData.lastLogin).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          })
                        : 'Never'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Role Information - Compact */}
            {currentRole && (
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="w-3 h-3 text-green-600" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Role</Label>
                        <p className="font-semibold text-sm text-gray-900">{currentRole.name}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Permissions</Label>
                      <div className="flex flex-wrap gap-1">
                        {currentRole.permissions.slice(0, 3).map(permission => (
                          <div key={permission} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            {permission.replace('_', ' ').toLowerCase()}
                          </div>
                        ))}
                        {currentRole.permissions.length > 3 && (
                          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                            +{currentRole.permissions.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting 
              ? (mode === 'add' ? 'Creating...' : 'Updating...') 
              : (mode === 'add' ? '+ Add User' : 'Update User')
            }
          </Button>
        </div>
      </form>
    </div>
  )
}