import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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
    const clientId = body.clientId; 

    // 1. Basic Validation
    if (!orderId || !paymentId || !signature || !clientId) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400, headers: corsHeaders });
    }

    // 2. Razorpay Signature Verify
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400, headers: corsHeaders });
    }

    // 3. Update Payment Intent & Fetch Plan Info
    const { data: intent, error: intentErr } = await supabase
      .from('payment_intents')
      .update({ status: 'PAID', razorpay_payment_id: paymentId })
      .eq('token', orderId)
      .select('plan')
      .single();

    if (intentErr || !intent) {
      console.error('Payment intent update failed:', intentErr);
      return NextResponse.json({ error: 'Intent not found' }, { status: 404, headers: corsHeaders });
    }

    // 4. Fetch Plan Details (Robust Logic)
    const { data: planRow } = await supabase
      .from('plans')
      .select('id, name, duration_days')
      .eq('code', intent.plan) 
      .maybeSingle();

    // Expiry Date Logic (Code 2 + Fallback)
    const duration = planRow?.duration_days || (intent.plan.toUpperCase().includes('ENTERPRISE') ? 365 : 30);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    // 5. ✅ UPDATE CLIENT & CREATE ORDER (Everything in one go - Merged Logic)
    const updateResults = await Promise.all([
      // A. Activate Client (Using Code 2's robust fields)
      supabase.from('clients').update({
        status: 'ACTIVE', // Ensuring status is set
        plan: intent.plan,
        plan_name: planRow?.name || intent.plan,
        plan_id: planRow?.id,                      
        subscription_status: 'active',
        plan_start_date: new Date().toISOString(),
        plan_end_date: expiryDate.toISOString(),
        subscription_expiry: expiryDate.toISOString() 
      }).eq('id', clientId),

      // B. Create Subscription Order record (For Admin History - From Code 1)
      supabase.from('subscription_orders').insert({
        client_id: clientId,
        plan_name: planRow?.name || intent.plan,
        amount: intent.amount, // Assuming amount exists in intent object, else you might need to fetch it
        status: 'approved',
        payment_method: 'RAZORPAY',
        transaction_id: paymentId,
        duration_days: duration
      })
    ]);

    // Check if updates failed
    if (updateResults[0].error) {
      console.error("❌ Database Update Failed:", updateResults[0].error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500, headers: corsHeaders });
    }

    // 6. Return SUCCESS
    return NextResponse.json({ 
      success: true, 
      message: "Payment Verified & Account Activated",
      redirect: "/dashboard",
      isPaid: true,
      orderId: orderId
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('CRITICAL VERIFY ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
