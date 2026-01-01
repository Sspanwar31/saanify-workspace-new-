import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { orderCreationId, razorpayPaymentId, razorpaySignature, clientId, planDuration } = await req.json();

    // 1. Signature Verification (Security Check)
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return NextResponse.json({ error: 'Transaction not legit!' }, { status: 400 });
    }

    // 2. Agar signature match ho gaya, to Supabase update karein
    
    // A. Order Status Success karein
    await supabase.from('subscription_orders')
      .update({ status: 'success', transaction_id: razorpayPaymentId })
      .eq('transaction_id', orderCreationId);

    // B. Client ka Plan Activate karein
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + Number(planDuration)); // Add 30 days (or plan duration)

    const { error } = await supabase.from('clients').update({
        plan_start_date: new Date(),
        plan_end_date: newEndDate,
        subscription_status: 'active'
    }).eq('id', clientId);

    if (error) throw error;

    return NextResponse.json({ message: 'Success', isPaid: true });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
