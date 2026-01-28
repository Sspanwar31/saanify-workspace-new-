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

    // 1. Insert into subscription_orders
    // Status 'pending' rakhenge taaki Admin baad me check karke approve kare
    const { data, error } = await supabase
      .from('subscription_orders')
      .insert([{
        client_id: clientId,
        plan_name: planName,
        amount: amount,
        payment_method: 'MANUAL', // Pata chale ki ye manual hai
        status: 'pending',        // Abhi verify nahi hua hai
        transaction_id: transactionId, // User ka diya hua UTR/Ref No
        screenshot_url: screenshotUrl || null
      }])
      .select()
      .single();

    if (error) {
      console.error("Manual Entry Error:", error);
      throw error;
    }

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
