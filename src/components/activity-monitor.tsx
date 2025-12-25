"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Eye,
  User,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ActivityTracker, ACTIVITY_TYPES, RESOURCE_TYPES } from '@/lib/activity-tracker'

export function ActivityMonitor() {
  const [activities, setActivities] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filters, setFilters] = useState({
    action: 'all',
    resource: 'all',
    success: 'all',
    timeRange: '24h'
  })

  useEffect(() => {
    // Generate sample activities for demo
    const sampleActivities = [
      {
        id: '1',
        userId: 'user1',
        userName: 'ADMIN',
        userEmail: 'admin@saanify.com',
        action: ACTIVITY_TYPES.LOGIN,
        resource: RESOURCE_TYPES.SYSTEM,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        sessionId: 'session_1',
        success: true
      },
      {
        id: '2',
        userId: 'user1',
        userName: 'ADMIN',
        userEmail: 'admin@saanify.com',
        action: ACTIVITY_TYPES.CLIENT_VIEW,
        resource: RESOURCE_TYPES.CLIENT,
        resourceId: 'client_1',
        details: { clientName: 'Green Valley Housing Society' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        sessionId: 'session_1',
        success: true
      },
      {
        id: '3',
        userId: 'user1',
        userName: 'ADMIN',
        userEmail: 'admin@saanify.com',
        action: ACTIVITY_TYPES.CLIENT_UPDATE,
        resource: RESOURCE_TYPES.CLIENT,
        resourceId: 'client_2',
        details: { clientName: 'Sunshine Community', changes: ['plan', 'status'] },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        sessionId: 'session_1',
        success: true
      },
      {
        id: '4',
        userId: 'user1',
        userName: 'ADMIN',
        userEmail: 'admin@saanify.com',
        action: ACTIVITY_TYPES.LOGIN_FAILED,
        resource: RESOURCE_TYPES.SYSTEM,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        sessionId: 'session_2',
        success: false,
        errorMessage: 'Invalid credentials'
      },
      {
        id: '5',
        userId: 'user1',
        userName: 'ADMIN',
        userEmail: 'admin@saanify.com',
        action: ACTIVITY_TYPES.BACKUP_CREATE,
        resource: RESOURCE_TYPES.BACKUP,
        details: { backupSize: '2.4GB', duration: 45 },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        sessionId: 'session_1',
        success: true
      }
    ]

    setActivities(sampleActivities)
    setStats({
      total: sampleActivities.length,
      successful: sampleActivities.filter(a => a.success).length,
      failed: sampleActivities.filter(a => !a.success).length,
      uniqueUsers: new Set(sampleActivities.map(a => a.userId)).size,
      uniqueSessions: new Set(sampleActivities.map(a => a.sessionId)).size,
      topActions: [
        { action: ACTIVITY_TYPES.LOGIN, count: 2 },
        { action: ACTIVITY_TYPES.CLIENT_VIEW, count: 1 },
        { action: ACTIVITY_TYPES.CLIENT_UPDATE, count: 1 },
        { action: ACTIVITY_TYPES.BACKUP_CREATE, count: 1 }
      ],
      topResources: [
        { resource: RESOURCE_TYPES.SYSTEM, count: 2 },
        { resource: RESOURCE_TYPES.CLIENT, count: 2 },
        { resource: RESOURCE_TYPES.BACKUP, count: 1 }
      ],
      hourlyActivity: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Math.floor(Math.random() * 10) })),
      averageSessionDuration: 1800 // 30 minutes in seconds
    })
  }, [])

  const getActionIcon = (action: string) => {
    switch (action) {
      case ACTIVITY_TYPES.LOGIN:
      case ACTIVITY_TYPES.LOGOUT:
        return User
      case ACTIVITY_TYPES.CLIENT_CREATE:
      case ACTIVITY_TYPES.CLIENT_UPDATE:
      case ACTIVITY_TYPES.CLIENT_DELETE:
        return Users
      case ACTIVITY_TYPES.BACKUP_CREATE:
      case ACTIVITY_TYPES.BACKUP_RESTORE:
        return Download
      default:
        return Activity
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'text-blue-400'
    if (action.includes('create')) return 'text-green-400'
    if (action.includes('update')) return 'text-yellow-400'
    if (action.includes('delete')) return 'text-red-400'
    return 'text-gray-400'
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const exportActivities = () => {
    const dataStr = JSON.stringify(activities, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `activities_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            Activity Monitor
          </h2>
          <p className="text-gray-400">Real-time user activity tracking and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportActivities}
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Activities</CardTitle>
                <BarChart3 className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <p className="text-xs text-gray-400">All time</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Successful</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{stats.successful}</div>
                <p className="text-xs text-gray-400">{((stats.successful / stats.total) * 100).toFixed(1)}% success rate</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                <p className="text-xs text-gray-400">{((stats.failed / stats.total) * 100).toFixed(1)}% failure rate</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Unique Users</CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">{stats.uniqueUsers}</div>
                <p className="text-xs text-gray-400">Active users</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Avg Session</CardTitle>
                <Clock className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {formatDuration(stats.averageSessionDuration * 1000)}
                </div>
                <p className="text-xs text-gray-400">Average duration</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-cyan-400" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-gray-300">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value={ACTIVITY_TYPES.LOGIN}>Login</SelectItem>
                <SelectItem value={ACTIVITY_TYPES.CLIENT_VIEW}>View Client</SelectItem>
                <SelectItem value={ACTIVITY_TYPES.CLIENT_UPDATE}>Update Client</SelectItem>
                <SelectItem value={ACTIVITY_TYPES.BACKUP_CREATE}>Create Backup</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.resource} onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value }))}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-gray-300">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value={RESOURCE_TYPES.CLIENT}>Client</SelectItem>
                <SelectItem value={RESOURCE_TYPES.SYSTEM}>System</SelectItem>
                <SelectItem value={RESOURCE_TYPES.BACKUP}>Backup</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.success} onValueChange={(value) => setFilters(prev => ({ ...prev, success: value }))}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-gray-300">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Successful</SelectItem>
                <SelectItem value="false">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-gray-300">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-cyan-400" />
            Recent Activities
          </CardTitle>
          <CardDescription className="text-gray-400">
            Latest user activities and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50">
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Action</TableHead>
                  <TableHead className="text-gray-300">Resource</TableHead>
                  <TableHead className="text-gray-300">IP Address</TableHead>
                  <TableHead className="text-gray-300">Timestamp</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity, index) => {
                  const ActionIcon = getActionIcon(activity.action)
                  return (
                    <motion.tr
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-slate-700/30 hover:bg-slate-700/30 transition-colors"
                    >
                      <TableCell className="text-white">
                        <div>
                          <div className="text-white">{activity.userName}</div>
                          <div className="text-xs text-gray-400">{activity.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ActionIcon className={`h-4 w-4 ${getActionColor(activity.action)}`} />
                          <span className="text-gray-300">
                            {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-600 text-gray-300">
                          {activity.resource}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{activity.ipAddress}</TableCell>
                      <TableCell className="text-gray-300">
                        {activity.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          activity.success 
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }>
                          {activity.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}