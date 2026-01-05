import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Power Client (RLS Bypass)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B64 
    ? Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY_B64, 'base64').toString('utf-8')
    : process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, amount, remaining_balance, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Loan ID missing' }, { status: 400 });
    }

    // Direct Update
    const { data, error } = await supabaseAdmin
      .from('loans')
      .update({
        amount: Number(amount),
        remaining_balance: Number(remaining_balance),
        status: status
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Loan Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
