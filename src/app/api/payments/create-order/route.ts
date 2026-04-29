import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ✅ B64 DECODER FIX
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
    const { email, phone, amount, planId } = body;
    const isRenewal = body?.isRenewal || false; // Frontend se bhejein agar ye purana client hai
    const cleanEmail = email.toLowerCase().trim();

    if (!email || !amount || !planId) {
      return NextResponse.json({ error: "Missing required fields (email, amount, or planId)" }, { status: 400, headers: corsHeaders });
    }

    // 🛑 CHECK 1: Renewal (Existing User)
    if (!isRenewal) {
        const { data: existingUser } = await supabase
          .from('clients')
          .select('id')
          .or(`email.eq.${cleanEmail},phone.eq.${phone}`)
          .maybeSingle();

        if (existingUser) {
          return NextResponse.json({ 
            error: "This email or phone number is already registered with an account." 
          }, { status: 400, headers: corsHeaders });
        }
    }

    // 🛑 CHECK 2: Trial Abuse Protection
    if (planId.toString().toUpperCase() === 'TRIAL') {
      const { data: usedTrial } = await supabase
        .from('payment_intents')
        .select('id')
        .eq('email', cleanEmail)
        .eq('plan', 'TRIAL')
        .maybeSingle();

      if (usedTrial) {
        return NextResponse.json({ 
          error: "You have already used your Free Trial. Please choose a paid plan." 
        }, { status: 400, headers: corsHeaders });
      }
    }

    // 🚀 STEP 3: DELETE OLD PENDING INTENTS (Fixes Duplicate Key Error)
    // Naya record insert karne se pehle purane pending records hatana zaroori hai
    await supabase
      .from('payment_intents')
      .delete()
      .eq('email', cleanEmail)
      .eq('status', 'pending');

    // 4. Razorpay Order Create
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    // 5. Insert New Intent
    const { data: insertedData, error: dbError } = await supabase
      .from('payment_intents')
      .insert([{
        email: cleanEmail,
        token: order.id,
        amount: amount,
        plan: planId.toUpperCase(), // e.g., 'BASIC'
        status: 'pending',
        mode: 'AUTO',
        expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 mins expiry
      }])
      .select();

    if (dbError) {
      console.error("❌ SUPABASE INSERT ERROR:", dbError.message);
      return NextResponse.json({ error: "Database failed to save order: " + dbError.message }, { status: 500, headers: corsHeaders });
    }

    if (!insertedData || insertedData.length === 0) {
      return NextResponse.json({ error: "No data was inserted" }, { status: 500, headers: corsHeaders });
    }

    console.log("✅ DB Entry Created Successfully for:", order.id);

    // 6. Return to frontend ONLY after successful DB insert
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
