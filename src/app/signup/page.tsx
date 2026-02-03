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
  
  // ✅ FIX 1 — Trial ke liye plan hard lock karo
  const urlPlan = searchParams.get('plan');
  const initialPlanId = urlPlan === 'TRIAL' ? 'TRIAL' : urlPlan || 'TRIAL';

  const paymentStatus = searchParams.get('status') || 'ACTIVE'; // This is misleading for Trial, we fix logic below
  const refId = searchParams.get('ref') || ''; 

  // ✅ STEP 1 — URL se payment_mode nikalo
  const paymentMode = searchParams.get('mode'); // AUTO | MANUAL | null

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [loading, setLoading] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);

  useEffect(() => {
    const hasUsedTrial = localStorage.getItem('saanify_trial_used');
    
    // ✅ FIX 2 — localStorage effect ko TRIAL submit pe ignore karo
    if (hasUsedTrial && initialPlanId === 'TRIAL') {
      setTrialUsed(true);
      // ❌ DO NOT auto-switch plan here
    } else if (hasUsedTrial) {
      setTrialUsed(true);
    }
  }, [initialPlanId]);

  useEffect(() => {
    // Rely on DB check, reset local state on mount
    setTrialUsed(false);
  }, []);

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
      // 1. Fetch Trial Settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('trial_days')
        .single();

      const trialDays = settings?.trial_days || 15; 

      // 2. DB Check: Trial Used?
      const { data: existingTrialClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', formData.email)
        .eq('has_used_trial', true)
        .maybeSingle();

      if (existingTrialClient && selectedPlanId === 'TRIAL') {
        toast.error("Free trial already used. Please choose a paid plan.");
        setLoading(false);
        return;
      }

      // 3. Duplicate Check
      const { data: existingClients, error: fetchError } = await supabase
        .from('clients')
        .select('email, phone')
        .or(`email.eq.${formData.email},phone.eq.${formData.phone}`);

      if (fetchError) console.error('Error checking duplicates:', fetchError);

      const isDuplicate = existingClients && existingClients.length > 0;

      if (isDuplicate) {
        if (selectedPlanId === 'TRIAL') {
          toast.error("This email/phone has already used the Free Trial. Please choose a paid plan.");
          setTimeout(() => router.push('/dashboard/subscription'), 2000); 
          setLoading(false);
          return;
        }
      }

      // --- STEP A: CREATE AUTH USER ---
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

      // --- STEP B: PREPARE CLIENT DATA ---
      // 🔥 CRITICAL LOGIC FIX 🔥
      let subscriptionExpiry = null;
      let subStatus = 'inactive';
      let accountStatus = 'PENDING'; // Default

      // ✅ FIX #1 — AUTO detection ko STRONG banao
      const isAutoPaid =
        paymentMode === 'AUTO' ||
        paymentStatus === 'SUCCESS';

      // 🧪 Trial Logic Fix
      const isTrial = selectedPlanId === 'TRIAL' || selectedPlanId === 'FREE_TRIAL';

      if (isTrial) {
        // TRIAL = ACTIVE IMMEDIATELY
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + trialDays);
        subscriptionExpiry = expiryDate.toISOString();
        
        subStatus = 'active'; 
        accountStatus = 'ACTIVE'; // Unlock Account Immediately
      } 
      else {
        // PAID PLAN LOGIC
        if (isAutoPaid) {
          subStatus = 'active';
          accountStatus = 'ACTIVE'; // Unlock if paid
        } else {
          // Manual Payment -> Pending Approval
          subStatus = 'pending';
          accountStatus = 'PENDING';
        }
      }

      // --- STEP C: CREATE CLIENT ---
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          society_name: formData.societyName,

          // 🔥 IMPORTANT — ADMIN & SIGNUP CONSISTENCY
          plan: selectedPlanId === 'TRIAL' ? 'TRIAL' : selectedPlanId,

          plan_name: selectedPlanId === 'TRIAL' ? 'Trial' : currentPlan.name,
          status: accountStatus,
          subscription_status: subStatus, 
          plan_end_date: subscriptionExpiry,
          plan_start_date: new Date().toISOString(),
          has_used_trial: selectedPlanId === 'TRIAL',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'client' 
        });

      if (clientError) throw new Error("Client Profile Creation Failed: " + clientError.message);

      // --- STEP D: INSERT SUBSCRIPTION ORDER (ONLY IF PAID) ---
      if (selectedPlanId !== 'TRIAL' && currentPlan.price > 0) {
          const { error: payError } = await supabase
            .from('subscription_orders')
            .insert([{
                client_id: authData.user.id, 
                plan_name: currentPlan.name, 
                amount: currentPlan.price,
                payment_method: paymentMode === 'AUTO' ? 'AUTO' : 'MANUAL', 
                // ✅ FIX #3 — subscription_orders me status bhi AUTO ke liye active
                status: isAutoPaid ? 'paid' : 'pending', 
                transaction_id: refId || `SIGNUP-${Date.now()}`,
                duration_days: 30,        
                created_at: new Date().toISOString()
            }]);
          
          if (payError) {
              console.error("Subscription Order Error:", payError);
          }
      }

      // --- SUCCESS & REDIRECT ---
      // 🔑 FINAL REDIRECT — DB IS SOURCE OF TRUTH
      const { data: client } = await supabase
        .from('clients')
        .select('plan, status, subscription_status')
        .eq('id', authData.user.id)
        .single();

      // ✅ FIX: Allow TRIAL users to enter immediately
      if (
        client?.status === 'ACTIVE' &&
        (client?.subscription_status === 'active' || client?.plan === 'TRIAL')
      ) {
        toast.success("Account Created! Entering Dashboard...");
        router.replace('/dashboard');
      } else {
        // Agar Manual Payment hai ya Pending hai
        toast.success("Account Created! Pending Admin Approval.");
        router.replace('/login');
      }

    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || "Signup failed. Please try again.");
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
                  {paymentStatus === 'PENDING_APPROVAL' 
                    ? <span className="text-orange-600 font-medium">Payment Verification Pending (Ref: {refId})</span> 
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
                        'Register & Request Approval'
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
