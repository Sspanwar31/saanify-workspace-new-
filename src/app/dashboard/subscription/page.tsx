'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  Crown,
  CheckCircle,
  RefreshCw,
  Loader2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Building2,
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PaymentModal from '@/components/client/subscription/PaymentModal'; 
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Get Logged In User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            console.error("User not logged in");
            return;
        }

        // 2. Fetch Client Data (Base Info)
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

        if (clientError) throw clientError;

        if (client) {
          setClientId(client.id);

          // 3. Fetch Plan Details using 'plan_id' (LINKING TABLES)
          let activePlanDetails = null;
          
          if (client.plan_id) {
             // Agar client ke paas plan_id hai, to plans table se data uthao
             const { data: planData } = await supabase
                .from('plans')
                .select('*')
                .eq('id', client.plan_id)
                .single();
             activePlanDetails = planData;
          }

          // 4. Fallback Logic (Agar plan_id missing ho to text se dhundo)
          if (!activePlanDetails && client.plan) {
             const { data: planDataByName } = await supabase
                .from('plans')
                .select('*')
                .ilike('code', client.plan) // e.g. matches 'PRO' with 'PRO'
                .maybeSingle();
             activePlanDetails = planDataByName;
          }

          // --- PENDING ORDER CHECK ---
          const { data: pendingData } = await supabase
            .from('subscription_orders')
            .select('*')
            .eq('client_id', client.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);

          if (pendingData && pendingData.length > 0) {
             setPendingOrder(pendingData[0]);
          }

          // --- DATE CALCULATION LOGIC ---
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let endDate = new Date();
          // Priority: DB End Date > Subscription Expiry > Calculated
          if (client.plan_end_date) {
            endDate = new Date(client.plan_end_date);
          } else if (client.subscription_expiry) {
            endDate = new Date(client.subscription_expiry);
          } else {
             // Fallback: created_at + duration from plan table
             const duration = activePlanDetails?.duration_days || 30;
             endDate = new Date(client.created_at || new Date());
             endDate.setDate(endDate.getDate() + duration);
          }
          endDate.setHours(0, 0, 0, 0);

          const diffTime = endDate.getTime() - today.getTime();
          const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          const status = daysRemaining > 0 ? 'ACTIVE' : 'EXPIRED';

          // --- MEMBER LIMIT LOGIC (From Plans Table) ---
          // Ab hum hardcode nahi karenge, table se value lenge
          const limit = activePlanDetails?.limit_members || 100; // Default 100 if nothing found
          const planNameDisplay = activePlanDetails?.name || client.plan || 'Basic';

          // --- FETCH MEMBER COUNT ---
          const { count } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id);

          const currentMemberCount = count || 0;

          // --- SET SUBSCRIPTION STATE ---
          setSubscription({
            planName: planNameDisplay,
            status: status,
            endStr: endDate.toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            }),
            daysRemaining: daysRemaining,
            limit: limit, // Table value: 2000, 999999, etc.
            usagePercent: Math.min(100, (currentMemberCount / limit) * 100)
          });
          
          setMemberCount(currentMemberCount);
        }

        // --- FETCH ALL PLANS (For Upgrade Cards) ---
        const { data: dbPlans } = await supabase
          .from('plans')
          .select('*')
          .eq('active', true)
          .gt('price', 0)
          .order('price', { ascending: true });

        if (dbPlans) {
          const mappedPlans = dbPlans.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            durationDays: p.duration_days || 30,
            features: Array.isArray(p.features) ? p.features : [],
            color: getPlanStyle(p.name, p.color),
            isPopular: p.name === 'Professional',
            code: p.code
          }));
          setPlans(mappedPlans);
        }

      } catch (err) {
        console.error("Error loading subscription page:", err);
        toast.error("Failed to load subscription details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPlanStyle = (name: string, dbColor: string) => {
    if (name === 'Professional' || name === 'Pro') {
      return 'bg-blue-700 text-white hover:bg-blue-800 shadow-md ring-2 ring-blue-600 scale-105 z-10'; 
    }
    if (name === 'Enterprise') {
      return 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-2 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:hover:bg-purple-900/60 dark:border-purple-700'; 
    }
    if (name === 'Basic') {
      return 'bg-gray-100 border-2 border-gray-200 text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700';
    }
    return `bg-white border-2 ${dbColor || 'border-gray-200'} text-gray-900 hover:shadow-lg dark:bg-gray-900 dark:text-gray-100`;
  };

  const handleBuyNow = (plan: any) => {
    setSelectedPlan(plan);
    setIsPaymentOpen(true);
  };

  const handleCancelRequest = async () => {
    if (!pendingOrder) return;
    if (confirm('Are you sure you want to cancel this request?')) {
      setLoading(true); 
      try {
        const { error } = await supabase
          .from('subscription_orders')
          .delete()
          .eq('id', pendingOrder.id);
        if (error) throw error;
        toast.success("Request cancelled successfully");
        setPendingOrder(null); 
        window.location.reload(); 
      } catch (err: any) {
        console.error("Cancel Error:", err);
        toast.error("Failed to cancel request: " + err.message);
        setLoading(false);
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20 flex-col items-center gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        <p className="text-gray-500 text-sm">Loading your subscription details...</p>
      </div>
    );

  // Fallback UI agar data load na ho (No Plan fix)
  if (!subscription && !loading) {
     return (
        <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-red-500">Subscription Data Not Found</h2>
            <p className="text-gray-500">Please contact support with your email.</p>
        </div>
     )
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 space-y-10 p-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Subscription Plans</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Upgrade your society with secure, scalable plans
        </p>
      </div>

      {pendingOrder ? (
        <div className="flex justify-center animate-in fade-in zoom-in duration-300">
             <Card className="w-full max-w-2xl border-none shadow-2xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/40 dark:to-gray-900 overflow-hidden border border-orange-200 dark:border-orange-900/50">
                <div className="bg-orange-100 dark:bg-orange-950/30 p-6 flex justify-center border-b border-orange-200 dark:border-orange-900/50">
                    <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm animate-pulse border border-orange-200 dark:border-orange-700">
                        <Clock className="h-12 w-12 text-orange-600 dark:text-orange-500" />
                    </div>
                </div>
                <CardContent className="p-8 text-center space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold text-orange-900 dark:text-orange-400 mb-2">
                            Verification Pending
                        </h2>
                        <p className="text-orange-700/80 dark:text-orange-200/70">
                            We have received your payment request. Admin approval is required.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 text-left shadow-sm">
                        <Row label="Requested Plan" value={pendingOrder.plan_name} />
                        <Row label="Amount Paid" value={`₹${pendingOrder.amount.toLocaleString()}`} />
                        <Row label="Date" value={new Date(pendingOrder.created_at).toLocaleDateString()} />
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-700 dark:text-white dark:hover:bg-orange-600 px-3 py-1">Pending Approval</Badge>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center pt-2">
                        <Button variant="outline" onClick={() => window.location.reload()} className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/30">
                            <RefreshCw className="h-4 w-4 mr-2" /> Check Status
                        </Button>
                        <Button variant="ghost" onClick={handleCancelRequest} className="text-red-500 hover:text-red-400 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                            Cancel Request
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      ) : (
        <>
          <Card className="border-l-4 border-l-blue-600 shadow-sm overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-4 bg-gray-50/50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                <Crown className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-4 gap-6 pt-6">
              
              <InfoBlock title="Active Plan" value={subscription?.planName} />
              
              <InfoBlock
                title="Member Usage"
                value={`${memberCount} / ${subscription?.limit}`}
              >
                <Progress 
                    value={subscription?.usagePercent || 0} 
                    className="h-2 mt-2 bg-blue-100 dark:bg-gray-800" 
                />
              </InfoBlock>
              
              <InfoBlock title="Valid Until" value={subscription?.endStr} />
              
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900 text-center">
                 <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Status</p>
                 <p className={`text-2xl font-bold ${subscription?.daysRemaining > 5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {subscription?.daysRemaining} Days
                 </p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
              </div>
            </CardContent>
          </Card>

          {/* PLANS LIST */}
          {plans.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8 items-stretch">
              {plans.map(plan => (
                <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between w-full md:max-w-[360px] lg:max-w-[380px] ${plan.color}`}
                  >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 z-20">
                        <Badge className="rounded-none rounded-bl-xl bg-yellow-500 text-black px-4 py-1 text-xs font-bold border-none shadow-sm">
                          Most Popular
                        </Badge>
                    </div>
                  )}

                  <div>
                    <CardHeader className="text-center pb-4 pt-8">
                      <CardTitle className={`text-2xl ${plan.name === 'Professional' ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        {plan.name}
                      </CardTitle>
                      <div className="mt-4 flex items-baseline justify-center gap-1">
                        <span className={`text-4xl font-extrabold ${plan.name === 'Professional' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          ₹{plan.price.toLocaleString()}
                        </span>
                        <span className={`text-sm font-medium ${plan.name === 'Professional' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          / {plan.durationDays} days
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-8">
                      <ul className="space-y-4 px-2">
                        {plan.features.map((f: string, i: number) => (
                          <li key={i} className={`flex gap-3 text-sm ${plan.name === 'Professional' ? 'text-blue-50' : 'text-gray-600 dark:text-gray-300'}`}>
                            <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${plan.name === 'Professional' ? 'bg-blue-600 text-white' : 'bg-green-100 dark:bg-green-900/40'}`}>
                                <CheckCircle className={`h-3 w-3 ${plan.name === 'Professional' ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
                            </div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0 mt-auto">
                    <Button
                      className={`w-full h-12 text-base font-semibold shadow-sm transition-all
                        ${plan.name === 'Professional' 
                          ? 'bg-white text-blue-700 hover:bg-blue-50' 
                          : plan.name === 'Enterprise'
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900'
                        }
                      `}
                      // Improved: Compare Plan Code or Name
                      disabled={subscription?.planName?.toLowerCase() === plan.name.toLowerCase()}
                      onClick={() => handleBuyNow(plan)}
                    >
                      {subscription?.planName?.toLowerCase() === plan.name.toLowerCase()
                        ? 'Current Plan'
                        : 'Choose Plan'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
                <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Active Plans Available</h3>
                <p className="text-gray-500 mt-2">Please contact support or check back later.</p>
            </div>
          )}
        </>
      )}

      {selectedPlan && clientId && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          plan={selectedPlan}
          clientId={clientId}
        />
      )}
    </div>
  );
}

function InfoBlock({ title, value, children, highlight }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase font-bold mb-1 tracking-wide">{title}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-200'}`}>
        {value}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value, mono, highlight }: any) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : 'font-semibold'} ${highlight ? 'text-orange-700 dark:text-orange-400 text-lg' : 'text-gray-900 dark:text-gray-200'}`}>
        {value}
      </span>
    </div>
  );
}
