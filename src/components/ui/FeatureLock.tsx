'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Crown, Zap, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSuperClientStore } from '@/lib/super-client/store'
import { toast } from 'sonner'

interface FeatureLockProps {
  children: React.ReactNode
  minPlan: 'PRO' | 'ENTERPRISE'
  title?: string
  description?: string
  className?: string
}

export function FeatureLock({ 
  children, 
  minPlan, 
  title = "Premium Feature", 
  description = "This feature is available for premium users only",
  className = ""
}: FeatureLockProps) {
  const [showTrialModal, setShowTrialModal] = useState(false)
  const router = useRouter()
  const { subscription, premiumTrial, activatePremiumTrial, upgradePlan } = useSuperClientStore()

  // Debug logging
  console.log('🔒 FeatureLock Debug - Subscription:', subscription)
  console.log('🔒 FeatureLock Debug - Premium Trial:', premiumTrial)
  console.log('🔒 FeatureLock Debug - Min Plan:', minPlan)

  // Check if user has access
  const hasAccess = () => {
    // CRITICAL FIX: Unlock if Level is Met OR Trial is Active (regardless of plan)
    if (subscription.currentPlan === 'PRO' || subscription.currentPlan === 'ENTERPRISE') {
      return true
    }
    
    // CRITICAL FIX: Allow access if premium trial is active, regardless of current plan
    if (premiumTrial.active) {
      return true
    }
    
    return false
  }

  const handleStartTrial = () => {
    if (premiumTrial.used) {
      toast.error('You have already used your 7-day free trial')
      return
    }
    
    activatePremiumTrial()
    toast.success('🎉 7-day premium trial activated! Enjoy advanced analytics.')
    setShowTrialModal(false)
  }

  const handleUpgrade = () => {
    // Redirect to upgrade page
    router.push('/super-client/subscription')
  }

  const getTrialDaysLeft = () => {
    if (!premiumTrial.startDate || !premiumTrial.active) return 0
    
    const today = new Date()
    // Handle case where startDate might be a string from localStorage
    const trialStart = typeof premiumTrial.startDate === 'string' 
      ? new Date(premiumTrial.startDate) 
      : premiumTrial.startDate
    
    const trialEndDate = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const daysLeft = Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }

  const trialDaysLeft = getTrialDaysLeft()

  // If user has access, show children
  if (hasAccess()) {
    return (
      <div className={className}>
        {children}
        {/* Show trial indicator if active */}
        {subscription.currentPlan === 'BASIC' && premiumTrial.active && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                Premium Trial Active - {trialDaysLeft} days left
              </span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                TRIAL
              </Badge>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show lock overlay with blur effect
  const isLocked = !hasAccess()
  
  return (
    <div className={`relative w-full h-full overflow-hidden rounded-lg group ${className}`}>
      {/* 1. RENDER CHILDREN BUT BLURRED */}
      <div className={`transition-all duration-300 ${isLocked ? 'filter blur-md pointer-events-none select-none opacity-50' : ''}`}>
        {children || (
          /* If no children passed, show a placeholder skeleton that looks like the locked content */
          <div className="space-y-2 p-4">
            {/* Table header skeleton */}
            <div className="flex gap-4 mb-3">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/8"></div>
            </div>
            {/* Table row skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 py-2">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/8"></div>
              </div>
            ))}
          </div>
        )} 
      </div>

      {/* 2. OVERLAY THE LOCK UI */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-sm">
          <Card className="max-w-md mx-4 border-2 border-dashed border-gray-300 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {title} Locked
                </h3>
                
                <p className="text-gray-600 text-sm mb-6">
                  {description}
                </p>
              </div>

              {/* 3. TRIAL BUTTON LOGIC - SHOW BOTH BUTTONS */}
              <div className="flex flex-col gap-3 mt-4 w-full max-w-xs">
                
                {/* 1. TRIAL BUTTON (Primary) - Only if not used */}
                {!premiumTrial.used && (
                  <Button 
                    onClick={handleStartTrial}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                  >
                    ✨ Start 7-Day Free Premium Trial
                  </Button>
                )}

                {/* 2. UPGRADE BUTTON (Secondary/Outline) - ALWAYS VISIBLE */}
                <Button 
                  variant={!premiumTrial.used ? "outline" : "default"} // Change style based on context
                  onClick={handleUpgrade}
                  className={`w-full ${premiumTrial.used ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-200 text-orange-700 hover:bg-orange-50'}`}
                >
                  🚀 Upgrade to PRO Plan
                </Button>
                
                {premiumTrial.used && (
                  <p className="text-xs text-gray-500 text-center">
                    Trial already used. Upgrade to unlock premium features.
                  </p>
                )}
              </div>

              {/* Features list */}
              <div className="mt-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-3">Premium Features:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced Analytics & Charts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Profit & Loss Reports
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Loan Portfolio Analysis
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Export to Excel/CSV
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}