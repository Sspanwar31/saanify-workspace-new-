import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// ✅ STEP 1: Decode Service Role Key (B64 Support)
const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

  if (!b64Key) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;

  try {
    if (b64Key.startsWith('eyJ')) return b64Key;

    return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
  } catch (e) {
    console.error('Key decode failed:', e);
    return null;
  }
};

// ✅ ENV
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { clientId, adminId } = await req.json();

    if (!clientId || !adminId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const serviceKey = getServiceRoleKey();

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Service role key missing' },
        { status: 500 }
      );
    }

    // ✅ STEP 2: Supabase Admin (RLS bypass)
    const supabaseAdmin = createClient(SUPABASE_URL, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('👉 JWT IMPERSONATION:', { clientId, adminId });

    // ✅ STEP 3: Verify Admin
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // ✅ STEP 4: Get Client (optional but safe)
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // ✅ STEP 5: JWT Payload (🔥 MOST IMPORTANT)
    const payload = {
      sub: adminId, // 👈 actual admin

      role: 'authenticated',

      // 🔥 RLS CLAIMS
      client_id: clientId,
      is_impersonating: true,

      // optional but useful
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    // ✅ STEP 6: SIGN TOKEN
    const token = jwt.sign(payload, JWT_SECRET);

    console.log('✅ JWT GENERATED');

    return NextResponse.json({
      success: true,
      token,
    });

  } catch (err: any) {
    console.error('🔥 JWT ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
