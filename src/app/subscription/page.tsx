"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Users, Zap, Shield, Crown, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubscriptionData {
  planType: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED'
  trialEnds: string
  currentPeriodEnd?: string
  features: string[]
  limits: {
    users: number
    storage: string
    societies: number
  }
}

export default function SubscriptionManagement() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    let isMounted = true;
    
    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch('/api/subscription/current')
        const data = await response.json()
        
        if (data.subscription && isMounted) {
          setSubscription(data.subscription)
          calculateDaysRemaining(data.subscription.trialEnds)
        }
      } catch (error) {
        console.error('Failed to fetch subscription data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchSubscriptionData()
    
    return () => {
      isMounted = false;
    };
  }, [])

  const calculateDaysRemaining = (trialEnds: string) => {
    const trialDate = new Date(trialEnds)
    const currentDate = new Date()
    const timeDiff = trialDate.getTime() - currentDate.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    setDaysRemaining(Math.max(0, daysDiff))
  }

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'TRIAL':
        return <Clock className="h-5 w-5" />
      case 'BASIC':
        return <Users className="h-5 w-5" />
      case 'PRO':
        return <Zap className="h-5 w-5" />
      case 'ENTERPRISE':
        return <Building2 className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRIAL':
        return 'bg-orange-100 text-orange-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = () => {
    if (subscription?.planType !== 'TRIAL') return 100
    const totalTrialDays = 15
    return ((totalTrialDays - daysRemaining) / totalTrialDays) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your society subscription plan</p>
        </div>
        {subscription?.planType === 'TRIAL' && (
          <Button 
            onClick={() => router.push('/subscription/select-plan')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Upgrade Now
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPlanIcon(subscription?.planType || 'TRIAL')}
              Current Plan
            </CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plan Type</span>
              <div className="flex items-center gap-2">
                <span className="text-sm capitalize">{subscription?.planType}</span>
                {subscription?.planType === 'PRO' && <Crown className="h-4 w-4 text-yellow-500" />}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className={getStatusColor(subscription?.status || 'TRIAL')}>
                {subscription?.status}
              </Badge>
            </div>

            {subscription?.planType === 'TRIAL' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trial Ends</span>
                  <span className="text-sm">{subscription?.trialEnds}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Trial Progress</span>
                    <span>{daysRemaining} days remaining</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Upgrade during trial to continue using all features
                  </p>
                </div>
              </>
            )}

            {subscription?.currentPeriodEnd && subscription.planType !== 'TRIAL' && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next Billing</span>
                <span className="text-sm">{subscription.currentPeriodEnd}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Limits</CardTitle>
            <CardDescription>Current usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Users</span>
              </div>
              <span className="text-sm">
                {subscription?.planType === 'TRIAL' ? '3' : 
                 subscription?.planType === 'BASIC' ? '10' : 
                 subscription?.planType === 'PRO' ? '25' : 'Unlimited'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Societies</span>
              </div>
              <span className="text-sm">
                {subscription?.planType === 'TRIAL' ? '1' : 
                 subscription?.planType === 'BASIC' ? '3' : 
                 subscription?.planType === 'PRO' ? '10' : 'Unlimited'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <span className="text-sm">
                {subscription?.planType === 'TRIAL' ? '1 GB' : 
                 subscription?.planType === 'BASIC' ? '5 GB' : 
                 subscription?.planType === 'PRO' ? '20 GB' : '100 GB'}
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Included Features:</p>
                <ul className="space-y-1">
                  {subscription?.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/subscription/select-plan')}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/subscription/history')}
              className="justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              Payment History
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/support')}
              className="justify-start"
            >
              <Shield className="h-4 w-4 mr-2" />
              Get Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}