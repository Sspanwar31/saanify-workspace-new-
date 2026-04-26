import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// 🔐 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🚫 IMPORTANT: Disable body parsing (Next.js requirement)
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    // 🔴 RAW BODY lena zaroori hai (signature verify ke liye)
    const rawBody = await req.text();

    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // 🔐 Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ✅ Parse body AFTER verification
    const event = JSON.parse(rawBody);

    console.log("📩 Webhook Event:", event.event);

    // 🎯 ONLY handle successful payments
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      console.log("✅ Processing Payment for Order:", orderId);

      // 🔥 DB UPDATE (Using select to force immediate commit visibility)
      const { error } = await supabase
        .from('payment_intents')
        .update({
          status: 'PAID',
          razorpay_payment_id: paymentId,
          // Amount already captured by entity, optional to re-set
        })
        .eq('token', orderId)
        .select(); // ✅ Force commit acknowledgment

      if (error) {
        console.error("❌ Webhook DB Error:", error);
        return NextResponse.json({ error: 'Retry later' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("❌ Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
