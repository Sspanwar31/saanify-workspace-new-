'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-simple'; // Ensure this import is correct
import { 
  Zap, Landmark, CheckCircle, UploadCloud, Copy, ShieldCheck, 
  Loader2, AlertCircle, CreditCard, Smartphone, FileCheck, Clock, RefreshCw, XCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/config/plans';
import { motion, AnimatePresence } from 'framer-motion';
import { createRazorpayInstance, RazorpayOptions } from '@/lib/razorpay-config'; // New import for the utility

// --- TYPE DEFINITIONS ---
interface PendingPaymentState {
  invoiceId: string;
  planId: string;
  txnId: string;
  timestamp: number;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'PRO';  
  const userName = searchParams.get('name') || '';
  const userEmail = searchParams.get('email') || '';
  const userPhone = searchParams.get('phone') || '';
  const societyName = searchParams.get('society') || '';

  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.PRO;
  const [method, setMethod] = useState<'ONLINE' | 'MANUAL'>('ONLINE');
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');  
  // File Upload State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE STATE ---
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentState | null>(null);

  // 1. ON LOAD: Check if user has a pending payment in LocalStorage
  useEffect(() => {
    const savedPayment = localStorage.getItem('user_pending_payment');
    if (savedPayment) {
      setPendingPayment(JSON.parse(savedPayment));
    }
  }, []);

  // --- ACTIONS ---
  
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} Copied to clipboard`);
  };

  // --- FILE SELECTION HANDLER ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setProofFile(file);
      toast.success("Payment Proof Attached!");
    }
  };

  // --- TRIGGER FILE INPUT ---
  const triggerFileUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // ✅ FINAL handleOnlinePay (FIXED WITH SAFETY CONFIG)
  const handleOnlinePay = async () => {
    setLoading(true);
    try {
      console.log('🚀 calling create-order API');
      
      // 1. Order Create karein
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId,          
          amount: plan.price,
          mode: 'AUTO'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");

      // 2. Razorpay Popup Open karein (With Security Fixes)
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.amount,
        currency: 'INR',
        order_id: data.orderId,
        
        // 🟢 HERE IS THE MAIN CHANGE (Handler update)
        handler: async (response: any) => {
          try {
            toast.loading("Verifying Payment...");

            // Step A: Payment Verify API ko call karein
            const verifyReq = await fetch('/api/payments/verify', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 razorpay_payment_id: response.razorpay_payment_id,
                 razorpay_order_id: response.razorpay_order_id,
                 razorpay_signature: response.razorpay_signature
               })
            });

            const verifyData = await verifyReq.json();

            if (verifyReq.ok && verifyData.success) {
                toast.success("Payment Verified! Redirecting...");
                
                // Step B: Signup Page par redirect karein (Order ID ke saath)
                // Hum 'response.razorpay_order_id' bhej rahe hain taaki signup API isse DB me check kar sake
                router.push(`/signup?mode=AUTO&orderId=${response.razorpay_order_id}`);
            } else {
                toast.error("Payment Verification Failed. Please contact support.");
                console.error("Verification failed:", verifyData);
            }

          } catch (verifyError) {
             console.error("Verification API Error:", verifyError);
             toast.error("Payment verification failed due to network error.");
          } finally {
             // Loading band karna yahan nahi karna chahiye jab success fail ho jaye
          }
        },
        
        // 🟢 MODAL: Popup close hone par loading band karein
        modal: {
            ondismiss: function() {
                setLoading(false);
            }
        }
      };

      // Instance create karein (Utility function se)
      const rzp1 = createRazorpayInstance(options);
      rzp1.open();

    } catch (err: any) {
      console.error("Payment Error: ", err);
      toast.error(err.message || "Payment initiation failed");
      setLoading(false); // Error aane par loading hata dein
    } 
    // Note: 'finally { setLoading(false) }' yaha se hata diya hai
    // kyunki payment popup khula rahta hai to loading true hi rahni chahiye
  };

  // --- REAL BACKEND SUBMISSION LOGIC ---
  const handleManualSubmit = async () => {
    if (!txnId) return toast.error("Please enter Transaction ID");
    if (!proofFile) return toast.error("Please upload payment screenshot");
    
    // Check if we have minimal user details (Need email at least)
    // If user came directly here without previous step, we might need to ask inputs
    // But assuming flow is Signup -> Payment, details should be in URL or Context
    if(!userEmail && !pendingPayment) {
       // Fallback: Prompt user if email missing (Logic dependent on your flow)
       // For now, proceeding assuming email is present or we use a placeholder to debug
       console.warn("User email missing from params");
    }

    setLoading(true);

    try {
        let clientId = null;

        // A. CREATE OR FIND CLIENT (Crucial Step)
        // If we have an email, check if client exists
        if (userEmail) {
            const { data: existing } = await supabase.from('clients').select('id').eq('email', userEmail).single();
            if (existing) clientId = existing.id;
        }

        // If no client found, Create New Client
        if (!clientId) {
            const { data: newClient, error: createError } = await supabase
                .from('clients')
                .insert([{
                    name: userName || 'New User',
                    email: userEmail || `user-${Date.now()}@temp.com`, // Fallback
                    phone: userPhone,
                    society_name: societyName || 'New Society',
                    plan_name: plan.name,
                    status: 'pending',
                    has_used_trial: planId === 'TRIAL' // Logic for one-time trial
                }])
                .select()
                .single();
            
            if (createError) throw new Error("Client Creation Failed: " + createError.message);
            clientId = newClient.id;
        }

        // B. UPLOAD PROOF
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${clientId}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('payment_proofs')
            .upload(fileName, proofFile);

        if (uploadError) throw new Error("Upload Failed: " + uploadError.message);

        const { data: publicUrl } = supabase.storage.from('payment_proofs').getPublicUrl(fileName);

        // C. INSERT ORDER
        const { data: orderData, error: orderError } = await supabase
            .from('subscription_orders')
            .insert([{
                client_id: clientId,
                plan_name: plan.name,
                amount: plan.price,
                status: 'pending',
                payment_method: 'manual',
                transaction_id: txnId,
                screenshot_url: publicUrl,
                duration_days: plan.duration || 30
            }])
            .select()
            .single();

        if (orderError) throw new Error("Order Failed: " + orderError.message);

        // D. SAVE STATE (Success)
        const paymentState = {
            invoiceId: orderData.id,
            planId: planId,
            txnId: txnId,
            timestamp: Date.now()
        };
        
        localStorage.setItem('user_pending_payment', JSON.stringify(paymentState));
        setPendingPayment(paymentState);
        toast.success("Request Sent to Admin Successfully!");

    } catch (err: any) {
        console.error("Payment Error:", err);
        toast.error(err.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
      <Card className="w-full max-w-6xl shadow-2xl border-t-4 border-t-orange-500">
        <CardContent className="p-8 text-center space-y-6">
          
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
             <Clock className="w-10 h-10 text-orange-600" />
          </div>

          <div>
             <h2 className="text-2xl font-bold text-slate-800">Verification Pending</h2>
             <p className="text-slate-500">
               We have received your payment details. Admin approval usually takes 2-4 hours.
             </p>
          </div>

          <div className="bg-slate-100 rounded-lg p-4 text-left space-y-2 text-sm">
             <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-700 truncate w-32">{pendingPayment.invoiceId.substring(0, 8)}...</span>
             </div>
             <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-700">{pendingPayment.txnId}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending Review</Badge>
             </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={checkStatus} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
              disabled={loading}
            >
              {loading ? <><Loader2 className="animate-spin mr-2 h-4 w-4"/> Refreshing...</> : <><RefreshCw className="mr-2 h-4 w-4"/> Check Status / Refresh</>}
            </Button>
            
            <Button 
              onClick={handleCancelRequest} 
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Cancel Request & Retry
            </Button>
          </div>

          <p className="text-xs text-slate-400">
             Note: Do not close this tab. However, if you do, your request will remain pending when you return.
          </p>

        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense fallback={<div>Loading Payment Gateway...</div>}><PaymentContent /></Suspense>;
}
