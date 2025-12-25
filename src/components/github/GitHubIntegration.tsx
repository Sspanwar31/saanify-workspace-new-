'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Github, 
  Upload, 
  Download, 
  Settings, 
  History, 
  Check, 
  X, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink,
  Zap,
  Activity,
  Shield,
  Database,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Cloud
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch: string
}

interface BackupHistory {
  sha: string
  message: string
  author: string
  date: string
  url: string
  timestamp: string
}

interface GitHubRepo {
  id: number
  name: string
  fullName: string
  private: boolean
  url: string
  description: string
  createdAt: string
  updatedAt: string
}

interface GitHubIntegrationProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function GitHubIntegration({ isOpen, onOpenChange }: GitHubIntegrationProps) {
  const [config, setConfig] = useState<GitHubConfig>({
    owner: '',
    repo: '',
    token: '',
    branch: 'main'
  })
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isValidatingConfig, setIsValidatingConfig] = useState(false)
  const [autoBackup, setAutoBackup] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('github-config')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      setConfig(parsed)
      setIsConfigured(true)
    }
    
    const savedAutoBackup = localStorage.getItem('github-auto-backup')
    if (savedAutoBackup) {
      setAutoBackup(JSON.parse(savedAutoBackup))
    }
    
    const savedLastBackup = localStorage.getItem('github-last-backup')
    if (savedLastBackup) {
      setLastBackupTime(savedLastBackup)
    }
  }, [])

  // Auto backup interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (autoBackup && isConfigured) {
      interval = setInterval(() => {
        createBackup(true) // silent backup
      }, 5 * 60 * 1000) // Every 5 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoBackup, isConfigured])

  // Reset configuration
  const resetConfig = () => {
    if (window.confirm('⚠️ Are you sure you want to reset all GitHub configuration?')) {
      setConfig({
        owner: '',
        repo: '',
        token: '',
        branch: 'main'
      })
      setIsConfigured(false)
      setShowSettings(false)
      setRepos([])
      setBackupHistory([])
      setShowHistory(false)
      setAutoBackup(false)
      setLastBackupTime(null)
      localStorage.removeItem('github-config')
      localStorage.removeItem('github-auto-backup')
      localStorage.removeItem('github-last-backup')
      setMessage({ type: 'info', text: '🔄 All configuration has been reset' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Validate configuration
  const validateConfig = async () => {
    if (!config.owner || !config.repo || !config.token) {
      setMessage({ type: 'error', text: '⚠️ Please fill all fields: Owner, Repo, and Token' })
      return
    }

    setIsValidatingConfig(true)
    try {
      // Determine token type and use appropriate auth method
      const isClassicToken = config.token.startsWith('ghp_')
      const isFineGrainedToken = config.token.startsWith('github_pat_')
      
      if (!isClassicToken && !isFineGrainedToken) {
        setMessage({ 
          type: 'error', 
          text: '❌ Invalid token format. Token should start with "ghp_" (classic) or "github_pat_" (fine-grained)' 
        })
        return
      }

      const repoResponse = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
        headers: {
          'Authorization': `${isClassicToken ? 'token' : 'Bearer'} ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      if (repoResponse.ok) {
        const repoData = await repoResponse.json()
        setMessage({ 
          type: 'success', 
          text: `✅ Validation successful! Found "${repoData.full_name}" repository` 
        })
        localStorage.setItem('github-config', JSON.stringify(config))
        setIsConfigured(true)
      } else {
        const errorData = await repoResponse.json().catch(() => ({}))
        let errorMessage = errorData.message || 'Repository access denied'
        
        // Provide more specific error messages
        if (repoResponse.status === 401) {
          errorMessage = '❌ Invalid or expired token. Please check your GitHub personal access token'
        } else if (repoResponse.status === 403) {
          errorMessage = '❌ Token lacks required permissions. Please ensure token has "repo" scope'
        } else if (repoResponse.status === 404) {
          errorMessage = `❌ Repository "${config.owner}/${config.repo}" not found or you don't have access`
        }
        
        setMessage({ 
          type: 'error', 
          text: `❌ Validation failed: ${errorMessage}` 
        })
      }
    } catch (error) {
      console.error('GitHub validation error:', error)
      setMessage({ type: 'error', text: '🌐 Network error - please check your internet connection' })
    } finally {
      setIsValidatingConfig(false)
    }
  }

  // Save config to localStorage
  const saveConfig = () => {
    if (!config.owner || !config.repo || !config.token) {
      setMessage({ type: 'error', text: '⚠️ Please fill all fields: Owner, Repo, and Token' })
      return
    }
    
    localStorage.setItem('github-config', JSON.stringify(config))
    setIsConfigured(true)
    setShowSettings(false)
    setMessage({ type: 'success', text: '💾 Configuration saved successfully!' })
    setTimeout(() => setMessage(null), 3000)
  }

  // Create backup
  const createBackup = async (silent = false) => {
    if (!isConfigured) {
      if (!silent) setMessage({ type: 'error', text: '⚠️ Please configure GitHub settings first' })
      return
    }

    if (!silent) setIsLoading(true)
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch('/api/github/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'backup', 
          config,
          message: `🚀 Auto Backup: ${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP error! status: ${response.status}`
        
        // Provide more specific error messages
        if (response.status === 502) {
          errorMessage = '⏰ Backup timed out - the repository is too large. Try using "Quick Git Backup" instead.'
        } else if (response.status === 504) {
          errorMessage = '⏰ Gateway timeout - the server took too long to respond. Please try again.'
        } else if (errorText) {
          errorMessage = `Server error: ${errorText}`
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.success) {
        const now = new Date().toISOString()
        setLastBackupTime(now)
        localStorage.setItem('github-last-backup', now)
        
        if (!silent) {
          setMessage({ 
            type: 'success', 
            text: `✅ Backup complete! ${data.filesCount || 0} files uploaded to GitHub` 
          })
        }
        if (showHistory) {
          loadBackupHistory()
        }
      } else {
        if (!silent) setMessage({ type: 'error', text: data.error || '❌ Backup failed' })
      }
    } catch (error) {
      console.error('Backup error:', error)
      
      let errorMessage = '❌ Error creating backup'
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '⏰ Backup timed out after 60 seconds. Repository may be too large - try using "Quick Git Backup" instead.'
        } else if (error.message.includes('502')) {
          errorMessage = '⏰ Backup operation timed out. Please try "Quick Git Backup" for faster results.'
        } else if (error.message.includes('504')) {
          errorMessage = '⏰ Gateway timeout. The server took too long to respond. Please try again.'
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = '🌐 Network error. Please check your internet connection and try again.'
        } else {
          errorMessage = `❌ ${error.message}`
        }
      }
      
      if (!silent) setMessage({ type: 'error', text: errorMessage })
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  // Quick Git Backup (faster, uses local git commands)
  const createQuickGitBackup = async () => {
    if (!isConfigured) {
      setMessage({ type: 'error', text: '⚠️ Please configure GitHub settings first' })
      return
    }

    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for quick backup

      const response = await fetch('/api/github/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'quick-backup', 
          config,
          useGit: true,
          pushToGitHub: true
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Quick backup failed: ${errorText || response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        const now = new Date().toISOString()
        setLastBackupTime(now)
        localStorage.setItem('github-last-backup', now)
        
        setMessage({ 
          type: 'success', 
          text: `⚡ Quick backup complete! Changes pushed to GitHub` 
        })
        
        if (showHistory) {
          loadBackupHistory()
        }
      } else {
        setMessage({ type: 'error', text: data.error || '❌ Quick backup failed' })
      }
    } catch (error) {
      console.error('Quick backup error:', error)
      
      let errorMessage = '❌ Error creating quick backup'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '⏰ Quick backup timed out. Please try again.'
        } else {
          errorMessage = `❌ ${error.message}`
        }
      }
      
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  // Restore from backup
  const restoreFromBackup = async () => {
    if (!isConfigured) {
      setMessage({ type: 'error', text: '⚠️ Please configure GitHub settings first' })
      return
    }

    if (!window.confirm('⚠️ This will restore your project from the latest GitHub backup. Any unsaved changes will be lost. Continue?')) {
      return
    }

    setIsRestoring(true)
    try {
      const response = await fetch('/api/github/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'restore', 
          config 
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: '🔄 Project restored successfully! Reloading page...' 
        })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || '❌ Restore failed' })
      }
    } catch (error) {
      console.error('Restore error:', error)
      setMessage({ type: 'error', text: '❌ Error restoring from backup' })
    } finally {
      setIsRestoring(false)
    }
  }

  // Load backup history
  const loadBackupHistory = async () => {
    if (!isConfigured) return

    try {
      const response = await fetch('/api/github/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: config.owner,
          repo: config.repo,
          token: config.token,
          branch: config.branch
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setBackupHistory(data.commits)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load history' })
      }
    } catch (error) {
      console.error('Load backup history error:', error)
      setMessage({ type: 'error', text: 'Failed to load backup history' })
    }
  }

  // Toggle auto backup
  const toggleAutoBackup = (enabled: boolean) => {
    setAutoBackup(enabled)
    localStorage.setItem('github-auto-backup', JSON.stringify(enabled))
    
    if (enabled) {
      setMessage({ type: 'success', text: '🟢 Auto backup enabled - every 5 minutes' })
      // Create initial backup
      createBackup(true)
    } else {
      setMessage({ type: 'info', text: '🔴 Auto backup disabled' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  // Format last backup time
  const formatLastBackupTime = () => {
    if (!lastBackupTime) return 'Never'
    
    try {
      const date = new Date(lastBackupTime)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min ago`
      
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      
      return date.toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  useEffect(() => {
    if (showHistory && isConfigured) {
      loadBackupHistory()
    }
  }, [showHistory, isConfigured])

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white border-0 shadow-2xl">
          <DialogHeader className="border-b border-slate-200 pb-6 bg-gradient-to-r from-slate-100 to-white">
            <DialogTitle className="flex items-center justify-between text-2xl font-bold text-slate-900">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Github className="h-8 w-8 text-slate-700" />
                </motion.div>
                <span>GitHub Integration</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  className={`text-sm px-3 py-1 ${
                    isConfigured 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0' 
                      : 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-0'
                  }`}
                >
                  {isConfigured ? 'Connected' : 'Not Connected'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Configure GitHub repository integration for automated backups and code synchronization
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            {/* Left Column - Status & Quick Actions */}
            <div className="xl:col-span-1 space-y-4">
              {/* Connection Status Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-blue-900">
                    <Activity className="h-5 w-5" />
                    Connection Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isConfigured ? (
                        <>
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-green-700 font-medium">Connected</span>
                        </>
                      ) : (
                        <>
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-red-700 font-medium">Not Configured</span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      className="shrink-0 border-blue-200 hover:bg-blue-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {showSettings ? 'Hide' : 'Settings'}
                    </Button>
                  </div>

                  {isConfigured && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-white border-blue-200">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {config.owner}/{config.repo}
                      </Badge>
                    </div>
                  )}

                  {/* Auto Backup Toggle */}
                  {isConfigured && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-cyan-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-900">Auto Backup</p>
                          <p className="text-xs text-blue-600">Every 5 minutes</p>
                        </div>
                      </div>
                      <Switch
                        checked={autoBackup}
                        onCheckedChange={toggleAutoBackup}
                        className="shrink-0"
                      />
                    </div>
                  )}

                  {/* Last Backup Info */}
                  {isConfigured && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-900">Last Backup</p>
                          <p className="text-xs text-green-600">{formatLastBackupTime()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              {isConfigured && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-purple-900">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-sm text-purple-600">
                      Choose between full backup (all files) or quick git backup (changes only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => createBackup(false)}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Backup...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Create Backup
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={createQuickGitBackup}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-green-200 hover:bg-green-50 text-green-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Quick Backup...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Quick Git Backup
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={restoreFromBackup}
                      disabled={isRestoring}
                      variant="outline"
                      className="w-full border-purple-200 hover:bg-purple-50 text-purple-700"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Restore Project
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setShowHistory(!showHistory)}
                      variant="outline"
                      className="w-full border-purple-200 hover:bg-purple-50 text-purple-700"
                    >
                      <History className="h-4 w-4 mr-2" />
                      View Repository
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Repository Info */}
              {isConfigured && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                      <Database className="h-5 w-5" />
                      Repository Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Repository:</span>
                      <Badge variant="outline" className="bg-white">
                        {config.owner}/{config.repo}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Branch:</span>
                      <Badge variant="outline" className="bg-white">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {config.branch}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800 border-0">
                        <Shield className="h-3 w-3 mr-1" />
                        Secured
                      </Badge>
                    </div>
                    <Separator />
                    <Button
                      onClick={resetConfig}
                      variant="outline"
                      size="sm"
                      className="w-full border-red-200 hover:bg-red-50 text-red-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset Configuration
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Middle Column - Settings */}
            <div className="xl:col-span-1">
              {showSettings && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-900">
                      <Settings className="h-5 w-5" />
                      GitHub Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner" className="text-sm font-medium text-amber-900">Repository Owner</Label>
                      <Input
                        id="owner"
                        placeholder="Sspanwar31"
                        value={config.owner}
                        onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
                        className="border-amber-200 focus:border-amber-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="repo" className="text-sm font-medium text-amber-900">Repository Name</Label>
                      <Input
                        id="repo"
                        placeholder="saanify-workspace"
                        value={config.repo}
                        onChange={(e) => setConfig(prev => ({ ...prev, repo: e.target.value }))}
                        className="border-amber-200 focus:border-amber-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="token" className="text-sm font-medium text-amber-900">Personal Access Token</Label>
                      <Input
                        id="token"
                        type="password"
                        placeholder="ghp_... or github_pat_..."
                        value={config.token}
                        onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                        className="border-amber-200 focus:border-amber-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="branch" className="text-sm font-medium text-amber-900">Default Branch</Label>
                      <Select value={config.branch} onValueChange={(value) => setConfig(prev => ({ ...prev, branch: value }))}>
                        <SelectTrigger className="border-amber-200 focus:border-amber-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">main</SelectItem>
                          <SelectItem value="master">master</SelectItem>
                          <SelectItem value="develop">develop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={validateConfig}
                        disabled={isValidatingConfig}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                      >
                        {isValidatingConfig ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Validate & Save
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Backup History */}
            <div className="xl:col-span-1">
              {showHistory && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-teal-900">
                      <History className="h-5 w-5" />
                      Backup History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {backupHistory.length > 0 ? (
                        backupHistory.map((backup, index) => (
                          <motion.div
                            key={backup.sha}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 bg-white rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer"
                            onClick={() => window.open(backup.url, '_blank')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-3 w-3 text-teal-600" />
                                <span className="text-sm font-medium text-teal-900">{backup.message}</span>
                              </div>
                              <ExternalLink className="h-3 w-3 text-teal-600" />
                            </div>
                            <div className="text-xs text-teal-600 mt-1">
                              {backup.author} • {backup.date}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-teal-600">
                          <Cloud className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No backup history available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
              >
                <Alert className={`max-w-md ${
                  message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                  message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  <AlertDescription className="text-sm font-medium">
                    {message.text}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}