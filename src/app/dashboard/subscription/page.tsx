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
  Clock,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PaymentModal from '@/components/client/subscription/PaymentModal';

/* -------------------- PLANS (UNCHANGED) -------------------- */
const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 4000,
    durationDays: 30,
    features: ['Up to 200 Members', '30 Days', 'Monthly Reports'],
    color: 'bg-white border-2 border-gray-200'
  },
  {
    id: 'PRO',
    name: 'Professional',
    price: 7000,
    durationDays: 30,
    features: ['Up to 2000 Members', 'Priority Support', 'API Access'],
    color: 'bg-blue-600 text-white hover:bg-blue-700'
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 10000,
    durationDays: 30,
    features: ['Unlimited Members', '24/7 Support', 'White Label'],
    color: 'bg-purple-100 text-purple-700'
  }
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);

  // pending order (UNCHANGED LOGIC)
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  // modal
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
        const diffTime = expiry.getTime() - today.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

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
    <div className="space-y-8 p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Subscription Plans
        </h1>
        <p className="text-gray-600 mt-2">
          Choose the perfect plan for your society management needs
        </p>
      </div>

      {/* ================= PENDING VERIFICATION (MODERN UI) ================= */}
      {pendingOrder ? (
        <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-orange-50 to-amber-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.6),transparent)]" />

          <CardContent className="relative p-10 flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-10 w-10 text-orange-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-orange-800">
                Payment Under Verification
              </h2>
              <p className="text-orange-700 max-w-xl">
                Your request for the{' '}
                <strong>{pendingOrder.plan_name}</strong> plan has been received.
                Our team is verifying your payment details.
              </p>
            </div>

            <div className="w-full max-w-md bg-white/70 backdrop-blur rounded-xl border p-5 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold">{pendingOrder.plan_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-mono text-xs">
                  {pendingOrder.transaction_id}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge className="bg-orange-500">Pending Approval</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expected Time</span>
                <span className="font-medium">2–4 hours</span>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              <Button variant="destructive" onClick={handleCancelRequest}>
                Cancel Request
              </Button>
            </div>

            <p className="text-xs text-orange-700 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              You will be notified once verification is completed
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ================= CURRENT SUBSCRIPTION (UNCHANGED) ================= */}
          <Card className="border-l-4 border-l-blue-600 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-700">
                <Crown className="h-5 w-5 text-blue-600" />
                Current Subscription
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Active Plan
                  </p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-blue-700">
                      {subscription.planName}
                    </h2>
                    <Badge
                      variant={
                        subscription.status === 'active'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {subscription.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Member Usage
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-700">
                      {memberCount} / {subscription.limit}
                    </span>
                  </div>
                  <Progress
                    value={(memberCount / subscription.limit) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Validity Period
                  </p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Start:{' '}
                      <span className="font-medium">
                        {subscription.startStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> End:{' '}
                      <span className="font-medium">
                        {subscription.endStr}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl text-center border">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    Status
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      subscription.daysRemaining > 5
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {subscription.daysRemaining} Days
                  </p>
                  <p className="text-xs text-gray-400">Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ================= PLANS GRID (UNCHANGED) ================= */}
          <div className="grid gap-6 md:grid-cols-4">
            {PLANS.map(plan => (
              <Card
                key={plan.id}
                className={`relative transition-all hover:shadow-lg ${
                  plan.id === 'PRO'
                    ? 'ring-2 ring-blue-500 shadow-md'
                    : 'border-gray-200'
                }`}
              >
                {plan.id === 'PRO' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl font-extrabold mt-3 text-gray-900">
                    ₹{plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">
                      /30 days
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-gray-600"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-11 text-base ${plan.color}`}
                    onClick={() => handleBuyNow(plan)}
                    disabled={subscription.planName === plan.name}
                  >
                    {subscription.planName === plan.name
                      ? 'Current Plan'
                      : 'Buy Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ================= PAYMENT MODAL (UNCHANGED) ================= */}
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
