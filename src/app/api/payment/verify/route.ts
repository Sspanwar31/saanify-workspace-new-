import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// 1. Key ko Decode karna (Encoded string -> Original Key)
const encodedKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64!;
const decodedServiceKey = Buffer.from(encodedKey, 'base64').toString('utf-8');

// 2. Supabase Client banana (Decoded Key ke saath)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  decodedServiceKey // Ab ye original key hai
);

export async function POST(req: Request) {
  try {
    const { orderCreationId, razorpayPaymentId, razorpaySignature } = await req.json();

    // 1. Signature Verification
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return NextResponse.json({ error: 'Transaction not legit!' }, { status: 400 });
    }

    // 2. 'subscriptions' table ko update karein
    const { data: subData, error: subError } = await supabase
      .from('subscriptions') 
      .update({ 
          status: 'success', 
          transaction_id: razorpayPaymentId, 
          payment_method: 'RAZORPAY'
      })
      .eq('transaction_id', orderCreationId)
      .select()
      .single();

    if (subError || !subData) {
        console.error("Subscription update error:", subError);
        throw new Error("Subscription record not found or update failed");
    }

    // 3. Plan Dates Calculate karein (30 Days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    // 4. 'clients' table ko update karein
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
