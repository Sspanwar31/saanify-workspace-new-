'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  Loader2,
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
  
  // Pending Order State
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  
  // Dynamic Plans State (Replaces Static List)
  const [plans, setPlans] = useState<any[]>([]);
  
  // Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  /* -------------------- FETCH DATA (BACKEND CONNECTED) -------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Get Client Info
        const { data: clients } = await supabase.from('clients').select('*').limit(1);

        if (clients && clients.length > 0) {
          const client = clients[0];
          setClientId(client.id);

          // 2. Check for Pending Orders
          const { data: pendingData, error: pendingError } = await supabase
            .from('subscription_orders')
            .select('*')
            .eq('client_id', client.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);

          if (!pendingError && pendingData && pendingData.length > 0) {
             setPendingOrder(pendingData[0]);
          }

          // 3. Calculate Subscription Details
          const today = new Date();
          const expiry = new Date(client.plan_end_date || new Date());
          const diffTime = expiry.getTime() - today.getTime();
          const daysRemaining = Math.max(
            0,
            Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          );

          setSubscription({
            planName: client.plan_name || 'Free',
            status: client.subscription_status || 'inactive',
            startStr: client.plan_start_date
              ? new Date(client.plan_start_date).toLocaleDateString('en-IN')
              : '-',
            endStr: client.plan_end_date
              ? new Date(client.plan_end_date).toLocaleDateString('en-IN')
              : '-',
            daysRemaining,
            limit:
              client.plan_name === 'Free'
                ? 100
                : client.plan_name === 'Basic'
                ? 200
                : client.plan_name === 'Professional'
                ? 2000
                : client.plan_name === 'Enterprise'
                ? 9999
                : 100 // Default fallback
          });

          // 4. Fetch ACTIVE PLANS FROM DATABASE (Dynamic Logic)
        const { data: dbPlans, error: plansError } = await supabase
          .from('plans')
          .select('*')
          .eq('active', true) // Only show plans enabled by Admin
          .order('price', { ascending: true }); // <--- YE NAYA HAI: Sirf wo plan jinka price 0 se jyada hai unhe pehle dikhana hai

        if (!plansError && dbPlans) {
          // Map DB structure to UI structure if needed
          const mappedPlans = dbPlans.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            durationDays: 30, // Default duration
            features: Array.isArray(p.features) ? p.features : [], // Ensure array
            // Maintain original styling for known plans, allow dynamic styling for new ones
            color: getPlanStyle(p.name, p.color),
            isPopular: p.name === 'Professional' // Example logic for popular badge
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

  // Helper to maintain your specific UI design per plan
  const getPlanStyle = (name: string, dbColor: string) => {
    if (name === 'Professional' || name === 'Pro') {
      return 'bg-blue-700 text-white hover:bg-blue-800 shadow-md ring-2 ring-blue-600 scale-105 z-10'; // Original Pro Style
    }
    if (name === 'Enterprise') {
      return 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-2 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:hover:bg-purple-900/60 dark:border-purple-700'; // Original Enterprise Style
    }
    if (name === 'Basic') {
      return 'bg-gray-100 border-2 border-gray-200 text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700';
    }
    // Fallback for new custom plans created by Admin
    return `bg-white border-2 ${dbColor || 'border-gray-200'} text-gray-900 hover:shadow-lg dark:bg-gray-900 dark:text-gray-100`;
  };

  const handleBuyNow = (plan: any) => {
    setSelectedPlan(plan);
    setIsPaymentOpen(true);
  };

  // Logic to cancel pending request
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

  return (
    <div className="bg-slate-50 dark:bg-slate-900 space-y-10 p-6 min-h-screen">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Subscription Plans</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Upgrade your society with secure, scalable plans
        </p>
      </div>

      {/* ================= LOGIC: PENDING SCREEN vs PLANS ================= */}
      
      {pendingOrder ? (
        // --- 1. PENDING VERIFICATION SCREEN ---
        <div className="flex justify-center animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-2xl border-none shadow-2xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/40 dark:to-gray-900 overflow-hidden border border-orange-200 dark:border-orange-900/50">
                <div className="bg-orange-100 dark:bg-orange-950/30 p-6 flex justify-center border-b border-orange-200 dark:border-orange-900/50">
                    <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm animate-pulse border border-orange-200 dark:border-orange-700">
                        <Loader2 className="h-12 w-12 text-orange-600 dark:text-orange-500" />
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
                        <Row label="Requested Plan" value={pendingOrder.plan_name} highlight />
                        <Row label="Amount Paid" value={`₹${pendingOrder.amount.toLocaleString()}`} />
                        <Row label="Transaction ID" value={pendingOrder.transaction_id || 'N/A'} mono />
                        <Row label="Date" value={new Date(pendingOrder.created_at).toLocaleDateString()} />
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:hover:bg-orange-900/60 px-3 py-1">Pending Approval</Badge>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center pt-2">
                        <Button variant="outline" onClick={() => window.location.reload()} className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/30">
                            <Loader2 className="h-4 w-4 mr-2" /> Check Status
                        </Button>
                        <Button variant="ghost" onClick={handleCancelRequest} className="text-red-500 hover:text-red-400 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                            Cancel Request
                        </Button>
                    </div>

                    <p className="text-xs text-orange-500/80 dark:text-orange-500/80 flex items-center justify-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Secure Payment Processing
                    </p>
                </CardContent>
            </Card>
        </div>
      ) : (
        <>
          {/* ================= 2. CURRENT SUBSCRIPTION & PLANS ================= */}
          
          {/* Current Subscription Card */}
          <Card className="border-l-4 border-l-blue-600 shadow-sm overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-4 bg-gray-50/50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                {/* Removed Crown to fix imports, using Loader2 logic if needed or just text */}
                Current Subscription
              </CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-4 gap-6 pt-6">
              <InfoBlock title="Active Plan" value={subscription.planName} />
              <InfoBlock
                title="Member Usage"
                value={`${memberCount} / ${subscription.limit}`}
              >
                <Progress value={(memberCount / subscription.limit) * 100} className="h-2 mt-2 bg-blue-100 dark:bg-gray-800" />
              </InfoBlock>
              <InfoBlock title="Valid Until" value={subscription.endStr} />
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900 text-center">
                 <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Status</p>
                 <p className={`text-2xl font-bold ${subscription.daysRemaining > 5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {subscription.daysRemaining} Days
                 </p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
              </div>
            </CardContent>
          </Card>

          {/* Plans Grid - DYNAMIC & RESPONSIVE */}
          {plans.length > 0 ? (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
              {plans.map(plan => (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between ${plan.color}`}
                >
                  {/* Badge for Popular Plan */}
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
                        <span className={`text-4xl font-extrabold ${plan.name === 'Professional' ? 'text-white' : 'text-gray-900 dark:text-gray-200'}`}>
                          ₹{plan.price.toLocaleString()}
                        </span>
                        <span className={`text-sm font-medium ${plan.name === 'Professional' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          / 30 days
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-8">
                      <ul className="space-y-4 px-2">
                        {plan.features.map((f: string, i: number) => (
                          <li key={i} className={`flex gap-3 text-sm ${plan.name === 'Professional' ? 'text-blue-50' : 'text-gray-600 dark:text-gray-300'}`}>
                            <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${plan.name === 'Professional' ? 'bg-blue-600 text-white' : 'bg-green-600 dark:bg-green-900/40 dark:text-green-100'}`}>
                                <div className="h-2 w-2 rounded-full bg-white dark:bg-gray-900 opacity-20"></div>
                                {/* Replaced CheckCircle with inline check */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" /></svg>
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
                      disabled={subscription.planName === plan.name}
                      onClick={() => handleBuyNow(plan)}
                    >
                      {subscription.planName === plan.name
                        ? 'Current Plan'
                        : 'Choose Plan'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Fallback if no plans are active
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
                <Loader2 className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No Active Plans Available</h3>
                <p className="text-gray-500 mt-2">Please contact support or check back later.</p>
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
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

/* -------------------- UI HELPERS -------------------- */
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
