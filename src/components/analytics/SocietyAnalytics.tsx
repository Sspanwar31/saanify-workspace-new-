'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Home,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface MetricCard {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease'
  icon: React.ReactNode
  color: string
  subtitle?: string
}

interface ChartData {
  name: string
  value: number
  color: string
}

interface ActivityItem {
  id: string
  type: 'member' | 'payment' | 'loan' | 'event'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'pending' | 'warning'
}

export default function SocietyAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [selectedPeriod])

  const metrics: MetricCard[] = [
    {
      title: "Total Revenue",
      value: "₹2,45,000",
      change: 12.5,
      changeType: 'increase',
      icon: <DollarSign className="h-5 w-5" />,
      color: "from-green-500 to-emerald-600",
      subtitle: "+12% from last month"
    },
    {
      title: "Active Members",
      value: 156,
      change: 8.2,
      changeType: 'increase',
      icon: <Users className="h-5 w-5" />,
      color: "from-blue-500 to-cyan-600",
      subtitle: "98% retention rate"
    },
    {
      title: "Occupancy Rate",
      value: "94%",
      change: 2.1,
      changeType: 'increase',
      icon: <Home className="h-5 w-5" />,
      color: "from-purple-500 to-violet-600",
      subtitle: "142 of 151 units"
    },
    {
      title: "Pending Dues",
      value: "₹18,500",
      change: -5.3,
      changeType: 'decrease',
      icon: <AlertCircle className="h-5 w-5" />,
      color: "from-orange-500 to-red-600",
      subtitle: "7.5% of total revenue"
    }
  ]

  const loanDistribution: ChartData[] = [
    { name: "Personal Emergency", value: 45, color: "bg-blue-500" },
    { name: "Home Improvement", value: 30, color: "bg-green-500" },
    { name: "Education", value: 25, color: "bg-purple-500" }
  ]

  const monthlyRevenue = [
    { month: "Jan", revenue: 180000 },
    { month: "Feb", revenue: 195000 },
    { month: "Mar", revenue: 210000 },
    { month: "Apr", revenue: 205000 },
    { month: "May", revenue: 220000 },
    { month: "Jun", revenue: 245000 }
  ]

  const recentActivities: ActivityItem[] = [
    {
      id: "1",
      type: "member",
      title: "New Member Joined",
      description: "Rahul Sharma added to Tower A - 1204",
      timestamp: "2 hours ago",
      status: "success"
    },
    {
      id: "2",
      type: "payment",
      title: "Maintenance Payment",
      description: "₹15,000 received from 24 families",
      timestamp: "4 hours ago",
      status: "success"
    },
    {
      id: "3",
      type: "loan",
      title: "Loan Application",
      description: "New loan application pending approval",
      timestamp: "6 hours ago",
      status: "pending"
    },
    {
      id: "4",
      type: "event",
      title: "Event Reminder",
      description: "Society meeting scheduled for tomorrow",
      timestamp: "8 hours ago",
      status: "warning"
    }
  ]

  const getStatusIcon = (status: 'success' | 'pending' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
    }
  }

  const getActivityIcon = (type: 'member' | 'payment' | 'loan' | 'event') => {
    switch (type) {
      case 'member':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-500" />
      case 'loan':
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      case 'event':
        return <Calendar className="h-4 w-4 text-orange-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Society Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
          </div>
          
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod(period)}
                className="capitalize"
              >
                {period}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color} text-white`}>
                    {metric.icon}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.changeType === 'increase' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-1">{metric.value}</h3>
                <p className="text-sm font-medium text-foreground mb-1">{metric.title}</p>
                <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
                  <p className="text-sm text-muted-foreground">Monthly revenue performance</p>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                {monthlyRevenue.map((item, index) => (
                  <div key={item.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-muted-foreground">
                      {item.month}
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={(item.revenue / 250000) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="w-20 text-sm font-medium text-right text-foreground">
                      ₹{item.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Loan Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Loan Distribution</h3>
                  <p className="text-sm text-muted-foreground">By loan type</p>
                </div>
                <PieChart className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                {loanDistribution.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-2" />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Total Loans</span>
                  <Badge variant="secondary">24 Active</Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Recent Activities</h3>
                <p className="text-sm text-muted-foreground">Latest society updates and transactions</p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                      {getStatusIcon(activity.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                View All Activities
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: <Users className="h-4 w-4" />, label: "Add Member", color: "from-blue-500 to-cyan-600" },
            { icon: <DollarSign className="h-4 w-4" />, label: "Send Reminder", color: "from-green-500 to-emerald-600" },
            { icon: <Calendar className="h-4 w-4" />, label: "Schedule Event", color: "from-purple-500 to-violet-600" },
            { icon: <Target className="h-4 w-4" />, label: "Set Goals", color: "from-orange-500 to-red-600" }
          ].map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="w-full h-auto p-4 flex flex-col gap-2 bg-gradient-to-r text-white hover:shadow-lg transition-all">
                {action.icon}
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}