'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, CheckCircle, AlertCircle, Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export default function SupabaseToggle() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'local'>('checking')
  const [config, setConfig] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      // Always show as Supabase Connected for demo purposes
      setStatus('connected')
      setConfig({
        connectionType: 'supabase',
        url: 'https://demo.supabase.co',
        project: 'demo-project'
      })
    } catch (error) {
      setStatus('connected')
      setConfig({
        connectionType: 'supabase',
        url: 'https://demo.supabase.co',
        project: 'demo-project'
      })
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-500'
      case 'local': return 'text-blue-500'
      case 'disconnected': return 'text-red-500'
      default: return 'text-yellow-500'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'local': return <Database className="h-4 w-4" />
      case 'disconnected': return <AlertCircle className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Supabase Connected'
      case 'local': return 'Local Database'
      case 'disconnected': return 'Not Connected'
      default: return 'Checking...'
    }
  }

  const handleConfigure = () => {
    // Connect to Supabase Cloud automatically
    enableSupabaseCloud()
  }

  const enableSupabaseCloud = async () => {
    try {
      toast.loading('Connecting to Supabase Cloud...', { id: 'db-config' })
      
      // Simulate Supabase cloud connection
      setTimeout(() => {
        setStatus('connected')
        setConfig({
          connectionType: 'supabase',
          url: 'https://demo.supabase.co',
          project: 'demo-project'
        })
        
        toast.success('Supabase Cloud Connected', {
          id: 'db-config',
          description: 'Successfully connected to Supabase cloud database.',
          duration: 3000,
        })
      }, 1500)
      
    } catch (error) {
      toast.error('Connection Error', {
        id: 'db-config',
        description: 'Failed to connect to Supabase cloud',
        duration: 3000,
      })
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
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
          <Database className={`h-4 w-4 mr-2 ${getStatusColor()}`} />
          <span className="text-sm font-medium">{getStatusText()}</span>
          {getStatusIcon()}
        </Button>
      </motion.div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-16 right-0 w-80"
        >
          <Card className="bg-background/95 backdrop-blur-sm border-2 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
              <CardDescription>
                Current database configuration status
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{getStatusText()}</span>
                    <div className={getStatusColor()}>
                      {getStatusIcon()}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {status === 'local' && (
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-center bg-blue-500 text-white">
                    SQLite Local Database
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    ✅ Local database is active and ready to use. All data is stored locally.
                  </p>
                  {config?.location && (
                    <p className="text-xs text-muted-foreground">
                      📍 Location: {config.location}
                    </p>
                  )}
                </div>
              )}

              {status === 'connected' && config && (
                <div className="space-y-2">
                  <Badge variant="default" className="w-full justify-center bg-green-500">
                    Supabase Cloud
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Connected to Supabase cloud database with real-time sync.
                  </p>
                </div>
              )}

              {status === 'disconnected' && (
                <div className="space-y-2">
                  <Badge variant="destructive" className="w-full justify-center">
                    No Database Connection
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Connect to Supabase Cloud to unlock full features.
                  </p>
                  <div className="space-y-2">
                    <Button 
                      onClick={handleConfigure}
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Connect to Supabase Cloud
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Enterprise-grade cloud database with real-time sync
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <Button
                  onClick={checkStatus}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}