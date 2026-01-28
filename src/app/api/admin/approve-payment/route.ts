import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawKey.startsWith('eyJ')) {
    return Buffer.from(rawKey, 'base64').toString('utf-8');
  }
  return rawKey;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()!
);

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json(); // subscription_orders table ki ID

    // 1. Fetch Order Details
    const { data: order, error: fetchError } = await supabase
        .from('subscription_orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) throw new Error("Order not found");

    if (order.status === 'success') {
        return NextResponse.json({ message: "Already approved" });
    }

    // 2. Update Order Status to Success
    const { error: updateError } = await supabase
        .from('subscription_orders')
        .update({ status: 'success' })
        .eq('id', orderId);

    if (updateError) throw updateError;

    // 3. Activate Client Plan (Main Logic)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // 30 Days Plan

    const { error: clientError } = await supabase
      .from('clients')
      .update({
        plan_name: order.plan_name,
        plan_start_date: startDate.toISOString(),
        plan_end_date: endDate.toISOString(),
        subscription_status: 'active',
        status: 'ACTIVE',
      })
      .eq('id', order.client_id);

    if (clientError) throw clientError;

    return NextResponse.json({ success: true, message: "Plan Activated Successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
