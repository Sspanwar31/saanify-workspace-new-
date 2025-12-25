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
  Settings,
  UserCheck,
  Ban,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
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

interface Client {
  id: string
  name: string
  adminName: string
  email: string
  phone: string
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'LOCKED'
  subscriptionPlan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  trialEndsAt?: string
  subscriptionEndsAt?: string
  createdAt: string
}

interface ActionsDropdownProps {
  client: Client
  onAction: (action: string, clientId: string) => void
  onDelete: (clientId: string) => void
}

export function ActionsDropdown({ client, onAction, onDelete }: ActionsDropdownProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: string
    title: string
    description: string
    icon: React.ReactNode
    variant: 'default' | 'destructive'
  } | null>(null)

  const [renewDialog, setRenewDialog] = useState(false)

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
    onAction(`renew_${plan.toLowerCase()}`, client.id)
    setRenewDialog(false)
    toast.success('Subscription renewed successfully', {
      description: `${client.name} has been renewed to ${plan} plan.`
    })
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
          <Button variant="outline" size="sm" className="h-8 px-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700">
            <Settings className="h-4 w-4 mr-1" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Client Management
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleAction('view')} className="cursor-pointer py-2">
            <Eye className="mr-3 h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium">View Details</div>
              <div className="text-xs text-slate-500">See complete client information</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction('edit')} className="cursor-pointer py-2">
            <Edit className="mr-3 h-4 w-4 text-slate-600" />
            <div className="flex-1">
              <div className="font-medium">Edit Client</div>
              <div className="text-xs text-slate-500">Update client details</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleAction('send_email')} className="cursor-pointer py-2">
            <Mail className="mr-3 h-4 w-4 text-green-600" />
            <div className="flex-1">
              <div className="font-medium">Send Email</div>
              <div className="text-xs text-slate-500">Contact client directly</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {client.status === 'ACTIVE' ? (
            <DropdownMenuItem onClick={() => handleAction('lock')} className="cursor-pointer py-2">
              <Lock className="mr-3 h-4 w-4 text-amber-600" />
              <div className="flex-1">
                <div className="font-medium">Lock Account</div>
                <div className="text-xs text-slate-500">Suspend client access</div>
              </div>
            </DropdownMenuItem>
          ) : client.status === 'LOCKED' ? (
            <DropdownMenuItem onClick={() => handleAction('unlock')} className="cursor-pointer py-2">
              <Unlock className="mr-3 h-4 w-4 text-emerald-600" />
              <div className="flex-1">
                <div className="font-medium">Unlock Account</div>
                <div className="text-xs text-slate-500">Restore client access</div>
              </div>
            </DropdownMenuItem>
          ) : null}
          
          <DropdownMenuItem onClick={() => setRenewDialog(true)} className="cursor-pointer py-2">
            <RefreshCw className="mr-3 h-4 w-4 text-purple-600" />
            <div className="flex-1">
              <div className="font-medium">Renew Subscription</div>
              <div className="text-xs text-slate-500">Extend client subscription</div>
            </div>
          </DropdownMenuItem>
          
          {client.status === 'ACTIVE' && (
            <DropdownMenuItem onClick={() => handleAction('expire')} className="cursor-pointer py-2">
              <Calendar className="mr-3 h-4 w-4 text-red-600" />
              <div className="flex-1">
                <div className="font-medium">Mark as Expired</div>
                <div className="text-xs text-slate-500">End subscription immediately</div>
              </div>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => handleAction('delete')} 
            className="cursor-pointer py-2 text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-3 h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Delete Client</div>
              <div className="text-xs text-red-500">This action cannot be undone</div>
            </div>
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
    </>
  )
}