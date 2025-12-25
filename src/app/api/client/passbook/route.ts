import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// 🔐 Secure B64 Decoder Helper
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

// GET: Fetch Transactions
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('client_id');
        if (!clientId) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

        const supabase = getAdminClient();
        
        // Fetch transactions with Member names
        const { data, error } = await supabase
            .from('transactions')
            .select('*, members(name)')
            .eq('client_id', clientId)
            .order('date', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add Transaction
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const supabase = getAdminClient();
        const { error } = await supabase.from('transactions').insert([body]);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove Transaction
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const supabase = getAdminClient();
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}