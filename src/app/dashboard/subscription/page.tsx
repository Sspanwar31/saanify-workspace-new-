'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { Crown, CheckCircle, Loader2, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PaymentModal from '@/components/client/subscription/PaymentModal';

/* =======================
   STATIC PLANS (UI ONLY)
   ======================= */
const PLANS = [
  { id: 'BASIC', name: 'Basic', price: 4000, durationDays: 30, features: ['Up to 200 Members', '30 Days', 'Monthly Reports'] },
  { id: 'PRO', name: 'Professional', price: 7000, durationDays: 30, features: ['Up to 2000 Members', 'Priority Support', 'API Access'] },
  { id: 'ENTERPRISE', name: 'Enterprise', price: 10000, durationDays: 30, features: ['Unlimited Members', '24/7 Support', 'White Label'] }
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  /* =======================
     FETCH LIVE SUBSCRIPTION
     ======================= */
  useEffect(() => {
    const fetchData = async () => {
      const { data: clients } = await supabase.from('clients').select('*').limit(1);

      if (clients && clients.length > 0) {
        const client = clients[0];
        setClientId(client.id);

        const today = new Date();
        const expiry = new Date(client.plan_end_date || new Date());
        const diffTime = expiry.getTime() - today.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        const startStr = client.plan_start_date
          ? new Date(client.plan_start_date).toLocaleDateString('en-IN')
          : '-';
        const endStr = client.plan_end_date
          ? new Date(client.plan_end_date).toLocaleDateString('en-IN')
          : '-';

        setSubscription({
          planName: client.plan_name,
          status: client.subscription_status,
          startStr,
          endStr,
          daysRemaining,
          limit:
            client.plan_name === 'Basic'
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

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-10 p-6 max-w-7xl mx-auto">

      {/* =======================
         PAGE HEADER
         ======================= */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
        <p className="text-gray-500 mt-1">
          Manage your plan and upgrade anytime
        </p>
      </div>

      {/* =======================
         CURRENT PLAN
         ======================= */}
      <Card className="border-l-4 border-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <Crown className="h-5 w-5 text-blue-600" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-6 items-center">

          <div>
            <p className="text-xs text-gray-500 uppercase">Plan</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-blue-700">
                {subscription.planName}
              </h2>
              <Badge>{subscription.status}</Badge>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Member Usage</p>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">
                {memberCount} / {subscription.limit}
              </span>
            </div>
            <Progress value={(memberCount / subscription.limit) * 100} />
          </div>

          <div className="text-sm text-gray-700 space-y-1">
            <div className="flex gap-2">
              <Calendar className="w-4 h-4" /> Start: {subscription.startStr}
            </div>
            <div className="flex gap-2">
              <Calendar className="w-4 h-4" /> End: {subscription.endStr}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-center border">
            <p className="text-xs text-gray-500 uppercase">Days Remaining</p>
            <p
              className={`text-2xl font-bold ${
                subscription.daysRemaining > 5
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {subscription.daysRemaining}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* =======================
         PLANS GRID (NO TRIAL)
         ======================= */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.id === 'PRO' ? 'ring-2 ring-blue-600' : ''
            }`}
          >
            {plan.id === 'PRO' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}

            <CardHeader className="text-center">
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold mt-2">
                ₹{plan.price.toLocaleString()}
                <span className="text-sm text-gray-500"> / month</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <ul className="space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full h-11"
                onClick={() => handleBuyNow(plan)}
                disabled={subscription.planName === plan.name}
              >
                {subscription.planName === plan.name
                  ? 'Current Plan'
                  : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* =======================
         PAYMENT MODAL
         ======================= */}
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
