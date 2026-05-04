import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// ✅ STEP 1: Decode Service Role Key (B64 Support)
// Note: Function kept but not used in this refactored endpoint
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

    console.log('👉 JWT IMPERSONATION:', { clientId, adminId });

    // ✅ STEP 1: JWT Payload (MOVED UP)
    const payload = {
      sub: adminId, 
      role: 'authenticated',
      // 🔥 RLS CLAIMS
      client_id: clientId,
      is_impersonating: true,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    // ✅ STEP 2: SIGN TOKEN (MOVED UP)
    const token = jwt.sign(payload, JWT_SECRET);
    console.log('✅ JWT GENERATED');

    // ✅ GET SERVICE ROLE KEY (B64 SUPPORT)
    const serviceKey = getServiceRoleKey();

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Service role key missing' },
        { status: 500 }
      );
    }

    // ✅ USE SERVICE ROLE (NO JWT HERE)
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // ✅ STEP 4: Verify Admin (DIRECT TABLE CHECK - NO AUTH)
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Invalid admin user' },
        { status: 403 }
      );
    }

    const adminEmail = admin.email;
    console.log("ADMIN VERIFIED:", adminEmail);

    // ✅ STEP 5: Get Client (Direct Query)
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      token,
    });

  } catch (err: any) {
    console.error('🔥 JWT ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
