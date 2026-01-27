import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. Get Key & Decode Safely
const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
let serviceRoleKey = b64Key || '';

if (b64Key && !b64Key.startsWith('ey')) {
  try {
    serviceRoleKey = Buffer.from(b64Key, 'base64').toString('utf-8').trim();
  } catch (e) {
    console.error("Failed to decode service key:", e);
  }
}

// 2. Admin Client (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    const { userId, role, newStatus } = await req.json();

    if (!userId || !role || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`API: Updating ${role} (${userId}) to ${newStatus}`);

    // Determine Table
    const table = role === 'treasurer' ? 'clients' : 'members';

    // 3. Update Database (With Admin Privileges)
    const { error: dbError } = await supabaseAdmin
      .from(table)
      .update({ status: newStatus }) // 'active' or 'blocked'
      .eq('id', userId);

    if (dbError) {
      console.error("DB Error:", dbError);
      throw new Error(dbError.message);
    }

    // 4. Force Logout if Blocked
    if (newStatus === 'blocked') {
        if (role === 'treasurer') {
            await supabaseAdmin.auth.admin.signOut(userId);
        } else {
            // For member, find auth_user_id first
            const { data: mem } = await supabaseAdmin
                .from('members')
                .select('auth_user_id')
                .eq('id', userId)
                .single();
                
            if(mem?.auth_user_id) {
                await supabaseAdmin.auth.admin.signOut(mem.auth_user_id);
            }
        }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
