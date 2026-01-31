import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // 1. Get Base64 Key from Env
    const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

    if (!b64Key) {
      console.error("❌ Critical: SUPABASE_SERVICE_ROLE_KEY_B64 is missing in Env");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. Decode the Key
    let serviceRoleKey;
    try {
        serviceRoleKey = Buffer.from(b64Key, 'base64').toString('utf-8').trim();
    } catch (e) {
        console.error("❌ Key Decoding Failed:", e);
        return NextResponse.json({ error: "Invalid Key Format" }, { status: 500 });
    }

    // 3. Init Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey, // ✅ Decoded Key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log(`🗑️ Hard Deleting Client: ${userId}`);

    // 4. Delete from 'clients' table first (Data Cleanup)
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', userId);

    if (dbError) {
      console.error("DB Delete Error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // 5. Delete from Auth (Login Access Cleanup)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.warn("Auth Delete Warning (User might already be gone):", authError.message);
    } else {
      console.log("✅ Auth User Deleted Successfully");
    }

    return NextResponse.json({ success: true, message: "Client Hard Deleted" });

  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
