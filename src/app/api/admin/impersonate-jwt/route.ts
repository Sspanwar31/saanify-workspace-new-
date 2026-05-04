import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  try {
    if (b64.startsWith('eyJ')) return b64;
    return Buffer.from(b64, 'base64').toString('utf-8').trim();
  } catch (e) { return null; }
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!; // 👈 Pakka karein ye Dashboard -> API settings se sahi hai

export async function POST(req: NextRequest) {
  try {
    const { clientId, adminId } = await req.json();
    const serviceKey = getServiceRoleKey();
    const supabaseAdmin = createClient(SUPABASE_URL, serviceKey!);

    // 1. Verify Admin
    const { data: admin } = await supabaseAdmin.from('admins').select('id, email').eq('id', adminId).single();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // 2. Get Client Details
    const { data: client } = await supabaseAdmin.from('clients').select('*').eq('id', clientId).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // 🚀 STEP 3: STANDARD SUPABASE JWT PAYLOAD
    // 406 error se bachne ke liye ye saare claims zaroori hain
    const payload = {
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 Hour
      sub: client.id, // User's UUID
      email: client.email,
      role: 'authenticated',
      // Standard Supabase structure
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        name: client.name,
        society_name: client.society_name
      },
      // 🔥 YOUR CUSTOM CLAIMS FOR RLS
      client_id: client.id,
      is_impersonating: true,
      admin_id: adminId
    };

    // 4. Sign Token
    const token = jwt.sign(payload, JWT_SECRET);

    return NextResponse.json({
      success: true,
      token,
      clientData: client
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
