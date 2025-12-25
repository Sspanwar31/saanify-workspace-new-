'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  CreditCard, 
  Calendar,
  MessageSquare,
  Activity,
  DollarSign,
  FileText,
  ArrowUpRight,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardStatsProps {
  stats: {
    totalMembers: number
    activeMembers: number
    pendingPayments: number
    monthlyRevenue: number
    eventsThisMonth: number
    pendingApprovals: number
    totalLoans: number
    totalSavings: number
    activeLoans: number
    pendingLoans: number
    maturityAmount: number
  }
  societyInfo: {
    id: string
    name: string
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'LOCKED'
    subscriptionPlan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
    subscriptionEndsAt?: string
    adminName: string
    adminEmail: string
    adminPhone: string
    address?: string
    createdAt: string
    totalMembers?: number
    totalLoans?: number
    totalSavings?: number
  }
}

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
}

function AnimatedCounter({ value, duration = 2, prefix = '', suffix = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref)

  useEffect(() => {
    if (!isInView) return
    
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      
      setCount(Math.floor(progress * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration, isInView])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

export function ClientDashboardStats({ stats, societyInfo }: DashboardStatsProps) {
  const statsCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      change: '+12%',
      icon: <Users className="h-6 w-6" />,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-200/50',
      description: 'All registered members',
      progress: stats.totalMembers > 0 ? (stats.activeMembers / stats.totalMembers) * 100 : 0
    },
    {
      title: 'Active Members',
      value: stats.activeMembers,
      change: '+8%',
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-500/10 to-emerald-600/10',
      borderColor: 'border-emerald-200/50',
      description: 'Currently active members',
      progress: stats.totalMembers > 0 ? (stats.activeMembers / stats.totalMembers) * 100 : 0
    },
    {
      title: 'Monthly Revenue',
      value: stats.monthlyRevenue,
      change: '+15%',
      icon: <DollarSign className="h-6 w-6" />,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-500/10 to-purple-600/10',
      borderColor: 'border-purple-200/50',
      description: 'Monthly recurring revenue',
      visible: societyInfo?.subscriptionPlan !== 'TRIAL'
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      change: '-3',
      icon: <Calendar className="h-6 w-6" />,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-500/10 to-amber-600/10',
      borderColor: 'border-amber-200/50',
      description: 'Pending payments this month'
    },
    {
      title: 'Total Loans',
      value: stats.totalLoans,
      change: '+5',
      icon: <FileText className="h-6 w-6" />,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-500/10 to-orange-600/10',
      borderColor: 'border-orange-200/50',
      description: 'Total loans issued'
    },
    {
      title: 'Total Savings',
      value: stats.totalSavings,
      change: '+18%',
      icon: <DollarSign className="h-6 w-6" />,
      gradient: 'from-teal-500 to-teal-600',
      bgGradient: 'from-teal-500/10 to-teal-600/10',
      borderColor: 'border-teal-200/50',
      description: 'Total member savings'
    }
  ]

  const getSubscriptionStatus = () => {
    if (!societyInfo) return { status: 'UNKNOWN', color: 'bg-slate-100', text: 'text-slate-600' }
    
    const now = new Date()
    const endDate = societyInfo.subscriptionEndsAt ? new Date(societyInfo.subscriptionEndsAt) : null
    
    if (!endDate) {
      return { status: 'NO_END_DATE', color: 'bg-slate-100', text: 'text-slate-600' }
    }
    
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) {
      return { status: 'EXPIRED', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', text: 'text-red-300' }
    }
    
    if (daysLeft <= 7) {
      return { status: 'EXPIRING_SOON', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300', text: 'text-orange-300' }
    }
    
    return { status: 'ACTIVE', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300', text: 'text-emerald-300' }
  }

  const getPlanProgress = () => {
    const status = getSubscriptionStatus()
    if (status.status === 'NO_END_DATE') return 0
    if (status.status === 'EXPIRED') return 100
    if (status.status === 'EXPIRING_SOON') return 90
    if (status.status === 'ACTIVE') return 75
    return 50
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      'TRIAL': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      'ACTIVE': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      'EXPIRED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      'LOCKED': 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300'
    }
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.LOCKED}>
        {status}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const colors = {
      'TRIAL': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      'BASIC': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'PRO': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      'ENTERPRISE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
    }
    return (
      <Badge className={colors[plan as keyof typeof colors] || colors.TRIAL}>
        {plan}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          const subscriptionStatus = getSubscriptionStatus()
          const progress = getPlanProgress()
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -5, 
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="group"
            >
              <Card className={cn(
                "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
                card.bgGradient,
                card.borderColor
              )}>
                {/* Background gradient overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
                  card.gradient
                )} />
                
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {card.title}
                  </CardTitle>
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "p-2 rounded-full bg-gradient-to-r",
                      card.gradient,
                      "text-white shadow-lg"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.div>
                </CardHeader>
                
                <CardContent>
                  <motion.div 
                    className="text-2xl font-bold text-slate-900 dark:text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <AnimatedCounter 
                      value={card.value} 
                      prefix={card.prefix || ''}
                      suffix={card.suffix || ''}
                    />
                  </motion.div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        card.change.startsWith('+') 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                      )}
                    >
                      {card.change}
                    </motion.span>
                  </div>
                  
                  {/* Progress bar for subscription status */}
                  {card.title === 'Total Members' && (
                    <div className="mt-3">
                      <Progress 
                        value={progress} 
                        className="h-2"
                        indicatorClassName={
                          subscriptionStatus.color === 'bg-emerald-500' ? 'bg-emerald-500' :
                          subscriptionStatus.color === 'bg-orange-500' ? 'bg-orange-500' :
                          subscriptionStatus.color === 'bg-red-500' ? 'bg-red-500' : 'bg-slate-300'
                        }
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Society Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        whileHover={{ y: -5, scale: 1.01 }}
        className="group"
      >
        <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              Society Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Society Name</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {societyInfo?.name || 'Not Available'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Admin Name</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {societyInfo?.adminName || 'Not Available'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Admin Email</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {societyInfo?.adminEmail || 'Not Available'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                    <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {societyInfo?.createdAt ? new Date(societyInfo.createdAt).toLocaleDateString() : 'Not Available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Subscription Status</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(societyInfo?.status || 'ACTIVE')}
                    {getPlanBadge(societyInfo?.subscriptionPlan || 'TRIAL')}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Plan Details</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {societyInfo?.subscriptionPlan || 'TRIAL'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                      (${societyInfo?.subscriptionEndsAt ? new Date(societyInfo.subscriptionEndsAt).toLocaleDateString() : 'No end date'})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}