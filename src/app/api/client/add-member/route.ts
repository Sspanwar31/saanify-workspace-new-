import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() 
        : (process.env.SUPABASE_SERVICE_ROLE_KEY_B64 
            ? Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY_B64, 'base64').toString('utf-8').trim() 
            : '');

    if (!serviceKey) return NextResponse.json({ error: "Server Config Error" }, { status: 500 });

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await req.json();
    const { name, email, phone, father_name, address, join_date, status, client_id } = body;

    // 1. Create Auth User for Member (So they can login later)
    // Use email if provided, else dummy email based on phone
    const memberEmail = email || `${phone}@society.com`;
    const memberPassword = phone || '123456'; // Default password is phone number

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: memberEmail,
        password: memberPassword,
        email_confirm: true,
        user_metadata: { name, role: 'MEMBER' }
    });

    if (authError) {
        return NextResponse.json({ error: "Member Auth Error: " + authError.message }, { status: 400 });
    }

    // 2. Insert into Members Table
    const { data, error: dbError } = await supabaseAdmin
        .from('members')
        .insert([{
            client_id, // Link to the Society Admin
            auth_user_id: authData.user.id, // Link to their own Login
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
        // Rollback Auth if DB fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}