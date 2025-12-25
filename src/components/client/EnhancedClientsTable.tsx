'use client'

import { motion } from 'framer-motion'
import { 
  Eye, 
  Lock, 
  Unlock, 
  Trash2,
  Calendar,
  CreditCard,
  Clock,
  TrendingUp,
  AlertTriangle,
  Edit,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EnhancedActionsDropdown } from './EnhancedActionsDropdown'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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
  startDate?: string
  expiryDate?: string
}

interface EnhancedClientsTableProps {
  clients: Client[]
  onAction: (action: string, clientId: string) => void
  onDelete: (clientId: string) => void
  onRenew: (clientId: string, plan: string) => void
  showRevenue?: boolean
  loading?: boolean
}

export function EnhancedClientsTable({ 
  clients, 
  onAction, 
  onDelete, 
  onRenew,
  showRevenue = false,
  loading = false 
}: EnhancedClientsTableProps) {
  const router = useRouter()

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

  const getSubscriptionTimeline = (client: Client) => {
    const now = new Date()
    const created = new Date(client.createdAt)
    
    // Use startDate/endDate if available, otherwise fallback to trial/subscription dates
    const startDate = client.startDate ? new Date(client.startDate) : created
    const endDate = client.expiryDate ? new Date(client.expiryDate) : 
                   client.subscriptionEndsAt ? new Date(client.subscriptionEndsAt) :
                   client.trialEndsAt ? new Date(client.trialEndsAt) : null

    if (!endDate) {
      return {
        startDate: startDate.toLocaleDateString(),
        endDate: 'No end date',
        daysLeft: null,
        status: 'no-date',
        progress: 0
      }
    }

    const diffTime = endDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const progress = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 0

    let status = 'active'
    let endDateText = endDate.toLocaleDateString()
    
    if (daysLeft < 0) {
      status = 'expired'
      endDateText = `Expired on ${endDate.toLocaleDateString()}`
    } else if (client.status === 'TRIAL') {
      status = 'trial'
      endDateText = `${endDate.toLocaleDateString()}`
    }

    return {
      startDate: startDate.toLocaleDateString(),
      endDate: endDateText,
      daysLeft,
      status,
      progress
    }
  }

  const getDaysLeftDisplay = (timeline: any) => {
    if (timeline.daysLeft === null) {
      return <span className="text-slate-400">-</span>
    }
    
    if (timeline.daysLeft < 0) {
      return (
        <span className="text-sm font-medium px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          Expired
        </span>
      )
    }
    
    if (timeline.status === 'trial') {
      const urgencyClass = timeline.daysLeft <= 7 
        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      
      return (
        <span className={cn("text-sm font-medium px-2 py-1 rounded-full", urgencyClass)}>
          {timeline.daysLeft} days left
        </span>
      )
    }
    
    const urgencyClass = timeline.daysLeft <= 30 
      ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      : timeline.daysLeft <= 90 
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
    
    return (
      <span className={cn("text-sm font-medium px-2 py-1 rounded-full", urgencyClass)}>
        {timeline.daysLeft} days
      </span>
    )
  }

  const getProgressColor = (status: string, daysLeft: number | null) => {
    if (status === 'expired' || daysLeft === null) return 'bg-slate-300'
    if (daysLeft !== null && daysLeft <= 30) return 'bg-red-500'
    if (daysLeft !== null && daysLeft <= 90) return 'bg-amber-500'
    return 'bg-emerald-500'
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

  const handleViewClient = (clientId: string) => {
    router.push(`/admin/clients/${clientId}`)
  }

  const handleQuickRenew = (clientId: string, currentPlan: string) => {
    // Auto-renew to next plan or extend current
    const planProgression = {
      'TRIAL': 'BASIC',
      'BASIC': 'PRO',
      'PRO': 'ENTERPRISE',
      'ENTERPRISE': 'ENTERPRISE'
    }
    
    const newPlan = planProgression[currentPlan as keyof typeof planProgression] || 'BASIC'
    onRenew(clientId, newPlan)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-12"
      >
        <div className="text-slate-400 mb-4">
          <Calendar className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No clients found</h3>
        <p className="text-slate-500 dark:text-slate-400">Get started by adding your first client.</p>
      </motion.div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <TableHead className="font-semibold">Society Name</TableHead>
            <TableHead className="font-semibold">Admin Email</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Subscription Plan</TableHead>
            <TableHead className="font-semibold">Timeline</TableHead>
            <TableHead className="font-semibold">Days Remaining</TableHead>
            {showRevenue && <TableHead className="font-semibold">Revenue</TableHead>}
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, index) => {
            const timeline = getSubscriptionTimeline(client)
            const revenue = getClientRevenue(client.subscriptionPlan)
            
            return (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "border-b border-slate-200 dark:border-slate-700 transition-all duration-200",
                  index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/50",
                  "hover:bg-slate-100 dark:hover:bg-slate-800/70"
                )}
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
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {timeline.startDate} → {timeline.endDate}
                      </span>
                    </div>
                    
                    {timeline.daysLeft !== null && (
                      <div className="w-full">
                        <Progress 
                          value={timeline.progress} 
                          className="h-2"
                          indicatorClassName={getProgressColor(timeline.status, timeline.daysLeft)}
                        />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getDaysLeftDisplay(timeline)}
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
                  <div className="flex items-center justify-end gap-2">
                    {/* Quick Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClient(client.id)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      
                      {client.status === 'LOCKED' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAction('unlock', client.id)}
                          className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                        >
                          <Unlock className="h-4 w-4 text-emerald-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAction('lock', client.id)}
                          className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                        >
                          <Lock className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickRenew(client.id, client.subscriptionPlan)}
                        className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      >
                        <RefreshCw className="h-4 w-4 text-purple-600" />
                      </Button>
                    </div>
                    
                    {/* More Actions Dropdown */}
                    <EnhancedActionsDropdown 
                      client={client} 
                      onAction={onAction} 
                      onDelete={onDelete}
                      onRenew={onRenew}
                    />
                  </div>
                </TableCell>
              </motion.tr>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}