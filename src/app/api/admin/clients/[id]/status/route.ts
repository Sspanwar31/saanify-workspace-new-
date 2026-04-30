import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64Key) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  try {
    if (b64Key.startsWith('eyJ')) return b64Key;
    return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
  } catch (e) { return null; }
};

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // ✅ Next.js 15 Type
) {
  try {
    const { id: clientId } = await params; // ✅ Params ko await karna compulsory hai
    const { action } = await req.json();
    const serviceKey = getServiceRoleKey();

    if (!serviceKey || !clientId) {
      return NextResponse.json({ error: "Config or ID Error", success: false }, { status: 500 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    let newStatus = '';
    const cmd = action?.toUpperCase();

    if (cmd === 'LOCK') newStatus = 'LOCKED';
    else if (cmd === 'EXPIRE') newStatus = 'EXPIRED';
    else if (cmd === 'ACTIVATE' || cmd === 'UNLOCK') newStatus = 'ACTIVE';
    else return NextResponse.json({ error: 'Invalid Action', success: false }, { status: 400 });

    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      }) 
      .eq('id', clientId);

    if (dbError) throw dbError;

    // ✅ Hamesha success true bhejien taaki frontend handle kar sake
    return NextResponse.json({ success: true, status: newStatus }, { status: 200 });

  } catch (err: any) {
    console.error("API Crash:", err.message);
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
