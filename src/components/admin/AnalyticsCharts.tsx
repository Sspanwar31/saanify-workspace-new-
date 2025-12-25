'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

interface AnalyticsChartsProps {
  clients: any[]
  showRevenue: boolean
}

const COLORS = {
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  teal: '#14b8a6'
}

export function AnalyticsCharts({ clients, showRevenue }: AnalyticsChartsProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  // Prepare data for charts
  const statusData = [
    { name: 'Active', value: clients.filter(c => c.status === 'ACTIVE').length, color: COLORS.emerald },
    { name: 'Trial', value: clients.filter(c => c.status === 'TRIAL').length, color: COLORS.amber },
    { name: 'Expired', value: clients.filter(c => c.status === 'EXPIRED').length, color: COLORS.red },
    { name: 'Locked', value: clients.filter(c => c.status === 'LOCKED').length, color: COLORS.slate }
  ]

  const planData = [
    { name: 'Trial', value: clients.filter(c => c.subscriptionPlan === 'TRIAL').length, color: COLORS.blue },
    { name: 'Basic', value: clients.filter(c => c.subscriptionPlan === 'BASIC').length, color: COLORS.purple },
    { name: 'Pro', value: clients.filter(c => c.subscriptionPlan === 'PRO').length, color: COLORS.teal },
    { name: 'Enterprise', value: clients.filter(c => c.subscriptionPlan === 'ENTERPRISE').length, color: COLORS.emerald }
  ]

  // Mock revenue growth data
  const revenueGrowthData = [
    { month: 'Jan', revenue: 12000, clients: 45 },
    { month: 'Feb', revenue: 15000, clients: 52 },
    { month: 'Mar', revenue: 18000, clients: 58 },
    { month: 'Apr', revenue: 22000, clients: 67 },
    { month: 'May', revenue: 28000, clients: 78 },
    { month: 'Jun', revenue: 35000, clients: 92 }
  ]

  // Mock client acquisition data
  const clientAcquisitionData = [
    { month: 'Jan', newClients: 8, totalClients: 45 },
    { month: 'Feb', newClients: 7, totalClients: 52 },
    { month: 'Mar', newClients: 6, totalClients: 58 },
    { month: 'Apr', newClients: 9, totalClients: 67 },
    { month: 'May', newClients: 11, totalClients: 78 },
    { month: 'Jun', newClients: 14, totalClients: 92 }
  ]

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  }

  return (
    <div ref={ref} className="space-y-6">
      {isInView && (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Pie Chart */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={chartVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    Client Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {statusData.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {item.name}: {item.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Plan Distribution Pie Chart */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={chartVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <Activity className="h-5 w-5" />
                Subscription Plan Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={planData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={800}
                      >
                        {planData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {planData.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {item.name}: {item.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Revenue and Client Growth Charts */}
          {showRevenue && (
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={chartVariants}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group"
            >
              <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Growth Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={revenueGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }} 
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={COLORS.blue} 
                        strokeWidth={3}
                        dot={{ fill: COLORS.blue, r: 6 }}
                        activeDot={{ r: 8 }}
                        animationBegin={400}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Client Acquisition Chart */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={chartVariants}
            whileHover={{ y: -5, scale: 1.01 }}
            className="group"
          >
            <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-5 w-5" />
                  Client Acquisition Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={clientAcquisitionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar 
                      dataKey="newClients" 
                      fill={COLORS.amber} 
                      radius={[8, 8, 0, 0]}
                      animationBegin={600}
                      animationDuration={1000}
                    />
                    <Bar 
                      dataKey="totalClients" 
                      fill={COLORS.emerald} 
                      radius={[8, 8, 0, 0]}
                      animationBegin={800}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Metrics Summary */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={chartVariants}
          >
            <Card className="border-2 border-slate-200 dark:border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-800 text-white">
                <CardTitle>Key Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {((clients.filter(c => c.status === 'ACTIVE').length / clients.length) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Client Retention Rate
                    </div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {clients.filter(c => c.status === 'TRIAL').length}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Active Trials
                    </div>
                  </motion.div>
                  
                  {showRevenue && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center"
                    >
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        ${clients.reduce((sum, client) => {
                          const planPrices = { TRIAL: 0, BASIC: 99, PRO: 299, ENTERPRISE: 999 }
                          return sum + (planPrices[client.subscriptionPlan as keyof typeof planPrices] || 0)
                        }, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Monthly Recurring Revenue
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {clients.filter(c => c.subscriptionPlan === 'ENTERPRISE').length}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Enterprise Clients
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}