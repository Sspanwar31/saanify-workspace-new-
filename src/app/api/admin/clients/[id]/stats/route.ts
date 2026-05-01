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

    // 1. Fetch All Required Data
    const [passbookRes, expensesRes, membersRes, loansRes] = await Promise.all([
      supabaseAdmin.from('passbook_entries').select('interest_amount, fine_amount').eq('client_id', clientId),
      supabaseAdmin.from('expenses_ledger').select('amount').eq('client_id', clientId),
      supabaseAdmin.from('members').select('id').eq('client_id', clientId).eq('status', 'active'),
      supabaseAdmin.from('loans').select('id').eq('client_id', clientId).in('status', ['active', 'approved'])
    ]);

    // 🎯 ASLI INCOME CALCULATION (Based on your columns)
    let totalIncome = 0; // Target: ₹2,720
    
    passbookRes.data?.forEach(entry => {
      // Hum categories nahi, seedha columns ka total karenge
      const interest = Number(entry.interest_amount) || 0;
      const fine = Number(entry.fine_amount) || 0;
      totalIncome += (interest + fine);
    });

    // 🎯 ASLI EXPENSE CALCULATION
    const totalExpense = expensesRes.data?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0; // Target: ₹6,100

    // Net Profit = (Interest + Fines) - Total Expenses
    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      memberCount: membersRes.data?.length || 0,
      loanCount: loansRes.data?.length || 0,
      netProfit: netProfit, // Result should be -3380
      debug: {
        income: totalIncome,
        expense: totalExpense,
        passbookRows: passbookRes.data?.length
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
