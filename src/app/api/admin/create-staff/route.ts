import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';

// ✅ Admin Client (Bypasses RLS) — FIXED
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  Buffer.from(
    process.env.SUPABASE_SERVICE_ROLE_KEY_B64!, // 👈 tumhari actual key
    'base64'
  ).toString('utf-8')
);

export async function POST(req: Request) {
  try {
    const { email, password, name, phone, clientId } = await req.json();

    // 1. Create Auth User
    const { data: user, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'treasurer' }
      });

    if (authError) throw authError;

    // 2. Insert into 'clients' table as Treasurer
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .insert([{
        id: user.user.id, // Link with Auth ID
        email,
        name,
        phone,
        role: 'treasurer',
        client_id: clientId,
        status: 'ACTIVE',
        plan: 'BASIC',
        role_permissions: {
          treasurer: ["View Dashboard", "View Passbook", "Manage Passbook"]
        }
      }]);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
