import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Required for Buffer

// 🔐 Helper to decode the Base64 Service Role Key (CRITICAL FIX)
const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) {
    // Fallback to standard key if B64 is missing (though B64 is preferred)
    return process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
  }
  try {
    return Buffer.from(b64, 'base64').toString('utf-8').trim();
  } catch (e) {
    console.error("Key Decoding Failed", e);
    return '';
  }
};

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = getServiceRoleKey();

    if (!supabaseUrl || !serviceKey) {
      console.error("Config Error: Missing URL or Decoded Service Key");
      return NextResponse.json({ error: "Server Configuration Error: Key Missing" }, { status: 500 });
    }

    // Initialize Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await req.json();
    const { name, email, phone, father_name, address, join_date, status, client_id } = body;

    if (!client_id) {
        return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // 1. Create Auth User for Member
    // Use dummy email if not provided: phone@society.com
    const memberEmail = email || `${phone}@temp.saanify.com`;
    const memberPassword = phone || '123456'; 

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: memberEmail,
        password: memberPassword,
        email_confirm: true,
        user_metadata: { name, role: 'MEMBER' }
    });

    if (authError) {
        // If user already exists, we might still want to add them to the members table
        // But for now, return error to keep it simple
        return NextResponse.json({ error: "Auth Error: " + authError.message }, { status: 400 });
    }

    // 2. Insert into Public Members Table
    const { data, error: dbError } = await supabaseAdmin
        .from('members')
        .insert([{
            client_id,
            auth_user_id: authData.user.id,
            name,
            email: memberEmail,
            phone,
            father_name,
            address,
            join_date,
            status
        }])
        .select();

    if (dbError) {
        // Rollback: Delete auth user if DB insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Add Member Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}