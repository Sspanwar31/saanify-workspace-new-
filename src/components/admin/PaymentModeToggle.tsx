'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CreditCard, Settings, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PaymentModeToggleProps {
  currentMode?: 'MANUAL' | 'RAZORPAY' | null
  onModeChange?: (mode: 'MANUAL' | 'RAZORPAY') => void
  isAdmin: boolean
}

// Query function to fetch payment mode
const fetchPaymentMode = async () => {
  const response = await fetch('/api/admin/payment-mode')
  if (!response.ok) {
    throw new Error('Failed to fetch payment mode')
  }
  return response.json()
}

// Mutation function to update payment mode
const updatePaymentModeAPI = async (mode: 'MANUAL' | 'RAZORPAY') => {
  const response = await fetch('/api/admin/payment-mode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }),
  })

  if (!response.ok) {
    throw new Error('Failed to update payment mode')
  }

  return response.json()
}

export function PaymentModeToggle({ 
  currentMode: propMode, 
  onModeChange, 
  isAdmin 
}: PaymentModeToggleProps) {
  const queryClient = useQueryClient()
  
  // React Query to fetch and cache payment mode
  const { 
    data: paymentData, 
    error, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['payment-mode'],
    queryFn: fetchPaymentMode,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
    retry: 3,
  })

  // React Query mutation to update payment mode
  const updateModeMutation = useMutation({
    mutationFn: updatePaymentModeAPI,
    onSuccess: (data, variables) => {
      // Invalidate and refetch the payment mode query
      queryClient.invalidateQueries({ queryKey: ['payment-mode'] })
      
      // Call parent callback if provided
      if (onModeChange) {
        onModeChange(variables)
      }
      
      toast.success('Payment Mode Updated', {
        description: `Payment processing switched to ${variables} mode`,
        duration: 3000,
      })
    },
    onError: (error) => {
      console.error('Error updating payment mode:', error)
      toast.error('Update Failed', {
        description: 'Could not update payment mode. Please try again.',
        duration: 3000,
      })
    },
  })

  const currentMode = paymentData?.mode || propMode || 'MANUAL'

  // Handle payment mode update
  const updatePaymentMode = async (mode: 'MANUAL' | 'RAZORPAY') => {
    if (!isAdmin) {
      toast.error('Access Denied', {
        description: 'Only ADMIN can change payment mode settings.',
        duration: 3000,
      })
      return
    }

    updateModeMutation.mutate(mode)
  }

  const getModeIcon = (mode: 'MANUAL' | 'RAZORPAY') => {
    return mode === 'MANUAL' ? (
      <Settings className="h-5 w-5" />
    ) : (
      <CreditCard className="h-5 w-5" />
    )
  }

  const getModeDescription = (mode: 'MANUAL' | 'RAZORPAY') => {
    return mode === 'MANUAL' 
      ? 'Users upload payment proofs for manual admin approval'
      : 'Users pay directly via Razorpay instant payment gateway'
  }

  const getModeBadgeVariant = (mode: 'MANUAL' | 'RAZORPAY') => {
    return mode === 'MANUAL' ? 'secondary' : 'default'
  }

  const getModeBadgeColor = (mode: 'MANUAL' | 'RAZORPAY') => {
    return mode === 'MANUAL' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-green-100 text-green-800 border-green-200'
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Failed to load payment mode settings</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, scale: 1.01 }}
    >
      <Card className="border-2 shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white border-b-0">
          <div className="p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: updateModeMutation.isPending ? 360 : 0 }}
                  transition={{ duration: 1, repeat: updateModeMutation.isPending ? Infinity : 0, ease: "linear" }}
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 text-blue-200 animate-spin" />
                  ) : (
                    <CreditCard className="h-6 w-6 text-blue-200" />
                  )}
                </motion.div>
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    💳 Payment Gateway Settings
                    {!isAdmin && (
                      <AlertCircle className="h-4 w-4 text-amber-200" title="ADMIN Only" />
                    )}
                  </h3>
                  <p className="text-slate-200 text-sm">
                    {updateModeMutation.isPending 
                      ? 'Updating payment mode...' 
                      : isLoading 
                        ? 'Loading payment mode...'
                        : `Current mode: ${currentMode}`
                    }
                  </p>
                </div>
              </div>
              
              {!isLoading && (
                <Badge 
                  variant={getModeBadgeVariant(currentMode)} 
                  className={cn("text-white border-0", getModeBadgeColor(currentMode))}
                >
                  {currentMode === 'MANUAL' ? '📋 Manual' : '⚡ Razorpay'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Choose how users will make payments for subscription plans:
            </div>

            {/* Manual Mode */}
            <div
              className={cn(
                "relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                currentMode === 'MANUAL'
                  ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}
              onClick={() => updatePaymentMode('MANUAL')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    currentMode === 'MANUAL'
                      ? "bg-yellow-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  )}>
                    {getModeIcon('MANUAL')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      Manual Payment
                      <Badge variant="secondary" className="text-xs">📋 Receipt Upload</Badge>
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {getModeDescription('MANUAL')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={currentMode === 'MANUAL'}
                    onCheckedChange={() => updatePaymentMode('MANUAL')}
                    disabled={updateModeMutation.isPending || !isAdmin || isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Razorpay Mode */}
            <div
              className={cn(
                "relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                currentMode === 'RAZORPAY'
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              )}
              onClick={() => updatePaymentMode('RAZORPAY')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    currentMode === 'RAZORPAY'
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  )}>
                    {getModeIcon('RAZORPAY')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      Razorpay Gateway
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">⚡ Instant</Badge>
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {getModeDescription('RAZORPAY')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={currentMode === 'RAZORPAY'}
                    onCheckedChange={() => updatePaymentMode('RAZORPAY')}
                    disabled={updateModeMutation.isPending || !isAdmin || isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {!isAdmin && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Admin Access Required</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Only users with ADMIN privileges can modify payment gateway settings.
              </p>
            </div>
          )}

          {!isLoading && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Auto-refresh every 30 seconds</span>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Mode active: {currentMode}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}