import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ STEP 1: Service Role Key Decoder (RLS Bypass karne ke liye)
const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!b64Key && !rawKey) return null;

  try {
    // Agar key B64 mein hai toh decode karein, warna raw use karein
    if (b64Key) {
      if (b64Key.startsWith('eyJ')) return b64Key;
      return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
    }
    return rawKey;
  } catch (e) {
    return rawKey;
  }
};

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();
    const serviceKey = getServiceRoleKey();

    if (!serviceKey) {
      return NextResponse.json({ error: "Server Configuration Error (Key Missing)" }, { status: 500 });
    }

    // ✅ STEP 2: Initialize Supabase Admin (Admin powers enabled)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log("👉 IMPERSONATE REQUEST FOR:", clientId);

    // ✅ 3. Client ka asli Email fetch karein
    const { data: client, error: dbError } = await supabaseAdmin
      .from('clients')
      .select('id, email, name')
      .eq('id', clientId)
      .maybeSingle();

    if (dbError || !client?.email) {
      console.error("❌ CLIENT NOT FOUND:", dbError?.message);
      return NextResponse.json({ error: 'Client record or email missing' }, { status: 404 });
    }

    // ✅ 4. Magic Link Generate karein
    // Note: redirectTo mein wahi URL dein jahan Admin ko bhejna hai
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: {
        redirectTo: `${new URL(req.url).origin}/dashboard` // Dashboard par redirect karega
      }
    });

    if (linkError) {
      console.error("❌ MAGIC LINK GENERATION FAILED:", linkError.message);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    console.log("✅ ACCESS LINK GENERATED FOR:", client.email);

    // Magic link ka action_link wapas bhejien
    return NextResponse.json({
      success: true,
      url: data.properties.action_link,
      clientName: client.name
    });

  } catch (err: any) {
    console.error("❌ CRITICAL IMPERSONATE ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
