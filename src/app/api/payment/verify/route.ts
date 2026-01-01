import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC START ---
// Hum check karenge ki key encoded hai ya direct hai, aur usse sahi karenge
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  
  if (!rawKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 is missing in .env");
  }

  // Agar Key 'eyJ' se shuru nahi hoti, iska matlab wo Base64 encoded hai
  if (!rawKey.startsWith('eyJ')) {
    try {
      return Buffer.from(rawKey, 'base64').toString('utf-8');
    } catch (e) {
      console.error("Failed to decode key, using raw value");
      return rawKey;
    }
  }
  // Agar 'eyJ' se shuru hoti hai, to wo already sahi hai
  return rawKey;
};
// --- KEY FIXING LOGIC END ---

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey() // Yahan hum fixed key use kar rahe hain
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Frontend aur Backend ke variable names match karna
    const orderId = body.razorpay_order_id || body.orderCreationId;
    const paymentId = body.razorpay_payment_id || body.razorpayPaymentId;
    const signature = body.razorpay_signature || body.razorpaySignature;

    console.log(`Verifying Order: ${orderId} | Payment: ${paymentId}`);

    if (!orderId || !paymentId || !signature) {
        return NextResponse.json({ error: "Missing required payment details" }, { status: 400 });
    }

    // 1. Signature Verification
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${orderId}|${paymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return NextResponse.json({ error: 'Transaction not legit!' }, { status: 400 });
    }

    // 2. Subscription Update
    const { data: subData, error: subError } = await supabase
      .from('subscriptions') 
      .update({ 
          status: 'success', 
          transaction_id: paymentId, 
          payment_method: 'RAZORPAY'
      })
      .eq('transaction_id', orderId)
      .select()
      .single();

    if (subError || !subData) {
        // Asli error console me print karein
        console.error("Supabase Error Details:", subError);
        throw new Error(`Database Update Failed: ${subError?.message || "Record not found"}`);
    }

    // 3. Client Plan Update
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

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
        throw clientError;
    }

    return NextResponse.json({ message: 'Success', isPaid: true });

  } catch (error: any) {
    console.error("FINAL VERIFICATION ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
