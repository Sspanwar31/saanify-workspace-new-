import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ✅ B64 DECODER FIX: Pakka karein ki key sahi se decode ho rahi hai
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 missing");
  
  try {
    if (rawKey.startsWith('eyJ')) return rawKey;
    return Buffer.from(rawKey, 'base64').toString('utf-8').trim();
  } catch (e) {
    return rawKey; // Fallback
  }
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()
);

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, amount, planId } = body;

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400, headers: corsHeaders });

    // 1. Check existing PAID intent
    const { data: paidIntent } = await supabase
      .from('payment_intents')
      .select('token')
      .eq('email', email)
      .eq('status', 'PAID')
      .maybeSingle();

    if (paidIntent) {
      return NextResponse.json({ action: 'REDIRECT_SIGNUP', orderId: paidIntent.token }, { headers: corsHeaders });
    }

    // 2. Razorpay Order Create
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    // 3. ✅ FIXED: Database Insert (Adding 'mode' to prevent null constraint error)
    const { data: insertedData, error: dbError } = await supabase
      .from('payment_intents')
      .insert([{
        email: email.toLowerCase().trim(),
        token: order.id,
        amount: amount,
        plan: planId,
        status: 'pending',
        mode: 'AUTO' // 👈 YE LINE MISSING THI. Ab error nahi aayega.
      }])
      .select();

    if (dbError) {
      console.error("❌ SUPABASE INSERT ERROR:", dbError.message);
      // Agar yahan error aata hai, toh rasta yahi rok do
      return NextResponse.json({ error: "Database failed to save order: " + dbError.message }, { status: 500, headers: corsHeaders });
    }

    if (!insertedData || insertedData.length === 0) {
      return NextResponse.json({ error: "No data was inserted" }, { status: 500, headers: corsHeaders });
    }

    console.log("✅ DB Entry Created Successfully for:", order.id);

    // 4. Return to frontend ONLY after successful DB insert
    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount,
      razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID 
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error("🔥 FATAL API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
