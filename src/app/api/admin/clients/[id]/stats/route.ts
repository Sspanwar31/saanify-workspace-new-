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

    // 1. Members & Loans
    const { count: memberCount } = await supabaseAdmin.from('members').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active');
    const { count: loanCount } = await supabaseAdmin.from('loans').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'active');

    // 2. Fetch Data for Debugging
    const { data: passbook } = await supabaseAdmin.from('passbook_entries').select('amount, type, category, description').eq('client_id', clientId);
    const { data: expenses } = await supabaseAdmin.from('expenses_ledger').select('amount, category').eq('client_id', clientId);

    // 🎯 DEBUG COUNTERS
    let debugIncomeBreakdown: any = {};
    let ignoredEntries: any[] = [];
    let actualEarnings = 0;

    passbook?.forEach(entry => {
      const amt = Number(entry.amount) || 0;
      const cat = (entry.category || 'NO_CATEGORY').toUpperCase().trim();
      
      // Check if this category is considered "Income" (Munafa)
      const isProfitCategory = ['INTEREST', 'FINE', 'PENALTY', 'LATE FEE', 'LATE_FEE'].includes(cat);

      if (entry.type === 'deposit' && isProfitCategory) {
        actualEarnings += amt;
        debugIncomeBreakdown[cat] = (debugIncomeBreakdown[cat] || 0) + amt;
      } else {
        // Record why this entry was ignored
        ignoredEntries.push({ amt, cat, type: entry.type, desc: entry.description });
      }
    });

    const totalExpense = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
    const netProfit = actualEarnings - totalExpense;

    return NextResponse.json({
      success: true,
      memberCount,
      loanCount,
      netProfit,
      // 🚀 DEBUG DATA (Check this in Console)
      debug: {
        calculatedIncome: actualEarnings,
        calculatedExpense: totalExpense,
        incomeBreakdown: debugIncomeBreakdown,
        totalEntriesChecked: passbook?.length || 0,
        sampleIgnoredEntries: ignoredEntries.slice(0, 5) // Pehli 5 ignored entries dekho
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
