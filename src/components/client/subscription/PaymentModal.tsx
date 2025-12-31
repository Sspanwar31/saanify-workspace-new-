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

  // ---------------- ONLINE PAYMENT (UNCHANGED) ----------------
  const handleOnlinePay = async () => {
    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from('subscription_orders')
        .insert([{
          client_id: clientId,
          plan_name: plan.name,
          amount: plan.price,
          payment_method: 'RAZORPAY',
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      setTimeout(async () => {
        await supabase
          .from('subscription_orders')
          .update({
            status: 'success',
            transaction_id: 'PAY_' + Date.now()
          })
          .eq('id', order.id);

        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + plan.durationDays);

        await supabase.from('clients').update({
          plan_name: plan.name,
          plan_start_date: new Date(),
          plan_end_date: newEndDate,
          subscription_status: 'active'
        }).eq('id', clientId);

        toast.success(`Plan upgraded to ${plan.name}`);
        setLoading(false);
        onClose();
        window.location.reload();
      }, 2000);

    } catch (err) {
      toast.error('Payment failed');
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
          bg-white
          rounded-2xl
          shadow-2xl
          overflow-hidden
          max-h-[90vh]
          flex flex-col md:flex-row
        "
      >

        {/* LEFT – PAYMENT METHODS */}
        <div className="w-full md:w-2/3 p-8 overflow-y-auto bg-gray-50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">Choose Payment Method</h2>
              <p className="text-sm text-gray-500">
                Secure and encrypted payments
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* ONLINE */}
          <div
            onClick={() => setMethod('ONLINE')}
            className={`mb-4 p-5 rounded-xl border-2 cursor-pointer transition
              ${method === 'ONLINE'
                ? 'border-blue-600 bg-white shadow'
                : 'border-gray-200 bg-white'
              }`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3 font-semibold">
                <Zap className="text-blue-600" /> Instant Payment
              </div>
              <Badge>Fastest</Badge>
            </div>

            <AnimatePresence>
              {method === 'ONLINE' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <p className="text-sm text-gray-500 mb-4">
                    UPI / Card / NetBanking – Instant activation
                  </p>
                  <Button
                    onClick={handleOnlinePay}
                    disabled={loading}
                    className="w-full h-12 text-lg"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : `Pay ₹${plan.price}`}
                  </Button>

                  <div className="flex justify-center gap-4 mt-3 opacity-60">
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
                ? 'border-orange-500 bg-white shadow'
                : 'border-gray-200 bg-white'
              }`}
          >
            <div className="flex items-center gap-3 font-semibold mb-2">
              <Landmark className="text-orange-600" />
              Bank Transfer / UPI
            </div>

            <AnimatePresence>
              {method === 'MANUAL' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="bg-orange-50 border p-4 rounded mb-4 text-sm">
                    <div className="flex justify-between">
                      <span>UPI ID</span>
                      <span
                        className="font-mono cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy('saanify@hdfc');
                        }}
                      >
                        saanify@hdfc <Copy className="inline w-3 h-3" />
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Account</span>
                      <span className="font-mono">502000348291</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>IFSC</span>
                      <span className="font-mono">HDFC000123</span>
                    </div>
                  </div>

                  <Label>Transaction ID (UTR)</Label>
                  <Input
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="mb-3"
                  />

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualSubmit();
                    }}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Verify Transaction'}
                  </Button>

                  <p className="text-xs text-center text-orange-500 mt-2">
                    Activation within 2–4 hours
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-center text-xs text-gray-400 gap-1">
            <ShieldCheck className="w-4 h-4" /> Secure SSL Payment
          </div>
        </div>

        {/* RIGHT – ORDER SUMMARY (FIXED, NO CUT) */}
        <div className="w-full md:w-1/3 border-l bg-white p-8 flex flex-col justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold mb-6">
              <FileCheck className="text-green-600" /> Order Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{plan.name}</span>
                  <Badge variant="outline">{plan.durationDays} Days</Badge>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>₹{(plan.price / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{(plan.price - plan.price / 1.18).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{plan.price.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            By proceeding you agree to Terms & Privacy Policy
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
