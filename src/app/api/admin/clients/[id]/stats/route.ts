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

    // 1. Basic Counts
    const { count: memberCount } = await supabaseAdmin.from('members').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active');
    const { count: loanCount } = await supabaseAdmin.from('loans').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active');

    // 2. Fetch Data from all sources (Like Client Store)
    const { data: passbook } = await supabaseAdmin.from('passbook_entries').select('*').eq('client_id', clientId);
    const { data: expenses } = await supabaseAdmin.from('expenses_ledger').select('*').eq('client_id', clientId);

    let totalIncome = 0;   // Target: 2720
    let totalExpense = 0;  // Target: 6100

    // 🎯 PASSBOOK LOGIC (Income + Expense from Passbook)
    passbook?.forEach(e => {
      const amt = Number(e.amount) || 0;
      const type = (e.type || '').toUpperCase();
      
      // Income Check (Interest, Fine, Late Fee)
      if (['INTEREST', 'FINE', 'PENALTY', 'LATE_FEE', 'LATE FEE'].includes(type)) {
        totalIncome += amt;
      }
      
      // Expense from Passbook (Withdrawals/Expenses)
      if (type === 'WITHDRAWAL' || type === 'EXPENSE') {
        totalExpense += amt;
      }
    });

    // 🎯 EXPENSES LEDGER LOGIC (Direct Expenses)
    expenses?.forEach(e => {
      const amt = Number(e.amount) || 0;
      // Agar entry INCOME type ki hai ledger mein (Rare)
      if (e.type === 'INCOME') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    });

    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      memberCount,
      loanCount,
      netProfit, // Result should be -3380
      debug: {
        totalIncome,
        totalExpense,
        passbookCount: passbook?.length || 0,
        ledgerCount: expenses?.length || 0
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
