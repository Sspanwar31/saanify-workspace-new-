import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-service';

export const runtime = 'nodejs';

// 🛡️ CORS Headers taaki Flutter Web block na ho
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, password, name, role, status } = body;

    // 🚀 LOGIC 1: AGAR USER_ID NAHI HAI -> NAYA CREATE KARO
    if (!userId) {
      if (!email || !password) {
        return NextResponse.json({ error: "Email/Password missing" }, { status: 400, headers: corsHeaders });
      }

      // 1. Auth Account banayein
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role }
      });

      if (authError) return NextResponse.json({ error: authError.message }, { status: 400, headers: corsHeaders });

      // 2. Admin Table mein entry karein
      const { error: dbError } = await supabaseAdmin.from('admins').insert({
        id: authData.user.id,
        email,
        name,
        role: role || 'SUPPORT',
        status: status || 'ACTIVE'
      });

      if (dbError) throw dbError;

      return NextResponse.json({ success: true, message: "Admin Created" }, { headers: corsHeaders });
    }

    // 🚀 LOGIC 2: AGAR USER_ID HAI -> UPDATE KARO
    else {
      // 1. Password update (agar box bhara hai)
      if (password && password.length >= 6) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        if (authError) return NextResponse.json({ error: authError.message }, { status: 400, headers: corsHeaders });
      }

      // 2. Profile update
      const { error: dbError } = await supabaseAdmin
        .from('admins')
        .update({ name, role, status })
        .eq('id', userId);

      if (dbError) throw dbError;

      return NextResponse.json({ success: true, message: "Admin Updated" }, { headers: corsHeaders });
    }

  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
