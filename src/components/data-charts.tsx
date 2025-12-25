"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Target,
  Calendar,
  Download,
  RefreshCw,
  Settings,
  Maximize2
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

interface ChartData {
  revenueData: Array<{ month: string; revenue: number; target: number }>
  clientGrowth: Array<{ month: string; clients: number; newClients: number }>
  planDistribution: Array<{ plan: string; count: number; revenue: number; color: string }>
  activityHeatmap: Array<{ day: string; hour: number; activity: number }>
  performanceMetrics: Array<{ metric: string; current: number; previous: number; target: number }>
  regionalData: Array<{ region: string; clients: number; revenue: number; growth: number }>
}

const generateChartData = (): ChartData => {
  return {
    revenueData: [
      { month: 'Jan', revenue: 12000, target: 15000 },
      { month: 'Feb', revenue: 18000, target: 16000 },
      { month: 'Mar', revenue: 22000, target: 20000 },
      { month: 'Apr', revenue: 19000, target: 21000 },
      { month: 'May', revenue: 28000, target: 25000 },
      { month: 'Jun', revenue: 32000, target: 30000 },
    ],
    clientGrowth: [
      { month: 'Jan', clients: 45, newClients: 8 },
      { month: 'Feb', clients: 52, newClients: 7 },
      { month: 'Mar', clients: 61, newClients: 9 },
      { month: 'Apr', clients: 58, newClients: -3 },
      { month: 'May', clients: 73, newClients: 15 },
      { month: 'Jun', clients: 84, newClients: 11 },
    ],
    planDistribution: [
      { plan: 'BASIC', count: 35, revenue: 10500, color: 'bg-gray-500' },
      { plan: 'PRO', count: 28, revenue: 16800, color: 'bg-purple-500' },
      { plan: 'ENTERPRISE', count: 15, revenue: 18000, color: 'bg-cyan-500' },
      { plan: 'TRIAL', count: 6, revenue: 0, color: 'bg-yellow-500' },
    ],
    activityHeatmap: Array.from({ length: 7 * 24 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Math.floor(i / 24)],
      hour: i % 24,
      activity: Math.floor(Math.random() * 100)
    })),
    performanceMetrics: [
      { metric: 'Revenue Growth', current: 28.5, previous: 22.3, target: 30 },
      { metric: 'Client Satisfaction', current: 92, previous: 89, target: 95 },
      { metric: 'System Uptime', current: 99.9, previous: 99.7, target: 99.9 },
      { metric: 'Response Time', current: 245, previous: 312, target: 200 },
    ],
    regionalData: [
      { region: 'North America', clients: 45, revenue: 28000, growth: 15.2 },
      { region: 'Europe', clients: 28, revenue: 18000, growth: 8.7 },
      { region: 'Asia Pacific', clients: 35, revenue: 22000, growth: 22.1 },
      { region: 'Latin America', clients: 12, revenue: 8000, growth: 5.3 },
      { region: 'Africa', clients: 8, revenue: 5000, growth: 12.8 },
    ]
  }
}

