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
    const [passbookRes, ledgerRes, membersRes, loansRes] = await Promise.all([
      supabaseAdmin.from('passbook_entries').select('*').eq('client_id', clientId),
      supabaseAdmin.from('expenses_ledger').select('amount, type').eq('client_id', clientId),
      supabaseAdmin.from('members').select('*').eq('client_id', clientId).eq('status', 'active'),
      supabaseAdmin.from('loans').select('id').eq('client_id', clientId).eq('status', 'active')
    ]);

    const passbookData = passbookRes.data || [];

    // --- 🎯 1. INCOME CALCULATION (Credits) ---
    let interestAndFine = 0;
    passbookData.forEach(e => {
      interestAndFine += (Number(e.interest_amount) || 0) + (Number(e.fine_amount) || 0);
    });

    let maintenanceIncome = 0; 
    ledgerRes.data?.forEach(e => {
      if (e.type === 'INCOME') maintenanceIncome += (Number(e.amount) || 0);
    });

    const totalIncome = interestAndFine + maintenanceIncome; // Target: 2720

    // --- 🎯 2. EXPENSE CALCULATION (Operational) ---
    let operationalCost = 0;
    ledgerRes.data?.forEach(e => {
      if (e.type === 'EXPENSE') operationalCost += (Number(e.amount) || 0);
    });

    // --- 🎯 3. MATURITY LIABILITY (Months Paid Logic) ---
    let totalMaturityLiability = 0;

    membersRes.data?.forEach(m => {
      const monthlyDep = Number(m.monthly_deposit_amount) || 0;
      const tenure = 36;
      
      // A. Settled Interest (Override vs Auto 12%)
      let totalSettledInt = 0;
      if (m.maturity_is_override) {
        totalSettledInt = Number(m.maturity_manual_amount) || 0;
      } else {
        totalSettledInt = monthlyDep * tenure * 0.12; 
      }

      const monthlyShare = totalSettledInt / tenure;

      // 🚀 B. ASLI FIX: Count actual payments from passbook
      // Hum calendar date nahi ginenye, hum ginenye ki member ne kitni rows entries ki hain
      const monthsPaid = passbookData.filter(e => 
        e.member_id === m.id && 
        (Number(e.deposit_amount) > 0 || Number(e.installment_amount) > 0)
      ).length;

      const safeMonths = Math.max(0, Math.min(monthsPaid, tenure));

      // C. Current Accrued
      const currentAccrued = monthlyShare * safeMonths;
      totalMaturityLiability += currentAccrued;
    });

    // --- 🎯 4. FINAL NET PROFIT ---
    const totalExpense = operationalCost + totalMaturityLiability;
    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      memberCount: membersRes.data?.length || 0,
      loanCount: loansRes.data?.length || 0,
      netProfit: netProfit, 
      debug: {
        income: totalIncome,
        expense: totalExpense,
        maturity: totalMaturityLiability,
        ops: operationalCost
      }
    });

  } catch (err: any) {
    console.error("Stats API Error:", err.message);
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
