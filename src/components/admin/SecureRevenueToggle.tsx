'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Shield, Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SecureRevenueToggleProps {
  showRevenue: boolean
  onToggle: (show: boolean) => void
  totalRevenue: number
  monthlyGrowth: number
  isAdmin: boolean
}

export function SecureRevenueToggle({ 
  showRevenue, 
  onToggle, 
  totalRevenue, 
  monthlyGrowth,
  isAdmin 
}: SecureRevenueToggleProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authAttempts, setAuthAttempts] = useState(0)

  // Load preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('revenue-visibility')
    if (savedPreference !== null) {
      const preference = JSON.parse(savedPreference)
      if (isAdmin || !preference.requiresAdmin) {
        onToggle(preference.showRevenue)
      }
    }
  }, [isAdmin, onToggle])

  // Save preference to localStorage
  const savePreference = (show: boolean) => {
    localStorage.setItem('revenue-visibility', JSON.stringify({
      showRevenue: show,
      requiresAdmin: true,
      lastUpdated: new Date().toISOString()
    }))
  }

  const handleToggle = async (checked: boolean) => {
    // If trying to show revenue and not admin, require authentication
    if (checked && !isAdmin) {
      setIsAuthenticating(true)
      
      // Simulate authentication check
      setTimeout(() => {
        setIsAuthenticating(false)
        setAuthAttempts(prev => prev + 1)
        
        if (authAttempts >= 2) {
          toast.error('Access Denied', {
            description: 'Only ADMIN can view revenue data. Please contact your administrator.',
            duration: 5000,
          })
        } else {
          toast.error('Access Restricted', {
            description: 'Revenue data is only visible to ADMIN users.',
            duration: 3000,
          })
        }
      }, 1000)
      return
    }

    // Proceed with toggle if admin or hiding revenue
    onToggle(checked)
    savePreference(checked)
    
    if (checked && isAdmin) {
      toast.success('Revenue Data Unlocked', {
        description: 'Financial metrics are now visible',
        duration: 2000,
      })
    }
  }

  const getRevenueIcon = () => {
    if (isAuthenticating) {
      return <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Shield className="h-6 w-6 text-amber-500" />
      </motion.div>
    }
    
    if (showRevenue && isAdmin) {
      return <Eye className="h-6 w-6 text-emerald-500" />
    }
    
    return <EyeOff className="h-6 w-6 text-slate-400" />
  }

  const getCardGradient = () => {
    if (!isAdmin) {
      return 'from-slate-500 to-slate-600'
    }
    
    if (showRevenue) {
      return 'from-emerald-500 to-teal-600'
    }
    
    return 'from-slate-500 to-slate-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, scale: 1.01 }}
    >
      <Card className={cn(
        "border-2 shadow-lg transition-all duration-300",
        showRevenue && isAdmin 
          ? "border-emerald-200 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
          : "border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
      )}>
        <CardHeader className="bg-gradient-to-r text-white border-b-0">
          <div className={cn(
            "p-6 rounded-t-lg",
            showRevenue && isAdmin 
              ? "bg-gradient-to-r from-emerald-500 to-teal-600"
              : "bg-gradient-to-r from-slate-500 to-slate-600"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    rotate: showRevenue && isAdmin ? 360 : 0,
                    scale: isAuthenticating ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    rotate: { duration: 0.5 },
                    scale: { duration: 0.3, repeat: isAuthenticating ? Infinity : 0, repeatDelay: 1 }
                  }}
                >
                  {getRevenueIcon()}
                </motion.div>
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    💰 Show Revenue Data
                    {!isAdmin && (
                      <Shield className="h-4 w-4 text-amber-200" title="ADMIN Only" />
                    )}
                  </h3>
                  <p className="text-emerald-100 text-sm">
                    {isAuthenticating 
                      ? 'Verifying access...' 
                      : showRevenue && isAdmin 
                        ? 'Revenue data is visible' 
                        : isAdmin 
                        ? 'Revenue data is hidden'
                        : 'Revenue requires ADMIN access'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!isAdmin && (
                  <div className="text-right">
                    <p className="text-xs text-amber-200">Access Level</p>
                    <p className="text-sm font-medium">Admin</p>
                  </div>
                )}
                
                <Switch
                  checked={showRevenue}
                  onCheckedChange={handleToggle}
                  disabled={isAuthenticating || (!isAdmin && !showRevenue)}
                  className={cn(
                    "data-[state=checked]:bg-emerald-300",
                    !isAdmin && !showRevenue && "opacity-50 cursor-not-allowed"
                  )}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        {showRevenue && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-emerald-200 dark:border-emerald-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                      Total Revenue
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    ${totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Monthly recurring
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-emerald-200 dark:border-emerald-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                      Growth Rate
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    +{monthlyGrowth}%
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Month over month
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-emerald-200 dark:border-emerald-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                      Access Level
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    ADMIN
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Full access granted
                  </div>
                </motion.div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Last updated: {new Date().toLocaleString()}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(false)}
                    className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Revenue
                  </Button>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}

        {!isAdmin && (
          <CardContent className="p-6">
            <div className="text-center py-4">
              <Shield className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Revenue Access Restricted
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Financial data is only accessible to ADMIN users for security reasons.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Shield className="h-3 w-3" />
                <span>ADMIN privilege required</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}