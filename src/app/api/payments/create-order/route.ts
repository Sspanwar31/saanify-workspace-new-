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
    const { email, amount, planId } = body;

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // 1. Check: Kya is email se pehle hi PAID (lekin register nahi) payment ho chuki hai?
    const { data: paidIntent } = await supabase
      .from('payment_intents')
      .select('token')
      .eq('email', email)
      .eq('status', 'PAID')
      .maybeSingle();

    if (paidIntent) {
      // 🚀 MAGIC: Naya order banane ke bajaye purana rasta bhej do
      return NextResponse.json({ 
        action: 'REDIRECT_SIGNUP', 
        orderId: paidIntent.token 
      }, { headers: corsHeaders });
    }

    // 2. Check: Kya koi PENDING order hai? (Taaki ek hi order reuse ho)
    const { data: pendingIntent } = await supabase
      .from('payment_intents')
      .select('token')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingIntent) {
       return NextResponse.json({ 
         orderId: pendingIntent.token, 
         amount: amount * 100 
       }, { headers: corsHeaders });
    }

    // 3. Agar kuch nahi mila, tabhi naya Razorpay order banayein
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
    });

    // DB mein insert karein
    await supabase.from('payment_intents').insert([{
      email: email,
      token: order.id,
      amount: amount,
      plan: planId,
      status: 'pending'
    }]);

    return NextResponse.json({ orderId: order.id, amount: order.amount });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
