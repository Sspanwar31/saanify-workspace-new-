'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, User, DollarSign, FileText } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'loan' | 'payment' | 'member' | 'document'
  title: string
  description: string
  time: string
  icon: React.ReactNode
  color: string
}

const RecentActivity = () => {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'loan',
      title: 'New Loan Application',
      description: 'John Doe applied for ₹50,000 personal loan',
      time: '2 hours ago',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: '2',
      type: 'payment',
      title: 'Loan Payment Received',
      description: 'Jane Smith paid ₹12,000 for loan #L-2024-042',
      time: '4 hours ago',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20'
    },
    {
      id: '3',
      type: 'member',
      title: 'New Member Joined',
      description: 'Robert Johnson joined as a premium member',
      time: '6 hours ago',
      icon: <User className="h-4 w-4" />,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
    },
    {
      id: '4',
      type: 'document',
      title: 'Document Uploaded',
      description: 'KYC documents uploaded for member #M-189',
      time: '8 hours ago',
      icon: <FileText className="h-4 w-4" />,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
    },
    {
      id: '5',
      type: 'payment',
      title: 'Monthly Contribution',
      description: 'Society collected ₹2.5L in monthly contributions',
      time: '1 day ago',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
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

  const itemVariants = {
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
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Activity
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <Clock className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                variants={itemVariants}
                whileHover={{ x: 5 }}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className={`p-2 rounded-lg ${activity.color} flex-shrink-0`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {activity.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* View All Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700"
          >
            <button className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              View All Activity →
            </button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default RecentActivity