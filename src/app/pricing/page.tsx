'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ArrowLeft, Loader2, ShieldCheck, Crown, Building2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/config/plans';
import { supabase } from '@/lib/supabase-simple'; // ✅ CORRECT IMPORT (Local file hai yeh)

export default function PricingPage() {
  const router = useRouter();
  
  // 🔴 STATE & LOADERS
  const [loading, setLoading] = useState(true);
  const [trialUsed, setTrialUsed] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  // 🔴 DATA FETCH
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Check Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // 2. Check Trial Status
        // Note: DB check instead of localStorage for accuracy
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('has_used_trial')
          .eq('id', user.id)
          .single();

        if (client && client.has_used_trial) {
            setTrialUsed(true);
        }

        // 3. Fetch Plans
        const { data: dbPlans, error: plansError } = await supabase
          .from('plans')
          .select('*')
          .eq('active', true)
          .gt('price', 0)
          .order('price', { ascending: true });

        if (plansError) throw new Error("Failed to load plans.");

        if (isMounted && dbPlans) {
          const mappedPlans = dbPlans.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            durationDays: 30, // Frontend pe static for now
            features: Array.isArray(p.features) ? p.features : [],
            color: p.color, // Assuming 'color' column exists
            isPopular: p.name === 'Professional'
          }));
          setPlans(mappedPlans);
        }

      } catch (err) {
        console.error("Error loading page:", err);
        toast.error("Could not load plans.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBuyNow = (plan: any) => {
    // Payment logic here...
    console.log("Selected Plan:", plan);
  };

  const handleBuyNow = (planId: string) => {
    console.log("Plan selected:", planId);
    // Payment logic here...
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Choose Your Plan</h1>
          <p className="text-slate-600">
            {trialUsed 
              ? "You have already used your free trial. Please choose a paid plan to continue." 
              : "Select a plan that fits your society's needs."}
          </p>
        </div>

        <div className="flex gap-8 items-center text-slate-400 mb-8">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Cancel Anytime
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              Secure SSL Payment
            </span>
        </div>

        {trialUsed && (
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-8">
             <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Trial Already Used</span>
             </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan: any) => {
             const isDisabled = plan.name === 'Trial' && trialUsed;

             return (
                <div 
                  key={plan.id}
                  onClick={() => !isDisabled && handleBuyNow(plan.id)}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    isDisabled 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
                      : 'bg-white border-slate-200 hover:border-blue-500 hover:-translate-y-1 cursor-pointer'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 z-20 transform translate-x-1/2 translate-y-1/2">
                        <span className="bg-yellow-500 text-black px-3 py-1 text-xs font-bold rounded-full">
                          Most Popular
                        </span>
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className={`text-xl font-bold ${
                      plan.name === 'Professional' ? 'text-blue-600' : 'text-slate-900' 
                    }`}>
                      {plan.name}
                    </h3>
                    <div className={`mt-2 text-sm ${
                      plan.name === 'Professional' ? 'text-blue-500' : 'text-slate-600' 
                    }`}>
                      {plan.description}
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                        <div className="text-2xl font-extrabold text-slate-900">
                           {plan.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}{' '}
                           <span className="text-xs text-slate-500">
                              {plan.durationDays} days
                           </span>
                        </div>

                        {plan.isPopular && (
                           <span className="inline-flex items-center text-xs font-semibold text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md">
                              Most Popular
                           </span>
                        )}
                    </div>

                    <ul className="space-y-3 mt-4">
                      {plan.features.slice(0, 4).map((feature: string, index) => (
                        <li key={index} className="flex gap-2 text-sm text-slate-700">
                           <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                           {feature}
                        </li>
                      ))}
                    </ul>

                    <Button 
                       onClick={(e) => { e.stopPropagation(); handleBuyNow(plan.id); }}
                       className={`w-full h-12 text-base font-semibold transition-all ${
                          isDisabled
                            ? 'bg-gray-300 text-gray-400 cursor-not-allowed' 
                            : plan.name === 'Professional' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                       disabled={isDisabled}
                    >
                       {isDisabled 
                         ? 'Trial Used'
                         : plan.name === 'TRIAL' ? 'Start Free Trial' : 'Choose Plan'}
                       }
                    </Button>
                  </div>
                </div>
             );
          })}
        </div>

        {/* Trust Footer */}
        <div className="text-center mt-12">
          <div className="flex gap-8 items-center text-slate-400">
             <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Bank-grade security & encryption
             </span>
             <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                7 Days Money-Back Guarantee
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, value, highlight }: any) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase font-bold mb-1 tracking-wide">{title}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-green-600' : 'text-slate-900'}`}>
        {value}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value, mono, highlight }: any) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-dashed border-slate-200 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : 'font-semibold'} ${highlight ? 'text-orange-700 dark:text-orange-400' : 'text-slate-900 dark:text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

function PendingModal() {
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  return (
    <div className="flex justify-center min-h-screen z-50 bg-slate-900/90 flex flex-col items-center justify-center">
       <Card className="w-full max-w-2xl border-none shadow-2xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/40 dark:to-gray-900 overflow-hidden border border-orange-200 dark:border-orange-900/50">
         <CardContent className="p-8 text-center space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-orange-900 dark:text-orange-400 mb-2">
                    Verification Pending
                </h2>
                <p className="text-orange-700/80 dark:text-orange-200/70">
                    We have received your payment request. Admin approval is required.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 text-left shadow-sm">
                <Row label="Requested Plan" value={pendingOrder.plan_name} highlight />
                <Row label="Amount Paid" value={`₹${pendingOrder.amount.toLocaleString()}`} />
                <Row label="Transaction ID" value={pendingOrder.transaction_id || 'N/A'} mono />
                <Row label="Date" value={new Date(pendingOrder.created_at).toLocaleDateString()} />
                <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-white">Pending Approval</Badge>
                </div>
            </div>

            <div className="flex gap-4 justify-center pt-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()} 
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-950/30"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => router.push('/support')}
                  disabled={isCancelling}
                  className="text-red-500 hover:text-red-400 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  {isCancelling ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isCancelling ? "Cancelling..." : "Cancel Request"}
                </Button>
            </div>

            <p className="text-xs text-orange-500/80 dark:text-orange-500/80 flex items-center justify-center gap-1">
               <ShieldCheck className="h-3 w-3" /> Secure Payment Processing
            </p>
         </CardContent>
       </Card>
    </div>
  );
}
