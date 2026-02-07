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
import { supabase } from '@/lib/supabase-simple'; 

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Params
  const orderId = searchParams.get('orderId') || searchParams.get('razorpay_order_id') || '';
  const urlPlanCode = searchParams.get('plan'); 

  // State
  const [selectedPlan, setSelectedPlan] = useState<any>(null); 
  const [loading, setLoading] = useState(false);
  const [fetchingPlan, setFetchingPlan] = useState(true);
  const [trialUsed, setTrialUsed] = useState(false);
  
  // 🔥 Change: Default true rakha hai taaki agar plan na mile to user select kar sake
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    societyName: '',
    email: '',
    phone: '',
    password: ''
  });

  // ✅ STEP 1: Plan Fetch Logic (Robust)
  useEffect(() => {
    async function fetchPlanFromBackend() {
      setFetchingPlan(true);
      
      try {
        let codeToFetch = '';

        // Case A: URL me plan hai
        if (urlPlanCode) {
            codeToFetch = urlPlanCode;
        } 
        // Case B: URL me nahi hai, par Payment ID hai -> LocalStorage check karo
        else if (orderId) {
            // Jahan payment initiate ki thi, wahan localStorage.setItem('last_plan', 'ENTERPRISE') kar dena chahiye
            const savedPlan = localStorage.getItem('last_selected_plan');
            if (savedPlan) {
                codeToFetch = savedPlan;
            } else {
                // Agar yahan bhi nahi mila, to hum niche UI me user se puch lenge
                console.warn("Plan code missing from URL and Storage");
                setFetchingPlan(false);
                setShowPlanSelector(true); // User ko bolenge khud select kare
                return; 
            }
        } 
        // Case C: Free user
        else {
            codeToFetch = 'TRIAL';
        }

        // Fetch from DB
        const { data: planRow, error } = await supabase
          .from('plans')
          .select('*')
          .eq('code', codeToFetch.toUpperCase())
          .single();

        if (error || !planRow) {
           console.error("Plan fetch error:", error);
           // Agar plan DB me nahi mila, to selector dikhao
           setShowPlanSelector(true);
        } else {
            setSelectedPlan(planRow);
        }

      } catch (err) {
        console.error("Setup error:", err);
      } finally {
        setFetchingPlan(false);
      }
    }

    fetchPlanFromBackend();

    const hasUsedTrial = localStorage.getItem('saanify_trial_used');
    if (hasUsedTrial) setTrialUsed(true);

  }, [searchParams, orderId, urlPlanCode]);


  // ✅ Handler: Agar User Manually Plan Select Kare
  const handleManualPlanSelect = async (planCode: string) => {
      setFetchingPlan(true);
      const { data: planRow } = await supabase
          .from('plans')
          .select('*')
          .eq('code', planCode)
          .single();
      
      if (planRow) {
          setSelectedPlan(planRow);
          setShowPlanSelector(false); // Plan mil gaya, selector band karo
      }
      setFetchingPlan(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedPlan) {
      toast.error("Please select a plan to continue.");
      setShowPlanSelector(true);
      setLoading(false);
      return;
    }

    if (!supabase) {
        toast.error("Supabase connection error");
        setLoading(false);
        return;
    }

    try {
      // 1. Trial Check
      if (!orderId && selectedPlan.code === 'TRIAL') {
          const { data: existing } = await supabase.from('clients').select('id').eq('email', formData.email).eq('has_used_trial', true).maybeSingle();
          if (existing) {
            toast.error("Free trial already used.");
            setLoading(false);
            return;
          }
      }

      // 2. Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name, phone: formData.phone, society_name: formData.societyName }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Signup failed.");

      // 3. Insert Client (Data from PLANS table to CLIENTS table)
      const planDays = selectedPlan.duration_days || 30;
      const endDate = new Date();
      endDate.setDate(new Date().getDate() + planDays);

      const { error: clientError } = await supabase.from('clients').insert({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          society_name: formData.societyName,
          
          // 🔥 DB se aaya hua sahi data
          plan_id: selectedPlan.id,
          plan: selectedPlan.code,
          plan_name: selectedPlan.name,

          subscription_status: 'active',
          plan_start_date: new Date().toISOString(),
          plan_end_date: endDate.toISOString(),
          has_used_trial: selectedPlan.code === 'TRIAL',
          registration_number: orderId || null,
          role: 'client'
      });

      if (clientError) throw new Error(clientError.message);

      toast.success("Account Created Successfully!");
      localStorage.setItem('current_user', JSON.stringify({ id: authData.user.id, email: formData.email, role: 'client', plan: selectedPlan.code }));
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- UI RENDER ---

  if (fetchingPlan) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-8 h-8 text-blue-600"/></div>;
  }

  // Fallback Features Display
  const displayFeatures = selectedPlan?.features 
    ? (typeof selectedPlan.features === 'string' ? JSON.parse(selectedPlan.features) : selectedPlan.features)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* LEFT SIDE */}
      <div className="lg:w-1/3 bg-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
        <div>
          <Link href="/" className="flex items-center text-slate-300 hover:text-white mb-8"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Home</Link>
          <h1 className="text-3xl font-bold mb-4">Join Saanify Today</h1>
        </div>

        {/* Selected Plan Card */}
        {selectedPlan ? (
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 my-8">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Confirmed Plan</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{selectedPlan.name}</h3>
                </div>
                <Badge className="bg-green-600">₹{selectedPlan.price}</Badge>
            </div>
            <ul className="space-y-2 mb-6">
                {displayFeatures.slice(0, 3).map((f: any, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300"><CheckCircle className="w-4 h-4 text-green-400"/> {f}</li>
                ))}
            </ul>
            {/* Payment hone ke baad plan change button mat dikhao agar confirm ho gaya */}
            {!orderId && <Button variant="outline" onClick={() => setShowPlanSelector(true)} className="w-full border-slate-600 text-slate-300">Change Plan</Button>}
            </div>
        ) : (
            // Agar plan fetch nahi hua (Payment ID hai par Plan URL missing)
            <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl my-8">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <h3 className="text-lg font-bold text-white">Plan Not Detected</h3>
                <p className="text-sm text-slate-300 mb-4">Payment ID received but plan details missing. Please select the plan you paid for.</p>
                <Button onClick={() => setShowPlanSelector(true)} className="w-full bg-red-600 hover:bg-red-700">Select Paid Plan</Button>
            </div>
        )}

        {/* PLAN SELECTOR (Fallback Mechanism) */}
        {showPlanSelector && (
          <div className="space-y-2 animate-in slide-in-from-left-4 bg-slate-900 p-4 rounded-lg border border-slate-700 absolute inset-0 z-50 overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold">Select Your Plan</h3>
                 <Button size="sm" variant="ghost" onClick={() => setShowPlanSelector(false)}>Close</Button>
             </div>
             {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
                // Agar payment kiya hai, to TRIAL select mat karne do
                if (orderId && key === 'TRIAL') return null;

                return (
                <div key={key} onClick={() => handleManualPlanSelect(key)}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center hover:bg-slate-800 border-slate-700`}
                >
                   <span className="font-medium">{plan.name}</span>
                   <span className="font-bold">₹{plan.price}</span>
                </div>
                );
             })}
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Signup Form */}
      <div className="lg:w-2/3 p-4 flex items-center justify-center">
         <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
            <CardHeader>
               <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
               <CardDescription>
                  {orderId 
                    ? <span className="text-green-600 font-bold">Payment Order ID: {orderId}</span> 
                    : "Enter details to setup your new admin panel."}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2"><Label>Full Name</Label><Input required onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Society Name</Label><Input required onChange={e => setFormData({...formData, societyName: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Email</Label><Input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Phone</Label><Input required onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Password</Label><Input type="password" required onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                  
                  <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading || !selectedPlan}>
                     {loading ? <Loader2 className="animate-spin mr-2" /> : "Complete Registration"}
                  </Button>
               </form>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return <Suspense fallback={<div>Loading...</div>}><SignupForm /></Suspense>;
}
