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

    // 1. Members
    const { count: memberCount } = await supabaseAdmin
      .from('members').select('*', { count: 'exact', head: true }).eq('client_id', clientId);

    // 2. Active Loans
    const { count: loanCount } = await supabaseAdmin
      .from('loans').select('*', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['active', 'approved']);

    // 3. Financials (Profit Calculation)
    const { data: passbook } = await supabaseAdmin.from('passbook_entries').select('amount, type, category').eq('client_id', clientId);
    const { data: expenses } = await supabaseAdmin.from('expenses_ledger').select('amount').eq('client_id', clientId);

    // FORMULA SYNC: Earnings (Interest + Fines)
    let actualEarnings = 0;
    passbook?.forEach(entry => {
      const cat = (entry.category || '').toLowerCase().trim();
      if (entry.type === 'deposit' && (cat === 'interest' || cat === 'fine' || cat === 'penalty' || cat === 'late_fee')) {
        actualEarnings += Number(entry.amount);
      }
    });

    const totalExpense = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
    const netProfit = actualEarnings - totalExpense;

    return NextResponse.json({
      success: true,
      memberCount: memberCount || 0,
      loanCount: loanCount || 0,
      netProfit: netProfit, // Result: -3380
      actualEarnings,
      totalExpense
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
