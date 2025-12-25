'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MoreHorizontal, 
  Eye, 
  Lock, 
  Unlock, 
  Trash2,
  Calendar,
  CreditCard,
  Edit,
  RefreshCw,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Building,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  adminName: string
  email: string
  phone: string
  address?: string
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'LOCKED'
  subscriptionPlan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  trialEndsAt?: string
  subscriptionEndsAt?: string
  createdAt: string
}

interface EnhancedActionsDropdownProps {
  client: Client
  onAction: (action: string, clientId: string) => void
  onDelete: (clientId: string) => void
  onRenew: (clientId: string, plan: string) => void
}

export function EnhancedActionsDropdown({ 
  client, 
  onAction, 
  onDelete,
  onRenew 
}: EnhancedActionsDropdownProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: string
    title: string
    description: string
    icon: React.ReactNode
    variant: 'default' | 'destructive'
  } | null>(null)
  
  const [renewDialog, setRenewDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    name: client.name,
    adminName: client.adminName,
    email: client.email,
    phone: client.phone || '',
    address: client.address || '',
    subscriptionPlan: client.subscriptionPlan,
    status: client.status
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleAction = (action: string) => {
    const actionConfigs = {
      lock: {
        title: 'Lock Account',
        description: `Are you sure you want to lock ${client.name}? This will prevent them from accessing their account.`,
        icon: <Lock className="h-5 w-5 text-amber-600" />,
        variant: 'default' as const
      },
      unlock: {
        title: 'Unlock Account',
        description: `Are you sure you want to unlock ${client.name}? They will regain access to their account.`,
        icon: <Unlock className="h-5 w-5 text-emerald-600" />,
        variant: 'default' as const
      },
      delete: {
        title: 'Delete Client',
        description: `Are you sure you want to delete ${client.name}? This action cannot be undone and all data will be permanently lost.`,
        icon: <Trash2 className="h-5 w-5 text-red-600" />,
        variant: 'destructive' as const
      },
      expire: {
        title: 'Mark as Expired',
        description: `Are you sure you want to mark ${client.name} as expired? Their subscription will be terminated immediately.`,
        icon: <Calendar className="h-5 w-5 text-red-600" />,
        variant: 'default' as const
      }
    }

    const config = actionConfigs[action as keyof typeof actionConfigs]
    if (config) {
      setConfirmDialog({
        open: true,
        action,
        title: config.title,
        description: config.description,
        icon: config.icon,
        variant: config.variant
      })
    } else {
      onAction(action, client.id)
    }
  }

  const confirmAction = () => {
    if (confirmDialog) {
      if (confirmDialog.action === 'delete') {
        onDelete(client.id)
      } else {
        onAction(confirmDialog.action, client.id)
      }
      setConfirmDialog(null)
      toast.success(`${confirmDialog.title} completed successfully`, {
        description: `${client.name} has been ${confirmDialog.action.toLowerCase()}ed.`
      })
    }
  }

  const handleRenewal = (plan: string) => {
    onRenew(client.id, plan)
    setRenewDialog(false)
    toast.success('Subscription renewed successfully', {
      description: `${client.name} has been renewed to ${plan} plan.`
    })
  }

  const handleViewDetails = () => {
    router.push(`/admin/clients/${client.id}`)
  }

  const handleEditSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'edit',
          ...editForm 
        })
      })

      if (response.ok) {
        toast.success('Client updated successfully', {
          description: `${editForm.name} has been updated.`
        })
        setEditDialog(false)
        onAction('refresh', client.id) // Trigger refresh
      } else {
        toast.error('Failed to update client')
      }
    } catch (error) {
      toast.error('An error occurred while updating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPlanDuration = (plan: string) => {
    const durations = {
      BASIC: '1 month',
      PRO: '3 months',
      ENTERPRISE: '12 months'
    }
    return durations[plan as keyof typeof durations] || '1 month'
  }

  const getPlanPrice = (plan: string) => {
    const prices = {
      BASIC: '$99',
      PRO: '$299',
      ENTERPRISE: '$999'
    }
    return prices[plan as keyof typeof prices] || '$0'
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-56"
          sideOffset={5}
        >
          <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4 text-blue-600" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setEditDialog(true)} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4 text-slate-600" />
            Edit
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {client.status === 'ACTIVE' ? (
            <DropdownMenuItem onClick={() => handleAction('lock')} className="cursor-pointer">
              <Lock className="mr-2 h-4 w-4 text-amber-600" />
              Lock Account
            </DropdownMenuItem>
          ) : client.status === 'LOCKED' ? (
            <DropdownMenuItem onClick={() => handleAction('unlock')} className="cursor-pointer">
              <Unlock className="mr-2 h-4 w-4 text-emerald-600" />
              Unlock Account
            </DropdownMenuItem>
          ) : null}
          
          <DropdownMenuItem onClick={() => setRenewDialog(true)} className="cursor-pointer">
            <RefreshCw className="mr-2 h-4 w-4 text-purple-600" />
            Renew
          </DropdownMenuItem>
          
          {client.status === 'ACTIVE' && (
            <DropdownMenuItem onClick={() => handleAction('expire')} className="cursor-pointer">
              <Calendar className="mr-2 h-4 w-4 text-red-600" />
              Mark as Expired
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => handleAction('delete')} 
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog(null)}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    {confirmDialog.icon}
                    {confirmDialog.title}
                  </DialogTitle>
                  <DialogDescription>
                    {confirmDialog.description}
                  </DialogDescription>
                </DialogHeader>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDialog(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={confirmDialog.variant}
                    onClick={confirmAction}
                    className={confirmDialog.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    {confirmDialog.title}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Renewal Dialog */}
      <AnimatePresence>
        {renewDialog && (
          <Dialog open={renewDialog} onOpenChange={setRenewDialog}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                    Renew Subscription
                  </DialogTitle>
                  <DialogDescription>
                    Choose a new subscription plan for {client.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {['BASIC', 'PRO', 'ENTERPRISE'].map((plan) => (
                    <motion.div
                      key={plan}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        onClick={() => handleRenewal(plan)}
                        className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {plan}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {getPlanDuration(plan)} • {getPlanPrice(plan)}/month
                            </div>
                          </div>
                          <Badge variant="outline" className="text-purple-600 border-purple-600">
                            {getPlanPrice(plan)}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRenewDialog(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editDialog && (
          <Dialog open={editDialog} onOpenChange={setEditDialog}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Edit className="h-5 w-5 text-blue-600" />
                    Edit Client
                  </DialogTitle>
                  <DialogDescription>
                    Update the information for {client.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Society Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Society Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Society Name</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="pl-10"
                            placeholder="Society name"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Admin Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="adminName"
                            value={editForm.adminName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, adminName: e.target.value }))}
                            className="pl-10"
                            placeholder="Admin name"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="pl-10"
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={editForm.address}
                          onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="123 Main St, City, State"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Subscription Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Subscription Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                        <Select
                          value={editForm.subscriptionPlan}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, subscriptionPlan: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRIAL">Trial</SelectItem>
                            <SelectItem value="BASIC">Basic</SelectItem>
                            <SelectItem value="PRO">Pro</SelectItem>
                            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(value: any) => setEditForm(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRIAL">Trial</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                            <SelectItem value="LOCKED">Locked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditDialog(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}