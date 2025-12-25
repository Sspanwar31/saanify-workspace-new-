'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Users, Calendar, DollarSign, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CounterProps {
  value: number
  suffix?: string
  label: string
  delay: number
  icon: React.ReactNode
  color: string
  onRefresh?: () => void
}

function Counter({ value, suffix = '', label, delay, icon, color, onRefresh }: CounterProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setIsVisible(true), delay)
      return () => clearTimeout(timer)
    }
  }, [isInView, delay])

  useEffect(() => {
    if (!isVisible) return

    let start = 0
    const end = value
    const duration = 2000
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isVisible, value])

  const handleRefresh = () => {
    setCount(0)
    setIsVisible(false)
    setTimeout(() => setIsVisible(true), 100)
    onRefresh?.()
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      whileHover={{ y: -5, scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="text-center cursor-pointer"
      onClick={handleRefresh}
    >
      <motion.div 
        className={`p-6 rounded-2xl bg-gradient-to-br ${color} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}
        whileHover={{ scale: 1.02 }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>

        <div className="relative z-10">
          <motion.div 
            className="flex justify-center mb-4"
            animate={{ rotate: isHovered ? 360 : 0, scale: isHovered ? 1.2 : 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
          </motion.div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-white" />
            <span className="text-3xl font-bold text-white">
              +{count}{suffix}
            </span>
          </div>
          
          <p className="text-sm text-white/90 font-medium">{label}</p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 flex justify-center"
          >
            <RefreshCw className="h-4 w-4 text-white/70" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Counters() {
  const handleRefreshCounter = (counterName: string) => {
    toast.info(`🔄 ${counterName} Updated`, {
      description: "Live data refreshed successfully!",
      duration: 2000,
    })
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Trusted by Leading Societies
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of societies already experiencing the future of community management
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            💡 Click any counter to refresh live data
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <Counter 
            value={12} 
            suffix="+" 
            label="Total Societies" 
            delay={200} 
            icon={<Users className="h-6 w-6 text-white" />}
            color="from-blue-500 to-blue-600"
            onRefresh={() => handleRefreshCounter("Total Societies")}
          />
          <Counter 
            value={45.2} 
            suffix="K" 
            label="Happy Members" 
            delay={400} 
            icon={<Users className="h-6 w-6 text-white" />}
            color="from-green-500 to-green-600"
            onRefresh={() => handleRefreshCounter("Happy Members")}
          />
          <Counter 
            value={1247} 
            suffix="" 
            label="Events Managed" 
            delay={600} 
            icon={<Calendar className="h-6 w-6 text-white" />}
            color="from-purple-500 to-purple-600"
            onRefresh={() => handleRefreshCounter("Events Managed")}
          />
          <Counter 
            value={2.4} 
            suffix="M" 
            label="Revenue Processed" 
            delay={800} 
            icon={<DollarSign className="h-6 w-6 text-white" />}
            color="from-orange-500 to-orange-600"
            onRefresh={() => handleRefreshCounter("Revenue Processed")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => toast.success("📊 Analytics Dashboard", {
                description: "Detailed analytics coming soon to your dashboard!",
                duration: 3000,
              })}
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              View Detailed Analytics
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}