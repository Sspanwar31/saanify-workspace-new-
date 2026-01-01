import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC (AS IS) ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

  if (!rawKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 is missing");
  }

  // Check agar key encoded hai
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

    // 2️⃣ Update SAME pending order
    // CHANGE 1: Table ka naam 'subscriptions' kiya (Aapke database ke hisab se)
    const { data: subData, error: subError } = await supabase
      .from('subscriptions') 
      .update({
        status: 'success',
        transaction_id: paymentId, 
        payment_method: 'RAZORPAY',
      })
      .eq('transaction_id', orderId) 
      .select()
      .single();

    if (subError || !subData) {
      console.error('Supabase update error:', subError);
      throw new Error('Subscription update failed');
    }

    // 3️⃣ Update client plan
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    const { error: clientError } = await supabase
      .from('clients')
      .update({
        plan_name: subData.plan_name,
        plan_start_date: startDate.toISOString(),
        plan_end_date: endDate.toISOString(),
        subscription_status: 'active',
        status: 'ACTIVE',
      })
      .eq('id', subData.client_id);

    if (clientError) {
      throw clientError;
    }

    // CHANGE 2: Response me 'isPaid: true' add kiya
    // Isse aapka frontend "Success" alert dikhayega aur page refresh karega
    return NextResponse.json({ 
        message: 'Success', 
        isPaid: true 
    });

  } catch (error: any) {
    console.error('FINAL VERIFICATION ERROR:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
