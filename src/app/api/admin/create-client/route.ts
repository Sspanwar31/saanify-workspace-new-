import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Required for Buffer

// 🔐 Helper to decode Base64 Service Role Key
const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Fallback
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
      console.error("Config Error: Missing URL or Service Key");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // Initialize Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await req.json();
    const { name, email, password, society_name, phone, plan } = body;

    // Validate Input
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, Email and Password are required" }, { status: 400 });
    }

    // 1. Create Auth User (Email Auto-Confirmed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, society_name }
    });

    if (authError) {
      console.error("Auth Create Error:", authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed internally" }, { status: 500 });
    }

    // 2. Insert into Clients Table
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .insert([{
        id: authData.user.id,      // Must match auth user
        name,
        email,
        society_name: society_name || '',
        phone: phone || '',
        plan: plan || 'TRIAL',
        plan_name: plan || 'Trial',
        plan_start_date: new Date().toISOString(),
        plan_end_date: plan === 'TRIAL'
          ? new Date(Date.now() + 30*24*60*60*1000).toISOString()
          : new Date(Date.now() + 365*24*60*60*1000).toISOString(),
        subscription_status: 'active',
        status: 'ACTIVE',
        is_lifetime: plan === 'LIFETIME',
        created_at: new Date().toISOString(),
        is_deleted: false,
        role: 'client',
        auto_backup: true,
        email_notifications: true,
        sms_notifications: true,
        theme: 'light',
        updated_at: new Date().toISOString(),
        role_permissions: plan === 'TRIAL'
          ? { treasurer: ["View Dashboard","View Passbook","Manage Passbook"] }
          : {} // empty for paid, admin can edit later
      }], { bypassRowLevelSecurity: true }); // ✅ Add this line

    if (dbError) {
       console.error("DB Insert Error:", dbError.message);
       // Rollback: Delete auth user if profile creation fails
       await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
       return NextResponse.json({ error: "Database Profile Error: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authData.user.id });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
