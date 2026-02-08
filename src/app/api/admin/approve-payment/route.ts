import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- FIXED KEY LOGIC ---
const getServiceRoleKey = () => {
  // 1. Pehle standard key check karein (Recommended)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // 2. Agar aap B64 use kar rahe hain to usse check karein
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  
  if (!rawKey) {
    // ❌ Error throw karein agar Admin Key nahi mile (Anon key use NA karein)
    throw new Error("SERVER ERROR: Service Role Key is missing in .env");
  }

  if (!rawKey.startsWith('eyJ')) {
    return Buffer.from(rawKey, 'base64').toString('utf-8');
  }
  return rawKey;
};

// Admin Client Create karte waqt error handling
let supabase;
try {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getServiceRoleKey()!, 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
} catch (e) {
  console.error("Supabase Client Init Failed:", e);
}

export async function POST(req: Request) {
  try {
    if (!supabase) {
        return NextResponse.json({ error: "Server Configuration Error: Invalid Supabase Key" }, { status: 500 });
    }

    const { orderId } = await req.json(); 

    if (!orderId) {
        return NextResponse.json({ error: "Missing Order ID" }, { status: 400 });
    }

    console.log(`Processing Approval for Order: ${orderId}`);

    // 1️⃣ Fetch order details
    const { data: order, error: fetchError } = await supabase
        .from('subscription_orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        console.error("Order not found:", fetchError);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2️⃣ Already approved check
    if (order.status === 'approved') {
        return NextResponse.json({ message: "Already approved" });
    }

    // 3️⃣ Approve order status (Isme error check bahut jaruri hai)
    const { error: updateError } = await supabase
        .from('subscription_orders')
        .update({ status: 'approved' })
        .eq('id', orderId);

    if (updateError) {
        console.error("Update Status Failed:", updateError); // Logs me error dekhein
        throw new Error(`Failed to update status: ${updateError.message}`);
    }

    // 4️⃣ Get plan duration
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('duration_days')
      .eq('name', order.plan_name)
      .single();

    // Default 30 days agar plan table me issue ho to
    const duration = plan?.duration_days || 30; 

    // 5️⃣ Activate client plan
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

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

    if (clientError) {
        console.error("Client Activation Failed:", clientError);
        // Note: Order approve ho gaya par client update fail hua
        throw new Error(`Order approved but client update failed: ${clientError.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment Approved & Plan Activated' 
    });

  } catch (error: any) {
    console.error("Approval API Critical Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
