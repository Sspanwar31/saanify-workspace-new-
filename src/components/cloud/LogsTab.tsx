'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Filter,
  Search,
  Pause,
  Play,
  Database,
  Shield,
  HardDrive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  module: 'db' | 'auth' | 'storage' | 'api' | 'system'
  message: string
  details?: any
}

interface LogFilter {
  level: string
  module: string
  search: string
}

export default function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLive, setIsLive] = useState(true)
  const [filter, setFilter] = useState<LogFilter>({
    level: 'all',
    module: 'all',
    search: ''
  })
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchLogs()
    if (isLive) {
      const interval = setInterval(fetchLogs, 5000) // Poll every 5 seconds for live updates
      return () => clearInterval(interval)
    }
  }, [isLive])

  useEffect(() => {
    applyFilters()
  }, [logs, filter])

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (logContainerRef.current && isLive) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, isLive])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/cloud/logs')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  const applyFilters = () => {
    let filtered = logs

    // Filter by level
    if (filter.level !== 'all') {
      filtered = filtered.filter(log => log.level === filter.level)
    }

    // Filter by module
    if (filter.module !== 'all') {
      filtered = filtered.filter(log => log.module === filter.module)
    }

    // Filter by search
    if (filter.search) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(filter.search.toLowerCase()) ||
        log.module.toLowerCase().includes(filter.search.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }

  const downloadLogs = () => {
    const logData = filteredLogs.map(log => 
      `${log.timestamp} [${log.level.toUpperCase()}] [${log.module.toUpperCase()}] ${log.message}`
    ).join('\n')

    const blob = new Blob([logData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supabase-logs-${new Date().toISOString().split('T')[0]}.log`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('📥 Logs Downloaded', {
      description: `Downloaded ${filteredLogs.length} log entries`,
      duration: 3000,
    })
  }

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/cloud/logs', {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('🗑️ Logs Cleared', {
          description: 'All logs have been cleared successfully',
          duration: 3000,
        })
        setLogs([])
        setFilteredLogs([])
      } else {
        toast.error('❌ Clear Failed', {
          description: data.error || 'Failed to clear logs',
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error('❌ Clear Error', {
        description: 'Network error occurred while clearing logs',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500 bg-red-50 border-red-200'
      case 'warn': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'info': return 'text-blue-500 bg-blue-50 border-blue-200'
      case 'debug': return 'text-gray-500 bg-gray-50 border-gray-200'
      default: return 'text-green-500 bg-green-50 border-green-200'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'warn': return <AlertCircle className="h-4 w-4" />
      case 'info': return <Info className="h-4 w-4" />
      case 'debug': return <Info className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'db': return <Database className="h-4 w-4" />
      case 'auth': return <Shield className="h-4 w-4" />
      case 'storage': return <HardDrive className="h-4 w-4" />
      case 'api': return <FileText className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'db': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'auth': return 'bg-green-100 text-green-800 border-green-200'
      case 'storage': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'api': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Live Log Viewer</h3>
          <p className="text-sm text-muted-foreground">
            Real-time logs from Supabase and API events
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={isLive ? 'bg-green-50 border-green-200' : ''}
          >
            {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadLogs}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            disabled={isLoading}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Level</label>
              <Select value={filter.level} onValueChange={(value) => setFilter(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Module</label>
              <Select value={filter.module} onValueChange={(value) => setFilter(prev => ({ ...prev, module: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="db">Database</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={fetchLogs}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {filteredLogs.filter(l => l.level === 'error').length}
                </p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">
                  {filteredLogs.filter(l => l.level === 'warn').length}
                </p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded">
                <Info className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">
                  {filteredLogs.filter(l => l.level === 'info').length}
                </p>
                <p className="text-sm text-muted-foreground">Info</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded">
                <FileText className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-500">
                  {filteredLogs.length}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Log Entries ({filteredLogs.length})</span>
            {isLive && (
              <Badge variant="outline" className="animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={logContainerRef}
            className="h-96 overflow-y-auto space-y-2 font-mono text-sm bg-muted/30 p-4 rounded"
          >
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No logs found</p>
                <p className="text-sm">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 bg-background rounded border"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`p-1 rounded ${getLevelColor(log.level)}`}>
                        {getLevelIcon(log.level)}
                      </div>
                      <div className={`p-1 rounded ${getModuleColor(log.module)}`}>
                        {getModuleIcon(log.module)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.module.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm break-words">{log.message}</p>
                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Show Details
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}