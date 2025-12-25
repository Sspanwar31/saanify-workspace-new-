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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface UnifiedAnalyticsProps {
  clients: any[]
  showRevenue: boolean
  isAdmin: boolean
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

export function UnifiedAnalytics({ clients, showRevenue, isAdmin }: UnifiedAnalyticsProps) {
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.status === 'ACTIVE').length
  const trialClients = clients.filter(c => c.status === 'TRIAL').length
  const expiredClients = clients.filter(c => c.status === 'EXPIRED').length
  const lockedClients = clients.filter(c => c.status === 'LOCKED').length
  
  // Plan distribution
  const basicClients = clients.filter(c => c.subscriptionPlan === 'BASIC').length
  const proClients = clients.filter(c => c.subscriptionPlan === 'PRO').length
  const enterpriseClients = clients.filter(c => c.subscriptionPlan === 'ENTERPRISE').length
  const trialPlanClients = clients.filter(c => c.subscriptionPlan === 'TRIAL').length
  
  // Revenue calculations (only for ADMIN)
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
  const monthlyGrowth = 18 // Mock growth percentage
  
  // Health metrics
  const retentionRate = totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : '0'
  const trialConversionRate = trialClients > 0 ? ((activeClients / (trialClients + activeClients)) * 100).toFixed(1) : '0'

  const analyticsCards = [
    {
      title: 'Total Clients',
      value: totalClients,
      change: '+12%',
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-200/50',
      description: 'All registered societies'
    },
    {
      title: 'Active',
      value: activeClients,
      change: '+8%',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-500/10 to-emerald-600/10',
      borderColor: 'border-emerald-200/50',
      description: 'Currently active subscriptions'
    },
    {
      title: 'Trial',
      value: trialClients,
      change: '+3',
      icon: Users,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-500/10 to-amber-600/10',
      borderColor: 'border-amber-200/50',
      description: 'Free trial users'
    },
    {
      title: 'Expired',
      value: expiredClients,
      change: '-2',
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-500/10 to-red-600/10',
      borderColor: 'border-red-200/50',
      description: 'Expired subscriptions'
    }
  ]

  const revenueCards = [
    {
      title: 'Total Revenue',
      value: totalRevenue,
      change: `+${monthlyGrowth}%`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-500/10 to-teal-600/10',
      borderColor: 'border-emerald-200/50',
      prefix: '$',
      description: 'Monthly recurring revenue',
      visible: showRevenue && isAdmin
    },
    {
      title: 'Avg. Revenue/Client',
      value: totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0,
      change: '+5%',
      icon: Target,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-500/10 to-pink-600/10',
      borderColor: 'border-purple-200/50',
      prefix: '$',
      description: 'Average revenue per client',
      visible: showRevenue && isAdmin
    }
  ]

  const healthMetrics = [
    {
      title: 'Retention Rate',
      value: parseFloat(retentionRate),
      change: '+2.3%',
      icon: Activity,
      gradient: 'from-sky-500 to-blue-600',
      bgGradient: 'from-sky-500/10 to-blue-600/10',
      borderColor: 'border-sky-200/50',
      suffix: '%',
      description: 'Client retention percentage'
    },
    {
      title: 'Trial Conversion',
      value: parseFloat(trialConversionRate),
      change: '+1.8%',
      icon: Zap,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-500/10 to-purple-600/10',
      borderColor: 'border-indigo-200/50',
      suffix: '%',
      description: 'Trial to paid conversion'
    }
  ]

  const allCards = [...analyticsCards, ...revenueCards.filter(card => card.visible), ...healthMetrics]

  const getPlanBadge = (plan: string, count: number, total: number) => {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : '0'
    const variants = {
      TRIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200',
      BASIC: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200',
      PRO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border-indigo-200',
      ENTERPRISE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300 border-teal-200'
    }
    
    return (
      <Badge className={cn(variants[plan as keyof typeof variants] || variants.TRIAL, 'font-medium')}>
        {plan} – {percentage}%
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {allCards.map((card, index) => {
          const Icon = card.icon
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
                rotateX: 5,
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              className="group"
              style={{ perspective: '1000px' }}
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
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Plan Distribution Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ y: -3, scale: 1.01 }}
      >
        <Card className="border-2 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Plan Distribution Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { plan: 'TRIAL', count: trialPlanClients },
                { plan: 'BASIC', count: basicClients },
                { plan: 'PRO', count: proClients },
                { plan: 'ENTERPRISE', count: enterpriseClients }
              ].map((item, index) => (
                <motion.div
                  key={item.plan}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="mb-2">
                    {getPlanBadge(item.plan, item.count, totalClients)}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    <AnimatedCounter value={item.count} />
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    clients
                  </div>
                  <Progress 
                    value={totalClients > 0 ? (item.count / totalClients) * 100 : 0} 
                    className="mt-2 h-2"
                  />
                </motion.div>
              ))}
            </div>
            
            {/* Validation Check */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Plan Total: {trialPlanClients + basicClients + proClients + enterpriseClients}
                </span>
                <span className={cn(
                  "font-medium",
                  (trialPlanClients + basicClients + proClients + enterpriseClients) === totalClients
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}>
                  {(trialPlanClients + basicClients + proClients + enterpriseClients) === totalClients ? '✅ Accurate' : '⚠️ Mismatch'}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  Registered Total: {totalClients}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}