'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Users, DollarSign, Building, TrendingUp } from 'lucide-react'

interface DashboardCard {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  gradient: string
}

const DashboardCards = () => {
  const cards: DashboardCard[] = [
    {
      title: 'Total Members',
      value: '248',
      change: '+12%',
      icon: <Users className="h-6 w-6" />,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Active Loans',
      value: '42',
      change: '+8%',
      icon: <DollarSign className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Admin Fund',
      value: '₹1.2L',
      change: '+15%',
      icon: <Building className="h-6 w-6" />,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Monthly Income',
      value: '₹85K',
      change: '+23%',
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          variants={cardVariants}
          whileHover={{
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5`} />
            
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${card.gradient} text-white shadow-lg`}>
                  {card.icon}
                </div>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                  {card.change}
                </span>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {card.title}
                </h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default DashboardCards