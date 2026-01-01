import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Backend के लिए अलग Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
      amount: amount * 100, // Razorpay paise me leta hai (100 paise = 1 Rupee)
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    // 2. Supabase me 'Pending' Entry Save karna
    const { error } = await supabase.from('subscription_orders').insert([{
      client_id: clientId,
      plan_name: planName,
      amount: amount,
      payment_method: 'RAZORPAY',
      status: 'pending',
      transaction_id: order.id // Razorpay Order ID save karein
    }]);

    if (error) throw error;

    return NextResponse.json({ orderId: order.id });

  } catch (error: any) {
    console.error("Razorpay Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
