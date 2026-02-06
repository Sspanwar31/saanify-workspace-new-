'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/config/plans';
import { useAdminStore } from '@/lib/admin/store';
import { supabase } from '@/lib/supabase-simple'; 

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 🔴 CHANGE 1: 'ref' ki jagah 'orderId' use karein
  const orderId = searchParams.get('orderId') || '';
  
  // ✅ FIX: Initial state empty rakho taaki server/client mismatch na ho
  const [selectedPlanId, setSelectedPlanId] = useState<string>(''); 
  const [loading, setLoading] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);

  // ✅ FIX: Mount hone par correct plan set karein (Client side only)
  useEffect(() => {
    const urlPlan = searchParams.get('plan');
    const initialPlanId = orderId ? 'PRO' : (urlPlan || 'TRIAL');
    setSelectedPlanId(initialPlanId);
    
    // Trial Logic Check
    const hasUsedTrial = localStorage.getItem('saanify_trial_used');
    if (hasUsedTrial) {
      setTrialUsed(true);
    }
  }, [searchParams, orderId]); // Dependencies add kiye

  const [formData, setFormData] = useState({
    name: '',
    societyName: '',
    email: '',
    phone: '',
    password: ''
  });

  const currentPlan = SUBSCRIPTION_PLANS[selectedPlanId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.TRIAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!supabase) {
      toast.error("Supabase is not configured. Connection failed.");
      setLoading(false);
      return;
    }

    try {
      // --- STEP A: CHECK PAYMENT (REMOVE COMPLETELY) ---
      
      // 🔹 CHANGE 1: Verified plan ko string nahi, DB se lao
      const planKey = orderId ? 'PRO' : selectedPlanId;

      // 🔑 Fetch plan from DB
      const { data: planRow, error: planError } = await supabase
        .from('plans')
        .select('id, name')
        .ilike('name', planKey === 'TRIAL' ? 'Trial' : planKey)
        .single();

      if (planError || !planRow) {
        toast.error('Invalid subscription plan.');
        setLoading(false);
        return;
      }

      // Trial Check (sirf trial select kiya ho)
      if (!orderId && planKey === 'TRIAL') {
          const { data: existingTrialClient } = await supabase
            .from('clients')
            .select('id')
            .eq('email', formData.email)
            .eq('has_used_trial', true)
            .maybeSingle();

          if (existingTrialClient) {
            toast.error("Free trial already used. Please choose a paid plan.");
            setLoading(false);
            return;
          }
      }

      // --- STEP B: CREATE AUTH USER ---
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            society_name: formData.societyName
          }
        }
      });

      if (authError) throw new Error("User Signup Failed: " + authError.message);
      if (!authData.user) throw new Error("Signup successful but no user ID returned.");

      // --- STEP C: PREPARE CLIENT DATA ---
      // 🔹 CHANGE 2: Duration logic ko plan-based rakho
      let planDurationDays = 15;
      let subStatus = 'active';

      if (planRow.name.toLowerCase().includes('trial')) {
        const { data: settings } = await supabase
          .from('system_settings')
          .select('trial_days')
          .single();

        planDurationDays = settings?.trial_days || 15;
      } else {
        // Paid plans
        planDurationDays = planRow.name.toLowerCase().includes('year')
          ? 365
          : 30;
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + planDurationDays);

      // ✅ Signup insert FINAL & CORRECT
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          society_name: formData.societyName,

          plan: planRow.name,                 // ✅ ONLY THIS
          subscription_status: 'active',
          plan_start_date: startDate.toISOString(),
          plan_end_date: endDate.toISOString(),
          has_used_trial: planRow.name === 'TRIAL',

          role: 'client'
        });

      if (clientError) throw new Error("Client Creation Failed: " + clientError.message);

      // --- SUCCESS ---
      toast.success("Account Created Successfully!");
      
      // LocalStorage Set
      localStorage.setItem('current_user', JSON.stringify({ 
         id: authData.user.id, 
         email: formData.email, 
         role: 'client',
         plan: planRow.name
      }));
      
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* LEFT SIDE */}
      <div className="lg:w-1/3 bg-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
        
        <div>
          <Link href="/" className="flex items-center text-slate-300 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4 mr-2"/> Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-4">Join Saanify Today</h1>
          <p className="text-slate-400">Complete financial management for your cooperative society.</p>
        </div>

        {/* Selected Plan Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 my-8">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Selected Plan</p>
                 <h3 className="text-2xl font-bold text-white mt-1">{currentPlan.name}</h3>
              </div>
              <Badge className={selectedPlanId === 'PRO' ? 'bg-purple-600' : 'bg-blue-600'}>
                ₹{currentPlan.price}/mo
              </Badge>
           </div>
           
           {trialUsed && selectedPlanId === 'TRIAL' && (
             <div className="bg-orange-500/20 border border-orange-500/50 text-orange-300 px-3 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
               <AlertCircle className="w-4 h-4" />
               Trial already used - Please select a paid plan
             </div>
           )}
           
           <ul className="space-y-2 mb-6">
              {currentPlan.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                   <CheckCircle className="w-4 h-4 text-green-400 shrink-0"/> {f}
                </li>
              ))}
           </ul>

           <Button variant="outline" onClick={() => setShowPlanSelector(!showPlanSelector)} className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
              {showPlanSelector ? "Keep Current Plan" : "Change Plan"}
           </Button>
        </div>

        {/* Plan Selector */}
        {showPlanSelector && (
          <div className="space-y-2 animate-in slide-in-from-left-4">
             {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
                const isTrialDisabled = key === 'TRIAL' && trialUsed;
                return (
                <div 
                  key={key} 
                  onClick={() => { 
                    if (!isTrialDisabled) {
                      setSelectedPlanId(key); 
                      setShowPlanSelector(false); 
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                    selectedPlanId === key ? 'bg-blue-600 border-blue-500' : 
                    isTrialDisabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' :
                    'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                   <span className="font-medium">{plan.name}</span>
                   <div className="flex items-center gap-2">
                     {isTrialDisabled && <AlertCircle className="w-4 h-4 text-orange-500" />}
                     <span className="font-bold">₹{plan.price}</span>
                   </div>
                </div>
                );
             })}
          </div>
        )}

        <div className="text-xs text-slate-500 mt-auto pt-8">
           <p className="flex items-center gap-2"><ShieldCheck className="w-3 h-3"/> Bank-grade security & encryption</p>
        </div>
      </div>

      {/* RIGHT SIDE: Signup Form */}
      <div className="lg:w-2/3 p-4 flex items-center justify-center">
         <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
            <CardHeader>
               <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
               <CardDescription>
                  {orderId 
                    ? <span className="text-orange-600 font-medium">Completing Registration for Paid Plan</span> 
                    : "Enter details to setup your new admin panel."}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                     <Label>Full Name</Label>
                     <Input placeholder="John Doe" required onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                     <Label>Society Name</Label>
                     <Input placeholder="Green Valley Co-op" required onChange={e => setFormData({...formData, societyName: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                     <Label>Email</Label>
                     <Input type="email" placeholder="admin@society.com" required onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                     <Label>Phone Number</Label>
                     <Input placeholder="+91 98765 43210" required onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                     <Label>Password</Label>
                     <Input type="password" placeholder="•••••••••" required onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  
                  {/* BUTTON LOGIC */}
                  <Button 
                    type="submit" 
                    className={`w-full h-11 text-base mt-2 ${
                      selectedPlanId === 'TRIAL' && trialUsed
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`} 
                    disabled={loading || (selectedPlanId === 'TRIAL' && trialUsed)}
                  >
                     {loading ? (
                        <div className="flex items-center justify-center">
                           <Loader2 className="w-4 h-4 mr-2 animate-spin"/> Processing...
                        </div>
                     ) : selectedPlanId === 'TRIAL' ? (
                        'Start Free Trial'
                     ) : (
                        'Create Account'
                     )}
                  </Button>
               </form>
               
               <Separator className="my-6" />
               
               <p className="text-center text-sm text-slate-600">
                  Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
               </p>
            </CardContent>
         </Card>
      </div>

    </div>
  );
}

export default function SignupPage() {
  return <Suspense fallback={<div>Loading...</div>}><SignupForm /></Suspense>;
}
