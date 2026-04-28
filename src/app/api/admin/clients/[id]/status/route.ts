import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64Key) return null;
  try {
    if (b64Key.startsWith('eyJ')) return b64Key;
    return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
  } catch (e) { return null; }
};

export async function POST(req: NextRequest, context: any) {
  const params = await context.params; 
  const clientId = params?.id;

  try {
    const { action } = await req.json();
    const serviceKey = getServiceRoleKey();

    if (!serviceKey || !clientId) {
      return NextResponse.json({ error: "Config Error" }, { status: 500 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    // ✅ NAYA LOGIC: Sirf 'status' badlega
    let newStatus = '';
    const cmd = action?.toUpperCase();

    if (cmd === 'LOCK') {
      newStatus = 'LOCKED';
    } else if (cmd === 'EXPIRE') {
      newStatus = 'EXPIRED';
    } else if (cmd === 'ACTIVATE' || cmd === 'UNLOCK') {
      newStatus = 'ACTIVE';
    } else {
      return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    }

    // 🚀 DB UPDATE: Sirf status column update hoga
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({ status: newStatus }) 
      .eq('id', clientId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, status: newStatus }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
