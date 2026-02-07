'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Users, Zap, Shield, Crown, Building2, Loader2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  
  // DEBUG STATE: Ye screen par data dikhane ke liye hai
  const [debugLog, setDebugLog] = useState<any>({})

  useEffect(() => {
    let isMounted = true;
    
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        
        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !user.email) {
            setDebugLog((prev: any) => ({ ...prev, error: "User not logged in" }));
            throw new Error("User not authenticated");
        }

        setDebugLog((prev: any) => ({ ...prev, userEmail: user.email }));

        // 2. Fetch Client by EMAIL (Kyuki ID alag ho sakti hai)
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .maybeSingle(); // maybeSingle crash nahi karta agar data na mile

        if (clientError) {
            setDebugLog((prev: any) => ({ ...prev, clientError: clientError.message }));
            throw clientError;
        }

        if (!client) {
            setDebugLog((prev: any) => ({ ...prev, error: "Client table returns NULL for this email" }));
            // Fake data to prevent UI crash
            throw new Error("Client not found");
        }

        setDebugLog((prev: any) => ({ ...prev, clientData: client }));

        // 3. Fetch Plan Details
        let plan = null;
        if (client.plan_id) {
            const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', client.plan_id)
            .maybeSingle();
            
            plan = planData;
            if (planError) setDebugLog((prev: any) => ({ ...prev, planError: planError.message }));
        }

        setDebugLog((prev: any) => ({ ...prev, planData: plan }));

        // --- DATE CALCULATION LOGIC ---
        // Priority: Client Table End Date > Calculated from Start > Today
        let endDate = new Date();
        let endDateString = "N/A";

        if (client.plan_end_date) {
            endDate = new Date(client.plan_end_date);
        } else if (client.plan_start_date) {
            // Agar end date nahi hai to start date + 30 days
            const start = new Date(client.plan_start_date);
            start.setDate(start.getDate() + 30);
            endDate = start;
        }

        // Time reset for accurate day calculation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(endDate);
        checkDate.setHours(0, 0, 0, 0);

        const diffTime = checkDate.getTime() - today.getTime();
        const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Safe Date String
        try {
             endDateString = endDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch (e) {
            endDateString = "Invalid Date";
        }

        // --- STATUS LOGIC ---
        let status = 'ACTIVE';
        if (calculatedDays < 0) status = 'EXPIRED';
        if (calculatedDays === 0) status = 'EXPIRES TODAY';
        
        // Agar DB me status hai to wo use karo, par expiry check ke saath
        if (client.subscription_status && client.subscription_status.toLowerCase() !== 'active') {
            status = client.subscription_status.toUpperCase();
        }

        // --- LIMITS & FEATURES LOGIC ---
        // Agar Plan table fail ho gayi, to Client table se guess karo or default values do
        const limitMembers = plan?.limit_members || 
                             (client.plan === 'PRO' ? 2000 : client.plan === 'ENTERPRISE' ? 'Unlimited' : 100);
        
        const planCode = plan?.code || client.plan || 'UNKNOWN';
        
        let featuresList = [];
        try {
            // Features JSON string ho sakta hai ya Array
            const rawFeatures = plan?.features || client.role_permissions;
            if (Array.isArray(rawFeatures)) {
                featuresList = rawFeatures;
            } else if (typeof rawFeatures === 'string') {
                featuresList = JSON.parse(rawFeatures);
                // Agar permissions object hai (jaise aapke data me hai), to keys nikalo
                if (!Array.isArray(featuresList) && typeof featuresList === 'object') {
                   featuresList = Object.keys(featuresList); 
                }
            } else {
                featuresList = ["Dashboard Access", "Member Management"];
            }
        } catch (e) {
            featuresList = ["Basic Features"];
        }

        if (isMounted) {
          setDaysRemaining(calculatedDays);
          
          const subData: SubscriptionData = {
            planType: planCode,
            status: status,
            trialEnds: endDateString,
            currentPeriodEnd: endDateString,
            features: Array.isArray(featuresList) ? featuresList : ["Standard Features"],
            limits: {
              users: limitMembers,
              storage: 'N/A',
              societies: 1
            },
            isTrialUsed: client.has_used_trial || false
          };
          setSubscription(subData);
        }

      } catch (error: any) {
        console.error('Failed to fetch subscription data:', error);
        setDebugLog((prev: any) => ({ ...prev, criticalError: error.message }));
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
    const p = planType?.toUpperCase() || '';
    if (p.includes('TRIAL') || p.includes('FREE')) return <Clock className="h-5 w-5" />
    if (p.includes('BASIC')) return <Users className="h-5 w-5" />
    if (p.includes('PRO')) return <Zap className="h-5 w-5" />
    if (p.includes('ENTERPRISE')) return <Building2 className="h-5 w-5" />
    return <Shield className="h-5 w-5" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRIAL': return 'bg-orange-100 text-orange-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'EXPIRED': 
      case 'EXPIRES TODAY': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
        <p className="text-muted-foreground">Loading Subscription...</p>
      </div>
    )
  }

  // Fallback agar subscription null hai (Error state)
  if (!subscription) {
      return (
        <div className="container mx-auto p-6">
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5"/> Subscription Data Not Found
                    </CardTitle>
                    <CardDescription>
                        We could not find a subscription for your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Logged in as: <strong>{debugLog?.userEmail}</strong></p>
                    <pre className="bg-black text-white p-4 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(debugLog, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
      )
  }

  const isTrialPlan = subscription.planType?.toUpperCase().includes('TRIAL');

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
              {getPlanIcon(subscription.planType)}
              Current Plan
            </CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plan Type</span>
              <div className="flex items-center gap-2">
                <span className="text-sm capitalize font-bold">{subscription.planType}</span>
                {(subscription.planType.toUpperCase().includes('PRO') || subscription.planType.toUpperCase().includes('ENTERPRISE')) && <Crown className="h-4 w-4 text-yellow-500" />}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className={getStatusColor(subscription.status)}>
                {subscription.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Valid Until</span>
              <span className="text-sm font-bold">{subscription.currentPeriodEnd}</span>
            </div>

            <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                <span>Validity</span>
                <span className={daysRemaining < 5 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                    {daysRemaining} Days Remaining
                </span>
                </div>
                <Progress value={daysRemaining > 30 ? 100 : (daysRemaining/30)*100} className="h-2" />
            </div>
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
                {subscription.limits.users}
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Included Features:</p>
                <ul className="space-y-1">
                  {subscription.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      <span className="truncate max-w-[200px]">{typeof feature === 'string' ? feature : 'Feature Access'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- DEBUG SECTION (REMOVE LATER) --- */}
      <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-300">
        <h3 className="font-bold text-red-600 mb-2">🛠 DEBUG PANEL (Only for developer)</h3>
        <p className="text-xs text-slate-500 mb-2">Agar upar data galat hai, to yaha check karein ki DB se kya aa raha hai.</p>
        <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
                <strong>Logged In User:</strong> {debugLog.userEmail || 'Not Found'}
            </div>
             <div>
                <strong>Days Calculated:</strong> {daysRemaining}
            </div>
            <div className="col-span-2">
                <strong>Raw Client Data:</strong>
                <pre className="bg-white p-2 mt-1 rounded border overflow-x-auto">
                    {JSON.stringify(debugLog.clientData, null, 2) || "NULL (Check RLS Policy)"}
                </pre>
            </div>
            <div className="col-span-2">
                <strong>Raw Plan Data:</strong>
                <pre className="bg-white p-2 mt-1 rounded border overflow-x-auto">
                    {JSON.stringify(debugLog.planData, null, 2) || "NULL (Plan ID mismatch?)"}
                </pre>
            </div>
        </div>
      </div>

    </div>
  )
}
