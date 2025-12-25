'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Key,
  Lock,
  Zap,
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SupabaseIntegrationCard() {
  // Legacy Supabase Integration UI - DISABLED
  // Backend logic preserved for API functionality
  
  // Return null to hide legacy UI
  return null
  
  /* Original UI code commented out - preserved for reference
  const [status, setStatus] = useState<'Not Connected' | 'Connecting' | 'Connected' | 'Error'>('Not Connected')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [serviceRoleKey, setServiceRoleKey] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [showServiceKey, setShowServiceKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  
  // Legacy UI rendering disabled - keeping only backend logic functions
  const handleValidate = async () => {
    if (!supabaseUrl || !anonKey) {
      toast.error("Missing Credentials", {
        description: "Please provide Supabase URL and Anon Key",
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    setStatus('Connecting')

    try {
      const res = await fetch('/api/integrations/supabase/validate', {
        method: 'POST',
        body: JSON.stringify({ supabaseUrl, anonKey }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const result = await res.json()
        setStatus('Connected')
        toast.success("✅ Validation Successful!", {
          description: result.message || "Supabase credentials are valid",
          duration: 4000,
        })
      } else {
        const error = await res.json()
        setStatus('Error')
        toast.error("❌ Validation Failed", {
          description: error.error || "Invalid Supabase credentials",
          duration: 5000,
        })
      }
    } catch (err: any) {
      setStatus('Error')
      toast.error("❌ Connection Error", {
        description: err.message || "Failed to validate credentials",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      toast.error("Missing Credentials", {
        description: "Please provide all required fields",
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    setStatus('Connecting')

    try {
      const res = await fetch('/api/integrations/supabase/save', {
        method: 'POST',
        body: JSON.stringify({ supabaseUrl, anonKey, serviceRoleKey }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const result = await res.json()
        setStatus('Connected')
        setShowConfig(false)
        toast.success("🎉 Supabase Connected!", {
          description: result.message || "Database tables and RLS policies created successfully",
          duration: 5000,
        })
      } else {
        const error = await res.json()
        setStatus('Error')
        toast.error("❌ Setup Failed", {
          description: error.error || "Failed to setup Supabase",
          duration: 5000,
        })
      }
    } catch (err: any) {
      setStatus('Error')
      toast.error("❌ Setup Error", {
        description: err.message || "Failed to save configuration",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'Connecting':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'Connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'Error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Database className="h-5 w-5 text-gray-500" />
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

  const getStatusColor = () => {
    switch (status) {
      case 'Connected':
        return 'text-green-600'
      case 'Error':
        return 'text-red-600'
      case 'Connecting':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  // Legacy UI return statement commented out
  /*
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <Card className="p-6 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Supabase Integration</h3>
              <p className="text-sm text-muted-foreground">PostgreSQL Database & Auth</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Integrate authentication, real-time database, storage, and Row Level Security (RLS) for your society management platform.
          </p>

          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {status === 'Not Connected' && 'Click to configure'}
              {status === 'Connecting' && 'Establishing connection...'}
              {status === 'Connected' && 'Fully operational'}
              {status === 'Error' && 'Configuration needed'}
            </span>
          </div>

          {status === 'Connected' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-3 border-t space-y-2"
            >
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Shield className="h-4 w-4" />
                <span>RLS Policies Active</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Lock className="h-4 w-4" />
                <span>Secure Authentication</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Zap className="h-4 w-4" />
                <span>Real-time Sync</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full mb-3"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {showConfig ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Configuration
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show Configuration
              </>
            )}
          </Button>

          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="supabase-url">Supabase URL</Label>
                  <Input
                    id="supabase-url"
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anon-key">Anon Key</Label>
                  <Input
                    id="anon-key"
                    type="text"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="Public anon key"
                    className="w-full font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-key">Service Role Key</Label>
                  <div className="relative">
                    <Input
                      id="service-key"
                      type={showServiceKey ? "text" : "password"}
                      value={serviceRoleKey}
                      onChange={(e) => setServiceRoleKey(e.target.value)}
                      placeholder="Private key (server-only)"
                      className="w-full font-mono text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowServiceKey(!showServiceKey)}
                    >
                      {showServiceKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleValidate}
                    disabled={isLoading || status === 'Connecting'}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validate
                      </>
                    )}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isLoading || status === 'Connecting'}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Save & Setup
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <Lock className="h-3 w-3" />
                    <span className="font-medium">Security Notice:</span>
                  </div>
                  <ul className="space-y-1 ml-4">
                    <li>• Service role key is never exposed to frontend</li>
                    <li>• Only anon key is used client-side</li>
                    <li>• RLS policies ensure data isolation</li>
                    <li>• Keys are stored securely server-side</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
  */
}