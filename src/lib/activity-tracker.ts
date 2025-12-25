export interface ActivityEvent {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  ipAddress: string
  userAgent: string
  timestamp: Date
  sessionId: string
  duration?: number
  success: boolean
  errorMessage?: string
}

export interface ActivityFilters {
  userId?: string
  action?: string
  resource?: string
  dateFrom?: Date
  dateTo?: Date
  success?: boolean
  sessionId?: string
}

export class ActivityTracker {
  private static activities: ActivityEvent[] = []
  private static sessionActivities = new Map<string, ActivityEvent[]>()

  static trackActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
    const activity: ActivityEvent = {
      ...event,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    // Store in memory (in production, this would go to a database)
    this.activities.push(activity)
    
    // Keep only last 1000 activities
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(-1000)
    }

    // Track by session
    if (!this.sessionActivities.has(activity.sessionId)) {
      this.sessionActivities.set(activity.sessionId, [])
    }
    this.sessionActivities.get(activity.sessionId)!.push(activity)

    // Keep only last 50 activities per session
    const sessionActivities = this.sessionActivities.get(activity.sessionId)!
    if (sessionActivities.length > 50) {
      this.sessionActivities.set(activity.sessionId, sessionActivities.slice(-50))
    }

    console.log('Activity tracked:', activity)
  }

  static getActivities(filters?: ActivityFilters): ActivityEvent[] {
    let filtered = [...this.activities]

    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter(a => a.userId === filters.userId)
      }
      if (filters.action) {
        filtered = filtered.filter(a => a.action === filters.action)
      }
      if (filters.resource) {
        filtered = filtered.filter(a => a.resource === filters.resource)
      }
      if (filters.dateFrom) {
        filtered = filtered.filter(a => a.timestamp >= filters.dateFrom!)
      }
      if (filters.dateTo) {
        filtered = filtered.filter(a => a.timestamp <= filters.dateTo!)
      }
      if (filters.success !== undefined) {
        filtered = filtered.filter(a => a.success === filters.success)
      }
      if (filters.sessionId) {
        filtered = filtered.filter(a => a.sessionId === filters.sessionId)
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  static getSessionActivities(sessionId: string): ActivityEvent[] {
    return this.sessionActivities.get(sessionId) || []
  }

  static getActivityStats(timeRange?: { from: Date; to: Date }) {
    let activities = this.activities
    
    if (timeRange) {
      activities = activities.filter(a => 
        a.timestamp >= timeRange.from && a.timestamp <= timeRange.to
      )
    }

    const stats = {
      total: activities.length,
      successful: activities.filter(a => a.success).length,
      failed: activities.filter(a => !a.success).length,
      uniqueUsers: new Set(activities.map(a => a.userId)).size,
      uniqueSessions: new Set(activities.map(a => a.sessionId)).size,
      topActions: this.getTopActions(activities),
      topResources: this.getTopResources(activities),
      hourlyActivity: this.getHourlyActivity(activities),
      averageSessionDuration: this.getAverageSessionDuration()
    }

    return stats
  }

  private static getTopActions(activities: ActivityEvent[]): Array<{ action: string; count: number }> {
    const actionCounts = new Map<string, number>()
    
    activities.forEach(activity => {
      actionCounts.set(activity.action, (actionCounts.get(activity.action) || 0) + 1)
    })

    return Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private static getTopResources(activities: ActivityEvent[]): Array<{ resource: string; count: number }> {
    const resourceCounts = new Map<string, number>()
    
    activities.forEach(activity => {
      resourceCounts.set(activity.resource, (resourceCounts.get(activity.resource) || 0) + 1)
    })

    return Array.from(resourceCounts.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private static getHourlyActivity(activities: ActivityEvent[]): Array<{ hour: number; count: number }> {
    const hourlyCounts = new Array(24).fill(0)
    
    activities.forEach(activity => {
      const hour = activity.timestamp.getHours()
      hourlyCounts[hour]++
    })

    return hourlyCounts.map((count, hour) => ({ hour, count }))
  }

  private static getAverageSessionDuration(): number {
    const sessions = Array.from(this.sessionActivities.values())
    const durations = sessions.map(sessionActivities => {
      if (sessionActivities.length < 2) return 0
      const first = sessionActivities[0].timestamp
      const last = sessionActivities[sessionActivities.length - 1].timestamp
      return last.getTime() - first.getTime()
    }).filter(duration => duration > 0)

    if (durations.length === 0) return 0
    
    const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length
    return Math.round(average / 1000) // Convert to seconds
  }

  static clearActivities(): void {
    this.activities = []
    this.sessionActivities.clear()
  }

  static exportActivities(format: 'json' | 'csv' = 'json'): string {
    const activities = this.getActivities()
    
    if (format === 'csv') {
      const headers = ['ID', 'User', 'Action', 'Resource', 'Timestamp', 'IP Address', 'Success']
      const rows = activities.map(activity => [
        activity.id,
        activity.userName,
        activity.action,
        activity.resource,
        activity.timestamp.toISOString(),
        activity.ipAddress,
        activity.success ? 'Yes' : 'No'
      ])
      
      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    }
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalActivities: activities.length,
      activities
    }, null, 2)
  }
}

// Helper function to extract user info from request
export function extractUserInfo(request: any) {
  return {
    ipAddress: request.headers['x-forwarded-for'] || 
                request.headers['x-real-ip'] || 
                request.connection?.remoteAddress || 
                '127.0.0.1',
    userAgent: request.headers['user-agent'] || 'Unknown',
    timestamp: new Date()
  }
}

// Predefined activity types
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_CHANGE: 'password_change',
  
  // Client Management
  CLIENT_CREATE: 'client_create',
  CLIENT_UPDATE: 'client_update',
  CLIENT_DELETE: 'client_delete',
  CLIENT_VIEW: 'client_view',
  CLIENT_LOCK: 'client_lock',
  CLIENT_UNLOCK: 'client_unlock',
  
  // User Management
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_INVITE: 'user_invite',
  
  // System
  BACKUP_CREATE: 'backup_create',
  BACKUP_RESTORE: 'backup_restore',
  SYSTEM_UPDATE: 'system_update',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  
  // Settings
  SETTINGS_UPDATE: 'settings_update',
  NOTIFICATION_SEND: 'notification_send',
  
  // Analytics
  REPORT_GENERATE: 'report_generate',
  ANALYTICS_VIEW: 'analytics_view'
} as const

export const RESOURCE_TYPES = {
  CLIENT: 'client',
  USER: 'user',
  SYSTEM: 'system',
  SETTINGS: 'settings',
  BACKUP: 'backup',
  REPORT: 'report',
  ANALYTICS: 'analytics'
} as const