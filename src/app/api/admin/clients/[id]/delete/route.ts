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

    // ✅ CASCADE DELETE LOGIC START
    // Pehle saara dependent data delete karo with error checks
    
    // 4.1 Delete Notifications
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('client_id', clientId);

    if (notifError) {
      return NextResponse.json({ error: "Failed to delete notifications: " + notifError.message }, { status: 400 });
    }

    // 4.2 Delete Passbook Entries
    const { error: passbookError } = await supabaseAdmin
      .from('passbook_entries')
      .delete()
      .eq('client_id', clientId);

    if (passbookError) {
      return NextResponse.json({ error: "Failed to delete passbook entries: " + passbookError.message }, { status: 400 });
    }

    // 4.3 Delete Expenses
    const { error: expensesError } = await supabaseAdmin
      .from('expenses_ledger')
      .delete()
      .eq('client_id', clientId);

    if (expensesError) {
      return NextResponse.json({ error: "Failed to delete expenses: " + expensesError.message }, { status: 400 });
    }

    // 4.4 Delete Loans
    const { error: loansError } = await supabaseAdmin
      .from('loans')
      .delete()
      .eq('client_id', clientId);

    if (loansError) {
      return NextResponse.json({ error: "Failed to delete loans: " + loansError.message }, { status: 400 });
    }

    // 4.5 Delete Members
    const { error: membersError } = await supabaseAdmin
      .from('members')
      .delete()
      .eq('client_id', clientId);

    if (membersError) {
      return NextResponse.json({ error: "Failed to delete members: " + membersError.message }, { status: 400 });
    }
    
    // 4.6 Delete Admin Fund Ledger (If exists)
    const { error: ledgerError } = await supabaseAdmin
      .from('admin_fund_ledger')
      .delete()
      .eq('client_id', clientId);

    if (ledgerError) {
      return NextResponse.json({ error: "Failed to delete ledger: " + ledgerError.message }, { status: 400 });
    }

    // 4.7 Delete Linked Treasurers (Staff)
    // ✅ FIX: Filter by role 'treasurer' to avoid deleting the main client
    const { data: staff } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('client_id', clientId)
      .eq('role', 'treasurer'); // ✅ ADD THIS

    if (staff && staff.length > 0) {
        for (const s of staff) {
            await supabaseAdmin.auth.admin.deleteUser(s.id);
        }
        // Fir DB se udaao
        await supabaseAdmin
          .from('clients')
          .delete()
          .eq('client_id', clientId)
          .eq('role', 'treasurer');
    }
    // ✅ CASCADE DELETE LOGIC END


    // 5. ✅ SOFT DELETE Client from DB
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({
        is_deleted: true,
        status: 'DELETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (dbError) {
      console.error("DB Update Error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
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
