import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    
    // ✅ BONUS FIX (RECOMMENDED): Validation at top
    if (!clientId) {
      return NextResponse.json({ error: "Client ID missing" }, { status: 400 });
    }

    // 1. Get Base64 Key from Env
    const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64 || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!b64Key) {
      console.error("❌ Critical: SUPABASE_SERVICE_ROLE_KEY_B64 is missing in Env");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. Decode Key
    let serviceRoleKey = b64Key;
    if (!b64Key.startsWith('ey')) {
       try {
           serviceRoleKey = Buffer.from(b64Key, 'base64').toString('utf-8').trim();
       } catch (e) {
           console.error("❌ Key Decoding Failed:", e);
           return NextResponse.json({ error: "Invalid Key Format" }, { status: 500 });
       }
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

    // ✅ CLIENT SOFT DELETE (IMPORTANT CHECK ADD)
    const { error: dbError, data } = await supabaseAdmin
      .from('clients')
      .update({
        is_deleted: true,
        status: 'DELETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select();

    if (dbError || !data?.length) {
      return NextResponse.json({
        error: "Client not found or update failed"
      }, { status: 400 });
    }

    // 6. Delete Client from Auth (Login Access Cleanup)
    // ✅ FIX (SAFE MODE): Try-catch wrap to prevent 500 error
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(clientId);
      if (authError) {
        console.warn("⚠️ Auth delete skipped:", authError.message);
      } else {
        console.log("✅ Auth User Deleted Successfully");
      }
    } catch (e) {
      console.warn("⚠️ Auth delete crash ignored");
    }

    return NextResponse.json({ success: true, message: "Client Soft Deleted Successfully" });

  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
