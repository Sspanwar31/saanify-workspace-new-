'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { 
  Zap, Landmark, CheckCircle, UploadCloud, Copy, ShieldCheck, 
  Loader2, AlertCircle, CreditCard, Smartphone, FileCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: { id: string; name: string; price: number; durationDays: number };
  clientId: string;
}

export default function PaymentModal({ isOpen, onClose, plan, clientId }: PaymentModalProps) {
  const [method, setMethod] = useState<'ONLINE' | 'MANUAL'>('ONLINE');
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- RAZORPAY HANDLER ---
  const handleOnlinePay = async () => {
    setLoading(true);
    try {
      // 1. Create Order in Supabase
      const { data: order, error } = await supabase.from('subscription_orders').insert([{
          client_id: clientId,
          plan_name: plan.name,
          amount: plan.price,
          payment_method: 'RAZORPAY',
          status: 'pending'
      }]).select().single();

      if(error) throw error;

      // 2. Simulate Razorpay Popup (Replace with actual Razorpay Code later)
      // Here we assume payment is successful for now
      setTimeout(async () => {
          // Update Order Status
          await supabase.from('subscription_orders').update({ status: 'success', transaction_id: 'PAY_' + Date.now() }).eq('id', order.id);
          
          // Update Client Subscription
          const newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() + plan.durationDays);
          
          await supabase.from('clients').update({
              plan_name: plan.name,
              plan_start_date: new Date(),
              plan_end_date: newEndDate,
              subscription_status: 'active'
          }).eq('id', clientId);

          toast.success("Payment Successful! Plan Activated.");
          setLoading(false);
          onClose();
          window.location.reload();
      }, 2000);

    } catch (err: any) {
        console.error(err);
        toast.error("Payment Failed");
        setLoading(false);
    }
  };

  // --- MANUAL HANDLER ---
  const handleManualSubmit = async () => {
    if (!txnId) return toast.error("Enter Transaction ID");
    setLoading(true);

    try {
        // Create Pending Order
        const { error } = await supabase.from('subscription_orders').insert([{
            client_id: clientId,
            plan_name: plan.name,
            amount: plan.price,
            payment_method: 'MANUAL',
            status: 'pending',
            transaction_id: txnId,
            // screenshot_url: upload logic here if needed
        }]);

        if(error) throw error;

        toast.success("Request Submitted! Waiting for Admin Approval.");
        onClose();
    } catch (err: any) {
        toast.error(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50">
        <div className="grid md:grid-cols-3 h-[600px]">
            
            {/* LEFT: PAYMENT METHODS */}
            <div className="md:col-span-2 p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Choose Payment Method</h2>
                
                {/* Online Option */}
                <div onClick={() => setMethod('ONLINE')} className={`cursor-pointer rounded-xl border-2 p-4 mb-4 ${method === 'ONLINE' ? 'border-blue-600 bg-white ring-2 ring-blue-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 font-bold text-slate-800"><Zap className="w-5 h-5 text-blue-600"/> Instant Payment</div>
                        <Badge className="bg-blue-600">Recommended</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Pay via UPI / Card / NetBanking.</p>
                    
                    <AnimatePresence>
                        {method === 'ONLINE' && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                <Button onClick={handleOnlinePay} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {loading ? <Loader2 className="animate-spin"/> : `Pay ₹${plan.price.toLocaleString()}`}
                                </Button>
                                <div className="flex gap-4 mt-3 justify-center text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3"/> Cards</span>
                                    <span className="flex items-center gap-1"><Smartphone className="w-3 h-3"/> UPI</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Manual Option */}
                <div onClick={() => setMethod('MANUAL')} className={`cursor-pointer rounded-xl border-2 p-4 ${method === 'MANUAL' ? 'border-orange-500 bg-white ring-2 ring-orange-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-2"><Landmark className="w-5 h-5 text-orange-600"/> Bank Transfer / UPI</div>
                    <p className="text-xs text-slate-500 mb-3">Manual approval required (24 hrs).</p>

                    <AnimatePresence>
                        {method === 'MANUAL' && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                <div className="bg-slate-100 p-3 rounded-lg text-sm space-y-2 mb-4">
                                    <div className="flex justify-between"><span>UPI ID:</span> <span className="font-mono font-bold cursor-pointer" onClick={(e) => {e.stopPropagation(); handleCopy('saanify@hdfc')}}>saanify@hdfc <Copy className="w-3 h-3 inline"/></span></div>
                                    <div className="flex justify-between"><span>Account:</span> <span className="font-mono font-bold">502000348291</span></div>
                                    <div className="flex justify-between"><span>IFSC:</span> <span className="font-mono font-bold">HDFC000123</span></div>
                                </div>
                                <div className="space-y-3">
                                    <Input placeholder="Enter Transaction ID (UTR)" value={txnId} onChange={(e) => setTxnId(e.target.value)} onClick={(e) => e.stopPropagation()} />
                                    <Button onClick={(e) => {e.stopPropagation(); handleManualSubmit()}} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                        {loading ? <Loader2 className="animate-spin"/> : 'Submit for Approval'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4"/> SSL Encrypted & Secure
                </div>
            </div>

            {/* RIGHT: SUMMARY */}
            <div className="bg-slate-900 text-white p-6 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-lg mb-6">Order Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-slate-300"><span>Plan</span> <span className="font-bold text-white">{plan.name}</span></div>
                        <div className="flex justify-between text-slate-300"><span>Duration</span> <span className="font-bold text-white">{plan.durationDays} Days</span></div>
                        <div className="flex justify-between text-slate-300"><span>GST (18%)</span> <span className="text-green-400">Included</span></div>
                        <div className="border-t border-slate-700 my-4"></div>
                        <div className="flex justify-between items-end">
                            <span className="text-lg">Total</span>
                            <span className="text-3xl font-bold">₹{plan.price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-slate-500 text-center">
                    By continuing, you agree to our Terms of Service.
                </div>
            </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
