import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- SERVICE ROLE KEY FIX ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY_B64 is missing');
  }
  if (!rawKey.startsWith('eyJ')) {
    return Buffer.from(rawKey, 'base64').toString('utf-8');
  }
  return rawKey;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()
);

// ✅ ONLY POST
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      name,
      planType // "TRIAL" | "PAID"
    } = body;

    if (!email || !name || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const today = new Date();

    // -------------------------------
    // 🟢 TRIAL FLOW (REFACTORED)
    // -------------------------------
    if (planType === 'TRIAL') {
      
      // 1️⃣ Fetch TRIAL plan from DB
      const { data: planRow, error: planError } = await supabase
        .from('plans')
        .select('id, code, duration_days')
        .eq('code', 'TRIAL')
        .single();

      if (planError || !planRow) {
        console.error('Plan fetch error:', planError);
        return NextResponse.json({ error: 'Plan not found' }, { status: 500 });
      }

      // 2️⃣ Calculate end date
      const planEnd = new Date();
      planEnd.setDate(today.getDate() + planRow.duration_days);

      // 3️⃣ Insert client
      const { error } = await supabase
        .from('clients')
        .insert({
          email,
          name,
          
          plan_id: planRow.id,        // 🔥 SINGLE SOURCE OF TRUTH
          plan: planRow.code,         // legacy (optional)
          plan_name: 'Trial',

          subscription_status: 'active',
          plan_start_date: today.toISOString(),
          plan_end_date: planEnd.toISOString(),
          has_used_trial: true
        });

      if (error) {
        console.error('Trial signup failed:', error);
        return NextResponse.json(
          { error: 'Trial signup failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        plan: 'TRIAL'
      });
    }

    // ❌ PAID FLOW PURA REMOVE KARO
    // (Paid signup ab directly frontend/Auth flow se handle hoga via orderId)
    
    return NextResponse.json(
      { error: 'Invalid plan type' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('SIGNUP API ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
