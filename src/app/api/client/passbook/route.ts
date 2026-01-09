import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Power Client (RLS Bypass)
const getAdminClient = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (rawKey && !rawKey.startsWith('eyJ')) {
    try {
      serviceKey = Buffer.from(rawKey, 'base64').toString('utf-8');
    } catch (e) { console.error("Key Decode Failed:", e); }
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey!,
    { auth: { persistSession: false } }
  );
};

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const supabase = getAdminClient();

    // 1. Fetch Transaction
    const { data: entry, error: fetchErr } = await supabase
      .from('passbook_entries') 
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    const { member_id, loan_id, installment_amount } = entry;
    const instAmt = Number(installment_amount || 0);

    // 2. Delete Transaction
    const { error: delErr } = await supabase.from('passbook_entries').delete().eq('id', id);
    if (delErr) throw delErr;

    // 3. Reverse Loan Balance (CRITICAL FIX)
    if (instAmt > 0) {
      let targetLoanId = loan_id;

      // Agar direct link nahi hai, to sabse pehle ACTIVE loan dhundo
      if (!targetLoanId) {
        const { data: activeLoans } = await supabase
          .from('loans')
          .select('id')
          .eq('member_id', member_id)
          .eq('status', 'active') // ✅ Priority to Active
          .order('created_at', { ascending: false }) // Latest Active
          .limit(1);

        if (activeLoans && activeLoans.length > 0) {
             targetLoanId = activeLoans[0].id;
        } else {
             // Agar Active nahi mila (matlab loan band ho gaya tha), to Latest Closed dhundo
             const { data: closedLoans } = await supabase
                .from('loans')
                .select('id')
                .eq('member_id', member_id)
                .order('created_at', { ascending: false })
                .limit(1);
             if (closedLoans && closedLoans.length > 0) targetLoanId = closedLoans[0].id;
        }
      }

      // Agar Loan mil gaya, to update karo
      if (targetLoanId) {
        const { data: loan } = await supabase.from('loans').select('remaining_balance').eq('id', targetLoanId).single();

        if (loan) {
          const newBalance = Number(loan.remaining_balance) + instAmt;
          
          // Agar balance > 0 hai to Active, nahi to Closed
          const newStatus = newBalance > 0 ? 'active' : 'closed';

          await supabase.from('loans').update({
            remaining_balance: newBalance,
            status: newStatus
          }).eq('id', targetLoanId);
        }
      }
    }

    // 4. Final Sync: Member Totals Refresh (Correct Source of Truth)
    // Hum Loan table se ginti karke Member table update karenge
    const { data: allMemberLoans } = await supabase
      .from('loans')
      .select('remaining_balance')
      .eq('member_id', member_id)
      .eq('status', 'active'); 

    const realOutstanding = allMemberLoans?.reduce((sum, l) => sum + Number(l.remaining_balance), 0) || 0;

    const { data: allDeposits } = await supabase
      .from('passbook_entries')
      .select('deposit_amount')
      .eq('member_id', member_id);

    const realDeposit = allDeposits?.reduce((sum, d) => sum + Number(d.deposit_amount || 0), 0) || 0;

    await supabase.from('members').update({
      outstanding_loan: realOutstanding,
      total_deposits: realDeposit,
    }).eq('id', member_id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
