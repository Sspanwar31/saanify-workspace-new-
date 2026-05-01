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

    // 1. Sabhi table se data fetch karein
    const [passbookRes, ledgerRes, membersRes, loansRes] = await Promise.all([
      // Passbook se interest aur fine
      supabaseAdmin.from('passbook_entries').select('interest_amount, fine_amount').eq('client_id', clientId),
      // Ledger se Maintenance(Income) aur Ops(Expense)
      supabaseAdmin.from('expenses_ledger').select('amount, type').eq('client_id', clientId),
      // Members table se Current Accrued (Ye wo interest hai jo society par udhaar hai)
      supabaseAdmin.from('members').select('id, current_accrued, status').eq('client_id', clientId).eq('status', 'active'),
      // Active Loans count
      supabaseAdmin.from('loans').select('id').eq('client_id', clientId).eq('status', 'active')
    ]);

    // --- 🎯 1. INCOME CALCULATION (Credits) ---
    let interestIncome = 0;
    let fineIncome = 0;
    passbookRes.data?.forEach(e => {
      interestIncome += (Number(e.interest_amount) || 0);
      fineIncome += (Number(e.fine_amount) || 0);
    });

    let otherFeesIncome = 0; // Maintenance fees etc.
    ledgerRes.data?.forEach(e => {
      if (e.type === 'INCOME') {
        otherFeesIncome += (Number(e.amount) || 0);
      }
    });

    const totalIncome = interestIncome + fineIncome + otherFeesIncome; // Target: 2720

    // --- 🎯 2. EXPENSE CALCULATION (Debits) ---
    let operationalCost = 0;
    ledgerRes.data?.forEach(e => {
      if (e.type === 'EXPENSE') {
        operationalCost += (Number(e.amount) || 0);
      }
    });

    // 🚀 ASLI BADLAV: Maturity Liability = Sum of all members' "current_accrued"
    const maturityLiability = membersRes.data?.reduce((acc, m) => acc + (Number(m.current_accrued) || 0), 0) || 0;

    const totalExpense = operationalCost + maturityLiability; // Target: 6100 (100 + 6000)

    // --- 🎯 3. FINAL NET PROFIT ---
    const netProfit = totalIncome - totalExpense; // Result: 2720 - 6100 = -3380

    return NextResponse.json({
      success: true,
      memberCount: membersRes.data?.length || 0,
      loanCount: loansRes.data?.length || 0,
      netProfit: netProfit,
      details: {
        interestIncome,
        fineIncome,
        otherFeesIncome,
        operationalCost,
        maturityLiability,
        totalIncome,
        totalExpense
      }
    });

  } catch (err: any) {
    console.error("Stats API Error:", err.message);
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
