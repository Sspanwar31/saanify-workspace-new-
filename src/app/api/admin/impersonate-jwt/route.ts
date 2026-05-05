import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// ✅ STEP 1: Service Role Key Decoder (B64 support)
const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64Key) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  try {
    if (b64Key.startsWith('eyJ')) return b64Key;
    return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
  } catch (e) { return null; }
};

// ✅ STEP 2: JWT Secret Decoder (Standard & URL Safe Base64)
const getJwtSecret = () => {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  // Agar secret pehle se decode ho chuka hai (plain string), toh buffer banayein
  // Agar Base64 hai (jisne == hai), toh usey bytes mein badlein
  try {
    return Buffer.from(secret, 'base64');
  } catch (e) {
    return Buffer.from(secret); // Fallback to plain string buffer
  }
};

export async function POST(req: NextRequest) {
  try {
    const { clientId, adminId } = await req.json();
    const serviceKey = getServiceRoleKey();
    const jwtSecret = getJwtSecret();

    if (!serviceKey || !jwtSecret) {
      return NextResponse.json({ error: "Server Key Configuration Error" }, { status: 500 });
    }

    // 🚀 STEP 3: Admin Bypass Client (Using Service Role)
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    // 1. Get Client Details (Ensuring they exist in auth and clients table)
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: 'Client record not found' }, { status: 404 });
    }

    // 🚀 STEP 4: Payload Strict Synchronization
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: 'authenticated',           // 👈 Required by Supabase
      iss: 'supabase',                // 👈 Required by Supabase
      iat: now,
      exp: now + (60 * 60),           // 1 hour expiry
      sub: client.id,                 // 👈 Must be the UUID from auth.users
      email: client.email,
      role: 'authenticated',          // 👈 Required for RLS bypass
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        name: client.name,
      },
      // Your Custom Claims
      client_id: client.id,
      is_impersonating: true,
      admin_id: adminId
    };

    // 🚀 STEP 5: Signing (HS256 with Decoded Buffer)
    // jsonwebtoken library automatic 'base64url' handle kar legi agar hum Buffer bhejenge
    const token = jwt.sign(payload, jwtSecret, { 
      algorithm: 'HS256',
      noTimestamp: false 
    });

    console.log("✅ JWT Successfully signed for Client:", client.email);

    return NextResponse.json({
      success: true,
      token,
      clientData: client
    });

  } catch (err: any) {
    console.error("🔥 Impersonation API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
