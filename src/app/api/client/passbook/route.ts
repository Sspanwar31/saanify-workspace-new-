import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Power Client (RLS Bypass)
const getAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const supabase = getAdminClient();

    // 1. Fetch Transaction (Taaki pata chale kiska paisa tha)
    const { data: entry, error: fetchErr } = await supabase
      .from('passbook_entries') 
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    const { member_id, loan_id, installment_amount } = entry;
    const instAmt = Number(installment_amount || 0);
    const depAmt = Number(entry.deposit_amount || 0);

    // 2. Delete Transaction
    const { error: delErr } = await supabase
      .from('passbook_entries')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    // 3. Reverse Loan Balance (Agar Installment thi)
    if (instAmt > 0) {
      let targetLoanId = loan_id; // ✅ Pehle linked Loan ID try karo

      // Agar Loan ID nahi mili, tabhi Latest Loan dhoondo
      if (!targetLoanId) {
        const { data: loans } = await supabase
          .from('loans')
          .select('id')
          .eq('member_id', member_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (loans && loans.length > 0) targetLoanId = loans[0].id;
      }

      // Agar Loan mil gaya, to update karo
      if (targetLoanId) {
        const { data: loan } = await supabase
          .from('loans')
          .select('remaining_balance')
          .eq('id', targetLoanId)
          .single();

        if (loan) {
          const currentBal = Number(loan.remaining_balance);
          const newBalance = currentBal + instAmt;
          
          // Agar balance > 0 hai to Active, nahi to Closed (Waise badh raha hai to Active hi hoga)
          const newStatus = newBalance > 0 ? 'active' : 'closed';

          await supabase
            .from('loans')
            .update({
              remaining_balance: newBalance,
              status: newStatus
            })
            .eq('id', targetLoanId);
        }
      }
    }

    // 4. Final Sync: Member Totals Refresh
    
    // A. Outstanding (Active Loans ka sum)
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('remaining_balance')
      .eq('member_id', member_id)
      .eq('status', 'active'); // Sirf Active jodo

    const realOutstanding = activeLoans?.reduce((sum, l) => sum + Number(l.remaining_balance), 0) || 0;

    // B. Total Deposits (Re-calculate from scratch for safety)
    const { data: allDeposits } = await supabase
      .from('passbook_entries')
      .select('deposit_amount')
      .eq('member_id', member_id);

    const realDeposit = allDeposits?.reduce((sum, d) => sum + Number(d.deposit_amount || 0), 0) || 0;

    // C. Update Member
    await supabase.from('members').update({
      outstanding_loan: realOutstanding,
      total_deposits: realDeposit,
    }).eq('id', member_id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
