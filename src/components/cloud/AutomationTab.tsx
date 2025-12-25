'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  RefreshCw, 
  Database, 
  GitBranch, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Play, 
  Pause,
  Settings,
  FileText,
  Activity,
  Upload,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface AutomationTask {
  id: string
  name: string
  description: string
  status: 'idle' | 'running' | 'completed' | 'error' | 'success'
  lastRun?: string
  nextRun?: string
  duration?: number
  successRate?: number
  totalRuns?: number
  enabled: boolean
  schedule?: string
  endpoint?: string
  icon: React.ReactNode
  logs?: string[]
}

interface AutomationStatus {
  overall: {
    total_runs: number
    successful_runs: number
    failed_runs: number
    running_runs: number
    success_rate: number
    average_duration_ms: number
    last_24_hours: number
  }
  task_breakdown: { [taskName: string]: any }
  recent_activity: Array<{
    task_name: string
    status: string
    duration_ms: number
    run_time: string
    details?: string
  }>
  system_health: {
    supabase_connected: boolean
    automation_logs_available: boolean
    last_log_time: string | null
  }
}

export default function AutomationTab() {
  const [tasks, setTasks] = useState<AutomationTask[]>([])
  const [status, setStatus] = useState<AutomationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [supabaseConnection, setSupabaseConnection] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchAutomationData()
    testSupabaseConnection()
    const interval = setInterval(fetchAutomationData, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const testSupabaseConnection = async () => {
    try {
      const response = await fetch('/api/cloud/automation/connection-test')
      const data = await response.json()
      setSupabaseConnection({
        success: data.success,
        message: data.success ? data.message : data.error || 'Connection failed'
      })
    } catch (error) {
      setSupabaseConnection({
        success: false,
        message: 'Failed to test connection'
      })
    }
  }

  const setupSupabaseTables = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cloud/automation/setup-supabase-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('🔧 Setup Analysis Complete', {
          description: data.message || 'Supabase setup analysis completed',
          duration: 5000,
        })
        
        // If SQL script is provided, show instructions
        if (data.sql_script) {
          toast.info('📝 Manual Setup Required', {
            description: 'SQL script generated. Please execute it in your Supabase dashboard.',
            duration: 8000,
          })
          
          // Copy SQL script to clipboard
          navigator.clipboard.writeText(data.sql_script).then(() => {
            toast.success('📋 SQL Script Copied', {
              description: 'SQL script has been copied to clipboard',
              duration: 3000,
            })
          }).catch(() => {
            console.warn('Failed to copy SQL script to clipboard')
          })
        }
        
        // Refresh connection status after setup
        setTimeout(() => {
          testSupabaseConnection()
          fetchAutomationData()
        }, 2000)
      } else {
        toast.error('❌ Setup Failed', {
          description: data.error || 'Failed to setup Supabase tables',
          duration: 5000,
        })
      }
    } catch (error) {
      toast.error('❌ Setup Error', {
        description: 'Network error occurred during setup',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const quickSetupSupabase = async () => {
    setIsLoading(true)
    try {
      // Test with simple endpoint first
      const testResponse = await fetch('/api/cloud/automation/test-quick-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const testData = await testResponse.json()
      console.log('Test response:', testData)
      
      if (testData.success) {
        toast.success('⚡ Test Setup Working', {
          description: testData.message || 'Test endpoint working',
          duration: 3000,
        })
        
        // Copy test SQL to clipboard
        if (testData.sql) {
          navigator.clipboard.writeText(testData.sql).then(() => {
            toast.success('📋 Test SQL Copied', {
              description: 'Test SQL script has been copied to clipboard',
              duration: 3000,
            })
          }).catch(() => {
            console.warn('Failed to copy SQL script to clipboard')
          })
        }
      } else {
        toast.error('❌ Test Setup Failed', {
          description: testData.error || 'Test endpoint failed',
          duration: 3000,
        })
      }
      
      // Now try the real endpoint
      const response = await fetch('/api/cloud/automation/quick-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('Real response:', data)
      
      if (data.success) {
        toast.success('⚡ Quick Setup Complete', {
          description: data.message || 'Supabase quick setup completed',
          duration: 5000,
        })
        
        // If SQL script is provided, show instructions
        if (data.sql) {
          toast.info('📝 SQL Script Ready', {
            description: 'SQL script generated. Please execute it in your Supabase dashboard.',
            duration: 8000,
          })
          
          // Copy SQL script to clipboard
          navigator.clipboard.writeText(data.sql).then(() => {
            toast.success('📋 SQL Script Copied', {
              description: 'SQL script has been copied to clipboard',
              duration: 3000,
            })
          }).catch(() => {
            console.warn('Failed to copy SQL script to clipboard')
          })
        }
        
        // Refresh connection status after setup
        setTimeout(() => {
          testSupabaseConnection()
          fetchAutomationData()
        }, 2000)
      } else {
        toast.error('❌ Quick Setup Failed', {
          description: data.error || 'Failed to setup Supabase quickly',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Quick setup error:', error)
      toast.error('❌ Setup Error', {
        description: 'Network error occurred during quick setup',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeSQLDirectly = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cloud/automation/quick-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('SQL execution response:', data)
      
      if (data.success && data.sql) {
        // Copy SQL to clipboard
        navigator.clipboard.writeText(data.sql).then(() => {
          toast.success('📋 SQL Copied to Clipboard', {
            description: 'SQL script copied! Please paste in Supabase SQL Editor.',
            duration: 4000,
          })
          
          // Open Supabase in new tab
          setTimeout(() => {
            window.open('https://supabase.com/dashboard/project/_/sql', '_blank')
          }, 1000)
          
          toast.info('🌐 Opening Supabase Dashboard', {
            description: 'Opening Supabase SQL Editor in new tab...',
            duration: 3000,
          })
        }).catch(() => {
          toast.error('❌ Failed to copy SQL', {
            description: 'Could not copy SQL to clipboard',
            duration: 3000,
          })
        })
      } else {
        toast.error('❌ SQL Generation Failed', {
          description: data.error || 'Failed to generate SQL script',
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error('❌ Setup Error', {
        description: 'Network error occurred',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAutomationData = async () => {
    try {
      // Fetch tasks and status in parallel
      const [tasksResponse, statusResponse] = await Promise.all([
        fetch('/api/cloud/automation'),
        fetch('/api/cloud/automation/status')
      ])

      const tasksData = await tasksResponse.json()
      const statusData = await statusResponse.json()

      if (tasksData.success) {
        setTasks(tasksData.data || [])
      }

      if (statusData.success) {
        setStatus(statusData.status)
      }
    } catch (error) {
      console.error('Failed to fetch automation data:', error)
    }
  }

  const runTask = async (taskId: string) => {
    setIsLoading(true)
    setSelectedTask(taskId)
    
    // Update task status to running immediately
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'running' as const }
        : task
    ))
    
    try {
      const response = await fetch('/api/cloud/automation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('🚀 Task Completed', {
          description: data.message || 'Task completed successfully',
          duration: 3000,
        })
        
        // Show detailed results for specific tasks
        if (data.task?.result?.details) {
          toast.info('📊 Task Details', {
            description: data.task.result.details,
            duration: 5000,
          })
        }

        if (data.task?.result?.created_tables) {
          toast.info('🗃️ Schema Sync', {
            description: `Created tables: ${data.task.result.created_tables.join(', ')}`,
            duration: 5000,
          })
        }

        if (data.task?.result?.synced_records) {
          const { synced_records } = data.task.result
          toast.info('🔄 Auto-Sync', {
            description: `Synced ${synced_records.total} records: ${synced_records.users} users, ${synced_records.clients} clients, ${synced_records.societies} societies`,
            duration: 5000,
          })
        }

        if (data.task?.result?.total_records) {
          toast.info('💾 Backup Complete', {
            description: `Backed up ${data.task.result.total_records} records`,
            duration: 5000,
          })
        }

        if (data.task?.result?.restored_records) {
          const { restored_records } = data.task.result
          toast.info('♻️ Restore Complete', {
            description: `Restored ${restored_records.total} records: ${restored_records.users} users, ${restored_records.clients} clients`,
            duration: 5000,
          })
        }

        if (data.task?.result?.security_score) {
          toast.info('🔒 Security Score', {
            description: `Security score: ${data.task.result.security_score}/100`,
            duration: 5000,
          })
        }
        
        // Update task status to completed
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'success' as const, lastRun: new Date().toISOString() }
            : task
        ))
      } else {
        toast.error('❌ Task Failed', {
          description: data.error || 'Failed to complete task',
          duration: 3000,
        })
        
        // Update task status to error
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'error' as const }
            : task
        ))
      }
    } catch (error) {
      toast.error('❌ Task Error', {
        description: 'Network error occurred while running task',
        duration: 3000,
      })
      
      // Update task status to error
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'error' as const }
          : task
      ))
    } finally {
      setIsLoading(false)
      setSelectedTask(null)
      // Refresh data after a short delay
      setTimeout(fetchAutomationData, 2000)
    }
  }

  const getStatusColor = (taskStatus: string) => {
    switch (taskStatus) {
      case 'running': return 'text-blue-500'
      case 'success':
      case 'completed': return 'text-green-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (taskStatus: string) => {
    switch (taskStatus) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'success':
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getStatusBadge = (taskStatus: string) => {
    switch (taskStatus) {
      case 'running': return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      case 'success':
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default: return <Badge variant="outline">Idle</Badge>
    }
  }

  const getTaskIcon = (taskId: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'schema-sync': <Database className="h-5 w-5" />,
      'auto-sync': <RefreshCw className="h-5 w-5" />,
      'backup-now': <Upload className="h-5 w-5" />,
      'auto-backup': <Download className="h-5 w-5" />,
      'health-check': <Activity className="h-5 w-5" />,
      'log-rotation': <FileText className="h-5 w-5" />,
      'ai-optimization': <Zap className="h-5 w-5" />,
      'security-scan': <Shield className="h-5 w-5" />,
      'backup-restore': <GitBranch className="h-5 w-5" />
    }
    return iconMap[taskId] || <Settings className="h-5 w-5" />
  }

  // Real-time automation tasks with actual data from API
  const automationTasks: AutomationTask[] = [
    {
      id: 'schema-sync',
      name: 'Schema Sync',
      description: 'Detects new database models and syncs with Supabase schema',
      status: tasks.find(t => t.id === 'schema-sync')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'schema-sync')?.lastRun,
      nextRun: tasks.find(t => t.id === 'schema-sync')?.nextRun,
      enabled: tasks.find(t => t.id === 'schema-sync')?.enabled || true,
      successRate: tasks.find(t => t.id === 'schema-sync')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'schema-sync')?.totalRuns || 0,
      icon: <Database className="h-5 w-5" />
    },
    {
      id: 'auto-sync',
      name: 'Auto-Sync',
      description: 'Automatically sync local data to Supabase database',
      status: tasks.find(t => t.id === 'auto-sync')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'auto-sync')?.lastRun,
      nextRun: tasks.find(t => t.id === 'auto-sync')?.nextRun,
      enabled: tasks.find(t => t.id === 'auto-sync')?.enabled || true,
      successRate: tasks.find(t => t.id === 'auto-sync')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'auto-sync')?.totalRuns || 0,
      icon: <RefreshCw className="h-5 w-5" />
    },
    {
      id: 'backup-now',
      name: 'Backup Now',
      description: 'Create immediate backup to Supabase storage',
      status: tasks.find(t => t.id === 'backup-now')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'backup-now')?.lastRun,
      nextRun: tasks.find(t => t.id === 'backup-now')?.nextRun,
      enabled: tasks.find(t => t.id === 'backup-now')?.enabled || true,
      successRate: tasks.find(t => t.id === 'backup-now')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'backup-now')?.totalRuns || 0,
      icon: <Upload className="h-5 w-5" />
    },
    {
      id: 'auto-backup',
      name: 'Auto-Backup',
      description: 'Scheduled automatic backups',
      status: tasks.find(t => t.id === 'auto-backup')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'auto-backup')?.lastRun,
      nextRun: tasks.find(t => t.id === 'auto-backup')?.nextRun,
      enabled: tasks.find(t => t.id === 'auto-backup')?.enabled || true,
      successRate: tasks.find(t => t.id === 'auto-backup')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'auto-backup')?.totalRuns || 0,
      icon: <Download className="h-5 w-5" />
    },
    {
      id: 'health-check',
      name: 'Health Check',
      description: 'Monitor system health and performance metrics',
      status: tasks.find(t => t.id === 'health-check')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'health-check')?.lastRun,
      nextRun: tasks.find(t => t.id === 'health-check')?.nextRun,
      enabled: tasks.find(t => t.id === 'health-check')?.enabled || true,
      successRate: tasks.find(t => t.id === 'health-check')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'health-check')?.totalRuns || 0,
      icon: <Activity className="h-5 w-5" />
    },
    {
      id: 'log-rotation',
      name: 'Log Rotation',
      description: 'Clean and archive old logs',
      status: tasks.find(t => t.id === 'log-rotation')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'log-rotation')?.lastRun,
      nextRun: tasks.find(t => t.id === 'log-rotation')?.nextRun,
      enabled: tasks.find(t => t.id === 'log-rotation')?.enabled || true,
      successRate: tasks.find(t => t.id === 'log-rotation')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'log-rotation')?.totalRuns || 0,
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'ai-optimization',
      name: 'AI Optimization',
      description: 'Analyze and optimize AI usage patterns',
      status: tasks.find(t => t.id === 'ai-optimization')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'ai-optimization')?.lastRun,
      nextRun: tasks.find(t => t.id === 'ai-optimization')?.nextRun,
      enabled: tasks.find(t => t.id === 'ai-optimization')?.enabled || true,
      successRate: tasks.find(t => t.id === 'ai-optimization')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'ai-optimization')?.totalRuns || 0,
      icon: <Zap className="h-5 w-5" />
    },
    {
      id: 'security-scan',
      name: 'Security Scan',
      description: 'Run security and permission checks',
      status: tasks.find(t => t.id === 'security-scan')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'security-scan')?.lastRun,
      nextRun: tasks.find(t => t.id === 'security-scan')?.nextRun,
      enabled: tasks.find(t => t.id === 'security-scan')?.enabled || true,
      successRate: tasks.find(t => t.id === 'security-scan')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'security-scan')?.totalRuns || 0,
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'backup-restore',
      name: 'Backup & Restore',
      description: 'Restore data from backup files',
      status: tasks.find(t => t.id === 'backup-restore')?.status || 'ready',
      lastRun: tasks.find(t => t.id === 'backup-restore')?.lastRun,
      nextRun: tasks.find(t => t.id === 'backup-restore')?.nextRun,
      enabled: tasks.find(t => t.id === 'backup-restore')?.enabled || true,
      successRate: tasks.find(t => t.id === 'backup-restore')?.successRate || 0,
      totalRuns: tasks.find(t => t.id === 'backup-restore')?.totalRuns || 0,
      icon: <GitBranch className="h-5 w-5" />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Automation System</h3>
          <p className="text-sm text-muted-foreground">
            Smart automation with error recovery and status monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Master Switch</span>
            <Switch
              checked={status?.overall?.total_runs > 0}
              onCheckedChange={() => {}} // Placeholder - functionality would need to be implemented
              disabled={isLoading}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAutomationData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>🔒 Security First:</strong> All automation runs server-side with service role authentication. 
          No sensitive data is exposed to frontend.
        </AlertDescription>
      </Alert>

      {/* Supabase Connection Status */}
      {supabaseConnection && (
        <Alert className={supabaseConnection.success ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
          {supabaseConnection.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={supabaseConnection.success ? 'text-green-800' : 'text-red-800'}>
            <strong>📡 Supabase Connection:</strong> {supabaseConnection.message}
            {!supabaseConnection.success && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testSupabaseConnection}
                  className="text-xs mr-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Test Connection
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Setup Supabase Tables Alert */}
      {supabaseConnection && !supabaseConnection.success && (
        <Alert className="border-orange-200 bg-orange-50/50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>🔧 Setup Required:</strong> Supabase tables need to be created for automation to work properly.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={setupSupabaseTables}
                className="text-xs mr-2"
              >
                <Database className="h-3 w-3 mr-1" />
                Setup Supabase Tables
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={quickSetupSupabase}
                className="text-xs mr-2"
              >
                <Zap className="h-3 w-3 mr-1" />
                Quick Setup
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={executeSQLDirectly}
                className="text-xs mr-2"
              >
                <Database className="h-3 w-3 mr-1" />
                Execute SQL
              </Button>
              <span className="text-xs text-orange-700">Creates required tables and storage buckets</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded ${status?.overall?.total_runs > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Zap className={`h-4 w-4 ${status?.overall?.total_runs > 0 ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.enabled).length}
                </p>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded">
                <RefreshCw className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">
                  {tasks.filter(t => t.status === 'running').length}
                </p>
                <p className="text-sm text-muted-foreground">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {tasks.filter(t => t.status === 'success' || t.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {tasks.filter(t => t.status === 'error').length}
                </p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Tasks */}
      <div className="grid gap-4">
        {automationTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`transition-all duration-300 ${
              task.status === 'running' ? 'border-blue-200 bg-blue-50/50' : 
              task.status === 'error' ? 'border-red-200 bg-red-50/50' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      task.status === 'running' ? 'bg-blue-100' :
                      task.status === 'error' ? 'bg-red-100' :
                      task.enabled ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <div className={getStatusColor(task.status)}>
                        {task.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{task.name}</h4>
                        {getStatusBadge(task.status)}
                        {task.enabled && (
                          <Badge variant="outline" className="text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                            Enabled
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.lastRun && (
                          <span>Last run: {new Date(task.lastRun).toLocaleString()}</span>
                        )}
                        {task.nextRun && (
                          <span>Next run: {new Date(task.nextRun).toLocaleString()}</span>
                        )}
                        {task.successRate !== undefined && (
                          <span>Success rate: {Math.round(task.successRate)}%</span>
                        )}
                        {task.totalRuns !== undefined && (
                          <span>Total runs: {task.totalRuns}</span>
                        )}
                      </div>
                      
                      {task.status === 'running' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>50%</span>
                          </div>
                          <Progress value={50} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runTask(task.id)}
                      disabled={isLoading || task.status === 'running' || !supabaseConnection?.success}
                    >
                      {selectedTask === task.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : task.status === 'running' ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status?.recent_activity && status.recent_activity.length > 0 ? (
              status.recent_activity.slice(0, 5).map((activity, index) => (
                <motion.div
                  key={`${activity.task_name}-${activity.run_time}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className={getStatusColor(activity.status)}>
                      {getStatusIcon(activity.status)}
                    </div>
                    <div>
                      <p className="font-medium">{activity.task_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.run_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.duration_ms && (
                      <span className="text-xs text-muted-foreground">
                        {(activity.duration_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                    {getStatusBadge(activity.status)}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>No recent activity</p>
                <p className="text-sm">Run automation tasks to see activity here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}