'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-simple'; 

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL se Order ID lo (Razorpay wapis aate waqt ye deta hai)
  const orderId = searchParams.get('orderId') || searchParams.get('razorpay_order_id') || '';
  const urlPlanCode = searchParams.get('plan'); 

  // Mode flag (AUTO | MANUAL)
  const mode = searchParams.get('mode');

  // --- States ---
  const [selectedPlan, setSelectedPlan] = useState<any>(null); 
  const [isPaid, setIsPaid] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    societyName: '',
    email: '',
    phone: '',
    password: ''
  });

  // ✅ UPDATED fetchPlan (Handles both PAID and CONSUMED to stop loop + safe verification)
  const fetchPlan = async (intentData?: any) => {
    try {
      const data = intentData || (await supabase
        .from('payment_intents')
        .select('*')
        .eq('token', orderId)
        .maybeSingle()).data;

      if (!data) return;

      // Plan Details fetch karein
      const { data: planDetails } = await supabase
        .from('plans')
        .select('*')
        .eq('code', data.plan.toUpperCase())
        .single();

      if (planDetails) {
        setSelectedPlan(planDetails);
        
        // ✅ FIX: Agar status PAID ya CONSUMED hai, toh form khul do
        if (data.status === 'PAID' || data.status === 'CONSUMED') {
          setIsPaid(true);
          setIsVerifying(false); 
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  // ✅ REALTIME LISTENER (Aggressive)
  useEffect(() => {
    if (!orderId || mode === 'MANUAL') {
      setIsVerifying(false); 
      return; 
    }

    const channel = supabase
      .channel(`payment-sync-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_intents',
          filter: `token=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new) {
            fetchPlan(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchPlan();
      });

    return () => { supabase.removeChannel(channel); };
  }, [orderId, mode]); 

  // ✅ INITIAL VERIFICATION
  useEffect(() => {
    async function smartVerifyPlan() {
      try {
        // CASE 1: Agar Payment Order ID hai (PAID USER)
        if (orderId) {
            console.log("Verifying Order ID:", orderId);
            console.log("Mode:", mode);

            // 🟠 MANUAL PAYMENT (ADMIN APPROVED)
            if (mode === 'MANUAL') {
              const { data: order, error } = await supabase
                .from('subscription_orders')
                .select('plan_name, status')
                .eq('id', orderId)
                .eq('status', 'approved')
                .single();

              if (error || !order) {
                toast.error("Manual payment not approved yet.");
                setSelectedPlan(null);
                return;
              }

              const verifiedPlanCode = order.plan_name.toUpperCase();
              const { data: planDetails } = await supabase
                .from('plans')
                .select('*')
                .select('*')
                .eq('code', verifiedPlanCode)
                .single();

              if (!planDetails) {
                setSelectedPlan(null);
                return;
              }

              setSelectedPlan(planDetails);
              toast.success(`Plan verified: ${planDetails.name}`);
            }

        } 
        // CASE 2: Free Trial (No Order ID)
        else {
            // URL se plan uthao ya default TRIAL
            const code = urlPlanCode ? urlPlanCode.toUpperCase() : 'TRIAL';
            
            const { data: planDetails } = await supabase
                .from('plans')
                .select('*')
                .select('*')
                .eq('code', code)
                .single();
            
            if (!planDetails) {
              setSelectedPlan(null);
              return;
            }

            setSelectedPlan(planDetails);
        }
      } catch (err) {
        console.error("Verification Error:", err);
        setSelectedPlan(null);
      } 
    }

    smartVerifyPlan();

  }, [orderId, urlPlanCode, mode]); 


  // ✅ HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedPlan) {
      toast.error("Plan not selected.");
      setLoading(false);
      return;
    }

    if (orderId && selectedPlan.code === 'TRIAL') {
        toast.error("System Error: Payment ID linked to Trial plan.");
        setLoading(false);
        return;
    }

    try {
      // Backend safety (must)
      if (selectedPlan.code === 'TRIAL') {
        const { data } = await supabase
          .from('clients')
          .select('id')
          .eq('email', formData.email)
          .limit(1);

        if (data?.length > 0) {
          toast.error("Trial already used");
          setLoading(false);
          return;
        }
      }

      // 1. Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name, phone: formData.phone, society_name: formData.societyName }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Signup failed.");

      // 2. Client Table Insert
      const planDays = selectedPlan.duration_days || 30;
      const endDate = new Date();
      endDate.setDate(new Date().getDate() + planDays);

      const { error: clientError } = await supabase.from('clients').insert({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          society_name: formData.societyName,
          
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

      // 3. Optional: Payment Intent update
      if (orderId) {
          await supabase.from('payment_intents').update({ status: 'CONSUMED' }).eq('token', orderId);
      }

      toast.success("Account Created Successfully!");
      
      // ✅ Login Hai Direct (Auto Login)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw new Error(error.message);
      if (data.user) {
         // Redirect to dashboard using Next.js router
         router.push('/dashboard');
      } else {
         toast.error("Login failed.");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  
  // Loader based on isVerifying
  if (orderId && mode === 'AUTO' && !isPaid) {
    return (
      <div className="min-h-screen flex flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin w-12 h-12 text-blue-600 mb-4"/>
        <h2 className="text-xl font-bold">Verifying Your Payment</h2>
        <p className="text-gray-500">Waiting for confirmation...</p>
      </div>
    );
  }

  // Error Condition
  if (orderId && selectedPlan === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="bg-red-50 p-8 rounded-xl border border-red-200 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
              <h2 className="text-xl font-bold text-red-700">Payment Verification Failed</h2>
              <p className="text-slate-600 mt-2 mb-4">
                 We could not find the plan details for Order ID: <br/> 
                 <span className="font-mono bg-white px-2 py-1 rounded border border-red-100 mt-1 inline-block">{orderId}</span>
              </p>
              <Link href="/"><Button variant="outline">Return Home</Button></Link>
           </div>
        </div>
      </div>
    );
  }

  // Display Vars
  const displayFeatures = selectedPlan?.features 
    ? (typeof selectedPlan.features === 'string' ? JSON.parse(selectedPlan.features) : selectedPlan.features)
    : [];

  // ✅ MAIN FORM (When verified or free trial)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* LEFT SIDE */}
      <div className="lg:w-1/3 bg-slate-900 text-white p-8 lg:p-12 flex flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
        
        <div>
          <Link href="/" className="flex items-center text-slate-300 hover:text-white mb-8"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Home</Link>
          <h1 className="text-3xl font-bold mb-4">Join Saanify Today</h1>
        </div>

        {/* Verified Plan Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 my-8 relative overflow-hidden">
           {/* Verified Badge */}
           {orderId && (
               <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                 <ShieldCheck className="w-3 h-3" /> VERIFIED
               </div>
           )}

           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    {orderId ? "Paid Plan" : "Selected Plan"}
                 </p>
                 <h3 className="text-2xl font-bold text-white mt-1">{selectedPlan?.name}</h3>
              </div>
              <Badge className={selectedPlan?.code === 'ENTERPRISE' ? 'bg-orange-500' : 'bg-blue-600'}>
                ₹{selectedPlan?.price}
              </Badge>
           </div>
           
           <ul className="space-y-2 mb-6">
              {displayFeatures.slice(0, 4).map((f: any, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300"><CheckCircle className="w-4 h-4 text-green-400 shrink-0"/> {f}</li>
              ))}
           </ul>
        </div>

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
                    ? <span className="text-green-600 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Payment Verified for {selectedPlan?.name}</span> 
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
                  
                  <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white mt-2" disabled={loading}>
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
