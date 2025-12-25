'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Check, AlertCircle, Loader2, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function QuickBackup() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  const performQuickBackup = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'quick-backup',
          useGit: true,
          pushToGitHub: false,
          syncFromGitHub: false,  // Quick backup doesn't sync from GitHub
          overrideLatest: false    // Quick backup doesn't override
        })
      })

      const data = await response.json()
      
      if (data.success) {
        let message = `✅ Backup successful! ${data.filesCount || 0} files committed locally.`
        
        if (data.commitHash === 'no-changes') {
          message = 'ℹ️ No changes to commit - working tree is clean'
        } else if (data.commitHash && data.commitHash !== 'unknown') {
          message += ` Commit: ${data.commitHash.slice(0, 7)}`
        }
        
        if (data.details?.repositoryCreated) {
          message += ' (New repository initialized)'
        }
        
        setResult({
          type: 'success',
          message
        })
      } else {
        setResult({
          type: 'error',
          message: `❌ Backup failed: ${data.error || 'Unknown error'}`
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: '❌ Network error or backup service unavailable'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold text-blue-900">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Github className="h-6 w-6" />
          </motion.div>
          Quick Git Backup
        </CardTitle>
        <p className="text-sm text-blue-700">Instant local backup without GitHub configuration</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={performQuickBackup}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Create Quick Backup
              </>
            )}
          </Button>
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Alert className={`${
              result.type === 'success' ? 'border-green-200 bg-green-50' :
              result.type === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-center gap-2">
                {result.type === 'success' && <Check className="h-4 w-4 text-green-600" />}
                {result.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                {result.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-600" />}
                <AlertDescription className={`${
                  result.type === 'success' ? 'text-green-800' :
                  result.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {result.message}
                </AlertDescription>
              </div>
            </Alert>
          </motion.div>
        )}

        <div className="text-xs text-blue-600 space-y-1">
          <p>• Creates instant local Git backup</p>
          <p>• No GitHub configuration required</p>
          <p>• Auto-commits all changes</p>
          <p>• Use GitHub Integration for cloud backup</p>
          <p>• GitHub Integration: Syncs from GitHub & overrides</p>
        </div>
      </CardContent>
    </Card>
  )
}