import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  return b64.startsWith('eyJ') ? b64 : Buffer.from(b64, 'base64').toString().trim();
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const { action } = await req.json();
    const serviceKey = getServiceRoleKey();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!);

    let newStatus = '';
    const cmd = action?.toUpperCase();
    if (cmd === 'LOCK') newStatus = 'LOCKED';
    else if (cmd === 'EXPIRE') newStatus = 'EXPIRED';
    else if (cmd === 'ACTIVATE' || cmd === 'UNLOCK') newStatus = 'ACTIVE';
    else return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    const { error } = await supabaseAdmin.from('clients').update({ status: newStatus }).eq('id', clientId);
    if (error) throw error;

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
