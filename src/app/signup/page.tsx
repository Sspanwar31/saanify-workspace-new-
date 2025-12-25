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

// IMPORT CONFIG & STORE
import { SUBSCRIPTION_PLANS } from '@/config/plans';
import { useAdminStore } from '@/lib/admin/store';
import { supabase } from '@/lib/supabase'; 

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialPlanId = searchParams.get('plan') || 'TRIAL';
  const paymentStatus = searchParams.get('status') || 'ACTIVE';
  const refId = searchParams.get('ref') || '';
  
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [loading, setLoading] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);

  // Check if trial was already used
  useEffect(() => {
    const hasUsedTrial = localStorage.getItem('saanify_trial_used');
    if (hasUsedTrial && initialPlanId === 'TRIAL') {
      // If trial was used and user is trying to signup for trial, switch to BASIC
      setSelectedPlanId('BASIC');
      setTrialUsed(true);
      toast.info("Free Trial already used. Selected Basic plan instead.");
    } else if (hasUsedTrial) {
      setTrialUsed(true);
    }
  }, [initialPlanId]);
  
  const [formData, setFormData] = useState({
    name: '',
    societyName: '',
    email: '',
    phone: '',
    password: ''
  });

  // Safe Plan Access
  const currentPlan = SUBSCRIPTION_PLANS[selectedPlanId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.TRIAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. DUPLICATE CHECK (The Security Gate)
    if (!supabase) {
      toast.error("Supabase is not configured. Please check environment variables.");
      setLoading(false);
      return;
    }

    try {
      // 0. FETCH SYSTEM SETTINGS FOR TRIAL DAYS
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('trial_days')
        .eq('id', 1)
        .single();

      const trialDays = settings?.trial_days || 15; // Default to 15 days if not set

      const { data: existingClients, error: fetchError } = await supabase
        .from('clients')
        .select('email, phone')
        .or(`email.eq.${formData.email},phone.eq.${formData.phone}`);

      if (fetchError) {
        console.error('Error checking duplicates:', fetchError);
        toast.error("Database error. Please try again.");
        setLoading(false);
        return;
      }

      // Check if Email or Phone already exists in the system
      const isDuplicate = existingClients && existingClients.length > 0;

      if (isDuplicate) {
        // If user exists AND tries to take TRIAL again -> BLOCK
        if (selectedPlanId === 'TRIAL') {
          toast.error("This email/phone has already used the Free Trial. Please choose a paid plan.");
          // Redirect to pricing to force upgrade
          setTimeout(() => router.push('/pricing'), 2000);
          setLoading(false);
          return;
        }
        // If existing user buys PAID plan -> Allow (This would be a "Renewal" in real logic, but for signup flow we block to prevent duplicate accounts)
        toast.error("Account already exists. Please Login to renew/upgrade.");
        setLoading(false);
        return;
      }

      // 2. CALCULATE SUBSCRIPTION EXPIRY FOR TRIAL
      let subscriptionExpiry = null;
      if (selectedPlanId === 'TRIAL') {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + trialDays);
        subscriptionExpiry = expiryDate.toISOString();
      }

      // 3. IF SAFE -> PROCEED WITH SUPABASE INSERT
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          society_name: formData.societyName,
          password: formData.password, // Store as plain text for now
          plan: selectedPlanId === 'TRIAL' ? 'TRIAL' : selectedPlanId,
          status: paymentStatus === 'PENDING_APPROVAL' ? 'LOCKED' : 'ACTIVE',
          subscription_expiry: subscriptionExpiry,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        toast.error(`Signup failed: ${error.message}`);
        setLoading(false);
        return;
      }

      // 4. SET LOCAL FLAG (To block future button clicks)
      if (selectedPlanId === 'TRIAL') {
        localStorage.setItem('saanify_trial_used', 'true');
      }

      // 5. SUCCESS
      toast.success(paymentStatus === 'PENDING_APPROVAL' ? "Request Submitted!" : "Account Created Successfully!");
      router.push('/login');

    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error("Signup failed. Please try again.");
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
           
           {/* Trial Used Warning */}
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
                    : "Enter details to setup your admin panel."}
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
                     <Input type="password" placeholder="••••••••" required onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  
                  {/* FIXED BUTTON SYNTAX */}
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
                           <Loader2 className="w-4 h-4 mr-2 animate-spin"/> Creating Account...
                        </div>
                     ) : selectedPlanId === 'TRIAL' && trialUsed ? (
                        'Trial Already Used - Choose Paid Plan'
                     ) : (
                        'Complete Registration'
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