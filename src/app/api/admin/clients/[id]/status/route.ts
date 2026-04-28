import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// --- 🔐 SERVICE ROLE KEY DECODER (Base64 Fix) ---
const getServiceRoleKey = () => {
  const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
  if (!b64Key) throw new Error("SUPABASE_SERVICE_ROLE_KEY_B64 missing");
  
  if (b64Key.startsWith('eyJ')) return b64Key; // Pehle se decoded hai
  return Buffer.from(b64Key, 'base64').toString('utf-8').trim(); // B64 se decode karo
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(
  req: NextRequest,
  context: any
) {
  try {
    // ✅ FIX 1: Params ko safely handle karein (Next.js 14/15 stability)
    const params = await context.params; 
    const clientId = params.id;

    const body = await req.json();
    const { action } = body;

    if (!clientId || !action) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400, headers: corsHeaders });
    }

    const serviceKey = getServiceRoleKey();
    
    // Initialize Supabase only inside handler to avoid global init issues
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    );

    // ✅ SAHI LOGIC: Ab ye teeno cases handle karega
    let newStatus: 'ACTIVE' | 'LOCKED' | 'EXPIRED';

    if (action === 'LOCK') {
      newStatus = 'LOCKED';
    } else if (action === 'EXPIRE') {
      newStatus = 'EXPIRED';
    } else if (action === 'ACTIVATE' || action === 'UNLOCK') {
      newStatus = 'ACTIVE'; // 👈 Ye missing tha, isliye 400 aa raha tha
    } else {
      return NextResponse.json({ error: 'Invalid action: ' + action }, { status: 400, headers: corsHeaders });
    }

    // ✅ DATABASE UPDATE (Bypassing RLS with Service Role Key)
    const { data, error: dbError } = await supabaseAdmin
      .from('clients')
      .update({ 
        status: newStatus,
        subscription_status: newStatus === 'ACTIVE' ? 'active' : 'expired'
      })
      .eq('id', clientId)
      .select();

    if (dbError) {
      console.error('❌ Supabase Error:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      updated: data
    });

  } catch (err: any) {
    console.error('🔥 API Route Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
