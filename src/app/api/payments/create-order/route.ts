import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

/* -------------------------------------------------------
   CORS Headers (Flutter App Connect ke liye Zaroori)
------------------------------------------------------- */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/* -------------------------------------------------------
   Decode Service Role Key (B64 safe)
------------------------------------------------------- */
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 missing");
  }
  if (rawKey.startsWith('eyJ')) {
    return rawKey;
  }
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
   OPTIONS Method (Preflight request)
------------------------------------------------------- */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/* -------------------------------------------------------
   POST /api/payment/create-order
------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Extract IDs and Amount safely
    const amount = body.amount || body.price;
    const plan = body.planId || body.planName || 'PRO';
    const mode = body.mode;
    
    if (!amount || !plan) {
      return NextResponse.json(
        { error: 'amount or plan missing' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Create Razorpay Order
    console.log("Creating Razorpay Order...");
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // ₹ → paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    console.log("Razorpay Order Created:", order.id);

    // 3. Insert into payment_intents (Replacement applied here)
    console.log("Saving PENDING intent to DB...");

    // ✅ FORCE DATABASE INSERT (await zaroori hai)
    const { data: dbEntry, error: dbErr } = await supabase
      .from('payment_intents')
      .insert([{
        amount: amount,
        plan: plan,
        mode: mode || 'AUTO',
        status: 'pending', 
        token: order.id, 
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }])
      .select() // Realtime ko trigger karne ke liye
      .single();

    if (dbErr) {
      console.error("DB Insert Failed!", dbErr);
      return NextResponse.json({ error: "Database rejected entry" }, { status: 500, headers: corsHeaders });
    }

    // ✅ Return ONLY after DB confirmation
    console.log("DB Insert confirmed. Returning to frontend.");
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // Added razorpayKey for Flutter as per previous requirements
      razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
    }, {
      headers: corsHeaders
    });

  } catch (err: any) {
    console.error("❌ create-order critical error:", err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
