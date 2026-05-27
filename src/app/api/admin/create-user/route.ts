import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-service'; 

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, status } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and Password missing" }, { status: 400 });
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
      return NextResponse.json({ error: authError.message }, { status: 400 });
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
      return NextResponse.json({ error: "Auth Created but DB Failed: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Create User Crash:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
