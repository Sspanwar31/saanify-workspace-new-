import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Admin Client (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    const { email, password, name, role } = await req.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, password, name, role' }, { status: 400 });
    }

    // Step 1: Create user in Supabase Auth (encrypted password)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    });

    if (authError) {
      console.error("Auth User Creation Error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Step 2: Insert profile into public.admins table (NO password stored)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('admins')
      .insert([{
        id: authData.user.id,
        email,
        name,
        role,
        status: 'ACTIVE'
      }])
      .select()
      .single();

    if (profileError) {
      console.error("Profile Creation Error:", profileError);
      // Try to clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Secure Admin Created',
      data: {
        id: authData.user.id,
        email,
        name,
        role
      }
    });

  } catch (error: any) {
    console.error("Create Admin Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}