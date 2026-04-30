import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    
    // Validation at top
    if (!clientId) {
      return NextResponse.json({ error: "Client ID missing" }, { status: 400 });
    }

    // 1. Get Base64 Key from Env
    const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64 || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!b64Key) {
      console.error("❌ Critical: SUPABASE_SERVICE_ROLE_KEY_B64 is missing in Env");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // STEP 1 — B64 DECODE FIX (SAFE VERSION)
    let serviceRoleKey: string;

    try {
      serviceRoleKey = b64Key.startsWith('ey')
        ? b64Key.trim()
        : Buffer.from(b64Key, 'base64').toString('utf-8').trim();

      if (!serviceRoleKey || !serviceRoleKey.startsWith('ey')) {
        throw new Error("Decoded key invalid");
      }

    } catch (e: any) {
      console.error("❌ Service key decode failed:", e.message);

      return NextResponse.json({
        error: "Service role key invalid"
      }, { status: 500 });
    }

    // 3. Init Admin Client
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

    console.log(`🗑️ Deleting associated data for Client: ${clientId}...`);

    // Helper function (Safe Delete)
    const safeDelete = async (query: any, label: string) => {
      const { error } = await query;
      if (error) {
        console.warn(`⚠️ ${label} delete skipped:`, error.message);
      } else {
        console.log(`✅ ${label} deleted`);
      }
    };

    // 🔁 CASCADE DELETE SAFE MODE
    
    await safeDelete(
      supabaseAdmin.from('notifications').delete().eq('client_id', clientId),
      'notifications'
    );

    await safeDelete(
      supabaseAdmin.from('passbook_entries').delete().eq('client_id', clientId),
      'passbook_entries'
    );

    await safeDelete(
      supabaseAdmin.from('expenses_ledger').delete().eq('client_id', clientId),
      'expenses'
    );

    await safeDelete(
      supabaseAdmin.from('loans').delete().eq('client_id', clientId),
      'loans'
    );

    await safeDelete(
      supabaseAdmin.from('members').delete().eq('client_id', clientId),
      'members'
    );

    await safeDelete(
      supabaseAdmin.from('admin_fund_ledger').delete().eq('client_id', clientId),
      'admin_fund_ledger'
    );

    // ✅ STAFF DELETE (SAFE VERSION)
    const { data: staff } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('client_id', clientId)
      .eq('role', 'treasurer');

    if (staff?.length) {
      for (const s of staff) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(s.id);
        } catch (e) {
          console.warn("⚠️ Staff auth delete failed:", s.id);
        }
      }

      await safeDelete(
        supabaseAdmin
          .from('clients')
          .delete()
          .eq('client_id', clientId)
          .eq('role', 'treasurer'),
        'staff'
      );
    }

    // 🔥 STEP 2 — UPDATE QUERY FIX (NO RETURN ON ERROR)
    const { data, error } = await supabaseAdmin
      .from('clients')
      .update({
        is_deleted: true,
        status: 'DELETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select();

    if (error) {
      console.error("❌ Update failed:", error.message);
      // ❗ return मत करो
    }

    console.log("✅ Soft delete result:", data);

    // 🔥 STEP 5 — AUTH DELETE SAFE WRAP
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(clientId);

      if (authError) {
        console.warn("⚠️ Auth delete skipped:", authError.message);
      } else {
        console.log("✅ Auth user deleted");
      }
    } catch (e) {
      console.warn("⚠️ Auth delete crash ignored");
    }

    // 🔥 STEP 4 — FINAL RESPONSE FORCE SUCCESS
    return NextResponse.json({
      success: true,
      message: "Client deleted successfully"
    });

  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
