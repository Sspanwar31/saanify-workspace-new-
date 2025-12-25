'use client'

import { useState } from 'react'
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
  FileText,
  ExternalLink,
  RotateCcw,
  Shield,
  Zap,
  Database,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

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

export default function GitHubToggle() {
  const [isOpen, setIsOpen] = useState(false)
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

  // Load config from localStorage
  useState(() => {
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

  const handleOpenGitHub = () => {
    // Open GitHub integration in a new window
    const width = 900
    const height = 700
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    
    const newWindow = window.open(
      '',
      'githubIntegration',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    )
    
    if (newWindow) {
      // Open the integration component in the new window
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>GitHub Integration - Saanify</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 2rem; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔗 Saanify GitHub Integration</div>
              <p class="text-gray-600">Manage your GitHub repository integration</p>
            </div>
            <div id="integration-content">
              <p>Loading GitHub integration...</p>
            </div>
          </div>
          <script>
            // Load the integration component
            fetch('/api/github-integration-component')
              .then(response => response.text())
              .then(html => {
                document.getElementById('integration-content').innerHTML = html;
              })
              .catch(error => {
                document.getElementById('integration-content').innerHTML = 
                  '<div class="text-red-600">Failed to load GitHub integration. Please try again.</div>';
              });
          </script>
        </body>
        </html>
      `)
      newWindow.document.close()
    } else {
      // Fallback: open in same window
      setIsOpen(true)
    }
  }

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
      const response = await fetch('/api/github/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'backup', 
          config,
          message: `🚀 Auto Backup: ${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
        })
      })

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
      if (!silent) setMessage({ type: 'error', text: '❌ Error creating backup' })
    } finally {
      if (!silent) setIsLoading(false)
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

      const data = await response.json()
      
      if (data.success) {
        setBackupHistory(data.commits)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load history' })
      }
    } catch (error) {
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

  useState(() => {
    if (showHistory && isConfigured) {
      loadBackupHistory()
    }
  }, [showHistory, isConfigured])

  return (
    <>
      {/* Fixed GitHub Button - Bottom Right with Better Positioning */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleOpenGitHub}
            size="lg"
            className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 border border-slate-700 relative group"
          >
            <Github className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            GitHub
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse" />
          </Button>
        </motion.div>
      </div>

      {/* GitHub Integration Dialog - Fallback */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
              <Github className="h-6 w-6 text-gray-700" />
              GitHub Integration
              <Badge className="ml-auto" variant={isConfigured ? "default" : "secondary"}>
                {isConfigured ? 'Connected' : 'Not Connected'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Configure GitHub repository integration for automated backups and code synchronization
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Left Column - Status & Quick Actions */}
            <div className="space-y-4">
              {/* Connection Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
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
                      className="shrink-0"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {showSettings ? 'Hide' : 'Settings'}
                    </Button>
                  </div>

                  {isConfigured && (
                    <div className="text-sm">
                      <Badge variant="outline" className="text-xs">
                        {config.owner}/{config.repo}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {isConfigured && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => createBackup(false)}
                      disabled={isLoading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Create Backup
                    </Button>
                    <Button
                      onClick={() => restoreFromBackup()}
                      disabled={isRestoring}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Restore from Backup
                    </Button>
                    <Button
                      onClick={() => setShowHistory(!showHistory)}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <History className="h-4 w-4 mr-2" />
                      View Backup History
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-owner">Repository Owner</Label>
                  <Input
                    id="github-owner"
                    type="text"
                    value={config.owner}
                    onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
                    placeholder="e.g., username"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github-repo">Repository Name</Label>
                  <Input
                    id="github-repo"
                    type="text"
                    value={config.repo}
                    onChange={(e) => setConfig(prev => ({ ...prev, repo: e.target.value }))}
                    placeholder="e.g., my-repo"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github-token">Personal Access Token</Label>
                  <Input
                    id="github-token"
                    type="password"
                    value={config.token}
                    onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                    placeholder="ghp_... or github_pat_..."
                    className="w-full font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github-branch">Default Branch</Label>
                  <Select value={config.branch} onValueChange={(value) => setConfig(prev => ({ ...prev, branch: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">main</SelectItem>
                      <SelectItem value="master">master</SelectItem>
                      <SelectItem value="develop">develop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={validateConfig}
                    disabled={isValidatingConfig}
                    className="flex-1"
                  >
                    {isValidatingConfig ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Validate
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={saveConfig}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 right-4 z-50 max-w-sm"
              >
                <Alert className={`${
                  message.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
                  message.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                  'border-blue-200 bg-blue-50 text-blue-800'
                }`}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}