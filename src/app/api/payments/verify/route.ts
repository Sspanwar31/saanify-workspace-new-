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
    const clientId = body.clientId; // ✅ RESTORED: Upgrade ke waqt hum clientId bhej rahe hain
    
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
    const { data: intent, error: intentErr } = await supabase
      .from('payment_intents')
      .update({
        status: 'PAID',
        razorpay_payment_id: paymentId
      })
      .eq('token', orderId)
      .select() // ✅ Ye line Realtime ko 'PAID' signal turant bhejegi
      .maybeSingle(); // .single() ki jagah maybeSingle safe hai

    if (intentErr) {
      console.error('Database update failed:', intentErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500, headers: corsHeaders });
    }

    // 🚀 NAYA LOGIC: Agar clientId maujood hai (Matlab ye UPGRADE/RENEW hai)
    if (clientId && intent) {
      console.log("Processing Upgrade for Client:", clientId);

      // Nayi expiry date calculate karein (Today + 30 Days)
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 30);

      // Clients table ko update karein
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          plan: intent.plan, // e.g. 'PROFESSIONAL'
          plan_name: intent.plan.charAt(0) + intent.plan.slice(1).toLowerCase(), // e.g. 'Professional'
          status: 'ACTIVE',
          plan_start_date: new Date().toISOString(),
          plan_end_date: newEndDate.toISOString(),
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (updateError) {
        console.error('Failed to update client plan:', updateError);
        // Hum yahan return nahi karenge kyunki payment toh ho chuka hai
      }
    }

    // 3. Simple Response (Signup flow handles rest via Realtime)
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
