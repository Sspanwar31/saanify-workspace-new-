import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  return b64.startsWith('eyJ') ? b64 : Buffer.from(b64, 'base64').toString().trim();
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const serviceKey = getServiceRoleKey();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!);

    // 1. Fetch All Data
    // 🚀 CHANGE: Removed status='active' filter to ensure all members are counted
    const [passbookRes, ledgerRes, membersRes, loansRes] = await Promise.all([
      supabaseAdmin.from('passbook_entries').select('interest_amount, fine_amount').eq('client_id', clientId),
      supabaseAdmin.from('expenses_ledger').select('amount, type').eq('client_id', clientId),
      supabaseAdmin.from('members').select('id, current_accrued').eq('client_id', clientId),
      supabaseAdmin.from('loans').select('id').eq('client_id', clientId).in('status', ['active', 'approved'])
    ]);

    // --- 🎯 INCOME ---
    let interestIncome = 0;
    let fineIncome = 0;
    passbookRes.data?.forEach(e => {
      interestIncome += (Number(e.interest_amount) || 0);
      fineIncome += (Number(e.fine_amount) || 0);
    });

    let otherFeesIncome = 0; 
    ledgerRes.data?.forEach(e => {
      if (e.type === 'INCOME') otherFeesIncome += (Number(e.amount) || 0);
    });

    const totalIncome = interestIncome + fineIncome + otherFeesIncome; // Target: 2720

    // --- 🎯 EXPENSE ---
    let operationalCost = 0;
    ledgerRes.data?.forEach(e => {
      if (e.type === 'EXPENSE') operationalCost += (Number(e.amount) || 0);
    });

    // 🚀 MATURITY: Sum of current_accrued from members
    const maturityLiability = membersRes.data?.reduce((acc, m) => acc + (Number(m.current_accrued) || 0), 0) || 0;

    const totalExpense = operationalCost + maturityLiability; // Target: 5544.44

    // --- 🎯 RESULT ---
    const netProfit = totalIncome - totalExpense; // Result: -2824.44

    return NextResponse.json({
      success: true,
      memberCount: membersRes.data?.length || 0,
      loanCount: loansRes.data?.length || 0,
      netProfit: netProfit,
      // 🚀 Fixed Debug Key for Frontend
      debug: {
        income: totalIncome,
        expense: totalExpense,
        interest: interestIncome,
        fines: fineIncome,
        other: otherFeesIncome,
        ops: operationalCost,
        maturity: maturityLiability
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
