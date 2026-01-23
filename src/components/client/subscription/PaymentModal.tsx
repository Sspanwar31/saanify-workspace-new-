'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  Zap, Landmark, Copy, ShieldCheck,
  Loader2, CreditCard, Smartphone, FileCheck, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// --- RAZORPAY SCRIPT LOADER ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: { id: string; name: string; price: number; durationDays: number };
  clientId: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  plan,
  clientId
}: PaymentModalProps) {

  const [method, setMethod] = useState<'ONLINE' | 'MANUAL'>('ONLINE');
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');

  // ---------------- ONLINE PAYMENT (REAL RAZORPAY LOGIC) ----------------
  const handleOnlinePay = async () => {
    setLoading(true);

    // 1. Load Razorpay SDK
    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      toast.error('Razorpay SDK failed to load. Check internet connection.');
      setLoading(false);
      return;
    }

    try {
      // 2. Create Order on Backend
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            amount: plan.price, 
            planName: plan.name, 
            clientId: clientId 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Order creation failed');

      // 3. Initialize Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Key from Vercel Env
        amount: plan.price * 100, // Paise
        currency: 'INR',
        name: 'Saanify V2',
        description: `Upgrade to ${plan.name} Plan`,
        order_id: data.orderId, // Order ID from Backend
        
        // 4. Handle Success
        handler: async function (response: any) {
          toast.loading("Verifying Payment...");

          // Call Backend to Verify Signature & Activate Plan
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderCreationId: data.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              clientId: clientId,
              planDuration: plan.durationDays
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.isPaid) {
            toast.dismiss();
            toast.success("Payment Successful! Plan Activated.");
            onClose();
            window.location.reload(); // Refresh to show new plan
          } else {
            toast.dismiss();
            toast.error("Payment Verification Failed. Contact Support.");
          }
        },
        prefill: {
          name: 'Society Admin', // Optional: You can fetch user details here
          email: 'admin@society.com',
          contact: '',
        },
        theme: {
          color: '#2563eb', // Blue color to match UI
        },
      };

      // 5. Open Popup
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      
      // Stop loading spinner immediately so user can see popup
      setLoading(false);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment initialization failed');
      setLoading(false);
    }
  };

  // ---------------- MANUAL PAYMENT (UNCHANGED) ----------------
  const handleManualSubmit = async () => {
    if (!txnId) return toast.error('Enter Transaction ID');
    setLoading(true);
    try {
      const { error } = await supabase.from('subscription_orders').insert([{
        client_id: clientId,
        plan_name: plan.name,
        amount: plan.price,
        payment_method: 'MANUAL',
        status: 'pending',
        transaction_id: txnId
      }]);
      if (error) throw error;
      toast.success('Request submitted for verification');
      onClose();
      window.location.reload(); // Reload to show pending screen
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          max-w-5xl w-full
          p-0
          bg-white dark:bg-slate-950
          rounded-2xl
          shadow-2xl
          overflow-hidden
          max-h-[90vh]
          flex flex-col md:flex-row
          border-gray-200 dark:border-gray-800
        "
      >

        {/* LEFT – PAYMENT METHODS */}
        <div className="w-full md:w-2/3 p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Choose Payment Method</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Secure and encrypted payments
              </p>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* ONLINE */}
          <div
            onClick={() => setMethod('ONLINE')}
            className={`mb-4 p-5 rounded-xl border-2 cursor-pointer transition
              ${method === 'ONLINE'
                ? 'border-blue-600 bg-white dark:bg-gray-800 shadow'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3 font-semibold text-gray-900 dark:text-gray-200">
                <Zap className="text-blue-600 dark:text-blue-500" /> Instant Payment
              </div>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800">Fastest</Badge>
            </div>

            <AnimatePresence>
              {method === 'ONLINE' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    UPI / Card / NetBanking – Instant activation
                  </p>
                  <Button
                    onClick={handleOnlinePay}
                    disabled={loading}
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-md text-white"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : `Pay ₹${plan.price.toLocaleString()}`}
                  </Button>

                  <div className="flex justify-center gap-4 mt-3 opacity-60 text-gray-500 dark:text-gray-500">
                    <CreditCard /> <Smartphone />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MANUAL */}
          <div
            onClick={() => setMethod('MANUAL')}
            className={`p-5 rounded-xl border-2 cursor-pointer transition
              ${method === 'MANUAL'
                ? 'border-orange-500 bg-white dark:bg-gray-800 shadow'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
          >
            <div className="flex items-center gap-3 font-semibold mb-2 text-gray-900 dark:text-gray-200">
              <Landmark className="text-orange-600 dark:text-orange-500" />
              Bank Transfer / UPI
            </div>

            <AnimatePresence>
              {method === 'MANUAL' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 p-4 rounded mb-4 text-sm text-gray-800 dark:text-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">UPI ID</span>
                      <span
                        className="font-mono cursor-pointer text-orange-700 dark:text-orange-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('saanify@hdfc');
                        }}
                      >
                        saanify@hdfc <Copy className="inline w-3 h-3" />
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Account</span>
                      <span className="font-mono">502000348291</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600 dark:text-gray-400">IFSC</span>
                      <span className="font-mono">HDFC000123</span>
                    </div>
                  </div>

                  <Label className="text-gray-900 dark:text-gray-200">Transaction ID (UTR)</Label>
                  <Input
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="mb-3 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualSubmit();
                    }}
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Verify Transaction'}
                  </Button>

                  <p className="text-xs text-center text-orange-700 dark:text-orange-400 mt-2">
                    Activation within 2–4 hours
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-center text-xs text-gray-500 dark:text-gray-500 gap-1">
            <ShieldCheck className="w-4 h-4" /> Secure SSL Payment
          </div>
        </div>

        {/* RIGHT – ORDER SUMMARY (FIXED, NO CUT) */}
        <div className="w-full md:w-1/3 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 flex flex-col justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold mb-6 text-gray-900 dark:text-gray-100">
              <FileCheck className="text-green-600 dark:text-green-500" /> Order Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-gray-200">{plan.name}</span>
                  <Badge variant="outline" className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600">{plan.durationDays} Days</Badge>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Base Price</span>
                  <span>₹{(plan.price / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>GST (18%)</span>
                  <span>₹{(plan.price - plan.price / 1.18).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>₹{plan.price.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            By proceeding you agree to Terms & Privacy Policy
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
