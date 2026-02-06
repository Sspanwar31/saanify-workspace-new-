Ye raha updated code. Maine aapki instructions ke mutabiq changes kiye hain:

1.  **Select Update:** `plan` ki jagah `plan_code` select kiya hai.
2.  **Plan Resolve:** Payment update ke baad `plans` table se `plan_id` aur duration fetch kar liya hai.
3.  **Response Update:** Response mein `plan` object return kar diya hai taaki frontend ko saari details mil jayein.

```typescript
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// --- SERVICE ROLE KEY FIX ---
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

// ✅ ONLY POST — NO GET / NO DEFAULT EXPORT
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
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
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 2️⃣ Mark payment_intents as PAID
    // 🔄 DIFF-1: payment_intents → plan_code, not plan
    const { data, error } = await supabase
      .from('payment_intents')
      .update({
        status: 'PAID',
        razorpay_payment_id: paymentId
      })
      .eq('token', orderId) // 🔑 razorpay_order_id == token
      .select('id, plan_code') // ✅ Select plan_code
      .single();

    if (error || !data) {
      console.error('Payment intent update failed:', error);
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // 🔧 DIFF-2: Resolve plan from plans table (READ ONLY)
    const { data: planRow, error: planError } = await supabase
      .from('plans')
      .select('id, code, duration_days')
      .eq('code', data.plan_code)
      .single();

    if (planError || !planRow) {
      return NextResponse.json(
        { error: 'Plan not found for payment' },
        { status: 500 }
      );
    }

    // 🔧 DIFF-3: FINAL RESPONSE (future-safe)
    return NextResponse.json({
      success: true,
      orderId: orderId,
      plan: {
        id: planRow.id,
        code: planRow.code,
        duration_days: planRow.duration_days
      }
    });

  } catch (error: any) {
    console.error('VERIFY API ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```
