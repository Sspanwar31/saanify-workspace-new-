'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/config/plans';
import { supabase } from '@/lib/supabaseClient'; // ✅ Fixed Import

export default function PricingPage() {
  const router = useRouter();
  
  // 2️⃣ STATE ADD KARO
  const [trialUsed, setTrialUsed] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 4️⃣ useEffect UPDATE (Plans Fetching)
  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

      if (!error && data) {
        setPlans(data);
      }
      setLoading(false);
    };

    fetchPlans();
  }, []);

  // 4️⃣ HANDLE PLAN SELECT (IMPORTANT FIX)
  const handlePlanSelect = (planCode: string) => {
    if (planCode === 'TRIAL' && trialUsed) {
      toast.error("You have already used your Free Trial. Please choose a paid plan.");
      return;
    }
    
    // Redirect to signup page with plan code
    router.push(`/signup?plan=${planCode}`);
  };

  // 4️⃣ OPTIONAL: Loading Guard
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading plans...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">Choose Your Plan</h1>
          <p className="text-slate-600 mt-2">
            Select the best plan for your society
          </p>
          
          {/* Trial Used Warning */}
          {trialUsed && (
            <div className="mb-8 bg-orange-100 border border-orange-200 p-4 rounded-lg flex items-center justify-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <p className="text-orange-800">
                You've already used your free trial. Select a paid plan to continue.
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const isDisabled = plan.code === 'TRIAL' && trialUsed;
            
            return (
              <div 
                key={plan.id}
                onClick={() => !isDisabled && handlePlanSelect(plan.code)}
                className={`
                  bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden hover:border-blue-400 relative
                  ${isDisabled 
                    ? 'opacity-50 cursor-not-allowed grayscale' 
                    : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'
                  }
                `}
              >
                {/* Popular Badge */}
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 z-10 transform translate-x-1/2 -translate-y-1/2">
                    <span className="bg-yellow-500 text-black px-3 py-1 text-xs font-bold shadow-sm rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <div className="text-sm text-slate-500">{plan.description}</div>
                    </div>
                    {plan.highlighted && (
                      <Badge className="bg-purple-600 text-white">Popular</Badge>
                    )}
                  </div>

                  {/* Price & Duration */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-extrabold font-bold text-slate-900 mb-1">
                      ₹{plan.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">
                      {plan.duration} days
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.slice(0, 5).map((feature: string, index: number) => (
                      <li key={index} className="flex gap-3 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) handlePlanSelect(plan.code);
                    }}
                    disabled={isDisabled}
                    className={`w-full py-3 font-semibold rounded-lg transition-colors ${
                      isDisabled 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : plan.id === 'PRO' 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {plan.code === 'TRIAL' && trialUsed ? 'Trial Used' : plan.code === 'TRIAL' ? 'Start Free Trial' : 'Choose Plan'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Footer */}
        <div className="text-center mt-12">
          <div className="flex flex-wrap gap-8 justify-center items-center text-slate-500 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Secure Payments
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Instant Activation
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Cancel Anytime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
