'use client';

import { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS } from '@/config/plans';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PricingPage() {
  const router = useRouter();
  const [trialUsed, setTrialUsed] = useState(false);

  useEffect(() => {
    // Check browser history for trial usage
    const hasUsedTrial = localStorage.getItem('saanify_trial_used');
    if (hasUsedTrial) {
      setTrialUsed(true);
    }
  }, []);

  const handlePlanSelect = (planId: string) => {
    if (planId === 'TRIAL' && trialUsed) {
      toast.error("You have already used your Free Trial. Please choose a plan.");
      return;
    }
    
    // Route to appropriate signup page with plan parameter
    const route = `/signup?plan=${planId}`;
    router.push(route);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Select the perfect plan for your cooperative society management needs
          </p>
          
          {/* Trial Used Warning */}
          {trialUsed && (
            <div className="mt-6 bg-orange-100 border border-orange-200 text-orange-800 px-6 py-4 rounded-full inline-flex items-center text-sm font-medium">
              <AlertCircle className="w-5 h-5 mr-3" />
              You've already used the Free Trial. Please choose a paid plan to continue.
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white p-6 rounded-2xl shadow-sm border ${
                plan.id === 'PRO' ? 'border-purple-500 ring-1 ring-purple-500' : 'border-slate-200'
              } relative flex flex-col`}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="font-bold text-xl text-slate-900">{plan.name}</h3>
                <div className="text-3xl font-bold mt-4 mb-2">
                  ₹{plan.price}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </div>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              {/* Features List */}
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-xs flex gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <Button 
                className={`w-full ${
                  plan.id === 'TRIAL' 
                    ? trialUsed 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-slate-900 hover:bg-slate-800'
                    : plan.id === 'PRO'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
                disabled={plan.id === 'TRIAL' && trialUsed}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.id === 'TRIAL' && trialUsed 
                  ? 'Trial Used' 
                  : plan.id === 'TRIAL' 
                  ? 'Start Free Trial' 
                  : 'Choose Plan'
                }
              </Button>

              {/* Trial Restrictions Info */}
              {plan.id === 'TRIAL' && (
                <div className="mt-4 text-xs text-slate-500 text-center">
                  <p>15 days free access</p>
                  <p>Up to 50 members</p>
                  {trialUsed && <p className="text-orange-600 font-medium">Already used</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">Features</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">Trial</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">Basic</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Price</td>
                  <td className="text-center py-4 px-4 font-medium">Free</td>
                  <td className="text-center py-4 px-4 font-medium">₹4,000/mo</td>
                  <td className="text-center py-4 px-4 font-medium">₹7,000/mo</td>
                  <td className="text-center py-4 px-4 font-medium">₹10,000/mo</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Members</td>
                  <td className="text-center py-4 px-4">Up to 50</td>
                  <td className="text-center py-4 px-4">Up to 200</td>
                  <td className="text-center py-4 px-4">Up to 2,000</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Duration</td>
                  <td className="text-center py-4 px-4">15 days</td>
                  <td className="text-center py-4 px-4">Monthly</td>
                  <td className="text-center py-4 px-4">Monthly</td>
                  <td className="text-center py-4 px-4">Monthly</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Basic Member Management</td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Daily Ledger</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">Advanced Analytics</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">API Access</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700">White-label Solution</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">1000+</div>
              <div className="text-sm text-slate-600">Institutions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">50K+</div>
              <div className="text-sm text-slate-600">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">₹500Cr+</div>
              <div className="text-sm text-slate-600">Disbursed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">99.9%</div>
              <div className="text-sm text-slate-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}