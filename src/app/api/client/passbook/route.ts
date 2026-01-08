// DELETE: Remove Transaction (Passbook + Loan + Member Sync)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    /* 1️⃣ Fetch transaction first */
    const { data: entry, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !entry) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const memberId = entry.member_id;
    const loanId = entry.loan_id || null;

    const depositAmt = Number(entry.deposit_amount || 0);
    const installmentAmt = Number(entry.installment_amount || 0);

    /* 2️⃣ Delete transaction */
    const { error: delErr } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    /* 3️⃣ Reverse loan if installment was there */
    if (installmentAmt > 0) {
      let targetLoanId = loanId;

      // fallback: latest loan
      if (!targetLoanId) {
        const { data: loans } = await supabase
          .from('loans')
          .select('id')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (loans && loans.length > 0) {
          targetLoanId = loans[0].id;
        }
      }

      if (targetLoanId) {
        const { data: loan } = await supabase
          .from('loans')
          .select('remaining_balance')
          .eq('id', targetLoanId)
          .single();

        if (loan) {
          const newBalance =
            Number(loan.remaining_balance) + installmentAmt;

          await supabase.from('loans').update({
            remaining_balance: newBalance,
            status: newBalance > 0 ? 'active' : 'closed',
          }).eq('id', targetLoanId);
        }
      }
    }

    /* 4️⃣ Recalculate member totals */
    // Outstanding loan = sum of all active loans
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('remaining_balance')
      .eq('member_id', memberId)
      .eq('status', 'active');

    const realOutstanding =
      activeLoans?.reduce(
        (sum, l) => sum + Number(l.remaining_balance),
        0
      ) || 0;

    // Deposits
    const { data: member } = await supabase
      .from('members')
      .select('total_deposits')
      .eq('id', memberId)
      .single();

    const realDeposit = Math.max(
      0,
      Number(member?.total_deposits || 0) - depositAmt
    );

    await supabase.from('members').update({
      outstanding_loan: realOutstanding,
      total_deposits: realDeposit,
    }).eq('id', memberId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE TRANSACTION ERROR:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
