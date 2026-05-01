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

    // 1. Sabhi data fetch karein
    const [passbookRes, ledgerRes, membersRes, loansRes] = await Promise.all([
      // Passbook Entries (Interest aur Fines ke liye)
      supabaseAdmin.from('passbook_entries').select('interest_amount, fine_amount').eq('client_id', clientId),
      // Expenses Ledger (Maintenance Income aur Operational Cost ke liye)
      supabaseAdmin.from('expenses_ledger').select('amount, type').eq('client_id', clientId),
      // Members Table (Accrued Interest/Maturity ke liye)
      supabaseAdmin.from('members').select('*').eq('client_id', clientId).eq('status', 'active'),
      // Active Loans count
      supabaseAdmin.from('loans').select('id').eq('client_id', clientId).eq('status', 'active')
    ]);

    // --- 🎯 1. INCOME CALCULATION (Credits) ---
    let interestAndFine = 0;
    passbookRes.data?.forEach(e => {
      interestAndFine += (Number(e.interest_amount) || 0) + (Number(e.fine_amount) || 0);
    });

    let maintenanceIncome = 0; 
    ledgerRes.data?.forEach(e => {
      if (e.type === 'INCOME') maintenanceIncome += (Number(e.amount) || 0);
    });

    const totalIncome = interestAndFine + maintenanceIncome; // Result: 2720

    // --- 🎯 2. EXPENSE CALCULATION (Operational) ---
    let operationalCost = 0;
    ledgerRes.data?.forEach(e => {
      if (e.type === 'EXPENSE') operationalCost += (Number(e.amount) || 0);
    });

    // --- 🎯 3. MATURITY LIABILITY (Current Accrued Interest) ---
    let totalMaturityLiability = 0;
    const today = new Date();

    membersRes.data?.forEach(m => {
      const monthlyDep = Number(m.monthly_deposit_amount) || 0;
      const tenure = 36; // 36 months standard
      
      // A. Total Settled Interest logic
      let totalSettledInt = 0;
      if (m.maturity_is_override) {
        // Agar admin ne manual amount set kiya hai (e.g. 4000)
        totalSettledInt = Number(m.maturity_manual_amount) || 0;
      } else {
        // Nahi toh Auto Calculation (12% per year)
        totalSettledInt = monthlyDep * tenure * 0.12; 
      }

      // B. Monthly Share (Total Int / 36)
      const monthlyShare = totalSettledInt / tenure;

      // C. ✅ Months Completed (Native JS Calculation)
      const joinDate = new Date(m.join_date || m.created_at);
      const monthsCompleted = (today.getFullYear() - joinDate.getFullYear()) * 12 + (today.getMonth() - joinDate.getMonth());
      
      // Safety: Tenure se upar ya 0 se niche na jaye
      const safeMonths = Math.max(0, Math.min(monthsCompleted, tenure));

      // D. Current Accrued for this member
      const currentAccrued = monthlyShare * safeMonths;
      totalMaturityLiability += currentAccrued;
    });

    // --- 🎯 4. FINAL NET PROFIT ---
    // Formula: Total Income - (Ops Cost + Maturity Liability)
    const totalExpense = operationalCost + totalMaturityLiability;
    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      memberCount: membersRes.data?.length || 0,
      loanCount: loansRes.data?.length || 0,
      netProfit: netProfit, // Ye ab exact dashboard se match karega
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
