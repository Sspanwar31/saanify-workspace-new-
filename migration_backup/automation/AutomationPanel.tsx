'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, RefreshCw, CheckCircle, AlertCircle, Settings, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface SyncStep {
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
}

interface TestResult {
  name: string
  success: boolean
  message: string
}

interface AutomationResponse {
  success: boolean
  message: string
  data?: {
    steps?: SyncStep[]
    testResults?: TestResult[]
    summary?: any
  }
  error?: string
}

export default function AutomationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [syncResult, setSyncResult] = useState<AutomationResponse | null>(null)
  const [testResult, setTestResult] = useState<AutomationResponse | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      toast.loading('Starting automation sync...', { id: 'automation-sync' })

      const response = await fetch('/api/automation/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result: AutomationResponse = await response.json()

      if (result.success) {
        toast.success('✅ Sync Complete!', {
          id: 'automation-sync',
          description: result.message,
          duration: 5000
        })
      } else {
        toast.error('❌ Sync Failed', {
          id: 'automation-sync',
          description: result.error || result.message,
          duration: 5000
        })
      }

      setSyncResult(result)
    } catch (error: any) {
      toast.error('❌ Sync Error', {
        id: 'automation-sync',
        description: error.message || 'Network error occurred',
        duration: 5000
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      toast.loading('Running system tests...', { id: 'automation-test' })

      const response = await fetch('/api/automation/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result: AutomationResponse = await response.json()

      if (result.success) {
        toast.success('✅ Tests Complete!', {
          id: 'automation-test',
          description: result.message,
          duration: 5000
        })
      } else {
        toast.error('❌ Tests Failed', {
          id: 'automation-test',
          description: result.error || result.message,
          duration: 5000
        })
      }

      setTestResult(result)
    } catch (error: any) {
      toast.error('❌ Test Error', {
        id: 'automation-test',
        description: error.message || 'Network error occurred',
        duration: 5000
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'running': return 'text-blue-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="bg-background/95 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Database className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Automation</span>
          <RefreshCw className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 left-0 w-96 max-h-[80vh] overflow-y-auto"
          >
            <Card className="bg-background/95 backdrop-blur-sm border-2 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backend Automation
                </CardTitle>
                <CardDescription>
                  Server-side automation using Service Role Key
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Security Notice */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>🔒 Secure:</strong> Uses backend Service Role Key only.
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        🔁 Sync Schema
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleTest}
                    disabled={isTesting}
                    variant="outline"
                    className="w-full"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        🧪 Test System
                      </>
                    )}
                  </Button>
                </div>

                {/* Sync Results */}
                {syncResult && syncResult.data?.steps && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">📋 Sync Steps</h4>
                    <div className="space-y-2">
                      {syncResult.data.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <div className={getStatusColor(step.status)}>
                            {getStatusIcon(step.status)}
                          </div>
                          <span className="flex-1">{step.name}</span>
                          {step.status === 'completed' && (
                            <Badge variant="secondary" className="text-xs">
                              Done
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Results */}
                {testResult && testResult.data?.testResults && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">🧪 Test Results</h4>
                    <div className="space-y-2">
                      {testResult.data.testResults.map((test, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          {test.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="flex-1">{test.name}</span>
                          {test.success && (
                            <Badge variant="secondary" className="text-xs">
                              Pass
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    {testResult.data?.summary && (
                      <div className="mt-3 p-2 bg-muted rounded text-xs">
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="font-medium">
                            {testResult.data.summary.successRate}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">🚀 Features</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Backend-only Service Role access
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      No client-side credentials
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Schema synchronization
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      System health monitoring
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}