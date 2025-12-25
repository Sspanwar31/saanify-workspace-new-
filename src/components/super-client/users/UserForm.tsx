'use client'

import { useState, useEffect } from 'react'
import { User, MOCK_ROLES } from '@/lib/super-client/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <ScrollArea className="max-h-[60vh] pr-4">
        <div className="grid grid-cols-2 gap-6 py-4">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter user's full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="user@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: User['role']) => handleInputChange('role', value)}>
                <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ROLES.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <span className={role.color.replace('text-', 'bg-').replace('800', '100') + ' px-2 py-1 rounded text-xs'}>
                          {role.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="e.g., Finance, Operations, IT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedMemberId">Link Member (Optional)</Label>
              <Select value={formData.linkedMemberId} onValueChange={(value) => handleInputChange('linkedMemberId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member to link (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No member linked</SelectItem>
                  {/* In a real app, this would be populated with actual members */}
                  <SelectItem value="M001">Rajesh Kumar (M001)</SelectItem>
                  <SelectItem value="M002">Priya Sharma (M002)</SelectItem>
                  <SelectItem value="M003">Mohammed Ali (M003)</SelectItem>
                  <SelectItem value="M004">Anjali Patel (M004)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BOTTOM: TOGGLE & PASSWORD */}
          <div className="col-span-2 space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="status"
                  checked={formData.status === 'ACTIVE'}
                  onCheckedChange={(checked) => handleInputChange('status', checked ? 'ACTIVE' : 'BLOCKED')}
                />
                <Label htmlFor="status">Active User</Label>
              </div>
            </div>

            {/* Password Generation - Only for Add Mode */}
            {mode === 'add' && (
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tempPassword || generatePassword()}
                    readOnly
                    placeholder="Click generate to create password"
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyPassword}
                  >
                    {tempPassword ? 'Copied!' : 'Generate & Copy'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  A temporary password will be generated. The user will be required to change it on first login.
                </p>
              </div>
            )}

            {/* Password Reset - Only for Edit Mode */}
            {mode === 'edit' && initialData && (
              <div className="space-y-2">
                <Label>Password Management</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetPassword}
                  className="w-full"
                >
                  Reset Password
                </Button>
                <p className="text-xs text-gray-500">
                  This will generate a new temporary password and send it to the user's email.
                </p>
              </div>
            )}
          </div>

          {/* User Information - Only for Edit Mode */}
          {mode === 'edit' && initialData && (
            <div className="col-span-2 space-y-4 border-t pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">User ID</Label>
                      <Badge variant="outline">{initialData.id}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Created On</Label>
                      <span className="text-sm text-gray-600">
                        {new Date(initialData.createdAt || '').toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Last Login</Label>
                      <span className="text-sm text-gray-600">
                        {new Date(initialData.lastLogin || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Information */}
              {currentRole && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Label>Role Permissions</Label>
                      <div className="space-y-1">
                        {currentRole.permissions.map(permission => (
                          <div key={permission} className="text-sm text-gray-600 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {permission.replace('_', ' ').toLowerCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting 
            ? (mode === 'add' ? 'Creating User...' : 'Updating User...') 
            : (mode === 'add' ? '+ Add User' : 'Update User')
          }
        </Button>
      </div>
    </form>
  )
}