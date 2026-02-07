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
        
        // Step 1: Get Current Authenticated User first
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error("User not authenticated");

        // Step 2: Client fetch (Plan ID + Date + Status)
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('plan_id, plan_end_date, subscription_status')
          .eq('id', user.id)
          .single();

        if (clientError || !client) {
            console.error("Client fetch error:", clientError);
            throw clientError || new Error("Client not found");
        }

        console.log("✅ DEBUG: Fetched Client Data:", client);

        // ✅ DIFF–1: PLAN FETCH FIX (MOST IMPORTANT)
        // Ab hum plan_id ka use karke plan fetch karenge (Future Safe)
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id, name, code, limit_members, features, duration_days')
          .eq('id', client.plan_id) // ✅ FIX: id = client.plan_id
          .single();

        if (planError || !plan) {
            console.error("Plan fetch error:", planError);
            throw planError || new Error("Plan configuration missing");
        }

        // --- LOGIC FOR STATUS & DATES ---
        
        // ✅ DIFF–2: DATE + DAYS CALCULATION FIX (TIMEZONE SAFE)
        const targetEndDate = new Date(client.plan_end_date);
        const today = new Date();

        // 🔐 Normalize to avoid UTC vs IST bug
        targetEndDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffMs = targetEndDate.getTime() - today.getTime();
        const calculatedDays = Math.max(
          0,
          Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        );

        setDaysRemaining(calculatedDays);

        // ✅ DIFF–4: DATE DISPLAY (OPTIONAL BUT CLEAN)
        const endDateString = new Date(client.plan_end_date)
          .toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });

        // ✅ DIFF–3: STATUS LOGIC FIX (USER FRIENDLY)
        const status =
          calculatedDays === 0
            ? 'EXPIRES TODAY'
            : 'ACTIVE';

        // Features Safe Parse
        const features =
          Array.isArray(plan.features)
            ? plan.features
            : JSON.parse(plan.features ?? '[]');

        // Limits Mapping
        const limits = {
          users: plan.limit_members || 'Unlimited',
          storage: 'N/A',
          societies: 1
        };

        // Data Object Construction
        if (isMounted) {
          const subData: SubscriptionData = {
            planType: plan.code, // Code (PRO/TRIAL) use kar rahe hain
            status: status,
            trialEnds: endDateString,
            currentPeriodEnd: endDateString,
            features: features,
            limits: limits,
            isTrialUsed: false 
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
      case 'EXPIRES TODAY':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = () => {
    if (!subscription?.planType.includes('TRIAL') && !subscription?.planType.includes('FREE')) return 100
    // Simple logic assuming 15 days default for calculation visual
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
