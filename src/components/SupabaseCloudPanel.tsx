'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cloud, 
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
// Import real components
import SecretsTab from '@/components/cloud/SecretsTab'
import OverviewTab from '@/components/cloud/OverviewTab'
import StorageTab from '@/components/cloud/StorageTab'
import EdgeFunctionsTab from '@/components/cloud/EdgeFunctionsTab'
import AITab from '@/components/cloud/AITab'
import LogsTab from '@/components/cloud/LogsTab'
import AutomationTab from '@/components/cloud/AutomationTab'

export default function SupabaseCloudPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
        >
          <Cloud className="h-4 w-4 mr-2" />
          Saanify Cloud Dashboard
        </Button>
      </motion.div>
    )
  }

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"></div>
      
      {/* Main Panel Container with proper scaling */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-y-auto max-h-[95vh] w-full md:w-[85%] lg:w-[75%] xl:w-[65%] mx-auto my-4 p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-14 h-14 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Cloud className="h-7 w-7" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Saanify Cloud Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Complete Infrastructure Management</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Overview</TabsTrigger>
            <TabsTrigger value="storage" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Storage</TabsTrigger>
            <TabsTrigger value="functions" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Functions</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">AI</TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Logs</TabsTrigger>
            <TabsTrigger value="secrets" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Secrets</TabsTrigger>
            <TabsTrigger value="automation" className="data-[state=active]:bg-white data-[state=active]:text-sky-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-sky-400 rounded-lg text-xs font-medium">Automation</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Using Real Overview Management */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab />
          </TabsContent>

          {/* Storage Tab - Using Real Storage Management */}
          <TabsContent value="storage" className="space-y-4">
            <StorageTab />
          </TabsContent>

          {/* Functions Tab - Using Real Functions Management */}
          <TabsContent value="functions" className="space-y-4">
            <EdgeFunctionsTab />
          </TabsContent>

          {/* AI Tab - Using Real AI Management */}
          <TabsContent value="ai" className="space-y-4">
            <AITab />
          </TabsContent>

          {/* Logs Tab - Using Real Logs Management */}
          <TabsContent value="logs" className="space-y-4">
            <LogsTab />
          </TabsContent>

          {/* Secrets Tab - Using Real Secrets Management */}
          <TabsContent value="secrets" className="space-y-4">
            <SecretsTab />
          </TabsContent>

          {/* Automation Tab - Using Real Automation Management */}
          <TabsContent value="automation" className="space-y-4">
            <AutomationTab />
          </TabsContent>

        </Tabs>
      </div>
    </>
  )
}