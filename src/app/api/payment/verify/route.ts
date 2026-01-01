import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase Client Setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B64! 
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // --- FIX: Donon variable names check kar rahe hain ---
    // Frontend shayad 'razorpay_order_id' bhej raha hai, par code 'orderCreationId' maang raha tha
    const orderId = body.razorpay_order_id || body.orderCreationId;
    const paymentId = body.razorpay_payment_id || body.razorpayPaymentId;
    const signature = body.razorpay_signature || body.razorpaySignature;

    // Debugging Log (Vercel Logs me dikhega ki kya ID aayi)
    console.log("Processing Verification for Order ID:", orderId); 

    if (!orderId || !paymentId || !signature) {
        return NextResponse.json({ error: "Missing required payment details" }, { status: 400 });
    }

    // 2. Signature Verification
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${orderId}|${paymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      console.error("Signature Mismatch!", { expected: digest, received: signature });
      return NextResponse.json({ error: 'Transaction not legit!' }, { status: 400 });
    }

    // 3. Subscription Table Update
    // Hum 'subscriptions' table me wo row dhoondenge jaha transaction_id match kare
    const { data: subData, error: subError } = await supabase
      .from('subscriptions') 
      .update({ 
          status: 'success', 
          transaction_id: paymentId, 
          payment_method: 'RAZORPAY'
      })
      .eq('transaction_id', orderId) // Yaha ab sahi ID jayegi
      .select()
      .single();

    if (subError || !subData) {
        console.error("Database Update Failed:", subError);
        // Agar row nahi mili to ye error throw hoga
        throw new Error(`Subscription record not found for Order ID: ${orderId}`);
    }

    // 4. Dates Calculate karein
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    // 5. Client Plan Update
    const { error: clientError } = await supabase
        .from('clients')
        .update({
            plan_name: subData.plan_name,
            plan_start_date: startDate.toISOString(),
            plan_end_date: endDate.toISOString(),
            subscription_status: 'active',
            status: 'ACTIVE'
        })
        .eq('id', subData.client_id); 

    if (clientError) {
        console.error("Client update error:", clientError);
        throw clientError;
    }

    return NextResponse.json({ message: 'Success', isPaid: true });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
