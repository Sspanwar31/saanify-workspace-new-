import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 is missing");
  }
  if (!rawKey.startsWith('eyJ')) {
    return Buffer.from(rawKey, 'base64').toString('utf-8');
  }
  return rawKey;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = body.razorpay_order_id || body.orderCreationId;
    const paymentId = body.razorpay_payment_id || body.razorpayPaymentId;
    const signature = body.razorpay_signature || body.razorpaySignature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // 1️⃣ Signature Verification
    const hmac = crypto.createHmac(
      'sha256',
      process.env.RAZORPAY_KEY_SECRET!
    );
    hmac.update(`${orderId}|${paymentId}`);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 2️⃣ Update Pending Order
    const { data, error } = await supabase
      .from('payment_intents') 
      .update({
        status: 'PAID',
        razorpay_payment_id: paymentId
      })
      .eq('razorpay_order_id', orderId) 
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase update error:', error);
      throw new Error('Payment verification failed');
    }

    // 3️⃣ Activate client subscription
    const planName = data.plan;
    const durationDays = 30;

    const planEndDate =
      planName === 'ENTERPRISE'
        ? new Date('2099-12-31T23:59:59Z')
        : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const { error: clientError } = await supabase
      .from('clients')
      .update({
        plan: planName,
        plan_name:
          planName.charAt(0) + planName.slice(1).toLowerCase(),
        plan_start_date: new Date(),
        plan_end_date: planEndDate,
        subscription_status: 'active',
        has_used_trial: true,
        updated_at: new Date()
      })
      .eq('id', data.client_id);

    if (clientError) {
      console.error('Client update failed:', clientError);
      throw new Error('Client subscription activation failed');
    }

    return NextResponse.json({
      payment_verified: true,
      payment_intent_id: data.id
    });

  } catch (error: any) {
    console.error('FINAL VERIFICATION ERROR:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
