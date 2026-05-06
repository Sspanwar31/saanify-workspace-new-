import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ ENV
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  (process.env.SUPABASE_SERVICE_ROLE_KEY_B64
    ? Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY_B64, 'base64')
        .toString('utf-8')
        .trim()
    : null);

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId required' },
        { status: 400 }
      );
    }

    // ✅ Create Admin Supabase Client (Service Role)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
      auth: {
        persistSession: false,
      },
    });

    // 🔥 STEP 1: Get current user from request (cookie-based session)
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: No auth header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      );
    }

    // 🔥 STEP 2: Verify Admin (email match)
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email')
      .eq('email', user.email)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Access denied: Not an admin' },
        { status: 403 }
      );
    }

    // 🔥 STEP 3: Get Client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, is_deleted')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (client.is_deleted) {
      return NextResponse.json(
        { error: 'Client is deleted' },
        { status: 400 }
      );
    }

    // ✅ FINAL RESPONSE (NO TOKENS)
    return NextResponse.json({
      success: true,
      email: client.email,
      clientId: client.id,
    });

  } catch (err: any) {
    console.error('🔥 API ERROR:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
