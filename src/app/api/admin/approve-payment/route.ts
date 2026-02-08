import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Key Decoding Logic (Simplified & Debugged)
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Agar normal key nahi hai, to B64 check karein
    if (!serviceKey && process.env.SUPABASE_SERVICE_ROLE_KEY_B64) {
      const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
      // Agar ye "ey..." se start nahi ho raha to hi decode karein
      if (!b64Key.startsWith('eyJ')) {
         serviceKey = Buffer.from(b64Key, 'base64').toString('utf-8').trim();
      } else {
         serviceKey = b64Key;
      }
    }

    if (!serviceKey) {
      throw new Error("CRITICAL: Service Role Key missing from .env");
    }

    // 2. Admin Client Initialization
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { orderId } = await req.json();
    console.log("Approving Order ID:", orderId);

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

    // 4. Update Order Status (Force Update)
    const { error: updateError } = await supabaseAdmin
      .from('subscription_orders')
      .update({ status: 'approved' })
      .eq('id', orderId);

    if (updateError) {
      console.error("Order Update Failed:", updateError);
      throw new Error("Failed to update order status in DB");
    }

    // 5. Update Client Plan (Users Table)
    // Note: 'clients' table me ID match honi chahiye
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
      .from('clients') // Ensure table name is correct (clients vs users)
      .update({
        plan_name: order.plan_name,
        subscription_status: 'active',
        plan_start_date: startDate.toISOString(),
        plan_end_date: endDate.toISOString(),
        // status: 'ACTIVE' // Is line ko hata dein agar column nahi hai
      })
      .eq('id', order.client_id);

    if (clientError) {
      console.error("Client Plan Update Failed:", clientError);
      // Client update fail hua, par Order approve ho gaya. 
      // Hum success return karenge par log check karna hoga.
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Approval API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
