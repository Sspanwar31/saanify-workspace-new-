import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const getServiceKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (b64) return b64.startsWith('eyJ') ? b64 : Buffer.from(b64, 'base64').toString('utf-8').trim();
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
};

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();
    const serviceKey = getServiceKey();
    
    // Service Role Client (Bypasses RLS & All Checks)
    const supabaseAdmin = createClient(SUPABASE_URL, serviceKey!, {
      auth: { persistSession: false }
    });

    // 1. Get Admin's Token from Headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Token ki validity check karein
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });

    // 🚀 STEP 3: DIRECT CLIENT FETCH
    // Hum seedha target client ka email nikalenge 'clients' table se
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('email')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: 'Target Client not found' }, { status: 404 });
    }

    // 🚀 STEP 4: OFFICIAL MAGIC LINK GENERATION
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: { 
        redirectTo: `${new URL(req.url).origin}/dashboard?impersonate=true` 
      }
    });

    if (linkError) throw linkError;

    return NextResponse.json({
      success: true,
      url: linkData.properties.action_link,
      email: client.email
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
