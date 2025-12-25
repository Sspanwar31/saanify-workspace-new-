'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cloud, 
  Database, 
  Server,
  HardDrive,
  Cpu,
  Globe,
  TrendingUp,
  Monitor,
  Users,
  UserCheck,
  Activity,
  BarChart3,
  Zap,
  Wifi,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Edit2,
  Trash2,
  RotateCw,
  Clock,
  Play,
  MoreVertical,
  Plus,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Archive,
  FileText,
  Folder,
  FolderOpen,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Calendar,
  Timer,
  Bell,
  BellRing,
  Settings2,
  Package,
  ArchiveRestore,
  File,
  FilePlus,
  FileMinus,
  FileX,
  FileSearch,
  FileLock,
  FileUnlock,
  Code,
  Terminal,
  CpuChip,
  Brain,
  ZapIcon,
  History,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SkipForward,
  SkipBack,
  Pause,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Diamond,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Paperclip,
  Link,
  Unlink,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  User,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Clock1,
  Clock2,
  Clock3,
  Clock4,
  Clock5,
  Clock6,
  Clock7,
  Clock8,
  Clock9,
  Clock10,
  Clock11,
  Clock12
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import ErrorBoundaryClass from '@/components/error-boundary-new'
import { ThemeToggle } from '@/components/theme-toggle'

interface CloudDashboardProps {
  onStatsUpdate: () => void
}

interface CloudStatus {
  uptime: number
  project: {
    name: string
    region: string
    status: string
    version: string
  }
  resources: {
    storage: { used: number; total: number; unit: string }
    functions: { deployed: number; total: number; active: number }
    databases: { connected: number; total: number; healthy: number }
  }
  performance: {
    requests: number
    aiCalls: number
    bandwidth: number
    activeUsers: number
    responseTime: number
  }
  lastUpdated: string
}

interface Secret {
  id: string
  name: string
  value: string
  description: string
  lastRotated: string
  createdAt: string
}

interface StorageFile {
  id: string
  name: string
  type: string
  size: string
  modified: string
  path: string
  fileCount?: number
  icon: string
}

interface CloudFunction {
  id: string
  name: string
  description: string
  status: string
  runtime: string
  memory: number
  timeout: number
  invocations: number
  errors: number
  avgLatency: number
  lastDeployed: string
  endpoint: string
}

interface LogEntry {
  id: string
  timestamp: string
  level: string
  service: string
  message: string
  requestId: string
  userId?: string
  duration: number
  statusCode: number
}

interface AutomationTask {
  id: string
  name: string
  description: string
  enabled: boolean
  schedule: string
  lastRun: string
  nextRun: string
  status: string
  duration: number
  successRate: number
  totalRuns: number
}

