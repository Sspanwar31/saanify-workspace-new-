'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  AlertCircle, 
  DollarSign,
  Activity,
  Calendar,
  Target,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface AnalyticsOverviewProps {
  clients: any[]
  showRevenue: boolean
  onRevenueToggle: (show: boolean) => void
  userData?: any
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

export function AnalyticsOverview({ clients, showRevenue, onRevenueToggle, userData }: AnalyticsOverviewProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    // Check if user is ADMIN
    if (userData?.role === 'ADMIN') {
      setIsAdmin(true)
    }
  }, [userData])

  // Calculate metrics
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.status === 'ACTIVE').length
  const trialClients = clients.filter(c => c.status === 'TRIAL').length
  const expiredClients = clients.filter(c => c.status === 'EXPIRED').length
  const lockedClients = clients.filter(c => c.status === 'LOCKED').length
  
  // Plan distribution
  const planDistribution = {
    TRIAL: clients.filter(c => c.subscriptionPlan === 'TRIAL').length,
    BASIC: clients.filter(c => c.subscriptionPlan === 'BASIC').length,
    PRO: clients.filter(c => c.subscriptionPlan === 'PRO').length,
    ENTERPRISE: clients.filter(c => c.subscriptionPlan === 'ENTERPRISE').length
  }
  
  // Revenue calculations
  const calculateRevenue = () => {
    const planPrices = {
      TRIAL: 0,
      BASIC: 99,
      PRO: 299,
      ENTERPRISE: 999
    }
    
    return clients.reduce((total, client) => {
      return total + (planPrices[client.subscriptionPlan as keyof typeof planPrices] || 0)
    }, 0)
  }
  
  const totalRevenue = calculateRevenue()
  const monthlyGrowth = 18.5 // Mock growth percentage
  
  // Calculate percentages
  const getPercentage = (value: number) => {
    return totalClients > 0 ? ((value / totalClients) * 100).toFixed(1) : '0'
  }
  
  const getPlanPercentage = (planCount: number) => {
    return totalClients > 0 ? ((planCount / totalClients) * 100).toFixed(1) : '0'
  }
  
  // Plan colors
  const planColors = {
    TRIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200',
    BASIC: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200',
    PRO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border-indigo-200',
    ENTERPRISE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300 border-teal-200'
  }
  
  const statusColors = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200',
    TRIAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200',
    EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200',
    LOCKED: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border-slate-200'
  }

  return (
    <div className="space-y-6">
      {/* Revenue Toggle - Only for ADMIN */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: showRevenue ? 360 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <DollarSign className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-white font-semibold">💰 Show Revenue Data</h3>
                    <p className="text-emerald-100 text-sm">
                      {showRevenue ? 'Revenue data is visible' : 'Revenue data is hidden'}
                    </p>
                  </div>
                </div>
                
                <Switch
                  checked={showRevenue}
                  onCheckedChange={onRevenueToggle}
                  className="data-[state=checked]:bg-emerald-300"
                />
              </div>

              {showRevenue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-emerald-400/30"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-100" />
                        <span className="text-emerald-100 text-sm">Total Revenue</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        ${totalRevenue.toLocaleString()}/mo
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-emerald-100" />
                        <span className="text-emerald-100 text-sm">Monthly Growth</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        +{monthlyGrowth}%
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-emerald-100" />
                        <span className="text-emerald-100 text-sm">Avg. Revenue/Client</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        ${totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Unified Analytics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-800 text-white">
            <CardTitle className="flex items-center gap-3">
              <Activity className="h-5 w-5" />
              Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Primary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: 'Total Clients',
                  value: totalClients,
                  icon: Building2,
                  color: 'from-blue-500 to-blue-600',
                  bgColor: 'from-blue-500/10 to-blue-600/10',
                  borderColor: 'border-blue-200/50'
                },
                {
                  title: 'Active',
                  value: activeClients,
                  icon: TrendingUp,
                  color: 'from-emerald-500 to-emerald-600',
                  bgColor: 'from-emerald-500/10 to-emerald-600/10',
                  borderColor: 'border-emerald-200/50'
                },
                {
                  title: 'Trial',
                  value: trialClients,
                  icon: Users,
                  color: 'from-amber-500 to-amber-600',
                  bgColor: 'from-amber-500/10 to-amber-600/10',
                  borderColor: 'border-amber-200/50'
                },
                {
                  title: 'Expired',
                  value: expiredClients,
                  icon: AlertCircle,
                  color: 'from-red-500 to-red-600',
                  bgColor: 'from-red-500/10 to-red-600/10',
                  borderColor: 'border-red-200/50'
                }
              ].map((metric, index) => (
                <motion.div
                  key={metric.title}
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
                    metric.bgColor,
                    metric.borderColor
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {metric.title}
                        </span>
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          className={cn(
                            "p-2 rounded-full bg-gradient-to-r",
                            metric.color,
                            "text-white shadow-lg"
                          )}
                        >
                          <metric.icon className="h-4 w-4" />
                        </motion.div>
                      </div>
                      
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        <AnimatedCounter value={metric.value} />
                      </div>
                      
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {getPercentage(metric.value)}% of total
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Plan Distribution */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="h-5 w-5" />
                Plan Distribution
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(planDistribution).map(([plan, count], index) => (
                  <motion.div
                    key={plan}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={cn(planColors[plan as keyof typeof planColors], 'font-medium')}>
                        {plan}
                      </Badge>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {getPlanPercentage(count)}%
                      </span>
                    </div>
                    
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      <AnimatedCounter value={count} />
                    </div>
                    
                    <Progress 
                      value={parseFloat(getPlanPercentage(count))} 
                      className="h-2"
                      indicatorClassName={
                        plan === 'TRIAL' ? 'bg-blue-500' :
                        plan === 'BASIC' ? 'bg-purple-500' :
                        plan === 'PRO' ? 'bg-indigo-500' : 'bg-teal-500'
                      }
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Additional Metrics */}
            {showRevenue && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Zap className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">
                      Monthly Recurring Revenue
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      +{monthlyGrowth}%
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Monthly Growth Rate
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Target className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      Average Revenue Per Client
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}