'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, Database, Users, Activity, RefreshCw, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import OverviewTab from './OverviewTab'
import DatabaseTab from './DatabaseTab'
import UsersTab from './UsersTab'

export default function CloudPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/integrations/supabase/status')
      const data = await response.json()
      
      if (data.connected || data.connectionType === 'local') {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      setConnectionStatus('disconnected')
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    await checkConnectionStatus()
    setTimeout(() => setIsLoading(false), 1000)
    toast.success("🔄 Status Refreshed", {
      description: "Cloud panel status updated successfully",
      duration: 2000,
    })
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500'
      case 'disconnected': return 'text-red-500'
      default: return 'text-yellow-500'
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-yellow-500'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'users', label: 'Users', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sky-50/10 to-sky-100/10 dark:from-background dark:via-sky-950/50 dark:to-sky-900/50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.div
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Saanify Cloud Panel</h1>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusBadge()}`} />
                    <span className="text-sm text-muted-foreground capitalize">{connectionStatus}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="border-2 hover:bg-accent transition-all duration-200"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="hover:bg-accent transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit Panel
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 rounded-lg"
                >
                  <motion.div
                    className="flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </motion.div>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab connectionStatus={connectionStatus} onRefresh={checkConnectionStatus} />
                </TabsContent>
                
                <TabsContent value="database" className="mt-0">
                  <DatabaseTab connectionStatus={connectionStatus} />
                </TabsContent>
                
                <TabsContent value="users" className="mt-0">
                  <UsersTab connectionStatus={connectionStatus} />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}