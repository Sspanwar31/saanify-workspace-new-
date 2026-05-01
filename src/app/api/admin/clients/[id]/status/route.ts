import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const { action } = await req.json();

    let newStatus = '';

    if (action === 'LOCK') newStatus = 'LOCKED';
    else if (action === 'EXPIRE') newStatus = 'EXPIRED';
    else if (action === 'ACTIVATE') newStatus = 'ACTIVE';
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('clients')
      .update({ status: newStatus })
      .eq('id', clientId);

    if (error) throw error;

    return NextResponse.json({ success: true, status: newStatus });

  } catch (err: any) {
    console.error("STATUS ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
