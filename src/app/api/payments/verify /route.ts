import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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
    const clientId = body.client_id;

    // Debugging ke liye log lagayein
    console.log("Verify Request:", { orderId, paymentId, clientId });

    if (!clientId) {
      return NextResponse.json({ error: 'client_id missing' }, { status: 400 });
    }

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // 1️⃣ Signature Verification
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${orderId}|${paymentId}`);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2️⃣ Update Pending Order (FIXED HERE)
    // Aapke table me order_id 'token' column me hai, 'razorpay_order_id' me nahi
    const { data, error } = await supabase
      .from('payment_intents') 
      .update({
        status: 'PAID',
        razorpay_payment_id: paymentId,
        updated_at: new Date() // Best practice: update time bhi set karein
      })
      .eq('token', orderId) // 🔴 CHANGE: 'razorpay_order_id' ki jagah 'token' use karein
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase payment_intents update error:', error);
      return NextResponse.json({ error: 'Payment intent not found or update failed' }, { status: 400 });
    }

    console.log("Payment Intent Updated:", data);

    // 3️⃣ Activate client subscription
    const planName = data.plan; // Example: 'PRO'
    
    // Plan duration set karein
    let planEndDate = new Date();
    if (planName === 'ENTERPRISE') {
        planEndDate = new Date('2099-12-31T23:59:59Z');
    } else {
        // PRO ya Monthly plan ke liye 30 din add karein
        const durationDays = 30;
        planEndDate.setDate(planEndDate.getDate() + durationDays);
    }

    // Client Table Update
    const { error: clientError } = await supabase
      .from('clients')
      .update({
        plan: planName, // 'PRO'
        plan_name: planName.charAt(0) + planName.slice(1).toLowerCase(), // 'Pro'
        plan_start_date: new Date(),
        plan_end_date: planEndDate,
        subscription_status: 'active',
        has_used_trial: true, // Trial khatam
        updated_at: new Date()
      })
      .eq('id', clientId);

    if (clientError) {
      console.error('Client update failed:', clientError);
      throw new Error('Client subscription activation failed');
    }

    return NextResponse.json({
      payment_verified: true,
      payment_intent_id: data.id,
      message: "Subscription activated successfully"
    });

  } catch (error: any) {
    console.error('FINAL VERIFICATION ERROR:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
