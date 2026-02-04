import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
  if (!rawKey.startsWith('eyJ')) {
    return Buffer.from(rawKey, 'base64').toString('utf-8');
  }
  return rawKey;
};

// Backend Client
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
    // 🔁 DIFF #2: clientId nahi lena (Client signup se pehle order create hota hai)
    const { amount, planName } = await req.json();

    // 1. Razorpay Order Create
    const order = await razorpay.orders.create({
      amount: amount * 100, 
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    // 2. Supabase Insert (Payment Intent/Order Store)
    // 🔁 DIFF #1: NO client_id, only plan + amount + order_id
    const { error } = await supabase.from('subscription_orders').insert([{
      plan_name: planName,
      amount: amount,
      payment_method: 'AUTO', // Hardcoded as per new flow
      status: 'pending',
      transaction_id: order.id,
      mode: 'AUTO' 
    }]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      throw error;
    }

    return NextResponse.json({ 
        orderId: order.id,
        amount: amount * 100,
        id: order.id 
    });

  } catch (error: any) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
