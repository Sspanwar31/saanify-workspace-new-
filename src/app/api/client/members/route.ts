import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getServiceRoleKey = () => {
  const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64) return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  try {
    return Buffer.from(b64, 'base64').toString('utf-8').trim();
  } catch (e) { return ''; }
};

const getAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = getServiceRoleKey();
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

// GET: Fetch Members
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    
    if (!clientId) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

    const supabase = getAdminClient();
    const { data, error } = await supabase.from('members').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update Member
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    const supabase = getAdminClient();
    const { error } = await supabase.from('members').update(updates).eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove Member & All Related Data (FIXED)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1️⃣ Get auth user id (Safe Check)
    const { data: member } = await supabase
      .from('members')
      .select('auth_user_id')
      .eq('id', id)
      .maybeSingle();

    // 2️⃣ Delete Related Data (Foreign Key Constraints Fix)
    
    // Notifications (Ye missing tha)
    await supabase.from('notifications').delete().eq('member_id', id);

    // Passbook
    await supabase.from('passbook_entries').delete().eq('member_id', id);

    // Loans
    await supabase.from('loans').delete().eq('member_id', id);

    // Expenses (Agar linked hai)
    await supabase.from('expenses_ledger').delete().eq('member_id', id);

    // 3️⃣ Delete Member (Main)
    const { error: memberDeleteError } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (memberDeleteError) throw memberDeleteError;

    // 4️⃣ Delete Auth User (Cleanup)
    if (member?.auth_user_id) {
      try {
        await supabase.auth.admin.deleteUser(member.auth_user_id);
      } catch (authErr) {
        console.warn('Auth delete skipped:', authErr);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE MEMBER ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
