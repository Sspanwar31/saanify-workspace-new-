import { NextResponse } from 'next/server';
// ✅ 1. Master Admin Singleton import karein
import { supabaseAdmin } from '@/lib/supabase-service'; 

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, status } = body;

    // 🚀 2. VALIDATION (Website se aaye huye data ko check karein)
    if (!email || !password) {
      return NextResponse.json({ error: "Email and Password are required" }, { status: 400 });
    }

    console.log(`🚀 Creating New Admin: ${email}`);

    // 🚀 3. CREATE AUTH USER (Supabase Auth mein login banayein)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Direct confirm taaki turant login ho sake
      user_metadata: { name: name, role: role }
    });

    if (authError) {
      console.error("❌ Auth Creation Failed:", authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 🚀 4. INSERT INTO ADMINS TABLE (Database mein entry karein)
    const { error: dbError } = await supabaseAdmin
      .from('admins')
      .insert({
        id: authUser.user.id, // Auth ki ID aur Table ki ID match honi chahiye
        email: email,
        name: name,
        role: role || 'SUPPORT',
        status: status || 'ACTIVE',
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error("❌ Database Entry Failed:", dbError.message);
      // Agar table mein fail ho jaye, toh auth user ko delete kar dena chahiye (optional cleanup)
      return NextResponse.json({ error: "Auth created but DB entry failed: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Admin User Created Successfully! 🎉" 
    });

  } catch (error: any) {
    console.error("🔥 Global API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
