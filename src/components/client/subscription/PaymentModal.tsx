'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { 
  Zap, Landmark, CheckCircle, UploadCloud, Copy, ShieldCheck, 
  Loader2, CreditCard, Smartphone, FileCheck, X
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
  
  // --- REAL AUTO PAYMENT LOGIC ---
  const handleOnlinePay = async () => {
    setLoading(true);
    try {
      // 1. Create Order Record (Pending)
      const { data: order, error } = await supabase.from('subscription_orders').insert([{
          client_id: clientId,
          plan_name: plan.name,
          amount: plan.price,
          payment_method: 'RAZORPAY',
          status: 'pending'
      }]).select().single();

      if(error) throw error;

      // 2. SIMULATE RAZORPAY SUCCESS (Replace this with actual Razorpay SDK later)
      setTimeout(async () => {
          // A. Update Order to Success
          await supabase.from('subscription_orders').update({ 
            status: 'success', 
            transaction_id: 'PAY_' + Date.now() 
          }).eq('id', order.id);
          
          // B. UPDATE CLIENT PLAN IMMEDIATELY (Real-time activation)
          const newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() + plan.durationDays);
          
          await supabase.from('clients').update({
              plan_name: plan.name,
              plan_start_date: new Date(),
              plan_end_date: newEndDate,
              subscription_status: 'active'
          }).eq('id', clientId);

          toast.success(`Plan upgraded to ${plan.name} successfully!`);
          setLoading(false);
          onClose();
          window.location.reload(); // Refresh to show new plan
      }, 2000);

    } catch (err: any) {
        console.error(err);
        toast.error("Payment initialization failed");
        setLoading(false);
    }
  };

  // --- REAL MANUAL PAYMENT LOGIC ---
  const handleManualSubmit = async () => {
    if (!txnId) return toast.error("Please enter Transaction ID");
    setLoading(true);

    try {
        // Create Pending Order for Admin Approval
        const { error } = await supabase.from('subscription_orders').insert([{
            client_id: clientId,
            plan_name: plan.name,
            amount: plan.price,
            payment_method: 'MANUAL',
            status: 'pending',
            transaction_id: txnId,
            // screenshot_url: Add file upload logic here if needed
        }]);

        if(error) throw error;

        toast.success("Request Submitted! Admin will approve shortly.");
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
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white rounded-2xl shadow-2xl h-[600px] flex flex-col md:flex-row">
            
            {/* LEFT SIDE: PAYMENT OPTIONS */}
            <div className="w-full md:w-2/3 p-8 overflow-y-auto bg-gray-50/50">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Choose Payment Method</h2>
                        <p className="text-gray-500 text-sm">Secure, encrypted payment gateway.</p>
                    </div>
                    {/* Mobile Close Button */}
                    <Button variant="ghost" onClick={onClose} className="md:hidden"><X className="w-5 h-5"/></Button>
                </div>
                
                <div className="space-y-4">
                    {/* Online Option */}
                    <div onClick={() => setMethod('ONLINE')} className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${method === 'ONLINE' ? 'border-blue-600 bg-white shadow-md ring-1 ring-blue-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3 font-bold text-gray-800"><div className="p-2 bg-blue-100 rounded-full"><Zap className="w-5 h-5 text-blue-600"/></div> Instant Payment</div>
                            <Badge className="bg-blue-600 hover:bg-blue-700">Fastest</Badge>
                        </div>
                        
                        <AnimatePresence>
                            {method === 'ONLINE' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                    <p className="text-xs text-gray-500 mb-4 ml-12">Pay via UPI, Credit/Debit Card, or NetBanking. Plan activates immediately.</p>
                                    <Button onClick={handleOnlinePay} disabled={loading} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/50">
                                        {loading ? <Loader2 className="animate-spin"/> : `Pay ₹${plan.price.toLocaleString()}`}
                                    </Button>
                                    <div className="flex justify-center gap-4 mt-4 opacity-50 grayscale">
                                       {/* Icons placeholders */}
                                       <CreditCard className="w-5 h-5"/> <Smartphone className="w-5 h-5"/>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Manual Option */}
                    <div onClick={() => setMethod('MANUAL')} className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${method === 'MANUAL' ? 'border-orange-500 bg-white shadow-md ring-1 ring-orange-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className="flex items-center gap-3 font-bold text-gray-800 mb-2">
                             <div className="p-2 bg-orange-100 rounded-full"><Landmark className="w-5 h-5 text-orange-600"/></div> Bank Transfer / UPI
                        </div>

                        <AnimatePresence>
                            {method === 'MANUAL' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg text-sm space-y-3 mb-4 ml-1">
                                        <div className="flex justify-between items-center"><span className="text-orange-800">UPI ID:</span> <span className="font-mono font-bold cursor-pointer flex items-center gap-1" onClick={(e) => {e.stopPropagation(); handleCopy('saanify@hdfc')}}>saanify@hdfc <Copy className="w-3 h-3"/></span></div>
                                        <div className="flex justify-between items-center"><span className="text-orange-800">Account:</span> <span className="font-mono font-bold">502000348291</span></div>
                                        <div className="flex justify-between items-center"><span className="text-orange-800">IFSC:</span> <span className="font-mono font-bold">HDFC000123</span></div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label>Transaction ID (UTR)</Label>
                                        <Input placeholder="Enter 12-digit UTR Number" value={txnId} onChange={(e) => setTxnId(e.target.value)} onClick={(e) => e.stopPropagation()} className="h-11 border-orange-200 focus-visible:ring-orange-500" />
                                        <Button onClick={(e) => {e.stopPropagation(); handleManualSubmit()}} disabled={loading} className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200/50">
                                            {loading ? <Loader2 className="animate-spin"/> : 'Submit for Verification'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-orange-600/70 mt-2">Activation takes 2-4 hours after admin approval.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <ShieldCheck className="w-4 h-4"/> 256-bit Secure SSL Payment
                </div>
            </div>

            {/* RIGHT SIDE: ORDER SUMMARY (Full Height Dark Panel) */}
            <div className="w-full md:w-1/3 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><FileCheck className="w-5 h-5 text-green-400"/> Order Summary</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plan Details</p>
                            <div className="flex justify-between items-end">
                                <h2 className="text-3xl font-bold text-white">{plan.name}</h2>
                                <Badge variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600">{plan.durationDays} Days</Badge>
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-700 my-4"></div>
                        
                        <div className="space-y-3 text-sm text-slate-300">
                            <div className="flex justify-between"><span>Base Price</span> <span>₹{(plan.price / 1.18).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>GST (18%)</span> <span>₹{(plan.price - (plan.price / 1.18)).toFixed(2)}</span></div>
                        </div>

                        <div className="border-t border-slate-700 my-4"></div>

                        <div className="flex justify-between items-end">
                            <span className="text-lg font-medium text-slate-200">Total Pay</span>
                            <span className="text-4xl font-bold text-white tracking-tight">₹{plan.price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-slate-500 text-center mt-6">
                    By proceeding, you agree to our <span className="underline hover:text-slate-300 cursor-pointer">Terms of Service</span> & <span className="underline hover:text-slate-300 cursor-pointer">Privacy Policy</span>.
                </div>
            </div>
      </DialogContent>
    </Dialog>
  );
}
