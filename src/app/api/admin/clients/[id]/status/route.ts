import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64Key) return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  try {
    if (b64Key.startsWith('eyJ')) return b64Key;
    return Buffer.from(b64Key, 'base64').toString('utf-8').trim();
  } catch (e) { return null; }
};

// ✅ GET: Fetch Real Stats (Updated Signature & Debug Logs)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;

  console.log("API CLIENT ID:", clientId); // ✅ debug

  const serviceKey = getServiceRoleKey();

  if (!serviceKey) {
    return NextResponse.json({ error: "Config Error" }, { status: 500 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  try {
    // ✅ DEBUG: Fetch Raw Loans
    const { data: rawLoans } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('client_id', clientId);

    console.log("RAW LOANS:", rawLoans);

    // ✅ 1. Member Count
    const { count: memberCount, error: mErr } = await supabaseAdmin
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    console.log("Members Count:", memberCount, mErr);

    // ✅ 2. Loan Count
    const { count: loanCount, error: lErr } = await supabaseAdmin
      .from('loans')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    console.log("Loan Count:", loanCount, lErr);

    // ✅ 3. Passbook
    const { data: passbook } = await supabaseAdmin
      .from('passbook_entries')
      .select('amount, type, category')
      .eq('client_id', clientId);

    // ✅ 4. Expenses
    const { data: expenses } = await supabaseAdmin
      .from('expenses_ledger')
      .select('amount')
      .eq('client_id', clientId);

    let totalIncome = 0;

    passbook?.forEach(entry => {
      if (
        entry.type === 'deposit' &&
        ['interest', 'fine', 'penalty'].includes(entry.category?.toLowerCase())
      ) {
        totalIncome += Number(entry.amount);
      }
    });

    const totalExpense =
      expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      memberCount: memberCount || 0,
      loanCount: loanCount || 0,
      netProfit
    });

  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ POST: Update Status (LOCK/EXPIRE/ACTIVATE)
export async function POST(
  req: NextRequest, 
  { params }: { params: { id: string } } // ✅ Updated signature to match GET
) {
  try {
    const clientId = params.id; // ✅ Removed await
    const { action } = await req.json();
    const serviceKey = getServiceRoleKey();

    if (!serviceKey || !clientId) {
      return NextResponse.json({ error: "Config or ID Error", success: false }, { status: 500 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    let newStatus = '';
    const cmd = action?.toUpperCase();

    if (cmd === 'LOCK') newStatus = 'LOCKED';
    else if (cmd === 'EXPIRE') newStatus = 'EXPIRED';
    else if (cmd === 'ACTIVATE' || cmd === 'UNLOCK') newStatus = 'ACTIVE';
    else return NextResponse.json({ error: 'Invalid Action', success: false }, { status: 400 });

    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      }) 
      .eq('id', clientId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, status: newStatus }, { status: 200 });

  } catch (err: any) {
    console.error("API Crash:", err.message);
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
