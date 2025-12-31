'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { Crown, CheckCircle, RefreshCw, Loader2, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PaymentModal from '@/components/client/subscription/PaymentModal';

// Static Plan Config (To show options)
const PLANS = [
  { id: 'TRIAL', name: 'Free Trial', price: 0, durationDays: 15, features: ['Up to 100 Members', '15 Days', 'Basic Support'], color: 'bg-gray-100 text-gray-800' },
  { id: 'BASIC', name: 'Basic', price: 4000, durationDays: 30, features: ['Up to 200 Members', '30 Days', 'Monthly Reports'], color: 'bg-white border-2 border-gray-200' },
  { id: 'PRO', name: 'Professional', price: 7000, durationDays: 30, features: ['Up to 2000 Members', 'Priority Support', 'API Access'], color: 'bg-blue-600 text-white hover:bg-blue-700' },
  { id: 'ENTERPRISE', name: 'Enterprise', price: 10000, durationDays: 30, features: ['Unlimited Members', '24/7 Support', 'White Label'], color: 'bg-purple-100 text-purple-700' }
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // 1. Fetch Live Subscription Data
  useEffect(() => {
    const fetchData = async () => {
      // Get Client
      const { data: clients } = await supabase.from('clients').select('*').limit(1);
      
      if (clients && clients.length > 0) {
        const client = clients[0];
        setClientId(client.id);
        
        // Calculate Days Remaining
        const today = new Date();
        const expiry = new Date(client.plan_end_date || new Date());
        const diffTime = expiry.getTime() - today.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        // Format Dates
        const startStr = client.plan_start_date ? new Date(client.plan_start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
        const endStr = client.plan_end_date ? new Date(client.plan_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

        setSubscription({
            planName: client.plan_name || 'Free',
            status: client.subscription_status || 'inactive',
            startStr,
            endStr,
            daysRemaining,
            limit: client.plan_name === 'Free' ? 100 : (client.plan_name === 'Basic' ? 200 : (client.plan_name === 'Professional' ? 2000 : 9999))
        });

        // Count Members (Live)
        const { count } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('client_id', client.id);
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>;

  return (
    <div className="space-y-8 p-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">Choose the perfect plan for your society management needs</p>
      </div>

      {/* ✅ UPDATED: Current Subscription Card (Better Layout) */}
      <Card className="border-l-4 border-l-blue-600 shadow-sm">
        <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-700">
                <Crown className="h-5 w-5 text-blue-600"/> Current Subscription
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* 1. Plan Name */}
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Active Plan</p>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-blue-700">{subscription.planName}</h2>
                    <Badge variant={subscription.status === 'active' ? "default" : "destructive"}>
                        {subscription.status?.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* 2. Usage */}
            <div>
                 <p className="text-xs text-gray-500 uppercase font-bold mb-1">Member Usage</p>
                 <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-400"/>
                    <span className="font-semibold text-gray-700">{memberCount} / {subscription.limit}</span>
                 </div>
                 <Progress value={(memberCount / subscription.limit) * 100} className="h-2" />
            </div>

            {/* 3. Dates */}
            <div>
                 <p className="text-xs text-gray-500 uppercase font-bold mb-1">Validity Period</p>
                 <div className="text-sm text-gray-700 space-y-1">
                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3"/> Start: <span className="font-medium">{subscription.startStr}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3"/> End: <span className="font-medium">{subscription.endStr}</span></div>
                 </div>
            </div>

            {/* 4. Days Remaining */}
            <div className="bg-gray-50 p-4 rounded-xl text-center border">
                 <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                 <p className={`text-xl font-bold ${subscription.daysRemaining > 5 ? 'text-green-600' : 'text-red-600'}`}>
                    {subscription.daysRemaining} Days
                 </p>
                 <p className="text-xs text-gray-400">Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`relative transition-all hover:shadow-lg ${plan.id === 'PRO' ? 'ring-2 ring-blue-500 shadow-md' : 'border-gray-200'}`}>
            {plan.id === 'PRO' && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2"><Badge className="bg-blue-600 px-3 py-1">Most Popular</Badge></div>}
            
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <div className="text-3xl font-extrabold mt-3 text-gray-900">
                ₹{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/30 days</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-4">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> 
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full h-11 text-base ${plan.color} transition-transform active:scale-95`} 
                onClick={() => handleBuyNow(plan)}
                disabled={subscription.planName === plan.name}
              >
                {subscription.planName === plan.name ? 'Current Plan' : 'Buy Now'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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
