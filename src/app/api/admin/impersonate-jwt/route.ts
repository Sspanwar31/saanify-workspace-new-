import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// ✅ STEP 1: Secret Key ko Decode karne ka function
const getJwtSecret = () => {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  // Agar secret Base64 hai (jaise aapne dikhaya), toh usey Buffer mein badalna zaroori hai
  // Supabase HS256 hamesha decoded bytes maangta hai
  return Buffer.from(secret, 'base64'); 
};

const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  return b64.startsWith('eyJ') ? b64 : Buffer.from(b64, 'base64').toString().trim();
};

export async function POST(req: NextRequest) {
  try {
    const { clientId, adminId } = await req.json();
    const serviceKey = getServiceRoleKey();
    const jwtSecret = getJwtSecret();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!);

    if (!jwtSecret || !serviceKey) {
       return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 1. Verify Admin
    const { data: admin } = await supabaseAdmin.from('admins').select('id, email').eq('id', adminId).single();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // 2. Get Client Details
    const { data: client } = await supabaseAdmin.from('clients').select('*').eq('id', clientId).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // 🚀 STEP 3: CONSTRUCT PAYLOAD (Strict Supabase Format with iat)
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: 'authenticated',
      role: 'authenticated', 
      iat: now, // Issued At
      exp: now + (60 * 60), // 1 Hour
      sub: client.id,
      email: client.email,
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        name: client.name,
        society_name: client.society_name
      },
      client_id: client.id,
      is_impersonating: true,
      admin_id: adminId
    };

    // 🚀 STEP 4: SIGN WITH HS256 AND DECODED SECRET
    const token = jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });

    return NextResponse.json({
      success: true,
      token,
      clientData: client
    });

  } catch (err: any) {
    console.error("🔥 Impersonate API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
