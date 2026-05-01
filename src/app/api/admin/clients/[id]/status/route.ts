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

// 🚀 GET: Fetch Real Stats (Fixed Next.js 15 Params)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ Type Fix
) {
  const { id: clientId } = await params; // ✅ Must await params
  const serviceKey = getServiceRoleKey();
  
  if (!serviceKey) return NextResponse.json({ error: "Key Error" }, { status: 500 });
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  try {
    // 1. Members
    const { count: memberCount } = await supabaseAdmin
      .from('members').select('*', { count: 'exact', head: true }).eq('client_id', clientId);

    // 2. Active Loans
    const { count: loanCount } = await supabaseAdmin
      .from('loans').select('*', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['active', 'approved']);

    // 3. Financials
    const { data: passbook } = await supabaseAdmin.from('passbook_entries').select('amount, type, category').eq('client_id', clientId);
    const { data: expenses } = await supabaseAdmin.from('expenses_ledger').select('amount').eq('client_id', clientId);

    let totalIncome = 0;
    passbook?.forEach(entry => {
      if (entry.type === 'deposit' && ['interest', 'fine', 'penalty'].includes(entry.category?.toLowerCase() || '')) {
        totalIncome += Number(entry.amount);
      }
    });
    const totalExpense = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    return NextResponse.json({
      success: true,
      memberCount: memberCount || 0,
      loanCount: loanCount || 0,
      netProfit: totalIncome - totalExpense
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}

// 🚀 POST: Update Status (Fixed Next.js 15 Params)
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // ✅ Type Fix
) {
  try {
    const { id: clientId } = await params; // ✅ Must await params
    const { action } = await req.json();
    const serviceKey = getServiceRoleKey();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!);

    let newStatus = '';
    const cmd = action?.toUpperCase();
    if (cmd === 'LOCK') newStatus = 'LOCKED';
    else if (cmd === 'EXPIRE') newStatus = 'EXPIRED';
    else if (cmd === 'ACTIVATE' || cmd === 'UNLOCK') newStatus = 'ACTIVE';
    else return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    const { error } = await supabaseAdmin.from('clients').update({ status: newStatus }).eq('id', clientId);
    if (error) throw error;

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, success: false }, { status: 500 });
  }
}
