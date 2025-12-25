"use client"

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    growth: number
  }
  clients: {
    current: number
    previous: number
    growth: number
  }
  activeUsers: {
    current: number
    previous: number
    growth: number
  }
  conversionRate: {
    current: number
    previous: number
    growth: number
  }
  monthlyData: Array<{
    month: string
    revenue: number
    clients: number
    activeUsers: number
  }>
  planDistribution: Array<{
    plan: string
    count: number
    revenue: number
    percentage: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: Date
    impact: 'positive' | 'negative' | 'neutral'
  }>
}

const generateAnalyticsData = (): AnalyticsData => {
  const monthlyData = [
    { month: 'Jan', revenue: 12000, clients: 45, activeUsers: 1200 },
    { month: 'Feb', revenue: 15000, clients: 52, activeUsers: 1450 },
    { month: 'Mar', revenue: 18000, clients: 61, activeUsers: 1680 },
    { month: 'Apr', revenue: 16500, clients: 58, activeUsers: 1590 },
    { month: 'May', revenue: 22000, clients: 73, activeUsers: 2100 },
    { month: 'Jun', revenue: 25800, clients: 84, activeUsers: 2450 },
  ]

  const planDistribution = [
    { plan: 'BASIC', count: 35, revenue: 10500, percentage: 42 },
    { plan: 'PRO', count: 28, revenue: 16800, percentage: 33 },
    { plan: 'ENTERPRISE', count: 15, revenue: 18000, percentage: 18 },
    { plan: 'TRIAL', count: 6, revenue: 0, percentage: 7 },
  ]

  const recentActivity = [
    {
      id: '1',
      type: 'new_client',
      description: 'Green Valley Housing Society upgraded to PRO plan',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      impact: 'positive' as const
    },
    {
      id: '2',
      type: 'revenue',
      description: 'Monthly revenue target achieved 105%',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      impact: 'positive' as const
    },
    {
      id: '3',
      type: 'churn',
      description: 'Sunshine Community trial expired',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      impact: 'negative' as const
    },
    {
      id: '4',
      type: 'feature',
      description: 'New analytics dashboard launched',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      impact: 'positive' as const
    },
    {
      id: '5',
      type: 'system',
      description: 'Scheduled maintenance completed',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      impact: 'neutral' as const
    }
  ]

  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]

  return {
    revenue: {
      current: currentMonth.revenue,
      previous: previousMonth.revenue,
      growth: ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    },
    clients: {
      current: currentMonth.clients,
      previous: previousMonth.clients,
      growth: ((currentMonth.clients - previousMonth.clients) / previousMonth.clients) * 100
    },
    activeUsers: {
      current: currentMonth.activeUsers,
      previous: previousMonth.activeUsers,
      growth: ((currentMonth.activeUsers - previousMonth.activeUsers) / previousMonth.activeUsers) * 100
    },
    conversionRate: {
      current: 68.5,
      previous: 64.2,
      growth: 6.7
    },
    monthlyData,
    planDistribution,
    recentActivity
  }
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('6months')
  const [data] = useState<AnalyticsData>(generateAnalyticsData())

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const MetricCard = ({ 
    title, 
    value, 
    previousValue, 
    growth, 
    icon: Icon, 
    format = 'number',
    color = 'cyan'
  }: {
    title: string
    value: number
    previousValue: number
    growth: number
    icon: any
    format?: 'currency' | 'number' | 'percentage'
    color?: string
  }) => {
    const isPositive = growth > 0
    const formattedValue = format === 'currency' ? formatCurrency(value) : 
                          format === 'percentage' ? `${value}%` : 
                          formatNumber(value)
    
    const colorClasses = {
      cyan: 'text-cyan-400 bg-cyan-400/10',
      green: 'text-green-400 bg-green-400/10',
      purple: 'text-purple-400 bg-purple-400/10',
      yellow: 'text-yellow-400 bg-yellow-400/10'
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
            <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formattedValue}</div>
            <div className="flex items-center gap-2 mt-2">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-green-400" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-400" />
              )}
              <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{growth.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-400">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 text-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Revenue"
          value={data.revenue.current}
          previousValue={data.revenue.previous}
          growth={data.revenue.growth}
          icon={DollarSign}
          format="currency"
          color="green"
        />
        <MetricCard
          title="Total Clients"
          value={data.clients.current}
          previousValue={data.clients.previous}
          growth={data.clients.growth}
          icon={Users}
          format="number"
          color="cyan"
        />
        <MetricCard
          title="Active Users"
          value={data.activeUsers.current}
          previousValue={data.activeUsers.previous}
          growth={data.activeUsers.growth}
          icon={Activity}
          format="number"
          color="purple"
        />
        <MetricCard
          title="Conversion Rate"
          value={data.conversionRate.current}
          previousValue={data.conversionRate.previous}
          growth={data.conversionRate.growth}
          icon={Target}
          format="percentage"
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-gray-400">
              Monthly revenue performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {data.monthlyData.map((month, index) => (
                <motion.div
                  key={month.month}
                  initial={{ height: 0 }}
                  animate={{ height: `${(month.revenue / Math.max(...data.monthlyData.map(m => m.revenue))) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg relative group cursor-pointer"
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(month.revenue)}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-400 pb-2">
                    {month.month}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-cyan-400" />
              Plan Distribution
            </CardTitle>
            <CardDescription className="text-gray-400">
              Client distribution across subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.planDistribution.map((plan, index) => (
                <motion.div
                  key={plan.plan}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        plan.plan === 'BASIC' ? 'bg-gray-500/20 text-gray-300' :
                        plan.plan === 'PRO' ? 'bg-purple-500/20 text-purple-300' :
                        plan.plan === 'ENTERPRISE' ? 'bg-cyan-500/20 text-cyan-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }>
                        {plan.plan}
                      </Badge>
                      <span className="text-gray-400 text-sm">{plan.count} clients</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(plan.revenue)}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${plan.percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      className={`h-2 rounded-full ${
                        plan.plan === 'BASIC' ? 'bg-gray-500' :
                        plan.plan === 'PRO' ? 'bg-purple-500' :
                        plan.plan === 'ENTERPRISE' ? 'bg-cyan-500' :
                        'bg-yellow-500'
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-gray-400">
            Latest system events and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  activity.impact === 'positive' ? 'bg-green-500/20 text-green-400' :
                  activity.impact === 'negative' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {activity.impact === 'positive' ? <TrendingUp className="h-4 w-4" /> :
                   activity.impact === 'negative' ? <TrendingDown className="h-4 w-4" /> :
                   <Activity className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.description}</p>
                  <p className="text-gray-500 text-xs">
                    {activity.timestamp.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}