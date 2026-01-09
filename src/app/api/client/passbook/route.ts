import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- KEY FIXING LOGIC (For Vercel) ---
const getAdminClient = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Agar B64 key hai, to decode karo
  if (rawKey && !rawKey.startsWith('eyJ')) {
    try {
      serviceKey = Buffer.from(rawKey, 'base64').toString('utf-8');
    } catch (e) {
      console.error("Key Decode Failed:", e);
    }
  }

  if (!serviceKey) throw new Error("Service Role Key Missing");

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  );
};

export async function DELETE(req: Request) {
  // --- 1. ID FETCH KARNA (Body se ya URL se dono support) ---
  let id = '';
  try {
      // Koshish karo JSON body se lene ki (POST request jaisa)
      const body = await req.json().catch(() => null);
      if (body?.id) id = body.id;
      
      // Agar body me nahi mila, to URL se lo
      if (!id) {
          const { searchParams } = new URL(req.url);
          id = searchParams.get('id') || '';
      }
  } catch (e) {}

  if (!id) return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });

  try {
    const supabase = getAdminClient();

    // --- 2. FETCH TRANSACTION DETAILS ---
    const { data: entry, error: fetchErr } = await supabase
      .from('passbook_entries') 
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const { member_id, loan_id, installment_amount, deposit_amount } = entry;
    const instAmt = Number(installment_amount || 0);

    // --- 3. DELETE ENTRY ---
    const { error: delErr } = await supabase
      .from('passbook_entries')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    // --- 4. REVERSE LOAN BALANCE (Agar Installment thi) ---
    if (instAmt > 0) {
      let targetLoanId = loan_id;

      // Agar direct link nahi hai, to Latest Loan dhundo
      if (!targetLoanId) {
        const { data: loans } = await supabase
          .from('loans')
          .select('id')
          .eq('member_id', member_id)
          .order('created_at', { ascending: false }) // Latest first
          .limit(1);

        if (loans && loans.length > 0) targetLoanId = loans[0].id;
      }

      if (targetLoanId) {
        // Loan fetch karo
        const { data: loan } = await supabase
          .from('loans')
          .select('remaining_balance')
          .eq('id', targetLoanId)
          .single();

        if (loan) {
          const currentBal = Number(loan.remaining_balance);
          const newBalance = currentBal + instAmt; // Paisa wapas jodo
          
          // Agar balance wapas aa gaya, to Active karo
          const newStatus = newBalance > 0 ? 'active' : 'closed';

          await supabase.from('loans').update({
            remaining_balance: newBalance,
            status: newStatus
          }).eq('id', targetLoanId);
        }
      }
    }

    // --- 5. FINAL SYNC (Member Table Refresh) ---
    
    // A. Outstanding Loan (Sab Active Loans ka total)
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('remaining_balance')
      .eq('member_id', member_id)
      .eq('status', 'active'); 

    const realOutstanding = activeLoans?.reduce((sum, l) => sum + Number(l.remaining_balance), 0) || 0;

    // B. Total Deposits (Passbook se recalculate - safest way)
    const { data: allDeposits } = await supabase
      .from('passbook_entries')
      .select('deposit_amount')
      .eq('member_id', member_id);

    const realDeposit = allDeposits?.reduce((sum, d) => sum + Number(d.deposit_amount || 0), 0) || 0;

    // Update Member Profile
    await supabase.from('members').update({
      outstanding_loan: realOutstanding,
      total_deposits: realDeposit,
    }).eq('id', member_id);

    return NextResponse.json({ success: true, message: "Deleted & Synced" });

  } catch (error: any) {
    console.error('DELETE API ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
