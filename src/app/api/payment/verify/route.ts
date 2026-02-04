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
    // ✅ FIX: Table Name 'subscription_orders' kar diya hai
    const { data: subData, error: subError } = await supabase
      .from('subscription_orders') 
      .update({
        status: 'paid', // 🔁 DIFF #1: Status rename to 'paid' for consistency
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

    // 🔁 DIFF #2: ❌ CLIENT UPDATE BLOCK REMOVE KARO (MOST IMPORTANT)
    // Ye logic ab Signup page par move ho gaya hai payment verify hone ke baad.

    // 🔁 DIFF #3: Response ko signup-friendly banao
    return NextResponse.json({
      payment_verified: true,
      order_ref: orderId,
    });

  } catch (error: any) {
    console.error('FINAL VERIFICATION ERROR:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
