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
    const isRenewal = body?.isRenewal || false; 
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

    // 1. Razorpay Order Create pehle kar lete hain
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    // 🚀 STEP 2: UPSERT LOGIC (The Real Fix)
    // Hum 'insert' ki jagah 'upsert' use karenge.
    // 'onConflict: email' ka matlab hai agar email pehle se hai, to error mat do, bas data update kar do.
    const { data: insertedData, error: dbError } = await supabase
      .from('payment_intents')
      .upsert({
        email: cleanEmail,
        token: order.id,
        amount: amount,
        plan: planId.toUpperCase(),
        status: 'pending',
        mode: 'AUTO',
        expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      }, { 
        onConflict: 'email', // ✅ Yeh batata hai ki kis column par check karna hai
        ignoreDuplicates: false 
      })
      .select();

    if (dbError) {
      console.error("❌ SUPABASE UPSERT ERROR:", dbError.message);
      
      // AGAR UPSERT BHI FAIL HO RAHA HAI (Constraint issue), toh manual Update try karenge
      const { error: manualUpdateError } = await supabase
        .from('payment_intents')
        .update({
          token: order.id,
          amount: amount,
          plan: planId.toUpperCase(),
          status: 'pending',
          expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        })
        .eq('email', cleanEmail)
        .eq('status', 'pending');

      if (manualUpdateError) {
        return NextResponse.json({ error: "Database Lock: " + manualUpdateError.message }, { status: 500, headers: corsHeaders });
      }
    }

    // 3. Return success
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
