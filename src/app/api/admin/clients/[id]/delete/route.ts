import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    
    // 1. Get Base64 Key from Env
    const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64 || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!b64Key) {
      console.error("❌ Critical: SUPABASE_SERVICE_ROLE_KEY_B64 is missing in Env");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. Decode the Key
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

    console.log(`🗑️ Hard Deleting Client: ${clientId} and all associated data...`);

    // ✅ CASCADE DELETE LOGIC START
    // Pehle saara dependent data delete karo, warna Foreign Key constraint error aayega

    // 4.1 Delete Notifications
    await supabaseAdmin.from('notifications').delete().eq('client_id', clientId);

    // 4.2 Delete Passbook Entries
    await supabaseAdmin.from('passbook_entries').delete().eq('client_id', clientId);

    // 4.3 Delete Expenses
    await supabaseAdmin.from('expenses_ledger').delete().eq('client_id', clientId);

    // 4.4 Delete Loans
    await supabaseAdmin.from('loans').delete().eq('client_id', clientId);

    // 4.5 Delete Members
    await supabaseAdmin.from('members').delete().eq('client_id', clientId);
    
    // 4.6 Delete Admin Fund Ledger (If exists)
    await supabaseAdmin.from('admin_fund_ledger').delete().eq('client_id', clientId);

    // 4.7 Delete Linked Treasurers (Staff)
    // Pehle unke Auth Users udaao
    const { data: staff } = await supabaseAdmin.from('clients').select('id').eq('client_id', clientId);
    if (staff && staff.length > 0) {
        for (const s of staff) {
            await supabaseAdmin.auth.admin.deleteUser(s.id);
        }
        // Fir DB se udaao
        await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
    }
    // ✅ CASCADE DELETE LOGIC END


    // 5. Delete Client from DB
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (dbError) {
      console.error("DB Delete Error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // 6. Delete Client from Auth (Login Access Cleanup)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(clientId);

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
