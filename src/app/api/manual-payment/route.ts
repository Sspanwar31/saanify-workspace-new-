import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC (Same as your code) ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawKey.startsWith('eyJ')) {
    return Buffer.from(rawKey, 'base64').toString('utf-8');
  }
  return rawKey;
};

// Admin Client (To bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()!
);

export async function POST(req: Request) {
  try {
    const { clientId, planName, amount, transactionId, screenshotUrl } = await req.json();

    if (!clientId || !amount || !transactionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ✅ STEP 1: Prevent duplicate pending / approved manual orders
    const { data: existingOrder } = await supabase
      .from('subscription_orders')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('payment_method', 'manual')
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json(
        {
          error:
            existingOrder.status === 'approved'
              ? 'Payment already approved'
              : 'Payment already pending verification'
        },
        { status: 400 }
      );
    }

    // ✅ STEP 2: Normalize screenshot URL
    const screenshotPublicUrl =
      typeof screenshotUrl === 'string'
        ? screenshotUrl
        : screenshotUrl?.publicUrl ?? null;

    // ✅ STEP 3: Insert manual payment
    const { data, error } = await supabase
      .from('subscription_orders')
      .insert([{
        client_id: clientId,
        plan_name: planName,
        amount,
        payment_method: 'manual', // ✅ lowercase (IMPORTANT)
        status: 'pending',
        transaction_id: transactionId,
        screenshot_url: screenshotPublicUrl
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
        success: true, 
        message: 'Payment submitted for verification',
        orderId: data.id 
    });

  } catch (error: any) {
    console.error("Manual Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
