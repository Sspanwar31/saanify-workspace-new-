'use client'

import { motion } from 'framer-motion'
import { 
  MoreHorizontal, 
  Eye, 
  Lock, 
  Unlock, 
  Trash2,
  Calendar,
  CreditCard,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ActionsDropdown } from './ActionsDropdown'
import { cn } from '@/lib/utils'

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

interface ClientsTableProps {
  clients: Client[]
  onAction: (action: string, clientId: string) => void
  onDelete: (clientId: string) => void
  showRevenue?: boolean
}

export function ClientsTable({ clients, onAction, onDelete, showRevenue = false }: ClientsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      TRIAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200',
      ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200',
      EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200',
      LOCKED: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border-slate-200'
    }
    
    return (
      <Badge className={cn(variants[status as keyof typeof variants] || variants.TRIAL, 'font-medium')}>
        {status}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const variants = {
      TRIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200',
      BASIC: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200',
      PRO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border-indigo-200',
      ENTERPRISE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300 border-teal-200'
    }
    
    return (
      <Badge className={cn(variants[plan as keyof typeof variants] || variants.TRIAL, 'font-medium')}>
        {plan}
      </Badge>
    )
  }

  const getTrialDaysLeft = (trialEndsAt?: string) => {
    if (!trialEndsAt) return null
    
    const trialEnd = new Date(trialEndsAt)
    const today = new Date()
    const diffTime = trialEnd.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return null
    return { days: diffDays, percentage: Math.max(0, Math.min(100, (diffDays / 30) * 100)) }
  }

  const getSubscriptionDaysLeft = (subscriptionEndsAt?: string) => {
    if (!subscriptionEndsAt) return null
    
    const subEnd = new Date(subscriptionEndsAt)
    const today = new Date()
    const diffTime = subEnd.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return null
    return { days: diffDays, percentage: Math.max(0, Math.min(100, (diffDays / 365) * 100)) }
  }

  const getClientRevenue = (plan: string) => {
    const planPrices = {
      TRIAL: 0,
      BASIC: 99,
      PRO: 299,
      ENTERPRISE: 999
    }
    return planPrices[plan as keyof typeof planPrices] || 0
  }

  const getProgressColor = (percentage: number, status: string) => {
    if (status === 'EXPIRED' || status === 'LOCKED') return 'bg-slate-300'
    if (percentage > 60) return 'bg-emerald-500'
    if (percentage > 30) return 'bg-amber-500'
    return 'bg-red-500'
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-slate-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No clients found</h3>
          <p className="text-slate-500 dark:text-slate-400">Get started by adding your first client.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700">
            <TableHead className="font-semibold">Society Name</TableHead>
            <TableHead className="font-semibold">Admin Email</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Subscription Plan</TableHead>
            <TableHead className="font-semibold">Plan Timeline</TableHead>
            <TableHead className="font-semibold">Days Remaining</TableHead>
            {showRevenue && <TableHead className="font-semibold">Revenue</TableHead>}
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, index) => {
            const trialInfo = getTrialDaysLeft(client.trialEndsAt)
            const subscriptionInfo = getSubscriptionDaysLeft(client.subscriptionEndsAt)
            const revenue = getClientRevenue(client.subscriptionPlan)
            
            return (
            <motion.tr
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <TableCell>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {client.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {client.adminName}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-slate-900 dark:text-white">{client.email}</div>
              </TableCell>
              <TableCell>
                {getStatusBadge(client.status)}
              </TableCell>
              <TableCell>
                {getPlanBadge(client.subscriptionPlan)}
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  {client.status === 'TRIAL' && client.trialEndsAt ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Trial: {new Date(client.trialEndsAt).toLocaleDateString()}
                        </span>
                      </div>
                      {trialInfo && (
                        <>
                          <Progress 
                            value={trialInfo.percentage} 
                            className="h-2"
                            indicatorClassName={getProgressColor(trialInfo.percentage, client.status)}
                          />
                          <div className="text-xs text-slate-500">
                            {trialInfo.days} days left
                          </div>
                        </>
                      )}
                    </div>
                  ) : client.subscriptionEndsAt ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Active: {new Date(client.subscriptionEndsAt).toLocaleDateString()}
                        </span>
                      </div>
                      {subscriptionInfo && (
                        <>
                          <Progress 
                            value={subscriptionInfo.percentage} 
                            className="h-2"
                            indicatorClassName={getProgressColor(subscriptionInfo.percentage, client.status)}
                          />
                          <div className="text-xs text-slate-500">
                            {subscriptionInfo.days} days left
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <AlertCircle className="h-3 w-3" />
                      <span>No subscription</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {client.status === 'TRIAL' && trialInfo ? (
                    <span className={cn(
                      "text-sm font-medium px-2 py-1 rounded-full",
                      trialInfo.days <= 7 
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                    )}>
                      {trialInfo.days} days
                    </span>
                  ) : subscriptionInfo ? (
                    <span className={cn(
                      "text-sm font-medium px-2 py-1 rounded-full",
                      subscriptionInfo.days <= 30 
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        : subscriptionInfo.days <= 90 
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                    )}>
                      {subscriptionInfo.days} days
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </div>
              </TableCell>
              {showRevenue && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ${revenue}/mo
                    </span>
                  </div>
                </TableCell>
              )}
              <TableCell className="text-right">
                <ActionsDropdown 
                  client={client} 
                  onAction={onAction} 
                  onDelete={onDelete}
                />
              </TableCell>
            </motion.tr>
          )})}
        </TableBody>
      </Table>
    </div>
  )
}