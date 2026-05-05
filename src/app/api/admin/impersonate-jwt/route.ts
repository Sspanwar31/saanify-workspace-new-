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

    // 1. Admin Verification (RLS Bypass)
    const { data: admin } = await supabaseAdmin.from('admins').select('id').eq('id', adminId).single();
    if (!admin) return NextResponse.json({ error: 'Admin validation failed' }, { status: 403 });

    // 2. Client Details
    const { data: client } = await supabaseAdmin.from('clients').select('*').eq('id', clientId).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // 🚀 STEP 3: ASLI FIX - Secret Key ko Buffer mein badlein
    const rawSecret = process.env.SUPABASE_JWT_SECRET;
    if (!rawSecret) throw new Error("JWT Secret missing in ENV");
    
    // Base64 string ko binary bytes (Buffer) mein badalna zaroori hai
    const jwtSecret = Buffer.from(rawSecret, 'base64');

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: 'authenticated',
      role: 'authenticated',
      iat: now,
      exp: now + (60 * 60), // 1 hour
      sub: client.id,
      email: client.email,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { name: client.name },
      client_id: client.id,
      is_impersonating: true
    };

    // 🚀 SIGN WITH HS256 and Binary Secret
    const token = jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });

    return NextResponse.json({ success: true, token, clientData: client });

  } catch (err: any) {
    console.error("JWT API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
