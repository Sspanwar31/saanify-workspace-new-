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
  Clock
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PaymentModal from '@/components/client/subscription/PaymentModal';

const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 4000,
    durationDays: 30,
    features: ['Up to 200 Members', '30 Days Validity', 'Monthly Reports'],
    color: 'bg-white border border-gray-200 hover:border-gray-300'
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
    color: 'bg-purple-600 text-white hover:bg-purple-700'
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

  useEffect(() => {
    const fetchData = async () => {
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

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
      await supabase
        .from('subscription_orders')
        .delete()
        .eq('id', pendingOrder.id);
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Subscription Plans
        </h1>
        <p className="text-gray-500">
          Upgrade your society with powerful features and priority support
        </p>
      </div>

      {/* Pending Verification */}
      {pendingOrder ? (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50 shadow-lg">
          <CardContent className="p-10 text-center space-y-6">
            <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-orange-100 animate-pulse">
              <Clock className="h-10 w-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-orange-800">
              Verification Pending
            </h2>
            <p className="text-orange-700 max-w-xl mx-auto">
              Your payment request for{' '}
              <strong>{pendingOrder.plan_name}</strong> is under verification.
              Transaction ID: <strong>{pendingOrder.transaction_id}</strong>
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Check Status
              </Button>
              <Button variant="destructive" onClick={handleCancelRequest}>
                Cancel Request
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Subscription */}
          <Card className="shadow-md border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5 text-blue-600" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6 items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Active Plan
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-700">
                      {subscription.planName}
                    </span>
                    <Badge>
                      {subscription.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Member Usage
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {memberCount} / {subscription.limit}
                    </span>
                  </div>
                  <Progress
                    value={(memberCount / subscription.limit) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Validity
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {subscription.startStr}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {subscription.endStr}
                    </div>
                  </div>
                </div>

                <div className="text-center bg-gray-50 border rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">
                    Days Remaining
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      subscription.daysRemaining > 5
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {subscription.daysRemaining}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map(plan => (
              <Card
                key={plan.id}
                className={`relative transition-all hover:shadow-xl ${
                  plan.id === 'PRO'
                    ? 'ring-2 ring-blue-500'
                    : 'border'
                }`}
              >
                {plan.id === 'PRO' && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-xl">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4 text-4xl font-extrabold">
                    ₹{plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">
                      /30 days
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-gray-600"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-11 ${plan.color}`}
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
