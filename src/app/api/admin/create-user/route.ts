import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// 🔐 Helper to decode your specific B64 key
const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return null;
  return Buffer.from(b64, 'base64').toString('utf-8').trim();
};

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = getServiceRoleKey();

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server Config Error: Missing B64 Key" }, { status: 500 });
    }

    // Initialize Admin Client with DECODED key
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await req.json();
    const { email, password, name, role, status } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and Password required" }, { status: 400 });
    }

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }

    // 2. Insert into Public Table
    const { error: dbError } = await supabaseAdmin
      .from('admins')
      .insert([{
        id: authData.user.id,
        email,
        name,
        role: role || 'SUPPORT',
        status: status || 'ACTIVE'
      }]);

    if (dbError) {
      // Rollback auth user if DB fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authData.user.id });

  } catch (error: any) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}