import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Admin Client (Bypasses RLS)
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
    const { userId, role, newStatus } = await req.json();

    if (!userId || !role || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`API: Updating ${role} (${userId}) to ${newStatus}`);

    // Determine Table
    const table = role === 'treasurer' ? 'clients' : 'members';

    // 1. Update Database (With Admin Privileges)
    const { error: dbError } = await supabaseAdmin
      .from(table)
      .update({ status: newStatus }) // e.g. 'active' or 'blocked'
      .eq('id', userId);

    if (dbError) {
      console.error("DB Error:", dbError);
      throw new Error(dbError.message);
    }

    // 2. Force Logout if Blocked (Optional but good)
    if (newStatus === 'blocked') {
        // If user is linked to auth, try to sign them out
        // Note: For members, we need their auth_user_id. 
        // This is a "nice to have", main job is DB update.
        if (role === 'treasurer') {
            await supabaseAdmin.auth.admin.signOut(userId);
        } else {
            // Fetch auth_id for member
            const { data: mem } = await supabaseAdmin.from('members').select('auth_user_id').eq('id', userId).single();
            if(mem?.auth_user_id) await supabaseAdmin.auth.admin.signOut(mem.auth_user_id);
        }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
