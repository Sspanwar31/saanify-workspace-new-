import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  return b64.startsWith('eyJ') ? b64 : Buffer.from(b64, 'base64').toString().trim();
};

export async function POST(req: NextRequest) {
  try {
    const { clientId, adminId } = await req.json();
    const serviceKey = getServiceRoleKey();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!);

    // 1. Client Details Fetch
    const { data: client } = await supabaseAdmin.from('clients').select('*').eq('id', clientId).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // 🚀 ASLI BADLAV: Secret ko as a PLAIN STRING use karein
    const jwtSecret = process.env.SUPABASE_JWT_SECRET; 
    if (!jwtSecret) throw new Error("JWT Secret missing in ENV");

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: 'authenticated',
      iss: 'supabase',
      iat: now,
      exp: now + (60 * 60 * 24), // 24 hours expiry (Safe side)
      sub: client.id,           // User UUID
      email: client.email,
      role: 'authenticated',
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        name: client.name || '',
      },
      // Aapke custom claims
      client_id: client.id,
      is_impersonating: true
    };

    // 🚀 SIGN WITH PLAIN STRING (Algorithm HS256)
    // typ: 'JWT' header mein hona zaroori hai
    const token = jwt.sign(payload, jwtSecret, { 
      algorithm: 'HS256',
      header: { typ: 'JWT', alg: 'HS256' }
    });

    return NextResponse.json({ success: true, token, clientData: client });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
