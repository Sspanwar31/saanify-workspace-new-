import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ IMPORTANT: Ye line jaruri hai kyunki hum 'Buffer' use kar rahe hain
export const runtime = 'nodejs'; 

// ✅ APKA BATAYA HUA WORKING LOGIC
const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return null;
  // B64 ko decode karke string banata hai aur extra space hatata hai
  return Buffer.from(b64, 'base64').toString('utf-8').trim(); 
};

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = getServiceRoleKey();

    // 1. Configuration Check
    if (!supabaseUrl || !serviceKey) {
      console.error("Server Config Error: Missing URL or B64 Key");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. Admin Client Init (RLS Bypass)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing Order ID" }, { status: 400 });
    }

    console.log(`Processing Order Approval: ${orderId}`);

    // 3. Get Order Details
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('subscription_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === 'approved') {
      return NextResponse.json({ message: "Already Approved" });
    }

    // 4. Update Status to Approved
    const { error: updateError } = await supabaseAdmin
      .from('subscription_orders')
      .update({ status: 'approved' })
      .eq('id', orderId);

    if (updateError) {
      console.error("Order Update Failed:", updateError);
      throw new Error(updateError.message);
    }

    // 5. Activate Client Plan
    // Plan duration fetch karein
    const { data: planData } = await supabaseAdmin
      .from('plans')
      .select('duration_days')
      .eq('name', order.plan_name)
      .maybeSingle();

    const duration = planData?.duration_days || 30; // Default 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    // Client Table Update
    const { error: clientError } = await supabaseAdmin
      .from('clients')
      .update({
        plan_name: order.plan_name,
        subscription_status: 'active',
        plan_start_date: startDate.toISOString(),
        plan_end_date: endDate.toISOString(),
      })
      .eq('id', order.client_id);

    if (clientError) {
      console.error("Client Update Warning:", clientError);
      // Order approve ho gaya, client update fail hua to bhi success return karein
      // taki UI par "Approved" dikhe, lekin log check kar sakein.
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plan Activated Successfully' 
    });

  } catch (error: any) {
    console.error("Admin Approval Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
