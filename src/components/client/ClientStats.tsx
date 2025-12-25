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
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ClientStatsProps {
  clients: any[]
  showRevenue: boolean
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

export function ClientStats({ clients, showRevenue }: ClientStatsProps) {
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.status === 'ACTIVE').length
  const trialClients = clients.filter(c => c.status === 'TRIAL').length
  const expiredClients = clients.filter(c => c.status === 'EXPIRED').length
  
  // Calculate revenue (mock data for demonstration)
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

  const stats = [
    {
      title: 'Total Clients',
      value: totalClients,
      change: '+12%',
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-200/50'
    },
    {
      title: 'Active',
      value: activeClients,
      change: '+8%',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-500/10 to-emerald-600/10',
      borderColor: 'border-emerald-200/50'
    },
    {
      title: 'Trial',
      value: trialClients,
      change: '+3',
      icon: Users,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-500/10 to-amber-600/10',
      borderColor: 'border-amber-200/50'
    },
    {
      title: 'Expired',
      value: expiredClients,
      change: '-2',
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-500/10 to-red-600/10',
      borderColor: 'border-red-200/50'
    }
  ]

  const revenueStats = [
    {
      title: 'Total Revenue',
      value: totalRevenue,
      change: '+18%',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-500/10 to-teal-600/10',
      borderColor: 'border-emerald-200/50',
      prefix: '$'
    },
    {
      title: 'Avg. Revenue/Client',
      value: totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0,
      change: '+5%',
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-500/10 to-pink-600/10',
      borderColor: 'border-purple-200/50',
      prefix: '$'
    },
    {
      title: 'Active Revenue',
      value: clients.filter(c => c.status === 'ACTIVE').reduce((sum, client) => {
        const planPrices = { TRIAL: 0, BASIC: 99, PRO: 299, ENTERPRISE: 999 }
        return sum + (planPrices[client.subscriptionPlan as keyof typeof planPrices] || 0)
      }, 0),
      change: '+12%',
      icon: Activity,
      gradient: 'from-sky-500 to-blue-600',
      bgGradient: 'from-sky-500/10 to-blue-600/10',
      borderColor: 'border-sky-200/50',
      prefix: '$'
    },
    {
      title: 'MRR Growth',
      value: 23,
      change: '+23%',
      icon: Calendar,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-500/10 to-purple-600/10',
      borderColor: 'border-indigo-200/50',
      suffix: '%'
    }
  ]

  const currentStats = showRevenue ? [...stats, ...revenueStats] : stats

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {currentStats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
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
              stat.bgGradient,
              stat.borderColor
            )}>
              {/* Background gradient overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
                stat.gradient
              )} />
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {stat.title}
                </CardTitle>
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "p-2 rounded-full bg-gradient-to-r",
                    stat.gradient,
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
                    value={stat.value} 
                    prefix={stat.prefix || ''}
                    suffix={stat.suffix || ''}
                  />
                </motion.div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      stat.change.startsWith('+') 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                    )}
                  >
                    {stat.change}
                  </motion.span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}