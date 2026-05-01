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

    // 1. Counts
    const { count: memberCount } = await supabaseAdmin.from('members').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active');
    const { count: loanCount } = await supabaseAdmin.from('loans').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active');

    // 2. Fetch All Records
    const { data: passbook } = await supabaseAdmin.from('passbook_entries').select('amount, type, category').eq('client_id', clientId);
    const { data: expenses } = await supabaseAdmin.from('expenses_ledger').select('amount').eq('client_id', clientId);

    let totalIncome = 0;
    let totalExpense = 0;

    // 🎯 ASLI INCOME LOGIC: Sirf Interest aur Fines
    passbook?.forEach(e => {
      const amt = Number(e.amount) || 0;
      const type = (e.type || '').toUpperCase();
      const cat = (e.category || '').toUpperCase();

      // Dashboard Sync: Interest, Fine, Penalty hi "Income" hai
      if (type === 'INTEREST' || type === 'FINE' || cat === 'INTEREST' || cat === 'FINE' || cat === 'PENALTY') {
        totalIncome += amt;
      }
    });

    // 🎯 ASLI EXPENSE LOGIC: Pura Expense Ledger
    expenses?.forEach(e => {
      totalExpense += (Number(e.amount) || 0);
    });

    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      memberCount: memberCount || 0,
      loanCount: loanCount || 0,
      netProfit: netProfit, // Ye ab -3380 aayega
      debug: {
        income: totalIncome,
        expense: totalExpense,
        incomeBreakdown: { interest_fine: totalIncome }
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
