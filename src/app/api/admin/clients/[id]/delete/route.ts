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

    // STEP 1: Helper function ADD karo
    const getServiceRoleKey = () => {
      const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
      if (!b64Key) return null;

      try {
        // ✅ agar already JWT hai to use directly
        if (b64Key.startsWith('eyJ')) return b64Key;

        // ✅ warna decode karo
        return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
      } catch (e) {
        return null;
      }
    };

    // 🔴 STEP 2: PURA key decode logic REMOVE karo (Done)
    
    // 🔴 STEP 3: Replace Supabase init
    const serviceKey = getServiceRoleKey();

    if (!serviceKey) {
      return NextResponse.json({ error: "Service key missing" }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    );

    console.log(`🗑️ Deleting associated data for Client: ${clientId}...`);

    // Helper function removed (safeDelete) because we are using direct awaits now

    // 🔴 STEP 4: IMPORTANT FIX (Direct awaits without error checks)
    await supabaseAdmin.from('notifications').delete().eq('client_id', clientId);
    await supabaseAdmin.from('passbook_entries').delete().eq('client_id', clientId);
    await supabaseAdmin.from('expenses_ledger').delete().eq('client_id', clientId);
    await supabaseAdmin.from('loans').delete().eq('client_id', clientId);
    await supabaseAdmin.from('members').delete().eq('client_id', clientId);
    await supabaseAdmin.from('admin_fund_ledger').delete().eq('client_id', clientId);

    // ✅ STAFF DELETE (Updated to remove safeDelete usage)
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

      // Direct await instead of safeDelete
      await supabaseAdmin
        .from('clients')
        .delete()
        .eq('client_id', clientId)
        .eq('role', 'treasurer');
    }

    // 🔴 STEP 5: FINAL SAFE DELETE (MOST IMPORTANT)
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({
        is_deleted: true,
        status: 'DELETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (dbError) {
      console.error("❌ DB Error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // 🔴 STEP 6: Auth delete (safe mode)
    try {
      await supabaseAdmin.auth.admin.deleteUser(clientId);
    } catch (e) {
      console.warn("Auth delete skipped");
    }

    return NextResponse.json({ success: true, message: "Client deleted successfully" });

  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
