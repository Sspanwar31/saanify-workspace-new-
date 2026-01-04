import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role Key (Super Admin Access)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B64 
    ? Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY_B64, 'base64').toString('utf-8')
    : process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { table, clientId } = await req.json();

    if (!table || !clientId) {
      return NextResponse.json({ error: 'Table & ClientID required' }, { status: 400 });
    }

    // Admin Power: Fetch data without RLS
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('client_id', clientId);

    if (error) throw error;

    return NextResponse.json({ data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
