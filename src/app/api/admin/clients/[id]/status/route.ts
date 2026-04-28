import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 missing");
  return rawKey.startsWith('eyJ') ? rawKey : Buffer.from(rawKey, 'base64').toString('utf-8').trim();
};

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getServiceRoleKey());

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = params.id;
    const { action } = await req.json();

    // 1. Status Logic (Standardizing to UPPERCASE)
    let updateFields: any = {};

    if (action === 'LOCK') {
      updateFields = { status: 'LOCKED', subscription_status: 'locked' };
    } else if (action === 'EXPIRE') {
      updateFields = { status: 'EXPIRED', subscription_status: 'expired' };
    } else if (action === 'ACTIVATE' || action === 'UNLOCK') {
      updateFields = { status: 'ACTIVE', subscription_status: 'active' };
    } else {
      return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    }

    // 2. Database Update
    const { data, error } = await supabaseAdmin
      .from('clients')
      .update(updateFields)
      .eq('id', clientId)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, status: updateFields.status });

  } catch (err: any) {
    console.error('API Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
