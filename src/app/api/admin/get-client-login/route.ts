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

    // 1. Authorization Header Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Token se user nikalen
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid Session or Token' }, { status: 401 });
    }

    // 🚀 STEP 3: ASLI PROBLEM YAHAN HAI (Check multiple columns)
    // Hum check karenge ki user.id match kare YA user.email match kare
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`) 
      .maybeSingle();

    if (!admin) {
      // 🎯 DEBUG LOG: Ye aapke terminal/vercel log mein dikhega
      console.error(`❌ ACCESS DENIED for email: ${user.email} with ID: ${user.id}`);
      return NextResponse.json({ 
        error: `Access denied: ${user.email} is not registered in the admins table.`,
        debugEmail: user.email 
      }, { status: 403 });
    }

    // 4. Get Target Client
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email')
      .eq('id', clientId)
      .single();

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // 5. Official Link Generation
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: { redirectTo: `${new URL(req.url).origin}/dashboard?impersonate=true` }
    });

    if (linkError) throw linkError;

    return NextResponse.json({
      success: true,
      url: linkData.properties.action_link,
      email: client.email
    });

  } catch (err: any) {
    console.error("🔥 API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
