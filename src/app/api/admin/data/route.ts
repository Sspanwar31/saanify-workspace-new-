import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const { table, clientId } = await req.json();

    if (!table || !clientId) {
      return NextResponse.json({ error: 'Table name and Client ID required' }, { status: 400 });
    }

    // Admin Power se data fetch (RLS Off)
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