export default function CloudDashboard({ onStatsUpdate }: CloudDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [logFilter, setLogFilter] = useState('all')
  const [storageFilter, setStorageFilter] = useState('all')
  const [functionFilter, setFunctionFilter] = useState('all')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  
  // Data states
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null)
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([])
  const [functions, setFunctions] = useState<CloudFunction[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([
    {
      id: 'schema-sync',
      name: 'Schema Sync',
      description: 'Automatically sync database schema changes',
      enabled: true,
      schedule: '0 */6 * * *',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    },
    {
      id: 'auto-sync',
      name: 'Auto-Sync',
      description: 'Automatically sync data to Supabase',
      enabled: true,
      schedule: '0 */2 * * *',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    },
    {
      id: 'backup-now',
      name: 'Backup Now',
      description: 'Create immediate backup to Supabase storage',
      enabled: true,
      schedule: 'manual',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    },
    {
      id: 'auto-backup',
      name: 'Auto-Backup',
      description: 'Scheduled automatic backups',
      enabled: true,
      schedule: '0 2 * * *',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    },
    {
      id: 'health-check',
      name: 'Health Check',
      description: 'Monitor system health and performance metrics',
      enabled: true,
      schedule: '*/5 * * * *',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    },
    {
      id: 'log-rotation',
      name: 'Log Rotation',
      description: 'Clean and archive old logs',
      enabled: true,
      schedule: '0 0 * * 0',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    },
    {
      id: 'ai-optimization',
      name: 'AI Optimization',
      description: 'Analyze and optimize AI usage patterns',
      enabled: true,
      schedule: '0 */4 * * *',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    },
    {
      id: 'security-scan',
      name: 'Security Scan',
      description: 'Run security and permission checks',
      enabled: true,
      schedule: '0 3 * * 1',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    },
    {
      id: 'backup-restore',
      name: 'Backup & Restore',
      description: 'Restore data from backup files',
      enabled: true,
      schedule: 'manual',
      lastRun: null,
      nextRun: null,
      status: 'ready',
      duration: 0,
      successRate: 0,
      totalRuns: 0
    }
  ])
  
  // UI states
  const [logPage, setLogPage] = useState(1)
  const [logSearch, setLogSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [showAddSecret, setShowAddSecret] = useState(false)
  const [newSecret, setNewSecret] = useState({ name: '', value: '', description: '' })
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [actualSecretValues, setActualSecretValues] = useState<Record<string, string>>({})
  
  // Restore states
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null)
  const [includeSecretsInRestore, setIncludeSecretsInRestore] = useState(false)

  // Fetch cloud status
  const fetchCloudStatus = async () => {
    try {
      const response = await fetch('/api/cloud/status')
      const result = await response.json()
      if (result.success) {
        setCloudStatus(result.data || {})
      }
    } catch (error) {
      console.error('Error fetching cloud status:', error)
      toast.error('Failed to fetch cloud status')
    }
  }

  // Fetch secrets
  const fetchSecrets = async () => {
    try {
      const response = await fetch('/api/cloud/secrets')
      const result = await response.json()
      if (result.success) {
        setSecrets(result.secrets || [])
      }
    } catch (error) {
      console.error('Error fetching secrets:', error)
      toast.error('Failed to fetch secrets')
      setSecrets([]) // Set to empty array on error to prevent undefined
    }
  }

  // Fetch storage files
  const fetchStorageFiles = async () => {
    try {
      const params = new URLSearchParams({ type: storageFilter })
      const response = await fetch(`/api/cloud/storage?${params}`)
      const result = await response.json()
      if (result.success) {
        setStorageFiles(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching storage files:', error)
      toast.error('Failed to fetch storage files')
      setStorageFiles([]) // Set to empty array on error
    }
  }

  // Fetch functions
  const fetchFunctions = async () => {
    try {
      const params = new URLSearchParams({ status: functionFilter })
      const response = await fetch(`/api/cloud/functions?${params}`)
      const result = await response.json()
      if (result.success) {
        setFunctions(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching functions:', error)
      toast.error('Failed to fetch functions')
      setFunctions([]) // Set to empty array on error
    }
  }

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        level: logFilter,
        page: logPage.toString(),
        limit: '50',
        ...(logSearch && { search: logSearch }),
        ...(selectedDate && { date: selectedDate })
      })
      const response = await fetch(`/api/cloud/logs?${params}`)
      const result = await response.json()
      if (result.success) {
        setLogs(result.data?.logs || [])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Failed to fetch logs')
      setLogs([]) // Set to empty array on error
    }
  }

  // Fetch automation tasks
  const fetchAutomationTasks = async () => {
    try {
      console.log('Fetching automation tasks...')
      const response = await fetch('/api/cloud/automation')
      const result = await response.json()
      console.log('Automation tasks response:', result)
      if (result.success) {
        console.log('Setting automation tasks:', result.data)
        setAutomationTasks(result.data || [])
      } else {
        console.error('API returned error:', result.error)
        setAutomationTasks([])
      }
    } catch (error) {
      console.error('Error fetching automation tasks:', error)
      toast.error('Failed to fetch automation tasks')
      setAutomationTasks([]) // Set to empty array on error
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchCloudStatus()
    fetchSecrets()
    fetchStorageFiles()
    fetchFunctions()
    fetchLogs()
    fetchAutomationTasks()
  }, [])

  // Auto-refresh based on active tab - prevent infinite re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'overview') fetchCloudStatus()
      if (activeTab === 'secrets') fetchSecrets()
      if (activeTab === 'storage') fetchStorageFiles()
      if (activeTab === 'functions') fetchFunctions()
      if (activeTab === 'logs') fetchLogs()
      if (activeTab === 'automation') fetchAutomationTasks()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [activeTab]) // Remove function dependencies to prevent infinite re-renders

  // Toggle secret visibility
  const toggleSecretVisibility = (secretId: string) => {
    setShowValues(prev => ({
      ...prev,
      [secretId]: !prev[secretId]
    }))
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('✅ Copied to clipboard', {
        description: 'Content copied successfully',
        duration: 2000,
      })
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  // Add new secret
  const addNewSecret = async () => {
    if (!newSecret.name || !newSecret.value) {
      toast.error('Name and value are required')
      return
    }

    setLoading({ ...loading, addSecret: true })
    try {
      const response = await fetch('/api/cloud/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSecret)
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Secret added successfully')
        setNewSecret({ name: '', value: '', description: '' })
        setShowAddSecret(false)
        fetchSecrets()
      } else {
        toast.error(result.error || 'Failed to add secret')
      }
    } catch (error) {
      toast.error('Failed to add secret')
    } finally {
      setLoading({ ...loading, addSecret: false })
    }
  }

  // Delete secret
  const deleteSecret = async (secretId: string) => {
    setLoading({ ...loading, [`delete_${secretId}`]: true })
    try {
      const response = await fetch(`/api/cloud/secrets?id=${secretId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('🗑️ Secret deleted successfully')
        fetchSecrets()
      } else {
        toast.error(result.error || 'Failed to delete secret')
      }
    } catch (error) {
      toast.error('Failed to delete secret')
    } finally {
      setLoading({ ...loading, [`delete_${secretId}`]: false })
    }
  }

  // Rotate secret
  const rotateSecret = async (secretId: string) => {
    setLoading({ ...loading, [`rotate_${secretId}`]: true })
    try {
      const response = await fetch('/api/cloud/secrets/' + secretId + '/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('🔄 Secret rotated successfully')
        fetchSecrets()
      } else {
        toast.error(result.error || 'Failed to rotate secret')
      }
    } catch (error) {
      toast.error('Failed to rotate secret')
    } finally {
      setLoading({ ...loading, [`rotate_${secretId}`]: false })
    }
  }

  // Edit secret
  const openEditModal = (secret: Secret) => {
    setEditingSecret(secret)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setEditingSecret(null)
    setShowEditModal(false)
  }

  const saveEditedSecret = async () => {
    if (!editingSecret) return
    
    setLoading({ ...loading, [`edit_${editingSecret.id}`]: true })
    try {
      const response = await fetch(`/api/cloud/secrets/${editingSecret.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: editingSecret.value,
          description: editingSecret.description
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Secret updated successfully')
        fetchSecrets()
        closeEditModal()
      } else {
        toast.error(result.error || 'Failed to update secret')
      }
    } catch (error) {
      toast.error('Failed to update secret')
    } finally {
      setLoading({ ...loading, [`edit_${editingSecret.id}`]: false })
    }
  }

  // Run schema sync
  const runSchemaSync = async () => {
    setLoading({ ...loading, sync: true })
    try {
      const response = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('🚀 Schema sync initiated successfully')
      } else {
        toast.error(result.error || 'Failed to initiate schema sync')
      }
    } catch (error) {
      toast.error('Failed to initiate schema sync')
    } finally {
      setLoading({ ...loading, sync: false })
    }
  }

  // Run backup
  const runBackup = async (type: string = 'full') => {
    setLoading({ ...loading, [`backup_${type}`]: true })
    try {
      const response = await fetch('/api/cloud/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('💾 Backup initiated successfully', {
          description: result.message || `Backup process started`,
          duration: 3000,
        })
      } else {
        toast.error(result.error || 'Failed to initiate backup')
      }
    } catch (error) {
      toast.error('Failed to initiate backup')
    } finally {
      setLoading({ ...loading, [`backup_${type}`]: false })
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedBackupFile(file)
      toast.info('📁 Backup file selected', {
        description: `Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
        duration: 2000,
      })
    }
  }

  // Handle restore
  const handleRestore = async () => {
    if (!selectedBackupFile) {
      toast.error('❌ No backup file selected')
      return
    }

    setLoading({ ...loading, restore: true })
    try {
      const formData = new FormData()
      formData.append('backupFile', selectedBackupFile)
      formData.append('includeSecrets', includeSecretsInRestore.toString())

      const response = await fetch('/api/cloud/restore', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('🔄 Restore process started', {
          description: result.message || 'Restore initiated successfully',
          duration: 3000,
        })
        setSelectedBackupFile(null)
        // Reset file input
        const fileInput = document.getElementById('backup-file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        toast.error(result.error || 'Failed to initiate restore')
      }
    } catch (error) {
      toast.error('Failed to initiate restore')
    } finally {
      setLoading({ ...loading, restore: false })
    }
  }

  // Deploy function
  const deployFunction = async (functionId: string) => {
    setLoading({ ...loading, [`deploy_${functionId}`]: true })
    try {
      const response = await fetch('/api/cloud/functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deploy', functionId })
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('🚀 Function deployment started')
      } else {
        toast.error(result.error || 'Failed to deploy function')
      }
    } catch (error) {
      toast.error('Failed to deploy function')
    } finally {
      setLoading({ ...loading, [`deploy_${functionId}`]: false })
    }
  }

  // Test function
  const testFunction = async (functionId: string) => {
    setLoading({ ...loading, [`test_${functionId}`]: true })
    try {
      const response = await fetch('/api/cloud/functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', functionId })
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Function tests completed')
      } else {
        toast.error(result.error || 'Failed to test function')
      }
    } catch (error) {
      toast.error('Failed to test function')
    } finally {
      setLoading({ ...loading, [`test_${functionId}`]: false })
    }
  }

  // Delete storage file
  const deleteStorageFile = async (fileId: string) => {
    setLoading({ ...loading, [`delete_file_${fileId}`]: true })
    try {
      const response = await fetch(`/api/cloud/storage?id=${fileId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('🗑️ File deleted successfully')
        fetchStorageFiles()
      } else {
        toast.error(result.error || 'Failed to delete file')
      }
    } catch (error) {
      toast.error('Failed to delete file')
    } finally {
      setLoading({ ...loading, [`delete_file_${fileId}`]: false })
    }
  }

  // Run automation task
  const runAutomationTask = async (taskId: string) => {
    console.log(`🚀 Starting automation task: ${taskId}`)
    setLoading({ ...loading, [`run_${taskId}`]: true })
    
    try {
      console.log('📡 Sending API request...')
      const response = await fetch('/api/cloud/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', taskId })
      })
      
      console.log('📨 Waiting for response...')
      const result = await response.json()
      console.log('📋 API Response received:', result)
      
      if (result.success) {
        console.log('✅ Task completed successfully')
        toast.success(`🚀 ${result.message}`, {
          description: `Task "${taskId}" completed successfully`,
          duration: 3000,
        })
        
        // Refresh automation tasks to get updated status
        setTimeout(() => {
          console.log('🔄 Refreshing automation tasks...')
          fetchAutomationTasks()
        }, 1000)
      } else {
        console.error('❌ Task failed:', result.error)
        toast.error(`❌ ${result.error || 'Failed to run task'}`, {
          description: `Task "${taskId}" failed to complete`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('💥 Network error:', error)
      toast.error('💥 Failed to run task', {
        description: `Network error occurred while running task "${taskId}"`,
        duration: 3000,
      })
    } finally {
      console.log('🏁 Task execution finished')
      setLoading({ ...loading, [`run_${taskId}`]: false })
    }
  }

  // Toggle automation task
  const toggleAutomationTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/cloud/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', taskId })
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success(`✅ ${result.data.message}`)
        fetchAutomationTasks()
      } else {
        toast.error(result.error || 'Failed to toggle task')
      }
    } catch (error) {
      toast.error('Failed to toggle task')
    }
  }

  // Clear logs
  const clearLogs = async () => {
    setLoading({ ...loading, clearLogs: true })
    try {
      const response = await fetch('/api/cloud/logs', {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success(`🗑️ ${result.data.deletedCount} logs deleted`)
        fetchLogs()
      } else {
        toast.error(result.error || 'Failed to clear logs')
      }
    } catch (error) {
      toast.error('Failed to clear logs')
    } finally {
      setLoading({ ...loading, clearLogs: false })
    }
  }

  return (
    <ErrorBoundaryClass>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-14 h-14 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Cloud className="h-7 w-7" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Saanify Cloud Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Complete Infrastructure Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => fetchCloudStatus()}
              variant="outline"
              size="sm"
              disabled={loading.refresh}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading.refresh ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Overview</TabsTrigger>
            <TabsTrigger value="storage" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Storage</TabsTrigger>
            <TabsTrigger value="functions" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Functions</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">AI</TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Logs</TabsTrigger>
            <TabsTrigger value="secrets" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Secrets</TabsTrigger>
            <TabsTrigger value="automation" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Automation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {cloudStatus && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/20 dark:to-blue-800/20 p-4 md:p-6 rounded-xl border border-sky-200/50 dark:border-sky-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Database className="h-6 w-6 md:h-8 md:w-8 text-sky-600" />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="h-3 w-3 md:h-4 md:w-4 text-sky-500" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <motion.div 
                          className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          {cloudStatus.resources.databases.connected}
                        </motion.div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Databases</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-800/20 p-4 md:p-6 rounded-xl border border-violet-200/50 dark:border-violet-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <HardDrive className="h-6 w-6 md:h-8 md:w-8 text-violet-600" />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="h-3 w-3 md:h-4 md:w-4 text-violet-500" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <motion.div 
                          className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        >
                          {cloudStatus.resources.storage.used}%
                        </motion.div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 p-4 md:p-6 rounded-xl border border-amber-200/50 dark:border-amber-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Cpu className="h-6 w-6 md:h-8 md:w-8 text-amber-600" />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                        >
                          <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <motion.div 
                          className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          {cloudStatus.resources.functions.deployed}
                        </motion.div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Functions</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 p-4 md:p-6 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <motion.div 
                          className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.6 }}
                        >
                          {cloudStatus.uptime}%
                        </motion.div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Project Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-sky-600" />
                        Project Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cloudStatus.project.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Region</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cloudStatus.project.region}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                          <Badge variant={cloudStatus.project.status === 'healthy' ? 'default' : 'destructive'}>
                            {cloudStatus.project.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cloudStatus.project.version}</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                        Performance Metrics
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Requests</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cloudStatus.performance.requests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">AI Calls</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cloudStatus.performance.aiCalls.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Bandwidth</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cloudStatus.performance.bandwidth} GB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cloudStatus.performance.activeUsers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{cloudStatus.performance.responseTime}ms</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => runSchemaSync()}
                        disabled={loading.sync}
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading.sync ? 'animate-spin' : ''}`} />
                        Sync Schema
                      </Button>
                      <Button
                        onClick={() => runBackup('full')}
                        disabled={loading.backup_full}
                        variant="outline"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Backup Now
                      </Button>
                      <Button
                        onClick={() => setActiveTab('logs')}
                        variant="outline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Logs
                      </Button>
                      <Button
                        onClick={() => setActiveTab('secrets')}
                        variant="outline"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Manage Secrets
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={storageFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStorageFilter('all')}
                    className="text-xs"
                  >
                    All Files
                  </Button>
                  <Button
                    variant={storageFilter === 'images' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStorageFilter('images')}
                    className="text-xs"
                  >
                    Images
                  </Button>
                  <Button
                    variant={storageFilter === 'documents' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStorageFilter('documents')}
                    className="text-xs"
                  >
                    Documents
                  </Button>
                  <Button
                    variant={storageFilter === 'backups' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStorageFilter('backups')}
                    className="text-xs"
                  >
                    Backups
                  </Button>
                </div>
                <Button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const formData = new FormData()
                      formData.append('file', file)
                      try {
                        const response = await fetch('/api/cloud/storage', {
                          method: 'POST',
                          body: formData
                        })
                        const result = await response.json()
                        if (result.success) {
                          toast.success('File upload started')
                          fetchStorageFiles()
                        } else {
                          toast.error(result.error || 'Failed to upload file')
                        }
                      } catch (error) {
                        toast.error('Failed to upload file')
                      }
                    }
                  }}
                />
              </div>

              {/* Storage Files Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storageFiles.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{file.icon}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{file.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{file.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => copyToClipboard(file.path)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600"
                          onClick={() => deleteStorageFile(file.id)}
                          disabled={loading[`delete_file_${file.id}`]}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{file.size}</span>
                      <span>{new Date(file.modified).toLocaleString()}</span>
                    </div>
                    {file.fileCount && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {file.fileCount} files
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Storage Usage Bar */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Usage</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {cloudStatus?.resources.storage.used}% of {cloudStatus?.resources.storage.total} {cloudStatus?.resources.storage.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${cloudStatus?.resources.storage.used || 0}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Functions Tab */}
          <TabsContent value="functions" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={functionFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFunctionFilter('all')}
                    className="text-xs"
                  >
                    All Functions
                  </Button>
                  <Button
                    variant={functionFilter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFunctionFilter('active')}
                    className="text-xs"
                  >
                    Active
                  </Button>
                  <Button
                    variant={functionFilter === 'inactive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFunctionFilter('inactive')}
                    className="text-xs"
                  >
                    Inactive
                  </Button>
                </div>
                <Button className="bg-sky-600 hover:bg-sky-700 text-white text-xs">
                  <Plus className="h-4 w-4 mr-1" />
                  Deploy New
                </Button>
              </div>

              {/* Functions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {functions.map((func, index) => (
                  <motion.div
                    key={func.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                          <Code className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{func.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{func.runtime}</p>
                        </div>
                      </div>
                      <Badge variant={func.status === 'active' ? 'default' : 'secondary'}>
                        {func.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{func.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Memory:</span>
                        <span className="ml-2 font-medium">{func.memory}MB</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Timeout:</span>
                        <span className="ml-2 font-medium">{func.timeout}s</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Invocations:</span>
                        <span className="ml-2 font-medium">{func.invocations.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Errors:</span>
                        <span className="ml-2 font-medium text-red-600">{func.errors}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Avg Latency:</span>
                        <span className="ml-2 font-medium">{func.avgLatency}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Last Deployed:</span>
                        <span className="ml-2 font-medium">{new Date(func.lastDeployed).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => deployFunction(func.id)}
                        disabled={loading[`deploy_${func.id}`]}
                        className="bg-sky-600 hover:bg-sky-700 text-white text-xs"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Deploy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testFunction(func.id)}
                        disabled={loading[`test_${func.id}`]}
                        className="text-xs"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(func.endpoint)}
                        className="text-xs"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy URL
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Usage & Optimization</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monitor and optimize your AI model usage</p>
              </div>

              {/* AI Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">15,420</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2,847,500 tokens</p>
                    <p className="text-sm font-medium text-sky-600">$142.38</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">145ms</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg response time</p>
                    <p className="text-sm font-medium text-emerald-600">99.7% success rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">$582</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Potential monthly savings</p>
                    <p className="text-sm font-medium text-amber-600">3 recommendations</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">AI Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/cloud/ai', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'optimize' })
                          })
                          const result = await response.json()
                          if (result.success) {
                            toast.success('AI optimization started')
                          } else {
                            toast.error(result.error || 'Failed to start optimization')
                          }
                        } catch (error) {
                          toast.error('Failed to start optimization')
                        }
                      }}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Optimize AI Usage
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/cloud/ai', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'clear_cache' })
                          })
                          const result = await response.json()
                          if (result.success) {
                            toast.success('AI cache cleared')
                          } else {
                            toast.error(result.error || 'Failed to clear cache')
                          }
                        } catch (error) {
                          toast.error('Failed to clear cache')
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={logFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLogFilter('all')}
                    className="text-xs"
                  >
                    All Logs
                  </Button>
                  <Button
                    variant={logFilter === 'error' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLogFilter('error')}
                    className="text-xs"
                  >
                    Errors
                  </Button>
                  <Button
                    variant={logFilter === 'warn' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLogFilter('warn')}
                    className="text-xs"
                  >
                    Warnings
                  </Button>
                  <Button
                    variant={logFilter === 'info' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLogFilter('info')}
                    className="text-xs"
                  >
                    Info
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="text-xs w-32"
                  />
                  <Button
                    onClick={clearLogs}
                    disabled={loading.clearLogs}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Logs Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Timestamp</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Level</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Service</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Message</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Request ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={
                                log.level === 'error' ? 'destructive' :
                                log.level === 'warn' ? 'secondary' :
                                log.level === 'info' ? 'default' : 'outline'
                              }>
                                {log.level}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{log.service}</td>
                            <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">{log.message}</td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{log.requestId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogPage(Math.max(1, logPage - 1))}
                  disabled={logPage === 1}
                  className="text-xs"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Page {logPage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogPage(logPage + 1)}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Secrets Tab */}
          <TabsContent value="secrets" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Secrets Management</h3>
                <Dialog open={showAddSecret} onOpenChange={setShowAddSecret}>
                  <DialogTrigger asChild>
                    <Button className="bg-sky-600 hover:bg-sky-700 text-white text-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Secret
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Secret</DialogTitle>
                      <DialogDescription>
                        Add a new secret to your cloud environment.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={newSecret.name}
                          onChange={(e) => setNewSecret({ ...newSecret, name: e.target.value })}
                          placeholder="SECRET_NAME"
                        />
                      </div>
                      <div>
                        <Label htmlFor="value">Value</Label>
                        <Input
                          id="value"
                          type="password"
                          value={newSecret.value}
                          onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                          placeholder="Secret value"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newSecret.description}
                          onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddSecret(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={addNewSecret}
                          disabled={loading.addSecret}
                          className="bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          {loading.addSecret ? 'Adding...' : 'Add Secret'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Edit Secret Modal */}
              <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Secret</DialogTitle>
                    <DialogDescription>
                      Update the value or description for this secret.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-secret-name">Secret Name</Label>
                      <Input
                        id="edit-secret-name"
                        value={editingSecret?.name || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-secret-value">Secret Value</Label>
                      <Textarea
                        id="edit-secret-value"
                        value={editingSecret?.value || ''}
                        onChange={(e) => setEditingSecret(prev => prev ? { ...prev, value: e.target.value } : null)}
                        placeholder="Enter secret value"
                        rows={3}
                        className="font-mono"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-secret-description">Description (Optional)</Label>
                      <Input
                        id="edit-secret-description"
                        value={editingSecret?.description || ''}
                        onChange={(e) => setEditingSecret(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeEditModal}>
                      Cancel
                    </Button>
                    <Button onClick={saveEditedSecret} disabled={loading[`edit_${editingSecret?.id}`]}>
                      {loading[`edit_${editingSecret?.id}`] ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(editingSecret?.value || '')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Secrets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {secrets.map((secret) => (
                  <motion.div
                    key={secret.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                          <Key className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{secret.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{secret.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type={showValues[secret.id] ? 'text' : 'password'}
                          value={showValues[secret.id] ? secret.value : '••••••••••••'}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(secret.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showValues[secret.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(secret.value)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(secret)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Last rotated: {new Date(secret.lastRotated).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => rotateSecret(secret.id)}
                          disabled={loading[`rotate_${secret.id}`]}
                          variant="outline"
                          className="text-xs"
                        >
                          <RotateCw className="h-4 w-4 mr-1" />
                          Rotate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deleteSecret(secret.id)}
                          disabled={loading[`delete_${secret.id}`]}
                          variant="outline"
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Test Button */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">🧪 Test Automation</h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">Click to test if automation buttons are working</p>
                  </div>
                  <Button
                    onClick={() => {
                      console.log('Test button clicked!')
                      console.log('Current automation tasks:', automationTasks)
                      toast.success('🧪 Test Button Working!', {
                        description: 'Automation section is loaded and functional',
                        duration: 3000,
                      })
                      
                      // Test direct API call
                      fetch('/api/cloud/automation/run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'run', taskId: 'backup-now' })
                      }).then(response => response.json())
                      .then(result => {
                        console.log('Direct API test result:', result)
                        if (result.success) {
                          toast.success('✅ Direct API Test Success!', {
                            description: result.message || 'API call successful',
                            duration: 3000,
                          })
                        } else {
                          toast.error('❌ Direct API Test Failed', {
                            description: result.error || 'API call failed',
                            duration: 3000,
                          })
                        }
                      })
                      .catch(error => {
                        console.error('Direct API test error:', error)
                        toast.error('❌ Direct API Test Error', {
                          description: 'Network error occurred',
                          duration: 3000,
                        })
                      })
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Test Direct API
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automation Tasks</h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => runBackup('full')}
                    disabled={loading.backup_full}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-sm"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Backup Now
                  </Button>
                  <Button
                    onClick={runSchemaSync}
                    disabled={loading.sync}
                    variant="outline"
                    className="text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading.sync ? 'animate-spin' : ''}`} />
                    Run Auto-Sync
                  </Button>
                </div>
              </div>

              {/* Automation Tasks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {automationTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                          <Settings2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{task.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{task.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={task.enabled}
                        onCheckedChange={() => toggleAutomationTask(task.id)}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <Badge variant={task.status === 'success' ? 'default' : 'destructive'}>
                          {task.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
                        <span className="font-medium">{task.successRate}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Last Run:</span>
                        <span className="font-medium">{task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                        <span className="font-medium">{task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Not Scheduled'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Total Runs:</span>
                        <span className="font-medium">{task.totalRuns.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            console.log(`Testing ${task.name} button...`)
                            runAutomationTask(task.id)
                          }}
                          disabled={loading[`run_${task.id}`] || !task.enabled}
                          className="bg-sky-600 hover:bg-sky-700 text-white text-xs mr-2"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Test {task.name}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => runAutomationTask(task.id)}
                          disabled={loading[`run_${task.id}`] || !task.enabled}
                          className="bg-sky-600 hover:bg-sky-700 text-white text-xs"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(task.schedule)}
                          className="text-xs"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Backup & Restore Section */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Backup & Restore</CardTitle>
                  <CardDescription>
                    Manage your backups and restore previous versions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => runBackup('full')}
                      disabled={loading.backup_full}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Create Full Backup
                    </Button>
                    <Button
                      onClick={() => runBackup('incremental')}
                      disabled={loading.backup_incremental}
                      variant="outline"
                    >
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Create Incremental Backup
                    </Button>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Last backup completed 1 hour ago. Next automatic backup scheduled in 23 hours.
                    </AlertDescription>
                  </Alert>

                  {/* Restore Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Restore from Backup</h4>
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="backup-file-input"
                          accept=".tar.gz,.zip,.sql"
                          onChange={(e) => handleFileUpload(e)}
                          className="hidden"
                        />
                        <label
                          htmlFor="backup-file-input"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Click to upload backup file or drag and drop
                          </span>
                          <span className="text-xs text-gray-500">
                            Supports: .tar.gz, .zip, .sql files
                          </span>
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-secrets"
                            checked={includeSecretsInRestore}
                            onChange={(e) => setIncludeSecretsInRestore(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="include-secrets" className="text-sm text-gray-700 dark:text-gray-300">
                            Include secrets in restore
                          </label>
                        </div>
                        
                        <Button
                          onClick={handleRestore}
                          disabled={!selectedBackupFile || loading.restore}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          {loading.restore ? 'Restoring...' : 'Restore Backup'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundaryClass>
  )
}