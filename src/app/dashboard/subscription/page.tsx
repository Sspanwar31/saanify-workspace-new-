'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { Crown, TrendingUp, CheckCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import PaymentModal from '@/components/client/subscription/PaymentModal';

// Static Plan Config
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

  // 1. Fetch Subscription Data
  useEffect(() => {
    const fetchData = async () => {
      const { data: clients } = await supabase.from('clients').select('*').limit(1);
      if (clients && clients.length > 0) {
        const client = clients[0];
        setClientId(client.id);
        
        // Calculate Days Remaining
        const today = new Date();
        const expiry = new Date(client.plan_end_date || new Date());
        const diffTime = expiry.getTime() - today.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        setSubscription({
            planName: client.plan_name || 'Free',
            status: client.subscription_status || 'inactive',
            startDate: client.plan_start_date,
            endDate: client.plan_end_date,
            daysRemaining
        });

        // Count Members
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
    <div className="space-y-6 p-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">Choose the perfect plan for your society management needs</p>
      </div>

      {/* Current Subscription Card */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5"/> Current Subscription</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-blue-600">{subscription.planName}</h2>
              <Badge variant={subscription.status === 'active' ? "default" : "destructive"}>{subscription.status?.toUpperCase()}</Badge>
            </div>
            <div className="text-sm text-gray-500">
              Members: {memberCount} used
              <Progress value={(memberCount / 2000) * 100} className="h-2 mt-1" />
            </div>
            <div className="bg-gray-50 p-3 rounded-md border">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Start: {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : '-'}</span>
                <span>End: {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}</span>
              </div>
              <div className={`text-center font-bold ${subscription.daysRemaining > 5 ? 'text-green-600' : 'text-red-600'}`}>
                {subscription.daysRemaining} Days Remaining
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.id === 'PRO' ? 'ring-2 ring-blue-500' : ''}`}>
            {plan.id === 'PRO' && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2"><Badge className="bg-blue-600">Most Popular</Badge></div>}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold mt-2">₹{plan.price}<span className="text-sm font-normal text-gray-500">/30 days</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-600" /> {feature}</li>
                ))}
              </ul>
              <Button 
                className={`w-full ${plan.color}`} 
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
