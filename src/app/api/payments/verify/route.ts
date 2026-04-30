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

// ✅ UPDATED OPTIONS Method
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

    // ✅ CHANGE 1: Validation updated (clientId dependency removed)
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400, headers: corsHeaders });
    }

    // ✅ 1. Signature Verify (Same as before)
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400, headers: corsHeaders });
    }

    // 🚀 STEP 2: GET PLAN & EMAIL FROM INTENT (The Source of Truth)
    // Hum intent table se email nikalenge taaki clients table ko target kar sakein
    const { data: intent, error: intentErr } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('token', orderId)
      .single();

    if (intentErr || !intent) {
      throw new Error("Payment record not found in database");
    }

    // 3. Mark Intent as PAID (Signup flow ke liye)
    await supabase
      .from('payment_intents')
      .update({ status: 'PAID', razorpay_payment_id: paymentId })
      .eq('token', orderId);

    // 🚀 STEP 4: TARGET CLIENT BY EMAIL (Bulletproof Upgrade Logic)
    // Hum 'email' ko target karenge kyunki main accounts ka client_id null hota hai
    
    // Nayi expiry calculate karein (Today + 30 Days)
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + 30);

    // Plan Name formatting (BASIC -> Basic)
    const formattedPlanName = intent.plan.charAt(0).toUpperCase() + intent.plan.slice(1).toLowerCase();

    const { error: updateError } = await supabase
      .from('clients')
      .update({
        plan: intent.plan.toUpperCase(), // 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'
        plan_name: formattedPlanName,    // 'Basic', 'Professional', 'Enterprise'
        status: 'ACTIVE',
        subscription_status: 'active',
        plan_start_date: new Date().toISOString(),
        plan_end_date: newEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', intent.email); // 🎯 TARGETING BY EMAIL

    if (updateError) {
      console.error('Update failed (User might be new/Signup flow):', updateError.message);
      // Agar update fail hota hai iska matlab user naya hai (Signup Flow), 
      // toh hum yahan error nahi denge, kyunki Signup flow usey handle kar lega.
    } else {
      console.log('✅ Subscription Updated for:', intent.email);
    }

    // 5. Simple Response (Signup flow handles rest via Realtime)
    return NextResponse.json({ 
      success: true,
      isPaid: true,
      orderId: orderId
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('CRITICAL VERIFY ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
