import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- 🔐 SERVICE ROLE KEY DECODER (Base64 Fix) ---
const getServiceRoleKey = () => {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!rawKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 missing");
  
  if (rawKey.startsWith('eyJ')) return rawKey; // Pehle se decoded hai
  return Buffer.from(rawKey, 'base64').toString('utf-8').trim(); // B64 se decode karo
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getServiceRoleKey()
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const body = await req.json();
    const { action } = body;

    if (!clientId || !action) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    // ✅ SAHI LOGIC: Ab ye teeno cases handle karega
    let newStatus: 'ACTIVE' | 'LOCKED' | 'EXPIRED';

    if (action === 'LOCK') {
      newStatus = 'LOCKED';
    } else if (action === 'EXPIRE') {
      newStatus = 'EXPIRED';
    } else if (action === 'ACTIVATE' || action === 'UNLOCK') {
      newStatus = 'ACTIVE'; // 👈 Ye missing tha, isliye 400 aa raha tha
    } else {
      return NextResponse.json({ error: 'Invalid action: ' + action }, { status: 400 });
    }

    // ✅ DATABASE UPDATE (Bypassing RLS with Service Role Key)
    const { data, error } = await supabaseAdmin
      .from('clients')
      .update({ 
        status: newStatus,
        subscription_status: newStatus === 'ACTIVE' ? 'active' : 'expired'
      })
      .eq('id', clientId)
      .select();

    if (error) {
      console.error('❌ Supabase Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      updated: data
    });

  } catch (err: any) {
    console.error('🔥 API Route Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
