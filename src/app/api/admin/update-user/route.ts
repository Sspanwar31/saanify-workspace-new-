import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-service'; 

export async function POST(req: Request) {
  try {
    const { userId, email, password, name, role, status } = await req.json();

    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    // 🚀 1. ASLI PASSWORD UPDATE (Auth Table mein)
    if (password && password.length >= 6) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: password }
      );
      if (authError) throw authError;
    }

    // 🚀 2. PROFILE UPDATE (Admins Table mein)
    const { error: dbError } = await supabaseAdmin
      .from('admins')
      .update({
        name: name,
        role: role,
        status: status
      })
      .eq('id', userId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Update Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
