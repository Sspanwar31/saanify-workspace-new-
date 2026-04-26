import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// --- 🔐 SERVICE ROLE KEY DECODER (Aapke project ke hisab se) ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY_B64 is missing');
  }
  // Agar key pehle se decoded hai (eyJ se shuru hoti hai), toh wahi bhej do
  if (rawKey.startsWith('eyJ')) {
    return rawKey;
  }
  // Warna Base64 se decode karo
  return Buffer.from(rawKey, 'base64').toString('utf-8');
};

// Supabase Client Initialize
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()
);

// --- CORS HEADERS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-razorpay-signature',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return new Response("🚀 Webhook Gateway is LIVE. Waiting for Razorpay POST requests...", { status: 200 });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text(); 
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    console.log("📩 Webhook Triggered. Signature received:", !!signature);

    if (!signature || !secret) {
      console.error("❌ Webhook Error: Missing signature or secret in .env");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
    }

    // 1. Signature Verify karein
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error("❌ Webhook Error: Signature mismatch.");
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    
    // 2. Handle Payment Capture
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      console.log("✅ Payment Verified for Order ID:", orderId);

      // 🔥 DB UPDATE (Ab ye Service Role se chalega)
      const { data, error } = await supabase
        .from('payment_intents')
        .update({
          status: 'PAID',
          razorpay_payment_id: paymentId,
        })
        .eq('token', orderId)
        .select(); // Realtime trigger karne ke liye zaroori hai

      if (error) {
        console.error("❌ Supabase DB Update Error:", error.message);
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
      }
      
      console.log("🚀 Status Successfully updated to PAID in Database.");
    }

    return NextResponse.json({ status: 'ok' }, { headers: corsHeaders });

  } catch (err: any) {
    console.error("❌ Fatal Webhook Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