export function DataCharts() {
  const [chartData, setChartData] = useState<ChartData>(generateChartData())
  const [selectedChart, setSelectedChart] = useState('revenue')
  const [timeRange, setTimeRange] = useState('6months')
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const refreshData = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setChartData(generateChartData())
      setIsRefreshing(false)
    }, 1000)
  }

  const exportChart = (chartType: string) => {
    const dataStr = JSON.stringify(chartData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chart-data-${chartType}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Revenue Chart Component
  const RevenueChart = () => {
    const maxRevenue = Math.max(...chartData.revenueData.map(d => Math.max(d.revenue, d.target)))
    
    return (
      <div className="space-y-4">
        <div className="h-64 flex items-end justify-between gap-2">
          {chartData.revenueData.map((data, index) => (
            <motion.div
              key={data.month}
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-full flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg relative group cursor-pointer"
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(data.revenue)}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.target / maxRevenue) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-purple-500/50 to-purple-400/50 rounded-t-lg relative group cursor-pointer"
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Target: {formatCurrency(data.target)}
                  </div>
                </motion.div>
              </div>
              <div className="text-xs text-gray-400">{data.month}</div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded"></div>
            <span className="text-gray-300">Actual Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-300">Target</span>
          </div>
        </div>
      </div>
    )
  }

  // Client Growth Chart Component
  const ClientGrowthChart = () => {
    const maxClients = Math.max(...chartData.clientGrowth.map(d => d.clients))
    
    return (
      <div className="space-y-4">
        <div className="h-64 flex items-end justify-between gap-2">
          {chartData.clientGrowth.map((data, index) => (
            <motion.div
              key={data.month}
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(data.clients / maxClients) * 100}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg relative group cursor-pointer"
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {data.clients} clients
                </div>
                {data.newClients > 0 && (
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    +{data.newClients}
                  </div>
                )}
              </motion.div>
              <div className="text-xs text-gray-400">{data.month}</div>
            </motion.div>
          ))}
        </div>
        <div className="text-center text-sm text-gray-400">
          Total client growth over time
        </div>
      </div>
    )
  }

  // Plan Distribution Chart Component
  const PlanDistributionChart = () => {
    const total = chartData.planDistribution.reduce((sum, plan) => sum + plan.count, 0)
    
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {chartData.planDistribution.map((plan, index) => {
                const percentage = (plan.count / total) * 100
                const previousPercentage = chartData.planDistribution
                  .slice(0, index)
                  .reduce((sum, p) => sum + (p.count / total) * 100, 0)
                
                return (
                  <motion.circle
                    key={plan.plan}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    strokeDasharray={`${percentage} ${100 - percentage}`}
                    strokeDashoffset={`-${previousPercentage}`}
                    className={`${plan.color.replace('bg-', 'text-')}`}
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{total}</div>
                <div className="text-xs text-gray-400">Total Clients</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {chartData.planDistribution.map((plan, index) => (
            <motion.div
              key={plan.plan}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`w-3 h-3 rounded-full ${plan.color}`}></div>
              <div className="flex-1">
                <div className="text-sm text-white">{plan.plan}</div>
                <div className="text-xs text-gray-400">
                  {plan.count} clients • {formatCurrency(plan.revenue)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // Activity Heatmap Component
  const ActivityHeatmap = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hours = Array.from({ length: 24 }, (_, i) => i)
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-25 gap-1 text-xs">
          <div></div>
          {hours.map(hour => (
            <div key={hour} className="text-center text-gray-500">
              {hour}
            </div>
          ))}
          {days.map(day => (
            <React.Fragment key={day}>
              <div className="text-right text-gray-500 pr-2">{day}</div>
              {hours.map(hour => {
                const data = chartData.activityHeatmap.find(d => d.day === day && d.hour === hour)
                const intensity = data ? data.activity / 100 : 0
                
                return (
                  <motion.div
                    key={`${day}-${hour}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (days.indexOf(day) * 24 + hour) * 0.001 }}
                    className={`w-3 h-3 rounded-sm cursor-pointer ${
                      intensity > 0.8 ? 'bg-cyan-500' :
                      intensity > 0.6 ? 'bg-cyan-400' :
                      intensity > 0.4 ? 'bg-cyan-300' :
                      intensity > 0.2 ? 'bg-cyan-200' :
                      'bg-slate-700'
                    }`}
                    title={`${day} ${hour}:00 - Activity: ${data?.activity || 0}%`}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-700 rounded-sm"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-200 rounded-sm"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-sm"></div>
            <span>High</span>
          </div>
        </div>
      </div>
    )
  }

  // Performance Metrics Component
  const PerformanceMetrics = () => {
    return (
      <div className="space-y-4">
        {chartData.performanceMetrics.map((metric, index) => {
          const isOnTrack = metric.current >= metric.target
          const percentage = (metric.current / metric.target) * 100
          
          return (
            <motion.div
              key={metric.metric}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-white">{metric.metric}</div>
                  <div className="text-xs text-gray-400">
                    Current: {metric.current}{metric.metric.includes('Time') ? 'ms' : metric.metric.includes('Growth') || metric.metric.includes('Satisfaction') || metric.metric.includes('Uptime') ? '%' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {metric.previous && (
                    <div className={`text-xs flex items-center gap-1 ${
                      metric.current > metric.previous ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.current > metric.previous ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(((metric.current - metric.previous) / metric.previous) * 100).toFixed(1)}%
                    </div>
                  )}
                  <Badge className={
                    isOnTrack ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                  }>
                    {isOnTrack ? 'On Track' : 'Below Target'}
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  className={`h-2 rounded-full ${
                    isOnTrack ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            Data Visualization
          </h2>
          <p className="text-gray-400">Interactive charts and analytics</p>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isRefreshing}
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportChart(selectedChart)}
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Chart Selection */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'growth', label: 'Client Growth', icon: TrendingUp },
          { id: 'distribution', label: 'Plan Distribution', icon: PieChartIcon },
          { id: 'heatmap', label: 'Activity Heatmap', icon: Activity },
          { id: 'metrics', label: 'Performance', icon: Target },
        ].map((chart) => {
          const Icon = chart.icon
          return (
            <Button
              key={chart.id}
              variant={selectedChart === chart.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChart(chart.id)}
              className={
                selectedChart === chart.id 
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
                  : 'border-slate-700/50 text-gray-300 hover:bg-slate-700/50'
              }
            >
              <Icon className="h-4 w-4 mr-2" />
              {chart.label}
            </Button>
          )
        })}
      </div>

      {/* Chart Display */}
      <motion.div
        key={selectedChart}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {{
                revenue: <DollarSign className="h-5 w-5 text-cyan-400" />,
                growth: <TrendingUp className="h-5 w-5 text-cyan-400" />,
                distribution: <PieChartIcon className="h-5 w-5 text-cyan-400" />,
                heatmap: <Activity className="h-5 w-5 text-cyan-400" />,
                metrics: <Target className="h-5 w-5 text-cyan-400" />,
              }[selectedChart]}
              {{
                revenue: 'Revenue Analysis',
                growth: 'Client Growth Trends',
                distribution: 'Plan Distribution',
                heatmap: 'Activity Heatmap',
                metrics: 'Performance Metrics',
              }[selectedChart]}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {{
                revenue: 'Monthly revenue performance vs targets',
                growth: 'Client acquisition and growth patterns',
                distribution: 'Subscription plan distribution',
                heatmap: 'User activity patterns by day and hour',
                metrics: 'Key performance indicators',
              }[selectedChart]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {{
              revenue: <RevenueChart />,
              growth: <ClientGrowthChart />,
              distribution: <PlanDistributionChart />,
              heatmap: <ActivityHeatmap />,
              metrics: <PerformanceMetrics />,
            }[selectedChart]}
          </CardContent>
        </Card>
      </motion.div>

      {/* Regional Data */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Regional Performance
          </CardTitle>
          <CardDescription className="text-gray-400">
            Client and revenue distribution by region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.regionalData.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">{region.region}</div>
                  <div className="text-sm text-gray-400">
                    {region.clients} clients • {formatCurrency(region.revenue)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-sm flex items-center gap-1 ${
                    region.growth > 10 ? 'text-green-400' : 
                    region.growth > 0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    {region.growth}%
                  </div>
                  <div className="w-24 bg-slate-600 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(region.revenue / Math.max(...chartData.regionalData.map(r => r.revenue))) * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      className="h-2 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}