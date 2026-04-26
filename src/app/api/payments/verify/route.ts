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
    
    // ❌ CHANGE 1: clientId REMOVED

    // ✅ CHANGE 1: Validation updated (clientId removed)
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

    // ✅ 2. Payment mark as PAID (Core Logic)
    // ❌ CHANGE 3: Plan fetch, duration, expiry logic REMOVED
    // ❌ CHANGE 2: Client update & subscription_orders insert REMOVED
    
    const { data: intent, error: intentErr } = await supabase
      .from('payment_intents')
      .update({
        status: 'PAID',
        razorpay_payment_id: paymentId
      })
      .eq('token', orderId)
      .select('*') // Replaced 'plan' with '*' as requested
      .single();

    if (intentErr || !intent) {
      console.error('Payment intent update failed:', intentErr);
      return NextResponse.json({ error: 'Intent not found' }, { status: 404, headers: corsHeaders });
    }

    // ✅ CHANGE 4: Simple Response
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
