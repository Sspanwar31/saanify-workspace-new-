'use client'

import { useState } from 'react'
import { User } from '@/lib/super-client/store'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import UserForm from './UserForm'

interface AddUserModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real app, this would call the API
      const userData = {
        ...formData,
        linkedMemberId: formData.linkedMemberId === 'none' ? undefined : formData.linkedMemberId
      }
      console.log('Creating user:', userData)
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Add New User</DialogTitle>
      </DialogHeader>
      <UserForm
        mode="add"
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </DialogContent>
  )
}