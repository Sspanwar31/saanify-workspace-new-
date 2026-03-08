import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ✅ UPDATED CORS Headers (X-Requested-With added)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// --- SERVICE ROLE KEY FIX (Secure & B64 Safe) ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY_B64 is missing');
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

// ✅ UPDATED OPTIONS Method (Status 204 for Standard Preflight)
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 204, 
    headers: corsHeaders 
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Flutter/Web dono keys handle karne ke liye
    const orderId = body.razorpay_order_id || body.orderCreationId;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    const clientId = body.clientId; // ✅ Client ID important hai activation ke liye

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1️⃣ Razorpay Signature Verify
    const hmac = crypto.createHmac(
      'sha256',
      process.env.RAZORPAY_KEY_SECRET!
    );

    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature', isPaid: false },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2️⃣ Mark payment_intents as PAID
    const { data: intent, error: intentErr } = await supabase
      .from('payment_intents')
      .update({
        status: 'PAID',
        razorpay_payment_id: paymentId
      })
      .eq('token', orderId) 
      .select('plan') // Plan name chahiye duration calculate karne ke liye
      .single();

    if (intentErr || !intent) {
      console.error('Payment intent update failed:', intentErr);
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // --- NEW UPDATE LOGIC START (As requested) ---

    // 1. Naye plan ki details 'plans' table se nikalen
    const { data: planRow } = await supabase
      .from('plans')
      .select('id, name, duration_days')
      .eq('code', intent.plan) // intent.plan me 'BASIC', 'PRO' ya 'ENTERPRISE' hona chahiye
      .single();

    // 2. Expiry date set karein
    const duration = planRow?.duration_days || (intent.plan.toUpperCase().includes('ENTERPRISE') ? 365 : 30);
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + duration);

    // 3. ✅ CLIENT TABLE UPDATE (Sari important fields ke sath)
    const { error: clientUpdateErr } = await supabase
      .from('clients')
      .update({
        plan: intent.plan,                         // e.g., 'PRO'
        plan_name: planRow?.name || intent.plan,    // e.g., 'Professional'
        plan_id: planRow?.id,                      // Website isi se data uthati hai
        subscription_status: 'active',
        plan_start_date: new Date().toISOString(),
        plan_end_date: newExpiry.toISOString(),
        subscription_expiry: newExpiry.toISOString() // ✅ Kuch logic is column ko bhi use karte hain
      })
      .eq('id', clientId); // Ensure 'clientId' sahi aa raha hai payload me

    if (clientUpdateErr) {
      console.error("❌ Database Update Failed:", clientUpdateErr);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500, headers: corsHeaders });
    }

    // --- NEW UPDATE LOGIC END ---

    // 5️⃣ Final Response
    return NextResponse.json(
      { success: true, isPaid: true, orderId: orderId }, 
      { status: 200, headers: corsHeaders } 
    );

  } catch (error: any) {
    console.error('VERIFY API ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: corsHeaders }
    );
  }
}
