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
    const email = body.email; // ✅ Email ab compulsory hai

    if (!amount || !plan || !email) {
      return NextResponse.json(
        { error: 'amount, plan or email missing' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Check karein: Kya is user ne pehle hi pay kar diya hai?
    const { data: existingPaid } = await supabase
      .from('payment_intents')
      .select('token')
      .eq('email', email)
      .eq('status', 'PAID')
      .maybeSingle();

    if (existingPaid) {
      // 🚨 Agar pehle hi PAID hai, toh naya order mat banao, seedha redirect rasta bhejo
      return NextResponse.json({ 
        action: 'GOTO_SIGNUP', 
        orderId: existingPaid.token 
      }, { headers: corsHeaders });
    }

    // 2. Check karein: Kya koi order pehle se PENDING hai?
    const { data: existingPending } = await supabase
      .from('payment_intents')
      .select('token')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPending) {
      // ♻️ Purana order hi wapas bhej do
      return NextResponse.json({ orderId: existingPending.token }, { headers: corsHeaders });
    }

    // 3. Naya Razorpay Order tabhi banaiye jab upar ke dono case fail hon
    console.log("Creating Razorpay Order...");
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // ₹ → paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    console.log("Razorpay Order Created:", order.id);

    // 4. Insert into payment_intents (Replacement applied here)
    await supabase
      .from('payment_intents')
      .insert([{
        token: order.id,
        status: 'pending',
        amount: amount, 
        plan: plan,     
        mode: mode || 'AUTO', 
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        email: email 
      }]); 

    // 5. Ab response bhejo
    return NextResponse.json({ orderId: order.id });

  } catch (err: any) {
    console.error("❌ create-order critical error:", err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
