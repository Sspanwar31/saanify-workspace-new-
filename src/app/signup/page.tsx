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
// Note: Config file sirf UI features dikhane ke liye rakhein, logic ke liye nahi
import { SUBSCRIPTION_PLANS } from '@/config/plans'; 
import { supabase } from '@/lib/supabase-simple'; 

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Params
  const orderId = searchParams.get('orderId') || searchParams.get('razorpay_order_id') || '';
  const urlPlanCode = searchParams.get('plan'); 

  // ✅ STATE
  // Default NULL rakhein taaki hume pata chale abhi fetch ho raha hai
  const [selectedPlan, setSelectedPlan] = useState<any>(null); 
  const [loading, setLoading] = useState(false);
  const [fetchingPlan, setFetchingPlan] = useState(true); // New Loading State for Plan
  const [trialUsed, setTrialUsed] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  // ✅ FORM DATA
  const [formData, setFormData] = useState({
    name: '',
    societyName: '',
    email: '',
    phone: '',
    password: ''
  });

  // ✅ STEP 1: BACKEND SE PLAN VALIDATE KARNA (Most Important)
  useEffect(() => {
    async function fetchPlanFromBackend() {
      setFetchingPlan(true);
      
      try {
        // 1. Agar Order ID hai par Plan URL me nahi hai, toh yeh critical error hai
        if (orderId && !urlPlanCode) {
            toast.error("Payment detected but plan info missing. Please contact support.");
            // Hum yaha ruk jayenge, Trial set nahi karenge
            setFetchingPlan(false);
            return;
        }

        // 2. Code determine karein (URL se ya default Trial)
        let codeToFetch = urlPlanCode ? urlPlanCode.toUpperCase() : 'TRIAL';
        
        // 3. SEEDHA DATABASE QUERY (Backend se plan uthao)
        const { data: planRow, error } = await supabase
          .from('plans')
          .select('*') // Saara data lelo (id, name, price, duration_days, code)
          .eq('code', codeToFetch)
          .single();

        if (error || !planRow) {
           console.error("Plan fetch error:", error);
           toast.error("Invalid Plan selected.");
           // Agar paid flow tha, toh error dikhao, Trial mat do
           if (orderId) {
             setFetchingPlan(false);
             return; 
           }
           // Agar free flow tha aur error aaya, tabhi Trial fallback socho (optional)
        }

        // 4. Plan Set karo
        if (planRow) {
            setSelectedPlan(planRow);
            
            // UI features ke liye config se mapping (Optional, sirf display ke liye)
            // Lekin logic ab 'planRow' se chalega
        }

      } catch (err) {
        console.error("Setup error:", err);
      } finally {
        setFetchingPlan(false);
      }
    }

    fetchPlanFromBackend();

    // Trial used check (Local Storage)
    const hasUsedTrial = localStorage.getItem('saanify_trial_used');
    if (hasUsedTrial) {
      setTrialUsed(true);
    }

  }, [searchParams, orderId, urlPlanCode]);


  // ✅ SUBMIT HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!supabase) {
      toast.error("Database connection failed.");
      setLoading(false);
      return;
    }

    // 🛑 CRITICAL CHECK: Plan loaded hona chahiye
    if (!selectedPlan) {
      toast.error("Please wait, loading plan details...");
      setLoading(false);
      return;
    }

    // 🛑 SECURITY: Agar payment wali ID hai, lekin selected plan Trial hai (Mismatch)
    if (orderId && selectedPlan.code === 'TRIAL') {
       toast.error("Payment ID found but Plan is Trial. Something is wrong.");
       setLoading(false);
       return;
    }

    // 🛑 SECURITY: Agar Paid plan hai lekin Order ID nahi hai
    if (selectedPlan.code !== 'TRIAL' && !orderId) {
       toast.error(`Payment required for ${selectedPlan.name}.`);
       setLoading(false);
       return;
    }

    try {
      // 1. Check Previous Trial Usage (Server Side Check)
      if (!orderId && selectedPlan.code === 'TRIAL') {
          const { data: existingTrialClient } = await supabase
            .from('clients')
            .select('id')
            .eq('email', formData.email)
            .eq('has_used_trial', true)
            .maybeSingle();

          if (existingTrialClient) {
            toast.error("This email has already used the Free Trial.");
            setLoading(false);
            return;
          }
      }

      // 2. Create User (Auth)
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

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Signup failed.");

      // 3. Prepare Dates (Backend Data se calculation)
      // Hum 'plans' table ka 'duration_days' use kar rahe hain
      const planDays = selectedPlan.duration_days || 30; 
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + planDays);

      // 4. Insert Client Data (Using Database IDs)
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          society_name: formData.societyName,

          // 🔥 Yaha Galti Nahi Hogi: Backend se aaye plan ID use kar rahe hain
          plan_id: selectedPlan.id,       // e.g. 4f5b44a5...
          plan: selectedPlan.code,        // e.g. ENTERPRISE
          plan_name: selectedPlan.name,   // e.g. Enterprise

          subscription_status: 'active',
          plan_start_date: startDate.toISOString(),
          plan_end_date: endDate.toISOString(),
          has_used_trial: selectedPlan.code === 'TRIAL',
          
          // Payment Reference save karein
          registration_number: orderId || null, 
          role: 'client'
        });

      if (clientError) throw new Error(clientError.message);

      toast.success("Account Created Successfully!");
      
      // Local Storage Update
      localStorage.setItem('current_user', JSON.stringify({ 
         id: authData.user.id, 
         email: formData.email, 
         role: 'client',
         plan: selectedPlan.code
      }));

      // Redirect
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING HELPERS ---
  
  // Agar Plan Fetch ho raha hai, Loading dikhao
  if (fetchingPlan) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Verifying Plan Details...</p>
           </div>
        </div>
      );
  }

  // Agar Plan fetch fail ho gaya aur Paid user hai
  if (!selectedPlan && orderId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center border-l-4 border-red-500">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Plan Verification Failed</h2>
              <p className="text-slate-600 mb-6">
                 We found a payment ID but couldn't identify the plan. Please contact support with Order ID: 
                 <br/><span className="font-mono bg-slate-100 px-2 py-1 rounded mt-2 inline-block">{orderId}</span>
              </p>
              <Link href="/">
                 <Button variant="outline">Back to Home</Button>
              </Link>
           </div>
        </div>
      );
  }

  // Display Variables (Features dikhane ke liye config use kar sakte hai fallback me)
  const displayFeatures = selectedPlan?.features 
        ? (typeof selectedPlan.features === 'string' ? JSON.parse(selectedPlan.features) : selectedPlan.features)
        : ["Access to Dashboard", "Manage Society", "Reports"];
  
  const displayPrice = selectedPlan?.price || 0;

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
        </div>

        {/* Selected Plan Card (Database Data) */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 my-8">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Selected Plan</p>
                 <h3 className="text-2xl font-bold text-white mt-1">{selectedPlan?.name || 'Loading...'}</h3>
              </div>
              <Badge className={selectedPlan?.code === 'PRO' ? 'bg-purple-600' : selectedPlan?.code === 'ENTERPRISE' ? 'bg-orange-500' : 'bg-blue-600'}>
                ₹{displayPrice}/mo
              </Badge>
           </div>
           
           {trialUsed && selectedPlan?.code === 'TRIAL' && (
             <div className="bg-orange-500/20 border border-orange-500/50 text-orange-300 px-3 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
               <AlertCircle className="w-4 h-4" />
               Trial already used.
             </div>
           )}
           
           <ul className="space-y-2 mb-6">
              {displayFeatures.slice(0, 4).map((f: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                   <CheckCircle className="w-4 h-4 text-green-400 shrink-0"/> {f}
                </li>
              ))}
           </ul>

           {/* Agar Order ID nahi hai tabhi plan change karne do */}
           {!orderId && (
               <Button variant="outline" onClick={() => setShowPlanSelector(!showPlanSelector)} className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                  {showPlanSelector ? "Keep Current Plan" : "Change Plan"}
               </Button>
           )}
        </div>

        {/* Plan Selector (Sirf agar paise nahi diye) */}
        {showPlanSelector && !orderId && (
          <div className="space-y-2 animate-in slide-in-from-left-4">
             {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
                const isTrialDisabled = key === 'TRIAL' && trialUsed;
                return (
                <div 
                  key={key} 
                  onClick={() => { 
                    if (!isTrialDisabled) {
                        // Reload page with correct plan param to trigger fetch
                        router.push(`/signup?plan=${key}`);
                        setShowPlanSelector(false); 
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                    selectedPlan?.code === key ? 'bg-blue-600 border-blue-500' : 
                    isTrialDisabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' :
                    'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                   <span className="font-medium">{plan.name}</span>
                   <div className="flex items-center gap-2">
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
                    ? <span className="text-green-600 font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Payment Verified: {selectedPlan?.name}</span> 
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
                  
                  <Button 
                    type="submit" 
                    className={`w-full h-11 text-base mt-2 ${
                      selectedPlan?.code === 'TRIAL' && trialUsed
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`} 
                    disabled={loading || (selectedPlan?.code === 'TRIAL' && trialUsed)}
                  >
                     {loading ? (
                        <div className="flex items-center justify-center">
                           <Loader2 className="w-4 h-4 mr-2 animate-spin"/> Creating {selectedPlan?.name} Account...
                        </div>
                     ) : (
                        `Confirm & Signup`
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
