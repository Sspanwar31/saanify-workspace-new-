'use client'

import { useState } from 'react'
import { 
  Crown, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Users,
  Calendar,
  CreditCard,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useClientStore, SUBSCRIPTION_PLANS } from '@/lib/client/store'
import { toast } from 'sonner'

export default function SubscriptionPage() {
  const { members, subscription, upgradePlan, simulateExpiry, forceUnlock } = useClientStore()
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Helper functions for date calculations
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const calculateDaysRemaining = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const calculateTimeProgress = (startDate: string, expiryDate: string) => {
    const start = new Date(startDate)
    const expiry = new Date(expiryDate)
    const today = new Date()
    
    const totalTime = expiry.getTime() - start.getTime()
    const elapsedTime = today.getTime() - start.getTime()
    
    const progress = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100))
    return Math.round(progress)
  }

  // Calculate subscription metrics
  const currentPlan = SUBSCRIPTION_PLANS[subscription.currentPlan]
  const maxMembers = currentPlan.maxMembers === Infinity ? subscription.memberCount : currentPlan.maxMembers
  const memberPercentage = Math.round((subscription.memberCount / maxMembers) * 100)
  const daysRemaining = calculateDaysRemaining(subscription.expiryDate)
  const timePercentage = calculateTimeProgress(subscription.subscriptionDate || subscription.expiryDate, subscription.expiryDate)
  
  // Determine color for days remaining based on urgency
  const getDaysRemainingColor = (days: number) => {
    if (days > 5) return 'text-green-600'
    if (days > 0) return 'text-orange-600'
    return 'text-red-600'
  }

  const handlePlanUpgrade = async (planId: string) => {
    setSelectedPlan(planId)
    setIsProcessingPayment(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Upgrade the plan
    upgradePlan(planId as 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE')
    
    setIsProcessingPayment(false)
    setSelectedPlan(null)
    
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]
    toast.success(`Payment Successful! Plan upgraded to ${plan.name}`)
  }

  const handleSimulateExpiry = () => {
    simulateExpiry()
    toast.warning('Subscription expired! Dashboard locked.')
  }

  const handleForceUnlock = () => {
    forceUnlock()
    toast.success('Subscription renewed! Dashboard unlocked.')
  }

  const subscriptionPlans = Object.values(SUBSCRIPTION_PLANS)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Subscription Plans
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Choose the perfect plan for your society management needs
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Top Row: Plan Name & Status */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">{currentPlan.name}</h2>
              <Badge variant={subscription.status === 'ACTIVE' ? "default" : "destructive"}>
                {subscription.status}
              </Badge>
            </div>

            {/* Middle Row: Member Usage */}
            <div className="text-sm text-gray-500">
              Members: {subscription.memberCount} / {currentPlan.maxMembers === Infinity ? 'Unlimited' : currentPlan.maxMembers}
              <Progress value={memberPercentage} className="h-2 mt-1" />
            </div>

            {/* Bottom Row: Time Tracking (NEW) */}
            <div className="bg-gray-50 p-3 rounded-md border">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Start: {formatDate(subscription.subscriptionDate || subscription.expiryDate)}</span>
                <span>End: {formatDate(subscription.expiryDate)}</span>
              </div>
              <Progress value={timePercentage} className="h-2 mb-2" />
              <div className={`text-center font-bold ${getDaysRemainingColor(daysRemaining)}`}>
                {daysRemaining} Days Remaining
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid gap-6 md:grid-cols-4">
        {subscriptionPlans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.id === 'PRO' ? 'ring-2 ring-blue-500' : ''}`}>
            {plan.id === 'PRO' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                  {plan.price > 0 ? `/${plan.durationDays} days` : ''}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${plan.color} hover:opacity-90`}
                disabled={plan.id === subscription.currentPlan}
                onClick={() => handlePlanUpgrade(plan.id)}
              >
                {plan.id === subscription.currentPlan ? 'Current Plan' : 'Buy Now'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{subscription.memberCount}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((subscription.memberCount / (SUBSCRIPTION_PLANS[subscription.currentPlan].maxMembers === Infinity ? subscription.memberCount : SUBSCRIPTION_PLANS[subscription.currentPlan].maxMembers)) * 100)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan Used</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{SUBSCRIPTION_PLANS[subscription.currentPlan].name}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Plan</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{subscription.status}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Testing Tools */}
      <Card className="border-2 border-dashed border-orange-300 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            🛠️ Developer Testing Tools
          </CardTitle>
          <p className="text-sm text-orange-600">
            These tools are for development and testing purposes only. Use them to simulate subscription scenarios.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSimulateExpiry}
              disabled={subscription.status === 'EXPIRED'}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Simulate Expiry Now
            </Button>
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleForceUnlock}
              disabled={subscription.status === 'ACTIVE'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Unlock / Renew
            </Button>
          </div>
          <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">Testing Guide:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• <strong>Simulate Expiry:</strong> Sets expiry date to yesterday, instantly locking the dashboard</li>
              <li>• <strong>Force Unlock:</strong> Extends subscription by 30 days, unlocking the dashboard</li>
              <li>• Test the lock screen behavior by simulating expiry first</li>
              <li>• Use Force Unlock to restore access after testing</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Payment Processing Modal */}
      <Dialog open={isProcessingPayment} onOpenChange={setIsProcessingPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Payment
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-center text-gray-600">
              Processing payment via Razorpay...
            </p>
            <p className="text-sm text-gray-500">
              Please wait while we process your subscription upgrade
            </p>
            {selectedPlan && (
              <div className="text-center">
                <p className="font-semibold">Upgrading to:</p>
                <p className="text-lg font-bold text-blue-600">
                  {SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS].name}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
