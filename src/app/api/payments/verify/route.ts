import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// --- SERVICE ROLE KEY FIX ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY_B64 is missing');
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

// ✅ ONLY POST — NO GET / NO DEFAULT EXPORT
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // 1️⃣ Razorpay Signature Verify
    const hmac = crypto.createHmac(
      'sha256',
      process.env.RAZORPAY_KEY_SECRET!
    );

    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 2️⃣ Mark payment_intents as PAID
    const { data, error } = await supabase
      .from('payment_intents')
      .update({
        status: 'PAID',
        razorpay_payment_id: paymentId
      })
      .eq('token', orderId) // 🔑 razorpay_order_id == token
      .select('id, plan')
      .single();

    if (error || !data) {
      console.error('Payment intent update failed:', error);
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // ✅ FINAL VERIFY RESPONSE (Signup will handle next step)
    return NextResponse.json({
      success: true,
      orderId: orderId,
      plan: data.plan
    });

  } catch (error: any) {
    console.error('VERIFY API ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
