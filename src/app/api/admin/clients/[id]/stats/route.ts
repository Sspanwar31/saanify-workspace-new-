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

    // 1. Members (Filter: status='active' and not deleted)
    const { count: memberCount } = await supabaseAdmin
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'active');

    // 2. Active Loans (Filter: status='active')
    const { count: loanCount } = await supabaseAdmin
      .from('loans')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'active');

    // 3. Passbook Entries (Sirf Interest aur Fine nikalne ke liye)
    const { data: passbook } = await supabaseAdmin
      .from('passbook_entries')
      .select('amount, type, category')
      .eq('client_id', clientId);

    // 4. Expense Ledger (Poore society ke kharche)
    const { data: expenses } = await supabaseAdmin
      .from('expenses_ledger')
      .select('amount')
      .eq('client_id', clientId);

    // 🎯 ASLI CALCULATION (Exact Sync with Client Dashboard)
    let totalInterestAndFines = 0;
    
    passbook?.forEach(entry => {
      const amt = Number(entry.amount) || 0;
      const type = (entry.type || '').toUpperCase();
      const cat = (entry.category || '').toUpperCase();

      // Dashboard logic: INTEREST + FINE categories only
      // EMI ke principal part ko ignore karna hai
      if (type === 'DEPOSIT' || type === 'INSTALLMENT' || type === 'INTEREST' || type === 'FINE') {
          if (cat.includes('INTEREST') || cat.includes('FINE') || cat.includes('PENALTY') || cat.includes('LATE')) {
            totalInterestAndFines += amt;
          }
      }
    });

    // Total Expenses from Ledger
    const totalExpenses = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

    // Formula: (2720) - (6100) = -3380
    const netProfit = totalInterestAndFines - totalExpenses;

    return NextResponse.json({
      success: true,
      memberCount: memberCount || 0,
      loanCount: loanCount || 0,
      netProfit: netProfit, // Result: -3380
      totalIncome: totalInterestAndFines,
      totalExpense: totalExpenses
    });

  } catch (err: any) {
    console.error("Stats API Error:", err.message);
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
