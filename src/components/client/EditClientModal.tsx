'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, User, Mail, Phone, CreditCard, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  adminName: string
  email: string
  phone?: string
  subscriptionPlan: string
  status: string
  trialEndsAt?: string
  subscriptionEndsAt?: string
}

interface EditClientModalProps {
  client: Client | null
  onClose: () => void
  onSuccess: () => void
}

export function EditClientModal({ client, onClose, onSuccess }: EditClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    societyName: '',
    adminName: '',
    email: '',
    phone: '',
    subscriptionType: 'TRIAL',
    trialPeriod: '15'
  })

  useEffect(() => {
    if (client) {
      setFormData({
        societyName: client.name,
        adminName: client.adminName,
        email: client.email,
        phone: client.phone || '',
        subscriptionType: client.subscriptionPlan,
        trialPeriod: '15'
      })
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return
    
    setLoading(true)

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Client updated successfully!')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update client')
      }
    } catch (error) {
      toast.error('An error occurred while updating client')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!client) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="societyName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500" />
              Society Name
            </Label>
            <Input
              id="societyName"
              placeholder="Enter society name"
              value={formData.societyName}
              onChange={(e) => handleInputChange('societyName', e.target.value)}
              required
              className="focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminName" className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              Admin Name
            </Label>
            <Input
              id="adminName"
              placeholder="Enter admin name"
              value={formData.adminName}
              onChange={(e) => handleInputChange('adminName', e.target.value)}
              required
              className="focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              Admin Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@society.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500" />
              Phone Number
            </Label>
            <Input
              id="phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscriptionType" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-500" />
              Subscription Type
            </Label>
            <Select
              value={formData.subscriptionType}
              onValueChange={(value) => handleInputChange('subscriptionType', value)}
            >
              <SelectTrigger className="focus:ring-2 focus:ring-sky-500">
                <SelectValue placeholder="Select subscription type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="BASIC">Basic</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.subscriptionType === 'TRIAL' && (
            <div className="space-y-2">
              <Label htmlFor="trialPeriod" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                Trial Period (days)
              </Label>
              <Select
                value={formData.trialPeriod}
                onValueChange={(value) => handleInputChange('trialPeriod', value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-sky-500">
                  <SelectValue placeholder="Select trial period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="15">15 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </div>
            ) : (
              'Update Client'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}