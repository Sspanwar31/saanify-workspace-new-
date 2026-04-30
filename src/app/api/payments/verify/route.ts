import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY_B64 is missing');
  if (!rawKey.startsWith('eyJ')) return Buffer.from(rawKey, 'base64').toString('utf-8');
  return rawKey;
};

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getServiceRoleKey());

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = body.razorpay_order_id || body.orderCreationId;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400, headers: corsHeaders });
    }

    // 1. Signature Verify
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400, headers: corsHeaders });
    }

    // 🚀 STEP 2: Intent Fetch (Isi se Email aur Plan milega)
    const { data: intent, error: intentErr } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('token', orderId)
      .maybeSingle();

    if (intentErr || !intent) {
      console.error('Intent not found');
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404, headers: corsHeaders });
    }

    // ✅ 3. Payment Mark as PAID (Ye Signup flow ka signal hai)
    // .select() zaroori hai taaki Realtime listener ko update mile
    await supabase
      .from('payment_intents')
      .update({ status: 'PAID', razorpay_payment_id: paymentId })
      .eq('token', orderId)
      .select();

    // 🚀 STEP 4: UPGRADE LOGIC (Based on Email)
    if (intent.email) {
      const rawPlan = intent.plan || 'BASIC';
      const safePlan = String(rawPlan).toUpperCase();
      const formattedName = safePlan.charAt(0) + safePlan.slice(1).toLowerCase();

      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 30); // 30 Days expiry

      // Hum clients table mein is email ko dhoond kar update karenge
      const { data: updatedClient, error: updateError } = await supabase
        .from('clients')
        .update({
          plan: safePlan,                // 'BASIC'
          plan_name: formattedName,      // 'Basic'
          status: 'ACTIVE',
          subscription_status: 'active',
          plan_start_date: new Date().toISOString(),
          plan_end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', intent.email.toLowerCase().trim())
        .select();

      if (updateError) {
        console.error('Client update error:', updateError.message);
      } else if (updatedClient && updatedClient.length > 0) {
        console.log('✅ Plan successfully upgraded for:', intent.email);
      } else {
        // Agar koi row update nahi hui, matlab ye naya user hai (Signup flow)
        console.log('ℹ️ No existing client found with this email. Signup flow will handle it.');
      }
    }

    return NextResponse.json({ 
      success: true,
      isPaid: true,
      orderId: orderId
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('CRITICAL VERIFY ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
