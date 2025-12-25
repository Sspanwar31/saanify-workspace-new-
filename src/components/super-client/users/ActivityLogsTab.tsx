'use client'

import { useState, useMemo } from 'react'
import { ActivityLog, User } from '@/lib/super-client/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter, 
  Calendar,
  Download,
  User,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Eye,
  Edit,
  Ban,
  UserPlus,
  UserMinus,
  Ghost,
  Link,
  Unlink,
  Settings
} from 'lucide-react'

interface ActivityLogsTabProps {
  activityLogs: ActivityLog[]
  users: User[]
}

export default function ActivityLogsTab({ activityLogs, users }: ActivityLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Get unique actions from logs
  const uniqueActions = useMemo(() => {
    const actions = Array.from(new Set(activityLogs.map(log => log.action)))
    return actions.sort()
  }, [activityLogs])

  // Filter activity logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.after?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesUser = userFilter === 'all' || log.userId === userFilter
      const matchesAction = actionFilter === 'all' || log.action === actionFilter

      let matchesDate = true
      if (dateFilter !== 'all') {
        const logDate = new Date(log.timestamp)
        const now = new Date()
        
        switch (dateFilter) {
          case 'today':
            matchesDate = logDate.toDateString() === now.toDateString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = logDate >= weekAgo
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = logDate >= monthAgo
            break
        }
      }

      return matchesSearch && matchesUser && matchesAction && matchesDate
    })
  }, [activityLogs, searchTerm, userFilter, actionFilter, dateFilter])

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, any> = {
      'USER_CREATED': UserPlus,
      'USER_UPDATED': Edit,
      'USER_BLOCKED': Ban,
      'USER_UNBLOCKED': CheckCircle,
      'USER_DELETED': UserMinus,
      'LOGIN': CheckCircle,
      'LOGOUT': UserMinus,
      'LOAN_APPROVED': CheckCircle,
      'LOAN_REJECTED': Ban,
      'MEMBER_LINKED': Link,
      'MEMBER_UNLINKED': Unlink,
      'GHOST_MODE_ACTIVATED': Ghost,
      'GHOST_MODE_DEACTIVATED': Eye,
      'PASSBOOK_ENTRY': Edit,
      'EXPENSE_ADDED': Edit,
      'SETTINGS_UPDATED': Settings
    }
    
    const IconComponent = iconMap[action] || Activity
    return <IconComponent className="h-4 w-4" />
  }

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      'USER_CREATED': 'bg-green-100 text-green-800',
      'USER_UPDATED': 'bg-blue-100 text-blue-800',
      'USER_BLOCKED': 'bg-red-100 text-red-800',
      'USER_UNBLOCKED': 'bg-green-100 text-green-800',
      'USER_DELETED': 'bg-red-100 text-red-800',
      'LOGIN': 'bg-green-100 text-green-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'LOAN_APPROVED': 'bg-green-100 text-green-800',
      'LOAN_REJECTED': 'bg-red-100 text-red-800',
      'MEMBER_LINKED': 'bg-blue-100 text-blue-800',
      'MEMBER_UNLINKED': 'bg-yellow-100 text-yellow-800',
      'GHOST_MODE_ACTIVATED': 'bg-purple-100 text-purple-800',
      'GHOST_MODE_DEACTIVATED': 'bg-purple-100 text-purple-800',
      'PASSBOOK_ENTRY': 'bg-blue-100 text-blue-800',
      'EXPENSE_ADDED': 'bg-yellow-100 text-yellow-800',
      'SETTINGS_UPDATED': 'bg-gray-100 text-gray-800'
    }
    
    return colorMap[action] || 'bg-gray-100 text-gray-800'
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getActionDescription = (log: ActivityLog) => {
    if (log.details.target && log.details.after) {
      return `${log.details.target}: ${log.details.after}`
    }
    if (log.details.after) {
      return log.details.after
    }
    if (log.details.before && log.details.after) {
      return `${log.details.before} → ${log.details.after}`
    }
    return 'System action performed'
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Details', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.userName,
        log.action,
        getActionDescription(log),
        log.ip
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs by user, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace('_', ' ').toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportLogs} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Timeline ({filteredLogs.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No activity logs found matching your criteria.
                </p>
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={log.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    {index < filteredLogs.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {log.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.userName}
                          </span>
                          <Badge className={getActionColor(log.action)}>
                            {log.action.replace('_', ' ').toLowerCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {getActionDescription(log)}
                        </p>

                        {(log.details.target || log.details.before || log.details.after) && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs space-y-1">
                            {log.details.target && (
                              <div>
                                <span className="font-medium">Target:</span> {log.details.target}
                              </div>
                            )}
                            {log.details.before && (
                              <div>
                                <span className="font-medium">Before:</span> {log.details.before}
                              </div>
                            )}
                            {log.details.after && (
                              <div>
                                <span className="font-medium">After:</span> {log.details.after}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                        <div>{formatTimestamp(log.timestamp)}</div>
                        <div className="mt-1">
                          <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {log.ip}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}