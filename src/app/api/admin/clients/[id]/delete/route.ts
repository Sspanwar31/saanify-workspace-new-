import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ Step 1: Params ab ek Promise hai
) {
  try {
    // ✅ Step 2: Params ko await karein (Next.js 15 fix)
    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json({ error: "Client ID missing" }, { status: 400 });
    }

    // ✅ Step 3: Service Role Key Logic (Bulletproof)
    const getServiceKey = () => {
      const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
      if (!b64Key) return process.env.SUPABASE_SERVICE_ROLE_KEY; // Fallback to raw key

      try {
        if (b64Key.startsWith('eyJ')) return b64Key;
        return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
      } catch (e) {
        return b64Key;
      }
    };

    const serviceKey = getServiceKey();
    if (!serviceKey) {
      return NextResponse.json({ error: "Server Configuration Error: Key Missing" }, { status: 500 });
    }

    // ✅ Step 4: Supabase Admin Init (RLS bypass karne ke liye)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log(`🗑️ Starting deletion for Client ID: ${clientId}`);

    // ✅ Step 5: Related Tables Cleanup
    // Note: 'client_id' column un tables mein hota hai jo client se judi hain
    const tablesToClean = [
      'notifications', 'passbook_entries', 'expenses_ledger', 
      'loans', 'members', 'admin_fund_ledger'
    ];

    for (const table of tablesToClean) {
      await supabaseAdmin.from(table).delete().eq('client_id', clientId);
    }

    // ✅ Step 6: Delete Staff (Treasurers/Assistants)
    const { data: staff } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('client_id', clientId); // Woh users jinka owner ye clientId hai

    if (staff && staff.length > 0) {
      for (const s of staff) {
        await supabaseAdmin.auth.admin.deleteUser(s.id).catch(() => null);
      }
      // Delete staff records from clients table
      await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
    }

    // ✅ Step 7: SOFT DELETE Main Client (Asli Fix Yahan Hai)
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({
        is_deleted: true,
        status: 'DELETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId); // Yahan clientId ab sahi string hai

    if (dbError) {
      console.error("❌ Database Update Error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // ✅ Step 8: Final Auth Delete (User login na kar sake)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(clientId);
    if (authError) {
      console.warn("⚠️ Auth user delete failed (maybe already deleted):", authError.message);
    }

    return NextResponse.json({ success: true, message: "Client and all data deleted successfully" });

  } catch (err: any) {
    console.error("🔥 CRITICAL API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
