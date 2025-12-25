'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RevenueToggleProps {
  showRevenue: boolean
  onToggle: (show: boolean) => void
  totalRevenue: number
  clientRevenue: Record<string, number>
}

export function RevenueToggle({ showRevenue, onToggle, totalRevenue, clientRevenue }: RevenueToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: showRevenue ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <DollarSign className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-white font-semibold">Show Revenue 💰</h3>
                <p className="text-emerald-100 text-sm">
                  {showRevenue ? 'Revenue data is visible' : 'Revenue data is hidden'}
                </p>
              </div>
            </div>
            
            <Switch
              checked={showRevenue}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-emerald-300"
            />
          </div>

          {showRevenue && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-emerald-400/30"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-100" />
                    <span className="text-emerald-100 text-sm">Total Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${totalRevenue.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-emerald-100" />
                    <span className="text-emerald-100 text-sm">Active Clients</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {Object.keys(clientRevenue).length}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}