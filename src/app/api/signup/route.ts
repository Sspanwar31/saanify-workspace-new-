import { NextResponse } from 'next/server';
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

// ✅ ONLY POST
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      name,
      planType, // "TRIAL" | "PAID"
      orderId   // only for PAID
    } = body;

    if (!email || !name || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const today = new Date();

    // -------------------------------
    // 🟢 TRIAL FLOW
    // -------------------------------
    if (planType === 'TRIAL') {
      const trialDays = 7;

      const planEnd = new Date();
      planEnd.setDate(today.getDate() + trialDays);

      // 🔁 TRIAL FLOW FIX
      const { error } = await supabase
        .from('clients')
        .insert({
          email,
          name,
          plan: 'TRIAL',
          subscription_status: 'active',
          plan_start_date: today.toISOString(),   // ✅ FIX
          plan_end_date: planEnd.toISOString(),   // ✅ FIX
          has_used_trial: true
        });

      if (error) {
        console.error('Trial signup failed:', error);
        return NextResponse.json(
          { error: 'Trial signup failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        plan: 'TRIAL'
      });
    }

    // -------------------------------
    // 🔵 PAID FLOW
    // -------------------------------
    if (planType === 'PAID') {
      if (!orderId) {
        return NextResponse.json(
          { error: 'Order ID required for paid signup' },
          { status: 400 }
        );
      }

      // 1️⃣ Verify payment intent
      const { data: payment, error: paymentError } = await supabase
        .from('payment_intents')
        .select('plan, status')
        .eq('token', orderId)
        .single();

      if (paymentError || !payment) {
        return NextResponse.json(
          { error: 'Invalid Payment Order ID' },
          { status: 400 }
        );
      }

      if (payment.status !== 'PAID') {
        return NextResponse.json(
          { error: 'Payment not completed' },
          { status: 400 }
        );
      }

      // 2️⃣ Plan duration
      let planEnd = new Date();

      if (payment.plan === 'PRO') {
        planEnd.setDate(today.getDate() + 30);
      } else if (payment.plan === 'YEARLY') {
        planEnd.setDate(today.getDate() + 365);
      } else {
        return NextResponse.json(
          { error: 'Unknown plan type' },
          { status: 400 }
        );
      }

      // 3️⃣ Create client
      // 🔁 PAID FLOW FIX
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          email,
          name,
          plan: payment.plan,
          subscription_status: 'active',
          plan_start_date: today.toISOString(),   // ✅ FIX
          plan_end_date: planEnd.toISOString(),   // ✅ FIX
          has_used_trial: true
        });

      if (clientError) {
        console.error('Paid signup failed:', clientError);
        return NextResponse.json(
          { error: 'Paid signup failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        plan: payment.plan
      });
    }

    // -------------------------------
    // ❌ INVALID PLAN
    // -------------------------------
    return NextResponse.json(
      { error: 'Invalid plan type' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('SIGNUP API ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
