'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-simple'; // Ensure this import exists
import { 
  Zap, Landmark, CheckCircle, UploadCloud, Copy, ShieldCheck, 
  Loader2, AlertCircle, CreditCard, Smartphone, FileCheck, Clock, RefreshCw, XCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
// import { useAdminStore } from '@/lib/admin/store'; // Removed local store
import { SUBSCRIPTION_PLANS } from '@/config/plans';
import { motion, AnimatePresence } from 'framer-motion';

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
  // Try to get user details from URL or LocalStorage if available (For creating client)
  // Assuming these are passed via URL from previous signup step
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
    if (savedPayment) { // ✅ FIXED: Removed extra bracket
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

  // ✅ FINAL handleOnlinePay (UPDATED WITH VERIFICATION)
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

      // 2. Razorpay Popup Open karein
      const razorpay = new (window as any).Razorpay({
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
          }
        },
        
        // Modal close hone par loading band karein
        modal: {
            ondismiss: function() {
                setLoading(false);
            }
        }
      });

      razorpay.open();
    } catch (err: any) {
      console.error("Payment Error: ", err);
      toast.error(err.message || "Payment initiation failed");
      setLoading(false); // Error aane par loading hata dein
    } 
    // Note: 'finally { setLoading(false) }' yaha se hata diya hai
    // kyunki payment popup khula rahta hai to loading true hi rahni chahiye
  };

  // --- REAL BACKEND SUBMISSION LOGIC (FIXED) ---
  const handleManualSubmit = async () => {
    if (!txnId) return toast.error("Please enter Transaction ID");
    if (!proofFile) return toast.error("Please upload payment screenshot");
    
    setLoading(true);

    try {
        let clientId = null;

        // ---------------------------------------------------------
        // 1. CLIENT HANDLING (Frontend Side)
        // ---------------------------------------------------------
        // Agar user login hai ya email hai, to check karein
        if (userEmail) {
            const { data: existing } = await supabase.from('clients').select('id').eq('email', userEmail).single();
            if (existing) clientId = existing.id;
        }

        // Agar Client nahi mila, to naya banayein
        // NOTE: Agar 'clients' table par RLS error aye, to Client Creation bhi API me le jana padega.
        if (!clientId) {
            const { data: newClient, error: createError } = await supabase
                .from('clients')
                .insert([{
                    name: userName || 'New User',
                    email: userEmail || `user-${Date.now()}@temp.com`,
                    phone: userPhone,
                    society_name: societyName || 'New Society',
                    plan_name: plan.name,
                    status: 'pending',
                    has_used_trial: planId === 'TRIAL'
                }])
                .select()
                .single();
            
            if (createError) throw new Error("Client Creation Failed: " + createError.message);
            clientId = newClient.id;
        }

        // ---------------------------------------------------------
        // 2. UPLOAD PROOF (Storage)
        // ---------------------------------------------------------
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${clientId}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('payment_proofs')
            .upload(fileName, proofFile);

        if (uploadError) throw new Error("Upload Failed: " + uploadError.message);

        // Public URL nikalein
        const { data: urlData } = supabase.storage.from('payment_proofs').getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        // ---------------------------------------------------------
        // 3. CALL API (Ye hai Main Fix) - Database Insert via API
        // ---------------------------------------------------------
        // Ab hum direct insert nahi karenge, API ko bolenge insert karne ko
        
        const response = await fetch('/api/admin/approve-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: clientId,
                planName: plan.name,
                amount: plan.price,
                transactionId: txnId,
                screenshotUrl: publicUrl, // Ab hum clean URL bhej rahe hain
                durationDays: plan.duration || 30
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to submit payment order");
        }

        // ---------------------------------------------------------
        // 4. SAVE STATE (Success)
        // ---------------------------------------------------------
        const paymentState = {
            invoiceId: result.orderId, // API se jo ID aayi wo use karein
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

  // --- CHECK STATUS FUNCTION (UPDATED TO CHECK DB) ---
  const checkStatus = async () => {
    if (!pendingPayment) return;
    setLoading(true);

    try {
        const { data: order, error } = await supabase
            .from('subscription_orders')
            .select('status')
            .eq('id', pendingPayment.invoiceId)
            .single();

        if (error || !order) {
            toast.error("Order not found in system.");
            return;
        }

        // ✅ FIXED BLOCK STARTS HERE
        if (order.status === 'approved') {
          localStorage.removeItem('user_pending_payment');
          toast.success("Payment Approved! Complete Signup to Activate.");

          // IMPORTANT:
          // Manual payment ke baad dashboard nahi
          // Signup completion mandatory
          router.push(`/signup?mode=MANUAL&orderId=${pendingPayment.invoiceId}`);
        } 
        // ✅ FIXED BLOCK ENDS HERE
        else if (order.status === 'rejected') {
            localStorage.removeItem('user_pending_payment');
            setPendingPayment(null);
            toast.error("Payment Rejected by Admin. Please try again.");
        } else {
            toast.info("Still Verification Pending. Please wait.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
     if(!confirm("Are you sure you want to cancel this request?")) return;
     
     if (pendingPayment?.invoiceId) {
         setLoading(true);
         await supabase.from('subscription_orders').delete().eq('id', pendingPayment.invoiceId);
         setLoading(false);
     }
     
     localStorage.removeItem('user_pending_payment');
     setPendingPayment(null);
     toast.info("Request Cancelled");
  };

  // --- RENDER 1: PENDING STATE VIEW (If user has submitted) ---
  if (pendingPayment) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-orange-500">
          <CardContent className="p-8 text-center space-y-6">
            
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
               <Clock className="w-10 h-10 text-orange-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">Verification Pending</h2>
              <p className="text-slate-500 mt-2">
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
                {loading ? <Loader2 className="animate-spin mr-2"/> : <><RefreshCw className="mr-2 w-4 h-4"/> Check Status / Refresh</>}
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PAYMENT METHODS */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Choose Payment Method</h1>
            <p className="text-slate-500">Select a secure payment option to activate your plan.</p>
          </div>

          {/* OPTION 1: INSTANT PAYMENT */}
          <div 
            onClick={() => setMethod('ONLINE')}
            className={`cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden ${method === 'ONLINE' ? 'border-blue-600 bg-white shadow-lg ring-4 ring-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="p-6 flex items-start gap-4">
               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${method === 'ONLINE' ? 'border-blue-600' : 'border-slate-300'}`}>
                  {method === 'ONLINE' && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
               </div>
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                     <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600 fill-blue-600"/> Instant Payment
                     </h3>
                     <Badge className="bg-blue-600 hover:bg-blue-700">Recommended</Badge>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">Pay via UPI / Card / NetBanking. Instant Activation.</p>
                  
                  <AnimatePresence>
                    {method === 'ONLINE' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                      >
                         <div className="bg-blue-50/50 rounded-xl p-4 border-blue-100 mb-4">
                            <ul className="space-y-2 text-sm text-blue-800">
                               <li className="flex gap-2"><CheckCircle className="w-4 h-4"/> Instant Account Activation</li>
                               <li className="flex gap-2"><CheckCircle className="w-4 h-4"/> Automatic Invoice Generation</li>
                               <li className="flex gap-2"><CheckCircle className="w-4 h-4"/> No Manual Verification Needed</li>
                            </ul>
                         </div>
                         <Button 
                            onClick={handleOnlinePay} 
                            disabled={loading}
                            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                         >
                            {loading ? <><Loader2 className="mr-2 animate-spin"/> Processing...</> : `Pay ₹${plan.price.toLocaleString()} Securely`}
                         </Button>
                         <div className="flex justify-center gap-6 mt-4 opacity-60">
                             <div className="flex items-center gap-1 text-xs font-bold text-slate-500"><CreditCard className="w-3 h-3"/> VISA</div>
                             <div className="flex items-center gap-1 text-xs font-bold text-slate-500"><CreditCard className="w-3 h-3"/> MasterCard</div>
                             <div className="flex items-center gap-1 text-xs font-bold text-slate-500"><Smartphone className="w-3 h-3"/> UPI</div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          </div>

          {/* OPTION 2: MANUAL PAYMENT */}
          <div 
            onClick={() => setMethod('MANUAL')}
            className={`cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden ${method === 'MANUAL' ? 'border-orange-500 bg-white shadow-lg ring-4 ring-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="p-6 flex items-start gap-4">
               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${method === 'MANUAL' ? 'border-orange-500' : 'border-slate-300'}`}>
                  {method === 'MANUAL' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
               </div>
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                     <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-orange-600"/> Bank Transfer / UPI
                     </h3>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">Manual approval required. Activation in 24 hours.</p>

                  <AnimatePresence>
                    {method === 'MANUAL' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                      >
                         <Separator className="my-4"/>
                         <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {/* Bank Box */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                               <p className="text-xs font-bold text-slate-400 uppercase mb-2">Bank Transfer</p>
                               <p className="font-bold text-slate-800">HDFC Bank</p>
                               <p className="text-sm text-slate-600">A/C: 502000348291</p>
                               <p className="text-sm text-slate-600">IFSC: HDFC000123</p>
                               <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleCopy('502000348291', 'Account Number'); }}>
                                  <Copy className="w-4 h-4 text-blue-600"/>
                               </Button>
                            </div>
                            {/* UPI Box */}
                            <div className="bg-slate-50 p-4 rounded-xl border-slate-200 relative group">
                               <p className="text-xs font-bold text-slate-400 uppercase mb-2">UPI Transfer</p>
                               <p className="font-bold text-slate-800 text-lg">saanify@hdfc</p>
                               <p className="text-xs text-slate-500 mt-1">Scan QR in any app</p>
                               <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleCopy('saanify@hdfc', 'UPI ID'); }}>
                                  <Copy className="w-4 h-4 text-blue-600"/>
                               </Button>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div className="space-y-2">
                               <Label>Transaction ID (UTR)</Label>
                               <Input 
                                  placeholder="e.g. 3298472910" 
                                  value={txnId} 
                                  onChange={(e) => setTxnId(e.target.value)} 
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-slate-50"
                               />
                            </div>
                            
                            {/* --- FIXED UPLOAD SECTION START --- */}
                            <div className="space-y-2">
                               <Label>Upload Screenshot</Label>
                               
                               {/* Hidden Input File Element */}
                               <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={handleFileSelect}
                               />

                               <div 
                                  onClick={triggerFileUpload}
                                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${proofFile ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50 bg-slate-50/50'}`}
                               >
                                  {proofFile ? (
                                    <>
                                       <FileCheck className="w-8 h-8 text-green-600 mb-2"/>
                                       <span className="text-sm font-bold text-green-700">{proofFile.name}</span>
                                       <span className="text-xs text-green-600">Click to change file</span>
                                    </>
                                  ) : (
                                    <>
                                       <UploadCloud className="w-6 h-6 text-slate-400 mb-2"/>
                                       <span className="text-xs text-slate-500">Click to upload payment proof</span>
                                    </>
                                  )}
                               </div>
                            </div>
                            {/* --- FIXED UPLOAD SECTION END --- */}
                            
                            <div className="bg-yellow-50 p-3 rounded-lg flex gap-3 items-start text-sm text-yellow-800 border border-yellow-200">
                               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5"/>
                               <div>
                                  <p className="font-bold">Verification Required</p>
                                  <p className="text-xs mt-1">Your account will be activated after admin approval (approx. 2-4 hours).</p>
                               </div>
                            </div>

                            <Button 
                               onClick={(e) => { e.stopPropagation(); handleManualSubmit(); }}
                               disabled={loading}
                               className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white"
                            >
                               {loading ? <Loader2 className="animate-spin mr-2"/> : 'Submit for Verification'}
                            </Button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="flex flex-wrap gap-6 justify-center text-slate-400 text-sm mt-8">
             <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> 256-bit SSL Encrypted</span>
             <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Trusted by 1000+ Societies</span>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
        <div className="md:col-span-1">
           <div className="sticky top-6">
              <Card className="shadow-xl border-0 ring-1 ring-slate-200 overflow-hidden">
                 <div className="bg-slate-900 p-4 text-white">
                    <h3 className="font-bold text-lg">Order Summary</h3>
                 </div>
                 <CardContent className="p-6 space-y-6">
                    <div>
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Selected Plan</p>
                       <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold text-blue-600">{plan.name}</h2>
                          <Badge variant="outline">{plan.duration} Days</Badge>
                       </div>
                    </div>
                    
                    <div className="space-y-3 py-4 border-t border-b border-slate-100">
                       <div className="flex justify-between text-sm text-slate-600">
                          <span>Plan Price</span>
                          <span>₹{plan.price.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-sm text-slate-600">
                          <span>GST (18%)</span>
                          <span className="text-green-600">Included</span>
                       </div>
                    </div>

                    <div className="flex justify-between items-end">
                       <span className="font-bold text-slate-700">Total Pay</span>
                       <span className="text-3xl font-bold text-slate-900">₹{plan.price.toLocaleString()}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 leading-relaxed text-center">
                       By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span>.
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>

      </div>
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense fallback={<div>Loading Payment Gateway...</div>}><PaymentContent /></Suspense>;
}
