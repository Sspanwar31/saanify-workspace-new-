'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Github, 
  ExternalLink,
  Code,
  Star,
  GitBranch,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function GitHubIntegrationCard() {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<'Not Connected' | 'Connecting' | 'Connected' | 'Error'>('Not Connected')
  const [githubUrl, setGithubUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    if (!githubUrl || !accessToken) {
      toast.error("Missing Credentials", {
        description: "Please provide GitHub URL and Access Token",
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    setStatus('Connecting')

    try {
      const res = await fetch('/api/integrations/github/connect', {
        method: 'POST',
        body: JSON.stringify({ githubUrl, accessToken }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const result = await res.json()
        setStatus('Connected')
        setIsOpen(false)
        toast.success("🎉 GitHub Connected!", {
          description: result.message || "Repository integration successful",
          duration: 5000,
        })
      } else {
        const error = await res.json()
        setStatus('Error')
        toast.error("❌ Connection Failed", {
          description: error.error || "Failed to connect to GitHub",
          duration: 5000,
        })
      }
    } catch (err: any) {
      setStatus('Error')
      toast.error("❌ Connection Error", {
        description: err.message || "Failed to connect to GitHub",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'Connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'Connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Github className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    const variants = {
      'Not Connected': 'secondary',
      'Connecting': 'default',
      'Connected': 'default' as const,
      'Error': 'destructive'
    }
    
    return (
      <Badge variant={variants[status] as any} className="ml-auto">
        {status}
      </Badge>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      {/* Compact Button */}
      <Card className="p-4 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Github className="h-4 w-4 mr-2" />
          GitHub Integration
          {isOpen ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>
      </Card>

      {/* Expanded Configuration Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-3"
          >
            <Card className="p-6 border-2 border-primary/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">GitHub Integration</h3>
                    <p className="text-sm text-muted-foreground">Connect your repository</p>
                  </div>
                </div>
                {getStatusBadge()}
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your GitHub repository for automated backups, version control, and deployment features.
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="github-url">Repository URL</Label>
                    <Input
                      id="github-url"
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repo"
                      className="w-full font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="access-token">Access Token</Label>
                    <div className="relative">
                      <Input
                        id="access-token"
                        type={showToken ? "text" : "password"}
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full font-mono text-sm pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleConnect}
                    disabled={isLoading || status === 'Connecting'}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Github className="h-4 w-4 mr-2" />
                        Connect Repository
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-1 mb-2">
                    <Code className="h-3 w-3" />
                    <span className="font-medium">Features:</span>
                  </div>
                  <ul className="space-y-1 ml-4">
                    <li>• Automated backups to GitHub</li>
                    <li>• Version control integration</li>
                    <li>• Deployment workflows</li>
                    <li>• Issue tracking sync</li>
                    <li>• Pull request automation</li>
                  </ul>
                </div>

                {status === 'Connected' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-3 border-t space-y-2"
                  >
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Star className="h-4 w-4" />
                      <span>Repository Connected</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <GitBranch className="h-4 w-4" />
                      <span>Branch Sync Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Package className="h-4 w-4" />
                      <span>Automated Backups</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}