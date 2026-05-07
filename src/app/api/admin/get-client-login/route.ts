import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServiceKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (b64) return b64.startsWith('eyJ') ? b64 : Buffer.from(b64, 'base64').toString().trim();
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
};

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();
    const serviceKey = getServiceKey();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!, {
      auth: { persistSession: false }
    });

    // 1. Admin Token Check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

    // 2. Verify Admin Identity
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });

    // 3. Confirm Admin in DB (Check ID or Email)
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('*')
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (!admin) return NextResponse.json({ error: 'Access denied: Not an admin' }, { status: 403 });

    // 4. Get Client Email
    const { data: client } = await supabaseAdmin.from('clients').select('email').eq('id', clientId).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // 🚀 ASLI STEP: Generate Official Access Link
    // Is link par click karte hi user (Admin) automatically Client bankar login ho jayega
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: { 
        // Login ke baad Dashboard par bhejo aur metadata mein impersonation mark karo
        redirectTo: `${new URL(req.url).origin}/dashboard?impersonate=true` 
      }
    });

    if (linkError) throw linkError;

    return NextResponse.json({
      success: true,
      url: linkData.properties.action_link // Ye asli login link hai
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
