import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getServiceRoleKey = () => {
    const b64 = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
    return b64 ? Buffer.from(b64, 'base64').toString('utf-8').trim() : process.env.SUPABASE_SERVICE_ROLE_KEY;
};

const getAdminClient = () => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getServiceRoleKey()!, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    if (!clientId) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from('loans')
        .select('*, members(name, phone)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    const body = await req.json();
    const supabase = getAdminClient();
    
    // Set default remaining balance equal to amount
    const payload = { ...body, remaining_balance: body.amount };
    
    const { error } = await supabase.from('loans').insert([payload]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
    const body = await req.json();
    const { id, ...updates } = body;
    const supabase = getAdminClient();
    const { error } = await supabase.from('loans').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}