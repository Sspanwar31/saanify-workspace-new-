'use client'

import { useState } from 'react'
import { User } from '@/lib/super-client/store'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import UserForm from './UserForm'

interface EditUserModalProps {
  user: User
  onClose: () => void
  onSuccess: () => void
}

export default function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real app, this would call the API
      const userData = {
        id: user.id,
        ...formData
      }
      console.log('Updating user:', userData)
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
      </DialogHeader>
      <UserForm
        initialData={user}
        mode="edit"
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </DialogContent>
  )
}