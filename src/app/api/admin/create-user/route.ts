import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-service';

export const runtime = 'nodejs';

// ✅ 1. CORS Headers jo Flutter Web ko allow karenge
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // localhost aur web dono ke liye
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ✅ 2. Handle OPTIONS (Preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    // ✅ 3. Verify Admin Token (Strong Security)
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Yahan Supabase check karega ki token asli hai ya nahi
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized Session" }, { status: 401, headers: corsHeaders });
    }

    // 🛡️ SECURITY LAYER 2: Admin Role Check (Existing Logic)
    const { data: adminCheck } = await supabaseAdmin
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheck?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403, headers: corsHeaders });
    }

    // --- Baki ka logic (createUser aur DB insert) ---
    const body = await req.json();
    const { email, password, name, role, status } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and Password missing" }, { status: 400, headers: corsHeaders });
    }

    // 🚀 STEP 1: CREATE AUTH USER
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (createAuthError) {
      console.error("Supabase Auth Error:", createAuthError.message);
      return NextResponse.json({ error: createAuthError.message }, { status: 400, headers: corsHeaders });
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
    
    // ✅ Har return mein headers zarur jodein
    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Create User Crash:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
