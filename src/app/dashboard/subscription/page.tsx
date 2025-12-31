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
  ShieldCheck
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PaymentModal from '@/components/client/subscription/PaymentModal';

/* -------------------- PLANS (UNCHANGED DATA) -------------------- */
const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 4000,
    durationDays: 30,
    features: ['Up to 200 Members', '30 Days Validity', 'Monthly Reports']
  },
  {
    id: 'PRO',
    name: 'Professional',
    price: 7000,
    durationDays: 30,
    features: ['Up to 2000 Members', 'Priority Support', 'API Access']
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 10000,
    durationDays: 30,
    features: ['Unlimited Members', '24/7 Support', 'White Label']
  }
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  /* -------------------- FETCH DATA (UNCHANGED) -------------------- */
  useEffect(() => {
    const fetchData = async () => {
      const { data: clients } = await supabase.from('clients').select('*').limit(1);

      if (clients && clients.length > 0) {
        const client = clients[0];
        setClientId(client.id);

        const { data: pending } = await supabase
          .from('subscription_orders')
          .select('*')
          .eq('client_id', client.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (pending) setPendingOrder(pending);

        const today = new Date();
        const expiry = new Date(client.plan_end_date || new Date());
        const daysRemaining = Math.max(
          0,
          Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
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
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-10 p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">
          Upgrade your society with secure, scalable plans
        </p>
      </div>

      {/* ================= PENDING VERIFICATION ================= */}
      {pendingOrder ? (
        <Card className="border-none shadow-xl bg-gradient-to-br from-orange-50 to-amber-100">
          <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-orange-600" />
            </div>

            <h2 className="text-3xl font-bold text-orange-800">
              Payment Under Verification
            </h2>

            <p className="text-orange-700 max-w-xl">
              Your request for <strong>{pendingOrder.plan_name}</strong> plan is
              under verification.
            </p>

            <div className="w-full max-w-md bg-white rounded-xl border p-5 space-y-3 text-left">
              <Row label="Plan" value={pendingOrder.plan_name} />
              <Row label="Transaction ID" value={pendingOrder.transaction_id} mono />
              <Row label="Status" value={<Badge className="bg-orange-500">Pending</Badge>} />
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="destructive" onClick={handleCancelRequest}>
                Cancel Request
              </Button>
            </div>

            <p className="text-xs text-orange-700 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Admin approval required
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ================= CURRENT SUBSCRIPTION ================= */}
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-blue-600" />
                Current Subscription
              </CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-4 gap-6">
              <InfoBlock title="Plan" value={subscription.planName} />
              <InfoBlock
                title="Members"
                value={`${memberCount} / ${subscription.limit}`}
              >
                <Progress value={(memberCount / subscription.limit) * 100} />
              </InfoBlock>
              <InfoBlock title="Valid Till" value={subscription.endStr} />
              <InfoBlock
                title="Days Left"
                value={`${subscription.daysRemaining} Days`}
                highlight
              />
            </CardContent>
          </Card>

          {/* ================= MODERN PLANS GRID ================= */}
          <div className="grid gap-8 md:grid-cols-3">
            {PLANS.map(plan => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition hover:shadow-xl ${
                  plan.id === 'PRO'
                    ? 'ring-2 ring-blue-600'
                    : 'border'
                }`}
              >
                {plan.id === 'PRO' && (
                  <Badge className="absolute top-4 right-4 bg-blue-600">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-4xl font-bold mt-3">
                    ₹{plan.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">per 30 days</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full h-11 text-base"
                    disabled={subscription.planName === plan.name}
                    onClick={() => handleBuyNow(plan)}
                  >
                    {subscription.planName === plan.name
                      ? 'Current Plan'
                      : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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

/* -------------------- SMALL UI HELPERS -------------------- */
function InfoBlock({ title, value, children, highlight }: any) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl border">
      <p className="text-xs text-gray-500 uppercase font-bold mb-1">{title}</p>
      <p
        className={`text-xl font-bold ${
          highlight ? 'text-green-600' : 'text-gray-800'
        }`}
      >
        {value}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'font-semibold'}>
        {value}
      </span>
    </div>
  );
}
