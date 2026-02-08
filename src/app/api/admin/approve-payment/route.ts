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

    // 1️⃣ Fetch order details
    const { data: order, error: fetchError } = await supabase
        .from('subscription_orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) throw new Error("Order not found");

    // 2️⃣ Already approved check (ENUM SAFE)
    if (order.status === 'approved') {
        return NextResponse.json({ message: "Already approved" });
    }

    // 3️⃣ Approve order status
    const { error: updateError } = await supabase
        .from('subscription_orders')
        .update({ status: 'approved' })
        .eq('id', orderId);

    if (updateError) throw updateError;

    // 4️⃣ Get plan duration dynamically from 'plans' table
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('duration_days')
      .eq('name', order.plan_name)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // 5️⃣ Activate client plan with correct duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);

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

    return NextResponse.json({ 
      success: true, 
      message: 'Plan Activated Successfully' 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
