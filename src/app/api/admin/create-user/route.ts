import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-service';

export const runtime = 'nodejs';

// 🛡️ Preflight request (CORS) handling
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  // CORS Headers - Sabhi responses ke liye
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // 🛡️ SECURITY LAYER 1: Token Verification
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    // Check if token is valid
    const { data: { user }, error: userCheckError } = await supabaseAdmin.auth.getUser(token);
    if (userCheckError || !user) {
      return NextResponse.json({ error: "Invalid Session" }, { status: 401, headers: corsHeaders });
    }

    // 🛡️ SECURITY LAYER 2: Admin Role Check
    const { data: adminCheck } = await supabaseAdmin
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheck?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403, headers: corsHeaders });
    }

    // --- Original Logic (Start) ---
    const body = await req.json();
    const { email, password, name, role, status } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and Password missing" }, { status: 400, headers: corsHeaders });
    }

    // 🚀 STEP 1: CREATE AUTH USER
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError) {
      // Yahan asli wajah pata chalegi (e.g. Email rate limit or already registered)
      console.error("Supabase Auth Error:", authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400, headers: corsHeaders });
    }

    // 🚀 STEP 2: INSERT INTO ADMINS TABLE
    const { error: dbError } = await supabaseAdmin
      .from('admins')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: role || 'SUPPORT',
        status: status || 'ACTIVE'
      });

    if (dbError) {
      return NextResponse.json({ error: "Auth Created but DB Failed: " + dbError.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Create User Crash:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
