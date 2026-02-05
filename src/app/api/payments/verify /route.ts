import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role Use karein
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // 1. Signature Verify karein
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Payment Intent ko PAID mark karein
    // Note: Hum yaha Client create nahi karenge, wo Signup API karegi
    const { data, error } = await supabase
      .from('payment_intents')
      .update({
        status: 'PAID',
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date()
      })
      .eq('token', razorpay_order_id) // Aapke DB me order_id 'token' column me hai
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      orderId: razorpay_order_id, // Isko frontend par wapis bhejein
      plan: data.plan 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
