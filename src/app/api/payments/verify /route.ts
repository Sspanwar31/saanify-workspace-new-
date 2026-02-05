import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ✅ FIX 1: Key nikalne ka sahi logic (B64 support ke sath)
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  
  if (!rawKey) {
    console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY_B64 is missing in Vercel Env");
    // Fallback try karein agar galti se simple name se save ho
    return process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
  }

  // Agar key 'eyJ' (JWT format) se shuru nahi hoti, to iska matlab wo Base64 encoded hai
  if (!rawKey.startsWith('eyJ')) {
    try {
      return Buffer.from(rawKey, 'base64').toString('utf-8');
    } catch (e) {
      console.error("❌ Key decode failed, using raw key");
      return rawKey;
    }
  }
  
  return rawKey;
};

// ✅ FIX 2: Sahi decoded key ka use karke Client banayein
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // --- Validation ---
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // --- Signature Verification ---
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        throw new Error("RAZORPAY_KEY_SECRET is missing in Env");
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // --- Update Database ---
    // Note: Hum 'token' column check kar rahe hain jisme Order ID save hai
    const { data, error } = await supabase
      .from('payment_intents')
      .update({
        status: 'PAID',
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date()
      })
      .eq('token', razorpay_order_id)
      .select()
      .single();

    if (error) {
        console.error("DB Error:", error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified',
      data: data 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
