'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  Crown,
  CheckCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Users,
  AlertTriangle,
  ShieldCheck,
  Clock // Added Clock icon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PaymentModal from '@/components/client/subscription/PaymentModal';
import { toast } from 'sonner';

/* -------------------- PLANS DATA -------------------- */
const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 4000,
    durationDays: 30,
    features: ['Up to 200 Members', '30 Days Validity', 'Monthly Reports'],
    color: 'bg-gray-800 border-2 border-gray-700 text-gray-100 hover:bg-gray-700'
  },
  {
    id: 'PRO',
    name: 'Professional',
    price: 7000,
    durationDays: 30,
    features: ['Up to 2000 Members', 'Priority Support', 'API Access'],
    color: 'bg-blue-700 text-white hover:bg-blue-800 shadow-md'
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 10000,
    durationDays: 30,
    features: ['Unlimited Members', '24/7 Support', 'White Label'],
    color: 'bg-purple-900/40 text-purple-200 hover:bg-purple-900/60 border border-purple-700'
  }
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Pending Order State
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  
  // Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  /* -------------------- FETCH DATA (BACKEND CONNECTED) -------------------- */
  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Client Info
      const { data: clients } = await supabase.from('clients').select('*').limit(1);

      if (clients && clients.length > 0) {
        const client = clients[0];
        setClientId(client.id);

        // 2. Check for Pending Orders (FIXED: Removing .single() to avoid 406 Error)
        const { data: pendingData, error } = await supabase
          .from('subscription_orders')
          .select('*')
          .eq('client_id', client.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && pendingData && pendingData.length > 0) {
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
              : 9999
        });

        // 4. Get Member Count
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);

        setMemberCount(count || 0);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleBuyNow = (plan: any) => {
    setSelectedPlan(plan);
    setIsPaymentOpen(true);
  };

  // Logic to cancel pending request
  const handleCancelRequest = async () => {
    if (!pendingOrder) return;
    if (confirm('Are you sure you want to cancel this request?')) {
      await supabase.from('subscription_orders').delete().eq('id', pendingOrder.id);
      window.location.reload();
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );

  return (
    <div className="space-y-10 p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Subscription Plans</h1>
        <p className="text-gray-400 mt-2">
          Upgrade your society with secure, scalable plans
        </p>
      </div>

      {/* ================= LOGIC: PENDING SCREEN vs PLANS ================= */}
      
      {pendingOrder ? (
        // --- 1. PENDING VERIFICATION SCREEN ---
        <div className="flex justify-center">
            <Card className="w-full max-w-2xl border-none shadow-2xl bg-gradient-to-br from-orange-950/40 to-gray-900 overflow-hidden border border-orange-900/50">
                <div className="bg-orange-950/30 p-6 flex justify-center border-b border-orange-900/50">
                    <div className="h-24 w-24 rounded-full bg-gray-900 flex items-center justify-center shadow-sm animate-pulse border border-orange-700">
                        <Clock className="h-12 w-12 text-orange-500" />
                    </div>
                </div>
                <CardContent className="p-8 text-center space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold text-orange-400 mb-2">
                        Verification Pending
                        </h2>
                        <p className="text-orange-200/70">
                        We have received your payment request. Admin approval is required.
                        </p>
                    </div>

                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4 text-left shadow-sm">
                        <Row label="Requested Plan" value={pendingOrder.plan_name} highlight />
                        <Row label="Amount Paid" value={`₹${pendingOrder.amount.toLocaleString()}`} />
                        <Row label="Transaction ID" value={pendingOrder.transaction_id || 'N/A'} mono />
                        <Row label="Date" value={new Date(pendingOrder.created_at).toLocaleDateString()} />
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500 text-sm">Status</span>
                            <Badge className="bg-orange-700 hover:bg-orange-600 text-white px-3 py-1">Pending Approval</Badge>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center pt-2">
                        <Button variant="outline" onClick={() => window.location.reload()} className="border-orange-700 text-orange-400 hover:bg-orange-950/30">
                            <RefreshCw className="h-4 w-4 mr-2" /> Check Status
                        </Button>
                        <Button variant="ghost" onClick={handleCancelRequest} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                            Cancel Request
                        </Button>
                    </div>

                    <p className="text-xs text-orange-500/80 flex items-center justify-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Secure Payment Processing
                    </p>
                </CardContent>
            </Card>
        </div>
      ) : (
        <>
          {/* ================= 2. CURRENT SUBSCRIPTION & PLANS ================= */}
          
          {/* Current Subscription Card */}
          <Card className="border-l-4 border-l-blue-600 shadow-sm overflow-hidden bg-gray-900 border-gray-800">
            <CardHeader className="pb-4 bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Crown className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-4 gap-6 pt-6">
              <InfoBlock title="Active Plan" value={subscription.planName} />
              <InfoBlock
                title="Member Usage"
                value={`${memberCount} / ${subscription.limit}`}
              >
                <Progress value={(memberCount / subscription.limit) * 100} className="h-2 mt-2 bg-gray-800" />
              </InfoBlock>
              <InfoBlock title="Valid Until" value={subscription.endStr} />
              <div className="bg-blue-950/30 p-4 rounded-xl border border-blue-900 text-center">
                 <p className="text-xs text-blue-400 uppercase font-bold mb-1">Status</p>
                 <p className={`text-2xl font-bold ${subscription.daysRemaining > 5 ? 'text-green-400' : 'text-red-400'}`}>
                    {subscription.daysRemaining} Days
                 </p>
                 <p className="text-xs text-gray-500">Remaining</p>
              </div>
            </CardContent>
          </Card>

          {/* Plans Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            {PLANS.map(plan => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-gray-900 ${
                  plan.id === 'PRO'
                    ? 'ring-2 ring-blue-600 shadow-lg scale-105'
                    : 'border border-gray-800'
                }`}
              >
                {plan.id === 'PRO' && (
                  <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-xl bg-blue-600 px-4 py-1 text-xs">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl text-gray-100">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-white">₹{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-400 font-medium">/ 30 days</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  <ul className="space-y-4 px-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-300">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-green-900/40 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-12 text-base font-semibold shadow-sm ${plan.color}`}
                    disabled={subscription.planName === plan.name}
                    onClick={() => handleBuyNow(plan)}
                  >
                    {subscription.planName === plan.name
                      ? 'Current Plan'
                      : 'Choose Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
}

/* -------------------- UI HELPERS -------------------- */
function InfoBlock({ title, value, children, highlight }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-wide">{title}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-green-400' : 'text-gray-200'}`}>
        {value}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value, mono, highlight }: any) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-dashed border-gray-800 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-400">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : 'font-semibold'} ${highlight ? 'text-orange-400 text-lg' : 'text-gray-200'}`}>
        {value}
      </span>
    </div>
  );
}
