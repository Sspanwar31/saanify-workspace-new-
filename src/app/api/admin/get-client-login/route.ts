import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const getServiceKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (b64) return b64.startsWith('eyJ') ? b64 : Buffer.from(b64, 'base64').toString().trim();
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
};

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();
    const serviceKey = getServiceKey();
    
    // Service Role Client (Bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, serviceKey!, {
      auth: { persistSession: false }
    });

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

    // 1. Get User from Auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });

    console.log("🔍 Looking for Admin:", user.email);

    // 🚀 STEP 2: MULTI-STEP ADMIN SEARCH (Bulletproof)
    let adminData = null;

    // A. Pehle ID se dhoondo (Sabse fast)
    const { data: byId } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    
    adminData = byId;

    // B. Agar ID se nahi mila, toh Email se dhoondo (Case Insensitive)
    if (!adminData) {
      console.log("⚠️ ID match failed, trying Email search...");
      const { data: byEmail } = await supabaseAdmin
        .from('admins')
        .select('*')
        .ilike('email', user.email) // ilike use karein case-insensitivity ke liye
        .maybeSingle();
      
      adminData = byEmail;

      // ✅ SELF-HEALING: Agar email se mil gaya, toh ID link kar do future ke liye
      if (adminData && !adminData.auth_user_id) {
        await supabaseAdmin
          .from('admins')
          .update({ auth_user_id: user.id })
          .eq('id', adminData.id);
        console.log("🛠️ Admin ID Auto-Linked for:", user.email);
      }
    }

    // FINAL CHECK
    if (!adminData) {
      console.error(`❌ DENIED: ${user.email} not found in Admins table`);
      return NextResponse.json({ error: `Access denied: Admin record not found for ${user.email}` }, { status: 403 });
    }

    // 3. Get Target Client
    const { data: client } = await supabaseAdmin.from('clients').select('email').eq('id', clientId).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // 4. Generate Link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: { redirectTo: `${new URL(req.url).origin}/dashboard?impersonate=true` }
    });

    if (linkError) throw linkError;

    console.log("✅ Magic Link Generated for:", client.email);

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
