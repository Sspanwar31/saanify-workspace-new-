import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC (Backend Safe Access ke liye) ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Fallback
  if (!rawKey.startsWith('eyJ')) {
    return Buffer.from(rawKey, 'base64').toString('utf-8');
  }
  return rawKey;
};

// Backend Client banana (Service Role Key ke sath)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()! 
);

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { amount, planName, clientId } = await req.json();

    // 1. Razorpay Order Create
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in Paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    // 2. Supabase me 'Pending' Entry Save karna
    // CHANGE: Table name 'subscription_orders' se badal kar 'subscriptions' kiya
    const { error } = await supabase.from('subscriptions').insert([{
      client_id: clientId,
      plan_name: planName,
      amount: amount,
      payment_method: 'RAZORPAY',
      status: 'pending',
      transaction_id: order.id // Razorpay Order ID yahan save hogi
    }]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      throw error;
    }

    return NextResponse.json({ 
        orderId: order.id,
        amount: amount * 100,
        id: order.id // Frontend ke liye ID bhejna zaroori hai
    });

  } catch (error: any) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
