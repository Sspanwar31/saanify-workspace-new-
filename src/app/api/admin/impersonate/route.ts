import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ STEP 1: Helper function to decode Service Role Key correctly
const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64Key) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;

  try {
    // Agar key pehle se JWT (eyJ...) hai to direct return karein
    if (b64Key.startsWith('eyJ')) return b64Key;
    // Warna Base64 se decode karein
    return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
  } catch (e) {
    console.error("Key decoding failed:", e);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    // ✅ CHANGE 1: Extract only clientId
    const { clientId } = await req.json();
    const serviceKey = getServiceRoleKey();

    if (!serviceKey) {
      return NextResponse.json({ error: "Server Config Error: Admin Key Missing" }, { status: 500 });
    }

    // ✅ STEP 2: Initialize Supabase Admin with Bypass Settings
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false // Server par session save na karein
        }
      }
    );

    console.log("👉 ADMIN ACCESS REQUEST FOR CLIENT:", clientId);

    // ✅ 3. Get client email (Bypassing RLS with Service Key)
    const { data: client, error: dbError } = await supabaseAdmin
      .from('clients')
      .select('id, email')
      .eq('id', clientId)
      .maybeSingle();

    if (dbError) {
      console.error("❌ DATABASE ERROR:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!client || !client.email) {
      console.error("❌ CLIENT NOT FOUND:", clientId);
      return NextResponse.json({ error: 'Client record or email missing' }, { status: 404 });
    }

    console.log("✅ FOUND EMAIL:", client.email);

    // ✅ 4. Generate Admin Magic Link
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: {
        // Dashboard par redirect karein login ke baad
        redirectTo: `${new URL(req.url).origin}/dashboard`
      }
    });

    if (linkError) {
      console.error("❌ MAGIC LINK ERROR:", linkError.message);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    console.log("✅ ACCESS LINK GENERATED SUCCESSFULLY");

    // ✅ Create response object
    const response = NextResponse.json({
      success: true,
      url: data.properties.action_link,
    });

    // ✅ CHANGE 2 & 3: Add new cookies
    response.cookies.set('impersonation_active', 'true', {
      path: '/',
      httpOnly: false,
    });

    response.cookies.set('impersonated_client_id', clientId, {
      path: '/',
      httpOnly: false,
    });

    return response;

  } catch (err: any) {
    console.error("🔥 CRITICAL API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
