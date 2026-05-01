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

    // 1. Members (Sirf Active)
    const { count: memberCount } = await supabaseAdmin
      .from('members').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active');

    // 2. Active Loans (Status 'active' match with dashboard)
    const { count: loanCount } = await supabaseAdmin
      .from('loans').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active');

    // 3. Passbook Entries (Earning Source)
    const { data: passbook } = await supabaseAdmin
      .from('passbook_entries')
      .select('amount, type, category')
      .eq('client_id', clientId);

    // 4. Expense Ledger (Expense Source)
    const { data: expenses } = await supabaseAdmin
      .from('expenses_ledger')
      .select('amount')
      .eq('client_id', clientId);

    // 🎯 STRICT CALCULATION LOGIC
    let actualEarnings = 0; // Target: ₹2,720
    
    passbook?.forEach(entry => {
      const amt = Number(entry.amount) || 0;
      const cat = (entry.category || '').toUpperCase().trim();

      // ❌ EMI Principal, Loan Amount, aur Normal Deposits ko IGNORE karna hai
      // ✅ Sirf wahi items jo "Munafa" hain:
      if (cat === 'INTEREST' || cat === 'FINE' || cat === 'PENALTY' || cat === 'LATE FEE' || cat === 'LATE_FEE') {
        actualEarnings += amt;
      }
    });

    // Total Expenses: Sum of all expenses in ledger (Target: ₹6,100)
    const totalExpenses = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

    // Formula: 2720 - 6100 = -3380
    const netProfit = actualEarnings - totalExpenses;

    console.log(`Checking ${clientId}: Income=${actualEarnings}, Expense=${totalExpenses}, Profit=${netProfit}`);

    return NextResponse.json({
      success: true,
      memberCount: memberCount || 0,
      loanCount: loanCount || 0,
      netProfit: netProfit, // Ab ye exact -3380 aayega
      totalIncome: actualEarnings,
      totalExpense: totalExpenses
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
