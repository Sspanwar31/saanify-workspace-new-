'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const PaymentModesChart = ({ data = [] }: { data?: Array<{name: string, value: number, fill?: string}> }) => {
  const chartVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  // Sample data if none provided
  const sampleData = data.length > 0 ? data : [
    { name: 'Cash', value: 15000, fill: '#10b981' },
    { name: 'UPI', value: 8000, fill: '#3b82f6' },
    { name: 'Bank', value: 12000, fill: '#8b5cf6' },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      minimumFractionDigits: 0 
    }).format(value)
  }

  const total = sampleData.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Payment Modes
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <CreditCard className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sampleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sampleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {sampleData.map((mode, index) => (
              <div key={index} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div 
                  className="w-3 h-3 rounded-full mx-auto mb-1" 
                  style={{ backgroundColor: mode.fill }}
                />
                <p className="text-xs font-medium">{mode.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {((mode.value / total) * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default PaymentModesChart