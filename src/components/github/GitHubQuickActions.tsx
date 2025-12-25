'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Upload, Settings, Shield, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import GitHubIntegration from './GitHubIntegration'

export default function GitHubQuickActions() {
  const [showIntegration, setShowIntegration] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // Quick backup using git command
  const handleQuickBackup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/github/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'quick-backup',
          useGit: true 
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Backup completed! Commit: ${data.commitHash}` 
        })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Backup failed' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Message Display */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-24 right-4 z-50 w-80"
        >
          <Alert className={`${
            message.type === 'success' ? 'border-green-500 bg-green-50' :
            message.type === 'error' ? 'border-red-500 bg-red-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <AlertCircle className={`h-4 w-4 ${
              message.type === 'success' ? 'text-green-600' :
              message.type === 'error' ? 'text-red-600' :
              'text-blue-600'
            }`} />
            <AlertDescription className={`text-sm ${
              message.type === 'success' ? 'text-green-800' :
              message.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {message.text}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Quick Actions Floating Widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 right-4 z-40"
      >
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 p-4 w-64">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 mb-3">
              <Github className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900 text-sm">Quick Git Backup</h3>
              <Shield className="h-4 w-4 text-green-500 ml-auto" />
            </div>
            
            <p className="text-xs text-gray-600 mb-4">
              Fast local git backup with one click
            </p>

            <div className="space-y-2">
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleQuickBackup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-2" />
                )}
                Quick Backup
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowIntegration(true)}
              >
                <Settings className="h-3 w-3 mr-2" />
                GitHub Settings
              </Button>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Zap className="h-3 w-3" />
                  <span>Local git backup</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Full Integration Modal */}
      {showIntegration && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">GitHub Integration</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowIntegration(false)}
                >
                  ×
                </Button>
              </div>
              <GitHubIntegration isOpen={showIntegration} onOpenChange={setShowIntegration} />
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}