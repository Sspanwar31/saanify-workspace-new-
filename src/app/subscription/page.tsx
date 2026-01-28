"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Users, Zap, Shield, Crown, Building2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Interface to match your UI needs
interface SubscriptionData {
  planType: string
  status: string
  trialEnds: string
  currentPeriodEnd?: string
  features: string[]
  limits: {
    users: string | number
    storage: string
    societies: number
  }
  isTrialUsed: boolean // New field for logic
}

export default function SubscriptionManagement() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [daysRemaining, setDaysRemaining] = useState(0)

  // --- FETCH DATA FROM SUPABASE ---
  useEffect(() => {
    let isMounted = true;
    
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);

        // 1. Get Client Details
        const { data: clients, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .limit(1);

        if (clientError) throw clientError;

        if (clients && clients.length > 0 && isMounted) {
          const client = clients[0];
          
          // 2. Get Plan Details (Features, Limits)
          // We fetch the plan details based on what is assigned to the client
          const planNameQuery = client.plan_name || 'Trial';
          
          const { data: planDetails } = await supabase
            .from('plans')
            .select('*')
            .ilike('name', planNameQuery) // Case insensitive match
            .single();

          // 3. Logic to determine if it is a Trial Plan
          // Checks if name implies trial OR if price is 0
          const isTrial = 
            planNameQuery.toLowerCase().includes('trial') || 
            planNameQuery.toLowerCase().includes('free') ||
            (planDetails && planDetails.price === 0);

          // 4. Calculate End Date / Trial End
          const endDate = client.plan_end_date 
            ? new Date(client.plan_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString();

          if (client.plan_end_date) {
            calculateDaysRemaining(client.plan_end_date);
          }

          // 5. Map Limits based on Plan Type (Hybrid: DB + Static Fallback to keep UI intact)
          // We try to parse "200 Members" from DB to number "200", else fallback
          let userLimit: string | number = 'Unlimited';
          if (planDetails?.limit_members) {
             const parsed = parseInt(planDetails.limit_members);
             userLimit = isNaN(parsed) ? 'Unlimited' : parsed;
          }

          // Mapping Storage/Societies based on plan hierarchy to maintain UI
          const planKey = planNameQuery.toUpperCase();
          let storageLimit = '1 GB';
          let societyLimit = 1;

          if (planKey.includes('BASIC')) { storageLimit = '5 GB'; societyLimit = 3; }
          else if (planKey.includes('PRO')) { storageLimit = '20 GB'; societyLimit = 10; }
          else if (planKey.includes('ENTERPRISE')) { storageLimit = '100 GB'; societyLimit = 999; }

          // 6. Construct Data Object
          const subData: SubscriptionData = {
            planType: planNameQuery.toUpperCase(), // BASIC, PRO, TRIAL
            status: (client.subscription_status || 'ACTIVE').toUpperCase(),
            trialEnds: endDate,
            currentPeriodEnd: endDate,
            features: planDetails?.features || ['Basic Access', 'Dashboard'], // From DB or fallback
            limits: {
              users: userLimit,
              storage: storageLimit,
              societies: societyLimit
            },
            isTrialUsed: client.has_used_trial || false
          };

          setSubscription(subData);
        }
      } catch (error) {
        console.error('Failed to fetch subscription data:', error);
        toast.error("Could not load subscription details");
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

  const calculateDaysRemaining = (dateString: string) => {
    const targetDate = new Date(dateString)
    const currentDate = new Date()
    const timeDiff = targetDate.getTime() - currentDate.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    setDaysRemaining(Math.max(0, daysDiff))
  }

  const getPlanIcon = (planType: string) => {
    // Dynamic match for plan types including DB values
    if (planType.includes('TRIAL') || planType.includes('FREE')) return <Clock className="h-5 w-5" />
    if (planType.includes('BASIC')) return <Users className="h-5 w-5" />
    if (planType.includes('PRO') || planType.includes('PROFESSIONAL')) return <Zap className="h-5 w-5" />
    if (planType.includes('ENTERPRISE')) return <Building2 className="h-5 w-5" />
    return <Shield className="h-5 w-5" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRIAL':
        return 'bg-orange-100 text-orange-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
      case 'INACTIVE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = () => {
    // Only show progress for Trial
    if (!subscription?.planType.includes('TRIAL') && !subscription?.planType.includes('FREE')) return 100
    const totalTrialDays = 15 // Default trial length
    // Avoid division by zero or negative
    const days = daysRemaining > totalTrialDays ? totalTrialDays : daysRemaining;
    return ((totalTrialDays - days) / totalTrialDays) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  const isTrialPlan = subscription?.planType.includes('TRIAL') || subscription?.planType.includes('FREE');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your society subscription plan</p>
        </div>
        {isTrialPlan && (
          <Button 
            onClick={() => router.push('/dashboard/subscription')} // Redirect to main pricing page
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
                <span className="text-sm capitalize font-bold">{subscription?.planType}</span>
                {(subscription?.planType.includes('PRO') || subscription?.planType.includes('ENTERPRISE')) && <Crown className="h-4 w-4 text-yellow-500" />}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className={getStatusColor(subscription?.status || 'TRIAL')}>
                {subscription?.status}
              </Badge>
            </div>

            {isTrialPlan && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trial Ends</span>
                  <span className="text-sm">{subscription?.trialEnds}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Trial Progress</span>
                    <span className={daysRemaining < 3 ? "text-red-500 font-bold" : ""}>{daysRemaining} days remaining</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Upgrade during trial to continue using all features.
                    {subscription?.isTrialUsed && " (Trial used)"}
                  </p>
                </div>
              </>
            )}

            {!isTrialPlan && subscription?.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plan Expiry</span>
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
                <span className="text-sm font-medium">Users Limit</span>
              </div>
              <span className="text-sm font-semibold">
                {subscription?.limits.users}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Societies</span>
              </div>
              <span className="text-sm">
                 {subscription?.limits.societies === 999 ? 'Unlimited' : subscription?.limits.societies}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <span className="text-sm">
                {subscription?.limits.storage}
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Included Features:</p>
                <ul className="space-y-1">
                  {subscription?.features.slice(0, 4).map((feature, index) => (
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
              onClick={() => router.push('/dashboard/subscription')} // Route to Pricing
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/subscription')} // Route to history if exists or same
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
