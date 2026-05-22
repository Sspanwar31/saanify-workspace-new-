import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ 1. Robust Key Handler (B64 support)
const getServiceKey = () => {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const envKeyB64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

  let keyToUse = envKeyB64 || envKey || '';
  if (!keyToUse) return '';

  if (keyToUse.startsWith('eyJ')) return keyToUse;

  try {
    // Standard Base64 decoding
    return Buffer.from(keyToUse, 'base64').toString('utf-8').trim();
  } catch (e) {
    return keyToUse;
  }
};

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();
    if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 });

    const serviceKey = getServiceKey();
    if (!serviceKey) return NextResponse.json({ error: 'Config Error' }, { status: 500 });

    // ✅ NORMAL AUTH CLIENT (JWT VERIFY)
    const supabaseAuth = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // ✅ SERVICE ROLE CLIENT
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // 3. Verify Admin Session
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      data: { user: adminAuthUser },
      error: adminError
    } = await supabaseAuth.auth.getUser(token);
    
    if (adminError || !adminAuthUser) return NextResponse.json({ error: 'Invalid Admin Session' }, { status: 401 });

    // ✅ ADDED LOGS HERE
    console.log("AUTH HEADER:", token?.slice(0, 30));
    console.log("TOKEN USER:", adminAuthUser?.id);
    console.log("TOKEN EMAIL:", adminAuthUser?.email);

    // 4. Double Check in Admins Table (Security)
    const { data: adminRecord } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', adminAuthUser.id)
      .maybeSingle();

    if (!adminRecord) return NextResponse.json({ error: 'Access Denied: Not an admin' }, { status: 403 });

    // 5. Get Target Client Email from Clients Table
    const { data: clientData } = await supabaseAdmin
      .from('clients')
      .select('email')
      .eq('id', clientId)
      .single();

    if (!clientData?.email) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // --- ✅ ADDED LOG BLOCK 1 START ---
    console.log("=================================");
    console.log("START IMPERSONATION");
    console.log("TARGET CLIENT ID:", clientId);
    console.log("TARGET CLIENT EMAIL:", clientData.email);
    console.log("ADMIN USER:", adminAuthUser.email);
    console.log("=================================");
    // --- ✅ ADDED LOG BLOCK 1 END ---

    // 🚀 6. Generate Official Magic Link
    // URL ko dynamic rakhen taaki localhost aur production dono par chale
    const origin = new URL(req.url).origin;
    
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: clientData.email,
        options: {
          redirectTo: `${origin}/dashboard?impersonate=true`
        }
      });

    // --- ✅ ADDED LOG BLOCK 2 START ---
    console.log("=========== MAGIC LINK DEBUG ===========");
    console.log("LINK GENERATED FOR:", clientData.email);
    console.log("ACTION LINK:", linkData?.properties?.action_link);
    console.log("========================================");
    // --- ✅ ADDED LOG BLOCK 2 END ---

    console.log("LINK DATA:", linkData);
    console.log("LINK ERROR:", linkError);

    if (linkError) {
      return NextResponse.json(
        {
          error: linkError.message,
          details: linkError
        },
        { status: 500 }
      );
    }

    if (!linkData?.properties?.action_link) {
      return NextResponse.json(
        {
          error: 'Magic link generation failed',
          data: linkData
        },
        { status: 500 }
      );
    }

    // ✅ FIX 2: Response object create karein, direct return nahi
    const response = NextResponse.json({
      success: true,
      url: linkData.properties.action_link,
      email: clientData.email
    });

    // ✅ FIX 1: New Impersonation Cookies set karein
    response.cookies.set('impersonation_active', 'true', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    response.cookies.set('impersonated_client_id', clientId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return response;

  } catch (error: any) {
    console.error("🔥 API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
