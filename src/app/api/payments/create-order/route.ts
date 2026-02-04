import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

/* -------------------------------------------------------
   Decode Service Role Key (B64 safe)
------------------------------------------------------- */
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

  if (!rawKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 missing");
  }

  // If already JWT (starts with eyJ), return as-is
  if (rawKey.startsWith('eyJ')) {
    return rawKey;
  }

  // Otherwise decode base64
  return Buffer.from(rawKey, 'base64').toString('utf-8');
};

/* -------------------------------------------------------
   Supabase (Service Role – backend only)
------------------------------------------------------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()
);

/* -------------------------------------------------------
   Razorpay Instance
------------------------------------------------------- */
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/* -------------------------------------------------------
   POST /api/payments/create-order
------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    /* 1️⃣ Parse request body */
    const body = await req.json();
    
    // Extract IDs and Amount safely
    const amount = body.amount || body.price;
    const plan = body.planId || body.planName || 'PRO'; // Use alias for plan
    const mode = body.mode;

    if (!amount || !plan) {
      return NextResponse.json(
        { error: 'amount or plan missing' },
        { status: 400 }
      );
    }

    /* 2️⃣ Create Razorpay Order */
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // ₹ → paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    /* 3️⃣ Insert into payment_intents */
    const { error } = await supabase
      .from('payment_intents')
      .insert([
        {
          amount: amount,
          plan: plan,                    // ✅ column exists
          mode: mode || 'AUTO',        // ✅ column exists
          status: 'PENDING',
          token: order.id,             // razorpay_order_id
          expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 mins expiry
        },
      ]);

    if (error) {
      console.error("Supabase insert failed:", error);
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      );
    }

    /* 4️⃣ Return to frontend */
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (err: any) {
    console.error("❌ create-order error:", err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
