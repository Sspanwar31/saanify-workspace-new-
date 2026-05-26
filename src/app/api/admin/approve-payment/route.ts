import { NextResponse } from 'next/server';
// ✅ 1. Purana createClient aur decoding logic hata kar Master Admin import karein
import { supabaseAdmin } from '@/lib/supabase-service'; 

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

    console.log("🚀 Approving Order ID:", orderId);

    // 🚀 2. Local supabaseAdmin ki jagah imported master instance use karein
    // Isme decoding logic pehle se hi 'lib/supabase-service.ts' mein handle ho chuki hai

    // 3. Check Order Status
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('subscription_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found in DB" }, { status: 404 });
    }

    if (order.status === 'approved') {
      return NextResponse.json({ message: "Already Approved" });
    }

    // 4. Update Order Status
    const { error: updateError } = await supabaseAdmin
      .from('subscription_orders')
      .update({ status: 'approved' })
      .eq('id', orderId);

    if (updateError) throw new Error("Failed to update order status");

    // 5. Update Client Plan
    const { data: planData } = await supabaseAdmin
        .from('plans')
        .select('duration_days')
        .eq('name', order.plan_name)
        .single();
        
    const duration = planData?.duration_days || 30;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    const { error: clientError } = await supabaseAdmin
      .from('clients')
      .update({
        plan_name: order.plan_name,
        subscription_status: 'active',
        plan_start_date: startDate.toISOString(),
        plan_end_date: endDate.toISOString(),
      })
      .eq('id', order.client_id);

    if (clientError) console.error("❌ Client Plan Update Failed:", clientError);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Approval API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
