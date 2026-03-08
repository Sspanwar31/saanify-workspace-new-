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
    
    // ❌ clientId hata diya kyunki database column nahi hai

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

    // 3. Insert into payment_intents
    const insertData = {
      amount: amount,
      plan: plan,
      mode: mode || 'AUTO',
      status: 'pending', 
      token: order.id, // Razorpay Order ID
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    const { error } = await supabase
      .from('payment_intents')
      .insert([insertData]);

    if (error) {
      console.error("❌ Supabase insert failed details:", error);
      return NextResponse.json(
        { error: `DB Insert Failed: ${error.message}`, details: error },
        { status: 500, headers: corsHeaders }
      );
    }

    // 4. Return to frontend
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // ✅ SUCCESS RESPONSE: Added razorpayKey for Flutter
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
