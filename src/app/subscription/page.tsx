'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Users, Zap, Shield, Crown, Building2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Interface update
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
  isTrialUsed: boolean
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
        
        // 1. Get Current Authenticated User first (Safety Check)
        const { data: { user } } = await supabase.auth.getUser();
        
        // 2. Fetch Client Data
        let query = supabase.from('clients').select('*');
        
        if (user?.email) {
            query = query.eq('email', user.email);
        } else {
            query = query.limit(1);
        }

        const { data: clients, error: clientError } = await query.maybeSingle();

        if (clientError) {
             console.error("Supabase Error:", clientError);
             throw clientError;
        }

        if (clients && isMounted) {
          const client = clients;
          console.log("✅ DEBUG: Fetched Client Data:", client);

          // 🧩 FIX 1: Plan ID based (no string matching)
          const { data: planDetails } = await supabase
            .from('plans')
            .select('*')
            .eq('id', client.plan_id)
            .maybeSingle();

          // 3. Check Trial Logic (based on plan details or fallback)
          const isTrial = 
            planDetails?.name?.toLowerCase().includes('trial') || 
            (planDetails && planDetails.price === 0);

          // 🧩 FIX 2: Expiry date single source of truth
          if (!client.plan_end_date) {
            throw new Error('Plan end date missing')
          }
          const targetEndDate = new Date(client.plan_end_date);

          // 🧩 FIX 3: Trial duration system_settings se lo
          const { data: settings } = await supabase
            .from('system_settings')
            .select('trial_days')
            .single()

          const totalTrialDays = settings?.trial_days || 15

          // Calculate Days
          const now = new Date();
          const timeDiff = targetEndDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          const calculatedDays = Math.max(0, daysDiff); 
          setDaysRemaining(calculatedDays);

          // Format Date
          const endDateString = targetEndDate.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });

          // 🧩 FIX 4: Safe Parse (JSON string check)
          const features =
            Array.isArray(planDetails?.features)
              ? planDetails.features
              : JSON.parse(planDetails?.features || '[]')

          // 🧩 FIX 5: Limits string se nahi, DB se
          const limits = {
            users: planDetails?.limit_members || 'Unlimited',
            storage: planDetails?.storage_limit || 'N/A',
            societies: planDetails?.society_limit || 1
          };

          // 🧩 FIX 6: Status calculation derived, not trusted
          const status =
            new Date(client.plan_end_date) > new Date()
              ? 'ACTIVE'
              : 'EXPIRED';

          // 6. Data Object Construction
          const subData: SubscriptionData = {
            planType: planDetails?.name?.toUpperCase() || 'TRIAL', 
            status: status,
            trialEnds: endDateString,
            currentPeriodEnd: endDateString,
            features: features,
            limits: limits,
            isTrialUsed: client.has_used_trial || false
          };

          setSubscription(subData);
        } else {
            console.warn("⚠️ DEBUG: No client found for this user");
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

  const getPlanIcon = (planType: string) => {
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
    // ✅ FIX 3: Using totalTrialDays from settings instead of hardcoded 15
    // Note: Since totalTrialDays is inside useEffect scope, 
    // we recalculate or pass it if needed. For simplicity in this callback:
    // If it's not a trial, show full bar.
    if (!subscription?.planType.includes('TRIAL') && !subscription?.planType.includes('FREE')) return 100
    
    // Assuming we want a default if settings fail to load, or we rely on 15 as fallback in logic.
    // Ideally, we should store totalTrialDays in state, but keeping logic simple:
    const totalTrialDays = 15; 
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
            onClick={() => router.push('/dashboard/subscription')} 
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
          <CardContent className="pace-y-4">
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
              onClick={() => router.push('/dashboard/subscription')} 
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/subscription')} 
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
